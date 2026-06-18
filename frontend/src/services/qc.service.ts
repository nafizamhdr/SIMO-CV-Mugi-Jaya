import { api, unwrap } from "./api";
import type { ApiSuccess, QCStatus } from "../types";

/**
 * Modul QC API (PIC: Regian) — FR-04, FR-05, FR-06, FR-12.
 */

export interface ProjectDto {
  id: string;
  name: string;
  location: string;
}

export interface SpecificationDto {
  id: string;
  projectId: string;
  title: string;
  version: string;
  fileUrl: string;
  uploadedAt: string;
  project?: { id: string; name: string };
}

export interface InspectionItemDto {
  id: string;
  name: string;
  qcStatus: QCStatus | null;
  qcRecordId: string | null;
  photoUrl: string | null;
}

export interface CertificateDto {
  id: string;
  certNumber: string;
  projectId: string;
  batchIds: string[];
  issuedAt: string;
}

export interface Dimensions {
  actual: { p: number; l: number; t: number };
  tolerance: { p: [number, number]; l: [number, number]; t: [number, number] };
}

export async function getProjects(): Promise<ProjectDto[]> {
  const { data } = await api.get<ApiSuccess<ProjectDto[]>>("/qc/projects");
  return unwrap(data);
}

export async function getInspectionItems(projectId: string): Promise<InspectionItemDto[]> {
  const { data } = await api.get<ApiSuccess<InspectionItemDto[]>>("/qc/work-items", { params: { projectId } });
  return unwrap(data);
}

export async function createRecord(input: {
  workItemId: string;
  specificationId: string;
  dimensions: Dimensions;
  notes?: string;
  photo?: File | null;
}): Promise<{ id: string; status: QCStatus }> {
  const form = new FormData();
  form.append("workItemId", input.workItemId);
  form.append("specificationId", input.specificationId);
  form.append("dimensions", JSON.stringify(input.dimensions));
  if (input.notes) form.append("notes", input.notes);
  if (input.photo) form.append("photo", input.photo);
  const { data } = await api.post<ApiSuccess<{ id: string; status: QCStatus }>>("/qc/records", form);
  return unwrap(data);
}

export async function createNCItem(input: {
  qcRecordId: string;
  defectDesc: string;
  picRework: string;
  estimatedDone: string;
}): Promise<unknown> {
  const { data } = await api.post<ApiSuccess<unknown>>("/qc/nc-items", input);
  return unwrap(data);
}

export async function getSpecifications(projectId?: string): Promise<SpecificationDto[]> {
  const { data } = await api.get<ApiSuccess<SpecificationDto[]>>("/qc/specifications", {
    params: projectId ? { projectId } : undefined,
  });
  return unwrap(data);
}

export async function uploadSpecification(input: {
  projectId: string;
  title: string;
  version?: string;
  file: File;
}): Promise<SpecificationDto> {
  const form = new FormData();
  form.append("projectId", input.projectId);
  form.append("title", input.title);
  if (input.version) form.append("version", input.version);
  form.append("file", input.file);
  const { data } = await api.post<ApiSuccess<SpecificationDto>>("/qc/specifications", form);
  return unwrap(data);
}

export async function getCertificates(): Promise<CertificateDto[]> {
  const { data } = await api.get<ApiSuccess<CertificateDto[]>>("/qc/certificates");
  return unwrap(data);
}

export async function issueCertificate(projectId: string, batchIds: string[]): Promise<CertificateDto> {
  const { data } = await api.post<ApiSuccess<CertificateDto>>("/qc/certificates", { projectId, batchIds });
  return unwrap(data);
}
