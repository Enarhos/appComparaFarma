/**
 * CF-SEARCH-012 (S1) — implementación Supabase del registro canónico
 * persistente de Search Engine v2.
 *
 * ---------------------------------------------------------------------------
 * ES EL ÚNICO ARCHIVO CON SQL/PostgREST DEL REGISTRO
 * ---------------------------------------------------------------------------
 * `searchService.ts` y `handleSearchRoute` no conocen este módulo: hablan con el
 * asignador del dominio, que habla con el puerto `CanonicalRegistryRepository`.
 * Nada de identidad se decide acá — acá solo se lee y se escribe.
 *
 * ---------------------------------------------------------------------------
 * DEGRADACIÓN ELEGANTE, IGUAL QUE `medicationRegistry.ts`
 * ---------------------------------------------------------------------------
 * NINGÚN método lanza. Supabase sin configurar, tablas todavía no creadas, red
 * caída o error de PostgREST producen `[]` en las lecturas y `null` en las
 * acuñaciones, que el asignador traduce a `unresolved` — nunca a un
 * identificador inventado. Si el registro cae, el shadow no escribe y **la
 * búsqueda v1 termina normalmente**: v1 nunca llama a este archivo.
 *
 * ---------------------------------------------------------------------------
 * CONCURRENCIA: `on conflict do nothing` + RELECTURA, NUNCA REINTENTO
 * ---------------------------------------------------------------------------
 * Cada `create*` inserta ignorando conflictos sobre
 * `(signature_version, canonical_signature)` y después LEE el alias. Si dos
 * invocaciones simultáneas presentan la misma firma completa, una gana la
 * inserción y la otra lee al ganador: sale UN identificador, nunca dos. El ID lo
 * genera la secuencia de Postgres (`DEFAULT`), no este código — no hay ninguna
 * ventana entre "elijo un id" y "lo inserto".
 *
 * ---------------------------------------------------------------------------
 * LÍMITES DE ESCRITURA
 * ---------------------------------------------------------------------------
 * `MAX_CANDIDATES` acota lo que se trae por resolución y `recordProvenance`
 * inserta en un solo lote. El shadow corre con muestreo y con timeout propio
 * (`searchV2Shadow.ts`): no puede degenerar en una tormenta de escrituras.
 *
 * ---------------------------------------------------------------------------
 * PRIVACIDAD
 * ---------------------------------------------------------------------------
 * Ninguna columna de estas tablas admite consulta del usuario, IP, sesión ni
 * identificador de persona. Es metadata de producto y de oferta: farmacia,
 * nombre publicado, firmas canónicas. La consulta ni siquiera llega como
 * parámetro a este módulo.
 */

import { supabase } from "./supabaseClient.js";
import {
  CANONICALIZER_VERSION,
  RESOLVER_VERSION,
  conceptBucketKeys,
  observationKey,
  type CanonicalConceptRecord,
  type CanonicalEntityKind,
  type CanonicalOfferObservationRecord,
  type CanonicalPresentationRecord,
  type CanonicalProductRecord,
  type CanonicalRegistryRepository,
  type CanonicalResolutionRecord,
  type ConceptDraft,
  type OfferObservationDraft,
  type PresentationDraft,
  type ProductDraft,
  type RegistryCandidate,
} from "@comparafarma/domain/searchV2";
import type { PharmacySlug } from "./types.js";

const CONCEPTS = "canonical_concepts";
const PRESENTATIONS = "canonical_presentations";
const PRODUCTS = "canonical_products";
const PRODUCT_PRESENTATIONS = "canonical_product_presentations";
const OBSERVATIONS = "canonical_offer_observations";
const RESOLUTIONS = "canonical_resolutions";
const ALIASES = "canonical_signature_aliases";

/** Techo de candidatos por resolución. Acota latencia y memoria del shadow. */
const MAX_CANDIDATES = 200;

function warn(operation: string, error: unknown): void {
  console.warn(
    JSON.stringify({
      scope: "canonicalRegistry",
      operation,
      error: error instanceof Error ? error.message : String(error),
    })
  );
}

interface AliasRow {
  entity_id: string;
  signature: string;
  signature_version: number;
}

