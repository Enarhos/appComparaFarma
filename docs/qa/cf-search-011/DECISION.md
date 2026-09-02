# CF-SEARCH-011 — Decisión de S0

**Corpus:** 16 consultas congeladas, 1.633 ofertas reales, 9/9 farmacias, capturado
2026-09-02T00:55Z.
**Base:** `origin/main` @ `2ab1065492eb20fe4c59ede7f1a150b0c513f759`.
**Evidencia:** `analysis/comparison.json`, `analysis/v1-baseline.json`,
`analysis/v2-metrics.json`, `analysis/key-cases.json`, `analysis/control-cases.csv`.

---

## Gates

```
Gate A — Offer Coverage:   1633/1633, 100.0000%, umbral >= 99.5%,  PASS
Gate B — SPLIT_LOST:       0,                    umbral = 0,       PASS
Gate C — False Merge:      0/533 pares,  0.0000%, umbral = 0,      PASS

FINAL: PASS_S0
```

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
| ¿Se puede construir identidad canónica v2 sobre ofertas reales? | Sí — 303 conceptos, 414 presentaciones, 755 productos, 987 ofertas |
| ¿Sin perder ninguna oferta? | Sí — cobertura 100,0000 % |
| ¿Sin introducir falsos merges? | Sí — 0, con detector más estricto que el de v1 |
| ¿Reduce la fragmentación? | Sí — 72,0 % → 36,0 % con el mismo denominador |
| ¿Sin colisiones de identificador? | Sí — 0 (v1 tiene 4 pares con hash de slug compartido) |
| ¿Los identificadores son deterministas e independientes? | Sí — verificado con tests de orden, farmacia, precio, stock y consulta |
| ¿Sin cambiar el comportamiento de v1? | Sí — 379 tests preexistentes verdes, ninguno modificado |

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
| `MERGE_FIXED` (v2 une lo que v1 fragmentaba) | 748 |
| `SPLIT_FIXED` (v2 separa lo que v1 fusionaba mal) | 52 |
| `MERGE_REGRESSION` (v2 separa de más) | **7** |
| `SPLIT_LOST` | **0** |

**114 pares corregidos por cada regresión.** Las 7 regresiones son 3 pares
distintos, todos la misma causa: v2 se niega a elegir entre dos potencias
candidatas cuando una farmacia omite la concentración (`S0_FAILURES.md` §4). Es
la dirección conservadora del proyecto, y es exactamente lo que el registro
persistido de S1 resuelve.

---

## Recomendación

**Continuar a S1** (shadow productivo con muestreo, `waitUntil`, apagado por
defecto), con dos condiciones que salen de la evidencia, no del entusiasmo:

1. **Ampliar `COMPOSITION_VOCABULARY` antes que refinar el motor.** Con 36,6 % de
   ofertas sin molécula demostrable, cualquier mejora del algoritmo tiene un techo
   duro. El script que derivó el vocabulario ya está en el repositorio.
2. **Implementar el registro persistido en S1, no después.** Las 212 ofertas
   `ambiguous` (13,0 %) y las 3 regresiones son el mismo problema: hoy la
   asignación se recalcula sin evidencia en cada búsqueda en vez de decidirse una
   vez y recuperarse.

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
