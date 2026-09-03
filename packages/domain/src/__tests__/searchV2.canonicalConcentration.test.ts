/**
 * CF-SEARCH-011 S0 — concentración canónica v2.
 *
 * Los casos son nombres REALES del corpus congelado de CF-SEARCH-010/011, no
 * ejemplos inventados: cada uno corresponde a una oferta observada en las 9
 * farmacias.
 */
import { describe, expect, it } from "vitest";
import {
  compareConcentration,
  concentrationSignature,
  formatConcentration,
  isWeakerConcentration,
  readConcentrationEvidence,
} from "../searchV2/canonicalConcentration.js";

describe("readConcentrationEvidence — niveles de evidencia", () => {
  it("lee la razón masa/volumen explícita como evidencia fuerte", () => {
    const evidence = readConcentrationEvidence("Ambroxol 30mg/5ml Jarabe 100ml");
    expect(evidence.kind).toBe("ratio");
    expect(concentrationSignature(evidence)).toBe("conc:ratio:6mg/ml");
  });

  it("encuentra la razón aunque no sea la primera magnitud del nombre", () => {
    // El volumen del envase va delante; `parseConcentration` devolvería 100 ml.
    const evidence = readConcentrationEvidence("Ambroxol Jarabe 100 ml 15 mg/5 ml");
    expect(evidence.kind).toBe("ratio");
    expect(concentrationSignature(evidence)).toBe("conc:ratio:3mg/ml");
  });

  it("tolera la abreviatura con punto de Ahumada", () => {
    const evidence = readConcentrationEvidence("Ambroxol 30mg./5ml. Jarabe Fco. 100ml");
    expect(concentrationSignature(evidence)).toBe("conc:ratio:6mg/ml");
  });

  it("lee la dosis de un sólido como masa absoluta — v1 devuelve null acá", () => {
    const evidence = readConcentrationEvidence("Paracetamol 500 mg x 16 comprimidos");
    expect(evidence.kind).toBe("mass-only");
    expect(concentrationSignature(evidence)).toBe("conc:mass:500mg");
  });

  it("NUNCA infiere una razón por yuxtaposición (regla R4)", () => {
    // "30 mg" + "100 ml" NO es 30 mg/100 mL: el 100 ml es el frasco.
    const evidence = readConcentrationEvidence("Ambroxol clorhidrato 30 mg 100 ml");
    expect(evidence.kind).toBe("mass-only");
    expect(concentrationSignature(evidence)).toBe("conc:mass:30mg");
  });

  it("un volumen de envase suelto NUNCA es una concentración", () => {
    expect(readConcentrationEvidence("Ambroxol Jarabe 100 ml").kind).toBe("absent");
    expect(readConcentrationEvidence("Paracetamol Gotas 15ml").kind).toBe("absent");
  });

  it("devuelve `absent` cuando el nombre no declara ninguna magnitud de masa", () => {
    expect(readConcentrationEvidence("Tapsin x 6 comprimidos (Maver)").kind).toBe("absent");
  });
});

