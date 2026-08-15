# Auditoría — Módulo de Búsqueda y Normalización

**ID:** AUDIT-001
**Fecha:** 2026-06-29
**Auditor:** Claude Code (Senior Software Engineer)
**Alcance:** análisis estático, sin modificación de código
**Archivos principales:** `api/src/lib/normalization.ts`, `api/src/services/searchService.ts`

---

## Resumen Ejecutivo

El módulo de búsqueda tiene una arquitectura sólida y bien pensada. La deduplicación por `matchKey`, el manejo de errores parciales por farmacia y el sistema de caché en dos capas son puntos fuertes. Sin embargo, se detectaron **3 problemas de alta criticidad**:

1. **Divergencia entre las dos copias de `normalization.ts`** (backend vs. mobile): algoritmos `matchKey` distintos → favoritos y alertas pueden no matchear correctamente.
2. **5 de 9 clientes en `searchService` son inactivos** pero se ejecutan en cada búsqueda, consumiendo recursos sin valor.
3. **Falta de `cleanQuery` dentro de `searchService`**: si el servicio se invoca directamente (no desde el route handler), queries sin limpiar llegan a los clientes.

Nivel de deuda general: **Medio**. El producto funciona correctamente en el flujo principal, pero hay riesgos silenciosos en flows secundarios (alertas, favoritos, communes).

---

## Mapa del Flujo de Búsqueda

```
Usuario escribe "paracetamol 500mg"
        │
        ▼
useDebounce (500ms)
        │
        ▼
useSearch.search(rawQuery)
  ├─ cleanQuery("paracetamol 500mg") → "paracetamol"   [mobile/src/lib/normalization.ts]
  ├─ cacheKey = "paracetamol" + commune_filter
  ├─ getCached(cacheKey)  ─── HIT ──→ setResults(cached) → FIN
  │                          MISS ↓
  ├─ selectedCommune? → getBranchIndex() → getPharmaciesForCommune() → onlyPharmacies[]
  └─ searchMedications(query, signal, onlyPharmacies)
            │
            ▼ HTTP GET /api/search?q=paracetamol[&pharmacies=...]
            │
            ▼ [api/src/routes/search.ts: handleSearchRoute]
  ├─ isAuthorized(req)
  ├─ consumeRateLimit(ip)
  ├─ validateQuery(q)
  │     └─ cleanQuery(rawQuery)  [api/src/lib/normalization.ts]
  ├─ cacheKey = "paracetamol" + pharmacy_filter
  ├─ getCachedSearch(cacheKey) ─── HIT ──→ json(res, 200, cached) → FIN
  │                                MISS ↓
  └─ searchMedications(query, onlySlugs)
            │
            ▼ [api/src/services/searchService.ts: searchMedicationsDetailed]
  ├─ getDisabledPharmacies()  → excluye farmacias deshabilitadas
  ├─ Promise.all([
  │     runSource("cruz-verde",   searchCruzVerde,   query)  → ScrapedProduct[]
  │     runSource("salcobrand",   searchSalcobrand,  query)  → ScrapedProduct[]
  │     runSource("ahumada",      searchAhumada,     query)  → ScrapedProduct[]
  │     runSource("dr-simi",      searchDrSimi,      query)  → ScrapedProduct[]
  │     runSource("araucomed",    searchAraucoMed,   query)  → [] (inactivo)
  │     runSource("ecofarmacias", searchEcoFarmacias,query)  → [] (inactivo)
  │     runSource("farmex",       searchFarmex,      query)  → [] (inactivo)
  │     runSource("sermecoop",    searchSermecoop,   query)  → [] (inactivo)
  │     runSource("easyfarma",    searchEasyFarma,   query)  → [] (inactivo)
  │  ])
  ├─ forEach product → toMedicationResult() → MedicationResult[]
  │     └─ matchKey(product.name) + toPharmacyPrice()
  ├─ mergeDuplicates(all)  → agrupa por matchKey, elige mejor precio por farmacia
  └─ .sort((a,b) => a.bestPrice - b.bestPrice)
            │
            ▼
  json(res, 200, results[])
            │
            ▼ [mobile]
  setCached(cacheKey, results)
  setResults(results)
  checkPriceAlerts(results)  → toast si match.bestPrice ≤ alert.targetPrice
```

