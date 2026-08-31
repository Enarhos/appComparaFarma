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
import {
  isMassUnit,
  isSameConcentration,
  isVolumeUnit,
  parseMeasurements,
  type Concentration,
} from "./concentration.js";

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
// C. CANTIDAD POR ENVASE
// ---------------------------------------------------------------------------

/**
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * El único eje de cantidad que la deduplicación tenía hasta acá era el segmento
 * de `matchKey`, y ese segmento NO representa fielmente lo que declara el
 * nombre. Dos defectos concretos, verificados sobre 1.389 ofertas reales de 21
 * búsquedas de producción (read-only, 2026-08-30):
 *
 *   1. `matching.ts` normaliza `qty === "1"` a cadena vacía, así que una oferta
 *      que declara EXPLÍCITAMENTE una unidad queda indistinguible de una que no
 *      declara cantidad alguna. 17 ofertas reales hoy, entre ellas
 *      "Tapsin Compuesto Noche 5g **1 Sobre** Polvo Para Solución Oral"
 *      (Ahumada) → `tapsin|5000mg|n`, exactamente igual que un nombre sin
 *      cantidad.
 *   2. La lista de sustantivos de `QUANTITY_PATTERN` está incompleta: no cubre
 *      `supositorio(s)`, `óvulo(s)`, `perla(s)`, `pastilla(s)`, `comps`, `cps`
 *      ni `tabs`. 15 ofertas reales declaran N>1 unidades y `matchKey` las lee
 *      como cantidad ausente — "Diclofenaco 50 mg **5 supositorios**"
 *      (Dr. Simi) → `diclofenaco|50mg`, "Next Fwd **24 Tabs** /50" (Cruz Verde)
 *      → `nextfwd`.
 *
 * Sumadas, 32 ofertas (2,3 % de la muestra) tienen su cantidad INVISIBLE para
 * la clave de agrupación. Cualquier par de ellas que coincida en el resto de la
 * identidad se fusiona sin ninguna validación de cantidad, porque
 * `canMergeOffers()` delegaba ese eje enteramente en `matchKey`. Es el defecto
 * que produjo el reporte de QA "1 sobre comparado contra caja de 6 sobres":
 * una comparación de precio engañosa, no un duplicado estético.
 *
 * `matchKey` NO se toca (valor persistido en `price_history`,
 * `medication_match_key_aliases`, `pharmacy_clicks`, `email_alerts`): la
 * cantidad se vuelve a leer acá, con cobertura completa, como un eje propio de
 * la capa de identidad.
 */

/**
 * Sustantivos que cuentan UNIDADES DE UN ENVASE. Se mantiene SEPARADO de
 * `COUNT_NOUNS` (más arriba en este módulo) a propósito: aquella lista alimenta
 * a `isAttributeBoundary()`, de la que depende `commercialVariantKey()` y, por
 * lo tanto, el segmento `|var:` de `presentationKey`. Agregarle entradas
 * movería el corte de la variante en nombres reales y rotaría claves —y, en
 * Web, slugs de ficha— sin ninguna relación con este fix.
 */
const UNIT_COUNT_NOUNS = new Set([
  "comprimido", "comprimidos", "com", "comp", "comps",
  "capsula", "capsulas", "cap", "caps", "cps",
  "tableta", "tabletas", "tab", "tabs",
  "gragea", "grageas", "perla", "perlas", "pastilla", "pastillas",
  "sobre", "sobres", "sachet", "sachets",
  "supositorio", "supositorios", "suposit", "ovulo", "ovulos",
  "ampolla", "ampollas", "ampolleta", "ampolletas", "jeringa", "jeringas",
  "parche", "parches", "unidad", "unidades", "und",
]);

/**
 * Unidades de MEDIDA (masa, volumen, actuaciones). Un número seguido de una de
 * ellas describe la dosis o el contenido del envase, nunca cuántas unidades
 * trae: "Amoxicilina 250mg/5ml x **60 ml**" son 60 mililitros de jarabe, no 60
 * cápsulas, y "Tapsin SC Paracetamol **1 gr** x 20 Comprimidos" son 20
 * comprimidos de 1 gramo, no 1 unidad.
 *
 * Es la lista que hace segura la lectura de `x <n>` sin sustantivo: sin ella,
 * 178 ofertas reales de la muestra (todos los jarabes, suspensiones, gotas y
 * aerosoles) derivarían una "cantidad" que es en realidad su volumen.
 */
