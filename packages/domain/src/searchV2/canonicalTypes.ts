/**
 * Search Engine v2 — contratos de identidad canónica (CF-SEARCH-011, S0).
 *
 * PROYECCIÓN TÉCNICA DEL ENTERPRISE DATA MODEL, no un modelo alternativo. La
 * jerarquía y la semántica salen de `docs/enterprise/ENTERPRISE_DATA_MODEL.md`
 * (EDM-100 / EDM-200) y de su proyección aprobada en
 * `docs/qa/cf-search-010/CANONICAL_IDENTITY_MODEL.md`:
 *
 *     CFM-CONCEPT-ID → CFM-PRESENTATION-ID → CFM-PRODUCT-ID → CFM-OFFER-ID
 *
 * AISLAMIENTO (CF-SEARCH-011 §4, §22). Este árbol NO se exporta desde
 * `packages/domain/src/index.ts` y ningún módulo de v1 lo importa: v1 es
 * inmutable en S0 y el motor v2 corre exclusivamente en shadow mode, fuera del
 * camino productivo. La superficie pública de `@comparafarma/domain` no cambia.
 * El harness de evaluación carga `dist/searchV2/index.js` por ruta, el mismo
 * patrón que ya usan los scripts de CF-SEARCH-003, CF-DATA-001 y CF-SEARCH-010.
 *
 * LAS CINCO INVARIANTES DE IDENTIDAD (CANONICAL_IDENTITY_MODEL §1):
 *   1. `conceptId` nunca depende de marca, laboratorio, farmacia ni precio.
 *   2. `presentationId` nunca depende de marca ni de laboratorio.
 *   3. `productId` es lo único que puede depender de marca y fabricante.
 *   4. `offerId` es lo único que puede depender de la farmacia.
 *   5. NINGUNO depende de la consulta del usuario ni del ranking.
 *
 * REGLA DE HONESTIDAD: `UNKNOWN` es preferible a una identidad falsa. Ningún
 * atributo se rellena por inferencia cuando el nombre no lo declara.
 */

import type { Concentration, Measurement } from "../concentration.js";
import type { DosageFormClass } from "../productIdentity.js";
import type { PharmacySlug, PriceChannels } from "../types.js";

// ---------------------------------------------------------------------------
// A. VOCABULARIOS DERIVADOS
// ---------------------------------------------------------------------------

/**
 * Vía de administración. Se DERIVA de `DosageFormClass` por una tabla explícita
 * (`ADMINISTRATION_ROUTE_BY_FORM`), nunca se lee del texto: ningún catálogo de
 * las 9 farmacias la declara (medido en CF-SEARCH-010: cobertura 0 %).
 */
export type AdministrationRoute =
  | "oral"
  | "topical"
  | "parenteral"
  | "inhalation"
  | "ophthalmic"
  | "rectal"
  | "transdermal";

/**
 * Evidencia de concentración. Los tres estados son SEMÁNTICAMENTE DISTINTOS y
 * el modelo los mantiene separados a propósito — es la corrección de fondo que
 * `CANONICAL_IDENTITY_MODEL.md` §3.2 R5 exige:
 *
 *   - `ratio`     — razón masa/volumen explícita (`30 mg/5 mL`). Evidencia FUERTE.
 *   - `mass-only` — masa absoluta por unidad de forma (`500 mg` en un comprimido,
 *                   o `30 mg` junto a un volumen de envase). Evidencia PARCIAL:
 *                   no es una concentración distinta, es una concentración
 *                   INCOMPLETA.
 *   - `absent`    — el nombre no declara ninguna. Nunca bloquea, nunca afirma.
 *
 * Un volumen de envase (`100 mL`) NUNCA es una concentración: vive en
 * `CanonicalPresentation.packageVolume` y no entra jamás en este tipo.
 */
export type ConcentrationEvidence =
  | { kind: "ratio"; value: Concentration }
  | { kind: "mass-only"; value: Measurement }
  | { kind: "absent" };

/**
 * Resultado de comparar dos ejes de identidad. Es el tipo que hace posible la
 * resolución por SUBSUNCIÓN (ver `canonicalIdentity.ts`): sin un tercer estado
 * explícito, "no lo sé" y "es distinto" colapsan en el mismo `false` y el motor
 * se ve obligado a elegir entre fragmentar o fusionar a ciegas — que es
 * exactamente la restricción estructural que v1 no puede superar.
 */