**Timeout por farmacia:** 8 segundos (`fetchWithTimeout`). Al correr en paralelo, el tiempo total = `max(latencias)` ≤ 8s.

---

## Análisis de `normalization.ts`

### 1. `cleanQuery(raw)`

**Responsabilidad:** limpiar queries de prescripciones médicas pegadas (ej: "Paracetamol 500mg tomar cada 8 horas").

**Comportamiento:**
- Corta en palabras clave de posología: `principio activo`, `dosis`, `cada`, `vía`, etc.
- Elimina contenido entre `[]` y `()`
- Filtra palabras genéricas (formas farmacéuticas, unidades de medida)
- Deduplica palabras con `Set`

**Problema detectado — Duplicación inconsistente:**
Las implementaciones en `api/src/lib/normalization.ts` y `mobile/src/lib/normalization.ts` son visualmente idénticas para `cleanQuery`, pero el riesgo está en el mantenimiento: cualquier fix en una no se propaga a la otra. No existe un paquete compartido.

---

### 2. `matchKey(name)`

Esta función es el corazón de la deduplicación. Genera una clave canónica a partir del nombre de un producto.

**Formato del matchKey:** `{primerapalabradeMarca}|{dosis}|{turno}|{cantidad}`

Ejemplos:
- `"Paracetamol 500 mg x 16 Comprimidos"` → `"paracetamol|500mg|16"`
- `"Tapsin Plus Día 16 Comprimidos"` → `"tapsin|d|16"`
- `"Tapsin Plus Noche 16 Comprimidos"` → `"tapsin|n|16"`

#### ⚠️ DIVERGENCIA CRÍTICA: Backend vs Mobile

El backend (`api/src/lib/normalization.ts`) tiene lógica adicional que el mobile NO tiene:

**Backend (líneas 62-88):**
```typescript
const lower = raw
  .replace(/(\w)-(\w)/g, "$1$2")   // "Trio-Val" → "TrioVal"
  .replace(/[^\w\s]/g, " ")
  ...
const brandWords = words.filter(
  (w) => w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w) && /^[a-z]+$/.test(w)
);
let first = brandWords[0] ?? "";
// short-word merging:
if (first.length >= 2 && first.length <= 4 && brandWords[1] && brandWords[1].length <= 4) {
  first = first + brandWords[1];
}
```

**Mobile (líneas 60-65):**
```typescript
const lower = raw.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
// NO hay tratamiento de guiones
// NO hay filtro /^[a-z]+$/ sobre brandWords
// NO hay short-word merging
let first = "";
for (const w of words) {
  if (w.length >= 2 && !STOP_WORDS.has(w) && !/^\d/.test(w)) { first = w; break; }
}
```

**Consecuencias:**

| Nombre del producto | matchKey backend | matchKey mobile |
|---|---|---|
| "Trio-Val 80mg" | `trioval\|80mg` | `trio\|80mg` |
| "Co-Amoxiclav 500mg" | `coamoxiclav\|500mg` | `co\|500mg` |
| "Tri Fen 10mg" | `trifen\|10mg` | `tri\|10mg` |

Para alertas de precio, el mobile almacena un `matchKey` y luego compara con `r.matchKey === alert.matchKey` (useSearch.ts:67). Si el backend retorna `trioval|80mg` pero la alerta fue guardada con `trio|80mg` (matchKey mobile), **la alerta nunca se dispara**.

---

### 3. `effectivePrice(channels)`

**Correcto.** Calcula `min(store, online ?? store, cmr ?? store, sbpay ?? store)`.

El fallback `?? store` garantiza que un canal ausente no introduce precios fantasma de 0. Buen diseño.

---

### 4. `mergeDuplicates(results)`

**Lógica:** agrupa por `matchKey`, elige el nombre canónico (prioridad: laboratorio > nombre más corto), mantiene el mejor precio por farmacia.

