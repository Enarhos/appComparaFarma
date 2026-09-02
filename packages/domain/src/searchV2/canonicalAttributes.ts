/**
 * Search Engine v2 — Etapa 2: CANONICALIZATION (CF-SEARCH-011, S0).
 *
 * Convierte texto libre en atributos tipados. **No decide qué es igual a qué**:
 * ninguna función de este módulo compara dos ofertas entre sí. Esa es la
 * separación que v1 no tiene — allí `matchKey()` lee y decide en la misma
 * concatenación — y es lo que permite auditar por separado un error de LECTURA
 * de un error de RESOLUCIÓN.
 *
 * QUÉ SE REUTILIZA DE v1, SIN MODIFICARLO
 *   `normalizedWords`, `brandHeadTokens`, `combinationKey`  → matching.ts
 *   `dosageFormClass`, `unitCountKey`, `commercialVariantKey` → productIdentity.ts
 *   `brandFromName`, `COMPOSITION_VOCABULARY`               → brandIdentity.ts
 *   `parseMeasurements`                                      → concentration.ts
 *
 * QUÉ SE LEE DISTINTO EN v2, Y POR QUÉ NO SE CAMBIA v1
 *   - CONCENTRACIÓN: ver `canonicalConcentration.ts`.
 *   - PRINCIPIOS ACTIVOS: v1 publica UNO (`activeIngredient`) y solo de forma
 *     informativa. v2 necesita el CONJUNTO, ordenado, porque es el eje central
 *     de la identidad del concepto y porque el orden textual no debe crear
 *     identidades distintas (CF-SEARCH-011 §10).
 *   - VOLUMEN DE ENVASE: v1 no tiene ningún campo para él — `matchKey` lo mete
 *     en el mismo segmento que la cantidad, que es el defecto de las 141 ofertas
 *     `x 100 ml` (CF-SEARCH-011 §8). En v2 es una dimensión propia.
 */

import {
  brandHeadTokens,
  combinationKey,
  normalizedWords,
  SALT_QUALIFIER_WORDS,
} from "../matching.js";
import { brandFromName, COMPOSITION_VOCABULARY } from "../brandIdentity.js";
import { commercialVariantKey, dosageFormClass, unitCountKey } from "../productIdentity.js";
import {
  concentrationRatio,
  isVolumeUnit,
  parseMeasurements,
  type Measurement,
} from "../concentration.js";
import { formatConcentration, readConcentrationEvidence } from "./canonicalConcentration.js";
import {
  ADMINISTRATION_ROUTE_BY_CANONICAL_FORM,
  type ActiveIngredient,
  type AdministrationRoute,
  type CanonicalAttributes,
  type CanonicalDosageForm,
  type RawOfferInput,
} from "./canonicalTypes.js";

// ---------------------------------------------------------------------------
// A. PRINCIPIOS ACTIVOS
// ---------------------------------------------------------------------------

/**
 * Iones, sales y ésteres que acompañan a un principio activo sin ser uno.
 *
 * Extiende `SALT_QUALIFIER_WORDS` (matching.ts) con las entradas que están en
 * `COMPOSITION_VOCABULARY` y que, leídas como molécula, producirían un principio
 * activo falso: "Cetirizina **Diclorhidrato** 10 mg" no es una combinación de
 * cetirizina con diclorhidrato, y "Naproxeno **Sodio**" no es una combinación
 * con sodio.
 *
 * Vive en la capa v2 y no en `matching.ts` a propósito: agregar entradas a
 * `SALT_QUALIFIER_WORDS` cambiaría `combinationKey()` y, por su intermedio,
 * `presentationKey` y los slugs de Web — es decir, comportamiento de v1, que en
 * S0 es inmutable (CF-SEARCH-011 §4).
 *
 * Es una categoría acotada y explícita, no un intento de enumerar la química
 * farmacéutica: cada entrada está en `COMPOSITION_VOCABULARY` y es un ion o una
 * sal, no una molécula con efecto terapéutico propio en este contexto.
 */
const ION_AND_SALT_TOKENS: ReadonlySet<string> = new Set([
  ...SALT_QUALIFIER_WORDS,
  "sodio",
  "calcio",
  "potasio",
  "magnesio",
  "diclorhidrato",
  "dihidrocloruro",
  "cloruro",
]);

