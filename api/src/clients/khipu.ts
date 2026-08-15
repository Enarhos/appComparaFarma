import { createHmac } from "node:crypto";

// ============================================================================
// Khipu Instant Payments API 3.0 (Sprint SEC-KHIPU-V3)
// ============================================================================
// Migración desde la API 2.0 (firma HMAC + KHIPU_RECEIVER_ID/KHIPU_SECRET) a la
// API 3.0 (autenticación por API Key vía header `x-api-key`, sin firma HMAC en
// la petición de creación de pago). Contrato verificado directamente contra la
// documentación oficial de Khipu (docs.khipu.com/payment-solutions/instant-payments/*,
// no la de Open Finance, que es un producto distinto):
//   - Auth: header `x-api-key`, sin Basic Auth ni HMAC (docs.khipu.com/.../payment-auth)
//   - Host: payment-api.khipu.com (distinto del dominio khipu.com usado en v2)
//   - POST /v3/payments — crear pago (docs.khipu.com/apis/v3/instant-payments/openapi/other/postpayment)
//   - GET /v3/payments/{id} — consultar estado (.../other/getpaymentbyid)
// `KHIPU_RECEIVER_ID` no es necesario en el body de creación de pago en API 3.0
// (solo existe `collect_account_uuid`, opcional, para cuentas de cobro con más
// de una cuenta bancaria asociada — no es el caso de ComparaFarma). El receiver
// id solo aparece como campo de LECTURA en la respuesta de GET /payments/{id}.
const API_V3_BASE = "https://payment-api.khipu.com/v3";

export interface KhipuPaymentParams {
  /** Monto del cobro. Sin separador de miles, '.' como separador decimal. */
  amount: number;
  /** Motivo mostrado al pagador. */
  subject: string;
  /** Identificador técnico propio de la transacción — nunca debe contener PII. */
  transactionId: string;
  /** Opcional: a dónde redirigir mientras se verifica el pago. */
  returnUrl?: string;
  /** Opcional: a dónde redirigir si el pagador desiste. */
  cancelUrl?: string;
}

export interface KhipuPaymentResult {
  paymentId: string;
  paymentUrl: string;
}

export type KhipuPaymentStatus = "pending" | "verifying" | "done";

export interface KhipuPaymentDetails {
  paymentId: string;
  status: KhipuPaymentStatus;
  statusDetail: string;
  amount: string;
  currency: string;
  transactionId: string;
}

function getKhipuApiKey(): string {
  const apiKey = process.env.KHIPU_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error("Khipu API key not configured");
  }
  return apiKey;
}

/**
 * Crea un pago usando Khipu Instant Payments API 3.0.
 *
 * Nunca incluir la API key ni el cuerpo de la respuesta de error de Khipu en el
 * mensaje de la excepción lanzada — solo el status HTTP. Esto evita que la
 * clave, o cualquier detalle que Khipu decida incluir en un error, termine en
 * logs, Sentry, o en la respuesta JSON de /api/donate.
 */
export async function createKhipuPaymentV3(params: KhipuPaymentParams): Promise<KhipuPaymentResult> {
  const apiKey = getKhipuApiKey();

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: "CLP",
    subject: params.subject,
    transaction_id: params.transactionId,
  };
  if (params.returnUrl) body.return_url = params.returnUrl;
  if (params.cancelUrl) body.cancel_url = params.cancelUrl;

  let res: Response;
  try {
    res = await fetch(`${API_V3_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con Khipu");
  }

  if (!res.ok) {
    throw new Error(`Khipu API 3.0 respondio ${res.status}`);
  }

  let data: { payment_id?: string; payment_url?: string };
  try {
    data = (await res.json()) as { payment_id?: string; payment_url?: string };
  } catch {
    throw new Error("Khipu devolvio una respuesta invalida");
  }

  if (!data.payment_id || !data.payment_url) {
    throw new Error("Khipu no retorno payment_id/payment_url");
  }

  return { paymentId: data.payment_id, paymentUrl: data.payment_url };
}

/**
 * Consulta el estado actual de un pago (GET /v3/payments/{id}).
 * Server-side únicamente — no se expone como endpoint público en este sprint
 * (sin necesidad técnica todavía; nada en Web/Mobile lo consume hoy).
 */
export async function getKhipuPayment(paymentId: string): Promise<KhipuPaymentDetails> {
  const apiKey = getKhipuApiKey();

  let res: Response;
  try {
    res = await fetch(`${API_V3_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { "x-api-key": apiKey },
    });
  } catch {
    throw new Error("No se pudo conectar con Khipu");
  }

  if (!res.ok) {
    throw new Error(`Khipu API 3.0 respondio ${res.status} al consultar el pago`);
  }

  let data: {
    payment_id?: string;
    status?: KhipuPaymentStatus;
    status_detail?: string;
    amount?: string;
    currency?: string;
    transaction_id?: string;
  };
  try {
    data = await res.json();
  } catch {
    throw new Error("Khipu devolvio una respuesta invalida al consultar el pago");
  }

  if (!data.payment_id || !data.status) {
    throw new Error("Khipu no retorno el estado del pago");
  }

  return {
    paymentId: data.payment_id,
    status: data.status,
    statusDetail: data.status_detail ?? "",
    amount: data.amount ?? "",
    currency: data.currency ?? "",
    transactionId: data.transaction_id ?? "",
  };
}

// ============================================================================
// LEGACY_ROLLBACK_ONLY — Khipu API 2.0
// ============================================================================
// Implementación anterior (firma HMAC-SHA256, KHIPU_RECEIVER_ID/KHIPU_SECRET,
// https://khipu.com/api/2.0/payments). Se mantiene sin usar únicamente para
// poder revertir /api/donate a este mecanismo con un solo cambio de import si
// la migración a API 3.0 presentara un problema no anticipado. No se llama
// desde ningún punto del código nuevo — el flujo actual usa exclusivamente
// createKhipuPaymentV3(). KHIPU_RECEIVER_ID y KHIPU_SECRET quedan como
// credenciales legacy de solo-rollback: no eliminar de Vercel ni de aquí hasta
// que se confirme que la migración a API 3.0 es estable en producción (acción
// humana separada, no parte de este PR).
export async function createKhipuPaymentLegacyV2(amount: number): Promise<string> {
  const receiverId = process.env.KHIPU_RECEIVER_ID ?? "";
  const secret = process.env.KHIPU_SECRET ?? "";

  if (!receiverId || !secret) {
    throw new Error("Khipu credentials not configured");
  }

  const sortedEntries = Object.entries({
    amount: String(amount),
    currency: "CLP",
    receiver_id: receiverId,
    subject: "Apoyo a ComparaFarma",
  }).sort(([a], [b]) => a.localeCompare(b));

  const sortedBody = new URLSearchParams(sortedEntries).toString();
  const API_V2 = "https://khipu.com/api/2.0/payments";
  const toSign = `POST&${encodeURIComponent(API_V2)}&${encodeURIComponent(sortedBody)}`;
  const hmac = createHmac("sha256", secret).update(toSign).digest("base64");

  const res = await fetch(API_V2, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `${receiverId}:${hmac}`,
    },
    body: sortedBody,
  });

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`Khipu ${res.status}: ${responseText}`);
  }

  const data = JSON.parse(responseText) as { payment_url: string };
  if (!data.payment_url) throw new Error("Khipu no retornó payment_url");
  return data.payment_url;
}
