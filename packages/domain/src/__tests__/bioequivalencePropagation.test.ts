import { describe, expect, it } from "vitest";
import type { PharmacySlug, ScrapedProduct } from "../types.js";
import { bioequivalenceKey, presentationKey } from "../commercialIdentity.js";
import { mergeDuplicates } from "../deduplication.js";
import { toMedicationResult } from "../pricing.js";

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 — casos adversariales de PROPAGACIÓN.
 *
 * Regla que fija este archivo: el estado de bioequivalencia de una oferta
 * NUNCA se copia a otra. Ni entre farmacias, ni entre presentaciones, ni entre
 * variantes comerciales, ni de un componente a una combinación.
 *
 * Hoy la garantía es estructural: `presentationKey` incluye
 * `|bio:true|false|unknown`, así que `mergeDuplicates` sólo puede agrupar
 * ofertas que ya coinciden en ese eje, y `buildResult` toma la bioequivalencia
 * de la oferta canónica —que por construcción tiene el mismo valor que todas
 * las demás del grupo—. Estos tests existen para que esa garantía deje de ser
 * un efecto lateral y pase a ser un contrato verificado: si una fase futura
 * saca `bio:` de `presentationKey` (Option D, paso 7 de la secuencia acordada
 * en el Gate 2), estos casos fallan y obligan a implementar la derivación
 * explícita del estado de grupo en vez de heredarlo del canónico.
 */

function scraped(overrides: Partial<ScrapedProduct> & { name: string }): ScrapedProduct {
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
    isBioequivalent: null,
    ...overrides,
  };
}

function offer(
  name: string,
  slug: PharmacySlug,
  isBioequivalent: boolean | null,
  extra: Partial<ScrapedProduct> = {}
) {
  return toMedicationResult(scraped({ name, isBioequivalent, ...extra }), slug, slug);
}

describe("Caso A — misma molécula y concentración, distinta forma farmacéutica", () => {
  it("comprimidos con evidencia positiva no contagian a los sobres sin evidencia", () => {
    const comprimidos = offer("Tapsin 1 g x 20 comprimidos", "ahumada", true);
    const sobres = offer("Tapsin 1 g x 20 sobres polvo para solución oral", "dr-simi", null);

    const merged = mergeDuplicates([comprimidos, sobres]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.canonicalName.includes("comprimidos"))!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.canonicalName.includes("sobres"))!.isBioequivalent).toBeNull();
  });
});

describe("Caso B — misma molécula, distinta concentración", () => {
  it("400 mg bioequivalente no vuelve bioequivalente al 600 mg", () => {
    const mg400 = offer("Ibuprofeno 400 mg x 20 comprimidos", "ahumada", true);
    const mg600 = offer("Ibuprofeno 600 mg x 20 comprimidos", "cruz-verde", null);

    const merged = mergeDuplicates([mg400, mg600]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.matchKey.includes("400mg"))!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.matchKey.includes("600mg"))!.isBioequivalent).toBeNull();
  });
});

describe("Caso C — misma molécula y concentración, distinta cantidad", () => {
  it("x30 bioequivalente no propaga a x60: son presentaciones distintas y `matchKey` ya las separa", () => {
    // Evidencia real que respalda NO propagar (AraucoMed, 2026-08-30): el mismo
    // Omeprazol 20 mg de Ascend está catalogado como "Bioequivalentes" en su
    // presentación x60 y como "Antiulcerosos" en la x30. La certificación de
    // bioequivalencia del ISP se otorga por presentación registrada, no por
    // molécula, así que la cantidad no es un detalle cosmético.
    const x30 = offer("Omeprazol 20 mg x 30 cápsulas", "ecofarmacias", true);
    const x60 = offer("Omeprazol 20 mg x 60 cápsulas", "ecofarmacias", null);

    const merged = mergeDuplicates([x30, x60]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.matchKey.endsWith("|30"))!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.matchKey.endsWith("|60"))!.isBioequivalent).toBeNull();
  });
});

