import { describe, it, expect, vi, beforeEach } from "vitest";

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
  it("con Supabase ausente no lanza", async () => {
    await expect(setProfilePlan("u1", "premium")).resolves.toBeUndefined();
  });

  it("llama a update con el plan nuevo", async () => {
    const updateMock = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
    state.admin = { from: vi.fn(() => ({ update: updateMock })) };

    await setProfilePlan("u1", "premium");

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ plan: "premium" }));
  });
});
