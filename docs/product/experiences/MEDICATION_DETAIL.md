# MEDICATION_DETAIL — Experiencia de Ficha del Medicamento, materializada (PRODUCT-003)

**Naturaleza de este documento:** comportamiento del producto, no implementación. Ningún fragmento de este documento es React, CSS o Tailwind — describe qué debe ver, comprender y poder hacer una persona en la Ficha del medicamento, y cómo se ve eso aplicando la identidad visual y los Signature Components ya cerrados en Fase 1. No reabre `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` ni `docs/product/PRICE_ALERTS_EXPERIENCE.md` — los consume. No reabre Brand, color, tipografía, Signature Components, Home, Búsqueda ni Resultados. No propone funcionalidades nuevas: todo lo que describe usa capacidades que ya existen hoy en `mobile/src/app/medication.tsx`, `PharmacyCard`, `SavingsCard`, `PriceHistoryChart.tsx`, `AlertSheet.tsx`, `favoritesStore.ts`, `alertsStore.ts` y `priceHistory.ts`.

Mockups en `docs/product/assets/medication-detail/`.

---

## 0. Punto de partida — qué resuelve esta pantalla que Resultados no resuelve

`docs/product/experiences/RESULTS.md` §7 ya concluyó que la fila de Resultados solo resuelve "Ver detalle" — favoritos, alerta, compartir e histórico "ya viven, hoy, en la Ficha del medicamento." Este documento es esa Ficha. Su función no es repetir la comparación que Resultados ya insinuó (puntos de disponibilidad, Savings Arc compacto), sino **resolverla por completo**: mostrar cada farmacia donde existe el medicamento, con cada canal de precio disponible, y dejar que la persona decida sin necesitar volver a Resultados ni abrir cada farmacia por separado.

Consistente con el encargo de este sprint: la Ficha "no debe parecer una ficha técnica. Debe parecer un centro de decisión." Lo verificable en el código real (`medication.tsx`) confirma que la estructura ya apunta en esa dirección — un banner de resumen, tarjetas por farmacia ordenables, una tarjeta de ahorro comparativo y un histórico — pero dispersa esa decisión en bloques que no comparten una jerarquía visual explícita entre sí. Esta experiencia no agrega bloques nuevos: ordena los que ya existen alrededor de las seis preguntas de los Criterios de éxito.

## 1. Identificación — ¿es exactamente el medicamento que necesito?

Antes de comparar nada, la persona debe poder confirmar que llegó al medicamento correcto. El encabezado (ya existente en `medication.tsx`) responde esto con, en orden de peso visual:

1. **Nombre canónico** (`canonicalName`) — la confirmación principal, siempre visible, nunca truncada a una sola línea si no cabe.
2. **Laboratorio** (`laboratory`), cuando existe — segunda línea, peso visual claramente menor al nombre.
3. **Badge de bioequivalencia** (`isBioequivalent`), solo cuando el dato es verdadero — nunca se muestra un badge de "no bioequivalente": ausencia de badge, no una etiqueta negativa (`MEDICATION_DETAIL_EXPERIENCE.md` §4.4, desarrollado en la sección 9 de este documento).
4. **Imagen del producto** (`imageUrl`), cuando existe y carga correctamente — apoya el reconocimiento visual, nunca sustituye al nombre como fuente de verdad.

Concentración y presentación no son campos independientes en el contrato de datos actual (`packages/domain`) — viajan implícitas en `canonicalName` y en `matchKey` (`principioActivo|dosis|cantidad`). Esta experiencia no inventa campos nuevos para separarlas: cuando `matchKey` codifica una cantidad múltiple, la Ficha ya calcula y muestra un precio por unidad (`parseUnitQty`, visible junto al precio de cada farmacia) — la misma información, hecha legible sin requerir un campo adicional.

## 2. Comparación — ¿cuál es realmente la mejor alternativa?

