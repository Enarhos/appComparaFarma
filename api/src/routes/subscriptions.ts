import { getHeader, getSearchParam, json, redirect, type RequestLike, type ResponseLike } from "../lib/http.js";
import { isAuthorized } from "../middleware/auth.js";
import { supabase } from "../lib/supabaseClient.js";
import { getEntitlement, recordProviderEvent, grantManual, revokeManual } from "../services/subscriptionService.js";
import {
  findAvailablePlans,
  findPlan,
  findSubscriptionByProviderReference,
  findFlowCustomer,
  findFlowCustomerByFlowCustomerId,
  upsertFlowCustomer,
} from "../lib/subscriptionsDb.js";
import { parseGooglePlayNotification, toNormalizedEvent, type GooglePlayRtdnEnvelope } from "../lib/adapters/googlePlayAdapter.js";
import {
  getFlowConfig,
  callFlow,
  resolveFlowWebhookToken,
  getInvoicePeriodEnd,
  type FlowConfig,
} from "../lib/adapters/flowAdapter.js";

// Subscription Platform — Fase 1 (RFC-003, CF-115) + Fase 2 corregida
// (RFC-005, ADR-0004, CF-124 — reemplaza a RFC-004/Stripe, ver ambos
// documentos marcados Superseded).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
// docs/engineering/rfc/RFC-005_WEB_BILLING_FLOW.md
//
// Endpoint consolidado (1 sola función serverless, api/api/subscriptions.ts)
// que despacha por método + query param `action`, mismo patrón que
// routes/alerts.ts, para no acercarnos al límite de 12 funciones del plan
// Hobby de Vercel.
//
// `export const config = { api: { bodyParser: false } }` en
// api/api/subscriptions.ts preserva el body crudo — necesario para que
// `flow-register-return`/`flow-webhook` puedan parsear el body
// `application/x-www-form-urlencoded` que manda Flow (nunca JSON, ver
// parseFormBody() más abajo). Todas las acciones leen el body vía
// readRawBody()/parseBody()/parseFormBody(), que ya hacían una lectura
// manual del stream como respaldo — este cambio no altera su comportamiento.

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

/**
 * Flow (Fase 2 corregida, CF-124) manda `application/x-www-form-urlencoded`
 * en sus callbacks (`flow-register-return`/`flow-webhook`) — nunca JSON, a
 * diferencia del resto de las acciones de este endpoint. `parseBody` no
 * sirve ahí (rompería con `JSON.parse` sobre un body que no es JSON).
 */
async function parseFormBody(req: RequestLike): Promise<Record<string, string>> {
  const text = await readRawBody(req);
  if (!text) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(text)) result[key] = value;
  return result;
}

/** Resuelve el usuario (id + email) a partir del access token de Supabase (Authorization: Bearer <jwt>). */
async function resolveUser(req: RequestLike): Promise<{ id: string; email: string | null } | null> {
  const authHeader = getHeader(req, "authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch (err) {
    console.warn("resolveUser threw", err);
    return null;
  }
}

async function resolveUserId(req: RequestLike): Promise<string | null> {
  const user = await resolveUser(req);
  return user?.id ?? null;
}

function getWebAppUrl(): string {
  return (process.env.WEB_APP_URL ?? "https://www.preciosfarma.cl").trim();
}

