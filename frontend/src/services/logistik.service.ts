import { api, unwrap } from "./api";
import type { ApiSuccess, Shipment, Vendor } from "../types";

/**
 * Modul Logistik API (PIC: Redomas). Endpoint diimplementasikan pada Sprint 5.
 */
export async function getVendors(): Promise<Vendor[]> {
  const { data } = await api.get<ApiSuccess<Vendor[]>>("/logistik/vendors");
  return unwrap(data);
}

export async function getShipments(): Promise<Shipment[]> {
  const { data } = await api.get<ApiSuccess<Shipment[]>>("/logistik/shipments");
  return unwrap(data);
}
