# CF-DATA-007 — Métricas del corpus entero, antes → después

Recalculadas **desde cero** sobre el corpus congelado completo, con el mismo
camino de asignación persistente que usa S1. Ninguna cifra se reutiliza.
Artefacto: `before-after.json`.

## 1. Cobertura

| Métrica | Antes | Después | Δ |
|---|---:|---:|---:|
| Total observations | 839 | 839 | 0 |
| Active ingredient **demonstrated** | 579 | **613** | +34 |
| Active ingredient **unknown** | 260 | **226** | −34 |
| **Pharmacological coverage** | 69,01 % | **73,06 %** | +4,05 pp |
| **Canonical identity assignment coverage** | 428/839 = 51,01 % | **458/839 = 54,59 %** | **+3,58 pp** |
| Unassigned | 411 | **381** | −30 |
| Pipeline Coverage (*no* es Gate A) | 100,00 % | 100,00 % | 0 |
| Comparable unit rate | 37,78 % | 41,36 % | +3,58 pp |

## 2. Registro

| Métrica | Antes | Después | Δ |
|---|---:|---:|---:|
| Concept count | 76 | 81 | +5 |
| Presentation count | 87 | 94 | +7 |
| Product count | 271 | 283 | +12 |
| Product–presentation pairs | 227 | 242 | +15 |
| Comparable units | 210 | 225 | +15 |
| Signature aliases | 434 | 458 | +24 |

## 3. Desenlaces de resolución (nivel concepto)

| Desenlace | Antes | Después | Δ |
|---|---:|---:|---:|
| exact | 390 | 416 | +26 |
| subsumed | 38 | 42 | +4 |
| **ambiguous** | 75 | 78 | +3 |
| **unresolved** | 336 | 303 | −33 |

Los 3 `ambiguous` adicionales son observaciones que antes eran `unresolved` (sin
ningún candidato) y ahora tienen candidatos pero no desempate. Es un avance de
estado, no una regresión: pasan de "no sé nada" a "sé que se parece a estos".
Ninguna observación asignada perdió su identidad.

## 4. Seguridad — los gates que no se pueden mover

Recalculados con el evaluador de S1 (`docs/qa/cf-search-012/scripts/s1-eval.mjs`)
sobre una copia aislada, **sin sobrescribir la evidencia comiteada de S1**.

| Gate | Antes | Después | Umbral | |
|---|---:|---:|---:|:--|
| B — SPLIT_LOST | 0 | **0** | 0 | PASS |
| C — False Merge Rate | 0/202 | **0/260** | 0 | PASS |
| D — Concept Semantic Collision Rate | 0/2.024 | **0/2.280** | 0 | PASS |
| Persistent ID Instability | 0 rotaciones | **0 rotaciones** | 0 | PASS |
| Falsos splits de agrupación | 0 | **0** | — | PASS |

Los denominadores de C y D **crecieron** (más pares comparables) y la tasa siguió
en 0: el motor comparó más y no se contradijo más.

### Estabilidad persistente — 7 de 7 PASS

| Test | Antes | Después |
|---|---|---|
| queryIndependence | PASS (397 obs., 0 violaciones) | PASS (397 obs., 0 violaciones) |
| pharmacyIndependence | PASS (101 firmas, 0) | PASS (100 firmas, 0) |
| orderIndependence | PASS (77 grupos) | PASS (82 grupos) |
| corpusIndependence | PASS (419 obs., 0 rotadas) | PASS (419 obs., 0 rotadas) |
| partialObservation | PASS (76 conceptos, **0 acuñaciones ilegales**) | PASS (81 conceptos, **0 acuñaciones ilegales**) |
| concurrentCreation | PASS | PASS |
| canonicalizerVersionChange | PASS (76 reenlazadas, 0 rotadas) | PASS (81 reenlazadas, 0 rotadas) |

## 5. Cambio de vocabulario y atribución

| Métrica | Valor |
|---|---:|
| New vocabulary tokens | **2** (`omeprazol`, `esomeprazol`) |
| Parser fixes | **0** |
| APPROVE / REJECT / REVIEW | 16 / 15 / 8 |
| — de los APPROVE, **nuevos** | 2 |
| — de los APPROVE, ya existentes (redescubiertos) | 14 |
| `fixedByVocabulary` | 30 |
| `fixedByParser` | 0 |
| `fixedByRegistryResolution` | 0 |
| `stillUnresolved` | **381** |
| Observaciones que perdieron identidad | **0** |
| Casos negativos obligatorios colados en APPROVE | **0** |
| Controles positivos | **11 / 11 PASS** |

## 6. Gate A con la definición exacta

```
Gate A = observaciones con identidad canónica asignada / observaciones totales
```

| | Valor |
|---|---|
| Antes | 428 / 839 = **51,0131 %** |
| Después | 458 / 839 = **54,5888 %** |
| Umbral | ≥ 99,5 % |
| **Resultado** | **FAIL** |

**Pipeline Coverage = 100,00 %** — se reporta como dato aparte y **no** sustituye
el numerador del gate. Es la lectura que el `s1-gates.json` comiteado usa
(`A_offerCoverage = 1`, definición "representadas en el registro con linaje
completo") y que la ratificación de CTO/Product del 2026-09-03 descartó
explícitamente como definición de Gate A.

## 7. El techo, que es lo que decide el veredicto

| | Observaciones | Gate A resultante |
|---|---:|---:|
| Estado anterior | 428 asignadas | 51,01 % |
| Estado actual | 458 asignadas | 54,59 % |
| **Techo de un arreglo perfecto del eje ingrediente** | **570** | **67,94 %** |
| Umbral requerido | 835 | 99,5 % |

Las 269 observaciones restantes no dependen del vocabulario: están bloqueadas por
concentración o forma farmacéutica (ver `RESIDUAL_CENSUS.md` §5 y §6). Ningún
vocabulario, por grande que sea, las alcanza.
