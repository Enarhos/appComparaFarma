/**
 * CF-SEARCH-002 — relevancia (QA-02) y cohortes de concentración (QA-05).
 *
 * Los nombres de producto son literales observados en producción
 * (`GET https://comparafarma-api.vercel.app/api/search`, read-only,
 * 2026-08-28). Las distribuciones citadas en los comentarios se midieron
 * sobre esas mismas respuestas.
 */
import { describe, expect, it } from "vitest";

import { parseQueryIntent } from "../queryIntent.js";
import { evaluateResultRelevance, rankByRelevance } from "../relevance.js";
import { toMedicationResult } from "../pricing.js";
import type { MedicationResult, PharmacySlug, ScrapedProduct } from "../types.js";

function offer(
  slug: PharmacySlug,
  over: Partial<ScrapedProduct> & { name: string }
): MedicationResult {
  return toMedicationResult(
    {
      price: 1000,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl: null,
      imageUrl: null,
      brand: null,
      manufacturer: null,
      isBioequivalent: false,
      ...over,
    },
    slug,
    slug
  );
}

function lexical(query: string, name: string) {
  return evaluateResultRelevance(parseQueryIntent(query), offer("araucomed", { name })).lexicalMatch;
}

// ---------------------------------------------------------------------------
// QA-02 — relevancia léxica/farmacológica
// ---------------------------------------------------------------------------
describe("QA-02 — substring no es equivalencia farmacológica", () => {
  it("'omeprazol' NO considera 'Esomeprazol' una coincidencia válida", () => {
    // Producción 2026-08-28: de las 36 tarjetas de "omeprazol", 11 eran
    // esomeprazol (10 monofármaco + 1 combinación naproxeno/esomeprazol).
    expect(lexical("omeprazol", "Esomeprazol 40 mg x 30 comp. recubrimiento entérico")).toBe("mismatch");
    expect(lexical("omeprazol", "Esomeprazol 20 mg 30...")).toBe("mismatch");
    expect(
      lexical("omeprazol", "Flectane naproxeno 500 mg esomeprazol 20 mg 30 comprimidos")
    ).toBe("mismatch");
  });

  it("la regla es simétrica y general, no un caso hardcodeado", () => {
    // Buscar el enantiómero y recibir el racémico es el mismo error.
    expect(lexical("esomeprazol", "Omeprazol 20 mg x 30 cápsulas")).toBe("mismatch");
    // Misma regla, otro par de principios activos, ninguno mencionado en el
    // código: prefijos dex-/levo-/cafi-.
    expect(lexical("ketoprofeno", "Dexketoprofeno 25 mg x 20 comprimidos")).toBe("mismatch");
    expect(lexical("cetirizina", "Levocetirizina 5 mg x 30 comprimidos")).toBe("mismatch");
    expect(lexical("aspirina", "Cafiaspirina 500 mg x 20 comprimidos")).toBe("mismatch");
  });

  it("el principio activo buscado, presente como token completo, es 'exact'", () => {
    expect(lexical("omeprazol", "Omeprazol 20 mg x 30 cápsulas. (Curae Spring)")).toBe("exact");
    // Nombre truncado por el listado de EasyFarma: sigue siendo exact.
    expect(lexical("omeprazol", "Omeprazol 20 mg x 30...")).toBe("exact");
  });

  it("no usa `includes()` sobre el nombre completo — exige límite de término", () => {
    // Es la causa raíz literal de QA-02: "Esomeprazol ...".includes("omeprazol")
    // es `true`, y sin embargo NO es una coincidencia.
    const name = "Esomeprazol 20 mg x 30 Cápsulas";
    expect(name.toLowerCase().includes("omeprazol")).toBe(true);
    expect(lexical("omeprazol", name)).toBe("mismatch");
  });
});

