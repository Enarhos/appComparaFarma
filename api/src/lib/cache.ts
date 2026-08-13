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

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (err) {
  console.error("Redis init failed, falling back to in-memory cache:", err);
}

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

const HEALTHCHECK_TIMEOUT_MS = 1500;

/**
 * Ping real de Redis para `/api/health` (RC-03, Health Check Medio #8 —
 * restaurado 2026-08-13, ver docs/operations/RUNBOOK.md §6). No expone
 * ningún secreto, solo el estado. `"not_configured"` si las env vars de
 * Upstash no están presentes (mismo criterio que `getCachedSearch`);
 * `"degraded"` si el ping falla o excede el timeout; `"ok"` en caso contrario.
 */
export async function pingRedis(): Promise<"ok" | "degraded" | "not_configured"> {
  if (!redis) return "not_configured";
  try {
    await Promise.race([
      redis.get(`${KEY_PREFIX}__healthcheck__`),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error("timeout")), HEALTHCHECK_TIMEOUT_MS)),
    ]);
    return "ok";
  } catch (err) {
    console.warn("[health] Redis ping failed", err);
    return "degraded";
  }
}
