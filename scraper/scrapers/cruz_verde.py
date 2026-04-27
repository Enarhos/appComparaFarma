import httpx
from .base import BaseScraper, ScrapedProduct

API_BASE  = "https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search"
CLIENT_ID = "c19ce24d-1677-4754-b9f7-c193997c5a92"
SITE_URL  = "https://www.cruzverde.cl"


class CruzVerdeScraper(BaseScraper):
    slug = "cruz-verde"
    name = "Cruz Verde"

    async def search(self, query: str) -> list[ScrapedProduct]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    API_BASE,
                    params={
                        "q": query,
                        "count": 10,
                        "expand": "prices,availability",
                        "client_id": CLIENT_ID,
                    },
                    headers={
                        "User-Agent": "Mozilla/5.0",
                        "x-dw-client-id": CLIENT_ID,
                        "Referer": f"{SITE_URL}/",
                    },
                )
                r.raise_for_status()
                hits = r.json().get("hits", [])

            for hit in hits:
                price = hit.get("price")
                if not price:
                    continue

                product_id = hit.get("product_id", "")
                product_name = hit.get("product_name", query)

                results.append(ScrapedProduct(
                    name=product_name,
                    price=float(price),
                    has_stock=bool(hit.get("orderable", True)),
                    has_online_delivery=True,
                    online_url=f"{SITE_URL}/{self._slug_from_name(product_name)}/{product_id}.html" if product_id else f"{SITE_URL}/search?q={product_name}",
                ))
        except Exception as e:
            print(f"[Cruz Verde] Error: {e}")
        return results

    def _slug_from_name(self, name: str) -> str:
        import re
        slug = name.lower().strip()
        slug = re.sub(r'[áàä]', 'a', slug)
        slug = re.sub(r'[éèë]', 'e', slug)
        slug = re.sub(r'[íìï]', 'i', slug)
        slug = re.sub(r'[óòö]', 'o', slug)
        slug = re.sub(r'[úùü]', 'u', slug)
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        return slug.strip('-')
