# CF-SEARCH-012 — Decisión de S1

## 0. Ratificación explícita de CTO/Product (2026-09-03)

Esta entrega dejó dos lecturas posibles del Gate A, con la misma prominencia,
pidiendo ratificación explícita (§3). **Mario (Product Owner) ratificó la
definición original de S0**: "Offer Coverage" significa que la oferta obtuvo
una identidad canónica asignada (`CFM-CONCEPT-ID`), no que quedó representada
en el registro con linaje completo.

Bajo esa definición ratificada:

```
Gate A — Offer Coverage (definición S0) ... 428/839  51,01 %   umbral >= 99,5 %  FAIL
```

**Veredicto final de S1: `STOP_AND_REASSESS`.**

Esto no invalida el trabajo de esta entrega — el registro persistente, la
separación canonicalización/resolución/asignación, los Gates B/C/D y los 7
tests de estabilidad quedan demostrados y son reutilizables tal cual. Lo que
cambia es que **S2 no puede iniciarse todavía**: la prioridad pasa a ser,
exclusivamente, ampliar `COMPOSITION_VOCABULARY` (§6, punto 1) hasta que la
tasa de asignación de concepto supere el umbral de 99,5% bajo esta misma
definición, y recién entonces reintentar el Gate A. El resto del análisis de
este documento (secciones 1-7) se conserva sin editar como evidencia técnica
de la corrida original — léase con el veredicto de esta sección como el que
gobierna, no "PASS_S1" de la sección 1.

---

**Corpus:** 16 consultas congeladas, 1.364 filas upstream, **839 observaciones
únicas**, 8 de 9 farmacias, capturado 2026-09-03 (UTC).
**Base:** `origin/main` @ `38ac1e8b7cd1ef557cd9f5df45993316c6153b97`.
**Motor:** registro persistente completo (`assignIdentity` contra el repositorio).
**Ninguna cifra de S0 se reutiliza:** todo se recalculó desde el corpus congelado.
**Evidencia:** `analysis/s1-metrics.json`, `s1-gates.json`, `s1-stability.json`,
`s1-failures.json`.

---

## 1. Gates

```
Gate A — Offer Coverage ............ 839/839  100,0000 %   umbral >= 99,5 %  PASS
Gate B — SPLIT_LOST ................ 0                     umbral = 0        PASS
Gate C — False Merge Rate .......... 0/202 pares  0,0000 % umbral = 0        PASS
Gate D — Concept Semantic Collision  0/2.024 pares 0,0000 %umbral = 0        PASS
Persistent ID Instability .......... 0 rotaciones          umbral = 0        PASS

Estabilidad persistente ............ 7 de 7                                  PASS

FINAL: PASS_S1
```

Los cuatro detectores son un superconjunto estricto del de S0: comparan ocho ejes
—ingredientes, cardinalidad de la asociación, concentración, forma, vía, unidad,
componente negado y discriminante no resuelto— y los tres gates que hablan de
contradicción usan **el mismo** detector. Medir el falso merge con una regla más
débil que la que asigna identidad habría sido medir otra cosa.

---

## 2. Qué demostró S1

| Pregunta | Respuesta medida |
|---|---|
| ¿Se puede persistir identidad canónica con IDs que no roten? | Sí — 76 conceptos, 87 presentaciones, 271 productos, 227 pares, 839 observaciones; **0 rotaciones** |
| ¿La identidad es independiente de consulta, farmacia, orden y corpus? | Sí — los cuatro tests PASS sobre el corpus real |
| ¿Una observación parcial puede acuñar identidad? | No — 76 conceptos auditados, **0 acuñaciones ilegales** |
| ¿Dos procesos simultáneos pueden acuñar dos IDs? | No — 30 observaciones de la misma firma en paralelo → 1 identidad |
| ¿Un cambio de reglas del canonicalizador rota los IDs? | No — 76 identidades reasociadas a firma nueva, 0 rotaciones |
| ¿Se puede responder "por qué esta oferta cayó en este concepto"? | Sí — 7.551 filas de linaje con firmas, versiones, evidencia y motivo |
| ¿Sin colisiones semánticas de concepto? | Sí — 0 sobre 2.024 pares, con un detector de 8 clases |
| ¿Sin cambiar el comportamiento de v1? | Sí — 599 tests de dominio, 420 de API, 312 de web y 51 de mobile verdes; ninguno de v1 modificado |
| ¿Reversible? | Sí — 4 niveles de rollback, el primero inmediato y sin pérdida |

**El defecto que S1 encontró y corrigió dentro de S1:** la primera implementación
subsumía una amoxicilina + clavulánico de 875/125 mg dentro del concepto de
500/125 mg — **198 pares**, Gate C 0,4371 y Gate D 0,4907. Lo detectó el Gate D,
no un test unitario. Es el argumento para haberlo construido
(`S1_FAILURES.md` §1).

---

## 3. La condición que acompaña al `PASS_S1`

**Solo el 51,01 % de las observaciones (428 de 839) llega a tener un
`CFM-CONCEPT-ID`.** No es un defecto: es la consecuencia directa de la regla de
acuñación que el propio S0 recomendó y que este ticket ordenó implementar.

Atribución:

