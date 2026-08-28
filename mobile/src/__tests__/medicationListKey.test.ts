/**
 * CF-SEARCH-001 (QA-02) — la FlatList de resultados se indexa por
 * `presentationKey`, no por `matchKey`.
 *
 * Los datos reproducen la respuesta real de producción para "tapsin"
 * (`GET /api/search?q=tapsin`, read-only, 2026-08-27): dos tarjetas distintas
 * con el MISMO `matchKey` (`tapsin|6`), que es exactamente lo que produce el
 * split de esta branch.
 */
import { medicationListKey } from "@/lib/medicationListKey";
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

describe("medicationListKey", () => {
  it("da claves DISTINTAS a dos tarjetas del mismo matchKey separadas por el split", () => {
    expect(eco.matchKey).toBe(araucomed.matchKey);
    expect(medicationListKey(eco)).not.toBe(medicationListKey(araucomed));
  });

  it("[regresión] indexar por matchKey producía claves duplicadas en la misma lista", () => {
    // Comportamiento anterior al fix, dejado explícito: el keyExtractor
    // devolvía la misma clave de React para dos filas visibles distintas.
    const legacyKeys = [eco, araucomed].map((item) => item.matchKey);
    expect(new Set(legacyKeys).size).toBe(1);

    const keys = [eco, araucomed].map(medicationListKey);
    expect(new Set(keys).size).toBe(2);
  });

  it("usa presentationKey como clave primaria", () => {
    expect(medicationListKey(araucomed)).toBe(araucomed.presentationKey);
  });

  it("cae a matchKey si presentationKey llega vacío (caché anterior al campo)", () => {
    expect(medicationListKey(card({ presentationKey: "" }))).toBe("tapsin|6");
    expect(
      medicationListKey({ ...card({ presentationKey: "" }), presentationKey: undefined as unknown as string })
    ).toBe("tapsin|6");
  });

  it("deja pasar tal cual las claves de los skeletons de carga", () => {
    expect(medicationListKey("sk-0")).toBe("sk-0");
  });
});
