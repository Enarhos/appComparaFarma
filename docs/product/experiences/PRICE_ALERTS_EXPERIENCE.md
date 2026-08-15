# PRICE_ALERTS_EXPERIENCE — Especificación Oficial de la Experiencia de Alertas de Precio de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, layouts ni componentes. No describe tecnología. No explica algoritmos de notificación. No define canales (push, email, SMS u otro). Es la **especificación oficial de la experiencia de alertas de precio**: cómo ComparaFarma acompaña a una persona después de su búsqueda, comunicándole únicamente información relevante para ayudarle a tomar mejores decisiones. Debe seguir siendo válido aunque cambie por completo la interfaz, la infraestructura o el mecanismo de notificaciones, porque no gobierna esa implementación — gobierna la experiencia de acompañamiento que cualquier implementación futura deberá servir.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

Este documento pertenece al dominio `docs/product/` y continúa la PHASE 2 — Product Experience, abierta por `docs/product/SEARCH_EXPERIENCE.md` y continuada por `RESULTS_EXPERIENCE.md` y `MEDICATION_DETAIL_EXPERIENCE.md`. Consume la arquitectura ya gobernada por `docs/brand/`, `docs/design-system/` y las tres experiencias anteriores sin redefinirla en ningún punto.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PROD-EXP-004 |
| **Nombre** | PRICE_ALERTS_EXPERIENCE.md |
| **Dominio** | Product (`docs/product/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / Product Manager |
| **Rol asumido en su redacción** | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md` y `MEDICATION_DETAIL_EXPERIENCE.md` (que entregan el punto de partida de esta experiencia), de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md`, y consume, sin redefinirla, la arquitectura ya gobernada por `docs/brand/` y `docs/design-system/` |
| **Clasificación** | Documento de Product Experience |
| **Fuente Oficial** | Este documento es la fuente oficial de **qué representa, para la persona, el acompañamiento a lo largo del tiempo después de una búsqueda**: qué es una alerta, qué información puede comunicar, qué la hace relevante, cuándo sigue teniendo sentido, sus estados conceptuales, su continuidad, y los principios de Neutralidad, Transparencia, Confianza, No Intrusión y Relevancia que debe respetar. No es fuente de ninguna pantalla, wireframe, layout, componente, algoritmo de notificación o canal técnico (no creados), ni de campañas comerciales o marketing (explícitamente excluidos, §3) |
| **Documentos de los que depende** | `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md`, `DECISION_LOG.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería condicionar, como cuarto eslabón de la experiencia completa del producto, a un futuro `USER_JOURNEYS.md` |
| **Pregunta que responde** | ¿Cómo debe ser la experiencia de alertas para mantener informada a una persona sobre cambios relevantes de precio o disponibilidad sin convertirse en una fuente de interrupciones innecesarias? |

---

## 2. Propósito

`docs/product/RESULTS_EXPERIENCE.md` §4.7 y `MEDICATION_DETAIL_EXPERIENCE.md` §4.7 anticiparon, sin desarrollarlo, que guardar un resultado o configurar una alerta sobre un precio ya comprendido enlaza hacia esta experiencia. Este documento es esa continuación: el momento en que ComparaFarma deja de responder únicamente cuando la persona pregunta, y empieza a acompañarla en el tiempo, avisándole cuando algo que ya le importaba cambia de forma relevante.

Dentro del recorrido completo, las alertas cumplen un rol distinto al de la búsqueda, los resultados y el detalle: no son un momento de comprensión inmediata, sino de **acompañamiento sostenido**. `docs/product/PERSONAS.md` ya identifica esta necesidad de forma explícita en Claudia, quien compra los mismos medicamentos de forma permanente y declara, entre sus objetivos, "recibir alertas" — no como una función adicional, sino como parte de cómo espera que ComparaFarma la ayude a lo largo del tiempo, no solo en el momento en que abre la aplicación. Este documento refuerza los principios ya consolidados en la PHASE 2 —Neutralidad, Transparencia, Confianza y Reducción de Incertidumbre— y consolida un principio emergente, presente de forma implícita en todas las experiencias anteriores pero nunca antes nombrado con esta claridad: **la Relevancia** es la condición sin la cual ninguna alerta debería existir.

---

## 3. Alcance

**Este documento define:**

- Qué espera una persona cuando activa una alerta, desde su perspectiva y no desde el negocio (§4.1).
- Qué representa conceptualmente una alerta dentro de ComparaFarma, sin hablar de eventos técnicos, sistemas de mensajería ni infraestructura (§4.2).
- Qué información puede comunicar una alerta, y por qué cada tipo reduce incertidumbre (§4.3).
- Qué hace que una alerta sea realmente útil, qué cambios no la justifican, y cómo evitar ruido y fatiga de notificaciones (§4.4).
- Cuándo una alerta sigue siendo valiosa, cuándo deja de tener sentido, y qué significa oportunidad (§4.5).
- Los estados conceptuales de esta experiencia, sin describir pantallas (§4.6).
- Qué puede hacer la persona después de recibir una alerta, enlazando únicamente hacia un futuro Flujo completo (§4.7).
- Cómo las alertas nunca favorecen farmacias, laboratorios, marcas, promociones o convenios comerciales (§4.8).
- Qué debe explicar una alerta, qué nunca debe ocultar, y cómo comunicar incertidumbre (§4.9).
- Cómo esta experiencia mantiene la confianza cuando una alerta se equivoca (§4.10).
- Por qué una alerta nunca debe competir por atención, y por qué el silencio también puede ser una decisión correcta del producto (§4.11).
- Cómo hereda accesibilidad desde la arquitectura ya existente, sin métricas nuevas (§4.12).

**Este documento NO define:**

- Ninguna pantalla, wireframe, layout o componente concreto. Pertenece íntegramente a `docs/design-system/`, que este documento no reinterpreta ni redefine.
- Ningún algoritmo de detección de cambios, umbral numérico ni regla de negocio cuantitativa. Este documento describe la expectativa de acompañamiento de la persona, no el mecanismo técnico que la satisface.
- Ningún canal de notificación (push, email, SMS u otro), ninguna infraestructura de mensajería ni ninguna tecnología de implementación.
- **Ninguna notificación técnica.** No describe formatos, frecuencias de envío técnico ni mecanismos de entrega.
- **La compra de medicamentos.** `docs/product/PRODUCT_DEFINITION_v1.0.md` §10 ya excluye la compra del alcance de la versión 1.0 del producto; una alerta no incentiva ni orienta hacia una compra, solo comunica un hecho relevante ya comprendido en experiencias anteriores.
- **Ninguna campaña comercial ni actividad de marketing.** Una alerta no es un canal de promoción; existir para captar atención comercial contradice directamente el propósito de esta experiencia (§4.8, §4.11).
- Ninguna decisión de identidad de marca, Foundation, Token, Componente, Patrón o Screen Template ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento los consume; no los reinterpreta ni los duplica.
- Las experiencias de búsqueda, resultados o detalle. Corresponden íntegramente a `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md` y `MEDICATION_DETAIL_EXPERIENCE.md`, ya gobernadas; este documento parte de su punto de continuidad sin reabrirlas.

---

## 4. Contenido principal

### 4.1 Objetivo del Usuario

Cuando una persona activa una alerta, no espera recibir mensajes — espera **no tener que volver a preguntar por su cuenta**. `docs/product/PERSONAS.md` ya lo declara de forma directa para Claudia, cuyos objetivos incluyen explícitamente "recibir alertas" junto con "no olvidar medicamentos" y "ver historial": para ella, una alerta es una forma de delegar en ComparaFarma la tarea de estar atenta, no una función adicional a explorar. Lo mismo aplica, con menor frecuencia declarada pero la misma lógica, a Carmen, cuya frustración principal es que "los precios cambian mucho" — una alerta existe, precisamente, para que esa variabilidad no dependa de que ella misma vuelva a revisar.

El objetivo real de la persona es que ComparaFarma siga observando en su nombre lo que ya le importó una vez (una búsqueda, un resultado, un medicamento comprendido en detalle), y que le avise únicamente cuando eso cambie de una forma que realmente le convenga saber — nunca que la alerta se convierta en una razón más para abrir la aplicación sin que haya ocurrido nada relevante. Consistente con `docs/brand/BRAND_FOUNDATIONS.md` §15: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir"* — una alerta ayuda observando; nunca empuja interrumpiendo.

### 4.2 ¿Qué representa una alerta?

Sin hablar de eventos técnicos, sistemas de mensajería ni infraestructura: una alerta es un compromiso de ComparaFarma con una persona específica, sobre una necesidad específica ya comprendida en una experiencia anterior (una búsqueda, un resultado, un medicamento en detalle), de comunicarle únicamente cuando algo relevante para esa necesidad cambie. No es un mensaje aislado ni una función independiente — es la extensión en el tiempo de la misma confianza que ya se construyó en el momento de buscar (`docs/product/SEARCH_EXPERIENCE.md`), comparar (`RESULTS_EXPERIENCE.md`) y comprender (`MEDICATION_DETAIL_EXPERIENCE.md`), sin exigirle a la persona que repita ese esfuerzo por su cuenta cada vez que quiera saber si algo cambió.

Una alerta, en este sentido, nunca existe de forma aislada de la necesidad que la originó: si esa necesidad ya no existe para la persona, la alerta tampoco debería seguir teniendo sentido (desarrollado en §4.5).

### 4.3 Información que una alerta puede comunicar

Cada tipo de alerta existe porque reduce un tipo específico de incertidumbre sobre el tiempo que pasa entre que la persona comprendió algo y el momento en que decide actuar. Sin describir formatos:

- **Cambio relevante de precio:** reduce la incertidumbre de cuándo es un buen momento para actuar, sin que la persona tenga que volver a comparar por su cuenta — la extensión, en el tiempo, del mismo Principio de Reducción de Incertidumbre ya nombrado en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §2.
- **Disponibilidad recuperada:** reduce la incertidumbre de si una alternativa que antes no estaba disponible ya puede considerarse de nuevo — reconecta directamente con los estados de disponibilidad ya gobernados en `RESULTS_EXPERIENCE.md` §4.6.
- **Pérdida de disponibilidad:** una alerta no comunica solo buenas noticias. Que una alternativa que la persona seguía ya no esté disponible es información igualmente valiosa: le permite dejar de esperar por algo que ya no es una opción real, en vez de seguir confiando en una expectativa que ya no corresponde a la realidad.
- **Nueva alternativa:** reduce la incertidumbre de si ha aparecido una opción que antes no existía para esa misma necesidad — extiende en el tiempo el principio de comparabilidad ya desarrollado en `RESULTS_EXPERIENCE.md` §4.4.
- **Actualización relevante de información:** cuando un dato que antes estaba pendiente de verificación (`docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.6) pasa a estar confirmado, esa actualización reduce directamente la incertidumbre que ese mismo estado ya reconocía como pendiente.

Ninguno de estos tipos de alerta se justifica por sí mismo de forma automática — cada uno debe cumplir, además, el criterio de Relevancia desarrollado en el siguiente capítulo.

### 4.4 Relevancia

Este es el capítulo central de este documento.

**¿Qué hace que una alerta sea realmente útil?** Que comunique algo que, de haber existido antes, habría cambiado lo que la persona ya sabía o lo que estaría dispuesta a hacer. No basta con que un dato sea distinto al anterior — tiene que ser distinto de una forma que le importe a la persona, no solo al sistema que lo detecta. Consistente con el Principio de producto 4, Simplicidad: *"Cada pantalla debe resolver un problema específico"* (`docs/product/PRODUCT_PRINCIPLES.md`) — extendido aquí: cada alerta debe resolver una incertidumbre específica, no reportar una variación por el solo hecho de que ocurrió.

**¿Qué cambios NO justifican una alerta?** Cualquier cambio que no altere lo que la persona ya comprendía ni lo que estaría dispuesta a hacer. Este documento no define, deliberadamente, ningún umbral numérico ni ninguna regla cuantitativa para distinguir esos casos (pertenece a una decisión de producto e implementación futura, no a esta especificación de experiencia) — pero sí establece el criterio cualitativo que cualquier regla futura deberá cumplir: una alerta que se envía sin que la persona pueda percibir, al recibirla, que efectivamente le aporta algo nuevo, no cumple el propósito de esta experiencia, sin importar qué tan preciso haya sido el dato que la originó.

**¿Cómo evitar ruido?** Nunca alertando por el solo hecho de que existe la capacidad técnica de hacerlo. `docs/brand/BRAND_FOUNDATIONS.md` §18 ya declara, como compromiso permanente del producto, *"no usar patrones de diseño que dificulten decidir con libertad"* — citando directamente la fuente de ese compromiso: *"no diseñaremos para manipular."* Una alerta que existe para generar actividad o apertura de la aplicación, en vez de para comunicar un hecho relevante, es exactamente el tipo de patrón que ese compromiso ya prohíbe, aplicado aquí a las notificaciones en vez de a la interfaz.

**¿Cómo evitar fatiga de notificaciones?** La utilidad de una alerta no se mide por cuántas veces se envía, sino por cuántas veces, al recibirla, la persona sintió que valió la pena recibirla. Una experiencia de alertas que prioriza la frecuencia sobre la Relevancia erosiona, con cada alerta que no aporta nada nuevo, la disposición de la persona a seguir confiando en la siguiente — este riesgo se desarrolla con más profundidad en la relación entre Relevancia y No Intrusión (§4.11).

**¿Cómo preservar la confianza del usuario?** Asegurando que cada alerta enviada pueda justificarse, ante la propia persona que la recibe, como algo que realmente le convenía saber en ese momento — la misma disciplina de Confianza desarrollada con más detalle en §4.10.

### 4.5 Temporalidad

Sin hablar de programación: **¿cuándo una alerta sigue siendo valiosa?** Mientras la necesidad que la originó (uno de los disparadores ya reconocidos en `docs/product/SEARCH_EXPERIENCE.md` §4.2) siga siendo real para la persona. Para una necesidad permanente —como la de Claudia, que compra los mismos medicamentos de forma recurrente—, una alerta puede seguir teniendo sentido de forma indefinida. Para una necesidad puntual —como la de Daniela, que busca resolver algo específico en poco tiempo—, una alerta que siga activa después de que esa necesidad ya se resolvió deja de tener ningún valor, aunque la información que comunique sea perfectamente correcta.

**¿Cuándo deja de tener sentido?** Cuando la necesidad original ya fue resuelta, cuando la persona ya actuó por su cuenta, o cuando la alerta ya cumplió una vez el propósito para el que fue creada. Esta última condición no es una anticipación hipotética: ya es como el producto trata sus alertas de precio en la práctica — `docs/product/DECISION_LOG.md` (2026-08-02, Sprint C) documenta que cada alerta tiene "disparo único... sin re-armado automático." Este documento no describe ese mecanismo técnico, pero sí reconoce el principio de experiencia que ya está detrás de él: una alerta que ya avisó sobre el hecho relevante que la originó ha cumplido su propósito, y seguir insistiendo sobre el mismo hecho no sería informar — sería repetir.

**¿Qué significa oportunidad?** Que la alerta llegue a la persona mientras esa información todavía puede cambiar lo que haría. Una alerta puede ser completamente exacta y, aun así, haber perdido su oportunidad — si la persona ya resolvió su necesidad por otro medio, la misma información que antes habría sido valiosa ya no cambia nada. La Temporalidad, en este sentido, no es solo una cuestión de cuándo se envía una alerta, sino de si la ventana en la que esa información todavía importa sigue abierta.

### 4.6 Estados conceptuales

Estados conceptuales, sin pantallas:

- **Alerta activa.** La necesidad que la originó sigue siendo real, y ComparaFarma sigue observando en nombre de la persona, sin que todavía haya ocurrido un cambio que justifique comunicarse (§4.4).
- **Alerta satisfecha.** El hecho relevante que la persona esperaba —un cambio de precio, una disponibilidad recuperada, una nueva alternativa— ocurrió y fue comunicado. Consistente con el disparo único ya reconocido en §4.5, este estado marca el cumplimiento del propósito original de la alerta.
- **Alerta sin cambios.** Nada relevante ha ocurrido todavía. Este estado es distinto de no comunicar nada: cuando la persona vuelve a consultar por su cuenta, confirmar explícitamente "sin cambios" es información honesta y tranquilizadora — muy distinto de generar una notificación proactiva para decir lo mismo, que sería exactamente el tipo de ruido que §4.4 y §4.11 buscan evitar.
- **Información pendiente de verificación.** El mismo estado ya reconocido en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.6, extendido en el tiempo: si un cambio detectado todavía no puede afirmarse con la confianza necesaria, esta experiencia no debe comunicarlo como un hecho consumado — debe reconocer la incertidumbre explícitamente (desarrollado en §4.9) o esperar a que pueda confirmarse, nunca elegir el silencio como forma de ocultar la duda.
- **Alerta finalizada.** La necesidad que la originó ya no es real para la persona —fue cancelada explícitamente, o ya no corresponde a algo que siga necesitando seguimiento—. Una alerta finalizada no vuelve a comunicarse; su historial permanece como constancia de lo que ya se acompañó.

### 4.7 Continuidad

Después de recibir una alerta, cualquier acción específica que la persona decida tomar —revisar resultados actualizados, profundizar nuevamente en el detalle, iniciar una búsqueda distinta— ya está gobernada por las experiencias existentes (`docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`); esta experiencia no crea una continuidad propia distinta de esas ya gobernadas. Se enlaza, sin desarrollarlo, únicamente hacia un futuro `USER_JOURNEYS.md` (§7), que gobernará cómo el momento de recibir una alerta se combina con el resto de las experiencias del producto dentro de un objetivo completo de la persona — por ejemplo, cómo una alerta satisfecha reconecta con la búsqueda, los resultados o el detalle que la originaron.

### 4.8 Neutralidad

Decimotercera aplicación transversal del mismo principio ya desarrollado a lo largo de toda esta arquitectura, incluidas las tres experiencias anteriores de la PHASE 2 (`docs/product/SEARCH_EXPERIENCE.md` §4.8, `RESULTS_EXPERIENCE.md` §4.8, `MEDICATION_DETAIL_EXPERIENCE.md` §4.8): **una alerta existe porque ocurrió un hecho relevante para la persona. Nunca porque convenga al negocio.**

- **Farmacias:** ninguna alerta puede originarse ni destacar una farmacia por conveniencia comercial — el mismo hecho ya calculado (`effective = min(store, online, cmr, sbpay)`) que ya gobierna toda comparación de precios en este producto es el único criterio legítimo para que un cambio de precio justifique una alerta, nunca una decisión comercial. Consecuencia directa de `docs/brand/BRAND_FOUNDATIONS.md` §12 y del compromiso de no alterar una recomendación por beneficio económico propio (§18).
- **Laboratorios y marcas:** ninguna alerta puede sugerir, ni siquiera de forma indirecta, que una marca o un laboratorio es preferible — mismo límite ya reconocido explícitamente en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.4 y §4.8 sobre lo que ComparaFarma puede y no puede afirmar respecto de equivalencia.
- **Promociones y convenios comerciales:** ninguna promoción ni convenio comercial puede generar, por sí mismo, una alerta. Una alerta comunicada porque a una farmacia le conviene que se comunique —y no porque el cambio sea objetivamente relevante para la persona— dejaría de ser una alerta y se convertiría en publicidad, contradiciendo directamente el alcance de este documento (§3).

### 4.9 Transparencia

**Qué debe explicar una alerta:** qué cambió, respecto de qué se comparó ese cambio, y por qué se consideró relevante — nunca comunicar solo el resultado sin el contexto que le da sentido. Consistente con el Principio de producto 6: *"Siempre mostraremos el origen de la información cuando corresponda"* (`docs/product/PRODUCT_PRINCIPLES.md`).

**Qué nunca debe ocultar:** que una alerta se basa en información todavía pendiente de verificación (§4.6), o que la certeza sobre un cambio es menor de lo que la propia alerta podría sugerir si se comunicara sin ese matiz.

**Cómo comunicar incertidumbre:** reconociendo explícitamente, cuando corresponda, que un cambio detectado todavía está en proceso de confirmación — la misma disciplina ya exigida en `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.9, extendida aquí al momento en que una alerta comunica ese cambio, no solo al momento en que se muestra en el detalle.

**Cómo reconocer cuando una información todavía está en verificación:** tratando ese reconocimiento como parte legítima del contenido de la alerta, nunca como una razón para no enviarla ni para enviarla sin esa salvedad — ambas opciones serían menos transparentes que comunicar la incertidumbre misma.

### 4.10 Confianza

**¿Cómo mantener la confianza cuando una alerta se equivoca?** Reconociendo el error de la misma forma en que el producto ya ha reconocido errores reales de datos en el pasado —`docs/product/DECISION_LOG.md` documenta, sin ambigüedad, cómo se diagnosticaron y corrigieron abiertamente un precio incorrecto (2026-07-23) y una disponibilidad incorrecta (2026-07-31)—; una alerta basada en un dato que después se corrige debería poder comunicar esa corrección con la misma claridad con la que comunicó el cambio original, nunca dejar la información anterior como la última palabra.

**¿Cómo comunicar correcciones?** Reconociendo el error en vez de justificarlo, consistente con el compromiso permanente ya declarado en `docs/brand/BRAND_FOUNDATIONS.md` §18. Una corrección comunicada con la misma transparencia que la alerta original es, para esta experiencia, más valiosa para la confianza de la persona que evitar mencionar que algo cambió de vuelta.

**¿Cómo evitar falsas expectativas?** Nunca prometiendo que una alerta garantiza encontrar siempre el mejor momento posible para actuar — `docs/brand/BRAND_FOUNDATIONS.md` §10 ya declara la promesa oficial correspondiente: *"No prometemos tener siempre la respuesta. Prometemos buscarla con honestidad."* Aplicado a esta experiencia: una alerta promete observar con honestidad y comunicar lo relevante que encuentre — nunca promete que no existirá una mejor oportunidad que la que efectivamente comunicó.

### 4.11 No Intrusión

Nuevo capítulo. **Una alerta nunca debe competir por la atención de la persona. Debe aportar valor, o no debe existir.**

El silencio también puede ser una buena decisión de este producto: cuando no ha ocurrido nada relevante (§4.4), no comunicar nada es, en sí mismo, la forma correcta de respetar la atención de la persona — no una ausencia de funcionalidad. Este principio se relaciona directamente con dos ya desarrollados en este documento: con la Neutralidad (§4.8), porque una alerta que existe para captar atención en vez de para informar está sirviendo a un interés distinto del de la persona —el mismo tipo de desviación que la Neutralidad ya prohíbe cuando ese interés es comercial—; y con la Confianza (§4.10), porque una experiencia de alertas que interrumpe con frecuencia, aunque nunca se equivoque en sus datos, erosiona con el tiempo la misma confianza que la exactitud de los datos intenta construir.

`docs/product/PERSONAS.md` ya ofrece evidencia directa de por qué este principio no es solo una preferencia de diseño: Daniela cierra la aplicación si algo le toma más de un minuto — una persona con ese nivel de exigencia sobre su tiempo y su atención no tolerará una fuente de interrupciones que no le aporte algo que efectivamente le importe, y probablemente dejará de confiar en cualquier alerta futura de ComparaFarma, incluso en las que sí serían relevantes. La No Intrusión no es, entonces, una restricción impuesta a la utilidad de las alertas — es la condición que permite que las alertas sigan siendo útiles a largo plazo.

### 4.12 Accesibilidad

Esta experiencia hereda accesibilidad de la misma arquitectura ya gobernada — `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7 — sin definir aquí ninguna métrica nueva.

La exigencia particular de esta experiencia es que una alerta debe poder comprenderse en el momento en que llega, sin exigir que la persona recuerde el contexto completo de la búsqueda, los resultados o el detalle que la originaron — Carmen, con un nivel tecnológico básico y necesidad de información clara (`docs/product/PERSONAS.md`), debe poder entender qué le está comunicando una alerta sin tener que reconstruir mentalmente todo lo que comprendió la primera vez. Consistente con el Principio de producto 4: *"Cada pantalla debe resolver un problema específico"* (`PRODUCT_PRINCIPLES.md`) — aquí, el problema específico que una alerta debe resolver por sí sola es que la persona comprenda, sin ayuda adicional, qué cambió y por qué le importa.

---

## 5. Relaciones

`PRICE_ALERTS_EXPERIENCE.md` depende directamente de `docs/product/RESULTS_EXPERIENCE.md` y `MEDICATION_DETAIL_EXPERIENCE.md`, cuyas secciones de Continuidad entregan el punto de partida de este documento, y de `docs/product/SEARCH_EXPERIENCE.md`, origen de toda la cadena de experiencia. Depende de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md`, fuente directa de §4.1 y §4.12, y de `docs/product/DECISION_LOG.md`, cuyas entradas reales sobre el comportamiento ya implementado de las alertas (disparo único, sin re-armado automático) y sobre correcciones de datos ya realizadas fundamentan directamente §4.5 y §4.10 con evidencia concreta, no hipotética. Consume, sin redefinirla, la arquitectura ya gobernada en `docs/brand/BRAND_FOUNDATIONS.md`.

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos describe qué espera la persona de una alerta, qué la hace relevante, ni cuándo deja de tener sentido. Este documento tampoco resuelve, por su cuenta, ninguna decisión de arquitectura de interfaz, ningún canal de notificación, ningún futuro `USER_JOURNEYS.md`, ni el registro de su propia creación en `docs/product/DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Punto de partida de esta experiencia (Continuidad) | `docs/product/RESULTS_EXPERIENCE.md` §4.7; `MEDICATION_DETAIL_EXPERIENCE.md` §4.7 | ✔ — fundamenta §2 | Sin reabrir esas experiencias |
| Necesidad real de alertas ("recibir alertas") | `docs/product/PERSONAS.md` (Claudia) | ✔ — fundamenta §2 y §4.1 | Cita directa de un objetivo declarado |
| Frustración por variabilidad de precios | `docs/product/PERSONAS.md` (Carmen) | ✔ — fundamenta §4.1 | — |
| Exigencia de tiempo y bajo umbral de tolerancia a interrupciones | `docs/product/PERSONAS.md` (Daniela) | ✔ — fundamenta §4.11 | — |
| Comportamiento real ya implementado: disparo único, sin re-armado automático | `docs/product/DECISION_LOG.md` (2026-08-02, Sprint C) | ✔ — fundamenta §4.5 y §4.6 | No se describe el mecanismo técnico, solo el principio de experiencia que ya refleja |
| Correcciones reales de datos ya comunicadas abiertamente | `docs/product/DECISION_LOG.md` (2026-07-23, 2026-07-31) | ✔ — fundamenta §4.10 | No es una decisión nueva; se cita como hecho ya registrado |
| Estado "información pendiente de verificación" | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §4.6 | ✔ — extendido en el tiempo (§4.6, §4.9) | Mismo estado, no redefinido |
| Principio de comparabilidad y estados de disponibilidad | `docs/product/RESULTS_EXPERIENCE.md` §4.4, §4.6 | ✔ — extendidos en el tiempo (§4.3) | — |
| Reducción de Incertidumbre (principio) | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` §2 | ✔ — extendido a la experiencia de alertas (§4.3) | Mismo principio, no redefinido |
| "Ayuda a decidir, nunca empuja a decidir" | `docs/brand/BRAND_FOUNDATIONS.md` §15 | ✔ — fundamenta §4.1 | — |
| "No diseñaremos para manipular" | `docs/brand/BRAND_FOUNDATIONS.md` §18 | ✔ — fundamenta §4.4 y §4.11 | — |
| No privilegiar farmacias/marcas por conveniencia comercial | `docs/brand/BRAND_FOUNDATIONS.md` §12, §18 | ✔ — fundamenta §4.8 | — |
| Promesa oficial ("buscamos la respuesta con honestidad") | `docs/brand/BRAND_FOUNDATIONS.md` §10 | ✔ — fundamenta §4.10 | — |
| "Hecho ya calculado" como criterio legítimo | `docs/brand/COLOR_SYSTEM.md` §4.5; `docs/design-system/GRID_SYSTEM.md` §4.8 | ✔ — aplicado a la Neutralidad de alertas (§4.8) | — |
| Exclusión de compra de medicamentos en v1.0 | `docs/product/PRODUCT_DEFINITION_v1.0.md` §10 | ✔ — fundamenta la exclusión de §3 | — |
| Accesibilidad por herencia arquitectónica | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.4; `SPACING_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.7 | Referenciada, no duplicada (§4.12) | Ninguna métrica nueva definida |
| Registro de la creación de este documento | `docs/product/DECISION_LOG.md` | Pendiente — no existe todavía una entrada propia | Ver nota de pendiente en §7 |
| `USER_JOURNEYS.md` (futuro gobierno de Flujos completos) | — (no existe todavía) | No consolidado — anticipado, no creado (§7) | — |

---

## 7. Gobierno

`PRICE_ALERTS_EXPERIENCE.md` **no reemplaza**:

- `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md` y `MEDICATION_DETAIL_EXPERIENCE.md` — siguen siendo la única fuente de las experiencias de búsqueda, resultados y detalle; este documento parte de su punto de continuidad sin reabrirlas.
- `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md` — siguen siendo la única fuente de la definición de producto, sus principios, las necesidades de las personas que lo usan, y su historial real de decisiones y correcciones.
- `docs/brand/BRAND_FOUNDATIONS.md` y el resto de `docs/brand/` — siguen siendo la única fuente de identidad de marca.
- `docs/design-system/` en su totalidad — sigue siendo la única fuente de arquitectura de producto; este documento no define ninguna pantalla, patrón o componente, solo la experiencia de acompañamiento que deberán servir.
- Un futuro `USER_JOURNEYS.md` — cuando exista, será la única fuente de gobierno de los Flujos completos que combinan esta experiencia con las demás; este documento no se atribuye esa responsabilidad (§4.7).
- Ningún mecanismo de notificación, canal técnico o infraestructura ya implementada en `api/` o `web/` — este documento no los redefine; gobierna la experiencia de acompañamiento que deberían servir.

La responsabilidad específica de `PRICE_ALERTS_EXPERIENCE.md` es gobernar exclusivamente **la experiencia de acompañamiento mediante alertas**: qué espera la persona, qué representa una alerta, qué información puede comunicar, qué la hace relevante, cuándo sigue teniendo sentido, sus estados conceptuales, su continuidad, y los principios de Neutralidad, Transparencia, Confianza, No Intrusión y Relevancia que debe respetar. No gobierna, y no debe absorber en ninguna revisión futura, ninguna pantalla, componente, algoritmo, umbral numérico, canal técnico o tecnología, ni campañas comerciales o marketing — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la interfaz, la infraestructura o el mecanismo de notificaciones.

**Cómo evoluciona este documento:** cualquier cambio en qué constituye una alerta relevante (§4.4) o en sus estados conceptuales (§4.6) debe evaluarse contra la evidencia ya citada en `PERSONAS.md` y `DECISION_LOG.md` (§6) antes de aprobarse, y debe registrarse en `docs/product/DECISION_LOG.md` como una decisión de producto, siguiendo el mecanismo de registro ya existente en ese dominio.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en toda la PHASE 2 — Product Experience.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Además: la creación de este documento, como cuarto entregable de la PHASE 2 — Product Experience, constituye una decisión de producto en el sentido del mecanismo de registro ya existente en `docs/product/DECISION_LOG.md`. Esa decisión todavía no cuenta con una entrada propia en ese registro. Este documento no se autorregistra — señala aquí, de forma explícita, que esa incorporación requiere aprobación y registro posterior, siguiendo la misma disciplina de gobierno ya aplicada durante toda la Fase 1 y en los tres documentos anteriores de esta fase.

---

## 8. Documentos relacionados

- `docs/product/SEARCH_EXPERIENCE.md`
- `docs/product/RESULTS_EXPERIENCE.md`
- `docs/product/MEDICATION_DETAIL_EXPERIENCE.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/PERSONAS.md`
- `docs/product/DECISION_LOG.md`
- `docs/product/README.md`
- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: `USER_JOURNEYS.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Draft | Pendiente (CEO/fundador) | Creación inicial, como cuarto documento de la PHASE 2 — Product Experience. Define la experiencia oficial de acompañamiento mediante alertas de precio: objetivo real de la persona derivado de `PERSONAS.md` (cita directa del objetivo "recibir alertas" de Claudia); qué representa una alerta como extensión en el tiempo de la confianza ya construida en las tres experiencias anteriores; cinco tipos de información que una alerta puede comunicar, cada uno fundamentado en reducción de incertidumbre; capítulo central de Relevancia, sin umbrales numéricos ni algoritmos; Temporalidad fundamentada en el comportamiento real ya implementado (disparo único, sin re-armado automático, `DECISION_LOG.md` 2026-08-02); cinco estados conceptuales; continuidad enlazada únicamente hacia un futuro `USER_JOURNEYS.md`; Neutralidad como decimotercera aplicación transversal; Transparencia y Confianza extendidas en el tiempo, con evidencia real de cómo el producto ya comunica correcciones; nuevo capítulo de No Intrusión, relacionado explícitamente con Neutralidad y Confianza; y consolidación explícita de un nuevo principio emergente, Relevancia. No crea pantallas, wireframes, componentes, layouts, algoritmos, umbrales, canales técnicos, campañas comerciales ni menciona tecnología. Señala, sin resolverlo por su cuenta, que su propia creación requiere aprobación y registro posterior en `docs/product/DECISION_LOG.md`. | `docs/product/SEARCH_EXPERIENCE.md` v1.0; `RESULTS_EXPERIENCE.md` v1.0; `MEDICATION_DETAIL_EXPERIENCE.md` v1.0; `PRODUCT_DEFINITION_v1.0.md` v1.0; `PRODUCT_PRINCIPLES.md`; `PERSONAS.md`; `docs/product/DECISION_LOG.md`; `docs/brand/BRAND_FOUNDATIONS.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Apertura de la PHASE 2 — Product Experience y definición de la experiencia oficial de búsqueda | Product Manager / UX Architect / Enterprise Documentation Architect | `docs/product/SEARCH_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.2 — Results Experience: definición de la experiencia oficial de comprensión de resultados | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems | `docs/product/RESULTS_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.3 — Medication Detail Experience: definición de la experiencia oficial de comprensión del detalle de un medicamento | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.4 — Price Alerts Experience: definición de la experiencia oficial de acompañamiento mediante alertas de precio, cuarto documento de la PHASE 2 — Product Experience | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud | `docs/product/PRICE_ALERTS_EXPERIENCE.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Queda pendiente: el registro en `docs/product/DECISION_LOG.md` de la creación de este documento (señalado en §7), la creación de `USER_JOURNEYS.md`, y toda implementación concreta de interfaz, canal de notificación o infraestructura que traduzca esta experiencia a un producto real.
