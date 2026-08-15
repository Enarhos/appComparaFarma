# DESIGN_TOKEN_ARCHITECTURE — Especificación Oficial de la Arquitectura de Design Tokens de ComparaFarma

Este documento no define ningún Design Token. No crea variables. No escribe JSON. No define nombres de tokens. No establece valores. No implementa ningún Design Token. Es la **especificación oficial de la arquitectura de Design Tokens**: qué capas la componen, qué responsabilidad tiene cada una, y qué reglas gobiernan su evolución para que la traducción entre las Foundations ya gobernadas y cualquier implementación futura del producto sea consistente, escalable e independiente de cualquier tecnología. Debe seguir siendo válido aunque ComparaFarma cambie por completo de tecnología, porque no gobierna esa implementación: gobierna la arquitectura bajo la que cualquier implementación de tokens deberá construirse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-TOK-001 |
| **Nombre** | DESIGN_TOKEN_ARCHITECTURE.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que ya definió conceptualmente el rol de los Design Tokens (§4.4) sin desarrollar su arquitectura interna, y de las seis Foundations ya gobernadas: `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` (dominio `docs/design-system/`) y `docs/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` (dominio `docs/brand/`) |
| **Clasificación** | Documento de Arquitectura de Design System / Puente Foundations–Implementación |
| **Fuente Oficial** | Este documento es la fuente oficial de la **arquitectura de capas de los Design Tokens** (Foundation, Semantic, Component y Pattern Tokens) y de su gobierno de evolución. No es fuente de ningún token concreto, variable, valor, nombre o archivo de implementación (no creados) |
| **Documentos de los que depende** | `docs/design-system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design-system/README.md`, `docs/brand/BRAND_GUIDELINES.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `docs/brand/COLOR_SYSTEM.md`, `docs/brand/ICONOGRAPHY_SYSTEM.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura implementación concreta de Design Tokens (nombres, valores, formato de archivo, independientemente de la tecnología elegida) y condicionar cualquier futuro catálogo de componentes vivo ya anticipado en `docs/design-system/DESIGN_SYSTEM.md` §4.5 |
| **Pregunta que responde** | ¿Cómo debe gobernarse la arquitectura de Design Tokens para garantizar consistencia, escalabilidad, independencia tecnológica y evolución controlada del producto? |

---

## 2. Propósito

`docs/design-system/DESIGN_SYSTEM.md` §4.4 ya identificó el rol arquitectónico de los Design Tokens dentro de la arquitectura de capas del Design System (Foundations → Design Tokens → Componentes → Patrones → Plantillas → Pantallas → Aplicaciones): son "la capa que traduce cada Foundation en un valor nombrado, reutilizable y versionado, que un componente puede consumir sin necesidad de conocer la decisión de marca subyacente". Ese mismo documento declaró, con la misma disciplina de transparencia aplicada en todo el dominio, que no crea, nombra ni enumera ningún token — solo define su rol arquitectónico general.

Este documento desarrolla ese rol general en una arquitectura propia, sin contradecirlo ni redefinirlo: los Design Tokens no son una capa plana, sino un conjunto de responsabilidades internas distintas (§4.2) que deben mantenerse separadas para que la traducción entre una decisión de marca y un valor de implementación siga siendo trazable, sostenible y reversible. Un Design Token, en cualquiera de sus capas internas, **representa una decisión de diseño ya tomada en otro documento — nunca una implementación tecnológica en sí misma.** Esta distinción es la razón de ser de este documento: sin ella, la propiedad ya exigida en `DESIGN_SYSTEM.md` §4.4 (que un componente pueda seguir siendo válido aunque cambie por completo su implementación) no podría sostenerse en la práctica.

---

## 3. Alcance

**Este documento define:**

