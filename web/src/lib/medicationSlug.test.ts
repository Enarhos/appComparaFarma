import { describe, it, expect } from "vitest";
import {
  buildMedicationSlug,
  medicationSlugHash,
  medicationSlugIdentity,
  medicationSlugIdentityBioVariants,
  parseMedicationSlug,
  presentationKeyBioVariants,
  presentationKeyWithoutCombination,
  presentationKeyWithoutIdentityAttributes,
  queryFromSlug,
  shortHash,
  slugifyText,
} from "./medicationSlug";

describe("shortHash", () => {
  it("is deterministic for the same input", () => {
    expect(shortHash("paracetamol|500mg|20")).toBe(shortHash("paracetamol|500mg|20"));
  });

  it("produces a base36-looking string of the expected length range (64-bit FNV-1a)", () => {
    const hash = shortHash("paracetamol|500mg|20");
    expect(hash).toMatch(/^[0-9a-z]+$/);
    expect(hash.length).toBeGreaterThanOrEqual(10);
    expect(hash.length).toBeLessThanOrEqual(13);
  });

  it("is sensitive to small differences in the input (single character)", () => {
    expect(shortHash("paracetamol|500mg|20")).not.toBe(shortHash("paracetamol|500mg|21"));
    expect(shortHash("paracetamol|500mg|d")).not.toBe(shortHash("paracetamol|500mg|n"));
  });

  it("produces distinct suffixes for distinct matchKey fixtures", () => {
    const matchKeys = [
      "paracetamol|500mg|20",
      "paracetamol|500mg",
      "ibuprofeno|400mg",
      "paracetamol|500mg|d",
      "paracetamol|500mg|n",
      "amoxicilina|500mg",
    ];
    const hashes = matchKeys.map(shortHash);
    expect(new Set(hashes).size).toBe(matchKeys.length);
  });
});

describe("slugifyText", () => {
  it("strips accents and lowercases", () => {
    expect(slugifyText("Losartán Potásico")).toBe("losartan-potasico");
  });

  it("collapses non-alphanumeric runs and trims edge hyphens", () => {
    expect(slugifyText("Ácido Acetilsalicílico 500 mg (Bioequivalente)")).toBe(
      "acido-acetilsalicilico-500-mg-bioequivalente"
    );
  });

  it("handles very long names without throwing and stays within a-z0-9-", () => {
    const longName = "A".repeat(300) + " 500 mg";
    const slug = slugifyText(longName);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeGreaterThan(0);
  });
});

describe("buildMedicationSlug", () => {
  it("joins the slugified name and the hash with a single hyphen", () => {
    const medication = {
      canonicalName: "Paracetamol 500 mg 16 comprimidos",
      matchKey: "paracetamol|500mg|16",
      isBioequivalent: true,
    };
    const slug = buildMedicationSlug(medication);
    expect(slug).toBe(`paracetamol-500-mg-16-comprimidos-${medicationSlugHash(medication)}`);
  });

  it("includes bioequivalence classification in the stable hash identity", () => {
    const base = { canonicalName: "Paracetamol 500 mg 16 comprimidos", matchKey: "paracetamol|500mg|16" };

    expect(medicationSlugIdentity({ ...base, isBioequivalent: true })).toBe("paracetamol|500mg|16|bio:true");
    expect(medicationSlugHash({ ...base, isBioequivalent: true })).not.toBe(
      medicationSlugHash({ ...base, isBioequivalent: false })
    );
    expect(medicationSlugHash({ ...base, isBioequivalent: false })).not.toBe(
      medicationSlugHash({ ...base, isBioequivalent: null })
    );
  });
});

describe("medicationSlugHash — FASE 1 Product Identity (2026-08-19)", () => {
  it("usa presentationKey cuando está presente, en vez de reconstruir matchKey+bio", () => {
    const withPresentationKey = { matchKey: "omeprazol|20mg|30", isBioequivalent: false, presentationKey: "omeprazol|20mg|30|bio:false|brand:ascend" };
    expect(medicationSlugHash(withPresentationKey)).toBe(shortHash("omeprazol|20mg|30|bio:false|brand:ascend"));
  });

  it("Ascend vs CuraeSpring (mismo matchKey+bio) producen hashes distintos vía presentationKey", () => {
    const ascend = { matchKey: "omeprazol|20mg|30", isBioequivalent: false, presentationKey: "omeprazol|20mg|30|bio:false|brand:ascend" };
    const curaespring = { matchKey: "omeprazol|20mg|30", isBioequivalent: false, presentationKey: "omeprazol|20mg|30|bio:false|brand:curaespring" };
    expect(medicationSlugHash(ascend)).not.toBe(medicationSlugHash(curaespring));
  });

  it("sin presentationKey, cae al esquema previo (matchKey+bio) — compatibilidad con llamadas existentes", () => {
    const legacyShape = { matchKey: "paracetamol|500mg|16", isBioequivalent: true };
    expect(medicationSlugHash(legacyShape)).toBe(shortHash(medicationSlugIdentity(legacyShape)));
  });
});

