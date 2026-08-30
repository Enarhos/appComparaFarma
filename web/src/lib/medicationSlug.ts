/**
 * Slug legible para /medicamento/[slug]: "{nombre-legible}-{hash}".
 *
 * El slug NO es la identidad canónica del medicamento — esa sigue siendo
 * `matchKey` (packages/domain), igual que en el resto del sistema. El slug
 * es una representación derivada y desechable: se puede recalcular en
 * cualquier momento a partir de un MedicationResult ya resuelto.
 */

const FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

/**
 * FNV-1a de 64 bits (BigInt). Se usa 64 bits — no 32 — porque recodificar un
 * hash de 32 bits en base36 no agrega entropía real; con 64 bits el espacio
 * de salida (~36^12) hace que una colisión entre dos matchKey distintos sea
 * despreciable para el tamaño de catálogo de este proyecto.
 */
function fnv1a64(input: string): bigint {
  let hash = FNV_OFFSET_BASIS_64;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME_64) & MASK_64;
  }
  return hash;
}

/** Sufijo de slug determinístico para un matchKey — 11-13 chars en [0-9a-z]. */
export function shortHash(matchKey: string): string {
  return fnv1a64(matchKey).toString(36);
}

/**
 * Token `|bio:` de `presentationKey` — el ÚNICO segmento cuyo VALOR (no su
 * presencia) cambió con BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30).
 */
const BIO_SEGMENT_PATTERN = /\|bio:(?:true|false|unknown)(?=\||$)/;

const BIO_VALUES = ["true", "false", "unknown"] as const;

function bioequivalenceKey(value: boolean | null | undefined): "true" | "false" | "unknown" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

export function medicationSlugIdentity(medication: {
  matchKey: string;
  isBioequivalent?: boolean | null;
}): string {
  return `${medication.matchKey}|bio:${bioequivalenceKey(medication.isBioequivalent)}`;
}

/**
 * Gen 2 con los otros valores posibles de bioequivalencia — mismo motivo que
 * `presentationKeyBioVariants` (ver más abajo): Gen 2 también incluye el token
 * `|bio:`, así que los slugs emitidos bajo ese esquema rotaron igual.
 */
export function medicationSlugIdentityBioVariants(medication: { matchKey: string }): string[] {
  return BIO_VALUES.map((value) => `${medication.matchKey}|bio:${value}`);
}

/**
 * Segmento `|combo:<segundo principio activo>` que `presentationKey()` agrega
 * al final cuando la oferta es una COMBINACIÓN (S-1, SEARCH-MATCHING-QA-01
 * Gate 2, 2026-08-27 — ver `combinationKey()` en @comparafarma/domain).
 */
const COMBINATION_SEGMENT_PATTERN = /\|combo:[^|]*$/;

/**
 * Segmentos `|var:` (variante comercial) y `|form:` (forma farmacéutica) que
 * `presentationKey()` agrega desde CF-SEARCH-001 (2026-08-27) — ver
 * `productIdentity.ts` en @comparafarma/domain.
 */
const IDENTITY_ATTRIBUTE_SEGMENTS_PATTERN = /\|(?:var|form):[^|]*/g;

/**
 * Gen 6 — variantes de `presentationKey` con los OTROS valores posibles de
 * `|bio:`.
 *
 * BIOEQUIVALENCE-DATA-QUALITY-01 corrigió la semántica del dato en 9 de 9
 * adaptadores: donde la farmacia no informa bioequivalencia, `isBioequivalent`
 * pasó de `false` (una afirmación falsa) a `null`. Eso no cambia la FORMA de
 * `presentationKey` —sigue teniendo su `|bio:`— pero sí su VALOR:
 * `|bio:false` → `|bio:unknown` en la mayoría del catálogo, y `|bio:true` →
 * `|bio:unknown` en las ofertas que venían de la lectura equivocada de
 * Salcobrand. Medido sobre producción real (10 búsquedas, 914 tarjetas,
 * 2026-08-30): **81,7 % de las tarjetas rotan su `presentationKey`** y, con
 * ella, el hash de su slug.
 *
 * Las generaciones existentes (Gen 4/Gen 3) no alcanzan: ellas QUITAN
 * segmentos, y acá el segmento sigue estando con otro valor. Sin esta
 * generación, 4 de cada 5 URLs de ficha ya emitidas (e indexadas) darían 404.
 *
 * A diferencia de las demás generaciones, esta no es una transformación única
 * sino un pequeño conjunto de candidatos: la clave vieja pudo haber tenido
 * `true` o `false` donde hoy hay `unknown`, y no hay forma de saber cuál sin
 * volver a scrapear con el código viejo. Son 2 hashes extra por resultado y
 * por generación — barato y determinista. Se aplica combinado con las
 * transformaciones de Gen 4/Gen 3, porque un link viejo puede necesitar las
 * dos cosas a la vez (haber sido emitido antes de CF-SEARCH-001 Y antes de
 * esta corrección).
 */
