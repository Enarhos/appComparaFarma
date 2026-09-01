/**
 * CF-DATA-001 — DERIVACIÓN algorítmica del vocabulario de composición
 * (principios activos y sus sales/ésteres), a partir del catálogo REAL.
 *
 * Ninguna entrada se escribe a mano. La regla es única, general y medible:
 *
 *   Un token es un TOKEN DE COMPOSICIÓN si, en el catálogo real:
 *     (1) aparece en el SEGMENTO DESCRIPTIVO del nombre (antes de la primera
 *         dosis/cantidad — `isAttributeBoundary`), y NO es la cabecera de marca
 *         del nombre (`brandHeadTokens`), y
 *     (2) es el token de composición que ANTECEDE INMEDIATAMENTE a una
 *         magnitud de DOSIS (número + unidad de masa/volumen), saltando sales y
 *         calificadores químicos, y
 *     (3) lo hace acompañando a >= MIN_DISTINCT_HEADS cabeceras de marca
 *         DISTINTAS y en >= MIN_PHARMACIES farmacias distintas, y
 *     (4) NO aparece en el campo estructurado de FABRICANTE de ninguna farmacia
 *         (Dr. Simi `brand`, AraucoMed `manufacturer_name`, Farmex `vendor`).
 *
 * POR QUÉ CADA CONDICIÓN (todas salieron de medir, no de teorizar):
 *
 *   (1) El nombre del LABORATORIO va siempre al final del título, después de la
 *       dosis y la cantidad ("… x 30 comprimidos (Ascend)", "… 100ml SEVEN
 *       PHARMA"); la molécula va delante, pegada a la marca ("Tocalm
 *       **Ambroxol** 30 mg/5 mL"). Es la misma restricción que S-1 ya aplicó en
 *       `combinationKey()` por el mismo motivo. Sin ella, la derivación producía
 *       `ascend`, `opko`, `hospifarma`, `mintlab`, `pasteur`, `curaespring`,
 *       `chile` y `cenabast` como si fueran principios activos.
 *
 *   (2) Una molécula SE DOSIFICA; un descriptor de marketing, sabor, textura o
 *       zona del cuerpo no. Sin esta condición la derivación incluía `night`,
 *       `senior`, `ultra`, `sabor`, `limon`, `limonada`, `serum`, `facial`,
 *       `corporal`, `dermo`, `piel`, `mujer`, `gummies`, `ninos`, `garnier` y
 *       `circalife` — ninguno es composición, y usarlos como corroboración
 *       habría promovido a "marca" cabeceras que no lo son.
 *
 *   (3) Una marca es propietaria: aparece solo con SU titular y casi siempre
 *       como cabecera. Una molécula es común, y distintos titulares la escriben
 *       detrás de su propia marca. El número de cabeceras distintas que la
 *       acompañan es evidencia directa de que nombra la molécula y no la marca.
 *
 *   (4) Red de seguridad con datos duros: si alguna farmacia declara ese token
 *       en su campo estructurado de fabricante, es un fabricante.
 *
 * Salidas:
 *   docs/qa/cf-data-001/active-ingredient-vocabulary.csv   (evidencia por token)
 *   scripts-audit/out/vocabulary-literal.txt               (bloque para el módulo)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  normalizedWords,
  brandHeadTokens,
  SALT_QUALIFIER_WORDS,
} from "../../../../packages/domain/dist/matching.js";
import { isIngredientShaped, isAttributeBoundary } from "./lib-brand.mjs";

const MIN_DISTINCT_HEADS = 2;
const MIN_PHARMACIES = 2;

/** Número + unidad de masa/volumen, junto o separado. */
const DOSE_UNIT = new Set(["mg", "ml", "mcg", "ug", "g", "gr", "ui", "iu"]);
const GLUED_DOSE = /^\d+(?:[.,]\d+)?(mg|ml|mcg|ug|g|gr|ui|iu)$/;
const BARE_NUMBER = /^\d+(?:[.,]\d+)?$/;

function isDoseAt(tokens, i) {
  if (GLUED_DOSE.test(tokens[i])) return true;
  return BARE_NUMBER.test(tokens[i]) && DOSE_UNIT.has(tokens[i + 1] ?? "");
}

const sources = JSON.parse(readFileSync(new URL("./out/sources.json", import.meta.url)));

/** (4) tokens vistos en campos estructurados de FABRICANTE */
const manufacturerTokens = new Set();
for (const rows of Object.values(sources)) {
  for (const r of rows) {
    if (!r.raw) continue;
    if (!/manufacturer_name|product\.brand|product\.vendor/.test(r.field)) continue;
    for (const t of normalizedWords(String(r.raw))) if (t) manufacturerTokens.add(t);
  }
}

