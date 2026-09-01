/**
 * CF-DATA-001 — A/B sobre catálogo REAL (Fases 3 y 4).
 *
 * BASE      = adaptadores + dominio de `origin/main` (57cbd5d).
 * PROPUESTA = adaptadores + dominio de esta branch.
 *
 * Mismo corpus para los dos lados: las respuestas upstream YA capturadas
 * (`out/sources.json`), reconstruidas como `ScrapedProduct` con el mapeo de
 * cada lado. Así la comparación es determinista y no depende de que las 9
 * farmacias devuelvan lo mismo en dos momentos distintos.
 *
 * Salcobrand se incluye desde el corpus de producción (no hay credenciales
 * Algolia locales): sus ofertas se reconstruyen a partir de las tarjetas de UNA
 * sola oferta, donde la atribución de `laboratory` a Salcobrand es exacta.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const BASE = await import("../../../../.ab-base/index.js");
const NEXT = await import("../../../../packages/domain/dist/index.js");

const sources = JSON.parse(readFileSync(new URL("./out/sources.json", import.meta.url)));
const production = JSON.parse(readFileSync(new URL("./out/production.json", import.meta.url)));

const QUERIES = [
  "ambroxol", "paracetamol", "tapsin", "ibuprofeno", "losartan",
  "omeprazol", "amoxicilina", "diclofenaco", "cetirizina",
];

const PHARMACY_NAME = {
  "cruz-verde": "Cruz Verde", "dr-simi": "Dr. Simi", araucomed: "AraucoMed",
  farmex: "Farmex", ecofarmacias: "EcoFarmacias", ahumada: "Ahumada",
  easyfarma: "EasyFarma", sermecoop: "Sermecoop", salcobrand: "Salcobrand",
};

/**
 * Semántica REAL medida por farmacia (Fase 1). Determina, para cada oferta,
 * qué valor va a `brand` y cuál a `manufacturer` en la PROPUESTA — y qué valor
 * tenía el campo único `laboratory` en la BASE.
 */
const SEMANTICS = {
  "cruz-verde": "none",     // hit.brand no existe en el payload
  "dr-simi": "manufacturer",
  araucomed: "manufacturer",
  farmex: "manufacturer",
  ecofarmacias: "none",
  ahumada: "none",
  easyfarma: "none",
  sermecoop: "none",
  salcobrand: "brand",
};

/** Ofertas por query, con el valor estructurado crudo y su semántica. */
function buildCorpus() {
  const byQuery = new Map(QUERIES.map((q) => [q, []]));

  for (const [slug, rows] of Object.entries(sources)) {
    for (const r of rows) {
      const list = byQuery.get(r.query);
      if (!list) continue;
      // Farmex: `classifyVendor()` (api/src/clients/farmex.ts) descarta los
      // vendors de canal comercial ("Farmex-Fonasa", "Farmex-Pluxee-
      // Persistente"…) antes de elegir el laboratorio. Se reproduce acá para
      // que el corpus sea fiel a lo que el cliente real produce y no se le
      // atribuya al ticket un defecto que el adaptador ya filtraba.
      const structured =
        slug === "farmex" && typeof r.raw === "string" && r.raw.startsWith("Farmex-")
          ? null
          : r.raw ?? null;
      list.push({ slug, name: r.name, structured, price: 1000 + list.length });
    }
  }

  // Salcobrand — desde tarjetas de una sola oferta en producción.
  for (const [q, cards] of Object.entries(production)) {
    const list = byQuery.get(q);
    if (!list) continue;
    for (const c of cards) {
      if (c.prices.length !== 1) continue;
      if (c.prices[0].pharmacySlug !== "salcobrand") continue;
      list.push({
        slug: "salcobrand",
        name: c.prices[0].productName,
        structured: c.laboratory ?? null,
        price: c.prices[0].channels.effective,
      });
    }
  }
  return byQuery;
}

function baseProduct(o) {
  return {
    name: o.name, price: o.price, onlinePrice: null, cmrPrice: null, sbpayPrice: null,
    hasStock: true, hasOnlineDelivery: true, onlineUrl: null, imageUrl: null,
    laboratory: SEMANTICS[o.slug] === "none" ? null : o.structured,
    isBioequivalent: null,
  };
}

function nextProduct(o) {
  const sem = SEMANTICS[o.slug];
  return {
    name: o.name, price: o.price, onlinePrice: null, cmrPrice: null, sbpayPrice: null,
    hasStock: true, hasOnlineDelivery: true, onlineUrl: null, imageUrl: null,
    brand: sem === "brand" ? o.structured : null,
    manufacturer: sem === "manufacturer" ? o.structured : null,
    isBioequivalent: null,
  };
}

const corpus = buildCorpus();

function run(mod, toProduct) {
  const perQuery = new Map();
  for (const [q, offers] of corpus) {
    const results = offers.map((o) => mod.toMedicationResult(toProduct(o), o.slug, PHARMACY_NAME[o.slug]));
    perQuery.set(q, mod.mergeDuplicates(results));
  }
  return perQuery;
}

