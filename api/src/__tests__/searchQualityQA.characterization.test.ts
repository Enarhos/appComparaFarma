/**
 * SEARCH-MATCHING-QA-01 — Gate 1 (diagnóstico), lado API.
 *
 * Tests de CARACTERIZACIÓN sobre los adaptadores de farmacia. Documentan el
 * comportamiento REAL de hoy, incluido el defectuoso. NO corrigen nada — la
 * corrección es el Gate 2 y requiere aprobación CTO explícita.
 *
 * Convención (igual que en packages/domain/src/__tests__/
 * searchQualityQA.characterization.test.ts):
 *   - `it(...)`       con "[DEFECTO ...]"   → congela el defecto actual.
 *   - `it.fails(...)` con "[DESEADO]"       → expresa el comportamiento correcto;
 *                                              pasa mientras el defecto exista.
 *   - `it(...)`       con "[CORREGIDO S-X]" → el Gate 2 ya corrigió ese defecto;
 *                                              el test dejó de congelarlo y pasó
 *                                              a verificar el comportamiento
 *                                              correcto, conservando en el
 *                                              comentario qué defecto cubría.
 *
 * Gate 2 (2026-08-27) corrigió S-2 (Ahumada/bioequivalencia). CF-SEARCH-002
 * (2026-08-28) corrigió la clave de caché de QA-05. Los demás defectos
 * caracterizados acá siguen abiertos y fuera de alcance (EasyFarma
 * `isBioequivalent` fabricado, GTIN/EAN ausente del contrato).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseAhumadaHtml } from "../clients/ahumada.js";
import { parseEasyFarmaResponse } from "../clients/easyfarma.js";
import { cleanQuery, parseQueryIntent, queryIntentCacheKey } from "@comparafarma/domain";

// Captura literal de https://www.farmaciasahumada.cl/on/demandware.store/
// Sites-ahumada-cl-Site/default/Search-ShowAjax?q=tapsin (2026-08-27, GET
// read-only), recortada a 2 product-tile reales sin editar su marcado.
const realHtml = readFileSync(
  join(import.meta.dirname, "fixtures", "ahumada-search-real-bio-badges.html"),
  "utf8"
);

describe("QA-04 / S-2 — Ahumada marcaba TODOS sus productos como bioequivalentes (corregido en Gate 2)", () => {
  it("el fixture real contiene el contenedor que el sitio emite en todos los tiles", () => {
    // `sellcondition-bioequivalent-badges` es el contenedor; aparece siempre.
    // `bioequivalent-badge-container` es el badge de verdad; aparece solo
    // cuando el producto ES bioequivalente. En la página real de "tapsin":
    // 24 tiles, 24 contenedores, 7 badges reales.
    expect(realHtml).toContain("sellcondition-bioequivalent-badges");
    expect(parseAhumadaHtml(realHtml)).toHaveLength(2);
  });

  it("[CORREGIDO S-2] el contenedor vacío YA NO cuenta como badge", () => {
    // DEFECTO ORIGINAL (Gate 1): el contenedor se llama
    // `sellcondition-bioequivalent-badgeS` y CONTIENE la subcadena
    // `bioequivalent-badge`; el chequeo por substring de
    // api/src/clients/ahumada.ts no distinguía contenedor de badge, así que el
    // tile SIN badge real ("Tapsin 1g Efervescente") salía con
    // `isBioequivalent: true`. Medido en producción 2026-08-27: en las 8
    // búsquedas capturadas (ibuprofeno x3, omeprazol, losartan, paracetamol
    // x2, tapsin) Ahumada devolvió 0 ofertas con `isBioequivalent=false`.
    //
    // FIX (Gate 2, S-2): `hasBioequivalentBadge()` exige un token de clase
    // exacto. Este test pasó de congelar el defecto a verificar la corrección.
    const results = parseAhumadaHtml(realHtml);

    const sinBadge = results.find((r) => r.name.includes("Tapsin 1g Efervescente"));
    const conBadge = results.find((r) => r.name.includes("Tapsin Puro Sin Cafeina"));

    expect(sinBadge).toBeDefined();
    expect(conBadge).toBeDefined();

    expect(conBadge!.isBioequivalent).toBe(true);
    expect(sinBadge!.isBioequivalent).toBe(false);

    // Ya no es "100% true": el mismo HTML real produce ahora 1 de 2.
    expect(results.every((r) => r.isBioequivalent)).toBe(false);
  });

  it("[CORREGIDO S-2] un producto sin badge real no se marca bioequivalente", () => {
    // Era el `it.fails("[DESEADO] ...")` del Gate 1 — ahora es una aserción
    // normal porque el comportamiento deseado es el vigente.
    const results = parseAhumadaHtml(realHtml);
    const sinBadge = results.find((r) => r.name.includes("Tapsin 1g Efervescente"));
    expect(sinBadge!.isBioequivalent).toBe(false);
  });

  it("[CORREGIDO S-2] el fixture `ahumada-search.html` ya reproduce el marcado real", () => {
    // HALLAZGO ORIGINAL (Gate 1): `ahumada-search.html` era HTML simplificado
    // escrito a mano, SIN el contenedor `sellcondition-bioequivalent-badges` —
    // por eso `ahumada.test.ts` quedaba verde mientras producción fallaba al
    // 100%. El Gate 2 lo reemplazó por marcado real de la misma captura.
    const fixture = readFileSync(
      join(import.meta.dirname, "fixtures", "ahumada-search.html"),
      "utf8"
    );
    expect(fixture).toContain("sellcondition-bioequivalent-badges");
    expect(fixture).toContain("bioequivalent-badge-container");
  });
});

describe("QA-03/QA-04 — EasyFarma nunca declara bioequivalencia ni laboratorio", () => {
  const html = readFileSync(join(import.meta.dirname, "fixtures", "easyfarma-search.html"), "utf8");

  it("[DEFECTO] EasyFarma devuelve isBioequivalent=false fijo, no `null` (desconocido)", () => {
    // El listado de EasyFarma no expone bioequivalencia. Devolver `false`
    // afirma "NO es bioequivalente", que es una afirmación distinta de "no
    // se sabe". Como `bio:` forma parte de `presentationKey`, ese `false`
    // fabricado parte grupos contra farmacias que sí declaran `true`.
    // Misma forma en api/src/clients/farmex.ts.
    const results = parseEasyFarmaResponse(html);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.isBioequivalent === false)).toBe(true);
    expect(results.every((r) => r.laboratory === null)).toBe(true);
  });

  it.fails("[DESEADO] la ausencia de dato debería representarse como `null`", () => {
    const results = parseEasyFarmaResponse(html);
    expect(results.every((r) => r.isBioequivalent === null)).toBe(true);
  });

  it("[HALLAZGO] EasyFarma sí expone EAN-13 en la ficha de producto, pero el cliente no lo captura", () => {
    // Verificado por HTTP GET read-only (2026-08-27) sobre las 3 fichas del
    // caso QA-03: cada una trae `sku`/`mpn` EAN-13 en su JSON-LD Product
    //   102263 → 8903726285541 (Hetero)
    //   105275 → 8904317830171 (Hetero)
    //   104459 → 7804650886839 (Ascend)
    // `ScrapedProduct` no tiene campo para GTIN/EAN, así que la evidencia de
    // identidad más fuerte disponible hoy se descarta. Este test congela esa
    // ausencia de contrato.
    const results = parseEasyFarmaResponse(html);
    expect(results.every((r) => !("gtin" in r) && !("ean" in r) && !("sku" in r))).toBe(true);
  });
});

describe("QA-05 — la clave de caché de /api/search ignora la concentración", () => {
  it("[SIN CAMBIOS, por diseño] las cuatro consultas comparten la clave de RETRIEVAL", () => {
    // La consulta amplia sigue siendo la misma para las cuatro, y eso es
    // deliberado: es lo que se le manda a los 9 scrapers, y es la clave del
    // nivel `cfsearch:r:` de la caché. Gracias a eso, pedir 200, 400 y 600 mg
    // NO multiplica por tres el scraping.
    const keys = ["ibuprofeno 400 mg", "ibuprofeno 600 mg", "ibuprofeno 200 mg", "ibuprofeno"].map(
      (q) => cleanQuery(q).toLowerCase()
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe("ibuprofeno");
  });

  it("[CORREGIDO CF-SEARCH-002] la clave de RESPUESTA ya no las colapsa", () => {
    // DEFECTO ORIGINAL (Gate 1), api/src/routes/search.ts:
    //   `const cacheKey = query.toLowerCase() + ...`  con `query = cleanQuery(raw)`
    // Reproducido contra producción dos veces (2026-08-27 y 2026-08-28):
    // "ibuprofeno 400 mg" respondió `x-search-cache: miss` y las consultas
    // siguientes de 600 mg y 200 mg respondieron `hit` con los mismos
    // resultados ya rankeados por precio.
    //
    // FIX: la clave de respuesta es `queryIntentCacheKey(intent)`, que
    // incorpora dosis, cantidad y forma.
    const keys = ["ibuprofeno 400 mg", "ibuprofeno 600 mg", "ibuprofeno 200 mg", "ibuprofeno"].map(
      (q) => queryIntentCacheKey(parseQueryIntent(q))
    );
    expect(new Set(keys).size).toBe(4);
    expect(keys).toEqual([
      "ibuprofeno|dose:400mg",
      "ibuprofeno|dose:600mg",
      "ibuprofeno|dose:200mg",
      "ibuprofeno",
    ]);
  });
});
