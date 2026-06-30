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
export { effectivePrice, toPharmacyPrice, toMedicationResult } from "./pricing.js";
export { mergeDuplicates } from "./deduplication.js";
