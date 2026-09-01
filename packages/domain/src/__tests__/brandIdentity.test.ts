/**
 * CF-DATA-001 — separación de marca / fabricante / principio activo.
 *
 * Todos los nombres y valores estructurados de este archivo salieron de
 * capturas REALES de las 9 farmacias (29 búsquedas, 2026-08-31). La evidencia
 * completa está en docs/qa/cf-data-001/.
 */
import { describe, expect, it } from "vitest";

import { brandFromName, resolveBrandIdentity } from "../brandIdentity.js";
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
    brand: null,
    manufacturer: null,
    isBioequivalent: null,
    ...over,
  };
}

function offer(slug: PharmacySlug, over: Partial<ScrapedProduct> & { name: string }): MedicationResult {
  return toMedicationResult(scraped(over), slug, slug);
}

// ---------------------------------------------------------------------------
// 1. MARCA ESTRUCTURADA CONFIABLE
// ---------------------------------------------------------------------------

describe("marca estructurada (Salcobrand `hit.brand`)", () => {
  it("publica la marca declarada por la farmacia y la marca como `structured`", () => {
    const result = resolveBrandIdentity({
      name: "Muxol Adulto Ambroxol Jarabe 100ml",
      structuredBrand: "Muxol",
    });
    expect(result.brand).toBe("Muxol");
    expect(result.brandSource).toBe("structured");
    expect(result.manufacturer).toBeNull();
  });

  it("conserva el calificador de la marca cuando la farmacia lo declara", () => {
    expect(
      resolveBrandIdentity({
        name: "Muxol Pediátrico Ambroxol Jarabe 100ml",
        structuredBrand: "Muxol Pediatrico",
      }).brand
    ).toBe("Muxol Pediatrico");
  });

  it("limpia los caracteres invisibles que Salcobrand incrusta en el campo", () => {
    // Caso real: `hit.brand` llega con SOFT HYPHEN (U+00AD) dentro de la palabra.
    expect(
      resolveBrandIdentity({ name: "Tapsin Forte 650mg 20 Comp", structuredBrand: "Tapsi­n" }).brand
    ).toBe("Tapsin");
  });

  it("descarta un valor estructurado que no puede ser una marca", () => {
    // `plausibleStructured` reutiliza la validación de `presentationKey`: un
    // vendor de canal comercial de Shopify no es una marca ni un laboratorio.
    expect(
      resolveBrandIdentity({
        name: "Muxol 30 mg x 20 comprimidos",
        structuredBrand: "Farmex-Pluxee-Persistente",
      }).brandSource
    ).not.toBe("structured");
  });
});

// ---------------------------------------------------------------------------
// 2. FABRICANTE ESTRUCTURADO CONFIABLE
// ---------------------------------------------------------------------------

