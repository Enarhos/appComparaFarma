/**
 * Search Engine v2 — derivación de identidad canónica (CF-SEARCH-011, S0).
 *
 * DOS PIEZAS, Y SOLO DOS:
 *
 *   1. `canonicalId()` — un identificador determinista derivado de una FIRMA
 *      textual. La firma se conserva íntegra junto al ID (`ResolutionTrace`),
 *      así que "¿por qué estas dos ofertas comparten `productId`?" se responde
 *      comparando dos cadenas legibles, no reejecutando heurísticas.
 *
 *   2. `resolveBySubsumption()` — el ÚNICO mecanismo de resolución del motor v2.
 *      Se aplica igual en los tres niveles (concepto, presentación, producto).
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
// A. IDENTIFICADORES DETERMINISTAS
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
 * Identificador canónico determinista derivado de una firma.
 *
 *     `CFM-C-<26 chars base36>`   concepto
 *     `CFM-P-…`                    presentación
 *     `CFM-M-…`                    producto comercial
 *     `CFM-O-…`                    oferta
 *
 * NOTA DE MIGRACIÓN (no es una decisión de S0). El EDM prevé identificadores
 * PERSISTIDOS y asignados una sola vez (`CFM-C-000123`), no derivados del
 * contenido — es lo que permite que un concepto conserve su ID cuando se corrige
 * un atributo. S0 no tiene registro persistido, así que usa un ID
 * CONTENT-ADDRESSED sobre la firma: es determinista, reproducible y auditable
 * sin base de datos, que es lo que el gate necesita. Cuando S1 introduzca el
 * registro, la FIRMA pasa a ser la clave de búsqueda y el ID pasa a ser el
 * subrogado persistido; el resto del motor no cambia, porque nada depende de la
 * forma del ID.
 */
export function canonicalId(prefix: "C" | "P" | "M" | "O", signature: string): string {
  // El prefijo entra en el texto hasheado, no solo en la cadena final: los
  // cuatro espacios de identificadores del EDM quedan disjuntos incluso si dos
  // niveles llegaran a producir la misma firma textual.
  const payload = `${prefix}:${signature}`;
  const high = fnv1a64(payload, OFFSET_A);
  const low = fnv1a64(payload, OFFSET_B);
  const combined = (high << 64n) | low;
  return `CFM-${prefix}-${combined.toString(36).padStart(25, "0")}`;
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
  id: string;
  /** Firma bajo la que quedó registrado (la de la anfitriona si hubo subsunción). */
  resolvedSignature: Signature;
  trace: ResolutionTrace;
}

/**
 * Asigna un identificador canónico a cada elemento.
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
 * CONTEXTO DE RESOLUCIÓN. La decisión SÍ depende de qué firmas están presentes
 * en el conjunto que se resuelve: es la naturaleza de un registro. En S0 el
 * harness resuelve el corpus congelado COMPLETO de una vez, que es la simulación
 * fiel del registro persistido que S1 introducirá (`SEARCH_ENGINE_V2.md` etapa
 * 3: "¿la firma ya tiene conceptId? → recuperar"). La estabilidad entre
 * contextos se mide explícitamente y se reporta.
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
    const id = canonicalId(prefix, resolvedText);
    const trace: ResolutionTrace = {
      signature: resolvedText,
      rawSignature: rawText,
      kind,
      confidence,
      unknownAxes: missing,
      candidateCount: maximal.length,
    };

    for (const item of bucket.items) {
      resolved.push({ payload: item.payload, id, resolvedSignature: target, trace });
    }
  }

  return resolved;
}
