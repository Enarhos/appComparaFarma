/**
 * CF-SEARCH-010 — trazas por oferta y metricas del motor v1.
 *
 * Lee los sobres de `raw/`, y para CADA OFERTA de CADA TARJETA recomputa, con
 * las MISMAS funciones de `@comparafarma/domain` que usa produccion, todos los
 * ejes de identidad. No modifica nada: es lectura + recomputo.
 *
 *   node docs/qa/cf-search-010/scripts/trace.mjs
 *
 * Salidas:
 *   analysis/offers.json  — una fila por oferta con todos los ejes
 *   analysis/offers.csv   — la misma tabla, para inspeccion manual
 *   analysis/metrics.json — los contadores de la Fase 3 del ticket
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// Mismo patron que los scripts de CF-SEARCH-003 / CF-DATA-001: `docs/` no es un
// paquete del workspace, asi que el dominio se carga por ruta desde su `dist`
// compilado (`pnpm install` lo construye via postinstall — CLAUDE.md §11).
const DOMAIN_DIST =
  process.env.QA_DOMAIN_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
const {
  matchKey,
  combinationKey,
  commercialVariantKey,
  dosageFormClass,
  unitCountKey,
  liquidConcentration,
  isCompatibleConcentration,
  isCompatibleUnitCount,
  concentrationKey,
  parseConcentration,
  parseQueryIntent,
} = await import(pathToFileURL(DOMAIN_DIST).href);

const RAW_DIR = resolve(HERE, "..", "raw");
const OUT_DIR = resolve(HERE, "..", "analysis");

const conc = (c) => (c === null || c === undefined ? null : concentrationKey(c));

/** Nivel de evidencia de una concentracion: razon masa/volumen o masa absoluta. */
const concLevel = (c) => (c === null ? null : c.denominator === null ? "absolute" : "ratio");

function offerRows(envelope) {
  const rows = [];
  const cards = Array.isArray(envelope.body) ? envelope.body : [];
  const intent = parseQueryIntent(envelope.query);

  cards.forEach((card, cardIndex) => {
    for (const price of card.prices ?? []) {
      const name = price.productName ?? "";
      const c = liquidConcentration(name);
      rows.push({
        query: envelope.query,
        queryId: envelope.id,
        retrievalQuery: intent.retrievalQuery,
        queryConcentration: conc(intent.concentration),
        queryQuantity: intent.quantity,
        queryDosageForm: intent.dosageForm,
        cardIndex,
        cardRank: cardIndex + 1,
        pharmacy: price.pharmacySlug,
        upstreamName: name,
        canonicalName: card.canonicalName,
        cardMatchKey: card.matchKey,
        cardPresentationKey: card.presentationKey,
        offerMatchKey: matchKey(name),
        offerCombinationKey: combinationKey(name),
        offerVariantKey: commercialVariantKey(name),
        offerDosageForm: dosageFormClass(name),
        offerUnitCount: unitCountKey(name),
        offerConcentration: conc(c),
        offerConcentrationLevel: concLevel(c),
        offerParsedFirstMagnitude: conc(parseConcentration(name)),
        brand: card.brand ?? null,
        manufacturer: card.manufacturer ?? null,
        activeIngredient: card.activeIngredient ?? null,
        brandSource: card.brandSource ?? null,
        laboratory: card.laboratory ?? null,
        isBioequivalent: card.isBioequivalent ?? null,
        lexicalMatch: card.lexicalMatch ?? null,
        concentrationMatch: card.concentrationMatch ?? null,
        cfmId: card.cfmId ?? null,
        effective: price.channels?.effective ?? null,
        hasStock: price.hasStock ?? null,
        onlineUrl: price.onlineUrl ?? null,
        offersInCard: (card.prices ?? []).length,
      });
    }
  });
  return rows;
}

function uniq(xs) {
  return [...new Set(xs)];
}

