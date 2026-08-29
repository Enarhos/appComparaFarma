import { searchAhumada } from "../clients/ahumada.js";
import { searchAraucoMed } from "../clients/araucomed.js";
import { searchCruzVerde } from "../clients/cruzverde.js";
import { searchDrSimi } from "../clients/drsimi.js";
import { searchEcoFarmacias } from "../clients/ecofarmacias.js";
import { searchFarmex } from "../clients/farmex.js";
import { searchSermecoop } from "../clients/sermecoop.js";
import { searchEasyFarma } from "../clients/easyfarma.js";
import { searchSalcobrand } from "../clients/salcobrand.js";
import {
  mergeDuplicates,
  parseQueryIntent,
  rankByRelevance,
  toMedicationResult,
  type QueryIntent,
} from "@comparafarma/domain";
import { PHARMACY_NAMES } from "../lib/pharmacies.js";
import { sanitizePharmacyUrl } from "../lib/pharmacyDomains.js";
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

/**
 * CF-SEARCH-002 — acepta el texto crudo del usuario o una `QueryIntent` ya
 * parseada. La ruta la parsea antes (necesita la intención para la clave de
 * caché) y la pasa hecha, garantizando que la intención que decide la caché es
 * exactamente la que decide el orden. Los demás llamadores (alerts.ts, tests)
 * siguen pasando un `string` sin cambios.
 */
export async function searchMedications(
  query: string | QueryIntent,
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
  query: string | QueryIntent,
  onlySlugs?: PharmacySlug[]
): Promise<SearchExecution> {
  const startedAt = Date.now();
  const disabled = await getDisabledPharmacies();
  const intent = typeof query === "string" ? parseQueryIntent(query) : query;

  const activeSources = ALL_SOURCES.filter(
    (s) => !disabled.has(s.slug) && (!onlySlugs || onlySlugs.includes(s.slug))
  );

  // CF-SEARCH-002 — a las 9 farmacias se les sigue mandando la consulta AMPLIA
  // (`retrievalQuery` === `cleanQuery(raw)`, exactamente el mismo texto que
  // antes de este ticket). La concentración, la cantidad y la forma nunca
  // restringen el retrieval: solo evalúan y ordenan lo que volvió.
  const sourceResults = await Promise.all(
    activeSources.map((s) => runSource(s.slug, s.fn, intent.retrievalQuery))
  );

  const all: MedicationResult[] = [];
  for (const { slug, products } of sourceResults) {
    for (const product of products) {
      // CF-SEARCH-001 — la URL de producto se valida contra los dominios
      // propios de LA MISMA farmacia que la entregó, antes de entrar al
      // pipeline. Tres de los nueve clientes (AraucoMed, EcoFarmacias,
      // EasyFarma) toman la URL completa de la fuente externa sin
      // construirla, así que un cambio de feed o de plantilla puede
      // introducir un enlace a otro sitio sin que ningún parser falle.
      // Sanear acá —y no solo en `/api/go`— garantiza el invariante de
      // integridad de oferta en toda la respuesta: `pharmacy`, `price`,
      // `channels` y `onlineUrl` provienen siempre de la misma fuente.
      all.push(
        toMedicationResult(
          { ...product, onlineUrl: sanitizePharmacyUrl(slug, product.onlineUrl) },
          slug,
          PHARMACY_NAMES[slug]
        )
      );
    }
  }

  const merged = mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);

  // RFC-002 — adjunta el CFM-ID (identidad canónica y permanente) antes de
  // registrar el historial de precios, para que price_history/pharmacy_clicks
  // puedan guardar cfm_id en la misma escritura. Aditivo y best-effort: si
  // Supabase no responde, `results` queda idéntico a `merged` + cfmId:null.
  const withIds = await attachCanonicalIds(merged);

  await recordPriceHistory(withIds).catch(() => {});

  // CF-SEARCH-002 — único punto del pipeline donde consulta y resultados se
  // comparan. Anota `lexicalMatch`/`concentrationMatch` y reordena por
  // cohorte; NO filtra: `results.length === withIds.length` siempre. Se
  // aplica DESPUÉS de `recordPriceHistory` a propósito — el historial de
  // precios no debe depender de con qué consulta se llegó al producto.
  const results = rankByRelevance(intent, withIds);

  return {
    results,
    diagnostics: {
      query: intent.retrievalQuery,
      totalResults: all.length,
      mergedResults: results.length,
      durationMs: Date.now() - startedAt,
      pharmacies: sourceResults.map((r) => r.diagnostic),
    },
  };
}
