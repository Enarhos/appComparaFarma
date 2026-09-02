/**
 * CF-SEARCH-011 S0 — integración del pipeline canónico v2.
 *
 * Los cinco casos de control obligatorios del ticket (§17), con nombres REALES
 * del corpus congelado de las 9 farmacias:
 *
 *   Losartán      — la fragmentación que v1 reparte en hasta 9 tarjetas
 *   Ambroxol      — 30mg / 30mg-5ml / 15mg-5ml y las variantes comerciales
 *   Tapsin        — las correcciones de CF-SEARCH-001 no se reintroducen
 *   Ibuprofeno    — concentraciones y formas
 *   Combinaciones — monofármaco vs asociación
 *
 * Más las garantías transversales: cobertura de ofertas, cadena de identidad
 * íntegra, provenance suficiente y ausencia de falsos merges.
 */
import { describe, expect, it } from "vitest";
import { canonicalize } from "../searchV2/canonicalize.js";
import { compareConcentration } from "../searchV2/canonicalConcentration.js";
import { canonicalizeOffer } from "../searchV2/canonicalAttributes.js";
import type { PharmacySlug } from "../types.js";
import type { CanonicalGraph, RawOfferInput } from "../searchV2/canonicalTypes.js";

let sequence = 0;
const offer = (
  rawName: string,
  pharmacy: PharmacySlug,
  extra: Partial<RawOfferInput> = {}
): RawOfferInput => ({
  pharmacy,
  rawName,
  price: { store: 1000 + sequence++, online: null, cmr: null, sbpay: null, effective: 1000 },
  stock: true,
  url: null,
  capturedAt: "2026-09-01T00:00:00.000Z",
  ...extra,
});

const find = (graph: CanonicalGraph, name: string) =>
  graph.offers.find((o) => o.rawName === name)!;
const productsOf = (graph: CanonicalGraph, names: string[]) =>
  new Set(names.map((n) => find(graph, n).productId));
const conceptsOf = (graph: CanonicalGraph, names: string[]) =>
  new Set(names.map((n) => find(graph, n).conceptId));

/**
 * Ejes en los que dos ofertas del mismo producto se contradirían. Es el mismo
 * detector que usa el Gate C del harness de S0, en su modo comparable con la
 * línea base de v1: dos niveles de evidencia distintos de concentración no son
 * una contradicción (misma política que `isCompatibleConcentration` de v1).
 */
function contradicts(a: string, b: string): boolean {
  const x = canonicalizeOffer(offer(a, "cruz-verde"));
  const y = canonicalizeOffer(offer(b, "salcobrand"));
  const ingX = x.activeIngredients.map((i) => i.token).join("+");
  const ingY = y.activeIngredients.map((i) => i.token).join("+");
  if (ingX && ingY && ingX !== ingY) return true;
  if (
    x.concentration.kind === y.concentration.kind &&
    compareConcentration(x.concentration, y.concentration) === "incompatible"
  ) {
    return true;
  }
  if (x.dosageForm && y.dosageForm && x.dosageForm !== y.dosageForm) return true;
  if (x.packageQuantity !== null && y.packageQuantity !== null && x.packageQuantity !== y.packageQuantity) {
    return true;
  }
  if (x.commercialVariant !== y.commercialVariant) return true;
  return false;
}

// ---------------------------------------------------------------------------
// CASO 1 — LOSARTÁN
// ---------------------------------------------------------------------------

