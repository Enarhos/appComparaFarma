/**
 * CF-SEARCH-012 S1 — ESTABILIDAD DE LA IDENTIDAD PERSISTENTE.
 *
 * Los siete tests que el ticket exige, más la regla de acuñación y la tabla de
 * decisión del resolutor. Todos corren contra `InMemoryCanonicalRegistry`, que
 * es la referencia semántica del contrato `CanonicalRegistryRepository` — sin
 * base de datos, deterministas y reproducibles en CI.
 *
 * La propiedad que estos tests protegen es una sola, y es la razón de ser de S1:
 *
 *     un `CFM-CONCEPT-ID` no cambia nunca, pase lo que pase con la consulta, la
 *     farmacia, el orden, el corpus o las reglas de canonicalización.
 */
import { describe, expect, it } from "vitest";
import { canonicalizeOffer } from "../searchV2/canonicalAttributes.js";
import { conceptSignature } from "../searchV2/canonicalize.js";
import { signatureText } from "../searchV2/canonicalIdentity.js";
import { resolveAgainstRegistry, isCompleteSignature } from "../searchV2/canonicalResolver.js";
import {
  assignIdentity,
  conceptBucketKeys,
  observationKey,
  registryProductSignature,
} from "../searchV2/canonicalIdentityAssigner.js";
import { InMemoryCanonicalRegistry } from "../searchV2/registryMemory.js";
import { matchKey } from "../matching.js";
import { CANONICAL_ID_PREFIX, isCanonicalId, SIGNATURE_VERSION } from "../searchV2/registryTypes.js";
import type { ObservationInput } from "../searchV2/registryTypes.js";
import type { PharmacySlug } from "../types.js";

function observe(
  rawName: string,
  pharmacy: PharmacySlug = "cruz-verde",
  extra: { url?: string | null; manufacturer?: string | null; brand?: string | null } = {}
): ObservationInput {
  const attributes = canonicalizeOffer({
    pharmacy,
    rawName,
    price: { store: 1000, online: null, cmr: null, sbpay: null, effective: 1000 },
    stock: true,
    url: extra.url ?? null,
    capturedAt: "2026-09-03T00:00:00.000Z",
    sourceProductId: extra.url ?? rawName,
    structuredBrand: extra.brand ?? null,
    structuredManufacturer: extra.manufacturer ?? null,
    isBioequivalent: null,
    ispRegistration: null,
    legacyPresentationKey: null,
  });
  return {
    pharmacy,
    rawName,
    sourceProductId: extra.url ?? rawName,
    observedAt: "2026-09-03T00:00:00.000Z",
    attributes,
    upstreamFields: { brand: extra.brand ?? null, manufacturer: extra.manufacturer ?? null },
    legacyMatchKey: matchKey(rawName),
    legacyPresentationKey: null,
  };
}

/** Un nombre que declara las cinco dimensiones del EDM-100: firma COMPLETA. */
const COMPLETE = "Paracetamol 500 mg x 16 Comprimidos";
/** El mismo artículo escrito por otra farmacia, también completo. */
const COMPLETE_OTHER = "Paracetamol 500mg 16 comprimidos";

