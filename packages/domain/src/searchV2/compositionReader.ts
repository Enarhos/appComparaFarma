/**
 * Search Engine v2 — LECTOR ESTRUCTURADO DE COMPOSICIÓN (CF-SEARCH-011, S0).
 *
 * Responde una sola pregunta, y la responde sobre el texto de UN nombre, sin
 * mirar ninguna otra oferta: *¿qué principios activos declara este nombre, y
 * cuántos componentes activos afirma tener?*
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE — EL FALSO MERGE QUE LO ORIGINA
 * ---------------------------------------------------------------------------
 * Medido sobre el corpus congelado de S0, antes de este módulo:
 *
 *     dr-simi    "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos"
 *     dr-simi    "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico"
 *     cruz-verde "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos"
 *
 * compartían el MISMO concepto (`ing=diclofenaco|disc=none|conc=conc:mass:25mg|
 * form=comprimido|route=oral|unit=comprimido`), con resolución `complete` y
 * confianza `high`. Es decir: una asociación de diclofenaco con TRAMADOL —un
 * opioide— quedaba declarada como el mismo Concepto Farmacéutico que un
 * monofármaco de diclofenaco, con la máxima confianza que el modelo puede emitir.
 *
 * La cadena causal tiene tres eslabones, y ninguno es un descuido de código:
 *
 *   1. `tramadol` NO está en `COMPOSITION_VOCABULARY` (las 34 moléculas que
 *      CF-DATA-001 derivó por frecuencia sobre 3.697 ofertas).
 *   2. `combinationKey()` (v1) devuelve `null` para ese nombre: exige un
 *      separador `+`/`/` INMEDIATAMENTE seguido de letras —"25/25" tiene un
 *      dígito a la derecha— o una razón masa/masa con unidad obligatoria en el
 *      denominador —"25/25 diclofenaco" no la tiene—. Las dos restricciones son
 *      correctas y están justificadas contra datos reales en `matching.ts`; el
 *      punto es que esta escritura no cae en ninguno de los dos caminos.
 *   3. Al fallar las dos únicas fuentes de evidencia, el conjunto de principios
 *      activos quedaba en `{diclofenaco}` — y un conjunto INCOMPLETO es
 *      indistinguible de un conjunto COMPLETO de un solo elemento.
 *
 * El eslabón 3 es el defecto de modelo: el motor no tenía forma de representar
 * *"sé que hay más de un componente activo, pero no sé nombrarlos todos"*.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ NO SE EXTIENDE `combinationKey()` (v1)
 * ---------------------------------------------------------------------------
 * `combinationKey()` alimenta `presentationKey()` y, por su intermedio, los slugs
 * de Web. Cambiarlo movería identidad de v1 en producción, que en S0 es inmutable
 * (CF-SEARCH-011 §4). Además devuelve UN token —el "segundo principio activo"—,
 * que es la forma equivocada para este problema: acá hace falta el CONJUNTO y su
 * CARDINALIDAD. `combinationKey()` se sigue usando tal cual como una de las
 * cuatro fuentes de evidencia, sin modificarlo.
 *
 * ---------------------------------------------------------------------------
 * LAS CUATRO CLASES DE TOKEN (regla de evidencia, CF-SEARCH-011 §10)
 * ---------------------------------------------------------------------------
 *   (A) PRINCIPIO ACTIVO DEMOSTRADO — `COMPOSITION_VOCABULARY` (v1) o
 *       `V2_MOLECULE_VOCABULARY` (derivado del corpus, ver ahí), o promovido por
 *       posición estructural con corroboración de un hermano (ver
 *       `readIngredientComposition`).
 *   (B) ION / SAL / CALIFICADOR QUÍMICO — `ION_AND_SALT_TOKENS`. NUNCA es un
 *       componente propio: "Losartán POTÁSICO" es un principio activo, no dos.
 *       Es TRANSPARENTE: se atraviesa al buscar la dosis de la molécula anterior.
 *   (C) MARCA / CABECERA COMERCIAL — no se demuestra como molécula y no entra
 *       jamás en `ActiveIngredient[]`; lo gestiona
 *       `readUnresolvedIdentityDiscriminator()`.
 *   (D) DESCRIPTOR DE FORMA / PRESENTACIÓN / ENVASE — `STOP_WORDS`,
 *       `PRESENTATION_FORM_WORDS` y `V2_DESCRIPTOR_TOKENS`. Es OPACO: bloquea la
 *       anotación de dosis del token anterior, porque entre una molécula y su
 *       dosis no se interpone una forma farmacéutica.
 *
 * REGLA DE HONESTIDAD, sin excepción: `UNKNOWN` es mejor que una molécula
 * inventada. Ningún token se promueve a principio activo por estar cerca de una
 * cifra — hace falta corroboración independiente. Lo que sí se afirma sin
 * nombrar moléculas es la CARDINALIDAD, cuando la tipografía la declara.
 *
 * Y su recíproca, que es la misma regla leída al revés: NOMBRAR UNA MOLÉCULA NO
 * DEMUESTRA QUE ESTÉ. Un nombre puede nombrarla para decir que NO está ("Tapsin
 * Puro **Sin** Cafeína"), y esa gramática se lee antes que cualquier evidencia
 * de presencia — ver `negatedMolecules()`.
 */

