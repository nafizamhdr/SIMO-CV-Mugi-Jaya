import type { Request } from "express";

/**
 * Role keys — must match the `Role` enum in prisma/schema.prisma (RBAC table).
 */
export type Role =
  | "OWNER"
  | "KEPALA_PRODUKSI"
  | "MANDOR"
  | "INSPECTOR_QC"
  | "ADMIN_OPERASIONAL"
  | "SUPER_ADMIN";

/**
 * Decoded JWT payload attached to authenticated requests.
 */
export interface AuthPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
  tokenVersion?: number; // dicocokkan dengan DB; mismatch -> sesi ditolak
}

/**
 * Express request carrying the authenticated user (set by authenticateJWT).
 */
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

/**
 * Standard API response envelopes.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}
