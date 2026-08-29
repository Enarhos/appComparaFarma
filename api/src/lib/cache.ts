import { Redis } from "@upstash/redis";
import type { MedicationResult } from "./types.js";

const DEFAULT_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS ?? 5 * 60 * 1000);

/**
 * CF-SEARCH-002 — DOS NIVELES DE CACHÉ.
 *
 * Antes había uno solo, con la clave `cleanQuery(raw)`. Como `cleanQuery`
 * descarta la concentración, "ibuprofeno 200/400/600 mg" compartían entrada y
 * la segunda y tercera consulta recibían la respuesta YA RANKEADA de la
 * primera (verificado en producción 2026-08-28: `x-search-cache: hit`, 110
 * resultados idénticos en las tres). Ese es el mecanismo exacto de QA-05.
 *
 *   `cfsearch:r:` — RETRIEVAL. Clave = `retrievalQuery` (+ farmacias). Guarda
 *     lo que devolvieron los 9 scrapers ya fusionado. Se comparte entre todas
 *     las intenciones de la misma consulta amplia: pedir 200, 400 y 600 mg NO
 *     multiplica por tres el scraping.
 *
 *   `cfsearch:v2:` — RESPUESTA. Clave = intención completa
 *     (`queryIntentCacheKey`, incluye dosis/cantidad/forma). Guarda la
 *     respuesta final ya clasificada y ordenada, que es lo único que puede
 *     servirse tal cual. Dos intenciones distintas NUNCA comparten entrada.
 *
 * El prefijo de respuesta es `v2:` (y no el `cfsearch:` histórico) para que
 * las entradas escritas por la versión anterior —ordenadas solo por precio y
 * sin anotación de relevancia— queden inalcanzables tras el deploy en vez de
 * servirse como si estuvieran rankeadas.
 */
const RESPONSE_KEY_PREFIX = "cfsearch:v2:";
const RETRIEVAL_KEY_PREFIX = "cfsearch:r:";
const KEY_PREFIX = RESPONSE_KEY_PREFIX;

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

async function getCached(prefix: string, key: string): Promise<MedicationResult[] | null> {
  const namespaced = `${prefix}${key}`;
  if (redis) {
    try {
      return await redis.get<MedicationResult[]>(namespaced);
    } catch (err) {
      console.warn("Redis get failed, falling through to miss", err);
      return null;
    }
  }
  const entry = memCache.get(namespaced);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(namespaced);
    return null;
  }
  return entry.data;
}

async function setCached(
  prefix: string,
  key: string,
  data: MedicationResult[],
  ttlMs: number
): Promise<void> {
  const namespaced = `${prefix}${key}`;
  if (redis) {
    try {
      await redis.set(namespaced, data, { ex: Math.floor(ttlMs / 1000) });
    } catch (err) {
      console.warn("Redis set failed", err);
    }
    return;
  }
  memCache.set(namespaced, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Nivel RESPUESTA: la carga exacta que se devuelve al cliente, ya clasificada
 * y ordenada para UNA intención concreta. La clave la construye
 * `queryIntentCacheKey()` (@comparafarma/domain) — ver el bloque de prefijos.
 */
export async function getCachedSearch(key: string): Promise<MedicationResult[] | null> {
  return getCached(RESPONSE_KEY_PREFIX, key);
}

export async function setCachedSearch(
  key: string,
  data: MedicationResult[],
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  return setCached(RESPONSE_KEY_PREFIX, key, data, ttlMs);
}

/**
 * Nivel RETRIEVAL: resultados fusionados de los 9 scrapers para la consulta
 * AMPLIA, compartidos por todas las intenciones que la derivan. Nunca se
 * devuelven tal cual — la ruta los vuelve a pasar por `rankByRelevance()` con
 * la intención real antes de responder, así que un payload guardado con el
 * orden de otra intención no puede filtrarse a la respuesta.
 */
export async function getCachedRetrieval(key: string): Promise<MedicationResult[] | null> {
  return getCached(RETRIEVAL_KEY_PREFIX, key);
}

export async function setCachedRetrieval(
  key: string,
  data: MedicationResult[],
  ttlMs = DEFAULT_TTL_MS
): Promise<void> {
  return setCached(RETRIEVAL_KEY_PREFIX, key, data, ttlMs);
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
