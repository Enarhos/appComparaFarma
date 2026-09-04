# CF-DATA-007 — Candidatos y veredictos

Script: `scripts/candidates.mjs` (generación) + `scripts/ranking.mjs` (veredicto).
Artefactos: `analysis/candidates.json`, `candidate-ranking.csv`,
`analysis/verdicts.json`.

## 1. Las cuatro fuentes de evidencia admitidas

Ningún token entra al vocabulario por frecuencia sola, ni por estar cerca de una
cifra. Hace falta que **al menos una** de estas fuentes lo sostenga, y en
`candidate-ranking.csv` queda registrado cuál.

| # | Fuente | Qué exige |
|---|---|---|
| **1** | **Regla de derivación de CF-DATA-001** aplicada al corpus congelado | El token acompaña a ≥ 2 **cabeceras de marca distintas** en ≥ 2 farmacias distintas, antecede a una dosis en el segmento descriptivo, y no aparece en el campo estructurado de fabricante |
| **2** | **Separador explícito** | `combinationKey()` (v1, sin modificar) devuelve el token como segundo principio activo en algún nombre del corpus. Es el criterio (E1) de `V2_MOLECULE_VOCABULARY` |
| **3** | **Vocabulario farmacológico ya validado en el proyecto** | El token ya está declarado principio activo por `KNOWN_ACTIVE_INGREDIENTS` (`commercialIdentity.ts`, auditoría de producción FASE P1 del 2026-08-19) o `COMPOSITION_TOKENS` (`productIdentity.ts`, 9 búsquedas de producción del 2026-08-27). Los dos sostienen comportamiento de v1 hoy |
| **4** | **Registro sanitario ISP** | **NO SE USA.** ADR-0005 la declara *en revisión*, el issue #157 sigue abierto y ningún adaptador la captura. Se enumera para que su ausencia sea una decisión explícita |

## 2. Por qué `omeprazol` no se reconocía, y qué lo aprueba

Es el control positivo que el ticket pide explicar, y el caso que obligó a
recurrir a la fuente (3).

### Por qué falla cada mecanismo existente

1. **No está en `COMPOSITION_VOCABULARY`.** Esas 34 moléculas las derivó
   CF-DATA-001 por frecuencia sobre 3.697 ofertas, con la regla de la fuente (1).
2. **La fuente (1) no puede descubrirlo — y no es un umbral mal calibrado, es un
   punto ciego estructural.** La regla exige que el token acompañe a **≥ 2
   cabeceras de marca distintas**. `omeprazol` se vende mayoritariamente como
   **genérico con su propio nombre**: "Omeprazol 20 mg x 30 Cápsulas". Ahí la
   molécula **es** la cabecera, así que por construcción no acompaña a ninguna.
   Medido sobre el corpus: la regla le cuenta **1 sola cabecera** (`lomex`, la
   única marca que lo escribe detrás) pese a que el token aparece en **24
   observaciones de 7 de las 9 farmacias**.
3. **La fuente (2) tampoco.** `combinationKey()` necesita un separador entre
   moléculas; `omeprazol` es un monofármaco y nunca se escribe así.
4. **La promoción por posición estructural tampoco.** Exige ≥ 2 tokens con dosis
   propia y ≥ 1 corroborado por vocabulario; un monofármaco tiene exactamente uno.
5. **La aridad tipográfica tampoco.** Solo cuenta componentes, nunca los nombra.

Resultado: las cuatro vías del lector son estructuralmente incapaces de alcanzar
un genérico cuyo nombre *es* la molécula.

### Qué sí lo aprueba

La **fuente (3)**. `omeprazol` ya está declarado principio activo en dos lugares
del propio repositorio, ambos derivados de auditorías de producción y ambos
sosteniendo comportamiento de v1 **hoy**:

- `KNOWN_ACTIVE_INGREDIENTS` (`packages/domain/src/commercialIdentity.ts`) — es la
  guardia que impide publicar un principio activo como si fuera una marca.
- `COMPOSITION_TOKENS` (`packages/domain/src/productIdentity.ts`) — superset de la
  anterior, derivado de 9 búsquedas de producción.

No es una lista importada ni una farmacopea genérica: es evidencia interna,
medida sobre el catálogo real, ya en producción. Y queda **corroborada de forma
independiente** por el corpus congelado: 24 observaciones en 7 farmacias.

`esomeprazol` entra por la misma fuente (11 observaciones, 4 farmacias) y se
mantiene como **molécula distinta** — es el enantiómero S, y el caso QA-02 de
`relevance.ts` documenta el riesgo de confundirlos. Acá no puede ocurrir: el
escaneo tokeniza por palabra completa (`[a-z]+`), así que `esomeprazol` nunca
coincide con `omeprazol` por substring.

