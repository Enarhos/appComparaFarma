/**
 * Search Engine v2 — CONTRATOS DEL REGISTRO CANÓNICO PERSISTENTE
 * (CF-SEARCH-012, S1 · issue #163 · ADR-0005).
 *
 * ---------------------------------------------------------------------------
 * QUÉ RESUELVE ESTE MÓDULO QUE S0 NO PODÍA RESOLVER
 * ---------------------------------------------------------------------------
 * S0 demostró que se puede DERIVAR identidad canónica sobre ofertas reales, pero
 * lo hacía con claves `PROV-*` derivadas del contenido de la firma RESUELTA. Esa
 * clave rota cuando la firma cambia, y por lo tanto no puede ser un
 * `CFM-CONCEPT-ID`: el EDM exige que ese identificador *"nunca deberá cambiar"*
 * (`ENTERPRISE_DATA_MODEL.md`, EDM-100 · Identificador Canónico).
 *
 * S1 separa las tres responsabilidades en tres piezas que no se tocan entre sí:
 *
 *   CANONICALIZATION  texto libre → atributos tipados.  PURA por observación.
 *                     `canonicalAttributes.ts` (S0, sin cambios de conducta).
 *
 *   RESOLUTION        firma observada vs identidades YA PERSISTIDAS. Contextual
 *                     respecto del REGISTRO, nunca respecto de la consulta ni
 *                     del corpus recuperado. `canonicalResolver.ts`.
 *
 *   IDENTITY ASSIGNMENT  acuñar o reutilizar un ID permanente. Es la única pieza
 *                     que escribe. `canonicalIdentityAssigner.ts`.
 *
 * ---------------------------------------------------------------------------
 * LA REGLA DE ACUÑACIÓN (conclusión arquitectónica de S0, `DECISION.md` §3)
 * ---------------------------------------------------------------------------
 * Un `CFM-CONCEPT-ID` nuevo solo se acuña desde una firma COMPLETA — todos los
 * ejes del nivel declarados. Una observación PARCIAL tiene exactamente tres
 * destinos posibles y ninguno de ellos crea una identidad permanente:
 *
 *     resuelve contra UNA identidad existente  → `subsumed`
 *     no resuelve contra ninguna               → `unresolved`
 *     resuelve contra DOS O MÁS                → `ambiguous`
 *
 * La subsunción es válida para RESOLVER contra un registro estable; no lo es
 * para ACUÑAR identidad desde el conjunto circunstancial de ofertas que una
 * búsqueda devolvió. Esa distinción es el motivo entero de S1.
 *
 * ---------------------------------------------------------------------------
 * DE QUÉ NO PUEDE DEPENDER UNA IDENTIDAD PERSISTENTE
 * ---------------------------------------------------------------------------
 * Ni la consulta, ni el ranking, ni el orden de llegada, ni la farmacia, ni el
 * número de resultados, ni el conjunto de candidatos recuperados, ni el precio,
 * ni el stock, ni el canal comercial. Ninguno de esos datos entra en ninguna
 * firma de este módulo — se cumple por construcción, no por disciplina.
 *
 * ---------------------------------------------------------------------------
 * CARDINALIDADES: EL EDM **NO** DESCRIBE UNA CADENA LINEAL DE FKs
 * ---------------------------------------------------------------------------
 * `ENTERPRISE_DATA_MODEL.md` dibuja la secuencia
 * `Concepto → Presentación → Producto → Oferta` como la EVOLUCIÓN del
 * conocimiento hacia el mercado, no como una cadena de claves foráneas. Leyendo
 * las entidades reales:
 *
 *   · Presentación Farmacéutica — propiedades: **Concepto Farmacéutico**,
 *     Cantidad, Unidad, Contenido Total, Tipo de Envase.   ⇒ Presentación → Concepto.
 *
 *   · Producto Medicinal Comercial — propiedades: Marca Comercial, Laboratorio,
 *     Registro ISP, Estado, Condición de Bioequivalencia. **No incluye
 *     Presentación.** Y el Concepto declara relacionarse con *"múltiples
 *     Productos Medicinales Comerciales"* de forma directa.   ⇒ Producto → Concepto.
 *
 *   · Oferta — *"deberá referenciar un Producto Medicinal Comercial"*.
 *
 * Por lo tanto Producto y Presentación son **N:M**, no padre-hijo: "Tapsin
 * 500 mg comprimido (Lab. Maver)" es UN producto comercial que se vende en caja
 * de 16 y en caja de 30 —dos presentaciones—, y la caja de 30 hospeda además a
 * los productos de todos los demás laboratorios. La unidad que un usuario
 * compara no es ninguna de las dos por separado: es el PAR
 * `(producto, presentación)`, materializado en `canonical_product_presentations`.
 *
 * Es también la razón por la que este módulo NO reutiliza `productSignature()`
 * de S0 (que ancla el producto a la presentación): esa firma produce la
 * partición correcta de OFERTAS, pero cuenta como productos distintos a dos
 * cajas del mismo medicamento del mismo laboratorio. Ver
 * `canonicalIdentityAssigner.ts` § "Firmas del registro".
 *
 * ---------------------------------------------------------------------------
 * PROHIBIDO EN ESTE MÓDULO
 * ---------------------------------------------------------------------------
 * No hay SQL acá. El dominio define el CONTRATO del repositorio; la
 * implementación Supabase vive en `api/src/lib/canonicalRegistryDb.ts` y la
 * implementación en memoria (referencia semántica + tests + harness offline) en
 * `registryMemory.ts`. `matchKey` y `presentationKey` no son —ni pueden ser— PK
 * ni identidad v2: viajan solo como trazabilidad legacy.
 */

