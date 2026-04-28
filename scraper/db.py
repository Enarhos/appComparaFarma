import os
import re
import pymysql
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

_STOP = {
    "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
    "comp", "comprimido", "comprimidos", "capsula", "capsulas", "tab",
    "tableta", "tabletas", "sol", "solucion", "jarabe", "suspension",
    "crema", "gel", "gotas", "ampolla", "inyectable", "recubierto",
    "liberacion", "prolongada", "inhalador", "aerosol", "polvo",
    "parche", "supositorio", "colirio", "nasal", "ocular", "rectal",
    "mg", "ml", "mcg", "g", "ui", "iu", "infantil", "adulto", "forte",
    "plus", "pediatrico", "nino",
}
_ML_RE  = re.compile(r"(\d+(?:[.,]\d+)?)\s*ml\b", re.I)
_MG_RE  = re.compile(r"(\d+(?:[.,]\d+)?)\s*mg\b", re.I)
_MCG_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b", re.I)

def _match_key(name: str) -> str:
    raw = name.lower()
    # Run dose regex on raw (preserves "2,5 mg" before comma is stripped)
    ml_hits  = _ML_RE.findall(raw)
    mg_hits  = _MG_RE.findall(raw)
    mcg_hits = _MCG_RE.findall(raw)
    # Clean for word extraction
    lower = re.sub(r"[^\w\s]", " ", raw)
    lower = re.sub(r"\s+", " ", lower).strip()
    words = lower.split()
    first = next((w for w in words if len(w) >= 2 and w not in _STOP and not w[0].isdigit()), "")
    if ml_hits:
        max_ml = max(float(v.replace(",", ".")) for v in ml_hits)
        dose = f"{max_ml:g}ml"
    elif mcg_hits:
        dose = f"{float(mcg_hits[0].replace(',', '.')):g}mcg"
    elif mg_hits:
        dose = f"{float(mg_hits[0].replace(',', '.')):g}mg"
    else:
        dose = ""
    key = f"{first}|{dose}" if first and dose else first or lower[:30]
    return key[:100]

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
    key = _match_key(name)
    with conn.cursor() as cur:
        # Try to find existing medication by match_key first
        cur.execute("SELECT id FROM medications WHERE match_key = %s LIMIT 1", (key,))
        row = cur.fetchone()
        if row:
            # Update metadata if we now have richer data
            cur.execute(
                """UPDATE medications SET
                     active_ingredient = COALESCE(active_ingredient, %s),
                     concentration     = COALESCE(concentration, %s),
                     form              = COALESCE(form, %s),
                     laboratory        = COALESCE(laboratory, %s),
                     updated_at        = NOW()
                   WHERE id = %s""",
                (active_ingredient, concentration, form, laboratory, row[0])
            )
            return row[0]
        cur.execute(
            """INSERT INTO medications (name, active_ingredient, concentration, form, laboratory, is_bioequivalent, match_key)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE updated_at = NOW(), match_key = COALESCE(match_key, VALUES(match_key))""",
            (name, active_ingredient, concentration, form, laboratory, int(is_bioequivalent), key)
        )
        if cur.lastrowid:
            return cur.lastrowid
        cur.execute("SELECT id FROM medications WHERE name = %s LIMIT 1", (name,))
        return cur.fetchone()[0]

def save_price(conn, medication_id: int, pharmacy_id: int, price: float,
               has_stock: bool = True, has_online_delivery: bool = False,
               online_url: str = None, online_price: float = None,
               cmr_price: float = None):
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO prices (medication_id, pharmacy_id, price, online_price, cmr_price, has_stock, has_online_delivery, online_url, scraped_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
               ON DUPLICATE KEY UPDATE
                 price               = VALUES(price),
                 online_price        = VALUES(online_price),
                 cmr_price           = VALUES(cmr_price),
                 has_stock           = VALUES(has_stock),
                 has_online_delivery = VALUES(has_online_delivery),
                 online_url          = VALUES(online_url),
                 scraped_at          = NOW()""",
            (medication_id, pharmacy_id, price, online_price, cmr_price, int(has_stock), int(has_online_delivery), online_url)
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
