/**
 * CF-SEARCH-001 — la ficha se resuelve por `presentationKey`, no por `matchKey`.
 *
 * Los datos reproducen la respuesta real de producción para "tapsin"
 * (`GET /api/search?q=tapsin`, read-only, 2026-08-27): dos tarjetas distintas
 * con el MISMO `matchKey` (`tapsin|6`), ordenadas por precio ascendente.
 */
import { resolveMedicationCard } from "@/lib/resolveMedicationCard";
import type { MedicationResult } from "@/lib/types";

function card(over: Partial<MedicationResult> & { presentationKey: string }): MedicationResult {
  return {
    matchKey: "tapsin|6",
    canonicalName: "Tapsin",
    laboratory: "Maver",
    isBioequivalent: false,
    prices: [],
    bestPrice: 0,
    bestPharmacy: "ecofarmacias",
    imageUrl: null,
    ...over,
  };
}

const eco = card({
  canonicalName: "Tapsin X 6 Comprimidos (Maver)",
  bestPrice: 460,
  bestPharmacy: "ecofarmacias",
  presentationKey: "tapsin|6|bio:false|brand:maver|form:solid-oral",
});

const araucomed = card({
  canonicalName: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
  bestPrice: 500,
  bestPharmacy: "araucomed",
  presentationKey: "tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral",
});

// La lista llega ordenada por precio ascendente, igual que en la app.
const results = [eco, araucomed];

describe("resolveMedicationCard", () => {
  it("abre la tarjeta tocada aunque comparta matchKey con una más barata", () => {
    const resolved = resolveMedicationCard(results, {
      presentationKey: araucomed.presentationKey,
      matchKey: araucomed.matchKey,
    });
    expect(resolved).toBe(araucomed);
  });

  it("[regresión] resolver solo por matchKey devolvía la tarjeta equivocada", () => {
    // Comportamiento anterior al fix, dejado explícito: `find` por matchKey
    // devuelve la PRIMERA coincidencia — la más barata, de otra farmacia.
    expect(results.find((r) => r.matchKey === araucomed.matchKey)).toBe(eco);
    expect(results.find((r) => r.matchKey === araucomed.matchKey)).not.toBe(araucomed);
  });

  it("cae a matchKey cuando no se envía presentationKey (favoritos desde el home)", () => {
    expect(resolveMedicationCard([araucomed], { matchKey: "tapsin|6" })).toBe(araucomed);
  });

  it("cae a matchKey cuando el presentationKey ya no existe en los resultados actuales", () => {
    const resolved = resolveMedicationCard(results, {
      presentationKey: "tapsin|6|bio:false|brand:maver|var:obsoleta",
      matchKey: "tapsin|6",
    });
    expect(resolved).toBe(eco);
  });

  it("devuelve undefined cuando no hay nada que resolver", () => {
    expect(resolveMedicationCard(results, {})).toBeUndefined();
    expect(resolveMedicationCard([], { presentationKey: "x", matchKey: "y" })).toBeUndefined();
  });
});
