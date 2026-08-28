/**
 * CF-SEARCH-001 — Product Identity: variante comercial y forma farmacéutica.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * `matchKey()` (matching.ts) conserva UN solo token de nombre: la cabecera de
 * marca/principio activo. Todo lo que viene después —el calificador que
 * distingue una variante comercial de otra dentro de la MISMA familia de
 * marca— se descarta. Con `presentationKey = matchKey + bio + brand`, dos
 * variantes distintas del mismo fabricante colapsan en una sola tarjeta,
 * porque el eje `brand:` no discrimina dentro de un mismo laboratorio.
 *
 * Evidencia de producción (`GET /api/search?q=tapsin`, read-only, 2026-08-27),
 * todas con `matchKey` y laboratorio idénticos:
 *   tapsin|n|6|bio:false|brand:unknown
 *     ecofarmacias "Tapsin X 6 comprimidos Noche (Maver)"        $  460
 *     ahumada      "Tapsin Instaflu Día Noche 6 Comprimidos"     $4.139
 *   tapsin|12|bio:false|brand:unknown
 *     ecofarmacias "Tapsin X 12 comprimidos (Maver)"             $1.290
 *     ahumada      "Tapsin Periodo x 12 Comprimidos"             $2.149
 *     cruz-verde   "Tapsin Duo Paracetamol Ibuprofeno 12 Comp."  $2.290
 *   tapsin|30|bio:false|brand:maver
 *     araucomed    "Tapsin Forte x 30 comprimidos"               $2.990
 *     farmex       "Tapsin Migraña x 30 comprimidos"             $4.990
 * Cada grupo es UNA tarjeta que muestra un "ahorro" entre medicamentos
 * distintos. El caso del ticket ("Tapsin x 6 Comprimidos" vs "Tapsin Rojo
 * Dolor de Cabeza tira x 6") es la misma clase de defecto.
 *
 * POR QUÉ NO SE ARREGLA EN `matchKey`
 * -----------------------------------
 * Su valor está persistido en `price_history`, `medication_match_key_aliases`,
 * `pharmacy_clicks` y `email_alerts`. Cambiarlo invalida los históricos. Se
 * repite el patrón ya usado por S-1 (`combinationKey`): atributos NUEVOS que
 * se agregan como segmentos al final de `presentationKey`, que no persiste en
 * ninguna tabla.
 *
 * SEPARACIÓN DE CAPAS (explícita, pedida por el ticket)
 * -----------------------------------------------------
 *   1. Normalización textual  → matching.ts::normalizedWords()
 *   2. Extracción de atributos→ ESTE módulo (variante, forma) + matching.ts
 *                               (dosis/cantidad/turno/combinación) +
 *                               commercialIdentity.ts (marca)
 *   3. Identidad              → buildProductIdentity() / presentationKey()
 *   4. Similaridad            → matchKey (candidatos "farmacológicamente
 *                               parecidos"), sin cambios
 *   5. Deduplicación          → deduplication.ts, que además VALIDA
 *                               compatibilidad con isSameProduct() antes de
 *                               fusionar
 *
 * POLÍTICA (no negociable, heredada de commercialIdentity.ts): ante duda
 * razonable NO se fusiona. Un duplicado visual es menos grave que mezclar
 * precios de dos medicamentos distintos.
 */

import {
  PRESENTATION_FORM_WORDS,
  SALT_QUALIFIER_WORDS,
  STOP_WORDS,
  brandHeadTokens,
  combinationKey,
  normalizedWords,
} from "./matching.js";
import { KNOWN_ACTIVE_INGREDIENTS } from "./commercialIdentity.js";

/**
 * Los paréntesis y corchetes de estos catálogos contienen anotación de
 * laboratorio o de estado del envase, nunca el nombre comercial: "(Maver)",
 * "(Ascend)", "(LCH)", "(Curae Spring)", "(B)", "(ai)", "[LABORATORIO]".
 * Se descartan antes de buscar la variante para que el laboratorio no se
 * confunda con un calificador — sin esto, EcoFarmacias derivaba `var:maver`
 * en "Tapsin Sobre Dia (Maver)" y dejaba de agrupar con las farmacias que no
 * escriben el laboratorio.
 *
 * Es la misma regla que `cleanQuery()` (normalization.ts) ya aplica al texto
 * de búsqueda por el mismo motivo.
 */
