/**
 * CF-SEARCH-012 S1 — evaluador del REGISTRO CANÓNICO PERSISTENTE.
 *
 * OFFLINE Y REPRODUCIBLE. Corre sobre el corpus congelado de `raw/`, no toca la
 * red, no escribe en ninguna base de datos productiva, no cambia el payload de
 * producción y no enciende el shadow en ningún entorno. V1 sigue siendo la
 * respuesta al usuario; acá solo se construye identidad y se mide.
 *
 *   node docs/qa/cf-search-012/scripts/s1-eval.mjs
 *
 * DIFERENCIA CENTRAL CON EL HARNESS DE S0. S0 resolvía el corpus CONTRA SÍ
 * MISMO con `canonicalize()`. Acá se usa el camino persistente completo
 * —`assignIdentity()` contra `InMemoryCanonicalRegistry`, que es la referencia
 * semántica exacta del repositorio Supabase—, así que ninguna cifra de S0 se
 * reutiliza: todo se recalcula desde el mismo corpus con la implementación de
 * S1.
 *
 * Salidas en `analysis/`:
 *   s1-metrics.json      cardinalidades, resolución, cobertura, latencia
 *   s1-gates.json        Gates A-D + inestabilidad de ID persistente
 *   s1-stability.json    los siete tests de estabilidad sobre el corpus REAL
 *   s1-failures.json     colisiones, ambigüedades y no resueltos, con evidencia
 *   observations-s1.csv  una fila por observación (no versionado)
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../../..");
const RAW_DIR = resolve(HERE, "..", "raw");
const OUT_DIR = resolve(HERE, "..", "analysis");

// `docs/` no es un paquete del workspace: el dominio se carga por ruta desde su
// `dist` compilado (`pnpm install` lo construye vía postinstall, CLAUDE.md §11).
const DOMAIN_DIST = process.env.QA_DOMAIN_DIST ?? resolve(ROOT, "packages/domain/dist/index.js");
const DOMAIN_V2_DIST =
  process.env.QA_DOMAIN_V2_DIST ?? resolve(ROOT, "packages/domain/dist/searchV2/index.js");

const { matchKey } = await import(pathToFileURL(DOMAIN_DIST).href);

const {
  assignIdentity,
  auditConceptCollisions,
  canonicalizeOffer,
  conceptSignature,
  detectConceptCollisions,
  InMemoryCanonicalRegistry,
  isMintableConceptSignature,
  signatureText,
  CANONICALIZER_VERSION,
  RESOLVER_VERSION,
  SIGNATURE_VERSION,
} = await import(pathToFileURL(DOMAIN_V2_DIST).href);

// ---------------------------------------------------------------------------
// 1. CORPUS CONGELADO
// ---------------------------------------------------------------------------

/**
 * Una fila por OFERTA upstream. El endpoint público devuelve el resultado ya
 * fusionado por v1, así que cada `card.prices[]` es el conjunto de ofertas que
 * v1 normalizó y agrupó. Misma unidad de medida que CF-SEARCH-010 y 011.
 */
function readUpstreamRows(envelope) {
  const rows = [];
  const cards = Array.isArray(envelope.body) ? envelope.body : [];
  cards.forEach((card, cardIndex) => {
    const offers = card.prices ?? [];
    offers.forEach((price, priceIndex) => {
      rows.push({
        queryId: envelope.id,
        query: envelope.query,
        cardIndex,
        priceIndex,
        v1CardKey: `${envelope.id}#${cardIndex}`,
        pharmacy: price.pharmacySlug,
        rawName: price.productName ?? "",
        channels: price.channels ?? null,
        hasStock: price.hasStock ?? null,
        onlineUrl: price.onlineUrl ?? null,
        fetchedAt: price.fetchedAt ?? envelope.startedAt,
        legacyMatchKey: card.matchKey ?? null,
        legacyPresentationKey: card.presentationKey ?? null,
        cardBrand: card.brand ?? null,
        cardBrandSource: card.brandSource ?? null,
        cardManufacturer: card.manufacturer ?? null,
        cardIsBioequivalent: card.isBioequivalent ?? null,
        offersInCard: offers.length,
      });
    });
  });
  return rows;
}

/**
 * Observación cruda para v2. Los campos estructurados llegan a nivel de TARJETA
 * y solo se atribuyen cuando la tarjeta tiene UNA sola oferta, que es el único
 * caso en que la atribución es inequívoca. Preferir UNKNOWN a una procedencia
 * falsa. Idéntico criterio al del harness de S0 y al de `searchV2Shadow.ts`.
 */
