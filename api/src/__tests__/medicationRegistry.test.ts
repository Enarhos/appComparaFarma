import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult } from "../lib/types.js";

const state = vi.hoisted(() => ({ supabase: null as unknown }));

vi.mock("../lib/supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

import { attachCanonicalIds, __resetMedicationRegistryCacheForTests } from "../lib/medicationRegistry.js";

function makeResult(matchKey: string, canonicalName = "Paracetamol 500 mg x16"): MedicationResult {
  return {
    matchKey,
    canonicalName,
    laboratory: "Laboratorio Chile",
    isBioequivalent: false,
    prices: [],
    bestPrice: 1000,
    bestPharmacy: "cruz-verde",
    imageUrl: null,
  };
}

/**
 * Fake mínimo de Supabase que simula el estado real de las tablas
 * `medications` / `medication_match_key_aliases` lo suficiente para
 * ejercitar attachCanonicalIds sin depender de mockReturnValueOnce
 * encadenados por orden exacto de llamada (frágil con Promise.all).
 */
function makeFakeSupabase(initialAliases: Record<string, string> = {}) {
  const aliases = new Map(Object.entries(initialAliases));
  const winnerOverride = new Map<string, string>();
  const conflictOnInsert = new Set<string>();
  let seq = 0;

  const from = vi.fn((table: string) => {
    if (table === "medication_match_key_aliases") {
      return {
        select: vi.fn(() => ({
          in: vi.fn((_col: string, keys: string[]) => {
            const data = keys.filter((k) => aliases.has(k)).map((k) => ({ match_key: k, cfm_id: aliases.get(k)! }));
            return Promise.resolve({ data, error: null });
          }),
          eq: vi.fn((_col: string, key: string) => ({
            maybeSingle: vi.fn(() => {
              const winnerCfmId = winnerOverride.get(key) ?? aliases.get(key) ?? null;
              return Promise.resolve({ data: winnerCfmId ? { cfm_id: winnerCfmId } : null, error: null });
            }),
          })),
        })),
        insert: vi.fn((row: { match_key: string; cfm_id: string }) => {
          if (conflictOnInsert.has(row.match_key)) {
            return Promise.resolve({ error: { message: "duplicate key value violates unique constraint" } });
          }
          aliases.set(row.match_key, row.cfm_id);
          return Promise.resolve({ error: null });
        }),
      };
    }
    if (table === "medications") {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              seq += 1;
              const cfm_id = `CFM-${String(seq).padStart(6, "0")}`;
              return Promise.resolve({ data: { cfm_id }, error: null });
            }),
          })),
        })),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return { from, aliases, winnerOverride, conflictOnInsert };
}

describe("attachCanonicalIds", () => {
  beforeEach(() => {
    __resetMedicationRegistryCacheForTests();
    state.supabase = null;
  });

  it("con Supabase ausente devuelve cfmId:null para todos y no lanza", async () => {
    const results = await attachCanonicalIds([makeResult("a"), makeResult("b")]);
    expect(results.map((r) => r.cfmId)).toEqual([null, null]);
  });

  it("con matchKey nuevo inserta en medications y en aliases, y retorna el cfm_id generado", async () => {
    const fake = makeFakeSupabase();
    state.supabase = fake;

    const [result] = await attachCanonicalIds([makeResult("paracetamol|500mg|16")]);

    expect(result.cfmId).toBe("CFM-000001");
    expect(fake.aliases.get("paracetamol|500mg|16")).toBe("CFM-000001");
  });

  it("con alias ya existente en cache no hace ningún round-trip nuevo a Supabase", async () => {
    const fake = makeFakeSupabase();
    state.supabase = fake;

    const [first] = await attachCanonicalIds([makeResult("a")]);
    expect(first.cfmId).toBe("CFM-000001");

    const callsBefore = fake.from.mock.calls.length;
    const [second] = await attachCanonicalIds([makeResult("a")]);

    expect(second.cfmId).toBe("CFM-000001");
    expect(fake.from.mock.calls.length).toBe(callsBefore); // sin llamadas nuevas
  });

  it("condición de carrera: si el insert de alias falla, relee y usa el cfm_id ganador (no el propio)", async () => {
    const fake = makeFakeSupabase();
    fake.conflictOnInsert.add("racy");
    fake.winnerOverride.set("racy", "CFM-000777");
    state.supabase = fake;

    const [result] = await attachCanonicalIds([makeResult("racy")]);

    expect(result.cfmId).toBe("CFM-000777");
  });

  it("batchea un solo select para 2+ matchKey nuevos, no N selects individuales", async () => {
    const fake = makeFakeSupabase();
    state.supabase = fake;

    const results = await attachCanonicalIds([makeResult("a"), makeResult("b")]);

    expect(results.map((r) => r.cfmId).sort()).toEqual(["CFM-000001", "CFM-000002"]);

    const selectCalls = fake.from.mock.calls.filter(([table]) => table === "medication_match_key_aliases").length;
    // 1 select (batched, vía .in) + 2 inserts de alias (uno por matchKey nuevo) = 3 llamadas a from() para esa tabla.
    expect(selectCalls).toBe(3);
  });

  it("no lanza si Supabase responde con error en el select de aliases", async () => {
    const fake = makeFakeSupabase();
    fake.from.mockImplementationOnce(
      () =>
        ({
          select: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } })) })),
        }) as unknown as ReturnType<typeof fake.from>
    );
    state.supabase = fake;

    const results = await attachCanonicalIds([makeResult("a")]);
    // El error en el select no debe tumbar la búsqueda — sigue best-effort:
    // intenta registrar como si no hubiera encontrado nada.
    expect(results).toHaveLength(1);
  });
});