Cada farmacia donde el medicamento existe se muestra como una Comparison Card (`docs/design/SIGNATURE_COMPONENTS.md` §6), una por farmacia, ordenadas por el criterio que la persona elija (precio ascendente o descendente — ya implementado como tabs de orden en `medication.tsx`). La tarjeta ganadora (precio efectivo más bajo del conjunto ordenado) se distingue con el borde, la sombra y el badge "Mejor precio" que la Comparison Card ya define — nunca con un color o énfasis distinto al ya cerrado en Fase 1.

Esta comparación nunca rompe neutralidad: la tarjeta ganadora se calcula exclusivamente a partir de `channels.effective` (`effective = min(store, online, cmr, sbpay)`, contrato de `packages/domain`) — el mismo hecho ya calculado que gobierna toda comparación de precios en Resultados. Ninguna farmacia se destaca por convenio comercial, y el filtro de farmacias visibles (`filterStore`, ya existente) puede ocultar una farmacia sin que eso cambie el criterio de cuál es la ganadora entre las visibles.

Cuando solo existe una farmacia activa, no hay comparación posible — este caso se documenta como estado especial en la sección 10.

## 3. Precio — mejor, peor, promedio, diferencia, ahorro

El Price Block (`SIGNATURE_COMPONENTS.md` §3) es el elemento de mayor jerarquía dentro de cada Comparison Card: cifras tabulares, símbolo `$` a 60%, sin decimales, punto de miles — igual que en Resultados, nunca reinventado aquí. Sobre ese mismo dato, ya disponible en `sortedPrices` (`medication.tsx`), esta experiencia organiza cuatro cifras que hoy existen pero no siempre se leen juntas:

- **Mejor precio** — el Price Block en escala Primary de la tarjeta ganadora.
- **Peor precio** — el Price Block en escala Secondary de la tarjeta al final del orden ascendente.
- **Diferencia y ahorro posible** — ya calculados hoy en `medication.tsx` (`savings`, `savingsPct`) y mostrados en un bloque comparativo dedicado, con Savings Arc (`SIGNATURE_COMPONENTS.md` §1) representando visualmente el porcentaje de ahorro entre la mejor y la peor alternativa — reemplazando el layout "VS" actual por el lenguaje visual ya cerrado, sin cambiar el cálculo que lo alimenta.
- **Promedio** — el único de los cuatro que no existe todavía como cifra mostrada; se deriva del mismo arreglo `sortedPrices` ya disponible (promedio de `channels.effective` entre las farmacias activas) sin requerir ningún dato nuevo del backend. Se muestra como una referencia secundaria (Price Block escala Secondary, sin protagonismo) junto al bloque de ahorro — su función es dar contexto a "mejor" y "peor," no competir con ninguno de los dos.

Cuando existe una sola farmacia activa, no hay peor precio, promedio ni ahorro que mostrar — el bloque completo de comparación de precios no aparece (mismo criterio que Resultados: sin comparación real, sin arco ni bloque comparativo).

## 4. Canales — presencial, online, fonasa, plus, CMR, SBPay, sin depender del texto

Cada Comparison Card muestra, además del precio efectivo, los canales alternativos disponibles para esa farmacia (`channels.store`, `channels.online`, `channels.cmr`, `channels.sbpay` — ya expuestos hoy como chips en `medication.tsx`). Esta experiencia reemplaza esos chips de texto por Channel Bar (`SIGNATURE_COMPONENTS.md` §2): los cuatro glifos fijos (Presencial / Online / Tarjeta / SBPay), con el punto de esquina que distingue el sub-tipo de tarjeta (T.Más = Accent, Fonasa = Info, Plus = Warning) — la misma convención ya usada en Resultados, nunca redefinida aquí. El canal que efectivamente produjo el precio mostrado (`channelLabel`, ya calculado en `medication.tsx`) se marca dentro de la Channel Bar, no con una palabra adicional.

