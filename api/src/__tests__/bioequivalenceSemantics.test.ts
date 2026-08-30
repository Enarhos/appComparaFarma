import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { positiveBioSignal } from "../lib/bioequivalence.js";
import { parseAhumadaHtml } from "../clients/ahumada.js";
import { parseAraucoMedResponse } from "../clients/araucomed.js";
import { parseCruzVerdeResponse } from "../clients/cruzverde.js";
import { parseDrSimiResponse } from "../clients/drsimi.js";
import { parseEasyFarmaResponse } from "../clients/easyfarma.js";
import { parseEcoFarmaciasResponse } from "../clients/ecofarmacias.js";
import { parseFarmexResponse } from "../clients/farmex.js";
import { parseSermecoopHtml } from "../clients/sermecoop.js";
import { parseSalcobrandResponse } from "../clients/salcobrand.js";

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 — matriz de semántica del dato de
 * bioequivalencia, ejecutable, para las 9 farmacias.
 *
 * Invariante único que fija este archivo: **ninguna farmacia puede escribir
 * `false` salvo que su fuente entregue evidencia NEGATIVA explícita.** Hoy la
 * única que la entrega es Dr. Simi (`Bioequivalente: ["NO"]`). Para todas las
 * demás, la ausencia de señal positiva es `null` = "no informado".
 *
 * Cada caso está anclado a la evidencia real recogida en la auditoría del
 * 2026-08-30 (GET read-only contra las 9 fuentes) y documentada en los
 * comentarios de cada adaptador.
 */

const fixtureDir = join(import.meta.dirname, "fixtures");
const readFixture = (name: string): string => readFileSync(join(fixtureDir, name), "utf8");

describe("positiveBioSignal — traductor de evidencia positiva a tri-estado", () => {
  it("presencia de la señal ⇒ true", () => {
    expect(positiveBioSignal(true)).toBe(true);
  });

  it("ausencia de la señal ⇒ null, NUNCA false", () => {
    expect(positiveBioSignal(false)).toBeNull();
    expect(positiveBioSignal(false)).not.toBe(false);
  });
});

describe("Cruz Verde — el índice de búsqueda no expone bioequivalencia", () => {
  // Evidencia (2026-08-30): las claves de cada `hit` de
  // `dw/shop/v19_1/product_search` son `_type, currency, hit_type, image,
  // link, orderable, price, prices, product_id, product_name, product_type,
  // represented_product`. Ninguna de bioequivalencia. El atributo real
  // (`c_isBioequivalent`) sólo existe en el endpoint de DETALLE.
  const searchHit = {
    hits: [
      {
        product_id: "272241",
        product_name: "Paracetamol 500 mg 16 Comprimidos",
        price: 840,
        orderable: true,
      },
    ],
  };

  it("un hit real (sin ningún atributo de bioequivalencia) ⇒ null", () => {
    const [result] = parseCruzVerdeResponse(searchHit, "paracetamol");
    expect(result.isBioequivalent).toBeNull();
    expect(result.isBioequivalent).not.toBe(false);
  });

  it("el fixture completo tampoco produce ningún `false` fabricado", () => {
    const fixture = JSON.parse(readFixture("cruzverde-search.json")) as {
      hits: Record<string, unknown>[];
    };
    const results = parseCruzVerdeResponse(fixture, "paracetamol");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.isBioequivalent === false)).toBe(false);
  });

  it("si Cruz Verde agregara el atributo al índice, un booleano real sí se respeta", () => {
    const withAttribute = {
      hits: [{ ...searchHit.hits[0], c_isBioequivalent: true }],
    };
    expect(parseCruzVerdeResponse(withAttribute, "paracetamol")[0].isBioequivalent).toBe(true);

    const negative = {
      hits: [{ ...searchHit.hits[0], c_isBioequivalent: false }],
    };
    expect(parseCruzVerdeResponse(negative, "paracetamol")[0].isBioequivalent).toBe(false);
  });

  it("un valor que no sea booleano NO se coacciona (ni a true ni a false)", () => {
    const noisy = { hits: [{ ...searchHit.hits[0], c_isBioequivalent: "" }] };
    expect(parseCruzVerdeResponse(noisy, "paracetamol")[0].isBioequivalent).toBeNull();
  });
});

