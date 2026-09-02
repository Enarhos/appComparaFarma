/**
 * CF-SEARCH-011 S0 — captura read-only del corpus congelado.
 *
 * Mismo mecanismo que `docs/qa/cf-search-010/scripts/fetch-raw.mjs`: GET publico
 * a `/api/search` de produccion, sin `?debug=1`, sin credenciales, sin escribir
 * en ninguna base de datos. La respuesta que devuelve el endpoint es la salida
 * de v1 YA FUSIONADA (`MedicationResult[]`), asi que cada sobre contiene, a la
 * vez, la agrupacion de v1 y las ofertas crudas que v2 debe reprocesar.
 *
 *   node docs/qa/cf-search-011/scripts/fetch-raw.mjs [--set corpus|extra|all]
 *
 * Salida: docs/qa/cf-search-011/raw/<id>.json (NO se commitea — ver README §
 * "Reproducibilidad": es un dump regenerable, y `docs/qa/cf-search-011/.gitignore`
 * lo excluye).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(HERE, "..", "raw");
const API = process.env.QA_API_BASE ?? "https://comparafarma-api.vercel.app/api/search";

const setName = (() => {
  const i = process.argv.indexOf("--set");
  return i >= 0 ? process.argv[i + 1] : "corpus";
})();

async function main() {
  const queries = JSON.parse(await readFile(resolve(HERE, "queries.json"), "utf8"));
  const list =
    setName === "corpus" ? queries.corpus
    : setName === "extra" ? queries.extra
    : [...queries.corpus, ...queries.extra];

  await mkdir(RAW_DIR, { recursive: true });

  for (const { id, q } of list) {
    const url = `${API}?q=${encodeURIComponent(q)}`;
    const startedAt = new Date().toISOString();
    let status = 0;
    let body = null;
    let error = null;
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      status = res.status;
      body = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const finishedAt = new Date().toISOString();
    await writeFile(
      resolve(RAW_DIR, `${id}.json`),
      JSON.stringify({ id, query: q, url, method: "GET", status, startedAt, finishedAt, error, body }, null, 2),
      "utf8"
    );
    const cards = Array.isArray(body) ? body.length : 0;
    const offers = Array.isArray(body) ? body.reduce((a, c) => a + (c.prices?.length ?? 0), 0) : 0;
    console.log(`${id.padEnd(24)} status=${status} cards=${cards} offers=${offers}`);
    await new Promise((r) => setTimeout(r, 1200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
