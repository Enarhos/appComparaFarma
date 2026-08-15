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
// ibuprofeno, losartan y omeprazol) — desde navegador y curl locales.
//
// Incidente cerrado (Monitor API #564: SUCCESS). Un diagnóstico temporal
// (`probeEasyFarma()`, gateado por debug=1&easyfarmaProbe=1) confirmó que
// Vercel sí recibía el HTML real con los 12 productos esperados — la causa
// raíz de los 0 resultados no era de red/cookies/bloqueo, sino que el
// parser de precio no soportaba la microdata anidada real (ver el
// comentario de parsePriceFromContent() más abajo). Ese diagnóstico ya se
// retiró del código productivo una vez confirmado el fix; el detalle
// completo de la investigación queda en el historial de git.
const BASE = "https://nuevo.easyfarma.cl";
const SEARCH_URL = `${BASE}/`;

const DIRECT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Precio — leído desde el atributo `content` de la microdata schema.org
// (`<span itemprop="price" content="690">`), NO del texto visible "$ 690".
//
// Investigación en producción (2026-08-15+) confirmó la causa raíz de
// FINAL_PRODUCTS=0 en el Monitor API: el HTML real anida el texto visible
// dos niveles más adentro de lo que asumía el parser anterior —
//   <span class="price" itemprop="offers" ...>
//     <span itemprop="priceCurrency" content="CLP"></span>
//     <span itemprop="price" content="690">$ 690</span>
//   </span>
// — así que un regex que buscaba "$" pegado (solo con espacios) después de
// class="price" nunca hacía match contra ningún producto real, aunque sí
// contra el fixture de tests (que estaba simplificado y no reproducía el
// anidado real — ver easyfarma.test.ts).
//
// Leer `content` es además más robusto que parsear el texto visible: viene
// como número limpio sin símbolo de moneda ni separador de miles. OJO: el
// punto en `content` es un separador DECIMAL (p. ej. "690.00" = $690), lo
// opuesto al texto visible del sitio anterior donde el punto era separador
// de MILES ("$1.490" = $1.490) — por eso ya no se reutiliza la lógica de
// parseo de precio de otros clientes/versiones anteriores para este campo.
function parsePriceFromContent(raw: string): number | null {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
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

    // Precio — se aísla primero la etiqueta completa que tiene
    // itemprop="price" (sin asumir que `content` viene antes o después de
    // `itemprop` en el atributo) y luego se extrae `content="..."` de esa
    // etiqueta. Si un producto no expone precio (p. ej. "Consultar
    // disponibilidad", sin ningún itemprop="price"), se excluye sin
    // inventar un valor, igual que el cliente anterior.
    const priceTagM = block.match(/<[^>]*\bitemprop="price"[^>]*>/);
    if (!priceTagM) continue;
    const contentM = priceTagM[0].match(/\bcontent="([\d.]+)"/);
    if (!contentM) continue;
    const price = parsePriceFromContent(contentM[1]);
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

function buildSearchUrl(query: string): string {
  const params = new URLSearchParams({
    fc: "module",
    module: "leoproductsearch",
    controller: "productsearch",
    search_query: query,
  });
  return `${SEARCH_URL}?${params}`;
}

export async function searchEasyFarma(query: string): Promise<ScrapedProduct[]> {
  // Buscador nativo de PrestaShop (módulo leoproductsearch). Confirmado que
  // NO requiere warm-up de sesión/cookie: una petición GET aislada, sin
  // cookies previas, devuelve la grilla de resultados completa.
  const res = await fetchWithTimeout(buildSearchUrl(query), { headers: DIRECT_HEADERS });
  if (!res.ok) throw new Error(`EasyFarma HTTP ${res.status}`);
  const html = await res.text();
  return parseEasyFarmaResponse(html);
}
