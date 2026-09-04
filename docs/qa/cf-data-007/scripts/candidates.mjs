/**
 * CF-DATA-007 — GENERACIÓN DE CANDIDATOS A PRINCIPIO ACTIVO (Pasos 2 y 3).
 *
 * REUTILIZA LA REGLA DE DERIVACIÓN DE CF-DATA-001 SIN AFLOJARLA, aplicada al
 * corpus congelado de S1 (`docs/qa/cf-search-012/raw/`). Un token es candidato
 * si, en el catálogo real:
 *
 *   (1) aparece en el SEGMENTO DESCRIPTIVO del nombre (antes de la primera
 *       dosis/cantidad) y NO es la cabecera de marca;
 *   (2) ANTECEDE INMEDIATAMENTE a una magnitud de DOSIS, saltando sales y
 *       calificadores químicos;
 *   (3) acompaña a >= 2 cabeceras de marca DISTINTAS en >= 2 farmacias
 *       DISTINTAS;
 *   (4) NO aparece en el campo estructurado de FABRICANTE de ninguna farmacia.
 *
 * DIFERENCIA CON CF-DATA-001, Y POR QUÉ. Aquel corpus tenía 3.697 ofertas de 29
 * búsquedas; éste tiene 839 observaciones de 16 búsquedas, elegidas por otro
 * motivo (medir identidad, no derivar vocabulario). Con menos cabeceras por
 * molécula, el umbral (3) es MÁS difícil de alcanzar, no menos. Por eso se
 * reporta también la evidencia de los tokens que NO lo alcanzan —para que la
 * decisión de rechazarlos sea auditable— y por eso ningún token se aprueba solo
 * por frecuencia: la frecuencia es condición necesaria, nunca suficiente.
 *
 * NO MODIFICA CÓDIGO. Solo mide y clasifica.
 *
 *   node docs/qa/cf-data-007/scripts/candidates.mjs
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
const MATCHING_DIST = resolve(ROOT, "packages/domain/dist/matching.js");

const { COMPOSITION_VOCABULARY } = await import(pathToFileURL(DOMAIN_DIST).href);
const { V2_MOLECULE_VOCABULARY, ION_AND_SALT_TOKENS } = await import(
  pathToFileURL(DOMAIN_V2_DIST).href
);
const {
  normalizedWords,
  brandHeadTokens,
  SALT_QUALIFIER_WORDS,
  STOP_WORDS,
  PRESENTATION_FORM_WORDS,
} = await import(pathToFileURL(MATCHING_DIST).href);

const KNOWN = new Set([...COMPOSITION_VOCABULARY, ...V2_MOLECULE_VOCABULARY]);

// --- (1) frontera de atributo y forma de ingrediente: copiadas de CF-DATA-001
const DOSE_UNITS = new Set(["mg", "ml", "mcg", "ug", "g", "gr", "ui", "iu", "kg", "l"]);
const COUNT_NOUNS = new Set([
  "comprimido", "comprimidos", "comp", "capsula", "capsulas", "cap", "caps",
  "tableta", "tabletas", "tab", "sobre", "sobres", "sachet", "sachets",
  "ampolla", "ampollas", "amp", "parche", "parches", "gragea", "grageas",
  "unidad", "unidades", "und", "supositorio", "supositorios", "ovulo", "ovulos",
]);
const NUMBER_TOKEN = /^\d+(?:[.,]\d+)?$/;
const NUMBER_WITH_UNIT_TOKEN = /^\d+(?:[.,]\d+)?(mg|ml|mcg|ug|g|gr|ui|iu)$/;
const QUANTITY_MARKER_TOKEN = /^x\d/;

function isAttributeBoundary(tokens, index) {
  const token = tokens[index];
  const next = tokens[index + 1];
  if (NUMBER_WITH_UNIT_TOKEN.test(token)) return true;
  if (QUANTITY_MARKER_TOKEN.test(token)) return true;
  if (token === "x" && next !== undefined && /^\d/.test(next)) return true;
  if (NUMBER_TOKEN.test(token) && next !== undefined) {
    if (DOSE_UNITS.has(next)) return true;
    if (COUNT_NOUNS.has(next)) return true;
  }
  return false;
}

const INGREDIENT_MIN_LENGTH = 4;
function isIngredientShaped(w) {
  return (
    w !== undefined &&
    w.length >= INGREDIENT_MIN_LENGTH &&
    /^[a-z]+$/.test(w) &&
    !STOP_WORDS.has(w) &&
    !PRESENTATION_FORM_WORDS.has(w) &&
    !SALT_QUALIFIER_WORDS.has(w)
  );
}

const DOSE_UNIT_SET = new Set(["mg", "ml", "mcg", "ug", "g", "gr", "ui", "iu"]);
const GLUED_DOSE = /^\d+(?:[.,]\d+)?(mg|ml|mcg|ug|g|gr|ui|iu)$/;
function isDoseAt(tokens, i) {
  if (GLUED_DOSE.test(tokens[i])) return true;
  return NUMBER_TOKEN.test(tokens[i]) && DOSE_UNIT_SET.has(tokens[i + 1] ?? "");
}

// ---------------------------------------------------------------------------

function readOffers(envelope) {
  const out = [];
  const cards = Array.isArray(envelope.body) ? envelope.body : [];
  for (const card of cards) {
    for (const price of card.prices ?? []) {
      out.push({
        query: envelope.query,
        pharmacy: price.pharmacySlug,
        name: price.productName ?? "",
        url: price.onlineUrl ?? null,
        manufacturer: (card.prices ?? []).length === 1 ? card.manufacturer ?? null : null,
      });
    }
  }
  return out;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const envelopes = [];
  for (const f of files) envelopes.push(JSON.parse(await readFile(resolve(RAW_DIR, f), "utf8")));
  const all = envelopes.flatMap(readOffers).filter((o) => o.name.trim().length > 0);

  // Observaciones únicas, misma clave que el censo.
  const seen = new Map();
  for (const o of all) {
    const key = `${o.pharmacy}|${(o.url ?? o.name).trim().toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, { ...o, queries: new Set() });
    seen.get(key).queries.add(o.query);
  }
  const offers = [...seen.values()];

  // (4) tokens vistos en el campo estructurado de FABRICANTE.
  const manufacturerTokens = new Set();
  for (const o of offers) {
    if (!o.manufacturer) continue;
    for (const t of normalizedWords(String(o.manufacturer))) if (t) manufacturerTokens.add(t);
  }

  const stats = new Map();
  for (const o of offers) {
    const tokens = normalizedWords(o.name);
    const head = brandHeadTokens(tokens);
    if (head.length === 0) continue;
    const headToken = head.join("");
    const headSet = new Set(head);

    for (let i = 0; i < tokens.length; i++) {
      if (isAttributeBoundary(tokens, i) && !isDoseAt(tokens, i)) break;
      if (!isDoseAt(tokens, i)) continue;
      for (let j = i - 1; j >= 0; j--) {
        const token = tokens[j];
        if (!token) continue;
        if (SALT_QUALIFIER_WORDS.has(token)) continue;
        if (!isIngredientShaped(token)) break;
        if (headSet.has(token)) break;
        let e = stats.get(token);
        if (!e) {
          stats.set(token, (e = {
            heads: new Set(), pharmacies: new Set(), queries: new Set(),
            offers: 0, names: [], strengths: new Set(), positions: new Set(),
          }));
        }
        e.heads.add(headToken);
        e.pharmacies.add(o.pharmacy);
        for (const q of o.queries) e.queries.add(q);
        e.offers += 1;
        e.positions.add(j === 0 ? "head" : "descriptive-segment");
        const dose = GLUED_DOSE.test(tokens[i]) ? tokens[i] : `${tokens[i]}${tokens[i + 1] ?? ""}`;
        e.strengths.add(dose);
        if (e.names.length < 8) e.names.push(`${o.pharmacy}: ${o.name}`);
        break;
      }
      break; // solo la PRIMERA dosis del nombre — igual que CF-DATA-001
    }
  }

  const rows = [...stats.entries()]
    .map(([token, e]) => ({
      token,
      alreadyKnown: KNOWN.has(token),
      isSaltOrQualifier: ION_AND_SALT_TOKENS.has(token),
      inManufacturerField: manufacturerTokens.has(token),
      distinctHeads: e.heads.size,
      distinctPharmacies: e.pharmacies.size,
      offers: e.offers,
      heads: [...e.heads].sort(),
      pharmacies: [...e.pharmacies].sort(),
      queries: [...e.queries].sort(),
      strengths: [...e.strengths].sort(),
      positions: [...e.positions].sort(),
      names: e.names,
      passesCfData001Rule:
        e.heads.size >= 2 && e.pharmacies.size >= 2 && !manufacturerTokens.has(token),
    }))
    .sort((a, b) => b.distinctHeads - a.distinctHeads || b.offers - a.offers || a.token.localeCompare(b.token));

  await writeFile(resolve(OUT_DIR, "candidates.json"), JSON.stringify(rows, null, 2), "utf8");

  console.log(`ofertas (observaciones únicas) analizadas: ${offers.length}`);
  console.log(`tokens que llegan a la etapa de conteo:    ${rows.length}`);
  console.log("");
  console.log("TOKENS QUE PASAN LA REGLA DE CF-DATA-001 Y NO ESTÁN EN NINGÚN VOCABULARIO");
  console.log("token                heads farm ofertas  farmacias");
  for (const r of rows) {
    if (!r.passesCfData001Rule || r.alreadyKnown || r.isSaltOrQualifier) continue;
    console.log(
      `  ${r.token.padEnd(20)} ${String(r.distinctHeads).padStart(3)} ${String(r.distinctPharmacies).padStart(4)} ${String(r.offers).padStart(6)}   ${r.pharmacies.join(",")}`
    );
  }
  console.log("");
  console.log("TOKENS QUE NO ALCANZAN EL UMBRAL (evidencia insuficiente en este corpus)");
  console.log("token                heads farm ofertas  motivo");
  for (const r of rows) {
    if (r.passesCfData001Rule || r.alreadyKnown || r.isSaltOrQualifier) continue;
    const why = r.inManufacturerField
      ? "aparece como FABRICANTE estructurado"
      : `heads=${r.distinctHeads} pharmacies=${r.distinctPharmacies} < umbral 2/2`;
    console.log(
      `  ${r.token.padEnd(20)} ${String(r.distinctHeads).padStart(3)} ${String(r.distinctPharmacies).padStart(4)} ${String(r.offers).padStart(6)}   ${why}`
    );
  }
  console.log("");
  console.log("YA CONOCIDOS (control positivo: la regla los redescubre)");
  console.log(
    rows.filter((r) => r.alreadyKnown).map((r) => `${r.token}(${r.distinctHeads}h/${r.distinctPharmacies}f/${r.offers}o)`).join(", ")
  );
  console.log("");
  console.log("CLASIFICADOS COMO SAL/CALIFICADOR (nunca molécula propia)");
  console.log(
    rows.filter((r) => r.isSaltOrQualifier).map((r) => `${r.token}(${r.offers}o)`).join(", ")
  );
}

await main();
