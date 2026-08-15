# SCREEN_TEMPLATES — Especificación Oficial de la Capa de Screen Templates del Design System de ComparaFarma

Este documento no diseña ninguna pantalla real. No crea wireframes, mockups, flujos ni layouts específicos. No implementa UX. No describe la búsqueda de ComparaFarma ni ninguna otra pantalla concreta del producto. Es la **especificación oficial de la capa de Screen Templates**: qué niveles conceptuales existen, qué cadena de dependencia obligatoria deben respetar, en qué familias se clasifican, y qué reglas gobiernan su evolución para que las pantallas del producto se construyan de forma consistente, reutilizable y escalable. Debe seguir siendo válido aunque el producto cambie por completo de interfaz o de tecnología, porque no gobierna esa implementación: gobierna la arquitectura bajo la que cualquier Plantilla real deberá construirse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-SCT-001 |
| **Nombre** | SCREEN_TEMPLATES.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | UX Architect / Design Systems Architect / Product Design Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design-system/DESIGN_SYSTEM.md` (que ya referenció la capa de Plantillas, §4.1, sin desarrollar una arquitectura interna de niveles) y de `docs/design-system/PATTERNS.md` (que ya definió la capa de Patrones que este documento consume, sin definir cómo varios Patrones se organizan juntos para un tipo recurrente de pantalla) |
| **Clasificación** | Documento de Arquitectura de Design System / Última Capa Reutilizable |
| **Fuente Oficial** | Este documento es la fuente oficial de la **arquitectura de la capa de Screen Templates**: sus niveles conceptuales (Single Pattern, Multi Pattern, Adaptive Template), su cadena de dependencia obligatoria, y sus familias de clasificación. No es fuente de ninguna Pantalla real, wireframe, mockup, flujo o layout concreto (no creados) |
| **Documentos de los que depende** | `docs/design-system/DESIGN_SYSTEM.md`, `PATTERNS.md`, `COMPONENT_LIBRARY.md`, `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design-system/README.md`, `docs/brand/BRAND_GUIDELINES.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura implementación concreta de Plantillas reales (independientemente de la tecnología o interfaz elegida) y condicionar la futura documentación de producto que instancie Pantallas y Flujos reales a partir de estas Plantillas |
| **Pregunta que responde** | ¿Cómo debe gobernarse la capa de Plantillas para que las pantallas del producto sean consistentes, reutilizables y escalables sin definir todavía una pantalla concreta? |

---

## 2. Propósito

`docs/design-system/DESIGN_SYSTEM.md` §4.1 ya referenció la capa de Plantillas dentro de la cadena completa del Design System, como "estructuras de composición de patrones y componentes para un tipo de pantalla recurrente, sin contenido real", sin desarrollar una arquitectura interna propia para esa capa. Este documento es ese desarrollo: gobierna cómo debe organizarse la capa de Screen Templates —sus niveles conceptuales, su cadena de dependencia, sus familias— antes de que exista una sola Pantalla real.

Una Screen Template, en el sentido de este documento, **no es** una Pantalla (que ya tiene datos reales de un momento concreto del producto, `docs/design-system/DESIGN_SYSTEM.md` §4.6), **no es** un Patrón (que resuelve un problema de interacción recurrente, pero sin organizar todavía cómo varios Patrones coexisten dentro de un mismo tipo de pantalla, `docs/design-system/PATTERNS.md` §2), y **no es** un Flujo (una secuencia de Pantallas que resuelve un objetivo completo de la persona, referenciado sin gobernarse en `docs/design-system/COMPONENT_LIBRARY.md` §4.5 y `PATTERNS.md` §4.5). Una Screen Template es, exclusivamente, la estructura reutilizable que organiza uno o más Patrones para un tipo recurrente de pantalla — y, con este documento, se cierra oficialmente la última capa reutilizable del Design System de ComparaFarma.

---

## 3. Alcance

**Este documento define:**

