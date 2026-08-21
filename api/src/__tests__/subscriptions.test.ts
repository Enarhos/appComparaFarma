import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getEntitlement: vi.fn(),
  recordProviderEvent: vi.fn(),
  grantManual: vi.fn(),
  revokeManual: vi.fn(),
  findSubscriptionByProviderReference: vi.fn(),
  findAvailablePlans: vi.fn(),
  findPlan: vi.fn(),
  findFlowCustomer: vi.fn(),
  findFlowCustomerByFlowCustomerId: vi.fn(),
  upsertFlowCustomer: vi.fn(),
  getUser: vi.fn(),
  isDeletionPending: vi.fn(),
}));

vi.mock("../services/subscriptionService.js", () => ({
  getEntitlement: mocks.getEntitlement,
  recordProviderEvent: mocks.recordProviderEvent,
  grantManual: mocks.grantManual,
  revokeManual: mocks.revokeManual,
}));
vi.mock("../lib/subscriptionsDb.js", () => ({
  findSubscriptionByProviderReference: mocks.findSubscriptionByProviderReference,
  findAvailablePlans: mocks.findAvailablePlans,
  findPlan: mocks.findPlan,
  findFlowCustomer: mocks.findFlowCustomer,
  findFlowCustomerByFlowCustomerId: mocks.findFlowCustomerByFlowCustomerId,
  upsertFlowCustomer: mocks.upsertFlowCustomer,
}));
vi.mock("../lib/supabaseClient.js", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("../lib/accountDeletionDb.js", () => ({
  isDeletionPending: mocks.isDeletionPending,
}));

import { handleSubscriptionsRoute } from "../routes/subscriptions.js";

function makeReq(overrides: Partial<{ method: string; url: string; body: unknown; headers: Record<string, string> }> = {}) {
  return {
    method: overrides.method ?? "GET",
    url: overrides.url ?? "/api/subscriptions",
    body: overrides.body,
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

function jsonBody(res: ReturnType<typeof makeRes>) {
  return JSON.parse(res.body ?? "null");
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isDeletionPending.mockResolvedValue(false);
  delete process.env.GOOGLE_RTDN_SECRET;
  delete process.env.API_SECRET_KEY;
  delete process.env.WEB_APP_URL;
  delete process.env.FLOW_API_KEY;
  delete process.env.FLOW_SECRET_KEY;
  delete process.env.FLOW_API_BASE_URL;
  delete process.env.API_PUBLIC_URL;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("action=me", () => {
  it("sin Authorization header devuelve 401", async () => {
    const req = makeReq({ url: "/api/subscriptions?action=me" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
    expect(mocks.getEntitlement).not.toHaveBeenCalled();
  });

  it("con token inválido (Supabase no lo reconoce) devuelve 401", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const req = makeReq({ url: "/api/subscriptions?action=me", headers: { authorization: "Bearer bad-token" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("con token válido devuelve el entitlement del usuario", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.getEntitlement.mockResolvedValue({ active: true, planId: "cortesia", benefits: ["premium"], expiresAt: null });

    const req = makeReq({ url: "/api/subscriptions?action=me", headers: { authorization: "Bearer good-token" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.getEntitlement).toHaveBeenCalledWith("user-1");
    expect(jsonBody(res)).toEqual({ active: true, planId: "cortesia", benefits: ["premium"], expiresAt: null });
  });

  it("con cuenta en DELETION_PENDING (AUTH-DELETE-01, GATE 3) devuelve 401 aunque el token sea válido", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.isDeletionPending.mockResolvedValue(true);

    const req = makeReq({ url: "/api/subscriptions?action=me", headers: { authorization: "Bearer good-token" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
    expect(mocks.getEntitlement).not.toHaveBeenCalled();
  });
});

describe("action=verify-purchase", () => {
  it("sin sesión devuelve 401", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=verify-purchase", body: {} });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("con sesión pero sin purchaseToken/planId devuelve 400", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=verify-purchase",
      headers: { authorization: "Bearer good-token" },
      body: {},
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("con datos válidos registra el evento de compra", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=verify-purchase",
      headers: { authorization: "Bearer good-token" },
      body: { purchaseToken: "tok-1", planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google_play", providerReference: "tok-1", type: "purchase", userId: "user-1", planId: "premium_monthly" })
    );
  });
});

describe("action=google-rtdn", () => {
  function makeEnvelope(payload: unknown) {
    return { message: { data: Buffer.from(JSON.stringify(payload), "utf-8").toString("base64") } };
  }

  it("sin GOOGLE_RTDN_SECRET configurado devuelve 401 (sin fallback abierto)", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=google-rtdn", body: {} });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("con secret incorrecto devuelve 401", async () => {
    process.env.GOOGLE_RTDN_SECRET = "s3cr3t";
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=google-rtdn&token=wrong", body: {} });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("con purchaseToken no vinculado a ningún usuario, se ignora (200, no procesa)", async () => {
    process.env.GOOGLE_RTDN_SECRET = "s3cr3t";
    mocks.findSubscriptionByProviderReference.mockResolvedValue(null);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=google-rtdn&token=s3cr3t",
      body: makeEnvelope({
        packageName: "mla.app.comparafarma",
        eventTimeMillis: "1",
        subscriptionNotification: { notificationType: 2, purchaseToken: "tok-huerfano", subscriptionId: "premium_monthly" },
      }),
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res).skipped).toBe("unlinked-purchase-token");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("con purchaseToken ya vinculado a un usuario, procesa la renovación", async () => {
    process.env.GOOGLE_RTDN_SECRET = "s3cr3t";
    mocks.findSubscriptionByProviderReference.mockResolvedValue({
      id: 1, userId: "user-1", planId: "premium_monthly", status: "active", provider: "google_play",
      providerReference: "tok-1", startedAt: null, currentPeriodEnd: null, canceledAt: null,
    });

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=google-rtdn&token=s3cr3t",
      body: makeEnvelope({
        packageName: "mla.app.comparafarma",
        eventTimeMillis: "1",
        subscriptionNotification: { notificationType: 2, purchaseToken: "tok-1", subscriptionId: "premium_monthly" },
      }),
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google_play", providerReference: "tok-1", type: "renewal", userId: "user-1" })
    );
  });
});

describe("action=grant-manual / revoke-manual", () => {
  it("grant-manual sin API_SECRET_KEY configurado permite el paso (fallback abierto, consistente con isAuthorized())", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=grant-manual", body: { userId: "user-1" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.grantManual).toHaveBeenCalledWith("user-1", "cortesia", undefined);
  });

  it("grant-manual con API_SECRET_KEY configurado y header incorrecto devuelve 401", async () => {
    process.env.API_SECRET_KEY = "s3cr3t";
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=grant-manual", body: { userId: "user-1" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
    expect(mocks.grantManual).not.toHaveBeenCalled();
  });

  it("grant-manual sin userId devuelve 400", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=grant-manual", body: {} });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("revoke-manual llama a revokeManual con el userId", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=revoke-manual", body: { userId: "user-1" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.revokeManual).toHaveBeenCalledWith("user-1");
  });
});

describe("action=plans", () => {
  it("devuelve los planes disponibles con solo los campos públicos", async () => {
    mocks.findAvailablePlans.mockResolvedValue([
      {
        id: "premium_monthly",
        name: "Premium mensual",
        productType: "app",
        billingPeriod: "monthly",
        referencePrice: 2990,
        currency: "CLP",
        benefits: ["premium"],
        isAvailable: true,
        status: "active",
      },
    ]);

    const req = makeReq({ url: "/api/subscriptions?action=plans" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    const body = jsonBody(res);
    expect(body).toEqual([
      { id: "premium_monthly", name: "Premium mensual", referencePrice: 2990, currency: "CLP", billingPeriod: "monthly", benefits: ["premium"] },
    ]);
  });

  it("con catálogo vacío devuelve []", async () => {
    mocks.findAvailablePlans.mockResolvedValue([]);
    const req = makeReq({ url: "/api/subscriptions?action=plans" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res)).toEqual([]);
  });
});

function stubFlowEnv() {
  process.env.FLOW_API_KEY = "apiKey123";
  process.env.FLOW_SECRET_KEY = "secret123";
  process.env.FLOW_API_BASE_URL = "https://sandbox.flow.cl/api";
}

describe("action=start-flow-subscription", () => {
  it("sin sesión devuelve 401", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=start-flow-subscription", body: { planId: "premium_monthly" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("sin FLOW_API_KEY/FLOW_SECRET_KEY/FLOW_API_BASE_URL configurados devuelve 503", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "u@x.cl" } }, error: null });
    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=start-flow-subscription",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(503);
  });

  it("con plan inexistente/no disponible devuelve 400", async () => {
    stubFlowEnv();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "u@x.cl" } }, error: null });
    mocks.findPlan.mockResolvedValue(null);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=start-flow-subscription",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "no-existe" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("usuario sin flow_customers: crea cliente, registra, y devuelve la url de enrolamiento", async () => {
    stubFlowEnv();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "mario@x.cl" } }, error: null });
    mocks.findPlan.mockResolvedValue({ id: "premium_monthly", isAvailable: true, name: "x", productType: "app", billingPeriod: "monthly", referencePrice: 1, currency: "CLP", benefits: [], status: "active" });
    mocks.findFlowCustomer.mockResolvedValue(null);
    mocks.upsertFlowCustomer.mockResolvedValue({ userId: "user-1", flowCustomerId: "cus_abc", registerStatus: "pending", cardBrand: null, cardLast4: null });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ customerId: "cus_abc" }) }) // customer/create
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ url: "https://sandbox.flow.cl/app/customer/disclaimer.php", token: "tok-register" }) }); // customer/register
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=start-flow-subscription",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res)).toEqual({ redirectUrl: "https://sandbox.flow.cl/app/customer/disclaimer.php?token=tok-register" });
    expect(mocks.upsertFlowCustomer).toHaveBeenCalledWith({ userId: "user-1", flowCustomerId: "cus_abc", registerStatus: "pending" });
    const registerCallUrl = fetchMock.mock.calls[1][0] as string;
    expect(registerCallUrl).toContain("/customer/register");
  });

  it("usuario con tarjeta ya activa: crea la suscripción directo, sin pasar por Flow de nuevo", async () => {
    stubFlowEnv();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "mario@x.cl" } }, error: null });
    mocks.findPlan.mockResolvedValue({ id: "premium_monthly", isAvailable: true, name: "x", productType: "app", billingPeriod: "monthly", referencePrice: 1, currency: "CLP", benefits: [], status: "active" });
    mocks.findFlowCustomer.mockResolvedValue({ userId: "user-1", flowCustomerId: "cus_abc", registerStatus: "active", cardBrand: "Visa", cardLast4: "6623" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ subscriptionId: "sus_xyz", period_end: "2026-09-02 00:00:00" }) })
    );

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=start-flow-subscription",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res)).toEqual({ redirectUrl: "https://www.preciosfarma.cl/cuenta?upgrade=success" });
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "flow", providerReference: "sus_xyz", type: "purchase", userId: "user-1", planId: "premium_monthly" })
    );
  });
});

