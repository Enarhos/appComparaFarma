import type { ScrapedProduct } from "./types";

const BASE   = "https://www.farmaciasahumada.cl";
const SEARCH = `${BASE}/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show`;

function clp(str: string): number | null {
  const m = str.replace(/\./g, "").replace(",", ".").match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n > 100 ? n : null;
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export async function searchAhumada(query: string): Promise<ScrapedProduct[]> {
  try {
    const params = new URLSearchParams({ q: query, start: "0", sz: "10" });
    const res = await fetch(`${SEARCH}?${params}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `${BASE}/`,
        "Accept": "text/html",
      },
    });
    const html = await res.text();
    const results: ScrapedProduct[] = [];
    const seen = new Set<string>();

    // Dividir en tiles por el div wrapper del producto (data-pid solo en el tag raíz del tile)
    const tileRe = /class="product product-tile-wrapper[^"]*"[^>]*data-pid="(\d+)"([\s\S]+?)(?=class="product product-tile-wrapper|<div class="col-12 grid-footer|<\/body>)/g;
    let tile: RegExpExecArray | null;

    while ((tile = tileRe.exec(html)) !== null) {
      const [, pid, block] = tile;
      if (seen.has(pid)) continue;
      seen.add(pid);

      // Nombre y URL
      const linkM = block.match(/class="pdp-link"[\s\S]*?href="([^"]+)"[^>]*>\s*([^<]+)</);
      if (!linkM) continue;
      const href = linkM[1];
      const name = decodeHtml(linkM[2].trim());
      if (!name) continue;

      // Precio actual: dentro de promotion-badge-container, antes del badge img
      // Puede ser texto directo "$731" o dentro de <span>$7.049</span>
      let webPrice: number | null = null;
      const badgeM = block.match(/class="promotion-badge-container[^"]*"[^>]*>([\s\S]{0,300}?)(?=<img\s+class="promotion-badge|<\/div>)/);
      if (badgeM) {
        const priceM = badgeM[1].match(/\$([\d.]+)/);
        if (priceM) webPrice = clp(priceM[1]);
      }

      // Precio CMR: content="XXXXX" dentro de class="cmr-price-display"
      let cmrPrice: number | null = null;
      const cmrBlockM = block.match(/class="cmr-price-display"([\s\S]{0,400}?)(?=<div class="|<\/div>\s*<\/div>)/);
      if (cmrBlockM) {
        const contentM = cmrBlockM[1].match(/content="(\d+)"/);
        if (contentM) cmrPrice = parseInt(contentM[1], 10) || null;
      }

      // Precio normal/presencial: "Price reduced from $XX.XXX"
      let normalPrice: number | null = null;
      const reducedM = block.match(/[Pp]rice\s+reduced\s+from\s+\$([\d.]+)/);
      if (reducedM) normalPrice = clp(reducedM[1]);

      // Fallback: "$XX.XXX x NN mL" que aparece antes del nombre (tile-body superior)
      if (!normalPrice) {
        const beforeLink = block.slice(0, block.indexOf(linkM[0]));
        const tileTopM = beforeLink.match(/\$\s*([\d.]+)\s*x\s*\d/);
        if (tileTopM) normalPrice = clp(tileTopM[1]);
      }

      // Si solo hay un precio, es el presencial
      const price = normalPrice ?? webPrice;
      if (!price) continue;

      const onlinePrice  = webPrice  && webPrice  < price ? webPrice  : null;
      const finalCmrPrice = cmrPrice && cmrPrice  < price ? cmrPrice  : null;

      const isBio = block.includes("bioequivalent-badge");
      const url   = href.startsWith("http") ? href : `${BASE}${href}`;

      results.push({
        name,
        price,
        onlinePrice,
        cmrPrice: finalCmrPrice,
        hasStock: true,
        hasOnlineDelivery: true,
        onlineUrl: url,
        laboratory: null,
        isBioequivalent: isBio,
      });
    }

    return results;
  } catch {
    return [];
  }
}
