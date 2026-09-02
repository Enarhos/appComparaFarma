# CF-SEARCH-011 — Comparación V1 vs V2

Fuente: `analysis/comparison.json` y `analysis/key-cases.json`, producidos por
`scripts/shadow-eval.mjs` sobre el corpus congelado.

**Los dos motores procesan exactamente las mismas ofertas**, leídas del mismo
sobre. V1 sigue siendo la respuesta al usuario; V2 solo calcula identidad.

**Reejecutado entero tras la revisión CTO del PR #159.** Las cifras anteriores se
conservan como OLD.

---

## 1. Unidad de comparación

Se compara **par de ofertas dentro de una misma consulta**. Para cada par:

- `v1Together` — las dos ofertas están en la misma tarjeta de v1;
- `v2Together` — las dos ofertas están en la misma `provisionalProductKey` de v2;
- `contradicts` — las dos ofertas se contradicen en algún eje (ver §3).

Es la misma unidad que usó CF-SEARCH-010 para medir el false merge de v1, así que
las dos mediciones son comparables.

## 2. Las seis categorías

| Categoría | Definición operativa | Veredicto |
|---|---|---|
| `UNCHANGED` | `v1Together === v2Together` | sin cambio |
| `MERGE_FIXED` | v1 separaba, v2 une, y **no** se contradicen | mejora — es el objetivo |
| `SPLIT_FIXED` | v1 unía, v2 separa, y **sí** se contradicen | mejora — v2 corrige un falso merge de v1 |
| `SPLIT_LOST` | v1 separaba, v2 une, y **sí** se contradicen | **falso merge introducido por v2 — bloqueante** |
| `MERGE_REGRESSION` | v1 unía, v2 separa, y **no** se contradicen | regresión — comparación perdida |
| `IDENTITY_UNKNOWN` | par en desacuerdo donde v2 no pudo demostrar identidad (cabecera no resuelta o producto ambiguo) | se cuenta aparte, no excluye de las anteriores |

> **Dos lecturas de `SPLIT_LOST`.** El ticket (§16) lo define como *"una oferta
> válida deja de estar representada/enlazada correctamente por el modelo v2"*;
> `SHADOW_MODE_DESIGN.md` §4 de CF-SEARCH-010 lo define como *"v1 emite 2+, v2
> emite 1, y eran productos distintos"* (un falso merge). **Se miden las dos**, y
> las dos deben ser 0. La primera alimenta el Gate B; la segunda es la métrica
> de la tabla de arriba y se reporta junto al Gate B como
> `pairwiseFalseMergeSense`.

## 3. Detector de contradicción

**Superconjunto estricto** de los 6 ejes que usa la medición de v1: agrega
`brand`, `manufacturer`, `packageVolume`, `administrationTime` e
`ispRegistration`, que v1 no compara en ninguna parte. La ausencia nunca es
contradicción; dos valores **declarados** y distintos, sí.

