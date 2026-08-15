# ICONOGRAPHY_SYSTEM — Especificación Oficial del Sistema de Iconografía de ComparaFarma

Este documento no diseña íconos, no selecciona una librería, no reemplaza un Design System y no define componentes de interfaz. Es la **especificación oficial del sistema de iconografía**: qué categorías funcionales lo componen, qué principios debe cumplir cualquier ícono futuro, y qué reglas gobiernan su construcción, su estilo, su escalabilidad y su evolución. Debe seguir siendo válido aunque, en el futuro, cambie por completo la librería de íconos utilizada por ComparaFarma — porque no gobierna esa implementación, gobierna los principios y la arquitectura bajo los que cualquier implementación deberá construirse.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-ICO-001 |
| **Nombre** | ICONOGRAPHY_SYSTEM.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Iconography Director / Design Systems Architect / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — se apoya directamente en `docs/design/brand/LOGO_SYSTEM.md` y `docs/design/brand/TYPOGRAPHY_SYSTEM.md` (tercer y cuarto grado de derivación), y en `docs/design/brand/VISUAL_IDENTITY.md` / `DESIGN_CONCEPT.md`, todos derivados de `docs/design/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Arquitectura de Marca / Especificación de Sistema |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura** del sistema de iconografía. No es fuente de identidad (`BRAND_FOUNDATIONS.md`), de percepción visual (`VISUAL_IDENTITY.md`), de estructura de logotipo (`LOGO_SYSTEM.md`), de sistema tipográfico (`TYPOGRAPHY_SYSTEM.md`) ni de ningún ícono, catálogo o librería concreta (no creados) |
| **Documentos de los que depende** | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/design/DESIGN_BRIEF.md`, `docs/design/brand/LOGO_SYSTEM.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `docs/design/BRAND_IDENTITY_VALIDATION.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura selección o construcción concreta de un catálogo o librería de íconos (no creado), y cierra el punto "ICONOGRAPHY" ya anticipado en el roadmap de `VISUAL_IDENTITY.md` §4.9, `DESIGN_CONCEPT.md` §4.10, `LOGO_SYSTEM.md` §8 y `TYPOGRAPHY_SYSTEM.md` §8 |
| **Pregunta que responde** | ¿Cómo debe gobernarse el sistema de iconografía de ComparaFarma para mantener una identidad visual coherente a lo largo del tiempo? |

---

## 2. Propósito

La iconografía de ComparaFarma no es un conjunto de elementos decorativos que acompañan a la interfaz: es un **lenguaje visual permanente** con el que el producto comunica, sin palabras, qué se puede hacer, qué está ocurriendo y qué significa cada pieza de información en el momento exacto en que una persona está comparando precios de medicamentos para decidir. `docs/design/DESIGN_BRIEF.md` §4.11 ya declara que la iconografía debe ser *"coherente con el territorio 'Decisiones, Orientación, Confianza, Cuidado familiar'"* y evitar por completo la iconografía clínica y transaccional restringida — es decir, la iconografía no es neutral respecto del posicionamiento de marca: cada ícono que el producto usa refuerza o contradice, todos los días y en cada pantalla, la categoría que ComparaFarma declaró ser (`BRAND_FOUNDATIONS.md` §13, "Plataforma de Inteligencia Farmacéutica para personas") y las categorías de las que debe alejarse (`BRAND_FOUNDATIONS.md` §12).

Este documento existe para que esa responsabilidad no dependa de decisiones aisladas tomadas ícono por ícono, sino de una arquitectura y unos principios estables que cualquier ícono, presente o futuro, deba cumplir.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema de iconografía, consolidados sin invención desde `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` y `DESIGN_BRIEF.md` (§4.1).
- Las categorías funcionales de la arquitectura de iconografía y el propósito de cada una, sin definir íconos específicos (§4.2).
- Principios generales de construcción geométrica, sin fijar medidas ni retícula (§4.3).
- Principios de estilo visual (outline / filled / híbrido, nivel de detalle, espacio negativo), sin decidir uno como definitivo (§4.4).
- Principios de escalabilidad entre tamaños de uso, sin definir píxeles (§4.5).
- Principios de accesibilidad iconográfica, sin métricas concretas (§4.6).
- Reglas de evolución para la incorporación de íconos nuevos (§4.7).
- La relación funcional entre el isotipo, la iconografía y la interfaz, sin confundir sus roles (§4.8).

