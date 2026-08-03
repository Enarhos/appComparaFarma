import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { verifyStripeSignature, parseStripeWebhookPayload } from "../lib/adapters/stripeAdapter.js";

const SECRET = "whsec_test_123";

function sign(rawBody: string, timestamp = "1700000000"): string {
  const signature = createHmac("sha256", SECRET).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function checkoutCompletedPayload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: "checkout.session.completed",
    data: {
      object: {
        subscription: "sub_123",
        client_reference_id: "user-1",
        metadata: { planId: "premium_monthly" },
        ...overrides,
      },
    },
  });
}

describe("verifyStripeSignature", () => {
  it("acepta una firma válida", () => {
    const rawBody = checkoutCompletedPayload();
    expect(verifyStripeSignature(rawBody, sign(rawBody), SECRET)).toBe(true);
  });

  it("rechaza una firma calculada con otro secreto", () => {
    const rawBody = checkoutCompletedPayload();
    const wrongSignature = createHmac("sha256", "otro-secreto").update(`1700000000.${rawBody}`, "utf8").digest("hex");
    expect(verifyStripeSignature(rawBody, `t=1700000000,v1=${wrongSignature}`, SECRET)).toBe(false);
  });

  it("rechaza si el body fue alterado después de firmarse", () => {
    const rawBody = checkoutCompletedPayload();
    const signature = sign(rawBody);
    expect(verifyStripeSignature(rawBody + " ", signature, SECRET)).toBe(false);
  });

  it("rechaza un header sin t= o v1=, sin lanzar", () => {
    expect(verifyStripeSignature("{}", "no-tiene-el-formato-esperado", SECRET)).toBe(false);
  });
});

describe("parseStripeWebhookPayload", () => {
  it("devuelve null si la firma es inválida", () => {
    const rawBody = checkoutCompletedPayload();
    expect(parseStripeWebhookPayload(rawBody, "t=1,v1=deadbeef", SECRET)).toBeNull();
  });

  it("devuelve null si no hay header de firma", () => {
    const rawBody = checkoutCompletedPayload();
    expect(parseStripeWebhookPayload(rawBody, null, SECRET)).toBeNull();
  });

  it("parsea checkout.session.completed con firma válida", () => {
    const rawBody = checkoutCompletedPayload();
    const result = parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET);
    expect(result).toEqual({
      kind: "checkout_completed",
      providerReference: "sub_123",
      userId: "user-1",
      planId: "premium_monthly",
    });
  });

  it("devuelve null si checkout.session.completed no trae client_reference_id/metadata.planId", () => {
    const rawBody = checkoutCompletedPayload({ client_reference_id: undefined, metadata: {} });
    expect(parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET)).toBeNull();
  });

  it("parsea customer.subscription.updated (status active) como renovación", () => {
    const rawBody = JSON.stringify({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_123", status: "active", current_period_end: 1700003600 } },
    });
    const result = parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET);
    expect(result).toEqual({
      kind: "subscription_renewed",
      providerReference: "sub_123",
      periodEnd: new Date(1700003600 * 1000).toISOString(),
    });
  });

  it("ignora customer.subscription.updated con status que Fase 2 no maneja (ej. past_due)", () => {
    const rawBody = JSON.stringify({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_123", status: "past_due" } },
    });
    expect(parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET)).toEqual({ kind: "ignored" });
  });

  it("parsea customer.subscription.deleted como cancelación", () => {
    const rawBody = JSON.stringify({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123" } },
    });
    const result = parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET);
    expect(result).toEqual({ kind: "subscription_canceled", providerReference: "sub_123" });
  });

  it("ignora tipos de evento fuera de alcance de Fase 2 (ej. invoice.payment_failed)", () => {
    const rawBody = JSON.stringify({ type: "invoice.payment_failed", data: { object: {} } });
    expect(parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET)).toEqual({ kind: "ignored" });
  });

  it("devuelve null si el JSON está malformado, sin lanzar (con firma válida sobre ese mismo texto)", () => {
    const rawBody = "{not-json";
    expect(parseStripeWebhookPayload(rawBody, sign(rawBody), SECRET)).toBeNull();
  });
});
