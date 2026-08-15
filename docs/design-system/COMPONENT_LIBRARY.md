# COMPONENT_LIBRARY — Especificación Oficial de la Component Library de ComparaFarma

Este documento no diseña ningún componente. No crea botones, inputs, cards ni tablas. No define propiedades, variantes ni estados. No crea Storybook ni ningún catálogo vivo. No implementa ningún componente. Es la **especificación oficial de la arquitectura de la Component Library**: qué niveles conceptuales existen, qué cadena de dependencia obligatoria deben respetar, en qué familias se clasifican, y qué reglas gobiernan su evolución. Debe seguir siendo válido aunque cambie por completo la tecnología del producto, porque no gobierna esa implementación: gobierna la arquitectura bajo la que cualquier componente real deberá construirse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-CLB-001 |
| **Nombre** | COMPONENT_LIBRARY.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / UX Architect / Product Design Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design-system/DESIGN_SYSTEM.md` (que ya definió el concepto de Componente, §4.5, y de Patrón, §4.6, sin desarrollar una arquitectura interna de niveles) y de `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md` (que ya definieron la capa de Component Tokens sin definir qué consume esa capa) |
| **Clasificación** | Documento de Arquitectura de Design System / Puente Tokens–Componentes |
| **Fuente Oficial** | Este documento es la fuente oficial de la **arquitectura de la Component Library**: sus niveles conceptuales (Primitive, Composite, Domain), su cadena de dependencia obligatoria, y sus familias de clasificación. No es fuente de ningún componente concreto, propiedad, variante, estado o código de implementación (no creados) |
| **Documentos de los que depende** | `docs/design-system/DESIGN_SYSTEM.md`, `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_SYSTEM_DECISION_LOG.md`, `docs/design-system/README.md`, `docs/brand/BRAND_GUIDELINES.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `LOGO_SYSTEM.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura implementación concreta de componentes reales (independientemente de la tecnología elegida) y condicionar a un futuro `PATTERNS.md`, todavía no creado, en su relación con los componentes que combine |
| **Pregunta que responde** | ¿Cómo debe gobernarse la Component Library para garantizar consistencia, reutilización, trazabilidad y escalabilidad del producto? |

---

## 2. Propósito

`docs/design-system/DESIGN_SYSTEM.md` §4.5 ya definió qué es un componente: "una unidad mínima de interfaz reutilizable, construida exclusivamente a partir de Design Tokens — nunca directamente desde una decisión de marca sin pasar por esa capa de traducción. Es la primera capa de la arquitectura donde una decisión de marca se vuelve efectivamente usable por un producto real." Ese mismo documento declaró explícitamente que no crea, no diseña ni enumera ningún componente — deja esa responsabilidad a un futuro catálogo de componentes vivo.

Este documento es el paso intermedio entre esa definición general y ese futuro catálogo: gobierna **cómo debe organizarse** la Component Library —sus niveles conceptuales, su cadena de dependencia, sus familias— antes de que exista un solo componente real. Un componente, en el sentido de este documento, sigue siendo exactamente lo que `DESIGN_SYSTEM.md` §4.5 ya declaró: una unidad reutilizable, no una pantalla completa y no, por sí solo, un Patrón — la diferencia entre Componente, Patrón y Pantalla ya está resuelta en `DESIGN_SYSTEM.md` §4.6, y este documento no la reabre.

---

## 3. Alcance

**Este documento define:**

- Los principios que debe cumplir la arquitectura de la Component Library, derivados sin invención de la documentación ya existente (§4.1).
- Los niveles conceptuales de componente — Primitive, Composite y Domain Components — y el propósito de cada uno, sin enumerar ningún componente concreto (§4.2).
- La cadena de dependencia obligatoria entre Foundations, Foundation Tokens, Semantic Tokens, Component Tokens y el Componente (§4.3).
- Las familias de clasificación de componentes, sin crear ningún componente específico (§4.4).
- La relación entre Componente, Patrón, Pantalla y Flujo, sin crear ningún Patrón (§4.5).
- El principio de Neutralidad aplicado a la arquitectura de componentes (§4.6).
- Cómo un componente hereda accesibilidad desde las capas inferiores, sin métricas concretas (§4.7).
- Cómo nace, evoluciona, se depreca y mantiene compatibilidad un componente dentro de esta arquitectura (§4.8).
- Cómo se aprueban y registran los cambios sobre esta arquitectura, y cómo se relaciona con `DESIGN_TOKENS.md` y con un futuro `PATTERNS.md` (§4.9).

**Este documento NO define:**

- Ningún componente concreto: ningún botón, input, card, tabla, elemento de navegación ni ningún otro componente específico.
- Ninguna propiedad, variante, estado o comportamiento de interacción de ningún componente.
- Ningún código, ninguna tecnología de implementación, ningún framework de interfaz ni ningún catálogo vivo (Storybook u otra herramienta equivalente).
- Ningún Patrón, Plantilla, Pantalla o Flujo concreto. Corresponde íntegramente a `docs/design-system/DESIGN_SYSTEM.md` §4.6 y a un futuro `PATTERNS.md`, que este documento no sustituye.
- Ningún Design Token individual, familia de Tokens o valor. Pertenece íntegramente a `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md`; este documento asume ese catálogo como ya resuelto y define qué lo consume.
- Ninguna decisión de identidad, Foundation o principio ya gobernado en `docs/brand/` o `docs/design-system/`. Este documento no los reinterpreta ni los duplica — define únicamente cómo los componentes deben heredarlos.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica a la Component Library |
|---|---|---|
| Consistencia | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Ninguna plataforma puede resolver la misma necesidad de interfaz con un componente distinto sin registrar esa decisión como extensión formal del sistema (§4.8) |
| Simplicidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | La arquitectura de componentes se resuelve con el menor número de niveles conceptuales necesario — por eso son tres, no más (§4.2) |
| Reutilización | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Ningún componente nuevo se crea sin evaluar antes si un componente ya existente, en cualquiera de los tres niveles, resuelve la misma necesidad (§4.8) |
| Accesibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2, §4.7 | Desarrollado íntegramente en §4.7: la cadena de herencia arquitectónica se sostiene si, y solo si, ningún componente puede construirse al margen de sus Tokens |
| Escalabilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Los tres niveles conceptuales deben sostener nuevas plataformas o necesidades de producto sin rediseñarse (§4.2) |
| Mantenibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | Permite deprecar un componente sin romper los Patrones que dependan de él (§4.8) |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1 (sexta aplicación) | Séptima aplicación transversal del mismo principio, extendida aquí a la arquitectura de componentes — desarrollado íntegramente en §4.6 |
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 | Ningún componente redefine una decisión de marca; solo consume los Tokens que ya la traducen (§4.3) |
| Herencia arquitectónica por capas | `docs/design-system/DESIGN_SYSTEM.md` §4.1, §4.7; `DESIGN_TOKEN_ARCHITECTURE.md` §4.2 | Fundamenta directamente la cadena de dependencia obligatoria de §4.3: ninguna capa puede tomar una decisión que le corresponde a otra |

### 4.2 Arquitectura de Componentes

Tres niveles conceptuales. Ninguno se resuelve con un componente concreto; cada uno define solo su responsabilidad dentro de la reutilización.

#### 4.2.1 Primitive Components

La unidad mínima de interfaz reutilizable, en el sentido exacto ya definido en `docs/design-system/DESIGN_SYSTEM.md` §4.5: construida exclusivamente a partir de Component Tokens, sin composición interna de otros componentes y sin contexto de uso propio. Es indivisible dentro de esta arquitectura — no existe un nivel más elemental que este.

#### 4.2.2 Composite Components

Una unidad de interfaz reutilizable construida combinando dos o más Primitive Components. Resuelve una necesidad de composición estructural —cómo varias unidades mínimas conviven como una sola unidad reutilizable—, sin introducir todavía un concepto propio del dominio de ComparaFarma. Un Composite Component sigue siendo, como los Primitive Components, una unidad aislada: no resuelve, por sí solo, un problema de interacción recurrente del producto —esa responsabilidad pertenece al Patrón, ya definido en `docs/design-system/DESIGN_SYSTEM.md` §4.6, y no a este nivel.

#### 4.2.3 Domain Components

Una unidad de interfaz reutilizable, construida a partir de Primitive y/o Composite Components, que incorpora explícitamente un concepto propio del dominio de ComparaFarma — por ejemplo, una noción ya presente en el contrato de datos de la plataforma, como un canal de precio o una farmacia (`CLAUDE.md`, raíz del repositorio). Un Domain Component sigue siendo una unidad reutilizable aislada, no una combinación repetible orientada a resolver un problema de interacción recurrente: esa distinción, y no la presencia de semántica de dominio, es la que separa a un Domain Component de un Patrón.

**Regla de composición entre niveles:** un Composite Component solo puede construirse a partir de Primitive Components; un Domain Component solo puede construirse a partir de Primitive y/o Composite Components. Ningún nivel puede depender de un nivel superior al suyo — mismo principio de herencia unidireccional ya exigido entre las capas de Tokens en `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2.

