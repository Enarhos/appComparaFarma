import type { ScrapedProduct } from "./types";

const API   = "https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search";
const CID   = "c19ce24d-1677-4754-b9f7-c193997c5a92";
const BASE  = "https://www.cruzverde.cl";

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function searchCruzVerde(query: string): Promise<ScrapedProduct[]> {
  try {
    const params = new URLSearchParams({
      q: query, count: "10",
      expand: "prices,availability",
      client_id: CID,
    });
    const res = await fetch(`${API}?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "x-dw-client-id": CID,
        "Referer": `${BASE}/`,
      },
    });
    const data = await res.json();
    return (data.hits ?? []).flatMap((hit: Record<string, unknown>) => {
      const price = hit.price as number | null;
      if (!price) return [];
      const id = String(hit.product_id ?? "");
      const name = String(hit.product_name ?? query);
      return [{
        name,
        price: Number(price),
        onlinePrice: null,
        cmrPrice: null,
        hasStock: Boolean(hit.orderable ?? true),
        hasOnlineDelivery: true,
        onlineUrl: id ? `${BASE}/${toSlug(name)}/${id}.html` : `${BASE}/search?q=${encodeURIComponent(name)}`,
        laboratory: null,
        isBioequivalent: false,
      }];
    });
  } catch {
    return [];
  }
}
