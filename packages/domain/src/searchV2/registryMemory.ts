/**
 * Search Engine v2 — implementación EN MEMORIA del registro canónico
 * (CF-SEARCH-012, S1).
 *
 * Es la REFERENCIA SEMÁNTICA del contrato `CanonicalRegistryRepository`, y
 * cumple tres funciones a la vez:
 *
 *   1. es lo que corre en los tests de identidad persistente — los siete
 *      (independencia de consulta, de farmacia, de orden, de corpus,
 *      observación parcial, creación concurrente y cambio de versión del
 *      canonicalizador) se verifican acá, sin base de datos;
 *   2. es el motor del harness offline que recalcula S0 entero con la
 *      implementación persistente y mide los gates de S1;
 *   3. es la definición ejecutable de qué debe hacer la implementación Supabase.
 *
 * NO ES UNA MAQUETA. Modela explícitamente las dos propiedades que en Postgres
 * dan las restricciones y que un `Map` ingenuo NO daría:
 *
 *   · UNIQUE `(entity_kind, signature_version, signature)` — la sección que
 *     comprueba y escribe es SÍNCRONA, sin `await` en el medio. Es exactamente
 *     la atomicidad que da la restricción: dos llamadas concurrentes con la
 *     misma firma completa producen UN registro, una con `created: true` y otra
 *     con `created: false`.
 *   · IDs de SECUENCIA, no derivados del contenido. Un ID emitido nunca se
 *     recalcula ni se reasigna, aunque su firma cambie después.
 *
 * `findConceptCandidates` ESCANEA el registro completo a propósito: es la
 * semántica exacta, y es la que mide los gates. La implementación Supabase usa
 * el prefiltro por `bucketKeys` (ver `conceptBucketKeys`), que es un
 * SUBCONJUNTO conservador — puede producir `unresolved` de más, nunca un merge
 * de más. La diferencia entre ambas está medida en `S1_METRICS.md`.
 */

import type { PharmacySlug } from "../types.js";
import {
  CANONICALIZER_VERSION,
  RESOLVER_VERSION,
  SIGNATURE_VERSION,
  formatCanonicalId,
  type CanonicalConceptRecord,
  type CanonicalEntityKind,
  type CanonicalOfferObservationRecord,
  type CanonicalPresentationRecord,
  type CanonicalProductPresentationRecord,
  type CanonicalProductRecord,
  type CanonicalRegistryRepository,
  type CanonicalResolutionRecord,
  type CanonicalSignatureAliasRecord,
  type ConceptDraft,
  type OfferObservationDraft,
  type PresentationDraft,
  type ProductDraft,
  type RegistryCandidate,
} from "./registryTypes.js";
import { observationKey } from "./canonicalIdentityAssigner.js";

/** Clave de la restricción UNIQUE. Mismo triple que en Postgres. */
function uniqueKey(kind: CanonicalEntityKind, version: number, signature: string): string {
  return `${kind}|${version}|${signature}`;
}

export class InMemoryCanonicalRegistry implements CanonicalRegistryRepository {
  readonly concepts = new Map<string, CanonicalConceptRecord>();
  readonly presentations = new Map<string, CanonicalPresentationRecord>();
  readonly products = new Map<string, CanonicalProductRecord>();
  readonly productPresentations = new Map<string, CanonicalProductPresentationRecord>();
  readonly observations = new Map<string, CanonicalOfferObservationRecord>();
  readonly provenance: CanonicalResolutionRecord[] = [];
  readonly aliases = new Map<string, CanonicalSignatureAliasRecord>();

  /** Contadores de secuencia, uno por nivel. Monótonos, nunca se reinician. */
  private readonly sequences: Record<CanonicalEntityKind, number> = {
    concept: 0,
    presentation: 0,
    product: 0,
    offer: 0,
  };

  /**
   * Gancho de latencia para los tests de concurrencia: permite intercalar dos
   * llamadas a `create*` en el punto exacto donde una implementación real haría
   * el round-trip a la base. La sección crítica que sigue es síncrona.
   */
  latencyHook: (() => Promise<void>) | null = null;

  private now(): string {
    return "1970-01-01T00:00:00.000Z";
  }

  private nextId(kind: CanonicalEntityKind): string {
    this.sequences[kind] += 1;
    return formatCanonicalId(kind, this.sequences[kind]);
  }

