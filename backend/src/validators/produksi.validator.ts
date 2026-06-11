import { z } from "zod";

/**
 * Validasi input Modul Produksi (FR-01).
 */
export const updateStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"], {
    errorMap: () => ({ message: "Status harus TODO, IN_PROGRESS, atau DONE" }),
  }),
  notes: z.string().max(500).optional(),
});

export const listWorkItemsSchema = z.object({
  warehouseId: z.string().min(1, "warehouseId wajib diisi"),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
