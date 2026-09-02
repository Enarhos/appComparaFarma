/**
 * CF-SEARCH-011 S0 — canonicalización (etapa 2): texto libre → atributos.
 *
 * Cubre los dos defectos estructurales que el ticket exige resolver:
 *   §8  141 ofertas donde `x 100 ml` se leía como 100 unidades;
 *   §9  65 ofertas donde "ambroxol" se leía como variante comercial.
 *
 * Todos los nombres son reales del corpus de las 9 farmacias.
 */
import { describe, expect, it } from "vitest";
import {
  buildCanonicalName,
  canonicalizeOffer,
  readActiveIngredients,
  readPackageType,
  readPackageVolume,
  readPharmaceuticalUnit,
} from "../searchV2/canonicalAttributes.js";
import type { RawOfferInput } from "../searchV2/canonicalTypes.js";

const offer = (rawName: string, extra: Partial<RawOfferInput> = {}): RawOfferInput => ({
  pharmacy: "cruz-verde",
  rawName,
  price: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
  stock: true,
  url: null,
  capturedAt: "2026-09-01T00:00:00.000Z",
  ...extra,
});

// ---------------------------------------------------------------------------
// §9 — principio activo ≠ marca ≠ variante ≠ fabricante
// ---------------------------------------------------------------------------

describe("readActiveIngredients", () => {
  it("reconoce el principio activo por vocabulario, no por posición", () => {
    expect(readActiveIngredients("Muxol Adulto Ambroxol 30mg/5ml Jarabe 100ml")).toEqual([
      { token: "ambroxol", evidence: "vocabulary" },
    ]);
  });

  it("reconoce el genérico presentado por su molécula", () => {
    expect(readActiveIngredients("Paracetamol 500 mg x 16 comprimidos")).toEqual([
      { token: "paracetamol", evidence: "vocabulary" },
    ]);
  });

  it("ordena el conjunto alfabéticamente: el orden textual no crea identidades distintas", () => {
    const a = readActiveIngredients("Losartan Potásico + Hidroclorotiazida 50 mg/12.5 mg x 30");
    const b = readActiveIngredients("Hidroclorotiazida + Losartan 50 mg/12.5 mg x 30");
    expect(a.map((i) => i.token)).toEqual(["hidroclorotiazida", "losartan"]);
    expect(a.map((i) => i.token)).toEqual(b.map((i) => i.token));
  });

  it("mantiene separado el monofármaco de la combinación", () => {
    const mono = readActiveIngredients("Losartan Potasico 50 mg x 30 comprimidos. (Ascend)");
    const combo = readActiveIngredients("Losartan/Hidroclorotiazida 50 mg/12.5 mg x 30 Comprimidos");
    expect(mono.map((i) => i.token)).toEqual(["losartan"]);
    expect(combo.map((i) => i.token)).toEqual(["hidroclorotiazida", "losartan"]);
  });

  it("NO trata una sal ni un ion como segundo principio activo", () => {
    expect(readActiveIngredients("Cetirizina Diclorhidrato 10 mg x 20").map((i) => i.token)).toEqual([
      "cetirizina",
    ]);
    expect(readActiveIngredients("Losartan Potásico 50 mg x 30").map((i) => i.token)).toEqual([
      "losartan",
    ]);
  });

  it("cuando no puede demostrar ninguna molécula, marca la cabecera como NO RESUELTA", () => {
    const result = readActiveIngredients("Tapsin Forte x 30 comprimidos");
    expect(result).toEqual([{ token: "tapsin", evidence: "unresolved-head" }]);
  });

  it("nunca afirma que una cabecera no resuelta sea una molécula", () => {
    const result = readActiveIngredients("Amrodil 30 Mg/5ml 100 Ml");
    expect(result[0]?.evidence).toBe("unresolved-head");
  });
});

describe("canonicalizeOffer — principio activo vs variante comercial (§9)", () => {
  it("NUNCA publica un principio activo como variante comercial", () => {
    // v1 deriva `var:ambroxol` en 65 ofertas medidas. v2 lo descarta porque el
    // token ya fue reconocido como principio activo.
    const attributes = canonicalizeOffer(offer("Muxol Ambroxol 30 mg/5 ml Jarabe 100 ml"));
    expect(attributes.activeIngredients.map((i) => i.token)).toContain("ambroxol");
    expect(attributes.commercialVariant).not.toBe("ambroxol");
    expect(attributes.inferredFields.variantDiscardedAsIngredient).toBe("ambroxol");
  });

  it("conserva una variante comercial legítima", () => {
    expect(canonicalizeOffer(offer("Tapsin Forte x 30 comprimidos")).commercialVariant).toBe("forte");
    expect(
      canonicalizeOffer(offer("Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos")).commercialVariant
    ).toBe("rojo");
  });

  it("no convierte automáticamente el primer token en marca", () => {
    // "Amrodil" no se puede DEMOSTRAR como marca: el nombre no nombra la molécula.
    expect(canonicalizeOffer(offer("Amrodil 30 Mg/5ml 100 Ml")).brand).toBeNull();
  });

  it("NUNCA infiere el laboratorio del nombre — solo del campo estructurado", () => {
    expect(canonicalizeOffer(offer("Losartan Potasico 50 mg x 30 comprimidos. (Ascend)")).manufacturer)
      .toBeNull();
    expect(
      canonicalizeOffer(
        offer("Losartan Potasico 50 mg x 30 comprimidos.", { structuredManufacturer: "Ascend" })
      ).manufacturer
    ).toBe("Ascend");
  });
});

