import { supabase } from "./supabaseClient.js";
import type { PharmacySlug } from "./types.js";

const TABLE = "price_history";
const DEFAULT_DAYS = 90;
const MIN_DAYS = 7;
const MAX_DAYS = 365;

interface ChannelEntry {
  name: string;
  price: number;
}

export interface PriceHistoryPoint {
  date: string;
  storePrice: number | null;
  effectivePrice: number;
  channels: ChannelEntry[];
}

export interface PriceHistorySeries {
  pharmacySlug: PharmacySlug;
  points: PriceHistoryPoint[];
}

export interface PriceHistorySummary {
  latestBestPrice: number | null;
  latestBestPharmacy: PharmacySlug | null;
  lowestRecordedPrice: number | null;
  highestRecordedPrice: number | null;
  change7dPercent: number | null;
  change30dPercent: number | null;
}

export interface PriceHistoryResult {
  matchKey: string;
  canonicalName: string | null;
  from: string;
  to: string;
  series: PriceHistorySeries[];
  summary: PriceHistorySummary;
}

interface PriceHistoryRow {
  pharmacy_slug: string;
  canonical_name: string | null;
  store_price: number | null;
  effective_price: number | null;
  channels: ChannelEntry[] | null;
  recorded_date: string;
}

/** Clamp de `days` a [7, 365], default 90 si falta o no es un número válido. */
export function clampDays(rawDays: number | null): number {
  if (rawDays == null || !Number.isFinite(rawDays)) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.trunc(rawDays)));
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateWindow(days: number): { fromStr: string; toStr: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { fromStr: toDateStr(from), toStr: toDateStr(to) };
}

function emptySummary(): PriceHistorySummary {
  return {
    latestBestPrice: null,
    latestBestPharmacy: null,
    lowestRecordedPrice: null,
    highestRecordedPrice: null,
    change7dPercent: null,
    change30dPercent: null,
  };
}

function emptyResult(matchKey: string, fromStr: string, toStr: string): PriceHistoryResult {
  return {
    matchKey,
    canonicalName: null,
    from: fromStr,
    to: toStr,
    series: [],
    summary: emptySummary(),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Lee el histórico persistido en `price_history` para un `matchKey` y arma la
 * respuesta agrupada por farmacia + resumen de variación. Capa de solo
 * lectura — deliberadamente separada de `recordPriceHistory` (priceHistoryDb.ts).
 *
 * Nunca lanza: cualquier falla de Supabase (no configurado, error de red, error
 * de query) degrada a un resultado vacío pero válido (HTTP 200 con series: []
 * y métricas null), para que la ficha nunca se caiga por falta de histórico.
 */
export async function getPriceHistory(matchKey: string, rawDays: number | null): Promise<PriceHistoryResult> {
  const days = clampDays(rawDays);
  const { fromStr, toStr } = dateWindow(days);

  if (!supabase) return emptyResult(matchKey, fromStr, toStr);

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("pharmacy_slug,canonical_name,store_price,effective_price,channels,recorded_date")
      .eq("match_key", matchKey)
      .gte("recorded_date", fromStr)
      .lte("recorded_date", toStr)
      .order("recorded_date", { ascending: true });

    if (error) {
      console.warn("price_history query failed", error.message);
      return emptyResult(matchKey, fromStr, toStr);
    }

    return buildResult(matchKey, fromStr, toStr, (data ?? []) as PriceHistoryRow[]);
  } catch (err) {
    console.warn("price_history query threw", err);
    return emptyResult(matchKey, fromStr, toStr);
  }
}

function buildResult(
  matchKey: string,
  fromStr: string,
  toStr: string,
  rows: PriceHistoryRow[]
): PriceHistoryResult {
  const seriesMap = new Map<string, PriceHistoryPoint[]>();
  // Mejor precio efectivo entre farmacias, por fecha — solo se usa para las
  // variaciones 7d/30d (spec: "comparar el mejor precio efectivo de la fecha
  // más reciente"), no para lowest/highest histórico (ver más abajo).
  const dateToBest = new Map<string, { price: number; pharmacySlug: string }>();
  let canonicalName: string | null = null;
  let lowestRecordedPrice: number | null = null;
  let highestRecordedPrice: number | null = null;

  for (const row of rows) {
    if (row.effective_price == null) continue;
    if (row.canonical_name) canonicalName = row.canonical_name;

    const points = seriesMap.get(row.pharmacy_slug) ?? [];
    points.push({
      date: row.recorded_date,
      storePrice: row.store_price,
      effectivePrice: row.effective_price,
      channels: row.channels ?? [],
    });
    seriesMap.set(row.pharmacy_slug, points);

    const currentBest = dateToBest.get(row.recorded_date);
    if (!currentBest || row.effective_price < currentBest.price) {
      dateToBest.set(row.recorded_date, { price: row.effective_price, pharmacySlug: row.pharmacy_slug });
    }

    lowestRecordedPrice = lowestRecordedPrice == null ? row.effective_price : Math.min(lowestRecordedPrice, row.effective_price);
    highestRecordedPrice = highestRecordedPrice == null ? row.effective_price : Math.max(highestRecordedPrice, row.effective_price);
  }

  const sortedDates = [...dateToBest.keys()].sort();
  const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
  const latestBest = latestDate ? (dateToBest.get(latestDate) ?? null) : null;

  function bestOnOrBefore(targetDateStr: string): { price: number; pharmacySlug: string } | null {
    let found: { price: number; pharmacySlug: string } | null = null;
    for (const d of sortedDates) {
      if (d <= targetDateStr) {
        found = dateToBest.get(d) ?? null;
      } else {
        break;
      }
    }
    return found;
  }

  function changePercent(daysAgo: number): number | null {
    if (!latestDate || !latestBest) return null;
    const target = new Date(`${latestDate}T00:00:00`);
    target.setDate(target.getDate() - daysAgo);
    const baseline = bestOnOrBefore(toDateStr(target));
    if (!baseline || baseline.price === 0) return null;
    return round2(((latestBest.price - baseline.price) / baseline.price) * 100);
  }

  const series: PriceHistorySeries[] = [...seriesMap.entries()].map(([pharmacySlug, points]) => ({
    pharmacySlug: pharmacySlug as PharmacySlug,
    points: [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
  }));

  return {
    matchKey,
    canonicalName,
    from: fromStr,
    to: toStr,
    series,
    summary: {
      latestBestPrice: latestBest?.price ?? null,
      latestBestPharmacy: (latestBest?.pharmacySlug as PharmacySlug | undefined) ?? null,
      lowestRecordedPrice,
      highestRecordedPrice,
      change7dPercent: changePercent(7),
      change30dPercent: changePercent(30),
    },
  };
}
