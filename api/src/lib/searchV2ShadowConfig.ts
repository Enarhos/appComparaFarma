/**
 * CF-SEARCH-012 (S1) — interruptor y muestreo del shadow de Search Engine v2.
 *
 * ---------------------------------------------------------------------------
 * APAGADO POR DEFECTO. SIEMPRE.
 * ---------------------------------------------------------------------------
 * Sin configuración explícita, `isShadowEnabled()` devuelve `false` y
 * `sampleRate` vale `0`. Un despliegue que no configure nada no ejecuta shadow,
 * no escribe en el registro y no puede cambiar una sola respuesta al usuario.
 *
 * ---------------------------------------------------------------------------
 * TRES CONTROLES, EN ORDEN DE AUTORIDAD
 * ---------------------------------------------------------------------------
 *   1. `SEARCH_V2_SHADOW_KILL=true` — MATA el shadow, gane quien gane abajo. Es
 *      el único control que no depende de que Supabase responda: si el registro
 *      o `app_config` están caídos o comprometidos, esta env var sigue
 *      funcionando. Nunca se lee de la base.
 *
 *   2. `app_config['search_v2_shadow']` — `{ enabled, sampleRate }`. FUENTE DE
 *      VERDAD operativa. Es la misma tabla y el mismo patrón cacheado que ya usa
 *      `pharmacyFlags.ts` para apagar una farmacia sin redeploy, y es lo que
 *      permite ir de 1 % a 100 % —o a 0 %— cambiando una fila. Una env var de
 *      Vercel NO sirve para eso: cambiarla exige un redespliegue, que es
 *      exactamente lo que el ticket prohíbe como requisito operativo.
 *
 *   3. `SEARCH_V2_SHADOW_ENABLED` / `SEARCH_V2_SHADOW_SAMPLE_RATE` — valores por
 *      defecto cuando la fila de `app_config` todavía no existe o Supabase no
 *      responde. Red de seguridad, no consola.
 *
 * Un fallo leyendo la configuración NUNCA habilita el shadow: `getConfigValue`
 * devuelve `null` ante cualquier error y se cae a las env vars, que por defecto
 * están apagadas.
 *
 * ---------------------------------------------------------------------------
 * MUESTREO DETERMINISTA
 * ---------------------------------------------------------------------------
 * La decisión se toma con un hash de la clave de retrieval, no con `Math.random()`.
 * Consecuencias buscadas:
 *   · la misma consulta cae siempre del mismo lado, así que subir el muestreo
 *     AMPLÍA el conjunto observado en vez de barajarlo;
 *   · es reproducible: se puede responder "¿por qué esta búsqueda no dejó
 *     rastro?" sin adivinar;
 *   · NO depende del ranking, del precio, del usuario ni del número de
 *     resultados — solo del texto de la consulta ya normalizado, que es el
 *     mismo dato que ya gobierna la caché.
 */

import { getConfigValue } from "./appConfigDb.js";

export const SHADOW_CONFIG_KEY = "search_v2_shadow";

export interface ShadowConfig {
  enabled: boolean;
  /** Fracción de búsquedas observadas, en `[0, 1]`. */
  sampleRate: number;
  /** De dónde salió la decisión, para el log estructurado. */
  source: "kill-switch" | "app_config" | "env";
}

const DISABLED: ShadowConfig = { enabled: false, sampleRate: 0, source: "env" };

function clampRate(value: unknown): number {
  const rate = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(rate)) return 0;
  if (rate <= 0) return 0;
  if (rate >= 1) return 1;
  return rate;
}

function envConfig(): ShadowConfig {
  const enabled = process.env.SEARCH_V2_SHADOW_ENABLED === "true";
  return {
    enabled,
    sampleRate: enabled ? clampRate(process.env.SEARCH_V2_SHADOW_SAMPLE_RATE ?? 0) : 0,
    source: "env",
  };
}

/** Resuelve la configuración vigente. Nunca lanza. */
export async function getShadowConfig(): Promise<ShadowConfig> {
  // 1. Kill switch — se evalúa antes de tocar la red.
  if (process.env.SEARCH_V2_SHADOW_KILL === "true") {
    return { enabled: false, sampleRate: 0, source: "kill-switch" };
  }

  try {
    const fromDb = await getConfigValue<{ enabled?: unknown; sampleRate?: unknown }>(
      SHADOW_CONFIG_KEY
    );
    if (fromDb && typeof fromDb === "object") {
      const enabled = fromDb.enabled === true;
      return {
        enabled,
        sampleRate: enabled ? clampRate(fromDb.sampleRate) : 0,
        source: "app_config",
      };
    }
  } catch {
    // Cualquier problema leyendo config cae a las env vars, que por defecto
    // están apagadas. Un fallo nunca enciende nada.
    return envConfig();
  }

  return envConfig();
}

/**
 * Hash FNV-1a de 32 bits CON FINALIZADOR DE AVALANCHA. Determinista, sin
 * dependencias y sin `node:crypto` (mismo criterio que `canonicalIdentity.ts`).
 *
 * EL FINALIZADOR NO ES DECORATIVO. FNV-1a sin mezcla final distribuye mal los
 * BITS ALTOS para cadenas cortas y parecidas entre sí, que es exactamente la
 * forma de una consulta de farmacia. Medido antes de agregarlo: sobre 500
 * claves de la misma familia, CERO caían por debajo de 0,1 (el mínimo era
 * 0,1077). Con una tasa del 10 % el muestreo habría descartado la familia
 * ENTERA en silencio, y el shadow habría observado una muestra sesgada
 * creyéndola representativa.
 *
 * La mezcla es `fmix32` de MurmurHash3, la finalización estándar para este
 * problema.
 */
function hash32(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

/**
 * `true` si esta consulta entra en la muestra. Determinista sobre `samplingKey`.
 *
 * `sampleRate = 0` nunca observa; `sampleRate = 1` observa todo. Entre medio,
 * el conjunto observado con `r1 < r2` es SUBCONJUNTO del observado con `r2`.
 */
export function isSampled(samplingKey: string, sampleRate: number): boolean {
  if (sampleRate <= 0) return false;
  if (sampleRate >= 1) return true;
  return hash32(samplingKey) / 0x100000000 < sampleRate;
}