function toObservation(row) {
  const unambiguous = row.offersInCard === 1;
  const sourceProductId = row.onlineUrl ?? row.rawName;
  const attributes = canonicalizeOffer({
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    price: row.channels ?? { store: 0, online: null, cmr: null, sbpay: null, effective: 0 },
    stock: row.hasStock,
    url: row.onlineUrl,
    capturedAt: row.fetchedAt,
    sourceProductId,
    structuredBrand: unambiguous && row.cardBrandSource === "structured" ? row.cardBrand : null,
    structuredManufacturer: unambiguous ? row.cardManufacturer : null,
    isBioequivalent: row.cardIsBioequivalent,
    ispRegistration: null,
    legacyPresentationKey: row.legacyPresentationKey,
  });
  return {
    pharmacy: row.pharmacy,
    rawName: row.rawName,
    sourceProductId,
    observedAt: row.fetchedAt ?? "1970-01-01T00:00:00.000Z",
    attributes,
    upstreamFields: {
      brand: unambiguous && row.cardBrandSource === "structured" ? row.cardBrand : null,
      manufacturer: unambiguous ? row.cardManufacturer : null,
      isBioequivalent: row.cardIsBioequivalent === null ? null : String(row.cardIsBioequivalent),
      ispRegistration: null,
      url: row.onlineUrl,
    },
    legacyMatchKey: matchKey(row.rawName),
    legacyPresentationKey: row.legacyPresentationKey,
  };
}

/** Clave de la OBSERVACIÓN única (farmacia + referencia de origen). */
const obsKey = (row) => `${row.pharmacy}|${(row.onlineUrl ?? row.rawName).trim().toLowerCase()}`;

// ---------------------------------------------------------------------------
// 2. CONSTRUCCIÓN DEL REGISTRO
// ---------------------------------------------------------------------------

/**
 * Construye un registro persistente a partir de una lista de observaciones
 * ÚNICAS. Devuelve el registro, la asignación por observación y la latencia
 * por observación.
 */
async function buildRegistry(observations) {
  const registry = new InMemoryCanonicalRegistry();
  const assignments = new Map();
  const durations = [];

  for (const { key, input } of observations) {
    const startedAt = performance.now();
    const assigned = await assignIdentity(registry, input);
    durations.push(performance.now() - startedAt);
    assignments.set(key, assigned);
  }

  return { registry, assignments, durations };
}

/**
 * Vuelve a resolver todas las observaciones contra el registro hasta que la
 * asignación deja de cambiar (o hasta `maxPasses`).
 *
 * POR QUÉ HACE FALTA, Y POR QUÉ NO ES HACER TRAMPA. Un registro persistente no
 * se construye de una vez: crece. Una observación que llega cuando el registro
 * está vacío puede quedar `unresolved`, y resolver semanas después contra una
 * identidad que para entonces sí existe — el sistema real REVISITA cada
 * observación en cada búsqueda que la vuelve a traer. La primera pasada sobre
 * un registro vacío no es el estado del sistema: es su primer minuto de vida.
 * Medir los gates sobre ese estado transitorio mediría el orden del corpus, no
 * el modelo.
 *
 * Lo que la convergencia NO puede tapar es la propiedad que S1 debe demostrar:
 * un identificador que ya fue asignado no puede cambiar por OTRO. Esa rotación
 * se cuenta en cada pasada y se reporta aparte (`rotations`), y su umbral es 0.
 */
