/**
 * Search Engine v2 — derivación de identidad canónica (CF-SEARCH-011, S0).
 *
 * DOS PIEZAS, Y SOLO DOS:
 *
 *   1. `provisionalKey()` — una clave determinista derivada de una FIRMA
 *      textual. La firma se conserva íntegra junto a la clave
 *      (`ResolutionTrace`), así que "¿por qué estas dos ofertas comparten
 *      producto?" se responde comparando dos cadenas legibles, no reejecutando
 *      heurísticas.
 *
 *   2. `resolveBySubsumption()` — el ÚNICO mecanismo de resolución del motor v2.
 *      Se aplica igual en los tres niveles (concepto, presentación, producto).
 *
 * ---------------------------------------------------------------------------
 * TRES RESPONSABILIDADES DISTINTAS, Y ESTE MÓDULO SOLO IMPLEMENTA DOS
 * ---------------------------------------------------------------------------
 * La revisión CTO del PR #159 obliga a separarlas explícitamente, porque
 * confundirlas es lo que convierte un mecanismo correcto en una identidad
 * incorrecta:
 *
 *   CANONICALIZATION — texto libre → atributos tipados. Es PURA por oferta: no
 *     mira ninguna otra oferta. Vive en `canonicalAttributes.ts`.
 *
 *   RESOLUTION — dado un conjunto de firmas conocidas, decidir a cuál pertenece
 *     una observación incompleta. Es CONTEXTUAL por definición: su respuesta
 *     depende de qué firmas conoce. Es `resolveBySubsumption()`, y es una buena
 *     estrategia para esto (ver más abajo).
 *
 *   IDENTITY ASSIGNMENT — asignar el identificador PERMANENTE de la entidad. El
 *     EDM exige que no cambie nunca. **Esto NO está implementado en S0** y no
 *     puede estarlo: requiere el registro persistido de S1.
 *
 * `provisionalKey()` NO es identity assignment. Es una clave de contenido sobre
 * la firma RESUELTA, y por lo tanto hereda la contextualidad de la resolución:
 * si cambia el conjunto de firmas visibles, una observación parcial puede
 * resolverse a otra anfitriona y su clave cambia. Medido sobre el corpus
 * congelado de S0 y documentado en `docs/qa/cf-search-011/S0_METRICS.md`.
 *
 * CONSECUENCIA ARQUITECTÓNICA, ya aceptada: la subsunción es válida como
 * RESOLUCIÓN CONTRA UN REGISTRO, y NO es válida para ACUÑAR identidad desde el
 * corpus. En S1 el conjunto de anfitrionas debe ser el registro persistido —
 * estable, independiente de la consulta y de qué farmacias respondieron— y el
 * `CFM-CONCEPT-ID` permanente solo puede acuñarse desde una firma COMPLETA. Una
 * observación parcial resuelve contra el registro o queda sin resolver; nunca
 * acuña un ID permanente. Mientras eso no exista, estas claves son
 * experimentales y no se persisten.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ LA SUBSUNCIÓN ES EL MECANISMO, Y NO OTRA HEURÍSTICA
 * ---------------------------------------------------------------------------
 * v1 solo tiene dos estados por eje: igual o distinto. Con dos estados,
 * "Ambroxol 30 mg 100 ml" (que no declara la razón) y "Ambroxol 30 mg/5 ml
 * Jarabe 100 ml" (que sí la declara) son "distintos", y la única salida es
 * fragmentar. La alternativa —tratar la ausencia como comodín y fusionar— es la
 * que produce falsos merges, y el proyecto ya decidió que el falso merge es
 * riesgo clínico (`PRODUCT_IDENTITY.md` §10).
 *
 * El tercer estado (`subsumable`) rompe ese falso dilema: una firma PARCIAL no
 * es una identidad distinta ni un comodín — es una lectura incompleta que puede
 * pertenecer a una identidad completa. La regla de asignación es la que hace la
 * diferencia:
 *
 *     una firma parcial se asigna a una firma completa SI Y SOLO SI hay
 *     EXACTAMENTE UNA firma completa compatible con ella.
 *
 * Cero candidatos → identidad propia y aislada. Dos o más → **no se elige**: la
 * ambigüedad se registra (`ambiguous`) y la firma parcial conserva identidad
 * propia. Adivinar entre dos candidatos es precisamente "inventar información
 * faltante para completar IDs", que CF-SEARCH-011 §5 prohíbe.
 *
 * ---------------------------------------------------------------------------
 * INDEPENDENCIA DEL ORDEN (requisito duro de CF-SEARCH-011 §6)
 * ---------------------------------------------------------------------------
 * Los candidatos de una firma parcial se buscan SIEMPRE contra el conjunto de
 * firmas completas, que se calcula antes del bucle y no se modifica durante él.
 * Ninguna firma parcial puede convertirse en anfitriona de otra. Por lo tanto el
 * resultado no depende del orden en que llegan las ofertas, ni de qué farmacia
 * respondió primero, ni del precio, ni de la consulta.
 *
 * Consecuencia aceptada y documentada: NO hay subsunción encadenada (parcial A
 * bajo parcial B bajo completa C). Es la dirección conservadora — produce, como
 * mucho, un split de más, nunca un merge de más.
 */

