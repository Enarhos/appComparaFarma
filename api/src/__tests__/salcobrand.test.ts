import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseSalcobrandResponse } from "../clients/salcobrand.js";

const fixturePath = join(import.meta.dirname, "fixtures", "salcobrand-search.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { hits: Record<string, unknown>[] };

describe("parseSalcobrandResponse", () => {
  it("maps price channels including sbpay and bioequivalent flag", () => {
    const results = parseSalcobrandResponse(fixture, "paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Kitadol (B) Paracetamol 500mg 24 Comprimidos",
      price: 1499,
      onlinePrice: 999,
      sbpayPrice: 854,
      cmrPrice: null,
      laboratory: "Kitadol",
      isBioequivalent: true,
      onlineUrl: "https://salcobrand.cl/products/kitadol-b-paracetamol-500mg-24-comprimidos?default_sku=430924",
    });
  });
});
