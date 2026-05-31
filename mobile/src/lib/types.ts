export type PharmacySlug = "cruz-verde" | "salcobrand" | "ahumada" | "dr-simi";

export interface PriceChannels {
  store: number;
  online: number | null;
  cmr: number | null;
  sbpay: number | null;
  effective: number;
}

export interface PharmacyPrice {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  productName: string;
  channels: PriceChannels;
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  imageUrl: string | null;
  fetchedAt: string;
}

export interface MedicationResult {
  matchKey: string;
  canonicalName: string;
  laboratory: string | null;
  isBioequivalent: boolean;
  prices: PharmacyPrice[];
  bestPrice: number;
  bestPharmacy: string;
  imageUrl: string | null;
}

export interface ScrapedProduct {
  name: string;
  price: number;
  onlinePrice: number | null;
  cmrPrice: number | null;
  sbpayPrice: number | null;
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  imageUrl: string | null;
  laboratory: string | null;
  isBioequivalent: boolean;
}
