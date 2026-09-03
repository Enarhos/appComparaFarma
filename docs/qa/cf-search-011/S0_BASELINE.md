# CF-SEARCH-011 — Línea base de v1, reproducida

Todas las cifras salen de `analysis/v1-baseline.json`, producido por
`scripts/shadow-eval.mjs` sobre el corpus congelado de 2026-09-02. Ninguna es una
estimación, y ninguna se reporta de memoria.

**Primer paso obligatorio del ticket (§14): reproducir la línea base antes de
medir v2.** Sin eso, cualquier mejora atribuida a v2 podría ser deriva del
catálogo.

---

## 1. Reproducción contra las cifras publicadas por CF-SEARCH-010

La metodología se copió literalmente de
`docs/qa/cf-search-010/scripts/trace.mjs` y `gap-metrics.mjs`: mismas funciones
del dominio, mismas definiciones, mismo corpus de consultas.

| Métrica | CF-SEARCH-010 (2026-09-01) | CF-SEARCH-011 (2026-09-02) | Δ | Veredicto |
|---|---:|---:|---:|---|
| Ofertas normalizadas | 1.634 | **1.633** | −1 | reproducida |
| Tarjetas emitidas | 1.447 | **1.447** | 0 | **exacta** |
| Farmacias cubiertas | 9/9 | **9/9** | 0 | **exacta** |
| Conceptos (aprox. EDM) | 292 | **292** | 0 | **exacta** |
| Presentaciones (aprox. EDM) | 369 | **372** | +3 | reproducida |
| Presentaciones fragmentadas | 280 | **277** | −3 | reproducida |
| Tasa de fragmentación | 75,9 % | **74,5 %** | −1,4 pp | reproducida |
| Tarjetas por concepto | 4,96 | **4,96** | 0 | **exacta** |
| Tarjetas de una sola farmacia | 89,6 % | **89,7 %** | +0,1 pp | reproducida |
| Tarjetas multi-farmacia | 150 | **149** | −1 | reproducida |
| **False merge rate** | **0,0 %** | **0,0 %** (0/230 pares) | 0 | **exacta** |
| Comparaciones perdidas | 185 | **179** | −6 | reproducida |
| `matchKey` distintos | 440 | **442** | +2 | reproducida |
| `presentationKey` distintos | 874 | **867** | −7 | reproducida |

**Conclusión: la línea base es reproducible.** Las cuatro cifras estructurales
—tarjetas, conceptos, tarjetas por concepto y false merge rate— salieron
idénticas. Las diferencias restantes son de 1 a 7 unidades sobre bases de
1.633 y 372, atribuibles a un día de deriva del catálogo upstream
(ver `CORPUS.md` §4). **No se ajustó ninguna definición para hacerlas coincidir.**

---

## 2. Línea base congelada — es contra ESTA que se mide v2

| Métrica | Valor |
|---|---:|
| Consultas | 16 |
| **Ofertas normalizadas** | **1.633** |
| **Tarjetas emitidas** | **1.447** |
| Observaciones únicas (farmacia + nombre + URL) | 987 |
| Nombres upstream únicos | 975 |
| Farmacias cubiertas | 9 / 9 |
| `matchKey` distintos | 442 |
| `presentationKey` distintos | 867 |
| Tarjetas multi-farmacia | 149 (10,3 %) |
| **Tarjetas de una sola farmacia** | **1.298 (89,7 %)** |
| Pares de ofertas intra-tarjeta evaluados | 230 |
| **False merges** | **0** |
| Grupos de identidad fragmentados | 235 |
| Tarjetas involucradas en fragmentación | 683 |
| Comparaciones perdidas (grupos sin solapamiento de farmacias) | 179 |

### Aproximación al EDM con los ejes que v1 ya sabe leer

| Nivel | Distintos | Ratio vs tarjetas |
|---|---:|---:|
| Concepto (aprox.) | 292 | 0,20 |
| Presentación (aprox.) | 372 | 0,26 |
| `matchKey` | 442 | 0,31 |
| `presentationKey` | 867 | 0,60 |
| **Tarjetas emitidas** | **1.447** | **1,00** |

**Cada concepto se le presenta al usuario, en promedio, repartido en 4,96
tarjetas separadas.** 277 de 372 presentaciones (74,5 %) están repartidas en más
de una tarjeta.

---

## 3. Cómo se define cada métrica

**False merge** — par de ofertas de la MISMA tarjeta que se contradicen en al
menos uno de los 6 ejes que v1 compara: `matchKey`, `combinationKey`,
`commercialVariantKey`, `dosageFormClass`, `isCompatibleUnitCount`,
`isCompatibleConcentration`. Es la definición exacta de CF-SEARCH-010, y es
importante para el Gate C: el detector de v2 es un **superconjunto estricto** de
estos 6 ejes (ver `S0_METRICS.md` §4).

**Fragmentación** — presentación aproximada repartida en más de una tarjeta,
sobre el total de presentaciones aproximadas. La aproximación se construye
**solo con lo que v1 ya sabe leer** (cabecera farmacológica + concentración como
razón + forma + combinación, más cantidad y volumen para la presentación): no
incorpora ningún dato que hoy no exista, y por eso es un piso de la cardinalidad
real, no una propuesta de clave.

**Comparación perdida** — grupo de tarjetas farmacológicamente equivalentes
repartidas **sin ningún solapamiento de farmacias** entre ellas: el usuario no
puede comparar precios porque cada tarjeta trae una farmacia distinta. Misma
técnica que CF-QA-001 §5.

**Observación única** — `farmacia + nombre crudo + URL`. Las 1.633 filas
upstream contienen 987 observaciones únicas porque varias consultas del corpus
devuelven el mismo conjunto (ver `CORPUS.md` §2).
