import { describe, it, expect, vi, afterEach } from "vitest";
import { createPriceAlert } from "./createPriceAlert";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createPriceAlert", () => {
  it("devuelve ok:true cuando la API responde 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    const result = await createPriceAlert({
      email: "a@b.com",
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      targetPrice: 900,
    });

    expect(result).toEqual({ ok: true });
  });

  it("devuelve el mensaje de error de la API cuando responde con error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Debes indicar un email válido." }),
      })
    );

    const result = await createPriceAlert({
      email: "no-es-email",
      matchKey: "x",
      canonicalName: "X",
      targetPrice: 900,
    });

    expect(result).toEqual({ ok: false, error: "Debes indicar un email válido." });
  });

  it("devuelve un error genérico si el fetch lanza (red caída)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await createPriceAlert({ email: "a@b.com", matchKey: "x", canonicalName: "X", targetPrice: 900 });

    expect(result.ok).toBe(false);
  });
});
