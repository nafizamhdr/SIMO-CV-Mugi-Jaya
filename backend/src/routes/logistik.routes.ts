import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import * as logistik from "../controllers/logistik.controller";

const router = Router();
router.use(authenticateJWT);

const ADMIN = ["ADMIN_OPERASIONAL"] as const;

// FR-07 — Vendor (AVL)
router.get("/vendors", requireRole([...ADMIN, "OWNER"]), logistik.getVendors);
router.post("/vendors", requireRole([...ADMIN]), logistik.createVendor);
router.patch("/vendors/:id", requireRole([...ADMIN]), logistik.updateVendor);

// FR-08 — Manifest / Shipment
router.get("/shipments", requireRole([...ADMIN, "OWNER"]), logistik.getShipments);
router.get("/certificates/available", requireRole([...ADMIN]), logistik.getAvailableCertificates);
router.post("/shipments", requireRole([...ADMIN]), logistik.createShipment);
router.patch("/shipments/:id/deliver", requireRole([...ADMIN]), logistik.deliverShipment);

// FR-09 + FR-10 — Tracking & geofencing
router.post("/tracking", requireRole([...ADMIN]), logistik.postTracking);

// FR-11 — Fallback check-in
router.post("/checkin", requireRole([...ADMIN]), logistik.postCheckin);

export default router;
