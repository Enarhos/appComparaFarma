# CF-SEARCH-011 — Decisión de S0

**Corpus:** 16 consultas congeladas, 1.633 ofertas reales, 9/9 farmacias, capturado
2026-09-02T00:55Z.
**Base:** `origin/main` @ `2ab1065492eb20fe4c59ede7f1a150b0c513f759`.
**Revisión:** reejecutado ENTERO tras la revisión CTO del PR #159 (2026-09-02).
Ninguna cifra de este documento se reutiliza de la entrega anterior: todas se
recalcularon desde el mismo corpus congelado con el motor corregido. Donde una
cifra cambió, se muestra OLD → NEW → POR QUÉ.
**Evidencia:** `analysis/comparison.json`, `analysis/v1-baseline.json`,
`analysis/v2-metrics.json`, `analysis/key-cases.json`, `analysis/control-cases.csv`.

---

## Gates

```
Gate A — Offer Coverage:   1633/1633, 100.0000%, umbral >= 99.5%,  PASS
Gate B — SPLIT_LOST:       0,                    umbral = 0,       PASS
Gate C — False Merge:      0/469 pares,  0.0000%, umbral = 0,      PASS

FINAL: PASS_S0
```

El denominador del Gate C bajó de 533 a 469 pares intra-producto porque el motor
distingue más productos (`comprimido` ≠ `cápsula`, `crema` ≠ `gel`), no porque se
haya relajado el detector. Al contrario: el detector de contradicción ahora
compara **cuatro ejes más** que en la entrega anterior —forma farmacéutica
canónica, vía de administración, unidad farmacéutica y discriminante de identidad
no resuelta— y sigue dando 0. Medir el gate con una regla más débil que la que
asigna identidad habría sido medir otra cosa.

Sin redondeo: la cobertura es 1633/1633 exactas, no 99,9x aproximado a 100.

`SPLIT_LOST` se midió en las **dos** definiciones vigentes y las dos dan 0:

- **§16 del ticket** — oferta válida que deja de estar representada o enlazada
  correctamente por el modelo v2: **0 de 1.633**.
- **`SHADOW_MODE_DESIGN.md` §4** — par de ofertas que v1 separaba, v2 fusiona, y
  que se contradicen: **0 de 94.869 pares comparados**.

`False Merge` se midió con **dos** detectores y los dos dan 0:

- **comparable con la línea base v1** (concentración con la semántica de
  `isCompatibleConcentration`, más marca, laboratorio, volumen, momento e ISP):
  **0**;
- **estricto** (además exige que una masa absoluta coincida con el numerador de la
  razón, regla R5): **0**.

Ambos detectores son un **superconjunto estricto** de los 6 ejes con los que
CF-SEARCH-010 midió "false merges = 0" en v1.

---

## Qué demostró S0

| Pregunta | Respuesta medida |
|---|---:|
| ¿Se puede construir identidad canónica v2 sobre ofertas reales? | Sí — 316 conceptos, 429 presentaciones, 767 productos, 987 ofertas |
| ¿Sin perder ninguna oferta? | Sí — cobertura 100,0000 % |
| ¿Sin introducir falsos merges? | Sí — 0, con detector más estricto que el de v1 y que el de la entrega anterior |
| ¿Reduce la fragmentación? | Sí — 72,5 % → 34,7 % con el mismo denominador |
| ¿Sin colisiones de identificador? | Sí — 0 (v1 tiene 4 pares con hash de slug compartido) |
| ¿Los identificadores son deterministas e independientes? | Sí — verificado con tests de orden, farmacia, precio, stock y consulta |
| ¿Respeta las 5 dimensiones del Concepto Farmacéutico del EDM-100? | Sí — las 5 son ejes de la firma (antes 3) |
| ¿Una cabecera no resuelta puede llegar a ser principio activo? | No — 0 conceptos afirman ingrediente y discriminante a la vez |
| ¿Se pueden confundir las claves de S0 con IDs CFM permanentes? | No — prefijo `PROV-`, 0 claves `CFM-` emitidas |
| ¿Sin cambiar el comportamiento de v1? | Sí — 379 tests preexistentes verdes, ninguno modificado |

### Cambios de cardinalidad respecto de la entrega anterior

| Métrica | OLD | NEW | Por qué |
|---|---:|---:|---|
| Conceptos | 303 | **316** | La firma respeta las 5 dimensiones del EDM. Se separaron 13 conceptos que mezclaban comprimido con cápsula y 3 que mezclaban crema con gel |
| Presentaciones | 414 | **429** | Consecuencia directa de lo anterior |
| Productos | 755 | **767** | Consecuencia directa de lo anterior |
| Fragmentación | 36,0 % | **34,7 %** | Baja aunque haya más conceptos: la unidad farmacéutica como eje resuelve por subsunción casos que antes quedaban ambiguos |
| Ofertas sin principio activo demostrable | 598 (36,6 %) | 598 (36,6 %) | Sin cambio — el vocabulario de moléculas no se tocó |
| `complete` / `subsumed` / `isolated` / `ambiguous` | 1185 / 131 / 105 / 212 | **510 / 142 / 741 / 240** | Con 6 ejes, muchas menos ofertas declaran TODO. No es una regresión: es dejar de llamar "completa" a una lectura que no lo era |

La fragmentación **no se optimizó**. Se corrigió el contrato semántico primero y
se volvió a medir después, como exige la revisión. Que además haya bajado es una
consecuencia, no un objetivo.

