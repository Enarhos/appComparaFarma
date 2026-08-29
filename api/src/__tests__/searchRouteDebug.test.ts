import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const searchMedicationsMock = vi.hoisted(() => vi.fn());
const searchMedicationsDetailedMock = vi.hoisted(() => vi.fn());
const getCachedSearchMock = vi.hoisted(() => vi.fn());
const setCachedSearchMock = vi.hoisted(() => vi.fn());
// CF-SEARCH-002 — la ruta pasó a usar DOS niveles de caché (ver cache.ts):
// respuesta (clave por intención) y retrieval (clave por consulta amplia).
const getCachedRetrievalMock = vi.hoisted(() => vi.fn());
const setCachedRetrievalMock = vi.hoisted(() => vi.fn());

vi.mock("../services/searchService.js", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
  searchMedicationsDetailed: (...args: unknown[]) => searchMedicationsDetailedMock(...args),
}));

vi.mock("../lib/cache.js", () => ({
  getCachedSearch: (...args: unknown[]) => getCachedSearchMock(...args),
  setCachedSearch: (...args: unknown[]) => setCachedSearchMock(...args),
  getCachedRetrieval: (...args: unknown[]) => getCachedRetrievalMock(...args),
  setCachedRetrieval: (...args: unknown[]) => setCachedRetrievalMock(...args),
}));

import { handleSearchRoute } from "../routes/search.js";

function makeReq(overrides: Partial<{ url: string; headers: Record<string, string> }> = {}) {
  return {
    method: "GET",
    url: overrides.url ?? "/api/search?q=paracetamol",
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
  searchMedicationsMock.mockReset();
  searchMedicationsDetailedMock.mockReset();
  getCachedSearchMock.mockReset();
  setCachedSearchMock.mockReset();
  getCachedRetrievalMock.mockReset();
  setCachedRetrievalMock.mockReset();
  getCachedSearchMock.mockResolvedValue(null);
  getCachedRetrievalMock.mockResolvedValue(null);
  searchMedicationsMock.mockResolvedValue([]);
  searchMedicationsDetailedMock.mockResolvedValue({
    results: [],
    diagnostics: {
      query: "paracetamol",
      totalResults: 0,
      mergedResults: 0,
      durationMs: 12,
      pharmacies: [
        {
          pharmacySlug: "araucomed",
          pharmacyName: "AraucoMed",
          status: "rejected",
          resultCount: 0,
          durationMs: 8000,
          errorMessage: "timeout after 8000ms calling internal endpoint X",
        },
      ],
    },
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/search — busqueda publica + debug=1 privilegiado (Sprint SEC-001, antes REL-002)", () => {
  it("responde 403 si no hay API_SECRET_KEY configurado, aunque la búsqueda normal seguiría abierta", async () => {
    delete process.env.API_SECRET_KEY;
    const req = makeReq({ url: "/api/search?q=paracetamol&debug=1" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
    expect(JSON.parse(res.body ?? "{}")).not.toHaveProperty("diagnostics");
  });

  it("responde 403 si hay API_SECRET_KEY configurado pero no se envía x-api-key (gate de debug, ya no hay autorización general que lo bloquee antes)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ url: "/api/search?q=paracetamol&debug=1" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
  });

  it("responde 403 si el x-api-key enviado no coincide (gate de debug)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({
      url: "/api/search?q=paracetamol&debug=1",
      headers: { "x-api-key": "incorrecto" },
    });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
  });

  it("responde 200 con diagnósticos si el x-api-key enviado coincide", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({
      url: "/api/search?q=paracetamol&debug=1",
      headers: { "x-api-key": "s3cr3t" },
    });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(searchMedicationsDetailedMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(res.body ?? "{}");
    expect(body.diagnostics.pharmacies[0].errorMessage).toContain("timeout");
  });

  it("la búsqueda normal (sin debug) sigue abierta sin API_SECRET_KEY configurado — no se cambia ese comportamiento", async () => {
    delete process.env.API_SECRET_KEY;
    const req = makeReq({ url: "/api/search?q=paracetamol" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(searchMedicationsMock).toHaveBeenCalledTimes(1);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
  });

  it("la búsqueda normal (sin debug) es pública ahora aunque API_SECRET_KEY esté configurado y no se envíe x-api-key (Sprint SEC-001 — cambio intencional respecto al comportamiento previo)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ url: "/api/search?q=paracetamol" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(searchMedicationsMock).toHaveBeenCalledTimes(1);
  });

  it("la búsqueda normal (sin debug) sigue funcionando si un cliente antiguo (build ya instalado de Mobile) todavía envía un x-api-key desactualizado — se ignora sin error", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({
      url: "/api/search?q=paracetamol",
      headers: { "x-api-key": "un-valor-viejo-cualquiera" },
    });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(searchMedicationsMock).toHaveBeenCalledTimes(1);
  });

  it("debug=1 nunca tiene fallback abierto aunque el servidor no tenga API_SECRET_KEY configurado, incluso si se envía algún x-api-key", async () => {
    delete process.env.API_SECRET_KEY;
    const req = makeReq({
      url: "/api/search?q=paracetamol&debug=1",
      headers: { "x-api-key": "cualquier-valor" },
    });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
  });
});
