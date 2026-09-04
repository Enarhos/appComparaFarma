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
 * ---------------------------------------------------------------------------
 * ESTAS ENTIDADES NO LLEVAN IDENTIFICADORES CFM (revisión CTO PR #159, punto 3)
 * ---------------------------------------------------------------------------
 * El EDM exige que `CFM-CONCEPT-ID` sea PERMANENTE y no cambie nunca. S0 no
 * tiene registro persistido: lo único que puede calcular es una CLAVE
 * PROVISIONAL derivada del contenido de la firma resuelta. Por eso ningún campo
 * de este módulo se llama `conceptId` ni emite el prefijo `CFM-`:
 *
 *     provisionalConceptKey       `PROV-C-…`
 *     provisionalPresentationKey  `PROV-P-…`
 *     provisionalProductKey       `PROV-M-…`
 *     provisionalOfferKey         `PROV-O-…`
 *
 * Una clave provisional es la CLAVE DE BÚSQUEDA de una firma, no la identidad de
 * la entidad. Rota cuando la firma cambia (por una corrección de atributo o por
 * una subsunción distinta), y eso es exactamente lo que un `CFM-CONCEPT-ID` no
 * puede hacer. La frontera con el registro persistido de S1 está documentada en
 * `docs/qa/cf-search-011/CANONICAL_IDENTITY_IMPLEMENTATION.md` §"Provisional vs
 * persistente". Ningún consumidor debe persistir estas claves ni exponerlas.
 *
 * AISLAMIENTO (CF-SEARCH-011 §4, §22). Este árbol NO se exporta desde
 * `packages/domain/src/index.ts` y ningún módulo de v1 lo importa: v1 es
 * inmutable en S0 y el motor v2 corre exclusivamente en shadow mode, fuera del
 * camino productivo. La superficie pública de `@comparafarma/domain` no cambia.
 * El harness de evaluación carga `dist/searchV2/index.js` por ruta, el mismo
 * patrón que ya usan los scripts de CF-SEARCH-003, CF-DATA-001 y CF-SEARCH-010.
 *
 * LAS CINCO INVARIANTES DE IDENTIDAD (CANONICAL_IDENTITY_MODEL §1):
 *   1. la clave de concepto nunca depende de marca, laboratorio, farmacia ni precio.
 *   2. la clave de presentación nunca depende de marca ni de laboratorio.
 *   3. la clave de producto es la única que puede depender de marca y fabricante.
 *   4. la clave de oferta es la única que puede depender de la farmacia.
 *   5. NINGUNA depende de la consulta del usuario ni del ranking.
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
 * Vía de administración (EDM-100, dimensión 4 del Concepto Farmacéutico).
 *
 * Se lee del texto cuando el nombre la DECLARA y, si no, se deriva de
 * `CanonicalDosageForm` por la tabla explícita
 * `ADMINISTRATION_ROUTE_BY_CANONICAL_FORM`. Ningún catálogo la entrega como
 * campo estructurado (medido en CF-SEARCH-010: cobertura 0 %), pero varios la
 * escriben dentro del nombre ("Solución **Oral**", "Gel **Dérmico**").
 *
 * `otic` y `vaginal` no existen en la tabla equivalente de v1 y son la razón
 * medible por la que la vía es un eje propio y no un adorno: v1 clasifica el
 * óvulo como `suppository` (⇒ rectal) y las gotas óticas como `ophthalmic`
 * (⇒ oftálmica). Las dos son afirmaciones falsas sobre cómo se administra un
 * medicamento.
 */
export type AdministrationRoute =
  | "oral"
  | "topical"
  | "parenteral"
  | "inhalation"
  | "ophthalmic"
  | "otic"
  | "nasal"
  | "rectal"
  | "vaginal"
  | "transdermal";

/**
 * Forma Farmacéutica canónica (EDM-100, dimensión 3 del Concepto Farmacéutico).
 *
 * POR QUÉ EXISTE, Y POR QUÉ NO ES `DosageFormClass`
 * -------------------------------------------------
 * `dosageFormClass()` (v1, CF-SEARCH-001/003) es DELIBERADAMENTE gruesa: agrupa
 * en `solid-oral` todo lo que se traga entero y en `topical` todo lo que se
 * aplica sobre la piel. Sirve para lo que fue diseñada —evitar que un jarabe se
 * compare con una crema— pero NO es la Forma Farmacéutica del EDM, que enumera
 * literalmente "Comprimido, Cápsula, Jarabe, Suspensión, Crema, Solución,
 * Ampolla" como valores distintos.
 *
 * Medido sobre el corpus congelado de S0 (1.633 ofertas, 303 conceptos): 45
 * conceptos agrupaban más de una forma fina. La clasificación de esos 45 casos
 * decide qué se separa y qué no, y es evidencia, no criterio:
 *
 *   SE SEPARA — no hay ninguna fuente que use los dos términos para el mismo
 *   artículo, y el EDM los enumera por separado:
 *     · comprimido vs cápsula ...... 13 conceptos
 *     · crema vs gel ................ 3 conceptos
 *
 *   NO SE SEPARA — el corpus prueba que las farmacias usan los términos como
 *   sinónimos para EL MISMO artículo, y separarlos sería un falso split masivo:
 *     · jarabe / suspensión / solución / polvo para suspensión / gotas ... 28
 *       conceptos. Caso literal: Amoxicilina 250 mg/5 mL 60 mL es "Jarabe" en
 *       Salcobrand y Cruz Verde, "susp. Frasco" en Ahumada y "Polvo Para
 *       Suspensión Oral" en Dr. Simi. Es un solo artículo descrito desde tres
 *       ángulos. Lo mismo con "Solución Oral Para Gotas" vs "Oral Gotas"
 *       (Rigotax 10 mg/mL 15 mL).
 *
 * Por eso `liquido-oral` es UNA forma canónica y no cuatro: la distinción que el
 * EDM enumera entre jarabe, suspensión y solución no es observable en este
 * catálogo, y afirmarla produciría identidades falsas por partición. La
 * dimensión que sí separa un sobre de polvo de un frasco de jarabe es la UNIDAD
 * FARMACÉUTICA (`sobre`), que es un eje propio de la firma — y es la dimensión
 * que el EDM usa para eso.
 *
 * `polvo` y `sobre` NO son formas farmacéuticas del EDM: están enumerados bajo
 * Unidad Farmacéutica. Ver `readPharmaceuticalUnit()`.
 */
export type CanonicalDosageForm =
  | "comprimido"
  | "capsula"
  | "liquido-oral"
  | "crema"
  | "gel"
  | "pomada"
  | "locion"
  | "shampoo"
  | "inyectable"
  | "inhalador"
  | "colirio"
  | "gotas-oticas"
  | "supositorio"
  | "ovulo"
  | "parche";

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

/**
 * Un principio activo DEMOSTRADO, con la evidencia que lo respalda.
 *
 * Un `ActiveIngredient` es una afirmación farmacológica: "esta molécula está en
 * este medicamento". Solo se construye cuando hay evidencia positiva:
 *
 *   `"vocabulary"`     — el token está en `COMPOSITION_VOCABULARY` (CF-DATA-001:
 *                        34 moléculas derivadas de una medición reproducible
 *                        sobre 3.697 ofertas, no de criterio humano) o en
 *                        `V2_MOLECULE_VOCABULARY` (derivado del corpus congelado
 *                        con el mismo criterio, ver `compositionReader.ts`).
 *   `"combination"`    — el token participa de una combinación reconocida por
 *                        `combinationKey()` (CF-SEARCH-001/S-1), cuya firma
 *                        tipográfica ("Losartán / Hidroclorotiazida 50/12,5 mg")
 *                        demuestra que ambos lados son principios activos.
 *   `"dose-annotated"` — el token lleva SU PROPIA dosis en el texto
 *                        ("diclofenaco 25 mg **tramadol 25 mg**") y comparte esa
 *                        estructura con al menos un hermano ya corroborado. Es
 *                        la evidencia que agrega el lector de asociaciones de v2
 *                        y la que corrige el falso merge de Adorlan.
 *
 * NO EXISTE una evidencia `"unresolved-head"` (revisión CTO PR #159, punto 2).
 * Una cabecera textual no resuelta —"tapsin", "muxol"— NO es un principio
 * activo y no puede entrar en este tipo: vive en
 * `CanonicalAttributes.unresolvedIdentityDiscriminator`, que es un discriminante
 * de seguridad y no conocimiento farmacológico. Ver `readActiveIngredients()`.
 */
export interface ActiveIngredient {
  /** Token normalizado, sin acentos y en minúscula (`"ambroxol"`). */
  token: string;
  evidence: "vocabulary" | "combination" | "dose-annotated";
}

/**
 * Dosis DE UN COMPONENTE dentro de una asociación, conservada aparte de
 * `CanonicalMedicationConcept.concentration`.
 *
 * POR QUÉ ES UN CAMPO NUEVO Y NO UN REEMPLAZO (CF-SEARCH-011, iteración de
 * asociaciones). `concentration` admite UNA sola evidencia, y para una asociación
 * eso es estructuralmente insuficiente: "Diclofenaco 25 mg + Tramadol 25 mg" tiene
 * dos potencias, no una. Modelar bien la concentración de una asociación es un
 * cambio del EDM y NO se hace en S0.
 *
 * Lo que sí se hace es no PERDER el dato y no AFIRMAR de más:
 *   · `concentration` conserva la semántica que ya tenía —la primera magnitud de
 *     masa del nombre, es decir la del primer componente escrito— y eso queda
 *     documentado como limitación conocida, no como el modelo final;
 *   · `ingredientStrengths` preserva la dosis por componente para el análisis de
 *     S1, con el conjunto completo de moléculas;
 *   · la SEGURIDAD no depende de ninguno de los dos: lo que impide que una
 *     asociación se confunda con un monofármaco es el CONJUNTO de principios
 *     activos y su CARDINALIDAD DECLARADA en el eje `ing` de la firma.
 *
 * NO PARTICIPA DE NINGUNA FIRMA DE IDENTIDAD. Es evidencia conservada, no un eje.
 */
export interface IngredientStrength {
  token: string;
  /** Dosis declarada para ese componente, o `null` si el nombre no la da. */
  strength: Measurement | null;
}

/**
 * Estado de identidad farmacológica de un Concepto.
 *
 *   `"resolved"`              — se demostró al menos un principio activo.
 *   `"unresolved-ingredient"` — NO se demostró ninguno. El concepto existe
 *                               (ninguna oferta se pierde) pero NO afirma qué
 *                               molécula contiene.
 */
export type ConceptIdentityStatus = "resolved" | "unresolved-ingredient";

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
  /**
   * `PROV-C-<hash>` — CLAVE PROVISIONAL, no un `CFM-CONCEPT-ID`. Determinista
   * sobre la firma resuelta del concepto; rota si la firma cambia. Ver la
   * cabecera de este archivo.
   */
  provisionalConceptKey: string;
  /**
   * Construido desde los atributos, NUNCA copiado del nombre de una farmacia.
   * Cuando `identityStatus` es `"unresolved-ingredient"`, este nombre NO
   * presenta ningún token como principio activo.
   */
  canonicalName: string;
  /**
   * Principios activos DEMOSTRADOS, ordenados alfabéticamente: el orden textual
   * del nombre no crea identidades distintas. Puede estar vacío — y entonces
   * `identityStatus` lo declara explícitamente.
   */
  activeIngredients: ActiveIngredient[];
  /**
   * Cantidad MÍNIMA de componentes activos que el nombre declara tener. Puede
   * ser MAYOR que `activeIngredients.length`: significa "el nombre afirma que
   * hay N componentes y solo se pudieron nombrar M". Ver
   * `IngredientComposition.declaredComponentCount`.
   */
  declaredComponentCount: number;
  /** Dosis por componente. Evidencia conservada, nunca un eje de identidad. */
  ingredientStrengths: IngredientStrength[];
  identityStatus: ConceptIdentityStatus;
  /**
   * Cabecera textual no resuelta ("tapsin"), o `null`. NO es un principio
   * activo: es el discriminante que impide que una observación desconocida se
   * fusione con un concepto conocido. Ver `CanonicalAttributes`.
   */
  unresolvedIdentityDiscriminator: string | null;
  concentration: ConcentrationEvidence;
  /** EDM-100 · Forma Farmacéutica. Es el eje de identidad. */
  canonicalDosageForm: CanonicalDosageForm | null;
  /**
   * Clase gruesa de v1 (`solid-oral`, …). Se publica como ATRIBUTO para
   * trazabilidad y para los usos que ya la consumen; NO es el eje de identidad
   * del concepto desde la revisión del PR #159.
   */
  dosageFormClass: DosageFormClass | null;
  /** EDM-100 · Vía de Administración. Es el eje de identidad. */
  route: AdministrationRoute | null;
  /** EDM-100 · Unidad Farmacéutica (`comprimido`, `sobre`). Es el eje de identidad. */
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
  /** `PROV-P-<hash>` — clave provisional, no un `CFM-PRESENTATION-ID`. */
  provisionalPresentationKey: string;
  provisionalConceptKey: string;
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
  /** `PROV-M-<hash>` — clave provisional, no un `CFM-PRODUCT-ID`. */
  provisionalProductKey: string;
  provisionalConceptKey: string;
  provisionalPresentationKey: string;
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
  /**
   * `PROV-O-<hash>` — clave provisional determinista sobre farmacia +
   * referencia de origen. Es la ÚNICA de las cuatro que no depende de ninguna
   * resolución: la observación no cambia porque el motor aprenda a qué producto
   * pertenece. Aun así se llama provisional porque el `CFM-OFFER-ID` del EDM lo
   * asigna el registro persistido de S1, no un hash del contenido.
   */
  provisionalOfferKey: string;
  provisionalProductKey: string;
  provisionalPresentationKey: string;
  provisionalConceptKey: string;
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
  /** Principios activos DEMOSTRADOS. Vacío es un valor legítimo. */
  activeIngredients: ActiveIngredient[];
  /**
   * Cantidad MÍNIMA de componentes activos declarada por el nombre. Cuando supera
   * a `activeIngredients.length`, el nombre declara una ASOCIACIÓN cuyos
   * componentes no se pudieron nombrar por completo — y el eje `ing` de la firma
   * lo representa explícitamente en vez de hacerla pasar por un monofármaco.
   */
  declaredComponentCount: number;
  /** Dosis por componente. Evidencia conservada, nunca un eje de identidad. */
  ingredientStrengths: IngredientStrength[];
  /**
   * Moléculas que el nombre declara AUSENTES ("Tapsin Puro SIN Cafeína").
   * Evidencia conservada para el Gate D de S1 (clase 7: componente explícitamente
   * negado frente a presente). NUNCA es un eje de identidad — ver
   * `IngredientComposition.negatedComponents`.
   */
  negatedComponents: string[];
  /**
   * DISCRIMINANTE DE IDENTIDAD NO RESUELTA — la corrección del punto 2 de la
   * revisión CTO del PR #159.
   *
   * Cuando no se pudo demostrar NINGÚN principio activo, este campo lleva la
   * cabecera textual del nombre ("tapsin", "muxol", "broncot") y
   * `activeIngredients` queda VACÍO. Los dos hechos se representan a la vez y
   * sin mezclarse:
   *
   *   1. NO SE INVENTA CONOCIMIENTO — "Tapsin Forte" no demuestra que "tapsin"
   *      sea una molécula, y por eso el token no aparece como
   *      `ActiveIngredient` en ninguna parte, ni en `canonicalName`, ni en las
   *      métricas de cobertura de principio activo.
   *   2. NO SE FUSIONA LO DESCONOCIDO CON LO CONOCIDO — el discriminante SÍ
   *      participa de la firma del concepto como eje propio (`disc`), así que
   *      "Tapsin Forte x 30 comprimidos" no puede subsumirse dentro del
   *      concepto "paracetamol 500 mg comprimido" por ausencia de evidencia, y
   *      dos ofertas de Tapsin Forte de dos farmacias distintas siguen
   *      agrupando entre sí.
   *
   * `UNKNOWN` sigue siendo conservador, pero `UNKNOWN != ACTIVE_INGREDIENT`.
   */
  unresolvedIdentityDiscriminator: string | null;
  concentration: ConcentrationEvidence;
  /** EDM-100 · Forma Farmacéutica. Eje de identidad del concepto. */
  canonicalDosageForm: CanonicalDosageForm | null;
  /** Clase gruesa de v1. Atributo de trazabilidad, NO eje de identidad. */
  dosageFormClass: DosageFormClass | null;
  /** EDM-100 · Vía de Administración. Eje de identidad del concepto. */
  route: AdministrationRoute | null;
  /** EDM-100 · Unidad Farmacéutica. Eje de identidad del concepto. */
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
 * Tabla explícita FORMA FARMACÉUTICA CANÓNICA → VÍA DE ADMINISTRACIÓN.
 *
 * Es una TABLA, no una heurística. Se usa como valor POR DEFECTO cuando el
 * nombre no declara la vía; si el nombre la declara, gana el texto (ver
 * `readAdministrationRoute()`).
 *
 * Dos entradas corrigen afirmaciones falsas que la tabla equivalente sobre
 * `DosageFormClass` no podía evitar, porque v1 no distingue esas formas:
 *   · `ovulo` → `vaginal` (v1 lo clasifica como `suppository` ⇒ rectal);
 *   · `gotas-oticas` → `otic` (v1 lo clasifica como `ophthalmic` ⇒ oftálmica).
 *
 * `inyectable` se mapea a `parenteral` y no a intravenosa/intramuscular: el EDM
 * enumera las dos, pero ningún nombre del catálogo permite distinguirlas.
 * Afirmar una sería inventar. `parenteral` es la granularidad sostenible con la
 * evidencia disponible.
 */
export const ADMINISTRATION_ROUTE_BY_CANONICAL_FORM: Readonly<
  Record<CanonicalDosageForm, AdministrationRoute>
> = {
  comprimido: "oral",
  capsula: "oral",
  "liquido-oral": "oral",
  crema: "topical",
  gel: "topical",
  pomada: "topical",
  locion: "topical",
  shampoo: "topical",
  inyectable: "parenteral",
  inhalador: "inhalation",
  colirio: "ophthalmic",
  "gotas-oticas": "otic",
  supositorio: "rectal",
  ovulo: "vaginal",
  parche: "transdermal",
};

/**
 * Tabla equivalente sobre la clase gruesa de v1. Se conserva SOLO para
 * trazabilidad y para poder demostrar, en la documentación de la revisión, que
 * sobre `DosageFormClass` la vía era una función total —y por lo tanto un eje
 * sin poder discriminante— antes de introducir `CanonicalDosageForm`.
 * No se usa para construir identidad.
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
