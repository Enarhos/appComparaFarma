import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Audita el texto de `delete_account_data()` en docs/technology/database/
// schema.sql — belt-and-suspenders directo sobre el SQL, no solo sobre el
// código TypeScript que la invoca (sección 10: "Agrega tests que
// demuestren que el flujo NO toca" los activos de inteligencia
// farmacéutica). Si alguien edita la función SQL para tocar una tabla
// prohibida, este test debe fallar sin necesitar una base de datos real.

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "../../../docs/technology/database/schema.sql");
const schemaSql = readFileSync(schemaPath, "utf-8");

function extractFunctionBody(sql: string, functionName: string): string {
  const marker = `function public.${functionName}`;
  const start = sql.indexOf(marker);
  if (start === -1) throw new Error(`function ${functionName} not found in schema.sql`);
  const bodyStart = sql.indexOf("as $$", start);
  const bodyEnd = sql.indexOf("$$;", bodyStart);
  return sql.slice(bodyStart, bodyEnd);
}

describe("delete_account_data() — auditoría del texto SQL", () => {
  const body = extractFunctionBody(schemaSql, "delete_account_data");

  it("borra las tablas de datos personales esperadas", () => {
    // `public.` es opcional en el match — GATE_INFRA_HARDENING calificó
    // las referencias dentro de la función (public.subscription_events,
    // etc.) como defensa en profundidad adicional al `search_path` ya
    // fijado; el comportamiento (qué tabla se borra) no cambia.
    expect(body).toMatch(/delete from (public\.)?subscription_events/);
    expect(body).toMatch(/delete from (public\.)?flow_customers/);
    expect(body).toMatch(/delete from (public\.)?subscriptions\b/);
    expect(body).toMatch(/delete from (public\.)?email_alerts/);
    expect(body).toMatch(/delete from (public\.)?feedback/);
    expect(body).toMatch(/delete from (public\.)?profiles/);
  });

  it("NUNCA menciona ninguna tabla de inteligencia farmacéutica no personal", () => {
    const forbidden = [
      "price_history",
      "pharmacy_clicks",
      "medications",
      "medication_match_key_aliases",
      "subscription_plans",
      "app_config",
    ];
    for (const table of forbidden) {
      expect(body).not.toContain(table);
    }
  });

  it("email_alerts y feedback se filtran por email (case-insensitive), no por user_id (no tienen esa columna)", () => {
    expect(body).toMatch(/delete from (public\.)?email_alerts where lower\(email\) = lower\(p_email\)/);
    expect(body).toMatch(/delete from (public\.)?feedback where email is not null and lower\(email\) = lower\(p_email\)/);
  });
});

describe("migración AUTH-DELETE-01 — grants/revokes (GATE_INFRA_HARDENING)", () => {
  // Auditoría de texto sobre el script final de schema.sql — no sustituye
  // las verification queries reales contra Supabase (sección C del informe
  // de infraestructura), pero garantiza que nadie borre estas líneas sin
  // que un test falle, y que el hallazgo de la auditoría de RPC no regrese
  // silenciosamente en un futuro edit del archivo.

  it("revoca EXECUTE de delete_account_data() a public/anon/authenticated", () => {
    expect(schemaSql).toMatch(/revoke execute on function public\.delete_account_data\(uuid, text\) from public;/);
    expect(schemaSql).toMatch(/revoke execute on function public\.delete_account_data\(uuid, text\) from anon;/);
    expect(schemaSql).toMatch(/revoke execute on function public\.delete_account_data\(uuid, text\) from authenticated;/);
  });

  it("concede EXECUTE de delete_account_data() únicamente a service_role", () => {
    expect(schemaSql).toMatch(/grant execute on function public\.delete_account_data\(uuid, text\) to service_role;/);
  });

  it("revoca todo privilegio sobre account_deletion_requests a anon/authenticated y lo concede a service_role", () => {
    expect(schemaSql).toMatch(/revoke all on table public\.account_deletion_requests from anon;/);
    expect(schemaSql).toMatch(/revoke all on table public\.account_deletion_requests from authenticated;/);
    expect(schemaSql).toMatch(/grant all on table public\.account_deletion_requests to service_role;/);
  });

  it("revoca/concede privilegios sobre la sequence identity de account_deletion_requests.id", () => {
    // GENERATED ALWAYS AS IDENTITY: el privilegio de tabla no cubre la
    // sequence implícita — nextval() vía DEFAULT requiere USAGE propio.
    expect(schemaSql).toMatch(/revoke all on sequence public\.account_deletion_requests_id_seq from anon;/);
    expect(schemaSql).toMatch(/revoke all on sequence public\.account_deletion_requests_id_seq from authenticated;/);
    expect(schemaSql).toMatch(/grant usage, select on sequence public\.account_deletion_requests_id_seq to service_role;/);
  });

  it("la migración corre como una sola transacción (begin ... commit) envolviendo DDL + función + revokes + grants", () => {
    const beginIdx = schemaSql.indexOf("begin;");
    const commitIdx = schemaSql.lastIndexOf("commit;");
    expect(beginIdx).toBeGreaterThan(-1);
    expect(commitIdx).toBeGreaterThan(beginIdx);

    const transactionBody = schemaSql.slice(beginIdx, commitIdx);
    expect(transactionBody).toContain("create table if not exists public.account_deletion_requests");
    expect(transactionBody).toContain("create or replace function public.delete_account_data");
    expect(transactionBody).toContain("revoke execute on function public.delete_account_data(uuid, text) from public;");
    expect(transactionBody).toContain("grant execute on function public.delete_account_data(uuid, text) to service_role;");
  });

  it("no queda ningún rastro del draft inseguro original (sin revoke/grant) en el archivo", () => {
    // El draft original no calificaba las tablas dentro de la función con
    // `public.` — si volviera a aparecer sin los revoke/grant de esta
    // sección, sería el mismo hallazgo de seguridad regresando.
    const grantCount = (schemaSql.match(/grant execute on function public\.delete_account_data/g) ?? []).length;
    expect(grantCount).toBe(1); // una sola definición vigente, no un draft + una versión corregida
  });
});
