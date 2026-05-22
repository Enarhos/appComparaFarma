import type { MedicationResult } from "./types.js";

interface CacheEntry {
  data: MedicationResult[];
  expiresAt: number;
}

const DEFAULT_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS ?? 5 * 60 * 1000);
const searchCache = new Map<string, CacheEntry>();

export function getCachedSearch(key: string): MedicationResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedSearch(key: string, data: MedicationResult[], ttlMs = DEFAULT_TTL_MS): void {
  searchCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
