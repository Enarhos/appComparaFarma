/**
 * CF-SEARCH-002 — Relevancia consulta→resultado y cohortes de concentración.
 *
 * Es la capa que faltaba por completo en el pipeline: hasta ahora
 * `searchService` hacía `mergeDuplicates(all).sort(por precio)` y NUNCA
 * comparaba un resultado contra la consulta que lo trajo. Los dos defectos que
 * este módulo cierra son consecuencia directa de esa ausencia.
 *
 * QA-02 — "omeprazol" devuelve Esomeprazol
 * ----------------------------------------
 * Producción 2026-08-28, `GET /api/search?q=omeprazol`: 36 tarjetas, de las
 * cuales 10 son `esomeprazol|*`. El motor de cada farmacia hace el match
 * porque "esomeprazol" CONTIENE "omeprazol" como substring; nuestro pipeline no
 * tiene forma de descartarlo porque no evalúa relevancia en ningún punto.
 * Son dos principios activos distintos (el esomeprazol es el enantiómero S,
 * con otra dosificación y otro precio).
 *
 * QA-05 — la concentración pedida no ordena nada
 * ----------------------------------------------
 * Producción 2026-08-28: "ibuprofeno 200/400/600 mg" devolvieron las MISMAS
 * 110 tarjetas ordenadas solo por precio, y las dos últimas con
 * `x-search-cache: hit` sobre la entrada de la primera.
 *
 * POLÍTICA (heredada de commercialIdentity.ts / productIdentity.ts, no se
 * relaja acá): ante duda razonable NO se descarta. Este módulo **nunca elimina
 * resultados** — clasifica y ordena. Un falso positivo de "no es lo que
 * buscabas" que borra una oferta real es peor que una oferta poco relevante
 * mostrada al final, y las búsquedas por marca (Tapsin, Actron, Kitadol)
 * dependen de esa política para no perder recall.
 */

import type { ConcentrationMatch, LexicalMatch, MedicationResult } from "./types.js";
import { normalizedWords } from "./matching.js";
import { dosageFormClass, type DosageFormClass } from "./productIdentity.js";
import {
  isSameConcentration,
  parseConcentration,
  parseQuantity,
  type Concentration,
  type QueryIntent,
} from "./queryIntent.js";

/**
 * Compatibilidad léxica/farmacológica entre la consulta y un resultado.
 *
 *   `exact`      — todos los términos de la consulta aparecen como TOKEN
 *                  COMPLETO en el nombre del resultado.
 *   `compatible` — no hay evidencia en contra. Incluye el caso más importante
 *                  para el recall: las búsquedas por marca y los resultados de
 *                  marca de una búsqueda por principio activo ("Lomex" para
 *                  "omeprazol"), donde el nombre simplemente no repite el
 *                  término buscado. NO se degrada en el orden.
 *   `mismatch`   — hay evidencia FUERTE de incompatibilidad: el término
 *                  buscado solo aparece como substring de otro nombre
 *                  farmacológico distinto, y no aparece completo en ninguna
 *                  parte. Es la regla general de QA-02, no un caso
 *                  hardcodeado.
 *
 * `ConcentrationMatch` es la cohorte de concentración de un resultado respecto
 * de la pedida. Solo se calcula cuando la consulta declara una concentración;
 * si no la declara no existe cohorte y el campo queda ausente en la respuesta
 * — no se inventa una preferencia por ninguna dosis.
 *
 * Ambos tipos se definen en types.js (son parte del contrato público de
 * `/api/search`) y se re-exportan acá, que es donde vive su semántica.
 */
export type { ConcentrationMatch, LexicalMatch };

/** Señal suave: coincide / no se sabe / difiere. Nunca elimina un resultado. */
export type SoftMatch = "exact" | "unknown" | "different";

export interface ResultRelevance {
  lexicalMatch: LexicalMatch;
  /** `null` cuando la consulta no pidió concentración: no hay cohorte que asignar. */
  concentrationMatch: ConcentrationMatch | null;
  quantityMatch: SoftMatch;
  dosageFormMatch: SoftMatch;
  /** Concentración leída del resultado, o `null` si su nombre no la declara. */
  concentration: Concentration | null;
}

// ---------------------------------------------------------------------------
// A. EVIDENCIA TEXTUAL DEL RESULTADO
// ---------------------------------------------------------------------------

