/**
 * CF-SEARCH-002 — Query Intent: intención estructurada de la consulta.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * `cleanQuery()` (normalization.ts) descarta a propósito todos los atributos
 * numéricos de la consulta —concentración, unidad, cantidad, forma
 * farmacéutica— porque su trabajo es RECUPERACIÓN: producir el término más
 * amplio posible para los 9 buscadores de farmacia, cada uno con su propio
 * motor y su propia tolerancia. Enviarles "ibuprofeno 600 mg x 20
 * comprimidos" devuelve menos resultados que enviarles "ibuprofeno".
 *
 * El defecto (QA-05, verificado en producción 2026-08-27 y otra vez el
 * 2026-08-28) es que esa información se descarta y NUNCA se vuelve a usar:
 *   GET /api/search?q=ibuprofeno 200 mg  → 110 resultados, x-search-cache: miss
 *   GET /api/search?q=ibuprofeno 400 mg  → 110 resultados, x-search-cache: HIT
 *   GET /api/search?q=ibuprofeno 600 mg  → 110 resultados, x-search-cache: HIT
 * Las tres consultas colapsan a la MISMA entrada de caché y a la misma
 * respuesta, ordenada solo por precio.
 *
 * SEPARACIÓN DE CONCEPTOS (explícita, no negociable)
 * --------------------------------------------------
 *   rawQuery       — lo que escribió el usuario, sin tocar.
 *   retrievalQuery — consulta AMPLIA que se manda a las 9 farmacias. Es
 *                    exactamente `cleanQuery(rawQuery)`: este módulo NO
 *                    cambia una coma del comportamiento de recuperación.
 *   queryIntent    — intención estructurada, usada DESPUÉS del retrieval para
 *                    evaluar y ordenar lo que volvió. Nunca para filtrar lo
 *                    que se le pide a las farmacias.
 *
 * `cleanQuery` sigue siendo la función de recuperación y NO se convierte en un
 * parser farmacológico: el parsing vive acá, sobre `rawQuery`, en paralelo.
 */

import { QUANTITY_PATTERN, normalizedWords } from "./matching.js";
import { dosageFormClass, type DosageFormClass } from "./productIdentity.js";
import { cleanQuery } from "./normalization.js";

// ---------------------------------------------------------------------------
// A. MAGNITUDES Y CONCENTRACIÓN
// ---------------------------------------------------------------------------

/**
 * Una magnitud escrita en el nombre o en la consulta: valor + unidad ya
 * normalizada (minúscula, sin variantes tipográficas).
 *
 * `unit` es un `string` y no una unión cerrada a propósito: el modelo debe
 * poder representar unidades que hoy no se comparan (`%`, `ui`, dosis por
 * inhalación) sin cambiar el tipo ni las firmas públicas. Lo que está acotado
 * —y es lo único que hay que ampliar para soportar una unidad nueva— es la
 * tabla de conversión `UNIT_DIMENSIONS`.
 */
export interface Measurement {
  value: number;
  unit: string;
}

/**
 * Concentración como RAZÓN estructurada, nunca como cadena compuesta.
 *
 * Decisión explícita del ticket: "250 mg / 5 ml" se representa con
 * `numerator = {250, "mg"}` y `denominator = {5, "ml"}` — NO se colapsa a una
 * unidad inventada tipo `"mg/5ml"`, que sería imposible de comparar contra
 * "50 mg/ml" (la misma concentración escrita de otra forma) y bloquearía
 * cualquier extensión futura.
 *
 * `denominator === null` significa "dosis absoluta por unidad de
 * presentación" ("600 mg" en un comprimido), que es un concepto DISTINTO de
 * una razón: una dosis absoluta nunca se considera igual a una concentración
 * por volumen, por más que los números coincidan.
 *
 * NORMALIZACIÓN DOCUMENTADA — denominador implícito: "20 mg/ml" se normaliza a
 * `denominator = {value: 1, unit: "ml"}`. Escribir la unidad sin cantidad
 * significa "por UNA unidad" en todos los catálogos observados, y normalizarlo
 * a 1 permite compararlo con "100 mg/5 ml" por razón (20 mg/ml en ambos casos)
 * en vez de tratarlos como incomparables.
 */
export interface Concentration {
  numerator: Measurement;
  denominator: Measurement | null;
}

/**
 * Familias de unidades convertibles entre sí, con su factor a la unidad base
 * de la familia. Dos magnitudes solo se comparan numéricamente si pertenecen a
 * la MISMA familia; si una unidad no está acá (`"ui"`, `"%"`, o cualquiera que
 * se agregue mañana), la comparación exige igualdad literal de unidad — nunca
 * se inventa una conversión.
 *
 * Ampliar el soporte a una unidad nueva es agregar una entrada acá; el tipo
 * `Measurement` y la firma de `parseConcentration` no cambian.
 */
