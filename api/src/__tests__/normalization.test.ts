import { describe, expect, it } from "vitest";

import { cleanQuery, effectivePrice, matchKey, mergeDuplicates, toMedicationResult } from "@comparafarma/domain";
import type { MedicationResult, ScrapedProduct } from "../lib/types.js";

describe("normalization", () => {
  it("cleans noisy prescription input", () => {
    expect(cleanQuery("Paracetamol 500 mg comprimidos tomar cada 8 horas")).toBe("Paracetamol");
  });

  it("builds match keys with dose and quantity", () => {
    expect(matchKey("Paracetamol 500 mg x 16 Comprimidos")).toBe("paracetamol|500mg|16");
    expect(matchKey("Amoxicilina Potásica 0.5 g cápsulas")).toBe("amoxicilina|500mg");
  });

  it("computes the best effective price across all channels", () => {
    expect(effectivePrice({
      store: 3290,
      online: 2490,
      cmr: null,
      sbpay: 2290,
    })).toBe(2290);
  });

  it("merges duplicate medications keeping the cheapest pharmacy ordering", () => {
    const cv = makeMedication("Paracetamol 500 mg 16 Comprimidos", "cruz-verde", {
      price: 840,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
    });
    const ds = makeMedication("Paracetamol 500 mg 16 comprimidos", "dr-simi", {
      price: 480,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
    });

    const merged = mergeDuplicates([cv, ds]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.prices).toHaveLength(2);
    expect(merged[0]?.bestPrice).toBe(480);
    expect(merged[0]?.bestPharmacy).toBe("dr-simi");
    expect(merged[0]?.prices[0]?.pharmacySlug).toBe("dr-simi");
  });
});

function makeMedication(
  name: string,
  pharmacySlug: "cruz-verde" | "dr-simi",
  overrides: Pick<ScrapedProduct, "price" | "onlinePrice" | "cmrPrice" | "sbpayPrice">
): MedicationResult {
  return toMedicationResult({
    name,
    price: overrides.price,
    onlinePrice: overrides.onlinePrice,
    cmrPrice: overrides.cmrPrice,
    sbpayPrice: overrides.sbpayPrice,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    brand: null,
    manufacturer: null,
    isBioequivalent: false,
  }, pharmacySlug, pharmacySlug === "cruz-verde" ? "Cruz Verde" : "Dr. Simi");
}