const MEASURE_UNITS = new Set([
  "mg", "g", "gr", "gramo", "gramos", "miligramo", "miligramos",
  "ml", "cc", "l", "litro", "litros", "mililitro", "mililitros",
  "mcg", "ug", "ui", "iu", "kg",
  "dosis", "puff", "puffs", "inhalacion", "inhalaciones",
  "aplicacion", "aplicaciones", "actuacion", "actuaciones",
  "disparo", "disparos", "pulverizacion", "pulverizaciones",
]);

/**
 * Sustantivo de unidad en SINGULAR. Cuando el nombre no declara ningún número
 * de unidades pero nombra la unidad en singular, la presentación es de UNA
 * unidad: "Tapsin **Sobre** Noche (Maver)" (EcoFarmacias) y "Tapsin Noche
 * Limonada **Sobre** (ai)" (Sermecoop) son el sachet suelto, no la caja.
 *
 * Es el caso exacto del reporte de QA —un sobre suelto comparado contra una
 * caja de 6— y sin esta lectura quedaría como "cantidad desconocida", es decir
 * como comodín que se fusiona con cualquier tamaño de envase.
 *
 * La regla se restringe al singular y solo se aplica cuando NO se encontró
 * ningún número de unidades en el nombre. Medido sobre las 1.389 ofertas de la
 * muestra: 24 nombres usan un sustantivo de unidad en singular y solo 4 lo
 * hacen sin número; los 4 son sachets sueltos. No hay en el catálogo real un
 * solo caso en que un envase multi-unidad se describa con la unidad en
 * singular y sin cantidad.
 */
const SINGULAR_UNIT_NOUNS = new Set([
  "sobre", "sachet", "comprimido", "capsula", "tableta", "gragea",
  "supositorio", "ovulo", "ampolla", "ampolleta", "jeringa",
  "parche", "perla", "pastilla",
]);

/** `24`, `x24`, `por10` — número con el prefijo de cantidad opcionalmente pegado. */
const COUNT_NUMBER_TOKEN = /^(?:x|por)?(\d+)$/;

/** `x80com`, `100comp`, `x10cap` — cantidad y abreviatura de forma sin espacio. */
const GLUED_COUNT_TOKEN = /^x?(\d+)(?:com|comp|comps|cap|caps|cps|tab|tabs)$/;

/**
 * Unidades por envase declaradas en el nombre, o `null` si el nombre no las
 * declara.
 *
 * A diferencia del segmento de cantidad de `matchKey`, distingue los TRES
 * estados que la deduplicación necesita:
 *   - `1`    — declara explícitamente una unidad ("… 1 Sobre …", "x 1 Ampolla")
 *   - `N`    — declara explícitamente N unidades ("6 Sobres", "x80com.")
 *   - `null` — el nombre no declara cantidad, o la declara de forma ambigua
 *
 * Formatos reconocidos, todos observados en el catálogo real:
 *   `6 Sobres` · `20 Comprimidos` · `5 Supositorios` · `24 Tabs` · `30 Cap`
 *   `x 6 comprimidos` · `X 24 comp.` · `por 10 caps.` · `por10 comprimidos`
 *   `x80com.` · `100comp` · `Caja 6 sobres`
 *   `x 6` / `x 60…`  (EasyFarma trunca el nombre y deja la cantidad suelta)
 *
 * Se devuelve `null` —y no un número— cuando el único candidato va seguido de
 * una unidad de medida (`x 60 ml`, `x5g`, `x 200 Dosis`). Es la dirección
 * conservadora: una cantidad inventada a partir de un volumen sería peor que no
 * tener cantidad, porque el eje se usa para PROHIBIR fusiones.
 */
