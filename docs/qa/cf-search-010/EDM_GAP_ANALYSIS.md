# CF-SEARCH-010 — Gap analysis contra el Enterprise Data Model

Fuente normativa: `docs/enterprise/ENTERPRISE_DATA_MODEL.md` (ENT-EDM-001 v2.0)
y `docs/enterprise/strategy/MASTER_DATA_STRATEGY.md`.

El EDM define la jerarquía objetivo:

```
CFM-CONCEPT-ID → CFM-PRESENTATION-ID → CFM-PRODUCT-ID → CFM-OFFER-ID
```

y declara (§ Principios, 2 y 4): *"El Concepto Farmacéutico es la entidad
central"*, *"Cada entidad tendrá una única definición conceptual"*, y *"la
concentración deberá administrarse de manera estructurada, nunca únicamente como
texto"*.

---

## 1. Matriz por entidad

### 1.1 Concepto Farmacéutico — `CFM-CONCEPT-ID`

| Atributo EDM | Identidad esperada | Implementación actual | Gap | Riesgo | Dato necesario | Propuesta v2 |
|---|---|---|---|---|---|---|
| **Identificador permanente** | ID que nunca cambia, independiente de tecnología | **No existe.** Lo más cercano es `matchKey`, que ya cambió 12 veces (ver `CACHE_PREFIX` v1→v12) | **Total** | Todo el histórico está indexado por una clave que el propio equipo declara mutable | Registro persistido | `conceptId` en Supabase, asignado una vez, nunca recalculado |
| **Principio(s) activo(s)** | Entidad propia con sinónimos | `matchKey` toma **el primer token alfabético del nombre**, sea principio activo o marca. `activeIngredient` (CF-DATA-001) existe pero es informativo y no participa de ninguna clave — cobertura **56,9 %** | **Alto** | "Tapsin" y "Paracetamol" son conceptos distintos para el motor aunque el segundo esté dentro del primero | Vocabulario de INN + ATC | `activeIngredients[]` como entidad, con sinónimos; el ATC como eje de agrupación terapéutica |
| **Asociación de principios activos** | Entidad propia, *"no una concatenación de nombres"* (EDM) | `combinationKey()` devuelve **un solo token** — el segundo ingrediente. Una combinación triple con los dos primeros iguales colisiona | **Medio** | Combinaciones triples indistinguibles | Composición completa | `activeIngredients[]` ordenado + normalizado, no un token |
| **Concentración** | *"estructurada, nunca únicamente como texto"* (EDM, textual) | `Concentration` **sí es estructurada** (`concentration.ts`) — pero **no participa de ninguna clave de identidad**. Legible en solo **26,6 %** de las ofertas | **Alto** | `matchKey` de un jarabe es su **volumen de envase**, no su concentración. 4 pares de productos comparten URL | Concentración por producto | `concentration` como campo de primera clase del `conceptId` |
| **Forma farmacéutica** | Comprimido, cápsula, jarabe… | `dosageFormClass` — **8 clases gruesas**, legible en 90,8 %. Deliberadamente no distingue recubierto/masticable/efervescente | **Bajo** | Sub-formas fusionadas (aceptado y documentado) | — | Se conserva; se refina solo con evidencia |
| **Vía de administración** | Oral, tópica, IV… | **No existe** | **Total** | Un colirio y unas gotas orales de la misma molécula y concentración son indistinguibles en el eje de vía | Derivable de la forma en la mayoría de los casos | `route`, derivada de `dosageForm` con tabla explícita |
| **Unidad farmacéutica** | comprimido, frasco, sobre | **No existe como campo.** Implícita en `dosageFormClass` y en `unitCountKey` | **Medio** | "1 sobre" vs "1 comprimido" no se distinguen como unidades | — | `pharmaceuticalUnit` explícita |
| **Nombre canónico** | Nombre oficial del concepto | `canonicalName` es el **nombre crudo de una farmacia**, elegido por heurística (con laboratorio → más corto → precio → slug) | **Alto** | El título de la tarjeta y el slug dependen de qué farmacia respondió y de la longitud de su texto | Nombre construido | `canonicalName` **generado** desde los atributos estructurados |
| **Estado / fuente de verdad / fechas** | Trazabilidad | No existen | Total | Sin linaje ni auditoría (EDM-500) | — | Campos del registro |

**Cardinalidad medida:** ~292 conceptos aproximados producen 1.447 tarjetas
(4,96 tarjetas por concepto).

---

### 1.2 Presentación Farmacéutica — `CFM-PRESENTATION-ID`

