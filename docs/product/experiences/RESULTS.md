# RESULTS — Experiencia de Resultados, materializada (PRODUCT-002)

**Naturaleza de este documento:** comportamiento del producto, no implementación. Ningún fragmento de este documento es React, CSS o Tailwind — describe qué debe ver, comprender y poder hacer una persona en la pantalla de Resultados, y cómo se ve eso aplicando la identidad visual y los Signature Components ya cerrados en Fase 1. No reabre `docs/product/RESULTS_EXPERIENCE.md` — lo consume. No reabre Brand, color, tipografía, Signature Components ni Home. No propone funcionalidades nuevas: todo lo que describe usa capacidades que ya existen hoy en `mobile/src/app/results.tsx`, `MedicationListItem.tsx`, `FilterSheet.tsx`, `PriceChannelSheet.tsx` y el contrato de datos de `packages/domain`.

Mockups en `docs/product/assets/results-experience/`.

---

## 0. Punto de partida — qué es realmente un "resultado" en esta pantalla

Antes de diseñar nada, una corrección necesaria sobre la unidad de la pantalla. `docs/product/RESULTS_EXPERIENCE.md` §4.2 define un resultado como "la constatación... de que un medicamento existe... a través de una farmacia específica." Pero la pantalla de Resultados no lista farmacias — lista **medicamentos encontrados** (`MedicationResult[]`, agrupados por `matchKey`), y cada fila resume, sin ocultarla, la mejor alternativa disponible para ese medicamento. La comparación entre farmacias para un medicamento específico ya tiene su lugar propio: la Ficha del medicamento (`docs/product/MEDICATION_DETAIL_EXPERIENCE.md`, materializada visualmente en `docs/design/assets/brand-experience/05_medication_detail.png`).

Esta distinción es la base de todo lo que sigue. Diseñar Resultados como si cada fila comparara farmacias (como sugería, de forma solo ilustrativa, el mockup `04_results.png` de `BRAND_EXPERIENCE_V1.md`) contradiría la estructura real del producto y generaría ruido exactamente donde el principio de Comparabilidad (`RESULTS_EXPERIENCE.md` §4.4) exige claridad. Los mockups de este documento reemplazan esa referencia ilustrativa por la estructura real.

---

## 1. Vista de resultados — jerarquía, agrupación, orden, escaneo

Cada fila es un medicamento encontrado. Dentro de la fila, en orden de peso visual:

1. **Precio y farmacia de la mejor alternativa** (Price Block, escala Primary) — la respuesta más directa a "¿cuánto me cuesta y dónde?", información de mayor jerarquía según `RESULTS_EXPERIENCE.md` §4.5.
2. **Nombre del medicamento y laboratorio** — confirma "¿es esto lo que busqué?" (§4.3), pero no compite en peso con el precio.
3. **Disponibilidad en otras farmacias** (puntos de color, uno por farmacia donde también existe, ya implementado en `results.tsx`) — hace visible que existen más alternativas sin forzar a leerlas una por una.
4. **Ahorro potencial** (Savings Arc compacto) — desarrollado en la sección 4.
5. **Badges de contexto** (Bioequivalente, si aplica) — nunca compiten con el precio.

Orden de la lista: por precio ascendente (mejor alternativa primero) o alfabético, según el criterio ya existente en `filterStore.sortBy` — este documento no agrega un tercer criterio. Agrupación: ninguna agrupación adicional a la que ya produce la deduplicación por `matchKey` (`CLAUDE.md`, "Deduplicación") — cada fila ya representa una unidad de necesidad distinta, nunca dos tamaños de envase mezclados.

**Escaneo visual:** la lista debe poder recorrerse verticalmente leyendo solo la columna de precios (siempre alineada a la derecha, cifras tabulares — Price Block) sin necesitar leer el nombre de cada medicamento para orientarse.

## 2. Comparación sin ruido visual

La comparación entre medicamentos de una misma búsqueda ocurre por yuxtaposición vertical de Price Blocks alineados — nunca por una tabla con columnas repetidas por farmacia, que multiplicaría la cantidad de datos visibles por nueve y contradiría el principio de Claridad. La comparación entre farmacias para un mismo medicamento ocurre en dos niveles, no uno:

- **De un vistazo, en la fila:** los puntos de disponibilidad ya comunican "existen N alternativas más" sin mostrar sus precios — suficiente para decidir si vale la pena mirar más.
- **En detalle, en la Ficha:** la comparación completa (Comparison Card por farmacia, `docs/design/SIGNATURE_COMPONENTS.md` §6) vive en `MEDICATION_DETAIL_EXPERIENCE.md`, no se duplica aquí.

## 3. Precio — protagonista, lenguaje oficial de BRAND-002

Cada fila usa Price Block (`SIGNATURE_COMPONENTS.md` §3) en escala Primary para el precio de la mejor alternativa: cifras tabulares, símbolo `$` a 60% del tamaño de la cifra, sin decimales, punto de miles. Ningún otro texto de la fila puede compartir su tamaño o peso — ni el nombre del medicamento, ni el nombre de la farmacia.

## 4. Ahorro — que se sienta, no solo se muestre

`MedicationResult.prices` ya contiene, para cada medicamento, el precio de todas las farmacias donde existe (`packages/domain`), ordenado ascendente por `channels.effective`. Ese dato ya está disponible hoy y no se usa visualmente en la lista — esta experiencia lo activa: cuando existen dos o más alternativas, la fila muestra un Savings Arc compacto (`SIGNATURE_COMPONENTS.md` §1) comparando el precio más bajo contra el más alto disponible para ese mismo medicamento, con el monto exacto de ahorro al lado. No es una cifra nueva ni un cálculo nuevo — es la misma resta que ya se puede hacer manualmente hoy, hecha visible en el lugar donde ayuda a decidir. Cuando solo existe una alternativa, el arco no aparece — no hay nada que ahorrar comparando una sola opción, y mostrar un arco vacío sería ruido, no información.

## 5. Canales — representación sin depender del texto

La fila de resultados no necesita desplegar los cuatro canales de precio de cada farmacia — eso es información de la Ficha. Lo que sí necesita, y hoy no comunica, es si la mejor alternativa mostrada requiere un mecanismo específico (por ejemplo, una tarjeta de fidelización) para obtener ese precio. Cuando el precio mostrado proviene de un canal distinto al presencial, la fila lo indica con el mismo glifo de Channel Bar (`SIGNATURE_COMPONENTS.md` §2) correspondiente — Presencial, Online, Tarjeta (con el punto de esquina T.Más/Fonasa/Plus) o SBPay — junto al precio, nunca con una palabra adicional. Esto es consistente con `RESULTS_EXPERIENCE.md` §4.3: "un precio sin su mecanismo de acceso no es información comparable."

## 6. Contexto — solo lo que ayuda a decidir

Se muestra: nombre, laboratorio, precio, farmacia, canal (si no es presencial), disponibilidad en otras farmacias, ahorro (si aplica), bioequivalencia (si aplica). Se elimina cualquier dato decorativo que ya no aporte a las cinco preguntas de la sección de Criterios de éxito — en particular, no se repite la imagen del producto a gran tamaño (ya disponible en la Ficha) ni se listan los nueve nombres de farmacia cuando los puntos de color ya comunican cuántas existen.

## 7. Acciones — el mejor lugar es el que ya existe

Hoy, la fila completa de un resultado es una única superficie de toque que navega a la Ficha (`MedicationListItem.tsx`, `handlePress` → `/medication`) — no existen, ni deben inventarse en este sprint, botones de favorito, alerta, compartir o histórico dentro de la fila de resultados; esas cuatro acciones ya viven, hoy, en la Ficha del medicamento (`CLAUDE.md`: favoritos con corazón en la tarjeta de Home y en la Ficha, alertas y compartir en el detalle, histórico de precios en el detalle). Diseñarlas de nuevo aquí, dentro de la fila, dividiría la atención de la persona en el momento exacto en que todavía está comparando, no decidiendo — contradiría el Principio de producto 4, "cada pantalla debe resolver un problema específico." **El mejor lugar para esas cuatro acciones es la Ficha, no la fila de resultados** — la única acción de Resultados es "Ver detalle," y ya está resuelta: toda la fila es el botón.

## 8. Estados especiales

