import { describe, expect, it } from "vitest";
import type { ScrapedProduct } from "../types.js";
import { effectivePrice, sortByEffectivePrice, toMedicationResult, toPharmacyPrice } from "../pricing.js";
import type { PharmacyPrice } from "../types.js";

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
  brand: null,
  manufacturer: null,
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


// Tests de caracterización — congelan el comportamiento actual de las
// implementaciones duplicadas antes de su consolidación en
// @comparafarma/domain (Domain Consolidation v4, PR
// refactor/domain-sort-effective-price): web/MedicationCard.tsx,
// web/medicamento/[slug]/page.tsx, web/insights.ts,
// web/recipeComparison.ts::computeSplitTotal(), y (por equivalencia
// demostrada) mobile/MedicationListItem.tsx.
function price(pharmacySlug: string, effective: number): PharmacyPrice {
  return {
    pharmacySlug: pharmacySlug as PharmacyPrice["pharmacySlug"],
    pharmacyName: pharmacySlug,
    productName: "producto de prueba",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock: true,
    hasOnlineDelivery: false,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-07-31T00:00:00.000Z",
  };
}

describe("sortByEffectivePrice", () => {
  it("array vacío devuelve un array vacío", () => {
    expect(sortByEffectivePrice([])).toEqual([]);
  });

  it("un elemento: devuelve un array de un elemento", () => {
    const a = price("cruz-verde", 500);
    expect(sortByEffectivePrice([a])).toEqual([a]);
  });

  it("dos elementos: ordena ascendente", () => {
    const cheap = price("easyfarma", 291);
    const expensive = price("cruz-verde", 840);
    expect(sortByEffectivePrice([expensive, cheap])).toEqual([cheap, expensive]);
  });

  it("múltiples elementos: ordena ascendente por channels.effective", () => {
    const a = price("cruz-verde", 900);
    const b = price("salcobrand", 300);
    const c = price("ahumada", 600);
    expect(sortByEffectivePrice([a, b, c])).toEqual([b, c, a]);
  });

  it("empate de effective: conserva el orden de aparición original (sort estable)", () => {
    const a = price("cruz-verde", 300);
    const b = price("salcobrand", 300);
    const c = price("ahumada", 100);
    const result = sortByEffectivePrice([a, b, c]);
    expect(result).toEqual([c, a, b]); // a antes que b: mismo valor, pero a apareció primero
  });

  it("empate de effective en otro orden de entrada: sigue respetando el orden de aparición", () => {
    const a = price("cruz-verde", 300);
    const b = price("salcobrand", 300);
    const result = sortByEffectivePrice([b, a]);
    expect(result).toEqual([b, a]); // b apareció primero en la entrada
  });

  it("valores en cero: no se tratan como faltantes", () => {
    const free = price("cruz-verde", 0);
    const paid = price("salcobrand", 500);
    expect(sortByEffectivePrice([paid, free])).toEqual([free, paid]);
  });

  it("valores grandes: ordena correctamente sin perder precisión", () => {
    const cheap = price("cruz-verde", 15000);
    const expensive = price("salcobrand", 9999990);
    expect(sortByEffectivePrice([expensive, cheap])).toEqual([cheap, expensive]);
  });

  it("no muta el array original", () => {
    const a = price("cruz-verde", 900);
    const b = price("salcobrand", 300);
    const original = [a, b];
    const originalCopy = [...original];
    sortByEffectivePrice(original);
    expect(original).toEqual(originalCopy);
    expect(original[0]).toBe(a); // el array original conserva su orden y sus objetos
    expect(original[1]).toBe(b);
  });

  it("no filtra ni deduplica: conserva todos los elementos, incluso repetidos", () => {
    const a = price("cruz-verde", 500);
    const result = sortByEffectivePrice([a, a]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(a);
    expect(result[1]).toBe(a);
  });
});
