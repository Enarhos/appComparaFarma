/**
 * CF-SEARCH-012 (S1) — ejecución DESPUÉS de responder al usuario.
 *
 * ---------------------------------------------------------------------------
 * EL PROBLEMA
 * ---------------------------------------------------------------------------
 * El shadow de v2 no puede sumar un milisegundo de latencia percibida ni,
 * peor, empujar una búsqueda lenta contra el `maxDuration: 30` de
 * `api/vercel.json`. Sermecoop ya tiene documentado el timeout como modo de
 * fallo real (CLAUDE.md §11), así que un shadow síncrono convertiría un
 * scraper lento en un 504.
 *
 * ---------------------------------------------------------------------------
 * QUÉ SOPORTA LA INFRAESTRUCTURA REAL, VERIFICADO EN ESTE REPOSITORIO
 * ---------------------------------------------------------------------------
 * `api/` corre como funciones serverless de Node en Vercel y **no** depende de
 * `@vercel/functions`; `api/package.json` tiene cuatro dependencias y ninguna
 * es esa. Añadirla no sería gratis: `api/vercel.json` declara el glob
 * `"api/*.ts"` precisamente porque el plan Hobby limita a 12 funciones
 * (PM-001, regla 3), y el pipeline de deploy es el componente más frágil que
 * este proyecto tiene documentado. No se toca por una utilidad de tres líneas.
 *
 * Lo que sí se usa es el mecanismo que `@vercel/functions` envuelve: el runtime
 * publica un contexto de request en
 * `globalThis[Symbol.for("@vercel/request-context")]`, con un `waitUntil` que
 * mantiene viva la invocación hasta que la promesa se resuelve, DESPUÉS de que
 * la respuesta ya salió. Se accede por lectura defensiva, sin dependencia nueva,
 * sin cambio en `vercel.json` y sin cambio en el pipeline de deploy.
 *
 * ---------------------------------------------------------------------------
 * FALLBACK, Y SU LIMITACIÓN DECLARADA
 * ---------------------------------------------------------------------------
 * Si el runtime no publica ese contexto (desarrollo local, `vercel dev`, tests,
 * o un cambio futuro de plataforma), el trabajo se lanza igual como promesa
 * desacoplada. En ese modo la plataforma PUEDE congelar la invocación al
 * terminar la respuesta y el trabajo quedar a medias.
 *
 * Eso es aceptable **solo** porque lo que se pierde es una escritura de shadow:
 * el registro canónico es incremental e idempotente —la misma observación se
 * vuelve a resolver en la siguiente búsqueda—, y ninguna respuesta al usuario
 * depende de que termine. Lo que NO es aceptable, y por eso no se hace, es
 * esperar el trabajo para garantizar que corra.
 *
 * En ningún modo el error de la tarea se propaga: `runAfterResponse` no lanza y
 * no devuelve una promesa que el llamador pueda esperar por accidente.
 */

interface VercelRequestContext {
  get?: () => { waitUntil?: (promise: Promise<unknown>) => void } | undefined;
}

const REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");

/** `waitUntil` del runtime, o `null` si la plataforma no lo expone. */
export function getWaitUntil(): ((promise: Promise<unknown>) => void) | null {
  try {
    const context = (globalThis as Record<symbol, unknown>)[REQUEST_CONTEXT_SYMBOL] as
      | VercelRequestContext
      | undefined;
    const waitUntil = context?.get?.()?.waitUntil;
    return typeof waitUntil === "function" ? waitUntil : null;
  } catch {
    return null;
  }
}

/** Cómo se ejecutó el trabajo. Se reporta en el log estructurado del shadow. */
export type AfterResponseMode = "waitUntil" | "detached";

/**
 * Ejecuta `task` después de responder, sin bloquear y sin poder fallar hacia
 * afuera.
 *
 * `void` de retorno a propósito: si devolviera una promesa, un `await` mal
 * puesto en la ruta reintroduciría la latencia que este módulo existe para
 * evitar.
 */
export function runAfterResponse(
  task: () => Promise<unknown>,
  onError?: (error: unknown) => void
): AfterResponseMode {
  let promise: Promise<unknown>;
  try {
    promise = task();
  } catch (error) {
    // Un `throw` SÍNCRONO dentro de `task` no debe escapar.
    onError?.(error);
    return "detached";
  }

  const guarded = Promise.resolve(promise).catch((error: unknown) => {
    onError?.(error);
  });

  const waitUntil = getWaitUntil();
  if (waitUntil) {
    try {
      waitUntil(guarded);
      return "waitUntil";
    } catch (error) {
      onError?.(error);
    }
  }
  return "detached";
}

/**
 * Corta `task` a `timeoutMs`. El shadow no puede quedarse colgado consumiendo
 * la invocación: `maxDuration` es 30 s y esta tarea es la menos importante de
 * todas las que corren en ella.
 *
 * NO cancela el trabajo subyacente (una promesa de JS no es cancelable); deja
 * de esperarlo y reporta el timeout. Es la misma técnica que ya usa
 * `pingSupabase()` con `Promise.race`.
 */
export async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
