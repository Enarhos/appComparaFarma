# CF-SEARCH-011 — Identidad canónica v2, implementada

Proyección técnica del Enterprise Data Model aprobado en ADR-0005. **No es un
modelo alternativo**: la jerarquía, los nombres y la semántica salen de
`docs/enterprise/ENTERPRISE_DATA_MODEL.md` (EDM-100 / EDM-200) y de
`docs/qa/cf-search-010/CANONICAL_IDENTITY_MODEL.md`.

Código: `packages/domain/src/searchV2/`.

---

## 1. Las cuatro entidades

```
CFM-CONCEPT-ID  → principios activos + concentración + forma
CFM-PRESENTATION-ID → concepto + cantidad de unidades + volumen de envase
CFM-PRODUCT-ID  → presentación + ISP + marca + variante + momento + laboratorio
CFM-OFFER-ID    → farmacia + referencia de origen
```

Las cinco invariantes del modelo aprobado se cumplen **por construcción**, no por
disciplina: son las firmas las que producen los identificadores, y ninguna firma
contiene consulta, ranking ni precio.

| Invariante | Cómo se garantiza |
|---|---|
| El concepto no depende de marca, laboratorio, farmacia ni precio | `conceptSignature()` tiene 3 ejes y ninguno es comercial |
| La presentación no depende de marca ni de laboratorio | `presentationSignature()` = concepto + cantidad + volumen |
| Solo el producto depende de marca y fabricante | `productSignature()` es el único nivel con ejes comerciales |
| Solo la oferta depende de la farmacia | `offerSignature()` es el único que la nombra |
| **Ninguno depende de la consulta ni del ranking** | Ninguna firma recibe la query; hay test que lo verifica |

### Desviación deliberada respecto del boceto de CF-SEARCH-010

El boceto proponía `offerId = productId + pharmacyId + channel`. Acá el
`offerId` depende **únicamente de la observación** (farmacia + referencia de
origen + nombre crudo), nunca del `productId`.

Motivo: si el ID de la observación dependiera del resultado de la resolución,
mejorar la resolución rotaría los IDs de ofertas que no cambiaron — y una
observación no deja de ser la misma observación porque el motor aprenda a qué
producto pertenece. `productId` viaja como clave foránea. El propio documento
declara que los nombres "no son un contrato cerrado".

---

## 2. Los identificadores

`CFM-{C|P|M|O}-<26 caracteres base36>`, derivados de un hash de 128 bits en
JavaScript puro (dos flujos FNV-1a de 64 bits con bases de desplazamiento
distintas) sobre `prefijo + firma`.

**Por qué 128 bits y no 64:** v1 usa FNV-1a de 64 bits truncado para los slugs, y
CF-SEARCH-010 midió **4 pares de productos con hash compartido** sobre 1.634
ofertas. Una colisión en un identificador de IDENTIDAD no es una URL ambigua: es
una fusión silenciosa de dos medicamentos distintos. Medido sobre el corpus
completo: **0 colisiones** (dos firmas distintas nunca compartieron ID).

**Por qué no `node:crypto`:** `@comparafarma/domain` se bundlea con Metro para
`mobile/`, donde `node:crypto` no existe.

**Nota de migración, no decisión de S0.** El EDM prevé identificadores
persistidos y asignados una vez (`CFM-C-000123`). S0 no tiene registro, así que
usa un ID *content-addressed* sobre la firma: determinista, reproducible y
auditable sin base de datos. Cuando S1 introduzca el registro, la **firma** pasa
a ser la clave de búsqueda y el ID pasa a ser el subrogado persistido; nada más
cambia, porque ningún componente depende de la forma del ID.

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
resuelve: es la naturaleza de un registro. En S0 el harness resuelve el corpus
congelado **completo de una vez**, que es la simulación fiel del registro
persistido de S1 (`SEARCH_ENGINE_V2.md` etapa 3: *"¿la firma ya tiene conceptId?
→ recuperar"*). La estabilidad entre contextos se mide: resolviendo consulta por
consulta en vez del corpus entero, **99,88 %** de las ofertas conservan su
`conceptId`.

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

El eje **NO es subsumible**. Una cabecera no resuelta se declara *conocida* a
propósito: si se declarara desconocida, "Tapsin Forte x 30 comprimidos" podría
absorberse dentro del concepto "paracetamol 500 mg comprimido" por pura ausencia
de evidencia. El token nunca se **afirma** como molécula —queda marcado
`unresolved-head` y se cuenta en la métrica `identityUnknown`—, pero sí actúa
como discriminante honesto.

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
`conceptId + presentationId`, y marca y laboratorio solo distinguen productos
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
`productId`?" se responde comparando dos cadenas legibles**, sin reejecutar
ninguna heurística:

```
Muxol Adulto Ambroxol 30mg/5ml jarabe 100ml
  concept  ing=ambroxol|conc=conc:ratio:6mg/ml|form=fluid-oral        (complete)
  product  presentation=CFM-P-…|isp=?|brand=muxol|variant=none|time=none|manufacturer=unidentified
```

`scripts/debug-case.mjs` imprime exactamente eso para cualquier nombre.

---

## 8. Cobertura y honestidad

Toda observación de entrada produce **exactamente una** `CanonicalOffer` enlazada
a un `productId`, un `presentationId` y un `conceptId`. Ninguna se descarta, ni
siquiera cuando no se pudo demostrar ningún principio activo: en ese caso obtiene
identidad propia marcada como no resuelta.

**El motor puede declarar que no sabe; nunca puede perder una oferta.** Es lo que
mide el Gate A, y es la razón de que `identityUnknown` sea una métrica reportada
y no un error silencioso.
