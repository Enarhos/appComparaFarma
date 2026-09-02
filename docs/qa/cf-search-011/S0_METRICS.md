# CF-SEARCH-011 — Métricas de S0

Fuente: `analysis/v1-baseline.json`, `analysis/v2-metrics.json`,
`analysis/comparison.json`. Corpus congelado de 2026-09-02, 16 consultas.

---

## 1. Volumen y cobertura

| Métrica | Valor |
|---|---:|
| Total upstream offers (filas de `card.prices[]`) | **1.633** |
| Total v1 normalized offers | **1.633** |
| Observaciones únicas (farmacia + nombre + URL) | 987 |
| **Total v2 processed offers** | **1.633** |
| **Offer coverage** | **1633/1633 = 100,0000 %** |
| Ofertas sin enlace canónico correcto | **0** |

"Enlace correcto" = la oferta produce una `CanonicalOffer` **y** su cadena
`offer → product → presentation → concept` existe entera y es consistente en el
grafo. No basta con que el ID no sea nulo.

---

## 2. Cardinalidad v2

| Nivel | Distintos | Ratio vs tarjetas v1 |
|---|---:|---:|
| `conceptId` | **303** | 0,21 |
| `presentationId` | **414** | 0,29 |
| `productId` | **755** | 0,52 |
| `offerId` | **987** | — |
| **Colisiones de identificador** | **0** | — |

Cero colisiones = ninguna pareja de firmas distintas compartió identificador en
ninguno de los tres niveles. Compárese con los **4 pares de productos con hash de
slug compartido** que CF-SEARCH-010 midió en v1.

Los 303 conceptos de v2 contra los 292 de la aproximación v1 no son un empeoramiento:
la aproximación de v1 se construye con menos ejes y colapsa cosas que v2 separa
correctamente (sólido vs líquido de la misma masa, combinaciones, cabeceras no
resueltas).

---

## 3. Agrupación

| Métrica | V1 | V2 (tarjeta = `productId`) | V2 (grupo = `presentationId`) |
|---|---:|---:|---:|
| Tarjetas / grupos emitidos | 1.447 | **755** | **414** |
| Multi-farmacia | 149 | 120 | **159** |
| Una sola farmacia | 1.298 | 635 | 255 |
| **Tasa de una sola farmacia** | **89,7 %** | **84,1 %** | **61,6 %** |
| Tarjetas por concepto v2 | 4,78 | **2,49** | 1,37 |
| Fragmentación (denominador común: 414 presentaciones v2) | **72,0 %** | **36,0 %** | — |

**Lectura honesta del conteo absoluto multi-farmacia (149 → 120).** No es una
regresión: v2 emite **48 % menos tarjetas** (755 vs 1.447), así que el conteo
absoluto baja aunque la *tasa* mejore (10,3 % → 15,9 % de tarjetas
multi-farmacia). La métrica que el diseño aprobado señala como la relevante es la
del **grupo de presentación**, que es donde v2 pone la comparación (etapa 9:
tarjeta = producto, grupo = presentación): ahí hay **159 grupos multi-farmacia** y
la tasa de una sola farmacia cae de 89,7 % a **61,6 %**.

---

## 4. Calidad de identidad

| Métrica | Valor |
|---|---:|
| Pares intra-producto evaluados | 533 |
| **False merges (definición comparable con la línea base v1)** | **0** |
| **False merges (definición estricta de concentración)** | **0** |
| **False merge rate** | **0,000000** |
| **SPLIT_LOST (ofertas sin enlace correcto)** | **0** |
| **SPLIT_LOST (par contradictorio fusionado por v2)** | **0** |
| False splits — `MERGE_REGRESSION` | **7 pares** (3 pares distintos) |
| Identity unknown (ofertas sin principio activo demostrable) | **598 (36,6 %)** |
| Identidad inferida por subsunción | **131 (8,0 %)** |
| Ofertas con evidencia estructurada (concentración **y** forma legibles) | **1.208 (74,0 %)** |
| Estabilidad de `conceptId` entre contextos de resolución | **99,88 %** |

### Resolución del concepto, oferta por oferta

| Tipo | Ofertas | % | Significado |
|---|---:|---:|---|
| `complete` | 1.185 | 72,6 % | todos los ejes declarados |
| `subsumed` | 131 | 8,0 % | firma parcial adoptada por una única anfitriona |
| `isolated` | 105 | 6,4 % | firma parcial sin ninguna anfitriona compatible |
| `ambiguous` | 212 | 13,0 % | firma parcial con 2+ anfitrionas: **no se eligió** |

Las 212 ofertas `ambiguous` son la parte del corpus donde v2 **se niega
explícitamente a adivinar**. Es la métrica que hay que vigilar en S1: cada una es
una asignación que el registro persistido puede resolver una vez, y que hoy se
recalcula sin evidencia suficiente.

**Los 598 `identity unknown` (36,6 %) son el techo de calidad de S0**, y su causa
es única y conocida: `COMPOSITION_VOCABULARY` cubre 34 moléculas medidas sobre el
corpus de CF-DATA-001, no la farmacopea. Una molécula ausente produce una cabecera
`unresolved-head` — un falso negativo conservador, nunca una identidad inventada.

---

## 5. Comparación V1 vs V2

| Métrica | Valor |
|---|---:|
| Pares comparados | 94.869 |
| **Disagreement rate** | **0,85 %** |
| `UNCHANGED` | 94.062 |
| **`MERGE_FIXED`** | **748** |
| **`SPLIT_FIXED`** | **52** |
| `MERGE_REGRESSION` | 7 |
| **`SPLIT_LOST`** | **0** |
| `IDENTITY_UNKNOWN` | 360 |

Relación mejora/regresión: **114 a 1** (800 pares corregidos contra 7
regresiones).

---

## 6. Rendimiento

Medido con `performance.now()` sobre el evaluador shadow. **Solo se mide; no se
optimizó nada** (§20 del ticket).

| Métrica | Valor |
|---|---:|
| Corpus completo (987 observaciones, resolución única) | **87,8 ms** |
| **p50 por consulta** (~102 ofertas) | **6,5 ms** |
| **p95 por consulta** | **11,3 ms** |
| Consultas medidas | 16 |

Contexto: el objetivo de `SHADOW_MODE_DESIGN.md` §3 para v2 es
`≤ v1 + 150 ms p95`. Con 11,3 ms p95 el margen es amplio, pero **es una medición
offline sobre datos ya en memoria**: no incluye retrieval, ni serialización, ni
el arranque en frío de una función serverless. No se puede extrapolar a
producción sin medirlo ahí, y S0 no lo hace.

El algoritmo de resolución es O(n²) sobre firmas **distintas** por nivel. Con 987
observaciones y ~400 firmas distintas eso no se nota; con un registro persistido
(S1) la búsqueda de anfitrionas pasa a ser una consulta indexada y el problema
desaparece. Registrado como deuda, no como bloqueo.

---

## 7. Métricas explícitamente NO medidas en S0

- **Precisión de top results** — requiere juez humano; CF-SEARCH-010 ya lo dejó
  pendiente y S0 no lo resuelve.
- **Wrong detail navigation / colisiones de slug** — S0 no toca routing.
- **Latencia en producción** — v2 no está desplegado y no debe estarlo.
- **Cobertura de registro ISP** — 0 % por diseño: CF-DATA-005 (#156) es
  independiente y S0 no depende de él.