**El caso que motivó la iniciativa:** las 6 ofertas genéricas de losartán 50 mg
× 30 de **6 farmacias distintas**, que v1 reparte en tarjetas separadas, quedan en
**un solo producto comparable** — sin fusionar Cozaar, Corodin, Losapres, Lopren
ni Simperten-D, y sin fusionar los seis laboratorios estructurados distintos
(Hospifarma, Opko, Mintlab, Seven Pharma, Ascend, Eurofarma). De 44 tarjetas v1 a
16 productos v2 sobre las mismas 26 observaciones.

---

## Qué NO demostró S0

- **No demostró que v2 sea mejor para el usuario.** Midió identidad y
  agrupamiento, no relevancia, ranking ni satisfacción. Eso es S1/S2.
- **No demostró que v2 aguante producción.** 11,3 ms p95 es una medición offline
  sobre datos en memoria, sin retrieval, sin serialización y sin arranque en frío
  de una función serverless.
- **No resolvió la calidad del dato.** 36,6 % de las ofertas siguen sin principio
  activo demostrable, por el tamaño del vocabulario de moléculas
  (`S0_FAILURES.md` §5).
- **No cubrió la identidad regulatoria.** Registro ISP con cobertura 0 %, por
  diseño: CF-DATA-005 (#156) es independiente.

---

## Costo medido de la corrección

| Categoría | Pares |
|---|---:|
| `MERGE_FIXED` (v2 une lo que v1 fragmentaba) | 639 (antes 748) |
| `SPLIT_FIXED` (v2 separa lo que v1 fusionaba mal) | 58 (antes 52) |
| `MERGE_REGRESSION` (v2 separa de más) | **7** (sin cambio) |
| `SPLIT_LOST` | **0** (sin cambio) |

**100 pares corregidos por cada regresión** (antes 114). Las 7 regresiones son 3 pares
distintos, todos la misma causa: v2 se niega a elegir entre dos potencias
candidatas cuando una farmacia omite la concentración (`S0_FAILURES.md` §4). Es
la dirección conservadora del proyecto, y es exactamente lo que el registro
persistido de S1 resuelve.

---

## Los 4 puntos que `PASS_S0` exige además de los gates

| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 1 | Contrato semántico del EDM respetado | **DEMOSTRADO** | Las 5 dimensiones de EDM-100 son ejes de `conceptSignature()`. Conceptos que mezclan comprimido/cápsula: 13 → **0**. Crema/gel: 3 → **0**. Unidades farmacéuticas mezcladas: 13 → **0** |
| 2 | Identidad textual no resuelta NO se representa como principio activo | **DEMOSTRADO** | `ActiveIngredient.evidence` ya no admite `"unresolved-head"`. 0 de 316 conceptos afirman ingrediente y discriminante a la vez. `Tapsin Duo (B) Paracetamol / Ibuprofeno` pasó de `ing=ibuprofeno+paracetamol+tapsin` a `ing=ibuprofeno+paracetamol` |
| 3 | Claves provisionales separadas de los futuros IDs CFM persistentes | **DEMOSTRADO** | Prefijo `PROV-`, campos `provisional*Key`, 0 claves con prefijo `CFM-` emitidas por el motor |
| 4 | Comportamiento de resolución contextual entendido y acotado | **DEMOSTRADO** | 2 ofertas de 1.633 (0,1225 %), atribuidas una por una en `analysis/context-stability.json`; estabilidad de la firma cruda = **100,0000 %** (`S0_METRICS.md` §8) |

Los 4 son demostrables ⇒ el veredicto se mantiene en `PASS_S0`.

---

## Recomendación

**Continuar a S1** (shadow productivo con muestreo, `waitUntil`, apagado por
defecto), con dos condiciones que salen de la evidencia, no del entusiasmo:

1. **Ampliar `COMPOSITION_VOCABULARY` antes que refinar el motor.** Con 36,6 % de
   ofertas sin molécula demostrable, cualquier mejora del algoritmo tiene un techo
   duro. El script que derivó el vocabulario ya está en el repositorio.
2. **Implementar el registro persistido en S1, no después.** Las 240 ofertas
   `ambiguous` (14,7 %), las 3 regresiones y las 2 identidades dependientes del
   contexto son el mismo problema: hoy la asignación se recalcula contra el
   corpus visible en vez de resolverse contra un registro estable.
3. **El registro de S1 debe acuñar el `CFM-CONCEPT-ID` solo desde una firma
   COMPLETA.** Es la conclusión arquitectónica de la investigación de estabilidad
   contextual (`S0_METRICS.md` §8): la subsunción es válida para RESOLVER una
   observación parcial contra el registro, y no lo es para ACUÑAR identidad desde
   el corpus.

**S1 no debe empezar sin decisión explícita de CTO/Product.** Cada transición de
fase es una decisión de Mario/ChatGPT, no un automatismo
(`SHADOW_MODE_DESIGN.md` §6).

---

## Estado de v1

**Sin cambios.** v2 no está desplegado, no está expuesto, no está reexportado
desde el barrel de `@comparafarma/domain`, y ni `mobile/`, ni `web/`, ni `api/`
pueden importarlo. El payload de `/api/search` es idéntico. `matchKey`,
`presentationKey`, `mergeDuplicates`, `queryIntent`, el ranking y los slugs no
cambiaron de comportamiento.
