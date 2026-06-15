import { describe, expect, it, vi, beforeEach } from "vitest";

import type { ScrapedProduct } from "../lib/types.js";

const mocks = vi.hoisted(() => ({
  searchCruzVerde: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchSalcobrand: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchAhumada: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchDrSimi: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchAraucoMed: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchEcoFarmacias: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchFarmex: vi.fn<() => Promise<ScrapedProduct[]>>(),
  searchSermecoop: vi.fn<() => Promise<ScrapedProduct[]>>(),
}));

vi.mock("../clients/cruzverde.js", () => ({ searchCruzVerde: mocks.searchCruzVerde }));
vi.mock("../clients/salcobrand.js", () => ({ searchSalcobrand: mocks.searchSalcobrand }));
vi.mock("../clients/ahumada.js", () => ({ searchAhumada: mocks.searchAhumada }));
vi.mock("../clients/drsimi.js", () => ({ searchDrSimi: mocks.searchDrSimi }));
vi.mock("../clients/araucomed.js", () => ({ searchAraucoMed: mocks.searchAraucoMed }));
vi.mock("../clients/ecofarmacias.js", () => ({ searchEcoFarmacias: mocks.searchEcoFarmacias }));
vi.mock("../clients/farmex.js", () => ({ searchFarmex: mocks.searchFarmex }));
vi.mock("../clients/sermecoop.js", () => ({ searchSermecoop: mocks.searchSermecoop }));

import { searchMedicationsDetailed } from "../services/searchService.js";

describe("searchMedicationsDetailed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns diagnostics per pharmacy and keeps partial success", async () => {
    mocks.searchCruzVerde.mockResolvedValue([makeProduct("Paracetamol 500 mg 16 Comprimidos", 840)]);
    mocks.searchSalcobrand.mockResolvedValue([makeProduct("Paracetamol 500mg 16 Comprimidos", 1299, 1143)]);
    mocks.searchAhumada.mockRejectedValue(new Error("timeout"));
    mocks.searchDrSimi.mockResolvedValue([makeProduct("Paracetamol 500 mg 16 comprimidos", 480)]);
    mocks.searchAraucoMed.mockResolvedValue([]);
    mocks.searchEcoFarmacias.mockResolvedValue([]);
    mocks.searchFarmex.mockResolvedValue([]);
    mocks.searchSermecoop.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("paracetamol");

    expect(execution.results.length).toBeGreaterThan(0);
    expect(execution.diagnostics.query).toBe("paracetamol");
    expect(execution.diagnostics.pharmacies).toHaveLength(8);
    expect(execution.diagnostics.pharmacies.find((item) => item.pharmacySlug === "ahumada")).toMatchObject({
      status: "rejected",
      resultCount: 0,
      errorMessage: "timeout",
    });
    expect(execution.diagnostics.pharmacies.find((item) => item.pharmacySlug === "dr-simi")).toMatchObject({
      status: "fulfilled",
      resultCount: 1,
    });
  });
});

function makeProduct(name: string, price: number, onlinePrice: number | null = null): ScrapedProduct {
  return {
    name,
    price,
    onlinePrice,
    cmrPrice: null,
    sbpayPrice: null,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    laboratory: null,
    isBioequivalent: false,
  };
}
