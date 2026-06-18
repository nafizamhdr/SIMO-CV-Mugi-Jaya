import { z } from "zod";

/**
 * Validasi input Modul QC (FR-04, FR-05, FR-06, FR-12).
 */

const range = z.tuple([z.number(), z.number()]);

export const dimensionsSchema = z.object({
  actual: z.object({ p: z.number(), l: z.number(), t: z.number() }),
  tolerance: z.object({ p: range, l: range, t: range }),
});

export const createRecordSchema = z.object({
  workItemId: z.string().min(1, "workItemId wajib diisi"),
  specificationId: z.string().min(1, "specificationId wajib diisi"),
  dimensions: dimensionsSchema,
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = z.object({
  dimensions: dimensionsSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const createSpecSchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi"),
  title: z.string().min(1, "Judul spesifikasi wajib diisi"),
  version: z.string().optional(),
});

export const ncItemSchema = z.object({
  qcRecordId: z.string().min(1, "qcRecordId wajib diisi"),
  defectDesc: z.string().min(1, "Deskripsi cacat wajib diisi"),
  picRework: z.string().min(1, "PIC rework wajib diisi"),
  estimatedDone: z.string().min(1, "Estimasi selesai wajib diisi"),
});

export const certificateSchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi"),
  batchIds: z.array(z.string().min(1)).min(1, "Minimal 1 work item dalam batch"),
});

export type DimensionsInput = z.infer<typeof dimensionsSchema>;