describe("Salcobrand — `has_bioequivalent` habla de OTRA cosa y ya no se lee", () => {
  const hit = (bio: Record<string, unknown> | null, name: string) => ({
    hits: [
      {
        name,
        normal_price: 9990,
        slug: "producto",
        sku: "1",
        brand: "Marca",
        bioequivalent_filter: bio,
      },
    ],
  });

  it("REFERENTE con has_bioequivalent=true ⇒ null (antes: true, falso positivo)", () => {
    const data = hit({ has_bioequivalent: true, label: "Bioequivalentes" }, "Lipitor (R) Atorvastatina 20mg 30 Comprimidos");
    expect(parseSalcobrandResponse(data, "atorvastatina")[0].isBioequivalent).toBeNull();
  });

  it("BIOEQUIVALENTE real con has_bioequivalent=false ⇒ null (antes: false, falso negativo)", () => {
    const data = hit({ has_bioequivalent: false, label: "Sin Bioequivalentes" }, "Omeprazol (B) 20mg 30 Cápsulas Recubiertas");
    const result = parseSalcobrandResponse(data, "omeprazol")[0];
    expect(result.isBioequivalent).toBeNull();
    expect(result.isBioequivalent).not.toBe(false);
  });

  it("sin el campo ⇒ null", () => {
    const data = hit(null, "Paracetamol 500mg 16 Comprimidos");
    expect(parseSalcobrandResponse(data, "paracetamol")[0].isBioequivalent).toBeNull();
  });
});

describe("Ahumada — el badge es evidencia positiva; su ausencia no es negativa", () => {
  const realHtml = readFixture("ahumada-search-real-bio-badges.html");

  it("badge presente ⇒ true; contenedor vacío ⇒ null", () => {
    const results = parseAhumadaHtml(realHtml);
    expect(results.filter((r) => r.isBioequivalent === true)).toHaveLength(1);
    expect(results.filter((r) => r.isBioequivalent === null)).toHaveLength(1);
    expect(results.filter((r) => r.isBioequivalent === false)).toHaveLength(0);
  });
});

describe("Dr. Simi — única fuente con evidencia NEGATIVA explícita", () => {
  const product = (bio: unknown) => [
    {
      productName: "Paracetamol 500 mg 16 comprimidos",
      brand: "ANDRÓMACO",
      link: "https://www.drsimi.cl/paracetamol/p",
      Bioequivalente: bio,
      items: [
        {
          images: [{ imageUrl: "https://img/x.jpg" }],
          sellers: [
            {
              commertialOffer: { Price: 480, ListPrice: 550, IsAvailable: true, AvailableQuantity: 5 },
            },
          ],
        },
      ],
    } as Record<string, unknown>,
  ];

  it('["SI"] ⇒ true', () => {
    expect(parseDrSimiResponse(product(["SI"]), "paracetamol")[0].isBioequivalent).toBe(true);
  });

  it('["NO"] ⇒ false — acá `false` SÍ significa "la fuente afirma que no lo es"', () => {
    expect(parseDrSimiResponse(product(["NO"]), "paracetamol")[0].isBioequivalent).toBe(false);
  });

  it("campo ausente ⇒ null (antes colapsaba a false)", () => {
    expect(parseDrSimiResponse(product(undefined), "paracetamol")[0].isBioequivalent).toBeNull();
  });

  it("campo con un valor fuera del vocabulario ⇒ null", () => {
    expect(parseDrSimiResponse(product(["QUIZAS"]), "paracetamol")[0].isBioequivalent).toBeNull();
    expect(parseDrSimiResponse(product([""]), "paracetamol")[0].isBioequivalent).toBeNull();
  });
});

describe("AraucoMed — el texto no menciona bioequivalencia en ningún producto real", () => {
  const product = (name: string, descriptionShort: string) => ({
    products: [
      {
        id_product: 1,
        name,
        price_amount: 1490,
        manufacturer_name: "Laboratorio Chile",
        url: "https://farmacia.araucomed.com/bioequivalentes/omeprazol-20mg-x30cap-chile",
        description_short: descriptionShort,
        active: 1,
        cover: null,
      },
    ],
  });

  it("sin mención textual ⇒ null (antes: false para el 100% del catálogo)", () => {
    const results = parseAraucoMedResponse(product("Omeprazol 20 mg x 30 cápsulas. (Chile)", "<p>Omeprazol 20mg</p>"));
    expect(results[0].isBioequivalent).toBeNull();
    expect(results[0].isBioequivalent).not.toBe(false);
  });

  it("con mención textual explícita ⇒ true (se conserva el detector positivo)", () => {
    const results = parseAraucoMedResponse(
      product("Omeprazol 20 mg Bioequivalente x 30 cápsulas", "<p>Omeprazol 20mg</p>")
    );
    expect(results[0].isBioequivalent).toBe(true);
  });

  it("la URL de la categoría `/bioequivalentes/` NO se usa como evidencia", () => {
    // El mismo Omeprazol de Ascend aparece bajo "Bioequivalentes" en su
    // presentación x60 y bajo "Antiulcerosos" en la x30: la categoría primaria
    // no es un marcador de bioequivalencia por producto.
    const results = parseAraucoMedResponse(product("Omeprazol 20 mg x 30 cápsulas. (Chile)", ""));
    expect(results[0].onlineUrl).toContain("/bioequivalentes/");
    expect(results[0].isBioequivalent).toBeNull();
  });
});

