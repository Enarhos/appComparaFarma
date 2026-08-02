import { supabase } from "./supabaseClient.js";

// Subscription Platform — Fase 1 (RFC-003, ADR-0002).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
//
// Capa de acceso a datos cruda — sin lógica de negocio (eso vive en
// subscriptionService.ts). Mismo patrón de degradación elegante que
// priceHistoryDb.ts/emailAlertsDb.ts: cualquier falla de Supabase hace que
// las funciones devuelvan null/[]/no-op, nunca lanzan.

const PLANS_TABLE = "subscription_plans";
const SUBSCRIPTIONS_TABLE = "subscriptions";
const EVENTS_TABLE = "subscription_events";
const PROFILES_TABLE = "profiles";

export type SubscriptionStatus = "pending" | "active" | "canceled" | "expired" | "grace_period";
export type SubscriptionProvider = "google_play" | "apple" | "stripe" | "flow" | "mercadopago" | "manual";
export type SubscriptionEventType = "purchase" | "renewal" | "cancellation" | "expiration" | "refund";

export interface SubscriptionPlanRow {
  id: string;
  name: string;
  productType: string;
  billingPeriod: string | null;
  referencePrice: number | null;
  currency: string;
  benefits: string[];
  isAvailable: boolean;
  status: "active" | "inactive";
}

export interface SubscriptionRow {
  id: number;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  providerReference: string | null;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

export interface InsertSubscriptionInput {
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  providerReference: string | null;
  startedAt: string | null;
  currentPeriodEnd: string | null;
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
}

export interface InsertEventInput {
  subscriptionId: number;
  type: SubscriptionEventType;
  provider: SubscriptionProvider;
  rawPayload: unknown;
}

interface PlanRowRaw {
  id: string;
  name: string;
  product_type: string;
  billing_period: string | null;
  reference_price: number | null;
  currency: string;
  benefits: string[];
  is_available: boolean;
  status: "active" | "inactive";
}

function fromPlanRow(row: PlanRowRaw): SubscriptionPlanRow {
  return {
    id: row.id,
    name: row.name,
    productType: row.product_type,
    billingPeriod: row.billing_period,
    referencePrice: row.reference_price,
    currency: row.currency,
    benefits: row.benefits ?? [],
    isAvailable: row.is_available,
    status: row.status,
  };
}

interface SubscriptionRowRaw {
  id: number;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  provider_reference: string | null;
  started_at: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
}

function fromSubscriptionRow(row: SubscriptionRowRaw): SubscriptionRow {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    provider: row.provider,
    providerReference: row.provider_reference,
    startedAt: row.started_at,
    currentPeriodEnd: row.current_period_end,
    canceledAt: row.canceled_at,
  };
}

export async function findPlan(planId: string): Promise<SubscriptionPlanRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(PLANS_TABLE).select("*").eq("id", planId).maybeSingle();
    if (error) {
      console.warn("subscription_plans select failed", error.message);
      return null;
    }
    return data ? fromPlanRow(data as PlanRowRaw) : null;
  } catch (err) {
    console.warn("subscription_plans select threw", err);
    return null;
  }
}

/** La fila "relevante" de un usuario: la más reciente en estado active/grace_period. */
export async function findActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "grace_period"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("subscriptions select active failed", error.message);
      return null;
    }
    return data ? fromSubscriptionRow(data as SubscriptionRowRaw) : null;
  } catch (err) {
    console.warn("subscriptions select active threw", err);
    return null;
  }
}

export async function findSubscriptionByProviderReference(
  provider: SubscriptionProvider,
  providerReference: string
): Promise<SubscriptionRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("provider", provider)
      .eq("provider_reference", providerReference)
      .maybeSingle();
    if (error) {
      console.warn("subscriptions select by provider_reference failed", error.message);
      return null;
    }
    return data ? fromSubscriptionRow(data as SubscriptionRowRaw) : null;
  } catch (err) {
    console.warn("subscriptions select by provider_reference threw", err);
    return null;
  }
}

export async function insertSubscription(input: InsertSubscriptionInput): Promise<SubscriptionRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .insert({
        user_id: input.userId,
        plan_id: input.planId,
        status: input.status,
        provider: input.provider,
        provider_reference: input.providerReference,
        started_at: input.startedAt,
        current_period_end: input.currentPeriodEnd,
      })
      .select("*")
      .single();
    if (error || !data) {
      if (error) console.warn("subscriptions insert failed", error.message);
      return null;
    }
    return fromSubscriptionRow(data as SubscriptionRowRaw);
  } catch (err) {
    console.warn("subscriptions insert threw", err);
    return null;
  }
}

export async function updateSubscription(id: number, updates: UpdateSubscriptionInput): Promise<void> {
  if (!supabase) return;
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.currentPeriodEnd !== undefined) patch.current_period_end = updates.currentPeriodEnd;
    if (updates.canceledAt !== undefined) patch.canceled_at = updates.canceledAt;

    const { error } = await supabase.from(SUBSCRIPTIONS_TABLE).update(patch).eq("id", id);
    if (error) console.warn("subscriptions update failed", error.message);
  } catch (err) {
    console.warn("subscriptions update threw", err);
  }
}

export async function insertEvent(input: InsertEventInput): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(EVENTS_TABLE).insert({
      subscription_id: input.subscriptionId,
      type: input.type,
      provider: input.provider,
      raw_payload: input.rawPayload,
    });
    if (error) console.warn("subscription_events insert failed", error.message);
  } catch (err) {
    console.warn("subscription_events insert threw", err);
  }
}

/**
 * Único punto de escritura de `profiles.plan` desde Fase 1 en adelante —
 * pasa a ser un cache derivado, nunca la fuente de verdad (ver CF-116).
 */
export async function updateProfilePlanCache(userId: string, active: boolean): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update({ plan: active ? "premium" : "free", updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) console.warn("profiles plan cache update failed", error.message);
  } catch (err) {
    console.warn("profiles plan cache update threw", err);
  }
}