import type { PharmacySlug } from "../types.js";
import type { CanonicalAttributes } from "./canonicalTypes.js";

// ---------------------------------------------------------------------------
// A. VERSIONADO
// ---------------------------------------------------------------------------

/**
 * Versión de las REGLAS DE LECTURA (texto libre → atributos). Cambia cuando
 * cambia lo que el motor lee de un nombre: vocabulario de moléculas, lector de
 * asociaciones, negación, formas, vías, unidades.
 */
export const CANONICALIZER_VERSION = "v2.1.0";

/**
 * Versión de las REGLAS DE RESOLUCIÓN (firma observada → identidad del
 * registro). Cambia cuando cambia la política de acuñación, subsunción o
 * ambigüedad — no cuando cambia la lectura.
 */
export const RESOLVER_VERSION = "v2.1.0";

/**
 * Versión del FORMATO DE FIRMA. Es lo que hace comparables dos firmas
 * almacenadas: dos textos de firma de versiones distintas no se comparan nunca
 * directamente, se relacionan por alias (`recordSignatureAlias`).
 *
 * Empieza en 1: es la primera firma que se PERSISTE. Las firmas de S0 nunca se
 * persistieron (`PROV-*`, ver `canonicalIdentity.ts`), así que no hay versión 0
 * que preservar.
 */
export const SIGNATURE_VERSION = 1;

// ---------------------------------------------------------------------------
// B. IDENTIFICADORES PERMANENTES
// ---------------------------------------------------------------------------

/** Los cuatro niveles de identidad del EDM que este registro persiste. */
export type CanonicalEntityKind = "concept" | "presentation" | "product" | "offer";

/**
 * Prefijos de los IDs permanentes.
 *
 * CONVENCIÓN HEREDADA, NO INVENTADA. El proyecto ya emite IDs canónicos
 * permanentes con `'CFM-' || lpad(nextval(...), 6, '0')` en la tabla
 * `medications` (RFC-002, `docs/technology/database/schema.sql`). S1 conserva la
 * mecánica —secuencia + lpad(6)— y agrega el segmento de ENTIDAD que el EDM
 * nombra literalmente (`CFM-CONCEPT-ID`, `CFM-PRESENTATION-ID`,
 * `CFM-PRODUCT-ID`, `CFM-OFFER-ID`):
 *
 *     CFM-CONCEPT-000001      CFM-PRODUCT-000001
 *     CFM-PRESENTATION-000001 CFM-OFFER-000001
 *
 * El segmento de entidad no es decorativo: `medications.cfm_id` ya ocupa el
 * espacio `CFM-000123` con una identidad LEGACY derivada de `matchKey`. Sin el
 * segmento, los dos registros compartirían espacio de nombres y un `CFM-000123`
 * sería ambiguo entre dos modelos de identidad distintos.
 *
 * Un ID de secuencia, y no un hash del contenido, es la propiedad central:
 * `persistent ID stability = 100 %` exige que mejorar el canonicalizador NO
 * rote el identificador, y cualquier esquema content-addressed rota por
 * definición.
 */
