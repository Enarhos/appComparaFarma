import { describe, expect, it } from "vitest";
import type { MedicationResult, PharmacyPrice, PharmacySlug, ScrapedProduct } from "../types.js";
import { mergeDuplicates } from "../deduplication.js";
import { presentationKey } from "../commercialIdentity.js";
import { toMedicationResult } from "../pricing.js";

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
  manufacturer: string | null = null
): MedicationResult {
  return {
    matchKey,
    canonicalName: "Test Medication",
    laboratory: manufacturer,
    brand: null,
    manufacturer,
    activeIngredient: null,
    brandSource: "unknown",
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

  // ==========================================================================
  // Bug report (2026-08-24) — búsqueda "Ascenda" en Web: "Ascenda" y "Nestlé
  // Ascenda®" en Salcobrand aparentaban ser el mismo producto sin fusionar.
  // Investigación con datos reales de producción (ver reporte) confirmó que
  // en realidad son DOS SKU distintos de Salcobrand — "Complemento
  // Nutricional Ascenda Sabor VAINILLA 800g" (SKU 584778) vs "Complemento
  // Nutricional Infantil Ascenda Sabor NEUTRO 800g" (SKU 596311) — con
  // sabores distintos y precios reales distintos ($23.999/$19.199 vs
  // $24.999). Ambos comparten `matchKey` ("complemento|800000mg") porque
  // `matchKey()` no distingue sabor para este tipo de producto (limitación
  // preexistente de matching.ts, fuera de alcance de este fix). El siguiente
  // test documenta que, con los datos REALES de laboratory ("Ascenda" vs
  // "Nestlé Ascenda®"), `resolveCommercialIdentity` produce tokens de marca
  // distintos ("ascenda" vs "nestleascenda") y por lo tanto NO se fusionan —
  // comportamiento correcto: fusionarlos sería un falso positivo (dos
  // presentaciones/sabores reales distintos) y, bajo la política de "misma
  // farmacia duplicada conserva el menor precio efectivo", descartaría
  // silenciosamente el precio de una de las dos ofertas reales.
  it("Caso 8 — Ascenda vs Nestlé Ascenda® (Salcobrand, sabores reales distintos) NO se fusionan", () => {
    const ascendaVainilla = makeMedResult(
      "complemento|800000mg",
      "salcobrand",
      19199,
      "https://static.salcobrand.cl/spree/products/183845/small/584778.jpg",
      false,
      "ascenda",
      "Ascenda"
    );
    const nestleAscendaNeutro = makeMedResult(
      "complemento|800000mg",
      "salcobrand",
      24999,
      "https://static.salcobrand.cl/spree/products/198822/small/596311.jpg",
      false,
      "nestleascenda",
      "Nestlé Ascenda®"
    );

    const merged = mergeDuplicates([ascendaVainilla, nestleAscendaNeutro]);

    expect(merged).toHaveLength(2);
    // Ninguna de las dos ofertas reales pierde su precio/canal.
    expect(merged.find((m) => m.laboratory === "Ascenda")?.prices[0].channels.effective).toBe(19199);
    expect(merged.find((m) => m.laboratory === "Nestlé Ascenda®")?.prices[0].channels.effective).toBe(24999);
  });
});

/**
 * S-1 (SEARCH-MATCHING-QA-01, Gate 2) — `mergeDuplicates` NO se modificó.
 *
 * La corrección vive íntegramente en `presentationKey` (commercialIdentity.ts),
 * que ya es la clave de agrupación. Estos casos ejercitan el pipeline REAL
 * (`toMedicationResult` → `mergeDuplicates`, igual que searchService) para
 * confirmarlo con evidencia en vez de asumirlo.
 */
describe("mergeDuplicates — combinación vs monofármaco (S-1)", () => {
  function offer(
    pharmacySlug: PharmacySlug,
    name: string,
    price: number,
    manufacturer: string | null = null
  ): MedicationResult {
    const product: ScrapedProduct = {
      name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl: null,
      imageUrl: null,
      brand: null,
      manufacturer,
      isBioequivalent: false,
    };
    return toMedicationResult(product, pharmacySlug, pharmacySlug);
  }

  it("no fusiona el monofármaco con su combinación aunque compartan matchKey, marca y bio", () => {
    const mono = offer("araucomed", "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)", 990, "Ascend");
    const combo = offer(
      "farmex",
      "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos",
      1990,
      "Ascend"
    );

    expect(mono.matchKey).toBe(combo.matchKey);
    const merged = mergeDuplicates([mono, combo]);
    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.bestPrice).sort((a, b) => a - b)).toEqual([990, 1990]);
  });

  it("dos farmacias que listan la MISMA combinación sí se siguen fusionando", () => {
    // La separación es contra el monofármaco, no entre farmacias: si el token
    // de combinación no fuera estable entre variantes de escritura, este caso
    // se partiría en dos tarjetas y el usuario perdería la comparación.
    const farmex = offer("farmex", "Losartán Potásico + Hidroclorotiazida 50/12,5 mg x 30 comprimidos", 1990);
    const eco = offer("ecofarmacias", "Losartan/Hidroclorotiazida 50/12,5 mg x 30 comprimidos", 1490);

    expect(farmex.presentationKey).toBe(eco.presentationKey);
    const merged = mergeDuplicates([farmex, eco]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
    expect(merged[0].bestPrice).toBe(1490);
  });

  it("[no-regresión] los monofármacos se siguen agrupando exactamente igual que antes de S-1", () => {
    const cruzVerde = offer("cruz-verde", "Paracetamol 500 mg x 16 Comprimidos", 800, "Andrómaco");
    const ahumada = offer("ahumada", "Paracetamol 500 mg x 16 comprimidos", 618, "ANDROMACO");

    // Sin segmento `|combo:` (no es una combinación) ni `|var:` (ninguna de
    // las dos declara calificador comercial). CF-SEARCH-001 agrega
    // `|form:solid-oral`: ambas escriben "comprimidos", así que el eje nuevo
    // NO las separa — que es justamente lo que este no-regresión verifica.
    expect(cruzVerde.presentationKey).toBe(
      "paracetamol|500mg|16|bio:false|brand:andromaco|form:solid-oral"
    );
    expect(cruzVerde.presentationKey).toBe(ahumada.presentationKey);

    const merged = mergeDuplicates([cruzVerde, ahumada]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
    expect(merged[0].bestPrice).toBe(618);
  });
});