export type AxisComparison =
  /** Ambos conocidos y equivalentes. */
  | "equal"
  /** Ambos conocidos y contradictorios. Evidencia positiva de identidades distintas. */
  | "incompatible"
  /** A es más débil que B (desconocido o parcial) y B no lo contradice. */
  | "subsumable";

/** Un principio activo reconocido, con la evidencia que lo respalda. */
export interface ActiveIngredient {
  /** Token normalizado, sin acentos y en minúscula (`"ambroxol"`). */
  token: string;
  /**
   * `"vocabulary"` — el token está en el vocabulario de moléculas medido
   * (`COMPOSITION_VOCABULARY`, CF-DATA-001) o es el segundo principio activo de
   * una combinación reconocida por `combinationKey` (CF-SEARCH-001/S-1).
   * `"unresolved-head"` — NO se pudo demostrar ninguna molécula en el nombre; el
   * token es la cabecera farmacológica y actúa como discriminante honesto, no
   * como afirmación de que sea un principio activo.
   */
  evidence: "vocabulary" | "combination" | "unresolved-head";
}

/** Confianza de una resolución de identidad. */
export type ResolutionConfidence =
  /** Firma completa: todos los ejes del nivel están declarados. */
  | "high"
  /** Firma parcial subsumida bajo una única firma completa compatible. */
  | "medium"
  /** Firma parcial sin ninguna firma completa compatible: identidad propia y aislada. */
  | "low"
  /** Firma parcial compatible con MÁS DE UNA firma completa: no se elige, se aísla. */
  | "ambiguous";

/** Cómo se resolvió el identificador de un nivel. */
export type ResolutionKind = "complete" | "subsumed" | "isolated" | "ambiguous";

/**
 * Traza de resolución de UN nivel de identidad. Existe para responder, sin
 * reconstruir heurísticas a mano, la pregunta que CF-SEARCH-011 §11 exige:
 * *¿por qué estas dos ofertas terminaron en el mismo `productId`?*
 */
export interface ResolutionTrace {
  /** Firma textual y determinista de la que se derivó el ID. Comparable a ojo. */
  signature: string;
  /** Firma original de la oferta, antes de subsumirse (igual a `signature` si no hubo subsunción). */
  rawSignature: string;
  kind: ResolutionKind;
  confidence: ResolutionConfidence;
  /** Ejes cuya evidencia faltaba en la firma original. */
  unknownAxes: string[];
  /** Cuántas firmas completas eran compatibles (0, 1 o N). Solo informativo. */
  candidateCount: number;
}

// ---------------------------------------------------------------------------
// B. LAS CUATRO ENTIDADES
// ---------------------------------------------------------------------------

/**
 * EDM-100 · `CFM-CONCEPT-ID` — identidad científica. *"El conocimiento antecede
 * al mercado"*: no depende de marca, laboratorio, farmacia, precio ni consulta.
 */
export interface CanonicalMedicationConcept {
  /** `CFM-C-<hash>` — determinista sobre la firma del concepto. */
  conceptId: string;
  /** Construido desde los atributos, NUNCA copiado del nombre de una farmacia. */
  canonicalName: string;
  /** Ordenado alfabéticamente: el orden textual del nombre no crea identidades distintas. */
  activeIngredients: ActiveIngredient[];
  concentration: ConcentrationEvidence;
  dosageForm: DosageFormClass | null;
  /** Derivada de `dosageForm` por tabla explícita. `null` si la forma es desconocida. */
  route: AdministrationRoute | null;
  /** Unidad farmacéutica declarada en el nombre (`comprimido`, `sobre`), o `null`. */
  pharmaceuticalUnit: string | null;
  /** Fuera de alcance de S0 (CF-DATA-005/#156 es independiente). Siempre `null`. */
  atcCode: string | null;
  resolution: ResolutionTrace;
}

/**
 * EDM-100 · `CFM-PRESENTATION-ID` — manifestación física del concepto.
 *
 * Las CUATRO dimensiones que v1 colapsa en el mismo segmento de `matchKey` son
 * acá campos independientes y no intercambiables (CF-SEARCH-011 §8):
 *   1. recuento de unidades farmacéuticas → `packageQuantity`
 *   2. volumen del envase                 → `packageVolume`
 *   3. denominador de la concentración    → `Concept.concentration` (ratio)
 *   4. unidad farmacéutica                → `Concept.pharmaceuticalUnit`
 */
