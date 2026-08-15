# ELEVATION_SYSTEM — Especificación Oficial del Sistema de Elevación de ComparaFarma

Este documento no define sombras, no define niveles de z-index, no establece valores de blur, no define píxeles ni componentes, y no sustituye una guía visual. Es la **especificación oficial del sistema de elevación**: la Elevación no representa profundidad física — representa **prioridad perceptual**. Su función es organizar la atención de la persona que usa el producto, no decorar la interfaz. Debe seguir siendo válido aunque el producto cambie completamente de tecnología o adopte cualquier sistema visual futuro, porque no gobierna esa implementación: gobierna qué debe percibirse primero, y por qué.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-ELV-001 |
| **Nombre** | ELEVATION_SYSTEM.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Interaction Design Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que identificó la elevación como la última Foundation pendiente (§4.3), y de `docs/design-system/GRID_SYSTEM.md` y `SPACING_SYSTEM.md`, con los que forma el conjunto completo de Foundations de organización espacial y perceptual |
| **Clasificación** | Documento de Arquitectura de Design System / Foundation |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura conceptual** de la jerarquía perceptual. No es fuente de identidad de marca, de estructura espacial (`GRID_SYSTEM.md`), de distancia (`SPACING_SYSTEM.md`), de color (`COLOR_SYSTEM.md`), ni de ninguna sombra, nivel de z-index o efecto visual concreto (no definidos) |
| **Documentos de los que depende** | `docs/design-system/DESIGN_SYSTEM.md`, `docs/design-system/GRID_SYSTEM.md`, `docs/design-system/SPACING_SYSTEM.md`, `docs/brand/BRAND_GUIDELINES.md`, `docs/brand/COLOR_SYSTEM.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `docs/brand/ICONOGRAPHY_SYSTEM.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/design/DESIGN_BRIEF.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Cierra, con este documento, el conjunto completo de Foundations señaladas como pendientes en `docs/design-system/DESIGN_SYSTEM.md` §4.3 (espaciado, grid y elevación); debería gobernar la futura implementación concreta de cualquier efecto visual de jerarquía perceptual |
| **Pregunta que responde** | ¿Cómo debe gobernarse la jerarquía perceptual del producto para que las personas comprendan naturalmente qué requiere atención en cada momento, sin introducir sesgos ni comprometer la neutralidad de ComparaFarma? |

---

## 2. Propósito

La Elevación no es profundidad física — no es, en este documento, una sombra que simula que un elemento "flota" sobre otro. Es la capa que decide, dentro de una pantalla ya estructurada por `docs/design-system/GRID_SYSTEM.md` y ya organizada en distancia por `docs/design-system/SPACING_SYSTEM.md`, **cuál de todo lo que ya está ahí merece percibirse primero**. Su función es organizar la atención, no decorar la interfaz — un uso de elevación que existe solo para "dar profundidad" a una pantalla, sin comunicar ninguna prioridad real, no cumple el propósito de este sistema.

Esta responsabilidad es especialmente sensible en ComparaFarma porque el producto combina, en el mismo espacio, información de alta densidad comparativa (`docs/design/DESIGN_BRIEF.md` §4.11) con momentos ocasionales que sí requieren atención inmediata y real —una alerta de precio, una alerta sanitaria, la ausencia de stock de un medicamento que la persona necesita—. Sin un sistema que distinga con disciplina qué es genuinamente más importante en cada momento de qué solo *parece* más importante por decoración, el producto corre el riesgo de manipular la atención en vez de orientarla — exactamente lo que `docs/brand/BRAND_FOUNDATIONS.md` §15 y §18 ya prohíben (*"una buena experiencia ayuda a decidir. Nunca empuja a decidir"*; *"no usaremos patrones de diseño que dificulten decidir con libertad"*).

`docs/design-system/DESIGN_SYSTEM.md` §4.3 identificó la elevación como la última de tres Foundations pendientes de gobierno (junto con espaciado y grid, ya cerradas). Este documento cierra ese vacío.

---

## 3. Alcance

**Este documento define:**

