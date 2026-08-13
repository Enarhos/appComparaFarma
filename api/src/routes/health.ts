import { json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { pingRedis } from "../lib/cache.js";
import { pingSupabase } from "../lib/supabaseClient.js";

// Marca de tiempo de arranque de esta instancia serverless — usada solo para
// `uptimeSeconds` (RC-03, Health Check Medio #8, restaurado 2026-08-13).
const START_TIME = Date.now();

function getAlgoliaStatus(): "configured" | "not_configured" {
  return process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY ? "configured" : "not_configured";
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
 */
export async function handleHealthRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;

  const [redisStatus, supabaseStatus] = await Promise.all([pingRedis(), pingSupabase()]);
  const mem = process.memoryUsage();

  json(res, 200, {
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
  }, req);
}
