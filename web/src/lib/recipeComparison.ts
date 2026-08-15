import { computeAllInOneTotals, type MedicationResult, type PharmacyBasketTotal, type PharmacySlug } from "@comparafarma/domain";

/**
 * Cálculo de las dos alternativas de "mi receta" (Sprint E):
 *   1. Todo en una farmacia — computeAllInOneTotals() (@comparafarma/domain)
 *   2. Repartido al mejor precio por medicamento — computeSplitTotal()
 * Lógica pura, sin React/Next, para que sea trivial de testear.
 *
 * computeAllInOneTotals() vivía duplicada acá y en
 * mobile/src/app/cart.tsx::calcTotals() (mismo algoritmo, verificado línea
 * por línea) — se consolidó en @comparafarma/domain (Domain Consolidation
 * v2, PR refactor/domain-cart-totals). Se re-exporta acá como
 * `PharmacyTotal` solo por compatibilidad de nombre con el resto de este
 * archivo/tests; es el mismo tipo que `PharmacyBasketTotal` de domain.
 */

export { computeAllInOneTotals };
export type PharmacyTotal = PharmacyBasketTotal;

export interface SplitBreakdownItem {
  matchKey: string;
  canonicalName: string;
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  price: number;
}

export function computeSplitTotal(medications: MedicationResult[]): {
  breakdown: SplitBreakdownItem[];
  total: number;
} {
  const breakdown: SplitBreakdownItem[] = [];
  let total = 0;

  for (const med of medications) {
    if (med.prices.length === 0) continue; // sin precios registrados — se excluye, ver limitaciones del sprint
    const cheapest = [...med.prices].sort((a, b) => a.channels.effective - b.channels.effective)[0];
    breakdown.push({
      matchKey: med.matchKey,
      canonicalName: med.canonicalName,
      pharmacySlug: cheapest.pharmacySlug,
      pharmacyName: cheapest.pharmacyName,
      price: cheapest.channels.effective,
    });
    total += cheapest.channels.effective;
  }

  return { breakdown, total };
}

export interface CompareOptionsResult {
  bestAllInOneTotal: number | null;
  savings: number | null;
}

export function compareOptions(allInOne: PharmacyTotal[], splitTotal: number): CompareOptionsResult {
  const bestAllInOneTotal = allInOne.find((t) => t.missing === 0)?.total ?? null;
  const savings = bestAllInOneTotal != null ? bestAllInOneTotal - splitTotal : null;
  return { bestAllInOneTotal, savings };
}
