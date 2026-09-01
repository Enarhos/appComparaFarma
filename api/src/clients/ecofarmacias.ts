import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";
import { positiveBioSignal } from "../lib/bioequivalence.js";

const BASE = "https://www.ecofarmacias.cl";

interface WooPrice {
  price: string;
  regular_price: string;
  sale_price: string;
}

interface WooImage {
  src: string;
}

interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

interface WooProduct {
  name: string;
  permalink: string;
  prices: WooPrice;
  is_in_stock: boolean;
  images: WooImage[];
  categories: WooCategory[];
  on_sale: boolean;
}

export function parseEcoFarmaciasResponse(products: WooProduct[]): ScrapedProduct[] {
  return (products ?? []).flatMap((p) => {
    const price = parseInt(p.prices?.price ?? "0", 10);
    if (!price || price <= 0) return [];

    // BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): la categoría
    // `medicamentos-bioequivalentes` es evidencia POSITIVA explícita — es una
    // clasificación deliberada del catálogo de EcoFarmacias. Su ausencia NO es
    // evidencia negativa: la taxonomía es curada a mano y resulta inconsistente
    // entre productos equivalentes (auditado en la fuente real, 2026-08-30:
    // "Dropol Paracetamol 1gr x 20" está en la categoría y "Paracetamol 1gr x
    // 20 (Hospifarma)" no; "Kitadol paracetamol 500mg x24 (LCh)" tampoco,
    // aunque Salcobrand lo publica con el sello "(B)"). Ausencia ⇒ `null`.
    const isBioequivalent = positiveBioSignal(
      (p.categories ?? []).some(
        (c) => c?.slug?.includes("bioequivalente") || c?.name?.toLowerCase().includes("bioequivalente")
      )
    );

    return [{
      name: p.name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: p.is_in_stock ?? false,
      hasOnlineDelivery: true,
      onlineUrl: p.permalink ?? null,
      imageUrl: p.images?.[0]?.src ?? null,
      // CF-DATA-001 (2026-08-31): WooCommerce expone `brands` y `attributes`,
      // pero en la fuente real (9 búsquedas, 160 productos) ambos vienen
      // VACÍOS en el 100 % de los casos — no hay dato estructurado que leer.
      // EcoFarmacias escribe el laboratorio dentro del nombre y al final
      // ("… 100ml **SEVEN PHARMA** DESCUENTO", "… (Hospifarma)"), que es
      // justamente la posición donde NO se puede confundir con la marca; no se
      // extrae de ahí para no publicar un fabricante inferido de texto libre.
      brand: null,
      manufacturer: null,
      isBioequivalent,
    }];
  });
}

export async function searchEcoFarmacias(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({ search: query, per_page: "20" });
  const res = await fetchWithTimeout(
    `${BASE}/wp-json/wc/store/v1/products?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`EcoFarmacias HTTP ${res.status}`);
  const raw = await res.json();
  const products = Array.isArray(raw) ? raw as WooProduct[] : [];
  return parseEcoFarmaciasResponse(products);
}