describe("Caso D — mismo principio activo, distinto laboratorio/marca", () => {
  it("Ascend bioequivalente no vuelve bioequivalente al de CuraeSpring", () => {
    const ascend = offer("Omeprazol 20 mg x 30 cápsulas", "ecofarmacias", true, {
      laboratory: "Ascend",
    });
    const curae = offer("Omeprazol 20 mg x 30 cápsulas", "farmex", null, {
      laboratory: "Curae Spring",
    });

    const merged = mergeDuplicates([ascend, curae]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.laboratory === "Ascend")!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.laboratory === "Curae Spring")!.isBioequivalent).toBeNull();
  });
});

describe("Caso E — combinaciones", () => {
  it("una combinación no hereda la bioequivalencia de su monofármaco", () => {
    const mono = offer("Losartán 50 mg x 30 comprimidos", "ahumada", true);
    const combo = offer("Losartán 50 mg / Hidroclorotiazida 12,5 mg x 30 comprimidos", "cruz-verde", null);

    const merged = mergeDuplicates([mono, combo]);

    expect(merged).toHaveLength(2);
    const comboCard = merged.find((m) => m.presentationKey.includes("|combo:"))!;
    expect(comboCard.isBioequivalent).toBeNull();
    expect(merged.find((m) => !m.presentationKey.includes("|combo:"))!.isBioequivalent).toBe(true);
  });

  it("dos combinaciones distintas no comparten estado aunque compartan el primer principio activo", () => {
    const conHidro = offer("Losartán 50 mg / Hidroclorotiazida 12,5 mg x 30 comprimidos", "ahumada", true);
    const conAmlo = offer("Losartán 50 mg / Amlodipino 5 mg x 30 comprimidos", "cruz-verde", null);

    const merged = mergeDuplicates([conHidro, conAmlo]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.canonicalName.includes("Hidroclorotiazida"))!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.canonicalName.includes("Amlodipino"))!.isBioequivalent).toBeNull();
  });
});

describe("Caso D-bis — variante comercial dentro de la misma familia de marca", () => {
  it("Tapsin Forte bioequivalente no contagia a Tapsin Migraña", () => {
    const forte = offer("Tapsin Forte x 30 comprimidos", "ahumada", true, { laboratory: "Maver" });
    const migrana = offer("Tapsin Migraña x 30 comprimidos", "farmex", null, { laboratory: "Maver" });

    const merged = mergeDuplicates([forte, migrana]);

    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.presentationKey.includes("var:forte"))!.isBioequivalent).toBe(true);
    expect(merged.find((m) => m.presentationKey.includes("var:migrana"))!.isBioequivalent).toBeNull();
  });
});

describe("Caso F — una farmacia confirma, la otra no informa", () => {
  it("la ausencia de la segunda no borra la evidencia de la primera", () => {
    const confirma = offer("Amoxicilina 500 mg x 21 cápsulas", "ecofarmacias", true);
    const noInforma = offer("Amoxicilina 500 mg x 21 cápsulas", "cruz-verde", null);

    const merged = mergeDuplicates([confirma, noInforma]);

    // Con `bio:` todavía dentro de `presentationKey`, la evidencia positiva
    // sigue viviendo en su propia tarjeta y NO se propaga a la otra: es
    // exactamente lo que exige la regla. El costo conocido es la tarjeta
    // duplicada (Problema B del Gate 1), que se resuelve en el paso de
    // `presentationKey` — no acá, y no propagando el flag.
    expect(merged).toHaveLength(2);
    const confirmada = merged.find((m) => m.isBioequivalent === true);
    const desconocida = merged.find((m) => m.isBioequivalent === null);
    expect(confirmada).toBeDefined();
    expect(desconocida).toBeDefined();
    expect(desconocida!.isBioequivalent).not.toBe(false);
    expect(merged.some((m) => m.isBioequivalent === false)).toBe(false);
  });
});

