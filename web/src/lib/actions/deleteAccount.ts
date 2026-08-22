"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = (process.env.API_URL ?? "https://comparafarma-api.vercel.app").replace(/\/$/, "");

// AUTH-DELETE-02 (Web) — Server Action que llama al endpoint ya desplegado
// en Production, `POST /api/account?action=delete` (AUTH-DELETE-01,
// backend sin cambios). Mismo patrón que startFlowSubscription.ts: el
// Authorization se arma acá con el access_token de la sesión activa
// (`supabase.auth.getSession()`), nunca con un user_id/email que venga del
// cliente.
//
// El backend (api/src/routes/account.ts) no expone un `code` estable para
// todos sus casos de error — solo lo hace para 409 (suscripción activa) y
// 500 (fallas retryable). Para el resto (400/401/503) el único contrato
// estable disponible es el texto exacto de `error` + el status HTTP, así
// que este mapeo depende de esos literales. Si `api/src/routes/account.ts`
// cambia esos mensajes, este mapeo debe actualizarse junto con él.

export type DeleteAccountErrorCode =
  | "unauthorized"
  | "missing_password"
  | "invalid_credentials"
  | "active_subscription_requires_cancellation"
  | "not_configured"
  | "cleanup_failed_retryable"
  | "auth_deletion_failed_retryable"
  | "network_error"
  | "generic_error";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; code: DeleteAccountErrorCode; message: string; provider?: string };

const GENERIC_ERROR = "No se pudo completar la eliminación. Intenta de nuevo más tarde.";

function mapErrorResponse(status: number, body: { error?: string; code?: string; provider?: string }): DeleteAccountResult {
  // Casos con `code` estable — usarlo directo, sin depender del texto.
  if (body.code === "active_subscription_requires_cancellation") {
    // Gate 2.1 (hardening): mensaje siempre fijo, nunca body.error — no se
    // reenvía texto controlado por el backend al cliente, ni siquiera en
    // este caso "conocido" (defensa en profundidad).
    return {
      ok: false,
      code: "active_subscription_requires_cancellation",
      message: "Tienes una suscripción activa que debe cancelarse antes de eliminar tu cuenta.",
      provider: body.provider,
    };
  }
  if (body.code === "cleanup_failed_retryable" || body.code === "auth_deletion_failed_retryable") {
    return { ok: false, code: body.code, message: GENERIC_ERROR };
  }

  // Sin `code` — mapear por status + texto literal exacto de account.ts.
  if (status === 401) {
    if (body.error === "No se pudo verificar la contraseña.") {
      return { ok: false, code: "invalid_credentials", message: "La contraseña no es correcta." };
    }
    // "No autorizado." (sesión inválida/expirada) o el caso OAuth de
    // sesión no reciente (inalcanzable desde esta UI hoy, ver AUTH-DELETE-02
    // Fase 3 del audit: /cuenta es 100% email/password) — mismo tratamiento.
    return { ok: false, code: "unauthorized", message: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  if (status === 400 && body.error === "Falta la contraseña para reautenticar.") {
    return { ok: false, code: "missing_password", message: "Ingresa tu contraseña actual." };
  }
  if (status === 503) {
    return {
      ok: false,
      code: "not_configured",
      message: "No pudimos verificar tu identidad en este momento. Intenta más tarde.",
    };
  }
  // Gate 2.1 (hardening): status no reconocido -> nunca se expone
  // body.error (podría no ser ni siquiera texto de la propia app, ej. un
  // 502 de infraestructura) — siempre el mensaje genérico fijo.
  return { ok: false, code: "generic_error", message: GENERIC_ERROR };
}

export async function deleteAccount(password: string): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      return { ok: false, code: "unauthorized", message: "Tu sesión expiró. Vuelve a iniciar sesión." };
    }

    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/account?action=delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
    } catch {
      // Gate 2.1 (hardening): ni siquiera err.message se loguea — puede
      // filtrar detalles de red/URL. Solo un código fijo, sin excepción
      // cruda, sin password, sin token.
      console.warn("account_delete_failed", "network_error");
      return { ok: false, code: "network_error", message: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string; provider?: string };
    return mapErrorResponse(res.status, body);
  } catch {
    // Mismo criterio: código fijo, sin excepción cruda.
    console.warn("account_delete_failed", "generic_error");
    return { ok: false, code: "generic_error", message: GENERIC_ERROR };
  }
}
