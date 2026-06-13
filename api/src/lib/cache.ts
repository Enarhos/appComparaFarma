import { Redis } from "@upstash/redis";
import type { MedicationResult } from "./types.js";

const DEFAULT_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS ?? 5 * 60 * 1000);
const KEY_PREFIX = "cfsearch:";

// In-memory fallback for local dev (when Redis env vars are absent)
interface CacheEntry {
  data: MedicationResult[];
  expiresAt: number;
}
const memCache = new Map<string, CacheEntry>();

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function getCachedSearch(key: string): Promise<MedicationResult[] | null> {
  if (redis) {
    try {
      return await redis.get<MedicationResult[]>(`${KEY_PREFIX}${key}`);
    } catch (err) {
      console.warn("Redis get failed, falling through to miss", err);
      return null;
    }
  }
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data;
}

export async function setCachedSearch(
  key: string,
  data: MedicationResult[],
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  if (redis) {
    try {
      await redis.set(`${KEY_PREFIX}${key}`, data, { ex: Math.floor(ttlMs / 1000) });
    } catch (err) {
      console.warn("Redis set failed", err);
    }
    return;
  }
  memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
