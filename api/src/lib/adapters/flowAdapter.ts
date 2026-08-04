import { createHmac } from "node:crypto";

// Subscription Platform — Fase 2 corregida (RFC-005, ADR-0004, CF-123).
// docs/engineering/rfc/RFC-005_WEB_BILLING_FLOW.md
//
// A diferencia de stripeAdapter.ts/googlePlayAdapter.ts (parsing puro, sin
// I/O), este adaptador SÍ hace llamadas HTTP a la API de Flow. Es una
// decisión deliberada: el webhook de Flow nunca trae el resultado del pago
// en el body — manda solo un `token` opaco (verificado empíricamente en
// sandbox, ver ADR-0004) — resolverlo requiere un segundo llamado GET
// firmado. Concentrar firma + llamada + resolución acá evita duplicar la
// lógica de firma en cada acción de routes/subscriptions.ts, que además
// necesita hacer varias llamadas más (customer/create, customer/register,
// subscription/create) para el flujo de alta.
//
// Sin SDK de terceros (ver ADR-0004 "Alternativas consideradas") — `fetch`
// nativo + `node:crypto`, mismo criterio que el resto de `api/`.

export interface FlowConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string; // "https://sandbox.flow.cl/api" | "https://www.flow.cl/api"
}

/** Lee la config de Flow desde variables de entorno. null si falta cualquiera — nunca lanza. */
export function getFlowConfig(): FlowConfig | null {
  const apiKey = process.env.FLOW_API_KEY?.trim();
  const secretKey = process.env.FLOW_SECRET_KEY?.trim();
  const baseUrl = process.env.FLOW_API_BASE_URL?.trim();
  if (!apiKey || !secretKey || !baseUrl) return null;
  return { apiKey, secretKey, baseUrl };
}

/**
 * Firma de parámetros de Flow: ordena las claves alfabéticamente, concatena
 * "clave+valor" sin separador, HMAC-SHA256 con el secretKey, hex digest.
 * Algoritmo documentado públicamente por Flow (developers.flow.cl/en/docs/intro)
 * y verificado contra respuestas reales del sandbox antes de este adaptador.
 */
export function signFlowParams(params: Record<string, string | number>, secretKey: string): string {
  const keys = Object.keys(params).sort();
  const toSign = keys.map((key) => `${key}${params[key]}`).join("");
  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}

export interface FlowResponse {
  status: number;
  body: Record<string, unknown> | null;
}

/**
 * Llama a un recurso de la API de Flow, agregando `apiKey` + firma
 * automáticamente. GET → query string; POST → application/x-www-form-urlencoded
 * (Flow no acepta JSON en ninguno de sus endpoints de suscripciones). Nunca
 * lanza — cualquier error de red o de parseo devuelve status 0/body null.
 */
export async function callFlow(
  config: FlowConfig,
  method: "GET" | "POST",
  path: string,
  params: Record<string, string | number>
): Promise<FlowResponse> {
  try {
    const withKey: Record<string, string | number> = { ...params, apiKey: config.apiKey };
    const signature = signFlowParams(withKey, config.secretKey);
    const signed: Record<string, string> = { s: signature };
    for (const [key, value] of Object.entries(withKey)) signed[key] = String(value);

    let response: Response;
    if (method === "GET") {
      const qs = new URLSearchParams(signed).toString();
      response = await fetch(`${config.baseUrl}${path}?${qs}`, { method: "GET" });
    } else {
      response = await fetch(`${config.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(signed).toString(),
      });
    }

    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: response.status, body };
  } catch (err) {
    console.warn(`callFlow ${method} ${path} threw`, err);
    return { status: 0, body: null };
  }
}

/**
 * Extrae `{ flowSubscriptionId, invoiceId }` del `commerceOrder` que Flow
 * genera para cada invoice de suscripción — formato verificado en sandbox:
 * "{subscriptionId}_{invoiceId}_{fecha}" (ej. "sus_ra2479246f_1183510_2026-08-02 22:02").
 * `subscriptionId` ya trae un `_` propio (prefijo "sus_"), por eso no se
 * puede usar un `split("_")` simple — se ancla al prefijo conocido. `null`
 * si el formato no matchea (ej. no es un commerceOrder de suscripción),
 * nunca lanza.
 */
export function parseSubscriptionCommerceOrder(
  commerceOrder: unknown
): { flowSubscriptionId: string; invoiceId: string } | null {
  if (typeof commerceOrder !== "string") return null;
  const match = commerceOrder.match(/^(sus_[a-z0-9]+)_(\d+)_/);
  if (!match) return null;
  return { flowSubscriptionId: match[1], invoiceId: match[2] };
}

export type ResolvedFlowPayment =
  | { kind: "invoice_paid"; flowSubscriptionId: string; invoiceId: string; amount: number; rawPayload: unknown }
  | { kind: "invoice_unpaid"; flowSubscriptionId: string; invoiceId: string; rawPayload: unknown }
  | { kind: "ignored" };

/**
 * Resuelve el `token` opaco recibido en el `urlCallback` del plan contra
 * `GET /payment/getStatus` (firmado). `status: 2` de Flow = pagada (ver
 * developers.flow.cl/en/docs/tutorial-basics/status). Cualquier token que
 * no resuelva a un pago nuestro válido, o cuyo `commerceOrder` no
 * corresponda a una suscripción, se clasifica `ignored` — nunca lanza.
 */
export async function resolveFlowWebhookToken(config: FlowConfig, token: string): Promise<ResolvedFlowPayment> {
  const { status, body } = await callFlow(config, "GET", "/payment/getStatus", { token });
  if (status !== 200 || !body) return { kind: "ignored" };

  const parsed = parseSubscriptionCommerceOrder(body.commerceOrder);
  if (!parsed) return { kind: "ignored" };

  const paymentStatus = typeof body.status === "number" ? body.status : Number(body.status);
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount) || 0;

  if (paymentStatus === 2) {
    return { kind: "invoice_paid", flowSubscriptionId: parsed.flowSubscriptionId, invoiceId: parsed.invoiceId, amount, rawPayload: body };
  }
  return { kind: "invoice_unpaid", flowSubscriptionId: parsed.flowSubscriptionId, invoiceId: parsed.invoiceId, rawPayload: body };
}

/**
 * Resuelve `period_end` de un invoice vía `GET /invoice/get` — usado para
 * actualizar `subscriptions.current_period_end` en una renovación, ya que
 * Flow no ofrece un endpoint para reobtener la suscripción completa
 * (solo devuelve el objeto completo al crearla). `null` si falla.
 */
export async function getInvoicePeriodEnd(config: FlowConfig, invoiceId: string): Promise<string | null> {
  const { status, body } = await callFlow(config, "GET", "/invoice/get", { invoiceId });
  if (status !== 200 || !body) return null;
  return typeof body.period_end === "string" ? body.period_end : null;
}
