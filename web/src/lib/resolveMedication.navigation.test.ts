/**
 * CF-WEB-002 — INVARIANTE DE NAVEGACIÓN
 *
 *   Para todo `MedicationResult` R que una búsqueda Web emite:
 *     resolveMedicationBySlug(buildMedicationSlug(R))
 *   debe resolver R —o una representación SAME_PRODUCT inequívocamente
 *   equivalente— y NUNCA otro producto.
 *
 * A diferencia de `resolveMedication.test.ts` (que verifica cada generación de
 * hash con fixtures armadas a mano), esta suite construye los resultados con el
 * PIPELINE REAL del dominio —`toMedicationResult()` + `mergeDuplicates()`— a
 * partir de nombres de producto tomados de la captura de producción de
 * `docs/qa/cf-web-002/raw/`. Es lo que permite reproducir el defecto real: las
 * tarjetas que rompían la navegación no se pueden inventar a mano, las produce
 * `mergeDuplicates` al separar dos ofertas por un eje que vive FUERA de
 * `presentationKey` (cantidad y concentración), dejando dos tarjetas distintas
 * con la MISMA clave y, por lo tanto, el mismo hash de slug.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult, PharmacySlug, ScrapedProduct } from "@comparafarma/domain";
import {
  isSameProduct,
  liquidConcentration,
  mergeDuplicates,
  toMedicationResult,
  toProductIdentity,
} from "@comparafarma/domain";
import { buildMedicationSlug, shortHash } from "@/lib/medicationSlug";
import { resolveMedicationBySlug, retrievalQueriesForSlug } from "./resolveMedication";

const searchMedicationsMock = vi.fn();

vi.mock("@/lib/search", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
}));

beforeEach(() => {
  searchMedicationsMock.mockReset();
});

interface OfferSpec {
  name: string;
  pharmacy: PharmacySlug;
  price: number;
  laboratory?: string | null;
  isBioequivalent?: boolean | null;
}

function scraped(spec: OfferSpec): ScrapedProduct {
  return {
    name: spec.name,
    price: spec.price,
    onlinePrice: null,
    cmrPrice: null,
    sbpayPrice: null,
    hasStock: true,
    hasOnlineDelivery: true,
    onlineUrl: `https://example.test/${encodeURIComponent(spec.name)}`,
    imageUrl: null,
    laboratory: spec.laboratory ?? null,
    isBioequivalent: spec.isBioequivalent ?? null,
  };
}

/** Las tarjetas que la página de resultados mostraría para estas ofertas. */
function cardsFor(offers: OfferSpec[]): MedicationResult[] {
  return mergeDuplicates(
    offers.map((offer) => toMedicationResult(scraped(offer), offer.pharmacy, offer.pharmacy))
  ).sort((a, b) => a.bestPrice - b.bestPrice);
}

/** Devuelve el mismo conjunto de tarjetas para cualquier consulta. */
function servingAll(cards: MedicationResult[]): void {
  searchMedicationsMock.mockResolvedValue({ results: cards, error: null });
}

/**
 * SAME_PRODUCT con el MISMO criterio del dominio (`isSameProduct`), el que
 * `deduplication.ts` usa para decidir si dos ofertas son el mismo artículo — no
 * un criterio propio del test. Se exige además igualdad de `presentationKey`.
 */
function expectSameProduct(actual: MedicationResult, expected: MedicationResult): void {
  expect(actual.presentationKey).toBe(expected.presentationKey);
  const identity = (card: MedicationResult) =>
    toProductIdentity(scraped({ name: card.canonicalName, pharmacy: "cruz-verde", price: 0, laboratory: card.laboratory, isBioequivalent: card.isBioequivalent }));
  expect(isSameProduct(identity(actual), identity(expected))).toBe(true);
}

