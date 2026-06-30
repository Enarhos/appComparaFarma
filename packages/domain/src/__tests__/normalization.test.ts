import { describe, expect, it } from "vitest";
import { cleanQuery } from "../normalization.js";

describe("cleanQuery", () => {
  it("corta en palabra de receta: tomar", () => {
    expect(cleanQuery("Paracetamol 500mg tomar cada 8 horas")).toBe("Paracetamol");
  });

  it("corta en palabra de receta: administrar", () => {
    expect(cleanQuery("Aspirina 100mg administrar con agua")).toBe("Aspirina");
  });

  it("elimina dosis y palabras genéricas", () => {
    expect(cleanQuery("Ibuprofeno 400 mg comprimidos")).toBe("Ibuprofeno");
  });

  it("retorna vacío cuando todos los términos son genéricos", () => {
    expect(cleanQuery("500 mg comprimidos")).toBe("");
  });

  it("retorna vacío con input vacío", () => {
    expect(cleanQuery("")).toBe("");
  });

  it("elimina contenido entre corchetes y paréntesis", () => {
    expect(cleanQuery("Paracetamol [marcas alternativas] (500mg)")).toBe("Paracetamol");
  });

  it("deduplica palabras repetidas", () => {
    expect(cleanQuery("Ibuprofeno Ibuprofeno 400mg")).toBe("Ibuprofeno");
  });

  it("convierte slash en separador de palabras", () => {
    expect(cleanQuery("Clonazepam/Quetiapina 1mg")).toBe("Clonazepam Quetiapina");
  });
});