describe("action=flow-register-return", () => {
  it("sin token en el body redirige a /cuenta?upgrade=error", async () => {
    stubFlowEnv();
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-register-return", body: "" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(302);
    expect(res.headers.Location).toBe("https://www.preciosfarma.cl/cuenta?upgrade=error");
  });

  it("con getRegisterStatus no-activo redirige a error", async () => {
    stubFlowEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ status: "0", customerId: "cus_abc" }) }));

    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-register-return", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.headers.Location).toBe("https://www.preciosfarma.cl/cuenta?upgrade=error");
  });

  it("con tarjeta activa y planId válido: activa flow_customers y crea la suscripción, redirige a success", async () => {
    stubFlowEnv();
    mocks.findFlowCustomerByFlowCustomerId.mockResolvedValue({ userId: "user-1", flowCustomerId: "cus_abc", registerStatus: "pending", cardBrand: null, cardLast4: null });
    mocks.findPlan.mockResolvedValue({ id: "premium_monthly", isAvailable: true, name: "x", productType: "app", billingPeriod: "monthly", referencePrice: 1, currency: "CLP", benefits: [], status: "active" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ status: "1", customerId: "cus_abc", creditCardType: "Visa", last4CardDigits: "6623" }) }) // getRegisterStatus
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ subscriptionId: "sus_xyz", period_end: "2026-09-02 00:00:00" }) }); // subscription/create
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=flow-register-return&planId=premium_monthly",
      body: "token=tok-1",
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(mocks.upsertFlowCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", flowCustomerId: "cus_abc", registerStatus: "active", cardBrand: "Visa", cardLast4: "6623" })
    );
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "flow", providerReference: "sus_xyz", type: "purchase", userId: "user-1" })
    );
    expect(res.headers.Location).toBe("https://www.preciosfarma.cl/cuenta?upgrade=success");
  });
});

