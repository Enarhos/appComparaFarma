import { describe, it, expect } from "vitest";
import type { MedicationResult, PharmacyPrice } from "@comparafarma/domain";
import {
  groupMedicationResultsByMatchKey,
  sortCommercialProducts,
  buildGroupTitle,
  buildGroupImageUrl,
  computeRemainingOptions,
  rowVisibilityClassName,
  splitGroupsByConcentration,
} from "./groupMedicationResults";

function price(overrides: Partial<PharmacyPrice> = {}): PharmacyPrice {
  return {
    pharmacySlug: "easyfarma",
    pharmacyName: "EasyFarma",
    productName: "Producto",
    channels: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2026-08-19T00:00:00.000Z",
    ...overrides,
  };
}

function medication(overrides: Partial<MedicationResult> = {}): MedicationResult {
  return {
    matchKey: "omeprazol|20mg|30",
    canonicalName: "Omeprazol 20 mg x 30 cápsulas",
    laboratory: null,
    brand: null,
    manufacturer: null,
    activeIngredient: null,
    brandSource: "unknown",
    isBioequivalent: null,
    prices: [price()],
    bestPrice: 1000,
    bestPharmacy: "easyfarma",
    imageUrl: null,
    presentationKey: "omeprazol|20mg|30|bio:unknown|brand:unknown",
    ...overrides,
  };
}

describe("groupMedicationResultsByMatchKey", () => {
  it("agrupa por matchKey, no por presentationKey", () => {
    const ascend = medication({
      laboratory: "Ascend",
      bestPrice: 1200,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:ascend",
    });
    const opko = medication({
      laboratory: "Opko",
      bestPrice: 990,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:opko",
    });
    const otherMatchKey = medication({
      matchKey: "paracetamol|500mg|16",
      laboratory: "Andrómaco",
      presentationKey: "paracetamol|500mg|16|bio:true|brand:andromaco",
    });

    const groups = groupMedicationResultsByMatchKey([ascend, opko, otherMatchKey]);

    expect(groups).toHaveLength(2);
    expect(groups[0].matchKey).toBe("omeprazol|20mg|30");
    expect(groups[0].products).toHaveLength(2);
    expect(groups[1].matchKey).toBe("paracetamol|500mg|16");
    expect(groups[1].products).toHaveLength(1);
  });

  it("preserva cada presentationKey distinto como producto separado dentro del grupo, sin fusionar", () => {
    const ascend = medication({ laboratory: "Ascend", presentationKey: "x|brand:ascend" });
    const opko = medication({ laboratory: "Opko", presentationKey: "x|brand:opko" });
    const curaespring = medication({ laboratory: "CuraeSpring", presentationKey: "x|brand:curaespring" });

    const [group] = groupMedicationResultsByMatchKey([ascend, opko, curaespring]);

    const presentationKeys = group.products.map((p) => p.presentationKey);
    expect(new Set(presentationKeys).size).toBe(3);
  });

  it("nunca mezcla prices[] entre productos comerciales distintos", () => {
    const ascend = medication({
      laboratory: "Ascend",
      presentationKey: "x|brand:ascend",
      prices: [price({ pharmacySlug: "araucomed", channels: { store: 1200, online: null, cmr: null, sbpay: null, effective: 1200 } })],
    });
    const opko = medication({
      laboratory: "Opko",
      presentationKey: "x|brand:opko",
      prices: [price({ pharmacySlug: "farmex", channels: { store: 990, online: null, cmr: null, sbpay: null, effective: 990 } })],
    });

    const [group] = groupMedicationResultsByMatchKey([ascend, opko]);

    const ascendInGroup = group.products.find((p) => p.presentationKey === "x|brand:ascend")!;
    const opkoInGroup = group.products.find((p) => p.presentationKey === "x|brand:opko")!;
    expect(ascendInGroup.prices).toHaveLength(1);
    expect(ascendInGroup.prices[0].pharmacySlug).toBe("araucomed");
    expect(opkoInGroup.prices).toHaveLength(1);
    expect(opkoInGroup.prices[0].pharmacySlug).toBe("farmex");
  });

  it("preserva el orden de aparición del primer matchKey visto en el array de entrada", () => {
    const a = medication({ matchKey: "b-match" });
    const b = medication({ matchKey: "a-match" });
    const groups = groupMedicationResultsByMatchKey([a, b]);
    expect(groups.map((g) => g.matchKey)).toEqual(["b-match", "a-match"]);
  });
});

