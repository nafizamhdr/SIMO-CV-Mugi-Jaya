import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

// Health check — used by the Definition of Done and uptime monitoring.
// Returns the raw { status: "ok" } shape expected by monitors.
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);

// Module routes are mounted here by each developer in later sprints:
//   router.use("/produksi", produksiRoutes);  // Nafiza
//   router.use("/qc", qcRoutes);              // Regian
//   router.use("/logistik", logistikRoutes);  // Redomas

export default router;
