# ER-002 — Search Engine Full Review

**ID:** ER-002
**Nombre:** Search Engine Full Review
**Fecha:** 2026-06-29
**Responsable:** Claude Code
**Revisor:** ChatGPT CTO
**Estado:** Draft

---

## 1. Resumen Ejecutivo

### Score General: 6.8 / 10

| Dimensión | Score | Notas breves |
|---|---|---|
| Arquitectura | 8/10 | Separación limpia, contratos claros |
| Calidad de código | 7/10 | Buena legibilidad; duplicación crítica |
| Robustez | 7/10 | Partial success por farmacia funciona |
| Performance | 6/10 | 5 clientes muertos, sin memoización en render |
| Seguridad | 5/10 | Rate limit inefectivo en serverless; auth opcional |
| Testabilidad | 5/10 | Backend cubierto, mobile a 0% |
| Calidad de datos | 6/10 | Divergencia `matchKey`, `hasStock` hardcoded |
| Observabilidad | 7/10 | Structured logs, Sentry, PostHog, request IDs |

### Fortalezas

- Arquitectura de capas bien definida: mobile → API → service → clients
- `runSource` + `Promise.all` logra partial success sin framework adicional
- Normalización por `matchKey` es sofisticada y bien pensada para el dominio
- Doble capa de caché (mobile 30 min + backend 5 min) reduce carga efectivamente
- Structured JSON logs con `requestId` en cada route — excelente para debugging
- Sentry integrado para errores no manejados; AbortError filtrado correctamente

### Debilidades Críticas

1. **Rate limit inefectivo en producción** — Map en memoria no se comparte entre instancias Vercel
2. **Divergencia `matchKey` mobile/backend** — alertas de precio silenciosamente rotas
3. **5 clientes inactivos** en `ALL_SOURCES` ejecutan 5 HTTP requests en cada búsqueda sin retorno
4. **Cero tests en mobile** — hook, stores, UI no tienen cobertura

### Recomendación CTO

> El Search Engine está listo para un producto en fase early-growth pero tiene dos deudas que bloquean la escalabilidad: el rate limiting no funciona como se cree en producción, y la duplicación de `normalization.ts` ya rompió silenciosamente la feature de alertas. Ambas se resuelven en menos de una semana. Autorizar el release actual solo si la feature de alertas de precio no está siendo activamente promovida al usuario.

---

## 2. Mapa del Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│  MOBILE                                                             │
│                                                                     │
│  [index.tsx] Usuario escribe "paracetamol 500"                      │
│      │                                                              │
│      ▼                                                              │
│  useDebounce(search, 500ms)   ← espera 500ms de pausa               │
│      │                                                              │
│      ▼                                                              │
│  useSearch.search(rawQuery)                                         │
│    ├─ cleanQuery("paracetamol 500") → "paracetamol"                 │
│    │   [mobile/src/lib/normalization.ts]                            │
│    ├─ selectedCommune? → getBranchIndex() → getPharmaciesForCommune │
│    │   └─ onlyPharmacies = ["cruz-verde","salcobrand"] (si aplica)  │
│    ├─ cacheKey = "paracetamol"[+":cruz-verde,salcobrand"]           │
│    ├─ getCached(cacheKey)                                           │
│    │   [mobile/src/lib/cache.ts — AsyncStorage, TTL 30min, v9_]     │
│    │   ├─ HIT  → setResults(cached) ──────────────────────────┐    │
│    │   └─ MISS → continúa hacia API                           │    │
│    │                                                           │    │
│    ▼                                                           │    │
│  fetch(API_URL/api/search?q=paracetamol[&pharmacies=...])      │    │
│    headers: { x-api-key: API_KEY? }                            │    │
│    signal: AbortController                                     │    │
│                                                                │    │
└────────────────────────────────────────────────────────────────┼────┘
                                                                 │