describe("sortCommercialProducts (orden aprobado)", () => {
  it("ordena por precio mínimo ascendente primero", () => {
    const cheap = medication({ bestPrice: 500, laboratory: "A" });
    const expensive = medication({ bestPrice: 900, laboratory: "B" });
    const result = sortCommercialProducts([expensive, cheap]);
    expect(result.map((r) => r.laboratory)).toEqual(["A", "B"]);
  });

  it("en empate de precio, bioequivalente primero", () => {
    const notBio = medication({ bestPrice: 500, laboratory: "A", isBioequivalent: false });
    const bio = medication({ bestPrice: 500, laboratory: "B", isBioequivalent: true });
    const result = sortCommercialProducts([notBio, bio]);
    expect(result.map((r) => r.laboratory)).toEqual(["B", "A"]);
  });

  it("en empate de precio y bioequivalencia, mayor cobertura de farmacias primero", () => {
    const oneP = medication({ bestPrice: 500, laboratory: "A", prices: [price()] });
    const threeP = medication({ bestPrice: 500, laboratory: "B", prices: [price(), price(), price()] });
    const result = sortCommercialProducts([oneP, threeP]);
    expect(result.map((r) => r.laboratory)).toEqual(["B", "A"]);
  });

  it("NO ordena bioequivalente primero de forma absoluta si el precio es distinto", () => {
    const cheapNotBio = medication({ bestPrice: 400, laboratory: "barato", isBioequivalent: false });
    const expensiveBio = medication({ bestPrice: 900, laboratory: "caro-bio", isBioequivalent: true });
    const result = sortCommercialProducts([expensiveBio, cheapNotBio]);
    expect(result.map((r) => r.laboratory)).toEqual(["barato", "caro-bio"]);
  });

  it("productos sin identificar (unknown) van al final cuando existe al menos una alternativa identificada", () => {
    const unknownCheap = medication({ bestPrice: 100, manufacturer: null });
    const identifiedExpensive = medication({ bestPrice: 2000, manufacturer: "Ascend" });
    const result = sortCommercialProducts([unknownCheap, identifiedExpensive]);
    expect(result.map((r) => r.manufacturer)).toEqual(["Ascend", null]);
  });

  it("si TODOS los productos son unknown, no hay partición especial: se ordenan solo por el criterio normal", () => {
    const unknownExpensive = medication({ bestPrice: 900, manufacturer: null });
    const unknownCheap = medication({ bestPrice: 100, manufacturer: null });
    const result = sortCommercialProducts([unknownExpensive, unknownCheap]);
    expect(result.map((r) => r.bestPrice)).toEqual([100, 900]);
  });

  it("fabricante vacío (string en blanco) se trata como no identificado", () => {
    const blank = medication({ bestPrice: 100, manufacturer: "   " });
    const identified = medication({ bestPrice: 2000, manufacturer: "Ascend" });
    const result = sortCommercialProducts([blank, identified]);
    expect(result.map((r) => r.manufacturer)).toEqual(["Ascend", "   "]);
  });

  // CF-DATA-001 — un producto SIN fabricante pero CON marca está identificado.
  // Es el caso de las 5 farmacias que no exponen ningún campo estructurado
  // (Cruz Verde, Ahumada, EcoFarmacias, EasyFarma, Sermecoop): antes caían
  // siempre al final del grupo por falta de metadato, no por falta de identidad.
  it("una marca conocida identifica al producto aunque no haya fabricante", () => {
    const branded = medication({ bestPrice: 2000, brand: "Tocalm", manufacturer: null });
    const anonymous = medication({ bestPrice: 100, brand: null, manufacturer: null });
    const result = sortCommercialProducts([anonymous, branded]);
    expect(result.map((r) => r.brand)).toEqual(["Tocalm", null]);
  });
});

describe("buildGroupTitle", () => {
  it("quita un grupo entre paréntesis al final del nombre", () => {
    const m = medication({ canonicalName: "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)" });
    expect(buildGroupTitle([m])).toBe("Omeprazol 20 mg x 30 cápsulas.");
  });

  it("conserva el nombre completo si no hay paréntesis final", () => {
    const m = medication({ canonicalName: "Tapsin SC puro 500 mg x 16 comprimidos." });
    expect(buildGroupTitle([m])).toBe("Tapsin SC puro 500 mg x 16 comprimidos.");
  });

  it("usa el canonicalName del primer producto (el mejor posicionado tras sortCommercialProducts)", () => {
    const first = medication({ canonicalName: "Título esperado" });
    const second = medication({ canonicalName: "Otro título (Marca)" });
    expect(buildGroupTitle([first, second])).toBe("Título esperado");
  });

  it("devuelve string vacío si no hay productos, sin lanzar", () => {
    expect(buildGroupTitle([])).toBe("");
  });
});

