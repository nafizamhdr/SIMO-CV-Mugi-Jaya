import { api, unwrap } from "./api";
import type { ApiSuccess, ShipmentStatus } from "../types";

/**
 * Modul Logistik API (PIC: Redomas) — FR-07..FR-11.
 */

export interface VendorDto {
  id: string;
  name: string;
  contact: string;
  licenseNo: string;
  rating: number;
  isApproved: boolean;
}

export interface ShipmentDto {
  id: string;
  projectId: string;
  vendorId: string;
  qcCertificateId: string | null;
  driverName: string;
  vehicleNo: string;
  insurancePolis: string;
  status: ShipmentStatus;
  departedAt: string | null;
  arrivedAt: string | null;
  vendor?: { id: string; name: string };
  project?: { id: string; name: string };
  qcCertificate?: { id: string; certNumber: string };
  trackingLogs?: { lat: number; lng: number; isAnomaly: boolean; loggedAt: string }[];
}

export interface CertOptionDto {
  id: string;
  certNumber: string;
  projectId: string;
}

export async function getVendors(): Promise<VendorDto[]> {
  const { data } = await api.get<ApiSuccess<VendorDto[]>>("/logistik/vendors");
  return unwrap(data);
}

export async function createVendor(input: {
  name: string;
  contact: string;
  licenseNo: string;
  rating?: number;
  isApproved?: boolean;
}): Promise<VendorDto> {
  const { data } = await api.post<ApiSuccess<VendorDto>>("/logistik/vendors", input);
  return unwrap(data);
}

export async function updateVendor(id: string, input: Partial<VendorDto>): Promise<VendorDto> {
  const { data } = await api.patch<ApiSuccess<VendorDto>>(`/logistik/vendors/${id}`, input);
  return unwrap(data);
}

export async function getShipments(): Promise<ShipmentDto[]> {
  const { data } = await api.get<ApiSuccess<ShipmentDto[]>>("/logistik/shipments");
  return unwrap(data);
}

export async function getAvailableCertificates(): Promise<CertOptionDto[]> {
  const { data } = await api.get<ApiSuccess<CertOptionDto[]>>("/logistik/certificates/available");
  return unwrap(data);
}

export async function createShipment(input: {
  projectId: string;
  vendorId: string;
  qcCertificateId: string;
  driverName: string;
  vehicleNo: string;
  insurancePolis: string;
}): Promise<ShipmentDto> {
  const { data } = await api.post<ApiSuccess<ShipmentDto>>("/logistik/shipments", input);
  return unwrap(data);
}

export async function postTracking(input: {
  shipmentId: string;
  lat: number;
  lng: number;
  speed?: number;
}): Promise<{ anomaly: boolean }> {
  const { data } = await api.post<ApiSuccess<{ anomaly: boolean }>>("/logistik/tracking", input);
  return unwrap(data);
}

export async function postCheckin(shipmentId: string, note?: string): Promise<unknown> {
  const { data } = await api.post<ApiSuccess<unknown>>("/logistik/checkin", { shipmentId, note });
  return unwrap(data);
}
