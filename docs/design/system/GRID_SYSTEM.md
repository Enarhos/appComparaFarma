# GRID_SYSTEM — Especificación Oficial del Sistema de Grid de ComparaFarma

Este documento no define columnas, no establece una retícula de 12 columnas, no define píxeles, no define breakpoints, no crea componentes y no sustituye una guía de UI. Es la **especificación oficial del sistema de grid**: qué capas conceptuales organizan la estructura espacial del producto, y qué principios debe cumplir cualquier retícula o sistema de columnas futuro. El Grid no es una retícula gráfica — es un **sistema de organización de la información**, cuya función principal es hacer comprensible el contenido antes de que intervengan el color, la tipografía o cualquier componente. Debe seguir siendo válido aunque el producto adopte, más adelante, cualquier sistema de columnas, cualquier framework de interfaz o cualquier tecnología.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-GRD-001 |
| **Nombre** | GRID_SYSTEM.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Draft |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Design Systems Architect / Information Architecture Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — depende directamente de `docs/design/system/DESIGN_SYSTEM.md`, que identificó el grid como Foundation pendiente de gobierno (§4.3), y de `docs/design/system/SPACING_SYSTEM.md`, que ya distinguió (§4.5) que "el grid define la estructura... el espaciado define la distancia" |
| **Clasificación** | Documento de Arquitectura de Design System / Foundation |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura conceptual** del sistema de grid. No es fuente de identidad de marca, de arquitectura de espaciado (`SPACING_SYSTEM.md`), de arquitectura tipográfica (`TYPOGRAPHY_SYSTEM.md`), ni de ninguna columna, breakpoint, token o layout concreto (no definidos) |
| **Documentos de los que depende** | `docs/design/system/DESIGN_SYSTEM.md`, `docs/design/system/SPACING_SYSTEM.md`, `docs/design/brand/BRAND_GUIDELINES.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `docs/design/brand/COLOR_SYSTEM.md`, `docs/design/brand/ICONOGRAPHY_SYSTEM.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/design/DESIGN_BRIEF.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Cierra el vacío de Foundation "grid" señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3 y referenciado como pendiente en `SPACING_SYSTEM.md` §4.5; debería gobernar la futura implementación concreta de columnas, breakpoints y layouts |
| **Pregunta que responde** | ¿Cómo debe gobernarse la estructura espacial del producto para que cualquier pantalla de ComparaFarma sea coherente, legible y escalable? |

---

## 2. Propósito

El Grid no es una retícula gráfica que se dibuja sobre una pantalla para alinear elementos: es el **sistema de organización de la información** más elemental del producto, el que decide dónde existen las regiones de significado antes de que cualquier otro sistema actúe sobre ellas. `docs/design/DESIGN_BRIEF.md` §4.11 ya declara que *"la jerarquía visual de la información es, para este producto, tan parte de la identidad como cualquier elemento gráfico"* — y el Grid es, dentro de esa jerarquía, la capa que actúa primero: antes de que la tipografía decida cómo se lee un texto (`TYPOGRAPHY_SYSTEM.md`), antes de que el espaciado decida cuánta distancia separa dos elementos ya posicionados (`SPACING_SYSTEM.md`), y antes de que el color o la iconografía refuercen cualquier significado (`COLOR_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`), el Grid ya decidió qué zonas de la pantalla existen y qué función cumple cada una.

`docs/design/system/DESIGN_SYSTEM.md` §4.3 ya identificó el grid como una Foundation de la arquitectura del Design System todavía sin gobierno propio, y `docs/design/system/SPACING_SYSTEM.md` §4.5 ya distinguió, sin resolverlo, que *"el grid define la estructura de columnas y alineación sobre la que se posiciona el contenido; el espaciado define la distancia entre ese contenido una vez posicionado sobre esa estructura."* Este documento cierra ese vacío.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema de grid, derivados sin invención de la documentación ya existente (§4.1).
- Las capas conceptuales que organizan la estructura del producto — Estructura primaria, Regiones funcionales, Zonas de contenido, Alineación y Continuidad — sin hablar de columnas concretas (§4.2).
- Cómo el Grid organiza, a nivel estructural, la navegación, la búsqueda, los resultados, la comparación, el detalle y las acciones del producto, sin crear pantallas (§4.3).
- La relación entre Grid y Spacing, sin duplicar `SPACING_SYSTEM.md` (§4.4).
- La relación entre Grid y tipografía, sin duplicar `TYPOGRAPHY_SYSTEM.md` (§4.5).
- Principios de adaptabilidad entre mobile, tablet y desktop, sin breakpoints ni columnas (§4.6).
- Cómo una estructura consistente reduce la carga cognitiva (§4.7).
- El principio de neutralidad estructural, específico de este producto (§4.8).
- Cómo evoluciona el sistema y cómo se incorpora una implementación concreta futura sin romper esta arquitectura (§4.9).

