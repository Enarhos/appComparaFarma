import { describe, expect, it } from "vitest";
import type { ScrapedProduct } from "../types.js";
import { effectivePrice, toMedicationResult, toPharmacyPrice } from "../pricing.js";

const baseProduct: ScrapedProduct = {
  name: "Paracetamol 500mg x 16 Comprimidos",
  price: 1000,
  onlinePrice: null,
  cmrPrice: null,
  sbpayPrice: null,
  hasStock: true,
  hasOnlineDelivery: false,
  onlineUrl: null,
  imageUrl: null,
  laboratory: null,
  isBioequivalent: false,
};

describe("effectivePrice", () => {
  it("retorna store cuando no hay otros canales", () => {
    expect(effectivePrice({ store: 1000, online: null, cmr: null, sbpay: null })).toBe(1000);
  });

  it("retorna online cuando es más barato que store", () => {
    expect(effectivePrice({ store: 1000, online: 800, cmr: null, sbpay: null })).toBe(800);
  });

  it("retorna cmr cuando es más barato", () => {
    expect(effectivePrice({ store: 1000, online: null, cmr: 750, sbpay: null })).toBe(750);
  });

  it("retorna sbpay cuando es más barato", () => {
    expect(effectivePrice({ store: 1000, online: null, cmr: null, sbpay: 700 })).toBe(700);
  });
});

describe("toPharmacyPrice", () => {
  it("calcula channels.effective con el canal más barato", () => {
    const product = { ...baseProduct, onlinePrice: 800 };
    const result = toPharmacyPrice(product, "salcobrand", "Salcobrand");
    expect(result.channels.effective).toBe(800);
  });

  it("mapea campos desde ScrapedProduct", () => {
    const product = { ...baseProduct, hasStock: false, imageUrl: "https://example.com/img.png" };
    const result = toPharmacyPrice(product, "cruz-verde", "Cruz Verde");
    expect(result.pharmacySlug).toBe("cruz-verde");
    expect(result.pharmacyName).toBe("Cruz Verde");
    expect(result.productName).toBe(baseProduct.name);
    expect(result.hasStock).toBe(false);
    expect(result.imageUrl).toBe("https://example.com/img.png");
  });
});

describe("toMedicationResult", () => {
  it("genera matchKey desde el nombre del producto", () => {
    const result = toMedicationResult(baseProduct, "ahumada", "Farmacias Ahumada");
    expect(result.matchKey).toBe("paracetamol|500mg|16");
  });

  it("asigna bestPrice y bestPharmacy correctamente", () => {
    const product = { ...baseProduct, onlinePrice: 800 };
    const result = toMedicationResult(product, "salcobrand", "Salcobrand");
    expect(result.bestPrice).toBe(800);
    expect(result.bestPharmacy).toBe("salcobrand");
  });
});
