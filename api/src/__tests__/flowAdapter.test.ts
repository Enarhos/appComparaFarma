import { createHmac } from "node:crypto";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  signFlowParams,
  callFlow,
  parseSubscriptionCommerceOrder,
  resolveFlowWebhookToken,
  getInvoicePeriodEnd,
  getFlowConfig,
  type FlowConfig,
} from "../lib/adapters/flowAdapter.js";

const CONFIG: FlowConfig = { apiKey: "apiKey123", secretKey: "my secret", baseUrl: "https://sandbox.flow.cl/api" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("signFlowParams", () => {
  it("ordena las claves alfabéticamente antes de firmar — mismo ejemplo documentado por Flow", () => {
    // developers.flow.cl/en/docs/intro: "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP"
    const params = { apiKey: "XXXX-XXXX-XXXX", currency: "CLP", amount: 5000 };
    const expected = createHmac("sha256", "my secret").update("amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP").digest("hex");
    expect(signFlowParams(params, "my secret")).toBe(expected);
  });

  it("es insensible al orden de inserción de las claves", () => {
    const a = signFlowParams({ b: 2, a: 1 }, "s");
    const b = signFlowParams({ a: 1, b: 2 }, "s");
    expect(a).toBe(b);
  });

  it("cambia si cambia el secretKey", () => {
    const params = { apiKey: "x", token: "y" };
    expect(signFlowParams(params, "secret1")).not.toBe(signFlowParams(params, "secret2"));
  });
});

describe("getFlowConfig", () => {
  it("devuelve null si falta cualquier variable de entorno", () => {
    vi.stubEnv("FLOW_API_KEY", "");
    vi.stubEnv("FLOW_SECRET_KEY", "s");
    vi.stubEnv("FLOW_API_BASE_URL", "https://sandbox.flow.cl/api");
    expect(getFlowConfig()).toBeNull();
  });

  it("devuelve la config completa si están las 3 variables", () => {
    vi.stubEnv("FLOW_API_KEY", "k");
    vi.stubEnv("FLOW_SECRET_KEY", "s");
    vi.stubEnv("FLOW_API_BASE_URL", "https://sandbox.flow.cl/api");
    expect(getFlowConfig()).toEqual({ apiKey: "k", secretKey: "s", baseUrl: "https://sandbox.flow.cl/api" });
  });
});

describe("callFlow", () => {
  it("GET agrega apiKey + firma como query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await callFlow(CONFIG, "GET", "/customer/getRegisterStatus", { token: "abc" });

    expect(result).toEqual({ status: 200, body: { ok: true } });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("https://sandbox.flow.cl/api/customer/getRegisterStatus?");
    expect(url).toContain("apiKey=apiKey123");
    expect(url).toContain("token=abc");
    expect(url).toContain("s=");
    expect(options).toEqual({ method: "GET" });
  });

  it("POST manda application/x-www-form-urlencoded en el body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ planId: "premium" }) });
    vi.stubGlobal("fetch", fetchMock);

    await callFlow(CONFIG, "POST", "/plans/create", { planId: "premium", amount: 1000 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox.flow.cl/api/plans/create");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(options.body).toContain("planId=premium");
    expect(options.body).toContain("amount=1000");
    expect(options.body).toContain("s=");
  });

  it("nunca lanza si fetch falla — devuelve status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await callFlow(CONFIG, "GET", "/payment/getStatus", { token: "x" });
    expect(result).toEqual({ status: 0, body: null });
  });

  it("nunca lanza si la respuesta no es JSON válido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, json: () => Promise.reject(new Error("bad json")) }));
    const result = await callFlow(CONFIG, "GET", "/payment/getStatus", { token: "x" });
    expect(result).toEqual({ status: 200, body: null });
  });
});

describe("parseSubscriptionCommerceOrder", () => {
  it("extrae flowSubscriptionId + invoiceId del formato real verificado en sandbox", () => {
    expect(parseSubscriptionCommerceOrder("sus_ra2479246f_1183510_2026-08-02 22:02")).toEqual({
      flowSubscriptionId: "sus_ra2479246f",
      invoiceId: "1183510",
    });
  });

  it("devuelve null si no matchea el formato (ej. commerceOrder de un pago simple, no de suscripción)", () => {
    expect(parseSubscriptionCommerceOrder("sf12377")).toBeNull();
  });

  it("devuelve null si no es string", () => {
    expect(parseSubscriptionCommerceOrder(undefined)).toBeNull();
    expect(parseSubscriptionCommerceOrder(12345)).toBeNull();
  });
});

describe("resolveFlowWebhookToken", () => {
  it("clasifica invoice_paid cuando status:2 y el commerceOrder matchea", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: () =>
          Promise.resolve({
            commerceOrder: "sus_ra2479246f_1183510_2026-08-02 22:02",
            status: 2,
            amount: "1000",
          }),
      })
    );

    const resolved = await resolveFlowWebhookToken(CONFIG, "some-token");
    expect(resolved).toEqual({
      kind: "invoice_paid",
      flowSubscriptionId: "sus_ra2479246f",
      invoiceId: "1183510",
      amount: 1000,
      rawPayload: { commerceOrder: "sus_ra2479246f_1183510_2026-08-02 22:02", status: 2, amount: "1000" },
    });
  });

  it("clasifica invoice_unpaid cuando status no es 2", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ commerceOrder: "sus_abc123_555_2026-08-02 00:00", status: 3 }),
      })
    );

    const resolved = await resolveFlowWebhookToken(CONFIG, "token");
    expect(resolved).toEqual({
      kind: "invoice_unpaid",
      flowSubscriptionId: "sus_abc123",
      invoiceId: "555",
      rawPayload: { commerceOrder: "sus_abc123_555_2026-08-02 00:00", status: 3 },
    });
  });

  it("ignora si el token no resuelve (status HTTP distinto de 200)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 404, json: () => Promise.resolve({}) }));
    expect(await resolveFlowWebhookToken(CONFIG, "token-invalido")).toEqual({ kind: "ignored" });
  });

  it("ignora si el commerceOrder no corresponde a una suscripción", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ commerceOrder: "sf12377", status: 2 }) })
    );
    expect(await resolveFlowWebhookToken(CONFIG, "token")).toEqual({ kind: "ignored" });
  });
});

describe("getInvoicePeriodEnd", () => {
  it("devuelve period_end si el invoice resuelve", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ period_end: "2026-09-02 00:00:00" }) })
    );
    expect(await getInvoicePeriodEnd(CONFIG, "1183510")).toBe("2026-09-02 00:00:00");
  });

  it("devuelve null si falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 404, json: () => Promise.resolve({}) }));
    expect(await getInvoicePeriodEnd(CONFIG, "999")).toBeNull();
  });
});
