import { Redis } from "@upstash/redis";

const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 60);
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const KEY_PREFIX = "ratelimit:";

// In-memory fallback for local dev (when Redis env vars are absent)
const hits = new Map<string, { count: number; resetAt: number }>();

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (err) {
  console.error("Redis init failed, falling back to in-memory rate limit:", err);
}

export async function consumeRateLimit(
  key: string,
  max = DEFAULT_MAX,
  windowMs = DEFAULT_WINDOW_MS
): Promise<boolean> {
  if (redis) {
    try {
      return await consumeRateLimitRedis(redis, key, max, windowMs);
    } catch (err) {
      console.warn("Redis rate limit failed, falling back to in-memory for this request", err);
    }
  }
  return consumeRateLimitMemory(key, max, windowMs);
}

async function consumeRateLimitRedis(
  client: Redis,
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const redisKey = `${KEY_PREFIX}${key}:${Math.floor(Date.now() / windowMs)}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, Math.ceil(windowMs / 1000));
  }
  return count <= max;
}

function consumeRateLimitMemory(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  // Purge expired entries periodically to avoid unbounded Map growth
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (now >= v.resetAt) hits.delete(k);
    }
  }

  const existing = hits.get(key);
  if (!existing || now >= existing.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}