**Riesgo — selección del nombre canónico:**
```typescript
return cur.canonicalName.length < best.canonicalName.length ? cur : best;
```
El nombre más corto no siempre es el más informativo. "Paracetamol 500" puede ganar sobre "Paracetamol 500 mg 16 Comprimidos Genérico". Si ambos tienen laboratorio, el más corto gana aunque sea menos preciso.

**Riesgo — misma farmacia en el grupo:**
Si dos scrapers del mismo slug producen la misma farmacia dos veces (posible en tests o si se llama `searchMedications` con duplicados), el `byPharmacy` Map deduplica correctamente por `effective` más bajo. Comportamiento correcto.

**Riesgo — grupo de 1:**
```typescript
if (group.length === 1) return group[0];
```
El early return no recalcula `bestPrice`/`bestPharmacy` aunque `prices[0]` cambie. Esto es correcto porque para grupo de 1 no hay fusión, pero si `bestPrice` fue mal calculado en origen, persiste.

---

## Análisis de `searchService.ts`

### 1. Estructura general

La función `runSource` es un wrapper elegante que:
- Mide latencia por farmacia
- Captura errores individualmente (partial success)
- Retorna `diagnostic` estructurado

`Promise.all` sobre `runSource` wraps garantiza que un fallo en una farmacia no cancela las demás. Buen patrón.

> **Nota:** El diagrama en `CLAUDE.md` muestra `Promise.allSettled`, pero el código usa `Promise.all` con `runSource`. El efecto es idéntico (partial success), pero es documentación desactualizada.

### 2. ⚠️ 5 clientes inactivos en producción

`ALL_SOURCES` tiene 9 entradas:
- **Activos (retornan resultados):** `cruz-verde`, `salcobrand`, `ahumada`, `dr-simi`
- **Inactivos (retornan `[]`):** `araucomed`, `ecofarmacias`, `farmex`, `sermecoop`, `easyfarma`

Los 5 clientes inactivos se ejecutan en **cada búsqueda no cacheada**, haciendo HTTP requests hacia servicios externos que no producen resultados. Esto:
- Añade latencia si alguno tarda en fallar
- Genera tráfico en servicios externos innecesariamente
- No es controlado por `DISABLED_PHARMACIES` (esa env var tiene que configurarse manualmente)

### 3. `cleanQuery` no se llama dentro de `searchService`

El query llega limpio al servicio porque `handleSearchRoute` llama `validateQuery` → `cleanQuery` primero. Pero si alguien llama `searchMedications("Paracetamol 500mg tomar cada 8 horas")` directamente (tests, scripts, otros routes), el query crudo llega a los 9 clientes de farmacia.

El test en `searchService.test.ts` llama `searchMedicationsDetailed("paracetamol")` con un query ya limpio, enmascarando este riesgo.

### 4. `fetchWithTimeout` — timeout fijo de 8 segundos

Cada cliente usa 8 segundos de timeout. En una búsqueda real con 9 fuentes paralelas, si 5 inactivos toman 8s cada uno (antes de fallar), la búsqueda completa dura 8s de wall-clock. 

Para los 4 activos, 8s es razonable. Para los 5 inactivos, si fallan rápido (connection refused) no hay problema; si tardan en timeout (remote hang), suman latencia innecesaria.

### 5. Resultado sin ordenamiento estable

```typescript
const results = mergeDuplicates(all).sort((a, b) => a.bestPrice - b.bestPrice);
```

Si dos productos tienen el mismo `bestPrice`, el orden es inestable (depende del orden de inserción en el Map de `mergeDuplicates`). Podría afectar la reproducibilidad de los resultados.

---

## Análisis de Clientes de Farmacia

### Cruz Verde (`cruzverde.ts`)

- **Fortaleza:** API REST tipada (Demandware), respuesta JSON estructurada
- **Debilidad:** Solo precio presencial (`store`), sin `online`, `cmr`, `sbpay`
- `hasStock: Boolean(hit.orderable ?? true)` — default `true` cuando `orderable` es `undefined`. Podría mostrar productos sin stock.
- `laboratory` viene de `hit.brand` — puede ser `undefined` → `null`. Correcto.

### Ahumada (`ahumada.ts`)

