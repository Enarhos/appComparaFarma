# PATTERNS — Especificación Oficial de la Capa de Patrones del Design System de ComparaFarma

Este documento no diseña ninguna pantalla. No crea wireframes, journeys ni flujos concretos. No define ningún layout. No crea ningún componente ni ninguna navegación. No implementa UX. Es la **especificación oficial de la capa de Patrones**: qué niveles conceptuales existen, qué cadena de dependencia obligatoria deben respetar, en qué familias se clasifican, y qué reglas gobiernan su evolución para que múltiples componentes colaboren de forma consistente, reutilizable y escalable ante problemas de interacción recurrentes. Debe seguir siendo válido aunque el producto cambie por completo de tecnología o de interfaz, porque no gobierna esa implementación: gobierna la arquitectura bajo la que cualquier Patrón real deberá construirse.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-PAT-001 |
| **Nombre** | PATTERNS.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / UX Architect / Interaction Design Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design/system/DESIGN_SYSTEM.md` (que ya definió el concepto de Patrón, §4.6, sin desarrollar una arquitectura interna de niveles) y de `docs/design/system/COMPONENT_LIBRARY.md` (que ya definió la Component Library que este documento consume, sin definir cómo varios componentes colaboran entre sí) |
| **Clasificación** | Documento de Arquitectura de Design System / Puente Componentes–Pantallas |
| **Fuente Oficial** | Este documento es la fuente oficial de la **arquitectura de la capa de Patrones**: sus niveles conceptuales (Interaction, Domain, Flow Patterns), su cadena de dependencia obligatoria, y sus familias de clasificación. No es fuente de ningún Patrón concreto, wireframe, journey, flujo, layout o componente (no creados) |
| **Documentos de los que depende** | `docs/design/system/DESIGN_SYSTEM.md`, `COMPONENT_LIBRARY.md`, `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design/system/README.md`, `docs/design/brand/BRAND_GUIDELINES.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/DESIGN_BRIEF.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura implementación concreta de Patrones reales (independientemente de la tecnología o interfaz elegida) y condicionar a un futuro `SCREEN_TEMPLATES.md`, todavía no creado, en su relación con los Patrones que combine |
| **Pregunta que responde** | ¿Cómo debe gobernarse la capa de Patrones para que el producto resuelva necesidades recurrentes de manera consistente, reutilizable y escalable? |

---

## 2. Propósito

`docs/design/system/DESIGN_SYSTEM.md` §4.6 ya definió qué es un Patrón, y lo distinguió con precisión de un Componente y de una Pantalla: "una combinación repetible de componentes que resuelve un problema de interacción recurrente del producto — reutilizable en más de un lugar, pero sin contenido real ni contexto específico de un momento concreto del producto." Ese mismo documento declaró que el Design System gobierna Patrones como capa reutilizable y compartida entre plataformas, sin crear ninguno — deja esa responsabilidad a la implementación de producto.

Este documento desarrolla, sin reinterpretarla, esa definición ya dada: un Patrón **no es** un Componente (que carece de contexto de uso propio, `COMPONENT_LIBRARY.md` §4.2), **no es** una Pantalla (que ya tiene datos reales de un momento concreto) y **no es** un Flujo completo (una secuencia de Pantallas que resuelve un objetivo de la persona, referenciado sin gobernarse en `COMPONENT_LIBRARY.md` §4.5). Un Patrón es, exclusivamente, la solución reutilizable a un problema de interacción que se repite a través del producto — este documento gobierna cómo debe organizarse esa capa antes de que exista un solo Patrón real.

---

## 3. Alcance

**Este documento define:**

- Los principios que debe cumplir la arquitectura de la capa de Patrones, derivados sin invención de la documentación ya existente (§4.1).
- Los niveles conceptuales de Patrón — Interaction, Domain y Flow Patterns — y el propósito de cada uno, sin describir ningún ejemplo concreto (§4.2).
- La cadena de dependencia obligatoria desde las Foundations hasta el Patrón, formalizando que ningún Patrón consume Tokens directamente (§4.3).
- Las familias de clasificación de Patrones, sin crear ningún Patrón específico ni hablar de pantallas (§4.4).
- La relación entre Patrón, Pantalla y Flujo, sin crear ninguna pantalla (§4.5).
- El principio de Neutralidad aplicado a la capa de Patrones (§4.6).
- Cómo un Patrón hereda accesibilidad desde las capas inferiores, sin métricas concretas (§4.7).
- Cómo nace un Patrón, cómo evoluciona, cómo se depreca y cómo mantiene compatibilidad, aplicando nuevamente el patrón "trazar o justificar" (§4.8).
- Cómo se aprueban y registran los cambios sobre esta arquitectura, y cómo se relaciona con `COMPONENT_LIBRARY.md`, con un futuro `SCREEN_TEMPLATES.md` y con `DESIGN_SYSTEM_DECISION_LOG.md` (§4.9).