┌────────────────────────────────────────────────────────────────▼────┐
│  BACKEND (Vercel Serverless)                                        │
│                                                                     │
│  [api/src/routes/search.ts: handleSearchRoute]                      │
│    ├─ attachRequestId(req,res) → X-Request-ID header                │
│    ├─ method !== "GET" → 405                                         │
│    ├─ isAuthorized(req)                                             │
│    │   └─ if API_SECRET_KEY unset → always true (open access)       │
│    ├─ consumeRateLimit(clientIp)                                     │
│    │   └─ In-memory Map, 60 req/min/IP [⚠️ inefectivo multi-instance]│
│    ├─ validateQuery(q) → cleanQuery(rawQuery)                        │
│    │   [api/src/lib/normalization.ts]                               │
│    ├─ cacheKey = "paracetamol"[+":cruz-verde,salcobrand"]           │
│    ├─ getCachedSearch(cacheKey)                                      │
│    │   [api/src/lib/cache.ts — Upstash Redis o memoria, TTL 5min]   │
│    │   ├─ HIT  → json(200, cached) ─────────────────────────────┐  │
│    │   └─ MISS → continúa                                       │  │
│    │                                                             │  │
│    ▼                                                             │  │
│  searchMedications(query, onlySlugs)                             │  │
│  [api/src/services/searchService.ts]                             │  │
│    │                                                             │  │
│    ├─ getDisabledPharmacies() → filtra DISABLED_PHARMACIES       │  │
│    │                                                             │  │
│    ├─ Promise.all([                                              │  │
│    │    runSource("cruz-verde",   searchCruzVerde,   query)      │  │
│    │    runSource("salcobrand",   searchSalcobrand,  query)      │  │
│    │    runSource("ahumada",      searchAhumada,     query)      │  │
│    │    runSource("dr-simi",      searchDrSimi,      query)      │  │
│    │    runSource("araucomed",    searchAraucoMed,   query) [⚠️] │  │
│    │    runSource("ecofarmacias", searchEcoFarmacias,query) [⚠️] │  │
│    │    runSource("farmex",       searchFarmex,      query) [⚠️] │  │
│    │    runSource("sermecoop",    searchSermecoop,   query) [⚠️] │  │
│    │    runSource("easyfarma",    searchEasyFarma,   query) [⚠️] │  │
│    │  ])  ← cada uno con timeout 8s, error → products:[]         │  │
│    │                                                             │  │
│    ├─ forEach product → toMedicationResult(product, slug, name)  │  │
│    │     └─ matchKey(name) + effectivePrice(channels)            │  │
│    │        [api/src/lib/normalization.ts]                       │  │
│    │                                                             │  │
│    ├─ mergeDuplicates(all)                                       │  │
│    │     └─ group by matchKey → best per pharmacy → sort by eff. │  │
│    │                                                             │  │
│    └─ .sort((a,b) => a.bestPrice - b.bestPrice)                  │  │
│                                                                  │  │
│  setCachedSearch(cacheKey, results)  ◄──────────────────────────┘  │
│  json(200, results[])  ──────────────────────────────────────────┐  │
│                                                                  │  │
└──────────────────────────────────────────────────────────────────┼──┘
                                                                   │
┌──────────────────────────────────────────────────────────────────▼──┐
│  MOBILE (continuación)                                              │
│                                                                     │
│  setCached(cacheKey, results)   ← AsyncStorage                      │
│  setResults(results)            ← searchStore                       │
│                                                                     │
│  [results.tsx] Re-render con resultados                             │
│    ├─ filtrado client-side:                                         │
│    │   bioOnly, isPharmacyVisible, onlineSalesOnly [⚠️ sin useMemo] │
│    ├─ sort client-side: por precio o por nombre                     │
│    └─ FlatList → MedicationListItem[]                               │
│                                                                     │
│  captureSearch(rawQuery, query, results, commune)                   │
│    └─ PostHog: "medication_search" event                            │
│                                                                     │
│  checkPriceAlerts(results)                                          │
│    └─ per alert: r.matchKey === alert.matchKey  [⚠️ divergencia]   │
│       && r.bestPrice ≤ alert.targetPrice                            │
│       → toast notification                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Análisis por Capa