/** Comprueba el invariante para TODAS las tarjetas de un conjunto de resultados. */
async function expectInvariantHolds(cards: MedicationResult[]): Promise<void> {
  for (const card of cards) {
    const resolution = await resolveMedicationBySlug(buildMedicationSlug(card));
    expect(
      resolution.status,
      `no resolvió: ${card.canonicalName} → ${buildMedicationSlug(card)}`
    ).toBe("ok");
    if (resolution.status !== "ok") continue;
    expectSameProduct(resolution.medication, card);
  }
}

// ---------------------------------------------------------------------------
// 1. Recuperación: con qué texto se vuelve a buscar el producto
// ---------------------------------------------------------------------------

describe("retrievalQueriesForSlug", () => {
  it("prueba primero la cabecera de marca y después el nombre completo", () => {
    // Caso real de CF-QA-001: el nombre completo se reduce a "tapsin noche
    // maver", que devuelve otro conjunto de productos y no incluye la tarjeta.
    expect(retrievalQueriesForSlug("tapsin-x-6-comprimidos-noche-maver")).toEqual([
      "tapsin",
      "tapsin x 6 comprimidos noche maver",
    ]);
  });

  it("no repite la consulta cuando la cabecera ya es el nombre completo", () => {
    expect(retrievalQueriesForSlug("ambroxol")).toEqual(["ambroxol"]);
  });

  it("usa la cabecera de dos tokens cortos que consume matchKey", () => {
    // `brandHeadTokens` toma el segundo token cuando ambos son cortos: sin eso,
    // "Trio Val" buscaría solo "trio".
    expect(retrievalQueriesForSlug("trio-val-500-mg-x-20")[0]).toBe("trio val");
  });

  it("no deja pasar una cabecera demasiado corta para /api/search", () => {
    // El endpoint responde 400 por debajo de 2 caracteres: la escalera debe
    // omitir ese intento en vez de gastarlo en un error garantizado.
    for (const query of retrievalQueriesForSlug("b-12-complejo-x-30")) {
      expect(query.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("recupera el producto cuando el nombre completo ya no lo encuentra", async () => {
    const target = cardsFor([
      { name: "Tapsin X 6 comprimidos Noche (Maver)", pharmacy: "araucomed", price: 1490 },
    ])[0];

    // Reproduce el mecanismo medido en producción: la consulta amplia lo trae,
    // la consulta derivada del nombre completo no.
    searchMedicationsMock.mockImplementation(async (query: string) =>
      query === "tapsin" ? { results: [target], error: null } : { results: [], error: null }
    );

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(target));

    expect(resolution.status).toBe("ok");
    expect(searchMedicationsMock).toHaveBeenCalledWith("tapsin");
  });

  it("no sigue buscando una vez que una consulta encontró candidatos", async () => {
    // Prohibido "reintentar hasta que quede uno solo": si la primera consulta
    // ya produjo candidatos, el resultado es el de esa consulta, ambiguo o no.
    const cards = cardsFor([
      { name: "Ambroxol 30mg/5ml Jarabe 100ml", pharmacy: "cruz-verde", price: 2990 },
      { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", pharmacy: "salcobrand", price: 1990 },
    ]);
    servingAll(cards);

    await resolveMedicationBySlug(buildMedicationSlug(cards[0]));

    expect(searchMedicationsMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 2. El invariante, sobre las tarjetas que el dominio realmente emite
// ---------------------------------------------------------------------------

describe("invariante de navegación", () => {
  it("resuelve cada tarjeta de una búsqueda al MISMO producto", async () => {
    const cards = cardsFor([
      { name: "Tapsin X 6 comprimidos Noche (Maver)", pharmacy: "araucomed", price: 1490 },
      { name: "Tapsin Forte tira x 6com", pharmacy: "farmex", price: 1890, laboratory: "Maver" },
      { name: "Tapsin Periodo x 12 comprimidos", pharmacy: "dr-simi", price: 2190 },
      { name: "Tapsin Instaflu Día Noche 6 Comprimidos", pharmacy: "ahumada", price: 3490 },
    ]);
    servingAll(cards);

    expect(cards.length).toBe(4);
    await expectInvariantHolds(cards);
  });

  it("mismo matchKey y distinta VARIANTE comercial: no se cruzan", async () => {
    const cards = cardsFor([
      { name: "Tapsin Forte x 6 comprimidos", pharmacy: "farmex", price: 1890, laboratory: "Maver" },
      { name: "Tapsin Noche x 6 comprimidos", pharmacy: "araucomed", price: 1490, laboratory: "Maver" },
    ]);
    servingAll(cards);

    expect(new Set(cards.map((c) => c.presentationKey)).size).toBe(2);
    await expectInvariantHolds(cards);

    const forte = cards.find((c) => c.canonicalName.includes("Forte"))!;
    const resolution = await resolveMedicationBySlug(buildMedicationSlug(forte));
    expect(resolution.status === "ok" && resolution.medication.canonicalName).toContain("Forte");
  });

  it("mismo matchKey y distinta CONCENTRACIÓN líquida: no se cruzan (CF-SEARCH-003)", async () => {
    // Caso exacto de producción (raw/baseline/ambroxol.json, 2026-08-31): las
    // dos tarjetas comparten `presentationKey` y por lo tanto el hash del slug.
    const cards = cardsFor([
      { name: "Ambroxol 30mg/5ml Jarabe 100ml", pharmacy: "cruz-verde", price: 2990 },
      { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", pharmacy: "salcobrand", price: 1990 },
    ]);
    servingAll(cards);

    expect(cards.length).toBe(2);
    expect(cards[0].presentationKey).toBe(cards[1].presentationKey);
    expect(shortHash(cards[0].presentationKey)).toBe(shortHash(cards[1].presentationKey));

    await expectInvariantHolds(cards);

    for (const card of cards) {
      const resolution = await resolveMedicationBySlug(buildMedicationSlug(card));
      expect(resolution.status).toBe("ok");
      if (resolution.status !== "ok") continue;
      expect(liquidConcentration(resolution.medication.canonicalName)).toEqual(
        liquidConcentration(card.canonicalName)
      );
    }
  });

  it("ibuprofeno 200mg/5mL y 100mg/5mL resuelven cada uno su propia ficha", async () => {
    const cards = cardsFor([
      { name: "Ibuprofeno 200mg/5ml Jarabe 100ml", pharmacy: "cruz-verde", price: 3290 },
      { name: "Ibuprofeno 100 mg/5mL Suspensión 100 mL", pharmacy: "ahumada", price: 2190 },
    ]);
    servingAll(cards);

    expect(cards[0].presentationKey).toBe(cards[1].presentationKey);
    await expectInvariantHolds(cards);
  });

  it("no cruza 0,25 mg con 2 mg del mismo jarabe (caso medido en producción)", async () => {
    // El peor caso encontrado en la línea base (analysis/baseline.json,
    // `RESOLVED_WRONG_PRODUCT`): el enlace de la tarjeta de 0,25 mg resolvía
    // SILENCIOSAMENTE —sin redirect, por la generación vigente— a la ficha de
    // 2 mg, ocho veces la concentración del mismo corticoide. Las dos tarjetas
    // comparten `presentationKey`, así que el hash no las distingue.
    const cards = cardsFor([
      { name: "Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)", pharmacy: "cruz-verde", price: 4990 },
      { name: "Cam Betametasona 2 mg Jarabe 120 mL", pharmacy: "ahumada", price: 5490 },
    ]);
    servingAll(cards);

    expect(cards[0].presentationKey).toBe(cards[1].presentationKey);

    const suave = cards.find((c) => c.canonicalName.includes("0,25"))!;
    const resolution = await resolveMedicationBySlug(buildMedicationSlug(suave));

    expect(resolution.status).toBe("ok");
    if (resolution.status !== "ok") return;
    expect(resolution.medication.canonicalName).toContain("0,25");
    expectSameProduct(resolution.medication, suave);
  });

  it("cantidad 1 vs 6 del mismo producto: no se cruzan", async () => {
    const cards = cardsFor([
      { name: "Tapsin Caliente Noche Sabor Limón Sobre de 5 g ( 1 sobre )", pharmacy: "farmex", price: 590 },
      { name: "Tapsin Compuesto Noche 5 g 6 Sobres Polvo para Solución Oral", pharmacy: "ahumada", price: 3290 },
    ]);
    servingAll(cards);

    expect(cards.length).toBe(2);
    await expectInvariantHolds(cards);
  });

  it("la misma presentación vista por varias farmacias resuelve a la tarjeta fusionada", async () => {
    const cards = cardsFor([
      { name: "Paracetamol 500 mg 16 comprimidos", pharmacy: "cruz-verde", price: 990, laboratory: "Andrómaco" },
      { name: "Paracetamol 500 mg 16 comprimidos", pharmacy: "salcobrand", price: 1190, laboratory: "Andrómaco" },
      { name: "Paracetamol 500 mg 16 comprimidos", pharmacy: "ahumada", price: 890, laboratory: "Andrómaco" },
    ]);
    servingAll(cards);

    expect(cards.length).toBe(1);
    expect(cards[0].prices).toHaveLength(3);
    await expectInvariantHolds(cards);
  });

  it("el orden de respuesta de las farmacias no cambia la identidad resuelta", async () => {
    const offers: OfferSpec[] = [
      { name: "Ambroxol 30mg/5ml Jarabe 100ml", pharmacy: "cruz-verde", price: 2990 },
      { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", pharmacy: "salcobrand", price: 1990 },
      { name: "Ambroxol 30 mg/5 mL Jarabe 100 mL", pharmacy: "ahumada", price: 2490 },
    ];
    const resolvedKeys: string[][] = [];

    for (const order of [offers, [...offers].reverse(), [offers[1], offers[2], offers[0]]]) {
      const cards = cardsFor(order);
      servingAll(cards);
      const keys: string[] = [];
      for (const card of cards) {
        const resolution = await resolveMedicationBySlug(buildMedicationSlug(card));
        expect(resolution.status).toBe("ok");
        if (resolution.status === "ok") {
          expectSameProduct(resolution.medication, card);
          keys.push(resolution.medication.presentationKey);
        }
      }
      resolvedKeys.push(keys.sort());
    }

    expect(resolvedKeys[1]).toEqual(resolvedKeys[0]);
    expect(resolvedKeys[2]).toEqual(resolvedKeys[0]);
  });

  it("un canonicalName distinto entre fuentes no rompe la resolución", async () => {
    // La tarjeta se genera con el nombre de una farmacia y se resuelve cuando
    // el nombre canónico pasó a ser el de otra (mismo producto, mismo
    // `presentationKey`): resuelve igual, por hash, sin depender del texto.
    const generated = cardsFor([
      { name: "Omeprazol 20 mg x 30 cápsulas", pharmacy: "easyfarma", price: 3990, laboratory: "Ascend" },
    ])[0];
    const laterCanonical = cardsFor([
      { name: "OMEPRAZOL 20MG X 30 CAPSULAS", pharmacy: "cruz-verde", price: 4290, laboratory: "Ascend" },
    ])[0];

    expect(laterCanonical.presentationKey).toBe(generated.presentationKey);
    expect(laterCanonical.canonicalName).not.toBe(generated.canonicalName);
    servingAll([laterCanonical]);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(generated));

    expect(resolution.status).toBe("ok");
    if (resolution.status !== "ok") return;
    expectSameProduct(resolution.medication, generated);
  });
});

// ---------------------------------------------------------------------------
// 3. Lo que NUNCA debe pasar
// ---------------------------------------------------------------------------

describe("un slug nunca resuelve silenciosamente otro producto", () => {
  it("no resuelve por compartir la primera palabra", async () => {
    const cards = cardsFor([
      { name: "Ibuprofeno 400 mg x 20 comprimidos", pharmacy: "cruz-verde", price: 1990 },
      { name: "Ibuprofeno 600 mg x 20 comprimidos", pharmacy: "salcobrand", price: 2490 },
      { name: "Ibuprofeno 200mg/5ml Jarabe 100ml", pharmacy: "ahumada", price: 3290 },
    ]);
    // El producto del enlace ya no está en el catálogo; sí están sus "primos".
    const missing = cardsFor([
      { name: "Ibuprofeno 800 mg x 20 comprimidos", pharmacy: "farmex", price: 3990 },
    ])[0];
    servingAll(cards);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(missing));

    expect(resolution.status).toBe("not-found");
  });

  it("no elige un ganador cuando dos productos siguen siendo indistinguibles", async () => {
    // Dos tarjetas con la MISMA clave y el MISMO nombre canónico: el slug ya no
    // identifica un producto. Se responde 404, nunca una de las dos.
    const a = cardsFor([{ name: "Ambroxol Jarabe 100ml", pharmacy: "cruz-verde", price: 2990 }])[0];
    const b: MedicationResult = { ...a, bestPharmacy: "salcobrand", bestPrice: 1990 };
    servingAll([a, b]);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(a));

    expect(resolution.status).toBe("ambiguous");
  });

  it("no resuelve a otra concentración cuando la tarjeta del enlace ya no está", async () => {
    // El caso `RESOLVED_WRONG_PRODUCT` medido en producción, en su forma más
    // peligrosa: la tarjeta de 0,25 mg desapareció del catálogo y solo queda la
    // de 2 mg, que comparte `presentationKey` y por lo tanto el hash. Antes de
    // la guardia, el hash matcheaba una sola candidata y la ficha resolvía a
    // ella sin redirect ni advertencia. Debe responder 404.
    const original = cardsFor([
      { name: "Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)", pharmacy: "cruz-verde", price: 4990 },
    ])[0];
    const soloLaFuerte = cardsFor([
      { name: "Cam Betametasona 2 mg Jarabe 120 mL", pharmacy: "ahumada", price: 5490 },
    ]);
    expect(soloLaFuerte[0].presentationKey).toBe(original.presentationKey);
    servingAll(soloLaFuerte);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(original));

    expect(resolution.status).toBe("not-found");
  });

  it("no resuelve a otra cantidad por envase cuando la tarjeta del enlace ya no está", async () => {
    const original = cardsFor([
      { name: "Ibuprofeno 400 mg x 20 comprimidos", pharmacy: "cruz-verde", price: 1990 },
    ])[0];
    const otraCantidad = cardsFor([
      { name: "Ibuprofeno 400 mg x 30 comprimidos", pharmacy: "ahumada", price: 2490 },
    ]);
    servingAll(otraCantidad);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(original));

    expect(resolution.status).toBe("not-found");
  });

  it("la guardia no rechaza un nombre escrito distinto para el mismo producto", async () => {
    // Contracara obligatoria: 13 de las 103 resoluciones correctas de la línea
    // base resuelven a una tarjeta cuyo nombre difiere del que generó el slug
    // (puntuación, laboratorio entre paréntesis, "DESCUENTO"...). La guardia
    // NO puede romperlas — por eso compara compatibilidad de ejes, no texto.
    const generated = cardsFor([
      { name: "Paracetamol 500 mg x 16 comprimidos. (Chile)", pharmacy: "araucomed", price: 990 },
    ])[0];
    const later = cardsFor([
      { name: "Paracetamol 500 mg x 16 comprimidos", pharmacy: "cruz-verde", price: 1090 },
    ]);
    expect(later[0].presentationKey).toBe(generated.presentationKey);
    servingAll(later);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(generated));

    expect(resolution.status).toBe("ok");
    if (resolution.status !== "ok") return;
    expectSameProduct(resolution.medication, generated);
  });

  it("la guardia lee los dos lados en el mismo dialecto empobrecido del slug", async () => {
    // "0,25 mg" se convierte en "0-25-mg" en el slug y se relee como 25 mg.
    // Si el nombre del candidato se leyera CRUDO (0,25 mg) la comparación daría
    // 25 mg vs 0,25 mg → falsa contradicción, y el producto correcto quedaría
    // irresoluble. Los dos lados tienen que pasar por la misma pérdida.
    const card = cardsFor([
      { name: "Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)", pharmacy: "cruz-verde", price: 4990 },
    ])[0];
    servingAll([card]);

    const resolution = await resolveMedicationBySlug(buildMedicationSlug(card));

    expect(resolution.status).toBe("ok");
  });

  it("un slug inexistente no resuelve nada y no dispara ninguna búsqueda", async () => {
    const resolution = await resolveMedicationBySlug("noesunslugvalido");

    expect(resolution).toEqual({ status: "not-found" });
    expect(searchMedicationsMock).not.toHaveBeenCalled();
  });

  it("un slug bien formado sin producto detrás responde not-found", async () => {
    servingAll([]);

    const resolution = await resolveMedicationBySlug("paracetamol-500-mg-16-comprimidos-abc123xyz");

    expect(resolution).toEqual({ status: "not-found" });
  });
});

// ---------------------------------------------------------------------------
// 4. Compatibilidad con enlaces ya emitidos
// ---------------------------------------------------------------------------

describe("slugs históricos", () => {
  it("un slug de generación antigua redirige de forma permanente al canónico vigente", async () => {
    const card = cardsFor([
      { name: "Paracetamol 500 mg 16 comprimidos", pharmacy: "cruz-verde", price: 990, laboratory: "Andrómaco" },
    ])[0];
    servingAll([card]);

    // Gen 1 — `matchKey` a secas, el esquema original.
    const legacySlug = `paracetamol-500-mg-16-comprimidos-${shortHash(card.matchKey)}`;
    const resolution = await resolveMedicationBySlug(legacySlug);

    expect(resolution.status).toBe("ok");
    if (resolution.status !== "ok") return;
    expect(resolution.needsRedirect).toBe(true);
    expect(resolution.canonicalSlug).toBe(buildMedicationSlug(card));
    expectSameProduct(resolution.medication, card);
  });

  it("el slug vigente NO redirige: el canónico es él mismo (sin loop)", async () => {
    const card = cardsFor([
      { name: "Paracetamol 500 mg 16 comprimidos", pharmacy: "cruz-verde", price: 990, laboratory: "Andrómaco" },
    ])[0];
    servingAll([card]);

    const slug = buildMedicationSlug(card);
    const resolution = await resolveMedicationBySlug(slug);

    expect(resolution.status).toBe("ok");
    if (resolution.status !== "ok") return;
    expect(resolution.needsRedirect).toBe(false);
    expect(resolution.canonicalSlug).toBe(slug);
  });

  it("resolver el destino de un redirect no dispara otro redirect", async () => {
    const card = cardsFor([
      { name: "Ambroxol 30mg/5ml Jarabe 100ml", pharmacy: "cruz-verde", price: 2990 },
      { name: "Ambroxol 15 mg/5mL Jarabe 100 mL", pharmacy: "salcobrand", price: 1990 },
    ]);
    servingAll(card);

    const target = card[0];
    const legacySlug = `${buildMedicationSlug(target).replace(/-[0-9a-z]+$/, "")}-${shortHash(target.matchKey)}`;
    const first = await resolveMedicationBySlug(legacySlug);

    expect(first.status).toBe("ok");
    if (first.status !== "ok") return;
    expect(first.needsRedirect).toBe(true);

    const second = await resolveMedicationBySlug(first.canonicalSlug);
    expect(second.status).toBe("ok");
    if (second.status !== "ok") return;
    expect(second.needsRedirect).toBe(false);
    expect(second.canonicalSlug).toBe(first.canonicalSlug);
  });
});
