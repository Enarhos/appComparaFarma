# SEARCH_EXPERIENCE — Especificación Oficial de la Experiencia de Búsqueda de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, componentes, layouts ni navegación. No implementa interfaces ni describe tecnología. Es la **especificación oficial de la experiencia de búsqueda**: qué intenta lograr una persona cuando busca un medicamento en ComparaFarma, qué espera de ese proceso, y qué principios debe respetar esa experiencia sin importar cómo se implemente. Debe seguir siendo válido aunque cambie por completo la interfaz del producto, porque no gobierna esa interfaz — gobierna la experiencia que cualquier interfaz futura deberá servir.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

Este documento inaugura oficialmente la **PHASE 2 — Product Experience** y pertenece al dominio `docs/product/`, no a `docs/design-system/`. Consume la arquitectura ya gobernada por ambos dominios (identidad de marca, Design System) sin redefinirla en ningún punto.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PROD-EXP-001 |
| **Nombre** | SEARCH_EXPERIENCE.md |
| **Dominio** | Product (`docs/product/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / Product Manager |
| **Rol asumido en su redacción** | Product Manager / UX Architect / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md`, y consume, sin redefinirla, la arquitectura ya gobernada por `docs/brand/` y `docs/design-system/`. Es el primer documento del dominio Product que gobierna experiencia de producto, distinto de los documentos ya existentes de backlog, roadmap o estrategia comercial |
| **Clasificación** | Documento de Product Experience / Documento Inaugural de Fase |
| **Fuente Oficial** | Este documento es la fuente oficial de **qué representa, para la persona, el momento de búsqueda** dentro de ComparaFarma: su objetivo, sus disparadores, la información que aporta, lo que espera del procesamiento y del resultado, sus estados, su continuidad y sus principios de neutralidad y accesibilidad. No es fuente de ninguna pantalla, componente, patrón, algoritmo o tecnología (no creados), ni de la experiencia de comparación, detalle o alertas de precio (fuera de alcance, §3) |
| **Documentos de los que depende** | `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/DESIGN_BRIEF.md`, `docs/design/system/DESIGN_SYSTEM.md`, `GRID_SYSTEM.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería condicionar, como punto de partida de la experiencia completa del producto, a los futuros `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md` |
| **Pregunta que responde** | ¿Cómo debe ser la experiencia completa de búsqueda de medicamentos en ComparaFarma para ayudar a las personas a tomar una mejor decisión? |

---

## 2. Propósito

`docs/product/PRODUCT_DEFINITION_v1.0.md` §7 ya declara la propuesta de valor de ComparaFarma: "conocer, en pocos segundos, dónde un medicamento tiene el mejor precio disponible entre distintas farmacias." La búsqueda es el primer y único punto de entrada a esa propuesta de valor — antes de que exista cualquier comparación, cualquier detalle o cualquier alerta, la persona debe primero encontrar el medicamento que busca. `docs/design/system/GRID_SYSTEM.md` §4.3 ya lo señaló estructuralmente: "la búsqueda es la entrada al mecanismo de decisión que el producto existe para servir" (`docs/design/brand/BRAND_FOUNDATIONS.md` §7).

Este documento representa, dentro del producto, **el momento en que una necesidad real de una persona se convierte en una consulta que ComparaFarma puede responder**. No es una pantalla, no es un componente y no es todavía una comparación: es la experiencia completa que empieza cuando alguien decide que necesita saber algo sobre un medicamento, y termina cuando ComparaFarma le entrega suficiente señal para decidir si continúa explorando esa respuesta.

---

## 3. Alcance

**Este documento define:**

- El objetivo real de la persona al iniciar una búsqueda, desde su necesidad y no desde el negocio (§4.1).
- Los disparadores conceptuales que originan una búsqueda (§4.2).
- Qué información puede aportar la persona al buscar, sin describir controles de interfaz (§4.3).
- Qué espera la persona que ComparaFarma haga con esa información, sin describir algoritmos (§4.4).
- Qué espera la persona obtener como resultado de la búsqueda, sin describir la pantalla de resultados (§4.5).
- Los estados conceptuales por los que puede pasar la experiencia de búsqueda, sin describir pantallas (§4.6).
- Qué decisiones puede tomar la persona una vez terminada la búsqueda, sin desarrollar esos flujos (§4.7).
- El principio de Neutralidad aplicado específicamente a la búsqueda (§4.8).
- Cómo debe mantenerse la accesibilidad durante toda la experiencia, sin métricas (§4.9).

**Este documento NO define:**

- Ninguna pantalla, wireframe, componente, layout o elemento de navegación concreto. Pertenece íntegramente a `docs/design-system/` (`COMPONENT_LIBRARY.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md`), que este documento no reinterpreta ni redefine.
- Ningún algoritmo de búsqueda, normalización o coincidencia. Este documento describe la expectativa de la persona sobre el procesamiento, no el mecanismo técnico que la satisface.
- Ninguna tecnología de implementación.
- **La experiencia de comparación de precios entre farmacias.** Corresponde íntegramente a un futuro `RESULTS_EXPERIENCE.md`; este documento solo enlaza hacia ella como continuidad posible (§4.7), sin describir cómo se presentan ni se ordenan los resultados.
- **La experiencia de detalle de un medicamento específico.** Corresponde íntegramente a un futuro `MEDICATION_DETAIL_EXPERIENCE.md`; este documento solo la referencia como continuidad posible (§4.7).
- **La experiencia de alertas de precio.** Corresponde íntegramente a un futuro `PRICE_ALERTS_EXPERIENCE.md`; este documento solo la referencia como continuidad posible (§4.7).
- Ninguna decisión de identidad de marca, Foundation, Token, Componente, Patrón o Screen Template ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento los consume; no los reinterpreta ni los duplica.

---

## 4. Contenido principal

### 4.1 Objetivo del Usuario

Cuando una persona abre ComparaFarma para buscar un medicamento, no está buscando "una aplicación que compare precios" — está buscando resolver, lo más rápido posible, una pregunta concreta sobre algo que ya necesita: *¿puedo pagar menos por esto sin tener que recorrer varias farmacias?* Las personas que ya usan el producto lo confirman en sus propias palabras (`docs/product/definition/PERSONAS.md`): Carmen —"Solo quiero saber dónde comprar más barato"— busca ahorro sin esfuerzo adicional; Daniela —"Si demoro más de un minuto cierro la aplicación"— busca velocidad antes que cualquier otra cosa; Rodrigo no busca saber cuál medicamento es más barato, busca "dónde gastar menos por toda la compra"; Claudia, que compra los mismos medicamentos de forma permanente, busca no tener que repetir el mismo esfuerzo cada vez.

Ninguno de estos objetivos es "usar el buscador". El buscador es el medio; el objetivo real de la persona es **reducir la incertidumbre sobre cuánto va a pagar, con el menor esfuerzo y en el menor tiempo posible** — consistente con `docs/product/PRODUCT_DEFINITION_v1.0.md` §5 (la asimetría de información entre farmacias) y con el Principio de producto 5, "Rapidez": *"encontrar un medicamento debe tomar pocos segundos"* (`docs/product/PRODUCT_PRINCIPLES.md`).

### 4.2 Disparadores

Una búsqueda no ocurre por curiosidad — ocurre porque una necesidad real ya existe. Disparadores conceptuales, sin diseñar ningún flujo:

- **Recibió una receta médica** y necesita saber dónde comprar lo que le indicaron, muchas veces más de un medicamento a la vez — el disparador de Rodrigo, cuyo objetivo no es un medicamento aislado sino toda la receta.
- **Necesita renovar un tratamiento permanente** que ya compra de forma recurrente — el disparador de Carmen y de Claudia, para quienes la búsqueda no es exploratoria: ya saben qué necesitan, solo necesitan confirmar dónde conviene comprarlo esta vez.
- **Quiere saber si existe una alternativa** a lo que habitualmente compra, sin que eso implique todavía una decisión clínica — un disparador de exploración, distinto del de renovación.
- **Desea conocer el precio** de un medicamento puntual antes de decidir si lo compra, con poco tiempo disponible para averiguarlo — el disparador de Daniela.

Estos disparadores no son mutuamente excluyentes ni agotan todas las situaciones posibles; representan las necesidades reales ya identificadas en `docs/product/definition/PERSONAS.md` que explican por qué alguien inicia una búsqueda, no un flujo de decisión entre ellos.

### 4.3 Información de Entrada

Conceptualmente, sin describir ningún control de interfaz, la persona puede aportar:

- **El nombre del medicamento, tal como lo recuerda o lo tiene escrito** — no necesariamente su nombre clínico exacto, ni con la ortografía correcta, ni en el mismo formato en que aparece en el empaque o en la receta. Es información imprecisa por naturaleza, y la experiencia debe asumir esa imprecisión como la condición normal de entrada, no como una excepción.
- **Una búsqueda ya realizada antes**, cuando la persona vuelve a necesitar algo que ya buscó — coherente con el historial de búsquedas recientes ya implementado en el producto (`CLAUDE.md`, raíz del repositorio, sección "Funcionalidades Implementadas": historial de las últimas búsquedas), que le permite a alguien como Claudia no tener que reformular desde cero una necesidad que ya es recurrente.
- **Nada más que eso.** Esta experiencia no exige que la persona sepa la dosis, la presentación, el laboratorio o cualquier otro dato técnico para poder iniciar una búsqueda — exigir ese conocimiento contradiría directamente el objetivo de reducir esfuerzo ya declarado en §4.1.

### 4.4 Procesamiento Esperado

Sin describir ningún algoritmo: la persona espera que, a partir de lo que escribió —imperfecto, incompleto o ambiguo—, ComparaFarma **entienda lo que quiso decir, no solo lo que escribió literalmente**. Esta expectativa ya está reconocida, a nivel de flujo, en `CLAUDE.md` ("Flujo de una Búsqueda": lo que la persona escribe se interpreta antes de convertirse en una consulta real) — este documento no describe cómo se logra esa interpretación, solo constata que la persona la espera como parte natural de la experiencia, no como una función avanzada.

La persona también espera que esa consulta cubra **todas las fuentes relevantes a las que ComparaFarma tiene acceso**, no una fuente parcial o una selección arbitraria — no porque conozca cuántas farmacias existen o cómo se consultan, sino porque su objetivo (§4.1) es reducir incertidumbre, y una respuesta parcial no la reduce, la traslada. Y espera que todo esto ocurra dentro del tiempo ya comprometido por el Principio de producto 5 ("Rapidez"): una respuesta correcta que llega demasiado tarde no cumple el objetivo de la persona, aunque técnicamente sea exitosa.

### 4.5 Resultado Esperado

Sin describir todavía la pantalla de resultados: lo que la persona espera obtener al terminar de escribir su búsqueda no es, todavía, una comparación completa — es una respuesta a una pregunta más simple y previa: **¿existe esto que busco, y hay algo aquí que valga la pena revisar?** `docs/product/PRODUCT_DEFINITION_v1.0.md` §13 ya distingue, entre sus criterios de éxito, "Búsquedas realizadas" de "Comparaciones efectuadas" como métricas separadas — confirmando que, incluso a nivel de negocio, el momento de buscar y el momento de comparar son experiencias distintas y consecutivas, no un mismo evento.

La expectativa de resultado de esta experiencia termina, por lo tanto, en el momento en que la persona sabe si su búsqueda encontró algo — y, si encontró algo, que existe suficiente señal para decidir si continúa hacia una comparación real. Qué forma toma esa señal, cómo se presenta o cómo se ordena, es responsabilidad de un futuro `RESULTS_EXPERIENCE.md` (§7), no de este documento.

### 4.6 Estados de la Experiencia

Estados conceptuales, sin pantallas:

- **Inicio.** La persona todavía no ha aportado ninguna información de entrada (§4.3); la experiencia está disponible pero no hay todavía una búsqueda en curso.
- **Búsqueda en proceso.** La persona ya aportó información y espera una respuesta; la experiencia debe comunicar, de alguna forma, que la consulta está en curso —sin que la persona necesite entender por qué demora—, coherente con la existencia ya implementada de un estado de carga durante la búsqueda (`CLAUDE.md`, sección "Funcionalidades Implementadas").
- **Resultados encontrados.** La búsqueda produjo al menos una coincidencia relevante; la experiencia de búsqueda entrega, en este estado, la señal descrita en §4.5.
- **Sin resultados.** La búsqueda no encontró ninguna coincidencia relevante; este estado debe comunicar con la misma claridad que el anterior que la ausencia de resultados es una respuesta válida, no un fallo de la experiencia — un estado ya reconocido como necesario en el producto (`CLAUDE.md` documenta un componente dedicado a comunicar la ausencia de resultados, sin que este documento describa su forma).
- **Error.** La experiencia no puede responder en este momento, por una razón ajena a si el medicamento existe o no — un estado distinto de "Sin resultados", porque en este caso la pregunta de la persona (§4.5) queda sin respuesta, no respondida negativamente.

### 4.7 Continuidad

Una vez terminada la búsqueda, sin desarrollar ninguno de estos flujos, la persona puede:

- **Continuar hacia una comparación** de las opciones encontradas — enlaza hacia un futuro `RESULTS_EXPERIENCE.md` (§7).
- **Profundizar en un medicamento específico** de los resultados — enlaza hacia un futuro `MEDICATION_DETAIL_EXPERIENCE.md` (§7).
- **Guardar el resultado o configurar una alerta** sobre un precio, si esa necesidad ya está presente desde este momento — enlaza hacia un futuro `PRICE_ALERTS_EXPERIENCE.md` (§7), coherente con la necesidad ya identificada de Claudia en `PERSONAS.md` ("Recibir alertas").
- **Iniciar una nueva búsqueda**, volviendo a cualquiera de los disparadores de §4.2.

Ninguna de estas continuaciones se desarrolla en este documento — se enlazan como posibilidades legítimas de continuidad, no como pasos de un flujo que este documento define.

### 4.8 Neutralidad

Consecuencia directa del Principio de producto 3 ("ComparaFarma no favorece a ninguna farmacia", `docs/product/PRODUCT_PRINCIPLES.md`) y de `docs/design/brand/BRAND_FOUNDATIONS.md` §12, ya aplicada estructuralmente en `docs/design/system/GRID_SYSTEM.md` §4.8: la búsqueda es el primer punto del producto donde la Neutralidad puede comprometerse, porque es el primer punto donde se decide qué existe y qué no para la persona.

- **La búsqueda no puede favorecer una farmacia.** Que un resultado de una farmacia aparezca o no debe depender exclusivamente de si esa farmacia realmente tiene ese medicamento — nunca de un acuerdo comercial. Esta es la misma restricción ya aplicada a la estructura de resultados en `GRID_SYSTEM.md` §4.8, aplicada aquí un paso antes: a la existencia misma del resultado, no solo a su posición.
- **La búsqueda no puede favorecer una marca sobre otra.** Encontrar un medicamento de marca no puede ser, por diseño, más fácil o más confiable que encontrar su equivalente — una tensión ya documentada como real en el producto: `docs/product/decisions/DECISION_LOG.md` (entrada del 2026-07-31) registra que `isBioequivalent` "no tiene fuente de verdad regulatoria" de forma homogénea entre farmacias, y que un sprint completo quedó bloqueado hasta resolver esa fuente de datos, "por el Principio 7 del Libro Fundacional" — evidencia directa de que esta Neutralidad ya se ha defendido activamente en el desarrollo del producto, no es solo un principio declarado.
- **La búsqueda no puede favorecer un laboratorio.** Ningún criterio de qué tan "relevante" es un resultado puede depender del laboratorio que lo fabrica — la relevancia de un resultado depende únicamente de qué tan bien responde a lo que la persona escribió (§4.4), nunca de quién lo produce.

Estas son reglas de expectativa de experiencia, no reglas de interfaz: este documento no dice cómo debe verse un resultado de búsqueda — dice qué no puede depender de un interés comercial en el momento en que ese resultado se decide.

### 4.9 Accesibilidad

La experiencia de búsqueda debe mantenerse accesible durante todo su recorrido —desde el Objetivo del Usuario (§4.1) hasta la Continuidad (§4.7)—, sin que este documento defina ninguna métrica concreta: esas métricas siguen perteneciendo a cada Foundation ya gobernada en `docs/design-system/` (`docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7).

