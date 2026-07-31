export type PharmacySlug =
  | "cruz-verde"
  | "salcobrand"
  | "ahumada"
  | "dr-simi"
  | "araucomed"
  | "ecofarmacias"
  | "farmex"
  | "sermecoop"
  | "easyfarma";

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
  /**
   * Identidad canónica y permanente del medicamento (ej. "CFM-000123"),
   * independiente de la versión de `matchKey` — ver
   * docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md.
   * Opcional y nullable a propósito: `null` cuando Supabase no está
   * configurado o el registro aún no corrió para este resultado.
   * Campo puramente aditivo — mobile/ y web/ no necesitan leerlo.
   */
  cfmId?: string | null;
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

export interface SearchRequestContext {
  requestId: string;
}

export interface PharmacySearchDiagnostic {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  status: "fulfilled" | "rejected";
  resultCount: number;
  durationMs: number;
  errorMessage: string | null;
}

export interface SearchDiagnostics {
  query: string;
  totalResults: number;
  mergedResults: number;
  durationMs: number;
  pharmacies: PharmacySearchDiagnostic[];
}

export interface SearchExecution {
  results: MedicationResult[];
  diagnostics: SearchDiagnostics;
}
