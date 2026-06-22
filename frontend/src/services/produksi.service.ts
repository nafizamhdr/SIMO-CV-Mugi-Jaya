import { api, unwrap } from "./api";
import type { ApiSuccess, WorkItemStatus } from "../types";

/**
 * Modul Produksi API (PIC: Nafiza) — FR-01 & FR-02.
 */

export interface WarehouseDto {
  id: string;
  name: string;
  location: string;
  mandorId: string;
  mandor?: { id: string; name: string };
}

export interface WorkItemDto {
  id: string;
  name: string;
  description: string | null;
  status: WorkItemStatus;
  projectId: string;
  warehouseId: string;
  photoUrl: string | null;
  updatedAt: string;
  project?: { id: string; name: string };
}

export interface StatDto {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  progress: number;
}

export interface DashboardDto {
  summary: StatDto;
  projects: (StatDto & { id: string; name: string; location: string })[];
  warehouses: (StatDto & { id: string; name: string })[];
}

export async function getWarehouses(): Promise<WarehouseDto[]> {
  const { data } = await api.get<ApiSuccess<WarehouseDto[]>>("/produksi/warehouses");
  return unwrap(data);
}

export async function getWorkItems(warehouseId: string): Promise<WorkItemDto[]> {
  const { data } = await api.get<ApiSuccess<WorkItemDto[]>>("/produksi/work-items", {
    params: { warehouseId },
  });
  return unwrap(data);
}

export async function updateWorkItemStatus(
  id: string,
  status: WorkItemStatus,
  photo?: File | null,
): Promise<WorkItemDto> {
  const form = new FormData();
  form.append("status", status);
  if (photo) form.append("photo", photo);
  const { data } = await api.patch<ApiSuccess<WorkItemDto>>(
    `/produksi/work-items/${id}/status`,
    form,
  );
  return unwrap(data);
}

export async function getDashboard(): Promise<DashboardDto> {
  const { data } = await api.get<ApiSuccess<DashboardDto>>("/produksi/dashboard");
  return unwrap(data);
}

export interface LateItemDto {
  id: string;
  name: string;
  status: WorkItemStatus;
  warehouse: string;
  project: string;
  hoursLate: number;
}

/** FR-03 — notifikasi keterlambatan produksi. */
export async function getNotifications(thresholdHours = 48): Promise<LateItemDto[]> {
  const { data } = await api.get<ApiSuccess<LateItemDto[]>>("/produksi/notifications", {
    params: { thresholdHours },
  });
  return unwrap(data);
}
