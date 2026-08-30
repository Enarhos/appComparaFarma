import { defineConfig, devices } from "@playwright/test";

/**
 * CF-WEB-001 — verificación responsive real en navegador.
 *
 * NO está enganchado a CI (`.github/workflows/ci.yml` sigue corriendo
 * typecheck → domain-tests → api-tests → deploy-api) a propósito: estos tests
 * levantan `next dev` y las páginas de búsqueda/ficha consultan la API
 * productiva real, cuyos resultados dependen de 9 scrapers de farmacia. Como
 * suite bloqueante de CI sería intermitente por razones ajenas al layout.
 *
 * Uso manual:
 *   pnpm --filter web exec playwright test
 *
 * `pnpm --filter web test` (vitest) sigue siendo la suite automática; los
 * tests de componente que acompañan a este sprint blindan el contrato CSS que
 * causó cada bug, y esta suite verifica el resultado medido en un navegador.
 */
export default defineConfig({
  testDir: "./e2e",
  // Un scrape real puede tardar bastante en frío; ver comentario de arriba.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3111",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "next dev -p 3111",
        url: "http://localhost:3111",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