**Este documento NO define:**

- Ningún Patrón concreto, wireframe, journey o flujo real.
- Ninguna pantalla, plantilla de pantalla ni layout.
- Ninguna navegación concreta ni ningún componente. Pertenece íntegramente a `docs/design/system/COMPONENT_LIBRARY.md`, que este documento consume sin duplicar.
- Ningún código, ninguna tecnología de implementación ni ningún framework de interfaz.
- Ningún Design Token individual ni familia de Tokens. Pertenece íntegramente a `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md`; este documento asume ese catálogo, y la Component Library que lo consume, como ya resueltos.
- Ninguna decisión de identidad, Foundation o principio ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento no los reinterpreta ni los duplica — define únicamente cómo los Patrones deben heredarlos a través de los Componentes que combinan.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica a la capa de Patrones |
|---|---|---|
| Consistencia | `docs/design/system/DESIGN_SYSTEM.md` §4.2 | Ninguna plataforma puede resolver el mismo problema de interacción recurrente con un Patrón distinto sin registrar esa decisión como extensión formal del sistema (§4.8) |
| Simplicidad | `docs/design/system/DESIGN_SYSTEM.md` §4.2 | La arquitectura de Patrones se resuelve con el menor número de niveles conceptuales necesario — por eso son tres, no más (§4.2) |
| Reutilización | `docs/design/system/DESIGN_SYSTEM.md` §4.2, §4.6 | Es, para la capa de Patrones, la razón de ser misma de la capa: un Patrón que no se reutiliza en más de un lugar no cumple su propia definición (§2) |
| Accesibilidad | `docs/design/system/DESIGN_SYSTEM.md` §4.2, §4.7 | Desarrollado íntegramente en §4.7: un Patrón hereda accesibilidad, no la define por su cuenta |
| Escalabilidad | `docs/design/system/DESIGN_SYSTEM.md` §4.2 | Los tres niveles conceptuales deben sostener nuevas plataformas o necesidades de producto sin rediseñarse (§4.2) |
| Mantenibilidad | `docs/design/system/DESIGN_SYSTEM.md` §4.2 | Permite deprecar un Patrón sin romper las Pantallas que dependan de él (§4.8) |
| Neutralidad | `docs/design/system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1 (sexta aplicación); `COMPONENT_LIBRARY.md` §4.1 (séptima aplicación) | Octava aplicación transversal del mismo principio, extendida aquí a la capa de Patrones — desarrollado íntegramente en §4.6 |
| Orientación | Concepto central de diseño (`docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001); ya aplicado espacialmente en `GRID_SYSTEM.md` §4.3 y perceptualmente en `ELEVATION_SYSTEM.md` §4.1 | Aplicado aquí a la organización repetible de la experiencia entre Pantallas: un Flow Pattern consistente es, para una secuencia de Pantallas, lo que la Continuidad estructural es para una sola Pantalla |
| Frontera entre identidad y producto | `docs/design/brand/BRAND_GUIDELINES.md` §4.5 | Ningún Patrón redefine una decisión de marca; solo combina Componentes que ya la traducen (§4.3) |
| Herencia arquitectónica por capas | `docs/design/system/DESIGN_SYSTEM.md` §4.1, §4.7; `docs/design/system/COMPONENT_LIBRARY.md` §4.3 | Fundamenta directamente la cadena de dependencia obligatoria de §4.3: ninguna capa puede tomar una decisión que le corresponde a otra |

### 4.2 Arquitectura de Patrones

Tres niveles conceptuales. Ninguno describe un ejemplo concreto; cada uno define solo su responsabilidad dentro de la reutilización de la experiencia.

#### 4.2.1 Interaction Patterns

El nivel más elemental de Patrón: resuelve un problema de interacción recurrente entre un conjunto acotado de Componentes, sin incorporar todavía un concepto propio del dominio de ComparaFarma ni una secuencia entre Pantallas. Es la aplicación más directa de la definición ya dada en `docs/design/system/DESIGN_SYSTEM.md` §4.6 — una combinación repetible de Componentes, en el sentido más literal posible, sin ningún significado de negocio agregado.

