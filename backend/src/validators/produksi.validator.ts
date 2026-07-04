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

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  startDate: z.string().datetime({ message: "Format tanggal mulai tidak valid (ISO)" }),
  endDate: z.string().datetime({ message: "Format tanggal selesai tidak valid (ISO)" }).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  startDate: z.string().datetime({ message: "Format tanggal mulai tidak valid (ISO)" }).optional(),
  endDate: z.string().datetime({ message: "Format tanggal selesai tidak valid (ISO)" }).nullable().optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Nama warehouse wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  mandorId: z.string().min(1, "Mandor wajib dipilih"),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  mandorId: z.string().min(1).optional(),
});

export const createWorkItemSchema = z.object({
  name: z.string().min(1, "Nama pekerjaan wajib diisi"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Proyek wajib dipilih"),
  warehouseId: z.string().min(1, "Warehouse wajib dipilih"),
  assigneeId: z.string().optional(),
});
