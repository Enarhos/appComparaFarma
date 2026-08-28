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
import { isAllowedRedirectUrl } from "../lib/clickTracking.js";

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

  it("preserva resultados bio, no bio y unknown/null en la respuesta de busqueda", async () => {
    mocks.searchCruzVerde.mockResolvedValue([
      makeProduct("Paracetamol 500 mg 16 Comprimidos Bioequivalente", 840, null, true),
    ]);
    mocks.searchSalcobrand.mockResolvedValue([
      makeProduct("Paracetamol 500mg 16 Comprimidos", 1299, null, false),
    ]);
    mocks.searchAhumada.mockResolvedValue([
      makeProduct("Paracetamol 500 mg 16 comprimidos", 900, null, null),
    ]);
    mocks.searchDrSimi.mockResolvedValue([]);
    mocks.searchAraucoMed.mockResolvedValue([]);
    mocks.searchEcoFarmacias.mockResolvedValue([]);
    mocks.searchFarmex.mockResolvedValue([]);
    mocks.searchSermecoop.mockResolvedValue([]);
    mocks.searchEasyFarma.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("paracetamol");

    expect(execution.results).toHaveLength(3);
    expect(execution.results.map((result) => result.isBioequivalent)).toEqual([true, null, false]);
    expect(execution.results.filter((result) => result.isBioequivalent === true)).toHaveLength(1);
  });

  it("FASE 1 — Product Identity: Ascend/CuraeSpring/OPKO comparten matchKey+bio pero NO se fusionan (auditoría P0 Omeprazol, 2026-08-19)", async () => {
    mocks.searchFarmex.mockResolvedValue([
      makeProduct("Omeprazol 20 mg x 30 cápsulas", 990, null, false, "OPKO"),
    ]);
    mocks.searchCruzVerde.mockResolvedValue([
      makeProduct("Omeprazol 20 mg 30 Cápsulas con Gránulos", 2690, null, false, "CuraeSpring"),
    ]);
    mocks.searchEasyFarma.mockResolvedValue([
      makeProduct(
        "Omeprazol 20 mg x 30 cap...",
        1490,
        null,
        false,
        null,
        "https://nuevo.easyfarma.cl/104320-omeprazol-20-mg-x-30-cap-lab-ascend.html"
      ),
    ]);
    mocks.searchSalcobrand.mockResolvedValue([]);
    mocks.searchAhumada.mockResolvedValue([]);
    mocks.searchDrSimi.mockResolvedValue([]);
    mocks.searchAraucoMed.mockResolvedValue([]);
    mocks.searchEcoFarmacias.mockResolvedValue([]);
    mocks.searchSermecoop.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("omeprazol");

    expect(execution.results).toHaveLength(3);
    const byPharmacy = Object.fromEntries(
      execution.results.map((r) => [r.prices[0]?.pharmacySlug, r])
    );
    expect(byPharmacy["farmex"].prices).toHaveLength(1);
    expect(byPharmacy["cruz-verde"].prices).toHaveLength(1);
    expect(byPharmacy["easyfarma"].prices).toHaveLength(1);
    // matchKey se mantiene idéntico (identidad farmacológica amplia, sin cambios)
    expect(new Set(execution.results.map((r) => r.matchKey)).size).toBe(1);
    // presentationKey sí distingue las tres marcas
    expect(new Set(execution.results.map((r) => r.presentationKey)).size).toBe(3);
  });

  it("CF-SEARCH-001: una URL que no pertenece a la farmacia se descarta en la ingesta", async () => {
    // AraucoMed, EcoFarmacias y EasyFarma toman la URL COMPLETA de su fuente
    // externa (campo `url` del JSON de PrestaShop, `permalink` de WordPress,
    // href del HTML scrapeado) — un cambio de feed puede introducir un enlace
    // a otro sitio sin que ningún parser falle. La oferta se conserva (el
    // precio es válido); lo que se anula es el enlace.
    mocks.searchAraucoMed.mockResolvedValue([
      makeProduct(
        "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
        500,
        null,
        false,
        "Maver",
        "https://www.ecofarmacias.cl/producto/tapsin-x-6/"
      ),
    ]);
    mocks.searchEcoFarmacias.mockResolvedValue([
      makeProduct(
        "Tapsin X 6 Comprimidos (Maver)",
        460,
        null,
        false,
        "Maver",
        "https://www.ecofarmacias.cl/producto/tapsin-x-6/"
      ),
    ]);
    mocks.searchCruzVerde.mockResolvedValue([]);
    mocks.searchSalcobrand.mockResolvedValue([]);
    mocks.searchAhumada.mockResolvedValue([]);
    mocks.searchDrSimi.mockResolvedValue([]);
    mocks.searchFarmex.mockResolvedValue([]);
    mocks.searchSermecoop.mockResolvedValue([]);
    mocks.searchEasyFarma.mockResolvedValue([]);

    const execution = await searchMedicationsDetailed("tapsin");

    // Dos productos comerciales distintos: NO se fusionan (CF-SEARCH-001).
    expect(execution.results).toHaveLength(2);

    const prices = execution.results.flatMap((result) => result.prices);
    const araucomedPrice = prices.find((price) => price.pharmacySlug === "araucomed")!;
    const ecoPrice = prices.find((price) => price.pharmacySlug === "ecofarmacias")!;

    expect(araucomedPrice.onlineUrl).toBeNull();
    expect(ecoPrice.onlineUrl).toBe("https://www.ecofarmacias.cl/producto/tapsin-x-6/");

    // Invariante de integridad de oferta: ninguna URL de la respuesta apunta a
    // un dominio distinto del de su propia farmacia.
    for (const result of execution.results) {
      for (const price of result.prices) {
        if (!price.onlineUrl) continue;
        expect(isAllowedRedirectUrl(price.pharmacySlug, price.onlineUrl)).toBe(true);
      }
    }
  });
});

function makeProduct(
  name: string,
  price: number,
  onlinePrice: number | null = null,
  isBioequivalent: boolean | null = false,
  laboratory: string | null = null,
  onlineUrl: string | null = null
): ScrapedProduct {
  return {
    name,
    price,
    onlinePrice,
    cmrPrice: null,
    sbpayPrice: null,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl,
    imageUrl: null,
    laboratory,
    isBioequivalent,
  };
}
