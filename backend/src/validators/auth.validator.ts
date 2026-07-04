import { z } from "zod";

/**
 * Input schemas for auth endpoints. Validated with Zod before touching Prisma.
 */
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  // Role yang dipilih di form login — divalidasi harus cocok dengan role akun.
  role: z
    .enum(["OWNER", "KEPALA_PRODUKSI", "MANDOR", "INSPECTOR_QC", "ADMIN_OPERASIONAL", "SUPER_ADMIN"])
    .optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
