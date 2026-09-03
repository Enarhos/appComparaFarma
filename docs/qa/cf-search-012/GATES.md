# CF-SEARCH-012 S1 — Gates

**Corpus:** 16 consultas congeladas, 1.364 filas upstream, **839 observaciones
únicas**, 8 de 9 farmacias, capturado 2026-09-03 (UTC).
**Motor:** registro persistente (`assignIdentity` contra
`InMemoryCanonicalRegistry`). **Ninguna cifra de S0 se reutiliza.**

```
Gate A — Offer Coverage ............ 839/839  100,0000 %   umbral ≥ 99,5 %   PASS
Gate B — SPLIT_LOST ................ 0                     umbral = 0        PASS
Gate C — False Merge Rate .......... 0/202 pares  0,0000 % umbral = 0        PASS
Gate D — Concept Semantic Collision  0/2.024 pares 0,0000 %umbral = 0        PASS
Persistent ID Instability .......... 0 rotaciones          umbral = 0        PASS
```

---

## Gate A — Offer Coverage

**Definición usada:** observaciones representadas en el registro con linaje
completo / observaciones de entrada. **839/839 = 100,0000 %.**

### Esta definición cambió respecto de S0, y hay que decirlo

En S0, "coverage" era "ofertas a las que v2 asigna una entidad canónica", y daba
100 % porque S0 **siempre** creaba un concepto: una observación sin principio
activo demostrable obtenía uno propio con `identityStatus:
"unresolved-ingredient"`.

S1 tiene prohibido hacer eso. La recomendación 3 de `DECISION.md` de S0 —
ratificada al abrir este ticket — dice que un `CFM-CONCEPT-ID` solo se acuña
desde una firma suficientemente COMPLETA, y que una observación parcial *"resuelve
contra una identidad existente, o queda `unresolved`, o queda `ambiguous` — nunca
acuña un concepto permanente por subsunción contextual"*. Las dos definiciones son
estructuralmente incompatibles.

**Lo que el gate protege** (`SHADOW_MODE_DESIGN.md` §3) es que v2 no PIERDA
ofertas. Bajo esa lectura, la cobertura es 100 %: cada observación de entrada
produce exactamente una fila en `canonical_offer_observations`, con sus tres
filas de linaje, sus dos firmas, sus versiones y su motivo. Ninguna se descarta.

**Bajo la lectura de S0**, el número equivalente es la **tasa de asignación de
concepto: 51,01 %** (428 de 839). Se reporta aparte, en la misma prominencia, y
es condición de bloqueo para S2 (`DECISION.md` §3).

> **Esta redefinición de un gate bloqueante requiere ratificación de
> CTO/Product.** Se declara acá, no se asume resuelta.

| Métrica | Valor |
|---|---:|
| Observaciones representadas | 839 / 839 — **100,0000 %** |
| Con `CFM-CONCEPT-ID` | 428 / 839 — **51,01 %** |
| Con unidad comparable `(producto, presentación)` | 317 / 839 — **37,78 %** |

---

## Gate B — SPLIT_LOST

**Definición:** pares de observaciones que v1 separa (tarjetas distintas dentro
de la misma consulta), que v2 fusiona en la MISMA unidad comparable, y que **se
contradicen** en algún eje semántico. **0.**

Es un subconjunto estricto de Gate C: todo `SPLIT_LOST` es un falso merge que
además v1 había evitado. Se mide aparte porque el gate lo exige aparte.

`SPLIT_LOST` es la única clase con tolerancia cero absoluta: el proyecto entero
eligió falsos splits sobre falsos merges por riesgo clínico
(`PRODUCT_IDENTITY.md` §10), y v2 no puede revertir esa política.

---

## Gate C — False Merge Rate

**Definición:** pares de observaciones dentro de la MISMA unidad comparable
`(producto, presentación)` que se contradicen. **0 de 202 pares intra-unidad.**

**El detector es el mismo del Gate D**, y eso es deliberado: medir el falso merge
con una regla más débil que la que asigna identidad sería medir otra cosa
(lección de S0). Cubre las ocho clases.

Marca, laboratorio, variante, momento, cantidad y volumen no hace falta
compararlos dentro de una unidad: son ejes SIEMPRE declarados de las firmas de
presentación y producto, así que dos observaciones de la misma unidad coinciden
en ellos **por construcción**.

### El gate no estuvo en verde desde el principio

La primera implementación dio **Gate C = 0,4371** (198 pares) y **Gate D =
0,4907**. Todos de la misma causa: la firma candidata se reconstruía sin su
evidencia de concentración, así que el comparador la leía como "no declara" en vez
de "declara otra", y una amoxicilina + clavulánico de **875/125 mg** quedaba
subsumida dentro del concepto de **500/125 mg**. Se corrigió cambiando la
resolución para que compare sobre el TEXTO de la firma —lo único que el registro
persiste— con la regla conservadora de que dos concentraciones declaradas y
distintas son incompatibles. Detalle completo en `IDENTITY_ASSIGNMENT.md` §3.

---

## Gate D — Concept Semantic Collision Rate *(nuevo en S1)*

**Definición:** pares de observaciones asignadas al MISMO `CFM-CONCEPT-ID` que se
contradicen en alguna de ocho clases. **0 de 2.024 pares. Umbral 0.**

### Por qué hacía falta

