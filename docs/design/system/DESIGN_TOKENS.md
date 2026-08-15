# DESIGN_TOKENS — Catálogo Oficial de Design Tokens de ComparaFarma

Este documento no implementa ningún Design Token. No genera JSON. No genera archivos para ninguna herramienta de diseño. No genera variables de ningún lenguaje de programación. No genera ningún recurso nativo de ninguna plataforma. No define ningún valor visual concreto. Es el **catálogo oficial de Design Tokens**: qué familias de Tokens existen dentro de cada capa ya definida en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, cómo se organizan, bajo qué filosofía se nombrarán, y cómo evolucionarán con el tiempo. Debe seguir siendo válido aunque la implementación tecnológica cambie por completo, porque no gobierna esa implementación: gobierna qué debe existir en el catálogo, no cómo se construye técnicamente.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-TKC-001 |
| **Nombre** | DESIGN_TOKENS.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, que ya definió las cuatro capas de la arquitectura de Tokens (Foundation, Semantic, Component, Pattern) sin declarar qué familias las componen; y de las seis Foundations ya gobernadas (`SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`) |
| **Clasificación** | Documento de Arquitectura de Design System / Catálogo Oficial |
| **Fuente Oficial** | Este documento es la fuente oficial del **catálogo de familias de Design Tokens**: qué familias existen dentro de Foundation y Semantic Tokens, y qué criterio rige la declaración de Component y Pattern Tokens. No es fuente de ningún valor, variable, nombre final o archivo de implementación (no creados) |
| **Documentos de los que depende** | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design/system/README.md`, `docs/design/brand/BRAND_GUIDELINES.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `docs/design/DESIGN_BRIEF.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura implementación concreta de cada familia de Tokens (independientemente de la tecnología elegida) y el futuro catálogo de componentes vivo ya anticipado en `docs/design/system/DESIGN_SYSTEM.md` §4.5 |
| **Pregunta que responde** | ¿Cuál es el catálogo oficial de Design Tokens que implementará la arquitectura ya definida para ComparaFarma? |

---

## 2. Propósito

`docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` definió la arquitectura de capas de los Design Tokens —Foundation, Semantic, Component y Pattern Tokens (§4.2)— y la regla de dependencia entre ellas, sin declarar qué familias de Tokens componen esa arquitectura. Este documento es ese siguiente paso: el **catálogo oficial** de familias que existirán dentro de cada capa, para que cualquier implementación futura —independientemente de la tecnología que se elija— tenga una única fuente de verdad sobre qué debe existir, no solo sobre cómo debe organizarse.

Este documento no define ningún valor visual ni implementa ninguna tecnología. Una familia de Tokens, en el sentido de este documento, es una **decisión de organización ya tomada** —qué existe y por qué— nunca una decisión de diseño visual concreta —cómo se ve—. Esa segunda decisión seguirá perteneciendo, en el futuro, a quien implemente cada familia dentro de la arquitectura aquí catalogada.

---

## 3. Alcance

**Este documento define:**

- Los principios que debe cumplir el catálogo de Tokens, derivados sin invención de la documentación ya existente (§4.1).
- La estructura general del catálogo, organizada por las cuatro capas ya definidas en `DESIGN_TOKEN_ARCHITECTURE.md` §4.2 (§4.2).
- Las familias oficiales de Foundation Tokens, una por cada Foundation ya gobernada, sin definir ningún valor (§4.3).
- Las familias oficiales de Semantic Tokens, sin definir ningún valor ni implementación (§4.4).
- El criterio bajo el cual un futuro Componente podrá declarar sus propios Component Tokens sin romper esta arquitectura (§4.5).
- El criterio bajo el cual varios Component Tokens podrán coordinarse dentro de un Patrón (§4.6).
- La filosofía de convención de nombres, sin crear ningún nombre final (§4.7).
- Cómo nacen, evolucionan, se deprecian y mantienen compatibilidad los Tokens de este catálogo (§4.8).
- Cómo se aprueban y registran los cambios sobre este catálogo (§4.9).
- Cómo este catálogo puede implementarse en el futuro por Ingeniería, sin nombrar tecnología (§4.10).

**Este documento NO define:**

- Ningún valor visual concreto: ni píxeles, ni `rem`, ni códigos de color, ni ninguna medida.
- Ningún archivo JSON, variable de ningún lenguaje de programación, ni ningún recurso o formato propio de una tecnología de implementación específica.
- Ningún nombre final de Token. La convención de nombres (§4.7) es una filosofía, no un espacio de nombres real.
- Ningún componente ni patrón concreto. No enumera componentes; solo el criterio con el que un futuro componente podrá declarar sus propios Tokens (§4.5, §4.6).
- La arquitectura de capas de Tokens (Foundation, Semantic, Component, Pattern) ni la regla de dependencia entre ellas. Pertenece íntegramente a `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2; este documento la asume como ya resuelta y cataloga qué existe dentro de ella.
- Ninguna decisión de identidad, principio visual o Foundation ya gobernada en `docs/brand/` o `docs/design-system/`. Este documento no las reinterpreta ni las duplica — cataloga cómo se organizan sus Tokens, no sus responsabilidades ya definidas.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica al catálogo de Tokens |
|---|---|---|
| Consistencia | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | Ninguna familia de Tokens puede nombrarse u organizarse de forma distinta a las demás sin registrar esa decisión como extensión formal del catálogo (§4.9) |
| Simplicidad | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | El catálogo declara el menor número de familias necesario para cubrir las seis Foundations y los contextos funcionales del producto (§4.3, §4.4) |
| Reutilización | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | Ninguna familia nueva se declara sin evaluar antes si una familia ya catalogada resuelve la misma necesidad (§4.8) |
| Escalabilidad | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | El catálogo debe admitir familias nuevas sin reorganizar las ya declaradas (§4.8, §4.9) |
| Mantenibilidad | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | Es la condición que permite deprecar una familia sin romper los Componentes que ya dependen de ella (§4.8) |
| Independencia tecnológica | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.4 | Ninguna familia ni convención de nombre puede anticipar una tecnología de implementación específica (§4.7, §4.10) |
| Neutralidad | `docs/design/system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | Sexta aplicación transversal del mismo principio: ninguna familia semántica puede organizarse de forma que favorezca sistemáticamente a una farmacia sobre otra — desarrollado con especial énfasis en la familia "Comparison" (§4.4) |
| Frontera entre identidad y producto | `docs/design/brand/BRAND_GUIDELINES.md` §4.5 | Ninguna familia de este catálogo redefine una decisión de marca; cada familia de Foundation Tokens (§4.3) es una traducción, nunca una decisión nueva |

### 4.2 Catálogo Oficial de Tokens

`docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2 ya definió cuatro capas conceptuales y la regla de que cada capa solo puede depender de la inmediatamente inferior. Este documento no reabre esa arquitectura — cataloga qué existe dentro de dos de sus capas (Foundation y Semantic, que son compartidas y centrales para todo el producto) y declara el criterio de declaración de las otras dos (Component y Pattern, que por su propia naturaleza nacen junto con cada Componente y cada Patrón, todavía no creados):

