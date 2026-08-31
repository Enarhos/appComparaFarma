/**
 * CF-SEARCH-003 — evidencia medida para la politica "concentracion explicita
 * vs ausente" y para la cobertura del eje por forma farmaceutica.
 *
 * Responde con datos las dos preguntas de diseno del ticket:
 *   1. Que hacer cuando una oferta declara concentracion y la otra no?
 *      Se cuentan los grupos multi-oferta de cada clase y se listan los grupos
 *      MIXTOS uno por uno, para poder decidir con evidencia y no por analogia.
 *   2. El eje puede degradar la identidad de los productos SOLIDOS?
 *      Se mide cuantas ofertas de cada `dosageFormClass` derivan concentracion.
 *
 * Uso:  node docs/qa/cf-search-003/scripts/policy-evidence.mjs
 * Salida: ../analysis/policy-evidence.json
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "..", "raw");
const OUT_DIR = join(HERE, "..", "analysis");
const DIST = process.env.QA_PR_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
const M = await import(pathToFileURL(DIST).href);

const key = (name) => {
  const c = M.liquidConcentration(name);
  return c === null ? null : M.concentrationKey(c);
};

const cards = [];
for (const file of (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"))) {
  const env = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
  if (!Array.isArray(env.results)) continue;
  env.results.forEach((c, i) => cards.push({ cardId: `${env.query}#${i}`, query: env.query, ...c }));
}

const offers = cards.flatMap((c) =>
  c.prices.map((p) => ({
    cardId: c.cardId,
    query: c.query,
    presentationKey: c.presentationKey,
    pharmacy: p.pharmacySlug,
    name: p.productName,
    price: p.channels.effective,
    concentration: key(p.productName),
    parsed: M.liquidConcentration(p.productName),
    form: M.dosageFormClass(p.productName),
  }))
);

// --- 1. cobertura por forma farmaceutica -----------------------------------
const coverage = {};
for (const o of offers) {
  const f = o.form ?? "(sin forma declarada)";
  coverage[f] ??= { offers: 0, withRatio: 0, withAbsoluteMass: 0 };
  coverage[f].offers++;
  if (o.parsed?.denominator) coverage[f].withRatio++;
  else if (o.parsed) coverage[f].withAbsoluteMass++;
}

// --- 2. clasificacion de grupos multi-oferta -------------------------------
const groups = new Map();
for (const o of offers) {
  if (!groups.has(o.cardId)) groups.set(o.cardId, []);
  groups.get(o.cardId).push(o);
}

const classes = { allAbsent: 0, allExplicitEquivalent: 0, explicitIncompatible: [], mixed: [] };
let multiOffer = 0;
for (const [, g] of groups) {
  if (g.length < 2) continue;
  multiOffer++;
  const withC = g.filter((o) => o.parsed !== null);
  const withoutC = g.filter((o) => o.parsed === null);
  if (withC.length === 0) { classes.allAbsent++; continue; }

  let incompatible = false;
  for (let i = 0; i < withC.length && !incompatible; i++) {
    for (let j = i + 1; j < withC.length; j++) {
      if (!M.isCompatibleConcentration(withC[i].parsed, withC[j].parsed)) { incompatible = true; break; }
    }
  }
  const view = {
    query: g[0].query,
    presentationKey: g[0].presentationKey,
    offers: g.map((o) => ({ pharmacy: o.pharmacy, concentration: o.concentration, price: o.price, name: o.name })),
  };
  if (incompatible) classes.explicitIncompatible.push(view);
  else if (withoutC.length > 0) classes.mixed.push(view);
  else classes.allExplicitEquivalent++;
}

const summary = {
  generatedAt: new Date().toISOString(),
  dist: DIST,
  queries: new Set(cards.map((c) => c.query)).size,
  cards: cards.length,
  offers: offers.length,
  multiOfferGroups: multiOffer,
  groupClasses: {
    allAbsent: classes.allAbsent,
    allExplicitEquivalent: classes.allExplicitEquivalent,
    explicitIncompatible: classes.explicitIncompatible.length,
    mixedExplicitAndAbsent: classes.mixed.length,
  },
  policyImpact: {
    // (A) ausencia = comodin  → elegida
    A_wildcard: { falseSplits: 0, falseMergesFixed: classes.explicitIncompatible.length },
    // (B) ausencia = bloqueo
    B_block: { falseSplits: classes.mixed.length, falseMergesFixed: classes.explicitIncompatible.length },
  },
  coverageByDosageForm: coverage,
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  join(OUT_DIR, "policy-evidence.json"),
  JSON.stringify({ summary, explicitIncompatible: classes.explicitIncompatible, mixed: classes.mixed }, null, 1),
  "utf8"
);
console.log(JSON.stringify(summary, null, 2));
console.log("\n== grupos MIXTOS (explicita + ausente) — los que la politica (B) partiria ==");
for (const g of classes.mixed) {
  console.log(`\n  [${g.query}] ${g.presentationKey}`);
  for (const o of g.offers) console.log(`    ${o.pharmacy.padEnd(13)} ${String(o.concentration).padEnd(14)} $${o.price}  ${o.name}`);
}
