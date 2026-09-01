/**
 * CF-DATA-001 — Taxonomía explícita de identidad comercial: MARCA,
 * FABRICANTE y PRINCIPIO ACTIVO como tres campos separados.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * Hasta este módulo, las 9 farmacias volcaban su metadato de identidad en UN
 * solo campo (`ScrapedProduct.laboratory` → `MedicationResult.laboratory`) que
 * tenía SEMÁNTICA DISTINTA según la farmacia. Medido sobre el catálogo real
 * (3.697 ofertas, 29 búsquedas, 2026-08-31 — evidencia en docs/qa/cf-data-001/):
 *
 *   dr-simi     `product.brand`       → FABRICANTE  (MAVER, PRATER, OPKO…) 100 %
 *   araucomed   `manufacturer_name`   → FABRICANTE  (Ascend, Mintlab…)      79 %
 *   farmex      `vendor`              → FABRICANTE  (EUROLAB, ABBOTT…)     100 %
 *   salcobrand  `hit.brand`           → **MARCA**   (Tapsin, Muxol…)       100 %
 *   cruz-verde  `hit.brand`           → INEXISTENTE (el campo no viene)      0 %
 *   ahumada / ecofarmacias / easyfarma / sermecoop → sin campo               0 %
 *
 * Consecuencias que reportó QA, ahora explicadas:
 *   - "Muxol Jarabe adulto…" mostraba **EUROLAB** bajo la etiqueta "Marca":
 *     EUROLAB es el FABRICANTE; la marca es Muxol. Igual con ABBOTT/"Broncot".
 *   - "Tocalm Adulto…", "Pazbronq…", "Amrodil…" mostraban "Marca no
 *     identificada" porque vienen de farmacias que no exponen NINGÚN campo, aun
 *     cuando la marca está escrita en el propio nombre del producto.
 *   - Salcobrand aportaba una MARCA real a un campo que el resto llena con
 *     FABRICANTE, y la UI llamaba a las dos cosas igual.
 *
 * QUÉ HACE Y QUÉ NO HACE
 * ----------------------
 *   - NO inventa fabricante ni marca a partir del nombre del producto cuando no
 *     hay evidencia: devuelve `null`. Un genérico legítimamente no tiene marca.
 *   - NO toca `matchKey` ni `presentationKey`. Ver la nota de estabilidad de
 *     identidad en `pricing.ts::toMedicationResult()`: `resolveCommercialIdentity`
 *     sigue recibiendo exactamente el mismo valor que recibía antes, así que ni
 *     la deduplicación ni los slugs de ficha de Web rotan por este cambio.
 *   - SÍ deriva la marca del NOMBRE, pero solo con corroboración medible (ver
 *     `brandFromName`), nunca por listas de marcas ni de productos.
 */

import { normalizeBrandToken, isPlausibleCommercialIdentity } from "./commercialIdentity.js";
import {
  SALT_QUALIFIER_WORDS,
  brandHeadTokens,
  combinationKey,
  normalizedWords,
} from "./matching.js";

// ---------------------------------------------------------------------------
// A. VOCABULARIO DE COMPOSICIÓN — artefacto DERIVADO, no escrito a mano.
// ---------------------------------------------------------------------------

