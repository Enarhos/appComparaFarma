import pool from "@/lib/db";
import { searchSalcobrand } from "./salcobrand";
import { searchCruzVerde } from "./cruzverde";
import { searchAhumada } from "./ahumada";
import { searchDrSimi } from "./drsimi";
import type { ScrapedProduct } from "./types";

interface Pharmacy { id: number; slug: string; name: string; }

async function getPharmacies(): Promise<Pharmacy[]> {
  const [rows] = await pool.query("SELECT id, slug, name FROM pharmacies WHERE is_active = 1") as [Pharmacy[], never];
  return rows;
}

async function saveMedication(name: string, lab: string | null, isBio: boolean): Promise<number> {
  const [existing] = await pool.query(
    "SELECT id FROM medications WHERE name = ? LIMIT 1", [name]
  ) as [{ id: number }[], never];
  if (existing.length > 0) return existing[0].id;
  const [result] = await pool.query(
    "INSERT INTO medications (name, laboratory, is_bioequivalent) VALUES (?, ?, ?)",
    [name, lab, isBio ? 1 : 0]
  ) as unknown as [{ insertId: number }, never];
  return result.insertId;
}

async function savePrice(medicationId: number, pharmacyId: number, product: ScrapedProduct) {
  await pool.query(
    `INSERT INTO prices (medication_id, pharmacy_id, price, online_price, cmr_price, has_stock, has_online_delivery, online_url, scraped_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       price               = VALUES(price),
       online_price        = VALUES(online_price),
       cmr_price           = VALUES(cmr_price),
       has_stock           = VALUES(has_stock),
       has_online_delivery = VALUES(has_online_delivery),
       online_url          = VALUES(online_url),
       scraped_at          = NOW()`,
    [medicationId, pharmacyId, product.price, product.onlinePrice ?? null,
     product.cmrPrice ?? null, product.hasStock ? 1 : 0, product.hasOnlineDelivery ? 1 : 0, product.onlineUrl]
  );
}

export async function liveSearch(query: string): Promise<void> {
  const pharmacies = await getPharmacies();
  const pharmacyMap = Object.fromEntries(pharmacies.map((p) => [p.slug, p.id]));

  const [salco, cv, ahu, simi] = await Promise.all([
    searchSalcobrand(query),
    searchCruzVerde(query),
    searchAhumada(query),
    searchDrSimi(query),
  ]);

  const results: Array<{ products: ScrapedProduct[]; slug: string }> = [
    { products: salco, slug: "salcobrand" },
    { products: cv,    slug: "cruz-verde" },
    { products: ahu,   slug: "ahumada"    },
    { products: simi,  slug: "dr-simi"    },
  ];

  for (const { products, slug } of results) {
    const pharmacyId = pharmacyMap[slug];
    if (!pharmacyId) continue;
    for (const product of products) {
      try {
        const medId = await saveMedication(product.name, product.laboratory, product.isBioequivalent);
        await savePrice(medId, pharmacyId, product);
      } catch {
        // Ignorar duplicados o errores individuales
      }
    }
  }
}
