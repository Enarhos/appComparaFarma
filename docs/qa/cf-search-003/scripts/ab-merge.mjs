/**
 * CF-SEARCH-003 — A/B de `mergeDuplicates()` sobre datos reales.
 *
 * Uso:
 *   QA_BASE_DIST=<ruta a dist de origin/main> \
 *   QA_PR_DIST=<ruta a dist de la branch>     \
 *   node docs/qa/cf-search-003/scripts/ab-merge.mjs
 *
 * Metodo (el mismo de CF-QA-001 y del fix de cantidad): se cargan las tarjetas
 * REALES capturadas en ../raw/, se "explotan" a una MedicationResult por oferta
 * —que es la forma en que `mergeDuplicates` las recibe en el pipeline: cada
 * adaptador de farmacia produce una, con `canonicalName = productName`— y se
 * corre el merge con las DOS compilaciones del dominio sobre exactamente la
 * misma entrada.
 *
 * `presentationKey` se conserva tal como vino de produccion: este fix no rota
 * la clave, asi que la agrupacion es identica en base y branch y toda
 * diferencia observada proviene de la validacion de compatibilidad.
 *
 * Salidas: ../analysis/ab-merge.json, ../analysis/concentration-audit.json
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

async function loadCards() {
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const cards = [];
  for (const file of files) {
    const env = JSON.parse(await readFile(join(RAW_DIR, file), "utf8"));
    if (!Array.isArray(env.results)) continue;
    env.results.forEach((card, i) => cards.push({ cardId: `${env.query}#${i}`, query: env.query, ...card }));
  }
  return cards;
}

/**
 * Una MedicationResult por oferta, como las produce `toMedicationResult()`:
 * `canonicalName` es el nombre de ESA oferta, no el de la tarjeta ya fusionada.
 * Sin esto, `pickCanonicalSlot()` recibiria N nombres identicos y su desempate
 * por longitud quedaria degenerado.
 */
function explode(cards) {
  const out = [];
  for (const card of cards) {
    for (const p of card.prices) {
      out.push({
        ...card,
        canonicalName: p.productName,
        prices: [p],
        bestPrice: p.channels.effective,
        bestPharmacy: p.pharmacySlug,
      });
    }
  }
  return out;
}

const cardSignature = (card) =>
  `${card.presentationKey}::${card.prices.map((p) => `${p.pharmacySlug}@${p.channels.effective}`).sort().join(",")}`;

const concKey = (name) => {
  const c = PR.liquidConcentration(name);
  return c === null ? null : PR.concentrationKey(c);
};

