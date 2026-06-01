import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://farmacia.araucomed.com";

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á").replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

// Regex sobre el bloque <article> de cada producto PrestaShop
const articleRe  = /<article[^>]*product-miniature[^>]*>[\s\S]*?<\/article>/g;
const nameUrlRe  = /product-title[^>]*itemprop="name"[^>]*>\s*<a href="([^"]+)">([^<]+)<\/a>/;
const priceRe    = /itemprop="price"[^>]*content="(\d+)"|content="(\d+)"[^>]*itemprop="price"/;
const imageRe    = /src\s*=\s*"([^"]+home_default[^"]+)"/;
const outStockRe = /out_of_stock/;

export function parseAraucoMedResponse(html: string): ScrapedProduct[] {
  const results: ScrapedProduct[] = [];
  for (const match of html.matchAll(articleRe)) {
    const block = match[0];

    const priceM = priceRe.exec(block);
    if (!priceM) continue;
    const price = parseInt(priceM[1] ?? priceM[2], 10);
    if (!price || price <= 0) continue;

    const nameM = nameUrlRe.exec(block);
    if (!nameM) continue;

    const imageM = imageRe.exec(block);

    results.push({
      name: decodeHtml(nameM[2].trim()),
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: !outStockRe.test(block),
      hasOnlineDelivery: false,
      onlineUrl: nameM[1] ?? null,
      imageUrl: imageM ? imageM[1] : null,
      laboratory: null,
      isBioequivalent: false,
    });
  }
  return results;
}

export async function searchAraucoMed(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ controller: "search", s: query });
  const res = await fetchWithTimeout(`${BASE}/?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
    },
  });
  if (!res.ok) throw new Error(`AraucoMed HTTP ${res.status}`);
  const html = await res.text();
  return parseAraucoMedResponse(html);
}
