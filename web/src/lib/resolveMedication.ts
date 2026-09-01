import type { Concentration, MedicationResult } from "@comparafarma/domain";
import {
  brandHeadTokens,
  isCompatibleConcentration,
  isCompatibleUnitCount,
  liquidConcentration,
  normalizedWords,
  unitCountKey,
} from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";
import {
  buildMedicationSlug,
  medicationSlugHash,
  medicationSlugHumanPart,
  slugifyText,
  medicationSlugIdentity,
  medicationSlugIdentityBioVariants,
  parseMedicationSlug,
  presentationKeyBioVariants,
  presentationKeyWithoutCombination,
  presentationKeyWithoutIdentityAttributes,
  queryFromSlug,
  shortHash,
} from "@/lib/medicationSlug";

export type ResolveMedicationResult =
  | { status: "not-found" }
  | { status: "ambiguous"; matches: MedicationResult[] }
  | { status: "ok"; medication: MedicationResult; canonicalSlug: string; needsRedirect: boolean };

/**
 * Resuelve un slug de /medicamento/[slug] a un MedicationResult, sin ninguna
 * tabla de persistencia (deliberado — ver Sprint 2, sin CFM-ID todavía).
 *
 * Cómo funciona: se reconstruye un texto de búsqueda a partir del slug, se
 * ejecuta contra /api/search (misma función que usa /buscar/[query], sin
 * ningún endpoint nuevo) y de los resultados se toma el que tiene el mismo
 * hash de identidad que el sufijo del slug. La identidad NUNCA se relaja: no
 * se elige "el más parecido", ni el primero, ni el más barato.
 *
 * CF-WEB-002 (2026-08-31) — CON QUÉ TEXTO SE BUSCA (causa raíz #1)
 * ----------------------------------------------------------------
 * Antes se buscaba con la parte legible COMPLETA del slug, es decir con el
 * `canonicalName` entero. Eso no es una búsqueda más precisa: es una consulta
 * DISTINTA y más angosta que la que originó el enlace, y los 9 buscadores de
 * farmacia responden a ella con otro conjunto de productos. Medido en
 * producción el 2026-08-31 sobre el caso real de CF-QA-001:
 *
 *   /api/search?q=tapsin                              → 137 tarjetas
 *     (incluye "Tapsin X 6 comprimidos Noche (Maver)", que genera el enlace)
 *   /api/search?q=tapsin x 6 comprimidos noche maver  →  24 tarjetas
 *     (`cleanQuery` lo reduce a "tapsin noche maver"; la tarjeta NO está)
 *
 * El producto que EXISTÍA al generar el enlace desaparecía del conjunto de
 * candidatos al resolverlo, y la ficha moría con "Medicamento no encontrado"
 * aunque el producto siguiera perfectamente disponible.
 *
 * Por eso se recupera con una ESCALERA de consultas, de mayor a menor recall
 * (ver `retrievalQueriesForSlug`), y se acepta la PRIMERA que produzca algún
 * candidato con el hash pedido. No es "reintentar hasta que funcione": ampliar
 * el conjunto de candidatos solo puede AGREGAR productos que no matchean el
 * hash — el criterio de identidad es idéntico en todos los intentos.
 *
 * Límite conocido y aceptado (sin persistencia no hay forma de evitarlo):
 * un slug solo sigue resolviendo si alguna de esas consultas todavía devuelve
 * un medicamento cuya identidad hashea al mismo sufijo. Si el producto se dio
 * de baja, el link se rompe — no hay reindexación posible sin un registro
 * persistido (ese es exactamente el rol futuro de CFM-ID / RFC-002, fuera de
 * alcance de este ticket).
 *
 * CF-WEB-002 — CUÁNDO EL HASH NO ALCANZA (causa raíz #2)
 * ------------------------------------------------------
 * `mergeDuplicates` (packages/domain) emite a propósito DOS tarjetas distintas
 * con la MISMA `presentationKey` cuando dos ofertas se contradicen en un eje
 * que vive FUERA de esa clave — cantidad por envase y concentración de formas
 * líquidas (CF-SEARCH-001/003: agregarlos a la clave rotaría la identidad de
 * casi todo el catálogo). Como el hash del slug es `shortHash(presentationKey)`,
 * esas dos tarjetas producen el MISMO hash:
 *
 *   ambroxol|100ml|bio:unknown|brand:unknown|form:fluid-oral  → 368kw3kmwe8r5
 *     "Ambroxol 30mg/5ml Jarabe 100ml"   → /medicamento/ambroxol-30mg-5ml-…-368kw3kmwe8r5
 *     "Ambroxol 15 mg/5mL Jarabe 100 mL" → /medicamento/ambroxol-15-mg-5ml-…-368kw3kmwe8r5
 *
 * Los dos enlaces son URLs distintas, pero el hash matcheaba las dos tarjetas
 * y la ficha respondía `medication_slug_hash_collision` → 404 en AMBAS: el fix
 * de CF-SEARCH-003 dejaba las dos concentraciones correctamente separadas y
 * simultáneamente inalcanzables. Medido: 2,2 % de las tarjetas del corpus.
 *
 * La desambiguación usa la información que el slug YA transporta y que hasta
 * ahora se ignoraba en la generación vigente: su parte legible. Es una
 * restricción ADICIONAL (hash exacto Y nombre exacto), nunca una relajación —
 * si ninguna candidata coincide en el nombre, o si coinciden dos, se sigue
 * respondiendo 404 en vez de elegir una.
 *
 * Si el hash del slug matchea más de un resultado, NUNCA se elige un ganador
 * por precio, farmacia u orden. Hay dos casos distintos, y se distinguen
 * (QA-01, 2026-08-28):
 *
 *   a) El hash vino de una GENERACIÓN ANTIGUA (Gen 1-4, `needsRedirect`) y hoy
 *      matchea 2+ productos porque esa identidad se dividió en varias fichas
 *      (típicamente por los ejes `|var:`/`|form:` que agregó CF-SEARCH-001).
 *      No es una anomalía: es el efecto esperado del split sobre links viejos
 *      (medido: 6 de 32 grupos divididos caen acá). El slug ya no identifica un
 *      producto, así que se registra `medication_slug_legacy_ambiguous` y se
 *      devuelve "not-found" -> 404 limpio y `noindex` en la ficha. NO se elige
 *      uno de los candidatos para redirigir: son productos DISTINTOS (ej.
 *      Tapsin Rojo vs Tapsin Noche), y un 301 al equivocado es exactamente el
 *      riesgo que S-1 y CF-SEARCH-001 corrigen (ver Caso 15).
 *
 *   b) El hash vino de la generación VIGENTE (Gen 5) y aun así matchea 2+
 *      resultados: eso sí es una anomalía (colisión de `shortHash`, o dos
 *      resultados con el mismo `presentationKey` que `mergeDuplicates` debería
 *      haber fusionado). Se registra `medication_slug_hash_collision` y se
 *      devuelve "ambiguous"; la ficha lo trata como 404 (nunca un 500 — ver
 *      page.tsx), pero el evento queda en los logs para investigar.
 *
 * Generaciones de hash soportadas, en orden de intento:
 *   Gen 5 (vigente) — `presentationKey` completa, con `|var:` (variante
 *                     comercial) y `|form:` (forma farmacéutica)
 *                     (CF-SEARCH-001, 2026-08-27).
 *   Gen 6-bio       — la misma clave de Gen 5/Gen 4/Gen 3/Gen 2 pero con OTRO
 *                     valor en `|bio:` (BIOEQUIVALENCE-DATA-QUALITY-01,
 *                     2026-08-30). No es una generación de FORMA sino de VALOR:
 *                     al dejar de afirmar `false` donde la farmacia no informa,
 *                     `|bio:false` pasó a `|bio:unknown` en el 81,7 % de las
 *                     tarjetas (medido sobre producción real: 914 tarjetas de
 *                     10 búsquedas, 2026-08-30). Sin este paso, 4 de cada 5 URLs
 *                     de ficha ya indexadas devolverían 404. Se prueba junto a
 *                     cada generación de forma, porque un link viejo puede ser
 *                     anterior a los dos cambios.
 *   Gen 4           — `presentationKey` sin `|var:` ni `|form:` (S-1). A
 *                     diferencia de Gen 3, esta generación cubre a CASI TODO
 *                     el catálogo: `|form:` está presente en la mayoría de las
 *                     fichas, así que casi todos los slugs emitidos antes de
 *                     CF-SEARCH-001 resuelven por acá y redirigen a Gen 5.
 *   Gen 3           — `presentationKey` sin `|combo:` (FASE 1 Product Identity,
 *                     2026-08-19). Solo difiere de Gen 4 en combinaciones.
 *   Gen 2           — matchKey + bioequivalencia, sin marca.
 *   Gen 1           — matchKey a secas.
 *
 * `needsRedirect` (bugfix 2026-08-19 — ver OPKO_DETAIL_REDIRECT_LOOP):
 * indica si `/medicamento/[slug]/page.tsx` debe emitir un `permanentRedirect`
 * hacia `canonicalSlug`. Es `true` SOLO cuando el slug pedido usa un esquema
 * de hash antiguo (Gen 1/Gen 2/Gen 3) y necesita migrar al esquema vigente
 * (Gen 4). Es `false` cuando el slug pedido YA matcheó por el
 * hash Gen 4 vigente, aun si `canonicalSlug` difiere en su parte legible de
 * `slug` — esa diferencia es puramente cosmética (viene de `canonicalName`,
 * que `mergeDuplicates` en `packages/domain` puede resolver a un texto
 * distinto entre una búsqueda y la siguiente cuando dos o más farmacias
 * comparten el mismo `presentationKey` y su disponibilidad varía entre
 * llamadas — ver `deduplication.ts`). Redirigir en ese caso, sin este fix,
 * producía un loop infinito: cada slug se resolvía a un `canonicalSlug` con
 * OTRO texto legible (mismo hash), disparando otro `permanentRedirect` hacia
 * atrás indefinidamente (bug real, reproducido con Omeprazol 20mg x30 Opko;
 * ver informe de diagnóstico). Nunca se cambia `canonicalSlug` en sí —
 * `generateMetadata` sigue usándolo tal cual para el `<link rel="canonical">`.
 */
