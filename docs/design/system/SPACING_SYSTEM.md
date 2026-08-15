# SPACING_SYSTEM — Especificación Oficial del Sistema de Espaciado de ComparaFarma

Este documento no define una escala de espaciado, no establece píxeles, no crea Design Tokens, no define márgenes de componentes y no sustituye una guía de UI. Es la **especificación oficial del sistema de espaciado**: qué responsabilidad tiene el espacio dentro del producto, qué capas conceptuales lo organizan, y qué principios debe cumplir cualquier escala numérica futura. Debe seguir siendo válido aunque el sistema adopte, más adelante, una escala de 4pt, de 8pt o cualquier otra base — porque no gobierna esa escala, gobierna el propósito que cualquier escala deberá cumplir.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-SPA-001 |
| **Nombre** | SPACING_SYSTEM.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Spatial Systems Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design/system/DESIGN_SYSTEM.md`, que ya identificó el espaciado como una Foundation pendiente de gobierno (§4.3 de ese documento), y de `docs/design/brand/BRAND_GUIDELINES.md` y `TYPOGRAPHY_SYSTEM.md` |
| **Clasificación** | Documento de Arquitectura de Design System / Foundation |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura conceptual** del sistema de espaciado. No es fuente de identidad de marca, de arquitectura tipográfica (`TYPOGRAPHY_SYSTEM.md`), de grid (documento no creado), ni de ninguna escala, token o valor de espaciado concreto (no definidos) |
| **Documentos de los que depende** | `docs/design/system/DESIGN_SYSTEM.md`, `docs/design/brand/BRAND_GUIDELINES.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/design/brand/COLOR_SYSTEM.md`, `docs/design/DESIGN_BRIEF.md`, `docs/product/PRODUCT_PRINCIPLES.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Cierra el vacío de Foundation "espaciado" señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3, y debería gobernar la futura escala numérica concreta (Design Tokens de espaciado, no creados) y condicionar a un futuro `GRID_SYSTEM.md` (no creado) en su relación con el espacio |
| **Pregunta que responde** | ¿Cómo debe gobernarse el espacio dentro de ComparaFarma para producir interfaces consistentes, legibles y escalables? |

---

## 2. Propósito

El espacio dentro de la interfaz de ComparaFarma no es un vacío entre elementos: es un **sistema de comunicación**, con una responsabilidad particularmente crítica en este producto porque su propuesta de valor central exige sostener, "con claridad, la convivencia de información numérica y comparativa densa" (`docs/design/DESIGN_BRIEF.md` §4.11) — precios, farmacias, canales — sin que esa densidad se perciba como desorden. Antes de que el color o la tipografía comuniquen nada, la proximidad y la separación entre elementos ya comunican qué pertenece junto y qué está separado: es, en términos de percepción, el mecanismo más elemental de organización visual que existe, y el que actúa primero.

