# CF-SEARCH-011 — Identidad canónica v2, implementada

Proyección técnica del Enterprise Data Model aprobado en ADR-0005. **No es un
modelo alternativo**: la jerarquía, los nombres y la semántica salen de
`docs/enterprise/ENTERPRISE_DATA_MODEL.md` (EDM-100 / EDM-200) y de
`docs/qa/cf-search-010/CANONICAL_IDENTITY_MODEL.md`.

Código: `packages/domain/src/searchV2/`.

**Revisado tras la revisión CTO del PR #159** (2026-09-02). Los tres bloqueantes
—granularidad de la Forma Farmacéutica y ausencia de Vía y Unidad en la firma,
cabecera no resuelta tipada como principio activo, y claves de S0 ocupando el
espacio de nombres `CFM-`— están corregidos. Las secciones afectadas indican qué
decía antes y por qué cambió.

---

## 1. Las cuatro entidades

```
provisionalConceptKey       PROV-C-…
   principios activos + discriminante + concentración + forma + vía + unidad
provisionalPresentationKey  PROV-P-…
   concepto + cantidad de unidades + volumen de envase
provisionalProductKey       PROV-M-…
   presentación + ISP + marca + variante + momento + laboratorio
provisionalOfferKey         PROV-O-…
   farmacia + referencia de origen
```

Los nombres **no** son `CFM-*` y no es un descuido: ver §2.

Las cinco invariantes del modelo aprobado se cumplen **por construcción**, no por
disciplina: son las firmas las que producen los identificadores, y ninguna firma
contiene consulta, ranking ni precio.

| Invariante | Cómo se garantiza |
|---|---|
| El concepto no depende de marca, laboratorio, farmacia ni precio | `conceptSignature()` tiene 6 ejes y ninguno es comercial |
| La presentación no depende de marca ni de laboratorio | `presentationSignature()` = concepto + cantidad + volumen |
| Solo el producto depende de marca y fabricante | `productSignature()` es el único nivel con ejes comerciales |
| Solo la oferta depende de la farmacia | `offerSignature()` es el único que la nombra |
| **Ninguno depende de la consulta ni del ranking** | Ninguna firma recibe la query; hay test que lo verifica |

### 1.1 Las cinco dimensiones del Concepto Farmacéutico (EDM-100)

El EDM define el Concepto Farmacéutico como la combinación única de **Principio
Activo + Concentración + Forma Farmacéutica + Vía de Administración + Unidad
Farmacéutica**. La firma anterior usaba tres ejes (`ing + conc + form`) y dejaba
vía y unidad como atributos publicados. Ya no.

| Eje | Dimensión EDM | Qué cambió |
|---|---|---|
| `ing` | Principio Activo | Solo principios activos DEMOSTRADOS. Vacío ⇒ eje DESCONOCIDO |
| `disc` | — (eje de seguridad) | **Nuevo.** Discriminante de identidad no resuelta; ver §1.2 |
| `conc` | Concentración | Sin cambios (tres niveles de evidencia) |
| `form` | Forma Farmacéutica | **Ahora usa `CanonicalDosageForm`**, no la clase gruesa de v1 |
| `route` | Vía de Administración | **Nuevo eje** |
| `unit` | Unidad Farmacéutica | **Nuevo eje** |

#### Por qué la vía SÍ debe participar, aunque hoy se derive de la forma

El argumento original era formalmente correcto: sobre `DosageFormClass`, la vía
es una **función total** de la forma (`ADMINISTRATION_ROUTE_BY_FORM` mapea las 8
clases a exactamente una vía cada una), de modo que añadirla como eje habría
producido la misma partición de conceptos y cero poder discriminante.

Pero eso describe una limitación del modelo, no un contrato de dominio. Dos
razones medibles:

1. **Una misma forma admite más de una vía en la realidad.** El propio EDM
   enumera "Intravenosa" e "Intramuscular" como vías distintas, y las dos se
   administran por ampolla; una "solución" puede ser oral, tópica u oftálmica.
2. **La derivación de v1 produce afirmaciones FALSAS.** v1 clasifica el óvulo
   como `suppository` (⇒ rectal) y las gotas óticas como `ophthalmic`
   (⇒ oftálmica). Un óvulo no se administra por vía rectal. La forma canónica
   separa `ovulo` → `vaginal` y `gotas-oticas` → `otic`.

