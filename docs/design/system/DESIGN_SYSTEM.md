# DESIGN_SYSTEM — Especificación Oficial del Design System de ComparaFarma

Este documento no es un catálogo de componentes. No es Storybook. No es una guía de estilos. No define botones, pantallas ni archivos de Figma. Es la **especificación oficial de la arquitectura del Design System**: qué capas lo componen, qué responsabilidad tiene cada una, y qué reglas gobiernan su evolución para que el producto de ComparaFarma —en cualquier plataforma, presente o futura— se construya de forma consistente, escalable y mantenible. Debe seguir siendo válido aunque cambie por completo la tecnología utilizada por el producto, porque no gobierna esa tecnología: gobierna la arquitectura bajo la que cualquier tecnología deberá implementarse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

**Nota de gobierno documental:** `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (§"Aplicación de esta plantilla") declara su uso obligatorio para los dominios "Enterprise, Brand, Product, Strategy, Architecture, Governance". El dominio `docs/design-system/`, creado por este documento, no está listado explícitamente entre esos seis. Este documento se clasifica bajo esta plantilla por extensión directa de su propio criterio declarado (*"si el documento pretende ser una fuente de verdad estratégica que otras personas del equipo consultarán de forma recurrente, debe seguir esta plantilla"*), y se deja registrada aquí la recomendación de que una futura revisión de gobierno documental incorpore "Design System" a esa lista de dominios reconocidos.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-SPC-001 |
| **Nombre** | DESIGN_SYSTEM.md |
| **Dominio** | Design System (`docs/design-system/`) — dominio nuevo, creado por este documento |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Product Design Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende íntegramente de `docs/brand/BRAND_GUIDELINES.md` (que integra los cuatro sistemas de identidad) y del contexto de producto multiplataforma ya declarado en `docs/product/PRODUCT_DEFINITION_v1.0.md`; es el primer documento del dominio `docs/design-system/`, sin documentos Fundacionales propios distintos de los ya heredados de `docs/brand/` |
| **Clasificación** | Documento de Arquitectura de Design System |
| **Fuente Oficial** | Este documento es la fuente oficial de la **arquitectura del Design System**. No es fuente de identidad de marca (`docs/brand/`), ni de ningún componente, token, pantalla o implementación técnica concreta (no creados) |
| **Documentos de los que depende** | `docs/brand/BRAND_GUIDELINES.md`, `docs/brand/LOGO_SYSTEM.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `docs/brand/ICONOGRAPHY_SYSTEM.md`, `docs/brand/COLOR_SYSTEM.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/product/PRODUCT_DEFINITION_v1.0.md`, `docs/product/PRODUCT_PRINCIPLES.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar el futuro catálogo de componentes implementado (Storybook u otra herramienta equivalente), los archivos de diseño (Figma u otra herramienta equivalente) y cualquier decisión de arquitectura de interfaz en `mobile/` y `web/` |
| **Pregunta que responde** | ¿Cómo debe gobernarse el sistema de diseño del producto para garantizar consistencia, escalabilidad y mantenibilidad en todas las plataformas de ComparaFarma? |

---

## 2. Propósito

Toda la Arquitectura de Marca ya consolidada —`BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `BRAND_GUIDELINES.md`— gobierna **qué es** la identidad de ComparaFarma y **cómo deben convivir** sus sistemas entre sí. Ninguno de esos documentos, por diseño y por mandato explícito de su propio alcance, decide cómo esa identidad se convierte en un producto real que funciona en una pantalla — `docs/brand/BRAND_GUIDELINES.md` §4.5 ya declara esa frontera de forma explícita: *"BRAND_GUIDELINES.md gobierna la identidad. El futuro Design System gobernará la implementación del producto."*

Este documento es ese Design System anticipado. Su rol es el de **puente**: recibe una identidad de marca ya gobernada y la traduce, capa por capa, hasta convertirla en la base arquitectónica de un producto multiplataforma consistente — sin redefinir la identidad que recibe, y sin descender hasta el nivel de una implementación concreta.

---

## 3. Alcance

**Este documento define:**

