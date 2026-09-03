/**
 * CF-SEARCH-012 (S1) — auditoría del TEXTO SQL de la migración del registro
 * canónico, sin necesitar una base de datos.
 *
 * Mismo mecanismo que `accountDeletionSql.test.ts`: el contrato de la migración
 * es demasiado importante para verificarlo solo en el código TypeScript que la
 * consume. Si alguien edita `schema.sql` y rompe una de las propiedades de
 * abajo, este test falla en CI.
 *
 * Las propiedades auditadas son las que el ticket declara innegociables:
 * aditividad, no tocar tablas legacy, UNIQUE que garantiza la idempotencia,
 * IDs de secuencia (no content-addressed), la relación N:M, y el shadow
 * apagado por defecto.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "../../../docs/technology/database/schema.sql");
const schemaSql = readFileSync(schemaPath, "utf-8");

/** La sección de S1: desde su cabecera hasta el final del archivo. */
const section = schemaSql.slice(schemaSql.indexOf("Search Engine v2 — S1"));

const REGISTRY_TABLES = [
  "canonical_concepts",
  "canonical_presentations",
  "canonical_products",
  "canonical_product_presentations",
  "canonical_signature_aliases",
  "canonical_offer_observations",
  "canonical_resolutions",
];

describe("migración del registro canónico — aditividad", () => {
  it("crea las siete tablas del registro", () => {
    expect(section.length).toBeGreaterThan(0);
    for (const table of REGISTRY_TABLES) {
      expect(section).toContain(`create table if not exists ${table} (`);
    }
  });

  it("NO altera, renombra ni borra ninguna tabla existente", () => {
    // Los únicos `alter table` admitidos son los `enable row level security`
    // sobre las tablas nuevas. Nada de `add column`, `drop`, `rename`.
    const alters = [...section.matchAll(/alter table ([a-z_.]+) ([a-z ]+)/g)];
    expect(alters.length).toBeGreaterThan(0);
    for (const [, table, action] of alters) {
      expect(REGISTRY_TABLES).toContain(table);
      expect(action.trim()).toBe("enable row level security");
    }
    expect(section).not.toMatch(/drop table/i);
    expect(section).not.toMatch(/alter table[\s\S]{0,80}drop column/i);
    expect(section).not.toMatch(/alter table[\s\S]{0,80}rename/i);
    expect(section).not.toMatch(/\btruncate\b/i);
    expect(section).not.toMatch(/\bdelete from\b/i);
  });

  it("no toca ninguna tabla de v1 ni de usuario", () => {
    const forbidden = [
      "price_history",
      "pharmacy_clicks",
      "email_alerts",
      "medication_match_key_aliases",
      "profiles",
      "subscriptions",
      "subscription_plans",
      "flow_customers",
      "account_deletion_requests",
      "auth.users",
    ];
    // Se buscan como OBJETO de una sentencia, no como mención en un comentario:
    // la cabecera de la sección las nombra justamente para declarar que no las
    // toca.
    const statements = section
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    for (const table of forbidden) {
      expect(statements).not.toContain(table);
    }
  });

  it("la única escritura sobre una tabla existente es la fila de configuración del shadow", () => {
    const statements = section
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    const inserts = [...statements.matchAll(/insert into ([a-z_]+)/g)].map((m) => m[1]);
    expect(inserts).toEqual(["app_config"]);
    expect(statements).toContain("on conflict (key) do nothing");
  });
});

describe("idempotencia y concurrencia", () => {
  it("cada entidad tiene UNIQUE sobre su firma canónica", () => {
    // Es la restricción que hace imposible que dos requests simultáneos con la
    // misma firma completa acuñen dos identificadores.
    for (const table of ["canonical_concepts", "canonical_presentations", "canonical_products"]) {
      const start = section.indexOf(`create table if not exists ${table} (`);
      const body = section.slice(start, section.indexOf(");", start));
      expect(body).toContain("canonical_signature text not null unique");
    }
  });

  it("el alias de firma tiene PK compuesta (entidad, versión, firma)", () => {
    expect(section).toContain("primary key (entity_kind, signature_version, signature)");
  });

  it("la observación es idempotente por su clave de origen", () => {
    expect(section).toContain("observation_key text not null unique");
  });

  it("el par producto × presentación tiene PK compuesta", () => {
    expect(section).toContain("primary key (product_id, presentation_id)");
  });

  it("todo el script es reejecutable (`if not exists` en tablas, índices y secuencias)", () => {
    // Correr el bloque completo de nuevo tiene que ser seguro: es la convención
    // de este esquema desde la Fase 1 y lo que permite mantener un solo
    // archivo como referencia de lo que se corrió.
    const creates = [...section.matchAll(/^create (table|index|sequence) (.*)$/gm)];
    expect(creates.length).toBeGreaterThan(10);
    for (const [line, , rest] of creates) {
      expect(rest.startsWith("if not exists ")).toBe(true);
      expect(line).toBeTruthy();
    }
  });
});