La vía se lee además del texto cuando el nombre la declara ("Solución **Oral**",
"Gel **Dérmico**") y la forma no permite derivarla. Solo en ese caso, y es la
dirección conservadora: convertir un eje desconocido en conocido puede añadir
incompatibilidades (más splits) pero nunca habilitar una fusión nueva.

#### Por qué la unidad farmacéutica SÍ debe participar

El argumento original —"comprimido" y "tableta" son la misma unidad escrita por
dos farmacias, y "Omeprazol 20 mg x 30" no la declara, así que usarla como eje
reintroduciría fragmentación— parte de dos observaciones ciertas y de las que no
se sigue la conclusión:

- **la sinonimia ya la resuelve el lector**: `tableta`, `tab`, `gragea` y
  `pastilla` normalizan a `comprimido`, y `perla` a `capsula`. El eje compara
  unidades canónicas, no texto crudo;
- **la ausencia la resuelve el tercer estado**: un nombre que no declara unidad
  tiene el eje DESCONOCIDO, y un eje desconocido es *subsumible* bajo la única
  firma completa compatible. No parte nada.

El argumento excluía una dimensión razonando con la aritmética de dos estados de
v1 dentro de un motor que tiene tres. Medido: conceptos que mezclaban más de una
unidad farmacéutica, **13 → 0**.

#### Forma Farmacéutica: qué se separa y qué no, con evidencia

`dosageFormClass()` es deliberadamente gruesa y sirve para lo que fue diseñada,
pero **no es** la Forma Farmacéutica del EDM, que enumera "Comprimido, Cápsula,
Jarabe, Suspensión, Crema, Solución, Ampolla" como valores distintos. Medido
sobre el corpus congelado: **45 de 303 conceptos agrupaban más de una forma
fina**. Su clasificación decide el diseño:

| Mezcla | Conceptos | Decisión | Evidencia |
|---|---:|---|---|
| comprimido / cápsula | 13 | **SE SEPARA** | El EDM las enumera aparte y ninguna fuente las usa como sinónimos |
| crema / gel | 3 | **SE SEPARA** | Ídem — son vehículos distintos |
| jarabe / suspensión / solución / gotas / polvo / sobre / granulado | 29 | **NO se separa** | El corpus prueba sinonimia real |

El caso que decide la segunda fila: **Amoxicilina 250 mg/5 mL 60 mL** es "Jarabe"
en Salcobrand y Cruz Verde, "susp. Frasco" en Ahumada y "Polvo Para Suspensión
Oral" en Dr. Simi. Es **un** artículo descrito desde tres ángulos. Lo mismo con
"Solución Oral Para Gotas" vs "Oral Gotas" (Rigotax 10 mg/mL 15 mL) y con
"Flector Granulado 50mg x10sobres" vs "Flector 50 mg x 10 Sobres Polvo Granulado
Para Solucion Oral".

Aplicar la enumeración literal del EDM a los líquidos habría producido un falso
split masivo sobre una distinción que este catálogo no declara de forma fiable.
La dimensión que sí separa un sobre de polvo de un frasco de jarabe es la
**Unidad Farmacéutica** (`sobre`) — que es un eje propio, y es exactamente para
eso que el EDM la enumera aparte de la Forma Farmacéutica.

Resultado tras el cambio: conceptos que mezclan comprimido/cápsula **0**,
crema/gel **0**, unidades **0**. Los 30 que siguen agrupando descriptores
líquidos lo hacen por la decisión documentada arriba.

### 1.2 `UNKNOWN` != `ACTIVE_INGREDIENT`

Hasta la revisión, cuando no se podía demostrar ninguna molécula el lector
devolvía la **cabecera del nombre** dentro del array de `ActiveIngredient[]`, con
evidencia `"unresolved-head"`, y la firma la usaba como `ing=tapsin` con
`known=true`. La marca era honesta, pero el tipo afirmaba lo contrario: "Tapsin
Forte" no demuestra que "tapsin" sea una molécula, y ese token llegaba a
`canonicalName`.

Ahora son **dos cosas separadas**:

