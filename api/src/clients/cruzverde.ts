import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const API = "https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search";
const CID = "c19ce24d-1677-4754-b9f7-c193997c5a92";
const BASE = "https://www.cruzverde.cl";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCruzVerdeResponse(
  data: { hits?: Record<string, unknown>[] },
  query: string
): ScrapedProduct[] {
  return (data.hits ?? []).flatMap((hit) => {
    const price = hit.price as number | null;
    if (!price) return [];
    const id = String(hit.product_id ?? "");
    const name = String(hit.product_name ?? query);
    const img = hit.image as { dis_base_link?: string } | null;
    const imageUrl = img?.dis_base_link ?? null;

    return [{
      name,
      price: Number(price),
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: Boolean(hit.orderable ?? true),
      hasOnlineDelivery: true,
      onlineUrl: id ? `${BASE}/${toSlug(name)}/${id}.html` : `${BASE}/search?q=${encodeURIComponent(name)}`,
      imageUrl,
      laboratory: null,
      isBioequivalent: false,
    }];
  });
}

export async function searchCruzVerde(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({
    q: query,
    count: "24",
    expand: "prices,availability,images",
    client_id: CID,
  });

  const res = await fetchWithTimeout(`${API}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "x-dw-client-id": CID,
      "Referer": `${BASE}/`,
    },
  });

  const data = await res.json() as { hits?: Record<string, unknown>[] };
  return parseCruzVerdeResponse(data, query);
}
