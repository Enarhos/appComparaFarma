"""
One-time migration: add match_key column to medications and populate it.
Run once from the scraper directory: python migrate_match_key.py
"""
import re
from db import get_connection, _match_key

def run():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Add column if it doesn't exist
            cur.execute("""
                ALTER TABLE medications
                ADD COLUMN IF NOT EXISTS match_key VARCHAR(100) NULL
            """)
            conn.commit()
            print("Column match_key ensured.")

            # Populate match_key for all existing medications
            cur.execute("SELECT id, name FROM medications WHERE match_key IS NULL")
            rows = cur.fetchall()
            print(f"Updating {len(rows)} medications...")
            for med_id, name in rows:
                key = _match_key(name)
                cur.execute("UPDATE medications SET match_key = %s WHERE id = %s", (key, med_id))
            conn.commit()
            print("Done populating match_key.")

            # Show duplicates that would be merged
            cur.execute("""
                SELECT match_key, COUNT(*) as cnt, GROUP_CONCAT(name ORDER BY name SEPARATOR ' | ') as names
                FROM medications
                GROUP BY match_key
                HAVING cnt > 1
                ORDER BY cnt DESC
                LIMIT 20
            """)
            dups = cur.fetchall()
            print(f"\nMatch groups with >1 medication ({len(dups)} groups):")
            for key, cnt, names in dups:
                print(f"  [{key}] ({cnt}x) {names[:120]}")
    finally:
        conn.close()

if __name__ == "__main__":
    run()
