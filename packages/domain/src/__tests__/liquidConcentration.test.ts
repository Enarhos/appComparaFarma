/**
 * CF-SEARCH-003 — Concentración farmacológica en formas líquidas.
 *
 * Defecto original (CF-QA-001, caso QA-SEARCH-001): `matchKey()` prioriza el
 * mililitro sobre el miligramo, así que en un jarabe conserva el VOLUMEN DEL
 * ENVASE y descarta la CONCENTRACIÓN. "Ambroxol 30 mg/5 mL Jarabe 100 mL" y
 * "Ambroxol 15 mg/5 mL Jarabe 100 mL" comparten `ambroxol|100ml`, y la tarjeta
 * presentaba el doble de potencia a mitad de precio como si fuera un ahorro.
 *
 * Todos los nombres son literales del catálogo real (`GET
 * https://comparafarma-api.vercel.app/api/search`, read-only; captura de
 * CF-QA-001 en `docs/qa/search-product-identity/raw/`) salvo los marcados como
 * SINTÉTICO, que replican el formato de nombres reales para ejercitar
 * equivalencias tipográficas que hoy no coexisten en una misma tarjeta.
 *
 * Estructura:
 *   1. Extracción de concentración          (unitario)
 *   2. Concentración ≠ volumen del envase   (unitario, separación conceptual)
 *   3. Equivalencia de escrituras           (unitario)
 *   4. Política explícita vs ausente        (unitario)
 *   5. Compatibilidad de identidad          (unitario, vía isSameProduct)
 *   6. Los 5 falsos merges de CF-QA-001     (integración, vía mergeDuplicates)
 *   7. No-regresión de sólidos y otros ejes
 */
import { describe, expect, it } from "vitest";
import { matchKey } from "../matching.js";
import { mergeDuplicates } from "../deduplication.js";
import { toMedicationResult, toProductIdentity } from "../pricing.js";
import {
  isCompatibleConcentration,
  isSameProduct,
  liquidConcentration,
} from "../productIdentity.js";
import { concentrationKey } from "../concentration.js";
import type { MedicationResult, PharmacySlug, ScrapedProduct } from "../types.js";

function scraped(over: Partial<ScrapedProduct> & { name: string }): ScrapedProduct {
  return {
    price: 1000,
    onlinePrice: null,
    cmrPrice: null,
    sbpayPrice: null,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: null,
    imageUrl: null,
    laboratory: null,
    isBioequivalent: false,
    ...over,
  };
}

function offer(
  slug: PharmacySlug,
  over: Partial<ScrapedProduct> & { name: string }
): MedicationResult {
  return toMedicationResult(scraped(over), slug, slug);
}

/**
 * Fuerza a que varias ofertas compartan `presentationKey`. En los casos reales
 * de este ticket NO es un artificio: las ofertas ya comparten clave en
 * producción (es la causa del defecto). Se aplica igual para que el test no
 * dependa de que `matchKey` siga derivando exactamente el mismo volumen.
 */
function inSameGroup(results: MedicationResult[]): MedicationResult[] {
  const key = results[0].presentationKey;
  return results.map((result) => ({ ...result, presentationKey: key }));
}

/** Nombres de las ofertas de cada tarjeta resultante, para aserciones legibles. */
function cardsOf(results: MedicationResult[]): string[][] {
  return results
    .map((card) => card.prices.map((price) => price.productName).sort())
    .sort((a, b) => a[0].localeCompare(b[0]));
}

const key = (name: string): string | null => {
  const concentration = liquidConcentration(name);
  return concentration === null ? null : concentrationKey(concentration);
};