describe("QA-02 — el recall de marca no se rompe", () => {
  it("las marcas de la búsqueda por principio activo quedan como 'compatible', nunca 'mismatch'", () => {
    // Producción 2026-08-28, query "omeprazol": Zomel, Obexol y Lomex son
    // omeprazol de marca y no repiten el principio activo en el nombre.
    expect(lexical("omeprazol", "Zomel 20 mg x 30 comprimidos.")).toBe("compatible");
    expect(lexical("omeprazol", "Lomex 20 Mg X 28 Caps")).toBe("compatible");
    expect(lexical("omeprazol", "Obexol 37,7 mg x 30 Cápsulas")).toBe("compatible");
    expect(lexical("ibuprofeno", "Actron RA 200 mg x 10 Cápsulas Blandas")).toBe("compatible");
  });

  it("las búsquedas POR marca siguen encontrando su marca", () => {
    expect(lexical("Tapsin", "Tapsin Forte x 20 Comprimidos Recubiertos")).toBe("exact");
    expect(lexical("Tapsin", "Tapsin X 6 comprimidos Noche (Maver)")).toBe("exact");
    expect(lexical("Actron", "Actron (ibuprofeno) 200mg 10  Cápsulas")).toBe("exact");
    expect(lexical("Kitadol", "Kitadol 500 mg x 24 comprimidos.")).toBe("exact");
  });

  it("un nombre corrompido en origen no degrada un producto real de la marca buscada", () => {
    // Caso real (Ahumada, producción 2026-08-28): el nombre llega con un soft
    // hyphen incrustado y tokeniza como "tapsi". Una diferencia de UN carácter
    // es un defecto de codificación, no un prefijo farmacológico — degradarlo
    // habría sacado dos Tapsin reales del orden de una búsqueda de marca.
    expect(lexical("Tapsin", "Tapsí­n M (B) Paracetamol 10 Comprimidos Recubiertos")).toBe(
      "compatible"
    );
    expect(lexical("Tapsin", "Tapsn (B) Paracetamol 500mg 24 Comprimidos")).toBe("compatible");
  });

  it("una combinación no se degrada por nombrar un solo término de la consulta", () => {
    // Protección `combo:` de S-1: la combinación se separa por identidad, no
    // por relevancia. Y el monofármaco tampoco se degrada frente a la consulta
    // de la combinación.
    expect(
      lexical("losartan + hidroclorotiazida", "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos")
    ).toBe("exact");
    expect(
      lexical("losartan + hidroclorotiazida", "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)")
    ).toBe("compatible");
    expect(lexical("losartan", "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30")).toBe("exact");
  });

  it("evalúa también los nombres de las ofertas fusionadas, no solo el canónico", () => {
    const intent = parseQueryIntent("omeprazol");
    const card = offer("easyfarma", { name: "Zomel 20 mg x 30 comprimidos." });
    card.prices.push({
      ...card.prices[0],
      pharmacySlug: "farmex",
      productName: "Omeprazol 20 mg x 30 cápsulas",
    });
    expect(evaluateResultRelevance(intent, card).lexicalMatch).toBe("exact");
  });
});

// ---------------------------------------------------------------------------
// QA-05 — cohorte de concentración
// ---------------------------------------------------------------------------

/** Las tres concentraciones reales de ibuprofeno, con los precios de producción. */
function ibuprofenoCatalog(): MedicationResult[] {
  return [
    offer("araucomed", { name: "Ibuprofeno 400 mg x 20 comp", price: 642 }),
    offer("farmex", { name: "Ibuprofeno 400 mg x 20 comprimidos. (Chile)", price: 790 }),
    offer("easyfarma", { name: "Ibuprofeno 600 Mg 20 Comp....", price: 1190 }),
    offer("dr-simi", { name: "Ibuprofeno 200 mg 20 comprimidos recubiertos", price: 1200 }),
    offer("cruz-verde", { name: "Ibuprofeno 600 mg 20 comprimidos recubiertos", price: 9553 }),
  ];
}

