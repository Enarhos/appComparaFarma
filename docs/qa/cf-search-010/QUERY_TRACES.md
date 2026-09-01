# CF-SEARCH-010 — Trazas reales

Cada traza sale de `analysis/offers.json`, `analysis/case-ambroxol-30mg.txt` y
`analysis/edm-gap.json`, generados con las funciones reales de
`@comparafarma/domain`. Captura: 2026-09-01, `GET /api/search` público.

Las preguntas que el ticket exige responder por caso son, para cada par de
ofertas: *¿misma identidad farmacológica? ¿misma presentación? ¿mismo producto
comercial? ¿solo otra oferta? ¿por qué se fusiona/separa? ¿por qué aparece
primero/secundario? ¿la ficha resuelve al mismo producto?*

---

## Traza 1 — `ambroxol 30mg` · el caso que dispara el ticket

```
rawQuery         "ambroxol 30mg"
retrievalQuery   "ambroxol"          ← cleanQuery descarta "30mg"
intent.concentration  30mg           ← MASA ABSOLUTA (denominator = null)
intent.quantity  null
intent.dosageForm null
tarjetas         57                  ← idénticas a las de `q=ambroxol`
```

### 1.1 Lo que ve el usuario en las primeras posiciones

| # | Cohorte | Precio | Farmacias | Nombre canónico |
|---|---|---|---|---|
| 1 | **exact** | $1.100 | ecofarmacias | Ambroxol clorhidrato **30mg** 100ml Ascend DESCUENTO |
| 2 | exact | $6.877 | farmex | Muxol 30 mg x 20 **comprimidos** |
| 3 | exact | $11.190 | cruz-verde | Muxol Ambroxol 30 mg 20 **Comprimidos** |
| 4 | unknown | $5.490 | easyfarma | Muxol Adulto Jarabe… |
| 5 | unknown | $5.490 | easyfarma | Muxol Pediatrico Jarabe x… |
| 6 | unknown | $8.990 | easyfarma | Broncot Pediatrico GFT… |
| 7 | unknown | $10.031 | salcobrand | Muxol Ambroxol 20 **Comprimidos** |
| 8 | **other** | $790 | araucomed+cruz-verde | Tocalm Infantil **15mg/5ml** jarabe 100 ml. |
| 9 | **other** | $790 | araucomed | Ambroxol **30mg/5ml** jarabe adulto 100 ml. (Ascend) |
| 12 | **other** | $990 | eco+sermecoop+ahumada | Ambroxol **30mg/5ml** Jarabe 100ml |

**Diagnóstico.** El usuario que escribe `ambroxol 30mg` busca el jarabe de
30 mg/5 mL, que es como se comercializa. El motor le muestra:

- en `exact`, un producto de otra forma farmacéutica (comprimidos, #2/#3) y un
  jarabe cuyo único mérito es que **EcoFarmacias escribió "30mg" sin el
  "/5ml"** (#1);
- en `other`, **todos los jarabes correctamente etiquetados 30 mg/5 mL**
  (#9-#18), a $790–$1.990, por debajo de comprimidos de $11.190;
- mezclados en `other`, jarabes de **15 mg/5 mL** (#8, #11), que son otra
  potencia.

**Causa raíz.** `parseConcentration("ambroxol 30mg")` produce
`{numerator:{30,"mg"}, denominator:null}` — una **dosis absoluta**.
`isSameConcentration` (`concentration.ts:225`) declara por diseño que *"una
dosis absoluta nunca es igual a una razón, aunque los números coincidan"*. Es
correcto para "600 mg comprimido" vs "600 mg/mL jarabe". Pero en el lenguaje
real del usuario chileno, `ambroxol 30mg` **significa** 30 mg/5 mL.

Medido en el corpus: **32 tarjetas** cuya concentración declarada tiene el mismo
numerador que el pedido son clasificadas `other` y hundidas
(`edm-gap.json → absoluteMassQueryDemotesRatioProducts`).

La cohorte de concentración es un **límite duro que el precio no cruza**
(`relevance.ts:301`). Así que la regla que CF-SEARCH-002 introdujo para proteger
al usuario ("un ibuprofeno de 400 mg no puede aparecer antes que uno de 600 mg
si pediste 600 mg") es exactamente la que acá lo perjudica.

**Respuestas del ticket para #1 vs #12:**
- ¿Misma identidad farmacológica? **Sí** — ambos son ambroxol 30 mg/5 mL.
- ¿Misma presentación? **Sí** — frasco de 100 mL.
- ¿Mismo producto comercial? No necesariamente (Ascend vs Hospifarma).
- ¿Por qué se separan? Porque `brand:` difiere y porque `matchKey` de #1 no
  incluye forma (`ambroxol|100ml|bio:unknown|brand:unknown` sin `|form:`).
- ¿Por qué #1 aparece primero y #12 duodécimo? Porque EcoFarmacias omitió el
  `/5ml` y eso lo puso en la cohorte `exact`. **El orden depende de la
  ortografía de la farmacia, no del producto.**

### 1.2 El mismo producto partido en tres por tres mecanismos distintos

Muxol 30 mg x 20 comprimidos:

| # | Farmacia | Nombre | `matchKey` | `presentationKey` | Precio |
|---|---|---|---|---|---|
| 2 | farmex | Muxol 30 mg x 20 comprimidos | `muxol\|30mg\|20` | `…\|brand:unknown\|form:solid-oral` | $6.877 |
| 3 | cruz-verde | Muxol **Ambroxol** 30 mg 20 Comprimidos | `muxol\|30mg\|20` | `…\|brand:unknown\|var:ambroxol\|form:solid-oral` | $11.190 |
| 7 | salcobrand | Muxol **Ambroxol** 20 Comprimidos | `muxol\|20` | `…\|brand:muxol\|var:ambroxol\|form:solid-oral` | $10.031 |

Tres separaciones independientes y simultáneas:
1. `var:ambroxol` — el **principio activo** leído como variante comercial
   (`ambroxol` no está en `COMPOSITION_TOKENS`).
2. `brand:muxol` — Salcobrand entrega su campo `brand` con el nombre del
   producto, no un laboratorio (defecto ya caracterizado en CF-DATA-001, pero
   la identidad quedó congelada a propósito y sigue alimentándose de él).
3. `muxol|20` vs `muxol|30mg|20` — Salcobrand omite la dosis del nombre.

El usuario no ve **una** comparación de $6.877 a $11.190. Ve tres tarjetas de
una farmacia cada una.

### 1.3 Colisión de slug viva en producción

```
COLISIONES DE HASH DE SLUG en q=ambroxol 30mg: 2

hash 368kw3kmwe8r5
  · "Ambroxol 30mg/5ml Jarabe 100ml"     pk ambroxol|100ml|bio:unknown|brand:unknown|form:fluid-oral
  · "Ambroxol 15 mg/5mL Jarabe 100 mL"   pk ambroxol|100ml|bio:unknown|brand:unknown|form:fluid-oral

hash ouqw7x1crum0
  · "Muxol Adulto 30mg/5ml jarabe 100ml"     pk muxol|100ml|bio:unknown|brand:unknown|form:fluid-oral
  · "Muxol (ambroxol) 15mg/5ml Jarabe 100ml" pk muxol|100ml|bio:unknown|brand:unknown|form:fluid-oral
```

**¿La ficha resuelve al mismo producto?** Dos tarjetas de potencia distinta
(factor 2) comparten `presentationKey` y por lo tanto el mismo sufijo de slug.
CF-SEARCH-003 las separó correctamente en la lista **sin meter la concentración
en la clave** (medido: rotaría 23,4 % de las URLs), y CF-WEB-002 tuvo que
agregar una guardia en Web —`isConsistentWithSlug`— que desempata leyendo la
concentración de la **parte legible** del slug. Funciona (127/128 enlaces
resuelven), pero:

- es una regla de identidad **reimplementada en la capa de ruteo**;
- depende de que el `canonicalName` conserve la concentración, es decir de la
  ortografía de la farmacia que ganó `pickCanonicalSlot`;
- si la tarjeta correcta desaparece del catálogo, no hay nada persistido a lo
  que caer.

Medido en todo el corpus: **4 pares de productos distintos** con hash de slug
compartido (12 ocurrencias sobre las 16 consultas — las consultas de ambroxol e
ibuprofeno repiten el mismo par). Los cuatro son la misma clase de defecto: dos
potencias del mismo jarabe compartiendo una URL.

---

## Traza 2 — `losartan 50mg` · la fragmentación por marca, en su forma pura

`matchKey = losartan|50mg|30` agrupa **18 ofertas** de 7 farmacias. Producen
**13 `presentationKey` distintas**, es decir 13 tarjetas.

| `presentationKey` | Ofertas | Precio |
|---|---|---|
| `…\|bio:true\|brand:unknown\|form:solid-oral` | ecofarmacias "Losartan 50 mg x 30 comprimidos **(LCH)** DESCUENTO" · ahumada "Losartan Potasico 50 mg x 30 Comprimidos Recubiertos" | $490 · $1.169 |
| `…\|bio:unknown\|brand:hospifarma\|…` | araucomed "…x30com. (Hospifarma)" | $600 |
| `…\|bio:unknown\|brand:opko\|…` | araucomed "(Opko)" · farmex "Ley Cenabast" | $800 · $995 |
| `…\|bio:unknown\|brand:mintlab\|…` | araucomed "(Mintlab)" | $900 |
| `…\|bio:unknown\|brand:sevenpharma\|…` | araucomed "(Seven Pharma)" | $900 |
| `…\|bio:unknown\|brand:chile\|…` | farmex "Losartan Potásico 50 mg x 30 comprimidos" · araucomed "**(Chile)**" | $990 · $1.200 |
| `…\|bio:unknown\|brand:ascend\|…` | araucomed "(Ascend)" | $990 |
| `…\|bio:unknown\|brand:eurofarma\|…` | araucomed "(Eurofarma)" | $990 |
| `…\|bio:unknown\|brand:unknown\|…` | salcobrand "Losartan **(B)** 50mg 30 Comprimidos Recubiertos" · cruz-verde | $1.495 · $1.840 |
| 4 claves más con `\|combo:hidroclorotiazida` | (correctamente separadas — es otro fármaco) | $1.990–$2.980 |

**Lecturas:**

1. **9 tarjetas para una sola presentación farmacéutica.** Losartán potásico
   50 mg, comprimido, caja de 30. Un solo Concepto + una sola Presentación del
   EDM, repartidos en 9 tarjetas porque el eje `brand:` es la identidad.
2. **El mismo laboratorio produce dos tokens distintos.** EcoFarmacias escribe
   `(LCH)` y AraucoMed/Farmex escriben `(Chile)` — ambos son Laboratorio Chile.
   `(LCH)` no se resuelve (`brand:unknown`), `(Chile)` sí (`brand:chile`). Dos
   tarjetas para el mismo producto del mismo fabricante.
3. **`bio:` fragmenta sin aportar identidad.** El $490 de EcoFarmacias queda
   aislado del $1.495 de Salcobrand solo porque una fuente informa
   bioequivalencia y la otra no — y el propio nombre de Salcobrand trae el sello
   **"(B)"** del ISP, es decir la evidencia está en el texto y no se lee.
4. Las 4 claves con `combo:hidroclorotiazida` **sí** están correctamente
   separadas: S-1 hace bien su trabajo. El problema no es que el motor separe
   mal; es que separa **demasiado en el eje equivocado**.

**Respuestas del ticket:** entre las 9 primeras filas, la identidad
farmacológica es la misma, la presentación es la misma, el producto comercial
difiere en el fabricante, y cada fila es *solo otra oferta* del mismo Concepto.
Se separan porque el fabricante entró a la clave de identidad **como si fuera
identidad de producto**, y porque el dato de fabricante es de mala calidad
(72,5 % de las ofertas no lo traen estructurado).

---

## Traza 3 — El volumen de envase leído como cantidad de unidades

```
"Ambroxol 30mg/5ml Jarabe Adulto x 100 ml. (Hospifarma)"  matchKey ambroxol|100ml|100
"Tocalm Adulto 30 mg/5 mL x 100 mL Jarabe"                matchKey tocalm|100ml|100
"Broncot 15mg/5ml Jarabe x 120 ml."                       matchKey broncot|120ml|120
"Muxol Jarabe adulto Ambroxol 30 mg / 5 mL x 100 mL"      matchKey muxol|100ml|100
```

`QUANTITY_PATTERN` acepta `\bx\s*(\d+)` sin comprobar el sustantivo siguiente.
`"x 100 ml"` se lee como **100 unidades**, y ese `|100` entra al `matchKey`
persistido.

**141 ofertas / 78 nombres distintos** del corpus tienen este defecto
(`edm-gap.json → packageVolumeReadAsUnitCountByMatchKey`). Efectos en cadena:

- **Identidad:** `ambroxol|100ml|100` ≠ `ambroxol|100ml` ⇒ tarjeta aparte.
- **Agrupación visual de Web:** `groupMedicationResultsByMatchKey` los pone en
  grupos distintos.
- **Persistencia:** ese `matchKey` erróneo está guardado en `price_history`,
  `pharmacy_clicks` y `medication_match_key_aliases`. El histórico del mismo
  frasco está partido en dos series.
- **`unitCountKey()` lo lee bien** (devuelve `null`, gracias a `MEASURE_UNITS`)
  **y no sirve de nada**, porque no participa de `matchKey`.

Es el ejemplo más limpio de un fix correcto en la capa equivocada.

---

## Traza 4 — Contradicciones dentro de una tarjeta: cero

Sobre las 1.634 ofertas, se recomputaron los 6 ejes de identidad para **todos
los pares de ofertas que comparten tarjeta** (229 pares):

```
intraCardContradictions: 0
```

Ningún par contradictorio en `matchKey`, combinación, variante, forma, cantidad
ni concentración.

**Es el resultado más importante del lado positivo de esta auditoría.**
CF-SEARCH-001, el fix de cantidad y CF-SEARCH-003 hicieron su trabajo: el motor
ya **no fusiona lo que no debe**. Todo el problema restante está del otro lado
—no fusiona lo que sí debe— y en la capa de relevancia.

---

## 5. Resumen de las trazas

| Pregunta | Respuesta medida |
|---|---|
| ¿Fusiona productos distintos? | **No.** 0 contradicciones intra-tarjeta sobre 229 pares |
| ¿Separa el mismo producto? | **Sí, masivamente.** 280 presentaciones repartidas en 1.070 tarjetas |
| ¿La identidad depende de la consulta? | **No** — `presentationKey` es independiente de `q`. Correcto |
| ¿El orden depende de la ortografía de la farmacia? | **Sí.** El `exact` de `ambroxol 30mg` lo gana quien omite el `/5ml` |
| ¿La ficha resuelve al mismo producto? | **Casi siempre** (CF-WEB-002: 127/128), pero por una guardia en Web que reimplementa reglas de identidad, sobre 4 pares de slugs colisionados |
| ¿Se puede razonar el comportamiento global? | **No.** 8 ejes derivados de texto libre, 9 vocabularios manuales, 6 generaciones de slug, 2 taxonomías de marca |
