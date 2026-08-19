import { describe, expect, it } from "vitest";
import type { MedicationResult, PharmacyPrice, PharmacySlug } from "../types.js";
import { mergeDuplicates } from "../deduplication.js";
import { presentationKey } from "../commercialIdentity.js";

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
  imageUrl: string | null = null,
  isBioequivalent: boolean | null = false,
  commercialIdentity = "unknown",
  laboratory: string | null = null
): MedicationResult {
  return {
    matchKey,
    canonicalName: "Test Medication",
    laboratory,
    isBioequivalent,
    prices: [makePharmacyPrice(pharmacySlug, effective)],
    bestPrice: effective,
    bestPharmacy: pharmacySlug,
    imageUrl,
    presentationKey: presentationKey({ matchKey, isBioequivalent, commercialIdentity }),
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

  it("no fusiona bioequivalentes con no bioequivalentes aunque compartan matchKey", () => {
    const bio = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000, null, true);
    const nonBio = makeMedResult("paracetamol|500mg|16", "salcobrand", 800, null, false);

    const merged = mergeDuplicates([bio, nonBio]);

    expect(merged).toHaveLength(2);
    expect(merged.map((item) => item.isBioequivalent).sort()).toEqual([false, true]);
    expect(merged.find((item) => item.isBioequivalent === true)?.prices).toHaveLength(1);
    expect(merged.find((item) => item.isBioequivalent === false)?.prices).toHaveLength(1);
  });

  it("mantiene unknown/null separado y no lo convierte implicitamente en bioequivalente", () => {
    const unknown = makeMedResult("paracetamol|500mg|16", "cruz-verde", 1000, null, null);
    const bio = makeMedResult("paracetamol|500mg|16", "salcobrand", 800, null, true);
    const nonBio = makeMedResult("paracetamol|500mg|16", "ahumada", 900, null, false);

    const merged = mergeDuplicates([unknown, bio, nonBio]);

    expect(merged).toHaveLength(3);
    expect(merged.map((item) => item.isBioequivalent)).toEqual([null, true, false]);
  });

  // ==========================================================================
  // FASE 1 — Product Identity (2026-08-19): SAME_PRODUCT vía presentationKey.
  // Caso real: Omeprazol 20mg x30 Ascend / CuraeSpring / OPKO comparten
  // matchKey + bio pero son productos comerciales distintos (auditoría P0).
  // ==========================================================================

  it("Caso 1 — Ascend vs CuraeSpring vs OPKO, mismo matchKey y bio, NO se fusionan", () => {
    const ascend = makeMedResult("omeprazol|20mg|30", "easyfarma", 1490, null, false, "ascend", "Ascend");
    const curaespring = makeMedResult("omeprazol|20mg|30", "cruz-verde", 2690, null, false, "curaespring", "CuraeSpring");
    const opko = makeMedResult("omeprazol|20mg|30", "farmex", 990, null, false, "opko", "OPKO");

    const merged = mergeDuplicates([ascend, curaespring, opko]);

    expect(merged).toHaveLength(3);
    const byPharmacy = Object.fromEntries(merged.map((m) => [m.prices[0].pharmacySlug, m]));
    expect(byPharmacy["easyfarma"].prices).toHaveLength(1);
    expect(byPharmacy["cruz-verde"].prices).toHaveLength(1);
    expect(byPharmacy["farmex"].prices).toHaveLength(1);
  });

  it("Caso 4 — marca conocida vs unknown, mismo matchKey y bio, NO se fusionan", () => {
    const known = makeMedResult("omeprazol|20mg|30", "easyfarma", 1490, null, false, "ascend", "Ascend");
    const unknown = makeMedResult("omeprazol|20mg|30", "ecofarmacias", 750, null, false, "unknown", null);

    const merged = mergeDuplicates([known, unknown]);

    expect(merged).toHaveLength(2);
  });

  it("Caso 5 — dos ofertas 'unknown' sí se agrupan entre sí (limitación conocida y aceptada)", () => {
    const a = makeMedResult("omeprazol|20mg|30", "salcobrand", 3000, null, false, "unknown", null);
    const b = makeMedResult("omeprazol|20mg|30", "ahumada", 3200, null, false, "unknown", null);

    const merged = mergeDuplicates([a, b]);

    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("Caso 6 — bio=true vs bio=false nunca se fusionan aunque compartan marca", () => {
    const bio = makeMedResult("omeprazol|20mg|30", "dr-simi", 1560, null, true, "opko", "OPKO");
    const nonBio = makeMedResult("omeprazol|20mg|30", "farmex", 990, null, false, "opko", "OPKO");

    const merged = mergeDuplicates([bio, nonBio]);

    expect(merged).toHaveLength(2);
  });

  it("Caso 7 — mismo producto comercial exacto en dos farmacias SÍ se fusiona y conserva ambos precios", () => {
    const a = makeMedResult("omeprazol|20mg|30", "farmex", 990, null, false, "opko", "OPKO");
    const b = makeMedResult("omeprazol|20mg|30", "salcobrand", 1200, null, false, "opko", "OPKO");

    const merged = mergeDuplicates([a, b]);

    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
    expect(merged[0].bestPrice).toBe(990);
  });
});