describe("buildGroupImageUrl", () => {
  // Bug real (2026-08-24, búsqueda "Ascenda"): la vista agrupada no mostraba
  // ninguna imagen aunque al menos un producto comercial del grupo trajera
  // una imageUrl válida desde la API.
  it("usa la primera imagen no-null encontrada entre los productos, en el orden dado", () => {
    const withoutImage = medication({ laboratory: "A", imageUrl: null });
    const withImage = medication({ laboratory: "B", imageUrl: "https://example.com/b.jpg" });
    expect(buildGroupImageUrl([withoutImage, withImage])).toBe("https://example.com/b.jpg");
  });

  it("devuelve null si ningún producto del grupo tiene imagen válida", () => {
    const a = medication({ laboratory: "A", imageUrl: null });
    const b = medication({ laboratory: "B", imageUrl: null });
    expect(buildGroupImageUrl([a, b])).toBeNull();
  });

  it("devuelve null si no hay productos, sin lanzar", () => {
    expect(buildGroupImageUrl([])).toBeNull();
  });
});

describe("groupMedicationResultsByMatchKey — imageUrl del grupo", () => {
  it("expone en el grupo la primera imagen válida entre sus productos comerciales", () => {
    const ascenda = medication({
      laboratory: "Ascenda",
      bestPrice: 19199,
      presentationKey: "complemento|800000mg|bio:false|brand:ascenda",
      imageUrl: "https://static.salcobrand.cl/ascenda-vainilla.jpg",
    });
    const nestleAscenda = medication({
      laboratory: "Nestlé Ascenda®",
      bestPrice: 24999,
      presentationKey: "complemento|800000mg|bio:false|brand:nestleascenda",
      imageUrl: "https://static.salcobrand.cl/ascenda-neutro.jpg",
    });

    const [group] = groupMedicationResultsByMatchKey([ascenda, nestleAscenda]);

    // El más barato (Ascenda) queda primero tras sortCommercialProducts, así
    // que su imagen es la que representa al grupo.
    expect(group.imageUrl).toBe("https://static.salcobrand.cl/ascenda-vainilla.jpg");
  });

  it("hereda la imagen de un producto aunque el primero (más barato) no tenga", () => {
    const cheapNoImage = medication({ laboratory: "A", bestPrice: 500, imageUrl: null });
    const pricierWithImage = medication({
      laboratory: "B",
      bestPrice: 900,
      imageUrl: "https://example.com/b.jpg",
    });

    const [group] = groupMedicationResultsByMatchKey([cheapNoImage, pricierWithImage]);

    expect(group.imageUrl).toBe("https://example.com/b.jpg");
  });
});

describe("computeRemainingOptions", () => {
  it("calcula correctamente cuando hay más de 5 opciones", () => {
    expect(computeRemainingOptions(8)).toEqual({ mobile: 5, desktop: 3 });
  });

  it("nunca devuelve negativos cuando hay menos opciones que el default", () => {
    expect(computeRemainingOptions(2)).toEqual({ mobile: 0, desktop: 0 });
  });

  it("caso límite: exactamente 3 y exactamente 5", () => {
    expect(computeRemainingOptions(3)).toEqual({ mobile: 0, desktop: 0 });
    expect(computeRemainingOptions(5)).toEqual({ mobile: 2, desktop: 0 });
  });
});

describe("rowVisibilityClassName", () => {
  it("primeras 3 filas siempre visibles", () => {
    expect(rowVisibilityClassName(0, false)).toBe("");
    expect(rowVisibilityClassName(2, false)).toBe("");
  });

  it("filas 4ta-5ta ocultas en mobile, visibles en desktop, cuando no está expandido", () => {
    expect(rowVisibilityClassName(3, false)).toBe("hidden sm:block");
    expect(rowVisibilityClassName(4, false)).toBe("hidden sm:block");
  });

  it("filas desde la 6ta ocultas en ambos breakpoints cuando no está expandido", () => {
    expect(rowVisibilityClassName(5, false)).toBe("hidden");
    expect(rowVisibilityClassName(10, false)).toBe("hidden");
  });

  it("cuando expanded=true, todas las filas son visibles sin importar el índice", () => {
    expect(rowVisibilityClassName(0, true)).toBe("");
    expect(rowVisibilityClassName(4, true)).toBe("");
    expect(rowVisibilityClassName(20, true)).toBe("");
  });
});

