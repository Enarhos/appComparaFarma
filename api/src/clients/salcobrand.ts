import type { ScrapedProduct } from "../lib/types.js";
import { fetchWithTimeout } from "../lib/timeout.js";

const APP_ID = process.env.ALGOLIA_APP_ID ?? "";
const API_KEY = process.env.ALGOLIA_API_KEY ?? "";
const INDEX = "sb_variant_production";
const BASE = "https://salcobrand.cl";

export function parseSalcobrandResponse(
  data: { hits?: Record<string, unknown>[] },
  query: string
): ScrapedProduct[] {
  return (data.hits ?? []).flatMap((hit) => {
    const normal = hit.normal_price as number | null;
    if (!normal) return [];

    const storePrice = Number(normal);
    const direct = hit.direct_discount as string | null;
    const directNum = direct ? parseFloat(direct) : null;
    const onlinePrice = directNum && directNum < storePrice ? directNum : null;
    const cmrRaw = hit.cmr_price as number | null;
    const cmrPrice = cmrRaw ? Number(cmrRaw) : null;
    const sbpayRaw = hit.direct_discount_sbpay as number | string | null;
    const sbpayNum = sbpayRaw ? parseFloat(String(sbpayRaw)) : null;
    const sbpayPrice = sbpayNum && sbpayNum < storePrice ? sbpayNum : null;
    const name = String(hit.name ?? query);
    const slug = (hit.slug as string) ?? "";
    const sku = (hit.sku as string) ?? "";

    let onlineUrl: string | null = null;
    if (slug && sku) onlineUrl = `${BASE}/products/${slug}?default_sku=${sku}`;
    else if (slug) onlineUrl = `${BASE}/products/${slug}`;

    const imageUrl = (hit.catalog_image_url as string) ?? (hit.thumbnail_image_url as string) ?? null;

    return [{
      name,
      price: storePrice,
      onlinePrice,
      cmrPrice,
      sbpayPrice,
      hasStock: Boolean(hit.has_stock ?? true),
      hasOnlineDelivery: Boolean(hit.package_delivery ?? true),
      onlineUrl,
      imageUrl,
      laboratory: (hit.brand as string) ?? null,
      // BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30): Salcobrand NO expone si un
      // producto ES bioequivalente. El campo que se leía hasta ahora,
      // `bioequivalent_filter.has_bioequivalent`, es una FACETA DE BÚSQUEDA que
      // indica si ESE producto TIENE bioequivalentes disponibles — otra cosa, y
      // en la práctica casi la inversa.
      //
      // Evidencia directa del índice Algolia real (`sb_variant_production`,
      // 2026-08-30). El propio campo trae su etiqueta en castellano:
      //   "Lipitor (R) Atorvastatina 20mg 30 Comp."
      //       -> {has_bioequivalent: true,  label: "Bioequivalentes"}
      //   "Cozaar (R) Losartán 50mg 30 Comp."
      //       -> {has_bioequivalent: true,  label: "Bioequivalentes"}
      //   "Omeprazol (B) 20mg 30 Cápsulas Recubiertas"
      //       -> {has_bioequivalent: false, label: "Sin Bioequivalentes"}
      //   "Tapsin Forte (B) Paracetamol 20 Comp. Recubiertos"
      //       -> {has_bioequivalent: false, label: "Sin Bioequivalentes"}
      // Lipitor y Cozaar son los productos REFERENTES —marcados "(R)" por la
      // propia Salcobrand— y por definición no son bioequivalentes de nadie:
      // son la referencia contra la que se mide la bioequivalencia. Los que sí
      // llevan el sello "(B)" del ISP en su nombre salían marcados `false`.
      // Medido en producción (10 búsquedas, 174 ofertas de Salcobrand): 7 de 7
      // productos "(R)" se publicaban como "🌿 Bioequivalente", y 34 de 92
      // ofertas con `false` llevaban "(B)" en su propio nombre.
      //
      // No es una ausencia de dato que se colapsa a `false` (el defecto del
      // resto de los adaptadores): es una lectura semánticamente equivocada que
      // genera falsos positivos Y falsos negativos. Se deja de leer.
      //
      // El sello "(B)" del nombre y `drug_patent_type_filter`
      // ("Genérico"/"Marca") son señales candidatas para una fase futura, pero
      // extraer bioequivalencia de texto libre es una capacidad nueva que
      // necesita decisión de Product — ver FOLLOW_UP del informe. Hasta
      // entonces, Salcobrand no informa bioequivalencia.
      isBioequivalent: null,
    }];
  });
}

export async function searchSalcobrand(query: string): Promise<ScrapedProduct[]> {
  const res = await fetchWithTimeout(
    `https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`,
    {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": APP_ID,
        "X-Algolia-API-Key": API_KEY,
        "Referer": `${BASE}/`,
        "Origin": BASE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, hitsPerPage: 24 }),
    }
  );

  if (!res.ok) throw new Error(`Salcobrand HTTP ${res.status}`);
  const data = await res.json() as { hits?: Record<string, unknown>[] };
  return parseSalcobrandResponse(data, query);
}