### 4.3 Dependencias Arquitectónicas

`docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2 ya estableció la regla general: "cada capa solo puede depender de la inmediatamente inferior." Este documento aplica esa misma regla al eslabón que conecta Foundations con el Componente:

```
Foundations (Spacing, Grid, Elevation, Typography, Color, Iconography)
   ↓
Foundation Tokens
   ↓
Semantic Tokens
   ↓
Component Tokens
   ↓
Componente (Primitive → Composite → Domain)
```

Un componente, en cualquiera de sus tres niveles (§4.2), solo puede consumir Component Tokens — nunca una Foundation, un Foundation Token o un Semantic Token directamente. Consumir una capa distinta a la inmediatamente inferior rompe la cadena de herencia arquitectónica ya exigida en `docs/design-system/DESIGN_SYSTEM.md` §4.7, y es, por definición, un componente mal construido dentro de esta arquitectura, no una excepción válida. Un Composite o Domain Component puede consumir varios Component Tokens a la vez —uno por cada Primitive o Composite Component que combina—, pero cada uno de esos Component Tokens sigue respetando, individualmente, la misma cadena.

### 4.4 Clasificación de Componentes

Familias de clasificación, no componentes específicos. Cada familia agrupa componentes —en cualquiera de los tres niveles de §4.2— que comparten un mismo propósito funcional dentro del producto:

| Familia | Propósito funcional | Fundamento |
|---|---|---|
| Entrada | Capturar una acción de entrada de datos de la persona | Región funcional de Búsqueda (`docs/design-system/GRID_SYSTEM.md` §4.3) |
| Navegación | Resolver la orientación estructural del producto | Región funcional de Navegación (`GRID_SYSTEM.md` §4.3); familia semántica "Navigation" (`DESIGN_TOKENS.md` §4.4) |
| Información | Presentar contenido sin exigir una acción inmediata | Información base y contextual (`docs/design-system/ELEVATION_SYSTEM.md` §4.2.1–4.2.2); familias semánticas "Content" y "Data" (`DESIGN_TOKENS.md` §4.4) |
| Comparación | Organizar la lectura simultánea de atributos equivalentes entre farmacias | Región funcional de Comparación (`GRID_SYSTEM.md` §4.3); familia semántica "Comparison" (`DESIGN_TOKENS.md` §4.4) — misma disciplina de Neutralidad desarrollada en §4.6 |
| Acción | Ejecutar una acción disponible del producto | Región funcional de Acciones (`GRID_SYSTEM.md` §4.3); familia semántica "Interactive" (`DESIGN_TOKENS.md` §4.4) |
| Feedback | Comunicar una respuesta del sistema a una acción o a un cambio de estado | Familias semánticas "Feedback", "Alert" y "Status" (`DESIGN_TOKENS.md` §4.4); Información crítica (`ELEVATION_SYSTEM.md` §4.2.4) |
| Contenedores | Agrupar otros componentes dentro de una Zona de contenido o Región funcional ya existente | Zonas de contenido (`GRID_SYSTEM.md` §4.2.3); familias semánticas "Surface" y "Border" (`DESIGN_TOKENS.md` §4.4) |
| Identidad | Expresar un elemento de la identidad de marca dentro de la interfaz | `docs/brand/LOGO_SYSTEM.md`; categoría "Farmacias" de `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.2 — con la misma restricción de Neutralidad ya señalada en ese documento |

