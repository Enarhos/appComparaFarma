import { describe, it, expect } from "vitest";
import {
  parseGooglePlayNotification,
  toNormalizedEvent,
  type GooglePlayRtdnEnvelope,
} from "../lib/adapters/googlePlayAdapter.js";

function makeEnvelope(payload: unknown): GooglePlayRtdnEnvelope {
  return {
    message: {
      data: Buffer.from(JSON.stringify(payload), "utf-8").toString("base64"),
      messageId: "123",
      publishTime: "2026-08-02T00:00:00Z",
    },
    subscription: "projects/x/subscriptions/y",
  };
}

describe("parseGooglePlayNotification", () => {
  it("parsea una notificación de compra (SUBSCRIPTION_PURCHASED, tipo 4)", () => {
    const envelope = makeEnvelope({
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      subscriptionNotification: {
        version: "1.0",
        notificationType: 4,
        purchaseToken: "tok-abc",
        subscriptionId: "premium_monthly",
      },
    });

    const result = parseGooglePlayNotification(envelope);

    expect(result).toEqual({
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      purchaseToken: "tok-abc",
      subscriptionProductId: "premium_monthly",
      type: "purchase",
    });
  });

  it.each([
    [1, "renewal"],
    [2, "renewal"],
    [3, "cancellation"],
    [6, "renewal"],
    [7, "renewal"],
    [10, "cancellation"],
    [12, "refund"],
    [13, "expiration"],
  ])("mapea notificationType %i a %s", (notificationType, expectedType) => {
    const envelope = makeEnvelope({
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      subscriptionNotification: { notificationType, purchaseToken: "tok", subscriptionId: "premium_monthly" },
    });

    expect(parseGooglePlayNotification(envelope)?.type).toBe(expectedType);
  });

  it("devuelve type:null para notificationType que Fase 1 no procesa (ej. ON_HOLD)", () => {
    const envelope = makeEnvelope({
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      subscriptionNotification: { notificationType: 5, purchaseToken: "tok", subscriptionId: "premium_monthly" },
    });

    expect(parseGooglePlayNotification(envelope)?.type).toBeNull();
  });

  it("devuelve null si no hay subscriptionNotification (ej. testNotification)", () => {
    const envelope = makeEnvelope({ packageName: "mla.app.comparafarma", testNotification: { version: "1.0" } });
    expect(parseGooglePlayNotification(envelope)).toBeNull();
  });

  it("devuelve null si el data no es base64/JSON válido, sin lanzar", () => {
    const envelope: GooglePlayRtdnEnvelope = { message: { data: "no-es-base64-json-valido!!" } };
    expect(parseGooglePlayNotification(envelope)).toBeNull();
  });

  it("devuelve null si falta message.data, sin lanzar", () => {
    // @ts-expect-error — probamos un envelope malformado a propósito
    expect(parseGooglePlayNotification({ message: {} })).toBeNull();
  });
});

describe("toNormalizedEvent", () => {
  it("construye el evento normalizado con el userId ya resuelto", () => {
    const parsed = {
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      purchaseToken: "tok-abc",
      subscriptionProductId: "premium_monthly",
      type: "purchase" as const,
    };

    const event = toNormalizedEvent(parsed, "user-1");

    expect(event).toEqual({
      provider: "google_play",
      providerReference: "tok-abc",
      type: "purchase",
      userId: "user-1",
      planId: "premium_monthly",
      periodEnd: null,
      rawPayload: parsed,
    });
  });

  it("devuelve null si el tipo parseado es null", () => {
    const parsed = {
      packageName: "mla.app.comparafarma",
      eventTimeMillis: "1700000000000",
      purchaseToken: "tok-abc",
      subscriptionProductId: "premium_monthly",
      type: null,
    };

    expect(toNormalizedEvent(parsed, "user-1")).toBeNull();
  });
});