export interface CanonicalPresentation {
  /** `CFM-P-<hash>`. */
  presentationId: string;
  conceptId: string;
  /** Unidades por envase. NUNCA un volumen. `null` si el nombre no la declara. */
  packageQuantity: number | null;
  /** Unidad contada (`comprimido`, `sobre`), o `null`. */
  packageUnit: string | null;
  /** Volumen del envase (`100 mL`). NUNCA una concentración. `null` si no se declara. */
  packageVolume: Measurement | null;
  /** `caja` | `frasco` | `tira` | `blister` | … solo cuando el nombre lo declara. */
  packageType: string | null;
  resolution: ResolutionTrace;
}

/**
 * EDM-100 · `CFM-PRODUCT-ID` — producto comercial de un laboratorio.
 *
 * ÚNICO nivel donde marca y fabricante participan de la identidad. `brand: null`
 * es un valor LEGÍTIMO (un genérico no tiene marca), no un dato faltante.
 */
export interface CommercialMedicinalProduct {
  /** `CFM-M-<hash>`. */
  productId: string;
  conceptId: string;
  presentationId: string;
  brand: string | null;
  /** Calificador comercial dentro de la familia de marca (`Forte`, `Rojo`), o `null`. */
  commercialVariant: string | null;
  /**
   * Momento de administración declarado (`day`/`night`), o `null`. Segundo eje
   * del artículo comercial: en v1 este dato vive escondido dentro de `matchKey`
   * como segmento `turn` y `commercialVariantKey` no puede verlo — ver
   * `readAdministrationTime()` en `canonicalAttributes.ts`.
   */
  administrationTime: "day" | "night" | null;
  /** Laboratorio. NUNCA se infiere del nombre (regla dura de CF-DATA-001). */
  manufacturer: string | null;
  /**
   * Registro sanitario ISP. Identificador FUERTE (E1) cuando existe.
   * FUERA DE ALCANCE DE S0: ningún adaptador lo captura todavía (CF-DATA-005 /
   * issue #156 es independiente). El modelo lo representa y el resolutor ya lo
   * prioriza; el valor es `null` en todo el corpus de S0.
   */
  ispRegistration: string | null;
  resolution: ResolutionTrace;
}

/**
 * EDM-200 · `CFM-OFFER-ID` — OBSERVACIÓN de mercado, no la entidad observada.
 *
 * DESVIACIÓN DELIBERADA respecto del boceto de `CANONICAL_IDENTITY_MODEL.md`
 * (que proponía `offerId = productId + pharmacyId + channel`): acá el `offerId`
 * depende ÚNICAMENTE de la observación (farmacia + referencia de origen), nunca
 * del `productId`. Motivo: si el ID de la observación dependiera del resultado
 * de la resolución, mejorar la resolución rotaría los IDs de ofertas que no
 * cambiaron — y una observación no deja de ser la misma observación porque el
 * motor aprenda a qué producto pertenece. `productId` viaja como clave foránea.
 * El propio documento declara que los nombres "no son un contrato cerrado".
 */
export interface CanonicalOffer {
  /** `CFM-O-<hash>` — determinista sobre farmacia + referencia de origen. */
  offerId: string;
  productId: string;
  presentationId: string;
  conceptId: string;
  pharmacy: PharmacySlug;
  /**
   * Identificador nativo de la farmacia. Hoy los adaptadores no lo emiten
   * (campo aditivo previsto para S1), así que se usa la URL de la ficha como
   * referencia de origen estable, y el nombre crudo cuando tampoco hay URL.
   */
  sourceProductId: string;
  /** Texto crudo conservado para linaje (EDM-500). Nunca se usa como identidad. */
  rawName: string;
  /** Se conserva TAL CUAL de v1: los 4 canales y `effective` no cambian en v2. */
  price: PriceChannels;
  /** Tri-estado. `null` cuando la fuente no lo declara de forma confiable. */
  stock: boolean | null;
  url: string | null;
  capturedAt: string;
  provenance: OfferProvenance;
}

// ---------------------------------------------------------------------------
// C. PROVENANCE
// ---------------------------------------------------------------------------

/**
 * Linaje completo de una observación (CF-SEARCH-011 §11, EDM-500).
 *
 * Separa explícitamente lo que la fuente DECLARÓ de lo que el motor INFIRIÓ, y
 * conserva las claves legacy para trazabilidad v1↔v2. Sin esto, "¿por qué estas
 * dos ofertas comparten `productId`?" solo se puede responder reejecutando
 * heurísticas a mano.
 */