describe("identificadores permanentes", () => {
  it("los cuatro IDs salen de una SECUENCIA, no del contenido", () => {
    // Un ID derivado del contenido rotaría al mejorar el canonicalizador, y la
    // propiedad central de S1 es que NO rote.
    for (const [prefix, sequence] of [
      ["CFM-CONCEPT-", "canonical_concept_seq"],
      ["CFM-PRESENTATION-", "canonical_presentation_seq"],
      ["CFM-PRODUCT-", "canonical_product_seq"],
      ["CFM-OFFER-", "canonical_offer_seq"],
    ]) {
      expect(section).toContain(`create sequence if not exists ${sequence};`);
      expect(section).toContain(`default ('${prefix}' || lpad(nextval('${sequence}')::text, 6, '0'))`);
    }
  });

  it("el segmento de entidad evita colisionar con el espacio legacy `CFM-######`", () => {
    // `medications.cfm_id` (RFC-002) ya ocupa `CFM-000123` con una identidad
    // derivada de matchKey. Sin el segmento, un ID sería ambiguo entre dos
    // modelos de identidad distintos.
    expect(section).not.toMatch(/default \('CFM-' \|\|/);
  });

  it("ninguna FK une el registro v2 con la tabla legacy `medications`", () => {
    expect(section).not.toMatch(/references medications/);
  });
});

describe("cardinalidades del EDM", () => {
  it("presentación y producto referencian el CONCEPTO", () => {
    for (const table of ["canonical_presentations", "canonical_products"]) {
      const start = section.indexOf(`create table if not exists ${table} (`);
      const body = section.slice(start, section.indexOf(");", start));
      expect(body).toContain("concept_id text not null references canonical_concepts(id)");
    }
  });

  it("el producto NO referencia la presentación: la relación es N:M", () => {
    const start = section.indexOf("create table if not exists canonical_products (");
    const body = section.slice(start, section.indexOf(");", start));
    expect(body).not.toContain("references canonical_presentations");
    // Y la N:M existe como tabla propia.
    expect(section).toContain("create table if not exists canonical_product_presentations (");
  });

  it("los tres enlaces de la observación son NULLABLE", () => {
    const start = section.indexOf("create table if not exists canonical_offer_observations (");
    const body = section.slice(start, section.indexOf(");", start));
    for (const column of ["concept_id", "presentation_id", "product_id"]) {
      // `\b` es obligatorio: sin él, `product_id` casa dentro de
      // `source_product_id`, que sí es `not null` y no es un enlace.
      expect(body).toMatch(new RegExp(`\\b${column} text references canonical_\\w+\\(id\\)`));
      expect(body).not.toMatch(new RegExp(`\\b${column} text not null`));
    }
  });
});

describe("seguridad y privacidad", () => {
  it("las siete tablas tienen RLS habilitado", () => {
    for (const table of REGISTRY_TABLES) {
      expect(section).toContain(`alter table ${table} enable row level security;`);
    }
  });

  it("ninguna tabla concede acceso a anon/authenticated", () => {
    for (const table of REGISTRY_TABLES) {
      expect(section).toContain(`revoke all on table ${table}`);
    }
    expect(section).not.toMatch(/grant [\w, ]+ on table canonical_\w+\s+to (anon|authenticated)/);
    expect(section).not.toMatch(/create policy/);
  });

  it("las secuencias tienen sus propios revoke/grant (no heredan de la tabla)", () => {
    for (const sequence of [
      "canonical_concept_seq",
      "canonical_presentation_seq",
      "canonical_product_seq",
      "canonical_offer_seq",
      "canonical_resolutions_id_seq",
    ]) {
      expect(section).toContain(`revoke all on sequence ${sequence}`);
      expect(section).toContain(`grant usage, select on sequence ${sequence}`);
    }
  });

  it("el registro NO guarda precio, stock ni ningún dato personal", () => {
    // Es un registro de IDENTIDAD. El precio ya vive en price_history y
    // duplicarlo crearía una segunda fuente de verdad comercial.
    const statements = section
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    for (const column of [
      "price",
      "effective_price",
      "store_price",
      "stock",
      "email",
      "user_id",
      "ip_address",
      "session",
      "query",
      "user_agent",
    ]) {
      expect(statements).not.toContain(` ${column} `);
    }
  });
});

describe("el shadow arranca apagado", () => {
  it("la fila de configuración se inserta con enabled=false y sampleRate=0", () => {
    expect(section).toContain(`'{"enabled": false, "sampleRate": 0}'::jsonb`);
    expect(section).toContain("'search_v2_shadow'");
  });
});
