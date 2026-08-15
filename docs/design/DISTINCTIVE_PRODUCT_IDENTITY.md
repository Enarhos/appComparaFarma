# DISTINCTIVE_PRODUCT_IDENTITY — Sistema Visual Propio de ComparaFarma (BRAND-002)

**Naturaleza de este documento:** no es teoría de marca ni un nuevo benchmark. No rediseña la Propuesta A (Precision), no cambia la dirección visual "Intelligence", no toca color, tipografía, layout general ni navegación. Es la respuesta a una sola pregunta: **¿qué hace que una pantalla de ComparaFarma sea reconocible como ComparaFarma, incluso sin ver el logo ni el nombre?** Hoy la respuesta es "nada" — este documento propone el sistema que la cambia.

No se generaron nuevos mockups, ninguna paleta nueva ni ningún benchmark. El diagnóstico se apoya en los assets ya existentes de `docs/design/assets/visual-exploration/proposal_A_*` (Propuesta A seleccionada) y `docs/design/assets/brand-experience/` (materialización BRAND-001). El sistema propuesto se apoya, sin contradecirlas, en `docs/brand/ICONOGRAPHY_SYSTEM.md` (nueve categorías funcionales, relación con el isotipo) y `docs/design-system/COMPONENT_LIBRARY.md` (familias de componentes, principio de Neutralidad, criterio de "hecho ya calculado").

---

## 1. Diagnóstico crítico — por qué la Propuesta A todavía no es memorable

La Propuesta A resuelve correctamente la dirección "Intelligence": es clara, ordenada, con jerarquía de datos legible. Pero revisada sin el header (sin isotipo ni wordmark), cada pantalla podría pertenecer a cualquier producto SaaS de 2026. Elementos concretos, tomados de los mockups ya existentes:

| Elemento en Propuesta A | Por qué es genérico |
|---|---|
| Tarjetas de métrica con barra de color a la izquierda (Ahorro, Farmacias activas, Alertas) | Es el patrón de stat card más usado en dashboards SaaS (Stripe, Linear, y decenas de plantillas de UI kit) desde antes de 2020. No comunica nada específico de comparar precios de medicamentos. |
| Badges tipo píldora con texto ("Mejor precio", "Con tarjeta", "Solo online") | Correctos semánticamente, pero visualmente indistinguibles de cualquier badge de estado de cualquier tabla de cualquier producto. |
| Barra de búsqueda + botón sólido a la derecha | Layout de búsqueda más común que existe. Ningún elemento la distingue de un buscador de vuelos, de hoteles o de software. |
| Tarjetas de resultado con isotipo pequeño a la izquierda, nombre, farmacia y precio a la derecha | El precio se resuelve solo con color y peso tipográfico — el mismo recurso que usa cualquier e-commerce para destacar un número. |
| Historial de precios como gráfico de barras genérico | Un gráfico de barras de 14 valores es el componente de charting por defecto de cualquier librería (Chart.js, Recharts) sin ajustar. No distingue una subida real de precio de una variación menor. |
| Iconografía (buscar, corazón, campana, barras) | Trazo correcto y consistente, pero son los mismos cuatro símbolos que usa cualquier app con favoritos, notificaciones y un panel. |

**Conclusión del diagnóstico:** ningún elemento de la Propuesta A es incorrecto — el problema es que ninguno es **exclusivo**. La oportunidad no está en los colores ni en la tipografía (ya aprobados, no se reabren), sino en cómo el producto trata su tipo de dato más particular: precios de un mismo medicamento, en varios canales, en varias farmacias, cambiando en el tiempo. Ese dato no existe en la mayoría de los productos SaaS que definieron el lenguaje visual que hoy sentimos "genérico" — es la palanca real disponible.

---

## 2. Sistema visual propio

Seis piezas. No es una lista de ideas sueltas: las seis comparten un mismo origen conceptual — **el vano del isotipo** (el corte en el anillo de Candidato 09) entendido no como forma a copiar, sino como principio: *una figura que no se cierra del todo, porque siempre queda algo por descubrir — un precio mejor, un canal más barato, un ahorro pendiente.* Ese principio, no la forma exacta del isotipo, es lo que las seis piezas comparten. Ninguna reutiliza la geometría exacta del isotipo como ícono funcional — restricción explícita ya vigente en `ICONOGRAPHY_SYSTEM.md` §4.8, que este sistema respeta en su totalidad.

### 2.1 Arco de Ahorro (Savings Arc)

Un arco parcial (no un círculo completo, no un donut de 360°) que representa visualmente qué porción del precio más caro se está ahorrando — el arco se "abre" en proporción al ahorro real, siempre acompañado del número exacto en `$`. Nunca decorativo ni aislado: solo aparece junto al dato que representa, nunca como ilustración libre.