const UNIT_DIMENSIONS: Record<string, { dimension: string; factor: number }> = {
  mcg: { dimension: "mass", factor: 0.001 },
  mg: { dimension: "mass", factor: 1 },
  g: { dimension: "mass", factor: 1000 },
  ml: { dimension: "volume", factor: 1 },
  l: { dimension: "volume", factor: 1000 },
};

/**
 * Grafías reales de cada unidad en los catálogos de las 9 farmacias, mapeadas
 * a su forma canónica. `cc` es la grafía de mililitro que usan las fichas de
 * inyectables; `gr` la de gramo que usan AraucoMed y EasyFarma.
 */
const UNIT_ALIASES: Record<string, string> = {
  mg: "mg",
  mgs: "mg",
  mcg: "mcg",
  ug: "mcg",
  "µg": "mcg",
  g: "g",
  gr: "g",
  grs: "g",
  ml: "ml",
  mls: "ml",
  cc: "ml",
  l: "l",
  lt: "l",
  ui: "ui",
  iu: "ui",
  "%": "%",
};

/** Grafías aceptadas, ordenadas por longitud descendente para que la alternancia del regex no corte "mcg" en "mg". */
const UNIT_ALTERNATION = Object.keys(UNIT_ALIASES)
  .filter((u) => u !== "%")
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Una magnitud, opcionalmente seguida de `/` y su denominador.
 *
 * `(?![a-zà-ü])` en vez de `\b` para que "500 gramos" o "20 mgs" no
 * se lean como "500 g" / "20 mg" truncados: la unidad tiene que terminar ahí,
 * no ser el prefijo de otra palabra. (`mgs` y `grs` sí están en `UNIT_ALIASES`
 * como grafías completas.)
 *
 * El denominador acepta la cantidad ausente ("20 mg/ml"), que se normaliza a 1
 * — ver `Concentration`.
 */
const MEASUREMENT_RE = new RegExp(
  `(\\d+(?:[.,]\\d+)?)\\s*(?:(${UNIT_ALTERNATION})(?![a-z\\u00e0-\\u00fc])|(%))` +
    `(?:\\s*\\/\\s*(\\d+(?:[.,]\\d+)?)?\\s*(?:(${UNIT_ALTERNATION})(?![a-z\\u00e0-\\u00fc])|(%)))?`,
  "gi"
);

