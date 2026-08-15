# TYPOGRAPHY_SYSTEM — Especificación Oficial del Sistema Tipográfico de ComparaFarma

Este documento no selecciona una tipografía definitiva, no diseña un wordmark, no crea un logotipo y no reemplaza un Brand Book. Es la **especificación oficial del sistema tipográfico**: qué capas lo componen, qué principios debe cumplir cualquier familia tipográfica futura, y qué reglas gobiernan su jerarquía, su comportamiento responsivo y su accesibilidad. Debe seguir siendo válido aunque, dentro de cinco años, cambie por completo la familia tipográfica utilizada por ComparaFarma — porque no gobierna esa elección, gobierna los principios y la arquitectura bajo los que esa elección deberá tomarse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-TYP-001 |
| **Nombre** | TYPOGRAPHY_SYSTEM.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Brand Architect / Type Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — cuarto grado de derivación: se apoya directamente en `docs/brand/LOGO_SYSTEM.md` (tercer grado) y en `docs/brand/VISUAL_IDENTITY.md` / `DESIGN_CONCEPT.md` (primer y segundo grado), todos derivados de `docs/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Arquitectura de Marca / Especificación de Sistema |
| **Fuente Oficial** | Este documento es la fuente oficial de los **principios y la arquitectura** del sistema tipográfico. No es fuente de identidad (`BRAND_FOUNDATIONS.md`), de percepción visual (`VISUAL_IDENTITY.md`), de estructura de logotipo (`LOGO_SYSTEM.md`) ni de ninguna familia tipográfica concreta (documento de selección todavía no creado) |
| **Documentos de los que depende** | `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/brand/DESIGN_CONCEPT.md`, `docs/design/DESIGN_BRIEF.md`, `docs/brand/LOGO_SYSTEM.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la futura selección concreta de familia(s) tipográfica(s) (documento de implementación, no creado) y condiciona estructuralmente a un futuro `BRAND_GUIDELINES.md` en todo lo relativo a uso tipográfico |
| **Pregunta que responde** | ¿Cómo se gobierna el sistema tipográfico de ComparaFarma y cuáles son las reglas que deberán seguir todas las decisiones tipográficas futuras? |

---

## 2. Propósito

La tipografía no es una elección estética dentro de la identidad de ComparaFarma: es un **sistema de comunicación**. El producto existe para resolver, en pocos segundos, una comparación de información densa (precios, farmacias, canales de precio) que una persona debe poder leer, jerarquizar y decidir sobre ella con el mínimo esfuerzo posible — exigencia ya declarada en `docs/design/DESIGN_BRIEF.md` §4.11: *"el sistema debe sostener, con claridad, la convivencia de información numérica y comparativa densa... la jerarquía visual de la información es, para este producto, tan parte de la 'identidad' como cualquier elemento gráfico."* Bajo esa exigencia, la tipografía deja de ser un accesorio visual y se convierte en la herramienta principal con la que la marca cumple su propósito consolidado de *"ayudar a las personas a tomar mejores decisiones... mediante información objetiva, confiable y actualizada"* (`BRAND_FOUNDATIONS.md` §7).

Este documento existe para que esa responsabilidad no dependa de qué familia tipográfica se elija en un momento dado, sino de un conjunto estable de principios y de arquitectura que cualquier familia futura deberá cumplir.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema tipográfico, consolidados sin invención desde `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` y `DESIGN_BRIEF.md` (§4.1).
- Las capas de la arquitectura tipográfica — Display, Heading, Body, Caption, Data/Numeric — y el propósito de cada una, sin elegir tipografías (§4.2).
- Los criterios que deberá cumplir cualquier familia tipográfica candidata, sin evaluar ni nombrar ninguna (§4.3).
- La filosofía de uso de un sistema de pesos, sin asignar familias (§4.4).
- Reglas generales de jerarquía visual, sin tamaños específicos (§4.5).
- Principios de tipografía responsiva entre desktop, tablet, móvil y superficies mínimas, sin definir píxeles (§4.6).
- Requisitos mínimos de accesibilidad tipográfica, sin valores absolutos (§4.7).
- La relación entre este sistema y el futuro wordmark, aclarando que son decisiones independientes (§4.8).

**Este documento NO define:**

