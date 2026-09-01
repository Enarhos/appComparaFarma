# CF-WEB-002 — Evidencia: fichas de medicamento que no resuelven desde resultados

Campaña de diagnóstico, corrección y QA A/B del defecto P1 detectado por
CF-QA-001 (`docs/qa/search-product-identity/cases/QA-SEARCH-002.md`): enlaces
`/medicamento/<slug>` **emitidos por la propia página de resultados** que
llevan a "Medicamento no encontrado".

## Qué hay acá

| Ruta | Contenido |
|---|---|
| `QA_SUMMARY.md` | Diagnóstico, causa raíz medida, diseño elegido, A/B y criterios de aceptación |
| `cases/` | Un caso por defecto reproducido, con su evidencia |
| `raw/baseline/` | Respuestas crudas de `/api/search` — el corpus FUENTE, congelado |
| `analysis/baseline.json` | Corrida A/B contra `origin/main` (`5a1e7e3`) |
| `analysis/fixed.json` | Corrida A/B contra la branch, MISMO corpus |
| `analysis/comparison.json` | Comparación métrica de las dos corridas |
| `analysis/urls-*.csv` | Un renglón por enlace generado y su clasificación |
| `scripts/` | El arnés reproducible |
| `screenshots/` | Ver `screenshots/README.md` |

## Cómo reproducir

```bash
# 1. Línea base — código de origin/main, corpus congelado
mkdir -p /tmp/qa-base/lib
for f in medicationSlug.ts resolveMedication.ts search.ts; do
  git show 5a1e7e3:web/src/lib/$f > /tmp/qa-base/lib/$f
done
node docs/qa/cf-web-002/scripts/nav-audit.mjs \
  --label baseline --sample 8 --reuse-raw --web-src /tmp/qa-base

# 2. Después del fix — MISMO corpus (`--raw-label baseline`)
node docs/qa/cf-web-002/scripts/nav-audit.mjs \
  --label fixed --sample 8 --reuse-raw --raw-label baseline

# 3. Comparación
node docs/qa/cf-web-002/scripts/compare.mjs
```

## Qué mide el arnés (`scripts/nav-audit.mjs`)

Para cada `MedicationResult` de `/api/search`:

1. genera el enlace **con el código real** de `web/src/lib/medicationSlug.ts`;
2. lo resuelve **con el código real** de `web/src/lib/resolveMedication.ts`
   (que ejecuta su propia búsqueda en vivo contra el mismo API);
3. clasifica: `RESOLVED_EXACT` · `REDIRECTED` · `RESOLVED_WRONG_PRODUCT` ·
   `AMBIGUOUS` · `NOT_FOUND` · `ERROR`.

No reimplementa ninguna de las dos funciones: las importa por ruta con un hook
de resolución de alias (`scripts/alias-hook.mjs`), porque reimplementarlas
invalidaría la medición. `--web-src` es lo que permite correr el MISMO arnés
contra dos revisiones del código.

La igualdad de producto (`SAME_PRODUCT`) se decide con `isSameProduct()` de
`@comparafarma/domain` — la misma función que `deduplication.ts` usa para
decidir si dos ofertas son el mismo artículo — más igualdad de
`presentationKey`. No hay un criterio de identidad propio del QA.

Además del muestreo en vivo, el arnés hace un **análisis estático sobre la
población completa** de cada respuesta: cuántas tarjetas distintas generan el
mismo hash de slug. Eso no depende de la red ni del muestreo y es reproducible
offline sobre `raw/`.

## Alcance y seguridad

- Solo `GET` público a `/api/search`. Sin `?debug=1`, sin `x-api-key`, sin
  secretos enviados ni almacenados.
- Ninguna escritura en base de datos del proyecto.
- Espaciado de 1,2 s entre llamadas (el límite del endpoint es 60/min).
