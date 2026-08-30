import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const BASE = "https://farmex.cl";

interface ShopifyProduct {
  title: string;
  price: string;           // CLP string, ej: "456"
  compare_at_price: string | null;
  vendor: string;
  available: boolean;
  url: string;
  image: string | null;
}

interface SuggestResponse {
  resources: {
    results: {
      products: ShopifyProduct[];
    };
  };
}

type VendorClass = "public" | "fonasa" | "pluxee" | "other";

function classifyVendor(vendor: string): VendorClass {
  const v = vendor.toLowerCase();
  if (v.includes("fonasa")) return "fonasa";
  if (v.includes("pluxee")) return "pluxee";
  if (vendor.startsWith("Farmex-")) return "other";
  return "public";
}

export function parseFarmexResponse(products: ShopifyProduct[]): ScrapedProduct[] {
  // Agrupar listings del mismo producto por título normalizado
  const groups = new Map<string, ShopifyProduct[]>();
  for (const p of products ?? []) {
    const key = p.title.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const results: ScrapedProduct[] = [];

  for (const listings of groups.values()) {
    const byClass: Record<VendorClass, ShopifyProduct[]> = {
      public: [], fonasa: [], pluxee: [], other: [],
    };
    for (const l of listings) {
      byClass[classifyVendor(l.vendor)].push(l);
    }

    // Precio público: preferir listing sin prefijo Farmex, fallback a "other"
    const publicCandidates = byClass.public.length ? byClass.public : byClass.other;
    if (!publicCandidates.length && !byClass.fonasa.length) continue;

    const primary = publicCandidates[0] ?? byClass.fonasa[0];
    const storePrice = parseInt(primary.price, 10);
    if (!storePrice || storePrice <= 0) continue;

    const fonasaListing = byClass.fonasa[0] ?? null;
    const fonasaPrice = fonasaListing ? parseInt(fonasaListing.price, 10) : null;

    // Laboratorio: vendor del listing público si no es Farmex-prefixed
    const lab = byClass.public[0]?.vendor ?? null;

    results.push({
      name: primary.title,
      price: storePrice,
      onlinePrice: null,
      cmrPrice: fonasaPrice && fonasaPrice < storePrice ? fonasaPrice : null,
      sbpayPrice: null,
      hasStock: primary.available,
      hasOnlineDelivery: true,
      onlineUrl: `${BASE}${primary.url}`,
      imageUrl: primary.image ?? null,
      laboratory: lab,
      // BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): Farmex no entrega el dato.
      // El `false` anterior no era "Farmex confirma que no es bioequivalente":
      // era un placeholder de dato no implementado, publicado como afirmación
      // en el 100% de sus ofertas (producción: 0 de 71 con `true`).
      // Auditado en la fuente real (`/search/suggest.json`, paracetamol): el
      // payload de Shopify expone `title`, `vendor`, `tags`, `type`, `body`,
      // `handle`, `url` — ninguno con información de bioequivalencia. La única
      // coincidencia textual de "bioequivalente" en toda la respuesta está en
      // el `handle`/`url` de UN producto ("paraceta-bioequivalente-
      // comprimidos-paracetamol"), un slug de comercio arbitrario que no es una
      // señal sistemática y no se usa como evidencia.
      isBioequivalent: null,
    });
  }

  return results;
}

export async function searchFarmex(query: string): Promise<ScrapedProduct[]> {
  const params = new URLSearchParams({
    q: query,
    "resources[type]": "product",
    "resources[limit]": "50",
  });
  const res = await fetchWithTimeout(
    `${BASE}/search/suggest.json?${params}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`Farmex HTTP ${res.status}`);
  const data = await res.json() as SuggestResponse;
  const products = data?.resources?.results?.products ?? [];
  return parseFarmexResponse(products);
}
