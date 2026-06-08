import { z } from "zod";

/**
 * Input schemas for auth endpoints. Validated with Zod before touching Prisma.
 */
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
