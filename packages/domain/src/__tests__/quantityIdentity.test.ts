/**
 * Cantidad por envase como eje de identidad — false merge de presentaciones de
 * distinto tamaño.
 *
 * Defecto original (QA manual, 2026-08-30): una tarjeta mostraba en la misma
 * comparación un sobre suelto y una caja de 6 sobres. Las ofertas de distinto
 * tamaño de envase se fusionaban porque el único eje de cantidad disponible era
 * el segmento de `matchKey`, que (a) normaliza "1 unidad" a cantidad vacía y
 * (b) no reconoce `supositorios`, `tabs`, `caps` ni varios formatos reales.
 *
 * Todos los nombres son literales del catálogo real (`GET
 * https://comparafarma-api.vercel.app/api/search`, read-only, 2026-08-30) salvo
 * los marcados como SINTÉTICO, que replican el formato de nombres reales para
 * probar la regla con cantidades que hoy no coexisten en el catálogo.
 *
 * Estructura:
 *   1. Extracción de cantidad            (unitario)
 *   2. Política explícita vs ausente     (unitario)
 *   3. Compatibilidad de identidad       (unitario, vía isSameProduct)
 *   4. Separación efectiva en el merge   (integración, vía mergeDuplicates)
 *   5. Caso real del reporte de QA       (regresión, datos capturados)
 *   6. No-regresión de los otros ejes    (combo / var / form)
 */
import { describe, expect, it } from "vitest";
import { matchKey } from "../matching.js";
import { mergeDuplicates } from "../deduplication.js";
import { toMedicationResult, toProductIdentity } from "../pricing.js";
import { isCompatibleUnitCount, isSameProduct, unitCountKey } from "../productIdentity.js";
import { presentationKey } from "../commercialIdentity.js";
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

/**
 * Fuerza a que varias ofertas compartan `presentationKey` para poder ejercitar
 * la validación de compatibilidad de `mergeDuplicates` de forma aislada. Es
 * exactamente el escenario para el que existe esa validación: dos ofertas
 * genuinamente distintas que llegan a la misma clave.
 */
function inSameGroup(results: MedicationResult[]): MedicationResult[] {
  const key = results[0].presentationKey;
  return results.map((result) => ({ ...result, presentationKey: key }));
}

