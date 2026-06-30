import { describe, expect, it } from "vitest";
import type { MedicationResult, PharmacyPrice, PharmacySlug } from "../types.js";
import { mergeDuplicates } from "../deduplication.js";

function makePharmacyPrice(pharmacySlug: PharmacySlug, effective: number): PharmacyPrice {
  return {
    pharmacySlug,
    pharmacyName: "Test Pharmacy",
    productName: "Test Product",
    channels: { store: effective, online: null, cmr: null, sbpay: null, effective },
    hasStock: true,
    hasOnlineDelivery: false,
    onlineUrl: null,
    imageUrl: null,
    fetchedAt: "2025-01-01T00:00:00.000Z",
  };
}

function makeMedResult(
  matchKey: string,
  pharmacySlug: PharmacySlug,
  effective: number,
  imageUrl: string | null = null
): MedicationResult {
  return {
    matchKey,
    canonicalName: "Test Medication",
    laboratory: null,
    isBioequivalent: false,
    prices: [makePharmacyPrice(pharmacySlug, effective)],
    bestPrice: effective,
    bestPharmacy: pharmacySlug,
    imageUrl,
  };
}

describe("mergeDuplicates", () => {
  it("grupo de 1 resultado queda sin cambios", () => {
    const result = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000);
    const merged = mergeDuplicates([result]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(result);
  });

  it("fusiona resultados con mismo matchKey de distintas farmacias", () => {
    const a = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000);
    const b = makeMedResult("paracetamol|500mg|16", "salcobrand", 800);
    const merged = mergeDuplicates([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("elige bestPrice y bestPharmacy según menor precio efectivo", () => {
    const a = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000);
    const b = makeMedResult("paracetamol|500mg|16", "salcobrand", 800);
    const merged = mergeDuplicates([a, b]);
    expect(merged[0].bestPrice).toBe(800);
    expect(merged[0].bestPharmacy).toBe("salcobrand");
  });

  it("misma farmacia duplicada conserva el menor precio efectivo", () => {
    const a = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1200);
    const b = makeMedResult("paracetamol|500mg|16", "cruz-verde", 900);
    const merged = mergeDuplicates([a, b]);
    expect(merged[0].prices).toHaveLength(1);
    expect(merged[0].prices[0].channels.effective).toBe(900);
  });

  it("conserva imageUrl cuando uno de los resultados la tiene", () => {
    const a = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000, null);
    const b = makeMedResult("paracetamol|500mg|16", "salcobrand", 800, "https://example.com/img.png");
    const merged = mergeDuplicates([a, b]);
    expect(merged[0].imageUrl).toBe("https://example.com/img.png");
  });

  it("no fusiona resultados con distinto matchKey", () => {
    const a = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000);
    const b = makeMedResult("ibuprofeno|400mg|20", "salcobrand", 800);
    const merged = mergeDuplicates([a, b]);
    expect(merged).toHaveLength(2);
  });
});
