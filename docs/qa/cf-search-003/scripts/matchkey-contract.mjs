/**
 * CF-SEARCH-003 — prueba de que el contrato de `matchKey` NO cambio.
 *
 * `matchKey` es clave PERSISTIDA (`price_history`, `medication_match_key_aliases`,
 * `pharmacy_clicks`, `email_alerts`). Este script compara su salida entre la
 * compilacion de `origin/main` y la de la branch sobre TODOS los nombres de
 * producto reales capturados en ../raw/, y falla si difiere una sola.
 *
 * Se comparan ademas `presentationKey` y los otros ejes de identidad, para
 * distinguir "matchKey intacto" de "nada cambio": lo unico que debe cambiar es
 * el resultado de `mergeDuplicates`.
 *
 * Uso:
 *   QA_BASE_DIST=<dist de origin/main> node docs/qa/cf-search-003/scripts/matchkey-contract.mjs
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "..", "raw");
const OUT_DIR = join(HERE, "..", "analysis");

const BASE_DIST = process.env.QA_BASE_DIST;
const PR_DIST = process.env.QA_PR_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
if (!BASE_DIST) throw new Error("Falta QA_BASE_DIST (dist compilado de origin/main).");

const BASE = await import(pathToFileURL(BASE_DIST).href);
const PR = await import(pathToFileURL(PR_DIST).href);

const names = new Set();
const cardKeys = [];
for (const file of (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"))) {
  const env = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
  if (!Array.isArray(env.results)) continue;
  for (const card of env.results) {
    cardKeys.push({ name: card.canonicalName, matchKey: card.matchKey, presentationKey: card.presentationKey });
    for (const p of card.prices) names.add(p.productName);
  }
}

const axes = (M, name) => ({
  matchKey: M.matchKey(name),
  combinationKey: M.combinationKey(name),
  commercialVariantKey: M.commercialVariantKey(name),
  dosageFormClass: M.dosageFormClass(name),
  unitCountKey: M.unitCountKey(name),
});

const diffs = { matchKey: [], combinationKey: [], commercialVariantKey: [], dosageFormClass: [], unitCountKey: [] };
for (const name of names) {
  const a = axes(BASE, name);
  const b = axes(PR, name);
  for (const k of Object.keys(diffs)) {
    if (a[k] !== b[k]) diffs[k].push({ name, base: a[k], pr: b[k] });
  }
}

// Contraste adicional contra el valor que PRODUCCION ya emitio para cada tarjeta.
const productionMismatch = cardKeys.filter((c) => PR.matchKey(c.name) !== c.matchKey);

const summary = {
  generatedAt: new Date().toISOString(),
  baseDist: BASE_DIST,
  prDist: PR_DIST,
  uniqueProductNames: names.size,
  cardsChecked: cardKeys.length,
  differences: Object.fromEntries(Object.entries(diffs).map(([k, v]) => [k, v.length])),
  matchKeyIdenticalToProduction: productionMismatch.length === 0,
  productionMismatchCount: productionMismatch.length,
  verdict: diffs.matchKey.length === 0 ? "MATCHKEY_CONTRACT_INTACT" : "MATCHKEY_CONTRACT_BROKEN",
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, "matchkey-contract.json"), JSON.stringify({ summary, diffs, productionMismatch }, null, 1), "utf8");
console.log(JSON.stringify(summary, null, 2));
if (diffs.matchKey.length) {
  console.error("\nMATCHKEY CAMBIO:");
  for (const d of diffs.matchKey.slice(0, 20)) console.error(`  ${JSON.stringify(d.name)}  ${d.base} -> ${d.pr}`);
  process.exit(1);
}