| Capa | Qué cataloga este documento |
|---|---|
| Foundation Tokens | Seis familias oficiales, una por cada Foundation ya gobernada (§4.3) |
| Semantic Tokens | Diez familias oficiales, agrupadas por el contexto funcional que representan dentro del producto (§4.4) |
| Component Tokens | No se enumera ninguna (no existen Componentes todavía) — se declara el criterio de declaración (§4.5) |
| Pattern Tokens | No se enumera ninguno (no existen Patrones todavía) — se declara el criterio de coordinación (§4.6) |

### 4.3 Foundation Tokens

Seis familias oficiales, en correspondencia uno a uno con las seis Foundations ya gobernadas — ninguna familia combina más de una Foundation a la vez, consistente con la regla ya declarada en `DESIGN_TOKEN_ARCHITECTURE.md` §4.2.1. Este documento declara la existencia de cada familia y su responsabilidad; ninguna incluye un valor.

| Familia | Responsabilidad | Foundation que traduce |
|---|---|---|
| Spacing | Traducir cada una de las cinco capas conceptuales de espacio (Micro, Component, Section, Layout, Page spacing) a un valor nombrado y reutilizable | `docs/design/system/SPACING_SYSTEM.md` §4.2 |
| Grid | Traducir cada una de las cinco capas conceptuales de estructura (Estructura primaria, Regiones funcionales, Zonas de contenido, Alineación, Continuidad) | `docs/design/system/GRID_SYSTEM.md` §4.2 |
| Elevation | Traducir cada uno de los cinco niveles de prioridad perceptual (Información base, contextual, prioritaria, crítica, Interrupciones excepcionales) | `docs/design/system/ELEVATION_SYSTEM.md` §4.2 |
| Typography | Traducir cada una de las cinco capas tipográficas (Display, Heading, Body, Caption, Data/Numeric) | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.2 |
| Color | Traducir cada una de las siete capas funcionales del color | `docs/design/brand/COLOR_SYSTEM.md` §4.2 |
| Iconography | Traducir cada una de las nueve categorías funcionales de iconografía | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` §4.2 |

Ninguna de estas seis familias define, en este documento, cuántos Tokens individuales contendrá ni qué nombre tendrá cada uno — eso pertenece a una implementación futura, no a este catálogo.

### 4.4 Semantic Tokens

Diez familias oficiales, cada una agrupando Tokens que comparten un mismo contexto funcional de uso dentro del producto, sin definir ningún valor ni implementación. Cada familia se apoya en una necesidad ya identificada en la documentación existente — ninguna es una invención de este documento:

| Familia | Contexto funcional | Fundamento |
|---|---|---|
| Surface | Superficies de interfaz: fondos y contenedores sobre los que se organiza el contenido | Capa "Fondo" de `docs/design/brand/COLOR_SYSTEM.md` §4.2; Zonas de contenido de `docs/design/system/GRID_SYSTEM.md` §4.2.3 |
| Content | Contenido textual e icónico que ocupa una superficie | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.2; `docs/design/brand/ICONOGRAPHY_SYSTEM.md` §4.2 |
| Border | Separación visual entre superficies o zonas ya posicionadas | Alineación de `docs/design/system/GRID_SYSTEM.md` §4.2.4; Component spacing de `docs/design/system/SPACING_SYSTEM.md` §4.2.2 |
| Feedback | Respuesta visual a una acción o a un cambio de estado del sistema | Capa "Semántico" de `docs/design/brand/COLOR_SYSTEM.md` §4.2; distinción entre urgencia funcional y artificial de `docs/design/DESIGN_BRIEF.md` §4.10 |
| Interactive | Elementos que responden a una acción directa de la persona | Accesibilidad de espacio entre elementos interactivos de `docs/design/system/SPACING_SYSTEM.md` §4.6; Color de Énfasis de `docs/design/brand/COLOR_SYSTEM.md` §4.2.5 |
| Navigation | Orientación estructural dentro del producto | Región funcional de Navegación de `docs/design/system/GRID_SYSTEM.md` §4.3; concepto central "Orientación" (`docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001) |
| Data | Valores numéricos y de datos del producto (precios, cantidades, fechas) | Capa Data/Numeric de `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.2; capa "Datos" de `docs/design/brand/COLOR_SYSTEM.md` §4.2.7, ya citada como ejemplo del rol de los Tokens en `docs/design/system/DESIGN_SYSTEM.md` §4.4 |
| Comparison | Presentación de opciones equivalentes entre farmacias dentro de una misma comparación | Neutralidad ya aplicada en `docs/design/system/GRID_SYSTEM.md` §4.8, `SPACING_SYSTEM.md` §4.2.3, `docs/design/brand/COLOR_SYSTEM.md` §4.5 y `docs/design/system/ELEVATION_SYSTEM.md` §4.7 — la familia donde más aplicaciones de Neutralidad convergen, y por eso la que exige mayor disciplina de uso uniforme |
| Alert | Alertas de precio y alertas sanitarias | Información crítica de `docs/design/system/ELEVATION_SYSTEM.md` §4.2.4; restricción contra urgencia agresiva de `docs/design/DESIGN_BRIEF.md` §4.10 |
| Status | Estado de un dato o de una condición del producto (disponibilidad, vigencia de un precio) | Información contextual y prioritaria de `docs/design/system/ELEVATION_SYSTEM.md` §4.2.2–4.2.3; campos ya existentes en el contrato de datos del producto (`hasStock`, `fetchedAt`, `CLAUDE.md`, raíz del repositorio) |

Ninguna familia semántica define, en este documento, de qué Foundation Tokens depende cada Token individual — esa relación (§4.2.2 de `DESIGN_TOKEN_ARCHITECTURE.md`) se resolverá cuando cada Token se declare formalmente, no en este catálogo.

### 4.5 Component Tokens

Este documento no enumera ningún Componente ni ningún Component Token — `docs/design/system/DESIGN_SYSTEM.md` §3 ya declara explícitamente que no existe todavía ningún Componente. El criterio de declaración, sin embargo, ya puede fijarse: cuando un Componente exista, podrá declarar sus propios Component Tokens siempre que cada uno pueda **trazarse** a una familia de Semantic Tokens ya catalogada en §4.4, o, cuando ninguna familia semántica sea pertinente para ese caso, directamente a una familia de Foundation Tokens ya catalogada en §4.3 — mismo patrón "trazar o justificar" ya aplicado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.5. Un Component Token que no pueda trazarse a ninguna de las dos capas de este catálogo no es un Component Token válido: es una señal de que falta una familia semántica o de Foundation por declarar, no una excepción a esta regla.

### 4.6 Pattern Tokens

Este documento no crea ningún Patrón concreto — `docs/design/system/DESIGN_SYSTEM.md` §3 declara igualmente que no existe todavía ningún Patrón. El criterio de coordinación es el ya declarado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.4: cuando un Patrón exista y varios Componentes deban compartir una misma relación de Tokens para funcionar como una unidad reconocible —el ejemplo ya anticipado es la comparación de precios entre farmacias—, esa relación entre los Component Tokens de esos Componentes es, precisamente, un Pattern Token. Un Pattern Token nunca introduce una familia nueva de Foundation o Semantic Tokens: solo coordina cómo las familias ya catalogadas en §4.3 y §4.4 se combinan de forma repetible.

### 4.7 Convención de Nombres

Una filosofía de nombres, no un espacio de nombres real. Ningún nombre declarado aquí es final.

- **Consistencia:** el mismo criterio de nombrar debe aplicarse por igual a las seis familias de Foundation Tokens (§4.3) y a las diez familias de Semantic Tokens (§4.4) — ninguna familia puede adoptar una convención propia que rompa el patrón que las demás ya siguen.
- **Jerarquía:** el nombre de un Token debe permitir identificar, solo con su lectura, en qué capa vive (Foundation, Semantic, Component o Pattern) y, dentro de Foundation o Semantic, a qué familia de las ya catalogadas pertenece — sin necesidad de abrir su definición para saberlo.
- **Semántica:** un nombre de Semantic, Component o Pattern Token debe describir su propósito funcional (qué representa dentro del producto), nunca su valor concreto — mismo principio ya establecido para la diferencia entre Foundation Tokens y Semantic Tokens en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.1–4.2.2. Un Foundation Token, al ser la traducción más literal de una Foundation, puede acercarse más a nombrar la propiedad que traduce, pero tampoco a nombrar su valor.
- **Independencia tecnológica:** ningún nombre puede anticipar una sintaxis, un prefijo o una convención propia de una tecnología de implementación específica — mismo criterio de independencia tecnológica ya declarado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.4.
- **Escalabilidad:** la filosofía de nombres debe admitir familias y capas nuevas sin exigir renombrar ninguna de las dieciséis familias ya catalogadas en §4.3 y §4.4 — mismo principio de Escalabilidad ya consolidado en `docs/design/system/DESIGN_SYSTEM.md` §4.2.

### 4.8 Versionado

**Cómo nacen los Tokens:** un Token individual nuevo dentro de una familia ya catalogada debe trazarse a esa familia. Una familia completamente nueva —de Foundation o de Semantic Tokens— exige un umbral más alto: debe justificarse formalmente por qué ninguna de las seis familias de Foundation Tokens (§4.3) ni de las diez familias de Semantic Tokens (§4.4) ya catalogadas cubre esa necesidad — mismo patrón "trazar o justificar" ya aplicado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.5.

**Cómo evolucionan:** una familia ya catalogada puede ampliarse con Tokens individuales nuevos sin que eso constituya, por sí mismo, un cambio de este catálogo — el catálogo declara familias, no el número de Tokens dentro de cada una. Un cambio en el número o el criterio interno de una familia sí debe registrarse (§4.9).

**Cómo se deprecian:** ninguna familia catalogada en §4.3 o §4.4 puede eliminarse mientras exista un Component Token o Pattern Token que dependa de ella —consecuencia directa de la cadena de herencia arquitectónica ya exigida en `docs/design/system/DESIGN_SYSTEM.md` §4.7—; debe marcarse como deprecada y conservarse trazable, mismo principio de integridad histórica ya aplicado por analogía en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.5 y, en origen, en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` §7.

