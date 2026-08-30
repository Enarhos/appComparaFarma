import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";
import { positiveBioSignal } from "../lib/bioequivalence.js";

const BASE = "https://farmacia.araucomed.com";

interface AraucoProduct {
  id_product: number;
  name: string;
  price_amount: number;
  manufacturer_name: string | null;
  url: string;
  description_short: string;
  active: number;
  cover: {
    bySize?: {
      home_default?: { url: string };
    };
  } | null;
}

interface SearchResponse {
  products: AraucoProduct[];
  // HTML crudo con la grilla de resultados — el único lugar donde AraucoMed
  // expone el stock real por producto (ver extractStockMap más abajo).
  rendered_products?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// El JSON de `?controller=search&ajax=1` NO trae ningún campo de inventario
// (ni `quantity` ni `available_for_order`) en el array `products` — el campo
// `active` solo indica si el producto está publicado en el catálogo, no si
// tiene stock. AraucoMed sigue publicando productos agotados con `active: 1`
// (caso real: "Medicasp 1% Shampoo 130ml", agotado en el sitio pero
// active=1 en el JSON). El stock real solo aparece renderizado como HTML
// dentro de `rendered_products`, marcado por producto vía
// `data-id-product="<id>"` en el <article> y una clase `out-of-stock` /
// `pst-bar-info-oos` cuando está agotado.
const ARTICLE_RE = /<article class="product-miniature js-product-miniature" data-id-product="(\d+)"/g;
const OUT_OF_STOCK_RE = /availability-list out-of-stock|pst-bar-info-oos/;

function extractStockMap(renderedProducts: string): Map<number, boolean> {
  const stockMap = new Map<number, boolean>();
  const matches = [...renderedProducts.matchAll(ARTICLE_RE)];
  matches.forEach((match, index) => {
    const id = Number(match[1]);
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? renderedProducts.length;
    const segment = renderedProducts.slice(start, end);
    stockMap.set(id, !OUT_OF_STOCK_RE.test(segment));
  });
  return stockMap;
}

export function parseAraucoMedResponse(data: SearchResponse): ScrapedProduct[] {
  const stockMap = data.rendered_products ? extractStockMap(data.rendered_products) : new Map<number, boolean>();
  return (data.products ?? [])
    .filter(p => p.price_amount > 0 && p.active)
    .map(p => ({
      name: p.name,
      price: p.price_amount,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      // Fallback a `active` solo si no pudimos leer el HTML (ej. AraucoMed
      // cambia de theme y deja de traer `rendered_products`) — mismo
      // comportamiento que antes de este fix en ese caso extremo.
      hasStock: stockMap.get(p.id_product) ?? (p.active === 1),
      hasOnlineDelivery: true,
      onlineUrl: p.url ?? null,
      imageUrl: p.cover?.bySize?.home_default?.url ?? null,
      laboratory: p.manufacturer_name ?? null,
      // BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): buscar "bioequivalen" en
      // el nombre/descripción corta es evidencia POSITIVA débil pero honesta
      // (si AraucoMed lo escribe, lo está afirmando). Lo que NO es evidencia es
      // no encontrarlo: en la auditoría de la fuente real (omeprazol, 12
      // productos) el texto no lo menciona NUNCA, así que este detector produce
      // `false` para el 100% del catálogo (confirmado en producción: 0 de 169
      // ofertas con `true`). Eso era afirmar "no es bioequivalente" 169 veces
      // sin un solo dato. Ausencia ⇒ `null`.
      //
      // AraucoMed sí tiene una señal estructurada real —`category_name ===
      // "Bioequivalentes"`, presente en 5 de esos 12 productos— pero es la
      // categoría PRIMARIA, no una marca de bioequivalencia: el mismo Omeprazol
      // de Ascend aparece en "Bioequivalentes" en su presentación x60 y en
      // "Antiulcerosos" en la x30. Sirve como evidencia positiva, jamás como
      // negativa, y usarla es una capacidad nueva — ver FOLLOW_UP del informe.
      // (El sticker `bioequivalente-2026.png` de `rendered_products` NO sirve:
      // el theme lo emite en los 12 tiles, sea el producto bioequivalente o no
      // — es el mismo patrón de "contenedor siempre presente" que causó el
      // falso positivo masivo de Ahumada.)
      isBioequivalent: positiveBioSignal(
        /bioequivalen/i.test(p.name + " " + stripHtml(p.description_short))
      ),
    }));
}

export async function searchAraucoMed(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ controller: "search", s: query, ajax: "1" });
  const res = await fetchWithTimeout(`${BASE}/?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json",
    },
  });
  if (!res.ok) throw new Error(`AraucoMed HTTP ${res.status}`);
  const data = await res.json() as SearchResponse;
  return parseAraucoMedResponse(data);
}