/**
 * Fila cruda de una tabla de entidad. El `id` es lo único que este módulo
 * necesita conocer con certeza: lo genera la secuencia de Postgres dentro del
 * mismo `INSERT`, y es lo que se devuelve al asignador. El resto de las columnas
 * las traduce el mapeador correspondiente.
 */
type RegistryRow = Record<string, unknown> & { id: string };

function toCandidates(rows: AliasRow[] | null): RegistryCandidate[] {
  return (rows ?? []).map((row) => ({
    entityId: row.entity_id,
    signature: row.signature,
    signatureVersion: row.signature_version,
  }));
}

export class SupabaseCanonicalRegistry implements CanonicalRegistryRepository {
  /**
   * Candidatos de CONCEPTO por prefiltro de bucket.
   *
   * `conceptBucketKeys()` deriva del texto de la firma las claves que toda
   * anfitriona posible debe compartir (una por molécula nombrada, más el
   * discriminante cuando existe). Sin claves selectivas —el nombre no declara ni
   * molécula ni discriminante— se devuelve vacío A PROPÓSITO: eso produce
   * `unresolved`, que no acuña identidad y no puede fusionar nada. Escanear el
   * registro entero en el camino de una búsqueda sería la alternativa, y no vale
   * la latencia para un caso que igual no puede resolverse con confianza.
   */
  async findConceptCandidates(
    signature: string,
    signatureVersion: number
  ): Promise<RegistryCandidate[]> {
    if (!supabase) return [];
    const keys = conceptBucketKeys(signature);
    if (keys.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from(ALIASES)
        .select("entity_id, signature, signature_version")
        .eq("entity_kind", "concept")
        .eq("signature_version", signatureVersion)
        .overlaps("bucket_keys", keys)
        .limit(MAX_CANDIDATES);
      if (error) {
        warn("findConceptCandidates", error.message);
        return [];
      }
      return toCandidates(data as AliasRow[] | null);
    } catch (err) {
      warn("findConceptCandidates", err);
      return [];
    }
  }