| Atributo EDM | Identidad esperada | Implementación actual | Gap | Riesgo | Dato necesario | Propuesta v2 |
|---|---|---|---|---|---|---|
| **Identificador** | Permanente, hijo del concepto | **No existe** | Total | — | Registro | `presentationId` |
| **Cantidad** | Unidades por envase | Dos lecturas incompatibles conviviendo: el segmento de `matchKey` (que normaliza `1`→vacío y lee **141 volúmenes como cantidades**) y `unitCountKey()` (correcta, cobertura 60,8 %, **fuera de la clave**) | **Alto** | El histórico de precios está partido para 78 nombres distintos | — | `quantity` única, la lectura correcta, **dentro** de la identidad |
| **Unidad** | comprimido / mL / sobre | No existe explícita | Medio | — | — | `unit` |
| **Contenido total / volumen** | 120 mL, 30 comprimidos | Legible (`parseMeasurements`) en 29,9 %, usado **solo** para desambiguar concentración | Medio | El volumen del frasco vive hoy dentro de `matchKey`, ocupando el lugar de la concentración | — | `totalVolume` separado de `concentration` |
| **Tipo de envase** | Caja, frasco, tira | No existe | Bajo | — | — | `packageType` (opcional) |

**Cardinalidad medida:** ~369 presentaciones aproximadas producen 1.447
tarjetas. **280 presentaciones (75,9 %) están repartidas en más de una tarjeta**,
involucrando 1.070 tarjetas.

---

### 1.3 Producto Medicinal Comercial — `CFM-PRODUCT-ID`

| Atributo EDM | Identidad esperada | Implementación actual | Gap | Riesgo | Dato necesario | Propuesta v2 |
|---|---|---|---|---|---|---|
| **Identificador** | Permanente | **No existe.** `presentationKey` es lo más parecido, pero es **una cadena derivada de texto libre, recalculada en cada request** | Total | Cambiar cualquier regla de parsing cambia la identidad de todo el catálogo | Registro | `productId` |
| **Marca comercial** | "Tapsin", "Muxol" | **Dos verdades conviviendo**: `brand` (CF-DATA-001, para mostrar, 36,6 % de cobertura) y el token `brand:` de `presentationKey` (para identificar, alimentado por `legacyLaboratoryValue()` = `manufacturer ?? brand`, congelado con su defecto) | **Alto** | Salcobrand entrega el nombre del producto como marca ⇒ `brand:muxol` separa un producto de sí mismo | — | Una sola marca; la identidad la consume |
| **Laboratorio** | "Maver", "Eurolab" | `manufacturer`, cobertura **29,2 %**. 5 de 9 farmacias nunca lo entregan | **Alto** | El eje `brand:` fragmenta: `(LCH)` y `(Chile)` son Laboratorio Chile y producen dos tarjetas | Vocabulario de laboratorios | `manufacturer` normalizado contra un catálogo, no contra una lista de ruido |
| **Registro ISP** | Identificador regulatorio único | **0 % — ningún adaptador lo captura**, aunque Dr. Simi y Farmex ya lo exponen en el JSON que hoy se consume y se descarta | **Total y evitable** | Se descarta el único identificador fuerte disponible | Mapear 2 campos ya presentes | `ispRegistration` capturado en ingesta |
| **Bioequivalencia** | Relación regulatoria explícita | `isBioequivalent: boolean\|null` (corregido en BIOEQ-01 pasos 1-2). **82,4 % `null`**. Participa de la identidad vía `bio:` | **Medio** | Un atributo con 82 % de ausencia gobierna la identidad y fragmenta (caso losartán $490 vs $1.495) | Fuente regulatoria | Entidad aparte; **fuera** de la identidad (es la Option D ya decidida en BIOEQ-01 y no implementada) |
| **Estado** | activo / retirado | No existe | Bajo | — | — | `status` |

---

### 1.4 Oferta — `CFM-OFFER-ID`

