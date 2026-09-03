/**
 * CF-SEARCH-012 S1 — GATE D (Concept Semantic Collision Rate) y las
 * REGRESIONES SEMÁNTICAS DE S0 verificadas sobre el registro PERSISTENTE.
 *
 * Dos mitades, y las dos hacen falta:
 *
 *   1. el DETECTOR — que cada una de las ocho clases de contradicción se vea
 *      cuando existe, y que no dispare cuando lo único que hay es evidencia
 *      incompleta (si no, el gate sería un medidor de fragmentación);
 *   2. las REGRESIONES — que los defectos que S0 corrigió sigan corregidos
 *      cuando la identidad la asigna el registro persistido y no el corpus.
 *      Los casos de S0 se verificaban sobre `canonicalize()`; acá se verifican
 *      sobre `assignIdentity()`, que es un camino distinto.
 */
import { describe, expect, it } from "vitest";
import { canonicalizeOffer } from "../searchV2/canonicalAttributes.js";
import { conceptSignature } from "../searchV2/canonicalize.js";
import { signatureText } from "../searchV2/canonicalIdentity.js";
import { assignIdentity } from "../searchV2/canonicalIdentityAssigner.js";
import { InMemoryCanonicalRegistry } from "../searchV2/registryMemory.js";
import {
  auditConceptCollisions,
  detectConceptCollisions,
  type ConceptMember,
} from "../searchV2/conceptCollision.js";
import { matchKey } from "../matching.js";
import type { ObservationInput } from "../searchV2/registryTypes.js";
import type { PharmacySlug } from "../types.js";

function attributesOf(rawName: string, pharmacy: PharmacySlug = "cruz-verde") {
  return canonicalizeOffer({
    pharmacy,
    rawName,
    price: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
    stock: true,
    url: null,
    capturedAt: "2026-09-03T00:00:00.000Z",
    sourceProductId: rawName,
  });
}

function member(rawName: string, pharmacy: PharmacySlug = "cruz-verde"): ConceptMember {
  return { observationId: `${pharmacy}|${rawName}`, pharmacy, rawName, attributes: attributesOf(rawName, pharmacy) };
}

function observe(rawName: string, pharmacy: PharmacySlug = "cruz-verde"): ObservationInput {
  return {
    pharmacy,
    rawName,
    sourceProductId: `${pharmacy}::${rawName}`,
    observedAt: "2026-09-03T00:00:00.000Z",
    attributes: attributesOf(rawName, pharmacy),
    upstreamFields: {},
    legacyMatchKey: matchKey(rawName),
    legacyPresentationKey: null,
  };
}

/** Asigna identidad a varios nombres y devuelve el registro + los conceptos. */
async function assignAll(names: Array<[string, PharmacySlug]>) {
  const registry = new InMemoryCanonicalRegistry();
  const conceptByName = new Map<string, string | null>();
  for (const [name, pharmacy] of names) {
    const assigned = await assignIdentity(registry, observe(name, pharmacy));
    conceptByName.set(name, assigned.concept.entityId);
  }
  return { registry, conceptByName };
}

/** Gate D sobre TODO el registro resultante. */
function auditRegistry(
  registry: InMemoryCanonicalRegistry,
  members: Map<string, ConceptMember[]>
) {
  return auditConceptCollisions(
    [...members.entries()].map(([conceptId, ms]) => ({
      conceptId,
      signature: registry.concepts.get(conceptId)?.canonicalSignature ?? "",
      members: ms,
    }))
  );
}

