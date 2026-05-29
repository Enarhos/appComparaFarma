import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://www.drsimi.cl";

function isRelevant(productName: string, query: string): boolean {
  const nameLower = productName.toLowerCase();
  const queryWords = query.toLowerCase().replace(/[-_]/g, " ").split(/\s+/).filter((word) => word.length >= 3);
  if (queryWords.length === 0) return true;
  return queryWords.some((word) => nameLower.includes(word));
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
    const bioArr = product.Bioequivalente as string[] | undefined;
    const isBioequivalent = (bioArr?.[0] ?? "").toUpperCase() === "SI";
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
      laboratory: product.brand ? String(product.brand) : null,
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

  const products = await res.json() as Record<string, unknown>[];
  return parseDrSimiResponse(products, query);
}