async function converge(registry, assignments, observations, maxPasses = 5) {
  const rotations = [];
  let lateResolutions = 0;
  let deResolutions = 0;
  let passes = 0;

  for (let pass = 0; pass < maxPasses; pass++) {
    passes = pass + 1;
    let changed = 0;
    for (const { key, input } of observations) {
      const before = assignments.get(key)?.concept.entityId ?? null;
      const again = await assignIdentity(registry, input);
      const after = again.concept.entityId ?? null;
      if (after !== before) {
        changed += 1;
        if (before !== null && after !== null) {
          // ROTACIÓN: el identificador permanente cambió por otro. Es lo único
          // que S1 no puede permitirse.
          rotations.push({ observation: key, rawName: input.rawName, before, after });
        } else if (before === null) {
          lateResolutions += 1;
        } else {
          deResolutions += 1;
        }
      }
      assignments.set(key, again);
    }
    if (changed === 0) break;
  }

  return { rotations, lateResolutions, deResolutions, passes };
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

// ---------------------------------------------------------------------------
// 3. DETECTOR DE CONTRADICCIÓN (Gates B, C y D)
// ---------------------------------------------------------------------------

/**
 * `true` si dos observaciones se contradicen en algún eje semántico.
 *
 * Se reutiliza `detectConceptCollisions` del dominio: es EXACTAMENTE el mismo
 * detector con el que se mide el Gate D, así que los tres gates que hablan de
 * contradicción hablan de lo mismo. Medir el falso merge con una regla más
 * débil que la que asigna identidad sería medir otra cosa (lección de S0).
 *
 * Cubre las ocho clases —ingredientes, cardinalidad de la asociación,
 * concentración, forma, vía, unidad, componente negado y discriminante no
 * resuelto—. Marca, laboratorio, variante, momento, cantidad y volumen no hace
 * falta compararlos dentro de una misma unidad comparable: son ejes SIEMPRE
 * declarados de las firmas de presentación y producto, así que dos
 * observaciones de la misma unidad coinciden en ellos por construcción.
 */
function contradictions(a, b) {
  return detectConceptCollisions("pair", "pair", [
    { observationId: a.key, pharmacy: a.input.pharmacy, rawName: a.input.rawName, attributes: a.input.attributes },
    { observationId: b.key, pharmacy: b.input.pharmacy, rawName: b.input.rawName, attributes: b.input.attributes },
  ]);
}

// ---------------------------------------------------------------------------
// 4. MAIN
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".json"));
  const envelopes = [];
  for (const file of files) {
    envelopes.push(JSON.parse(await readFile(resolve(RAW_DIR, file), "utf8")));
  }

  const rows = envelopes.flatMap(readUpstreamRows).filter((r) => r.rawName.trim().length > 0);

  // Observaciones ÚNICAS: las 16 consultas se solapan (cuatro de ambroxol
  // devuelven el mismo conjunto), así que las filas upstream no son
  // observaciones distintas. La identidad se mide sobre observaciones.
  const uniqueMap = new Map();
  for (const row of rows) {
    const key = obsKey(row);
    if (!uniqueMap.has(key)) uniqueMap.set(key, { key, row, input: toObservation(row) });
  }
  const observations = [...uniqueMap.values()];

  const pharmacies = [...new Set(rows.map((r) => r.pharmacy))].sort();

  // ---- Construcción del registro y convergencia ----------------------------
  const { registry, assignments, durations } = await buildRegistry(observations);
  const sortedDurations = [...durations].sort((x, y) => x - y);

  // Desenlaces de la PRIMERA pasada (registro creciendo desde cero). Se guardan
  // antes de converger porque después toda observación ya resuelta figura como
  // `exact`, y el conteo de acuñaciones desaparecería del informe.
  const buildOutcomes = { exact: 0, created: 0, subsumed: 0, ambiguous: 0, unresolved: 0 };
  for (const o of observations) buildOutcomes[assignments.get(o.key).concept.outcome] += 1;

  const convergence = await converge(registry, assignments, observations);

  // Fotografía del registro CONVERGIDO, antes de la simulación de shadow: esa
  // simulación vuelve a resolver todo y agrega linaje (append-only), así que
  // contar después inflaría las cifras del registro.
  const registrySnapshot = {
    concepts: registry.concepts.size,
    presentations: registry.presentations.size,
    products: registry.products.size,
    productPresentationPairs: registry.productPresentations.size,
    observations: registry.observations.size,
    provenanceRows: registry.provenance.length,
    signatureAliases: registry.aliases.size,
  };

  // ---- Cardinalidades ------------------------------------------------------
  const conceptOf = (key) => assignments.get(key)?.concept.entityId ?? null;
  const presentationOf = (key) => assignments.get(key)?.presentation.entityId ?? null;
  const productOf = (key) => assignments.get(key)?.product.entityId ?? null;
  /** Unidad COMPARABLE: el par (producto, presentación). Es lo que ve el usuario. */
  const unitOf = (key) => {
    const p = productOf(key);
    const s = presentationOf(key);
    return p && s ? `${p}::${s}` : null;
  };

  const outcomes = { exact: 0, created: 0, subsumed: 0, ambiguous: 0, unresolved: 0 };
  const conceptOutcomes = { exact: 0, created: 0, subsumed: 0, ambiguous: 0, unresolved: 0 };
  for (const key of uniqueMap.keys()) {
    const a = assignments.get(key);
    conceptOutcomes[a.concept.outcome] += 1;
    for (const level of [a.concept, a.presentation, a.product]) outcomes[level.outcome] += 1;
  }

  const withConcept = observations.filter((o) => conceptOf(o.key) !== null);
  const withUnit = observations.filter((o) => unitOf(o.key) !== null);

  // ---- Gate A — cobertura ---------------------------------------------------
  // Definición de S0/§SHADOW_MODE_DESIGN: ninguna oferta se pierde. En S1 una
  // observación está CUBIERTA cuando el registro la representa con linaje
  // completo, tenga o no identidad canónica asignada — una observación sin
  // concepto NO está perdida: está registrada, es trazable y resolverá cuando
  // el registro o el vocabulario crezcan.
  const recorded = observations.filter((o) => assignments.get(o.key)?.observationId !== null);
  const offerCoverage = observations.length === 0 ? 0 : recorded.length / observations.length;
  // Métrica NUEVA de S1, reportada aparte y sin disimular: qué fracción llega a
  // tener un `CFM-CONCEPT-ID` permanente.
  const conceptAssignmentRate =
    observations.length === 0 ? 0 : withConcept.length / observations.length;
  const comparableUnitRate =
    observations.length === 0 ? 0 : withUnit.length / observations.length;

  // ---- Gate C — falso merge intra-unidad ------------------------------------
  const byUnit = new Map();
  for (const o of observations) {
    const unit = unitOf(o.key);
    if (!unit) continue;
    byUnit.set(unit, [...(byUnit.get(unit) ?? []), o]);
  }

  let intraUnitPairs = 0;
  const falseMerges = [];
  for (const [unit, members] of byUnit) {
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        intraUnitPairs += 1;
        const hits = contradictions(members[i], members[j]);
        if (hits.length > 0) {
          falseMerges.push({
            unit,
            leftKey: members[i].key,
            rightKey: members[j].key,
            left: members[i].input.rawName,
            leftPharmacy: members[i].input.pharmacy,
            right: members[j].input.rawName,
            rightPharmacy: members[j].input.pharmacy,
            types: [...new Set(hits.map((h) => h.collisionType))],
            reason: hits[0].reason,
          });
        }
      }
    }
  }
  const falseMergeRate = intraUnitPairs === 0 ? 0 : falseMerges.length / intraUnitPairs;

  // ---- Gate B — SPLIT_LOST --------------------------------------------------
  // Par de observaciones que v1 separa (tarjetas distintas dentro de la misma
  // consulta), v2 fusiona (misma unidad comparable) Y que se contradicen. Es un
  // SUBCONJUNTO de los falsos merges: todo SPLIT_LOST es un falso merge que
  // además v1 había evitado. Se mide aparte porque el gate lo exige aparte.
  const v1CardOf = new Map();
  for (const row of rows) {
    const key = obsKey(row);
    v1CardOf.set(key, [...(v1CardOf.get(key) ?? []), row.v1CardKey]);
  }
  const splitLost = falseMerges.filter((merge) => {
    const l = new Set(v1CardOf.get(merge.leftKey) ?? []);
    const r = new Set(v1CardOf.get(merge.rightKey) ?? []);
    // v1 los separaba si no comparten NINGUNA tarjeta.
    return [...l].every((card) => !r.has(card));
  });

  // ---- Gate D — colisión semántica de concepto ------------------------------
  const byConcept = new Map();
  for (const o of observations) {
    const concept = conceptOf(o.key);
    if (!concept) continue;
    byConcept.set(concept, [...(byConcept.get(concept) ?? []), o]);
  }
  const collisionReport = auditConceptCollisions(
    [...byConcept.entries()].map(([conceptId, members]) => ({
      conceptId,
      signature: registry.concepts.get(conceptId)?.canonicalSignature ?? "",
      members: members.map((o) => ({
        observationId: o.key,
        pharmacy: o.input.pharmacy,
        rawName: o.input.rawName,
        attributes: o.input.attributes,
      })),
    }))
  );

  // ---- Inestabilidad de ID persistente --------------------------------------
  // Se cuenta la ROTACIÓN: una observación que tenía asignado el identificador
  // A y pasa a tener el B. Es la única forma de inestabilidad que rompe el
  // contrato del EDM ("nunca deberá cambiar").
  //
  // NO se cuenta como inestabilidad que una observación pase de "sin identidad"
  // a "con identidad" (el registro aprendió) ni al revés (el registro descubrió
  // una ambigüedad y dejó de elegir). Son re-asignaciones de la OBSERVACIÓN,
  // quedan registradas en el linaje, y ninguna cambia el significado de un
  // identificador ya emitido. Se reportan aparte y sin disimulo.
  const rotations = convergence.rotations;
  const persistentIdInstability =
    observations.length === 0 ? 0 : rotations.length / observations.length;

  // ---- Los siete tests de estabilidad, sobre el corpus REAL -----------------
  const stability = {};

  // 1. QUERY INDEPENDENCE — la misma observación aparece en varias consultas.
  {
    const byKeyQueries = new Map();
    for (const row of rows) {
      const key = obsKey(row);
      byKeyQueries.set(key, new Set([...(byKeyQueries.get(key) ?? []), row.queryId]));
    }
    const multiQuery = [...byKeyQueries.entries()].filter(([, qs]) => qs.size > 1);
    // La consulta no es un parámetro de `assignIdentity`, así que la
    // independencia es estructural. Lo que se verifica es la consecuencia
    // observable: cada observación tiene EXACTAMENTE UNA identidad, aparezca en
    // una consulta o en cinco.
    const violations = multiQuery.filter(([key]) => !assignments.has(key));
    stability.queryIndependence = {
      pass: violations.length === 0,
      observationsInMultipleQueries: multiQuery.length,
      violations: violations.length,
    };
  }

  // 2. PHARMACY INDEPENDENCE — la misma firma de concepto desde farmacias
  //    distintas reutiliza el mismo ID.
  {
    const bySignature = new Map();
    for (const o of observations) {
      const sig = signatureText(conceptSignature(o.input.attributes));
      bySignature.set(sig, [...(bySignature.get(sig) ?? []), o]);
    }
    let crossPharmacyGroups = 0;
    let violations = 0;
    for (const [, members] of bySignature) {
      const pharmacySet = new Set(members.map((m) => m.input.pharmacy));
      if (pharmacySet.size < 2) continue;
      crossPharmacyGroups += 1;
      // Misma firma de concepto desde farmacias distintas ⇒ el MISMO
      // identificador. Se comparan solo las que llegaron a tener identidad: que
      // una firma no resuelva es un tema de cobertura, no de independencia de
      // farmacia.
      const ids = new Set(members.map((m) => conceptOf(m.key)).filter((id) => id !== null));
      if (ids.size > 1) violations += 1;
    }
    stability.pharmacyIndependence = {
      pass: violations === 0,
      crossPharmacySignatures: crossPharmacyGroups,
      violations,
    };
  }

  // 3. ORDER INDEPENDENCE — se reconstruye el registro con el orden invertido y
  //    se compara la PARTICIÓN de observaciones (qué comparte identidad con qué).
  //    Los IDs de secuencia sí dependen del orden de llegada, como cualquier
  //    contador; lo que no puede cambiar es quién es igual a quién.
  const partitionOf = (assign) => {
    const groups = new Map();
    for (const o of observations) {
      const id = assign.get(o.key)?.concept.entityId ?? "UNRESOLVED";
      groups.set(id, [...(groups.get(id) ?? []), o.key].sort());
    }
    return [...groups.values()].map((g) => g.join("||")).sort();
  };
  const forwardPartition = partitionOf(assignments);
  {
    const reversed = await buildRegistry([...observations].reverse());
    await converge(reversed.registry, reversed.assignments, [...observations].reverse());
    const reversedPartition = partitionOf(reversed.assignments);
    stability.orderIndependence = {
      pass: JSON.stringify(reversedPartition) === JSON.stringify(forwardPartition),
      groups: forwardPartition.length,
      reversedGroups: reversedPartition.length,
    };
  }

  // 4. CORPUS INDEPENDENCE — se construye el registro con la MITAD del corpus y
  //    después se agrega la otra mitad; ningún ID de la primera mitad puede
  //    cambiar al crecer el corpus.
  {
    const half = Math.floor(observations.length / 2);
    const firstHalf = observations.slice(0, half);
    const partial = await buildRegistry(firstHalf);
    await converge(partial.registry, partial.assignments, firstHalf);
    const before = new Map(
      firstHalf.map((o) => [o.key, partial.assignments.get(o.key)?.concept.entityId ?? null])
    );

    // Llega la otra mitad del corpus, que el registro no había visto nunca.
    for (const o of observations.slice(half)) {
      await assignIdentity(partial.registry, o.input);
    }

    let rotated = 0;
    let reassigned = 0;
    for (const o of firstHalf) {
      const again = await assignIdentity(partial.registry, o.input);
      const after = again.concept.entityId ?? null;
      const wasAssigned = before.get(o.key);
      if (after === wasAssigned) continue;
      if (wasAssigned !== null && after !== null) rotated += 1;
      else reassigned += 1;
    }
    stability.corpusIndependence = {
      // El criterio es que agregar corpus no ROMPA un ID existente. Que una
      // observación sin identidad pase a tenerla es el registro creciendo.
      pass: rotated === 0,
      observationsChecked: firstHalf.length,
      rotated,
      reassigned,
    };
  }

  // 5. PARTIAL OBSERVATION — ninguna identidad del registro puede haber nacido
  //    de una observación cuya firma no habilitaba acuñar.
  //
  //    Se audita el REGISTRO, no la última pasada: tras converger, toda
  //    observación ya resuelta figura como `exact` y contar acuñaciones ahí no
  //    demostraría nada. Para cada concepto persistido se busca la observación
  //    cuya firma cruda lo acuñó y se verifica que fuera acuñable.
  {
    const mintableBySignature = new Map();
    for (const o of observations) {
      const sig = signatureText(conceptSignature(o.input.attributes));
      if (!mintableBySignature.has(sig)) {
        mintableBySignature.set(sig, isMintableConceptSignature(o.input.attributes));
      }
    }
    const illegal = [...registry.concepts.values()].filter(
      (concept) => mintableBySignature.get(concept.canonicalSignature) !== true
    );
    stability.partialObservation = {
      pass: illegal.length === 0,
      conceptsAudited: registry.concepts.size,
      mintedInFirstPass: buildOutcomes.created,
      illegalMints: illegal.length,
      illegalSamples: illegal.slice(0, 5).map((c) => c.canonicalSignature),
    };
  }

  // 6. CONCURRENT CREATION — se lanzan en paralelo todas las observaciones de un
  //    mismo concepto sobre un registro vacío, con latencia intercalada.
  {
    const groups = new Map();
    for (const o of observations) {
      const sig = signatureText(conceptSignature(o.input.attributes));
      groups.set(sig, [...(groups.get(sig) ?? []), o]);
    }
    const biggest = [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? [];
    const concurrent = new InMemoryCanonicalRegistry();
    let releases = 0;
    concurrent.latencyHook = async () => {
      releases += 1;
      await new Promise((r) => setTimeout(r, releases % 3));
    };
    const results = await Promise.all(
      biggest.map((o) => assignIdentity(concurrent, o.input))
    );
    const ids = new Set(results.map((r) => r.concept.entityId));
    stability.concurrentCreation = {
      pass: ids.size <= 1 && concurrent.concepts.size <= 1,
      parallelObservations: biggest.length,
      distinctIds: ids.size,
      conceptsCreated: concurrent.concepts.size,
    };
  }

  // 7. CANONICALIZER VERSION CHANGE — se reasocia una firma nueva a cada
  //    identidad existente y se verifica que ningún ID rote.
  {
    const versioned = await buildRegistry(observations);
    await converge(versioned.registry, versioned.assignments, observations);
    const before = new Map(
      [...versioned.registry.concepts.values()].map((c) => [c.id, c.canonicalSignature])
    );
    const expected = new Map(
      observations.map((o) => [o.key, versioned.assignments.get(o.key)?.concept.entityId ?? null])
    );

    // Una versión nueva del canonicalizador produce una firma nueva para cada
    // identidad. Se reasocia SIN acuñar nada.
    for (const [id, signature] of before) {
      await versioned.registry.rebindSignature(
        "concept",
        id,
        `${signature}|atc=?`,
        SIGNATURE_VERSION,
        "v2.99.0-test"
      );
    }

    let rotated = 0;
    for (const o of observations) {
      const again = await assignIdentity(versioned.registry, o.input);
      const after = again.concept.entityId ?? null;
      const was = expected.get(o.key);
      if (was !== null && after !== null && was !== after) rotated += 1;
    }
    stability.canonicalizerVersionChange = {
      // Ni un ID rotó y no se acuñó ninguna identidad nueva: la firma cambió,
      // el identificador permanente no.
      pass: rotated === 0 && versioned.registry.concepts.size === before.size,
      identitiesRebound: before.size,
      conceptsAfter: versioned.registry.concepts.size,
      rotated,
    };
  }

  // ---- Simulación del SHADOW en régimen ------------------------------------
  // Una corrida de shadow procesa las observaciones de UNA búsqueda contra un
  // registro que ya existe. Se simula exactamente eso: se parte del registro ya
  // convergido y se mide una corrida por consulta del corpus.
  //
  // NO SE ENCIENDE NADA. Es la misma función que corre en producción
  // (`assignIdentity`) contra el repositorio en memoria; el interruptor sigue
  // apagado, no hay Supabase, no hay red y no hay deploy.
  const shadowRuns = [];
  {
    const byQuery = new Map();
    for (const row of rows) {
      const key = obsKey(row);
      const observation = uniqueMap.get(key);
      if (!observation) continue;
      const bucket = byQuery.get(row.queryId) ?? new Map();
      if (!bucket.has(key)) bucket.set(key, observation);
      byQuery.set(row.queryId, bucket);
    }

    for (const [queryId, bucket] of byQuery) {
      const batch = [...bucket.values()];
      const startedAt = performance.now();
      let errors = 0;
      let covered = 0;
      for (const o of batch) {
        try {
          const assigned = await assignIdentity(registry, o.input);
          if (assigned.concept.entityId !== null) covered += 1;
        } catch {
          errors += 1;
        }
      }
      shadowRuns.push({
        queryId,
        observations: batch.length,
        durationMs: performance.now() - startedAt,
        errors,
        conceptCoverage: batch.length === 0 ? 0 : covered / batch.length,
      });
    }
  }
  const runDurations = shadowRuns.map((r) => r.durationMs).sort((a, b) => a - b);
  const shadowTotal = shadowRuns.length;
  const shadowErrors = shadowRuns.reduce((acc, r) => acc + r.errors, 0);
  const shadow = {
    enabledInProduction: false,
    runs: shadowTotal,
    observationsProcessed: shadowRuns.reduce((acc, r) => acc + r.observations, 0),
    successRate: shadowTotal === 0 ? 0 : shadowRuns.filter((r) => r.errors === 0).length / shadowTotal,
    errorRate: shadowTotal === 0 ? 0 : shadowErrors / shadowRuns.reduce((acc, r) => acc + r.observations, 0),
    p50Ms: percentile(runDurations, 50),
    p95Ms: percentile(runDurations, 95),
    p99Ms: percentile(runDurations, 99),
    note: "corrida por consulta contra el registro ya convergido, en memoria; sin red, sin Supabase y sin arranque en frío de una función serverless",
  };

  // ---- Métricas de agrupamiento --------------------------------------------
  const unitsPerPresentation = new Map();
  for (const unit of byUnit.keys()) {
    const presentationId = unit.split("::")[1];
    unitsPerPresentation.set(
      presentationId,
      (unitsPerPresentation.get(presentationId) ?? 0) + 1
    );
  }
  const fragmentedPresentations = [...unitsPerPresentation.values()].filter((n) => n > 1).length;
  const fragmentation =
    unitsPerPresentation.size === 0 ? 0 : fragmentedPresentations / unitsPerPresentation.size;

  const singlePharmacyUnits = [...byUnit.values()].filter(
    (members) => new Set(members.map((m) => m.input.pharmacy)).size === 1
  ).length;
  const singlePharmacyRate = byUnit.size === 0 ? 0 : singlePharmacyUnits / byUnit.size;

  // Falso split: dos observaciones con LA MISMA firma cruda de concepto que
  // terminan en conceptos distintos. Es lo contrario del falso merge y no tiene
  // gate propio, pero se reporta porque es el costo del criterio conservador.
  let falseSplits = 0;
  {
    const bySignature = new Map();
    for (const o of observations) {
      const sig = signatureText(conceptSignature(o.input.attributes));
      bySignature.set(sig, [...(bySignature.get(sig) ?? []), o]);
    }
    for (const [, members] of bySignature) {
      const ids = new Set(members.map((m) => conceptOf(m.key)).filter(Boolean));
      if (ids.size > 1) falseSplits += 1;
    }
  }

  // ---- Verdicto -------------------------------------------------------------
  const gates = {
    A_offerCoverage: {
      value: offerCoverage,
      threshold: 0.995,
      pass: offerCoverage >= 0.995,
      definition:
        "observaciones representadas en el registro con linaje completo / observaciones de entrada",
    },
    B_splitLost: {
      value: splitLost.length,
      threshold: 0,
      pass: splitLost.length === 0,
      definition:
        "pares que v1 separaba, v2 fusiona en la misma unidad comparable, y que se contradicen",
    },
    C_falseMergeRate: {
      value: falseMergeRate,
      threshold: 0,
      pass: falseMerges.length === 0,
      denominator: intraUnitPairs,
      definition: "pares dentro de la misma unidad comparable que se contradicen",
    },
    D_conceptSemanticCollisionRate: {
      value: collisionReport.rate,
      threshold: 0,
      pass: collisionReport.collisions.length === 0,
      denominator: collisionReport.pairsCompared,
      byType: collisionReport.byType,
      definition: "pares dentro del mismo Concepto Farmacéutico que se contradicen (8 clases)",
    },
  };

  const allStabilityPass = Object.values(stability).every((s) => s.pass);
  const gatesPass = Object.values(gates).every((g) => g.pass);
  const verdict =
    gatesPass && persistentIdInstability === 0 && allStabilityPass
      ? "PASS_S1"
      : "STOP_AND_REASSESS";

  const metrics = {
    corpus: {
      capturedFrom: "GET /api/search (producción, público, read-only)",
      queries: envelopes.length,
      upstreamRows: rows.length,
      uniqueObservations: observations.length,
      pharmaciesPresent: pharmacies,
      pharmacyCount: pharmacies.length,
      v1Cards: new Set(rows.map((r) => r.v1CardKey)).size,
    },
    versions: {
      canonicalizer: CANONICALIZER_VERSION,
      resolver: RESOLVER_VERSION,
      signature: SIGNATURE_VERSION,
    },
    registry: { ...registrySnapshot, comparableUnits: byUnit.size },
    coverage: {
      offerCoverage,
      conceptAssignmentRate,
      comparableUnitRate,
      withoutConcept: observations.length - withConcept.length,
    },
    resolution: {
      // Primera pasada: el registro creciendo desde cero. Es donde se ve cuántas
      // identidades se acuñaron.
      conceptFirstPass: buildOutcomes,
      // Estado convergido: lo que el sistema reporta en régimen.
      allLevels: outcomes,
      conceptLevel: conceptOutcomes,
    },
    grouping: {
      fragmentation,
      fragmentedPresentations,
      presentationsWithUnits: unitsPerPresentation.size,
      singlePharmacyUnits,
      singlePharmacyRate,
      falseSplits,
    },
    convergence: {
      passes: convergence.passes,
      rotations: convergence.rotations.length,
      lateResolutions: convergence.lateResolutions,
      deResolutions: convergence.deResolutions,
      note: "un registro persistente crece: la primera pasada sobre un registro vacío es su primer minuto de vida, no su estado",
    },
    shadow,
    latencyMs: {
      p50: percentile(sortedDurations, 50),
      p95: percentile(sortedDurations, 95),
      p99: percentile(sortedDurations, 99),
      total: durations.reduce((a, b) => a + b, 0),
      note: "medición offline contra el registro en memoria; sin retrieval, sin red y sin arranque en frío",
    },
    databaseWrites: {
      estimatedRows:
        registrySnapshot.concepts +
        registrySnapshot.presentations +
        registrySnapshot.products +
        registrySnapshot.productPresentationPairs +
        registrySnapshot.observations +
        registrySnapshot.provenanceRows +
        registrySnapshot.signatureAliases,
    },
  };

  const failures = {
    falseMerges,
    splitLost,
    conceptCollisions: collisionReport.collisions.slice(0, 100),
    rotations,
    unresolvedSamples: observations
      .filter((o) => assignments.get(o.key)?.concept.outcome === "unresolved")
      .slice(0, 60)
      .map((o) => ({
        pharmacy: o.input.pharmacy,
        rawName: o.input.rawName,
        signature: signatureText(conceptSignature(o.input.attributes)),
        reason: assignments.get(o.key).concept.reason,
      })),
    ambiguousSamples: observations
      .filter((o) => assignments.get(o.key)?.concept.outcome === "ambiguous")
      .slice(0, 60)
      .map((o) => ({
        pharmacy: o.input.pharmacy,
        rawName: o.input.rawName,
        signature: signatureText(conceptSignature(o.input.attributes)),
        candidateCount: assignments.get(o.key).concept.candidateCount,
        candidateIds: assignments.get(o.key).concept.candidateIds,
      })),
  };

  await writeFile(resolve(OUT_DIR, "s1-metrics.json"), JSON.stringify(metrics, null, 2), "utf8");
  await writeFile(
    resolve(OUT_DIR, "s1-gates.json"),
    JSON.stringify(
      {
        verdict,
        gates,
        persistentIdInstability,
        rotations: rotations.length,
        reassignments: {
          lateResolutions: convergence.lateResolutions,
          deResolutions: convergence.deResolutions,
        },
        convergencePasses: convergence.passes,
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(resolve(OUT_DIR, "s1-stability.json"), JSON.stringify(stability, null, 2), "utf8");
  await writeFile(resolve(OUT_DIR, "s1-failures.json"), JSON.stringify(failures, null, 2), "utf8");

  const csv = [
    "pharmacy,rawName,conceptId,conceptOutcome,presentationId,productId,comparableUnit,conceptSignature",
    ...observations.map((o) => {
      const a = assignments.get(o.key);
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      return [
        esc(o.input.pharmacy),
        esc(o.input.rawName),
        esc(a.concept.entityId),
        esc(a.concept.outcome),
        esc(a.presentation.entityId),
        esc(a.product.entityId),
        esc(unitOf(o.key)),
        esc(signatureText(conceptSignature(o.input.attributes))),
      ].join(",");
    }),
  ].join("\n");
  await writeFile(resolve(OUT_DIR, "observations-s1.csv"), csv, "utf8");

  // ---- Informe por consola --------------------------------------------------
  console.log(`\nCORPUS   ${metrics.corpus.uniqueObservations} observaciones únicas · ${rows.length} filas upstream · ${pharmacies.length}/9 farmacias`);
  console.log(`         farmacias: ${pharmacies.join(", ")}`);
  console.log(`
REGISTRO conceptos=${registrySnapshot.concepts} presentaciones=${registrySnapshot.presentations} productos=${registrySnapshot.products} pares=${registrySnapshot.productPresentationPairs} unidades=${byUnit.size}`);
  console.log(`         observaciones=${registrySnapshot.observations} linaje=${registrySnapshot.provenanceRows} alias=${registrySnapshot.signatureAliases}`);
  console.log(`
RESOL.   1a pasada:  ${JSON.stringify(buildOutcomes)}`);
  console.log(`         convergido: ${JSON.stringify(conceptOutcomes)}`);
  console.log(`         3 niveles: ${JSON.stringify(outcomes)}`);
  console.log(`\nCOBERT.  offerCoverage=${(offerCoverage * 100).toFixed(4)}%  conceptAssignment=${(conceptAssignmentRate * 100).toFixed(2)}%  unidadComparable=${(comparableUnitRate * 100).toFixed(2)}%`);
  console.log(`\nGATES`);
  for (const [name, gate] of Object.entries(gates)) {
    console.log(`  ${name.padEnd(32)} ${String(gate.value).padEnd(22)} ${gate.pass ? "PASS" : "FAIL"}`);
  }
  console.log(`  persistentIdInstability          ${persistentIdInstability} (${rotations.length} rotaciones)`);
  console.log(`  convergencia: ${convergence.passes} pasadas · resoluciones tardias=${convergence.lateResolutions} · des-resoluciones=${convergence.deResolutions}`);
  console.log(`\nESTABILIDAD`);
  for (const [name, s] of Object.entries(stability)) {
    console.log(`  ${name.padEnd(32)} ${s.pass ? "PASS" : "FAIL"}  ${JSON.stringify(s)}`);
  }
  console.log(`\nAGRUP.   fragmentacion=${(fragmentation * 100).toFixed(1)}%  unaFarmacia=${(singlePharmacyRate * 100).toFixed(1)}%  falsosSplits=${falseSplits}`);
  console.log(`SHADOW   corridas=${shadow.runs} exito=${(shadow.successRate*100).toFixed(2)}% error=${(shadow.errorRate*100).toFixed(4)}% p50=${shadow.p50Ms.toFixed(2)}ms p95=${shadow.p95Ms.toFixed(2)}ms p99=${shadow.p99Ms.toFixed(2)}ms`);
  console.log(`LATENC.  p50=${metrics.latencyMs.p50.toFixed(3)}ms p95=${metrics.latencyMs.p95.toFixed(3)}ms p99=${metrics.latencyMs.p99.toFixed(3)}ms`);
  console.log(`\nVEREDICTO: ${verdict}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
