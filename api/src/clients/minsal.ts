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

export const REGION_NAMES: Record<string, string> = {
  "1": "Tarapacá", "2": "Antofagasta", "3": "Atacama", "4": "Coquimbo",
  "5": "Valparaíso", "6": "O'Higgins", "7": "Maule", "8": "Biobío",
  "9": "La Araucanía", "10": "Los Lagos", "11": "Aysén", "12": "Magallanes",
  "13": "Metropolitana", "14": "Los Ríos", "15": "Arica y Parinacota", "16": "Ñuble",
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
