import { searchAhumada } from "../clients/ahumada.js";
import { searchAraucoMed } from "../clients/araucomed.js";
import { searchCruzVerde } from "../clients/cruzverde.js";
import { searchDrSimi } from "../clients/drsimi.js";
import { searchEcoFarmacias } from "../clients/ecofarmacias.js";
import { searchFarmex } from "../clients/farmex.js";
import { searchSermecoop } from "../clients/sermecoop.js";
import { searchEasyFarma } from "../clients/easyfarma.js";
import { searchSalcobrand } from "../clients/salcobrand.js";
import { mergeDuplicates, toMedicationResult } from "@comparafarma/domain";
import { PHARMACY_NAMES } from "../lib/pharmacies.js";
import { getDisabledPharmacies } from "../lib/pharmacyFlags.js";
import { recordPriceHistory } from "../lib/priceHistoryDb.js";
import { attachCanonicalIds } from "../lib/medicationRegistry.js";
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
  { slug: "cruz-verde",   fn: searchCruzVerde    },
  { slug: "salcobrand",   fn: searchSalcobrand   },
  { slug: "ahumada",      fn: searchAhumada      },
  { slug: "dr-simi",      fn: searchDrSimi       },
  { slug: "araucomed",    fn: searchAraucoMed    },
  { slug: "ecofarmacias", fn: searchEcoFarmacias },
  { slug: "farmex",       fn: searchFarmex       },
  { slug: "sermecoop",   fn: searchSermecoop    },
  { slug: "easyfarma",   fn: searchEasyFarma    },
];

export async function searchMedicationsDetailed(
  query: string,
  onlySlugs?: PharmacySlug[]
): Promise<SearchExecution> {
  const startedAt = Date.now();
  const disabled = await getDisabledPharmacies();

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

  const merged = mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);

  // RFC-002 — adjunta el CFM-ID (identidad canónica y permanente) antes de
  // registrar el historial de precios, para que price_history/pharmacy_clicks
  // puedan guardar cfm_id en la misma escritura. Aditivo y best-effort: si
  // Supabase no responde, `results` queda idéntico a `merged` + cfmId:null.
  const results = await attachCanonicalIds(merged);

  await recordPriceHistory(results).catch(() => {});

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
