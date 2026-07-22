import { describe, it, expect, vi, afterEach } from "vitest";
import { searchMedications } from "./search";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchMedications", () => {
  it("returns the parsed results on a successful response", async () => {
    const fakeResults = [{ matchKey: "paracetamol|500mg" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(fakeResults),
      })
    );

    const outcome = await searchMedications("paracetamol");

    expect(outcome.error).toBeNull();
    expect(outcome.results).toEqual(fakeResults);
  });

  it("returns a friendly error when the API responds with a non-ok HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve([]),
      })
    );

    const outcome = await searchMedications("paracetamol");

    expect(outcome.results).toEqual([]);
    expect(outcome.error).toBe("No pudimos completar la búsqueda en este momento.");
  });

  it("returns a friendly error when fetch throws (network failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const outcome = await searchMedications("paracetamol");

    expect(outcome.results).toEqual([]);
    expect(outcome.error).toBe("No pudimos completar la búsqueda en este momento.");
  });
});
