import { api, unwrap, ACCESS_TOKEN_KEY } from "./api";
import type { ApiSuccess } from "../types";

/**
 * Report Center API (Owner & Kepala Produksi).
 */
export interface ReportTypeInfo {
  type: string;
  label: string;
}

export interface ReportPreview {
  type: string;
  title: string;
  columns: string[];
  rows: string[][];
  totalRows: number;
  summary: { label: string; value: string | number }[];
  generatedAt: string;
}

export async function getReportTypes(): Promise<ReportTypeInfo[]> {
  const { data } = await api.get<ApiSuccess<ReportTypeInfo[]>>("/reports/types");
  return unwrap(data);
}

export async function getReportPreview(type: string, start?: string, end?: string): Promise<ReportPreview> {
  const { data } = await api.get<ApiSuccess<ReportPreview>>(`/reports/${type}/preview`, {
    params: { start: start || undefined, end: end || undefined },
  });
  return unwrap(data);
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

/**
 * Unduh file export (CSV/PDF). Karena butuh header Authorization,
 * kita fetch sebagai blob lalu picu unduhan.
 */
export async function downloadReport(type: string, format: "csv" | "pdf", start?: string, end?: string): Promise<void> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const qs = new URLSearchParams();
  if (start) qs.set("start", start);
  if (end) qs.set("end", end);
  const url = `${API_BASE}/reports/${type}/export.${format}?${qs.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Gagal mengunduh laporan");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `laporan-${type}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
