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


async def scrape_medication(query: str, conn):
    print(f"\n[Buscando] {query}")
    for scraper in ALL_SCRAPERS:
        try:
            pharmacy_id = get_pharmacy_id(conn, scraper.slug)
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
            print(f"  [{scraper.name}] {len(results)} resultado(s)")
        except Exception as e:
            conn.rollback()
            print(f"  [{scraper.name}] Error: {e}")


async def main(queries: list[str]):
    conn = get_connection()
    try:
        print(f"Limpiando precios antiguos...")
        clean_old_prices(conn)
        for query in queries:
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
