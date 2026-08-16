# Plantilla de Documento Gobernado

**Código:** GOV-TPL-001

**Nombre:** GOVERNED_DOCUMENT_TEMPLATE.md

**Dominio:** Gobierno Documental (`docs/templates/`)

**Estado:** Activo

**Versión:** 1.1

**Propietario:** CEO / CTO

**Nivel de Gobierno:** Estándar de Gobierno Documental

**Clasificación:** Plantilla / Estándar

---

## Propósito de esta plantilla

Este documento define la **estructura obligatoria** que debe seguir todo documento estratégico del repositorio de ComparaFarma, en cualquiera de los siguientes dominios: **Enterprise, Brand, Product, Strategy, Architecture, Governance, Design System**.

Su objetivo no es decidir el contenido de ningún documento. Su objetivo es asegurar que todos los documentos estratégicos compartan el mismo esqueleto de gobierno, de modo que cualquier persona del equipo pueda ubicar, en la misma sección numerada, la misma clase de información sin importar qué documento esté leyendo.

Esta plantilla nace de un caso concreto: la revisión de gobierno documental aplicada a `docs/design/brand/BRAND_FOUNDATIONS.md` (versión 1.1). En vez de que ese estándar quedara implícito en un solo documento, se extrae aquí como referencia explícita y reutilizable. `BRAND_FOUNDATIONS.md` es, en consecuencia, el primer ejemplo real de esta plantilla ya aplicada, y se cita a lo largo de este documento como caso de referencia.

Esta plantilla no reemplaza el criterio editorial de cada documento. No dice qué debe decir un documento sobre misión, visión, arquitectura o producto. Dice únicamente cómo debe organizarse para ser gobernable.

---

## Alcance

**Este documento define:**

* La estructura mínima obligatoria (10 secciones) que debe tener todo documento estratégico nuevo o revisado en los dominios Enterprise, Brand, Product, Strategy, Architecture, Governance y Design System.
* El propósito de cada sección y cuándo debe usarse.
* Los campos mínimos de metadatos de gobierno que todo documento estratégico debe declarar.
* Los niveles de gobierno documental reconocidos en el repositorio.

**Este documento NO define:**

* El contenido conceptual de ningún documento específico (eso pertenece a cada documento).
* Reglas de estilo narrativo, tono o redacción.
* Identidad de marca, misión, visión o propósito de ComparaFarma (ver `docs/design/brand/BRAND_FOUNDATIONS.md`).
* Arquitectura técnica de software (ver `docs/architecture/`).
* Un proceso de aprobación formal de documentos (eso corresponde a un futuro documento de gobernanza si se decide crearlo).

---

## Estructura obligatoria

Todo documento estratégico nuevo, y todo documento estratégico existente que sea revisado por gobierno documental, debe incluir las siguientes 10 secciones, en este orden. El nombre exacto de cada sección puede adaptarse levemente al contenido del documento (por ejemplo, "Relación con Enterprise" en vez de "Relaciones", como ocurre en `BRAND_FOUNDATIONS.md`), pero su función debe mantenerse.

### 1. Metadata

**Campos mínimos obligatorios:**

| Campo | Descripción |
| --- | --- |
| Código | Identificador único del documento (ver convención de códigos más abajo). |
| Nombre | Nombre de archivo del documento. |
| Dominio | Carpeta o área del repositorio a la que pertenece (`docs/enterprise/`, `docs/brand/`, `docs/product/`, `docs/strategy/`, `docs/architecture/`, `docs/governance/`, `docs/design-system/`, etc.). |
| Estado | Draft / En Elaboración / Activo / Deprecado / Histórico-inmutable. |
| Versión | Número de versión semántica simple (1.0, 1.1, 2.0, etc.), con calificador si corresponde (ej. "1.0 (Draft)"). |
| Propietario | Rol o cargo responsable del documento (ej. CEO / CTO), no una persona física. |
| Nivel de Gobierno | Uno de los niveles definidos en la sección "Niveles de Gobierno Documental" de esta plantilla. |
| Clasificación | Tipo de documento (ej. Documento Estratégico, Documento de Arquitectura Empresarial, Documento Fundacional derivado, Plantilla / Estándar). |

**Cuándo usarla:** siempre, en todo documento estratégico, como bloque inicial antes de cualquier contenido narrativo. Es el bloque que permite identificar un documento sin necesidad de leerlo completo.

