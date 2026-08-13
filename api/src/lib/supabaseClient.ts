import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
} catch (err) {
  console.error("Supabase init failed:", err);
}

export const supabase = client;

const HEALTHCHECK_TIMEOUT_MS = 1500;

/**
 * Ping real de Supabase para `/api/health` (RC-03, Health Check Medio #8 —
 * restaurado 2026-08-13, ver docs/operations/RUNBOOK.md §6). Lee una sola
 * fila de `app_config` (misma tabla y patrón que `appConfigDb.ts`) solo para
 * confirmar conectividad — no expone ningún dato ni secreto en la respuesta.
 * `"not_configured"` si `SUPABASE_URL`/`SUPABASE_SECRET_KEY` no están
 * presentes; `"degraded"` si la consulta falla o excede el timeout; `"ok"`
 * en caso contrario.
 */
export async function pingSupabase(): Promise<"ok" | "degraded" | "not_configured"> {
  if (!client) return "not_configured";
  try {
    const result = await Promise.race([
      client.from("app_config").select("key").limit(1),
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("timeout")), HEALTHCHECK_TIMEOUT_MS)),
    ]);
    if (result.error) return "degraded";
    return "ok";
  } catch (err) {
    console.warn("[health] Supabase ping failed", err);
    return "degraded";
  }
}
