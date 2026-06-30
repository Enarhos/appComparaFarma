import type { MedicationResult, PharmacyPrice, PharmacySlug, ScrapedProduct } from "./types.js";
import { matchKey } from "./matching.js";

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

export function toMedicationResult(product: ScrapedProduct, pharmacySlug: PharmacySlug, pharmacyName: string): MedicationResult {
  const price = toPharmacyPrice(product, pharmacySlug, pharmacyName);
  return {
    matchKey: matchKey(product.name),
    canonicalName: product.name,
    laboratory: product.laboratory,
    isBioequivalent: product.isBioequivalent,
    prices: [price],
    bestPrice: price.channels.effective,
    bestPharmacy: pharmacySlug,
    imageUrl: product.imageUrl,
  };
}