const baseCards = run(BASE, baseProduct);
const nextCards = run(NEXT, nextProduct);

// --- métricas -------------------------------------------------------------
function metrics(perQuery) {
  let totalOffers = 0, totalCards = 0, multiPharmacyCards = 0;
  let cardsWithBrand = 0, cardsWithManufacturer = 0, cardsWithUnknownBrand = 0;
  const keys = new Set();
  for (const cards of perQuery.values()) {
    for (const c of cards) {
      totalCards++;
      totalOffers += c.prices.length;
      if (c.prices.length > 1) multiPharmacyCards++;
      keys.add(c.presentationKey);
      const brand = c.brand ?? (c.brand === undefined ? null : null);
      if (brand && String(brand).trim()) cardsWithBrand++; else cardsWithUnknownBrand++;
      if (c.manufacturer && String(c.manufacturer).trim()) cardsWithManufacturer++;
    }
  }
  return { totalOffers, totalCards, multiPharmacyCards, cardsWithBrand, cardsWithManufacturer, cardsWithUnknownBrand, keys };
}

// BASE no tiene brand/manufacturer: se mide su equivalente publicado (laboratory).
function baseMetrics(perQuery) {
  let totalOffers = 0, totalCards = 0, multiPharmacyCards = 0, withLab = 0;
  const keys = new Set();
  for (const cards of perQuery.values()) {
    for (const c of cards) {
      totalCards++; totalOffers += c.prices.length;
      if (c.prices.length > 1) multiPharmacyCards++;
      keys.add(c.presentationKey);
      if (c.laboratory && String(c.laboratory).trim()) withLab++;
    }
  }
  return { totalOffers, totalCards, multiPharmacyCards, withLab, keys };
}

const b = baseMetrics(baseCards);
const n = metrics(nextCards);

// --- identidad: presentationKey y agrupamiento -----------------------------
function keyIndex(perQuery) {
  const idx = new Map(); // presentationKey -> Set(pharmacySlug|productName)
  for (const cards of perQuery.values()) {
    for (const c of cards) {
      const set = idx.get(c.presentationKey) ?? new Set();
      for (const p of c.prices) set.add(`${p.pharmacySlug}::${p.productName}`);
      idx.set(c.presentationKey, set);
    }
  }
  return idx;
}
const bIdx = keyIndex(baseCards);
const nIdx = keyIndex(nextCards);

const keysOnlyBase = [...bIdx.keys()].filter((k) => !nIdx.has(k));
const keysOnlyNext = [...nIdx.keys()].filter((k) => !bIdx.has(k));

// Composición de cada tarjeta (qué ofertas viajan juntas) — falsos merge/split.
function grouping(perQuery) {
  const g = new Map(); // "slug::name" -> firma del grupo al que pertenece
  for (const cards of perQuery.values()) {
    for (const c of cards) {
      const sig = c.prices.map((p) => `${p.pharmacySlug}::${p.productName}`).sort().join(" || ");
      for (const p of c.prices) g.set(`${p.pharmacySlug}::${p.productName}`, sig);
    }
  }
  return g;
}
const bG = grouping(baseCards);
const nG = grouping(nextCards);
let groupingChanges = 0;
const groupingExamples = [];
for (const [offer, sig] of bG) {
  const other = nG.get(offer);
  if (other !== undefined && other !== sig) {
    groupingChanges++;
    if (groupingExamples.length < 10) groupingExamples.push({ offer, base: sig, next: other });
  }
}

// --- slugs Web ------------------------------------------------------------
const FNV_OFFSET = 0xcbf29ce484222325n, FNV_PRIME = 0x100000001b3n, MASK = 0xffffffffffffffffn;
function shortHash(s) {
  let h = FNV_OFFSET;
  for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * FNV_PRIME) & MASK; }
  return h.toString(36);
}
function slugify(t) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function slugs(perQuery) {
  const s = new Map();
  for (const cards of perQuery.values()) {
    for (const c of cards) {
      s.set(`${c.presentationKey}`, `${slugify(c.canonicalName) || "medicamento"}-${shortHash(c.presentationKey)}`);
    }
  }
  return s;
}
const bSlugs = slugs(baseCards), nSlugs = slugs(nextCards);
let slugChanges = 0;
for (const [k, v] of bSlugs) { const o = nSlugs.get(k); if (o !== undefined && o !== v) slugChanges++; }

// --- matchKey -------------------------------------------------------------
let matchKeyChanges = 0;
const bMK = new Map(), nMK = new Map();
for (const cards of baseCards.values()) for (const c of cards) bMK.set(c.canonicalName, c.matchKey);
for (const cards of nextCards.values()) for (const c of cards) nMK.set(c.canonicalName, c.matchKey);
for (const [name, mk] of bMK) { const o = nMK.get(name); if (o !== undefined && o !== mk) matchKeyChanges++; }