describe("concentrationSignature — equivalencia matemática (regla R1)", () => {
  it("600 mg/100 ml, 30 mg/5 ml y 6 mg/ml derivan la MISMA firma", () => {
    const a = concentrationSignature(readConcentrationEvidence("Ambroxol 600 mg / 100 ml Jarabe"));
    const b = concentrationSignature(readConcentrationEvidence("Ambroxol 30 mg/5 ml Jarabe"));
    const c = concentrationSignature(readConcentrationEvidence("Ambroxol 6 mg/ml Jarabe"));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("0,5 g/5 ml y 500 mg/5 ml derivan la MISMA firma", () => {
    expect(concentrationSignature(readConcentrationEvidence("Amoxicilina 0,5 g/5 ml"))).toBe(
      concentrationSignature(readConcentrationEvidence("Amoxicilina 500 mg/5 ml"))
    );
  });

  it("30 mg/5 ml y 15 mg/5 ml derivan firmas DISTINTAS", () => {
    expect(concentrationSignature(readConcentrationEvidence("Ambroxol 30 mg/5 ml"))).not.toBe(
      concentrationSignature(readConcentrationEvidence("Ambroxol 15 mg/5 ml"))
    );
  });

  it("7,5 mg/ml (gotas) y 15 mg/5 ml (jarabe) derivan firmas DISTINTAS", () => {
    // Broncot gotas vs Broncot jarabe: 7,5 vs 3 mg/mL. Caso real del catálogo.
    expect(concentrationSignature(readConcentrationEvidence("Broncot 7.5mg/ml Gotas 30ml"))).not.toBe(
      concentrationSignature(readConcentrationEvidence("Broncot 15 mg/5 mL Jarabe 100 mL"))
    );
  });

  it("una masa absoluta y una razón con el mismo número NO comparten firma", () => {
    // "500 mg" comprimido vs "500 mg/5 ml" jarabe son conceptos distintos.
    expect(concentrationSignature(readConcentrationEvidence("Paracetamol 500 mg x 16"))).not.toBe(
      concentrationSignature(readConcentrationEvidence("Paracetamol 500 mg/5 ml Jarabe"))
    );
  });
});

describe("compareConcentration — tabla R5 completa", () => {
  const evidence = (name: string) => readConcentrationEvidence(name);

  it("razón vs razón equivalente ⇒ equal", () => {
    expect(compareConcentration(evidence("A 600 mg/100 ml"), evidence("A 30 mg/5 ml"))).toBe("equal");
  });

  it("razón vs razón distinta ⇒ incompatible", () => {
    expect(compareConcentration(evidence("A 30 mg/5 ml"), evidence("A 15 mg/5 ml"))).toBe(
      "incompatible"
    );
  });

  it("masa vs masa igual ⇒ equal (con conversión de unidades)", () => {
    expect(compareConcentration(evidence("A 0,5 g x 20"), evidence("A 500 mg x 20"))).toBe("equal");
  });

  it("masa vs masa distinta ⇒ incompatible", () => {
    expect(compareConcentration(evidence("A 500 mg x 20"), evidence("A 400 mg x 20"))).toBe(
      "incompatible"
    );
  });

  it("masa vs razón con el MISMO numerador ⇒ subsumable — el fix del caso ambroxol 30mg", () => {
    const massOnly = evidence("Jarabe Ambroxol clorhidrato 30mg 5ml 100ml");
    const ratio = evidence("Ambroxol 30mg/5ml Jarabe 100ml");
    expect(massOnly.kind).toBe("mass-only");
    expect(ratio.kind).toBe("ratio");
    expect(compareConcentration(massOnly, ratio)).toBe("subsumable");
    expect(isWeakerConcentration(massOnly, ratio)).toBe(true);
    expect(isWeakerConcentration(ratio, massOnly)).toBe(false);
  });

  it("masa vs razón con numerador distinto ⇒ incompatible", () => {
    expect(compareConcentration(evidence("A 15 mg 100 ml"), evidence("A 30 mg/5 ml"))).toBe(
      "incompatible"
    );
  });

  it("ausencia vs cualquiera ⇒ subsumable, en ambas direcciones", () => {
    const absent = evidence("Ambroxol Jarabe 100 ml");
    expect(compareConcentration(absent, evidence("Ambroxol 30 mg/5 ml"))).toBe("subsumable");
    expect(compareConcentration(evidence("Ambroxol 30 mg/5 ml"), absent)).toBe("subsumable");
    expect(isWeakerConcentration(absent, evidence("Ambroxol 30 mg/5 ml"))).toBe(true);
  });

  it("es simétrica en el veredicto", () => {
    const a = evidence("A 30 mg/5 ml");
    const b = evidence("A 15 mg/5 ml");
    expect(compareConcentration(a, b)).toBe(compareConcentration(b, a));
  });
});

describe("formatConcentration", () => {
  it("presenta la razón con denominador implícito como unidad sola", () => {
    expect(formatConcentration(readConcentrationEvidence("A 6 mg/ml"))).toBe("6 mg/ml");
  });

  it("presenta la razón explícita completa", () => {
    expect(formatConcentration(readConcentrationEvidence("A 30 mg/5 ml"))).toBe("30 mg/5 ml");
  });

  it("devuelve null cuando no hay evidencia", () => {
    expect(formatConcentration({ kind: "absent" })).toBeNull();
  });
});