/**
 * Conjunto de principios activos DEMOSTRADOS en el nombre, ordenado
 * alfabéticamente y sin duplicados. Devuelve `[]` cuando no se puede demostrar
 * ninguno — y `[]` es un resultado legítimo, no un fallo.
 *
 * DOS FUENTES DE EVIDENCIA, las dos medidas, ninguna inventada:
 *
 *   1. VOCABULARIO — todo token del nombre que esté en `COMPOSITION_VOCABULARY`
 *      (CF-DATA-001: 34 moléculas derivadas de una medición reproducible sobre
 *      3.697 ofertas, no de criterio humano) y no sea un ion o una sal.
 *      Es lo que resuelve estructuralmente el defecto de las 65 ofertas donde
 *      "ambroxol" se leía como variante comercial (CF-SEARCH-011 §9): acá
 *      `ambroxol` es un PRINCIPIO ACTIVO por vocabulario, y la variante
 *      comercial se lee después y nunca puede reclamarlo.
 *
 *   2. COMBINACIÓN — el segundo principio activo que `combinationKey()`
 *      (CF-SEARCH-001/S-1) extrae de "Losartán + Hidroclorotiazida", incluso
 *      cuando ese token no está en el vocabulario. Es la evidencia que mantiene
 *      separada la identidad de "Losartán 50 mg" y "Losartán 50 mg +
 *      Hidroclorotiazida 12,5 mg" (CF-SEARCH-011 §10).
 *
 * NO HAY UNA TERCERA FUENTE (revisión CTO PR #159, punto 2). Hasta esta
 * revisión, cuando las dos anteriores no producían nada esta función devolvía la
 * CABECERA del nombre marcada como `unresolved-head` DENTRO del array de
 * `ActiveIngredient[]`. Aunque la marca fuera honesta, el tipo afirmaba lo
 * contrario: "Tapsin Forte" terminaba con `tapsin` tipado como principio activo,
 * firmado como `ing=tapsin` con `known=true`, y llegando a `canonicalName`.
 * "Tapsin Forte" no demuestra que "tapsin" sea una molécula.
 *
 * La cabecera sigue existiendo —hace falta, y por un motivo de seguridad real—
 * pero como OTRA COSA: `readUnresolvedIdentityDiscriminator()`. Ver ahí por qué
 * separar las dos responsabilidades no debilita la protección contra merges.
 *
 * El conjunto se ordena alfabéticamente: "Losartán + Hidroclorotiazida" y
 * "Hidroclorotiazida + Losartán" son la MISMA combinación farmacológica y no
 * pueden derivar identidades distintas (CF-SEARCH-011 §10).
 */
export function readActiveIngredients(name: string): ActiveIngredient[] {
  const tokens = normalizedWords(name);
  const found = new Map<string, ActiveIngredient["evidence"]>();

  for (const token of tokens) {
    if (!COMPOSITION_VOCABULARY.has(token)) continue;
    if (ION_AND_SALT_TOKENS.has(token)) continue;
    found.set(token, "vocabulary");
  }

  const second = combinationKey(name);
  if (second !== null && !ION_AND_SALT_TOKENS.has(second) && !found.has(second)) {
    found.set(second, "combination");
  }

  // La cabecera es el PRIMER principio activo de la combinación SOLO cuando la
  // tipografía lo demuestra: cuando es el token que está inmediatamente a la
  // IZQUIERDA del separador, espejo exacto de cómo `combinationKey()` toma el
  // segundo por la derecha.
  //
  // Antes bastaba con que `combinationKey()` reconociera una combinación para
  // que la cabecera entrara como principio activo, y eso convertía la MARCA en
  // molécula en 31 de los 32 nombres del corpus que pasaban por esta rama:
  // "Tapsin Duo (B) Paracetamol / Ibuprofeno" producía
  // `ing=ibuprofeno+paracetamol+tapsin`. La combinación está entre paracetamol e
  // ibuprofeno; "tapsin" solo estaba delante.
  //
  // La condición no se puede reemplazar por "no agregues nada si el vocabulario
  // ya encontró algo": los otros 2 casos del corpus son
  // "Tramadol Clorhidrato/Paracetamol" y "Lorsartán Potásico / Hidroclorotiazida",
  // donde la cabecera SÍ es el primer principio activo —tramadol no está en el
  // vocabulario, "Lorsartán" es un error tipográfico de la farmacia— y perderla
  // dejaría `ing=paracetamol` e `ing=hidroclorotiazida`: una asociación
  // indistinguible del monofármaco, que es un falso merge con riesgo clínico.
  if (second !== null) {
    const head = brandHeadTokens(tokens).join("");
    if (
      head &&
      !ION_AND_SALT_TOKENS.has(head) &&
      !found.has(head) &&
      tokenBeforeCombination(tokens, second) === head
    ) {
      found.set(head, "combination");
    }
  }

  return [...found.entries()]
    .map(([token, evidence]) => ({ token, evidence }))
    .sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
}