| | `activeIngredients` | `unresolvedIdentityDiscriminator` |
|---|---|---|
| Qué es | afirmación farmacológica | hecho textual |
| Evidencias | `vocabulary`, `combination` | — |
| Entra en `canonicalName` como composición | sí | **nunca** |
| Cuenta como cobertura de principio activo | sí | **no** |
| Eje de la firma | `ing` (desconocido si vacío) | `disc` (siempre declarado) |

La protección contra merges inseguros **no se debilita**, porque `disc` está
siempre declarado —vale la cabecera, o `none` cuando sí hay principios activos
demostrados— y dos valores declarados y distintos son *incompatibles*:

```
disc=tapsin  vs  disc=none     → incompatible → Tapsin nunca cae dentro del
                                                 concepto "paracetamol 500 mg"
disc=tapsin  vs  disc=muxol    → incompatible → dos desconocidos distintos
                                                 tampoco se fusionan
disc=tapsin  vs  disc=tapsin   → equal        → dos ofertas de Tapsin Forte de
                                                 dos farmacias siguen agrupando
```

El concepto declara además `identityStatus: "resolved" | "unresolved-ingredient"`,
así que "no sé qué molécula es" es un estado explícito del modelo y no algo que
haya que deducir mirando un array vacío.

**Un segundo camino producía el mismo defecto y también se cerró.** La cabecera
entraba como principio activo con evidencia `"combination"` cada vez que
`combinationKey()` reconocía una asociación. Sobre el corpus eso convertía la
MARCA en molécula en **31 de los 32 nombres** que pasaban por esa rama:
`Tapsin Duo (B) Paracetamol / Ibuprofeno` producía
`ing=ibuprofeno+paracetamol+tapsin`. Ahora la cabecera solo se acepta cuando la
tipografía la coloca **inmediatamente a la izquierda del separador**, espejo
exacto de cómo `combinationKey()` toma el segundo por la derecha.

