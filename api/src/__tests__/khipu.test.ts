import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createKhipuPaymentV3,
  getKhipuPayment,
  createKhipuPaymentLegacyV2,
} from "../clients/khipu.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe("createKhipuPaymentV3", () => {
  it("lanza un error explicito si KHIPU_API_KEY no esta configurado, sin llegar a hacer fetch", async () => {
    delete process.env.KHIPU_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" })
    ).rejects.toThrow("Khipu API key not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("llama a POST https://payment-api.khipu.com/v3/payments con el header x-api-key y sin Authorization/HMAC", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { payment_id: "abc123", payment_url: "https://khipu.com/payment/info/abc123" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://payment-api.khipu.com/v3/payments");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      "x-api-key": "test-api-key-value",
    });
    expect(options.headers).not.toHaveProperty("Authorization");
    expect(options.headers?.Authorization).toBeUndefined();
  });

  it("envia amount, currency CLP, subject y transaction_id en el body", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { payment_id: "abc123", payment_url: "https://khipu.com/payment/info/abc123" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createKhipuPaymentV3({ amount: 3000, subject: "Aporte a ComparaFarma", transactionId: "tx-unique-1" });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      amount: 3000,
      currency: "CLP",
      subject: "Aporte a ComparaFarma",
      transaction_id: "tx-unique-1",
    });
  });

  it("incluye return_url/cancel_url solo si se proveen", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { payment_id: "abc123", payment_url: "https://khipu.com/payment/info/abc123" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createKhipuPaymentV3({
      amount: 1000,
      subject: "Aporte",
      transactionId: "tx-1",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.return_url).toBe("https://example.com/return");
    expect(body.cancel_url).toBe("https://example.com/cancel");
  });

  it("nunca envia notify_url/notify_api_version (webhook fuera de alcance de este sprint)", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { payment_id: "abc123", payment_url: "https://khipu.com/payment/info/abc123" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).not.toHaveProperty("notify_url");
    expect(body).not.toHaveProperty("notify_api_version");
  });

  it("devuelve paymentId y paymentUrl en una respuesta exitosa", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { payment_id: "gqzdy6chjne9", payment_url: "https://khipu.com/payment/info/gqzdy6chjne9" })
      )
    );

    const result = await createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" });
    expect(result).toEqual({ paymentId: "gqzdy6chjne9", paymentUrl: "https://khipu.com/payment/info/gqzdy6chjne9" });
  });

  it("en un error 4xx/5xx, el mensaje de la excepcion solo contiene el status HTTP, nunca el cuerpo de la respuesta ni la api key", async () => {
    process.env.KHIPU_API_KEY = "clave-secreta-nunca-debe-aparecer";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "invalid api key clave-secreta-nunca-debe-aparecer" }),
        text: () => Promise.resolve('{"error":"invalid api key clave-secreta-nunca-debe-aparecer"}'),
      })
    );

    await expect(
      createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" })
    ).rejects.toThrow("Khipu API 3.0 respondio 401");

    try {
      await createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("clave-secreta-nunca-debe-aparecer");
    }
  });

  it("maneja un error de red sin exponer detalles internos", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));

    await expect(
      createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" })
    ).rejects.toThrow("No se pudo conectar con Khipu");
  });

  it("maneja una respuesta 200 con JSON invalido", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("bad json")),
        text: () => Promise.resolve("not json"),
      })
    );

    await expect(
      createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" })
    ).rejects.toThrow("Khipu devolvio una respuesta invalida");
  });

  it("lanza si la respuesta 200 no trae payment_id/payment_url", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {})));

    await expect(
      createKhipuPaymentV3({ amount: 1000, subject: "Aporte", transactionId: "tx-1" })
    ).rejects.toThrow("Khipu no retorno payment_id/payment_url");
  });
});

describe("getKhipuPayment", () => {
  it("consulta GET /v3/payments/{id} con x-api-key y sin query params sensibles", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        payment_id: "gqzdy6chjne9",
        status: "done",
        status_detail: "normal",
        amount: "1000.0000",
        currency: "CLP",
        transaction_id: "tx-1",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getKhipuPayment("gqzdy6chjne9");

    expect(fetchMock).toHaveBeenCalledWith("https://payment-api.khipu.com/v3/payments/gqzdy6chjne9", {
      headers: { "x-api-key": "test-api-key-value" },
    });
    expect(result).toEqual({
      paymentId: "gqzdy6chjne9",
      status: "done",
      statusDetail: "normal",
      amount: "1000.0000",
      currency: "CLP",
      transactionId: "tx-1",
    });
  });

  it.each(["pending", "verifying", "done"] as const)("soporta el estado '%s'", async (status) => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          payment_id: "id1",
          status,
          status_detail: "normal",
          amount: "1000.0000",
          currency: "CLP",
          transaction_id: "tx-1",
        })
      )
    );

    const result = await getKhipuPayment("id1");
    expect(result.status).toBe(status);
  });

  it("lanza un error explicito si KHIPU_API_KEY no esta configurado", async () => {
    delete process.env.KHIPU_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getKhipuPayment("id1")).rejects.toThrow("Khipu API key not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propaga un error generico (sin cuerpo de respuesta) en un 404", async () => {
    process.env.KHIPU_API_KEY = "test-api-key-value";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) })
    );

    await expect(getKhipuPayment("id-inexistente")).rejects.toThrow(
      "Khipu API 3.0 respondio 404 al consultar el pago"
    );
  });
});

describe("createKhipuPaymentLegacyV2 (LEGACY_ROLLBACK_ONLY)", () => {
  it("sigue existiendo y usando el mecanismo HMAC/API 2.0 original, pero no es llamada desde donate.ts", async () => {
    process.env.KHIPU_RECEIVER_ID = "520175";
    process.env.KHIPU_SECRET = "legacy-secret";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ payment_url: "https://khipu.com/payment/process/legacy" })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const url = await createKhipuPaymentLegacyV2(1000);

    expect(url).toBe("https://khipu.com/payment/process/legacy");
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe("https://khipu.com/api/2.0/payments");
    expect(options.headers.Authorization).toContain("520175:");
  });
});
