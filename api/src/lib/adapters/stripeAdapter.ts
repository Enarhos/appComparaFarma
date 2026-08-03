import { createHmac, timingSafeEqual } from "node:crypto";

// Subscription Platform — Fase 2 (RFC-004, CF-118).
// docs/engineering/rfc/RFC-004_WEB_BILLING_STRIPE.md
//
// Adaptador de Stripe — parsing puro, nunca toca Supabase (eso es
// responsabilidad de subscriptionService.recordProviderEvent(), llamado
// desde routes/subscriptions.ts). Mismo principio que googlePlayAdapter.ts.
//
// Implementado sin el SDK `stripe` de Node (ver ADR-0003): la verificación
// de firma de webhooks (`Stripe-Signature: t=<timestamp>,v1=<firma>`) es un
// algoritmo público — HMAC-SHA256 sobre "<timestamp>.<rawBody>" comparado
// con el valor que envía Stripe. https://stripe.com/docs/webhooks/signatures

export type ParsedStripeEvent =
  | { kind: "checkout_completed"; providerReference: string; userId: string; planId: string }
  | { kind: "subscription_renewed"; providerReference: string; periodEnd: string | null }
  | { kind: "subscription_canceled"; providerReference: string }
  | { kind: "ignored" };

/** Verifica la firma de un webhook de Stripe. No lanza — cualquier formato inesperado devuelve false. */
export function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts: Record<string, string> = {};
    for (const segment of signatureHeader.split(",")) {
      const [key, value] = segment.split("=");
      if (key && value) parts[key] = value;
    }
    const timestamp = parts.t;
    const providedSignature = parts.v1;
    if (!timestamp || !providedSignature) return false;

    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");

    const expectedBuf = Buffer.from(expected, "hex");
    const providedBuf = Buffer.from(providedSignature, "hex");
    if (expectedBuf.length !== providedBuf.length) return false;
    return timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.warn("verifyStripeSignature threw", err);
    return false;
  }
}

interface StripeEventEnvelope {
  type: string;
  data: { object: Record<string, unknown> };
}

/**
 * Verifica la firma y clasifica el evento. `null` = firma inválida o
 * payload malformado (rechazar la solicitud). `{ kind: "ignored" }` = firma
 * válida pero es un tipo de evento que Fase 2 no maneja (ej.
 * invoice.payment_failed) — responder 200 sin hacer nada, no es un error.
 */
export function parseStripeWebhookPayload(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): ParsedStripeEvent | null {
  if (!signatureHeader || !verifyStripeSignature(rawBody, signatureHeader, secret)) {
    return null;
  }

  try {
    const event = JSON.parse(rawBody) as StripeEventEnvelope;
    const obj = event.data?.object ?? {};

    if (event.type === "checkout.session.completed") {
      const providerReference = typeof obj.subscription === "string" ? obj.subscription : null;
      const userId = typeof obj.client_reference_id === "string" ? obj.client_reference_id : null;
      const metadata = (obj.metadata ?? {}) as Record<string, unknown>;
      const planId = typeof metadata.planId === "string" ? metadata.planId : null;
      if (!providerReference || !userId || !planId) return null; // payload incompleto — descartar con seguridad
      return { kind: "checkout_completed", providerReference, userId, planId };
    }

    if (event.type === "customer.subscription.updated") {
      const providerReference = typeof obj.id === "string" ? obj.id : null;
      if (!providerReference) return null;
      const status = typeof obj.status === "string" ? obj.status : "";
      if (status !== "active" && status !== "trialing") return { kind: "ignored" };
      const periodEndSeconds = typeof obj.current_period_end === "number" ? obj.current_period_end : null;
      const periodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null;
      return { kind: "subscription_renewed", providerReference, periodEnd };
    }

    if (event.type === "customer.subscription.deleted") {
      const providerReference = typeof obj.id === "string" ? obj.id : null;
      if (!providerReference) return null;
      return { kind: "subscription_canceled", providerReference };
    }

    // invoice.payment_failed y cualquier otro tipo: fuera de alcance de
    // Fase 2 (ver RFC-004 §1) — firma válida, se ignora explícitamente.
    return { kind: "ignored" };
  } catch (err) {
    console.warn("parseStripeWebhookPayload failed", err);
    return null;
  }
}
