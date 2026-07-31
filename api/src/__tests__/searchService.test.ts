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
  searchEasyFarma: vi.fn<() => Promise<ScrapedProduct[]>>(),
}));

vi.mock("../clients/cruzverde.js", () => ({ searchCruzVerde: mocks.searchCruzVerde }));
vi.mock("../clients/salcobrand.js", () => ({ searchSalcobrand: mocks.searchSalcobrand }));
vi.mock("../clients/ahumada.js", () => ({ searchAhumada: mocks.searchAhumada }));
vi.mock("../clients/drsimi.js", () => ({ searchDrSimi: mocks.searchDrSimi }));
vi.mock("../clients/araucomed.js", () => ({ searchAraucoMed: mocks.searchAraucoMed }));
vi.mock("../clients/ecofarmacias.js", () => ({ searchEcoFarmacias: mocks.searchEcoFarmacias }));
vi.mock("../clients/farmex.js", () => ({ searchFarmex: mocks.searchFarmex }));
vi.mock("../clients/sermecoop.js", () => ({ searchSermecoop: mocks.searchSermecoop }));
vi.mock("../clients/easyfarma.js", () => ({ searchEasyFarma: mocks.searchEasyFarma }));
// RFC-002: Supabase ausente en este test suite (no se mockea supabaseClient),
// así que attachCanonicalIds() y recordPriceHistory() degradan a no-op —
// exactamente el camino que ejercita "sin Supabase configurado".

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
    mocks.searchEasyFarma.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("paracetamol");

    expect(execution.results.length).toBeGreaterThan(0);
    expect(execution.diagnostics.query).toBe("paracetamol");
    expect(execution.diagnostics.pharmacies).toHaveLength(9);
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

  it("RFC-002: sin Supabase configurado, cada resultado incluye cfmId:null sin cambiar ningún otro campo", async () => {
    mocks.searchCruzVerde.mockResolvedValue([makeProduct("Paracetamol 500 mg 16 Comprimidos", 840)]);
    mocks.searchSalcobrand.mockResolvedValue([]);
    mocks.searchAhumada.mockResolvedValue([]);
    mocks.searchDrSimi.mockResolvedValue([]);
    mocks.searchAraucoMed.mockResolvedValue([]);
    mocks.searchEcoFarmacias.mockResolvedValue([]);
    mocks.searchFarmex.mockResolvedValue([]);
    mocks.searchSermecoop.mockResolvedValue([]);
    mocks.searchEasyFarma.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("paracetamol");

    expect(execution.results).toHaveLength(1);
    expect(execution.results[0].cfmId).toBeNull();
    expect(execution.results[0]).toMatchObject({
      canonicalName: expect.any(String),
      bestPrice: 840,
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
