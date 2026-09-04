# CF-SEARCH-012 S1 — Métricas

**Evidencia:** `analysis/s1-metrics.json`, `analysis/s1-gates.json`,
`analysis/s1-stability.json`, `analysis/s1-failures.json`.
**Reproducible con:** `node docs/qa/cf-search-012/scripts/s1-eval.mjs`.

**Ninguna cifra de S0 se reutiliza.** Todo se recalculó desde el corpus congelado
con la implementación persistente.

---

## 1. Corpus

| Métrica | S0 (2026-09-02) | S1 (2026-09-03) |
|---|---:|---:|
| Consultas | 16 | 16 |
| Filas upstream | 1.633 | **1.364** |
| Observaciones únicas | 987 | **839** |
| Tarjetas v1 | 1.447 | 1.220 |
| Farmacias presentes | **9** | **8** |

**El corpus NO es el mismo, y no se fuerza ninguna comparación cifra por cifra.**
Dos causas, y la segunda es un hallazgo:

1. deriva normal de catálogo entre dos días;
2. **AraucoMed devolvió 0 ofertas en las 16 consultas.** Verificado aparte contra
   producción con tres consultas comunes (`ibuprofeno`, `paracetamol`,
   `losartan`): responden 8 de 9 farmacias, sin AraucoMed. No es un fallo del
   corpus ni de S1 — es el estado de producción el 2026-09-03. Reportado como
   `FOLLOW_UP` (`S1_FAILURES.md` §6).

Comparar cardinalidades de S0 y S1 tendría poco valor con corpus distintos y
motores distintos. Lo que sí es comparable es el **comportamiento**: gates,
estabilidad y clases de fallo.

---

## 2. Registro construido

| Entidad | Filas |
|---|---:|
| Conceptos Farmacéuticos | **76** |
| Presentaciones Farmacéuticas | **87** |
| Productos Medicinales Comerciales | **271** |
| Pares producto × presentación | **227** |
| **Unidades comparables** (par con observaciones) | **210** |
| Observaciones de oferta | **839** |
| Filas de linaje | **7.551** |
| Alias de firma | **434** |
| **Total de filas** | **9.485** |

**Por qué hay más productos (271) que conceptos (76).** Es lo esperado: un
concepto —"paracetamol 500 mg comprimido oral"— tiene un producto comercial por
cada combinación de marca × variante × laboratorio. Es exactamente la
comparación que v2 viene a habilitar.

**Por qué hay menos presentaciones (87) que productos (271).** Porque producto y
presentación son N:M: la caja de 20 comprimidos hospeda a todos los laboratorios
que la venden. Con el modelo lineal de S0 —producto anclado a presentación— este
corpus habría contado un producto por cada par, es decir 227.

---

## 3. Cobertura

| Métrica | Valor |
|---|---:|
| **Gate A — observaciones representadas** | 839 / 839 — **100,0000 %** |
| Observaciones con `CFM-CONCEPT-ID` | 428 / 839 — **51,01 %** |
| Observaciones con unidad comparable | 317 / 839 — **37,78 %** |
| Observaciones sin concepto | **411** |

La brecha entre 100 % y 51 % es el hallazgo principal de S1 y está atribuida
observación por observación en `S1_FAILURES.md` §2 y §3. Resumen de causas sobre
las 411 sin concepto:

| Causa | Observaciones | % de las 839 |
|---|---:|---:|
| Sin principio activo demostrable (vocabulario) | **260** | 31,0 % |
| Concentración `mass-only` en forma no sólida | **98** | 11,7 % |
| Sin concentración declarada | **90** | 10,7 % |
| Sin forma farmacéutica declarada | 33 | 3,9 % |

(Las causas se solapan: una observación puede tener varias.)

---

## 4. Resolución

### Primera pasada (registro creciendo desde cero)

| Desenlace | Concepto |
|---|---:|
| `exact` | 314 |
| `created` | **76** |
| `subsumed` | 65 |
| `ambiguous` | 29 |
| `unresolved` | 355 |

### Convergido (régimen)

| Desenlace | Concepto | Los tres niveles |
|---|---:|---:|
| `exact` | 390 | 1.127 |
| `created` | 0 | 0 |
| `subsumed` | 38 | 46 |
| `ambiguous` | 75 | 76 |
| `unresolved` | 336 | 1.268 |

En régimen no se acuña nada: el registro ya conoce las identidades del corpus y
toda resolución es reutilización. Es la propiedad que se busca — el crecimiento
del registro se detiene cuando el catálogo deja de traer identidades nuevas.

