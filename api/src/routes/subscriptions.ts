import { getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { isAuthorized } from "../middleware/auth.js";
import { supabase } from "../lib/supabaseClient.js";
import { getEntitlement, recordProviderEvent, grantManual, revokeManual } from "../services/subscriptionService.js";
import { findAvailablePlans, findPlan, findSubscriptionByProviderReference } from "../lib/subscriptionsDb.js";
import { parseGooglePlayNotification, toNormalizedEvent, type GooglePlayRtdnEnvelope } from "../lib/adapters/googlePlayAdapter.js";
import { parseStripeWebhookPayload } from "../lib/adapters/stripeAdapter.js";

// Subscription Platform — Fase 1 (RFC-003, CF-115) + Fase 2 (RFC-004, CF-119).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
// docs/engineering/rfc/RFC-004_WEB_BILLING_STRIPE.md
//
// Endpoint consolidado (1 sola función serverless, api/api/subscriptions.ts)
// que despacha por método + query param `action`, mismo patrón que
// routes/alerts.ts, para no acercarnos al límite de 12 funciones del plan
// Hobby de Vercel (hoy 10/12).
//
// Fase 2 agrega `export const config = { api: { bodyParser: false } }` en
// api/api/subscriptions.ts — necesario para que action=stripe-webhook pueda
// verificar la firma sobre el body crudo exacto. Todas las acciones (Fase 1
// y Fase 2) leen el body vía readRawBody()/parseBody() de abajo, que ya
// hacían una lectura manual del stream como respaldo — este cambio no
// altera su comportamiento.

async function readRawBody(req: RequestLike): Promise<string> {
  const raw = (req as Record<string, unknown>).body;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") return JSON.stringify(raw);

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return Buffer.concat(chunks).toString();
}

async function parseBody(req: RequestLike): Promise<Record<string, unknown>> {
  const text = await readRawBody(req);
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

/** Resuelve el usuario a partir del access token de Supabase (Authorization: Bearer <jwt>). */
async function resolveUserId(req: RequestLike): Promise<string | null> {
  const authHeader = getHeader(req, "authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch (err) {
    console.warn("resolveUserId threw", err);
    return null;
  }
}

async function handleMe(req: RequestLike, res: ResponseLike): Promise<void> {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }
  const entitlement = await getEntitlement(userId);
  json(res, 200, entitlement, req);
}

/**
 * Público, sin auth — Subscription Platform Fase 2 (RFC-004, CF-119).
 * Nunca expone `stripePriceId` (interno) — solo lo necesario para que web/
 * pueda mostrar un botón de upgrade sin hardcodear ningún plan.
 */
async function handlePlans(req: RequestLike, res: ResponseLike): Promise<void> {
  const plans = await findAvailablePlans();
  json(
    res,
    200,
    plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      referencePrice: plan.referencePrice,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      benefits: plan.benefits,
    })),
    req
  );
}

/**
 * Reservado para cuando `mobile/` (congelado, ver CLAUDE.md) pueda enviar el
 * purchaseToken tras una compra real vía Play Billing Library — hoy no hay
 * ningún cliente que la llame, pero la ruta ya existe y está testeada.
 */
async function handleVerifyPurchase(req: RequestLike, res: ResponseLike): Promise<void> {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const body = await parseBody(req);
  const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken : "";
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!purchaseToken || !planId) {
    json(res, 400, { error: "Faltan purchaseToken/planId." }, req);
    return;
  }

  await recordProviderEvent({
    provider: "google_play",
    providerReference: purchaseToken,
    type: "purchase",
    userId,
    planId,
    periodEnd: null,
    rawPayload: { source: "verify-purchase" },
  });

  json(res, 200, { ok: true }, req);
}

async function handleGoogleRtdn(req: RequestLike, res: ResponseLike): Promise<void> {
  const expected = process.env.GOOGLE_RTDN_SECRET?.trim();
  const provided = getSearchParam(req, "token");
  // Sin fallback abierto si el secret no está configurado — mismo patrón que
  // action=check de alerts.ts (CRON_SECRET): sin secret, la ruta queda cerrada.
  if (!expected || provided !== expected) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const body = await parseBody(req);
  const parsed = parseGooglePlayNotification(body as unknown as GooglePlayRtdnEnvelope);
  if (!parsed) {
    json(res, 200, { ok: true, skipped: "not-a-subscription-notification" }, req);
    return;
  }

  // Fase 1: solo se pueden procesar notificaciones de suscripciones que ya
  // están asociadas a un usuario (ver RFC-003 §5 R-02) — sin que mobile/
  // envíe el purchaseToken al comprar, no hay forma de originar esa
  // asociación acá. Se ignora, no es un error.
  const existing = await findSubscriptionByProviderReference("google_play", parsed.purchaseToken);
  if (!existing) {
    console.warn("google-rtdn: purchaseToken sin usuario asociado, se ignora", parsed.purchaseToken);
    json(res, 200, { ok: true, skipped: "unlinked-purchase-token" }, req);
    return;
  }

  const event = toNormalizedEvent(parsed, existing.userId);
  if (!event) {
    json(res, 200, { ok: true, skipped: "notification-type-not-handled" }, req);
    return;
  }

  await recordProviderEvent(event);
  json(res, 200, { ok: true }, req);
}

/**
 * Crea una Checkout Session de Stripe vía su REST API (sin el SDK `stripe`,
 * ver ADR-0003) y devuelve la URL a la que redirigir al usuario.
 */