// ---------------------------------------------------------------------------
// §8 — cantidad, volumen, denominador y unidad son dimensiones DISTINTAS
// ---------------------------------------------------------------------------

describe("cantidad vs volumen vs denominador (§8)", () => {
  it("`x 100 ml` NUNCA es una cantidad de 100 unidades", () => {
    const attributes = canonicalizeOffer(offer("Ambroxol 30mg/5ml Jarabe x 100 ml"));
    expect(attributes.packageQuantity).toBeNull();
    expect(attributes.packageVolume).toEqual({ value: 100, unit: "ml" });
  });

  it("separa las cuatro dimensiones en el mismo nombre", () => {
    const attributes = canonicalizeOffer(offer("Ambroxol 30 mg/5 mL Jarabe 100 mL"));
    expect(attributes.concentration).toEqual({
      kind: "ratio",
      value: { numerator: { value: 30, unit: "mg" }, denominator: { value: 5, unit: "ml" } },
    });
    expect(attributes.packageVolume).toEqual({ value: 100, unit: "ml" });
    expect(attributes.packageQuantity).toBeNull();
    expect(attributes.dosageForm).toBe("fluid-oral");
  });

  it("el denominador de la razón NO se confunde con el volumen del envase", () => {
    expect(readPackageVolume("Ambroxol 30 mg/5 ml Jarabe 100 ml")).toEqual({
      value: 100,
      unit: "ml",
    });
  });

  it("lee la cantidad de unidades cuando el nombre la declara", () => {
    expect(canonicalizeOffer(offer("Losartan Potasico 50 mg x 30 comprimidos")).packageQuantity).toBe(
      30
    );
    expect(canonicalizeOffer(offer("Aspirina Forte 650mg x80com.")).packageQuantity).toBe(80);
  });

  it("normaliza el volumen a la mayor magnitud suelta y admite litros", () => {
    expect(readPackageVolume("Solución Salina 1 l")).toEqual({ value: 1, unit: "l" });
    expect(readPackageVolume("Paracetamol 500 mg x 16 comprimidos")).toBeNull();
  });
});

describe("unidad farmacéutica y tipo de envase — atributos, no ejes de identidad", () => {
  it("canonicaliza sinónimos de unidad a una forma común", () => {
    expect(readPharmaceuticalUnit("Losartan 50 mg x 30 comprimidos")).toBe("comprimido");
    expect(readPharmaceuticalUnit("Next Fwd 24 Tabs /50")).toBe("comprimido");
    expect(readPharmaceuticalUnit("Omeprazol 20 mg x 30 cápsulas")).toBe("capsula");
    expect(readPharmaceuticalUnit("Tapsin Caliente Noche Sobre de 5 g")).toBe("sobre");
  });

  it("lee el tipo de envase solo cuando el nombre lo declara", () => {
    expect(readPackageType("Ambroxol 30mg/5ml Jarabe Fco. 100ml")).toBe("frasco");
    expect(readPackageType("Tapsin Rojo Tira x 6 comprimidos")).toBe("tira");
    expect(readPackageType("Losartan 50 mg x 30 comprimidos")).toBeNull();
  });
});

describe("buildCanonicalName — construido desde atributos, no copiado", () => {
  it("no depende del nombre crudo de ninguna farmacia", () => {
    const name = buildCanonicalName({
      activeIngredients: [{ token: "ambroxol", evidence: "vocabulary" }],
      brand: "Muxol",
      commercialVariant: "adulto",
      concentration: "30 mg/5 ml",
      dosageForm: "fluid-oral",
      packageQuantity: null,
      pharmaceuticalUnit: null,
      packageVolume: { value: 100, unit: "ml" },
    });
    expect(name).toBe("Muxol ambroxol adulto 30 mg/5 ml fluid-oral 100 ml");
  });

  it("omite la marca cuando el producto es un genérico", () => {
    const name = buildCanonicalName({
      activeIngredients: [{ token: "paracetamol", evidence: "vocabulary" }],
      brand: null,
      commercialVariant: null,
      concentration: "500 mg",
      dosageForm: "solid-oral",
      packageQuantity: 16,
      pharmaceuticalUnit: "comprimido",
      packageVolume: null,
    });
    expect(name).toBe("paracetamol 500 mg solid-oral x 16 comprimido");
  });
});

describe("vía de administración — tabla explícita, nunca leída del texto", () => {
  it("deriva la vía de la forma farmacéutica", () => {
    expect(canonicalizeOffer(offer("Paracetamol 500 mg x 16 comprimidos")).route).toBe("oral");
    expect(canonicalizeOffer(offer("Diclofenaco 50 mg 5 supositorios")).route).toBe("rectal");
    expect(canonicalizeOffer(offer("Salbutamol 100 mcg Inhalador")).route).toBe("inhalation");
  });

  it("no inventa una vía cuando la forma es desconocida", () => {
    expect(canonicalizeOffer(offer("Omeprazol 20 mg x 60...")).route).toBeNull();
  });
});