---

## 5. Estabilidad de identidad persistente

| Métrica | Valor | Umbral |
|---|---:|---|
| **Rotaciones de ID** (A → B) | **0** | 0 |
| `persistentIdInstability` | **0** | 0 |
| Pasadas hasta converger | 2 | — |
| Resoluciones tardías (`null` → ID) | 14 | informativo |
| Des-resoluciones (ID → `null`) | 41 | informativo |

**Las 41 des-resoluciones merecen explicación.** Una observación parcial que en
la primera pasada tenía exactamente una anfitriona pasa a tener dos cuando el
registro crece, y el resolutor deja de elegir (`ambiguous`). Es la dirección
conservadora funcionando: el sistema se vuelve MÁS cuidadoso al aprender, no
menos. Ninguna es una rotación y ninguna cambia el significado de un ID emitido.
Converge en 2 pasadas.

Los siete tests de estabilidad: **7/7 PASS**. Detalle en `GATES.md`.

---

## 6. Agrupamiento

| Métrica | Valor |
|---|---:|
| Fragmentación (presentaciones repartidas en >1 unidad) | **58,3 %** (49/84) |
| Unidades de una sola farmacia | **71,9 %** (151/210) |
| Falsos splits (misma firma de concepto, IDs distintos) | **0** |

**La fragmentación no se optimizó**, igual que en S0. S1 corrige el contrato de
identidad primero y mide después. Y S1 es deliberadamente MÁS conservador que S0
en concentración, así que era esperable que no bajara.

Las cifras no son comparables con las de S0 (72,9 % → 35,4 %) porque el
denominador cambió: allí se contaba sobre la clave de producto de S0, acá sobre
presentaciones con unidades comparables, y sobre un corpus distinto con 8
farmacias en vez de 9.

**Falsos splits = 0** sí es directamente significativo: no hay dos observaciones
con la misma firma de concepto que terminen en identidades distintas. Es la
contraparte de la independencia de farmacia y de orden.

---

## 7. Latencia

### Por observación (asignación de identidad)

| Percentil | Valor |
|---|---:|
| p50 | 0,059 ms |
| p95 | 0,155 ms |
| p99 | 0,271 ms |

### Por corrida de shadow (una consulta completa)

| Métrica | Valor |
|---|---:|
| Corridas | 16 |
| Observaciones procesadas | 1.364 |
| Success rate | **100,00 %** |
| Error rate | **0,0000 %** |
| p50 | 7,19 ms |
| p95 | 13,91 ms |
| p99 | 13,91 ms |

**Qué NO demuestra esto.** Es una medición **en memoria**: sin round-trips a
Postgres, sin arranque en frío de una función serverless, sin contención y sin
red. La latencia real contra Supabase será mayor en órdenes de magnitud.

Lo que sí está garantizado por construcción, y no por rapidez: el shadow corre
**después** de responder al usuario, así que su efecto sobre la latencia
percibida es cero. El techo lo pone el timeout de 8 s.

---

## 8. Escritura en base de datos

| Concepto | Valor |
|---|---:|
| Filas totales del corpus congelado | 9.485 |
| Filas por observación (promedio) | ~11,3 |
| De las cuales, linaje | 7.551 (79,6 %) |
| Techo por corrida de shadow | 60 observaciones × 5 filas = **300** |

`canonical_resolutions` domina y es la única append-only. Crece con las búsquedas
muestreadas, no con el catálogo. Recomendación de retención en `SCHEMA.md` §4.

---

## 9. Diferencia entre las dos implementaciones del repositorio

| | `InMemoryCanonicalRegistry` | `SupabaseCanonicalRegistry` |
|---|---|---|
| Candidatos de concepto | escanea el registro (semántica **exacta**) | prefiltro por `bucket_keys` (GIN) |
| Sin clave selectiva | escanea | devuelve `[]` ⇒ `unresolved` |
| Candidatos de presentación/producto | filtra por concepto (exacto) | filtra por `concept_id` (exacto) |
| Sección crítica de acuñación | bloque síncrono | `on conflict do nothing` + relectura |

**Los gates se midieron con la semántica exacta.** La diferencia solo aplica a
firmas que no declaran ni molécula ni discriminante, y su efecto es
`unresolved` de más — nunca un merge de más, nunca una identidad acuñada de más.
Sobre este corpus, todas las firmas sin molécula tienen discriminante, así que la
diferencia no se materializa en ninguna observación.
