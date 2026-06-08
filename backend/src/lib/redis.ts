import Redis from "ioredis";
import { logger } from "./logger";

/**
 * Redis client for real-time queues and refresh-token / session cache.
 * Uses lazyConnect so the API can boot even when Redis is temporarily down;
 * connection errors are logged instead of crashing the process.
 */
export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", (err) => {
  logger.error("Redis connection error", err.message);
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info("Redis connected");
  } catch (error) {
    logger.warn("Redis unavailable on startup — continuing without cache", error);
  }
}
