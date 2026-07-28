import { describe, it, expect, vi, afterEach } from "vitest";
import { getPriceHistory } from "./priceHistory";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("getPriceHistory", () => {
  it("returns the parsed result on a successful response", async () => {
    const payload = {
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      from: "2026-04-28",
      to: "2026-07-27",
      series: [{ pharmacySlug: "cruz-verde", points: [] }],
      summary: {
        latestBestPrice: 2490,
        latestBestPharmacy: "cruz-verde",
        lowestRecordedPrice: 2290,
        highestRecordedPrice: 3290,
        change7dPercent: -8.1,
        change30dPercent: -12.4,
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    }) as unknown as typeof fetch;

    const result = await getPriceHistory("paracetamol|500mg");

    expect(result).toEqual(payload);
  });

  it("returns an empty-but-usable history when the response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const result = await getPriceHistory("paracetamol|500mg");

    expect(result.series).toEqual([]);
    expect(result.summary.latestBestPrice).toBeNull();
  });

  it("returns an empty-but-usable history when fetch throws (timeout/network error)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("timeout")) as unknown as typeof fetch;

    const result = await getPriceHistory("paracetamol|500mg");

    expect(result.matchKey).toBe("paracetamol|500mg");
    expect(result.series).toEqual([]);
    expect(result.summary.change7dPercent).toBeNull();
  });

  it("encodes the matchKey and includes the days parameter in the request URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matchKey: "a|b", canonicalName: null, from: "", to: "", series: [], summary: {} }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await getPriceHistory("paracetamol|500mg", 30);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("matchKey=paracetamol%7C500mg");
    expect(url).toContain("days=30");
  });
});
