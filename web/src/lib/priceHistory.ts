/**
 * Cliente server-side de GET /api/price-history. Tipos definidos localmente
 * (no en @comparafarma/domain): este endpoint es propio de `web/`, no forma
 * parte del contrato que consume `mobile/`.
 */

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
  pharmacySlug: string;
  points: PriceHistoryPoint[];
}

export interface PriceHistorySummary {
  latestBestPrice: number | null;
  latestBestPharmacy: string | null;
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

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

function emptyResult(matchKey: string): PriceHistoryResult {
  return {
    matchKey,
    canonicalName: null,
    from: "",
    to: "",
    series: [],
    summary: {
      latestBestPrice: null,
      latestBestPharmacy: null,
      lowestRecordedPrice: null,
      highestRecordedPrice: null,
      change7dPercent: null,
      change30dPercent: null,
    },
  };
}

export async function getPriceHistory(matchKey: string, days = 90): Promise<PriceHistoryResult> {
  try {
    const res = await fetch(
      `${API_URL}/api/price-history?matchKey=${encodeURIComponent(matchKey)}&days=${days}`,
      {
        next: { revalidate: 3600 }, // el histórico se actualiza a lo sumo una vez al día
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      return emptyResult(matchKey);
    }
    return (await res.json()) as PriceHistoryResult;
  } catch {
    return emptyResult(matchKey);
  }
}
