import { describe, expect, it } from "vitest";
import { combinationKey, matchKey } from "../matching.js";

describe("matchKey", () => {
  it("extrae marca, dosis y cantidad básicos", () => {
    expect(matchKey("Paracetamol 500 mg x 16 Comprimidos")).toBe("paracetamol|500mg|16");
  });

  it("[regresión] normaliza guión en Trio-Val", () => {
    expect(matchKey("Trio-Val 80mg x 30 Comprimidos")).toBe("trioval|80mg|30");
  });

  it("[regresión] normaliza guión en Co-Amoxiclav", () => {
    expect(matchKey("Co-Amoxiclav 500mg 21 Cápsulas")).toBe("coamoxiclav|500mg|21");
  });

  it("[regresión] short-word merging en Tri Fen", () => {
    expect(matchKey("Tri Fen 10mg")).toBe("trifen|10mg");
  });

  it("[regresión] indicador día", () => {
    expect(matchKey("Tapsin Plus Día 16 Comprimidos")).toBe("tapsin|d|16");
  });

  it("[regresión] indicador noche", () => {
    expect(matchKey("Tapsin Plus Noche 16 Comprimidos")).toBe("tapsin|n|16");
  });

  it("[regresión] Día y Noche generan matchKeys distintos", () => {
    expect(matchKey("Tapsin Plus Día 16 Comprimidos")).not.toBe(
      matchKey("Tapsin Plus Noche 16 Comprimidos")
    );
  });

  it("[regresión] convierte 0.5g a 500mg", () => {
    expect(matchKey("Amoxicilina Potásica 0.5g Cápsulas")).toBe("amoxicilina|500mg");
  });

  it("convierte gramo entero a mg", () => {
    expect(matchKey("Paracetamol 1g Comprimidos")).toBe("paracetamol|1000mg");
  });

  it("maneja dosis en mcg", () => {
    expect(matchKey("Levotiroxina 100mcg 30 Comprimidos")).toBe("levotiroxina|100mcg|30");
  });

  it("maneja dosis en ml", () => {
    expect(matchKey("Amoxicilina 250ml Suspensión")).toBe("amoxicilina|250ml");
  });

  it("normaliza qty=1 a vacío", () => {
    expect(matchKey("Tapsin 1 Sobre")).toBe("tapsin");
  });

  it("maneja nombre sin dosis ni cantidad", () => {
    expect(matchKey("Paracetamol")).toBe("paracetamol");
  });

  it("elimina puntuación del nombre", () => {
    expect(matchKey("Ibuprofeno, 400mg")).toBe("ibuprofeno|400mg");
  });

  it("no lanza excepción con input que empieza en número", () => {
    expect(() => matchKey("500mg")).not.toThrow();
    expect(typeof matchKey("500mg")).toBe("string");
  });
});

/**
 * S-1 (SEARCH-MATCHING-QA-01, Gate 2) — `combinationKey()`.
 *
 * Regla GENERAL, no un caso especial de losartán/hidroclorotiazida: se exige
 * (a) una señal de combinación —separador explícito entre ingredientes, o una
 * razón de dosis masa/masa— y (b) al menos dos tokens con forma de principio
 * activo. Los principios activos sintéticos ("Alfametina", "Betazolina", ...)
 * están para demostrar que la regla no depende de ninguna lista de moléculas.
 */
