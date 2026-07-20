import type { PharmacySlug } from "./types.js";
import { PHARMACY_NAMES } from "./pharmacies.js";
import { getConfigValue } from "./appConfigDb.js";

export interface PharmacyConfig {
  slug: PharmacySlug;
  name: string;
  active: boolean;
}

const ALL_SLUGS: PharmacySlug[] = ["cruz-verde", "salcobrand", "ahumada", "dr-simi", "araucomed", "ecofarmacias", "farmex", "sermecoop", "easyfarma"];
const CONFIG_KEY = "disabled_pharmacies";

function parseDisabledList(raw: string): Set<PharmacySlug> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is PharmacySlug => ALL_SLUGS.includes(s as PharmacySlug))
  );
}

/**
 * Fuente de verdad: tabla app_config en Supabase (editable desde /admin, sin
 * redeploy). Si la fila no existe todavía o Supabase no responde, cae a la
 * env var DISABLED_PHARMACIES como red de seguridad — así ningún problema de
 * DB puede tumbar la búsqueda en producción.
 */
export async function getDisabledPharmacies(): Promise<Set<PharmacySlug>> {
  const fromDb = await getConfigValue<string[]>(CONFIG_KEY);
  if (fromDb) {
    return new Set(fromDb.filter((s): s is PharmacySlug => ALL_SLUGS.includes(s as PharmacySlug)));
  }
  return parseDisabledList(process.env.DISABLED_PHARMACIES ?? "");
}

/**
 * Devuelve la config completa de farmacias con su estado activo/inactivo.
 * Usado por GET /api/config para que la app sepa qué farmacias mostrar.
 */
export async function getPharmacyConfig(): Promise<PharmacyConfig[]> {
  const disabled = await getDisabledPharmacies();
  return ALL_SLUGS.map((slug) => ({
    slug,
    name: PHARMACY_NAMES[slug],
    active: !disabled.has(slug),
  }));
}