- Ninguna familia tipográfica específica, ni criterios de comparación entre familias reales del mercado. Corresponde a un futuro documento de selección tipográfica, no creado.
- El wordmark ni su tipografía. Corresponde a `docs/brand/LOGO_SYSTEM.md` §4.2.2 (que ya declara el wordmark como componente estructural pendiente de definición tipográfica) — este documento no lo diseña ni lo duplica, solo aclara su relación (§4.8).
- Ningún componente del sistema de logotipo (isotipo, variantes, restricciones de uso, motion). Corresponde íntegramente a `docs/brand/LOGO_SYSTEM.md`, ya vigente.
- Color, iconografía, ilustración, fotografía o componentes de interfaz de usuario. Corresponden a `COLOR_SYSTEM`, `ICONOGRAPHY` y a un futuro `DESIGN_SYSTEM` de producto, ninguno creado todavía.
- Un manual gráfico con ejemplos visuales, tamaños en píxeles o especificaciones de implementación técnica (variables CSS, tokens de diseño). Corresponde a un futuro `BRAND_GUIDELINES.md` y a la documentación técnica de `mobile/` y `web/`, no a este documento.
- Ninguna decisión de identidad, arquitectura de marca o percepción visual ya tomada en `BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md` o `DESIGN_CONCEPT.md`. Este documento no las reinterpreta.

---

## 4. Contenido principal

### 4.1 Principios del Sistema Tipográfico

Consolidados sin agregar ninguno nuevo, desde las fuentes ya aprobadas de Brand Foundations, Visual Identity y Design Brief. Cada principio conserva su cita de origen y su aplicación específica a la tipografía.

| Principio | Fuente | Aplicación específica a la tipografía |
|---|---|---|
| Claridad | `BRAND_FOUNDATIONS.md` §11.1, Principio IV ("la claridad antes que la complejidad"); `VISUAL_IDENTITY.md` §4.2 | Cada capa tipográfica (§4.2) debe cumplir un propósito reconocible sin ambigüedad frente a las demás |
| Legibilidad | `DESIGN_BRIEF.md` §4.13 (criterio de evaluación, 15%); §4.11 ("debe priorizar legibilidad en pantallas pequeñas — el producto es de uso móvil intensivo") | Fundamenta la prioridad de legibilidad sobre personalidad en Body, Caption y Data/Numeric (§4.2, §4.3) |
| Confianza | `BRAND_FOUNDATIONS.md` §11.1, Principio II; `VISUAL_IDENTITY.md` §4.2, §4.3 (atributo "Confiable") | Una tipografía inconsistente entre pantallas erosiona la misma confianza que la marca declara como su atributo más citado del corpus documental |
| Simplicidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2 | Fundamenta la filosofía de uso reducido de pesos (§4.4): menos variables usadas con disciplina, no más variables disponibles |
| Accesibilidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2, citando `BRAND_AUDIT.md` §2 ("rechazo explícito de patrones oscuros de diseño, compromiso de accesibilidad") | Fundamenta íntegramente §4.7 |
| Consistencia | Derivado del modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1: un solo nombre cubre empresa, plataforma y todos los canales) | Un sistema tipográfico fragmentado entre app, web y materiales institucionales contradice la expresión de marca única que exige ese modelo |
| Científica / Profesional (sin volverse fría) | `DESIGN_BRIEF.md` §4.11: *"sosteniendo a la vez los atributos 'Clara' y 'Científica/Profesional' sin volverse fría"*; `VISUAL_IDENTITY.md` §4.3 | Condiciona los criterios de personalidad admisibles en Display y Heading (§4.2, §4.3) — nunca a costa de la legibilidad |

### 4.2 Arquitectura Tipográfica

Cinco capas funcionales. Ninguna se resuelve con una familia tipográfica concreta; cada una define solo su propósito dentro del sistema.

#### 4.2.1 Display

Capa reservada para momentos de máximo impacto emocional o institucional: pantallas de bienvenida, onboarding, hitos de producto (por ejemplo, un ahorro significativo alcanzado). Prioriza personalidad expresiva, pero nunca a costa de los atributos ya consolidados "Confiable" y "Profesional" (`VISUAL_IDENTITY.md` §4.3) — no es el lugar del sistema donde la legibilidad puede sacrificarse por impacto visual.

