/**
 * CF-DATA-007 — CLASIFICACIÓN DEL RESIDUAL DE GATE A EN 10 CATEGORÍAS (Paso 1).
 *
 * Toma `analysis/census-full.json` (producido por `census.mjs`) y asigna a CADA
 * observación SIN identidad canónica asignada EXACTAMENTE UNA categoría de causa
 * raíz, de modo que el residual quede clasificado al 100 % y sea auditable.
 *
 *   node docs/qa/cf-data-007/scripts/classify.mjs
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HAY UNA PRECEDENCIA, Y POR QUÉ ES ÉSTA
 * ---------------------------------------------------------------------------
 * Una observación puede estar bloqueada por VARIOS ejes a la vez (no leer la
 * molécula Y no leer la concentración). Para que las categorías sumen 100 % sin
 * doble conteo, cada observación cae en la PRIMERA categoría que le aplica según
 * el orden de abajo. El orden va de la causa más EXTERNA (el dato nunca llegó
 * bien) a la más INTERNA (el motor no supo leer un eje):
 *
 *   I  fuera del universo de medicamentos humanos     → ningún arreglo aplica
 *   H  el nombre llegó truncado desde la fuente        → defecto de captura
 *   G  ambigua contra el registro                      → hay candidatos, no se pudo decidir
 *   B  molécula EN vocabulario que el parser no leyó   → arreglo de PARSER
 *   A  molécula escrita FUERA de vocabulario           → arreglo de VOCABULARIO
 *   C  el nombre no escribe ninguna molécula           → requiere DATO EXTERNO (marca→molécula)
 *   J  asociación incompleta (declara N, nombra M<N)   → requiere DATO EXTERNO
 *   F  forma farmacéutica ilegible                     → eje `form`
 *   E  concentración masa-sola en forma no discreta    → eje `conc` (defecto conocido S1)
 *   D  concentración ausente                           → eje `conc`
 *
 * La precedencia NO oculta co-bloqueos: se publica además la matriz de ejes
 * bloqueados por categoría, para que se vea qué queda pendiente aunque la causa
 * de cabecera se arregle.
 *
 * NO MODIFICA CÓDIGO NI VOCABULARIOS. Solo mide y clasifica.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const OUT_DIR = resolve(HERE, "..", "analysis");
const DOC_DIR = resolve(HERE, "..");

const DOMAIN_DIST = process.env.QA_DOMAIN_DIST ?? resolve(ROOT, "packages/domain/dist/index.js");
const DOMAIN_V2_DIST =
  process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js");
const MATCHING_DIST = resolve(ROOT, "packages/domain/dist/matching.js");

const { COMPOSITION_VOCABULARY } = await import(pathToFileURL(DOMAIN_DIST).href);
const { V2_MOLECULE_VOCABULARY, ION_AND_SALT_TOKENS } = await import(
  pathToFileURL(DOMAIN_V2_DIST).href
);
const { STOP_WORDS, PRESENTATION_FORM_WORDS } = await import(pathToFileURL(MATCHING_DIST).href);

const MOLECULE_VOCABULARY = new Set([...COMPOSITION_VOCABULARY, ...V2_MOLECULE_VOCABULARY]);

/**
 * Formas donde una masa absoluta ES la concentración completa, y formas sin
 * unidad farmacéutica discreta. Copiadas de `canonicalIdentityAssigner.ts`
 * (constantes privadas de ese módulo) para poder reproducir aquí la MISMA
 * semántica de acuñación sin ampliar su superficie pública.
 */
const FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION = new Set([
  "comprimido", "capsula", "supositorio", "ovulo", "parche",
]);
const FORMS_WITHOUT_PHARMACEUTICAL_UNIT = new Set([
  "liquido-oral", "crema", "gel", "pomada", "locion", "shampoo",
  "inhalador", "colirio", "gotas-oticas",
]);

/**
 * Marcadores de que la oferta NO es un medicamento de uso humano y por lo tanto
 * no pertenece al universo que Gate A mide. Literales observados en el corpus,
 * no una heurística: se listan para que el descarte sea auditable.
 */
const NON_HUMAN_MARKERS = [
  "uso veterinario", "veterinario", "veterinaria",
];

/** Marcas tipográficas de nombre CORTADO por la fuente ("… x 30..."). */
function isTruncatedName(name) {
  return /\.\.\.\s*$/.test(name.trim()) || /…\s*$/.test(name.trim());
}