describe("Gate D — las ocho clases de contradicción", () => {
  it("1. monoterapia vs asociación", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Adorlan 25/25 Diclofenaco 25 mg Tramadol 25 mg x 10 Comprimidos"),
      member("Lertus Diclofenaco Sodico 25 mg x 20 Comprimidos"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("MONOTHERAPY_VS_ASSOCIATION");
    const hit = collisions.find((c) => c.collisionType === "MONOTHERAPY_VS_ASSOCIATION")!;
    // El informe trae las dos entidades, la evidencia de cada lado y el motivo.
    expect(hit.left.rawName).toContain("Adorlan");
    expect(hit.right.rawName).toContain("Lertus");
    expect(hit.left.evidence).toContain("componentes declarados=2");
    expect(hit.right.evidence).toContain("componentes declarados=1");
    expect(hit.reason).toContain("asociación");
  });

  it("2. ingredientes incompatibles", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Paracetamol 500 mg x 16 Comprimidos"),
      member("Ibuprofeno 400 mg x 16 Comprimidos"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("INCOMPATIBLE_INGREDIENTS");
  });

  it("3. concentración incompatible", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Ambroxol 30 mg/5 ml Jarabe 100 ml"),
      member("Ambroxol 15 mg/5 ml Jarabe 100 ml"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("INCOMPATIBLE_CONCENTRATION");
  });

  it("4. forma farmacéutica incompatible", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Omeprazol 20 mg x 30 Comprimidos"),
      member("Omeprazol 20 mg x 30 Capsulas"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("INCOMPATIBLE_DOSAGE_FORM");
  });

  it("5. vía de administración incompatible", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Clotrimazol 100 mg x 6 Ovulos"),
      member("Diclofenaco 100 mg x 6 Supositorios"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("INCOMPATIBLE_ROUTE");
  });

  it("6. unidad farmacéutica incompatible", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Paracetamol 500 mg x 16 Comprimidos"),
      member("Paracetamol 500 mg x 16 Sobres"),
    ]);
    expect(collisions.map((c) => c.collisionType)).toContain("INCOMPATIBLE_PHARMACEUTICAL_UNIT");
  });

  it("7. componente explícitamente negado frente a presente", () => {
    const negated = member("Tapsin Puro SIN Cafeina Paracetamol 500 mg x 24 Comprimidos");
    const present = member("Tapsin Dolor de Cabeza CON cafeina paracetamol 500 mg x 12 comprimidos");
    // El lector de composición publica la negación como evidencia positiva.
    expect(negated.attributes.negatedComponents).toContain("cafeina");
    expect(present.attributes.activeIngredients.map((i) => i.token)).toContain("cafeina");

    const collisions = detectConceptCollisions("C1", "sig", [negated, present]);
    const hit = collisions.find((c) => c.collisionType === "NEGATED_COMPONENT_PRESENT")!;
    expect(hit).toBeDefined();
    expect(hit.left.evidence).toBe("declara AUSENTE: cafeina");
    expect(hit.right.evidence).toBe("declara PRESENTE: cafeina");
  });

  it("8. discriminante no resuelto tratado como principio activo", () => {
    // Una observación que afirmara molécula Y discriminante a la vez sería el
    // defecto que la revisión del PR #159 corrigió. Se construye a mano porque
    // el canonicalizador ya no lo produce — el gate existe para detectarlo si
    // alguna vez vuelve.
    const broken = member("Paracetamol 500 mg x 16 Comprimidos");
    broken.attributes = { ...broken.attributes, unresolvedIdentityDiscriminator: "tapsin" };

    const collisions = detectConceptCollisions("C1", "sig", [broken]);
    expect(collisions.map((c) => c.collisionType)).toContain(
      "UNRESOLVED_DISCRIMINATOR_AS_INGREDIENT"
    );
  });

  it("NO dispara por evidencia incompleta: ausencia no es contradicción", () => {
    const collisions = detectConceptCollisions("C1", "sig", [
      member("Paracetamol 500 mg x 16 Comprimidos"),
      // Sin forma, sin unidad, sin concentración declaradas.
      member("Paracetamol"),
    ]);
    for (const type of [
      "INCOMPATIBLE_CONCENTRATION",
      "INCOMPATIBLE_DOSAGE_FORM",
      "INCOMPATIBLE_ROUTE",
      "INCOMPATIBLE_PHARMACEUTICAL_UNIT",
    ]) {
      expect(collisions.map((c) => c.collisionType)).not.toContain(type);
    }
  });

  it("el informe agregado trae tasa, pares comparados y desglose por tipo", () => {
    const report = auditConceptCollisions([
      {
        conceptId: "CFM-CONCEPT-000001",
        signature: "sig",
        members: [
          member("Paracetamol 500 mg x 16 Comprimidos"),
          member("Ibuprofeno 400 mg x 16 Comprimidos"),
        ],
      },
    ]);
    expect(report.pairsCompared).toBe(1);
    expect(report.collisions.length).toBeGreaterThan(0);
    expect(report.rate).toBeGreaterThan(0);
    expect(Object.keys(report.byType).length).toBeGreaterThan(0);
  });
});