**Ejemplo real:** la sección "Estado del Documento" de `BRAND_FOUNDATIONS.md` v1.1 implementa este bloque con los campos Código, Dominio, Nivel de Gobierno, Estado, Propietario, Fuente Oficial, Documentos de los que depende y Documentos que gobierna — dos de estos últimos (Fuente Oficial, Documentos que gobierna/de los que depende) son extensiones propias de documentos que consolidan otras fuentes, y se explican en la sección 5 de esta plantilla.

**Convención de códigos:** se observa en el repositorio el patrón `[DOMINIO]-[TIPO]-[NÚMERO]`, por ejemplo `STR-DAR-001` (Digital Asset Register, en `docs/strategy/`), `ENT-BS-001` (Business Services, en `docs/enterprise/`), `BRD-FND-001` (Brand Foundations, en `docs/brand/`). Todo documento estratégico nuevo debe asignarse un código siguiendo este patrón; esta plantilla asume el código `GOV-TPL-001`.

---

### 2. Propósito

Un párrafo (o unos pocos párrafos breves) que responde: ¿para qué existe este documento? ¿Qué pregunta específica responde?

**Cuándo usarla:** siempre. Debe poder leerse de forma aislada y entender por qué el documento existe, sin necesidad de leer el resto.

**Ejemplo real:** sección "Propósito del documento" de `BRAND_FOUNDATIONS.md`, que declara explícitamente que el documento responde solo a "¿Quién es ComparaFarma?" y no a preguntas de identidad visual o comunicación.

---

### 3. Alcance

Estructurada como dos listas explícitas:

* **Este documento define:** ...
* **Este documento NO define:** ...

**Cuándo usarla:** siempre que el documento pudiera confundirse en su cobertura con otro documento del repositorio (lo cual, en la práctica, aplica a todo documento estratégico). Esta sección es la que previene la duplicación de contenido entre documentos: si algo "no define" un documento, esa lista debe apuntar, cuando sea posible, a qué otro documento sí lo define.

**Ejemplo real:** sección "Alcance" de `BRAND_FOUNDATIONS.md`, y sección "Alcance" del propio `docs/enterprise/README.md`.

---

### 4. Contenido principal

Aquí va el contenido conceptual propio del documento: lo que el documento efectivamente viene a decir (la misión, la visión, el modelo de datos, el mapa de capacidades, el registro de activos, etc.). Esta sección no tiene una forma fija porque su forma depende del tipo de documento.

**Cuándo usarla:** siempre; es el cuerpo del documento. En documentos largos puede dividirse en múltiples subsecciones numeradas (como ocurre en `BRAND_FOUNDATIONS.md`, donde el contenido principal ocupa las secciones "¿Qué es ComparaFarma?" hasta "Nuestros Compromisos").

**Regla importante:** el contenido principal debe evitar reescribir información que ya tiene una fuente oficial en otro documento. Debe resumir y referenciar esa fuente en vez de duplicarla — este es el principio de "una sola fuente de verdad por concepto" ya adoptado en `docs/enterprise/README.md` ("La información no debe duplicarse entre estas carpetas. Cada decisión debe mantenerse en una única fuente de verdad.").

---

### 5. Relaciones

Explica cómo se relaciona este documento con otros modelos o documentos estratégicos del repositorio, sin duplicar su contenido — solo explicando el rol de cada uno y el tipo de relación (de qué depende, a qué complementa, a qué antecede).

**Cuándo usarla:** siempre que el documento tenga dependencias o relaciones relevantes con otros documentos de Enterprise, Strategy, Product o Architecture. Si el documento tiene relaciones de distinta naturaleza que conviene separar (por ejemplo, su relación con la Arquitectura Empresarial versus su relación con el resto del repositorio documental), esta sección puede dividirse en dos, manteniendo ambas como parte de la misma función.

**Ejemplo real:** `BRAND_FOUNDATIONS.md` implementa esta sección dividida en dos: "Relación con Enterprise" (explica su relación con Digital Asset Register, Enterprise Data Model, Business Capability Map y Business Services) y "Relación con el Repositorio" (explica su relación con `docs/book/`, `docs/strategy/`, `docs/product/`).

---

### 6. Matriz de Trazabilidad

Tabla obligatoria con, como mínimo, estas columnas:

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
| --- | --- | --- | --- |
| (nombre del concepto) | (documento que es la fuente oficial de ese concepto) | (✔ si este documento lo consolida / referencia, — si no aplica) | (pendientes, advertencias o matices sobre ese concepto) |