async function createStripeCheckoutSession(params: {
  priceId: string;
  userId: string;
  planId: string;
  customerEmail?: string;
}): Promise<{ url: string } | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;

  const webAppUrl = (process.env.WEB_APP_URL ?? "https://app-compara-farma-web.vercel.app").trim();
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", params.priceId);
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${webAppUrl}/cuenta?checkout=success`);
  body.set("cancel_url", `${webAppUrl}/cuenta?checkout=cancelled`);
  body.set("client_reference_id", params.userId);
  body.set("metadata[planId]", params.planId);
  if (params.customerEmail) body.set("customer_email", params.customerEmail);

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!response.ok) {
      console.warn("Stripe checkout session creation failed", response.status, await response.text());
      return null;
    }
    const data = (await response.json()) as { url?: string };
    return data.url ? { url: data.url } : null;
  } catch (err) {
    console.warn("createStripeCheckoutSession threw", err);
    return null;
  }
}

/** Requiere sesión (Bearer) — Subscription Platform Fase 2 (RFC-004, CF-119). */
async function handleCreateCheckoutSession(req: RequestLike, res: ResponseLike): Promise<void> {
  const userId = await resolveUserId(req);
  if (!userId) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    json(res, 503, { error: "Stripe no está configurado todavía." }, req);
    return;
  }

  const body = await parseBody(req);
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!planId) {
    json(res, 400, { error: "Falta planId." }, req);
    return;
  }

  const plan = await findPlan(planId);
  if (!plan || !plan.isAvailable || !plan.stripePriceId) {
    json(res, 400, { error: "Ese plan no está disponible para compra." }, req);
    return;
  }

  const session = await createStripeCheckoutSession({
    priceId: plan.stripePriceId,
    userId,
    planId: plan.id,
  });
  if (!session) {
    json(res, 502, { error: "No se pudo iniciar el pago con Stripe." }, req);
    return;
  }

  json(res, 200, { url: session.url }, req);
}

/**
 * Webhook de Stripe — autenticado por firma (`Stripe-Signature` +
 * `STRIPE_WEBHOOK_SECRET`), sin fallback abierto si el secreto no está
 * configurado (hay dinero real de por medio, mismo criterio que
 * GOOGLE_RTDN_SECRET/CRON_SECRET).
 */
async function handleStripeWebhook(req: RequestLike, res: ResponseLike): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = getHeader(req, "stripe-signature");
  const parsed = parseStripeWebhookPayload(rawBody, signatureHeader, secret);
  if (!parsed) {
    json(res, 400, { error: "Firma inválida o payload malformado." }, req);
    return;
  }

  if (parsed.kind === "ignored") {
    json(res, 200, { ok: true, skipped: "event-type-not-handled" }, req);
    return;
  }

  if (parsed.kind === "checkout_completed") {
    await recordProviderEvent({
      provider: "stripe",
      providerReference: parsed.providerReference,
      type: "purchase",
      userId: parsed.userId,
      planId: parsed.planId,
      periodEnd: null,
      rawPayload: parsed,
    });
    json(res, 200, { ok: true }, req);
    return;
  }

  // subscription_renewed / subscription_canceled: la suscripción ya debe
  // existir (creada por checkout_completed) — si no, se ignora, no hay
  // usuario/plan a quién asociar el evento (mismo criterio que R-02 de
  // Google Play en Fase 1, pero acá es un caso borde, no la regla general).
  const existing = await findSubscriptionByProviderReference("stripe", parsed.providerReference);
  if (!existing) {
    json(res, 200, { ok: true, skipped: "unlinked-stripe-subscription" }, req);
    return;
  }

  await recordProviderEvent({
    provider: "stripe",
    providerReference: parsed.providerReference,
    type: parsed.kind === "subscription_renewed" ? "renewal" : "cancellation",
    userId: existing.userId,
    planId: existing.planId,
    periodEnd: parsed.kind === "subscription_renewed" ? parsed.periodEnd : null,
    rawPayload: parsed,
  });
  json(res, 200, { ok: true }, req);
}

/** Llamado server-to-server desde web/ (profilesAdmin.ts, ver CF-116) — autenticado con API_SECRET_KEY. */
async function handleGrantManual(req: RequestLike, res: ResponseLike): Promise<void> {
  if (!isAuthorized(req)) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }
  const body = await parseBody(req);
  const userId = typeof body.userId === "string" ? body.userId : "";
  const planId = typeof body.planId === "string" ? body.planId : "cortesia";
  const expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : undefined;
  if (!userId) {
    json(res, 400, { error: "Falta userId." }, req);
    return;
  }

  await grantManual(userId, planId, expiresAt);
  json(res, 200, { ok: true }, req);
}

async function handleRevokeManual(req: RequestLike, res: ResponseLike): Promise<void> {
  if (!isAuthorized(req)) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }
  const body = await parseBody(req);
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    json(res, 400, { error: "Falta userId." }, req);
    return;
  }

  await revokeManual(userId);
  json(res, 200, { ok: true }, req);
}

export async function handleSubscriptionsRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const method = (req.method ?? "GET").toUpperCase();
  const action = getSearchParam(req, "action");

  if (method === "GET" && action === "me") {
    await handleMe(req, res);
    return;
  }

  if (method === "GET" && action === "plans") {
    await handlePlans(req, res);
    return;
  }

  if (method === "POST") {
    if (action === "verify-purchase") {
      await handleVerifyPurchase(req, res);
      return;
    }
    if (action === "google-rtdn") {
      await handleGoogleRtdn(req, res);
      return;
    }
    if (action === "create-checkout-session") {
      await handleCreateCheckoutSession(req, res);
      return;
    }
    if (action === "stripe-webhook") {
      await handleStripeWebhook(req, res);
      return;
    }
    if (action === "grant-manual") {
      await handleGrantManual(req, res);
      return;
    }
    if (action === "revoke-manual") {
      await handleRevokeManual(req, res);
      return;
    }
  }

  json(res, 400, { error: "Acción inválida." }, req);
}