/**
 * Token que precede al segundo principio activo de una combinación, saltando lo
 * que no puede ser una molécula: sales e iones ("Tramadol CLORHIDRATO /
 * Paracetamol"), abreviaturas de dos letras o menos ("Zomel HP Triterapia") y
 * cualquier token con dígitos.
 *
 * Devuelve `null` si no encuentra ninguno. Es la evidencia tipográfica de que un
 * token es el PRIMER elemento de la combinación, no de que sea una molécula
 * conocida: por eso solo se usa para CONFIRMAR la cabecera, nunca para promover
 * un token cualquiera a principio activo.
 */
function tokenBeforeCombination(tokens: string[], second: string): string | null {
  const index = tokens.indexOf(second);
  if (index <= 0) return null;
  for (let i = index - 1; i >= 0; i--) {
    const token = tokens[i]!;
    if (token.length <= 2) continue;
    if (/\d/.test(token)) continue;
    if (ION_AND_SALT_TOKENS.has(token)) continue;
    return token;
  }
  return null;
}

/**
 * Discriminante de identidad NO RESUELTA: la cabecera textual del nombre cuando
 * no se pudo demostrar ningún principio activo. `null` en cualquier otro caso.
 *
 * QUÉ ES Y QUÉ NO ES
 * ------------------
 * NO es un principio activo, no se tipa como tal, no entra en `canonicalName`
 * como composición y no cuenta en ninguna métrica de cobertura farmacológica.
 * Es un HECHO TEXTUAL —"el nombre empieza por este token y no reconocimos
 * ninguna molécula en él"— usado con un único fin: impedir fusiones inseguras.
 *
 * POR QUÉ HACE FALTA IGUAL
 * ------------------------
 * Sin discriminante, "Tapsin Forte x 30 comprimidos" tendría el conjunto de
 * ingredientes vacío, su eje `ing` sería DESCONOCIDO, y una firma desconocida es
 * subsumible: podría absorberse dentro del concepto "paracetamol 500 mg
 * comprimido" por pura ausencia de evidencia. Eso es exactamente la identidad
 * falsa que CF-SEARCH-011 §5 prohíbe.
 *
 * CÓMO SE PRESERVA LA PROTECCIÓN SIN AFIRMAR NADA
 * -----------------------------------------------
 * El discriminante es un EJE PROPIO de la firma del concepto (`disc`), siempre
 * DECLARADO: vale la cabecera cuando hay una, y `none` cuando el concepto sí
 * tiene principios activos demostrados. Dos valores declarados y distintos son
 * incompatibles, así que:
 *
 *   · `disc=tapsin` vs `disc=none` → incompatible → Tapsin nunca se fusiona con
 *     un concepto de principio activo conocido;
 *   · `disc=tapsin` vs `disc=muxol` → incompatible → dos desconocidos distintos
 *     tampoco se fusionan entre sí;
 *   · `disc=tapsin` vs `disc=tapsin` → equal → las ofertas de Tapsin Forte de
 *     dos farmacias distintas siguen agrupando.
 *
 * El eje `ing`, en cambio, queda honestamente en DESCONOCIDO. La seguridad la
 * aporta `disc`; el conocimiento farmacológico lo aporta `ing`. Antes las dos
 * cosas viajaban en el mismo eje y por eso el modelo afirmaba lo que no sabía.
 */
export function readUnresolvedIdentityDiscriminator(name: string): string | null {
  if (readActiveIngredients(name).length > 0) return null;
  const head = brandHeadTokens(normalizedWords(name)).join("");
  return head.length > 0 ? head : null;
}

// ---------------------------------------------------------------------------
// A-bis. FORMA FARMACÉUTICA CANÓNICA Y VÍA DE ADMINISTRACIÓN (EDM-100)
// ---------------------------------------------------------------------------

/**
 * Token del nombre → Forma Farmacéutica canónica.
 *
 * El ORDEN de evaluación es el mismo que el de `DOSAGE_FORM_RULES` en v1 y por
 * el mismo motivo medido: el envase manda sobre su contenido. "Omeprazol 20 mg
 * x 30 cápsulas con gránulos con recubrimiento entérico" es una CÁPSULA, no un
 * granulado; si `granulo` ganara, esa oferta dejaría de agrupar con "Omeprazol
 * 20 mg x 30 cápsulas" de otra farmacia.
 *
 * Los submodificadores ("recubierto", "masticable", "dispersable",
 * "efervescente", "blanda", "liberación prolongada") se ignoran, igual que en
 * v1: cada farmacia los escribe o los omite a discreción y usarlos partiría
 * artículos idénticos — la regresión que S-1 documentó con "Hyzaar …
 * Comprimidos Recubiertos".
 */
