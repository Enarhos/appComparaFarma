import { getClientIp, getHeader, getSearchParam, json, type RequestLike, type ResponseLike } from "../lib/http.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";
import { sendEmail } from "../lib/email.js";
import {
  createAlert,
  confirmAlert,
  unsubscribeAlert,
  getActiveAlerts,
  markTriggered,
  touchLastChecked,
  type EmailAlert,
} from "../lib/emailAlertsDb.js";
import { searchMedications } from "../services/searchService.js";

// Sprint C — alertas de precio por email en web/, sin cuenta de usuario.
// docs/prompt/claude/PROMPT_CLAUDE_SPRINT_C_ALERTAS_EMAIL.md
//
// Endpoint consolidado (1 sola función serverless, api/api/alerts.ts) que
// despacha por método + query param `action`, para no acercarnos al límite
// de 12 funciones del plan Hobby de Vercel (hoy 8 + esta = 9).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TARGET_PRICE = 10_000_000;

interface CreateAlertBody {
  email?: string;
  matchKey?: string;
  canonicalName?: string;
  targetPrice?: number;
}

async function parseBody(req: RequestLike): Promise<CreateAlertBody> {
  // Vercel auto-parsea bodies JSON — disponible en (req as any).body.
  const raw = (req as Record<string, unknown>).body;
  if (raw && typeof raw === "object") return raw as CreateAlertBody;

  // Fallback: stream parsing (mismo patrón que routes/feedback.ts).
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = req as unknown as NodeJS.ReadableStream;
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  const text = Buffer.concat(chunks).toString();
  if (!text) return {};
  return JSON.parse(text) as CreateAlertBody;
}

function getOrigin(req: RequestLike): string {
  const host = getHeader(req, "x-forwarded-host") ?? getHeader(req, "host") ?? "comparafarma-api.vercel.app";
  return `https://${host}`;
}

function formatCLP(value: number): string {
  return value.toLocaleString("es-CL");
}

