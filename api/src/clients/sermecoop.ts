import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";
import { positiveBioSignal } from "../lib/bioequivalence.js";

const BASE = "https://www.farmaciasermecoop.cl";
const HOME = `${BASE}/index.php/web/index`;
const SEARCH_URL = `${BASE}/index.php/web/productos?temp=2`;

function clp(str: string): number | null {
  const raw = str.replace(/\./g, "").match(/\d+/);
  if (!raw) return null;
  const value = parseInt(raw[0], 10);
  return value > 100 ? value : null;
}

export function parseSermecoopHtml(html: string): ScrapedProduct[] {
  const results: ScrapedProduct[] = [];

  // Each product card ends with a "Ver más" link — use it as block delimiter
  const verMasRe = /href="(\/index\.php\/online\/detalleproducto\?p_=(\d+)[^"]*)"[^>]*>\s*Ver m.s/g;
  const anchors: Array<{ pid: string; href: string; index: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = verMasRe.exec(html)) !== null) {
    if (!anchors.some((a) => a.pid === m![2])) {
      anchors.push({ pid: m[2], href: m[1], index: m.index });
    }
  }

  for (let i = 0; i < anchors.length; i++) {
    // Block = from end of previous product's link to this product's "Ver más"
    const start = i === 0 ? 0 : anchors[i - 1].index + 200;
    const end = anchors[i].index + 200;
    const block = html.slice(start, end);

    // Price: $1.490 or $17.290
    const priceMatch = block.match(/\$([\d.]+)/);
    if (!priceMatch) continue;
    const price = clp(priceMatch[1]);
    if (!price) continue;

    // Brand name in h5 (the full "Drug Brand Dose X Qty" label)
    const h5Match = block.match(/<h5[^>]*>([\s\S]+?)<\/h5>/i);
    if (!h5Match) continue;
    const name = h5Match[1].replace(/<[^>]+>/g, "").trim();
    if (!name) continue;

    // Stock
    const hasStock = !block.includes("Agotado") && !block.includes("No Disponible");

    // Image
    const imgMatch = block.match(/src="(\/themes\/fscoop\/images\/medicamentos\/[^"]+)"/);
    const imageUrl = imgMatch ? `${BASE}${imgMatch[1]}` : null;

    // Bioequivalent flag — BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): el
    // badge `<div class="label-top3"><img src=".../bioeq1.png">` es evidencia
    // POSITIVA por producto (verificado en el HTML real: aparece dentro de la
    // tarjeta, no en un contenedor global del theme). Su ausencia no es una
    // afirmación de Sermecoop: no existe ningún marcador de "no
    // bioequivalente". Ausencia ⇒ `null`.
    const isBioequivalent = positiveBioSignal(block.includes("bioeq1.png"));

    results.push({
      name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock,
      hasOnlineDelivery: true,
      onlineUrl: `${BASE}${anchors[i].href}`,
      imageUrl,
      // CF-DATA-001 (2026-08-31): la tarjeta HTML no expone marca ni
      // fabricante (9 búsquedas, 40 productos). Sermecoop sí usa una grafía
      // muy regular que el dominio aprovecha —marca primero y molécula entre
      // paréntesis: "**Muxol** (ambroxol) 15mg/5ml Jarabe 100ml"—, y por eso
      // `brandFromName()` NO descarta el contenido entre paréntesis del
      // segmento descriptivo, a diferencia de `commercialVariantKey()`.
      brand: null,
      manufacturer: null,
      isBioequivalent,
    });
  }

  return results;
}

export async function searchSermecoop(query: string): Promise<ScrapedProduct[]> {
  // Step 1: GET homepage to acquire session cookie + CSRF token
  const homeRes = await fetchWithTimeout(HOME, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
    },
  });

  const setCookie = homeRes.headers.get("set-cookie") ?? "";
  const sessionMatch = setCookie.match(/PHPSESSID=[^;,\s]+/);
  const sessionCookie = sessionMatch?.[0] ?? "";

  const homeHtml = await homeRes.text();
  const tokenMatch =
    homeHtml.match(/name="fscoopTK_"[^>]*value="([^"]+)"/) ??
    homeHtml.match(/value="([^"]+)"[^>]*name="fscoopTK_"/);
  const token = tokenMatch?.[1] ?? "";

  if (!token) throw new Error("Sermecoop: CSRF token not found in page");

  // Step 2: POST search form
  const body = new URLSearchParams({
    "fscoopTK_": token,
    "search_": query,
    "search2_": "",
  });

  const res = await fetchWithTimeout(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": HOME,
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Sermecoop HTTP ${res.status}`);
  const html = await res.text();
  return parseSermecoopHtml(html);
}
