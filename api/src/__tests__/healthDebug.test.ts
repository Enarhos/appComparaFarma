import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Diagnóstico temporal de cierre de producción (2026-08-16, investigación
// UPSTASH_ROOT_CAUSE): /api/health?debug=1 expone solo presencia booleana
// (Boolean(process.env.X)) de las env vars de Upstash, nunca valores. Sirve
// para distinguir, en una sola llamada contra producción, si el runtime
// desplegado realmente carece de las variables (causa de plataforma/Vercel)
// o si las tiene y el problema está en el constructor de Redis (causa de
// código). Gateado por isDebugAuthorized() — mismo mecanismo fail-closed que
// /api/search?debug=1 (Sprint SEC-001): sin API_SECRET_KEY, siempre 403.

const pingRedisMock = vi.hoisted(() => vi.fn());
const pingSupabaseMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/cache.js", () => ({
  pingRedis: (...args: unknown[]) => pingRedisMock(...args),
}));

vi.mock("../lib/supabaseClient.js", () => ({
  pingSupabase: (...args: unknown[]) => pingSupabaseMock(...args),
}));

import { handleHealthRoute } from "../routes/health.js";

function makeReq(overrides: Partial<{ url: string; headers: Record<string, string> }> = {}) {
  return {
    method: "GET",
    url: overrides.url ?? "/api/health",
    headers: overrides.headers ?? {},
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

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  pingRedisMock.mockReset();
  pingSupabaseMock.mockReset();
  pingRedisMock.mockResolvedValue("not_configured");
  pingSupabaseMock.mockResolvedValue("ok");
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/health — debug=1 privilegiado (presencia booleana de env de Upstash)", () => {
  it("sin debug=1, la respuesta no incluye el campo diagnostics (comportamiento existente sin cambios)", async () => {
    const req = makeReq();
    const res = makeRes();

    await handleHealthRoute(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body!);
    expect(body.ok).toBe(true);
    expect(body.diagnostics).toBeUndefined();
  });

  it("responde 403 si se pide debug=1 sin API_SECRET_KEY configurado (fail-closed, sin fallback abierto)", async () => {
    delete process.env.API_SECRET_KEY;
    const req = makeReq({ url: "/api/health?debug=1" });
    const res = makeRes();

    await handleHealthRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(pingRedisMock).not.toHaveBeenCalled();
  });

  it("responde 403 si hay API_SECRET_KEY configurado pero no se envía x-api-key", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ url: "/api/health?debug=1" });
    const res = makeRes();

    await handleHealthRoute(req, res);

    expect(res.statusCode).toBe(403);
  });

  it("con x-api-key correcto, debug=1 agrega solo booleanos de presencia — sin valores, sin longitudes", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "un-token-secreto";

    const req = makeReq({
      url: "/api/health?debug=1",
      headers: { "x-api-key": "s3cr3t" },
    });
    const res = makeRes();

    await handleHealthRoute(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body!);
    expect(body.diagnostics).toEqual({
      env: { upstashUrlPresent: true, upstashTokenPresent: true },
    });

    // Nunca debe filtrarse el valor real ni fragmentos de él.
    expect(res.body).not.toContain("example.upstash.io");
    expect(res.body).not.toContain("un-token-secreto");
  });

  it("con x-api-key correcto pero sin las env vars de Upstash, diagnostics reporta ambos en false", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const req = makeReq({
      url: "/api/health?debug=1",
      headers: { "x-api-key": "s3cr3t" },
    });
    const res = makeRes();

    await handleHealthRoute(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body!);
    expect(body.diagnostics).toEqual({
      env: { upstashUrlPresent: false, upstashTokenPresent: false },
    });
  });
});
