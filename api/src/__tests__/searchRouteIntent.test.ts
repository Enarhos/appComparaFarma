/**
 * CF-SEARCH-002 — comportamiento de caché e intención de `GET /api/search`.
 *
 * Cubre el mecanismo EXACTO de QA-05 medido en producción (2026-08-27 y
 * 2026-08-28): "ibuprofeno 200/400/600 mg" compartían clave de caché, así que
 * la 2ª y la 3ª consulta recibían la respuesta YA RANKEADA de la 1ª
 * (`x-search-cache: hit`, resultados idénticos).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { MedicationResult } from "../lib/types.js";

const searchMedicationsMock = vi.hoisted(() => vi.fn());
const searchMedicationsDetailedMock = vi.hoisted(() => vi.fn());
const getCachedSearchMock = vi.hoisted(() => vi.fn());
const setCachedSearchMock = vi.hoisted(() => vi.fn());
const getCachedRetrievalMock = vi.hoisted(() => vi.fn());
const setCachedRetrievalMock = vi.hoisted(() => vi.fn());

vi.mock("../services/searchService.js", () => ({
  searchMedications: (...args: unknown[]) => searchMedicationsMock(...args),
  searchMedicationsDetailed: (...args: unknown[]) => searchMedicationsDetailedMock(...args),
}));

vi.mock("../lib/cache.js", () => ({
  getCachedSearch: (...args: unknown[]) => getCachedSearchMock(...args),
  setCachedSearch: (...args: unknown[]) => setCachedSearchMock(...args),
  getCachedRetrieval: (...args: unknown[]) => getCachedRetrievalMock(...args),
  setCachedRetrieval: (...args: unknown[]) => setCachedRetrievalMock(...args),
}));

import { handleSearchRoute } from "../routes/search.js";
import { parseQueryIntent, rankByRelevance, toMedicationResult } from "@comparafarma/domain";

function makeReq(url: string) {
  return { method: "GET", url, headers: {}, socket: { remoteAddress: "127.0.0.1" } };
}

function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as string | undefined,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      res.headers[name] = value;
    },
    end(body?: string) {
      res.body = body;
    },
  };
  return res;
}

function card(name: string, price: number): MedicationResult {
  return toMedicationResult(
    {
      name,
      price,
      onlinePrice: null,
      cmrPrice: null,
      sbpayPrice: null,
      hasStock: true,
      hasOnlineDelivery: true,
      onlineUrl: null,
      imageUrl: null,
      laboratory: null,
      isBioequivalent: false,
    },
    "araucomed",
    "AraucoMed"
  );
}

/** Las tres concentraciones reales de ibuprofeno, con precios de producción. */
const IBUPROFENO_CATALOG = [
  card("Ibuprofeno 400 mg x 20 comp", 642),
  card("Ibuprofeno 600 Mg 20 Comp....", 1190),
  card("Ibuprofeno 200 mg 20 comprimidos recubiertos", 1200),
];

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  searchMedicationsMock.mockReset();
  searchMedicationsDetailedMock.mockReset();
  getCachedSearchMock.mockReset();
  setCachedSearchMock.mockReset();
  getCachedRetrievalMock.mockReset();
  setCachedRetrievalMock.mockReset();
  getCachedSearchMock.mockResolvedValue(null);
  getCachedRetrievalMock.mockResolvedValue(null);
  searchMedicationsMock.mockResolvedValue([]);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/search — clave de caché por intención (QA-05)", () => {
  it("[CORREGIDO QA-05] tres concentraciones producen TRES claves de respuesta distintas", async () => {
    for (const q of ["ibuprofeno 200 mg", "ibuprofeno 400 mg", "ibuprofeno 600 mg"]) {
      await handleSearchRoute(makeReq(`/api/search?q=${encodeURIComponent(q)}`), makeRes());
    }

    const claves = getCachedSearchMock.mock.calls.map(([key]) => key);
    expect(claves).toEqual([
      "ibuprofeno|dose:200mg",
      "ibuprofeno|dose:400mg",
      "ibuprofeno|dose:600mg",
    ]);
    expect(new Set(claves).size).toBe(3);
  });

  it("la clave de RETRIEVAL sí se comparte: los 9 scrapers no se consultan tres veces", async () => {
    for (const q of ["ibuprofeno 200 mg", "ibuprofeno 400 mg", "ibuprofeno 600 mg"]) {
      await handleSearchRoute(makeReq(`/api/search?q=${encodeURIComponent(q)}`), makeRes());
    }
    expect(getCachedRetrievalMock.mock.calls.map(([key]) => key)).toEqual([
      "ibuprofeno",
      "ibuprofeno",
      "ibuprofeno",
    ]);
  });

  it("una consulta con cantidad no comparte clave con la misma sin cantidad", async () => {
    await handleSearchRoute(makeReq("/api/search?q=paracetamol%20500%20mg"), makeRes());
    await handleSearchRoute(makeReq("/api/search?q=paracetamol%20500%20mg%20x%2016"), makeRes());

    const claves = getCachedSearchMock.mock.calls.map(([key]) => key);
    expect(claves).toEqual(["paracetamol|dose:500mg", "paracetamol|dose:500mg|qty:16"]);
  });

  it("una consulta sin atributos conserva la clave histórica", async () => {
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno"), makeRes());
    expect(getCachedSearchMock).toHaveBeenCalledWith("ibuprofeno");
  });

  it("el filtro geográfico sigue participando de ambas claves", async () => {
    await handleSearchRoute(
      makeReq("/api/search?q=ibuprofeno%20600%20mg&pharmacies=dr-simi,cruz-verde"),
      makeRes()
    );
    expect(getCachedSearchMock).toHaveBeenCalledWith("ibuprofeno|dose:600mg:cruz-verde,dr-simi");
    expect(getCachedRetrievalMock).toHaveBeenCalledWith("ibuprofeno:cruz-verde,dr-simi");
  });
});

