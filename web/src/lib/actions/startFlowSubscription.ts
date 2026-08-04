"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

export type StartFlowSubscriptionResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

const GENERIC_ERROR = "No pudimos iniciar el pago en este momento.";

/**
 * Subscription Platform — Fase 2 corregida (RFC-005, CF-125; reemplaza a
 * createCheckoutSession.ts/Stripe, ver ADR-0004). Pide a api/ que inicie el
 * flujo de alta con Flow para el plan elegido — según el estado del usuario
 * en Flow, `api/` puede devolver directamente una URL de Flow (a enrolar
 * tarjeta) o, si ya tiene tarjeta activa, crear la suscripción de una vez y
 * devolver directo la URL de vuelta a `/cuenta`. La redirección la hace el
 * componente cliente (UpgradeButton), no esta acción — mismo patrón que
 * createPriceAlert.ts (Sprint C): la acción devuelve un resultado, nunca lanza.
 */
export async function startFlowSubscription(planId: string): Promise<StartFlowSubscriptionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, error: "Debes iniciar sesión para actualizar tu plan." };

    const res = await fetch(`${API_URL}/api/subscriptions?action=start-flow-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { error?: string });
      return { ok: false, error: body.error ?? GENERIC_ERROR };
    }

    const body = (await res.json()) as { redirectUrl?: string };
    if (!body.redirectUrl) return { ok: false, error: GENERIC_ERROR };
    return { ok: true, redirectUrl: body.redirectUrl };
  } catch (err) {
    console.warn("startFlowSubscription failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