  /**
   * Candidatos de PRESENTACIÓN / PRODUCTO. El anclaje al concepto es un eje
   * SIEMPRE declarado de la firma, así que filtrar por `concept_id` no descarta
   * ninguna anfitriona posible: es un prefiltro EXACTO, no conservador.
   */
  private async scopedCandidates(
    kind: Extract<CanonicalEntityKind, "presentation" | "product">,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from(ALIASES)
        .select("entity_id, signature, signature_version")
        .eq("entity_kind", kind)
        .eq("signature_version", signatureVersion)
        .eq("concept_id", conceptId)
        .limit(MAX_CANDIDATES);
      if (error) {
        warn(`find${kind}Candidates`, error.message);
        return [];
      }
      return toCandidates(data as AliasRow[] | null);
    } catch (err) {
      warn(`find${kind}Candidates`, err);
      return [];
    }
  }

  findPresentationCandidates(
    _signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]> {
    return this.scopedCandidates("presentation", signatureVersion, conceptId);
  }

  findProductCandidates(
    _signature: string,
    signatureVersion: number,
    conceptId: string
  ): Promise<RegistryCandidate[]> {
    return this.scopedCandidates("product", signatureVersion, conceptId);
  }

  /**
   * Acuñación idempotente genérica. Tres pasos, y ninguno puede producir dos
   * identidades para la misma firma.
   *
   *   1. LECTURA del alias. Resuelve el caso normal —la firma ya existe— con un
   *      solo round-trip y sin escribir nada.
   *
   *   2. `insert … on conflict (canonical_signature) do nothing … returning *`
   *      sobre la ENTIDAD. Es la sección crítica, y la atomicidad la da Postgres,
   *      no este código: el `id` lo genera la secuencia dentro del mismo
   *      statement, así que no existe ninguna ventana entre "elijo un id" y "lo
   *      inserto". Si el statement no devuelve fila, otro proceso ganó la
   *      carrera: se RELEE al ganador por su firma. Nunca se reintenta insertar
   *      y nunca queda una fila huérfana — el `do nothing` la evita, a
   *      diferencia del patrón de RFC-002, que sí las deja.
   *
   *   3. ALIAS, también `do nothing`. Es el índice de búsqueda y se publica
   *      DESPUÉS de que la entidad existe: al revés habría una ventana en la que
   *      otra invocación resuelve a un ID sin fila.
   *
   * Consecuencia buscada: dos requests simultáneos con la misma firma completa
   * devuelven el MISMO identificador, uno con `created: true` y otro con
   * `created: false`.
   */
  private async create<TRow extends { id: string }, TRecord>(
    kind: CanonicalEntityKind,
    table: string,
    signature: string,
    conceptId: string | null,
    row: Record<string, unknown>,
    toRecord: (row: TRow) => TRecord
  ): Promise<{ record: TRecord; created: boolean } | null> {
    if (!supabase) return null;

    try {
      // 1. ¿Ya existe?
      const existing = await this.fetchBySignature<TRow>(table, signature);
      if (existing) {
        await this.ensureAlias(kind, signature, existing.id, conceptId);
        return { record: toRecord(existing), created: false };
      }

      // 2. Sección crítica: la UNIQUE de `canonical_signature` decide.
      const { data: inserted, error: insertError } = await supabase
        .from(table)
        .upsert(row, { onConflict: "canonical_signature", ignoreDuplicates: true })
        .select("*")
        .maybeSingle();

      if (insertError) {
        warn(`create:${kind}`, insertError.message);
        return null;
      }

      if (!inserted) {
        // Perdimos la carrera. Se relee al ganador; no se reintenta insertar.
        const winner = await this.fetchBySignature<TRow>(table, signature);
        if (!winner) {
          warn(`create:${kind}`, "conflict without a readable winner");
          return null;
        }
        await this.ensureAlias(kind, signature, winner.id, conceptId);
        return { record: toRecord(winner), created: false };
      }

      // 3. Alias.
      const record = inserted as TRow;
      await this.ensureAlias(kind, signature, record.id, conceptId);
      return { record: toRecord(record), created: true };
    } catch (err) {
      warn(`create:${kind}`, err);
      return null;
    }
  }

  private async ensureAlias(
    kind: CanonicalEntityKind,
    signature: string,
    entityId: string,
    conceptId: string | null
  ): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from(ALIASES).upsert(
      {
        entity_kind: kind,
        signature,
        signature_version: 1,
        entity_id: entityId,
        concept_id: conceptId,
        bucket_keys: kind === "concept" ? conceptBucketKeys(signature) : [],
        canonicalizer_version: CANONICALIZER_VERSION,
        is_current: true,
      },
      { onConflict: "entity_kind,signature_version,signature", ignoreDuplicates: true }
    );
    if (error) warn(`ensureAlias:${kind}`, error.message);
  }

  private async fetchBySignature<TRow>(table: string, signature: string): Promise<TRow | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("canonical_signature", signature)
      .maybeSingle();
    if (error || !data) return null;
    return data as TRow;
  }

  async createConcept(
    draft: ConceptDraft
  ): Promise<{ record: CanonicalConceptRecord; created: boolean } | null> {
    return this.create<RegistryRow, CanonicalConceptRecord>(
      "concept",
      CONCEPTS,
      draft.canonicalSignature,
      null,
      {
        canonical_signature: draft.canonicalSignature,
        signature_version: 1,
        canonicalizer_version: CANONICALIZER_VERSION,
        resolver_version: RESOLVER_VERSION,
        canonical_name: draft.canonicalName,
        active_ingredients: draft.activeIngredients,
        declared_component_count: draft.declaredComponentCount,
        identity_status: draft.identityStatus,
        unresolved_identity_discriminator: draft.unresolvedIdentityDiscriminator,
        concentration: draft.concentration,
        canonical_dosage_form: draft.canonicalDosageForm,
        route: draft.route,
        pharmaceutical_unit: draft.pharmaceuticalUnit,
      },
      (row) => mapConcept(row)
    );
  }

  async createPresentation(
    draft: PresentationDraft
  ): Promise<{ record: CanonicalPresentationRecord; created: boolean } | null> {
    return this.create<RegistryRow, CanonicalPresentationRecord>(
      "presentation",
      PRESENTATIONS,
      draft.canonicalSignature,
      draft.conceptId,
      {
        canonical_signature: draft.canonicalSignature,
        signature_version: 1,
        canonicalizer_version: CANONICALIZER_VERSION,
        resolver_version: RESOLVER_VERSION,
        concept_id: draft.conceptId,
        package_quantity: draft.packageQuantity,
        package_unit: draft.packageUnit,
        package_volume: draft.packageVolume,
        package_type: draft.packageType,
      },
      (row) => mapPresentation(row)
    );
  }

  async createProduct(
    draft: ProductDraft
  ): Promise<{ record: CanonicalProductRecord; created: boolean } | null> {
    return this.create<RegistryRow, CanonicalProductRecord>(
      "product",
      PRODUCTS,
      draft.canonicalSignature,
      draft.conceptId,
      {
        canonical_signature: draft.canonicalSignature,
        signature_version: 1,
        canonicalizer_version: CANONICALIZER_VERSION,
        resolver_version: RESOLVER_VERSION,
        concept_id: draft.conceptId,
        brand: draft.brand,
        commercial_variant: draft.commercialVariant,
        administration_time: draft.administrationTime,
        manufacturer: draft.manufacturer,
        isp_registration: draft.ispRegistration,
      },
      (row) => mapProduct(row)
    );
  }

  async linkProductPresentation(
    productId: string,
    presentationId: string,
    conceptId: string,
    observedAt: string
  ): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(PRODUCT_PRESENTATIONS).upsert(
        {
          product_id: productId,
          presentation_id: presentationId,
          concept_id: conceptId,
          last_seen_at: observedAt,
        },
        { onConflict: "product_id,presentation_id" }
      );
      if (error) warn("linkProductPresentation", error.message);
    } catch (err) {
      warn("linkProductPresentation", err);
    }
  }

  async recordObservationResolution(
    draft: OfferObservationDraft,
    _resolutions: CanonicalResolutionRecord[]
  ): Promise<CanonicalOfferObservationRecord | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from(OBSERVATIONS)
        .upsert(
          {
            observation_key: observationKey(draft.pharmacy, draft.sourceProductId),
            pharmacy_slug: draft.pharmacy,
            source_product_id: draft.sourceProductId,
            raw_name: draft.rawName,
            concept_id: draft.conceptId,
            presentation_id: draft.presentationId,
            product_id: draft.productId,
            last_seen_at: draft.observedAt,
          },
          { onConflict: "observation_key" }
        )
        .select("*")
        .single();
      if (error || !data) {
        if (error) warn("recordObservationResolution", error.message);
        return null;
      }
      return mapObservation(data as Record<string, unknown>);
    } catch (err) {
      warn("recordObservationResolution", err);
      return null;
    }
  }

  async recordProvenance(records: CanonicalResolutionRecord[]): Promise<void> {
    if (!supabase || records.length === 0) return;
    try {
      const { error } = await supabase.from(RESOLUTIONS).insert(
        records.map((record) => ({
          offer_observation_id: record.offerObservationId,
          entity_kind: record.entityKind,
          outcome: record.outcome,
          entity_id: record.entityId,
          raw_signature: record.rawSignature,
          normalized_signature: record.normalizedSignature,
          signature_version: record.signatureVersion,
          canonicalizer_version: record.canonicalizerVersion,
          resolver_version: record.resolverVersion,
          unknown_axes: record.unknownAxes,
          candidate_count: record.candidateCount,
          candidate_ids: record.candidateIds,
          reason: record.reason,
          upstream_fields: record.upstreamFields,
          inferred_fields: record.inferredFields,
          legacy_match_key: record.legacyMatchKey,
          legacy_presentation_key: record.legacyPresentationKey,
        }))
      );
      if (error) warn("recordProvenance", error.message);
    } catch (err) {
      warn("recordProvenance", err);
    }
  }

  async rebindSignature(
    kind: CanonicalEntityKind,
    entityId: string,
    signature: string,
    signatureVersion: number,
    canonicalizerVersion: string
  ): Promise<void> {
    if (!supabase) return;
    const table =
      kind === "concept" ? CONCEPTS : kind === "presentation" ? PRESENTATIONS : PRODUCTS;
    try {
      // La firma anterior NO se borra: sigue siendo un alias válido de la misma
      // identidad. Borrarla rotaría el ID para cualquier observación que todavía
      // produzca la firma vieja — que es exactamente lo que este mecanismo
      // existe para impedir.
      await supabase
        .from(ALIASES)
        .update({ is_current: false })
        .eq("entity_kind", kind)
        .eq("entity_id", entityId);

      const { error: aliasError } = await supabase.from(ALIASES).upsert(
        {
          entity_kind: kind,
          signature,
          signature_version: signatureVersion,
          entity_id: entityId,
          bucket_keys: kind === "concept" ? conceptBucketKeys(signature) : [],
          canonicalizer_version: canonicalizerVersion,
          is_current: true,
        },
        { onConflict: "entity_kind,signature_version,signature" }
      );
      if (aliasError) warn("rebindSignature:alias", aliasError.message);

      const { error } = await supabase
        .from(table)
        .update({
          canonical_signature: signature,
          signature_version: signatureVersion,
          canonicalizer_version: canonicalizerVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entityId);
      if (error) warn("rebindSignature:entity", error.message);
    } catch (err) {
      warn("rebindSignature", err);
    }
  }
}

