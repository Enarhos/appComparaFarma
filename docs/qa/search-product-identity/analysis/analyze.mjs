/**
 * CF-QA-001 — analisis de identidad de producto sobre las respuestas RAW.
 *
 * Uso:  node docs/qa/search-product-identity/analysis/analyze.mjs
 *
 * Requiere dos builds de @comparafarma/domain ya compilados:
 *   BASE = origin/main          -> <este worktree>/packages/domain/dist
 *   PR   = fix/quantity-...     -> C:/Belford/wt-quantity-mismatch/packages/domain/dist
 * (ambos con `tsc --project tsconfig.build.json`; ver README.md de esta carpeta)
 *
 * Salidas: offers.csv, offers.json, findings.json, ab-merge.json
 * NO forma parte del runtime.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "..", "raw");
const BASE_DIST = process.env.QA_BASE_DIST ?? resolve(HERE, "../../../../packages/domain/dist/index.js");
const PR_DIST = process.env.QA_PR_DIST ?? "C:/Belford/wt-quantity-mismatch/packages/domain/dist/index.js";

const BASE = await import(pathToFileURL(BASE_DIST).href);
const PR = await import(pathToFileURL(PR_DIST).href);

/**
 * Dominios legitimos por farmacia. Verificados contra los adaptadores de
 * `api/src/clients/` y contra la propia respuesta de produccion: araucomed
 * publica en `.com`, dr-simi sirve imagenes desde su CDN de VTEX y salcobrand
 * desde `salcobrandonline.cl`. La lista es explicita para que un host NUEVO
 * salte como hallazgo en vez de pasar por una heuristica de "parece un CDN".
 */
const PHARMACY_HOSTS = {
  "cruz-verde": ["cruzverde.cl"],
  salcobrand: ["salcobrand.cl", "salcobrandonline.cl"],
  ahumada: ["farmaciasahumada.cl"],
  "dr-simi": ["drsimi.cl", "farmaciasdrsimi.cl", "farmaciasdeldrsimicl.vteximg.com.br", "farmaciasdeldrsimi.cl"],
  araucomed: ["araucomed.cl", "araucomed.com"],
  ecofarmacias: ["ecofarmacias.cl"],
  farmex: ["farmex.cl"],
  sermecoop: ["sermecoop.cl"],
  easyfarma: ["easyfarma.cl"],
};

/** Desenvuelve la URL real detras del tracker /api/go?...&url=<encoded>. */
function realUrl(tracked) {
  if (!tracked) return null;
  try {
    const u = new URL(tracked);
    const inner = u.searchParams.get("url");
    return inner ?? tracked;
  } catch {
    return tracked;
  }
}

function hostOf(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Dosis declarada en el nombre, normalizada a mg (o ml para liquidos). */
function doseOf(name) {
  const raw = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const ml = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/g)];
  const mcg = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|ug)\b/g)];
  const mg = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/g)];
  const g = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/g)];
  const n = (m) => parseFloat(m[1].replace(",", "."));
  if (mg.length) return { value: n(mg[0]), unit: "mg" };
  if (mcg.length) return { value: n(mcg[0]) / 1000, unit: "mg" };
  if (g.length) return { value: Math.max(...g.map(n)) * 1000, unit: "mg" };
  if (ml.length) return { value: Math.max(...ml.map(n)), unit: "ml" };
  return { value: null, unit: null };
}

const TRUNC = /(\.\.\.|\u2026)\s*$/;

