import re
from html import unescape
import httpx
from .base import BaseScraper, ScrapedProduct

SEARCH_URL = "https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show"
BASE_URL   = "https://www.farmaciasahumada.cl"

_LINK_RE  = re.compile(r'class="pdp-link"[\s\S]{0,300}?href="([^"]+)"[^>]*>\s*([^<]+)<')
_BADGE_RE = re.compile(r'class="promotion-badge-container[^"]*"[^>]*>([\s\S]{0,300}?)(?=<img\s+class="promotion-badge|</div>)')
_PRICE_RE = re.compile(r'\$([\d.]+)')


def _parse_clp(raw: str) -> float | None:
    try:
        v = float(raw.replace(".", "").replace(",", "."))
        return v if v > 100 else None
    except ValueError:
        return None


class AhumadaScraper(BaseScraper):
    slug = "ahumada"
    name = "Ahumada"

    async def search(self, query: str) -> list[ScrapedProduct]:
        results = []
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.get(
                    SEARCH_URL,
                    params={"q": query, "start": 0, "sz": 10},
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": f"{BASE_URL}/",
                        "Accept": "text/html",
                    },
                    follow_redirects=True,
                )
                html = r.text

            # Dividir en tiles por el div raíz de cada producto
            tiles = re.split(r'(?=<div[^>]+product product-tile-wrapper)', html)
            seen_pids: set[str] = set()

            for block in tiles[1:]:
                pid_m = re.search(r'data-pid=["\'](\d+)["\']', block)
                if not pid_m:
                    continue
                pid = pid_m.group(1)
                if pid in seen_pids:
                    continue
                seen_pids.add(pid)

                link_m = _LINK_RE.search(block)
                if not link_m:
                    continue
                href = link_m.group(1)
                name = unescape(link_m.group(2).strip())
                if not name:
                    continue

                is_cmr = bool(re.search(r'badge_30x40_cmr_falabella', block))

                badge_m = _BADGE_RE.search(block)
                badge_price = None
                if badge_m:
                    price_m = _PRICE_RE.search(badge_m.group(1))
                    if price_m:
                        badge_price = _parse_clp(price_m.group(1))

                # Precio normal tachado (solo para tiles CMR)
                normal_price = None
                del_m = re.search(r'class="[^"]*precio-normal[^"]*"[\s\S]{0,400}?content="(\d+)"', block)
                if del_m:
                    v = int(del_m.group(1))
                    normal_price = v if v > 100 else None

                if is_cmr:
                    price = normal_price or badge_price
                    cmr_price = badge_price if badge_price and price and badge_price < price else None
                else:
                    price = badge_price
                    cmr_price = None

                if not price:
                    continue

                is_bio = bool(re.search(r'bioequivalent-badge', block))
                url = href if href.startswith("http") else f"{BASE_URL}{href}"

                results.append(ScrapedProduct(
                    name=name,
                    price=price,
                    cmr_price=cmr_price,
                    has_stock=True,
                    has_online_delivery=True,
                    online_url=url,
                    is_bioequivalent=is_bio,
                ))
        except Exception as e:
            print(f"[Ahumada] Error: {e}")
        return results
