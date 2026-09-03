# CF-SEARCH-012 S1 — Runtime de shadow

**Estado: APAGADO. No desplegado. Sin tráfico de usuario hacia v2.**

---

## 1. Interruptor

Tres controles, en orden de autoridad:

| # | Control | Dónde | Para qué |
|---|---|---|---|
| 1 | `SEARCH_V2_SHADOW_KILL=true` | env var de Vercel | **mata** el shadow gane quien gane abajo. Es el único que no depende de que Supabase responda |
| 2 | `app_config['search_v2_shadow']` = `{enabled, sampleRate}` | Supabase | fuente de verdad operativa: encender, apagar y mover el muestreo **sin redeploy** |
| 3 | `SEARCH_V2_SHADOW_ENABLED` / `SEARCH_V2_SHADOW_SAMPLE_RATE` | env vars | valores por defecto cuando la fila no existe o Supabase no responde |

**Por qué `app_config` y no solo env vars.** Cambiar una env var en Vercel exige
un redespliegue, y el requisito es poder ir de 1 % a 100 % —o a 0 %— **solo por
configuración**. `pharmacyFlags.ts` ya usa exactamente este mecanismo para apagar
una farmacia sin deploy; el shadow reutiliza el mismo `getConfigValue` cacheado
60 s, no introduce nada nuevo.

**Por qué además un kill switch por env var.** Si `app_config` no responde o
quedara mal escrito, hay que poder apagar igual. El kill switch se evalúa **antes
de tocar la red**.

**Apagado por defecto, de tres maneras:** sin configuración, `enabled = false` y
`sampleRate = 0`. La migración inserta la fila con `{"enabled": false,
"sampleRate": 0}`. Y `SEARCH_V2_SHADOW_ENABLED` solo enciende con la cadena
exacta `"true"` (`"1"`, `"TRUE"`, `"yes"` no encienden nada — verificado en test).

**Un fallo leyendo la configuración nunca enciende nada:** cualquier error cae a
las env vars, que por defecto están apagadas.

---

## 2. Muestreo determinista

`isSampled(samplingKey, sampleRate)` — hash de la clave de retrieval, no
`Math.random()`.

- la misma consulta cae **siempre del mismo lado**: subir el muestreo AMPLÍA el
  conjunto observado en vez de barajarlo (verificado: el observado al 10 % es
  subconjunto del observado al 50 %, y ese del 100 %);
- es reproducible: se puede responder "¿por qué esta búsqueda no dejó rastro?"
  sin adivinar;
- **no depende del ranking, del precio, del usuario ni del número de
  resultados**. La firma de la función solo admite el texto ya normalizado de la
  consulta, que es el mismo dato que ya gobierna la caché.

### Un bug real encontrado por su propio test

FNV-1a sin mezcla final distribuye mal los **bits altos** para cadenas cortas y
parecidas entre sí — que es exactamente la forma de una consulta de farmacia.
Medido antes de corregirlo: sobre 500 claves de la misma familia, **cero** caían
por debajo de 0,1 (el mínimo era 0,1077). Con una tasa del 10 % el muestreo
habría descartado la familia entera en silencio, y el shadow habría observado una
muestra sesgada creyéndola representativa. Se agregó el finalizador `fmix32` de
MurmurHash3.

---

## 3. Modelo de ejecución

### `waitUntil`, sin dependencia nueva

`api/` corre como funciones serverless de Node en Vercel y **no depende de
`@vercel/functions`**. Agregarla no sería gratis: `api/vercel.json` declara el
glob `"api/*.ts"` precisamente porque el plan Hobby limita a 12 funciones
(PM-001, regla 3), y el pipeline de deploy es el componente más frágil que este
proyecto tiene documentado.

Lo que se usa es el mecanismo que esa librería envuelve: el runtime publica un
contexto de request en `globalThis[Symbol.for("@vercel/request-context")]`, con un
`waitUntil` que mantiene viva la invocación hasta que la promesa se resuelve,
**después** de que la respuesta ya salió. Se accede por lectura defensiva.
Resultado: sin dependencia nueva, sin cambio en `vercel.json`, sin cambio en el
pipeline de deploy.

### Fallback, y su limitación declarada

Si el runtime no publica ese contexto (desarrollo local, `vercel dev`, tests, o un
cambio futuro de plataforma), el trabajo se lanza igual como promesa desacoplada.
En ese modo la plataforma **puede congelar la invocación** al terminar la
respuesta y el trabajo quedar a medias.

Es aceptable **solo** porque lo que se pierde es una escritura de shadow: el
registro es incremental e idempotente —la misma observación se vuelve a resolver
en la siguiente búsqueda— y ninguna respuesta al usuario depende de que termine.
Lo que NO es aceptable, y por eso no se hace, es esperar el trabajo para
garantizar que corra.

El modo efectivo (`waitUntil` | `detached`) se reporta en el log estructurado.

### Dónde se engancha

Una sola línea en `api/src/routes/search.ts`, **después** de
`json(res, 200, …)`, y solo en el camino de MISS no-debug:

- una respuesta servida desde caché no trae observaciones nuevas; reprocesarla
  sería escritura sin información;
- `?debug=1` no lo dispara;
- una respuesta de error no lo dispara.

`scheduleSearchV2Shadow` devuelve **`void`** a propósito: no hay promesa que un
`await` accidental pueda esperar, así que la latencia percibida no puede cambiar
ni por descuido.