**Este documento NO define:**

- Ningún número de columnas, ni una retícula específica (no se elige, menciona ni descarta un sistema de 12 columnas ni ningún otro).
- Ningún breakpoint, píxel ni medida concreta.
- Ningún Design Token de grid. Esa capa ya está definida arquitectónicamente en `docs/design/system/DESIGN_SYSTEM.md` §4.4; este documento es la Foundation que esa capa deberá traducir, no la traducción en sí misma.
- Ningún layout, pantalla ni wireframe concreto.
- Ninguna tecnología de implementación (sistemas de columnas CSS, herramientas de layout automático, herramientas de diseño o frameworks de interfaz).
- La distancia o separación entre elementos ya posicionados. Pertenece íntegramente a `docs/design/system/SPACING_SYSTEM.md`, que este documento no duplica — solo referencia su relación (§4.4).
- El tratamiento del texto una vez que existe una región para él. Pertenece íntegramente a `docs/design/brand/TYPOGRAPHY_SYSTEM.md` (§4.5).
- Ningún componente ni patrón concreto. No es una guía de UI.

---

## 4. Contenido principal

### 4.1 Principios

Derivados exclusivamente de la documentación ya existente. Ninguno es nuevo.

| Principio | Fuente | Aplicación específica al grid |
|---|---|---|
| Claridad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.1, Principio IV; `docs/design/DESIGN_BRIEF.md` §4.11 | El Grid es la primera capa donde este principio actúa — antes de cualquier otro sistema (§2) |
| Simplicidad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.2; `docs/design/system/DESIGN_SYSTEM.md` §4.2 | El sistema debe resolver la estructura con el menor número de capas conceptuales necesarias — desarrollado en §4.2 |
| Consistencia | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.1 (Branded House); `docs/design/system/DESIGN_SYSTEM.md` §4.2, §4.8 | Fundamenta directamente el principio de Continuidad (§4.2.5) |
| Neutralidad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.2, §12; `docs/design/brand/COLOR_SYSTEM.md` §4.5 | Desarrollado íntegramente en §4.8 — extendido aquí de color y espacio a estructura |
| Accesibilidad | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.2; heredado de `TYPOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.4 y `SPACING_SYSTEM.md` §4.6 | Desarrollado en §4.7 |
| Escalabilidad | `docs/product/PRODUCT_PRINCIPLES.md`, Principio 9; `docs/design/system/DESIGN_SYSTEM.md` §4.2 | La estructura debe sostenerse sin cambios al incorporar nuevas pantallas, secciones o plataformas |

### 4.2 Arquitectura del Grid

Cinco capas conceptuales. Ninguna se resuelve con una columna, un breakpoint o una medida concreta; cada una define solo su responsabilidad.

#### 4.2.1 Estructura primaria

La división más fundamental de una pantalla en las áreas de mayor jerarquía (por ejemplo, un área de navegación distinta de un área de contenido principal). Es la capa más estable del sistema: cambia con menor frecuencia que cualquiera de las demás, y cualquier cambio sobre ella afecta a todo lo que depende de ella.

#### 4.2.2 Regiones funcionales

Subdivisiones de la Estructura primaria que agrupan contenido según su función dentro del producto (una región de búsqueda, una región de resultados, una región de acciones). No son componentes ni layouts — son áreas de responsabilidad funcional dentro de la estructura, anteriores a cualquier decisión de qué componente ocupará cada una.

#### 4.2.3 Zonas de contenido

Dentro de cada Región funcional, las áreas donde el contenido real se posiciona. Es la capa donde el Grid entrega el control a `SPACING_SYSTEM.md`: una vez que una Zona de contenido existe, la separación interna de lo que ocurre dentro de ella es responsabilidad de ese otro sistema, no de este (§4.4).

#### 4.2.4 Alineación

El principio por el cual elementos relacionados comparten un eje de referencia común, sin necesidad de columnas numeradas. La Alineación permite que una persona perciba relación entre elementos por su posición relativa — no por su proximidad (responsabilidad de Spacing), ni por su color (`COLOR_SYSTEM.md`), ni por su forma (`ICONOGRAPHY_SYSTEM.md`).

#### 4.2.5 Continuidad

El principio por el cual una misma estructura se mantiene reconocible a medida que la persona se desplaza entre pantallas del producto. Sin Continuidad, cada pantalla se percibiría como un producto distinto, contradiciendo directamente el modelo de marca única ya confirmado (`docs/design/brand/BRAND_ARCHITECTURE.md` §4.1: Branded House).

### 4.3 Organización de la Información

El Grid organiza, a nivel estructural y sin crear ninguna pantalla, los seis dominios funcionales del producto:

- **Navegación:** el Grid reserva una Región funcional constante para la orientación dentro del producto — coherente con el concepto central "Orientación" (`docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001) y con la categoría de Navegación ya definida en `docs/design/brand/ICONOGRAPHY_SYSTEM.md` §4.2.1. Su posición debe ser predecible en cualquier pantalla, no solo consistente en sí misma.
- **Búsqueda:** el Grid reserva una Región funcional que antecede estructuralmente a los Resultados, porque la búsqueda es la entrada al mecanismo de decisión que el producto existe para servir (`docs/design/brand/BRAND_FOUNDATIONS.md` §7).
- **Resultados:** el Grid organiza los resultados como una secuencia de Zonas de contenido equivalentes entre sí. La palabra "equivalentes" es determinante: la estructura no debe otorgar, por su posición dentro del Grid, más peso perceptual a un resultado que a otro sin una razón funcional real — desarrollado íntegramente en §4.8 (Neutralidad).
- **Comparación:** el Grid debe sostener la lectura simultánea de múltiples atributos de una misma fila (farmacia, canal, precio) mediante Alineación consistente entre filas (§4.2.4). Sin esa alineación, la comparación deja de ser instantánea y exige lectura secuencial, contradiciendo la propuesta de valor de decidir "en pocos segundos" (`docs/design/brand/BRAND_FOUNDATIONS.md` §14).
- **Detalle:** el Grid reserva una Estructura primaria distinta a la de Resultados para el detalle de un medicamento específico. La transición de "una lista de opciones equivalentes" a "una unidad de información profunda" debe ser reconocible estructuralmente, no solo por el contenido que aparece.
- **Acciones:** el Grid reserva una Región funcional predecible para las acciones disponibles (favorito, compartir, alerta). Su posición estructural debe mantenerse constante entre pantallas equivalentes, coherente con Continuidad (§4.2.5).

