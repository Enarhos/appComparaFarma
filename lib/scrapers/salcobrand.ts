import type { ScrapedProduct } from "./types";

const APP_ID  = "GM3RP06HJG";
const API_KEY = "0259fe250b3be4b1326eb85e47aa7d81";
const INDEX   = "sb_variant_production";
const BASE    = "https://salcobrand.cl";

export async function searchSalcobrand(query: string): Promise<ScrapedProduct[]> {
  try {
    const res = await fetch(
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
        body: JSON.stringify({ query, hitsPerPage: 10 }),
      }
    );
    const data = await res.json();
    return (data.hits ?? []).flatMap((hit: Record<string, unknown>) => {
      const normal   = hit.normal_price      as number | null;
      const internet = hit.internet_price    as number | null;  // precio web
      const cmr      = hit.cmr_price         as number | null;  // precio tarjeta CMR
      const direct   = hit.direct_discount   as string | null;  // fallback descuento

      const storePrice = normal ? Number(normal) : null;
      if (!storePrice) return [];

      // Algolia solo expone normal_price y direct_discount.
      // CMR e internet solo están en la página de producto (requieren sesión).
      const directNum = direct ? parseFloat(direct) : null;
      const onlinePrice = directNum && directNum < storePrice ? directNum : null;

      // internet_price y cmr_price no están disponibles en el índice de búsqueda
      const cmrPrice = cmr ? Number(cmr) : null;

      const name = String(hit.name ?? query);
      const slug = (hit.slug as string) ?? "";
      const sku  = (hit.sku  as string) ?? "";
      const bio  = (hit.bioequivalent_filter as Record<string, unknown>) ?? {};
      const url  = slug && sku ? `${BASE}/products/${slug}?default_sku=${sku}` : (slug ? `${BASE}/products/${slug}` : null);

      return [{
        name,
        price: storePrice,
        onlinePrice,
        cmrPrice,
        hasStock: Boolean(hit.has_stock ?? true),
        hasOnlineDelivery: Boolean(hit.package_delivery ?? true),
        onlineUrl: url,
        laboratory: (hit.brand as string) ?? null,
        isBioequivalent: Boolean(bio.has_bioequivalent ?? false),
      }];
    });
  } catch {
    return [];
  }
}
