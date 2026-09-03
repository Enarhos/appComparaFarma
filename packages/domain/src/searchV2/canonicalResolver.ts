/**
 * Search Engine v2 — RESOLUTION contra el registro persistido
 * (CF-SEARCH-012, S1).
 *
 * Esta es la SEGUNDA de las tres responsabilidades, y la única que compara. No
 * lee texto (eso es canonicalization) y no escribe nada (eso es identity
 * assignment): recibe una firma observada y un conjunto de candidatos del
 * REGISTRO, y decide.
 *
 * ---------------------------------------------------------------------------
 * QUÉ CAMBIA RESPECTO DE `resolveBySubsumption()` DE S0
 * ---------------------------------------------------------------------------
 * S0 resolvía un conjunto de ofertas CONTRA SÍ MISMO: las firmas completas del
 * corpus recuperado hacían de anfitrionas. Eso es correcto como experimento y es
 * inaceptable como identidad, porque el conjunto de anfitrionas cambia con cada
 * búsqueda — es literalmente "el conjunto circunstancial de candidatos
 * recuperados" que S1 tiene prohibido usar.
 *
 * Acá las anfitrionas son EXCLUSIVAMENTE identidades ya persistidas. Dos
 * consecuencias medibles, y las dos son el objetivo:
 *
 *   1. la resolución de una observación NO depende de qué más devolvió la
 *      búsqueda, ni de cuántos resultados hubo, ni de qué farmacias
 *      respondieron;
 *   2. una observación PARCIAL nunca puede acuñar identidad, ni siquiera cuando
 *      es la única de su clase en el corpus. Antes, una firma parcial sin
 *      candidatas quedaba `isolated` y se quedaba con una clave propia — o sea,
 *      acuñaba identidad por subsunción contextual. Ahora queda `unresolved`.
 *
 * ---------------------------------------------------------------------------
 * LA TABLA DE DECISIÓN, COMPLETA
 * ---------------------------------------------------------------------------
 *
 *   firma COMPLETA  · alias exacto en el registro ............ `exact`
 *   firma COMPLETA  · sin alias exacto ....................... `created`  (acuña)
 *   firma PARCIAL   · alias exacto en el registro ............ `exact`
 *   firma PARCIAL   · 1 anfitriona maximal ................... `subsumed`
 *   firma PARCIAL   · 0 anfitrionas .......................... `unresolved`
 *   firma PARCIAL   · ≥2 anfitrionas maximales ............... `ambiguous`
 *
 * "Alias exacto" incluye una firma PARCIAL que ya fue vista antes y quedó
 * registrada como alias de una identidad: es lo que hace que la misma
 * observación resuelva siempre igual, independientemente de cuándo llegue.
 *
 * Con ≥2 anfitrionas NO se elige. Adivinar entre dos concentraciones candidatas
 * es exactamente el falso merge que el proyecto prohíbe por riesgo clínico
 * (`PRODUCT_IDENTITY.md` §10), y la ambigüedad es un dato que se reporta, no un
 * problema que se esconde.
 */

import { signatureText, unknownAxes, type Signature } from "./canonicalIdentity.js";
import type { RegistryCandidate, RegistryResolution } from "./registryTypes.js";

/**
 * Una firma es COMPLETA cuando declara todos sus ejes.
 *
 * Es la condición NORMAL para acuñar un ID permanente (`DECISION.md` de S0,
 * recomendación 3). `resolveAgainstRegistry` admite además una condición de
 * acuñación explícita (`options.mintable`) para el único caso en que un eje sin
 * valor no significa "no lo sé" sino "no aplica" — ver
 * `isMintableConceptSignature()` en `canonicalIdentityAssigner.ts`.
 */
export function isCompleteSignature(signature: Signature): boolean {
  return unknownAxes(signature).length === 0;
}

