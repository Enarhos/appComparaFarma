/**
 * Search Engine v2 — etapas 3 a 6: resolución de identidad (CF-SEARCH-011, S0).
 *
 * Construye el grafo canónico completo a partir de observaciones crudas:
 *
 *     RawOfferInput[]
 *        → etapa 2  canonicalización     (canonicalAttributes.ts)
 *        → etapa 3  CFM-CONCEPT-ID
 *        → etapa 4  CFM-PRESENTATION-ID
 *        → etapa 5  CFM-PRODUCT-ID
 *        → etapa 6  CFM-OFFER-ID
 *
 * LO QUE ESTE MÓDULO NO HACE, Y NO PUEDE HACER POR CONSTRUCCIÓN:
 *   - no recibe la consulta del usuario en ninguna firma;
 *   - no lee el precio, el stock ni la posición en el listado;
 *   - no ordena resultados;
 *   - no escribe en `matchKey`, `presentationKey`, ni en ninguna tabla de v1.
 *
 * Las firmas son la ÚNICA fuente de los identificadores, y ninguna incluye
 * consulta, ranking ni precio: las invariantes 5 y 6 del modelo canónico se
 * cumplen por construcción, no por disciplina.
 */

import { normalizeBrandToken } from "../commercialIdentity.js";
import { concentrationRatio, type Measurement } from "../concentration.js";
import { matchKey } from "../matching.js";
import { canonicalizeOffer } from "./canonicalAttributes.js";
import {
  compareConcentration,
  concentrationSignature,
  formatConcentration,
} from "./canonicalConcentration.js";
import {
  axisStrength,
  provisionalKey,
  resolveBySubsumption,
  type ResolvedItem,
  type Signature,
  type SignatureAxis,
} from "./canonicalIdentity.js";
import {
  type AxisComparison,
  type CanonicalAttributes,
  type CanonicalGraph,
  type CanonicalMedicationConcept,
  type CanonicalOffer,
  type CanonicalPresentation,
  type CommercialMedicinalProduct,
  type RawOfferInput,
  type ResolutionTrace,
} from "./canonicalTypes.js";

const UNKNOWN_SEGMENT = "?";

/**
 * Formas farmacéuticas en las que la AUSENCIA de volumen de envase no es un dato
 * faltante sino una consecuencia de la forma: una caja de comprimidos, un
 * supositorio o un parche no tienen volumen envasado.
 *
 * Es una derivación desde evidencia DECLARADA (la forma farmacéutica que el
 * nombre sí declara), no una inferencia sobre datos ausentes. Solo afecta la
 * CONFIANZA reportada: la decisión de agrupamiento es idéntica con o sin esta
 * regla, porque un eje desconocido y un eje "sin volumen" se comportan igual
 * frente a una firma que tampoco declara volumen.
 */
const FORMS_WITHOUT_PACKAGE_VOLUME: ReadonlySet<string> = new Set([
  "comprimido",
  "capsula",
  "supositorio",
  "ovulo",
  "parche",
]);

// ---------------------------------------------------------------------------
// ETAPA 3 — FIRMA DEL CONCEPTO FARMACÉUTICO
// ---------------------------------------------------------------------------

