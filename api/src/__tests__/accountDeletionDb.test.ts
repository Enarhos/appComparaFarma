import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import {
  isDeletionPending,
  markDeletionPending,
  clearDeletionPending,
  markDeletionFailed,
  deleteAccountData,
} from "../lib/accountDeletionDb.js";

function makeBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    ...overrides,
  };
  return builder;
}

beforeEach(() => {
  state.supabase = null;
});

describe("con Supabase ausente", () => {
  it("todas las funciones devuelven valores seguros sin lanzar", async () => {
    await expect(isDeletionPending("u1")).resolves.toBe(false);
    await expect(markDeletionPending("u1", "a@b.cl")).resolves.toBeUndefined();
    await expect(clearDeletionPending("u1")).resolves.toBeUndefined();
    await expect(markDeletionFailed("u1", "boom", [])).resolves.toBeUndefined();
    await expect(deleteAccountData("u1", "a@b.cl")).resolves.toEqual({ ok: false, error: "supabase_not_configured" });
  });
});

describe("isDeletionPending", () => {
  it("true si existe una fila pending para el user_id", async () => {
    const fromSpy = vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })) }));
    state.supabase = { from: fromSpy };

    await expect(isDeletionPending("u1")).resolves.toBe(true);
    expect(fromSpy).toHaveBeenCalledWith("account_deletion_requests");
  });

  it("false si no existe ninguna fila", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder()) };
    await expect(isDeletionPending("u1")).resolves.toBe(false);
  });

  it("false (nunca lanza) si Supabase devuelve error", async () => {
    state.supabase = {
      from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
    };
    await expect(isDeletionPending("u1")).resolves.toBe(false);
  });
});

describe("markDeletionPending — idempotencia (doble request)", () => {
  it("usa upsert con onConflict user_id, no insert plano", async () => {
    const upsertSpy = vi.fn(() => makeBuilder());
    state.supabase = { from: vi.fn(() => makeBuilder({ upsert: upsertSpy })) };

    await markDeletionPending("u1", "a@b.cl");

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", email: "a@b.cl", status: "pending" }),
      { onConflict: "user_id" }
    );
  });
});

describe("deleteAccountData — no toca activos no personales", () => {
  it("solo llama a supabase.rpc('delete_account_data', ...), nunca a .from() con tablas de inteligencia farmacéutica", async () => {
    const fromSpy = vi.fn((_table: string) => makeBuilder());
    const rpcSpy = vi.fn(() => Promise.resolve({ data: null, error: null }));
    state.supabase = { from: fromSpy, rpc: rpcSpy };

    const result = await deleteAccountData("u1", "a@b.cl");

    expect(result).toEqual({ ok: true });
    expect(rpcSpy).toHaveBeenCalledWith("delete_account_data", { p_user_id: "u1", p_email: "a@b.cl" });
    const forbidden = ["price_history", "pharmacy_clicks", "medications", "medication_match_key_aliases", "subscription_plans", "app_config"];
    for (const call of fromSpy.mock.calls) {
      expect(forbidden).not.toContain(call[0]);
    }
  });

  it("propaga el error de la RPC sin lanzar", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder()), rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: "constraint violation" } })) };
    await expect(deleteAccountData("u1", "a@b.cl")).resolves.toEqual({ ok: false, error: "constraint violation" });
  });
});