import {
  combinationKey,
  PRESENTATION_FORM_WORDS,
  SALT_QUALIFIER_WORDS,
  STOP_WORDS,
} from "../matching.js";
import { COMPOSITION_VOCABULARY } from "../brandIdentity.js";
import { isMassUnit, isVolumeUnit, type Measurement } from "../concentration.js";

// ---------------------------------------------------------------------------
// A. VOCABULARIOS DE EVIDENCIA
// ---------------------------------------------------------------------------

/**
 * Clase (B): iones, sales, ésteres y CALIFICADORES QUÍMICOS que acompañan a un
 * principio activo sin ser uno.
 *
 * Vive en la capa v2 y no en `matching.ts` a propósito: agregar entradas a
 * `SALT_QUALIFIER_WORDS` cambiaría `combinationKey()` y, por su intermedio,
 * `presentationKey` y los slugs de Web — comportamiento de v1, inmutable en S0.
 *
 * `acido` es la entrada que se agrega en esta iteración, y no es cosmética. Sobre
 * el corpus congelado, `combinationKey()` devuelve `acido` en 25 nombres —es su
 * token más frecuente— porque "Amoxicilina + **Ácido** Clavulánico" pone el
 * calificador inmediatamente a la derecha del separador. Eso metía una molécula
 * inexistente llamada `acido` en el conjunto de principios activos, y partía en
 * dos conceptos distintos el MISMO medicamento según cómo lo escribiera cada
 * farmacia:
 *
 *     "Amoxicilina + Ácido Clavulánico 500 mg / 125 mg"  → ing=acido+amoxicilina+clavulanico
 *     "Amoxicilina 500 mg ácido clavulánico 125 mg"      → ing=amoxicilina+clavulanico
 *
 * `acido` no se descarta y ya: cuando encabeza el nombre de una molécula se
 * ATRAVIESA hasta ella (`resolveThroughQualifier`), así que "Ácido Clavulánico"
 * aporta `clavulanico` y "Ácido Acetilsalicílico" aporta `acetilsalicilico`.
 *
 * Categoría acotada y explícita, no un intento de enumerar la química
 * farmacéutica: cada entrada es un ion, una sal o un calificador de forma
 * química, nunca una molécula con efecto terapéutico propio en este contexto.
 */
export const ION_AND_SALT_TOKENS: ReadonlySet<string> = new Set([
  ...SALT_QUALIFIER_WORDS,
  "sodio",
  "calcio",
  "potasio",
  "magnesio",
  "diclorhidrato",
  "dihidrocloruro",
  "cloruro",
  "acido",
  "acida",
  "acidos",
]);

/**
 * Clase (A), segunda fuente de vocabulario: moléculas que el PROPIO CORPUS
 * demuestra como principio activo a través de una convención de escritura
 * distinta, y que `COMPOSITION_VOCABULARY` no contiene.
 *
 * EL CRITERIO ES REPRODUCIBLE, NO UNA LISTA DE AUTOR. Se admite un token si y
 * solo si `combinationKey()` —una función de v1, que no se modifica— lo devuelve
 * como segundo principio activo en al menos un nombre del corpus congelado, es
 * decir si alguna farmacia ya lo escribió con separador explícito entre
 * moléculas. Es la misma clase de evidencia que sostiene a `COMPOSITION_VOCABULARY`
 * (medición sobre ofertas reales), aplicada a la parte del catálogo que la
 * medición por frecuencia de CF-DATA-001 no alcanzó.
 *
 * Tokens que `combinationKey()` produce sobre el corpus y que NO entran acá, con
 * su motivo — la lista de exclusiones importa tanto como la de inclusiones:
 *
 *   `acido`      (25) — calificador químico, no molécula → `ION_AND_SALT_TOKENS`.
 *   `miel`        (2) — saborizante/excipiente de jarabes, sin efecto
 *                       terapéutico propio en este catálogo.
 *   `triterapia`  (1) — descriptor de RÉGIMEN ("Zomel HP Triterapia"), no una
 *                       molécula.
 *
 * Los demás tokens que devuelve (`hidroclorotiazida`, `pseudoefedrina`,
 * `clavulanico`, `ibuprofeno`, `paracetamol`, `losartan`) ya están en
 * `COMPOSITION_VOCABULARY` y no hace falta repetirlos.
 *
 * NO se amplía con moléculas que el corpus no demuestre. `dutasteride` y
 * `tamsulosina` aparecen en "Combodart 0,5/0,4 Dutasteride 0,5 mg Tamsulosina
 * 0,4 mg", pero ninguna farmacia las escribe con separador entre moléculas, así
 * que no hay evidencia independiente y ese producto queda —correctamente— con
 * identidad no resuelta en vez de con dos moléculas afirmadas por posición.
 */
