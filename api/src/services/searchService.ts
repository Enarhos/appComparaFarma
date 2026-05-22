import { searchAhumada } from "../clients/ahumada.js";
import { searchCruzVerde } from "../clients/cruzverde.js";
import { searchDrSimi } from "../clients/drsimi.js";
import { searchSalcobrand } from "../clients/salcobrand.js";
import { mergeDuplicates, toMedicationResult } from "../lib/normalization.js";
import { PHARMACY_NAMES } from "../lib/pharmacies.js";
import type {
  MedicationResult,
  PharmacySearchDiagnostic,
  PharmacySlug,
  ScrapedProduct,
  SearchExecution,
} from "../lib/types.js";

interface SourceResult {
  slug: PharmacySlug;
  products: ScrapedProduct[];
  diagnostic: PharmacySearchDiagnostic;
}

async function runSource(
  slug: PharmacySlug,
  searchFn: (query: string) => Promise<ScrapedProduct[]>,
  query: string
): Promise<SourceResult> {
  const startedAt = Date.now();

  try {
    const products = await searchFn(query);
    return {
      slug,
      products,
      diagnostic: {
        pharmacySlug: slug,
        pharmacyName: PHARMACY_NAMES[slug],
        status: "fulfilled",
        resultCount: products.length,
        durationMs: Date.now() - startedAt,
        errorMessage: null,
      },
    };
  } catch (error) {
    return {
      slug,
      products: [],
      diagnostic: {
        pharmacySlug: slug,
        pharmacyName: PHARMACY_NAMES[slug],
        status: "rejected",
        resultCount: 0,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export async function searchMedications(query: string): Promise<MedicationResult[]> {
  const execution = await searchMedicationsDetailed(query);
  return execution.results;
}

export async function searchMedicationsDetailed(query: string): Promise<SearchExecution> {
  const startedAt = Date.now();
  const [cvResult, sbResult, ahResult, dsResult] = await Promise.all([
    runSource("cruz-verde", searchCruzVerde, query),
    runSource("salcobrand", searchSalcobrand, query),
    runSource("ahumada", searchAhumada, query),
    runSource("dr-simi", searchDrSimi, query),
  ]);

  const all: MedicationResult[] = [];

  for (const product of cvResult.products) {
    all.push(toMedicationResult(product, "cruz-verde", PHARMACY_NAMES["cruz-verde"]));
  }
  for (const product of sbResult.products) {
    all.push(toMedicationResult(product, "salcobrand", PHARMACY_NAMES.salcobrand));
  }
  for (const product of ahResult.products) {
    all.push(toMedicationResult(product, "ahumada", PHARMACY_NAMES.ahumada));
  }
  for (const product of dsResult.products) {
    all.push(toMedicationResult(product, "dr-simi", PHARMACY_NAMES["dr-simi"]));
  }

  const results = mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);
  return {
    results,
    diagnostics: {
      query,
      totalResults: all.length,
      mergedResults: results.length,
      durationMs: Date.now() - startedAt,
      pharmacies: [
        cvResult.diagnostic,
        sbResult.diagnostic,
        ahResult.diagnostic,
        dsResult.diagnostic,
      ],
    }
  };
}
