# CF-SEARCH-011 — Defectos encontrados por S0

S0 no es un examen que haya que aprobar: es una validación de arquitectura. Este
documento registra **todo** lo que la ejecución sobre datos reales rompió,
incluidos los defectos del propio modelo v2 y los que S0 no puede resolver.

Los dos primeros son defectos **del motor v2** que el corpus destapó y que se
corrigieron estructuralmente. Los dos siguientes son **limitaciones que S0 no
resuelve** y que quedan medidas.

Los §7 a §9 son los **tres defectos de contrato semántico** que la revisión CTO
del PR #159 identificó, con su corrección y la evidencia sobre el corpus.

Los §10 y §11 son los **falsos merges semánticos a nivel de CONCEPTO** que
destapó la reejecución: una asociación declarada como el mismo Concepto
Farmacéutico que un monofármaco, y una molécula que el nombre niega afirmada como
presente. Los dos están corregidos en esta iteración, dentro de v2 y sin tocar
v1. El §12 es la consecuencia de gobierno —los tres gates de S0 no podían ver
esta clase de defecto— con la métrica de seguridad que se propone para S1. El §13
es la deuda que esta iteración deja abierta a propósito.

---

## 1. Un genérico absorbido dentro de una marca — CORREGIDO

**Cómo apareció.** La primera implementación de S0 hizo `brand` y `manufacturer`
ejes **subsumibles** en la firma del producto, leyendo del diseño aprobado que
un `manufacturer: null` "deja de ser un motivo para partir un concepto".

**Qué produjo sobre el corpus.** 16 pares intra-producto contradictorios, todos
la misma fusión:

```
easyfarma    "Ambroxol Pediatrico 15mg/5..."                    ← genérico, nombre truncado
cruz-verde   "Muxol Jarabe Pediátrico Ambroxol 300 mg / 100 ml"  ← marca Muxol
                                        ↓
                          MISMO productId (CFM-M-aa5o28a…)
```

Una oferta genérica sin marca demostrable —cuyo nombre EasyFarma trunca, defecto
ya documentado como QA-SEARCH-007— quedaba absorbida dentro del producto de marca
Muxol. Es decir: un genérico y una marca presentados como el mismo producto, con
su diferencia de precio mostrada como ahorro. **Exactamente el riesgo clínico que
`PRODUCT_IDENTITY.md` §10 prohíbe.**

**Causa raíz.** Lectura incorrecta del diseño aprobado. `SEARCH_ENGINE_V2.md`
etapa 5 dice literalmente que un laboratorio ausente *"se convierte en un producto
comercial 'no identificado' **dentro de la misma presentación, comparable con los
demás**"*. **Comparable, no absorbido.** La comparación aparece en el nivel de
presentación, no fusionando el producto no identificado dentro del identificado.

**Corrección.** `brand`, `variant`, `time` y `manufacturer` declaran su ausencia
como un VALOR (`unbranded`, `none`, `unidentified`) y **no son subsumibles**. El
único eje subsumible del nivel producto es `isp`.

**Efecto medido:** false merges 16 → **0**. Productos 663 → 755. La fragmentación
comparable subió de 34,8 % a 36,0 % — el precio, chico y correcto, de no fusionar
genéricos dentro de marcas.

**Test que lo fija:** `searchV2.canonicalize.test.ts` → *"un genérico sin marca
demostrable NO se absorbe dentro de una marca"*.

---

## 2. Tapsin Día y Tapsin Noche fusionados — CORREGIDO

**Cómo apareció.** El caso de control obligatorio de §17 (protección de las
correcciones de CF-SEARCH-001).

```
cruz-verde   "Tapsin Plus Día 16 Comprimidos"
salcobrand   "Tapsin Plus Noche 16 Comprimidos"
                        ↓
              MISMO productId
```

**Causa raíz — y es un hallazgo sobre v1, no solo sobre v2.** En v1 la dimensión
"artículo comercial dentro de la marca" está repartida entre **dos mecanismos que
no se hablan**:

- `commercialVariantKey()` lee el calificador (`forte`, `rojo`, `duo`);
- `matchKey()` lee el momento de administración en su segmento `turn`
  (`/\bnoche\b/ → "n"`, `/\bdia\b/ → "d"`).