Cuando una farmacia no ofrece ningún canal alternativo al presencial, la Channel Bar se reduce a un único glifo activo (Presencial) — nunca se ocultan los otros tres glifos por completo, para que la ausencia de un canal sea tan visible como su presencia (consistente con `MEDICATION_DETAIL_EXPERIENCE.md` §4.9, Transparencia: "nunca ocultar lo que no aplica, mostrarlo como ausencia reconocible").

## 5. Historial — ¿conviene comprar hoy?

`PriceHistoryChart.tsx` ya existe y ya responde, con datos reales (`getPriceHistory`, hasta 14 snapshots, `AsyncStorage` con prefijo `price_history_v1_`), las tres preguntas de esta sección:

- **¿El precio está estable, bajando o subiendo?** El indicador `▼`/`▲` con el porcentaje de variación contra el primer registro visible, y el color (verde para mejora, rojo para alza) ya calculado en el componente — el mismo lenguaje de Price Break Marker (`SIGNATURE_COMPONENTS.md` §4) debe reemplazar las flechas de texto plano actuales, sin cambiar el cálculo que las produce.
- **¿Conviene comprar hoy?** Esta experiencia no responde esa pregunta con una recomendación editorial — nunca con un texto de tipo "compra ahora" o "espera" — porque eso contradiría la Neutralidad (`MEDICATION_DETAIL_EXPERIENCE.md` §4.8) y el principio ya citado en `PRICE_ALERTS_EXPERIENCE.md` §4.10: "no prometemos tener siempre la respuesta." La Ficha responde mostrando la evidencia (mínimo histórico, máximo histórico, precio de hoy, tendencia) para que la persona decida — igual que la comparación de farmacias en la sección 2, cualquier destaque debe derivar de un hecho ya calculado, nunca de una sugerencia.
- **¿Bajando o subiendo respecto a cuándo?** El componente ya lo aclara ("vs hace Nd") — este documento conserva esa referencia temporal explícita porque sin ella una variación porcentual no es información comparable (mismo criterio que canales en Resultados §5: "un precio sin su mecanismo de acceso no es información comparable" — aquí, un precio sin su punto de comparación temporal).

Esta experiencia reemplaza las barras grises/verdes actuales por Sparkline (`SIGNATURE_COMPONENTS.md` §5): línea de 2px, segmentos Neutral-300 para tramos estables, Success/Warning para caída/alza, puntos únicamente en los puntos reales de cambio de precio — no se inventa ningún dato adicional al ya registrado por `recordPriceSnapshot`.

Cuando existe menos de un día de historial (`data.length < 2`), el estado ya resuelto en el componente ("Empezamos a registrar el historial... vuelve en tu próxima visita") se conserva sin cambios de fondo — documentado como estado especial en la sección 10, no rediseñado aquí, consistente con "no inventar datos, solo usar información disponible."

## 6. Alertas — "¿quieres que te avisemos cuando baje?"

`AlertSheet.tsx` ya resuelve crear, editar y eliminar una alerta en una única superficie (bottom sheet), y ya sigue, sin que este documento necesite pedirlo de nuevo, los principios centrales de `PRICE_ALERTS_EXPERIENCE.md`:

- **Relevancia (§4.4):** el precio objetivo se sugiere automáticamente 10% bajo el precio actual (`Math.round(currentPrice * 0.9)`) — un punto de partida razonable, nunca un compromiso; la persona puede ajustarlo libremente antes de confirmar.
- **No Intrusión (§4.11):** la alerta nunca se ofrece de forma interruptiva — el ícono de campana en el encabezado (`notifications-outline` / `notifications` según exista o no una alerta activa) es la única invitación, consistente con "una alerta nunca debe competir por la atención de la persona."
- **Transparencia (§4.9):** el texto de cierre del sheet ("Te avisaremos en la app cuando busques este medicamento y el precio baje del objetivo") ya comunica con honestidad el mecanismo real — no promete una notificación push que el producto no envía; esta experiencia conserva esa redacción exacta porque ya cumple el principio, no la reescribe.
- **Editar y eliminar:** ya resueltos en el mismo sheet — si existe una alerta (`existing`), el botón principal cambia de "Crear alerta" a "Actualizar alerta," y aparece un botón secundario "Eliminar alerta." Esta experiencia no agrega una pantalla ni un flujo distinto para editar: la misma superficie de creación ya sirve para editar, sin necesitar duplicarla.

