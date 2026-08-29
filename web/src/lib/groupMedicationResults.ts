/**
 * Fase 2 UX — Product Identity (2026-08-19+): agrupamiento de resultados de
 * búsqueda por presentación farmacológica (`matchKey`), puramente de
 * presentación en Web/client-side. NO toca `packages/domain` ni el contrato
 * de `/api/search` — recibe el array de `MedicationResult` ya deduplicado
 * por `presentationKey` (una entrada por marca/producto comercial, ver
 * `@comparafarma/domain` `mergeDuplicates`) y lo reagrupa por `matchKey`
 * para la UI.
 *
 * Regla de diseño explícita (aprobada por CTO): `presentationKey` es un
 * identificador OPACO. Este módulo nunca parsea sus segmentos internos
 * (`brand:`, `bio:`, etc.) — toda decisión de UI usa exclusivamente campos
 * semánticos ya expuestos por `MedicationResult`: `matchKey`, `canonicalName`,
 * `laboratory`, `isBioequivalent`, `bestPrice`, `prices`.
 */
import type { ConcentrationMatch, MedicationResult } from "@comparafarma/domain";

export interface MedicationGroup {
  /** Identidad farmacológica amplia compartida por todos los productos del grupo. */
  matchKey: string;
  /**
   * CF-SEARCH-002 — cohorte de concentración del grupo, o `undefined` cuando
   * la consulta no pidió concentración y por lo tanto no hay cohortes.
   *
   * Es una LECTURA del campo que ya trae cada `MedicationResult` desde la API,
   * no un recálculo: la regla de "no parsear nombres en el cliente" se aplica
   * igual que la de "no parsear `presentationKey`". Un grupo es homogéneo por
   * construcción — `matchKey` incluye el segmento de dosis, así que todos sus
   * productos comparten concentración y, por lo tanto, cohorte.
   */
  concentrationMatch?: ConcentrationMatch;
  /** Título de presentación a mostrar — ver buildGroupTitle() y su limitación documentada. */
  title: string;
  /**
   * Imagen representativa del grupo — ver buildGroupImageUrl(). `null` si
   * ningún producto comercial del grupo trae una imagen válida.
   */
  imageUrl: string | null;
  /** Productos comerciales (un MedicationResult completo por marca/presentationKey), ya ordenados — ver sortCommercialProducts(). */
  products: MedicationResult[];
}

/**
 * Un producto comercial se considera "identificado" cuando `laboratory` es
 * un valor no vacío. Es una lectura directa del campo semántico existente,
 * no una reconstrucción de `commercialIdentity` — dos conceptos de dominio
 * distintos (`laboratory` es el atributo de laboratorio ya expuesto por la
 * API; `commercialIdentity`/`presentationKey` es interno del dominio y no se
 * lee acá). En la práctica, hoy ambos suelen coincidir (un producto con
 * marca reconocida casi siempre también trae `laboratory`), pero esta
 * función depende únicamente del campo público, tal como exige la regla de
 * "no parsear presentationKey".
 */
function isIdentified(product: MedicationResult): boolean {
  return typeof product.laboratory === "string" && product.laboratory.trim().length > 0;
}

/**
 * Orden aprobado dentro de un grupo comercial:
 * 1. precio mínimo ascendente (`bestPrice`, ya calculado por la API — no se
 *    recalcula acá para no duplicar la lógica de `computeSavings`/
 *    `sortByEffectivePrice` de `@comparafarma/domain`, que sigue siendo la
 *    única fuente de verdad para el precio efectivo).
 * 2. en empate, bioequivalente (`isBioequivalent === true`) primero.
 * 3. en empate, mayor cobertura (más farmacias, `prices.length`).
 * IMPORTANTE (regla CTO): NO se ordena bioequivalente primero de forma
 * absoluta — el precio domina el primer criterio, PreciosFarma sigue siendo
 * primariamente un comparador de precios.
 */
function compareCommercialProducts(a: MedicationResult, b: MedicationResult): number {
  if (a.bestPrice !== b.bestPrice) return a.bestPrice - b.bestPrice;
  const aBio = a.isBioequivalent === true;
  const bBio = b.isBioequivalent === true;
  if (aBio !== bBio) return aBio ? -1 : 1;
  return b.prices.length - a.prices.length;
}

/**
 * Aplica el orden aprobado y empuja los productos "no identificados" al
 * final del grupo — pero SOLO cuando existe al menos una alternativa
 * identificada comparable en el mismo grupo. Si todos los productos del
 * grupo son no identificados, no hay nada respecto a qué "ir al final": se
 * ordenan entre sí con el mismo criterio, sin partición especial.
 */
export function sortCommercialProducts(products: MedicationResult[]): MedicationResult[] {
  const identified = products.filter(isIdentified).sort(compareCommercialProducts);
  const unidentified = products.filter((p) => !isIdentified(p)).sort(compareCommercialProducts);
  return [...identified, ...unidentified];
}

const TRAILING_PARENTHETICAL = /\s*\([^)]*\)\s*$/;

