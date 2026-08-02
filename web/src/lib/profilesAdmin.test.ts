import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ admin: null as unknown }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}));

import { getProfiles, setProfilePlan } from "./profilesAdmin";

function makeBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => Promise.resolve({ error: null })),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    ...overrides,
  };
  return builder;
}

beforeEach(() => {
  state.admin = null;
});

describe("getProfiles", () => {
  it("con Supabase ausente devuelve ok:false", async () => {
    const result = await getProfiles();
    expect(result).toEqual({
      ok: false,
      error: "Faltan SUPABASE_URL / SUPABASE_SECRET_KEY en este proyecto de Vercel.",
    });
  });

  it("devuelve las filas cuando la consulta funciona", async () => {
    const rows = [{ id: "u1", email: "a@b.com", plan: "free", created_at: "2026-08-01T00:00:00Z" }];
    state.admin = {
      from: vi.fn(() => makeBuilder({ limit: vi.fn(() => Promise.resolve({ data: rows, error: null })) })),
    };

    const result = await getProfiles();
    expect(result).toEqual({ ok: true, rows });
  });

  it("devuelve ok:false si la consulta falla", async () => {
    state.admin = {
      from: vi.fn(() => makeBuilder({ limit: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };

    const result = await getProfiles();
    expect(result).toEqual({ ok: false, error: "boom" });
  });
});

describe("setProfilePlan", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("premium llama a action=grant-manual con el userId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await setProfilePlan("u1", "premium");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=grant-manual"),
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ userId: "u1", planId: "cortesia" });
  });

  it("free llama a action=revoke-manual con el userId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await setProfilePlan("u1", "free");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("action=revoke-manual"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("no lanza si el fetch falla (red caída)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(setProfilePlan("u1", "premium")).resolves.toBeUndefined();
  });
});