#### 4.2.2 Domain Patterns

Un Patrón que resuelve un problema de interacción recurrente incorporando explícitamente un concepto propio del dominio de ComparaFarma, de la misma forma en que un Domain Component incorpora semántica de dominio dentro de la Component Library (`COMPONENT_LIBRARY.md` §4.2.3). Un Domain Pattern se construye a partir de uno o más Interaction Patterns y/o de Componentes en cualquiera de sus tres niveles, pero sigue sin definir todavía una secuencia entre Pantallas.

#### 4.2.3 Flow Patterns

Un Patrón que resuelve un problema de interacción recurrente que solo puede completarse a través de una secuencia de Pantallas. Es el nivel donde esta arquitectura empieza a relacionarse con el concepto de Flujo, ya referenciado sin gobernarse en `docs/design/system/COMPONENT_LIBRARY.md` §4.5. Un Flow Pattern no es, por sí mismo, un Flujo real con Pantallas concretas y datos reales — es el patrón repetible que cualquier Flujo real de ese tipo deberá seguir, de la misma forma en que un Patrón nunca es, por sí mismo, una Pantalla (`docs/design/system/DESIGN_SYSTEM.md` §4.6).

**Regla de composición entre niveles:** un Domain Pattern solo puede construirse a partir de Interaction Patterns y/o Componentes; un Flow Pattern solo puede construirse a partir de Interaction y/o Domain Patterns y/o Componentes. Ningún nivel puede depender de un nivel superior al suyo — mismo principio de herencia unidireccional ya exigido entre los niveles de Componente en `docs/design/system/COMPONENT_LIBRARY.md` §4.2 y entre las capas de Tokens en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.

### 4.3 Cadena Arquitectónica

`docs/design/system/COMPONENT_LIBRARY.md` §4.3 ya formalizó la cadena de dependencia hasta el Componente. Este documento la extiende un eslabón más, hasta el Patrón:

```
Foundations (Spacing, Grid, Elevation, Typography, Color, Iconography)
   ↓
Foundation Tokens
   ↓
Semantic Tokens
   ↓
Component Tokens
   ↓
Componentes (Primitive → Composite → Domain)
   ↓
Patrones (Interaction → Domain → Flow)
```

**Ningún Patrón puede consumir Tokens directamente. Todo Patrón consume Componentes.** Esta regla no contradice la existencia de los Pattern Tokens ya definidos en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.4: un Pattern Token no es consumido por el Patrón en sí — coordina cómo los Component Tokens de los distintos Componentes que ese Patrón combina conviven entre sí, dentro de cada Componente. El Patrón sigue consumiendo, siempre, Componentes; nunca una Foundation, un Foundation Token, un Semantic Token o un Component Token de forma directa, ni siquiera a través de la capa de Tokens que lleva su nombre. Consumir cualquier capa distinta a Componentes rompe la cadena de herencia arquitectónica ya exigida en `docs/design/system/DESIGN_SYSTEM.md` §4.7, y es, por definición, un Patrón mal construido dentro de esta arquitectura, no una excepción válida.

### 4.4 Clasificación de Patrones

Familias conceptuales, no Patrones concretos. Ninguna familia describe una pantalla; cada una agrupa Patrones —en cualquiera de los tres niveles de §4.2— que resuelven un mismo tipo de problema recurrente de la persona:

| Familia | Problema recurrente que resuelve | Fundamento |
|---|---|---|
| Descubrimiento | Ayudar a la persona a encontrar información relevante dentro del producto | Región funcional de Búsqueda (`docs/design/system/GRID_SYSTEM.md` §4.3); familia de componentes "Entrada" (`COMPONENT_LIBRARY.md` §4.4) |
| Comparación | Organizar la evaluación simultánea de múltiples opciones equivalentes | Región funcional de Comparación (`GRID_SYSTEM.md` §4.3); familia semántica "Comparison" (`DESIGN_TOKENS.md` §4.4); familia de componentes "Comparación" (`COMPONENT_LIBRARY.md` §4.4) — misma disciplina de Neutralidad desarrollada en §4.6 |
| Decisión | Ayudar a la persona a elegir entre opciones ya comparadas | Propuesta de valor de decidir "en pocos segundos" (`docs/design/brand/BRAND_FOUNDATIONS.md` §14); prohibición de manipular la decisión de la persona (§15, §18), ya aplicada en `docs/design/system/ELEVATION_SYSTEM.md` §4.3 |
| Confirmación | Comunicar que una acción de la persona se completó correctamente | Familia semántica "Feedback" (`DESIGN_TOKENS.md` §4.4); familia de componentes "Feedback" (`COMPONENT_LIBRARY.md` §4.4) |
| Seguimiento | Permitir que la persona monitoree un dato o una condición a lo largo del tiempo | Alertas de precio e Historial de precios, ya implementados (`CLAUDE.md`, sección "Funcionalidades Implementadas"); familias semánticas "Alert" y "Status" (`DESIGN_TOKENS.md` §4.4) |
| Configuración | Permitir que la persona ajuste cómo el producto le presenta la información | Filtro por farmacia y ordenamiento, ya implementado (`CLAUDE.md`, sección "Funcionalidades Implementadas"); familia de componentes "Acción" (`COMPONENT_LIBRARY.md` §4.4) |