### 3.1 Mobile Search UI — `results.tsx` + `index.tsx`

**Positivo:**
- `useEffect([q])` correctamente dispara búsqueda al montar con el parámetro de ruta
- Skeleton loading (3 tarjetas) mientras `status === "loading"`
- Pull-to-refresh con `bypassCache=true` — fuerza re-fetch correcto
- Error state con botón de reintentar
- Tooltip de onboarding con persistencia en AsyncStorage

**Hallazgos:**

**UI-01 — `displayResults` sin memoización:**
```typescript
let displayResults = bioOnly ? results.filter(...) : results;
displayResults = displayResults.filter(...)
displayResults = [...displayResults].sort(...)
```
Estas tres operaciones corren en el render body, no en `useMemo`. Para listas de 50+ resultados con múltiples filtros activos, recalculan en cada re-render (incluyendo toasts, store updates irrelevantes). Debería ser `useMemo([results, bioOnly, activePharmacies, onlineSalesOnly, sortBy])`.

**UI-02 — `addToHistory(q)` en cada montaje del efecto:**
```typescript
useEffect(() => {
  if (q) {
    search(q);
    addToHistory(q);  // ← se llama cada vez que el efecto se re-ejecuta
  }
}, [q, search, addToHistory]);
```
Si `search` o `addToHistory` cambian de referencia (sin `useCallback`), el efecto se re-ejecuta agregando duplicados al historial. `useHistoryStore`'s `add` debería deduplicar internamente.

**UI-03 — Filtro `onlineSalesOnly` depende de `PHARMACIES[s].channels.online`:**
```typescript
const onlineSlugs = ALL_SLUGS.filter(
  (s) => PHARMACIES[s].onlineOnly || PHARMACIES[s].channels.online
);
```
La propiedad `channels.online` es la configuración estática, no los datos reales de la búsqueda. Un medicamento puede aparecer en una farmacia sin precio online real pero la farmacia en sí tiene `channels.online = true`. El filtro es sobre la configuración de la farmacia, no sobre el producto.

---

### 3.2 `useDebounce` + `useSearch` (Hooks)

**Positivo:**
- AbortController correcto: cancela la request anterior antes de lanzar la nueva
- `useCallback` en `search` previene re-renders innecesarios
- Error de red distinguido del error de servidor — mensajes distintos al usuario
- AbortError silenciado correctamente (no va a Sentry)

**Hallazgos:**

**HOOK-01 — `useSearch` no carga alertas antes de verificarlas:**
```typescript
const { alerts, markTriggered } = useAlertsStore();
```
`useAlertsStore` requiere que se llame `.load()` para hidratar desde AsyncStorage. Si las alertas no se cargaron antes de la primera búsqueda, el array `alerts` está vacío y la verificación no encuentra nada. No hay un `useEffect` en `useSearch` que garantice `load()` fue llamado.

**HOOK-02 — Alert check usa `new Date().toISOString()` con string split:**
```typescript
const todayStr = new Date().toISOString().split("T")[0];
```
Correcto funcionalmente. El límite de un disparo por día es UTC, no local. Para Chile (UTC-3/UTC-4) esto significa que la alerta puede dispararse dos veces el mismo día chileno si se cruza la medianoche UTC. Comportamiento aceptable pero debería estar documentado.

**HOOK-03 — `cleanQuery` en mobile puede retornar `""` para inputs válidos cortos:**
```typescript
const query = cleanQuery(rawQuery);
if (!query) {
  setResults([]);
  return;
}
```
Si el usuario escribe "co" (como inicio de "Cocaluk"), `cleanQuery` lo descarta porque las palabras de longitud < 2 se filtran. El usuario ve una lista vacía sin explicación. Mejor UX: no ejecutar la búsqueda si `query === ""` pero también no borrar los resultados previos.