`docs/design/system/DESIGN_SYSTEM.md` §4.3 ya identificó el espaciado como una Foundation de la arquitectura del Design System todavía sin gobierno propio. Este documento cierra ese vacío: no porque el espaciado sea un detalle estético pendiente, sino porque un sistema que ya exige que la jerarquía visual se apoye en el espaciado (`docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.5: "la jerarquía debe construirse combinando peso, tamaño relativo y espaciado") no puede dejar esa responsabilidad sin definición propia indefinidamente.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema de espaciado, derivados sin invención de la documentación ya existente (§4.1).
- Las capas conceptuales que organizan el espacio dentro del producto — Micro, Component, Section, Layout y Page spacing — y la responsabilidad de cada una, sin tamaños (§4.2).
- El concepto de ritmo espacial: repetición, consistencia, respiración visual y densidad, sin medidas (§4.3).
- La relación conceptual entre espaciado y tipografía, sin duplicar `TYPOGRAPHY_SYSTEM.md` (§4.4).
- La relación conceptual entre espaciado y grid, sin duplicar un futuro `GRID_SYSTEM.md` (§4.5).
- Cómo el espaciado mejora la comprensión y sostiene la accesibilidad, sin métricas concretas (§4.6).
- Cómo debe evolucionar el sistema y cómo se incorpora una escala numérica futura sin romper esta arquitectura (§4.7).

**Este documento NO define:**

- Ninguna escala numérica de espaciado, ni una base específica (no se menciona, elige ni descarta ningún sistema de 4pt, 8pt o equivalente).
- Ningún píxel, unidad de medida ni valor concreto.
- Ningún Design Token de espaciado. La capa de Design Tokens ya está definida arquitectónicamente en `docs/design/system/DESIGN_SYSTEM.md` §4.4; este documento es la Foundation que esa capa deberá traducir, no la traducción en sí misma.
- Ningún margen, padding o medida específica de ningún componente.
- La arquitectura tipográfica ni sus capas. Pertenece íntegramente a `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, que este documento no duplica — solo referencia su relación (§4.4).
- Ningún sistema de grid, columnas o alineación. Corresponde a un futuro `GRID_SYSTEM.md`, todavía no creado — mismo vacío ya señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3, que este documento no resuelve (§4.5).
- Ningún componente, patrón o pantalla concreta. No es una guía de UI.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica al espaciado |
|---|---|---|
| Claridad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.1, Principio IV; `docs/design/DESIGN_BRIEF.md` §4.11 | El espacio debe reducir el esfuerzo de lectura de una comparación densa, nunca aumentarlo |
| Simplicidad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.2; `docs/design/system/DESIGN_SYSTEM.md` §4.2 | El sistema debe resolver la organización del espacio con el menor número de capas conceptuales necesarias — desarrollado en §4.2 |
| Consistencia | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.1 (Branded House); `docs/design/system/DESIGN_SYSTEM.md` §4.2, §4.8 | Ninguna plataforma puede resolver una relación espacial de forma distinta a las demás sin registrar esa decisión como extensión formal del sistema |
| Jerarquía visual apoyada por el espacio | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.5 ("la jerarquía debe construirse combinando peso, tamaño relativo y espaciado"); `docs/design/brand/COLOR_SYSTEM.md` §4.3 | Fundamenta directamente por qué este documento existe: el espaciado ya es, por mandato de otro sistema, uno de los mecanismos obligatorios de jerarquía |
| Accesibilidad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.2; heredado de `TYPOGRAPHY_SYSTEM.md` §4.7 (interlineado, espaciado) y `COLOR_SYSTEM.md` §4.4 (redundancia visual) | Desarrollado en §4.6 |
| Escalabilidad | `docs/product/PRODUCT_PRINCIPLES.md`, Principio 9; `docs/design/system/DESIGN_SYSTEM.md` §4.2 | El sistema de capas debe sostenerse sin cambios al incorporar nuevas pantallas, secciones o plataformas |
| Mantenibilidad | `docs/design/system/DESIGN_SYSTEM.md` §4.2, derivado de "Mejora continua" (`BRAND_FOUNDATIONS.md` §11.1, Principio X) | Fundamenta que la escala numérica futura sea un Token reemplazable sin alterar esta arquitectura conceptual (§4.7) |

### 4.2 Arquitectura del Espaciado

Cinco capas conceptuales. Ninguna se resuelve con una medida concreta; cada una define solo su responsabilidad.

#### 4.2.1 Micro spacing

El espacio más pequeño del sistema, entre elementos íntimamente relacionados dentro de una misma unidad de significado (por ejemplo, entre un ícono y su etiqueta de texto). Su responsabilidad es comunicar que dos elementos pertenecen a una misma unidad indivisible — no que están simplemente cerca.

#### 4.2.2 Component spacing

El espacio entre las partes internas de un componente compuesto, o entre un componente y su borde inmediato. Su responsabilidad es dar cohesión interna a una unidad de interfaz sin fusionarla visualmente con lo que la rodea.

#### 4.2.3 Section spacing

El espacio entre grupos de componentes que forman una sección funcional — por ejemplo, entre una fila de resultado de precio y la siguiente. Esta capa tiene una responsabilidad especialmente sensible en este producto: cada sección de resultado representa habitualmente una farmacia distinta dentro de una comparación, y el mismo principio de Neutralidad ya exigido al color (`docs/design/brand/COLOR_SYSTEM.md` §4.5: "ningún color puede asociarse... de manera que la distinga visualmente como preferida") se extiende aquí al espacio: **todas las secciones de resultado equivalentes deben usar el mismo Section Spacing, sin excepción**, porque una proximidad visual diferenciada entre opciones de una comparación introduciría el mismo tipo de sesgo que el color ya tiene prohibido introducir.

#### 4.2.4 Layout spacing

El espacio que organiza secciones completas dentro de una pantalla — por ejemplo, entre un buscador y la lista de resultados que produce. Su responsabilidad es dar estructura general a la pantalla, sin descender al detalle de cada componente individual.

#### 4.2.5 Page spacing

El espacio en los bordes exteriores de una pantalla completa. Su responsabilidad es definir el límite entre el contenido del producto y el borde del dispositivo o ventana — es la capa más externa y, coherente con la prioridad mobile-first ya establecida (`docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.6), la primera que debe adaptarse cuando cambia el tamaño de pantalla.

### 4.3 Ritmo Espacial

El ritmo espacial es la propiedad que hace que las cinco capas anteriores se perciban como un sistema, no como decisiones aisladas pantalla por pantalla:

- **Repetición:** el mismo tipo de relación espacial debe repetirse de forma predecible en contextos equivalentes. Si el espacio entre dos filas de resultados varía sin razón funcional, el sistema deja de comunicar que ambas filas son elementos comparables entre sí.
- **Consistencia:** el mismo ritmo debe sostenerse igual en toda la aplicación, no solo dentro de una misma pantalla — consecuencia directa del principio de Consistencia (§4.1).
- **Respiración visual:** el espacio no ocupado también comunica. Un sistema sin momentos de pausa entre secciones densas de información se percibe agotador de leer, lo opuesto a la emoción objetivo "Tranquilidad" ya declarada en `docs/design/DESIGN_BRIEF.md` §4.7.
- **Densidad:** la cantidad de información mostrada por unidad de espacio debe ser una decisión deliberada, no un accidente de cuánto contenido "cupo" en la pantalla. El producto exige sostener alta densidad de datos comparativos (`DESIGN_BRIEF.md` §4.11) sin que esa densidad se perciba como desorden — el ritmo espacial es, precisamente, el mecanismo que hace posible esa convivencia.

### 4.4 Relación con Tipografía

Sin duplicar `docs/design/brand/TYPOGRAPHY_SYSTEM.md`: ese documento ya declaró, en su §4.5, que la jerarquía visual debe construirse combinando peso, tamaño relativo **y espaciado**. Este documento es la contraparte de esa declaración: define qué responsabilidad tiene el espaciado dentro de esa combinación — organizar la relación entre bloques de texto, no decidir el tratamiento del texto en sí (eso sigue siendo, íntegramente, competencia de `TYPOGRAPHY_SYSTEM.md`).

El interlineado, ya mencionado como requisito de accesibilidad en `TYPOGRAPHY_SYSTEM.md` §4.7, pertenece conceptualmente a la frontera entre ambos sistemas: es, al mismo tiempo, una decisión tipográfica (afecta la lectura de un bloque de texto) y una decisión de espaciado (es, literalmente, espacio vertical entre líneas). Este documento no resuelve esa ambigüedad de propiedad por decreto — la señala como una superficie de coordinación necesaria entre ambos sistemas antes de que exista cualquier implementación concreta.

### 4.5 Relación con Grid

Sin duplicar un futuro `GRID_SYSTEM.md`: al igual que el espaciado, el grid es una Foundation señalada como vacío de gobierno en `docs/design/system/DESIGN_SYSTEM.md` §4.3, y a la fecha de este documento tampoco existe.

Espaciado y grid son responsabilidades relacionadas pero distintas: el grid define la estructura de columnas y alineación sobre la que se posiciona el contenido; el espaciado define la distancia entre ese contenido una vez posicionado sobre esa estructura. Ninguno sustituye al otro — un sistema de espaciado no resuelve alineación entre columnas, y un grid no resuelve cuánto "aire" hay entre dos elementos ya alineados. Este documento deja explícitamente pendiente, para cuando `GRID_SYSTEM.md` se cree, la coordinación formal entre ambos.

### 4.6 Accesibilidad

Cómo el espaciado mejora la comprensión, sin métricas concretas:

- Un espacio adecuado entre elementos interactivos reduce el riesgo de activar accidentalmente el elemento equivocado — particularmente relevante en Mobile, ya confirmado como canal primario de diseño (`TYPOGRAPHY_SYSTEM.md` §4.6).
- El espacio entre bloques de información permite distinguir un resultado de otro sin depender exclusivamente de percibir un cambio de color — el espaciado es, junto con la forma y el texto, uno de los mecanismos de redundancia visual que ya exige `docs/design/brand/COLOR_SYSTEM.md` §4.4 para que ningún significado dependa solo del color.
- Un ritmo espacial consistente (§4.3) reduce la carga cognitiva de tener que reinterpretar la estructura de cada pantalla nueva — mismo principio ya aplicado por analogía en `docs/design/brand/COLOR_SYSTEM.md` §4.3 ("el color debe reducir la carga cognitiva, no aumentarla").

### 4.7 Gobierno de Evolución

Cualquier capa nueva de espaciado (por ejemplo, una capa intermedia entre Section y Layout spacing) debe justificarse formalmente por una necesidad real de organización de contenido, no por preferencia estética — mismo patrón "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y en `docs/design/system/DESIGN_SYSTEM.md` §4.8.

Toda decisión de espaciado debe registrarse mediante el mismo mecanismo de decisiones de diseño ya establecido: `docs/design/decisions/DESIGN_DECISION_LOG.md` para decisiones de identidad de marca, y `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` para decisiones de arquitectura de producto, abierto en el Sprint DG.001 — Design System Governance.

**Ninguna implementación futura de una escala numérica de espaciado (4pt, 8pt, o cualquier otra base) puede contradecir las cinco capas conceptuales de §4.2 ni los principios de §4.1.** Bajo la arquitectura ya definida en `docs/design/system/DESIGN_SYSTEM.md` §4.4, esa escala numérica es un Design Token: la traducción de esta Foundation a un valor concreto, no una decisión de la Foundation en sí misma. Este documento seguirá siendo válido sin importar qué escala numérica se elija después, porque no gobierna la escala — gobierna el propósito que cualquier escala deberá cumplir.

---

## 5. Relaciones

`SPACING_SYSTEM.md` depende directamente de `docs/design/system/DESIGN_SYSTEM.md`, que identificó el espaciado como Foundation pendiente de gobierno y define la arquitectura de capas (Foundations → Tokens → Componentes → Patrones) dentro de la cual este documento se inserta como Foundation, no como Token. Depende también de `docs/design/brand/BRAND_GUIDELINES.md` (gobierno de convivencia entre sistemas), `docs/design/brand/TYPOGRAPHY_SYSTEM.md` (que ya exige espaciado como mecanismo de jerarquía) y `docs/design/brand/COLOR_SYSTEM.md` (cuyo principio de Neutralidad se extiende aquí a la organización espacial de comparaciones, §4.2.3).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define las capas conceptuales del espacio ni su ritmo. Este documento tampoco resuelve la relación con un futuro `GRID_SYSTEM.md` (§4.5) ni con la propiedad compartida del interlineado con `TYPOGRAPHY_SYSTEM.md` (§4.4) — ambas quedan señaladas como coordinación pendiente, no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Espaciado como Foundation pendiente de gobierno | `docs/design/system/DESIGN_SYSTEM.md` §4.3 | ✔ — este documento cierra ese vacío | — |
| Espaciado como mecanismo obligatorio de jerarquía | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.5 | ✔ — fundamenta §4.1, desarrollado en §4.4 | — |
| Principios de marca y producto aplicables | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/product/PRODUCT_PRINCIPLES.md`, `docs/design/system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Densidad de información comparativa | `docs/design/DESIGN_BRIEF.md` §4.11 | ✔ — fundamenta §2 y §4.3 | — |
| Neutralidad entre farmacias | `docs/design/brand/BRAND_FOUNDATIONS.md` §12; `docs/design/brand/COLOR_SYSTEM.md` §4.5 | ✔ — extendida al Section spacing (§4.2.3) | Mismo riesgo de sesgo, distinto mecanismo (espacio en vez de color) |
| Redundancia visual | `docs/design/brand/COLOR_SYSTEM.md` §4.4 | ✔ — extendida al espaciado en §4.6 | — |
| Emoción objetivo "Tranquilidad" | `docs/design/DESIGN_BRIEF.md` §4.7 | ✔ — fundamenta "respiración visual" (§4.3) | — |
| Design Tokens (capa que traducirá esta Foundation) | `docs/design/system/DESIGN_SYSTEM.md` §4.4 | Referenciado, no creado (§4.7) | La escala numérica pertenece a esa capa, no a este documento |
| Grid | — (no existe `GRID_SYSTEM.md` todavía) | No consolidado — declarado explícitamente fuera de alcance (§4.5) | Mismo vacío señalado en `DESIGN_SYSTEM.md` §4.3 |
| Escala numérica de espaciado (4pt, 8pt u otra) | — (no existe documento de implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de una decisión de implementación futura |

---

## 7. Gobierno

`SPACING_SYSTEM.md` **no reemplaza**:

- `docs/design/system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System, dentro de la cual este documento es una Foundation, no un nivel superior ni independiente.
- `docs/design/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md` — sigue siendo la única fuente de arquitectura tipográfica; este documento solo señala su punto de coordinación necesaria (§4.4), sin resolverlo por su cuenta.
- Un futuro `GRID_SYSTEM.md` — cuando se cree, seguirá siendo la única fuente de estructura de columnas y alineación; este documento no lo sustituye ni se atribuye esa responsabilidad (§4.5).

La responsabilidad específica de `SPACING_SYSTEM.md` dentro de la Arquitectura de Marca y del Design System es gobernar exclusivamente los **principios, las capas conceptuales y el ritmo** del espacio: qué responsabilidad cumple cada capa, cómo se sostiene su consistencia, y cómo mejora la accesibilidad y la comprensión de una comparación densa de información. No gobierna, y no debe absorber en ninguna revisión futura, ninguna escala numérica, ningún Design Token, ningún margen de componente ni ninguna decisión de grid — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido sin importar qué escala numérica de espaciado se adopte en el futuro.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** El registro de decisiones de arquitectura de producto ya existe en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` (Sprint DG.001 — Design System Governance). Este documento hereda, y no resuelve por sí mismo, el pendiente de gobierno sobre Grid ya señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.8, y deja además pendiente, como coordinación futura, la propiedad compartida del interlineado entre este documento y `TYPOGRAPHY_SYSTEM.md` (§4.4).

---

## 8. Documentos relacionados

- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/brand/BRAND_GUIDELINES.md`
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/design/brand/COLOR_SYSTEM.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/BRAND_ARCHITECTURE.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura escala numérica de espaciado (Design Tokens), un futuro `GRID_SYSTEM.md`, y el futuro catálogo de componentes vivo ya anticipado en `docs/design/system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Cierra el vacío de la Foundation "espaciado" señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3. Define principios derivados sin invención, cinco capas conceptuales (Micro, Component, Section, Layout, Page spacing) con responsabilidades sin tamaños, ritmo espacial (repetición, consistencia, respiración visual, densidad), relación conceptual con tipografía y con un futuro grid sin duplicar ninguno, principios de accesibilidad, y gobierno de evolución que permite incorporar cualquier escala numérica futura sin romper esta arquitectura. No define escalas, píxeles ni tokens. | `docs/design/system/DESIGN_SYSTEM.md` v1.0; `docs/design/brand/BRAND_GUIDELINES.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.001 — Design System Governance. Se actualiza la referencia al registro de decisiones de arquitectura de producto (§4.7, §7): ya no está pendiente, existe en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modificó ningún contenido arquitectónico de las capas de espaciado ni de los principios ya definidos en v1.0. | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design/system/README.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de espaciado, cerrando el vacío de Foundation señalado en `DESIGN_SYSTEM.md` | Design Systems Architect / Spatial Systems Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md` v1.0 |
| 2026-08-05 | Apertura del Sprint DG.001 — Design System Governance: registro de decisiones y actualización de referencias cruzadas | Enterprise Documentation Architect / Design Governance Architect | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design/system/SPACING_SYSTEM.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de decisiones ya no está pendiente. Quedan pendientes, y fuera de esta versión: la escala numérica de espaciado y la coordinación formal de la propiedad compartida del interlineado con `TYPOGRAPHY_SYSTEM.md`.