import type {
  AxisComparison,
  ResolutionConfidence,
  ResolutionKind,
  ResolutionTrace,
} from "./canonicalTypes.js";

// ---------------------------------------------------------------------------
// A. CLAVES PROVISIONALES DETERMINISTAS
// ---------------------------------------------------------------------------

/**
 * Hash de 128 bits en JavaScript puro, como dos flujos FNV-1a de 64 bits
 * independientes (distinta base de desplazamiento por flujo).
 *
 * POR QUÉ NO SE USA `node:crypto`: `@comparafarma/domain` se bundlea con Metro
 * para `mobile/`, donde `node:crypto` no existe. Un import de Node acá rompería
 * el bundle de la app publicada. Por eso el hash es aritmética pura sobre
 * `BigInt`, sin dependencias.
 *
 * POR QUÉ 128 BITS Y NO 64: v1 usa FNV-1a de 64 bits truncado a 13 caracteres
 * base36 para los slugs, y CF-SEARCH-010 midió **4 pares de productos con hash
 * compartido** en un corpus de 1.634 ofertas. Un identificador de IDENTIDAD no
 * puede permitirse eso: una colisión ahí no es una URL ambigua, es una fusión
 * silenciosa de dos medicamentos distintos. Con 128 bits la probabilidad de
 * colisión es despreciable para cualquier cardinalidad que este dominio pueda
 * alcanzar, y de todos modos el harness de S0 verifica explícitamente que no
 * haya dos firmas distintas compartiendo ID.
 */
function fnv1a64(text: string, offsetBasis: bigint): bigint {
  const PRIME = 1099511628211n;
  const MASK = 0xffffffffffffffffn;
  let hash = offsetBasis;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i) & 0xff);
    hash = (hash * PRIME) & MASK;
    // El punto de código completo, para que dos textos que solo difieren fuera
    // del rango ASCII no colisionen.
    hash ^= BigInt(text.charCodeAt(i) >>> 8);
    hash = (hash * PRIME) & MASK;
  }
  return hash;
}

const OFFSET_A = 14695981039346656037n;
const OFFSET_B = 9973n;

/**
 * CLAVE PROVISIONAL determinista derivada de una firma.
 *
 *     `PROV-C-<25 chars base36>`   concepto
 *     `PROV-P-…`                    presentación
 *     `PROV-M-…`                    producto comercial
 *     `PROV-O-…`                    oferta
 *
 * EL PREFIJO ES `PROV-`, NO `CFM-`, Y ES DELIBERADO (revisión CTO PR #159,
 * punto 3). El EDM define identificadores PERSISTIDOS y asignados una sola vez
 * (`CFM-C-000123`), que por contrato NUNCA cambian — es lo que permite que un
 * concepto conserve su identidad cuando se corrige un atributo o se enriquece su
 * evidencia. Una clave derivada del contenido hace exactamente lo contrario: si
 * la firma cambia, la clave cambia. Las dos cosas no pueden compartir espacio de
 * nombres sin que alguien acabe persistiendo un hash creyendo que es un ID.
 *
 * QUÉ ES ENTONCES ESTA CLAVE: el subrogado de una FIRMA. Es determinista,
 * reproducible y auditable sin base de datos, que es lo único que los gates de
 * S0 necesitan. En S1, la firma pasa a ser la CLAVE DE BÚSQUEDA contra el
 * registro persistido y el `CFM-*` pasa a ser el subrogado almacenado; ningún
 * consumidor debe haber persistido `PROV-*` antes de eso.
 */
export function provisionalKey(prefix: "C" | "P" | "M" | "O", signature: string): string {
  // El prefijo entra en el texto hasheado, no solo en la cadena final: los
  // cuatro espacios de claves quedan disjuntos incluso si dos niveles llegaran a
  // producir la misma firma textual.
  const payload = `${prefix}:${signature}`;
  const high = fnv1a64(payload, OFFSET_A);
  const low = fnv1a64(payload, OFFSET_B);
  const combined = (high << 64n) | low;
  return `PROV-${prefix}-${combined.toString(36).padStart(25, "0")}`;
}

