import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import * as logistik from "../controllers/logistik.controller";

const router = Router();

// --- Endpoint DRIVER publik (tanpa login, divalidasi via tracking token) ---
// Harus didaftarkan SEBELUM authenticateJWT.
router.get("/driver/:id", logistik.driverGetShipment);
router.post("/driver/:id/location", logistik.driverPostLocation);

// Semua route logistik lain wajib login.
router.use(authenticateJWT);

const ADMIN = ["ADMIN_OPERASIONAL"] as const;

// Role pemantau (read-only): Owner & Kepala Produksi.
const MONITOR = ["OWNER", "KEPALA_PRODUKSI"] as const;

// FR-07 — Vendor (AVL)
router.get("/vendors", requireRole([...ADMIN, ...MONITOR]), logistik.getVendors);
router.post("/vendors", requireRole([...ADMIN]), logistik.createVendor);
router.patch("/vendors/:id", requireRole([...ADMIN]), logistik.updateVendor);

// FR-08 — Manifest / Shipment
router.get("/shipments", requireRole([...ADMIN, ...MONITOR]), logistik.getShipments);
router.get("/shipments/:id/tracking", requireRole([...ADMIN, ...MONITOR]), logistik.getTracking);
router.get("/certificates/available", requireRole([...ADMIN]), logistik.getAvailableCertificates);
router.post("/shipments", requireRole([...ADMIN]), logistik.createShipment);
router.patch("/shipments/:id/deliver", requireRole([...ADMIN]), logistik.deliverShipment);
router.post("/shipments/:id/tracking-token", requireRole([...ADMIN]), logistik.regenerateTrackingToken);

// FR-09 + FR-10 — Tracking & geofencing
router.post("/tracking", requireRole([...ADMIN]), logistik.postTracking);

// FR-11 — Fallback check-in
router.post("/checkin", requireRole([...ADMIN]), logistik.postCheckin);

export default router;