export function unitCountKey(name: string): number | null {
  // Sin `withoutAnnotations()`: Farmex declara la cantidad DENTRO del paréntesis
  // ("Tapsin Caliente Noche - Sabor Limón - Sobre de 5 g ( 1 sobre )") y
  // descartarlo perdería el dato.
  const tokens = normalizedWords(name);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    const glued = GLUED_COUNT_TOKEN.exec(token);
    if (glued) return Number(glued[1]);

    const number = COUNT_NUMBER_TOKEN.exec(token);
    if (!number) continue;

    const next = tokens[i + 1];
    if (next !== undefined && UNIT_COUNT_NOUNS.has(next)) return Number(number[1]);
    if (next !== undefined && MEASURE_UNITS.has(next)) continue;

    // `x <n>` / `por <n>` sin sustantivo detrás. Se acepta como cantidad solo
    // acá, después de haber descartado las unidades de medida.
    const prefixed = token !== number[1];
    const previous = tokens[i - 1];
    if (prefixed || previous === "x" || previous === "por") return Number(number[1]);
  }

  // Ningún número de unidades en el nombre. La unidad nombrada en singular es
  // la última evidencia disponible de que la presentación es de una sola —
  // ver `SINGULAR_UNIT_NOUNS`.
  if (tokens.some((token) => SINGULAR_UNIT_NOUNS.has(token))) return 1;

  return null;
}

/**
 * POLÍTICA DE CANTIDAD (asimétrica y deliberada) — `true` si dos ofertas pueden
 * pertenecer a la misma tarjeta según su cantidad declarada.
 *
 *   - Ambas EXPLÍCITAS y DISTINTAS  → `false`. Regla dura: dos fuentes que
 *     declaran cantidades distintas son evidencia positiva y directa de que son
 *     presentaciones distintas. Incluye el caso `1` vs `N`, que es precisamente
 *     el que `matchKey` no puede expresar.
 *   - Ambas EXPLÍCITAS e IGUALES    → `true`, sin importar cómo esté escrita la
 *     cantidad (`x 6`, `6 sobres`, `caja 6 sobres`, `x80com.` ≡ `x 80
 *     comprimidos`).
 *   - Una EXPLÍCITA y otra AUSENTE  → `true`. **No** se trata la ausencia como
 *     incompatible.
 *
 * Por qué la ausencia NO bloquea la fusión, aunque la política general del
 * proyecto sea "ante duda, no fusionar": esa política se aplica ante una
 * CONTRADICCIÓN, y acá no hay ninguna. No declarar la cantidad no afirma nada;
 * declarar una distinta sí. En el catálogo real la ausencia es siempre un
 * defecto de transcripción de la farmacia sobre el MISMO envase, nunca un
 * envase distinto — EasyFarma trunca ("Omeprazol 20 mg x 60…"), AraucoMed pega
 * la abreviatura ("x80com."). En la muestra de 21 búsquedas, los 4 grupos con
 * cantidad declarada en una fuente y ausente en la otra eran los 4 el mismo
 * producto; bloquearlos habría partido 4 tarjetas correctas sin evitar ni un
 * solo falso merge. Es la misma asimetría que ya rige `dosageForm` (`null`
 * compatible con cualquier clase, ver `dosageFormClass`).
 *
 * El riesgo que esa asimetría deja abierto —una cantidad no detectada actuando
 * como comodín— se contiene por el otro lado: `unitCountKey()` cubre los
 * formatos y sustantivos que `matchKey` no cubre, así que los casos que antes
 * caían en "desconocida" ahora caen en "explícita" y quedan bajo la regla dura.
 */
export function isCompatibleUnitCount(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return true;
  return a === b;
}

// ---------------------------------------------------------------------------
// D. CONCENTRACIÓN FARMACOLÓGICA EN FORMAS LÍQUIDAS
// ---------------------------------------------------------------------------