// ---------------------------------------------------------------------------
// B. FIRMAS
// ---------------------------------------------------------------------------

/**
 * Un eje de una firma de identidad: su nombre, su segmento textual y si el
 * valor está declarado o es desconocido.
 */
export interface SignatureAxis {
  name: string;
  /** Segmento canónico. Debe ser estable ante diferencias irrelevantes de texto. */
  segment: string;
  /** `false` cuando la fuente no declara el valor. */
  known: boolean;
  /**
   * Fuerza de la evidencia: `0` ausente, `1` parcial, `2` completa. Por defecto
   * `known ? 2 : 0`.
   *
   * Existe porque la concentración tiene TRES niveles y no dos: `absent` (0),
   * `mass-only` (1) y `ratio` (2). Sin este grado intermedio, "Ambroxol 30 mg
   * 100 ml" tendría que declararse desconocido —perdiendo la masa que sí
   * declara— o completo —quedando incomparable con "Ambroxol 30 mg/5 ml".
   * Es exactamente la distinción que v1 no puede expresar.
   */
  strength?: number;
  /**
   * Comparador del eje. Por defecto: iguales si los segmentos coinciden,
   * incompatibles si ambos están declarados y difieren, subsumible si uno no lo
   * está. Los ejes con semántica propia (concentración) lo sobreescriben.
   */
  compare?: (other: SignatureAxis) => AxisComparison;
}

/** Fuerza efectiva de un eje. */
export function axisStrength(axis: SignatureAxis): number {
  return axis.strength ?? (axis.known ? 2 : 0);
}

/** Firma completa de un nivel de identidad. */
export interface Signature {
  axes: SignatureAxis[];
}

/** Texto canónico de una firma. Es lo que se hashea y lo que se audita a ojo. */
export function signatureText(signature: Signature): string {
  return signature.axes.map((axis) => `${axis.name}=${axis.segment}`).join("|");
}

/** Ejes cuyo valor no está declarado por la fuente. */
export function unknownAxes(signature: Signature): string[] {
  return signature.axes.filter((axis) => !axis.known).map((axis) => axis.name);
}

/**
 * `true` si `weak` puede ser una lectura incompleta de `strong`.
 *
 * Exige las DOS condiciones, no una:
 *   - ningún eje se contradice (`incompatible` en cualquier eje ⇒ `false`);
 *   - al menos un eje de `weak` es ESTRICTAMENTE más débil que el de `strong`,
 *     y ninguno al revés. Sin esta segunda condición, dos firmas equivalentes se
 *     "subsumirían" mutuamente y la relación dejaría de tener dirección.
 *
 * La relación resultante es un orden parcial estricto: es acíclica, y por lo
 * tanto la resolución no puede entrar en un ciclo de "A se resuelve a B que se
 * resuelve a A".
 */
export function subsumes(weak: Signature, strong: Signature): boolean {
  if (weak.axes.length !== strong.axes.length) return false;

  let hasWeakerAxis = false;
  for (let i = 0; i < weak.axes.length; i++) {
    const a = weak.axes[i]!;
    const b = strong.axes[i]!;
    if (a.name !== b.name) return false;

    const verdict = compareAxis(a, b);
    if (verdict === "incompatible") return false;
    if (verdict === "subsumable") {
      // La dirección importa: `weak` debe ser el lado estrictamente más débil.
      if (axisStrength(a) >= axisStrength(b)) return false;
      hasWeakerAxis = true;
    }
  }
  return hasWeakerAxis;
}

function compareAxis(a: SignatureAxis, b: SignatureAxis): AxisComparison {
  if (a.compare) return a.compare(b);
  if (!a.known || !b.known) return a.segment === b.segment ? "equal" : "subsumable";
  return a.segment === b.segment ? "equal" : "incompatible";
}

// ---------------------------------------------------------------------------
// C. RESOLUCIÓN POR SUBSUNCIÓN
// ---------------------------------------------------------------------------

/** Un elemento a resolver: su firma y el índice de la oferta que la produjo. */
export interface ResolutionItem<T> {
  signature: Signature;
  payload: T;
}

/** Resultado de resolver un elemento. */
export interface ResolvedItem<T> {
  payload: T;
  /** Clave PROVISIONAL (`PROV-*`), no un identificador permanente del EDM. */
  key: string;
  /** Firma bajo la que quedó registrado (la de la anfitriona si hubo subsunción). */
  resolvedSignature: Signature;
  trace: ResolutionTrace;
}

