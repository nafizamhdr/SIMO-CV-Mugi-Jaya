import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import * as users from "../controllers/users.controller";

const router = Router();

// Manajemen Akun — khusus SUPER_ADMIN.
router.use(authenticateJWT, requireRole(["SUPER_ADMIN"]));

router.get("/", users.getUsers);
router.post("/", users.createUser);
router.post("/invite", users.inviteUser);
router.post("/:id/resend-invite", users.resendInvite);
router.patch("/:id", users.updateUser);
router.patch("/:id/password", users.resetPassword);

export default router;
