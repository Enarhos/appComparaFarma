/**
 * CF-SEARCH-012 (S1) — runtime de SHADOW MODE de Search Engine v2.
 *
 * ===========================================================================
 * v1 ES LA ÚNICA FUENTE DE VERDAD VISIBLE. v2 NO TOCA LA RESPUESTA.
 * ===========================================================================
 * Este módulo se invoca DESPUÉS de que `json(res, 200, …)` ya envió la
 * respuesta. No devuelve nada al llamador, no puede modificar `results`, ni el
 * orden, ni los precios, ni los slugs, ni el código de estado, ni las cabeceras.
 * Lo único que hace es leer observaciones que v1 ya trajo, resolverlas contra el
 * registro canónico y emitir métricas.
 *
 * Las seis garantías, y dónde se cumple cada una:
 *
 *   1. NO CAMBIA LA RESPUESTA — se llama después de responder y su valor de
 *      retorno se descarta (`runAfterResponse` devuelve `void`).
 *   2. NO AGREGA LATENCIA — corre en `waitUntil` cuando el runtime lo expone;
 *      si no, desacoplado. Nunca se espera. Ver `afterResponse.ts`.
 *   3. NO PUEDE ROMPER LA BÚSQUEDA — `try/catch` total, por oferta y global.
 *      Un fallo del registro degrada a `unresolved` y sigue.
 *   4. NO DUPLICA TRÁFICO A LAS FARMACIAS — reprocesa las ofertas que v1 YA
 *      trajo. Cero peticiones nuevas. R-009: 3 de los 9 scrapers son frágiles.
 *   5. NO ESCRIBE EN TABLAS DE v1 — solo en `canonical_*`. Nunca en
 *      `price_history`, `pharmacy_clicks`, `email_alerts`, `medications` ni
 *      `medication_match_key_aliases`.
 *   6. APAGADO POR DEFECTO — `getShadowConfig()` devuelve `enabled: false` sin
 *      configuración explícita.
 *
 * ===========================================================================
 * SIN DATOS DE USUARIO
 * ===========================================================================
 * La CONSULTA no entra en este módulo como dato a persistir. Llega únicamente
 * como `samplingKey`, se usa para decidir si la búsqueda entra en la muestra, y
 * no se escribe en ninguna tabla del registro ni en ninguna métrica. No hay IP,
 * ni sesión, ni user-agent, ni identificador de persona en ninguna ruta de este
 * archivo.
 */

import { matchKey } from "@comparafarma/domain";
import {
  canonicalizeOffer,
  assignIdentity,
  type AssignedIdentity,
  type CanonicalRegistryRepository,
  type ObservationInput,
} from "@comparafarma/domain/searchV2";
import { runAfterResponse, withTimeout, type AfterResponseMode } from "../lib/afterResponse.js";
import { SupabaseCanonicalRegistry } from "../lib/canonicalRegistryDb.js";
import { getShadowConfig, isSampled } from "../lib/searchV2ShadowConfig.js";
import { captureException } from "../lib/sentry.js";
import type { MedicationResult, PharmacySlug } from "../lib/types.js";

/**
 * Techo duro del shadow completo. `api/vercel.json` declara `maxDuration: 30`;
 * el shadow es el trabajo menos importante de esa invocación y no puede
 * consumirla. Al vencer, se abandona la espera y se reporta el timeout — las
 * observaciones ya escritas quedan escritas (el registro es incremental).
 */
const SHADOW_TIMEOUT_MS = Number(process.env.SEARCH_V2_SHADOW_TIMEOUT_MS ?? 8000);

/**
 * Techo de observaciones por corrida. Una búsqueda amplia puede traer más de
 * cien ofertas; procesarlas todas en cada búsqueda muestreada sería una carga
 * de escritura desproporcionada para lo que el registro necesita crecer. El
 * corte es determinista (las primeras N en el orden que v1 ya fijó), no
 * aleatorio, para que la muestra sea reproducible.
 */
const MAX_OBSERVATIONS = Number(process.env.SEARCH_V2_SHADOW_MAX_OBSERVATIONS ?? 60);

export interface ShadowMetrics {
  total: number;
  success: number;
  error: number;
  durationMs: number;
  offersIn: number;
  offersProcessed: number;
  /** Ofertas con `CFM-CONCEPT-ID` asignado / ofertas procesadas. */
  offerCoverage: number;
  resolution: { exact: number; created: number; subsumed: number; ambiguous: number; unresolved: number };
  identityCreated: number;
  identityReused: number;
  databaseWrites: number;
  mode: AfterResponseMode | "skipped";
}