export const V2_MOLECULE_VOCABULARY: ReadonlySet<string> = new Set([
  // "Diclofenaco Sodico/Tramadol Clorhidrato", "Dolodrin Diclofenaco 25 Mg /
  // Tramadol 25 Mg", "Tramadol Clorhidrato/Paracetamol" — 10 nombres del corpus.
  "tramadol",
  // "Ácido Acetilsalicílico + Cafeína", "Paracetamol / Cafeína".
  "cafeina",
]);

/**
 * Clase (D): descriptores de forma, presentación, envase y vía que v2 lee como
 * ejes propios y que por lo tanto NUNCA son un componente activo.
 *
 * Complementa `STOP_WORDS` y `PRESENTATION_FORM_WORDS` (v1) con el vocabulario
 * que v2 agregó en su propia capa de lectura (`readCanonicalDosageForm`,
 * `readPharmaceuticalUnit`, `readPackageType`, `readAdministrationRoute`). Sin
 * esto, un token como `suspension` u `ovulo` podría llegar a la etapa de
 * promoción estructural, que es exactamente lo que la clase (D) tiene que
 * impedir.
 */
const V2_DESCRIPTOR_TOKENS: ReadonlySet<string> = new Set([
  // formas farmacéuticas canónicas y sus grafías
  "comprimido", "comprimidos", "comps", "tabs", "gragea", "grageas",
  "pastilla", "pastillas", "capsula", "capsulas", "caps", "cps", "perla", "perlas",
  "jarabe", "jbe", "suspension", "suspensiones", "susp", "sus",
  "solucion", "soluciones", "elixir", "emulsion", "liq",
  "gota", "gotas", "gts", "polvos", "sobre", "sobres", "sachet", "sachets",
  "granulado", "granulados", "granulo", "granulos",
  "crema", "cremas", "geles", "pomada", "pomadas", "unguento", "unguentos",
  "locion", "lociones", "shampoo", "champu",
  "inyectable", "inyectables", "ampolla", "ampollas", "ampolleta", "ampolletas",
  "vial", "viales", "jeringa", "jeringas",
  "inhalador", "inhaladores", "inhalacion", "inhalaciones", "nebulizacion",
  "colirio", "oftalmico", "oftalmica", "oftalmicas",
  "otico", "otica", "oticas", "oticos",
  "supositorio", "supositorios", "ovulo", "ovulos", "parche", "parches",
  // envase y vía
  "caja", "frasco", "frascos", "tira", "tiras", "blister", "blisters",
  "estuche", "envase", "bolsa", "tubo",
  "oral", "orales", "bucal", "sublingual", "topico", "topica", "topicos", "topicas",
  "dermico", "dermica", "cutaneo", "cutanea", "vaginal", "vaginales",
  "intramuscular", "endovenoso", "endovenosa", "intravenoso", "intravenosa",
  "subcutanea", "subcutaneo", "parenteral", "inhalatoria", "inhalatorio",
  "nasales", "rectales",
  // calificadores de fabricación que acompañan a la forma
  "recubierto", "recubiertos", "recubierta", "recubiertas", "recubrimiento",
  "enterico", "enterica", "dispersable", "dispersables",
  "masticable", "masticables", "efervescente", "efervescentes",
  "blando", "blanda", "blandos", "blandas", "liberacion", "prolongada",
  "unidad", "unidades", "dosis", "dosificacion",
]);

/**
 * Longitud mínima de un token para tratarlo como nombre de molécula. Mismo valor
 * que `INGREDIENT_MIN_LENGTH` en `matching.ts`, que es privado de ese módulo; se
 * repite acá en vez de exportarlo para no ampliar la superficie pública de v1.
 */
const MOLECULE_MIN_LENGTH = 4;

// ---------------------------------------------------------------------------
// B. CONTRATO DE SALIDA
// ---------------------------------------------------------------------------

/** Un componente activo leído del nombre, con su dosis propia si la declara. */
export interface IngredientComponent {
  /** Token normalizado, sin acentos y en minúscula (`"tramadol"`). */
  token: string;
  /**
   * `"vocabulary"`     — el token está en un vocabulario de moléculas.
   * `"combination"`    — `combinationKey()` (v1) lo demuestra por separador.
   * `"dose-annotated"` — lleva su propia dosis en el texto y comparte esa
   *                      estructura con un hermano ya corroborado. Ver
   *                      `readIngredientComposition`.
   */
  evidence: "vocabulary" | "combination" | "dose-annotated";
  /**
   * Dosis DE ESTE COMPONENTE cuando el nombre la declara pegada a él
   * ("tramadol **25 mg**"), o `null`. NO participa de ninguna firma de
   * identidad — ver `CanonicalMedicationConcept.ingredientStrengths`.
   */
  strength: Measurement | null;
}

