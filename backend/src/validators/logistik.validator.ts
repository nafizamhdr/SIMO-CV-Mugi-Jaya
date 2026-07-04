import { z } from "zod";

/**
 * Validasi input Modul Logistik (FR-07..FR-11).
 */

// FR-07 — Vendor (AVL)
export const createVendorSchema = z.object({
  name: z.string().min(1, "Nama vendor wajib diisi"),
  contact: z.string().min(1, "Kontak wajib diisi"),
  licenseNo: z.string().min(1, "No. lisensi wajib diisi"),
  rating: z.number().min(0).max(5).optional(),
  isApproved: z.boolean().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  rating: z.number().min(0).max(5).optional(),
  isApproved: z.boolean().optional(),
});

// FR-08 — Manifest / Shipment
export const createShipmentSchema = z.object({
  projectId: z.string().min(1, "projectId wajib diisi"),
  vendorId: z.string().min(1, "vendorId wajib diisi"),
  qcCertificateId: z.string().min(1, "QC Certificate wajib ada sebelum pengiriman"),
  driverName: z.string().min(1, "Nama driver wajib diisi"),
  vehicleNo: z.string().min(1, "No. kendaraan wajib diisi"),
  insurancePolis: z.string().min(1, "No. polis asuransi wajib diisi"),
});

// FR-09 — Tracking
export const trackingSchema = z.object({
  shipmentId: z.string().min(1, "shipmentId wajib diisi"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(400).optional(),
});

// FR-11 — Check-in manual
export const checkinSchema = z.object({
  shipmentId: z.string().min(1, "shipmentId wajib diisi"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  note: z.string().max(300).optional(),
});