En S0 los tres gates estaban en verde **mientras** la asociación
diclofenaco + tramadol de Adorlan compartía Concepto Farmacéutico con el
monofármaco de diclofenaco de Lertus, con resolución `complete` y confianza
`high` (`S0_FAILURES.md` §10). El Gate C mide contradicciones dentro de un
PRODUCTO; ese defecto vivía un nivel más arriba y ningún gate lo veía.

### Las ocho clases

| # | `collisionType` | Qué detecta |
|---|---|---|
| 1 | `MONOTHERAPY_VS_ASSOCIATION` | un monofármaco y una asociación en el mismo concepto |
| 2 | `INCOMPATIBLE_INGREDIENTS` | dos conjuntos de principios activos completos y distintos |
| 3 | `INCOMPATIBLE_CONCENTRATION` | dos concentraciones declaradas y contradictorias |
| 4 | `INCOMPATIBLE_DOSAGE_FORM` | comprimido vs cápsula, crema vs gel |
| 5 | `INCOMPATIBLE_ROUTE` | óvulo (vaginal) vs supositorio (rectal) |
| 6 | `INCOMPATIBLE_PHARMACEUTICAL_UNIT` | sobre vs comprimido |
| 7 | `NEGATED_COMPONENT_PRESENT` | un nombre declara "SIN cafeína" y el otro la afirma |
| 8 | `UNRESOLVED_DISCRIMINATOR_AS_INGREDIENT` | una cabecera textual no resuelta tratada como identidad farmacológica |

### Qué reporta cada colisión

Nunca un booleano:

```json
{
  "collisionType": "MONOTHERAPY_VS_ASSOCIATION",
  "conceptId": "CFM-CONCEPT-000008",
  "signature": "ing=diclofenaco|disc=none|conc=conc:mass:25mg|form=comprimido|route=oral|unit=comprimido",
  "left":  { "observationId": "...", "pharmacy": "dr-simi",   "rawName": "Adorlan 25/25 …", "evidence": "componentes declarados=2 (ing=diclofenaco+tramadol declared=2 disc=none)" },
  "right": { "observationId": "...", "pharmacy": "cruz-verde","rawName": "Lertus …",        "evidence": "componentes declarados=1 (ing=diclofenaco declared=1 disc=none)" },
  "reason": "una asociación y un monofármaco no pueden ser el mismo Concepto Farmacéutico"
}
```

### Qué NO hace el detector

**No compara evidencia AUSENTE contra evidencia PRESENTE.** Que una farmacia
declare la forma y otra no, no es una contradicción: es una lectura incompleta, y
tratarla como colisión convertiría el gate en un medidor de fragmentación. Solo se
cuenta contradicción cuando AMBOS lados declaran y lo declarado es incompatible.

La clase 7 fue la razón para PUBLICAR `negatedComponents`: sin ella el detector no
puede distinguir "el nombre no menciona cafeína" de "el nombre dice que no lleva
cafeína". El campo es aditivo y **no participa de ninguna firma**.

---

## Persistent ID Instability

**Definición:** observaciones cuyo `CFM-CONCEPT-ID` cambió de un identificador A
a otro identificador B, sobre el total. **0 rotaciones / 839 = 0.**

**No se cuenta como inestabilidad** que una observación pase de "sin identidad" a
"con identidad" (el registro aprendió: **14 casos**) ni al revés (el registro
descubrió una ambigüedad y dejó de elegir: **41 casos**). Son re-asignaciones de
la OBSERVACIÓN, quedan en el linaje, y ninguna cambia el significado de un
identificador ya emitido. Se reportan en `S1_METRICS.md` §5 sin disimulo.

### Convergencia

Las cifras se miden sobre el registro **convergido** (2 pasadas). Un registro
persistente no se construye de una vez: crece, y el sistema real revisita cada
observación en cada búsqueda que la vuelve a traer. La primera pasada sobre un
registro vacío no es el estado del sistema, es su primer minuto de vida; medir
los gates ahí mediría el orden del corpus, no el modelo.

Lo que la convergencia **no puede tapar** es la rotación, que se cuenta en cada
pasada y da 0.

---

## Los siete tests de estabilidad persistente

Medidos sobre el corpus REAL, no sobre casos de laboratorio.

| Test | Resultado | Evidencia |
|---|---|---|
| Query independence | **PASS** | 397 observaciones aparecen en más de una consulta; 0 violaciones. La consulta no es parámetro de `assignIdentity` |
| Pharmacy independence | **PASS** | 101 firmas de concepto presentes en ≥2 farmacias; 0 con más de un ID |
| Order independence | **PASS** | registro reconstruido con el orden invertido: misma partición (77 grupos) |
| Corpus independence | **PASS** | registro con media corpus, luego la otra mitad: 0 rotaciones sobre 419 observaciones |
| Partial observation | **PASS** | 76 conceptos auditados, 76 acuñados en la primera pasada, **0 acuñaciones ilegales** |
| Concurrent creation | **PASS** | 30 observaciones de la misma firma en paralelo con latencia intercalada → 1 identidad |
| Canonicalizer version change | **PASS** | 76 identidades reasociadas a firma nueva → 76 conceptos, **0 rotaciones** |

Los siete están además cubiertos por tests unitarios deterministas en
`packages/domain/src/__tests__/searchV2.persistentRegistry.test.ts`.