/** Lectura completa de la composición declarada por un nombre. */
export interface IngredientComposition {
  /** Componentes DEMOSTRADOS, ordenados alfabéticamente y sin duplicados. */
  components: IngredientComponent[];
  /**
   * Cantidad MÍNIMA de componentes activos que el nombre declara tener.
   *
   * Es `max(components.length, aridad tipográfica)`, donde la aridad tipográfica
   * sale de una razón de dosis masa/masa ("875/125", "25/25", "50/12,5"). Puede
   * ser MAYOR que `components.length`: eso significa exactamente *"el nombre
   * afirma que hay N componentes activos y solo pude nombrar M"*, que es el
   * estado que el modelo no sabía representar y el origen del falso merge.
   *
   * `0` cuando el nombre no declara ninguna composición.
   */
  declaredComponentCount: number;
  /**
   * `true` cuando el nombre declara MÁS DE UN componente activo, se hayan podido
   * nombrar todos o no. Es la afirmación que separa una asociación de un
   * monofármaco aunque las moléculas sean desconocidas.
   */
  isAssociation: boolean;
  /**
   * `true` cuando se nombraron todos los componentes que el nombre declara
   * (`components.length >= declaredComponentCount` y hay al menos uno). Es lo que
   * distingue una lectura COMPLETA de una PARCIAL en la firma del concepto.
   */
  isComplete: boolean;
}

// ---------------------------------------------------------------------------
// C. TOKENIZACIÓN POSICIONAL
// ---------------------------------------------------------------------------

/**
 * Grafías de unidad aceptadas, en el mismo orden de longitud descendente que usa
 * `concentration.ts` para que la alternancia no corte "mcg" en "mg".
 *
 * Se declara acá y no se importa porque `UNIT_ALTERNATION` es privado de
 * `concentration.ts`. La VALIDACIÓN de a qué familia pertenece cada unidad sí se
 * delega en ese módulo (`isMassUnit`/`isVolumeUnit`) tras canonizar la grafía,
 * así que no hay dos tablas de dimensiones que puedan divergir.
 */
const UNIT_ALIASES: ReadonlyMap<string, string> = new Map([
  ["mgs", "mg"], ["mcg", "mcg"], ["mls", "ml"], ["grs", "g"],
  ["ug", "mcg"], ["mg", "mg"], ["gr", "g"], ["ml", "ml"],
  ["cc", "ml"], ["lt", "l"], ["ui", "ui"], ["iu", "ui"],
  ["g", "g"], ["l", "l"],
]);

const UNIT_ALTERNATION = [...UNIT_ALIASES.keys()]
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Una palabra alfabética, o una magnitud (cifra con unidad opcional), en orden de
 * aparición. La unidad solo se acepta si es una grafía conocida: sin esa
 * restricción, "25 diclofenaco" leería "diclofenaco" como la unidad de "25" y el
 * lector perdería justamente el token que tiene que encontrar.
 */
const SCAN_RE = new RegExp(
  `(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_ALTERNATION})(?![a-z]))?|([a-z]+)`,
  "g"
);

type ScanToken =
  | { kind: "word"; text: string }
  | { kind: "magnitude"; value: number; unit: string | null };

