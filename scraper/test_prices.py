import httpx, asyncio, re

async def test_salcobrand():
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            'https://GM3RP06HJG-dsn.algolia.net/1/indexes/sb_variant_production/query',
            json={'query': 'frenaler d', 'hitsPerPage': 2},
            headers={
                'X-Algolia-Application-Id': 'GM3RP06HJG',
                'X-Algolia-API-Key': '0259fe250b3be4b1326eb85e47aa7d81',
                'Origin': 'https://salcobrand.cl',
            }
        )
        hits = r.json().get('hits', [])
        print(f"=== SALCOBRAND ({len(hits)} hits) ===")
        for h in hits[:2]:
            print(f"name: {h.get('name')}")
            for k, v in sorted(h.items()):
                if any(x in k.lower() for x in ['price', 'cost', 'discount', 'promo']):
                    print(f"  {k}: {v}")
            print()

async def test_ahumada():
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            'https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show',
            params={'q': 'frenaler d', 'start': 0, 'sz': 5},
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.farmaciasahumada.cl/',
                'Accept': 'text/html',
            },
            follow_redirects=True,
        )
        html = r.text
        # Find the first CMR tile
        tiles = re.split(r'(?=<div[^>]+product product-tile-wrapper)', html)
        print(f"=== AHUMADA ({len(tiles)-1} tiles) ===")
        for block in tiles[1:3]:
            pid_m = re.search(r'data-pid=["\'](\d+)["\']', block)
            if not pid_m:
                continue
            is_cmr = 'badge_30x40_cmr_falabella' in block
            print(f"PID: {pid_m.group(1)}, is_cmr={is_cmr}")
            # Show all price-related snippets
            for m in re.finditer(r'\$[\d.,]+', block):
                start = max(0, m.start()-50)
                ctx = block[start:m.end()+50].replace('\n', ' ').strip()
                print(f"  price context: ...{ctx}...")
            # Show content= attributes
            for m in re.finditer(r'content="(\d+)"', block):
                print(f"  content attr: {m.group(1)}")
            print()

asyncio.run(test_salcobrand())
asyncio.run(test_ahumada())