/**
 * Consultas de recuperación para un slug, de MAYOR a MENOR recall.
 *
 * 1. La cabecera farmacológica/de marca del nombre — el mismo token que
 *    `matchKey()` consume como cabecera, leído con `brandHeadTokens()` de
 *    @comparafarma/domain para no duplicar la regla (CLAUDE.md §7). Es, en la
 *    práctica, lo que el usuario escribe cuando llega a esa tarjeta
 *    ("tapsin", "ambroxol", "clotrimazol") y por lo tanto la consulta con la
 *    que el enlace se generó.
 * 2. La parte legible completa — comportamiento histórico. Se conserva como
 *    segundo intento para no perder ningún caso que hoy resuelve por acá
 *    (nombres cuya cabecera es demasiado corta o poco distintiva para que los
 *    buscadores de farmacia la traten bien, ej. "Cam Jarabe Betametasona").
 *
 * Nunca se busca por una palabra genérica ni se amplía más allá del propio
 * nombre del producto: la cabecera sale del slug, no de un catálogo de
 * términos populares.
 */
export function retrievalQueriesForSlug(humanPart: string): string[] {
  const fullName = queryFromSlug(humanPart);
  const head = brandHeadTokens(normalizedWords(fullName)).join(" ");

  const queries: string[] = [];
  // `/api/search` rechaza con 400 cualquier consulta de menos de 2 caracteres.
  if (head.length >= 2) queries.push(head);
  if (fullName.length >= 2 && !queries.includes(fullName)) queries.push(fullName);
  return queries;
}

