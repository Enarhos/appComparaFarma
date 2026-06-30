import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MedicationResult } from "@/lib/types";

const CACHE_PREFIX = "search_cache_v10_"; // v10: matchKey migrado a @comparafarma/domain (hyphen+short-word merging)
const TTL_MS = 30 * 60 * 1000; // 30 min

interface CacheEntry {
  data: MedicationResult[];
  expiresAt: number;
}

export async function getCached(key: string): Promise<MedicationResult[] | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`).catch(() => {});
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: MedicationResult[]): Promise<void> {
  try {
    const entry: CacheEntry = { data, expiresAt: Date.now() + TTL_MS };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}
