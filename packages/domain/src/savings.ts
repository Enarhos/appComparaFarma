import type { PharmacyPrice } from "./types.js";

export interface SavingsResult {
  cheapest: PharmacyPrice | undefined;
  priciest: PharmacyPrice | undefined;
  savings: number;
}

/**
 * Extrae el "ahorro" entre el primer y el último elemento de una lista de
 * precios ya ordenada/filtrada por el llamador: cheapest = orderedPrices[0],
 * priciest = orderedPrices[length - 1]. savings = priciest.channels.effective
 * - cheapest.channels.effective, o 0 si hay menos de dos elementos
 * distintos (lista vacía, un solo precio, o cheapest/priciest son el mismo
 * objeto).
 *
 * Esta función NO ordena ni filtra nada por su cuenta — recibe la lista tal
 * cual la preparó cada consumidor. Es deliberado: mobile/src/app/
 * medication.tsx pasa un array cuyo orden depende de un toggle de UI
 * (precio ascendente/descendente) y de un filtro de farmacias activas/
 * visibles; si esta función reordenara el array, cambiaría un
 * comportamiento existente (cuando el usuario ordena por "precio
 * descendente", cheapest/priciest quedan invertidos y `savings` da
 * negativo, lo que hace que el banner de ahorro no se muestre porque su
 * guard es `savings > 0` — un comportamiento cuestionable pero real, que
 * se conserva intacto porque no es objetivo de este refactor "arreglarlo").
 *
 * Duplicada (verificada línea por línea antes de mover, Domain
 * Consolidation v3, PR refactor/domain-compute-savings) en:
 *   - mobile/src/app/medication.tsx
 *   - web/src/components/MedicationCard.tsx
 *   - web/src/app/medicamento/[slug]/page.tsx
 *   - web/src/lib/insights.ts (embebida, sin nombre propio — ahí se llama
 *     `diff`)
 *
 * Deliberadamente NO incluye:
 *   - El porcentaje de ahorro que calcula mobile/medication.tsx
 *     (savingsPct = round(savings / priciest.channels.effective * 100)) —
 *     solo se usa ahí, no está duplicado en ningún otro lugar.
 *   - El umbral de "alta dispersión" de insights.ts, que divide el mismo
 *     diff por `cheapest` (no por `priciest`) con otro propósito
 *     (flag de dispersión, no "cuánto ahorras eligiendo bien"). Es una
 *     fórmula distinta pese a compartir los mismos dos precios de entrada
 *     — unificarla cambiaría un resultado real, así que se mantiene local
 *     a insights.ts.
 */
export function computeSavings(orderedPrices: PharmacyPrice[]): SavingsResult {
  const cheapest = orderedPrices[0];
  const priciest = orderedPrices[orderedPrices.length - 1];
  const savings =
    cheapest && priciest && priciest !== cheapest
      ? priciest.channels.effective - cheapest.channels.effective
      : 0;
  return { cheapest, priciest, savings };
}