Ninguna familia define, en este documento, cuántos componentes contendrá ni qué nivel conceptual (§4.2) tendrá cada uno — eso pertenece a una implementación futura, no a esta clasificación.

### 4.5 Relación con Patrones

`docs/design-system/DESIGN_SYSTEM.md` §4.1 ya definió la cadena completa de capas del Design System (Foundations → Tokens → Componentes → Patrones → Plantillas → Pantallas → Aplicaciones) y, en su §4.6, la diferencia entre Componente, Patrón y Pantalla. Este documento no reabre esa diferencia — sitúa al Componente, en cualquiera de sus tres niveles (§4.2), como el primer eslabón reutilizable de una cadena más amplia:

```
Componente
   ↓
Patrón
   ↓
Pantalla
   ↓
Flujo
```

Un Patrón, tal como ya lo exige `docs/design-system/DESIGN_SYSTEM.md` §4.6, es "una combinación repetible de componentes que resuelve un problema de interacción recurrente del producto" — nunca un componente aislado, sin importar cuánta semántica de dominio incorpore (§4.2.3). Una Pantalla es la instancia real de uno o más Patrones con datos reales. Un **Flujo** —secuencia de Pantallas que juntas resuelven un objetivo completo de la persona— ya existe, a nivel de producto, como concepto documentado (el "Flujo de una Búsqueda" descrito en `CLAUDE.md`, raíz del repositorio), pero no cuenta todavía con un documento de gobierno propio en `docs/design-system/` ni en `docs/product/`. Este documento no gobierna ni el Patrón, ni la Pantalla, ni el Flujo — su responsabilidad termina en el Componente; los tres niveles siguientes seguirán perteneciendo a `docs/design-system/DESIGN_SYSTEM.md` §4.6, a un futuro `PATTERNS.md` (§4.9), y a la documentación de producto correspondiente, no a este documento.

