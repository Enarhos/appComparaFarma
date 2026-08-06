import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const searchMedicationsMock = vi.hoisted(() => vi.fn());
const searchMedicationsDetailedMock = vi.hoisted(() => vi.fn());
const getCachedSearchMock = vi.hoisted(() => vi.fn());
const setCachedSearchMock = vi.hoisted(() => vi.fn());

vi.mock("../services/searchService.js", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
  searchMedicationsDetailed: (...args: unknown[]) => searchMedicationsDetailedMock(...args),
}));

vi.mock("../lib/cache.js", () => ({
  getCachedSearch: (...args: unknown[]) => getCachedSearchMock(...args),
  setCachedSearch: (...args: unknown[]) => setCachedSearchMock(...args),
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
  getCachedSearchMock.mockResolvedValue(null);
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

describe("GET /api/search?debug=1 — autorización estricta (Sprint REL-002)", () => {
  it("responde 403 si no hay API_SECRET_KEY configurado, aunque la búsqueda normal seguiría abierta", async () => {
    delete process.env.API_SECRET_KEY;
    const req = makeReq({ url: "/api/search?q=paracetamol&debug=1" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(403);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
    expect(JSON.parse(res.body ?? "{}")).not.toHaveProperty("diagnostics");
  });

  it("responde 401 si hay API_SECRET_KEY configurado pero no se envía x-api-key (bloqueado por la autorización general, antes de llegar al gate de debug)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ url: "/api/search?q=paracetamol&debug=1" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(401);
    expect(searchMedicationsDetailedMock).not.toHaveBeenCalled();
  });

  it("responde 401 si el x-api-key enviado no coincide (bloqueado por la autorización general)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({
      url: "/api/search?q=paracetamol&debug=1",
      headers: { "x-api-key": "incorrecto" },
    });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(401);
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

  it("la búsqueda normal (sin debug) sigue exigiendo x-api-key correcto si API_SECRET_KEY está configurado (comportamiento previo sin cambios)", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ url: "/api/search?q=paracetamol" });
    const res = makeRes();

    await handleSearchRoute(req, res);

    expect(res.statusCode).toBe(401);
  });
});
