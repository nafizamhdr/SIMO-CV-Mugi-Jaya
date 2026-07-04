import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { AuthPayload, AuthRequest, Role } from "../types";
import { sendError } from "../utils/apiResponse";

/**
 * Verifies the JWT access token, lalu memvalidasi ulang ke database:
 * akun harus aktif dan tokenVersion cocok (untuk mendukung pencabutan sesi
 * saat ganti/reset password). Role & status diambil dari DB (selalu terkini).
 */
export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    sendError(res, "Token autentikasi tidak ditemukan", 401);
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    sendError(res, "Konfigurasi server tidak valid", 500);
    return;
  }

  let decoded: AuthPayload;
  try {
    decoded = jwt.verify(token, secret) as AuthPayload;
  } catch {
    sendError(res, "Token tidak valid atau telah kedaluwarsa", 401);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true, tokenVersion: true },
    });

    if (!user || !user.isActive) {
      sendError(res, "Akun tidak aktif atau tidak ditemukan", 401);
      return;
    }
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      sendError(res, "Sesi telah berakhir (kata sandi diubah). Silakan masuk kembali.", 401);
      return;
    }

    req.user = { sub: user.id, name: user.name, email: user.email, role: user.role as Role, tokenVersion: user.tokenVersion };
    next();
  } catch {
    sendError(res, "Gagal memvalidasi sesi", 500);
  }
}
