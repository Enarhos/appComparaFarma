# CF-SEARCH-011 — S0: Canonical Identity + Shadow Evaluation Foundation

**Issue:** #155 · **Decisión que lo habilita:** CF-SEARCH-010 / #150 → `BUILD_SEARCH_ENGINE_V2`
(`docs/technology/decisions/adr/ADR-0005_SEARCH_ENGINE_V2_EDM.md`).

**Base:** `origin/main` @ `2ab1065492eb20fe4c59ede7f1a150b0c513f759` (merge del PR #158).
**Branch:** `feature/cf-search-011-s0-canonical-identity`.
**Captura del corpus:** 2026-09-02 (UTC).

---

## 1. Qué es esto, y qué NO es

S0 **no reemplaza Search Engine v1** y no cambia una sola respuesta al usuario.
Su única pregunta es:

> ¿Se puede construir, sobre ofertas reales de las 9 farmacias, una identidad
> canónica v2 suficientemente correcta y completa como para justificar seguir?

La respuesta, con los tres gates medidos, está en `DECISION.md`.

**Lo que S0 hace:** implementa el modelo canónico
(`Concepto → Presentación → Producto Comercial → Oferta`), lo ejecuta en shadow
mode sobre el corpus congelado, y compara oferta por oferta contra v1.

**Lo que S0 NO hace** (fuera de alcance explícito, §27 del ticket): reemplazar
`searchService`, exponer v2 a tráfico real, cambiar el payload de `/api/search`,
tocar UI, slugs, `price_history`, alertas, clicks, favoritos o `mobile/`,
implementar el registro persistido, integrar ISP, ni iniciar S1.

**v1 es inmutable en S0.** `matchKey`, `presentationKey`, `mergeDuplicates`,
`queryIntent`, el ranking y la salida de `searchService` no cambian de
comportamiento. Se verifica con los 379 tests preexistentes de
`@comparafarma/domain`, que siguen verdes sin modificar ni uno.

---

## 2. Documentos

| Documento | Qué contiene |
|---|---|
| `CORPUS.md` | El corpus congelado, cómo se capturó y por qué no se redujo |
| `S0_BASELINE.md` | Línea base de v1 reproducida, y su comparación contra las cifras publicadas por CF-SEARCH-010 |
| `CANONICAL_IDENTITY_IMPLEMENTATION.md` | El modelo implementado: entidades, ejes, resolución por subsunción, provenance |
| `V1_V2_COMPARISON.md` | Clasificación de las diferencias v1↔v2 y los cinco casos de control |
| `S0_METRICS.md` | Todas las métricas exigidas por §20 del ticket |
| `S0_FAILURES.md` | Los defectos que S0 encontró — incluidos los que S0 no puede resolver |
| `DECISION.md` | Los tres gates y el veredicto, sin ambigüedad |

---

## 3. Reproducibilidad

```
scripts/     queries.json (corpus congelado) + los 3 scripts que producen todo
analysis/    resultados agregados y evidencia de los casos de control
raw/         16 sobres de /api/search (NO versionado — dump regenerable)
```

```bash
pnpm install                                                # compila packages/domain a dist/
node docs/qa/cf-search-011/scripts/fetch-raw.mjs --set all  # captura el corpus congelado
node docs/qa/cf-search-011/scripts/shadow-eval.mjs          # v1 vs v2 + gates
node docs/qa/cf-search-011/scripts/debug-case.mjs "<nombre>" ["<nombre>" ...]
```

Los scripts cargan `@comparafarma/domain` desde su `dist/` compilado **por
ruta** (`QA_DOMAIN_DIST` / `QA_DOMAIN_V2_DIST` para apuntar a otro build), el
mismo patrón que ya usan los scripts de CF-SEARCH-003, CF-DATA-001 y
CF-SEARCH-010: `docs/` no es un paquete del workspace.

**Todas las mediciones usan las MISMAS funciones del dominio que corren en
producción.** No hay reimplementación de reglas de v1 en los scripts.

`raw/` y `analysis/offers-v1-v2.csv` están excluidos por `.gitignore`: son dumps
regenerables (§23 del ticket). Lo que sí se versiona es el script, el corpus de
consultas, el resultado agregado y la evidencia de los casos de control.

---

## 4. Dónde vive el código

```
packages/domain/src/searchV2/
├── canonicalTypes.ts          las 4 entidades del EDM + provenance
├── canonicalConcentration.ts  concentración como EVIDENCIA (ratio | mass-only | absent)
├── canonicalAttributes.ts     etapa 2: texto libre → atributos tipados
├── canonicalIdentity.ts       IDs deterministas + resolución por subsunción
├── canonicalize.ts            etapas 3-6: concepto → presentación → producto → oferta
└── index.ts                   barrel (NO reexportado desde el barrel raíz)
```

`searchV2` **no se exporta desde `packages/domain/src/index.ts`**: la superficie
pública de `@comparafarma/domain` queda literalmente sin cambios y ni `mobile/`,
ni `web/`, ni `api/` pueden importarlo. Motivo en el encabezado de
`searchV2/index.ts`.

El único archivo de v1 tocado es `packages/domain/src/concentration.ts`, con
**una función nueva y pura** (`concentrationRatio`) que ninguna función
preexistente llama — justificación en `CANONICAL_IDENTITY_IMPLEMENTATION.md` §6.
