/**
 * SEARCH-MATCHING-QA-01 — Gate 1 (diagnóstico).
 *
 * Tests de CARACTERIZACIÓN: describen el comportamiento REAL de hoy
 * (2026-08-27, Mobile 1.4.1 / vc33 en Closed Testing), incluido el
 * comportamiento defectuoso. NO implementan ninguna corrección — la
 * corrección es el Gate 2 y requiere aprobación CTO explícita.
 *
 * Convención usada acá:
 *   - `it(...)`      → congela comportamiento actual. Cuando el enunciado
 *                      dice "[DEFECTO QA-0X]" el test PASA hoy justamente
 *                      porque el defecto existe: si el Gate 2 lo corrige,
 *                      este test debe FALLAR y debe actualizarse a propósito.
 *   - `it.fails(...)` → expresa el comportamiento CORRECTO deseado. Vitest lo
 *                      reporta como PASS mientras la aserción interna falle
 *                      (es decir, mientras el defecto siga presente) y como
 *                      FAIL en cuanto el Gate 2 lo arregle. Es el "test que
 *                      falla intencionalmente" pedido por el Gate 1: deja el
 *                      defecto documentado y ejecutable sin romper CI.
 *   - `it(...)` con "[CORREGIDO S-X]" → el Gate 2 ya corrigió ese defecto: el
 *                      test dejó de congelarlo y pasó a verificar el
 *                      comportamiento correcto, conservando en el comentario
 *                      cuál era el defecto y qué evidencia lo respaldaba.
 *
 * Gate 2 (2026-08-27) corrigió S-1 (colisión monofármaco/combinación, vía
 * `presentationKey`) y S-2 (bioequivalencia de Ahumada, lado API). El resto de
 * los defectos caracterizados acá sigue abierto y fuera de alcance.
 *
 * Todos los datos de entrada son literales observados en producción real
 * (`GET https://comparafarma-api.vercel.app/api/search`, read-only,
 * 2026-08-27) o en las páginas de producto de las farmacias, no inventados.
 */
import { describe, expect, it } from "vitest";
import * as domainIndex from "../index.js";
import { matchKey } from "../matching.js";
import { cleanQuery } from "../normalization.js";
import { mergeDuplicates } from "../deduplication.js";
import { toMedicationResult } from "../pricing.js";
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

// ---------------------------------------------------------------------------
// QA-05 — la concentración/cantidad de la consulta se descarta antes de salir
// de la app. Evidencia de producción: "ibuprofeno 200 mg", "ibuprofeno 400 mg"
// y "ibuprofeno 600 mg" devolvieron los MISMOS 108 resultados / 29 Bio, y la
// segunda y tercera consulta respondieron con `x-search-cache: hit` sobre la
// entrada creada por la primera — prueba directa de que colapsan a la misma
// clave de caché.
// ---------------------------------------------------------------------------
describe("QA-05 — cleanQuery descarta la concentración de la consulta", () => {
  it("[DEFECTO QA-05] tres concentraciones distintas de ibuprofeno producen la MISMA query", () => {
    expect(cleanQuery("ibuprofeno 200 mg")).toBe("ibuprofeno");
    expect(cleanQuery("ibuprofeno 400 mg")).toBe("ibuprofeno");
    expect(cleanQuery("ibuprofeno 600 mg")).toBe("ibuprofeno");

    // Consecuencia directa: la clave de caché de /api/search (`query
    // .toLowerCase()`, api/src/routes/search.ts) y la de Mobile
    // (mobile/src/hooks/useSearch.ts) son idénticas para las tres.
    const cacheKeys = new Set(
      ["ibuprofeno 200 mg", "ibuprofeno 400 mg", "ibuprofeno 600 mg"].map((q) =>
        cleanQuery(q).toLowerCase().trim()
      )
    );
    expect(cacheKeys.size).toBe(1);
  });

  it.fails("[DESEADO] una consulta con concentración debería distinguirse de otra concentración", () => {
    expect(cleanQuery("ibuprofeno 400 mg")).not.toBe(cleanQuery("ibuprofeno 600 mg"));
  });

  it("[DEFECTO QA-05] la cantidad/presentación de la consulta también se descarta", () => {
    // Observado: "paracetamol 500 mg 16 comprimidos" (134/43 Bio) devolvió lo
    // mismo que "paracetamol 500 mg" (134/43 Bio, cache=hit). El 136/134 que
    // reportó QA es variación temporal del scraping, no diferencia semántica.
    expect(cleanQuery("paracetamol 500 mg 16 comprimidos")).toBe("paracetamol");
    expect(cleanQuery("paracetamol 500 mg")).toBe("paracetamol");
  });

  it.fails("[DESEADO] una consulta más específica no debería colapsar a la menos específica", () => {
    expect(cleanQuery("paracetamol 500 mg 16 comprimidos")).not.toBe(
      cleanQuery("paracetamol 500 mg")
    );
  });

  it("[DEFECTO QA-05] la marca sí sobrevive a cleanQuery, solo se pierden los atributos numéricos", () => {
    // No es que cleanQuery borre todo: conserva palabras. El problema es
    // categórico — descarta exactamente los atributos discriminantes
    // (concentración, unidad, cantidad, forma farmacéutica).
    expect(cleanQuery("Tapsin Puro 500 mg x 16 comprimidos")).toBe("Tapsin Puro");
  });
});