function htmlResponse(res: ResponseLike, statusCode: number, title: string, message: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title} — ComparaFarma</title></head>` +
      `<body style="font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1a1a1a">` +
      `<h1>${title}</h1><p>${message}</p></body></html>`
  );
}

async function handleCreate(req: RequestLike, res: ResponseLike): Promise<void> {
  const ip = getClientIp(req);
  if (!(await consumeRateLimit(`alerts:${ip}`, 5, 60 * 60 * 1000))) {
    json(res, 429, { error: "Demasiados intentos. Intenta más tarde." }, req);
    return;
  }

  let body: CreateAlertBody;
  try {
    body = await parseBody(req);
  } catch {
    json(res, 400, { error: "JSON inválido." }, req);
    return;
  }

  const email = body.email?.trim() ?? "";
  const matchKey = body.matchKey?.trim() ?? "";
  const canonicalName = body.canonicalName?.trim() ?? "";
  const targetPrice = Number(body.targetPrice);

  if (!EMAIL_RE.test(email)) {
    json(res, 400, { error: "Debes indicar un email válido." }, req);
    return;
  }
  if (!matchKey || matchKey.length > 200) {
    json(res, 400, { error: "matchKey inválido." }, req);
    return;
  }
  if (!canonicalName || canonicalName.length > 200) {
    json(res, 400, { error: "canonicalName inválido." }, req);
    return;
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0 || targetPrice > MAX_TARGET_PRICE) {
    json(res, 400, { error: "El precio objetivo debe ser un número entre 1 y 10.000.000." }, req);
    return;
  }

  const roundedTarget = Math.round(targetPrice);
  const created = await createAlert({
    email: email.replace(/[\r\n]/g, ""),
    matchKey,
    canonicalName,
    targetPrice: roundedTarget,
  });

  if (!created) {
    json(res, 503, { error: "No pudimos crear la alerta en este momento." }, req);
    return;
  }

  const origin = getOrigin(req);
  const confirmUrl = `${origin}/api/alerts?action=confirm&token=${created.token}`;
  const unsubscribeUrl = `${origin}/api/alerts?action=unsubscribe&token=${created.token}`;

  await sendEmail(
    email,
    `Confirma tu alerta de precio — ${canonicalName}`,
    [
      `Creaste una alerta en ComparaFarma para "${canonicalName}" cuando el precio baje de $${formatCLP(roundedTarget)}.`,
      "",
      `Confirma tu alerta acá: ${confirmUrl}`,
      "",
      `Si no fuiste tú, ignora este email o cancélala acá: ${unsubscribeUrl}`,
    ].join("\n")
  );

  json(res, 200, { ok: true }, req);
}

async function handleConfirm(res: ResponseLike, token: string): Promise<void> {
  const result = await confirmAlert(token);
  if (result === "confirmed") {
    htmlResponse(res, 200, "Alerta confirmada", "Te avisaremos por email si el precio baja de tu objetivo.");
  } else if (result === "not_found") {
    htmlResponse(
      res,
      404,
      "Alerta no encontrada",
      "Este link ya no es válido, o la alerta ya fue confirmada o cancelada antes."
    );
  } else {
    htmlResponse(res, 503, "No disponible", "No pudimos confirmar la alerta en este momento. Intenta de nuevo más tarde.");
  }
}

async function handleUnsubscribe(res: ResponseLike, token: string): Promise<void> {
  const result = await unsubscribeAlert(token);
  if (result === "unsubscribed") {
    htmlResponse(res, 200, "Alerta cancelada", "No recibirás más emails de esta alerta.");
  } else if (result === "not_found") {
    htmlResponse(res, 404, "Alerta no encontrada", "Este link ya no es válido.");
  } else {
    htmlResponse(res, 503, "No disponible", "No pudimos cancelar la alerta en este momento. Intenta de nuevo más tarde.");
  }
}

async function handleCheck(req: RequestLike, res: ResponseLike): Promise<void> {
  const secret = getSearchParam(req, "secret");
  const expected = process.env.CRON_SECRET?.trim();
  // A diferencia de isAuthorized() (API_SECRET_KEY), esta ruta NO tiene
  // fallback abierto si CRON_SECRET está vacío — dispara envío masivo de
  // emails, así que sin secreto configurado queda cerrada para todos.
  if (!expected || secret !== expected) {
    json(res, 401, { error: "No autorizado." }, req);
    return;
  }

  const alerts = await getActiveAlerts();
  if (alerts.length === 0) {
    json(res, 200, { checked: 0, triggered: 0 }, req);
    return;
  }

  // Agrupar por canonicalName para no re-buscar el mismo medicamento dos
  // veces si varias alertas activas apuntan a la misma búsqueda.
  const byQuery = new Map<string, EmailAlert[]>();
  for (const alert of alerts) {
    const bucket = byQuery.get(alert.canonicalName) ?? [];
    bucket.push(alert);
    byQuery.set(alert.canonicalName, bucket);
  }

  const origin = getOrigin(req);
  const checkedIds: number[] = [];
  let triggeredCount = 0;

  for (const [query, group] of byQuery) {
    let results: Awaited<ReturnType<typeof searchMedications>>;
    try {
      results = await searchMedications(query);
    } catch (err) {
      console.warn("alerts check: searchMedications threw", query, err);
      continue;
    }

    for (const alert of group) {
      checkedIds.push(alert.id);
      const match = results.find((r) => r.matchKey === alert.matchKey);
      if (!match || match.bestPrice > alert.targetPrice) continue;

      await markTriggered(alert.id, match.bestPrice);
      await sendEmail(
        alert.email,
        `¡Bajó de precio! ${alert.canonicalName}`,
        [
          `"${alert.canonicalName}" está en $${formatCLP(match.bestPrice)} en ${match.bestPharmacy} — tu objetivo era $${formatCLP(alert.targetPrice)}.`,
          "",
          `Esta alerta ya se cumplió y no se volverá a disparar. Si quieres seguir monitoreando este medicamento, crea una nueva alerta desde ComparaFarma.`,
          "",
          `Cancelar notificaciones futuras: ${origin}/api/alerts?action=unsubscribe&token=${alert.token}`,
        ].join("\n")
      );
      triggeredCount += 1;
    }
  }

  await touchLastChecked(checkedIds);
  json(res, 200, { checked: checkedIds.length, triggered: triggeredCount }, req);
}

export async function handleAlertsRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike;
  const res = resLike as ResponseLike;
  const method = (req.method ?? "GET").toUpperCase();
  const action = getSearchParam(req, "action");

  if (method === "POST" && !action) {
    await handleCreate(req, res);
    return;
  }

  if (method !== "GET") {
    json(res, 405, { error: "Método no permitido." }, req);
    return;
  }

  if (action === "confirm" || action === "unsubscribe") {
    const token = getSearchParam(req, "token");
    if (!token) {
      htmlResponse(res, 400, "Falta el token", "El link no incluye un token válido.");
      return;
    }
    if (action === "confirm") await handleConfirm(res, token);
    else await handleUnsubscribe(res, token);
    return;
  }

  if (action === "check") {
    await handleCheck(req, res);
    return;
  }

  json(res, 400, { error: "Acción inválida." }, req);
}