- La arquitectura por capas del Design System, desde las Foundations hasta las Aplicaciones (§4.1).
- Los principios que debe cumplir cualquier implementación futura, derivados sin invención de la documentación ya existente (§4.2).
- La responsabilidad de las Foundations, sin desarrollarlas (§4.3).
- Qué son y qué responsabilidad tienen los Design Tokens, sin crear ninguno (§4.4).
- El concepto de Componente, sin diseñar ninguno (§4.5).
- La diferencia entre Componente, Patrón y Pantalla (§4.6).
- Cómo el Design System garantiza accesibilidad desde su arquitectura, sin métricas concretas (§4.7).
- Cómo evoluciona el sistema: aprobación de cambios, registro, y prevención de fragmentación entre plataformas (§4.8).

**Este documento NO define:**

- Ningún componente, botón, pantalla, patrón de interacción o archivo de diseño concreto.
- Ningún Design Token, variable, valor de espaciado, grid o especificación de implementación técnica.
- Ninguna tecnología, framework o herramienta específica de implementación.
- Un catálogo de componentes vivo (Storybook u otra herramienta equivalente) — este documento no lo sustituye; ese catálogo, cuando exista, deberá derivarse de la arquitectura aquí definida.
- Archivos de diseño (Figma u otra herramienta equivalente) — este documento no los sustituye ni los reemplaza como espacio de trabajo de diseño.
- Ninguna decisión de identidad, principios visuales o sistemas de marca ya gobernados en `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas que integra. Este documento no los reinterpreta ni los duplica — los implementa, en el sentido arquitectónico definido en §2.

---

## 4. Contenido principal

### 4.1 Arquitectura del Design System

Una arquitectura de capas, no una lista de entregables. Cada capa depende exclusivamente de la inmediatamente inferior, y ninguna capa puede tomar una decisión que le corresponde a otra.

```
Foundations
   ↓
Design Tokens
   ↓
Componentes
   ↓
Patrones
   ↓
Plantillas
   ↓
Pantallas
   ↓
Aplicaciones
```

- **Foundations** — la base compartida derivada de la Arquitectura de Marca (§4.3).
- **Design Tokens** — la traducción de cada Foundation a un valor nombrado y reutilizable (§4.4).
- **Componentes** — las unidades mínimas de interfaz reutilizables, construidas exclusivamente a partir de tokens (§4.5).
- **Patrones** — combinaciones repetibles de componentes que resuelven un problema de interacción recurrente del producto (§4.6).
- **Plantillas** — estructuras de composición de patrones y componentes para un tipo de pantalla recurrente, sin contenido real.
- **Pantallas** — la instancia real, con datos reales, de una o más plantillas en un momento específico del producto.
- **Aplicaciones** — el producto completo (mobile, web, y cualquier superficie futura) como composición coherente de todas las capas anteriores.

Este documento gobierna con detalle las cuatro primeras capas (§4.3 a §4.6), porque son las capas reutilizables y compartidas entre plataformas. Plantillas, Pantallas y Aplicaciones son, por definición, específicas de cada contexto de producto — su gobierno de contenido corresponde a la implementación de `mobile/` y `web/`, no a este documento; lo que este documento exige es que esas tres capas se construyan exclusivamente a partir de las cuatro anteriores, nunca al margen de ellas.

### 4.2 Principios del Sistema

Consolidados sin agregar ninguno nuevo, desde `docs/brand/BRAND_GUIDELINES.md`, `VISUAL_IDENTITY.md` y la documentación de producto ya existente.

| Principio | Fuente | Aplicación específica al Design System |
|---|---|---|
| Consistencia | `docs/brand/BRAND_ARCHITECTURE.md` §4.1 (Branded House); `BRAND_GUIDELINES.md` §4.2 ("ningún sistema reemplaza a otro") | Ninguna plataforma puede resolver una necesidad de interfaz de forma distinta a las demás sin registrar esa decisión como extensión formal del sistema (§4.8) |
| Simplicidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2 | Cada capa (§4.1) tiene una responsabilidad única y no redundante |
| Reutilización | `docs/brand/BRAND_ARCHITECTURE.md` §4.7 ("todo producto nuevo debe trazarse a una capacidad ya existente... o justificar la creación de una nueva"); `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` ("las capacidades empresariales permanecen estables mientras productos y tecnologías evolucionan") | Mismo principio aplicado por analogía a componentes y patrones: ningún componente nuevo se crea sin antes evaluar si un componente ya existente resuelve la misma necesidad (§4.8) |
| Accesibilidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2; heredado explícitamente de `TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4 e `ICONOGRAPHY_SYSTEM.md` §4.6 | Desarrollado íntegramente en §4.7 |
| Escalabilidad | `docs/product/PRODUCT_PRINCIPLES.md`, Principio 9 ("Escalabilidad"), citado en `BRAND_FOUNDATIONS.md` §11.2; `docs/design/DESIGN_BRIEF.md` §4.13 (criterio de evaluación, 12%) | El sistema debe soportar nuevas plataformas o productos (`BRAND_ARCHITECTURE.md` §4.3) sin rediseñar sus capas base |
| Mantenibilidad | Derivado de `docs/product/PRODUCT_PRINCIPLES.md`, Principio 10 ("Mejora continua"), y del Principio Inmutable X ya consolidado en `BRAND_FOUNDATIONS.md` §11.1 ("la mejora continua antes que la complacencia") | Un sistema mantenible es la condición práctica que permite mejora continua sin reconstrucción constante — fundamenta la arquitectura de capas de §4.1 |

