/**
 * CF-SEARCH-011 S0 — LECTOR DE ASOCIACIONES de v2 (`compositionReader.ts`).
 *
 * El caso que origina este módulo es un FALSO MERGE CONCEPTUAL medido sobre el
 * corpus congelado, no un ejemplo inventado: la asociación diclofenaco+tramadol
 * de Adorlan (Dr. Simi) compartía Concepto Farmacéutico con el monofármaco de
 * diclofenaco de Lertus (Dr. Simi y Cruz Verde). Los nombres de todos los tests
 * son reales del corpus de las 9 farmacias salvo donde se indique.
 *
 * ORGANIZACIÓN
 *   1. el caso bloqueante (Adorlan) — reproducción y corrección;
 *   2. asociaciones sin separador explícito;
 *   3. sales y calificadores químicos: NUNCA un segundo principio activo;
 *   4. monofármacos: conservan identidad propia;
 *   5. cardinalidad declarada sin moléculas nombrables;
 *   6. lo que NO se promueve — la regla de honestidad.
 */
import { describe, expect, it } from "vitest";
import {
  declaredArityFromDoseRatio,
  readIngredientComposition,
} from "../searchV2/compositionReader.js";
import { canonicalize } from "../searchV2/canonicalize.js";
import type { RawOfferInput } from "../searchV2/canonicalTypes.js";

/** Conjunto de moléculas leídas, ordenado. */
const tokens = (name: string): string[] =>
  readIngredientComposition(name).components.map((c) => c.token);

/**
 * Clave de concepto de cada nombre, resolviendo el conjunto COMPLETO de una vez
 * — el mismo contexto de resolución que usa el harness de S0.
 */
function conceptKeys(names: string[]): Map<string, string> {
  const offers: RawOfferInput[] = names.map((rawName, i) => ({
    pharmacy: i % 2 === 0 ? "cruz-verde" : "dr-simi",
    rawName,
    price: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
    stock: true,
    url: `https://example.test/${i}`,
    capturedAt: "2026-09-01T00:00:00.000Z",
  }));
  const graph = canonicalize(offers);
  return new Map(graph.offers.map((o) => [o.rawName, o.provisionalConceptKey]));
}

// ---------------------------------------------------------------------------
// 1. EL CASO BLOQUEANTE — Adorlan (diclofenaco + tramadol)
// ---------------------------------------------------------------------------

describe("Adorlan — asociación diclofenaco+tramadol escrita sin separador", () => {
  const ADORLAN_DR_SIMI = "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos";
  const LERTUS_DR_SIMI = "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico";
  const LERTUS_CRUZ_VERDE = "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos";

  it("lee las DOS moléculas aunque no haya +, / ni guión entre ellas", () => {
    expect(tokens(ADORLAN_DR_SIMI)).toEqual(["diclofenaco", "tramadol"]);
  });

  it("NO confunde la asociación con el monofármaco de diclofenaco", () => {
    expect(tokens(ADORLAN_DR_SIMI)).not.toEqual(tokens(LERTUS_DR_SIMI));
    expect(tokens(LERTUS_DR_SIMI)).toEqual(["diclofenaco"]);
    expect(tokens(LERTUS_CRUZ_VERDE)).toEqual(["diclofenaco"]);
  });

  it("NO toma la marca 'adorlan' como principio activo", () => {
    expect(tokens(ADORLAN_DR_SIMI)).not.toContain("adorlan");
  });

  it("declara la asociación y la marca como lectura completa", () => {
    const composition = readIngredientComposition(ADORLAN_DR_SIMI);
    expect(composition.isAssociation).toBe(true);
    expect(composition.isComplete).toBe(true);
    expect(composition.declaredComponentCount).toBe(2);
  });

  it("conserva la dosis DE CADA componente, que `concentration` no puede representar", () => {
    const composition = readIngredientComposition(ADORLAN_DR_SIMI);
    expect(composition.components).toEqual([
      { token: "diclofenaco", evidence: "vocabulary", strength: { value: 25, unit: "mg" } },
      { token: "tramadol", evidence: "vocabulary", strength: { value: 25, unit: "mg" } },
    ]);
  });

  it("llega al mismo conjunto por la escritura con separador de otras farmacias", () => {
    // Salcobrand y EcoFarmacias escriben la MISMA asociación con `/`.
    expect(tokens("Adorlan 25/25 Diclofenaco / Tramadol 10 Comprimidos")).toEqual([
      "diclofenaco",
      "tramadol",
    ]);
    expect(tokens("Adorlan 25/25 x 10 Comprimidos (Diclofenaco/Tramadol)")).toEqual([
      "diclofenaco",
      "tramadol",
    ]);
    expect(tokens("Dolodrin Diclofenaco 25 Mg / Tramadol 25 Mg x 10 Comprimidos")).toEqual([
      "diclofenaco",
      "tramadol",
    ]);
  });
});

