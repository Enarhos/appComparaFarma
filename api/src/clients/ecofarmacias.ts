import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://www.ecofarmacias.cl";

interface WooPrice {
  price: string;
  regular_price: string;
  sale_price: string;
}

interface WooImage {
  src: string;
}

interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

interface WooProduct {
  name: string;
  permalink: string;
  prices: WooPrice;
  is_in_stock: boolean;
  images: WooImage[];
  categories: WooCategory[];
  on_sale: boolean;
}

export function parseEcoFarmaciasResponse(products: WooProduct[]): ScrapedProduct[] {
  return (products ?? []).flatMap((p) => {
    const price = parseInt(p.prices?.price ?? "0", 10);
    if (!price || price <= 0) return [];

    const isBioequivalent = (p.categories ?? []).some(
      (c) => c?.slug?.includes("bioequivalente") || c?.name?.toLowerCase().includes("bioequivalente")
    );

    return [{
      name: p.name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: p.is_in_stock ?? false,
      hasOnlineDelivery: true,
      onlineUrl: p.permalink ?? null,
      imageUrl: p.images?.[0]?.src ?? null,
      laboratory: null,
      isBioequivalent,
    }];
  });
}

export async function searchEcoFarmacias(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ search: query, per_page: "20" });
  const res = await fetchWithTimeout(
    `${BASE}/wp-json/wc/store/v1/products?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`EcoFarmacias HTTP ${res.status}`);
  const products = await res.json() as WooProduct[];
  return parseEcoFarmaciasResponse(products);
}
