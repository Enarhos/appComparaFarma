import { describe, it, expect, vi, afterEach } from "vitest";
import { getAvailablePlans } from "./plans";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getAvailablePlans", () => {
  it("devuelve los planes cuando api/ responde bien", async () => {
    const plans = [
      { id: "premium_monthly", name: "Premium mensual", referencePrice: 2990, currency: "CLP", billingPeriod: "monthly", benefits: ["premium"] },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(plans) }));

    await expect(getAvailablePlans()).resolves.toEqual(plans);
  });

  it("devuelve [] si api/ responde con error (catálogo vacío o falla)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getAvailablePlans()).resolves.toEqual([]);
  });

  it("devuelve [] si el fetch lanza (red caída), sin romper la página", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(getAvailablePlans()).resolves.toEqual([]);
  });

  it("devuelve [] si api/ responde con algo que no es un array", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ error: "boom" }) }));
    await expect(getAvailablePlans()).resolves.toEqual([]);
  });
});
