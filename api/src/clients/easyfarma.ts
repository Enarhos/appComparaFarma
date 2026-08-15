import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

// EasyFarma migró su sitio de www.easyfarma.cl (tema PrestaShop antiguo,
// tarjetas "card product-card") a nuevo.easyfarma.cl (tema "leo_medilazar",
// artículos "product-miniature"). El dominio anterior redirige a la home del
// sitio nuevo ignorando el parámetro de búsqueda — investigación completa en
// docs/operations (sesión 2026-08-15). El endpoint de abajo es el buscador
// nativo del módulo PrestaShop "leoproductsearch"; confirmado que responde
// con HTML server-side ya renderizado (sin necesitar JS) y SIN requerir
// cookie de sesión previa: una petición GET directa, sin cookies, devuelve
// resultados reales de forma consistente (verificado con paracetamol,
// ibuprofeno, losartan y omeprazol).
const BASE = "https://nuevo.easyfarma.cl";
const SEARCH_URL = `${BASE}/`;

function parsePrice(raw: string): number | null {
  // El sitio nuevo escribe el precio como "$ 690" (con espacio) o
  // "$ 12.490" — a diferencia del sitio anterior ("$690", sin espacio).
  const m = raw.match(/\$\s*([\d.]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/\./g, ""), 10) || null;
}

export function parseEasyFarmaResponse(html: string): ScrapedProduct[] {
  const results: ScrapedProduct[] = [];
  const blocks = html.split(/(?=<article[^>]+class="[^"]*product-miniature)/);

  for (const block of blocks) {
    if (!block.includes("product-title")) continue;

    // Nombre + URL — ambos vienen del mismo <a> dentro de
    // <h3 class="... product-title ...">. El orden de las clases en el
    // atributo no es estable (visto "h3 product-title" en producción), así
    // que no se asume un orden fijo.
    const nameM = block.match(
      /class="[^"]*product-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/
    );
    if (!nameM) continue;
    const onlineUrl = nameM[1];
    const name = nameM[2].trim();
    if (!name) continue;

    // Precio — <span class="price">$ 690</span>. Si un producto no expone
    // precio (p. ej. "Consultar disponibilidad"), se excluye sin inventar
    // un valor, igual que el cliente anterior.
    const priceM = block.match(/class="price"[^>]*>\s*\$\s*([\d.]+)/);
    if (!priceM) continue;
    const price = parsePrice(`$${priceM[1]}`);
    if (!price || price <= 0) continue;

    // Imagen — <img class="... img-fluid ..." src="...">. El sitio nuevo
    // sirve la imagen directamente en `src` (no hay lazy-load vía
    // `data-src` como en el sitio anterior). Si el producto no tiene
    // imagen ("Imagen no disponible"), no hay <img> que matchee y queda
    // null — no se inventa una URL.
    const imgTagM = block.match(/<img\b[^>]*class="[^"]*img-fluid[^"]*"[^>]*>/);
    let imageUrl: string | null = null;
    if (imgTagM) {
      const srcM = imgTagM[0].match(/\bsrc="([^"]+)"/);
      imageUrl = srcM ? srcM[1] : null;
    }

    // EasyFarma solo expone un precio de lista visible ("Normal" en el
    // sitio anterior, ahora simplemente el único ".price" del listado). No
    // hay canal online/CMR/SBPay distinto ni indicador de stock a nivel de
    // listado — mismo criterio que el cliente anterior: no se inventa
    // disponibilidad ni laboratorio que el HTML no expone.
    results.push({
      name,
      price,
      onlinePrice: null,
      cmrPrice: null,
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
  // Buscador nativo de PrestaShop (módulo leoproductsearch). Confirmado que
  // NO requiere warm-up de sesión/cookie: una petición GET aislada, sin
  // cookies previas, devuelve la grilla de resultados completa.
  const params = new URLSearchParams({
    fc: "module",
    module: "leoproductsearch",
    controller: "productsearch",
    search_query: query,
  });
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
