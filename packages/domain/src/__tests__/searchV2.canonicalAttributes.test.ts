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
  readAdministrationRoute,
  readCanonicalDosageForm,
  readPackageType,
  readPackageVolume,
  readPharmaceuticalUnit,
  readUnresolvedIdentityDiscriminator,
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

  it("cuando no puede demostrar ninguna molécula, devuelve VACÍO", () => {
    // Revisión CTO PR #159, punto 2: "Tapsin Forte" no demuestra que "tapsin"
    // sea un principio activo, así que no puede aparecer como tal.
    expect(readActiveIngredients("Tapsin Forte x 30 comprimidos")).toEqual([]);
    expect(readActiveIngredients("Amrodil 30 Mg/5ml 100 Ml")).toEqual([]);
    expect(readActiveIngredients("Muxol Jarabe Pediátrico 100 ml")).toEqual([]);
    expect(readActiveIngredients("Broncot 15 mg/5 ml Jarabe 100 ml")).toEqual([]);
  });

  it("la MARCA de una asociación no se convierte en principio activo (PR #159)", () => {
    // La combinación está entre paracetamol e ibuprofeno; "tapsin" solo está
    // delante. Antes producía `ing=ibuprofeno+paracetamol+tapsin`.
    expect(
      readActiveIngredients("Tapsin Duo (B) Paracetamol / Ibuprofeno 12 Comprimidos Recubiertos")
        .map((i) => i.token)
    ).toEqual(["ibuprofeno", "paracetamol"]);
    expect(
      readActiveIngredients("Hyzaar Losartan / Hidroclorotiazida 50 mg / 12,5 mg 30 Comprimidos")
        .map((i) => i.token)
    ).toEqual(["hidroclorotiazida", "losartan"]);
    expect(
      readActiveIngredients("Ambilan Bid (amoxicilina/clavulanico) 875/125mg 14 Comprimidos")
        .map((i) => i.token)
    ).toEqual(["amoxicilina", "clavulanico"]);
    expect(
      readActiveIngredients("Rigotax-D Cetirizina / Pseudoefedrina 5mg/120mg 10 Cápsulas")
        .map((i) => i.token)
    ).toEqual(["cetirizina", "pseudoefedrina"]);
  });

  it("pero la cabecera SÍ es el primer principio activo cuando la tipografía lo demuestra", () => {
    // Perder estas dos dejaría una asociación indistinguible del monofármaco:
    // un falso merge con riesgo clínico.
    expect(
      readActiveIngredients("Tramadol Clorhidrato/Paracetamol 37,5-325mg x 30 Comp. Recubiertos")
        .map((i) => i.token)
    ).toEqual(["paracetamol", "tramadol"]);
    expect(
      readActiveIngredients("Lorsartán Potásico / Hidroclorotiazida 50/12.5 30 Comprimidos")
        .map((i) => i.token)
    ).toEqual(["hidroclorotiazida", "lorsartan"]);
  });

  it("ningún principio activo devuelto lleva una evidencia que no sea demostrable", () => {
    for (const name of [
      "Tapsin Forte x 30 comprimidos",
      "Muxol Ambroxol 30 mg/5 ml Jarabe 100 ml",
      "Losartan/Hidroclorotiazida 50 mg/12.5 mg x 30 Comprimidos",
      "Paracetamol 500 mg x 16 comprimidos",
    ]) {
      for (const ingredient of readActiveIngredients(name)) {
        expect(["vocabulary", "combination"]).toContain(ingredient.evidence);
      }
    }
  });
});

