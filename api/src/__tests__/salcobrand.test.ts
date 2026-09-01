import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseSalcobrandResponse } from "../clients/salcobrand.js";

const fixturePath = join(import.meta.dirname, "fixtures", "salcobrand-search.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { hits: Record<string, unknown>[] };

describe("parseSalcobrandResponse", () => {
  it("maps price channels", () => {
    const results = parseSalcobrandResponse(fixture, "paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Kitadol (B) Paracetamol 500mg 24 Comprimidos",
      price: 1499,
      onlinePrice: 999,
      sbpayPrice: 854,
      cmrPrice: null,
      // CF-DATA-001: `hit.brand` de Salcobrand es la MARCA COMERCIAL, no un
      // laboratorio. El propio fixture lo demuestra: el valor es "Kitadol", la
      // marca del producto, no su fabricante. Salcobrand no expone fabricante.
      brand: "Kitadol",
      manufacturer: null,
      onlineUrl: "https://salcobrand.cl/products/kitadol-b-paracetamol-500mg-24-comprimidos?default_sku=430924",
    });
  });
});

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30).
 *
 * HALLAZGO SOBRE EL TEST ANTERIOR: afirmaba `isBioequivalent: true` para
 * "Kitadol (B)" y pasaba — pero por la razón equivocada. El fixture trae
 * `bioequivalent_filter: {has_bioequivalent: true}` y Kitadol (B) resulta ser
 * de verdad bioequivalente, así que la coincidencia era casual: el campo NO
 * significa "este producto es bioequivalente" sino "este producto TIENE
 * bioequivalentes disponibles".
 *
 * Evidencia del índice Algolia real (`sb_variant_production`, 2026-08-30), con
 * la etiqueta que el propio campo transporta:
 *   Lipitor (R) Atorvastatina 20mg  -> has_bioequivalent=true,  "Bioequivalentes"
 *   Cozaar (R) Losartán 50mg        -> has_bioequivalent=true,  "Bioequivalentes"
 *   Omeprazol (B) 20mg 30 Cápsulas  -> has_bioequivalent=false, "Sin Bioequivalentes"
 *   Tapsin Forte (B) Paracetamol    -> has_bioequivalent=false, "Sin Bioequivalentes"
 * Los "(R)" son los REFERENTES (nunca son bioequivalentes de nadie) y los "(B)"
 * llevan el sello del ISP. Medido en producción: 7 de 7 productos "(R)" se
 * publicaban como bioequivalentes y 34 de 92 ofertas marcadas `false` llevaban
 * "(B)" en su propio nombre.
 */
describe("parseSalcobrandResponse — bioequivalencia", () => {
  it("no afirma bioequivalencia: Salcobrand no expone ese dato", () => {
    const results = parseSalcobrandResponse(fixture, "paracetamol");
    expect(results[0].isBioequivalent).toBeNull();
  });

  it("ignora `bioequivalent_filter.has_bioequivalent` incluso cuando viene `true`", () => {
    // El fixture ya trae `has_bioequivalent: true`; el resultado debe seguir
    // siendo `null`. Si alguien vuelve a conectar ese campo, este test falla.
    expect(fixture.hits[0].bioequivalent_filter).toEqual({ has_bioequivalent: true });
    expect(parseSalcobrandResponse(fixture, "paracetamol")[0].isBioequivalent).toBeNull();
  });

  it("un REFERENTE con `has_bioequivalent: true` no se publica como bioequivalente", () => {
    // Caso real reducido: Lipitor (R) es el producto de referencia, no un
    // bioequivalente. Con la lectura anterior salía `true`.
    const referente = {
      hits: [
        {
          name: "Lipitor (R) Atorvastatina 20mg 30 Comprimidos Recubiertos",
          normal_price: 25990,
          slug: "lipitor-r-atorvastatina-20mg-30-comprimidos-recubiertos",
          sku: "1234567",
          brand: "Lipitor",
          bioequivalent_filter: { has_bioequivalent: true, label: "Bioequivalentes" },
        },
      ],
    };
    expect(parseSalcobrandResponse(referente, "atorvastatina")[0].isBioequivalent).toBeNull();
  });

  it("un BIOEQUIVALENTE real con `has_bioequivalent: false` tampoco se publica como no-bioequivalente", () => {
    // El simétrico: "Omeprazol (B)" llevaba `false` y se publicaba como
    // afirmación negativa. Ahora es `null` en ambos sentidos.
    const bioequivalente = {
      hits: [
        {
          name: "Omeprazol (B) 20mg 30 Cápsulas Recubiertas",
          normal_price: 3990,
          slug: "omeprazol-b-20mg-30-capsulas-recubiertas",
          sku: "7654321",
          brand: "Omeprazol",
          bioequivalent_filter: { has_bioequivalent: false, label: "Sin Bioequivalentes" },
        },
      ],
    };
    const result = parseSalcobrandResponse(bioequivalente, "omeprazol")[0];
    expect(result.isBioequivalent).toBeNull();
    expect(result.isBioequivalent).not.toBe(false);
  });
});