  /** Alias vigente de una identidad. Es el índice de búsqueda del registro. */
  private putAlias(
    kind: CanonicalEntityKind,
    signature: string,
    entityId: string,
    isCurrent: boolean
  ): void {
    const key = uniqueKey(kind, SIGNATURE_VERSION, signature);
    const existing = this.aliases.get(key);
    if (existing) return;
    this.aliases.set(key, {
      entityKind: kind,
      signature,
      signatureVersion: SIGNATURE_VERSION,
      entityId,
      canonicalizerVersion: CANONICALIZER_VERSION,
      isCurrent,
      createdAt: this.now(),
    });
  }

  private candidates(kind: CanonicalEntityKind, version: number): RegistryCandidate[] {
    const out: RegistryCandidate[] = [];
    for (const alias of this.aliases.values()) {
      if (alias.entityKind !== kind || alias.signatureVersion !== version) continue;
      out.push({
        entityId: alias.entityId,
        signature: alias.signature,
        signatureVersion: alias.signatureVersion,
      });
    }
    // Orden determinista: el resultado de la resolución no puede depender del
    // orden de iteración de un Map.
    return out.sort((a, b) =>
      a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0
    );
  }

  async findConceptCandidates(
    _signature: string,
    signatureVersion: number
  ): Promise<RegistryCandidate[]> {
    return this.candidates("concept", signatureVersion);
  }

  async findPresentationCandidates(
    _signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]> {
    // El anclaje al concepto es un eje SIEMPRE declarado de la firma: una
    // presentación de otro concepto nunca puede hospedar a esta.
    return this.candidates("presentation", signatureVersion).filter((candidate) =>
      candidate.signature.startsWith(`concept=${conceptId}|`)
    );
  }

  async findProductCandidates(
    _signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]> {
    return this.candidates("product", signatureVersion).filter((candidate) =>
      candidate.signature.startsWith(`concept=${conceptId}|`)
    );
  }

  async createConcept(
    draft: ConceptDraft
  ): Promise<{ record: CanonicalConceptRecord; created: boolean }> {
    if (this.latencyHook) await this.latencyHook();

    // --- SECCIÓN CRÍTICA (equivalente a la UNIQUE de Postgres): sin `await`.
    const key = uniqueKey("concept", SIGNATURE_VERSION, draft.canonicalSignature);
    const existingAlias = this.aliases.get(key);
    if (existingAlias) {
      return { record: this.concepts.get(existingAlias.entityId)!, created: false };
    }
    const id = this.nextId("concept");
    const record: CanonicalConceptRecord = {
      id,
      canonicalSignature: draft.canonicalSignature,
      signatureVersion: SIGNATURE_VERSION,
      canonicalizerVersion: CANONICALIZER_VERSION,
      resolverVersion: RESOLVER_VERSION,
      status: "active",
      mergedIntoId: null,
      createdAt: this.now(),
      updatedAt: this.now(),
      canonicalName: draft.canonicalName,
      activeIngredients: draft.activeIngredients,
      declaredComponentCount: draft.declaredComponentCount,
      identityStatus: draft.identityStatus,
      unresolvedIdentityDiscriminator: draft.unresolvedIdentityDiscriminator,
      concentration: draft.concentration,
      canonicalDosageForm: draft.canonicalDosageForm,
      route: draft.route,
      pharmaceuticalUnit: draft.pharmaceuticalUnit,
      atcCode: null,
    };
    this.concepts.set(id, record);
    this.putAlias("concept", draft.canonicalSignature, id, true);
    // --- FIN SECCIÓN CRÍTICA
    return { record, created: true };
  }

  async createPresentation(
    draft: PresentationDraft
  ): Promise<{ record: CanonicalPresentationRecord; created: boolean }> {
    if (this.latencyHook) await this.latencyHook();

    const key = uniqueKey("presentation", SIGNATURE_VERSION, draft.canonicalSignature);
    const existingAlias = this.aliases.get(key);
    if (existingAlias) {
      return { record: this.presentations.get(existingAlias.entityId)!, created: false };
    }
    const id = this.nextId("presentation");
    const record: CanonicalPresentationRecord = {
      id,
      canonicalSignature: draft.canonicalSignature,
      signatureVersion: SIGNATURE_VERSION,
      canonicalizerVersion: CANONICALIZER_VERSION,
      resolverVersion: RESOLVER_VERSION,
      status: "active",
      mergedIntoId: null,
      createdAt: this.now(),
      updatedAt: this.now(),
      conceptId: draft.conceptId,
      packageQuantity: draft.packageQuantity,
      packageUnit: draft.packageUnit,
      packageVolume: draft.packageVolume,
      packageType: draft.packageType,
    };
    this.presentations.set(id, record);
    this.putAlias("presentation", draft.canonicalSignature, id, true);
    return { record, created: true };
  }