const CANONICAL_FORM_RULES: ReadonlyArray<readonly [CanonicalDosageForm, ReadonlySet<string>]> = [
  ["parche", new Set(["parche", "parches"])],
  ["ovulo", new Set(["ovulo", "ovulos", "ovul"])],
  ["supositorio", new Set(["supositorio", "supositorios", "suposit"])],
  [
    "inyectable",
    new Set([
      "inyectable", "inyectables", "iny", "ampolla", "ampollas", "ampolleta",
      "ampolletas", "vial", "viales", "jeringa", "jeringas",
    ]),
  ],
  [
    "inhalador",
    new Set([
      "inhalador", "inhaladores", "inh", "aerosol", "inhalacion", "inhalaciones",
      "puff", "puffs", "nebulizacion",
    ]),
  ],
  ["gotas-oticas", new Set(["otico", "otica", "oticas", "oticos"])],
  ["colirio", new Set(["colirio", "oftalmico", "oftalmica", "oftalmicas", "oft"])],
  ["shampoo", new Set(["shampoo", "champu"])],
  ["locion", new Set(["locion", "lociones"])],
  ["pomada", new Set(["pomada", "pomadas", "pom", "unguento", "unguentos", "ung"])],
  ["gel", new Set(["gel", "geles"])],
  ["crema", new Set(["crema", "cremas", "crm"])],
  [
    "comprimido",
    new Set([
      "comprimido", "comprimidos", "comp", "comps",
      "tableta", "tabletas", "tab", "tabs",
      "gragea", "grageas", "pastilla", "pastillas",
    ]),
  ],
  ["capsula", new Set(["capsula", "capsulas", "cap", "caps", "cps", "perla", "perlas"])],
  [
    "liquido-oral",
    new Set([
      "jarabe", "jbe", "suspension", "suspensiones", "susp", "sus",
      "solucion", "soluciones", "sol", "elixir", "emulsion", "liq",
      "gota", "gotas", "gts",
      "polvo", "polvos", "sobre", "sobres", "sachet", "sachets",
      "granulado", "granulados", "granulo", "granulos",
    ]),
  ],
];

/** Cantidad y forma pegadas en un solo token ("x80com", "100comp", "30caps"). */
const GLUED_COMPRIMIDO_TOKEN = /^x?\d+(com|comp|comps|tab|tabs)$/;
const GLUED_CAPSULA_TOKEN = /^x?\d+(cap|caps|cps)$/;

/**
 * Forma Farmacéutica canónica declarada en el nombre, o `null`.
 *
 * `null` NO significa "incompatible": una oferta que no declara forma es una
 * lectura INCOMPLETA y el eje queda desconocido, así que puede subsumirse bajo
 * una firma completa compatible. Es la misma política que v1 aplica con
 * `dosageFormClass`, con el tercer estado explícito que v1 no tiene.
 */
export function readCanonicalDosageForm(name: string): CanonicalDosageForm | null {
  const tokens = normalizedWords(withoutFormAnnotations(name));
  const tokenSet = new Set(tokens);
  for (const [form, words] of CANONICAL_FORM_RULES) {
    for (const word of words) {
      if (tokenSet.has(word)) return form;
    }
  }
  if (tokens.some((token) => GLUED_COMPRIMIDO_TOKEN.test(token))) return "comprimido";
  if (tokens.some((token) => GLUED_CAPSULA_TOKEN.test(token))) return "capsula";
  return null;
}

/**
 * Anotaciones entre paréntesis: las farmacias meten ahí el laboratorio y
 * avisos ("(Mintlab)", "(Vence 30-07-2026)"), no la forma. Se recorta por el
 * mismo motivo por el que `dosageFormClass` usa `withoutAnnotations`, pero con
 * una implementación local: la de v1 es privada de `productIdentity.ts` y S0 no
 * modifica v1 (CF-SEARCH-011 §4).
 */
function withoutFormAnnotations(name: string): string {
  return name.replace(/\([^)]*\)/g, " ");
}

/**
 * Vocabulario de vía DECLARADA en el texto. Solo entradas inequívocas: "oral"
 * aparece en "solución oral" y en "polvo para suspensión oral", siempre con el
 * mismo significado.
 */