// ---------------------------------------------------------------------------
// MAPEO snake_case (Postgres) → camelCase (dominio)
// ---------------------------------------------------------------------------

function base(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    canonicalSignature: row.canonical_signature as string,
    signatureVersion: row.signature_version as number,
    canonicalizerVersion: row.canonicalizer_version as string,
    resolverVersion: row.resolver_version as string,
    status: (row.status ?? "active") as "active" | "merged" | "deprecated",
    mergedIntoId: (row.merged_into_id ?? null) as string | null,
    createdAt: (row.created_at ?? "") as string,
    updatedAt: (row.updated_at ?? "") as string,
  };
}

export function mapConcept(row: Record<string, unknown>): CanonicalConceptRecord {
  return {
    ...base(row),
    canonicalName: row.canonical_name as string,
    activeIngredients: (row.active_ingredients ?? []) as string[],
    declaredComponentCount: (row.declared_component_count ?? 0) as number,
    identityStatus: row.identity_status as "resolved" | "unresolved-ingredient",
    unresolvedIdentityDiscriminator: (row.unresolved_identity_discriminator ?? null) as
      | string
      | null,
    concentration: (row.concentration ?? "?") as string,
    canonicalDosageForm: (row.canonical_dosage_form ?? null) as string | null,
    route: (row.route ?? null) as string | null,
    pharmaceuticalUnit: (row.pharmaceutical_unit ?? null) as string | null,
    atcCode: (row.atc_code ?? null) as string | null,
  };
}

