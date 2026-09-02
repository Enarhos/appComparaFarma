# CF-SEARCH-011 — Métricas de S0

Fuente: `analysis/v1-baseline.json`, `analysis/v2-metrics.json`,
`analysis/comparison.json`, `analysis/context-stability.json`. Corpus congelado
de 2026-09-02, 16 consultas.

**Reejecución completa tras la revisión CTO del PR #159.** Ninguna cifra se
reutiliza de la entrega anterior; todas se recalcularon desde el mismo corpus con
el motor corregido. Las cifras anteriores se conservan como OLD, no se borran.

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

| Nivel | OLD | NEW | Ratio vs tarjetas v1 |
|---|---:|---:|---:|
| `provisionalConceptKey` | 303 | **316** | 0,22 |
| `provisionalPresentationKey` | 414 | **429** | 0,30 |
| `provisionalProductKey` | 755 | **767** | 0,53 |
| `provisionalOfferKey` | 987 | **987** | — |
| **Colisiones de identificador** | 0 | **0** | — |

**Por qué subió la cardinalidad.** La firma del concepto pasó de 3 ejes
(`ing + conc + form`) a 6 (`ing + disc + conc + form + route + unit`), y `form`
usa la Forma Farmacéutica canónica en vez de la clase gruesa de v1. Medido sobre
el corpus: 13 conceptos mezclaban comprimido con cápsula, 3 mezclaban crema con
gel y 13 mezclaban unidades farmacéuticas distintas. Los tres recuentos son ahora
**0**. Los 30 conceptos que siguen agrupando más de un descriptor líquido
(jarabe / suspensión / solución / gotas / polvo) lo hacen por decisión explícita y
con evidencia — ver `CANONICAL_IDENTITY_IMPLEMENTATION.md`.

Cero colisiones = ninguna pareja de firmas distintas compartió identificador en
ninguno de los tres niveles. Compárese con los **4 pares de productos con hash de
slug compartido** que CF-SEARCH-010 midió en v1.

Los 316 conceptos de v2 contra los 292 de la aproximación v1 no son un empeoramiento:
la aproximación de v1 se construye con menos ejes y colapsa cosas que v2 separa
correctamente (sólido vs líquido de la misma masa, combinaciones, cabeceras no
resueltas).

---

## 3. Agrupación

| Métrica | V1 | V2 (tarjeta = producto) | V2 (grupo = presentación) |
|---|---:|---:|---:|
| Tarjetas / grupos emitidos | 1.447 | **767** | **429** |
| **Tasa de una sola farmacia** | **89,7 %** | **84,9 %** | **62,7 %** |
| Tarjetas por concepto v2 | 4,58 | **2,43** | 1,36 |
| Fragmentación (denominador común: 429 presentaciones v2) | **72,5 %** | **34,7 %** | — |

Cifras anteriores: 755 tarjetas / 414 grupos, tasa 84,1 % / 61,6 %,
fragmentación 72,0 % → 36,0 %.

**Lectura honesta del conteo absoluto multi-farmacia.** No es una regresión: v2
emite **47 % menos tarjetas** (767 vs 1.447), así que el conteo absoluto de
tarjetas multi-farmacia baja aunque la *tasa* mejore. La métrica que el diseño
aprobado señala como la relevante es la del **grupo de presentación**, que es
donde v2 pone la comparación (etapa 9: tarjeta = producto, grupo =
presentación): ahí la tasa de una sola farmacia cae de 89,7 % a **62,7 %**.

---

## 4. Calidad de identidad

