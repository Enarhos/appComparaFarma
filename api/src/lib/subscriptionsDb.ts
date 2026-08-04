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
const FLOW_CUSTOMERS_TABLE = "flow_customers";

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

/**
 * Planes vendibles hoy — Subscription Platform Fase 2 (RFC-004, CF-117).
 * Usado por `action=plans` (público) para que web/ pueda mostrar un botón de
 * upgrade sin hardcodear ningún plan. Devuelve `[]` (nunca lanza) si Supabase
 * no responde o si el catálogo comercial todavía no tiene ningún plan
 * disponible — ambos casos son "no mostrar el botón", no un error.
 */
export async function findAvailablePlans(): Promise<SubscriptionPlanRow[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(PLANS_TABLE)
      .select("*")
      .eq("is_available", true)
      .eq("status", "active")
      .order("reference_price", { ascending: true });
    if (error) {
      console.warn("subscription_plans select available failed", error.message);
      return [];
    }
    return ((data ?? []) as PlanRowRaw[]).map(fromPlanRow);
  } catch (err) {
    console.warn("subscription_plans select available threw", err);
    return [];
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
 * Identidad de Flow por usuario — Subscription Platform Fase 2 corregida
 * (RFC-005, ADR-0004, CF-122). Independiente de cualquier suscripción:
 * en Flow un cliente se crea y enrola tarjeta ANTES de que exista una
 * suscripción, así que necesita su propia tabla (no cabe en `subscriptions`,
 * que representa una suscripción concreta, no la identidad de pago del
 * usuario).
 */
export type FlowRegisterStatus = "pending" | "active";

export interface FlowCustomerRow {
  userId: string;
  flowCustomerId: string;
  registerStatus: FlowRegisterStatus;
  cardBrand: string | null;
  cardLast4: string | null;
}

export interface UpsertFlowCustomerInput {
  userId: string;
  flowCustomerId: string;
  registerStatus?: FlowRegisterStatus;
  cardBrand?: string | null;
  cardLast4?: string | null;
}

interface FlowCustomerRowRaw {
  user_id: string;
  flow_customer_id: string;
  register_status: FlowRegisterStatus;
  card_brand: string | null;
  card_last4: string | null;
}

function fromFlowCustomerRow(row: FlowCustomerRowRaw): FlowCustomerRow {
  return {
    userId: row.user_id,
    flowCustomerId: row.flow_customer_id,
    registerStatus: row.register_status,
    cardBrand: row.card_brand,
    cardLast4: row.card_last4,
  };
}

export async function findFlowCustomer(userId: string): Promise<FlowCustomerRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(FLOW_CUSTOMERS_TABLE).select("*").eq("user_id", userId).maybeSingle();
    if (error) {
      console.warn("flow_customers select failed", error.message);
      return null;
    }
    return data ? fromFlowCustomerRow(data as FlowCustomerRowRaw) : null;
  } catch (err) {
    console.warn("flow_customers select threw", err);
    return null;
  }
}

/**
 * Lookup inverso — necesario en `flow-register-return` (CF-124): Flow solo
 * nos da un `token`/`customerId` en ese callback público, nunca el `userId`
 * (no hay sesión ahí, es un POST directo del navegador del cliente vía
 * Flow). Este lookup es la fuente de verdad de a qué usuario corresponde
 * ese `customerId` — nunca se confía en un `userId` que venga del cliente.
 */
export async function findFlowCustomerByFlowCustomerId(flowCustomerId: string): Promise<FlowCustomerRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(FLOW_CUSTOMERS_TABLE).select("*").eq("flow_customer_id", flowCustomerId).maybeSingle();
    if (error) {
      console.warn("flow_customers select by flow_customer_id failed", error.message);
      return null;
    }
    return data ? fromFlowCustomerRow(data as FlowCustomerRowRaw) : null;
  } catch (err) {
    console.warn("flow_customers select by flow_customer_id threw", err);
    return null;
  }
}

/** Crea o actualiza la fila de identidad Flow del usuario (upsert por `user_id`). */
export async function upsertFlowCustomer(input: UpsertFlowCustomerInput): Promise<FlowCustomerRow | null> {
  if (!supabase) return null;
  try {
    const patch: Record<string, unknown> = {
      user_id: input.userId,
      flow_customer_id: input.flowCustomerId,
      updated_at: new Date().toISOString(),
    };
    if (input.registerStatus !== undefined) patch.register_status = input.registerStatus;
    if (input.cardBrand !== undefined) patch.card_brand = input.cardBrand;
    if (input.cardLast4 !== undefined) patch.card_last4 = input.cardLast4;

    const { data, error } = await supabase.from(FLOW_CUSTOMERS_TABLE).upsert(patch, { onConflict: "user_id" }).select("*").single();
    if (error || !data) {
      if (error) console.warn("flow_customers upsert failed", error.message);
      return null;
    }
    return fromFlowCustomerRow(data as FlowCustomerRowRaw);
  } catch (err) {
    console.warn("flow_customers upsert threw", err);
    return null;
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