- Los principios que debe cumplir la arquitectura de la capa de Screen Templates, derivados sin invención de la documentación ya existente (§4.1).
- Los niveles conceptuales de Plantilla — Single Pattern, Multi Pattern y Adaptive Template — y el propósito de cada uno, sin crear ningún ejemplo concreto (§4.2).
- La cadena de dependencia obligatoria desde las Foundations hasta la Screen Template, formalizando que ninguna Plantilla consume Tokens ni Componentes directamente (§4.3).
- Las familias de clasificación de Plantillas, sin crear ninguna pantalla concreta ni describir la búsqueda de ComparaFarma (§4.4).
- La relación entre Screen Template, Pantalla y Flujo, sin crear ninguna pantalla (§4.5).
- El principio de Neutralidad aplicado a la capa de Screen Templates (§4.6).
- Cómo una Plantilla hereda accesibilidad desde las capas inferiores, sin métricas concretas (§4.7).
- Cómo nace una Plantilla, cómo evoluciona, cómo se depreca y cómo mantiene compatibilidad, aplicando nuevamente el patrón "trazar o justificar" (§4.8).
- Cómo se aprueban y registran los cambios sobre esta arquitectura, y cómo se relaciona con `PATTERNS.md`, con la futura documentación de producto y con `DESIGN_SYSTEM_DECISION_LOG.md` (§4.9).

**Este documento NO define:**

- Ninguna pantalla real, wireframe, mockup, flujo o layout concreto.
- Ninguna navegación específica entre pantallas.
- Ningún Patrón ni Componente. Pertenecen íntegramente a `docs/design-system/PATTERNS.md` y `COMPONENT_LIBRARY.md`, que este documento consume sin duplicar.
- Ningún código, ninguna tecnología de implementación ni ningún framework de interfaz.
- La búsqueda de ComparaFarma ni ninguna otra funcionalidad concreta del producto, más allá de citarla como fundamento conceptual cuando ya está documentada en otra fuente.
- Ninguna decisión de identidad, Foundation, Token, Componente o Patrón ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento no los reinterpreta ni los duplica — define únicamente cómo las Plantillas deben organizarlos a través de los Patrones que combinan.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica a la capa de Screen Templates |
|---|---|---|
| Consistencia | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Ninguna plataforma puede resolver el mismo tipo recurrente de pantalla con una Plantilla distinta sin registrar esa decisión como extensión formal del sistema (§4.8) |
| Simplicidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | La arquitectura de Plantillas se resuelve con el menor número de niveles conceptuales necesario — por eso son tres, no más (§4.2) |
| Reutilización | `docs/design-system/DESIGN_SYSTEM.md` §4.2; `docs/design-system/PATTERNS.md` §4.1 | Una Plantilla que solo se usa en una Pantalla no cumple su propia definición — la reutilización entre Pantallas es la razón de ser de esta capa (§4.5) |
| Accesibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2, §4.7 | Desarrollado íntegramente en §4.7: una Plantilla hereda accesibilidad, no la define por su cuenta |
| Escalabilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Los tres niveles conceptuales deben sostener nuevos tipos recurrentes de pantalla sin rediseñarse (§4.2) |
| Mantenibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Permite deprecar una Plantilla sin romper las Pantallas que la implementan (§4.8) |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1; `COMPONENT_LIBRARY.md` §4.1; `PATTERNS.md` §4.1 (octava aplicación) | Novena aplicación transversal del mismo principio, extendida aquí a la capa de Screen Templates — desarrollado íntegramente en §4.6 |
| Orientación | Concepto central de diseño (`docs/design/DESIGN_DECISION_LOG.md`, DD-001); ya aplicado en `GRID_SYSTEM.md` §4.3, `ELEVATION_SYSTEM.md` §4.1 y `PATTERNS.md` §4.1 | Una Plantilla reconocible en cualquier Pantalla que la implemente es, para un tipo recurrente de pantalla, lo que la Continuidad estructural es para una sola Pantalla |
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 | Ninguna Plantilla redefine una decisión de marca; solo organiza Patrones que ya la traducen (§4.3) |
| Herencia arquitectónica por capas | `docs/design-system/DESIGN_SYSTEM.md` §4.1, §4.7; `docs/design-system/PATTERNS.md` §4.3 | Fundamenta directamente la cadena de dependencia obligatoria de §4.3: ninguna capa puede tomar una decisión que le corresponde a otra |

### 4.2 Arquitectura de Plantillas

Tres niveles conceptuales. Ninguno crea un ejemplo concreto; cada uno define solo su responsabilidad dentro de la organización de un tipo recurrente de pantalla.

#### 4.2.1 Single Pattern Template

