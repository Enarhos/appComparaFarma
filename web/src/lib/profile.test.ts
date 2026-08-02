import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}));

import { getCurrentProfile } from "./profile";

function makeSupabase(overrides: {
  user?: { id: string } | null;
  profileRow?: { email: string } | null;
  accessToken?: string | null;
} = {}) {
  const user = overrides.user === undefined ? { id: "u1" } : overrides.user;
  const profileRow = overrides.profileRow === undefined ? { email: "a@b.com" } : overrides.profileRow;
  const accessToken = overrides.accessToken === undefined ? "token-abc" : overrides.accessToken;

  return {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: accessToken ? { access_token: accessToken } : null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: profileRow, error: null })),
        })),
      })),
    })),
  };
}

beforeEach(() => {
  state.supabase = makeSupabase();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getCurrentProfile", () => {
  it("sin sesión devuelve null", async () => {
    state.supabase = makeSupabase({ user: null });
    const result = await getCurrentProfile();
    expect(result).toBeNull();
  });

  it("sin fila de perfil (trigger no corrió) devuelve null", async () => {
    state.supabase = makeSupabase({ profileRow: null });
    const result = await getCurrentProfile();
    expect(result).toBeNull();
  });

  it("con entitlement activo devuelve plan:premium", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ active: true }) }));

    const result = await getCurrentProfile();
    expect(result).toEqual({ email: "a@b.com", plan: "premium" });
  });

  it("con entitlement inactivo devuelve plan:free", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ active: false }) }));

    const result = await getCurrentProfile();
    expect(result).toEqual({ email: "a@b.com", plan: "free" });
  });

  it("si api/ responde con error, degrada a plan:free (nunca rompe la página)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await getCurrentProfile();
    expect(result).toEqual({ email: "a@b.com", plan: "free" });
  });

  it("si el fetch lanza (red caída), degrada a plan:free", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await getCurrentProfile();
    expect(result).toEqual({ email: "a@b.com", plan: "free" });
  });

  it("sin sesión activa (access_token ausente), degrada a plan:free sin llamar a fetch", async () => {
    state.supabase = makeSupabase({ accessToken: null });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCurrentProfile();
    expect(result).toEqual({ email: "a@b.com", plan: "free" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
