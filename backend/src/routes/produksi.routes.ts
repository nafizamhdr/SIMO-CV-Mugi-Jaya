import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { upload, verifyImageMagic } from "../middleware/upload.middleware";
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
  verifyImageMagic,
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

// CRUDS
router.get(
  "/projects",
  requireRole(["KEPALA_PRODUKSI", "OWNER", "MANDOR"]),
  produksi.getProjects,
);

router.post(
  "/projects",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.createProject,
);

router.put(
  "/projects/:id",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.updateProject,
);

router.delete(
  "/projects/:id",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.deleteProject,
);

router.post(
  "/warehouses",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.createWarehouse,
);

router.put(
  "/warehouses/:id",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.updateWarehouse,
);

router.delete(
  "/warehouses/:id",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.deleteWarehouse,
);

router.post(
  "/work-items",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.createWorkItem,
);

router.get(
  "/mandors",
  requireRole(["KEPALA_PRODUKSI"]),
  produksi.getMandors,
);

export default router;
