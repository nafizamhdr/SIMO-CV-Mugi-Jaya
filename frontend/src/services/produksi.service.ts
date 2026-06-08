import { api, unwrap } from "./api";
import type { ApiSuccess, Warehouse, WorkItem } from "../types";

/**
 * Modul Produksi API (PIC: Nafiza). Endpoint diimplementasikan pada Sprint 3.
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  const { data } = await api.get<ApiSuccess<Warehouse[]>>("/produksi/warehouses");
  return unwrap(data);
}

export async function getWorkItems(warehouseId: string): Promise<WorkItem[]> {
  const { data } = await api.get<ApiSuccess<WorkItem[]>>("/produksi/work-items", {
    params: { warehouseId },
  });
  return unwrap(data);
}
