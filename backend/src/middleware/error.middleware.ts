import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { HttpError, sendError } from "../utils/apiResponse";

/**
 * Central error handler. Converts known error types into the standard
 * API error envelope. Must be registered LAST (after all routes).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    sendError(res, message || "Validasi input gagal", 422);
    return;
  }

  if (err instanceof HttpError) {
    sendError(res, err.message, err.code);
    return;
  }

  logger.error("Unhandled error", err instanceof Error ? err.stack : err);
  sendError(res, "Terjadi kesalahan pada server", 500);
}

/**
 * 404 handler for unknown routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Rute tidak ditemukan: ${req.method} ${req.originalUrl}`, 404);
}