La condición no se puede reemplazar por "no agregues nada si el vocabulario ya
encontró algo": los otros 2 casos del corpus son `Tramadol
Clorhidrato/Paracetamol` y `Lorsartán Potásico / Hidroclorotiazida` —tramadol no
está en el vocabulario, "Lorsartán" es un error tipográfico de la farmacia— donde
la cabecera SÍ es el primer principio activo. Perderlas dejaría
`ing=paracetamol` e `ing=hidroclorotiazida`: una asociación indistinguible del
monofármaco, que es un falso merge con riesgo clínico.

### Desviación deliberada respecto del boceto de CF-SEARCH-010

El boceto proponía `offerId = productId + pharmacyId + channel`. Acá la clave de
la oferta depende **únicamente de la observación** (farmacia + referencia de
origen + nombre crudo), nunca de la clave del producto.

Motivo: si la clave de la observación dependiera del resultado de la resolución,
mejorar la resolución rotaría las claves de ofertas que no cambiaron — y una
observación no deja de ser la misma observación porque el motor aprenda a qué
producto pertenece. `provisionalProductKey` viaja como clave foránea. El propio
documento declara que los nombres "no son un contrato cerrado".

---

## 2. Las claves — provisional vs persistente

`PROV-{C|P|M|O}-<25 caracteres base36>`, derivadas de un hash de 128 bits en
JavaScript puro (dos flujos FNV-1a de 64 bits con bases de desplazamiento
distintas) sobre `prefijo + firma`.

**Por qué 128 bits y no 64:** v1 usa FNV-1a de 64 bits truncado para los slugs, y
CF-SEARCH-010 midió **4 pares de productos con hash compartido** sobre 1.634
ofertas. Una colisión en un identificador de IDENTIDAD no es una URL ambigua: es
una fusión silenciosa de dos medicamentos distintos. Medido sobre el corpus
completo: **0 colisiones** (dos firmas distintas nunca compartieron ID).

**Por qué no `node:crypto`:** `@comparafarma/domain` se bundlea con Metro para
`mobile/`, donde `node:crypto` no existe.

### Por qué el prefijo es `PROV-` y no `CFM-`

El EDM exige que `CFM-CONCEPT-ID` sea **permanente** y no cambie nunca: es lo que
permite que un concepto conserve su identidad cuando se corrige un atributo o se
enriquece su evidencia. Una clave derivada del contenido hace exactamente lo
contrario — si la firma cambia, la clave cambia.

Las dos cosas no pueden compartir espacio de nombres sin que alguien acabe
persistiendo un hash creyendo que es un ID. Por eso, desde la revisión del
PR #159:

- el prefijo emitido es `PROV-`, y el motor no produce ninguna clave `CFM-*`
  (verificado sobre el corpus: **0**);
- los campos se llaman `provisionalConceptKey`, `provisionalPresentationKey`,
  `provisionalProductKey`, `provisionalOfferKey` — no `conceptId` ni `productId`;
- la función es `provisionalKey()`, no `canonicalId()`.

**Qué es entonces esta clave:** el subrogado de una FIRMA. Determinista,
reproducible y auditable sin base de datos, que es lo único que los gates de S0
necesitan. Y la firma de la que deriva es la **resuelta**, así que hereda la
contextualidad de la resolución: medido, 2 de 1.633 ofertas cambian de clave
entre el corpus completo y la consulta aislada (`S0_METRICS.md` §8).

### La frontera con el registro persistido de S1

| | S0 (hoy) | S1 (registro persistido) |
|---|---|---|
| Conjunto de anfitrionas | el corpus visible en esa ejecución | el registro, estable e independiente de la consulta |
| Clave | `PROV-*`, content-addressed sobre la firma resuelta | `CFM-*`, subrogado persistido asignado una vez |
| Permanencia | ninguna: rota si la firma cambia | permanente por contrato |
| Quién puede acuñar | cualquier firma, incluidas las parciales | **solo una firma COMPLETA** |
| Observación parcial | se subsume o se aísla, y acuña clave igual | resuelve contra el registro o queda sin resolver; **nunca acuña** |

**Ningún consumidor debe persistir ni exponer una clave `PROV-*`.** No están
reexportadas desde el barrel de `@comparafarma/domain` y `mobile/`, `web/` y
`api/` no pueden importarlas.

---

## 3. El mecanismo: resolución por subsunción

Es el **único** mecanismo de resolución, y se aplica igual en los tres niveles.

### El problema que resuelve

v1 tiene dos estados por eje: igual o distinto. Con dos estados,
"Ambroxol 30 mg 100 ml" (que no declara la razón) y "Ambroxol 30 mg/5 ml Jarabe
100 ml" (que sí) son "distintos", y la única salida es fragmentar. La alternativa
—tratar la ausencia como comodín y fusionar— produce falsos merges, y el proyecto
ya decidió que el falso merge es riesgo clínico (`PRODUCT_IDENTITY.md` §10).

### El tercer estado

```ts
type AxisComparison = "equal" | "incompatible" | "subsumable";
```

Una firma PARCIAL no es una identidad distinta ni un comodín: es una lectura
incompleta que **puede** pertenecer a una identidad completa. La regla de
asignación es lo que hace la diferencia:

> una firma parcial se asigna a otra **si y solo si hay EXACTAMENTE UNA firma
> maximal compatible con ella.**

| Candidatas maximales | Resultado | Confianza |
|---:|---|---|
| 1 | se adopta ese identificador (`subsumed`) | `medium` |
| 0, sin ejes desconocidos | identidad propia (`complete`) | `high` |
| 0, con ejes desconocidos | identidad propia y aislada (`isolated`) | `low` |
| 2 o más | **no se elige** — identidad propia (`ambiguous`) | `ambiguous` |

Adivinar entre dos candidatas sería "inventar información faltante para completar
IDs", que el ticket prohíbe explícitamente (§5). **`UNKNOWN` es preferible a una
identidad falsa.**

### Independencia del orden

El conjunto de firmas se calcula entero antes de decidir nada y no se modifica
durante la decisión. El resultado de una oferta no depende de qué farmacia llegó
primero, ni del precio, ni de la consulta. Verificado con test
(`searchV2.canonicalIdentity.test.ts`).

Las candidatas se filtran a las **maximales** —las que no están a su vez
subsumidas por otra candidata— porque la subsunción es transitiva: si A ⊂ B ⊂ C,
sin ese filtro A tendría dos candidatas y se declararía ambigua cuando en
realidad hay un único destino correcto.

### Contexto de resolución

La decisión sí depende de qué firmas están presentes en el conjunto que se
resuelve. Eso es correcto para un RESOLUTOR —un registro más rico resuelve
mejor— y es exactamente por lo que la clave resultante **no puede ser una
identidad permanente**. En S0 el harness resuelve el corpus congelado **completo
de una vez**, la simulación más fiel disponible del registro persistido de S1
(`SEARCH_ENGINE_V2.md` etapa 3: *"¿la firma ya tiene concepto? → recuperar"*).

Medido, y con las dos métricas separadas porque significan cosas distintas:

| | Valor |
|---|---:|
| Estabilidad de la firma **cruda** entre contextos | **100,0000 %** (1633/1633) |
| Estabilidad de la clave **resuelta** entre contextos | **99,8775 %** (1631/1633) |

La canonicalización es pura y no depende de ninguna otra oferta; **toda** la
contextualidad vive en este paso. Las 2 ofertas afectadas están atribuidas una
por una, con su causa, en `S0_METRICS.md` §8 y en
`analysis/context-stability.json`.

**Frontera:** la subsunción es una buena estrategia de RESOLUCIÓN contra un
registro canónico, y no lo es para ACUÑAR identidad desde el corpus. En S1 el
`CFM-CONCEPT-ID` permanente solo puede acuñarse desde una firma COMPLETA; una
observación parcial resuelve contra el registro o queda sin resolver.

---

## 4. Los ejes, nivel por nivel

### Concepto — `ing`, `conc`, `form`

**`ing` — principios activos.** Conjunto ordenado alfabéticamente (el orden
textual no crea identidades distintas). Tres fuentes de evidencia:

1. **vocabulario** — tokens de `COMPOSITION_VOCABULARY` (CF-DATA-001: 34
   moléculas derivadas de una medición reproducible sobre 3.697 ofertas), menos
   iones y sales;
2. **combinación** — el segundo principio activo que `combinationKey()` extrae, y
   la cabecera cuando la firma tipográfica de la combinación la demuestra;
3. **cabecera no resuelta** — cuando las dos anteriores no producen nada.

El eje `ing` queda DESCONOCIDO cuando no se demuestra ninguna molécula, y la
protección la aporta el eje `disc`, que está **siempre declarado** y por lo tanto
no es subsumible: si `ing` quedara desconocido sin `disc`, "Tapsin Forte x 30
comprimidos" podría absorberse dentro del concepto "paracetamol 500 mg
comprimido" por pura ausencia de evidencia. El token nunca se **afirma** como
molécula —vive en `unresolvedIdentityDiscriminator` y se cuenta en la métrica
`identityUnknown`—, pero sí actúa como discriminante honesto. Ver §1.2.

**`conc` — concentración como evidencia.** Ver §5.

**`form` — clase de forma farmacéutica.** Reutiliza `dosageFormClass()` sin
cambios. Subsumible: no declarar la forma no afirma nada.

**Qué NO está en la firma, y por qué:**

| Atributo | Por qué no es eje | Dónde vive |
|---|---|---|
| Vía de administración | Se DERIVA de la forma por tabla explícita; como eje sería redundante | atributo del concepto |
| Unidad farmacéutica | "comprimido" y "tableta" son la misma unidad escrita distinto; sería fragmentación pura | atributo del concepto |
| Cantidad y volumen | Pertenecen a la presentación: dos frascos de 60 y 100 ml son el MISMO concepto | presentación |
| Marca, laboratorio, farmacia, precio | Invariante 1 — *"el conocimiento antecede al mercado"* | producto / oferta |

### Presentación — `concept`, `qty`, `vol`

Las dos dimensiones son **independientes y no intercambiables**. Es la corrección
estructural de §8 del ticket: en v1 ambas compiten por el mismo segmento de
`matchKey` y gana el mililitro, de modo que en 141 ofertas medidas `x 100 ml`
termina representado como "100 unidades".

- `qty` — `unitCountKey()` **por fin gobierna**: hoy lee bien y no sirve de nada
  porque `matchKey` la contradice. Subsumible.
- `vol` — volumen de envase: solo magnitudes de volumen **sueltas** (el `5 ml` de
  `30 mg/5 ml` es el denominador de la concentración, no el frasco). Subsumible.
  Cuando la forma es `solid-oral`, `suppository` o `patch`, la ausencia de
  volumen se declara *conocida* (`none`): no es un dato faltante, una caja de
  comprimidos no tiene volumen envasado. Solo afecta la confianza reportada, no
  la decisión de agrupamiento.
- `packageType` y `packageUnit` son **atributos, no ejes**: una farmacia escribe
  "Caja 6 sobres" y otra "6 sobres" para el mismo artículo.

### Producto comercial — `presentation`, `isp`, `brand`, `variant`, `time`, `manufacturer`

**El cambio de política más importante para la fragmentación.** En v1, marca y
laboratorio están DENTRO de la identidad (`presentationKey` incluye `brand:`), así
que un laboratorio ausente parte el CONCEPTO entero: de ahí las hasta 9 tarjetas
para un solo losartán 50 mg x 30. En v2 la identidad es
`provisionalConceptKey + provisionalPresentationKey`, y marca y laboratorio solo distinguen productos
comerciales **dentro** de esa presentación — que es donde la comparación aparece.

**La ausencia de marca es un producto "no identificado", no un comodín.** El
diseño aprobado lo dice literalmente: un `manufacturer: null` *"se convierte en un
producto comercial 'no identificado' DENTRO de la misma presentación, comparable
con los demás"*. Comparable, **no absorbido**. Por eso `brand`, `variant`, `time`
y `manufacturer` declaran su ausencia como un VALOR (`unbranded`, `none`,
`unidentified`) y no son subsumibles.

Esa decisión se tomó **contra datos**: ver `S0_FAILURES.md` §1, donde una primera
implementación con marca subsumible absorbió un genérico truncado de EasyFarma
dentro del producto Muxol de Cruz Verde.

**`time` — momento de administración**, un eje que v1 tiene escondido. En v1 el
dato vive dentro de `matchKey()` como segmento `turn` (`noche` → `n`, `dia` →
`d`), y `commercialVariantKey()` no puede verlo porque `dia`, `noche` y `plus`
están en `STOP_WORDS`. Un motor v2 que consumiera solo `commercialVariantKey`
fusionaría "Tapsin Plus Día 16 Comprimidos" con "Tapsin Plus Noche 16
Comprimidos" — se verificó sobre el caso de control antes de agregar el eje, y
ocurría (`S0_FAILURES.md` §2).

**`isp` — registro sanitario**, evidencia E1 y el único eje subsumible del nivel.
Hoy ningún adaptador lo captura (CF-DATA-005 / #156 es independiente y S0 **no**
depende de él), así que el eje está siempre en `UNKNOWN` y no discrimina. Se
declara igual para que capturarlo sea un cambio de datos y no de arquitectura.

---

## 5. Concentración — las tres dimensiones que nunca se confunden

```ts
type ConcentrationEvidence =
  | { kind: "ratio";     value: Concentration }  // 30 mg/5 mL — evidencia FUERTE
  | { kind: "mass-only"; value: Measurement }    // 500 mg     — evidencia PARCIAL
  | { kind: "absent" };