El nivel más elemental de Plantilla: organiza un único Patrón —en cualquiera de los tres niveles ya definidos en `docs/design-system/PATTERNS.md` §4.2— como la estructura recurrente completa de un tipo de pantalla, sin combinar Patrones adicionales. Es la aplicación más directa de la definición general ya dada en `docs/design-system/DESIGN_SYSTEM.md` §4.1: una estructura de composición, en su forma más simple posible, para un tipo de pantalla recurrente.

#### 4.2.2 Multi Pattern Template

Una Plantilla que organiza dos o más Patrones —de la misma o de distintas familias ya catalogadas en `docs/design-system/PATTERNS.md` §4.4— como una estructura recurrente completa. Resuelve una necesidad de composición estructural entre Patrones —cómo coexisten dentro de un mismo tipo de pantalla—, sin fusionarlos en un Patrón nuevo: cada Patrón que combina conserva su propia identidad y su propia reutilización, en el sentido ya exigido por `docs/design-system/PATTERNS.md` §2.

#### 4.2.3 Adaptive Template

Una Plantilla, construida a partir de un Single o de un Multi Pattern Template, cuya composición de Patrones varía según la condición de adaptabilidad ya gobernada en `docs/design-system/GRID_SYSTEM.md` §4.6 (Mobile, Tablet, Desktop). Una Adaptive Template no es una Plantilla nueva por cada condición de pantalla: sigue siendo una sola Plantilla, cuya variación ya está prevista dentro de esta arquitectura, no resuelta de forma ad hoc en cada implementación.

**Regla de composición entre niveles:** un Multi Pattern Template se construye combinando Patrones que, considerados aisladamente, podrían organizarse cada uno como un Single Pattern Template — ningún Multi Pattern Template introduce una responsabilidad que no exista ya en algún Single Pattern Template. Un Adaptive Template puede aplicarse tanto sobre un Single como sobre un Multi Pattern Template, pero nunca al revés: ni un Single ni un Multi Pattern Template pueden depender de una variación adaptativa para existir como estructura base — mismo principio de herencia unidireccional ya exigido entre los niveles de Componente (`docs/design-system/COMPONENT_LIBRARY.md` §4.2) y de Patrón (`PATTERNS.md` §4.2).

### 4.3 Cadena Arquitectónica

`docs/design-system/PATTERNS.md` §4.3 ya formalizó la cadena de dependencia hasta el Patrón. Este documento la extiende un eslabón más, hasta la Screen Template:

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
   ↓
Screen Templates (Single Pattern → Multi Pattern → Adaptive)
```

**Ninguna Plantilla consume Tokens ni Componentes directamente. Toda Plantilla consume únicamente Patrones.** `docs/design-system/DESIGN_SYSTEM.md` §4.1 describió originalmente la capa de Plantillas, en términos generales, como una "estructura de composición de patrones y componentes" — una descripción escrita antes de que la arquitectura interna de Componentes y Patrones existiera con el detalle que hoy tienen `COMPONENT_LIBRARY.md` y `PATTERNS.md`. Este documento no contradice esa descripción general: la especializa, aplicando la misma regla de dependencia por capa inmediatamente inferior ya exigida en `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2 y en `PATTERNS.md` §4.3. Cualquier necesidad de un Componente dentro de una Plantilla ya está resuelta dentro del Patrón que la Plantilla organiza —un Patrón, por definición (`PATTERNS.md` §4.3), ya consume los Componentes que necesita—; que una Plantilla consumiera un Componente directamente, saltándose el Patrón, sería el mismo tipo de atajo que `docs/design-system/DESIGN_SYSTEM.md` §4.7 ya califica como una construcción que "rompe la cadena de herencia que esta arquitectura exige", no una excepción válida.

### 4.4 Clasificación de Plantillas

Familias conceptuales, no pantallas concretas. Ninguna familia describe la búsqueda de ComparaFarma ni ninguna otra pantalla real; cada una agrupa Plantillas —en cualquiera de los tres niveles de §4.2— que organizan Patrones orientados a un mismo tipo recurrente de necesidad:

| Familia | Tipo recurrente de pantalla que organiza | Fundamento |
|---|---|---|
| Exploración | Presentar, de forma recurrente, un conjunto de opciones que la persona todavía no ha acotado | Patrones de la familia "Descubrimiento" (`docs/design-system/PATTERNS.md` §4.4) |
| Comparación | Organizar la evaluación simultánea de opciones equivalentes | Patrones de la familia "Comparación" (`PATTERNS.md` §4.4) — misma disciplina de Neutralidad desarrollada en §4.6 |
| Detalle | Presentar, de forma recurrente, la información profunda de una unidad específica ya seleccionada | Patrones de las familias "Decisión" y "Confirmación" (`PATTERNS.md` §4.4); transición estructural entre resultados y detalle ya señalada en `docs/design-system/GRID_SYSTEM.md` §4.3 |
| Configuración | Permitir que la persona ajuste cómo el producto le presenta la información | Patrones de la familia "Configuración" (`PATTERNS.md` §4.4) |
| Seguimiento | Permitir que la persona monitoree un dato o una condición a lo largo del tiempo | Patrones de la familia "Seguimiento" (`PATTERNS.md` §4.4) |

Una misma familia de Plantilla puede organizar Patrones de más de una familia de Patrón —la familia "Detalle" combina "Decisión" y "Confirmación"— sin que eso constituya una excepción: es, precisamente, la responsabilidad que define a un Multi Pattern Template (§4.2.2). Ninguna familia define, en este documento, cuántas Plantillas contendrá ni qué nivel conceptual (§4.2) tendrá cada una — eso pertenece a una implementación futura, no a esta clasificación.

### 4.5 Relación con Pantallas

`docs/design-system/DESIGN_SYSTEM.md` §4.6 ya definió que una Pantalla es "la instancia real, con datos reales, de uno o más patrones compuestos para un momento específico del producto." Este documento formaliza el eslabón que la precede:

```
Screen Template
   ↓
Pantalla
   ↓
Flujo
```

**Una Pantalla implementa una Plantilla.** Ninguna Pantalla real puede existir al margen de una Screen Template ya catalogada en esta arquitectura (en cualquiera de sus tres niveles, §4.2) — implementar una Plantilla es, precisamente, lo que distingue a una Pantalla de una composición ad hoc de Patrones. **Una Plantilla puede reutilizarse en múltiples Pantallas.** Esa reutilización es la propiedad que distingue a una Screen Template de un layout construido una sola vez para un momento específico del producto — una Plantilla que solo se implementa en una única Pantalla no cumple el principio de Reutilización ya declarado en §4.1.

Un Flujo —secuencia de Pantallas que resuelve un objetivo completo de la persona, ya referenciado sin gobernarse en `docs/design-system/COMPONENT_LIBRARY.md` §4.5 y `PATTERNS.md` §4.5— sigue siendo el nivel inmediatamente superior a la Pantalla. Este documento no gobierna ni la Pantalla ni el Flujo: su responsabilidad termina en la Screen Template. Con el cierre de esta capa, el Design System de ComparaFarma completa su arquitectura de capas reutilizables (Foundations → Tokens → Componentes → Patrones → Screen Templates); la Pantalla y el Flujo reales seguirán perteneciendo a la implementación de producto, no a un nuevo documento de arquitectura de este dominio (§4.9).

### 4.6 Neutralidad

Novena aplicación transversal del mismo principio ya desarrollado en Grid (`GRID_SYSTEM.md` §4.8), Spacing (`SPACING_SYSTEM.md` §4.2.3), Color (`docs/brand/COLOR_SYSTEM.md` §4.5), Elevation (`ELEVATION_SYSTEM.md` §4.7), el catálogo de Tokens (`DESIGN_TOKENS.md` §4.1), la Component Library (`COMPONENT_LIBRARY.md` §4.6) y la capa de Patrones (`PATTERNS.md` §4.6): **la Plantilla organiza Patrones. No modifica la imparcialidad del sistema.**

Una Plantilla no puede modificar:

- **Comparación:** una Plantilla de la familia "Comparación" organiza un Patrón que ya combina Componentes ordenados por un hecho funcional ya calculado (`effective = min(store, online, cmr, sbpay)`) — la Plantilla no puede reordenar, por su cuenta, lo que ese Patrón ya resolvió.
- **Jerarquía (Elevation):** una Plantilla no puede asignar una prioridad perceptual distinta a la que cada Patrón ya trae consigo desde los Componentes que combina (`ELEVATION_SYSTEM.md` §4.2, ya heredado por `PATTERNS.md` §4.6) — organizar varios Patrones dentro de una misma Plantilla (Multi Pattern Template, §4.2.2) no es una oportunidad para redecidir qué elemento se percibe primero.
- **Elevación:** ver punto anterior — la Elevación es, precisamente, el nombre de la Foundation cuya jerarquía una Plantilla no puede alterar; se distingue aquí de "Jerarquía" solo para nombrar de forma explícita ambos términos usados en el criterio original de esta arquitectura.
- **Estructura (Grid):** la posición relativa de los Patrones que una Plantilla combina debe seguir siendo consecuencia de la Estructura primaria y las Regiones funcionales ya definidas en `docs/design-system/GRID_SYSTEM.md` §4.2 — no una decisión estructural nueva tomada por la Plantilla al margen de Grid.