describe("action=flow-webhook", () => {
  it("siempre responde 200, incluso sin FLOW_* configurado", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-webhook", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res).skipped).toBe("flow-not-configured");
  });

  it("token que no resuelve a una suscripción (commerceOrder no matchea) se ignora, 200", async () => {
    stubFlowEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ commerceOrder: "sf12377", status: 2 }) }));

    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-webhook", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res).skipped).toBe("not-a-subscription-invoice");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("invoice no pagado (status distinto de 2) se ignora explícitamente, 200", async () => {
    stubFlowEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ commerceOrder: "sus_abc_555_2026-08-02 00:00", status: 3 }) })
    );

    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-webhook", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(jsonBody(res).skipped).toBe("invoice-unpaid-no-action");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("suscripción no encontrada (huérfana) se ignora, 200", async () => {
    stubFlowEnv();
    mocks.findSubscriptionByProviderReference.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: () => Promise.resolve({ commerceOrder: "sus_huerfana_555_2026-08-02 00:00", status: 2 }) })
    );

    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-webhook", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(jsonBody(res).skipped).toBe("unlinked-flow-subscription");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("invoice pagado de una suscripción existente registra la renovación", async () => {
    stubFlowEnv();
    mocks.findSubscriptionByProviderReference.mockResolvedValue({
      id: 1, userId: "user-1", planId: "premium_monthly", status: "active", provider: "flow",
      providerReference: "sus_xyz", startedAt: null, currentPeriodEnd: null, canceledAt: null,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ commerceOrder: "sus_xyz_1183510_2026-08-02 22:02", status: 2, amount: "1000" }) }) // payment/getStatus
      .mockResolvedValueOnce({ status: 200, json: () => Promise.resolve({ period_end: "2026-09-02 00:00:00" }) }); // invoice/get
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=flow-webhook", body: "token=tok-1" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "flow",
        providerReference: "sus_xyz",
        type: "renewal",
        userId: "user-1",
        planId: "premium_monthly",
        periodEnd: "2026-09-02 00:00:00",
      })
    );
  });
});

describe("acción inválida", () => {
  it("devuelve 400", async () => {
    const req = makeReq({ url: "/api/subscriptions?action=lo-que-sea" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
  });
});