**Cómo se mantienen compatibles:** una implementación que cambie el valor concreto de un Token dentro de una familia ya catalogada no debería exigir un cambio en los Componentes que lo consumen — la compatibilidad se sostiene si ningún Component Token ni Pattern Token depende directamente de un valor, sino siempre de la familia y del Token que lo traduce, mismo principio ya declarado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.5.

### 4.9 Gobierno de Evolución

**Quién aprueba cambios:** cualquier cambio sobre este catálogo —una familia nueva, una familia deprecada, un cambio en el criterio de una familia ya existente— corresponde al mismo propietario declarado en la Metadata de este documento (CEO/CTO), evaluado contra las familias ya catalogadas en §4.3 y §4.4 antes de aprobarse, siguiendo el mismo mecanismo de evaluación por capa inferior ya exigido en `docs/design/system/DESIGN_SYSTEM.md` §4.8 y en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.6.

**Cómo se registran los cambios:** toda decisión sobre este catálogo debe registrarse en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`, mismo mecanismo abierto en el Sprint DG.001 — Design System Governance y declarado obligatorio, para toda decisión de arquitectura de producto, en `docs/design/system/README.md` §4.5 (principio 3).

**Nota de estado:** la declaración misma de las seis familias de Foundation Tokens (§4.3), las diez familias de Semantic Tokens (§4.4) y la filosofía de convención de nombres (§4.7) constituye, en el sentido de ese mismo principio, una decisión de arquitectura del dominio `docs/design-system/`. Esas decisiones ya no están pendientes de registro: fueron consolidadas como DSG-003 (seis familias de Foundation Tokens) y DSG-004 (diez familias de Semantic Tokens y filosofía de naming) en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log (§7, §10).

### 4.10 Relación con Ingeniería

Sin nombrar tecnologías específicas: este catálogo podrá implementarse, en el futuro, mediante cualquier tecnología, sin que ninguna de sus familias cambie por ello — mismo criterio de independencia tecnológica ya declarado en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.4. Frontend Web y Frontend Mobile deberán consumir el mismo catálogo de familias, mismo criterio de no-fragmentación ya exigido en `docs/design/system/DESIGN_SYSTEM.md` §4.8 y §5.2 para Tokens y Componentes en general. QA deberá verificar que ningún Component Token o Pattern Token implementado se aparte de las familias aquí catalogadas, no solo que la interfaz "se vea bien" — mismo criterio ya declarado en `docs/design/system/DESIGN_SYSTEM.md` §5.2. Este documento no define el mecanismo técnico con el que cada plataforma implemente estas familias.

---

## 5. Relaciones

`DESIGN_TOKENS.md` depende directamente de `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, que definió las cuatro capas de la arquitectura de Tokens y la regla de dependencia entre ellas sin declarar qué familias las componen. Depende también de las seis Foundations ya gobernadas —tres del propio dominio `docs/design-system/` (`SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`) y tres heredadas de `docs/brand/` (`TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`)—, cuyas capas y responsabilidades ya definidas son la fuente directa de las seis familias de Foundation Tokens (§4.3). Depende de `docs/design/brand/BRAND_GUIDELINES.md` (frontera entre identidad y producto) y de `docs/design/DESIGN_BRIEF.md` (fundamento de varias familias semánticas, §4.4).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos declara el catálogo de familias de Tokens ni la filosofía de sus nombres. Este documento tampoco resuelve, por su cuenta, ningún Token individual, ningún Componente, ningún Patrón, ni el registro de sus propias decisiones de catálogo en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` — quedan señalados como trabajo pendiente (§4.9, §7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Arquitectura de capas de Tokens (Foundation, Semantic, Component, Pattern) | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2 | Asumida como ya resuelta, no reabierta (§4.2) | Este documento cataloga qué existe dentro de esa arquitectura |
| Principios del Design System y de la arquitectura de Tokens | `docs/design/system/DESIGN_SYSTEM.md` §4.2; `DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Neutralidad | `docs/design/system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKEN_ARCHITECTURE.md` §4.1 | ✔ — sexta aplicación, con énfasis en la familia "Comparison" (§4.1, §4.4) | — |
| Foundation de espaciado | `docs/design/system/SPACING_SYSTEM.md` §4.2 | ✔ — familia "Spacing" (§4.3) | — |
| Foundation de grid | `docs/design/system/GRID_SYSTEM.md` §4.2 | ✔ — familia "Grid" (§4.3) | — |
| Foundation de elevación | `docs/design/system/ELEVATION_SYSTEM.md` §4.2 | ✔ — familia "Elevation" (§4.3) | — |
| Foundation tipográfica | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.2 | ✔ — familia "Typography" (§4.3) | — |
| Foundation de color | `docs/design/brand/COLOR_SYSTEM.md` §4.2 | ✔ — familia "Color" (§4.3) | — |
| Foundation de iconografía | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` §4.2 | ✔ — familia "Iconography" (§4.3) | — |
| Densidad comparativa y jerarquía de la información | `docs/design/DESIGN_BRIEF.md` §4.11 | ✔ — fundamenta las familias "Comparison" y "Data" (§4.4) | — |
| Restricción contra urgencia agresiva | `docs/design/DESIGN_BRIEF.md` §4.10 | ✔ — fundamenta las familias "Feedback" y "Alert" (§4.4) | — |
| Concepto central "Orientación" | `docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001 | ✔ — fundamenta la familia "Navigation" (§4.4) | — |
| Contrato de datos (`hasStock`, `fetchedAt`, precio efectivo) | `CLAUDE.md` (raíz del repositorio) | ✔ — fundamenta la familia "Status" (§4.4) | Referencia técnica, ya citada por analogía en `COLOR_SYSTEM.md` §6 y `GRID_SYSTEM.md` §6 |
| Patrón de evolución "trazar o justificar" | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.5 | ✔ — aplicado a Component Tokens (§4.5) y a familias nuevas (§4.8) | — |
| Registro de decisiones de arquitectura del dominio | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — registrado como DSG-003 y DSG-004 | Sprint DG.002 — Consolidación del Design System Decision Log |
| Tokens individuales, valores, nombres finales, archivos de implementación | — (no existen todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |

---

## 7. Gobierno

`DESIGN_TOKENS.md` **no reemplaza**:

- `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` — sigue siendo la única fuente de la arquitectura de capas de Tokens y de la regla de dependencia entre ellas; este documento no la reinterpreta, cataloga lo que existe dentro de ella.
- `docs/design/system/DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` y `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` — cada uno sigue siendo la única fuente de su propia Foundation; este documento no las duplica, solo declara la familia de Tokens que las traducirá (§4.3).
- `docs/design/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- Ninguna futura implementación concreta de Tokens, independientemente de la tecnología o herramienta con la que se construya — cuando exista, deberá derivarse de este catálogo, no sustituirlo.
- Ningún futuro catálogo de componentes vivo ni los componentes ya implementados en `mobile/` o `web/` — este documento no los redefine; declara las familias de Tokens que deberían consumir.

La responsabilidad específica de `DESIGN_TOKENS.md` dentro del Design System es gobernar exclusivamente el **catálogo de familias de Design Tokens**: qué familias de Foundation y Semantic Tokens existen oficialmente, bajo qué criterio se declaran Component y Pattern Tokens, y bajo qué filosofía de nombres y reglas de versionado evoluciona ese catálogo. No gobierna, y no debe absorber en ninguna revisión futura, ningún Token individual, ningún valor, ningún nombre final ni ninguna tecnología de implementación — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque la implementación tecnológica cambie por completo.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** La decisión de adoptar oficialmente las seis familias de Foundation Tokens (§4.3), las diez familias de Semantic Tokens (§4.4) y la filosofía de convención de nombres (§4.7), antes señalada como pendiente de registro, ya no lo está: fue consolidada como DSG-003 y DSG-004 en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log.

---

## 8. Documentos relacionados

- `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`
- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/SPACING_SYSTEM.md`
- `docs/design/system/GRID_SYSTEM.md`
- `docs/design/system/ELEVATION_SYSTEM.md`
- `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design/system/README.md`
- `docs/design/brand/BRAND_GUIDELINES.md`
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/design/brand/COLOR_SYSTEM.md`
- `docs/design/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura implementación concreta de cada familia de Tokens (nombres, valores, formato de archivo, independientemente de la tecnología elegida), y el futuro catálogo de componentes vivo ya anticipado en `docs/design/system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint DS.4 — Design Tokens Specification. Define el catálogo oficial de Design Tokens de ComparaFarma: principios derivados sin invención (incluida una sexta aplicación transversal de Neutralidad), estructura del catálogo organizada por las cuatro capas ya definidas en `DESIGN_TOKEN_ARCHITECTURE.md`, seis familias oficiales de Foundation Tokens en correspondencia uno a uno con las seis Foundations ya gobernadas, diez familias oficiales de Semantic Tokens fundamentadas en la documentación existente, criterio de declaración de Component y Pattern Tokens sin enumerar ninguno, filosofía de convención de nombres sin nombres finales, reglas de versionado (nacimiento, evolución, depreciación, compatibilidad), gobierno de evolución y su interacción con `DESIGN_SYSTEM_DECISION_LOG.md`, y relación con Ingeniería sin nombrar tecnología. No crea valores, JSON, variables, nombres finales, componentes ni patrones. Señala, sin resolverlo por su cuenta, que la declaración de las dieciséis familias y de la filosofía de nombres aún no tiene una fila registrada en `DESIGN_SYSTEM_DECISION_LOG.md`. | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design/system/README.md` v1.0; `docs/design/brand/BRAND_GUIDELINES.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Se actualiza la referencia a las decisiones de arquitectura de este catálogo: ya no están pendientes de registro; fueron consolidadas como DSG-003 (Foundation Tokens) y DSG-004 (Semantic Tokens y filosofía de naming) en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio en la plantilla, README de dominio y cierre de referencias cruzadas pendientes | Enterprise Documentation Architect / Design Governance Architect | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design/system/README.md` v1.0; `docs/design/system/DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1 |
| 2026-08-05 | Sprint DS.3 — Design Token Architecture: definición de la arquitectura oficial de Design Tokens (Foundation, Semantic, Component, Pattern) | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0 |
| 2026-08-05 | Sprint DS.4 — Design Tokens Specification: definición del catálogo oficial de familias de Design Tokens | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design/system/DESIGN_TOKENS.md` v1.0 |
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-003 (Foundation Tokens) y DSG-004 (Semantic Tokens y filosofía de naming) | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1; `docs/design/system/DESIGN_TOKENS.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de las decisiones de arquitectura de este catálogo ya no está pendiente: fue consolidado como DSG-003 y DSG-004. Queda pendiente toda implementación concreta de Tokens individuales que traduzca este catálogo a un producto real.