/**
 * Firma del Concepto Farmacéutico — LAS CINCO DIMENSIONES DEL EDM-100.
 *
 * El EDM define el Concepto Farmacéutico como la combinación única de Principio
 * Activo + Concentración + Forma Farmacéutica + Vía de Administración + Unidad
 * Farmacéutica. Las cinco están acá, más un sexto eje de seguridad:
 *
 *     ing   → Principio(s) Activo(s) DEMOSTRADOS  (desconocido si no hay ninguno)
 *     disc  → discriminante de identidad no resuelta (NO es un principio activo)
 *     conc  → Concentración, con sus tres niveles de evidencia
 *     form  → Forma Farmacéutica canónica (`CanonicalDosageForm`)
 *     route → Vía de Administración
 *     unit  → Unidad Farmacéutica
 *
 * QUÉ CAMBIÓ EN LA REVISIÓN DEL PR #159, Y POR QUÉ NO FUE "SUMAR STRINGS":
 *
 *   1. `form` usaba `DosageFormClass`, la clase GRUESA de v1, que agrupa
 *      comprimido con cápsula y crema con gel. El EDM enumera esas formas por
 *      separado y ninguna fuente del corpus las usa como sinónimos: 16 de los 45
 *      conceptos que mezclaban formas lo hacían por esta razón. Ahora el eje usa
 *      `CanonicalDosageForm`. Los otros 29 casos —jarabe/suspensión/solución—
 *      NO se separan, y el porqué (evidencia de sinonimia real en el catálogo)
 *      está en `CanonicalDosageForm`.
 *
 *   2. `route` no estaba. Sobre la clase gruesa era una función total de la
 *      forma, así que como eje habría tenido cero poder discriminante — ese
 *      argumento era formalmente correcto pero describía una limitación del
 *      modelo, no un contrato de dominio. Ver `readAdministrationRoute()`.
 *
 *   3. `unit` no estaba, por un argumento que razonaba con la aritmética de dos
 *      estados de v1 dentro de un motor que tiene tres. Ver
 *      `PHARMACEUTICAL_UNIT_BY_TOKEN`.
 *
 *   4. `disc` es nuevo y separa el DISCRIMINANTE DE SEGURIDAD del CONOCIMIENTO
 *      FARMACOLÓGICO. Antes, una cabecera no resuelta viajaba dentro de `ing`
 *      con `known=true`, o sea firmada como si fuera un principio activo. Ver
 *      `readUnresolvedIdentityDiscriminator()`.
 *
 * QUÉ SIGUE SIN ESTAR, Y POR QUÉ:
 *
 *   - MARCA, LABORATORIO, FARMACIA, PRECIO: invariante 1 del modelo. *"El
 *     conocimiento antecede al mercado"* (EDM-100). Es el cambio de fondo
 *     respecto de v1, donde `presentationKey` mete `brand:` dentro de la
 *     identidad y por eso un genérico sin laboratorio declarado no puede
 *     compararse nunca con el mismo genérico de otra farmacia.
 *
 *   - CANTIDAD y VOLUMEN: pertenecen a la PRESENTACIÓN, no al concepto. Dos
 *     frascos de 60 ml y 100 ml de la misma concentración son el MISMO
 *     concepto. En v1 son el mismo `matchKey` solo si coincide el volumen — es
 *     decir, exactamente al revés.
 *
 *   - CLASE GRUESA (`dosageFormClass`): sería redundante con `form`, que es
 *     estrictamente más fina. Se publica como atributo para trazabilidad.
 */
export function conceptSignature(attributes: CanonicalAttributes): Signature {
  const ingredients = ingredientAxis(attributes);

  const concentration: ConcentrationAxis = {
    name: "conc",
    segment: concentrationSignature(attributes.concentration),
    known: attributes.concentration.kind !== "absent",
    strength:
      attributes.concentration.kind === "absent"
        ? 0
        : attributes.concentration.kind === "mass-only"
          ? 1
          : 2,
    evidence: attributes.concentration,
    compare: (other) =>
      compareConcentration(
        attributes.concentration,
        (other as ConcentrationAxis).evidence ?? { kind: "absent" }
      ),
  };

  return {
    axes: [
      ingredients,
      {
        // Discriminante de identidad no resuelta. SIEMPRE DECLARADO —`none`
        // cuando el concepto sí tiene principios activos demostrados— para que
        // dos valores distintos sean INCOMPATIBLES y no meramente "distintos".
        // Es lo que impide que "Tapsin Forte", con `ing` desconocido, se
        // subsuma dentro de "paracetamol 500 mg comprimido".
        name: "disc",
        segment: attributes.unresolvedIdentityDiscriminator ?? "none",
        known: true,
      },
      concentration,
      {
        name: "form",
        segment: attributes.canonicalDosageForm ?? UNKNOWN_SEGMENT,
        known: attributes.canonicalDosageForm !== null,
      },
      {
        name: "route",
        segment: attributes.route ?? UNKNOWN_SEGMENT,
        known: attributes.route !== null,
      },
      {
        name: "unit",
        segment: attributes.pharmaceuticalUnit ?? UNKNOWN_SEGMENT,
        known: attributes.pharmaceuticalUnit !== null,
      },
    ],
  };
}

