import type { PharmacySlug } from "../lib/types.js";

// Nota: el campo MINSAL es local_nombre (no cadena_nombre).
// El script scripts-temp/fetch-branches.ps1 genera api/src/data/branches.json
// ejecutándolo localmente (MINSAL bloquea IPs de Vercel en runtime).

export interface MinsalLocal {
  local_id: string;
  local_nombre: string;      // nombre de la farmacia/cadena
  comuna_nombre: string;
  localidad_nombre: string;
  local_direccion: string;
  local_telefono: string | null;
  local_lat: string | null;
  local_lng: string | null;
  funcionamiento_dia: string;
  fk_region: string;         // ID numérico de región (no viene el nombre)
  fk_comuna: string;
}

export interface BranchIndex {
  byCommune: Record<string, PharmacySlug[]>;
  communes: Record<string, { nombre: string; region: string }>;
  fetchedAt: string;
}

// IDs reales del sistema MINSAL (NO coinciden con numeración estándar de regiones)
export const REGION_NAMES: Record<string, string> = {
  "1": "Arica y Parinacota",
  "2": "Tarapacá",
  "3": "Antofagasta",
  "4": "Atacama",
  "5": "Coquimbo",
  "6": "Valparaíso",
  "7": "Metropolitana",
  "8": "O'Higgins",
  "9": "Maule",
  "10": "Biobío",
  "11": "La Araucanía",
  "12": "Los Ríos",
  "13": "Los Lagos",
  "14": "Aysén",
  "15": "Magallanes",
  "16": "Ñuble",
};

const CADENA_MAP: Array<{ pattern: RegExp; slug: PharmacySlug }> = [
  { pattern: /cruz\s*verde/i,                         slug: "cruz-verde"  },
  { pattern: /salcobrand/i,                           slug: "salcobrand"  },
  { pattern: /ahumada/i,                              slug: "ahumada"     },
  { pattern: /dr\.?\s*simi|doctor\s*simi|del\s+dr/i, slug: "dr-simi"     },
  { pattern: /araucomed/i,                            slug: "araucomed"   },
];

export function toSlug(localNombre: string | null): PharmacySlug | null {
  if (!localNombre) return null;
  for (const { pattern, slug } of CADENA_MAP) {
    if (pattern.test(localNombre)) return slug;
  }
  return null;
}

export function normalizeCommune(raw: string): string {
  return raw
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim();
}