export function mapPresentation(row: Record<string, unknown>): CanonicalPresentationRecord {
  return {
    ...base(row),
    conceptId: row.concept_id as string,
    packageQuantity: (row.package_quantity ?? null) as number | null,
    packageUnit: (row.package_unit ?? null) as string | null,
    packageVolume: (row.package_volume ?? null) as string | null,
    packageType: (row.package_type ?? null) as string | null,
  };
}

export function mapProduct(row: Record<string, unknown>): CanonicalProductRecord {
  return {
    ...base(row),
    conceptId: row.concept_id as string,
    brand: (row.brand ?? null) as string | null,
    commercialVariant: (row.commercial_variant ?? null) as string | null,
    administrationTime: (row.administration_time ?? null) as string | null,
    manufacturer: (row.manufacturer ?? null) as string | null,
    ispRegistration: (row.isp_registration ?? null) as string | null,
  };
}

export function mapObservation(
  row: Record<string, unknown>
): CanonicalOfferObservationRecord {
  return {
    id: row.id as string,
    pharmacy: row.pharmacy_slug as PharmacySlug,
    sourceProductId: row.source_product_id as string,
    rawName: row.raw_name as string,
    conceptId: (row.concept_id ?? null) as string | null,
    presentationId: (row.presentation_id ?? null) as string | null,
    productId: (row.product_id ?? null) as string | null,
    firstSeenAt: (row.first_seen_at ?? "") as string,
    lastSeenAt: (row.last_seen_at ?? "") as string,
  };
}