Ninguna familia define, en este documento, cuántos Patrones contendrá ni qué nivel conceptual (§4.2) tendrá cada uno — eso pertenece a una implementación futura, no a esta clasificación.

### 4.5 Relación con Pantallas

`docs/design/system/DESIGN_SYSTEM.md` §4.1 y §4.6 ya definieron que una Pantalla es "la instancia real, con datos reales, de uno o más patrones compuestos para un momento específico del producto", y que el Design System no gobierna Pantallas — solo exige que se construyan exclusivamente a partir de Patrones y Componentes ya existentes. Este documento no reabre esa frontera; formaliza el eslabón que la precede:

```
Patrón
   ↓
Pantalla
   ↓
Flujo
```

**Una Pantalla puede contener varios Patrones.** Ninguna Pantalla está limitada a un único Patrón: distintas familias (§4.4) pueden coexistir dentro de la misma Pantalla —por ejemplo, un Patrón de Descubrimiento y uno de Comparación conviviendo en un mismo momento del producto—, sin que eso implique que uno depende arquitectónicamente del otro. **Un Patrón puede reutilizarse en múltiples Pantallas.** Esa reutilización es, precisamente, la propiedad que distingue a un Patrón de una solución construida ad hoc para una sola Pantalla — un Patrón que solo se usa una vez no cumple el principio de Reutilización ya declarado en §4.1.

Un Flujo —secuencia de Pantallas que resuelve un objetivo completo de la persona, ya referenciado en `docs/design/system/COMPONENT_LIBRARY.md` §4.5 a través del "Flujo de una Búsqueda" descrito en `CLAUDE.md`— es el nivel inmediatamente superior a la Pantalla. Los Flow Patterns (§4.2.3) son el punto de esta arquitectura más cercano a un Flujo real, pero este documento no gobierna ni la Pantalla ni el Flujo: su responsabilidad termina en el Patrón. Ambos niveles siguientes seguirán perteneciendo a `docs/design/system/DESIGN_SYSTEM.md` §4.6, a un futuro `SCREEN_TEMPLATES.md` (§4.9), y a la documentación de producto correspondiente.

### 4.6 Neutralidad

Octava aplicación transversal del mismo principio ya desarrollado en Grid (`GRID_SYSTEM.md` §4.8), Spacing (`SPACING_SYSTEM.md` §4.2.3), Color (`docs/design/brand/COLOR_SYSTEM.md` §4.5), Elevation (`ELEVATION_SYSTEM.md` §4.7), el catálogo de Tokens (`DESIGN_TOKENS.md` §4.1) y la Component Library (`COMPONENT_LIBRARY.md` §4.6): **el Patrón organiza la experiencia. No modifica la imparcialidad del sistema.**

- **Un Patrón no puede alterar el criterio de comparación ya definido por las capas inferiores.** Un Patrón de la familia "Comparación" combina Componentes ya ordenados por un hecho funcional ya calculado (`effective = min(store, online, cmr, sbpay)`, ya citado como criterio legítimo en `docs/design/brand/COLOR_SYSTEM.md` §4.5 y `docs/design/system/GRID_SYSTEM.md` §4.8) — el Patrón no decide ese orden, solo organiza cómo se percibe.
- **Un Patrón no puede introducir una jerarquía perceptual propia distinta a la ya definida por Elevation.** Si un Patrón necesita que un Componente se perciba antes que otro, esa prioridad debe provenir del nivel de Elevation ya asignado a ese Componente (`ELEVATION_SYSTEM.md` §4.2) — nunca de una decisión de composición tomada por el Patrón al margen de esa asignación.
- **Un Patrón de Decisión no puede acelerar ni presionar una decisión de la persona más allá de lo que sus Componentes ya permiten.** Consistente con la prohibición de manipular la decisión (`docs/design/brand/BRAND_FOUNDATIONS.md` §15, §18) y con la distinción entre urgencia funcional y urgencia artificial ya aplicada en `docs/design/system/ELEVATION_SYSTEM.md` §4.2.4: un Patrón de la familia "Decisión" o "Confirmación" que introdujera un elemento de urgencia no derivado de una Información crítica real estaría empujando la decisión, no ayudando a tomarla.