/**
 * Todos los nombres que describen a UNA tarjeta: el canónico más el de cada
 * oferta fusionada.
 *
 * Se usan todos, y no solo `canonicalName`, por recall: `mergeDuplicates`
 * elige un canónico entre ofertas de 9 farmacias que escriben el mismo
 * artículo de forma muy desigual, y varias truncan el nombre en el listado
 * (patrón documentado de EasyFarma: "Omeprazol 20 mg x 30..."). Si el término
 * buscado aparece completo en CUALQUIERA de esos nombres, el resultado es
 * relevante.
 */
function resultNames(result: MedicationResult): string[] {
  const names = [result.canonicalName, ...result.prices.map((p) => p.productName)];
  return names.filter((name): name is string => typeof name === "string" && name.length > 0);
}

/**
 * Longitud mínima para que un token participe en la detección de substring.
 *
 * Sin este piso, cualquier token corto compartido dispararía "mismatch" por
 * accidente. Con 5, la regla solo se activa entre nombres de longitud
 * farmacológica —"omeprazol" ⊂ "esomeprazol", "aspirina" ⊂ "cafiaspirina"— que
 * es exactamente la clase de falso positivo que reporta QA-02.
 */
const MIN_SUBSTRING_LENGTH = 5;

/**
 * Diferencia MÍNIMA de longitud entre los dos tokens para aceptar la inclusión
 * como evidencia de que son principios activos distintos.
 *
 * Un solo carácter de diferencia es, en los datos reales, un plural o un
 * defecto de codificación — no un prefijo farmacológico. Caso real que costó
 * esta regla (producción 2026-08-28, query "tapsin"): dos ofertas de Ahumada
 * llegan con el nombre corrompido, "Tapsí­n M (B) Paracetamol 10 Comprimidos"
 * con un soft hyphen incrustado, que tokeniza como `tapsi`. Sin este umbral,
 * `"tapsin".includes("tapsi")` degradaba a `mismatch` DOS PRODUCTOS TAPSIN
 * REALES en una búsqueda de marca — exactamente la pérdida de recall que la
 * política del proyecto prohíbe.
 *
 * Los prefijos que sí distinguen principios activos superan siempre este
 * umbral: es- (esomeprazol/omeprazol, 2), dex- (dexketoprofeno/ketoprofeno,
 * 3), levo- (levocetirizina/cetirizina, 4), cafi- (cafiaspirina/aspirina, 4).
 */
const MIN_LENGTH_DIFFERENCE = 2;

type TermEvidence = "exact" | "substring-only" | "absent";

/**
 * Evidencia de UN término de la consulta dentro del vocabulario de un
 * resultado.
 *
 * `exact` exige token COMPLETO, nunca `includes()` sobre el nombre entero: esa
 * es la causa raíz de QA-02. La tokenización es la de `normalizedWords()`
 * (matching.ts), la misma que usa `matchKey`, así que "Omeprazol" y "OMEPRAZOL
 * (B)" producen el mismo token.
 */
function termEvidence(term: string, tokens: Set<string>): TermEvidence {
  if (tokens.has(term)) return "exact";
  if (term.length < MIN_SUBSTRING_LENGTH) return "absent";

  for (const token of tokens) {
    if (token === term || token.length < MIN_SUBSTRING_LENGTH) continue;
    if (Math.abs(token.length - term.length) < MIN_LENGTH_DIFFERENCE) continue;
    // La inclusión se evalúa en las dos direcciones: "omeprazol" buscado
    // frente a "esomeprazol" listado, y "esomeprazol" buscado frente a
    // "omeprazol" listado, son el mismo error simétrico.
    if (token.includes(term) || term.includes(token)) return "substring-only";
  }
  return "absent";
}

/**
 * Clasificación léxica de un resultado frente a la intención.
 *
 * Ejemplos reales (producción 2026-08-28):
 *   q "omeprazol" · "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)" → exact
 *   q "omeprazol" · "Omeprazol 20 mg x 30..."            (truncado) → exact
 *   q "omeprazol" · "Lomex 20 mg x 30 cápsulas"                     → compatible
 *   q "omeprazol" · "Esomeprazol 40 mg x 30 comp. rec. entérico"    → mismatch
 *   q "ibuprofeno"· "Actron 400 mg x 10 cápsulas blandas"           → compatible
 *   q "tapsin"    · "Tapsin Forte x 20 Comprimidos Recubiertos"     → exact
 *
 * Una consulta sin términos (solo números, imposible hoy porque
 * `validateQuery` la rechaza antes) devuelve `compatible`: sin términos no hay
 * evidencia de nada.
 */
