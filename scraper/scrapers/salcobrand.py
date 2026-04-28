import httpx
from .base import BaseScraper, ScrapedProduct

ALGOLIA_APP_ID  = "GM3RP06HJG"
ALGOLIA_API_KEY = "0259fe250b3be4b1326eb85e47aa7d81"
ALGOLIA_INDEX   = "sb_variant_production"
BASE_URL        = "https://salcobrand.cl"


class SalcobrandScraper(BaseScraper):
    slug = "salcobrand"
    name = "Salcobrand"

    async def search(self, query: str) -> list[ScrapedProduct]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    f"https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/{ALGOLIA_INDEX}/query",
                    json={"query": query, "hitsPerPage": 10},
                    headers={
                        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
                        "X-Algolia-API-Key": ALGOLIA_API_KEY,
                        "Referer": f"{BASE_URL}/",
                        "Origin": BASE_URL,
                        "User-Agent": "Mozilla/5.0",
                    },
                )
                r.raise_for_status()
                hits = r.json().get("hits", [])

            for hit in hits:
                # normal_price = precio internet (único disponible vía Algolia)
                # direct_discount = descuento adicional (si existe y es menor)
                normal = hit.get("normal_price")
                price = float(normal) if normal else None
                if not price:
                    continue

                direct = hit.get("direct_discount")
                direct_num = float(direct) if direct else None
                # online_price solo si hay un descuento menor al precio base
                online_price = direct_num if direct_num and direct_num < price else None

                slug = hit.get("slug", "")
                sku  = hit.get("sku", "")
                bio  = hit.get("bioequivalent_filter", {})
                url  = f"{BASE_URL}/products/{slug}?default_sku={sku}" if slug and sku else (f"{BASE_URL}/products/{slug}" if slug else None)

                results.append(ScrapedProduct(
                    name=hit.get("name", query),
                    price=price,
                    online_price=online_price,
                    has_stock=bool(hit.get("has_stock", True)),
                    has_online_delivery=bool(hit.get("package_delivery", True)),
                    online_url=url,
                    laboratory=hit.get("brand"),
                    is_bioequivalent=bool(bio.get("has_bioequivalent", False)),
                ))
        except Exception as e:
            print(f"[Salcobrand] Error: {e}")
        return results
