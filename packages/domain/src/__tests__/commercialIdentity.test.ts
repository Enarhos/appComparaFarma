import { describe, expect, it } from "vitest";
import {
  bioequivalenceKey,
  extractBrandFromUrl,
  isPlausibleCommercialIdentity,
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

// ---------------------------------------------------------------------------
// FASE P1 — Hardening de resolución de identidad comercial (2026-08-19).
// Casos A-Q del prompt de hardening, todos contra datos/observaciones reales
// de la auditoría de producción de 5 búsquedas (omeprazol, paracetamol,
// losartán, ibuprofeno, amoxicilina) — ver
// docs/technology/domain/COMMERCIAL_IDENTITY.md para el inventario completo.
// ---------------------------------------------------------------------------

describe("FASE P1 — isPlausibleCommercialIdentity (validación de plausibilidad)", () => {
  it("Caso G — el propio principio activo (via matchKey) nunca es una identidad comercial válida", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: "Omeprazol",
      name: "Omeprazol 20 mg 30 Cápsulas",
      onlineUrl: null,
      matchKey: "omeprazol|20mg|30",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso H — ibuprofeno como identity (structuredBrand literal) => UNKNOWN", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: "Ibuprofeno",
      name: "Ibuprofeno (B) 400mg 20 Comprimidos",
      onlineUrl: null,
      matchKey: "ibuprofeno|400mg|20",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("paracetamol/losartan/amoxicilina como identity => UNKNOWN (guardia de principio activo)", () => {
    expect(
      resolveCommercialIdentity({
        structuredBrand: "Paracetamol",
        name: "Paracetamol 500 mg. 16 comp.",
        onlineUrl: null,
        matchKey: "paracetamol|500mg|16",
      }).commercialIdentity
    ).toBe(UNKNOWN_COMMERCIAL_IDENTITY);

    expect(
      resolveCommercialIdentity({
        structuredBrand: "Losartan",
        name: "Losartan 50 mg 30...",
        onlineUrl: null,
        matchKey: "losartan|50mg|30",
      }).commercialIdentity
    ).toBe(UNKNOWN_COMMERCIAL_IDENTITY);

    expect(
      resolveCommercialIdentity({
        structuredBrand: "Amoxicilina",
        name: "Amoxicilina 500 mg 21 cápsulas",
        onlineUrl: null,
        matchKey: "amoxicilina|500mg|21",
      }).commercialIdentity
    ).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso I — 'Losartan Hidroclorotiazida' / composición completa como brand => UNKNOWN salvo evidencia real", () => {
    // Observado en producción (Salcobrand, auditoría 2026-08-19): el campo
    // estructurado contenía literalmente el nombre completo de la
    // combinación de principios activos, no una marca.
    const r1 = resolveCommercialIdentity({
      structuredBrand: "Losartan Hidroclorotiazida",
      name: "Losartán/hidroclorotiazida 50/12,5 Mg X 30 Comprimidos",
      onlineUrl: null,
      matchKey: "losartan|12.5mg|30",
    });
    expect(r1.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);

    const r2 = resolveCommercialIdentity({
      structuredBrand: "Lorsartan Potasico Hidroclorotiazida",
      name: "Lorsartán Potásico / Hidroclorotiazida 50/12.5 30 Comprimidos Recubiertos",
      onlineUrl: null,
      matchKey: "lorsartan|30",
    });
    expect(r2.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso C — 'Laboratorio Chile' estructurado (real, plausible) => 'chile' HIGH; pero 'chile' vía URL genérica => UNKNOWN", () => {
    const structured = resolveCommercialIdentity({
      structuredBrand: "Laboratorio Chile",
      name: "Ibuprofeno 600 mg Mintlab - 20 Comprimidos",
      onlineUrl: null,
      matchKey: "ibuprofeno|600mg|20",
    });
    expect(structured).toEqual({
      commercialIdentity: "chile",
      commercialIdentitySource: "structured",
      commercialIdentityConfidence: "high",
    });

    // Aunque el host fuera EasyFarma, "chile" como último segmento de URL es
    // un token genérico (sufijo de país/locale), no una marca — se rechaza.
    const viaUrl = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Ibuprofeno 400 mg x 20 Comprimidos CHILE",
      onlineUrl: "https://nuevo.easyfarma.cl/104458-ibuprofeno-400-mg-x-20-comprimidos-chile.html",
      matchKey: "ibuprofeno|400mg|20",
    });
    expect(viaUrl.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso A — 'detalleproducto' (token de navegación genérico) => UNKNOWN, incluso si viniera de un host confiable", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Ibuprofeno 400 mg x 20 Comprimidos",
      onlineUrl: "https://nuevo.easyfarma.cl/104458-ibuprofeno-400-mg-x-20-detalleproducto.html",
      matchKey: "ibuprofeno|400mg|20",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso B — 'recubiertos' (forma farmacéutica) nunca es una marca, ni estructurado ni por URL", () => {
    expect(
      resolveCommercialIdentity({
        structuredBrand: "Recubiertos",
        name: "Ibuprofeno 400 mg x 20 Comprimidos recubiertos",
        onlineUrl: null,
        matchKey: "ibuprofeno|400mg|20",
      }).commercialIdentity
    ).toBe(UNKNOWN_COMMERCIAL_IDENTITY);

    expect(
      resolveCommercialIdentity({
        structuredBrand: null,
        name: "Ibuprofeno 200 mg 20 comprimidos recubiertos",
        onlineUrl: "https://nuevo.easyfarma.cl/104458-ibuprofeno-200-mg-x-20-recubiertos.html",
        matchKey: "ibuprofeno|200mg|20",
      }).commercialIdentity
    ).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso D — 'blandas'/'blanda' (forma farmacéutica) => UNKNOWN", () => {
    expect(
      isPlausibleCommercialIdentity("blandas", { activeIngredientToken: "ibuprofeno" })
    ).toBe(false);
    expect(
      isPlausibleCommercialIdentity("blanda", { activeIngredientToken: "ibuprofeno" })
    ).toBe(false);
  });

  it("Caso E — '100ml' (token de cantidad) => UNKNOWN", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Ibuprofeno 100 mg/5 mL Suspensión 100 mL",
      onlineUrl: "https://nuevo.easyfarma.cl/104458-ibuprofeno-suspension-100ml.html",
      matchKey: "ibuprofeno|100ml",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("Caso F — 'x30com' (token de cantidad estructurado, Salcobrand) => UNKNOWN", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: "x30com",
      name: "Hyzaar 50/12,5mg x30com",
      onlineUrl: null,
      matchKey: "hyzaar|12.5mg|30",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("estructurado 'de mala calidad' tipo oración completa ('... susc-1 de 6 meses') => UNKNOWN", () => {
    // Observado en producción: un campo de suscripción colado como brand.
    const r = resolveCommercialIdentity({
      structuredBrand: "Losartan Potasico 50 mg x 30 Comprimidos susc-1 de 6 meses",
      name: "Losartan Potásico 50 mg x 30 Comprimidos susc-1 de 6 meses",
      onlineUrl: null,
      matchKey: "losartan|50mg|30",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });

  it("descriptor de estado de empaque ('caja dañada'/'caja manchada') se trata como ruido, no como marca", () => {
    expect(normalizeBrandToken("Caja Dañada")).toBe("");
    expect(normalizeBrandToken("DESCUENTO caja manchada")).toBe("");
  });

  it("Caso J/K/L — ASCEND / Curae Spring / OPKO siguen resolviendo correctamente tras el hardening", () => {
    expect(
      resolveCommercialIdentity({ structuredBrand: "ASCEND", name: "x", onlineUrl: null, matchKey: "omeprazol|20mg|30" })
        .commercialIdentity
    ).toBe("ascend");
    expect(
      resolveCommercialIdentity({ structuredBrand: "Curae Spring", name: "x", onlineUrl: null, matchKey: "omeprazol|20mg|30" })
        .commercialIdentity
    ).toBe("curaespring");
    expect(
      resolveCommercialIdentity({ structuredBrand: "OPKO", name: "x", onlineUrl: null, matchKey: "omeprazol|20mg|30" })
        .commercialIdentity
    ).toBe("opko");
  });

  it("Caso M — EasyFarma URL real con '-lab-ascend' sigue resolviendo MEDIUM/ascend", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Omeprazol 20 mg x 30 cap...",
      onlineUrl: "https://nuevo.easyfarma.cl/104320-omeprazol-20-mg-x-30-cap-lab-ascend.html",
      matchKey: "omeprazol|20mg|30",
    });
    expect(r).toEqual({
      commercialIdentity: "ascend",
      commercialIdentitySource: "url",
      commercialIdentityConfidence: "medium",
    });
  });

  it("Caso N — URL genérica de Sermecoop tipo 'detalle-producto' nunca se intenta (host no confiable) => UNKNOWN", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Actron (ibuprofeno) 200mg 10 Cápsulas",
      onlineUrl: "https://sermecoop.cl/tienda/detalle-producto/12345",
      matchKey: "actron|200mg|10",
    });
    expect(r).toEqual({
      commercialIdentity: UNKNOWN_COMMERCIAL_IDENTITY,
      commercialIdentitySource: "unknown",
      commercialIdentityConfidence: "unknown",
    });
  });

  it("genericosascend (estructurado) normaliza a 'ascend' vía la frase de ruido 'genericos'", () => {
    // Decisión documentada (ver comentario junto a KNOWN_BRAND_ALIASES en
    // commercialIdentity.ts): "genéricos"/"genéricas" se tratan como frase de
    // ruido, no como parte de la marca.
    expect(normalizeBrandToken("Genericos Ascend")).toBe("ascend");
    expect(normalizeBrandToken("Genéricos Ascend")).toBe("ascend");
  });

  it("URL de una farmacia distinta de EasyFarma nunca se usa para extraer marca, aunque el patrón 'parezca' válido", () => {
    const r = resolveCommercialIdentity({
      structuredBrand: null,
      name: "Omeprazol 20 mg x 30 cápsulas con Gránulos",
      onlineUrl: "https://www.cruzverde.cl/omeprazol-20-mg-x-30-cap-lab-ascend/275886.html",
      matchKey: "omeprazol|20mg|30",
    });
    expect(r.commercialIdentity).toBe(UNKNOWN_COMMERCIAL_IDENTITY);
  });
});