### 4.4 Relación con SPACING_SYSTEM

**El Grid posiciona. El Spacing separa. Ninguno sustituye al otro.**

`docs/design/system/SPACING_SYSTEM.md` §4.5 ya lo declaró: *"el grid define la estructura de columnas y alineación sobre la que se posiciona el contenido; el espaciado define la distancia entre ese contenido una vez posicionado sobre esa estructura."* Este documento es la contraparte formal de esa declaración, y ambos son, dentro de la arquitectura de `docs/design/system/DESIGN_SYSTEM.md` §4.1, Foundations hermanas — ninguna superior a la otra.

Un Grid sin Spacing produce una estructura sin respiración: las Zonas de contenido (§4.2.3) existirían, pero el contenido dentro de ellas se percibiría comprimido, contradiciendo la "respiración visual" ya exigida en `SPACING_SYSTEM.md` §4.3. Un Spacing sin Grid produce distancias consistentes entre elementos que no tienen una posición estructural coherente entre sí — la separación sería correcta, pero la Alineación (§4.2.4) no existiría. Ambas Foundations son necesarias y ninguna es suficiente por sí sola.

### 4.5 Relación con Tipografía

Sin duplicar `docs/design/brand/TYPOGRAPHY_SYSTEM.md`: el Grid determina **dónde** existe una región de texto (por ejemplo, la Región funcional de Detalle frente a la de Resultados); `TYPOGRAPHY_SYSTEM.md` determina **cómo** se trata el texto una vez que esa región ya existe (qué capa tipográfica —Display, Heading, Body, Caption, Data/Numeric— corresponde a cada Zona de contenido).

