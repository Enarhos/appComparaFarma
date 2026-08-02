import {
  findActiveSubscription,
  findPlan,
  findSubscriptionByProviderReference,
  insertEvent,
  insertSubscription,
  updateProfilePlanCache,
  updateSubscription,
  type SubscriptionEventType,
  type SubscriptionProvider,
  type SubscriptionStatus,
} from "../lib/subscriptionsDb.js";

// Subscription Platform — Fase 1 (RFC-003, ADR-0002).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
//
// Única puerta de entrada para determinar acceso Premium (getEntitlement) y
// para que cualquier proveedor de pago reporte una transacción
// (recordProviderEvent). Ningún cliente (web hoy, mobile a futuro) ni ningún
// adaptador de proveedor debe leer/escribir subscriptions o subscription_events
// directo — todo pasa por acá.

export interface Entitlement {
  active: boolean;
  planId: string | null;
  benefits: string[];
  expiresAt: string | null;
}

const NO_ENTITLEMENT: Entitlement = { active: false, planId: null, benefits: [], expiresAt: null };

/** La única función que cualquier cliente debe llamar para saber si un usuario tiene Premium. */
export async function getEntitlement(userId: string): Promise<Entitlement> {
  try {
    const sub = await findActiveSubscription(userId);
    if (!sub) return NO_ENTITLEMENT;

    const plan = await findPlan(sub.planId);
    return {
      active: sub.status === "active" || sub.status === "grace_period",
      planId: sub.planId,
      benefits: plan?.benefits ?? [],
      expiresAt: sub.currentPeriodEnd,
    };
  } catch (err) {
    console.warn("getEntitlement threw", err);
    return NO_ENTITLEMENT;
  }
}

export interface NormalizedSubscriptionEvent {
  provider: SubscriptionProvider;
  providerReference: string;
  type: SubscriptionEventType;
  userId: string;
  planId: string;
  periodEnd: string | null;
  rawPayload: unknown;
}

const STATUS_FOR_EVENT_TYPE: Record<SubscriptionEventType, SubscriptionStatus> = {
  purchase: "active",
  renewal: "active",
  cancellation: "canceled",
  expiration: "expired",
  refund: "expired",
};

/** Punto de entrada de cualquier adaptador de proveedor ya normalizado. */
export async function recordProviderEvent(event: NormalizedSubscriptionEvent): Promise<void> {
  try {
    const nextStatus = STATUS_FOR_EVENT_TYPE[event.type];
    let sub = await findSubscriptionByProviderReference(event.provider, event.providerReference);

    if (!sub) {
      sub = await insertSubscription({
        userId: event.userId,
        planId: event.planId,
        status: nextStatus,
        provider: event.provider,
        providerReference: event.providerReference,
        startedAt: new Date().toISOString(),
        currentPeriodEnd: event.periodEnd,
      });
    } else {
      await updateSubscription(sub.id, {
        status: nextStatus,
        currentPeriodEnd: event.periodEnd ?? sub.currentPeriodEnd,
        canceledAt: event.type === "cancellation" ? new Date().toISOString() : undefined,
      });
    }

    if (!sub) return;

    await insertEvent({
      subscriptionId: sub.id,
      type: event.type,
      provider: event.provider,
      rawPayload: event.rawPayload,
    });

    await updateProfilePlanCache(event.userId, nextStatus === "active");
  } catch (err) {
    console.warn("recordProviderEvent threw", err);
  }
}

/** Otorgamiento manual (reemplaza el write directo de profilesAdmin.setProfilePlan — ver CF-116). */
export async function grantManual(userId: string, planId: string, expiresAt?: string): Promise<void> {
  try {
    const sub = await insertSubscription({
      userId,
      planId,
      status: "active",
      provider: "manual",
      providerReference: null,
      startedAt: new Date().toISOString(),
      currentPeriodEnd: expiresAt ?? null,
    });
    if (!sub) return;

    await insertEvent({
      subscriptionId: sub.id,
      type: "purchase",
      provider: "manual",
      rawPayload: { grantedBy: "admin" },
    });
    await updateProfilePlanCache(userId, true);
  } catch (err) {
    console.warn("grantManual threw", err);
  }
}

/** Revoca el acceso otorgado manualmente (contraparte de grantManual para el toggle de /admin/usuarios). */
export async function revokeManual(userId: string): Promise<void> {
  try {
    const sub = await findActiveSubscription(userId);
    if (sub && sub.provider === "manual") {
      await updateSubscription(sub.id, { status: "canceled", canceledAt: new Date().toISOString() });
      await insertEvent({
        subscriptionId: sub.id,
        type: "cancellation",
        provider: "manual",
        rawPayload: { revokedBy: "admin" },
      });
    }
    await updateProfilePlanCache(userId, false);
  } catch (err) {
    console.warn("revokeManual threw", err);
  }
}