Estas son reglas arquitectónicas, no reglas de layout: este documento no dice cómo debe organizarse visualmente una Plantilla de Comparación — dice únicamente qué no puede decidir por su cuenta dentro de esta arquitectura.

### 4.7 Accesibilidad

Una Plantilla no es accesible por una revisión posterior a su composición — es accesible, o no lo es, según respete o rompa la cadena de herencia completa ya exigida en §4.3:

```
Foundations
   ↓
Tokens
   ↓
Componentes
   ↓
Patrones
   ↓
Plantillas
```

`docs/design-system/PATTERNS.md` §4.7 ya declaró que un Patrón es accesible si ninguno de los Componentes que combina rompe esa cadena por su cuenta, y si la combinación misma no introduce una barrera nueva. Este documento extiende esa misma regla un nivel más: una Plantilla es accesible si, y solo si, ninguno de los Patrones que organiza rompe esa cadena por su cuenta, y si la organización misma —especialmente en un Multi Pattern Template— no introduce una barrera nueva que ninguno de los Patrones individuales tenía, por ejemplo, una secuencia de lectura entre Patrones que exija una interpretación distinta cada vez que la Plantilla se reutilice, contradiciendo la Consistencia ya declarada en §4.1. Este documento no define ninguna métrica de accesibilidad concreta: esas métricas siguen perteneciendo a cada Foundation, a `docs/design-system/COMPONENT_LIBRARY.md` §4.7 y a `PATTERNS.md` §4.7.

### 4.8 Evolución

**Cómo nace una Plantilla:** ninguna Screen Template nueva, en cualquiera de los tres niveles de §4.2, puede incorporarse sin trazarse a los Patrones de los que depende, o sin justificar formalmente por qué ninguna Plantilla ya existente en la misma familia (§4.4) cubre esa necesidad — mismo patrón de evolución "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y del Design System (`docs/brand/BRAND_ARCHITECTURE.md` §4.7, `docs/design-system/DESIGN_SYSTEM.md` §4.8, `DESIGN_TOKEN_ARCHITECTURE.md` §4.5, `DESIGN_TOKENS.md` §4.8, `COMPONENT_LIBRARY.md` §4.8, `PATTERNS.md` §4.8).

**Cómo evoluciona:** una Plantilla puede incorporar Patrones nuevos, dentro de los niveles y familias ya catalogados en `PATTERNS.md` §4.2 y §4.4, sin que eso constituya, por sí mismo, un cambio de esta arquitectura. Un cambio en el nivel conceptual de una Plantilla (por ejemplo, que un Single Pattern Template pase a tratarse como Multi Pattern Template al incorporar un segundo Patrón) sí debe registrarse (§4.9).

