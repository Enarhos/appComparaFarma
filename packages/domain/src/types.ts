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
  isBioequivalent: boolean | null;
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
  /**
   * Identidad comercial completa (`matchKey` + bioequivalencia + marca
   * normalizada, ej. "omeprazol|20mg|30|bio:false|brand:ascend") — ver
   * `commercialIdentity.ts` y docs/technology/domain/COMMERCIAL_IDENTITY.md.
   * Es la clave que `mergeDuplicates` usa para decidir SAME_PRODUCT; `matchKey`
   * sigue siendo la identidad farmacológica amplia usada por historial,
   * alertas, favoritos, tracking y CFM-ID (sin cambios — FASE 1, 2026-08-19).
   * Siempre calculado (nunca ausente); no reemplaza ni renombra `matchKey`.
   */
  presentationKey: string;
  /**
   * CF-SEARCH-002 — compatibilidad léxica/farmacológica con la consulta que
   * trajo este resultado (`"exact" | "compatible" | "mismatch"`, ver
   * relevance.ts). Lo escribe `rankByRelevance()` después de
   * `mergeDuplicates`; por eso es opcional: un `MedicationResult` recién
   * construido por `toMedicationResult()` todavía no tiene consulta asociada.
   *
   * `"mismatch"` significa evidencia FUERTE de que es otro principio activo
   * (el caso QA-02 "omeprazol" → "Esomeprazol"). El resultado NO se elimina:
   * queda al final del orden y el cliente decide cómo presentarlo.
   */
  lexicalMatch?: LexicalMatch;
  /**
   * CF-SEARCH-002 — cohorte de concentración respecto de la pedida en la
   * consulta (`"exact" | "unknown" | "other"`).
   *
   * AUSENTE cuando la consulta no declaró concentración: en ese caso no existe
   * cohorte y no debe inducirse ninguna preferencia por dosis. Un cliente que
   * ignore el campo sigue funcionando; los que lo leen separan "Resultados
   * para X 600 mg" de "Otras concentraciones de X" sin volver a parsear
   * nombres.
   */
  concentrationMatch?: ConcentrationMatch;
}

/**
 * CF-SEARCH-002 — categorías de relevancia. Se definen acá, junto al resto del
 * contrato que consumen `mobile`/`web`/`api`, y `relevance.ts` las importa de
 * este archivo: son parte de la respuesta pública de `/api/search`, no un
 * detalle interno del algoritmo. La semántica de cada valor está documentada
 * en relevance.ts.
 */
export type LexicalMatch = "exact" | "compatible" | "mismatch";
export type ConcentrationMatch = "exact" | "unknown" | "other";

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
  isBioequivalent: boolean | null;
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