- **Debilidad principal:** scraper HTML con regex sobre `([\s\S]+?)(?=...)` — backtracking en HTML muy grande podría ser lento
- `hasStock: true` hardcodeado — no hay forma de saber stock desde el HTML
- `laboratory: null` siempre — no hay info de laboratorio desde el HTML de tiles
- `isBioequivalent: block.includes("bioequivalent-badge")` — frágil, basta con que Ahumada cambie el nombre de la clase
- `clp()` filtra valores `≤ 100` — previene ruido con números pequeños del HTML, buen heurístico
- Manejo de CMR correcto pero complejo: lee `content="..."` attrs, filtra `> 1000`, busca el menor que supere el badge price

### Salcobrand (`salcobrand.ts`)

- **Mejor cobertura de canales:** store, online, cmr, sbpay
- Validación correcta: `directNum < storePrice` antes de aceptar `onlinePrice`
- **API key hardcodeada como fallback** (ver `SECURITY_AUDIT.md`)
- `normal_price` puede ser `0` si Algolia no lo indexó → filtrado por `if (!normal) return []` — correcto

### Dr. Simi (`drsimi.ts`)

- **Riesgo:** `isRelevant()` filtra con `queryWords.some(word => name.includes(word))`. Con una query de una sola palabra (ej: "aspirina"), cualquier producto cuyo nombre contenga "aspirina" pasa. Pero con "amoxicilina acido clavulanico", basta con que el nombre contenga "acido" (3+ chars) para pasar — puede traer falsos positivos.
- `hasOnlineDelivery: true` hardcodeado
- Stock check robusto: `IsAvailable && AvailableQuantity > 0`
- Estructura VTEX con doble anidamiento (`items[0].sellers[0].commertialOffer`) — frágil si items está vacío (cubierto por `if (!items?.length) return []`)

---

## Riesgos Detectados

| # | Riesgo | Severidad | Silencioso |
|---|---|---|---|
| R-01 | Divergencia `matchKey` mobile/backend — alertas y favoritos pueden no matchear | Alta | ✅ Sí |
| R-02 | 5 clientes inactivos en `ALL_SOURCES` ejecutan requests sin resultado | Media | ✅ Sí |
| R-03 | `searchService` no llama `cleanQuery` internamente | Media | ✅ Sí |
| R-04 | Scraper Ahumada: `hasStock` y `laboratory` siempre hardcodeados | Media | ✅ Sí |
| R-05 | `isRelevant()` en Dr. Simi puede incluir productos irrelevantes | Baja | ✅ Sí |
| R-06 | `cleanQuery` duplicado (2 copias) — drift de mantenimiento | Baja | ✅ Sí |
| R-07 | `hit.orderable ?? true` en Cruz Verde — stock asumido | Baja | ✅ Sí |
| R-08 | Sort inestable cuando `bestPrice` empata | Baja | ✅ Sí |
| R-09 | `clp()` en Ahumada filtra valores ≤ 100, podría descartar medicamentos de $1–$100 | Baja | ✅ Sí |
| R-10 | Regex de Ahumada: `([\s\S]+?)(?=...)` puede ser lento en HTML grandes | Baja | Parcial |

---

## Quick Wins

1. **Sincronizar `matchKey` en mobile** — copiar la lógica de guiones y short-word merging del backend al mobile. 30 minutos de trabajo. Resuelve R-01.

2. **Mover clientes inactivos a una lista separada `INACTIVE_SOURCES`** — sacarlos de `ALL_SOURCES` para que no se ejecuten. Si se quieren activar luego, moverlos de vuelta. 10 minutos. Resuelve R-02.

3. **Agregar `cleanQuery` al inicio de `searchMedicationsDetailed`** — `const safeQuery = cleanQuery(query) || query`. 5 minutos. Resuelve R-03.

4. **Sort estable** — agregar `|| a.canonicalName.localeCompare(b.canonicalName)` como desempate en el sort de resultados. 5 minutos. Resuelve R-08.

---

## Refactors Recomendados

### RF-01: Paquete compartido `@comparafarma/normalization`