async function loadOffers() {
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const offers = [];
  const cards = [];
  for (const file of files) {
    const env = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
    if (!Array.isArray(env.results)) continue;
    env.results.forEach((card, ci) => {
      const cardId = `${env.query}#${ci}`;
      cards.push({ cardId, query: env.query, ...card });
      card.prices.forEach((p) => {
        const url = realUrl(p.onlineUrl);
        let trackerSlug = null;
        let trackerMatchKey = null;
        try {
          const t = new URL(p.onlineUrl ?? "");
          trackerSlug = t.searchParams.get("slug");
          trackerMatchKey = t.searchParams.get("matchKey");
        } catch { /* onlineUrl null o no absoluta */ }
        const dose = doseOf(p.productName);
        offers.push({
          query: env.query,
          cardId,
          cardMatchKey: card.matchKey,
          cardPresentationKey: card.presentationKey,
          cardCanonicalName: card.canonicalName,
          pharmacy: p.pharmacySlug,
          rawProductName: p.productName,
          displayProductName: card.canonicalName,
          laboratory: card.laboratory ?? null,
          isBioequivalent: card.isBioequivalent ?? null,
          activeIngredient: BASE.matchKey(p.productName).split("|")[0] || null,
          strength: dose.value === null ? null : `${dose.value}${dose.unit}`,
          quantityPR: PR.unitCountKey(p.productName),
          unitCountKey: PR.unitCountKey(p.productName),
          commercialVariantKey: BASE.commercialVariantKey(p.productName),
          dosageFormClass: BASE.dosageFormClass(p.productName),
          combinationKey: BASE.combinationKey(p.productName),
          matchKey: BASE.matchKey(p.productName),
          // Cantidad tal como la ve `matchKey` (ultimo segmento, cuando es
          // numerico). Es el eje de cantidad que YA existe en produccion.
          matchKeyQty: (() => {
            const segs = BASE.matchKey(p.productName).split("|");
            const last = segs[segs.length - 1];
            return /^\d+$/.test(last) ? Number(last) : null;
          })(),
          presentationKey: card.presentationKey,
          price: p.channels.effective,
          channel:
            p.channels.effective === p.channels.online
              ? "online"
              : p.channels.effective === p.channels.cmr
                ? "cmr"
                : p.channels.effective === p.channels.sbpay
                  ? "sbpay"
                  : "store",
          channelsStore: p.channels.store,
          channelsOnline: p.channels.online,
          channelsCmr: p.channels.cmr,
          channelsSbpay: p.channels.sbpay,
          stock: p.hasStock,
          onlineUrl: url,
          urlHost: hostOf(url),
          trackerSlug,
          trackerMatchKey,
          imageHost: hostOf(p.imageUrl),
          truncated: TRUNC.test(p.productName.trim()),
          fetchedAt: p.fetchedAt,
        });
      });
    });
  }
  return { offers, cards };
}

// --- exploded input para el A/B de mergeDuplicates -------------------------
function explode(cards) {
  const out = [];
  for (const card of cards) {
    for (const p of card.prices) {
      out.push({ ...card, prices: [p], bestPrice: p.channels.effective, bestPharmacy: p.pharmacySlug });
    }
  }
  return out;
}

function cardSignature(card) {
  return `${card.presentationKey}::${card.canonicalName}::${card.prices
    .map((p) => `${p.pharmacySlug}@${p.channels.effective}`)
    .sort()
    .join(",")}`;
}