function stripAccentsLower(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Texto preparado para el escaneo: sin acentos, en minúscula y con los guiones
 * intra-palabra colapsados, exactamente igual que `normalizedWords()` (v1), para
 * que "Co-Amoxiclav" produzca el mismo token en las dos capas. La puntuación NO
 * se borra: `/` y `+` son la evidencia tipográfica que el lector necesita.
 */
function scanText(name: string): string {
  return stripAccentsLower(name).replace(/(\w)-(\w)/g, "$1$2");
}

function scan(text: string): ScanToken[] {
  const tokens: ScanToken[] = [];
  for (const match of text.matchAll(SCAN_RE)) {
    if (match[3] !== undefined) {
      tokens.push({ kind: "word", text: match[3] });
      continue;
    }
    const unit = match[2] === undefined ? null : (UNIT_ALIASES.get(match[2]) ?? null);
    tokens.push({
      kind: "magnitude",
      value: Number.parseFloat(match[1]!.replace(",", ".")),
      unit,
    });
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// D. CLASIFICACIÓN DE TOKENS
// ---------------------------------------------------------------------------

/** Clase (B): ion, sal o calificador químico. Transparente. */
function isQualifier(token: string): boolean {
  return ION_AND_SALT_TOKENS.has(token);
}

/** Clase (D): descriptor de forma, presentación, envase o vía. Opaco. */
function isDescriptor(token: string): boolean {
  return (
    STOP_WORDS.has(token) ||
    PRESENTATION_FORM_WORDS.has(token) ||
    V2_DESCRIPTOR_TOKENS.has(token)
  );
}

/**
 * Conectores gramaticales que pueden separar una molécula de su dosis sin
 * romper la relación ("ácido acetilsalicílico **de** 500 mg"). Transparentes,
 * como los calificadores.
 */
const CONNECTOR_TOKENS: ReadonlySet<string> = new Set(["de", "del", "y", "e", "con"]);

/**
 * Clase (A) o (C): token con FORMA de nombre de molécula. Tener forma de
 * molécula no demuestra ser una — eso lo decide la corroboración.
 */
function isMoleculeShaped(token: string): boolean {
  return (
    token.length >= MOLECULE_MIN_LENGTH &&
    /^[a-z]+$/.test(token) &&
    !isDescriptor(token) &&
    !isQualifier(token) &&
    !CONNECTOR_TOKENS.has(token)
  );
}

/** Clase (A) por vocabulario: la evidencia independiente del texto. */
function isCorroboratedMolecule(token: string): boolean {
  return (
    (COMPOSITION_VOCABULARY.has(token) && !isQualifier(token)) ||
    V2_MOLECULE_VOCABULARY.has(token)
  );
}

// ---------------------------------------------------------------------------
// D-bis. NEGACIÓN — la molécula que el nombre declara AUSENTE
// ---------------------------------------------------------------------------

/**
 * Marcadores de AUSENCIA. Un nombre puede nombrar una molécula para decir que
 * NO está: "Tapsin Puro **Sin** Cafeína Paracetamol 500 mg".
 */
const NEGATION_TOKENS: ReadonlySet<string> = new Set(["sin", "libre"]);

/** Coordinación NEGATIVA: extiende el alcance de `sin` a otra molécula. */
const NEGATIVE_COORDINATION_TOKENS: ReadonlySet<string> = new Set(["ni"]);

/**
 * Moléculas que el nombre declara AUSENTES, y que por lo tanto ninguna fuente de
 * evidencia puede afirmar como presentes.
 *
 * POR QUÉ HACE FALTA, Y POR QUÉ ES LA MISMA CLASE DE DEFECTO QUE ADORLAN. Medido
 * sobre el corpus congelado al agregar `cafeina` a `V2_MOLECULE_VOCABULARY`:
 *
 *     ahumada    "Tapsin Puro SIN Cafeina 500 mg x 24 Comprimidos"     → ing=cafeina
 *     araucomed  "Tapsin Dolor de Cabeza CON cafeína x 12 comprimidos" → ing=cafeina
 *
 * compartían concepto. Un producto formulado explícitamente SIN cafeína declarado
 * como el mismo Concepto Farmacéutico que uno CON cafeína. Y
 * "Tapsin Puro Sin Cafeina Paracetamol 500 mg" se leía como la ASOCIACIÓN
 * paracetamol+cafeína, que es justo lo contrario de lo que el nombre dice.
 *
 * Nombrar una molécula no demuestra que esté: la gramática de la negación es
 * evidencia POSITIVA de ausencia, y tratarla como presencia es inventar
 * composición — lo que la regla de honestidad prohíbe.
 *
 * ALCANCE DELIBERADAMENTE CORTO, para no negar de más:
 *   · la PRIMERA molécula después del marcador ("sin cafeína **paracetamol**
 *     500 mg" niega `cafeina`, NUNCA `paracetamol`: sin coordinación negativa
 *     explícita, la yuxtaposición no extiende la negación);
 *   · más las que se encadenen con una coordinación NEGATIVA (`ni`), que es la
 *     única que en castellano no puede significar otra cosa.
 * Un descriptor, una magnitud o cualquier otro token cierran el alcance.
 */
function negatedMolecules(tokens: ScanToken[]): Set<string> {
  const negated = new Set<string>();

  for (let i = 0; i < tokens.length; i++) {
    const marker = tokens[i]!;
    if (marker.kind !== "word" || !NEGATION_TOKENS.has(marker.text)) continue;

    let expectingMolecule = true;
    for (let j = i + 1; j < tokens.length; j++) {
      const next = tokens[j]!;
      if (next.kind !== "word") break;
      if (isQualifier(next.text) || CONNECTOR_TOKENS.has(next.text)) continue;
      if (NEGATIVE_COORDINATION_TOKENS.has(next.text)) {
        expectingMolecule = true;
        continue;
      }
      if (!expectingMolecule) break;
      if (!isMoleculeShaped(next.text)) break;
      negated.add(next.text);
      expectingMolecule = false;
    }
  }

  return negated;
}

// ---------------------------------------------------------------------------
// E. ARIDAD TIPOGRÁFICA — razón de dosis masa/masa
// ---------------------------------------------------------------------------

/**
 * Una corrida `N / M [/ K …]` de magnitudes, tal como aparece en el texto.
 * Sirve para decidir si describe una RAZÓN DE DOSIS entre componentes activos
 * ("875/125") o una CONCENTRACIÓN masa/volumen ("30 mg/5 ml"), que son cosas
 * distintas y solo la primera declara cardinalidad.
 */
interface MagnitudeRun {
  units: (string | null)[];
}

const RUN_RE = new RegExp(
  `(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_ALTERNATION})(?![a-z]))?` +
    `(?:\\s*\\/\\s*(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_ALTERNATION})(?![a-z]))?)+`,
  "g"
);

const ELEMENT_RE = new RegExp(
  `(\\d+(?:[.,]\\d+)?)(?:\\s*(${UNIT_ALTERNATION})(?![a-z]))?`,
  "g"
);

function magnitudeRuns(text: string): MagnitudeRun[] {
  const runs: MagnitudeRun[] = [];
  for (const match of text.matchAll(RUN_RE)) {
    const units: (string | null)[] = [];
    for (const element of match[0].matchAll(ELEMENT_RE)) {
      units.push(element[2] === undefined ? null : (UNIT_ALIASES.get(element[2]) ?? null));
    }
    runs.push({ units });
  }
  return runs;
}

/**
 * Cantidad de componentes activos que una razón de dosis masa/masa declara, o
 * `0` si el nombre no declara ninguna.
 *
 * LAS DOS REGLAS SALEN DE MEDIR EL CORPUS, no de intuición. Sobre los nombres
 * únicos del corpus congelado hay 37 corridas `N/M` SIN NINGUNA UNIDAD y las 37
 * son razones de dosis reales ("875/125" de amoxicilina/clavulánico, "25/25" de
 * Adorlan, "50/12,5" de losartán/HCTZ, "37.5/325" de tramadol/paracetamol) — cero
 * falsos positivos tipo fecha. Por eso una corrida sin unidades se acepta.
 *
 *   1. SE CORTA EN EL PRIMER ELEMENTO DE VOLUMEN. "Clavam Duo 400 mg/57 mg/5 mL"
 *      es una razón de dosis (400/57) seguida del denominador de la
 *      concentración (/5 mL): la corrida se trunca antes del volumen y quedan dos
 *      elementos. Si el volumen es el segundo elemento —"30 mg/5 ml"— la corrida
 *      truncada tiene un solo elemento y NO declara nada, que es lo correcto: eso
 *      es una concentración, no una asociación.
 *
 *   2. SE ACEPTA SI EL ÚLTIMO ELEMENTO LLEVA UNIDAD DE MASA, O SI NINGÚN ELEMENTO
 *      LLEVA UNIDAD. Es la regla que descarta el único contraejemplo real del
 *      corpus: "Ambroxol Pediatrico 15mg/5..." (EasyFarma, nombre TRUNCADO por la
 *      fuente) produce la corrida "15mg/5", con masa en el PRIMER elemento y nada
 *      en el segundo. No es una asociación: es "15 mg/5 ml" al que le cortaron la
 *      unidad. Leerla como asociación habría partido un monofármaco de ambroxol.
 */
export function declaredArityFromDoseRatio(name: string): number {
  let best = 0;
  for (const run of magnitudeRuns(scanText(name))) {
    const volumeAt = run.units.findIndex((unit) => unit !== null && isVolumeUnit(unit));
    const units = volumeAt === -1 ? run.units : run.units.slice(0, volumeAt);
    if (units.length < 2) continue;

    const last = units[units.length - 1]!;
    const acceptable =
      (last !== null && isMassUnit(last)) || units.every((unit) => unit === null);
    if (acceptable) best = Math.max(best, units.length);
  }
  return best;
}

// ---------------------------------------------------------------------------
// F. ANOTACIÓN DE DOSIS — la evidencia estructural
// ---------------------------------------------------------------------------

/** Un token con forma de molécula que lleva su propia dosis pegada. */
interface DoseAnnotated {
  token: string;
  strength: Measurement;
}

/**
 * Tokens con forma de molécula que llevan SU PROPIA dosis inmediatamente
 * después, atravesando únicamente calificadores químicos y conectores.
 *
 * ES LA FIRMA ESTRUCTURAL DE UNA ASOCIACIÓN ESCRITA SIN SEPARADOR: un
 * monofármaco nombra su molécula UNA vez con UNA dosis; una asociación repite el
 * patrón `<molécula> <dosis>` por cada componente. Es lo que hace legible
 * "diclofenaco 25 mg tramadol 25 mg", "paracetamol 500 mg ibuprofeno 200 mg" y
 * "losartan 50 mg hidroclorotiazida 12.5 mg" sin un solo símbolo separador y sin
 * un patrón específico por producto.
 *
 * QUÉ BLOQUEA LA ANOTACIÓN, Y POR QUÉ CADA COSA:
 *   · un DESCRIPTOR (clase D) — entre una molécula y su dosis no se interpone una
 *     forma farmacéutica; si aparece, la cifra que sigue describe otra cosa;
 *   · otra PALABRA con forma de molécula — en "ácido clavulánico 125 mg" la dosis
 *     es de `clavulanico`, no de lo que venga antes;
 *   · una magnitud SIN unidad de masa — "Adorlan 25/25" no le da dosis a
 *     `adorlan`, y por eso una marca no se anota nunca. Es la propiedad que hace
 *     que este mecanismo no promueva marcas: las marcas encabezan el nombre y la
 *     razón de dosis que las sigue no lleva unidad.
 *
 * Los calificadores (clase B) SÍ se atraviesan: "losartan **potasico** 50 mg" y
 * "naproxeno **sodico** 550 mg" anotan la molécula, no la sal — y la sal, que es
 * clase B, nunca es candidata a componente.
 */
function doseAnnotatedTokens(tokens: ScanToken[]): DoseAnnotated[] {
  const annotated: DoseAnnotated[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i]!;
    if (current.kind !== "word" || !isMoleculeShaped(current.text)) continue;

    for (let j = i + 1; j < tokens.length; j++) {
      const next = tokens[j]!;
      if (next.kind === "word") {
        if (isQualifier(next.text) || CONNECTOR_TOKENS.has(next.text)) continue;
        break;
      }
      if (next.unit === null || !isMassUnit(next.unit)) break;
      annotated.push({
        token: current.text,
        strength: { value: next.value, unit: next.unit },
      });
      break;
    }
  }

  return annotated;
}

// ---------------------------------------------------------------------------
// G. LECTOR COMPLETO
// ---------------------------------------------------------------------------

/**
 * Molécula que un calificador químico encabeza: el token con forma de molécula
 * que sigue INMEDIATAMENTE a "ácido" y compañía.
 *
 * Convierte el `acido` que devuelve `combinationKey()` en el `clavulanico` que
 * el nombre realmente declara, sin tocar `combinationKey()`. Devuelve `null` si
 * no hay ninguna molécula detrás — y entonces no se afirma nada.
 */
function resolveThroughQualifier(tokens: ScanToken[], qualifier: string): string | null {
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i]!;
    if (current.kind !== "word" || current.text !== qualifier) continue;
    for (let j = i + 1; j < tokens.length; j++) {
      const next = tokens[j]!;
      if (next.kind !== "word") break;
      if (isQualifier(next.text) || CONNECTOR_TOKENS.has(next.text)) continue;
      return isMoleculeShaped(next.text) ? next.text : null;
    }
  }
  return null;
}