/** URL pública de esta misma API — necesaria para armar el `url_return` que le pasamos a Flow (CF-124). */
function getApiPublicUrl(): string {
  return (process.env.API_PUBLIC_URL ?? "https://comparafarma-api.vercel.app").trim();
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
 * Crea la suscripción en Flow (`/subscription/create`) y registra la compra
 * en el motor. Devuelve `false` sin lanzar si Flow no responde `subscriptionId`
 * — CF-124.
 */
async function createFlowSubscriptionAndRecordEvent(
  flowConfig: FlowConfig,
  flowCustomerId: string,
  userId: string,
  planId: string
): Promise<boolean> {
  const { status, body } = await callFlow(flowConfig, "POST", "/subscription/create", {
    planId,
    customerId: flowCustomerId,
  });
  const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId : null;
  if (status !== 200 || !subscriptionId) {
    console.warn("createFlowSubscriptionAndRecordEvent: /subscription/create failed", status, body);
    return false;
  }

  await recordProviderEvent({
    provider: "flow",
    providerReference: subscriptionId,
    type: "purchase",
    userId,
    planId,
    // El propio /subscription/create devuelve period_end (verificado en
    // sandbox) — no hace falta una llamada aparte a getInvoicePeriodEnd
    // para el alta, solo para renovaciones (ver handleFlowWebhook).
    periodEnd: typeof body?.period_end === "string" ? body.period_end : null,
    rawPayload: body,
  });
  return true;
}

/**
 * Inicia el flujo de alta con Flow (RFC-005 §3.4, CF-124). Requiere sesión.
 * Si el usuario ya tiene tarjeta activa (`flow_customers.register_status
 * === "active"`), se salta el enrolamiento y crea la suscripción directo —
 * no tiene sentido hacer redirigir de nuevo a Flow a alguien que ya enroló
 * su tarjeta antes (ej. está tomando un segundo plan, o se resuscribe).
 */
async function handleStartFlowSubscription(req: RequestLike, res: ResponseLike): Promise<void> {
  const user = await resolveUser(req);
  if (!user) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const flowConfig = getFlowConfig();
  if (!flowConfig) {
    json(res, 503, { error: "Flow no está configurado todavía." }, req);
    return;
  }

  const body = await parseBody(req);
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!planId) {
    json(res, 400, { error: "Falta planId." }, req);
    return;
  }

  const plan = await findPlan(planId);
  if (!plan || !plan.isAvailable) {
    json(res, 400, { error: "Ese plan no está disponible para compra." }, req);
    return;
  }

  let flowCustomer = await findFlowCustomer(user.id);

  if (flowCustomer?.registerStatus === "active") {
    const created = await createFlowSubscriptionAndRecordEvent(flowConfig, flowCustomer.flowCustomerId, user.id, plan.id);
    json(res, created ? 200 : 502, created ? { redirectUrl: `${getWebAppUrl()}/cuenta?upgrade=success` } : { error: "No se pudo iniciar el pago con Flow." }, req);
    return;
  }

  if (!flowCustomer) {
    const { status, body: createBody } = await callFlow(flowConfig, "POST", "/customer/create", {
      name: user.email ? user.email.split("@")[0] : "Cliente ComparaFarma",
      email: user.email ?? `${user.id}@comparafarma.cl`,
      externalId: user.id,
    });
    const flowCustomerId = typeof createBody?.customerId === "string" ? createBody.customerId : null;
    if (status !== 200 || !flowCustomerId) {
      json(res, 502, { error: "No se pudo iniciar el pago con Flow." }, req);
      return;
    }
    flowCustomer = await upsertFlowCustomer({ userId: user.id, flowCustomerId, registerStatus: "pending" });
    if (!flowCustomer) {
      json(res, 502, { error: "No se pudo iniciar el pago con Flow." }, req);
      return;
    }
  }

  const returnUrl = `${getApiPublicUrl()}/api/subscriptions?action=flow-register-return&planId=${encodeURIComponent(plan.id)}`;
  const { status, body: registerBody } = await callFlow(flowConfig, "POST", "/customer/register", {
    customerId: flowCustomer.flowCustomerId,
    url_return: returnUrl,
  });
  const registerUrl = typeof registerBody?.url === "string" ? registerBody.url : null;
  const token = typeof registerBody?.token === "string" ? registerBody.token : null;
  if (status !== 200 || !registerUrl || !token) {
    json(res, 502, { error: "No se pudo iniciar el pago con Flow." }, req);
    return;
  }

  json(res, 200, { redirectUrl: `${registerUrl}?token=${token}` }, req);
}

/**
 * Recibe el POST que el navegador del cliente hace a `url_return` tras
 * enrolar la tarjeta en Flow (RFC-005 §3.4, CF-124). Público — no hay
 * sesión ni firma entrante; la autenticidad se resuelve consultando
 * `/customer/getRegisterStatus` con nuestro propio `secretKey`, y el
 * `userId` real se obtiene de nuestra propia tabla `flow_customers` (nunca
 * de un parámetro que venga del cliente). Siempre termina en un redirect a
 * `web/` — nunca responde JSON, es el navegador del cliente quien recibe
 * esta respuesta directamente.
 */
