import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { liveSearch } from "@/lib/scrapers";

const GENERIC_WORDS = new Set([
  // Formas farmacéuticas (completas)
  "comp", "comprimido", "comprimidos", "capsulas", "capsula", "cap", "tab",
  "tableta", "tabletas", "mast", "masticable", "masticables", "sol", "solucion",
  "jarabe", "suspension", "crema", "gel", "gotas", "ampolla", "inyectable",
  "recubierto", "liberacion", "prolongada", "retard", "simple",
  "inh", "inhalador", "inhalacion", "aerosol", "bucal", "oral", "topico",
  "spray", "polvo", "parche", "supositorio", "colirio", "nasal", "ocular",
  "oftalmico", "rectal", "vaginal", "sublingual",
  // Abreviaciones farmacéuticas (usadas en recetas y etiquetas)
  "inf", "jbe", "amp", "sus", "crm", "gts", "iny", "ovul", "liq", "pom",
  "ung", "oft", "otic", "tab", "cps", "sol", "susp",
  // Descriptores de packaging (marcas de envase/dosificador)
  "facidose",
  // Descriptores de presentación y receta
  "dosis", "ds", "aplic", "aplicacion", "sos", "horas", "hrs", "cada",
  "via", "veces", "dia", "dias", "semana",
  // Palabras conectoras y preposiciones
  "x", "de", "la", "el", "los", "las", "con", "para", "sin", "por",
  // Unidades (las dosificaciones tipo 800UI se filtran por regex más abajo)
  "mg", "ml", "mcg", "ug", "gr", "ui", "iu", "g",
]);

// Palabras que indican inicio de instrucciones de dosificación en una receta
const PRESCRIPTION_CUTOFF = /\b(principio\s+activo|dosis|cada|via|forma\s+farm|posologia|indicacion|instruccion|administrar|tomar|aplicar|frecuencia)\b/i;

function cleanQuery(raw: string): string {
  // Cortar todo lo que viene después de palabras de instrucción de receta
  const cutoffMatch = PRESCRIPTION_CUTOFF.exec(raw);
  const text = cutoffMatch ? raw.slice(0, cutoffMatch.index) : raw;

  const words = text
    .replace(/\[.*?\]/g, " ")   // eliminar [LABORATORIO]
    .replace(/\(.*?\)/g, " ")   // eliminar (B), (R)
    .replace(/[.,:/]/g, " ")    // eliminar puntuación
    .split(/\s+/)
    .filter((w) => {
      const lower = w.toLowerCase();
      return (
        w.length >= 2 &&
        !GENERIC_WORDS.has(lower) &&
        !/^\d+$/.test(w) &&
        !/^\d+[\.,]?\d*\s*(mg|ml|mcg|ug|gr|ui|iu|g|µg)$/i.test(w)
      );
    });
  return [...new Set(words)].join(" ").trim();
}

async function queryDB(searchQuery: string) {
  const terms = searchQuery.split(/\s+/).filter((w) => w.length >= 2);
  const firstLike = `%${terms[0]}%`;

  // Construir condición WHERE: cada término debe aparecer en el nombre
  // REPLACE normaliza guiones a espacios para que "FRENALER-D" coincida con "FRENALER D"
  const termConditions = terms.map(() => "REPLACE(m.name, '-', ' ') LIKE REPLACE(?, '-', ' ')").join(" AND ");
  const termParams = terms.map((t) => `%${t}%`);

  const [rows] = await pool.query(
    `SELECT
       m.id, m.name, m.active_ingredient, m.concentration,
       m.form, m.laboratory, m.is_bioequivalent,
       IFNULL(
         JSON_ARRAYAGG(
           IF(p.id IS NULL, NULL,
             JSON_OBJECT(
               'pharmacy_id',         p.id,
               'pharmacy_name',       p.name,
               'pharmacy_slug',       p.slug,
               'price',               pr.price,
               'online_price',        pr.online_price,
               'cmr_price',           pr.cmr_price,
               'has_stock',           pr.has_stock,
               'has_online_delivery', pr.has_online_delivery,
               'online_url',          pr.online_url,
               'scraped_at',          pr.scraped_at
             )
           )
         ),
         JSON_ARRAY()
       ) AS prices
     FROM medications m
     LEFT JOIN prices pr
       ON pr.medication_id = m.id
       AND pr.scraped_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)
     LEFT JOIN pharmacies p
       ON p.id = pr.pharmacy_id AND p.is_active = 1
     WHERE ${termConditions}
     GROUP BY m.id
     ORDER BY
       CASE WHEN REPLACE(m.name, '-', ' ') LIKE REPLACE(?, '-', ' ') THEN 0 ELSE 1 END,
       m.name
     LIMIT 20`,
    [...termParams, firstLike]
  ) as [never[], never];

  return (rows as Record<string, unknown>[]).map((med) => ({
    ...med,
    is_bioequivalent: Boolean(med.is_bioequivalent),
    prices: typeof med.prices === "string"
      ? JSON.parse(med.prices as string).filter(Boolean).sort(
          (a: { price: number; online_price?: number; cmr_price?: number }, b: { price: number; online_price?: number; cmr_price?: number }) => {
            const pa = Math.min(a.price, a.online_price ?? a.price, a.cmr_price ?? a.price);
            const pb = Math.min(b.price, b.online_price ?? b.price, b.cmr_price ?? b.price);
            return pa - pb;
          }
        )
      : [],
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim();

  if (!rawQuery || rawQuery.length < 2) {
    return NextResponse.json({ medications: [], source: "db" });
  }

  const searchQuery = cleanQuery(rawQuery) || rawQuery;

  try {
    // 1. Buscar en DB
    let medications = await queryDB(searchQuery);

    // 2. Sin resultados: scrapear en vivo y guardar
    if (medications.length === 0) {
      await liveSearch(searchQuery);
      medications = await queryDB(searchQuery);
      return NextResponse.json({ medications, source: "live", cleanedQuery: searchQuery });
    }

    // 3. Hay resultados pero algún precio no tiene URL: refrescar en background
    const hasMissingUrls = medications.some((m) =>
      (m.prices as { online_url: string | null }[]).some((p) => !p.online_url)
    );
    if (hasMissingUrls) {
      liveSearch(searchQuery).catch(() => {});
    }

    return NextResponse.json({ medications, source: "db", cleanedQuery: searchQuery });
  } catch (error) {
    console.error("Error buscando medicamentos:", error);
    return NextResponse.json({ error: "Error al buscar medicamentos" }, { status: 500 });
  }
}
