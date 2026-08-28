import type { MedicationResult } from "@/lib/types";

/**
 * CF-SEARCH-001 — resuelve, dentro de los resultados de la búsqueda en
 * memoria, la tarjeta que el usuario tocó.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * `/medication` resolvía con `results.find(r => r.matchKey === key)`. Desde
 * FASE 1 — Product Identity (2026-08-19) `mergeDuplicates` agrupa por
 * `presentationKey`, así que `matchKey` DEJÓ de ser único dentro de una
 * búsqueda: dos tarjetas visibles pueden compartirlo. `find` devolvía siempre
 * la PRIMERA coincidencia y, como la lista viene ordenada por precio
 * ascendente, esa primera coincidencia es la tarjeta más barata — no la que se
 * tocó.
 *
 * Reproducción en producción (query "tapsin", 2026-08-27):
 *   ecofarmacias "Tapsin X 6 Comprimidos (Maver)"                $460  matchKey tapsin|6
 *   araucomed    "Tapsin Rojo Dolor de Cabeza Tira x 6 comprim." $500  matchKey tapsin|6
 * Tocar la tarjeta de AraucoMed abría la ficha de EcoFarmacias y el enlace
 * llevaba a EcoFarmacias — el síntoma reportado como "AraucoMed navega a
 * EcoFarmacias". Es un defecto de NAVEGACIÓN, independiente del defecto de
 * identidad que hacía que ambas ofertas se fusionaran.
 *
 * `matchKey` se conserva como fallback: sigue siendo la clave de historial,
 * alertas y favoritos, y las navegaciones que no envían `presentationKey`
 * (favoritos desde el home) siguen funcionando igual.
 */
export function resolveMedicationCard(
  results: MedicationResult[],
  params: { presentationKey?: string; matchKey?: string }
): MedicationResult | undefined {
  const { presentationKey, matchKey } = params;

  if (presentationKey) {
    const exact = results.find((result) => result.presentationKey === presentationKey);
    if (exact) return exact;
  }

  if (matchKey) return results.find((result) => result.matchKey === matchKey);

  return undefined;
}