/**
 * Tokens de composición (principios activos y sus sales/ésteres) DERIVADOS
 * algorítmicamente del catálogo real por `scripts-audit/derive-inn.mjs`, sobre
 * 3.697 ofertas de 29 búsquedas en las 9 farmacias (2026-08-31).
 *
 * Regla de derivación (íntegra en el encabezado de ese script; evidencia por
 * token, con conteos, en docs/qa/cf-data-001/active-ingredient-vocabulary.csv):
 * un token entra si aparece en el segmento descriptivo del nombre, no es la
 * cabecera de marca, ANTECEDE INMEDIATAMENTE a una magnitud de dosis, acompaña
 * a >= 2 cabeceras de marca distintas en >= 2 farmacias distintas, y no aparece
 * en el campo estructurado de fabricante de ninguna farmacia.
 *
 * POR QUÉ ESTO NO ES UNA "LISTA HARDCODEADA DE MARCAS/PRODUCTOS":
 *   1. Es un vocabulario de MOLÉCULAS, no de productos ni de marcas. Las
 *      moléculas son un conjunto cerrado y de crecimiento lento; las marcas son
 *      abiertas e ilimitadas — por eso el algoritmo reconoce marcas por
 *      ESTRUCTURA (`brandFromName`) y moléculas por VOCABULARIO, nunca al revés.
 *   2. Cada entrada salió de una medición reproducible, no de criterio humano.
 *      El script es parte del repositorio: regenerarlo con un corpus más amplio
 *      amplía la cobertura sin tocar el algoritmo.
 *   3. Es el mismo criterio ya establecido por `KNOWN_ACTIVE_INGREDIENTS`
 *      (commercialIdentity.ts) y `COMPOSITION_TOKENS` (productIdentity.ts) —
 *      este módulo lo sustituye por una versión derivada y medida, en vez de
 *      enumerada a mano.
 *
 * LIMITACIÓN CONOCIDA Y ACEPTADA: 34 tokens cubren las moléculas del corpus
 * auditado, no la farmacopea completa. Una molécula ausente del vocabulario
 * produce `brand: null` (falso negativo conservador), NUNCA una marca
 * inventada. Ampliarlo es un FOLLOW_UP explícito del ticket.
 */
export const COMPOSITION_VOCABULARY: ReadonlySet<string> = new Set([
  "paracetamol", "ibuprofeno", "metformina", "salbutamol", "amoxicilina",
  "betametasona", "cetirizina", "diclofenaco", "losartan", "melatonina",
  "sertralina", "ambroxol", "atorvastatina", "clonazepam", "calcio",
  "ciprofloxacino", "clotrimazol", "diclorhidrato", "levotiroxina",
  "loratadina", "prednisona", "acetilsalicilico", "azitromicina",
  "dexametasona", "enalapril", "levocetirizina", "naproxeno",
  "clavulanico", "colestiramina", "desloratadina", "fluconazol",
  "hidroclorotiazida", "pseudoefedrina", "sodio",
]);

// ---------------------------------------------------------------------------
// B. LIMPIEZA DE TEXTO DE PRESENTACIÓN
// ---------------------------------------------------------------------------

/**
 * Caracteres invisibles que corrompen los valores estructurados reales:
 * Salcobrand entrega `hit.brand` con SOFT HYPHEN (U+00AD) incrustado
 * ("Tapsi­n", 3 ofertas en la muestra de producción), que se renderiza
 * como "Tapsi­n" o directamente parte la palabra según la fuente tipográfica.
 * También se limpian los espacios de ancho cero y el BOM, de la misma familia.
 *
 * No altera `presentationKey`: `normalizeBrandToken()` ya descarta todo lo que
 * no sea `[a-z0-9]`, así que estos caracteres nunca formaron parte de la clave.
 * La limpieza es exclusivamente para el texto que se MUESTRA.
 */
const INVISIBLE_CHARS = /[\u00AD\u200B-\u200D\uFEFF]/g;

