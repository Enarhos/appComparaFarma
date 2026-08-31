/**
 * CF-SEARCH-003 — analisis de separacion a nivel de PAR de ofertas.
 *
 * Es la medida estricta de "falsos splits introducidos": en vez de contar
 * tarjetas (que puede ocultar reagrupaciones), enumera TODOS los pares de
 * ofertas que compartian tarjeta en `origin/main` y verifica si siguen juntos
 * en la branch. Cada par separado se clasifica:
 *
 *   INTENDED_DIRECT     — las dos ofertas declaran concentraciones explicitas
 *                         incompatibles. Es exactamente lo que el fix debe hacer.
 *   INTENDED_COLLATERAL — el par es compatible entre si, pero la tarjeta de
 *                         base contenia una contradiccion real y una de las dos
 *                         ofertas no declara concentracion (comodin). Al partir
 *                         la tarjeta, el comodin tiene que quedar en UNO de los
 *                         dos lados: no puede estar en ambos. Es consecuencia
 *                         necesaria de una separacion correcta, no un defecto.
 *   UNINTENDED          — par compatible en una tarjeta de base SIN ninguna
 *                         contradiccion de concentracion. Es el unico bucket
 *                         que representa un falso split. Debe ser 0.
 *
 * Verifica ademas que `presentationKey` (de la que Web deriva el slug de ficha)
 * es identica en las dos compilaciones para todas las ofertas.
 *
 * Uso:
 *   QA_BASE_DIST=<dist de origin/main> node docs/qa/cf-search-003/scripts/pair-split.mjs
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

const cards = [];
for (const file of (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"))) {
  const env = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
  if (!Array.isArray(env.results)) continue;
  env.results.forEach((card, i) => cards.push({ cardId: `${env.query}#${i}`, query: env.query, ...card }));
}

function explode(list) {
  const out = [];
  for (const card of list) {
    for (const p of card.prices) {
      out.push({ ...card, canonicalName: p.productName, prices: [p], bestPrice: p.channels.effective, bestPharmacy: p.pharmacySlug });
    }
  }
  return out;
}

const offerId = (card, price) => `${card.presentationKey}::${price.pharmacySlug}::${price.productName}::${price.channels.effective}`;

function groupsOf(merged) {
  const map = new Map();
  merged.forEach((card, idx) => {
    for (const p of card.prices) map.set(offerId(card, p), idx);
  });
  return map;
}

const byQuery = new Map();
for (const c of cards) {
  if (!byQuery.has(c.query)) byQuery.set(c.query, []);
  byQuery.get(c.query).push(c);
}

const separated = { intendedDirect: [], intendedCollateral: [], unintended: [] };
let pairsTotal = 0;
let pairsSeparated = 0;

/** `true` si la tarjeta contiene al menos un par de concentraciones incompatibles. */
function hasContradiction(card) {
  const parsed = card.prices.map((p) => PR.liquidConcentration(p.productName));
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      if (!PR.isCompatibleConcentration(parsed[i], parsed[j])) return true;
    }
  }
  return false;
}

for (const [query, qcards] of byQuery) {
  const input = explode(qcards);
  const baseOut = BASE.mergeDuplicates(input.map((c) => ({ ...c })));
  const prOut = PR.mergeDuplicates(input.map((c) => ({ ...c })));
  const prGroup = groupsOf(prOut);

  for (const card of baseOut) {
    const offers = card.prices;
    const contradictory = hasContradiction(card);
    for (let i = 0; i < offers.length; i++) {
      for (let j = i + 1; j < offers.length; j++) {
        pairsTotal++;
        const a = offers[i];
        const b = offers[j];
        const ga = prGroup.get(offerId(card, a));
        const gb = prGroup.get(offerId(card, b));
        if (ga !== undefined && gb !== undefined && ga === gb) continue;
        pairsSeparated++;
        const ca = PR.liquidConcentration(a.productName);
        const cb = PR.liquidConcentration(b.productName);
        const record = {
          query,
          presentationKey: card.presentationKey,
          a: { pharmacy: a.pharmacySlug, name: a.productName, concentration: ca && PR.concentrationKey(ca), price: a.channels.effective },
          b: { pharmacy: b.pharmacySlug, name: b.productName, concentration: cb && PR.concentrationKey(cb), price: b.channels.effective },
        };
        if (!PR.isCompatibleConcentration(ca, cb)) separated.intendedDirect.push(record);
        else if (contradictory) separated.intendedCollateral.push(record);
        else separated.unintended.push(record);
      }
    }
  }
}

// --- estabilidad de presentationKey (slug de ficha en Web) ------------------
const keyDiffs = [];
let offersChecked = 0;
for (const card of cards) {
  for (const p of card.prices) {
    offersChecked++;
    const product = {
      name: p.productName,
      price: p.channels.store,
      onlinePrice: p.channels.online,
      cmrPrice: p.channels.cmr,
      sbpayPrice: p.channels.sbpay,
      hasStock: p.hasStock,
      hasOnlineDelivery: p.hasOnlineDelivery,
      onlineUrl: p.onlineUrl,
      imageUrl: p.imageUrl,
      laboratory: card.laboratory ?? null,
      isBioequivalent: card.isBioequivalent ?? null,
    };
    const a = BASE.toMedicationResult(product, p.pharmacySlug, p.pharmacySlug).presentationKey;
    const b = PR.toMedicationResult(product, p.pharmacySlug, p.pharmacySlug).presentationKey;
    if (a !== b) keyDiffs.push({ name: p.productName, base: a, pr: b });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseDist: BASE_DIST,
  prDist: PR_DIST,
  queries: byQuery.size,
  pairsSharingACardInBase: pairsTotal,
  pairsSeparatedInPr: pairsSeparated,
  separatedIntendedDirect: separated.intendedDirect.length,
  separatedIntendedCollateral: separated.intendedCollateral.length,
  separatedUnintended: separated.unintended.length,
  presentationKeyOffersChecked: offersChecked,
  presentationKeyDifferences: keyDiffs.length,
  verdict:
    separated.unintended.length === 0 && keyDiffs.length === 0
      ? "NO_UNINTENDED_SPLITS__PRESENTATIONKEY_STABLE"
      : "REVIEW_REQUIRED",
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, "pair-split.json"), JSON.stringify({ summary, separated, presentationKeyDiffs: keyDiffs }, null, 1), "utf8");
console.log(JSON.stringify(summary, null, 2));
if (separated.unintended.length) {
  console.log("\n== separaciones NO intencionales ==");
  for (const r of separated.unintended.slice(0, 30)) {
    console.log(`\n  [${r.query}] ${r.presentationKey}`);
    console.log(`    ${r.a.pharmacy} ${r.a.concentration} ${r.a.name}`);
    console.log(`    ${r.b.pharmacy} ${r.b.concentration} ${r.b.name}`);
  }
}