/** Eje de concentración con su evidencia adjunta, para el comparador propio. */
type ConcentrationAxis = SignatureAxis & {
  evidence?: CanonicalAttributes["concentration"];
};

/** Eje de principios activos con su composición adjunta, para el comparador propio. */
type IngredientAxis = SignatureAxis & {
  tokens?: string[];
  declaredComponentCount?: number;
};

/**
 * Eje `ing` — EL CONJUNTO DE PRINCIPIOS ACTIVOS Y SU CARDINALIDAD DECLARADA.
 *
 * POR QUÉ NO ALCANZA CON CONCATENAR LOS TOKENS
 * --------------------------------------------
 * Hasta esta iteración el eje era `tokens.join("+")`, conocido si había al menos
 * uno. Con dos estados —conocido o desconocido— un conjunto INCOMPLETO es
 * literalmente indistinguible de un conjunto COMPLETO de un elemento, y ese es
 * el defecto que produjo el falso merge medido sobre el corpus congelado:
 *
 *     "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos"  (dr-simi)
 *     "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico"
 *     "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos"                 (cruz-verde)
 *
 * compartían concepto con `ing=diclofenaco`, resolución `complete` y confianza
 * `high`. Una asociación con TRAMADOL declarada como el mismo Concepto
 * Farmacéutico que un monofármaco de diclofenaco.
 *
 * LOS TRES ESTADOS DEL EJE, y qué afirma cada uno:
 *
 *   COMPLETO   — se nombraron todos los componentes que el nombre declara.
 *                Segmento `diclofenaco+tramadol`. Fuerza 2.
 *   PARCIAL    — el nombre declara N componentes y solo se nombraron M < N.
 *                Segmento `diclofenaco+?2` (las moléculas conocidas, más la
 *                cardinalidad declarada). Fuerza 1. Afirma "hay más de los que
 *                puedo nombrar", que es distinto de "no sé nada".
 *   DESCONOCIDO— el nombre no declara composición alguna. Segmento `?`. Fuerza 0.
 *                Es el estado de "Tapsin Forte", y su protección contra fusiones
 *                la sigue aportando el eje `disc`, no este.
 *
 * La comparación la hace `compareIngredients()`, que es lo que impide que un
 * conjunto parcial se subsuma dentro de un conjunto completo demasiado pequeño.
 */
function ingredientAxis(attributes: CanonicalAttributes): IngredientAxis {
  const tokens = attributes.activeIngredients.map((i) => i.token);
  const declared = Math.max(attributes.declaredComponentCount, tokens.length);
  const complete = tokens.length > 0 && tokens.length >= declared;

  const segment =
    tokens.length === 0
      ? declared > 1
        ? `${UNKNOWN_SEGMENT}${declared}`
        : UNKNOWN_SEGMENT
      : complete
        ? tokens.join("+")
        : `${tokens.join("+")}+${UNKNOWN_SEGMENT}${declared}`;

  const axis: IngredientAxis = {
    name: "ing",
    segment,
    known: complete,
    strength: complete ? 2 : tokens.length > 0 || declared > 1 ? 1 : 0,
    tokens,
    declaredComponentCount: declared,
  };
  axis.compare = (other) => compareIngredients(axis, other as IngredientAxis);
  return axis;
}

