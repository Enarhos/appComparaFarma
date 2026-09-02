# CF-SEARCH-010 — Artefactos de análisis

Derivados de `../raw/` por los scripts de `../scripts/`. Se versionan los que
sirven de evidencia; los intermedios grandes se regeneran.

| Archivo | Producido por | Contenido |
|---|---|---|
| `metrics.json` | `trace.mjs` | Contadores de la Fase 3 del ticket |
| `offers.csv` | `trace.mjs` | Una fila por oferta con los 6 ejes de identidad recomputados |
| `edm-gap.json` | `gap-metrics.mjs` | Cardinalidad por nivel del EDM, fragmentación y los 4 defectos cuantificados |
| `concept-fragmentation.csv` | `gap-metrics.mjs` | Presentaciones aproximadas y en cuántas tarjetas se reparten |
| `case-ambroxol-30mg.txt` / `.json` | `case-ambroxol.mjs` | Traza completa de las 57 tarjetas del caso del ticket |
| `isp-source-probe.json` | `probe-isp.mjs` | Estado real de la fuente regulatoria (read-only) |

**No versionado:** `offers.json` (2,2 MB). Es el mismo contenido de
`offers.csv` en JSON, se regenera con `node scripts/trace.mjs` en segundos.
Mismo criterio que `docs/qa/cf-data-001/README.md` aplicó a sus capturas crudas.
