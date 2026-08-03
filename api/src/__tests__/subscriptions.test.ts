import { createHmac } from "node:crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getEntitlement: vi.fn(),
  recordProviderEvent: vi.fn(),
  grantManual: vi.fn(),
  revokeManual: vi.fn(),
  findSubscriptionByProviderReference: vi.fn(),
  findAvailablePlans: vi.fn(),
  findPlan: vi.fn(),
  getUser: vi.fn(),
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
}));
vi.mock("../lib/supabaseClient.js", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
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
  delete process.env.GOOGLE_RTDN_SECRET;
  delete process.env.API_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.WEB_APP_URL;
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
  it("devuelve los planes disponibles sin exponer stripePriceId", async () => {
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
        stripePriceId: "price_abc",
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
    expect(body[0].stripePriceId).toBeUndefined();
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

describe("action=create-checkout-session", () => {
  it("sin sesión devuelve 401", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=create-checkout-session", body: { planId: "premium_monthly" } });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("sin STRIPE_SECRET_KEY configurado devuelve 503", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=create-checkout-session",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(503);
  });

  it("con plan inexistente/no disponible devuelve 400", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.findPlan.mockResolvedValue(null);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=create-checkout-session",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "no-existe" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
  });

  it("con plan vendible crea la sesión y devuelve la url", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.WEB_APP_URL = "https://app-compara-farma-web.vercel.app";
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.findPlan.mockResolvedValue({
      id: "premium_monthly",
      name: "Premium mensual",
      productType: "app",
      billingPeriod: "monthly",
      referencePrice: 2990,
      currency: "CLP",
      benefits: ["premium"],
      isAvailable: true,
      status: "active",
      stripePriceId: "price_abc",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://checkout.stripe.com/pay/cs_test_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=create-checkout-session",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res)).toEqual({ url: "https://checkout.stripe.com/pay/cs_test_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({ method: "POST" })
    );
    const sentBody = fetchMock.mock.calls[0][1].body as string;
    expect(sentBody).toContain("client_reference_id=user-1");
    expect(sentBody).toContain("line_items%5B0%5D%5Bprice%5D=price_abc");
  });

  it("si Stripe responde con error, devuelve 502", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.findPlan.mockResolvedValue({
      id: "premium_monthly", isAvailable: true, stripePriceId: "price_abc",
      name: "x", productType: "app", billingPeriod: "monthly", referencePrice: 1, currency: "CLP", benefits: [], status: "active",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, text: () => Promise.resolve("bad request") }));

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=create-checkout-session",
      headers: { authorization: "Bearer good-token" },
      body: { planId: "premium_monthly" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(502);
  });
});

describe("action=stripe-webhook", () => {
  const SECRET = "whsec_test_123";

  function sign(rawBody: string, timestamp = "1700000000") {
    const signature = createHmac("sha256", SECRET).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
    return `t=${timestamp},v1=${signature}`;
  }

  it("sin STRIPE_WEBHOOK_SECRET configurado devuelve 401 (sin fallback abierto)", async () => {
    const req = makeReq({ method: "POST", url: "/api/subscriptions?action=stripe-webhook", body: "{}" });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(401);
  });

  it("con firma inválida devuelve 400", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=stripe-webhook",
      body: "{}",
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(400);
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("checkout.session.completed con firma válida registra la compra", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const rawBody = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { subscription: "sub_123", client_reference_id: "user-1", metadata: { planId: "premium_monthly" } } },
    });

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=stripe-webhook",
      body: rawBody,
      headers: { "stripe-signature": sign(rawBody) },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "stripe", providerReference: "sub_123", type: "purchase", userId: "user-1", planId: "premium_monthly" })
    );
  });

  it("customer.subscription.deleted sin suscripción asociada se ignora (200, no procesa)", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    mocks.findSubscriptionByProviderReference.mockResolvedValue(null);
    const rawBody = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { id: "sub_huerfano" } } });

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=stripe-webhook",
      body: rawBody,
      headers: { "stripe-signature": sign(rawBody) },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res).skipped).toBe("unlinked-stripe-subscription");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
  });

  it("customer.subscription.deleted con suscripción existente registra la cancelación", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    mocks.findSubscriptionByProviderReference.mockResolvedValue({
      id: 1, userId: "user-1", planId: "premium_monthly", status: "active", provider: "stripe",
      providerReference: "sub_123", startedAt: null, currentPeriodEnd: null, canceledAt: null,
    });
    const rawBody = JSON.stringify({ type: "customer.subscription.deleted", data: { object: { id: "sub_123" } } });

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=stripe-webhook",
      body: rawBody,
      headers: { "stripe-signature": sign(rawBody) },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(mocks.recordProviderEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "stripe", providerReference: "sub_123", type: "cancellation", userId: "user-1", planId: "premium_monthly" })
    );
  });

  it("tipo de evento fuera de alcance de Fase 2 se ignora (200, no procesa)", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const rawBody = JSON.stringify({ type: "invoice.payment_failed", data: { object: {} } });

    const req = makeReq({
      method: "POST",
      url: "/api/subscriptions?action=stripe-webhook",
      body: rawBody,
      headers: { "stripe-signature": sign(rawBody) },
    });
    const res = makeRes();

    await handleSubscriptionsRoute(req, res);

    expect(res.statusCode).toBe(200);
    expect(jsonBody(res).skipped).toBe("event-type-not-handled");
    expect(mocks.recordProviderEvent).not.toHaveBeenCalled();
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