export const CANONICAL_ID_PREFIX: Readonly<Record<CanonicalEntityKind, string>> = {
  concept: "CFM-CONCEPT-",
  presentation: "CFM-PRESENTATION-",
  product: "CFM-PRODUCT-",
  offer: "CFM-OFFER-",
};

/** `true` si `id` tiene la forma de un ID permanente del nivel indicado. */
export function isCanonicalId(kind: CanonicalEntityKind, id: string): boolean {
  const prefix = CANONICAL_ID_PREFIX[kind];
  if (!id.startsWith(prefix)) return false;
  const suffix = id.slice(prefix.length);
  return suffix.length >= 6 && /^[0-9]+$/.test(suffix);
}

/** Formatea un ID permanente desde el número de secuencia. Mismo lpad que RFC-002. */
export function formatCanonicalId(kind: CanonicalEntityKind, sequence: number): string {
  return `${CANONICAL_ID_PREFIX[kind]}${String(sequence).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// C. ESTADO Y RESOLUCIÓN
// ---------------------------------------------------------------------------

/**
 * Estado de una identidad persistida (EDM-100: "Estado" es propiedad mínima del
 * Concepto Farmacéutico).
 *
 *   `active`     — vigente.
 *   `merged`     — se demostró que era la misma identidad que otra; conserva su
 *                  ID para siempre y apunta a la ganadora (`mergedIntoId`). Un
 *                  ID nunca se borra ni se reasigna: es la única forma de que
 *                  una referencia antigua no se convierta en una mentira.
 *   `deprecated` — se dejó de usar sin sustituta.
 */
export type CanonicalEntityStatus = "active" | "merged" | "deprecated";

/**
 * Cómo se resolvió UNA observación contra el registro. Es el vocabulario que
 * exige el ticket para provenance, y cada valor es una decisión distinta:
 *
 *   `exact`      — la firma observada ya existe en el registro (o es alias de
 *                  una identidad existente). Se REUTILIZA el ID.
 *   `created`    — la firma es COMPLETA, no existía, y se acuñó un ID nuevo.
 *   `subsumed`   — la firma es PARCIAL y exactamente UNA identidad del registro
 *                  la hospeda. Se reutiliza ese ID; NO se acuña nada.
 *   `ambiguous`  — la firma es PARCIAL y DOS O MÁS identidades la hospedan. No
 *                  se elige. No se acuña. La observación queda sin identidad.
 *   `unresolved` — la firma es PARCIAL y ninguna identidad la hospeda. No se
 *                  acuña. La observación queda sin identidad, a la espera de que
 *                  el registro crezca o de que la fuente declare más.
 */
export type CanonicalResolutionOutcome =
  | "exact"
  | "created"
  | "subsumed"
  | "ambiguous"
  | "unresolved";

/** Resolución de un nivel: qué se decidió, contra qué, y por qué. */
export interface RegistryResolution {
  outcome: CanonicalResolutionOutcome;
  /** ID permanente asignado, o `null` en `ambiguous`/`unresolved`. */
  entityId: string | null;
  /** Firma tal cual la produjo la canonicalización de ESTA observación. */
  rawSignature: string;
  /** Firma de la identidad contra la que se resolvió (igual a la cruda si `exact`/`created`). */
  normalizedSignature: string;
  /** Ejes que la observación no declara. */
  unknownAxes: string[];
  /** Cuántas identidades del registro hospedaban la firma (0, 1 o N). */
  candidateCount: number;
  /** IDs candidatos, para poder auditar una ambigüedad sin reejecutar nada. */
  candidateIds: string[];
  /** Explicación legible. Es lo que responde "¿por qué esta oferta cayó acá?". */
  reason: string;
}

// ---------------------------------------------------------------------------
// D. REGISTROS PERSISTIDOS
// ---------------------------------------------------------------------------

/** Campos comunes a toda identidad persistida. */
export interface CanonicalEntityBase {
  /** ID PERMANENTE. Inmutable. Nunca se recalcula, nunca se deriva del contenido. */
  id: string;
  /** Firma canónica VIGENTE. Puede evolucionar; el `id` no la sigue. */
  canonicalSignature: string;
  /** Versión del formato de la firma vigente. */
  signatureVersion: number;
  /** Versión del canonicalizador con el que se acuñó la identidad. */
  canonicalizerVersion: string;
  /** Versión del resolutor con el que se acuñó la identidad. */
  resolverVersion: string;
  status: CanonicalEntityStatus;
  /** Identidad ganadora cuando `status === "merged"`. */
  mergedIntoId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * EDM-100 · Concepto Farmacéutico. Aggregate root del conocimiento.
 *
 * INMUTABLE: `id`. Puede evolucionar: `canonicalSignature`, `canonicalName`,
 * `atcCode`, `status`, y cualquier atributo enriquecido en el futuro.
 */
export interface CanonicalConceptRecord extends CanonicalEntityBase {
  canonicalName: string;
  /** Tokens de principio activo, ordenados. Vacío ⇒ `identityStatus` lo declara. */
  activeIngredients: string[];
  declaredComponentCount: number;
  identityStatus: "resolved" | "unresolved-ingredient";
  unresolvedIdentityDiscriminator: string | null;
  /** Texto de la concentración (`30mg/5ml`, `500mg`, `?`). */
  concentration: string;
  canonicalDosageForm: string | null;
  route: string | null;
  pharmaceuticalUnit: string | null;
  /** Fuera de alcance de S1 (depende de una fuente regulatoria confiable). */
  atcCode: string | null;
}

/** EDM-100 · Presentación Farmacéutica. Pertenece a UN concepto. */
export interface CanonicalPresentationRecord extends CanonicalEntityBase {
  conceptId: string;
  packageQuantity: number | null;
  packageUnit: string | null;
  /** Volumen normalizado a unidad base (`100ml`), o `null`. Nunca una concentración. */
  packageVolume: string | null;
  packageType: string | null;
}

/**
 * EDM-100 · Producto Medicinal Comercial. Pertenece a UN concepto — NO a una
 * presentación (ver cabecera del módulo). Marca y laboratorio solo participan
 * de la identidad en este nivel.
 */
export interface CanonicalProductRecord extends CanonicalEntityBase {
  conceptId: string;
  brand: string | null;
  commercialVariant: string | null;
  administrationTime: string | null;
  manufacturer: string | null;
  /**
   * EDM-100 · Registro Sanitario. Evidencia más fuerte del modelo cuando existe.
   * CF-DATA-005 / #156 lo captura de forma independiente; el contrato ya está y
   * capturarlo será un cambio de datos, no de arquitectura. **No se usa como
   * fuente de verdad canónica mientras #157 siga abierto** (ADR-0005 §"Fuente ISP").
   */
  ispRegistration: string | null;
}

/**
 * El PAR `(producto, presentación)` — la unidad comparable real, y la relación
 * N:M que el EDM implica y una cadena lineal de FKs habría perdido.
 *
 * Es lo que un usuario compara: "Tapsin 500 mg del Lab. Maver, caja de 30". El
 * producto sin presentación no es comprable; la presentación sin producto no es
 * un artículo.
 */
export interface CanonicalProductPresentationRecord {
  productId: string;
  presentationId: string;
  conceptId: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

/**
 * EDM-200 · Oferta — la OBSERVACIÓN de mercado.
 *
 * INMUTABLE: `id` y la identidad de la observación (farmacia + referencia de
 * origen). Los enlaces a concepto/presentación/producto son NULLABLE a
 * propósito: una observación puede estar resuelta a nivel de concepto y sin
 * resolver a nivel de producto, y forzar un valor sería inventarlo.
 *
 * NO GUARDA PRECIO NI STOCK. El precio es del dominio de mercado y ya vive en
 * `price_history`; duplicarlo acá crearía una segunda fuente de verdad
 * comercial. Este registro es de IDENTIDAD.
 */
export interface CanonicalOfferObservationRecord {
  id: string;
  pharmacy: PharmacySlug;
  /** Referencia estable en la fuente (id nativo, o URL de ficha, o nombre). */
  sourceProductId: string;
  rawName: string;
  conceptId: string | null;
  presentationId: string | null;
  productId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

/**
 * EDM-500 · Linaje. UNA fila por resolución de UNA observación en UN nivel.
 *
 * Existe para responder *"¿por qué esta oferta fue asignada a este Concepto?"*
 * sin reconstruir el código histórico: guarda las tres versiones, las dos
 * firmas, la evidencia declarada por la fuente, la inferida por el motor y los
 * ejes desconocidos. Es append-only.
 *
 * SIN DATOS PERSONALES. Es metadata de producto y de oferta: farmacia, nombre
 * de producto, firmas. Ninguna columna admite consulta de usuario, IP, sesión
 * ni identificador de persona — y la consulta no entra siquiera como parámetro
 * en las funciones que escriben acá.
 */
export interface CanonicalResolutionRecord {
  offerObservationId: string;
  entityKind: CanonicalEntityKind;
  outcome: CanonicalResolutionOutcome;
  entityId: string | null;
  rawSignature: string;
  normalizedSignature: string;
  signatureVersion: number;
  canonicalizerVersion: string;
  resolverVersion: string;
  unknownAxes: string[];
  candidateCount: number;
  candidateIds: string[];
  reason: string;
  /** Campos que la FARMACIA entrega estructurados. */
  upstreamFields: Record<string, string | null>;
  /** Campos que el MOTOR derivó del texto libre. */
  inferredFields: Record<string, string | null>;
  /** Claves de v1, solo trazabilidad. Nunca identidad v2. */
  legacyMatchKey: string | null;
  legacyPresentationKey: string | null;
  resolvedAt: string;
}

/**
 * Alias de firma → identidad. Es el índice de búsqueda del registro **y** el
 * mecanismo que hace que un ID no rote nunca.
 *
 * Cuando una mejora del canonicalizador cambia la firma de un concepto, no se
 * acuña un ID nuevo: se registra la firma NUEVA como un alias más de la
 * identidad que ya existía (`rebindSignature`). El ID permanente sobrevive a
 * sus propias reglas de derivación — que es exactamente lo que
 * `persistentIdInstability = 0` mide.
 */
export interface CanonicalSignatureAliasRecord {
  entityKind: CanonicalEntityKind;
  signature: string;
  signatureVersion: number;
  entityId: string;
  canonicalizerVersion: string;
  /** `true` para la firma vigente de la identidad; `false` para las históricas. */
  isCurrent: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// E. ENTRADAS DE ESCRITURA
// ---------------------------------------------------------------------------

/** Datos necesarios para acuñar un concepto. La firma DEBE ser completa. */
export interface ConceptDraft {
  canonicalSignature: string;
  canonicalName: string;
  activeIngredients: string[];
  declaredComponentCount: number;
  identityStatus: "resolved" | "unresolved-ingredient";
  unresolvedIdentityDiscriminator: string | null;
  concentration: string;
  canonicalDosageForm: string | null;
  route: string | null;
  pharmaceuticalUnit: string | null;
}

export interface PresentationDraft {
  canonicalSignature: string;
  conceptId: string;
  packageQuantity: number | null;
  packageUnit: string | null;
  packageVolume: string | null;
  packageType: string | null;
}

export interface ProductDraft {
  canonicalSignature: string;
  conceptId: string;
  brand: string | null;
  commercialVariant: string | null;
  administrationTime: string | null;
  manufacturer: string | null;
  ispRegistration: string | null;
}

export interface OfferObservationDraft {
  pharmacy: PharmacySlug;
  sourceProductId: string;
  rawName: string;
  conceptId: string | null;
  presentationId: string | null;
  productId: string | null;
  observedAt: string;
}

/**
 * Candidato del registro para resolver una firma. Es lo MÍNIMO que el resolutor
 * necesita: nunca recibe la entidad completa, para que ninguna decisión de
 * identidad pueda mirar un atributo que no sea la firma.
 */
export interface RegistryCandidate {
  entityId: string;
  signature: string;
  signatureVersion: number;
}

// ---------------------------------------------------------------------------
// F. CONTRATO DEL REPOSITORIO
// ---------------------------------------------------------------------------

/**
 * Puerto de persistencia del registro canónico.
 *
 * REGLA DURA: ninguna sentencia SQL vive fuera de una implementación de esta
 * interfaz, y `searchService` / `handleSearchRoute` no la conocen — hablan con
 * el ASIGNADOR, que habla con el repositorio. Es la separación que el ticket
 * exige y la que permite correr S1 entero offline contra `InMemoryCanonicalRegistry`
 * con la misma semántica que contra Supabase.
 *
 * CONCURRENCIA E IDEMPOTENCIA. `create*` NO puede acuñar dos IDs para la misma
 * firma completa aunque dos procesos la llamen a la vez. La implementación debe
 * apoyarse en una restricción UNIQUE `(entity_kind, signature_version,
 * signature)` y resolver el conflicto LEYENDO al ganador, nunca reintentando la
 * inserción. Por eso `create*` devuelve `{ record, created }`: el llamador
 * necesita saber si acuñó o si perdió la carrera, para reportar
 * `identity_created` frente a `identity_reused` sin mentir.
 *
 * DEGRADACIÓN. Ningún método lanza. Las lecturas devuelven `[]` y las
 * escrituras `null` ante cualquier fallo (Supabase sin configurar, tablas
 * ausentes, red caída). `null` en un `create*` significa *"no se pudo acuñar"*,
 * y el asignador lo traduce a `unresolved` — nunca a un identificador
 * inventado, y nunca a una excepción que aborte el resto del lote. Si el
 * registro cae, la búsqueda v1 termina normalmente: v1 no llama a nada de acá.
 */
export interface CanonicalRegistryRepository {
  /** Identidades del registro cuya firma podría hospedar a `signature`. */
  findConceptCandidates(signature: string, signatureVersion: number): Promise<RegistryCandidate[]>;
  findPresentationCandidates(
    signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]>;
  findProductCandidates(
    signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]>;

  /**
   * Acuñación idempotente. `created: false` ⇒ la firma ya existía (o se perdió
   * la carrera y se reutiliza al ganador). `null` ⇒ no se pudo acuñar.
   */
  createConcept(
    draft: ConceptDraft
  ): Promise<{ record: CanonicalConceptRecord; created: boolean } | null>;
  createPresentation(
    draft: PresentationDraft
  ): Promise<{ record: CanonicalPresentationRecord; created: boolean } | null>;
  createProduct(
    draft: ProductDraft
  ): Promise<{ record: CanonicalProductRecord; created: boolean } | null>;

  /** Enlace N:M producto × presentación. Idempotente. */
  linkProductPresentation(
    productId: string,
    presentationId: string,
    conceptId: string,
    observedAt: string
  ): Promise<void>;

  /** Alta o actualización de la observación. Idempotente por (farmacia, fuente). */
  recordObservationResolution(
    draft: OfferObservationDraft,
    resolutions: CanonicalResolutionRecord[]
  ): Promise<CanonicalOfferObservationRecord | null>;

  /** Linaje append-only. Nunca actualiza ni borra. */
  recordProvenance(records: CanonicalResolutionRecord[]): Promise<void>;

  /**
   * Asocia una firma NUEVA a una identidad EXISTENTE sin rotar su ID. Es la
   * operación que mantiene `persistentIdInstability = 0` cuando cambian las
   * reglas de canonicalización.
   */
  rebindSignature(
    kind: CanonicalEntityKind,
    entityId: string,
    signature: string,
    signatureVersion: number,
    canonicalizerVersion: string
  ): Promise<void>;
}

/**
 * Atributos + claves legacy de una observación, listos para el asignador.
 * `legacy*` viaja para trazabilidad v1↔v2 y NO participa de ninguna firma.
 */
export interface ObservationInput {
  pharmacy: PharmacySlug;
  rawName: string;
  sourceProductId: string;
  observedAt: string;
  attributes: CanonicalAttributes;
  upstreamFields: Record<string, string | null>;
  legacyMatchKey: string | null;
  legacyPresentationKey: string | null;
}

/** Resultado de asignar identidad persistente a UNA observación. */
export interface AssignedIdentity {
  observationId: string | null;
  concept: RegistryResolution;
  presentation: RegistryResolution;
  product: RegistryResolution;
  /** `true` si el par (producto, presentación) quedó enlazado. */
  linked: boolean;
}
