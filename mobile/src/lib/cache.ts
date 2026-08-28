import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MedicationResult } from "@/lib/types";

// v12 (CF-SEARCH-001, 2026-08-27): `presentationKey` incorpora los segmentos
// `|var:` (variante comercial) y `|form:` (forma farmacéutica), así que su
// VALOR cambia para la mayoría del catálogo y una tarjeta cacheada con la
// clave vieja ya no corresponde al mismo agrupamiento. Además la navegación a
// la ficha pasó a resolver por `presentationKey` (medication.tsx): servir
// resultados v11 desde el caché dejaría la ficha sin resolver por la clave
// nueva.
// v11: MedicationResult gana presentationKey (FASE 1 Product Identity, 2026-08-19) — resultados por query pueden dividirse por marca
const CACHE_PREFIX = "search_cache_v12_";
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
