# CF-SEARCH-003 — Concentración incompatible en formas líquidas

Evidencia de diagnóstico, diseño y QA A/B del issue **#144 (P1)**: la lógica de
deduplicación confundía el **volumen total del envase** con la **concentración
farmacológica**, y fusionaba en una sola tarjeta presentaciones líquidas de
potencia distinta.

Origen: hallazgo `QA-SEARCH-001` de la campaña CF-QA-001
(`docs/qa/search-product-identity/`).

## Qué hay acá

| Ruta | Contenido |
|---|---|
| `QA_SUMMARY.md` | Resultado consolidado: diagnóstico, decisión de diseño, A/B, criterios de aceptación |
| `cases/` | Un documento por falso merge reproducido, con las ofertas reales |
| `raw/` | Captura read-only del endpoint público (`GET /api/search?q=…`), 24 consultas |
| `analysis/` | Salidas de los scripts (JSON), no editadas a mano |
| `scripts/` | Scripts de reproducción — no forman parte del runtime |

## Reproducir

Los scripts comparan DOS compilaciones del dominio: la de `origin/main` (base) y
la de la branch. Hay que compilar la base en un checkout aparte y apuntar
`QA_BASE_DIST` a su `packages/domain/dist/index.js`.

```bash
# 1. captura read-only (opcional: ya está en raw/)
node docs/qa/cf-search-003/scripts/fetch-raw.mjs

# 2. el contrato de matchKey no cambió
QA_BASE_DIST=<base>/packages/domain/dist/index.js \
  node docs/qa/cf-search-003/scripts/matchkey-contract.mjs

# 3. A/B de mergeDuplicates sobre datos reales
QA_BASE_DIST=<base>/packages/domain/dist/index.js \
  node docs/qa/cf-search-003/scripts/ab-merge.mjs

# 4. separación a nivel de par + estabilidad de presentationKey
QA_BASE_DIST=<base>/packages/domain/dist/index.js \
  node docs/qa/cf-search-003/scripts/pair-split.mjs

# 5. evidencia de la política "explícita vs ausente" y cobertura por forma
node docs/qa/cf-search-003/scripts/policy-evidence.mjs
```

## Alcance de la captura

- Endpoint público, `GET`, sin autenticación, sin `?debug=1`, sin cookies.
- **No hay secretos, tokens ni credenciales** en ningún archivo de este
  directorio.
- La captura es un estado del catálogo en un instante: los precios y el surtido
  de las 9 farmacias cambian. Lo reproducible es el **método** y la conclusión
  sobre los nombres capturados, que quedan congelados en `raw/`.