// ---------------------------------------------------------------------------
// QA-02 — "omeprazol" trae Esomeprazol. `matchKey` SÍ los distingue; el
// pipeline no filtra por relevancia en ningún punto, así que lo que devuelve
// el buscador de cada farmacia entra tal cual al resultado.
// ---------------------------------------------------------------------------
describe("QA-02 — omeprazol vs esomeprazol", () => {
  it("[OK, no-regresión] matchKey distingue omeprazol de esomeprazol", () => {
    expect(matchKey("Omeprazol 20 mg x 30 cápsulas")).toBe("omeprazol|20mg|30");
    expect(matchKey("Esomeprazol 20 mg x 30 cápsulas")).toBe("esomeprazol|20mg|30");
    expect(matchKey("Omeprazol 20 mg x 30 cápsulas")).not.toBe(
      matchKey("Esomeprazol 20 mg x 30 cápsulas")
    );
  });

  it("[OK, no-regresión] mergeDuplicates nunca fusiona omeprazol con esomeprazol", () => {
    const merged = mergeDuplicates([
      offer("araucomed", { name: "Omeprazol 20 mg x 30 cápsulas", laboratory: "Opko" }),
      offer("dr-simi", { name: "Esomeprazol 20 mg x 30 cápsulas", laboratory: "Opko" }),
    ]);
    expect(merged).toHaveLength(2);
  });

  it("[DEFECTO QA-02] no existe ninguna función de relevancia consulta→resultado en el dominio", () => {
    // Causa raíz: `esomeprazol` contiene literalmente `omeprazol` como
    // substring, y el motor de búsqueda de cada farmacia hace ese match. El
    // pipeline propio (searchService → toMedicationResult → mergeDuplicates →
    // sort por precio) NUNCA compara el resultado contra la consulta, así que
    // no tiene forma de descartarlo.
    //
    // Este test congela esa ausencia: si el Gate 2 agrega un filtro de
    // relevancia al dominio, esta aserción debe actualizarse a propósito.
    const relevanceLike = Object.keys(domainIndex).filter((k) =>
      /relevan|score|rank|filterByQuery|matchesQuery|parseQuery/i.test(k)
    );
    expect(relevanceLike).toEqual([]);
  });

  it.fails("[DESEADO] debería existir una regla general que rechace un principio activo que solo contiene al buscado como substring", () => {
    // Regla general esperada (NO un caso hardcodeado omeprazol/esomeprazol):
    // el token de principio activo del resultado debe coincidir por token
    // completo con el de la consulta, no por inclusión.
    const consulta = "omeprazol";
    const resultado = matchKey("Esomeprazol 20 mg x 30 cápsulas").split("|")[0];
    expect(resultado.includes(consulta)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// QA-03 — 3 resultados de EasyFarma a $5.990 para "omeprazol".
// Verificado contra las fichas reales (HTTP GET read-only, 2026-08-27):
//   nuevo.easyfarma.cl/102263-...-lab-hetero.html  → sku/mpn 8903726285541
//   nuevo.easyfarma.cl/105275-...-lab-hetero.html  → sku/mpn 8904317830171
//   nuevo.easyfarma.cl/104459-...-ascend.html      → sku/mpn 7804650886839
// Tres EAN-13 distintos ⇒ tres SKU distintos en origen. NO son un fallo de
// deduplicación nuestro; son listados reales distintos que además llegan con
// el nombre TRUNCADO por el propio listado de EasyFarma ("...").
// ---------------------------------------------------------------------------
describe("QA-03 — presuntos duplicados de EasyFarma (omeprazol)", () => {
  it("[OK] los 3 SKU reales de EasyFarma NO se fusionan entre sí", () => {
    const merged = mergeDuplicates([
      offer("easyfarma", {
        name: "Esomeprazol  20 mg x 30...",
        price: 5990,
        onlineUrl: "https://nuevo.easyfarma.cl/102263-esomeprazol-20-mg-x-30-capsulas-lab-hetero.html",
      }),
      offer("easyfarma", {
        name: "Esomeprazol 20 Mg 30...",
        price: 5990,
        onlineUrl: "https://nuevo.easyfarma.cl/105275-esomeprazol-20-mg-30-capsulas-lab-hetero.html",
      }),
      offer("easyfarma", {
        name: "Esomeprazol 20 mg x 30 caps...",
        price: 5990,
        onlineUrl: "https://nuevo.easyfarma.cl/104459-esomeprazol-20-mg-x-30-caps-ascend.html",
      }),
    ]);
    expect(merged).toHaveLength(3);
  });

  it("[DEFECTO QA-03] el nombre truncado por EasyFarma rompe la extracción de cantidad de matchKey", () => {
    // "x 30" se detecta; "30" suelto (sin `x` ni palabra de unidad, porque el
    // listado la cortó) NO. Dos listados del mismo laboratorio Hetero, misma
    // presentación declarada, terminan con matchKey distinto.
    expect(matchKey("Esomeprazol  20 mg x 30...")).toBe("esomeprazol|20mg|30");
    expect(matchKey("Esomeprazol 20 Mg 30...")).toBe("esomeprazol|20mg");
    expect(matchKey("Esomeprazol  20 mg x 30...")).not.toBe(matchKey("Esomeprazol 20 Mg 30..."));
  });

  it.fails("[DESEADO] la misma presentación no debería depender de que el nombre traiga la 'x'", () => {
    expect(matchKey("Esomeprazol 20 Mg 30...")).toBe(matchKey("Esomeprazol  20 mg x 30..."));
  });

  it("[DEFECTO QA-03] dos ofertas de la MISMA farmacia pueden agruparse si comparten presentationKey", () => {
    // mergeDuplicates agrupa por presentationKey sin ninguna guardia de
    // "misma farmacia": `byPharmacy` se queda con la más barata y descarta la
    // otra silenciosamente. Con 2 SKU distintos de la misma farmacia que
    // colapsan a la misma presentationKey, una desaparece del resultado.
    const merged = mergeDuplicates([
      offer("easyfarma", { name: "Omeprazol 20 mg x 30 cápsulas", price: 1490 }),
      offer("easyfarma", { name: "Omeprazol 20 mg x 30 cápsulas", price: 1690 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(1);
    expect(merged[0].prices[0].channels.effective).toBe(1490);
  });
});

// ---------------------------------------------------------------------------
// QA-01 — fragmentación de identidad comercial del MISMO producto.
// ---------------------------------------------------------------------------
describe("QA-01 — fragmentación de identidad comercial", () => {
  it("[OK, no-regresión] ANDROMACO y ANDRÓMACO normalizan a la misma marca", () => {
    // Ya validado en BIOEQUIVALENCE-DATA-QUALITY-01 Gate 2; se conserva como
    // test de no-regresión, sin duplicar el resto de aquel Gate.
    const araucomed = offer("araucomed", {
      name: "Paracetamol 500 mg x 16 comprimidos. (Andromaco)",
      laboratory: "ANDROMACO",
      isBioequivalent: false,
    });
    const drsimi = offer("dr-simi", {
      name: "Paracetamol 500 mg 16 comprimidos",
      laboratory: "ANDRÓMACO",
      isBioequivalent: false,
    });
    expect(araucomed.presentationKey).toBe(drsimi.presentationKey);
    expect(mergeDuplicates([araucomed, drsimi])).toHaveLength(1);
  });

  it("[DEFECTO QA-01A] el mismo Paracetamol Andrómaco 500mg/16 se parte en dos tarjetas por el flag bio", () => {
    // Producción 2026-08-27, query "paracetamol":
    //   paracetamol|500mg|16|bio:false|brand:andromaco → araucomed $450 + farmex $790
    //   paracetamol|500mg|16|bio:true |brand:andromaco → dr-simi  $480
    const bioFalse = offer("araucomed", {
      name: "Paracetamol 500 mg x 16 comprimidos. (Andromaco)",
      laboratory: "ANDROMACO",
      isBioequivalent: false,
      price: 450,
    });
    const bioTrue = offer("dr-simi", {
      name: "Paracetamol 500 mg 16 comprimidos",
      laboratory: "ANDRÓMACO",
      isBioequivalent: true,
      price: 480,
    });
    expect(bioFalse.matchKey).toBe(bioTrue.matchKey);
    expect(bioFalse.presentationKey).not.toBe(bioTrue.presentationKey);
    expect(mergeDuplicates([bioFalse, bioTrue])).toHaveLength(2);
    // Arquitectura objetivo ya decidida en BIOEQUIVALENCE-DATA-QUALITY-01
    // (Option D): sacar `bio:` de presentationKey. NO se implementa acá.
  });

  it("[DEFECTO QA-01C] Losartán 50mg/30 con EAN-13 IDÉNTICO queda en dos tarjetas ($490 vs $990)", () => {
    // Verificado contra las fichas reales (HTTP GET read-only, 2026-08-27):
    //   EcoFarmacias "Losartan 50 mg x 30 comprimidos (LCH) DESCUENTO"
    //       SKU 7800007679895, categoría "Bioequivalentes", $490
    //   Farmex     "Losartan Potásico 50 mg x 30 comprimidos"
    //       variant sku/barcode 7800007679895, vendor "CHILE",
    //       registro ISP F-13738/24, $990
    // MISMO EAN-13 ⇒ MISMO producto comercial (Laboratorio Chile). La app
    // muestra dos tarjetas y esconde un ahorro real del 50%.
    const eco = offer("ecofarmacias", {
      name: "Losartan 50 mg x 30 comprimidos (LCH) DESCUENTO",
      laboratory: "Losartan", // campo estructurado real: el principio activo
      isBioequivalent: true,
      price: 490,
    });
    const farmex = offer("farmex", {
      name: "Losartan Potásico 50 mg x 30 comprimidos",
      laboratory: "CHILE",
      isBioequivalent: false,
      price: 990,
    });

    expect(eco.matchKey).toBe("losartan|50mg|30");
    expect(farmex.matchKey).toBe("losartan|50mg|30");

    // Se parte por DOS ejes independientes a la vez:
    expect(eco.presentationKey).toBe("losartan|50mg|30|bio:true|brand:unknown");
    expect(farmex.presentationKey).toBe("losartan|50mg|30|bio:false|brand:chile");
    expect(mergeDuplicates([eco, farmex])).toHaveLength(2);
  });

  it("[DEFECTO QA-01C] corregir solo el eje bio NO alcanza para unir el caso Losartán", () => {
    // Importante para el plan del Gate 2: aun neutralizando la
    // bioequivalencia, `brand:unknown` vs `brand:chile` los mantiene
    // separados por la política conservadora (known nunca fusiona con
    // unknown). Necesita además evidencia de identidad (EAN/GTIN).
    const eco = offer("ecofarmacias", {
      name: "Losartan 50 mg x 30 comprimidos (LCH) DESCUENTO",
      laboratory: "Losartan",
      isBioequivalent: false,
      price: 490,
    });
    const farmex = offer("farmex", {
      name: "Losartan Potásico 50 mg x 30 comprimidos",
      laboratory: "CHILE",
      isBioequivalent: false,
      price: 990,
    });
    expect(mergeDuplicates([eco, farmex])).toHaveLength(2);
  });

  it("[OK, deseado] Tapsin de EcoFarmacias y de AraucoMed NO se fusionan (QA-01D)", () => {
    // "Tapsin X 6 Comprimidos (Maver)" vs "Tapsin Rojo Dolor de Cabeza Tira
    // x 6...". No hay evidencia de misma composición/EAN, así que la política
    // conservadora acierta al mantenerlos separados.
    const merged = mergeDuplicates([
      offer("ecofarmacias", { name: "Tapsin X 6 Comprimidos (Maver)", laboratory: "Maver" }),
      offer("araucomed", { name: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos" }),
    ]);
    expect(merged).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// SUB-HALLAZGO P0 (no reportado por QA, encontrado al reproducir QA-01C):
// matchKey solo lee la PRIMERA dosis y el PRIMER token alfabético del nombre.
// Un producto de COMBINACIÓN (losartán + hidroclorotiazida) produce el mismo
// matchKey que el monofármaco y termina FUSIONADO con él en la misma tarjeta.
// Observado en producción 2026-08-27, query "losartan":
//   losartan|50mg|30|bio:false|brand:ascend  agrupa
//     araucomed "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)"   $990
//     farmex    "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg
//                x 30 comprimidos"                                     $1990
// ---------------------------------------------------------------------------
describe("SUB-HALLAZGO — combinaciones fusionadas con el monofármaco", () => {
  it("[SIN CAMBIOS, por diseño] losartán+HCTZ sigue produciendo el mismo matchKey que losartán solo", () => {
    // `matchKey` NO se corrigió a propósito: su valor está persistido en
    // price_history, medication_match_key_aliases, pharmacy_clicks y
    // email_alerts. Cambiarlo invalidaría los históricos. La separación se
    // resuelve en `presentationKey` (ver el test siguiente).
    expect(matchKey("Losartan Potasico 50 mg x 30 comprimidos")).toBe("losartan|50mg|30");
    expect(
      matchKey("Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos")
    ).toBe("losartan|50mg|30");
  });

  it("[CORREGIDO S-1] ya NO se fusionan en una sola tarjeta, aunque compartan matchKey, marca y bio", () => {
    // DEFECTO ORIGINAL (Gate 1): con matchKey, marca y bio idénticos, ambos
    // caían en el mismo `presentationKey` y `mergeDuplicates` los devolvía como
    // UNA tarjeta con dos precios de dos medicamentos distintos ($990 el
    // monofármaco y $1990 la combinación) — un "ahorro" del 50% inexistente.
    const mono = offer("araucomed", {
      name: "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)",
      laboratory: "Ascend",
      price: 990,
    });
    const combo = offer("farmex", {
      name: "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos",
      laboratory: "Ascend",
      price: 1990,
    });

    expect(mono.matchKey).toBe(combo.matchKey);
    expect(mono.presentationKey).toBe("losartan|50mg|30|bio:false|brand:ascend");
    expect(combo.presentationKey).toBe(
      "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida"
    );

    const merged = mergeDuplicates([mono, combo]);
    expect(merged).toHaveLength(2);
    expect(merged.every((r) => r.prices.length === 1)).toBe(true);
  });

  it("[CORREGIDO S-1] un monofármaco y su combinación nunca comparten identidad de presentación", () => {
    // Era el `it.fails("[DESEADO] ...")` del Gate 1, que se expresaba sobre
    // `matchKey`. La corrección aprobada va en `presentationKey`, así que la
    // aserción se reexpresa sobre la clave que efectivamente decide
    // SAME_PRODUCT en `mergeDuplicates`.
    const mono = offer("araucomed", { name: "Losartan Potasico 50 mg x 30 comprimidos" });
    const combo = offer("farmex", {
      name: "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos",
    });
    expect(combo.presentationKey).not.toBe(mono.presentationKey);
  });

  it("[DEFECTO] la dosis capturada de una combinación depende del espaciado del nombre", () => {
    // "50 mg / 12.5 mg" → primer mgHit = 50   → losartan|50mg|30
    // "50/12,5mg"       → único  mgHit = 12,5 → losartan|12.5mg|30
    // La misma combinación cae en dos identidades distintas según cómo la
    // escriba cada farmacia.
    expect(
      matchKey("Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos")
    ).toBe("losartan|50mg|30");
    expect(matchKey("Losartan Hidroclorotiazida 50/12,5mg x30com")).toBe("losartan|12.5mg|30");
  });
});

// ---------------------------------------------------------------------------
// QA-01/QA-05 — forma farmacéutica ausente de la identidad. Ya identificado en
// BIOEQUIVALENCE-DATA-QUALITY-01 Gate 2 (decisión: agregarla como token nuevo
// SIN tocar matchKey persistido). Se caracteriza acá con datos de producción
// porque también explica resultados de QA-05.
// ---------------------------------------------------------------------------
describe("QA-01/QA-05 — forma farmacéutica y cantidad en la identidad", () => {
  it("[DEFECTO] comprimidos, masticables y efervescentes comparten identidad", () => {
    const base = "paracetamol|500mg|16";
    expect(matchKey("Paracetamol 500 mg x 16 comprimidos")).toBe(base);
    expect(matchKey("Paracetamol 500 mg x 16 comprimidos masticables")).toBe(base);
    expect(matchKey("Paracetamol 500 mg x 16 comprimidos efervescentes")).toBe(base);
  });

  it.fails("[DESEADO] la forma farmacéutica debería formar parte de la identidad comercial", () => {
    expect(matchKey("Paracetamol 500 mg x 16 comprimidos masticables")).not.toBe(
      matchKey("Paracetamol 500 mg x 16 comprimidos")
    );
  });

  it("[OK, no-regresión] concentración y cantidad SÍ distinguen identidad", () => {
    // "Paracetamol Infantil 80 mg 100 Comprimidos" (cruz-verde $590) aparece
    // entre los resultados de "paracetamol 500 mg 16 comprimidos", pero NO
    // por fusión: su identidad es correcta y distinta. Entra por falta de
    // filtro de relevancia (QA-05), no por un fallo de matching.
    expect(matchKey("Paracetamol Infantil  80 mg 100 Comprimidos")).toBe("paracetamol|80mg|100");
    expect(matchKey("Paracetamol 500 mg x 16 Comprimidos")).toBe("paracetamol|500mg|16");
    const merged = mergeDuplicates([
      offer("cruz-verde", { name: "Paracetamol Infantil  80 mg 100 Comprimidos", price: 590 }),
      offer("ahumada", { name: "Paracetamol 500 mg x 16 Comprimidos", price: 618 }),
    ]);
    expect(merged).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// QA-05 — el orden de la respuesta es exclusivamente por precio.
// `searchService.searchMedicationsDetailed()` hace
// `mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice)` y Mobile
// (`results.tsx`) reordena igual por `bestPrice`. Ningún atributo de la
// consulta participa.
// ---------------------------------------------------------------------------
describe("QA-05 — ranking exclusivamente por precio", () => {
  it("[DEFECTO QA-05] buscando 600mg, los 400mg quedan primero solo por ser más baratos", () => {
    const results = [
      offer("dr-simi", { name: "Ibuprofeno 600 mg 20 comprimidos recubiertos", laboratory: "OPKO", price: 1200 }),
      offer("farmex", { name: "Ibuprofeno 400 mg x 20 comprimidos", laboratory: "CHILE", price: 690 }),
      offer("dr-simi", { name: "Ibuprofeno 200 mg 20 comprimidos recubiertos", laboratory: "ASCEND", price: 1200 }),
    ];
    const ordered = mergeDuplicates(results).sort((a, b) => a.bestPrice - b.bestPrice);
    expect(ordered.map((r) => r.matchKey)).toEqual([
      "ibuprofeno|400mg|20",
      "ibuprofeno|600mg|20",
      "ibuprofeno|200mg|20",
    ]);
  });

  it.fails("[DESEADO] la concentración pedida debería quedar primera", () => {
    const results = [
      offer("dr-simi", { name: "Ibuprofeno 600 mg 20 comprimidos recubiertos", laboratory: "OPKO", price: 1200 }),
      offer("farmex", { name: "Ibuprofeno 400 mg x 20 comprimidos", laboratory: "CHILE", price: 690 }),
    ];
    const ordered = mergeDuplicates(results).sort((a, b) => a.bestPrice - b.bestPrice);
    expect(ordered[0].matchKey).toBe("ibuprofeno|600mg|20");
  });
});

// ---------------------------------------------------------------------------
// QA-04 — semántica del contador de bioequivalentes de Mobile.
// `mobile/src/app/results.tsx`: `bioCount = results.filter(r =>
// r.isBioequivalent).length`. Cuenta GRUPOS de la búsqueda actual con
// `isBioequivalent === true`, y ese flag viene del grupo (heredado de
// `canonical` en mergeDuplicates), no de la oferta individual.
// ---------------------------------------------------------------------------
describe("QA-04 — semántica del contador de bioequivalentes", () => {
  it("[DEFECTO QA-04] el flag del grupo se hereda del canonical sin regla explícita", () => {
    // Dos ofertas con `presentationKey` idéntica y bio contradictoria no
    // pueden existir hoy (bio forma parte de la clave), pero sí ocurre entre
    // grupos: el contador suma grupos completos, no ofertas verificadas.
    const merged = mergeDuplicates([
      offer("ahumada", { name: "Tapsin Forte x 20 Comprimidos Recubiertos", price: 3756, isBioequivalent: true }),
      offer("cruz-verde", { name: "Tapsin Forte x 20 Comprimidos Recubiertos", price: 3900, isBioequivalent: false }),
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.filter((r) => r.isBioequivalent).length).toBe(1);
  });

  it("[DEFECTO QA-04] el contador incluye grupos que no son alternativas del producto buscado", () => {
    // Producción 2026-08-27, query "tapsin": 102 grupos / 21 con bio=true.
    // De esos 21, 19 vienen de Ahumada y son productos de MARCA Tapsin
    // (Tapsin Forte, Tapsin Periodo, Tapsin Compuesto Antigripal), no
    // bioequivalentes genéricos del producto consultado. El banner
    // "Hay 21 bioequivalentes disponibles — generalmente más económicos"
    // cuenta grupos de la búsqueda, sin relación de alternativa terapéutica
    // con la consulta ni con ninguna presentación concreta.
    const results = mergeDuplicates([
      offer("ahumada", { name: "Tapsin Forte x 20 Comprimidos Recubiertos", price: 3756, isBioequivalent: true }),
      offer("ahumada", { name: "Tapsin Periodo x 12 Comprimidos", price: 2149, isBioequivalent: true }),
      offer("ahumada", { name: "Tapsin 1g Efervescente X 20 Sobres", price: 5895, isBioequivalent: true }),
    ]);
    const bioCount = results.filter((r) => r.isBioequivalent).length;
    expect(bioCount).toBe(3);
    // Ninguno de los tres es un genérico bioequivalente; ver el defecto de
    // scraping de Ahumada caracterizado en
    // api/src/__tests__/searchQualityQA.characterization.test.ts.
  });
});
