// phc_ keys are write-only client keys — safe to commit.
import PostHog from "posthog-react-native";
import type { MedicationResult } from "@/lib/types";

export const posthog = new PostHog("phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g", {
  host: "https://us.i.posthog.com",
});

export function captureSearch(
  rawQuery: string,
  cleanedQuery: string,
  results: MedicationResult[],
  commune: string | null
) {
  const pharmaciesWithResults = [
    ...new Set(results.flatMap((r) => r.prices.map((p) => p.pharmacySlug))),
  ];

  posthog.capture("medication_search", {
    query: cleanedQuery,
    raw_query: rawQuery,
    results_count: results.length,
    pharmacies_with_results: pharmaciesWithResults,
    best_price: results[0]?.bestPrice ?? null,
    best_pharmacy: results[0]?.bestPharmacy ?? null,
    commune: commune ?? null,
  });
}
