import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import * as report from "../controllers/report.controller";

const router = Router();

// Report Center — Owner & Kepala Produksi.
router.use(authenticateJWT, requireRole(["OWNER", "KEPALA_PRODUKSI"]));

router.get("/types", report.getTypes);
router.get("/:type/preview", report.getPreview);
router.get("/:type/export.csv", report.exportCsv);
router.get("/:type/export.pdf", report.exportPdf);

export default router;