- Los principios que debe cumplir la arquitectura de Design Tokens, derivados sin invención de la documentación ya existente (§4.1).
- Las capas conceptuales que componen la arquitectura de Tokens — Foundation, Semantic, Component y Pattern Tokens — y la responsabilidad de cada una, sin nombrar ni crear ningún token (§4.2).
- Cómo los Tokens heredan decisiones ya gobernadas por cada Foundation (Spacing, Grid, Elevation, Typography, Color, Iconography), sin duplicar ninguno de esos documentos (§4.3).
- Por qué los Tokens representan decisiones de diseño independientes de cualquier tecnología de implementación (§4.4).
- Cómo deben incorporarse, mantenerse compatibles y deprecarse los Tokens a lo largo del tiempo (§4.5).
- Cómo se aprueban y registran las decisiones de arquitectura de Tokens (§4.6).
- La relación entre la capa de Tokens y las capas de Componentes y Patrones ya definidas en `docs/design-system/DESIGN_SYSTEM.md` (§4.7).

**Este documento NO define:**

- Ningún Design Token concreto, nombre, variable o valor. No crea, no nombra ni enumera ningún token.
- Ningún archivo de configuración concreto ni ningún formato de implementación específico.
- Ninguna variable de ningún lenguaje de programación, ningún recurso nativo de ninguna plataforma, ningún token de ninguna herramienta de diseño, ni ninguna tecnología o framework específico de implementación. Este documento no menciona tecnología porque no la gobierna — gobierna la arquitectura que cualquier tecnología deberá implementar.
- Ningún componente, patrón, pantalla o archivo de diseño concreto. Corresponde íntegramente a `docs/design-system/DESIGN_SYSTEM.md` §4.5 y §4.6, y a un futuro catálogo de componentes vivo, que este documento no sustituye.
- Ninguna decisión de identidad, principio visual o valor de marca ya gobernado en `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas que integra, ni ninguna Foundation ya gobernada en `docs/design-system/`. Este documento no las reinterpreta ni las duplica — define únicamente cómo se traducen, en capas, hacia una implementación.
- La arquitectura general de capas del Design System (Foundations → Tokens → Componentes → Patrones → Plantillas → Pantallas → Aplicaciones). Pertenece íntegramente a `docs/design-system/DESIGN_SYSTEM.md` §4.1; este documento desarrolla en detalle un único eslabón de esa cadena, sin redefinir los demás.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de `docs/design-system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` y `docs/brand/BRAND_GUIDELINES.md`. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica a la arquitectura de Tokens |
|---|---|---|
| Consistencia | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Ninguna plataforma puede resolver la traducción de una misma Foundation con un Token distinto sin registrar esa decisión como extensión formal del sistema (§4.6) |
| Simplicidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | La arquitectura de Tokens debe resolverse con el menor número de capas internas necesarias — por eso son cuatro, no más (§4.2) |
| Reutilización | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Ningún Token nuevo se crea sin antes evaluar si un Token ya existente, en cualquiera de las cuatro capas, resuelve la misma necesidad (§4.6) |
| Accesibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2, §4.7 | La cadena de herencia arquitectónica que sostiene la accesibilidad del Design System depende, en el nivel más concreto, de que ningún Componente pueda construirse al margen del Token que le corresponde (§4.7) |
| Escalabilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | La arquitectura de capas de Tokens debe sostener nuevas plataformas o Foundations sin rediseñarse (§4.3) |
| Mantenibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Es la condición que permite que un cambio en una Foundation se propague mediante sus Tokens sin exigir cambios en cada Componente que los consume (§4.5) |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7 | Quinta aplicación transversal del mismo principio, extendida aquí a la capa de Tokens: ningún Token puede codificar, por su nombre o su estructura, una posición o un tratamiento privilegiado para una farmacia específica — la neutralidad ya exigida en la estructura (Grid) y en la prioridad perceptual (Elevation) debe sostenerse también en la capa que las traduce a un valor reutilizable |
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 (*"BRAND_GUIDELINES.md gobierna la identidad. El futuro Design System gobernará la implementación del producto"*) | Fundamenta por qué ningún Token puede redefinir una decisión de marca: un Token solo puede traducir una decisión ya tomada en `docs/brand/`, nunca tomarla en su lugar |

### 4.2 Arquitectura de Tokens

Cuatro capas conceptuales. Ninguna se resuelve con un nombre, un valor o un formato de archivo concreto; cada una define solo su responsabilidad dentro de la traducción entre una Foundation y una implementación.

#### 4.2.1 Foundation Tokens

La capa de traducción más directa: un Foundation Token representa, uno a uno, una responsabilidad ya definida por una única Foundation — una capa de `SPACING_SYSTEM.md` §4.2, una capa de `GRID_SYSTEM.md` §4.2, un nivel de `ELEVATION_SYSTEM.md` §4.2, una capa de `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.2, una responsabilidad de `docs/brand/COLOR_SYSTEM.md` §4.2, o una categoría de `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.2. Un Foundation Token no combina ni interpreta más de una Foundation a la vez: es la traducción más literal posible, sin agregar significado adicional.

#### 4.2.2 Semantic Tokens

La capa que asigna un significado funcional, dentro de un contexto de uso del producto, a uno o más Foundation Tokens — por ejemplo, la diferencia entre "un valor de color" y "el valor de color que representa una alerta crítica". Un Semantic Token traduce el **para qué** antes que **qué valor concreto**, y puede depender de más de un Foundation Token, pero nunca puede tomar una decisión de marca directamente sin pasar antes por la capa de Foundation Tokens — hacerlo rompería la cadena de herencia que sostiene la independencia tecnológica de este documento (§4.4).

#### 4.2.3 Component Tokens

La capa que aplica Semantic Tokens —o, cuando no exista una capa semántica pertinente para ese caso, Foundation Tokens directamente— a un Componente concreto, en el sentido ya definido en `docs/design-system/DESIGN_SYSTEM.md` §4.5 ("unidad mínima de interfaz reutilizable, construida exclusivamente a partir de Design Tokens"). Un Component Token es, de las cuatro capas, la más cercana a la implementación real, pero sigue siendo una decisión de diseño, no una variable de ningún lenguaje o herramienta concreta.

#### 4.2.4 Pattern Tokens

La capa que organiza cómo los Component Tokens de varios Componentes conviven dentro de un mismo Patrón, en el sentido ya definido en `docs/design-system/DESIGN_SYSTEM.md` §4.6 ("una combinación repetible de componentes que resuelve un problema de interacción recurrente del producto") — por ejemplo, la relación de Tokens entre los distintos Componentes que, juntos, forman la comparación de precios entre farmacias. Un Pattern Token no introduce ninguna responsabilidad nueva sobre las tres capas anteriores: solo coordina cómo esas capas se combinan de forma repetible en un Patrón, evitando que cada instancia de ese Patrón resuelva esa combinación de forma distinta.

**Regla de dependencia entre capas:** cada capa solo puede depender de la inmediatamente inferior — un Semantic Token puede depender de Foundation Tokens, un Component Token puede depender de Semantic o de Foundation Tokens, y un Pattern Token puede depender de Component Tokens. Ninguna capa puede tomar, por atajo, una decisión que le corresponde a otra — mismo principio de herencia arquitectónica ya declarado para el Design System completo en `docs/design-system/DESIGN_SYSTEM.md` §4.7.

### 4.3 Relación con Foundations

Sin duplicar ninguno de los seis documentos de Foundation, los Tokens heredan de cada uno la responsabilidad exacta que ese documento ya definió:

- **Spacing:** `docs/design-system/SPACING_SYSTEM.md` define cinco capas conceptuales (Micro, Component, Section, Layout, Page spacing) sin ninguna medida (§4.2). Ese mismo documento ya anticipó, en su §4.7, que "esa escala numérica es un Design Token: la traducción de esta Foundation a un valor concreto, no una decisión de la Foundation en sí misma". Este documento es la arquitectura que recibe esa traducción cuando exista.
- **Grid:** `docs/design-system/GRID_SYSTEM.md` define cinco capas estructurales (Estructura primaria, Regiones funcionales, Zonas de contenido, Alineación, Continuidad) sin columnas ni breakpoints (§4.2). Su §4.9 ya declaró que cualquier implementación futura "es un Design Token o una decisión de Componente/Patrón — nunca una decisión de esta Foundation".
- **Elevation:** `docs/design-system/ELEVATION_SYSTEM.md` define cinco capas de prioridad perceptual (Información base, contextual, prioritaria, crítica, Interrupciones excepcionales) sin ningún efecto visual (§4.2). Su §4.9 señala la futura "implementación concreta de efectos de jerarquía perceptual" como responsabilidad de la capa de Tokens.
- **Typography:** `docs/brand/TYPOGRAPHY_SYSTEM.md` define cinco capas tipográficas (Display, Heading, Body, Caption, Data/Numeric) sin elegir ninguna tipografía (§4.2). Cada capa deberá, en el futuro, traducirse a Foundation Tokens propios, sin que ese documento defina esa traducción.
- **Color:** `docs/brand/COLOR_SYSTEM.md` define siete capas funcionales del color (§4.2) sin definir ningún valor. `docs/design-system/DESIGN_SYSTEM.md` §4.4 ya usó esta Foundation como ejemplo del rol de los Tokens: "un componente no debe 'saber' qué color concreto representa el Color de Datos (`COLOR_SYSTEM.md` §4.2.7) — solo debe consumir el token que representa esa responsabilidad".
- **Iconography:** `docs/brand/ICONOGRAPHY_SYSTEM.md` define nueve categorías funcionales de íconos (§4.2) sin definir ningún ícono concreto. La arquitectura de Tokens no define íconos — solo organiza, en el futuro, cómo cada categoría se traduce a una referencia reutilizable por un Componente.

Ninguna de estas seis relaciones se resuelve en este documento: cada Foundation sigue siendo la única fuente de la responsabilidad que traduce; este documento define únicamente la arquitectura de capas (§4.2) que recibirá esa traducción cuando exista.

### 4.4 Independencia Tecnológica

Los Design Tokens, en cualquiera de sus cuatro capas, representan **decisiones de diseño ya tomadas** — nunca una implementación tecnológica en sí misma. Esta distinción ya está declarada, para la capa de Tokens en general, en `docs/design-system/DESIGN_SYSTEM.md` §4.4, que ya aclaró que los Tokens no son variables de ningún lenguaje de programación ni de ninguna herramienta de implementación específica, ni un archivo de configuración concreto de ningún tipo.

Esta arquitectura de capas puede implementarse, en el futuro, en cualquier tecnología, sin que ninguna de las cuatro capas conceptuales cambie por ello: cambiar la tecnología de implementación es un evento que ocurre por debajo de la arquitectura de Tokens, nunca dentro de ella. Es, precisamente, esta separación la que permite que `docs/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md` y `ELEVATION_SYSTEM.md` sigan siendo válidos aunque cambie por completo la tecnología del producto — criterio de éxito ya declarado, de forma independiente, en cada uno de esos seis documentos. Este documento adopta el mismo criterio para la capa que los traduce: debe seguir siendo válido aunque ComparaFarma cambie completamente de tecnología, porque gobierna la arquitectura de la traducción, no el resultado técnico de esa traducción.

### 4.5 Versionado

**Incorporación:** ningún Token nuevo, en cualquiera de las cuatro capas, puede incorporarse sin trazarse a la Foundation o al Token de capa inferior del que depende, o sin justificar formalmente por qué ninguna Foundation o Token ya existente cubre esa necesidad — mismo patrón "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y del Design System (`docs/brand/BRAND_ARCHITECTURE.md` §4.7, `ICONOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.9, `ELEVATION_SYSTEM.md` §4.9, `docs/design-system/DESIGN_SYSTEM.md` §4.8).

