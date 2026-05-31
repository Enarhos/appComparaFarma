import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://farmamarket.cl";

interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string | null;
  };
  is_in_stock: boolean;
  images: Array<{ src: string }>;
}

function isRelevant(productName: string, query: string): boolean {
  const nameLower = productName.toLowerCase();
  const queryWords = query.toLowerCase().replace(/[-_]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
  if (queryWords.length === 0) return true;
  return queryWords.some((w) => nameLower.includes(w));
}

export function parseFarmaMarketResponse(products: WCProduct[], query: string): ScrapedProduct[] {
  return products.flatMap((product) => {
    const price = parseInt(product.prices.price, 10);
    if (!price || price <= 0) return [];
    if (!isRelevant(product.name, query)) return [];

    return [{
      name: product.name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: product.is_in_stock,
      hasOnlineDelivery: false,
      onlineUrl: product.permalink ?? null,
      imageUrl: product.images?.[0]?.src ?? null,
      laboratory: null,
      isBioequivalent: false,
      nearExpiry: true,
    }];
  });
}

export async function searchFarmaMarket(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ search: query, per_page: "24" });
  const res = await fetchWithTimeout(
    `${BASE}/wp-json/wc/store/products?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": `${BASE}/`,
      },
    }
  );

  const products = await res.json() as WCProduct[];
  return parseFarmaMarketResponse(products, query);
}