---

### 3.3 `searchStore` (Zustand)

**Positivo:**
- Estado mínimo: `query`, `results`, `status`, `errorMessage`
- Status enum explícito (`idle | loading | success | error`) — mejor que un boolean
- `reset()` disponible para limpiar

**Sin hallazgos críticos.** La store es simple y correcta.

---

### 3.4 Cache Mobile — `mobile/src/lib/cache.ts`

**Positivo:**
- TTL correcto: `expiresAt = Date.now() + TTL_MS`
- Verificación de expiración antes de retornar (no simplemente guardar en AsyncStorage indefinidamente)
- Limpieza del entry expirado en background (`.catch(() => {})`)
- `setCached` falla silenciosamente — correcto para storage lleno

**Hallazgos:**

**CACHE-01 — Sin límite de entradas (no hay LRU real):**
El comentario en `CLAUDE.md` menciona "AsyncStorage LRU" pero el código no implementa LRU. Solo TTL. AsyncStorage en Android tiene un límite de ~6MB. Si el usuario busca muchos términos distintos, el storage puede llenarse. Las entradas expiradas se eliminan individualmente en `getCached`, pero nunca se hace una limpieza global de entradas viejas.

**CACHE-02 — Cache key usa `query.toLowerCase().trim()` pero `cleanQuery` ya cambió la query:**
La query llega ya transformada por `cleanQuery` (sin acentos filtrados, sin stop words). `.toLowerCase()` ya lo hizo el usuario implícitamente. Funcionalmente correcto, pero un `.trim()` extra no hace daño.

**CACHE-03 — CACHE_PREFIX `v9_` en mobile vs sin versionado en backend:**
El backend usa `cfsearch:` como prefijo fijo, sin versión. Si cambia la estructura de `MedicationResult`, el backend no invalida automáticamente el caché Redis — hay que hacerlo manualmente. Mobile usa `search_cache_v9_` — versionado explícito. Inconsistencia de estrategia.

---

### 3.5 API Route — `api/src/routes/search.ts`

**Positivo:**
- Structured JSON logging en cada stage (cache hit, cache miss, error)
- `requestId` en cada log y response header
- Modo debug (`?debug=1`) expone diagnósticos sin cache — excelente para operaciones
- Separación correcta: `validateQuery` como función pura extraída

**Hallazgos:**

**ROUTE-01 — Sin límite de tamaño de respuesta:**
Si `mergeDuplicates` retorna 200 resultados con 4 farmacias y precios completos, la respuesta JSON puede ser >500KB. No hay paginación ni límite. En Vercel, el límite de respuesta es 4MB — raramente alcanzado, pero posible para queries muy genéricas como "a".

**ROUTE-02 — `pharmacies` param sin validación contra slugs conocidos:**
```typescript
const onlySlugs = pharmaciesParam
  ? (pharmaciesParam.split(",").map(...).filter(Boolean) as PharmacySlug[])
  : undefined;
```
Si alguien envía `?pharmacies=injected-slug`, el valor pasa como `PharmacySlug` por casting sin verificación. En `searchService`, `activeSources.filter(s => onlySlugs.includes(s.slug))` no encontraría ningún match y retornaría `[]` — no es un exploit, pero es input no sanitizado que retorna 200 con array vacío silenciosamente.

---

### 3.6 Rate Limiting — `api/src/middleware/rateLimit.ts`

**Positivo:**
- Purga de entradas expiradas cuando el Map supera 5000 keys
- Implementación simple y sin dependencias

**Hallazgos:**

**RL-01 — CRÍTICO: Rate limit no funciona en Vercel Serverless:**
```typescript
const hits = new Map<string, { count: number; resetAt: number }>();
```
Esta constante es module-level. En Vercel, cada función serverless puede tener **N instancias concurrentes**, cada una con su propio proceso y su propio `hits` Map. Un cliente con 10 IPs distintas o una red con múltiples clientes puede superar el límite fácilmente. Con 10 instancias activas, el límite efectivo es `10 × 60 = 600 req/min/IP`.

