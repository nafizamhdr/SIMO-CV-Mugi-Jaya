import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthPayload, AuthRequest } from "../types";
import { sendError } from "../utils/apiResponse";

/**
 * Verifies the JWT access token from the Authorization header (Bearer scheme)
 * and attaches the decoded payload to `req.user`.
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): void {
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

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    sendError(res, "Token tidak valid atau telah kedaluwarsa", 401);
  }
}