describe("GET /api/search — reutilización del retrieval sin contaminación de orden", () => {
  it("un retrieval cacheado por OTRA intención se re-rankea para la intención actual", async () => {
    // Escenario exacto del defecto: alguien buscó "ibuprofeno" y dejó el
    // retrieval en caché ordenado por precio. Ahora llega "ibuprofeno 600 mg".
    getCachedRetrievalMock.mockResolvedValue(IBUPROFENO_CATALOG);

    const res = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno%20600%20mg"), res);

    // No se volvió a golpear a las farmacias...
    expect(searchMedicationsMock).not.toHaveBeenCalled();
    expect(res.headers["x-search-retrieval-cache"]).toBe("hit");

    // ...y aun así la respuesta viene rankeada por ESTA intención: el 600 mg
    // ($1.190) por delante del 400 mg ($642), que es más barato.
    const body = JSON.parse(res.body ?? "[]") as MedicationResult[];
    expect(body.map((r) => [r.matchKey, r.concentrationMatch])).toEqual([
      ["ibuprofeno|600mg|20", "exact"],
      ["ibuprofeno|400mg|20", "other"],
      ["ibuprofeno|200mg|20", "other"],
    ]);
  });

  it("[QA-01] un retrieval guardado con cohortes no las filtra a una consulta SIN concentración", async () => {
    // `setCachedRetrieval` guarda lo que devuelve `searchMedications()`, que ya
    // viene anotado por `rankByRelevance`. El escenario es el de dos usuarios
    // dentro del TTL de 5 min y con la MISMA clave de retrieval ("ibuprofeno"):
    // el primero busca "ibuprofeno 600 mg", el segundo "ibuprofeno" a secas.
    const anotado = rankByRelevance(parseQueryIntent("ibuprofeno 600 mg"), IBUPROFENO_CATALOG);
    expect(anotado.some((r) => r.concentrationMatch === "other")).toBe(true);
    getCachedRetrievalMock.mockResolvedValue(anotado);

    const res = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno"), res);

    const body = JSON.parse(res.body ?? "[]") as MedicationResult[];
    // La consulta no pidió concentración: no existe cohorte que exponer, y
    // Web/Mobile —que leen el CAMPO— no deben separar "Otras concentraciones".
    expect(body.every((r) => r.concentrationMatch === undefined)).toBe(true);
    // Y el orden vuelve a ser el histórico: el más barato primero.
    expect(body.map((r) => r.bestPrice)).toEqual([642, 1190, 1200]);
  });

  it("el hit de retrieval no se sirve como hit de respuesta (el header sigue siendo miss)", async () => {
    getCachedRetrievalMock.mockResolvedValue(IBUPROFENO_CATALOG);
    const res = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno%20600%20mg"), res);
    expect(res.headers["x-search-cache"]).toBe("miss");
    // Y la respuesta ya rankeada se guarda bajo la clave de la intención.
    expect(setCachedSearchMock).toHaveBeenCalledWith("ibuprofeno|dose:600mg", expect.any(Array));
  });

  it("sin retrieval cacheado se consulta el servicio y se guardan los dos niveles", async () => {
    searchMedicationsMock.mockResolvedValue(IBUPROFENO_CATALOG);
    const res = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno%20600%20mg"), res);

    expect(searchMedicationsMock).toHaveBeenCalledTimes(1);
    // Al servicio se le pasa la INTENCIÓN, no el texto suelto.
    expect(searchMedicationsMock.mock.calls[0][0]).toMatchObject({
      retrievalQuery: "ibuprofeno",
      quantity: null,
      concentration: { numerator: { value: 600, unit: "mg" }, denominator: null },
    });
    expect(setCachedRetrievalMock).toHaveBeenCalledWith("ibuprofeno", IBUPROFENO_CATALOG);
    expect(setCachedSearchMock).toHaveBeenCalledWith("ibuprofeno|dose:600mg", IBUPROFENO_CATALOG);
  });

  it("un hit de respuesta se sirve tal cual, sin tocar el retrieval", async () => {
    getCachedSearchMock.mockResolvedValue(IBUPROFENO_CATALOG);
    const res = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=ibuprofeno%20600%20mg"), res);

    expect(res.headers["x-search-cache"]).toBe("hit");
    expect(getCachedRetrievalMock).not.toHaveBeenCalled();
    expect(searchMedicationsMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/search — validación sobre el texto crudo", () => {
  it("sigue rechazando una consulta ininterpretable con el mismo 400", async () => {
    const res = makeRes();
    // Solo unidades y números: `cleanQuery` la vacía.
    await handleSearchRoute(makeReq("/api/search?q=500%20mg"), res);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body ?? "{}").error).toBe("No se pudo interpretar la busqueda.");
  });

  it("sigue rechazando una consulta demasiado corta y una demasiado larga", async () => {
    const corta = makeRes();
    await handleSearchRoute(makeReq("/api/search?q=a"), corta);
    expect(corta.statusCode).toBe(400);

    const larga = makeRes();
    await handleSearchRoute(makeReq(`/api/search?q=${"a".repeat(121)}`), larga);
    expect(larga.statusCode).toBe(400);
    expect(JSON.parse(larga.body ?? "{}").error).toBe("La busqueda es demasiado larga.");
  });
});
