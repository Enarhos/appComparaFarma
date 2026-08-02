import { getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { isAuthorized } from "../middleware/auth.js";
import { supabase } from "../lib/supabaseClient.js";
import { getEntitlement, recordProviderEvent, grantManual, revokeManual } from "../services/subscriptionService.js";
import { findSubscriptionByProviderReference } from "../lib/subscriptionsDb.js";
import { parseGooglePlayNotification, toNormalizedEvent, type GooglePlayRtdnEnvelope } from "../lib/adapters/googlePlayAdapter.js";

// Subscription Platform — Fase 1 (RFC-003, CF-115).
// docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md
//
// Endpoint consolidado (1 sola función serverless, api/api/subscriptions.ts)
// que despacha por método + query param `action`, mismo patrón que
// routes/alerts.ts, para no acercarnos al límite de 12 funciones del plan
// Hobby de Vercel (hoy 9 + esta = 10).

async function parseBody(req: RequestLike): Promise<Record<string, unknown>> {
  const raw = (req as Record<string, unknown>).body;
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const text = Buffer.concat(chunks).toString();
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

  if (method === "POST") {
    if (action === "verify-purchase") {
      await handleVerifyPurchase(req, res);
      return;
    }
    if (action === "google-rtdn") {
      await handleGoogleRtdn(req, res);
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