**Este documento NO define:**

- Ningún ícono específico, forma, trazo o composición gráfica concreta. No es un catálogo de iconografía ni una librería.
- Ninguna librería de íconos, comercial o de código abierto. Esa selección corresponde a una decisión de implementación técnica futura, fuera del alcance de una especificación de sistema.
- Ningún componente de interfaz de usuario (botones, tarjetas, listas, patrones de interacción). Corresponde a un futuro `DESIGN_SYSTEM` de producto, no creado.
- Ningún tamaño en píxeles, retícula de construcción ni valor de contraste absoluto. Corresponde a especificaciones técnicas de implementación, no a esta especificación de sistema.
- Ningún color. Corresponde a `COLOR_SYSTEM`, no creado.
- La geometría, proporciones, área de seguridad o tamaño mínimo del isotipo. Pertenecen exclusivamente a la especificación de construcción del Candidato 09 y a `docs/design/brand/LOGO_SYSTEM.md`, que este documento no duplica — solo referencia su relación funcional con la iconografía (§4.8).
- Las capas, criterios de selección o filosofía de pesos del sistema tipográfico. Pertenecen íntegramente a `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, ya vigente.
- Un manual gráfico con ejemplos visuales de íconos. Corresponde a un futuro `BRAND_GUIDELINES.md`, no creado.

---

## 4. Contenido principal

### 4.1 Principios del Sistema

Consolidados sin agregar ninguno nuevo, desde las fuentes ya aprobadas de Brand Foundations, Visual Identity y Design Brief.

| Principio | Fuente | Aplicación específica a la iconografía |
|---|---|---|
| Claridad | `BRAND_FOUNDATIONS.md` §11.1, Principio IV; `VISUAL_IDENTITY.md` §4.2 | Un ícono debe comunicar su función sin ambigüedad y sin depender exclusivamente de una etiqueta de texto adyacente |
| Simplicidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2 | Fundamenta el nivel de detalle mínimo indispensable exigido en §4.4 |
| Consistencia | Derivado del modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1), mismo criterio ya aplicado en `TYPOGRAPHY_SYSTEM.md` §4.1 | Un sistema de íconos con estilos paralelos entre categorías contradice la expresión de marca única que exige ese modelo |
| Confianza | `BRAND_FOUNDATIONS.md` §11.1, Principio II; `VISUAL_IDENTITY.md` §4.2 | Un ícono ambiguo o inconsistente, en un producto que existe para reducir incertidumbre, erosiona directamente la confianza que la marca declara como su atributo más consolidado |
| Orientación | Concepto central de diseño ya aprobado (`docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001) | La categoría de Navegación (§4.2.1) traduce este concepto a la función más literal que puede cumplir un ícono: ayudar a una persona a ubicarse dentro del producto |
| Accesibilidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2, citando `BRAND_AUDIT.md` §2 | Fundamenta íntegramente §4.6 |

### 4.2 Arquitectura de la Iconografía

Nueve categorías funcionales. Ninguna se resuelve con un ícono concreto; cada una define solo su propósito dentro del sistema.

#### 4.2.1 Navegación

Íconos que permiten desplazarse entre pantallas y secciones del producto (inicio, resultados, detalle, cuenta, historial). Su función es orientar el recorrido, no informar contenido — aplicación directa del concepto central "Orientación" (DD-001) a nivel de interfaz, distinta de su aplicación al isotipo.

#### 4.2.2 Acciones

Íconos que representan una operación que la persona puede ejecutar (buscar, filtrar, guardar, compartir, eliminar). Deben comunicar con precisión qué ocurrirá al activarlos — el principio de Claridad (§4.1) pesa aquí más que en ninguna otra categoría, porque un ícono de acción mal interpretado tiene consecuencias directas sobre lo que la persona hace, no solo sobre lo que percibe.

#### 4.2.3 Estado

Íconos que comunican una condición del sistema o del contenido (cargando, sin resultados, error, disponibilidad, actualización reciente). Deben evitar cualquier lectura de urgencia agresiva, incluso al comunicar una condición negativa (por ejemplo, falta de stock) — restricción heredada directamente de `docs/design/DESIGN_BRIEF.md` §4.10.

#### 4.2.4 Información

