import { supabase } from "./supabaseClient.js";
import type { MedicationResult, PharmacySlug } from "./types.js";

const TABLE = "pharmacy_clicks";

// Dominio raíz real de cada farmacia — usado para validar que /api/go solo
// redirige a un sitio conocido (previene open redirect / phishing).
const ALLOWED_DOMAINS: Record<PharmacySlug, string> = {
  "cruz-verde": "cruzverde.cl",
  salcobrand: "salcobrand.cl",
  ahumada: "farmaciasahumada.cl",
  "dr-simi": "drsimi.cl",
  araucomed: "araucomed.com",
  ecofarmacias: "ecofarmacias.cl",
  farmex: "farmex.cl",
  sermecoop: "farmaciasermecoop.cl",
  easyfarma: "easyfarma.cl",
};

export function isAllowedRedirectUrl(slug: PharmacySlug, rawUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(rawUrl);
    if (protocol !== "https:") return false;
    const domain = ALLOWED_DOMAINS[slug];
    return domain != null && (hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function recordClick(
  matchKey: string,
  pharmacySlug: PharmacySlug,
  cfmId?: string | null
): Promise<void> {
  if (!supabase) return;
  try {
    // RFC-002 — cfm_id es aditivo/nullable, igual que en price_history.
    const { error } = await supabase
      .from(TABLE)
      .insert({ match_key: matchKey, pharmacy_slug: pharmacySlug, cfm_id: cfmId ?? null });
    if (error) console.warn("pharmacy_clicks insert failed", error.message);
  } catch (err) {
    console.warn("pharmacy_clicks insert threw", err);
  }
}

function buildTrackedUrl(
  origin: string,
  matchKey: string,
  slug: PharmacySlug,
  targetUrl: string,
  cfmId: string | null
): string {
  const params = new URLSearchParams({ slug, matchKey, url: targetUrl });
  if (cfmId) params.set("cfmId", cfmId);
  return `${origin}/api/go?${params.toString()}`;
}

/**
 * Reescribe onlineUrl para que pase por /api/go antes de llegar a la farmacia.
 * mobile/web no cambian nada — ya abren directamente lo que venga en onlineUrl.
 */
export function withTrackedUrls(results: MedicationResult[], origin: string): MedicationResult[] {
  return results.map((result) => ({
    ...result,
    prices: result.prices.map((price) =>
      price.onlineUrl
        ? {
            ...price,
            onlineUrl: buildTrackedUrl(
              origin,
              result.matchKey,
              price.pharmacySlug,
              price.onlineUrl,
              result.cfmId ?? null
            ),
          }
        : price
    ),
  }));
}