function withoutAnnotations(name: string): string {
  return name.replace(/\([^)]*\)?/g, " ").replace(/\[[^\]]*\]?/g, " ");
}

// ---------------------------------------------------------------------------
// A. VARIANTE COMERCIAL
// ---------------------------------------------------------------------------

/**
 * Palabras que `STOP_WORDS` descarta pero que SÍ identifican una variante
 * comercial distinta ("Tapsin **Forte**", "Paracetamol **Infantil**", "Tapsin
 * Día y Noche **Plus**"). `STOP_WORDS` no puede corregirse —alimenta a
 * `matchKey`, cuyo valor está persistido— así que se re-habilitan acá, solo
 * para la capa de variante.
 *
 * `dia`/`noche` NO se re-habilitan: `matchKey` ya los captura en su segmento
 * de turno (`|d|`/`|n|`), y duplicarlos acá los contaría dos veces.
 */
const VARIANT_QUALIFIER_WORDS = new Set([
  "forte", "plus", "infantil", "pediatrico", "nino",
]);

/**
 * `adulto`/`adultos` NO se re-habilitan aunque sean, en apariencia, el par
 * simétrico de `infantil`. En los datos reales es una etiqueta redundante que
 * unas farmacias escriben y otras no sobre el MISMO artículo, y la
 * concentración ya separa la presentación adulta de la infantil. Producción
 * 2026-08-27, query "aspirina", `aspirina|500mg|40`:
 *   ecofarmacias "Aspirina 500 mg **Adulto** x 40 Comprimidos"   $1.000
 *   farmex       "Aspirina 500 mg x 40 comprimidos"              $2.970
 *   cruz-verde   "Aspirina **Adulto** Ácido Acetilsalicílico..." $4.505
 * Tratarla como variante partía en dos un grupo correcto de 6 farmacias.
 */

/**
 * Principios activos (INN) y descriptores de composición que aparecen DESPUÉS
 * del nombre de marca en los títulos reales ("Glucophage **Metformina** 500
 * mg", "Aspirina **ácido acetilsalicílico** 500 mg", "Actron **(ibuprofeno)**
 * 200mg"). No son calificadores comerciales: son la composición, y la escriben
 * unas farmacias y otras no.
 *
 * Lista propia de esta capa —superset de `KNOWN_ACTIVE_INGREDIENTS` de
 * commercialIdentity.ts— para no cambiar el comportamiento de
 * `isPlausibleCommercialIdentity`, que usa aquella con otro propósito
 * (rechazar un principio activo como MARCA) y cuyo alcance es otra fase.
 * Mismo criterio de siempre: cada entrada se observó en las 9 búsquedas de
 * producción del 2026-08-27, no es un intento de enumerar la farmacopea.
 */
const COMPOSITION_TOKENS = new Set([
  ...KNOWN_ACTIVE_INGREDIENTS,
  "acido", "acetilsalicilico", "salicilico", "clavulanico", "clavulanato",
  "metformina", "hidroclorotiazida", "pseudoefedrina", "clorfenamina",
  "salbutamol", "cafeina", "naproxeno", "ketoprofeno", "diclofenaco",
  "cetirizina", "loratadina", "enalapril", "atorvastatina", "sertralina",
]);

/**
 * Variantes de escritura REALES del mismo calificador comercial, observadas en
 * producción (query "tapsin", 2026-08-27): AraucoMed escribe "Tapsin **Niños**
 * 160 mg x 16 comprimidos", Dr. Simi escribe "Tapsin **infantil** paracetamol
 * 160 mg 16 comprimidos masticables". Es el mismo producto y debe seguir
 * agrupando.
 *
 * Misma política que `KNOWN_BRAND_ALIASES` en commercialIdentity.ts: alias
 * explícitos y auditables, cada uno respaldado por datos reales — nunca una
 * heurística fonética o de distancia de edición, que podría unir variantes
 * genuinamente distintas.
 */
