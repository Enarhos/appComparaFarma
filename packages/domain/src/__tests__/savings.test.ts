import { describe, it, expect } from "vitest";
import type { PharmacyPrice } from "../types.js";
import { computeSavings } from "../savings.js";

// Tests de caracterización — congelan el comportamiento actual de las 4
// implementaciones duplicadas antes de su consolidación en
// @comparafarma/domain (PR refactor/domain-compute-savings):
// mobile/src/app/medication.tsx, web/src/components/MedicationCard.tsx,
// web/src/app/medicamento/[slug]/page.tsx, y el "diff" embebido de
// web/src/lib/insights.ts. Las cuatro fueron comparadas línea por línea
// con fixtures idénticos antes de mover el código (ver informe del PR).

function price(pharmacySlug: string, pharmacyName: string, effective: number): PharmacyPrice {
  return {
    pharmacySlug: pharmacySlug as PharmacyPrice["pharmacySlug"],
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

describe("computeSavings — lista vacía / un solo precio", () => {
  it("lista vacía: cheapest y priciest son undefined, savings 0", () => {
    expect(computeSavings([])).toEqual({ cheapest: undefined, priciest: undefined, savings: 0 });
  });

  it("un solo precio: cheapest y priciest son el mismo objeto, savings 0", () => {
    const p = price("cruz-verde", "Cruz Verde", 2990);
    const result = computeSavings([p]);
    expect(result.cheapest).toBe(p);
    expect(result.priciest).toBe(p);
    expect(result.savings).toBe(0);
  });
});

describe("computeSavings — caso normal (lista ascendente)", () => {
  it("calcula la diferencia entre el primero (más barato) y el último (más caro)", () => {
    const cheap = price("easyfarma", "EasyFarma", 291);
    const mid = price("salcobrand", "Salcobrand", 500);
    const expensive = price("cruz-verde", "Cruz Verde", 840);
    const result = computeSavings([cheap, mid, expensive]);
    expect(result.cheapest).toBe(cheap);
    expect(result.priciest).toBe(expensive);
    expect(result.savings).toBe(549); // 840 - 291
  });

  it("con 2 precios distintos, el ahorro es la resta directa", () => {
    const cheap = price("cruz-verde", "Cruz Verde", 2990);
    const expensive = price("salcobrand", "Salcobrand", 3290);
    const result = computeSavings([cheap, expensive]);
    expect(result.savings).toBe(300);
  });
});

describe("computeSavings — empate de precio (mismo valor, distinto objeto)", () => {
  it("dos precios con el mismo valor numérico: cheapest !== priciest, pero savings es 0", () => {
    const a = price("cruz-verde", "Cruz Verde", 1000);
    const b = price("salcobrand", "Salcobrand", 1000);
    const result = computeSavings([a, b]);
    expect(result.cheapest).toBe(a);
    expect(result.priciest).toBe(b);
    expect(result.cheapest).not.toBe(result.priciest); // objetos distintos
    expect(result.savings).toBe(0); // valor numérico igual
  });
});

describe("computeSavings — no ordena ni filtra: preserva el orden que reciba", () => {
  it("si el array llega en orden descendente (ej. toggle de UI en Mobile), el 'savings' da negativo", () => {
    // Este es el comportamiento EXACTO y ya existente de
    // mobile/src/app/medication.tsx cuando el usuario cambia el orden a
    // "precio descendente": cheapest/priciest quedan invertidos y
    // `savings` es negativo. Se conserva intacto — no es un bug a
    // corregir en este PR, solo una consecuencia de que la función no
    // reordena su entrada.
    const cheap = price("easyfarma", "EasyFarma", 291);
    const mid = price("salcobrand", "Salcobrand", 500);
    const expensive = price("cruz-verde", "Cruz Verde", 840);
    const descending = [expensive, mid, cheap];

    const result = computeSavings(descending);

    expect(result.cheapest).toBe(expensive); // primero del array, no el más barato real
    expect(result.priciest).toBe(cheap); // último del array, no el más caro real
    expect(result.savings).toBe(-549); // negativo: -(840 - 291)
  });

  it("no reordena por valor: si el llamador ya filtró farmacias, opera solo sobre esa sublista", () => {
    // Equivalente a mobile/medication.tsx operando sobre `activePrices`
    // (filtrado por farmacias activas/visibles) en vez de todos los
    // precios del medicamento.
    const visible = [price("easyfarma", "EasyFarma", 291), price("salcobrand", "Salcobrand", 500)];
    const result = computeSavings(visible);
    expect(result.savings).toBe(209); // 500 - 291, ignora cualquier precio fuera de esta sublista
  });
});

describe("computeSavings — valores extremos", () => {
  it("precio en 0 es válido: no se trata como 'faltante'", () => {
    const free = price("cruz-verde", "Cruz Verde", 0);
    const expensive = price("salcobrand", "Salcobrand", 500);
    const result = computeSavings([free, expensive]);
    expect(result.savings).toBe(500);
  });

  it("precios grandes no pierden precisión (números enteros CLP)", () => {
    const cheap = price("cruz-verde", "Cruz Verde", 15000);
    const expensive = price("salcobrand", "Salcobrand", 9999990);
    const result = computeSavings([cheap, expensive]);
    expect(result.savings).toBe(9984990);
  });
});
