"use server";

import { WEB_DONATIONS_PAUSED } from "@/lib/donationsConfig";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");
const GENERIC_ERROR = "No pudimos iniciar el pago. Intenta nuevamente en unos momentos.";
const ALLOWED_AMOUNTS = [1000, 3000, 5000] as const;

export type CreateDonationPaymentResult = { ok: true; paymentUrl: string } | { ok: false; error: string };

/**
 * Valida que payment_url sea una URL https válida y, sin volverse frágil,
 * restringida a dominios oficiales de Khipu (khipu.com y subdominios) antes
 * de dejar que Web navegue a ella. Nunca se confía en el string crudo del
 * backend sin pasar por new URL().
 */
function isValidKhipuPaymentUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return url.hostname === "khipu.com" || url.hostname.endsWith(".khipu.com");
}

/**
 * Crea un pago de donación llamando a POST /api/donate (Sprint
 * FEAT-WEB-DONATIONS). Nunca envía ni recibe ninguna credencial de Khipu ni
 * de la API (API_SECRET_KEY, KHIPU_API_KEY, KHIPU_SECRET,
 * KHIPU_RECEIVER_ID) — el body enviado es únicamente { amount }. No se
 * loguea payment_url ni el detalle de errores de Khipu; cualquier fallo
 * devuelve el mismo mensaje genérico, nunca el cuerpo crudo de la respuesta.
 *
 * Pausa temporal (Production Closure, 2026-08-16, ver lib/donationsConfig.ts):
 * si WEB_DONATIONS_PAUSED es true, esta acción NUNCA llama a fetch —
 * devuelve directamente un resultado de error genérico, sin tocar la red ni
 * /api/donate. El backend (api/src/routes/donate.ts) tiene la misma bandera
 * como segunda barrera, por si esta acción se saltara.
 */
export async function createDonationPayment(amount: number): Promise<CreateDonationPaymentResult> {
  if (WEB_DONATIONS_PAUSED) {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!ALLOWED_AMOUNTS.includes(amount as (typeof ALLOWED_AMOUNTS)[number])) {
    return { ok: false, error: GENERIC_ERROR };
  }

  try {
    const res = await fetch(`${API_URL}/api/donate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    if (!res.ok) {
      return { ok: false, error: GENERIC_ERROR };
    }

    const body = (await res.json().catch(() => null)) as { payment_url?: unknown } | null;
    if (!body || !isValidKhipuPaymentUrl(body.payment_url)) {
      return { ok: false, error: GENERIC_ERROR };
    }

    return { ok: true, paymentUrl: body.payment_url };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}
