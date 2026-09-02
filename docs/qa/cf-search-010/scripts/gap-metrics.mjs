/**
 * CF-SEARCH-010 — metricas de brecha contra el Enterprise Data Model.
 *
 *   node docs/qa/cf-search-010/scripts/gap-metrics.mjs
 *
 * Mide, sobre el corpus real de `raw/`, cuanto de la jerarquia del EDM
 * (Concepto -> Presentacion -> Producto Comercial -> Oferta) es hoy
 * expresable con los ejes que el motor v1 ya calcula, y cuantas tarjetas
 * distintas produce cada nivel.
 *
 * Salida: analysis/edm-gap.json + analysis/concept-fragmentation.csv
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(HERE, "..", "raw");
const OUT_DIR = resolve(HERE, "..", "analysis");
const DOMAIN_DIST =
  process.env.QA_DOMAIN_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
const {
  matchKey, combinationKey, commercialVariantKey, dosageFormClass,
  unitCountKey, liquidConcentration, concentrationKey, parseQueryIntent,
  normalizedWords, brandHeadTokens, parseMeasurements, isVolumeUnit,
} = await import(pathToFileURL(DOMAIN_DIST).href);

const OFF = 0xcbf29ce484222325n, PRIME = 0x100000001b3n, MASK = 0xffffffffffffffffn;
function shortHash(s) {
  let h = OFF;
  for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * PRIME) & MASK; }
  return h.toString(36);
}

const conc = (c) => (c ? concentrationKey(c) : null);

/** Volumen de envase declarado en el nombre (magnitud de volumen suelta, la mayor). */
function packageVolume(name) {
  const vols = parseMeasurements(name)
    .filter((m) => m.denominator === null && isVolumeUnit(m.numerator.unit))
    .map((m) => (m.numerator.unit === "l" ? m.numerator.value * 1000 : m.numerator.value));
  return vols.length ? Math.max(...vols) : null;
}

/**
 * Aproximacion del CFM-CONCEPT-ID del EDM, construida SOLO con lo que el motor
 * v1 ya sabe leer: cabecera farmacologica + concentracion (razon) + forma.
 * No inventa datos: cuando un eje no es legible queda `-`, y eso mismo es la
 * medicion de la brecha.
 */
function conceptSignature(name) {
  const head = brandHeadTokens(normalizedWords(name)).join("");
  const c = liquidConcentration(name);
  return [head || "-", conc(c) ?? "-", dosageFormClass(name) ?? "-", combinationKey(name) ?? "-"].join("~");
}

/** Aproximacion del CFM-PRESENTATION-ID: concepto + cantidad o volumen de envase. */
function presentationSignature(name) {
  return [conceptSignature(name), unitCountKey(name) ?? "-", packageVolume(name) ?? "-"].join("~");
}

