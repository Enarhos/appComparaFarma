import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseAhumadaHtml } from "../clients/ahumada.js";

const fixturePath = join(import.meta.dirname, "fixtures", "ahumada-search.html");
const html = readFileSync(fixturePath, "utf8");

describe("parseAhumadaHtml", () => {
  it("parses direct store prices and detects bioequivalent badge", () => {
    const results = parseAhumadaHtml(html);
    const paracetamol = results.find((result) => result.name.includes("Paracetamol 500 mg x 16"));

    expect(paracetamol).toMatchObject({
      name: "Paracetamol 500 mg x 16 Comprimidos",
      price: 731,
      cmrPrice: null,
      isBioequivalent: true,
      onlineUrl: "https://www.farmaciasahumada.cl/paracetamol-500-mg-x-16-comprimidos-84574.html",
    });
  });

  it("parses CMR badge pricing and reconstructs the higher store price", () => {
    const results = parseAhumadaHtml(html);
    const bufferin = results.find((result) => result.name.includes("Bufferin Forte"));

    expect(bufferin).toMatchObject({
      name: "Bufferin Forte Paracetamol 1 G 18 Comprimidos",
      price: 12990,
      cmrPrice: 10990,
      isBioequivalent: false,
    });
  });
});