/**
 * Composición declarada por un nombre: qué moléculas y cuántos componentes.
 *
 * CUATRO FUENTES DE EVIDENCIA, ninguna capaz de inventar una molécula por sí
 * sola, y todas acumulativas:
 *
 *   1. VOCABULARIO — todo token del nombre que esté en `COMPOSITION_VOCABULARY`
 *      o en `V2_MOLECULE_VOCABULARY` y no sea calificador químico.
 *
 *   2. COMBINACIÓN (v1) — el token que `combinationKey()` extrae del separador
 *      explícito, atravesando el calificador cuando lo devuelve ("acido" →
 *      "clavulanico"), más la CABECERA cuando la tipografía demuestra que es el
 *      primer miembro de la combinación (`tokenBeforeCombination`, reproducido
 *      acá sobre el escaneo posicional).
 *
 *   3. POSICIÓN ESTRUCTURAL — un token con forma de molécula que lleva su propia
 *      dosis se promueve a componente SOLO SI hay al menos DOS tokens así en el
 *      nombre y AL MENOS UNO está corroborado por vocabulario. La corroboración
 *      del hermano es lo que impide inventar: demuestra que el nombre usa la
 *      convención `<molécula> <dosis>`, y entonces el token que ocupa la misma
 *      posición estructural es de la misma clase. Un token solo, o dos tokens
 *      sin ningún hermano corroborado, NO se promueven — "Combodart 0,5/0,4
 *      Dutasteride 0,5 mg Tamsulosina 0,4 mg" queda sin moléculas afirmadas.
 *
 *   4. ARIDAD TIPOGRÁFICA — una razón de dosis masa/masa declara CUÁNTOS
 *      componentes hay sin nombrar ninguno. No agrega moléculas; agrega el hecho
 *      de que faltan. Es lo que separa "Zolimax Duo **875/125** Amoxicilina
 *      875 mg" de un monofármaco de amoxicilina 875 mg.
 *
 * Y UN FILTRO QUE SE APLICA ANTES QUE LAS CUATRO: la NEGACIÓN
 * (`negatedMolecules`). Una molécula que el nombre declara ausente —"Tapsin Puro
 * **Sin** Cafeína Paracetamol 500 mg"— no la puede afirmar ninguna fuente, ni
 * siquiera el vocabulario. Nombrar no es afirmar presencia.
 *
 * El conjunto se ordena alfabéticamente: "Losartán + Hidroclorotiazida" y
 * "Hidroclorotiazida + Losartán" son la misma combinación farmacológica y no
 * pueden derivar identidades distintas (CF-SEARCH-011 §10).
 */