/**
 * Compara dos ejes de principio activo tratando el conjunto como un CONJUNTO y
 * la cardinalidad declarada como una AFIRMACIÓN, no como un detalle.
 *
 * REGLAS, en el orden en que se aplican:
 *
 *   1. DOS COMPLETOS — iguales si son el mismo conjunto, `incompatible` si no.
 *      Es lo que separa `{diclofenaco, tramadol}` de `{diclofenaco}`, y la
 *      corrección directa del falso merge de Adorlan.
 *
 *   2. DESCONOCIDO PURO (sin moléculas y sin cardinalidad declarada) contra
 *      cualquier cosa — `subsumable`. Conserva EXACTAMENTE el comportamiento
 *      anterior para los nombres que no declaran nada: la seguridad de "Tapsin
 *      Forte" la aporta el eje `disc`, que no cambia.
 *
 *   3. PARCIAL contra el otro — `subsumable` SOLO SI las dos condiciones se
 *      cumplen a la vez:
 *        (a) las moléculas del parcial están CONTENIDAS en las del otro — un
 *            conjunto no puede ser lectura incompleta de otro que lo contradice;
 *        (b) el otro tiene AL MENOS tantos componentes como el parcial DECLARA —
 *            "Zolimax Duo **875/125** Amoxicilina 875 mg" declara 2 componentes y
 *            por lo tanto NO puede ser una lectura incompleta de un monofármaco
 *            de amoxicilina, por más que `{amoxicilina} ⊆ {amoxicilina}`.
 *      Si alguna falla → `incompatible`. Nunca se adivina.
 *
 * La relación es simétrica por construcción: el lado más débil se elige por
 * fuerza, no por el orden de los argumentos, y `subsumes()` verifica aparte la
 * dirección con `axisStrength`.
 */
function compareIngredients(a: IngredientAxis, b: IngredientAxis): AxisComparison {
  const aTokens = a.tokens ?? [];
  const bTokens = b.tokens ?? [];
  const aDeclared = a.declaredComponentCount ?? aTokens.length;
  const bDeclared = b.declaredComponentCount ?? bTokens.length;
  const aComplete = a.known;
  const bComplete = b.known;

  if (aComplete && bComplete) {
    return a.segment === b.segment ? "equal" : "incompatible";
  }

  const aPureUnknown = aTokens.length === 0 && aDeclared <= 1;
  const bPureUnknown = bTokens.length === 0 && bDeclared <= 1;
  if (aPureUnknown && bPureUnknown) return "equal";
  if (aPureUnknown || bPureUnknown) return "subsumable";

  // A partir de acá al menos uno es PARCIAL y ninguno es desconocido puro.
  const [weak, strong] =
    axisStrength(a) <= axisStrength(b)
      ? [{ tokens: aTokens, declared: aDeclared }, { tokens: bTokens, declared: bDeclared }]
      : [{ tokens: bTokens, declared: bDeclared }, { tokens: aTokens, declared: aDeclared }];

  const strongSet = new Set(strong.tokens);
  const contained = weak.tokens.every((token) => strongSet.has(token));
  if (!contained) return "incompatible";
  if (Math.max(strong.tokens.length, strong.declared) < weak.declared) return "incompatible";

  return a.segment === b.segment ? "equal" : "subsumable";
}

// ---------------------------------------------------------------------------
// ETAPA 4 — FIRMA DE LA PRESENTACIÓN FARMACÉUTICA
// ---------------------------------------------------------------------------

/**
 * Firma de la Presentación: concepto + cantidad de unidades + volumen del envase.
 *
 * Las dos dimensiones son INDEPENDIENTES y no intercambiables. Es la corrección
 * estructural de CF-SEARCH-011 §8: en v1 ambas compiten por el mismo segmento de
 * `matchKey` y gana el mililitro (`mlHits` antes que `mgHits`, con `Math.max`),
 * de modo que en 141 ofertas medidas `x 100 ml` termina representado como "100
 * unidades". Acá `packageQuantity` cuenta unidades farmacéuticas y NUNCA un
 * volumen —`unitCountKey()` ya lo lee bien y por fin gobierna—, y
 * `packageVolume` es el frasco y NUNCA una concentración.
 *
 * Marca y laboratorio NO participan (invariante 2). El tipo de envase tampoco:
 * una farmacia escribe "Caja 6 sobres" y otra "6 sobres" para el mismo artículo,
 * y usarlo como eje sería un falso split garantizado — se publica como atributo.
 */