- Los principios de la jerarquía perceptual, derivados sin invención de la documentación ya existente (§4.1).
- Las capas conceptuales de prioridad — Información base, contextual, prioritaria, crítica e Interrupciones excepcionales — y el propósito de cada una, sin asignar ningún efecto visual (§4.2).
- Cómo la Elevación organiza la atención mediante importancia funcional, no decoración (§4.3).
- La relación entre Elevación y Grid, sin duplicar `GRID_SYSTEM.md` (§4.4).
- La relación entre Elevación y Spacing, sin duplicar `SPACING_SYSTEM.md` (§4.5).
- La relación entre Elevación y Color, sin duplicar `COLOR_SYSTEM.md` (§4.6).
- El principio de Neutralidad aplicado específicamente a la jerarquía perceptual (§4.7).
- Cómo una jerarquía perceptual consistente reduce la carga cognitiva (§4.8).
- Cómo deben incorporarse nuevos niveles conceptuales de prioridad sin fragmentar el sistema (§4.9).

**Este documento NO define:**

- Ninguna sombra, efecto de profundidad, blur, opacidad ni tratamiento visual concreto.
- Ningún nivel de z-index, superposición técnica ni valor de implementación.
- Ningún píxel ni medida.
- Ningún overlay, modal o componente concreto.
- Ninguna animación ni transición. Los principios de motion del isotipo ya están gobernados en `docs/brand/LOGO_SYSTEM.md` §4.8; este documento no los repite ni crea una filosofía de movimiento distinta.
- La estructura espacial de la pantalla. Pertenece íntegramente a `docs/design-system/GRID_SYSTEM.md` (§4.4).
- La distancia entre elementos ya posicionados. Pertenece íntegramente a `docs/design-system/SPACING_SYSTEM.md` (§4.5).
- Ninguna responsabilidad funcional del color. Pertenece íntegramente a `docs/brand/COLOR_SYSTEM.md` (§4.6).
- Ningún componente ni patrón concreto. No es una guía visual.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica a la elevación |
|---|---|---|
| Claridad | `docs/brand/BRAND_FOUNDATIONS.md` §11.1, Principio IV; `docs/design/DESIGN_BRIEF.md` §4.11 | Una jerarquía perceptual clara evita que la persona tenga que decidir por su cuenta qué mirar primero |
| Neutralidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2, §12; ya aplicada a color (`COLOR_SYSTEM.md` §4.5), espacio (`SPACING_SYSTEM.md` §4.2.3) y estructura (`GRID_SYSTEM.md` §4.8) | Cuarta y última aplicación del mismo principio a través de las Foundations de organización espacial y perceptual — desarrollado en §4.7 |
| Consistencia | `docs/brand/BRAND_ARCHITECTURE.md` §4.1 (Branded House); `docs/design-system/DESIGN_SYSTEM.md` §4.2, §4.8 | El mismo criterio de prioridad debe aplicarse igual en cualquier pantalla equivalente |
| Orientación | Concepto central de diseño (`docs/design/DESIGN_DECISION_LOG.md`, DD-001); ya aplicado espacialmente en `GRID_SYSTEM.md` §4.3 (Navegación) | Aplicado aquí no al espacio sino a la atención: saber qué mirar primero es tan parte de la orientación como saber dónde está cada cosa |
| Accesibilidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2; heredado de `TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `SPACING_SYSTEM.md` y `GRID_SYSTEM.md` | Desarrollado en §4.8 |
| Simplicidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2; `docs/design-system/DESIGN_SYSTEM.md` §4.2 | El sistema debe resolver la prioridad con el menor número de niveles conceptuales necesarios (§4.2) |

### 4.2 Arquitectura de Elevación

Cinco capas conceptuales de prioridad perceptual. Ninguna se traduce en un efecto visual concreto; cada una define solo su propósito.

#### 4.2.1 Información base

El nivel de reposo del sistema: contenido que existe en la interfaz sin exigir ninguna atención particular por encima del resto — por ejemplo, la lista completa de resultados en su estado normal. Es el nivel de referencia contra el que se mide cualquier otra prioridad.

#### 4.2.2 Información contextual

Contenido que acompaña o aclara la Información base sin competir con ella por atención — por ejemplo, una nota adicional o un canal de precio secundario. Su función es estar disponible para quien la busque, no exigir atención inmediata de quien no la busca.

#### 4.2.3 Información prioritaria

Contenido que, dentro de un momento específico del producto, merece percibirse antes que el resto de la Información base — por ejemplo, el resultado de mejor precio dentro de una comparación, ya calculado de forma objetiva por el sistema. Su prioridad debe poder justificarse siempre por un dato funcional ya existente, nunca por preferencia editorial (desarrollado en §4.7).

#### 4.2.4 Información crítica

Contenido cuya omisión o percepción tardía tendría una consecuencia real para la decisión de la persona — por ejemplo, una alerta sanitaria, o la ausencia de stock de un medicamento que se necesita con urgencia real. Esta capa se distingue explícitamente de la urgencia artificial ya prohibida en `docs/design/DESIGN_BRIEF.md` §4.10 ("elementos de urgencia agresiva"): la urgencia agresiva se fabrica para manipular la atención; la Información crítica es funcional y responde a una necesidad real de la persona, no a una necesidad de conversión del producto.

#### 4.2.5 Interrupciones excepcionales

El nivel más alto y menos frecuente del sistema: contenido que efectivamente interrumpe el flujo de la persona porque la alternativa —no interrumpir— sería peor para su bienestar o su decisión (por ejemplo, un error que impide completar una búsqueda). Debe ser el nivel menos usado de todo el sistema: su uso frecuente lo degrada, mismo principio ya aplicado al Color de Énfasis en `docs/brand/COLOR_SYSTEM.md` §4.2.5 (*"un sistema que recurre al énfasis con frecuencia deja de tener énfasis: lo diluye"*).

### 4.3 Jerarquía Perceptual

La Elevación organiza la atención mediante **importancia funcional**, no mediante decoración. La prioridad perceptual de un elemento debe ser siempre consecuencia directa de cuánto necesita la persona percibirlo primero para decidir bien en ese momento — nunca una decisión estética tomada de forma independiente de esa función, y nunca una decisión comercial disfrazada de prioridad funcional.

Esta es la aplicación más directa, dentro del Design System, de un principio ya consolidado en la identidad de marca: *"una buena experiencia ayuda a decidir. Nunca empuja a decidir"* (`docs/brand/BRAND_FOUNDATIONS.md` §15). Un sistema de elevación que amplifica algo por razones ajenas a su importancia funcional real ya está empujando la decisión, no ayudando a tomarla.

### 4.4 Relación con Grid

**Grid organiza dónde está la información. Elevación organiza cuál de esa información requiere atención.**

`docs/design-system/GRID_SYSTEM.md` define las Regiones funcionales y Zonas de contenido dentro de las cuales existe cualquier elemento de la interfaz. Este documento no redefine esa estructura — asume que ya existe, y decide, dentro de ella, qué elemento merece percibirse primero. Un Grid sin Elevación produce una estructura ordenada pero perceptualmente plana: todo se percibe con igual prioridad, lo cual, en un producto de alta densidad informativa (`docs/design/DESIGN_BRIEF.md` §4.11), dificulta saber por dónde empezar. Una Elevación sin Grid no tendría ningún lugar estructural sobre el cual aplicar su jerarquía. Ninguna de las dos Foundations sustituye a la otra.

### 4.5 Relación con Spacing

**Spacing separa. Elevación prioriza. Ambos trabajan juntos.**

`docs/design-system/SPACING_SYSTEM.md` define la distancia entre elementos ya posicionados por el Grid. Un elemento de Información crítica (§4.2.4) generalmente también requiere un tratamiento de espacio distinto —más "respiración" a su alrededor, coherente con el principio ya declarado en `SPACING_SYSTEM.md` §4.3— para que su prioridad perceptual no se diluya por estar demasiado cerca de contenido de menor prioridad. Esa decisión de distancia sigue siendo, en su totalidad, responsabilidad de `SPACING_SYSTEM.md`; este documento solo señala que ambas Foundations deben coordinarse cuando una prioridad de Elevación se traduce en una necesidad real de espacio.

### 4.6 Relación con Color

**El color puede reforzar una prioridad ya existente. Nunca puede crearla por sí solo.**

`docs/brand/COLOR_SYSTEM.md` ya anticipaba esta relación sin nombrarla: el Color de Énfasis (§4.2.5 de ese documento) "debe ser el recurso menos utilizado de todo el sistema", y el Color Semántico (§4.2.3) no puede usarse para indicar cuál farmacia o precio es "mejor". Ambas restricciones ya asumían que la prioridad real de un elemento se decide en otro lugar —aquí, en la Elevación— y que el color solo puede visibilizar esa prioridad, nunca inventarla. Si un elemento de Información base (§4.2.1) recibiera un tratamiento de color de énfasis sin que exista una razón de Elevación que lo justifique, el color estaría creando una prioridad que no existe — exactamente lo que este documento y `COLOR_SYSTEM.md`, juntos, prohíben.

### 4.7 Neutralidad

Cuarta y última aplicación, a través de las Foundations de organización espacial y perceptual, del mismo principio ya desarrollado en color (`COLOR_SYSTEM.md` §4.5), espacio (`SPACING_SYSTEM.md` §4.2.3) y estructura (`GRID_SYSTEM.md` §4.8): la jerarquía perceptual no puede introducir sesgos.

- **Ninguna farmacia puede recibir mayor elevación únicamente por acuerdos comerciales.** Consecuencia directa de `docs/brand/BRAND_FOUNDATIONS.md` §12 (*"no privilegiamos una farmacia por sobre otra por conveniencia comercial"*) y del Principio de producto 3, "Neutralidad" (§11.2).
- **Una alerta sanitaria sí puede tener mayor prioridad.** Es Información crítica (§4.2.4) por definición funcional: su omisión tendría una consecuencia real para la salud o la decisión de la persona, no por conveniencia editorial.
- **Un cambio de precio relevante puede justificar prioridad funcional.** Coherente con la funcionalidad de Alertas de precio ya implementada en el producto, y con el mismo criterio de "hecho ya calculado" ya usado en `COLOR_SYSTEM.md` y `GRID_SYSTEM.md`: si el sistema ya calculó que un precio bajó de forma significativa, elevar su prioridad perceptual refleja ese cálculo — no crea un sesgo, lo hace visible.
- **Una promoción comercial no puede desplazar información crítica del medicamento.** Regla de jerarquía inversa explícita: ninguna necesidad comercial puede reducir la prioridad perceptual de información cuya omisión tendría consecuencia real para la persona. Coherente con el Principio Inmutable VII (*"la independencia antes que la rentabilidad"*, `BRAND_FOUNDATIONS.md` §11.1) y con la Constitución, Art. IV (*"no alterar una recomendación por beneficio económico propio"*, citado en `BRAND_FOUNDATIONS.md` §11.1).

Estas son reglas arquitectónicas, no reglas visuales: este documento no dice cómo debe verse una alerta sanitaria ni cuánta sombra o contraste debe tener — dice únicamente qué puede y qué no puede justificar una prioridad perceptual dentro del sistema.

### 4.8 Accesibilidad

Una jerarquía perceptual consistente reduce la carga cognitiva, relacionado directamente con Claridad, Comprensión y Orientación (§4.1):

Si el criterio de prioridad cambia de una pantalla a otra sin razón funcional, la persona debe reinterpretar constantemente qué es importante, aumentando el esfuerzo cognitivo necesario para usar el producto. Una jerarquía perceptual consistente, en cambio, permite que la persona aprenda una sola vez cómo el sistema comunica prioridad y aplique ese aprendizaje en cualquier pantalla — mismo mecanismo de accesibilidad cognitiva ya declarado para la Continuidad estructural en `docs/design-system/GRID_SYSTEM.md` §4.7. Saber qué mirar primero es, en ese sentido, tan parte de la Orientación (DD-001) como saber dónde está cada cosa.

### 4.9 Evolución

Cualquier nivel conceptual de prioridad nuevo —por ejemplo, algo entre Información prioritaria e Información crítica— debe justificarse documentalmente con una razón funcional real, no estética, siguiendo el mismo patrón "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y del Design System (`docs/brand/BRAND_ARCHITECTURE.md` §4.7, `ICONOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.9). Ningún nivel nuevo puede introducir una jerarquía paralela a las cinco capas ya definidas en §4.2 — por ejemplo, un tratamiento de prioridad que no pueda ubicarse en ninguna de las cinco capas indica que la arquitectura necesita revisarse, no que el elemento deba forzarse en la capa más parecida.