---

## 4. Seguridad operativa

| Control | Valor | Configurable |
|---|---|---|
| Timeout interno | 8.000 ms | `SEARCH_V2_SHADOW_TIMEOUT_MS` |
| Techo de observaciones por corrida | 60 | `SEARCH_V2_SHADOW_MAX_OBSERVATIONS` |
| Reintentos | **ninguno** | — |
| Aislamiento por oferta | `try/catch` individual | — |
| Aislamiento global | `try/catch` + `runAfterResponse` | — |

**Timeout.** `api/vercel.json` declara `maxDuration: 30`. El shadow es el trabajo
menos importante de esa invocación y no puede consumirla; Sermecoop ya tiene
documentado el timeout como modo de fallo real. Al vencer se abandona la espera y
se reporta; lo ya escrito queda escrito (el registro es incremental).

**Sin reintento.** Un fallo del registro no puede convertirse en una tormenta de
escrituras. La siguiente búsqueda muestreada vuelve a intentarlo con las mismas
observaciones, porque la escritura es idempotente.

**Aislamiento por oferta.** Un nombre que rompa un lector no puede tumbar la
corrida entera ni, mucho menos, la búsqueda del usuario. Verificado con un
repositorio que lanza en las diez operaciones: la corrida termina, contabiliza los
errores y no propaga ninguno.

**Logs sin secretos ni datos de usuario.** La consulta llega solo como
`samplingKey`, se usa para decidir y **no se escribe** en ninguna tabla ni en
ninguna métrica. No hay IP, sesión, user-agent ni identificador de persona en
ninguna ruta de `searchV2Shadow.ts`.

---

## 5. Observabilidad

Métricas estructuradas sobre `console.info(JSON.stringify(...))`, **la misma
convención que ya usan `/api/search` y el resto de `api/`**. No se introduce
ninguna plataforma de observabilidad nueva.

```json
{
  "scope": "search_v2_shadow",
  "event": "shadow_run",
  "requestId": "...",
  "configSource": "app_config",
  "sampleRate": 0.1,
  "search_v2_shadow_total": 42,
  "search_v2_shadow_success": 42,
  "search_v2_shadow_error": 0,
  "search_v2_shadow_duration_ms": 137,
  "search_v2_offer_coverage": 0.512,
  "search_v2_resolution_exact": 96,
  "search_v2_resolution_subsumed": 9,
  "search_v2_resolution_ambiguous": 7,
  "search_v2_resolution_unresolved": 14,
  "search_v2_identity_created": 3,
  "search_v2_identity_reused": 105,
  "search_v2_database_writes": 172
}
```

`search_v2_false_merge`, `search_v2_split_lost` y
`search_v2_concept_semantic_collision` **no se emiten por corrida**, y es
deliberado: los tres son métricas de PARES sobre el conjunto agrupado, no
propiedades de una observación. Calcularlas dentro del camino de una búsqueda
exigiría comparar todos los pares de un concepto en cada corrida — trabajo
cuadrático y sin sentido operativo. Se calculan sobre el corpus congelado con
`s1-eval.mjs` (Gates B, C y D) y, cuando el shadow esté encendido, se calcularán
por lote sobre `canonical_resolutions`, que guarda todo lo necesario.

Cuando el shadow está apagado **no se emite ni un log por búsqueda**: sería ruido
en el 100 % del tráfico para informar que no pasó nada.

Los errores van además a Sentry vía `captureException`, con `requestId` y
`route: "search_v2_shadow"`.

---

## 6. Medición offline del shadow

`s1-eval.mjs` simula una corrida por consulta contra el registro ya convergido,
con la MISMA función que correría en producción (`assignIdentity`), contra el
repositorio en memoria. **No enciende nada**: sin Supabase, sin red, sin deploy.

```
corridas ................ 16
observaciones ........... 1.364
success rate ............ 100,00 %
error rate .............. 0,0000 %
p50 ..................... 7,19 ms
p95 ..................... 13,91 ms
p99 ..................... 13,91 ms
```

**Qué NO demuestra esto.** Es una medición en memoria: sin round-trips a
Postgres, sin arranque en frío de una función serverless y sin contención. La
latencia real del shadow contra Supabase será mayor en órdenes de magnitud — pero
corre **después** de responder al usuario, así que su efecto sobre la latencia
percibida es cero por construcción, no por rapidez. Lo que sí acota es el techo
de duración: el timeout de 8 s.

---

## 7. Cómo se enciende (cuando CTO/Product lo decida)

1. correr la migración (`SCHEMA.md` §6) y verificar las 7 tablas;
2. desplegar el código con el shadow **apagado** y confirmar que `/api/search`
   responde idéntico;
3. subir a `{"enabled": true, "sampleRate": 0.01}` en `app_config` — **sin
   deploy**;
4. observar `search_v2_shadow_error` y `search_v2_shadow_duration_ms` durante
   24 h, y la latencia p95 de `/api/search` en el mismo periodo;
5. subir gradualmente. Bajar es cambiar la misma fila; el corte inmediato es
   `SEARCH_V2_SHADOW_KILL=true`.

**Ninguno de estos pasos manda tráfico a v2.** El paso que lo haría es S3
(dual-read), y no forma parte de S1 ni de S2.