Y `commercialVariantKey()` **no puede** ver el segundo: `dia`, `noche` y `plus`
están en `STOP_WORDS`. Así que la única mitad que separa Día de Noche es la que
vive dentro de `matchKey` — una clave farmacológica persistida.

Un motor v2 que consumiera solo `commercialVariantKey` **pierde esa separación**.
No es un descuido de v2: es una dimensión que v1 tiene escondida en el lugar
equivocado, y que solo se ve cuando se intenta reconstruir la identidad desde
cero.

**Corrección.** `readAdministrationTime()` en `canonicalAttributes.ts`, y un eje
`time` propio en la firma del producto, no subsumible (la ausencia es un valor,
igual que el `turn` vacío de v1). La regla de v1 se **reproduce** en vez de
importarse porque en v1 no es una función: es una línea dentro de `matchKey()`,
cuyo valor está persistido y no se puede refactorizar en S0.

**Test que lo fija:** `searchV2.canonicalize.test.ts` → *"Día y Noche no se
fusionan"*.

**FOLLOW_UP para S1:** v2 debería unificar la dimensión completa —variante,
momento y cualquier otro calificador comercial— en un lector propio, en vez de
depender de dos mecanismos de v1 que no comparten vocabulario.

---

## 3. Masa total del envase escrita sin separador — NO RESUELTO, medido

**El caso.** Dos ofertas reales de Ahumada:

```
"MUXOL JARABE ADULTO Ambroxol Clorhidrato 600 mg 100 ml"      → mass-only 600 mg
"Muxol Jarabe Pediátrico Ambroxol Clorhidrato 300 mg 100 ml"  → mass-only 300 mg
```

Ahí el `600 mg` es el **contenido total del frasco** (600 mg / 100 ml = 6 mg/ml =
`30 mg/5 ml`), no la dosis por unidad. Deberían caer en el concepto
`conc:ratio:6mg/ml` y `conc:ratio:3mg/ml` respectivamente. Caen en conceptos
propios (`conc:mass:600mg` y `conc:mass:300mg`), aislados.

**Por qué no se resuelve, y por qué está bien no resolverlo.** La regla R4 del
modelo aprobado prohíbe inferir una razón por yuxtaposición, y su contraejemplo
está en el **mismo catálogo, con la misma tipografía**:

```
"Ambroxol clorhidrato 30 mg 100 ml"   → es 30 mg/5 mL, NO 30 mg/100 mL
"Muxol ... Ambroxol 600 mg 100 ml"    → es 600 mg/100 mL
```

Las dos escrituras son indistinguibles sin conocimiento externo del producto.
Inferir la razón acertaría en la segunda e inventaría una potencia 20 veces menor
en la primera. **La regla R4 es correcta y S0 la respeta.**

**Impacto medido:** 2 observaciones únicas (8 filas upstream de 1.633 = 0,49 %),
ambas en el mismo caso de control de ambroxol. Es un **split**, no un merge: no
afecta ningún gate y la dirección del error es la conservadora del proyecto.

**Efecto secundario sobre la MEDICIÓN.** La regla R5 (masa vs razón se comparan
por numerador) no es invariante de escala: `mass-only 300 mg` es "compatible" con
`300 mg/100 ml` pero "incompatible" con `15 mg/5 ml`, aunque las dos razones sean
la misma concentración. Por eso el detector de falso merge usa, para el gate, la
misma semántica que `isCompatibleConcentration()` de v1 —la que produjo la línea
base "false merges = 0"—, y la variante estricta se reporta aparte. **Las dos dan
0**, así que ninguna decisión depende de esa elección.

**FOLLOW_UP:** cuando exista el registro persistido, este caso se resuelve una
vez con evidencia externa (registro ISP, ficha del laboratorio) en vez de
adivinarse en cada búsqueda.

---

## 4. Ambigüedad de potencia con concentración ausente — NO RESUELTO, medido

**El caso.** Las 3 regresiones (`MERGE_REGRESSION`) del corpus:

```
"Tocalm Ambroxol Jarabe Adulto 100 mL (Prater)"  ↔  "Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL"
"Paracetamol Gotas 15ml"                          ↔  "Paracetamol 100 mg Gotas 15 mL"
"Tapsin Infantil Suspensión 100Ml"                ↔  "Tapsin Infantil 120 mg/5 mL Suspensión Oral 100 mL"
```

En los tres, una farmacia omite la concentración. v1 fusiona porque trata la
ausencia como comodín. v2 encuentra **2 o más** conceptos candidatos (por ejemplo
ambroxol jarabe de 30 mg/5 ml **y** de 15 mg/5 ml) y **se niega a elegir**.

**Por qué no se "arregla".** Elegir entre dos candidatas es adivinar, y en este
caso concreto significa poder fusionar un jarabe de adulto con uno pediátrico. Es
la regla `ambiguous → identidad propia`, y es deliberada.

El desempate natural —"adulto" vs "pediátrico"— no está disponible: `adulto`,
`infantil` y `dia`/`noche` están en `STOP_WORDS` de v1, y `STOP_WORDS` alimenta
`matchKey()`, cuyo valor está persistido en cuatro tablas. **S0 no puede tocarlo**
(§4 del ticket). Y aunque pudiera, la variante comercial no participa —ni debe—
de la identidad del CONCEPTO (invariante 1).

**Impacto medido:** 3 pares distintos (7 instancias consulta×par) contra 639
`MERGE_FIXED`. Relación 91 a 1. (Antes de la revisión: 7 contra 748, 107 a 1.)

**Alcance real del fenómeno:** 240 ofertas (14,7 %) resuelven su concepto como
`ambiguous` — antes 212 (13,0 %). Sube porque la firma tiene más ejes y por lo
tanto más lecturas resultan incompletas. Es la métrica que hay que vigilar en S1.

