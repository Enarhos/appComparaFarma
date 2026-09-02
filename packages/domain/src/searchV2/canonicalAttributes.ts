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
  ADMINISTRATION_ROUTE_BY_FORM,
  type ActiveIngredient,
  type AdministrationRoute,
  type CanonicalAttributes,
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
 * Conjunto de principios activos declarados en el nombre, ordenado
 * alfabéticamente y sin duplicados.
 *
 * TRES FUENTES DE EVIDENCIA, todas medidas, ninguna inventada:
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
 *   3. CABECERA NO RESUELTA — si las dos anteriores no producen NADA, se devuelve
 *      la cabecera farmacológica (`brandHeadTokens`, el mismo token que
 *      `matchKey` usa) marcada como `unresolved-head`.
 *
 * POR QUÉ LA CABECERA NO RESUELTA NO ES "INVENTAR UN PRINCIPIO ACTIVO":
 * el token NO se afirma como molécula — se marca explícitamente como no resuelto
 * y se cuenta en la métrica `identityUnknown`. Su función es ser un
 * DISCRIMINANTE HONESTO: sin él, "Tapsin Forte x 30 comprimidos" tendría un
 * conjunto de ingredientes vacío y podría absorberse dentro del concepto
 * "paracetamol 500 mg comprimido" por pura ausencia de evidencia — que es
 * exactamente la identidad falsa que CF-SEARCH-011 §5 prohíbe. Con él, Tapsin
 * Forte tiene identidad propia, las dos ofertas de Tapsin Forte de dos farmacias
 * distintas siguen agrupando entre sí, y ninguna se fusiona con un genérico.
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

  // Una combinación reconocida por `combinationKey()` implica que la cabecera es
  // el PRIMER principio activo, aunque no esté en el vocabulario: es la propia
  // firma tipográfica de la combinación la que lo demuestra ("Losartán /
  // Hidroclorotiazida 50/12,5 mg").
  if (second !== null) {
    const head = brandHeadTokens(tokens).join("");
    if (head && !ION_AND_SALT_TOKENS.has(head) && !found.has(head)) {
      found.set(head, "combination");
    }
  }

  if (found.size > 0) {
    return [...found.entries()]
      .map(([token, evidence]) => ({ token, evidence }))
      .sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
  }

  const head = brandHeadTokens(tokens).join("");
  if (!head) return [];
  return [{ token: head, evidence: "unresolved-head" }];
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
 * Sustantivos de unidad farmacéutica reconocidos, mapeados a su forma singular
 * canónica. Es un vocabulario de LECTURA, no un eje de identidad: la unidad
 * farmacéutica NO entra en la firma del concepto ni en la de la presentación.
 *
 * Motivo explícito: "comprimido" y "tableta" son la misma unidad escrita por dos
 * farmacias distintas, y usarla como eje reintroduciría exactamente la clase de
 * fragmentación que v2 viene a eliminar. Se publica como ATRIBUTO del concepto
 * (el EDM la exige) y se usa para construir `canonicalName`.
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
 * El nombre crudo de cada fuente se conserva íntegro en `CanonicalOffer.rawName`
 * (linaje EDM-500) y se sigue mostrando por oferta.
 */
export function buildCanonicalName(parts: {
  activeIngredients: ActiveIngredient[];
  brand: string | null;
  commercialVariant: string | null;
  concentration: string | null;
  dosageForm: string | null;
  packageQuantity: number | null;
  pharmaceuticalUnit: string | null;
  packageVolume: Measurement | null;
}): string {
  const ingredients = parts.activeIngredients
    .filter((i) => i.evidence !== "unresolved-head")
    .map((i) => i.token)
    .join(" + ");
  const head =
    parts.brand !== null
      ? ingredients.length > 0
        ? `${parts.brand} ${ingredients}`
        : parts.brand
      : ingredients.length > 0
        ? ingredients
        : (parts.activeIngredients[0]?.token ?? "");

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
  const concentration = readConcentrationEvidence(name);
  const dosageForm = dosageFormClass(name);
  const route: AdministrationRoute | null =
    dosageForm === null ? null : ADMINISTRATION_ROUTE_BY_FORM[dosageForm];
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
    brand,
    commercialVariant,
    concentration: formatConcentration(concentration),
    dosageForm,
    packageQuantity,
    pharmaceuticalUnit,
    packageVolume,
  });

  return {
    activeIngredients,
    concentration,
    dosageForm,
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
      concentration: formatConcentration(concentration),
      dosageForm,
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