describe("Caso G — contradicción explícita entre fuentes", () => {
  it("true y false para la misma identidad NUNCA se resuelven con un OR silencioso", () => {
    // Dr. Simi es hoy la única fuente con evidencia negativa explícita
    // (`Bioequivalente: ["NO"]`), así que es la única que puede generar este
    // caso. No se observó en producción (10 búsquedas, 843 identidades,
    // 2026-08-30: cero contradicciones true/false), pero es estructuralmente
    // posible y debe quedar congelado.
    const afirma = offer("Amoxicilina 500 mg x 21 cápsulas", "ahumada", true);
    const niega = offer("Amoxicilina 500 mg x 21 cápsulas", "dr-simi", false);

    const merged = mergeDuplicates([afirma, niega]);

    // Dos tarjetas: cada fuente conserva su propia afirmación. Nadie gana.
    expect(merged).toHaveLength(2);
    expect(merged.find((m) => m.isBioequivalent === true)!.prices[0].pharmacySlug).toBe("ahumada");
    expect(merged.find((m) => m.isBioequivalent === false)!.prices[0].pharmacySlug).toBe("dr-simi");
    // La contradicción es visible en la clave, no escondida detrás de un merge.
    expect(new Set(merged.map((m) => m.presentationKey)).size).toBe(2);
  });

  it("`unknown` no rompe la contradicción ni la resuelve", () => {
    const afirma = offer("Amoxicilina 500 mg x 21 cápsulas", "ahumada", true);
    const niega = offer("Amoxicilina 500 mg x 21 cápsulas", "dr-simi", false);
    const calla = offer("Amoxicilina 500 mg x 21 cápsulas", "cruz-verde", null);

    const merged = mergeDuplicates([afirma, niega, calla]);

    expect(merged).toHaveLength(3);
    expect(merged.map((m) => bioequivalenceKey(m.isBioequivalent)).sort()).toEqual([
      "false",
      "true",
      "unknown",
    ]);
  });
});

describe("Caso H — ninguna fuente informa", () => {
  it("el resultado es `unknown`, jamás `false`", () => {
    const a = offer("Atorvastatina 20 mg x 30 comprimidos", "cruz-verde", null);
    const b = offer("Atorvastatina 20 mg x 30 comprimidos", "farmex", null);
    const c = offer("Atorvastatina 20 mg x 30 comprimidos", "easyfarma", null);

    const merged = mergeDuplicates([a, b, c]);

    expect(merged).toHaveLength(1);
    expect(merged[0].isBioequivalent).toBeNull();
    expect(merged[0].isBioequivalent).not.toBe(false);
    expect(merged[0].presentationKey).toContain("|bio:unknown");
    expect(merged[0].prices).toHaveLength(3);
  });
});

describe("Invariante de merge — la tarjeta nunca inventa un estado que ninguna oferta tenía", () => {
  it("todas las ofertas fusionadas comparten el eje de bioequivalencia de la tarjeta", () => {
    const a = offer("Atorvastatina 20 mg x 30 comprimidos", "ecofarmacias", true);
    const b = offer("Atorvastatina 20 mg x 30 comprimidos", "sermecoop", true);
    const c = offer("Atorvastatina 20 mg x 30 comprimidos", "cruz-verde", null);

    for (const card of mergeDuplicates([a, b, c])) {
      expect(card.presentationKey).toContain(`|bio:${bioequivalenceKey(card.isBioequivalent)}`);
    }
  });

  it("`bioequivalenceKey` mantiene los tres estados separados y no colapsa null en false", () => {
    expect(bioequivalenceKey(true)).toBe("true");
    expect(bioequivalenceKey(false)).toBe("false");
    expect(bioequivalenceKey(null)).toBe("unknown");
    expect(bioequivalenceKey(undefined)).toBe("unknown");

    const base = { matchKey: "paracetamol|500mg|16", commercialIdentity: "unknown" };
    const keys = [null, false, true].map((isBioequivalent) =>
      presentationKey({ ...base, isBioequivalent })
    );
    expect(new Set(keys).size).toBe(3);
  });
});