/**
 * Identidad que un NOMBRE declara, leída DESPUÉS de pasar por la normalización
 * con pérdida del slug.
 *
 * Por qué la pérdida se aplica a propósito a los dos lados: `slugifyText`
 * destruye los separadores que la farmacología necesita —la coma decimal y la
 * barra de la razón mg/mL— y esa pérdida es irreversible.
 *
 *   "Cam Jarabe Betametasona 0,25 mg 120 Ml" → "…-0-25-mg-…" → "0 25 mg" → 25 mg
 *   "Ambroxol 30mg/5ml Jarabe 100ml"         → "…-30mg-5ml-…" → "30mg 5ml" → 30 mg
 *
 * Leer la parte legible del slug contra el nombre CRUDO del candidato compara
 * dos dialectos distintos y produce contradicciones falsas (25 mg vs 0,25 mg
 * marcaría como incompatible al producto correcto). Aplicando exactamente la
 * misma transformación a los dos lados, la comparación vuelve a ser válida:
 * ambos quedan escritos en el mismo dialecto empobrecido y solo se contradicen
 * cuando el producto es realmente otro.
 */
interface SlugIdentity {
  concentration: Concentration | null;
  unitCount: number | null;
}

function identityAsWrittenInSlug(name: string): SlugIdentity {
  const flattened = queryFromSlug(slugifyText(name));
  return {
    concentration: liquidConcentration(flattened),
    unitCount: unitCountKey(flattened),
  };
}

