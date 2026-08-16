import { getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { isDebugAuthorized } from "../middleware/auth.js";
import { pingRedis } from "../lib/cache.js";
import { pingSupabase } from "../lib/supabaseClient.js";

// Marca de tiempo de arranque de esta instancia serverless — usada solo para
// `uptimeSeconds` (RC-03, Health Check Medio #8, restaurado 2026-08-13).
const START_TIME = Date.now();

function getAlgoliaStatus(): "configured" | "not_configured" {
  return process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY ? "configured" : "not_configured";
}

function isDebugMode(req: RequestLike): boolean {
  const debug = getSearchParam(req, "debug");
  return debug === "1" || debug === "true";
}

/**
 * `GET /api/health` — enriquecido de forma aditiva (RC-03, Health Check
 * Medio #8; documentado en docs/operations/RUNBOOK.md §6 y
 * docs/release/RC-03_PRODUCTION_READINESS_REPORT.md, nunca desplegado a
 * producción hasta ahora — ver PRODUCTION_INFRASTRUCTURE_AUDIT.md, Riesgo
 * Alto #5). `ok`/`service`/`timestamp` no cambian de significado — el
 * monitor existente (`monitor-api.yml`, que solo valida `ok:true`) sigue
 * funcionando sin cambios. Ningún secreto se expone en la respuesta, solo
 * nombres/estados.
 *
 * `?debug=1` (diagnóstico de cierre de producción, 2026-08-16 — investigación
 * UPSTASH_ROOT_CAUSE): agrega únicamente presencia booleana
 * (`Boolean(process.env.X)`) de las env vars de Upstash, NUNCA valores,
 * prefijos, longitudes ni hashes. Gateado por `isDebugAuthorized()` — mismo
 * mecanismo fail-closed que `/api/search?debug=1` (Sprint SEC-001): sin
 * `API_SECRET_KEY` configurado, `debug=1` siempre responde 403, nunca hay
 * fallback abierto. Temporal — remover cuando UPSTASH_ROOT_CAUSE quede
 * confirmado y resuelto.
 */
export async function handleHealthRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  const debugMode = isDebugMode(req);
  if (debugMode && !isDebugAuthorized(req)) {
    json(res, 403, { error: "No autorizado para modo debug." }, req);
    return;
  }

  const [redisStatus, supabaseStatus] = await Promise.all([pingRedis(), pingSupabase()]);
  const mem = process.memoryUsage();

  const body: Record<string, unknown> = {
    ok: true,
    service: "comparafarma-api",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV ?? "development",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : "unknown",
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    memoryMb: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    },
    dependencies: {
      redis: redisStatus,
      supabase: supabaseStatus,
      algolia: getAlgoliaStatus(),
    },
  };

  if (debugMode) {
    body.diagnostics = {
      env: {
        upstashUrlPresent: Boolean(process.env.UPSTASH_REDIS_REST_URL),
        upstashTokenPresent: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
      },
    };
  }

  json(res, 200, body, req);
}