Para que funcione en serverless se necesita Redis (Upstash ya instalado). La solución: usar `redis.incr()` + `redis.expire()` en `consumeRateLimit` cuando Redis está disponible.

**RL-02 — Purga no es periódica sino threshold-based:**
Si el Map tiene exactamente 4999 entradas expiradas, nunca se purgan. Solo cuando llega la entrada 5000 se activa la purga. En serverless de vida corta (instancias que duran <60s), esto es irrelevante. En long-running, podría ser un memory leak suave.

---

### 3.7 Auth — `api/src/middleware/auth.ts`

**Positivo:**
- Simple y correcto — una sola responsabilidad
- Falla abierta cuando `API_SECRET_KEY` no está configurada — documentado como decisión de diseño

**Hallazgos:**

**AUTH-01 — Sin `Retry-After` header en 401:**
No es un bug funcional, pero las respuestas 401 deberían incluir `WWW-Authenticate` y las 429 deberían incluir `Retry-After: 60` según RFC 6585. Mejora la experiencia de integración.

---

### 3.8 Backend Cache — `api/src/lib/cache.ts`

**Positivo:**
- Fallback a memoria cuando Redis no está configurado — correcto para dev local
- Manejo de errores de Redis con `console.warn` sin throw — correcta degradación
- TTL configurable vía `SEARCH_CACHE_TTL_MS`

**Hallazgos:**

**BCACHE-01 — Fallback en memoria comparte estado entre requests en la misma instancia:**
En local dev (sin Redis), si se ejecuta `vercel dev` con múltiples workers, el `memCache` puede compartirse. No es un problema crítico, pero podría confundir en debugging.

**BCACHE-02 — Sin versionado de cache key:**
Si cambia la estructura de `MedicationResult` (ej: se agrega un campo), el Redis caché contiene objetos con el schema viejo. Las respuestas cacheadas tendrían el schema antiguo hasta expirar (5 min). Para cambios breaking, se debe modificar `KEY_PREFIX = "cfsearch:"` (ej: `"cfsearch_v2:"`).

---

### 3.9 `searchService.ts`

**Hallazgos:**

**SVC-01 — 5 clientes inactivos en producción:**
Ya documentado en AUDIT-001 como CF-002. 5 de 9 `runSource` siempre retornan `[]`, ejecutando 5 HTTP requests innecesarios por búsqueda no cacheada.

**SVC-02 — `cleanQuery` no llamado internamente:**
Ya documentado en AUDIT-001 como CF-003. Si `searchMedications` se invoca directamente con query crudo, los clientes reciben texto sucio.

**SVC-03 — `fetchedAt` en `toPharmacyPrice` usa `new Date().toISOString()`:**
```typescript
fetchedAt: new Date().toISOString(),
```
En el contexto de caché, el `fetchedAt` que se almacena es el momento en que se guardó en caché, no el momento en que el usuario recibe la respuesta. Para hits de caché, el `fetchedAt` puede tener 5 minutos de antigüedad (backend) o 30 minutos (mobile). El campo es informativo pero puede confundir.

---

### 3.10 Normalization y Deduplication

Ya cubiertos en detalle en AUDIT-001. Resumen de hallazgos para este review:

**NORM-01 (CF-001) — Divergencia `matchKey` mobile/backend:** Alta severidad
**NORM-02 — `mergeDuplicates` canonical name heuristic es débil:** nombre más corto puede ser menos informativo
**NORM-03 — Sort inestable en empate de `bestPrice`:** Baja severidad

---

### 3.11 Clientes de Farmacia

