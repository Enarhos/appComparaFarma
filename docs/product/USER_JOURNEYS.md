# USER_JOURNEYS — Especificación Oficial de los Recorridos Completos del Usuario de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, componentes ni layouts. No describe navegación de interfaz. No explica tecnología. No define algoritmos. No modela procesos BPM. Es la **especificación oficial de los recorridos completos del usuario**: cómo las distintas experiencias del producto se conectan para ayudar a una persona a resolver una necesidad real, desde que esa necesidad aparece hasta que queda razonablemente resuelta. Debe seguir siendo válido aunque cambie por completo la interfaz del producto, porque no gobierna esa interfaz — gobierna el significado de los recorridos que cualquier interfaz futura deberá servir.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

Este documento pertenece al dominio `docs/product/` y **cierra la PHASE 2 — Product Experience**, abierta por `docs/product/SEARCH_EXPERIENCE.md` y continuada por `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` y `PRICE_ALERTS_EXPERIENCE.md`. No redefine ninguna de esas cuatro experiencias — las conecta.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PROD-EXP-005 |
| **Nombre** | USER_JOURNEYS.md |
| **Dominio** | Product (`docs/product/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / Product Manager |
| **Rol asumido en su redacción** | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en User Journey Mapping para productos digitales de salud |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` y `PRICE_ALERTS_EXPERIENCE.md` (que este documento conecta sin redefinir), de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md`, y consume, sin redefinirla, la arquitectura ya gobernada por `docs/brand/` y `docs/design-system/` |
| **Clasificación** | Documento de Product Experience / Documento Integrador de Fase |
| **Fuente Oficial** | Este documento es la fuente oficial de **cómo se conectan las experiencias ya gobernadas de ComparaFarma dentro de un recorrido completo**: qué representa un Journey, sus principios, los Journeys oficiales del producto, sus estados y su continuidad, y cómo Neutralidad, Transparencia, Confianza, Reducción de Incertidumbre, Relevancia y Accesibilidad se sostienen a lo largo de todo un recorrido, no solo dentro de una experiencia aislada. No es fuente de ninguna pantalla, wireframe, componente, layout, navegación de interfaz o algoritmo (no creados), ni redefine ninguna de las cuatro experiencias que conecta |
| **Documentos de los que depende** | `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md`, `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md`, `DECISION_LOG.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/design-system/COMPONENT_LIBRARY.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Cierra el concepto de "Flujo" que quedó referenciado sin gobernarse en `docs/design-system/COMPONENT_LIBRARY.md` §4.5, `PATTERNS.md` §4.5 y `SCREEN_TEMPLATES.md` §4.5, §4.9 |
| **Pregunta que responde** | ¿Cómo se conectan las distintas experiencias de ComparaFarma para acompañar a una persona desde que aparece una necesidad hasta que esa necesidad queda razonablemente resuelta? |

---

## 2. Propósito

Cada una de las cuatro experiencias ya gobernadas de la PHASE 2 se detuvo, deliberadamente, antes de resolver cómo se conecta con las demás: `docs/product/SEARCH_EXPERIENCE.md` §4.7 enlazó, sin desarrollarla, la continuidad hacia resultados, detalle y alertas; `RESULTS_EXPERIENCE.md` §4.7 y `MEDICATION_DETAIL_EXPERIENCE.md` §4.7 hicieron lo mismo hacia detalle y alertas; `PRICE_ALERTS_EXPERIENCE.md` §4.7 enlazó, sin desarrollarlo, hacia "un futuro `USER_JOURNEYS.md`, que gobernará cómo el momento de recibir una alerta se combina con el resto de las experiencias del producto dentro de un objetivo completo de la persona." Este documento es esa integración pendiente: no una quinta experiencia nueva, sino el documento que explica cómo las cuatro ya existentes se combinan en la práctica para resolver necesidades reales.

Este documento también cierra una referencia que quedó pendiente, sin gobernarse, en tres documentos del dominio `docs/design-system/`: el concepto de "Flujo" —una secuencia de Pantallas que resuelve un objetivo completo de la persona— fue referenciado sin gobernarse en `COMPONENT_LIBRARY.md` §4.5, `PATTERNS.md` §4.5 y `SCREEN_TEMPLATES.md` §4.5 y §4.9, cada uno de ellos señalando explícitamente que su gobierno correspondería a la futura documentación de producto, no a un nuevo documento de ese dominio. `USER_JOURNEYS.md` es ese documento: el rol de un Journey, en el sentido de este documento, es exactamente el que esos tres documentos ya anticiparon para el "Flujo", trasladado del lenguaje de pantallas al lenguaje de experiencias que gobierna la PHASE 2.

Con la creación de este documento, los cinco documentos anticipados explícitamente en la apertura de la PHASE 2 (`docs/product/SEARCH_EXPERIENCE.md` §7: *"RESULTS_EXPERIENCE.md, MEDICATION_DETAIL_EXPERIENCE.md, PRICE_ALERTS_EXPERIENCE.md, USER_JOURNEYS.md"*) ya existen.

---

## 3. Alcance

**Este documento define:**

- Qué representa un Journey dentro de ComparaFarma, sin hablar de BPM, diagramas ni tecnología (§4.1).
- Los principios conceptuales que debe cumplir cualquier Journey — continuidad, coherencia, reducción de incertidumbre, reversibilidad, flexibilidad (§4.2).
- Los Journeys oficiales del producto, únicamente a nivel de significado, sin describir pantallas ni componentes (§4.3).
- Los estados conceptuales de un Journey, distintos de los estados técnicos de cualquier experiencia individual (§4.4).
- Cómo un Journey puede cambiar naturalmente — terminar antes, iniciar uno nuevo, detenerse voluntariamente (§4.5).
- Cómo el Journey completo mantiene Neutralidad, Transparencia y Confianza — no solo cada experiencia por separado (§4.6, §4.7, §4.8).
- Cómo cada experiencia reduce un tipo distinto de incertidumbre dentro del recorrido completo, integrando lo ya gobernado sin repetirlo (§4.9).
- Cómo el recorrido completo evita trabajo innecesario para la persona, integrando el principio de Relevancia (§4.10).
- Cómo se conserva la Accesibilidad durante todo el Journey (§4.11).

**Este documento NO define:**

- Ninguna pantalla, wireframe, componente o layout concreto. Pertenece íntegramente a `docs/design-system/`, que este documento no reinterpreta ni redefine.
- Ninguna navegación de interfaz. Este documento describe el significado de un recorrido, nunca cómo se transita entre pantallas.
- Ningún diagrama de proceso de negocio (BPM) ni ningún algoritmo. Este documento describe recorridos conceptuales, no su modelado técnico.
- Ninguna tecnología de implementación.
- Ninguna regla de negocio. Este documento no decide cuándo, con qué frecuencia o bajo qué condición numérica ocurre una transición entre experiencias — esas decisiones, si llegan a existir, pertenecen a una implementación futura, no a esta especificación.
- Ninguna de las cuatro experiencias que conecta. `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` y `PRICE_ALERTS_EXPERIENCE.md` siguen siendo, cada una, la única fuente de su propia experiencia; este documento no repite su contenido, solo explica cómo se combinan.

---

## 4. Contenido principal

### 4.1 ¿Qué representa un Journey?

Sin hablar de BPM, diagramas ni tecnología: un Journey es el arco completo de una necesidad real de una persona, desde el momento en que aparece hasta que queda razonablemente resuelta o hasta que la persona decide, por su propia voluntad, dejarla de lado. Un Journey no es una experiencia nueva ni un documento adicional de producto que la persona "atraviesa" — es la forma en que ya se combinan, en la práctica, las experiencias que ya existen: puede recorrer la Búsqueda, los Resultados, el Detalle y las Alertas en secuencia, o puede resolverse con solo algunas de ellas, según lo que la necesidad real de la persona efectivamente exija.

Un Journey, en el sentido de este documento, es exactamente el concepto que `docs/design-system/COMPONENT_LIBRARY.md` §4.5, `PATTERNS.md` §4.5 y `SCREEN_TEMPLATES.md` §4.5 ya referenciaron, sin gobernarlo, como "Flujo": una secuencia que resuelve un objetivo completo de la persona. Este documento no contradice esa referencia — la desarrolla, en el lenguaje de experiencias de producto que gobierna la PHASE 2, en vez del lenguaje de Pantallas que gobierna el Design System.

### 4.2 Principios del Journey

Cinco principios conceptuales mínimos. Ninguno es nuevo — cada uno ya está presente, de forma dispersa, en las cuatro experiencias que este documento conecta; aquí se nombran explícitamente como principios de un recorrido completo.

- **Continuidad.** Lo que la persona ya comprendió en una experiencia debe seguir siendo válido cuando entra a la siguiente, sin que tenga que volver a aprenderlo. La misma disciplina ya exigida estructuralmente entre pantallas en `docs/design-system/GRID_SYSTEM.md` §4.2.5 —que una estructura se mantenga reconocible al desplazarse entre pantallas— se extiende aquí al significado: un resultado que la persona ya entendió en `RESULTS_EXPERIENCE.md` no debería exigirle una comprensión distinta al llegar al detalle (`MEDICATION_DETAIL_EXPERIENCE.md`).
- **Coherencia.** Los mismos principios —Neutralidad, Transparencia, Confianza, Reducción de Incertidumbre, Relevancia— deben sostenerse por igual en cada experiencia del recorrido. Ningún Journey puede ser neutral en un tramo y dejar de serlo en el siguiente; desarrollado con profundidad en §4.6 a §4.10.
- **Reducción de Incertidumbre.** Cada paso de un Journey debe reducir algún tipo de incertidumbre real de la persona, nunca introducir una nueva sin resolverla. Se menciona aquí como principio; se desarrolla en profundidad, integrando las cuatro experiencias, en §4.9.
- **Reversibilidad.** La persona debe poder detenerse, volver atrás o abandonar un Journey en cualquier punto, sin penalización y sin perder lo que ya comprendió. Consistente con `docs/brand/BRAND_FOUNDATIONS.md` §15, que ya describe la personalidad del producto como *"respetuosa de la autonomía de quien decide, no manipuladora"* — citando su fuente: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir."* Aplicado aquí: tampoco empuja a continuar un recorrido que la persona ya no quiere seguir.
- **Flexibilidad.** Un Journey no es una secuencia obligatoria de pasos. Puede omitir experiencias, terminar antes de lo esperado, o iniciar uno nuevo a partir de un punto intermedio —por ejemplo, una alerta puede dar origen a un Journey nuevo sin que la persona tenga que volver a empezar por la búsqueda—. Desarrollado en la práctica en §4.5.

### 4.3 Journeys oficiales del producto

Definidos únicamente a nivel de significado — ningún paso aquí descrito es una pantalla ni un componente; cada paso es una referencia directa a un estado o experiencia ya gobernado en otro documento.

**Journey 1 — Necesidad puntual**

`Búsqueda → Resultados → Detalle → Fin`

Representa a una persona con una necesidad específica y acotada —como Daniela, que busca resolver algo concreto en poco tiempo (`docs/product/PERSONAS.md`)—. Una vez que comprende el detalle de la alternativa que le interesaba, su necesidad queda resuelta y el recorrido termina sin requerir ningún acompañamiento posterior. No pasar por una Alerta no es una omisión: es la forma correcta en que este Journey concluye, consistente con el principio de Relevancia desarrollado en §4.10.

**Journey 2 — Tratamiento permanente**

`Búsqueda → Resultados → Detalle → Alerta → Nueva revisión → Fin`

Representa a una persona con una necesidad recurrente —como Claudia, que compra los mismos medicamentos de forma permanente (`docs/product/PERSONAS.md`)—. Para esta necesidad, comprender una vez no es suficiente: la Alerta extiende el Journey en el tiempo (`docs/product/PRICE_ALERTS_EXPERIENCE.md` §4.2), y cada "Nueva revisión" es una vuelta a comprender resultados o detalle ya actualizados, no un Journey distinto que empieza de cero. Este ciclo se repite tantas veces como la necesidad siga siendo real para la persona, y termina —Fin— solo cuando la persona decide, voluntariamente, que ya no necesita seguir acompañándola (Reversibilidad, §4.2).

**Journey 3 — No encuentra resultados**

`Búsqueda → Sin resultados → Nueva búsqueda → Fin`

Representa el momento en que la búsqueda inicial no encuentra nada, un estado ya gobernado y no redefinido aquí (`docs/product/SEARCH_EXPERIENCE.md` §4.6, "Sin resultados"). Este Journey no es un fracaso del recorrido: es su capacidad de ajustarse. La persona reformula su necesidad —quizás con otro nombre, otra forma de escribirla— y el Journey continúa desde ese ajuste, no desde una experiencia distinta.

**Journey 4 — Información insuficiente**

`Resultados → Detalle → Información pendiente → Nueva consulta futura`

Representa el caso en que la necesidad de la persona no se resuelve, no porque no se haya encontrado nada, sino porque lo encontrado no puede afirmarse todavía con suficiente certeza —el estado "información pendiente de verificación" ya gobernado en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.6—. Este Journey, deliberadamente, no tiene un "Fin" limpio: queda abierto, invitando a una consulta futura. Es, de los cuatro, el que más naturalmente se conecta con una Alerta (`docs/product/PRICE_ALERTS_EXPERIENCE.md`, tipo "actualización relevante de información", §4.3) como el mecanismo que eventualmente podría cerrar esa apertura, aunque este documento no desarrolla esa conexión más allá de señalarla.

Estos cuatro Journeys son los mínimos oficiales; no agotan todas las combinaciones posibles entre las cuatro experiencias ya gobernadas, consistente con el principio de Flexibilidad (§4.2).

### 4.4 Estados del Journey

Estados conceptuales, distintos de los estados técnicos ya definidos dentro de cada experiencia individual. Un estado de Journey es una composición de esos estados ya gobernados, nunca una taxonomía nueva e independiente de ellos:

- **Journey iniciado.** La persona entró a alguno de los disparadores ya reconocidos en `docs/product/SEARCH_EXPERIENCE.md` §4.2; el recorrido existe, pero todavía no ha producido comprensión.
- **Journey en progreso.** La persona está avanzando por una o más experiencias ya gobernadas, acumulando comprensión (Reducción de Incertidumbre, §4.9).
- **Journey en pausa.** La persona se detuvo voluntariamente sin haber llegado a un cierre — consecuencia directa de la Reversibilidad (§4.2); un Journey en pausa no está roto, está esperando a que la persona decida continuar o no.
- **Journey resuelto.** La necesidad original quedó razonablemente satisfecha, como en el "Fin" de los Journeys 1 y 2.
- **Journey abierto indefinidamente.** La necesidad sigue vigente y el recorrido se mantiene activo mediante una Alerta o una consulta futura, como en los Journeys 2 y 4 — no es un estado de espera pasiva, es la forma en que un Journey permanece útil para una necesidad que no tiene, todavía, un cierre definitivo.
- **Journey abandonado.** La persona dejó el recorrido sin resolverlo y sin intención declarada de continuar. Este es un resultado legítimo, no un fracaso de la experiencia — consistente con la Reversibilidad (§4.2), forzar una resolución sería lo opuesto a respetar la autonomía de la persona.

### 4.5 Continuidad y variación natural

Este capítulo desarrolla, en la práctica, los principios de Flexibilidad y Reversibilidad ya presentados en §4.2 — la naturalidad con la que un Journey cambia de forma es la expresión concreta de esos dos principios abstractos, no un principio adicional.

- **Una búsqueda puede terminar sin detalle.** Si los resultados ya le dieron a la persona suficiente comprensión para decidir —por ejemplo, el estado "una única alternativa" ya gobernado en `docs/product/RESULTS_EXPERIENCE.md` §4.6—, profundizar en el detalle no siempre es necesario. Forzar ese paso cuando no aporta nada nuevo contradiría la Relevancia (§4.10).
- **Una alerta puede iniciar un nuevo Journey.** Cuando una alerta comunica un hecho relevante (`docs/product/PRICE_ALERTS_EXPERIENCE.md` §4.3), la persona puede volver a los resultados o al detalle con una necesidad que, aunque relacionada con la original, ya es distinta —por ejemplo, decidir entre la alternativa que ya conocía y la nueva que la alerta le hizo conocer. Esto no rompe la Continuidad (§4.2): el nuevo Journey hereda todo lo que la persona ya comprendió del anterior, no empieza desde cero.
- **Un Journey puede detenerse voluntariamente en cualquier punto.** Ninguna experiencia de las cuatro ya gobernadas exige que la persona la complete antes de abandonarla — la Reversibilidad (§4.2) aplica en cada tramo del recorrido, no solo al final.

### 4.6 Neutralidad

Decimocuarta aplicación transversal del mismo principio ya desarrollado en cada una de las cuatro experiencias que este documento conecta (`docs/product/SEARCH_EXPERIENCE.md` §4.8, `RESULTS_EXPERIENCE.md` §4.8, `MEDICATION_DETAIL_EXPERIENCE.md` §4.8, `PRICE_ALERTS_EXPERIENCE.md` §4.8), pero aplicada aquí a un nivel distinto: **el Journey completo debe ser neutral, no solo cada experiencia por separado.**

Es posible que cada experiencia individual sea, en sí misma, neutral, y que el recorrido completo deje de serlo por cómo esas experiencias se combinan — por ejemplo, si la frecuencia o el momento en que una "Nueva revisión" (Journey 2) se sugiere a la persona estuviera calibrado para favorecer sistemáticamente cuándo conviene a una farmacia que la persona vuelva a mirar, en vez de cuándo realmente cambió algo relevante para ella. Ninguna decisión sobre cómo se combinan las experiencias de un Journey —cuándo iniciar uno nuevo, cuándo sugerir una revisión, cuándo un Journey se considera abierto indefinidamente— puede depender de un interés comercial ajeno al de la persona que lo recorre. Este documento no define esas decisiones (pertenecen a una implementación futura, §3), pero sí exige que, cuando existan, respeten la misma Neutralidad ya exigida a cada experiencia individual, ahora también en su conjunto.

### 4.7 Transparencia

La Transparencia de un Journey no se agota en que cada experiencia individual sea honesta por separado (`docs/product/RESULTS_EXPERIENCE.md` §4.9, `MEDICATION_DETAIL_EXPERIENCE.md` §4.9, `PRICE_ALERTS_EXPERIENCE.md` §4.9) — exige, además, que la historia se mantenga consistente de principio a fin. Si algo que la persona comprendió en una experiencia cambia antes de llegar a la siguiente —por ejemplo, un precio visto en los Resultados que ya no es el mismo al llegar al Detalle—, ese cambio debe reconocerse explícitamente en el momento en que ocurre, nunca dejarse como una contradicción silenciosa entre dos partes del mismo recorrido. La confianza de un Journey depende tanto de que cada paso sea transparente como de que ningún paso contradiga, sin explicación, lo que un paso anterior ya estableció.

### 4.8 Confianza

La Confianza de un Journey se construye durante múltiples interacciones, no dentro de una sola sesión. Esto es especialmente cierto para los Journeys que se extienden en el tiempo mediante Alertas (Journey 2, Journey 4) — el mismo patrón real de uso ya identificado en Claudia, que "siempre compra los mismos medicamentos" (`docs/product/PERSONAS.md`), implica una relación con el producto que se sostiene durante semanas o meses, no en una sola visita.

Esta confianza de largo plazo se construye exactamente de la misma forma en que `docs/product/RESULTS_EXPERIENCE.md` §4.9 y `MEDICATION_DETAIL_EXPERIENCE.md` §4.10 ya la describen dentro de una sola experiencia, pero acumulada a lo largo de un Journey: cada vez que un error de datos se identificó y se corrigió abiertamente —como ya ocurrió en la práctica real del producto (`docs/product/DECISION_LOG.md`, 2026-07-23 y 2026-07-31)—, y cada vez que una incertidumbre se comunicó en vez de ocultarse, se sostiene un poco más la disposición de la persona a seguir confiando en la siguiente interacción del mismo Journey. La Confianza de un Journey no es la suma de interacciones perfectas — es la evidencia acumulada de que, cuando algo no estuvo claro o resultó incorrecto, el producto lo reconoció.

### 4.9 Reducción de Incertidumbre

Nombrado por primera vez como principio explícito en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §2, este principio se integra aquí, sin repetir lo ya desarrollado en cada experiencia, como la lógica que conecta a las cuatro dentro de un mismo Journey:

- La **Búsqueda** reduce la incertidumbre de si existe algo que buscar (`docs/product/SEARCH_EXPERIENCE.md` §4.5, §4.6).
- Los **Resultados** reducen la incertidumbre de cuáles alternativas son reales y cómo se comparan entre sí (`RESULTS_EXPERIENCE.md`, capítulos 4.2 a 4.5).
- El **Detalle** reduce la incertidumbre de si dos alternativas son verdaderamente equivalentes, y comunica con honestidad lo que todavía no puede afirmarse (`MEDICATION_DETAIL_EXPERIENCE.md` §4.4).
- Las **Alertas** extienden esa reducción de incertidumbre en el tiempo, comunicando solo lo que cambia de forma relevante (`PRICE_ALERTS_EXPERIENCE.md` §4.3 a §4.5).

Un Journey completo, en este sentido, no es más que una cadena de reducciones de incertidumbre, cada una construida sobre la anterior, hasta que la persona tiene suficiente claridad para decidir —o hasta que comprende, con la misma claridad, que esa certeza todavía no está disponible (Journey 3, Journey 4, §4.3)—. Ninguna experiencia dentro de un Journey debería introducir una incertidumbre nueva sin, en algún punto del mismo recorrido, ofrecer una forma de resolverla.

### 4.10 Relevancia

El principio de Relevancia, consolidado por primera vez en `docs/product/PRICE_ALERTS_EXPERIENCE.md` §4.4 para las alertas, se integra aquí a la escala del recorrido completo: **un Journey debe evitar, tanto como una alerta individual, cualquier trabajo innecesario para la persona.**

Esto significa que ningún Journey debería exigir pasar por una experiencia que no aporta nada nuevo a la comprensión que la persona ya tiene — por ejemplo, si los Resultados ya resolvieron la necesidad (§4.5), obligar a pasar por el Detalle no sería ayudar, sería agregar un paso sin Relevancia. También significa que, dentro de un Journey extendido en el tiempo (Journey 2), cada "Nueva revisión" debe justificarse por la misma Relevancia ya exigida a cada alerta individual (`PRICE_ALERTS_EXPERIENCE.md` §4.4): revisar por revisar, sin que haya cambiado algo que le importe a la persona, no tiene más sentido a nivel de Journey que enviar una alerta sin cambios relevantes.

### 4.11 Accesibilidad

La Accesibilidad se conserva durante todo el Journey de la misma forma en que ya se hereda dentro de cada experiencia individual (`docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7), sin que este documento defina ninguna métrica nueva. La particularidad de un Journey es que esa necesidad de accesibilidad no cambia entre un paso y el siguiente: Carmen, con un nivel tecnológico básico (`docs/product/PERSONAS.md`), tiene la misma necesidad de información clara y pocos pasos al buscar, al comparar resultados, al ver el detalle y al recibir una alerta — ningún Journey puede asumir, en un tramo posterior, un nivel de comprensión distinto al que ya exigió el tramo anterior.

---

## 5. Relaciones

`USER_JOURNEYS.md` depende directamente de las cuatro experiencias ya gobernadas de la PHASE 2 —`docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` y `PRICE_ALERTS_EXPERIENCE.md`—, cuyas secciones de Continuidad anticiparon, sin desarrollarla, la integración que este documento realiza. Depende de `docs/product/PERSONAS.md` y `DECISION_LOG.md`, fuente directa de los cuatro Journeys oficiales (§4.3) y de la evidencia real de Confianza acumulada (§4.8). Depende también de `docs/design-system/COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md`, cuya referencia sin gobernar al concepto de "Flujo" este documento cierra (§2), sin redefinir ninguna de las arquitecturas de esos documentos.

Su responsabilidad específica es distinta a la de cada una de las cuatro experiencias: ninguna de ellas explica cómo se combinan entre sí, qué principios rigen esa combinación, ni qué Journeys oficiales existen. Este documento tampoco redefine ninguna experiencia individual, ninguna decisión de arquitectura de interfaz, ni resuelve el registro de su propia creación en `docs/product/DECISION_LOG.md` — queda señalado como trabajo pendiente (§7), no como una decisión tomada por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Continuidad hacia esta integración, anticipada sin desarrollarse | `docs/product/SEARCH_EXPERIENCE.md` §4.7; `RESULTS_EXPERIENCE.md` §4.7; `MEDICATION_DETAIL_EXPERIENCE.md` §4.7; `PRICE_ALERTS_EXPERIENCE.md` §4.7 | ✔ — fundamenta §2 | Sin reabrir ninguna de las cuatro experiencias |
| Concepto de "Flujo", referenciado sin gobernarse | `docs/design-system/COMPONENT_LIBRARY.md` §4.5; `PATTERNS.md` §4.5; `SCREEN_TEMPLATES.md` §4.5, §4.9 | ✔ — este documento es el gobierno que esas tres referencias anticipaban (§2, §4.1) | Los tres documentos de origen todavía no actualizan su propia referencia; ver nota en §7 |
| Necesidades reales de personas (Daniela, Claudia) | `docs/product/PERSONAS.md` | ✔ — fundamentan los Journeys 1 y 2 (§4.3) | — |
| Estado "Sin resultados" | `docs/product/SEARCH_EXPERIENCE.md` §4.6 | ✔ — fundamenta el Journey 3 (§4.3), sin redefinirlo | — |
| Estado "una única alternativa" | `docs/product/RESULTS_EXPERIENCE.md` §4.6 | ✔ — fundamenta §4.5 (variación natural), sin redefinirlo | — |
| Estado "información pendiente de verificación" | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.6 | ✔ — fundamenta el Journey 4 (§4.3), sin redefinirlo | — |
| Tipos de alerta y Relevancia | `docs/product/PRICE_ALERTS_EXPERIENCE.md` §4.3, §4.4 | ✔ — fundamentan el Journey 2 (§4.3) y §4.10, integrados sin repetirse | — |
| Principio de Reducción de Incertidumbre | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §2 | ✔ — integrado a nivel de recorrido completo (§4.9) | Mismo principio, no redefinido |
| Principio de Relevancia | `docs/product/PRICE_ALERTS_EXPERIENCE.md` §4.4 | ✔ — integrado a nivel de recorrido completo (§4.10) | Mismo principio, no redefinido |
| "Ayuda a decidir, nunca empuja a decidir" / autonomía de quien decide | `docs/brand/BRAND_FOUNDATIONS.md` §15 | ✔ — fundamenta la Reversibilidad (§4.2, §4.4, §4.5) | — |
| Correcciones reales de datos ya comunicadas abiertamente | `docs/product/DECISION_LOG.md` (2026-07-23, 2026-07-31) | ✔ — fundamenta la Confianza acumulada de un Journey (§4.8) | No es una decisión nueva; se cita como hecho ya registrado |
| Continuidad estructural entre pantallas | `docs/design-system/GRID_SYSTEM.md` §4.2.5 | ✔ — extendida al significado entre experiencias (§4.2) | Referenciada, no redefinida |
| Accesibilidad por herencia arquitectónica | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.4; `SPACING_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.7 | Referenciada, no duplicada (§4.11) | Ninguna métrica nueva definida |
| Registro de la creación de este documento | `docs/product/DECISION_LOG.md` | Pendiente — no existe todavía una entrada propia | Ver nota de pendiente en §7 |
| Combinaciones de Journeys distintas a las cuatro oficiales | — (no existen todavía) | No consolidado — los cuatro Journeys son mínimos, no exhaustivos (§4.3) | Pendiente de evidencia real de uso futura |

---

## 7. Gobierno

`USER_JOURNEYS.md` **no reemplaza**:

- `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` y `PRICE_ALERTS_EXPERIENCE.md` — cada una sigue siendo la única fuente de su propia experiencia; este documento no repite su contenido, solo explica cómo se combinan dentro de un recorrido completo.
- `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md` — siguen siendo la única fuente de la definición de producto, sus principios, las necesidades de las personas que lo usan, y su historial real de decisiones y correcciones.
- `docs/brand/BRAND_FOUNDATIONS.md` y el resto de `docs/brand/` — siguen siendo la única fuente de identidad de marca.
- `docs/design-system/COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md` — cada uno sigue siendo la única fuente de su propia arquitectura; este documento cierra su referencia pendiente al concepto de "Flujo" (§2) sin modificar ni redefinir ninguna de sus arquitecturas.

La responsabilidad específica de `USER_JOURNEYS.md` es gobernar exclusivamente **cómo se conectan las experiencias ya gobernadas de ComparaFarma dentro de un recorrido completo**: qué representa un Journey, sus principios, los Journeys oficiales del producto, sus estados y su continuidad natural, y cómo Neutralidad, Transparencia, Confianza, Reducción de Incertidumbre, Relevancia y Accesibilidad se sostienen a nivel de recorrido completo, no solo dentro de una experiencia aislada. No gobierna, y no debe absorber en ninguna revisión futura, ninguna pantalla, componente, layout, navegación de interfaz, algoritmo o diagrama de proceso — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la interfaz del producto.

**Interacción con `docs/design-system/COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md`:** los tres documentos todavía contienen, en su propio texto, la referencia original a un concepto de "Flujo... no existe todavía un documento de gobierno propio." Este documento no se autoriza a editar esas referencias por su cuenta —correspondería a una revisión de cross-referencias explícita y acotada sobre esos tres documentos, siguiendo la misma disciplina de consolidación ya aplicada en el Sprint DG.002 del dominio `docs/design-system/`—, y señala aquí, de forma explícita, que esa actualización queda pendiente de una sesión dedicada.

**Cómo evoluciona este documento:** cualquier Journey oficial nuevo, o cualquier cambio en los principios de §4.2, debe evaluarse contra evidencia real de uso ya registrada en `docs/product/PERSONAS.md` o `DECISION_LOG.md` (§6) antes de aprobarse, y debe registrarse en `docs/product/DECISION_LOG.md` como una decisión de producto, siguiendo el mecanismo de registro ya existente en ese dominio.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en toda la PHASE 2 — Product Experience.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Además: la creación de este documento, como quinto y último entregable anticipado de la PHASE 2 — Product Experience, constituye una decisión de producto en el sentido del mecanismo de registro ya existente en `docs/product/DECISION_LOG.md`. Esa decisión todavía no cuenta con una entrada propia en ese registro. Este documento no se autorregistra — señala aquí, de forma explícita, que esa incorporación requiere aprobación y registro posterior, siguiendo la misma disciplina de gobierno ya aplicada durante toda la Fase 1 y en los cuatro documentos anteriores de esta fase.

---

## 8. Documentos relacionados

- `docs/product/SEARCH_EXPERIENCE.md`
- `docs/product/RESULTS_EXPERIENCE.md`
- `docs/product/MEDICATION_DETAIL_EXPERIENCE.md`
- `docs/product/PRICE_ALERTS_EXPERIENCE.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/PERSONAS.md`
- `docs/product/DECISION_LOG.md`
- `docs/product/README.md`
- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/design-system/COMPONENT_LIBRARY.md`
- `docs/design-system/PATTERNS.md`
- `docs/design-system/SCREEN_TEMPLATES.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Draft | Pendiente (CEO/fundador) | Creación inicial, como quinto y último documento anticipado de la PHASE 2 — Product Experience, y documento integrador de la fase completa. Define qué representa un Journey, cerrando explícitamente la referencia sin gobernar al concepto de "Flujo" en `COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md`; cinco principios conceptuales (Continuidad, Coherencia, Reducción de Incertidumbre, Reversibilidad, Flexibilidad); los cuatro Journeys oficiales mínimos del producto, descritos únicamente por su significado; seis estados conceptuales de Journey, compuestos a partir de los estados ya gobernados en cada experiencia; continuidad y variación natural como expresión práctica de Flexibilidad y Reversibilidad; Neutralidad, Transparencia y Confianza desarrolladas a nivel de recorrido completo, no solo por experiencia; integración explícita (sin repetir) de Reducción de Incertidumbre y Relevancia; y Accesibilidad conservada a lo largo de todo el recorrido. No crea pantallas, wireframes, componentes, layouts, navegación de interfaz, algoritmos ni diagramas BPM; no redefine ninguna de las cuatro experiencias que conecta. Señala, sin resolverlo por su cuenta, que su propia creación requiere aprobación y registro posterior en `docs/product/DECISION_LOG.md`, y que la actualización de las referencias pendientes al "Flujo" en los tres documentos de Design System queda pendiente de una sesión dedicada. | `docs/product/SEARCH_EXPERIENCE.md` v1.0; `RESULTS_EXPERIENCE.md` v1.0; `MEDICATION_DETAIL_EXPERIENCE.md` v1.0; `PRICE_ALERTS_EXPERIENCE.md` v1.0; `PRODUCT_DEFINITION_v1.0.md` v1.0; `PRODUCT_PRINCIPLES.md`; `PERSONAS.md`; `docs/product/DECISION_LOG.md`; `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design-system/COMPONENT_LIBRARY.md` v1.1; `PATTERNS.md` v1.1; `SCREEN_TEMPLATES.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Apertura de la PHASE 2 — Product Experience y definición de la experiencia oficial de búsqueda | Product Manager / UX Architect / Enterprise Documentation Architect | `docs/product/SEARCH_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.2 — Results Experience: definición de la experiencia oficial de comprensión de resultados | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems | `docs/product/RESULTS_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.3 — Medication Detail Experience: definición de la experiencia oficial de comprensión del detalle de un medicamento | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.4 — Price Alerts Experience: definición de la experiencia oficial de acompañamiento mediante alertas de precio | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud | `docs/product/PRICE_ALERTS_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.5 — User Journeys: definición de los recorridos completos del usuario, quinto y último documento anticipado de la PHASE 2, cerrando la integración de la fase completa | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en User Journey Mapping para productos digitales de salud | `docs/product/USER_JOURNEYS.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Con este documento, los cinco documentos anticipados en la apertura de la PHASE 2 ya existen — queda pendiente su ratificación formal como conjunto. Queda pendiente, además: el registro en `docs/product/DECISION_LOG.md` de la creación de este documento (señalado en §7); la actualización de las referencias al concepto de "Flujo" en `docs/design-system/COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md`, en una sesión dedicada de consolidación de referencias cruzadas; y toda implementación concreta de interfaz que traduzca estos Journeys a un producto real.