describe("QA-05 — la concentración pedida gobierna el orden", () => {
  it("buscando 600 mg, TODOS los 600 mg van antes que cualquier 400/200 mg, sin importar el precio", () => {
    const intent = parseQueryIntent("ibuprofeno 600 mg");
    const ordered = rankByRelevance(intent, ibuprofenoCatalog());

    expect(ordered.map((r) => r.matchKey)).toEqual([
      "ibuprofeno|600mg|20", // $1.190
      "ibuprofeno|600mg|20", // $9.553 — más caro que TODOS los demás
      "ibuprofeno|400mg|20", // $642 — el más barato del catálogo, degradado
      "ibuprofeno|400mg|20",
      "ibuprofeno|200mg|20",
    ]);

    // La aserción central del ticket, aislada: el precio no cruza el límite
    // de cohorte.
    const primerOtro = ordered.findIndex((r) => r.concentrationMatch === "other");
    const ultimoExacto = ordered.map((r) => r.concentrationMatch).lastIndexOf("exact");
    expect(ultimoExacto).toBeLessThan(primerOtro);
    expect(ordered[ultimoExacto].bestPrice).toBeGreaterThan(ordered[primerOtro].bestPrice);
  });

  it("dentro de la cohorte exacta se sigue ordenando por precio", () => {
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), ibuprofenoCatalog());
    const exactos = ordered.filter((r) => r.concentrationMatch === "exact");
    expect(exactos.map((r) => r.bestPrice)).toEqual([1190, 9553]);
  });

  it("el orden obligatorio es EXACT → UNKNOWN → OTHER", () => {
    const catalog = [
      ...ibuprofenoCatalog(),
      // Nombre truncado por la farmacia: no declara concentración.
      offer("easyfarma", { name: "Ibuprofeno...", price: 100 }),
    ];
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), catalog);
    expect(ordered.map((r) => r.concentrationMatch)).toEqual([
      "exact",
      "exact",
      "unknown", // $100, el más barato de todos, pero no se puede afirmar la dosis
      "other",
      "other",
      "other",
    ]);
  });

  it("un resultado de concentración desconocida NUNCA se descarta", () => {
    const catalog = [offer("easyfarma", { name: "Ibuprofeno...", price: 100 })];
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), catalog);
    expect(ordered).toHaveLength(1);
    expect(ordered[0].concentrationMatch).toBe("unknown");
  });

  it("la clasificación no elimina NINGÚN resultado, en ninguna consulta", () => {
    for (const q of ["ibuprofeno", "ibuprofeno 600 mg", "omeprazol", "Tapsin"]) {
      const catalog = [
        ...ibuprofenoCatalog(),
        offer("dr-simi", { name: "Esomeprazol 20 mg x 30 Cápsulas", price: 2980 }),
      ];
      expect(rankByRelevance(parseQueryIntent(q), catalog)).toHaveLength(catalog.length);
    }
  });

  it("reconoce la misma dosis escrita con otra unidad", () => {
    const ordered = rankByRelevance(parseQueryIntent("amoxicilina 1 g"), [
      offer("farmex", { name: "Amoxicilina 500 mg x 21 comprimidos", price: 500 }),
      offer("araucomed", { name: "Amoxicilina 1000 mg x 14 comprimidos", price: 3000 }),
    ]);
    expect(ordered[0].concentrationMatch).toBe("exact");
    expect(ordered[0].matchKey).toBe("amoxicilina|1000mg|14");
  });
});

describe("QA-05 — sin concentración en la consulta no se inventa preferencia", () => {
  it("'ibuprofeno' a secas no asigna cohorte a ningún resultado", () => {
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno"), ibuprofenoCatalog());
    expect(ordered.every((r) => r.concentrationMatch === undefined)).toBe(true);
  });

  it("'ibuprofeno' a secas conserva EXACTAMENTE el orden por precio", () => {
    const base = ibuprofenoCatalog().sort((a, b) => a.bestPrice - b.bestPrice);
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno"), base);
    expect(ordered.map((r) => r.bestPrice)).toEqual([642, 790, 1190, 1200, 9553]);
  });

  it("el campo `concentrationMatch` queda AUSENTE, no fabricado como 'exact'", () => {
    const [primero] = rankByRelevance(parseQueryIntent("ibuprofeno"), ibuprofenoCatalog());
    expect("concentrationMatch" in primero).toBe(false);
    expect(primero.lexicalMatch).toBe("exact");
  });
});