### 4.6 Neutralidad

Séptima aplicación transversal del mismo principio ya desarrollado en Grid (`GRID_SYSTEM.md` §4.8), Spacing (`SPACING_SYSTEM.md` §4.2.3), Color (`docs/brand/COLOR_SYSTEM.md` §4.5), Elevation (`ELEVATION_SYSTEM.md` §4.7) y en el catálogo de Tokens (`DESIGN_TOKENS.md` §4.1, familia "Comparison"): la reutilización no puede introducir sesgos.

- **Un componente reutilizable no puede favorecer una farmacia.** Si el mismo componente se usa para presentar resultados equivalentes, ninguna instancia de ese componente puede recibir, por decisión propia del componente, un tratamiento distinto al de las demás instancias — consecuencia directa de `docs/brand/BRAND_FOUNDATIONS.md` §12 (*"no privilegiamos una farmacia por sobre otra por conveniencia comercial"*), ya aplicada de la misma forma en la familia "Comparison" de componentes (§4.4).
- **La jerarquía visual debe provenir de Tokens y Foundations, nunca de una decisión propia del componente.** Un componente no decide su propia prioridad perceptual —eso es Elevation, traducido vía Component Tokens—, ni su propia posición estructural —eso es Grid—, ni su propio color —eso es Color. Un componente que decidiera esas cosas por su cuenta rompería la cadena de dependencia ya exigida en §4.3, y reintroduciría, a nivel de componente, el mismo riesgo de sesgo que Grid, Spacing, Color y Elevation ya prohíben explícitamente en su propia capa.
- **Un componente no puede introducir reglas propias que contradigan Color, Grid o Elevation.** Por ejemplo, un componente que definiera su propio criterio de cuándo destacarse visualmente, al margen de los niveles ya catalogados en `ELEVATION_SYSTEM.md` §4.2 o de la familia semántica "Comparison" (`DESIGN_TOKENS.md` §4.4), estaría tomando una decisión que no le corresponde. El único criterio legítimo para que un componente destaque una instancia sobre otra es un hecho ya calculado por el sistema —el mismo criterio de "hecho ya calculado" ya establecido en `docs/brand/COLOR_SYSTEM.md` §4.5 y `docs/design-system/GRID_SYSTEM.md` §4.8 (por ejemplo, `effective = min(store, online, cmr, sbpay)`)—, nunca una preferencia editorial o comercial del componente mismo.

