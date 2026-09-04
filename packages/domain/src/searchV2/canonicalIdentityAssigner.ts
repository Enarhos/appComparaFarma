/**
 * Search Engine v2 — IDENTITY ASSIGNMENT contra el registro persistido
 * (CF-SEARCH-012, S1).
 *
 * Tercera y última responsabilidad: acuñar o reutilizar un identificador
 * PERMANENTE. Es la única pieza que escribe, y la única que necesita el
 * repositorio.
 *
 *     canonicalizeOffer()   texto libre → atributos      (puro, S0, sin cambios)
 *            ↓
 *     firmas del registro   atributos → firma por nivel  (puro, este módulo)
 *            ↓
 *     resolveAgainstRegistry()  firma vs registro        (puro, canonicalResolver)
 *            ↓
 *     assignIdentity()      acuñar o reutilizar          (escribe, este módulo)
 *
 * ---------------------------------------------------------------------------
 * FIRMAS DEL REGISTRO — POR QUÉ NO SE REUTILIZA `productSignature()` DE S0
 * ---------------------------------------------------------------------------
 * La firma de CONCEPTO y la de PRESENTACIÓN se reutilizan literalmente de S0
 * (`conceptSignature`, `presentationSignature`): sus ejes ya son los del EDM y
 * están medidos. Lo único que cambia es que el argumento de anclaje pasa a ser
 * el ID PERMANENTE en vez de la clave `PROV-*`.
 *
 * La de PRODUCTO **no** se reutiliza, y no es una preferencia estética. En S0 el
 * producto se ancla a la PRESENTACIÓN, así que "Tapsin 500 mg del Lab. Maver en
 * caja de 16" y "…en caja de 30" son dos productos comerciales distintos. El EDM
 * define el Producto Medicinal Comercial por *Marca Comercial, Laboratorio,
 * Registro ISP, Estado y Condición de Bioequivalencia* — la presentación no es
 * una de sus propiedades— y declara que un Concepto se relaciona directamente
 * con *"múltiples Productos Medicinales Comerciales"*. Son el mismo producto en
 * dos presentaciones.
 *
 * Por eso acá el producto se ancla al CONCEPTO, y el par comparable
 * `(producto, presentación)` se materializa en su propia relación N:M. La
 * partición de OFERTAS que induce el par es la misma que inducía la clave de
 * producto de S0 —lo que hace las métricas comparables— pero el conteo de
 * PRODUCTOS pasa a significar lo que el EDM dice que significa.
 *
 * Ningún archivo de S0 cambia de conducta: `canonicalize()` y su
 * `productSignature()` quedan intactos y sus tests siguen verdes sin tocarlos.
 *
 * ---------------------------------------------------------------------------
 * ORDEN DE RESOLUCIÓN Y SU CONSECUENCIA
 * ---------------------------------------------------------------------------
 * Presentación y producto se anclan al concepto. Si el concepto no se resuelve
 * (`ambiguous` / `unresolved`), los otros dos niveles **no se inventan**: se
 * reportan `unresolved` con el motivo explícito. Una presentación sin concepto
 * no es una presentación de nada.
 */

import type { PharmacySlug } from "../types.js";
import { signatureText, type Signature } from "./canonicalIdentity.js";
import {
  conceptSignature,
  presentationSignature,
} from "./canonicalize.js";
import { concentrationSignature } from "./canonicalConcentration.js";
import { normalizeBrandToken } from "../commercialIdentity.js";
import {
  isCompleteSignature,
  resolveAgainstRegistry,
} from "./canonicalResolver.js";
import type { CanonicalAttributes } from "./canonicalTypes.js";
import {
  CANONICALIZER_VERSION,
  RESOLVER_VERSION,
  SIGNATURE_VERSION,
  type AssignedIdentity,
  type CanonicalRegistryRepository,
  type CanonicalResolutionRecord,
  type ObservationInput,
  type RegistryResolution,
} from "./registryTypes.js";

const UNKNOWN_SEGMENT = "?";

// ---------------------------------------------------------------------------
// A. FIRMA DEL PRODUCTO, ANCLADA AL CONCEPTO
// ---------------------------------------------------------------------------

