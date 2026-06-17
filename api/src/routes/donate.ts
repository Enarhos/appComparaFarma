import { createKhipuPayment } from "../clients/khipu.js";
import { HttpError } from "../lib/errors.js";
import { json, type RequestLike, type ResponseLike } from "../lib/http.js";

export async function handleDonateRoute(reqLike: unknown, resLike: unknown): Promise<void> {
  const req = reqLike as RequestLike & { body?: { amount?: unknown } };
  const res = resLike as ResponseLike;

  res.setHeader("Access-Control-Allow-Origin", "*");
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

    const VALID_AMOUNTS = [1000, 3000, 5000];
    if (!VALID_AMOUNTS.includes(amount)) {
      throw new HttpError("Monto no permitido.", 400);
    }

    const paymentUrl = await createKhipuPayment(amount);
    json(res, 200, { payment_url: paymentUrl });
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, { error: error.message });
      return;
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Donate route error:", msg);
    json(res, 500, { error: "No se pudo crear el pago.", detail: msg, v: "v2-urlsearchparams" });
  }
}
