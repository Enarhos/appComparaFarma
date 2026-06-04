import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PharmacySlug } from "@/lib/types";

const CACHE_KEY = "branches_v2";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface BranchIndex {
  byCommune: Record<string, PharmacySlug[]>;
  communes: Record<string, { nombre: string; region: string }>;
  fetchedAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";

let memCache: BranchIndex | null = null;

export async function getBranchIndex(): Promise<BranchIndex | null> {
  // 1. Memoria
  if (memCache) return memCache;

  // 2. AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: { data: BranchIndex; expiresAt: number } = JSON.parse(raw);
      if (Date.now() < cached.expiresAt) {
        memCache = cached.data;
        return memCache;
      }
    }
  } catch { /* ignora errores de lectura */ }

  // 3. Fetch al backend
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/branches`);
    if (!res.ok) return null;
    const data = (await res.json()) as BranchIndex;
    memCache = data;
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, expiresAt: Date.now() + TTL_MS })
    );
    return data;
  } catch {
    return null;
  }
}

/** Slugs de farmacias con sucursal en la comuna dada (normalizada). */
export function getPharmaciesForCommune(
  communeKey: string,
  index: BranchIndex
): PharmacySlug[] {
  return index.byCommune[communeKey] ?? [];
}

/** Lista de comunas ordenada para el selector. */
export function getCommuneList(
  index: BranchIndex
): Array<{ key: string; nombre: string; region: string }> {
  return Object.entries(index.communes)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
