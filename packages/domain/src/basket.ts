import type { MedicationResult, PharmacySlug } from "./types.js";

export interface PharmacyBasketTotal {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  total: number;
  found: number;
  missing: number;
}

/**
 * Costo de comprar una canasta completa de medicamentos en una sola
 * farmacia — una fila por farmacia candidata, sumando channels.effective de
 * cada medicamento que esa farmacia ofrece.
 *
 * Extraído de mobile/src/app/cart.tsx::calcTotals() y
 * web/src/lib/recipeComparison.ts::computeAllInOneTotals() (Domain
 * Consolidation v2, PR refactor/domain-cart-totals) — ambas plataformas
 * tenían el mismo algoritmo duplicado; se comparó línea por línea antes de
 * mover, sin cambiar ningún resultado.
 *
 * - Si se pasa `pharmacySlugs`, ese es el universo de farmacias a evaluar
 *   (comportamiento de mobile/cart.tsx: la whitelist viene de
 *   activePharmacySlugs()/configStore — puede incluir farmacias que no
 *   aparecen en ningún precio, que luego quedan excluidas igual por el
 *   filtro `found > 0`).
 * - Si se omite, el universo se deriva de las pharmacySlug presentes en
 *   `medications[].prices` (comportamiento de web/recipeComparison.ts).
 *
 * No filtra por hasStock, no deduplica matchKeys repetidos si el llamador
 * pasa el mismo medicamento dos veces, y no recalcula channels.effective —
 * solo suma valores ya calculados. Ordena primero por cobertura completa
 * (missing === 0), luego por total ascendente; en empate de total conserva
 * el orden de aparición (sort estable), que depende del orden de
 * `pharmacySlugs`/de aparición en `medications` — ese orden no es parte
 * del contrato, solo una consecuencia del algoritmo actual.
 */
export function computeAllInOneTotals(
  medications: MedicationResult[],
  pharmacySlugs?: PharmacySlug[]
): PharmacyBasketTotal[] {
  const names = new Map<PharmacySlug, string>();
  const detected = new Set<PharmacySlug>();
  for (const med of medications) {
    for (const price of med.prices) {
      detected.add(price.pharmacySlug);
      if (!names.has(price.pharmacySlug)) {
        names.set(price.pharmacySlug, price.pharmacyName);
      }
    }
  }

  const universe = pharmacySlugs ?? Array.from(detected);

  return universe
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