**Depreciación:** un Token no puede eliminarse mientras exista un Componente o Patrón que dependa de él, consecuencia directa de la cadena de herencia arquitectónica ya exigida en `docs/design-system/DESIGN_SYSTEM.md` §4.7. Un Token que deja de ser la traducción vigente de su Foundation debe marcarse como deprecado y conservarse trazable hasta que ninguna capa superior dependa de él — mismo principio de integridad histórica ya aplicado a las decisiones de arquitectura en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` §7 ("toda fila... debe marcarse como 'Reemplazado', nunca editarse ni eliminarse"), aplicado aquí por analogía directa a los Tokens en vez de a las decisiones que los originan.

**Compatibilidad:** un cambio en el valor subyacente de una Foundation nunca debería exigir un cambio en los Componentes que consumen sus Tokens — es, precisamente, la propiedad que la capa de Tokens existe para garantizar, ya declarada en `docs/design-system/DESIGN_SYSTEM.md` §4.4: "si la paleta cambia, solo deberían cambiar los tokens, nunca cada componente que los consume". Un cambio que rompe esa propiedad no es un problema de implementación — es una señal de que la arquitectura de capas de §4.2 no se respetó.

### 4.6 Gobierno de Evolución

**Cómo se aprueban cambios:** cualquier cambio en la arquitectura de Tokens —una capa nueva, una regla de dependencia distinta entre capas— debe evaluarse contra las cuatro capas ya definidas en §4.2 antes de aprobarse, siguiendo el mismo mecanismo de evaluación por capa inferior ya exigido para todo el Design System en `docs/design-system/DESIGN_SYSTEM.md` §4.8.

**Cómo se documentan:** toda decisión de arquitectura de Tokens —no un token concreto, sino una decisión sobre la arquitectura misma: una capa nueva, un cambio en la regla de dependencia entre capas, un criterio de depreciación distinto— debe registrarse en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`, mismo mecanismo ya abierto en el Sprint DG.001 — Design System Governance y ya declarado como obligatorio, para toda decisión de arquitectura de producto, en `docs/design-system/README.md` §4.5 (principio 3: *"ninguna decisión de arquitectura de producto es oficial sin registrarse en `DESIGN_SYSTEM_DECISION_LOG.md`"*).