En lugar de mantener dos copias de `normalization.ts`, crear un workspace `packages/normalization` con los tipos y funciones compartidas. Mobile y API importarían desde ahí.

```
packages/
  normalization/
    src/index.ts   ← cleanQuery, matchKey, effectivePrice, mergeDuplicates
    package.json
```

**Esfuerzo:** 2-3 horas. **Impacto:** elimina la raíz del problema de divergencia.

### RF-02: Separar fuentes activas de inactivas en `searchService`

```typescript
const ACTIVE_SOURCES = [
  { slug: "cruz-verde",  fn: searchCruzVerde  },
  { slug: "salcobrand",  fn: searchSalcobrand },
  { slug: "ahumada",     fn: searchAhumada    },
  { slug: "dr-simi",     fn: searchDrSimi     },
];

const BETA_SOURCES = [
  { slug: "araucomed", fn: searchAraucoMed },
  // ...
];
```

Activar las beta con `ENABLE_BETA_PHARMACIES=1` si se quiere testear.

### RF-03: Extraer la lógica de selección de nombre canónico

La heurística del `reduce` en `mergeDuplicates` debería tener nombre y tests propios:

```typescript
function selectCanonicalProduct(group: MedicationResult[]): MedicationResult {
  return group.reduce((best, cur) => {
    if (!best.laboratory && cur.laboratory) return cur;
    if (best.laboratory && !cur.laboratory) return best;
    return cur.canonicalName.length < best.canonicalName.length ? cur : best;
  });
}
```

---

## Tests Recomendados

### Nuevos tests para `normalization.test.ts`

```typescript
// Caso: guión en el nombre (divergencia mobile/backend)
it("handles hyphenated brand names", () => {
  expect(matchKey("Trio-Val 80mg x 30 Comprimidos")).toBe("trioval|80mg|30");
  expect(matchKey("Co-Amoxiclav 500mg 21 Cápsulas")).toBe("coamoxiclav|500mg|21");
});

// Caso: short-word merging
it("merges short brand word pairs", () => {
  expect(matchKey("Tri Fen 10mg")).toBe("trifen|10mg");
  expect(matchKey("Di Pen 250mg")).toBe("dipen|250mg");
});

// Caso: productos día/noche con misma base deben tener keys distintos
it("distinguishes day/night products", () => {
  const day = matchKey("Tapsin Plus Día 16 Comprimidos");
  const night = matchKey("Tapsin Plus Noche 16 Comprimidos");
  expect(day).not.toBe(night);
  expect(day).toContain("|d|");
  expect(night).toContain("|n|");
});

// Caso: cleanQuery con inputs extremos
it("returns empty string for pure posology input", () => {
  expect(cleanQuery("tomar cada 8 horas")).toBe("");
  expect(cleanQuery("500 mg comprimidos")).toBe("");
});

// Caso: mergeDuplicates con sorteo estable en empate de precio
it("produces stable sort when bestPrice ties", () => {
  // ... dos medicamentos con bestPrice=1000
  const results = mergeDuplicates([a, b]).sort((x, y) => x.bestPrice - y.bestPrice);
  expect(results[0].canonicalName.localeCompare(results[1].canonicalName)).toBeLessThan(1);
});
```

### Nuevos tests para `searchService.test.ts`

```typescript
// Caso: query sin limpiar llega crudo al servicio
it("searchService cleans query if not pre-cleaned", async () => {
  mocks.searchCruzVerde.mockResolvedValue([makeProduct("Paracetamol 500mg", 840)]);
  // ... otros mocks a []
  const exec = await searchMedicationsDetailed("Paracetamol 500mg tomar cada 8 horas");
  // Si cleanQuery está dentro del servicio, esto debería funcionar
  expect(exec.results.length).toBeGreaterThan(0);
});

// Caso: todas las farmacias fallan → resultado vacío con diagnostics
it("returns empty results when all pharmacies fail", async () => {
  Object.values(mocks).forEach(m => m.mockRejectedValue(new Error("timeout")));
  const exec = await searchMedicationsDetailed("paracetamol");
  expect(exec.results).toHaveLength(0);
  expect(exec.diagnostics.pharmacies.every(p => p.status === "rejected")).toBe(true);
});
```