describe("readUnresolvedIdentityDiscriminator — UNKNOWN != ACTIVE_INGREDIENT (PR #159)", () => {
  it("expone la cabecera no resuelta FUERA del conjunto de principios activos", () => {
    expect(readUnresolvedIdentityDiscriminator("Tapsin Forte x 30 comprimidos")).toBe("tapsin");
    expect(readUnresolvedIdentityDiscriminator("Amrodil 30 Mg/5ml 100 Ml")).toBe("amrodil");
    expect(readUnresolvedIdentityDiscriminator("Muxol Jarabe Pediátrico 100 ml")).toBe("muxol");
    expect(readUnresolvedIdentityDiscriminator("Broncot 15 mg/5 ml Jarabe 100 ml")).toBe("broncot");
  });

  it("es NULL en cuanto hay un principio activo demostrado", () => {
    expect(readUnresolvedIdentityDiscriminator("Muxol Ambroxol 30 mg/5 ml Jarabe 100 ml")).toBeNull();
    expect(readUnresolvedIdentityDiscriminator("Paracetamol 500 mg x 16 comprimidos")).toBeNull();
    expect(
      readUnresolvedIdentityDiscriminator("Losartan/Hidroclorotiazida 50 mg/12.5 mg x 30 comp.")
    ).toBeNull();
  });

  it("el discriminante y los principios activos nunca coexisten", () => {
    for (const name of [
      "Tapsin Forte x 30 comprimidos",
      "Muxol Ambroxol 30 mg/5 ml Jarabe 100 ml",
      "Omeprazol 20 mg x 60...",
      "Broncot 15 mg/5 ml Jarabe 100 ml",
    ]) {
      const attributes = canonicalizeOffer(offer(name));
      const hasIngredient = attributes.activeIngredients.length > 0;
      const hasDiscriminator = attributes.unresolvedIdentityDiscriminator !== null;
      expect(hasIngredient && hasDiscriminator).toBe(false);
    }
  });

  it("el nombre canónico no presenta el discriminante como composición", () => {
    const attributes = canonicalizeOffer(offer("Tapsin Forte x 30 comprimidos"));
    expect(attributes.activeIngredients).toEqual([]);
    expect(attributes.canonicalName).not.toMatch(/^tapsin/);
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
    expect(attributes.canonicalDosageForm).toBe("liquido-oral");
    expect(attributes.dosageFormClass).toBe("fluid-oral");
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
      unresolvedIdentityDiscriminator: null,
      brand: "Muxol",
      commercialVariant: "adulto",
      concentration: "30 mg/5 ml",
      dosageForm: "liquido-oral",
      packageQuantity: null,
      pharmaceuticalUnit: null,
      packageVolume: { value: 100, unit: "ml" },
    });
    expect(name).toBe("Muxol ambroxol adulto 30 mg/5 ml liquido-oral 100 ml");
  });

  it("omite la marca cuando el producto es un genérico", () => {
    const name = buildCanonicalName({
      activeIngredients: [{ token: "paracetamol", evidence: "vocabulary" }],
      unresolvedIdentityDiscriminator: null,
      brand: null,
      commercialVariant: null,
      concentration: "500 mg",
      dosageForm: "comprimido",
      packageQuantity: 16,
      pharmaceuticalUnit: "comprimido",
      packageVolume: null,
    });
    expect(name).toBe("paracetamol 500 mg comprimido x 16 comprimido");
  });

  it("NUNCA presenta un discriminante no resuelto como principio activo (PR #159)", () => {
    // Sin marca demostrable, la cabecera se usa como NOMBRE COMERCIAL —lo único
    // que la evidencia respalda— y nunca en la posición de la composición.
    const name = buildCanonicalName({
      activeIngredients: [],
      unresolvedIdentityDiscriminator: "tapsin",
      brand: null,
      commercialVariant: "forte",
      concentration: "500 mg",
      dosageForm: "comprimido",
      packageQuantity: 30,
      pharmaceuticalUnit: "comprimido",
      packageVolume: null,
    });
    expect(name).toBe("Tapsin forte 500 mg comprimido x 30 comprimido");
    expect(name).not.toMatch(/^tapsin/);
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

// ---------------------------------------------------------------------------
// EDM-100 — FORMA FARMACÉUTICA Y VÍA DE ADMINISTRACIÓN (revisión PR #159)
// ---------------------------------------------------------------------------

describe("readCanonicalDosageForm — Forma Farmacéutica del EDM, no la clase gruesa", () => {
  it("separa comprimido de cápsula: el EDM los enumera como formas distintas", () => {
    expect(readCanonicalDosageForm("Amoxicilina 500 mg x 21 cápsulas")).toBe("capsula");
    expect(readCanonicalDosageForm("Amoxicilina 500mg 21 Comprimidos")).toBe("comprimido");
  });

  it("normaliza los sinónimos que sí lo son (tableta ≈ comprimido, perla ≈ cápsula)", () => {
    for (const name of [
      "Paracetamol 500 mg x 16 comprimidos",
      "Paracetamol 500 mg x 16 tabletas",
      "Paracetamol 500 mg x 16 pastillas",
      "Paracetamol 500 mg Caja 16comp",
    ]) {
      expect(readCanonicalDosageForm(name)).toBe("comprimido");
    }
    expect(readCanonicalDosageForm("Vitamina E 400 UI x 30 perlas")).toBe("capsula");
    expect(readCanonicalDosageForm("Omeprazol 20 mg x30caps")).toBe("capsula");
  });

  it("NO separa jarabe, suspensión, solución ni polvo para suspensión", () => {
    // Evidencia del corpus congelado: Amoxicilina 250 mg/5 mL 60 mL es "Jarabe"
    // en Salcobrand, "susp. Frasco" en Ahumada y "Polvo Para Suspensión Oral" en
    // Dr. Simi. Es UN artículo descrito de tres formas; separarlo sería un falso
    // split, no una identidad más fina.
    for (const name of [
      "Amoxicilina 250 mg/5 mL Jarabe 60 mL",
      "Amoxicilina 250 mg/5 mL susp. Frasco 60 mL",
      "Amoxicilina 250 mg/5 mL Polvo Para Suspensión Oral 60 mL",
      "Amoxicilina 250 mg/5 mL Solución Oral 60 mL",
      "Rigotax 10 mg/mL Solución Oral Para Gotas 15 mL",
      "Rigotax 10mg/ml Cetirizina Oral Gotas 15ml",
    ]) {
      expect(readCanonicalDosageForm(name)).toBe("liquido-oral");
    }
  });

  it("separa crema de gel", () => {
    expect(readCanonicalDosageForm("Dolorub 5% crema 60 g")).toBe("crema");
    expect(readCanonicalDosageForm("Dolorub 5% x 60 g Gel Dermico")).toBe("gel");
  });

  it("separa el óvulo del supositorio y el colirio de las gotas óticas", () => {
    expect(readCanonicalDosageForm("Clotrimazol 100 mg x 6 óvulos")).toBe("ovulo");
    expect(readCanonicalDosageForm("Paracetamol 125 mg x 6 supositorios")).toBe("supositorio");
    expect(readCanonicalDosageForm("Ciprofloxacino 0,3% Colirio 5 ml")).toBe("colirio");
    expect(readCanonicalDosageForm("Ciprofloxacino 0,3% Solución Ótica 5 ml")).toBe("gotas-oticas");
  });

  it("el envase manda sobre su contenido, igual que en v1", () => {
    expect(
      readCanonicalDosageForm("Omeprazol 20 mg x 30 cápsulas con gránulos con recubrimiento entérico")
    ).toBe("capsula");
  });

  it("null cuando el nombre no declara forma: es una lectura incompleta, no una forma distinta", () => {
    expect(readCanonicalDosageForm("Losartan Potásico 50 mg x 30")).toBeNull();
    expect(readCanonicalDosageForm("Omeprazol 20 mg x 60...")).toBeNull();
  });

  it("ignora el laboratorio entre paréntesis", () => {
    expect(readCanonicalDosageForm("Losartan 50 mg x 30 comprimidos (Mintlab)")).toBe("comprimido");
  });
});

describe("readAdministrationRoute — la vía es un eje, no un adorno", () => {
  it("corrige las dos afirmaciones falsas que la tabla de v1 no puede evitar", () => {
    // v1 clasifica el óvulo como `suppository` (⇒ rectal) y las gotas óticas
    // como `ophthalmic` (⇒ oftálmica). Las dos son falsas.
    expect(readAdministrationRoute("Clotrimazol 100 mg x 6 óvulos", "ovulo")).toBe("vaginal");
    expect(readAdministrationRoute("Ciprofloxacino Solución Ótica 5 ml", "gotas-oticas")).toBe("otic");
  });

  it("deriva la vía de la forma canónica cuando la forma está declarada", () => {
    expect(readAdministrationRoute("Paracetamol 500 mg x 16 comprimidos", "comprimido")).toBe("oral");
    expect(readAdministrationRoute("Dolorub 5% crema 60 g", "crema")).toBe("topical");
    expect(readAdministrationRoute("Ceftriaxona 1 g ampolla", "inyectable")).toBe("parenteral");
  });

  it("lee la vía DECLARADA en el texto cuando la forma no permite derivarla", () => {
    expect(readAdministrationRoute("Mometasona 50 mcg spray nasal 140 dosis", null)).toBe("nasal");
    expect(readAdministrationRoute("Diclofenaco 75 mg uso intramuscular", null)).toBe("parenteral");
  });

  it("null cuando no hay forma ni vía declarada", () => {
    expect(readAdministrationRoute("Omeprazol 20 mg x 60...", null)).toBeNull();
  });
});