Estas son reglas arquitectónicas, no reglas de experiencia visual: este documento no dice cómo debe sentirse un Patrón de Comparación — dice únicamente qué puede y qué no puede alterar por su cuenta dentro de esta arquitectura.

### 4.7 Accesibilidad

Un Patrón no es accesible por una revisión posterior a su composición — es accesible, o no lo es, según respete o rompa la cadena de herencia completa ya exigida en §4.3:

```
Foundations
   ↓
Tokens
   ↓
Componentes
   ↓
Patrones
```

`docs/design/system/COMPONENT_LIBRARY.md` §4.7 ya declaró que un Componente es accesible si consume correctamente sus Component Tokens. Este documento extiende esa misma regla un nivel más: un Patrón es accesible si, y solo si, ninguno de los Componentes que combina rompe esa cadena por su cuenta, y si la combinación misma no introduce una barrera nueva que ninguno de los Componentes individuales tenía —por ejemplo, una secuencia entre Componentes que exija una interpretación distinta en cada Pantalla donde el Patrón se reutilice, contradiciendo la Consistencia ya declarada en §4.1—. Este documento no define ninguna métrica de accesibilidad concreta: esas métricas siguen perteneciendo a cada Foundation y a `docs/design/system/COMPONENT_LIBRARY.md` §4.7.

### 4.8 Evolución

**Cómo nace un Patrón:** ningún Patrón nuevo, en cualquiera de los tres niveles de §4.2, puede incorporarse sin trazarse a los Componentes de los que depende, o sin justificar formalmente por qué ningún Patrón ya existente en la misma familia (§4.4) cubre esa necesidad — mismo patrón de evolución "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y del Design System (`docs/design/brand/BRAND_ARCHITECTURE.md` §4.7, `docs/design/system/DESIGN_SYSTEM.md` §4.8, `DESIGN_TOKEN_ARCHITECTURE.md` §4.5, `DESIGN_TOKENS.md` §4.8, `COMPONENT_LIBRARY.md` §4.8).

**Cómo evoluciona:** un Patrón puede incorporar Componentes nuevos, dentro de los niveles y familias ya catalogados en `COMPONENT_LIBRARY.md` §4.2 y §4.4, sin que eso constituya, por sí mismo, un cambio de esta arquitectura. Un cambio en el nivel conceptual de un Patrón (por ejemplo, que un Domain Pattern pase a tratarse como Flow Pattern al incorporar una secuencia entre Pantallas) sí debe registrarse (§4.9).

