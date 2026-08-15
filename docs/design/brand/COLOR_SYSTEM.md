# COLOR_SYSTEM — Especificación Oficial del Sistema de Color de ComparaFarma

Este documento no define una paleta cromática definitiva, no elige colores corporativos, no selecciona códigos HEX, no reemplaza un Brand Book y no es una guía gráfica. Es la **especificación oficial del sistema de color**: qué responsabilidades funcionales cumple el color dentro de la marca, qué principios debe respetar cualquier paleta futura, y qué reglas gobiernan su neutralidad, su accesibilidad y su evolución. Debe seguir siendo válido aunque, dentro de cinco años, cambie por completo la paleta cromática de ComparaFarma — porque no gobierna esa elección, gobierna los principios y la arquitectura bajo los que esa elección deberá tomarse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-COL-001 |
| **Nombre** | COLOR_SYSTEM.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Brand Architect / Color Systems Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — quinto grado de derivación: se apoya directamente en `docs/brand/LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md` e `ICONOGRAPHY_SYSTEM.md` (tercer, cuarto y quinto grado), y en `VISUAL_IDENTITY.md`/`DESIGN_CONCEPT.md`, todos derivados de `docs/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Arquitectura de Marca / Especificación de Sistema |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura** del sistema de color. No es fuente de identidad (`BRAND_FOUNDATIONS.md`), de percepción visual (`VISUAL_IDENTITY.md`), de estructura de logotipo, tipografía o iconografía (`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`), ni de ninguna paleta, código cromático o valor HEX concreto (no definidos) |
| **Documentos de los que depende** | `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/brand/DESIGN_CONCEPT.md`, `docs/design/DESIGN_BRIEF.md`, `docs/brand/LOGO_SYSTEM.md`, `docs/brand/TYPOGRAPHY_SYSTEM.md`, `docs/brand/ICONOGRAPHY_SYSTEM.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura selección concreta de una paleta cromática (documento de implementación, no creado) y cierra el punto "COLOR_SYSTEM" ya anticipado en el roadmap de `VISUAL_IDENTITY.md` §4.9, `DESIGN_CONCEPT.md` §4.10, `LOGO_SYSTEM.md` §8 y `TYPOGRAPHY_SYSTEM.md` §8 |
| **Pregunta que responde** | ¿Cómo debe gobernarse el color dentro de ComparaFarma para mantener una identidad coherente, accesible y neutral a lo largo del tiempo? |

---

## 2. Propósito

El color, dentro de ComparaFarma, no es un elemento decorativo: es un **sistema de comunicación** con una responsabilidad más delicada que la de cualquier otro componente visual de la marca, porque el producto existe específicamente para presentar una **comparación** — de precios, de farmacias, de canales — de la que la persona debe poder confiar que es objetiva. `docs/brand/BRAND_FOUNDATIONS.md` §12 declara, sin ambigüedad, que ComparaFarma *"no privilegia una farmacia por sobre otra por conveniencia comercial"*, y `docs/design/DESIGN_BRIEF.md` §4.11 ya advierte que el color *"debe evitar los códigos cromáticos que el usuario asocia automáticamente con farmacia... o con seguridad financiera tipo fintech"*. Un sistema de color mal gobernado no solo sería un error estético: podría introducir, sin intención, un sesgo visual en la comparación misma que constituye la propuesta de valor central de la marca.

Este documento existe para que esa responsabilidad no dependa de decisiones de color aisladas, tomadas pantalla por pantalla, sino de una arquitectura y unos principios estables que cualquier paleta futura deba cumplir.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema de color, consolidados sin invención desde `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` y `DESIGN_BRIEF.md` (§4.1).
- Las responsabilidades funcionales del color — siete capas — y el propósito de cada una, sin definir colores concretos (§4.2).
- Principios generales de aplicación del color, sin implementaciones (§4.3).
- Principios de accesibilidad cromática, sin ratios de contraste concretos (§4.4).
- El principio de neutralidad del color, con relación explícita a `BRAND_FOUNDATIONS.md` (§4.5).
- Reglas de evolución para la incorporación de nuevos colores al sistema (§4.6).
- La relación funcional entre el color y cada uno de los sistemas ya vigentes — logotipo, tipografía, iconografía — sin duplicar sus responsabilidades (§4.7).