Estas son reglas arquitectónicas, no reglas visuales: este documento no dice cómo debe verse un componente que compare precios — dice únicamente qué puede y qué no puede decidir por su cuenta dentro de esta arquitectura.

### 4.7 Accesibilidad

Un componente no es accesible por una propiedad que se le agregue después de construido — es accesible, o no lo es, según respete o rompa la cadena de herencia ya exigida en §4.3. `docs/design-system/DESIGN_SYSTEM.md` §4.7 ya lo declaró para todo el Design System: "un componente que no consuma correctamente los tokens de contraste ya definidos no es simplemente 'menos accesible' — está mal construido, porque rompe la cadena de herencia que esta arquitectura exige."

Este documento hereda esa misma regla para los tres niveles de §4.2: un Primitive Component es accesible si consume correctamente sus Component Tokens; un Composite o Domain Component es accesible si, además, ninguno de los Primitive o Composite Components que combina rompe esa cadena por su cuenta. La accesibilidad de la Component Library completa se sostiene, en consecuencia, desde la arquitectura —Foundations → Tokens → Componentes—, no desde una verificación posterior a la implementación. Este documento no define ninguna métrica de accesibilidad concreta: esas métricas siguen perteneciendo a cada Foundation (`docs/brand/TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4, `ICONOGRAPHY_SYSTEM.md` §4.6, `SPACING_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.7).

### 4.8 Evolución

**Cómo nace un componente:** ningún componente nuevo, en cualquiera de los tres niveles de §4.2, puede incorporarse sin trazarse a los Component Tokens de los que depende, o sin justificar formalmente por qué ningún componente ya existente en la misma familia (§4.4) cubre esa necesidad — mismo patrón "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y del Design System (`docs/brand/BRAND_ARCHITECTURE.md` §4.7, `COLOR_SYSTEM.md` §4.6, `GRID_SYSTEM.md` §4.9, `ELEVATION_SYSTEM.md` §4.9, `docs/design-system/DESIGN_SYSTEM.md` §4.8, `DESIGN_TOKEN_ARCHITECTURE.md` §4.5, `DESIGN_TOKENS.md` §4.8).

**Cómo evoluciona:** un componente puede incorporar Component Tokens nuevos, dentro de las familias de Tokens ya catalogadas en `DESIGN_TOKENS.md` §4.3–§4.4, sin que eso constituya, por sí mismo, un cambio de esta arquitectura. Un cambio en el nivel conceptual de un componente (por ejemplo, que un Composite Component pase a tratarse como Domain Component al incorporar semántica de dominio) sí debe registrarse (§4.9).

**Cómo se depreca:** ningún componente puede eliminarse mientras exista un Patrón que dependa de él —consecuencia directa de la cadena de herencia ya exigida en `docs/design-system/DESIGN_SYSTEM.md` §4.7—; debe marcarse como deprecado y conservarse trazable, mismo principio de integridad histórica ya aplicado por analogía en `DESIGN_TOKEN_ARCHITECTURE.md` §4.5 y `DESIGN_TOKENS.md` §4.8, y, en origen, en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` §7.

**Cómo mantiene compatibilidad:** un cambio en un Component Token no debería exigir un cambio en la definición conceptual del componente que lo consume, siempre que el componente respete la cadena de dependencia de §4.3 — es, precisamente, la propiedad que esa cadena existe para garantizar, mismo principio ya declarado en `docs/design-system/DESIGN_SYSTEM.md` §4.4 y en `DESIGN_TOKEN_ARCHITECTURE.md` §4.5.

### 4.9 Gobierno de Evolución

**Interacción con `DESIGN_SYSTEM_DECISION_LOG.md`:** toda decisión de arquitectura de la Component Library —un nivel conceptual nuevo, una familia de clasificación nueva, un cambio en la regla de composición entre niveles (§4.2)— debe registrarse en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`, mismo mecanismo ya abierto en el Sprint DG.001 — Design System Governance y declarado obligatorio, para toda decisión de arquitectura de producto, en `docs/design-system/README.md` §4.5 (principio 3).