Íconos que acompañan o refuerzan contenido informativo (un canal de precio, una nota, un detalle adicional). Su función es aclarar, nunca decorar — coherente con Claridad y con el principio de Transparencia ya consolidado (`VISUAL_IDENTITY.md` §4.2).

#### 4.2.5 Comparación

Categoría específica de la propuesta de valor central del producto: comparar precios entre farmacias y canales. Es la categoría más particular de ComparaFarma dentro de todo el sistema y la de mayor riesgo de posicionamiento: debe evitar cualquier código visual que sugiera intermediación comercial o transacción, coherente con la restricción ya declarada de que ComparaFarma "no es un marketplace" (`BRAND_FOUNDATIONS.md` §12). Su función es ayudar a leer una comparación, no representar una compra.

#### 4.2.6 Alertas

Íconos asociados a las notificaciones de precio y a otros avisos del sistema. Deben transmitir las emociones objetivo "Tranquilidad" y "Alivio" ya declaradas en `docs/design/DESIGN_BRIEF.md` §4.7, no urgencia — una alerta de precio es una buena noticia dentro de este producto, y su iconografía debe reflejar esa naturaleza, no la de una advertencia.

#### 4.2.7 Farmacias

Íconos que identifican o distinguen a las farmacias comparadas dentro del producto. Esta categoría tiene una condición estructural que no comparten las demás: debe evitar cualquier tratamiento visual que otorgue preferencia perceptual a una farmacia sobre otra, consecuencia directa del principio de Neutralidad ya consolidado (`BRAND_FOUNDATIONS.md` §12: *"no privilegiamos una farmacia por sobre otra por conveniencia comercial"*). Aquí, una inconsistencia no es solo un defecto estético: es un riesgo de posicionamiento de marca.

#### 4.2.8 Medicamentos

Íconos que representan medicamentos, dosis, presentaciones o categorías terapéuticas de forma abstracta. Deben evitar por completo la iconografía clínica ya restringida en la documentación de marca (cruces, píldoras realistas, símbolos de autoridad médica) — restricción heredada directamente de `docs/design/DESIGN_BRIEF.md` §4.10 y `docs/design/brand/DESIGN_CONCEPT.md` §4.7, no creada por este documento.

#### 4.2.9 Cuenta

Íconos asociados al perfil, configuración, historial personal y gestión de la relación de la persona con la plataforma. Deben mantenerse funcionalmente neutros y evitar cualquier lenguaje visual de vigilancia o recolección de datos, coherente con el Principio Inmutable IX ya consolidado: *"la privacidad antes que la explotación de los datos"* (`BRAND_FOUNDATIONS.md` §11.1).

### 4.3 Principios de Construcción

Reglas generales, sin fijar medidas ni retícula:

- **Geometría consistente:** todos los íconos deben construirse sobre la misma lógica geométrica subyacente, coherente con la disciplina geométrica ya aplicada en la construcción del isotipo (`docs/design/BRAND_IDENTITY_VALIDATION.md`, sobre la especificación del Candidato 09).
- **Grosor uniforme:** un único grosor de trazo consistente entre íconos, mismo criterio de disciplina ya aplicado a los pesos tipográficos (`TYPOGRAPHY_SYSTEM.md` §4.4: "menos variables usadas con disciplina comunican más que muchas variables usadas de forma arbitraria").
- **Radios coherentes:** el mismo criterio de redondeo de esquinas y terminaciones debe aplicarse en todo el conjunto — no mezclar esquinas agudas y redondeadas sin una razón funcional explícita.
- **Esquinas:** deben seguir una única convención dentro del sistema (agudas o redondeadas, según se decida en la implementación), nunca mixta dentro de una misma categoría.
- **Proporciones:** mantener una relación de aspecto consistente entre íconos de una misma categoría, para que ninguno "compita" en tamaño percibido frente a otro de la misma familia funcional.
- **Equilibrio óptico:** mismo principio de compensación óptica ya aplicado en la construcción del isotipo (`LOGO_SYSTEM.md` §4.4) — dos íconos de distinta geometría base (circular, cuadrada) construidos al mismo tamaño nominal no se perciben del mismo tamaño si no se ajustan ópticamente entre sí.

### 4.4 Estilo Visual

Principios, no decisiones definitivas:

