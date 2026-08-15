import { describe, it, expect } from "vitest";
import type { MedicationResult, PharmacyPrice, PharmacySlug } from "../types.js";
import { computeAllInOneTotals } from "../basket.js";

// Tests de caracterización — congelan el comportamiento actual de
// mobile/src/app/cart.tsx::calcTotals() y
// web/src/lib/recipeComparison.ts::computeAllInOneTotals() antes de su
// consolidación en @comparafarma/domain (PR refactor/domain-cart-totals).
// Verificados contra ambas implementaciones originales con fixtures
// idénticos antes de mover el código (ver informe del PR).

function price(pharmacySlug: PharmacySlug, pharmacyName: string, effective: number, hasStock = true): PharmacyPrice {
  return {
    pharmacySlug,
    pharmacyName,
    productName: "producto de prueba",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock,
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
    bestPharmacy: cheapest?.pharmacySlug ?? "cruz-verde",
    imageUrl: null,
  };
}

describe("computeAllInOneTotals — universo derivado de los precios (modo web)", () => {
  it("canasta vacía devuelve un array vacío", () => {
    expect(computeAllInOneTotals([])).toEqual([]);
  });

  it("1 medicamento, 1 farmacia", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 1000)])];
    expect(computeAllInOneTotals(meds)).toEqual([
      { pharmacySlug: "cruz-verde", pharmacyName: "Cruz Verde", total: 1000, found: 1, missing: 0 },
    ]);
  });

  it("suma el precio efectivo por farmacia a través de varios medicamentos", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 1200)]),
      medication("b", [price("cruz-verde", "Cruz Verde", 500), price("salcobrand", "Salcobrand", 300)]),
    ];
    const totals = computeAllInOneTotals(meds);
    expect(totals.find((t) => t.pharmacySlug === "cruz-verde")).toMatchObject({ total: 1500, found: 2, missing: 0 });
    expect(totals.find((t) => t.pharmacySlug === "salcobrand")).toMatchObject({ total: 1500, found: 2, missing: 0 });
  });

  it("farmacia con cobertura completa siempre antes que una parcial, sin importar el total", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 100), price("salcobrand", "Salcobrand", 100)]),
      medication("b", [price("salcobrand", "Salcobrand", 100)]), // cruz-verde no la tiene
    ];
    const totals = computeAllInOneTotals(meds);
    expect(totals[0]).toMatchObject({ pharmacySlug: "salcobrand", missing: 0 });
    expect(totals[1]).toMatchObject({ pharmacySlug: "cruz-verde", missing: 1, found: 1 });
  });

  it("farmacias con cobertura completa se ordenan por total ascendente", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 2000), price("salcobrand", "Salcobrand", 1000)])];
    expect(computeAllInOneTotals(meds).map((t) => t.pharmacySlug)).toEqual(["salcobrand", "cruz-verde"]);
  });

  it("excluye farmacias que no tienen ninguno de los medicamentos", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 100)])];
    expect(computeAllInOneTotals(meds).every((t) => t.found > 0)).toBe(true);
  });

  it("en empate de total, conserva el orden de aparición (sort estable)", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 1000)])];
    expect(computeAllInOneTotals(meds).map((t) => t.pharmacySlug)).toEqual(["cruz-verde", "salcobrand"]);
  });

  it("no filtra por hasStock — una farmacia sin stock igual entra al total", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 100, false)])];
    expect(computeAllInOneTotals(meds)).toEqual([
      { pharmacySlug: "cruz-verde", pharmacyName: "Cruz Verde", total: 100, found: 1, missing: 0 },
    ]);
  });

  it("no deduplica: si el mismo matchKey aparece dos veces en la lista, se suma dos veces", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 100)]),
      medication("a", [price("cruz-verde", "Cruz Verde", 100)]),
    ];
    expect(computeAllInOneTotals(meds)).toEqual([
      { pharmacySlug: "cruz-verde", pharmacyName: "Cruz Verde", total: 200, found: 2, missing: 0 },
    ]);
  });

  it("varias farmacias completas: ordena todas por total ascendente", () => {
    const meds = [
      medication("a", [
        price("cruz-verde", "Cruz Verde", 900),
        price("salcobrand", "Salcobrand", 300),
        price("ahumada", "Farmacias Ahumada", 600),
      ]),
    ];
    expect(computeAllInOneTotals(meds).map((t) => t.pharmacySlug)).toEqual(["salcobrand", "ahumada", "cruz-verde"]);
  });
});

describe("computeAllInOneTotals — universo explícito por parámetro (modo mobile)", () => {
  it("evalúa solo las farmacias de la whitelist, no todas las que aparecen en los precios", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 500), price("salcobrand", "Salcobrand", 300)])];
    const totals = computeAllInOneTotals(meds, ["cruz-verde"]);
    expect(totals).toEqual([{ pharmacySlug: "cruz-verde", pharmacyName: "Cruz Verde", total: 500, found: 1, missing: 0 }]);
  });

  it("una farmacia de la whitelist que no tiene ningún medicamento queda excluida (found=0)", () => {
    const meds = [medication("a", [price("cruz-verde", "Cruz Verde", 500)])];
    const totals = computeAllInOneTotals(meds, ["cruz-verde", "salcobrand", "ahumada"]);
    expect(totals).toEqual([{ pharmacySlug: "cruz-verde", pharmacyName: "Cruz Verde", total: 500, found: 1, missing: 0 }]);
  });

  it("con whitelist explícita, produce el mismo resultado que el modo derivado si coincide con las farmacias presentes", () => {
    const meds = [
      medication("a", [price("cruz-verde", "Cruz Verde", 1000), price("salcobrand", "Salcobrand", 1200)]),
      medication("b", [price("cruz-verde", "Cruz Verde", 500), price("salcobrand", "Salcobrand", 300)]),
    ];
    const derived = computeAllInOneTotals(meds);
    const explicit = computeAllInOneTotals(meds, ["cruz-verde", "salcobrand"]);
    expect(explicit).toEqual(derived);
  });

  it("canasta vacía con whitelist explícita devuelve un array vacío (todas quedan con found=0)", () => {
    expect(computeAllInOneTotals([], ["cruz-verde", "salcobrand"])).toEqual([]);
  });
});