function evaluateLexicalMatch(terms: string[], tokens: Set<string>): LexicalMatch {
  if (terms.length === 0) return "compatible";

  let exactCount = 0;
  let substringOnly = false;

  for (const term of terms) {
    const evidence = termEvidence(term, tokens);
    if (evidence === "exact") exactCount++;
    else if (evidence === "substring-only") substringOnly = true;
  }

  if (exactCount === terms.length) return "exact";
  // Evidencia fuerte de incompatibilidad SOLO si ningún término se encontró
  // completo: "Losartán + Hidroclorotiazida" frente a la consulta "losartán
  // hidroclorotiazida" tiene los dos términos exactos; el monofármaco
  // "Losartán Potásico" tiene uno exacto y el otro ausente → compatible, no
  // mismatch. Nunca se descarta un resultado que sí contiene lo buscado.
  if (substringOnly && exactCount === 0) return "mismatch";
  return "compatible";
}

// ---------------------------------------------------------------------------
// B. ATRIBUTOS DEL RESULTADO
// ---------------------------------------------------------------------------

/**
 * Primera lectura no nula sobre los nombres de la tarjeta. El orden importa:
 * `canonicalName` primero (es el nombre que la UI muestra), y las ofertas
 * después como respaldo cuando el canónico viene truncado.
 */
function firstFrom<T>(names: string[], read: (name: string) => T | null): T | null {
  for (const name of names) {
    const value = read(name);
    if (value !== null) return value;
  }
  return null;
}

function softCompare<T>(
  expected: T | null,
  actual: T | null,
  equals: (a: T, b: T) => boolean
): SoftMatch {
  // La consulta no pidió nada por este eje: no hay nada que comparar y no
  // debe introducirse preferencia alguna.
  if (expected === null) return "exact";
  // La farmacia no declaró el dato. Nunca se penaliza como "distinto": omitir
  // la cantidad o la forma es habitual y no afirma nada (misma política que
  // `dosageForm: null` en isSameProduct, productIdentity.ts).
  if (actual === null) return "unknown";
  return equals(expected, actual) ? "exact" : "different";
}

/**
 * Relevancia de UN resultado frente a UNA intención de consulta.
 *
 * Función pura y sin estado: se puede recalcular sobre resultados ya
 * anotados (por ejemplo servidos desde caché con la anotación de otra
 * intención) porque toda la evidencia se relee de los NOMBRES, nunca de una
 * anotación previa.
 */
export function evaluateResultRelevance(
  intent: QueryIntent,
  result: MedicationResult
): ResultRelevance {
  const names = resultNames(result);
  const tokens = new Set(names.flatMap((name) => normalizedWords(name)));

  const concentration = firstFrom(names, parseConcentration);
  const quantity = firstFrom(names, parseQuantity);
  const form = firstFrom<DosageFormClass>(names, dosageFormClass);

  return {
    lexicalMatch: evaluateLexicalMatch(intent.terms, tokens),
    concentrationMatch: evaluateConcentrationMatch(intent.concentration, concentration),
    quantityMatch: softCompare(intent.quantity, quantity, (a, b) => a === b),
    dosageFormMatch: softCompare(intent.dosageForm, form, (a, b) => a === b),
    concentration,
  };
}

/**
 * Cohorte de concentración.
 *
 *   `null`      — la consulta no pidió concentración. No hay cohorte, y por lo
 *                 tanto tampoco reordenamiento por dosis: "ibuprofeno" a secas
 *                 se sigue comportando exactamente como hoy.
 *   `unknown`   — la consulta pidió concentración y el nombre del resultado no
 *                 declara ninguna (nombre truncado por la farmacia). Se sitúa
 *                 ENTRE exact y other: no se puede afirmar que sea la dosis
 *                 pedida, pero tampoco que no lo sea, y descartarlo destruiría
 *                 recall real (EasyFarma trunca sistemáticamente).
 */
function evaluateConcentrationMatch(
  requested: Concentration | null,
  actual: Concentration | null
): ConcentrationMatch | null {
  if (requested === null) return null;
  if (actual === null) return "unknown";
  return isSameConcentration(requested, actual) ? "exact" : "other";
}

// ---------------------------------------------------------------------------
// C. ORDEN
// ---------------------------------------------------------------------------

const CONCENTRATION_COHORT_RANK: Record<ConcentrationMatch, number> = {
  exact: 0,
  unknown: 1,
  other: 2,
};

const SOFT_RANK: Record<SoftMatch, number> = {
  exact: 0,
  unknown: 1,
  different: 2,
};

