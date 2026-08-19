import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";
import { bioequivalenceKey } from "@comparafarma/domain";
import { buildMedicationSlug, medicationSlugHash, shortHash } from "@/lib/medicationSlug";
import { resolveMedicationBySlug } from "./resolveMedication";

const searchMedicationsMock = vi.fn();

vi.mock("@/lib/search", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
}));

/**
 * `presentationKey` se recalcula SIEMPRE a partir de `matchKey`/`isBioequivalent`
 * finales (después de aplicar `overrides`) — igual que en producción, donde
 * nunca queda desincronizado del resto del objeto. Se puede forzar un valor
 * explícito pasando `presentationKey` en `overrides`.
 */
function makeMedication(overrides: Partial<MedicationResult> = {}): MedicationResult {
  const base: MedicationResult = {
    matchKey: "paracetamol|500mg|16",
    canonicalName: "Paracetamol 500 mg 16 comprimidos",
    laboratory: "Andrómaco",
    isBioequivalent: true,
    bestPrice: 291,
    bestPharmacy: "easyfarma",
    imageUrl: null,
    presentationKey: "",
    prices: [],
    ...overrides,
  };
  return {
    ...base,
    presentationKey:
      overrides.presentationKey ??
      `${base.matchKey}|bio:${bioequivalenceKey(base.isBioequivalent)}|brand:unknown`,
  };
}

beforeEach(() => {
  searchMedicationsMock.mockReset();
});

describe("resolveMedicationBySlug", () => {
  it("returns not-found for a slug that fails to parse, without calling search", async () => {
    // Sin guión separador -> parseMedicationSlug no puede aislar un sufijo hash.
    const result = await resolveMedicationBySlug("singuionseparador");
    expect(result).toEqual({ status: "not-found" });
    expect(searchMedicationsMock).not.toHaveBeenCalled();
  });

  it("returns not-found when the search returns zero matches", async () => {
    searchMedicationsMock.mockResolvedValue({ results: [], error: null });

    const slug = `paracetamol-500-mg-16-comprimidos-${shortHash("paracetamol|500mg|16")}`;
    const result = await resolveMedicationBySlug(slug);

    expect(result).toEqual({ status: "not-found" });
    expect(searchMedicationsMock).toHaveBeenCalledWith("paracetamol 500 mg 16 comprimidos");
  });

  it("returns ok with exactly one match", async () => {
    const medication = makeMedication();
    searchMedicationsMock.mockResolvedValue({ results: [medication], error: null });

    const slug = buildMedicationSlug(medication);
    const result = await resolveMedicationBySlug(slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(medication);
      expect(result.canonicalSlug).toBe(slug);
    }
  });

  it("resolves bio and non-bio results with the same matchKey to distinct generated slugs", async () => {
    const bio = makeMedication({
      canonicalName: "Paracetamol 500 mg 16 comprimidos",
      isBioequivalent: true,
      bestPrice: 359,
    });
    const nonBio = makeMedication({
      canonicalName: "Paracetamol 500 mg x 16 comprimidos",
      isBioequivalent: false,
      bestPrice: 450,
    });
    searchMedicationsMock.mockResolvedValue({ results: [bio, nonBio], error: null });

    const bioSlug = buildMedicationSlug(bio);
    const nonBioSlug = buildMedicationSlug(nonBio);

    expect(bioSlug).not.toBe(nonBioSlug);
    expect(await resolveMedicationBySlug(bioSlug)).toMatchObject({ status: "ok", medication: bio });
    expect(await resolveMedicationBySlug(nonBioSlug)).toMatchObject({ status: "ok", medication: nonBio });
  });

  it("resolves the legacy paracetamol link by matching the human slug when bio/non-bio share matchKey", async () => {
    const bio = makeMedication({
      canonicalName: "Paracetamol 500 mg 16 comprimidos",
      isBioequivalent: true,
      bestPrice: 359,
    });
    const nonBio = makeMedication({
      canonicalName: "Paracetamol 500 mg x 16 comprimidos",
      isBioequivalent: false,
      bestPrice: 450,
    });
    searchMedicationsMock.mockResolvedValue({ results: [bio, nonBio], error: null });

    const legacySlug = `paracetamol-500-mg-16-comprimidos-${shortHash("paracetamol|500mg|16")}`;
    const result = await resolveMedicationBySlug(legacySlug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(bio);
      expect(result.canonicalSlug).toBe(`paracetamol-500-mg-16-comprimidos-${medicationSlugHash(bio)}`);
    }
  });

  it("returns ambiguous (never picks a winner) when two results share the same hash", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sameMatchKey = "paracetamol|500mg|16";
    const cheap = makeMedication({ matchKey: sameMatchKey, bestPrice: 100, canonicalName: "A" });
    const expensive = makeMedication({ matchKey: sameMatchKey, bestPrice: 999, canonicalName: "B" });
    searchMedicationsMock.mockResolvedValue({ results: [expensive, cheap], error: null });

    const slug = `paracetamol-500-mg-16-comprimidos-${shortHash(sameMatchKey)}`;
    const result = await resolveMedicationBySlug(slug);

    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      // Ambas coincidencias se devuelven, sin elegir una por precio.
      expect(result.matches).toHaveLength(2);
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("medication_slug_hash_collision"));

    consoleErrorSpy.mockRestore();
  });

  it("throws when the underlying search reports an error", async () => {
    searchMedicationsMock.mockResolvedValue({ results: [], error: "No pudimos completar la búsqueda." });

    const slug = `paracetamol-500-mg-16-comprimidos-${shortHash("paracetamol|500mg|16")}`;
    await expect(resolveMedicationBySlug(slug)).rejects.toThrow();
  });

  // ==========================================================================
  // FASE 1 — Product Identity (2026-08-19). Caso real: Omeprazol 20mg x30
  // Ascend vs CuraeSpring comparten matchKey+bio (auditoría P0 Omeprazol).
  // ==========================================================================

  it("Caso 8 — dos marcas con el mismo matchKey+bio generan slugs distintos y ambos resuelven", async () => {
    const ascend = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg x 30 cap...",
      isBioequivalent: false,
      bestPrice: 1490,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:ascend",
    });
    const curaespring = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg 30 Cápsulas con Gránulos",
      isBioequivalent: false,
      bestPrice: 2690,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:curaespring",
    });
    searchMedicationsMock.mockResolvedValue({ results: [ascend, curaespring], error: null });

    const ascendSlug = buildMedicationSlug(ascend);
    const curaespringSlug = buildMedicationSlug(curaespring);

    expect(ascendSlug).not.toBe(curaespringSlug);
    expect(await resolveMedicationBySlug(ascendSlug)).toMatchObject({ status: "ok", medication: ascend });
    expect(await resolveMedicationBySlug(curaespringSlug)).toMatchObject({ status: "ok", medication: curaespring });
  });

  it("Caso 9 — un slug legacy (matchKey a secas, sin bio ni marca) sigue resolviendo", async () => {
    const ascend = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg x 30",
      isBioequivalent: false,
      bestPrice: 1490,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:ascend",
    });
    searchMedicationsMock.mockResolvedValue({ results: [ascend], error: null });

    const legacySlug = `omeprazol-20-mg-x-30-${shortHash("omeprazol|20mg|30")}`;
    const result = await resolveMedicationBySlug(legacySlug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(ascend);
    }
  });
});