const DECLARED_ROUTE_BY_TOKEN: ReadonlyMap<string, AdministrationRoute> = new Map([
  ["oral", "oral"], ["orales", "oral"], ["bucal", "oral"], ["sublingual", "oral"],
  ["topico", "topical"], ["topica", "topical"], ["topicas", "topical"], ["topicos", "topical"],
  ["dermico", "topical"], ["dermica", "topical"], ["cutaneo", "topical"], ["cutanea", "topical"],
  ["intramuscular", "parenteral"], ["endovenoso", "parenteral"], ["endovenosa", "parenteral"],
  ["intravenoso", "parenteral"], ["intravenosa", "parenteral"], ["subcutanea", "parenteral"],
  ["subcutaneo", "parenteral"], ["parenteral", "parenteral"],
  ["inhalatoria", "inhalation"], ["inhalatorio", "inhalation"],
  ["oftalmico", "ophthalmic"], ["oftalmica", "ophthalmic"],
  ["otico", "otic"], ["otica", "otic"],
  ["nasal", "nasal"], ["nasales", "nasal"],
  ["rectal", "rectal"], ["rectales", "rectal"],
  ["vaginal", "vaginal"], ["vaginales", "vaginal"],
]);

/**
 * Vía de Administración (EDM-100, dimensión 4).
 *
 * POR QUÉ ES UN EJE Y NO UN ADORNO — respuesta al punto 1 de la revisión CTO.
 *
 * Sobre la clase gruesa de v1, la vía era una FUNCIÓN TOTAL de la forma
 * (`ADMINISTRATION_ROUTE_BY_FORM` mapea las 8 clases a exactamente una vía), y
 * por lo tanto añadirla a la firma habría tenido cero poder discriminante: la
 * partición de conceptos habría sido idéntica. Ese era el argumento original, y
 * era formalmente correcto PARA ESE MODELO.
 *
 * No es un contrato de dominio válido, y hay dos razones medibles:
 *
 *   1. Una misma forma SÍ admite más de una vía en la realidad. El propio EDM
 *      enumera "Intravenosa" e "Intramuscular" como vías distintas y las dos se
 *      administran por ampolla; una "solución" puede ser oral, tópica u
 *      oftálmica.
 *   2. La derivación de v1 produce afirmaciones FALSAS que solo se ven al mirar
 *      la vía: un óvulo no se administra por vía rectal, y unas gotas óticas no
 *      se administran por vía oftálmica. `CanonicalDosageForm` separa esas
 *      formas y la tabla las manda a `vaginal` y `otic`.
 *
 * PRECEDENCIA — la vía DECLARADA en el texto gana sobre la derivada, pero solo
 * se consulta cuando la forma no permite derivarla. Es la dirección
 * conservadora: convertir un eje desconocido en conocido solo puede AÑADIR
 * incompatibilidades (más splits), nunca habilitar una fusión nueva. Sustituir
 * una vía ya derivada por una declarada sí podría hacerlo, y no hay ningún caso
 * en el corpus congelado que lo justifique.
 */
export function readAdministrationRoute(
  name: string,
  form: CanonicalDosageForm | null
): AdministrationRoute | null {
  if (form !== null) return ADMINISTRATION_ROUTE_BY_CANONICAL_FORM[form];
  for (const token of normalizedWords(withoutFormAnnotations(name))) {
    const route = DECLARED_ROUTE_BY_TOKEN.get(token);
    if (route) return route;
  }
  return null;
}

// ---------------------------------------------------------------------------
// B. ENVASE — cantidad, volumen, unidad, tipo
// ---------------------------------------------------------------------------

/**
 * Volumen del envase declarado en el nombre, o `null`.
 *
 * Es la dimensión que v1 NO TIENE. `matchKey()` mete el volumen en el mismo
 * segmento que la dosis (`mlHits` antes que `mgHits`, con `Math.max`), y
 * `unitCountKey()` lo descarta correctamente como cantidad pero no lo conserva
 * en ninguna parte. Resultado medido en CF-SEARCH-010: 141 ofertas donde
 * `x 100 ml` acaba representado como "100 unidades" en la identidad legacy.
 *
 * Reglas:
 *   - solo magnitudes de volumen SUELTAS (`denominator === null`): el `5 ml` de
 *     `30 mg/5 ml` es el denominador de la concentración, no el frasco;
 *   - si hay varias, gana la MAYOR ("Jarabe 100 ml x 2 frascos de 60 ml" es un
 *     caso que el catálogo no produce, pero la regla debe ser determinista y no
 *     depender del orden de escritura).
 */
export function readPackageVolume(name: string): Measurement | null {
  const volumes = parseMeasurements(name)
    .filter((m) => m.denominator === null && isVolumeUnit(m.numerator.unit))
    .map((m) => m.numerator);
  if (volumes.length === 0) return null;

  let best = volumes[0]!;
  let bestBase = volumeBaseValue(best);
  for (const candidate of volumes.slice(1)) {
    const base = volumeBaseValue(candidate);
    if (base > bestBase) {
      best = candidate;
      bestBase = base;
    }
  }
  return best;
}

/** Valor del volumen en mililitros, reutilizando la conversión de `concentration.ts`. */
function volumeBaseValue(measurement: Measurement): number {
  return concentrationRatio({ numerator: measurement, denominator: null })?.value ?? measurement.value;
}

