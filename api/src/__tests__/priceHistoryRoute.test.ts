import { describe, it, expect, vi, beforeEach } from "vitest";

const getPriceHistoryMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/priceHistoryQuery.js", () => ({
  getPriceHistory: (...args: unknown[]) => getPriceHistoryMock(...args),
}));

import { handlePriceHistoryRoute } from "../routes/priceHistory.js";

function makeReq(overrides: Partial<{ method: string; url: string }> = {}) {
  return {
    method: overrides.method ?? "GET",
    url: overrides.url ?? "/api/price-history?matchKey=paracetamol%7C500mg",
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as string | undefined,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res.headers[name] = value;
    },
    end(body?: string) {
      res.body = body;
    },
  };
  return res;
}

const DEFAULT_RESULT = {
  matchKey: "paracetamol|500mg",
  canonicalName: "Paracetamol 500 mg",
  from: "2026-04-28",
  to: "2026-07-27",
  series: [],
  summary: {
    latestBestPrice: null,
    latestBestPharmacy: null,
    lowestRecordedPrice: null,
    highestRecordedPrice: null,
    change7dPercent: null,
    change30dPercent: null,
  },
};

beforeEach(() => {
  getPriceHistoryMock.mockReset();
  getPriceHistoryMock.mockResolvedValue(DEFAULT_RESULT);
});

describe("handlePriceHistoryRoute — método y parámetros", () => {
  it("rejects non-GET methods with 405", async () => {
    const req = makeReq({ method: "POST" });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(res.statusCode).toBe(405);
    expect(getPriceHistoryMock).not.toHaveBeenCalled();
  });

  it("rejects a request without matchKey with 400", async () => {
    const req = makeReq({ url: "/api/price-history" });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(getPriceHistoryMock).not.toHaveBeenCalled();
  });

  it("rejects a matchKey shorter than 2 characters with 400", async () => {
    const req = makeReq({ url: "/api/price-history?matchKey=a" });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("rejects a matchKey longer than 180 characters with 400", async () => {
    const req = makeReq({ url: `/api/price-history?matchKey=${"a".repeat(181)}` });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("handlePriceHistoryRoute — delegación a getPriceHistory", () => {
  it("passes the decoded matchKey and null days when days is absent", async () => {
    const req = makeReq({ url: "/api/price-history?matchKey=paracetamol%7C500mg" });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(getPriceHistoryMock).toHaveBeenCalledWith("paracetamol|500mg", null);
    expect(res.statusCode).toBe(200);
  });

  it("passes a numeric days parameter through unchanged", async () => {
    const req = makeReq({ url: "/api/price-history?matchKey=paracetamol%7C500mg&days=30" });
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(getPriceHistoryMock).toHaveBeenCalledWith("paracetamol|500mg", 30);
  });

  it("responds 200 with the result from getPriceHistory serialized as JSON", async () => {
    const req = makeReq();
    const res = makeRes();

    await handlePriceHistoryRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}")).toEqual(DEFAULT_RESULT);
  });
});