/** Observación derivada de una tarjeta v1. No hay retrieval nuevo. */
function toObservations(results: MedicationResult[], capturedAt: string): ObservationInput[] {
  const observations: ObservationInput[] = [];

  for (const card of results) {
    const prices = card.prices ?? [];
    // Los campos ESTRUCTURADOS (marca, laboratorio) llegan a nivel de TARJETA,
    // no de oferta: v1 los resuelve sobre la oferta canónica del grupo. Solo se
    // atribuyen cuando la tarjeta tiene UNA sola oferta, que es el único caso en
    // que la atribución es inequívoca. Preferir UNKNOWN a una procedencia falsa.
    const unambiguous = prices.length === 1;

    for (const price of prices) {
      const rawName = price.productName ?? "";
      if (rawName.trim().length === 0) continue;

      const sourceProductId = price.onlineUrl ?? rawName;
      const attributes = canonicalizeOffer({
        pharmacy: price.pharmacySlug as PharmacySlug,
        rawName,
        price: price.channels ?? { store: 0, online: null, cmr: null, sbpay: null, effective: 0 },
        stock: price.hasStock ?? null,
        url: price.onlineUrl ?? null,
        capturedAt,
        sourceProductId,
        structuredBrand: unambiguous && card.brandSource === "structured" ? card.brand : null,
        structuredManufacturer: unambiguous ? card.manufacturer : null,
        isBioequivalent: card.isBioequivalent ?? null,
        // CF-DATA-005 / #156: cuando el adaptador lo capture, viaja solo. Hasta
        // entonces `null`, y NUNCA como fuente de verdad canónica (#157 abierto).
        ispRegistration: null,
        legacyPresentationKey: card.presentationKey ?? null,
      });

      observations.push({
        pharmacy: price.pharmacySlug as PharmacySlug,
        rawName,
        sourceProductId,
        observedAt: capturedAt,
        attributes,
        upstreamFields: {
          brand: unambiguous && card.brandSource === "structured" ? (card.brand ?? null) : null,
          manufacturer: unambiguous ? (card.manufacturer ?? null) : null,
          isBioequivalent:
            card.isBioequivalent === null || card.isBioequivalent === undefined
              ? null
              : String(card.isBioequivalent),
          ispRegistration: null,
          url: price.onlineUrl ?? null,
        },
        legacyMatchKey: matchKey(rawName),
        legacyPresentationKey: card.presentationKey ?? null,
      });
    }
  }

  return observations;
}

function emptyMetrics(mode: ShadowMetrics["mode"]): ShadowMetrics {
  return {
    total: 0,
    success: 0,
    error: 0,
    durationMs: 0,
    offersIn: 0,
    offersProcessed: 0,
    offerCoverage: 0,
    resolution: { exact: 0, created: 0, subsumed: 0, ambiguous: 0, unresolved: 0 },
    identityCreated: 0,
    identityReused: 0,
    databaseWrites: 0,
    mode,
  };
}

/**
 * Núcleo del shadow: canonicaliza, resuelve contra el registro y agrega las
 * métricas. Es puro respecto de la respuesta HTTP — no la ve siquiera.
 *
 * Se exporta para poder ejecutarlo en tests de integración y en el harness
 * offline **sin encender nada en producción**.
 */
export async function runShadowIdentityAssignment(
  repository: CanonicalRegistryRepository,
  observations: ObservationInput[]
): Promise<ShadowMetrics> {
  const startedAt = Date.now();
  const metrics = emptyMetrics("skipped");
  metrics.offersIn = observations.length;

  const slice = observations.slice(0, MAX_OBSERVATIONS);
  metrics.offersProcessed = slice.length;

  let covered = 0;

  for (const observation of slice) {
    metrics.total += 1;
    let assigned: AssignedIdentity | null = null;
    try {
      assigned = await assignIdentity(repository, observation);
      metrics.success += 1;
    } catch (error) {
      // AISLAMIENTO POR OFERTA: un nombre que rompa un lector no puede tumbar
      // la corrida entera ni, mucho menos, la búsqueda del usuario.
      metrics.error += 1;
      console.warn(
        JSON.stringify({
          scope: "search_v2_shadow",
          event: "observation_failed",
          pharmacy: observation.pharmacy,
          error: error instanceof Error ? error.message : String(error),
        })
      );
      continue;
    }

    for (const level of [assigned.concept, assigned.presentation, assigned.product]) {
      metrics.resolution[level.outcome] += 1;
      if (level.outcome === "created") metrics.identityCreated += 1;
      if (level.outcome === "exact" || level.outcome === "subsumed") metrics.identityReused += 1;
    }
    if (assigned.concept.entityId !== null) covered += 1;
    // 3 filas de linaje + la observación; el enlace producto×presentación solo
    // cuando los dos niveles resolvieron.
    metrics.databaseWrites += 4 + (assigned.linked ? 1 : 0);
  }

  metrics.offerCoverage = slice.length === 0 ? 0 : covered / slice.length;
  metrics.durationMs = Date.now() - startedAt;
  return metrics;
}

