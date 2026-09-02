# CF-SEARCH-011 — Métricas de S0

Fuente: `analysis/v1-baseline.json`, `analysis/v2-metrics.json`,
`analysis/comparison.json`, `analysis/context-stability.json`. Corpus congelado
de 2026-09-02, 16 consultas.

**Reejecución completa tras la iteración del lector de asociaciones** (defectos
§10 a §11-bis de `S0_FAILURES.md`). Ninguna cifra se reutiliza: todas se
recalcularon desde el mismo corpus congelado corriendo el harness de punta a
punta con el motor final. La columna OLD es la reejecución anterior —la de la
revisión CTO del PR #159—, y se conserva para poder atribuir cada movimiento.

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

| Nivel | OLD (PR #159) | NEW (asociaciones) | Ratio vs tarjetas v1 |
|---|---:|---:|---:|
| `provisionalConceptKey` | 316 | **312** | 0,22 |
| `provisionalPresentationKey` | 429 | **421** | 0,29 |
| `provisionalProductKey` | 767 | **764** | 0,53 |
| `provisionalOfferKey` | 987 | **987** | — |
| **Colisiones de identificador** | 0 | **0** | — |

**Por qué bajó en esta iteración, y por qué eso NO es una fusión de más.** El
lector de asociaciones (`compositionReader.ts`) unifica escrituras que antes
quedaban separadas y separa una que antes se fusionaba, y el neto es −4
conceptos. Los dos movimientos son correctos y cada uno tiene su evidencia:

- **unifica** las escrituras de una misma asociación que difieren solo en la
  tipografía — las 3 de Adorlan (con `/` y sin separador) pasan a un solo
  concepto, y las 4 de amoxicilina + ácido clavulánico dejan de partirse según
  dónde cada farmacia ponga la palabra "ácido";
- **separa** la asociación del monofármaco — Adorlan (diclofenaco+tramadol) deja
  de compartir concepto con Lertus (diclofenaco), y "Zolimax Duo **875/125**
  Amoxicilina 875 mg" deja de caer en el monofármaco de amoxicilina.

**Lo que se corrigió en la revisión anterior sigue corregido:** la firma del
concepto usa 6 ejes (`ing + disc + conc + form + route + unit`) con la Forma
Farmacéutica canónica. Los conceptos que mezclaban comprimido con cápsula, crema
con gel, unidades farmacéuticas distintas o vías distintas siguen en **0, 0, 0 y
0** sobre esta corrida.

Cero colisiones = ninguna pareja de firmas distintas compartió identificador en
ninguno de los tres niveles. Compárese con los **4 pares de productos con hash de
slug compartido** que CF-SEARCH-010 midió en v1.

Los 312 conceptos de v2 contra los 292 de la aproximación v1 no son un empeoramiento:
la aproximación de v1 se construye con menos ejes y colapsa cosas que v2 separa
correctamente (sólido vs líquido de la misma masa, combinaciones, cabeceras no
resueltas).

---

## 3. Agrupación

| Métrica | V1 | V2 (tarjeta = producto) | V2 (grupo = presentación) |
|---|---:|---:|---:|
| Tarjetas / grupos emitidos | 1.447 | **764** | **421** |
| **Tasa de una sola farmacia** | **89,7 %** | **84,7 %** | **61,8 %** |
| Tarjetas por concepto v2 | 4,64 | **2,45** | 1,35 |
| Fragmentación (denominador común: 421 presentaciones v2) | **72,9 %** | **35,4 %** | — |

Cifras anteriores (PR #159): 767 tarjetas / 429 grupos, tasa 84,9 % / 62,7 %,
fragmentación 72,5 % → 34,7 %.

**Lectura honesta del conteo absoluto multi-farmacia.** No es una regresión: v2
emite **47 % menos tarjetas** (764 vs 1.447), así que el conteo absoluto de
tarjetas multi-farmacia baja aunque la *tasa* mejore. La métrica que el diseño
aprobado señala como la relevante es la del **grupo de presentación**, que es
donde v2 pone la comparación (etapa 9: tarjeta = producto, grupo =
presentación): ahí la tasa de una sola farmacia cae de 89,7 % a **61,8 %**.

---

## 4. Calidad de identidad

| Métrica | Valor |
|---|---:|
| Pares intra-producto evaluados | 472 (antes 469) |
| **False merges (definición comparable con la línea base v1)** | **0** |
| **False merges (definición estricta de concentración)** | **0** |
| **False merge rate** | **0,000000** |
| **SPLIT_LOST (ofertas sin enlace correcto)** | **0** |
| **SPLIT_LOST (par contradictorio fusionado por v2)** | **0** |
| False splits — `MERGE_REGRESSION` | **7 pares** (3 pares distintos) |
| Identity unknown (ofertas sin principio activo demostrable) | **596 (36,5 %)** |
| Identidad inferida por subsunción | **145 (8,9 %)** |
| Ofertas con evidencia estructurada (concentración **y** forma legibles) | **1.208 (74,0 %)** |
| **Estabilidad de la firma CRUDA entre contextos** | **100,0000 %** |
| **Estabilidad de la clave RESUELTA entre contextos** | **99,8775 %** |
| **Identidades dependientes del contexto** | **2 de 1.633 (0,1225 %)** |

### Resolución del concepto, oferta por oferta

| Tipo | Ofertas | % | Significado |
|---|---:|---:|---|
| `complete` | 506 (antes 510) | 31,0 % | todos los ejes declarados |
| `subsumed` | 145 (antes 142) | 8,9 % | firma parcial adoptada por una única anfitriona |
| `isolated` | 738 (antes 741) | 45,2 % | firma parcial sin ninguna anfitriona compatible |
| `ambiguous` | 244 (antes 240) | 14,9 % | firma parcial con 2+ anfitrionas: **no se eligió** |

**`complete` cae de 72,6 % a 31,0 % y eso NO es una regresión.** Con 3 ejes era
fácil declararlos todos; con 6, la mayoría de los nombres del catálogo no declara
la unidad farmacéutica y bastantes tampoco la forma. Lo que cambió no es la
calidad del dato —es prácticamente idéntica, las mismas ~596 ofertas sin
principio activo demostrable— sino que el motor dejó de llamar "completa" a una
lectura que nunca lo fue. Una firma `isolated` conserva identidad propia y no
fusiona nada: la dirección es conservadora.

Las 244 ofertas `ambiguous` son la parte del corpus donde v2 **se niega
explícitamente a adivinar**. Es la métrica que hay que vigilar en S1: cada una es
una asignación que el registro persistido puede resolver una vez, y que hoy se
recalcula sin evidencia suficiente.

**Los 596 `identity unknown` (36,5 %) son el techo de calidad de S0**, y su causa
es única y conocida: `COMPOSITION_VOCABULARY` cubre 34 moléculas medidas sobre el
corpus de CF-DATA-001, no la farmacopea. Una molécula ausente produce una cabecera
un discriminante de identidad no resuelta
(`unresolvedIdentityDiscriminator`) — un falso negativo conservador, nunca una
identidad inventada. Desde la revisión del PR #159 ese token **no** se publica
como principio activo en ninguna parte del modelo.

---

## 4-bis. Semántica de la composición (iteración de asociaciones)

| Métrica | Valor |
|---|---:|
| Conceptos que declaran **asociación** | **61 de 312** |
| Conceptos que declaran **monofármaco** | 96 de 312 |
| Ofertas cuyo nombre declara una asociación | **137 de 1.633** |
| Ofertas con **lectura parcial** (declara N componentes, se nombraron M < N) | **54** |
| Tokens distintos afirmados como principio activo | **22** (antes 26) |

### Métrica de seguridad nueva — `Concept Semantic Collision Rate`

Estado **`REPORTED_NOT_GATED`**: se mide y se publica, pero **no** entra en
`finalVerdict`. Adoptarla como cuarto gate es una decisión de dirección
CTO/Product (`S0_FAILURES.md` §12).

| Componente | Qué detecta | Valor |
|---|---|---:|
| `monotherapyAssociationCollisions` | contradicción de cardinalidad dentro de un concepto | **0** |
| `conceptIngredientContradictions` | conjuntos de moléculas incompatibles dentro de un concepto | **0** |
| `negatedIngredientAssertions` | el motor afirma una molécula que el nombre niega | **0** |
| **Concept Semantic Collision Rate** | agregado sobre 312 conceptos | **0,000000** |

El clasificador que alimenta esta métrica está implementado **aparte** del lector
que asigna identidad, con código distinto y derivando la evidencia otra vez desde
el nombre: si reutilizara `readIngredientComposition()` mediría su propia
coherencia y daría 0 por construcción.

**Riesgo residual medido, no disuelto en un promedio.** 63 ofertas llegan con el
nombre truncado por la fuente (EasyFarma). La métrica no puede pronunciarse sobre
ellas —sin el final del nombre no hay composición que medir— así que un nombre
truncado nunca declara monofármaco. 22 filas truncadas se resuelven por
subsunción dentro de otra firma y se listan una por una en
`analysis/v2-metrics.json` (`truncatedNamesSubsumedSamples`).

---

## 5. Comparación V1 vs V2

| Métrica | Valor |
|---|---:|
| Métrica | OLD (PR #159) | NEW (asociaciones) |
|---|---:|---:|
| Pares comparados | 94.869 | 94.869 |
| **Disagreement rate** | 0,74 % | **0,75 %** |
| `UNCHANGED` | 94.165 | 94.162 |
| **`MERGE_FIXED`** | 639 | **642** |
| **`SPLIT_FIXED`** | 58 | **58** |
| `MERGE_REGRESSION` | 7 | **7** |
| **`SPLIT_LOST`** | 0 | **0** |
| `IDENTITY_UNKNOWN` | 278 | 278 |

Relación mejora/regresión: **100 a 1** (700 pares corregidos contra 7
regresiones). Las 3 fusiones correctas que suma esta iteración son las
escrituras de una misma asociación que antes quedaban en conceptos distintos.
`SPLIT_LOST` sigue en **0**: ninguna corrección de esta iteración perdió una
agrupación que v1 hacía bien. Las 3 regresiones distintas son las mismas de
siempre (§4 de este documento), ninguna nueva.

---

## 6. Rendimiento

Medido con `performance.now()` sobre el evaluador shadow. **Solo se mide; no se
optimizó nada** (§20 del ticket).

| Métrica | Valor |
|---|---:|
| Corpus completo (987 observaciones, resolución única) | **108,9 ms** (antes 99,8) |
| **p50 por consulta** (~102 ofertas) | **7,2 ms** (antes 8,7) |
| **p95 por consulta** | **13,0 ms** (antes 12,5) |
| Consultas medidas | 16 |

Contexto: el objetivo de `SHADOW_MODE_DESIGN.md` §3 para v2 es
`≤ v1 + 150 ms p95`. Con 13,0 ms p95 el margen es amplio, pero **es una medición
offline sobre datos ya en memoria**: no incluye retrieval, ni serialización, ni
el arranque en frío de una función serverless. No se puede extrapolar a
producción sin medirlo ahí, y S0 no lo hace.

El algoritmo de resolución es O(n²) sobre firmas **distintas** por nivel. Con 987
observaciones y ~400 firmas distintas eso no se nota; con un registro persistido
(S1) la búsqueda de anfitrionas pasa a ser una consulta indexada y el problema
desaparece. Registrado como deuda, no como bloqueo.

---

## 8. Estabilidad contextual — investigación exigida por la revisión CTO

### Qué se midió, y por qué son DOS métricas y no una

| Métrica | Valor | Qué significa |
|---|---:|---|
| Estabilidad de la firma **cruda** (`rawSignature`) | **1633/1633 = 100,0000 %** | La lectura del nombre no depende de ninguna otra oferta. La canonicalización es pura, y esto lo demuestra sobre datos, no por argumento |
| Estabilidad de la **clave resuelta** (`provisionalConceptKey`) | **1631/1633 = 99,8775 %** | La resolución sí depende de qué firmas son visibles |
| Identidades dependientes del contexto | **2** (2 ofertas distintas) | — |

Separarlas es el resultado. Si la firma cruda fuera inestable habría un defecto
de algoritmo; es 100 % estable, así que **toda** la contextualidad vive en un
único lugar identificado: el paso de resolución.

### Las 2 ofertas afectadas, una por una

Evidencia completa y regenerable en `analysis/context-stability.json`.

| query | pharmacy | rawName | fullCorpusIdentity | isolatedIdentity | reason |
|---|---|---|---|---|---|
| `tapsin` | easyfarma | `Paracetamol inf. suposit. x 6` | `subsumed` bajo `ing=paracetamol \| disc=none \| conc=mass:125mg \| form=supositorio \| route=rectal \| unit=supositorio` (1 anfitriona) | `isolated` sobre su propia firma parcial, con `conc=?` y `unit=?` (0 anfitrionas) | Nombre truncado por EasyFarma: no declara concentración ni unidad. En el corpus completo existe exactamente UNA firma completa compatible y la subsunción la adopta; en la consulta aislada esa firma no está presente |
| `tapsin` | easyfarma | `Alividol 1000 mg 20...` | `subsumed` bajo `ing=? \| disc=alividol \| conc=mass:1000mg \| form=comprimido \| route=oral \| unit=comprimido` (1 anfitriona) | `isolated` sobre `form=? \| route=? \| unit=?` (0 anfitrionas) | Idéntica causa: nombre truncado, firma parcial, anfitriona presente solo en el corpus completo |

En los dos casos la **firma cruda es idéntica** en ambos contextos. Lo único que
cambia es contra qué conjunto se resuelve.

### Clasificación del 0,1225 %

De las cuatro opciones que la revisión plantea, es **comportamiento correcto de
subsunción** — no un defecto del algoritmo, no evidencia insuficiente, no un
error de lectura:

- no es defecto del algoritmo: la firma cruda es 100 % estable y la regla de
  asignación (una anfitriona ⇒ adoptar; cero ⇒ aislar; dos o más ⇒ no elegir) se
  aplicó correctamente en los dos contextos;
- no es un fallo de evidencia: el motor hizo exactamente lo que debe hacer con
  una lectura incompleta;
- **sí** es una dependencia contextual, y es incompatible con una identidad
  canónica permanente.

### Conclusión arquitectónica (la frontera que S1 no puede cruzar)

> Una identidad canónica persistente **no puede depender de qué otros productos
> aparecieron en la misma búsqueda.**

Este 0,1225 % lo demuestra empíricamente, y es la razón por la que las claves de
S0 se llaman `provisional*Key` y llevan el prefijo `PROV-` en vez de `CFM-`.

La subsunción es una **buena estrategia de RESOLUCIÓN** contra un registro
canónico: mapear una observación incompleta sobre un concepto ya conocido es
precisamente lo que hay que hacer con un nombre truncado, y es lo que produce las
642 fusiones correctas de `MERGE_FIXED`. **No es una estrategia válida para CREAR
identidad desde el corpus**, porque el conjunto de candidatas cambia con la
consulta.

Las tres responsabilidades quedan separadas explícitamente en el código
(`canonicalIdentity.ts`, cabecera del módulo):

```
CANONICALIZATION     texto -> atributos          PURA por oferta       (100 %)
RESOLUTION           firma -> firma conocida     CONTEXTUAL por diseno (99,88 %)
IDENTITY ASSIGNMENT  firma -> CFM-* permanente   NO IMPLEMENTADO EN S0
```

Regla para S1, derivada de esta medición y no de una preferencia: el registro
persistido aporta el conjunto de anfitrionas —estable, independiente de la
consulta y de qué farmacias respondieron— y el `CFM-CONCEPT-ID` permanente solo
se acuña desde una firma **completa**. Una observación parcial resuelve contra el
registro o queda sin resolver; nunca acuña un ID permanente hasheando su firma
resuelta.

---

## 7. Métricas explícitamente NO medidas en S0

- **Precisión de top results** — requiere juez humano; CF-SEARCH-010 ya lo dejó
  pendiente y S0 no lo resuelve.
- **Wrong detail navigation / colisiones de slug** — S0 no toca routing.
- **Latencia en producción** — v2 no está desplegado y no debe estarlo.
- **Cobertura de registro ISP** — 0 % por diseño: CF-DATA-005 (#156) es
  independiente y S0 no depende de él.