/**
 * PROBLEMA QUE RESUELVE (CF-SEARCH-003)
 * -------------------------------------
 * `matchKey()` elige UNA sola dosis y prioriza el mililitro sobre el miligramo
 * (matching.ts:108-117):
 *
 *     if (mlHits.length)       dose = `${Math.max(...mlHits)}ml`;
 *     else if (mcgHits.length) ...
 *     else if (mgHits.length)  ...
 *
 * En un líquido el nombre trae ambos ("Ambroxol **30 mg/5 mL** Jarabe **100
 * mL**"), así que gana el `ml` y la clave queda `ambroxol|100ml`: **se conserva
 * el VOLUMEN DEL ENVASE y se descarta la CONCENTRACIÓN**. Como
 * `presentationKey()` hereda esa clave y ningún otro eje (`bio:`, `brand:`,
 * `combo:`, `var:`, `form:`) mira la concentración, dos jarabes de potencia
 * distinta caen en la misma tarjeta y la diferencia de precio se muestra como
 * ahorro. Verificado sobre 2.627 ofertas reales de 29 búsquedas de producción:
 *
 *   ambroxol|100ml|…|form:fluid-oral   30 mg/5 mL (sermecoop $2.390)
 *                                      15 mg/5 mL (cruz-verde $5.490)
 *   ibuprofeno|100ml|…|form:fluid-oral 200 mg/5 mL (eco $1.890, salcobrand …)
 *                                      100 mg/5 mL (cruz-verde $3.140)
 *
 * Es el eje simétrico de los que ya existen: `combo:` (S-1) separó
 * combinaciones, `unitCountKey` (fix de cantidad) separó tamaños de envase; la
 * concentración de líquidos es el que faltaba.
 *
 * SEPARACIÓN CONCEPTUAL (no negociable)
 * -------------------------------------
 *   CONCENTRACIÓN     — cuánto principio activo por unidad de volumen:
 *                       `30 mg/5 mL`, `2 mg/mL`, `0,25 mg/mL`.
 *   VOLUMEN DE ENVASE — cuánto líquido trae el frasco: `60 mL`, `100 mL`.
 *
 * "Ambroxol 30 mg/5 mL 100 mL" tiene concentración `30 mg/5 mL` **y** volumen
 * `100 mL`, y el segundo NUNCA sustituye al primero. Por eso este eje ignora
 * las magnitudes de volumen sueltas: dos frascos de 60 mL y 100 mL de la misma
 * concentración siguen siendo compatibles (el tamaño del envase ya lo gobierna
 * `matchKey`), y dos frascos de 100 mL con concentraciones distintas ya no.
 *
 * `matchKey` NO se toca: su valor está persistido en `price_history`,
 * `medication_match_key_aliases`, `pharmacy_clicks` y `email_alerts`.
 */