**Nota de estado:** la definición misma de las cuatro capas de este documento (§4.2) es, en el sentido de ese principio, una decisión de arquitectura del dominio `docs/design-system/`. Esa decisión ya no está pendiente de registro: fue consolidada como DSG-002 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log (§7, §10).

### 4.7 Relación con Componentes

`docs/design-system/DESIGN_SYSTEM.md` §4.1 ya definió la cadena completa de capas del Design System:

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

Este documento no redefine esa cadena — desarrolla, en detalle, la estructura interna de un único eslabón: el que conecta Foundations con Componentes. Dentro de ese eslabón, las cuatro capas de §4.2 se insertan así:

```
Foundations (Spacing, Grid, Elevation, Typography, Color, Iconography)
   ↓
Foundation Tokens   → traducción directa de una Foundation
   ↓
Semantic Tokens     → significado funcional dentro de un contexto de uso
   ↓
Component Tokens    → aplicados al Componente ya definido en DESIGN_SYSTEM.md §4.5
   ↓
Pattern Tokens       → coordinación entre Componentes dentro de un Patrón ya definido en DESIGN_SYSTEM.md §4.6
   ↓
Componentes / Patrones (capas ya gobernadas por DESIGN_SYSTEM.md, no redefinidas aquí)
```

Un Componente, tal como ya lo exige `docs/design-system/DESIGN_SYSTEM.md` §4.5, debe construirse exclusivamente a partir de Tokens — nunca directamente desde una decisión de marca sin pasar por esta arquitectura. Este documento no crea, no diseña y no enumera ningún Componente ni Patrón: esa responsabilidad sigue perteneciendo íntegramente a `docs/design-system/DESIGN_SYSTEM.md` §4.5 y §4.6, y a un futuro catálogo de componentes vivo que ninguno de los dos documentos sustituye.