const VARIANT_ALIASES: Record<string, string> = {
  ninos: "infantil",
  nino: "infantil",
  ninas: "infantil",
  nina: "infantil",
  pediatrico: "infantil",
  pediatrica: "infantil",
  // "inf." es la abreviatura estándar de "infantil" en estos catálogos — ya
  // reconocida como tal por `GENERIC_WORDS` en normalization.ts. Observado en
  // EasyFarma: "Paracetamol inf. suposit. x 6" es el mismo artículo que
  // "Paracetamol Infantil x 6 supositorios" de EcoFarmacias.
  inf: "infantil",
};

/**
 * Abreviaturas y palabras de presentación/estado comercial que ni
 * `STOP_WORDS` ni `PRESENTATION_FORM_WORDS` cubren, observadas como falsos
 * calificadores en la simulación sobre datos de producción (9 búsquedas,
 * 2026-08-27):
 *   "Amoval 1 **gramo** x 14 comprimidos"        → var:gramo
 *   "Paracetamol inf. **suposit.** x 6"          → var:suposit
 *   "... 10 **Cap** Blandas"                     → var:cap
 *   "... x 30 comprimidos **DESCUENTO**"         → var:descuento
 * Ninguna identifica un producto distinto.
 */
const EXTRA_VARIANT_NOISE = new Set([
  // unidades escritas en palabras
  "gramo", "gramos", "miligramo", "miligramos", "mililitro", "mililitros", "litro", "litros",
  // abreviaturas de forma farmacéutica
  "comps", "caps", "cap", "cps", "tabs", "susp", "sus", "suposit", "jbe", "gts",
  "adultos", "ec",
  "iny", "crm", "pom", "ung", "oft", "otic", "ovul", "liq", "amp",
  // adjetivos de presentación que no cambian el artículo
  "blanda", "blandas", "blando", "blandos", "recubiertos", "recubiertas",
  "entericos", "entericas", "enterico", "enterica",
  // estado/condición comercial de la oferta (misma categoría que
  // NOISE_PHRASES en commercialIdentity.ts)
  "descuento", "danada", "danado", "manchada", "golpeada", "arrugada",
  "cenabast", "ley", "generico", "genericos", "generica", "genericas",
  "laboratorio", "laboratorios", "lab", "labs",
]);

/**
 * Letras sueltas que en español son conjunción/preposición o abreviatura de
 * unidad, nunca un calificador comercial. Se permite el resto de los tokens de
 * UNA letra porque sí lo son en datos reales: "Tapsin **M**" (migraña) es una
 * variante distinta de "Tapsin" a secas, y descartarla partiría en dos
 * "Tapsin M Migraña por 10 comprimidos" (EcoFarmacias) y "Tapsin M x 10
 * Comprimidos Recubiertos" (Ahumada), que hoy agrupan correctamente.
 */
const NON_VARIANT_SINGLE_LETTERS = new Set(["a", "e", "i", "o", "u", "y", "l"]);

/** Unidades de dosis: marcan el fin del nombre comercial y el inicio de los atributos. */
const DOSE_UNITS = new Set(["mg", "ml", "mcg", "ug", "g", "gr", "ui", "iu", "kg", "l"]);

/** Sustantivos de cantidad: `<n> comprimidos`, `<n> sobres`, ... */
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
 * `true` si el token marca el punto donde el nombre deja de describir al
 * producto comercial y pasa a describir sus atributos numéricos (dosis o
 * cantidad). A partir de ahí no se busca más variante.
 *
 * Es la restricción que evita el falso positivo que ya costó una regresión en
 * S-1 (ver `combinationKey` en matching.ts): sin cortar, el nombre del
 * laboratorio al final del título se convierte en "variante". Caso real de
 * Ahumada: "Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral
 * FAES FARMA CHILE" derivaría `var:faes`, y la misma presentación listada por
 * otra farmacia sin ese sufijo derivaría `var:` vacío — dos tarjetas para un
 * mismo producto.
 *
 * Un número SUELTO (sin unidad y sin sustantivo de cantidad detrás) NO corta:
 * "Tapsin **1000** SC 1 g x 20 comprimidos" lleva el calificador comercial
 * ("SC") después de un número, y cortar ahí lo perdería.
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