/**
 * Asigna una CLAVE PROVISIONAL a cada elemento resolviéndolo contra el conjunto
 * de firmas recibido. Es RESOLUCIÓN, no acuñación de identidad permanente — ver
 * la cabecera del módulo.
 *
 * ALGORITMO (tres pasos, sin estado mutable compartido entre iteraciones):
 *
 *   1. Se agrupan las ofertas por el texto canónico de su firma. Dos ofertas con
 *      la MISMA firma son, por definición, la misma entidad.
 *   2. Para cada firma se buscan sus ANFITRIONAS: las firmas del conjunto que la
 *      subsumen. De ellas se conservan solo las MAXIMALES —las que no están a su
 *      vez subsumidas por otra candidata—, porque la subsunción es transitiva:
 *      si A ⊂ B ⊂ C, A tiene dos candidatas y sin este filtro se declararía
 *      ambigua cuando en realidad hay un único destino correcto (C).
 *   3. Se decide:
 *        · exactamente 1 candidata maximal → ID de esa anfitriona (`subsumed`);
 *        · 0 candidatas y ningún eje sin declarar → `complete`;
 *        · 0 candidatas con ejes sin declarar    → `isolated`;
 *        · 2 o más candidatas maximales          → `ambiguous`, NUNCA se elige.
 *
 * INDEPENDENCIA DEL ORDEN: el conjunto de firmas se calcula entero antes de
 * decidir nada y no se modifica durante la decisión. El resultado de una oferta
 * no depende de qué farmacia llegó primero, ni del precio, ni de la consulta.
 *
 * CONTEXTO DE RESOLUCIÓN — LA FRONTERA QUE NO SE PUEDE CRUZAR EN S0.
 *
 * La decisión SÍ depende de qué firmas están presentes en el conjunto que se
 * resuelve. Eso es correcto para un RESOLUTOR —un registro más rico resuelve
 * mejor— y es exactamente por eso que la clave resultante NO puede ser una
 * identidad permanente: si el conjunto cambia, la clave de una observación
 * parcial cambia con él.
 *
 * En S0 el harness resuelve el corpus congelado COMPLETO de una vez, que es la
 * simulación más fiel disponible del registro persistido de S1
 * (`SEARCH_ENGINE_V2.md` etapa 3: "¿la firma ya tiene concepto? → recuperar").
 * La estabilidad entre contextos se mide explícitamente, se reporta y se
 * atribuye oferta por oferta en `docs/qa/cf-search-011/S0_METRICS.md`.
 *
 * Lo que SÍ es independiente del contexto, por construcción y verificado en el
 * harness: la firma CRUDA (`rawSignature`) de cada oferta, que solo depende de
 * su propio nombre. La canonicalización es pura; la contextualidad entra
 * únicamente en este paso.
 */
export function resolveBySubsumption<T>(
  prefix: "C" | "P" | "M" | "O",
  items: ResolutionItem<T>[]
): ResolvedItem<T>[] {
  const bySignature = new Map<string, { signature: Signature; items: ResolutionItem<T>[] }>();
  for (const item of items) {
    const text = signatureText(item.signature);
    const bucket = bySignature.get(text);
    if (bucket) bucket.items.push(item);
    else bySignature.set(text, { signature: item.signature, items: [item] });
  }

  const all = [...bySignature.values()];
  const resolved: ResolvedItem<T>[] = [];

  for (const bucket of all) {
    const rawText = signatureText(bucket.signature);
    const missing = unknownAxes(bucket.signature);

    const candidates = all
      .filter((host) => subsumes(bucket.signature, host.signature))
      .map((host) => host.signature);
    const maximal = candidates.filter(
      (candidate) => !candidates.some((other) => other !== candidate && subsumes(candidate, other))
    );

    let kind: ResolutionKind;
    let confidence: ResolutionConfidence;
    let target = bucket.signature;

    if (maximal.length === 1) {
      kind = "subsumed";
      confidence = "medium";
      target = maximal[0]!;
    } else if (maximal.length === 0) {
      kind = missing.length === 0 ? "complete" : "isolated";
      confidence = missing.length === 0 ? "high" : "low";
    } else {
      kind = "ambiguous";
      confidence = "ambiguous";
    }

    const resolvedText = signatureText(target);
    const key = provisionalKey(prefix, resolvedText);
    const trace: ResolutionTrace = {
      signature: resolvedText,
      rawSignature: rawText,
      kind,
      confidence,
      unknownAxes: missing,
      candidateCount: maximal.length,
    };

    for (const item of bucket.items) {
      resolved.push({ payload: item.payload, key, resolvedSignature: target, trace });
    }
  }

  return resolved;
}
