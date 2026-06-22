import { api, unwrap } from "./api";
import type { ApiSuccess } from "../types";

/**
 * Audit Trail API (PIC: Regian) — log aktivitas lintas modul.
 */
export interface AuditLogDto {
  id: string;
  createdAt: string;
  user: string;
  action: string;
  category: "Produksi" | "QC" | "Logistik" | "Akses";
  entity: string;
  before: unknown;
  after: unknown;
}

export async function getAuditLogs(category?: string, date?: string): Promise<AuditLogDto[]> {
  const params: Record<string, string> = {};
  if (category && category !== "all") params.category = category;
  if (date) params.date = date;
  const { data } = await api.get<ApiSuccess<AuditLogDto[]>>("/audit", { params });
  return unwrap(data);
}