describe("orden de operaciones: filtrar ANTES de agrupar", () => {
  it("agrupar sobre un array ya filtrado no produce grupos vacíos ni mezcla productos descartados", () => {
    const bioAscend = medication({
      laboratory: "Ascend",
      brand: null,
      manufacturer: "Ascend",
      activeIngredient: null,
      brandSource: "unknown",
      isBioequivalent: true,
      presentationKey: "x|brand:ascend",
    });
    const notBioOpko = medication({
      laboratory: "Opko",
      brand: null,
      manufacturer: "Opko",
      activeIngredient: null,
      brandSource: "unknown",
      isBioequivalent: false,
      presentationKey: "x|brand:opko",
    });
    const onlyUnknownMatchKey = medication({
      matchKey: "solo-no-bio",
      laboratory: null,
      brand: null,
      manufacturer: null,
      activeIngredient: null,
      brandSource: "unknown",
      isBioequivalent: false,
      presentationKey: "solo-no-bio|brand:unknown",
    });

    // Simula un futuro filtro "solo bioequivalentes" aplicado ANTES de
    // llamar al helper de agrupamiento — el helper en sí es agnóstico a
    // cómo se construyó el array de entrada.
    const onlyBioequivalent = [bioAscend, notBioOpko, onlyUnknownMatchKey].filter(
      (m) => m.isBioequivalent === true
    );
    const groups = groupMedicationResultsByMatchKey(onlyBioequivalent);

    expect(groups).toHaveLength(1);
    expect(groups[0].products).toHaveLength(1);
    expect(groups[0].products[0].laboratory).toBe("Ascend");
    // El grupo cuyo único producto no era bioequivalente no debe aparecer
    // como grupo vacío ni de ninguna otra forma.
    expect(groups.some((g) => g.matchKey === "solo-no-bio")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CF-SEARCH-002 — separación de secciones por cohorte de concentración.
// ---------------------------------------------------------------------------
describe("splitGroupsByConcentration (CF-SEARCH-002)", () => {
  const ibuprofeno = (
    dose: string,
    concentrationMatch: MedicationResult["concentrationMatch"],
    bestPrice: number
  ) =>
    medication({
      matchKey: `ibuprofeno|${dose}|20`,
      canonicalName: `Ibuprofeno ${dose} x 20 comprimidos`,
      presentationKey: `ibuprofeno|${dose}|20|bio:false|brand:unknown|form:solid-oral`,
      concentrationMatch,
      bestPrice,
    });

  it("el grupo hereda la cohorte que la API ya asignó a sus productos", () => {
    const groups = groupMedicationResultsByMatchKey([
      ibuprofeno("600mg", "exact", 1190),
      ibuprofeno("400mg", "other", 642),
    ]);
    expect(groups.map((g) => g.concentrationMatch)).toEqual(["exact", "other"]);
  });

  it("'exact' y 'unknown' quedan en la sección principal; 'other' en la secundaria", () => {
    const { primary, other } = splitGroupsByConcentration(
      groupMedicationResultsByMatchKey([
        ibuprofeno("600mg", "exact", 1190),
        ibuprofeno("", "unknown", 100),
        ibuprofeno("400mg", "other", 642),
        ibuprofeno("200mg", "other", 1200),
      ])
    );
    expect(primary.map((g) => g.concentrationMatch)).toEqual(["exact", "unknown"]);
    expect(other.map((g) => g.matchKey)).toEqual(["ibuprofeno|400mg|20", "ibuprofeno|200mg|20"]);
  });

  it("sin concentración en la consulta, TODO queda en la sección principal", () => {
    // La API omite `concentrationMatch` cuando no hay cohorte que asignar: no
    // debe aparecer una sección "Otras concentraciones" inventada.
    const { primary, other } = splitGroupsByConcentration(
      groupMedicationResultsByMatchKey([
        medication({ matchKey: "ibuprofeno|600mg|20", presentationKey: "a" }),
        medication({ matchKey: "ibuprofeno|400mg|20", presentationKey: "b" }),
      ])
    );
    expect(primary).toHaveLength(2);
    expect(other).toHaveLength(0);
  });

  it("no reordena: conserva el orden que decidió el dominio", () => {
    const groups = groupMedicationResultsByMatchKey([
      ibuprofeno("600mg", "exact", 9553),
      ibuprofeno("400mg", "other", 642),
    ]);
    const { primary, other } = splitGroupsByConcentration(groups);
    // El 400 mg es más barato y aun así está en la sección secundaria.
    expect(primary[0].matchKey).toBe("ibuprofeno|600mg|20");
    expect(other[0].matchKey).toBe("ibuprofeno|400mg|20");
    expect(other[0].products[0].bestPrice).toBeLessThan(primary[0].products[0].bestPrice);
  });

  it("ningún grupo se pierde en la partición", () => {
    const groups = groupMedicationResultsByMatchKey([
      ibuprofeno("600mg", "exact", 1190),
      ibuprofeno("400mg", "other", 642),
      ibuprofeno("200mg", "other", 1200),
    ]);
    const { primary, other } = splitGroupsByConcentration(groups);
    expect(primary.length + other.length).toBe(groups.length);
  });
});
