import { supabase } from "./supabaseClient.js";

// AUTH-DELETE-01 (Backend) — GATE 3 (deletion_pending obligatorio).
// docs/technology/database/schema.sql — tabla `account_deletion_requests` y
// función `delete_account_data()` (agregadas en esta misma tarea, ver
// comentario ahí — deben correrse a mano en el SQL Editor de Supabase antes
// de desplegar este código, mismo criterio que el resto de `schema.sql`).
//
// Vida de una fila de `account_deletion_requests`:
//   (no existe)  -- cuenta ACTIVE, operando normalmente
//   -> INSERT/UPSERT (status='pending')  -- DELETION_PENDING
//   -> DELETE de la fila  -- éxito, cuenta DELETED (no queda registro personal)
//   (si falla)   -- la fila permanece con status='pending' y last_error, para
//                   permitir un retry seguro más adelante — nunca se
//                   convierte en un histórico permanente (no hay ninguna
//                   fila con status='completed': el éxito borra la fila).
//
// Mismo patrón de degradación elegante que el resto de `api/src/lib/*Db.ts`:
// sin Supabase configurado, todo es no-op/null, nunca lanza.

const REQUESTS_TABLE = "account_deletion_requests";

export async function isDeletionPending(userId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from(REQUESTS_TABLE)
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (error) {
      console.warn("account_deletion_requests select failed", error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.warn("account_deletion_requests select threw", err);
    return false;
  }
}

export interface DeletionRequestRow {
  email: string;
  stepsCompleted: string[];
}

/**
 * Lee la fila de control pendiente de un usuario, si existe — es la base
 * del retry/resume (CTO fix, ver GATE_3_AUTH_DELETE_RETRY_REPORT.md):
 * `steps_completed` dice qué pasos ya se completaron (hoy el único valor
 * posible es `["public_cleanup"]`), y `email` es el correo con el que se
 * inició ESTA solicitud de borrado — se reutiliza en el resume en vez de
 * releer el JWT, para que un mismo intento de borrado siempre limpie
 * exactamente el mismo email de principio a fin.
 */
export async function getDeletionRequest(userId: string): Promise<DeletionRequestRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(REQUESTS_TABLE)
      .select("email, steps_completed")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();
    if (error) {
      console.warn("account_deletion_requests getDeletionRequest failed", error.message);
      return null;
    }
    if (!data) return null;
    return { email: data.email as string, stepsCompleted: (data.steps_completed as string[]) ?? [] };
  } catch (err) {
    console.warn("account_deletion_requests getDeletionRequest threw", err);
    return null;
  }
}

/** Marca la cuenta como DELETION_PENDING. Idempotente: una segunda llamada mientras ya está pendiente solo actualiza `last_attempt_at`. */
export async function markDeletionPending(userId: string, email: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(REQUESTS_TABLE)
      .upsert(
        { user_id: userId, email, status: "pending", last_attempt_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) console.warn("account_deletion_requests upsert failed", error.message);
  } catch (err) {
    console.warn("account_deletion_requests upsert threw", err);
  }
}

/** Revierte DELETION_PENDING -> ACTIVE (ej. bloqueo por suscripción activa que requiere cancelación externa antes de continuar). */
export async function clearDeletionPending(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(REQUESTS_TABLE).delete().eq("user_id", userId);
    if (error) console.warn("account_deletion_requests clear failed", error.message);
  } catch (err) {
    console.warn("account_deletion_requests clear threw", err);
  }
}

export async function markDeletionFailed(userId: string, errorMessage: string, stepsCompleted: string[]): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(REQUESTS_TABLE)
      .update({ last_error: errorMessage, steps_completed: stepsCompleted, last_attempt_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) console.warn("account_deletion_requests markDeletionFailed failed", error.message);
  } catch (err) {
    console.warn("account_deletion_requests markDeletionFailed threw", err);
  }
}

export type DeleteAccountDataResult = { ok: true } | { ok: false; error: string };

/**
 * Limpieza atómica de `public.*` — una sola llamada a la función Postgres
 * `delete_account_data(p_user_id, p_email)` (transacción única del lado de
 * la base, ver schema.sql). Cubre: subscription_events (por subscription_id
 * del usuario, política DELETE — GATE 2), flow_customers, subscriptions,
 * email_alerts (por email), feedback (por email), profiles. Nunca toca
 * price_history, pharmacy_clicks, medications, medication_match_key_aliases,
 * subscription_plans ni app_config — la función SQL no las menciona (ver
 * accountDeletion.sql.test.ts, que audita el texto de la función).
 */
export async function deleteAccountData(userId: string, email: string): Promise<DeleteAccountDataResult> {
  if (!supabase) return { ok: false, error: "supabase_not_configured" };
  try {
    const { error } = await supabase.rpc("delete_account_data", { p_user_id: userId, p_email: email });
    if (error) {
      console.warn("delete_account_data rpc failed", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.warn("delete_account_data rpc threw", err);
    return { ok: false, error: message };
  }
}