- **Justificación:** traduce visualmente el "hecho ya calculado" que `COMPONENT_LIBRARY.md` §4.6 ya exige como único criterio legítimo de destaque (`effective = min(...)`) — el arco no decide nada, solo hace visible una proporción que el sistema ya calculó.
- **Beneficio para el usuario:** entender el tamaño del ahorro en menos de un segundo, sin leer dos cifras y restarlas mentalmente.
- **Facilidad de implementación:** alta — un arco SVG con `stroke-dasharray` proporcional al porcentaje; ningún dato nuevo, solo una lectura visual de un cálculo que la plataforma ya hace.
- **Prioridad:** Alta.

### 2.2 Barra de Canal (Channel Bar)

Hoy el canal de precio (presencial / online / CMR-T.Más-Fonasa-Plus / SBPay) se comunica solo con texto dentro de un badge. Se propone un código visual adicional y consistente: una barra delgada de 3-4 segmentos (uno por canal existente en esa farmacia), donde el segmento correspondiente al precio mostrado se ilumina y el resto queda en gris neutro. Es el mismo dato que ya existe en `PriceChannels` — no agrega información, la hace escaneable sin leer texto.

- **Justificación:** ninguna farmacia recibe un tratamiento distinto a otra (mismo componente, misma lógica de segmentos) — cumple directamente la Neutralidad ya exigida en `COMPONENT_LIBRARY.md` §4.6 y `BRAND_FOUNDATIONS.md` §12.
- **Beneficio para el usuario:** reconoce de un vistazo cuántos canales de precio existen para ese medicamento en esa farmacia, antes de leer cuál es cuál.
- **Facilidad de implementación:** alta — se deriva 1:1 de un objeto `PriceChannels` ya existente en `packages/domain`, sin cálculo nuevo.
- **Prioridad:** Alta.

### 2.3 Bloque de Precio con cifras tabulares y "quiebre" de baja

Tratamiento único para cualquier número de precio en la plataforma: cifras siempre con alineación tabular (los dígitos ocupan el mismo ancho, para que columnas de precios comparen limpio visualmente), símbolo `$` en un peso visual menor que el número, y un marcador de "quiebre" (un pequeño trazo o punto, no una flecha genérica de stock) cuando el precio bajó respecto al último registro guardado en `priceHistory`.

- **Justificación:** el precio es el dato más importante de todo el producto y hoy compite visualmente solo con color — un tratamiento tipográfico exclusivo lo separa de cualquier número de cualquier otra pantalla.
- **Beneficio para el usuario:** comparar columnas de precios sin esfuerzo visual adicional, y detectar de inmediato si un precio bajó desde la última vez que lo vio.
- **Facilidad de implementación:** alta — `font-feature-settings: "tnum"` (u equivalente en RN) es un ajuste tipográfico, no un componente nuevo; el marcador de quiebre ya tiene el dato disponible en `priceHistory.ts`.
- **Prioridad:** Alta.

### 2.4 Sparkline de Quiebres (no de interpolación)

El historial de precios deja de dibujarse como un gráfico de barras genérico de 14 valores iguales entre sí. Se propone una línea delgada que solo marca un punto visible en los días donde el precio efectivamente cambió — los días sin cambio no generan un punto nuevo, se leen como un tramo recto. El resultado es una firma visual distinta a cualquier librería de charting usada sin ajuste.

- **Justificación:** el dato ya existe en `getPriceHistory()` (`priceHistory.ts`) — el ajuste es de lectura visual, no de datos nuevos, y comunica exactamente lo que le importa a la persona (cuándo cambió, no cuántos días pasaron).
- **Beneficio para el usuario:** distinguir en segundos si un precio es volátil o estable, algo que un gráfico de barras uniforme no comunica.
- **Facilidad de implementación:** media — requiere una regla de renderizado distinta a un chart por defecto, pero sobre los mismos datos ya disponibles.
- **Prioridad:** Media.

### 2.5 Ícono de Comparación propio ("dos trazos, un punto")

La categoría "Comparación" de `ICONOGRAPHY_SYSTEM.md` §4.2.5 es, por definición del propio documento, "la categoría más particular de ComparaFarma" y la de mayor riesgo si se resuelve con un ícono genérico (balanza literal, flechas de intercambio, carrito). Se propone un ícono exclusivo dentro de esa categoría: dos trazos horizontales de distinto largo, unidos por un punto — visualmente coherente con la proporción trazo/punto ya presente en el isotipo (anillo + punto central), sin reutilizar su forma exacta, cumpliendo `ICONOGRAPHY_SYSTEM.md` §4.4 ("coherencia con el isotipo... no significa compartir la forma exacta, significa compartir su lógica de construcción") y §4.8 (prohibición explícita de reutilizar la geometría del isotipo como ícono funcional).

