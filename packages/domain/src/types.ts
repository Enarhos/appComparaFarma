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
  /**
   * CF-DATA-001 (2026-08-31) — ALIAS DE COMPATIBILIDAD, semántica AMBIGUA.
   *
   * Conserva EXACTAMENTE el valor que este campo tenía antes de la separación
   * de taxonomía (`manufacturer ?? brand` de la oferta canónica), y por lo tanto
   * conserva también su defecto: para 3 farmacias contiene un FABRICANTE
   * (Dr. Simi, AraucoMed, Farmex), para Salcobrand contiene una MARCA, y para
   * las 5 restantes es siempre `null`.
   *
   * Se mantiene por dos razones concretas, no por inercia: (1) `mobile/` lo
   * consume y publica en producción, y (2) es el campo que
   * `resolveCommercialIdentity()` alimenta hacia `presentationKey`, del que
   * derivan los slugs de ficha de Web — cambiar su valor rotaría URLs indexadas.
   *
   * NO USAR EN CÓDIGO NUEVO. Para presentar: `brand` (marca) o `manufacturer`
   * (laboratorio). Plan de retiro en docs/qa/cf-data-001/README.md.
   */
  laboratory: string | null;
  /**
   * CF-DATA-001 — MARCA COMERCIAL del producto ("Tapsin", "Muxol", "Tocalm"),
   * o `null` cuando no hay evidencia suficiente.
   *
   * `null` es un valor legítimo y frecuente, no un error: un genérico
   * ("Paracetamol 500 mg x 16") no tiene marca, y el algoritmo prefiere el
   * falso negativo antes que inventar una. La UI debe distinguir "sin marca"
   * de "marca desconocida" con criterio de producto, no rellenar el hueco.
   *
   * Procedencia: campo estructurado de marca de la farmacia (hoy solo
   * Salcobrand) o derivación corroborada desde el nombre — ver `brandSource` y
   * `brandIdentity.ts`. NUNCA es un fabricante ni un principio activo.
   */
  brand: string | null;
  /**
   * CF-DATA-001 — LABORATORIO/FABRICANTE ("Maver", "Eurolab", "Abbott"), o
   * `null`. Se publica SOLO cuando la farmacia lo entrega en un campo
   * estructurado: nunca se infiere del nombre del producto.
   */
  manufacturer: string | null;
  /**
   * CF-DATA-001 — PRINCIPIO ACTIVO reconocido en el nombre, normalizado y sin
   * acentos ("paracetamol", "ambroxol"), o `null` si no se reconoció.
   *
   * Es informativo y no participa de ninguna clave de identidad: `matchKey`
   * sigue siendo la identidad farmacológica del sistema.
   */
  activeIngredient: string | null;
  /**
   * CF-DATA-001 — de dónde salió `brand`, para poder auditar la calidad del
   * dato desde el cliente sin re-derivarlo: `"structured"` (campo declarado por
   * la farmacia), `"name"` (derivado del nombre con corroboración) o
   * `"unknown"` (sin marca).
   */
  brandSource: BrandSource;
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

/**
 * CF-DATA-001 — procedencia de `MedicationResult.brand`. Se declara acá, junto
 * al resto del contrato público, por el mismo motivo que `LexicalMatch`: viaja
 * en la respuesta de `/api/search`, no es un detalle interno. La semántica de
 * cada valor está documentada en `brandIdentity.ts`.
 */
export type BrandSource = "structured" | "name" | "unknown";

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
  /**
   * CF-DATA-001 (2026-08-31) — reemplaza al antiguo campo único `laboratory`,
   * que cada adaptador llenaba con una cosa distinta.
   *
   * `brand` es el campo que la farmacia declara como MARCA COMERCIAL. Hoy solo
   * Salcobrand (`hit.brand`, Algolia) entrega uno: medido sobre 135 tarjetas de
   * una sola oferta en producción, el 83,7 % de sus valores es el prefijo del
   * propio nombre del producto ("Muxol", "Tapsin", "Broncot") — es una marca,
   * no un laboratorio, y hasta ahora se publicaba mezclado con los fabricantes
   * del resto de las farmacias.
   *
   * Cada adaptador debe mapear su campo por lo que se MIDIÓ que contiene, no
   * por cómo se llama en el origen — ver la matriz en `brandIdentity.ts`.
   */
  brand: string | null;
  /**
   * CF-DATA-001 — campo que la farmacia declara como LABORATORIO/FABRICANTE:
   * Dr. Simi `product.brand` (VTEX; el nombre engaña, contiene el fabricante),
   * AraucoMed `manufacturer_name`, Farmex `vendor`. `null` en las 5 farmacias
   * que no exponen ninguno.
   */
  manufacturer: string | null;
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