  async createProduct(
    draft: ProductDraft
  ): Promise<{ record: CanonicalProductRecord; created: boolean }> {
    if (this.latencyHook) await this.latencyHook();

    const key = uniqueKey("product", SIGNATURE_VERSION, draft.canonicalSignature);
    const existingAlias = this.aliases.get(key);
    if (existingAlias) {
      return { record: this.products.get(existingAlias.entityId)!, created: false };
    }
    const id = this.nextId("product");
    const record: CanonicalProductRecord = {
      id,
      canonicalSignature: draft.canonicalSignature,
      signatureVersion: SIGNATURE_VERSION,
      canonicalizerVersion: CANONICALIZER_VERSION,
      resolverVersion: RESOLVER_VERSION,
      status: "active",
      mergedIntoId: null,
      createdAt: this.now(),
      updatedAt: this.now(),
      conceptId: draft.conceptId,
      brand: draft.brand,
      commercialVariant: draft.commercialVariant,
      administrationTime: draft.administrationTime,
      manufacturer: draft.manufacturer,
      ispRegistration: draft.ispRegistration,
    };
    this.products.set(id, record);
    this.putAlias("product", draft.canonicalSignature, id, true);
    return { record, created: true };
  }

  async linkProductPresentation(
    productId: string,
    presentationId: string,
    conceptId: string,
    observedAt: string
  ): Promise<void> {
    const key = `${productId}|${presentationId}`;
    const existing = this.productPresentations.get(key);
    if (existing) {
      existing.lastSeenAt = observedAt;
      return;
    }
    this.productPresentations.set(key, {
      productId,
      presentationId,
      conceptId,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
    });
  }

  async recordObservationResolution(
    draft: OfferObservationDraft,
    _resolutions: CanonicalResolutionRecord[]
  ): Promise<CanonicalOfferObservationRecord | null> {
    const key = observationKey(draft.pharmacy, draft.sourceProductId);
    const existing = this.observations.get(key);
    if (existing) {
      existing.conceptId = draft.conceptId;
      existing.presentationId = draft.presentationId;
      existing.productId = draft.productId;
      existing.rawName = draft.rawName;
      existing.lastSeenAt = draft.observedAt;
      return existing;
    }
    const record: CanonicalOfferObservationRecord = {
      id: this.nextId("offer"),
      pharmacy: draft.pharmacy as PharmacySlug,
      sourceProductId: draft.sourceProductId,
      rawName: draft.rawName,
      conceptId: draft.conceptId,
      presentationId: draft.presentationId,
      productId: draft.productId,
      firstSeenAt: draft.observedAt,
      lastSeenAt: draft.observedAt,
    };
    this.observations.set(key, record);
    return record;
  }

  async recordProvenance(records: CanonicalResolutionRecord[]): Promise<void> {
    // Append-only, igual que en Postgres: nunca se actualiza ni se borra.
    this.provenance.push(...records);
  }

  async rebindSignature(
    kind: CanonicalEntityKind,
    entityId: string,
    signature: string,
    signatureVersion: number,
    canonicalizerVersion: string
  ): Promise<void> {
    // La firma ANTERIOR deja de ser la vigente pero SIGUE resolviendo a la misma
    // identidad: es un alias histórico, no una fila obsoleta. Borrarla rotaría el
    // ID para cualquier observación que todavía produzca la firma vieja.
    for (const alias of this.aliases.values()) {
      if (alias.entityKind === kind && alias.entityId === entityId) alias.isCurrent = false;
    }
    const key = uniqueKey(kind, signatureVersion, signature);
    this.aliases.set(key, {
      entityKind: kind,
      signature,
      signatureVersion,
      entityId,
      canonicalizerVersion,
      isCurrent: true,
      createdAt: this.now(),
    });

    const entity =
      kind === "concept"
        ? this.concepts.get(entityId)
        : kind === "presentation"
          ? this.presentations.get(entityId)
          : kind === "product"
            ? this.products.get(entityId)
            : undefined;
    if (entity) {
      entity.canonicalSignature = signature;
      entity.signatureVersion = signatureVersion;
      entity.canonicalizerVersion = canonicalizerVersion;
      entity.updatedAt = this.now();
    }
  }
}