describe("FASE P1 — política conservadora se mantiene intacta (casos O/P/Q, verificación de no-regresión)", () => {
  it("Caso O — known vs unknown siguen sin fusionar: presentationKey distinto", () => {
    const known = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: "ascend" });
    const unknown = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: UNKNOWN_COMMERCIAL_IDENTITY });
    expect(known).not.toBe(unknown);
  });

  it("Caso P — mismo brand válido en dos farmacias sigue produciendo el mismo presentationKey (sigue fusionando)", () => {
    const farmex = resolveCommercialIdentity({ structuredBrand: "OPKO", name: "x", onlineUrl: null, matchKey: "omeprazol|20mg|30" });
    const araucomed = resolveCommercialIdentity({ structuredBrand: "Opko", name: "x", onlineUrl: null, matchKey: "omeprazol|20mg|30" });
    const pkFarmex = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: farmex.commercialIdentity });
    const pkAraucomed = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: araucomed.commercialIdentity });
    expect(pkFarmex).toBe(pkAraucomed);
  });

  it("Caso Q — bio true vs false nunca fusiona, incluso con la misma marca resuelta", () => {
    const bioTrue = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: true, commercialIdentity: "ascend" });
    const bioFalse = presentationKey({ matchKey: "omeprazol|20mg|30", isBioequivalent: false, commercialIdentity: "ascend" });
    expect(bioTrue).not.toBe(bioFalse);
  });
});