// ---------------------------------------------------------------------------
// 2. ASOCIACIONES SIN SEPARADOR EXPLÍCITO — el mecanismo general
// ---------------------------------------------------------------------------

describe("asociaciones declaradas por estructura `<molécula> <dosis>` repetida", () => {
  it("paracetamol + ibuprofeno", () => {
    expect(tokens("paracetamol 500mg ibuprofeno 200mg")).toEqual(["ibuprofeno", "paracetamol"]);
  });

  it("losartán + hidroclorotiazida", () => {
    expect(tokens("losartan 50mg hidroclorotiazida 12.5mg")).toEqual([
      "hidroclorotiazida",
      "losartan",
    ]);
  });

  it("atraviesa la sal intermedia sin convertirla en un tercer principio activo", () => {
    expect(tokens("losartan potasico 50mg hidroclorotiazida 12.5mg")).toEqual([
      "hidroclorotiazida",
      "losartan",
    ]);
  });

  it("Tapsin Duo: lee paracetamol e ibuprofeno y NO agrega 'tapsin'", () => {
    const read = tokens("Tapsin Duo paracetamol 300 mg ibuprofeno 200 mg 12 comprimidos recubiertos");
    expect(read).toEqual(["ibuprofeno", "paracetamol"]);
    expect(read).not.toContain("tapsin");
    expect(read).not.toContain("duo");
  });

  it("Tapsin Duo con separador da EXACTAMENTE el mismo conjunto", () => {
    expect(tokens("Tapsin Duo (B) Paracetamol / Ibuprofeno 12 Comprimidos Recubiertos")).toEqual([
      "ibuprofeno",
      "paracetamol",
    ]);
    expect(tokens("Kitadol Duo Ibuprofeno / Paracetamol 10 Comprimidos Recubiertos")).toEqual([
      "ibuprofeno",
      "paracetamol",
    ]);
  });

  it("tramadol/paracetamol: misma asociación con y sin separador", () => {
    const conSeparador = tokens("Tramadol Clorhidrato/Paracetamol 37,5/325 mg x 30 comprimidos");
    const sinSeparador = tokens("Tramadol 37,5 mg Paracetamol 325 mg x 30 comprimidos");
    expect(conSeparador).toEqual(["paracetamol", "tramadol"]);
    expect(sinSeparador).toEqual(["paracetamol", "tramadol"]);
    expect(conSeparador).toEqual(sinSeparador);
  });

  it("amoxicilina + ácido clavulánico: 'ácido' NO es un principio activo", () => {
    // Sobre el corpus, `combinationKey()` devuelve `acido` en 25 nombres porque
    // el calificador queda pegado al separador. Las cuatro escrituras reales de
    // este medicamento tienen que dar el MISMO conjunto.
    const escrituras = [
      "Amoxicilina + Ácido Clavulánico 500 mg / 125 mg x 20 comprimidos",
      "Amoxicilina 500 mg ácido clavulánico 125 mg 20 comprimidos recubiertos",
      "Amoxicilina/Ácido Clavulánico 875/125 Mg X 20 Comprimidos Recubiertos",
      "Amoxicilina 875mg/acido Clavulanico 125mg 14 Comprimidos",
    ];
    for (const nombre of escrituras) {
      expect(tokens(nombre), nombre).toEqual(["amoxicilina", "clavulanico"]);
    }
  });

  it("no depende del orden textual de las moléculas", () => {
    expect(tokens("Simperten-D 50/12.5 Hidroclorotiazida / Losartan 30 Comprimidos")).toEqual(
      tokens("Losapres D 50/12.5 Losartan / Hidroclorotiazida 30 Comprimidos Recubiertos")
    );
  });
});