function stripAccentsLower(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function toNumber(raw: string): number {
  return parseFloat(raw.replace(",", "."));
}

function canonicalUnit(raw: string | undefined): string | null {
  if (!raw) return null;
  return UNIT_ALIASES[raw.toLowerCase()] ?? null;
}

function dimensionOf(unit: string): string {
  return UNIT_DIMENSIONS[unit]?.dimension ?? `literal:${unit}`;
}

function baseValue(m: Measurement): number {
  const spec = UNIT_DIMENSIONS[m.unit];
  return spec ? m.value * spec.factor : m.value;
}

/**
 * Dos magnitudes describen la misma cantidad física. Dentro de una familia
 * conocida se convierte a la unidad base ("0,5 g" === "500 mg"); fuera de
 * ella, se exige la misma unidad literal.
 */
export function isSameMeasurement(a: Measurement, b: Measurement): boolean {
  if (dimensionOf(a.unit) !== dimensionOf(b.unit)) return false;
  return closeEnough(baseValue(a), baseValue(b));
}

/**
 * Comparación con tolerancia relativa. Los catálogos escriben la misma dosis
 * con distinta precisión decimal ("12.5" vs "12,50"), y la conversión de
 * gramos a miligramos introduce error de punto flotante.
 */
function closeEnough(a: number, b: number): boolean {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / scale < 1e-9;
}

/**
 * Dos concentraciones son la misma.
 *
 *   - Dosis absoluta vs dosis absoluta ("600 mg" / "0,6 g"): se comparan las
 *     magnitudes.
 *   - Razón vs razón ("250 mg/5 ml" / "50 mg/ml"): se comparan las RAZONES,
 *     no los literales — es la misma concentración envasada distinto, y el
 *     tamaño del envase es una señal de cantidad, no de concentración. Exige
 *     que numerador y denominador pertenezcan a la misma familia de unidades
 *     en ambas.
 *   - Dosis absoluta vs razón: nunca son iguales, aunque los números
 *     coincidan. "600 mg" (comprimido) y "600 mg/ml" (jarabe) son productos
 *     distintos.
 */
export function isSameConcentration(a: Concentration, b: Concentration): boolean {
  if ((a.denominator === null) !== (b.denominator === null)) return false;
  if (a.denominator === null || b.denominator === null) {
    return isSameMeasurement(a.numerator, b.numerator);
  }
  if (dimensionOf(a.numerator.unit) !== dimensionOf(b.numerator.unit)) return false;
  if (dimensionOf(a.denominator.unit) !== dimensionOf(b.denominator.unit)) return false;
  const ratioA = baseValue(a.numerator) / baseValue(a.denominator);
  const ratioB = baseValue(b.numerator) / baseValue(b.denominator);
  return Number.isFinite(ratioA) && Number.isFinite(ratioB) && closeEnough(ratioA, ratioB);
}

/**
 * `true` si la razón es masa/masa entre dos unidades de dosis — la firma
 * tipográfica de una COMBINACIÓN de principios activos ("50 mg / 12,5 mg",
 * "800/160 mg"), no de una concentración.
 *
 * Es deliberadamente la MISMA regla que `DOSE_RATIO_RE` en matching.ts, que
 * S-1 (SEARCH-MATCHING-QA-01) usa para detectar combinaciones: si acá se
 * leyera "Losartán + Hidroclorotiazida 50 mg / 12,5 mg" como "una
 * concentración de 4 mg/mg", la consulta "losartán 50 mg" dejaría de
 * reconocer su propia dosis y la protección `combo:` quedaría contradicha por
 * una segunda lectura del mismo texto.
 *
 * Consecuencia aceptada y acotada: una concentración masa/masa legítima
 * ("0,05 g/100 g" en cremas) se lee hoy como dosis absoluta del numerador. El
 * MODELO no lo impide —`Concentration` admite cualquier par de unidades—; es
 * este heurístico de parsing el que prefiere la lectura de combinación, y
 * cambiarlo es cambiar esta única función.
 */
function looksLikeCombinationRatio(numerator: Measurement, denominator: Measurement): boolean {
  return dimensionOf(numerator.unit) === "mass" && dimensionOf(denominator.unit) === "mass";
}

/**
 * Primera concentración declarada en un texto libre (consulta o nombre de
 * producto), o `null` si no declara ninguna.
 *
 * Se toma la PRIMERA, misma convención que `matchKey()` con `mgHits[0]`: en
 * los nombres reales la concentración va delante y lo que sigue es cantidad,
 * envase, forma farmacéutica o laboratorio.
 */
export function parseConcentration(text: string): Concentration | null {
  const haystack = stripAccentsLower(text);
  MEASUREMENT_RE.lastIndex = 0;

  for (const match of haystack.matchAll(MEASUREMENT_RE)) {
    const unit = canonicalUnit(match[2] ?? match[3]);
    if (!unit) continue;

    const numerator: Measurement = { value: toNumber(match[1]), unit };
    const denomUnit = canonicalUnit(match[5] ?? match[6]);
    if (!denomUnit) return { numerator, denominator: null };

    // "20 mg/ml" — cantidad implícita de 1 (ver `Concentration`).
    const denominator: Measurement = {
      value: match[4] !== undefined ? toNumber(match[4]) : 1,
      unit: denomUnit,
    };

    if (looksLikeCombinationRatio(numerator, denominator)) {
      return { numerator, denominator: null };
    }
    return { numerator, denominator };
  }

  return null;
}

/**
 * Representación canónica y estable de una concentración, para claves de
 * caché y para diagnóstico legible. No es un formato de presentación: la UI
 * nunca lo muestra.
 */
export function concentrationKey(concentration: Concentration): string {
  const { numerator, denominator } = concentration;
  const head = `${numerator.value}${numerator.unit}`;
  return denominator ? `${head}/${denominator.value}${denominator.unit}` : head;
}

// ---------------------------------------------------------------------------
// B. CANTIDAD DE UNIDADES
// ---------------------------------------------------------------------------

/**
 * Unidades por envase declaradas en el texto ("x 20", "16 comprimidos"), o
 * `null`.
 *
 * Reutiliza `QUANTITY_PATTERN` de matching.ts —la MISMA expresión que
 * `matchKey()` ya usaba en línea— en vez de escribir una segunda regla de
 * cantidad. Si divergieran, una consulta podría "pedir" una cantidad que
 * `matchKey` nunca extrae del nombre y ningún resultado la satisfaría.
 */
export function parseQuantity(text: string): number | null {
  const match = stripAccentsLower(text).match(QUANTITY_PATTERN);
  if (!match) return null;
  const raw = match[1] ?? match[2];
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// ---------------------------------------------------------------------------
// C. INTENCIÓN DE CONSULTA
// ---------------------------------------------------------------------------

/** Longitud mínima de un término para que participe en la evaluación léxica. */
const MIN_TERM_LENGTH = 2;

export interface QueryIntent {
  /** Texto tal como lo escribió el usuario, sin normalizar. */
  rawQuery: string;
  /**
   * Consulta AMPLIA que se envía a los 9 buscadores de farmacia — exactamente
   * `cleanQuery(rawQuery)`. Ningún atributo de la intención la restringe.
   */
  retrievalQuery: string;
  /**
   * Términos normalizados (sin acentos, minúscula) derivados de
   * `retrievalQuery`, para comparación léxica por token completo.
   */
  terms: string[];
  /** Concentración pedida, o `null` si la consulta no declara ninguna. */
  concentration: Concentration | null;
  /** Unidades por envase pedidas, o `null`. */
  quantity: number | null;
  /** Clase gruesa de forma farmacéutica pedida, o `null`. */
  dosageForm: DosageFormClass | null;
}

/**
 * Intención estructurada de una consulta.
 *
 * `parseQueryIntent("ibuprofeno 600 mg x 20 comprimidos")` →
 *   retrievalQuery: "ibuprofeno"
 *   terms:          ["ibuprofeno"]
 *   concentration:  { numerator: {value: 600, unit: "mg"}, denominator: null }
 *   quantity:       20
 *   dosageForm:     "solid-oral"
 *
 * Los atributos se extraen del `rawQuery` COMPLETO, no de `retrievalQuery`:
 * `cleanQuery` ya los descartó, y volver a leerlos de su salida sería
 * imposible por construcción.
 */
export function parseQueryIntent(rawQuery: string): QueryIntent {
  const retrievalQuery = cleanQuery(rawQuery);

  return {
    rawQuery,
    retrievalQuery,
    terms: queryTerms(retrievalQuery),
    concentration: parseConcentration(rawQuery),
    quantity: parseQuantity(rawQuery),
    // Se reusa la función de CF-SEARCH-001 sin reabrir su modelo de identidad:
    // la misma clasificación gruesa que decide `|form:` en `presentationKey`
    // decide acá si la consulta pidió comprimidos o jarabe.
    dosageForm: dosageFormClass(rawQuery),
  };
}

/**
 * Términos léxicos de la consulta: tokens alfabéticos normalizados con la
 * MISMA tokenización que `matchKey()` (`normalizedWords`), para que "consulta"
 * y "nombre de producto" se comparen sobre el mismo vocabulario. Se descartan
 * los tokens con dígitos (ya representados en `concentration`/`quantity`).
 */
function queryTerms(retrievalQuery: string): string[] {
  const seen = new Set<string>();
  for (const word of normalizedWords(retrievalQuery)) {
    if (word.length < MIN_TERM_LENGTH) continue;
    if (/\d/.test(word)) continue;
    seen.add(word);
  }
  return [...seen];
}

// ---------------------------------------------------------------------------
// D. CLAVE DE CACHÉ POR INTENCIÓN
// ---------------------------------------------------------------------------

/**
 * Clave de caché DERIVADA DE LA INTENCIÓN, no del texto crudo.
 *
 * Corrige la causa directa de QA-05: hoy la clave es `cleanQuery(raw)`, así
 * que "ibuprofeno 200/400/600 mg" comparten entrada y la segunda y tercera
 * consulta reciben la respuesta ya rankeada de la primera (verificado en
 * producción: `x-search-cache: hit` con resultados idénticos).
 *
 * Formato: `<retrievalQuery>|dose:<c>|qty:<n>|form:<f>`, con los segmentos
 * ausentes omitidos — una consulta sin atributos produce exactamente
 * `<retrievalQuery>`, igual que antes. Se eligió el mismo estilo de segmentos
 * `clave:valor` que ya usa `presentationKey` (commercialIdentity.ts) para no
 * introducir un segundo dialecto de claves en el proyecto.
 *
 * Dos consultas equivalentes escritas distinto ("ibuprofeno 600mg" y
 * "Ibuprofeno 600 MG") producen la MISMA clave, porque se deriva de valores ya
 * normalizados y no del texto.
 */
export function queryIntentCacheKey(intent: QueryIntent): string {
  const segments = [intent.retrievalQuery.toLowerCase().trim()];
  if (intent.concentration) segments.push(`dose:${concentrationKey(intent.concentration)}`);
  if (intent.quantity !== null) segments.push(`qty:${intent.quantity}`);
  if (intent.dosageForm) segments.push(`form:${intent.dosageForm}`);
  return segments.join("|");
}
