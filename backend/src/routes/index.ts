import { Router } from "express";
import authRoutes from "./auth.routes";
import produksiRoutes from "./produksi.routes";
import qcRoutes from "./qc.routes";
import logistikRoutes from "./logistik.routes";
import auditRoutes from "./audit.routes";
import usersRoutes from "./users.routes";

const router = Router();

// Health check — used by the Definition of Done and uptime monitoring.
// Returns the raw { status: "ok" } shape expected by monitors.
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/produksi", produksiRoutes); // Nafiza
router.use("/qc", qcRoutes); // Regian
router.use("/logistik", logistikRoutes); // Redomas
router.use("/audit", auditRoutes); // Regian — audit trail lintas modul
router.use("/users", usersRoutes); // Manajemen akun (OWNER)

export default router;
