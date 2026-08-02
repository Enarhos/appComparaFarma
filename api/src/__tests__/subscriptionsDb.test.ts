import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import {
  findPlan,
  findActiveSubscription,
  findSubscriptionByProviderReference,
  insertSubscription,
  updateSubscription,
  insertEvent,
  updateProfilePlanCache,
} from "../lib/subscriptionsDb.js";

/** Builder encadenable genérico — soporta ser awaited directamente (vía `then`) o seguir encadenando. */
function makeBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    ...overrides,
  };
  return builder;
}

beforeEach(() => {
  state.supabase = null;
});

describe("con Supabase ausente", () => {
  it("todas las funciones de lectura devuelven null/no-op sin lanzar", async () => {
    await expect(findPlan("premium_monthly")).resolves.toBeNull();
    await expect(findActiveSubscription("u1")).resolves.toBeNull();
    await expect(findSubscriptionByProviderReference("google_play", "tok")).resolves.toBeNull();
    await expect(insertSubscription({
      userId: "u1", planId: "premium_monthly", status: "active", provider: "manual",
      providerReference: null, startedAt: null, currentPeriodEnd: null,
    })).resolves.toBeNull();
    await expect(updateSubscription(1, { status: "canceled" })).resolves.toBeUndefined();
    await expect(insertEvent({ subscriptionId: 1, type: "purchase", provider: "manual", rawPayload: {} })).resolves.toBeUndefined();
    await expect(updateProfilePlanCache("u1", true)).resolves.toBeUndefined();
  });
});

describe("findPlan", () => {
  it("mapea la fila snake_case a camelCase", async () => {
    state.supabase = {
      from: vi.fn(() =>
        makeBuilder({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: {
                id: "cortesia",
                name: "Cortesía",
                product_type: "app",
                billing_period: null,
                reference_price: null,
                currency: "CLP",
                benefits: ["premium"],
                is_available: false,
                status: "active",
              },
              error: null,
            })
          ),
        })
      ),
    };

    const plan = await findPlan("cortesia");
    expect(plan).toEqual({
      id: "cortesia",
      name: "Cortesía",
      productType: "app",
      billingPeriod: null,
      referencePrice: null,
      currency: "CLP",
      benefits: ["premium"],
      isAvailable: false,
      status: "active",
    });
  });

  it("devuelve null si Supabase responde con error", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    await expect(findPlan("cortesia")).resolves.toBeNull();
  });
});

describe("insertSubscription", () => {
  it("inserta y devuelve la fila mapeada", async () => {
    state.supabase = {
      from: vi.fn(() =>
        makeBuilder({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 1,
                user_id: "u1",
                plan_id: "cortesia",
                status: "active",
                provider: "manual",
                provider_reference: null,
                started_at: "2026-08-02T00:00:00Z",
                current_period_end: null,
                canceled_at: null,
              },
              error: null,
            })
          ),
        })
      ),
    };

    const sub = await insertSubscription({
      userId: "u1",
      planId: "cortesia",
      status: "active",
      provider: "manual",
      providerReference: null,
      startedAt: "2026-08-02T00:00:00Z",
      currentPeriodEnd: null,
    });

    expect(sub?.id).toBe(1);
    expect(sub?.provider).toBe("manual");
  });

  it("devuelve null si el insert falla", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ single: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    const sub = await insertSubscription({
      userId: "u1", planId: "cortesia", status: "active", provider: "manual",
      providerReference: null, startedAt: null, currentPeriodEnd: null,
    });
    expect(sub).toBeNull();
  });
});

describe("updateProfilePlanCache", () => {
  it("actualiza profiles.plan a premium/free según el flag", async () => {
    const updateMock = vi.fn(() => makeBuilder());
    state.supabase = { from: vi.fn(() => ({ update: updateMock })) };

    await updateProfilePlanCache("u1", true);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ plan: "premium" }));

    await updateProfilePlanCache("u1", false);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ plan: "free" }));
  });
});