// ---------------------------------------------------------------------------
// Señales suaves: cantidad y forma farmacéutica
// ---------------------------------------------------------------------------
describe("cantidad y forma — señales de ranking, no cohortes duras", () => {
  const catalog = () => [
    offer("araucomed", { name: "Paracetamol 500 mg x 24 comprimidos", price: 450 }),
    offer("farmex", { name: "Paracetamol 500 mg x 16 comprimidos", price: 900 }),
    offer("easyfarma", { name: "Paracetamol 500 mg...", price: 600 }),
  ];

  it("'paracetamol 500 mg x16' es una intención distinta de 'paracetamol 500 mg'", () => {
    const conCantidad = rankByRelevance(parseQueryIntent("paracetamol 500 mg x 16"), catalog());
    const sinCantidad = rankByRelevance(parseQueryIntent("paracetamol 500 mg"), catalog());

    expect(conCantidad[0].canonicalName).toBe("Paracetamol 500 mg x 16 comprimidos");
    expect(sinCantidad[0].canonicalName).toBe("Paracetamol 500 mg x 24 comprimidos");
    expect(conCantidad.map((r) => r.canonicalName)).not.toEqual(
      sinCantidad.map((r) => r.canonicalName)
    );
  });

  it("la cantidad NO crea una cohorte dura: todos siguen en la misma sección", () => {
    const ordered = rankByRelevance(parseQueryIntent("paracetamol 500 mg x 16"), catalog());
    expect(ordered.every((r) => r.concentrationMatch === "exact")).toBe(true);
    expect(ordered).toHaveLength(3);
  });

  it("la cantidad es una señal MÁS SUAVE que la concentración", () => {
    // Un 500 mg x 16 (lo pedido en ambos ejes) va antes que un 250 mg x 16,
    // aunque los dos coincidan en cantidad: la concentración manda.
    const ordered = rankByRelevance(parseQueryIntent("paracetamol 500 mg x 16"), [
      offer("araucomed", { name: "Paracetamol 250 mg x 16 comprimidos", price: 100 }),
      offer("farmex", { name: "Paracetamol 500 mg x 20 comprimidos", price: 900 }),
    ]);
    expect(ordered[0].matchKey).toBe("paracetamol|500mg|20");
    expect(ordered[0].concentrationMatch).toBe("exact");
  });

  it("omitir la cantidad no penaliza como declararla distinta", () => {
    const ordered = rankByRelevance(parseQueryIntent("paracetamol 500 mg x 16"), [
      offer("araucomed", { name: "Paracetamol 500 mg x 24 comprimidos", price: 450 }),
      offer("easyfarma", { name: "Paracetamol 500 mg...", price: 600 }),
    ]);
    // El de cantidad desconocida ($600) va antes que el de cantidad distinta
    // ($450), pese a ser más caro.
    expect(ordered.map((r) => r.bestPrice)).toEqual([600, 450]);
  });

  it("la forma farmacéutica pedida ordena, pero no elimina", () => {
    const ordered = rankByRelevance(parseQueryIntent("paracetamol 500 mg jarabe"), [
      offer("araucomed", { name: "Paracetamol 500 mg x 16 comprimidos", price: 450 }),
      offer("farmex", { name: "Paracetamol 500 mg Jarabe 100 ml", price: 2000 }),
    ]);
    expect(ordered[0].canonicalName).toBe("Paracetamol 500 mg Jarabe 100 ml");
    expect(ordered).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Composición de las dos reglas y propiedades del ordenamiento
// ---------------------------------------------------------------------------
describe("rankByRelevance — composición y propiedades", () => {
  it("un mismatch queda al final aunque su concentración sea la pedida y sea el más barato", () => {
    const ordered = rankByRelevance(parseQueryIntent("omeprazol 20 mg"), [
      offer("dr-simi", { name: "Esomeprazol 20 mg x 30 Cápsulas", price: 100 }),
      offer("farmex", { name: "Omeprazol 40 mg x 30 cápsulas", price: 5000 }),
      offer("araucomed", { name: "Omeprazol 20 mg x 30 cápsulas", price: 990 }),
    ]);
    expect(ordered.map((r) => [r.matchKey, r.lexicalMatch, r.concentrationMatch])).toEqual([
      ["omeprazol|20mg|30", "exact", "exact"],
      ["omeprazol|40mg|30", "exact", "other"],
      ["esomeprazol|20mg|30", "mismatch", "exact"],
    ]);
  });

  it("`compatible` NO se degrada: una marca más barata sigue ganándole a un genérico más caro", () => {
    // Decisión explícita del ticket: solo se degrada con evidencia FUERTE.
    // PreciosFarma es primariamente un comparador de precios.
    const ordered = rankByRelevance(parseQueryIntent("ibuprofeno 400 mg"), [
      offer("cruz-verde", { name: "Ibuprofeno 400 mg x 20 comprimidos", price: 3000 }),
      offer("ahumada", { name: "Ibucalm 400 mg x 10 cápsulas blandas.", price: 1490 }),
    ]);
    expect(ordered[0].canonicalName).toBe("Ibucalm 400 mg x 10 cápsulas blandas.");
    expect(ordered[0].lexicalMatch).toBe("compatible");
  });

  it("no muta el array de entrada ni sus elementos", () => {
    const input = ibuprofenoCatalog();
    const snapshot = input.map((r) => r.canonicalName);
    rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), input);
    expect(input.map((r) => r.canonicalName)).toEqual(snapshot);
    expect(input.every((r) => !("lexicalMatch" in r))).toBe(true);
  });

  it("es idempotente y re-rankeable: anotar con otra intención recalcula desde los nombres", () => {
    const seiscientos = parseQueryIntent("ibuprofeno 600 mg");
    const cuatrocientos = parseQueryIntent("ibuprofeno 400 mg");

    const unaVez = rankByRelevance(cuatrocientos, ibuprofenoCatalog());
    // Se re-rankea un array YA anotado para 400 mg con la intención de 600 mg
    // — es exactamente lo que hace la ruta al servir desde la caché de
    // retrieval.
    const reRankeado = rankByRelevance(seiscientos, unaVez);
    const desdeCero = rankByRelevance(seiscientos, ibuprofenoCatalog());

    expect(reRankeado.map((r) => [r.canonicalName, r.concentrationMatch])).toEqual(
      desdeCero.map((r) => [r.canonicalName, r.concentrationMatch])
    );
    expect(rankByRelevance(seiscientos, desdeCero).map((r) => r.canonicalName)).toEqual(
      desdeCero.map((r) => r.canonicalName)
    );
  });

  it("[QA-01] re-rankear con una intención SIN concentración borra la cohorte de la anterior", () => {
    // Regresión medida sobre datos reales (2026-08-28, 92 tarjetas de
    // "ibuprofeno"): la caché de RETRIEVAL de /api/search guarda los resultados
    // YA anotados, así que "ibuprofeno 600 mg" seguido de "ibuprofeno" —dentro
    // del TTL de 5 min y con la MISMA clave de retrieval— devolvía la consulta
    // amplia arrastrando las cohortes de la primera: 63 de 92 tarjetas con
    // `concentrationMatch: "other"` para una consulta que no pidió ninguna
    // concentración. Web las mandaba a "Otras concentraciones" y Mobile hundía
    // el ibuprofeno más barato del catálogo a la posición 29.
    const anotado = rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), ibuprofenoCatalog());
    expect(anotado.some((r) => r.concentrationMatch === "other")).toBe(true);

    const amplio = rankByRelevance(parseQueryIntent("ibuprofeno"), anotado);
    expect(amplio.every((r) => r.concentrationMatch === undefined)).toBe(true);
    expect(amplio.every((r) => !("concentrationMatch" in r))).toBe(true);

    // Y es indistinguible de rankear la misma consulta desde cero.
    const desdeCero = rankByRelevance(parseQueryIntent("ibuprofeno"), ibuprofenoCatalog());
    expect(amplio.map((r) => [r.canonicalName, r.concentrationMatch, r.lexicalMatch])).toEqual(
      desdeCero.map((r) => [r.canonicalName, r.concentrationMatch, r.lexicalMatch])
    );
  });

  it("[QA-01] un `lexicalMatch` previo tampoco sobrevive a una consulta distinta", () => {
    const anotado = rankByRelevance(parseQueryIntent("omeprazol"), [
      offer("dr-simi", { name: "Esomeprazol 20 mg x 30 Cápsulas", price: 100 }),
    ]);
    expect(anotado[0].lexicalMatch).toBe("mismatch");
    // La misma tarjeta, servida desde el retrieval para la consulta que sí le
    // corresponde, deja de estar marcada como incompatible.
    const reRankeado = rankByRelevance(parseQueryIntent("esomeprazol"), anotado);
    expect(reRankeado[0].lexicalMatch).toBe("exact");
  });

  it("preserva `presentationKey` y el resto del contrato de cada resultado", () => {
    const [original] = ibuprofenoCatalog();
    const [ranked] = rankByRelevance(parseQueryIntent("ibuprofeno 400 mg"), [original]);
    expect(ranked.presentationKey).toBe(original.presentationKey);
    expect(ranked.matchKey).toBe(original.matchKey);
    expect(ranked.prices).toEqual(original.prices);
    expect(ranked.bestPrice).toBe(original.bestPrice);
  });
});
