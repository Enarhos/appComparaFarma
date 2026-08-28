import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { hasBioequivalentBadge, parseAhumadaHtml } from "../clients/ahumada.js";

const fixturePath = join(import.meta.dirname, "fixtures", "ahumada-search.html");
const html = readFileSync(fixturePath, "utf8");

// Captura literal del sitio real (2026-08-27), 2 tiles: uno con badge real y
// otro con el contenedor vacío. Ver el encabezado del propio fixture.
const realHtml = readFileSync(
  join(import.meta.dirname, "fixtures", "ahumada-search-real-bio-badges.html"),
  "utf8"
);

describe("parseAhumadaHtml", () => {
  it("parses direct store prices and detects bioequivalent badge", () => {
    const results = parseAhumadaHtml(html);
    const paracetamol = results.find((result) => result.name.includes("Paracetamol 500 mg x 16"));

    expect(paracetamol).toMatchObject({
      name: "Paracetamol 500 mg x 16 Comprimidos",
      price: 731,
      cmrPrice: null,
      isBioequivalent: true,
      onlineUrl: "https://www.farmaciasahumada.cl/paracetamol-500-mg-x-16-comprimidos-84574.html",
    });
  });

  it("parses CMR badge pricing and reconstructs the higher store price", () => {
    const results = parseAhumadaHtml(html);
    const bufferin = results.find((result) => result.name.includes("Bufferin Forte"));

    expect(bufferin).toMatchObject({
      name: "Bufferin Forte Paracetamol 1 G 18 Comprimidos",
      price: 12990,
      cmrPrice: 10990,
      isBioequivalent: false,
    });
  });
});

/**
 * S-2 (SEARCH-MATCHING-QA-01, Gate 2) — Ahumada marcaba el 100% de sus ofertas
 * como bioequivalentes.
 *
 * Causa raíz: `block.includes("bioequivalent-badge")` matcheaba por substring
 * el CONTENEDOR `sellcondition-bioequivalent-badges`, que el sitio emite en
 * TODOS los tiles esté vacío o no, en vez del badge real. Estos casos fijan la
 * distinción contenedor vs badge sobre marcado real capturado del sitio.
 */
describe("parseAhumadaHtml — bioequivalencia (fix S-2)", () => {
  it("el fixture usa el marcado real: contenedor presente en ambos tiles", () => {
    // Si esta aserción falla, el fixture volvió a ser HTML simplificado a mano
    // y dejó de cubrir el defecto S-2.
    expect(html.match(/class="position-absolute sellcondition-bioequivalent-badges/g)).toHaveLength(2);
  });

  it("un tile con el badge REAL se marca bioequivalente", () => {
    const paracetamol = parseAhumadaHtml(html).find((r) => r.name.includes("Paracetamol 500 mg x 16"));
    expect(paracetamol!.isBioequivalent).toBe(true);
  });

  it("un tile con el contenedor VACÍO nunca se marca bioequivalente", () => {
    const bufferin = parseAhumadaHtml(html).find((r) => r.name.includes("Bufferin Forte"));
    expect(bufferin!.isBioequivalent).toBe(false);
  });

  it("sobre la captura real del sitio, distingue los dos tiles (1 de 2 bioequivalente)", () => {
    const results = parseAhumadaHtml(realHtml);
    const sinBadge = results.find((r) => r.name.includes("Tapsin 1g Efervescente"));
    const conBadge = results.find((r) => r.name.includes("Tapsin Puro Sin Cafeina"));

    expect(sinBadge!.isBioequivalent).toBe(false);
    expect(conBadge!.isBioequivalent).toBe(true);
    expect(results.filter((r) => r.isBioequivalent)).toHaveLength(1);
  });

  it("hasBioequivalentBadge exige un token de clase exacto, no una subcadena", () => {
    // El contenedor que el sitio emite siempre (plural, con prefijo).
    expect(hasBioequivalentBadge('<div class="position-absolute sellcondition-bioequivalent-badges d-flex">')).toBe(false);
    // Los dos marcadores reales del badge.
    expect(hasBioequivalentBadge('<div class="bioequivalent-badge-container">')).toBe(true);
    expect(hasBioequivalentBadge('<img class="js-popover bioequivalent-badge" src="ico_b.png"/>')).toBe(true);
    // Cualquier otro marcado del tile no debe activarlo.
    expect(hasBioequivalentBadge('<div class="promotion-badge-container">$731</div>')).toBe(false);
  });
});
