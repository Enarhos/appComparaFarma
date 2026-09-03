/**
 * Search Engine v2 — superficie del paquete `searchV2` (CF-SEARCH-011, S0).
 *
 * ESTE BARREL NO SE REEXPORTA DESDE `packages/domain/src/index.ts`, y es
 * deliberado (CF-SEARCH-011 §4, §12, §22):
 *
 *   - v2 corre exclusivamente en SHADOW MODE. No hay un solo resultado de v2
 *     llegando a un usuario real, así que `mobile/`, `web/` y `api/` no tienen
 *     ninguna razón para poder importarlo;
 *   - la superficie pública de `@comparafarma/domain` queda literalmente sin
 *     cambios, así que ningún consumidor puede romperse ni ver latencia,
 *     tamaño de bundle o contrato distintos;
 *   - el harness de evaluación de S0 carga `dist/searchV2/index.js` por ruta
 *     absoluta, el mismo patrón que ya usan los scripts de CF-SEARCH-003,
 *     CF-DATA-001 y CF-SEARCH-010 (`docs/` no es un paquete del workspace).
 *
 * Cuando S1 incorpore v2 al pipeline detrás de un flag, agregar la reexportación
 * en el barrel raíz será un cambio de una línea. Hacerlo hoy no aportaría nada y
 * ampliaría la superficie de riesgo de un experimento que todavía no aprobó sus
 * gates.
 *
 * Las extensiones `.js` de los reexports son obligatorias (ESM NodeNext) — ver
 * `CLAUDE.md` §11.
 */

export type {
  ActiveIngredient,
  AdministrationRoute,
  AxisComparison,
  CanonicalAttributes,
  CanonicalDosageForm,
  CanonicalGraph,
  CanonicalMedicationConcept,
  CanonicalOffer,
  CanonicalPresentation,
  CommercialMedicinalProduct,
  ConceptIdentityStatus,
  ConcentrationEvidence,
  IngredientStrength,
  OfferProvenance,
  RawOfferInput,
  ResolutionConfidence,
  ResolutionKind,
  ResolutionTrace,
} from "./canonicalTypes.js";
export {
  ADMINISTRATION_ROUTE_BY_CANONICAL_FORM,
  ADMINISTRATION_ROUTE_BY_FORM,
} from "./canonicalTypes.js";

export {
  compareConcentration,
  concentrationSignature,
  formatConcentration,
  isWeakerConcentration,
  readConcentrationEvidence,
} from "./canonicalConcentration.js";

export {
  declaredArityFromDoseRatio,
  ION_AND_SALT_TOKENS,
  readIngredientComposition,
  V2_MOLECULE_VOCABULARY,
  type IngredientComponent,
  type IngredientComposition,
} from "./compositionReader.js";

export {
  buildCanonicalName,
  canonicalizeOffer,
  readActiveIngredients,
  readAdministrationRoute,
  readAdministrationTime,
  readCanonicalDosageForm,
  readPackageType,
  readPackageVolume,
  readPharmaceuticalUnit,
  readUnresolvedIdentityDiscriminator,
} from "./canonicalAttributes.js";

export {
  axisStrength,
  provisionalKey,
  resolveBySubsumption,
  signatureText,
  subsumes,
  unknownAxes,
  type ResolutionItem,
  type ResolvedItem,
  type Signature,
  type SignatureAxis,
} from "./canonicalIdentity.js";

export {
  canonicalize,
  conceptSignature,
  offerSignature,
  presentationSignature,
  productSignature,
} from "./canonicalize.js";

// -------------------------------------------------------------------------
// CF-SEARCH-012 (S1) — registro canónico PERSISTENTE.
//
// Sigue sin reexportarse desde el barrel raíz de `@comparafarma/domain`: v2
// continúa siendo shadow, apagado por defecto. `api/` importa este subcamino
// (`@comparafarma/domain/searchV2`) exclusivamente para el runtime de shadow;
// `web/` y `mobile/` no lo importan y no cambian de superficie.
// -------------------------------------------------------------------------

export {
  CANONICALIZER_VERSION,
  CANONICAL_ID_PREFIX,
  RESOLVER_VERSION,
  SIGNATURE_VERSION,
  formatCanonicalId,
  isCanonicalId,
  type AssignedIdentity,
  type CanonicalConceptRecord,
  type CanonicalEntityKind,
  type CanonicalEntityStatus,
  type CanonicalOfferObservationRecord,
  type CanonicalPresentationRecord,
  type CanonicalProductPresentationRecord,
  type CanonicalProductRecord,
  type CanonicalRegistryRepository,
  type CanonicalResolutionOutcome,
  type CanonicalResolutionRecord,
  type CanonicalSignatureAliasRecord,
  type ConceptDraft,
  type ObservationInput,
  type OfferObservationDraft,
  type PresentationDraft,
  type ProductDraft,
  type RegistryCandidate,
  type RegistryResolution,
} from "./registryTypes.js";

export {
  isCompleteSignature,
  parseSignatureText,
  resolveAgainstRegistry,
  subsumesSignatureText,
  type ResolveOptions,
} from "./canonicalResolver.js";

export {
  assignIdentity,
  canMintConcept,
  conceptBucketKeys,
  isMintableConceptSignature,
  isMintablePresentationSignature,
  isMintableProductSignature,
  observationKey,
  registryProductSignature,
} from "./canonicalIdentityAssigner.js";

export { InMemoryCanonicalRegistry } from "./registryMemory.js";

export {
  auditConceptCollisions,
  detectConceptCollisions,
  type ConceptCollision,
  type ConceptCollisionReport,
  type ConceptCollisionType,
  type ConceptMember,
} from "./conceptCollision.js";