/** Grupos de una tarjeta con dos concentraciones explicitas incompatibles. */
function incompatibleGroups(cards) {
  const bad = [];
  for (const card of cards) {
    const offers = card.prices.map((p) => ({
      pharmacy: p.pharmacySlug,
      name: p.productName,
      concentration: concKey(p.productName),
      price: p.channels.effective,
    }));
    const parsed = card.prices.map((p) => PR.liquidConcentration(p.productName));
    let contradiction = false;
    for (let i = 0; i < parsed.length && !contradiction; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        if (!PR.isCompatibleConcentration(parsed[i], parsed[j])) { contradiction = true; break; }
      }
    }
    if (contradiction) bad.push({ presentationKey: card.presentationKey, offers });
  }
  return bad;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const cards = await loadCards();

  const byQuery = new Map();
  for (const c of cards) {
    if (!byQuery.has(c.query)) byQuery.set(c.query, []);
    byQuery.get(c.query).push(c);
  }

  const ab = [];
  let baseCardsTotal = 0;
  let prCardsTotal = 0;
  let offersTotal = 0;
  const baseIncompatibleAll = [];
  const prIncompatibleAll = [];
  const separated = [];
  const introduced = [];

  for (const [query, qcards] of byQuery) {
    const input = explode(qcards);
    offersTotal += input.length;
    const baseOut = BASE.mergeDuplicates(input.map((c) => ({ ...c })));
    const prOut = PR.mergeDuplicates(input.map((c) => ({ ...c })));
    baseCardsTotal += baseOut.length;
    prCardsTotal += prOut.length;

    const baseSig = new Set(baseOut.map(cardSignature));
    const prSig = new Set(prOut.map(cardSignature));
    const onlyBase = baseOut.filter((c) => !prSig.has(cardSignature(c)));
    const onlyPr = prOut.filter((c) => !baseSig.has(cardSignature(c)));

    const baseBad = incompatibleGroups(baseOut);
    const prBad = incompatibleGroups(prOut);
    baseIncompatibleAll.push(...baseBad.map((g) => ({ query, ...g })));
    prIncompatibleAll.push(...prBad.map((g) => ({ query, ...g })));

    // Una tarjeta de base que se partio: desaparece en la branch y sus ofertas
    // reaparecen repartidas. Se reporta cuando la de base tenia contradiccion.
    for (const g of baseBad) separated.push({ query, ...g });

    // Falso split candidato: tarjeta de base SIN contradiccion de concentracion
    // que la branch partio igual.
    const baseBadKeys = new Set(baseBad.map((g) => g.presentationKey));
    for (const c of onlyBase) {
      if (baseBadKeys.has(c.presentationKey)) continue;
      const stillTogether = prOut.some(
        (p) => p.presentationKey === c.presentationKey && p.prices.length === c.prices.length
      );
      if (!stillTogether && c.prices.length > 1) {
        introduced.push({
          query,
          presentationKey: c.presentationKey,
          offers: c.prices.map((p) => ({
            pharmacy: p.pharmacySlug,
            name: p.productName,
            concentration: concKey(p.productName),
            price: p.channels.effective,
          })),
        });
      }
    }

    ab.push({
      query,
      inputOffers: input.length,
      baseCards: baseOut.length,
      prCards: prOut.length,
      delta: prOut.length - baseOut.length,
      onlyInBase: onlyBase.map((c) => ({
        presentationKey: c.presentationKey,
        offers: c.prices.map((p) => `${p.pharmacySlug}|${p.productName}|${p.channels.effective}|${concKey(p.productName)}`),
      })),
      onlyInPr: onlyPr.map((c) => ({
        presentationKey: c.presentationKey,
        offers: c.prices.map((p) => `${p.pharmacySlug}|${p.productName}|${p.channels.effective}|${concKey(p.productName)}`),
      })),
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    baseDist: BASE_DIST,
    prDist: PR_DIST,
    queries: byQuery.size,
    inputOffers: offersTotal,
    baseCards: baseCardsTotal,
    prCards: prCardsTotal,
    delta: prCardsTotal - baseCardsTotal,
    queriesWithDelta: ab.filter((a) => a.delta !== 0).length,
    incompatibleConcentrationsMergedBase: baseIncompatibleAll.length,
    incompatibleConcentrationsMergedPr: prIncompatibleAll.length,
    falseMergesEliminated: separated.length,
    falseSplitCandidates: introduced.length,
  };

  await writeFile(join(OUT_DIR, "ab-merge.json"), JSON.stringify({ summary, ab }, null, 1), "utf8");
  await writeFile(
    join(OUT_DIR, "concentration-audit.json"),
    JSON.stringify(
      { summary, incompatibleInBase: baseIncompatibleAll, incompatibleInPr: prIncompatibleAll, falseSplitCandidates: introduced },
      null,
      1
    ),
    "utf8"
  );
  console.log(JSON.stringify(summary, null, 2));
  if (separated.length) {
    console.log("\n== falsos merges eliminados ==");
    for (const g of separated) {
      console.log(`\n  [${g.query}] ${g.presentationKey}`);
      for (const o of g.offers) console.log(`    ${o.pharmacy.padEnd(13)} ${String(o.concentration).padEnd(14)} $${o.price}  ${o.name}`);
    }
  }
  if (introduced.length) {
    console.log("\n== candidatos a falso split ==");
    for (const g of introduced) {
      console.log(`\n  [${g.query}] ${g.presentationKey}`);
      for (const o of g.offers) console.log(`    ${o.pharmacy.padEnd(13)} ${String(o.concentration).padEnd(14)} $${o.price}  ${o.name}`);
    }
  }
}

main();