### 4.3 Foundations

Las Foundations son la base compartida de la que dependen todas las capas superiores. Este documento no las desarrolla — cada una ya tiene, o debería tener, su propio documento de gobierno:

| Foundation | Responsabilidad | Dónde se gobierna |
|---|---|---|
| Tipografía | Arquitectura de capas tipográficas y criterios de selección | `docs/brand/TYPOGRAPHY_SYSTEM.md` — ya vigente |
| Color | Responsabilidades funcionales del color y disciplina de neutralidad | `docs/brand/COLOR_SYSTEM.md` — ya vigente |
| Iconografía | Categorías funcionales y principios de construcción de íconos | `docs/brand/ICONOGRAPHY_SYSTEM.md` — ya vigente |
| Espaciado | Sistema de medidas relativas que ordena la composición de cualquier interfaz | No gobernado todavía por ningún documento — vacío de la Arquitectura de Marca, pendiente de definición |
| Grids | Estructura de columnas y alineación que organiza la composición entre componentes | No gobernado todavía por ningún documento — mismo vacío |
| Elevación | Sistema de profundidad visual (qué elemento se percibe "por encima" de otro) | No gobernado todavía por ningún documento — mismo vacío |
| Motion | Principios de movimiento aplicables a transiciones de interfaz | Parcialmente gobernado: `docs/brand/LOGO_SYSTEM.md` §4.8 ya define principios de motion para el isotipo (continuidad, suavidad, economía de movimiento, consistencia); este Design System hereda esos mismos principios como Foundation de motion del producto, sin repetirlos ni crear una filosofía de movimiento distinta |

La responsabilidad de este documento respecto a las Foundations no es definir su contenido, sino garantizar que ninguna capa superior (Tokens, Componentes, Patrones) tome una decisión que le corresponde a una Foundation — y señalar, con la misma disciplina de transparencia ya aplicada en el resto del repositorio, qué Foundations siguen sin gobierno propio (espaciado, grids, elevación).

### 4.4 Design Tokens

**Qué son:** la capa que traduce cada Foundation en un valor nombrado, reutilizable y versionado, que un componente puede consumir sin necesidad de conocer la decisión de marca subyacente. Un componente no debe "saber" qué color concreto representa el Color de Datos (`docs/brand/COLOR_SYSTEM.md` §4.2.7) — solo debe consumir el token que representa esa responsabilidad.

**Qué responsabilidad tienen:** ser el único punto de traducción entre una decisión de marca (abstracta, gobernada en `docs/brand/`) y un valor concreto de implementación. Esta es, precisamente, la propiedad que permite que `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` y `COLOR_SYSTEM.md` sigan siendo válidos aunque cambie por completo su implementación (criterio de éxito ya declarado en cada uno de esos cuatro documentos): si la paleta cambia, solo deberían cambiar los tokens, nunca cada componente que los consume.

**Qué NO son:** no son valores de marca en sí mismos — esos viven exclusivamente en `docs/brand/`. No son variables de ningún lenguaje de programación ni de ninguna herramienta de implementación específica. No son un archivo JSON, CSS o de configuración concreto. Este documento no crea, nombra ni enumera ningún token — solo define su rol arquitectónico dentro del sistema.

### 4.5 Componentes

Un componente es una unidad mínima de interfaz reutilizable, construida exclusivamente a partir de Design Tokens — nunca directamente desde una decisión de marca sin pasar por esa capa de traducción. Es la primera capa de la arquitectura donde una decisión de marca se vuelve efectivamente usable por un producto real.

