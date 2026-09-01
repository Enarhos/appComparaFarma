/**
 * CF-WEB-002 — hook de resolución de módulos para ejecutar el código REAL de
 * `web/src/lib/*` desde un script de QA en Node, sin Next.js.
 *
 * Traduce el alias `@/...` de `web/tsconfig.json` (`"@/*": ["./src/*"]`) a una
 * ruta de archivo real. Es lo que permite que el arnés importe y ejecute
 * `resolveMedication.ts` tal cual está en producción —con su cadena de
 * generaciones y su `searchMedications` real— en vez de reimplementarlo, que
 * es justo lo que invalidaría la medición.
 *
 * Node ≥ 22.18 hace type-stripping de `.ts` sin transpilador: los archivos que
 * se cargan por acá solo usan tipos borrables (interfaces, `import type`).
 */
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { join } from "node:path";

const WEB_SRC = process.env.CF_WEB_SRC;
if (!WEB_SRC) throw new Error("CF_WEB_SRC no definido (ruta a web/src).");

/** Los imports de `web/` son sin extensión (estilo bundler): se prueba `.ts`, `.tsx` y la ruta tal cual. */
function resolveWebPath(relative) {
  const base = join(WEB_SRC, relative);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, base, join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`No se pudo resolver el alias "@/${relative}" bajo ${WEB_SRC}`);
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return {
      url: pathToFileURL(resolveWebPath(specifier.slice(2))).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