| Cliente | Estado | Calidad datos | Riesgo |
|---|---|---|---|
| Cruz Verde | Activo | Stock real, sin precio online | Bajo |
| Salcobrand | Activo | Mejor cobertura (4 canales) | Crítico (API key hardcodeada) |
| Ahumada | Activo | `hasStock: true` hardcoded | Alto (scraper frágil) |
| Dr. Simi | Activo | `isRelevant` puede dar falsos pos. | Bajo |
| Araucomed | Inactivo | — | Muerto (ejecuta requests) |
| EcoFarmacias | Inactivo | — | Muerto |
| Farmex | Inactivo | — | Muerto |
| Sermecoop | Inactivo | CSRF token — sesión complicada | Muerto |
| EasyFarma | Inactivo | — | Muerto |

**Ahumada client — `fetchWithTimeout` con regex `([\s\S]+?)`:**
El regex `tileRe` usa lookhead para cortar el match, lo que puede causar backtracking en HTML grandes. Para una página con 24 productos y ~200KB de HTML, no es un riesgo práctico. Pero si Ahumada alguna vez retorna un HTML de 2MB+ (error de servidor, página completa), podría freezear la instancia.

---

### 3.12 Analytics — PostHog + Sentry

**PostHog:**
- `captureSearch` solo se llama en cache MISS (nuevas búsquedas), no en hits. Las búsquedas repetidas en 30 min no aparecen en analytics. Esto subestima el volumen real de búsquedas activas.
- La clave `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g` está hardcodeada. El comentario indica que es write-only/client-side — correcto para PostHog, no es un secreto. Sin embargo, si se quiere rotar la clave, requiere un nuevo build.
- No hay eventos de `medication_viewed`, `price_copied`, `pharmacy_selected` — solo `medication_search`. El funnel de conversión no es medible con el setup actual.

**Sentry:**
- `captureException` en errores de búsqueda con `extra: { query }` — correcto
- AbortError filtrado antes de llegar a Sentry — correcto
- Errores de red con mensaje descriptivo al usuario — buen UX
- No hay Sentry en el backend (`api/`) — los errores serverless van a Vercel logs pero no a Sentry. Para incidentes silenciosos, los logs de Vercel son la única fuente.

---

### 3.13 Tests

| Archivo | Cobertura | Calidad |
|---|---|---|
| `normalization.test.ts` | Básica (4 casos) | Falta: guiones, short-word, extremos |
| `searchService.test.ts` | Parcial (1 caso) | Falta: all-fail, query cruda, cache |
| `ahumada.test.ts` | Presente | No revisado en detalle |
| `cruzverde.test.ts` | Presente | No revisado en detalle |
| `salcobrand.test.ts` | Presente | No revisado en detalle |
| `drsimi.test.ts` | Presente | No revisado en detalle |
| `araucomed.test.ts` | Presente | Cliente inactivo con test |
| **Mobile (todos)** | **0%** | **Sin tests** |

**Test gap principal:** ningún test cubre:
- `useSearch` hook
- `useDebounce` hook
- `searchStore` state transitions
- `resultsScreen` render con distintos estados
- `alertsStore` carga/persistencia
- `cache.ts` mobile (TTL, miss, hit)

---

## 4. Inventario Consolidado de Hallazgos

