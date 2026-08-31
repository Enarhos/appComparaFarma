# CF-QA-001 — Search Product Identity & Price Comparison QA

Campaña formal de QA sobre la identidad de producto y la comparación de precios de
ComparaFarma / PreciosFarma. Este directorio contiene **evidencia**, no gobierno:
no reemplaza ni modifica ninguna fuente canónica de `docs/`.

## Por qué existe `docs/qa/`

`docs/README.md` (fuente canónica de la estructura documental, `origin/main@acd79bf`)
no define ningún dominio de QA: los lugares existentes más cercanos son
`docs/technology/reviews/` (Engineering Reviews ER-XXX, documentos de juicio técnico)
y `docs/program/backlog/issues/` (issues CF-XXX pendientes). Ninguno de los dos es un
sitio adecuado para **datos crudos de producción, matrices normalizadas y scripts de
análisis**, que es la mayor parte de lo que produce esta campaña.

Se verificó antes de crear la carpeta:

```
$ git ls-tree -r --name-only origin/main -- docs/ | grep -iE "qa|test|evidence"
docs/archive/engineering/issues/CF-107_TESTS_SUBMODULOS.md
docs/archive/foundational-book/appendix/El-Test-De-La-Confianza.md
(ningún docs/qa/ ni equivalente)
```

Por eso se crea `docs/qa/<campaña>/` como ubicación de evidencia. **Los hallazgos que
deban gobernar trabajo futuro no viven acá**: van a `docs/program/backlog/issues/`
como issues CF-XXX, y el juicio técnico consolidado, si el CTO lo pide, a
`docs/technology/reviews/ER-00N`. Este directorio es la evidencia que los sostiene.

## Contenido

| Ruta | Qué es |
|---|---|
| `QA_SUMMARY.md` | Resumen ejecutivo, cobertura, resultado de los 12 tests, veredicto del PR |
| `cases/QA-SEARCH-0NN.md` | Un archivo por hallazgo, con evidencia reproducible |
| `raw/<query>.json` | Respuesta RAW de `/api/search` por consulta, con URL y timestamp |
| `analysis/offers.csv` · `offers.json` | Matriz normalizada, una fila por oferta |
| `analysis/findings.json` | Salida cruda de los detectores automáticos |
| `analysis/ab-merge.json` | Comparación A/B de `mergeDuplicates` entre los dos entornos |
| `analysis/laboratory-matrix.json` | Cobertura de `laboratory` y truncamiento por farmacia |
| `analysis/nav-check.json` · `nav-resolve-rate.json` | Navegación real tarjeta → ficha en Web de producción |
| `screenshots/` | Ver `screenshots/README.md` — no hubo navegador disponible |

## Entornos comparados

| | Entorno 1 — "Producción actual" | Entorno 2 — "PR bajo prueba" |
|---|---|---|
| Branch | `origin/main` | `fix/quantity-mismatch-false-merge` |
| SHA | `acd79bf6f22b79b5fb96d49f0df0a90244743f57` | `b20402a77d71894e7f920d06a91ffa4a0f2910ad` |
| Base | — | `acd79bf` (`git merge-base` verificado) |
| Worktree | `C:\Belford\wt-qa-search-identity` (creado para esta campaña) | `C:\Belford\wt-quantity-mismatch` (preexistente, solo lectura) |
| Rol | fuente de los datos RAW y línea base de dedup | recomputación local de identidad/dedup |

Incluye en producción: CF-SEARCH-001 (PR #132), CF-SEARCH-002 (PR #133),
BIOEQUIVALENCE-DATA-QUALITY-01 (PR #141). **No** incluye el fix de cantidad.

Versiones: `packages/domain` 1.0.0 · `web` 0.1.0 · `mobile` 1.0.0 · `api` (sin
`version` en su `package.json`) · Node v24.14.0.
No hay feature flags que afecten búsqueda: el único parámetro de comportamiento del
endpoint es `?debug=1`, que **no se usó** (requiere `API_SECRET_KEY`).

## Cómo reproducir

Requisitos: Node ≥ 20 y los dos builds de `@comparafarma/domain` compilados.

```bash
# 1. Build de dominio de cada entorno (emite a dist/, ignorado por git)
cd C:/Belford/wt-qa-search-identity/packages/domain
  C:/Belford/wt-quantity-mismatch/node_modules/.bin/tsc --project tsconfig.build.json
cd C:/Belford/wt-quantity-mismatch/packages/domain
  ../../node_modules/.bin/tsc --project tsconfig.build.json

# 2. Captura RAW (28 consultas, ~1 req/s, endpoint publico sin auth)
cd C:/Belford/wt-qa-search-identity
node docs/qa/search-product-identity/analysis/fetch-raw.mjs

# 3. Analisis de identidad + A/B de mergeDuplicates
node docs/qa/search-product-identity/analysis/analyze.mjs

# 4. Navegacion real contra Web de produccion
node docs/qa/search-product-identity/analysis/nav-check.mjs
node docs/qa/search-product-identity/analysis/nav-resolve-rate.mjs
```

El build de dominio de este worktree emite 2 errores de tipo
(`Cannot find name 'URL'` en `commercialIdentity.ts:403,457`) porque el worktree de
evidencia no tiene `node_modules` propio y por lo tanto no tiene `@types/node`. Son
errores de *tipado*, no de emisión: `tsc` genera el JS igual y el comportamiento
observado es el de `origin/main`. El typecheck real del proyecto
(`pnpm typecheck` con dependencias instaladas) pasa limpio — ver `QA_SUMMARY.md` §6.

## Restricciones respetadas

- Solo `GET` públicos read-only. Ningún `POST`, ninguna acción transaccional,
  ninguna compra, ningún redirect de `/api/go` seguido hasta la farmacia.
- Sin credenciales, sin `x-api-key`, sin `?debug=1`. Ningún archivo de `raw/`
  contiene headers ni tokens (los sobres guardan URL, timestamp, status y cuerpo).
- No se modificó código de producción (`api/`, `web/`, `mobile/`, `packages/domain`).
- `C:\Belford\wt-quantity-mismatch` se usó **solo** para leer y compilar; sin commits.