// --- salida ---------------------------------------------------------------
// --- cruce BASE vs PROPUESTA sobre lo que la UI MUESTRA como "Marca" --------
// En BASE, `CommercialProductRow` rotulaba "Marca" el valor de `laboratory`.
// En PROPUESTA rotula `brand`. Este cruce cuenta, tarjeta por tarjeta, qué
// cambió para el usuario.
const baseByKey = new Map();
for (const cards of baseCards.values()) for (const c of cards) baseByKey.set(c.presentationKey + "|" + c.canonicalName, c);

let fixedManufacturerShownAsBrand = 0; // antes: fabricante rotulado "Marca"
let recoveredMissingBrand = 0;         // antes: "Marca no identificada", ahora hay marca
let stillUnknown = 0;                  // sin marca antes y después
let lostBrandLabel = 0;                // antes mostraba algo, ahora "Marca no identificada"
let identifiedProposal = 0;            // marca O fabricante conocidos
const fixedExamples = [], recoveredExamples = [], lostExamples = [];

for (const cards of nextCards.values()) {
  for (const c of cards) {
    const prev = baseByKey.get(c.presentationKey + "|" + c.canonicalName);
    const prevShown = prev?.laboratory && String(prev.laboratory).trim() ? String(prev.laboratory) : null;
    const brand = c.brand && String(c.brand).trim() ? String(c.brand) : null;
    if (brand || (c.manufacturer && String(c.manufacturer).trim())) identifiedProposal++;

    if (prevShown && brand && prevShown !== brand) {
      fixedManufacturerShownAsBrand++;
      if (fixedExamples.length < 12) fixedExamples.push({ name: c.canonicalName, antes: prevShown, marca: brand, laboratorio: c.manufacturer });
    } else if (!prevShown && brand) {
      recoveredMissingBrand++;
      if (recoveredExamples.length < 12) recoveredExamples.push({ name: c.canonicalName, marca: brand, fuente: c.brandSource });
    } else if (prevShown && !brand) {
      lostBrandLabel++;
      if (lostExamples.length < 12) lostExamples.push({ name: c.canonicalName, antes: prevShown, laboratorio: c.manufacturer });
    } else if (!prevShown && !brand) {
      stillUnknown++;
    }
  }
}

const report = {
  corpus: { queries: QUERIES.length, offers: [...corpus.values()].reduce((a, l) => a + l.length, 0) },
  base: {
    totalOffers: b.totalOffers, totalCards: b.totalCards, multiPharmacyCards: b.multiPharmacyCards,
    cardsWithBrand: 0, cardsWithManufacturer: 0,
    cardsWithLaboratoryPublished: b.withLab,
    cardsWithUnknownBrand: b.totalCards - b.withLab,
    distinctPresentationKeys: b.keys.size,
  },
  proposal: {
    totalOffers: n.totalOffers, totalCards: n.totalCards, multiPharmacyCards: n.multiPharmacyCards,
    cardsWithBrand: n.cardsWithBrand, cardsWithManufacturer: n.cardsWithManufacturer,
    cardsWithUnknownBrand: n.cardsWithUnknownBrand,
    distinctPresentationKeys: n.keys.size,
  },
  uiBrandLabel: {
    fixedManufacturerShownAsBrand,
    recoveredMissingBrand,
    lostBrandLabel,
    stillUnknown,
    identifiedProposal,
  },
  fixedExamples,
  recoveredExamples,
  lostExamples,
  identity: {
    matchKeyChanges,
    presentationKeysOnlyInBase: keysOnlyBase.length,
    presentationKeysOnlyInProposal: keysOnlyNext.length,
    presentationKeyChanges: keysOnlyBase.length + keysOnlyNext.length,
    groupingChanges,
    // Composición de TODAS las tarjetas idéntica ⇒ 0 y 0, demostrado, no estimado.
    falseMergesIntroduced: groupingChanges === 0 ? 0 : null,
    falseSplitsIntroduced: groupingChanges === 0 ? 0 : null,
    slugChanges,
  },
  groupingExamples,
  sampleKeysOnlyBase: keysOnlyBase.slice(0, 10),
  sampleKeysOnlyNext: keysOnlyNext.slice(0, 10),
};

console.log(JSON.stringify(report, null, 2));

mkdirSync(new URL("../", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/ab-report.json", import.meta.url), JSON.stringify(report, null, 2));

// before-after.csv — una fila por tarjeta de la propuesta
const rows = ["query,pharmacies,canonical_name,base_laboratory,brand,brand_source,manufacturer,active_ingredient"];
for (const [q, cards] of nextCards) {
  for (const c of cards) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    rows.push([q, c.prices.length, esc(c.canonicalName), esc(c.laboratory), esc(c.brand),
      c.brandSource, esc(c.manufacturer), esc(c.activeIngredient)].join(","));
  }
}
writeFileSync(new URL("../before-after.csv", import.meta.url), rows.join("\n") + "\n");
