import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";
import { HttpError } from "../utils/apiResponse";
import type { AuthPayload, Role } from "../types";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends TokenPair {
  user: { id: string; name: string; email: string; role: Role };
}

function signTokens(payload: AuthPayload): TokenPair {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new HttpError(500, "Konfigurasi JWT tidak lengkap");
  }

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ sub: payload.sub }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

const refreshKey = (userId: string) => `refresh:${userId}`;

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  try {
    await redis.set(refreshKey(userId), token, "EX", 7 * 24 * 60 * 60);
  } catch (error) {
    // Cache is best-effort; failure should not block authentication.
    logger.warn("Gagal menyimpan refresh token di Redis", error);
  }
}

/**
 * Validate credentials and issue a JWT token pair.
 * Bila `expectedRole` diberikan (dari dropdown form login), role akun harus cocok.
 */
export async function login(email: string, password: string, expectedRole?: Role): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, "Email atau kata sandi salah");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new HttpError(401, "Email atau kata sandi salah");
  }

  if (!user.isActive) {
    throw new HttpError(403, "Akun Anda telah dinonaktifkan. Hubungi pemilik.");
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new HttpError(401, "Role yang dipilih tidak sesuai dengan akun Anda");
  }

  const payload: AuthPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };

  const tokens = signTokens(payload);
  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    ...tokens,
    user: { id: user.id, name: user.name, email: user.email, role: user.role as Role },
  };
}

/**
 * Issue a new access token from a valid refresh token.
 */
export async function refresh(refreshToken: string): Promise<TokenPair> {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new HttpError(500, "Konfigurasi JWT tidak lengkap");
  }

  let userId: string;
  try {
    const decoded = jwt.verify(refreshToken, refreshSecret) as { sub: string };
    userId = decoded.sub;
  } catch {
    throw new HttpError(401, "Refresh token tidak valid atau kedaluwarsa");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, "Pengguna tidak ditemukan");
  }
  if (!user.isActive) {
    throw new HttpError(403, "Akun Anda telah dinonaktifkan. Hubungi pemilik.");
  }

  const payload: AuthPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };

  const tokens = signTokens(payload);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

/**
 * Invalidate a refresh token (logout).
 */
export async function logout(refreshToken: string): Promise<void> {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) return;

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret) as { sub: string };
    await redis.del(refreshKey(decoded.sub));
  } catch (error) {
    logger.warn("Logout dengan refresh token tidak valid", error);
  }
}