**FOLLOW_UP:** es exactamente lo que resuelve el registro persistido — la
asignación se decide una vez y se recupera, en vez de recalcularse sin evidencia
en cada búsqueda (`SEARCH_ENGINE_V2.md` principio 6: *"el texto libre propone; el
registro dispone"*).

---

## 5. Techo de calidad: el vocabulario de moléculas

**598 ofertas (36,6 %) no tienen ningún principio activo demostrable** y resuelven
su concepto con un `unresolvedIdentityDiscriminator` — sin cambios respecto de la
entrega anterior: el vocabulario de moléculas no se tocó. Lo que sí cambió es que
ese token ya **no** se publica como principio activo (§8).

Causa única: `COMPOSITION_VOCABULARY` (CF-DATA-001) cubre **34 moléculas**
derivadas de una medición reproducible, no la farmacopea chilena. Una molécula
ausente produce un falso negativo conservador —el producto conserva identidad
propia y agrupa correctamente con otras ofertas del mismo nombre— pero **nunca**
una identidad inventada.

No es un defecto de la arquitectura v2: es un límite de **datos**, y el propio
CF-DATA-001 ya lo dejó registrado como `FOLLOW_UP` explícito ("ampliarlo es un
FOLLOW_UP explícito del ticket"). El script que derivó el vocabulario está en el
repositorio: regenerarlo con un corpus más amplio amplía la cobertura sin tocar
el algoritmo.

**Es la dependencia número uno de S1**, por encima de cualquier refinamiento del
motor: con el vocabulario actual, más de un tercio del catálogo no puede tener
identidad científica.

---

## 6. Deuda de arquitectura registrada

| # | Deuda | Impacto hoy | Dónde se resuelve |
|---|---|---|---|
| D1 | Sin registro persistido: la resolución depende del conjunto presente | 0,1225 % de las claves de concepto cambian entre contexto corpus y contexto consulta (2 ofertas, atribuidas una por una en `S0_METRICS.md` §8). La firma CRUDA es 100 % estable | S1 |
| D2 | Resolución O(n²) sobre firmas distintas | 12,5 ms p95 — irrelevante hoy | S1 (consulta indexada) |
| D3 | No hay subsunción encadenada entre firmas parciales | conservador: como mucho un split de más | S1 |
| D4 | La concentración de una combinación es la del primer principio activo (`ing=hidroclorotiazida+losartan\|conc=mass:50mg`) | no separa dos combinaciones que difieren solo en el segundo componente | S1 — concentración por ingrediente |
| D5 | ~~`ophthalmic` agrupa colirio y gotas óticas~~ | **RESUELTO** por el lector de forma canónica de v2 (`colirio` vs `gotas-oticas`, `supositorio` vs `ovulo`) | — |
| D6 | El fabricante solo se atribuye a la oferta cuando la tarjeta v1 tiene una sola oferta | subestima la cobertura de laboratorio | S1 — el retrieval entrega el campo por oferta |
| D7 | `sourceProductId` no lo emite ningún adaptador; se usa la URL como referencia | ninguno medido: 987 observaciones, 987 claves de oferta | S1 — campo aditivo en los 9 adaptadores |
| D8 | Registro ISP con cobertura 0 % | el eje E1 no discrimina | CF-DATA-005 (#156), independiente |

---

## 7. La firma del concepto no implementaba las 5 dimensiones del EDM — CORREGIDO

**Cómo apareció.** Revisión CTO del PR #159, punto 1.

**Qué producía sobre el corpus.** La firma usaba `ing + conc + form`, con `form`
tomando la clase gruesa de v1. Vía y Unidad Farmacéutica quedaban como atributos
publicados, fuera de la identidad. Resultado medido: **45 de 303 conceptos
agrupaban más de una forma farmacéutica fina** y **13 mezclaban más de una unidad
farmacéutica**.

```
ing=amoxicilina|conc=conc:mass:500mg|form=solid-oral
   araucomed    "Amoxicilina 500 mg x 21 cápsulas. (Mintlab)"
   cruz-verde   "Amoxicilina 500 mg 21 Cápsulas"
   sermecoop    "Amoxicilina 500mg 21 Comprimidos"      ← comprimido, no cápsula
```

El EDM enumera Comprimido y Cápsula como Formas Farmacéuticas distintas. Lo mismo
con Dolorub 5 % crema y Dolorub 5 % gel dérmico.

**Corrección.** `CanonicalDosageForm` (más fina que `dosageFormClass`, que no se
tocó), más `route` y `unit` como ejes propios de `conceptSignature()`. Qué se
separa y qué no está decidido con evidencia del corpus, no por aplicar la
enumeración del EDM al pie de la letra: separar jarabe de suspensión y de
solución habría partido 29 conceptos donde las farmacias usan los tres términos
para el mismo artículo. Detalle completo en
`CANONICAL_IDENTITY_IMPLEMENTATION.md` §1.1.

**Resultado medido.** comprimido/cápsula **13 → 0**, crema/gel **3 → 0**,
unidades mezcladas **13 → 0**. Conceptos 303 → 316. Gates A/B/C sin cambio.

---

## 8. La cabecera no resuelta estaba tipada como principio activo — CORREGIDO

**Cómo apareció.** Revisión CTO del PR #159, punto 2.

**Qué producía.** `readActiveIngredients()` devolvía la cabecera dentro de
`ActiveIngredient[]` con evidencia `"unresolved-head"`, y la firma la usaba como
`ing=tapsin` con `known=true`. "Tapsin Forte" no demuestra que "tapsin" sea una
molécula, pero el tipo lo afirmaba y el token llegaba a `canonicalName`.

**Segundo camino, el mismo defecto.** La cabecera también entraba con evidencia
`"combination"` cada vez que `combinationKey()` reconocía una asociación. Sobre
el corpus eso convertía la MARCA en molécula en **31 de los 32 nombres** que
pasaban por esa rama:

```
"Tapsin Duo (B) Paracetamol / Ibuprofeno 12 Comprimidos"
   ANTES  ing=ibuprofeno+paracetamol+tapsin
   AHORA  ing=ibuprofeno+paracetamol
```

Afectaba también a Hyzaar, Losapres, Simperten-D, Ambilan, Clavinex, Adorlan,
Dicasen, Dolodrin, Kitadol, Pironal, Rigotax-D y Remitex-D.

**Corrección.** `ActiveIngredient.evidence` ya no admite `"unresolved-head"`; la
cabecera vive en `unresolvedIdentityDiscriminator` y firma en un eje propio
(`disc`), siempre declarado. Para la rama de combinación, la cabecera solo se
acepta cuando la tipografía la coloca inmediatamente a la izquierda del
separador. Los 2 casos donde la cabecera SÍ es el primer principio activo
—`Tramadol Clorhidrato/Paracetamol` y `Lorsartán Potásico / Hidroclorotiazida`—
se conservan: perderlos habría dejado una asociación indistinguible del
monofármaco, un falso merge con riesgo clínico.

**Resultado medido.** 0 de 316 conceptos afirman un principio activo y un
discriminante a la vez. 175 conceptos declaran
`identityStatus: "unresolved-ingredient"`. 0 nombres canónicos presentan el
discriminante en la posición de la composición. Las protecciones de
CF-SEARCH-001 sobre Tapsin siguen verdes.

---

## 9. Las claves de S0 ocupaban el espacio de nombres `CFM-` — CORREGIDO

**Cómo apareció.** Revisión CTO del PR #159, punto 3.

**Qué producía.** Los identificadores se emitían como `CFM-C-…`, `CFM-P-…`,
`CFM-M-…`, `CFM-O-…` y los campos se llamaban `conceptId`, `presentationId`,
`productId`, `offerId` — indistinguibles de los identificadores PERMANENTES que
el EDM define. Pero son *content-addressed* sobre la firma resuelta: rotan cuando
la firma cambia, que es exactamente lo que un `CFM-CONCEPT-ID` no puede hacer.

**Corrección.** Prefijo `PROV-`, campos `provisional*Key`, función
`provisionalKey()`. La frontera con el registro persistido de S1 está tabulada en
`CANONICAL_IDENTITY_IMPLEMENTATION.md` §2.

**Resultado medido.** 0 claves con prefijo `CFM-` emitidas por el motor.

---

## 10. Una asociación comparte concepto con el monofármaco — CORREGIDO

**Clasificación: `SEMANTIC_FALSE_MERGE_AT_CONCEPT_LEVEL`.**

**Cómo apareció.** Al reejecutar el corpus tras las correcciones de §7 a §9.

### Reproducción sobre el corpus congelado

Tres ofertas reales, dos farmacias, un solo Concepto Farmacéutico:

```
PROV-C-7rofi0lnpsaix7r5mk5lu9rbe
  ing=diclofenaco | disc=none | conc=conc:mass:25mg | form=comprimido | route=oral | unit=comprimido
  resolución: complete   ·   confianza: high

   dr-simi     "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos"     ← ASOCIACIÓN
   dr-simi     "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico" ← MONOFÁRMACO
   cruz-verde  "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos"                     ← MONOFÁRMACO
```

Lectura del nombre de Adorlan **antes** de la corrección, eje por eje:

| Atributo | Valor leído | Correcto |
|---|---|:-:|
| `rawName` | `Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos` | — |
| `activeIngredients` | `[diclofenaco:vocabulary]` | **NO** — falta tramadol |
| `unresolvedIdentityDiscriminator` | `null` | sí (hay ingrediente demostrado) |
| `concentration` | `mass-only conc:mass:25mg` | parcial (ver D4) |
| `canonicalDosageForm` | `comprimido` | sí |
| `route` | `oral` | sí |
| unidad farmacéutica | `comprimido` | sí |
| firma CRUDA | `ing=diclofenaco\|disc=none\|conc=conc:mass:25mg\|form=comprimido\|route=oral\|unit=comprimido` | **NO** |
| clave provisional resuelta | `PROV-C-7rofi0lnpsaix7r5mk5lu9rbe` (compartida con Lertus) | **NO** |

El monofármaco con el que colisionaba es **Lertus 25 mg comprimidos**, de Dr. Simi
y Cruz Verde: la misma clave, la misma firma, resolución `complete` y confianza
`high`. Una asociación con **tramadol —un opioide—** declarada como el mismo
Concepto Farmacéutico que un AINE solo, con la máxima confianza que el modelo
puede emitir.

### Causa raíz — tres eslabones, ninguno un descuido de código

1. `tramadol` no está en `COMPOSITION_VOCABULARY` (las 34 moléculas de
   CF-DATA-001, derivadas por frecuencia sobre 3.697 ofertas).
2. `combinationKey()` (v1) devuelve `null`: exige un separador `+`/`/`
   inmediatamente seguido de letras —"25/25" tiene un dígito a la derecha— o una
   razón masa/masa con unidad en el denominador —"25/25 diclofenaco" no la
   tiene—. Las dos restricciones son correctas y están justificadas contra datos
   reales en `matching.ts`; esta escritura simplemente no cae en ninguna.
3. **El defecto de modelo.** Al fallar las dos únicas fuentes de evidencia, el
   conjunto quedaba en `{diclofenaco}` — y el eje `ing` tenía solo dos estados,
   conocido o desconocido. Con dos estados, **un conjunto INCOMPLETO es
   literalmente indistinguible de un conjunto COMPLETO de un elemento**. El motor
   no tenía forma de representar *"sé que hay más de un componente activo, pero
   no sé nombrarlos todos"*.

### Corrección

`packages/domain/src/searchV2/compositionReader.ts`, un **lector de composición
propio de v2** que responde, sobre el texto de un nombre y sin mirar ninguna otra
oferta, qué moléculas declara y cuántos componentes afirma tener. Cuatro fuentes
de evidencia acumulativas, ninguna capaz de inventar una molécula sola:
vocabulario, `combinationKey()` de v1 sin modificar, **posición estructural**
(el patrón `<molécula> <dosis>` repetido, que es lo que hace legible "diclofenaco
25 mg tramadol 25 mg" sin un solo separador) y **aridad tipográfica** (una razón
de dosis masa/masa declara cuántos componentes hay sin nombrar ninguno).

El eje `ing` pasa de dos estados a tres —COMPLETO, PARCIAL, DESCONOCIDO— con un
comparador propio (`compareIngredients`) que impide que un conjunto parcial se
subsuma dentro de un conjunto completo más chico.

**`combinationKey()` no se tocó.** Alimenta `presentationKey` y, por su
intermedio, los slugs de Web: cambiarlo movería identidad de v1 en producción,
inmutable en S0 (§4 del ticket). Además devuelve UN token, y este problema
necesita el CONJUNTO y su CARDINALIDAD.

### Resultado medido

```
PROV-C-7w1hzdjfpvjjozwjs7r1yhesl   ing=diclofenaco+tramadol|…   ← Adorlan (3 escrituras, 3 farmacias)
PROV-C-7rofi0lnpsaix7r5mk5lu9rbe   ing=diclofenaco|…            ← Lertus  (2 farmacias)
```

- **Colisiones monofármaco/asociación: 0** sobre 312 conceptos.
- Las tres escrituras de Adorlan que declaran composición —Dr. Simi sin
  separador, Salcobrand y EcoFarmacias con `/`— convergen ahora en **un solo
  concepto**, que antes eran dos.
- Los dos Lertus monofármaco siguen agrupando entre sí, con su clave intacta.
- 61 conceptos del corpus declaran asociación; 137 ofertas; 54 con lectura
  parcial (el nombre declara más componentes de los que se pudieron nombrar).
- Gates A/B/C sin cambio: 100 % / 0 / 0.

**Tests que lo fijan:** `searchV2.compositionReader.test.ts`, 55 casos.

---

## 11. Una molécula NEGADA por el nombre, afirmada como presente — CORREGIDO

**Clasificación: `SEMANTIC_FALSE_MERGE_AT_CONCEPT_LEVEL`** (misma clase que §10,
leída al revés).

**Cómo apareció.** Al reejecutar el corpus con `cafeina` incorporada al
vocabulario de moléculas de v2. **No lo detectó ninguna métrica**: lo destapó la
revisión manual de los conceptos que declaran asociación. Ver §12, que es
exactamente la consecuencia que se saca de eso.

**Qué producía.**

```
ing=cafeina | disc=none | conc=conc:mass:500mg | form=comprimido | …
   ahumada    "Tapsin Puro SIN Cafeina 500 mg x 24 Comprimidos"      ← SIN cafeína
   araucomed  "Tapsin Dolor de Cabeza CON cafeína x 12 comprimidos"  ← CON cafeína
```

Y, peor todavía, `"Tapsin Puro Sin Cafeina Paracetamol 500 mg 16 Comprimidos"` se
leía como la **asociación paracetamol+cafeína**, que es lo contrario de lo que el
nombre dice.

**Causa raíz.** La regla de honestidad estaba escrita en una sola dirección
—"no inventes una molécula que el nombre no nombra"— y le faltaba su recíproca:
**nombrar una molécula no demuestra que esté**. Un nombre puede nombrarla
justamente para decir que NO está.

**Corrección.** `negatedMolecules()` en `compositionReader.ts`: la gramática de
la negación (`sin`, `libre de`) se resuelve ANTES que las cuatro fuentes de
evidencia, y ninguna puede afirmar una molécula negada. Alcance deliberadamente
corto para no negar de más: la primera molécula tras el marcador, más las
encadenadas con coordinación negativa explícita (`ni`). La yuxtaposición no
extiende la negación — "sin cafeína **paracetamol** 500 mg" niega `cafeina`,
nunca `paracetamol`.

**Resultado medido.** `negatedIngredientAssertions` **0/1.633 ofertas**.
`Tapsin Puro Sin Cafeina Paracetamol 500 mg` → `ing=paracetamol`, y agrupa con
los demás paracetamol 500 mg. `Tapsin Puro Sin Cafeina 500 mg x 24` → sin
ingrediente demostrado, resuelve por `disc=tapsin`, que es lo conservador.

### 11-bis. Un separador no demuestra que los dos lados sean moléculas — CORREGIDO

Mismo hallazgo, misma revisión manual. `combinationKey()` reconoce coordinación
tipográfica, no farmacología, y sobre el corpus eso producía:

```
"…Polvo para Soluc.Oral 1 Sobre Sabor Limón / Miel / Jengibre"  → ing=…+limon+miel
"Zomel HP Triterapia"                                            → ing=zomel+triterapia
```

`limón` y `miel` son saborizantes, `triterapia` es un régimen posológico y
**`zomel` es una MARCA dentro de `ActiveIngredient[]`** — exactamente el defecto
que §8 corrigió para `tapsin`, por otro camino.

**Corrección.** La rama de combinación exige ahora **corroboración del hermano**,
la misma regla que ya gobernaba la promoción por posición estructural: el par se
acepta solo si al menos uno de sus dos miembros está en un vocabulario de
moléculas. Los pares legítimos se conservan enteros porque en todos hay un lado
demostrado (`paracetamol` sostiene a `tramadol`, `hidroclorotiazida` sostiene a
`lorsartan` —error tipográfico de la farmacia—, `clavulanico` sostiene a
`amoxicilina`).

**Resultado medido.** El censo de tokens afirmados como principio activo sobre
las 1.633 ofertas pasa de 26 tokens distintos a **22, y los 22 son moléculas
reales**. Desaparecen `limon`, `miel`, `triterapia` y `zomel`; no se pierde
ninguna molécula legítima.

---

## 12. Lo que el Gate C no puede ver — métrica propuesta para S1

**El hallazgo de gobierno de esta iteración, y es más importante que cualquiera
de los defectos de arriba.**

Durante todo el tiempo en que Adorlan compartió concepto con Lertus, **el Gate C
de producto estuvo en 0**. No por casualidad ni por un error de medición: Gate C
mide contradicciones **intra-producto**, y el falso merge vivía un nivel más
arriba, en el **concepto**, entre productos comerciales distintos (`Adorlan` vs
`Lertus`) y presentaciones distintas (10 vs 20 comprimidos). La marca separaba
los productos, así que ninguna comparación de precios visible al usuario los
fusionaba — y los tres gates de S0 seguían verdes mientras el concepto
farmacológico era incorrecto.

> **Los tres gates de S0 son necesarios y no son suficientes: ninguno mira la
> coherencia SEMÁNTICA de un concepto.**

### Métrica propuesta: `Concept Semantic Collision Rate`

Implementada, medida y publicada en esta entrega con estado
**`REPORTED_NOT_GATED`**. No se agregó a `finalVerdict`: convertir una métrica en
gate de S0 es una decisión de dirección CTO/Product, no del harness — §16 del
ticket fija tres gates y esta entrega no los cambia unilateralmente.

Cuenta un concepto como colisión cuando agrupa ofertas cuyos NOMBRES se
contradicen. Tres componentes, y hacen falta los tres porque cada uno ve algo que
los otros dos no:

| Componente | Qué detecta | Valor medido |
|---|---|---:|
| `monotherapyAssociationCollisions` | contradicción de **cardinalidad**: una oferta declara asociación y otra monofármaco en el mismo concepto | **0** |
| `conceptIngredientContradictions` | contradicción de **identidad**: dos ofertas del mismo concepto declaran moléculas donde ninguna es subconjunto de la otra | **0** |
| `negatedIngredientAssertions` | el motor afirma una molécula que el propio nombre **niega** | **0** |

```
Concept Semantic Collision Rate = 0/312 conceptos = 0,000000
Umbral propuesto para S1: = 0
```

**El clasificador que alimenta la métrica está implementado APARTE del lector que
asigna identidad**, con código distinto y derivando la evidencia otra vez desde
el nombre. Si usara `readIngredientComposition()` mediría su propia coherencia y
daría 0 por construcción.

**Y aun así no basta, y eso hay que decirlo.** Los defectos de §11 fueron
encontrados por revisión manual, no por la métrica: la primera versión solo medía
cardinalidad, y "SIN cafeína" y "CON cafeína" declaran el mismo conjunto de
moléculas para cualquier clasificador que ignore la negación. Los otros dos
componentes se agregaron **después** de ese hallazgo, y por eso están. La lección
es la que justifica la métrica entera: una clase de defecto que ninguna métrica
mira puede convivir indefinidamente con todos los gates en verde.

**FOLLOW_UP para dirección CTO/Product:** decidir si `Concept Semantic Collision
Rate = 0` se adopta como cuarto gate en S1. Recomendación técnica: sí, con los
tres componentes, y con la regla de que cada defecto semántico nuevo que se
encuentre por revisión manual agregue su propio componente en vez de quedar como
caso suelto en un test.

**Nombres truncados — riesgo residual explícito.** 63 ofertas del corpus (todas
de EasyFarma, cuyo scraping WordPress corta el título) llegan con el nombre
incompleto. La métrica **no puede pronunciarse** sobre ellas: sin el final del
nombre no hay evidencia de composición que medir, así que un nombre truncado
nunca declara monofármaco (ausencia de evidencia no es evidencia de ausencia) y
se cuentan aparte. 22 de esas filas se resuelven por subsunción dentro de otra
firma: es el único camino por el que un nombre cortado podría caer en un concepto
que no le corresponde, y por eso se listan enteras en `analysis/v2-metrics.json`
(`truncatedNamesSubsumedSamples`) en vez de resumirse en un porcentaje.

---

## 13. Deuda residual de esta iteración

**La concentración de una asociación sigue siendo la del primer componente
escrito** (deuda D4 de §6, sin cambio). `CanonicalMedicationConcept.concentration`
admite UNA evidencia, y "Diclofenaco 25 mg + Tramadol 25 mg" tiene dos potencias.
Modelar bien la concentración de una asociación es un cambio del EDM y **no se
hace en S0**.

Lo que sí se hizo, sin romper el contrato existente:

- `concentration` conserva exactamente la semántica que ya tenía;
- se agrega `ingredientStrengths: IngredientStrength[]` —**campo aditivo**— que
  preserva la dosis por componente para el análisis de S1;
- **la seguridad no depende de ninguno de los dos**: lo que impide que una
  asociación se confunda con un monofármaco es el CONJUNTO de principios activos
  y su CARDINALIDAD DECLARADA en el eje `ing`, no la concentración.

`ingredientStrengths` **no participa de ninguna firma de identidad**. Es
evidencia conservada, no un eje.

**FOLLOW_UP para S1:** concentración por ingrediente en el EDM, que cierra D4 y
permite distinguir dos asociaciones que difieren solo en la dosis del segundo
componente.
