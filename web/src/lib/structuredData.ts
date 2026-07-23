import type { MedicationResult } from "@comparafarma/domain";
import { buildMedicationSlug } from "@/lib/medicationSlug";
import { getSiteUrl } from "@/lib/site";

const MAX_PRODUCTS = 20;

function buildProductNode(medication: MedicationResult, url: string) {
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
    ...buildProductNode(medication, pageUrl),
  };
}

/** Escapa "<" para que un nombre de producto con "</script>" no rompa el HTML. */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