- **Sin resultados.** No es un estado propio de esta experiencia — pertenece a `docs/product/SEARCH_EXPERIENCE.md` §4.6 y ya está resuelto en producto por `EmptyState.tsx` (búsqueda con sugerencias de reintento). Este documento no lo rediseña; lo hereda.
- **Sin stock.** Un medicamento cuya mejor alternativa tiene `hasStock: false` (`packages/domain`, ya existe en el contrato de datos) debe mostrarse igual — nunca ocultarse — con el precio atenuado (Price Block en escala Secondary) y una nota de "sin stock" en vez del botón implícito de disponibilidad, para no repetir el incidente ya documentado de un medicamento agotado mostrado como disponible (`RESULTS_EXPERIENCE.md` §4.3, citando `docs/product/DECISION_LOG.md`, 2026-07-31).
- **Precio actualizado.** Cuando el precio mostrado es muy reciente, una nota discreta de antigüedad ("actualizado hace 2 h", usando `scrapedAgo()` ya existente en `mobile/src/lib/formatters.ts`) refuerza la confianza sin necesitar ningún dato nuevo.
- **Promoción / canal con descuento.** No existe, ni debe inventarse, una "promoción" pagada o editorial — sería contrario a la Neutralidad (`RESULTS_EXPERIENCE.md` §4.8, "nunca venderemos una posición privilegiada"). Lo que sí existe es un canal de precio más bajo que el presencial (tarjeta de fidelización, por ejemplo) — se representa con el glifo de Channel Bar de la sección 5, nunca con lenguaje de "oferta" o "promo."
- **Múltiples alternativas.** Los puntos de disponibilidad (sección 1, punto 3) más el Savings Arc (sección 4) son la respuesta — nunca una tabla expandida dentro de la lista.
- **Diferencias mínimas de precio.** Cuando el ahorro entre la mejor y la peor alternativa es menor a un umbral perceptible (por ejemplo, bajo $100), el Savings Arc simplemente no se activa (mismo criterio de la sección 4: sin ahorro relevante, sin arco) — el sistema no decide por la persona si vale la pena o no cambiar de farmacia; solo deja de insistir visualmente en una diferencia que no ayuda a decidir, consistente con `RESULTS_EXPERIENCE.md` §4.8: "los resultados ayudan a decidir, nunca deciden por el usuario."

## 9. Responsive — mismo lenguaje, misma jerarquía

Desktop, tablet y mobile usan exactamente la misma fila (mismo orden de información, mismos Signature Components) — solo cambia cuánto espacio horizontal tiene cada elemento:

- **Desktop:** filtros en panel lateral fijo, filas a ancho completo, puntos de disponibilidad y ahorro visibles sin recorte.
- **Tablet:** mismo panel lateral, filas ligeramente más compactas.
- **Mobile:** filtros colapsados en un botón con contador (ya implementado en `results.tsx`), fila apilada verticalmente donde el precio conserva su jerarquía superior incluso con menos ancho disponible.

---

## Criterios de éxito — verificación

Un usuario nuevo, mirando cualquiera de los mockups de este documento, debe poder responder sin leer nada más:

- **¿Cuál es el mejor precio?** El Price Block de mayor jerarquía en cada fila, siempre en la misma posición.
- **¿Cuánto ahorro?** El Savings Arc, con el monto exacto, cuando existe una diferencia real.
- **¿Por qué esa alternativa es mejor?** Porque es un hecho ya calculado (`effective = min(...)`, `RESULTS_EXPERIENCE.md` §4.8) — nunca una preferencia editorial; los puntos de disponibilidad y el glifo de canal explican de dónde viene ese precio.
- **¿Qué canal me conviene?** El glifo de Channel Bar junto al precio, cuando el canal no es presencial.
- **¿Qué hago después?** Tocar la fila — toda ella es la acción "Ver detalle."

---

## Mockups

`docs/product/assets/results-experience/`: `01_desktop.png`, `02_tablet.png`, `03_mobile.png`, `04_estados_especiales.png` (sin stock, precio actualizado, canal con descuento, múltiples alternativas, diferencia mínima).

---

## Cierre

No se modificó Brand, color, tipografía, Signature Components ni Home. No se propuso ninguna funcionalidad nueva — cada comportamiento descrito usa datos y componentes de UI que ya existen hoy en el producto. No se abrieron temas nuevos fuera de los solicitados.

**Deteniéndose aquí. Esperando aprobación explícita del comité antes de continuar.**