/**
 * `true` si una candidata NO contradice la identidad que declara la parte
 * legible del slug, en los dos ejes que `presentationKey` deja deliberadamente
 * FUERA: concentración de formas líquidas y unidades por envase.
 *
 * Es exactamente el hueco que el hash no puede cubrir. `presentationKey`
 * captura principio activo, dosis, bioequivalencia, marca, combinación,
 * variante y forma; `mergeDuplicates` separa además por cantidad y
 * concentración SIN meterlas en la clave (meterlas rotaría la identidad de casi
 * todo el catálogo). Resultado: dos productos distintos pueden compartir
 * `presentationKey` —y por lo tanto el hash del slug— y el resolver aceptaba al
 * que tuviera a mano. Medido en producción (`analysis/baseline.json`,
 * 2026-09-01): el enlace de "Cam Jarabe Betametasona 0,25 mg" resolvía, en
 * silencio y sin redirect, a "Cam Betametasona 2 mg" — ocho veces la
 * concentración del mismo corticoide.
 *
 * Se reutilizan las MISMAS funciones de compatibilidad del dominio que decide
 * la fusión (`isCompatibleConcentration`/`isCompatibleUnitCount`,
 * productIdentity.ts), con su política asimétrica deliberada: dos valores
 * explícitos y distintos se contradicen; la AUSENCIA nunca bloquea. Por eso
 * este filtro no rechaza a las candidatas cuyo nombre simplemente está escrito
 * de otra forma —verificado sobre las 103 resoluciones correctas de la línea
 * base: 0 rechazos— y sí rechaza a las que declaran otra potencia u otro
 * tamaño de envase.
 */
function isConsistentWithSlug(claim: SlugIdentity, candidate: MedicationResult): boolean {
  const declared = identityAsWrittenInSlug(candidate.canonicalName);
  return (
    isCompatibleConcentration(claim.concentration, declared.concentration) &&
    isCompatibleUnitCount(claim.unitCount, declared.unitCount)
  );
}

/**
 * Desempate por la parte legible del slug: si alguna candidata coincide
 * EXACTAMENTE con ella, se prefiere ese subconjunto; si ninguna coincide, se
 * devuelven todas y el llamador decide (ambiguo → 404).
 *
 * Restricción adicional sobre el hash, nunca un reemplazo: una candidata tiene
 * que coincidir en hash Y en nombre para ganar el desempate.
 */
function preferHumanPart(candidates: MedicationResult[], humanPart: string): MedicationResult[] {
  const exact = candidates.filter((result) => medicationSlugHumanPart(result) === humanPart);
  return exact.length > 0 ? exact : candidates;
}

interface GenerationMatch {
  matches: MedicationResult[];
  needsRedirect: boolean;
}

/**
 * Aplica la cadena de generaciones de hash sobre UN conjunto de resultados.
 * No hace red: es una función pura del par (slug, resultados), lo que permite
 * probarla y reutilizarla para cada consulta de la escalera de recuperación.
 */