El estado de la campana en el encabezado (activa vs. inactiva) es, en sí mismo, la respuesta visible a "¿tengo una alerta en este medicamento?" sin necesitar abrir el sheet para saberlo — consistente con `MEDICATION_DETAIL_EXPERIENCE.md` §4.5, Comprensión: "una persona debe poder confirmar su estado sin una acción adicional cuando ese estado ya está disponible."

## 7. Favoritos — sin competir con la acción principal

`favoritesStore.ts` ya resuelve agregar y quitar de favoritos con una única función (`toggle`), y `medication.tsx` ya la expone como un ícono de corazón en el encabezado, al mismo nivel visual que alerta, carrito y compartir — nunca como un botón de mayor peso que la propia decisión de comparar precios. Esta experiencia conserva esa posición y ese peso relativo: favoritos es una utilidad de conveniencia (volver a encontrar este medicamento después, ya resuelto en Home con la sección horizontal de favoritos, `CLAUDE.md`), no una decisión de compra, y no debe competir visualmente con el Price Block ni con la Comparison Card ganadora.

## 8. Compartir — como acción natural

`Share.share` ya produce el formato exacto que pidió este sprint: `"{canonicalName} — desde {formatCLP(bestPrice)} en {pharmacyName} | ComparaFarma"` (`handleShare`, `medication.tsx`) — el mismo formato documentado en `CLAUDE.md` ("Medicamento — desde $X en Farmacia (Canal)"). Esta experiencia conserva el ícono de compartir en el encabezado, al mismo nivel que favoritos y alerta — una acción disponible en todo momento, nunca un paso obligatorio ni una interrupción modal; "natural" aquí significa exactamente eso: siempre accesible, nunca insistente.

## 9. Información — solo lo útil

Se muestra: nombre, laboratorio, bioequivalencia (solo si es verdadera), imagen, precio por farmacia con su canal, disponibilidad (`hasStock`), antigüedad del dato (`scrapedAgo`, ya existente), mejor/peor/promedio/ahorro cuando hay más de una farmacia, historial cuando existe al menos un registro. Se elimina cualquier dato que no responda a una de las seis preguntas de los Criterios de éxito.

El caso más delicado de esta sección es la bioequivalencia, ya señalado como el "estado más importante" de esta experiencia en `MEDICATION_DETAIL_EXPERIENCE.md` §4.4 y §4.6: el campo real (`isBioequivalent`, `packages/domain`) es booleano, no de tres estados, y está hardcodeado en `false` en al menos dos de las nueve farmacias (documentado en `docs/product/DECISION_LOG.md`, 2026-07-31). Esta experiencia no inventa un campo nuevo para resolverlo — sería exactamente la funcionalidad nueva que este sprint prohíbe — pero sí aplica el criterio cualitativo que la propia experiencia de principios ya exige: el badge "Bioequivalente" solo aparece cuando el dato es `true`, y su ausencia nunca debe leerse, ni en el diseño ni en ningún texto de apoyo, como "no es bioequivalente" — es, hoy, información no determinada, no un hecho negativo. Ningún texto de esta Ficha puede afirmar lo contrario mientras el contrato de datos siga siendo booleano.

## 10. Estados especiales

