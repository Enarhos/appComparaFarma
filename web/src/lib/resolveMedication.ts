import type { MedicationResult } from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";
import {
  buildMedicationSlug,
  medicationSlugHash,
  medicationSlugIdentity,
  parseMedicationSlug,
  queryFromSlug,
  shortHash,
  slugifyText,
} from "@/lib/medicationSlug";

export type ResolveMedicationResult =
  | { status: "not-found" }
  | { status: "ambiguous"; matches: MedicationResult[] }
  | { status: "ok"; medication: MedicationResult; canonicalSlug: string };

/**
 * Resuelve un slug de /medicamento/[slug] a un MedicationResult, sin ninguna
 * tabla de persistencia (deliberado — ver Sprint 2, sin CFM-ID todavía).
 *
 * Cómo funciona: la parte legible del slug se reconstruye como texto de
 * búsqueda y se ejecuta contra /api/search (misma función que usa
 * /buscar/[query], sin ningún endpoint nuevo). De los resultados, se toma
 * el que tiene el mismo hash de matchKey que el sufijo del slug.
 *
 * Límite conocido y aceptado (sin persistencia no hay forma de evitarlo):
 * un slug viejo solo sigue resolviendo si su parte legible, buscada de
 * nuevo hoy, todavía devuelve entre los resultados un medicamento cuyo
 * matchKey hashea al mismo sufijo. Si el texto ya no encuentra nada (la
 * farmacia reescribió el nombre lo suficiente, o el producto se dio de
 * baja), el link se rompe — no hay reindexación ni fallback posible sin
 * un registro persistido (ese es exactamente el rol futuro de CFM-ID /
 * RFC-002, fuera de alcance de este sprint).
 *
 * Si el hash del slug matchea más de un resultado (colisión, o dos
 * variantes del mismo matchKey en la misma búsqueda), NUNCA se elige un
 * ganador por precio, farmacia u orden — se reporta como "ambiguous" y
 * queda registrado en los logs para investigar.
 */
export async function resolveMedicationBySlug(slug: string): Promise<ResolveMedicationResult> {
  const parsed = parseMedicationSlug(slug);
  if (!parsed) return { status: "not-found" };

  const query = queryFromSlug(parsed.humanPart);
  const { results, error } = await searchMedications(query);

  if (error) {
    throw new Error(`No se pudo resolver la ficha del medicamento: ${error}`);
  }

  // Gen 3 (actual) — matchKey + bioequivalencia + marca (presentationKey).
  let matches = results.filter((result) => medicationSlugHash(result) === parsed.hash);

  if (matches.length === 0) {
    // Gen 2 — matchKey + bioequivalencia, sin marca (esquema previo a FASE 1
    // Product Identity, 2026-08-19). Preserva los slugs emitidos entre el fix
    // de bioequivalencia y este cambio.
    const gen2Matches = results.filter((result) => shortHash(medicationSlugIdentity(result)) === parsed.hash);
    const gen2Human = gen2Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen2Human.length > 0 ? gen2Human : gen2Matches;
  }

  if (matches.length === 0) {
    // Gen 1 (legacy) — matchKey a secas, esquema original pre-bioequivalencia.
    const gen1Matches = results.filter((result) => shortHash(result.matchKey) === parsed.hash);
    const gen1Human = gen1Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen1Human.length > 0 ? gen1Human : gen1Matches;
  }

  if (matches.length === 0) {
    return { status: "not-found" };
  }

  if (matches.length > 1) {
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
  return { status: "ok", medication, canonicalSlug: buildMedicationSlug(medication) };
}
