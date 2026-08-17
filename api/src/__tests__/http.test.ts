import { describe, expect, it } from "vitest";

import { applyCorsHeaders, json, type RequestLike } from "../lib/http.js";

function makeRes() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end() {},
    headers,
  };
}

function makeReq(origin?: string): RequestLike {
  return { headers: origin ? { origin } : {} };
}

describe("applyCorsHeaders", () => {
  it("echoes back an allowed origin", () => {
    const res = makeRes();
    applyCorsHeaders(res, makeReq("https://www.preciosfarma.cl"));
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.preciosfarma.cl");
    expect(res.headers["Vary"]).toBe("Origin");
  });

  it("does not set the header for a disallowed origin", () => {
    const res = makeRes();
    applyCorsHeaders(res, makeReq("https://evil.example"));
    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(res.headers["Vary"]).toBe("Origin");
  });

  it("skips entirely when there is no Origin header (native app, curl, server-to-server)", () => {
    const res = makeRes();
    applyCorsHeaders(res, makeReq());
    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(res.headers["Vary"]).toBeUndefined();
  });

  it("skips entirely when no request is provided", () => {
    const res = makeRes();
    applyCorsHeaders(res);
    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("json", () => {
  it("applies CORS headers based on the passed-through request", () => {
    const res = makeRes();
    json(res, 200, { ok: true }, makeReq("http://localhost:3000"));
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
  });
});
