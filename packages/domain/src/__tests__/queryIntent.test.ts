/**
 * CF-SEARCH-002 — parsing de la intención de consulta.
 *
 * Todas las entradas son consultas reales del set de QA o nombres literales
 * observados en producción (`GET https://comparafarma-api.vercel.app/api/search`,
 * read-only, 2026-08-28), no inventados.
 */
import { describe, expect, it } from "vitest";

import { cleanQuery } from "../normalization.js";
import {
  concentrationKey,
  isSameConcentration,
  isSameMeasurement,
  parseConcentration,
  parseQuantity,
  parseQueryIntent,
  queryIntentCacheKey,
} from "../queryIntent.js";

describe("parseQueryIntent — contrato del ticket", () => {
  it("el ejemplo de referencia se parsea exactamente como especifica CF-SEARCH-002", () => {
    const intent = parseQueryIntent("ibuprofeno 600 mg x 20 comprimidos");

    expect(intent.rawQuery).toBe("ibuprofeno 600 mg x 20 comprimidos");
    expect(intent.retrievalQuery).toBe("ibuprofeno");
    expect(intent.terms).toEqual(["ibuprofeno"]);
    expect(intent.concentration).toEqual({
      numerator: { value: 600, unit: "mg" },
      denominator: null,
    });
    expect(intent.quantity).toBe(20);
    expect(intent.dosageForm).toBe("solid-oral");
  });

  it("`retrievalQuery` es EXACTAMENTE `cleanQuery(raw)` — el retrieval no cambia", () => {
    // Invariante de baseline: este ticket no toca la recuperación. Si alguna
    // vez `parseQueryIntent` empezara a restringir lo que se manda a las 9
    // farmacias, este test lo detecta.
    for (const raw of [
      "ibuprofeno 600 mg x 20 comprimidos",
      "paracetamol 500 mg",
      "Tapsin Puro 500 mg x 16 comprimidos",
      "losartan + hidroclorotiazida",
      "omeprazol",
    ]) {
      expect(parseQueryIntent(raw).retrievalQuery).toBe(cleanQuery(raw));
    }
  });

  it("una consulta sin atributos no inventa ninguno", () => {
    const intent = parseQueryIntent("ibuprofeno");
    expect(intent.concentration).toBeNull();
    expect(intent.quantity).toBeNull();
    expect(intent.dosageForm).toBeNull();
    expect(intent.terms).toEqual(["ibuprofeno"]);
  });

  it("una combinación produce los dos términos, sin concentración inventada", () => {
    const intent = parseQueryIntent("losartan + hidroclorotiazida");
    expect(intent.terms).toEqual(["losartan", "hidroclorotiazida"]);
    expect(intent.concentration).toBeNull();
  });

  it("los términos se normalizan (sin acentos, minúscula) y no incluyen números", () => {
    expect(parseQueryIntent("Tapsin").terms).toEqual(["tapsin"]);
    expect(parseQueryIntent("Losartán 50 mg").terms).toEqual(["losartan"]);
    expect(parseQueryIntent("paracetamol 500 mg x 16").terms).toEqual(["paracetamol"]);
  });
});

describe("parseConcentration — modelo extensible, sin unidades compuestas", () => {
  it("dosis absoluta: denominador null", () => {
    expect(parseConcentration("600 mg")).toEqual({
      numerator: { value: 600, unit: "mg" },
      denominator: null,
    });
  });

  it("'250 mg/5 ml' es numerador 250 mg y denominador 5 ml — NUNCA la unidad compuesta 'mg/5ml'", () => {
    const parsed = parseConcentration("Amoxicilina 250 mg/5 ml polvo para suspensión oral");
    expect(parsed).toEqual({
      numerator: { value: 250, unit: "mg" },
      denominator: { value: 5, unit: "ml" },
    });
    // La comprobación explícita que pide el ticket: la unidad del numerador es
    // una unidad real, no un literal compuesto.
    expect(parsed!.numerator.unit).toBe("mg");
    expect(parsed!.denominator!.unit).toBe("ml");
  });

  it("'20 mg/ml' se normaliza a denominador {1, ml} — decisión documentada", () => {
    expect(parseConcentration("Omeprazol 20 mg/ml")).toEqual({
      numerator: { value: 20, unit: "mg" },
      denominator: { value: 1, unit: "ml" },
    });
  });

  it("normaliza grafías reales de las 9 farmacias sin perder el valor", () => {
    expect(parseConcentration("100 mcg")).toEqual({ numerator: { value: 100, unit: "mcg" }, denominator: null });
    expect(parseConcentration("100 µg")).toEqual({ numerator: { value: 100, unit: "mcg" }, denominator: null });
    expect(parseConcentration("1 gr")).toEqual({ numerator: { value: 1, unit: "g" }, denominator: null });
    expect(parseConcentration("0,5 g")).toEqual({ numerator: { value: 0.5, unit: "g" }, denominator: null });
    expect(parseConcentration("5 cc")).toEqual({ numerator: { value: 5, unit: "ml" }, denominator: null });
  });

  it("no confunde una palabra que empieza por la unidad con la unidad", () => {
    // "500 gramos" no es "500 g": la unidad tiene que terminar ahí.
    expect(parseConcentration("Paracetamol 500 gramos")).toBeNull();
  });

  it("no lee la cantidad de unidades como si fuera concentración", () => {
    // "x 30" y "30 Cápsulas" no llevan unidad de dosis.
    expect(parseConcentration("Omeprazol (B) 20mg 30 Cápsulas")).toEqual({
      numerator: { value: 20, unit: "mg" },
      denominator: null,
    });
    expect(parseConcentration("Tapsin X 6 Comprimidos (Maver)")).toBeNull();
  });

  it("una razón masa/masa se lee como COMBINACIÓN, no como concentración (protección S-1)", () => {
    // "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30" — leerla
    // como "4 mg/mg" rompería la consulta "losartán 50 mg" y contradiría la
    // detección de combinaciones de matching.ts.
    expect(
      parseConcentration("Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos")
    ).toEqual({ numerator: { value: 50, unit: "mg" }, denominator: null });
  });

  it("una razón masa/volumen real SÍ conserva su denominador", () => {
    expect(parseConcentration("Omeprazol 40 mg/10 ml. Inyectable x 1 Frasco Ampolla")).toEqual({
      numerator: { value: 40, unit: "mg" },
      denominator: { value: 10, unit: "ml" },
    });
  });

  it("un denominador que no es unidad de dosis no se toma como denominador", () => {
    // "100 mcg/Dosis" (Salbutamol, Ahumada) — "dosis" no es una unidad.
    expect(parseConcentration("Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol")).toEqual({
      numerator: { value: 100, unit: "mcg" },
      denominator: null,
    });
  });
});

