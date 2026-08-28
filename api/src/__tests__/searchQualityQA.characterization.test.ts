/**
 * SEARCH-MATCHING-QA-01 — Gate 1 (diagnóstico), lado API.
 *
 * Tests de CARACTERIZACIÓN sobre los adaptadores de farmacia. Documentan el
 * comportamiento REAL de hoy, incluido el defectuoso. NO corrigen nada — la
 * corrección es el Gate 2 y requiere aprobación CTO explícita.
 *
 * Convención (igual que en packages/domain/src/__tests__/
 * searchQualityQA.characterization.test.ts):
 *   - `it(...)`       con "[DEFECTO ...]" → congela el defecto actual.
 *   - `it.fails(...)` con "[DESEADO]"     → expresa el comportamiento correcto;
 *                                            pasa mientras el defecto exista.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseAhumadaHtml } from "../clients/ahumada.js";
import { parseEasyFarmaResponse } from "../clients/easyfarma.js";
import { cleanQuery } from "@comparafarma/domain";

// Captura literal de https://www.farmaciasahumada.cl/on/demandware.store/
// Sites-ahumada-cl-Site/default/Search-ShowAjax?q=tapsin (2026-08-27, GET
// read-only), recortada a 2 product-tile reales sin editar su marcado.
const realHtml = readFileSync(
  join(import.meta.dirname, "fixtures", "ahumada-search-real-bio-badges.html"),
  "utf8"
);

describe("QA-04 — Ahumada marca TODOS sus productos como bioequivalentes", () => {
  it("el fixture real contiene el contenedor que el sitio emite en todos los tiles", () => {
    // `sellcondition-bioequivalent-badges` es el contenedor; aparece siempre.
    // `bioequivalent-badge-container` es el badge de verdad; aparece solo
    // cuando el producto ES bioequivalente. En la página real de "tapsin":
    // 24 tiles, 24 contenedores, 7 badges reales.
    expect(realHtml).toContain("sellcondition-bioequivalent-badges");
    expect(parseAhumadaHtml(realHtml)).toHaveLength(2);
  });

  it("[DEFECTO QA-04] `block.includes(\"bioequivalent-badge\")` matchea el contenedor vacío", () => {
    // Causa raíz: el contenedor se llama `sellcondition-bioequivalent-badgeS`
    // y CONTIENE la subcadena `bioequivalent-badge`. El chequeo por substring
    // de api/src/clients/ahumada.ts no distingue contenedor de badge.
    const results = parseAhumadaHtml(realHtml);

    const sinBadge = results.find((r) => r.name.includes("Tapsin 1g Efervescente"));
    const conBadge = results.find((r) => r.name.includes("Tapsin Puro Sin Cafeina"));

    expect(sinBadge).toBeDefined();
    expect(conBadge).toBeDefined();

    // El que SÍ tiene badge real: correcto.
    expect(conBadge!.isBioequivalent).toBe(true);
    // El que NO tiene badge real: falso positivo.
    expect(sinBadge!.isBioequivalent).toBe(true);

    // Consecuencia medida en producción (2026-08-27): en las 8 búsquedas
    // capturadas (ibuprofeno x3, omeprazol, losartan, paracetamol x2, tapsin)
    // Ahumada devolvió 0 ofertas con isBioequivalent=false. 100% true.
    expect(results.every((r) => r.isBioequivalent)).toBe(true);
  });

  it.fails("[DESEADO] un producto sin badge real no debería marcarse bioequivalente", () => {
    const results = parseAhumadaHtml(realHtml);
    const sinBadge = results.find((r) => r.name.includes("Tapsin 1g Efervescente"));
    expect(sinBadge!.isBioequivalent).toBe(false);
  });

  it("[HALLAZGO] el fixture existente `ahumada-search.html` no reproduce el marcado real", () => {
    // No se modifica ni se borra el fixture/test existente (ahumada.test.ts
    // sigue pasando). Se deja registrado por qué ese test verde convivía con
    // un defecto del 100% en producción: es HTML simplificado escrito a mano,
    // sin el contenedor `sellcondition-bioequivalent-badges`. Mismo patrón ya
    // documentado para el parser de precios de EasyFarma.
    const legacy = readFileSync(
      join(import.meta.dirname, "fixtures", "ahumada-search.html"),
      "utf8"
    );
    expect(legacy).not.toContain("sellcondition-bioequivalent-badges");
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
  it("[DEFECTO QA-05] tres concentraciones distintas comparten cacheKey", () => {
    // api/src/routes/search.ts: `const cacheKey = query.toLowerCase() + ...`
    // donde `query = cleanQuery(rawQuery)`. Reproducido contra producción:
    // "ibuprofeno 400 mg" respondió `x-search-cache: miss` y las consultas
    // siguientes de 600 mg y 200 mg respondieron `hit` con los mismos 108
    // resultados / 29 Bio.
    const keys = ["ibuprofeno 400 mg", "ibuprofeno 600 mg", "ibuprofeno 200 mg", "ibuprofeno"].map(
      (q) => cleanQuery(q).toLowerCase()
    );
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe("ibuprofeno");
  });
});
