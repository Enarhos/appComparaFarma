import type { SubscriptionEventType } from "../subscriptionsDb.js";
import type { NormalizedSubscriptionEvent } from "../../services/subscriptionService.js";

// Subscription Platform — Fase 1 (RFC-003, CF-114).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
//
// Adaptador de Google Play — el único proveedor implementado en Fase 1.
// Traduce el formato propio de Real-Time Developer Notifications (RTDN) de
// Google a nuestro NormalizedSubscriptionEvent. Nunca escribe en
// subscriptions/subscription_events directo — eso es responsabilidad de
// subscriptionService.recordProviderEvent().
//
// Limitación conocida de Fase 1 (ver RFC-003 §5, R-02): RTDN trae el
// purchaseToken, no el user_id de Supabase. Sin que `mobile/` (congelado)
// pueda enviar ese token al backend en el momento de la compra, no hay
// forma de resolver a qué usuario corresponde una notificación nueva —
// solo se pueden procesar renovaciones/cancelaciones de suscripciones que
// ya se asociaron a un usuario por otro medio (ej. sandbox de prueba con
// otorgamiento manual). Esto es un límite documentado, no un bug.

// Referencia: https://developer.android.com/google/play/billing/rtdn-reference
// SubscriptionNotificationType — solo se listan los que Fase 1 necesita.
const NOTIFICATION_TYPE_MAP: Record<number, SubscriptionEventType | null> = {
  1: "renewal", // SUBSCRIPTION_RECOVERED
  2: "renewal", // SUBSCRIPTION_RENEWED
  3: "cancellation", // SUBSCRIPTION_CANCELED
  4: "purchase", // SUBSCRIPTION_PURCHASED
  5: null, // SUBSCRIPTION_ON_HOLD — fuera de alcance de Fase 1
  6: "renewal", // SUBSCRIPTION_IN_GRACE_PERIOD — tratamos como que el plan sigue activo
  7: "renewal", // SUBSCRIPTION_RESTARTED
  8: null, // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
  9: null, // SUBSCRIPTION_DEFERRED
  10: "cancellation", // SUBSCRIPTION_PAUSED
  11: null, // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
  12: "refund", // SUBSCRIPTION_REVOKED
  13: "expiration", // SUBSCRIPTION_EXPIRED
};

export interface GooglePlayRtdnEnvelope {
  message: { data: string; messageId?: string; publishTime?: string };
  subscription?: string;
}

export interface ParsedGooglePlayNotification {
  packageName: string;
  eventTimeMillis: string;
  purchaseToken: string;
  subscriptionProductId: string; // ID del producto de Google Play — convención: debe coincidir con subscription_plans.id
  type: SubscriptionEventType | null; // null si el notificationType no nos interesa en Fase 1
}

/** Decodifica y valida el sobre de Pub/Sub — no lanza, devuelve null ante cualquier formato inesperado. */
export function parseGooglePlayNotification(envelope: GooglePlayRtdnEnvelope): ParsedGooglePlayNotification | null {
  try {
    if (!envelope?.message?.data) return null;

    const decoded = Buffer.from(envelope.message.data, "base64").toString("utf-8");
    const json = JSON.parse(decoded);
    const sub = json.subscriptionNotification;
    if (!sub || typeof sub.purchaseToken !== "string" || typeof sub.subscriptionId !== "string") {
      // No es una notificación de suscripción (podría ser un producto único,
      // "testNotification", o un formato que no reconocemos) — se ignora.
      return null;
    }

    return {
      packageName: json.packageName,
      eventTimeMillis: json.eventTimeMillis,
      purchaseToken: sub.purchaseToken,
      subscriptionProductId: sub.subscriptionId,
      type: NOTIFICATION_TYPE_MAP[sub.notificationType] ?? null,
    };
  } catch (err) {
    console.warn("parseGooglePlayNotification failed", err);
    return null;
  }
}

/**
 * Construye el evento normalizado, dado un userId ya resuelto (ver limitación
 * de Fase 1 arriba — la resolución de userId no es responsabilidad de este
 * adaptador). Devuelve null si el tipo de notificación no es uno que Fase 1
 * procese (ver NOTIFICATION_TYPE_MAP).
 */
export function toNormalizedEvent(
  parsed: ParsedGooglePlayNotification,
  userId: string
): NormalizedSubscriptionEvent | null {
  if (!parsed.type) return null;

  return {
    provider: "google_play",
    providerReference: parsed.purchaseToken,
    type: parsed.type,
    userId,
    planId: parsed.subscriptionProductId,
    // RTDN no incluye la fecha de vencimiento del período — requiere una
    // llamada aparte a purchases.subscriptions.get de la Play Developer API
    // (fuera de alcance del parser; se deja null hasta implementarse).
    periodEnd: null,
    rawPayload: parsed,
  };
}