function loadNames() {
  const names = [];
  for (const [slug, rows] of Object.entries(sources)) for (const r of rows) names.push({ slug, name: r.name });
  for (const file of ["production.json", "production-wide.json"]) {
    const data = JSON.parse(readFileSync(new URL(`./out/${file}`, import.meta.url)));
    for (const rows of Object.values(data)) {
      for (const c of rows) for (const p of c.prices) names.push({ slug: p.pharmacySlug, name: p.productName });
    }
  }
  return names;
}

const names = loadNames();
const stats = new Map();

for (const { slug, name } of names) {
  const tokens = normalizedWords(name);
  const head = brandHeadTokens(tokens);
  if (head.length === 0) continue;
  const headToken = head.join("");
  const headSet = new Set(head);

  // Recorre el segmento descriptivo; en cada DOSIS, retrocede hasta el último
  // token de composición (saltando sales/calificadores químicos).
  for (let i = 0; i < tokens.length; i++) {
    if (isAttributeBoundary(tokens, i) && !isDoseAt(tokens, i)) break;
    if (!isDoseAt(tokens, i)) continue;

    for (let j = i - 1; j >= 0; j--) {
      const token = tokens[j];
      if (!token) continue;
      if (SALT_QUALIFIER_WORDS.has(token)) continue;
      if (!isIngredientShaped(token)) break;
      if (headSet.has(token)) break;
      let entry = stats.get(token);
      if (!entry) stats.set(token, (entry = { heads: new Set(), pharmacies: new Set(), offers: 0 }));
      entry.heads.add(headToken);
      entry.pharmacies.add(slug);
      entry.offers++;
      break;
    }
    break; // solo la PRIMERA dosis del nombre
  }
}

/**
 * (5) ÚNICA intervención manual de toda la derivación: 4 tokens que pasan las
 * 4 condiciones automáticas pero NO son composición. Se listan acá —y no en el
 * módulo— para que quede explícito que son una excepción documentada y no parte
 * de la regla. Cada uno con su motivo, verificable en el CSV de evidencia:
 *
 *   ninos    — calificador comercial de variante; el propio dominio ya lo
 *              modela como tal (`VARIANT_ALIASES: ninos -> infantil`,
 *              productIdentity.ts). Se cuela porque "Tapsin Niños 160 mg"
 *              antepone la variante a la dosis igual que una molécula.
 *   retard   — calificador de liberación prolongada ("Diclofenaco Retard 100
 *              mg"), no un principio activo.
 *   dermica  — vía de administración ("… Crema Dérmica 30 g").
 *   piel     — zona anatómica ("… para piel grasa 50 mL").
 *
 * Ninguno es un nombre de producto ni de marca: son descriptores genéricos, la
 * misma categoría que `EXTRA_VARIANT_NOISE`/`URL_GENERIC_TOKENS` ya existentes.
 */
const NON_COMPOSITION_DESCRIPTORS = new Set(["ninos", "retard", "dermica", "piel"]);

const rejected = [];
const excluded = [];
const vocabulary = [];
for (const [token, e] of stats) {
  if (e.heads.size < MIN_DISTINCT_HEADS || e.pharmacies.size < MIN_PHARMACIES) continue;
  if (manufacturerTokens.has(token)) { rejected.push(token); continue; }
  if (NON_COMPOSITION_DESCRIPTORS.has(token)) { excluded.push(token); continue; }
  vocabulary.push([token, e]);
}
vocabulary.sort((a, b) => b[1].heads.size - a[1].heads.size || a[0].localeCompare(b[0]));

console.log(`ofertas analizadas: ${names.length}`);
console.log(`tokens candidatos: ${stats.size}`);
console.log(`rechazados por (4) fabricante estructurado: ${rejected.length} -> ${rejected.join(", ")}`);
console.log(`VOCABULARIO derivado: ${vocabulary.length}\n`);
console.log(vocabulary.map(([t, e]) => `${t}(${e.heads.size}h/${e.pharmacies.size}f/${e.offers}o)`).join(", "));

mkdirSync(new URL("../", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../active-ingredient-vocabulary.csv", import.meta.url),
  ["token,distinct_heads,distinct_pharmacies,offers,sample_heads",
    ...vocabulary.map(([t, e]) => `${t},${e.heads.size},${e.pharmacies.size},${e.offers},"${[...e.heads].slice(0, 6).join(" ")}"`),
  ].join("\n") + "\n"
);
writeFileSync(new URL("./out/vocabulary.json", import.meta.url), JSON.stringify(vocabulary.map(([t]) => t), null, 2));

const words = vocabulary.map(([t]) => `"${t}",`);
const lines = [];
let cur = "";
for (const w of words) {
  if (cur.length + w.length + 3 > 74) { lines.push("  " + cur.trim()); cur = ""; }
  cur += w + " ";
}
if (cur.trim()) lines.push("  " + cur.trim());
writeFileSync(new URL("./out/vocabulary-literal.txt", import.meta.url), lines.join("\n") + "\n");
