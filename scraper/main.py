"""
Scraper principal de appFarmacy.
Busca cada medicamento de la lista en todas las farmacias y guarda los precios en PostgreSQL.

Uso:
  python main.py                        # Corre con la lista de medicamentos comunes
  python main.py --query "paracetamol"  # Busca un medicamento específico
"""

import asyncio
import argparse
from db import get_connection, upsert_medication, save_price, get_pharmacy_id, clean_old_prices
from scrapers import ALL_SCRAPERS

# Lista de medicamentos comunes en Chile para scraping diario
COMMON_MEDICATIONS = [
    "paracetamol",
    "ibuprofeno",
    "amoxicilina",
    "metformina",
    "atorvastatina",
    "losartan",
    "omeprazol",
    "aspirina",
    "enalapril",
    "amlodipino",
    "clonazepam",
    "levotiroxina",
    "sertralina",
    "salbutamol",
    "prednisona",
    "diclofenaco",
    "naproxeno",
    "ranitidina",
    "ciprofloxacino",
    "azitromicina",
    "amoxicilina clavulanico",
    "metronidazol",
    "fluoxetina",
    "alprazolam",
    "loratadina",
    "cetirizina",
    "dexametasona",
    "furosemida",
    "espironolactona",
    "simvastatina",
]


DELAY_BETWEEN_SCRAPERS  = 2.0   # segundos entre farmacias (mismo medicamento)
DELAY_BETWEEN_QUERIES   = 3.0   # segundos entre medicamentos
RETRY_DELAYS            = [10, 30]  # backoff en segundos si hay error


async def scrape_one(scraper, query: str, conn) -> int:
    """Intenta scrapear un medicamento de una farmacia, con reintentos."""
    pharmacy_id = get_pharmacy_id(conn, scraper.slug)
    last_error = None
    for attempt, wait in enumerate([0] + RETRY_DELAYS):
        if wait:
            print(f"  [{scraper.name}] reintentando en {wait}s...")
            await asyncio.sleep(wait)
        try:
            results = await scraper.search(query)
            for product in results:
                med_id = upsert_medication(
                    conn,
                    name=product.name,
                    active_ingredient=product.active_ingredient,
                    concentration=product.concentration,
                    form=product.form,
                    laboratory=product.laboratory,
                    is_bioequivalent=product.is_bioequivalent,
                )
                save_price(
                    conn,
                    medication_id=med_id,
                    pharmacy_id=pharmacy_id,
                    price=product.price,
                    online_price=product.online_price,
                    cmr_price=product.cmr_price,
                    has_stock=product.has_stock,
                    has_online_delivery=product.has_online_delivery,
                    online_url=product.online_url,
                )
            conn.commit()
            return len(results)
        except Exception as e:
            conn.rollback()
            last_error = e
    print(f"  [{scraper.name}] Error tras {len(RETRY_DELAYS)+1} intentos: {last_error}")
    return 0


async def scrape_medication(query: str, conn):
    print(f"\n[Buscando] {query}")
    for i, scraper in enumerate(ALL_SCRAPERS):
        if i > 0:
            await asyncio.sleep(DELAY_BETWEEN_SCRAPERS)
        n = await scrape_one(scraper, query, conn)
        print(f"  [{scraper.name}] {n} resultado(s)")


async def main(queries: list[str]):
    conn = get_connection()
    try:
        print(f"Limpiando precios antiguos...")
        clean_old_prices(conn)
        for i, query in enumerate(queries):
            if i > 0:
                await asyncio.sleep(DELAY_BETWEEN_QUERIES)
            await scrape_medication(query, conn)
        print(f"\nScraping completado. {len(queries)} medicamento(s) procesado(s).")
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", type=str, help="Buscar un medicamento específico")
    args = parser.parse_args()

    queries = [args.query] if args.query else COMMON_MEDICATIONS
    asyncio.run(main(queries))
