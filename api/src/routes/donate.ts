import { randomUUID } from "node:crypto";
import { createKhipuPaymentV3 } from "../clients/khipu.js";
import { consumeRateLimit } from "../middleware/rateLimit.js";
import { HttpError } from "../lib/errors.js";
import { captureException } from "../lib/sentry.js";
import { applyCorsHeaders, getClientIp, json, type RequestLike, type ResponseLike } from "../lib/http.js";

const VALID_AMOUNTS = [1000, 3000, 5000];

// Mismo criterio que WEB_APP_URL en subscriptions.ts (flow-register-return):
// URL pública de web/, nunca aceptada desde el cliente (evita open redirect).
function getWebAppUrl(): string {
  return (process.env.WEB_APP_URL ?? "https://app-compara-farma-web.vercel.app").trim().replace(/\/$/, "");
}

export async function handleDonateRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike & { body?: { amount?: unknown } };
  const res = resLike as ResponseLike;

  applyCorsHeaders(res, req);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if ((req.method ?? "").toUpperCase() === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if ((req.method ?? "").toUpperCase() !== "POST") {
      throw new HttpError("Metodo no permitido.", 405);
    }

    // Rate limiting (Sprint FEAT-WEB-DONATIONS): /api/donate ahora tiene un
    // caller público real (el CTA de Web), así que se protege con el mismo
    // consumeRateLimit() por IP que ya usan /api/search y /api/price-history
    // — no es infraestructura nueva, es la misma reutilizada.
    const clientIp = getClientIp(req);
    if (!(await consumeRateLimit(clientIp))) {
      throw new HttpError("Demasiadas solicitudes. Intenta de nuevo en un momento.", 429);
    }

    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0 || !Number.isInteger(amount)) {
      throw new HttpError("Monto invalido.", 400);
    }

    if (!VALID_AMOUNTS.includes(amount)) {
      throw new HttpError("Monto no permitido.", 400);
    }

    // transaction_id técnico, sin PII (no lleva email/nombre/identificador del
    // donante) — solo sirve para conciliar este pago con Khipu.
    const transactionId = randomUUID();

    // return_url/cancel_url: Khipu 3.0 los soporta (documentación oficial
    // confirmada). Ahora que existen /apoyar/retorno y /apoyar/cancelado en
    // Web (Sprint FEAT-WEB-DONATIONS), se conectan aquí — cambio mínimo
    // porque createKhipuPaymentV3() ya aceptaba ambos parámetros desde la
    // migración a API 3.0; no se tocó api/src/clients/khipu.ts para esto.
    // notify_url/notify_api_version se siguen omitiendo a propósito: el
    // webhook queda fuera de alcance (KHIPU_WEBHOOK: PENDING).
    const webAppUrl = getWebAppUrl();
    const { paymentUrl } = await createKhipuPaymentV3({
      amount,
      subject: "Aporte a ComparaFarma",
      transactionId,
      returnUrl: `${webAppUrl}/apoyar/retorno`,
      cancelUrl: `${webAppUrl}/apoyar/cancelado`,
    });

    json(res, 200, { payment_url: paymentUrl }, req);
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, { error: error.message }, req);
      return;
    }
    console.error("Donate route error:", error instanceof Error ? error.message : "unknown error");
    captureException(error, { route: "/api/donate" });
    json(res, 500, { error: "No se pudo crear el pago." }, req);
  }
}