- **Outline, filled o híbrido, como filosofía del sistema:** el isotipo (Candidato 09) se construye sobre una proporción deliberada entre trazo (el anillo) y forma sólida (el punto central) — cualquier decisión futura sobre el estilo dominante de la iconografía debe justificarse por su coherencia con esa misma proporción trazo/sólido, no por preferencia estética aislada. Este documento no decide cuál de las tres filosofías se adopta; establece el criterio con el que deberá decidirse.
- **Nivel de detalle:** el mínimo indispensable para la comprensión de la función representada — consecuencia directa del principio de Simplicidad (§4.1).
- **Simplificación:** ante la duda entre un ícono más literal y uno más abstracto, el sistema debe preferir la abstracción que siga siendo comprensible, coherente con la restricción general de `docs/design/DESIGN_BRIEF.md` §4.11 de no ilustrar de forma literal ningún concepto restringido.
- **Uso del espacio negativo:** el sistema debe poder usar espacio negativo de forma deliberada — como el propio isotipo lo hace con su vano — en lugar de resolver toda forma exclusivamente con líneas positivas.
- **Coherencia con el isotipo:** todo ícono debe poder convivir junto al isotipo sin que ninguno de los dos parezca pertenecer a un sistema visual distinto. Esto no significa que deban compartir la forma exacta del isotipo — significa que deben compartir su lógica de construcción: geometría reductiva, ausencia de ornamento, tratamiento óptico cuidado (ver también §4.8).

### 4.5 Escalabilidad

Principios para que los íconos funcionen desde tamaños muy pequeños hasta aplicaciones de mayor tamaño, sin definir píxeles:

