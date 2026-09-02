# CF-SEARCH-011 — Defectos encontrados por S0

S0 no es un examen que haya que aprobar: es una validación de arquitectura. Este
documento registra **todo** lo que la ejecución sobre datos reales rompió,
incluidos los defectos del propio modelo v2 y los que S0 no puede resolver.

Los dos primeros son defectos **del motor v2** que el corpus destapó y que se
corrigieron estructuralmente. Los dos siguientes son **limitaciones que S0 no
resuelve** y que quedan medidas.

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

**Impacto medido:** 3 pares distintos (7 instancias consulta×par) contra 748
`MERGE_FIXED`. Relación 107 a 1.

**Alcance real del fenómeno:** 212 ofertas (13,0 %) resuelven su concepto como
`ambiguous`. Es la métrica que hay que vigilar en S1.

**FOLLOW_UP:** es exactamente lo que resuelve el registro persistido — la
asignación se decide una vez y se recupera, en vez de recalcularse sin evidencia
en cada búsqueda (`SEARCH_ENGINE_V2.md` principio 6: *"el texto libre propone; el
registro dispone"*).

---

## 5. Techo de calidad: el vocabulario de moléculas

**598 ofertas (36,6 %) no tienen ningún principio activo demostrable** y resuelven
su concepto con una cabecera `unresolved-head`.

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
| D1 | Sin registro persistido: la resolución depende del conjunto presente | 0,12 % de los `conceptId` cambian entre contexto corpus y contexto consulta | S1 |
| D2 | Resolución O(n²) sobre firmas distintas | 11,3 ms p95 — irrelevante hoy | S1 (consulta indexada) |
| D3 | No hay subsunción encadenada entre firmas parciales | conservador: como mucho un split de más | S1 |
| D4 | La concentración de una combinación es la del primer principio activo (`ing=hidroclorotiazida+losartan\|conc=mass:50mg`) | no separa dos combinaciones que difieren solo en el segundo componente | S1 — concentración por ingrediente |
| D5 | `ophthalmic` agrupa colirio y gotas óticas (heredado de `dosageFormClass` de v1) | sin casos en el corpus | lector de forma propio de v2 |
| D6 | El fabricante solo se atribuye a la oferta cuando la tarjeta v1 tiene una sola oferta | subestima la cobertura de laboratorio | S1 — el retrieval entrega el campo por oferta |
| D7 | `sourceProductId` no lo emite ningún adaptador; se usa la URL como referencia | ninguno medido: 987 observaciones, 987 `offerId` | S1 — campo aditivo en los 9 adaptadores |
| D8 | Registro ISP con cobertura 0 % | el eje E1 no discrimina | CF-DATA-005 (#156), independiente |
