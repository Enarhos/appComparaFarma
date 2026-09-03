# CF-SEARCH-012 — S1: Registro Canónico Persistente + Shadow Mode Productivo

**Issue:** #163 · **Decisión que lo habilita:** ADR-0005 (`BUILD_SEARCH_ENGINE_V2`) ·
**Fase previa:** CF-SEARCH-011 / S0 (`PASS_S0`, PR #159).

**Base:** `origin/main` @ `38ac1e8b7cd1ef557cd9f5df45993316c6153b97` (merge del PR #159).
**Branch:** `feature/cf-search-012-s1-persistent-registry-shadow`.
**Captura del corpus:** 2026-09-03 (UTC), read-only contra `/api/search` de producción.

---

## 1. Qué es esto, y qué NO es

S1 construye el **primer registro canónico PERSISTENTE** de Search Engine v2 y el
**runtime de shadow** que lo alimentaría en producción.

**v1 sigue siendo la única fuente de verdad visible.** El shadow está APAGADO por
defecto, no está desplegado, y no hay una sola respuesta de usuario que dependa de
v2. El payload de `/api/search`, el orden, los precios, los slugs, `matchKey`,
`presentationKey` y `mergeDuplicates` no cambian de comportamiento.

**Lo que S1 hace:**

- persiste identidad canónica real (`CFM-CONCEPT-ID`, `CFM-PRESENTATION-ID`,
  `CFM-PRODUCT-ID`, `CFM-OFFER-ID`) con IDs de secuencia que **no rotan nunca**;
- separa explícitamente canonicalización, resolución y asignación de identidad;
- implementa el shadow productivo con interruptor, muestreo determinista,
  timeout, aislamiento de errores y `waitUntil` cuando la plataforma lo expone;
- agrega el **Gate D** (Concept Semantic Collision Rate) con sus ocho clases;
- recalcula S0 ENTERO con la implementación persistente: ninguna cifra se
  reutiliza.

**Lo que S1 NO hace** (fuera de alcance explícito): desplegar, encender el shadow,
mandar tráfico a v2, cambiar ranking o payload, migrar Mobile / historial /
alertas / clicks, usar el ISP como fuente de verdad (#157 abierto), ni iniciar S2.

---

## 2. Resultado

```
Gate A — Offer Coverage ............ 839/839  100,0000 %   umbral ≥ 99,5 %   PASS
Gate B — SPLIT_LOST ................ 0                     umbral = 0        PASS
Gate C — False Merge Rate .......... 0/202 pares           umbral = 0        PASS
Gate D — Concept Semantic Collision  0/2.024 pares         umbral = 0        PASS
Persistent ID Instability .......... 0 rotaciones          umbral = 0        PASS

VEREDICTO: PASS_S1
```

**Con una condición que no se disimula:** solo el **51,01 %** de las observaciones
llega a tener un `CFM-CONCEPT-ID`. El detalle, su causa medida y por qué es
condición de bloqueo para S2 están en `DECISION.md` §3 y `S1_FAILURES.md`.

---

## 3. Documentos

| Documento | Qué contiene |
|---|---|
| `ARCHITECTURE.md` | Las tres responsabilidades separadas y dónde vive cada una |
| `PERSISTENT_REGISTRY.md` | Las entidades persistidas, sus cardinalidades reales y qué es inmutable |
| `SCHEMA.md` | El esquema, sus restricciones, índices, costo y estrategia de aplicación |
| `IDENTITY_ASSIGNMENT.md` | La regla de acuñación, la tabla de decisión y la concurrencia |
| `SHADOW_RUNTIME.md` | Interruptor, muestreo, modelo de ejecución, aislamiento y métricas |
| `GATES.md` | Definición operativa de los cuatro gates y del Gate D en detalle |
| `S1_METRICS.md` | Todas las cifras, recalculadas desde el corpus congelado |
| `S1_FAILURES.md` | Lo que S1 encontró — incluido lo que S1 no resuelve |
| `ROLLBACK.md` | Cómo se revierte, en qué orden y qué se pierde |
| `DECISION.md` | Los gates, el veredicto y la recomendación, sin ambigüedad |

---

## 4. Reproducibilidad

```
scripts/     queries.json (corpus congelado) + captura + evaluador
analysis/    resultados agregados y evidencia (versionado)
raw/         16 sobres de /api/search (NO versionado — dump regenerable)
```

```bash
pnpm install                                                # compila packages/domain a dist/
node docs/qa/cf-search-012/scripts/fetch-raw.mjs --set all  # captura read-only del corpus
node docs/qa/cf-search-012/scripts/s1-eval.mjs              # registro persistente + gates
```

El evaluador carga `@comparafarma/domain` desde su `dist/` compilado **por ruta**
(`QA_DOMAIN_DIST` / `QA_DOMAIN_V2_DIST` para apuntar a otro build), el mismo
patrón que CF-SEARCH-003, CF-DATA-001, CF-SEARCH-010 y CF-SEARCH-011: `docs/` no
es un paquete del workspace.

**Todas las mediciones usan las MISMAS funciones que correrían en producción.** El
evaluador no reimplementa ninguna regla: llama a `assignIdentity()` contra
`InMemoryCanonicalRegistry`, que es la referencia semántica exacta del repositorio
Supabase.

`raw/` y `analysis/observations-s1.csv` están excluidos por `.gitignore`: son
dumps regenerables. Se versionan el script, el corpus de consultas, el resultado
agregado y la evidencia de fallos.

---

## 5. Dónde vive el código

```
packages/domain/src/searchV2/
├── registryTypes.ts             contratos del registro + versiones + IDs permanentes
├── canonicalResolver.ts         RESOLUTION: firma observada vs registro (pura)
├── canonicalIdentityAssigner.ts IDENTITY ASSIGNMENT: acuñar o reutilizar (escribe)
├── registryMemory.ts            referencia semántica en memoria (tests + harness)
├── conceptCollision.ts          Gate D: las 8 clases de contradicción
└── (S0, sin cambios de conducta: canonicalTypes, canonicalAttributes,
     canonicalConcentration, compositionReader, canonicalIdentity, canonicalize)

api/src/
├── lib/canonicalRegistryDb.ts   único archivo con PostgREST del registro
├── lib/searchV2ShadowConfig.ts  interruptor + muestreo determinista
├── lib/afterResponse.ts         waitUntil / ejecución desacoplada + timeout
└── services/searchV2Shadow.ts   runtime de shadow (apagado por defecto)
```

`searchV2` **sigue sin reexportarse desde el barrel raíz** de
`@comparafarma/domain`. `api/` lo importa por el subcamino
`@comparafarma/domain/searchV2`, exclusivamente para el shadow; `web/` y
`mobile/` no lo importan y su superficie no cambia.

---

## 6. Estado

**CODE_READY.** No es `CONFIG_READY`, no es `DEPLOYED` y no es
`PRODUCTION_VERIFIED` (CLAUDE.md §6). La migración de
`docs/technology/database/schema.sql` **no se ha ejecutado**, el shadow está
apagado y no hubo deploy.