export interface ResolveOptions {
  /**
   * Habilita acuñar aunque queden ejes sin declarar. Por defecto, `undefined`
   * ⇒ solo se acuña desde una firma literalmente completa.
   *
   * NUNCA hace que se acuñe en lugar de reutilizar: la búsqueda de anfitrionas
   * corre ANTES, así que una firma con anfitriona se subsume y una con dos
   * queda ambigua, exactamente igual que sin esta opción.
   */
  mintable?: boolean;
}

/**
 * ---------------------------------------------------------------------------
 * LA COMPARACIÓN SE HACE SOBRE EL TEXTO DE LA FIRMA. POR QUÉ, Y QUÉ CUESTA.
 * ---------------------------------------------------------------------------
 * Lo único que el registro persiste de una identidad es el TEXTO de su firma
 * (`ing=paracetamol|disc=none|conc=conc:mass:500mg|…`). Por lo tanto, TODA
 * decisión de resolución tiene que poder tomarse con ese texto y nada más. Si
 * una regla necesita un dato que la firma no conserva, esa regla no es
 * reproducible contra un registro y no puede gobernar identidad permanente.
 *
 * UN INTENTO ANTERIOR HIZO EXACTAMENTE ESO Y PRODUJO FALSOS MERGES REALES.
 * Reconstruía la firma candidata como objeto y dejaba decidir al comparador
 * propio del eje observado (`compareConcentration`). Como la firma reconstruida
 * no llevaba la evidencia estructurada, ese comparador la leía como `absent`
 * —"no declara concentración"— en vez de como "declara otra". El resultado,
 * medido sobre el corpus congelado: **198 pares** de amoxicilina + ácido
 * clavulánico en los que una presentación de 875/125 mg quedaba subsumida
 * dentro del Concepto Farmacéutico de 500/125 mg. Una potencia de antibiótico
 * declarada igual a otra distinta.
 *
 * LA REGLA MIXTA `mass-only` ⊂ `ratio` NO SOBREVIVE A LA NORMALIZACIÓN, y esa
 * es la razón de fondo. La tabla R5 de S0 decide comparando la masa contra el
 * NUMERADOR de la razón, pero la firma guarda la razón ya normalizada
 * (`conc:ratio:6mg/ml`): `30 mg/5 mL`, `6 mg/mL` y `600 mg/100 mL` son la misma
 * concentración y producen la misma firma, aunque R5 daría respuestas distintas
 * para cada escritura frente a una masa de `30 mg` —`canonicalConcentration.ts`
 * ya documenta ese caso como limitación conocida—. En un registro persistente
 * eso significaría que la identidad depende de CÓMO estaba escrita la oferta
 * que acuñó el concepto, es decir del orden de llegada. Inaceptable para S1.
 *
 * DECISIÓN: dos concentraciones DECLARADAS con firma distinta son
 * `incompatible`, aunque una sea masa y la otra razón. Es estrictamente más
 * conservador que S0 —produce, como mucho, un `unresolved` de más y jamás un
 * merge de más—, es la dirección que el proyecto eligió por riesgo clínico
 * (`PRODUCT_IDENTITY.md` §10), y es reproducible contra el registro. El costo
 * está medido en `docs/qa/cf-search-012/S1_METRICS.md`.
 *
 * El eje `ing` SÍ conserva toda su semántica: el conjunto de moléculas y la
 * cardinalidad declarada son íntegramente recuperables del segmento
 * (`amoxicilina+?2` = "declara 2 componentes, nombré amoxicilina"), así que la
 * regla de contención se aplica igual que en S0.
 */

/** Fuerza de un eje leída de su SEGMENTO: 0 ausente, 1 parcial, 2 completa. */
function segmentStrength(name: string, segment: string): number {
  if (name === "ing") {
    const tokens = ingredientTokens(segment);
    if (tokens.length === 0) return declaredCount(segment) > 1 ? 1 : 0;
    return tokens.length >= declaredCount(segment) ? 2 : 1;
  }
  // `conc:?` es la forma que `concentrationSignature()` emite para `absent`; el
  // resto de los ejes usa `?` a secas. Los dos significan "no declarado".
  if (segment === "?" || segment === "conc:?") return 0;
  // `mass-only` es evidencia PARCIAL de concentración; `ratio`, completa.
  if (segment.startsWith("conc:mass:")) return 1;
  return 2;
}

