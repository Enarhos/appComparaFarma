import { describe, it, expect, vi, afterEach } from "vitest";

// Este archivo prueba el comportamiento de createDonationPayment cuando las
// donaciones NO están pausadas. El estado real de producción
// (WEB_DONATIONS_PAUSED = true, Production Closure 2026-08-16) se prueba
// por separado, sin mockear este módulo, en createDonationPayment.paused.test.ts.
vi.mock("@/lib/donationsConfig", () => ({
  WEB_DONATIONS_PAUSED: false,
}));

import { createDonationPayment } from "./createDonationPayment";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

describe("createDonationPayment", () => {
  it("llama a POST /api/donate enviando solo { amount }, sin ninguna credencial", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { payment_url: "https://khipu.com/payment/info/abc123" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createDonationPayment(1000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/donate");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ amount: 1000 });
    // Nunca se envían credenciales — ni como header ni dentro del body.
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).not.toContain("KHIPU");
    expect(options.body).not.toContain("API_SECRET_KEY");
  });

  it("devuelve ok:true con paymentUrl si la respuesta es una URL https de khipu.com válida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { payment_url: "https://khipu.com/payment/info/abc123" }))
    );

    const result = await createDonationPayment(1000);
    expect(result).toEqual({ ok: true, paymentUrl: "https://khipu.com/payment/info/abc123" });
  });

  it("acepta subdominios de khipu.com (ej. app.khipu.com)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { payment_url: "https://app.khipu.com/payment/simplified/abc123" }))
    );

    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(true);
  });

  it("rechaza una URL no HTTPS aunque el dominio sea khipu.com", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { payment_url: "http://khipu.com/payment/info/abc123" }))
    );

    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
  });

  it("rechaza una URL de un dominio que no es Khipu (posible phishing/redirección maliciosa)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { payment_url: "https://khipu.com.evil.example/pay" }))
    );

    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
  });

  it("rechaza si payment_url no es un string o no viene en la respuesta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {})));
    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
  });

  it("rechaza si payment_url no es una URL válida en absoluto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { payment_url: "no-es-una-url" })));
    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
  });

  it("devuelve un error genérico ante un HTTP no-ok, sin exponer el cuerpo de la respuesta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({ error: "Khipu API 3.0 respondio 401" }) })
    );

    const result = await createDonationPayment(1000);
    expect(result).toEqual({
      ok: false,
      error: "No pudimos iniciar el pago. Intenta nuevamente en unos momentos.",
    });
  });

  it("devuelve un error genérico ante un error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("No pudimos iniciar el pago. Intenta nuevamente en unos momentos.");
  });

  it("rechaza montos fuera del allowlist (1000/3000/5000) sin llegar a hacer fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDonationPayment(999);
    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("nunca lanza si la respuesta no es JSON válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error("bad json")) })
    );

    const result = await createDonationPayment(1000);
    expect(result.ok).toBe(false);
  });
});
