/**
 * Centralized application logger.
 * Production code MUST use this instead of console.log directly.
 */
type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (meta !== undefined) {
    sink(prefix, message, meta);
  } else {
    sink(prefix, message);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "production") emit("debug", message, meta);
  },
};
