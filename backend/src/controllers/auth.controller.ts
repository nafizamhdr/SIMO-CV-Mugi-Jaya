import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as accountService from "../services/account.service";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInviteSchema,
} from "../validators/auth.validator";
import { sendSuccess } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, role } = loginSchema.parse(req.body);
    const result = await authService.login(email, password, role);
    sendSuccess(res, result, "Berhasil masuk");
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, "Token diperbarui");
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = logoutSchema.parse(req.body);
    await authService.logout(refreshToken);
    sendSuccess(res, null, "Berhasil keluar");
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.sub, currentPassword, newPassword);
    sendSuccess(res, null, "Kata sandi berhasil diubah. Sesi lain telah diakhiri.");
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await accountService.forgotPassword(email);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await accountService.resetPassword(token, password);
    sendSuccess(res, null, "Kata sandi berhasil direset. Silakan masuk.");
  } catch (error) {
    next(error);
  }
}

export async function verifyInviteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    sendSuccess(res, await accountService.verifyInvite(token));
  } catch (error) {
    next(error);
  }
}

export async function acceptInviteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = acceptInviteSchema.parse(req.body);
    await accountService.acceptInvite(token, password);
    sendSuccess(res, null, "Akun diaktifkan. Silakan masuk.");
  } catch (error) {
    next(error);
  }
}
