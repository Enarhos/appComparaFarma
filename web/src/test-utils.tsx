import { act } from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * En este monorepo (Vitest + pnpm hoisted + Next.js 16), el render() de
 * Testing Library no sincroniza el commit inicial: justo después de
 * llamarlo el contenedor queda vacío hasta el próximo microtask, así que
 * cualquier aserción inmediata falla aunque el componente sí monte bien.
 * Envolver el mount en act() (de "react") fuerza el flush síncrono.
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  let result!: ReturnType<typeof rtlRender>;
  act(() => {
    result = rtlRender(ui, options);
  });
  return result;
}

export * from "@testing-library/react";
