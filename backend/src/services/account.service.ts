import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Role, AuthTokenPurpose } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { HttpError } from "../utils/apiResponse";

/**
 * Account lifecycle — undangan user, terima undangan, lupa & reset password.
 * Token disimpan sebagai hash SHA-256, sekali pakai, dan punya masa berlaku.
 * (Email disimulasikan.)
 */

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:5173";
const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72 jam
const RESET_TTL_MS = 30 * 60 * 1000; // 30 menit

// Di production, tautan berisi token TIDAK boleh dikembalikan ke pemanggil
// (mencegah account takeover). Email sebenarnya yang mengirim tautan; di sini
// hanya di-log. Di dev/demo, tautan disertakan agar alur bisa diuji tanpa email.
const EXPOSE_LINK = process.env.NODE_ENV !== "production";

function deliverLink(kind: string, email: string, url: string): string | undefined {
  if (EXPOSE_LINK) return url;
  logger.info(`[${kind}] tautan untuk ${email} dibuat (dikirim via email)`);
  return undefined;
}

function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

function hashOf(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function issueToken(userId: string, purpose: AuthTokenPurpose, ttlMs: number) {
  // Batalkan token aktif sebelumnya untuk tujuan yang sama.
  await prisma.authToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });
  const { raw, hash } = generateToken();
  await prisma.authToken.create({
    data: { userId, purpose, tokenHash: hash, expiresAt: new Date(Date.now() + ttlMs) },
  });
  return raw;
}

async function consumeToken(raw: string, purpose: AuthTokenPurpose) {
  const token = await prisma.authToken.findUnique({ where: { tokenHash: hashOf(raw) }, include: { user: true } });
  if (!token || token.purpose !== purpose || token.usedAt || token.expiresAt < new Date()) {
    throw new HttpError(400, "Token tidak valid atau sudah kedaluwarsa");
  }
  return token;
}

// --- Invite (OWNER) ---
export async function inviteUser(input: { name: string; email: string; role: Role }, actorId: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(400, "Email sudah terdaftar");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      password: "", // diisi saat accept invite
      isActive: false,
      status: "INVITED",
    },
  });
  const raw = await issueToken(user.id, "INVITE", INVITE_TTL_MS);
  await prisma.auditLog.create({
    data: { userId: actorId, action: "INVITE_USER", entity: "User", entityId: user.id, after: { email: user.email, role: user.role } },
  });

  const inviteUrl = deliverLink("INVITE", user.email, `${APP_BASE_URL}/accept-invite?token=${raw}`);
  return { user: { id: user.id, name: user.name, email: user.email }, inviteUrl };
}

export async function resendInvite(userId: string, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Pengguna tidak ditemukan");
  if (user.status !== "INVITED") throw new HttpError(400, "Akun sudah aktif");
  const raw = await issueToken(user.id, "INVITE", INVITE_TTL_MS);
  await prisma.auditLog.create({ data: { userId: actorId, action: "RESEND_INVITE", entity: "User", entityId: user.id } });
  return { inviteUrl: deliverLink("INVITE", user.email, `${APP_BASE_URL}/accept-invite?token=${raw}`) };
}

export async function verifyInvite(raw: string) {
  const token = await consumeToken(raw, "INVITE");
  return { email: token.user.email, name: token.user.name };
}

export async function acceptInvite(raw: string, password: string) {
  const token = await consumeToken(raw, "INVITE");
  const hash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { password: hash, isActive: true, status: "ACTIVE", tokenVersion: { increment: 1 } },
    }),
    prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: token.userId, action: "ACCEPT_INVITE", entity: "User", entityId: token.userId } }),
  ]);
}

// --- Forgot / Reset password (public) ---
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Anti user-enumeration: selalu balas generik. URL hanya untuk demo bila akun ada.
  if (!user || !user.isActive || user.status === "INVITED") {
    return { message: "Bila email terdaftar, tautan reset telah dikirim." };
  }
  const raw = await issueToken(user.id, "RESET", RESET_TTL_MS);
  await prisma.auditLog.create({ data: { userId: user.id, action: "FORGOT_PASSWORD_REQUESTED", entity: "User", entityId: user.id } });
  return {
    message: "Bila email terdaftar, tautan reset telah dikirim.",
    resetUrl: deliverLink("RESET", user.email, `${APP_BASE_URL}/reset-password?token=${raw}`),
  };
}

export async function resetPassword(raw: string, newPassword: string) {
  const token = await consumeToken(raw, "RESET");
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { password: hash, tokenVersion: { increment: 1 } } }),
    prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: token.userId, action: "RESET_PASSWORD_COMPLETED", entity: "User", entityId: token.userId } }),
  ]);
}