describe("isSameConcentration / isSameMeasurement", () => {
  it("convierte dentro de la misma familia de unidades", () => {
    expect(isSameMeasurement({ value: 0.5, unit: "g" }, { value: 500, unit: "mg" })).toBe(true);
    expect(isSameMeasurement({ value: 1000, unit: "mcg" }, { value: 1, unit: "mg" })).toBe(true);
    expect(isSameMeasurement({ value: 600, unit: "mg" }, { value: 400, unit: "mg" })).toBe(false);
  });

  it("no convierte entre familias distintas", () => {
    expect(isSameMeasurement({ value: 20, unit: "mg" }, { value: 20, unit: "ml" })).toBe(false);
  });

  it("compara razones, no literales: 250 mg/5 ml === 50 mg/ml", () => {
    expect(
      isSameConcentration(parseConcentration("250 mg/5 ml")!, parseConcentration("50 mg/ml")!)
    ).toBe(true);
    expect(
      isSameConcentration(parseConcentration("250 mg/5 ml")!, parseConcentration("500 mg/10 ml")!)
    ).toBe(true);
    expect(
      isSameConcentration(parseConcentration("250 mg/5 ml")!, parseConcentration("500 mg/5 ml")!)
    ).toBe(false);
  });

  it("una dosis absoluta nunca es igual a una razón, aunque el número coincida", () => {
    expect(
      isSameConcentration(parseConcentration("600 mg")!, parseConcentration("600 mg/ml")!)
    ).toBe(false);
  });

  it("una unidad sin conversión conocida solo coincide consigo misma", () => {
    expect(isSameMeasurement({ value: 100, unit: "ui" }, { value: 100, unit: "ui" })).toBe(true);
    expect(isSameMeasurement({ value: 100, unit: "ui" }, { value: 100, unit: "mg" })).toBe(false);
  });
});

describe("parseQuantity", () => {
  it("lee las dos formas de cantidad de los catálogos", () => {
    expect(parseQuantity("ibuprofeno 600 mg x 20 comprimidos")).toBe(20);
    expect(parseQuantity("paracetamol 500 mg 16 comprimidos")).toBe(16);
    expect(parseQuantity("Losartan 50 mg x 30 comprimidos")).toBe(30);
  });

  it("no confunde la dosis con la cantidad", () => {
    expect(parseQuantity("ibuprofeno 600 mg")).toBeNull();
    expect(parseQuantity("paracetamol")).toBeNull();
  });
});

describe("queryIntentCacheKey — corrección directa del mecanismo de QA-05", () => {
  it("tres concentraciones distintas de ibuprofeno producen TRES claves distintas", () => {
    // Producción 2026-08-28: las tres consultas compartían entrada de caché y
    // la 2ª y 3ª respondieron `x-search-cache: hit` con los mismos 110
    // resultados. Con la clave por intención eso es imposible.
    const keys = ["ibuprofeno 200 mg", "ibuprofeno 400 mg", "ibuprofeno 600 mg"].map((q) =>
      queryIntentCacheKey(parseQueryIntent(q))
    );
    expect(new Set(keys).size).toBe(3);
    expect(keys).toEqual(["ibuprofeno|dose:200mg", "ibuprofeno|dose:400mg", "ibuprofeno|dose:600mg"]);
  });

  it("una consulta con cantidad no colapsa con la misma sin cantidad", () => {
    expect(queryIntentCacheKey(parseQueryIntent("paracetamol 500 mg x 16"))).not.toBe(
      queryIntentCacheKey(parseQueryIntent("paracetamol 500 mg"))
    );
  });

  it("una consulta sin atributos produce la clave histórica (solo la consulta amplia)", () => {
    expect(queryIntentCacheKey(parseQueryIntent("ibuprofeno"))).toBe("ibuprofeno");
    expect(queryIntentCacheKey(parseQueryIntent("Tapsin"))).toBe("tapsin");
  });

  it("dos escrituras equivalentes de la misma intención comparten clave", () => {
    expect(queryIntentCacheKey(parseQueryIntent("Ibuprofeno 600 MG"))).toBe(
      queryIntentCacheKey(parseQueryIntent("ibuprofeno 600mg"))
    );
  });

  it("una razón no se aplana a una unidad compuesta ambigua en la clave", () => {
    expect(concentrationKey(parseConcentration("250 mg/5 ml")!)).toBe("250mg/5ml");
    expect(concentrationKey(parseConcentration("600 mg")!)).toBe("600mg");
  });
});
