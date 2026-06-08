import { Router } from "express";
import { loginHandler, logoutHandler, refreshHandler } from "../controllers/auth.controller";

const router = Router();

// FR-13 — Autentikasi & Manajemen Sesi
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

export default router;