---

## 5. Relaciones

`DESIGN_TOKEN_ARCHITECTURE.md` depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que definió el rol arquitectónico general de los Design Tokens (§4.4) dentro de la cadena de capas del Design System (§4.1), sin desarrollar su arquitectura interna. Depende también de las tres Foundations del propio dominio `docs/design-system/` ya gobernadas (`SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`) y de las tres Foundations heredadas de `docs/brand/` (`TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`), cada una de las cuales ya anticipó, sin resolverla, la existencia de una futura capa de Tokens que tradujera sus decisiones (§4.3). Depende, por último, de `docs/brand/BRAND_GUIDELINES.md` §4.5, fuente directa de la frontera entre identidad y producto que fundamenta por qué ningún Token puede redefinir una decisión de marca (§4.1).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define las cuatro capas internas de la arquitectura de Tokens (Foundation, Semantic, Component, Pattern) ni la regla de dependencia entre ellas. Este documento tampoco resuelve, por su cuenta, ningún Token concreto, ninguna implementación técnica, ni la relación de este documento con `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` como una decisión ya registrada — ambas quedan señaladas como trabajo pendiente (§4.6, §7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Rol arquitectónico general de los Design Tokens | `docs/design-system/DESIGN_SYSTEM.md` §4.4 | ✔ — desarrollado en una arquitectura de cuatro capas (§4.2) | No contradice §4.4; lo desarrolla |
| Principios del Design System aplicables | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7 | ✔ — extendida a la capa de Tokens (§4.1) | Quinta aplicación transversal del mismo principio |
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 | ✔ — fundamenta §4.1 y §4.4 | — |
| Foundation de espaciado | `docs/design-system/SPACING_SYSTEM.md` | Referenciada, no duplicada (§4.3) | La escala numérica futura será un Foundation Token |
| Foundation de grid | `docs/design-system/GRID_SYSTEM.md` | Referenciada, no duplicada (§4.3) | — |
| Foundation de elevación | `docs/design-system/ELEVATION_SYSTEM.md` | Referenciada, no duplicada (§4.3) | — |
| Foundation tipográfica | `docs/brand/TYPOGRAPHY_SYSTEM.md` | Referenciada, no duplicada (§4.3) | — |
| Foundation de color | `docs/brand/COLOR_SYSTEM.md` | Referenciada, no duplicada (§4.3) | Ejemplo del Color de Datos ya citado en `DESIGN_SYSTEM.md` §4.4 |
| Foundation de iconografía | `docs/brand/ICONOGRAPHY_SYSTEM.md` | Referenciada, no duplicada (§4.3) | — |
| Concepto de Componente y de Patrón | `docs/design-system/DESIGN_SYSTEM.md` §4.5, §4.6 | Referenciados, no redefinidos (§4.7) | — |
| Patrón de evolución "trazar o justificar" | `docs/brand/BRAND_ARCHITECTURE.md` §4.7; `ICONOGRAPHY_SYSTEM.md` §4.7; `COLOR_SYSTEM.md` §4.6; `GRID_SYSTEM.md` §4.9; `ELEVATION_SYSTEM.md` §4.9; `DESIGN_SYSTEM.md` §4.8 | ✔ — aplicado a la incorporación de Tokens (§4.5) | Sexta aplicación del mismo patrón |
| Integridad histórica de decisiones ("Reemplazado", nunca eliminado) | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` §7 | ✔ — aplicado por analogía a la depreciación de Tokens (§4.5) | Analogía explícita, no una regla nueva del registro de decisiones |
| Registro de la decisión de arquitectura de esta capa de Tokens | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — registrado como DSG-002 | Sprint DG.002 — Consolidación del Design System Decision Log |
| Tokens concretos, nombres, valores, archivos de implementación | — (no existen todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |

---

## 7. Gobierno

`DESIGN_TOKEN_ARCHITECTURE.md` **no reemplaza**:

- `docs/design-system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System; este documento desarrolla en detalle un único eslabón de esa cadena (§4.7), sin redefinir los demás.
- `docs/design-system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` y `docs/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` — cada uno sigue siendo la única fuente de la responsabilidad de su propia Foundation; este documento no las duplica, solo define la arquitectura que recibirá su traducción (§4.3).
- `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- Ninguna futura implementación concreta de Design Tokens, independientemente de la tecnología o herramienta con la que se construya — cuando exista, deberá derivarse de la arquitectura aquí definida, no sustituirla.
- Ningún futuro catálogo de componentes vivo ni los componentes ya implementados en `mobile/` o `web/` — este documento no los redefine ni los reemplaza; gobierna la arquitectura de Tokens que deberían consumir, no el código que ya existe.

La responsabilidad específica de `DESIGN_TOKEN_ARCHITECTURE.md` dentro del Design System es gobernar exclusivamente la **arquitectura de capas de los Design Tokens**: Foundation, Semantic, Component y Pattern Tokens, la regla de dependencia entre ellas, y las reglas de versionado y evolución que permiten que esa arquitectura se mantenga estable sin importar qué tecnología la implemente. No gobierna, y no debe absorber en ninguna revisión futura, ningún token concreto, ninguna variable, ningún valor, ningún archivo de implementación ni ninguna tecnología — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque ComparaFarma cambie por completo de tecnología.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** La decisión de adoptar esta arquitectura de cuatro capas para los Design Tokens del dominio `docs/design-system/`, antes señalada como pendiente de registro, ya no lo está: fue consolidada como DSG-002 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log.

---

## 8. Documentos relacionados

- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/SPACING_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/ELEVATION_SYSTEM.md`
- `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design-system/README.md`
- `docs/brand/BRAND_GUIDELINES.md`
- `docs/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/brand/COLOR_SYSTEM.md`
- `docs/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura implementación concreta de Design Tokens (nombres, valores, formato de archivo, independientemente de la tecnología elegida), y el futuro catálogo de componentes vivo ya anticipado en `docs/design-system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint DS.3 — Design Token Architecture. Define la arquitectura oficial de Design Tokens de ComparaFarma: principios derivados sin invención (incluida una quinta aplicación transversal de Neutralidad), cuatro capas conceptuales (Foundation, Semantic, Component y Pattern Tokens) con su regla de dependencia entre capas, relación con las seis Foundations ya gobernadas sin duplicar ninguna, independencia tecnológica, reglas de versionado (incorporación, depreciación, compatibilidad), gobierno de evolución y su interacción con `DESIGN_SYSTEM_DECISION_LOG.md`, y relación con Componentes y Patrones ya definidos en `DESIGN_SYSTEM.md`. No crea tokens, variables, valores, JSON ni menciona tecnología de implementación. Señala, sin resolverlo por su cuenta, que la propia decisión de esta arquitectura de capas aún no tiene una fila registrada en `DESIGN_SYSTEM_DECISION_LOG.md`. | `docs/design-system/DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design-system/README.md` v1.0; `docs/brand/BRAND_GUIDELINES.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Se actualiza la referencia a la decisión de arquitectura de cuatro capas: ya no está pendiente de registro; fue consolidada como DSG-002 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design-system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio en la plantilla, README de dominio y cierre de referencias cruzadas pendientes | Enterprise Documentation Architect / Design Governance Architect | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design-system/README.md` v1.0; `docs/design-system/DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1 |
| 2026-08-05 | Sprint DS.3 — Design Token Architecture: definición de la arquitectura oficial de Design Tokens, como puente entre las Foundations ya gobernadas y una futura implementación técnica | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0 |
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-002 (arquitectura de cuatro capas de Design Tokens) | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1; `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de la decisión de adoptar esta arquitectura de cuatro capas ya no está pendiente: fue consolidado como DSG-002. Queda pendiente toda implementación concreta de Design Tokens que traduzca las seis Foundations ya gobernadas a un producto real.
