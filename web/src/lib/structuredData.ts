import type { MedicationResult } from "@comparafarma/domain";

const MAX_PRODUCTS = 20;

/**
 * ItemList de Product con AggregateOffer (varias farmacias = varios vendedores
 * para el mismo producto) — formato que Google reconoce para rich results de
 * precio. Solo los primeros MAX_PRODUCTS (los resultados ya vienen ordenados
 * por precio ascendente desde la API) para no inflar la página con búsquedas
 * de 90+ resultados.
 */
export function buildMedicationJsonLd(term: string, results: MedicationResult[], pageUrl: string) {
  const products = results.slice(0, MAX_PRODUCTS).map((med) => {
    const prices = med.prices.map((p) => p.channels.effective);
    const inStock = med.prices.some((p) => p.hasStock);

    return {
      "@type": "Product",
      name: med.canonicalName,
      ...(med.imageUrl ? { image: med.imageUrl } : {}),
      ...(med.laboratory ? { brand: { "@type": "Brand", name: med.laboratory } } : {}),
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "CLP",
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: med.prices.length,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: pageUrl,
      },
    };
  });

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

/** Escapa "<" para que un nombre de producto con "</script>" no rompa el HTML. */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