**Cuándo usarla:** en todo documento que consolide, resuma o dependa de conceptos definidos originalmente en otros documentos. Su función es hacer explícito, concepto por concepto, dónde vive la fuente de verdad y qué hace este documento con ella (la consolida, la referencia, o no la toca). La columna "Observaciones" existe para registrar pendientes (por ejemplo, decisiones sin ratificar formalmente) sin necesidad de desarrollarlos en el cuerpo del documento.

**Ejemplo real:** sección "Matriz de Trazabilidad" de `BRAND_FOUNDATIONS.md` v1.1, con 17 filas cubriendo desde Historia hasta Competencia de mercado.

---

### 7. Gobierno

Explica el estatus de gobierno del documento: qué otros documentos gobierna o no reemplaza, y cuál es la regla a seguir si hay una discrepancia entre este documento y otro.

**Cuándo usarla:** siempre que el documento pudiera percibirse como una autoridad que reemplaza a otro documento fundacional o estratégico (por ejemplo, un documento que consolida contenido de varias fuentes debe aclarar que no sustituye a esas fuentes).

**Ejemplo real:** sección "Gobierno de Marca" de `BRAND_FOUNDATIONS.md`, que declara explícitamente que el documento no reemplaza la Carta del Fundador, el Libro, Visión 2030 ni la Arquitectura Empresarial, y cita la regla de discrepancia de `docs/enterprise/README.md`: "Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."

---

### 8. Documentos relacionados

Lista de lectura recomendada: documentos que complementan a este, aunque no sean una dependencia estricta de metadatos. A diferencia del campo "Documentos de los que depende" de la sección de Metadata (que es una lista cerrada y estricta de fuentes), esta sección es una lista curada más amplia, pensada para orientar a un lector nuevo.

**Cuándo usarla:** cuando el documento se beneficia de señalar lecturas adicionales que no son estrictamente una fuente de la que dependa, sino contexto relacionado (por ejemplo, documentos históricos, glosarios, u otros documentos del mismo dominio).

---

### 9. Control de Cambios

Tabla obligatoria con, como mínimo, estas columnas:

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
| --- | --- | --- | --- | --- | --- |
| (número) | (fecha) | (Draft / En Elaboración / Activo / etc.) | (Pendiente / Aprobado por [rol], con fecha si corresponde) | (descripción de qué cambió en esa versión) | (qué documentos fundamentan esa versión) |

**Cuándo usarla:** siempre. Cada vez que el documento cambie de versión, se agrega una fila nueva; las filas anteriores no se editan ni se eliminan.

**Ejemplo real:** sección "Control de Cambios" de `BRAND_FOUNDATIONS.md` v1.1, que registra las versiones 1.0 y 1.1 con columna de Aprobación marcada como "Pendiente (CEO/fundador)" en ambos casos, dejando constancia de que ninguna versión tiene aprobación formal registrada todavía.

---

### 10. Historial de Gobierno

Tabla obligatoria con, como mínimo, estas columnas:

| Fecha | Acción | Responsable (rol asumido) | Resultado |
| --- | --- | --- | --- |
| (fecha) | (qué acción de gobierno se realizó: auditoría, consolidación, revisión, elevación a estándar, etc.) | (rol bajo el cual se realizó la acción, no necesariamente una persona) | (qué documento o entregable resultó de esa acción) |

**Diferencia con "Control de Cambios":** "Control de Cambios" registra versiones del documento mismo. "Historial de Gobierno" registra acciones de gobierno documental que afectaron a este documento, incluso si esas acciones no se originaron en el documento (por ejemplo, una auditoría general que después derivó en una revisión de este documento específico).

**Cuándo usarla:** siempre. Es la sección que permite reconstruir, con el tiempo, la cadena completa de decisiones de gobierno que llevaron al estado actual del documento.

**Ejemplo real:** sección "Historial de Gobierno" de `BRAND_FOUNDATIONS.md` v1.1, con 4 filas que van desde la auditoría general de gobierno documental (2026-08-02) hasta la elevación de `BRAND_FOUNDATIONS.md` al estándar definido por esta misma plantilla (2026-08-05).

---

## Niveles de Gobierno Documental reconocidos

Estos niveles fueron identificados originalmente en `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` (§8), y se listan aquí de forma consolidada para que todo documento nuevo pueda declarar su nivel en la sección de Metadata sin tener que consultar el audit original:

1. **Fundacionales** — documentos de origen, no derivados de ningún otro (ej. Carta del Fundador).
2. **Estratégicos** — documentos que definen dirección de negocio de largo plazo (ej. Visión 2030, Digital Asset Register).
3. **De decisión operativa** — documentos que registran decisiones concretas de producto o ingeniería (ej. Decision Log).
4. **De referencia técnica** — documentos que describen arquitectura o implementación técnica.
5. **Históricos / inmutables** — documentos que registran un momento pasado y no deben editarse retroactivamente.
6. **Placeholders** — documentos declarados pero aún sin contenido sustantivo.
7. **Fundacional derivado** — nivel añadido durante la revisión de gobierno de `BRAND_FOUNDATIONS.md`: documentos que no son un origen primario, pero consolidan y resumen contenido de una o más fuentes Fundacionales y/o Estratégicas, sin reemplazarlas. `BRAND_FOUNDATIONS.md` es, hasta la fecha, el primer y único documento clasificado en este nivel.

Todo documento estratégico nuevo debe declarar cuál de estos 7 niveles le corresponde. Si un documento no encaja claramente en ninguno, corresponde revisar si se trata de un nuevo nivel aún no reconocido, y de ser así, agregarlo a esta lista antes de continuar.

---

## Aplicación de esta plantilla

Esta plantilla es de aplicación **obligatoria** para todo documento nuevo o revisado en los dominios: Enterprise, Brand, Product, Strategy, Architecture, Governance, Design System.

No es de aplicación obligatoria para: documentos históricos/inmutables ya cerrados (no deben reestructurarse retroactivamente), placeholders sin contenido sustantivo todavía, ni documentación puramente técnica de implementación (ADRs, RFCs, backlog) cuyo formato ya está definido por convenciones propias de esas carpetas.

Ante cualquier duda sobre si un documento debe seguir esta plantilla, el criterio es: si el documento pretende ser una fuente de verdad estratégica que otras personas del equipo consultarán de forma recurrente, debe seguir esta plantilla.

---

## Relación con el repositorio

Esta plantilla no reemplaza el contenido de ningún documento existente. No modifica `docs/design/brand/BRAND_FOUNDATIONS.md`, ni la Arquitectura Empresarial, ni ningún documento de estrategia o producto. Su función es exclusivamente normativa sobre la forma, no sobre el fondo.

Ante una discrepancia entre esta plantilla y la estructura real de un documento ya publicado, corresponde revisar dicho documento y actualizarlo para alinearlo con esta plantilla en su próxima revisión de gobierno — no alterar retroactivamente su contenido conceptual.

---

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
| --- | --- | --- | --- | --- | --- |
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación de la plantilla, a partir de la revisión de gobierno documental aplicada a `BRAND_FOUNDATIONS.md` v1.1. Define la estructura obligatoria de 10 secciones para documentos estratégicos de Enterprise, Brand, Product, Strategy, Architecture y Governance. | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1, `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`, `docs/enterprise/README.md`, `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`, `docs/enterprise/BUSINESS_SERVICES.md` |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Incorporación formal de **Design System** (`docs/design-system/`) como dominio de primera clase, en las cuatro menciones de dominios reconocidos de esta plantilla (Propósito, Alcance, campo "Dominio" de Metadata, y "Aplicación de esta plantilla"). Cambio realizado como parte del Sprint DG.001 — Design System Governance, para cerrar la observación ya señalada en `docs/design/system/DESIGN_SYSTEM.md` v1.0 (nota de gobierno documental) sobre la ausencia de ese dominio en esta lista. No se modificó ninguna otra regla de gobierno, estructura de secciones ni nivel de gobierno reconocido. | `docs/design/system/DESIGN_SYSTEM.md` v1.0 (nota de gobierno documental); `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0; `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0 |

---

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
| --- | --- | --- | --- |
| 2026-08-02 | Auditoría de Gobierno Documental general | Enterprise Documentation Architect | `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Consolidación de identidad de marca | Chief Brand Officer / Corporate Historian / Document Architect | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.0 |
| 2026-08-05 | Revisión de gobierno documental | Enterprise Documentation Architect | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1 |
| 2026-08-05 | Elevación a estándar documental de repositorio | Enterprise Documentation Architect | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 (este documento) |
| 2026-08-05 | Sprint DG.001 — Design System Governance: incorporación formal del dominio Design System | Enterprise Documentation Architect / Design Governance Architect | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1 (este documento); `docs/design/system/README.md` v1.0; `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0 |

**Nota:** ninguna versión de este documento ni de `BRAND_FOUNDATIONS.md` tiene, a la fecha, una aprobación formal registrada por el CEO o fundador. Esta plantilla se entrega en estado Activo porque define un estándar de forma, no una decisión de fondo; su adopción efectiva como estándar obligatorio queda sujeta a ratificación por quien corresponda.