async function handleFlowRegisterReturn(req: RequestLike, res: ResponseLike): Promise<void> {
  const webAppUrl = getWebAppUrl();
  const flowConfig = getFlowConfig();
  if (!flowConfig) {
    redirect(res, `${webAppUrl}/cuenta?upgrade=error`);
    return;
  }

  const form = await parseFormBody(req);
  const token = form.token ?? "";
  if (!token) {
    redirect(res, `${webAppUrl}/cuenta?upgrade=error`);
    return;
  }

  const { status, body } = await callFlow(flowConfig, "GET", "/customer/getRegisterStatus", { token });
  const flowCustomerId = typeof body?.customerId === "string" ? body.customerId : null;
  // Verificado en sandbox: el status de un registro activo viene como
  // string "1", no number 1.
  const registered = status === 200 && body?.status === "1" && !!flowCustomerId;
  if (!registered || !flowCustomerId) {
    redirect(res, `${webAppUrl}/cuenta?upgrade=error`);
    return;
  }

  const flowCustomer = await findFlowCustomerByFlowCustomerId(flowCustomerId);
  if (!flowCustomer) {
    // No debería pasar nunca — el customerId lo creamos nosotros en
    // handleStartFlowSubscription. Si pasa, no hay a quién asociar la tarjeta.
    console.warn("handleFlowRegisterReturn: flowCustomerId sin fila en flow_customers", flowCustomerId);
    redirect(res, `${webAppUrl}/cuenta?upgrade=error`);
    return;
  }

  await upsertFlowCustomer({
    userId: flowCustomer.userId,
    flowCustomerId,
    registerStatus: "active",
    cardBrand: typeof body?.creditCardType === "string" ? body.creditCardType : null,
    cardLast4: typeof body?.last4CardDigits === "string" ? body.last4CardDigits : null,
  });

  const planId = getSearchParam(req, "planId") ?? "";
  if (!planId) {
    // Caso borde: tarjeta enrolada sin un plan pendiente asociado (no
    // debería ocurrir en el flujo normal, ver handleStartFlowSubscription).
    redirect(res, `${webAppUrl}/cuenta?upgrade=success`);
    return;
  }

  const plan = await findPlan(planId);
  if (!plan || !plan.isAvailable) {
    redirect(res, `${webAppUrl}/cuenta?upgrade=error`);
    return;
  }

  const created = await createFlowSubscriptionAndRecordEvent(flowConfig, flowCustomerId, flowCustomer.userId, plan.id);
  redirect(res, `${webAppUrl}/cuenta?upgrade=${created ? "success" : "error"}`);
}

/**
 * Webhook de cobros periódicos de Flow (RFC-005 §3.4, ADR-0004, CF-124).
 * Flow manda solo `token` en el body — nunca el resultado del pago — así
 * que la autenticidad se resuelve indirectamente vía `resolveFlowWebhookToken`
 * (llamado firmado con nuestro secretKey). Siempre responde 200 (Flow espera
 * respuesta en menos de 15s y no distingue error nuestro de rechazo) —
 * incluso ante una excepción interna, nunca se cuelga ni devuelve otro código.
 */
async function handleFlowWebhook(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    const flowConfig = getFlowConfig();
    if (!flowConfig) {
      json(res, 200, { ok: true, skipped: "flow-not-configured" }, req);
      return;
    }

    const form = await parseFormBody(req);
    const token = form.token ?? "";
    if (!token) {
      json(res, 200, { ok: true, skipped: "no-token" }, req);
      return;
    }

    const resolved = await resolveFlowWebhookToken(flowConfig, token);
    if (resolved.kind === "ignored") {
      json(res, 200, { ok: true, skipped: "not-a-subscription-invoice" }, req);
      return;
    }
    if (resolved.kind === "invoice_unpaid") {
      // Mismo criterio que invoice.payment_failed en RFC-004 (Stripe): se
      // ignora explícitamente, Flow reintenta según charges_retries_number
      // del plan — no es un bug, es un límite conocido de esta fase (RFC-005 R-03).
      json(res, 200, { ok: true, skipped: "invoice-unpaid-no-action" }, req);
      return;
    }

    const existing = await findSubscriptionByProviderReference("flow", resolved.flowSubscriptionId);
    if (!existing) {
      json(res, 200, { ok: true, skipped: "unlinked-flow-subscription" }, req);
      return;
    }

    const periodEnd = await getInvoicePeriodEnd(flowConfig, resolved.invoiceId);
    await recordProviderEvent({
      provider: "flow",
      providerReference: resolved.flowSubscriptionId,
      type: "renewal",
      userId: existing.userId,
      planId: existing.planId,
      periodEnd,
      rawPayload: resolved.rawPayload,
    });
    json(res, 200, { ok: true }, req);
  } catch (err) {
    console.warn("handleFlowWebhook threw", err);
    json(res, 200, { ok: true, skipped: "internal-error" }, req);
  }
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
    if (action === "start-flow-subscription") {
      await handleStartFlowSubscription(req, res);
      return;
    }
    if (action === "flow-register-return") {
      await handleFlowRegisterReturn(req, res);
      return;
    }
    if (action === "flow-webhook") {
      await handleFlowWebhook(req, res);
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
