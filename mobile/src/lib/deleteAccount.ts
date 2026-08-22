// AUTH-DELETE-02 (Mobile) — cliente para el endpoint ya desplegado en
// Production, `POST /api/account?action=delete` (AUTH-DELETE-01, backend
// sin cambios). Mismo patrón que `lib/entitlements.ts`: fetch directo,
// `AbortController` con timeout, Authorization armado a mano con el
// access_token de la sesión activa (nunca un user_id/email propio).
//
// El backend (api/src/routes/account.ts) solo expone un `code` estable para
// dos casos (409 suscripción activa, 500 fallas retryable). Para el resto,
// el contrato estable es el texto exacto de `error` + el status HTTP — igual
// razonamiento que web/src/lib/actions/deleteAccount.ts (mismo mapeo,
// duplicado a propósito: Mobile y Web son clientes independientes del mismo
// contrato, sin una capa compartida de API client hoy).
const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
const REQUEST_TIMEOUT_MS = 10000;

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
  if (body.code === "active_subscription_requires_cancellation") {
    return {
      ok: false,
      code: "active_subscription_requires_cancellation",
      message: body.error ?? "Tienes una suscripción activa que debe cancelarse antes de eliminar tu cuenta.",
      provider: body.provider,
    };
  }
  if (body.code === "cleanup_failed_retryable" || body.code === "auth_deletion_failed_retryable") {
    return { ok: false, code: body.code, message: GENERIC_ERROR };
  }

  if (status === 401) {
    if (body.error === "No se pudo verificar la contraseña.") {
      return { ok: false, code: "invalid_credentials", message: "La contraseña no es correcta." };
    }
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
  return { ok: false, code: "generic_error", message: body.error ?? GENERIC_ERROR };
}

/**
 * Llama a `POST /api/account?action=delete` con el `accessToken` de la
 * sesión activa (obtenido por quien llama vía `getCurrentSession()` /
 * `authStore`, nunca leído acá) y la contraseña actual. Nunca loguea la
 * contraseña ni el token — ni en éxito ni en error.
 */
export async function deleteAccount(accessToken: string | null, password: string): Promise<DeleteAccountResult> {
  if (!accessToken) {
    return { ok: false, code: "unauthorized", message: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }
  if (!API_URL) {
    return { ok: false, code: "generic_error", message: GENERIC_ERROR };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/account?action=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ password }),
      signal: controller.signal,
    });

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string; provider?: string };
    return mapErrorResponse(res.status, body);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, code: "network_error", message: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
    }
    return { ok: false, code: "network_error", message: "No pudimos conectar. Revisa tu conexión e intenta de nuevo." };
  } finally {
    clearTimeout(timeout);
  }
}
