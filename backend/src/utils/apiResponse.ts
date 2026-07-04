import type { Response } from "express";
import type { ApiError, ApiSuccess } from "../types";

/**
 * Helpers to enforce the standard API response format across all controllers.
 */
export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200): Response {
  const body: ApiSuccess<T> = { success: true, data, message };
  return res.status(status).json(body);
}

/** Response 201 Created — untuk endpoint yang membuat resource baru. */
export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(res: Response, error: string, code = 400): Response {
  const body: ApiError = { success: false, error, code };
  return res.status(code).json(body);
}

/**
 * Thrown by services/controllers to signal an HTTP error with a status code.
 * Caught by the central error middleware.
 */
export class HttpError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
