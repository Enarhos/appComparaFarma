import type { ScrapedProduct } from "@/lib/types";

const APP_ID  = "GM3RP06HJG";
const API_KEY = "0259fe250b3be4b1326eb85e47aa7d81";
const INDEX   = "sb_variant_production";
const BASE    = "https://salcobrand.cl";

export async function searchSalcobrand(
  query: string,
  signal?: AbortSignal
): Promise<ScrapedProduct[]> {
  const res = await fetch(
    `https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX}/query`,
    {
      method: "POST",
      signal,
      headers: {
        "X-Algolia-Application-Id": APP_ID,
        "X-Algolia-API-Key": API_KEY,
        "Referer": `${BASE}/`,
        "Origin": BASE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, hitsPerPage: 10 }),
    }
  );
  const data = await res.json() as { hits?: Record<string, unknown>[] };
  return (data.hits ?? []).flatMap((hit) => {
    const normal = hit.normal_price as number | null;
    if (!normal) return [];

    const storePrice = Number(normal);
    const direct     = hit.direct_discount as string | null;
    const directNum  = direct ? parseFloat(direct) : null;
    const onlinePrice = directNum && directNum < storePrice ? directNum : null;
    const cmrRaw     = hit.cmr_price as number | null;
    const cmrPrice   = cmrRaw ? Number(cmrRaw) : null;

    const name = String(hit.name ?? query);
    const slug = (hit.slug as string) ?? "";
    const sku  = (hit.sku  as string) ?? "";
    const bio  = (hit.bioequivalent_filter as Record<string, unknown>) ?? {};

    let onlineUrl: string | null = null;
    if (slug && sku) onlineUrl = `${BASE}/products/${slug}?default_sku=${sku}`;
    else if (slug)   onlineUrl = `${BASE}/products/${slug}`;

    const sbpayRaw    = hit.direct_discount_sbpay as number | string | null;
    const sbpayNum    = sbpayRaw ? parseFloat(String(sbpayRaw)) : null;
    const sbpayPrice  = sbpayNum && sbpayNum < storePrice ? sbpayNum : null;
    const imageUrl    = (hit.catalog_image_url as string) ?? (hit.thumbnail_image_url as string) ?? null;
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
      isBioequivalent: Boolean(bio.has_bioequivalent ?? false),
    }];
  });
}
