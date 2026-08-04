import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import {
  findPlan,
  findAvailablePlans,
  findActiveSubscription,
  findSubscriptionByProviderReference,
  insertSubscription,
  updateSubscription,
  insertEvent,
  updateProfilePlanCache,
  findFlowCustomer,
  findFlowCustomerByFlowCustomerId,
  upsertFlowCustomer,
} from "../lib/subscriptionsDb.js";

/** Builder encadenable genérico — soporta ser awaited directamente (vía `then`) o seguir encadenando. */
function makeBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
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
    await expect(findAvailablePlans()).resolves.toEqual([]);
    await expect(findActiveSubscription("u1")).resolves.toBeNull();
    await expect(findSubscriptionByProviderReference("google_play", "tok")).resolves.toBeNull();
    await expect(insertSubscription({
      userId: "u1", planId: "premium_monthly", status: "active", provider: "manual",
      providerReference: null, startedAt: null, currentPeriodEnd: null,
    })).resolves.toBeNull();
    await expect(updateSubscription(1, { status: "canceled" })).resolves.toBeUndefined();
    await expect(insertEvent({ subscriptionId: 1, type: "purchase", provider: "manual", rawPayload: {} })).resolves.toBeUndefined();
    await expect(updateProfilePlanCache("u1", true)).resolves.toBeUndefined();
    await expect(findFlowCustomer("u1")).resolves.toBeNull();
    await expect(findFlowCustomerByFlowCustomerId("cus_x")).resolves.toBeNull();
    await expect(upsertFlowCustomer({ userId: "u1", flowCustomerId: "cus_x" })).resolves.toBeNull();
  });
});

describe("findFlowCustomer", () => {
  it("mapea la fila snake_case a camelCase", async () => {
    state.supabase = {
      from: vi.fn(() =>
        makeBuilder({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: {
                user_id: "u1",
                flow_customer_id: "cus_l3cc364e35",
                register_status: "active",
                card_brand: "Visa",
                card_last4: "6623",
              },
              error: null,
            })
          ),
        })
      ),
    };

    const customer = await findFlowCustomer("u1");
    expect(customer).toEqual({
      userId: "u1",
      flowCustomerId: "cus_l3cc364e35",
      registerStatus: "active",
      cardBrand: "Visa",
      cardLast4: "6623",
    });
  });

  it("devuelve null si Supabase responde con error", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    await expect(findFlowCustomer("u1")).resolves.toBeNull();
  });
});

describe("findFlowCustomerByFlowCustomerId", () => {
  it("mapea la fila snake_case a camelCase", async () => {
    state.supabase = {
      from: vi.fn(() =>
        makeBuilder({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: {
                user_id: "u1",
                flow_customer_id: "cus_l3cc364e35",
                register_status: "pending",
                card_brand: null,
                card_last4: null,
              },
              error: null,
            })
          ),
        })
      ),
    };

    const customer = await findFlowCustomerByFlowCustomerId("cus_l3cc364e35");
    expect(customer?.userId).toBe("u1");
  });

  it("devuelve null si Supabase responde con error", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    await expect(findFlowCustomerByFlowCustomerId("cus_x")).resolves.toBeNull();
  });
});

describe("upsertFlowCustomer", () => {
  it("hace upsert por user_id y devuelve la fila mapeada", async () => {
    const upsertMock = vi.fn(() =>
      makeBuilder({
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              user_id: "u1",
              flow_customer_id: "cus_l3cc364e35",
              register_status: "pending",
              card_brand: null,
              card_last4: null,
            },
            error: null,
          })
        ),
      })
    );
    state.supabase = { from: vi.fn(() => ({ upsert: upsertMock })) };

    const customer = await upsertFlowCustomer({ userId: "u1", flowCustomerId: "cus_l3cc364e35" });
    expect(customer?.flowCustomerId).toBe("cus_l3cc364e35");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", flow_customer_id: "cus_l3cc364e35" }),
      expect.objectContaining({ onConflict: "user_id" })
    );
  });

  it("devuelve null si el upsert falla", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ single: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    const customer = await upsertFlowCustomer({ userId: "u1", flowCustomerId: "cus_x" });
    expect(customer).toBeNull();
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

describe("findAvailablePlans", () => {
  it("devuelve solo los planes is_available/active, mapeados", async () => {
    state.supabase = {
      from: vi.fn(() =>
        makeBuilder({
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  id: "premium_monthly",
                  name: "Premium mensual",
                  product_type: "app",
                  billing_period: "monthly",
                  reference_price: 2990,
                  currency: "CLP",
                  benefits: ["premium"],
                  is_available: true,
                  status: "active",
                },
              ],
              error: null,
            })
          ),
        })
      ),
    };

    const plans = await findAvailablePlans();
    expect(plans).toEqual([
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
  });

  it("devuelve [] si Supabase responde con error, sin lanzar", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ order: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    await expect(findAvailablePlans()).resolves.toEqual([]);
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
