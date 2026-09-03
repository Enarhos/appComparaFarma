/**
 * CF-SEARCH-012 (S1) — SEGURIDAD OPERATIVA DEL SHADOW.
 *
 * Estos tests no verifican que v2 acierte: verifican que v2 NO PUEDA HACER
 * DAÑO. Son el contrato de "v1 es la única fuente de verdad visible":
 *
 *   · apagado por defecto;
 *   · el kill switch gana siempre;
 *   · el muestreo es determinista y monótono;
 *   · un fallo del registro no rompe nada y no reintenta;
 *   · el shadow no devuelve nada esperable desde la ruta.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getShadowConfig,
  isSampled,
  SHADOW_CONFIG_KEY,
} from "../lib/searchV2ShadowConfig.js";
import { getWaitUntil, runAfterResponse, withTimeout } from "../lib/afterResponse.js";
import { runShadowIdentityAssignment } from "../services/searchV2Shadow.js";
import { canonicalizeOffer, InMemoryCanonicalRegistry } from "@comparafarma/domain/searchV2";
import type {
  CanonicalRegistryRepository,
  ObservationInput,
} from "@comparafarma/domain/searchV2";

const ENV_KEYS = [
  "SEARCH_V2_SHADOW_KILL",
  "SEARCH_V2_SHADOW_ENABLED",
  "SEARCH_V2_SHADOW_SAMPLE_RATE",
] as const;

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

describe("interruptor — apagado por defecto", () => {
  it("sin ninguna configuración, el shadow está APAGADO", async () => {
    const config = await getShadowConfig();
    expect(config.enabled).toBe(false);
    expect(config.sampleRate).toBe(0);
  });

  it("el kill switch gana aunque la env var lo habilite", async () => {
    process.env.SEARCH_V2_SHADOW_ENABLED = "true";
    process.env.SEARCH_V2_SHADOW_SAMPLE_RATE = "1";
    process.env.SEARCH_V2_SHADOW_KILL = "true";

    const config = await getShadowConfig();
    expect(config.enabled).toBe(false);
    expect(config.sampleRate).toBe(0);
    expect(config.source).toBe("kill-switch");
  });

  it("`enabled` distinto de la cadena exacta 'true' no enciende nada", async () => {
    for (const value of ["1", "TRUE", "yes", "", "false"]) {
      process.env.SEARCH_V2_SHADOW_ENABLED = value;
      const config = await getShadowConfig();
      expect(config.enabled).toBe(false);
    }
  });

  it("una tasa de muestreo sin `enabled` no observa nada", async () => {
    process.env.SEARCH_V2_SHADOW_SAMPLE_RATE = "1";
    const config = await getShadowConfig();
    expect(config.enabled).toBe(false);
    expect(config.sampleRate).toBe(0);
  });

  it("la clave de configuración operativa es la que documenta el esquema", () => {
    expect(SHADOW_CONFIG_KEY).toBe("search_v2_shadow");
  });
});

describe("muestreo determinista", () => {
  it("0 no observa nada y 1 observa todo", () => {
    for (const key of ["a", "b", "paracetamol", "ibuprofeno 400mg"]) {
      expect(isSampled(key, 0)).toBe(false);
      expect(isSampled(key, 1)).toBe(true);
    }
  });

  it("la misma clave cae siempre del mismo lado", () => {
    const first = isSampled("paracetamol 500mg", 0.5);
    for (let i = 0; i < 50; i++) {
      expect(isSampled("paracetamol 500mg", 0.5)).toBe(first);
    }
  });

  it("subir la tasa AMPLÍA el conjunto observado, no lo baraja", () => {
    const keys = Array.from({ length: 500 }, (_, i) => `consulta-${i}`);
    const at10 = new Set(keys.filter((k) => isSampled(k, 0.1)));
    const at50 = new Set(keys.filter((k) => isSampled(k, 0.5)));
    const at100 = new Set(keys.filter((k) => isSampled(k, 1)));

    for (const key of at10) expect(at50.has(key)).toBe(true);
    for (const key of at50) expect(at100.has(key)).toBe(true);
    // Y la proporción es aproximadamente la pedida.
    expect(at10.size).toBeGreaterThan(20);
    expect(at10.size).toBeLessThan(80);
  });

  it("no depende del ranking, del precio ni del número de resultados", () => {
    // La firma de `isSampled` solo admite el texto de la consulta: la
    // independencia es estructural. Este test la fija como contrato.
    expect(isSampled.length).toBe(2);
  });
});

describe("ejecución después de responder", () => {
  it("sin runtime de Vercel, el modo es `detached` y no lanza", () => {
    expect(getWaitUntil()).toBeNull();
    const mode = runAfterResponse(async () => undefined);
    expect(mode).toBe("detached");
  });

  it("usa `waitUntil` del runtime cuando existe, sin dependencia nueva", () => {
    const seen: Promise<unknown>[] = [];
    const symbol = Symbol.for("@vercel/request-context");
    (globalThis as Record<symbol, unknown>)[symbol] = {
      get: () => ({ waitUntil: (p: Promise<unknown>) => seen.push(p) }),
    };
    try {
      expect(getWaitUntil()).not.toBeNull();
      const mode = runAfterResponse(async () => undefined);
      expect(mode).toBe("waitUntil");
      expect(seen).toHaveLength(1);
    } finally {
      delete (globalThis as Record<symbol, unknown>)[symbol];
    }
  });

  it("un rechazo de la tarea NUNCA escapa", async () => {
    const errors: unknown[] = [];
    runAfterResponse(async () => {
      throw new Error("boom");
    }, (e) => errors.push(e));
    await new Promise((r) => setTimeout(r, 5));
    expect(errors).toHaveLength(1);
  });

  it("un `throw` SÍNCRONO dentro de la tarea tampoco escapa", () => {
    const errors: unknown[] = [];
    expect(() =>
      runAfterResponse(() => {
        throw new Error("sync boom");
      }, (e) => errors.push(e))
    ).not.toThrow();
    expect(errors).toHaveLength(1);
  });

  it("el timeout corta la espera y no cuelga la invocación", async () => {
    await expect(
      withTimeout(new Promise(() => {}), 10, "prueba")
    ).rejects.toThrow(/timeout/);
  });
});

describe("aislamiento de errores del registro", () => {
  const observation = (rawName: string): ObservationInput => ({
    pharmacy: "cruz-verde",
    rawName,
    sourceProductId: rawName,
    observedAt: "2026-09-03T00:00:00.000Z",
    attributes: canonicalizeOffer({
      pharmacy: "cruz-verde",
      rawName,
      price: { store: 1, online: null, cmr: null, sbpay: null, effective: 1 },
      stock: true,
      url: null,
      capturedAt: "2026-09-03T00:00:00.000Z",
    }),
    upstreamFields: {},
    legacyMatchKey: null,
    legacyPresentationKey: null,
  });

  it("un registro que lanza en TODAS las operaciones no rompe la corrida", async () => {
    const broken: CanonicalRegistryRepository = {
      findConceptCandidates: async () => {
        throw new Error("db down");
      },
      findPresentationCandidates: async () => {
        throw new Error("db down");
      },
      findProductCandidates: async () => {
        throw new Error("db down");
      },
      createConcept: async () => {
        throw new Error("db down");
      },
      createPresentation: async () => {
        throw new Error("db down");
      },
      createProduct: async () => {
        throw new Error("db down");
      },
      linkProductPresentation: async () => {
        throw new Error("db down");
      },
      recordObservationResolution: async () => {
        throw new Error("db down");
      },
      recordProvenance: async () => {
        throw new Error("db down");
      },
      rebindSignature: async () => {
        throw new Error("db down");
      },
    };

    const metrics = await runShadowIdentityAssignment(broken, [
      observation("Paracetamol 500 mg x 16 Comprimidos"),
      observation("Ibuprofeno 400 mg x 20 Comprimidos"),
    ]);

    // La corrida termina, contabiliza los errores y no propaga ninguno.
    expect(metrics.total).toBe(2);
    expect(metrics.error).toBe(2);
    expect(metrics.success).toBe(0);
    expect(metrics.databaseWrites).toBe(0);
  });

  it("un registro que devuelve `null` al acuñar degrada a `unresolved`, no inventa IDs", async () => {
    const registry = new InMemoryCanonicalRegistry();
    const unwritable: CanonicalRegistryRepository = {
      ...registry,
      findConceptCandidates: registry.findConceptCandidates.bind(registry),
      findPresentationCandidates: registry.findPresentationCandidates.bind(registry),
      findProductCandidates: registry.findProductCandidates.bind(registry),
      linkProductPresentation: registry.linkProductPresentation.bind(registry),
      recordObservationResolution: registry.recordObservationResolution.bind(registry),
      recordProvenance: registry.recordProvenance.bind(registry),
      rebindSignature: registry.rebindSignature.bind(registry),
      createConcept: async () => null,
      createPresentation: async () => null,
      createProduct: async () => null,
    };

    const metrics = await runShadowIdentityAssignment(unwritable, [
      observation("Paracetamol 500 mg x 16 Comprimidos"),
    ]);

    expect(metrics.error).toBe(0);
    expect(metrics.offerCoverage).toBe(0);
    expect(metrics.identityCreated).toBe(0);
    expect(registry.concepts.size).toBe(0);
  });

  it("una oferta que rompe no impide procesar las siguientes", async () => {
    const registry = new InMemoryCanonicalRegistry();
    let calls = 0;
    const flaky: CanonicalRegistryRepository = {
      ...registry,
      findConceptCandidates: async (signature, version) => {
        calls += 1;
        if (calls === 1) throw new Error("transient");
        return registry.findConceptCandidates(signature, version);
      },
      findPresentationCandidates: registry.findPresentationCandidates.bind(registry),
      findProductCandidates: registry.findProductCandidates.bind(registry),
      createConcept: registry.createConcept.bind(registry),
      createPresentation: registry.createPresentation.bind(registry),
      createProduct: registry.createProduct.bind(registry),
      linkProductPresentation: registry.linkProductPresentation.bind(registry),
      recordObservationResolution: registry.recordObservationResolution.bind(registry),
      recordProvenance: registry.recordProvenance.bind(registry),
      rebindSignature: registry.rebindSignature.bind(registry),
    };

    const metrics = await runShadowIdentityAssignment(flaky, [
      observation("Paracetamol 500 mg x 16 Comprimidos"),
      observation("Ibuprofeno 400 mg x 20 Comprimidos"),
    ]);

    expect(metrics.error).toBe(1);
    expect(metrics.success).toBe(1);
    // Y NO se reintentó la que falló: una sola pasada, sin tormenta.
    expect(metrics.total).toBe(2);
  });
});