**Interacción con `DESIGN_TOKENS.md`:** ningún componente puede aprobarse si sus Component Tokens no pueden trazarse a una familia ya catalogada en `docs/design-system/DESIGN_TOKENS.md` §4.3–§4.4. Si ninguna familia cubre la necesidad de un componente nuevo, corresponde primero una revisión de `DESIGN_TOKENS.md` —incorporando o justificando una familia nueva, según su propio gobierno de evolución (§4.8 de ese documento)— antes de aprobar el componente que la necesita.

**Interacción con un futuro `PATTERNS.md`:** este documento anticipa, sin crearlo, un futuro documento de gobierno para la capa de Patrones ya definida conceptualmente en `docs/design-system/DESIGN_SYSTEM.md` §4.6. Cuando ese documento exista, deberá consumir esta arquitectura de componentes exactamente como este documento consume `DESIGN_TOKENS.md`: ningún Patrón podrá combinar componentes que no puedan trazarse a los tres niveles ya definidos en §4.2.

**Nota de estado:** la adopción misma de los tres niveles conceptuales (Primitive, Composite, Domain Components, §4.2), de las ocho familias de clasificación (§4.4) y de la séptima aplicación de Neutralidad a la Component Library (§4.6) constituye, en el sentido del principio citado arriba, una decisión de arquitectura del dominio `docs/design-system/`. Esa decisión ya no está pendiente de registro: fue consolidada como DSG-005 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log (§7, §10).

---

## 5. Relaciones

