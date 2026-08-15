import { randomUUID } from "node:crypto";
import { createKhipuPaymentV3 } from "../clients/khipu.js";
import { HttpError } from "../lib/errors.js";
import { captureException } from "../lib/sentry.js";
import { applyCorsHeaders, json, type RequestLike, type ResponseLike } from "../lib/http.js";

const VALID_AMOUNTS = [1000, 3000, 5000];

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
    // confirmada), pero no son obligatorios para crear el pago. Se omiten en
    // este sprint porque todavía no existe ninguna página en Web a la que
    // apuntar — ver deuda pendiente en PLATFORM_SERVICE_REVIEW_KHIPU.md.
    // notify_url/notify_api_version también se omiten deliberadamente: el
    // webhook queda fuera de alcance de este PR (KHIPU_WEBHOOK: PENDING).
    const { paymentUrl } = await createKhipuPaymentV3({
      amount,
      subject: "Aporte a ComparaFarma",
      transactionId,
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