describe("fabricante estructurado (Dr. Simi / AraucoMed / Farmex)", () => {
  it("publica el laboratorio en `manufacturer`, nunca en `brand`", () => {
    const result = resolveBrandIdentity({
      name: "Muxol Jarabe adulto Ambroxol 30 mg / 5 mL x 100 mL",
      structuredManufacturer: "EUROLAB",
    });
    expect(result.manufacturer).toBe("Eurolab");
    expect(result.brand).toBe("Muxol");
  });

  it("normaliza las mayúsculas sostenidas del catálogo", () => {
    expect(
      resolveBrandIdentity({ name: "Paracetamol 500 mg 16 comprimidos", structuredManufacturer: "ANDRÓMACO" })
        .manufacturer
    ).toBe("Andrómaco");
  });

  it("respeta la capitalización propia cuando la farmacia ya la trae", () => {
    expect(
      resolveBrandIdentity({ name: "Omeprazol 20 mg x 30 cápsulas", structuredManufacturer: "Seven Pharma" })
        .manufacturer
    ).toBe("Seven Pharma");
  });

  it("NUNCA infiere un fabricante desde el nombre del producto", () => {
    // El nombre nombra al laboratorio al final, como hace AraucoMed. Aun así,
    // sin campo estructurado el fabricante debe quedar en `null`.
    expect(
      resolveBrandIdentity({ name: "Ambroxol 15mg/5ml jarabe infantil x 100 ml. (Ascend)" }).manufacturer
    ).toBeNull();
    expect(
      resolveBrandIdentity({ name: "Ambroxol clorhidrato 30mg 100ml SEVEN PHARMA" }).manufacturer
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. EL PRINCIPIO ACTIVO NUNCA SE CONVIERTE EN MARCA
// ---------------------------------------------------------------------------

describe("un principio activo nunca se publica como marca", () => {
  it("rechaza la marca estructurada cuando la farmacia declara la molécula", () => {
    // Salcobrand publica `brand: "Ambroxol"` / `"diclofenaco"` en sus genéricos.
    for (const molecule of ["Ambroxol", "diclofenaco", "Paracetamol"]) {
      const result = resolveBrandIdentity({
        name: `${molecule} 30mg/5ml Jarabe 100ml`,
        structuredBrand: molecule,
      });
      expect(result.brand).toBeNull();
      expect(result.brandSource).toBe("unknown");
    }
  });

  it("no promueve la cabecera a marca cuando la cabecera ES la molécula", () => {
    const cases = [
      "Diclofenaco Dietilamina 1,16 % gel tópico 30 g",
      "Cetirizina Diclorhidrato 10 mg x 30 Comprimidos Recubiertos",
      "Levocetirizina Diclorhidrato 5 mg x 30 comp.",
      "Paracetamol Solución para Perfusión 1000mg/100ml x 1 Ampolla",
    ];
    for (const name of cases) {
      expect(brandFromName(name).brand).toBeNull();
    }
  });

  it("tampoco la promueve cuando la marca viene DESPUÉS de la molécula", () => {
    // Orden invertido, observado en EcoFarmacias y Salcobrand. Sin poder
    // demostrar cuál token es la marca, la respuesta correcta es `null` —
    // jamás `brand: "Ibuprofeno"`.
    for (const name of [
      "Ibuprofeno Actron  200 mg RA (R) 10 Cápsulas Blandas",
      "Paracetamol Gesidol 1gr x 20 Comprimidos",
      "Ibuprofeno Deucodol Forte  200 mg/5 ml x 120 ml",
    ]) {
      const result = brandFromName(name);
      expect(result.brand).toBeNull();
    }
  });

  it("no lee una combinación genérica como marca de su primer principio activo", () => {
    for (const name of [
      "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30",
      "Amoxicilina / Ácido Clavulánico 500/125 x 20 comprimidos",
    ]) {
      expect(brandFromName(name).brand).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 4-7. DERIVACIÓN DESDE EL NOMBRE
// ---------------------------------------------------------------------------

describe("marca derivada del nombre", () => {
  it("reconoce la marca aunque la farmacia no entregue NINGÚN campo estructurado", () => {
    // Los 3 casos exactos del reporte de QA, de farmacias sin metadato.
    const tocalm = resolveBrandIdentity({ name: "Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL" });
    expect(tocalm.brand).toBe("Tocalm");
    expect(tocalm.brandSource).toBe("name");
    expect(tocalm.manufacturer).toBeNull();

    expect(resolveBrandIdentity({ name: "Pazbronq Ambroxol Clorhidrato 30 mg/5 mL Jarabe 100 mL" }).brand)
      .toBe("Pazbronq");
    expect(resolveBrandIdentity({ name: "Mintamox Pediatrico Ambroxol 15 mg/5mL Jarabe 100 mL" }).brand)
      .toBe("Mintamox");
  });

  it("lee la grafía de Sermecoop, que pone la molécula entre paréntesis", () => {
    expect(brandFromName("Muxol (ambroxol) 15mg/5ml Jarabe 100ml").brand).toBe("Muxol");
  });

  it("devuelve la marca con su capitalización original, no el token normalizado", () => {
    expect(brandFromName("MUXOL JARABE ADULTO Ambroxol Clorhidrato 600 mg 100 ml").brand).toBe("MUXOL");
  });

  it("un genérico se queda SIN marca en vez de recibir una inventada", () => {
    for (const name of [
      "Paracetamol 500 mg 16 comprimidos",
      "Ambroxol 30 mg/5ml jarabe 100 ml Opko",
      "Ambroxol 15mg/5ml jarabe infantil x 100 ml. (Ascend)",
    ]) {
      expect(brandFromName(name).brand).toBeNull();
    }
  });

  it("no confunde al laboratorio del final del nombre con la molécula que corrobora", () => {
    // "Opko"/"Ascend" van DESPUÉS de la dosis: fuera del segmento descriptivo.
    // Sin esta restricción, "Ambroxol … 100 ml Opko" derivaría marca=Ambroxol.
    const result = brandFromName("Ambroxol 30 mg/5ml jarabe 100 ml Opko");
    expect(result.brand).toBeNull();
    expect(result.activeIngredient).toBe("ambroxol");
  });

  it("sin evidencia en el nombre no inventa marca (nombre truncado de EasyFarma)", () => {
    // "Amrodil" es una marca real, pero el nombre no nombra la molécula: no se
    // puede DEMOSTRAR que no sea un genérico de nombre inusual.
    expect(brandFromName("Amrodil 30 Mg/5ml 100 Ml").brand).toBeNull();
    expect(brandFromName("Ambroxol Pediatrico 15mg/5...").brand).toBeNull();
  });

  it("expone el principio activo reconocido, con o sin marca", () => {
    expect(brandFromName("Tapsin paracetamol 500 mg 24 comprimidos").activeIngredient).toBe("paracetamol");
    expect(brandFromName("Paracetamol 500 mg 16 comprimidos").activeIngredient).toBe("paracetamol");
    expect(brandFromName("Producto Sin Molecula Conocida 10 mg").activeIngredient).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. DOS FARMACIAS CON SEMÁNTICAS DE METADATO DISTINTAS
// ---------------------------------------------------------------------------

describe("mismo producto en dos farmacias con metadatos de semántica distinta", () => {
  it("Salcobrand (marca) y Farmex (fabricante) producen la misma marca y no se contradicen", () => {
    const salcobrand = resolveBrandIdentity({
      name: "Muxol Adulto Ambroxol Jarabe 100ml",
      structuredBrand: "Muxol",
    });
    const farmex = resolveBrandIdentity({
      name: "Muxol Jarabe adulto Ambroxol 30 mg / 5 mL x 100 mL",
      structuredManufacturer: "EUROLAB",
    });

    expect(salcobrand.brand).toBe("Muxol");
    expect(farmex.brand).toBe("Muxol");
    // Cada farmacia aporta lo que sabe; ninguna inventa lo que no tiene.
    expect(salcobrand.manufacturer).toBeNull();
    expect(farmex.manufacturer).toBe("Eurolab");
  });

  it("el campo `brand` de Dr. Simi (que en VTEX es el fabricante) no se publica como marca", () => {
    const result = resolveBrandIdentity({
      name: "Tocalm ambroxol 15 mg/5 mL jarabe pediátrico 100 mL",
      structuredManufacturer: "PRATER",
    });
    expect(result.manufacturer).toBe("Prater");
    expect(result.brand).toBe("Tocalm");
  });
});

// ---------------------------------------------------------------------------
// 9-10. IDENTIDAD: NI FALSOS MERGE NI FALSOS SPLIT
// ---------------------------------------------------------------------------

describe("la taxonomía es aditiva: no toca la identidad de producto", () => {
  it("`presentationKey` no depende de los campos nuevos, solo del valor histórico", () => {
    // La MISMA oferta con el laboratorio en el campo viejo (`manufacturer`) y
    // con la marca en el nuevo (`brand`) debe producir la misma clave que
    // producía `laboratory` antes de la separación.
    const conFabricante = offer("dr-simi", { name: "Tocalm Ambroxol 15 mg/5 mL Jarabe 100 mL", manufacturer: "PRATER" });
    expect(conFabricante.presentationKey).toBe(
      "tocalm|100ml|bio:unknown|brand:prater|var:ambroxol|form:fluid-oral"
    );
    // El alias de compatibilidad conserva el valor CRUDO (sin normalizar): es
    // el que alimenta `resolveCommercialIdentity` y, por lo tanto, la clave.
    expect(conFabricante.laboratory).toBe("PRATER");

    const conMarca = offer("salcobrand", { name: "Muxol Adulto Ambroxol Jarabe 100ml", brand: "Muxol" });
    expect(conMarca.presentationKey).toBe(
      "muxol|100ml|bio:unknown|brand:muxol|var:ambroxol|form:fluid-oral"
    );
    expect(conMarca.laboratory).toBe("Muxol");
  });

  it("`matchKey` es idéntico con y sin metadato de marca", () => {
    const sin = offer("ahumada", { name: "Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL" });
    const con = offer("salcobrand", { name: "Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL", brand: "Tocalm" });
    expect(sin.matchKey).toBe(con.matchKey);
  });

  it("NO FUSIONA dos laboratorios distintos del mismo genérico (protección de falso merge)", () => {
    const ascend = offer("araucomed", {
      name: "Ambroxol 30mg/5ml Jarabe Adulto 100ml (Ascend)", manufacturer: "Ascend", price: 990,
    });
    const opko = offer("araucomed", {
      name: "Ambroxol 30mg/5ml Jarabe Adulto 100ml (Opko)", manufacturer: "Opko", price: 2490,
    });
    const merged = mergeDuplicates([ascend, opko]);
    expect(merged).toHaveLength(2);
  });

  it("NO PARTE una tarjeta correcta por la marca derivada del nombre (protección de falso split)", () => {
    // Dos farmacias sin metadato estructurado que describen el MISMO producto.
    // La marca derivada es solo presentación: no entra en `presentationKey`, así
    // que las ofertas siguen agrupando en una sola tarjeta.
    const cruzVerde = offer("cruz-verde", { name: "Muxol Ambroxol 30 mg 20 Comprimidos", price: 3990 });
    const ahumada = offer("ahumada", { name: "Muxol Ambroxol 30 mg 20 Comprimidos", price: 3500 });
    const merged = mergeDuplicates([cruzVerde, ahumada]);
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
    expect(merged[0].brand).toBe("Muxol");
  });

  it("derivar la marca no cambia la clave de la oferta respecto de no derivarla", () => {
    // La misma oferta, con y sin metadato estructurado de marca: la marca
    // publicada cambia de fuente, la clave NO.
    const derivada = offer("ahumada", { name: "Muxol Ambroxol 30 mg 20 Comprimidos" });
    const declarada = offer("salcobrand", { name: "Muxol Ambroxol 30 mg 20 Comprimidos", brand: "Muxol" });
    expect(derivada.brandSource).toBe("name");
    expect(declarada.brandSource).toBe("structured");
    expect(derivada.brand).toBe(declarada.brand);
    // La clave de la oferta declarada SÍ difiere, pero por una razón anterior a
    // este ticket: Salcobrand aporta `brand:muxol` donde Ahumada no aporta nada
    // (`brand:unknown`). Es la política conservadora de `commercialIdentity.ts`
    // —conocido nunca se fusiona con desconocido— y este ticket no la altera.
    expect(derivada.presentationKey).toContain("brand:unknown");
    expect(declarada.presentationKey).toContain("brand:muxol");
  });
});

// ---------------------------------------------------------------------------
// 11-12. COMPATIBILIDAD CON LOS FIXES YA MERGEADOS
// ---------------------------------------------------------------------------

describe("compatibilidad con CF-SEARCH-003 (concentración de líquidos)", () => {
  it("sigue sin fusionar dos jarabes de concentración distinta, ahora con marca", () => {
    const fuerte = offer("sermecoop", { name: "Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL", price: 2390 });
    const suave = offer("cruz-verde", { name: "Tocalm Adulto Ambroxol 15 mg/5mL Jarabe 100 mL", price: 5490 });
    expect(fuerte.brand).toBe("Tocalm");
    expect(suave.brand).toBe("Tocalm");
    // Misma marca y mismo `matchKey` (el `ml` gana la dosis) — la separación la
    // sigue haciendo el eje de concentración, que este ticket no toca.
    expect(fuerte.matchKey).toBe(suave.matchKey);
    expect(mergeDuplicates([fuerte, suave])).toHaveLength(2);
  });
});

describe("compatibilidad con la identidad de cantidad (`unitCountKey`)", () => {
  it("sigue sin fusionar un sobre suelto con la caja, aunque compartan marca", () => {
    const sobre = offer("ahumada", {
      name: "Tapsin Compuesto Noche Paracetamol 5g 1 Sobre Polvo Para Solución Oral", price: 890,
    });
    const caja = offer("farmex", {
      name: "Tapsin Compuesto Noche Paracetamol 5g 6 Sobres Polvo Para Solución Oral", price: 3990,
    });
    expect(sobre.brand).toBe("Tapsin");
    expect(caja.brand).toBe("Tapsin");
    expect(mergeDuplicates([sobre, caja])).toHaveLength(2);
  });

  it("dos presentaciones de distinta cantidad de la misma marca siguen separadas", () => {
    const x10 = offer("cruz-verde", { name: "Ibucalm Ibuprofeno 400 mg 10 Cápsulas blandas", price: 1990 });
    const x20 = offer("ahumada", { name: "Ibucalm Ibuprofeno 400 mg 20 Cápsulas blandas", price: 3490 });
    expect(x10.brand).toBe("Ibucalm");
    expect(mergeDuplicates([x10, x20])).toHaveLength(2);
  });
});