**Este documento NO define:**

- Ninguna paleta cromática, código HEX, RGB o valor de color concreto.
- Ningún color específico como decisión de marca — no se elige, menciona ni descarta verde, azul, ni ningún otro color como código de identidad.
- Ningún componente de interfaz de usuario ni patrón de UI. Corresponde a un futuro `DESIGN_SYSTEM` de producto, no creado.
- La estructura del logotipo, las capas tipográficas o las categorías de iconografía. Pertenecen íntegramente a `docs/brand/LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md` e `ICONOGRAPHY_SYSTEM.md`, ya vigentes, que este documento no duplica — solo referencia su relación con el color (§4.7).
- Ratios de contraste, valores de luminancia ni métricas absolutas de accesibilidad. Corresponden a especificaciones técnicas de implementación, no a esta especificación de sistema.
- Un manual gráfico con ejemplos visuales de paleta aplicada. Corresponde a un futuro `BRAND_GUIDELINES.md`, no creado.
- Ninguna decisión de identidad, arquitectura de marca o percepción visual ya tomada en `BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md` o `DESIGN_CONCEPT.md`. Este documento no las reinterpreta.

---

## 4. Contenido principal

### 4.1 Principios del Sistema

Consolidados sin agregar ninguno nuevo, desde las fuentes ya aprobadas de Brand Foundations, Visual Identity y Design Brief.

| Principio | Fuente | Aplicación específica al color |
|---|---|---|
| Claridad | `BRAND_FOUNDATIONS.md` §11.1, Principio IV; `VISUAL_IDENTITY.md` §4.2 | El color debe reducir el esfuerzo de comprensión, nunca agregarlo — fundamenta §4.3 |
| Neutralidad | `BRAND_FOUNDATIONS.md` §11.2, Principio de producto 3; §14 ("plataforma neutral"); §12 | Es el principio más determinante de todo este documento — desarrollado íntegramente en §4.5 |
| Confianza | `BRAND_FOUNDATIONS.md` §11.1, Principio II; `VISUAL_IDENTITY.md` §4.2, §4.3 (atributo "Confiable") | Un uso de color que sugiriera sesgo, aunque fuera involuntario, erosionaría directamente la confianza ya declarada como el atributo más consolidado del corpus documental |
| Accesibilidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2, citando `BRAND_AUDIT.md` §2 | Fundamenta íntegramente §4.4 |
| Consistencia | Derivado del modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1), mismo criterio ya aplicado en `TYPOGRAPHY_SYSTEM.md` §4.1 e `ICONOGRAPHY_SYSTEM.md` §4.1 | Un mismo significado cromático debe sostenerse igual en todos los canales; un color no puede significar una cosa en la app y otra en el sitio web |
| Orientación | Concepto central de diseño ya aprobado (`docs/design/DESIGN_DECISION_LOG.md`, DD-001) | Aplicado con matiz: el color puede ayudar a orientar la lectura de la información (§4.2.4, §4.2.7), pero nunca al costo de la Neutralidad — esta tensión se resuelve explícitamente en §4.5 |

### 4.2 Arquitectura del Color

Siete responsabilidades funcionales. Ninguna se resuelve con un color concreto; cada una define solo su propósito dentro del sistema.

#### 4.2.1 Color de Marca

Responsabilidad reservada para representar a la marca misma — su eventual aplicación sobre el isotipo, el wordmark o encabezados institucionales. Debe usarse con moderación y con el mismo tratamiento en todos los canales, consecuencia directa del principio de Consistencia (§4.1) y del modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1: un solo nombre cubre empresa, plataforma y canales).

#### 4.2.2 Color de Interfaz

Responsabilidad de organizar visualmente la estructura de la interfaz — contenedores, separadores, bordes. Su función es dar orden, no comunicar significado; no debe confundirse con el Color Semántico (§4.2.3) ni con el Color Informativo (§4.2.4).

#### 4.2.3 Color Semántico

