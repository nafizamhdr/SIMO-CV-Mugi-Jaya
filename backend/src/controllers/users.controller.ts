import type { NextFunction, Response } from "express";
import * as userService from "../services/user.service";
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "../validators/users.validator";
import { sendSuccess } from "../utils/apiResponse";
import type { AuthRequest } from "../types";

export async function getUsers(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await userService.listUsers());
  } catch (e) {
    next(e);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await userService.createUser(input, req.user!.sub);
    sendSuccess(res, user, "Akun berhasil dibuat", 201);
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.params.id, input, req.user!.sub);
    sendSuccess(res, user, "Akun diperbarui");
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password } = resetPasswordSchema.parse(req.body);
    await userService.resetPassword(req.params.id, password, req.user!.sub);
    sendSuccess(res, null, "Kata sandi berhasil direset");
  } catch (e) {
    next(e);
  }
}
