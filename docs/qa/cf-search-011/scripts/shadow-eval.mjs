/**
 * CF-SEARCH-011 S0 — evaluador shadow v1 vs v2.
 *
 * OFFLINE Y REPRODUCIBLE. Corre sobre el corpus congelado de `raw/`, no toca la
 * red, no escribe en ninguna base de datos, no cambia el payload de produccion y
 * no agrega latencia a ningun camino productivo. V1 sigue siendo la respuesta al
 * usuario; v2 solo calcula identidad y metricas.
 *
 *   node docs/qa/cf-search-011/scripts/shadow-eval.mjs
 *
 * Salidas en `analysis/`:
 *   v1-baseline.json      metricas del motor v1 (metodologia de CF-SEARCH-010)
 *   v2-metrics.json       metricas del motor v2
 *   comparison.json       clasificacion de diferencias v1 vs v2 + gates
 *   offers-v1-v2.csv      una fila por oferta con los ejes de los dos motores
 *   key-cases.json        casos de control (losartan, ambroxol, tapsin, ...)
 *
 * Un solo retrieval alimenta a los dos motores: las ofertas de v2 son EXACTAMENTE
 * las que v1 normalizo, leidas del mismo sobre.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const RAW_DIR = resolve(HERE, "..", "raw");
const OUT_DIR = resolve(HERE, "..", "analysis");

// `docs/` no es un paquete del workspace: el dominio se carga por ruta desde su
// `dist` compilado (`pnpm install` lo construye via postinstall, CLAUDE.md §11).
const DOMAIN_DIST = process.env.QA_DOMAIN_DIST ?? resolve(ROOT, "packages/domain/dist/index.js");
const DOMAIN_V2_DIST =
  process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js");

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
  normalizeBrandToken,
  normalizedWords,
  brandHeadTokens,
  parseMeasurements,
  isVolumeUnit,
} = await import(pathToFileURL(DOMAIN_DIST).href);

const {
  canonicalize,
  canonicalizeOffer,
  compareConcentration,
  concentrationSignature,
  offerSignature,
} = await import(pathToFileURL(DOMAIN_V2_DIST).href);

// ---------------------------------------------------------------------------
// 1. LECTURA DEL CORPUS CONGELADO
// ---------------------------------------------------------------------------

/**
 * Una fila por OFERTA upstream. El endpoint publico devuelve el resultado ya
 * fusionado por v1, asi que cada `card.prices[]` es el conjunto de ofertas que
 * v1 normalizo y agrupo. Es la misma unidad de medida que uso CF-SEARCH-010.
 */
