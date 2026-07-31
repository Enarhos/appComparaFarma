import { describe, it, expect, vi, afterEach } from "vitest";
import { getRecipePrices } from "./getRecipePrices";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getRecipePrices", () => {
  it("resolves each item to the medication with the matching matchKey", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg" },
            { matchKey: "paracetamol|1000mg", canonicalName: "Paracetamol 1000 mg" },
          ]),
      })
    );

    const [result] = await getRecipePrices([{ matchKey: "paracetamol|500mg", canonicalName: "Paracetamol" }]);

    expect(result).toEqual({ matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg" });
  });

  it("returns null (without throwing) for an item whose matchKey no longer appears in the results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    const [result] = await getRecipePrices([{ matchKey: "descontinuado", canonicalName: "Ya no existe" }]);

    expect(result).toBeNull();
  });

  it("resolves multiple items independently, in parallel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        const isParacetamol = url.includes("Paracetamol");
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve(
              isParacetamol
                ? [{ matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg" }]
                : [{ matchKey: "ibuprofeno|400mg", canonicalName: "Ibuprofeno 400 mg" }]
            ),
        });
      })
    );

    const results = await getRecipePrices([
      { matchKey: "paracetamol|500mg", canonicalName: "Paracetamol" },
      { matchKey: "ibuprofeno|400mg", canonicalName: "Ibuprofeno" },
    ]);

    expect(results).toEqual([
      { matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg" },
      { matchKey: "ibuprofeno|400mg", canonicalName: "Ibuprofeno 400 mg" },
    ]);
  });
});
