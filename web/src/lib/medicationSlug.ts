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

export function medicationSlugHash(medication: {
  matchKey: string;
  isBioequivalent?: boolean | null;
}): string {
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
