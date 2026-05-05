import Redis from "ioredis";
import { logger } from "./logger";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;
  redis = new Redis(REDIS_URL!, { tls: { rejectUnauthorized: false }, lazyConnect: false });
  redis.on("connect", () => logger.info("Connected to Redis"));
  redis.on("error", (err) => logger.warn({ err }, "Redis error"));
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  const val = await r.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
  const r = getRedis();
  await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
}
