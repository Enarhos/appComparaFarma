import { describe, it, expect } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";
import { buildInsights } from "./insights";
import type { PriceHistoryResult } from "./priceHistory";

function makePrice(pharmacySlug: string, pharmacyName: string, effective: number) {
  return {
    pharmacySlug,
    pharmacyName,
    productName: "Paracetamol 500 mg",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-07-20T00:00:00.000Z",
  };
}

function makeMedication(prices: ReturnType<typeof makePrice>[]): MedicationResult {
  return {
    matchKey: "paracetamol|500mg",
    canonicalName: "Paracetamol 500 mg",
    laboratory: null,
    isBioequivalent: false,
    bestPrice: Math.min(...prices.map((p) => p.channels.effective)),
    bestPharmacy: prices[0]?.pharmacySlug ?? "",
    imageUrl: null,
    prices: prices as MedicationResult["prices"],
  };
}

function emptyHistory(overrides: Partial<PriceHistoryResult["summary"]> = {}): PriceHistoryResult {
  return {
    matchKey: "paracetamol|500mg",
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
      ...overrides,
    },
  };
}

describe("buildInsights", () => {
  it("only reports the cheapest pharmacy when there is a single price", () => {
    const medication = makeMedication([makePrice("cruz-verde", "Cruz Verde", 2990)]);

    const insights = buildInsights(medication, emptyHistory());

    expect(insights).toEqual(["Cruz Verde posee actualmente el menor precio."]);
  });

  it("reports cheapest, price gap, and priciest pharmacy with more than one price", () => {
    const medication = makeMedication([
      makePrice("cruz-verde", "Cruz Verde", 2990),
      makePrice("salcobrand", "Salcobrand", 3290),
    ]);

    const insights = buildInsights(medication, emptyHistory());

    expect(insights).toContain("Cruz Verde posee actualmente el menor precio.");
    expect(insights).toContain("La diferencia entre la farmacia más barata y la más cara es de $300.");
    expect(insights).toContain("Salcobrand mantiene el precio más alto.");
  });

  it("does not claim high dispersion when the gap is below the 30% threshold", () => {
    const medication = makeMedication([
      makePrice("cruz-verde", "Cruz Verde", 2990),
      makePrice("salcobrand", "Salcobrand", 3290), // ~10% de diferencia
    ]);

    const insights = buildInsights(medication, emptyHistory());

    expect(insights.some((i) => i.includes("dispersión"))).toBe(false);
  });

  it("flags high dispersion when the gap is 30% or more of the cheapest price", () => {
    const medication = makeMedication([
      makePrice("cruz-verde", "Cruz Verde", 1000),
      makePrice("salcobrand", "Salcobrand", 1500), // 50% de diferencia
    ]);

    const insights = buildInsights(medication, emptyHistory());

    expect(insights).toContain("Este medicamento presenta alta dispersión de precios entre farmacias.");
  });

  it("omits the weekly-change phrase entirely when there isn't enough history", () => {
    const medication = makeMedication([makePrice("cruz-verde", "Cruz Verde", 2990)]);

    const insights = buildInsights(medication, emptyHistory({ change7dPercent: null }));

    expect(insights.some((i) => i.includes("última semana"))).toBe(false);
  });

  it("reports a price drop with 'bajó' and the rounded absolute percentage", () => {
    const medication = makeMedication([makePrice("cruz-verde", "Cruz Verde", 2990)]);

    const insights = buildInsights(medication, emptyHistory({ change7dPercent: -8.1 }));

    expect(insights[0]).toBe("El precio bajó 8% durante la última semana.");
  });

  it("reports a price increase with 'subió'", () => {
    const medication = makeMedication([makePrice("cruz-verde", "Cruz Verde", 2990)]);

    const insights = buildInsights(medication, emptyHistory({ change7dPercent: 12.4 }));

    expect(insights[0]).toBe("El precio subió 12% durante la última semana.");
  });

  it("reports stability when the weekly change is exactly zero", () => {
    const medication = makeMedication([makePrice("cruz-verde", "Cruz Verde", 2990)]);

    const insights = buildInsights(medication, emptyHistory({ change7dPercent: 0 }));

    expect(insights[0]).toBe("El precio se mantuvo estable durante la última semana.");
  });
});
