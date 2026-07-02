import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";

/**
 * Manajemen Akun (khusus OWNER) — logika bisnis.
 * Akun tidak pernah dihapus permanen; hanya dinonaktifkan (isActive=false)
 * agar relasi data & jejak audit tetap utuh.
 */

const SALT_ROUNDS = 12;

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({ select: publicSelect, orderBy: { createdAt: "asc" } });
}

export async function createUser(
  input: { name: string; email: string; password: string; role: Role },
  actorId: string,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(400, "Email sudah terdaftar");

  const password = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, password, role: input.role },
      select: publicSelect,
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "CREATE_USER",
        entity: "User",
        entityId: user.id,
        after: { name: user.name, email: user.email, role: user.role },
      },
    });
    return user;
  });
}

/** Pastikan aksi tidak menghilangkan OWNER aktif terakhir (agar sistem tak terkunci). */
async function assertNotLastActiveOwner(targetId: string, changes: { role?: Role; isActive?: boolean }) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new HttpError(404, "Pengguna tidak ditemukan");

  const losesOwner =
    target.role === "OWNER" &&
    ((changes.role && changes.role !== "OWNER") || changes.isActive === false);

  if (losesOwner) {
    const activeOwners = await prisma.user.count({ where: { role: "OWNER", isActive: true } });
    if (activeOwners <= 1) {
      throw new HttpError(400, "Tidak dapat menonaktifkan/mengubah OWNER aktif terakhir");
    }
  }
  return target;
}

export async function updateUser(
  targetId: string,
  input: { name?: string; role?: Role; isActive?: boolean },
  actorId: string,
) {
  if (targetId === actorId && input.isActive === false) {
    throw new HttpError(400, "Anda tidak dapat menonaktifkan akun sendiri");
  }
  const before = await assertNotLastActiveOwner(targetId, input);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: targetId }, data: input, select: publicSelect });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "UPDATE_USER",
        entity: "User",
        entityId: targetId,
        before: { name: before.name, role: before.role, isActive: before.isActive },
        after: { name: user.name, role: user.role, isActive: user.isActive },
      },
    });
    return user;
  });
}

export async function resetPassword(targetId: string, newPassword: string, actorId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new HttpError(404, "Pengguna tidak ditemukan");

  const password = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetId }, data: { password } }),
    prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "RESET_USER_PASSWORD",
        entity: "User",
        entityId: targetId,
        after: { email: target.email },
      },
    }),
  ]);
}