function readUpstreamRows(envelope) {
  const rows = [];
  const cards = Array.isArray(envelope.body) ? envelope.body : [];
  cards.forEach((card, cardIndex) => {
    const offers = card.prices ?? [];
    offers.forEach((price, priceIndex) => {
      rows.push({
        queryId: envelope.id,
        query: envelope.query,
        cardIndex,
        priceIndex,
        v1CardKey: `${envelope.id}#${cardIndex}`,
        pharmacy: price.pharmacySlug,
        rawName: price.productName ?? "",
        channels: price.channels ?? null,
        hasStock: price.hasStock ?? null,
        onlineUrl: price.onlineUrl ?? null,
        fetchedAt: price.fetchedAt ?? envelope.startedAt,
        legacyMatchKey: card.matchKey ?? null,
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

/**
 * Observacion cruda para v2.
 *
 * Los campos estructurados (`brand`, `manufacturer`) llegan a nivel de TARJETA,
 * no de oferta: v1 los resuelve sobre la oferta canonica del grupo. Solo se
 * atribuyen a la oferta cuando la tarjeta tiene UNA sola, que es el unico caso
 * en que la atribucion es inequivoca. En las tarjetas multi-oferta se declaran
 * ausentes: preferir `UNKNOWN` a una procedencia falsa (CF-SEARCH-011 §5).
 */
function toRawOfferInput(row) {
  const unambiguous = row.offersInCard === 1;
  return {
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    price: row.channels ?? { store: 0, online: null, cmr: null, sbpay: null, effective: 0 },
    stock: row.hasStock,
    url: row.onlineUrl,
    capturedAt: row.fetchedAt,
    sourceProductId: null,
    structuredBrand: unambiguous && row.cardBrandSource === "structured" ? row.cardBrand : null,
    structuredManufacturer: unambiguous ? row.cardManufacturer : null,
    isBioequivalent: row.cardIsBioequivalent,
    ispRegistration: null,
    legacyPresentationKey: row.legacyPresentationKey,
  };
}

// ---------------------------------------------------------------------------
// 2. LINEA BASE V1 (metodologia literal de CF-SEARCH-010/trace.mjs)
// ---------------------------------------------------------------------------

const uniq = (xs) => [...new Set(xs)];

function v1Baseline(envelopes, rows) {
  const cards = envelopes.flatMap((e) =>
    (Array.isArray(e.body) ? e.body : []).map((c) => ({ ...c, __query: e.query }))
  );

  const pharmaciesPerCard = cards.map(
    (c) => uniq((c.prices ?? []).map((p) => p.pharmacySlug)).length
  );
  const multi = pharmaciesPerCard.filter((n) => n > 1).length;
  const single = pharmaciesPerCard.filter((n) => n === 1).length;

  // Falsos merges residuales: dos ofertas de la MISMA tarjeta que se contradicen.
  const contradictions = [];
  let pairs = 0;
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
        pairs++;
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
          contradictions.push({ query: c.__query, presentationKey: c.presentationKey, axes, a, b });
        }
      }
    }
  }

  // Falsos splits: grupos farmacologicamente equivalentes repartidos en tarjetas
  // distintas (misma tecnica que CF-QA-001 §5 / CF-SEARCH-010, para comparar).
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
    if (uniq(group.map((c) => c.presentationKey)).length <= 1) continue;
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

  // Aproximacion del EDM con los ejes que v1 YA sabe leer, reproducida
  // LITERALMENTE de `docs/qa/cf-search-010/scripts/gap-metrics.mjs` para poder
  // comparar contra las cifras publicadas de aquella auditoria (292 conceptos,
  // 369 presentaciones, 280 fragmentadas = 75,9 %). No es una propuesta de
  // clave: es el piso de cardinalidad medido con las mismas funciones.
  const approxConcept = (name) =>
    [
      brandHeadTokens(normalizedWords(name)).join("") || "-",
      liquidConcentration(name) ? concentrationKey(liquidConcentration(name)) : "-",
      dosageFormClass(name) ?? "-",
      combinationKey(name) ?? "-",
    ].join("~");
  const approxPackageVolume = (name) => {
    const vols = parseMeasurements(name)
      .filter((m) => m.denominator === null && isVolumeUnit(m.numerator.unit))
      .map((m) => (m.numerator.unit === "l" ? m.numerator.value * 1000 : m.numerator.value));
    return vols.length ? Math.max(...vols) : null;
  };
  const approxPresentation = (name) =>
    [approxConcept(name), unitCountKey(name) ?? "-", approxPackageVolume(name) ?? "-"].join("~");

  const approxCards = cards.map((c) => {
    const rep = (c.prices ?? [])[0]?.productName ?? c.canonicalName ?? "";
    return { card: c, concept: approxConcept(rep), presentation: approxPresentation(rep) };
  });
  const cardsByPresentation = new Map();
  for (const entry of approxCards) {
    if (!cardsByPresentation.has(entry.presentation)) cardsByPresentation.set(entry.presentation, []);
    cardsByPresentation.get(entry.presentation).push(entry.card);
  }
  const edmFragmented = [...cardsByPresentation.values()].filter((g) => g.length > 1).length;

  return {
    capturedQueries: envelopes.length,
    totalCards: cards.length,
    edmApproximation: {
      concepts: uniq(approxCards.map((e) => e.concept)).length,
      presentations: cardsByPresentation.size,
      presentationsSplitAcrossCards: edmFragmented,
      presentationSplitRate: cardsByPresentation.size
        ? +(edmFragmented / cardsByPresentation.size).toFixed(4)
        : 0,
      cardsPerConcept: uniq(approxCards.map((e) => e.concept)).length
        ? +(cards.length / uniq(approxCards.map((e) => e.concept)).length).toFixed(2)
        : 0,
    },
    totalOffers: rows.length,
    uniqueUpstreamNames: uniq(rows.map((r) => r.rawName)).length,
    pharmaciesCovered: uniq(rows.map((r) => r.pharmacy)).length,
    matchKeyCardinality: uniq(cards.map((c) => c.matchKey)).length,
    presentationKeyCardinality: uniq(cards.map((c) => c.presentationKey)).length,
    approximatePresentations: fragGroups.size,
    multiPharmacyCards: multi,
    singlePharmacyCards: single,
    singlePharmacyCardRate: cards.length ? +(single / cards.length).toFixed(4) : 0,
    intraCardPairs: pairs,
    falseMerges: contradictions.length,
    falseMergeRate: pairs ? +(contradictions.length / pairs).toFixed(4) : 0,
    falseMergeSamples: contradictions.slice(0, 10),
    fragmentedIdentityGroups: fragmented,
    fragmentedCards,
    fragmentationRate: fragGroups.size ? +(fragmented / fragGroups.size).toFixed(4) : 0,
    lostComparisonGroups: lostComparison,
  };
}

// ---------------------------------------------------------------------------
// 3. DETECTOR DE CONTRADICCION V2 (base de Gate C)
// ---------------------------------------------------------------------------

/**
 * Ejes en los que dos ofertas se CONTRADICEN.
 *
 * SUPERCONJUNTO ESTRICTO de los 6 ejes que usa la medicion de falso merge de v1
 * (CF-SEARCH-010): agrega marca, laboratorio, volumen de envase y registro ISP,
 * que v1 no compara en ninguna parte. Ausencia nunca es contradiccion; dos
 * valores DECLARADOS y distintos si.
 *
 * DOS MODOS PARA LA CONCENTRACION, y la diferencia importa:
 *
 *   `baseline` (por defecto, el que alimenta el Gate C) — usa la MISMA semantica
 *     que `isCompatibleConcentration()` de v1, que produjo la linea base "false
 *     merges = 0": dos niveles de evidencia distintos (razon vs masa absoluta)
 *     NO son comparables y por lo tanto NO son contradictorios. Es obligatorio
 *     para que el gate compare lo mismo que la linea base y no dos definiciones
 *     distintas.
 *
 *   `strict` — exige ademas que una masa absoluta coincida con el numerador de
 *     la razon (regla R5 del modelo aprobado). Se reporta aparte porque esa
 *     regla NO es invariante de escala: "300 mg" contra "300 mg/100 ml" pasa,
 *     pero "300 mg" contra "15 mg/5 ml" falla, aunque las dos razones sean la
 *     misma concentracion (3 mg/ml). Es un hallazgo real del corpus, registrado
 *     en S0_FAILURES.md, no un motivo para relajar el gate.
 */
function contradictionAxes(a, b, mode = "baseline") {
  const axes = [];

  const ingA = a.attributes.activeIngredients.map((i) => i.token).join("+");
  const ingB = b.attributes.activeIngredients.map((i) => i.token).join("+");
  if (ingA && ingB && ingA !== ingB) axes.push("activeIngredients");

  const concVerdict = compareConcentration(a.attributes.concentration, b.attributes.concentration);
  const sameEvidenceLevel = a.attributes.concentration.kind === b.attributes.concentration.kind;
  if (concVerdict === "incompatible" && (mode === "strict" || sameEvidenceLevel)) {
    axes.push("concentration");
  }

  // Forma Farmacéutica CANÓNICA, no la clase gruesa: si la identidad se decide
  // con `CanonicalDosageForm`, el detector del gate tiene que mirar lo mismo o
  // estaria midiendo con una regla mas debil que la que asigna identidad.
  const formA = a.attributes.canonicalDosageForm;
  const formB = b.attributes.canonicalDosageForm;
  if (formA !== null && formB !== null && formA !== formB) axes.push("canonicalDosageForm");

  const routeA = a.attributes.route;
  const routeB = b.attributes.route;
  if (routeA !== null && routeB !== null && routeA !== routeB) axes.push("route");

  const unitA = a.attributes.pharmaceuticalUnit;
  const unitB = b.attributes.pharmaceuticalUnit;
  if (unitA !== null && unitB !== null && unitA !== unitB) axes.push("pharmaceuticalUnit");

  // Discriminante de identidad no resuelta: `tapsin` contra `null` significa que
  // una observacion desconocida quedo junto a un concepto con principio activo
  // demostrado. Es exactamente el merge inseguro que el eje `disc` impide.
  const discA = a.attributes.unresolvedIdentityDiscriminator;
  const discB = b.attributes.unresolvedIdentityDiscriminator;
  if ((discA !== null || discB !== null) && discA !== discB) {
    axes.push("unresolvedIdentityDiscriminator");
  }

  const qtyA = a.attributes.packageQuantity;
  const qtyB = b.attributes.packageQuantity;
  if (qtyA !== null && qtyB !== null && qtyA !== qtyB) axes.push("packageQuantity");

  const volA = a.attributes.packageVolume;
  const volB = b.attributes.packageVolume;
  if (volA && volB && !(volA.unit === volB.unit && volA.value === volB.value)) {
    axes.push("packageVolume");
  }

  const brandA = a.attributes.brand ? normalizeBrandToken(a.attributes.brand) : null;
  const brandB = b.attributes.brand ? normalizeBrandToken(b.attributes.brand) : null;
  if (brandA && brandB && brandA !== brandB) axes.push("brand");

  if (a.attributes.commercialVariant !== b.attributes.commercialVariant) axes.push("commercialVariant");

  if (a.attributes.administrationTime !== b.attributes.administrationTime) {
    axes.push("administrationTime");
  }

  const mfrA = a.attributes.manufacturer ? normalizeBrandToken(a.attributes.manufacturer) : null;
  const mfrB = b.attributes.manufacturer ? normalizeBrandToken(b.attributes.manufacturer) : null;
  if (mfrA && mfrB && mfrA !== mfrB) axes.push("manufacturer");

  const ispA = a.attributes.ispRegistration;
  const ispB = b.attributes.ispRegistration;
  if (ispA && ispB && ispA !== ispB) axes.push("ispRegistration");

  return axes;
}

// ---------------------------------------------------------------------------
// 4. PIPELINE PRINCIPAL
// ---------------------------------------------------------------------------

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return +sorted[Math.max(0, index)].toFixed(3);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json")).sort();
  const envelopes = [];
  for (const file of files) {
    const env = JSON.parse(await readFile(resolve(RAW_DIR, file), "utf8"));
    if (env.status === 200 && Array.isArray(env.body)) envelopes.push(env);
  }
  if (envelopes.length === 0) throw new Error("corpus vacio: correr fetch-raw.mjs primero");

  const rows = envelopes.flatMap(readUpstreamRows);

  // ---- V1
  const v1 = v1Baseline(envelopes, rows);

  // ---- V2: una sola resolucion sobre el corpus congelado COMPLETO. Es la
  // simulacion fiel del registro persistido que S1 introducira: una firma que ya
  // tiene identidad se recupera, no se recalcula.
  const inputs = rows.map(toRawOfferInput);
  const bySignature = new Map();
  for (const input of inputs) {
    const key = offerSignature(input);
    if (!bySignature.has(key)) bySignature.set(key, input);
  }
  const uniqueInputs = [...bySignature.values()];

  const startedAt = performance.now();
  const graph = canonicalize(uniqueInputs);
  const corpusDurationMs = performance.now() - startedAt;

  const canonicalBySignature = new Map();
  for (const offer of graph.offers) {
    canonicalBySignature.set(
      offerSignature({
        pharmacy: offer.pharmacy,
        rawName: offer.rawName,
        url: offer.url,
        sourceProductId: null,
      }),
      offer
    );
  }

  // ---- Enlace fila upstream -> entidad canonica (Gate A)
  const linked = [];
  const unlinked = [];
  for (const row of rows) {
    const input = toRawOfferInput(row);
    const canonical = canonicalBySignature.get(offerSignature(input));
    const attributes = canonicalizeOffer(input);
    const chainOk =
      canonical !== undefined &&
      typeof canonical.provisionalOfferKey === "string" && canonical.provisionalOfferKey.length > 0 &&
      graph.products.has(canonical.provisionalProductKey) &&
      graph.presentations.has(canonical.provisionalPresentationKey) &&
      graph.concepts.has(canonical.provisionalConceptKey) &&
      graph.products.get(canonical.provisionalProductKey).provisionalPresentationKey === canonical.provisionalPresentationKey &&
      graph.presentations.get(canonical.provisionalPresentationKey).provisionalConceptKey === canonical.provisionalConceptKey;
    if (chainOk) linked.push({ row, canonical, attributes });
    else unlinked.push({ row, reason: canonical === undefined ? "no-canonical-offer" : "broken-chain" });
  }

  const offerCoverage = rows.length ? linked.length / rows.length : 0;

  // ---- Cardinalidad y agrupacion v2
  const productsPerPresentation = new Map();
  for (const product of graph.products.values()) {
    const list = productsPerPresentation.get(product.provisionalPresentationKey) ?? [];
    list.push(product.provisionalProductKey);
    productsPerPresentation.set(product.provisionalPresentationKey, list);
  }

  const pharmaciesByProduct = new Map();
  const pharmaciesByPresentation = new Map();
  const offersByProduct = new Map();
  for (const item of linked) {
    const { canonical } = item;
    if (!pharmaciesByProduct.has(canonical.provisionalProductKey)) pharmaciesByProduct.set(canonical.provisionalProductKey, new Set());
    pharmaciesByProduct.get(canonical.provisionalProductKey).add(canonical.pharmacy);
    if (!pharmaciesByPresentation.has(canonical.provisionalPresentationKey)) {
      pharmaciesByPresentation.set(canonical.provisionalPresentationKey, new Set());
    }
    pharmaciesByPresentation.get(canonical.provisionalPresentationKey).add(canonical.pharmacy);
    if (!offersByProduct.has(canonical.provisionalProductKey)) offersByProduct.set(canonical.provisionalProductKey, []);
    offersByProduct.get(canonical.provisionalProductKey).push(item);
  }

  const productCards = [...pharmaciesByProduct.values()];
  const presentationGroups = [...pharmaciesByPresentation.values()];

  // ---- Gate C: falsos merges de v2 (contradiccion dentro de un mismo provisionalProductKey).
  // Se cuenta sobre OBSERVACIONES UNICAS, no sobre filas upstream: la misma
  // oferta aparece en varias consultas del corpus (`ambroxol`, `ambroxol 30mg` y
  // `ambroxol 30mg/5ml` devuelven el mismo conjunto) y contarla varias veces
  // inflaria tanto el numerador como el denominador sin aportar informacion.
  const v2FalseMerges = [];
  const v2FalseMergesStrict = [];
  let v2Pairs = 0;
  for (const [provisionalProductKey, allItems] of offersByProduct) {
    const seen = new Set();
    const items = allItems.filter((item) => {
      const key = item.canonical.provisionalOfferKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        v2Pairs++;
        const record = {
          provisionalProductKey,
          a: { pharmacy: items[i].row.pharmacy, name: items[i].row.rawName },
          b: { pharmacy: items[j].row.pharmacy, name: items[j].row.rawName },
        };
        const axes = contradictionAxes(items[i], items[j]);
        if (axes.length > 0) v2FalseMerges.push({ ...record, axes });
        const strictAxes = contradictionAxes(items[i], items[j], "strict");
        if (strictAxes.length > 0) v2FalseMergesStrict.push({ ...record, axes: strictAxes });
      }
    }
  }

  // ---- Fragmentacion COMPARABLE: mismo denominador para los dos motores.
  // Una presentacion canonica v2 esta fragmentada cuando sus ofertas quedan
  // repartidas en mas de una tarjeta del motor evaluado. Es la unica forma de
  // responder "bajo la fragmentacion?" sin comparar dos denominadores distintos.
  const v1CardsByPresentation = new Map();
  const v2ProductsByPresentation = new Map();
  const pharmaciesByPresentationForFrag = new Map();
  for (const item of linked) {
    const key = item.canonical.provisionalPresentationKey;
    if (!v1CardsByPresentation.has(key)) v1CardsByPresentation.set(key, new Set());
    v1CardsByPresentation.get(key).add(item.row.v1CardKey);
    if (!v2ProductsByPresentation.has(key)) v2ProductsByPresentation.set(key, new Set());
    v2ProductsByPresentation.get(key).add(item.canonical.provisionalProductKey);
    if (!pharmaciesByPresentationForFrag.has(key)) pharmaciesByPresentationForFrag.set(key, new Set());
    pharmaciesByPresentationForFrag.get(key).add(item.row.pharmacy);
  }
  const comparablePresentations = v1CardsByPresentation.size;
  const v1SplitPresentations = [...v1CardsByPresentation.values()].filter((s) => s.size > 1).length;
  const v2SplitPresentations = [...v2ProductsByPresentation.values()].filter((s) => s.size > 1).length;

  // ---- Comparacion v1 vs v2, por PAR de ofertas dentro de cada consulta
  const byQuery = new Map();
  for (const item of linked) {
    if (!byQuery.has(item.row.queryId)) byQuery.set(item.row.queryId, []);
    byQuery.get(item.row.queryId).push(item);
  }

  const classes = {
    UNCHANGED: 0,
    MERGE_FIXED: 0,
    SPLIT_FIXED: 0,
    SPLIT_LOST: 0,
    MERGE_REGRESSION: 0,
    IDENTITY_UNKNOWN: 0,
  };
  const samples = { MERGE_FIXED: [], SPLIT_FIXED: [], SPLIT_LOST: [], MERGE_REGRESSION: [] };
  let comparedPairs = 0;

  for (const items of byQuery.values()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        comparedPairs++;
        const a = items[i];
        const b = items[j];
        const v1Together = a.row.v1CardKey === b.row.v1CardKey;
        const v2Together = a.canonical.provisionalProductKey === b.canonical.provisionalProductKey;
        if (v1Together === v2Together) {
          classes.UNCHANGED++;
          continue;
        }
        const contradicts = contradictionAxes(a, b).length > 0;
        const unresolved =
          a.attributes.unresolvedIdentityDiscriminator !== null ||
          b.attributes.unresolvedIdentityDiscriminator !== null ||
          a.canonical.provenance.resolution.product.kind === "ambiguous" ||
          b.canonical.provenance.resolution.product.kind === "ambiguous";

        const record = {
          query: a.row.query,
          a: { pharmacy: a.row.pharmacy, name: a.row.rawName },
          b: { pharmacy: b.row.pharmacy, name: b.row.rawName },
        };

        if (!v1Together && v2Together) {
          if (contradicts) {
            classes.SPLIT_LOST++;
            if (samples.SPLIT_LOST.length < 25) samples.SPLIT_LOST.push(record);
          } else {
            classes.MERGE_FIXED++;
            if (samples.MERGE_FIXED.length < 15) samples.MERGE_FIXED.push(record);
          }
        } else {
          if (contradicts) {
            classes.SPLIT_FIXED++;
            if (samples.SPLIT_FIXED.length < 15) samples.SPLIT_FIXED.push(record);
          } else {
            classes.MERGE_REGRESSION++;
            if (samples.MERGE_REGRESSION.length < 15) samples.MERGE_REGRESSION.push(record);
          }
        }
        if (unresolved) classes.IDENTITY_UNKNOWN++;
      }
    }
  }

  // ---- Gate B (definicion del ticket §16): oferta valida que deja de estar
  // representada/enlazada correctamente por el modelo v2.
  const splitLostOffers = unlinked.length;

  // ---- Calidad de identidad
  const resolutionKinds = { complete: 0, subsumed: 0, isolated: 0, ambiguous: 0 };
  let unresolvedIngredient = 0;
  let structuredEvidence = 0;
  for (const item of linked) {
    resolutionKinds[item.canonical.provenance.resolution.concept.kind]++;
    if (item.attributes.unresolvedIdentityDiscriminator !== null) unresolvedIngredient++;
    if (
      item.attributes.concentration.kind !== "absent" &&
      item.attributes.canonicalDosageForm !== null
    ) {
      structuredEvidence++;
    }
  }

  // ---- ESTABILIDAD ENTRE CONTEXTOS DE RESOLUCION (revision CTO PR #159, punto 3)
  //
  // Se miden DOS cosas distintas, y separarlas es el resultado que importa:
  //
  //   1. FIRMA CRUDA (`rawSignature`) — solo depende del nombre de la oferta.
  //      Debe ser 100 % estable por construccion: la canonicalizacion es pura.
  //      Si esto bajara de 100 %, habria un defecto de algoritmo.
  //
  //   2. CLAVE RESUELTA (`provisionalConceptKey`) — depende de que otras firmas
  //      son visibles, porque la subsuncion resuelve contra el conjunto
  //      presente. Toda diferencia se atribuye oferta por oferta, con el tipo de
  //      resolucion en cada contexto, para poder decir si es subsuncion correcta
  //      o un defecto.
  let contextStable = 0;
  let contextTotal = 0;
  let rawSignatureStable = 0;
  const contextDependent = [];
  const perQueryDurations = [];
  for (const [queryId, items] of byQuery) {
    const queryInputs = items.map((item) => toRawOfferInput(item.row));
    const t0 = performance.now();
    const queryGraph = canonicalize(queryInputs);
    perQueryDurations.push(performance.now() - t0);
    const bySig = new Map();
    for (const offer of queryGraph.offers) {
      bySig.set(
        offerSignature({ pharmacy: offer.pharmacy, rawName: offer.rawName, url: offer.url, sourceProductId: null }),
        offer
      );
    }
    for (const item of items) {
      const local = bySig.get(offerSignature(toRawOfferInput(item.row)));
      contextTotal++;
      const fullTrace = item.canonical.provenance.resolution.concept;
      const localTrace = local?.provenance.resolution.concept;
      if (localTrace && localTrace.rawSignature === fullTrace.rawSignature) rawSignatureStable++;
      if (local && local.provisionalConceptKey === item.canonical.provisionalConceptKey) {
        contextStable++;
        continue;
      }
      contextDependent.push({
        query: item.row.query,
        pharmacy: item.row.pharmacy,
        rawName: item.row.rawName,
        rawSignature: fullTrace.rawSignature,
        fullCorpus: {
          key: item.canonical.provisionalConceptKey,
          resolvedSignature: fullTrace.signature,
          kind: fullTrace.kind,
          candidateCount: fullTrace.candidateCount,
        },
        isolatedQuery: {
          key: local?.provisionalConceptKey ?? null,
          resolvedSignature: localTrace?.signature ?? null,
          kind: localTrace?.kind ?? null,
          candidateCount: localTrace?.candidateCount ?? null,
        },
        reason:
          localTrace && localTrace.rawSignature !== fullTrace.rawSignature
            ? "canonicalization-differs (DEFECTO: la lectura del nombre no puede depender del contexto)"
            : `subsumption-host-availability: la firma parcial encuentra ${fullTrace.candidateCount} anfitriona(s) en el corpus completo y ${localTrace?.candidateCount ?? 0} en la consulta aislada`,
      });
    }
    void queryId;
  }
  perQueryDurations.sort((a, b) => a - b);

  // ---- Colisiones de identificador: dos firmas distintas con el mismo ID
  const signatureById = new Map();
  let idCollisions = 0;
  for (const [id, concept] of graph.concepts) collectSignature(id, concept.resolution.signature);
  for (const [id, presentation] of graph.presentations) collectSignature(id, presentation.resolution.signature);
  for (const [id, product] of graph.products) collectSignature(id, product.resolution.signature);
  function collectSignature(id, signature) {
    const known = signatureById.get(id);
    if (known === undefined) signatureById.set(id, signature);
    else if (known !== signature) idCollisions++;
  }

  const v2 = {
    processedOffers: linked.length,
    upstreamOffers: rows.length,
    uniqueObservations: uniqueInputs.length,
    offerCoverage: +offerCoverage.toFixed(6),
    concepts: graph.concepts.size,
    presentations: graph.presentations.size,
    products: graph.products.size,
    offerIds: uniq(graph.offers.map((o) => o.provisionalOfferKey)).length,
    identifierCollisions: idCollisions,
    estimatedCards: graph.products.size,
    presentationGroups: graph.presentations.size,
    multiPharmacyCards: productCards.filter((s) => s.size > 1).length,
    singlePharmacyCards: productCards.filter((s) => s.size === 1).length,
    singlePharmacyCardRate: productCards.length
      ? +(productCards.filter((s) => s.size === 1).length / productCards.length).toFixed(4)
      : 0,
    multiPharmacyPresentationGroups: presentationGroups.filter((s) => s.size > 1).length,
    singlePharmacyPresentationGroups: presentationGroups.filter((s) => s.size === 1).length,
    singlePharmacyPresentationRate: presentationGroups.length
      ? +(
          presentationGroups.filter((s) => s.size === 1).length / presentationGroups.length
        ).toFixed(4)
      : 0,
    fragmentedPresentations: [...productsPerPresentation.values()].filter((v) => v.length > 1).length,
    fragmentationRate: productsPerPresentation.size
      ? +(
          [...productsPerPresentation.values()].filter((v) => v.length > 1).length /
          productsPerPresentation.size
        ).toFixed(4)
      : 0,
    cardsPerConcept: graph.concepts.size
      ? +(graph.products.size / graph.concepts.size).toFixed(2)
      : 0,
    intraProductPairs: v2Pairs,
    falseMerges: v2FalseMerges.length,
    falseMergeRate: v2Pairs ? +(v2FalseMerges.length / v2Pairs).toFixed(6) : 0,
    falseMergeSamples: v2FalseMerges.slice(0, 20),
    falseMergesStrictConcentration: v2FalseMergesStrict.length,
    falseMergesStrictSamples: v2FalseMergesStrict.slice(0, 20),
    conceptResolution: resolutionKinds,
    offersWithUnresolvedIngredient: unresolvedIngredient,
    identityUnknownRate: linked.length ? +(unresolvedIngredient / linked.length).toFixed(4) : 0,
    inferredIdentityRate: linked.length
      ? +(resolutionKinds.subsumed / linked.length).toFixed(4)
      : 0,
    structuredEvidenceRate: linked.length ? +(structuredEvidence / linked.length).toFixed(4) : 0,
    // Estabilidad de la LECTURA del nombre. Debe ser 1: la canonicalizacion no
    // mira ninguna otra oferta.
    rawSignatureStabilityAcrossContexts: contextTotal
      ? +(rawSignatureStable / contextTotal).toFixed(6)
      : 0,
    // Estabilidad de la CLAVE RESUELTA. No puede ser 1 mientras la resolucion se
    // haga contra el corpus visible y no contra un registro persistido.
    conceptKeyStabilityAcrossContexts: contextTotal
      ? +(contextStable / contextTotal).toFixed(6)
      : 0,
    contextDependentIdentities: contextDependent.length,
    contextDependentIdentityRate: contextTotal
      ? +(contextDependent.length / contextTotal).toFixed(6)
      : 0,
    contextDependentOffers: uniq(contextDependent.map((d) => `${d.pharmacy}::${d.rawName}`)).length,
    contextDependentDetail: contextDependent,
    performance: {
      corpusRunMs: +corpusDurationMs.toFixed(3),
      perQueryP50Ms: percentile(perQueryDurations, 50),
      perQueryP95Ms: percentile(perQueryDurations, 95),
      queriesMeasured: perQueryDurations.length,
    },
  };

  const gates = {
    gateA: {
      name: "Offer Coverage",
      value: v2.offerCoverage,
      formatted: `${linked.length}/${rows.length} = ${(v2.offerCoverage * 100).toFixed(2)} %`,
      threshold: ">= 0.995",
      pass: v2.offerCoverage >= 0.995,
    },
    gateB: {
      name: "SPLIT_LOST",
      value: splitLostOffers,
      formatted: `${splitLostOffers} ofertas sin enlace canonico correcto`,
      threshold: "= 0",
      pass: splitLostOffers === 0,
      pairwiseFalseMergeSense: classes.SPLIT_LOST,
    },
    gateC: {
      name: "False Merge Rate",
      value: v2.falseMergeRate,
      formatted: `${v2FalseMerges.length}/${v2Pairs} pares intra-producto`,
      threshold: "= 0",
      pass: v2FalseMerges.length === 0,
    },
  };
  const finalVerdict =
    gates.gateA.pass && gates.gateB.pass && gates.gateC.pass && classes.SPLIT_LOST === 0
      ? "PASS_S0"
      : "STOP_AND_REASSESS";

  const comparison = {
    corpusQueries: envelopes.map((e) => ({ id: e.id, query: e.query, capturedAt: e.startedAt })),
    comparableFragmentation: {
      denominatorPresentations: comparablePresentations,
      v1PresentationsSplitAcrossCards: v1SplitPresentations,
      v1FragmentationRate: comparablePresentations
        ? +(v1SplitPresentations / comparablePresentations).toFixed(4)
        : 0,
      v2PresentationsSplitAcrossCards: v2SplitPresentations,
      v2FragmentationRate: comparablePresentations
        ? +(v2SplitPresentations / comparablePresentations).toFixed(4)
        : 0,
      v1CardsPerV2Concept: v2.concepts ? +(v1.totalCards / v2.concepts).toFixed(2) : 0,
      v2CardsPerV2Concept: v2.concepts ? +(v2.products / v2.concepts).toFixed(2) : 0,
    },
    comparedPairs,
    classes,
    disagreementRate: comparedPairs
      ? +(1 - classes.UNCHANGED / comparedPairs).toFixed(6)
      : 0,
    samples,
    unlinkedOffers: unlinked.slice(0, 20),
    gates,
    finalVerdict,
  };

  // ---- Casos de control
  const keyCases = buildKeyCases(linked, graph);

  // ---- Salidas
  await writeFile(resolve(OUT_DIR, "v1-baseline.json"), JSON.stringify(v1, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "v2-metrics.json"), JSON.stringify(v2, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "comparison.json"), JSON.stringify(comparison, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "key-cases.json"), JSON.stringify(keyCases, null, 2), "utf8");
  await writeFile(
    resolve(OUT_DIR, "context-stability.json"),
    JSON.stringify(
      {
        offersEvaluated: contextTotal,
        rawSignatureStable,
        rawSignatureStabilityRate: v2.rawSignatureStabilityAcrossContexts,
        resolvedKeyStable: contextStable,
        resolvedKeyStabilityRate: v2.conceptKeyStabilityAcrossContexts,
        contextDependentIdentities: contextDependent.length,
        detail: contextDependent,
      },
      null,
      2
    ),
    "utf8"
  );

  // La tabla completa (1.633 filas) es un dump REGENERABLE: se escribe para
  // inspeccion local y queda excluida del repositorio por `.gitignore`. Lo que
  // si se versiona es la evidencia de los casos de control, que es lo que hay
  // que poder revisar uno por uno sin volver a correr nada.
  await writeFile(resolve(OUT_DIR, "offers-v1-v2.csv"), toCsv(linked), "utf8");
  const controlNames = new Set(
    Object.values(keyCases).flatMap((c) => c.productBreakdown.flatMap((p) => p.names))
  );
  const controlRows = [];
  const seenControl = new Set();
  for (const item of linked) {
    if (!controlNames.has(item.row.rawName)) continue;
    const key = `${item.row.pharmacy}::${item.row.rawName}`;
    if (seenControl.has(key)) continue;
    seenControl.add(key);
    controlRows.push(item);
  }
  await writeFile(resolve(OUT_DIR, "control-cases.csv"), toCsv(controlRows), "utf8");

  console.log(JSON.stringify({ v1, v2, comparison: { ...comparison, samples: undefined } }, null, 2));
}

