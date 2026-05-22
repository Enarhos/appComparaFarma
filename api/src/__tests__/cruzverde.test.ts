import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCruzVerdeResponse } from "../clients/cruzverde.js";

const fixturePath = join(import.meta.dirname, "fixtures", "cruzverde-search.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { hits: Record<string, unknown>[] };

describe("parseCruzVerdeResponse", () => {
  it("maps valid hits and ignores items without price", () => {
    const results = parseCruzVerdeResponse(fixture, "paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Paracetamol 500 mg 16 Comprimidos",
      price: 840,
      hasStock: true,
      onlineUrl: "https://www.cruzverde.cl/paracetamol-500-mg-16-comprimidos/272241.html",
      imageUrl: "https://beta.cruzverde.cl/images/272241.jpg",
    });
  });
});
