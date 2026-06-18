import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { upload, uploadDoc } from "../middleware/upload.middleware";
import * as qc from "../controllers/qc.controller";

const router = Router();
router.use(authenticateJWT);

const REPO_ROLES = ["INSPECTOR_QC", "SUPERVISOR_LAPANGAN", "KEPALA_PRODUKSI"] as const;
const QC_ROLES = ["INSPECTOR_QC"] as const;

// Daftar project untuk pemilihan batch
router.get("/projects", requireRole([...QC_ROLES]), qc.getProjects);

// FR-12 — Repositori spesifikasi
router.get("/specifications", requireRole([...REPO_ROLES]), qc.getSpecifications);
router.post(
  "/specifications",
  requireRole(["INSPECTOR_QC", "KEPALA_PRODUKSI"]),
  uploadDoc.single("file"),
  qc.createSpecification,
);

// FR-04 — Checklist QC digital
router.get("/work-items", requireRole([...QC_ROLES]), qc.getInspectionItems);
router.get("/records", requireRole([...QC_ROLES]), qc.getRecords);
router.post("/records", requireRole([...QC_ROLES]), upload.single("photo"), qc.createRecord);
router.patch("/records/:id", requireRole([...QC_ROLES]), upload.single("photo"), qc.updateRecord);

// FR-06 — Non-Conforming Item
router.post("/nc-items", requireRole([...QC_ROLES]), upload.single("photo"), qc.createNCItem);

// FR-05 — Penerbitan QC Certificate
router.get("/certificates", requireRole([...QC_ROLES]), qc.getCertificates);
router.post("/certificates", requireRole([...QC_ROLES]), qc.issueCertificate);

export default router;