/**
 * Construye el título de presentación farmacológica del grupo a partir del
 * `canonicalName` del producto mejor posicionado (tras sortCommercialProducts).
 *
 * LIMITACIÓN DOCUMENTADA (por diseño, no se resuelve en esta fase): hoy no
 * existe en `MedicationResult` ningún campo estructurado de forma
 * farmacéutica/dosis/cantidad separado del texto libre de `canonicalName` —
 * cada farmacia aporta su propio `canonicalName`, que frecuentemente incluye
 * la marca comercial entre paréntesis al final (ej. "Omeprazol 20 mg x 30
 * cápsulas. (Curae Spring)", "(Opko)", "(Chile)"). Esta función aplica una
 * limpieza conservadora — quita SOLO un grupo entre paréntesis al final del
 * texto — sin intentar resolver una ontología nueva de dosis/forma/cantidad.
 * Si la marca aparece embebida sin paréntesis (ej. "Tapsin SC puro 500 mg x
 * 16 comprimidos."), o si el nombre de la presentación coincide con un
 * principio activo cuyo propio matchKey es "marca-primero" (Tapsin, Lomex,
 * Actron, etc.), el texto se conserva tal cual — es correcto en ese caso,
 * porque para esos productos la marca ES la identidad farmacológica agrupada
 * por matchKey, no una variación comercial superpuesta.
 */
export function buildGroupTitle(products: MedicationResult[]): string {
  const source = products[0]?.canonicalName ?? "";
  const stripped = source.replace(TRAILING_PARENTHETICAL, "").trim();
  return stripped.length > 0 ? stripped : source;
}

/**
 * Imagen representativa del grupo — bug reportado (2026-08-24, búsqueda
 * "Ascenda"): la vista agrupada de Web (`MedicationResultsGroup`/
 * `CommercialProductRow`) no renderizaba ninguna imagen, aunque
 * `MedicationResult.imageUrl` llegara resuelto y válido desde la API (el
 * dedupe de `packages/domain` ya hereda correctamente la primera imagen
 * válida al fusionar por `presentationKey` — ver `mergeDuplicates` en
 * `deduplication.ts` — pero ningún componente de la vista de resultados
 * agrupados leía ese campo).
 *
 * Regla explícita: primera imagen no-null encontrada entre los productos del
 * grupo, en el orden ya aprobado por `sortCommercialProducts()` (precio
 * ascendente, con bioequivalencia y cobertura como desempate) — mismo
 * criterio que ya usa `mergeDuplicates` a nivel de fusión por marca, aplicado
 * aquí a nivel de agrupación por `matchKey` en Web.
 */
export function buildGroupImageUrl(products: MedicationResult[]): string | null {
  return products.map((p) => p.imageUrl).find((url) => url != null) ?? null;
}

/**
 * Agrupa un array de MedicationResult (ya deduplicado por presentationKey)
 * por matchKey, preservando:
 * - el orden de aparición del primer MedicationResult de cada matchKey en el
 *   array de entrada (mantiene el criterio de orden entre grupos que ya
 *   trae la API/domain — no se reordenan los grupos entre sí en esta fase).
 * - cada MedicationResult completo dentro de su grupo, sin fusionar ni
 *   reconstruir sus `prices[]` — nunca se mezclan precios entre productos
 *   comerciales distintos.
 */
export function groupMedicationResultsByMatchKey(results: MedicationResult[]): MedicationGroup[] {
  const order: string[] = [];
  const byMatchKey = new Map<string, MedicationResult[]>();

  for (const result of results) {
    const existing = byMatchKey.get(result.matchKey);
    if (existing) {
      existing.push(result);
    } else {
      byMatchKey.set(result.matchKey, [result]);
      order.push(result.matchKey);
    }
  }

  return order.map((matchKey) => {
    const products = sortCommercialProducts(byMatchKey.get(matchKey)!);
    return {
      matchKey,
      title: buildGroupTitle(products),
      imageUrl: buildGroupImageUrl(products),
      products,
      concentrationMatch: products[0]?.concentrationMatch,
    };
  });
}

/**
 * CF-SEARCH-002 — separa los grupos en los que responden a la concentración
 * pedida y los que son OTRA concentración del mismo principio activo.
 *
 * `primary` son las cohortes `exact` y `unknown`: la dosis pedida más aquellas
 * cuyo nombre no la declara (no se puede afirmar que NO sean lo buscado, y
 * esconderlas destruiría recall real — varias farmacias truncan el nombre).
 * `other` son las cohortes `other`.
 *
 * Cuando la consulta no trae concentración, `concentrationMatch` llega
 * `undefined` en todos los resultados y TODO cae en `primary`: no se inventa
 * una sección de "otras concentraciones" que no corresponde.
 *
 * No reordena: preserva el orden que ya decidió `rankByRelevance` en el
 * dominio, que es el único lugar donde vive esa regla.
 */
export function splitGroupsByConcentration(groups: MedicationGroup[]): {
  primary: MedicationGroup[];
  other: MedicationGroup[];
} {
  return {
    primary: groups.filter((group) => group.concentrationMatch !== "other"),
    other: groups.filter((group) => group.concentrationMatch === "other"),
  };
}

export interface RemainingOptionsCount {
  mobile: number;
  desktop: number;
}

/** Cantidad de opciones comerciales ocultas por defecto en cada breakpoint aprobado (3 mobile / 5 desktop). */
export function computeRemainingOptions(
  total: number,
  visible: { mobile: number; desktop: number } = { mobile: 3, desktop: 5 }
): RemainingOptionsCount {
  return {
    mobile: Math.max(total - visible.mobile, 0),
    desktop: Math.max(total - visible.desktop, 0),
  };
}

/**
 * Clase Tailwind de visibilidad por fila, según su índice dentro del grupo.
 * Puramente responsive (CSS, breakpoint `sm` = escritorio) — sin detección
 * de ancho vía JS. El único estado de React involucrado es `expanded`
 * (mostrar todo, sin importar breakpoint).
 */
export function rowVisibilityClassName(
  index: number,
  expanded: boolean,
  visible: { mobile: number; desktop: number } = { mobile: 3, desktop: 5 }
): string {
  if (expanded) return "";
  if (index < visible.mobile) return "";
  if (index < visible.desktop) return "hidden sm:block";
  return "hidden";
}