`COMPONENT_LIBRARY.md` depende directamente de `docs/design-system/DESIGN_SYSTEM.md`, que definió el concepto general de Componente (§4.5) y de Patrón (§4.6) dentro de la cadena completa de capas (§4.1), sin desarrollar una arquitectura interna de niveles de componente. Depende también de `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md`, que definieron la capa de Component Tokens y su catálogo de familias sin definir qué los consume — este documento es, precisamente, ese consumidor arquitectónico. Depende, por último, de las seis Foundations ya gobernadas y de `docs/brand/BRAND_GUIDELINES.md`, cuya frontera entre identidad y producto fundamenta por qué ningún componente puede redefinir una decisión de marca (§4.1, §4.3).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define los tres niveles conceptuales de componente, la cadena de dependencia obligatoria hasta el Componente, ni las familias de clasificación de este documento. Este documento tampoco resuelve, por su cuenta, ningún componente concreto, ningún Patrón, ningún futuro `PATTERNS.md`, ni el registro de sus propias decisiones de arquitectura en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` — todos quedan señalados como trabajo pendiente (§4.9, §7), no como decisiones tomadas por este documento en nombre de otro.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Concepto de Componente | `docs/design-system/DESIGN_SYSTEM.md` §4.5 | ✔ — desarrollado en tres niveles conceptuales (§4.2) | No contradice §4.5; lo desarrolla |
| Concepto de Patrón y su diferencia con Componente | `docs/design-system/DESIGN_SYSTEM.md` §4.6 | Referenciado, no redefinido (§4.5) | — |
| Arquitectura de capas de Tokens y regla de dependencia | `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2 | ✔ — extendida hasta el Componente (§4.3) | — |
| Catálogo de familias de Tokens | `docs/design-system/DESIGN_TOKENS.md` §4.3–§4.4 | Referenciado, no duplicado (§4.9) | El componente consume Component Tokens trazables a ese catálogo |
| Principios del Design System | `docs/design-system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Neutralidad | `docs/design-system/GRID_SYSTEM.md` §4.8; `ELEVATION_SYSTEM.md` §4.7; `DESIGN_TOKENS.md` §4.1 | ✔ — séptima aplicación transversal (§4.1, §4.6) | — |
| Frontera entre identidad y producto | `docs/brand/BRAND_GUIDELINES.md` §4.5 | ✔ — fundamenta §4.1 y §4.3 | — |
| Región funcional de Comparación y "hecho ya calculado" | `docs/design-system/GRID_SYSTEM.md` §4.3, §4.8; `docs/brand/COLOR_SYSTEM.md` §4.5 | ✔ — fundamenta la familia "Comparación" (§4.4) y la regla de destaque legítimo (§4.6) | — |
| Regiones funcionales de Navegación, Búsqueda y Acciones | `docs/design-system/GRID_SYSTEM.md` §4.3 | ✔ — fundamentan las familias "Navegación", "Entrada" y "Acción" (§4.4) | — |
| Niveles de prioridad perceptual | `docs/design-system/ELEVATION_SYSTEM.md` §4.2 | ✔ — fundamentan las familias "Información" y "Feedback" (§4.4); desarrollado en §4.6 | — |
| Categoría "Farmacias" de iconografía | `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.2 | ✔ — fundamenta la familia "Identidad" (§4.4) | Misma restricción de Neutralidad heredada |
| Herencia arquitectónica de accesibilidad | `docs/design-system/DESIGN_SYSTEM.md` §4.7 | ✔ — heredada íntegramente (§4.7) | Ninguna métrica nueva definida |
| Patrón de evolución "trazar o justificar" | `docs/brand/BRAND_ARCHITECTURE.md` §4.7; `docs/design-system/DESIGN_SYSTEM.md` §4.8; `DESIGN_TOKEN_ARCHITECTURE.md` §4.5; `DESIGN_TOKENS.md` §4.8 | ✔ — aplicado al nacimiento de componentes (§4.8) | — |
| Integridad histórica ("Reemplazado"/"deprecado", nunca eliminado) | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` §7 | ✔ — aplicado por analogía a la depreciación de componentes (§4.8) | Analogía explícita, no una regla nueva del registro de decisiones |
| Concepto de "Flujo de una Búsqueda" | `CLAUDE.md` (raíz del repositorio) | Referenciado, no gobernado (§4.5) | No existe todavía un documento de gobierno propio para Flujo |
| Registro de decisiones de arquitectura de esta Component Library | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — registrado como DSG-005 | Sprint DG.002 — Consolidación del Design System Decision Log |
| Componentes concretos, propiedades, variantes, estados, código | — (no existen todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de trabajo de diseño e ingeniería posterior |
| `PATTERNS.md` (futuro documento de gobierno de Patrones) | — (no existe todavía) | No consolidado — anticipado, no creado (§4.5, §4.9) | Pendiente de un futuro sprint del dominio |

---

## 7. Gobierno

`COMPONENT_LIBRARY.md` **no reemplaza**:

- `docs/design-system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System y de la diferencia entre Componente, Patrón y Pantalla; este documento desarrolla en detalle un único eslabón de esa cadena.
- `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md` y `DESIGN_TOKENS.md` — siguen siendo la única fuente de la arquitectura de capas de Tokens y de su catálogo de familias; este documento no los duplica, solo define qué los consume (§4.3).
- `docs/design-system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` y `docs/brand/TYPOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` — cada uno sigue siendo la única fuente de su propia Foundation.
- `docs/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- Ningún componente concreto ya implementado en `mobile/` o `web/`, ni ningún futuro catálogo de componentes vivo — este documento no los redefine; gobierna la arquitectura que deberían seguir.
- Un futuro `PATTERNS.md` — cuando se cree, seguirá siendo la única fuente de gobierno de la capa de Patrones; este documento no se atribuye esa responsabilidad (§4.5, §4.9).

La responsabilidad específica de `COMPONENT_LIBRARY.md` dentro del Design System es gobernar exclusivamente la **arquitectura de la Component Library**: sus tres niveles conceptuales (Primitive, Composite, Domain), la cadena de dependencia obligatoria hasta el Componente, sus familias de clasificación, y las reglas de evolución que permiten que esa arquitectura se mantenga estable sin importar qué tecnología la implemente. No gobierna, y no debe absorber en ninguna revisión futura, ningún componente concreto, ninguna propiedad, variante, estado, código o tecnología de implementación — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque el producto cambie por completo de tecnología.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** La adopción de los tres niveles conceptuales (Primitive, Composite, Domain Components), de las ocho familias de clasificación y de la séptima aplicación de Neutralidad a la Component Library, antes señalada como pendiente de registro, ya no lo está: fue consolidada como DSG-005 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` durante el Sprint DG.002 — Consolidación del Design System Decision Log.