export function presentationSignature(
  conceptKey: string,
  attributes: CanonicalAttributes
): Signature {
  const volumeKnown =
    attributes.packageVolume !== null ||
    (attributes.canonicalDosageForm !== null &&
      FORMS_WITHOUT_PACKAGE_VOLUME.has(attributes.canonicalDosageForm));

  return {
    axes: [
      { name: "concept", segment: conceptKey, known: true },
      {
        name: "qty",
        segment:
          attributes.packageQuantity === null ? UNKNOWN_SEGMENT : String(attributes.packageQuantity),
        known: attributes.packageQuantity !== null,
      },
      {
        name: "vol",
        segment:
          attributes.packageVolume === null ? (volumeKnown ? "none" : UNKNOWN_SEGMENT)
          : volumeSegment(attributes.packageVolume),
        known: volumeKnown,
      },
    ],
  };
}

/** Volumen normalizado a su unidad base, para que `0,1 l` y `100 ml` sean uno. */
function volumeSegment(volume: Measurement): string {
  const base = concentrationRatio({ numerator: volume, denominator: null });
  return base === null
    ? `lit:${volume.value}${volume.unit}`
    : `${Number(base.value.toPrecision(12))}${base.unit}`;
}

// ---------------------------------------------------------------------------
// ETAPA 5 — FIRMA DEL PRODUCTO MEDICINAL COMERCIAL
// ---------------------------------------------------------------------------

/**
 * Firma del Producto Comercial: presentación + registro ISP + marca + variante +
 * laboratorio.
 *
 * CAMBIO DE POLÍTICA RESPECTO DE v1 — el más importante para la fragmentación
 * (`SEARCH_ENGINE_V2.md` etapa 5). En v1, marca y laboratorio están DENTRO de la
 * identidad (`presentationKey` incluye `brand:`), así que un laboratorio ausente
 * parte el CONCEPTO entero: de ahí las hasta 9 tarjetas para un solo losartán
 * 50 mg x 30, cada una comparando una sola farmacia. En v2 la identidad es
 * `conceptId + presentationId`, y marca y laboratorio solo distinguen productos
 * comerciales DENTRO de esa presentación — que es donde la comparación aparece.
 *
 * AUSENCIA DE MARCA = PRODUCTO "NO IDENTIFICADO", NO COMODÍN. El diseño aprobado
 * lo dice literalmente: un `manufacturer: null` *"se convierte en un producto
 * comercial 'no identificado' DENTRO de la misma presentación, comparable con
 * los demás"*. Comparable, no absorbido. Por eso `brand`, `variant` y
 * `manufacturer` declaran su ausencia como un VALOR (`unbranded`, `none`,
 * `unidentified`) y NO son subsumibles.
 *
 * Esa decisión se tomó contra datos, no por prudencia abstracta. Una primera
 * implementación de S0 hizo subsumible la marca, y sobre el corpus congelado
 * absorbió "Ambroxol Pediatrico 15mg/5…" (EasyFarma, nombre truncado, genérico
 * sin marca) dentro del producto "Muxol Jarabe Pediátrico" (Cruz Verde): un
 * genérico y una marca presentados como el mismo producto, con su diferencia de
 * precio mostrada como ahorro. Es exactamente el riesgo clínico que
 * `PRODUCT_IDENTITY.md` §10 prohíbe, y por eso la ausencia de marca no se
 * subsume nunca.
 *
 * LA VARIANTE COMERCIAL TAMPOCO ES SUBSUMIBLE. "Tapsin x 6 comprimidos" y
 * "Tapsin Rojo Dolor de Cabeza tira x 6" nunca comparten `productId`. Es la
 * corrección medida de CF-SEARCH-001: declarar una variante frente a no
 * declararla es evidencia suficiente de que son artículos distintos del mismo
 * fabricante. Tapsin Rojo, Forte, Día, Noche, Duo y Migraña tienen composiciones
 * distintas.
 *
 * REGISTRO ISP: evidencia E1, la más fuerte del modelo, y el ÚNICO eje
 * subsumible de este nivel — con presentación, marca, variante y laboratorio ya
 * coincidiendo, que una fuente declare el registro y la otra no es una diferencia
 * de detalle, no de identidad. Hoy ningún adaptador lo captura (CF-DATA-005 /
 * issue #156 es independiente y S0 no depende de él), así que el eje está siempre
 * en `UNKNOWN` y no discrimina. Se declara igual para que capturarlo sea un
 * cambio de datos y no de arquitectura.
 */
