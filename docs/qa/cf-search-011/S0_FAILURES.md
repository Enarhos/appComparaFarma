# CF-SEARCH-011 — Defectos encontrados por S0

S0 no es un examen que haya que aprobar: es una validación de arquitectura. Este
documento registra **todo** lo que la ejecución sobre datos reales rompió,
incluidos los defectos del propio modelo v2 y los que S0 no puede resolver.

Los dos primeros son defectos **del motor v2** que el corpus destapó y que se
corrigieron estructuralmente. Los dos siguientes son **limitaciones que S0 no
resuelve** y que quedan medidas.

Los §7 a §9 son los **tres defectos de contrato semántico** que la revisión CTO
del PR #159 identificó, con su corrección y la evidencia sobre el corpus. El §10
es un defecto residual que la reejecución destapó y que **no** se corrige en S0.

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

## 10. Una asociación comparte concepto con el monofármaco — RESIDUAL, NO CORREGIDO

**Cómo apareció.** Al reejecutar el corpus tras las correcciones anteriores.

**Qué produce.**

```
PROV-C-7rofi0lnpsaix7r5mk5lu9rbe   ing=diclofenaco|conc=mass:25mg|form=comprimido
   dr-simi     "Adorlan 25/25 diclofenaco 25 mg tramadol 25 mg 10 comprimidos"  ← ASOCIACIÓN
   cruz-verde  "Lertus Diclofenaco Sodico 25 mg 20 Comprimidos"                 ← MONOFÁRMACO
   dr-simi     "Lertus diclofenaco 25 mg 20 comprimidos con recubrimiento entérico"
```

**Causa raíz.** `combinationKey()` (v1) solo reconoce una asociación por
adyacencia a un separador o por una razón de dosis masa/masa. "diclofenaco 25 mg
tramadol 25 mg" no tiene ninguna de las dos, así que tramadol nunca se extrae y
la oferta queda con `ing=diclofenaco`.

**Por qué no se corrige en S0.** `combinationKey()` es v1, su valor alimenta
`presentationKey` y los slugs de Web, y v1 es inmutable en S0 (§4 del ticket).
Corregirlo requiere un lector de combinaciones propio de v2.

**Alcance y severidad.** Es un falso merge a nivel de **CONCEPTO**, no de
producto: la marca separa los productos (`Adorlan` vs `Lertus`), así que ninguna
comparación de precios visible al usuario fusiona los dos. Gate C, que mide
contradicciones intra-producto, sigue en 0. **No es una regresión de esta
revisión**: existía igual en la entrega anterior.

**FOLLOW_UP:** lector de combinaciones propio de v2, sin adyacencia obligatoria
al separador, para S1.
