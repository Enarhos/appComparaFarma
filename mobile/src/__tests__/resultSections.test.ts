/**
 * CF-SEARCH-002 — Mobile respeta la cohorte de concentración que asignó la API.
 *
 * DEFECTO QUE CIERRA: `results.tsx` reordenaba la respuesta con un `sort` plano
 * por `bestPrice`, deshaciendo el ranking por cohorte del backend. Los datos
 * reproducen la respuesta real de producción para "ibuprofeno"
 * (`GET /api/search?q=ibuprofeno`, read-only, 2026-08-28), con sus precios.
 */
import {
  OTHER_CONCENTRATIONS_HEADER,
  buildResultListItems,
  sortWithinConcentrationCohorts,
} from "@/lib/resultSections";
import { medicationListKey } from "@/lib/medicationListKey";
import type { MedicationResult } from "@/lib/types";

function card(
  over: Partial<MedicationResult> & { canonicalName: string; bestPrice: number }
): MedicationResult {
  return {
    matchKey: "ibuprofeno|400mg|20",
    laboratory: null,
    isBioequivalent: false,
    prices: [],
    bestPharmacy: "araucomed",
    imageUrl: null,
    presentationKey: `pk:${over.canonicalName}`,
    ...over,
  };
}

/** Respuesta de la API para "ibuprofeno 600 mg", ya rankeada por el dominio. */
const seiscientos = card({
  canonicalName: "Ibuprofeno 600 Mg 20 Comp....",
  matchKey: "ibuprofeno|600mg|20",
  bestPrice: 1190,
  concentrationMatch: "exact",
});
const seiscientosCaro = card({
  canonicalName: "Ibuprofeno 600 mg 20 comprimidos recubiertos",
  matchKey: "ibuprofeno|600mg|20",
  bestPrice: 9553,
  concentrationMatch: "exact",
});
const sinDosis = card({
  canonicalName: "Ibuprofeno...",
  matchKey: "ibuprofeno",
  bestPrice: 100,
  concentrationMatch: "unknown",
});
const cuatrocientos = card({
  canonicalName: "Ibuprofeno 400 mg x 20 comp",
  bestPrice: 642,
  concentrationMatch: "other",
});
const doscientos = card({
  canonicalName: "Ibuprofeno 200 mg 20 comprimidos recubiertos",
  matchKey: "ibuprofeno|200mg|20",
  bestPrice: 1200,
  concentrationMatch: "other",
});

describe("sortWithinConcentrationCohorts", () => {
  it("[CORREGIDO QA-05] el 400 mg más barato NO pasa delante del 600 mg pedido", () => {
    const ordered = sortWithinConcentrationCohorts(
      [cuatrocientos, seiscientosCaro, seiscientos, doscientos],
      "price"
    );
    expect(ordered.map((r) => r.bestPrice)).toEqual([1190, 9553, 642, 1200]);
    // El más barato de toda la lista ($642) queda tercero: primero van las dos
    // tarjetas de la concentración pedida, incluida la de $9.553.
    expect(ordered[0].concentrationMatch).toBe("exact");
    expect(ordered[2].bestPrice).toBeLessThan(ordered[1].bestPrice);
  });

  it("respeta el orden EXACT → UNKNOWN → OTHER", () => {
    const ordered = sortWithinConcentrationCohorts(
      [doscientos, sinDosis, seiscientos, cuatrocientos],
      "price"
    );
    expect(ordered.map((r) => r.concentrationMatch)).toEqual([
      "exact",
      "unknown",
      "other",
      "other",
    ]);
  });

  it("dentro de cada cohorte manda el criterio elegido por el usuario", () => {
    const porPrecio = sortWithinConcentrationCohorts([seiscientosCaro, seiscientos], "price");
    expect(porPrecio.map((r) => r.bestPrice)).toEqual([1190, 9553]);

    const porNombre = sortWithinConcentrationCohorts([seiscientosCaro, seiscientos], "name");
    expect(porNombre.map((r) => r.canonicalName)).toEqual(
      [seiscientosCaro, seiscientos]
        .map((r) => r.canonicalName)
        .sort((a, b) => a.localeCompare(b, "es"))
    );
  });

  it("ordenar por nombre tampoco cruza el límite de cohorte", () => {
    const ordered = sortWithinConcentrationCohorts([cuatrocientos, seiscientos], "name");
    expect(ordered[0].concentrationMatch).toBe("exact");
  });

  it("sin concentración en la consulta, el orden por precio queda intacto", () => {
    // La API omite `concentrationMatch`: no hay cohortes y nada se reordena.
    const sinCohorte = [
      card({ canonicalName: "Ibuprofeno 400 mg x 20 comp", bestPrice: 642 }),
      card({ canonicalName: "Ibuprofeno 600 Mg 20 Comp....", bestPrice: 1190 }),
      card({ canonicalName: "Ibuprofeno 200 mg 20 comprimidos", bestPrice: 1200 }),
    ];
    expect(sortWithinConcentrationCohorts(sinCohorte, "price").map((r) => r.bestPrice)).toEqual([
      642, 1190, 1200,
    ]);
  });

  it("no descarta ningún resultado", () => {
    const input = [cuatrocientos, seiscientos, doscientos, sinDosis];
    expect(sortWithinConcentrationCohorts(input, "price")).toHaveLength(input.length);
  });
});

describe("buildResultListItems", () => {
  it("inserta la cabecera justo antes de la primera otra concentración", () => {
    const items = buildResultListItems([cuatrocientos, seiscientos, doscientos], "price");
    expect(items.map((i) => (typeof i === "string" ? i : i.bestPrice))).toEqual([
      1190,
      OTHER_CONCENTRATIONS_HEADER,
      642,
      1200,
    ]);
  });

  it("no inserta cabecera cuando no hay otras concentraciones", () => {
    const items = buildResultListItems([seiscientos, seiscientosCaro, sinDosis], "price");
    expect(items.some((i) => typeof i === "string")).toBe(false);
    expect(items).toHaveLength(3);
  });

  it("no inserta cabecera cuando la consulta no pidió concentración", () => {
    const items = buildResultListItems(
      [card({ canonicalName: "Ibuprofeno 400 mg", bestPrice: 642 })],
      "price"
    );
    expect(items).toHaveLength(1);
    expect(typeof items[0]).not.toBe("string");
  });

  it("la cabecera tiene una clave de lista propia y estable para la FlatList", () => {
    // `medicationListKey` ya trata los `string` como su propia clave (los
    // skeletons de carga), así que la cabecera no colisiona con ninguna
    // tarjeta ni con los placeholders `sk-*`.
    expect(medicationListKey(OTHER_CONCENTRATIONS_HEADER)).toBe(OTHER_CONCENTRATIONS_HEADER);
    expect(OTHER_CONCENTRATIONS_HEADER.startsWith("sk-")).toBe(false);
  });
});