describe("EcoFarmacias — la categoría es evidencia positiva; su ausencia no es negativa", () => {
  const product = (name: string, slugs: string[]) => [
    {
      name,
      prices: { price: "1290", regular_price: "1290", sale_price: "1290" },
      is_in_stock: true,
      images: [],
      categories: slugs.map((slug) => ({ slug, name: slug })),
      permalink: "https://www.ecofarmacias.cl/producto/x",
      on_sale: false,
    },
  ];

  it("categoría `medicamentos-bioequivalentes` ⇒ true", () => {
    const results = parseEcoFarmaciasResponse(
      product("Dropol Paracetamol 1gr x 20 Comprimidos", ["medicamentos-bioequivalentes", "medicamentos"]) as never
    );
    expect(results[0].isBioequivalent).toBe(true);
  });

  it("sin esa categoría ⇒ null — la taxonomía es curada a mano e inconsistente", () => {
    // Evidencia real (2026-08-30): "Paracetamol 1gr x 20 (Hospifarma)" no está
    // en la categoría aunque es el mismo producto que "Dropol Paracetamol 1gr
    // x 20", que sí lo está.
    const results = parseEcoFarmaciasResponse(
      product("Paracetamol 1gr x 20 Comprimidos (Hospifarma)", ["medicamentos", "respiratorio"]) as never
    );
    expect(results[0].isBioequivalent).toBeNull();
    expect(results[0].isBioequivalent).not.toBe(false);
  });
});

describe("Farmex — la fuente no entrega el dato", () => {
  const products = [
    {
      title: "Paracetamol 500 mg x 16 comprimidos",
      price: "990",
      compare_at_price: null,
      vendor: "ANDROMACO",
      available: true,
      url: "/products/paracetamol-500-mg-x-16-comprimidos",
      image: null,
    },
  ];

  it("siempre null, nunca false", () => {
    const results = parseFarmexResponse(products);
    expect(results).toHaveLength(1);
    expect(results[0].isBioequivalent).toBeNull();
    expect(results[0].isBioequivalent).not.toBe(false);
  });

  it("un slug que casualmente dice `bioequivalente` no se usa como evidencia", () => {
    const results = parseFarmexResponse([
      { ...products[0], url: "/products/paraceta-bioequivalente-comprimidos-paracetamol" },
    ]);
    expect(results[0].isBioequivalent).toBeNull();
  });
});

describe("Sermecoop — el badge `bioeq1.png` es evidencia positiva por producto", () => {
  const card = (withBadge: boolean) => `
    <div class="card h-100 shadow-sm">
      <img src="/themes/fscoop/images/medicamentos/7800063311272.jpg" class="card-img-top">
      ${withBadge ? '<div class="label-top3 shadow-sm"><img src="/themes/fscoop/images/bioeq1.png"></div>' : ""}
      <div class="card-body">
        <span class="badge">$990</span>
        <h5>PARACETAMOL 500 MG X 16 COMPRIMIDOS</h5>
        <a href="/index.php/online/detalleproducto?p_=123" class="btn"> Ver más </a>
      </div>
    </div>`;

  it("con badge ⇒ true", () => {
    expect(parseSermecoopHtml(card(true))[0].isBioequivalent).toBe(true);
  });

  it("sin badge ⇒ null, nunca false", () => {
    const result = parseSermecoopHtml(card(false))[0];
    expect(result.isBioequivalent).toBeNull();
    expect(result.isBioequivalent).not.toBe(false);
  });
});

describe("EasyFarma — la fuente no entrega el dato", () => {
  it("ninguna oferta afirma bioequivalencia en ningún sentido", () => {
    const results = parseEasyFarmaResponse(readFixture("easyfarma-search.html"));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.isBioequivalent === null)).toBe(true);
  });
});