/** Texto de presentación normalizado, o `null` si no queda nada. */
function cleanDisplayText(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const cleaned = raw.replace(INVISIBLE_CHARS, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Los catálogos entregan el mismo dato en mayúsculas sostenidas (Dr. Simi:
 * "MAVER", "ANDRÓMACO"; Farmex: "EUROLAB", "MINTLAB") o en capitalización
 * normal (AraucoMed: "Ascend", "Seven Pharma"). Mostrarlos tal cual mezcla
 * "EUROLAB" con "Seven Pharma" en la misma columna.
 *
 * Se capitaliza SOLO cuando el valor no tiene ninguna minúscula (es decir, es
 * un grito del catálogo). Un valor con capitalización propia —incluidas siglas
 * intencionales dentro de un nombre mixto— se respeta sin tocar.
 */
function toDisplayCase(text: string): string {
  if (/[a-záéíóúñü]/.test(text)) return text;
  return text
    .toLowerCase()
    .replace(/(^|[\s\-/.])([\p{L}])/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * Valida un valor estructurado con EXACTAMENTE las mismas reglas de
 * plausibilidad que ya gobiernan `presentationKey` (commercialIdentity.ts):
 * rechaza formas farmacéuticas, tokens de cantidad, "oraciones" coladas en el
 * campo y run-ons de composición. Se reutiliza a propósito en vez de escribir
 * un validador paralelo: si las dos capas divergieran, la UI podría mostrar
 * como marca algo que la identidad ya descartó como basura.
 */
function plausibleStructured(raw: string | null | undefined): string | null {
  const cleaned = cleanDisplayText(raw);
  if (!cleaned) return null;
  const token = normalizeBrandToken(cleaned);
  if (!token) return null;
  if (!isPlausibleCommercialIdentity(token, { rawText: cleaned })) return null;
  return toDisplayCase(cleaned);
}

// ---------------------------------------------------------------------------
// C. LECTURA DEL NOMBRE — límite de atributos y forma de token de composición
// ---------------------------------------------------------------------------

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

/**
 * `true` si en esta posición el nombre deja de describir al producto comercial
 * y empieza a describir sus atributos numéricos (dosis o cantidad).
 *
 * Misma regla —y mismo motivo— que `isAttributeBoundary` en productIdentity.ts
 * y que la restricción "solo el encabezado, antes del primer dígito" de
 * `combinationKey` en matching.ts: el nombre del LABORATORIO va SIEMPRE después
 * de la dosis y la cantidad ("… x 30 comprimidos (Ascend)", "… 100ml SEVEN
 * PHARMA"), mientras que la molécula va delante, pegada a la marca. Sin este
 * corte, la derivación producía "Ambroxol … 100 ml **Opko**" → marca=ambroxol,
 * principio activo=opko: exactamente al revés.
 *
 * Se mantiene una copia local en vez de importarla de productIdentity.ts para
 * no invertir la dirección de dependencia (ese módulo consume identidad
 * comercial, no al revés) y, sobre todo, para que un ajuste futuro de esta capa
 * NO pueda mover el corte de `commercialVariantKey()`, del que depende el
 * segmento `|var:` de `presentationKey` y, con él, los slugs de ficha de Web.
 */
function isAttributeBoundary(tokens: string[], index: number): boolean {
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

/**
 * Palabras del nombre con la MISMA segmentación que `normalizedWords()` pero
 * conservando la capitalización original, para poder devolver la marca tal como
 * la escribe la farmacia ("Tocalm") en vez del token normalizado ("tocalm").
 *
 * Se aplican exactamente las mismas operaciones y en el mismo orden que
 * `normalizedWords`, salvo el `toLowerCase()`. Los acentos SÍ se quitan, igual
 * que allá: es obligatorio para que los índices de ambos arrays coincidan (en
 * JavaScript `\w` no matchea caracteres acentuados, así que conservarlos
 * partiría los tokens de otra manera y la alineación por índice dejaría de ser
 * válida). Consecuencia aceptada y menor: una marca acentuada se muestra sin
 * tilde cuando se deriva del nombre — no cuando viene de un campo estructurado,
 * que se muestra literal.
 */
function surfaceWords(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\w)-(\w)/g, "$1$2")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

/** Longitud mínima para tratar un token como nombre de composición. */
const COMPOSITION_MIN_LENGTH = 4;

/**
 * Forma de token de composición: palabra puramente alfabética, suficientemente
 * larga y que no sea una sal o calificador químico. La pertenencia REAL al
 * vocabulario se verifica aparte — esto es solo el filtro de forma.
 */
function isCompositionShaped(token: string | undefined): token is string {
  return (
    token !== undefined &&
    token.length >= COMPOSITION_MIN_LENGTH &&
    /^[a-z]+$/.test(token) &&
    !SALT_QUALIFIER_WORDS.has(token)
  );
}

// ---------------------------------------------------------------------------
// D. MARCA Y PRINCIPIO ACTIVO DERIVADOS DEL NOMBRE
// ---------------------------------------------------------------------------

export interface NameDerivedIdentity {
  /** Marca comercial tal como la escribe la farmacia, o `null` si no hay evidencia. */
  brand: string | null;
  /** Token de composición reconocido en el nombre, o `null`. */
  activeIngredient: string | null;
}

/**
 * Deriva marca y principio activo del NOMBRE del producto, con corroboración
 * medible y en la dirección conservadora del proyecto.
 *
 * REGLA (dos guardias simétricas, ambas obligatorias):
 *
 *   G1 — Si la CABECERA del nombre (`brandHeadTokens`, el mismo token que
 *        `matchKey` usa como cabecera) ES un token de composición conocido, el
 *        producto es un genérico presentado por su molécula: `brand = null` y
 *        `activeIngredient =` esa cabecera. Nunca se promueve un principio
 *        activo a marca. Cubre "Paracetamol 500 mg 16 comprimidos",
 *        "Diclofenaco Dietilamina 1,16 % gel", "Cetirizina Diclorhidrato 10 mg"
 *        y "Ibuprofeno **Actron** 200 mg" (donde el orden viene invertido).
 *
 *   G2 — Si la cabecera NO es composición, se busca un token de composición
 *        CONOCIDO más adelante, dentro del segmento descriptivo (antes del
 *        límite de atributos). Solo si aparece se concluye que la cabecera es
 *        una MARCA: el nombre declara "<marca> <molécula>", que es la firma
 *        tipográfica de un producto de marca en estos catálogos.
 *
 *   Si ninguna guardia produce evidencia ⇒ `{ brand: null, activeIngredient:
 *   null }`. "Amrodil 30 Mg/5ml 100 Ml" (EasyFarma) es ese caso: el nombre no
 *   nombra la molécula, así que no se puede DEMOSTRAR que "Amrodil" sea una
 *   marca y no un genérico de nombre inusual. Se prefiere el falso negativo.
 *
 * Las COMBINACIONES se excluyen de entrada: en ellas los tokens que siguen a la
 * cabecera son los otros principios activos, no un marcador de marca, y G2
 * concluiría que "Losartán Potásico + Hidroclorotiazida" tiene marca
 * "Losartán". `combinationKey()` (matching.ts) ya identifica ese caso.
 *
 * MEDICIÓN (3.697 ofertas reales, 29 búsquedas, docs/qa/cf-data-001/):
 * la versión SIN estas dos guardias derivaba marca en el 40,0 % de las ofertas
 * pero con un 5,7 % de marcas que eran en realidad el principio activo
 * (`diclofenaco`, `paracetamol`, `cetirizina`, `ibuprofeno`, `tramadol`,
 * `losartan`, `levocetirizina`…). Con las dos guardias: 0 marcas-que-son-INN
 * observadas, a cambio de bajar la cobertura a ~31 %. La política del proyecto
 * —preferir el falso negativo— hace que ese intercambio sea el correcto.
 */
export function brandFromName(name: string): NameDerivedIdentity {
  if (combinationKey(name) !== null) return { brand: null, activeIngredient: null };

  const tokens = normalizedWords(name);
  const surface = surfaceWords(name);
  const head = brandHeadTokens(tokens);
  if (head.length === 0) return { brand: null, activeIngredient: null };

  // G1 — la cabecera es la molécula: genérico, sin marca.
  const headToken = head.join("");
  if (COMPOSITION_VOCABULARY.has(headToken)) {
    return { brand: null, activeIngredient: headToken };
  }

  // G2 — buscar corroboración de composición en el segmento descriptivo.
  let headIndex = 0;
  let headEnd = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (isAttributeBoundary(tokens, i)) break;

    if (headIndex < head.length) {
      if (token === head[headIndex]) {
        headIndex++;
        headEnd = i;
      }
      continue;
    }

    if (!isCompositionShaped(token)) continue;
    if (!COMPOSITION_VOCABULARY.has(token)) continue;

    const brand = surface.slice(headEnd - head.length + 1, headEnd + 1).join(" ");
    return { brand: brand.length > 0 ? brand : null, activeIngredient: token };
  }

  return { brand: null, activeIngredient: null };
}

// ---------------------------------------------------------------------------
// E. RESOLUCIÓN COMPLETA
// ---------------------------------------------------------------------------

/** De dónde salió la marca publicada. */
export type BrandSource = "structured" | "name" | "unknown";

export interface BrandIdentityInput {
  /** Nombre crudo del producto, tal como lo entrega la farmacia. */
  name: string;
  /**
   * Campo estructurado que la farmacia declara como MARCA COMERCIAL. Hoy solo
   * Salcobrand (`hit.brand` de Algolia) — ver la matriz del encabezado.
   */
  structuredBrand?: string | null;
  /**
   * Campo estructurado que la farmacia declara como LABORATORIO/FABRICANTE:
   * Dr. Simi `product.brand`, AraucoMed `manufacturer_name`, Farmex `vendor`.
   * El nombre del campo en el origen NO determina su semántica — `brand` en
   * VTEX (Dr. Simi) es el fabricante; se clasifica por lo que se MIDIÓ que
   * contiene, no por cómo se llama.
   */
  structuredManufacturer?: string | null;
}

export interface BrandIdentityResult {
  /** Marca comercial, o `null`. Un genérico legítimamente no tiene marca. */
  brand: string | null;
  brandSource: BrandSource;
  /** Laboratorio/fabricante, o `null`. NUNCA se deriva del nombre. */
  manufacturer: string | null;
  /** Principio activo reconocido, o `null`. */
  activeIngredient: string | null;
}

/**
 * Resuelve la identidad comercial completa de UNA oferta.
 *
 * ORDEN DE EVIDENCIA PARA LA MARCA:
 *   1. Campo estructurado de marca de la farmacia — la fuente más fuerte. Se
 *      valida con las mismas reglas de plausibilidad de `presentationKey`, y
 *      además se DESCARTA si su token normalizado es un principio activo
 *      conocido. Esa segunda condición no es teórica: Salcobrand publica
 *      `brand: "Ambroxol"` y `brand: "diclofenaco"` para sus genéricos (medido
 *      en producción), y aceptarlo sería exactamente el defecto que el ticket
 *      prohíbe — llamar "Marca" a un principio activo.
 *   2. Derivación desde el nombre (`brandFromName`), con sus dos guardias.
 *   3. `null`.
 *
 * EL FABRICANTE NUNCA SE INFIERE. Solo se publica si la farmacia lo entrega en
 * un campo estructurado. Es la regla dura del ticket: derivar un laboratorio de
 * texto libre produciría afirmaciones falsas sobre quién fabrica un
 * medicamento.
 */
export function resolveBrandIdentity(input: BrandIdentityInput): BrandIdentityResult {
  const manufacturer = plausibleStructured(input.structuredManufacturer);
  const derived = brandFromName(input.name);

  const structuredBrand = plausibleStructured(input.structuredBrand);
  if (structuredBrand) {
    const token = normalizeBrandToken(structuredBrand);
    if (token && !COMPOSITION_VOCABULARY.has(token)) {
      return {
        brand: structuredBrand,
        brandSource: "structured",
        manufacturer,
        activeIngredient: derived.activeIngredient,
      };
    }
  }

  if (derived.brand) {
    return {
      brand: derived.brand,
      brandSource: "name",
      manufacturer,
      activeIngredient: derived.activeIngredient,
    };
  }

  return {
    brand: null,
    brandSource: "unknown",
    manufacturer,
    activeIngredient: derived.activeIngredient,
  };
}