export interface ScheduleShadowInput {
  /** Clave de muestreo. Se usa para decidir, NUNCA se persiste. */
  samplingKey: string;
  requestId: string;
  /** Las tarjetas que v1 ya devolvió. No se modifican: se leen. */
  results: MedicationResult[];
}

/**
 * Punto de entrada desde la ruta. **No devuelve una promesa esperable**: el
 * tipo de retorno es `void` justamente para que un `await` accidental en
 * `handleSearchRoute` sea imposible y la latencia percibida no pueda cambiar.
 */
export function scheduleSearchV2Shadow(input: ScheduleShadowInput): void {
  runAfterResponse(
    () => executeShadow(input),
    (error) => {
      // Último anillo de aislamiento. Ya estamos fuera del ciclo de respuesta:
      // acá no hay nada que devolver al usuario, solo que registrar.
      console.error(
        JSON.stringify({
          scope: "search_v2_shadow",
          event: "shadow_failed",
          requestId: input.requestId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
      captureException(error, { requestId: input.requestId, route: "search_v2_shadow" });
    }
  );
}

async function executeShadow(input: ScheduleShadowInput): Promise<void> {
  const config = await getShadowConfig();

  if (!config.enabled || !isSampled(input.samplingKey, config.sampleRate)) {
    // Ni un log por búsqueda cuando está apagado: sería ruido en el 100 % del
    // tráfico para informar que no pasó nada.
    return;
  }

  const startedAt = Date.now();
  const capturedAt = new Date().toISOString();

  try {
    const observations = toObservations(input.results, capturedAt);
    const metrics = await withTimeout(
      runShadowIdentityAssignment(new SupabaseCanonicalRegistry(), observations),
      SHADOW_TIMEOUT_MS,
      "search_v2_shadow"
    );

    // Métrica estructurada, sobre el mismo `console.info(JSON.stringify(...))`
    // que ya usan `/api/search` y el resto de `api/`. No se introduce ninguna
    // plataforma de observabilidad nueva por esto.
    console.info(
      JSON.stringify({
        scope: "search_v2_shadow",
        event: "shadow_run",
        requestId: input.requestId,
        configSource: config.source,
        sampleRate: config.sampleRate,
        search_v2_shadow_total: metrics.total,
        search_v2_shadow_success: metrics.success,
        search_v2_shadow_error: metrics.error,
        search_v2_shadow_duration_ms: Date.now() - startedAt,
        search_v2_offer_coverage: Number(metrics.offerCoverage.toFixed(6)),
        search_v2_resolution_exact: metrics.resolution.exact,
        search_v2_resolution_subsumed: metrics.resolution.subsumed,
        search_v2_resolution_ambiguous: metrics.resolution.ambiguous,
        search_v2_resolution_unresolved: metrics.resolution.unresolved,
        search_v2_identity_created: metrics.identityCreated,
        search_v2_identity_reused: metrics.identityReused,
        search_v2_database_writes: metrics.databaseWrites,
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        scope: "search_v2_shadow",
        event: "shadow_run_failed",
        requestId: input.requestId,
        search_v2_shadow_error: 1,
        search_v2_shadow_duration_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    // SIN REINTENTO. Un fallo del registro no puede convertirse en una tormenta
    // de escrituras: la siguiente búsqueda muestreada vuelve a intentarlo con
    // las mismas observaciones, porque el registro es incremental e idempotente.
  }
}

/** Solo para tests: expone los límites operativos sin exportar variables sueltas. */
export const __shadowLimits = {
  timeoutMs: SHADOW_TIMEOUT_MS,
  maxObservations: MAX_OBSERVATIONS,
} as const;
