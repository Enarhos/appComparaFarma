/**
 * Vocabulario de ruido de `matchKey()`. Se exporta (CF-SEARCH-001, 2026-08-27)
 * para que `productIdentity.ts` derive la variante comercial sobre EXACTAMENTE
 * el mismo vocabulario que `matchKey()` usa para elegir su cabecera de marca —
 * si las dos listas divergieran, la variante podría "descubrir" como
 * calificador una palabra que `matchKey` ya consumió como marca, o al revés.
 *
 * Sigue siendo la lista congelada de `matchKey`: agregarle o quitarle entradas
 * cambia claves persistidas (`price_history`, `medication_match_key_aliases`,
 * `pharmacy_clicks`, `email_alerts`) y está prohibido sin migración explícita.
 */
export const STOP_WORDS = new Set([
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  "comp", "comprimido", "comprimidos", "capsula", "capsulas", "tab",
  "tableta", "tabletas", "sol", "solucion", "jarabe", "suspension",
  "crema", "gel", "gotas", "ampolla", "inyectable", "recubierto",
  "liberacion", "prolongada", "inhalador", "aerosol", "polvo",
  "parche", "supositorio", "colirio", "nasal", "ocular", "rectal",
  "mg", "ml", "mcg", "g", "ui", "iu", "infantil", "adulto", "forte",
  "plus", "pediatrico", "nino",
  "dia", "noche", "dn", "yn",
]);

/**
 * Tokenización compartida por `matchKey()` y por la extracción de variante
 * comercial (`productIdentity.ts`, CF-SEARCH-001): sin acentos, minúsculas,
 * guiones intra-palabra colapsados ("Co-Amoxiclav" → "coamoxiclav"), resto de
 * la puntuación como separador.
 *
 * Se extrajo tal cual del cuerpo de `matchKey()` sin cambiar una sola
 * operación: el objetivo es que ambas capas partan de la MISMA lista de
 * palabras, no reordenar ni "mejorar" la normalización de `matchKey`, cuyo
 * resultado está persistido.
 */
export function normalizedWords(name: string): string[] {
  return stripAccentsLower(name)
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

function isBrandWord(word: string): boolean {
  return word.length >= 2 && !STOP_WORDS.has(word) && !/^\d/.test(word) && /^[a-z]+$/.test(word);
}

/**
 * Token(es) que `matchKey()` consume como cabecera de marca/principio activo —
 * el primero, más el segundo cuando ambos son cortos ("Trio Val" → ["trio",
 * "val"], que `matchKey` concatena en "trioval").
 *
 * Existe para que `productIdentity.ts` sepa EXACTAMENTE dónde termina la marca
 * y empieza el calificador comercial. Si se dedujera por separado, "Trio Val
 * 500 mg" derivaría "val" como variante y no agruparía con "Trio-Val 500 mg"
 * (cuyo guión colapsa a un solo token) — un falso split introducido por
 * duplicar la regla en vez de reusarla.
 */
export function brandHeadTokens(words: string[]): string[] {
  const brandWords = words.filter(isBrandWord);
  const first = brandWords[0];
  if (!first) return [];
  if (first.length <= 4 && brandWords[1] && brandWords[1].length <= 4) {
    return [first, brandWords[1]];
  }
  return [first];
}

export function matchKey(name: string): string {
  const raw = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const mlHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/gi)];
  const mgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/gi)];
  const mcgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi)];
  const gHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
  const words = normalizedWords(name);
  const lower = words.join(" ");

  let first = brandHeadTokens(words).join("");

  if (!first) {
    for (const w of words) {
      if (w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w)) {
        first = w;
        break;
      }
    }
  }

  let dose = "";
  if (mlHits.length) {
    dose = `${Math.max(...mlHits.map((m) => parseFloat(m[1].replace(",", "."))))}ml`;
  } else if (mcgHits.length) {
    dose = `${parseFloat(mcgHits[0][1].replace(",", "."))}mcg`;
  } else if (mgHits.length) {
    dose = `${parseFloat(mgHits[0][1].replace(",", "."))}mg`;
  } else if (gHits.length) {
    const mg = Math.max(...gHits.map((m) => parseFloat(m[1].replace(",", ".")) * 1000));
    dose = `${mg}mg`;
  }

  const qtyM = raw.match(
    /(?:\bx\s*(\d+)|\b(\d+)\s*(?:sobres?|comprimidos?|comp|c[aá]psulas?|cap|tab|tabletas?|amp(?:ollas?)?|parches?|grageas?|sachets?|unidades?)\b)/i
  );
  const qty = qtyM ? (qtyM[1] ?? qtyM[2] ?? "") : "";
  const normalizedQty = qty === "1" ? "" : qty;

  const turn = /\bnoche\b/.test(raw) ? "n" : /\bdia\b/.test(raw) ? "d" : "";

  return first ? [first, dose, turn, normalizedQty].filter(Boolean).join("|") : lower.slice(0, 30);
}