Responsabilidad de comunicar un significado funcional convencional (éxito, error, advertencia, información del sistema). Debe usarse con el repertorio más reducido posible y de forma predecible en todo el sistema, coherente con Claridad y Consistencia (§4.1). Esta capa tiene una restricción particular: **no debe usarse para indicar cuál farmacia, precio o resultado es "mejor" dentro de una comparación** — eso no es un significado semántico convencional (como "error" o "éxito"), es un juicio de valor sobre la comparación misma, y por tanto pertenece exclusivamente a la disciplina de neutralidad definida en §4.5, no a esta capa.

#### 4.2.4 Color Informativo

Responsabilidad de diferenciar categorías de información sin implicar jerarquía de valor entre ellas — por ejemplo, distinguir visualmente los distintos canales de precio del producto (presencial, online, con tarjeta de fidelización, SBPay) ya definidos en el contrato de datos de la plataforma. Su función es diferenciar, no jerarquizar: ningún canal debe percibirse cromáticamente como "superior" a otro solo por la categoría a la que pertenece.

#### 4.2.5 Color de Énfasis

Responsabilidad restringida para dirigir la atención hacia un elemento puntual — una acción principal, un dato crítico. Debe ser el recurso menos utilizado de todo el sistema, coherente con la restricción ya declarada contra elementos de urgencia agresiva (`docs/design/DESIGN_BRIEF.md` §4.10). Un sistema que recurre al énfasis cromático con frecuencia deja de tener énfasis: lo diluye.

#### 4.2.6 Color de Fondo

Responsabilidad de establecer el plano base sobre el que se organiza toda la interfaz. Debe sostener el contraste necesario para todas las demás capas (§4.4) y funcionar de forma coherente tanto en modo claro como en modo oscuro — el producto ya declara soporte de modo oscuro como funcionalidad implementada, lo que hace de esta capa una responsabilidad doble (clara/oscura), no una sola superficie fija.

#### 4.2.7 Color de Datos

La capa más específica y más sensible de todo este sistema: color aplicado a precios, montos de ahorro, disponibilidad y comparación entre farmacias. Es, por definición, la capa donde el riesgo de introducir un sesgo visual es más alto — y por tanto la que queda sujeta, de forma más estricta que ninguna otra, a la disciplina de neutralidad definida en §4.5.

### 4.3 Principios de Aplicación

Reglas generales, sin definir implementaciones:

