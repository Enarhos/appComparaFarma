import type { PharmacySlug } from "../lib/types.js";

export interface MinsalLocal {
  local_id: string;
  local_nombre: string;
  cadena_nombre: string | null;
  comuna_nombre: string;
  region_nombre: string;
  local_direccion: string;
  local_telefono: string | null;
  local_lat: string | null;
  local_lng: string | null;
}

export interface BranchIndex {
  /** comunaNorm → slugs de farmacias con sucursal ahí */
  byCommune: Record<string, PharmacySlug[]>;
  /** comunaNorm → { nombre, region } para mostrar en la UI */
  communes: Record<string, { nombre: string; region: string }>;
  fetchedAt: string;
}

// Normaliza nombre de comuna para comparación: "TALAGANTE" → "talagante"
export function normalizeCommune(raw: string): string {
  return raw
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Mapeo flexible de cadena_nombre MINSAL → PharmacySlug
const CADENA_MAP: Array<{ pattern: RegExp; slug: PharmacySlug }> = [
  { pattern: /cruz\s*verde/i,        slug: "cruz-verde"  },
  { pattern: /salcobrand/i,          slug: "salcobrand"  },
  { pattern: /ahumada/i,             slug: "ahumada"     },
  { pattern: /dr\.?\s*simi|doctor\s*simi/i, slug: "dr-simi" },
  { pattern: /araucomed/i,           slug: "araucomed"   },
];

function toSlug(cadena: string | null): PharmacySlug | null {
  if (!cadena) return null;
  for (const { pattern, slug } of CADENA_MAP) {
    if (pattern.test(cadena)) return slug;
  }
  return null;
}

export async function fetchMinsalBranches(): Promise<BranchIndex> {
  const res = await fetch("https://midas.minsal.cl/farmacia_v2/WS/getLocales.php", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://midas.minsal.cl/",
      "Accept": "application/json, text/plain, */*",
    },
  });

  if (!res.ok) throw new Error(`MINSAL HTTP ${res.status}`);

  const data = await res.json() as MinsalLocal[];

  const byCommune: Record<string, Set<PharmacySlug>> = {};
  const communes: Record<string, { nombre: string; region: string }> = {};

  for (const local of data) {
    const slug = toSlug(local.cadena_nombre);
    if (!slug) continue; // botica independiente sin integración

    const communeNorm = normalizeCommune(local.comuna_nombre);
    if (!communeNorm) continue;

    if (!byCommune[communeNorm]) byCommune[communeNorm] = new Set();
    byCommune[communeNorm].add(slug);

    if (!communes[communeNorm]) {
      communes[communeNorm] = {
        nombre: local.comuna_nombre
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" "),
        region: local.region_nombre
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" "),
      };
    }
  }

  return {
    byCommune: Object.fromEntries(
      Object.entries(byCommune).map(([k, v]) => [k, [...v]])
    ),
    communes,
    fetchedAt: new Date().toISOString(),
  };
}