export function readIngredientComposition(name: string): IngredientComposition {
  const text = scanText(name);
  const tokens = scan(text);
  // La negación se resuelve ANTES que cualquier fuente de evidencia: una
  // molécula declarada ausente no la puede afirmar ninguna de las cuatro.
  const negated = negatedMolecules(tokens);
  const annotated = doseAnnotatedTokens(tokens).filter((entry) => !negated.has(entry.token));

  const found = new Map<string, IngredientComponent["evidence"]>();
  const strengths = new Map<string, Measurement>();
  for (const entry of annotated) {
    if (!strengths.has(entry.token)) strengths.set(entry.token, entry.strength);
  }

  // --- Fuente 1: vocabulario
  for (const token of tokens) {
    if (token.kind !== "word") continue;
    if (negated.has(token.text)) continue;
    if (!isCorroboratedMolecule(token.text)) continue;
    found.set(token.text, "vocabulary");
  }

  // --- Fuente 2: combinación por separador explícito (v1, sin modificar)
  const rawSecond = combinationKey(name);
  if (rawSecond !== null) {
    const rawResolved = isQualifier(rawSecond)
      ? resolveThroughQualifier(tokens, rawSecond)
      : rawSecond;
    const second =
      rawResolved !== null && !isQualifier(rawResolved) && !negated.has(rawResolved)
        ? rawResolved
        : null;
    // La cabecera es el primer miembro SOLO cuando es el token con forma de
    // molécula inmediatamente a la izquierda del segundo — espejo exacto de cómo
    // `combinationKey()` toma el segundo por la derecha. Sin esta condición, la
    // MARCA entraba como molécula: "Tapsin Duo (B) Paracetamol / Ibuprofeno"
    // producía `ing=ibuprofeno+paracetamol+tapsin`.
    const rawHead = second === null ? null : moleculeBefore(tokens, second);
    const head = rawHead !== null && !negated.has(rawHead) ? rawHead : null;

    // CORROBORACIÓN DEL HERMANO, la misma regla que gobierna la promoción por
    // posición estructural (fuente 3): el par se acepta solo si AL MENOS UNO de
    // sus dos miembros está en un vocabulario de moléculas.
    //
    // Un separador demuestra que hay dos cosas coordinadas, NO que las dos sean
    // principios activos, y el corpus lo prueba con tres nombres reales:
    //
    //   "…Polvo para Soluc.Oral 1 Sobre Sabor **Limón / Miel** / Jengibre"
    //        → ing=…+limon+miel   (saborizantes)
    //   "Zomel HP **Triterapia**"
    //        → ing=zomel+triterapia   (una MARCA y un régimen posológico)
    //
    // Con la corroboración exigida, esos nombres dejan de afirmar composición y
    // pasan a `unresolvedIdentityDiscriminator`, que es lo que corresponde.
    // Los pares legítimos se conservan enteros porque en TODOS al menos un lado
    // está demostrado: `paracetamol` sostiene a `tramadol`, `hidroclorotiazida`
    // sostiene a `lorsartan` (error tipográfico de la farmacia) y `clavulanico`
    // sostiene a `amoxicilina`.
    const corroboratedPair =
      (second !== null && isCorroboratedMolecule(second)) ||
      (head !== null && isCorroboratedMolecule(head));

    if (corroboratedPair) {
      if (second !== null && !found.has(second)) found.set(second, "combination");
      if (head !== null && !found.has(head)) found.set(head, "combination");
    }
  }

  // --- Fuente 3: posición estructural
  const corroborated = annotated.filter(
    (entry) => isCorroboratedMolecule(entry.token) || found.has(entry.token)
  );
  if (annotated.length >= 2 && corroborated.length >= 1) {
    for (const entry of annotated) {
      if (!found.has(entry.token)) found.set(entry.token, "dose-annotated");
    }
  }

  const components: IngredientComponent[] = [...found.entries()]
    .map(([token, evidence]) => ({
      token,
      evidence,
      strength: strengths.get(token) ?? null,
    }))
    .sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));

  // --- Fuente 4: aridad tipográfica
  const declaredComponentCount = Math.max(
    components.length,
    declaredArityFromDoseRatio(name)
  );

  return {
    components,
    declaredComponentCount,
    isAssociation: declaredComponentCount > 1,
    isComplete: components.length > 0 && components.length >= declaredComponentCount,
  };
}

