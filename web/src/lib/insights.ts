import { computeSavings, sortByEffectivePrice, type MedicationResult } from "@comparafarma/domain";
import { formatCLP } from "./format";
import type { PriceHistoryResult } from "./priceHistory";

/**
 * Umbral para considerar que un medicamento tiene "alta dispersión" de
 * precios entre farmacias: la diferencia entre la más cara y la más barata
 * equivale a un 30% o más del precio de la más barata. Es un valor elegido a
 * criterio (no viene de un análisis estadístico del catálogo) — ajustar si en
 * producción resulta demasiado sensible o demasiado laxo.
 */
const HIGH_DISPERSION_THRESHOLD = 0.3;

/**
 * Genera las frases de la sección "Insights" de la ficha de medicamento.
 * Cada frase depende de datos concretos y se omite (no se inventa un dato)
 * cuando no hay suficiente información para calcularla — por ejemplo, la
 * variación semanal solo aparece si `history.summary.change7dPercent` no es
 * null, y las frases de dispersión/precio más alto solo si hay más de una
 * farmacia con precio.
 */
export function buildInsights(medication: MedicationResult, history: PriceHistoryResult): string[] {
  const insights: string[] = [];

  const change7d = history.summary.change7dPercent;
  if (change7d != null) {
    const rounded = Math.round(Math.abs(change7d));
    if (change7d < 0) {
      insights.push(`El precio bajó ${rounded}% durante la última semana.`);
    } else if (change7d > 0) {
      insights.push(`El precio subió ${rounded}% durante la última semana.`);
    } else {
      insights.push("El precio se mantuvo estable durante la última semana.");
    }
  }

  const sortedPrices = sortByEffectivePrice(medication.prices);
  const { cheapest: best, priciest, savings: diff } = computeSavings(sortedPrices);

  if (best) {
    insights.push(`${best.pharmacyName} posee actualmente el menor precio.`);
  }

  if (best && priciest && priciest !== best) {
    insights.push(`La diferencia entre la farmacia más barata y la más cara es de ${formatCLP(diff)}.`);
    insights.push(`${priciest.pharmacyName} mantiene el precio más alto.`);

    // Umbral de dispersión propio de este archivo: divide por `best` (la
    // más barata), a diferencia del porcentaje de mobile/medication.tsx
    // (que divide por `priciest`) — son fórmulas distintas con propósitos
    // distintos, no se unifican (ver comentario en packages/domain/src/
    // savings.ts).
    if (diff / best.channels.effective >= HIGH_DISPERSION_THRESHOLD) {
      insights.push("Este medicamento presenta alta dispersión de precios entre farmacias.");
    }
  }

  return insights;
}