function isMoleculeShaped(word) {
  return (
    word.length >= 4 &&
    /^[a-z]+$/.test(word) &&
    !STOP_WORDS.has(word) &&
    !PRESENTATION_FORM_WORDS.has(word) &&
    !ION_AND_SALT_TOKENS.has(word)
  );
}

/**
 * ¿Esta observación podría ACUÑAR si el eje `ing` pasara a conocido, dejando
 * TODO lo demás igual? Es el techo teórico de un arreglo puramente de
 * ingrediente, y se calcula con la misma regla que
 * `isMintableConceptSignature()`.
 */
function mintableIfIngredientKnown(row) {
  const form = row.dosageForm;
  if (form === null) return false;
  if (row.concentrationKind === "absent") return false;
  if (row.concentrationKind === "mass-only" && !FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION.has(form)) {
    return false;
  }
  const missing = row.unknownAxes.filter((a) => a !== "conc" && a !== "ing");
  if (missing.length === 0) return true;
  if (!FORMS_WITHOUT_PHARMACEUTICAL_UNIT.has(form)) return false;
  return missing.length === 1 && missing[0] === "unit";
}

export const CATEGORIES = {
  A: "MISSING_ACTIVE_INGREDIENT_VOCABULARY",
  B: "ACTIVE_INGREDIENT_PRESENT_BUT_PARSER_MISSED",
  C: "BRAND_ONLY_NAME_NO_MOLECULE_IN_TEXT",
  D: "CONCENTRATION_ABSENT",
  E: "CONCENTRATION_MASS_ONLY_ON_NON_DISCRETE_FORM",
  F: "DOSAGE_FORM_UNREADABLE",
  G: "AMBIGUOUS_AGAINST_REGISTRY",
  H: "TRUNCATED_SOURCE_NAME",
  I: "NON_HUMAN_OR_NON_MEDICATION",
  J: "ASSOCIATION_DECLARED_BUT_INCOMPLETE",
};

/**
 * Categoría de causa raíz de UNA observación no asignada, con la precedencia
 * documentada arriba. Devuelve `{ code, why }`.
 */
