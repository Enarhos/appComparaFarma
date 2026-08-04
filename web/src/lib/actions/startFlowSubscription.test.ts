import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}));

import { startFlowSubscription } from "./startFlowSubscription";

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

describe("startFlowSubscription", () => {
  it("sin sesión devuelve error sin llamar a fetch", async () => {
    state.supabase = makeSupabase(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await startFlowSubscription("premium_monthly");

    expect(result).toEqual({ ok: false, error: "Debes iniciar sesión para actualizar tu plan." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con sesión, llama a start-flow-subscription con el token y devuelve la redirectUrl", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ redirectUrl: "https://sandbox.flow.cl/app/customer/disclaimer.php?token=abc" }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await startFlowSubscription("premium_monthly");

    expect(result).toEqual({ ok: true, redirectUrl: "https://sandbox.flow.cl/app/customer/disclaimer.php?token=abc" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=start-flow-subscription"),
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
    const result = await startFlowSubscription("plan-invalido");
    expect(result).toEqual({ ok: false, error: "Ese plan no está disponible para compra." });
  });

  it("si el fetch lanza (red caída), devuelve el error genérico sin lanzar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await startFlowSubscription("premium_monthly");
    expect(result).toEqual({ ok: false, error: "No pudimos iniciar el pago en este momento." });
  });
});
