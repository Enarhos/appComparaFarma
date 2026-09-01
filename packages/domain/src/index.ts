export type {
  PharmacySlug,
  PriceChannels,
  PharmacyPrice,
  MedicationResult,
  ScrapedProduct,
  SearchRequestContext,
  PharmacySearchDiagnostic,
  SearchDiagnostics,
  SearchExecution,
  LexicalMatch,
  ConcentrationMatch,
  BrandSource,
} from "./types.js";

export {
  matchKey,
  combinationKey,
  normalizedWords,
  brandHeadTokens,
  SALT_QUALIFIER_WORDS,
  PRESENTATION_FORM_WORDS,
  STOP_WORDS,
} from "./matching.js";
export {
  resolveBrandIdentity,
  brandFromName,
  COMPOSITION_VOCABULARY,
  type BrandIdentityInput,
  type BrandIdentityResult,
  type NameDerivedIdentity,
} from "./brandIdentity.js";
export { cleanQuery } from "./normalization.js";
export {
  parseQueryIntent,
  parseQuantity,
  queryIntentCacheKey,
  type QueryIntent,
} from "./queryIntent.js";
// CF-SEARCH-003: el modelo de magnitudes y el parser de concentración se
// movieron de `queryIntent.ts` a `concentration.ts` para que la capa de
// identidad de producto pueda reutilizarlos sin ciclo de dependencias. La
// superficie pública del paquete no cambia — mismos nombres, mismas firmas.
export {
  parseConcentration,
  parseMeasurements,
  concentrationKey,
  isSameConcentration,
  isSameMeasurement,
  isMassUnit,
  isVolumeUnit,
  type Measurement,
  type Concentration,
} from "./concentration.js";
export {
  evaluateResultRelevance,
  rankByRelevance,
  type ResultRelevance,
  type SoftMatch,
} from "./relevance.js";
export {
  effectivePrice,
  toPharmacyPrice,
  toMedicationResult,
  toProductIdentity,
  sortByEffectivePrice,
} from "./pricing.js";
export {
  commercialVariantKey,
  dosageFormClass,
  unitCountKey,
  isCompatibleUnitCount,
  liquidConcentration,
  isCompatibleConcentration,
  isSameProduct,
  type DosageFormClass,
  type ProductIdentity,
} from "./productIdentity.js";
export { mergeDuplicates } from "./deduplication.js";
export { computeAllInOneTotals, type PharmacyBasketTotal } from "./basket.js";
export { computeSavings, type SavingsResult } from "./savings.js";
export {
  resolveCommercialIdentity,
  normalizeBrandToken,
  extractBrandFromUrl,
  isPlausibleCommercialIdentity,
  bioequivalenceKey,
  presentationKey,
  UNKNOWN_COMMERCIAL_IDENTITY,
  type CommercialIdentitySource,
  type CommercialIdentityConfidence,
  type CommercialIdentityInput,
  type CommercialIdentityResult,
  type PresentationKeyInput,
  type PlausibilityContext,
} from "./commercialIdentity.js";