/**
 * Clave de orden de un resultado, de mayor a menor prioridad.
 *
 * 1. **`mismatch` al final.** Es la única degradación por relevancia léxica, y
 *    solo se aplica con evidencia fuerte (ver `evaluateLexicalMatch`). `exact`
 *    y `compatible` comparten tier a propósito: degradar `compatible` movería
 *    todos los productos de MARCA por debajo de todos los genéricos en una
 *    búsqueda por principio activo, y PreciosFarma es primariamente un
 *    comparador de precios. La distinción sigue expuesta como metadato.
 *
 * 2. **Cohorte de concentración (EXACT → UNKNOWN → OTHER).** Es un límite
 *    DURO: el precio no lo cruza nunca. Un Ibuprofeno 400 mg más barato no
 *    puede aparecer antes que un Ibuprofeno 600 mg más caro cuando se buscó
 *    600 mg. Cuando la consulta no trae concentración, todos los resultados
 *    caen en el mismo tier y este criterio no altera nada.
 *
 * 3. **Cantidad y forma farmacéutica**, en ese orden y como señales SUAVES
 *    (`exact > unknown > different`): desempatan DENTRO de la cohorte, nunca
 *    la cruzan y nunca eliminan nada. Es lo que mantiene "paracetamol 500 mg
 *    x16" como una intención distinta de "paracetamol 500 mg" sin convertir la
 *    cantidad en un cohorte duro.
 *
 * 4. **Precio efectivo** (`bestPrice`), el criterio histórico, que sigue
 *    gobernando dentro de cada tier.
 */
function sortKey(result: MedicationResult, relevance: ResultRelevance): number[] {
  return [
    relevance.lexicalMatch === "mismatch" ? 1 : 0,
    relevance.concentrationMatch === null
      ? 0
      : CONCENTRATION_COHORT_RANK[relevance.concentrationMatch],
    SOFT_RANK[relevance.quantityMatch],
    SOFT_RANK[relevance.dosageFormMatch],
    result.bestPrice,
  ];
}

function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Anota cada resultado con su relevancia y devuelve una copia ORDENADA según
 * la intención. No muta la entrada, no filtra, no fusiona: la cantidad de
 * tarjetas que entra es exactamente la que sale.
 *
 * Es el único punto del pipeline donde la consulta y los resultados se
 * comparan, y vive en `@comparafarma/domain` a propósito: Web y Mobile
 * consumen resultados YA clasificados y nunca vuelven a parsear nombres (regla
 * de convergencia, CLAUDE.md §7).
 *
 * Idempotente respecto de una anotación previa: recalcula todo desde los
 * nombres, así que re-rankear con OTRA intención un array servido desde caché
 * produce el mismo resultado que rankearlo desde cero.
 */
export function rankByRelevance(
  intent: QueryIntent,
  results: MedicationResult[]
): MedicationResult[] {
  const scored = results.map((result) => {
    const relevance = evaluateResultRelevance(intent, result);
    // Se descarta cualquier anotación PREVIA antes de escribir la de esta
    // intención. Sin este descarte, `...result` arrastraba el
    // `concentrationMatch` de otra consulta cuando la actual no pide
    // concentración —y la rama de abajo, al omitir el campo, no lo borraba—.
    // Es un caso real, no teórico: la caché de RETRIEVAL de `/api/search`
    // guarda los resultados YA anotados, así que "ibuprofeno 600 mg" seguido
    // de "ibuprofeno" servía la consulta amplia con las cohortes de la
    // primera, y Web/Mobile —que leen el CAMPO, no el orden— mandaban 63 de 92
    // tarjetas a "Otras concentraciones" y hundían el ibuprofeno más barato
    // del catálogo hasta la posición 29. Ver QA-01 de la revisión de esta
    // branch y el JSDoc de idempotencia más abajo.
    const { lexicalMatch: _previousLexical, concentrationMatch: _previousCohort, ...base } = result;
    return {
      key: sortKey(result, relevance),
      result: {
        ...base,
        lexicalMatch: relevance.lexicalMatch,
        // Ausente —y no `"exact"` fabricado— cuando la consulta no pidió
        // concentración: el contrato distingue "no aplica" de "coincide".
        ...(relevance.concentrationMatch === null
          ? {}
          : { concentrationMatch: relevance.concentrationMatch }),
      } satisfies MedicationResult,
    };
  });

  // `Array.prototype.sort` es estable desde ES2019 (V8/Hermes/JSC cumplen):
  // en empate total se conserva el orden de entrada, que ya venía ordenado por
  // precio desde `mergeDuplicates`.
  scored.sort((a, b) => compareKeys(a.key, b.key));
  return scored.map((entry) => entry.result);
}