| ID | Capa | Severidad | Descripción | Quick Win |
|---|---|---|---|---|
| RL-01 | Rate Limit | Crítica | Rate limit inefectivo en serverless multi-instancia | No |
| NORM-01 | Normalization | Alta | `matchKey` diverge mobile/backend — alertas rotas | Sí |
| SVC-01 | Service | Media | 5 clientes inactivos hacen requests sin retorno | Sí |
| SVC-02 | Service | Media | `cleanQuery` no llamado en searchService | Sí |
| UI-01 | UI | Media | `displayResults` sin `useMemo` — recalculo en cada render | Sí |
| BCACHE-02 | Cache | Media | Cache backend sin versión — schema breaks silenciosos | No |
| HOOK-01 | Hook | Media | Alertas pueden no estar cargadas en primera búsqueda | Sí |
| CACHE-01 | Cache | Baja | Sin LRU real en mobile cache | No |
| ROUTE-01 | Route | Baja | Sin límite de tamaño de respuesta (no paginado) | No |
| ROUTE-02 | Route | Baja | `pharmacies` param no validado contra slugs conocidos | Sí |
| AUTH-01 | Auth | Baja | Sin `Retry-After` / `WWW-Authenticate` headers | Sí |
| UI-02 | UI | Baja | `addToHistory` puede agregar duplicados | Sí |
| UI-03 | UI | Baja | Filtro `onlineSalesOnly` basado en config estática | No |
| HOOK-02 | Hook | Baja | Alert check usa UTC — puede dispararse 2x en día chileno | No |
| HOOK-03 | Hook | Baja | `cleanQuery("")` borra resultados previos sin feedback | Sí |
| ANALYTICS | Analytics | Baja | Cache hits no reportados a PostHog | No |
| SVC-03 | Service | Info | `fetchedAt` es timestamp de caché, no de recepción | No |
| NORM-03 | Normalization | Info | Sort inestable en empate de precio | Sí |

---

## 5. Deuda Técnica Cuantificada

| Categoría | Esfuerzo estimado |
|---|---|
| Resolver RL-01 (rate limit Redis) | 4–8 horas |
| Resolver NORM-01 (matchKey sync + paquete compartido) | 2–6 horas |
| Resolver SVC-01 (clientes inactivos) | 1 hora |
| Resolver SVC-02 (cleanQuery en service) | 30 minutos |
| Resolver UI-01 (useMemo displayResults) | 1 hora |
| Agregar tests de mobile básicos (hook + store) | 8–16 horas |
| Agregar tests `normalization` faltantes | 2–3 horas |
| Agregar eventos PostHog de funnel | 3–5 horas |
| **Total deuda prioridad alta/media** | **~22–40 horas** |

---

## 6. Recomendaciones por Sprint

### Sprint inmediato (< 1 semana)

1. **RL-01** — Migrar rate limit a Redis. Si Redis no está configurado, mantener el fallback en memoria con log de advertencia explícito.
2. **NORM-01** — Sincronizar `matchKey` en mobile e incrementar `CACHE_PREFIX` a `v10_`.
3. **SVC-01** — Mover clientes inactivos fuera de `ALL_SOURCES`.
4. **SVC-02** — Agregar `cleanQuery` al inicio de `searchMedicationsDetailed`.
5. **HOOK-01** — Garantizar que `alertsStore.load()` se llama antes del primer `search()`.

### Sprint siguiente (2 semanas)

6. **UI-01** — Memoizar `displayResults` con `useMemo`.
7. **BCACHE-02** — Agregar versión al `KEY_PREFIX` del backend.
8. **Tests** — Agregar 10 casos a `normalization.test.ts` y 5 a `searchService.test.ts`.
9. **PostHog** — Agregar eventos `medication_viewed` y `price_channel_selected`.

### Largo plazo

10. **RF-01** — Paquete compartido `packages/normalization` para eliminar la duplicación estructuralmente.
11. **Paginación** — Para queries genéricas que retornan >50 resultados.
12. **Tests mobile** — Cubrir al menos `useSearch`, `searchStore` y `cache.ts`.

---

## 7. Conclusión

El Search Engine de ComparaFarma tiene una base arquitectónica sólida: el contrato de tipos es claro, la separación de responsabilidades es correcta, y el manejo de fallos parciales por farmacia es sofisticado para un proyecto de este tamaño. El mayor talón de Aquiles no es la arquitectura sino la **duplicación de código**: dos copias de `normalization.ts` que ya divergieron silenciosamente, y un rate limiter que funciona en local pero no en el entorno de producción.

La priorización correcta es: (1) rate limit → (2) matchKey sync → (3) clientes muertos. Los tres son correcciones de menos de medio día cada una y elevan el score de **6.8 a ~8.0/10**.
