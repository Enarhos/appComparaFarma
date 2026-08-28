import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MedicationResult } from "@comparafarma/domain";
import { bioequivalenceKey } from "@comparafarma/domain";
import { buildMedicationSlug, medicationSlugHash, shortHash, slugifyText } from "@/lib/medicationSlug";
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

  it("returns ambiguous (never picks a winner) when two results share the same hash VIGENTE (Gen 5)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sameMatchKey = "paracetamol|500mg|16";
    const cheap = makeMedication({ matchKey: sameMatchKey, bestPrice: 100, canonicalName: "A" });
    const expensive = makeMedication({ matchKey: sameMatchKey, bestPrice: 999, canonicalName: "B" });
    searchMedicationsMock.mockResolvedValue({ results: [expensive, cheap], error: null });

    // Hash de la generación vigente: ambos resultados comparten
    // `presentationKey`, así que la ambigüedad NO viene de un slug antiguo sino
    // de una anomalía de datos (QA-01, 2026-08-28).
    const slug = `paracetamol-500-mg-16-comprimidos-${medicationSlugHash(cheap)}`;
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

  // ==========================================================================
  // S-1 (SEARCH-MATCHING-QA-01, Gate 2, 2026-08-27) — Gen 4.
  // `presentationKey` ganó el segmento `|combo:` para las COMBINACIONES, así
  // que su hash de slug rotó. Los links viejos de esos productos deben seguir
  // resolviendo (con redirect) en vez de dar 404; el resto del catálogo no
  // debe rotar ni redirigir.
  // ==========================================================================

  it("Caso 12 (S-1) — un slug Gen 3 de una COMBINACIÓN resuelve con needsRedirect al slug Gen 4", async () => {
    const combo = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico Hidroclorotiazida 50/12,5 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida",
    });
    searchMedicationsMock.mockResolvedValue({ results: [combo], error: null });

    // Slug emitido ANTES del fix: mismo texto legible, hash de la clave sin
    // el segmento `|combo:`.
    const gen3Slug = `${slugifyText(combo.canonicalName)}-${shortHash("losartan|50mg|30|bio:false|brand:ascend")}`;
    const gen4Slug = buildMedicationSlug(combo);
    expect(gen3Slug).not.toBe(gen4Slug);

    const result = await resolveMedicationBySlug(gen3Slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(combo);
      expect(result.canonicalSlug).toBe(gen4Slug);
      expect(result.needsRedirect).toBe(true);
    }
  });

  it("Caso 13 (S-1) — el slug Gen 4 de la combinación resuelve directo, sin redirect", async () => {
    const combo = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico Hidroclorotiazida 50/12,5 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida",
    });
    searchMedicationsMock.mockResolvedValue({ results: [combo], error: null });

    const result = await resolveMedicationBySlug(buildMedicationSlug(combo));

    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.needsRedirect).toBe(false);
  });

  it("Caso 14 (S-1) — un producto que NO es combinación no rota de hash ni pide redirect", async () => {
    // El 99% del catálogo: Gen 4 y Gen 3 son la MISMA cadena, así que el slug
    // emitido antes del fix sigue siendo el vigente.
    const mono = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico 50 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 990,
      presentationKey: "losartan|50mg|30|bio:false|brand:ascend",
    });
    searchMedicationsMock.mockResolvedValue({ results: [mono], error: null });

    const slugAntesDelFix = `${slugifyText(mono.canonicalName)}-${shortHash("losartan|50mg|30|bio:false|brand:ascend")}`;
    expect(slugAntesDelFix).toBe(buildMedicationSlug(mono));

    const result = await resolveMedicationBySlug(slugAntesDelFix);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(mono);
      expect(result.needsRedirect).toBe(false);
    }
  });

  it("Caso 15 (S-1) — el slug Gen 3 de la combinación NO resuelve al monofármaco", async () => {
    // Riesgo real del fallback: el monofármaco tiene HOY exactamente la clave
    // que la combinación tenía antes del fix. La cadena debe resolver por Gen 4
    // al monofármaco (su propio slug) y nunca devolver la combinación, ni al
    // revés — si esto se rompe, un link viejo de la combinación llevaría a la
    // ficha del monofármaco, que es el mismo riesgo clínico que S-1 corrige.
    const mono = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico 50 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 990,
      presentationKey: "losartan|50mg|30|bio:false|brand:ascend",
    });
    const combo = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico Hidroclorotiazida 50/12,5 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey: "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida",
    });
    searchMedicationsMock.mockResolvedValue({ results: [mono, combo], error: null });

    const gen3ComboSlug = `${slugifyText(combo.canonicalName)}-${shortHash("losartan|50mg|30|bio:false|brand:ascend")}`;
    const result = await resolveMedicationBySlug(gen3ComboSlug);

    // Gen 4 matchea el MONOFÁRMACO por hash, pero su parte legible es otra;
    // el desempate por texto legible no aplica en Gen 4 (solo en las
    // generaciones legacy), así que se reporta la coincidencia sin inventar un
    // ganador entre productos distintos.
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(mono);
      expect(result.needsRedirect).toBe(false);
      // Nunca devuelve la combinación bajo un hash que ya no es el suyo.
      expect(result.medication).not.toBe(combo);
    }
  });

  it("Caso 16 (CF-SEARCH-001) — un slug Gen 4 resuelve con needsRedirect al slug Gen 5", async () => {
    // A diferencia de S-1 (que solo rotó el hash de las combinaciones),
    // `|form:` está presente en casi todo el catálogo: prácticamente todos los
    // links de ficha ya emitidos entran por esta generación.
    const med = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 500,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral",
    });
    searchMedicationsMock.mockResolvedValue({ results: [med], error: null });

    const gen4Slug = `${slugifyText(med.canonicalName)}-${shortHash("tapsin|6|bio:false|brand:maver")}`;
    const gen5Slug = buildMedicationSlug(med);
    expect(gen4Slug).not.toBe(gen5Slug);

    const result = await resolveMedicationBySlug(gen4Slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(med);
      expect(result.canonicalSlug).toBe(gen5Slug);
      expect(result.needsRedirect).toBe(true);
    }
  });

  it("Caso 17 (CF-SEARCH-001) — el slug Gen 5 vigente resuelve directo, sin redirect", async () => {
    const med = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 500,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral",
    });
    searchMedicationsMock.mockResolvedValue({ results: [med], error: null });

    const result = await resolveMedicationBySlug(buildMedicationSlug(med));

    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.needsRedirect).toBe(false);
  });

  it("Caso 18 (CF-SEARCH-001) — Gen 3 sigue funcionando aunque `|combo:` ya no sea el último segmento", async () => {
    // El patrón de Gen 3 está anclado al FINAL de la cadena; con `|var:`/
    // `|form:` después, había que quitarlos primero o Gen 3 dejaba de
    // recuperar los slugs de las combinaciones.
    const combo = makeMedication({
      matchKey: "losartan|50mg|30",
      canonicalName: "Losartan Potasico Hidroclorotiazida 50/12,5 mg x 30 comprimidos",
      isBioequivalent: false,
      bestPrice: 1990,
      presentationKey:
        "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida|form:solid-oral",
    });
    searchMedicationsMock.mockResolvedValue({ results: [combo], error: null });

    const gen3Slug = `${slugifyText(combo.canonicalName)}-${shortHash("losartan|50mg|30|bio:false|brand:ascend")}`;
    const result = await resolveMedicationBySlug(gen3Slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(combo);
      expect(result.needsRedirect).toBe(true);
    }
  });

  // ==========================================================================
  // QA-01 (auditoría pre-PR de CF-SEARCH-001, 2026-08-28). Un slug de una
  // generación antigua puede matchear 2+ productos porque su identidad se
  // dividió en varias fichas con los ejes `|var:`/`|form:` (medido: 6 de 32
  // grupos divididos). Antes de este fix eso devolvía "ambiguous" y la ficha
  // lanzaba una excepción -> HTTP 500 en una URL potencialmente indexada.
  // Ahora se resuelve como "not-found" (404 limpio + noindex), sin elegir un
  // ganador entre productos DISTINTOS.
  // ==========================================================================

  it("Caso 19 (QA-01) — un slug Gen 4 que tras el split matchea 2 productos devuelve not-found, no ambiguous", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Mismo `presentationKey` Gen 4 ("tapsin|6|bio:false|brand:maver") para los
    // dos: antes de CF-SEARCH-001 eran UNA sola ficha.
    const rojo = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 500,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral",
    });
    const noche = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Noche x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 460,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:noche|form:solid-oral",
    });
    searchMedicationsMock.mockResolvedValue({ results: [rojo, noche], error: null });

    // Slug emitido antes del split, con el texto legible de la ficha unificada
    // (que hoy no coincide con ninguno de los dos nombres actuales).
    const gen4Slug = `tapsin-x-6-comprimidos-maver-${shortHash("tapsin|6|bio:false|brand:maver")}`;
    const result = await resolveMedicationBySlug(gen4Slug);

    expect(result).toEqual({ status: "not-found" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("medication_slug_legacy_ambiguous")
    );
    // No se reporta como colisión de hash: no lo es, y ese evento se usa para
    // detectar anomalías reales de datos.
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("medication_slug_hash_collision")
    );

    consoleErrorSpy.mockRestore();
  });

  it("Caso 20 (QA-01) — tampoco lanza cuando el texto legible del slug antiguo matchea a los 2 productos del split", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Dos farmacias que escriben el producto con el MISMO nombre pero cuya
    // forma farmacéutica difiere: el desempate por `humanPart` no discrimina.
    const comprimidos = makeMedication({
      matchKey: "ibuprofeno|400mg|10",
      canonicalName: "Ibuprofeno 400 mg x 10",
      isBioequivalent: true,
      bestPrice: 990,
      presentationKey: "ibuprofeno|400mg|10|bio:true|brand:mintlab|form:solid-oral",
    });
    const gel = makeMedication({
      matchKey: "ibuprofeno|400mg|10",
      canonicalName: "Ibuprofeno 400 mg x 10",
      isBioequivalent: true,
      bestPrice: 1290,
      presentationKey: "ibuprofeno|400mg|10|bio:true|brand:mintlab|form:topical",
    });
    searchMedicationsMock.mockResolvedValue({ results: [comprimidos, gel], error: null });

    const gen4Slug = `ibuprofeno-400-mg-x-10-${shortHash("ibuprofeno|400mg|10|bio:true|brand:mintlab")}`;

    // Lo que garantiza el fix: la resolución no lanza y no deja que la ficha
    // responda 500 — devuelve un estado manejado.
    await expect(resolveMedicationBySlug(gen4Slug)).resolves.toEqual({ status: "not-found" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("medication_slug_legacy_ambiguous")
    );

    consoleErrorSpy.mockRestore();
  });

  it("Caso 21 (QA-01) — el fix no rompe el desempate por texto legible: si el slug antiguo identifica a UNO, sigue resolviendo con redirect", async () => {
    const rojo = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Rojo Dolor de Cabeza Tira x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 500,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral",
    });
    const noche = makeMedication({
      matchKey: "tapsin|6",
      canonicalName: "Tapsin Noche x 6 comprimidos",
      isBioequivalent: false,
      bestPrice: 460,
      presentationKey: "tapsin|6|bio:false|brand:maver|var:noche|form:solid-oral",
    });
    searchMedicationsMock.mockResolvedValue({ results: [rojo, noche], error: null });

    const gen4Slug = `${slugifyText(rojo.canonicalName)}-${shortHash("tapsin|6|bio:false|brand:maver")}`;
    const result = await resolveMedicationBySlug(gen4Slug);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.medication).toBe(rojo);
      expect(result.canonicalSlug).toBe(buildMedicationSlug(rojo));
      expect(result.needsRedirect).toBe(true);
    }
  });
});
