import { describe, it, expect, afterEach } from "vitest";
import { isAuthorized, isDebugAuthorized } from "../middleware/auth.js";
import type { RequestLike } from "../lib/http.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function req(headers: Record<string, string> = {}): RequestLike {
  return { headers };
}

describe("isDebugAuthorized — sin fallback abierto (Sprint REL-002)", () => {
  it("devuelve false si API_SECRET_KEY no está configurado (a diferencia de isAuthorized)", () => {
    delete process.env.API_SECRET_KEY;
    expect(isDebugAuthorized(req())).toBe(false);
    expect(isAuthorized(req())).toBe(true);
  });

  it("devuelve false si el header x-api-key no coincide", () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    expect(isDebugAuthorized(req({ "x-api-key": "otro" }))).toBe(false);
  });

  it("devuelve false si no se envía ningún header", () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    expect(isDebugAuthorized(req())).toBe(false);
  });

  it("devuelve true solo si el header x-api-key coincide exactamente", () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    expect(isDebugAuthorized(req({ "x-api-key": "s3cr3t" }))).toBe(true);
  });
});
