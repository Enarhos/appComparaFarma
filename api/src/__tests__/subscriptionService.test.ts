import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  findActiveSubscription: vi.fn(),
  findPlan: vi.fn(),
  findSubscriptionByProviderReference: vi.fn(),
  insertSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  insertEvent: vi.fn(),
  updateProfilePlanCache: vi.fn(),
}));

vi.mock("../lib/subscriptionsDb.js", () => db);

import { getEntitlement, recordProviderEvent, grantManual, revokeManual } from "../services/subscriptionService.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getEntitlement", () => {
  it("sin suscripción activa devuelve active:false", async () => {
    db.findActiveSubscription.mockResolvedValue(null);
    const result = await getEntitlement("u1");
    expect(result).toEqual({ active: false, planId: null, benefits: [], expiresAt: null });
  });

  it("con suscripción active devuelve los beneficios del plan", async () => {
    db.findActiveSubscription.mockResolvedValue({
      id: 1, userId: "u1", planId: "cortesia", status: "active", provider: "manual",
      providerReference: null, startedAt: null, currentPeriodEnd: "2027-01-01T00:00:00Z", canceledAt: null,
    });
    db.findPlan.mockResolvedValue({
      id: "cortesia", name: "Cortesía", productType: "app", billingPeriod: null,
      referencePrice: null, currency: "CLP", benefits: ["premium"], isAvailable: false, status: "active",
    });

    const result = await getEntitlement("u1");
    expect(result).toEqual({ active: true, planId: "cortesia", benefits: ["premium"], expiresAt: "2027-01-01T00:00:00Z" });
  });

  it("con suscripción en grace_period sigue considerándose activa", async () => {
    db.findActiveSubscription.mockResolvedValue({
      id: 1, userId: "u1", planId: "premium_monthly", status: "grace_period", provider: "google_play",
      providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null,
    });
    db.findPlan.mockResolvedValue(null);

    const result = await getEntitlement("u1");
    expect(result.active).toBe(true);
    expect(result.benefits).toEqual([]);
  });

  it("no lanza si findActiveSubscription rechaza", async () => {
    db.findActiveSubscription.mockRejectedValue(new Error("boom"));
    const result = await getEntitlement("u1");
    expect(result.active).toBe(false);
  });
});

describe("recordProviderEvent", () => {
  it("crea una suscripción nueva si no existe una con esa provider_reference", async () => {
    db.findSubscriptionByProviderReference.mockResolvedValue(null);
    db.insertSubscription.mockResolvedValue({ id: 5, userId: "u1", planId: "premium_monthly", status: "active", provider: "google_play", providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null });

    await recordProviderEvent({
      provider: "google_play",
      providerReference: "tok",
      type: "purchase",
      userId: "u1",
      planId: "premium_monthly",
      periodEnd: "2026-09-01T00:00:00Z",
      rawPayload: { raw: true },
    });

    expect(db.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", planId: "premium_monthly", status: "active", provider: "google_play" })
    );
    expect(db.insertEvent).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 5, type: "purchase" }));
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", true);
  });

  it("actualiza la suscripción existente en vez de crear una nueva", async () => {
    db.findSubscriptionByProviderReference.mockResolvedValue({
      id: 5, userId: "u1", planId: "premium_monthly", status: "active", provider: "google_play",
      providerReference: "tok", startedAt: null, currentPeriodEnd: "2026-08-01T00:00:00Z", canceledAt: null,
    });

    await recordProviderEvent({
      provider: "google_play",
      providerReference: "tok",
      type: "renewal",
      userId: "u1",
      planId: "premium_monthly",
      periodEnd: "2026-09-01T00:00:00Z",
      rawPayload: {},
    });

    expect(db.insertSubscription).not.toHaveBeenCalled();
    expect(db.updateSubscription).toHaveBeenCalledWith(5, expect.objectContaining({ status: "active", currentPeriodEnd: "2026-09-01T00:00:00Z" }));
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", true);
  });

  it("una cancelación deja profiles.plan en free", async () => {
    db.findSubscriptionByProviderReference.mockResolvedValue({
      id: 5, userId: "u1", planId: "premium_monthly", status: "active", provider: "google_play",
      providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null,
    });

    await recordProviderEvent({
      provider: "google_play", providerReference: "tok", type: "cancellation",
      userId: "u1", planId: "premium_monthly", periodEnd: null, rawPayload: {},
    });

    expect(db.updateSubscription).toHaveBeenCalledWith(5, expect.objectContaining({ status: "canceled" }));
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", false);
  });

  it("no lanza si insertSubscription devuelve null (Supabase ausente/falló)", async () => {
    db.findSubscriptionByProviderReference.mockResolvedValue(null);
    db.insertSubscription.mockResolvedValue(null);

    await expect(
      recordProviderEvent({
        provider: "google_play", providerReference: "tok", type: "purchase",
        userId: "u1", planId: "premium_monthly", periodEnd: null, rawPayload: {},
      })
    ).resolves.toBeUndefined();
    expect(db.insertEvent).not.toHaveBeenCalled();
  });
});

describe("grantManual", () => {
  it("crea una suscripción manual activa y actualiza el cache a premium", async () => {
    db.insertSubscription.mockResolvedValue({ id: 9, userId: "u1", planId: "cortesia", status: "active", provider: "manual", providerReference: null, startedAt: null, currentPeriodEnd: null, canceledAt: null });

    await grantManual("u1", "cortesia");

    expect(db.insertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", planId: "cortesia", status: "active", provider: "manual" })
    );
    expect(db.insertEvent).toHaveBeenCalledWith(expect.objectContaining({ subscriptionId: 9, type: "purchase", provider: "manual" }));
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", true);
  });
});

describe("revokeManual", () => {
  it("cancela la suscripción manual activa y actualiza el cache a free", async () => {
    db.findActiveSubscription.mockResolvedValue({ id: 9, userId: "u1", planId: "cortesia", status: "active", provider: "manual", providerReference: null, startedAt: null, currentPeriodEnd: null, canceledAt: null });

    await revokeManual("u1");

    expect(db.updateSubscription).toHaveBeenCalledWith(9, expect.objectContaining({ status: "canceled" }));
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", false);
  });

  it("si la suscripción activa no es manual (ej. google_play), no la cancela pero sí baja el cache", async () => {
    db.findActiveSubscription.mockResolvedValue({ id: 9, userId: "u1", planId: "premium_monthly", status: "active", provider: "google_play", providerReference: "tok", startedAt: null, currentPeriodEnd: null, canceledAt: null });

    await revokeManual("u1");

    expect(db.updateSubscription).not.toHaveBeenCalled();
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", false);
  });

  it("sin ninguna suscripción activa, solo baja el cache", async () => {
    db.findActiveSubscription.mockResolvedValue(null);
    await revokeManual("u1");
    expect(db.updateProfilePlanCache).toHaveBeenCalledWith("u1", false);
  });
});
