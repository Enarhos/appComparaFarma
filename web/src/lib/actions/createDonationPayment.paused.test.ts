import { describe, it, expect, vi, afterEach } from "vitest";
import { createDonationPayment } from "./createDonationPayment";
import { WEB_DONATIONS_PAUSED } from "@/lib/donationsConfig";

// A diferencia de createDonationPayment.test.ts (que mockea
// @/lib/donationsConfig a false), este archivo NO mockea la bandera —
// importa el valor real de producción (Production Closure, 2026-08-16:
// WEB_DONATIONS_PAUSED = true) para confirmar que la acción nunca inicia
// /api/donate mientras las donaciones estén pausadas.

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createDonationPayment — pausa real de producción", () => {
  it("la bandera de producción está en true hoy (Production Closure, 2026-08-16)", () => {
    expect(WEB_DONATIONS_PAUSED).toBe(true);
  });

  it("devuelve ok:false con el mensaje de pausa SIN llamar a fetch en absoluto", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDonationPayment(1000);

    expect(result).toEqual({
      ok: false,
      error:
        "Los aportes están temporalmente pausados mientras ComparaFarma se encuentra en su etapa inicial de crecimiento.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("se mantiene pausado sin importar el monto, incluso uno inválido", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createDonationPayment(999999);

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