export function productSignature(
  presentationKey: string,
  attributes: CanonicalAttributes
): Signature {
  const brandToken = attributes.brand === null ? null : normalizeBrandToken(attributes.brand);
  const manufacturerToken =
    attributes.manufacturer === null ? null : normalizeBrandToken(attributes.manufacturer);

  return {
    axes: [
      { name: "presentation", segment: presentationKey, known: true },
      {
        name: "isp",
        segment: attributes.ispRegistration ?? UNKNOWN_SEGMENT,
        known: attributes.ispRegistration !== null,
      },
      {
        name: "brand",
        segment: brandToken && brandToken.length > 0 ? brandToken : "unbranded",
        known: true,
      },
      {
        name: "variant",
        segment: attributes.commercialVariant ?? "none",
        known: true,
      },
      {
        name: "time",
        segment: attributes.administrationTime ?? "none",
        known: true,
      },
      {
        name: "manufacturer",
        segment:
          manufacturerToken && manufacturerToken.length > 0 ? manufacturerToken : "unidentified",
        known: true,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// ETAPA 6 — IDENTIDAD DE LA OBSERVACIÓN
// ---------------------------------------------------------------------------

/**
 * Firma de la OBSERVACIÓN: farmacia + referencia de origen + nombre crudo.
 *
 * No incluye la clave de producto: una observación no deja de ser la misma
 * observación porque el motor aprenda a qué producto pertenece (ver `CanonicalOffer`).
 * Tampoco incluye precio ni instante: el precio de una oferta cambia todos los
 * días y la oferta sigue siendo la misma.
 */
export function offerSignature(offer: RawOfferInput): string {
  const source = offer.sourceProductId ?? offer.url ?? "-";
  return `pharmacy=${offer.pharmacy}|src=${source}|name=${offer.rawName.trim().toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// PIPELINE
// ---------------------------------------------------------------------------

interface OfferSlot {
  offer: RawOfferInput;
  attributes: CanonicalAttributes;
  index: number;
}

/**
 * Construye el grafo canónico completo del conjunto de observaciones recibido.
 *
 * COBERTURA: toda observación de entrada produce EXACTAMENTE una
 * `CanonicalOffer` enlazada a una clave de producto, una de presentación y una
 * de concepto. Ninguna se descarta, ni siquiera cuando no se pudo demostrar
 * ningún principio activo — en ese caso obtiene un concepto propio con
 * `identityStatus: "unresolved-ingredient"`. Es la garantía que mide el Gate A
 * de S0: el motor puede declarar que no sabe, nunca puede perder una oferta.
 */
export function canonicalize(offers: RawOfferInput[]): CanonicalGraph {
  const slots: OfferSlot[] = offers.map((offer, index) => ({
    offer,
    attributes: canonicalizeOffer(offer),
    index,
  }));

  const conceptResolution = resolveBySubsumption(
    "C",
    slots.map((slot) => ({ signature: conceptSignature(slot.attributes), payload: slot }))
  );
  const conceptBySlot = indexBySlot(conceptResolution);

  const presentationResolution = resolveBySubsumption(
    "P",
    slots.map((slot) => ({
      signature: presentationSignature(conceptBySlot.get(slot.index)!.key, slot.attributes),
      payload: slot,
    }))
  );
  const presentationBySlot = indexBySlot(presentationResolution);

  const productResolution = resolveBySubsumption(
    "M",
    slots.map((slot) => ({
      signature: productSignature(presentationBySlot.get(slot.index)!.key, slot.attributes),
      payload: slot,
    }))
  );
  const productBySlot = indexBySlot(productResolution);

  const concepts = new Map<string, CanonicalMedicationConcept>();
  const presentations = new Map<string, CanonicalPresentation>();
  const products = new Map<string, CommercialMedicinalProduct>();
  const canonicalOffers: CanonicalOffer[] = [];

  for (const slot of slots) {
    const { attributes, offer } = slot;
    const concept = conceptBySlot.get(slot.index)!;
    const presentation = presentationBySlot.get(slot.index)!;
    const product = productBySlot.get(slot.index)!;

    if (!concepts.has(concept.key)) {
      concepts.set(concept.key, {
        provisionalConceptKey: concept.key,
        canonicalName: attributes.canonicalName,
        activeIngredients: attributes.activeIngredients,
        declaredComponentCount: attributes.declaredComponentCount,
        ingredientStrengths: attributes.ingredientStrengths,
        identityStatus:
          attributes.activeIngredients.length > 0 ? "resolved" : "unresolved-ingredient",
        unresolvedIdentityDiscriminator: attributes.unresolvedIdentityDiscriminator,
        concentration: attributes.concentration,
        canonicalDosageForm: attributes.canonicalDosageForm,
        dosageFormClass: attributes.dosageFormClass,
        route: attributes.route,
        pharmaceuticalUnit: attributes.pharmaceuticalUnit,
        atcCode: null,
        resolution: concept.trace,
      });
    }

    if (!presentations.has(presentation.key)) {
      presentations.set(presentation.key, {
        provisionalPresentationKey: presentation.key,
        provisionalConceptKey: concept.key,
        packageQuantity: attributes.packageQuantity,
        packageUnit: attributes.packageUnit,
        packageVolume: attributes.packageVolume,
        packageType: attributes.packageType,
        resolution: presentation.trace,
      });
    }

    if (!products.has(product.key)) {
      products.set(product.key, {
        provisionalProductKey: product.key,
        provisionalConceptKey: concept.key,
        provisionalPresentationKey: presentation.key,
        brand: attributes.brand,
        commercialVariant: attributes.commercialVariant,
        administrationTime: attributes.administrationTime,
        manufacturer: attributes.manufacturer,
        ispRegistration: attributes.ispRegistration,
        resolution: product.trace,
      });
    }

    canonicalOffers.push({
      provisionalOfferKey: provisionalKey("O", offerSignature(offer)),
      provisionalProductKey: product.key,
      provisionalPresentationKey: presentation.key,
      provisionalConceptKey: concept.key,
      pharmacy: offer.pharmacy,
      sourceProductId: offer.sourceProductId ?? offer.url ?? offer.rawName,
      rawName: offer.rawName,
      price: offer.price,
      stock: offer.stock,
      url: offer.url,
      capturedAt: offer.capturedAt,
      provenance: {
        pharmacy: offer.pharmacy,
        rawName: offer.rawName,
        upstreamFields: {
          brand: offer.structuredBrand ?? null,
          manufacturer: offer.structuredManufacturer ?? null,
          isBioequivalent: offer.isBioequivalent ?? null,
          ispRegistration: offer.ispRegistration ?? null,
          url: offer.url,
        },
        inferredFields: attributes.inferredFields,
        legacyMatchKey: matchKey(offer.rawName),
        legacyPresentationKey: offer.legacyPresentationKey ?? null,
        resolution: {
          concept: concept.trace,
          presentation: presentation.trace,
          product: product.trace,
        },
      },
    });
  }

  return { concepts, presentations, products, offers: canonicalOffers };
}

function indexBySlot(
  resolved: ResolvedItem<OfferSlot>[]
): Map<number, { key: string; trace: ResolutionTrace }> {
  const out = new Map<number, { key: string; trace: ResolutionTrace }>();
  for (const item of resolved) {
    out.set(item.payload.index, { key: item.key, trace: item.trace });
  }
  return out;
}

/** Texto legible de una concentración, reexportado para diagnóstico. */
export { formatConcentration };