// ---------------------------------------------------------------------------
// S-1 (SEARCH-MATCHING-QA-01, Gate 2) — detección de COMBINACIONES.
//
// Defecto: `matchKey()` toma SOLO el primer token farmacológico (`brandWords[0]`)
// y la primera concentración (`mgHits[0]`). Un producto de combinación queda
// entonces con el MISMO `matchKey` que el monofármaco de su primer principio
// activo, y `mergeDuplicates` los fusiona en una sola tarjeta. Observado en
// producción 2026-08-27 (query "losartan"):
//   losartan|50mg|30|bio:false|brand:ascend agrupaba
//     araucomed "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)"          $990
//     farmex    "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30"  $1990
// Es riesgo clínico: dos medicamentos distintos presentados como el mismo, con
// una diferencia de precio que parece un ahorro.
//
// `matchKey()` NO se toca: su valor está persistido en `price_history`,
// `medication_match_key_aliases`, `pharmacy_clicks` y `email_alerts`; cambiarlo
// invalidaría los históricos. La corrección se aplica en `presentationKey()`
// (capa de identidad comercial, no persistida — ver commercialIdentity.ts), que
// incorpora el token derivado acá.
// ---------------------------------------------------------------------------

/**
 * Sales, ésteres y calificadores de forma química que acompañan a un principio
 * activo pero NO son un segundo principio activo ("Losartán POTÁSICO",
 * "Sertralina CLORHIDRATO"). Se descartan al buscar el segundo ingrediente para
 * que dos farmacias que escriben la misma combinación con y sin la sal
 * ("Losartán Potásico + Hidroclorotiazida" vs "Losartán + Hidroclorotiazida")
 * deriven el MISMO token y sigan agrupando.
 *
 * Misma política que `NOISE_PHRASES`/`KNOWN_ACTIVE_INGREDIENTS` en
 * commercialIdentity.ts: categoría acotada y explícita, no un intento de
 * enumerar toda la química farmacéutica.
 */
export const SALT_QUALIFIER_WORDS = new Set([
  "potasico", "potasica", "sodico", "sodica", "calcico", "calcica",
  "magnesico", "magnesica", "clorhidrato", "hidrocloruro", "bromhidrato",
  "sulfato", "fosfato", "nitrato", "acetato", "maleato", "mesilato",
  "besilato", "tartrato", "succinato", "fumarato", "citrato", "estearato",
  "monohidrato", "dihidratado", "trihidratado", "hemihidrato", "anhidro",
  "micronizado",
]);