---

## 8. Documentos relacionados

- `docs/design-system/DESIGN_SYSTEM.md`
- `docs/design-system/DESIGN_TOKEN_ARCHITECTURE.md`
- `docs/design-system/DESIGN_TOKENS.md`
- `docs/design-system/SPACING_SYSTEM.md`
- `docs/design-system/GRID_SYSTEM.md`
- `docs/design-system/ELEVATION_SYSTEM.md`
- `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`
- `docs/design-system/README.md`
- `docs/brand/BRAND_GUIDELINES.md`
- `docs/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/brand/COLOR_SYSTEM.md`
- `docs/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/brand/LOGO_SYSTEM.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: un futuro `PATTERNS.md` (gobierno de la capa de Patrones), la futura implementación concreta de componentes reales (independientemente de la tecnología elegida), y el futuro catálogo de componentes vivo ya anticipado en `docs/design-system/DESIGN_SYSTEM.md` §4.5.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint DS.5 — Component Library Architecture. Define la arquitectura oficial de la Component Library de ComparaFarma: principios derivados sin invención (incluida una séptima aplicación transversal de Neutralidad), tres niveles conceptuales de componente (Primitive, Composite, Domain Components) con su regla de composición unidireccional, cadena de dependencia obligatoria desde Foundations hasta el Componente vía Foundation/Semantic/Component Tokens, ocho familias de clasificación fundamentadas en documentación ya existente, relación con Patrón/Pantalla/Flujo sin crear ninguno, Neutralidad aplicada a la arquitectura de componentes, herencia de accesibilidad sin métricas, reglas de evolución (nacimiento, cambio, depreciación, compatibilidad), y gobierno de evolución con su interacción explícita con `DESIGN_SYSTEM_DECISION_LOG.md`, `DESIGN_TOKENS.md` y un futuro `PATTERNS.md`. No crea componentes, propiedades, variantes, estados, código ni menciona tecnología de implementación. Señala, sin resolverlo por su cuenta, que la adopción de los tres niveles, las ocho familias y la séptima aplicación de Neutralidad requiere aprobación y registro posterior en `DESIGN_SYSTEM_DECISION_LOG.md`. | `docs/design-system/DESIGN_SYSTEM.md` v1.1; `DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_TOKENS.md` v1.0; `SPACING_SYSTEM.md` v1.1; `GRID_SYSTEM.md` v1.1; `ELEVATION_SYSTEM.md` v1.1; `DESIGN_SYSTEM_DECISION_LOG.md` v1.0; `docs/design-system/README.md` v1.0; `docs/brand/BRAND_GUIDELINES.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0; `LOGO_SYSTEM.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Se actualiza la referencia a la decisión de arquitectura de esta Component Library: ya no está pendiente de registro; fue consolidada como DSG-005 en `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 |

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
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-005 (arquitectura de tres niveles y ocho familias de la Component Library) | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design-system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1; `docs/design-system/COMPONENT_LIBRARY.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de la decisión de adoptar los tres niveles conceptuales, las ocho familias de clasificación y la séptima aplicación de Neutralidad ya no está pendiente: fue consolidado como DSG-005. Queda pendiente, además: la creación de un futuro `PATTERNS.md` como documento independiente (nota: `PATTERNS.md` ya fue creado en el Sprint DS.6, posterior a la redacción original de esta fila; ver `docs/design-system/PATTERNS.md`), y toda implementación concreta de componentes reales que traduzca esta arquitectura a un producto real.
