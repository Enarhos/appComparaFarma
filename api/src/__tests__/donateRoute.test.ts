import { describe, it, expect, vi, beforeEach } from "vitest";

const createKhipuPaymentV3Mock = vi.hoisted(() => vi.fn());

vi.mock("../clients/khipu.js", () => ({
  createKhipuPaymentV3: (...args: unknown[]) => createKhipuPaymentV3Mock(...args),
}));

import { handleDonateRoute } from "../routes/donate.js";

function makeReq(overrides: Partial<{ method: string; body: { amount?: unknown } }> = {}) {
  return {
    method: overrides.method ?? "POST",
    body: overrides.body ?? { amount: 1000 },
    headers: {},
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
});

describe("handleDonateRoute — método y CORS", () => {
  it("responde 204 a OPTIONS sin llamar a Khipu", async () => {
    const req = makeReq({ method: "OPTIONS" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(204);
    expect(createKhipuPaymentV3Mock).not.toHaveBeenCalled();
  });

  it("responde 405 a métodos distintos de POST/OPTIONS", async () => {
    const req = makeReq({ method: "GET" });
    const res = makeRes();

    await handleDonateRoute(req, res);

    expect(res.statusCode).toBe(405);
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

  it("no envía return_url/cancel_url en este sprint (sin página Web todavía)", async () => {
    const req = makeReq();
    await handleDonateRoute(req, makeRes());

    const call = createKhipuPaymentV3Mock.mock.calls[0][0];
    expect(call.returnUrl).toBeUndefined();
    expect(call.cancelUrl).toBeUndefined();
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