function isVariantNoise(token: string): boolean {
  if (VARIANT_QUALIFIER_WORDS.has(token)) return false;
  return (
    STOP_WORDS.has(token) ||
    PRESENTATION_FORM_WORDS.has(token) ||
    SALT_QUALIFIER_WORDS.has(token) ||
    COMPOSITION_TOKENS.has(token) ||
    EXTRA_VARIANT_NOISE.has(token) ||
    (token.length === 1 && NON_VARIANT_SINGLE_LETTERS.has(token))
  );
}

/**
 * Calificador comercial que distingue una variante de otra dentro de la misma
 * familia de marca, o `null` si el nombre no declara ninguno.
 *
 * Se devuelve UN token —el primero significativo después de la cabecera de
 * marca— y no el conjunto completo de palabras del nombre. Es una decisión
 * deliberada:
 *
 *   - Cada farmacia escribe una cola distinta para el MISMO producto ("Tapsin
 *     Caliente Noche - Sabor Limón - Sobre de 5 g" en Farmex vs "Tapsin
 *     caliente compuesto noche polvo para solución oral 5 g" en Dr. Simi).
 *     Exigir el conjunto completo partiría productos idénticos; el primer
 *     calificador ("caliente") es el que ambas comparten.
 *   - Un token es suficiente para separar los falsos merges observados:
 *     rojo / instaflu / periodo / duo / forte / migraña / m son todos el
 *     PRIMER token después de "tapsin".
 *
 * Ausencia de calificador (`null`) NO se trata como "compatible con
 * cualquiera": una oferta sin variante nunca agrupa con una que sí la declara
 * (ver `isSameProduct`). Es la misma política conservadora que
 * `brand:unknown` en commercialIdentity.ts, y es exactamente lo que separa
 * "Tapsin X 6 Comprimidos" (sin variante) de "Tapsin Rojo Dolor de Cabeza
 * Tira x 6 comprimidos" (`var:rojo`).
 */
export function commercialVariantKey(name: string): string | null {
  // En una COMBINACIÓN, las palabras que siguen a la cabecera de marca son los
  // demás principios activos, no un calificador comercial ("Amoxicilina /
  // Ácido Clavulánico 250/62,5", "Losartan/Hidroclorotiazida 50 mg/12.5 mg").
  // Leerlas como variante partía en dos tarjetas la misma combinación según si
  // la farmacia nombraba o no el segundo principio activo antes de la dosis.
  // La separación de las combinaciones ya la hace `combo:` (S-1).
  if (combinationKey(name) !== null) return null;

  const tokens = normalizedWords(withoutAnnotations(name));
  const head = brandHeadTokens(tokens);

  // La cabecera se descuenta por VALOR, no contando "candidatos a variante".
  // Contarlos fallaba cuando la propia cabecera es un principio activo
  // conocido —y por lo tanto ruido para esta capa—: en "Paracetamol inf.
  // suposit. x 6", "paracetamol" no contaba como candidato y el cupo de
  // cabecera se lo comía "inf", perdiendo el calificador `infantil`.
  let headIndex = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (isAttributeBoundary(tokens, i)) return null;

    if (headIndex < head.length && token === head[headIndex]) {
      headIndex++;
      continue;
    }
    if (!/^[a-z]+$/.test(token) || isVariantNoise(token)) continue;

    return VARIANT_ALIASES[token] ?? token;
  }

  return null;
}

// ---------------------------------------------------------------------------
// B. FORMA FARMACÉUTICA
// ---------------------------------------------------------------------------

/**
 * Clases GRUESAS de forma farmacéutica. Deliberadamente coarse: solo separa
 * presentaciones que no pueden ser el mismo artículo (un comprimido no es un
 * sobre de polvo, un jarabe no es una crema). NO distingue submodificadores
 * dentro de una misma clase ("recubierto", "masticable", "dispersable",
 * "efervescente"), porque cada farmacia los escribe o los omite a discreción y
 * usarlos partiría productos idénticos — la regresión que S-1 documentó con
 * "Hyzaar ... Comprimidos Recubiertos".
 */
export type DosageFormClass =
  | "solid-oral"
  | "fluid-oral"
  | "topical"
  | "injectable"
  | "inhaled"
  | "ophthalmic"
  | "suppository"
  | "patch";

