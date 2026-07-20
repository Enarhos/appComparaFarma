import { supabase } from "./supabaseClient.js";

const TABLE = "app_config";
const CACHE_TTL_MS = 60 * 1000;

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

/**
 * Config genérica clave/valor en Supabase (farmacias activas, banner de
 * donación, lo que se agregue después) — reemplaza a las env vars de Vercel
 * como "consola", sin redeploy por cada cambio. Cacheada en memoria (60s)
 * porque getDisabledPharmacies() se llama en cada /api/search: sin esto,
 * cada búsqueda pagaría un round-trip a Postgres solo para leer config.
 *
 * Si Supabase no está configurado o la fila todavía no existe (ej. antes de
 * correr la migración), devuelve null — cada caller decide su fallback.
 */
export async function getConfigValue<T>(key: string): Promise<T | null> {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.value as T;

  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from(TABLE).select("value").eq("key", key).maybeSingle();
    if (error || !data) return null;
    cache.set(key, { value: data.value, expiresAt: Date.now() + CACHE_TTL_MS });
    return data.value as T;
  } catch (err) {
    console.warn(`[appConfig] getConfigValue(${key}) failed`, err);
    return null;
  }
}

export async function setConfigValue(key: string, value: unknown): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase no configurado" };

  const { error } = await supabase.from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  cache.delete(key);
  return { error: null };
}