/**
 * Concentración declarada por el nombre de un producto, o `null`.
 *
 * NO es `parseConcentration()` (concentration.ts): esa función devuelve la
 * PRIMERA magnitud del texto, que en un nombre de líquido suele ser el volumen
 * del envase ("Ambroxol Jarabe **100 ml** 15 mg/5 ml") o una masa suelta. Acá
 * se busca la concentración, que es otra cosa, en dos niveles de evidencia:
 *
 *   1. RAZÓN masa/volumen explícita (`{numerator, denominator}`) — la primera
 *      del nombre, aunque no sea la primera magnitud. Es la evidencia fuerte:
 *      `30 mg/5 mL`, `600 mg / 100 ml`, `0,5 mg/ml`, `2 gr / 5 ml`. Se comparan
 *      por RAZÓN, así que `30 mg/5 mL` ≡ `6 mg/mL` ≡ `600 mg/100 mL` —tres
 *      escrituras reales del mismo jarabe de Ambroxol en tres farmacias— y
 *      `0,5 g/5 ml` ≡ `500 mg/5 ml`.
 *
 *   2. MASA ABSOLUTA declarada junto a un volumen (`denominator === null`) —
 *      evidencia débil, aceptada solo cuando el nombre TAMBIÉN declara un
 *      volumen. Esa condición no es cosmética: es exactamente el caso en que
 *      `matchKey` descartó la masa (el `ml` ganó), o sea el único en que este
 *      eje aporta información que la clave no tiene ya. Cubre el quinto falso
 *      merge documentado, donde ninguna de las dos fuentes escribe la razón:
 *        cam|120ml|…|var:betametasona
 *          ecofarmacias "Cam Jarabe Betametasona **0,25 mg** 120 Ml"  $ 9.980
 *          cruz-verde   "Cam Betametasona **2 mg** Jarabe 120 mL"     $14.790
 *      Un factor 8 entre dos ofertas de la misma tarjeta.
 *
 * Los dos niveles se comparan ENTRE SÍ como compatibles, nunca como iguales —
 * ver `isCompatibleConcentration()`.
 *
 * Lo que este eje deliberadamente NO hace: **inferir una razón a partir de la
 * yuxtaposición de una masa y un volumen**. "Ambroxol clorhidrato 30 mg 100 ml"
 * es en realidad 30 mg/5 mL (el 100 ml es el frasco), no 30 mg/100 mL; leerlo
 * como razón inventaría una concentración 20 veces menor. Es justamente la
 * confusión concentración/envase que este ticket corrige, y las 9 grafías del
 * catálogo sin separador (`30mg5ml`, `600 mg 100 ml`) se quedan en el nivel 2.
 *
 * Efecto medido sobre 1.806 ofertas reales (24 búsquedas, 2026-08-31): 0 de 814
 * `solid-oral`, 0 de 118 `topical` y 0 de 44 `suppository` derivan concentración
 * —ningún nombre de sólido ni de crema declara una razón masa/volumen ni una
 * masa junto a un volumen—, así que la dosis sólida ("500 mg x 20 comprimidos")
 * no la toca este eje ni por accidente. Por eso NO se agrega un filtro adicional
 * por `dosageFormClass`: sería un candado sin cerradura, y dejaría fuera a las
 * 40 ofertas líquidas cuyo nombre no declara forma farmacéutica reconocible.
 */
export function liquidConcentration(name: string): Concentration | null {
  const measurements = parseMeasurements(name);

  for (const candidate of measurements) {
    if (
      candidate.denominator !== null &&
      isMassUnit(candidate.numerator.unit) &&
      isVolumeUnit(candidate.denominator.unit)
    ) {
      return candidate;
    }
  }

  const declaresVolume = measurements.some(
    (m) =>
      (m.denominator === null && isVolumeUnit(m.numerator.unit)) ||
      (m.denominator !== null && isVolumeUnit(m.denominator.unit))
  );
  if (!declaresVolume) return null;

  return (
    measurements.find((m) => m.denominator === null && isMassUnit(m.numerator.unit)) ?? null
  );
}

