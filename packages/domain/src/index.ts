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
} from "./types.js";

export { matchKey } from "./matching.js";
export { cleanQuery } from "./normalization.js";
export { effectivePrice, toPharmacyPrice, toMedicationResult, sortByEffectivePrice } from "./pricing.js";
export { mergeDuplicates } from "./deduplication.js";
export { computeAllInOneTotals, type PharmacyBasketTotal } from "./basket.js";
export { computeSavings, type SavingsResult } from "./savings.js";
export {
  resolveCommercialIdentity,
  normalizeBrandToken,
  extractBrandFromUrl,
  bioequivalenceKey,
  presentationKey,
  UNKNOWN_COMMERCIAL_IDENTITY,
  type CommercialIdentitySource,
  type CommercialIdentityConfidence,
  type CommercialIdentityInput,
  type CommercialIdentityResult,
  type PresentationKeyInput,
} from "./commercialIdentity.js";