**Cómo se depreca:** ningún Patrón puede eliminarse mientras exista una Pantalla que dependa de él —consecuencia directa de la cadena de herencia ya exigida en `docs/design/system/DESIGN_SYSTEM.md` §4.7—; debe marcarse como deprecado y conservarse trazable, mismo principio de integridad histórica ya aplicado por analogía en `COMPONENT_LIBRARY.md` §4.8 y, en origen, en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` §7.

**Cómo mantiene compatibilidad:** un cambio en un Componente no debería exigir un cambio en la definición conceptual del Patrón que lo consume, siempre que el Componente siga respetando la cadena de dependencia de §4.3 — es, precisamente, la propiedad que la separación entre capas existe para garantizar, mismo principio ya declarado en `docs/design/system/DESIGN_SYSTEM.md` §4.4 y `COMPONENT_LIBRARY.md` §4.8.

### 4.9 Gobierno de Evolución

**Interacción con `COMPONENT_LIBRARY.md`:** ningún Patrón puede aprobarse si los Componentes que combina no existen ya, en alguno de los tres niveles catalogados en `docs/design/system/COMPONENT_LIBRARY.md` §4.2, o si su composición no puede trazarse a alguna de las familias declaradas en ese mismo documento (§4.4). Si ningún Componente cubre la necesidad de un Patrón nuevo, corresponde primero una revisión de `COMPONENT_LIBRARY.md` —incorporando o justificando un Componente nuevo, según su propio gobierno de evolución (§4.8 de ese documento)— antes de aprobar el Patrón que lo necesita.

**Interacción con un futuro `SCREEN_TEMPLATES.md`:** este documento anticipa, sin crearlo, un futuro documento de gobierno para la capa de Plantillas ya referenciada en `docs/design/system/DESIGN_SYSTEM.md` §4.1 ("estructuras de composición de patrones y componentes para un tipo de pantalla recurrente, sin contenido real"). Cuando ese documento exista, deberá consumir esta arquitectura de Patrones exactamente como este documento consume `COMPONENT_LIBRARY.md`: ninguna Plantilla podrá combinar Patrones que no puedan trazarse a los tres niveles ya definidos en §4.2.

**Interacción con `DESIGN_SYSTEM_DECISION_LOG.md`:** toda decisión de arquitectura de la capa de Patrones —un nivel conceptual nuevo, una familia de clasificación nueva, un cambio en la regla de composición entre niveles (§4.2)— debe registrarse en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`, mismo mecanismo ya abierto en el Sprint DG.001 — Design System Governance y declarado obligatorio, para toda decisión de arquitectura de producto, en `docs/design/system/README.md` §4.5 (principio 3).

**Nota de estado:** la adopción misma de los tres niveles conceptuales (Interaction, Domain, Flow Patterns, §4.2), de las seis familias de clasificación (§4.4) y de la octava aplicación de Neutralidad a la capa de Patrones (§4.6) constituye, en el sentido del principio citado arriba, una decisión de arquitectura del dominio `docs/design-system/`. Esa decisión ya no está pendiente de registro: fue consolidada como DSG-006 en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log (§7, §10).

---

## 5. Relaciones

