import type { MedicationResult, PharmacyPrice, PharmacySlug, ScrapedProduct } from "./types.js";
import { combinationKey, matchKey } from "./matching.js";
import { bioequivalenceKey, presentationKey, resolveCommercialIdentity } from "./commercialIdentity.js";
import { commercialVariantKey, dosageFormClass, type ProductIdentity } from "./productIdentity.js";

export function effectivePrice(channels: {
  store: number;
  online: number | null;
  cmr: number | null;
  sbpay: number | null;
}): number {
  return Math.min(
    channels.store,
    channels.online ?? channels.store,
    channels.cmr ?? channels.store,
    channels.sbpay ?? channels.store
  );
}

export function toPharmacyPrice(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): PharmacyPrice {
  const channels = {
    store: product.price,
    online: product.onlinePrice,
    cmr: product.cmrPrice,
    sbpay: product.sbpayPrice,
    effective: effectivePrice({
      store: product.price,
      online: product.onlinePrice,
      cmr: product.cmrPrice,
      sbpay: product.sbpayPrice,
    }),
  };

  return {
    pharmacySlug,
    pharmacyName,
    productName: product.name,
    channels,
    hasStock: product.hasStock,
    hasOnlineDelivery: product.hasOnlineDelivery,
    onlineUrl: product.onlineUrl,
    imageUrl: product.imageUrl,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Copia de `prices` ordenada ascendentemente por `channels.effective` — no
 * muta el array recibido, no filtra, no deduplica, no aplica ninguna regla
 * adicional. Es exactamente el patrón `[...prices].sort((a, b) =>
 * a.channels.effective - b.channels.effective)` que estaba reimplementado
 * de forma idéntica en al menos 4 lugares (Domain Consolidation v4, PR
 * refactor/domain-sort-effective-price):
 *   - web/src/components/MedicationCard.tsx
 *   - web/src/app/medicamento/[slug]/page.tsx
 *   - web/src/lib/insights.ts
 *   - web/src/lib/recipeComparison.ts::computeSplitTotal()
 * y, por equivalencia demostrada (mismo resultado por referencia de objeto
 * en todos los casos, incluidos empates), reemplaza también el `reduce()`
 * de mobile/src/components/MedicationListItem.tsx que buscaba el mínimo a
 * mano.
 *
 * Confía en que `Array.prototype.sort` es estable (garantizado por spec
 * desde ES2019, cumplido por V8/Hermes/JSC) — en empates de `effective`,
 * conserva el orden de aparición original, igual que hacían las
 * implementaciones que reemplaza.
 *
 * Deliberadamente NO usada por mobile/src/app/medication.tsx: ese archivo
 * tiene un orden bidireccional asc/desc controlado por un toggle de UI (y
 * `computeSavings()` depende a propósito de recibir ese array ya ordenado
 * en cualquier sentido) — no forma parte de esta consolidación.
 */
export function sortByEffectivePrice(prices: PharmacyPrice[]): PharmacyPrice[] {
  return [...prices].sort((a, b) => a.channels.effective - b.channels.effective);
}

/**
 * CF-SEARCH-001 — atributos de identidad de UNA oferta, extraídos del mismo
 * `ScrapedProduct` del que sale su `PharmacyPrice`. Se expone aparte de
 * `toMedicationResult` para que `deduplication.ts` pueda validar
 * compatibilidad (`isSameProduct`) sin re-parsear nombres ni depender del
 * formato concatenado de `presentationKey`.
 */
export function toProductIdentity(product: ScrapedProduct): ProductIdentity {
  const key = matchKey(product.name);
  const identity = resolveCommercialIdentity({
    structuredBrand: product.laboratory,
    name: product.name,
    onlineUrl: product.onlineUrl,
    matchKey: key,
  });

  return {
    pharmacologicalKey: key,
    bioequivalence: bioequivalenceKey(product.isBioequivalent),
    commercialIdentity: identity.commercialIdentity,
    combination: combinationKey(product.name),
    commercialVariant: commercialVariantKey(product.name),
    dosageForm: dosageFormClass(product.name),
  };
}

export function toMedicationResult(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): MedicationResult {
  const price = toPharmacyPrice(product, pharmacySlug, pharmacyName);
  const key = matchKey(product.name);
  // FASE 1 — Product Identity (2026-08-19): la identidad comercial se resuelve
  // por-oferta, antes de mergeDuplicates, con la misma evidencia (laboratory
  // estructurado, luego URL) sin importar de qué farmacia venga — ver
  // commercialIdentity.ts. `matchKey` NO cambia de significado ni de cálculo.
  const identity = resolveCommercialIdentity({
    structuredBrand: product.laboratory,
    name: product.name,
    onlineUrl: product.onlineUrl,
    // FASE P1 (hardening) — permite la guardia "principio activo no es
    // marca" en resolveCommercialIdentity (ver commercialIdentity.ts).
    matchKey: key,
  });

  return {
    matchKey: key,
    canonicalName: product.name,
    laboratory: product.laboratory,
    isBioequivalent: product.isBioequivalent,
    prices: [price],
    bestPrice: price.channels.effective,
    bestPharmacy: pharmacySlug,
    imageUrl: product.imageUrl,
    presentationKey: presentationKey({
      matchKey: key,
      isBioequivalent: product.isBioequivalent,
      commercialIdentity: identity.commercialIdentity,
      // S-1 (Gate 2, 2026-08-27): un monofármaco y su combinación comparten
      // `matchKey` (que solo lee el primer principio activo) y se fusionaban en
      // una sola tarjeta. `combinationKey` los separa acá, sin tocar `matchKey`
      // — ver matching.ts. Devuelve `null` para monofármacos, así que la clave
      // de esos NO cambia.
      combinationKey: combinationKey(product.name),
      // CF-SEARCH-001 (2026-08-27): `matchKey` conserva un solo token de
      // nombre, así que todas las variantes comerciales de una misma familia
      // de marca y mismo laboratorio (Tapsin Rojo / Forte / Periodo / Duo /
      // Instaflu, todas de Maver) colapsaban en una sola tarjeta. Estos dos
      // ejes las separan sin tocar `matchKey` — ver productIdentity.ts.
      commercialVariant: commercialVariantKey(product.name),
      dosageForm: dosageFormClass(product.name),
    }),
  };
}