/** Cardinalidad declarada por un segmento de `ing` (`a+?2` ⇒ 2). */
function declaredCount(segment: string): number {
  const arity = segment.match(/\?(\d+)/);
  return Math.max(ingredientTokens(segment).length, arity ? Number(arity[1]) : 0);
}

function ingredientTokens(segment: string): string[] {
  return segment.split("+").filter((token) => token.length > 0 && !token.startsWith("?"));
}

/** Compara dos segmentos del MISMO eje. */
function compareSegments(
  name: string,
  weak: string,
  weakStrength: number,
  strong: string,
  strongStrength: number
): "equal" | "incompatible" | "subsumable" {
  if (weak === strong) return "equal";
  if (weakStrength === 0) return "subsumable";

  if (name === "ing") {
    // Regla de contención de S0, íntegramente recuperable del segmento: el
    // conjunto débil debe estar CONTENIDO en el fuerte, y el fuerte debe tener
    // al menos tantos componentes como el débil DECLARA. "Zolimax Duo 875/125
    // Amoxicilina 875 mg" declara 2 componentes y por lo tanto no puede ser una
    // lectura incompleta de un monofármaco de amoxicilina.
    const weakTokens = ingredientTokens(weak);
    const strongTokens = ingredientTokens(strong);
    const strongSet = new Set(strongTokens);
    if (!weakTokens.every((token) => strongSet.has(token))) return "incompatible";
    if (Math.max(strongTokens.length, declaredCount(strong)) < declaredCount(weak)) {
      return "incompatible";
    }
    return weakStrength < strongStrength ? "subsumable" : "incompatible";
  }

  // Todo lo demás: declarado y distinto ⇒ incompatible. Incluye la
  // concentración (ver la cabecera de esta sección).
  return "incompatible";
}

/**
 * `true` si la firma observada puede ser una lectura INCOMPLETA de la
 * persistida. Exige las dos condiciones, igual que `subsumes()` de S0: ningún
 * eje se contradice, y al menos uno del lado débil es estrictamente más débil
 * sin que ninguno sea más fuerte. La relación resultante es un orden parcial
 * estricto, así que la resolución no puede entrar en un ciclo.
 */
export function subsumesSignatureText(weakText: string, strongText: string): boolean {
  const weak = splitAxes(weakText);
  const strong = splitAxes(strongText);
  if (weak.length !== strong.length) return false;

  let hasWeakerAxis = false;
  for (let i = 0; i < weak.length; i++) {
    const a = weak[i]!;
    const b = strong[i]!;
    if (a.name !== b.name) return false;

    const aStrength = segmentStrength(a.name, a.segment);
    const bStrength = segmentStrength(b.name, b.segment);
    const verdict = compareSegments(a.name, a.segment, aStrength, b.segment, bStrength);

    if (verdict === "incompatible") return false;
    if (verdict === "subsumable") {
      if (aStrength >= bStrength) return false;
      hasWeakerAxis = true;
    }
  }
  return hasWeakerAxis;
}

function splitAxes(text: string): Array<{ name: string; segment: string }> {
  return text.split("|").map((part) => {
    const index = part.indexOf("=");
    return index === -1
      ? { name: part, segment: "" }
      : { name: part.slice(0, index), segment: part.slice(index + 1) };
  });
}

/**
 * Reconstruye una firma desde su texto canónico. Se conserva porque es útil
 * para diagnóstico y para las herramientas de QA, pero **la resolución NO la
 * usa**: la decisión se toma con `subsumesSignatureText()`, sobre el texto, por
 * los motivos de la cabecera de esta sección.
 */
export function parseSignatureText(text: string): Signature {
  return {
    axes: splitAxes(text).map(({ name, segment }) => {
      const strength = segmentStrength(name, segment);
      return { name, segment, known: strength === 2, strength };
    }),
  };
}

