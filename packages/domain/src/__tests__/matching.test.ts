import { describe, expect, it } from "vitest";
import { matchKey } from "../matching.js";

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
