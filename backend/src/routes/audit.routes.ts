import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { listAuditLogs } from "../services/audit.service";
import { sendSuccess } from "../utils/apiResponse";
import type { AuthRequest } from "../types";
import type { Response, NextFunction } from "express";

const router = Router();
router.use(authenticateJWT);

// Audit Trail lintas modul — hanya OWNER & KEPALA_PRODUKSI (RBAC CLAUDE.md §3).
router.get(
  "/",
  requireRole(["OWNER", "KEPALA_PRODUKSI"]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const date = typeof req.query.date === "string" ? req.query.date : undefined;
      sendSuccess(res, await listAuditLogs({ category, date }));
    } catch (e) {
      next(e);
    }
  },
);

export default router;