describe("caso de control — Losartán 50 mg x 30 (§17)", () => {
  const GENERICS = [
    "Losartan 50 mg x 30 comprimidos (LCH) DESCUENTO",
    "Losartan Potasico 50 mg x 30 Comprimidos Recubiertos",
    "Losartan Potásico 50 mg x 30 comprimidos",
    "Losartan Potasico 50 mg 30 Comprimidos",
    "Losartan (B) 50mg 30 Comprimidos Recubiertos",
  ];
  const BRANDED = [
    "Cozaar Losartan Potasico 50 mg 30 Comprimidos",
    "Corodin Losartan Potasico 50 mg 30 Comprimidos",
    "Losapres Losartán Potásico 50 mg 30 Comprimidos Recubiertos",
  ];
  const COMBINATION = "Losartan/Hidroclorotiazida 50 mg/12.5 mg x 30 Comprimidos Recubiertos";

  const PHARMACIES: PharmacySlug[] = [
    "cruz-verde", "salcobrand", "ahumada", "farmex", "araucomed",
    "ecofarmacias", "dr-simi", "sermecoop", "easyfarma",
  ];

  const graph = canonicalize(
    [...GENERICS, ...BRANDED, COMBINATION].map((n, i) => offer(n, PHARMACIES[i % 9]!))
  );

  it("unifica los genéricos de 5 farmacias en UN producto — la comparación que v1 pierde", () => {
    expect(productsOf(graph, GENERICS).size).toBe(1);
  });

  it("las marcas conservan identidad propia: no se fuerza un solo productId", () => {
    expect(productsOf(graph, BRANDED).size).toBe(3);
    expect(productsOf(graph, [...GENERICS, ...BRANDED]).size).toBe(4);
  });

  it("genéricos y marcas comparten concepto Y presentación — ahí aparece la comparación", () => {
    expect(conceptsOf(graph, [...GENERICS, ...BRANDED]).size).toBe(1);
    expect(new Set([...GENERICS, ...BRANDED].map((n) => find(graph, n).presentationId)).size).toBe(1);
  });

  it("la combinación NUNCA comparte concepto con el monofármaco", () => {
    expect(find(graph, COMBINATION).conceptId).not.toBe(find(graph, GENERICS[0]!).conceptId);
    const combo = graph.concepts.get(find(graph, COMBINATION).conceptId)!;
    expect(combo.activeIngredients.map((i) => i.token)).toEqual(["hidroclorotiazida", "losartan"]);
  });

  it("dos laboratorios estructurados DISTINTOS producen productos distintos", () => {
    const withLabs = canonicalize([
      offer("Losartan Potasico 50 mg x30com.", "araucomed", { structuredManufacturer: "Mintlab" }),
      offer("Losartan Potasico 50 mg x30com.", "farmex", { structuredManufacturer: "Opko" }),
    ]);
    expect(new Set(withLabs.offers.map((o) => o.productId)).size).toBe(2);
    expect(new Set(withLabs.offers.map((o) => o.presentationId)).size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// CASO 2 — AMBROXOL
// ---------------------------------------------------------------------------

describe("caso de control — Ambroxol (§17)", () => {
  const ADULT_RATIO = "Ambroxol 30mg/5ml Jarabe 100ml";
  const ADULT_NO_SEPARATOR = "Jarabe Ambroxol clorhidrato 30mg 5ml 100ml (Hospifarma)";
  const ADULT_DOTTED = "Ambroxol 30mg./5ml. Jarabe Fco. 100ml";
  const PEDIATRIC = "Ambroxol 15 mg/5mL Jarabe 100 mL";
  const DROPS = "Broncot Ambroxol Clorhidrato 7.5mg/ml Gotas 30ml";
  const TABLET = "Muxol Ambroxol 30 mg 20 Comprimidos";
  const MUXOL_SYRUP = "Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml";
  const AMRODIL = "Amrodil 30 Mg/5ml 100 Ml";

  const graph = canonicalize([
    offer(ADULT_RATIO, "sermecoop"),
    offer(ADULT_NO_SEPARATOR, "ecofarmacias"),
    offer(ADULT_DOTTED, "ahumada"),
    offer(PEDIATRIC, "cruz-verde"),
    offer(DROPS, "salcobrand"),
    offer(TABLET, "farmex"),
    offer(MUXOL_SYRUP, "araucomed"),
    offer(AMRODIL, "easyfarma"),
  ]);

  it("las tres escrituras del jarabe de adulto son el MISMO concepto", () => {
    expect(conceptsOf(graph, [ADULT_RATIO, ADULT_NO_SEPARATOR, ADULT_DOTTED]).size).toBe(1);
  });

  it("30 mg/5 ml y 15 mg/5 ml NUNCA son el mismo concepto", () => {
    expect(find(graph, ADULT_RATIO).conceptId).not.toBe(find(graph, PEDIATRIC).conceptId);
  });

  it("las gotas de 7,5 mg/ml son un concepto distinto del jarabe de 15 mg/5 ml", () => {
    expect(find(graph, DROPS).conceptId).not.toBe(find(graph, PEDIATRIC).conceptId);
  });

  it("el comprimido de 30 mg no es el jarabe de 30 mg/5 ml", () => {
    expect(find(graph, TABLET).conceptId).not.toBe(find(graph, ADULT_RATIO).conceptId);
  });

  it("Muxol comparte concepto con el genérico pero es un PRODUCTO distinto", () => {
    expect(find(graph, MUXOL_SYRUP).conceptId).toBe(find(graph, ADULT_RATIO).conceptId);
    expect(find(graph, MUXOL_SYRUP).productId).not.toBe(find(graph, ADULT_RATIO).productId);
    expect(graph.products.get(find(graph, MUXOL_SYRUP).productId)!.brand).toBe("Muxol");
  });

  it("'ambroxol' nunca se publica como variante comercial (65 ofertas de v1)", () => {
    for (const product of graph.products.values()) {
      expect(product.commercialVariant).not.toBe("ambroxol");
    }
  });

  it("un genérico sin marca demostrable NO se absorbe dentro de una marca", () => {
    // "Amrodil" no se puede demostrar como marca; tampoco puede desaparecer
    // dentro de Muxol. Es la regla que evita comparar un genérico con una marca
    // como si fueran el mismo producto.
    expect(find(graph, AMRODIL).productId).not.toBe(find(graph, MUXOL_SYRUP).productId);
  });

  it("el jarabe de 60 ml y el de 100 ml son el mismo CONCEPTO y distinta PRESENTACIÓN", () => {
    const volumes = canonicalize([
      offer("Ambroxol 30 mg/5 mL Jarabe 100 mL", "cruz-verde"),
      offer("Ambroxol 30 mg/5 mL Jarabe 60 mL", "salcobrand"),
    ]);
    expect(new Set(volumes.offers.map((o) => o.conceptId)).size).toBe(1);
    expect(new Set(volumes.offers.map((o) => o.presentationId)).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// CASO 3 — TAPSIN (protección de CF-SEARCH-001)
// ---------------------------------------------------------------------------

describe("caso de control — Tapsin: no se reintroducen los falsos merges de CF-SEARCH-001 (§17)", () => {
  const VARIANTS = [
    "Tapsin X 6 comprimidos Noche (Maver)",
    "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
    "Tapsin Forte x 6 comprimidos",
    "Tapsin Periodo x 6 Comprimidos",
    "Tapsin Duo x 6 comprimidos",
    "Tapsin Migraña x 6 comprimidos",
  ];
  const graph = canonicalize(
    VARIANTS.map((n, i) =>
      offer(n, (["ecofarmacias", "araucomed", "farmex", "ahumada", "cruz-verde", "salcobrand"] as PharmacySlug[])[i]!)
    )
  );

  it("cada variante comercial conserva su propio productId", () => {
    expect(productsOf(graph, VARIANTS).size).toBe(VARIANTS.length);
  });

  it("la AUSENCIA de variante también es identidad: 'Tapsin x 6' no es 'Tapsin Rojo x 6'", () => {
    expect(find(graph, VARIANTS[0]!).productId).not.toBe(find(graph, VARIANTS[1]!).productId);
  });

  it("Día y Noche no se fusionan", () => {
    const dayNight = canonicalize([
      offer("Tapsin Plus Día 16 Comprimidos", "cruz-verde"),
      offer("Tapsin Plus Noche 16 Comprimidos", "salcobrand"),
    ]);
    expect(new Set(dayNight.offers.map((o) => o.productId)).size).toBe(2);
  });

  it("una marca sin molécula demostrable NO se absorbe dentro del concepto del genérico", () => {
    // "Tapsin Forte x 30" no nombra el paracetamol. Si su identidad se
    // resolviera por ausencia de evidencia, acabaría dentro del concepto
    // "paracetamol 500 mg comprimido" — una identidad falsa.
    const mixed = canonicalize([
      offer("Tapsin Forte x 30 comprimidos", "araucomed"),
      offer("Paracetamol 500 mg x 30 comprimidos", "cruz-verde"),
    ]);
    expect(new Set(mixed.offers.map((o) => o.conceptId)).size).toBe(2);
    const tapsin = mixed.concepts.get(find(mixed, "Tapsin Forte x 30 comprimidos").conceptId)!;
    expect(tapsin.activeIngredients[0]!.evidence).toBe("unresolved-head");
  });

  it("un sobre suelto no comparte presentación con la caja de 6", () => {
    const packs = canonicalize([
      offer("Tapsin Caliente Noche - Sabor Limón - Sobre de 5 g ( 1 sobre )", "farmex"),
      offer("Tapsin Caliente Noche 6 Sobres", "cruz-verde"),
    ]);
    expect(new Set(packs.offers.map((o) => o.presentationId)).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// CASO 4 — IBUPROFENO
// ---------------------------------------------------------------------------

describe("caso de control — Ibuprofeno: concentraciones y formas (§17)", () => {
  const graph = canonicalize([
    offer("Ibuprofeno 400 mg x 20 comprimidos", "cruz-verde"),
    offer("Ibuprofeno 600 mg x 20 Comprimidos Recubiertos", "ahumada"),
    offer("Ibuprofeno 200mg/5ml Jarabe 100ml", "salcobrand"),
    offer("Ibuprofeno 100 mg/5mL Suspensión 100 mL", "farmex"),
  ]);

  it("400 mg y 600 mg son conceptos distintos", () => {
    expect(find(graph, "Ibuprofeno 400 mg x 20 comprimidos").conceptId).not.toBe(
      find(graph, "Ibuprofeno 600 mg x 20 Comprimidos Recubiertos").conceptId
    );
  });

  it("200 mg/5 ml y 100 mg/5 ml son conceptos distintos — el par que colisionaba en el slug", () => {
    expect(find(graph, "Ibuprofeno 200mg/5ml Jarabe 100ml").conceptId).not.toBe(
      find(graph, "Ibuprofeno 100 mg/5mL Suspensión 100 mL").conceptId
    );
  });

  it("jarabe y suspensión de la misma potencia SÍ son el mismo concepto", () => {
    const same = canonicalize([
      offer("Ibuprofeno 100 mg/5 mL Jarabe 100 mL", "cruz-verde"),
      offer("Ibuprofeno 100 mg/5 mL Suspensión Oral 100 mL", "dr-simi"),
    ]);
    expect(new Set(same.offers.map((o) => o.conceptId)).size).toBe(1);
  });

  it("el comprimido y el jarabe nunca comparten concepto", () => {
    expect(find(graph, "Ibuprofeno 400 mg x 20 comprimidos").conceptId).not.toBe(
      find(graph, "Ibuprofeno 200mg/5ml Jarabe 100ml").conceptId
    );
  });
});

// ---------------------------------------------------------------------------
// CASO 5 — COMBINACIONES
// ---------------------------------------------------------------------------

describe("caso de control — combinaciones farmacológicas (§17)", () => {
  it("el monofármaco y la asociación nunca comparten concepto", () => {
    const graph = canonicalize([
      offer("Amoxicilina 500 mg x 21 Cápsulas", "cruz-verde"),
      offer("Amoxicilina + Ácido Clavulánico 500 mg x 21 Cápsulas", "ahumada"),
    ]);
    expect(new Set(graph.offers.map((o) => o.conceptId)).size).toBe(2);
  });

  it("el orden textual de la combinación no crea identidades distintas", () => {
    const graph = canonicalize([
      offer("Losartan Potásico + Hidroclorotiazida 50 mg/12.5 mg x 30 comp.", "ecofarmacias"),
      offer("Hidroclorotiazida + Losartan 50 mg/12.5 mg x 30 comp.", "farmex"),
    ]);
    expect(new Set(graph.offers.map((o) => o.conceptId)).size).toBe(1);
  });

  it("la sal no se cuenta como segundo principio activo", () => {
    const graph = canonicalize([
      offer("Losartan Potásico 50 mg x 30 comprimidos", "cruz-verde"),
      offer("Losartan 50 mg x 30 comprimidos", "salcobrand"),
    ]);
    expect(new Set(graph.offers.map((o) => o.conceptId)).size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GARANTÍAS TRANSVERSALES
// ---------------------------------------------------------------------------

describe("garantías del grafo canónico", () => {
  const NAMES: Array<[string, PharmacySlug]> = [
    ["Ambroxol 30mg/5ml Jarabe 100ml", "sermecoop"],
    ["Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml", "cruz-verde"],
    ["Tapsin Forte x 30 comprimidos", "araucomed"],
    ["Losartan Potasico 50 mg x 30 comprimidos", "farmex"],
    ["Omeprazol 20 mg x 60...", "easyfarma"],
    ["Paracetamol Gotas 15ml", "salcobrand"],
    ["Amrodil 30 Mg/5ml 100 Ml", "easyfarma"],
  ];
  const graph = canonicalize(NAMES.map(([n, p]) => offer(n, p)));

  it("TODA oferta de entrada produce exactamente una oferta canónica (Gate A)", () => {
    expect(graph.offers).toHaveLength(NAMES.length);
    expect(new Set(graph.offers.map((o) => o.offerId)).size).toBe(NAMES.length);
  });

  it("la cadena oferta → producto → presentación → concepto está siempre íntegra (Gate B)", () => {
    for (const canonical of graph.offers) {
      const product = graph.products.get(canonical.productId);
      const presentation = graph.presentations.get(canonical.presentationId);
      const concept = graph.concepts.get(canonical.conceptId);
      expect(product).toBeDefined();
      expect(presentation).toBeDefined();
      expect(concept).toBeDefined();
      expect(product!.presentationId).toBe(canonical.presentationId);
      expect(presentation!.conceptId).toBe(canonical.conceptId);
      expect(product!.conceptId).toBe(canonical.conceptId);
    }
  });

  it("ninguna oferta con nombre truncado o sin evidencia se pierde", () => {
    const truncated = find(graph, "Omeprazol 20 mg x 60...");
    expect(truncated.conceptId).toMatch(/^CFM-C-/);
    expect(truncated.productId).toMatch(/^CFM-M-/);
  });

  it("no hay falsos merges: ningún par del mismo producto se contradice (Gate C)", () => {
    const byProduct = new Map<string, string[]>();
    for (const canonical of graph.offers) {
      const list = byProduct.get(canonical.productId) ?? [];
      list.push(canonical.rawName);
      byProduct.set(canonical.productId, list);
    }
    for (const names of byProduct.values()) {
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          expect(contradicts(names[i]!, names[j]!)).toBe(false);
        }
      }
    }
  });

  it("la provenance explica por qué una oferta llegó a su producto", () => {
    const canonical = find(graph, "Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml");
    expect(canonical.provenance.rawName).toBe("Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml");
    expect(canonical.provenance.legacyMatchKey).toBeTruthy();
    expect(canonical.provenance.resolution.concept.signature).toContain("ing=ambroxol");
    expect(canonical.provenance.resolution.product.signature).toContain("brand=muxol");
    expect(canonical.provenance.inferredFields.concentration).toBe("30 mg/5 ml");
  });

  it("conserva el nombre crudo y los cuatro canales de precio sin tocarlos", () => {
    const input = offer("Ambroxol 30mg/5ml Jarabe 100ml", "cruz-verde", {
      price: { store: 2390, online: 1990, cmr: 1790, sbpay: null, effective: 1790 },
    });
    const [canonical] = canonicalize([input]).offers;
    expect(canonical!.rawName).toBe(input.rawName);
    expect(canonical!.price).toEqual(input.price);
  });

  it("un concepto publica su vía y su nombre canónico construido", () => {
    const concept = graph.concepts.get(find(graph, "Ambroxol 30mg/5ml Jarabe 100ml").conceptId)!;
    expect(concept.route).toBe("oral");
    expect(concept.dosageForm).toBe("fluid-oral");
    expect(concept.canonicalName).not.toBe("Ambroxol 30mg/5ml Jarabe 100ml");
    expect(concept.atcCode).toBeNull();
  });

  it("acepta un corpus vacío sin romperse", () => {
    const empty = canonicalize([]);
    expect(empty.offers).toHaveLength(0);
    expect(empty.concepts.size).toBe(0);
  });
});
