import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;
  
  logger.info("Initializing Redis connection...");
  
  redis = new Redis(REDIS_URL!, {
    // Automatically enable TLS if the URL starts with rediss://
    tls: REDIS_URL!.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3, // Fail fast so the app doesn't hang forever
    connectTimeout: 10000,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  redis.on("connect", () => logger.info("Connected to Redis"));
  redis.on("error", (err) => logger.error({ err }, "Redis connection error"));
  
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    const val = await r.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch (err) {
    logger.warn({ err, key }, "Redis cacheGet failed");
    return null; // Fallback to DB if Redis fails
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  const r = getRedis();
  await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