/**
 * Palabras de forma farmacéutica/presentación en plural o variante que
 * `STOP_WORDS` no cubre ("recubiertos", "dispersables", "oral", "sobres").
 *
 * Se mantienen SEPARADAS de `STOP_WORDS` porque esa lista alimenta a
 * `matchKey()`, cuyo valor está persistido en historiales y alertas: agregarle
 * entradas cambiaría claves ya guardadas. Esta lista la usa EXCLUSIVAMENTE
 * `combinationKey()`.
 *
 * Existe por evidencia real (listados en vivo de Ahumada, 2026-08-27): sin ella
 * "Hyzaar 50 mg/12.5 mg x 30 Comprimidos Recubiertos" derivaba
 * `combo:recubiertos`, y dos farmacias que describen la misma presentación con
 * palabras distintas dejaban de agruparse — el fix de S-1 habría causado una
 * regresión de fusión. Es la misma categoría que `DOSAGE_FORM_WORDS` en
 * commercialIdentity.ts; se mantiene acá aparte para no invertir la dirección
 * de dependencia entre ambos módulos (matching.ts no importa nada).
 */
export const PRESENTATION_FORM_WORDS = new Set([
  "recubiertos", "recubierta", "recubiertas",
  "gragea", "grageas", "sobre", "sobres", "sachet", "sachets",
  "ampollas", "ampolleta", "ampolletas", "vial", "viales", "jeringa", "jeringas",
  "dispersable", "dispersables", "masticable", "masticables",
  "efervescente", "efervescentes", "sublingual", "vaginal", "oftalmica", "otica",
  "blando", "blanda", "blandos", "blandas",
  "granulo", "granulos", "granulado", "granulados",
  "gota", "parches", "supositorios", "ovulo", "ovulos",
  "oral", "topico", "topica", "topicos", "topicas",
  "locion", "pomada", "unguento", "spray", "liquido", "liquida",
  "frasco", "frascos", "envase", "estuche", "caja", "bolsa", "tira", "tiras",
  "unidad", "unidades", "soluciones", "suspensiones", "inyectables",
  "dosis", "dosificacion", "inhalacion", "inhalaciones", "puff", "puffs",
  "aplicacion", "aplicaciones", "actuacion", "actuaciones", "nebulizacion",
  "pulverizacion", "disparo", "disparos",
]);

/** Longitud mínima de un token para tratarlo como nombre de principio activo. */
const INGREDIENT_MIN_LENGTH = 4;

/**
 * Razón de dosis entre DOS masas ("50 mg / 12.5 mg", "50/12,5mg", "800/160 mg").
 * Es la firma tipográfica de una combinación cuando el nombre no trae un
 * separador entre palabras.
 *
 * El denominador DEBE ser una unidad de masa: eso excluye a propósito las
 * concentraciones masa/volumen ("Ibuprofeno 100 mg/5 mL Suspensión") y las
 * razones masa/unidad ("500 mg/comprimido"), que describen UN solo principio
 * activo y no deben marcarse como combinación.
 */
const DOSE_RATIO_RE = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|ug|g)?\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|mcg|ug|g)\b/;

function stripAccentsLower(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Tokens con forma de nombre de principio activo, en orden de aparición:
 * puramente alfabéticos, de al menos `INGREDIENT_MIN_LENGTH` letras, que no
 * sean forma farmacéutica/unidad (`STOP_WORDS` + `PRESENTATION_FORM_WORDS`) ni
 * sal/calificador químico (`SALT_QUALIFIER_WORDS`).
 */
function isIngredientToken(word: string | undefined): word is string {
  return (
    word !== undefined &&
    word.length >= INGREDIENT_MIN_LENGTH &&
    /^[a-z]+$/.test(word) &&
    !STOP_WORDS.has(word) &&
    !PRESENTATION_FORM_WORDS.has(word) &&
    !SALT_QUALIFIER_WORDS.has(word)
  );
}

function ingredientTokens(raw: string): string[] {
  return raw
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(isIngredientToken);
}

/**
 * Principio activo que sigue INMEDIATAMENTE a un separador explícito (`+` o
 * `/`), o `null`. La adyacencia es estricta a propósito: el token debe ser la
 * primera palabra a la derecha del símbolo, no "el primer ingrediente que
 * aparezca en algún lugar después".
 *
 * Sin esa restricción, nombres reales (Ahumada en vivo, 2026-08-27) derivaban
 * tokens de cualquier cosa que viniera más adelante: "Salbutamol 100 mcg/Dosis
 * x 200 Dosis Aerosol para Inhalación Oral FAES FARMA CHILE" —un
 * MONOFÁRMACO— saltaba "dosis"/"aerosol" y terminaba en el nombre del
 * laboratorio.
 *
 * `-` NO se considera separador: `matchKey()` ya une las palabras que separa
 * (`(\w)-(\w)` → `$1$2`), así que "Sulfametoxazol-Trimetoprima" ya produce un
 * `matchKey` distinto del monofármaco sin necesidad de este token.
 */
function ingredientAfterSeparator(raw: string): string | null {
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char !== "+" && char !== "/") continue;
    const rightWord = /^\s*([a-z]+)/.exec(raw.slice(i + 1))?.[1];
    if (isIngredientToken(rightWord)) return rightWord;
  }
  return null;
}

