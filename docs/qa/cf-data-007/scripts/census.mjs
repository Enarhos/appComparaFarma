/**
 * CF-DATA-007 — CENSO DEL RESIDUAL DE GATE A.
 *
 * OFFLINE Y REPRODUCIBLE. Corre sobre EL MISMO corpus congelado que usó S1
 * (`docs/qa/cf-search-012/raw/`), con EL MISMO camino de asignación persistente
 * (`assignIdentity` contra `InMemoryCanonicalRegistry`, convergido). No toca la
 * red, no escribe en ninguna base productiva y no enciende el shadow.
 *
 *   node docs/qa/cf-data-007/scripts/census.mjs
 *
 * QUÉ PRODUCE
 *   analysis/residual-census.csv   una fila por observación SIN identidad asignada
 *   analysis/census-summary.json   conteos por categoría, farmacia y consulta
 *   analysis/candidates.json       candidatos de token de las categorías A y B
 *
 * DEFINICIÓN DE GATE A USADA ACÁ, SIN SUSTITUTOS (ratificada por Mario el
 * 2026-09-03, `docs/qa/cf-search-012/DECISION.md` §0):
 *
 *     Gate A = observaciones con IDENTIDAD CANÓNICA ASIGNADA / observaciones totales
 *
 * "Identidad canónica asignada" = `assignment.concept.entityId !== null`. NO se
 * usa "representada en el registro", "linaje completo" ni "observación
 * registrada" como numerador alternativo. La cobertura de pipeline se calcula y
 * se reporta, pero JAMÁS como Gate A.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const RAW_DIR = resolve(ROOT, "docs/qa/cf-search-012/raw");
const OUT_DIR = resolve(HERE, "..", "analysis");

const DOMAIN_DIST = process.env.QA_DOMAIN_DIST ?? resolve(ROOT, "packages/domain/dist/index.js");
const DOMAIN_V2_DIST =
  process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js");

const { matchKey, COMPOSITION_VOCABULARY, combinationKey, brandFromName } = await import(
  pathToFileURL(DOMAIN_DIST).href
);

const {
  assignIdentity,
  canonicalizeOffer,
  conceptSignature,
  InMemoryCanonicalRegistry,
  isMintableConceptSignature,
  signatureText,
  readIngredientComposition,
  V2_MOLECULE_VOCABULARY,
  ION_AND_SALT_TOKENS,
} = await import(pathToFileURL(DOMAIN_V2_DIST).href);

// ---------------------------------------------------------------------------
// 1. CORPUS CONGELADO — idéntico a `s1-eval.mjs` (misma unidad de medida)
// ---------------------------------------------------------------------------

function readUpstreamRows(envelope) {
  const rows = [];
  const cards = Array.isArray(envelope.body) ? envelope.body : [];
  cards.forEach((card, cardIndex) => {
    const offers = card.prices ?? [];
    offers.forEach((price) => {
      rows.push({
        queryId: envelope.id,
        query: envelope.query,
        cardIndex,
        v1CardKey: `${envelope.id}#${cardIndex}`,
        pharmacy: price.pharmacySlug,
        rawName: price.productName ?? "",
        channels: price.channels ?? null,
        hasStock: price.hasStock ?? null,
        onlineUrl: price.onlineUrl ?? null,
        fetchedAt: price.fetchedAt ?? envelope.startedAt,
        legacyPresentationKey: card.presentationKey ?? null,
        cardBrand: card.brand ?? null,
        cardBrandSource: card.brandSource ?? null,
        cardManufacturer: card.manufacturer ?? null,
        cardIsBioequivalent: card.isBioequivalent ?? null,
        offersInCard: offers.length,
      });
    });
  });
  return rows;
}

function toObservation(row) {
  const unambiguous = row.offersInCard === 1;
  const sourceProductId = row.onlineUrl ?? row.rawName;
  const attributes = canonicalizeOffer({
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    price: row.channels ?? { store: 0, online: null, cmr: null, sbpay: null, effective: 0 },
    stock: row.hasStock,
    url: row.onlineUrl,
    capturedAt: row.fetchedAt,
    sourceProductId,
    structuredBrand: unambiguous && row.cardBrandSource === "structured" ? row.cardBrand : null,
    structuredManufacturer: unambiguous ? row.cardManufacturer : null,
    isBioequivalent: row.cardIsBioequivalent,
    ispRegistration: null,
    legacyPresentationKey: row.legacyPresentationKey,
  });
  return {
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    sourceProductId,
    observedAt: row.fetchedAt ?? "1970-01-01T00:00:00.000Z",
    attributes,
    upstreamFields: {
      brand: unambiguous && row.cardBrandSource === "structured" ? row.cardBrand : null,
      manufacturer: unambiguous ? row.cardManufacturer : null,
      isBioequivalent: row.cardIsBioequivalent === null ? null : String(row.cardIsBioequivalent),
      ispRegistration: null,
      url: row.onlineUrl,
    },
    legacyMatchKey: matchKey(row.rawName),
    legacyPresentationKey: row.legacyPresentationKey,
  };
}

const obsKey = (row) => `${row.pharmacy}|${(row.onlineUrl ?? row.rawName).trim().toLowerCase()}`;

// ---------------------------------------------------------------------------
// 2. REGISTRO CONVERGIDO — mismo procedimiento que S1
// ---------------------------------------------------------------------------

async function buildAndConverge(observations, maxPasses = 5) {
  const registry = new InMemoryCanonicalRegistry();
  const assignments = new Map();
  for (const { key, input } of observations) {
    assignments.set(key, await assignIdentity(registry, input));
  }
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = 0;
    for (const { key, input } of observations) {
      const before = assignments.get(key)?.concept.entityId ?? null;
      const again = await assignIdentity(registry, input);
      if ((again.concept.entityId ?? null) !== before) changed += 1;
      assignments.set(key, again);
    }
    if (changed === 0) break;
  }
  return { registry, assignments };
}

// ---------------------------------------------------------------------------
// 3. FEATURES DE DIAGNÓSTICO POR OBSERVACIÓN
// ---------------------------------------------------------------------------

const MOLECULE_VOCABULARY = new Set([...COMPOSITION_VOCABULARY, ...V2_MOLECULE_VOCABULARY]);

function stripAccentsLower(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Palabras alfabéticas del nombre, en orden, sin acentos y en minúscula. */
function words(name) {
  return stripAccentsLower(name)
    .replace(/(\w)-(\w)/g, "$1$2")
    .match(/[a-z]+/g) ?? [];
}

