# CF-DATA-007 — Active Ingredient Vocabulary Coverage for S1 Gate A

Medición y corrección **segura** de la cobertura de principios activos que bloquea
el Gate A de CF-SEARCH-012/S1. Issue #165.

- **Base:** `origin/main` @ `ea386b268d6d2995353e109d73e9e13015035c12`
- **Branch:** `feature/cf-data-007-active-ingredient-coverage`
- **Corpus:** el mismo congelado de S1 (`docs/qa/cf-search-012/raw/`) — 16 consultas,
  1.364 filas upstream, **839 observaciones únicas**, 8 de 9 farmacias
- **Resultado:** **`MORE_DATA_REQUIRED`**

## Definición de Gate A usada, sin sustitutos

```
Gate A = observaciones con IDENTIDAD CANÓNICA ASIGNADA / observaciones totales
```

Ratificada por Mario el 2026-09-03 (`docs/qa/cf-search-012/DECISION.md` §0).
"Identidad canónica asignada" = `assignment.concept.entityId !== null`. **No se
usa** "representada en el registro", "linaje completo" ni "observación
registrada" como numerador alternativo. La Pipeline Coverage se calcula y se
reporta aparte, nunca como Gate A.

| | Antes | Después | Umbral | Resultado |
|---|---:|---:|---:|:--|
| **Gate A** (identidad canónica asignada / ofertas) | 428/839 = **51,01 %** | 458/839 = **54,59 %** | ≥ 99,5 % | **FAIL** |
| Pipeline Coverage (*no* es Gate A) | 100,00 % | 100,00 % | — | — |
| Cobertura farmacológica | 579/839 = 69,01 % | 613/839 = **73,06 %** | — | — |

## Por qué el resultado es `MORE_DATA_REQUIRED` y no un número forzado

El hallazgo que gobierna la decisión es aritmético, no de criterio:

> **Aunque se identificara con precisión perfecta la molécula de TODAS las
> observaciones del residual, el Gate A llegaría como máximo a 570/839 = 67,94 %.**

Porque de las 411 observaciones sin identidad, solo 142 tienen todos los demás
ejes (concentración, forma, vía, unidad) en condiciones de acuñar. Las otras 269
están bloqueadas por el eje de **concentración o forma**, que es otro problema —
documentado como defecto conocido en `docs/qa/cf-search-012/S1_FAILURES.md` y
fuera del alcance de este ticket.

Y dentro de esas 142, la mayoría son **nombres que no escriben ninguna molécula**
("Actron 400 mg x 10 cápsulas", "Rigotax 10 mg", "Zyrtec 10 mg"): ningún
vocabulario puede resolverlas, porque el dato no está en el texto. Requieren una
tabla marca→molécula, que es dato externo.

Ampliar el vocabulario hasta 99,5 % exigiría inventar moléculas. La regla del
proyecto —`UNKNOWN` es mejor que una molécula inventada— lo prohíbe, y este
ticket la respeta: se aprobaron **2 tokens nuevos**, ambos con evidencia
documentada, y se rechazaron o dejaron en revisión los otros 23.

## Qué se cambió

| Archivo | Cambio |
|---|---|
| `packages/domain/src/searchV2/compositionReader.ts` | `omeprazol` y `esomeprazol` en `V2_MOLECULE_VOCABULARY`, con el criterio de evidencia (E2) documentado |
| `packages/domain/src/__tests__/searchV2.compositionReader.test.ts` | 16 tests nuevos (6 positivos, 10 negativos por clase de riesgo); 1 fila de caracterización actualizada |
| `packages/domain/src/__tests__/searchV2.conceptCollision.test.ts` | el test del límite de S1 pasa a usar `tibolona` (molécula que sigue sin resolverse); se agrega el test de acuñación de omeprazol |

**Cero cambios en v1.** No se tocó `COMPOSITION_VOCABULARY`, `matchKey`,
`presentationKey`, `combinationKey`, `mergeDuplicates`, slugs, Mobile, history,
alerts ni clicks. Ver `APPROVED_VOCABULARY.md` §3 para la medición que sostiene
esa decisión.

## Documentos

| Archivo | Qué contiene |
|---|---|
| `RESIDUAL_CENSUS.md` | Las 10 categorías A–J, 100 % del residual clasificado, antes y después |
| `CANDIDATES.md` | Las 4 fuentes de evidencia admitidas y el veredicto de cada candidato |
| `APPROVED_VOCABULARY.md` | Los 2 tokens aprobados, su evidencia y por qué van en v2 y no en v1 |
| `REJECTED_TOKENS.md` | Los 15 rechazados por clase de riesgo y los 8 en revisión |
| `PARSER_GAPS.md` | Por qué no hubo ningún arreglo de parser (categoría B = 0) |
| `METRICS.md` | Métricas completas del corpus entero, antes → después |
| `REGRESSIONS.md` | Regresión completa y las protecciones que se mantienen |
| `DECISION.md` | La decisión `MORE_DATA_REQUIRED` y qué haría falta para superar el gate |

## Artefactos

| Archivo | Qué contiene |
|---|---|
| `residual-census.csv` | Una fila por observación sin identidad (381 después), con su categoría |
| `candidate-ranking.csv` | Un candidato por fila, con qué fuente lo sostiene y su veredicto |
| `before-after.json` | Todas las métricas antes/después en un solo objeto |
| `analysis/census-full.json` | Censo completo, una fila por observación con todos sus ejes |
| `analysis/residual-classified.json` | Residual con categoría asignada |
| `analysis/candidates.json` | Candidatos crudos de la regla de CF-DATA-001 |
| `analysis/verdicts.json` | Veredictos, controles positivos y fugas de negativos |
| `analysis/head-tokens.json` | Discriminantes comerciales del residual sin molécula |

## Reproducir

```bash
pnpm --filter @comparafarma/domain exec tsc --project tsconfig.build.json
node docs/qa/cf-data-007/scripts/census.mjs      # censo del corpus congelado
node docs/qa/cf-data-007/scripts/classify.mjs    # residual → 10 categorías
node docs/qa/cf-data-007/scripts/candidates.mjs  # regla de CF-DATA-001
node docs/qa/cf-data-007/scripts/ranking.mjs     # veredictos + controles
```

Todo corre **offline** contra el corpus congelado: sin red, sin Supabase, sin
shadow y sin escribir en ninguna base productiva.
