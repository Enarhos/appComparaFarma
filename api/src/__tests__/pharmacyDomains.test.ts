/**
 * CF-SEARCH-001 — validación de URL por fuente.
 *
 * Los hosts usados acá son los REALES observados en la respuesta de producción
 * (`GET https://comparafarma-api.vercel.app/api/search`, read-only,
 * 2026-08-27), uno por cada una de las 9 farmacias.
 */
import { describe, expect, it } from "vitest";

import {
  PHARMACY_ALLOWED_DOMAINS,
  isPharmacyOwnedUrl,
  sanitizePharmacyUrl,
} from "../lib/pharmacyDomains.js";
import { isAllowedRedirectUrl } from "../lib/clickTracking.js";
import type { PharmacySlug } from "../lib/types.js";

const REAL_PRODUCT_URLS: Record<PharmacySlug, string> = {
  "cruz-verde": "https://www.cruzverde.cl/tapsin-insta-flu-polvo-dia/573946.html",
  salcobrand: "https://salcobrand.cl/products/tapsin-instaflu-d-n-b-paracetamol?default_sku=1",
  ahumada: "https://www.farmaciasahumada.cl/tapsin-x-30-comprimidos-88013.html",
  "dr-simi": "https://www.drsimi.cl/tapsin-compuesto-antigripal-noche/p",
  araucomed: "https://farmacia.araucomed.com/analgesicos-y-antinflamatorios/tapsin-forte-x20com",
  ecofarmacias: "https://www.ecofarmacias.cl/producto/tapsin-forte-x-20/",
  farmex: "https://farmex.cl/products/tapsin-forte-x-20-comp",
  sermecoop: "https://www.farmaciasermecoop.cl/index.php/online/detalleproducto?p_=12198",
  easyfarma: "https://nuevo.easyfarma.cl/104320-omeprazol-20-mg-x-30-cap-lab-ascend.html",
};

const SLUGS = Object.keys(REAL_PRODUCT_URLS) as PharmacySlug[];

describe("isPharmacyOwnedUrl", () => {
  it("acepta la URL real de producto de cada una de las 9 farmacias", () => {
    for (const slug of SLUGS) {
      expect(isPharmacyOwnedUrl(slug, REAL_PRODUCT_URLS[slug])).toBe(true);
    }
  });

  it("acepta cualquier subdominio del dominio raíz de la farmacia", () => {
    // Los hosts reales ya usan tres prefijos distintos (`www.`, `farmacia.`,
    // `nuevo.`) y las farmacias migran de subdominio sin avisar.
    expect(isPharmacyOwnedUrl("easyfarma", "https://easyfarma.cl/producto")).toBe(true);
    expect(isPharmacyOwnedUrl("easyfarma", "https://otro.easyfarma.cl/producto")).toBe(true);
    expect(isPharmacyOwnedUrl("araucomed", "https://www.araucomed.com/x")).toBe(true);
  });

  it("rechaza la URL de OTRA farmacia — el caso AraucoMed → EcoFarmacias", () => {
    for (const slug of SLUGS) {
      for (const otherSlug of SLUGS) {
        if (slug === otherSlug) continue;
        expect(isPharmacyOwnedUrl(slug, REAL_PRODUCT_URLS[otherSlug])).toBe(false);
      }
    }
  });

  it("rechaza dominios que solo terminan parecido, http, y basura", () => {
    // "malicioso-ecofarmacias.cl" NO es subdominio de "ecofarmacias.cl".
    expect(isPharmacyOwnedUrl("ecofarmacias", "https://malicioso-ecofarmacias.cl/x")).toBe(false);
    expect(isPharmacyOwnedUrl("ecofarmacias", "https://ecofarmacias.cl.attacker.com/x")).toBe(false);
    expect(isPharmacyOwnedUrl("ecofarmacias", "http://www.ecofarmacias.cl/x")).toBe(false);
    expect(isPharmacyOwnedUrl("ecofarmacias", "javascript:alert(1)")).toBe(false);
    expect(isPharmacyOwnedUrl("ecofarmacias", "/producto/relativo")).toBe(false);
    expect(isPharmacyOwnedUrl("ecofarmacias", "")).toBe(false);
  });

  it("hay un dominio declarado para cada slug del contrato", () => {
    for (const slug of SLUGS) {
      expect(PHARMACY_ALLOWED_DOMAINS[slug]).toBeTruthy();
    }
  });
});

describe("sanitizePharmacyUrl", () => {
  it("deja pasar la URL propia y anula la ajena", () => {
    expect(sanitizePharmacyUrl("araucomed", REAL_PRODUCT_URLS.araucomed)).toBe(
      REAL_PRODUCT_URLS.araucomed
    );
    expect(sanitizePharmacyUrl("araucomed", REAL_PRODUCT_URLS.ecofarmacias)).toBeNull();
  });

  it("acepta null de entrada sin romper", () => {
    expect(sanitizePharmacyUrl("araucomed", null)).toBeNull();
  });
});

describe("isAllowedRedirectUrl — /api/go sigue con el mismo contrato", () => {
  it("se apoya en el mismo registro de dominios", () => {
    expect(isAllowedRedirectUrl("farmex", REAL_PRODUCT_URLS.farmex)).toBe(true);
    expect(isAllowedRedirectUrl("farmex", REAL_PRODUCT_URLS.ahumada)).toBe(false);
    expect(isAllowedRedirectUrl("farmex", "http://farmex.cl/x")).toBe(false);
  });
});