// ---------------------------------------------------------------------------
// 3. SALES Y CALIFICADORES QUÍMICOS — clase (B), nunca un componente
// ---------------------------------------------------------------------------

describe("sales, iones y calificadores químicos", () => {
  it("'losartan potasico' NO es losartán + potasio", () => {
    const read = tokens("Losartan Potasico 50 mg x 30 comprimidos. (Ascend)");
    expect(read).toEqual(["losartan"]);
    expect(readIngredientComposition("Losartan Potasico 50 mg x 30 comprimidos.").isAssociation)
      .toBe(false);
  });

  it("'naproxeno sodico' NO es naproxeno + sodio", () => {
    const read = tokens("Naproxeno Sodico 550 mg x 20 comprimidos");
    expect(read).toEqual(["naproxeno"]);
    expect(read).not.toContain("sodio");
    expect(read).not.toContain("sodico");
  });

  it("'cetirizina diclorhidrato' NO es cetirizina + diclorhidrato", () => {
    const read = tokens("Cetirizina Diclorhidrato 10 mg x 20 Comprimidos Recubiertos");
    expect(read).toEqual(["cetirizina"]);
    expect(read).not.toContain("diclorhidrato");
  });

  it("'diclofenaco sódico' sigue siendo un monofármaco", () => {
    expect(tokens("Lertus Diclofenaco Sodico 25 mg 20 Comprimidos")).toEqual(["diclofenaco"]);
  });

  it("'ambroxol clorhidrato' sigue siendo un monofármaco", () => {
    expect(tokens("Pazbronq Ambroxol Clorhidrato 30 Mg/ 5 Ml Jarabe 100 Ml")).toEqual(["ambroxol"]);
  });
});

// ---------------------------------------------------------------------------
// 4. MONOFÁRMACOS — identidad propia preservada
// ---------------------------------------------------------------------------

