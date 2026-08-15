# MEDICATION_DETAIL_EXPERIENCE — Especificación Oficial de la Experiencia de Detalle de un Medicamento de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, layouts ni componentes. No describe tecnología. No explica algoritmos. **No entrega recomendaciones médicas ni criterios regulatorios. No sustituye información clínica oficial ni al profesional de salud.** Es la **especificación oficial de la experiencia de detalle de un medicamento**: cómo una persona comprende toda la información disponible sobre un medicamento específico para reducir incertidumbre y tomar una decisión informada. Debe seguir siendo válido aunque cambie por completo la interfaz del producto, porque no gobierna esa interfaz — gobierna la experiencia de comprensión que cualquier interfaz futura deberá servir.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

Este documento pertenece al dominio `docs/product/` y continúa la PHASE 2 — Product Experience, abierta por `docs/product/SEARCH_EXPERIENCE.md` y continuada por `RESULTS_EXPERIENCE.md`. Consume la arquitectura ya gobernada por `docs/brand/`, `docs/design-system/`, `SEARCH_EXPERIENCE.md` y `RESULTS_EXPERIENCE.md` sin redefinirla en ningún punto.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PROD-EXP-003 |
| **Nombre** | MEDICATION_DETAIL_EXPERIENCE.md |
| **Dominio** | Product (`docs/product/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / Product Manager |
| **Rol asumido en su redacción** | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/product/SEARCH_EXPERIENCE.md` y `RESULTS_EXPERIENCE.md` (que entregan el punto de partida de esta experiencia y anticipan explícitamente que la comparabilidad clínica se desarrolla aquí), de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md`, y consume, sin redefinirla, la arquitectura ya gobernada por `docs/brand/` y `docs/design-system/` |
| **Clasificación** | Documento de Product Experience |
| **Fuente Oficial** | Este documento es la fuente oficial de **qué representa, para la persona, el momento de comprender el detalle de un medicamento específico**: qué información necesita, qué puede y qué no puede afirmar ComparaFarma sobre equivalencia, sus estados conceptuales, su continuidad, y los principios de Neutralidad, Transparencia, Confianza y Reducción de Incertidumbre que debe respetar. No es fuente de ninguna pantalla, wireframe, layout, componente o algoritmo (no creados), de ninguna recomendación médica o criterio regulatorio (explícitamente prohibidos, §3), ni de la experiencia de búsqueda, resultados, alertas o compra (fuera de alcance, §3) |
| **Documentos de los que depende** | `docs/product/SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md`, `DECISION_LOG.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/design-system/GRID_SYSTEM.md`, `SCREEN_TEMPLATES.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería condicionar, como tercer eslabón de la experiencia completa del producto, a los futuros `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md` |
| **Pregunta que responde** | ¿Cómo debe ser la experiencia de detalle de un medicamento para reducir incertidumbre y ayudar a comprender correctamente la información disponible, sin reemplazar el criterio médico ni inducir decisiones? |

---

## 2. Propósito

`docs/product/RESULTS_EXPERIENCE.md` §4.7 anticipó, sin desarrollarlo, que profundizar en un medicamento específico de los resultados comprendidos enlaza hacia esta experiencia — y ese mismo documento, en su §4.4, se detuvo deliberadamente antes de resolver la comparabilidad clínica (bioequivalencia), señalando que "esa distinción es más profunda que un principio de experiencia y corresponde a un futuro `MEDICATION_DETAIL_EXPERIENCE.md`." Este documento es esa continuación: el momento en que ComparaFarma deja de mostrar una alternativa entre varias y pasa a mostrar todo lo que puede afirmar, con responsabilidad, sobre una unidad específica de necesidad.

Dentro de la experiencia completa del producto, el detalle de un medicamento cumple un rol distinto al de la búsqueda (encontrar) y al de los resultados (comparar): es el momento de **comprender en profundidad**, reduciendo la incertidumbre que todavía pueda existir después de haber comparado alternativas. Este documento refuerza los tres principios ya centrales en `RESULTS_EXPERIENCE.md` —Neutralidad (§4.8), Transparencia (§4.9) y, aquí desarrollado por primera vez con nombre propio, Confianza (§4.10)— y añade un cuarto principio, implícito en todos los anteriores pero nunca antes nombrado explícitamente en esta arquitectura: **la Reducción de Incertidumbre** es la razón de ser de esta experiencia, de la misma forma en que la Neutralidad, la Transparencia y la Confianza son las condiciones bajo las cuales esa reducción de incertidumbre puede ocurrir sin convertirse en persuasión.

---

## 3. Alcance

**Este documento define:**

- Qué preguntas intenta responder una persona cuando abre el detalle de un medicamento, desde su perspectiva y no desde el negocio (§4.1).
- Qué representa conceptualmente un medicamento dentro de ComparaFarma, sin hablar de modelos de datos ni de UI (§4.2).
- Qué información necesita la persona para comprender un medicamento, y por qué esa información reduce incertidumbre (§4.3).
- Qué significa comparar medicamentos, qué significa equivalencia, qué puede y qué no puede afirmar ComparaFarma, y qué ocurre cuando no existe evidencia suficiente (§4.4).
- Cómo el detalle ayuda a comprender sin persuadir, recomendar ni sustituir criterio médico (§4.5).
- Los estados conceptuales de esta experiencia, sin describir pantallas (§4.6).
- Qué puede hacer la persona después de comprender el detalle, enlazando únicamente hacia alertas de precio y Flujos completos (§4.7).
- Cómo el detalle nunca favorece marcas, laboratorios, genéricos, bioequivalentes o farmacias (§4.8).
- Qué información debe ser verificable, qué incertidumbres deben mostrarse y qué limitaciones del producto deben reconocerse (§4.9).
- Cómo esta experiencia construye confianza sin sobreprometer (§4.10).
- Cómo hereda accesibilidad desde la arquitectura ya existente, sin métricas nuevas (§4.11).

**Este documento NO define:**

- Ninguna pantalla, wireframe, layout o componente concreto. Pertenece íntegramente a `docs/design-system/`, que este documento no reinterpreta ni redefine.
- Ningún algoritmo de verificación, matching o cálculo. Este documento describe la expectativa de comprensión de la persona, no el mecanismo técnico que la satisface.
- Ninguna tecnología de implementación.
- **Ninguna recomendación médica.** Este documento no sugiere, directa ni indirectamente, qué medicamento tomar, cuál preferir clínicamente, ni cómo tratar una condición de salud.
- **Ningún criterio regulatorio propio.** Este documento no interpreta legislación sanitaria ni establece qué constituye bioequivalencia desde un punto de vista científico o legal — reconoce únicamente lo que la documentación existente del producto ya declara sobre su propia capacidad de verificación (§4.4).
- **La sustitución del profesional de salud.** Consistente con `docs/brand/BRAND_FOUNDATIONS.md` §12: *"No emitimos recomendaciones médicas ni diagnósticos. No reemplazamos la atención de profesionales de la salud."*
- **La experiencia de búsqueda ni la de resultados.** Corresponden íntegramente a `docs/product/SEARCH_EXPERIENCE.md` y `RESULTS_EXPERIENCE.md`, ya gobernadas; este documento parte de su punto de continuidad sin reabrirlas.
- **La experiencia de alertas de precio.** Corresponde íntegramente a un futuro `PRICE_ALERTS_EXPERIENCE.md`; este documento solo la referencia como continuidad posible (§4.7).
- **La experiencia de compra.** `docs/product/PRODUCT_DEFINITION_v1.0.md` §10 ya excluye explícitamente la compra de medicamentos, la sustitución terapéutica, la telemedicina y las recetas electrónicas del alcance de la versión 1.0 del producto; este documento no las reabre.

---

## 4. Contenido principal

### 4.1 Objetivo del Usuario

Cuando una persona abre el detalle de un medicamento específico, ya dejó atrás la pregunta de la búsqueda ("¿existe esto?") y la de los resultados ("¿cuáles son mis alternativas?"). Las preguntas que intenta responder ahora son más profundas: **¿es exactamente esto lo que necesito? ¿Puedo confiar en esta información? ¿Qué me falta saber antes de decidir?**

Estas preguntas no son iguales para todas las personas que usan ComparaFarma (`docs/product/PERSONAS.md`): Claudia, que compra los mismos medicamentos de forma permanente, necesita confirmar que lo que ve en el detalle sigue siendo lo mismo que ya conoce, sin sorpresas; Rodrigo, que evalúa toda una receta, necesita que el detalle de cada medicamento sea suficientemente completo para no tener que buscar esa información en otro lugar; Carmen necesita que esa profundidad no se traduzca en complejidad — información clara, no más pasos. En todos los casos, el objetivo real es reducir la incertidumbre que todavía queda después de comparar (`docs/product/RESULTS_EXPERIENCE.md` §4.1), nunca sentir presión para elegir un medicamento sobre otro — consistente con `docs/brand/BRAND_FOUNDATIONS.md` §15: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir."*

### 4.2 ¿Qué representa un medicamento dentro de ComparaFarma?

Sin hablar de modelos de datos ni de interfaz: un medicamento, en el sentido de esta experiencia, es la unidad más profunda de comprensión que ComparaFarma puede ofrecer sobre una necesidad específica — ya no una lista de alternativas equivalentes entre sí (`docs/product/RESULTS_EXPERIENCE.md` §4.2), sino todo lo que el producto puede afirmar, con responsabilidad, sobre una de esas alternativas en particular. `docs/design-system/GRID_SYSTEM.md` §4.3 ya lo señaló como una transición estructural necesaria: *"la transición de 'una lista de opciones equivalentes' a 'una unidad de información profunda' debe ser reconocible... no solo por el contenido que aparece."* Este documento no resuelve esa transición estructural —pertenece a `GRID_SYSTEM.md`—, pero sí define qué ocurre, a nivel de comprensión, dentro de esa unidad profunda: la persona ya no compara varias alternativas entre sí; profundiza en una.

Un medicamento, en esta experiencia, nunca se presenta de forma aislada de la necesidad que lo originó (la búsqueda) ni del contexto comparativo del que proviene (los resultados) — es la continuación de la misma unidad de necesidad, nunca una entidad nueva y desconectada de lo que la persona ya comprendió.

### 4.3 Información necesaria para comprender un medicamento

Cada elemento de información que un medicamento debe entregar existe porque reduce un tipo específico de incertidumbre — no porque sea un campo técnico disponible en el sistema. Sin describir campos técnicos ni controles visuales:

- **Identidad:** reduce la incertidumbre de si esto es realmente lo que la persona necesita — la misma pregunta ya planteada en `RESULTS_EXPERIENCE.md` §4.3 ("¿es esto lo que busqué?"), pero llevada aquí a su nivel más profundo y verificable.
- **Presentación:** reduce la incertidumbre sobre si el medicamento es utilizable de la forma en que la persona lo espera — confundir una forma con otra no es un detalle menor cuando se trata de un tratamiento real.
- **Concentración:** reduce la incertidumbre sobre si esto corresponde exactamente a lo que se necesita, especialmente relevante para quienes, como Rodrigo, comparan una receta completa donde cada dosis importa.
- **Laboratorio:** reduce la incertidumbre para quienes, como Claudia, tienen una relación de continuidad con un medicamento específico y necesitan reconocerlo con certeza, no solo por su nombre genérico.
- **Disponibilidad:** reduce la incertidumbre sobre si la alternativa es realmente comprable en este momento — el mismo principio ya establecido en `RESULTS_EXPERIENCE.md` §4.3, con la misma exigencia surgida de un error real ya corregido en el producto (`docs/product/DECISION_LOG.md`, 2026-07-31, disponibilidad incorrecta en AraucoMed).
- **Mecanismos de precio:** reduce la incertidumbre sobre cuánto costaría realmente esa alternativa y a través de qué vía, con la misma disciplina de origen del precio ya exigida en `RESULTS_EXPERIENCE.md` §4.3 y §4.4.
- **Ahorro:** reduce la incertidumbre sobre si comparar valió la pena, consistente con la propuesta de valor del producto (`docs/product/PRODUCT_DEFINITION_v1.0.md` §7).
- **Fecha de actualización:** reduce la incertidumbre sobre cuánto confiar en toda la información anterior — sin esta referencia, ninguna de las demás puede evaluarse con criterio.

Ninguno de estos elementos, por sí solo, resuelve la incertidumbre de la persona; en conjunto, son la base de la que depende una decisión informada. Cuando alguno falta o no puede verificarse, corresponde a los estados conceptuales de §4.6, no a una omisión silenciosa.

### 4.4 Equivalencia y Comparabilidad

Este es el capítulo central de este documento, y el más delicado. Se desarrolla tomando como referencia exclusiva lo que ya está documentado en `docs/product/DECISION_LOG.md`, `PRODUCT_PRINCIPLES.md`, `SEARCH_EXPERIENCE.md` y `RESULTS_EXPERIENCE.md` — sin inventar afirmaciones regulatorias y sin asumir equivalencias que el producto no puede sostener hoy con evidencia.

**¿Qué significa comparar medicamentos?** Dentro de esta experiencia, comparar significa contrastar información objetiva y verificable sobre una misma necesidad —identidad, presentación, concentración, precio, disponibilidad— nunca afirmar que dos medicamentos son clínicamente intercambiables entre sí. `docs/product/RESULTS_EXPERIENCE.md` §4.4 ya estableció el principio general de comparabilidad para resultados equivalentes entre farmacias; este documento no lo repite, lo extiende explícitamente a la pregunta más sensible que puede surgir en el detalle: si dos presentaciones distintas de un mismo principio activo (por ejemplo, una de marca y una genérica) son equivalentes entre sí.

**¿Qué significa equivalencia?** Es necesario distinguir dos tipos de equivalencia que esta experiencia no debe confundir nunca:

- **Equivalencia informativa** — que dos alternativas correspondan al mismo principio activo, la misma dosis y la misma cantidad. Esta es la equivalencia que ComparaFarma ya verifica de forma sistemática mediante su disciplina de deduplicación (`CLAUDE.md`, raíz del repositorio, y `docs/product/RESULTS_EXPERIENCE.md` §4.4), y sobre la que puede afirmar con la misma confianza que ya sostiene toda la experiencia de resultados.
- **Equivalencia terapéutica o regulatoria (bioequivalencia)** — que dos alternativas puedan sustituirse clínicamente entre sí sin diferencia relevante de efecto. Esta es una afirmación de naturaleza distinta, que requiere una fuente de verificación regulatoria independiente del propio producto, no una inferencia derivada de que ambas comparten principio activo y dosis.

**¿Qué información puede afirmar ComparaFarma?** Puede afirmar, con la confianza que ya sostiene el resto del producto, la identidad del principio activo, la dosis, la cantidad, el laboratorio declarado por la fuente, la farmacia, el precio, la disponibilidad y la antigüedad del dato (§4.3) — toda esta información ya forma parte del contrato de datos verificado del producto, y su exactitud ya se defiende activamente cuando falla (`docs/product/DECISION_LOG.md`, correcciones reales del 2026-07-23 y 2026-07-31).

**¿Qué información NO puede afirmar?** ComparaFarma **no puede afirmar, como un hecho regulatoriamente verificado y homogéneo, la bioequivalencia entre alternativas.** `docs/product/DECISION_LOG.md` (2026-07-31) ya documenta, sin ambigüedad, que esta limitación es real y actual: no existe todavía una fuente de verdad regulatoria homogénea entre las nueve farmacias que integra el producto; el dato de bioequivalencia que algunas de esas farmacias entregan está, en al menos dos casos, fijado de antemano en `false` sin verificación; y aunque se identificó una fuente pública oficial (el registro del Instituto de Salud Pública) que permitiría una verificación real, esa verificación solo es viable hoy, sin ambigüedad, para dos de las nueve farmacias — para el resto, requeriría trabajo adicional todavía no realizado, o no es posible con las fuentes verificadas hasta ahora. En consecuencia, esta experiencia tampoco puede recomendar un medicamento sobre otro, ni sugerir que una alternativa —de marca, genérica, o de un laboratorio específico— es preferible desde un punto de vista clínico.

**¿Qué ocurre cuando no existe evidencia suficiente?** Corresponde al estado conceptual "equivalencia no determinada" (§4.6): esta experiencia debe mostrar esa ausencia de verificación de forma explícita, nunca resolverla por defecto hacia una equivalencia asumida ni hacia una falta de equivalencia asumida. Cualquiera de esos dos defaults sería una afirmación que el producto no puede sostener con evidencia, y por lo tanto una violación directa de la Transparencia (§4.9) y de la Neutralidad (§4.8) de esta experiencia.

### 4.5 Comprensión

El detalle ayuda a comprender mostrando, de la forma más clara posible, todo lo que ya se estableció en §4.3 y §4.4 — nunca persuadiendo, nunca recomendando, y nunca sustituyendo el criterio de un profesional de salud. Comprender, en el sentido de esta experiencia, significa que la persona entienda con precisión qué es el medicamento que está viendo y qué representa económicamente frente a las alternativas ya comparadas (`RESULTS_EXPERIENCE.md`) — no que se sienta inclinada a preferirlo. La misma distinción ya declarada en `docs/brand/BRAND_FOUNDATIONS.md` §15 aplica aquí con mayor exigencia que en cualquier experiencia anterior: ayudar a comprender es legítimo; empujar hacia una elección, incluso de forma sutil, no lo es — y en el contexto de un medicamento específico, esa frontera es más sensible que en cualquier otro momento del producto.

### 4.6 Estados conceptuales

Estados conceptuales, sin pantallas:

- **Información completa.** Todos los elementos de §4.3 están confirmados y vigentes para este medicamento.
- **Información parcial.** Algunos elementos de §4.3 existen y otros no pudieron verificarse a tiempo — la misma lógica ya establecida para resultados parciales en `RESULTS_EXPERIENCE.md` §4.6, aplicada aquí a un solo medicamento en profundidad.
- **Información pendiente de verificación.** Un dato existe, pero su vigencia o exactitud todavía no puede confirmarse con la confianza necesaria — distinto de no tener el dato: aquí el dato existe, pero su fiabilidad está en evaluación. Esta distinción no es hipotética: los errores reales ya identificados y corregidos en el producto (`docs/product/DECISION_LOG.md`, 2026-07-23 y 2026-07-31) son evidencia directa de por qué esta experiencia necesita poder comunicar "esto todavía no está verificado con certeza", en vez de presentar todo dato como si tuviera el mismo nivel de confianza.
- **Información no disponible.** El medicamento no tiene, para alguno de los elementos de §4.3, ningún dato confiable que mostrar — distinto de "no existe": si la persona llegó a este detalle, es porque su existencia ya fue confirmada en la experiencia de resultados (`RESULTS_EXPERIENCE.md` §4.6); este estado se refiere a la ausencia de un atributo específico, no del medicamento completo.
- **Equivalencia no determinada.** El estado más importante de esta experiencia, desarrollado en profundidad en §4.4: no existe, para este medicamento, una verificación regulatoria homogénea de bioequivalencia. Este estado debe mostrarse siempre que corresponda, con la misma prioridad que cualquier otra información — nunca como una nota secundaria ni omitida por defecto.

### 4.7 Continuidad

Una vez que la persona comprendió el detalle, sin desarrollar estos flujos, enlaza únicamente hacia:

- **Configurar una alerta de precio** sobre el medicamento ya comprendido en profundidad — enlaza hacia un futuro `PRICE_ALERTS_EXPERIENCE.md` (§7).
- **Continuar dentro de un objetivo más amplio de la persona** —por ejemplo, seguir evaluando el resto de una receta completa, como Rodrigo— enlaza hacia un futuro `USER_JOURNEYS.md` (§7), que gobernará cómo esta experiencia se combina con las demás dentro de un Flujo completo.

Consistente con el alcance de este documento (§3), esta experiencia no enlaza hacia ninguna forma de compra, sustitución o acción clínica — ninguna de esas continuidades existe todavía dentro del alcance del producto (`docs/product/PRODUCT_DEFINITION_v1.0.md` §10).

### 4.8 Neutralidad

Duodécima aplicación transversal del mismo principio ya desarrollado en Grid, Spacing, Color, Elevation, el catálogo de Tokens, la Component Library, la capa de Patrones, la capa de Screen Templates, la experiencia de búsqueda (`docs/product/SEARCH_EXPERIENCE.md` §4.8) y la experiencia de resultados (`docs/product/RESULTS_EXPERIENCE.md` §4.8): el detalle **describe. Nunca recomienda.**

- **Marcas y laboratorios:** ningún medicamento puede presentarse como preferible por su marca o por el laboratorio que lo fabrica — consecuencia directa de `docs/brand/BRAND_FOUNDATIONS.md` §12 y del compromiso de no alterar una recomendación por beneficio económico propio (§18 de ese mismo documento).
- **Genéricos y bioequivalentes:** ninguna categoría —de marca, genérica o bioequivalente— puede presentarse como inherentemente superior a otra. Esta regla no es solo una extensión del principio general de Neutralidad: es una consecuencia directa de la limitación epistémica ya reconocida en §4.4. Precisamente porque ComparaFarma no puede afirmar hoy, con evidencia regulatoria homogénea, que una alternativa es bioequivalente a otra, sugerir una preferencia entre categorías no sería solo una falta de Neutralidad — sería una afirmación que el producto no tiene cómo sostener.
- **Farmacias:** ningún medicamento puede presentarse de forma distinta según la farmacia que lo ofrece, más allá de la información objetiva ya establecida en §4.3 — mismo principio ya exigido en `RESULTS_EXPERIENCE.md` §4.8.

El detalle de un medicamento describe lo que ComparaFarma puede afirmar (§4.4) con la misma neutralidad exigida en toda la arquitectura previa. Nunca recomienda, nunca sugiere una preferencia clínica, y nunca resuelve por su cuenta una incertidumbre que la evidencia disponible no permite resolver.

### 4.9 Transparencia

**Qué información debe ser verificable:** toda afirmación sobre identidad, presentación, concentración, laboratorio, disponibilidad, precio y antigüedad del dato (§4.3) debe poder rastrearse a una fuente real, consistente con el Principio de producto 6: *"Siempre mostraremos el origen de la información cuando corresponda"* (`docs/product/PRODUCT_PRINCIPLES.md`).

**Qué incertidumbres deben mostrarse:** cualquier información pendiente de verificación (§4.6) y, de forma especialmente prioritaria, cualquier equivalencia no determinada (§4.4, §4.6) deben mostrarse de forma explícita, nunca quedar implícitas ni suavizadas dentro de una presentación que sugiera mayor certeza de la que existe.

**Qué limitaciones del producto deben reconocerse:** esta experiencia debe poder reconocer, dentro de sí misma, que ComparaFarma no tiene hoy una fuente de verificación regulatoria homogénea de bioequivalencia entre sus nueve farmacias (§4.4) — no como una admisión incómoda que se oculta, sino como información tan legítima de mostrar como cualquier precio o disponibilidad. Nunca ocultar la ausencia de información es, en este documento, más que un principio de diseño: es la misma disciplina ya aplicada en la práctica real del producto cuando se identificaron y corrigieron errores de datos (`docs/product/DECISION_LOG.md`, 2026-07-23 y 2026-07-31) — la transparencia sobre una limitación no resuelta hoy es la continuación directa de esa misma disciplina.

### 4.10 Confianza

Nuevo capítulo, desarrollado por primera vez con nombre propio en esta arquitectura de experiencia, aunque ya estaba presente como Principio de producto 2 (`docs/product/PRODUCT_PRINCIPLES.md`: *"La información debe ser correcta y verificable"*).

**¿Cómo construye confianza esta experiencia?** Mostrando siempre el origen y el estado de verificación de cada afirmación (§4.9), y reconociendo activamente lo que todavía no puede verificar (§4.4) en vez de rellenar ese vacío con una suposición razonable. La confianza, en el sentido de este documento, no se construye pareciendo más completo de lo que realmente es — se construye siendo consistentemente honesto sobre los límites de lo que se sabe.

**¿Cómo evita sobreprometer?** Nunca afirmando una certeza que el producto no tiene evidencia para sostener. `docs/brand/BRAND_FOUNDATIONS.md` §10 ya lo declara como promesa oficial y extendida: *"No prometemos tener siempre la respuesta. Prometemos buscarla con honestidad. No prometemos no equivocarnos. Prometemos reconocer nuestros errores."* Aplicado a esta experiencia: no prometer una equivalencia que no está verificada, y reconocer explícitamente cuando una información todavía está pendiente de esa verificación (§4.6).

**¿Cómo comunica límites?** Reconociendo, dentro de la propia experiencia, que ComparaFarma no es una fuente de decisión clínica: no emite recomendaciones médicas ni diagnósticos, y no reemplaza la atención de un profesional de salud (`docs/brand/BRAND_FOUNDATIONS.md` §12). Esta no es una limitación incidental de este documento — es, según la propia identidad del producto, una elección deliberada y permanente: *"Preferimos reconocer una incertidumbre antes que ofrecer una falsa certeza"* (`docs/book/03-acto-nuestra-forma-de-trabajar/13-La-Salud-No-Admite-Atajos.md`, citado en `BRAND_FOUNDATIONS.md` §15). El detalle de un medicamento es, de toda la experiencia de producto, el lugar donde ese límite tiene la mayor responsabilidad de comunicarse con claridad.

### 4.11 Accesibilidad

Esta experiencia hereda accesibilidad de la misma arquitectura ya gobernada — `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7 — sin definir aquí ninguna métrica nueva.

La exigencia es, si cabe, mayor que en la experiencia de resultados (`RESULTS_EXPERIENCE.md` §4.10): comprender los límites de una afirmación —qué está verificado y qué no— exige más precisión de comunicación que comprender una comparación de precios. Carmen, con un nivel tecnológico básico y necesidad de información clara (`docs/product/PERSONAS.md`), debe poder comprender una limitación como "equivalencia no determinada" con la misma facilidad con la que comprende un precio — consistente con el Principio de producto 4: *"Cada pantalla debe resolver un problema específico"* (`PRODUCT_PRINCIPLES.md`) — aquí, el problema específico es comprender con precisión los límites de lo que se sabe, no solo lo que se sabe.

---

## 5. Relaciones

`MEDICATION_DETAIL_EXPERIENCE.md` depende directamente de `docs/product/RESULTS_EXPERIENCE.md`, cuya sección 4.7 (Continuidad) entrega el punto de partida de este documento y cuya sección 4.4 anticipó explícitamente que la comparabilidad clínica se desarrollaría aquí, y de `docs/product/SEARCH_EXPERIENCE.md`, origen de toda la cadena de experiencia. Depende de `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md` y `PERSONAS.md`, fuente directa de §4.1 y §4.11, y de `docs/product/DECISION_LOG.md`, cuya entrada del 2026-07-31 sobre la limitación real de datos de bioequivalencia es la fuente exclusiva y no negociable de todo el §4.4 — este documento no interpreta esa limitación más allá de lo que esa entrada ya documenta. Consume, sin redefinirla, la arquitectura ya gobernada en `docs/brand/BRAND_FOUNDATIONS.md` y en `docs/design-system/GRID_SYSTEM.md` y `SCREEN_TEMPLATES.md`, que ya anticiparon el detalle como región funcional y como familia de Screen Templates, sin describir la experiencia de comprensión que este documento desarrolla.

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos describe qué necesita comprender la persona al ver el detalle de un medicamento, ni qué puede y qué no puede afirmar ComparaFarma sobre equivalencia. Este documento tampoco resuelve, por su cuenta, ninguna decisión de arquitectura de interfaz, ninguna experiencia de alertas o de Flujo completo, ni el registro de su propia creación en `docs/product/DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Punto de partida de esta experiencia y anticipación de la comparabilidad clínica | `docs/product/RESULTS_EXPERIENCE.md` §4.4, §4.7 | ✔ — fundamenta §2 y §4.4 | Sin reabrir la experiencia de resultados |
| Transición estructural entre resultados y detalle | `docs/design-system/GRID_SYSTEM.md` §4.3 | ✔ — fundamenta §4.2 | — |
| Familia de Screen Templates "Detalle" | `docs/design-system/SCREEN_TEMPLATES.md` §4.4 | Referenciada, no duplicada (§5) | — |
| Propuesta de valor y exclusión de compra/sustitución terapéutica/telemedicina en v1.0 | `docs/product/PRODUCT_DEFINITION_v1.0.md` §7, §10 | ✔ — fundamenta §4.3 y la exclusión de §3, §4.7 | — |
| Principios de producto (Confianza, Neutralidad, Transparencia, Calidad) | `docs/product/PRODUCT_PRINCIPLES.md` | ✔ — consolidados en §4.9, §4.10 | Ningún principio nuevo agregado |
| Necesidades reales de personas (Carmen, Rodrigo, Claudia) | `docs/product/PERSONAS.md` | ✔ — fundamentan §4.1, §4.3, §4.11 | — |
| Limitación real de datos de bioequivalencia (ausencia de fuente regulatoria homogénea) | `docs/product/DECISION_LOG.md` (2026-07-31) | ✔ — fuente exclusiva de §4.4, §4.8, §4.9 | No es una decisión nueva; se cita como hecho ya registrado. Ninguna afirmación regulatoria propia agregada |
| Bugs reales de datos (precio fantasma EasyFarma, disponibilidad AraucoMed) | `docs/product/DECISION_LOG.md` (2026-07-23, 2026-07-31) | ✔ — evidencia concreta citada en §4.3, §4.6, §4.9 | No es una decisión nueva; se cita como hecho ya registrado |
| Disciplina de deduplicación (equivalencia informativa) | `CLAUDE.md` (raíz del repositorio); `docs/product/RESULTS_EXPERIENCE.md` §4.4 | ✔ — fundamenta la distinción de §4.4 | Referencia técnica, sin describir el mecanismo |
| "Ayuda a decidir, nunca empuja a decidir" | `docs/brand/BRAND_FOUNDATIONS.md` §15 | ✔ — fundamenta §4.1, §4.5 | — |
| "No emitimos recomendaciones médicas ni diagnósticos" | `docs/brand/BRAND_FOUNDATIONS.md` §12 | ✔ — fundamenta §3 y §4.10 | — |
| No privilegiar farmacias/marcas por conveniencia comercial | `docs/brand/BRAND_FOUNDATIONS.md` §12, §18 | ✔ — fundamenta §4.8 | — |
| Promesa oficial extendida ("buscamos la respuesta con honestidad, reconocemos errores") | `docs/brand/BRAND_FOUNDATIONS.md` §10 | ✔ — fundamenta §4.10 | — |
| "Preferimos reconocer una incertidumbre antes que ofrecer una falsa certeza" | `docs/brand/BRAND_FOUNDATIONS.md` §15 (cita de `docs/book/`) | ✔ — fundamenta §4.10 | — |
| Accesibilidad por herencia arquitectónica | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.4; `SPACING_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.7 | Referenciada, no duplicada (§4.11) | Ninguna métrica nueva definida |
| Registro de la creación de este documento | `docs/product/DECISION_LOG.md` | Pendiente — no existe todavía una entrada propia | Ver nota de pendiente en §7 |
| Alertas de precio y Flujos completos | — (no existen todavía como documentos) | No consolidado — declarado explícitamente fuera de alcance (§3), solo enlazado (§4.7) | Pendiente de `PRICE_ALERTS_EXPERIENCE.md`, `USER_JOURNEYS.md` |
| Resolución futura de la fuente de verdad regulatoria de bioequivalencia | — (no existe todavía, spike solo identificó una vía posible) | No consolidado — declarado explícitamente como limitación actual (§4.4) | Corresponde a trabajo de producto/datos futuro, no a este documento ni a este dominio |

---

## 7. Gobierno

`MEDICATION_DETAIL_EXPERIENCE.md` **no reemplaza**:

- `docs/product/SEARCH_EXPERIENCE.md` y `RESULTS_EXPERIENCE.md` — siguen siendo la única fuente de las experiencias de búsqueda y de resultados; este documento parte de su punto de continuidad sin reabrirlas.
- `docs/product/PRODUCT_DEFINITION_v1.0.md`, `PRODUCT_PRINCIPLES.md`, `PERSONAS.md` y `DECISION_LOG.md` — siguen siendo la única fuente de la definición de producto, sus principios, las necesidades de las personas que lo usan, y su historial real de decisiones y correcciones.
- `docs/brand/BRAND_FOUNDATIONS.md` y el resto de `docs/brand/` — siguen siendo la única fuente de identidad de marca, incluida la posición del producto frente a recomendaciones médicas y profesionales de salud.
- `docs/design-system/GRID_SYSTEM.md`, `SCREEN_TEMPLATES.md` y el resto del dominio `docs/design-system/` — siguen siendo la única fuente de arquitectura de producto; este documento no define ninguna pantalla, patrón o componente, solo la experiencia de comprensión que deberán servir.
- Un futuro `PRICE_ALERTS_EXPERIENCE.md` — cuando exista, será la única fuente de esa experiencia; este documento solo la enlaza como continuidad (§4.7).
- Un futuro `USER_JOURNEYS.md` — cuando exista, será la única fuente de gobierno de los Flujos completos que combinan esta experiencia con otras; este documento no se atribuye esa responsabilidad.
- **Ninguna fuente médica, clínica o regulatoria oficial** — este documento no es, ni pretende ser, una fuente de información sanitaria; describe únicamente la experiencia de producto, y reconoce explícitamente (§4.4) los límites de lo que el producto puede afirmar por sí mismo.

La responsabilidad específica de `MEDICATION_DETAIL_EXPERIENCE.md` es gobernar exclusivamente **la experiencia de comprensión del detalle de un medicamento**: qué necesita comprender la persona, qué información requiere, qué puede y qué no puede afirmarse sobre equivalencia, sus estados conceptuales, su continuidad, y los principios de Neutralidad, Transparencia, Confianza y Reducción de Incertidumbre que debe respetar. No gobierna, y no debe absorber en ninguna revisión futura, ninguna pantalla, componente, algoritmo o tecnología, ninguna recomendación médica o criterio regulatorio, ni la experiencia de búsqueda, resultados, alertas o compra — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la interfaz del producto.

**Cómo evoluciona este documento:** cualquier cambio en qué puede afirmarse sobre equivalencia (§4.4) debe evaluarse exclusivamente contra evidencia ya registrada en `docs/product/DECISION_LOG.md` —nunca contra una interpretación nueva de regulación sanitaria hecha por este documento— y debe registrarse, a su vez, en ese mismo registro como una decisión de producto, siguiendo el mecanismo ya existente en ese dominio.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/`, `docs/design-system/` y la PHASE 2 — Product Experience.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Además: la creación de este documento, como tercer entregable de la PHASE 2 — Product Experience, constituye una decisión de producto en el sentido del mecanismo de registro ya existente en `docs/product/DECISION_LOG.md`. Esa decisión todavía no cuenta con una entrada propia en ese registro. Este documento no se autorregistra — señala aquí, de forma explícita, que esa incorporación requiere aprobación y registro posterior, siguiendo la misma disciplina de gobierno ya aplicada durante toda la Fase 1 y en `SEARCH_EXPERIENCE.md`/`RESULTS_EXPERIENCE.md`.

---

## 8. Documentos relacionados

- `docs/product/SEARCH_EXPERIENCE.md`
- `docs/product/RESULTS_EXPERIENCE.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/PERSONAS.md`
- `docs/product/DECISION_LOG.md`
- `docs/product/README.md`
- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/SCREEN_TEMPLATES.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Draft | Pendiente (CEO/fundador) | Creación inicial, como tercer documento de la PHASE 2 — Product Experience. Define la experiencia oficial de comprensión del detalle de un medicamento: objetivo real de la persona derivado de `PERSONAS.md`; qué representa un medicamento y su información mínima fundamentada explícitamente en la reducción de incertidumbre; capítulo central de Equivalencia y Comparabilidad, que distingue equivalencia informativa (ya verificada por el producto) de equivalencia terapéutica/bioequivalencia (sin fuente regulatoria homogénea hoy, según evidencia exclusiva de `DECISION_LOG.md`), sin inventar afirmaciones regulatorias ni asumir equivalencias; cinco estados conceptuales, incluido "equivalencia no determinada"; continuidad enlazada únicamente hacia alertas de precio y Flujos completos; Neutralidad como duodécima aplicación transversal, extendida explícitamente a genéricos y bioequivalentes; Transparencia sobre las limitaciones reales del producto; nuevo capítulo de Confianza; y un cuarto principio, Reducción de Incertidumbre, nombrado explícitamente como razón de ser de esta experiencia. No crea pantallas, wireframes, componentes, layouts, algoritmos, recomendaciones médicas ni criterios regulatorios; no describe compra ni alertas. Señala, sin resolverlo por su cuenta, que su propia creación requiere aprobación y registro posterior en `docs/product/DECISION_LOG.md`. | `docs/product/SEARCH_EXPERIENCE.md` v1.0; `RESULTS_EXPERIENCE.md` v1.0; `PRODUCT_DEFINITION_v1.0.md` v1.0; `PRODUCT_PRINCIPLES.md`; `PERSONAS.md`; `docs/product/DECISION_LOG.md`; `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design-system/GRID_SYSTEM.md` v1.1; `SCREEN_TEMPLATES.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Apertura de la PHASE 2 — Product Experience y definición de la experiencia oficial de búsqueda | Product Manager / UX Architect / Enterprise Documentation Architect | `docs/product/SEARCH_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.2 — Results Experience: definición de la experiencia oficial de comprensión de resultados | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems | `docs/product/RESULTS_EXPERIENCE.md` v1.0 |
| 2026-08-06 | Sprint UX.3 — Medication Detail Experience: definición de la experiencia oficial de comprensión del detalle de un medicamento, tercer documento de la PHASE 2 — Product Experience | Chief Product Officer / UX Architect / Enterprise Documentation Architect / especialista en Decision Support Systems para productos de salud | `docs/product/MEDICATION_DETAIL_EXPERIENCE.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Queda pendiente: el registro en `docs/product/DECISION_LOG.md` de la creación de este documento (señalado en §7), la creación de `PRICE_ALERTS_EXPERIENCE.md` y `USER_JOURNEYS.md`, la eventual resolución de la fuente de verdad regulatoria de bioequivalencia (que corresponde a trabajo de producto/datos, no a este documento), y toda implementación concreta de interfaz que traduzca esta experiencia a un producto real.
