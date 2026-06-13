import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://farmacia.araucomed.com";

interface AraucoProduct {
  id_product: number;
  name: string;
  price_amount: number;
  manufacturer_name: string | null;
  url: string;
  description_short: string;
  active: number;
  cover: {
    bySize?: {
      home_default?: { url: string };
    };
  } | null;
}

interface SearchResponse {
  products: AraucoProduct[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function parseAraucoMedResponse(data: SearchResponse): ScrapedProduct[] {
  return (data.products ?? [])
    .filter(p => p.price_amount > 0 && p.active)
    .map(p => ({
      name: p.name,
      price: p.price_amount,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: p.active === 1,
      hasOnlineDelivery: false,
      onlineUrl: p.url ?? null,
      imageUrl: p.cover?.bySize?.home_default?.url ?? null,
      laboratory: p.manufacturer_name ?? null,
      isBioequivalent: /bioequivalen/i.test(p.name + " " + stripHtml(p.description_short)),
    }));
}

export async function searchAraucoMed(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ controller: "search", s: query, ajax: "1" });
  const res = await fetchWithTimeout(`${BASE}/?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`AraucoMed HTTP ${res.status}`);
  const data = await res.json() as SearchResponse;
  return parseAraucoMedResponse(data);
}
