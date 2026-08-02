"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

export type CreateCheckoutSessionResult = { ok: true; url: string } | { ok: false; error: string };

const GENERIC_ERROR = "No pudimos iniciar el pago en este momento.";

/**
 * Subscription Platform — Fase 2 (RFC-004, CF-120). Pide a api/ que cree una
 * Checkout Session de Stripe para el plan elegido y devuelve la URL a la que
 * el cliente debe redirigir — la redirección la hace el componente cliente
 * (UpgradeButton), no esta acción, siguiendo el mismo patrón de
 * createPriceAlert.ts (Sprint C): la acción devuelve un resultado, nunca
 * lanza.
 */
export async function createCheckoutSession(planId: string): Promise<CreateCheckoutSessionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, error: "Debes iniciar sesión para actualizar tu plan." };

    const res = await fetch(`${API_URL}/api/subscriptions?action=create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { error?: string });
      return { ok: false, error: body.error ?? GENERIC_ERROR };
    }

    const body = (await res.json()) as { url?: string };
    if (!body.url) return { ok: false, error: GENERIC_ERROR };
    return { ok: true, url: body.url };
  } catch (err) {
    console.warn("createCheckoutSession failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
