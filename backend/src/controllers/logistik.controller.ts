import type { NextFunction, Response } from "express";
import type { Server as SocketServer } from "socket.io";
import * as logistik from "../services/logistik.service";
import {
  createVendorSchema,
  updateVendorSchema,
  createShipmentSchema,
  trackingSchema,
  checkinSchema,
} from "../validators/logistik.validator";
import { sendSuccess, HttpError } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

// --- FR-07 Vendor ---
export async function getVendors(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.listVendors());
  } catch (e) {
    next(e);
  }
}

export async function createVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createVendorSchema.parse(req.body);
    sendSuccess(res, await logistik.createVendor(input), "Vendor ditambahkan", 201);
  } catch (e) {
    next(e);
  }
}

export async function updateVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = updateVendorSchema.parse(req.body);
    sendSuccess(res, await logistik.updateVendor(req.params.id, input), "Vendor diperbarui");
  } catch (e) {
    next(e);
  }
}

// --- FR-08 Shipment ---
export async function getShipments(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.listShipments());
  } catch (e) {
    next(e);
  }
}

export async function getAvailableCertificates(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.listAvailableCertificates());
  } catch (e) {
    next(e);
  }
}

export async function getTracking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.getTrackingHistory(req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function regenerateTrackingToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.regenerateTrackingToken(req.params.id), "Token pelacakan diperbarui");
  } catch (e) {
    next(e);
  }
}

// --- Publik (driver, tanpa login) — divalidasi via tracking token ---
export async function driverGetShipment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    sendSuccess(res, await logistik.getDriverShipment(req.params.id, token));
  } catch (e) {
    next(e);
  }
}

export async function driverPostLocation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : (req.body.token as string) ?? "";
    const { lat, lng, speed } = req.body as { lat: number; lng: number; speed?: number };
    if (typeof lat !== "number" || typeof lng !== "number" || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new HttpError(422, "Koordinat lat/lng tidak valid");
    }
    const { anomaly } = await logistik.driverPostLocation(req.params.id, token, lat, lng, speed);

    const io = req.app.get("io") as SocketServer | undefined;
    io?.emit("tracking_update", { shipmentId: req.params.id, lat, lng });
    if (anomaly) io?.emit("geofence_anomaly", { shipmentId: req.params.id, lat, lng });

    sendSuccess(res, { anomaly }, anomaly ? "ANOMALI: keluar rute" : "Posisi terkirim");
  } catch (e) {
    next(e);
  }
}

export async function createShipment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createShipmentSchema.parse(req.body);
    const shipment = await logistik.createShipment({ ...input, userId: req.user!.sub });
    const io = req.app.get("io") as SocketServer | undefined;
    io?.emit("shipment_created", shipment);
    sendSuccess(res, shipment, "Manifest terbit — pengiriman diberangkatkan", 201);
  } catch (e) {
    next(e);
  }
}

export async function deliverShipment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await logistik.markDelivered(req.params.id, req.user!.sub), "Pengiriman selesai");
  } catch (e) {
    next(e);
  }
}

// --- FR-09 Tracking + FR-10 Geofencing ---
export async function postTracking(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = trackingSchema.parse(req.body);
    const { log, anomaly } = await logistik.recordTracking(input);

    const io = req.app.get("io") as SocketServer | undefined;
    io?.emit("tracking_update", log);
    if (anomaly) {
      io?.emit("geofence_anomaly", { shipmentId: input.shipmentId, lat: input.lat, lng: input.lng });
    }

    sendSuccess(res, { log, anomaly }, anomaly ? "ANOMALI: armada keluar rute" : "Posisi tercatat");
  } catch (e) {
    next(e);
  }
}

// --- FR-11 Check-in ---
export async function postCheckin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = checkinSchema.parse(req.body);
    const log = await logistik.manualCheckin({ ...input, userId: req.user!.sub });
    sendSuccess(res, log, "Check-in manual tercatat", 201);
  } catch (e) {
    next(e);
  }
}
