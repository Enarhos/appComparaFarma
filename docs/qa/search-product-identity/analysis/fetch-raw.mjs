/**
 * CF-QA-001 — captura RAW read-only del endpoint publico de busqueda.
 *
 * Uso:  node docs/qa/search-product-identity/analysis/fetch-raw.mjs
 *
 * - GET publico, sin headers de autenticacion, sin cookies, sin secretos.
 * - No usa ?debug=1 (requiere API_SECRET_KEY; no se usa ni se solicita en esta campana).
 * - Guarda un sobre por query en ../raw/<slug>.json con url, timestamp y status.
 * - Secuencial con pausa: el endpoint limita a 60 req/min por IP.
 *
 * NO forma parte del runtime. Vive solo en docs/qa/.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "..", "raw");
const ENDPOINT = "https://comparafarma-api.vercel.app/api/search";

const slug = (q) => q.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cfg = JSON.parse(await readFile(join(HERE, "queries.json"), "utf8"));
  const queries = [...cfg.blockA, ...cfg.blockB];
  await mkdir(RAW_DIR, { recursive: true });

  for (const query of queries) {
    const url = `${ENDPOINT}?q=${encodeURIComponent(query)}`;
    const startedAt = new Date().toISOString();
    let status = null;
    let body = null;
    let error = null;
    try {
      const res = await fetch(url, { method: "GET" });
      status = res.status;
      body = await res.json();
    } catch (err) {
      error = String(err);
    }
    const envelope = {
      campaign: "CF-QA-001",
      query,
      endpoint: ENDPOINT,
      url,
      method: "GET",
      auth: "none (endpoint publico)",
      requestedAt: startedAt,
      completedAt: new Date().toISOString(),
      httpStatus: status,
      error,
      resultCount: Array.isArray(body) ? body.length : null,
      results: body,
    };
    await writeFile(join(RAW_DIR, `${slug(query)}.json`), JSON.stringify(envelope, null, 2), "utf8");
    console.log(`${query} -> ${status} (${Array.isArray(body) ? body.length : "?"} cards)`);
    await sleep(1200);
  }
}

main();