function computeMetrics(rows, envelopes) {
  const cards = envelopes.flatMap((e) =>
    (Array.isArray(e.body) ? e.body : []).map((c) => ({ ...c, __query: e.query }))
  );

  const cardKey = (c) => `${c.__query}::${c.presentationKey}::${c.canonicalName}`;

  // --- Cardinalidad de claves
  const matchKeys = uniq(cards.map((c) => c.matchKey));
  const presentationKeys = uniq(cards.map((c) => c.presentationKey));

  // presentationKey que producen mas de una tarjeta DENTRO de la misma consulta
  const pkPerQuery = new Map();
  for (const c of cards) {
    const k = `${c.__query}::${c.presentationKey}`;
    pkPerQuery.set(k, (pkPerQuery.get(k) ?? 0) + 1);
  }
  const pkWithMultipleCards = [...pkPerQuery.entries()].filter(([, n]) => n > 1);

  // --- Cobertura de comparacion
  const pharmaciesPerCard = cards.map((c) => uniq((c.prices ?? []).map((p) => p.pharmacySlug)).length);
  const multi = pharmaciesPerCard.filter((n) => n > 1).length;
  const single = pharmaciesPerCard.filter((n) => n === 1).length;

  // --- Relevancia
  const lex = { exact: 0, compatible: 0, mismatch: 0, absent: 0 };
  const cohort = { exact: 0, unknown: 0, other: 0, absent: 0 };
  for (const c of cards) {
    lex[c.lexicalMatch ?? "absent"] = (lex[c.lexicalMatch ?? "absent"] ?? 0) + 1;
    cohort[c.concentrationMatch ?? "absent"] = (cohort[c.concentrationMatch ?? "absent"] ?? 0) + 1;
  }

  // Incompatibles mostrados como PRIMARIOS: cohorte "other" que igual aparece
  // en la mitad superior del listado de su consulta.
  let incompatiblePrimary = 0;
  for (const e of envelopes) {
    const list = Array.isArray(e.body) ? e.body : [];
    const half = Math.ceil(list.length / 2);
    list.slice(0, half).forEach((c) => {
      if (c.concentrationMatch === "other") incompatiblePrimary++;
    });
  }

  // --- Falsos merges residuales: dos ofertas de la MISMA tarjeta que se
  //     contradicen en un eje. Deberia ser 0 tras CF-SEARCH-001/003.
  const contradictions = [];
  for (const c of cards) {
    const ids = (c.prices ?? []).map((p) => ({
      pharmacy: p.pharmacySlug,
      name: p.productName,
      mk: matchKey(p.productName),
      combo: combinationKey(p.productName),
      variant: commercialVariantKey(p.productName),
      form: dosageFormClass(p.productName),
      count: unitCountKey(p.productName),
      conc: liquidConcentration(p.productName),
    }));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        const axes = [];
        if (a.mk !== b.mk) axes.push("matchKey");
        if (a.combo !== b.combo) axes.push("combination");
        if (a.variant !== b.variant) axes.push("variant");
        if (a.form !== null && b.form !== null && a.form !== b.form) axes.push("form");
        if (!isCompatibleUnitCount(a.count, b.count)) axes.push("unitCount");
        if (!isCompatibleConcentration(a.conc, b.conc)) axes.push("concentration");
        if (axes.length > 0) {
          contradictions.push({
            query: c.__query,
            presentationKey: c.presentationKey,
            axes,
            a: { pharmacy: a.pharmacy, name: a.name },
            b: { pharmacy: b.pharmacy, name: b.name },
          });
        }
      }
    }
  }

  // --- Falsos splits: grupos farmacologicamente equivalentes repartidos en
  //     tarjetas distintas SIN solapamiento de farmacias (misma tecnica que
  //     CF-QA-001 §5, para poder comparar la medicion).
  const fragGroups = new Map();
  for (const c of cards) {
    const first = (c.prices ?? [])[0];
    const name = first?.productName ?? c.canonicalName ?? "";
    const sig = [
      c.__query,
      c.matchKey,
      dosageFormClass(name) ?? "-",
      commercialVariantKey(name) ?? "-",
      combinationKey(name) ?? "-",
      unitCountKey(name) ?? "-",
    ].join("~");
    if (!fragGroups.has(sig)) fragGroups.set(sig, []);
    fragGroups.get(sig).push(c);
  }
  let fragmented = 0;
  let fragmentedCards = 0;
  let lostComparison = 0;
  for (const group of fragGroups.values()) {
    const keys = uniq(group.map((c) => c.presentationKey));
    if (keys.length <= 1) continue;
    fragmented++;
    fragmentedCards += group.length;
    const perCard = group.map((c) => new Set((c.prices ?? []).map((p) => p.pharmacySlug)));
    let overlap = false;
    for (let i = 0; i < perCard.length && !overlap; i++) {
      for (let j = i + 1; j < perCard.length && !overlap; j++) {
        for (const s of perCard[i]) if (perCard[j].has(s)) overlap = true;
      }
    }
    if (!overlap) lostComparison++;
  }

  // --- Dependencia de texto libre: que fraccion de las decisiones de identidad
  //     se toma SIN ningun campo estructurado de la farmacia.
  const structuredBrandOffers = rows.filter((r) => r.brandSource === "structured").length;
  const withManufacturer = rows.filter((r) => r.manufacturer !== null).length;
  const unknownStrength = cards.filter((c) => c.concentrationMatch === "unknown").length;

  // --- Reglas/guards ejecutados por oferta (conteo estatico del pipeline v1).
  //     matchKey, combinationKey, commercialVariantKey, dosageFormClass,
  //     unitCountKey, liquidConcentration, resolveCommercialIdentity,
  //     resolveBrandIdentity, bioequivalenceKey, presentationKey  = 10 en
  //     ingesta; canMergeOffers recompone 6 mas por PAR de ofertas del grupo.
  const pairComparisons = cards.reduce((acc, c) => {
    const n = (c.prices ?? []).length;
    return acc + (n * (n - 1)) / 2;
  }, 0);

  return {
    capturedQueries: envelopes.length,
    totalCards: cards.length,
    totalOffers: rows.length,
    uniqueUpstreamNames: uniq(rows.map((r) => r.upstreamName)).length,
    pharmaciesCovered: uniq(rows.map((r) => r.pharmacy)).length,
    matchKeyCardinality: matchKeys.length,
    presentationKeyCardinality: presentationKeys.length,
    presentationKeysProducingMoreThanOneCard: pkWithMultipleCards.length,
    presentationKeysProducingMoreThanOneCardExamples: pkWithMultipleCards
      .slice(0, 15)
      .map(([k, n]) => ({ key: k, cards: n })),
    multiPharmacyCards: multi,
    singlePharmacyCards: single,
    singlePharmacyCardRate: cards.length ? +(single / cards.length).toFixed(4) : 0,
    lexicalMatch: lex,
    concentrationCohort: cohort,
    unknownStrengthCards: unknownStrength,
    incompatibleShownInTopHalf: incompatiblePrimary,
    intraCardContradictions: contradictions.length,
    intraCardContradictionSamples: contradictions.slice(0, 20),
    fragmentedIdentityGroups: fragmented,
    fragmentedCards,
    lostComparisonGroups: lostComparison,
    offersWithStructuredBrand: structuredBrandOffers,
    offersWithManufacturer: withManufacturer,
    freeTextIdentityRate: rows.length
      ? +(1 - withManufacturer / rows.length).toFixed(4)
      : 0,
    identityRulesPerOfferAtIngestion: 10,
    pairwiseMergeComparisons: pairComparisons,
  };
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json")).sort();
  const envelopes = [];
  for (const f of files) {
    const env = JSON.parse(await readFile(resolve(RAW_DIR, f), "utf8"));
    if (env.status === 200 && Array.isArray(env.body)) envelopes.push(env);
  }

  const rows = envelopes.flatMap(offerRows);
  const metrics = computeMetrics(rows, envelopes);

  await writeFile(resolve(OUT_DIR, "offers.json"), JSON.stringify(rows, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "offers.csv"), toCsv(rows), "utf8");
  await writeFile(resolve(OUT_DIR, "metrics.json"), JSON.stringify(metrics, null, 2), "utf8");

  console.log(JSON.stringify(metrics, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
