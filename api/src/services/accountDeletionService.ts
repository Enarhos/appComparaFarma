import { supabase } from "../lib/supabaseClient.js";
import { findActiveSubscription } from "../lib/subscriptionsDb.js";
import {
  getDeletionRequest,
  markDeletionPending,
  clearDeletionPending,
  markDeletionFailed,
  deleteAccountData,
} from "../lib/accountDeletionDb.js";

// AUTH-DELETE-01 (Backend) — orquestador único del borrado de cuenta.
// Principio rector (revisión CTO): "Eliminar identidad personal, preservar
// inteligencia farmacéutica no personal." Este servicio solo toca datos
// personales (ver accountDeletionDb.deleteAccountData) — nunca
// price_history/pharmacy_clicks/medications/subscription_plans/app_config.
//
// GATE 2 (retención financiera): política activa = DELETE por defecto sobre
// subscription_events.raw_payload — no existe fundamento legal/tributario
// documentado en el repo que justifique conservarlo, así que no se retiene
// "por si acaso" (ver docs/technology/database/schema.sql, comentario de
// `delete_account_data`). Si en el futuro se documenta un fundamento legal
// real, este es el único punto que habría que cambiar (política
// configurable, no hardcodeada en múltiples lugares).
//
// GATE 3 (deletion_pending obligatorio): ver accountDeletionDb.ts para el
// ciclo de vida completo ACTIVE -> DELETION_PENDING -> DELETED.

export type DeleteAccountOutcome =
  | { status: "deleted" }
  | { status: "blocked_active_subscription"; provider: string }
  | { status: "cleanup_failed_retryable"; error: string }
  | { status: "auth_deletion_failed_retryable"; error: string };

const RETRYABLE_ADMIN_API_ATTEMPTS = 3;
const RETRYABLE_ADMIN_API_BACKOFF_MS = 250;

function isUserAlreadyGone(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("not found") || normalized.includes("does not exist");
}

async function deleteAuthUserWithRetry(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "supabase_not_configured" };

  let lastError = "unknown_error";
  for (let attempt = 1; attempt <= RETRYABLE_ADMIN_API_ATTEMPTS; attempt++) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (!error) return { ok: true };
      // Idempotencia (sección 8): un usuario ya eliminado en un intento
      // previo (propio o de una request anterior) es un estado final
      // válido, no un fallo.
      if (isUserAlreadyGone(error.message)) return { ok: true };
      lastError = error.message;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown_error";
    }
    if (attempt < RETRYABLE_ADMIN_API_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRYABLE_ADMIN_API_BACKOFF_MS * attempt));
    }
  }
  return { ok: false, error: lastError };
}

/**
 * Punto de entrada único — cubre tanto el intento inicial como el
 * retry/resume (CTO fix, GATE_3_AUTH_DELETE_RETRY_REPORT.md). Asume que la
 * identidad y la reautenticación ya fueron verificadas por el caller
 * (routes/account.ts, vía `resolveAuthenticatedUser` — que a propósito NO
 * bloquea cuentas DELETION_PENDING, porque este es precisamente el
 * endpoint que debe seguir siendo alcanzable para poder reanudar).
 *
 * Si ya existe una solicitud pendiente para este usuario, esto es un
 * retry: no se vuelve a evaluar el bloqueo por suscripción activa (ya se
 * pasó esa puerta en el intento que dejó la fila pendiente — si hubiera
 * bloqueado, esa fila ya se habría borrado) y no se repite `public_cleanup`
 * si `steps_completed` ya lo registra. El email usado es el de la fila de
 * control (el mismo con el que se inició esta solicitud), no uno nuevo del
 * JWT — determinismo de qué se está borrando de principio a fin.
 */
export async function deleteAccount(userId: string, email: string): Promise<DeleteAccountOutcome> {
  const existing = await getDeletionRequest(userId);
  const effectiveEmail = existing?.email ?? email;
  const cleanupAlreadyDone = existing?.stepsCompleted.includes("public_cleanup") ?? false;

  if (!existing) {
    await markDeletionPending(userId, effectiveEmail);

    // Sección 9 — no romper el motor de suscripciones. Una suscripción
    // activa con un proveedor externo real (google_play/flow) no puede
    // cancelarse desde este backend hoy (no existe ese mecanismo en el
    // proyecto — ver GATE_3_AUTH_DELETE_01_REPORT.md sección I) — no se
    // inventa una llamada destructiva que no existe. `manual` (cortesía)
    // no tiene obligación externa y sí puede cerrarse localmente. Este
    // chequeo solo corre en el intento inicial: si un retry llegó hasta
    // acá es porque ya lo pasó (o nunca hubo suscripción que lo requiriera).
    const activeSubscription = await findActiveSubscription(userId);
    if (activeSubscription && activeSubscription.provider !== "manual") {
      await clearDeletionPending(userId);
      return { status: "blocked_active_subscription", provider: activeSubscription.provider };
    }
  }

  if (!cleanupAlreadyDone) {
    const cleanup = await deleteAccountData(userId, effectiveEmail);
    if (!cleanup.ok) {
      await markDeletionFailed(userId, cleanup.error, []);
      return { status: "cleanup_failed_retryable", error: cleanup.error };
    }
  }

  const authDeletion = await deleteAuthUserWithRetry(userId);
  if (!authDeletion.ok) {
    await markDeletionFailed(userId, authDeletion.error, ["public_cleanup"]);
    return { status: "auth_deletion_failed_retryable", error: authDeletion.error };
  }

  // Éxito completo — no queda ningún registro personal, ni siquiera el de
  // control (sección 11: "no mantener user_id/email indefinidamente
  // después del cierre").
  await clearDeletionPending(userId);
  return { status: "deleted" };
}