Toda decisión de elevación debe registrarse mediante el mismo mecanismo de decisiones de diseño ya utilizado en `docs/design/DESIGN_DECISION_LOG.md` para el dominio de marca. Para el dominio `docs/design-system/`, ese registro ya existe en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` (Sprint DG.001 — Design System Governance), lo que resuelve el pendiente que este documento heredaba de `docs/design-system/DESIGN_SYSTEM.md` §4.8, `SPACING_SYSTEM.md` §4.7 y `GRID_SYSTEM.md` §4.9.

---

## 5. Relaciones

`ELEVATION_SYSTEM.md` depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que identificó la elevación como la última Foundation pendiente de gobierno, y de `docs/design-system/GRID_SYSTEM.md` y `SPACING_SYSTEM.md`, con los que forma un conjunto completo: Grid organiza dónde, Spacing organiza cuánta distancia, Elevación organiza qué requiere atención primero. Depende también de `docs/brand/COLOR_SYSTEM.md` (relación de refuerzo sin creación de prioridad, §4.6) y de `docs/brand/BRAND_FOUNDATIONS.md` (fuente directa del principio de Neutralidad, §4.7, y de la prohibición de manipular la decisión de la persona, §4.3).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define los niveles conceptuales de prioridad perceptual ni cómo esa prioridad debe derivarse siempre de una razón funcional real. Con este documento, las tres Foundations señaladas como vacío en `docs/design-system/DESIGN_SYSTEM.md` §4.3 —espaciado, grid y elevación— quedan todas gobernadas.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Elevación como última Foundation pendiente | `docs/design-system/DESIGN_SYSTEM.md` §4.3 | ✔ — este documento cierra ese vacío | Cierra el conjunto completo de Foundations señaladas |
| Prohibición de manipular la decisión de la persona | `docs/brand/BRAND_FOUNDATIONS.md` §15, §18 | ✔ — fundamenta §2 y §4.3 | — |
| Restricción contra urgencia agresiva | `docs/design/DESIGN_BRIEF.md` §4.10 | ✔ — distingue Información crítica de urgencia artificial (§4.2.4) | — |
| Neutralidad entre farmacias | `docs/brand/BRAND_FOUNDATIONS.md` §12, §11.2; ya aplicada en `COLOR_SYSTEM.md` §4.5, `SPACING_SYSTEM.md` §4.2.3, `GRID_SYSTEM.md` §4.8 | ✔ — cuarta y última aplicación (§4.7) | — |
| Independencia antes que rentabilidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.1, Principio VII; Constitución Art. IV | ✔ — fundamenta la regla sobre promociones comerciales (§4.7) | — |
| Restricción de uso del Color de Énfasis | `docs/brand/COLOR_SYSTEM.md` §4.2.5 | ✔ — extendida por analogía a Interrupciones excepcionales (§4.2.5 de este documento) | — |
| Relación Color–prioridad (refuerzo, no creación) | `docs/brand/COLOR_SYSTEM.md` §4.2.3, §4.2.5 | ✔ — formalizada en §4.6 | — |
| Estructura espacial (Grid) | `docs/design-system/GRID_SYSTEM.md` | Referenciada, no duplicada (§4.4) | — |
| Distancia entre elementos (Spacing) | `docs/design-system/SPACING_SYSTEM.md` | Referenciada, no duplicada (§4.5) | — |
| Principios de motion del isotipo | `docs/brand/LOGO_SYSTEM.md` §4.8 | Referenciados, no duplicados (§3) | La elevación no incluye principios de movimiento propios |
| Registro de decisiones de arquitectura del dominio `docs/design-system/` | `docs/design-system/DESIGN_SYSTEM.md` §4.8; heredado por `SPACING_SYSTEM.md`, `GRID_SYSTEM.md` | ✔ — resuelto (§4.9); registro formal en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` | Sprint DG.001 — Design System Governance |
| Sombras, z-index, efectos visuales concretos | — (no existe documento de implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de una decisión de implementación futura |

---

## 7. Gobierno

`ELEVATION_SYSTEM.md` **no reemplaza**:

- `docs/design-system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System.
- `docs/design-system/GRID_SYSTEM.md` y `SPACING_SYSTEM.md` — siguen siendo la única fuente de estructura espacial y de distancia, respectivamente; este documento no las duplica, solo formaliza su relación con la prioridad perceptual (§4.4, §4.5).
- `docs/brand/COLOR_SYSTEM.md` — sigue siendo la única fuente de las responsabilidades funcionales del color; este documento aclara que el color puede reforzar la prioridad que aquí se gobierna, nunca crearla (§4.6).
- `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.

La responsabilidad específica de `ELEVATION_SYSTEM.md` dentro del Design System es gobernar exclusivamente los **principios y los niveles conceptuales de la jerarquía perceptual**: qué hace que un elemento merezca atención antes que otro, y cómo esa prioridad debe derivarse siempre de una razón funcional real, nunca de una decisión estética o comercial. **Con este documento quedan gobernadas las tres Foundations declaradas pendientes por `docs/design-system/DESIGN_SYSTEM.md` §4.3** (espaciado, grid y elevación) — el Design System de ComparaFarma cuenta, a partir de esta versión, con la arquitectura conceptual completa de sus Foundations de organización espacial y perceptual, aunque ninguna de ellas tenga todavía una implementación concreta ni aprobación formal.

No gobierna, y no debe absorber en ninguna revisión futura, ninguna sombra, nivel de z-index, efecto visual, overlay, componente o animación — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido sin importar qué sistema visual o tecnología adopte el producto en el futuro.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** El registro de decisiones de arquitectura del dominio `docs/design-system/`, antes señalado como vacío en `docs/design-system/DESIGN_SYSTEM.md` §4.8, `SPACING_SYSTEM.md` §4.7 y `GRID_SYSTEM.md` §4.9, ya no está pendiente: existe en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` (Sprint DG.001 — Design System Governance).

---

## 8. Documentos relacionados

- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/SPACING_SYSTEM.md`
- `docs/brand/BRAND_GUIDELINES.md`
- `docs/brand/COLOR_SYSTEM.md`
- `docs/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/brand/LOGO_SYSTEM.md`
- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura implementación concreta de efectos de jerarquía perceptual (Design Tokens), y el futuro catálogo de componentes vivo ya anticipado en `docs/design-system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Cierra la última Foundation pendiente señalada en `docs/design-system/DESIGN_SYSTEM.md` §4.3. Define principios derivados sin invención, cinco capas conceptuales de prioridad perceptual (Información base, contextual, prioritaria, crítica, Interrupciones excepcionales), jerarquía perceptual basada en importancia funcional, relación con Grid, Spacing y Color sin duplicar ninguno, principio de Neutralidad aplicado a la jerarquía perceptual con reglas arquitectónicas explícitas sobre farmacias, alertas sanitarias, cambios de precio y promociones comerciales, accesibilidad, y reglas de evolución. No define sombras, z-index, efectos visuales ni tecnología. Con este documento quedan gobernadas las tres Foundations declaradas pendientes por `DESIGN_SYSTEM.md`. | `docs/design-system/DESIGN_SYSTEM.md` v1.0; `GRID_SYSTEM.md` v1.0; `SPACING_SYSTEM.md` v1.0; `docs/brand/BRAND_GUIDELINES.md` v1.0; `COLOR_SYSTEM.md` v1.0; `BRAND_FOUNDATIONS.md` v1.1; `docs/design/DESIGN_BRIEF.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.001 — Design System Governance. Se actualiza la referencia al registro de decisiones de arquitectura del dominio `docs/design-system/`: ya no está pendiente; el registro formal existe en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de espaciado | Design Systems Architect / Spatial Systems Director / Enterprise Documentation Architect | `docs/design-system/SPACING_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de grid | Design Systems Architect / Information Architecture Director / Enterprise Documentation Architect | `docs/design-system/GRID_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de elevación, cerrando el conjunto completo de Foundations pendientes de `DESIGN_SYSTEM.md` | Design Systems Architect / Interaction Design Director / Enterprise Documentation Architect | `docs/design-system/ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance. Actualización de referencia cruzada: el registro de decisiones del dominio ya no está pendiente. | Design Systems Architect / Enterprise Documentation Architect | `docs/design-system/ELEVATION_SYSTEM.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro formal de decisiones de arquitectura del dominio, antes señalado como vacío, ya no está pendiente: existe en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`. Queda pendiente, transversal a las cuatro Foundations del Design System, toda implementación concreta (Design Tokens, componentes, catálogo vivo) que traduzca estas cuatro Foundations a un producto real.
