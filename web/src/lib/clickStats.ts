import { createAdminClient } from "@/lib/supabase/admin";

interface ClickRow {
  pharmacy_slug: string;
  clicked_at: string;
}

export interface PharmacyClickStats {
  slug: string;
  total: number;
  last7Days: number;
  lastClickAt: string | null;
}

export interface ClickStats {
  totalClicks: number;
  byPharmacy: PharmacyClickStats[];
}

export type ClickStatsResult = { ok: true; stats: ClickStats } | { ok: false; error: string };

const MAX_ROWS = 5000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function aggregate(rows: ClickRow[]): PharmacyClickStats[] {
  const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
  const byPharmacy = new Map<string, PharmacyClickStats>();

  for (const row of rows) {
    const entry = byPharmacy.get(row.pharmacy_slug) ?? {
      slug: row.pharmacy_slug,
      total: 0,
      last7Days: 0,
      lastClickAt: null,
    };
    entry.total += 1;
    if (new Date(row.clicked_at).getTime() >= sevenDaysAgo) entry.last7Days += 1;
    if (!entry.lastClickAt || row.clicked_at > entry.lastClickAt) entry.lastClickAt = row.clicked_at;
    byPharmacy.set(row.pharmacy_slug, entry);
  }

  return [...byPharmacy.values()].sort((a, b) => b.total - a.total);
}

/**
 * Trae todos los clicks (hasta MAX_ROWS) y agrega en memoria. Volumen actual
 * (días desde el lanzamiento de Fase 1) está muy por debajo del límite — si
 * esto se vuelve lento, reemplazar por una vista agregada en Postgres.
 */
export async function getClickStats(): Promise<ClickStatsResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Faltan SUPABASE_URL / SUPABASE_SECRET_KEY en este proyecto de Vercel." };
  }

  const { data, error } = await admin
    .from("pharmacy_clicks")
    .select("pharmacy_slug, clicked_at")
    .order("clicked_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    console.error("[admin/clicks] pharmacy_clicks query failed:", error.message);
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as ClickRow[];
  return { ok: true, stats: { totalClicks: rows.length, byPharmacy: aggregate(rows) } };
}
