/**
 * CF-DATA-001 — prototipo de extracción de marca/principio activo desde el
 * NOMBRE. Reutiliza el vocabulario YA compilado de @comparafarma/domain.
 */
import {
  STOP_WORDS,
  PRESENTATION_FORM_WORDS,
  SALT_QUALIFIER_WORDS,
  normalizedWords,
  brandHeadTokens,
  combinationKey,
} from "../../../../packages/domain/dist/matching.js";

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

export function isAttributeBoundary(tokens, index) {
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
export function isIngredientShaped(w) {
  return (
    w !== undefined &&
    w.length >= INGREDIENT_MIN_LENGTH &&
    /^[a-z]+$/.test(w) &&
    !STOP_WORDS.has(w) &&
    !PRESENTATION_FORM_WORDS.has(w) &&
    !SALT_QUALIFIER_WORDS.has(w)
  );
}

export function nameDerivedBrand(name, options = {}) {
  const { vocab = null, requireVocabAi = false } = options;
  const inVocab = (t) => (vocab ? vocab.has(t) : false);
  if (combinationKey(name) !== null) return { brand: null, activeIngredient: null };
  const tokens = normalizedWords(name);
  const head = brandHeadTokens(tokens);
  if (head.length === 0) return { brand: null, activeIngredient: null };
  const headToken = head.join("");
  // Guardia 1: la cabecera ES una molécula conocida ⇒ genérico, no hay marca.
  if (vocab && inVocab(headToken)) return { brand: null, activeIngredient: headToken };

  let headIndex = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (isAttributeBoundary(tokens, i)) break;
    if (headIndex < head.length && token === head[headIndex]) {
      headIndex++;
      continue;
    }
    if (headIndex < head.length) continue;
    if (!isIngredientShaped(token)) continue;
    // Guardia 2: el token corroborante debe ser una molécula conocida.
    if (requireVocabAi && !inVocab(token)) continue;
    return { brand: headToken, activeIngredient: token };
  }
  return { brand: null, activeIngredient: null };
}

export function loadCorpus() {
  return import("node:fs").then(({ readFileSync }) => {
    const sources = JSON.parse(readFileSync(new URL("./out/sources.json", import.meta.url)));
    const production = JSON.parse(readFileSync(new URL("./out/production.json", import.meta.url)));
    const names = [];
    for (const [slug, rows] of Object.entries(sources)) {
      for (const r of rows) names.push({ slug, name: r.name, structured: r.raw, origin: "upstream" });
    }
    for (const rows of Object.values(production)) {
      for (const c of rows) {
        for (const p of c.prices) names.push({ slug: p.pharmacySlug, name: p.productName, structured: null, origin: "production" });
      }
    }
    return { sources, production, names };
  });
}
