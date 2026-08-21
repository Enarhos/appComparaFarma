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
    expect(body).toMatch(/delete from subscription_events/);
    expect(body).toMatch(/delete from flow_customers/);
    expect(body).toMatch(/delete from subscriptions/);
    expect(body).toMatch(/delete from email_alerts/);
    expect(body).toMatch(/delete from feedback/);
    expect(body).toMatch(/delete from profiles/);
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
    expect(body).toMatch(/delete from email_alerts where lower\(email\) = lower\(p_email\)/);
    expect(body).toMatch(/delete from feedback where email is not null and lower\(email\) = lower\(p_email\)/);
  });
});