describe("monofármacos", () => {
  it.each([
    ["Diclofenaco 25 mg x 20 comprimidos", ["diclofenaco"]],
    ["Tramadol 50 mg x 20 cápsulas", ["tramadol"]],
    ["Paracetamol 500 mg x 16 comprimidos", ["paracetamol"]],
    ["Ibuprofeno 400 mg x 20 Comprimidos Recubiertos", ["ibuprofeno"]],
    ["Ambroxol 30mg/5ml Jarabe Adulto 100ml (Andromaco)", ["ambroxol"]],
    ["Omeprazol 20 mg x 30 cápsulas", []],
  ])("%s conserva su composición propia", (name, expected) => {
    expect(tokens(name)).toEqual(expected);
  });

  it("un monofármaco nunca se declara asociación", () => {
    for (const name of [
      "Diclofenaco 25 mg x 20 comprimidos",
      "Paracetamol 500 mg x 16 comprimidos",
      "Ambroxol 30mg/5ml Jarabe Adulto 100ml (Andromaco)",
    ]) {
      expect(readIngredientComposition(name).isAssociation, name).toBe(false);
    }
  });

  it("una concentración masa/volumen NO es una razón de dosis entre componentes", () => {
    expect(declaredArityFromDoseRatio("Ambroxol 30mg/5ml Jarabe Adulto 100ml")).toBe(0);
    expect(declaredArityFromDoseRatio("Amoval Duo 1000 mg/5 mL x 90 mL")).toBe(0);
    expect(declaredArityFromDoseRatio("Salbutamol 100 mcg/Dosis x 200 Dosis")).toBe(0);
  });

  it("un nombre TRUNCADO por la fuente no inventa una asociación", () => {
    // EasyFarma entrega este nombre cortado: "15mg/5" es "15 mg/5 ml" sin la
    // unidad, no una razón de dosis entre dos componentes.
    expect(declaredArityFromDoseRatio("Ambroxol Pediatrico 15mg/5...")).toBe(0);
    expect(readIngredientComposition("Ambroxol Pediatrico 15mg/5...").isAssociation).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. CARDINALIDAD DECLARADA SIN MOLÉCULAS NOMBRABLES
// ---------------------------------------------------------------------------

describe("aridad tipográfica — el nombre declara cuántos componentes hay", () => {
  it.each([
    ["Adorlan 25 mg/25 mg Caja 10 Comp.", 2],
    ["Zolimax Duo 875/125 Amoxicilina 875 mg 14 Comprimidos", 2],
    ["Losapres-D 100/25 Losartan 100 mg 30 Comprimidos Recubierto", 2],
    ["Ambilan Bid 875/125 14 Comprimidos Recubiertos", 2],
    ["Clavam Duo 400 mg/57 mg/5 mL x 70 mL Polvo para Suspensión Oral", 2],
    ["Simperten D 50/12.5 x 30 comprimidos recubiertos", 2],
  ])("%s declara %i componentes", (name, expected) => {
    expect(declaredArityFromDoseRatio(name)).toBe(expected);
  });

  it("declara la asociación aunque no pueda nombrar ninguna molécula", () => {
    const composition = readIngredientComposition("Adorlan 25 mg/25 mg Caja 10 Comp.");
    expect(composition.components).toEqual([]);
    expect(composition.declaredComponentCount).toBe(2);
    expect(composition.isAssociation).toBe(true);
    expect(composition.isComplete).toBe(false);
  });

  it("declara la asociación cuando solo una de las dos moléculas está escrita", () => {
    const composition = readIngredientComposition(
      "Zolimax Duo 875/125 Amoxicilina 875 mg 14 Comprimidos"
    );
    expect(composition.components.map((c) => c.token)).toEqual(["amoxicilina"]);
    expect(composition.declaredComponentCount).toBe(2);
    expect(composition.isComplete).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. LA REGLA DE HONESTIDAD — qué NO se promueve
// ---------------------------------------------------------------------------

describe("no se inventan moléculas", () => {
  it("no promueve dos tokens con dosis si NINGUNO está corroborado", () => {
    // Ni `dutasteride` ni `tamsulosina` están en ningún vocabulario y ninguna
    // farmacia del corpus las escribe con separador entre moléculas: el nombre
    // queda sin composición afirmada, y la aridad tipográfica registra que hay
    // dos componentes sin nombrarlos.
    const composition = readIngredientComposition(
      "Combodart 0,5/0,4 Dutasteride 0,5 mg Tamsulosina 0,4 mg 30 Cápsulas Blandas"
    );
    expect(composition.components).toEqual([]);
    expect(composition.declaredComponentCount).toBe(2);
  });

  it("no promueve una marca que encabeza el nombre", () => {
    for (const name of [
      "Tapsin Forte x 30 comprimidos",
      "Muxol Adulto 30mg/5ml jarabe 100ml",
      "Hyzaar 50 mg/12.5 mg x 30 Comprimidos Recubiertos",
    ]) {
      expect(tokens(name), name).not.toContain(name.split(" ")[0]!.toLowerCase());
    }
  });

  it("no promueve el laboratorio que cierra el nombre", () => {
    const read = tokens(
      "Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol para Inhalación Oral FAES FARMA CHILE"
    );
    expect(read).toEqual(["salbutamol"]);
  });

  it("un separador entre dos tokens NO demuestra que los dos sean moléculas", () => {
    // Nombres reales del corpus donde `combinationKey()` (v1) reconoce una
    // "combinación" que no es de principios activos. Ningún miembro del par está
    // en un vocabulario de moléculas, así que el par entero se descarta.
    const antigripal = tokens(
      "Tapsin Dia Compuesto Antigripal Paracetamol 400 mg Noscapina 10 mg Cafeina 33 mg Polvo para Soluc.Oral 1 Sobre Sabor Limon / Miel / Jengibre"
    );
    expect(antigripal).not.toContain("limon");
    expect(antigripal).not.toContain("miel");
    expect(antigripal).toEqual(["cafeina", "noscapina", "paracetamol"]);

    const zomel = tokens("Zomel HP Triterapia 14 Comprimidos + 14 Cápsulas");
    expect(zomel).not.toContain("zomel");
    expect(zomel).not.toContain("triterapia");
    expect(zomel).toEqual([]);
  });

  it("el par SÍ se conserva entero cuando un solo lado está demostrado", () => {
    // "Lorsartán" es un error tipográfico de la farmacia y no está en ningún
    // vocabulario; `hidroclorotiazida` sí, y sostiene al par. Perderlo dejaría
    // `ing=hidroclorotiazida`: una asociación indistinguible de un monofármaco.
    expect(tokens("Lorsartán Potásico / Hidroclorotiazida 50/12,5 mg x 30 comprimidos")).toEqual([
      "hidroclorotiazida",
      "lorsartan",
    ]);
  });

  it("no promueve un descriptor de forma o de envase", () => {
    const read = tokens("Amoxicilina 250 mg/5 mL x 60 mL Polvo Para Suspensión Oral Frasco");
    expect(read).toEqual(["amoxicilina"]);
  });

  it("no promueve una cantidad de unidades como si fuera una dosis", () => {
    expect(tokens("Paracetamol 500 mg x 16 comprimidos")).toEqual(["paracetamol"]);
    expect(declaredArityFromDoseRatio("Paracetamol 500 mg x 16 comprimidos")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6-bis. NEGACIÓN — nombrar una molécula no demuestra que esté
//
// Defecto real destapado al reejecutar el corpus con `cafeina` en el vocabulario
// de v2: "Tapsin Puro SIN Cafeina 500 mg" compartía concepto con "Tapsin Dolor
// de Cabeza CON cafeína". Es la misma clase de falso merge semántico que Adorlan,
// leída al revés.
// ---------------------------------------------------------------------------

describe("negación — la molécula que el nombre declara AUSENTE", () => {
  it("'Sin Cafeina' no afirma cafeína, y el resto del nombre se lee normal", () => {
    expect(tokens("Tapsin Puro Sin Cafeina Paracetamol 500 mg 16 Comprimidos")).toEqual([
      "paracetamol",
    ]);
  });

  it("un nombre que solo nombra la molécula negada no afirma NINGUNA", () => {
    expect(tokens("Tapsin Puro Sin Cafeina 500 mg x 24 Comprimidos")).toEqual([]);
  });

  it("'con cafeína' SÍ la afirma — la negación no se contagia a otras escrituras", () => {
    expect(tokens("Tapsin Dolor de Cabeza con cafeína x 12 comprimidos")).toEqual(["cafeina"]);
    expect(tokens("Tapsin Paracetamol 400 mg Cafeina 33 mg 30 Comprimidos")).toEqual([
      "cafeina",
      "paracetamol",
    ]);
  });

  it("la negación NO se extiende por yuxtaposición a la molécula siguiente", () => {
    // "sin cafeína paracetamol 500 mg": se niega cafeína, jamás paracetamol.
    const composition = readIngredientComposition("Analgesico Sin Cafeina Paracetamol 500 mg");
    expect(composition.components.map((c) => c.token)).toEqual(["paracetamol"]);
    expect(composition.isAssociation).toBe(false);
  });

  it("la negación SÍ se extiende por coordinación negativa explícita ('ni')", () => {
    expect(tokens("Antigripal sin cafeina ni paracetamol ibuprofeno 200 mg")).toEqual([
      "ibuprofeno",
    ]);
  });

  it("un producto SIN cafeína no comparte concepto con uno CON cafeína", () => {
    const keys = conceptKeys([
      "Tapsin Puro Sin Cafeina 500 mg x 24 Comprimidos",
      "Tapsin Dolor de Cabeza con cafeína x 24 comprimidos",
    ]);
    expect(keys.get("Tapsin Puro Sin Cafeina 500 mg x 24 Comprimidos")).not.toBe(
      keys.get("Tapsin Dolor de Cabeza con cafeína x 24 comprimidos")
    );
  });

  it("'sin azúcar' no altera la composición de un jarabe", () => {
    expect(tokens("Broncot Forte Ambroxol 30mg/5ml sin azucar 120 ml.")).toEqual(["ambroxol"]);
  });
});

// ---------------------------------------------------------------------------
// 7. NIVEL DE CONCEPTO — la afirmación que el gate de producto no podía ver
//
// El Gate C de S0 mide contradicciones DENTRO de un mismo producto comercial.
// El falso merge de Adorlan vivía un nivel más arriba, en el CONCEPTO, donde
// Gate C no mira: por eso podía seguir en 0 mientras el concepto farmacológico
// era incorrecto. Estos tests afirman directamente sobre `provisionalConceptKey`.
// ---------------------------------------------------------------------------

describe("identidad de concepto: asociación ≠ monofármaco", () => {
  it("Adorlan (diclofenaco+tramadol) NO comparte concepto con Lertus (diclofenaco)", () => {
    const keys = conceptKeys([
      "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos",
      "Adorlan 25/25 Diclofenaco / Tramadol 10 Comprimidos",
      "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico",
      "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos",
    ]);

    const adorlanSinSeparador = keys.get(
      "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos"
    )!;
    const adorlanConSeparador = keys.get("Adorlan 25/25 Diclofenaco / Tramadol 10 Comprimidos")!;
    const lertusSimi = keys.get(
      "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico"
    )!;
    const lertusCruzVerde = keys.get("Lertus Diclofenaco Sodico 25 mg 20 Comprimidos")!;

    // Lo que corrige esta iteración: la asociación no es el monofármaco.
    expect(adorlanSinSeparador).not.toBe(lertusSimi);
    expect(adorlanSinSeparador).not.toBe(lertusCruzVerde);
    // Lo que además unifica: las dos escrituras de Adorlan son un solo concepto.
    expect(adorlanSinSeparador).toBe(adorlanConSeparador);
    // Lo que se conserva: los dos monofármacos siguen agrupando entre sí.
    expect(lertusSimi).toBe(lertusCruzVerde);
  });

  it("losartán solo NO comparte concepto con losartán + hidroclorotiazida", () => {
    const keys = conceptKeys([
      "Losartan Potasico 50 mg x 30 comprimidos. (Ascend)",
      "Losartan Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos",
      "Losartan 50 mg / Hidroclorotiazida 12.5 mg x 30 Comp.",
    ]);
    const mono = keys.get("Losartan Potasico 50 mg x 30 comprimidos. (Ascend)")!;
    const combo = keys.get(
      "Losartan Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30 comprimidos"
    )!;
    const comboOtraEscritura = keys.get("Losartan 50 mg / Hidroclorotiazida 12.5 mg x 30 Comp.")!;

    expect(mono).not.toBe(combo);
    expect(combo).toBe(comboOtraEscritura);
  });

  it("una asociación con solo una molécula escrita no cae en el monofármaco", () => {
    // "875/125" declara dos componentes; el nombre solo escribe amoxicilina.
    const keys = conceptKeys([
      "Zolimax Duo 875/125 Amoxicilina 875 mg 14 Comprimidos",
      "Amoxicilina 875 mg x 14 comprimidos",
    ]);
    expect(keys.get("Zolimax Duo 875/125 Amoxicilina 875 mg 14 Comprimidos")).not.toBe(
      keys.get("Amoxicilina 875 mg x 14 comprimidos")
    );
  });

  it("Tapsin Duo no cae en el concepto de paracetamol ni en el de ibuprofeno", () => {
    const keys = conceptKeys([
      "Tapsin Duo paracetamol 300 mg ibuprofeno 200 mg 12 comprimidos recubiertos",
      "Paracetamol 300 mg x 12 comprimidos",
      "Ibuprofeno 200 mg x 12 comprimidos",
    ]);
    const duo = keys.get(
      "Tapsin Duo paracetamol 300 mg ibuprofeno 200 mg 12 comprimidos recubiertos"
    )!;
    expect(duo).not.toBe(keys.get("Paracetamol 300 mg x 12 comprimidos"));
    expect(duo).not.toBe(keys.get("Ibuprofeno 200 mg x 12 comprimidos"));
  });

  it("los monofármacos de dos farmacias siguen agrupando entre sí", () => {
    const keys = conceptKeys([
      "Paracetamol 500 mg x 16 comprimidos",
      "Paracetamol 500mg 16 Comprimidos",
    ]);
    expect(keys.get("Paracetamol 500 mg x 16 comprimidos")).toBe(
      keys.get("Paracetamol 500mg 16 Comprimidos")
    );
  });
});