describe("parseMedicationSlug", () => {
  it("parses a valid slug into human part and hash", () => {
    const parsed = parseMedicationSlug("paracetamol-500-mg-16-comprimidos-3fe2cyydzh2fb");
    expect(parsed).toEqual({ humanPart: "paracetamol-500-mg-16-comprimidos", hash: "3fe2cyydzh2fb" });
  });

  it("returns null when there is no separating hyphen", () => {
    expect(parseMedicationSlug("paracetamol")).toBeNull();
  });

  it("returns null when the hash segment has invalid characters", () => {
    expect(parseMedicationSlug("paracetamol-500mg-ABC123")).toBeNull();
  });

  it("returns null when the human part is empty", () => {
    expect(parseMedicationSlug("-3fe2cyydzh2fb")).toBeNull();
  });

  it("returns null when the slug ends with a trailing hyphen", () => {
    expect(parseMedicationSlug("paracetamol-500mg-")).toBeNull();
  });
});

describe("queryFromSlug", () => {
  it("turns hyphens back into spaces", () => {
    expect(queryFromSlug("paracetamol-500-mg-16-comprimidos")).toBe("paracetamol 500 mg 16 comprimidos");
  });
});

/**
 * S-1 (SEARCH-MATCHING-QA-01, Gate 2, 2026-08-27) — `presentationKey` ganó el
 * segmento `|combo:` para las combinaciones, así que el hash del slug (Gen 4)
 * rota SOLO para ellas. Gen 3 es la misma clave sin ese segmento.
 */
describe("presentationKeyWithoutCombination — Gen 3 (previa a S-1)", () => {
  const combo = "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida";
  const mono = "losartan|50mg|30|bio:false|brand:ascend";

  it("quita el segmento |combo: de una combinación", () => {
    expect(presentationKeyWithoutCombination(combo)).toBe(mono);
  });

  it("deja intacta la clave de un producto que no es combinación", () => {
    // Garantía central del diseño: sin rotación de slugs para el catálogo que
    // no es combinación.
    for (const key of [
      "paracetamol|500mg|16|bio:true|brand:andromaco",
      "omeprazol|20mg|30|bio:false|brand:ascend",
      "ibuprofeno|400mg|20|bio:unknown|brand:unknown",
    ]) {
      expect(presentationKeyWithoutCombination(key)).toBe(key);
      expect(shortHash(presentationKeyWithoutCombination(key))).toBe(shortHash(key));
    }
  });

  it("una combinación cambia de hash respecto de Gen 3; un monofármaco no", () => {
    expect(shortHash(combo)).not.toBe(shortHash(presentationKeyWithoutCombination(combo)));
    expect(medicationSlugHash({ matchKey: "losartan|50mg|30", isBioequivalent: false, presentationKey: mono })).toBe(
      shortHash(mono)
    );
  });

  it("solo quita el segmento final, nunca una marca que contenga el texto", () => {
    // `brand:` se normaliza a [a-z0-9] y va antes que `combo:`; el patrón está
    // anclado al final para no comerse nada más.
    const key = "x|bio:false|brand:combolabs";
    expect(presentationKeyWithoutCombination(key)).toBe(key);
  });

  it("CF-SEARCH-001: sigue recuperando Gen 3 cuando |combo: ya no es el último segmento", () => {
    // El patrón de `|combo:` está anclado al FINAL; con `|var:`/`|form:`
    // detrás, sin quitarlos primero Gen 3 dejaba de resolver las
    // combinaciones.
    expect(
      presentationKeyWithoutCombination(
        "losartan|50mg|30|bio:false|brand:ascend|combo:hidroclorotiazida|form:solid-oral"
      )
    ).toBe(mono);
  });
});

/**
 * CF-SEARCH-001 (2026-08-27) — `presentationKey` incorpora `|var:` (variante
 * comercial) y `|form:` (forma farmacéutica). A diferencia de `|combo:`,
 * `|form:` está presente en casi todo el catálogo, así que Gen 4 es la
 * generación que sostiene los links ya emitidos.
 */