describe("combinationKey — detección de combinaciones (S-1)", () => {
  // -------------------------------------------------------------------------
  // Casos reales observados en producción (2026-08-27, query "losartan").
  // -------------------------------------------------------------------------
  it("detecta la combinación con separador '+' y razón de dosis", () => {
    expect(
      combinationKey("Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos")
    ).toBe("hidroclorotiazida");
  });

  it("detecta la misma combinación escrita con '/' entre ingredientes", () => {
    expect(combinationKey("Losartán/hidroclorotiazida 50/12,5 Mg X 30 Comprimidos")).toBe(
      "hidroclorotiazida"
    );
  });

  it("detecta la combinación sin separador entre palabras, por la razón de dosis", () => {
    expect(combinationKey("Losartan Hidroclorotiazida 50/12,5mg x30com")).toBe(
      "hidroclorotiazida"
    );
  });

  it("deriva el MISMO token con y sin la sal del primer principio activo", () => {
    // "Potásico" es una sal, no un segundo principio activo: si contara, dos
    // farmacias que escriben la misma combinación con y sin la sal quedarían
    // en grupos distintos.
    expect(combinationKey("Losartán Potásico + Hidroclorotiazida 50/12,5 mg")).toBe(
      combinationKey("Losartán + Hidroclorotiazida 50/12,5 mg")
    );
  });

  // -------------------------------------------------------------------------
  // Generalización — principios activos SINTÉTICOS (no existen; están para
  // probar que la regla no está atada a ninguna molécula concreta).
  // -------------------------------------------------------------------------
  it("[sintético] generaliza a cualquier combinación con '+'", () => {
    expect(combinationKey("Alfametina + Betazolina 100 mg / 25 mg x 20 comprimidos")).toBe(
      "betazolina"
    );
  });

  it("[sintético] generaliza a cualquier combinación con '/'", () => {
    expect(combinationKey("Gammacilina/Deltapramida 250 mg x 14 cápsulas")).toBe("deltapramida");
  });

  it("[sintético] generaliza a la razón de dosis sin separador de palabras", () => {
    expect(combinationKey("Epsilonavir Zetamicina 400/80 mg x 10 comprimidos")).toBe("zetamicina");
  });

  it("[sintético] toma el ingrediente a la derecha del separador aunque el primero sea compuesto", () => {
    // "Ácido Acetilsalicílico" son DOS palabras del MISMO principio activo:
    // sin la preferencia por el token posterior al separador, el token
    // derivado sería "acetilsalicilico".
    expect(combinationKey("Ácido Acetilsalicílico + Betazolina 500 mg / 50 mg")).toBe(
      "betazolina"
    );
  });

  it("[sintético] dos farmacias que escriben la misma combinación distinto derivan el mismo token", () => {
    const a = combinationKey("Alfametina + Betazolina 100/25 mg x 30 comprimidos");
    const b = combinationKey("Alfametina/Betazolina 100 mg / 25 mg x 30 comp");
    const c = combinationKey("Alfametina Betazolina 100/25mg x30com");
    expect(a).toBe("betazolina");
    expect(new Set([a, b, c]).size).toBe(1);
  });

  // -------------------------------------------------------------------------
  // NO-REGRESIÓN: ningún monofármaco debe recibir token de combinación.
  // -------------------------------------------------------------------------
  it("[no-regresión] los monofármacos no producen token de combinación", () => {
    const monos = [
      "Paracetamol 500 mg x 16 Comprimidos",
      "Ibuprofeno 400 mg x 20 comprimidos",
      "Omeprazol 20 mg x 30 cápsulas",
      "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)",
      "Amoxicilina Potásica 0.5g Cápsulas",
      "Levotiroxina 100mcg 30 Comprimidos",
      "Tapsin Puro Sin Cafeina 500 mg x 24 Comprimidos",
      "Paracetamol 500 mg x 16 comprimidos masticables",
      "Esomeprazol  20 mg x 30...",
    ];
    for (const name of monos) {
      expect({ name, combo: combinationKey(name) }).toEqual({ name, combo: null });
    }
  });

  it("[no-regresión] una concentración masa/volumen NO es una combinación", () => {
    // "100 mg/5 mL" describe UN principio activo en suspensión.
    expect(combinationKey("Ibuprofeno 100 mg/5 mL Suspensión 100 mL")).toBeNull();
    expect(combinationKey("Amoxicilina 250 mg / 5 ml Suspensión")).toBeNull();
  });

  it("[no-regresión] '+' entre palabras cortas (día/noche) no es una combinación", () => {
    expect(combinationKey("Tapsin Plus Día + Noche 16 Comprimidos")).toBeNull();
  });

  it("[no-regresión] un nombre de marca con razón de dosis pero sin ingredientes devuelve null", () => {
    // "Hyzaar" ES una combinación comercial, pero su nombre no expone ningún
    // ingrediente: no hay segundo token que extraer y tampoco hay riesgo de
    // colisión, porque su matchKey ya parte de la marca.
    expect(combinationKey("Hyzaar 50/12,5mg x30com")).toBeNull();
    expect(matchKey("Hyzaar 50/12,5mg x30com").startsWith("hyzaar")).toBe(true);
  });

  it("[no-regresión] los guiones los sigue resolviendo matchKey, no combinationKey", () => {
    // "Co-Amoxiclav"/"Trio-Val" se unen en matchKey ((\w)-(\w) -> $1$2), así
    // que ya producen una identidad propia sin necesidad del token nuevo.
    expect(combinationKey("Co-Amoxiclav 500mg 21 Cápsulas")).toBeNull();
    expect(matchKey("Co-Amoxiclav 500mg 21 Cápsulas")).toBe("coamoxiclav|500mg|21");
  });
});