#### 4.2.2 Heading

Capa de títulos de sección, nombres de medicamento y encabezados de resultado. Debe sostener una jerarquía clara frente a Body sin competir con Display ni depender de él — es el nivel que con mayor frecuencia se lee primero durante una decisión de compra.

#### 4.2.3 Body

Capa de lectura extendida: descripciones de producto, textos institucionales, contenido informativo. Prioriza legibilidad sobre personalidad de forma explícita — es la capa donde el principio de Legibilidad (§4.1) pesa más que cualquier otro.

#### 4.2.4 Caption

Capa de metadatos secundarios: fecha de actualización de un precio, aclaraciones, texto de apoyo, notas legales. Debe mantenerse legible incluso en los tamaños más reducidos del sistema, coherente con la exigencia de `DESIGN_BRIEF.md` §4.11 de priorizar la legibilidad en pantallas pequeñas.

#### 4.2.5 Data / Numeric

Capa dedicada a precios, porcentajes de ahorro y cantidades — la más específica de este producto y la que exige mayor disciplina. `DESIGN_BRIEF.md` §4.11 ya declara que sostener esta densidad de información comparativa es, para ComparaFarma, tan parte de la identidad como cualquier elemento gráfico. Requiere alineación numérica consistente entre filas de una comparación (de modo que los dígitos no "salten" visualmente al escanear una lista de precios de distintas farmacias) — este requisito funcional se traduce en un criterio de selección obligatorio en §4.3, no en una decisión estética.

### 4.3 Criterios para Selección de Tipografías

Requisitos que deberá cumplir cualquier familia tipográfica candidata, sin evaluar ni nombrar ninguna todavía. Se distingue, para cada criterio, si proviene directamente de la documentación de marca o si es una extensión operativa razonable — misma disciplina de transparencia ya aplicada en `docs/design/DESIGN_BRIEF.md` §4.12.

**Con respaldo documental directo:**

- **Excelente legibilidad en tamaños pequeños de pantalla móvil** — `DESIGN_BRIEF.md` §4.11: *"debe priorizar legibilidad en pantallas pequeñas — el producto es de uso móvil intensivo."*
- **Buena legibilidad en web** — `VISUAL_IDENTITY.md` §4.5 confirma la web como canal de aplicación de la identidad, en pie de igualdad con la app móvil.
- **Números tabulares con alineación consistente** — consecuencia directa de `DESIGN_BRIEF.md` §4.11 sobre la convivencia de información numérica y comparativa densa (ver §4.2.5).
- **Buena altura x** — condición técnica necesaria para cumplir la legibilidad en pantallas pequeñas ya exigida; se deriva del mismo requisito, no es un criterio adicional independiente.
- **Cumplimiento de los requisitos mínimos de accesibilidad** definidos en §4.7 de este documento.

**Extensión operativa razonable, sin cita de marca específica:**

- **Licencia adecuada para uso comercial multiplataforma** — requisito legal/operativo de cualquier sistema tipográfico de un producto distribuido en múltiples tiendas y plataformas; no está documentado en ninguna fuente de marca, se incluye por necesidad operativa evidente.
- **Rendimiento de carga en web** — extensión razonable del canal "Sitio web" ya confirmado (`VISUAL_IDENTITY.md` §4.5); ninguna fuente de marca fija un requisito de rendimiento, pero es una condición técnica implícita de operar ese canal.
- **Soporte multilenguaje** — no existe hoy evidencia documental de expansión fuera de Chile ni de un idioma distinto al español; se incluye como precaución de escalabilidad (`DESIGN_BRIEF.md` §4.13, criterio "Escalabilidad", 12%), no como un hecho ya decidido.

Ninguna familia tipográfica real se menciona, compara ni descarta en este documento — hacerlo sería una decisión de implementación, fuera del alcance de una especificación de sistema.

### 4.4 Sistema de Pesos

Filosofía de uso, sin asignar ninguna familia tipográfica a estos nombres de peso:

- **Light** — uso restringido a tamaños grandes de Display, donde un trazo fino permanece legible; nunca en Body, Caption o Data/Numeric, donde la legibilidad es prioritaria sobre la expresividad.
- **Regular** — peso base de Body. Es el peso donde el principio de Legibilidad (§4.1) debe primar sobre cualquier otra consideración.
- **Medium** — uso en Heading y para dar énfasis dentro de Body sin recurrir a Bold, coherente con la emoción objetivo "Tranquilidad" (`DESIGN_BRIEF.md` §4.7): un énfasis moderado comunica importancia sin urgencia.
- **SemiBold** — uso reservado para Data/Numeric, donde un precio o un porcentaje de ahorro necesita peso visual para destacar en una comparación, sin cruzar hacia la agresividad visual que `DESIGN_BRIEF.md` §4.10 ya prohíbe expresamente ("elementos de urgencia agresiva").
- **Bold** — uso más restringido del sistema: reservado para Display y para el énfasis crítico estrictamente necesario. Su uso extendido fuera de esos casos contradice el principio de Simplicidad (§4.1).

La filosofía general de esta capa es que **menos pesos usados con disciplina comunican más que muchos pesos usados de forma arbitraria** — consecuencia directa del principio de Simplicidad ya consolidado.

### 4.5 Jerarquía

Reglas generales, sin tamaños específicos:

- La jerarquía debe construirse combinando peso, tamaño relativo y espaciado — nunca depender de una sola variable para distinguir un nivel de otro.
- Cada nivel de jerarquía debe seguir siendo distinguible incluso sin color, en escala de grises o en cualquiera de las versiones de una tinta. Este documento extiende al sistema tipográfico el mismo principio de independencia del color ya exigido para el isotipo en `docs/brand/LOGO_SYSTEM.md` §4.5, porque `COLOR_SYSTEM` no existe todavía y ninguna jerarquía puede depender de una variable que aún no está definida.
- La jerarquía debe permitir escanear rápidamente una comparación de precios sin exigir lectura completa de cada fila — coherente con la propuesta de valor ya consolidada de decidir "en pocos segundos" (`BRAND_FOUNDATIONS.md` §14).
- Ningún nivel de jerarquía debe lograr distinción mediante urgencia visual (parpadeo, tamaño desproporcionado, contraste agresivo) — coherente con la restricción ya declarada contra elementos de urgencia agresiva (`DESIGN_BRIEF.md` §4.10).

### 4.6 Responsive Typography

Principios de adaptación entre superficies, sin definir píxeles:

- **Mobile** es el contexto de diseño primario: toda decisión de escala tipográfica debe partir de las condiciones de legibilidad móvil y adaptarse hacia arriba, nunca al revés — consecuencia directa de que "el producto es de uso móvil intensivo" (`DESIGN_BRIEF.md` §4.11).
- **Desktop / Web** permite mayor densidad de información simultánea (más columnas de comparación visibles a la vez) sin que eso implique reducir la legibilidad de Body ni de Data/Numeric por debajo del estándar ya exigido en móvil.
- **Tablet** se trata como un estado intermedio entre mobile y desktop: no requiere una escala tipográfica propia e independiente si el sistema define proporciones fluidas entre los dos extremos.
- **Superficies mínimas (por ejemplo, notificaciones o relojes)** no están confirmadas hoy como canal de marca en ninguna fuente de `docs/brand/` ni de `docs/design/DESIGN_BRIEF.md` §4.12. Se incluyen aquí como principio abierto, con la misma lógica de extensión operativa ya usada en `DESIGN_BRIEF.md` para favicon y avatar: el producto ya tiene una funcionalidad de Alertas de precio que podría, en el futuro, requerir presentarse en una superficie de notificación mínima, y el sistema tipográfico debería poder degradarse a Caption o a una variante mínima de Data/Numeric sin perder legibilidad si ese canal llegara a confirmarse.

### 4.7 Accesibilidad

Requisitos mínimos, sin valores absolutos — fundamentados directamente en el principio de Accesibilidad ya consolidado (`VISUAL_IDENTITY.md` §4.2, citando `BRAND_AUDIT.md` §2: *"rechazo explícito de patrones oscuros de diseño, compromiso de accesibilidad"*):