/**
 * POLÍTICA DE CONCENTRACIÓN — `true` si dos ofertas pueden compartir tarjeta
 * según la concentración que declaran.
 *
 *   - Ambas del MISMO nivel de evidencia y con distinta potencia → `false`.
 *     Regla dura del ticket: dos fuentes que declaran concentraciones
 *     explícitas distintas son evidencia positiva y directa de que son
 *     productos distintos. Se comparan por razón (o por masa, según el nivel),
 *     no por texto: `30mg/5ml`, `30 mg / 5 mL` y `600 mg/100 ml` son la misma.
 *   - Ambas del mismo nivel y equivalentes → `true`.
 *   - Una AUSENTE → `true`. No bloquea la fusión.
 *   - Una RAZÓN y la otra MASA ABSOLUTA → `true`. No es una contradicción sino
 *     dos niveles de detalle sobre el mismo hecho: "Jarabe Ambroxol clorhidrato
 *     **30mg**5ml 100ml" (EcoFarmacias, sin barra) y "Ambroxol **30mg/5ml**
 *     Jarabe 100ml" (Sermecoop) son el mismo producto escrito con y sin
 *     separador. Compararlas numéricamente exigiría decidir a qué volumen se
 *     refiere la masa, que es precisamente la inferencia que este eje se
 *     prohíbe.
 *
 * POR QUÉ LA AUSENCIA NO BLOQUEA — decidido con datos, no por analogía.
 * Medido sobre los 157 grupos multi-oferta de 24 búsquedas de producción
 * (1.806 ofertas, read-only, 2026-08-31; script y datos en
 * `docs/qa/cf-search-003/`):
 *
 *      todas sin concentración          108
 *      todas explícitas y equivalentes   30
 *      explícitas INCOMPATIBLES           7   ← los falsos merges del ticket
 *      mixtas (explícita + ausente)      12
 *
 * Las tres políticas evaluadas sobre esos 12 grupos mixtos:
 *   (A) ausencia = comodín  → 0 falsos splits, y los 7 falsos merges igual se
 *       eliminan: la contradicción está siempre entre dos ofertas EXPLÍCITAS,
 *       nunca entre una explícita y una ausente.
 *   (B) ausencia = bloqueo  → 12 falsos splits y ni un falso merge adicional
 *       evitado. Los 12 son la misma presentación escrita con y sin
 *       concentración por dos farmacias: "Alledryl (loratadina) Jarabe 60ml"
 *       (Sermecoop) vs "Alledryl Loratadina 5 mg / 5 mL Jarabe 60 mL"
 *       (Cruz Verde); "Cidoten Gotas x 30 ml" (EasyFarma) vs "Cidoten 0,5
 *       Mg/ml Gotas X 30 Ml" (Sermecoop); "Paracetamol Gotas 15ml"
 *       (Salcobrand) vs "Paracetamol 100 mg Gotas 15 mL" (Cruz Verde). En los
 *       12, la fuente que calla es la que trunca o abrevia el nombre, no una
 *       presentación distinta.
 *   (C) condicionar por otras señales de identidad (forma, cantidad,
 *       laboratorio) → descartada: en los 12 grupos esas señales ya coinciden,
 *       así que produce exactamente el mismo resultado que (A) a cambio de una
 *       regla más difícil de auditar. Sin un solo caso en la muestra donde
 *       cambie la decisión, no hay evidencia que la justifique.
 *
 * Se elige (A): 0 falsos splits medidos, y los 7 falsos merges corregidos.
 * Es la misma asimetría —y la misma justificación empírica— que ya rigen
 * `dosageFormClass` (`null` compatible con cualquier clase) e
 * `isCompatibleUnitCount`: no declarar no afirma nada; declarar distinto sí.
 */
export function isCompatibleConcentration(
  a: Concentration | null,
  b: Concentration | null
): boolean {
  if (a === null || b === null) return true;
  // Niveles de evidencia distintos (razón vs masa absoluta): no comparables,
  // y por lo tanto no contradictorios.
  if ((a.denominator === null) !== (b.denominator === null)) return true;
  return isSameConcentration(a, b);
}

// ---------------------------------------------------------------------------
// E. IDENTIDAD DE PRODUCTO Y COMPATIBILIDAD
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
  /**
   * Unidades por envase declaradas en el nombre, o `null` si no las declara.
   * Eje propio, independiente del segmento de cantidad de `matchKey`, que
   * confunde "1 unidad" con "cantidad ausente" y no reconoce varios
   * sustantivos reales — ver `unitCountKey()`.
   */
  unitCount: number | null;
  /**
   * Concentración farmacológica declarada en el nombre, o `null`. Eje propio,
   * INDEPENDIENTE del volumen del envase: `matchKey` conserva el volumen
   * (`|100ml`) y descarta la concentración, así que sin este eje dos jarabes de
   * potencia distinta son indistinguibles — ver `liquidConcentration()`.
   */
  concentration: Concentration | null;
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
 *   - `unitCount`: dos cantidades EXPLÍCITAS y distintas son incompatibles
 *     (incluido `1` vs `N`); la ausencia es compatible con cualquiera. La
 *     justificación completa de esa asimetría está en
 *     `isCompatibleUnitCount()`.
 *   - `concentration`: dos concentraciones EXPLÍCITAS del mismo nivel de
 *     evidencia y distinta potencia son incompatibles; la ausencia es
 *     compatible con cualquiera. Se compara por razón, no por texto — ver
 *     `isCompatibleConcentration()`.
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
  if (!isCompatibleUnitCount(a.unitCount, b.unitCount)) return false;
  if (!isCompatibleConcentration(a.concentration, b.concentration)) return false;
  return true;
}