describe("regla de acuñación — solo una firma COMPLETA acuña identidad", () => {
  it("una firma completa acuña un CFM-CONCEPT-ID de secuencia, no un hash", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const assigned = await assignIdentity(registry, observe(COMPLETE));

    expect(assigned.concept.outcome).toBe("created");
    expect(assigned.concept.entityId).toBe(`${CANONICAL_ID_PREFIX.concept}000001`);
    expect(isCanonicalId("concept", assigned.concept.entityId!)).toBe(true);
    // Nunca el espacio de nombres provisional de S0.
    expect(assigned.concept.entityId).not.toContain("PROV-");
  });

  it("una observación PARCIAL sin registro previo NO crea identidad", async () => {
    const registry = new InMemoryCanonicalRegistry();
    // Sin forma farmacéutica, sin vía y sin unidad: firma incompleta.
    const partial = observe("Paracetamol 500 mg");
    expect(isCompleteSignature(conceptSignature(partial.attributes))).toBe(false);

    const assigned = await assignIdentity(registry, partial);

    expect(assigned.concept.outcome).toBe("unresolved");
    expect(assigned.concept.entityId).toBeNull();
    expect(registry.concepts.size).toBe(0);
    // Y tampoco arrastra a los niveles de abajo a inventarse nada.
    expect(assigned.presentation.entityId).toBeNull();
    expect(assigned.product.entityId).toBeNull();
    expect(assigned.linked).toBe(false);
  });

  it("una observación parcial resuelve contra una identidad YA persistida", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const anchor = await assignIdentity(registry, observe(COMPLETE));

    const assigned = await assignIdentity(registry, observe("Paracetamol 500 mg"));

    expect(assigned.concept.outcome).toBe("subsumed");
    expect(assigned.concept.entityId).toBe(anchor.concept.entityId);
    // Resolver no es acuñar: el registro sigue teniendo UN concepto.
    expect(registry.concepts.size).toBe(1);
  });

  it("una observación parcial compatible con DOS identidades queda ambigua, no elige", async () => {
    const registry = new InMemoryCanonicalRegistry();
    await assignIdentity(registry, observe("Ambroxol 30 mg/5 ml Jarabe 100 ml"));
    await assignIdentity(registry, observe("Ambroxol 15 mg/5 ml Jarabe 100 ml"));

    const assigned = await assignIdentity(registry, observe("Ambroxol Jarabe 100 ml"));

    expect(assigned.concept.outcome).toBe("ambiguous");
    expect(assigned.concept.entityId).toBeNull();
    expect(assigned.concept.candidateCount).toBeGreaterThanOrEqual(2);
    // La ambigüedad se REPORTA con sus candidatos, no se esconde.
    expect(assigned.concept.candidateIds.length).toBeGreaterThanOrEqual(2);
  });
});

