import { searchAhumada } from "../clients/ahumada.js";
import { searchAraucoMed } from "../clients/araucomed.js";
import { searchCruzVerde } from "../clients/cruzverde.js";
import { searchDrSimi } from "../clients/drsimi.js";
import { searchSalcobrand } from "../clients/salcobrand.js";
import { mergeDuplicates, toMedicationResult } from "../lib/normalization.js";
import { PHARMACY_NAMES } from "../lib/pharmacies.js";
import { getDisabledPharmacies } from "../lib/pharmacyFlags.js";
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

export async function searchMedications(
  query: string,
  onlySlugs?: PharmacySlug[]
): Promise<MedicationResult[]> {
  const execution = await searchMedicationsDetailed(query, onlySlugs);
  return execution.results;
}

const ALL_SOURCES: Array<{
  slug: PharmacySlug;
  fn: (query: string) => Promise<ScrapedProduct[]>;
}> = [
  { slug: "cruz-verde", fn: searchCruzVerde },
  { slug: "salcobrand", fn: searchSalcobrand },
  { slug: "ahumada",    fn: searchAhumada    },
  { slug: "dr-simi",   fn: searchDrSimi     },
  { slug: "araucomed",  fn: searchAraucoMed  },
];

export async function searchMedicationsDetailed(
  query: string,
  onlySlugs?: PharmacySlug[]
): Promise<SearchExecution> {
  const startedAt = Date.now();
  const disabled = getDisabledPharmacies();

  const activeSources = ALL_SOURCES.filter(
    (s) => !disabled.has(s.slug) && (!onlySlugs || onlySlugs.includes(s.slug))
  );

  const sourceResults = await Promise.all(
    activeSources.map((s) => runSource(s.slug, s.fn, query))
  );

  const all: MedicationResult[] = [];
  for (const { slug, products } of sourceResults) {
    for (const product of products) {
      all.push(toMedicationResult(product, slug, PHARMACY_NAMES[slug]));
    }
  }

  const results = mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);
  return {
    results,
    diagnostics: {
      query,
      totalResults: all.length,
      mergedResults: results.length,
      durationMs: Date.now() - startedAt,
      pharmacies: sourceResults.map((r) => r.diagnostic),
    },
  };
}