| Eje | v1 lo compara | v2 lo compara |
|---|---|---|
| principios activos | vía `matchKey` (1 token) | conjunto completo |
| concentración | sí | sí |
| forma farmacéutica | sí | sí |
| cantidad por envase | sí | sí |
| variante comercial | sí | sí |
| combinación | sí | absorbida en principios activos |
| **volumen de envase** | **no** | **sí** |
| **marca** | no (mezclada con laboratorio) | **sí** |
| **laboratorio** | parcialmente, vía `brand:` | **sí** |
| **momento de administración** | escondido en `matchKey` | **sí** |
| **registro ISP** | **no** | **sí** (siempre `UNKNOWN` en S0) |
| **vía de administración** | **no** | **sí** (nuevo tras el PR #159) |
| **unidad farmacéutica** | **no** | **sí** (nuevo tras el PR #159) |
| **discriminante de identidad no resuelta** | **no** | **sí** (nuevo tras el PR #159) |

Tras la revisión, el eje de forma compara la **Forma Farmacéutica canónica**
(`comprimido` ≠ `capsula`, `crema` ≠ `gel`) y no la clase gruesa de v1. Es
deliberado: si la identidad se decide con `CanonicalDosageForm`, el detector del
gate tiene que mirar lo mismo, o estaría midiendo el gate con una regla más débil
que la que asigna identidad. El detector es ahora un superconjunto estricto tanto
del de v1 como del de la entrega anterior, y sigue dando **0**.

Para la concentración, el detector usa **la misma semántica que
`isCompatibleConcentration()` de v1** —dos niveles de evidencia distintos no son
comparables y por lo tanto no son contradictorios—, porque es la definición que
produjo la línea base "false merges = 0" y el gate tiene que comparar lo mismo,
no dos definiciones distintas. La variante **estricta** (que además exige que la
masa coincida con el numerador de la razón) se calcula y se reporta aparte:
**también da 0**. Ninguna de las dos definiciones cambia el veredicto.

---

## 4. Resultado

**94.869 pares comparados** sobre las 16 consultas.

| Categoría | Pares | % |
|---|---:|---:|
| `UNCHANGED` | 94.162 (antes 94.165) | 99,25 % |
| `MERGE_FIXED` | **642** (antes 639) | 0,68 % |
| `SPLIT_FIXED` | **58** (sin cambio) | 0,06 % |
| `MERGE_REGRESSION` | **7** | 0,007 % |
| **`SPLIT_LOST`** | **0** | **0 %** |
| `IDENTITY_UNKNOWN` | 278 | 0,29 % |

**Disagreement rate: 0,75 %.**

Lectura: por cada par que v2 separa y v1 unía sin motivo (`MERGE_REGRESSION`),
hay **107 pares** que v2 une correctamente y v1 fragmentaba (`MERGE_FIXED`).
Y v2 corrige además **52 pares** que v1 tenía fusionados pese a contradecirse.

`SPLIT_LOST = 0` en las dos lecturas: ninguna oferta perdió su enlace canónico, y
ningún par contradictorio terminó en el mismo producto.

### Las 3 regresiones (7 instancias consulta×par)

Todas son **la misma causa raíz**, y es una consecuencia deliberada del diseño:

| Par | Por qué v2 separa |
|---|---|
| `Tocalm Ambroxol Jarabe Adulto 100 mL (Prater)` ↔ `Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL` | el primero no declara concentración, y hay 2+ conceptos de ambroxol `fluid-oral` candidatos (30 mg/5 ml y 15 mg/5 ml) |
| `Paracetamol Gotas 15ml` ↔ `Paracetamol 100 mg Gotas 15 mL` | idem, con las potencias de paracetamol líquido |
| `Tapsin Infantil Suspensión 100Ml` ↔ `Tapsin Infantil 120 mg/5 mL Suspensión Oral 100 mL` | idem |

En los tres, v1 fusiona porque trata la ausencia de concentración como comodín.
v2 **se niega a elegir** entre dos potencias candidatas. Es la regla
`ambiguous → identidad propia`, y es la dirección conservadora: preferir un split
de más antes que fusionar un jarabe de adulto con uno pediátrico.

**Es exactamente el caso que un registro persistido resuelve.** En S1, la
asignación se decide una vez —con evidencia adicional o curaduría— y se recupera;
no se vuelve a adivinar en cada búsqueda. Registrado en `S0_FAILURES.md` §4.

---

## 5. Los cinco casos de control (§17 del ticket)

### Losartán — el caso que v1 fragmenta en hasta 9 tarjetas

Losartán 50 mg × 30 del corpus: **26 observaciones únicas** (52 filas en las 2
consultas de losartán), **6 farmacias**.

| | v1 | v2 |
|---|---:|---:|
| Tarjetas / productos | **44** | **16** |
| `presentationKey` / presentaciones | 22 | **3** |
| Conceptos | — | **3** |

**Los 16 productos, y por qué cada uno está separado:**

| Producto | Obs. | Farmacias | Motivo de la separación |
|---|---:|---:|---|
| **Genérico, sin marca ni laboratorio declarado** | **6** | **6** | — |
| Combinación con hidroclorotiazida, sin laboratorio | 3 | 2 | otro concepto |
| `Cozaar` | 2 | 2 | marca declarada |
| `Corodin` | 2 | 2 | marca declarada |
| `Losapres` | 2 | 2 | marca declarada |
| `Lopren`, `Simperten-D` | 1 c/u | 1 | marca declarada |
| Genérico (`Hospifarma`, `Opko`, `Mintlab`, `Seven Pharma`, `Ascend`, `Eurofarma`) | 1 c/u | 1 | laboratorio estructurado distinto |
| Combinación (`Ascend`), combinación (`Opko`), `Hyzaar` | 1 c/u | 1 | otro concepto o laboratorio |

**El resultado clave:** las 6 ofertas genéricas de **6 farmacias distintas** —que
v1 reparte en tarjetas separadas porque cada farmacia declara (o no) un
laboratorio distinto— quedan en **un solo producto comparable**. Y los seis
laboratorios estructurados distintos (Hospifarma, Opko, Mintlab, Seven Pharma,
Ascend, Eurofarma) **siguen separados**: no se forzó un solo producto donde
realmente hay laboratorios distintos. El objetivo es identidad correcta, no
"menos tarjetas".

Genéricos y marcas comparten **la misma presentación**, que es donde el diseño
aprobado dice que aparece la comparación (etapa 9: tarjeta = producto, grupo =
presentación).

La combinación `Losartán + Hidroclorotiazida` tiene **concepto propio**
(`ing=hidroclorotiazida+losartan`), separada del monofármaco.

### Ambroxol

38 observaciones únicas de ambroxol (154 filas upstream con la repetición de
consultas), 9 farmacias, 142 tarjetas v1 → **9 conceptos, 13 presentaciones,
33 productos**.

| Concepto v2 | Obs. | Productos | Farmacias | Qué agrupa |
|---|---:|---:|---:|---|
| `conc:ratio:6mg/ml`, `fluid-oral` | **16** | 13 | **7** | `30mg/5ml`, `30mg./5ml.` con punto, `30mg 5ml` sin separador, `600mg/100ml` |
| `conc:ratio:3mg/ml`, `fluid-oral` | **11** | 11 | **5** | `15mg/5ml` en todas sus escrituras |
| ambiguo (jarabe sin concentración declarada) | 3 | 3 | 2 | ver `S0_FAILURES.md` §4 |
| `conc:mass:30mg`, `solid-oral` | 2 | 1 | 2 | Muxol comprimidos — **separado del jarabe** |
| `conc:ratio:7.5mg/ml`, `fluid-oral` | 2 | 1 | 2 | Broncot gotas — **separado del jarabe de 15 mg/5 ml** |
| 4 conceptos aislados de 1 observación | 4 | 4 | — | incluye las 2 del caso `600 mg 100 ml` (`S0_FAILURES.md` §3) |

Las tres escrituras del jarabe de adulto (razón, razón con punto, y razón sin
separador) resuelven al **mismo concepto**, y ese concepto reúne **7 de las 9
farmacias**. `30 mg/5 ml` y `15 mg/5 ml` **nunca** lo comparten. `Muxol` comparte
concepto con el genérico pero es un **producto distinto**. Y `ambroxol` **no
aparece como variante comercial en ningún producto** — el defecto de las 65
ofertas de v1 está resuelto estructuralmente, no por lista negra.

Un caso que ilustra la política: "Ambroxol clorhidrato 30 mg 100 ml Ascend" no
declara forma farmacéutica, así que es compatible **a la vez** con el jarabe de
30 mg/5 ml y con el comprimido de 30 mg. v2 encuentra dos candidatas y **no
elige**: le da concepto propio. Es una oferta menos comparada, y es la decisión
correcta.

### Tapsin — protección de CF-SEARCH-001

174 filas upstream, 163 tarjetas v1, 113 `presentationKey` distintas →
**34 conceptos, 56 presentaciones, 111 productos** (antes 30 / 54 / 109; sube
por la separación comprimido/cápsula y por la unidad farmacéutica como eje).

`Puro`, `Duo`, `Forte`, `SC`, `Infantil`, `InstaFLU`, `Día`, `Noche` conservan
cada uno su producto. La **ausencia** de variante también es identidad:
"Tapsin x 6 comprimidos" no comparte producto con "Tapsin Rojo Dolor de Cabeza
Tira x 6".

Verificado además que "Tapsin Forte x 30" **no** se absorbe dentro del concepto
"paracetamol 500 mg comprimido" —su firma es
`ing=?|disc=tapsin|conc=conc:?|form=comprimido|route=oral|unit=comprimido`, con el
principio activo honestamente DESCONOCIDO y el discriminante bloqueando la
fusión— y que un sobre suelto no comparte presentación con la caja de 6.

Y el caso inverso: cuando el nombre SÍ nombra las moléculas, la marca no se
cuela en la composición. `Tapsin Duo (B) Paracetamol / Ibuprofeno` firma
`ing=ibuprofeno+paracetamol`, no `ing=ibuprofeno+paracetamol+tapsin`.

**Día vs Noche fue el caso que detectó un defecto real de v2** — ver
`S0_FAILURES.md` §2.

### Ibuprofeno

194 ofertas, 9 farmacias, 166 tarjetas v1 → **14 conceptos, 20 presentaciones,
64 productos**.

`400 mg` ≠ `600 mg`. `200 mg/5 ml` ≠ `100 mg/5 ml` — **el par que compartía hash
de slug en v1** ahora tiene conceptos distintos por construcción. Jarabe y
suspensión de la misma potencia **sí** comparten concepto (misma clase
`fluid-oral`). Comprimido y jarabe, nunca.

### Combinaciones

131 filas upstream con más de un principio activo, 125 tarjetas v1 →
**46 conceptos, 57 presentaciones, 80 productos**.

Monofármaco y asociación nunca comparten concepto. El orden textual
(`Losartán + Hidroclorotiazida` vs `Hidroclorotiazida + Losartán`) no crea
identidades distintas. La sal (`Losartán Potásico`) no se cuenta como segundo
principio activo.

Los 52 pares `SPLIT_FIXED` se concentran acá y en amoxicilina: son productos que
v1 fusionaba pese a contradecirse (`Amoval Duo 400mg/5ml` vs `Amoval 250mg/5ml`,
`Clavinex Duo Forte`, `Amobiotic 1 g`).

---

## 6. Fragmentación, con el mismo denominador

Comparar "fragmentación de v1" contra "fragmentación de v2" con denominadores
distintos no dice nada. Acá el denominador es el mismo para los dos motores: las
**421 presentaciones canónicas v2**, y se cuenta en cuántas de ellas las ofertas
quedan repartidas en más de una tarjeta del motor evaluado.

| Métrica | V1 | V2 |
|---|---:|---:|
| Presentaciones repartidas en más de una tarjeta | **307 / 421** | **149 / 421** |
| **Tasa de fragmentación** | **72,9 %** | **35,4 %** |
| Tarjetas por concepto v2 | **4,64** | **2,45** |

Cifras de la entrega anterior, con su propio denominador de 429 presentaciones:
311 / 429 = 72,5 % en v1 y 149 / 429 = 34,7 % en v2. **La fragmentación no se
optimiza**: primero se corrige el contrato semántico y después se vuelve a medir.
En esta iteración subió 0,7 pp y se deja así — bajarla habría significado no
separar una asociación de su monofármaco.

**La fragmentación se reduce a la mitad y las tarjetas por concepto casi también,
con `SPLIT_LOST = 0` y `false merge = 0`.**
