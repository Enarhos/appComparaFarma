/**
 * CF-SEARCH-010 — captura read-only del corpus de auditoria.
 *
 * GET publico a /api/search de produccion. No usa ?debug=1 (requiere
 * API_SECRET_KEY, no solicitada), no envia credenciales, no escribe nada
 * en ninguna base de datos.
 *
 *   node docs/qa/cf-search-010/scripts/fetch-raw.mjs [--set corpus|extra|all]
 *
 * Salida: docs/qa/cf-search-010/raw/<id>.json — sobre con url, status,
 * timestamps y cuerpo, sin cabeceras.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(HERE, "..", "raw");
const API = "https://comparafarma-api.vercel.app/api/search";

const setName = (() => {
  const i = process.argv.indexOf("--set");
  return i >= 0 ? process.argv[i + 1] : "all";
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
    const n = Array.isArray(body) ? body.length : 0;
    console.log(`${id.padEnd(24)} status=${status} cards=${n}`);
    await new Promise((r) => setTimeout(r, 1200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
