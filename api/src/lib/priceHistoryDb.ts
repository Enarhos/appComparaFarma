import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MedicationResult, PharmacySlug, PriceChannels } from "./types.js";

const TABLE = "price_history";

// Nombre real del programa de fidelización de cada farmacia (canal "cmr" del
// tipo compartido) — NO se importa desde mobile/constants/pharmacies.ts para
// no crear una dependencia hacia el workspace mobile.
const LOYALTY_LABELS: Partial<Record<PharmacySlug, string>> = {
  salcobrand: "T. Más",
  ahumada: "CMR",
  farmex: "Fonasa",
  easyfarma: "Plus",
};

interface ChannelEntry {
  name: string;
  price: number;
}

export function buildChannels(slug: PharmacySlug, channels: PriceChannels): ChannelEntry[] {
  const entries: ChannelEntry[] = [];
  if (channels.online != null) entries.push({ name: "Online", price: channels.online });
  if (channels.cmr != null) entries.push({ name: LOYALTY_LABELS[slug] ?? "Tarjeta", price: channels.cmr });
  if (channels.sbpay != null) entries.push({ name: "SBPay", price: channels.sbpay });
  return entries;
}

let supabase: SupabaseClient | null = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
} catch (err) {
  console.error("Supabase init failed, price history will not be recorded:", err);
}

export async function recordPriceHistory(results: MedicationResult[]): Promise<void> {
  if (!supabase) return;

  const rows = results.flatMap((result) =>
    result.prices.map((price) => ({
      match_key: result.matchKey,
      canonical_name: result.canonicalName,
      pharmacy_slug: price.pharmacySlug,
      store_price: price.channels.store,
      effective_price: price.channels.effective,
      channels: buildChannels(price.pharmacySlug, price.channels),
    }))
  );

  if (rows.length === 0) return;

  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: "match_key,pharmacy_slug,recorded_date" });
    if (error) console.warn("price_history upsert failed", error.message);
  } catch (err) {
    console.warn("price_history upsert threw", err);
  }
}