/**
 * Token que identifica al SEGUNDO principio activo de una combinación, o `null`
 * si el nombre no describe una combinación.
 *
 * Dos caminos, ninguno basado en "hay varias palabras largas" (eso partiría
 * monofármacos con nombre compuesto):
 *   1. Separador explícito entre ingredientes: se toma el principio activo
 *      INMEDIATAMENTE a la derecha del `+` o `/`. Maneja principios activos de
 *      nombre compuesto ("Ácido Acetilsalicílico + Cafeína" → "cafeina").
 *   2. Razón de dosis masa/masa sin separador entre palabras: el segundo
 *      ingrediente se busca SOLO en el encabezado del nombre, antes del primer
 *      dígito ("Losartan Hidroclorotiazida 50/12,5mg" → "hidroclorotiazida"):
 *      sin separador los dos principios activos van siempre juntos delante de
 *      la concentración, y todo lo que sigue al primer dígito es dosis,
 *      cantidad, forma farmacéutica o laboratorio.
 *
 * Ambas restricciones (adyacencia al separador, y encabezado antes del primer
 * dígito) salieron de verificar la función contra 206 nombres reales de 12
 * búsquedas en vivo de Ahumada (2026-08-27): sin ellas aparecían falsos
 * positivos como `combo:recubiertos` ("Hyzaar 50 mg/12.5 mg x 30 Comprimidos
 * Recubiertos"), `combo:dosis` ("Salbutamol 100 mcg/Dosis x 200 Dosis") o el
 * nombre del laboratorio, que habrían partido en dos tarjetas al MISMO producto
 * listado por dos farmacias con distinta redacción — una regresión de fusión
 * causada por el propio fix.
 *
 * Limitaciones conocidas y aceptadas (todas en la dirección conservadora del
 * proyecto: preferir un falso negativo — dos tarjetas para el mismo producto —
 * antes que un falso positivo de precio):
 *   - Solo se captura el SEGUNDO ingrediente: dos combinaciones triples que
 *     compartan los dos primeros principios activos derivan el mismo token.
 *   - Dos farmacias que nombran al segundo ingrediente con sinónimos distintos
 *     ("Ácido Clavulánico" vs "Clavulanato de Potasio") derivan tokens
 *     distintos y no se agrupan entre sí.
 *   - Una combinación de marca sin ingredientes en el nombre ("Hyzaar
 *     50/12,5mg") devuelve `null`: no hay segundo token que extraer, y tampoco
 *     hay riesgo de colisión con un monofármaco, porque su `matchKey` ya parte
 *     de la marca.
 */
export function combinationKey(name: string): string | null {
  const raw = stripAccentsLower(name);

  const afterSeparator = ingredientAfterSeparator(raw);
  if (afterSeparator && afterSeparator !== ingredientTokens(raw)[0]) return afterSeparator;

  if (!DOSE_RATIO_RE.test(raw)) return null;

  const firstDigit = raw.search(/\d/);
  const head = firstDigit >= 0 ? raw.slice(0, firstDigit) : raw;
  return ingredientTokens(head)[1] ?? null;
}