/**
 * Sustantivos de UNIDAD FARMACÉUTICA (EDM-100, dimensión 5) mapeados a su forma
 * singular canónica.
 *
 * SÍ ES UN EJE DE IDENTIDAD desde la revisión del PR #159. El argumento original
 * para excluirla era que "comprimido" y "tableta" son la misma unidad escrita
 * por dos farmacias distintas y que "Omeprazol 20 mg x 30" no la declara, así
 * que usarla como eje reintroduciría fragmentación. Las dos observaciones son
 * ciertas y ninguna de las dos sostiene la conclusión:
 *
 *   · la sinonimia la resuelve ESTA TABLA — `tableta`, `tab`, `gragea` y
 *     `pastilla` ya normalizan a `comprimido`, y `perla` a `capsula`; el eje
 *     compara unidades canónicas, no texto crudo;
 *   · la ausencia la resuelve el TERCER ESTADO de la firma — un nombre que no
 *     declara unidad tiene el eje DESCONOCIDO, y un eje desconocido es
 *     subsumible bajo la única firma completa compatible. No parte nada.
 *
 * El argumento excluía la dimensión razonando con la aritmética de dos estados
 * de v1, dentro de un motor que tiene tres. Es la dimensión que separa un sobre
 * de polvo de un frasco de jarabe cuando la forma canónica (`liquido-oral`) no
 * puede — y es justamente para eso que el EDM la enumera aparte de la Forma
 * Farmacéutica.
 */
const PHARMACEUTICAL_UNIT_BY_TOKEN: ReadonlyMap<string, string> = new Map([
  ["comprimido", "comprimido"], ["comprimidos", "comprimido"],
  ["comp", "comprimido"], ["comps", "comprimido"], ["com", "comprimido"],
  ["tableta", "comprimido"], ["tabletas", "comprimido"],
  ["tab", "comprimido"], ["tabs", "comprimido"],
  ["gragea", "comprimido"], ["grageas", "comprimido"],
  ["capsula", "capsula"], ["capsulas", "capsula"],
  ["cap", "capsula"], ["caps", "capsula"], ["cps", "capsula"],
  ["perla", "capsula"], ["perlas", "capsula"],
  ["sobre", "sobre"], ["sobres", "sobre"],
  ["sachet", "sobre"], ["sachets", "sobre"],
  ["ampolla", "ampolla"], ["ampollas", "ampolla"],
  ["ampolleta", "ampolla"], ["ampolletas", "ampolla"],
  ["jeringa", "jeringa"], ["jeringas", "jeringa"],
  ["supositorio", "supositorio"], ["supositorios", "supositorio"],
  ["ovulo", "ovulo"], ["ovulos", "ovulo"],
  ["parche", "parche"], ["parches", "parche"],
  ["pastilla", "comprimido"], ["pastillas", "comprimido"],
]);

/** Unidad farmacéutica declarada en el nombre, en forma canónica, o `null`. */
export function readPharmaceuticalUnit(name: string): string | null {
  for (const token of normalizedWords(name)) {
    const unit = PHARMACEUTICAL_UNIT_BY_TOKEN.get(token);
    if (unit) return unit;
  }
  return null;
}

/**
 * Tipo de envase, SOLO cuando el nombre lo declara explícitamente. No entra en
 * ninguna firma de identidad: la evidencia es demasiado escasa e inconsistente
 * entre farmacias (una escribe "Caja 6 sobres" y otra "6 sobres" para el mismo
 * artículo) y usarla como eje sería un falso split garantizado. Se publica como
 * atributo porque el EDM lo declara.
 */
const PACKAGE_TYPE_TOKENS: ReadonlyMap<string, string> = new Map([
  ["caja", "caja"],
  ["frasco", "frasco"], ["fco", "frasco"], ["frascos", "frasco"],
  ["tira", "tira"], ["tiras", "tira"],
  ["blister", "blister"], ["blisters", "blister"],
  ["estuche", "estuche"],
  ["envase", "envase"],
  ["bolsa", "bolsa"],
  ["tubo", "tubo"],
]);

/** Tipo de envase declarado en el nombre, o `null`. */
export function readPackageType(name: string): string | null {
  for (const token of normalizedWords(name)) {
    const type = PACKAGE_TYPE_TOKENS.get(token);
    if (type) return type;
  }
  return null;
}