- **Sin stock.** `hasStock: false` en una Comparison Card no la oculta — se muestra con el precio en escala Secondary y una nota de "Sin stock" en vez del botón "Ver en farmacia," igual que ya resuelve `medication.tsx` hoy. Mismo criterio que `RESULTS_EXPERIENCE.md` §8: nunca ocultar un medicamento agotado, mostrarlo atenuado.
- **Solo una farmacia.** Ya resuelto en `medication.tsx` con un aviso ambar ("Otras farmacias pueden tener esta molécula en distinta presentación..."). Sin comparación posible, la sección 2 y el bloque de ahorro de la sección 3 no aparecen — no hay "mejor" ni "peor" con un solo dato.
- **Múltiples canales.** Ya resuelto por la Channel Bar de la sección 4 — ningún canal se oculta, cada uno visible con su glifo propio.
- **Sin historial.** El estado ya resuelto en `PriceHistoryChart.tsx` (menos de 2 registros) se conserva — "empezamos a registrar," nunca un espacio vacío sin explicación. Este es, en términos de `SIGNATURE_COMPONENTS.md` §7, el mismo motivo del Empty State (anillo abierto sin arco de progreso, "esperando datos") aplicado al histórico.
- **Precio recién actualizado.** `scrapedAgo(fetchedAt)`, ya existente, es suficiente — no requiere un badge adicional de "actualizado," solo la marca de tiempo visible en cada Comparison Card.
- **Medicamento nuevo.** No existe, en el contrato de datos actual, un campo que distinga un medicamento recién agregado al catálogo de uno que ya existía — este documento no inventa uno. Si en el futuro se necesitara, seguiría el mismo criterio ya aplicado a bioequivalencia: reconocer explícitamente la ausencia del dato, nunca simular su presencia.
- **Medicamento descontinuado.** Mismo caso: no existe un campo `discontinued` en `packages/domain`. Hoy, un medicamento sin resultados en ninguna de las nueve farmacias simplemente no aparece — esta Ficha no puede, ni debe inventar, distinguir "descontinuado" de "sin stock en este momento" sin ese dato.
- **Error de carga.** Ya resuelto: cuando `matchKey` no corresponde a ningún resultado en `searchStore`, `medication.tsx` muestra una pantalla dedicada ("Medicamento no encontrado," con botón "Volver") — este documento conserva ese comportamiento sin modificarlo.

## 11. Responsive

Desktop, tablet y mobile comparten exactamente el mismo orden de información y los mismos Signature Components — solo cambia la distribución espacial:

- **Desktop:** encabezado e identificación en una franja superior de ancho completo; Comparison Cards en una cuadrícula de dos columnas cuando hay más de dos farmacias, permitiendo comparar visualmente varias tarjetas sin desplazamiento vertical excesivo; bloque de ahorro e historial en una columna lateral fija, siempre visibles junto a las tarjetas.
- **Tablet:** misma estructura que desktop con una sola columna de Comparison Cards cuando el ancho no permite dos sin comprimir el Price Block.
- **Mobile:** exactamente la estructura ya implementada en `medication.tsx` — encabezado compacto con los cuatro íconos de acción, banner de resumen, tabs de orden, Comparison Cards apiladas verticalmente, bloque de ahorro y, al final, historial — el precio conserva su jerarquía superior en cada tarjeta incluso con el ancho reducido.

---

## Criterios de éxito — verificación

Después de mirar esta pantalla menos de un minuto, una persona debe poder responder:

- **¿Dónde compro?** La Comparison Card marcada como "Mejor precio," siempre en la posición de mayor jerarquía cuando el orden es ascendente.
- **¿Cuánto ahorro?** El bloque de ahorro con Savings Arc (sección 3), con el monto exacto entre la mejor y la peor alternativa activa.
- **¿Por qué esa alternativa es mejor?** Porque es un hecho ya calculado (`effective = min(...)`) — nunca una preferencia editorial; la Channel Bar de cada tarjeta explica de qué canal proviene ese precio.
- **¿Necesito una tarjeta?** La Channel Bar de la tarjeta ganadora lo muestra con su glifo — sin necesitar leer texto adicional.
- **¿Conviene esperar?** El histórico (Sparkline + mínimo/máximo/tendencia) entrega la evidencia — esta experiencia nunca responde por la persona, consistente con la Neutralidad ya cerrada en `MEDICATION_DETAIL_EXPERIENCE.md` §4.8.
- **¿Quiero crear una alerta?** El ícono de campana en el encabezado, con su estado activo/inactivo visible de inmediato, y el sheet de creación/edición a un toque de distancia.