describe("los siete tests de estabilidad persistente", () => {
  it("QUERY INDEPENDENCE — la consulta no participa de ninguna firma", async () => {
    const registry = new InMemoryCanonicalRegistry();
    // La misma observación llega desde tres búsquedas distintas. La consulta ni
    // siquiera es un parámetro de `assignIdentity`: la independencia es
    // estructural, y este test la fija como contrato.
    const first = await assignIdentity(registry, observe(COMPLETE));
    const second = await assignIdentity(registry, observe(COMPLETE));
    const third = await assignIdentity(registry, observe(COMPLETE));

    expect(second.concept.entityId).toBe(first.concept.entityId);
    expect(third.concept.entityId).toBe(first.concept.entityId);
    expect(second.concept.outcome).toBe("exact");
    expect(registry.concepts.size).toBe(1);
  });

  it("PHARMACY INDEPENDENCE — la misma identidad desde farmacias distintas reutiliza el ID", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const cruzVerde = await assignIdentity(registry, observe(COMPLETE, "cruz-verde"));
    const ahumada = await assignIdentity(registry, observe(COMPLETE_OTHER, "ahumada"));
    const salcobrand = await assignIdentity(registry, observe(COMPLETE, "salcobrand"));

    expect(ahumada.concept.entityId).toBe(cruzVerde.concept.entityId);
    expect(salcobrand.concept.entityId).toBe(cruzVerde.concept.entityId);
    expect(registry.concepts.size).toBe(1);
    // Y las tres observaciones siguen siendo tres observaciones distintas.
    expect(registry.observations.size).toBe(3);
  });

  it("ORDER INDEPENDENCE — cambiar el orden de llegada no cambia ninguna identidad", async () => {
    const names = [
      "Paracetamol 500 mg x 16 Comprimidos",
      "Ibuprofeno 400 mg x 20 Comprimidos",
      "Ambroxol 30 mg/5 ml Jarabe 100 ml",
      "Losartan Potasico 50 mg x 30 Comprimidos",
    ];

    const run = async (order: number[]) => {
      const registry = new InMemoryCanonicalRegistry();
      const out = new Map<string, string | null>();
      for (const index of order) {
        const assigned = await assignIdentity(registry, observe(names[index]!));
        out.set(names[index]!, assigned.concept.entityId);
      }
      return out;
    };

    const forward = await run([0, 1, 2, 3]);
    const backward = await run([3, 2, 1, 0]);
    const shuffled = await run([2, 0, 3, 1]);

    // Los IDs de secuencia sí dependen del orden de llegada —eso es lo que hace
    // un contador—, así que lo que se compara es la PARTICIÓN: qué nombres
    // comparten identidad y cuáles no. Es la propiedad que importa.
    const partition = (map: Map<string, string | null>) => {
      const groups = new Map<string, string[]>();
      for (const [name, id] of map) {
        const key = id ?? "UNRESOLVED";
        groups.set(key, [...(groups.get(key) ?? []), name].sort());
      }
      return [...groups.values()].map((g) => g.join("||")).sort();
    };

    expect(partition(backward)).toEqual(partition(forward));
    expect(partition(shuffled)).toEqual(partition(forward));
    // Cuatro conceptos distintos: ninguno se fusionó con otro.
    expect(partition(forward)).toHaveLength(4);
  });

  it("CORPUS INDEPENDENCE — agregar una oferta nueva no rota ningún ID existente", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const before = await assignIdentity(registry, observe(COMPLETE));
    const beforeId = before.concept.entityId;

    // Llega un corpus entero que no existía antes.
    for (const name of [
      "Ibuprofeno 400 mg x 20 Comprimidos",
      "Ambroxol 30 mg/5 ml Jarabe 100 ml",
      "Omeprazol 20 mg x 30 Capsulas",
      "Cetirizina 10 mg x 20 Comprimidos",
    ]) {
      await assignIdentity(registry, observe(name));
    }

    const after = await assignIdentity(registry, observe(COMPLETE, "farmex"));
    expect(after.concept.entityId).toBe(beforeId);
    expect(registry.concepts.get(beforeId!)!.id).toBe(beforeId);
  });

  it("PARTIAL OBSERVATION — evidencia insuficiente nunca crea identidad nueva", async () => {
    const registry = new InMemoryCanonicalRegistry();
    // Ni el primero ni el décimo: por muchas veces que llegue, una observación
    // parcial sola no funda un Concepto Farmacéutico.
    for (let i = 0; i < 10; i++) {
      const assigned = await assignIdentity(
        registry,
        observe("Paracetamol 500 mg", "cruz-verde", { url: `https://x/p/${i}` })
      );
      expect(assigned.concept.outcome).toBe("unresolved");
    }
    expect(registry.concepts.size).toBe(0);
    expect(registry.presentations.size).toBe(0);
    expect(registry.products.size).toBe(0);
    // Las observaciones SÍ quedan registradas, sin identidad. No se pierde nada.
    expect(registry.observations.size).toBe(10);
  });

  it("CONCURRENT CREATION — dos procesos con la misma firma completa producen UN registro", async () => {
    const registry = new InMemoryCanonicalRegistry();
    // El gancho intercala las dos llamadas justo donde una implementación real
    // haría el round-trip a la base: las dos leen "no existe" antes de que
    // ninguna escriba. Solo la atomicidad de la sección crítica puede salvarlo.
    let releases = 0;
    registry.latencyHook = async () => {
      releases += 1;
      await new Promise((resolve) => setTimeout(resolve, releases === 1 ? 5 : 0));
    };

    const [a, b] = await Promise.all([
      assignIdentity(registry, observe(COMPLETE, "cruz-verde", { url: "https://a" })),
      assignIdentity(registry, observe(COMPLETE_OTHER, "ahumada", { url: "https://b" })),
    ]);

    expect(a.concept.entityId).toBe(b.concept.entityId);
    expect(registry.concepts.size).toBe(1);
    // Exactamente una acuñó y la otra reutilizó: los contadores de
    // `identity_created` / `identity_reused` no pueden mentir.
    const outcomes = [a.concept.outcome, b.concept.outcome].sort();
    expect(outcomes).toEqual(["created", "exact"]);
  });

  it("CANONICALIZER VERSION CHANGE — una firma nueva se asocia al MISMO ID, no lo rota", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const original = await assignIdentity(registry, observe(COMPLETE));
    const originalId = original.concept.entityId!;
    const originalSignature = registry.concepts.get(originalId)!.canonicalSignature;

    // Una mejora del canonicalizador cambia la firma del concepto (por ejemplo,
    // un eje nuevo o una normalización distinta de la concentración).
    const evolved = `${originalSignature}|atc=N02BE01`;
    await registry.rebindSignature("concept", originalId, evolved, SIGNATURE_VERSION, "v2.2.0");

    // El ID NO cambió...
    expect(registry.concepts.get(originalId)!.id).toBe(originalId);
    expect(registry.concepts.get(originalId)!.canonicalSignature).toBe(evolved);
    expect(registry.concepts.size).toBe(1);

    // ...y la firma ANTIGUA sigue resolviendo a la misma identidad, que es lo
    // que impide que las observaciones que todavía la producen acuñen un ID nuevo.
    const again = await assignIdentity(registry, observe(COMPLETE, "salcobrand"));
    expect(again.concept.entityId).toBe(originalId);
    expect(registry.concepts.size).toBe(1);
  });
});

