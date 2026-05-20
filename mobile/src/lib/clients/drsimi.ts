import type { ScrapedProduct } from "@/lib/types";

const BASE = "https://www.drsimi.cl";

// Palabras del query que deben aparecer en el nombre del producto (min 3 chars)
function isRelevant(productName: string, query: string): boolean {
  const nameLower = productName.toLowerCase();
  const queryWords = query.toLowerCase().replace(/[-_]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
  if (queryWords.length === 0) return true;
  return queryWords.some((w) => nameLower.includes(w));
}

export async function searchDrSimi(
  query: string,
  signal?: AbortSignal
): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ _from: "0", _to: "9" });
  const res = await fetch(
    `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?${params}`,
    {
      signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": `${BASE}/`,
      },
    }
  );
  const products = await res.json() as Record<string, unknown>[];

  return (products ?? []).flatMap((product) => {
    const items = product.items as Record<string, unknown>[] | undefined;
    if (!items?.length) return [];

    const offer = (
      (items[0].sellers as Record<string, unknown>[])?.[0]?.commertialOffer as Record<string, unknown>
    ) ?? {};

    const salePrice  = parseFloat(String(offer.Price  ?? 0));
    const listPrice  = parseFloat(String(offer.ListPrice ?? 0));
    if (!salePrice) return [];

    const storePrice  = listPrice > 0 ? listPrice : salePrice;
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