const uniq = (xs) => [...new Set(xs)];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json")).sort();
  const envelopes = [];
  for (const f of files) {
    const e = JSON.parse(await readFile(resolve(RAW_DIR, f), "utf8"));
    if (e.status === 200 && Array.isArray(e.body)) envelopes.push(e);
  }

  const cards = [];
  const offers = [];
  for (const e of envelopes) {
    for (const c of e.body) {
      const rep = (c.prices ?? [])[0]?.productName ?? c.canonicalName ?? "";
      cards.push({
        query: e.query, queryId: e.id, card: c,
        concept: conceptSignature(rep),
        presentation: presentationSignature(rep),
        slugHash: shortHash(c.presentationKey),
      });
      for (const p of c.prices ?? []) {
        offers.push({ query: e.query, pharmacy: p.pharmacySlug, name: p.productName, card: c });
      }
    }
  }

  // ---- 1. Defecto de cantidad de `matchKey`: "x <n> ml" leido como N unidades.
  //         `matchKey` lo captura (QUANTITY_PATTERN no excluye unidades de
  //         medida); `unitCountKey` NO (tiene MEASURE_UNITS). La discrepancia
  //         mide exactamente ese defecto sobre datos reales.
  const volumeAsQuantity = [];
  for (const o of offers) {
    const mk = matchKey(o.name);
    const seg = mk.split("|");
    const mkQty = seg.length >= 2 ? seg[seg.length - 1] : "";
    if (!/^\d+$/.test(mkQty)) continue;
    if (unitCountKey(o.name) === null && packageVolume(o.name) === Number(mkQty)) {
      volumeAsQuantity.push({ pharmacy: o.pharmacy, name: o.name, matchKey: mk, readAs: Number(mkQty) });
    }
  }

  // ---- 2. Principio activo leido como VARIANTE comercial (`|var:<inn>`).
  const INN_HINTS = new Set([
    "ambroxol", "paracetamol", "ibuprofeno", "losartan", "omeprazol", "amoxicilina",
    "diclofenaco", "cetirizina", "betametasona", "loratadina", "naproxeno",
    "clorfenamina", "metformina", "clotrimazol", "salbutamol", "ketoprofeno",
    "dipirona", "nistatina", "hidrocortisona", "aspirina", "levocetirizina",
    "desloratadina", "azitromicina", "cefadroxilo", "clavulanico",
  ]);
  const innAsVariant = [];
  for (const o of offers) {
    const v = commercialVariantKey(o.name);
    if (v && INN_HINTS.has(v)) innAsVariant.push({ pharmacy: o.pharmacy, name: o.name, variant: v });
  }

  // ---- 3. Semantica de concentracion de la CONSULTA: "30mg" (masa absoluta)
  //         frente a productos "30mg/5ml" (razon). isSameConcentration los
  //         declara distintos por diseño, asi que la cohorte correcta se marca
  //         `other`.
  const queryConcMismatch = [];
  for (const e of envelopes) {
    const intent = parseQueryIntent(e.query);
    if (!intent.concentration || intent.concentration.denominator !== null) continue;
    const askedMg = intent.concentration.numerator.value;
    for (const c of e.body) {
      const rep = (c.prices ?? [])[0]?.productName ?? c.canonicalName ?? "";
      const cc = liquidConcentration(rep);
      if (!cc || cc.denominator === null) continue;
      if (cc.numerator.value === askedMg && c.concentrationMatch === "other") {
        queryConcMismatch.push({
          query: e.query, canonicalName: c.canonicalName,
          declared: conc(cc), cohort: c.concentrationMatch,
        });
      }
    }
  }

  // ---- 4. Fragmentacion por nivel del EDM.
  const byConcept = new Map();
  const byPresentation = new Map();
  for (const c of cards) {
    const ck = `${c.query}::${c.concept}`;
    const pk = `${c.query}::${c.presentation}`;
    if (!byConcept.has(ck)) byConcept.set(ck, []);
    if (!byPresentation.has(pk)) byPresentation.set(pk, []);
    byConcept.get(ck).push(c);
    byPresentation.get(pk).push(c);
  }

  const presentationRows = [...byPresentation.entries()]
    .map(([key, group]) => ({
      key,
      cards: group.length,
      distinctPresentationKeys: uniq(group.map((g) => g.card.presentationKey)).length,
      pharmacies: uniq(group.flatMap((g) => (g.card.prices ?? []).map((p) => p.pharmacySlug))).length,
      minPrice: Math.min(...group.map((g) => g.card.bestPrice)),
      maxPrice: Math.max(...group.map((g) => g.card.bestPrice)),
    }))
    .filter((r) => r.key.split("::")[1].split("~")[0] !== "-")
    .sort((a, b) => b.cards - a.cards);

  const fragmentedPresentations = presentationRows.filter((r) => r.cards > 1);

  // ---- 5. Colisiones de hash de slug DENTRO de una misma consulta.
  const collisions = [];
  for (const e of envelopes) {
    const byHash = new Map();
    for (const c of e.body) {
      const h = shortHash(c.presentationKey);
      if (!byHash.has(h)) byHash.set(h, []);
      byHash.get(h).push(c);
    }
    for (const [h, v] of byHash) {
      if (v.length > 1) {
        collisions.push({ query: e.query, hash: h, cards: v.map((c) => c.canonicalName) });
      }
    }
  }

  // ---- 6. Cobertura de atributos estructurados por oferta.
  const structured = { brand: 0, manufacturer: 0, activeIngredient: 0, bioTrue: 0, bioFalse: 0, bioNull: 0 };
  for (const c of cards) {
    if (c.card.brand) structured.brand++;
    if (c.card.manufacturer) structured.manufacturer++;
    if (c.card.activeIngredient) structured.activeIngredient++;
    if (c.card.isBioequivalent === true) structured.bioTrue++;
    else if (c.card.isBioequivalent === false) structured.bioFalse++;
    else structured.bioNull++;
  }

  // ---- 7. Legibilidad de los ejes del EDM desde texto libre.
  const readable = { concept: 0, concentration: 0, dosageForm: 0, unitCount: 0, packageVolume: 0 };
  for (const o of offers) {
    if (brandHeadTokens(normalizedWords(o.name)).length > 0) readable.concept++;
    if (liquidConcentration(o.name)) readable.concentration++;
    if (dosageFormClass(o.name)) readable.dosageForm++;
    if (unitCountKey(o.name) !== null) readable.unitCount++;
    if (packageVolume(o.name) !== null) readable.packageVolume++;
  }

  const out = {
    corpus: { queries: envelopes.length, cards: cards.length, offers: offers.length },
    edmCardinality: {
      conceptApprox: uniq(cards.map((c) => c.concept)).length,
      presentationApprox: uniq(cards.map((c) => c.presentation)).length,
      matchKey: uniq(cards.map((c) => c.card.matchKey)).length,
      presentationKey: uniq(cards.map((c) => c.card.presentationKey)).length,
      cards: cards.length,
    },
    fragmentation: {
      presentationsSplitAcrossCards: fragmentedPresentations.length,
      cardsInvolved: fragmentedPresentations.reduce((a, r) => a + r.cards, 0),
      worst: fragmentedPresentations.slice(0, 15),
    },
    defects: {
      packageVolumeReadAsUnitCountByMatchKey: {
        offers: volumeAsQuantity.length,
        distinctNames: uniq(volumeAsQuantity.map((v) => v.name)).length,
        samples: volumeAsQuantity.slice(0, 12),
      },
      activeIngredientReadAsCommercialVariant: {
        offers: innAsVariant.length,
        distinctNames: uniq(innAsVariant.map((v) => v.name)).length,
        samples: innAsVariant.slice(0, 12),
      },
      absoluteMassQueryDemotesRatioProducts: {
        cards: queryConcMismatch.length,
        samples: queryConcMismatch.slice(0, 12),
      },
      slugHashCollisionsWithinQuery: {
        count: collisions.length,
        samples: collisions.slice(0, 12),
      },
    },
    structuredAttributeCoverageByCard: structured,
    freeTextReadabilityByOffer: readable,
  };

  await writeFile(resolve(OUT_DIR, "edm-gap.json"), JSON.stringify(out, null, 2), "utf8");
  const csv = [
    "presentation_signature,cards,distinct_presentation_keys,pharmacies,min_price,max_price",
    ...presentationRows.map((r) =>
      [`"${r.key.replace(/"/g, '""')}"`, r.cards, r.distinctPresentationKeys, r.pharmacies, r.minPrice, r.maxPrice].join(",")
    ),
  ].join("\n");
  await writeFile(resolve(OUT_DIR, "concept-fragmentation.csv"), csv, "utf8");

  console.log(JSON.stringify({ ...out, fragmentation: { ...out.fragmentation, worst: out.fragmentation.worst.slice(0, 6) } }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
