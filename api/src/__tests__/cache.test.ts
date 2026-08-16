import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// api/src/lib/cache.ts inicializa el cliente Redis una sola vez, a nivel de
// módulo, leyendo UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN en el
// momento del import (patrón típico de serverless: las env vars se capturan
// en el cold start). Por eso cada test que necesita un estado de entorno
// distinto usa vi.resetModules() + import() dinámico, para forzar una
// re-ejecución fresca de ese bloque top-level con vi.stubEnv() ya aplicado.
//
// Contexto (incidente de producción, 2026-08-16 — cerrado): /api/health
// reportó "not_configured" en producción durante un tiempo pese a que
// UPSTASH_REDIS_REST_URL/TOKEN existían en Vercel (Production y Preview).
// Causa raíz confirmada: la base Free anterior (`comparafarma-cache`) había
// sido eliminada automáticamente por Upstash tras el período de inactividad
// del plan Free (UPSTASH_ROOT_CAUSE = DELETED_FREE_UPSTASH_DATABASE) — no
// era un bug de este código. Resuelto creando una nueva base, reemplazando
// las credenciales en Vercel y con un redeploy limpio; verificado en vivo
// (`/api/health` → `redis: "ok"`, UPSTASH_STATUS = PRODUCTION_VERIFIED, ver
// docs/operations/PLATFORM_OPERATIONAL_STATUS.md). Estos tests solo prueban
// el comportamiento del código de este archivo — que lee los nombres
// exactos correctos, que inicializa el cliente cuando ambas env vars están
// presentes, y que el fallback a memoria sigue funcionando cuando no lo
// están o cuando Redis falla — se conservan porque esa cobertura sigue
// siendo válida independientemente del incidente ya cerrado.

const getMock = vi.hoisted(() => vi.fn());
const setMock = vi.hoisted(() => vi.fn());
const RedisMock = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    get: getMock,
    set: setMock,
  }))
);

vi.mock("@upstash/redis", () => ({
  Redis: RedisMock,
}));

beforeEach(() => {
  vi.resetModules();
  getMock.mockReset();
  setMock.mockReset();
  RedisMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cache.ts — configuración de Upstash Redis", () => {
  it("pingRedis() devuelve 'not_configured' si faltan las env vars de Upstash", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { pingRedis } = await import("../lib/cache.js");
    expect(await pingRedis()).toBe("not_configured");
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("pingRedis() devuelve 'not_configured' si solo una de las dos env vars está presente", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { pingRedis } = await import("../lib/cache.js");
    expect(await pingRedis()).toBe("not_configured");
  });

  it("inicializa el cliente Redis con los nombres EXACTOS UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN cuando ambas están presentes", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    getMock.mockResolvedValue(null);
    await import("../lib/cache.js");
    expect(RedisMock).toHaveBeenCalledWith({
      url: "https://example.upstash.io",
      token: "test-token",
    });
  });

  it("pingRedis() devuelve 'ok' cuando el cliente está configurado y el ping responde", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    getMock.mockResolvedValue(null);
    const { pingRedis } = await import("../lib/cache.js");
    expect(await pingRedis()).toBe("ok");
  });

  it("pingRedis() devuelve 'degraded' si el cliente está configurado pero el ping falla", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    getMock.mockRejectedValue(new Error("connection refused"));
    const { pingRedis } = await import("../lib/cache.js");
    expect(await pingRedis()).toBe("degraded");
  });

  it("getCachedSearch/setCachedSearch usan el fallback en memoria cuando Redis no está configurado (no rompe cache existente)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { getCachedSearch, setCachedSearch } = await import("../lib/cache.js");

    const fakeResult = [{ matchKey: "test|1|1" } as never];
    await setCachedSearch("q", fakeResult, 60_000);
    const cached = await getCachedSearch("q");

    expect(cached).toEqual(fakeResult);
    expect(setMock).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
  });
});
