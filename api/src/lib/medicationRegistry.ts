import { supabase } from "./supabaseClient.js";
import type { MedicationResult } from "./types.js";

// RFC-002 — Canonical Medication Registry (CFM-ID).
// docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md
//
// Adjunta un identificador permanente (`cfmId`) a cada MedicationResult sin
// tocar `matchKey` ni la lógica de `mergeDuplicates` — es una capa de
// identidad que vive por encima del resultado ya fusionado. Sigue el mismo
// patrón de degradación elegante que priceHistoryDb.ts/clickTracking.ts:
// cualquier falla de Supabase (no configurado, tabla ausente, red caída)
// hace que todos los resultados queden con `cfmId: null`, nunca lanza.

const MEDICATIONS_TABLE = "medications";
const ALIASES_TABLE = "medication_match_key_aliases";

// Cache en memoria de proceso — los alias no cambian una vez creados, así
// que solo se paga latencia real la primera vez que un contenedor "warm"
// ve un matchKey específico (mismo trade-off ya aceptado en cache.ts).
const aliasCache = new Map<string, string>(); // matchKey -> cfmId

/** Solo para tests: el cache de módulo persiste entre tests del mismo archivo. */
export function __resetMedicationRegistryCacheForTests(): void {
  aliasCache.clear();
}

export async function attachCanonicalIds(results: MedicationResult[]): Promise<MedicationResult[]> {
  if (!supabase) return results.map((r) => ({ ...r, cfmId: null }));

  try {
    const missing = [...new Set(results.map((r) => r.matchKey).filter((k) => !aliasCache.has(k)))];

    if (missing.length > 0) {
      // Un solo round-trip para todo el batch, no N round-trips.
      const { data, error } = await supabase.from(ALIASES_TABLE).select("match_key, cfm_id").in("match_key", missing);
      if (error) {
        console.warn("medication_match_key_aliases select failed", error.message);
      } else {
        for (const row of data ?? []) aliasCache.set(row.match_key, row.cfm_id);
      }
    }

    const stillMissing = results.filter((r) => !aliasCache.has(r.matchKey));
    if (stillMissing.length > 0) {
      // Batch por matchKey único — evita registrar el mismo matchKey dos
      // veces cuando el mismo medicamento aparece repetido en `results`.
      const uniqueMissing = new Map(stillMissing.map((r) => [r.matchKey, r]));
      await Promise.all([...uniqueMissing.values()].map((r) => registerNew(r)));
    }

    return results.map((r) => ({ ...r, cfmId: aliasCache.get(r.matchKey) ?? null }));
  } catch (err) {
    console.warn("attachCanonicalIds threw", err);
    return results.map((r) => ({ ...r, cfmId: null }));
  }
}

async function registerNew(result: MedicationResult): Promise<void> {
  if (!supabase) return;

  try {
    const { data: med, error } = await supabase
      .from(MEDICATIONS_TABLE)
      .insert({
        canonical_name: result.canonicalName,
        laboratory: result.laboratory,
        is_bioequivalent: result.isBioequivalent,
        match_key_current: result.matchKey,
      })
      .select("cfm_id")
      .single();

    if (error || !med) {
      if (error) console.warn("medications insert failed", error.message);
      return;
    }

    const { error: aliasError } = await supabase
      .from(ALIASES_TABLE)
      .insert({ match_key: result.matchKey, cfm_id: med.cfm_id });

    if (aliasError) {
      // Conflicto de PK: otra invocación paralela registró este matchKey
      // primero. Releemos para usar el cfm_id ganador; la fila de
      // `medications` que insertamos arriba queda huérfana (barato, se
      // limpia en una curación futura — ver R-04 del RFC).
      const { data: winner } = await supabase
        .from(ALIASES_TABLE)
        .select("cfm_id")
        .eq("match_key", result.matchKey)
        .maybeSingle();
      if (winner) aliasCache.set(result.matchKey, winner.cfm_id);
      return;
    }

    aliasCache.set(result.matchKey, med.cfm_id);
  } catch (err) {
    console.warn("registerNew threw", err);
  }
}
