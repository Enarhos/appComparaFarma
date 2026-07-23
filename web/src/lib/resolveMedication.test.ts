import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";
import { shortHash } from "@/lib/medicationSlug";
import { resolveMedicationBySlug } from "./resolveMedication";

const searchMedicationsMock = vi.fn();

vi.mock("@/lib/search", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
}));

function makeMedication(overrides: Partial<MedicationResult> = {}): MedicationResult {
  return {
    matchKey: "paracetamol|500mg|16",
    canonicalName: "Paracetamol 500 mg 16 comprimidos",
    laboratory: "Andrómaco",
    isBioequivalent: true,
    bestPrice: 291,
    bestPharmacy: "easyfarma",
    imageUrl: null,
    prices: [],
    ...overrides,
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

    const slug = `paracetamol-500-mg-16-comprimidos-${shortHash(medication.matchKey)}`;
    const result = await resolveMedicationBySlug(slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(medication);
      expect(result.canonicalSlug).toBe(slug);
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
});