describe("FASE P1 — isPlausibleCommercialIdentity (unidad, categorías directas)", () => {
  it("rechaza tokens de cantidad puros", () => {
    expect(isPlausibleCommercialIdentity("100ml")).toBe(false);
    expect(isPlausibleCommercialIdentity("500mg")).toBe(false);
    expect(isPlausibleCommercialIdentity("x30com")).toBe(false);
    expect(isPlausibleCommercialIdentity("x20com")).toBe(false);
  });

  it("rechaza formas farmacéuticas", () => {
    expect(isPlausibleCommercialIdentity("recubiertos")).toBe(false);
    expect(isPlausibleCommercialIdentity("blandas")).toBe(false);
    expect(isPlausibleCommercialIdentity("jarabe")).toBe(false);
  });

  it("rechaza tokens de navegación de URL solo cuando fromUrl=true", () => {
    expect(isPlausibleCommercialIdentity("detalleproducto", { fromUrl: true })).toBe(false);
    // El mismo token, si viniera (hipotéticamente) de un campo estructurado y
    // no de URL, no cae en esta categoría específica (aunque sí podría
    // rechazarse por otras reglas si aplican).
    expect(isPlausibleCommercialIdentity("detalleproducto", { fromUrl: false })).toBe(true);
  });

  it("rechaza run-on excesivamente largo", () => {
    expect(isPlausibleCommercialIdentity("lorsartanpotasicohidroclorotiazida")).toBe(false);
    expect(isPlausibleCommercialIdentity("amoxicilinaacidoclavulanico")).toBe(false);
  });

  it("acepta marcas reales conocidas", () => {
    expect(isPlausibleCommercialIdentity("ascend")).toBe(true);
    expect(isPlausibleCommercialIdentity("opko")).toBe(true);
    expect(isPlausibleCommercialIdentity("curaespring")).toBe(true);
    expect(isPlausibleCommercialIdentity("chemopharma")).toBe(true);
  });
});
