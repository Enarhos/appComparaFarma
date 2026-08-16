import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createKhipuPaymentV3Mock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("../clients/khipu.js", () => ({
  createKhipuPaymentV3: (...args: unknown[]) => createKhipuPaymentV3Mock(...args),
}));

vi.mock("../middleware/rateLimit.js", () => ({
  consumeRateLimit: (...args: unknown[]) => consumeRateLimitMock(...args),
}));

// Este archivo prueba el comportamiento de handleDonateRoute cuando las
// donaciones NO están pausadas (validación de monto, rate limit, creación
// del pago Khipu, manejo de errores). El estado real de producción
// (WEB_DONATIONS_PAUSED = true, Production Closure 2026-08-16) se prueba
// por separado, sin mockear este módulo, en donateRoutePaused.test.ts.
vi.mock("../lib/donationsConfig.js", () => ({
  WEB_DONATIONS_PAUSED: false,
}));

import { handleDonateRoute } from "../routes/donate.js";

const ORIGINAL_ENV = { ...process.env };

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
  createKhipuPaymentV3Mock.mockResolvedValue({
    paymentId: "abc123",
    paymentUrl: "https://khipu.com/payment/info/abc123",
  });
  consumeRateLimitMock.mockReset();
  consumeRateLimitMock.mockResolvedValue(true);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("handleDonateRoute — método y CORS", () => {
  it("responde 204 a OPTIONS sin llamar a Khipu ni consumir rate limit", async () => {
    const req = makeReq({ method: "OPTIONS" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(204);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
  });

  it("responde 405 a métodos distintos de POST/OPTIONS", async () => {
    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(405);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });
});

describe("handleDonateRoute — rate limiting", () => {
  it("consume el rate limit por IP antes de crear el pago", async () => {
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    expect(consumeRateLimitMock).toHaveBeenCalledWith("127.0.0.1");
  });

  it("responde 429 y no llama a Khipu si se excede el límite", async () => {
    consumeRateLimitMock.mockResolvedValue(false);
    const req = makeReq();
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(429);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });
});

describe("handleDonateRoute — validación de monto", () => {
  it.each([1000, 3000, 5000])("acepta el monto permitido %d", async (amount) => {
    const req = makeReq({ body: { amount } });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(createKhipuPaymentV3Mock).toHaveBeenCalledTimes(1);
    expect(createKhipuPaymentV3Mock.mock.calls[0][0]).toMatchObject({ amount });
  });

  it("rechaza un monto no permitido (999) con 400", async () => {
    const req = makeReq({ body: { amount: 999 } });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ error: "Monto no permitido." });
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("rechaza un monto no entero con 400", async () => {
    const req = makeReq({ body: { amount: 1000.5 } });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("rechaza un monto negativo o ausente con 400", async () => {
    const req = makeReq({ body: { amount: -1000 } });
    const res = makeRes();
    await handleDonateRoute(req, res);
    expect(res.statusCode).toBe(400);

    const req2 = makeReq({ body: {} });
    const res2 = makeRes();
    await handleDonateRoute(req2, res2);
    expect(res2.statusCode).toBe(400);
  });
});

describe("handleDonateRoute — creación del pago", () => {
  it("usa currency CLP y un subject fijo, y genera un transaction_id único sin PII por request", async () => {
    const req1 = makeReq({ body: { amount: 1000 } });
    await handleDonateRoute(req1, makeRes());
    const req2 = makeReq({ body: { amount: 1000 } });
    await handleDonateRoute(req2, makeRes());

    expect(createKhipuPaymentV3Mock).toHaveBeenCalledTimes(2);
    const call1 = createKhipuPaymentV3Mock.mock.calls[0][0];
    const call2 = createKhipuPaymentV3Mock.mock.calls[1][0];

    expect(call1.subject).toBe("Aporte a ComparaFarma");
    expect(typeof call1.transactionId).toBe("string");
    // UUID v4 estándar: no contiene email, nombre ni ningún dato personal.
    expect(call1.transactionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(call1.transactionId).not.toBe(call2.transactionId);
  });

  it("envía return_url/cancel_url apuntando a las páginas de retorno/cancelado en Web (default WEB_APP_URL)", async () => {
    delete process.env.WEB_APP_URL;
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    const call = createKhipuPaymentV3Mock.mock.calls[0][0];
    expect(call.returnUrl).toBe("https://app-compara-farma-web.vercel.app/apoyar/retorno");
    expect(call.cancelUrl).toBe("https://app-compara-farma-web.vercel.app/apoyar/cancelado");
  });

  it("usa WEB_APP_URL si está configurado, sin doble slash", async () => {
    process.env.WEB_APP_URL = "https://web-de-prueba.vercel.app/";
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    const call = createKhipuPaymentV3Mock.mock.calls[0][0];
    expect(call.returnUrl).toBe("https://web-de-prueba.vercel.app/apoyar/retorno");
    expect(call.cancelUrl).toBe("https://web-de-prueba.vercel.app/apoyar/cancelado");
  });

  it("nunca envía notify_url/notify_api_version (webhook fuera de alcance)", async () => {
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    const call = createKhipuPaymentV3Mock.mock.calls[0][0];
    expect(call).not.toHaveProperty("notifyUrl");
    expect(call).not.toHaveProperty("notify_url");
  });

  it("responde 200 con { payment_url } exactamente, sin otros campos", async () => {
    const req = makeReq();
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ payment_url: "https://khipu.com/payment/info/abc123" });
  });
});

describe("handleDonateRoute — manejo de errores sin fuga de secretos", () => {
  it("responde 500 genérico si Khipu rechaza la API key, sin importar qué diga el error interno", async () => {
    createKhipuPaymentV3Mock.mockRejectedValue(
      new Error("Khipu API 3.0 respondio 401 con clave-secreta-de-prueba-xyz")
    );
    const req = makeReq();
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body ?? "{}");
    expect(body).toEqual({ error: "No se pudo crear el pago." });
    expect(res.body ?? "").not.toContain("clave-secreta-de-prueba-xyz");
  });

  it("responde 500 genérico ante un error de red, sin exponer el detalle", async () => {
    createKhipuPaymentV3Mock.mockRejectedValue(new Error("No se pudo conectar con Khipu"));
    const req = makeReq();
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ error: "No se pudo crear el pago." });
  });

  it("responde 500 genérico si KHIPU_API_KEY no está configurado (createKhipuPaymentV3 lanza)", async () => {
    createKhipuPaymentV3Mock.mockRejectedValue(new Error("Khipu API key not configured"));
    const req = makeReq();
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body ?? "{}")).toEqual({ error: "No se pudo crear el pago." });
  });
});