---

## Issues Propuestos

---

### CF-001 — Divergencia de `matchKey` entre backend y mobile

**Epic:** Calidad de datos / Fiabilidad
**Problema:** `matchKey` en `mobile/src/lib/normalization.ts` no tiene la lógica de normalización de guiones (`Trio-Val` → `trioval`) ni el short-word merging (`Tri Fen` → `trifen`) presentes en `api/src/lib/normalization.ts`. Esto provoca que las alertas de precio y los favoritos que usan `matchKey` calculado en mobile no encuentren sus medicamentos en los resultados del backend.

**Impacto:** Alto — alertas de precio silenciosamente nunca se disparan para medicamentos con guiones en el nombre o nombres compuestos de 2 palabras cortas.

**Solución propuesta:** 
1. Corto plazo: sincronizar `mobile/src/lib/normalization.ts` con la versión del backend.
2. Largo plazo: crear un paquete compartido `packages/normalization` y que ambos lo importen.

**Archivos afectados:**
- `mobile/src/lib/normalization.ts`
- `api/src/lib/normalization.ts`

**Criterios de aceptación:**
- `matchKey("Trio-Val 80mg")` produce la misma salida en mobile y backend
- Tests de regresión cubren nombres con guiones y short-word merging

**Riesgos:** Cambiar `matchKey` invalida el caché mobile existente → incrementar `CACHE_PREFIX` de `search_cache_v9_` a `search_cache_v10_`.

**Prioridad:** Alta
**Esfuerzo:** 2–4 horas

---

### CF-002 — 5 clientes inactivos ejecutan requests en cada búsqueda

**Epic:** Performance / Costos
**Problema:** `ALL_SOURCES` en `searchService.ts` incluye 9 farmacias pero 5 (`araucomed`, `ecofarmacias`, `farmex`, `sermecoop`, `easyfarma`) siempre retornan arrays vacíos. Se lanzan 5 requests HTTP innecesarios en paralelo en cada búsqueda no cacheada.

**Impacto:** Medio — consume sockets de red y puede añadir latencia si algún cliente inactivo tarda en responder o en timeout (hasta 8 segundos).

**Solución propuesta:** Crear lista `BETA_SOURCES` separada de `ACTIVE_SOURCES`. Los beta solo se incluyen si `ENABLE_BETA_PHARMACIES=1`.

**Archivos afectados:**
- `api/src/services/searchService.ts`

**Criterios de aceptación:**
- Solo 4 clientes activos por defecto
- Los clientes inactivos se pueden activar vía env var
- Test existente sigue pasando

**Riesgos:** Ninguno — cambio aditivo.

**Prioridad:** Media
**Esfuerzo:** 1 hora

---

### CF-003 — `searchService` no normaliza el query internamente

**Epic:** Robustez / Correctitud
**Problema:** `searchMedications(query)` y `searchMedicationsDetailed(query)` asumen que el query ya viene limpio. Si se invocan directamente (desde tests, scripts o futuros routes) con queries crudos, las farmacias reciben texto como "Paracetamol 500mg tomar cada 8 horas".

**Impacto:** Medio — produce resultados incorrectos o ruido en búsquedas directas al servicio.

**Solución propuesta:** Llamar `cleanQuery(query)` al inicio de `searchMedicationsDetailed` como primera línea:
```typescript
const safeQuery = cleanQuery(query) || query;
```

**Archivos afectados:**
- `api/src/services/searchService.ts`

**Criterios de aceptación:**
- Test con query crudo produce los mismos resultados que con query limpio
- No rompe el flujo normal (query ya viene limpio del route handler)

**Riesgos:** Ninguno.

**Prioridad:** Media
**Esfuerzo:** 30 minutos

---

### CF-004 — `hasStock` y `laboratory` siempre hardcodeados en Ahumada

**Epic:** Calidad de datos
**Problema:** `ahumada.ts` retorna `hasStock: true` y `laboratory: null` siempre porque el HTML de tiles no expone esa información. Los usuarios pueden ver resultados de Ahumada para productos sin stock o sin laboratorio identificado.

