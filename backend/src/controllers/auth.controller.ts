import type { NextFunction, Request, Response } from "express";
import * as authService from "../services/auth.service";
import { loginSchema, logoutSchema, refreshSchema } from "../validators/auth.validator";
import { sendSuccess } from "../utils/apiResponse";

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