/**
 * Momento de administración declarado por el nombre (`"day"` / `"night"`), o
 * `null`.
 *
 * POR QUÉ ES UN EJE PROPIO Y NO SALE DE `commercialVariantKey()`
 * -------------------------------------------------------------
 * En v1 este dato existe, pero vive DENTRO de `matchKey()` como segmento `turn`
 * (`/\bnoche\b/ → "n"`, `/\bdia\b/ → "d"`), no en la capa de variante comercial.
 * Y `commercialVariantKey()` no puede verlo: `dia`, `noche` y `plus` están en
 * `STOP_WORDS`, así que "Tapsin Plus Día 16 Comprimidos" y "Tapsin Plus Noche 16
 * Comprimidos" derivan la MISMA variante (`null`).
 *
 * Es decir: en v1 la dimensión "artículo comercial dentro de la marca" está
 * repartida entre dos mecanismos que no se hablan, y la única mitad que separa
 * Día de Noche es la que vive en `matchKey`. Un motor v2 que consumiera solo
 * `commercialVariantKey` fusionaría los dos productos — se verificó sobre el
 * caso de control de CF-SEARCH-001 antes de agregar este lector, y ocurría.
 *
 * v2 unifica la dimensión: variante comercial y momento de administración son
 * dos ejes EXPLÍCITOS del producto comercial, ninguno escondido dentro de una
 * clave farmacológica. La regla de v1 se reproduce en vez de importarse porque
 * en v1 no es una función: es una línea dentro de `matchKey()`, cuyo valor está
 * persistido y no se puede refactorizar en S0.
 *
 * La AUSENCIA es un valor, igual que en v1 (un `turn` vacío forma parte de la
 * clave): "Tapsin Plus x 16" no es "Tapsin Plus Noche x 16".
 */
export function readAdministrationTime(name: string): "day" | "night" | null {
  const tokens = new Set(normalizedWords(name));
  if (tokens.has("noche")) return "night";
  if (tokens.has("dia")) return "day";
  return null;
}

// ---------------------------------------------------------------------------
// C. NOMBRE CANÓNICO CONSTRUIDO
// ---------------------------------------------------------------------------

/**
 * Nombre construido DESDE LOS ATRIBUTOS, nunca copiado del texto de una
 * farmacia (CANONICAL_IDENTITY_MODEL §4).
 *
 *     {marca | principios activos} {variante} {concentración} {forma} {cantidad} {volumen}
 *     → "Muxol Adulto Ambroxol 30 mg/5 ml jarabe 100 ml"
 *
 * En v1 este texto es el nombre crudo de la farmacia que gane `pickCanonicalSlot`,
 * y de ahí salen el título de la tarjeta y la parte legible del slug — por eso
 * el título cambia según qué farmacia respondió. Acá no depende de ninguna.
 *
 * EL NOMBRE NUNCA PRESENTA UNA CABECERA NO RESUELTA COMO PRINCIPIO ACTIVO
 * (revisión CTO PR #159, punto 2). El discriminante no es un ingrediente y por
 * eso no se concatena en la posición de la composición: cuando no hay ningún
 * principio activo demostrado, la cabecera se usa como NOMBRE COMERCIAL —que es
 * lo único que la evidencia respalda— y el concepto lo declara aparte con
 * `identityStatus: "unresolved-ingredient"`. "Tapsin Forte x 30 comprimidos"
 * produce "Tapsin Forte 500 mg comprimido", no "tapsin 500 mg comprimido".
 *
 * El nombre crudo de cada fuente se conserva íntegro en `CanonicalOffer.rawName`
 * (linaje EDM-500) y se sigue mostrando por oferta.
 */
export function buildCanonicalName(parts: {
  activeIngredients: ActiveIngredient[];
  unresolvedIdentityDiscriminator: string | null;
  brand: string | null;
  commercialVariant: string | null;
  concentration: string | null;
  dosageForm: string | null;
  packageQuantity: number | null;
  pharmaceuticalUnit: string | null;
  packageVolume: Measurement | null;
}): string {
  const ingredients = parts.activeIngredients.map((i) => i.token).join(" + ");
  const head =
    parts.brand !== null
      ? ingredients.length > 0
        ? `${parts.brand} ${ingredients}`
        : parts.brand
      : ingredients.length > 0
        ? ingredients
        : capitalize(parts.unresolvedIdentityDiscriminator ?? "");

  const quantity =
    parts.packageQuantity !== null
      ? `x ${parts.packageQuantity}${parts.pharmaceuticalUnit ? ` ${parts.pharmaceuticalUnit}` : ""}`
      : null;
  const volume = parts.packageVolume
    ? `${parts.packageVolume.value} ${parts.packageVolume.unit}`
    : null;

  return [head, parts.commercialVariant, parts.concentration, parts.dosageForm, quantity, volume]
    .filter((segment): segment is string => segment !== null && segment.length > 0)
    .join(" ");
}

/**
 * Mayúscula inicial. Un discriminante no resuelto se muestra como nombre
 * comercial, no como token de composición en minúscula.
 */
