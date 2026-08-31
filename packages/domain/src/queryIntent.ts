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
import {
  concentrationKey,
  parseConcentration,
  type Concentration,
} from "./concentration.js";

// ---------------------------------------------------------------------------
// A. MAGNITUDES Y CONCENTRACIÓN
//
// El modelo (`Measurement`, `Concentration`), la tabla de unidades y el parser
// viven en `concentration.ts` desde CF-SEARCH-003: la capa de identidad de
// producto necesita EXACTAMENTE las mismas primitivas para leer el nombre del
// producto, y no puede importar este módulo sin crear un ciclo (`queryIntent`
// ya importa `dosageFormClass` de `productIdentity`). No hubo cambio de
// semántica en el movimiento — ver la cabecera de `concentration.ts`.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// B. CANTIDAD DE UNIDADES
// ---------------------------------------------------------------------------

function stripAccentsLower(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

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