| Atributo EDM | Identidad esperada | Implementación actual | Gap | Riesgo | Dato necesario | Propuesta v2 |
|---|---|---|---|---|---|---|
| **Identificador** | `CFM-OFFER-ID` | **No existe.** `PharmacyPrice` no tiene identidad propia | Alto | No se puede referenciar una oferta concreta desde un click, una alerta o un histórico | — | `offerId = productId + pharmacyId + channel` |
| **Producto** | FK al producto comercial | Implícita: la oferta vive dentro de la tarjeta | Alto | Sin FK, el histórico se cuelga de `matchKey` | — | `productId` explícito |
| **Farmacia / sucursal** | FK | `pharmacySlug` ✅ / sucursal ❌ (`branches.json` congelado, MINSAL 403) | Bajo / Alto | Sin sucursal no hay cobertura comunal (EDM-200) | — | Se conserva; sucursal fuera de alcance |
| **Canal** | presencial / online / fidelización | ✅ `PriceChannels` — **la parte mejor modelada de todo el sistema** | **Ninguno** | — | — | Se conserva sin cambios |
| **Precio lista / efectivo** | Ambos | ✅ `store` / `effective = min(...)` | Ninguno | — | — | Se conserva |
| **Disponibilidad** | Estado real de stock | `hasStock: boolean`; **2 de 9 adaptadores lo hardcodean `true`** (QA-SEARCH-006). 16 % de tarjetas titulan con una oferta agotada | Medio | Se anuncia un "mejor precio" no comprable | — | `stock: boolean \| null` (es `CF-DATA-003`, ya propuesto) |
| **Fecha de captura** | Instante del hecho de mercado | `fetchedAt = new Date()` en el momento del **mapeo**, no de la captura upstream | Bajo | — | — | `capturedAt` propagado |
| **Sourced product ID** | Trazabilidad a la fuente (EDM-500, Linaje) | **No existe** | Alto | No se puede reconciliar una oferta con su origen entre dos capturas | ID nativo de cada farmacia | `sourceProductId` — **todas las fuentes lo tienen**, ninguno se guarda |

---

## 2. Clasificación de los atributos

### 2.1 Existen estructurados hoy (se conservan)

- Canales y precio efectivo (`PriceChannels`) — modelado correctamente.
- `Concentration` como razón estructurada (`concentration.ts`) — **el modelo ya
  es el correcto; lo que falta es que participe de la identidad**.
- `pharmacySlug`, `onlineUrl` (validado por dominio), `imageUrl`.
- `brand` / `manufacturer` / `activeIngredient` / `brandSource` (CF-DATA-001).

### 2.2 Se infieren de texto libre (frágil por construcción)

| Eje | Cobertura | Gobernado por |
|---|---:|---|
| Cabecera farmacológica | 100 % | `STOP_WORDS` + `brandHeadTokens` |
| Forma farmacéutica | 90,8 % | `DOSAGE_FORM_RULES` |
| Cantidad por envase | 60,8 % | `UNIT_COUNT_NOUNS` + `MEASURE_UNITS` |
| Volumen de envase | 29,9 % | `parseMeasurements` |
| Concentración | 26,6 % | `MEASUREMENT_RE` |
| Variante comercial | — | `COMPOSITION_TOKENS` + `EXTRA_VARIANT_NOISE` + `VARIANT_ALIASES` |
| Combinación | — | `SALT_QUALIFIER_WORDS` + `PRESENTATION_FORM_WORDS` |
| Marca (identidad) | 27,5 % estructurada | `NOISE_PHRASES` + `KNOWN_ACTIVE_INGREDIENTS` + `RELIABLE_URL_HOSTS` |

**Nueve vocabularios manuales**, cada uno alimentado por observación de un
corpus puntual. `REGRESSION_TIMELINE.md` §3.1 documenta el caso `ambroxol`, que
no estaba en el corpus del 2026-08-27 y hoy produce 65 falsos splits.

### 2.3 No existen

Vía de administración · Unidad farmacéutica · Registro ISP · Código ATC ·
Nombre canónico construido · Sucursal por oferta · `sourceProductId` ·
Identificadores permanentes de ninguno de los 4 niveles.

### 2.4 Están mezclados en una sola clave

`matchKey` = principio activo **o** marca + (dosis **o** volumen de envase) +
turno + (cantidad **o** volumen). Cuatro conceptos del EDM colapsados en una
cadena, con dos ambigüedades internas.

`presentationKey` = `matchKey` + bioequivalencia + marca/laboratorio +
combinación + variante + forma. Mezcla **Concepto**, **Presentación**,
**Producto Comercial** y un atributo regulatorio, y además cumple el rol de
identificador de URL.

---

## 3. Fuente de verdad regulatoria — investigación (sin implementación)

`docs/product/decisions/DECISION_LOG.md` (2026-07-31) registró la fuente ISP en
`datos.gob.cl` como *"API real vía CKAN DataStore… confirmado con datos reales,
no vacío"*. **Ese estado cambió.** Sonda read-only del 2026-09-01
(`analysis/isp-source-probe.json`, `scripts/probe-isp.mjs`):