/**
 * Firma del Producto Medicinal Comercial: concepto + registro ISP + marca +
 * variante comercial + momento de administración + laboratorio.
 *
 * Mismos ejes comerciales que S0 y con la misma política, que se conserva
 * palabra por palabra porque fue una corrección medida, no una precaución
 * abstracta:
 *
 *   · AUSENCIA DE MARCA = producto "no identificado", NO comodín. `unbranded`,
 *     `none` y `unidentified` son VALORES declarados y no subsumibles. Cuando la
 *     marca era subsumible, sobre el corpus de S0 un genérico de ambroxol con el
 *     nombre truncado quedó absorbido dentro de "Muxol Jarabe Pediátrico" y la
 *     diferencia de precio se mostraba como ahorro.
 *   · LA VARIANTE COMERCIAL TAMPOCO ES SUBSUMIBLE. Tapsin Rojo, Forte, Día,
 *     Noche, Duo y Migraña tienen composiciones distintas.
 *   · EL REGISTRO ISP es el único eje subsumible del nivel. Hoy vale `?` en todo
 *     el corpus (CF-DATA-005 / #156 todavía no lo captura) y por lo tanto no
 *     discrimina. **No se usa como fuente de verdad canónica**: mientras #157
 *     siga abierto, el ISP es evidencia adicional, nunca la identidad.
 *
 * Único cambio respecto de S0: el eje de anclaje es `concept`, no `presentation`.
 */
export function registryProductSignature(
  conceptId: string,
  attributes: CanonicalAttributes
): Signature {
  const brandToken = attributes.brand === null ? null : normalizeBrandToken(attributes.brand);
  const manufacturerToken =
    attributes.manufacturer === null ? null : normalizeBrandToken(attributes.manufacturer);

  return {
    axes: [
      { name: "concept", segment: conceptId, known: true },
      {
        name: "isp",
        segment: attributes.ispRegistration ?? UNKNOWN_SEGMENT,
        known: attributes.ispRegistration !== null,
      },
      {
        name: "brand",
        segment: brandToken && brandToken.length > 0 ? brandToken : "unbranded",
        known: true,
      },
      { name: "variant", segment: attributes.commercialVariant ?? "none", known: true },
      { name: "time", segment: attributes.administrationTime ?? "none", known: true },
      {
        name: "manufacturer",
        segment:
          manufacturerToken && manufacturerToken.length > 0 ? manufacturerToken : "unidentified",
        known: true,
      },
    ],
  };
}

/**
 * Identidad de la OBSERVACIÓN: farmacia + referencia de origen. No incluye
 * nombre, precio, stock ni instante — una observación no deja de ser la misma
 * porque cambie su precio, ni porque la farmacia corrija una errata del título.
 *
 * Es lo que hace que `recordObservationResolution` sea idempotente: la misma
 * ficha de la misma farmacia actualiza su fila, no crea una nueva cada día.
 */
