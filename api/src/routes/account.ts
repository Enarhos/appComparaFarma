import { getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { supabase } from "../lib/supabaseClient.js";
import { isDeletionPending } from "../lib/accountDeletionDb.js";
import { reauthenticateWithPassword, decodeJwtIssuedAt } from "../lib/reauth.js";
import { deleteAccount } from "../services/accountDeletionService.js";

// AUTH-DELETE-01 (Backend) — GATE_3_AUTH_DELETE_01_REPORT.md (informe de
// diseño + gates, revisión CTO). Endpoint consolidado (1 sola función
// serverless, api/api/account.ts) que despacha por método + query param
// `action`, mismo patrón que routes/alerts.ts/routes/subscriptions.ts, para
// no acercarnos al límite de 12 funciones del plan Hobby de Vercel (hoy 10 +
// esta = 11).
//
// Solo existe `action=delete` por ahora — el patrón de dispatch queda listo
// para una futura `action=export` (portabilidad de datos) sin necesitar una
// función serverless nueva.

interface DeleteAccountBody {
  password?: string;
}

async function parseBody(req: RequestLike): Promise<DeleteAccountBody> {
  const raw = (req as Record<string, unknown>).body;
  if (raw && typeof raw === "object") return raw as DeleteAccountBody;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const text = Buffer.concat(chunks).toString();
  if (!text) return {};
  return JSON.parse(text) as DeleteAccountBody;
}

interface AuthenticatedUser {
  id: string;
  email: string | null;
  provider: string | null;
  token: string;
}

/**
 * Resuelve la identidad real desde el JWT validado por Supabase (nunca
 * desde un userId/email enviado por el cliente — sección 5, regla
 * obligatoria). Devuelve `null` también si la cuenta ya está
 * DELETION_PENDING (sección 4: una cuenta pendiente no puede operar
 * normalmente, y "iniciar el borrado de nuevo" cuenta como operar).
 */
async function resolveUser(req: RequestLike): Promise<AuthenticatedUser | null> {
  const authHeader = getHeader(req, "authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    if (await isDeletionPending(data.user.id)) return null;
    const provider = typeof data.user.app_metadata?.provider === "string" ? data.user.app_metadata.provider : null;
    return { id: data.user.id, email: data.user.email ?? null, provider, token };
  } catch (err) {
    console.warn("account.resolveUser threw", err);
    return null;
  }
}

const OAUTH_REAUTH_MAX_AGE_SECONDS = 15 * 60; // 15 minutos — sección 6, "sesión reciente".

/**
 * Reautenticación (sección 6). Cuentas email/password: exigen la
 * contraseña actual, verificada con una única llamada a
 * `signInWithPassword` (nunca se registra ni se persiste). Cuentas OAuth
 * (hoy: Google, exclusivo de `/admin`): exigen que el JWT sea reciente —
 * no existe todavía un challenge de re-login OAuth en este backend, así que
 * la interfaz queda lista (branch explícito) sin bloquear el camino
 * email/password, que es el que usa el 100% de las cuentas de consumidor
 * hoy (ver PLATFORM_SERVICE_REVIEW_SUPABASE / E2E auth test 2026-08-21).
 */
async function verifyReauthentication(
  user: AuthenticatedUser,
  body: DeleteAccountBody
): Promise<{ ok: true } | { ok: false; statusCode: number; error: string }> {
  if (user.provider === "email" || user.provider === null) {
    if (!user.email) return { ok: false, statusCode: 400, error: "La cuenta no tiene un email asociado." };
    if (!body.password) return { ok: false, statusCode: 400, error: "Falta la contraseña para reautenticar." };

    const result = await reauthenticateWithPassword(user.email, body.password);
    if (result === "not_configured") {
      return { ok: false, statusCode: 503, error: "Reautenticación no disponible temporalmente." };
    }
    if (result === "invalid_credentials") {
      return { ok: false, statusCode: 401, error: "No se pudo verificar la contraseña." };
    }
    return { ok: true };
  }

  // Rama OAuth (ver comentario arriba) — sesión reciente por iat del JWT.
  const issuedAt = decodeJwtIssuedAt(user.token);
  if (issuedAt === null) {
    return { ok: false, statusCode: 401, error: "No se pudo validar la vigencia de la sesión." };
  }
  const ageSeconds = Date.now() / 1000 - issuedAt;
  if (ageSeconds > OAUTH_REAUTH_MAX_AGE_SECONDS) {
    return { ok: false, statusCode: 401, error: "Tu sesión no es reciente. Vuelve a iniciar sesión e intenta de nuevo." };
  }
  return { ok: true };
}

async function handleDelete(req: RequestLike, res: ResponseLike): Promise<void> {
  const user = await resolveUser(req);
  if (!user) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const body = await parseBody(req);
  const reauth = await verifyReauthentication(user, body);
  if (!reauth.ok) {
    json(res, reauth.statusCode, { error: reauth.error }, req);
    return;
  }

  const outcome = await deleteAccount(user.id, user.email ?? `${user.id}@preciosfarma.cl`);

  switch (outcome.status) {
    case "deleted":
      json(res, 200, { ok: true }, req);
      return;
    case "blocked_active_subscription":
      json(
        res,
        409,
        {
          error: "Tienes una suscripción activa que debe cancelarse antes de eliminar tu cuenta.",
          code: "active_subscription_requires_cancellation",
          provider: outcome.provider,
        },
        req
      );
      return;
    case "cleanup_failed_retryable":
    case "auth_deletion_failed_retryable":
      // Sin exponer el detalle interno del error (sección 11: nunca loguear/
      // devolver payloads/tokens) — solo un código estable que un cliente o
      // soporte puedan usar para reintentar más adelante.
      json(res, 500, { error: "No se pudo completar la eliminación. Intenta de nuevo más tarde.", code: outcome.status }, req);
      return;
  }
}

export async function handleAccountRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const method = (req.method ?? "GET").toUpperCase();
  const action = getSearchParam(req, "action");

  if (method === "POST" && action === "delete") {
    await handleDelete(req, res);
    return;
  }

  json(res, 400, { error: "Acción inválida." }, req);
}