export function presentationKeyBioVariants(presentationKey: string): string[] {
  const match = presentationKey.match(BIO_SEGMENT_PATTERN);
  if (!match) return [];
  return BIO_VALUES.map((value) => presentationKey.replace(BIO_SEGMENT_PATTERN, `|bio:${value}`)).filter(
    (candidate) => candidate !== presentationKey
  );
}

/**
 * Gen 4 — `presentationKey` tal como se calculaba ANTES de CF-SEARCH-001, es
 * decir sin `|var:` ni `|form:`.
 *
 * A diferencia de `|combo:` (que solo afecta a las combinaciones), `|form:`
 * está presente en la mayoría del catálogo: esta generación es la que evita
 * que se rompan casi todos los links de ficha ya emitidos.
 */
export function presentationKeyWithoutIdentityAttributes(presentationKey: string): string {
  return presentationKey.replace(IDENTITY_ATTRIBUTE_SEGMENTS_PATTERN, "");
}

/**
 * Gen 3 — `presentationKey` tal como se calculaba ANTES de S-1, es decir sin el
 * segmento `|combo:`. Se usa solo para resolver slugs emitidos antes de ese fix.
 *
 * Por diseño, S-1 agrega el segmento al FINAL y únicamente a las combinaciones:
 * para todo el resto del catálogo esta función devuelve la cadena idéntica y el
 * hash del slug NO rota. El único conjunto de URLs afectado es el de los
 * productos de combinación, que es justamente el que esta generación cubre.
 *
 * CF-SEARCH-001: se quitan primero `|var:`/`|form:`, porque el patrón de
 * `|combo:` está anclado al FINAL de la cadena y esos segmentos ahora van
 * después. Sin ese paso previo, Gen 3 dejaría de recuperar los slugs de las
 * combinaciones.
 */
export function presentationKeyWithoutCombination(presentationKey: string): string {
  return presentationKeyWithoutIdentityAttributes(presentationKey).replace(
    COMBINATION_SEGMENT_PATTERN,
    ""
  );
}

/**
 * FASE 1 — Product Identity (2026-08-19): cuando el `MedicationResult` trae
 * `presentationKey` (matchKey + bioequivalencia + marca — ver
 * commercialIdentity.ts en @comparafarma/domain), el slug se calcula sobre
 * esa identidad completa, para que dos marcas distintas con el mismo
 * matchKey+bio (ej. Ascend vs CuraeSpring de Omeprazol 20mg x30) generen
 * slugs distintos y cada una resuelva a su propia ficha — ver
 * resolveMedication.ts para la cadena de fallback hacia slugs antiguos.
 *
 * S-1 (2026-08-27) no cambió esta función: `presentationKey` sigue siendo la
 * identidad de slug vigente, ahora con el segmento `|combo:` para las
 * combinaciones (Gen 4).
 */
export function medicationSlugHash(medication: {
  matchKey: string;
  isBioequivalent?: boolean | null;
  presentationKey?: string;
}): string {
  if (medication.presentationKey) return shortHash(medication.presentationKey);
  return shortHash(medicationSlugIdentity(medication));
}

/** NFD + strip acentos, minúsculas, no-alfanumérico -> guión, sin guiones dobles/extremos. */
export function slugifyText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildMedicationSlug(medication: {
  canonicalName: string;
  matchKey: string;
  isBioequivalent?: boolean | null;
}): string {
  const human = slugifyText(medication.canonicalName) || "medicamento";
  return `${human}-${medicationSlugHash(medication)}`;
}

export interface ParsedMedicationSlug {
  humanPart: string;
  hash: string;
}

const HASH_PATTERN = /^[0-9a-z]+$/;
const HUMAN_PART_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Separa un slug en su parte legible y su hash. Devuelve null si el slug no
 * tiene la forma esperada (sin guión separador, hash con caracteres fuera de
 * [0-9a-z], o parte legible vacía/mal formada).
 */
export function parseMedicationSlug(slug: string): ParsedMedicationSlug | null {
  const lastDash = slug.lastIndexOf("-");
  if (lastDash <= 0 || lastDash === slug.length - 1) return null;

  const humanPart = slug.slice(0, lastDash);
  const hash = slug.slice(lastDash + 1);

  if (!HASH_PATTERN.test(hash)) return null;
  if (!HUMAN_PART_PATTERN.test(humanPart)) return null;

  return { humanPart, hash };
}

/** Reconstruye un texto de búsqueda a partir de la parte legible de un slug. */
export function queryFromSlug(humanPart: string): string {
  return humanPart.replace(/-/g, " ");
}