/**
 * Orden de evaluación: gana la PRIMERA clase que aparece en el nombre.
 *
 * Dos decisiones que salieron de la simulación sobre datos de producción
 * (9 búsquedas, 2026-08-27) y no de la teoría:
 *
 *   1. `solid-oral` se evalúa ANTES que `fluid-oral`: el envase manda sobre
 *      su contenido. "Omeprazol 20 mg x 30 **cápsulas** con **gránulos** con
 *      recubrimiento entérico" (Farmex) es una cápsula, no un polvo, y con el
 *      orden inverso dejaba de agrupar con "Omeprazol 20 mg x 30 cápsulas" de
 *      AraucoMed — falso split introducido por el propio eje.
 *   2. Polvos, jarabes, suspensiones, soluciones y gotas orales comparten UNA
 *      clase (`fluid-oral`). Un "polvo para suspensión oral" y una
 *      "suspensión" son el MISMO artículo descrito desde distinto ángulo —
 *      Dr. Simi escribe "Amoxicilina 500 mg/5 mL polvo para suspensión oral
 *      60 mL" donde Salcobrand escribe "Amoxicilina 250mg/5ml Jarabe 60ml".
 *      Separarlos era un falso split; separarlos de `solid-oral` (comprimidos
 *      vs sobres de Tapsin 1 g) es el split correcto que este eje aporta.
 */
const DOSAGE_FORM_RULES: Array<[DosageFormClass, Set<string>]> = [
  ["patch", new Set(["parche", "parches"])],
  ["suppository", new Set(["supositorio", "supositorios", "suposit", "ovulo", "ovulos", "ovul"])],
  ["injectable", new Set(["inyectable", "inyectables", "iny", "ampolla", "ampollas", "ampolleta", "ampolletas", "vial", "viales", "jeringa", "jeringas"])],
  ["inhaled", new Set(["inhalador", "inhaladores", "inh", "aerosol", "inhalacion", "inhalaciones", "puff", "puffs", "nebulizacion"])],
  ["ophthalmic", new Set(["colirio", "oftalmico", "oftalmica", "oft", "otico", "otica"])],
  ["topical", new Set(["crema", "cremas", "crm", "pomada", "pom", "unguento", "ung", "locion", "gel", "shampoo", "champu"])],
  ["solid-oral", new Set([
    "comprimido", "comprimidos", "comp", "comps",
    "capsula", "capsulas", "cap", "caps", "cps",
    "tableta", "tabletas", "tab", "tabs",
    "gragea", "grageas", "pastilla", "pastillas", "perla", "perlas",
  ])],
  ["fluid-oral", new Set([
    "jarabe", "jbe", "suspension", "suspensiones", "susp", "sus",
    "solucion", "soluciones", "sol", "elixir", "emulsion", "liq",
    "gota", "gotas", "gts",
    "polvo", "polvos", "sobre", "sobres", "sachet", "sachets",
    "granulado", "granulados", "granulo", "granulos",
  ])],
];

/**
 * Clase de forma farmacéutica declarada en el nombre, o `null` si el nombre no
 * la declara.
 *
 * `null` NO significa "incompatible" para `isSameProduct`: una oferta que no
 * declara forma es compatible con cualquiera. Omitir la forma es frecuente y
 * no afirma nada ("Tapsin Forte x 20" es el mismo artículo que "Tapsin Forte
 * x 20 comprimidos"); declarar una forma distinta sí.
 *
 * Advertencia sobre `presentationKey`: la clave SÍ incluye el segmento
 * `|form:` solo cuando la clase es conocida, así que una oferta con nombre
 * truncado por la farmacia (patrón documentado de EasyFarma, ej. "Omeprazol
 * 20 mg x 60...") queda en un grupo propio. Es una limitación aceptada de esta
 * fase: la alternativa —agrupar por clave sin forma y partir después— produce
 * dos tarjetas con la MISMA `presentationKey`, que en Web resuelven a un slug
 * ambiguo. Ver `docs/technology/domain/PRODUCT_IDENTITY.md`.
 */