`PATTERNS.md` depende directamente de `docs/design/system/DESIGN_SYSTEM.md`, que definió el concepto general de Patrón (§4.6) y su diferencia con Componente y Pantalla dentro de la cadena completa de capas (§4.1), sin desarrollar una arquitectura interna de niveles de Patrón. Depende también de `docs/design/system/COMPONENT_LIBRARY.md`, que definió los tres niveles y las ocho familias de Componentes que este documento consume sin duplicar, y de `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md`, cuya existencia de Pattern Tokens (§4.2.4 del primero) este documento reconcilia explícitamente con la regla de que ningún Patrón consume Tokens directamente (§4.3). Depende, por último, de `docs/design/brand/BRAND_FOUNDATIONS.md` y `docs/design/DESIGN_BRIEF.md`, fuente directa de varias de las familias de clasificación de Patrones (§4.4).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define los tres niveles conceptuales de Patrón, la cadena de dependencia obligatoria hasta el Patrón, ni las familias de clasificación de este documento. Este documento tampoco resuelve, por su cuenta, ningún Patrón concreto, ninguna Pantalla, ningún Flujo, ningún futuro `SCREEN_TEMPLATES.md`, ni el registro de sus propias decisiones de arquitectura en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§4.9, §7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Concepto de Patrón y su diferencia con Componente y Pantalla | `docs/design/system/DESIGN_SYSTEM.md` §4.6 | ✔ — desarrollado en tres niveles conceptuales (§4.2) | No contradice §4.6; lo desarrolla |
| Cadena de capas del Design System | `docs/design/system/DESIGN_SYSTEM.md` §4.1 | ✔ — extendida hasta el Patrón (§4.3) | — |
| Niveles y familias de la Component Library | `docs/design/system/COMPONENT_LIBRARY.md` §4.2, §4.4 | Referenciados, no duplicados (§4.3, §4.4, §4.9) | El Patrón consume Componentes trazables a esa arquitectura |
| Pattern Tokens | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.4 | ✔ — reconciliado con la regla de no consumo directo de Tokens (§4.3) | Aclaración explícita, no una redefinición de esa capa |
| Principios del Design System | `docs/design/system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Neutralidad | `docs/design/system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1; `COMPONENT_LIBRARY.md` §4.1 | ✔ — octava aplicación transversal (§4.1, §4.6) | — |
| Concepto central "Orientación" | `docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001 | ✔ — aplicado a la organización repetible entre Pantallas (§4.1) | — |
| Región funcional de Búsqueda, Comparación y Acciones | `docs/design/system/GRID_SYSTEM.md` §4.3 | ✔ — fundamentan las familias "Descubrimiento", "Comparación" y "Configuración" (§4.4) | — |
| Propuesta de valor de decidir "en pocos segundos" y prohibición de manipular la decisión | `docs/design/brand/BRAND_FOUNDATIONS.md` §14, §15, §18 | ✔ — fundamentan la familia "Decisión" (§4.4) y las reglas de Neutralidad (§4.6) | — |
| Alertas de precio, Historial de precios y Filtro por farmacia (funcionalidades ya implementadas) | `CLAUDE.md` (raíz del repositorio) | ✔ — fundamentan las familias "Seguimiento" y "Configuración" (§4.4) | Referencia técnica, ya citada por analogía en `GRID_SYSTEM.md` §6 y `DESIGN_TOKENS.md` §6 |
| "Hecho ya calculado" como criterio legítimo de orden/prioridad | `docs/design/brand/COLOR_SYSTEM.md` §4.5; `docs/design/system/GRID_SYSTEM.md` §4.8 | ✔ — aplicado a la familia "Comparación" (§4.6) | — |
| Patrón de evolución "trazar o justificar" | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.7; `docs/design/system/DESIGN_SYSTEM.md` §4.8; `DESIGN_TOKEN_ARCHITECTURE.md` §4.5; `DESIGN_TOKENS.md` §4.8; `COMPONENT_LIBRARY.md` §4.8 | ✔ — aplicado al nacimiento de Patrones (§4.8) | — |
| Herencia de accesibilidad | `docs/design/system/DESIGN_SYSTEM.md` §4.7; `COMPONENT_LIBRARY.md` §4.7 | ✔ — extendida un nivel más, hasta el Patrón (§4.7) | Ninguna métrica nueva definida |
| Concepto de "Flujo de una Búsqueda" | `CLAUDE.md`; referenciado en `COMPONENT_LIBRARY.md` §4.5 | Referenciado, no gobernado (§4.5) | No existe todavía un documento de gobierno propio para Flujo |
| Registro de decisiones de arquitectura de esta capa de Patrones | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — registrado como DSG-006 | Sprint DG.002 — Consolidación del Design System Decision Log |
| Patrones concretos, wireframes, journeys, flujos, layouts | — (no existen todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |
| `SCREEN_TEMPLATES.md` (futuro documento de gobierno de Plantillas) | — (no existe todavía) | No consolidado — anticipado, no creado (§4.5, §4.9) | Pendiente de un futuro sprint del dominio |

---

## 7. Gobierno

`PATTERNS.md` **no reemplaza**:

- `docs/design/system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System y de la diferencia entre Componente, Patrón y Pantalla; este documento desarrolla en detalle un único eslabón de esa cadena.
- `docs/design/system/COMPONENT_LIBRARY.md` — sigue siendo la única fuente de los niveles y familias de Componentes; este documento no los duplica, solo define cómo se combinan (§4.3).
- `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md` — siguen siendo la única fuente de la arquitectura y del catálogo de Tokens, incluidos los Pattern Tokens; este documento solo aclara que el Patrón no los consume directamente (§4.3).
- `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` y `docs/design/brand/BRAND_GUIDELINES.md` — cada uno sigue siendo la única fuente de su propia Foundation o de la identidad de marca.
- Ninguna Pantalla, Plantilla o Flujo real ya implementado en `mobile/` o `web/` — este documento no los redefine; gobierna la arquitectura de Patrones que deberían consumir.
- Un futuro `SCREEN_TEMPLATES.md` — cuando se cree, seguirá siendo la única fuente de gobierno de la capa de Plantillas; este documento no se atribuye esa responsabilidad (§4.5, §4.9).

La responsabilidad específica de `PATTERNS.md` dentro del Design System es gobernar exclusivamente la **arquitectura de la capa de Patrones**: sus tres niveles conceptuales (Interaction, Domain, Flow), la cadena de dependencia obligatoria que exige que todo Patrón consuma Componentes y nunca Tokens directamente, sus familias de clasificación, y las reglas de evolución que permiten que esa arquitectura se mantenga estable sin importar qué tecnología o interfaz la implemente. No gobierna, y no debe absorber en ninguna revisión futura, ningún Patrón concreto, ninguna Pantalla, ningún Flujo, ningún wireframe, journey o layout — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque el producto cambie por completo de tecnología o de interfaz.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** La adopción de los tres niveles conceptuales (Interaction, Domain, Flow Patterns), de las seis familias de clasificación y de la octava aplicación de Neutralidad a la capa de Patrones, antes señalada como pendiente de registro, ya no lo está: fue consolidada como DSG-006 en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log.

