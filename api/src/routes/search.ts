import { isAuthorized } from "../middleware/auth.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";
import { attachRequestId } from "../middleware/requestId.js";
import { getCachedSearch, setCachedSearch } from "../lib/cache.js";
import { HttpError } from "../lib/errors.js";
import { getClientIp, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { cleanQuery } from "../lib/normalization.js";
import { searchMedications, searchMedicationsDetailed } from "../services/searchService.js";

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
    if (!consumeRateLimit(clientIp)) {
      throw new HttpError("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
    }

    const debugMode = isDebugMode(req);
    const query = validateQuery(getSearchParam(req, "q"));
    const cacheKey = query.toLowerCase();
    if (!debugMode) {
      const cached = getCachedSearch(cacheKey);
      if (cached) {
        res.setHeader("x-search-cache", "hit");
        console.info(JSON.stringify({
          requestId,
          route: "/api/search",
          query,
          cache: "hit",
          results: cached.length,
        }));
        json(res, 200, cached);
        return;
      }
    }

    res.setHeader("x-search-cache", "miss");

    if (debugMode) {
      const execution = await searchMedicationsDetailed(query);
      console.info(JSON.stringify({
        requestId,
        route: "/api/search",
        query,
        cache: "bypass",
        diagnostics: execution.diagnostics,
      }));
      json(res, 200, execution);
      return;
    }

    const results = await searchMedications(query);
    setCachedSearch(cacheKey, results);
    console.info(JSON.stringify({
      requestId,
      route: "/api/search",
      query,
      cache: "miss",
      results: results.length,
    }));
    json(res, 200, results);
  } catch (error) {
    if (error instanceof HttpError) {
      console.warn(JSON.stringify({
        requestId,
        route: "/api/search",
        statusCode: error.statusCode,
        error: error.message,
      }));
      json(res, error.statusCode, { error: error.message });
      return;
    }

    console.error(JSON.stringify({
      requestId,
      route: "/api/search",
      statusCode: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
    json(res, 500, { error: "No se pudieron obtener los precios." });
  }
}