export interface OfferProvenance {
  pharmacy: PharmacySlug;
  rawName: string;
  /** Campos que la farmacia entrega estructurados (no derivados del nombre). */
  upstreamFields: {
    brand: string | null;
    manufacturer: string | null;
    isBioequivalent: boolean | null;
    ispRegistration: string | null;
    url: string | null;
  };
  /** Atributos que el motor DERIVÓ del texto libre, con su lector de origen. */
  inferredFields: Record<string, string | null>;
  /** Claves de v1, conservadas SOLO para trazabilidad. Nunca son la identidad v2. */
  legacyMatchKey: string;
  legacyPresentationKey: string | null;
  /** Un `ResolutionTrace` por nivel. */
  resolution: {
    concept: ResolutionTrace;
    presentation: ResolutionTrace;
    product: ResolutionTrace;
  };
}

// ---------------------------------------------------------------------------
// D. ATRIBUTOS CANÓNICOS (etapa 2 — canonicalization)
// ---------------------------------------------------------------------------

/**
 * Salida de la etapa de canonicalización: texto libre → atributos tipados.
 *
 * **NO DECIDE IDENTIDAD.** Solo LEE. Ninguna función de este nivel compara dos
 * ofertas entre sí; esa es responsabilidad exclusiva de `canonicalIdentity.ts`.
 * Es la separación que v1 no tiene: allí `matchKey()` lee y decide en la misma
 * concatenación de texto.
 */
export interface CanonicalAttributes {
  activeIngredients: ActiveIngredient[];
  concentration: ConcentrationEvidence;
  dosageForm: DosageFormClass | null;
  route: AdministrationRoute | null;
  pharmaceuticalUnit: string | null;
  packageQuantity: number | null;
  packageUnit: string | null;
  packageVolume: Measurement | null;
  packageType: string | null;
  brand: string | null;
  commercialVariant: string | null;
  administrationTime: "day" | "night" | null;
  manufacturer: string | null;
  ispRegistration: string | null;
  /** Nombre canónico CONSTRUIDO desde los atributos, no copiado de una farmacia. */
  canonicalName: string;
  inferredFields: Record<string, string | null>;
}

/**
 * Entrada del pipeline v2: una observación cruda de una farmacia.
 *
 * Es deliberadamente un tipo propio y no `PharmacyPrice`: el motor v2 no debe
 * quedar acoplado al contrato público de v1, y necesita campos que v1 no
 * transporta (`sourceProductId`, `ispRegistration`, `structuredBrand`).
 */
export interface RawOfferInput {
  pharmacy: PharmacySlug;
  rawName: string;
  price: PriceChannels;
  stock: boolean | null;
  url: string | null;
  capturedAt: string;
  /** ID nativo de la farmacia cuando exista (aditivo, previsto para S1). */
  sourceProductId?: string | null;
  /** Campo estructurado de MARCA de la farmacia (hoy solo Salcobrand). */
  structuredBrand?: string | null;
  /** Campo estructurado de LABORATORIO de la farmacia. */
  structuredManufacturer?: string | null;
  isBioequivalent?: boolean | null;
  /** Registro sanitario ISP cuando la fuente lo exponga (fuera de alcance de S0). */
  ispRegistration?: string | null;
  /** `presentationKey` de v1, solo para trazabilidad. No participa de la identidad v2. */
  legacyPresentationKey?: string | null;
}

/** Grafo canónico completo producido por `canonicalize()`. */
export interface CanonicalGraph {
  concepts: Map<string, CanonicalMedicationConcept>;
  presentations: Map<string, CanonicalPresentation>;
  products: Map<string, CommercialMedicinalProduct>;
  offers: CanonicalOffer[];
}

/**
 * Tabla explícita forma farmacéutica → vía de administración.
 *
 * Es una TABLA, no una heurística: ninguna vía se infiere del texto. Se declara
 * acá y no en `productIdentity.ts` porque la vía es un atributo del modelo v2 y
 * v1 no la conoce.
 *
 * `ophthalmic` cubre también la vía ótica: la clase `DosageFormClass` de v1
 * agrupa colirio y gotas óticas en el mismo valor, y S0 no cambia la semántica
 * de v1 para beneficiar a v2 (CF-SEARCH-011 §4). Separarlas exige un lector de
 * forma propio de v2, registrado como deuda.
 */
export const ADMINISTRATION_ROUTE_BY_FORM: Readonly<
  Record<DosageFormClass, AdministrationRoute>
> = {
  "solid-oral": "oral",
  "fluid-oral": "oral",
  topical: "topical",
  injectable: "parenteral",
  inhaled: "inhalation",
  ophthalmic: "ophthalmic",
  suppository: "rectal",
  patch: "transdermal",
};