- **El color nunca debe ser el único portador de significado.** Todo significado comunicado por color debe tener un equivalente redundante en texto, forma o posición — consecuencia directa de Accesibilidad (§4.1) y desarrollado en §4.4.
- **El color nunca debe alterar la neutralidad de la comparación.** Ningún uso de color puede hacer que una opción parezca objetivamente mejor por razones distintas a los datos que el sistema ya calcula — desarrollado íntegramente en §4.5.
- **El color debe reforzar la comprensión, no sustituirla.** Un color no resuelve por sí solo la necesidad de que una persona entienda una comparación; acompaña a la información, no la reemplaza.
- **El color debe reducir la carga cognitiva, no aumentarla.** Cuantos menos significados cromáticos distintos deba recordar una persona para usar el producto, más se cumple el principio de Claridad (§4.1).
- **El color debe apoyar la jerarquía visual, nunca sustituir a la tipografía como su mecanismo primario.** `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.5 ya exige que la jerarquía tipográfica funcione "incluso sin color"; este documento no contradice esa exigencia — el color es, por diseño de sistema, una capa de refuerzo secundaria sobre una jerarquía que ya debe sostenerse sin él.

### 4.4 Accesibilidad

Principios, sin ratios concretos — fundamentados en el principio de Accesibilidad ya consolidado (§4.1):

- **Contraste:** suficiente entre cualquier combinación de Color de Fondo (§4.2.6) y las demás capas, en modo claro y en modo oscuro por igual.
- **Legibilidad:** ninguna combinación de color puede comprometer la legibilidad ya exigida por el sistema tipográfico (`TYPOGRAPHY_SYSTEM.md` §4.7).
- **Percepción:** el sistema debe considerarse desde la perspectiva de percepción real de distintas personas, no desde una percepción de referencia única.
- **Daltonismo:** ningún significado del Color Semántico (§4.2.3), Informativo (§4.2.4) o de Datos (§4.2.7) puede depender exclusivamente de la distinción entre tonalidades que una persona con daltonismo no pueda diferenciar con seguridad.
- **Redundancia visual:** todo significado cromático crítico —en particular cuál es el mejor precio de una comparación— debe poder entenderse igual de bien si el color se elimina por completo, mediante texto, posición, forma o iconografía ya definida en `ICONOGRAPHY_SYSTEM.md`.

### 4.5 Neutralidad

Este es el principio más determinante de todo el sistema de color de ComparaFarma, y se relaciona de forma directa y explícita con `docs/brand/BRAND_FOUNDATIONS.md`: el Principio de producto 3, "Neutralidad" (§11.2), la Diferenciación declarada como "plataforma neutral" (§14), y la restricción explícita de que ComparaFarma *"no privilegia una farmacia por sobre otra por conveniencia comercial"* (§12).

El color debe evitar introducir sesgos, específicamente en:

- **Comparación de precios:** el sistema sí necesita resaltar visualmente cuál es el mejor precio disponible — es la propuesta de valor central del producto, ya declarada como "conocer, en pocos segundos, dónde un medicamento tiene el mejor precio" (`BRAND_FOUNDATIONS.md` §14). Este documento no prohíbe ese resalte. Lo que prohíbe es que ese resalte se construya reutilizando un color que, en cualquier otro punto del sistema, ya cargue un significado semántico distinto (por ejemplo, "aprobado" o "correcto" en el Color Semántico, §4.2.3) — el resalte del mejor precio debe ser una función exclusiva del Color de Datos (§4.2.7), nunca una colisión con el Color Semántico.
- **Farmacias:** ningún color puede asociarse de forma permanente a una farmacia específica de manera que la distinga visualmente como preferida o como advertencia. Esta regla extiende al color la misma restricción ya impuesta a la iconografía de farmacias en `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.2.7.
- **Resultados y rankings:** el orden de una lista de resultados puede comunicarse por posición, por tipografía o por el dato numérico mismo — nunca exclusivamente por un degradado o código de color que jerarquice visualmente las opciones antes de que la persona lea la información real.
- **Recomendaciones:** ComparaFarma *"no emite recomendaciones médicas ni diagnósticos"* y *"no privilegia una farmacia por conveniencia comercial"* (`BRAND_FOUNDATIONS.md` §12). Ningún uso de color puede simular una recomendación implícita —un resaltado que sugiera "esta es la opción que ComparaFarma recomienda"— que no sea, exclusivamente, el reflejo visual de un hecho ya calculado de forma objetiva por el sistema (el precio efectivo mínimo entre los canales disponibles, ya definido en el contrato de datos de la plataforma). El color solo puede reflejar ese cálculo ya existente; nunca puede añadir un juicio de valor adicional que el sistema no haya calculado.

### 4.6 Evolución del Sistema

Todo color nuevo, para incorporarse al sistema, debe:

1. **Encajar en una de las siete responsabilidades funcionales ya definidas (§4.2)** o justificar formalmente la creación de una responsabilidad nueva antes de incorporarse — mismo principio de evolución ya aplicado por analogía en `docs/brand/LOGO_SYSTEM.md` §5 e `ICONOGRAPHY_SYSTEM.md` §4.7.
2. **No introducir un significado semántico paralelo o contradictorio** al ya establecido en el Color Semántico (§4.2.3) — dos colores no pueden significar lo mismo, y un color no puede cambiar de significado entre canales.
3. **Registrarse como una decisión de diseño**, siguiendo el mismo mecanismo de gobierno que ya exige `docs/design/DESIGN_DECISION_LOG.md`, con la misma observación de gobierno ya señalada en `LOGO_SYSTEM.md` §5 e `ICONOGRAPHY_SYSTEM.md` §5: ese registro es el mecanismo correcto, aunque hoy no exista todavía una fila específica para decisiones de color.

