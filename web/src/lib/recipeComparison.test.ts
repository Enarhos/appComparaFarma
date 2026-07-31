import { describe, it, expect } from "vitest";
import type { MedicationResult, PharmacyPrice, PharmacySlug } from "@comparafarma/domain";
import { computeAllInOneTotals, computeSplitTotal, compareOptions } from "./recipeComparison";

function price(pharmacySlug: PharmacySlug, pharmacyName: string, effective: number): PharmacyPrice {
  return {
    pharmacySlug,
    pharmacyName,
    productName: "producto de prueba",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock: true,
    hasOnlineDelivery: false,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-07-31T00:00:00.000Z",
  };
}

function medication(matchKey: string, prices: PharmacyPrice[]): MedicationResult {
  const cheapest = [...prices].sort((a, b) => a.channels.effective - b.channels.effective)[0];
  return {
    matchKey,
    canonicalName: `Medicamento ${matchKey}`,
    laboratory: null,
    isBioequivalent: false,
    prices,
    bestPrice: cheapest?.channels.effective ?? 0,
    bestPharmacy: cheapest?.pharmacySlug ?? "",
    imageUrl: null,
  };
}

describe("computeAllInOneTotals", () => {
  it("sums the effective price per pharmacy across all medications", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 1200)]),
      medication("b", [price("cruz-verde", "Cruz Verde", 500), price("salcobrand", "Salcobrand", 300)]),
    ];

    const totals = computeAllInOneTotals(meds);

    const cruzVerde = totals.find((t) => t.pharmacySlug === "cruz-verde");
    const salcobrand = totals.find((t) => t.pharmacySlug === "salcobrand");
    expect(cruzVerde).toMatchObject({ total: 1500, found: 2, missing: 0 });
    expect(salcobrand).toMatchObject({ total: 1500, found: 2, missing: 0 });
  });

  it("ranks pharmacies with full coverage before partial coverage, regardless of total", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 100), price("salcobrand", "Salcobrand", 100)]),
      medication("b", [price("salcobrand", "Salcobrand", 100)]), // cruz-verde no la tiene
    ];

    const totals = computeAllInOneTotals(meds);

    expect(totals[0]).toMatchObject({ pharmacySlug: "salcobrand", missing: 0 });
    expect(totals[1]).toMatchObject({ pharmacySlug: "cruz-verde", missing: 1, found: 1 });
  });

  it("orders full-coverage pharmacies by total ascending", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 2000), price("salcobrand", "Salcobrand", 1000)]),
    ];

    const totals = computeAllInOneTotals(meds);

    expect(totals.map((t) => t.pharmacySlug)).toEqual(["salcobrand", "cruz-verde"]);
  });

  it("excludes pharmacies that carry none of the medications", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 100)])];
    const totals = computeAllInOneTotals(meds);
    expect(totals.every((t) => t.found > 0)).toBe(true);
  });
});

describe("computeSplitTotal", () => {
  it("picks the cheapest pharmacy per medication and sums the minimums", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 700)]),
      medication("b", [price("cruz-verde", "Cruz Verde", 200), price("salcobrand", "Salcobrand", 300)]),
    ];

    const { breakdown, total } = computeSplitTotal(meds);

    expect(total).toBe(900); // 700 (salcobrand) + 200 (cruz-verde)
    expect(breakdown).toEqual([
      expect.objectContaining({ matchKey: "a", pharmacySlug: "salcobrand", price: 700 }),
      expect.objectContaining({ matchKey: "b", pharmacySlug: "cruz-verde", price: 200 }),
    ]);
  });

  it("breaks ties by keeping the first pharmacy found with the minimum price", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 500), price("salcobrand", "Salcobrand", 500)])];
    const { breakdown } = computeSplitTotal(meds);
    expect(breakdown[0].pharmacySlug).toBe("cruz-verde");
  });

  it("skips medications with no prices at all instead of throwing", () => {
    const meds = [medication("a", [])];
    const { breakdown, total } = computeSplitTotal(meds);
    expect(breakdown).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("compareOptions", () => {
  it("computes savings as the difference between the best all-in-one total and the split total", () => {
    const allInOne = computeAllInOneTotals([
      medication("a", [price("cruz-verde", "Cruz Verde", 1000)]),
      medication("b", [price("cruz-verde", "Cruz Verde", 500)]),
    ]);
    const { savings, bestAllInOneTotal } = compareOptions(allInOne, 900);
    expect(bestAllInOneTotal).toBe(1500);
    expect(savings).toBe(600);
  });

  it("returns null savings when no pharmacy has full coverage", () => {
    const allInOne = computeAllInOneTotals([
      medication("a", [price("cruz-verde", "Cruz Verde", 100)]),
      medication("b", [price("salcobrand", "Salcobrand", 100)]),
    ]);
    const { savings, bestAllInOneTotal } = compareOptions(allInOne, 200);
    expect(bestAllInOneTotal).toBeNull();
    expect(savings).toBeNull();
  });
});