**Cómo se depreca:** ninguna Plantilla puede eliminarse mientras exista una Pantalla que la implemente —consecuencia directa de la cadena de herencia ya exigida en `docs/design-system/DESIGN_SYSTEM.md` §4.7—; debe marcarse como deprecada y conservarse trazable, mismo principio de integridad histórica ya aplicado por analogía en `PATTERNS.md` §4.8 y, en origen, en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` §7.

**Cómo mantiene compatibilidad:** un cambio en un Patrón no debería exigir un cambio en la definición conceptual de la Plantilla que lo organiza, siempre que el Patrón siga respetando la cadena de dependencia de §4.3 — es, precisamente, la propiedad que la separación entre capas existe para garantizar, mismo principio ya declarado en `docs/design-system/DESIGN_SYSTEM.md` §4.4 y `PATTERNS.md` §4.8.

### 4.9 Gobierno de Evolución

**Interacción con `PATTERNS.md`:** ninguna Plantilla puede aprobarse si los Patrones que organiza no existen ya, en alguno de los tres niveles catalogados en `docs/design-system/PATTERNS.md` §4.2, o si su composición no puede trazarse a alguna de las familias declaradas en ese mismo documento (§4.4). Si ningún Patrón cubre la necesidad de una Plantilla nueva, corresponde primero una revisión de `PATTERNS.md` —incorporando o justificando un Patrón nuevo, según su propio gobierno de evolución (§4.8 de ese documento)— antes de aprobar la Plantilla que lo necesita.

**Interacción con la futura documentación de producto:** con el cierre de esta capa, el Design System de ComparaFarma completa su arquitectura de capas reutilizables (§4.5). A diferencia de las capas anteriores, que cada una anticipó un futuro documento de arquitectura dentro de `docs/design-system/` (`COMPONENT_LIBRARY.md` anticipó `PATTERNS.md`; `PATTERNS.md` anticipó este documento), la instanciación real de Plantillas en Pantallas y Flujos concretos no corresponde a un nuevo documento de este dominio: corresponde a la documentación de producto (`docs/product/`) y a la implementación real en `mobile/` y `web/`. Este documento no gobierna esa documentación futura — solo exige que, cuando exista, cada Pantalla y cada Flujo que describa puedan trazarse a una Screen Template ya catalogada aquí.

**Interacción con `DESIGN_SYSTEM_DECISION_LOG.md`:** toda decisión de arquitectura de la capa de Screen Templates —un nivel conceptual nuevo, una familia de clasificación nueva, un cambio en la regla de composición entre niveles (§4.2)— debe registrarse en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`, mismo mecanismo ya abierto en el Sprint DG.001 — Design System Governance y declarado obligatorio, para toda decisión de arquitectura de producto, en `docs/design-system/README.md` §4.5 (principio 3).

**Nota de estado:** la adopción misma de los tres niveles conceptuales (Single Pattern, Multi Pattern, Adaptive Template, §4.2), de las cinco familias de clasificación (§4.4) y de la novena aplicación de Neutralidad a la capa de Screen Templates (§4.6) constituye, en el sentido del principio citado arriba, una decisión de arquitectura del dominio `docs/design-system/`. Esa decisión ya no está pendiente de registro: fue consolidada como DSG-007 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log (§7, §10).

---

## 5. Relaciones