Ninguna incorporación de color puede romper la arquitectura de siete capas ya definida en este documento, ni la disciplina de neutralidad definida en §4.5, sin importar cuán conveniente parezca desde una necesidad de diseño puntual.

### 4.7 Relación con otros Sistemas

El color no actúa de forma aislada — interactúa con cada uno de los sistemas ya vigentes, sin duplicar sus responsabilidades:

- **Con `LOGO_SYSTEM.md`:** el isotipo es, por construcción, monocromo — las versiones oficiales de reproducción (positivo, negativo, monocromo, una tinta) ya están definidas en `LOGO_SYSTEM.md` §4.5 sin ninguna dependencia de color. Cualquier aplicación futura del Color de Marca (§4.2.1) sobre el isotipo constituiría una versión adicional, y por tanto requeriría la misma aprobación formal explícita que `LOGO_SYSTEM.md` §4.5 ya exige para cualquier versión no contemplada.
- **Con `TYPOGRAPHY_SYSTEM.md`:** la jerarquía tipográfica ya fue definida para funcionar "incluso sin color" (`TYPOGRAPHY_SYSTEM.md` §4.5). Este documento no lo contradice: el color es una capa de refuerzo sobre una jerarquía que ya debe sostenerse por sí sola.
- **Con `ICONOGRAPHY_SYSTEM.md`:** el color no debe usarse para resolver una ambigüedad de forma entre íconos — `ICONOGRAPHY_SYSTEM.md` §4.6 ya exige que los íconos se diferencien por su geometría. El color puede reforzar una categoría de ícono ya distinguible por forma; nunca puede ser el único mecanismo que la distinga de otra.
- **Con `VISUAL_IDENTITY.md`:** los atributos de percepción ya consolidados —Confiable, Científica, Profesional, Cercana (`VISUAL_IDENTITY.md` §4.3)— siguen siendo el criterio contra el que cualquier paleta futura deberá evaluarse. Este documento no repite esos atributos: los hereda como condición de fondo de cualquier decisión de color posterior.

---

## 5. Relaciones

`COLOR_SYSTEM.md` depende, en cadena, de toda la Arquitectura de Marca ya construida: `BRAND_FOUNDATIONS.md` (identidad y neutralidad como principio de producto), `BRAND_ARCHITECTURE.md` (modelo Branded House, fuente del principio de Consistencia), `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md` (principios y atributos de percepción), `DESIGN_BRIEF.md` (restricciones cromáticas ya declaradas contra farmacia y fintech), y los tres sistemas ya vigentes —`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`— con los que se relaciona sin duplicar responsabilidades (§4.7).