- El sistema debe anticipar el mismo tipo de riesgo ya documentado para el isotipo en `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-001, BV-003): un trazo fino que funciona en tamaños medios y grandes puede perder legibilidad en los tamaños funcionales más pequeños de una interfaz.
- La reducción de un ícono a su tamaño mínimo de uso no debe ser una reducción lineal ingenua: cuando sea necesario, el sistema debe permitir un ajuste de grosor o de nivel de detalle específico para tamaños pequeños, mismo criterio ya aplicado en la especificación de construcción del isotipo.
- Un ícono debe seguir siendo reconocible como parte de su categoría funcional (§4.2) tanto en su tamaño de uso más frecuente en interfaz como en cualquier aplicación institucional o de presentación de mayor tamaño.

### 4.6 Accesibilidad

Principios, sin métricas concretas — fundamentados en el principio de Accesibilidad ya consolidado (§4.1):

- **Reconocimiento:** cada ícono debe distinguirse sin ambigüedad de los demás íconos de su misma categoría funcional (§4.2).
- **Diferenciación:** íconos de categorías distintas no deben compartir una silueta tan similar que genere confusión funcional — particularmente relevante entre Alertas (§4.2.6) y Estado (§4.2.3), dos categorías con riesgo real de solaparse conceptualmente.
- **Contraste:** mismo principio ya exigido para el isotipo (`LOGO_SYSTEM.md` §4.5) y para la tipografía (`TYPOGRAPHY_SYSTEM.md` §4.7), extendido aquí a la iconografía.
- **Comprensión:** un ícono debe poder entenderse sin depender exclusivamente de una etiqueta de texto adyacente.
- **Reducción de ambigüedad:** evitar metáforas visuales que admitan más de una interpretación razonable dentro del contexto de uso del producto — por ejemplo, un ícono que pudiera leerse indistintamente como "eliminar" o como "cerrar" debe resolverse con una convención única y consistente en todo el sistema, no con variantes según la pantalla.

### 4.7 Evolución del Sistema

Todo ícono nuevo, para incorporarse al sistema, debe:

1. **Encajar en una de las nueve categorías ya definidas (§4.2)** o justificar formalmente la creación de una categoría nueva antes de incorporarse — mismo principio de evolución ya aplicado a productos nuevos en `docs/design/brand/BRAND_ARCHITECTURE.md` §4.7 ("todo producto nuevo debe trazarse a una Business Capability ya existente... o justificar formalmente la creación de una nueva antes de nombrarse"), aplicado aquí por analogía a la iconografía.
2. **Respetar los principios de construcción (§4.3) y el estilo visual ya decidido (§4.4)** sin introducir una variación paralela de grosor, geometría o nivel de detalle.
3. **Registrarse como una decisión de diseño**, siguiendo el mismo mecanismo de gobierno que ya exige `docs/design/decisions/DESIGN_DECISION_LOG.md` para cualquier decisión de diseño aprobada — con la misma observación de gobierno ya señalada en `docs/design/brand/LOGO_SYSTEM.md` §5: ese registro es el mecanismo correcto, aunque hoy no exista todavía una fila específica para decisiones de iconografía.

La necesidad funcional inmediata de un ícono nuevo nunca es, por sí sola, justificación suficiente para romper la arquitectura ya definida en este documento. Ningún ícono puede aprobarse por urgencia de producto si contradice §4.2, §4.3 o §4.4.

### 4.8 Relación con el Isotipo

El isotipo y la iconografía cumplen funciones distintas que no deben confundirse ni competir entre sí:

- **El isotipo representa la marca.** Es el identificador de ComparaFarma en su totalidad, bajo el modelo Branded House ya confirmado (`BRAND_ARCHITECTURE.md` §4.1: un solo nombre cubre empresa, plataforma y todos los canales).
- **Los íconos representan funcionalidades.** Cada ícono comunica una acción, un estado o una categoría de información específica dentro del producto (§4.2) — nunca la marca en su conjunto.

De esta distinción se derivan dos reglas explícitas de convivencia:

- El isotipo **no debe usarse como uno más de los íconos funcionales** del sistema (por ejemplo, como el ícono de "inicio" o de "favoritos" dentro de la navegación).
- Ningún ícono funcional debe aproximarse a la forma del isotipo al punto de generar confusión sobre si se trata del identificador de marca o de una función del producto. Esto es especialmente relevante porque el isotipo (Candidato 09) se construye sobre una geometría simple —anillo con vano y punto central—, y precisamente esa simplicidad podría tentar a reutilizarla como base de algún ícono funcional. Este documento prohíbe explícitamente esa reutilización directa.

La convivencia correcta entre isotipo, iconografía e interfaz es de **coherencia de lenguaje** (misma lógica de construcción, mismo principio de reducción geométrica — §4.3, §4.4), no de identidad de forma.

---

## 5. Relaciones

`ICONOGRAPHY_SYSTEM.md` depende, en cadena, de toda la Arquitectura de Marca ya construida: `BRAND_FOUNDATIONS.md` (identidad), `BRAND_ARCHITECTURE.md` (modelo Branded House, fuente del principio de Consistencia y del criterio de evolución de §4.7), `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md` (principios y territorio visual restringido), `DESIGN_BRIEF.md` (encargo de diseño y restricciones de imagen), `docs/design/brand/LOGO_SYSTEM.md` (estructura del logotipo y del isotipo, del que este documento distingue explícitamente su rol en §4.8) y `docs/design/brand/TYPOGRAPHY_SYSTEM.md` (precedente directo de disciplina de sistema — pesos, capas — que este documento traduce a categorías y principios de construcción iconográfica).

Su responsabilidad específica dentro de la Arquitectura de Marca es distinta a la de cada uno de esos documentos: ninguno de ellos define cuántas categorías funcionales tiene la iconografía, qué principios de construcción debe seguir, ni cómo debe convivir con el isotipo. `ICONOGRAPHY_SYSTEM.md` cierra, además, un vacío señalado explícitamente en `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-007): que el isotipo, por sí solo, "no ofrece un lenguaje formal replicable para íconos secundarios... sin definir reglas nuevas no cubiertas por este candidato" — este documento es esa regla, sin diseñar ningún ícono.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Principios de marca y percepción visual | `docs/design/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` | ✔ — aplicados al sistema de iconografía (§4.1) | Ningún principio nuevo agregado |
| Concepto central "Orientación" | `docs/design/decisions/DESIGN_DECISION_LOG.md`, DD-001 | ✔ — fundamenta la categoría Navegación (§4.2.1) | — |
| Territorio visual y restricciones de imagen | `docs/design/DESIGN_BRIEF.md` §4.10, §4.11; `docs/design/brand/DESIGN_CONCEPT.md` §4.7 | ✔ — fundamenta las categorías Comparación, Alertas, Medicamentos y Farmacias (§4.2.5–§4.2.8) | — |
| Neutralidad entre farmacias | `docs/design/brand/BRAND_FOUNDATIONS.md` §12 | ✔ — condición estructural de la categoría Farmacias (§4.2.7) | Riesgo de posicionamiento, no solo estético |
| Privacidad (Principio IX) | `docs/design/brand/BRAND_FOUNDATIONS.md` §11.1 | ✔ — condiciona la categoría Cuenta (§4.2.9) | — |
| Riesgos de escalabilidad ya documentados para el isotipo | `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-001, BV-003 | ✔ — extendidos a la iconografía (§4.5) | — |
| Vacío de sistema de iconografía derivado del isotipo | `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-007 | ✔ — este documento es la respuesta arquitectónica a ese vacío | No resuelve el ajuste pendiente del isotipo en sí; ver `LOGO_SYSTEM.md` §4.4 |
| Estructura del logotipo y equilibrio óptico | `docs/design/brand/LOGO_SYSTEM.md` §4.4, §4.5 | ✔ — extendido por analogía a §4.3, §4.6, §4.8 | — |
| Filosofía de disciplina de sistema (pesos/capas) | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` §4.1, §4.4 | ✔ — extendido por analogía a §4.3 (grosor uniforme) | — |
| Ícono, librería o catálogo concreto | — (no existe documento de implementación todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de una decisión de implementación futura |

---

## 7. Gobierno

`ICONOGRAPHY_SYSTEM.md` **no reemplaza**:

- `docs/design/brand/BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` — siguen siendo la única fuente de identidad, arquitectura de marca, principios de percepción y concepto de diseño.
- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y de las restricciones de imagen ya declaradas.
- `docs/design/brand/LOGO_SYSTEM.md` — sigue siendo la única fuente de estructura del sistema de logotipo, incluida la relación funcional entre isotipo e iconografía que este documento aclara en §4.8 sin modificar su origen.
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md` — sigue siendo la única fuente de principios y arquitectura tipográfica.
- `docs/design/BRAND_IDENTITY_VALIDATION.md` — sigue siendo la única fuente del resultado de auditoría de calidad del isotipo.

