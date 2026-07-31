"use server";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

export interface CreatePriceAlertInput {
  email: string;
  matchKey: string;
  canonicalName: string;
  targetPrice: number;
}

export type CreatePriceAlertResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Sprint C — crea una alerta de precio en api/ (POST /api/alerts). Sin
 * cuenta de usuario: el email se captura acá y toda la gestión posterior
 * (confirmar/cancelar) sucede vía el link que llega por correo, no en
 * web/. Ver docs/prompt/claude/PROMPT_CLAUDE_SPRINT_C_ALERTAS_EMAIL.md.
 */
export async function createPriceAlert(input: CreatePriceAlertInput): Promise<CreatePriceAlertResult> {
  try {
    const res = await fetch(`${API_URL}/api/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (res.ok) return { ok: true };

    const body = await res.json().catch(() => ({}) as { error?: string });
    return { ok: false, error: body.error ?? "No pudimos crear la alerta en este momento." };
  } catch {
    return { ok: false, error: "No pudimos crear la alerta en este momento." };
  }
}
