import { z } from "zod";

/**
 * Validasi input Manajemen Akun (khusus OWNER).
 */

const roleEnum = z.enum([
  "OWNER",
  "KEPALA_PRODUKSI",
  "MANDOR",
  "INSPECTOR_QC",
  "ADMIN_OPERASIONAL",
  "SUPER_ADMIN",
]);

export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});