export function observationKey(pharmacy: PharmacySlug, sourceProductId: string): string {
  return `${pharmacy}|${sourceProductId.trim().toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// B. CLAVES DE BÚSQUEDA (prefiltro del repositorio)
// ---------------------------------------------------------------------------

/**
 * Claves de bucket de una firma de CONCEPTO: el prefiltro barato que permite a
 * una implementación SQL traer candidatos sin escanear el registro entero.
 *
 * FUNDAMENTO, no heurística. Para que una identidad hospede a una firma parcial,
 * ningún eje puede contradecirse. Dos ejes permiten un prefiltro exacto:
 *
 *   · `ing` — si la observación nombra la molécula `a`, toda anfitriona posible
 *     debe contener `a` (`compareIngredients` exige contención del conjunto
 *     débil en el fuerte). Se emite una clave POR MOLÉCULA, no una sola: la
 *     anfitriona `{a,b}` y la observación parcial `{b}` solo se encuentran si
 *     ambas publican `ing:b`.
 *   · `disc` — está SIEMPRE declarado (`none` cuando el concepto sí tiene
 *     principios activos), así que dos valores distintos son incompatibles y el
 *     prefiltro es exacto.
 *
 * Devuelve `[]` cuando la firma no declara ni molécula ni discriminante. Es el
 * caso en que ninguna clave es selectiva; cada implementación decide, y las dos
 * decisiones son seguras:
 *   · `InMemoryCanonicalRegistry` escanea (semántica EXACTA — es la que mide los
 *     gates);
 *   · la implementación Supabase devuelve `[]`, lo que produce `unresolved`. Es
 *     conservador por construcción: `unresolved` no acuña identidad, no fusiona
 *     nada y no puede introducir un falso merge. La diferencia entre ambas está
 *     medida y reportada en `docs/qa/cf-search-012/S1_METRICS.md`.
 */
export function conceptBucketKeys(signature: string): string[] {
  const keys: string[] = [];
  for (const part of signature.split("|")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index);
    const segment = part.slice(index + 1);

    if (name === "ing") {
      for (const token of segment.split("+")) {
        // `?` y `?2` son "no lo sé" / "hay más de los que puedo nombrar", no
        // moléculas: no generan clave.
        if (token.length === 0 || token.startsWith(UNKNOWN_SEGMENT)) continue;
        keys.push(`ing:${token}`);
      }
    } else if (name === "disc" && segment !== "none" && segment !== UNKNOWN_SEGMENT) {
      keys.push(`disc:${segment}`);
    }
  }
  return [...new Set(keys)].sort();
}

// ---------------------------------------------------------------------------
// B-bis. QUÉ FIRMA HABILITA ACUÑAR UN `CFM-CONCEPT-ID`
// ---------------------------------------------------------------------------

/**
 * Formas farmacéuticas SIN unidad farmacéutica discreta.
 *
 * Un jarabe, una crema o un colirio no se cuentan en unidades: son un volumen o
 * una masa continua dentro de un envase. El EDM enumera la Unidad Farmacéutica
 * con ejemplos discretos ("comprimido, cápsula, ampolla, frasco, sobre") y para
 * estas formas ningún nombre del catálogo declara ninguno — no porque la
 * farmacia lo omita, sino porque no existe.
 *
 * Es el MISMO criterio, y por el mismo motivo, que S0 ya aplica en
 * `FORMS_WITHOUT_PACKAGE_VOLUME` (`canonicalize.ts`): una ausencia DERIVADA de
 * una forma DECLARADA es evidencia, no un dato faltante. La derivación parte de
 * algo que el nombre sí dice, así que no viola la regla de honestidad — no se
 * infiere nada sobre datos ausentes.
 *
 * Las formas que SÍ tienen unidad discreta (`comprimido`, `capsula`,
 * `supositorio`, `ovulo`, `parche`, `inyectable`) NO están acá: en ellas, un
 * `unit` sin declarar es desconocimiento real y bloquea la acuñación.
 */
const FORMS_WITHOUT_PHARMACEUTICAL_UNIT: ReadonlySet<string> = new Set([
  "liquido-oral",
  "crema",
  "gel",
  "pomada",
  "locion",
  "shampoo",
  "inhalador",
  "colirio",
  "gotas-oticas",
]);

/**
 * Formas en las que una MASA ABSOLUTA es la concentración COMPLETA.
 *
 * En un comprimido, "500 mg" no es una lectura parcial de nada: es la potencia
 * del comprimido, y no existe una razón masa/volumen que la complete. En un
 * jarabe, en cambio, "30 mg" SÍ es parcial —la concentración real es
 * `30 mg/5 mL`— y S0 ya la tipa como `mass-only`, evidencia intermedia.
 *
 * Cremas y geles quedan FUERA a propósito. Su concentración se declara en
 * porcentaje ("Diclofenaco **1 %** Crema 30 g") y el lector de S0 no la
 * modela: toma la primera masa del nombre, que en esos nombres es el PESO DEL
 * ENVASE (30 g). Acuñar una identidad permanente desde ese dato sería fijar
 * como concentración el tamaño del tubo. Se reporta como defecto conocido en
 * `docs/qa/cf-search-012/S1_FAILURES.md`; corregir el lector es trabajo de v2
 * posterior y no se hace acá porque cambiaría la conducta de S0.
 */
const FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION: ReadonlySet<string> = new Set([
  "comprimido",
  "capsula",
  "supositorio",
  "ovulo",
  "parche",
]);

/**
 * `true` si la observación puede ACUÑAR un `CFM-CONCEPT-ID` permanente.
 *
 * Acuñar es crear una identidad CIENTÍFICA que no debe cambiar nunca. La regla
 * base es la de S0 —firma completa— con dos matices, y los dos derivan de la
 * FORMA FARMACÉUTICA DECLARADA, nunca de una inferencia sobre datos ausentes:
 *
 *   · `unit` sin declarar NO bloquea cuando la forma no tiene unidad discreta
 *     (un jarabe no se cuenta en unidades). Es el mismo criterio que
 *     `FORMS_WITHOUT_PACKAGE_VOLUME` de S0.
 *
 *   · `conc` en `mass-only` SÍ bloquea, salvo en las formas donde una masa
 *     absoluta ES la concentración completa. Sin este matiz, "Ambroxol 30 mg
 *     Jarabe 100 ml" acuñaría un Concepto Farmacéutico propio, permanente y
 *     distinto del de "Ambroxol 30 mg/5 mL Jarabe", que casi con seguridad es
 *     el mismo medicamento: un falso split grabado en piedra. Con él, la
 *     observación queda `unresolved` —registrada y trazable, sin identidad—
 *     hasta que una fuente declare la razón.
 *
 * NO hay excepción para `ing`, y es deliberado: acuñar una identidad
 * permanente para "no sé qué molécula es esto" sería crear conocimiento
 * científico donde no lo hay. Es la restricción que más pesa sobre las cifras
 * de S1 y está reportada como tal, no disimulada.
 */
export function isMintableConceptSignature(attributes: CanonicalAttributes): boolean {
  const form = attributes.canonicalDosageForm;
  if (form === null) return false;

  // Concentración: ausente nunca acuña; masa absoluta solo en las formas donde
  // es la concentración completa.
  if (attributes.concentration.kind === "absent") return false;
  if (
    attributes.concentration.kind === "mass-only" &&
    !FORMS_WITH_ABSOLUTE_MASS_CONCENTRATION.has(form)
  ) {
    return false;
  }

  const signature = conceptSignature(attributes);
  const missing = signature.axes
    .filter((axis) => !axis.known)
    .map((axis) => axis.name)
    // `conc` ya se evaluó arriba con su semántica de tres niveles.
    .filter((name) => name !== "conc");

  if (missing.length === 0) return true;
  if (!FORMS_WITHOUT_PHARMACEUTICAL_UNIT.has(form)) return false;
  return missing.length === 1 && missing[0] === "unit";
}

/**
 * `true` si la observación puede ACUÑAR un `CFM-PRODUCT-ID` permanente.
 *
 * Todos los ejes comerciales —marca, variante, momento, laboratorio— están
 * SIEMPRE declarados por construcción: su ausencia es un VALOR (`unbranded`,
 * `none`, `unidentified`), no un desconocimiento, y esa decisión de S0 se
 * conserva sin cambios. El único eje que puede quedar sin declarar es `isp`.
 *
 * EXIGIR EL ISP PARA ACUÑAR HARÍA EL NIVEL DE PRODUCTO INOPERANTE, y sería
 * además contrario a la decisión vigente. Ningún adaptador captura el registro
 * sanitario todavía (CF-DATA-005 / #156 es independiente), de modo que el eje
 * vale `?` en el 100 % del corpus; y ADR-0005 declara la fuente ISP **en
 * revisión**, no fuente de verdad, mientras el issue #157 siga abierto. Un
 * Producto Medicinal Comercial queda identificado por su concepto, su marca, su
 * variante y su laboratorio; el registro sanitario es EVIDENCIA adicional —el
 * eje más fuerte cuando exista— y no un requisito de existencia.
 */
export function isMintableProductSignature(signature: Signature): boolean {
  const missing = signature.axes.filter((axis) => !axis.known).map((axis) => axis.name);
  if (missing.length === 0) return true;
  return missing.length === 1 && missing[0] === "isp";
}

/**
 * `true` si la observación puede ACUÑAR un `CFM-PRESENTATION-ID` permanente.
 *
 * Sin excepciones: una presentación que no declara ni cuántas unidades trae ni
 * qué volumen tiene no es una presentación, es una lectura incompleta. Se
 * resuelve contra el registro o queda `unresolved`.
 */
export function isMintablePresentationSignature(signature: Signature): boolean {
  return signature.axes.every((axis) => axis.known);
}

// ---------------------------------------------------------------------------
// C. ASIGNACIÓN
// ---------------------------------------------------------------------------

/** Resolución sintética para un nivel que no se pudo ni intentar. */
function blocked(rawSignature: string, reason: string): RegistryResolution {
  return {
    outcome: "unresolved",
    entityId: null,
    rawSignature,
    normalizedSignature: rawSignature,
    unknownAxes: [],
    candidateCount: 0,
    candidateIds: [],
    reason,
  };
}

function toRecord(
  observationId: string,
  entityKind: CanonicalResolutionRecord["entityKind"],
  resolution: RegistryResolution,
  input: ObservationInput
): CanonicalResolutionRecord {
  return {
    offerObservationId: observationId,
    entityKind,
    outcome: resolution.outcome,
    entityId: resolution.entityId,
    rawSignature: resolution.rawSignature,
    normalizedSignature: resolution.normalizedSignature,
    signatureVersion: SIGNATURE_VERSION,
    canonicalizerVersion: CANONICALIZER_VERSION,
    resolverVersion: RESOLVER_VERSION,
    unknownAxes: resolution.unknownAxes,
    candidateCount: resolution.candidateCount,
    candidateIds: resolution.candidateIds,
    reason: resolution.reason,
    upstreamFields: input.upstreamFields,
    inferredFields: input.attributes.inferredFields,
    legacyMatchKey: input.legacyMatchKey,
    legacyPresentationKey: input.legacyPresentationKey,
    resolvedAt: input.observedAt,
  };
}

/**
 * Asigna identidad persistente a UNA observación.
 *
 * NUNCA lanza hacia el llamador por un fallo del repositorio: el shadow no puede
 * romper la respuesta al usuario. Un error de persistencia degrada la resolución
 * de ese nivel a `unresolved` con el motivo registrado.
 */
export async function assignIdentity(
  repository: CanonicalRegistryRepository,
  input: ObservationInput
): Promise<AssignedIdentity> {
  const { attributes } = input;

  // ---- Nivel 1: Concepto Farmacéutico -------------------------------------
  const conceptSig = conceptSignature(attributes);
  const conceptText = signatureText(conceptSig);
  const conceptCandidates = await repository.findConceptCandidates(
    conceptText,
    SIGNATURE_VERSION
  );
  let concept = resolveAgainstRegistry(conceptSig, conceptCandidates, {
    mintable: isMintableConceptSignature(attributes),
  });

  if (concept.outcome === "created") {
    const minted = await repository.createConcept({
      canonicalSignature: conceptText,
      canonicalName: attributes.canonicalName,
      activeIngredients: attributes.activeIngredients.map((i) => i.token),
      declaredComponentCount: attributes.declaredComponentCount,
      identityStatus:
        attributes.activeIngredients.length > 0 ? "resolved" : "unresolved-ingredient",
      unresolvedIdentityDiscriminator: attributes.unresolvedIdentityDiscriminator,
      concentration: concentrationSignature(attributes.concentration),
      canonicalDosageForm: attributes.canonicalDosageForm,
      route: attributes.route,
      pharmaceuticalUnit: attributes.pharmaceuticalUnit,
    });
    // `created: false` ⇒ otro proceso acuñó la misma firma completa entre la
    // lectura de candidatos y la escritura. No es un error y no se reintenta:
    // se REUTILIZA el ganador. Es el único desenlace que respeta "dos requests
    // simultáneos con la misma firma completa no pueden acuñar dos IDs".
    // `null` ⇒ el registro no pudo escribir. NO se inventa un identificador.
    concept =
      minted === null
        ? {
            ...concept,
            outcome: "unresolved",
            entityId: null,
            reason: "el registro no pudo acuñar la identidad: no se asigna ningún identificador",
          }
        : minted.created
          ? { ...concept, entityId: minted.record.id }
          : {
              ...concept,
              outcome: "exact",
              entityId: minted.record.id,
              reason:
                "carrera de creación resuelta por la restricción UNIQUE: se reutiliza la identidad ganadora",
            };
  }

  const conceptId = concept.entityId;

  // ---- Nivel 2 y 3: dependen de un concepto resuelto -----------------------
  let presentation: RegistryResolution;
  let product: RegistryResolution;

  if (conceptId === null) {
    const reason = `no se resuelve: el Concepto Farmacéutico quedó ${concept.outcome}`;
    presentation = blocked(signatureText(presentationSignature("?", attributes)), reason);
    product = blocked(signatureText(registryProductSignature("?", attributes)), reason);
  } else {
    const presentationSig = presentationSignature(conceptId, attributes);
    const presentationText = signatureText(presentationSig);
    const presentationCandidates = await repository.findPresentationCandidates(
      presentationText,
      SIGNATURE_VERSION,
      conceptId
    );
    presentation = resolveAgainstRegistry(presentationSig, presentationCandidates, {
      mintable: isMintablePresentationSignature(presentationSig),
    });

    if (presentation.outcome === "created") {
      const minted = await repository.createPresentation({
        canonicalSignature: presentationText,
        conceptId,
        packageQuantity: attributes.packageQuantity,
        packageUnit: attributes.packageUnit,
        packageVolume:
          attributes.packageVolume === null
            ? null
            : `${attributes.packageVolume.value}${attributes.packageVolume.unit}`,
        packageType: attributes.packageType,
      });
      presentation =
        minted === null
          ? {
              ...presentation,
              outcome: "unresolved",
              entityId: null,
              reason: "el registro no pudo acuñar la identidad: no se asigna ningún identificador",
            }
          : minted.created
            ? { ...presentation, entityId: minted.record.id }
            : {
                ...presentation,
                outcome: "exact",
                entityId: minted.record.id,
                reason:
                  "carrera de creación resuelta por la restricción UNIQUE: se reutiliza la identidad ganadora",
              };
    }

    const productSig = registryProductSignature(conceptId, attributes);
    const productText = signatureText(productSig);
    const productCandidates = await repository.findProductCandidates(
      productText,
      SIGNATURE_VERSION,
      conceptId
    );
    product = resolveAgainstRegistry(productSig, productCandidates, {
      mintable: isMintableProductSignature(productSig),
    });

    if (product.outcome === "created") {
      const minted = await repository.createProduct({
        canonicalSignature: productText,
        conceptId,
        brand: attributes.brand,
        commercialVariant: attributes.commercialVariant,
        administrationTime: attributes.administrationTime,
        manufacturer: attributes.manufacturer,
        ispRegistration: attributes.ispRegistration,
      });
      product =
        minted === null
          ? {
              ...product,
              outcome: "unresolved",
              entityId: null,
              reason: "el registro no pudo acuñar la identidad: no se asigna ningún identificador",
            }
          : minted.created
            ? { ...product, entityId: minted.record.id }
            : {
                ...product,
                outcome: "exact",
                entityId: minted.record.id,
                reason:
                  "carrera de creación resuelta por la restricción UNIQUE: se reutiliza la identidad ganadora",
              };
    }
  }

  // ---- Relación N:M producto × presentación --------------------------------
  let linked = false;
  if (conceptId !== null && presentation.entityId !== null && product.entityId !== null) {
    await repository.linkProductPresentation(
      product.entityId,
      presentation.entityId,
      conceptId,
      input.observedAt
    );
    linked = true;
  }

  // ---- Observación y linaje ------------------------------------------------
  const observationId = observationKey(input.pharmacy, input.sourceProductId);
  const records: CanonicalResolutionRecord[] = [
    toRecord(observationId, "concept", concept, input),
    toRecord(observationId, "presentation", presentation, input),
    toRecord(observationId, "product", product, input),
  ];

  const observation = await repository.recordObservationResolution(
    {
      pharmacy: input.pharmacy,
      sourceProductId: input.sourceProductId,
      rawName: input.rawName,
      conceptId,
      presentationId: presentation.entityId,
      productId: product.entityId,
      observedAt: input.observedAt,
    },
    records
  );

  await repository.recordProvenance(
    observation === null
      ? records
      : records.map((record) => ({ ...record, offerObservationId: observation.id }))
  );

  return {
    observationId: observation?.id ?? null,
    concept,
    presentation,
    product,
    linked,
  };
}

/** `true` si la firma del concepto de esta observación es LITERALMENTE completa. */
export function canMintConcept(attributes: CanonicalAttributes): boolean {
  return isCompleteSignature(conceptSignature(attributes));
}