Esta responsabilidad es particularmente concreta para este producto: `docs/product/definition/PERSONAS.md` documenta explícitamente a Carmen, de 72 años y con un nivel tecnológico básico, cuyas necesidades declaradas son "letras grandes", "botones simples", "pocos pasos" e "información clara" — la misma persona cuyo objetivo (§4.1) es el más simple de todos ("solo quiero saber dónde comprar más barato"). Una experiencia de búsqueda que exige comprensión técnica, pasos adicionales o interpretación visual compleja no le sirve a Carmen tanto como no le sirve a Daniela, que abandona si demora más de un minuto — ambos extremos de necesidad (comprensión y velocidad) exigen la misma disciplina de accesibilidad, consistente con el Principio de producto 4 ("Simplicidad": *"cada pantalla debe resolver un problema específico"*, `PRODUCT_PRINCIPLES.md`).

---

## 5. Relaciones

`SEARCH_EXPERIENCE.md` depende directamente de `docs/product/PRODUCT_DEFINITION_v1.0.md` (propuesta de valor y problema que resuelve el producto), `PRODUCT_PRINCIPLES.md` (Rapidez, Simplicidad, Neutralidad, base de §4.1, §4.4 y §4.8) y `PERSONAS.md` (fuente directa de §4.1, §4.2 y §4.9). Consume, sin redefinirla, la arquitectura ya gobernada en `docs/design/brand/BRAND_FOUNDATIONS.md` (§7, §12, §14) y en `docs/design-system/` (`GRID_SYSTEM.md` §4.3 y §4.8, `PATTERNS.md` —familia "Descubrimiento"— y `SCREEN_TEMPLATES.md` —familia "Exploración"—), que ya anticiparon la búsqueda como región funcional y como familia de Patrones y Plantillas, sin describir la experiencia que este documento desarrolla.

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos describe el objetivo real de la persona, sus disparadores, ni sus expectativas de procesamiento y resultado. Este documento tampoco resuelve, por su cuenta, ninguna decisión de arquitectura de interfaz, ningún flujo de comparación, detalle o alertas, ni el registro de su propia apertura de fase en `docs/product/decisions/DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Propuesta de valor ("en pocos segundos, el mejor precio") | `docs/product/PRODUCT_DEFINITION_v1.0.md` §7 | ✔ — fundamenta §2 y §4.1 | — |
| Problema que resuelve (asimetría de información) | `docs/product/PRODUCT_DEFINITION_v1.0.md` §5 | ✔ — fundamenta §4.1 | — |
| KPIs "Búsquedas realizadas" vs. "Comparaciones efectuadas" | `docs/product/PRODUCT_DEFINITION_v1.0.md` §13 | ✔ — fundamenta la frontera de §4.5 y §3 | Evidencia de que búsqueda y comparación ya son eventos distintos a nivel de producto |
| Principios de producto (Rapidez, Simplicidad, Neutralidad) | `docs/product/PRODUCT_PRINCIPLES.md` | ✔ — consolidados en §4.1, §4.4, §4.8, §4.9 | Ningún principio nuevo agregado |
| Necesidades reales de personas (Carmen, Rodrigo, Daniela, Claudia) | `docs/product/definition/PERSONAS.md` | ✔ — fundamentan §4.1, §4.2 y §4.9 | — |
| Búsqueda como entrada al mecanismo de decisión | `docs/design/system/GRID_SYSTEM.md` §4.3; `docs/design/brand/BRAND_FOUNDATIONS.md` §7 | ✔ — fundamenta §2 | — |
| Neutralidad estructural ya aplicada a la búsqueda/resultados | `docs/design/system/GRID_SYSTEM.md` §4.8 | ✔ — extendida al momento de búsqueda en §4.8 | — |
| Riesgo real de neutralidad ya documentado (`isBioequivalent`) | `docs/product/decisions/DECISION_LOG.md` (2026-07-31) | ✔ — evidencia concreta citada en §4.8 | No es una decisión nueva; se cita como hecho ya registrado |
| Familia de Patrones "Descubrimiento" | `docs/design/system/PATTERNS.md` §4.4 | Referenciada, no duplicada (§5) | — |
| Familia de Screen Templates "Exploración" | `docs/design/system/SCREEN_TEMPLATES.md` §4.4 | Referenciada, no duplicada (§5) | — |
| Flujo técnico de una búsqueda | `CLAUDE.md` (raíz del repositorio) | ✔ — traducido a expectativa de experiencia en §4.4, sin describir el mecanismo (§4.4, §4.6) | No se nombra tecnología |
| Funcionalidades ya implementadas (historial, estado de carga, estado vacío) | `CLAUDE.md`, sección "Funcionalidades Implementadas" | ✔ — fundamentan §4.3 y §4.6 | Referencia funcional, no técnica |
| Accesibilidad por herencia arquitectónica | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.4; `SPACING_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.7 | Referenciada, no duplicada (§4.9) | Ninguna métrica nueva definida |
| Registro de la apertura de la PHASE 2 — Product Experience | `docs/product/decisions/DECISION_LOG.md` | Pendiente — no existe todavía una entrada propia | Ver nota de pendiente en §7 |
| Comparación, detalle y alertas de precio como experiencias propias | — (no existen todavía como documentos) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` |
| `USER_JOURNEYS.md` (futuro gobierno de Flujos completos) | — (no existe todavía) | No consolidado — anticipado, no creado (§7) | Concepto de "Flujo" ya referenciado sin gobernar en `docs/design/system/COMPONENT_LIBRARY.md` §4.5 y `PATTERNS.md` §4.5 |

---

## 7. Gobierno

`SEARCH_EXPERIENCE.md` **no reemplaza**:

- `docs/product/PRODUCT_DEFINITION_v1.0.md` y `PRODUCT_PRINCIPLES.md` — siguen siendo la única fuente de la definición de producto y sus principios; este documento los aplica a un momento específico de la experiencia, sin redefinirlos.
- `docs/product/definition/PERSONAS.md` — sigue siendo la única fuente de las necesidades y objetivos de las personas que usan el producto.
- `docs/design/brand/BRAND_FOUNDATIONS.md` y el resto de `docs/brand/` — siguen siendo la única fuente de identidad de marca.
- `docs/design/system/DESIGN_SYSTEM.md`, `GRID_SYSTEM.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md` y el resto del dominio `docs/design-system/` — siguen siendo la única fuente de arquitectura de producto (Foundations, Tokens, Componentes, Patrones, Screen Templates); este documento no define ninguna pantalla, patrón o componente, solo la experiencia que deberán servir.
- Ningún futuro `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md` o `PRICE_ALERTS_EXPERIENCE.md` — cuando existan, serán la única fuente de sus respectivas experiencias; este documento solo las enlaza como continuidad (§4.7), sin desarrollarlas.
- Un futuro `USER_JOURNEYS.md` — cuando exista, será la única fuente de gobierno de los Flujos completos (secuencias de experiencias, incluida esta) que resuelven un objetivo de extremo a extremo de la persona; este documento no se atribuye esa responsabilidad, solo constituye el primer eslabón de cualquier Flujo que comience con una búsqueda.

La responsabilidad específica de `SEARCH_EXPERIENCE.md` es gobernar exclusivamente **la experiencia de búsqueda**: el objetivo real de la persona, sus disparadores, la información que aporta, sus expectativas de procesamiento y resultado, los estados conceptuales de esa experiencia, su continuidad hacia otras experiencias, y los principios de Neutralidad y Accesibilidad que debe respetar. No gobierna, y no debe absorber en ninguna revisión futura, ninguna pantalla, componente, patrón, algoritmo o tecnología — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la interfaz del producto.

**Cómo evoluciona este documento:** cualquier cambio en el objetivo del usuario, los disparadores, los estados o los principios aquí declarados debe evaluarse contra la evidencia ya citada de `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md` (§6) antes de aprobarse, y debe registrarse en `docs/product/decisions/DECISION_LOG.md` como una decisión de producto, siguiendo el mecanismo de registro ya existente en ese dominio.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Además: la apertura misma de la PHASE 2 — Product Experience, y la creación de este documento como su primer entregable, constituyen una decisión de producto en el sentido del mecanismo de registro ya existente en `docs/product/decisions/DECISION_LOG.md`. Esa decisión todavía no cuenta con una entrada propia en ese registro. Este documento no se autorregistra — señala aquí, de forma explícita, que esa incorporación requiere aprobación y registro posterior, siguiendo la misma disciplina de gobierno ya aplicada durante toda la Fase 1 en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`.