describe("regresiones semánticas de S0, verificadas sobre el registro PERSISTENTE", () => {
  it("ADORLAN — una asociación no comparte concepto con su monofármaco", async () => {
    const { conceptByName } = await assignAll([
      ["Adorlan 25/25 Diclofenaco 25 mg Tramadol 25 mg x 10 Comprimidos", "dr-simi"],
      ["Lertus Diclofenaco Sodico 25 mg x 20 Comprimidos", "cruz-verde"],
    ]);
    const [adorlan, lertus] = [...conceptByName.values()];
    expect(adorlan).not.toBe(lertus);
    expect(adorlan).not.toBeNull();
    expect(lertus).not.toBeNull();
  });

  it("TAPSIN PURO SIN CAFEÍNA — no comparte concepto con la versión CON cafeína", async () => {
    const sin = attributesOf("Tapsin Puro SIN Cafeina Paracetamol 500 mg x 24 Comprimidos");
    const con = attributesOf("Tapsin Dolor de Cabeza CON cafeina paracetamol 500 mg x 12 comprimidos");
    // La negación impide afirmar cafeína en el primero...
    expect(sin.activeIngredients.map((i) => i.token)).not.toContain("cafeina");
    // ...y el segundo sí la afirma, así que los conjuntos difieren.
    expect(con.activeIngredients.map((i) => i.token)).toContain("cafeina");

    const { conceptByName } = await assignAll([
      ["Tapsin Puro SIN Cafeina Paracetamol 500 mg x 24 Comprimidos", "ahumada"],
      ["Tapsin Dolor de Cabeza CON cafeina paracetamol 500 mg x 12 comprimidos", "cruz-verde"],
    ]);
    const ids = [...conceptByName.values()];
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("TAPSIN — no es un principio activo, es un discriminante no resuelto", () => {
    const attributes = attributesOf("Tapsin Forte x 30 Comprimidos");
    expect(attributes.activeIngredients).toHaveLength(0);
    expect(attributes.unresolvedIdentityDiscriminator).toBe("tapsin");
  });

  it("TAPSIN DUO — paracetamol + ibuprofeno, y `tapsin` NO entra como molécula", () => {
    const attributes = attributesOf("Tapsin Duo (B) Paracetamol / Ibuprofeno 125/100 mg x 20 Comprimidos");
    const tokens = attributes.activeIngredients.map((i) => i.token).sort();
    expect(tokens).toEqual(["ibuprofeno", "paracetamol"]);
    expect(tokens).not.toContain("tapsin");
  });

  it("ZOMEL — no es un principio activo", () => {
    const attributes = attributesOf("Zomel HP Triterapia x 14 Comprimidos");
    expect(attributes.activeIngredients.map((i) => i.token)).not.toContain("zomel");
  });

  it("LOSARTÁN ≠ LOSARTÁN + HIDROCLOROTIAZIDA", async () => {
    const { conceptByName } = await assignAll([
      ["Losartan Potasico 50 mg x 30 Comprimidos", "cruz-verde"],
      ["Losartan / Hidroclorotiazida 50/12,5 mg x 30 Comprimidos", "salcobrand"],
    ]);
    const ids = [...conceptByName.values()];
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("SALES — losartán potásico, naproxeno sódico y cetirizina diclorhidrato son un solo ingrediente", () => {
    for (const [name, token] of [
      ["Losartan Potasico 50 mg x 30 Comprimidos", "losartan"],
      ["Naproxeno Sodico 550 mg x 20 Comprimidos", "naproxeno"],
      ["Cetirizina Diclorhidrato 10 mg x 20 Comprimidos", "cetirizina"],
    ] as const) {
      const tokens = attributesOf(name).activeIngredients.map((i) => i.token);
      expect(tokens).toContain(token);
      expect(tokens).toHaveLength(1);
    }
  });

  it("AMBROXOL — 30 mg ≠ 30 mg/5 ml ≠ 15 mg/5 ml", async () => {
    const { conceptByName } = await assignAll([
      ["Ambroxol 30 mg/5 ml Jarabe 100 ml", "cruz-verde"],
      ["Ambroxol 15 mg/5 ml Jarabe 100 ml", "salcobrand"],
    ]);
    const ids = [...conceptByName.values()];
    expect(ids[0]).not.toBeNull();
    expect(ids[1]).not.toBeNull();
    expect(ids[0]).not.toBe(ids[1]);

    // Y una masa absoluta sin razón NO se fusiona con ninguna de las dos: es
    // compatible con ambas, así que queda ambigua y no se elige.
    const registry = new InMemoryCanonicalRegistry();
    await assignIdentity(registry, observe("Ambroxol 30 mg/5 ml Jarabe 100 ml"));
    await assignIdentity(registry, observe("Ambroxol 15 mg/5 ml Jarabe 100 ml"));
    const massOnly = await assignIdentity(registry, observe("Ambroxol 30 mg Jarabe 100 ml"));
    expect(massOnly.concept.entityId === null || massOnly.concept.outcome === "subsumed").toBe(true);
  });

  it("FORMA — comprimido ≠ cápsula, crema ≠ gel", async () => {
    const solid = await assignAll([
      ["Paracetamol 500 mg x 30 Comprimidos", "cruz-verde"],
      ["Paracetamol 500 mg x 30 Capsulas", "salcobrand"],
    ]);
    const solidIds = [...solid.conceptByName.values()];
    expect(solidIds[0]).not.toBeNull();
    expect(solidIds[1]).not.toBeNull();
    expect(solidIds[0]).not.toBe(solidIds[1]);

    // Crema y gel son formas canónicas DISTINTAS, y su firma lo refleja: aunque
    // ninguna de las dos llegue a acuñar identidad (ver el test siguiente), sus
    // firmas no pueden colapsar.
    expect(attributesOf("Diclofenaco 1% Crema 30 g").canonicalDosageForm).toBe("crema");
    expect(attributesOf("Diclofenaco 1% Gel 30 g").canonicalDosageForm).toBe("gel");
    expect(
      signatureText(conceptSignature(attributesOf("Diclofenaco 1% Crema 30 g")))
    ).not.toBe(signatureText(conceptSignature(attributesOf("Diclofenaco 1% Gel 30 g"))));
  });

  it("una crema NO acuña identidad: su concentración leída es el peso del envase", async () => {
    // "Diclofenaco 1% Crema 30 g" declara la concentración en PORCENTAJE, que el
    // lector de S0 no modela; lo que lee como concentración es `30 g`, el peso
    // del tubo. Acuñar un Concepto Farmacéutico permanente desde ese dato
    // fijaría el tamaño del envase como potencia del medicamento.
    const attributes = attributesOf("Diclofenaco 1% Crema 30 g");
    expect(attributes.concentration.kind).toBe("mass-only");

    const { conceptByName } = await assignAll([["Diclofenaco 1% Crema 30 g", "cruz-verde"]]);
    expect([...conceptByName.values()][0]).toBeNull();
  });

  it("un líquido con masa absoluta NO acuña: `30 mg` es lectura parcial de `30 mg/5 mL`", async () => {
    // Sin esta regla, "Ambroxol 30 mg Jarabe 100 ml" acuñaría un concepto
    // permanente distinto del de "Ambroxol 30 mg/5 mL Jarabe", que casi con
    // seguridad es el mismo medicamento: un falso split grabado en piedra.
    const { conceptByName } = await assignAll([["Ambroxol 30 mg Jarabe 100 ml", "cruz-verde"]]);
    expect([...conceptByName.values()][0]).toBeNull();

    // En un comprimido, en cambio, la masa absoluta SÍ es la concentración.
    const solid = await assignAll([["Paracetamol 500 mg x 16 Comprimidos", "cruz-verde"]]);
    expect([...solid.conceptByName.values()][0]).not.toBeNull();
  });

  it("LÍMITE MEDIDO DE S1 — sin molécula demostrable no se acuña identidad", async () => {
    // `omeprazol` NO está en el vocabulario de moléculas (limitación conocida y
    // medida de S0: 36,5 % de las ofertas sin principio activo demostrable).
    // La consecuencia en S1 es explícita y no se disimula: el nombre no puede
    // fundar un Concepto Farmacéutico permanente, porque acuñarlo sería crear
    // conocimiento científico donde no lo hay.
    const attributes = attributesOf("Omeprazol 20 mg x 30 Comprimidos");
    expect(attributes.activeIngredients).toHaveLength(0);
    expect(attributes.unresolvedIdentityDiscriminator).toBe("omeprazol");

    const { conceptByName } = await assignAll([["Omeprazol 20 mg x 30 Comprimidos", "cruz-verde"]]);
    expect([...conceptByName.values()][0]).toBeNull();
  });

  it("VÍA — óvulo=vaginal y gotas óticas=otic, nunca rectal ni oftálmica", () => {
    expect(attributesOf("Clotrimazol 100 mg x 6 Ovulos").route).toBe("vaginal");
    expect(attributesOf("Otomicin Gotas Oticas 5 ml").route).toBe("otic");
    expect(attributesOf("Diclofenaco 100 mg x 6 Supositorios").route).toBe("rectal");
  });

  it("UNIDAD — un sobre no es un comprimido", async () => {
    const { conceptByName } = await assignAll([
      ["Paracetamol 500 mg x 16 Comprimidos", "cruz-verde"],
      ["Paracetamol 500 mg x 16 Sobres", "salcobrand"],
    ]);
    const ids = [...conceptByName.values()];
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe("Gate D sobre el registro completo — tasa 0 en el escenario de regresión", () => {
  it("ningún concepto persistido agrupa observaciones que se contradigan", async () => {
    const names: Array<[string, PharmacySlug]> = [
      ["Adorlan 25/25 Diclofenaco 25 mg Tramadol 25 mg x 10 Comprimidos", "dr-simi"],
      ["Lertus Diclofenaco Sodico 25 mg x 20 Comprimidos", "cruz-verde"],
      ["Tapsin Puro SIN Cafeina Paracetamol 500 mg x 24 Comprimidos", "ahumada"],
      ["Tapsin Dolor de Cabeza CON cafeina paracetamol 500 mg x 12 comprimidos", "salcobrand"],
      ["Losartan Potasico 50 mg x 30 Comprimidos", "farmex"],
      ["Losartan / Hidroclorotiazida 50/12,5 mg x 30 Comprimidos", "ecofarmacias"],
      ["Omeprazol 20 mg x 30 Comprimidos", "cruz-verde"],
      ["Omeprazol 20 mg x 30 Capsulas", "salcobrand"],
      ["Paracetamol 500 mg x 16 Comprimidos", "cruz-verde"],
      ["Paracetamol 500 mg x 16 Sobres", "ahumada"],
      ["Ambroxol 30 mg/5 ml Jarabe 100 ml", "cruz-verde"],
      ["Ambroxol 15 mg/5 ml Jarabe 100 ml", "salcobrand"],
    ];

    const registry = new InMemoryCanonicalRegistry();
    const byConcept = new Map<string, ConceptMember[]>();
    for (const [name, pharmacy] of names) {
      const input = observe(name, pharmacy);
      const assigned = await assignIdentity(registry, input);
      if (assigned.concept.entityId === null) continue;
      byConcept.set(assigned.concept.entityId, [
        ...(byConcept.get(assigned.concept.entityId) ?? []),
        { observationId: input.sourceProductId, pharmacy, rawName: name, attributes: input.attributes },
      ]);
    }

    const report = auditRegistry(registry, byConcept);
    expect(report.collisions).toEqual([]);
    expect(report.rate).toBe(0);
  });
});
