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
// Sin embargo, el Monitor API en producción (Vercel) sigue viendo
// `fulfilled` con 0 resultados para EasyFarma (run #563, 2026-08-15+),
// mientras las otras 8 farmacias funcionan. Esto indica que la petición
// server-to-server desde la infraestructura de Vercel recibe algo distinto
// a lo que ve un navegador o una petición local — ver `probeEasyFarma()`
// más abajo, un diagnóstico temporal y seguro (sin cookies/tokens/HTML
// completo en su salida) para determinar exactamente qué pasa, gateado por
// el mismo mecanismo `debug=1` + `API_SECRET_KEY` que ya protege
// GET /api/search?debug=1.
const BASE = "https://nuevo.easyfarma.cl";
const SEARCH_URL = `${BASE}/`;

const DIRECT_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

// Cabeceras adicionales "de navegador" para la variante browser_headers del
// diagnóstico — no se usan en el cliente real (searchEasyFarma), solo en el
// probe, para comparar si su ausencia cambia la respuesta.
const EXTRA_BROWSER_HEADERS: Record<string, string> = {
  "Accept-Language": "es-CL,es;q=0.9",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
  "Upgrade-Insecure-Requests": "1",
  Referer: `${BASE}/`,
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
  // Buscador nativo de PrestaShop (módulo leoproductsearch). Confirmado
  // localmente que NO requiere warm-up de sesión/cookie — ver el
  // encabezado del archivo sobre por qué esto está bajo investigación en
  // producción (probeEasyFarma más abajo).
  const res = await fetchWithTimeout(buildSearchUrl(query), { headers: DIRECT_HEADERS });
  if (!res.ok) throw new Error(`EasyFarma HTTP ${res.status}`);
  const html = await res.text();
  return parseEasyFarmaResponse(html);
}

// ─────────────────────────────────────────────────────────────────────────
// Diagnóstico temporal — probeEasyFarma()
//
// Objetivo: determinar qué respuesta HTTP recibe realmente la petición
// server-to-server desde Vercel al buscar en EasyFarma, ya que el parser
// funciona correctamente contra HTML capturado en pruebas locales/navegador
// pero producción sigue viendo 0 resultados.
//
// Reglas de seguridad de este diagnóstico (no negociables):
//   - NUNCA se devuelve/loguea el HTML completo de la respuesta.
//   - NUNCA se devuelve/loguea el valor de ninguna cookie (solo un booleano
//     de si se encontró y reenvió una).
//   - NUNCA se devuelve/loguea ningún token ni header sensible.
//   - El título HTML se sanitiza (se recorta y se ofuscan secuencias
//     hexadecimales largas, por si acaso).
//   - Solo es alcanzable a través del mismo gate que ya protege
//     GET /api/search?debug=1 (isDebugAuthorized() + API_SECRET_KEY) más
//     un flag explícito adicional (?easyfarmaProbe=1) — no se activa nunca
//     como parte de una búsqueda normal ni de la llamada habitual del
//     Monitor API (que solo usa &debug=1, sin este flag).
// ─────────────────────────────────────────────────────────────────────────

export type EasyFarmaProbeVariant = "direct" | "warmup_cookie" | "browser_headers";

export interface EasyFarmaProbeResult {
  variant: EasyFarmaProbeVariant;
  requestedUrl: string;
  finalUrl: string | null;
  redirected: boolean;
  status: number | null;
  contentType: string | null;
  contentLength: number | null;
  productMiniatureCount: number;
  containsHay: boolean;
  containsProductMiniature: boolean;
  containsCaptcha: boolean;
  containsCloudflare: boolean;
  containsAccessDenied: boolean;
  containsForbidden: boolean;
  containsLeoproductsearch: boolean;
  titleSanitized: string | null;
  totalMs: number;
  usedCookieFromHome: boolean | null;
  error: string | null;
}

function sanitizeTitle(raw: string): string {
  const stripped = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  // Por si el título llegara a incluir algo con forma de token largo (no se
  // espera, pero es una segunda capa de seguridad para este diagnóstico).
  const noLongTokens = stripped.replace(/[a-f0-9]{20,}/gi, "[oculto]");
  return noLongTokens.slice(0, 160);
}

function analyzeHtml(html: string): Pick<
  EasyFarmaProbeResult,
  | "productMiniatureCount"
  | "containsHay"
  | "containsProductMiniature"
  | "containsCaptcha"
  | "containsCloudflare"
  | "containsAccessDenied"
  | "containsForbidden"
  | "containsLeoproductsearch"
  | "titleSanitized"