/**
 * Token con forma de molécula inmediatamente anterior a `second`, atravesando
 * calificadores químicos, conectores y magnitudes. Devuelve `null` si lo anterior
 * es un descriptor o no hay nada.
 *
 * Es la versión posicional de `tokenBeforeCombination()`: reproduce su intención
 * —confirmar que la cabecera es el PRIMER miembro de la combinación, no una
 * marca— sobre el mismo escaneo que usa el resto del lector, para que las dos
 * mitades de la evidencia (izquierda y derecha del separador) se decidan con el
 * mismo vocabulario de clases.
 *
 * Sigue siendo indispensable: "Tramadol Clorhidrato/Paracetamol" y "Lorsartán
 * Potásico / Hidroclorotiazida" tienen la cabecera FUERA del vocabulario
 * (`tramadol` está en el de v2, pero "Lorsartán" es un error tipográfico de la
 * farmacia), y perderla dejaría `ing=paracetamol` e `ing=hidroclorotiazida`:
 * una asociación indistinguible del monofármaco.
 */
function moleculeBefore(tokens: ScanToken[], second: string): string | null {
  const index = tokens.findIndex((t) => t.kind === "word" && t.text === second);
  if (index <= 0) return null;
  for (let i = index - 1; i >= 0; i--) {
    const token = tokens[i]!;
    if (token.kind === "magnitude") continue;
    if (isQualifier(token.text) || CONNECTOR_TOKENS.has(token.text)) continue;
    if (token.text.length <= 2) continue;
    return isMoleculeShaped(token.text) ? token.text : null;
  }
  return null;
}