- **Contraste:** suficiente entre texto y fondo en todas las combinaciones de versiones permitidas del sistema, sin depender de que el usuario perciba matices sutiles de color.
- **Legibilidad:** mantenida en los tamaños mínimos de cada capa (§4.2), con especial exigencia en Caption y Data/Numeric, por ser las capas de mayor densidad de información y las que con mayor frecuencia se presentan en su tamaño más reducido.
- **Longitud de línea:** ni tan corta que fragmente la comprensión de Body, ni tan larga que dificulte seguir la línea de lectura — la medida exacta es una decisión de implementación, no de este documento.
- **Interlineado:** suficiente para distinguir con claridad líneas consecutivas de información comparativa, particularmente en listas de resultados de precios donde cada fila representa una farmacia distinta.
- **Espaciado:** suficiente para que los caracteres de Data/Numeric no se perciban ambiguos entre sí (por ejemplo, dígitos que puedan confundirse a tamaños reducidos), coherente con el criterio de números tabulares ya exigido en §4.3.

### 4.8 Wordmark

Este sistema tipográfico y el wordmark de ComparaFarma son decisiones independientes. `docs/brand/LOGO_SYSTEM.md` §4.2.2 ya define el wordmark como un componente estructural del sistema de logotipo cuya especificación tipográfica exacta "no existe todavía", y aclara que ese componente pertenece al dominio de `LOGO_SYSTEM` y del futuro trabajo de diseño gráfico del logotipo, no al de este documento.

Se aclara explícitamente: **el wordmark no tiene por qué utilizar la misma familia tipográfica que el sistema de interfaz aquí definido (Display, Heading, Body, Caption, Data/Numeric).** Es una práctica habitual y legítima de identidad corporativa que el wordmark sea una pieza de diseño gráfico fija — en algunos casos con ajustes manuales de letras que no serían apropiados ni reproducibles en una tipografía de uso extendido en interfaz —, mientras que el sistema tipográfico de interfaz se optimiza para objetivos distintos: rendimiento, legibilidad en pantalla, variedad de pesos y disponibilidad multiplataforma (§4.3). Ambos sistemas deben ser coherentes entre sí en términos de personalidad percibida (§4.1), pero esa coherencia no exige ni implica que compartan la misma familia tipográfica.

---

## 5. Relaciones

`TYPOGRAPHY_SYSTEM.md` depende, en cadena, de toda la Arquitectura de Marca ya construida: `BRAND_FOUNDATIONS.md` (identidad), `BRAND_ARCHITECTURE.md` (modelo Branded House, fuente del principio de Consistencia), `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md` (principios y atributos de percepción), `DESIGN_BRIEF.md` (encargo de diseño y criterios de evaluación) y `docs/brand/LOGO_SYSTEM.md` (estructura del logotipo, de la que este documento distingue explícitamente el wordmark en §4.8).

