import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { upload } from "../middleware/upload.middleware";
import * as produksi from "../controllers/produksi.controller";

const router = Router();

// Semua route produksi wajib autentikasi
router.use(authenticateJWT);

// FR-01 — list warehouse (Mandor lihat miliknya; Kepala Produksi/Owner lihat semua)
router.get(
  "/warehouses",
  requireRole(["MANDOR", "KEPALA_PRODUKSI", "OWNER"]),
  produksi.getWarehouses,
);

// FR-01 — list work item per warehouse
router.get(
  "/work-items",
  requireRole(["MANDOR", "KEPALA_PRODUKSI", "OWNER"]),
  produksi.getWorkItems,
);

// FR-01 — update status work item (+ foto opsional)
router.patch(
  "/work-items/:id/status",
  requireRole(["MANDOR", "KEPALA_PRODUKSI"]),
  upload.single("photo"),
  produksi.updateStatus,
);

// FR-02 — dashboard agregasi
router.get(
  "/dashboard",
  requireRole(["OWNER", "KEPALA_PRODUKSI"]),
  produksi.getDashboard,
);

// FR-03 — notifikasi keterlambatan produksi
router.get(
  "/notifications",
  requireRole(["OWNER", "KEPALA_PRODUKSI"]),
  produksi.getNotifications,
);

export default router;