---

## 8. Documentos relacionados

- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/definition/PERSONAS.md`
- `docs/product/decisions/DECISION_LOG.md`
- `docs/product/README.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/GRID_SYSTEM.md`
- `docs/design/system/PATTERNS.md`
- `docs/design/system/SCREEN_TEMPLATES.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Draft | Pendiente (CEO/fundador) | Creación inicial, como documento inaugural de la PHASE 2 — Product Experience. Define la experiencia oficial de búsqueda de ComparaFarma: objetivo real de la persona derivado de `PERSONAS.md` y `PRODUCT_DEFINITION_v1.0.md`, disparadores conceptuales, información de entrada sin controles de interfaz, procesamiento y resultado esperados sin algoritmos ni pantalla de resultados, cinco estados conceptuales de la experiencia, continuidad enlazada (no desarrollada) hacia comparación/detalle/alertas, Neutralidad aplicada a la búsqueda con evidencia real ya documentada (`isBioequivalent`), y accesibilidad heredada sin métricas. No crea pantallas, componentes, patrones, algoritmos ni menciona tecnología. Señala, sin resolverlo por su cuenta, que la apertura de la PHASE 2 y la creación de este documento requieren aprobación y registro posterior en `docs/product/decisions/DECISION_LOG.md`. | `docs/product/PRODUCT_DEFINITION_v1.0.md` v1.0; `PRODUCT_PRINCIPLES.md`; `PERSONAS.md`; `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/design/system/DESIGN_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `PATTERNS.md` v1.1; `SCREEN_TEMPLATES.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Apertura de la PHASE 2 — Product Experience y definición de la experiencia oficial de búsqueda de ComparaFarma, primer documento del dominio `docs/product/` que gobierna experiencia de producto | Product Manager / UX Architect / Enterprise Documentation Architect | `docs/product/SEARCH_EXPERIENCE.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Queda pendiente: el registro en `docs/product/decisions/DECISION_LOG.md` de la apertura de la PHASE 2 y de la creación de este documento (señalado en §7), la creación de `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`, y toda implementación concreta de interfaz que traduzca esta experiencia a un producto real.
