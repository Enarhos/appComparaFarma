import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://www.drsimi.cl";

function isRelevant(productName: string, query: string): boolean {
  const nameLower = productName.toLowerCase();
  const queryWords = query.toLowerCase().replace(/[-_]/g, " ").split(/\s+/).filter((word) => word.length >= 3);
  if (queryWords.length === 0) return true;
  return queryWords.some((word) => nameLower.includes(word));
}

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30) — Dr. Simi es la ÚNICA de las 9
 * farmacias que entrega hoy evidencia NEGATIVA explícita: su API VTEX expone
 * el campo `Bioequivalente` como array de un elemento con vocabulario cerrado
 * `["SI"]` / `["NO"]`. Auditado contra la fuente real (4 consultas, 52
 * productos, 2026-08-30): el campo estaba presente en el 100% de los productos
 * y no apareció ningún valor fuera de ese vocabulario.
 *
 * Por eso, y solo acá, `false` significa de verdad "la fuente afirma que NO es
 * bioequivalente" y no "no sabemos".
 *
 * El código anterior (`(bioArr?.[0] ?? "").toUpperCase() === "SI"`) devolvía
 * `false` tanto para "NO" como para el campo ausente o con un valor
 * inesperado, colapsando evidencia negativa real con ausencia de dato. No se
 * observó ese caso en producción, pero la fuente puede dejar de enviar el
 * campo en cualquier momento sin avisar (es un scraper de catálogo de terceros)
 * y ahí el defecto se volvería silencioso.
 */
function readDrSimiBioequivalence(raw: unknown): boolean | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "SI" || normalized === "SÍ") return true;
  if (normalized === "NO") return false;
  return null;
}

export function parseDrSimiResponse(
  products: Record<string, unknown>[],
  query: string
): ScrapedProduct[] {
  return (products ?? []).flatMap((product) => {
    const items = product.items as Record<string, unknown>[] | undefined;
    if (!items?.length) return [];

    const offer = (
      (items[0].sellers as Record<string, unknown>[])?.[0]?.commertialOffer as Record<string, unknown>
    ) ?? {};

    const salePrice = parseFloat(String(offer.Price ?? 0));
    const listPrice = parseFloat(String(offer.ListPrice ?? 0));
    if (!salePrice) return [];

    const storePrice = listPrice > 0 ? listPrice : salePrice;
    const onlinePrice = salePrice < storePrice ? salePrice : null;
    const images = items[0].images as { imageUrl?: string }[] | undefined;
    const imageUrl = images?.[0]?.imageUrl ?? null;
    const isBioequivalent = readDrSimiBioequivalence(product.Bioequivalente);
    const name = String(product.productName ?? query);
    if (!isRelevant(name, query)) return [];

    return [{
      name,
      price: storePrice,
      onlinePrice,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: Boolean(offer.IsAvailable) && Number(offer.AvailableQuantity ?? 0) > 0,
      hasOnlineDelivery: true,
      onlineUrl: product.link ? String(product.link) : `${BASE}/${encodeURIComponent(query)}`,
      imageUrl,
      // CF-DATA-001 (2026-08-31): el campo se llama `brand` en VTEX pero
      // contiene el FABRICANTE. Medido sobre la fuente real (9 búsquedas, 98
      // productos): presente en el 100 %, 24 valores distintos, todos nombres
      // de laboratorio — MAVER(21), PRATER(16), OPKO(9), ASCEND(8), TEVA(7),
      // PASTEUR(6), ANDRÓMACO(4), SEVEN PHARMA(3)… y CERO coincidencias con el
      // nombre del producto (0 % lo tiene como prefijo, 0 % lo contiene).
      // "Tocalm ambroxol 15 mg/5 mL jarabe" -> "PRATER": la marca es Tocalm.
      brand: null,
      manufacturer: product.brand ? String(product.brand) : null,
      isBioequivalent,
    }];
  });
}

export async function searchDrSimi(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ _from: "0", _to: "23" });
  const res = await fetchWithTimeout(
    `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": `${BASE}/`,
      },
    }
  );

  if (!res.ok) throw new Error(`Dr. Simi HTTP ${res.status}`);
  const products = await res.json() as Record<string, unknown>[];
  return parseDrSimiResponse(products, query);
}