**Impacto:** Medio — puede mostrar medicamentos "disponibles" que en realidad no lo están en tienda física de Ahumada.

**Solución propuesta:** 
1. Investigar si el HTML de tiles contiene algún indicador de disponibilidad (clase CSS, badge, texto)
2. Si no: documentar explícitamente como limitación conocida en el tipo `ScrapedProduct`
3. Considerar llamar al endpoint de PDP de Ahumada para productos prioritarios

**Archivos afectados:**
- `api/src/clients/ahumada.ts`

**Criterios de aceptación:**
- O bien `hasStock` refleja el stock real de Ahumada, o bien se documenta como `undefined`/`null` con semantica "desconocido"

**Riesgos:** Cambio de schema podría requerir actualización de `ScrapedProduct` y lógica de display.

**Prioridad:** Media
**Esfuerzo:** 3–6 horas (requiere análisis del HTML de Ahumada)

---

### CF-005 — `isRelevant()` en Dr. Simi puede traer falsos positivos

**Epic:** Calidad de datos
**Problema:** El filtro de relevancia de Dr. Simi acepta un producto si `queryWords.some(word => name.includes(word))`. Para queries con palabras genéricas o cortas, esto puede incluir productos no relacionados.

**Impacto:** Bajo — genera ruido en los resultados de Dr. Simi, pero `matchKey` luego agrupa los duplicados correctamente.

**Solución propuesta:** Cambiar `some` por un umbral de matches o filtrar palabras de 3 chars de `queryWords` antes de evaluar:
```typescript
const significantWords = queryWords.filter(w => w.length >= 5);
return significantWords.length === 0 || significantWords.some(word => nameLower.includes(word));
```

**Archivos afectados:**
- `api/src/clients/drsimi.ts`

**Criterios de aceptación:**
- Test con "acido" no retorna resultados de "Ácido Fólico" cuando se busca "amoxicilina"

**Riesgos:** Podría excluir medicamentos con nombres cortos legítimos.

**Prioridad:** Baja
**Esfuerzo:** 1 hora + tests

---

### CF-006 — Cobertura de tests insuficiente para casos borde de `matchKey`

**Epic:** Calidad / Mantenibilidad
**Problema:** El test de normalización cubre solo 2 casos de `matchKey`. Los casos de guiones, short-word merging, turno día/noche, y nombres que empiezan con número no tienen tests.

**Impacto:** Bajo en producción actual, alto en mantenibilidad — cualquier cambio a `matchKey` puede romper casos no cubiertos silenciosamente.

**Solución propuesta:** Agregar los tests descritos en la sección "Tests Recomendados" de este documento.

**Archivos afectados:**
- `api/src/__tests__/normalization.test.ts`

**Criterios de aceptación:**
- Al menos 10 casos de `matchKey` cubiertos
- Al menos 3 casos de `cleanQuery` cubiertos
- Al menos 2 casos de `mergeDuplicates` adicionales

**Prioridad:** Baja
**Esfuerzo:** 2–3 horas

---

## Recomendación Final

El módulo de búsqueda funciona correctamente en el flujo principal (búsqueda → caché → display). Los problemas detectados afectan principalmente features secundarias: alertas de precio y comportamiento con farmacias compuestas.

**Prioridad de acción:**

1. **Urgente:** Resolver CF-001 (divergencia `matchKey`) antes del lanzamiento iOS, ya que el feature de alertas de precio es visiblemente prominente y el bug es silencioso.

2. **Corto plazo (sprint actual):** CF-002 y CF-003 son quick wins de bajo riesgo.

3. **Mediano plazo:** CF-004 para mejorar la calidad de datos de Ahumada, y RF-01 (paquete compartido) para eliminar la raíz del problema de divergencia.

4. **Deuda controlada:** CF-005 y CF-006 pueden esperar — el impacto es bajo y el riesgo es tolerable.

El mayor riesgo arquitectónico es la duplicación de `normalization.ts`. Cada nueva feature que use `matchKey` en mobile heredará la divergencia silenciosamente. El refactor hacia un paquete compartido (RF-01) es la solución estructural correcta.
