import { consumeRateLimit } from "../middleware/rateLimit.js";
import { attachRequestId } from "../middleware/requestId.js";
import { HttpError } from "../lib/errors.js";
import { captureException } from "../lib/sentry.js";
import { getClientIp, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { getPriceHistory } from "../lib/priceHistoryQuery.js";

const MIN_MATCH_KEY_LENGTH = 2;
const MAX_MATCH_KEY_LENGTH = 180;

function validateMatchKey(raw: string | null): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed.length < MIN_MATCH_KEY_LENGTH || trimmed.length > MAX_MATCH_KEY_LENGTH) {
    throw new HttpError("Debes indicar un matchKey valido (entre 2 y 180 caracteres).", 400);
  }
  return trimmed;
}

function parseDays(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function handlePriceHistoryRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const { requestId } = attachRequestId(req, res);

  try {
    if ((req.method ?? "GET").toUpperCase() !== "GET") {
      throw new HttpError("Metodo no permitido.", 405);
    }

    // Publico (Sprint SEC-001), igual que /api/search: web/ ya lo consulta
    // server-side sin x-api-key (mobile/ guarda su historial localmente y no
    // llama esta ruta). API_SECRET_KEY se reserva para debug=1 y para
    // /api/subscriptions grant-manual/revoke-manual.
    const clientIp = getClientIp(req);
    if (!(await consumeRateLimit(clientIp))) {
      throw new HttpError("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
    }

    const matchKey = validateMatchKey(getSearchParam(req, "matchKey"));
    const days = parseDays(getSearchParam(req, "days"));

    const result = await getPriceHistory(matchKey, days);

    console.info(JSON.stringify({
      requestId,
      route: "/api/price-history",
      matchKey,
      seriesCount: result.series.length,
    }));

    json(res, 200, result);
  } catch (error) {
    if (error instanceof HttpError) {
      console.warn(JSON.stringify({
        requestId,
        route: "/api/price-history",
        statusCode: error.statusCode,
        error: error.message,
      }));
      json(res, error.statusCode, { error: error.message });
      return;
    }

    console.error(JSON.stringify({
      requestId,
      route: "/api/price-history",
      statusCode: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    }));
    captureException(error, { requestId, route: "/api/price-history" });
    json(res, 500, { error: "No se pudo obtener el historico de precios." });
  }
}