export function classify(row) {
  const lower = row.rawName.toLowerCase();
  const ingredientAxisUnknown = row.unknownAxes.includes("ing");

  if (NON_HUMAN_MARKERS.some((m) => lower.includes(m))) {
    return { code: "I", why: "el nombre declara uso veterinario" };
  }
  if (isTruncatedName(row.rawName)) {
    return { code: "H", why: "la fuente entregó el nombre cortado" };
  }
  if (row.conceptOutcome === "ambiguous") {
    return { code: "G", why: "más de un concepto candidato en el registro, sin desempate" };
  }

  if (ingredientAxisUnknown) {
    // ¿Hay en el nombre una palabra que YA está en un vocabulario de moléculas y
    // aun así no se leyó como componente? Eso sería un defecto de PARSER.
    const knownButUnread = row.words.filter(
      (w) =>
        MOLECULE_VOCABULARY.has(w) &&
        !ION_AND_SALT_TOKENS.has(w) &&
        !row.ingredients.includes(w) &&
        !row.negatedComponents.includes(w)
    );
    if (knownButUnread.length > 0) {
      return { code: "B", why: `vocabulario contiene ${knownButUnread.join("+")} y no se leyó` };
    }
    // ¿Escribe el nombre alguna palabra con FORMA de molécula que no sea la
    // cabecera comercial? Si sí, es un hueco de VOCABULARIO; si no, el nombre
    // sencillamente no dice qué molécula es.
    const shaped = row.words.filter(
      (w) => isMoleculeShaped(w) && !MOLECULE_VOCABULARY.has(w) && w !== row.discriminator
    );
    if (shaped.length > 0) {
      return { code: "A", why: `token(s) con forma de molécula fuera de vocabulario: ${shaped.join("+")}` };
    }
    return { code: "C", why: "el nombre solo trae cabecera comercial, ninguna molécula escrita" };
  }

  if (!row.isComplete && row.isAssociation) {
    return { code: "J", why: `declara ${row.declaredComponentCount} componentes y nombra ${row.ingredients.length}` };
  }
  if (row.dosageForm === null) {
    return { code: "F", why: "no se pudo leer forma farmacéutica canónica" };
  }
  if (
    row.concentrationKind === "mass-only" &&
    !FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION.has(row.dosageForm)
  ) {
    return { code: "E", why: `masa absoluta en forma ${row.dosageForm}, no es concentración completa` };
  }
  if (row.concentrationKind === "absent") {
    return { code: "D", why: "el nombre no declara concentración" };
  }
  return { code: "D", why: "concentración insuficiente para acuñar" };
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  // Permite clasificar un censo ARBITRARIO (el de antes o el de después del
  // cambio) sin duplicar el script: `QA_CENSUS_IN` / `QA_CSV_OUT` / `QA_JSON_OUT`.
  const censusPath = process.env.QA_CENSUS_IN ?? resolve(OUT_DIR, "census-full.json");
  const csvOut = process.env.QA_CSV_OUT ?? resolve(DOC_DIR, "residual-census.csv");
  const jsonOut = process.env.QA_JSON_OUT ?? resolve(OUT_DIR, "residual-classified.json");

  const census = JSON.parse(await readFile(censusPath, "utf8"));
  const unassigned = census.filter((row) => !row.assigned);

  const rows = unassigned.map((row) => {
    const { code, why } = classify(row);
    return {
      ...row,
      category: code,
      categoryName: CATEGORIES[code],
      categoryWhy: why,
      mintableIfIngredientKnown: mintableIfIngredientKnown(row),
    };
  });

  const counts = {};
  for (const row of rows) counts[row.category] = (counts[row.category] ?? 0) + 1;

  const classified = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log(`CORPUS                ${census.length} observaciones`);
  console.log(`ASIGNADAS             ${census.length - unassigned.length}`);
  console.log(`RESIDUAL (no asign.)  ${unassigned.length}`);
  console.log(`CLASIFICADO           ${classified}/${unassigned.length} = ${((classified / unassigned.length) * 100).toFixed(2)}%`);
  console.log("");
  console.log("cat  n     %resid  %corpus  categoría");
  for (const code of Object.keys(CATEGORIES)) {
    const n = counts[code] ?? 0;
    console.log(
      `  ${code}  ${String(n).padStart(4)}  ${((n / unassigned.length) * 100).toFixed(2).padStart(6)}%  ${((n / census.length) * 100).toFixed(2).padStart(6)}%  ${CATEGORIES[code]}`
    );
  }
  console.log("");
  console.log(`TECHO DE UN ARREGLO SOLO DE INGREDIENTE: ${rows.filter((r) => r.mintableIfIngredientKnown).length} observaciones`);
  console.log("  (= las que acuñarían si `ing` pasara a conocido y NADA más cambiara)");
  const ceilingByCat = {};
  for (const r of rows) {
    if (!r.mintableIfIngredientKnown) continue;
    ceilingByCat[r.category] = (ceilingByCat[r.category] ?? 0) + 1;
  }
  console.log("  por categoría: " + JSON.stringify(ceilingByCat));

  const header = [
    "key", "pharmacy", "category", "categoryName", "categoryWhy", "rawName",
    "discriminator", "ingredients", "negatedComponents", "declaredComponentCount",
    "isAssociation", "isComplete", "concentrationKind", "dosageForm", "route",
    "pharmaceuticalUnit", "conceptOutcome", "unknownAxes", "mintableIfIngredientKnown",
    "queries", "url",
  ];
  const csv = [header.join(",")];
  for (const r of rows) {
    csv.push(
      [
        r.key, r.pharmacy, r.category, r.categoryName, r.categoryWhy, r.rawName,
        r.discriminator, r.ingredients.join("+"), r.negatedComponents.join("+"),
        r.declaredComponentCount, r.isAssociation, r.isComplete, r.concentrationKind,
        r.dosageForm, r.route, r.pharmaceuticalUnit, r.conceptOutcome,
        r.unknownAxes.join("+"), r.mintableIfIngredientKnown, r.queries.join("+"), r.url,
      ].map(csvCell).join(",")
    );
  }
  await writeFile(resolve(DOC_DIR, "residual-census.csv"), csv.join("\n") + "\n", "utf8");

  await writeFile(
    jsonOut,
    JSON.stringify(
      rows.map((r) => ({
        key: r.key, pharmacy: r.pharmacy, rawName: r.rawName,
        category: r.category, categoryName: r.categoryName, categoryWhy: r.categoryWhy,
        discriminator: r.discriminator, ingredients: r.ingredients,
        unknownAxes: r.unknownAxes, concentrationKind: r.concentrationKind,
        dosageForm: r.dosageForm, conceptOutcome: r.conceptOutcome,
        mintableIfIngredientKnown: r.mintableIfIngredientKnown,
      })),
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log("escrito: docs/qa/cf-data-007/residual-census.csv");
  console.log("escrito: docs/qa/cf-data-007/analysis/residual-classified.json");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
