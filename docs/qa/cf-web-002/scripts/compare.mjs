/**
 * CF-WEB-002 — comparación A/B de las dos corridas de `nav-audit.mjs`.
 *
 * Empareja los enlaces por `generatedURL` (el corpus fuente es el mismo, así
 * que los enlaces generados son idénticos) y reporta:
 *   - las métricas agregadas antes y después,
 *   - cada enlace que cambió de clasificación, en las dos direcciones
 *     (`fixed` y `regressed`) — una regresión no se puede esconder detrás de
 *     un promedio que mejora.
 *
 * Uso: node docs/qa/cf-web-002/scripts/compare.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ANALYSIS = join(dirname(fileURLToPath(import.meta.url)), "..", "analysis");

const read = async (name) => JSON.parse(await readFile(join(ANALYSIS, name), "utf8"));

const baseline = await read("baseline.json");
const fixed = await read("fixed.json");

const RESOLVED = new Set(["RESOLVED_EXACT", "REDIRECTED"]);

const baseRows = new Map(baseline.rows.map((r) => [r.generatedURL, r]));
const fixedRows = new Map(fixed.rows.map((r) => [r.generatedURL, r]));

const changed = [];
for (const [url, before] of baseRows) {
  const after = fixedRows.get(url);
  if (!after || after.classification === before.classification) continue;
  changed.push({
    url,
    query: before.query,
    from: before.classification,
    to: after.classification,
    direction: RESOLVED.has(after.classification) && !RESOLVED.has(before.classification)
      ? "fixed"
      : RESOLVED.has(before.classification) && !RESOLVED.has(after.classification)
        ? "regressed"
        : "lateral",
    sourceCanonicalName: before.source.canonicalName,
    sourcePresentationKey: before.source.presentationKey,
    resolvedCanonicalName: after.resolved?.canonicalName ?? null,
  });
}

const delta = (key) => ({
  baseline: baseline.summary[key],
  fixed: fixed.summary[key],
  delta: +(fixed.summary[key] - baseline.summary[key]).toFixed(1),
});

const comparison = {
  baselineLabel: `${baseline.summary.label} (origin/main 5a1e7e3)`,
  fixedLabel: `${fixed.summary.label} (fix/cf-web-002-detail-resolution)`,
  sameCorpus: baseline.summary.totalSearchResults === fixed.summary.totalSearchResults,
  comparedURLs: [...baseRows.keys()].filter((u) => fixedRows.has(u)).length,
  metrics: Object.fromEntries(
    [
      "generatedDetailURLs",
      "resolvedExact",
      "redirected",
      "resolvedWrongProduct",
      "ambiguous",
      "notFound",
      "error",
      "resolutionRate",
      "wrongProductRate",
      "notFoundRate",
      "staticCollisions",
      "staticCollidingCards",
      "legacyResolved",
    ].map((key) => [key, delta(key)])
  ),
  changedCount: {
    fixed: changed.filter((c) => c.direction === "fixed").length,
    regressed: changed.filter((c) => c.direction === "regressed").length,
    lateral: changed.filter((c) => c.direction === "lateral").length,
  },
  changed,
};

await writeFile(join(ANALYSIS, "comparison.json"), JSON.stringify(comparison, null, 1), "utf8");
console.log(JSON.stringify({ ...comparison, changed: `${changed.length} enlaces (ver comparison.json)` }, null, 2));
