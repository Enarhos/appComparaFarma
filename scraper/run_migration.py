"""Re-run after mcg fix: refresh all match_keys."""
import os
import pymysql
from dotenv import load_dotenv
from urllib.parse import urlparse
from db import _match_key

load_dotenv()
url = urlparse(os.environ["DATABASE_URL"])
conn = pymysql.connect(
    host=url.hostname, port=url.port or 3306,
    user=url.username, password=url.password,
    database=url.path.lstrip("/"), charset="utf8mb4",
    autocommit=True,
)

with conn.cursor() as cur:
    cur.execute("SELECT id, name FROM medications")
    rows = cur.fetchall()
    print(f"Refreshing {len(rows)} match_keys...")
    for mid, name in rows:
        key = _match_key(name)
        cur.execute("UPDATE medications SET match_key = %s WHERE id = %s", (key, mid))
    print("Done.")
    cur.execute("""
        SELECT match_key, COUNT(*) as cnt
        FROM medications GROUP BY match_key HAVING cnt > 1
        ORDER BY cnt DESC LIMIT 15
    """)
    dups = cur.fetchall()
    print(f"Groups with >1 name: {len(dups)}")
    for key, cnt in dups:
        print(f"  {key}: {cnt}")
conn.close()
