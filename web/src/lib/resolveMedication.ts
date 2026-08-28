import type { MedicationResult } from "@comparafarma/domain";
import { searchMedications } from "@/lib/search";
import {
  buildMedicationSlug,
  medicationSlugHash,
  medicationSlugIdentity,
  parseMedicationSlug,
  presentationKeyWithoutCombination,
  presentationKeyWithoutIdentityAttributes,
  queryFromSlug,
  shortHash,
  slugifyText,
} from "@/lib/medicationSlug";

export type ResolveMedicationResult =
  | { status: "not-found" }
  | { status: "ambiguous"; matches: MedicationResult[] }
  | { status: "ok"; medication: MedicationResult; canonicalSlug: string; needsRedirect: boolean };

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
 *
 * Generaciones de hash soportadas, en orden de intento:
 *   Gen 5 (vigente) — `presentationKey` completa, con `|var:` (variante
 *                     comercial) y `|form:` (forma farmacéutica)
 *                     (CF-SEARCH-001, 2026-08-27).
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
export async function resolveMedicationBySlug(slug: string): Promise<ResolveMedicationResult> {
  const parsed = parseMedicationSlug(slug);
  if (!parsed) return { status: "not-found" };

  const query = queryFromSlug(parsed.humanPart);
  const { results, error } = await searchMedications(query);

  if (error) {
    throw new Error(`No se pudo resolver la ficha del medicamento: ${error}`);
  }

  // Gen 5 (actual) — presentationKey completa: matchKey + bioequivalencia +
  // marca + combinación + variante comercial + forma farmacéutica
  // (`|var:`/`|form:` desde CF-SEARCH-001, 2026-08-27).
  let matches = results.filter((result) => medicationSlugHash(result) === parsed.hash);
  let needsRedirect = false;

  if (matches.length === 0) {
    // Gen 4 — presentationKey SIN `|var:` ni `|form:` (esquema previo a
    // CF-SEARCH-001). Preserva los links emitidos antes de ese cambio, que es
    // prácticamente todo el catálogo indexado.
    const gen4Matches = results.filter(
      (result) =>
        result.presentationKey.length > 0 &&
        shortHash(presentationKeyWithoutIdentityAttributes(result.presentationKey)) === parsed.hash
    );
    const gen4Human = gen4Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen4Human.length > 0 ? gen4Human : gen4Matches;
    if (matches.length > 0) needsRedirect = true;
  }

  if (matches.length === 0) {
    // Gen 3 — presentationKey SIN el segmento `|combo:` (esquema previo a S-1).
    // Solo cambia el hash de los productos de COMBINACIÓN: para el resto del
    // catálogo Gen 4 y Gen 3 son la misma cadena, así que este paso no puede
    // devolver nada nuevo si Gen 4 ya falló. Preserva los links emitidos antes
    // del fix para las combinaciones, que sí rotaron de hash.
    const gen3Matches = results.filter(
      (result) =>
        result.presentationKey.length > 0 &&
        shortHash(presentationKeyWithoutCombination(result.presentationKey)) === parsed.hash
    );
    const gen3Human = gen3Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen3Human.length > 0 ? gen3Human : gen3Matches;
    if (matches.length > 0) needsRedirect = true;
  }

  if (matches.length === 0) {
    // Gen 2 — matchKey + bioequivalencia, sin marca (esquema previo a FASE 1
    // Product Identity, 2026-08-19). Preserva los slugs emitidos entre el fix
    // de bioequivalencia y este cambio.
    const gen2Matches = results.filter((result) => shortHash(medicationSlugIdentity(result)) === parsed.hash);
    const gen2Human = gen2Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen2Human.length > 0 ? gen2Human : gen2Matches;
    if (matches.length > 0) needsRedirect = true;
  }

  if (matches.length === 0) {
    // Gen 1 (legacy) — matchKey a secas, esquema original pre-bioequivalencia.
    const gen1Matches = results.filter((result) => shortHash(result.matchKey) === parsed.hash);
    const gen1Human = gen1Matches.filter((result) => slugifyText(result.canonicalName) === parsed.humanPart);
    matches = gen1Human.length > 0 ? gen1Human : gen1Matches;
    if (matches.length > 0) needsRedirect = true;
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
  return { status: "ok", medication, canonicalSlug: buildMedicationSlug(medication), needsRedirect };
}