// ---------------------------------------------------------------------------
// 1. EXTRACCIÓN DE CANTIDAD
// ---------------------------------------------------------------------------
describe("unitCountKey", () => {
  it("lee la cantidad escrita como <n> <sustantivo de unidad>", () => {
    expect(unitCountKey("Tapsín Limonada Noche (B) Paracetamol 6 Sobres")).toBe(6);
    expect(unitCountKey("Ibuprofeno 600 mg 20 Comprimidos")).toBe(20);
    expect(unitCountKey("Tapsin M 30 Cap")).toBe(30);
    expect(unitCountKey("Next Fwd 24 Tabs /50")).toBe(24);
  });

  it("lee la cantidad escrita con prefijo x / por, junto o separado", () => {
    expect(unitCountKey("Tapsin Forte x 20 comprimidos (Maver)")).toBe(20);
    expect(unitCountKey("Actron ibuprofeno 600mg por 10 caps. blandas DESCUENTO")).toBe(10);
    expect(unitCountKey("Tapsin M Migraña por10 comprimidos (Maver)")).toBe(10);
    expect(unitCountKey("Aspirina Forte 650mg x80com.")).toBe(80);
    expect(unitCountKey("Aspirina 500 Mg Caja 100comp")).toBe(100);
  });

  it("lee la cantidad suelta que dejan los nombres truncados de EasyFarma", () => {
    expect(unitCountKey("Omeprazol 20 mg x 60...")).toBe(60);
    expect(unitCountKey("Paracetamol inf. suposit. x 6")).toBe(6);
    expect(unitCountKey("Alledryl-D comprimidos x 20")).toBe(20);
  });

  it("reconoce los sustantivos que QUANTITY_PATTERN de matchKey no cubre", () => {
    // Esta es la mitad del defecto: matchKey lee estos nombres como cantidad
    // ausente, así que dos tamaños de envase distintos comparten clave.
    expect(unitCountKey("Diclofenaco Sódico Adulto 50 mg 5 Supositorios")).toBe(5);
    expect(unitCountKey("Eurogesic Pediatrico Naproxeno 50 mg 6 Supositorios")).toBe(6);
    expect(unitCountKey("Amoxicilina 500 mg 21 Caps....")).toBe(21);
    expect(matchKey("Diclofenaco Sódico Adulto 50 mg 5 Supositorios")).toBe(
      matchKey("Diclofenaco Sódico Adulto 50 mg 10 Supositorios")
    );
  });

  it("distingue la cantidad explícita 1 de la cantidad ausente", () => {
    // La otra mitad del defecto: matchKey normaliza "1" a cantidad vacía.
    expect(unitCountKey("Tapsin Compuesto Noche 5g 1 Sobre Polvo Para Solución Oral")).toBe(1);
    expect(unitCountKey("Tapsin Caliente Noche - Sabor Limón - Sobre de 5 g ( 1 sobre )")).toBe(1);
    expect(unitCountKey("Paracetamol Solución para Perfusión 1000mg/100ml x 1 Ampolla (B Braun)")).toBe(1);
    expect(matchKey("Tapsin Compuesto Noche 5g 1 Sobre Polvo Para Solución Oral")).toBe("tapsin|5000mg|n");
  });

  it("lee como 1 unidad la unidad nombrada en singular sin número", () => {
    expect(unitCountKey("Tapsin Sobre Noche (Maver)")).toBe(1);
    expect(unitCountKey("Tapsin Dia Limonada Sobre (ai)")).toBe(1);
  });

  it("no confunde volumen, masa ni actuaciones con unidades por envase", () => {
    expect(unitCountKey("Amoxicilina 250mg/5ml x 60 ml")).toBeNull();
    expect(unitCountKey("Tapsin Limonada noche x5g")).toBeNull();
    expect(unitCountKey("Tapsin Paracetamol 100 mg/ml Gotas x 15 mL")).toBeNull();
    expect(unitCountKey("Zomel HP x 28 dosis")).toBeNull();
    expect(unitCountKey("Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral")).toBeNull();
  });

  it("no toma la dosis como cantidad cuando la cantidad viene después", () => {
    expect(unitCountKey("Tapsin SC Paracetamol 1 gr x 20 Comprimidos")).toBe(20);
    expect(unitCountKey("Amoval 1 gramo x 14 comprimidos")).toBe(14);
    expect(unitCountKey("Diclofenaco Infantil 12.5mg 5 Supositorios")).toBe(5);
  });

  it("devuelve null cuando el nombre no declara ninguna cantidad", () => {
    expect(unitCountKey("Amoxicilina 250mg/5ml Jarabe 60ml")).toBeNull();
    expect(unitCountKey("Tapsín Limonada Noche (B) Paracetamol 5g")).toBeNull();
  });

  it("reconoce como la MISMA cantidad los formatos equivalentes", () => {
    // SINTÉTICO — mismo artículo escrito como lo escribe cada farmacia.
    const formatos = [
      "Tapsin Forte x 6 sobres",
      "Tapsin Forte 6 sobres",
      "Tapsin Forte caja 6 sobres",
      "Tapsin Forte x 6",
      "Tapsin Forte x6com",
      "Tapsin Forte por 6 sobres",
    ];
    for (const nombre of formatos) expect(unitCountKey(nombre)).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// 2. POLÍTICA EXPLÍCITA vs AUSENTE
// ---------------------------------------------------------------------------
describe("isCompatibleUnitCount", () => {
  it("dos cantidades explícitas distintas son incompatibles", () => {
    expect(isCompatibleUnitCount(1, 6)).toBe(false);
    expect(isCompatibleUnitCount(6, 1)).toBe(false);
    expect(isCompatibleUnitCount(10, 20)).toBe(false);
    expect(isCompatibleUnitCount(30, 20)).toBe(false);
  });

  it("dos cantidades explícitas iguales son compatibles", () => {
    expect(isCompatibleUnitCount(6, 6)).toBe(true);
    expect(isCompatibleUnitCount(1, 1)).toBe(true);
  });

  it("la cantidad ausente NO bloquea la fusión — política documentada", () => {
    // Decisión explícita y asimétrica: no declarar la cantidad no afirma nada
    // (es un defecto de transcripción de la farmacia sobre el mismo envase),
    // mientras que declarar una distinta sí es evidencia. Ver
    // isCompatibleUnitCount en productIdentity.ts.
    expect(isCompatibleUnitCount(null, 6)).toBe(true);
    expect(isCompatibleUnitCount(6, null)).toBe(true);
    expect(isCompatibleUnitCount(null, 1)).toBe(true);
    expect(isCompatibleUnitCount(null, null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. COMPATIBILIDAD DE IDENTIDAD
// ---------------------------------------------------------------------------
describe("isSameProduct — eje de cantidad", () => {
  const identity = (name: string) => toProductIdentity(scraped({ name, laboratory: "Maver" }));

  it("1 sobre y 6 sobres no son el mismo producto", () => {
    expect(isSameProduct(identity("Tapsin Forte x 1 sobre"), identity("Tapsin Forte x 6 sobres"))).toBe(false);
  });

  it("6 sobres y 6 sobres sí lo son cuando el resto de la identidad coincide", () => {
    expect(isSameProduct(identity("Tapsin Forte x 6 sobres"), identity("Tapsin Forte 6 sobres"))).toBe(true);
  });

  it("10 comprimidos y 20 comprimidos no son el mismo producto", () => {
    expect(
      isSameProduct(identity("Tapsin Forte x 10 comprimidos"), identity("Tapsin Forte x 20 comprimidos"))
    ).toBe(false);
  });

  it("1 comprimido y 10 comprimidos no son el mismo producto", () => {
    expect(
      isSameProduct(identity("Tapsin Forte x 1 comprimido"), identity("Tapsin Forte x 10 comprimidos"))
    ).toBe(false);
  });

  it("cantidad ausente y cantidad explícita siguen siendo compatibles", () => {
    // Par elegido para aislar el eje: ambos nombres producen el MISMO matchKey
    // (`supositorios` no entra en QUANTITY_PATTERN), así que la única
    // diferencia que evalúa isSameProduct es cantidad explícita vs ausente.
    const conCantidad = identity("Diclofenaco Sódico Adulto 50 mg 5 Supositorios");
    const sinCantidad = identity("Diclofenaco Sódico Adulto 50 mg");
    expect(conCantidad.unitCount).toBe(5);
    expect(sinCantidad.unitCount).toBeNull();
    expect(isSameProduct(conCantidad, sinCantidad)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. SEPARACIÓN EFECTIVA EN EL MERGE
// ---------------------------------------------------------------------------
describe("mergeDuplicates — cantidades incompatibles", () => {
  it("no fusiona 5 y 10 supositorios aunque compartan matchKey", () => {
    // Caso REPRODUCIBLE del defecto: `supositorios` no está en
    // QUANTITY_PATTERN, así que ambos nombres producen el MISMO matchKey y
    // antes de este fix caían en la misma tarjeta.
    const cinco = offer("cruz-verde", { name: "Diclofenaco Sódico Adulto 50 mg 5 Supositorios" });
    const diez = offer("salcobrand", { name: "Diclofenaco Sódico Adulto 50 mg 10 Supositorios", price: 2400 });
    expect(cinco.matchKey).toBe(diez.matchKey);
    expect(cinco.presentationKey).toBe(diez.presentationKey);

    const merged = mergeDuplicates([cinco, diez]);
    expect(merged).toHaveLength(2);
    for (const card of merged) expect(card.prices).toHaveLength(1);
  });

  it("sigue fusionando dos farmacias que declaran la misma cantidad en formatos distintos", () => {
    const a = offer("araucomed", { name: "Aspirina Forte 650mg x80com." });
    const b = offer("ecofarmacias", { name: "Aspirina Forte 650 mg x 80 comprimidos", price: 7990 });
    const merged = mergeDuplicates(inSameGroup([a, b]));
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });

  it("sigue fusionando cuando una farmacia no declara la cantidad", () => {
    // Grupo real: EasyFarma trunca el nombre y no deja sustantivo de unidad.
    const conCantidad = offer("cruz-verde", { name: "Omeprazol 20 mg 60 Cápsulas con Gránulos" });
    const truncado = offer("easyfarma", { name: "Omeprazol 20 mg x 60...", price: 2990 });
    const merged = mergeDuplicates(inSameGroup([conCantidad, truncado]));
    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 5. CASO REAL DEL REPORTE DE QA
// ---------------------------------------------------------------------------
describe("regresión — sobre suelto contra caja de 6 sobres (QA 2026-08-30)", () => {
  // Nombres exactos entregados por cada fuente, capturados de producción.
  const SALCOBRAND = "Tapsín Limonada Noche (B) Paracetamol 6 Sobres";
  const ECOFARMACIAS = "Tapsin Sobre Noche (Maver)";
  const AHUMADA = "Tapsin Compuesto Noche 5 g 6 Sobres Polvo para Solución Oral";

  it("la oferta de EcoFarmacias declara 1 unidad y las otras dos declaran 6", () => {
    expect(unitCountKey(ECOFARMACIAS)).toBe(1);
    expect(unitCountKey(SALCOBRAND)).toBe(6);
    expect(unitCountKey(AHUMADA)).toBe(6);
  });

  it("la cantidad de EcoFarmacias era invisible para matchKey", () => {
    // Causa raíz: sin sustantivo de unidad numerado, matchKey no deja rastro de
    // que sean 1 sola unidad, así que el eje de cantidad no podía protegerlo.
    expect(matchKey(ECOFARMACIAS)).toBe("tapsin|n");
    expect(matchKey(SALCOBRAND)).toBe("tapsin|n|6");
  });

  it("el sobre suelto queda fuera de la tarjeta de la caja de 6", () => {
    const salcobrand = offer("salcobrand", { name: SALCOBRAND, laboratory: "Tapsin", price: 4999, onlinePrice: 4399 });
    const eco = offer("ecofarmacias", { name: ECOFARMACIAS, laboratory: "Tapsin", price: 460 });
    const ahumada = offer("ahumada", { name: AHUMADA, laboratory: "Tapsin", price: 4590 });

    const merged = mergeDuplicates(inSameGroup([salcobrand, eco, ahumada]));

    const conEco = merged.find((card) => card.prices.some((p) => p.pharmacySlug === "ecofarmacias"))!;
    expect(conEco.prices).toHaveLength(1);
    for (const card of merged) {
      const cantidades = new Set(card.prices.map((price) => unitCountKey(price.productName)));
      expect(cantidades.size).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. NO-REGRESIÓN DE LOS OTROS EJES
// ---------------------------------------------------------------------------
describe("no-regresión de los ejes existentes", () => {
  it("combo: sigue separando el monofármaco de su combinación (S-1)", () => {
    const mono = offer("araucomed", { name: "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)" });
    const combo = offer("farmex", {
      name: "Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos",
      price: 1990,
    });
    expect(mono.presentationKey).not.toBe(combo.presentationKey);
    expect(mergeDuplicates([mono, combo])).toHaveLength(2);
  });

  it("var: sigue separando dos variantes comerciales de la misma cantidad (CF-SEARCH-001)", () => {
    const forte = offer("araucomed", { name: "Tapsin Forte x 30 comprimidos", laboratory: "Maver" });
    const migrana = offer("farmex", { name: "Tapsin Migraña x 30 comprimidos", laboratory: "Maver", price: 4990 });
    expect(forte.presentationKey).not.toBe(migrana.presentationKey);
    expect(mergeDuplicates([forte, migrana])).toHaveLength(2);
  });

  it("form: sigue separando comprimidos de sobres con la misma cantidad", () => {
    const comprimidos = offer("farmex", { name: "Tapsin SC 1 g x 20 comprimidos", laboratory: "Maver" });
    const sobres = offer("araucomed", { name: "Tapsin SC 1 g x 20 sobres", laboratory: "Maver", price: 3990 });
    expect(unitCountKey("Tapsin SC 1 g x 20 comprimidos")).toBe(20);
    expect(unitCountKey("Tapsin SC 1 g x 20 sobres")).toBe(20);
    expect(comprimidos.presentationKey).not.toBe(sobres.presentationKey);
    expect(mergeDuplicates([comprimidos, sobres])).toHaveLength(2);
  });

  it("presentationKey no incorpora la cantidad — no rota el slug de ficha en Web", () => {
    const key = presentationKey({
      matchKey: "tapsin|n|6",
      isBioequivalent: null,
      commercialIdentity: "tapsin",
      combinationKey: null,
      commercialVariant: "limonada",
      dosageForm: "fluid-oral",
    });
    expect(key).toBe("tapsin|n|6|bio:unknown|brand:tapsin|var:limonada|form:fluid-oral");
    expect(key).not.toContain("qty:");
  });
});