// ---------------------------------------------------------------------------
// 5. CASOS DE CONTROL (CF-SEARCH-011 §17)
// ---------------------------------------------------------------------------

function buildKeyCases(linked, graph) {
  const cases = {};
  const build = (label, predicate) => {
    const items = linked.filter(predicate);
    const products = new Map();
    for (const item of items) {
      const key = item.canonical.provisionalProductKey;
      if (!products.has(key)) products.set(key, []);
      products.get(key).push(item);
    }
    cases[label] = {
      offers: items.length,
      v1Cards: uniq(items.map((i) => i.row.v1CardKey)).length,
      v1PresentationKeys: uniq(items.map((i) => i.row.legacyPresentationKey)).length,
      v2Concepts: uniq(items.map((i) => i.canonical.provisionalConceptKey)).length,
      v2Presentations: uniq(items.map((i) => i.canonical.provisionalPresentationKey)).length,
      v2Products: uniq(items.map((i) => i.canonical.provisionalProductKey)).length,
      pharmacies: uniq(items.map((i) => i.row.pharmacy)).length,
      // Se recortan los nombres y el numero de productos listados: la evidencia
      // que se versiona es la que se revisa a ojo, no un dump regenerable.
      productBreakdown: [...products.entries()]
        .map(([provisionalProductKey, group]) => ({
          provisionalProductKey,
          brand: graph.products.get(provisionalProductKey)?.brand ?? null,
          variant: graph.products.get(provisionalProductKey)?.commercialVariant ?? null,
          manufacturer: graph.products.get(provisionalProductKey)?.manufacturer ?? null,
          conceptSignature: graph.concepts.get(group[0].canonical.provisionalConceptKey)?.resolution.signature,
          presentationSignature: graph.presentations.get(group[0].canonical.provisionalPresentationKey)
            ?.resolution.signature,
          offers: group.length,
          pharmacies: uniq(group.map((g) => g.row.pharmacy)),
          names: uniq(group.map((g) => g.row.rawName)).slice(0, 6),
        }))
        .sort((a, b) => b.offers - a.offers)
        .slice(0, 20),
    };
  };

  const name = (item) => item.row.rawName.toLowerCase();
  build("losartan-50mg-x30", (i) =>
    name(i).includes("losartan") || name(i).includes("losartán")
      ? i.attributes.packageQuantity === 30 &&
        i.attributes.concentration.kind === "mass-only" &&
        i.attributes.concentration.value.value === 50
      : false
  );
  build("ambroxol", (i) => name(i).includes("ambroxol") || i.attributes.activeIngredients.some((x) => x.token === "ambroxol"));
  build("tapsin", (i) => name(i).includes("tapsin"));
  build("ibuprofeno", (i) => i.attributes.activeIngredients.some((x) => x.token === "ibuprofeno"));
  build("combinations", (i) => i.attributes.activeIngredients.length > 1);
  return cases;
}