> {
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return {
    productMiniatureCount: (html.match(/<article[^>]+class="[^"]*product-miniature/g) || []).length,
    containsHay: /Hay\s+\d+\s+productos?/i.test(html),
    containsProductMiniature: html.includes("product-miniature"),
    containsCaptcha: /captcha/i.test(html),
    containsCloudflare: /cloudflare/i.test(html),
    containsAccessDenied: /access denied/i.test(html),
    containsForbidden: /forbidden/i.test(html),
    containsLeoproductsearch: /leoproductsearch/i.test(html),
    titleSanitized: titleM ? sanitizeTitle(titleM[1]) : null,
  };
}

async function probeOnce(
  variant: EasyFarmaProbeVariant,
  url: string,
  headers: Record<string, string>,
  usedCookieFromHome: boolean | null
): Promise<EasyFarmaProbeResult> {
  const startedAt = Date.now();
  try {
    const res = await fetchWithTimeout(url, { headers });
    const html = await res.text();
    const contentLengthHeader = res.headers.get("content-length");
    const analysis = analyzeHtml(html);
    return {
      variant,
      requestedUrl: url,
      finalUrl: res.url || null,
      redirected: res.redirected,
      status: res.status,
      contentType: res.headers.get("content-type"),
      contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : html.length,
      ...analysis,
      totalMs: Date.now() - startedAt,
      usedCookieFromHome,
      error: null,
    };
  } catch (err) {
    return {
      variant,
      requestedUrl: url,
      finalUrl: null,
      redirected: false,
      status: null,
      contentType: null,
      contentLength: null,
      productMiniatureCount: 0,
      containsHay: false,
      containsProductMiniature: false,
      containsCaptcha: false,
      containsCloudflare: false,
      containsAccessDenied: false,
      containsForbidden: false,
      containsLeoproductsearch: false,
      titleSanitized: null,
      totalMs: Date.now() - startedAt,
      usedCookieFromHome,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Ejecuta 3 variantes de la búsqueda contra EasyFarma para comparar qué ve
 * exactamente el entorno donde corre este código (Vercel en producción,
 * o local si se invoca desde ahí):
 *
 *   1. direct         — la misma petición que usa searchEasyFarma() hoy.
 *   2. warmup_cookie   — GET a la home primero; si responde Set-Cookie, se
 *                        reenvía esa cookie en la búsqueda posterior.
 *   3. browser_headers — la búsqueda directa, pero con cabeceras adicionales
 *                        de navegador (Accept-Language, Sec-Fetch-*, etc.)
 *                        que el cliente actual no envía.
 *
 * No modifica el comportamiento de searchEasyFarma() ni de ningún otro
 * cliente — es una función aparte, invocada solo bajo el gate de
 * diagnóstico descrito arriba.
 */
export async function probeEasyFarma(query: string): Promise<EasyFarmaProbeResult[]> {
  const searchUrl = buildSearchUrl(query);
  const results: EasyFarmaProbeResult[] = [];

  // 1. Directa — mismos headers que usa searchEasyFarma() en producción.
  results.push(await probeOnce("direct", searchUrl, DIRECT_HEADERS, null));

  // 2. Warm-up: GET a la home, capturar Set-Cookie (si existe) y reenviarlo.
  let cookieHeader: string | null = null;
  try {
    const homeRes = await fetchWithTimeout(BASE, { headers: DIRECT_HEADERS });
    const setCookies =
      typeof homeRes.headers.getSetCookie === "function" ? homeRes.headers.getSetCookie() : [];
    if (setCookies.length > 0) {
      cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
    } else {
      const single = homeRes.headers.get("set-cookie");
      if (single) cookieHeader = single.split(";")[0];
    }
  } catch {
    // Si el warm-up falla, se registra igual la variante con
    // usedCookieFromHome: false — no se interrumpe el diagnóstico completo.
  }
  const warmupHeaders: Record<string, string> = cookieHeader
    ? { ...DIRECT_HEADERS, Cookie: cookieHeader }
    : DIRECT_HEADERS;
  results.push(await probeOnce("warmup_cookie", searchUrl, warmupHeaders, cookieHeader !== null));

  // 3. Cabeceras de navegador adicionales, sin cookie.
  results.push(
    await probeOnce("browser_headers", searchUrl, { ...DIRECT_HEADERS, ...EXTRA_BROWSER_HEADERS }, null)
  );

  return results;
}
