import { api, unwrap } from "./api";
import type { ApiSuccess, QCRecord, Specification } from "../types";

/**
 * Modul QC API (PIC: Regian). Endpoint diimplementasikan pada Sprint 4.
 */
export async function getSpecifications(projectId?: string): Promise<Specification[]> {
  const { data } = await api.get<ApiSuccess<Specification[]>>("/qc/specifications", {
    params: projectId ? { projectId } : undefined,
  });
  return unwrap(data);
}

export async function getQCRecords(): Promise<QCRecord[]> {
  const { data } = await api.get<ApiSuccess<QCRecord[]>>("/qc/records");
  return unwrap(data);
}
