import type { MedicationResult } from "@/lib/types";

/**
 * CF-SEARCH-002 — armado de la lista de resultados de Mobile en dos secciones:
 * lo que responde a la concentración pedida y las OTRAS concentraciones del
 * mismo principio activo.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * ---------------------------
 * `results.tsx` reordenaba la respuesta de la API por `bestPrice`
 * (`displayResults.sort(...)`) DESPUÉS de filtrar por farmacia/comuna. Ese
 * reorden deshacía por completo el ranking por cohorte que la API ya había
 * aplicado: un Ibuprofeno 400 mg más barato volvía a quedar delante del 600 mg
 * pedido. La corrección tiene que vivir en el mismo lugar donde se reordena.
 *
 * QUÉ NO HACE
 * -----------
 * No clasifica: `concentrationMatch` lo calcula el dominio y llega en cada
 * `MedicationResult`. Acá solo se agrupa y se ordena, con la MISMA regla que
 * `rankByRelevance` (@comparafarma/domain) — la cohorte manda sobre el precio
 * —, sin duplicar el algoritmo de relevancia ni volver a parsear nombres.
 */

/** Cabecera de sección dentro de la FlatList. Se distingue de los skeletons por su prefijo. */
export const OTHER_CONCENTRATIONS_HEADER = "section:other-concentrations";

export type ResultListItem = string | MedicationResult;

/**
 * Un resultado pertenece a la sección secundaria solo cuando la API afirmó que
 * su concentración es OTRA. La ausencia del campo (consulta sin concentración)
 * y `"unknown"` (la farmacia no declara la dosis) van a la sección principal:
 * es la misma política conservadora del dominio — no se esconde nada por falta
 * de dato.
 */
function isOtherConcentration(result: MedicationResult): boolean {
  return result.concentrationMatch === "other";
}

/**
 * Rango de cohorte, con los MISMOS tres niveles y el mismo orden que
 * `rankByRelevance` en @comparafarma/domain: EXACT → UNKNOWN → OTHER.
 *
 * La ausencia del campo comparte rango con `"exact"` (0) a propósito: cuando la
 * consulta no pide concentración, TODOS los resultados llegan sin cohorte, el
 * rango es constante y el orden lo decide íntegramente el criterio del usuario
 * — exactamente el comportamiento anterior a este ticket.
 */
function cohortRank(result: MedicationResult): number {
  if (result.concentrationMatch === "unknown") return 1;
  if (result.concentrationMatch === "other") return 2;
  return 0;
}

/**
 * Ordena respetando el límite de cohorte y, dentro de cada cohorte, el criterio
 * elegido por el usuario en el `FilterSheet` (precio o nombre).
 *
 * El orden entre cohortes NO es configurable a propósito: es una regla de
 * seguridad de la comparación (no mostrar otra dosis por delante de la pedida),
 * no una preferencia de presentación.
 */
export function sortWithinConcentrationCohorts(
  results: MedicationResult[],
  sortBy: "price" | "name"
): MedicationResult[] {
  const compare = (a: MedicationResult, b: MedicationResult) =>
    sortBy === "name"
      ? a.canonicalName.localeCompare(b.canonicalName, "es")
      : a.bestPrice - b.bestPrice;

  return [...results].sort((a, b) => cohortRank(a) - cohortRank(b) || compare(a, b));
}

/**
 * Lista final para la `FlatList`, con la cabecera de "otras concentraciones"
 * insertada justo antes del primer resultado de esa cohorte. Si no hay ninguno
 * —el caso normal cuando la consulta no pide concentración— no se inserta
 * ninguna cabecera y la lista queda idéntica a la de siempre.
 */
export function buildResultListItems(
  results: MedicationResult[],
  sortBy: "price" | "name"
): ResultListItem[] {
  const ordered = sortWithinConcentrationCohorts(results, sortBy);
  const firstOther = ordered.findIndex(isOtherConcentration);
  if (firstOther === -1) return ordered;
  return [
    ...ordered.slice(0, firstOther),
    OTHER_CONCENTRATIONS_HEADER,
    ...ordered.slice(firstOther),
  ];
}