// ---------------------------------------------------------------------------

function toCsv(linked) {
  const rows = linked.map(({ row, canonical, attributes }) => ({
    query: row.query,
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    legacyMatchKey: row.legacyMatchKey,
    legacyPresentationKey: row.legacyPresentationKey,
    v1CardKey: row.v1CardKey,
    provisionalConceptKey: canonical.provisionalConceptKey,
    provisionalPresentationKey: canonical.provisionalPresentationKey,
    provisionalProductKey: canonical.provisionalProductKey,
    provisionalOfferKey: canonical.provisionalOfferKey,
    activeIngredients: attributes.activeIngredients.map((i) => i.token).join("+"),
    ingredientEvidence: uniq(attributes.activeIngredients.map((i) => i.evidence)).join("+"),
    concentration: concentrationSignature(attributes.concentration),
    concentrationKind: attributes.concentration.kind,
    dosageForm: attributes.dosageForm,
    route: attributes.route,
    packageQuantity: attributes.packageQuantity,
    packageVolume: attributes.packageVolume
      ? `${attributes.packageVolume.value}${attributes.packageVolume.unit}`
      : null,
    packageType: attributes.packageType,
    brand: attributes.brand,
    commercialVariant: attributes.commercialVariant,
    administrationTime: attributes.administrationTime,
    manufacturer: attributes.manufacturer,
    ispRegistration: attributes.ispRegistration,
    conceptResolution: canonical.provenance.resolution.concept.kind,
    conceptConfidence: canonical.provenance.resolution.concept.confidence,
    presentationResolution: canonical.provenance.resolution.presentation.kind,
    productResolution: canonical.provenance.resolution.product.kind,
    canonicalName: attributes.canonicalName,
  }));
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

void concentrationKey;

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
