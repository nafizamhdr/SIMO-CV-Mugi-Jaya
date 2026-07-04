import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  changePasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyInviteHandler,
  acceptInviteHandler,
} from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// FR-13 — Autentikasi & Manajemen Sesi
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

// Ganti kata sandi sendiri (login)
router.post("/change-password", authenticateJWT, changePasswordHandler);

// Lupa & reset password (publik)
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// Undangan akun (publik — verifikasi & terima)
router.get("/invite/verify", verifyInviteHandler);
router.post("/invite/accept", acceptInviteHandler);

export default router;
