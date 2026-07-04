import crypto from "crypto";
import { ShipmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/apiResponse";
import { isOffRoute, ORIGIN_BEKASI, type GeoPoint } from "../utils/businessRules";

/**
 * Modul Logistik — logika bisnis (PIC: Redomas).
 */

// --- FR-07 Vendor (AVL) ---

export async function listVendors() {
  return prisma.vendor.findMany({ orderBy: { rating: "desc" } });
}

export async function createVendor(input: {
  name: string;
  contact: string;
  licenseNo: string;
  rating?: number;
  isApproved?: boolean;
}) {
  return prisma.vendor.create({ data: input });
}

export async function updateVendor(id: string, input: Record<string, unknown>) {
  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Vendor tidak ditemukan");
  return prisma.vendor.update({ where: { id }, data: input });
}

// --- FR-08 Manifest / Shipment ---

export async function listShipments() {
  return prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      qcCertificate: { select: { id: true, certNumber: true } },
      trackingLogs: { orderBy: { loggedAt: "desc" }, take: 1 },
    },
  });
}

export async function createShipment(input: {
  projectId: string;
  vendorId: string;
  qcCertificateId: string;
  driverName: string;
  vehicleNo: string;
  insurancePolis: string;
  origin?: string;
  originLat?: number;
  originLng?: number;
  destination: string;
  destLat?: number;
  destLng?: number;
  userId: string;
}) {
  // FR-08: pengiriman WAJIB punya QC Certificate yang valid.
  const cert = await prisma.qCCertificate.findUnique({ where: { id: input.qcCertificateId } });
  if (!cert) throw new HttpError(400, "QC Certificate tidak ditemukan — pengiriman tidak diizinkan");

  // QC Certificate tidak boleh dipakai dua kali.
  const used = await prisma.shipment.findUnique({ where: { qcCertificateId: input.qcCertificateId } });
  if (used) throw new HttpError(400, "QC Certificate sudah dipakai pada pengiriman lain");

  // Vendor wajib sudah di-approve (masuk AVL).
  const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
  if (!vendor) throw new HttpError(404, "Vendor tidak ditemukan");
  if (!vendor.isApproved) throw new HttpError(400, "Vendor belum disetujui (belum masuk AVL)");

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        projectId: input.projectId,
        vendorId: input.vendorId,
        qcCertificateId: input.qcCertificateId,
        createdById: input.userId,
        driverName: input.driverName,
        vehicleNo: input.vehicleNo,
        insurancePolis: input.insurancePolis,
        origin: input.origin ?? "Gudang CV Mugi Jaya, Bekasi",
        originLat: input.originLat ?? ORIGIN_BEKASI.lat,
        originLng: input.originLng ?? ORIGIN_BEKASI.lng,
        destination: input.destination,
        destLat: input.destLat ?? null,
        destLng: input.destLng ?? null,
        status: ShipmentStatus.DISPATCHED,
        trackingToken: crypto.randomUUID(),
        departedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: input.userId,
        action: "CREATE_SHIPMENT",
        entity: "Shipment",
        entityId: shipment.id,
        after: { status: shipment.status, vendorId: input.vendorId },
      },
    });
    return shipment;
  });
}

// --- FR-09 Tracking + FR-10 Geofencing (isOutsideRoute di utils/businessRules) ---

/** (Re)generate tracking token sebuah pengiriman (admin). */
export async function regenerateTrackingToken(shipmentId: string) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");
  const token = crypto.randomUUID();
  await prisma.shipment.update({ where: { id: shipmentId }, data: { trackingToken: token } });
  return { trackingToken: token };
}

/** Ambil info pengiriman untuk halaman driver — divalidasi via tracking token. */
export async function getDriverShipment(shipmentId: string, token: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { project: { select: { name: true } }, vendor: { select: { name: true } } },
  });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");
  if (!shipment.trackingToken || shipment.trackingToken !== token) {
    throw new HttpError(403, "Token pelacakan tidak valid");
  }
  return {
    id: shipment.id,
    driverName: shipment.driverName,
    vehicleNo: shipment.vehicleNo,
    status: shipment.status,
    project: shipment.project.name,
    vendor: shipment.vendor.name,
  };
}

/** Driver mengirim posisi GPS — divalidasi via tracking token (tanpa login). */
export async function driverPostLocation(shipmentId: string, token: string, lat: number, lng: number, speed?: number) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");
  if (!shipment.trackingToken || shipment.trackingToken !== token) {
    throw new HttpError(403, "Token pelacakan tidak valid");
  }
  return recordTracking({ shipmentId, lat, lng, speed });
}

/** Riwayat posisi (TrackingLog) sebuah pengiriman — untuk peta live. */
export async function getTrackingHistory(shipmentId: string) {
  const logs = await prisma.trackingLog.findMany({
    where: { shipmentId },
    orderBy: { loggedAt: "asc" },
    take: 200,
  });
  return logs.map((l) => ({
    lat: l.lat,
    lng: l.lng,
    speed: l.speed,
    isAnomaly: l.isAnomaly,
    loggedAt: l.loggedAt,
  }));
}