Este documento no crea, no diseña y no enumera ningún componente. Esa responsabilidad pertenece a un futuro catálogo de componentes implementado (Storybook u otra herramienta equivalente), que este documento no sustituye ni pretende reemplazar — solo exige que, cuando ese catálogo exista, cada componente pueda trazarse a los tokens de los que depende (§4.8).

### 4.6 Patrones

La diferencia entre Componente, Patrón y Pantalla es de alcance y de reutilización, no de jerarquía visual:

- **Componente:** una unidad mínima aislada, sin contexto de uso propio (por ejemplo, un campo de entrada de texto).
- **Patrón:** una combinación repetible de componentes que resuelve un problema de interacción recurrente del producto — reutilizable en más de un lugar, pero sin contenido real ni contexto específico de un momento concreto del producto (por ejemplo, la forma en que se presenta una comparación de precios entre farmacias, independientemente de qué medicamento se esté consultando).
- **Pantalla:** la instancia real, con datos reales, de uno o más patrones compuestos para un momento específico del producto (por ejemplo, la pantalla de resultados para una búsqueda concreta).

El Design System gobierna Componentes y Patrones como capas reutilizables y compartidas entre plataformas. Las Pantallas son responsabilidad de la implementación de producto — este documento no las gobierna, solo exige que se construyan exclusivamente a partir de Patrones y Componentes ya existentes, sin introducir una composición paralela no registrada.

### 4.7 Accesibilidad

