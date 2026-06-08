import type { NextFunction, Response } from "express";
import type { AuthRequest, Role } from "../types";
import { sendError } from "../utils/apiResponse";

/**
 * Restricts a route to the given roles. Must run AFTER authenticateJWT.
 * Returns 403 Forbidden (NOT a login redirect) when the role is not allowed,
 * per the RBAC rule in CLAUDE.md.
 */
export function requireRole(roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Tidak terautentikasi", 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, "Anda tidak memiliki akses ke sumber daya ini", 403);
      return;
    }

    next();
  };
}
