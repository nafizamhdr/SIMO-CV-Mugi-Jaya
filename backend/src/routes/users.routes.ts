import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import * as users from "../controllers/users.controller";

const router = Router();

// Manajemen Akun — khusus OWNER (keputusan desain: pemilik mengelola akun karyawan).
router.use(authenticateJWT, requireRole(["OWNER"]));

router.get("/", users.getUsers);
router.post("/", users.createUser);
router.patch("/:id", users.updateUser);
router.patch("/:id/password", users.resetPassword);

export default router;
