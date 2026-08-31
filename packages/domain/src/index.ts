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
} from "./types.js";

export { matchKey, combinationKey, normalizedWords, brandHeadTokens } from "./matching.js";
export { cleanQuery } from "./normalization.js";
export {
  parseQueryIntent,
  parseConcentration,
  parseQuantity,
  concentrationKey,
  queryIntentCacheKey,
  isSameConcentration,
  isSameMeasurement,
  type Measurement,
  type Concentration,
  type QueryIntent,
} from "./queryIntent.js";
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