| Métrica | Valor |
|---|---:|
| Pares intra-producto evaluados | 469 (antes 533) |
| **False merges (definición comparable con la línea base v1)** | **0** |
| **False merges (definición estricta de concentración)** | **0** |
| **False merge rate** | **0,000000** |
| **SPLIT_LOST (ofertas sin enlace correcto)** | **0** |
| **SPLIT_LOST (par contradictorio fusionado por v2)** | **0** |
| False splits — `MERGE_REGRESSION` | **7 pares** (3 pares distintos) |
| Identity unknown (ofertas sin principio activo demostrable) | **598 (36,6 %)** |
| Identidad inferida por subsunción | **142 (8,7 %)** |
| Ofertas con evidencia estructurada (concentración **y** forma legibles) | **1.208 (74,0 %)** |
| **Estabilidad de la firma CRUDA entre contextos** | **100,0000 %** |
| **Estabilidad de la clave RESUELTA entre contextos** | **99,8775 %** |
| **Identidades dependientes del contexto** | **2 de 1.633 (0,1225 %)** |

### Resolución del concepto, oferta por oferta

| Tipo | Ofertas | % | Significado |
|---|---:|---:|---|
| `complete` | 510 (antes 1.185) | 31,2 % | todos los ejes declarados |
| `subsumed` | 142 (antes 131) | 8,7 % | firma parcial adoptada por una única anfitriona |
| `isolated` | 741 (antes 105) | 45,4 % | firma parcial sin ninguna anfitriona compatible |
| `ambiguous` | 240 (antes 212) | 14,7 % | firma parcial con 2+ anfitrionas: **no se eligió** |

**`complete` cae de 72,6 % a 31,2 % y eso NO es una regresión.** Con 3 ejes era
fácil declararlos todos; con 6, la mayoría de los nombres del catálogo no declara
la unidad farmacéutica y bastantes tampoco la forma. Lo que cambió no es la
calidad del dato —es idéntica, las mismas 598 ofertas sin principio activo
demostrable— sino que el motor dejó de llamar "completa" a una lectura que nunca
lo fue. Una firma `isolated` conserva identidad propia y no fusiona nada: la
dirección es conservadora.

Las 240 ofertas `ambiguous` son la parte del corpus donde v2 **se niega
explícitamente a adivinar**. Es la métrica que hay que vigilar en S1: cada una es
una asignación que el registro persistido puede resolver una vez, y que hoy se
recalcula sin evidencia suficiente.

**Los 598 `identity unknown` (36,6 %) son el techo de calidad de S0**, y su causa
es única y conocida: `COMPOSITION_VOCABULARY` cubre 34 moléculas medidas sobre el
corpus de CF-DATA-001, no la farmacopea. Una molécula ausente produce una cabecera
un discriminante de identidad no resuelta
(`unresolvedIdentityDiscriminator`) — un falso negativo conservador, nunca una
identidad inventada. Desde la revisión del PR #159 ese token **no** se publica
como principio activo en ninguna parte del modelo.

---

## 5. Comparación V1 vs V2

| Métrica | Valor |
|---|---:|
| Métrica | OLD | NEW |
|---|---:|---:|
| Pares comparados | 94.869 | 94.869 |
| **Disagreement rate** | 0,85 % | **0,74 %** |
| `UNCHANGED` | 94.062 | 94.165 |
| **`MERGE_FIXED`** | 748 | **639** |
| **`SPLIT_FIXED`** | 52 | **58** |
| `MERGE_REGRESSION` | 7 | **7** |
| **`SPLIT_LOST`** | 0 | **0** |
| `IDENTITY_UNKNOWN` | 360 | 278 |

Relación mejora/regresión: **100 a 1** (697 pares corregidos contra 7
regresiones). `MERGE_FIXED` baja porque el motor ya no une pares que el EDM
considera conceptos distintos — comprimido con cápsula, crema con gel. Es la
consecuencia esperada de corregir el contrato, y `SPLIT_LOST` sigue en 0.

---

## 6. Rendimiento

Medido con `performance.now()` sobre el evaluador shadow. **Solo se mide; no se
optimizó nada** (§20 del ticket).

| Métrica | Valor |
|---|---:|
| Corpus completo (987 observaciones, resolución única) | **99,8 ms** (antes 87,8) |
| **p50 por consulta** (~102 ofertas) | **8,7 ms** (antes 6,5) |
| **p95 por consulta** | **12,5 ms** (antes 11,3) |
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
639 fusiones correctas de `MERGE_FIXED`. **No es una estrategia válida para CREAR
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
