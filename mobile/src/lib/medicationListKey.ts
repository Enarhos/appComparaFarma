import type { MedicationResult } from "@/lib/types";

/**
 * CF-SEARCH-001 (QA-02) — clave de lista para la FlatList de resultados.
 *
 * PROBLEMA QUE RESUELVE
 * ---------------------
 * El `keyExtractor` de `results.tsx` usaba `matchKey`. Desde FASE 1 — Product
 * Identity (2026-08-19) `mergeDuplicates` agrupa por `presentationKey`, y
 * CF-SEARCH-001 sumó los ejes `|var:`/`|form:`: una misma búsqueda puede
 * mostrar 2+ tarjetas distintas con el MISMO `matchKey` (ej. "Tapsin Rojo" y
 * "Tapsin Noche", ambas `tapsin|6`). React recibía claves duplicadas —medido
 * sobre datos reales: 473 -> 515 tarjetas, +8.9% de casos con `matchKey`
 * repetido— con el riesgo de reconciliación cruzada entre filas (estado visual
 * de una tarjeta aplicado a otra).
 *
 * Se usa la MISMA identidad con la que ya se navega a la ficha
 * (`resolveMedicationCard` / `MedicationListItem`): `presentationKey`, con
 * `matchKey` como fallback. El fallback cubre datos servidos desde una caché
 * anterior a que el campo existiera, donde `presentationKey` puede llegar
 * vacío o ausente aunque el tipo lo declare siempre presente.
 *
 * Los placeholders de carga (SKELETON_KEYS) llegan como `string` y son su
 * propia clave.
 */
export function medicationListKey(item: string | MedicationResult): string {
  if (typeof item === "string") return item;
  return item.presentationKey || item.matchKey;
}