`SCREEN_TEMPLATES.md` depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que referenció la capa de Plantillas dentro de la cadena completa de capas (§4.1) sin desarrollar una arquitectura interna de niveles. Depende también de `docs/design-system/PATTERNS.md`, que definió los tres niveles y las seis familias de Patrones que este documento consume sin duplicar, y de `docs/design-system/GRID_SYSTEM.md` §4.6, fuente directa de la condición de adaptabilidad que fundamenta el Adaptive Template (§4.2.3). Depende, por último, de `docs/brand/BRAND_GUIDELINES.md`, cuya frontera entre identidad y producto fundamenta por qué ninguna Plantilla puede redefinir una decisión de marca (§4.1, §4.3).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define los tres niveles conceptuales de Screen Template, la cadena de dependencia obligatoria hasta la Plantilla, ni las familias de clasificación de este documento. Este documento tampoco resuelve, por su cuenta, ninguna Plantilla concreta, ninguna Pantalla, ningún Flujo, ninguna documentación de producto futura, ni el registro de sus propias decisiones de arquitectura en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§4.9, §7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Referencia general a la capa de Plantillas | `docs/design-system/DESIGN_SYSTEM.md` §4.1 | ✔ — desarrollada en tres niveles conceptuales (§4.2) | No contradice §4.1; lo especializa (§4.3) |
| Diferencia entre Patrón, Plantilla y Pantalla | `docs/design-system/DESIGN_SYSTEM.md` §4.6 | ✔ — referenciada y extendida en §2, §4.5 | — |
| Niveles y familias de la capa de Patrones | `docs/design-system/PATTERNS.md` §4.2, §4.4 | Referenciados, no duplicados (§4.3, §4.4, §4.9) | La Plantilla consume Patrones trazables a esa arquitectura |
| Condición de adaptabilidad (Mobile/Tablet/Desktop) | `docs/design-system/GRID_SYSTEM.md` §4.6 | ✔ — fundamenta el Adaptive Template (§4.2.3) | — |
| Principios del Design System | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1; `COMPONENT_LIBRARY.md` §4.1; `PATTERNS.md` §4.1 | ✔ — novena aplicación transversal (§4.1, §4.6) | — |
| Transición estructural entre resultados y detalle | `docs/design-system/GRID_SYSTEM.md` §4.3 | ✔ — fundamenta la familia "Detalle" (§4.4) | No describe la pantalla de búsqueda ni ninguna pantalla real |
| "Hecho ya calculado" como criterio legítimo de orden | `docs/brand/COLOR_SYSTEM.md` §4.5; `docs/design-system/GRID_SYSTEM.md` §4.8 | ✔ — aplicado a la familia "Comparación" (§4.6) | — |
| Patrón de evolución "trazar o justificar" | `docs/brand/BRAND_ARCHITECTURE.md` §4.7; `docs/design-system/DESIGN_SYSTEM.md` §4.8; `PATTERNS.md` §4.8 | ✔ — aplicado al nacimiento de Plantillas (§4.8) | — |
| Herencia de accesibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.7; `COMPONENT_LIBRARY.md` §4.7; `PATTERNS.md` §4.7 | ✔ — extendida un nivel más, hasta la Plantilla (§4.7) | Ninguna métrica nueva definida |
| Concepto de "Flujo" | `CLAUDE.md`; referenciado en `COMPONENT_LIBRARY.md` §4.5 y `PATTERNS.md` §4.5 | Referenciado, no gobernado (§4.5) | No existe todavía un documento de gobierno propio para Flujo |
| Registro de decisiones de arquitectura de esta capa de Screen Templates | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — registrado como DSG-007 | Sprint DG.002 — Consolidación del Design System Decision Log |
| Plantillas concretas, pantallas, wireframes, mockups, layouts, navegación | — (no existen todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |
| Documentación de producto que instancie Pantallas y Flujos reales | — (no existe todavía en `docs/product/`) | No consolidado — anticipado, no creado (§4.9) | A diferencia de las capas anteriores, no anticipa un nuevo documento de `docs/design-system/`, sino de `docs/product/` |

---

## 7. Gobierno

`SCREEN_TEMPLATES.md` **no reemplaza**:

- `docs/design-system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System; este documento desarrolla en detalle un único eslabón de esa cadena, sin contradecir la descripción general ya dada en §4.1 (§4.3).
- `docs/design-system/PATTERNS.md` — sigue siendo la única fuente de los niveles y familias de Patrones; este documento no los duplica, solo define cómo se organizan (§4.3).
- `docs/design-system/COMPONENT_LIBRARY.md`, `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md` y las seis Foundations ya gobernadas — cada uno sigue siendo la única fuente de su propia capa; esta Plantilla los hereda a través de los Patrones, nunca directamente.
- `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- Ninguna Pantalla, Flujo o layout real ya implementado en `mobile/` o `web/` — este documento no los redefine; gobierna la arquitectura de Plantillas que deberían implementar.
- La futura documentación de producto que instancie Pantallas y Flujos reales — cuando exista, deberá derivarse de esta arquitectura, no sustituirla (§4.9).

La responsabilidad específica de `SCREEN_TEMPLATES.md` dentro del Design System es gobernar exclusivamente la **arquitectura de la capa de Screen Templates**: sus tres niveles conceptuales (Single Pattern, Multi Pattern, Adaptive), la cadena de dependencia obligatoria que exige que toda Plantilla consuma únicamente Patrones, sus familias de clasificación, y las reglas de evolución que permiten que esa arquitectura se mantenga estable sin importar qué tecnología o interfaz la implemente. No gobierna, y no debe absorber en ninguna revisión futura, ninguna Pantalla real, ningún wireframe, mockup, flujo o layout concreto — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque el producto cambie por completo de interfaz o de tecnología. Con este documento, la arquitectura de capas reutilizables del Design System de ComparaFarma queda oficialmente completa (§4.5, §4.9).

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** La adopción de los tres niveles conceptuales (Single Pattern, Multi Pattern, Adaptive Template), de las cinco familias de clasificación y de la novena aplicación de Neutralidad a la capa de Screen Templates, antes señalada como pendiente de registro, ya no lo está: fue consolidada como DSG-007 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log.

---

## 8. Documentos relacionados

- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/PATTERNS.md`
- `docs/design-system/COMPONENT_LIBRARY.md`
- `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md`
- `docs/design-system/DESIGN_TOKENS.md`
- `docs/design-system/SPACING_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/ELEVATION_SYSTEM.md`
- `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design-system/README.md`
- `docs/brand/BRAND_GUIDELINES.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura documentación de producto (`docs/product/`) que instancie Pantallas y Flujos reales a partir de estas Plantillas, y la futura implementación concreta de Screen Templates reales (independientemente de la tecnología o interfaz elegida).

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint UX.1 — Screen Templates Architecture. Define la arquitectura oficial de la capa de Screen Templates de ComparaFarma, cerrando oficialmente la última capa reutilizable del Design System: principios derivados sin invención (incluida una novena aplicación transversal de Neutralidad), tres niveles conceptuales de Plantilla (Single Pattern, Multi Pattern, Adaptive Template) con su regla de composición unidireccional, cadena de dependencia obligatoria que formaliza que ninguna Plantilla consume Tokens ni Componentes directamente y reconcilia esta regla con la descripción general de `DESIGN_SYSTEM.md` §4.1, cinco familias de clasificación fundamentadas en documentación ya existente sin describir la búsqueda de ComparaFarma, relación con Pantalla y Flujo sin crear ninguno, Neutralidad aplicada a la capa de Screen Templates, herencia de accesibilidad sin métricas, reglas de evolución (nacimiento, cambio, depreciación, compatibilidad) aplicando nuevamente "trazar o justificar", y gobierno de evolución con su interacción explícita con `PATTERNS.md`, la futura documentación de producto y `DESIGN_SYSTEM_DECISION_LOG.md`. No crea pantallas, wireframes, mockups, flujos, layouts, navegación, componentes, patrones ni menciona tecnología de implementación. Señala, sin resolverlo por su cuenta, que la adopción de los tres niveles, las cinco familias y la novena aplicación de Neutralidad requiere aprobación y registro posterior en `DESIGN_SYSTEM_DECISION_LOG.md`. | `docs/design-system/DESIGN_SYSTEM.md` v1.1; `PATTERNS.md` v1.0; `COMPONENT_LIBRARY.md` v1.0; `DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_TOKENS.md` v1.0; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design-system/README.md` v1.0; `docs/brand/BRAND_GUIDELINES.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Se actualiza la referencia a la decisión de arquitectura de esta capa de Screen Templates: ya no está pendiente de registro; fue consolidada como DSG-007 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design-system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance: registro de decisiones, reconocimiento formal del dominio en la plantilla, README de dominio y cierre de referencias cruzadas pendientes | Enterprise Documentation Architect / Design Governance Architect | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.1; `docs/design-system/README.md` v1.0; `docs/design-system/DESIGN_SYSTEM.md` v1.1; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1 |
| 2026-08-05 | Sprint DS.3 — Design Token Architecture: definición de la arquitectura oficial de Design Tokens (Foundation, Semantic, Component, Pattern) | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0 |
| 2026-08-05 | Sprint DS.4 — Design Tokens Specification: definición del catálogo oficial de familias de Design Tokens | Design Systems Architect / Design Token Specialist / Enterprise Documentation Architect | `docs/design-system/DESIGN_TOKENS.md` v1.0 |
| 2026-08-05 | Sprint DS.5 — Component Library Architecture: definición de la arquitectura oficial de la Component Library | Design Systems Architect / UX Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/COMPONENT_LIBRARY.md` v1.0 |
| 2026-08-05 | Sprint DS.6 — Pattern Architecture: definición de la arquitectura oficial de la capa de Patrones | Design Systems Architect / UX Architect / Interaction Design Director / Enterprise Documentation Architect | `docs/design-system/PATTERNS.md` v1.0 |
| 2026-08-05 | Sprint UX.1 — Screen Templates Architecture: definición de la arquitectura oficial de la capa de Screen Templates, cerrando la última capa reutilizable del Design System | UX Architect / Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design-system/SCREEN_TEMPLATES.md` v1.0 |
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-002 a DSG-007, cerrando todas las referencias pendientes de registro señaladas por los cinco documentos de arquitectura del dominio | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1; `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` v1.1; `DESIGN_TOKENS.md` v1.1; `COMPONENT_LIBRARY.md` v1.1; `PATTERNS.md` v1.1; `SCREEN_TEMPLATES.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de la decisión de adoptar los tres niveles conceptuales, las cinco familias de clasificación y la novena aplicación de Neutralidad ya no está pendiente: fue consolidado como DSG-007. Con el Sprint DG.002, ninguna de las seis decisiones de arquitectura señaladas por los documentos de este dominio (DSG-002 a DSG-007) sigue pendiente de registro. Queda pendiente, además: la creación de la futura documentación de producto que instancie Pantallas y Flujos reales, y toda implementación concreta de Screen Templates que traduzca esta arquitectura a un producto real.
