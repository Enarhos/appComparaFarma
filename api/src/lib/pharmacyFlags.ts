import type { PharmacySlug } from "./types.js";
import { PHARMACY_NAMES } from "./pharmacies.js";

export interface PharmacyConfig {
  slug: PharmacySlug;
  name: string;
  active: boolean;
}

const ALL_SLUGS: PharmacySlug[] = ["cruz-verde", "salcobrand", "ahumada", "dr-simi", "farmamarket"];

/**
 * Lee la variable de entorno DISABLED_PHARMACIES (comma-separated).
 *
 * Ejemplos:
 *   DISABLED_PHARMACIES=ahumada
 *   DISABLED_PHARMACIES=ahumada,dr-simi
 *   DISABLED_PHARMACIES=          ← todas activas
 *
 * Para cambiar: Vercel Dashboard → Settings → Environment Variables → redeploy (~30s).
 */
export function getDisabledPharmacies(): Set<PharmacySlug> {
  const raw = process.env.DISABLED_PHARMACIES ?? "";
  const disabled = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PharmacySlug => ALL_SLUGS.includes(s as PharmacySlug));
  return new Set(disabled);
}

/**
 * Devuelve la config completa de farmacias con su estado activo/inactivo.
 * Usado por GET /api/config para que la app sepa qué farmacias mostrar.
 */
export function getPharmacyConfig(): PharmacyConfig[] {
  const disabled = getDisabledPharmacies();
  return ALL_SLUGS.map((slug) => ({
    slug,
    name: PHARMACY_NAMES[slug],
    active: !disabled.has(slug),
  }));
}
