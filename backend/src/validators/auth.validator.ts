import { z } from "zod";

/**
 * Input schemas for auth endpoints. Validated with Zod before touching Prisma.
 */
export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  // Role yang dipilih di form login — divalidasi harus cocok dengan role akun.
  role: z
    .enum(["OWNER", "KEPALA_PRODUKSI", "MANDOR", "INSPECTOR_QC", "SUPERVISOR_LAPANGAN", "ADMIN_OPERASIONAL"])
    .optional(),
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
