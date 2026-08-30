import { test, expect, type Page } from "@playwright/test";

/**
 * CF-WEB-001 — layout responsive y desborde de texto.
 *
 * Estos tests miden layout REAL en Chromium (jsdom no calcula layout, así que
 * los tests de componente sólo pueden blindar el contrato CSS). Cubren los
 * anchos acordados en el ticket: 320 / 375 / 390 / 430 / 768 / 1024 / 1440.
 */

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440] as const;
/** Anchos por debajo del breakpoint `sm` (640px) de Tailwind — donde vivían los bugs. */
const MOBILE_WIDTHS = [320, 375, 390, 430] as const;

/** Página de búsqueda con nombres de producto y de marca largos y reales. */
const SEARCH_LONG_NAMES = "/buscar/tapsin";
/** CF-SEARCH-002 — fuerza la sección "Otras concentraciones". */
const SEARCH_OTHER_CONCENTRATIONS = "/buscar/ibuprofeno%20600%20mg";
const SEARCH_EMPTY = "/buscar/zzqqxxwwvv123";
const DETAIL =
  "/medicamento/tapsin-nocturno-paracetamol-500-mg-600-comprimidos-30xz7crcio87u";

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const de = document.documentElement;
    return de.scrollWidth > de.clientWidth;
  });
}

/**
 * Elementos cuyo contenido se desborda de su propia caja. Se excluyen dos
 * patrones legítimos del código actual:
 *  - `.sr-only` (<caption> del histórico): recorte intencional de accesibilidad.
 *  - contenedores con overflow-x explícito (`auto`/`scroll`), que scrollean a propósito.
 *  - filas con margen negativo `-mx-2` (realce de hover que invade el padding
 *    del contenedor padre por diseño, ver CommercialProductRow/MedicationCard).
 */
async function clippedElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
      if (el.className.includes?.("sr-only")) continue;
      // Realce de hover con margen negativo: el hijo invade el padding del padre a propósito.
      if (el.querySelector(":scope > a[class*='-mx-2'], :scope > div[class*='-mx-2']")) continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push(`<${el.tagName.toLowerCase()} class="${el.className}"> "${(el.textContent ?? "").trim().slice(0, 60)}"`);
      }
    }
    return out;
  });
}

for (const width of WIDTHS) {
  test.describe(`viewport ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("ninguna vista principal produce scroll horizontal del documento", async ({ page }) => {
      for (const url of ["/", SEARCH_LONG_NAMES, SEARCH_EMPTY, DETAIL, "/mi-receta"]) {
        await page.goto(url);
        expect(await hasHorizontalScroll(page), `scroll horizontal en ${url} @${width}px`).toBe(false);
      }
    });

    test("los resultados de búsqueda no recortan texto dentro de su caja", async ({ page }) => {
      await page.goto(SEARCH_LONG_NAMES);
      await expect(page.locator("section").first()).toBeVisible();
      expect(await clippedElements(page)).toEqual([]);
    });

    test('la sección "Otras concentraciones" no recorta texto dentro de su caja', async ({ page }) => {
      await page.goto(SEARCH_OTHER_CONCENTRATIONS);
      await expect(
        page.getByRole("heading", { name: /Otras concentraciones/ })
      ).toBeVisible();
      expect(await clippedElements(page)).toEqual([]);
    });
  });
}

for (const width of MOBILE_WIDTHS) {
  test.describe(`viewport ${width}px — regresiones CF-WEB-001`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("el nombre de marca de cada producto comercial se muestra completo, sin recorte", async ({ page }) => {
      await page.goto(SEARCH_LONG_NAMES);
      await expect(page.locator("section").first()).toBeVisible();

      // La invariante correcta NO es un ancho mínimo (una marca corta como
      // "Tapsín" mide legítimamente ~44px), sino que la etiqueta no esté
      // recortada: antes del fix el contenedor colapsaba y estas etiquetas
      // mostraban "Marc…"/"Ta…" o directamente nada.
      const clipped = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of Array.from(
          document.querySelectorAll<HTMLElement>("section li span.truncate")
        )) {
          if (el.scrollWidth > el.clientWidth + 1) {
            bad.push(`"${(el.textContent ?? "").trim()}" (${el.clientWidth}px de ${el.scrollWidth}px)`);
          }
        }
        return bad;
      });

      expect(clipped, `marcas recortadas @${width}px`).toEqual([]);
    });

    test("el precio y el badge de bioequivalencia no se superponen con la marca", async ({ page }) => {
      await page.goto(SEARCH_OTHER_CONCENTRATIONS);
      await expect(page.locator("section").first()).toBeVisible();

      const overlaps = await page.evaluate(() => {
        const bad: string[] = [];
        // El bloque de precio ("desde $X" + "Ver precios") es el único
        // <div class="ml-auto ..."> dentro de una fila de producto comercial;
        // su hermano anterior es el cluster marca+badge+cobertura.
        for (const priceBlock of Array.from(
          document.querySelectorAll<HTMLElement>("section li div.ml-auto")
        )) {
          const cluster = priceBlock.previousElementSibling as HTMLElement | null;
          if (!cluster) continue;
          const price = priceBlock.getBoundingClientRect();

          // Se comparan los HIJOS reales del cluster (marca, badge
          // bioequivalente, "N farmacias") contra el bloque de precio: el bug
          // original no movía la caja del cluster —que se encogía a ~12px—
          // sino que hacía desbordar a sus hijos `shrink-0` por encima del
          // precio. Comparar sólo las cajas contenedoras no lo detecta.
          for (const child of Array.from(cluster.children) as HTMLElement[]) {
            const c = child.getBoundingClientRect();
            if (c.width === 0 || c.height === 0) continue;
            const overlapX = Math.min(c.right, price.right) - Math.max(c.left, price.left);
            const overlapY = Math.min(c.bottom, price.bottom) - Math.max(c.top, price.top);
            if (overlapX > 1 && overlapY > 1) {
              bad.push(
                `"${(child.textContent ?? "").trim().slice(0, 30)}" pisa "${(priceBlock.textContent ?? "").trim().slice(0, 30)}"`
              );
            }
          }
        }
        return bad;
      });

      expect(overlaps, `superposición marca/precio @${width}px`).toEqual([]);
    });

    test("el formulario de alerta de precio deja el campo de email usable", async ({ page }) => {
      await page.goto(DETAIL);
      await page.getByRole("button", { name: /Avisarme si baja de precio/ }).click();

      const email = page.getByLabel("Tu email");
      await expect(email).toBeVisible();
      const box = await email.boundingBox();
      // Antes del fix medía 3-18px: imposible de usar y con el label superpuesto.
      expect(box?.width ?? 0, `input de email colapsado @${width}px`).toBeGreaterThan(140);

      await email.fill("persona@ejemplo.cl");
      await expect(email).toHaveValue("persona@ejemplo.cl");
    });
  });
}
