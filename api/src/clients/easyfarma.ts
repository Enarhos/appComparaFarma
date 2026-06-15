import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://www.easyfarma.cl";
const SEARCH_URL = `${BASE}/resultado-busqueda`;

function parsePrice(raw: string): number | null {
  const m = raw.match(/\$([\d.]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/\./g, ""), 10) || null;
}

export function parseEasyFarmaResponse(html: string): ScrapedProduct[] {
  const results: ScrapedProduct[] = [];
  const blocks = html.split(/(?=<div[^>]+class="card product-card)/);

  for (const block of blocks) {
    if (!block.includes("product-title")) continue;

    // Name
    const nameM = block.match(/class="product-title[^"]*">\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/);
    if (!nameM) continue;
    const name = nameM[1].trim();
    if (!name) continue;

    // Product URL (from card image link)
    const urlM = block.match(/class="card-img-top[^"]*"\s+href="([^"]+)"/);
    const onlineUrl = urlM ? `${BASE}/${urlM[1].replace(/^\//, "")}` : null;

    // Image (lazy-loaded via data-src)
    const imgM = block.match(/data-src="(https:\/\/res\.cloudinary\.com\/[^"]+)"/);
    const imageUrl = imgM ? imgM[1] : null;

    // Normal price — inside text-muted span: "Normal  $690"
    const normalM = block.match(/class="text-muted">[^$]*\$([\d.]+)/);
    if (!normalM) continue;
    const price = parseInt(normalM[1].replace(/\./g, ""), 10);
    if (!price || price <= 0) continue;

    // Plus price — inside the d-none product-price block
    const plusBlockM = block.match(/product-price d-none[\s\S]{0,300}/);
    let cmrPrice: number | null = null;
    if (plusBlockM) {
      const plusM = plusBlockM[0].match(/\$([\d.]+)/);
      if (plusM) {
        const parsed = parseInt(plusM[1].replace(/\./g, ""), 10);
        if (parsed > 0 && parsed < price) cmrPrice = parsed;
      }
    }

    results.push({
      name,
      price,
      onlinePrice: null,
      cmrPrice,
      sbpayPrice: null,
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl,
      imageUrl,
      laboratory: null,
      isBioequivalent: false,
    });
  }

  return results;
}

export async function searchEasyFarma(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ search: query });
  const res = await fetchWithTimeout(`${SEARCH_URL}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`EasyFarma HTTP ${res.status}`);
  const html = await res.text();
  return parseEasyFarmaResponse(html);
}
