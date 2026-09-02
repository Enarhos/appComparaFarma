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
  canonicalId,
  resolveBySubsumption,
  type ResolvedItem,
  type Signature,
  type SignatureAxis,
} from "./canonicalIdentity.js";
import {
  ADMINISTRATION_ROUTE_BY_FORM,
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
const FORMS_WITHOUT_PACKAGE_VOLUME = new Set(["solid-oral", "suppository", "patch"]);

// ---------------------------------------------------------------------------
// ETAPA 3 — FIRMA DEL CONCEPTO FARMACÉUTICO
// ---------------------------------------------------------------------------

/**
 * Firma del Concepto Farmacéutico: principios activos + concentración + forma.
 *
 * QUÉ NO ESTÁ, Y POR QUÉ:
 *
 *   - MARCA, LABORATORIO, FARMACIA, PRECIO: invariante 1 del modelo. *"El
 *     conocimiento antecede al mercado"* (EDM-100). Es el cambio de fondo
 *     respecto de v1, donde `presentationKey` mete `brand:` dentro de la
 *     identidad y por eso un genérico sin laboratorio declarado no puede
 *     compararse nunca con el mismo genérico de otra farmacia.
 *
 *   - VÍA DE ADMINISTRACIÓN: se DERIVA de la forma por tabla explícita
 *     (`ADMINISTRATION_ROUTE_BY_FORM`), así que como eje sería redundante —
 *     agregaría cero poder discriminante y duplicaría el peso de la forma.
 *     Se publica como atributo del concepto porque el EDM lo exige.
 *
 *   - UNIDAD FARMACÉUTICA: "comprimido" y "tableta" son la misma unidad escrita
 *     por dos farmacias distintas, y "Omeprazol 20 mg x 30" no la declara.
 *     Usarla como eje reintroduciría exactamente la fragmentación que v2 viene
 *     a eliminar. Se publica como atributo.
 *
 *   - CANTIDAD y VOLUMEN: pertenecen a la PRESENTACIÓN, no al concepto. Dos
 *     frascos de 60 ml y 100 ml de la misma concentración son el MISMO
 *     concepto. En v1 son el mismo `matchKey` solo si coincide el volumen — es
 *     decir, exactamente al revés.
 */
export function conceptSignature(attributes: CanonicalAttributes): Signature {
  const tokens = attributes.activeIngredients.map((i) => i.token);
  const ingredientSegment = tokens.length > 0 ? tokens.join("+") : UNKNOWN_SEGMENT;

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
      {
        name: "ing",
        segment: ingredientSegment,
        // Una cabecera no resuelta (`unresolved-head`) se declara CONOCIDA a
        // propósito: es un discriminante, no un hueco. Si se declarara
        // desconocida, "Tapsin Forte" podría subsumirse dentro del concepto
        // "paracetamol 500 mg comprimido" por pura ausencia de evidencia — la
        // identidad falsa que CF-SEARCH-011 §5 prohíbe explícitamente.
        known: tokens.length > 0,
      },
      concentration,
      {
        name: "form",
        segment: attributes.dosageForm ?? UNKNOWN_SEGMENT,
        known: attributes.dosageForm !== null,
      },
    ],
  };
}

/** Eje de concentración con su evidencia adjunta, para el comparador propio. */
type ConcentrationAxis = SignatureAxis & {
  evidence?: CanonicalAttributes["concentration"];
};

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
  conceptId: string,
  attributes: CanonicalAttributes
): Signature {
  const volumeKnown =
    attributes.packageVolume !== null ||
    (attributes.dosageForm !== null && FORMS_WITHOUT_PACKAGE_VOLUME.has(attributes.dosageForm));

  return {
    axes: [
      { name: "concept", segment: conceptId, known: true },
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
  presentationId: string,
  attributes: CanonicalAttributes
): Signature {
  const brandToken = attributes.brand === null ? null : normalizeBrandToken(attributes.brand);
  const manufacturerToken =
    attributes.manufacturer === null ? null : normalizeBrandToken(attributes.manufacturer);

  return {
    axes: [
      { name: "presentation", segment: presentationId, known: true },
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
 * No incluye `productId`: una observación no deja de ser la misma observación
 * porque el motor aprenda a qué producto pertenece (ver `CanonicalOffer`).
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
 * `CanonicalOffer` enlazada a un `productId`, un `presentationId` y un
 * `conceptId`. Ninguna se descarta, ni siquiera cuando no se pudo demostrar
 * ningún principio activo — en ese caso obtiene una identidad propia marcada
 * como no resuelta. Es la garantía que mide el Gate A de S0: el motor puede
 * declarar que no sabe, nunca puede perder una oferta.
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
  const conceptById = indexBySlot(conceptResolution);

  const presentationResolution = resolveBySubsumption(
    "P",
    slots.map((slot) => ({
      signature: presentationSignature(conceptById.get(slot.index)!.id, slot.attributes),
      payload: slot,
    }))
  );
  const presentationById = indexBySlot(presentationResolution);

  const productResolution = resolveBySubsumption(
    "M",
    slots.map((slot) => ({
      signature: productSignature(presentationById.get(slot.index)!.id, slot.attributes),
      payload: slot,
    }))
  );
  const productById = indexBySlot(productResolution);

  const concepts = new Map<string, CanonicalMedicationConcept>();
  const presentations = new Map<string, CanonicalPresentation>();
  const products = new Map<string, CommercialMedicinalProduct>();
  const canonicalOffers: CanonicalOffer[] = [];

  for (const slot of slots) {
    const { attributes, offer } = slot;
    const concept = conceptById.get(slot.index)!;
    const presentation = presentationById.get(slot.index)!;
    const product = productById.get(slot.index)!;

    if (!concepts.has(concept.id)) {
      concepts.set(concept.id, {
        conceptId: concept.id,
        canonicalName: attributes.canonicalName,
        activeIngredients: attributes.activeIngredients,
        concentration: attributes.concentration,
        dosageForm: attributes.dosageForm,
        route:
          attributes.dosageForm === null
            ? null
            : ADMINISTRATION_ROUTE_BY_FORM[attributes.dosageForm],
        pharmaceuticalUnit: attributes.pharmaceuticalUnit,
        atcCode: null,
        resolution: concept.trace,
      });
    }

    if (!presentations.has(presentation.id)) {
      presentations.set(presentation.id, {
        presentationId: presentation.id,
        conceptId: concept.id,
        packageQuantity: attributes.packageQuantity,
        packageUnit: attributes.packageUnit,
        packageVolume: attributes.packageVolume,
        packageType: attributes.packageType,
        resolution: presentation.trace,
      });
    }

    if (!products.has(product.id)) {
      products.set(product.id, {
        productId: product.id,
        conceptId: concept.id,
        presentationId: presentation.id,
        brand: attributes.brand,
        commercialVariant: attributes.commercialVariant,
        administrationTime: attributes.administrationTime,
        manufacturer: attributes.manufacturer,
        ispRegistration: attributes.ispRegistration,
        resolution: product.trace,
      });
    }

    canonicalOffers.push({
      offerId: canonicalId("O", offerSignature(offer)),
      productId: product.id,
      presentationId: presentation.id,
      conceptId: concept.id,
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
): Map<number, { id: string; trace: ResolutionTrace }> {
  const out = new Map<number, { id: string; trace: ResolutionTrace }>();
  for (const item of resolved) {
    out.set(item.payload.index, { id: item.id, trace: item.trace });
  }
  return out;
}

/** Texto legible de una concentración, reexportado para diagnóstico. */
export { formatConcentration };
