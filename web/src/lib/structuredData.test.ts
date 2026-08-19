import { describe, it, expect } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";
import { buildMedicationJsonLd, buildMedicationDetailJsonLd, toJsonLdScript } from "./structuredData";

function makeMedication(): MedicationResult {
  return {
    matchKey: "paracetamol|500mg",
    canonicalName: "Paracetamol 500 mg",
    laboratory: "Andrómaco",
    isBioequivalent: true,
    bestPrice: 2290,
    bestPharmacy: "salcobrand",
    imageUrl: null,
    presentationKey: "paracetamol|500mg|bio:true|brand:unknown",
    prices: [
      {
        pharmacySlug: "salcobrand",
        pharmacyName: "Salcobrand",
        productName: "Paracetamol 500 mg",
        channels: { store: 3290, online: null, cmr: 2290, sbpay: null, effective: 2290 },
        hasStock: true,
        hasOnlineDelivery: true,
        onlineUrl: "https://comparafarma-api.vercel.app/api/go?slug=salcobrand&matchKey=paracetamol%7C500mg",
        imageUrl: null,
        fetchedAt: "2026-07-20T00:00:00.000Z",
      },
      {
        pharmacySlug: "cruz-verde",
        pharmacyName: "Cruz Verde",
        productName: "Paracetamol 500 mg",
        channels: { store: 2990, online: null, cmr: null, sbpay: null, effective: 2990 },
        hasStock: true,
        hasOnlineDelivery: false,
        onlineUrl: null,
        imageUrl: null,
        fetchedAt: "2026-07-20T00:00:00.000Z",
      },
    ],
  };
}

describe("buildMedicationDetailJsonLd — Sprint Web 2 (Offer por farmacia)", () => {
  it("includes one Offer per pharmacy price nested inside the AggregateOffer", () => {
    const jsonLd = buildMedicationDetailJsonLd(makeMedication(), "https://app-compara-farma-web.vercel.app/medicamento/paracetamol-500-mg-abc123");

    const offers = (jsonLd.offers as { offers: unknown[] }).offers;
    expect(offers).toHaveLength(2);
    expect(offers[0]).toMatchObject({
      "@type": "Offer",
      price: 2290,
      priceCurrency: "CLP",
      seller: { "@type": "Organization", name: "Salcobrand" },
      url: "https://comparafarma-api.vercel.app/api/go?slug=salcobrand&matchKey=paracetamol%7C500mg",
    });
  });

  it("omits the url field for an Offer without an onlineUrl", () => {
    const jsonLd = buildMedicationDetailJsonLd(makeMedication(), "https://example.test/medicamento/x");

    const offers = (jsonLd.offers as { offers: { url?: string }[] }).offers;
    expect(offers[1].url).toBeUndefined();
  });
});

describe("buildMedicationJsonLd — lista de resultados (sin Offer por farmacia)", () => {
  it("does not include a nested offers array (kept lean for the search results page)", () => {
    const jsonLd = buildMedicationJsonLd("paracetamol", [makeMedication()]);

    const product = jsonLd["@graph"][0].itemListElement[0].item as { offers: Record<string, unknown> };
    expect(product.offers.offers).toBeUndefined();
    expect(product.offers.lowPrice).toBe(2290);
    expect(product.offers.highPrice).toBe(2990);
  });
});

describe("toJsonLdScript", () => {
  it("serializes plain data to JSON", () => {
    expect(toJsonLdScript({ a: 1, b: "texto" })).toBe('{"a":1,"b":"texto"}');
  });

  it("escapes '<' so a product name containing '</script>' cannot close the tag early", () => {
    const malicious = { name: '</script><script>alert(1)</script>' };

    const output = toJsonLdScript(malicious);

    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
    expect(output).toContain("\\u003cscript>");
  });
});