/** Ejes de la firma de concepto que NO están declarados. */
function unknownConceptAxes(attributes) {
  return conceptSignature(attributes)
    .axes.filter((axis) => !axis.known)
    .map((axis) => axis.name);
}

/**
 * Por qué esta observación no pudo ACUÑAR, con la misma semántica de tres
 * niveles de concentración que usa `isMintableConceptSignature`.
 */
function mintBlockers(attributes) {
  const blockers = [];
  if (attributes.canonicalDosageForm === null) blockers.push("no-form");
  if (attributes.concentration.kind === "absent") blockers.push("no-concentration");
  else if (attributes.concentration.kind === "mass-only") blockers.push("mass-only-concentration");
  for (const axis of unknownConceptAxes(attributes)) {
    if (axis === "conc") continue;
    blockers.push(`unknown-axis:${axis}`);
  }
  return blockers;
}

// ---------------------------------------------------------------------------
// 4. MAIN
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const envelopes = [];
  for (const file of files) {
    envelopes.push(JSON.parse(await readFile(resolve(RAW_DIR, file), "utf8")));
  }
  const rows = envelopes.flatMap(readUpstreamRows).filter((r) => r.rawName.trim().length > 0);

  const uniqueMap = new Map();
  const queriesOf = new Map();
  for (const row of rows) {
    const key = obsKey(row);
    if (!uniqueMap.has(key)) uniqueMap.set(key, { key, row, input: toObservation(row) });
    queriesOf.set(key, new Set([...(queriesOf.get(key) ?? []), row.query]));
  }
  const observations = [...uniqueMap.values()];

  const { assignments } = await buildAndConverge(observations);

  // ---- Censo ---------------------------------------------------------------
  const census = [];
  for (const o of observations) {
    const a = assignments.get(o.key);
    const attrs = o.input.attributes;
    const composition = readIngredientComposition(o.input.rawName);
    const derived = brandFromName(o.input.rawName);
    const ws = words(o.input.rawName);

    census.push({
      key: o.key,
      queries: [...(queriesOf.get(o.key) ?? [])].sort(),
      pharmacy: o.input.pharmacy,
      rawName: o.input.rawName,
      brand: attrs.brand,
      manufacturer: attrs.manufacturer,
      ingredients: attrs.activeIngredients.map((i) => i.token),
      ingredientEvidence: attrs.activeIngredients.map((i) => `${i.token}:${i.evidence ?? "?"}`),
      declaredComponentCount: attrs.declaredComponentCount,
      isAssociation: composition.isAssociation,
      isComplete: composition.isComplete,
      negatedComponents: attrs.negatedComponents,
      discriminator: attrs.unresolvedIdentityDiscriminator,
      concentrationKind: attrs.concentration.kind,
      concentration: signatureText(conceptSignature(attrs)).split("|")[2] ?? "",
      dosageForm: attrs.canonicalDosageForm,
      dosageFormClass: attrs.dosageFormClass,
      route: attrs.route,
      pharmaceuticalUnit: attrs.pharmaceuticalUnit,
      packageQuantity: attrs.packageQuantity,
      packageVolume: attrs.packageVolume ? `${attrs.packageVolume.value}${attrs.packageVolume.unit}` : null,
      conceptOutcome: a.concept.outcome,
      conceptId: a.concept.entityId,
      presentationId: a.presentation.entityId,
      productId: a.product.entityId,
      observationId: a.observationId,
      assigned: a.concept.entityId !== null,
      mintable: isMintableConceptSignature(attrs),
      mintBlockers: mintBlockers(attrs),
      unknownAxes: unknownConceptAxes(attrs),
      conceptSignatureText: signatureText(conceptSignature(attrs)),
      combinationKey: combinationKey(o.input.rawName),
      brandFromName: derived.brand,
      activeIngredientFromName: derived.activeIngredient,
      words: ws,
      upstreamBrand: o.input.upstreamFields.brand,
      upstreamManufacturer: o.input.upstreamFields.manufacturer,
      url: o.input.upstreamFields.url,
    });
  }

  const assigned = census.filter((c) => c.assigned);
  const unassigned = census.filter((c) => !c.assigned);
  const recorded = census.filter((c) => c.observationId !== null);

  await writeFile(
    resolve(OUT_DIR, "census-full.json"),
    JSON.stringify(census, null, 2),
    "utf8"
  );

  console.log(`CORPUS      ${census.length} observaciones únicas · ${rows.length} filas upstream`);
  console.log(`            farmacias: ${[...new Set(census.map((c) => c.pharmacy))].sort().join(", ")}`);
  console.log("");
  console.log(`GATE A      asignadas=${assigned.length}  no asignadas=${unassigned.length}`);
  console.log(`            Canonical Identity Assignment Coverage = ${((assigned.length / census.length) * 100).toFixed(2)}%`);
  console.log(`            Pipeline Coverage (NO es Gate A)       = ${((recorded.length / census.length) * 100).toFixed(2)}%`);
  console.log("");

  const byOutcome = {};
  for (const c of unassigned) byOutcome[c.conceptOutcome] = (byOutcome[c.conceptOutcome] ?? 0) + 1;
  console.log("DESENLACE   " + JSON.stringify(byOutcome));

  const withIng = census.filter((c) => c.ingredients.length > 0);
  console.log(`FARMACOL.   con principio activo demostrado=${withIng.length} (${((withIng.length / census.length) * 100).toFixed(2)}%)`);
  console.log(`            sin ninguno                   =${census.length - withIng.length}`);
  console.log("");

  const blockerCounts = {};
  for (const c of unassigned) {
    for (const b of c.mintBlockers) blockerCounts[b] = (blockerCounts[b] ?? 0) + 1;
  }
  console.log("BLOQUEOS DE ACUÑACIÓN (no asignadas, se solapan)");
  for (const [b, n] of Object.entries(blockerCounts).sort((x, y) => y[1] - x[1])) {
    console.log(`  ${b.padEnd(28)} ${String(n).padStart(4)}`);
  }
  console.log("");

  // ---- Head tokens candidatos ----------------------------------------------
  const headFreq = new Map();
  for (const c of unassigned) {
    if (c.ingredients.length > 0) continue;
    const head = c.discriminator;
    if (!head) continue;
    const e = headFreq.get(head) ?? { token: head, count: 0, pharmacies: new Set(), queries: new Set(), names: [] };
    e.count += 1;
    e.pharmacies.add(c.pharmacy);
    for (const q of c.queries) e.queries.add(q);
    if (e.names.length < 6) e.names.push(`${c.pharmacy}: ${c.rawName}`);
    headFreq.set(head, e);
  }
  const heads = [...headFreq.values()].sort((a, b) => b.count - a.count);
  console.log(`DISCRIMINANTES DISTINTOS EN NO ASIGNADAS SIN MOLÉCULA: ${heads.length}`);
  for (const h of heads.slice(0, 60)) {
    console.log(`  ${String(h.count).padStart(4)}  ${h.token.padEnd(24)} farmacias=${h.pharmacies.size} queries=${[...h.queries].join(",")}`);
  }

  await writeFile(
    resolve(OUT_DIR, "head-tokens.json"),
    JSON.stringify(
      heads.map((h) => ({
        token: h.token,
        count: h.count,
        pharmacies: [...h.pharmacies].sort(),
        queries: [...h.queries].sort(),
        names: h.names,
      })),
      null,
      2
    ),
    "utf8"
  );
}

await main();