Su responsabilidad específica dentro de la Arquitectura de Marca es distinta a la de cada uno de esos documentos: ninguno de ellos define cuántas responsabilidades funcionales tiene el color, ni cómo debe gobernarse su neutralidad frente a una comparación de precios y farmacias — el riesgo más específico y más grave que el color introduce en este producto en particular, y que ningún otro sistema de la Arquitectura de Marca aborda directamente.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Principios de marca y percepción visual | `docs/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` | ✔ — aplicados al sistema de color (§4.1) | Ningún principio nuevo agregado |
| Neutralidad (Principio de producto 3) | `docs/brand/BRAND_FOUNDATIONS.md` §11.2, §14, §12 | ✔ — desarrollado íntegramente en §4.5 | Principio más determinante de todo el documento |
| Restricciones cromáticas contra farmacia/fintech | `docs/design/DESIGN_BRIEF.md` §4.11 | ✔ — fundamenta §2 y §4.2.5 | — |
| Concepto central "Orientación" | `docs/design/DESIGN_DECISION_LOG.md`, DD-001 | ✔ — aplicado con matiz a §4.2.4, §4.2.7, resuelto por §4.5 | Tensión explícita entre orientación y neutralidad, resuelta a favor de la neutralidad |
| Jerarquía tipográfica independiente del color | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.5 | ✔ — condiciona el rol secundario del color en §4.3, §4.7 | — |
| Diferenciación de íconos por forma, no por color | `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.6 | ✔ — condiciona §4.3, §4.7 | — |
| Neutralidad de la categoría "Farmacias" en iconografía | `docs/brand/ICONOGRAPHY_SYSTEM.md` §4.2.7 | ✔ — extendida al color en §4.5 | — |
| Versiones oficiales de reproducción del isotipo (sin color) | `docs/brand/LOGO_SYSTEM.md` §4.5 | ✔ — condiciona §4.2.1, §4.7 | Cualquier versión con color requiere aprobación formal explícita |
| Contrato de datos (canales de precio, precio efectivo) | `CLAUDE.md` (raíz del repositorio) — contrato de tipos `PriceChannels`, `effective` | ✔ — fundamenta la distinción entre Color Informativo (§4.2.4) y Color de Datos (§4.2.7), y el criterio de "hecho ya calculado" en §4.5 | Referencia técnica, no de marca; se cita porque el sistema de color debe reflejar ese cálculo, no reinterpretarlo |
| Paleta cromática, códigos HEX o colores concretos | — (no existe documento de implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de una decisión de implementación futura |

---

## 7. Gobierno

`COLOR_SYSTEM.md` **no reemplaza**:

- `docs/brand/BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` — siguen siendo la única fuente de identidad, arquitectura de marca, principios de percepción y concepto de diseño.
- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y de las restricciones cromáticas ya declaradas.
- `docs/brand/LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md` e `ICONOGRAPHY_SYSTEM.md` — siguen siendo la única fuente de estructura de logotipo, tipografía e iconografía, con las que este documento se relaciona (§4.7) sin duplicar su contenido.

La responsabilidad específica de `COLOR_SYSTEM.md` dentro de la Arquitectura de Marca es gobernar exclusivamente los **principios, la arquitectura funcional y las reglas de neutralidad y evolución** del uso del color: sus siete responsabilidades funcionales, sus principios de aplicación y accesibilidad, y —de forma más específica que en cualquier otro sistema ya vigente— la disciplina de neutralidad que el color debe respetar frente a la comparación de precios y farmacias que constituye el núcleo del producto. No gobierna, y no debe absorber en ninguna revisión futura, la selección de una paleta cromática concreta, códigos HEX, ni ninguna decisión de componentes de interfaz — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito declarado en §2: este documento debe seguir siendo válido aunque cambie por completo la paleta cromática de ComparaFarma.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en el resto de `docs/brand/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

- `docs/brand/BRAND_FOUNDATIONS.md`
- `docs/brand/BRAND_ARCHITECTURE.md`
- `docs/brand/VISUAL_IDENTITY.md`
- `docs/brand/DESIGN_CONCEPT.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/brand/LOGO_SYSTEM.md`
- `docs/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/design/DESIGN_DECISION_LOG.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: el futuro documento de selección de paleta cromática concreta, `BRAND_GUIDELINES.md`, y el futuro `DESIGN_SYSTEM` de producto de `mobile/` y `web/`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la especificación oficial de principios y arquitectura del sistema de color: principios (claridad, neutralidad, confianza, accesibilidad, consistencia, orientación), siete responsabilidades funcionales (Marca, Interfaz, Semántico, Informativo, Énfasis, Fondo, Datos), principios de aplicación, accesibilidad, disciplina de neutralidad relacionada explícitamente con `BRAND_FOUNDATIONS.md`, reglas de evolución del sistema, y relación con `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md` e `ICONOGRAPHY_SYSTEM.md`. No define paleta, códigos HEX ni ningún color concreto. | `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `DESIGN_CONCEPT.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/brand/LOGO_SYSTEM.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición de la especificación oficial del sistema de logotipo | Brand Architect / Identity Systems Director / Enterprise Documentation Architect | `docs/brand/LOGO_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema tipográfico | Brand Architect / Type Director / Enterprise Documentation Architect | `docs/brand/TYPOGRAPHY_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de iconografía | Iconography Director / Design Systems Architect / Enterprise Documentation Architect | `docs/brand/ICONOGRAPHY_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de color | Brand Architect / Color Systems Director / Enterprise Documentation Architect | `docs/brand/COLOR_SYSTEM.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. La selección de una paleta cromática concreta queda, en su totalidad, fuera de esta versión y pendiente de trabajo de diseño posterior.