---

## 8. Documentos relacionados

- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/COMPONENT_LIBRARY.md`
- `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`
- `docs/design/system/DESIGN_TOKENS.md`
- `docs/design/system/SPACING_SYSTEM.md`
- `docs/design/system/GRID_SYSTEM.md`
- `docs/design/system/ELEVATION_SYSTEM.md`
- `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design/system/README.md`
- `docs/design/brand/BRAND_GUIDELINES.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: un futuro `SCREEN_TEMPLATES.md` (gobierno de la capa de Plantillas), la futura implementación concreta de Patrones reales (independientemente de la tecnología o interfaz elegida), y el futuro catálogo de componentes vivo ya anticipado en `docs/design/system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint DS.6 — Pattern Architecture. Define la arquitectura oficial de la capa de Patrones de ComparaFarma: principios derivados sin invención (incluida una octava aplicación transversal de Neutralidad), tres niveles conceptuales de Patrón (Interaction, Domain, Flow Patterns) con su regla de composición unidireccional, cadena de dependencia obligatoria que formaliza que ningún Patrón consume Tokens directamente y reconcilia esta regla con la existencia de Pattern Tokens, seis familias de clasificación fundamentadas en documentación ya existente, relación con Pantalla y Flujo sin crear ninguno, Neutralidad aplicada a la capa de Patrones, herencia de accesibilidad sin métricas, reglas de evolución (nacimiento, cambio, depreciación, compatibilidad) aplicando nuevamente "trazar o justificar", y gobierno de evolución con su interacción explícita con `COMPONENT_LIBRARY.md`, un futuro `SCREEN_TEMPLATES.md` y `DESIGN_SYSTEM_DECISION_LOG.md`. No crea patrones, pantallas, wireframes, journeys, flujos, layouts, componentes ni menciona tecnología de implementación. Señala, sin resolverlo por su cuenta, que la adopción de los tres niveles, las seis familias y la octava aplicación de Neutralidad requiere aprobación y registro posterior en `DESIGN_SYSTEM_DECISION_LOG.md`. | `docs/design/system/DESIGN_SYSTEM.md` v1.1; `COMPONENT_LIBRARY.md` v1.0; `DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_TOKENS.md` v1.0; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design/system/README.md` v1.0; `docs/design/brand/BRAND_GUIDELINES.md` v1.0; `BRAND_FOUNDATIONS.md` v1.1; `docs/design/DESIGN_BRIEF.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Se actualiza la referencia a la decisión de arquitectura de esta capa de Patrones: ya no está pendiente de registro; fue consolidada como DSG-006 en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio en la plantilla, README de dominio y cierre de referencias cruzadas pendientes | Enterprise Documentation Architect / Design Governance Architect | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design/system/README.md` v1.0; `docs/design/system/DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1 |
| 2026-08-05 | Sprint DS.3 — Design Token Architecture: definición de la arquitectura oficial de Design Tokens (Foundation, Semantic, Component, Pattern) | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0 |
| 2026-08-05 | Sprint DS.4 — Design Tokens Specification: definición del catálogo oficial de familias de Design Tokens | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design/system/DESIGN_TOKENS.md` v1.0 |
| 2026-08-05 | Sprint DS.5 — Component Library Architecture: definición de la arquitectura oficial de la Component Library | Design Systems Architect / UX Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/COMPONENT_LIBRARY.md` v1.0 |
| 2026-08-05 | Sprint DS.6 — Pattern Architecture: definición de la arquitectura oficial de la capa de Patrones | Design Systems Architect / UX Architect / Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/PATTERNS.md` v1.0 |
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-006 (arquitectura de tres niveles y seis familias de la capa de Patrones) | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1; `docs/design/system/PATTERNS.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de la decisión de adoptar los tres niveles conceptuales, las seis familias de clasificación y la octava aplicación de Neutralidad ya no está pendiente: fue consolidado como DSG-006. Queda pendiente, además: la creación de un futuro `SCREEN_TEMPLATES.md` como documento independiente (nota: `SCREEN_TEMPLATES.md` ya fue creado en el Sprint UX.1, posterior a la redacción original de esta fila; ver `docs/design/system/SCREEN_TEMPLATES.md`), y toda implementación concreta de Patrones reales que traduzca esta arquitectura a un producto real.
