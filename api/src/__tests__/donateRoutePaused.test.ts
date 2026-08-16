import { describe, it, expect, vi, beforeEach } from "vitest";

// A diferencia de donateRoute.test.ts (que mockea lib/donationsConfig.js a
// false para probar el flujo normal), este archivo NO mockea la bandera —
// importa el valor real de producción (Production Closure, 2026-08-16:
// WEB_DONATIONS_PAUSED = true) para confirmar que /api/donate está
// realmente pausado hoy, sin crear ningún pago Khipu.

const createKhipuPaymentV3Mock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("../clients/khipu.js", () => ({
  createKhipuPaymentV3: (...args: unknown[]) => createKhipuPaymentV3Mock(...args),
}));

vi.mock("../middleware/rateLimit.js", () => ({
  consumeRateLimit: (...args: unknown[]) => consumeRateLimitMock(...args),
}));

import { handleDonateRoute } from "../routes/donate.js";
import { WEB_DONATIONS_PAUSED } from "../lib/donationsConfig.js";

function makeReq(overrides: Partial<{ method: string; body: { amount?: unknown } }> = {}) {
  return {
    method: overrides.method ?? "POST",
    body: overrides.body ?? { amount: 1000 },
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

beforeEach(() => {
  createKhipuPaymentV3Mock.mockReset();
  consumeRateLimitMock.mockReset();
  consumeRateLimitMock.mockResolvedValue(true);
});

describe("handleDonateRoute — pausa real de producción (WEB_DONATIONS_PAUSED)", () => {
  it("la bandera de producción está en true hoy (Production Closure, 2026-08-16)", () => {
    expect(WEB_DONATIONS_PAUSED).toBe(true);
  });

  it("responde 503 con mensaje de pausa y NO crea ningún pago Khipu", async () => {
    const req = makeReq({ body: { amount: 1000 } });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body ?? "{}")).toEqual({
      error:
        "Los aportes están temporalmente pausados mientras ComparaFarma se encuentra en su etapa inicial de crecimiento.",
    });
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("no consume rate limit — la pausa corta antes de esa verificación", async () => {
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    expect(consumeRateLimitMock).not.toHaveBeenCalled();
  });

  it("se mantiene pausado sin importar el monto enviado (incluso uno inválido)", async () => {
    const req = makeReq({ body: { amount: 999999 } });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(503);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("OPTIONS (preflight CORS) sigue respondiendo 204 aunque las donaciones estén pausadas", async () => {
    const req = makeReq({ method: "OPTIONS" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(204);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("métodos distintos de POST/OPTIONS siguen respondiendo 405 (la pausa no cambia ese chequeo)", async () => {
    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(405);
  });
});
