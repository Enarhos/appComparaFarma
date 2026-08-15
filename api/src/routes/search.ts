import { isAuthorized, isDebugAuthorized } from "../middleware/auth.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";
import { attachRequestId } from "../middleware/requestId.js";
import { getCachedSearch, setCachedSearch } from "../lib/cache.js";
import { HttpError } from "../lib/errors.js";
import { captureException } from "../lib/sentry.js";
import { getClientIp, getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { withTrackedUrls } from "../lib/clickTracking.js";
import { cleanQuery } from "@comparafarma/domain";
import { searchMedications, searchMedicationsDetailed } from "../services/searchService.js";
import { probeEasyFarma } from "../clients/easyfarma.js";

function getOrigin(req: RequestLike): string {
  const host = getHeader(req, "x-forwarded-host") ?? getHeader(req, "host") ?? "comparafarma-api.vercel.app";
  return `https://${host}`;
}

function validateQuery(rawQuery: string | null): string {
  if (!rawQuery || rawQuery.trim().length < 2) {
    throw new HttpError("Debes indicar un termino de busqueda valido.", 400);
  }
  if (rawQuery.length > 120) {
    throw new HttpError("La busqueda es demasiado larga.", 400);
  }

  const cleaned = cleanQuery(rawQuery);
  if (!cleaned) {
    throw new HttpError("No se pudo interpretar la busqueda.", 400);
  }
  return cleaned;
}

function isDebugMode(req: RequestLike): boolean {
  const debug = getSearchParam(req, "debug");
  return debug === "1" || debug === "true";
}

// Diagnóstico temporal (ver api/src/clients/easyfarma.ts): solo se activa con
// ?debug=1&easyfarmaProbe=1, exigiendo el mismo isDebugAuthorized() de siempre.
// No cambia el comportamiento habitual de ?debug=1 (usado por Monitor API), que
// nunca envía este flag adicional.
const EASYFARMA_PROBE_PARAM = "easyfarmaProbe";

function isEasyFarmaProbeRequested(req: RequestLike): boolean {
  const flag = getSearchParam(req, EASYFARMA_PROBE_PARAM);
  return flag === "1" || flag === "true";
}

export async function handleSearchRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const { requestId } = attachRequestId(req, res);

  try {
    if ((req.method ?? "GET").toUpperCase() !== "GET") {
      throw new HttpError("Metodo no permitido.", 405);
    }

    if (!isAuthorized(req)) {
      throw new HttpError("No autorizado.", 401);
    }

    const clientIp = getClientIp(req);
    if (!(await consumeRateLimit(clientIp))) {
      throw new HttpError("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
    }

    const debugMode = isDebugMode(req);
    if (debugMode && !isDebugAuthorized(req)) {
      throw new HttpError("No autorizado para modo debug.", 403);
    }

    const query = validateQuery(getSearchParam(req, "q"));

    // Filtro geográfico: ?pharmacies=cruz-verde,dr-simi
    const pharmaciesParam = getSearchParam(req, "pharmacies");
    const onlySlugs = pharmaciesParam
      ? (pharmaciesParam.split(",").map((s) => s.trim()).filter(Boolean) as import("../lib/types.js").PharmacySlug[])
      : undefined;

    const origin = getOrigin(req);
    const cacheKey = query.toLowerCase() + (onlySlugs ? `:${[...onlySlugs].sort().join(",")}` : "");
    if (!debugMode) {
      const cached = await getCachedSearch(cacheKey);
      if (cached) {
        res.setHeader("x-search-cache", "hit");
        console.info(JSON.stringify({
          requestId,
          route: "/api/search",
          query,
          cache: "hit",
          results: cached.length,
        }));
        json(res, 200, withTrackedUrls(cached, origin), req);
        return;
      }
    }

    res.setHeader("x-search-cache", "miss");

    if (debugMode) {
      const execution = await searchMedicationsDetailed(query, onlySlugs);

      // Diagnóstico temporal y aislado (no afecta el resto de la respuesta ni
      // el camino que usa Monitor API, que nunca envía este flag). Ver
      // api/src/clients/easyfarma.ts#probeEasyFarma para el detalle de qué
      // hace y las garantías de seguridad de su salida (sin cookies, tokens
      // ni HTML completo).
      const easyfarmaProbe = isEasyFarmaProbeRequested(req)
        ? await probeEasyFarma(query).catch((err) => ({
            error: err instanceof Error ? err.message : "Unknown error",
          }))
        : undefined;

      console.info(JSON.stringify({
        requestId,
        route: "/api/search",
        query,
        cache: "bypass",
        diagnostics: execution.diagnostics,
        ...(easyfarmaProbe ? { easyfarmaProbe } : {}),
      }));
      json(
        res,
        200,
        {
          ...execution,
          results: withTrackedUrls(execution.results, origin),
          ...(easyfarmaProbe ? { easyfarmaProbe } : {}),
        },
        req
      );
      return;
    }

    const results = await searchMedications(query, onlySlugs);
    await setCachedSearch(cacheKey, results);
    console.info(JSON.stringify({
      requestId,
      route: "/api/search",
      query,
      cache: "miss",
      results: results.length,
    }));
    json(res, 200, withTrackedUrls(results, origin), req);
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