function matchGenerations(
  parsed: { humanPart: string; hash: string },
  allResults: MedicationResult[]
): GenerationMatch {
  // Guardia de identidad, ANTES de cualquier generación: una candidata que
  // contradice la concentración o la cantidad declaradas en el slug no es
  // elegible por ninguna vía. Se aplica una sola vez, para todas las
  // generaciones — un slug antiguo tampoco puede terminar en otra potencia.
  const claim = identityAsWrittenInSlug(queryFromSlug(parsed.humanPart));
  const results = allResults.filter((result) => isConsistentWithSlug(claim, result));

  // Gen 5 (vigente) — presentationKey completa: matchKey + bioequivalencia +
  // marca + combinación + variante comercial + forma farmacéutica
  // (`|var:`/`|form:` desde CF-SEARCH-001, 2026-08-27).
  //
  // CF-WEB-002: el desempate por parte legible se aplica TAMBIÉN acá, no solo
  // a las generaciones antiguas. Es la generación vigente la que sufre la
  // colisión estructural de `presentationKey` compartida (ver cabecera), así
  // que era justo donde faltaba.
  let matches = preferHumanPart(
    results.filter((result) => medicationSlugHash(result) === parsed.hash),
    parsed.humanPart
  );
  let needsRedirect = false;

  // Aplica una generación antigua: se queda con los resultados cuyo hash
  // coincide con alguna de las claves que produce `keysOf`, prefiriendo los que
  // además coinciden en la parte legible del slug, y marca el resultado para
  // redirect. Extraído para que sumar la variante de `|bio:` a cada generación
  // no signifique repetir el mismo bloque cinco veces.
  const tryGeneration = (keysOf: (result: MedicationResult) => string[]): void => {
    const genMatches = results.filter((result) =>
      keysOf(result).some((key) => key.length > 0 && shortHash(key) === parsed.hash)
    );
    const chosen = preferHumanPart(genMatches, parsed.humanPart);
    if (chosen.length === 0) return;
    matches = chosen;
    needsRedirect = true;
  };

  if (matches.length === 0) {
    // Gen 6-bio sobre Gen 5 — la clave vigente con el `|bio:` que tenía ANTES
    // de BIOEQUIVALENCE-DATA-QUALITY-01. Es el caso mayoritario de los links ya
    // emitidos: el 81,7 % de las tarjetas rotó su `presentationKey` solo por el
    // cambio de valor de ese token.
    tryGeneration((result) => presentationKeyBioVariants(result.presentationKey));
  }

  if (matches.length === 0) {
    // Gen 4 — presentationKey SIN `|var:` ni `|form:` (esquema previo a
    // CF-SEARCH-001). Preserva los links emitidos antes de ese cambio, que es
    // prácticamente todo el catálogo indexado. Se prueba también con los otros
    // valores de `|bio:`: un link puede ser anterior a los dos cambios.
    tryGeneration((result) => {
      if (result.presentationKey.length === 0) return [];
      const gen4 = presentationKeyWithoutIdentityAttributes(result.presentationKey);
      return [gen4, ...presentationKeyBioVariants(gen4)];
    });
  }

  if (matches.length === 0) {
    // Gen 3 — presentationKey SIN el segmento `|combo:` (esquema previo a S-1).
    // Solo cambia el hash de los productos de COMBINACIÓN: para el resto del
    // catálogo Gen 4 y Gen 3 son la misma cadena, así que este paso no puede
    // devolver nada nuevo si Gen 4 ya falló. Preserva los links emitidos antes
    // del fix para las combinaciones, que sí rotaron de hash.
    tryGeneration((result) => {
      if (result.presentationKey.length === 0) return [];
      const gen3 = presentationKeyWithoutCombination(result.presentationKey);
      return [gen3, ...presentationKeyBioVariants(gen3)];
    });
  }

  if (matches.length === 0) {
    // Gen 2 — matchKey + bioequivalencia, sin marca (esquema previo a FASE 1
    // Product Identity, 2026-08-19). Preserva los slugs emitidos entre el fix
    // de bioequivalencia y este cambio. También incluye `|bio:`, así que se
    // prueban sus tres valores posibles.
    tryGeneration((result) => [
      medicationSlugIdentity(result),
      ...medicationSlugIdentityBioVariants(result),
    ]);
  }

  if (matches.length === 0) {
    // Gen 1 (legacy) — matchKey a secas, esquema original pre-bioequivalencia.
    // No contiene `|bio:`, así que esta corrección no lo afecta.
    tryGeneration((result) => [result.matchKey]);
  }

  return { matches, needsRedirect };
}

export async function resolveMedicationBySlug(slug: string): Promise<ResolveMedicationResult> {
  const parsed = parseMedicationSlug(slug);
  if (!parsed) return { status: "not-found" };

  // Escalera de recuperación (CF-WEB-002): se acepta la PRIMERA consulta que
  // produce algún candidato con el hash pedido. Si una consulta ya encontró
  // candidatos, NO se prueban las siguientes — ni siquiera cuando el resultado
  // es ambiguo. La ambigüedad es una propiedad de la identidad, no del texto
  // de búsqueda: seguir probando consultas hasta que quede una sola candidata
  // sería elegir el producto por conveniencia, exactamente lo que este ticket
  // prohíbe.
  let matched: GenerationMatch = { matches: [], needsRedirect: false };
  for (const query of retrievalQueriesForSlug(parsed.humanPart)) {
    const { results, error } = await searchMedications(query);
    if (error) {
      throw new Error(`No se pudo resolver la ficha del medicamento: ${error}`);
    }
    matched = matchGenerations(parsed, results);
    if (matched.matches.length > 0) break;
  }

  const { matches, needsRedirect } = matched;

  if (matches.length === 0) {
    return { status: "not-found" };
  }

  if (matches.length > 1) {
    // `needsRedirect` es true exactamente cuando el hash matcheó por una
    // generación antigua: ese es el discriminante entre el caso (a) esperado
    // por el split y el caso (b) anómalo — ver el comentario de arriba.
    if (needsRedirect) {
      console.error(
        JSON.stringify({
          event: "medication_slug_legacy_ambiguous",
          slug,
          presentationKeys: matches.map((match) => match.presentationKey),
        })
      );
      return { status: "not-found" };
    }

    console.error(
      JSON.stringify({
        event: "medication_slug_hash_collision",
        slug,
        matchKeys: matches.map((match) => match.matchKey),
      })
    );
    return { status: "ambiguous", matches };
  }

  const medication = matches[0];
  return { status: "ok", medication, canonicalSlug: buildMedicationSlug(medication), needsRedirect };
}
