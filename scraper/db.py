import os
import pymysql
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

def get_connection():
    url = urlparse(os.environ["DATABASE_URL"])
    return pymysql.connect(
        host=url.hostname,
        port=url.port or 3306,
        user=url.username,
        password=url.password,
        database=url.path.lstrip("/"),
        charset="utf8mb4",
        autocommit=False,
    )

def upsert_medication(conn, name: str, active_ingredient: str = None,
                      concentration: str = None, form: str = None,
                      laboratory: str = None, is_bioequivalent: bool = False) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO medications (name, active_ingredient, concentration, form, laboratory, is_bioequivalent)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE updated_at = NOW()""",
            (name, active_ingredient, concentration, form, laboratory, int(is_bioequivalent))
        )
        if cur.lastrowid:
            return cur.lastrowid
        cur.execute("SELECT id FROM medications WHERE name = %s LIMIT 1", (name,))
        return cur.fetchone()[0]

def save_price(conn, medication_id: int, pharmacy_id: int, price: float,
               has_stock: bool = True, has_online_delivery: bool = False,
               online_url: str = None, online_price: float = None):
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO prices (medication_id, pharmacy_id, price, online_price, has_stock, has_online_delivery, online_url, scraped_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
               ON DUPLICATE KEY UPDATE
                 price               = VALUES(price),
                 online_price        = VALUES(online_price),
                 has_stock           = VALUES(has_stock),
                 has_online_delivery = VALUES(has_online_delivery),
                 online_url          = VALUES(online_url),
                 scraped_at          = NOW()""",
            (medication_id, pharmacy_id, price, online_price, int(has_stock), int(has_online_delivery), online_url)
        )

def get_pharmacy_id(conn, slug: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM pharmacies WHERE slug = %s", (slug,))
        row = cur.fetchone()
        if not row:
            raise ValueError(f"Farmacia no encontrada: {slug}")
        return row[0]

def clean_old_prices(conn, hours: int = 72):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM prices WHERE scraped_at < DATE_SUB(NOW(), INTERVAL %s HOUR)",
            (hours,)
        )
    conn.commit()
