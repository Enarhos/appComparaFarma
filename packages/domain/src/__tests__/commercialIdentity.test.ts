import { describe, expect, it } from "vitest";
import {
  bioequivalenceKey,
  extractBrandFromUrl,
  normalizeBrandToken,
  presentationKey,
  resolveCommercialIdentity,
  UNKNOWN_COMMERCIAL_IDENTITY,
} from "../commercialIdentity.js";

describe("normalizeBrandToken", () => {
  // Caso 2 — ASCEND / Ascend / ascend labs => misma commercialIdentity.
  it("Caso 2 — normaliza mayúsculas y el sufijo genérico 'labs' al mismo token", () => {
    expect(normalizeBrandToken("ASCEND")).toBe("ascend");
    expect(normalizeBrandToken("Ascend")).toBe("ascend");
    expect(normalizeBrandToken("ascend labs")).toBe("ascend");
  });

  // Caso 3 — CuraeSpring / Curae Spring / Curaspring => misma commercialIdentity.
  it("Caso 3 — normaliza espacios y el alias explícito de escritura real observada", () => {
    expect(normalizeBrandToken("CuraeSpring")).toBe("curaespring");
    expect(normalizeBrandToken("Curae Spring")).toBe("curaespring");
    expect(normalizeBrandToken("Curaspring")).toBe("curaespring");
  });

  it("elimina frases de ruido conocidas (programas/promociones, no marca)", () => {
    expect(normalizeBrandToken("OPKO Ley Cenabast")).toBe("opko");
    expect(normalizeBrandToken("Opko Cenabast")).toBe("opko");
    expect(normalizeBrandToken("Omeprazol Descuento")).toBe("omeprazol");
  });

  it("no elimina 'lab' cuando forma parte de la marca misma, solo como palabra completa de ruido", () => {
    // "lab" como palabra suelta se remueve (ruido genérico), pero no debe
    // comerse fragmentos de una marca real que no sea exactamente "lab".
    expect(normalizeBrandToken("Laboratorio Chile")).toBe("chile");
  });

  it("retorna cadena vacía si no queda nada representativo", () => {
    expect(normalizeBrandToken("Laboratorios")).toBe("");
    expect(normalizeBrandToken("   ")).toBe("");
  });
});

describe("extractBrandFromUrl", () => {
  it("extrae la marca del patrón real de EasyFarma '...-cap-lab-ascend.html'", () => {
    expect(
      extractBrandFromUrl(
        "https://nuevo.easyfarma.cl/104320-omeprazol-20-mg-x-30-cap-lab-ascend.html"
      )
    ).toBe("ascend");
  });

  it("extrae la marca del patrón real de EasyFarma '...-capsulas-curaspring.html' (sin prefijo 'lab-')", () => {
    expect(
      extractBrandFromUrl(
        "https://nuevo.easyfarma.cl/104458-omeprazol-20-mg-x-60-capsulas-curaspring.html"
      )
    ).toBe("curaspring");
  });

  it("no inventa marca cuando el último segmento es solo el ID numérico (ej. Cruz Verde)", () => {
    expect(
      extractBrandFromUrl("https://www.cruzverde.cl/omeprazol-20-mg-30-capsulas-con-granulos/275886.html")
    ).toBeNull();
  });

  it("no inventa marca cuando el último segmento es forma farmacéutica/cantidad", () => {
    expect(extractBrandFromUrl("https://nuevo.easyfarma.cl/104458-omeprazol-20-mg-x-60-capsulas.html")).toBeNull();
  });

  it("retorna null sin URL o con segmento demasiado corto", () => {
    expect(extractBrandFromUrl("https://example.com/")).toBeNull();
    expect(extractBrandFromUrl("https://example.com/producto-ab.html")).toBeNull();
  });
});

describe("resolveCommercialIdentity", () => {
  it("HIGH — prioriza laboratory/manufacturer/brand estructurado sobre cualquier otra señal", () => {
    const result = resolveCommercialIdentity({
      structuredBrand: "OPKO",
      name: 'Omeprazol 20 mg x 30 cápsulas "Ley Cenabast"',
      onlineUrl: "https://farmex.cl/products/omeprazol-20-mg-x-30-capsulas-ley-cenabast",
    });
    expect(result).toEqual({
      commercialIdentity: "opko",
      commercialIdentitySource: "structured",
      commercialIdentityConfidence: "high",
    });
  });

  it("MEDIUM — usa la URL cuando no hay campo estructurado (caso real EasyFarma)", () => {
    const result = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Omeprazol 20 mg x 30 cap...",
      onlineUrl: "https://nuevo.easyfarma.cl/104320-omeprazol-20-mg-x-30-cap-lab-ascend.html",
    });
    expect(result).toEqual({
      commercialIdentity: "ascend",
      commercialIdentitySource: "url",
      commercialIdentityConfidence: "medium",
    });
  });

  // Caso 10 — producto sin marca/lab/URL informativa => no se asigna marca inventada.
  it("Caso 10 — sin evidencia suficiente (ni estructurado ni URL útil) => unknown, nunca se inventa", () => {
    const result = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Omeprazol 20 mg 30 Cápsulas con Gránulos",
      onlineUrl: "https://www.cruzverde.cl/omeprazol-20-mg-30-capsulas-con-granulos/275886.html",
    });
    expect(result).toEqual({
      commercialIdentity: UNKNOWN_COMMERCIAL_IDENTITY,
      commercialIdentitySource: "unknown",
      commercialIdentityConfidence: "unknown",
    });
  });

  it("unknown cuando structuredBrand normaliza a vacío (ej. solo dice 'Laboratorios')", () => {
    const result = resolveCommercialIdentity({
      structuredBrand: "Laboratorios",
      name: "Producto genérico",
      onlineUrl: null,
    });
    expect(result.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });
});

describe("bioequivalenceKey", () => {
  it("distingue true / false / unknown (null y undefined)", () => {
    expect(bioequivalenceKey(true)).toBe("true");
    expect(bioequivalenceKey(false)).toBe("false");
    expect(bioequivalenceKey(null)).toBe("unknown");
    expect(bioequivalenceKey(undefined)).toBe("unknown");
  });
});

describe("presentationKey", () => {
  it("combina matchKey + bioequivalencia + identidad comercial", () => {
    expect(
      presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: "ascend" })
    ).toBe("omeprazol|20mg|30|bio:false|brand:ascend");
  });

  it("Caso 2/3 — variantes de escritura normalizadas producen el mismo presentationKey", () => {
    const a = resolveCommercialIdentity({ structuredBrand: "ASCEND", name: "x", onlineUrl: null });
    const b = resolveCommercialIdentity({ structuredBrand: "ascend labs", name: "x", onlineUrl: null });
    expect(
      presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: a.commercialIdentity })
    ).toBe(
      presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: b.commercialIdentity })
    );

    const c = resolveCommercialIdentity({ structuredBrand: "CuraeSpring", name: "x", onlineUrl: null });
    const d = resolveCommercialIdentity({ structuredBrand: "Curaspring", name: "x", onlineUrl: null });
    expect(
      presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: c.commercialIdentity })
    ).toBe(
      presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: d.commercialIdentity })
    );
  });
});
