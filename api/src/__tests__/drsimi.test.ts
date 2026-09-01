import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseDrSimiResponse } from "../clients/drsimi.js";

const fixturePath = join(import.meta.dirname, "fixtures", "drsimi-search.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>[];

describe("parseDrSimiResponse", () => {
  it("maps vtEX products and filters out irrelevant results", () => {
    const results = parseDrSimiResponse(fixture, "paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Paracetamol 500 mg 16 comprimidos",
      price: 550,
      onlinePrice: 480,
      hasStock: true,
      manufacturer: "ANDRÓMACO",
      isBioequivalent: true,
      onlineUrl: "https://www.drsimi.cl/paracetamol-500-mg-16-comprimidos/p",
    });
  });
});