## 3. Veredictos

**APPROVE 16 · REJECT 15 · REVIEW 8** (39 candidatos dictaminados).

De los 16 APPROVE, **14 ya estaban en el vocabulario**: la regla los redescubre,
lo que sirve de control de que el método no cambió de criterio. Los **tokens
nuevos son 2**: `omeprazol` y `esomeprazol`.

### APPROVE

| Token | Fuentes | Obs. | Farm. | ¿Nuevo? |
|---|---|---:|---:|:--|
| paracetamol | 1 + 2 + 3 | 126 | 8 | ya estaba |
| amoxicilina | 1 + 2 + 3 | 110 | 8 | ya estaba |
| diclofenaco | 1 + 2 + 3 | 101 | 8 | ya estaba |
| ibuprofeno | 1 + 2 + 3 | 92 | 8 | ya estaba |
| losartan | 1 + 2 + 3 | 51 | 8 | ya estaba |
| cetirizina | 1 + 2 + 3 | 48 | 8 | ya estaba |
| clavulanico | 1 + 2 + 3 | 35 | 6 | ya estaba |
| ambroxol | 1 + 2 | 30 | 8 | ya estaba |
| **omeprazol** | **3** (+ corpus: 7 farmacias) | **24** | **7** | **NUEVO** |
| levocetirizina | 1 + 2 | 20 | 3 | ya estaba |
| hidroclorotiazida | 1 + 2 + 3 | 16 | 7 | ya estaba |
| **esomeprazol** | **3** (+ corpus: 4 farmacias) | **11** | **4** | **NUEVO** |
| pseudoefedrina | 2 + 3 | 9 | 4 | ya estaba |
| cafeina | 2 + 3 | 8 | 5 | ya estaba |
| colestiramina | 1 + 2 | 4 | 2 | ya estaba |
| naproxeno | 2 + 3 | 1 | 1 | ya estaba |

### REJECT (15) — ver `REJECTED_TOKENS.md`

`actron`, `diclorhidrato`, `gesidol`, `ninos`, `advance`, `resinato`, `retard`,
`clauvulancio`, `efervecente`, `ellipta`, `epolamina`, `oftalmologica`, `potsico`,
`pseudofedrina`, `triterapia`.

`retard` merece atención: **pasa la regla de la fuente (1)** (2 cabeceras, 2
farmacias) y aun así se rechaza, porque es un descriptor de liberación
prolongada, no una molécula. Es la demostración de que la fuente (1) es condición
**necesaria pero nunca suficiente**, tal como dice el encabezado de
`candidates.mjs`.

### REVIEW (8) — sin evidencia admitida

`bromhexina`, `colecalciferol`, `dutasteride`, `flurbiprofeno`, `fosfomicina`,
`pamabrom`, `tamsulosina`, `tibolona`.

Las ocho son plausiblemente moléculas reales, pero **ninguna fuente admitida las
sostiene**: una observación, una farmacia, ningún vocabulario del proyecto. No se
implementan. `UNKNOWN` es mejor que una molécula inventada, y aprobarlas por
"parecen INN" sería exactamente el criterio de autor que el proyecto prohíbe.
Alimentan `MORE_DATA_REQUIRED`.

## 4. Control de fugas (Paso 4)

Casos negativos obligatorios comprobados contra el conjunto APPROVE:
`tapsin`, `zomel`, `sodico`, `potasico`, `diclorhidrato`, `clorhidrato`, `acido`,
`miel`, `limon`, `sabor`, `triterapia`, `comprimido`, `capsula`, `jarabe`,
`crema`, `gel`, `sobre`, `frasco`, `actron`, `panadol`, `lomex`.

**Fugas: 0.**

## 5. Controles positivos (Paso 5)

| Molécula | En vocabulario | Observaciones | Leída como principio activo | |
|---|:--:|---:|---:|:--|
| omeprazol | Sí | 24 | 24 | PASS |
| tramadol | Sí | 14 | 14 | PASS |
| paracetamol | Sí | 126 | 126 | PASS |
| ibuprofeno | Sí | 92 | 92 | PASS |
| diclofenaco | Sí | 101 | 101 | PASS |
| losartan | Sí | 51 | 51 | PASS |
| hidroclorotiazida | Sí | 16 | 16 | PASS |
| amoxicilina | Sí | 110 | 110 | PASS |
| clavulanico | Sí | 35 | 35 | PASS |
| ambroxol | Sí | 30 | 30 | PASS |
| cetirizina | Sí | 48 | 48 | PASS |

**11 de 11 PASS.** Cada molécula presente en el corpus se lee como principio
activo en el 100 % de las observaciones donde aparece.