El Grid no decide tipografía, pero condiciona qué capas tipográficas son funcionalmente plausibles en cada Zona de contenido: una Zona dentro de la Región de Resultados es, por su naturaleza estructural, compatible con Data/Numeric y Heading, no con Display —`TYPOGRAPHY_SYSTEM.md` §4.2.1 ya reserva Display para "momentos de máximo impacto emocional o institucional", no para listas de resultados—. El Grid facilita la lectura al garantizar que cada capa tipográfica se aplique dentro de la región para la que es funcionalmente coherente, sin tomar esa decisión por su cuenta.

### 4.6 Adaptabilidad

Principios para Mobile, Tablet y Desktop, sin breakpoints, sin columnas y sin píxeles:

- **Mobile** es la condición primaria de diseño, mismo criterio ya establecido en `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.6 y `docs/design/DESIGN_BRIEF.md` §4.11. La Estructura primaria (§4.2.1) debe definirse primero para esta condición más restrictiva y expandirse hacia arriba, nunca al revés.
- En Mobile, la Estructura primaria tiende a **colapsar** Regiones funcionales que en Desktop pueden **coexistir** simultáneamente — por ejemplo, Búsqueda y Resultados pueden compartir el mismo plano visible en Desktop, mientras que en Mobile se presentan en secuencia. El sistema debe permitir que esa transición ocurra sin que la estructura deje de ser reconocible como la misma (Continuidad, §4.2.5).
- **Tablet** es un estado intermedio, mismo criterio ya aplicado en `SPACING_SYSTEM.md` y `TYPOGRAPHY_SYSTEM.md`: no requiere una Estructura primaria propia si el sistema define con claridad qué Regiones funcionales colapsan y cuáles se expanden entre los dos extremos.
- **Desktop** permite mayor coexistencia simultánea de Regiones funcionales sin que eso implique una Estructura primaria distinta — es una expansión de la misma estructura, no una estructura nueva.

### 4.7 Accesibilidad

Cómo una estructura consistente reduce la carga cognitiva, relacionado con Claridad, Neutralidad y Consistencia (§4.1):

Una persona no debería tener que re-aprender dónde encontrar la navegación o las acciones en cada pantalla — la Continuidad (§4.2.5) es, en sí misma, un mecanismo de accesibilidad cognitiva. Una estructura inconsistente exige que cada persona reconstruya mentalmente el mapa del producto en cada pantalla nueva, lo opuesto al propósito ya declarado del concepto central "Orientación" (DD-001). Y una Estructura primaria que respete la Neutralidad (§4.8) evita que la organización espacial, por sí misma, dificulte la comprensión objetiva de una comparación — una estructura sesgada no solo sería un problema de posicionamiento de marca, también sería una barrera de comprensión.

### 4.8 Neutralidad

Así como `docs/design/brand/COLOR_SYSTEM.md` evita sesgos mediante el color (§4.5 de ese documento) y `docs/design/system/SPACING_SYSTEM.md` evita sesgos mediante la proximidad (§4.2.3 de ese documento: "todas las secciones de resultado equivalentes deben usar el mismo Section Spacing"), el Grid debe evitar sesgos mediante la **organización estructural**.

**Principio arquitectónico:** ninguna farmacia debe ocupar sistemáticamente una posición privilegiada dentro de estructuras equivalentes sin una razón funcional explícita. El orden por precio efectivo ya calculado de forma objetiva por el sistema —`effective = min(store, online, cmr, sbpay)`, ya referenciado como "hecho ya calculado" en `docs/design/brand/COLOR_SYSTEM.md` §4.5— es una razón funcional explícita; una posición fija asignada por un acuerdo comercial no lo sería, y contradiría directamente `docs/design/brand/BRAND_FOUNDATIONS.md` §12 (*"no privilegiamos una farmacia por sobre otra por conveniencia comercial"*) y el Principio de producto 3, "Neutralidad" (§11.2).

Este documento no define ninguna regla visual para ese principio —no dice cómo debe verse una lista ordenada—; define únicamente que la Estructura primaria y las Regiones funcionales deben construirse de manera que la posición de una farmacia dentro de una lista de resultados sea siempre una consecuencia de un dato ya calculado, nunca una decisión de estructura tomada por fuera de ese cálculo.

### 4.9 Gobierno de Evolución

Cualquier Región funcional o Zona de contenido nueva debe justificarse formalmente por una necesidad real de organización de información, no por preferencia estética — mismo patrón "trazar o justificar" ya aplicado en toda la Arquitectura de Marca y en `docs/design/system/DESIGN_SYSTEM.md` §4.8. Ninguna Región funcional nueva puede introducirse sin verificar que no rompe la Continuidad (§4.2.5) con las regiones ya existentes en pantallas equivalentes.

Toda decisión de grid debe registrarse mediante el mismo mecanismo de decisiones de diseño ya establecido: `docs/design/decisions/DESIGN_DECISION_LOG.md` para decisiones de identidad de marca, y `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` para decisiones de arquitectura de producto, abierto en el Sprint DG.001 — Design System Governance.

**Ninguna implementación futura de columnas, breakpoints o cualquier framework de layout puede contradecir las cinco capas conceptuales de §4.2 ni los principios de §4.1.** Bajo la arquitectura ya definida en `docs/design/system/DESIGN_SYSTEM.md` §4.4, esa implementación es un Design Token o una decisión de Componente/Patrón — nunca una decisión de esta Foundation. Este documento seguirá siendo válido sin importar qué sistema de columnas, framework de interfaz o tecnología se adopte después, porque no gobierna esa implementación — gobierna el propósito estructural que cualquier implementación deberá cumplir. Con esto, el vacío de Foundation "grid" señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3 queda cerrado.

---

## 5. Relaciones

`GRID_SYSTEM.md` depende directamente de `docs/design/system/DESIGN_SYSTEM.md`, que identificó el grid como Foundation pendiente de gobierno, y de `docs/design/system/SPACING_SYSTEM.md`, cuya distinción entre estructura y distancia (§4.5 de ese documento) este documento formaliza y desarrolla (§4.4). Depende también de `docs/design/brand/BRAND_GUIDELINES.md` (gobierno de convivencia entre sistemas), `docs/design/brand/TYPOGRAPHY_SYSTEM.md` (relación de facilitación de lectura, §4.5), `docs/design/brand/COLOR_SYSTEM.md` (cuyo principio de Neutralidad se extiende aquí a la estructura, §4.8) y `docs/design/brand/ICONOGRAPHY_SYSTEM.md` (categoría de Navegación, referenciada en §4.3).

Su responsabilidad específica es distinta a la de cada uno de esos documentos: ninguno de ellos define las capas conceptuales de la estructura espacial del producto ni cómo esa estructura debe organizar los seis dominios funcionales de ComparaFarma. Con la creación de este documento, las tres Foundations señaladas como vacío en `docs/design/system/DESIGN_SYSTEM.md` §4.3 —tipografía, color e iconografía ya gobernadas; espaciado y grid, antes pendientes— quedan reducidas a una sola Foundation todavía sin gobierno propio: elevación.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Grid como Foundation pendiente de gobierno | `docs/design/system/DESIGN_SYSTEM.md` §4.3 | ✔ — este documento cierra ese vacío | — |
| Distinción Grid (estructura) / Spacing (distancia) | `docs/design/system/SPACING_SYSTEM.md` §4.5 | ✔ — formalizada y desarrollada en §4.4 | — |
| Principios de marca y producto aplicables | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/product/PRODUCT_PRINCIPLES.md`, `docs/design/system/DESIGN_SYSTEM.md` §4.2 | ✔ — consolidados en §4.1 | Ningún principio nuevo agregado |
| Jerarquía de la información como parte de la identidad | `docs/design/DESIGN_BRIEF.md` §4.11 | ✔ — fundamenta §2 | — |
| Concepto central "Orientación" | `docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001 | ✔ — fundamenta la Región funcional de Navegación (§4.3) | — |
| Neutralidad entre farmacias | `docs/design/brand/BRAND_FOUNDATIONS.md` §12, §11.2; `docs/design/brand/COLOR_SYSTEM.md` §4.5; `docs/design/system/SPACING_SYSTEM.md` §4.2.3 | ✔ — extendida a la estructura en §4.8 | Tercera aplicación del mismo principio, tras color y espacio |
| Contrato de datos (precio efectivo) | `CLAUDE.md` (raíz del repositorio) — `effective = min(...)` | ✔ — fundamenta el criterio de "razón funcional explícita" en §4.8 | Referencia técnica, ya citada en `COLOR_SYSTEM.md` §6 |
| Capas tipográficas y su compatibilidad con regiones estructurales | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.2 | ✔ — relación explicada en §4.5, sin duplicar sus capas | — |
| Categoría de Navegación en iconografía | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` §4.2.1 | ✔ — referenciada en §4.3 | — |
| Registro de decisiones de arquitectura de producto | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` | ✔ — creado en el Sprint DG.001 — Design System Governance (§4.9) | Vacío cerrado |
| Columnas, breakpoints, layouts concretos | — (no existe documento de implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de una decisión de implementación futura |

---

## 7. Gobierno

`GRID_SYSTEM.md` **no reemplaza**:

- `docs/design/system/DESIGN_SYSTEM.md` — sigue siendo la única fuente de la arquitectura completa de capas del Design System, dentro de la cual este documento es una Foundation, no un nivel superior ni independiente.
- `docs/design/system/SPACING_SYSTEM.md` — sigue siendo la única fuente de la distancia entre elementos ya posicionados; este documento no la duplica ni la reemplaza, solo formaliza su frontera compartida (§4.4).
- `docs/design/brand/BRAND_GUIDELINES.md` y los cuatro sistemas de identidad que integra — siguen siendo la única fuente de gobierno de identidad de marca.
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md` — sigue siendo la única fuente del tratamiento tipográfico; este documento solo señala su punto de coordinación (§4.5).