/**
 * Resuelve una firma observada contra los candidatos del registro.
 *
 * `candidates` debe venir del REPOSITORIO, nunca del corpus de la búsqueda. El
 * resolutor no sabe —ni puede saber— si hubo una consulta de usuario detrás.
 */
export function resolveAgainstRegistry(
  observed: Signature,
  candidates: RegistryCandidate[],
  options: ResolveOptions = {}
): RegistryResolution {
  const rawSignature = signatureText(observed);
  const missing = unknownAxes(observed);
  const complete = missing.length === 0;
  const mintable = options.mintable ?? complete;

  // 1. ALIAS EXACTO. Gana siempre, y es lo que garantiza `query independence`,
  //    `pharmacy independence` y `order independence`: la misma observación
  //    produce la misma firma, y la misma firma encuentra el mismo alias.
  const exact = candidates.find((candidate) => candidate.signature === rawSignature);
  if (exact) {
    return {
      outcome: "exact",
      entityId: exact.entityId,
      rawSignature,
      normalizedSignature: exact.signature,
      unknownAxes: missing,
      candidateCount: 1,
      candidateIds: [exact.entityId],
      reason: complete
        ? "firma completa ya registrada: se reutiliza la identidad existente"
        : "firma parcial ya registrada como alias: se reutiliza la identidad existente",
    };
  }

  // 2. ANFITRIONAS. Se buscan SIEMPRE antes de acuñar: reutilizar una identidad
  //    existente es preferible a crear una nueva, y una firma literalmente
  //    completa no puede tener anfitrionas (`subsumes` exige un eje
  //    estrictamente más débil), así que para ella este paso no cambia nada.
  //
  //    De las anfitrionas se conservan solo las MAXIMALES: la subsunción es
  //    transitiva, así que si A ⊂ B ⊂ C, A tiene dos candidatas y sin este
  //    filtro se declararía ambigua cuando el destino correcto es único (C).
  const hosts = candidates.filter((candidate) =>
    subsumesSignatureText(rawSignature, candidate.signature)
  );
  const maximal = hosts.filter(
    (host) =>
      !hosts.some(
        (other) =>
          other.entityId !== host.entityId &&
          subsumesSignatureText(host.signature, other.signature)
      )
  );

  if (maximal.length === 1) {
    const host = maximal[0]!;
    return {
      outcome: "subsumed",
      entityId: host.entityId,
      rawSignature,
      normalizedSignature: host.signature,
      unknownAxes: missing,
      candidateCount: 1,
      candidateIds: [host.entityId],
      reason: `firma parcial (ejes sin declarar: ${missing.join(", ")}) hospedada por exactamente una identidad del registro`,
    };
  }

  if (maximal.length === 0) {
    // 3. SIN ANFITRIONA. Se acuña solo si la firma habilita acuñación.
    if (mintable) {
      return {
        outcome: "created",
        entityId: null, // lo asigna el repositorio, no el resolutor
        rawSignature,
        normalizedSignature: rawSignature,
        unknownAxes: missing,
        candidateCount: 0,
        candidateIds: [],
        reason: complete
          ? "firma completa sin identidad previa: se acuña un identificador permanente"
          : `firma suficiente sin identidad previa (ejes no aplicables: ${missing.join(", ")}): se acuña un identificador permanente`,
      };
    }
    return {
      outcome: "unresolved",
      entityId: null,
      rawSignature,
      normalizedSignature: rawSignature,
      unknownAxes: missing,
      candidateCount: 0,
      candidateIds: [],
      reason: `firma parcial (ejes sin declarar: ${missing.join(", ")}) sin ninguna identidad compatible en el registro: no se acuña identidad desde evidencia incompleta`,
    };
  }

  return {
    outcome: "ambiguous",
    entityId: null,
    rawSignature,
    normalizedSignature: rawSignature,
    unknownAxes: missing,
    candidateCount: maximal.length,
    candidateIds: maximal.map((host) => host.entityId).sort(),
    reason: `firma parcial (ejes sin declarar: ${missing.join(", ")}) compatible con ${maximal.length} identidades del registro: no se elige`,
  };
}