La responsabilidad específica de `ICONOGRAPHY_SYSTEM.md` dentro de la Arquitectura de Marca es gobernar exclusivamente los **principios, la arquitectura funcional y las reglas de evolución** del sistema de iconografía: sus nueve categorías, sus principios de construcción y estilo, sus principios de escalabilidad y accesibilidad, y su relación de convivencia con el isotipo. No gobierna, y no debe absorber en ninguna revisión futura, el diseño de íconos concretos, la selección de una librería, ni ninguna decisión de componentes de interfaz — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito declarado en §1: este documento debe seguir siendo válido aunque cambie por completo la librería de íconos utilizada por ComparaFarma.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en el resto de `docs/brand/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/BRAND_ARCHITECTURE.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/DESIGN_CONCEPT.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/design/brand/LOGO_SYSTEM.md`
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/design/BRAND_IDENTITY_VALIDATION.md`
- `docs/design/decisions/DESIGN_DECISION_LOG.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: el futuro documento de selección o construcción de librería de íconos, `COLOR_SYSTEM.md` (en lo relativo a color aplicado sobre íconos), `BRAND_GUIDELINES.md`, y el futuro `DESIGN_SYSTEM` de producto de `mobile/` y `web/`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la especificación oficial de principios y arquitectura del sistema de iconografía: principios (claridad, simplicidad, consistencia, confianza, orientación, accesibilidad), nueve categorías funcionales (Navegación, Acciones, Estado, Información, Comparación, Alertas, Farmacias, Medicamentos, Cuenta), principios de construcción, estilo visual, escalabilidad, accesibilidad, reglas de evolución del sistema, y relación funcional con el isotipo. No diseña íconos, no selecciona librería y no define componentes de interfaz. Cierra el vacío de sistema de iconografía derivado señalado en `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-007). | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `DESIGN_CONCEPT.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/design/brand/LOGO_SYSTEM.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `docs/design/BRAND_IDENTITY_VALIDATION.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición de la especificación oficial del sistema de logotipo | Brand Architect / Identity Systems Director / Enterprise Documentation Architect | `docs/design/brand/LOGO_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema tipográfico | Brand Architect / Type Director / Enterprise Documentation Architect | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de iconografía | Iconography Director / Design Systems Architect / Enterprise Documentation Architect | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. La selección o construcción de una librería de íconos concreta queda, en su totalidad, fuera de esta versión y pendiente de trabajo de diseño e implementación posterior.