```

| Dimensión | Ejemplo | Dónde vive |
|---|---|---|
| Concentración | `30 mg/5 mL`, `500 mg` | `Concept.concentration` |
| Volumen de envase | `100 mL` | `Presentation.packageVolume` |
| Contenido total | `600 mg en 100 mL` | derivado, nunca almacenado |

**Firma numérica, no literal.** `600 mg/100 ml`, `30 mg/5 ml` y `6 mg/ml` son
tres escrituras reales del mismo jarabe de Ambroxol en tres farmacias distintas y
derivan la MISMA firma (`conc:ratio:6mg/ml`). Sin esto, v2 reproduciría la
fragmentación que viene a corregir.

**Tabla de comparación (R5 del modelo aprobado), implementada literalmente:**

| A | B | Condición | Resultado |
|---|---|---|---|
| `ratio` | `ratio` | misma razón | `equal` |
| `ratio` | `ratio` | razón distinta | `incompatible` |
| `mass-only` | `mass-only` | misma masa | `equal` |
| `mass-only` | `mass-only` | masa distinta | `incompatible` |
| **`mass-only`** | **`ratio`** | **mismo numerador** | **`subsumable`** |
| `mass-only` | `ratio` | numerador distinto | `incompatible` |
| `absent` | cualquiera | — | `subsumable` |

La fila en negrita es la que hoy falta en v1 y la que resuelve el caso
`ambroxol 30mg`.

**Dos diferencias de LECTURA respecto de v1, ninguna de las cuales toca v1:**

1. `liquidConcentration()` devuelve masa absoluta solo cuando el nombre también
   declara un volumen — correcto para su propósito, pero deja sin concentración a
   todos los sólidos ("Paracetamol 500 mg x 16" devuelve `null`). En el EDM,
   `500 mg` **es** la concentración de ese concepto. v2 la lee.
2. `isCompatibleConcentration()` devuelve `true` para razón-vs-masa, correcto
   para no prohibir una fusión, pero colapsa "son equivalentes" con "una es más
   débil que la otra". v2 los separa con `subsumable`.

**Prohibición que v2 respeta (R4):** nunca se infiere una razón por yuxtaposición.
"Ambroxol 30 mg 100 ml" es masa `30 mg` + volumen `100 mL`, jamás `30 mg/100 mL`.
El costo medido de respetarla está en `S0_FAILURES.md` §3.

---

## 6. El único archivo de v1 tocado

`packages/domain/src/concentration.ts` gana **una función nueva y pura**:

```ts
export function concentrationRatio(c: Concentration): { value: number; unit: string } | null
```

Devuelve el valor numérico de una concentración en las unidades base de su
familia. Ninguna función preexistente la llama; ninguna función preexistente
cambió una línea.

**Por qué acá y no en `searchV2/`:** la tabla de familias y factores
(`UNIT_DIMENSIONS`) es privada de ese módulo, y copiarla en la capa v2 sería
duplicar una regla de negocio (`CLAUDE.md` §7) con garantía de divergencia. El
ticket, además, ordena explícitamente reutilizar el modelo de `concentration.ts`
(§7).

**Verificación de que v1 no cambió:** los 379 tests preexistentes de
`@comparafarma/domain` pasan sin modificar ni uno, incluido el snapshot de
contrato de `matchKey`.

---

## 7. Provenance

Cada `CanonicalOffer` lleva el linaje completo (EDM-500):

```
provenance
├── pharmacy, rawName
├── upstreamFields   { brand, manufacturer, isBioequivalent, ispRegistration, url }
├── inferredFields   { activeIngredients, concentration, dosageForm, route,
│                      pharmaceuticalUnit, packageQuantity, packageVolume,
│                      packageType, commercialVariant, administrationTime,
│                      variantDiscardedAsIngredient, brandFromName }
├── legacyMatchKey, legacyPresentationKey     ← trazabilidad v1↔v2, NUNCA identidad
└── resolution { concept, presentation, product }
        └── ResolutionTrace { signature, rawSignature, kind, confidence,
                              unknownAxes, candidateCount }
```

`rawSignature` es la firma original de la oferta; `signature` es la de la
anfitriona bajo la que quedó. **"¿Por qué estas dos ofertas comparten
producto?" se responde comparando dos cadenas legibles**, sin reejecutar
ninguna heurística:

```
Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml
  concept  ing=ambroxol|disc=none|conc=conc:ratio:6mg/ml|form=liquido-oral|route=oral|unit=?
  product  presentation=PROV-P-…|isp=?|brand=muxol|variant=none|time=none|manufacturer=unidentified
```

`scripts/debug-case.mjs` imprime exactamente eso para cualquier nombre.

---

## 8. Cobertura y honestidad

Toda observación de entrada produce **exactamente una** `CanonicalOffer` enlazada
a una clave de producto, una de presentación y una de concepto. Ninguna se
descarta, ni siquiera cuando no se pudo demostrar ningún principio activo: en ese
caso obtiene identidad propia con
`identityStatus: "unresolved-ingredient"`.

**El motor puede declarar que no sabe; nunca puede perder una oferta.** Es lo que
mide el Gate A, y es la razón de que `identityUnknown` sea una métrica reportada
y no un error silencioso.