export async function recordTracking(input: { shipmentId: string; lat: number; lng: number; speed?: number }) {
  const shipment = await prisma.shipment.findUnique({ where: { id: input.shipmentId } });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");

  const origin: GeoPoint =
    shipment.originLat != null && shipment.originLng != null
      ? { lat: shipment.originLat, lng: shipment.originLng }
      : ORIGIN_BEKASI;
  const dest =
    shipment.destLat != null && shipment.destLng != null
      ? { lat: shipment.destLat, lng: shipment.destLng }
      : null;
  const anomaly = isOffRoute(input.lat, input.lng, dest, origin);

  const log = await prisma.trackingLog.create({
    data: {
      shipmentId: input.shipmentId,
      lat: input.lat,
      lng: input.lng,
      speed: input.speed,
      isAnomaly: anomaly,
    },
  });

  // FR-10: tandai ANOMALY saat keluar rute, dan PULIHKAN saat kembali ke rute.
  const isDelivered = shipment.status === ShipmentStatus.DELIVERED;
  if (anomaly && shipment.status !== ShipmentStatus.ANOMALY) {
    await prisma.$transaction([
      prisma.shipment.update({ where: { id: input.shipmentId }, data: { status: ShipmentStatus.ANOMALY } }),
      prisma.auditLog.create({
        data: {
          userId: shipment.createdById,
          action: "GEOFENCE_ANOMALY",
          entity: "Shipment",
          entityId: input.shipmentId,
          after: { lat: input.lat, lng: input.lng },
        },
      }),
    ]);
  } else if (!anomaly && shipment.status === ShipmentStatus.ANOMALY && !isDelivered) {
    // Armada kembali ke koridor rute → pulihkan status.
    await prisma.$transaction([
      prisma.shipment.update({ where: { id: input.shipmentId }, data: { status: ShipmentStatus.IN_TRANSIT } }),
      prisma.auditLog.create({
        data: {
          userId: shipment.createdById,
          action: "GEOFENCE_RECOVERED",
          entity: "Shipment",
          entityId: input.shipmentId,
          after: { lat: input.lat, lng: input.lng },
        },
      }),
    ]);
  }

  return { log, anomaly };
}

/**
 * Hitung ulang status anomali seluruh pengiriman aktif dari posisi terakhirnya
 * memakai geofencing route-aware terbaru. Menyembuhkan anomali "nyangkut" dari
 * logika lama. Mengembalikan jumlah pengiriman yang statusnya diperbaiki.
 */
export async function reconcileAnomalies(): Promise<number> {
  const shipments = await prisma.shipment.findMany({
    where: { status: { not: ShipmentStatus.DELIVERED } },
    include: { trackingLogs: { orderBy: { loggedAt: "desc" }, take: 1 } },
  });

  let fixed = 0;
  for (const s of shipments) {
    const last = s.trackingLogs[0];
    const dest = s.destLat != null && s.destLng != null ? { lat: s.destLat, lng: s.destLng } : null;
    const origin: GeoPoint = s.originLat != null && s.originLng != null ? { lat: s.originLat, lng: s.originLng } : ORIGIN_BEKASI;
    const offRoute = last ? isOffRoute(last.lat, last.lng, dest, origin) : false;
    const target = offRoute ? ShipmentStatus.ANOMALY : s.status === ShipmentStatus.ANOMALY ? ShipmentStatus.IN_TRANSIT : s.status;
    if (target !== s.status) {
      await prisma.shipment.update({ where: { id: s.id }, data: { status: target } });
      if (last && !offRoute) {
        await prisma.trackingLog.updateMany({ where: { shipmentId: s.id, isAnomaly: true }, data: { isAnomaly: false } });
      }
      fixed++;
    }
  }
  return fixed;
}

// --- FR-11 Fallback check-in ---

export async function manualCheckin(input: {
  shipmentId: string;
  lat?: number;
  lng?: number;
  note?: string;
  userId: string;
}) {
  const shipment = await prisma.shipment.findUnique({ where: { id: input.shipmentId } });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");

  const log = await prisma.trackingLog.create({
    data: {
      shipmentId: input.shipmentId,
      lat: input.lat ?? 0,
      lng: input.lng ?? 0,
      isAnomaly: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: "MANUAL_CHECKIN",
      entity: "Shipment",
      entityId: input.shipmentId,
      after: { note: input.note ?? "Check-in manual", lat: input.lat, lng: input.lng },
    },
  });

  return log;
}

export async function markDelivered(shipmentId: string, userId: string) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new HttpError(404, "Pengiriman tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: ShipmentStatus.DELIVERED, arrivedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "DELIVER_SHIPMENT",
        entity: "Shipment",
        entityId: shipmentId,
        before: { status: shipment.status },
        after: { status: updated.status },
      },
    });
    return updated;
  });
}

/** Daftar QC Certificate yang belum dipakai pengiriman (untuk form manifest). */
export async function listAvailableCertificates() {
  return prisma.qCCertificate.findMany({
    where: { shipment: null },
    orderBy: { issuedAt: "desc" },
  });
}
