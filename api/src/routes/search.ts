import { isDebugAuthorized } from "../middleware/auth.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";
import { attachRequestId } from "../middleware/requestId.js";
import {
  getCachedRetrieval,
  getCachedSearch,
  setCachedRetrieval,
  setCachedSearch,
} from "../lib/cache.js";
import { HttpError } from "../lib/errors.js";
import { captureException } from "../lib/sentry.js";
import { getClientIp, getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { withTrackedUrls } from "../lib/clickTracking.js";
import { parseQueryIntent, queryIntentCacheKey, rankByRelevance, type QueryIntent } from "@comparafarma/domain";
import { searchMedications, searchMedicationsDetailed } from "../services/searchService.js";
import { scheduleSearchV2Shadow } from "../services/searchV2Shadow.js";

function getOrigin(req: RequestLike): string {
  const host = getHeader(req, "x-forwarded-host") ?? getHeader(req, "host") ?? "comparafarma-api.vercel.app";
  return `https://${host}`;
}

/**
 * CF-SEARCH-002 — la validación se hace sobre el texto CRUDO y devuelve la
 * intención, no la consulta limpia.
 *
 * Antes devolvía `cleanQuery(raw)` y ese valor se usaba para todo: retrieval,
 * caché y logs. Con eso, la concentración se perdía antes de que nadie pudiera
 * usarla. Ahora `cleanQuery` sigue decidiendo si la consulta es interpretable
 * (mismo 400, mismo mensaje, mismo umbral) pero viaja dentro de la intención
 * como `retrievalQuery`.
 */
function validateQuery(rawQuery: string | null): QueryIntent {
  if (!rawQuery || rawQuery.trim().length < 2) {
    throw new HttpError("Debes indicar un termino de busqueda valido.", 400);
  }
  if (rawQuery.length > 120) {
    throw new HttpError("La busqueda es demasiado larga.", 400);
  }

  const intent = parseQueryIntent(rawQuery);
  if (!intent.retrievalQuery) {
    throw new HttpError("No se pudo interpretar la busqueda.", 400);
  }
  return intent;
}

/** Sufijo de filtro geográfico, común a las claves de ambos niveles de caché. */
function pharmacySuffix(onlySlugs: string[] | undefined): string {
  return onlySlugs ? `:${[...onlySlugs].sort().join(",")}` : "";
}

function isDebugMode(req: RequestLike): boolean {
  const debug = getSearchParam(req, "debug");
  return debug === "1" || debug === "true";
}

export async function handleSearchRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const { requestId } = attachRequestId(req, res);

  try {
    if ((req.method ?? "GET").toUpperCase() !== "GET") {
      throw new HttpError("Metodo no permitido.", 405);
    }

    // Busqueda publica (Sprint SEC-001): /api/search ya no requiere x-api-key.
    // API_SECRET_KEY se reserva para superficies privilegiadas (debug=1 via
    // isDebugAuthorized(), y /api/subscriptions grant-manual/revoke-manual).
    // Un x-api-key antiguo enviado por builds ya instalados de Mobile se
    // ignora sin error — no rompe compatibilidad hacia atras.
    const clientIp = getClientIp(req);
    if (!(await consumeRateLimit(clientIp))) {
      throw new HttpError("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
    }

    const debugMode = isDebugMode(req);
    if (debugMode && !isDebugAuthorized(req)) {
      throw new HttpError("No autorizado para modo debug.", 403);
    }

    const intent = validateQuery(getSearchParam(req, "q"));
    const query = intent.retrievalQuery;

    // Filtro geográfico: ?pharmacies=cruz-verde,dr-simi
    const pharmaciesParam = getSearchParam(req, "pharmacies");
    const onlySlugs = pharmaciesParam
      ? (pharmaciesParam.split(",").map((s) => s.trim()).filter(Boolean) as import("../lib/types.js").PharmacySlug[])
      : undefined;

    const origin = getOrigin(req);
    const suffix = pharmacySuffix(onlySlugs);
    // CF-SEARCH-002 — la clave de RESPUESTA incorpora la intención completa
    // (dosis, cantidad, forma). Es lo que impide que "ibuprofeno 400 mg"
    // reciba la respuesta ya rankeada de "ibuprofeno 600 mg", que es el
    // mecanismo exacto de QA-05 medido en producción.
    const responseCacheKey = queryIntentCacheKey(intent) + suffix;
    const retrievalCacheKey = query.toLowerCase().trim() + suffix;

    if (!debugMode) {
      const cached = await getCachedSearch(responseCacheKey);
      if (cached) {
        res.setHeader("x-search-cache", "hit");
        console.info(JSON.stringify({
          requestId,
          route: "/api/search",
          query,
          intent: responseCacheKey,
          cache: "hit",
          results: cached.length,
        }));
        json(res, 200, withTrackedUrls(cached, origin), req);
        return;
      }
    }

    res.setHeader("x-search-cache", "miss");

    if (debugMode) {
      const execution = await searchMedicationsDetailed(intent, onlySlugs);
      console.info(JSON.stringify({
        requestId,
        route: "/api/search",
        query,
        intent: responseCacheKey,
        cache: "bypass",
        diagnostics: execution.diagnostics,
      }));
      json(res, 200, { ...execution, results: withTrackedUrls(execution.results, origin) }, req);
      return;
    }

    // Nivel RETRIEVAL: si otra intención de la misma consulta amplia ya trajo
    // los resultados, se reutilizan y se vuelven a clasificar con ESTA
    // intención en vez de volver a golpear a las 9 farmacias. `rankByRelevance`
    // recalcula toda la evidencia desde los nombres, así que la anotación con
    // la que se guardaron no contamina esta respuesta.
    const retrieved = await getCachedRetrieval(retrievalCacheKey);
    let results;
    if (retrieved) {
      res.setHeader("x-search-retrieval-cache", "hit");
      results = rankByRelevance(intent, retrieved);
    } else {
      results = await searchMedications(intent, onlySlugs);
      await setCachedRetrieval(retrievalCacheKey, results);
    }

    await setCachedSearch(responseCacheKey, results);
    console.info(JSON.stringify({
      requestId,
      route: "/api/search",
      query,
      intent: responseCacheKey,
      cache: "miss",
      retrievalCache: retrieved ? "hit" : "miss",
      results: results.length,
    }));
    json(res, 200, withTrackedUrls(results, origin), req);

    // CF-SEARCH-012 (S1) — SHADOW DE SEARCH ENGINE v2. APAGADO POR DEFECTO.
    //
    // Va DESPUÉS de `json(...)`: la respuesta ya salió y nada de lo que ocurra
    // acá puede alterarla. `scheduleSearchV2Shadow` devuelve `void` a propósito
    // —no hay promesa que esperar por accidente— y encapsula el interruptor, el
    // muestreo, el timeout y el aislamiento de errores.
    //
    // Solo en el camino de MISS: una respuesta servida desde caché no trae
    // observaciones nuevas, y reprocesarla sería escritura sin información.
    // Tampoco corre en `debug=1` ni cuando la ruta devuelve un error.
    //
    // `results` se pasa por lectura. v1 sigue siendo la única fuente de verdad
    // visible: v2 no participa del payload, del orden, de los precios ni de los
    // slugs.
    scheduleSearchV2Shadow({ samplingKey: retrievalCacheKey, requestId, results });
  } catch (error) {
    if (error instanceof HttpError) {
      console.warn(JSON.stringify({
        requestId,
        route: "/api/search",
        statusCode: error.statusCode,
        error: error.message,
      }));
      json(res, error.statusCode, { error: error.message }, req);
      return;
    }

    console.error(JSON.stringify({
      requestId,
      route: "/api/search",
      statusCode: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
    captureException(error, { requestId, route: "/api/search" });
    json(res, 500, { error: "No se pudieron obtener los precios." }, req);
  }
}
