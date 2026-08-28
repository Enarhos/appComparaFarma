const STOP_WORDS = new Set([
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

export function matchKey(name: string): string {
  const raw = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const mlHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*ml\b/gi)];
  const mgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*mg\b/gi)];
  const mcgHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi)];
  const gHits = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*g\b/gi)];
  const lower = raw
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = lower.split(" ");

  const brandWords = words.filter(
    (w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w) && /^[a-z]+$/.test(w)
  );

  let first = brandWords[0] ?? "";
  if (first.length >= 2 && first.length <= 4 && brandWords[1] && brandWords[1].length <= 4) {
    first = first + brandWords[1];
  }

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
const SALT_QUALIFIER_WORDS = new Set([
  "potasico", "potasica", "sodico", "sodica", "calcico", "calcica",
  "magnesico", "magnesica", "clorhidrato", "hidrocloruro", "bromhidrato",
  "sulfato", "fosfato", "nitrato", "acetato", "maleato", "mesilato",
  "besilato", "tartrato", "succinato", "fumarato", "citrato", "estearato",
  "monohidrato", "dihidratado", "trihidratado", "hemihidrato", "anhidro",
  "micronizado",
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
 * sean forma farmacéutica/unidad (`STOP_WORDS`) ni sal/calificador químico.
 */
function ingredientTokens(raw: string): string[] {
  return raw
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(
      (w) =>
        w.length >= INGREDIENT_MIN_LENGTH &&
        /^[a-z]+$/.test(w) &&
        !STOP_WORDS.has(w) &&
        !SALT_QUALIFIER_WORDS.has(w)
    );
}

/**
 * Índice del primer separador explícito de principios activos (`+` o `/`), o
 * `-1`. Reglas deliberadamente asimétricas por lo ambiguo que es cada símbolo
 * en nombres reales:
 *   - `+` cuenta si hay una palabra de >= 4 letras a alguno de los dos lados
 *     ("Losartán Potásico + Hidroclorotiazida"). Descarta "Día + Noche"
 *     (palabras cortas) por longitud.
 *   - `/` cuenta SOLO si a la derecha hay una palabra de >= 4 letras
 *     ("Losartán/Hidroclorotiazida", "875 mg / Ácido Clavulánico"). Si a la
 *     derecha hay un número es una razón de dosis o de volumen ("50/12,5mg",
 *     "100 mg/5 ml"), no un separador de ingredientes.
 * `-` NO se considera: `matchKey()` ya une las palabras que separa
 * (`(\w)-(\w)` → `$1$2`), así que "Sulfametoxazol-Trimetoprima" ya produce un
 * `matchKey` distinto del monofármaco sin necesidad de este token.
 */
function combinationSeparatorIndex(raw: string): number {
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char !== "+" && char !== "/") continue;

    const rightWord = /^\s*([a-z]{4,})\b/.exec(raw.slice(i + 1))?.[1];
    if (char === "/") {
      if (rightWord) return i;
      continue;
    }

    const leftWord = /([a-z]{4,})\s*$/.exec(raw.slice(0, i))?.[1];
    if (rightWord || leftWord) return i;
  }
  return -1;
}

/**
 * Token que identifica al SEGUNDO principio activo de una combinación, o `null`
 * si el nombre no describe una combinación.
 *
 * Requiere DOS condiciones (no basta con que haya varias palabras largas, para
 * no partir monofármacos con nombre compuesto):
 *   1. una señal de combinación — separador explícito entre ingredientes, o una
 *      razón de dosis masa/masa;
 *   2. que existan al menos dos tokens con forma de principio activo.
 *
 * Cuando hay separador explícito se prefiere el primer ingrediente a su
 * derecha (maneja principios activos de nombre compuesto: "Ácido
 * Acetilsalicílico + Cafeína" → "cafeina"); si no lo hay, se usa el segundo
 * token de la lista completa ("Losartan Hidroclorotiazida 50/12,5mg" →
 * "hidroclorotiazida").
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

  const separatorIndex = combinationSeparatorIndex(raw);
  if (separatorIndex < 0 && !DOSE_RATIO_RE.test(raw)) return null;

  const tokens = ingredientTokens(raw);
  if (tokens.length < 2) return null;

  if (separatorIndex >= 0) {
    const afterSeparator = ingredientTokens(raw.slice(separatorIndex + 1))[0];
    if (afterSeparator && afterSeparator !== tokens[0]) return afterSeparator;
  }

  return tokens[1];
}
