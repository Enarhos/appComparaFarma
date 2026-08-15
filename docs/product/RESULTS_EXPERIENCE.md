# RESULTS_EXPERIENCE — Especificación Oficial de la Experiencia de Resultados de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, cards ni tablas de interfaz. No define layouts. No implementa componentes. No describe tecnología. No explica algoritmos. Es la **especificación oficial de la experiencia de resultados**: cómo una persona comprende las alternativas encontradas después de una búsqueda y obtiene la información necesaria para decidir conscientemente. Debe seguir siendo válido aunque cambie por completo la interfaz del producto, porque no gobierna esa interfaz — gobierna la experiencia de comprensión que cualquier interfaz futura deberá servir.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

Este documento pertenece al dominio `docs/product/` y continúa la PHASE 2 — Product Experience, abierta por `docs/product/SEARCH_EXPERIENCE.md`. Consume la arquitectura ya gobernada por `docs/brand/`, `docs/design-system/` y por `SEARCH_EXPERIENCE.md` sin redefinirla en ningún punto.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PROD-EXP-002 |
| **Nombre** | RESULTS_EXPERIENCE.md |
| **Dominio** | Product (`docs/product/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / Product Manager |
| **Rol asumido en su redacción** | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/product/SEARCH_EXPERIENCE.md` (que entrega el punto de partida de esta experiencia, §4.5 y §4.7 de ese documento), de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md`, y consume, sin redefinirla, la arquitectura ya gobernada por `docs/brand/` y `docs/design-system/` |
| **Clasificación** | Documento de Product Experience |
| **Fuente Oficial** | Este documento es la fuente oficial de **qué representa, para la persona, el momento de comprender resultados**: qué constituye un resultado, qué información mínima necesita, cómo comprende su comparabilidad, qué jerarquía de atención merece cada dato, sus estados conceptuales, su continuidad, y los principios de Neutralidad y Transparencia que debe respetar. No es fuente de ninguna pantalla, wireframe, card, tabla de interfaz, layout, componente o algoritmo (no creados), ni de la experiencia de búsqueda, detalle, alertas o compra (fuera de alcance, §3) |
| **Documentos de los que depende** | `docs/product/SEARCH_EXPERIENCE.md`, `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md`, `DECISION_LOG.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/design-system/GRID_SYSTEM.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`, `COMPONENT_LIBRARY.md`, `DESIGN_TOKENS.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería condicionar, como segundo eslabón de la experiencia completa del producto, a los futuros `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md` |
| **Pregunta que responde** | ¿Cómo debe ser la experiencia de resultados para que una persona comprenda rápidamente las alternativas disponibles sin perder Neutralidad ni transparencia? |

---

## 2. Propósito

`docs/product/SEARCH_EXPERIENCE.md` §4.5 estableció que la búsqueda termina cuando la persona sabe si existe algo que valga la pena revisar — no cuando ya comprendió esas alternativas. Ese es exactamente el punto donde empieza este documento: la experiencia de resultados es el momento en que ComparaFarma transforma una respuesta ("sí, esto existe") en comprensión real ("esto es lo que significa, y esto es lo que puedo hacer con ello").

`docs/product/PRODUCT_DEFINITION_v1.0.md` §7 declara la propuesta de valor de ComparaFarma como "conocer, en pocos segundos, dónde un medicamento tiene el mejor precio disponible entre distintas farmacias, facilitando decisiones de compra más inteligentes." La búsqueda encuentra esas alternativas; la experiencia de resultados es la que efectivamente entrega esa propuesta de valor, porque es donde la persona pasa de saber que algo existe a comprender qué le conviene. Sin esta experiencia, la búsqueda sería solo un mecanismo de recuperación de datos — con ella, se convierte en la herramienta de decisión que el producto existe para ser (`docs/brand/BRAND_FOUNDATIONS.md` §7).

---

## 3. Alcance

**Este documento define:**

- Qué necesita comprender una persona cuando recibe resultados, desde la toma de decisiones y no desde la lógica del negocio (§4.1).
- Qué representa conceptualmente un resultado dentro de ComparaFarma, sin hablar de tablas, cards ni UI (§4.2).
- Qué información mínima debe contener un resultado para permitir una decisión informada, fundamentada en la necesidad de la persona (§4.3).
- Cómo la persona comprende que está comparando alternativas equivalentes, cómo identifica diferencias relevantes e información faltante, y cómo evita interpretar erróneamente una diferencia de precio (§4.4).
- Cómo debe organizarse conceptualmente la importancia de la información, sin layouts ni posiciones (§4.5).
- Los estados conceptuales de la experiencia de resultados, sin describir pantallas (§4.6).
- Qué decisiones puede tomar la persona después de comprender los resultados, sin desarrollar esos flujos (§4.7).
- Cómo los resultados deben mantenerse imparciales frente a farmacias, laboratorios, marcas, promociones y convenios comerciales (§4.8).
- Qué información debe ser comprensible, qué debe ser explicable y qué nunca debe quedar implícito (§4.9).
- Cómo esta experiencia hereda accesibilidad desde la arquitectura ya existente, sin métricas nuevas (§4.10).

**Este documento NO define:**

- Ninguna pantalla, wireframe, card, tabla de interfaz o layout concreto. Pertenece íntegramente a `docs/design-system/` (`COMPONENT_LIBRARY.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`), que este documento no reinterpreta ni redefine.
- Ningún algoritmo de comparación, ordenamiento o cálculo de precio. Este documento describe la expectativa de comprensión de la persona, no el mecanismo técnico que la satisface.
- Ninguna tecnología de implementación.
- **La experiencia de búsqueda.** Corresponde íntegramente a `docs/product/SEARCH_EXPERIENCE.md`, ya gobernada; este documento parte de su punto de continuidad (§4.5 y §4.7 de ese documento) sin reabrirla.
- **La experiencia de detalle de un medicamento específico**, incluida cualquier profundización en bioequivalencia. Corresponde íntegramente a un futuro `MEDICATION_DETAIL_EXPERIENCE.md`; este documento solo enlaza hacia ella como continuidad posible (§4.7) y establece, sin desarrollarlo, el principio general de comparabilidad que esa experiencia futura deberá profundizar (§4.4).
- **La experiencia de alertas de precio.** Corresponde íntegramente a un futuro `PRICE_ALERTS_EXPERIENCE.md`; este documento solo la referencia como continuidad posible (§4.7).
- **La experiencia de compra.** `docs/product/PRODUCT_DEFINITION_v1.0.md` §10 ya excluye explícitamente la compra de medicamentos del alcance de la versión 1.0 del producto; este documento no la reabre.
- Ninguna decisión de identidad de marca, Foundation, Token, Componente, Patrón o Screen Template ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento los consume; no los reinterpreta ni los duplica.

---

## 4. Contenido principal

### 4.1 Objetivo del Usuario

Cuando una persona recibe resultados de búsqueda, no necesita "ver una lista" — necesita comprender, lo más rápido posible, qué alternativas reales tiene y cuál le conviene. Esa necesidad no es la misma para todas las personas que usan ComparaFarma: Carmen (`docs/product/PERSONAS.md`) solo quiere confirmar dónde es más barato, sin tener que interpretar nada adicional; Rodrigo no necesita saber cuál medicamento individual es más barato, sino "dónde gastar menos por toda la compra" — su comprensión debe operar sobre varios resultados a la vez, no sobre uno solo; Daniela necesita comprender lo suficiente para decidir en el tiempo que le queda antes de cerrar la aplicación ("si demoro más de un minuto cierro la aplicación"); Claudia, que compra los mismos medicamentos de forma permanente, necesita reconocer con la misma facilidad una alternativa que ya conoce.

En los cuatro casos, el objetivo real no es "ver los resultados", es **comprender lo suficiente para decidir con responsabilidad, sin tener que releer, sin tener que abrir cada opción una por una, y sin quedar expuesto a una diferencia de precio que en realidad no es comparable** (desarrollado en §4.4). Esto es consistente con `docs/brand/BRAND_FOUNDATIONS.md` §15: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir."* — la experiencia de resultados existe para ayudar a comprender, nunca para decidir en nombre de la persona.

### 4.2 ¿Qué constituye un resultado?

Sin hablar de tablas, cards ni interfaz: un resultado es la constatación verificada de que un medicamento buscado existe, de forma real y actual, a través de una farmacia específica y de un mecanismo de acceso a un precio concreto. No es una promesa, no es un estimado y no es una inferencia — es la confirmación de una alternativa real disponible en este momento, o la mejor información disponible sobre por qué no puede confirmarse con certeza (desarrollado en §4.6).

Un resultado nunca existe de forma aislada de la necesidad que lo originó: solo tiene sentido en relación con la búsqueda que lo produjo (`docs/product/SEARCH_EXPERIENCE.md` §4.3–§4.4) y con los demás resultados de esa misma búsqueda, con los que debe poder compararse en igualdad de condiciones (`docs/design-system/DESIGN_TOKENS.md` §4.4, familia semántica "Comparison": *"presentación de opciones equivalentes entre farmacias dentro de una misma comparación"*). Un resultado que no pueda compararse en igualdad de condiciones con los demás —porque representa una unidad de necesidad distinta, o porque le falta información esencial— no debe presentarse como si lo fuera; ese caso corresponde al estado de "información insuficiente" (§4.6), no a un resultado íntegro.

### 4.3 Información mínima necesaria

Fundamentada en la necesidad de la persona (§4.1), no en una lista de campos técnicos ni en ningún control visual, un resultado debe permitir responder, sin ambigüedad:

- **¿Es esto lo que busqué?** La identidad del medicamento encontrado debe corresponder, sin lugar a duda razonable, a la necesidad de la búsqueda que lo originó — condición mínima para que exista Confianza (Principio de producto 2, `docs/product/PRODUCT_PRINCIPLES.md`).
- **¿Dónde está disponible?** La farmacia donde existe esa alternativa — sin esta información, no hay nada que comparar, porque comparar precios entre farmacias es la propuesta de valor misma del producto (§2).
- **¿Cuánto costaría, y a través de qué mecanismo?** Un precio sin su mecanismo de acceso (compra en tienda, compra en línea, con una tarjeta de fidelización, u otro mecanismo equivalente) no es información comparable con otro precio de un mecanismo distinto — desarrollado con profundidad en §4.4. Consistente con el Principio de producto 6, Transparencia: *"Siempre mostraremos el origen de la información cuando corresponda."*
- **¿Existe realmente en este momento?** Que una alternativa haya existido en algún momento no es lo mismo que exista ahora — la ausencia de esta distinción ya generó un problema real y documentado en el producto: un medicamento agotado se presentó como disponible por una limitación de una de las fuentes consultadas (`docs/product/DECISION_LOG.md`, 2026-07-31, corrección de stock en AraucoMed). La experiencia de resultados no puede heredar ese riesgo: la disponibilidad real es información mínima, no un detalle secundario.
- **¿Qué tan reciente es esta información?** Los precios cambian con frecuencia — la propia Carmen lo identifica como su principal frustración (`PERSONAS.md`: *"los precios cambian mucho"*). Sin una noción de antigüedad de la información, la persona no puede calibrar cuánta confianza depositar en un resultado.
- **¿Cuánto podría ahorrar?** La visualización del ahorro potencial ya es una funcionalidad confirmada de la versión 1.0 del producto (`docs/product/PRODUCT_DEFINITION_v1.0.md` §9) — es, junto con el precio y la disponibilidad, la señal que responde más directamente al objetivo de la persona (§4.1).

Ninguno de estos seis elementos es, por sí solo, suficiente; todos son necesarios para que un resultado sostenga una decisión responsable. Un resultado al que le falte alguno de ellos no debe presentarse como completo — corresponde al estado de "información insuficiente" (§4.6).

### 4.4 Comprensión y Comparabilidad

Este es, junto con la Neutralidad (§4.8), uno de los principios centrales de esta experiencia.

**¿Cómo sabe la persona que está comparando alternativas equivalentes?** Porque todos los resultados de una misma búsqueda representan la misma unidad de necesidad: el mismo medicamento, en la misma dosis y en la misma cantidad — nunca dos presentaciones distintas mezcladas bajo la apariencia de ser la misma alternativa. Esta garantía ya existe, a nivel de producto, como una disciplina real de deduplicación que evita mezclar tamaños de envase distintos (`CLAUDE.md`, raíz del repositorio, sección "Funcionalidades Implementadas"). La experiencia de resultados no puede debilitar esa garantía al nivel de la comprensión: si el sistema ya verificó que dos alternativas responden a la misma necesidad, la persona debe poder confiar en que compararlas es seguro, sin tener que verificarlo ella misma leyendo cada detalle.

**¿Cómo comprende diferencias relevantes?** Una diferencia entre dos resultados solo es relevante si es atribuible a algo real — un precio distinto, una disponibilidad distinta, un mecanismo de acceso distinto — nunca a una inconsistencia en cómo se presenta la información. `docs/design-system/GRID_SYSTEM.md` §4.3 ya lo estableció como requisito estructural: *"el Grid debe sostener la lectura simultánea de múltiples atributos de una misma fila... sin esa alineación, la comparación deja de ser instantánea y exige lectura secuencial, contradiciendo la propuesta de valor de decidir 'en pocos segundos'."* Este documento no resuelve esa estructura —pertenece a `GRID_SYSTEM.md`—, pero sí exige, a nivel de experiencia, que cualquier diferencia percibida entre dos resultados corresponda siempre a una diferencia real entre ellos, nunca a un accidente de cómo se organizó la comparación.

**¿Cómo identifica información faltante?** La ausencia de un dato debe ser, en sí misma, información visible — nunca un vacío silencioso. Que una farmacia no ofrezca un mecanismo de acceso que otra sí ofrece (por ejemplo, compra en línea) no debe presentarse como si esa opción no existiera para evaluar, sino como una ausencia real y explícita de esa alternativa específica. Esto se desarrolla con más profundidad como principio de Transparencia (§4.9), porque una ausencia de información no comunicada correctamente es, en la práctica, una forma de información implícita — exactamente lo que la Transparencia prohíbe.

**¿Cómo evita interpretar erróneamente una diferencia de precio?** Aquí es donde la comparabilidad puede romperse de la forma más dañina, y no es un riesgo hipotético: ya ocurrió en producción. `docs/product/DECISION_LOG.md` (2026-07-23) documenta que un precio de un programa de fidelización descontinuado, oculto en el sitio real de una farmacia pero todavía presente en sus datos, se trató como un precio real y comparable — ganando sistemáticamente la comparación en el 94,8% de una muestra de productos, porque el cálculo del mejor precio toma siempre el valor más bajo entre los mecanismos disponibles. La causa no fue un error de cálculo: el cálculo hizo exactamente lo que debía hacer con un dato que no debería haber sido tratado como comparable. La lección para esta experiencia es directa: **un precio solo es comparable si el mecanismo que lo genera es real y vigente** — la responsabilidad de que eso sea cierto no es de esta experiencia (es de la verificación de datos, fuera de este alcance), pero la responsabilidad de que la persona nunca vea un precio sin saber a qué mecanismo corresponde (§4.3) sí lo es, y es la salvaguarda de experiencia que hace visible este tipo de error en vez de ocultarlo.

**Principio general de comparabilidad:** dos resultados solo son comparables entre sí si responden a la misma necesidad (§4.2), se presentan bajo el mismo criterio de cálculo para cualquier señal de "mejor opción" —el mismo "hecho ya calculado" que exigen `docs/brand/COLOR_SYSTEM.md` §4.5 y `docs/design-system/GRID_SYSTEM.md` §4.8—, y cualquier atributo que uno tenga y el otro no debe ser visible como una ausencia real, nunca asumido como una equivalencia. Este documento no desarrolla, deliberadamente, la bioequivalencia como criterio de comparabilidad clínica: esa distinción es más profunda que un principio de experiencia y corresponde a un futuro `MEDICATION_DETAIL_EXPERIENCE.md`. Que esa distinción todavía no tenga una fuente de datos regulatoria homogénea entre las nueve farmacias del producto es, de hecho, un problema real ya identificado y bloqueado explícitamente en `docs/product/DECISION_LOG.md` (2026-07-31: *"Sprint B queda bloqueado hasta resolver esa fuente de datos, por el Principio 7 del Libro Fundacional"*) — evidencia de que este documento no está anticipando un problema hipotético, sino reconociendo uno que el producto ya enfrenta y todavía no ha resuelto.

### 4.5 Jerarquía de la Información

Sin describir layouts, posiciones ni componentes: no toda la información de un resultado merece la misma atención, y el criterio para decidir cuál merece más no es editorial — es la distancia entre esa información y el objetivo real de la persona (§4.1).

El precio efectivo y el ahorro potencial, junto con la disponibilidad real de la alternativa, son la información que esta experiencia considera de mayor jerarquía — no por preferencia de diseño, sino porque son los dos tipos de dato sin los cuales ninguna decisión de compra puede tomarse con responsabilidad: un precio sin disponibilidad real es una promesa vacía, y una disponibilidad sin precio no permite comparar. Esta jerarquía debe trazarse a los niveles de prioridad perceptual ya gobernados en `docs/design-system/ELEVATION_SYSTEM.md` §4.2 (información base, contextual, prioritaria, crítica) — este documento no redefine esos niveles ni crea uno nuevo; establece únicamente cuál información de un resultado corresponde funcionalmente a la prioridad más alta dentro de esa arquitectura ya existente.

La identidad del medicamento, el mecanismo de acceso al precio y la antigüedad de la información (§4.3) son necesarios para comprender y confiar en el resultado, pero no compiten con el precio y la disponibilidad por la atención principal de la persona — son la información que sostiene la confianza en lo que ya se está mirando, no la que determina la primera mirada.

### 4.6 Estados de la Experiencia

Estados conceptuales, sin pantallas:

- **Resultados disponibles.** El estado normal de continuación desde `docs/product/SEARCH_EXPERIENCE.md` §4.6 ("Resultados encontrados"): existen una o más alternativas verificadas y comprensibles.
- **Resultados parciales.** No todas las fuentes que ComparaFarma consulta respondieron a tiempo o con éxito — un resultado parcial no es un error de la experiencia, es una respuesta honesta cuando no toda la información pudo verificarse en ese momento. El producto ya está diseñado para que la falla de una fuente no bloquee a las demás (`CLAUDE.md`, arquitectura del backend); este documento no describe ese mecanismo, solo exige que la persona perciba la diferencia entre "esto es todo lo que existe" y "esto es todo lo que pudo verificarse a tiempo."
- **Múltiples alternativas.** El caso donde la Comparabilidad (§4.4) tiene más trabajo que hacer: varias farmacias, varios mecanismos, y la persona necesita comprenderlas en conjunto, no una por una.
- **Una única alternativa.** Cuando solo una farmacia tiene el medicamento buscado, la experiencia no debe fingir que existe una comparación donde no la hay, pero tampoco debe presentarse con la misma incertidumbre que la ausencia total de resultados (siguiente estado) — es una respuesta completa, aunque no sea una respuesta comparativa.
- **Información insuficiente.** Un resultado existe, pero le falta suficiente información mínima (§4.3) para sostener una decisión responsable. Este estado es distinto de "no encontrado": el medicamento existe en esa farmacia, pero no hay, todavía, suficiente certeza sobre su precio, su disponibilidad o su vigencia. Consistente con el Principio de producto 7, Calidad: *"Preferimos retrasar una publicación antes que entregar información incorrecta"* — extendido aquí a nivel de resultado individual: se prefiere mostrar un dato como ausente antes que inferirlo o completarlo artificialmente.
- **Sin resultados.** Este documento no redefine ese estado — pertenece íntegramente a `docs/product/SEARCH_EXPERIENCE.md` §4.6; la experiencia de resultados nunca lo recibe como un estado propio que deba interpretar de forma distinta.

### 4.7 Continuidad

Una vez que la persona comprendió los resultados, sin desarrollar ninguno de estos flujos, puede:

- **Profundizar en un medicamento específico** de los resultados comprendidos — enlaza hacia un futuro `MEDICATION_DETAIL_EXPERIENCE.md` (§7), que también deberá desarrollar la comparabilidad clínica (bioequivalencia) que este documento deliberadamente no resuelve (§4.4).
- **Guardar el resultado o configurar una alerta** sobre un precio ya comprendido — enlaza hacia un futuro `PRICE_ALERTS_EXPERIENCE.md` (§7).
- **Volver a la experiencia de búsqueda** con una nueva necesidad — enlaza hacia `docs/product/SEARCH_EXPERIENCE.md`, ya gobernada.
- **Combinar esta comprensión dentro de un objetivo más amplio de la persona** (por ejemplo, evaluar varios medicamentos de una misma receta, como Rodrigo) — enlaza hacia un futuro `USER_JOURNEYS.md` (§7), que gobernará cómo múltiples experiencias, incluida esta, se combinan en un Flujo completo.

Ninguna de estas continuaciones se desarrolla en este documento.

### 4.8 Neutralidad

Este es el segundo capítulo central de este documento, y una nueva aplicación transversal del mismo principio ya desarrollado en Grid (`GRID_SYSTEM.md` §4.8), Spacing, Color (`docs/brand/COLOR_SYSTEM.md` §4.5), Elevation (`ELEVATION_SYSTEM.md` §4.7), el catálogo de Tokens (`DESIGN_TOKENS.md` §4.1, con énfasis particular en la familia "Comparison", §4.4), la Component Library (`COMPONENT_LIBRARY.md` §4.6), la capa de Patrones (`PATTERNS.md` §4.6), la capa de Screen Templates (`SCREEN_TEMPLATES.md` §4.6) y la propia experiencia de búsqueda (`docs/product/SEARCH_EXPERIENCE.md` §4.8): esta es, dentro de esa misma cadena, la aplicación número once.

**Cómo los resultados deben mantenerse imparciales:** ningún resultado puede aparecer, ausentarse, ordenarse o destacarse por una razón distinta a un hecho ya calculado de forma objetiva por el sistema —`effective = min(store, online, cmr, sbpay)`, el mismo "hecho ya calculado" ya reconocido como criterio legítimo en `docs/brand/COLOR_SYSTEM.md` §4.5 y `docs/design-system/GRID_SYSTEM.md` §4.8—. Ninguna posición, énfasis o ausencia dentro de esta experiencia puede originarse en una decisión distinta a ese cálculo.

- **Farmacias:** ninguna farmacia puede recibir una posición o un tratamiento más favorable por conveniencia comercial — consecuencia directa de `docs/brand/BRAND_FOUNDATIONS.md` §12 (*"no privilegiamos una farmacia por sobre otra por conveniencia comercial"*) y del compromiso permanente de no alterar una recomendación por beneficio económico propio (§18 de ese mismo documento).
- **Laboratorios y marcas:** ningún resultado puede presentarse como preferible por el laboratorio o la marca que representa. La tensión real entre marca y equivalente ya está documentada como un problema activo del producto, no resuelto todavía (`docs/product/DECISION_LOG.md`, 2026-07-31, sobre la falta de una fuente de verdad regulatoria homogénea para `isBioequivalent`) — esta experiencia no resuelve esa tensión (§4.4), pero tampoco puede, mientras no esté resuelta, dar la apariencia de una preferencia que el sistema no puede sostener con evidencia.
- **Promociones y convenios comerciales:** ninguna alianza comercial puede alterar qué resultados existen, cómo se ordenan o qué tan comprensibles son, consistente con el compromiso de mantener "la independencia editorial y técnica frente a cualquier interés comercial" (`BRAND_FOUNDATIONS.md` §18) y con la declaración explícita del Libro Fundacional, ya citada en ese mismo documento (§12): *"Nunca venderemos una posición privilegiada en nuestros resultados."*

**Los resultados ayudan a decidir. Nunca deciden por el usuario.** Esta distinción, tomada directamente de `docs/brand/BRAND_FOUNDATIONS.md` §15 (*"Una buena experiencia ayuda a decidir. Nunca empuja a decidir"*), es la frontera que separa la Jerarquía de la Información (§4.5) de una manipulación: destacar el precio efectivo y la disponibilidad real porque son, objetivamente, la información que más ayuda a decidir (§4.5) es coherente con este principio; destacar cualquier resultado por una razón que la persona no podría verificar por sí misma —una alianza comercial, una preferencia editorial— sería, en cambio, decidir en su nombre.

Estas son reglas de experiencia, no reglas de interfaz: este documento no dice cómo debe verse un resultado destacado — dice qué no puede depender de un interés comercial en el momento en que ese resultado se comprende.

### 4.9 Transparencia

Nuevo capítulo, sin describir UI.

**Qué debe ser comprensible:** el significado de cada resultado —qué representa, de qué mecanismo proviene su precio, si está disponible en este momento— debe poder entenderse sin que la persona necesite conocimiento previo sobre cómo funciona ComparaFarma o cómo operan las farmacias.

**Qué debe ser explicable:** cualquier diferencia entre dos resultados debe poder atribuirse a algo real y nombrable —un mecanismo, una disponibilidad, una antigüedad de dato—, nunca a "el sistema lo decidió así." Esto es consecuencia directa del Principio de producto 6: *"Siempre mostraremos el origen de la información cuando corresponda"* (`docs/product/PRODUCT_PRINCIPLES.md`).

**Qué nunca debe quedar implícito:** la ausencia de un dato (§4.3, §4.4), la parcialidad de un conjunto de resultados (§4.6) y la antigüedad de la información nunca deben quedar implícitas ni suavizadas — deben ser tan visibles como el dato mismo cuando existe. Consistente con el Principio de producto 7, Calidad, ya aplicado en §4.6: preferir mostrar una ausencia real antes que completarla artificialmente.

**Cómo mantener la confianza del usuario:** `docs/brand/BRAND_FOUNDATIONS.md` §10 ya lo declara como promesa oficial: *"No prometemos tener siempre el precio más bajo. Prometemos mostrar la información de la forma más clara y útil posible."* Esta experiencia sostiene esa promesa, no prometiendo perfección en los datos, sino comprometiéndose a que cualquier error se vuelva visible y corregible en vez de oculto — consistente con el compromiso permanente de "reconocer los errores en vez de justificarlos" (`BRAND_FOUNDATIONS.md` §18). Esto no es un principio abstracto: ya es la forma en que el producto ha actuado en la práctica. Cuando se identificaron errores reales de datos —un precio fantasma de un programa descontinuado, una disponibilidad incorrecta— fueron diagnosticados, corregidos y registrados abiertamente (`docs/product/DECISION_LOG.md`, entradas del 2026-07-23 y del 2026-07-31), no minimizados. La confianza de esta experiencia se sostiene con esa misma disciplina: la posibilidad de un error no se oculta detrás de una interfaz segura en apariencia — se hace visible cuando existe.

### 4.10 Accesibilidad

Esta experiencia hereda accesibilidad de la misma arquitectura ya gobernada — `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7 — sin definir aquí ninguna métrica nueva.

La necesidad es, si cabe, más exigente aquí que en la búsqueda (`docs/product/SEARCH_EXPERIENCE.md` §4.9): comprender una comparación entre varias alternativas exige más de la persona que comprender un solo resultado. Carmen, de 72 años y con un nivel tecnológico básico, cuyas necesidades declaradas son "letras grandes", "botones simples", "pocos pasos" e "información clara" (`docs/product/PERSONAS.md`), tiene que poder comprender una comparación con la misma facilidad con la que Daniela, que abandona si demora más de un minuto, necesita comprenderla con velocidad. Ambas exigencias —comprensión sin esfuerzo y comprensión sin demora— son la misma disciplina de accesibilidad aplicada desde dos necesidades distintas, consistente con el Principio de producto 4: *"Cada pantalla debe resolver un problema específico"* (`PRODUCT_PRINCIPLES.md`) — en este caso, el problema específico es comprender una comparación, no memorizarla ni descifrarla.

---

## 5. Relaciones

`RESULTS_EXPERIENCE.md` depende directamente de `docs/product/SEARCH_EXPERIENCE.md`, cuya sección 4.5 (Resultado Esperado) y 4.7 (Continuidad) entregan el punto exacto de partida de este documento, y de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md`, fuente directa de §4.1, §4.3 y §4.10. Depende de `docs/product/DECISION_LOG.md`, cuyas entradas reales sobre errores de datos y sobre la tensión de bioequivalencia fundamentan directamente §4.4, §4.8 y §4.9 con evidencia concreta, no hipotética. Consume, sin redefinirla, la arquitectura ya gobernada en `docs/brand/BRAND_FOUNDATIONS.md` y en `docs/design-system/` (`GRID_SYSTEM.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`, `COMPONENT_LIBRARY.md`, `DESIGN_TOKENS.md`), que ya anticiparon la comparación como región funcional, familia de Patrones, familia de Screen Templates y familia semántica de Tokens, sin describir la experiencia de comprensión que este documento desarrolla.

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos describe qué necesita comprender la persona al recibir resultados, qué constituye un resultado, ni cómo se sostiene su comparabilidad. Este documento tampoco resuelve, por su cuenta, ninguna decisión de arquitectura de interfaz, ninguna experiencia de detalle, alertas o Flujo completo, ni el registro de su propia creación en `docs/product/DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Punto de partida de esta experiencia (Resultado Esperado, Continuidad) | `docs/product/SEARCH_EXPERIENCE.md` §4.5, §4.7 | ✔ — fundamenta §2 y §4.2 | Sin reabrir la experiencia de búsqueda |
| Propuesta de valor ("en pocos segundos, el mejor precio") | `docs/product/PRODUCT_DEFINITION_v1.0.md` §7 | ✔ — fundamenta §2 y §4.1 | — |
| Ahorro potencial y ficha del medicamento como funcionalidades confirmadas | `docs/product/PRODUCT_DEFINITION_v1.0.md` §9 | ✔ — fundamenta §4.3, §4.5 | — |
| Exclusión de compra de medicamentos en v1.0 | `docs/product/PRODUCT_DEFINITION_v1.0.md` §10 | ✔ — fundamenta la exclusión de §3 | — |
| Principios de producto (Confianza, Transparencia, Calidad, Simplicidad) | `docs/product/PRODUCT_PRINCIPLES.md` | ✔ — consolidados en §4.3, §4.6, §4.9, §4.10 | Ningún principio nuevo agregado |
| Necesidades reales de personas (Carmen, Rodrigo, Daniela, Claudia) | `docs/product/PERSONAS.md` | ✔ — fundamentan §4.1 y §4.10 | — |
| Bug real de precio fantasma (EasyFarma) | `docs/product/DECISION_LOG.md` (2026-07-23) | ✔ — evidencia concreta citada en §4.4 y §4.9 | No es una decisión nueva; se cita como hecho ya registrado |
| Bug real de disponibilidad (AraucoMed) | `docs/product/DECISION_LOG.md` (2026-07-31) | ✔ — evidencia concreta citada en §4.3 y §4.9 | No es una decisión nueva; se cita como hecho ya registrado |
| Riesgo real de comparabilidad clínica (`isBioequivalent`) | `docs/product/DECISION_LOG.md` (2026-07-31) | ✔ — evidencia concreta citada en §4.4 y §4.8 | No es una decisión nueva; se cita como hecho ya registrado |
| Región funcional de Comparación y alineación entre filas | `docs/design-system/GRID_SYSTEM.md` §4.3 | ✔ — fundamenta §4.4 | — |
| Neutralidad estructural ya aplicada a resultados | `docs/design-system/GRID_SYSTEM.md` §4.8 | ✔ — extendida a la comprensión de resultados en §4.8 (undécima aplicación) | — |
| Familia semántica "Comparison" de Tokens | `docs/design-system/DESIGN_TOKENS.md` §4.4 | ✔ — fundamenta §4.2 y §4.8 | Referenciada, no duplicada |
| Familia de Componentes "Comparación" | `docs/design-system/COMPONENT_LIBRARY.md` §4.4, §4.6 | Referenciada, no duplicada (§5) | — |
| Familia de Patrones "Comparación" | `docs/design-system/PATTERNS.md` §4.4, §4.6 | Referenciada, no duplicada (§5) | — |
| Familia de Screen Templates "Comparación" y "Detalle" | `docs/design-system/SCREEN_TEMPLATES.md` §4.4 | Referenciada, no duplicada (§5) | — |
| Niveles de prioridad perceptual (Elevation) | `docs/design-system/ELEVATION_SYSTEM.md` §4.2 | Referenciados, no redefinidos (§4.5) | Ninguna jerarquía visual nueva creada |
| Promesa oficial ("no prometemos el precio más bajo, prometemos claridad") | `docs/brand/BRAND_FOUNDATIONS.md` §10 | ✔ — fundamenta §4.9 | — |
| "Ayuda a decidir, nunca empuja a decidir" | `docs/brand/BRAND_FOUNDATIONS.md` §15 | ✔ — fundamenta §4.1 y §4.8 | — |
| No privilegiar farmacias por conveniencia comercial | `docs/brand/BRAND_FOUNDATIONS.md` §12, §18 | ✔ — fundamenta §4.8 | — |
| Contrato de datos (canales de precio, disponibilidad, antigüedad) | `CLAUDE.md` (raíz del repositorio) | ✔ — traducido a información mínima en §4.3, sin describir el mecanismo técnico | No se nombra tecnología |
| Accesibilidad por herencia arquitectónica | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.4; `SPACING_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.7 | Referenciada, no duplicada (§4.10) | Ninguna métrica nueva definida |
| Registro de la creación de este documento | `docs/product/DECISION_LOG.md` | Pendiente — no existe todavía una entrada propia | Ver nota de pendiente en §7 |
| Detalle de medicamento, alertas de precio y comparabilidad clínica (bioequivalencia) | — (no existen todavía como documentos) | No consolidado — declarado explícitamente fuera de alcance (§3, §4.4) | Pendiente de `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` |
| `USER_JOURNEYS.md` (futuro gobierno de Flujos completos) | — (no existe todavía) | No consolidado — anticipado, no creado (§7) | — |

---

## 7. Gobierno

`RESULTS_EXPERIENCE.md` **no reemplaza**:

- `docs/product/SEARCH_EXPERIENCE.md` — sigue siendo la única fuente de la experiencia de búsqueda; este documento parte de su punto de continuidad sin reabrirla.
- `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md` — siguen siendo la única fuente de la definición de producto, sus principios y las necesidades de las personas que lo usan.
- `docs/brand/BRAND_FOUNDATIONS.md` y el resto de `docs/brand/` — siguen siendo la única fuente de identidad de marca.
- `docs/design-system/DESIGN_SYSTEM.md`, `GRID_SYSTEM.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`, `COMPONENT_LIBRARY.md`, `DESIGN_TOKENS.md` y el resto del dominio `docs/design-system/` — siguen siendo la única fuente de arquitectura de producto; este documento no define ninguna pantalla, patrón, componente o Token, solo la experiencia de comprensión que deberán servir.
- Un futuro `MEDICATION_DETAIL_EXPERIENCE.md` — cuando exista, será la única fuente de la experiencia de detalle, incluida la comparabilidad clínica (bioequivalencia) que este documento deliberadamente no resuelve (§4.4); este documento solo la enlaza como continuidad (§4.7).
- Un futuro `PRICE_ALERTS_EXPERIENCE.md` — cuando exista, será la única fuente de esa experiencia; este documento solo la enlaza como continuidad (§4.7).
- Un futuro `USER_JOURNEYS.md` — cuando exista, será la única fuente de gobierno de los Flujos completos que combinan esta experiencia con otras; este documento no se atribuye esa responsabilidad.

La responsabilidad específica de `RESULTS_EXPERIENCE.md` es gobernar exclusivamente **la experiencia de comprensión de resultados**: qué necesita comprender la persona, qué constituye un resultado, qué información mínima requiere, cómo se sostiene su comparabilidad, qué jerarquía de atención merece cada dato, sus estados conceptuales, su continuidad, y los principios de Neutralidad y Transparencia que debe respetar. No gobierna, y no debe absorber en ninguna revisión futura, ninguna pantalla, componente, patrón, algoritmo o tecnología, ni la experiencia de búsqueda, detalle, alertas o compra — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la interfaz del producto.

**Cómo evoluciona este documento:** cualquier cambio en qué constituye un resultado, la información mínima necesaria, los estados o los principios aquí declarados debe evaluarse contra la evidencia ya citada en `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md` (§6) antes de aprobarse, y debe registrarse en `docs/product/DECISION_LOG.md` como una decisión de producto, siguiendo el mecanismo de registro ya existente en ese dominio.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/`, `docs/design-system/` y `docs/product/SEARCH_EXPERIENCE.md`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Además: la creación de este documento, como segundo entregable de la PHASE 2 — Product Experience, constituye una decisión de producto en el sentido del mecanismo de registro ya existente en `docs/product/DECISION_LOG.md`. Esa decisión todavía no cuenta con una entrada propia en ese registro. Este documento no se autorregistra — señala aquí, de forma explícita, que esa incorporación requiere aprobación y registro posterior, siguiendo la misma disciplina de gobierno ya aplicada durante toda la Fase 1 y en `docs/product/SEARCH_EXPERIENCE.md`.

---

## 8. Documentos relacionados

- `docs/product/SEARCH_EXPERIENCE.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/PERSONAS.md`
- `docs/product/DECISION_LOG.md`
- `docs/product/README.md`
- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/PATTERNS.md`
- `docs/design-system/SCREEN_TEMPLATES.md`
- `docs/design-system/COMPONENT_LIBRARY.md`
- `docs/design-system/DESIGN_TOKENS.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Draft | Pendiente (CEO/fundador) | Creación inicial, como segundo documento de la PHASE 2 — Product Experience. Define la experiencia oficial de comprensión de resultados de ComparaFarma: objetivo real de la persona derivado de `PERSONAS.md` y `PRODUCT_DEFINITION_v1.0.md`; qué constituye un resultado y su información mínima fundamentada en la necesidad de decisión; principio de comparabilidad desarrollado en profundidad, incluida evidencia real de sus riesgos (bug de precio fantasma en EasyFarma, bug de disponibilidad en AraucoMed, tensión de bioequivalencia sin fuente regulatoria); jerarquía de la información trazada a Elevation sin redefinirla; seis estados conceptuales; continuidad enlazada (no desarrollada) hacia detalle, alertas y Flujos; Neutralidad aplicada a resultados como undécima aplicación transversal del principio; Transparencia como capítulo nuevo, con evidencia real de cómo el producto ya trata sus propios errores de datos; accesibilidad heredada sin métricas nuevas. No crea pantallas, wireframes, cards, tablas de UI, layouts, componentes ni algoritmos; no describe compra, detalle ni alertas. Señala, sin resolverlo por su cuenta, que su propia creación requiere aprobación y registro posterior en `docs/product/DECISION_LOG.md`. | `docs/product/SEARCH_EXPERIENCE.md` v1.0; `PRODUCT_DEFINITION_v1.0.md` v1.0; `PRODUCT_PRINCIPLES.md`; `PERSONAS.md`; `docs/product/DECISION_LOG.md`; `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design-system/GRID_SYSTEM.md` v1.1; `PATTERNS.md` v1.1; `SCREEN_TEMPLATES.md` v1.1; `COMPONENT_LIBRARY.md` v1.1; `DESIGN_TOKENS.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Apertura de la PHASE 2 — Product Experience y definición de la experiencia oficial de búsqueda | Product Manager / UX Architect / Enterprise Documentation Architect | `docs/product/SEARCH_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.2 — Results Experience: definición de la experiencia oficial de comprensión de resultados, segundo documento de la PHASE 2 — Product Experience | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems | `docs/product/RESULTS_EXPERIENCE.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Queda pendiente: el registro en `docs/product/DECISION_LOG.md` de la creación de este documento (señalado en §7), la creación de `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`, y toda implementación concreta de interfaz que traduzca esta experiencia a un producto real.
