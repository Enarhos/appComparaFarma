"""
Importa medicamentos desde el dataset público del ISP Chile.
Fuente: https://datos.gob.cl/uploads/recursos/Productos_farmaceuticos_vigentes_venta_directa.csv
Columnas: Nº Registro | Nombre Producto | Razon Social Titular | Condicion Venta

Uso:
  python import_isp.py              # descarga y importa todo
  python import_isp.py --dry-run   # solo muestra cuántos registros se importarían
"""

import sys
import csv
import httpx
import io
import re
import time
import pymysql
from db import get_connection

CSV_URL = "https://datos.gob.cl/uploads/recursos/Productos_farmaceuticos_vigentes_venta_directa.csv"

# Formas farmacéuticas para parsear desde el nombre
FORMS = [
    "COMPRIMIDO", "COMP", "CÁPSULA", "CAPSULA", "TABLETA", "GRAGEA",
    "JARABE", "SOLUCIÓN", "SOLUCION", "SUSPENSIÓN", "SUSPENSION",
    "INYECTABLE", "AMPOLLA", "VIAL", "UNGÜENTO", "UNGUENTO",
    "CREMA", "GEL", "LOCIÓN", "LOCION", "PARCHE", "SUPOSITORIO",
    "COLIRIO", "GOTAS", "SPRAY", "AEROSOL", "INHALADOR", "INH",
    "POLVO", "GRANULADO", "ÓVULO", "OVULO", "EMULSIÓN", "EMULSION",
    "ESPUMA", "BÁLSAMO", "BALSAMO", "POMADA", "SHAMPOO", "CHAMPÚ",
]

FORM_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(f) for f in FORMS) + r")\b", re.IGNORECASE
)

def extract_form(name: str) -> str | None:
    m = FORM_PATTERN.search(name)
    return m.group(0).capitalize() if m else None


def download_csv() -> list[dict]:
    print(f"Descargando dataset del ISP...")
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        r = client.get(CSV_URL)
        r.raise_for_status()

    # El CSV usa ; como delimitador y puede estar en latin-1
    try:
        text = r.content.decode("utf-8")
    except UnicodeDecodeError:
        text = r.content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    return list(reader)


BATCH_SIZE = 100

def import_rows(rows: list[dict], dry_run: bool = False) -> tuple[int, int]:
    skipped = 0
    records = []

    for row in rows:
        name = (row.get("Nombre Producto") or "").strip()
        lab  = (row.get("Razon Social Titular") or "").strip() or None
        if not name:
            skipped += 1
            continue
        form = extract_form(name)
        records.append((name, lab, form))

    if dry_run:
        print(f"[dry-run] {len(records)} registros listos para importar.")
        return len(records), skipped

    conn = get_connection()
    inserted = 0
    try:
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i : i + BATCH_SIZE]
            for attempt in range(5):
                try:
                    with conn.cursor() as cur:
                        cur.executemany(
                            "INSERT IGNORE INTO medications (name, laboratory, form) VALUES (%s, %s, %s)",
                            batch,
                        )
                    conn.commit()
                    break
                except pymysql.err.OperationalError as e:
                    if e.args[0] == 1213 and attempt < 4:
                        conn.rollback()
                        time.sleep(0.5 * (attempt + 1))
                    else:
                        raise
            inserted += len(batch)
            print(f"  {inserted}/{len(records)} insertados...")
    finally:
        conn.close()

    return inserted, skipped


def main():
    dry_run = "--dry-run" in sys.argv

    rows = download_csv()
    print(f"  {len(rows)} registros descargados.")

    inserted, skipped = import_rows(rows, dry_run=dry_run)

    if dry_run:
        print("Nada importado (modo dry-run).")
    else:
        print(f"\nListo: {inserted} medicamentos importados, {skipped} omitidos.")


if __name__ == "__main__":
    main()
