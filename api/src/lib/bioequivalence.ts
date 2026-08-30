/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 — semántica del dato de bioequivalencia en la
 * capa de adaptadores.
 *
 * REGLA DE PRODUCTO NO NEGOCIABLE: PreciosFarma nunca afirma bioequivalencia
 * (ni positiva ni negativa) sin evidencia de la fuente. `ScrapedProduct
 * .isBioequivalent` es `boolean | null` desde siempre (packages/domain/src/
 * types.ts) y `null` significa literalmente "esta farmacia no nos dice nada
 * sobre bioequivalencia para este producto".
 *
 * Las tres semánticas se distinguen explícitamente:
 *   `true`  — la fuente afirma que ESTE producto/presentación es bioequivalente.
 *   `false` — la fuente afirma que NO lo es (evidencia NEGATIVA explícita).
 *   `null`  — la fuente no entrega el dato.
 *
 * Auditoría de fuentes reales (2026-08-30, GET read-only contra las 9
 * farmacias): la ÚNICA que entrega hoy evidencia negativa explícita es Dr. Simi
 * (`Bioequivalente: ["NO"]`, campo presente en el 100% de sus productos). Todas
 * las demás entregan, como mucho, una señal POSITIVA (badge, categoría, texto)
 * cuya ausencia no significa "no es bioequivalente" sino "no informado": el
 * catálogo puede simplemente no tener el producto clasificado. Por eso existe
 * `positiveBioSignal()` — para que "no encontré el badge" no vuelva a
 * escribirse como `false`.
 */

/**
 * Traduce un detector de evidencia POSITIVA (badge, categoría, marca en el
 * texto) al contrato tri-estado. Presencia ⇒ `true`; ausencia ⇒ `null`,
 * NUNCA `false`.
 *
 * Existe como función con nombre —y no como un `? true : null` suelto en cada
 * cliente— porque el defecto que corrige es exactamente el patrón contrario
 * (`Boolean(...)`, `?? false`) repetido en 8 de los 9 adaptadores: un solo
 * punto con nombre hace que el error vuelva a ser visible en review.
 */
export function positiveBioSignal(present: boolean): true | null {
  return present ? true : null;
}