// ---------------------------------------------------------------------------
// 1. EXTRACCIÓN DE CONCENTRACIÓN
// ---------------------------------------------------------------------------
describe("liquidConcentration — razón masa/volumen", () => {
  it("lee la razón explícita de los nombres reales del catálogo", () => {
    expect(key("Ambroxol 30mg/5ml Jarabe 100ml")).toBe("30mg/5ml");
    expect(key("Ambroxol 15 mg/5mL Jarabe 100 mL")).toBe("15mg/5ml");
    expect(key("Ibuprofeno 100 mg/5mL Suspensión 100 mL")).toBe("100mg/5ml");
    expect(key("Ibuprofeno Suspensión Oral 200mg/5ml 100ml Ascend")).toBe("200mg/5ml");
    expect(key("Ambroxol Jarabe Adultos 30 mg / 5 mL x 100 mL")).toBe("30mg/5ml");
    expect(key("Pyriped (ibuprofeno) 100mg/5ml Jarabe 100ml")).toBe("100mg/5ml");
  });

  it("lee la razón con denominador implícito ('0,5 mg/ml' ≡ 0,5 mg por 1 ml)", () => {
    expect(key("Cidoten 0,5 Mg/ml (betametasona) Gotas X 30 Ml")).toBe("0.5mg/1ml");
    expect(key("Betametasona 4 mg/ml Solución Inyectable Caja 5 Ampollas BIOSANO")).toBe("4mg/1ml");
  });

  it("encuentra la razón aunque no sea la primera magnitud del nombre", () => {
    // El volumen del envase va primero; `parseConcentration` devolvería 100 ml.
    expect(key("Ambroxol Jarabe 100 ml 15 mg/5 ml")).toBe("15mg/5ml"); // SINTÉTICO
  });

  it("acepta la abreviatura con punto que usa Ahumada", () => {
    expect(key("Ambroxol 30mg./5ml. Jarabe Fco. 100ml")).toBe("30mg/5ml");
  });

  it("acepta el separador 'cada'", () => {
    expect(key("Ambroxol 30 mg cada 5 ml jarabe 100 ml")).toBe("30mg/5ml"); // SINTÉTICO
  });

  it("no confunde la razón masa/masa de una combinación con una concentración", () => {
    expect(liquidConcentration("Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30")).toBeNull();
    expect(liquidConcentration("Hyzaar 50 mg/12.5 mg x 30 Comprimidos Recubiertos")).toBeNull();
  });

  it("no lee 'mcg/Dosis' como concentración: 'dosis' no es una unidad de volumen", () => {
    expect(
      liquidConcentration("Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral FAES FARMA CHILE")
    ).toBeNull();
  });
});