El Design System no trata la accesibilidad como una verificación posterior a la implementación: la garantiza **desde su propia arquitectura**. Cada Foundation ya declara sus propios requisitos de accesibilidad en su documento de origen (`TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `ICONOGRAPHY_SYSTEM.md` §4.6) — la accesibilidad del sistema completo se sostiene si, y solo si, ningún Token, Componente o Patrón puede construirse al margen de la Foundation de la que depende.

Esto tiene una consecuencia arquitectónica directa: un componente que no consuma correctamente los tokens de contraste ya definidos no es simplemente "menos accesible" — está mal construido, porque rompe la cadena de herencia que esta arquitectura exige. De la misma manera, el principio de redundancia visual ya declarado en `docs/brand/COLOR_SYSTEM.md` §4.4 ("todo significado cromático crítico debe poder entenderse igual de bien si el color se elimina por completo") se hereda aquí como regla arquitectónica: ningún Patrón puede comunicar un significado exclusivamente a través de una sola Foundation si las Foundations de las que depende ya exigen redundancia entre ellas.

### 4.8 Gobierno de Evolución

**Cómo se aprueban cambios:** cualquier cambio de capa —una Foundation nueva, un Token nuevo, un Componente nuevo, un Patrón nuevo— debe evaluarse contra la capa inmediatamente inferior de la que depende antes de aprobarse. Un Componente nuevo no puede aprobarse si no puede trazarse a Tokens ya existentes, o si no justifica formalmente la necesidad de un Token nuevo — mismo patrón de evolución "trazar o justificar" ya aplicado en `docs/brand/BRAND_ARCHITECTURE.md` §4.7, `ICONOGRAPHY_SYSTEM.md` §4.7 y `COLOR_SYSTEM.md` §4.6.

**Cómo se evita la fragmentación:** ninguna plataforma (mobile, web, o cualquier superficie futura) puede resolver una necesidad de implementación creando un Componente o Patrón paralelo que no exista en el resto de plataformas, sin registrar esa decisión como una extensión formal del sistema. Bajo el modelo Branded House ya confirmado (`docs/brand/BRAND_ARCHITECTURE.md` §4.1: un solo nombre cubre empresa, plataforma y canales), un producto de marca única exige, por extensión lógica directa, un sistema de diseño único — no una implementación distinta por plataforma que solo coincide por casualidad.

**Cómo se registran los cambios:** el dominio `docs/design/` (decisiones de identidad de marca) registra sus decisiones en `docs/design/DESIGN_DECISION_LOG.md`; el dominio `docs/design-system/` (decisiones de arquitectura de producto) registra las suyas en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`, abierto en el Sprint DG.001 — Design System Governance. Ninguna Foundation, Token, Componente o Patrón nuevo puede considerarse una decisión oficial del sistema sin la fila correspondiente en ese registro.

---

## 5. Relaciones

### 5.1 Relación con la Arquitectura de Marca

**`BRAND_GUIDELINES.md` gobierna la identidad. Este documento gobierna el producto.** Esta frontera no es una decisión nueva de este documento: ya está declarada de forma explícita y reciproca en `docs/brand/BRAND_GUIDELINES.md` §4.5 (*"BRAND_GUIDELINES.md gobierna la identidad. El futuro Design System gobernará la implementación del producto"*) y en la sección de Alcance de cada uno de los cuatro sistemas de identidad (`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`), que declaran, cada uno, que no definen componentes de interfaz.

Este documento no duplica responsabilidades con ninguno de esos ocho documentos: no redefine ningún principio de marca, ninguna capa tipográfica, ninguna categoría de iconografía ni ninguna responsabilidad de color. Define, exclusivamente, el mecanismo arquitectónico por el cual esas decisiones ya gobernadas se traducen en Tokens, Componentes y Patrones — la traducción, no el contenido traducido.

### 5.2 Relación con Ingeniería

Sin nombrar tecnologías específicas, este documento debe convivir con las siguientes disciplinas de la siguiente manera:

- **Frontend Web:** consumidor de Tokens y Componentes para construir Patrones y Pantallas del canal web ya confirmado (`docs/brand/VISUAL_IDENTITY.md` §4.5).
- **Frontend Mobile:** consumidor de los mismos Tokens y Componentes que el Frontend Web — mismo sistema, canal distinto. El Design System exige que ambas plataformas consuman la misma fuente de Tokens para evitar la fragmentación ya señalada en §4.8, sin que este documento especifique el mecanismo técnico con el que cada plataforma los implemente.
- **Backend:** no consume directamente las Foundations visuales, pero es responsable de exponer los datos del producto (por ejemplo, canales de precio y disponibilidad, ya definidos en el contrato de datos de la plataforma) en una forma que los Patrones y Componentes puedan representar sin necesidad de lógica de presentación adicional del lado del backend — la responsabilidad de presentación pertenece íntegramente al Design System.
- **QA:** responsable de verificar que una implementación real respete la cadena de herencia arquitectónica definida en §4.7 y §4.8 — no solo que una interfaz "se vea bien", sino que cada Componente use los Tokens correctos y que ninguna plataforma introduzca una variación paralela no registrada.
- **Documentación:** el propio repositorio de documentación es, en la medida en que decida adoptar estas Foundations, un consumidor más del Design System — este documento no lo exige, solo señala la coherencia deseable de que el propio proceso de documentación del proyecto sea consistente con el sistema que gobierna.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 | ✔ — este documento es el Design System anticipado por esa frontera (§2) | — |
| Principios de marca aplicables al Design System | `docs/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` | ✔ — consolidados en §4.2 | Ningún principio nuevo agregado |
| Principios de producto (Escalabilidad, Mejora continua) | `docs/product/PRODUCT_PRINCIPLES.md` | ✔ — fundamentan Escalabilidad y Mantenibilidad (§4.2) | — |
| Modelo de marca única (Branded House) | `docs/brand/BRAND_ARCHITECTURE.md` §4.1 | ✔ — fundamenta Consistencia (§4.2) y prevención de fragmentación (§4.8) | — |
| Arquitectura tipográfica | `docs/brand/TYPOGRAPHY_SYSTEM.md` | Referenciada como Foundation (§4.3) | No se duplica su contenido |
| Arquitectura del color | `docs/brand/COLOR_SYSTEM.md` | Referenciada como Foundation (§4.3); principio de redundancia heredado en §4.7 | No se duplica su contenido |
| Arquitectura de iconografía | `docs/brand/ICONOGRAPHY_SYSTEM.md` | Referenciada como Foundation (§4.3) | No se duplica su contenido |
| Principios de motion del isotipo | `docs/brand/LOGO_SYSTEM.md` §4.8 | ✔ — heredados como Foundation de motion del producto (§4.3) | No se crea una filosofía de movimiento distinta |
| Espaciado, grids, elevación | — (no existe documento de gobierno todavía) | No consolidado — declarado explícitamente como vacío (§4.3) | Pendiente de definición futura |
| Registro de decisiones de arquitectura de producto | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — creado en el Sprint DG.001 — Design System Governance | Vacío cerrado; ver §4.8 |
| Componentes, tokens, patrones concretos | — (no existe implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |

---

## 7. Gobierno

`DESIGN_SYSTEM.md` **no reemplaza**:

- `docs/brand/BRAND_GUIDELINES.md` — sigue siendo la única fuente de gobierno de convivencia entre los cuatro sistemas de identidad.
- `docs/brand/LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md` — siguen siendo la única fuente de arquitectura de cada Foundation correspondiente.
- Ningún futuro catálogo de componentes vivo (Storybook u otra herramienta equivalente) ni ningún archivo de diseño (Figma u otra herramienta equivalente) — ambos, cuando existan, deberán derivarse de la arquitectura aquí definida, no sustituirla.
- Los componentes ya implementados en `mobile/` o `web/` — este documento no los redefine ni los reemplaza; gobierna la arquitectura que deberían seguir, no el código que ya existe.

La responsabilidad específica de `DESIGN_SYSTEM.md` dentro de la Arquitectura de Marca es gobernar exclusivamente la **arquitectura de capas del Design System**: Foundations, Design Tokens, Componentes y Patrones como capas reutilizables y compartidas entre plataformas, los principios que debe cumplir cualquier implementación, y las reglas de evolución que evitan la fragmentación entre `mobile/` y `web/`. No gobierna, y no debe absorber en ninguna revisión futura, ningún componente, token o patrón concreto, ninguna pantalla, ninguna tecnología de implementación —esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambie por completo la tecnología utilizada por el producto.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Este documento hereda, y no resuelve por sí mismo, los pendientes de gobierno ya señalados en sus fuentes (los cuatro ajustes de `docs/design/BRAND_IDENTITY_VALIDATION.md` y el registro incompleto de `docs/design/DESIGN_DECISION_LOG.md`). El registro de decisiones de arquitectura de producto propio de este dominio, en cambio, ya no está pendiente: se abrió en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` como parte del Sprint DG.001 — Design System Governance.

---

## 8. Documentos relacionados

- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/brand/BRAND_ARCHITECTURE.md`
- `docs/brand/VISUAL_IDENTITY.md`
- `docs/brand/LOGO_SYSTEM.md`
- `docs/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/brand/COLOR_SYSTEM.md`
- `docs/brand/BRAND_GUIDELINES.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/design/DESIGN_DECISION_LOG.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`
- `docs/design-system/SPACING_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/ELEVATION_SYSTEM.md`
- `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design-system/README.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: un futuro catálogo de componentes vivo, y toda decisión concreta de Design Tokens, Componentes o Patrones que se registre en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la arquitectura oficial del Design System de ComparaFarma: arquitectura de siete capas (Foundations, Design Tokens, Componentes, Patrones, Plantillas, Pantallas, Aplicaciones), principios derivados sin invención, responsabilidad de las Foundations (señalando espaciado/grids/elevación como vacíos pendientes), concepto de Design Token, diferencia entre Componente/Patrón/Pantalla, accesibilidad garantizada por herencia arquitectónica, gobierno de evolución y prevención de fragmentación entre plataformas, frontera explícita con `BRAND_GUIDELINES.md` y relación con Ingeniería. No crea componentes, tokens, pantallas ni menciona tecnología de implementación. Crea el dominio `docs/design-system/` y señala su ausencia en la lista de dominios reconocidos por `GOVERNED_DOCUMENT_TEMPLATE.md`. | `docs/brand/BRAND_GUIDELINES.md` v1.0; `LOGO_SYSTEM.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `docs/product/PRODUCT_PRINCIPLES.md` |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.001 — Design System Governance. Se cierran las tres deudas de gobierno señaladas en v1.0: (1) se actualiza la referencia al registro de decisiones, ahora existente en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`; (2) "Design System" queda incorporado formalmente a `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; (3) espaciado, grid y elevación ya cuentan con documento de Foundation propio (`SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`). No se modificó ningún contenido arquitectónico de la arquitectura de capas ni de los principios ya definidos en v1.0. | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design-system/README.md` v1.0; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Integración de los cuatro sistemas de identidad bajo un único gobierno de convivencia | Brand Architect / Brand Governance Director / Enterprise Documentation Architect | `docs/brand/BRAND_GUIDELINES.md` v1.0 |
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Apertura del Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio en la plantilla, README de dominio y cierre de referencias cruzadas pendientes | Enterprise Documentation Architect / Design Governance Architect | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design-system/README.md` v1.0; `docs/design-system/DESIGN_SYSTEM.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de decisiones, el reconocimiento del dominio y el README ya no están pendientes a partir de esta versión.
