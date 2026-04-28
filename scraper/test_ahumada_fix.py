import re, asyncio, httpx

async def test():
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            "https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show",
            params={"q": "frenaler d", "start": 0, "sz": 5},
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.farmaciasahumada.cl/", "Accept": "text/html"},
            follow_redirects=True,
        )
    html = r.text
    tiles = re.split(r"(?=<div[^>]+product product-tile-wrapper)", html)
    BADGE_RE = re.compile(r'class="promotion-badge-container[^"]*"[^>]*>([\s\S]{0,300}?)(?=<img\s+class="promotion-badge|</div>)')
    PRICE_RE = re.compile(r"\$([\d.]+)")

    for block in tiles[1:3]:
        pid_m = re.search(r"data-pid=[\"'](\d+)[\"']", block)
        if not pid_m:
            continue
        is_cmr = "badge_30x40_cmr_falabella" in block
        badge_price = None
        badge_m = BADGE_RE.search(block)
        if badge_m:
            pm = PRICE_RE.search(badge_m.group(1))
            if pm:
                v = float(pm.group(1).replace(".", ""))
                badge_price = v if v > 100 else None

        content_vals = [int(m.group(1)) for m in re.finditer(r'content="(\d+)"', block) if int(m.group(1)) > 1000]
        print(f"PID={pid_m.group(1)} is_cmr={is_cmr} badge={badge_price} content_vals={content_vals}")

        if is_cmr and badge_price:
            candidates = [v for v in content_vals if v > badge_price]
            sale = min(candidates) if candidates else None
            price = sale or badge_price
            cmr = badge_price if sale and badge_price < sale else None
            print(f"  => presencial={price}  cmr={cmr}")
        elif badge_price:
            print(f"  => presencial={badge_price}  cmr=None")

asyncio.run(test())
