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
      expect(result.needsRedirect).toBe(true);
    }
  });

  // ==========================================================================
  // Bugfix 2026-08-19 — OPKO_DETAIL_REDIRECT_LOOP (ficha de Omeprazol/OPKO
  // colgada indefinidamente en "Cargando ficha del medicamento..."). Ver
  // informe de diagnóstico. Causa raíz: mergeDuplicates() en
  // packages/domain/src/deduplication.ts puede elegir un canonicalName
  // distinto entre una búsqueda y la siguiente para el MISMO presentationKey
  // (según qué farmacias respondieron a tiempo, Promise.allSettled). Antes
  // del fix, page.tsx redirigía SIEMPRE que canonicalSlug !== slug, aunque
  // la diferencia fuera puramente el texto legible (mismo hash Gen 3) — eso
  // producía un loop infinito de permanentRedirect. Estos casos deben FALLAR
  // sin el campo/lógica needsRedirect.
  // ==========================================================================

  it("Caso 10 (OPKO) — match Gen 3 (presentationKey) con canonicalName distinto al de cuando se generó el slug NO pide redirect", async () => {
    // El slug fue generado en una búsqueda anterior con esta variante de texto...
    const opkoAtSlugTime = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg 30 Cápsulas OPKO",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:opko",
    });
    const requestedSlug = buildMedicationSlug(opkoAtSlugTime);

    // ...pero cuando se resuelve, mergeDuplicates() esta vez produjo OTRO
    // texto de canonicalName para el MISMO presentationKey (mismo hash Gen 3).
    const opkoAtResolveTime = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg x 30 comprimidos - OPKO",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:opko",
    });
    searchMedicationsMock.mockResolvedValue({ results: [opkoAtResolveTime], error: null });

    const result = await resolveMedicationBySlug(requestedSlug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(opkoAtResolveTime);
      // El hash (identidad Gen 3) coincide, pero el texto legible difiere ->
      // canonicalSlug distinto del slug pedido, PERO sin pedir redirect.
      expect(result.canonicalSlug).not.toBe(requestedSlug);
      expect(result.needsRedirect).toBe(false);
    }
  });

  it("Caso 11 (OPKO) — el ping-pong de canonicalName entre dos búsquedas ya no dispara redirect en ninguna dirección", async () => {
    const variantA = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg 30 Cápsulas OPKO",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:opko",
    });
    const variantB = makeMedication({
      matchKey: "omeprazol|20mg|30",
      canonicalName: "Omeprazol 20 mg x 30 comprimidos - OPKO",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "omeprazol|20mg|30|bio:false|brand:opko",
    });
    const slugA = buildMedicationSlug(variantA);
    const slugB = buildMedicationSlug(variantB);
    expect(slugA).not.toBe(slugB); // mismo hash, distinta parte legible

    // Hop 1: se pide slugA, pero la búsqueda esta vez devuelve la variante B.
    searchMedicationsMock.mockResolvedValueOnce({ results: [variantB], error: null });
    const hop1 = await resolveMedicationBySlug(slugA);
    expect(hop1.status).toBe("ok");
    if (hop1.status === "ok") expect(hop1.needsRedirect).toBe(false);

    // Hop 2: se pide slugB, y la búsqueda esta vez devuelve la variante A.
    // Sin el fix, esto habría disparado un permanentRedirect de vuelta a slugA,
    // y viceversa indefinidamente. Con el fix, ninguno de los dos hops pide redirect.
    searchMedicationsMock.mockResolvedValueOnce({ results: [variantA], error: null });
    const hop2 = await resolveMedicationBySlug(slugB);
    expect(hop2.status).toBe("ok");
    if (hop2.status === "ok") expect(hop2.needsRedirect).toBe(false);
  });
});
