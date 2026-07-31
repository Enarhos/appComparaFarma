import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseEasyFarmaResponse } from "../clients/easyfarma.js";
import { toPharmacyPrice } from "@comparafarma/domain";

const fixturePath = join(import.meta.dirname, "fixtures", "easyfarma-search.html");
const html = readFileSync(fixturePath, "utf8");

describe("parseEasyFarmaResponse", () => {
  it("extrae el precio Normal visible como price y NUNCA el 'Plus' oculto como cmrPrice", () => {
    const results = parseEasyFarmaResponse(html);
    const apidra = results.find((result) => result.name.includes("Insulina Apidra"));

    expect(apidra).toMatchObject({
      name: "Insulina Apidra Solostar 1 Unidad",
      price: 9990,
      cmrPrice: null,
      onlineUrl: "https://www.easyfarma.cl/producto/insulina-apidra-solostar-1-unidad.html",
    });
  });

  it("sigue extrayendo el precio Normal correctamente en una tarjeta sin bloque Plus", () => {
    const results = parseEasyFarmaResponse(html);
    const producto = results.find((result) => result.name.includes("Producto Sin Plus"));

    expect(producto).toMatchObject({ price: 1990, cmrPrice: null });
  });

  it("caso real simplificado de Apidra: toPharmacyPrice() da effective = store (9990), sin canal cmr", () => {
    const results = parseEasyFarmaResponse(html);
    const apidra = results.find((result) => result.name.includes("Insulina Apidra"));
    if (!apidra) throw new Error("fixture no encontró Apidra");

    const pharmacyPrice = toPharmacyPrice(apidra, "easyfarma", "EasyFarma");

    expect(pharmacyPrice.channels).toEqual({
      store: 9990,
      online: null,
      cmr: null,
      sbpay: null,
      effective: 9990,
    });
  });

  it("no revienta ni produce 0/NaN con el placeholder vacío <del>$</del>", () => {
    const results = parseEasyFarmaResponse(html);
    const paracetamol = results.find((result) => result.name.includes("Paracetamol"));

    expect(paracetamol?.price).toBe(690);
    expect(paracetamol?.price).not.toBeNaN();
    expect(paracetamol?.cmrPrice).toBeNull();
  });

  it("excluye del resultado un producto sin precio Normal válido, sin inventar un precio", () => {
    const results = parseEasyFarmaResponse(html);
    const sinPrecio = results.find((result) => result.name.includes("Producto Sin Precio Normal"));

    expect(sinPrecio).toBeUndefined();
  });

  it("parsea las 3 tarjetas con precio Normal válido del fixture (la 4ta se excluye a propósito)", () => {
    const results = parseEasyFarmaResponse(html);
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.cmrPrice === null)).toBe(true);
  });
});
