import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}));

import { createCheckoutSession } from "./createCheckoutSession";

function makeSupabase(accessToken: string | null = "token-abc") {
  return {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: accessToken ? { access_token: accessToken } : null } })),
    },
  };
}

beforeEach(() => {
  state.supabase = makeSupabase();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createCheckoutSession", () => {
  it("sin sesión devuelve error sin llamar a fetch", async () => {
    state.supabase = makeSupabase(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCheckoutSession("premium_monthly");

    expect(result).toEqual({ ok: false, error: "Debes iniciar sesión para actualizar tu plan." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con sesión, llama a create-checkout-session con el token y devuelve la url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ url: "https://checkout.stripe.com/pay/cs_test_123" }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCheckoutSession("premium_monthly");

    expect(result).toEqual({ ok: true, url: "https://checkout.stripe.com/pay/cs_test_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=create-checkout-session"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-abc" }),
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ planId: "premium_monthly" });
  });

  it("si api/ responde con error, propaga el mensaje", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Ese plan no está disponible para compra." }) }));
    const result = await createCheckoutSession("plan-invalido");
    expect(result).toEqual({ ok: false, error: "Ese plan no está disponible para compra." });
  });

  it("si el fetch lanza (red caída), devuelve el error genérico sin lanzar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await createCheckoutSession("premium_monthly");
    expect(result).toEqual({ ok: false, error: "No pudimos iniciar el pago en este momento." });
  });
});
