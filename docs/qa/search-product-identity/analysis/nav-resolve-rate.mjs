/**
 * CF-QA-001 — Test 6 (b): tasa de resolucion tarjeta -> ficha en Web de
 * produccion. Read-only, solo GET.
 *
 * Toma los enlaces /medicamento/<slug> que la PROPIA pagina de resultados
 * publica y comprueba si la ficha resuelve. Un enlace que la app acaba de
 * emitir y que devuelve "Medicamento no encontrado" es navegacion rota
 * observable por un usuario, no un link viejo.
 *
 * Uso:  node docs/qa/search-product-identity/analysis/nav-resolve-rate.mjs
 * Salida: nav-resolve-rate.json
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = "https://www.preciosfarma.cl";
const QUERIES = ["diclofenaco", "tapsin", "clotrimazol", "paracetamol", "ibuprofeno", "omeprazol", "losartan", "glicerina"];
const PER_QUERY = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const rows = [];
  for (const query of QUERIES) {
    const html = await (await fetch(`${WEB}/buscar/${encodeURIComponent(query)}`)).text();
    const slugs = [...new Set(html.match(/\/medicamento\/[a-z0-9-]+/g) ?? [])].slice(0, PER_QUERY);
    for (const slug of slugs) {
      const res = await fetch(`${WEB}${slug}`);
      const body = await res.text();
      const title = (body.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? null;
      const resolved = !/Medicamento no encontrado/.test(title ?? "");
      rows.push({ query, slug, httpStatus: res.status, title, resolved, checkedAt: new Date().toISOString() });
      console.log(`${resolved ? "OK  " : "DEAD"} ${res.status} ${slug}`);
      await sleep(500);
    }
  }
  const total = rows.length;
  const dead = rows.filter((r) => !r.resolved);
  const summary = {
    total,
    resolved: total - dead.length,
    dead: dead.length,
    deadPct: +((dead.length / total) * 100).toFixed(1),
    deadByQuery: dead.reduce((a, r) => ((a[r.query] = (a[r.query] ?? 0) + 1), a), {}),
    allHttp200: rows.every((r) => r.httpStatus === 200),
  };
  await writeFile(join(HERE, "nav-resolve-rate.json"), JSON.stringify({ summary, rows }, null, 1), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main();