- **Justificación:** hoy la categoría Comparación no tiene ningún ícono propio en los mockups existentes — se resuelve solo con tarjetas y texto. Es la categoría iconográfica con más riesgo de posicionamiento (`ICONOGRAPHY_SYSTEM.md` §4.2.5: evitar cualquier código visual de intermediación comercial) y, a la vez, la de mayor oportunidad de diferenciación real.
- **Beneficio para el usuario:** reconoce instantáneamente "esto es una comparación" sin depender del texto "Comparación entre farmacias".
- **Facilidad de implementación:** alta — un ícono nuevo, construido bajo los principios ya vigentes (§4.3-§4.4 de `ICONOGRAPHY_SYSTEM.md`), sin librería nueva ni cambio de sistema.
- **Prioridad:** Alta.

### 2.6 Estado Vacío con el motivo del "vano"

Los estados vacíos (sin resultados, sin alertas, sin favoritos) dejan de resolverse con una ilustración genérica de "caja vacía" o "lupa triste". Se propone un tratamiento propio: un contorno incompleto (el mismo principio del vano del isotipo — una figura que no se cierra) acompañado siempre de una acción de orientación ("Buscar otro medicamento", "Crear tu primera alerta"), nunca de un tono de fracaso. Coherente con `ICONOGRAPHY_SYSTEM.md` §4.2.6, que exige que incluso un aviso sobre falta de stock evite "cualquier lectura de urgencia agresiva".

- **Justificación:** un estado vacío es, hoy, el momento de menor identidad visual de cualquier producto — y el de mayor oportunidad de transmitir "Orientación", el concepto de diseño ya aprobado (`DESIGN_CONCEPT.md` §4.2), en el momento exacto en que una persona más lo necesita.
- **Beneficio para el usuario:** un estado vacío que orienta en vez de solo informar ausencia reduce la fricción de "no sé qué hacer ahora".
- **Facilidad de implementación:** media — es un patrón de contenido + un motivo gráfico simple, reutilizable en las mismas pantallas donde ya existen estados vacíos (Resultados, Favoritos, Alertas).
- **Prioridad:** Media.

---

## 3. Respuestas directas

**1. ¿Qué elementos visuales serán exclusivos de ComparaFarma?**
El Arco de Ahorro, la Barra de Canal, el ícono de Comparación de dos trazos y un punto, y el motivo del vano aplicado a estados vacíos. Ninguno existe hoy en la Propuesta A ni en ningún producto del benchmark ya aprobado (`VISUAL_BENCHMARK.md`).

**2. ¿Qué patrones repetiremos en toda la plataforma?**
El Arco de Ahorro y la Barra de Canal aparecen siempre juntos en cualquier lugar donde se muestre un precio: Home, Resultados, Ficha de medicamento, Dashboard. El Bloque de Precio con cifras tabulares se repite sin excepción en cualquier número de precio de la interfaz. El principio de "todo destaque nace de un hecho ya calculado" (§2.1, §2.2) se repite sin excepción — ningún componente decide destacar algo por sí mismo.

**3. ¿Qué hará reconocible una pantalla incluso sin mostrar el logo?**
Ninguna pieza por separado — la combinación. Un producto puede copiar un arco de progreso o una barra segmentada por separado; ninguno de los productos del benchmark combina las cuatro piezas de la sección 2 alrededor del mismo dato (un precio, en un canal, de una farmacia, en el tiempo). Esa combinación, no una pieza aislada, es la firma visual.

**4. ¿Qué componentes deben convertirse en "signature components"?**
Arco de Ahorro, Barra de Canal, Bloque de Precio (tabular + quiebre), Sparkline de Quiebres, Ícono de Comparación propio. El Estado Vacío con motivo del vano es un patrón de contenido más que un componente aislado, pero debe documentarse con el mismo nivel de obligatoriedad.

| Componente | Familia (`COMPONENT_LIBRARY.md` §4.4) | Prioridad |
|---|---|---|
| Arco de Ahorro | Información / Comparación | Alta |
| Barra de Canal | Comparación | Alta |
| Bloque de Precio (tabular + quiebre) | Información | Alta |
| Ícono de Comparación propio | Identidad (iconografía) | Alta |
| Sparkline de Quiebres | Información | Media |
| Estado Vacío — motivo del vano | Contenedores / Feedback | Media |

---

## Cierre

Este sistema no cambia la Propuesta A: la completa. No se propuso ninguna alternativa a "Intelligence", ningún color nuevo, ninguna tipografía nueva, ningún layout nuevo ni ninguna navegación nueva. Las seis piezas son extensiones puntuales, construidas sobre datos que la plataforma ya calcula (`PriceChannels`, `priceHistory`, `effective`), no sobre decisiones estéticas nuevas.

No se abrieron temas nuevos ni se propuso trabajo futuro más allá de lo solicitado en este sprint.

**Deteniéndose aquí. Esperando aprobación explícita antes de continuar.**