La responsabilidad específica de `GRID_SYSTEM.md` dentro de la Arquitectura de Marca y del Design System es gobernar exclusivamente los **principios y las capas conceptuales** de la estructura espacial: qué responsabilidad cumple cada capa, cómo se organiza la información del producto a nivel estructural, y cómo esa estructura evita introducir sesgos entre farmacias. No gobierna, y no debe absorber en ninguna revisión futura, ninguna columna, breakpoint, Design Token, layout o tecnología de implementación — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido sin importar qué sistema de columnas o framework se adopte en el futuro.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en todo `docs/brand/` y `docs/design-system/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** El registro de decisiones de arquitectura de producto, antes pendiente, ya existe en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` (Sprint DG.001 — Design System Governance).

---

## 8. Documentos relacionados

- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/SPACING_SYSTEM.md`
- `docs/design/brand/BRAND_GUIDELINES.md`
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/design/brand/COLOR_SYSTEM.md`
- `docs/design/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/BRAND_ARCHITECTURE.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: la futura implementación concreta de columnas y breakpoints (Design Tokens), el futuro catálogo de componentes vivo ya anticipado en `docs/design/system/DESIGN_SYSTEM.md` §4.5, y un futuro documento de gobierno de la Foundation "elevación", última Foundation todavía sin documento propio.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Cierra el vacío de la Foundation "grid" señalado en `docs/design/system/DESIGN_SYSTEM.md` §4.3 y formaliza la distinción entre Grid y Spacing ya anticipada en `SPACING_SYSTEM.md` §4.5. Define principios derivados sin invención, cinco capas conceptuales (Estructura primaria, Regiones funcionales, Zonas de contenido, Alineación, Continuidad), organización estructural de los seis dominios funcionales del producto, relación con Spacing y con Tipografía sin duplicar ninguno, principios de adaptabilidad mobile/tablet/desktop, accesibilidad estructural, y el principio de Neutralidad estructural (ninguna farmacia debe ocupar sistemáticamente una posición privilegiada sin razón funcional explícita). No define columnas, breakpoints, píxeles ni tecnología. | `docs/design/system/DESIGN_SYSTEM.md` v1.0; `docs/design/system/SPACING_SYSTEM.md` v1.0; `docs/design/brand/BRAND_GUIDELINES.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0 |
| 1.1 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Sprint DG.001 — Design System Governance. Se actualiza la referencia al registro de decisiones de arquitectura del dominio `docs/design-system/`: ya no está señalado como ausente ni pendiente; el registro formal existe en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`. No se modifica ningún contenido arquitectónico de este documento. | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de espaciado | Design Systems Architect / Spatial Systems Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de grid, cerrando el vacío de Foundation señalado en `DESIGN_SYSTEM.md` | Design Systems Architect / Information Architecture Director / Enterprise Documentation Architect | `docs/design/system/GRID_SYSTEM.md` v1.0 |
| 2026-08-05 | Sprint DG.001 — Design System Governance. Actualización de referencia cruzada: el registro de decisiones del dominio ya no está pendiente. | Design Systems Architect / Enterprise Documentation Architect | `docs/design/system/GRID_SYSTEM.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Queda pendiente, y fuera de esta versión, la última Foundation señalada en `docs/design/system/DESIGN_SYSTEM.md` §4.3 todavía sin gobierno propio: elevación. También queda pendiente la implementación concreta de columnas, breakpoints y layouts. El registro formal de decisiones de arquitectura del dominio, antes señalado como vacío, ya no está pendiente: existe en `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md`.
