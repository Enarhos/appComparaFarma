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
      currentPrice: 1000,
    });

    expect(result).toEqual({ ok: true });
  });

  it("envía currentPrice en el body — el backend lo exige para targetPrice < currentPrice", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await createPriceAlert({
      email: "a@b.com",
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      targetPrice: 900,
      currentPrice: 1000,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({
      email: "a@b.com",
      matchKey: "paracetamol|500mg",
      canonicalName: "Paracetamol 500 mg",
      targetPrice: 900,
      currentPrice: 1000,
    });
  });

  it("devuelve el mensaje de error de la API cuando responde con error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "El precio objetivo debe ser menor al precio actual." }),
      })
    );

    const result = await createPriceAlert({
      email: "a@b.com",
      matchKey: "x",
      canonicalName: "X",
      targetPrice: 900,
      currentPrice: 900,
    });

    expect(result).toEqual({ ok: false, error: "El precio objetivo debe ser menor al precio actual." });
  });

  it("devuelve un error genérico si el fetch lanza (red caída)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await createPriceAlert({
      email: "a@b.com",
      matchKey: "x",
      canonicalName: "X",
      targetPrice: 900,
      currentPrice: 1000,
    });

    expect(result.ok).toBe(false);
  });
});