function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// D. CANONICALIZACIÓN COMPLETA DE UNA OFERTA
// ---------------------------------------------------------------------------

/**
 * Lee TODOS los atributos canónicos de una observación cruda.
 *
 * ORDEN DE LECTURA (importa, y es el fix estructural de CF-SEARCH-011 §9):
 * los principios activos se resuelven ANTES que la variante comercial. Después,
 * un token que ya fue reconocido como principio activo NO puede publicarse como
 * variante — sin depender de que alguien lo agregue a una lista de ruido. En v1
 * el orden es el contrario y por eso `var:ambroxol` existe en 65 ofertas.
 *
 * EL FABRICANTE NUNCA SE INFIERE DEL NOMBRE. Se toma exclusivamente del campo
 * estructurado de la farmacia (regla dura heredada de CF-DATA-001): derivarlo de
 * texto libre produciría afirmaciones falsas sobre quién fabrica un medicamento.
 */
export function canonicalizeOffer(offer: RawOfferInput): CanonicalAttributes {
  const name = offer.rawName;

  const activeIngredients = readActiveIngredients(name);
  const unresolvedIdentityDiscriminator = readUnresolvedIdentityDiscriminator(name);
  const concentration = readConcentrationEvidence(name);
  const canonicalDosageForm: CanonicalDosageForm | null = readCanonicalDosageForm(name);
  const coarseDosageForm = dosageFormClass(name);
  const route: AdministrationRoute | null = readAdministrationRoute(name, canonicalDosageForm);
  const pharmaceuticalUnit = readPharmaceuticalUnit(name);
  const packageQuantity = unitCountKey(name);
  const packageVolume = readPackageVolume(name);
  const packageType = readPackageType(name);

  const ingredientTokens = new Set(activeIngredients.map((i) => i.token));

  // Variante comercial: se lee con el extractor de v1 y se DESCARTA si el token
  // ya fue reconocido como principio activo. Es la guarda que v1 no puede tener,
  // porque allí la variante se deriva sin conocer el conjunto de ingredientes.
  const rawVariant = commercialVariantKey(name);
  const commercialVariant = rawVariant !== null && !ingredientTokens.has(rawVariant)
    ? rawVariant
    : null;

  const derived = brandFromName(name);
  const brand = normalizeCommercialToken(offer.structuredBrand) ?? derived.brand;
  const manufacturer = normalizeCommercialToken(offer.structuredManufacturer);

  const canonicalName = buildCanonicalName({
    activeIngredients,
    unresolvedIdentityDiscriminator,
    brand,
    commercialVariant,
    concentration: formatConcentration(concentration),
    dosageForm: canonicalDosageForm,
    packageQuantity,
    pharmaceuticalUnit,
    packageVolume,
  });

  return {
    activeIngredients,
    unresolvedIdentityDiscriminator,
    concentration,
    canonicalDosageForm,
    dosageFormClass: coarseDosageForm,
    route,
    pharmaceuticalUnit,
    packageQuantity,
    packageUnit: pharmaceuticalUnit,
    packageVolume,
    packageType,
    brand,
    commercialVariant,
    administrationTime: readAdministrationTime(name),
    manufacturer,
    ispRegistration: offer.ispRegistration ?? null,
    canonicalName,
    inferredFields: {
      activeIngredients: activeIngredients.map((i) => `${i.token}:${i.evidence}`).join(",") || null,
      unresolvedIdentityDiscriminator,
      concentration: formatConcentration(concentration),
      canonicalDosageForm,
      dosageFormClass: coarseDosageForm,
      route,
      pharmaceuticalUnit,
      packageQuantity: packageQuantity === null ? null : String(packageQuantity),
      packageVolume: packageVolume ? `${packageVolume.value}${packageVolume.unit}` : null,
      packageType,
      commercialVariant,
      administrationTime: readAdministrationTime(name),
      variantDiscardedAsIngredient:
        rawVariant !== null && ingredientTokens.has(rawVariant) ? rawVariant : null,
      brandFromName: derived.brand,
    },
  };
}

/**
 * Caracteres invisibles que corrompen los valores estructurados reales
 * (Salcobrand entrega `hit.brand` con SOFT HYPHEN incrustado — medido en
 * CF-DATA-001). Misma limpieza que `brandIdentity.ts`, que es privada de ese
 * módulo.
 */
const INVISIBLE_CHARS = /[\u00AD\u200B-\u200D\uFEFF]/g;

/** Texto comercial limpio, o `null`. No normaliza a token: la marca se muestra. */
function normalizeCommercialToken(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const cleaned = raw.replace(INVISIBLE_CHARS, "").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}
