import type { MedicationResult } from "@comparafarma/domain";
import { buildMedicationSlug } from "@/lib/medicationSlug";
import { getSiteUrl } from "@/lib/site";

const MAX_PRODUCTS = 20;

function buildProductNode(medication: MedicationResult, url: string, opts: { detailed?: boolean } = {}) {
  const prices = medication.prices.map((p) => p.channels.effective);
  const inStock = medication.prices.some((p) => p.hasStock);

  return {
    "@type": "Product",
    name: medication.canonicalName,
    ...(medication.imageUrl ? { image: medication.imageUrl } : {}),
    ...(medication.laboratory ? { brand: { "@type": "Brand", name: medication.laboratory } } : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CLP",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: medication.prices.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
      // Sprint Web 2: Offer individual por farmacia — solo en la ficha de
      // detalle (opts.detailed), no en el ItemList de resultados de búsqueda,
      // para no inflar esa página con N ofertas × 20 productos.
      ...(opts.detailed
        ? {
            offers: medication.prices.map((price) => ({
              "@type": "Offer",
              price: price.channels.effective,
              priceCurrency: "CLP",
              availability: price.hasStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: price.pharmacyName },
              ...(price.onlineUrl ? { url: price.onlineUrl } : {}),
            })),
          }
        : {}),
    },
  };
}

/**
 * ItemList de Product con AggregateOffer (varias farmacias = varios vendedores
 * para el mismo producto) — formato que Google reconoce para rich results de
 * precio. Solo los primeros MAX_PRODUCTS (los resultados ya vienen ordenados
 * por precio ascendente desde la API) para no inflar la página con búsquedas
 * de 90+ resultados. Cada Product enlaza a su propia ficha permanente
 * (/medicamento/[slug]), no a esta página de búsqueda.
 */
export function buildMedicationJsonLd(term: string, results: MedicationResult[]) {
  const base = getSiteUrl();
  const products = results
    .slice(0, MAX_PRODUCTS)
    .map((med) => buildProductNode(med, `${base}/medicamento/${buildMedicationSlug(med)}`));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: `Precios de ${term} en Chile`,
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: product,
        })),
      },
    ],
  };
}

/** JSON-LD de un solo Product, para la ficha permanente /medicamento/[slug]. */
export function buildMedicationDetailJsonLd(medication: MedicationResult, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    ...buildProductNode(medication, pageUrl, { detailed: true }),
  };
}

/** Escapa "<" para que un nombre de producto con "</script>" no rompa el HTML. */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