describe("cardinalidades del EDM — producto y presentación son N:M", () => {
  it("el mismo producto comercial en dos presentaciones es UN producto y DOS pares", async () => {
    const registry = new InMemoryCanonicalRegistry();
    // Mismo concepto, misma marca, mismo laboratorio; dos tamaños de caja.
    await assignIdentity(
      registry,
      observe("Paracetamol 500 mg x 16 Comprimidos", "cruz-verde", { manufacturer: "Maver" })
    );
    await assignIdentity(
      registry,
      observe("Paracetamol 500 mg x 30 Comprimidos", "salcobrand", { manufacturer: "Maver" })
    );

    expect(registry.concepts.size).toBe(1);
    expect(registry.presentations.size).toBe(2);
    // Un solo Producto Medicinal Comercial: el EDM no lista Presentación entre
    // sus propiedades. Anclar el producto a la presentación daría 2 acá.
    expect(registry.products.size).toBe(1);
    // Y dos pares comparables, que es la unidad que el usuario compara.
    expect(registry.productPresentations.size).toBe(2);
  });

  it("el producto se ancla al concepto, nunca a la presentación", () => {
    const attributes = canonicalizeOffer({
      pharmacy: "cruz-verde",
      rawName: COMPLETE,
      price: { store: 1, online: null, cmr: null, sbpay: null, effective: 1 },
      stock: true,
      url: null,
      capturedAt: "2026-09-03T00:00:00.000Z",
    });
    const text = signatureText(registryProductSignature("CFM-CONCEPT-000001", attributes));
    expect(text.startsWith("concept=CFM-CONCEPT-000001|")).toBe(true);
    expect(text).not.toContain("presentation=");
  });
});

