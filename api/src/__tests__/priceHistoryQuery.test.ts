import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import { getPriceHistory, clampDays } from "../lib/priceHistoryQuery.js";

interface Row {
  pharmacy_slug: string;
  canonical_name: string | null;
  store_price: number | null;
  effective_price: number | null;
  channels: unknown[];
  recorded_date: string;
}

function row(date: string, pharmacySlug: string, storePrice: number, effectivePrice: number): Row {
  return {
    pharmacy_slug: pharmacySlug,
    canonical_name: "Paracetamol 500 mg",
    store_price: storePrice,
    effective_price: effectivePrice,
    channels: [],
    recorded_date: date,
  };
}

function makeSupabase(result: { data: Row[] | null; error: { message: string } | null }) {
  const eqMock = vi.fn();
  const gteMock = vi.fn();
  const lteMock = vi.fn();
  const orderMock = vi.fn(() => Promise.resolve(result));
  const builder = {
    select: vi.fn(() => builder),
    eq: (...args: unknown[]) => {
      eqMock(...args);
      return builder;
    },
    gte: (...args: unknown[]) => {
      gteMock(...args);
      return builder;
    },
    lte: (...args: unknown[]) => {
      lteMock(...args);
      return builder;
    },
    order: orderMock,
  };
  return { from: vi.fn(() => builder), eqMock, gteMock, lteMock, orderMock };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

beforeEach(() => {
  state.supabase = null;
});

describe("clampDays", () => {
  it("defaults to 90 when missing", () => {
    expect(clampDays(null)).toBe(90);
  });

  it("clamps a value below the minimum up to 7", () => {
    expect(clampDays(1)).toBe(7);
  });

  it("clamps a value above the maximum down to 365", () => {
    expect(clampDays(1000)).toBe(365);
  });

  it("keeps a value already inside the valid range", () => {
    expect(clampDays(30)).toBe(30);
  });

  it("defaults to 90 for a non-finite value", () => {
    expect(clampDays(Number.NaN)).toBe(90);
  });
});

describe("getPriceHistory — Supabase ausente o con error", () => {
  it("returns a safe empty result when Supabase is not configured", async () => {
    state.supabase = null;

    const result = await getPriceHistory("paracetamol|500mg", null);

    expect(result.matchKey).toBe("paracetamol|500mg");
    expect(result.series).toEqual([]);
    expect(result.summary).toEqual({
      latestBestPrice: null,
      latestBestPharmacy: null,
      lowestRecordedPrice: null,
      highestRecordedPrice: null,
      change7dPercent: null,
      change30dPercent: null,
    });
  });

  it("returns a safe empty result (not a throw) when the query errors", async () => {
    state.supabase = makeSupabase({ data: null, error: { message: "boom" } });

    const result = await getPriceHistory("paracetamol|500mg", null);

    expect(result.series).toEqual([]);
  });

  it("returns a safe empty result when the client throws synchronously", async () => {
    state.supabase = {
      from: vi.fn(() => {
        throw new Error("network down");
      }),
    };

    const result = await getPriceHistory("paracetamol|500mg", null);

    expect(result.series).toEqual([]);
  });
});

describe("getPriceHistory — agrupación y orden", () => {
  it("groups points by pharmacy and keeps ascending date order within each series", async () => {
    const rows = [
      row("2026-07-10", "salcobrand", 3290, 2290),
      row("2026-07-01", "cruz-verde", 2990, 2990),
      row("2026-07-05", "cruz-verde", 2990, 2990),
    ];
    const client = makeSupabase({ data: rows, error: null });
    state.supabase = client;

    const result = await getPriceHistory("paracetamol|500mg", 90);

    expect(client.eqMock).toHaveBeenCalledWith("match_key", "paracetamol|500mg");
    const cruzVerde = result.series.find((s) => s.pharmacySlug === "cruz-verde");
    expect(cruzVerde?.points.map((p) => p.date)).toEqual(["2026-07-01", "2026-07-05"]);
    const salcobrand = result.series.find((s) => s.pharmacySlug === "salcobrand");
    expect(salcobrand?.points).toHaveLength(1);
  });
});

describe("getPriceHistory — resumen mínimo/máximo", () => {
  it("computes lowest/highest recorded price across all pharmacies in range", async () => {
    const rows = [
      row("2026-07-01", "cruz-verde", 2990, 2990),
      row("2026-07-01", "salcobrand", 3290, 2290),
      row("2026-07-10", "salcobrand", 3290, 3290),
    ];
    state.supabase = makeSupabase({ data: rows, error: null });

    const result = await getPriceHistory("paracetamol|500mg", 90);

    expect(result.summary.lowestRecordedPrice).toBe(2290);
    expect(result.summary.highestRecordedPrice).toBe(3290);
  });
});

describe("getPriceHistory — variación 7d/30d", () => {
  it("computes 7-day and 30-day change using the best price available on/before each target date", async () => {
    const rows = [
      row(daysAgo(30), "cruz-verde", 1000, 1000),
      row(daysAgo(7), "cruz-verde", 900, 900),
      row(daysAgo(0), "cruz-verde", 800, 800),
    ];
    state.supabase = makeSupabase({ data: rows, error: null });

    const result = await getPriceHistory("paracetamol|500mg", 90);

    expect(result.summary.latestBestPrice).toBe(800);
    expect(result.summary.latestBestPharmacy).toBe("cruz-verde");
    expect(result.summary.change7dPercent).toBeCloseTo(((800 - 900) / 900) * 100, 1);
    expect(result.summary.change30dPercent).toBeCloseTo(((800 - 1000) / 1000) * 100, 1);
  });

  it("returns null change when there is no data far enough back (datos insuficientes)", async () => {
    const rows = [row(daysAgo(0), "cruz-verde", 1000, 1000)];
    state.supabase = makeSupabase({ data: rows, error: null });

    const result = await getPriceHistory("paracetamol|500mg", 90);

    expect(result.summary.change7dPercent).toBeNull();
    expect(result.summary.change30dPercent).toBeNull();
  });

  it("picks the closest date on-or-before the target when the exact day is missing", async () => {
    const rows = [
      row(daysAgo(35), "cruz-verde", 1200, 1200),
      row(daysAgo(0), "cruz-verde", 800, 800),
    ];
    state.supabase = makeSupabase({ data: rows, error: null });

    const result = await getPriceHistory("paracetamol|500mg", 90);

    // No hay dato exacto a 30 días — debe usar el más cercano anterior (35 días).
    expect(result.summary.change30dPercent).toBeCloseTo(((800 - 1200) / 1200) * 100, 1);
  });
});

describe("getPriceHistory — nombre canónico", () => {
  it("returns null canonicalName when there are no rows", async () => {
    state.supabase = makeSupabase({ data: [], error: null });

    const result = await getPriceHistory("paracetamol|500mg", 90);

    expect(result.canonicalName).toBeNull();
    expect(result.series).toEqual([]);
  });
});
