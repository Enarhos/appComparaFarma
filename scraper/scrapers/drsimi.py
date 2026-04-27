import httpx
from .base import BaseScraper, ScrapedProduct

BASE_URL = "https://www.drsimi.cl"


class DrSimiScraper(BaseScraper):
    slug = "dr-simi"
    name = "Dr. Simi"

    async def search(self, query: str) -> list[ScrapedProduct]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"{BASE_URL}/api/catalog_system/pub/products/search/{query}",
                    params={"_from": 0, "_to": 9},
                    headers={
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/json",
                        "Referer": BASE_URL,
                    },
                )
                r.raise_for_status()
                products = r.json()

            for product in products:
                items = product.get("items", [])
                if not items:
                    continue
                offer = items[0].get("sellers", [{}])[0].get("commertialOffer", {})
                sale_price  = float(offer.get("Price") or 0)
                list_price  = float(offer.get("ListPrice") or 0)
                if not sale_price:
                    continue

                store_price  = list_price if list_price > 0 else sale_price
                online_price = sale_price if sale_price < store_price else None
                is_bio = (product.get("Bioequivalente") or [""])[0].upper() == "SI"

                results.append(ScrapedProduct(
                    name=product.get("productName", query),
                    price=store_price,
                    online_price=online_price,
                    has_stock=bool(offer.get("IsAvailable")) and int(offer.get("AvailableQuantity", 0)) > 0,
                    has_online_delivery=True,
                    online_url=product.get("link"),
                    laboratory=product.get("brand"),
                    is_bioequivalent=is_bio,
                ))
        except Exception as e:
            print(f"[DrSimi] Error: {e}")
        return results