| Causa | Observaciones | % del corpus |
|---|---:|---:|
| **Sin principio activo demostrable** (vocabulario) | **260** | **31,0 %** |
| Concentración `mass-only` en forma no sólida | 98 | 11,7 % |
| Sin concentración declarada | 90 | 10,7 % |
| Sin forma farmacéutica declarada | 33 | 3,9 % |

El caso más elocuente: **`omeprazol` no está en `COMPOSITION_VOCABULARY`**, y es
una de las 16 consultas congeladas. Todas sus ofertas quedan sin identidad. El
motor hace lo correcto —no afirma una molécula que no puede demostrar— y por eso
mismo no puede acuñar.

### Dos advertencias explícitas para la revisión

**1. Gate A cambió de definición, y eso es una decisión de nivel CTO/Product.**
En S0 "coverage" era "ofertas a las que v2 asigna una entidad canónica" (100 %,
porque S0 siempre creaba un concepto). En S1 eso está prohibido. La definición
usada acá —"observaciones representadas en el registro con linaje completo"—
protege lo que el gate protegía (que v2 no PIERDA ofertas) y da 100 %. **Bajo la
lectura de S0, el número equivalente es 51,01 %.** Los dos están reportados con
la misma prominencia en `GATES.md`. **Se pide ratificación explícita de esta
redefinición.**

**2. `PASS_S1` no significa "listo para S2".** Significa que el registro
persistente funciona, es estable, es seguro y es reversible.

---

## 4. Qué NO demostró S1

- **No demostró que v2 sea mejor para el usuario.** Midió identidad, estabilidad
  y seguridad — no relevancia, ranking ni satisfacción.
- **No demostró que v2 aguante producción.** 7,19 ms p50 y 13,91 ms p95 son
  mediciones **en memoria**, sin Postgres, sin red, sin arranque en frío. El
  shadow **nunca se encendió**.
- **No resolvió la calidad del dato.** 31 % de las ofertas sin molécula
  demostrable.
- **No cubrió la identidad regulatoria.** ISP con cobertura 0 %: #156 es
  independiente y #157 sigue abierto. El contrato está listo de punta a punta.
- **No comparó cifra por cifra contra S0.** Corpus distinto (8 farmacias en vez
  de 9, 839 observaciones en vez de 987) y motor distinto. Forzar la comparación
  habría sido inventar precisión.

---

## 5. Costo aceptado

S1 es deliberadamente **más conservador que S0** en concentración: dos
concentraciones declaradas y distintas son incompatibles aunque una sea masa y la
otra razón, porque la regla mixta de S0 no sobrevive a la normalización de la
firma y haría depender la identidad de cómo estaba escrita la oferta que acuñó el
concepto (`IDENTITY_ASSIGNMENT.md` §3).

Cuesta **98 observaciones (11,7 %)** que S0 sí agrupaba, incluido el caso
emblemático "Ambroxol 30 mg" → "Ambroxol 30 mg/5 mL". Es una regresión en
agrupamiento y una mejora en corrección, en la dirección conservadora del
proyecto: produce splits, nunca merges. Se declara como costo, no como logro.

Fragmentación 58,3 % y unidades de una sola farmacia 71,9 %. **La fragmentación
no se optimizó**, igual que en S0: primero se corrige el contrato de identidad y
después se mide.

---

## 6. Recomendación

**Continuar a S2, con dos condiciones de bloqueo que salen de la evidencia:**

1. **Ampliar `COMPOSITION_VOCABULARY` ANTES de S2.** Con 31 % de las ofertas sin
   molécula demostrable —incluido `omeprazol`, una de las 16 consultas del
   corpus— cualquier trabajo sobre el motor tiene un techo duro. Es la misma
   recomendación 1 de S0, todavía sin ejecutar, y ahora está cuantificada: es
   responsable del **63 %** de las observaciones sin identidad. El script que
   derivó el vocabulario ya está en el repositorio (`docs/qa/cf-data-001/`).

2. **Fijar un umbral de tasa de asignación de concepto antes de encender el
   shadow al 100 %.** Con 51 % no tiene sentido evaluar relevancia sobre v2: la
   mitad del catálogo no tiene identidad que rankear.

**Y una decisión pendiente de CTO/Product:** ratificar la redefinición del Gate A
(§3). Si la dirección considera que el gate debe leerse como en S0, el resultado
de S1 es `STOP_AND_REASSESS` con 51,01 % contra un umbral de 99,5 %, y la
prioridad pasa a ser exclusivamente el vocabulario de moléculas. **Ninguna de las
dos lecturas cambia el trabajo recomendado a continuación; cambia el nombre del
veredicto.**

**S2 no debe empezar sin decisión explícita de CTO/Product.** Cada transición de
fase es una decisión de Mario/ChatGPT, no un automatismo
(`SHADOW_MODE_DESIGN.md` §6).

---

## 7. Estado de v1

**Sin cambios.** v2 no está desplegado, no está expuesto y no está reexportado
desde el barrel raíz de `@comparafarma/domain`; `web/` y `mobile/` no pueden
importarlo y `api/` solo lo usa en el camino de shadow, que está apagado. El
payload de `/api/search` es idéntico. `matchKey`, `presentationKey`,
`mergeDuplicates`, `queryIntent`, el ranking y los slugs no cambiaron de
comportamiento.

La migración de `docs/technology/database/schema.sql` **no se ejecutó**. El
estado es `CODE_READY`, no `CONFIG_READY` ni `DEPLOYED` (CLAUDE.md §6).