describe("liquidConcentration — masa absoluta declarada junto a un volumen", () => {
  it("acepta la masa absoluta cuando el nombre también declara un volumen", () => {
    // Quinto falso merge de CF-QA-001: ninguna de las dos fuentes escribe la razón.
    expect(key("Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)")).toBe("0.25mg");
    expect(key("Cam Betametasona 2 mg Jarabe 120 mL")).toBe("2mg");
  });

  it("acepta la masa absoluta cuando la farmacia omite la barra", () => {
    expect(key("Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO")).toBe("30mg");
    expect(key("MUXOL JARABE ADULTO Ambroxol Clorhidrato 600 mg 100 ml")).toBe("600mg");
  });

  it("NO infiere una razón a partir de la yuxtaposición masa + volumen", () => {
    // "30 mg 100 ml" es 30 mg/5 mL envasado en 100 mL, no 30 mg/100 mL. Leerlo
    // como razón inventaría una concentración 20 veces menor.
    expect(key("Ambroxol clorhidrato 30mg 100ml Ascend DESCUENTO")).toBe("30mg");
  });

  it("ignora la masa cuando el nombre no declara ningún volumen", () => {
    expect(liquidConcentration("Paracetamol 500 mg x 16")).toBeNull();
    expect(liquidConcentration("Aspirina 500 mg Adulto x 40 Comprimidos")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. CONCENTRACIÓN Y VOLUMEN DE ENVASE SON CONCEPTOS SEPARADOS
// ---------------------------------------------------------------------------
describe("concentración ≠ volumen del envase", () => {
  it("el volumen del envase nunca se lee como concentración", () => {
    expect(key("Ambroxol 30mg/5ml Jarabe 100ml")).toBe("30mg/5ml");
    expect(key("Ambroxol 30mg/5ml Jarabe 60ml")).toBe("30mg/5ml"); // SINTÉTICO
    expect(liquidConcentration("Cidoten Gotas x 30 ml")).toBeNull();
    expect(liquidConcentration("Alledryl (loratadina) Jarabe 60ml")).toBeNull();
  });

  it("CASO 4 — misma concentración en dos envases distintos: compatible", () => {
    const a = liquidConcentration("Ambroxol 30mg/5ml Jarabe 100ml");
    const b = liquidConcentration("Ambroxol 30mg/5ml Jarabe 60ml"); // SINTÉTICO
    expect(concentrationKey(a!)).toBe(concentrationKey(b!));
    expect(isCompatibleConcentration(a, b)).toBe(true);

    // El tamaño del envase sigue gobernado por `matchKey`, que es el eje que
    // corresponde — este eje no lo duplica ni lo reemplaza.
    expect(matchKey("Ambroxol 30mg/5ml Jarabe 100ml")).not.toBe(
      matchKey("Ambroxol 30mg/5ml Jarabe 60ml")
    );
  });

  it("mismo envase y distinta concentración: incompatible", () => {
    expect(
      isCompatibleConcentration(
        liquidConcentration("Ambroxol 30mg/5ml Jarabe 100ml"),
        liquidConcentration("Ambroxol 15 mg/5mL Jarabe 100 mL")
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. ESCRITURAS EQUIVALENTES
// ---------------------------------------------------------------------------
describe("equivalencia de escrituras", () => {
  const sameConcentration = (a: string, b: string) =>
    isCompatibleConcentration(liquidConcentration(a), liquidConcentration(b));

  it("CASO 3 — '30mg/5ml' ≡ '30 mg / 5 mL'", () => {
    expect(sameConcentration("Ambroxol 30mg/5ml jarabe 100ml", "Ambroxol 30 mg / 5 mL x 100 mL")).toBe(true);
  });

  it("CASO 5 — '2mg/ml' ≡ '2mg/mL'", () => {
    expect(sameConcentration("Gotas 2mg/ml frasco 30 ml", "Gotas 2mg/mL frasco 30 ml")).toBe(true); // SINTÉTICO
  });

  it("CASO 6 — '0.25mg/ml' ≡ '0,25mg/ml' (coma decimal)", () => {
    expect(sameConcentration("Gotas 0.25mg/ml 30 ml", "Gotas 0,25mg/ml 30 ml")).toBe(true); // SINTÉTICO
  });

  it("todas las grafías reales del catálogo derivan la misma concentración", () => {
    // Las 12 formas tipográficas masa→volumen contadas sobre los 2.255 nombres
    // únicos de la captura de CF-QA-001.
    for (const name of [
      "Ambroxol 30mg/5ml Jarabe 100ml",
      "Ambroxol 30 mg/5 ml Jarabe 100 ml",
      "Ambroxol 30 mg / 5 ml Jarabe 100 ml",
      "Ambroxol 30 mg/ 5 ml Jarabe 100 ml",
      "Ambroxol 30mg/ 5 ml Jarabe 100 ml",
      "Ambroxol 30 mg /5ml Jarabe 100 ml",
      "Ambroxol 30 mg/5ml. Jarabe 100 ml",
      "Ambroxol 30mg./5ml. Jarabe Fco. 100ml",
      "Ambroxol 30mg/5ml. Jarabe 100 ml",
    ]) {
      expect(key(name)).toBe("30mg/5ml");
    }
  });

  it("se compara por RAZÓN, no por literal: 600 mg/100 ml ≡ 30 mg/5 mL ≡ 6 mg/ml", () => {
    // Tres escrituras reales del mismo jarabe de Ambroxol en tres farmacias.
    expect(sameConcentration("Muxol Jarabe Adulto Ambroxol 600 mg / 100 ml", "Muxol Adulto 30mg/5ml jarabe 100ml")).toBe(true);
    expect(sameConcentration("Muxol Jarabe Adulto Ambroxol 600 mg / 100 ml", "Muxol 6 mg/ml jarabe 100 ml")).toBe(true); // SINTÉTICO
    // Y la pediátrica (300 mg/100 ml ≡ 15 mg/5 mL) NO es la misma.
    expect(sameConcentration("Muxol Jarabe Pediátrico Ambroxol 300 mg / 100 ml", "Muxol Adulto 30mg/5ml jarabe 100ml")).toBe(false);
    expect(sameConcentration("Muxol Jarabe Pediátrico Ambroxol 300 mg / 100 ml", "Muxol (ambroxol) 15mg/5ml Jarabe 100ml")).toBe(true);
  });

  it("convierte entre unidades de la misma familia: 0,5 g/5 ml ≡ 500 mg/5 ml", () => {
    expect(sameConcentration("Amoxicilina 0,5 g/5 ml suspensión 60 ml", "Amoxicilina 500 mg/5 ml suspensión 60 ml")).toBe(true); // SINTÉTICO
    expect(sameConcentration("Amoxicilina 2 gr / 5 ml suspensión 60 ml", "Amoxicilina 2000 mg/5 ml suspensión 60 ml")).toBe(true); // SINTÉTICO
  });
});

// ---------------------------------------------------------------------------
// 4. POLÍTICA EXPLÍCITA VS AUSENTE
// ---------------------------------------------------------------------------
describe("isCompatibleConcentration — política", () => {
  const c = (name: string) => liquidConcentration(name);

  it("dos razones explícitas y distintas son incompatibles", () => {
    expect(isCompatibleConcentration(c("A 30mg/5ml 100ml"), c("A 15mg/5ml 100ml"))).toBe(false);
  });

  it("dos masas absolutas explícitas y distintas son incompatibles", () => {
    expect(
      isCompatibleConcentration(
        c("Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)"),
        c("Cam Betametasona 2 mg Jarabe 120 mL")
      )
    ).toBe(false);
  });

  it("la ausencia es compatible con cualquier concentración (comodín)", () => {
    expect(isCompatibleConcentration(null, c("A 30mg/5ml 100ml"))).toBe(true);
    expect(isCompatibleConcentration(c("A 30mg/5ml 100ml"), null)).toBe(true);
    expect(isCompatibleConcentration(null, null)).toBe(true);
    // Caso real: EasyFarma trunca el nombre y no declara concentración.
    expect(
      isCompatibleConcentration(
        c("Alledryl-D jarabe 120 mL"),
        c("Alledryl-D Loratadina 15 mg/5ml Jarabe 120 mL")
      )
    ).toBe(true);
  });

  it("una razón y una masa absoluta son niveles de detalle distintos, no una contradicción", () => {
    // Mismo producto escrito con y sin barra por dos farmacias.
    expect(
      isCompatibleConcentration(
        c("Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO"),
        c("Ambroxol 30mg/5ml Jarabe 100ml")
      )
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. COMPATIBILIDAD DE IDENTIDAD
// ---------------------------------------------------------------------------
describe("isSameProduct — eje de concentración", () => {
  it("expone la concentración como eje propio de ProductIdentity", () => {
    const identity = toProductIdentity(scraped({ name: "Ambroxol 30mg/5ml Jarabe 100ml" }));
    expect(identity.concentration).not.toBeNull();
    expect(concentrationKey(identity.concentration!)).toBe("30mg/5ml");
    // El volumen del envase sigue viviendo en `pharmacologicalKey`, no acá.
    expect(identity.pharmacologicalKey).toContain("100ml");
  });

  it("rechaza dos ofertas de concentración explícita distinta", () => {
    const a = toProductIdentity(scraped({ name: "Ambroxol 30mg/5ml Jarabe 100ml" }));
    const b = toProductIdentity(scraped({ name: "Ambroxol 15 mg/5mL Jarabe 100 mL" }));
    expect(isSameProduct(a, b)).toBe(false);
  });

  it("acepta dos escrituras distintas de la misma concentración", () => {
    const a = toProductIdentity(scraped({ name: "Ambroxol 30mg/5ml Jarabe 100ml" }));
    const b = toProductIdentity(scraped({ name: "Ambroxol 30mg./5ml. Jarabe 100ml" }));
    expect(isSameProduct(a, b)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. LOS 5 FALSOS MERGES DE CF-QA-001
// ---------------------------------------------------------------------------
describe("mergeDuplicates — falsos merges de CF-QA-001 (regresión con datos reales)", () => {
  it("CASO 1 — Ambroxol 30mg/5ml vs 15mg/5ml no comparten tarjeta", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("ecofarmacias", { name: "Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO", price: 990 }),
        offer("sermecoop", { name: "Ambroxol 30mg/5ml Jarabe 100ml", price: 2390 }),
        offer("ahumada", { name: "Ambroxol 30mg./5ml. Jarabe Fco. 100ml", price: 3374 }),
        offer("cruz-verde", { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", price: 5490 }),
      ])
    );

    expect(cardsOf(merged)).toEqual([
      ["Ambroxol 15 mg/5mL Jarabe 100 mL"],
      [
        "Ambroxol 30mg./5ml. Jarabe Fco. 100ml",
        "Ambroxol 30mg/5ml Jarabe 100ml",
        "Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO",
      ],
    ]);
  });

  it("CASO 2 — Ibuprofeno 200mg/5ml vs 100mg/5ml no comparten tarjeta", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("ecofarmacias", { name: "Ibuprofeno Suspensión Oral 200mg/5ml 100ml Ascend", price: 1890 }),
        offer("sermecoop", { name: "Ibuprofeno 200mg/5ml Jarabe 100ml", price: 2790 }),
        offer("cruz-verde", { name: "Ibuprofeno 100 mg/5mL Suspensión 100 mL", price: 3140 }),
        offer("salcobrand", { name: "Ibuprofeno 200mg/5ml Jarabe 100ml", price: 4599 }),
      ])
    );

    const cards = cardsOf(merged);
    expect(cards).toHaveLength(2);
    expect(cards).toContainEqual(["Ibuprofeno 100 mg/5mL Suspensión 100 mL"]);
  });

  it("CASO Muxol — 30mg/5ml vs 15mg/5ml no comparten tarjeta", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("araucomed", { name: "Muxol Adulto 30mg/5ml jarabe 100ml", price: 3990 }),
        offer("sermecoop", { name: "Muxol (ambroxol) 15mg/5ml Jarabe 100ml", price: 4890 }),
      ])
    );
    expect(merged).toHaveLength(2);
  });

  it("CASO Pyriped — 200mg/5ml vs 100mg/5ml no comparten tarjeta", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("sermecoop", { name: "Pyriped (ibuprofeno) 100mg/5ml Jarabe 100ml", price: 2990 }),
        offer("ecofarmacias", { name: "Pyriped Ibuprofeno Suspension Oral 200mg/5ml 100ml", price: 3990 }),
        offer("cruz-verde", { name: "Pyriped Ibuprofeno 100 mg/5mL Suspensión 100 mL", price: 8040 }),
      ])
    );

    expect(cardsOf(merged)).toEqual([
      ["Pyriped (ibuprofeno) 100mg/5ml Jarabe 100ml", "Pyriped Ibuprofeno 100 mg/5mL Suspensión 100 mL"],
      ["Pyriped Ibuprofeno Suspension Oral 200mg/5ml 100ml"],
    ]);
  });

  it("CASO Cam/Betametasona — 0,25 mg vs 2 mg (factor 8) no comparten tarjeta", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("ecofarmacias", { name: "Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)", price: 9980 }),
        offer("cruz-verde", { name: "Cam Betametasona 2 mg Jarabe 120 mL", price: 14790 }),
      ])
    );
    expect(merged).toHaveLength(2);
  });

  it("la tarjeta es internamente consistente aunque la canónica no declare concentración", () => {
    // Garantía del recorrido por TODAS las ofertas aceptadas: si la oferta que
    // representa la tarjeta es la que calla, dos ofertas contradictorias entre
    // sí no pueden entrar las dos por ser cada una compatible con ella.
    const merged = mergeDuplicates(
      inSameGroup([
        offer("easyfarma", { name: "Ambroxol jarabe 100 ml", price: 500 }), // SINTÉTICO: nombre truncado
        offer("sermecoop", { name: "Ambroxol 30mg/5ml Jarabe 100ml", price: 2390 }),
        offer("cruz-verde", { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", price: 5490 }),
      ])
    );

    for (const card of merged) {
      const concentrations = card.prices
        .map((price) => liquidConcentration(price.productName))
        .filter((value): value is NonNullable<typeof value> => value !== null);
      for (const a of concentrations) {
        for (const b of concentrations) {
          expect(isCompatibleConcentration(a, b)).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. NO-REGRESIÓN
// ---------------------------------------------------------------------------
describe("no-regresión — el eje no toca lo que no le corresponde", () => {
  it("la dosis de un sólido no se lee como concentración líquida", () => {
    for (const name of [
      "Paracetamol 500 mg x 20 comprimidos",
      "Paracetamol 500 mg x 10 cápsulas",
      "Diclofenaco 50 mg 5 supositorios",
      "Aspirina Forte 650mg x80com.",
      "Salbutamol 100mcg Inhalador",
      "Tapsin SC Paracetamol 1 gr x 20 Comprimidos",
    ]) {
      expect(liquidConcentration(name)).toBeNull();
    }
  });

  it("dos sólidos de la misma dosis siguen fusionando", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("farmex", { name: "Aspirina 500 mg x 40 comprimidos", price: 2970 }),
        offer("ecofarmacias", { name: "Aspirina 500 mg Adulto x 40 Comprimidos", price: 1000 }),
      ])
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("dos líquidos de la misma concentración escrita distinto siguen fusionando", () => {
    // 600 mg/100 ml ≡ 30 mg/5 mL. Los dos nombres coinciden en TODOS los demás
    // ejes (`muxol|100ml`, `var:ambroxol`, `form:fluid-oral`, sin cantidad ni
    // combinación), así que la única variable en juego es la concentración.
    const merged = mergeDuplicates(
      inSameGroup([
        offer("cruz-verde", { name: "Muxol Jarabe Adulto Ambroxol 600 mg / 100 ml", price: 4590 }),
        offer("araucomed", { name: "Muxol Jarabe Adulto Ambroxol 30 mg / 5 mL 100 mL", price: 3990 }), // SINTÉTICO
      ])
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("un líquido que declara concentración sigue fusionando con uno que no la declara", () => {
    const merged = mergeDuplicates(
      inSameGroup([
        offer("sermecoop", { name: "Alledryl (loratadina) Jarabe 60ml", price: 6890 }),
        offer("cruz-verde", { name: "Alledryl Loratadina 5 mg / 5 mL Jarabe 60 mL", price: 9990 }),
      ])
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("`matchKey` no cambia por este eje", () => {
    expect(matchKey("Ambroxol 30mg/5ml Jarabe 100ml")).toBe("ambroxol|100ml");
    expect(matchKey("Ambroxol 15 mg/5mL Jarabe 100 mL")).toBe("ambroxol|100ml");
    expect(matchKey("Paracetamol 500 mg x 16")).toBe("paracetamol|500mg|16");
  });

  it("`presentationKey` no incorpora la concentración", () => {
    const a = offer("sermecoop", { name: "Ambroxol 30mg/5ml Jarabe 100ml" });
    const b = offer("cruz-verde", { name: "Ambroxol 15 mg/5mL Jarabe 100 mL" });
    // Deliberado: la clave NO se rota (los slugs de ficha de Web se derivan de
    // ella). La separación ocurre en `mergeDuplicates`, igual que la de
    // cantidad — ver M/N del informe y `docs/qa/cf-search-003/`.
    expect(a.presentationKey).toBe(b.presentationKey);
  });
});
