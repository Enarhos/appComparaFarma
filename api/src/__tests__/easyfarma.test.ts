import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseEasyFarmaResponse } from "../clients/easyfarma.js";
import { toPharmacyPrice } from "@comparafarma/domain";

// Fixture actualizado tras la migración de EasyFarma a nuevo.easyfarma.cl
// (tema PrestaShop "leo_medilazar", artículos "product-miniature") — ver
// docs/operations (sesión 2026-08-15) para el detalle de la investigación.
const fixturePath = join(import.meta.dirname, "fixtures", "easyfarma-search.html");
const html = readFileSync(fixturePath, "utf8");

describe("parseEasyFarmaResponse (nuevo.easyfarma.cl)", () => {
  it("parsea las 3 tarjetas con precio válido del fixture (la 4ta se excluye por no tener precio)", () => {
    const results = parseEasyFarmaResponse(html);
    expect(results).toHaveLength(3);
  });

  it("extrae nombre, precio y URL de un producto con imagen normal", () => {
    const results = parseEasyFarmaResponse(html);
    const paracetamol = results.find((r) => r.name.includes("Paracetamol 500"));

    expect(paracetamol).toMatchObject({
      name: "Paracetamol 500 mg. 16 comp.",
      price: 690,
      onlineUrl: "https://nuevo.easyfarma.cl/24713-paracetamol-500-mg-x-16.html",
      imageUrl: "https://nuevo.easyfarma.cl/18980-home_default/paracetamol-500-mg-x-16.jpg",
    });
  });

  it("interpreta correctamente el formato de precio con espacio y miles ('$ 1.490')", () => {
    const results = parseEasyFarmaResponse(html);
    const gotas = results.find((r) => r.name.includes("Gotas"));

    expect(gotas?.price).toBe(1490);
    expect(gotas?.price).not.toBeNaN();
  });

  it("interpreta correctamente precios de 5 cifras ('$ 12.490')", () => {
    const results = parseEasyFarmaResponse(html);
    const ibuprofeno = results.find((r) => r.name.includes("Ibuprofeno"));

    expect(ibuprofeno?.price).toBe(12490);
  });

  it("deja imageUrl en null cuando el producto no tiene <img> (placeholder 'Imagen no disponible')", () => {
    const results = parseEasyFarmaResponse(html);
    const ibuprofeno = results.find((r) => r.name.includes("Ibuprofeno"));

    expect(ibuprofeno?.imageUrl).toBeNull();
  });

  it("excluye un producto sin precio visible ('Consultar disponibilidad'), sin inventar un precio", () => {
    const results = parseEasyFarmaResponse(html);
    const sinPrecio = results.find((r) => r.name.includes("Producto Sin Precio"));

    expect(sinPrecio).toBeUndefined();
  });

  it("nunca deja price NaN o 0 en ningún resultado", () => {
    const results = parseEasyFarmaResponse(html);
    expect(results.every((r) => Number.isFinite(r.price) && r.price > 0)).toBe(true);
  });

  it("no expone canales online/cmr/sbpay ni laboratorio (EasyFarma solo expone precio de lista)", () => {
    const results = parseEasyFarmaResponse(html);
    expect(results.every((r) => r.onlinePrice === null && r.cmrPrice === null && r.sbpayPrice === null)).toBe(true);
    expect(results.every((r) => r.laboratory === null)).toBe(true);
  });

  it("toPharmacyPrice() da effective = store para un producto de EasyFarma", () => {
    const results = parseEasyFarmaResponse(html);
    const paracetamol = results.find((r) => r.name.includes("Paracetamol 500"));
    if (!paracetamol) throw new Error("fixture no encontró Paracetamol 500");

    const pharmacyPrice = toPharmacyPrice(paracetamol, "easyfarma", "EasyFarma");
    expect(pharmacyPrice.channels).toEqual({
      store: 690,
      online: null,
      cmr: null,
      sbpay: null,
      effective: 690,
    });
  });

  it("devuelve un array vacío ante HTML sin ningún producto ('sin resultados')", () => {
    const noResultsHtml = `<!DOCTYPE html><html><body><section id="js-product-list"><div class="products row"></div></section></body></html>`;
    expect(parseEasyFarmaResponse(noResultsHtml)).toEqual([]);
  });

  it("no revienta con HTML inesperado / inválido (tags sin cerrar, contenido basura)", () => {
    const garbage = `<html><body><article class="product-miniature"><h3 class="product-title"><a href="x">rota`;
    expect(() => parseEasyFarmaResponse(garbage)).not.toThrow();
    expect(parseEasyFarmaResponse(garbage)).toEqual([]);
  });

  it("no revienta con un string vacío", () => {
    expect(parseEasyFarmaResponse("")).toEqual([]);
  });
});