describe("provenance — se puede responder por qué una oferta cayó en un concepto", () => {
  it("registra las tres versiones, las dos firmas, la evidencia y el motivo", async () => {
    const registry = new InMemoryCanonicalRegistry();
    await assignIdentity(registry, observe(COMPLETE, "dr-simi", { url: "https://simi/p/1" }));

    const conceptRows = registry.provenance.filter((r) => r.entityKind === "concept");
    expect(conceptRows).toHaveLength(1);
    const row = conceptRows[0]!;

    expect(row.canonicalizerVersion).toBeTruthy();
    expect(row.resolverVersion).toBeTruthy();
    expect(row.signatureVersion).toBe(SIGNATURE_VERSION);
    expect(row.rawSignature).toContain("ing=paracetamol");
    expect(row.normalizedSignature).toBe(row.rawSignature);
    expect(row.outcome).toBe("created");
    expect(row.reason).toContain("firma completa");
    expect(row.inferredFields.activeIngredients).toContain("paracetamol");
    // Trazabilidad legacy, nunca identidad.
    expect(row.legacyMatchKey).toBeTruthy();
    // Y NADA de usuario.
    const serialized = JSON.stringify(row);
    expect(serialized).not.toContain("query");
    expect(serialized).not.toContain("ip");
  });

  it("hay una fila de linaje por cada uno de los tres niveles", async () => {
    const registry = new InMemoryCanonicalRegistry();
    await assignIdentity(registry, observe(COMPLETE));
    expect(registry.provenance.map((r) => r.entityKind).sort()).toEqual([
      "concept",
      "presentation",
      "product",
    ]);
  });
});

describe("resolveAgainstRegistry — tabla de decisión", () => {
  const complete = conceptSignature(canonicalizeOffer({
    pharmacy: "cruz-verde",
    rawName: COMPLETE,
    price: { store: 1, online: null, cmr: null, sbpay: null, effective: 1 },
    stock: true,
    url: null,
    capturedAt: "2026-09-03T00:00:00.000Z",
  }));

  it("firma completa con alias exacto ⇒ exact, y no acuña", () => {
    const result = resolveAgainstRegistry(complete, [
      { entityId: "CFM-CONCEPT-000042", signature: signatureText(complete), signatureVersion: 1 },
    ]);
    expect(result.outcome).toBe("exact");
    expect(result.entityId).toBe("CFM-CONCEPT-000042");
  });

  it("firma completa sin alias ⇒ created, y el ID lo pone el repositorio", () => {
    const result = resolveAgainstRegistry(complete, []);
    expect(result.outcome).toBe("created");
    expect(result.entityId).toBeNull();
  });

  it("el resolutor nunca ve precio, stock, farmacia ni consulta", () => {
    // La firma del concepto no tiene ninguno de esos ejes. Es el contrato.
    const axes = complete.axes.map((a) => a.name);
    expect(axes).toEqual(["ing", "disc", "conc", "form", "route", "unit"]);
  });
});

describe("claves de bucket — prefiltro del repositorio", () => {
  it("emite una clave por molécula nombrada, no una sola", () => {
    expect(conceptBucketKeys("ing=amoxicilina+clavulanico|disc=none|conc=875mg")).toEqual([
      "ing:amoxicilina",
      "ing:clavulanico",
    ]);
  });

  it("una asociación PARCIAL publica las moléculas que sí nombró", () => {
    expect(conceptBucketKeys("ing=amoxicilina+?2|disc=none")).toEqual(["ing:amoxicilina"]);
  });

  it("sin moléculas, la clave es el discriminante de identidad no resuelta", () => {
    expect(conceptBucketKeys("ing=?|disc=tapsin|conc=?")).toEqual(["disc:tapsin"]);
  });

  it("sin molécula ni discriminante no hay clave selectiva", () => {
    expect(conceptBucketKeys("ing=?|disc=none|conc=?")).toEqual([]);
  });
});

describe("identidad de la observación", () => {
  it("es idempotente por farmacia + referencia de origen", async () => {
    const registry = new InMemoryCanonicalRegistry();
    await assignIdentity(registry, observe(COMPLETE, "farmex", { url: "https://f/p/9" }));
    await assignIdentity(registry, observe(COMPLETE, "farmex", { url: "https://f/p/9" }));
    expect(registry.observations.size).toBe(1);
    expect(observationKey("farmex", "https://f/p/9")).toBe("farmex|https://f/p/9");
  });
});