Su responsabilidad específica dentro de la Arquitectura de Marca es distinta a la de cada uno de esos documentos: ninguno de ellos define cuántas capas tiene el sistema tipográfico, qué criterios debe cumplir una familia candidata, ni cómo debe comportarse la tipografía entre pantallas. `TYPOGRAPHY_SYSTEM.md` es el primer documento del repositorio que responde esa pregunta específica de arquitectura tipográfica, sin seleccionar ninguna familia concreta — de la misma manera en que `LOGO_SYSTEM.md` fijó la estructura del logotipo sin fijar la geometría final del isotipo.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Principios de marca y percepción visual | `docs/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` | ✔ — aplicados al sistema tipográfico (§4.1) | Ningún principio nuevo agregado |
| Criterios de evaluación (legibilidad, escalabilidad) | `docs/design/DESIGN_BRIEF.md` §4.13 | ✔ — usados como principios y criterios de selección (§4.1, §4.3) | — |
| Exigencia de densidad de información numérica y comparativa | `docs/design/DESIGN_BRIEF.md` §4.11 | ✔ — fundamenta la capa Data/Numeric (§4.2.5) y el criterio de números tabulares (§4.3) | Es el requisito más específico de este producto dentro de todo el documento |
| Modelo de marca única (Branded House) | `docs/brand/BRAND_ARCHITECTURE.md` §4.1 | ✔ — fundamenta el principio de Consistencia (§4.1) | — |
| Restricción contra urgencia agresiva | `docs/design/DESIGN_BRIEF.md` §4.10 | ✔ — condiciona el uso de pesos SemiBold/Bold (§4.4) y las reglas de jerarquía (§4.5) | — |
| Estructura del logotipo y del wordmark | `docs/brand/LOGO_SYSTEM.md` §4.2.2 | Referenciado, no duplicado (§4.8) | Se aclara explícitamente la independencia entre wordmark y sistema tipográfico de interfaz |
| Independencia del color | `docs/brand/LOGO_SYSTEM.md` §4.5 (aplicado al isotipo) | ✔ — extendido por analogía a la jerarquía tipográfica (§4.5) | `COLOR_SYSTEM` no existe todavía; la jerarquía no puede depender de una variable no definida |
| Accesibilidad | `docs/brand/BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2, vía `BRAND_AUDIT.md` §2 | ✔ (§4.7) | — |
| Familia tipográfica concreta | — (no existe documento de selección todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de un futuro documento de selección tipográfica |
| Wordmark gráfico | `docs/brand/LOGO_SYSTEM.md` §4.2.2 | No consolidado — fuera de alcance de este documento | El wordmark sigue siendo competencia de `LOGO_SYSTEM` / diseño gráfico del logotipo |

---

## 7. Gobierno

`TYPOGRAPHY_SYSTEM.md` **no reemplaza**:

- `docs/brand/BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` — siguen siendo la única fuente de identidad, arquitectura de marca, principios de percepción y concepto de diseño.
- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y de los criterios de evaluación de propuestas.
- `docs/brand/LOGO_SYSTEM.md` — sigue siendo la única fuente de estructura del sistema de logotipo, incluido el rol estructural del wordmark (§4.2.2 de ese documento), que este documento no duplica ni redefine.

La responsabilidad específica de `TYPOGRAPHY_SYSTEM.md` dentro de la Arquitectura de Marca es gobernar exclusivamente los **principios y la arquitectura** del sistema tipográfico: sus capas funcionales, los criterios que debe cumplir cualquier familia candidata, la filosofía de su sistema de pesos, las reglas generales de jerarquía, los principios de comportamiento responsivo y los requisitos mínimos de accesibilidad. No gobierna, y no debe absorber en ninguna revisión futura, la selección de una familia tipográfica concreta, el diseño del wordmark, ni especificaciones técnicas de implementación (tokens, variables CSS, tamaños en píxeles) — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito declarado en §1: este documento debe seguir siendo válido aunque cambie por completo la familia tipográfica utilizada por ComparaFarma.

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
- `docs/design/BRAND_IDENTITY_VALIDATION.md`
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: el futuro documento de selección tipográfica concreta, `COLOR_SYSTEM.md` (en lo relativo a contraste y jerarquía combinada), `ICONOGRAPHY.md` (en lo relativo a coherencia de personalidad entre tipografía e íconos), `BRAND_GUIDELINES.md`, y la documentación técnica de implementación de `mobile/` y `web/`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la especificación oficial de principios y arquitectura del sistema tipográfico: principios (claridad, legibilidad, confianza, simplicidad, accesibilidad, consistencia, científica/profesional), arquitectura de cinco capas (Display, Heading, Body, Caption, Data/Numeric), criterios de selección de familias tipográficas, filosofía de sistema de pesos, reglas de jerarquía, principios de tipografía responsiva, requisitos mínimos de accesibilidad, y aclaración explícita de independencia entre el wordmark y el sistema tipográfico de interfaz. No selecciona ninguna familia tipográfica ni diseña el wordmark. | `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `DESIGN_CONCEPT.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/brand/LOGO_SYSTEM.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición de la arquitectura de identidad visual | Brand Architect / UX Strategist / Design System Architect | `docs/brand/VISUAL_IDENTITY.md` v1.0 |
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-06 | Redacción del Design Brief oficial de identidad visual | Creative Director / Brand Strategist / Design Director | `docs/design/DESIGN_BRIEF.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de logotipo | Brand Architect / Identity Systems Director / Enterprise Documentation Architect | `docs/brand/LOGO_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema tipográfico | Brand Architect / Type Director / Enterprise Documentation Architect | `docs/brand/TYPOGRAPHY_SYSTEM.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. La selección de una familia tipográfica concreta y el diseño tipográfico del wordmark quedan, ambos, fuera de esta versión y pendientes de trabajo de diseño posterior.