describe("presentationKeyWithoutIdentityAttributes — Gen 4 (previa a CF-SEARCH-001)", () => {
  it("quita |var: y |form: conservando el resto de la clave", () => {
    expect(
      presentationKeyWithoutIdentityAttributes("tapsin|6|bio:false|brand:maver|var:rojo|form:solid-oral")
    ).toBe("tapsin|6|bio:false|brand:maver");
    expect(presentationKeyWithoutIdentityAttributes("tapsin|6|bio:false|brand:maver|form:solid-oral")).toBe(
      "tapsin|6|bio:false|brand:maver"
    );
  });

  it("deja intacta una clave sin esos segmentos", () => {
    const key = "paracetamol|500mg|16|bio:true|brand:andromaco";
    expect(presentationKeyWithoutIdentityAttributes(key)).toBe(key);
  });

  it("no toca una marca que contenga literalmente 'var' o 'form'", () => {
    const key = "x|bio:false|brand:varifarma";
    expect(presentationKeyWithoutIdentityAttributes(key)).toBe(key);
    const key2 = "x|bio:false|brand:formulab";
    expect(presentationKeyWithoutIdentityAttributes(key2)).toBe(key2);
  });

  it("el hash rota cuando hay atributos nuevos y no rota cuando no los hay", () => {
    const conForma = "tapsin|6|bio:false|brand:maver|form:solid-oral";
    expect(shortHash(conForma)).not.toBe(shortHash(presentationKeyWithoutIdentityAttributes(conForma)));

    const sinForma = "tapsin|6|bio:false|brand:maver";
    expect(shortHash(sinForma)).toBe(shortHash(presentationKeyWithoutIdentityAttributes(sinForma)));
  });
});

/**
 * BIOEQUIVALENCE-DATA-QUALITY-01 (2026-08-30) — Gen 6-bio.
 *
 * La corrección semántica de los adaptadores no cambia la FORMA de
 * `presentationKey` sino el VALOR de su token `|bio:`. Estas son las variantes
 * que permiten seguir resolviendo los slugs ya emitidos.
 */
describe("presentationKeyBioVariants", () => {
  it("devuelve las otras dos variantes de `|bio:`, sin repetir la vigente", () => {
    const actual = "atorvastatina|20mg|30|bio:unknown|brand:unknown|form:solid-oral";
    expect(presentationKeyBioVariants(actual).sort()).toEqual(
      [
        "atorvastatina|20mg|30|bio:false|brand:unknown|form:solid-oral",
        "atorvastatina|20mg|30|bio:true|brand:unknown|form:solid-oral",
      ].sort()
    );
  });

  it("sustituye solo el token `|bio:` y deja intactos `|combo:`, `|var:` y `|form:`", () => {
    const actual =
      "losartan|50mg|30|bio:unknown|brand:ascend|combo:hidroclorotiazida|var:forte|form:solid-oral";
    for (const variant of presentationKeyBioVariants(actual)) {
      expect(variant).toContain("|combo:hidroclorotiazida");
      expect(variant).toContain("|var:forte");
      expect(variant).toContain("|form:solid-oral");
      expect(variant).toContain("|brand:ascend");
      expect(variant.startsWith("losartan|50mg|30|bio:")).toBe(true);
    }
  });

  it("no toca un valor de marca que contenga la palabra `bio`", () => {
    // `|bio:` se ancla al inicio de segmento y a uno de los tres valores
    // válidos: una marca como "biosano" no puede confundirse con el token.
    const actual = "omeprazol|20mg|30|bio:unknown|brand:biosano";
    for (const variant of presentationKeyBioVariants(actual)) {
      expect(variant).toContain("|brand:biosano");
    }
    expect(presentationKeyBioVariants(actual)).toHaveLength(2);
  });

  it("devuelve vacío si la clave no tiene token `|bio:` (nada que recuperar)", () => {
    expect(presentationKeyBioVariants("paracetamol|500mg|16")).toEqual([]);
    expect(presentationKeyBioVariants("")).toEqual([]);
  });

  it("cada variante produce un hash distinto — es exactamente la rotación a compensar", () => {
    const actual = "atorvastatina|20mg|30|bio:unknown|brand:unknown|form:solid-oral";
    const hashes = [actual, ...presentationKeyBioVariants(actual)].map(shortHash);
    expect(new Set(hashes).size).toBe(3);
  });
});

describe("medicationSlugIdentityBioVariants (Gen 2)", () => {
  it("cubre los tres valores posibles del token, incluida la identidad vigente", () => {
    expect(medicationSlugIdentityBioVariants({ matchKey: "paracetamol|500mg|16" })).toEqual([
      "paracetamol|500mg|16|bio:true",
      "paracetamol|500mg|16|bio:false",
      "paracetamol|500mg|16|bio:unknown",
    ]);
  });

  it("incluye siempre la identidad Gen 2 que produce `medicationSlugIdentity`", () => {
    const medication = { matchKey: "paracetamol|500mg|16", isBioequivalent: null };
    expect(medicationSlugIdentityBioVariants(medication)).toContain(
      medicationSlugIdentity(medication)
    );
  });
});
