import type { MedicationResult, PharmacySlug } from "@comparafarma/domain";

/**
 * Cálculo de las dos alternativas de "mi receta" (Sprint E):
 *   1. Todo en una farmacia — computeAllInOneTotals()
 *   2. Repartido al mejor precio por medicamento — computeSplitTotal()
 * Lógica pura, sin React/Next, para que sea trivial de testear.
 *
 * computeAllInOneTotals() es una adaptación de calcTotals() en
 * mobile/src/app/cart.tsx (no se modificó ese archivo — mobile/ está
 * congelado por la Prueba Cerrada de Google Play). Se le quitó la
 * dependencia de activePharmacySlugs()/useConfigStore: acá el universo de
 * farmacias se deriva directamente de las prices presentes en los
 * medicamentos recibidos.
 */

export interface PharmacyTotal {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  total: number;
  found: number;
  missing: number;
}

export function computeAllInOneTotals(medications: MedicationResult[]): PharmacyTotal[] {
  const names = new Map<PharmacySlug, string>();
  const slugs = new Set<PharmacySlug>();
  for (const med of medications) {
    for (const price of med.prices) {
      slugs.add(price.pharmacySlug);
      if (!names.has(price.pharmacySlug)) {
        names.set(price.pharmacySlug, price.pharmacyName);
      }
    }
  }

  return Array.from(slugs)
    .map((pharmacySlug) => {
      let total = 0;
      let found = 0;
      for (const med of medications) {
        const price = med.prices.find((p) => p.pharmacySlug === pharmacySlug);
        if (price) {
          total += price.channels.effective;
          found++;
        }
      }
      return {
        pharmacySlug,
        pharmacyName: names.get(pharmacySlug) ?? pharmacySlug,
        total,
        found,
        missing: medications.length - found,
      };
    })
    .filter((t) => t.found > 0)
    .sort((a, b) => {
      if (a.missing === 0 && b.missing > 0) return -1;
      if (a.missing > 0 && b.missing === 0) return 1;
      return a.total - b.total;
    });
}

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