| Vía | Resultado hoy |
|---|---|
| **CKAN DataStore API** (`datastore_search`, resource `93df17ca-…`) | HTTP 200, `success: true`, **`total: 0`, 0 registros**. El esquema de columnas existe; la tabla está vacía |
| **CSV directo** | HTTP 200, 221 KB, **encabezado propio: "Listado de productos Bioequivalentes, actualizado al 31 de Mayo de 2016"**; `last_modified` del recurso: 2017-08-22 |
| **`registrosanitario.ispch.gob.cl`** | HTTP 200 vía `curl`; falla el handshake TLS desde `fetch` de Node. Es la UI ASP.NET, sin API |

Contenido del CSV: **1.555 filas**, 245 principios activos distintos, 1.555
registros ISP, 69 titulares. Columnas: `N°`, `Principio Activo`, `Producto`,
`Registro`, `Titular`, `Estado`, `Vigencia`, `Uso / Tratamiento`.

Cobertura contra el corpus de esta auditoría:

| Principio activo | Filas en el dataset |
|---|---:|
| **AMBROXOL** | **0** |
| DICLOFENACO | 1 |
| LOSARTAN | 3 |
| CETIRIZINA | 14 |
| OMEPRAZOL | 18 |
| AMOXICILINA | 19 |
| PARACETAMOL | 30 |
| IBUPROFENO | 46 |

**Conclusiones (documentadas, no decididas):**

1. La fuente **no es un registro de medicamentos**: es el listado de productos
   con **equivalencia terapéutica demostrada**. No contiene el universo de
   productos, ni concentración, ni forma farmacéutica como campos separados —
   `Producto` es texto libre (`"PLENICA 75 CÁPSULAS 75 mg"`), el mismo problema
   de parsing que ya se tiene.
2. **No puede poblar identidades canónicas.** Cobertura 0 en el principio activo
   que motiva este ticket.
3. **No es una fuente viva**: snapshot congelado en 2016, con la API vacía.
4. Lo que **sí** habilitaría, y a bajo costo: **capturar el Registro ISP en la
   ingesta**. Dr. Simi (campo `"Registro Sanitario"` del JSON VTEX) y Farmex
   (link `RegistroISP=F-####/##` en el HTML de `body`) **ya lo exponen en la
   respuesta que hoy se consume y se descarta al mapear**. AraucoMed, Sermecoop
   y EasyFarma lo exponen en la ficha de detalle (una petición extra por
   producto — riesgo sobre scrapers frágiles, R-009). Cruz Verde, EcoFarmacias,
   Salcobrand y Ahumada no lo exponen.

   Un `ispRegistration` capturado sería el **primer identificador fuerte** del
   sistema: dos ofertas con el mismo número de registro son el mismo Producto
   Medicinal Comercial, sin heurística, sin vocabulario y sin riesgo de falso
   positivo. Cobertura calculada sobre el reparto real de ofertas del corpus
   (`analysis/offers.json`): Dr. Simi (117) + Farmex (113) = **230 de 1.634
   ofertas, 14,1 %** sin ninguna petición de red adicional; hasta **717 ofertas,
   43,9 %** sumando AraucoMed, EasyFarma y Sermecoop, que lo exponen solo en la
   ficha de detalle.

5. Alternativas no evaluadas en profundidad y que **requieren decisión** antes
   de investigarse: GTIN/EAN por producto (CF-SEARCH-001 §11 ya observó que
   EcoFarmacias y Farmex publican el mismo EAN-13 para el mismo losartán),
   código ATC, y un catálogo maestro propio curado (`source: 'curated'` ya
   previsto en la tabla `medications` de RFC-002).

> `NEEDS_DECISION`: el estado de la fuente ISP contradice lo registrado en
> `DECISION_LOG.md` (2026-07-31) y es la premisa del ítem **"Sprint B —
> Bioequivalentes"** del `MASTER_BACKLOG.md`, hoy 🔴 bloqueado. Corresponde a
> Mario/ChatGPT decidir si se actualiza esa entrada. No se modificó ningún
> documento de gobierno en esta auditoría.

---

## 4. Resumen de la brecha

| Entidad EDM | ¿Existe como identidad? | ¿Existe como atributos? | Brecha |
|---|---|---|---|
| Concepto Farmacéutico | ❌ | Parcial (concentración estructurada pero inerte) | **Alta** |
| Presentación Farmacéutica | ❌ | Parcial (cantidad y volumen legibles pero fuera de la clave) | **Alta** |
| Producto Medicinal Comercial | Aproximada (`presentationKey`) | Parcial (marca con dos verdades; ISP en 0 %) | **Alta** |
| Oferta | ❌ (sin ID propio) | ✅ (canales y precio bien modelados) | **Media** |

**El motor v1 no implementa el EDM. Implementa una aproximación por
concatenación de texto que colapsa los cuatro niveles en dos cadenas, una de las
cuales está congelada por persistencia y la otra hace además de identificador de
URL.**
