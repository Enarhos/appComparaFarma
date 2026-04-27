import type { ScrapedProduct } from "./types";

const BASE = "https://www.drsimi.cl";

interface VtexCommertialOffer {
  Price: number;
  ListPrice: number;
  IsAvailable: boolean;
  AvailableQuantity: number;
}

interface VtexSeller {
  commertialOffer: VtexCommertialOffer;
}

interface VtexItem {
  sellers: VtexSeller[];
}

interface VtexProduct {
  productName: string;
  brand: string;
  link: string;
  Bioequivalente?: string[];
  items: VtexItem[];
}

export async function searchDrSimi(query: string): Promise<ScrapedProduct[]> {
  try {
    const res = await fetch(
      `${BASE}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=9`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
          "Referer": BASE,
        },
      }
    );
    if (!res.ok) return [];
    const products: VtexProduct[] = await res.json();

    return products.flatMap((product) => {
      const offer = product.items?.[0]?.sellers?.[0]?.commertialOffer;
      if (!offer || !offer.Price) return [];

      const listPrice  = offer.ListPrice;
      const salePrice  = offer.Price;
      const storePrice = listPrice > 0 ? listPrice : salePrice;
      const onlinePrice = salePrice < storePrice ? salePrice : null;

      return [{
        name: product.productName,
        price: storePrice,
        onlinePrice,
        cmrPrice: null,
        hasStock: offer.IsAvailable && offer.AvailableQuantity > 0,
        hasOnlineDelivery: true,
        onlineUrl: product.link || null,
        laboratory: product.brand || null,
        isBioequivalent: product.Bioequivalente?.[0]?.toUpperCase() === "SI",
      }];
    });
  } catch {
    return [];
  }
}
