import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import {
  createAlert,
  confirmAlert,
  unsubscribeAlert,
  getActiveAlerts,
  markTriggered,
  touchLastChecked,
} from "../lib/emailAlertsDb.js";

function makeBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    ...overrides,
  };
  return builder;
}

beforeEach(() => {
  state.supabase = null;
});

describe("createAlert", () => {
  it("con Supabase ausente devuelve null", async () => {
    const result = await createAlert({ email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 100 });
    expect(result).toBeNull();
  });

  it("inserta la fila y devuelve un token generado", async () => {
    const insertMock = vi.fn(() => Promise.resolve({ error: null }));
    state.supabase = { from: vi.fn(() => ({ insert: insertMock })) };

    const result = await createAlert({ email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 100 });

    expect(result?.token).toBeTruthy();
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", match_key: "x", status: "pending" })
    );
  });

  it("devuelve null si el insert falla", async () => {
    state.supabase = { from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve({ error: { message: "boom" } })) })) };
    const result = await createAlert({ email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 100 });
    expect(result).toBeNull();
  });
});

describe("confirmAlert", () => {
  it("con Supabase ausente devuelve 'unavailable'", async () => {
    expect(await confirmAlert("t")).toBe("unavailable");
  });

  it("devuelve 'confirmed' cuando update encuentra la fila pending", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })) })) };
    expect(await confirmAlert("t")).toBe("confirmed");
  });

  it("devuelve 'not_found' cuando no hay fila pending con ese token", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) };
    expect(await confirmAlert("t")).toBe("not_found");
  });
});

describe("unsubscribeAlert", () => {
  it("devuelve 'unsubscribed' cuando encuentra la fila", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })) })) };
    expect(await unsubscribeAlert("t")).toBe("unsubscribed");
  });

  it("devuelve 'not_found' cuando no hay fila", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) })) };
    expect(await unsubscribeAlert("t")).toBe("not_found");
  });
});

describe("getActiveAlerts", () => {
  it("con Supabase ausente devuelve []", async () => {
    expect(await getActiveAlerts()).toEqual([]);
  });

  it("mapea las filas de snake_case a camelCase", async () => {
    const row = {
      id: 1,
      email: "a@b.com",
      match_key: "paracetamol|500mg",
      canonical_name: "Paracetamol 500 mg",
      target_price: 900,
      status: "active",
      token: "tok-1",
    };
    state.supabase = { from: vi.fn(() => makeBuilder({ eq: vi.fn(() => Promise.resolve({ data: [row], error: null })) })) };

    const alerts = await getActiveAlerts();
    expect(alerts).toEqual([
      { id: 1, email: "a@b.com", matchKey: "paracetamol|500mg", canonicalName: "Paracetamol 500 mg", targetPrice: 900, status: "active", token: "tok-1" },
    ]);
  });

  it("devuelve [] si Supabase responde con error", async () => {
    state.supabase = { from: vi.fn(() => makeBuilder({ eq: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })) };
    expect(await getActiveAlerts()).toEqual([]);
  });
});

describe("markTriggered / touchLastChecked", () => {
  it("no lanzan con Supabase ausente", async () => {
    await expect(markTriggered(1, 100)).resolves.toBeUndefined();
    await expect(touchLastChecked([1, 2])).resolves.toBeUndefined();
  });

  it("touchLastChecked no llama a Supabase si la lista está vacía", async () => {
    const fromMock = vi.fn(() => makeBuilder());
    state.supabase = { from: fromMock };
    await touchLastChecked([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