export function dosageFormClass(name: string): DosageFormClass | null {
  const tokens = normalizedWords(withoutAnnotations(name));
  const tokenSet = new Set(tokens);
  for (const [formClass, words] of DOSAGE_FORM_RULES) {
    for (const word of words) {
      if (tokenSet.has(word)) return formClass;
    }
  }
  // Cantidad y forma pegadas en un solo token, sin espacio: AraucoMed escribe
  // "Aspirina Forte 650mg **x80com**." y Ahumada "Aspirina 500 Mg Caja
  // **100comp**". Sin este reconocimiento quedaban con forma desconocida y se
  // separaban de la misma presentación listada por otra farmacia.
  if (tokens.some((token) => GLUED_SOLID_COUNT_TOKEN.test(token))) return "solid-oral";
  return null;
}

const GLUED_SOLID_COUNT_TOKEN = /^x?\d+(com|comp|comps|cap|caps|cps|tab|tabs)$/;

// ---------------------------------------------------------------------------
// C. IDENTIDAD DE PRODUCTO Y COMPATIBILIDAD
// ---------------------------------------------------------------------------

/**
 * Atributos de identidad de UNA oferta, ya extraídos y normalizados. Todos los
 * campos derivados del nombre pueden ser `null`: el algoritmo trabaja con
 * información incompleta por diseño, porque las 9 farmacias describen el mismo
 * artículo con nombres de calidad muy desigual.
 *
 * No reemplaza a `matchKey` ni a `MedicationResult`: es la estructura interna
 * de la que se DERIVA `presentationKey`, expuesta para poder testear y auditar
 * cada eje por separado en vez de razonar sobre una cadena concatenada.
 */
export interface ProductIdentity {
  /** Cabecera farmacológica: `matchKey` completo (marca/principio + dosis + turno + cantidad). */
  pharmacologicalKey: string;
  /** `"true"` | `"false"` | `"unknown"` — bioequivalencia declarada por la fuente. */
  bioequivalence: string;
  /** Marca/laboratorio normalizado, o `"unknown"` (commercialIdentity.ts). */
  commercialIdentity: string;
  /** Segundo principio activo cuando es una combinación (matching.ts), o `null`. */
  combination: string | null;
  /** Calificador comercial dentro de la familia de marca, o `null`. */
  commercialVariant: string | null;
  /** Clase gruesa de forma farmacéutica, o `null` si el nombre no la declara. */
  dosageForm: DosageFormClass | null;
}

/**
 * Validación explícita de compatibilidad de identidad entre dos ofertas, previa
 * a cualquier fusión (`deduplication.ts`). Devuelve `true` solo si NINGÚN eje
 * disponible se contradice.
 *
 * Reglas, en la dirección conservadora del proyecto:
 *   - `pharmacologicalKey` (principio/marca + dosis + cantidad + turno),
 *     `bioequivalence`, `commercialIdentity` y `combination`: deben ser
 *     IGUALES. Es la identidad que ya decidía SAME_PRODUCT antes de este
 *     cambio; no se relaja nada.
 *   - `commercialVariant`: debe ser IGUAL, incluida la ausencia. Declarar una
 *     variante frente a no declararla es evidencia suficiente de que son
 *     artículos distintos del mismo fabricante (caso Tapsin).
 *   - `dosageForm`: `null` es compatible con cualquier clase; dos clases
 *     conocidas y distintas son incompatibles. Omitir la forma es habitual y
 *     no es evidencia de nada; declararla distinta sí lo es.
 *
 * El laboratorio NO se usa como señal de exclusión adicional acá: ya está en
 * `commercialIdentity`, y la auditoría Losartán/Laboratorio Chile mostró que
 * las fuentes reportan laboratorios inconsistentes para el mismo artículo —
 * tratarlo como evidencia fuerte de "producto distinto" generaría falsos
 * splits sobre genéricos y bioequivalentes.
 */
export function isSameProduct(a: ProductIdentity, b: ProductIdentity): boolean {
  if (a.pharmacologicalKey !== b.pharmacologicalKey) return false;
  if (a.bioequivalence !== b.bioequivalence) return false;
  if (a.commercialIdentity !== b.commercialIdentity) return false;
  if (a.combination !== b.combination) return false;
  if (a.commercialVariant !== b.commercialVariant) return false;
  if (a.dosageForm !== null && b.dosageForm !== null && a.dosageForm !== b.dosageForm) return false;
  return true;
}