async function main() {
  const { offers, cards } = await loadOffers();

  // ---------- matriz normalizada ----------
  const cols = [
    "query", "pharmacy", "rawProductName", "displayProductName", "laboratory",
    "activeIngredient", "strength", "quantity", "unitCountKey", "commercialVariantKey",
    "dosageFormClass", "combinationKey", "matchKey", "presentationKey", "price",
    "channel", "stock", "onlineUrl",
  ];
  const csvVal = (v) => {
    if (v === null || v === undefined) return "null";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(",")];
  for (const o of offers) {
    csv.push(cols.map((c) => csvVal(c === "quantity" ? o.quantityPR : o[c])).join(","));
  }
  await writeFile(join(HERE, "offers.csv"), csv.join("\n"), "utf8");
  // Sin indentacion: es el mismo contenido que offers.csv pero tipado (null real,
  // booleanos reales) para los scripts de verificacion. Formatearlo triplicaba el
  // peso del archivo en el repositorio sin agregar informacion.
  await writeFile(join(HERE, "offers.json"), JSON.stringify(offers), "utf8");

  // ---------- tests por tarjeta ----------
  const byCard = new Map();
  for (const o of offers) {
    if (!byCard.has(o.cardId)) byCard.set(o.cardId, []);
    byCard.get(o.cardId).push(o);
  }

  const findings = {
    quantityMismatch: [], quantityNullVsExplicit: [], doseMismatch: [],
    formMismatch: [], variantMismatch: [], offerIntegrity: [],
    truncation: [], priceOutlier: [], stockAnomaly: [], falseSplit: [],
    labEqualsIngredient: [], unitCountMisread: [],
  };

  // Desacuerdo entre el eje NUEVO del PR y el eje YA vigente en produccion.
  // Ambos explicitos y distintos ⇒ uno de los dos lee mal el nombre; se
  // inspecciona a mano cual.
  for (const o of offers) {
    if (o.matchKeyQty !== null && o.unitCountKey !== null && o.matchKeyQty !== o.unitCountKey) {
      findings.unitCountMisread.push({
        pharmacy: o.pharmacy, query: o.query, cardId: o.cardId,
        name: o.rawProductName, matchKeyQty: o.matchKeyQty, unitCountKey: o.unitCountKey,
        presentationKey: o.cardPresentationKey,
      });
    }
  }

  for (const [cardId, group] of byCard) {
    if (group.length > 1) {
      const counts = group.map((o) => o.unitCountKey);
      const explicit = [...new Set(counts.filter((c) => c !== null))];
      if (explicit.length > 1) {
        findings.quantityMismatch.push({ cardId, presentationKey: group[0].cardPresentationKey, counts: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, unitCount: o.unitCountKey, price: o.price })) });
      } else if (explicit.length === 1 && counts.some((c) => c === null)) {
        findings.quantityNullVsExplicit.push({ cardId, presentationKey: group[0].cardPresentationKey, counts: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, unitCount: o.unitCountKey, price: o.price })) });
      }

      const doses = [...new Set(group.map((o) => o.strength).filter((s) => s !== null))];
      if (doses.length > 1) {
        findings.doseMismatch.push({ cardId, presentationKey: group[0].cardPresentationKey, doses, offers: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, strength: o.strength, price: o.price })) });
      }

      const forms = [...new Set(group.map((o) => o.dosageFormClass).filter((f) => f !== null))];
      if (forms.length > 1) {
        findings.formMismatch.push({ cardId, presentationKey: group[0].cardPresentationKey, forms, offers: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, form: o.dosageFormClass, price: o.price })) });
      }

      const variants = [...new Set(group.map((o) => o.commercialVariantKey))];
      if (variants.length > 1) {
        findings.variantMismatch.push({ cardId, presentationKey: group[0].cardPresentationKey, variants, offers: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, variant: o.commercialVariantKey, price: o.price })) });
      }

      const prices = group.map((o) => o.price);
      const min = Math.min(...prices), max = Math.max(...prices);
      if (min > 0 && max / min >= 3) {
        findings.priceOutlier.push({ cardId, presentationKey: group[0].cardPresentationKey, ratio: +(max / min).toFixed(2), offers: group.map((o) => ({ pharmacy: o.pharmacy, name: o.rawProductName, price: o.price, unitCount: o.unitCountKey, stock: o.stock, channel: o.channel })) });
      }
    }
  }

  // ---------- integridad de tarjeta: el titulo pertenece a una oferta real ----------
  for (const [cardId, group] of byCard) {
    const names = group.map((o) => o.rawProductName);
    if (!names.includes(group[0].cardCanonicalName)) {
      findings.offerIntegrity.push({
        type: "CANONICAL_NAME_NOT_IN_CARD",
        cardId,
        presentationKey: group[0].cardPresentationKey,
        canonicalName: group[0].cardCanonicalName,
        offerNames: names,
      });
    }
  }

  // ---------- integridad de oferta ----------
  for (const o of offers) {
    const expected = PHARMACY_HOSTS[o.pharmacy] ?? [];
    if (o.urlHost && !expected.some((h) => o.urlHost.endsWith(h))) {
      findings.offerIntegrity.push({ type: "URL_HOST_MISMATCH", pharmacy: o.pharmacy, urlHost: o.urlHost, name: o.rawProductName, cardId: o.cardId });
    }
    if (o.trackerSlug && o.trackerSlug !== o.pharmacy) {
      findings.offerIntegrity.push({ type: "TRACKER_SLUG_MISMATCH", pharmacy: o.pharmacy, trackerSlug: o.trackerSlug, name: o.rawProductName, cardId: o.cardId });
    }
    if (o.trackerMatchKey && o.trackerMatchKey !== o.cardMatchKey) {
      findings.offerIntegrity.push({ type: "TRACKER_MATCHKEY_MISMATCH", pharmacy: o.pharmacy, trackerMatchKey: o.trackerMatchKey, cardMatchKey: o.cardMatchKey, name: o.rawProductName, cardId: o.cardId });
    }
    if (o.imageHost && !expected.some((h) => o.imageHost.endsWith(h))) {
      findings.offerIntegrity.push({ type: "IMAGE_HOST_FOREIGN", pharmacy: o.pharmacy, imageHost: o.imageHost, name: o.rawProductName, cardId: o.cardId });
    }
    if (o.truncated) findings.truncation.push({ pharmacy: o.pharmacy, name: o.rawProductName, cardId: o.cardId, query: o.query });
    if (typeof o.stock !== "boolean") findings.stockAnomaly.push({ cardId: o.cardId, pharmacy: o.pharmacy, stock: o.stock });
    if (o.laboratory && o.activeIngredient && o.laboratory.toLowerCase().replace(/[^a-z]/g, "") === o.activeIngredient.replace(/[^a-z]/g, "")) {
      findings.labEqualsIngredient.push({ cardId: o.cardId, pharmacy: o.pharmacy, laboratory: o.laboratory, activeIngredient: o.activeIngredient, name: o.rawProductName });
    }
  }

  // ---------- false splits ----------
  const splitIdx = new Map();
  for (const [cardId, group] of byCard) {
    const o = group[0];
    const sig = [o.query, o.matchKey, o.strength, o.dosageFormClass, o.commercialVariantKey, o.unitCountKey, o.laboratory, o.isBioequivalent].join("|");
    if (!splitIdx.has(sig)) splitIdx.set(sig, []);
    splitIdx.get(sig).push({ cardId, presentationKey: o.cardPresentationKey, canonicalName: o.cardCanonicalName, pharmacies: group.map((g) => g.pharmacy), prices: group.map((g) => g.price) });
  }
  for (const [sig, list] of splitIdx) {
    const keys = [...new Set(list.map((l) => l.presentationKey))];
    if (list.length > 1 && keys.length > 1) findings.falseSplit.push({ signature: sig, cards: list });
  }

  // ---------- A/B mergeDuplicates ----------
  const ab = [];
  const rawByQuery = new Map();
  for (const c of cards) {
    if (!rawByQuery.has(c.query)) rawByQuery.set(c.query, []);
    rawByQuery.get(c.query).push(c);
  }
  for (const [query, qcards] of rawByQuery) {
    const input = explode(qcards);
    const baseOut = BASE.mergeDuplicates(input.map((c) => ({ ...c })));
    const prOut = PR.mergeDuplicates(input.map((c) => ({ ...c })));
    const baseSig = new Set(baseOut.map(cardSignature));
    const prSig = new Set(prOut.map(cardSignature));
    const onlyBase = baseOut.filter((c) => !prSig.has(cardSignature(c)));
    const onlyPr = prOut.filter((c) => !baseSig.has(cardSignature(c)));
    ab.push({
      query,
      inputOffers: input.length,
      baseCards: baseOut.length,
      prCards: prOut.length,
      delta: prOut.length - baseOut.length,
      onlyInBase: onlyBase.map((c) => ({ presentationKey: c.presentationKey, canonicalName: c.canonicalName, offers: c.prices.map((p) => `${p.pharmacySlug}|${p.productName}|${p.channels.effective}`) })),
      onlyInPr: onlyPr.map((c) => ({ presentationKey: c.presentationKey, canonicalName: c.canonicalName, offers: c.prices.map((p) => `${p.pharmacySlug}|${p.productName}|${p.channels.effective}`) })),
    });
  }

  // ---------- laboratorio por farmacia ----------
  // Solo tarjetas de UNA oferta: ahi el `laboratory` de la tarjeta pertenece
  // inequivocamente a esa farmacia. En tarjetas fusionadas el laboratorio es
  // el de la oferta canonica y no puede atribuirse al resto.
  const labMatrix = {};
  for (const [, group] of byCard) {
    if (group.length !== 1) continue;
    const o = group[0];
    const m = (labMatrix[o.pharmacy] ??= { offers: 0, labNull: 0, labEqualsIngredient: 0, samples: [] });
    m.offers++;
    if (o.laboratory === null || o.laboratory === "") m.labNull++;
    else {
      const norm = o.laboratory.toLowerCase().replace(/[^a-z]/g, "");
      if (norm === o.activeIngredient?.replace(/[^a-z]/g, "")) m.labEqualsIngredient++;
      if (m.samples.length < 12) m.samples.push({ laboratory: o.laboratory, name: o.rawProductName });
    }
  }
  for (const k of Object.keys(labMatrix)) {
    labMatrix[k].pctNull = +((labMatrix[k].labNull / labMatrix[k].offers) * 100).toFixed(1);
  }

  const truncByPharmacy = {};
  for (const t of findings.truncation) truncByPharmacy[t.pharmacy] = (truncByPharmacy[t.pharmacy] ?? 0) + 1;

  await writeFile(join(HERE, "laboratory-matrix.json"), JSON.stringify({ labMatrix, truncByPharmacy }, null, 1), "utf8");

  const summary = {
    generatedAt: new Date().toISOString(),
    queries: rawByQuery.size,
    cards: cards.length,
    offers: offers.length,
    pharmacies: [...new Set(offers.map((o) => o.pharmacy))].sort(),
    counts: Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length])),
    abTotals: {
      baseCards: ab.reduce((s, a) => s + a.baseCards, 0),
      prCards: ab.reduce((s, a) => s + a.prCards, 0),
      queriesWithDelta: ab.filter((a) => a.delta !== 0).length,
    },
  };

  await writeFile(join(HERE, "findings.json"), JSON.stringify({ summary, findings }, null, 1), "utf8");
  await writeFile(join(HERE, "ab-merge.json"), JSON.stringify(ab, null, 1), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main();