---

## 12. Auditoría de jerarquía visual (post-materialización)

Auditoría exclusivamente de percepción visual sobre los mockups de Desktop/Tablet/Mobile — qué se ve primero en los primeros 3 segundos, qué compite, qué pesa de más o de menos. No modifica Brand, color, tipografía, Signature Components ni comportamiento: solo jerarquía, espaciado, escala, agrupación y composición.

**Diagnóstico (estado previo a esta auditoría).** El header de identificación (nombre del medicamento, 16px en negrita, arriba de todo) era, por posición y contraste, lo primero que el ojo encontraba — no el precio ni el ahorro. El precio del mejor resultado aparecía duplicado en dos lugares con tratamientos distintos (dentro de la Comparison Card ganadora y en un bloque lateral "Mejor vs. peor precio"), dividiendo la atención en vez de reforzarla. Dentro de ese bloque lateral, "Mejor precio", "Promedio" y "Peor precio" competían con un peso casi idéntico, en vez de leerse como un ganador con dos referencias subordinadas. El ahorro — la cifra que más debe pesar según los principios de esta experiencia — tenía el mismo rango visual que "Peor precio" (la opción que el usuario no debe elegir). Las 3 farmacias no ganadoras tenían casi el mismo tamaño y peso que la ganadora, compitiendo con ella en vez de retroceder claramente.

**Corrección aplicada.** Se fusionaron el banner de resumen y el bloque "Mejor vs. peor precio" en un único bloque héroe, de ancho completo y ubicado primero en la pantalla (antes del header de identificación), con Price Block en escala `display` para el precio ganador y para el monto de ahorro — ambos en el mismo rango de escala, agrupados para reforzarse en vez de competir — y el Savings Arc en su tamaño más grande ya definido. Promedio y peor precio pasan a ser una sola línea de texto corrido, subordinada, al pie del bloque héroe. El header de identificación se redujo de escala (nombre, íconos y espaciado más chicos) para que quede claramente por debajo del héroe en la jerarquía. La farmacia ganadora se separa de "Otras farmacias" con un espacio deliberadamente mayor y un rótulo propio, para que las perdedoras se lean como un solo bloque secundario. El historial se mantiene, pero más chico y después de la comparación en el orden de lectura. En mobile, el héroe pasa a una composición apilada (precio arriba, ahorro abajo) en vez de dos columnas, para no recortarse en el ancho angosto.

**Verificación:** en los tres tamaños, lo primero que se ve ahora es el precio y el ahorro, en verde, con más espacio en blanco alrededor que cualquier otro bloque de la pantalla — ningún otro elemento alcanza su escala ni su aislamiento.

---

## Mockups

`docs/product/assets/medication-detail/`: `01_desktop.png`, `02_tablet.png`, `03_mobile.png`, `04_historial.png`, `05_alertas.png`, `06_estados_especiales.png` (sin stock, solo una farmacia, sin historial, error de carga), `07_comparacion_completa.png`. Desktop/Tablet/Mobile actualizados con la corrección de jerarquía de §12.

---

## Cierre

No se modificó Brand, color, tipografía, Signature Components, Home, Búsqueda ni Resultados. No se propuso ninguna funcionalidad nueva — cada comportamiento descrito usa datos y componentes de UI que ya existen hoy en el producto (`medication.tsx`, `PriceHistoryChart.tsx`, `AlertSheet.tsx`, `favoritesStore.ts`, `alertsStore.ts`, `priceHistory.ts`, `Share.share`). No se abrieron temas nuevos fuera de los solicitados. Se reconoció explícitamente, sin resolverla, la limitación real y ya documentada de `isBioequivalent` (sección 9).

**Deteniéndose aquí. Esperando aprobación explícita del comité antes de continuar.**
