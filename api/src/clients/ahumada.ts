import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://www.farmaciasahumada.cl";
const SEARCH = `${BASE}/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show`;

function clp(str: string): number | null {
  const match = str.replace(/\./g, "").replace(",", ".").match(/\d+/);
  if (!match) return null;
  const value = parseInt(match[0], 10);
  return value > 100 ? value : null;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&aacute;/g, "á").replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á").replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í").replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú").replace(/&Ntilde;/g, "Ñ")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

export function parseAhumadaHtml(html: string): ScrapedProduct[] {
  const results: ScrapedProduct[] = [];
  const seen = new Set<string>();
  const tileRe = /class="product product-tile-wrapper[^"]*"[^>]*data-pid="(\d+)"([\s\S]+?)(?=class="product product-tile-wrapper|<div class="col-12 grid-footer|<\/body>)/g;
  let tile: RegExpExecArray | null;

  while ((tile = tileRe.exec(html)) !== null) {
    const [, pid, block] = tile;
    if (seen.has(pid)) continue;
    seen.add(pid);

    const linkMatch = block.match(/class="pdp-link"[\s\S]*?href="([^"]+)"[^>]*>\s*([^<]+)</);
    if (!linkMatch) continue;

    const href = linkMatch[1];
    const name = decodeHtml(linkMatch[2].trim());
    if (!name) continue;

    const isCmr = block.includes("badge_30x40_cmr_falabella");
    let badgePrice: number | null = null;
    const badgeMatch = block.match(/class="promotion-badge-container[^"]*"[^>]*>([\s\S]{0,300}?)(?=<img\s+class="promotion-badge|<\/div>)/);
    if (badgeMatch) {
      const priceMatch = badgeMatch[1].match(/\$([\d.]+)/);
      if (priceMatch) badgePrice = clp(priceMatch[1]);
    }

    let price: number | null;
    let cmrPrice: number | null = null;

    if (isCmr && badgePrice) {
      const contentVals = [...block.matchAll(/content="(\d+)"/g)]
        .map((m) => parseInt(m[1], 10))
        .filter((value) => value > 1000);
      const saleCandidates = contentVals.filter((value) => value > badgePrice);
      const salePrice = saleCandidates.length ? Math.min(...saleCandidates) : null;
      price = salePrice ?? badgePrice;
      cmrPrice = salePrice && badgePrice < salePrice ? badgePrice : null;
    } else {
      price = badgePrice;
    }

    if (!price) continue;

    const imageMatch = block.match(/<img[^>]+class="[^"]*tile-image[^"]*"[^>]*src="([^"]+)"|<img[^>]+src="([^"]+)"[^>]*class="[^"]*tile-image[^"]*"/);
    const imageUrl = imageMatch ? (imageMatch[1] ?? imageMatch[2] ?? null) : null;

    results.push({
      name,
      price,
      onlinePrice: null,
      cmrPrice,
      sbpayPrice: null,
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl: href.startsWith("http") ? href : `${BASE}${href}`,
      imageUrl,
      laboratory: null,
      isBioequivalent: block.includes("bioequivalent-badge"),
    });
  }

  return results;
}

export async function searchAhumada(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ q: query, start: "0", sz: "10" });
  const res = await fetchWithTimeout(`${SEARCH}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": `${BASE}/`,
      "Accept": "text/html",
    },
  });

  const html = await res.text();
  return parseAhumadaHtml(html);
}
