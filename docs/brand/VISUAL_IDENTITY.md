# VISUAL_IDENTITY — Arquitectura de Identidad Visual de ComparaFarma

Este documento no propone logos, no elige colores, no define tipografías, no genera imágenes y no es un manual de branding. Es un documento de **Arquitectura de Marca**, no de Diseño. Responde una sola pregunta: **¿cómo debe verse ComparaFarma para expresar correctamente la identidad ya consolidada en `docs/brand/BRAND_FOUNDATIONS.md`?**

Toda decisión gráfica futura (logo, paleta, tipografía, iconografía) deberá derivarse de los principios aquí definidos. Este documento no decide esas piezas; define las reglas bajo las cuales deberán decidirse.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-VIS-001 |
| **Nombre** | VISUAL_IDENTITY.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO — mismo criterio ya usado en `docs/brand/BRAND_FOUNDATIONS.md`, `docs/strategy/DIGITAL_ASSET_REGISTER.md` y `docs/enterprise/BUSINESS_SERVICES.md` |
| **Rol asumido en su redacción** | Brand Architect / UX Strategist / Design System Architect |
| **Nivel de Gobierno** | Estratégico — establece dirección de largo plazo para toda decisión visual futura, en el mismo nivel jerárquico que otros documentos de dirección de marca; se apoya, en segundo grado, en `docs/brand/BRAND_FOUNDATIONS.md`, clasificado como Fundacional derivado (ver Relaciones, §5) |
| **Clasificación** | Documento de Arquitectura de Marca |
| **Fuente Oficial** | `docs/brand/BRAND_FOUNDATIONS.md` (v1.1), con apoyo directo en `docs/brand/BRAND_AUDIT.md` (v1.0), `docs/book/` (Carta del Fundador y Acto II — La Identidad) y `docs/strategy/VISION_2030.md` |
| **Documentos de los que depende** | `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_AUDIT.md`, `docs/book/0. Carta del Fundador.md`, `docs/book/02-acto-la-identidad/`, `docs/strategy/VISION_2030.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía. Gobernará los futuros `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY`, `GOOGLE_PLAY_ASSETS` y `MARKETING_GUIDELINES`, en el orden declarado en el Roadmap de este documento (§4.9) |
| **Pregunta que responde** | ¿Cómo debe verse ComparaFarma para expresar correctamente la identidad definida en `BRAND_FOUNDATIONS`? |

---

## 2. Propósito

La Identidad Visual cumple, dentro de la Arquitectura de Marca de ComparaFarma, un rol estrictamente subordinado y expresivo: **traduce a principios de percepción una identidad que ya existe**, consolidada en `docs/brand/BRAND_FOUNDATIONS.md`. No crea identidad nueva, no reinterpreta la personalidad, la voz o el tono ya consolidados, y no adelanta ninguna decisión estética (logo, color, tipografía).

Este documento existe porque `docs/brand/BRAND_AUDIT.md` (§5, Vacíos) confirmó que **no existe en el repositorio ninguna mención a identidad visual** — ni logo, ni paleta, ni tipografía, ni sistema gráfico — y recomendó, en su Roadmap (§9), que `VISUAL_IDENTITY` sea el documento inmediatamente posterior a la consolidación de marca, y previo a cualquier desarrollo gráfico concreto (`LOGO_SYSTEM`, `COLOR_SYSTEM`, etc.). `BRAND_FOUNDATIONS.md` (§1, "Documentos que gobierna") ya anticipaba este mismo documento como uno de los que deberá gobernar.

En síntesis: si `BRAND_FOUNDATIONS.md` responde **quién es** ComparaFarma, este documento responde **qué reglas de percepción** debe cumplir cualquier expresión visual futura de esa identidad — sin todavía decidir cómo se ve.

---

## 3. Alcance

**Este documento define:**

- El rol de la identidad visual dentro de la arquitectura de marca (§2).
- Principios visuales que debe cumplir toda decisión gráfica futura, derivados de `BRAND_FOUNDATIONS.md` (§4.2).
- Atributos de percepción que toda pieza gráfica deberá transmitir (§4.3).
- Qué componentes deberá incluir, más adelante, el sistema visual — sin desarrollarlos (§4.4).
- Dónde deberá aplicarse la identidad visual (§4.5).
- Principios de experiencia de usuario (UX) que se derivan de la identidad ya consolidada (§4.6).
- Restricciones explícitas: qué no debe parecer ni comunicar la marca (§4.7).
- El orden documental de los desarrollos gráficos posteriores (§4.9, Roadmap).

**Este documento NO define:**

- Logos, isotipos ni imagotipos concretos. Corresponde a `LOGO_SYSTEM`, pendiente según el Roadmap (§4.9).
- Colores, paletas ni códigos cromáticos. Corresponde a `COLOR_SYSTEM`, pendiente.
- Tipografías. Corresponde a `TYPOGRAPHY_SYSTEM`, pendiente.
- Iconografía, ilustración, fotografía o motion concretos. Corresponden a documentos posteriores aún no creados.
- Un manual de marca gráfico ni guías de aplicación terminadas. Ese rol corresponde a un futuro `BRAND_GUIDELINES`, ya anticipado en el Roadmap de `docs/brand/BRAND_AUDIT.md` (§9).
- Personalidad, voz, tono, misión, visión, propósito o principios de identidad. Estos ya están consolidados en `docs/brand/BRAND_FOUNDATIONS.md` y este documento no los reinterpreta; solo los traduce a percepción visual.
- Tono publicitario o de comunicación externa. `BRAND_FOUNDATIONS.md` (§17) declara explícitamente que ese tono está pendiente de definición en `BRAND_GUIDELINES` / `MARKETING_GUIDE`; este documento tampoco lo resuelve.

---

## 4. Contenido principal

### 4.1 Relación con BRAND_FOUNDATIONS

La identidad visual **expresa** la marca. **Nunca la define.**

`docs/brand/BRAND_FOUNDATIONS.md` es la única fuente de verdad sobre quién es ComparaFarma: su historia, propósito, misión, visión, promesa, principios, personalidad, voz y tono. Este documento no repite ni reinterpreta ese contenido — lo toma como dato fijo y se pregunta exclusivamente cómo debería verse una expresión gráfica fiel a él.

Esto tiene una consecuencia de gobierno directa: si en el futuro cambia algo en `BRAND_FOUNDATIONS.md` (por ejemplo, una revisión de la personalidad en su §15, hoy declarada como lectura inicial no ratificada), este documento debe revisarse en consecuencia. La relación es de dependencia en una sola dirección: `VISUAL_IDENTITY` depende de `BRAND_FOUNDATIONS`; `BRAND_FOUNDATIONS` no depende de este documento.

### 4.2 Principios Visuales

Los siguientes principios no son una propuesta estética: son la traducción, a criterios de percepción visual, de principios ya consolidados como identidad verbal y cultural en `BRAND_FOUNDATIONS.md`. Cada uno indica su grado de respaldo documental.

| Principio | Fuente en BRAND_FOUNDATIONS | Naturaleza de la traducción |
|---|---|---|
| **Claridad** | §11.1, Principio IV: *"La claridad antes que la complejidad."* | Cita directa — traducida literalmente de principio verbal a principio visual |
| **Simplicidad** | §11.2, Principios de producto: *"4. Simplicidad"* (`PRODUCT_PRINCIPLES.md`) | Cita directa |
| **Confianza** | §11.1, Principio II: *"La confianza antes que el crecimiento"*; §9, Visión: *"reconocida por la confianza de su información antes que por la cantidad de funcionalidades"* | Cita directa |
| **Transparencia** | Relación con la Constitución (§11.1: Art. V, "transparencia operativa"); §11.2, Principio 6 (`PRODUCT_PRINCIPLES.md`); §10, La Promesa: *"mostrar la información de la forma más clara y útil posible"* | Cita directa |
| **Accesibilidad** | `BRAND_AUDIT.md` §2 (Diferenciadores): *"Rechazo explícito de patrones oscuros de diseño, compromiso de accesibilidad"*, con base en `docs/book/03-acto-nuestra-forma-de-trabajar/16-El-Acceso-A-La-Informacion-Tambien-Es-Una-Forma-De-Justicia.md` | Cita directa, vía BRAND_AUDIT |
| **Humanidad** | §15, Personalidad: *"Protectora / cercana a la familia"*, con cita de `Nuestra-Promesa.md`: *"Detrás de cada medicamento existe una persona. Un padre. Una madre..."* | Traducción directa de un rasgo de personalidad ya consolidado (marcado como lectura inicial no ratificada en su origen) |
| **Inteligencia** | §5 y §13: categoría declarada como *"Plataforma de Inteligencia Farmacéutica"* | Cita directa — el principio proviene del nombre mismo de la categoría |
| **Evidencia** | §11.1, Principio VI: *"La evidencia antes que el ego."* | Cita directa |
| **Neutralidad** | §14, Diferenciadores: *"plataforma neutral"*; §11.2, Principio 3: *"Neutralidad"*; §12, *"No privilegiamos una farmacia por sobre otra por conveniencia comercial"* | Cita directa |

Ningún principio de esta lista fue añadido sin respaldo textual. Donde la traducción de un principio verbal a un principio visual requiere un paso de interpretación (por ejemplo, de "protectora/cercana" a "humanidad" como principio visual), se indica explícitamente como traducción, no como cita literal.

### 4.3 Atributos Visuales

Se describe únicamente la **percepción** que toda pieza gráfica futura deberá transmitir — no su forma, no su diseño. Cada atributo se clasifica según su respaldo documental, siguiendo la misma disciplina de "no invención" aplicada en `BRAND_AUDIT.md` y `BRAND_FOUNDATIONS.md`.

**Debe sentirse — con respaldo documental directo:**

- **Cercana** — §15 (Protectora/cercana a la familia), §16 (Voz en primera persona plural, excepción a segunda persona singular en el clímax de la promesa).
- **Confiable** — §11.1 Principio II, §9 Visión 2030 (ver tabla de §4.2).
- **Científica** — se deriva de §5/§13 (categoría "Inteligencia Farmacéutica") y de §11.1 Principio VI (evidencia antes que ego); reforzada por §17 (tono "solemne al tratar temas de salud").
- **Profesional** — se deriva de §17, Tono: *"Nosotros no escribimos este libro para inspirar. Lo escribimos para orientar decisiones"* (tono institucional, no publicitario).

**Debe sentirse — por extensión razonable de un principio ya consolidado, sin cita literal exacta:**

- **Limpia** — extensión visual de los principios de Claridad y Simplicidad (§4.2); no existe una cita que use la palabra "limpia" en ningún documento fuente.

**Marcados como pendientes — sin evidencia documental que los respalde hoy:**

- **Moderna** — no existe en `BRAND_FOUNDATIONS.md` ni en sus fuentes ninguna declaración de percepción de modernidad. La misión (§8) menciona "infraestructura tecnológica", pero eso describe una capacidad, no una percepción visual deseada. Se marca como **Pendiente de definición** en vez de asumirla.
- **Optimista** — ninguno de los seis rasgos de personalidad consolidados en §15 corresponde a optimismo; el tono institucional descrito en §17 es más bien solemne y declarativo. Se marca como **Pendiente de definición**; no se incorpora como atributo oficial hasta que exista evidencia o una decisión explícita del CEO/fundador.

Esta clasificación en tres niveles (directo / por extensión / pendiente) es deliberada: el mandato de este documento prohíbe inventar una personalidad distinta a la ya consolidada, y dos de los atributos de ejemplo más habituales en un ejercicio de branding ("moderna", "optimista") simplemente no tienen hoy respaldo en la documentación de ComparaFarma.

### 4.4 Sistema Visual

`BRAND_AUDIT.md` (§5, Vacíos) confirmó que **no existe hoy ningún componente de identidad visual** en el repositorio. Esta sección no resuelve ese vacío: únicamente define qué componentes deberá incluir, a futuro, el sistema visual de ComparaFarma, sin desarrollar ninguno.

El sistema visual deberá incluir, como mínimo, los siguientes componentes:

- Logo
- Isotipo
- Imagotipo
- Paleta de color
- Tipografía
- Iconografía
- Ilustraciones
- Fotografía
- Motion
- Componentes de UI (interfaz de producto)

Cada uno de estos componentes deberá desarrollarse en un documento posterior propio, derivado de los principios y atributos definidos en §4.2 y §4.3, nunca al revés. Ninguno de estos componentes se define, diseña ni ejemplifica en este documento.

### 4.5 Aplicaciones

La identidad visual deberá aplicarse, como mínimo, en los siguientes canales. Se indica, donde existe, la fuente que confirma que el canal es una manifestación real de la plataforma:

| Canal | Fuente / evidencia |
|---|---|
| Google Play | `BRAND_FOUNDATIONS.md` §1 ("Documentos que gobierna" incluye el futuro `GOOGLE_PLAY_BRAND`) y Roadmap de `BRAND_AUDIT.md` §9 |
| App móvil | `BRAND_FOUNDATIONS.md` §5: *"La aplicación móvil, el sitio web, el API y los futuros dashboards son manifestaciones de esa misma plataforma"* |
| Sitio web | Misma cita anterior (§5) |
| Landing | Extensión razonable del canal "Sitio web"; sin cita propia |
| Redes sociales | Canal de comunicación externa no documentado hoy; se incluye por completitud operativa, pendiente de desarrollo en `MARKETING_GUIDE` |
| Presentaciones | Material institucional recurrente del proyecto; sin cita de fuente específica |
| Documentación | Canal donde ya se aplican, de facto, convenciones visuales mínimas (formato de este mismo repositorio) |
| Material institucional | Extensión general de "aplicaciones donde debe verse ComparaFarma", sin cita de fuente específica |

Los canales sin cita de fuente específica se incluyen porque son de sentido operativo evidente (cualquier empresa con una app y un sitio web produce presentaciones y material institucional), no porque exista un documento de marca que los mencione. Se deja constancia de esa diferencia para no confundir evidencia documental con inferencia operativa razonable.

### 4.6 Principios UX

Los siguientes principios de experiencia de usuario se extraen directamente de `BRAND_FOUNDATIONS.md`, no se inventan:

- **Respetar la autonomía de quien decide, nunca manipular** — §15: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir."*
- **No usar patrones de diseño que dificulten decidir con libertad** — §18, Compromisos, consolidado de `docs/book/03-acto-nuestra-forma-de-trabajar/15-...md` y `16-...md`.
- **Priorizar claridad sobre densidad de información** — §11.1, Principio IV (claridad antes que complejidad), traducido a criterio de interfaz.
- **Optimizar para decisión rápida, no para permanencia en pantalla** — §14, Propuesta de Valor: *"en pocos segundos"*; consistente con §17, Tono: *"Lo escribimos para orientar decisiones"* (no para entretener ni retener atención).
- **No aprovechar momentos de vulnerabilidad del usuario** — §18, Compromisos, con base en `docs/book/03-acto-nuestra-forma-de-trabajar/15-Nunca-Aprovecharemos-La-Vulnerabilidad-De-Quienes-Nos-Necesitan.md`.

Estos principios de UX son de comportamiento de interfaz, no de estética. No definen composición visual, solo criterios de diseño de experiencia coherentes con la identidad ya consolidada.

### 4.7 Restricciones

`BRAND_FOUNDATIONS.md` §12 ("Lo que Nunca Seremos") es la fuente principal para justificar qué no debe comunicar visualmente la marca. Se distingue, para cada restricción, entre justificación directa (cita textual) y justificación por extensión de categoría (inferencia razonable a partir de lo que la documentación sí declara).

**No debe parecer — justificación directa:**

- **Farmacia** — §12: *"No somos una farmacia."*
- **Marketplace / e-commerce** — §12: *"No somos un marketplace"*, *"No vendemos medicamentos."*
- **Medio publicitario del sector farmacéutico** — §12: *"No somos una plataforma de publicidad farmacéutica."*

**No debe parecer — justificación por extensión de categoría (sin cita literal exacta):**

- **Laboratorio** — no hay una frase que diga literalmente "no somos un laboratorio", pero se deriva de §13 (la categoría declarada es "Plataforma de Inteligencia Farmacéutica para personas", explícitamente no un actor de manufactura o investigación farmacéutica) y de §12 (no emitimos recomendaciones médicas ni diagnósticos).
- **Aseguradora** — no existe una restricción textual explícita en `BRAND_FOUNDATIONS.md`; se deriva de §13 (categoría "para personas", no un actor financiero o de seguros) y de §11.1 Principio VII (independencia antes que rentabilidad, que excluye modelos de negocio basados en intermediación de riesgo).
- **Portal gubernamental** — no existe cita textual; se deriva de §11.1 Principio VII (independencia) y de la naturaleza privada y neutral de la plataforma declarada en §5 y §14.

Estas tres últimas restricciones no deben tratarse como equivalentes en fuerza documental a las tres primeras. Se recomienda, en una futura revisión de `BRAND_FOUNDATIONS.md`, evaluar si conviene declarar estas exclusiones de forma explícita en su §12, para que dejen de depender de una extensión de categoría y pasen a tener cita directa.

### 4.8 Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Personalidad de marca | `BRAND_FOUNDATIONS.md` §15 | Traducida a Atributos Visuales (§4.3) | Hereda la reserva de su fuente: lectura inicial, no ratificada formalmente |
| Voz | `BRAND_FOUNDATIONS.md` §16 | Referenciada, no traducida a componente gráfico | Es un atributo verbal; informa el tono de futura iconografía/ilustración, no se resuelve aquí |
| Tono institucional | `BRAND_FOUNDATIONS.md` §17 | Informa Atributos Visuales (científica, profesional) | No se define aquí un tono publicitario; sigue pendiente para `BRAND_GUIDELINES`/`MARKETING_GUIDE` |
| Principios permanentes (12 Inmutables) | `BRAND_FOUNDATIONS.md` §11.1 | Traducidos a Principios Visuales (§4.2) | Traducción interpretativa de principio verbal a principio visual, declarada como tal |
| Principios de producto | `BRAND_FOUNDATIONS.md` §11.2 | Traducidos a Principios Visuales (Simplicidad, Neutralidad, Transparencia) | Cita directa |
| Lo que Nunca Seremos | `BRAND_FOUNDATIONS.md` §12 | Consolidado en Restricciones (§4.7) | Justificación directa para farmacia y marketplace/e-commerce; extensión de categoría para laboratorio/aseguradora/portal gubernamental |
| Categoría (Plataforma de Inteligencia Farmacéutica) | `BRAND_FOUNDATIONS.md` §13 | Informa el atributo "Inteligencia" / "Científica" | Cita directa |
| Compromisos (no manipular, no dark patterns) | `BRAND_FOUNDATIONS.md` §18 | Traducidos a Principios UX (§4.6) | Cita directa |
| Identidad visual (logo, color, tipografía, sistema gráfico) | — (vacío confirmado en `BRAND_AUDIT.md` §5) | No se resuelve aquí; solo se define la existencia futura de sus componentes (§4.4) | Pendiente para `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY` |
| Aplicaciones/canales | `BRAND_FOUNDATIONS.md` §5 (parcial) | Consolidado en §4.5 | Algunos canales (redes sociales, presentaciones, material institucional) se incluyen por inferencia operativa, no por cita de fuente |

### 4.9 Roadmap

Únicamente el orden documental posterior. Ningún documento de esta lista se desarrolla en este documento.

```
BRAND_AUDIT
   ↓
BRAND_FOUNDATIONS
   ↓
VISUAL_IDENTITY (este documento)
   ↓
LOGO_SYSTEM
   ↓
COLOR_SYSTEM
   ↓
TYPOGRAPHY_SYSTEM
   ↓
ICONOGRAPHY
   ↓
GOOGLE_PLAY_ASSETS
   ↓
MARKETING_GUIDELINES
```

Este orden es consistente con el Roadmap ya declarado en `docs/brand/BRAND_AUDIT.md` (§9: BRAND_AUDIT → Consolidación documental → BRAND_BOOK → VISUAL_IDENTITY → BRAND_GUIDELINES → GOOGLE_PLAY_BRAND → MARKETING_GUIDE), con dos ajustes que se dejan explícitos: (1) este documento asume que `VISUAL_IDENTITY` puede desarrollarse a partir de `BRAND_FOUNDATIONS` directamente, sin esperar a un `BRAND_BOOK` todavía no creado, dado que su alcance es de arquitectura y no de compilación narrativa; (2) se desagrega `BRAND_GUIDELINES` en los componentes concretos del sistema visual (`LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY`) antes de llegar a `GOOGLE_PLAY_ASSETS` y `MARKETING_GUIDELINES`, siguiendo la lista de componentes ya definida en §4.4. Cualquier decisión de reordenar este roadmap corresponde a quien tenga autoridad de gobierno de marca (CEO/fundador), no a este documento.

---

## 5. Relaciones

`VISUAL_IDENTITY.md` depende, en cadena, de dos cuerpos documentales:

- **`docs/brand/BRAND_FOUNDATIONS.md`** (Fundacional derivado) es la fuente directa e inmediata: define quién es ComparaFarma, y este documento traduce esa identidad a principios de percepción. La relación es de dependencia estricta y en una sola dirección — ver §4.1.
- **`docs/brand/BRAND_AUDIT.md`** es la fuente del diagnóstico que originó este documento: confirmó el vacío de identidad visual (§5) y fijó su lugar en el roadmap documental (§9).
- **`docs/book/` (Carta del Fundador y Acto II — La Identidad)** y **`docs/strategy/VISION_2030.md`** son, indirectamente, la fuente última de los principios y atributos aquí traducidos, en la medida en que `BRAND_FOUNDATIONS.md` ya los consolidó citándolos. Este documento no vuelve a citarlos de forma independiente salvo cuando `BRAND_FOUNDATIONS.md` mismo los cita (ver tabla de §4.2 y §4.3).

Este documento no tiene relación directa con la Arquitectura Empresarial (`docs/enterprise/`) ni con el Patrimonio Digital (`docs/strategy/DIGITAL_ASSET_REGISTER.md`): esos dominios modelan capacidades, datos y servicios, no identidad de marca ni su expresión visual. Esa distinción ya la traza `BRAND_FOUNDATIONS.md` en su §20 y no se repite aquí.

---

## 6. Matriz de Trazabilidad

Ver §4.8, dentro de "Contenido principal". Se ubica allí, y no como sección aislada, porque cada fila de esa matriz corresponde directamente a una subsección de contenido de este mismo documento (Principios Visuales, Atributos Visuales, Restricciones, etc.), y separarla habría duplicado las referencias cruzadas sin aportar claridad adicional.

---

## 7. Gobierno

`VISUAL_IDENTITY.md` **no reemplaza**:

- `docs/brand/BRAND_FOUNDATIONS.md` — sigue siendo la única fuente de verdad sobre quién es ComparaFarma (historia, propósito, misión, visión, promesa, principios, personalidad, voz, tono).
- `docs/brand/BRAND_AUDIT.md` — sigue siendo el diagnóstico documental de origen.
- `docs/book/` ni `docs/strategy/VISION_2030.md` — siguen siendo las fuentes narrativas y estratégicas primarias.

`VISUAL_IDENTITY.md` es, a su vez, gobernado por `BRAND_FOUNDATIONS.md`, que ya lo anticipa en su §1 ("Documentos que gobierna") y en su §2 (Propósito, que ordena a "Diseño" como una de las capas que deben derivarse de esa consolidación). Toda futura revisión de personalidad, voz o tono en `BRAND_FOUNDATIONS.md` debe propagarse a este documento; este documento no debe modificarse de forma independiente de su fuente.

Cuando exista una discrepancia entre este documento y `BRAND_FOUNDATIONS.md`, prevalece `BRAND_FOUNDATIONS.md` — mismo principio de gobierno ya declarado en `docs/enterprise/README.md`: *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*

Este documento se mantiene, de forma explícita y por mandato de su propio encargo, dentro del dominio de Arquitectura de Marca: no incorpora ninguna decisión de Diseño (logo, color, tipografía) ni de Marketing (campañas, tono publicitario). Esa frontera no es una omisión editorial: es una restricción deliberada de alcance (§3).

---

## 8. Documentos relacionados

- `docs/brand/BRAND_FOUNDATIONS.md` — fuente directa de toda la identidad que este documento traduce a percepción visual.
- `docs/brand/BRAND_AUDIT.md` — diagnóstico de origen; confirma el vacío de identidad visual y define el roadmap documental que este documento sigue.
- `docs/book/0. Carta del Fundador.md` y `docs/book/02-acto-la-identidad/` — fuente narrativa primaria de los rasgos de personalidad, voz y tono aquí traducidos.
- `docs/strategy/VISION_2030.md` — fuente de la categoría ("Plataforma de Inteligencia Farmacéutica") que informa el atributo de percepción "científica/inteligente".
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` — estándar documental aplicado en la estructura de este documento.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la arquitectura de identidad visual de ComparaFarma: principios visuales, atributos de percepción, componentes futuros del sistema visual (sin desarrollarlos), aplicaciones, principios de UX derivados de `BRAND_FOUNDATIONS.md`, restricciones justificadas, y roadmap documental posterior. No incluye ninguna propuesta gráfica, logo, paleta de color ni tipografía. | `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/brand/BRAND_AUDIT.md` v1.0; `docs/book/0. Carta del Fundador.md`; `docs/strategy/VISION_2030.md`; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-02 | Auditoría de Gobierno Documental general del repositorio | CTO (rol de Arquitecto de Documentación) | `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Auditoría de identidad de marca | Brand Strategist / Corporate Historian / Enterprise Architect | `docs/brand/BRAND_AUDIT.md` v1.0 |
| 2026-08-05 | Consolidación de identidad de marca | Chief Brand Officer / Corporate Historian / Document Architect | `docs/brand/BRAND_FOUNDATIONS.md` v1.0 |
| 2026-08-05 | Revisión de gobierno documental y elevación al estándar de la Arquitectura Empresarial | Enterprise Documentation Architect | `docs/brand/BRAND_FOUNDATIONS.md` v1.1 y `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |
| 2026-08-05 | Definición de la arquitectura de identidad visual | Brand Architect / UX Strategist / Design System Architect | `docs/brand/VISUAL_IDENTITY.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador. En particular, la clasificación de "Nivel de Gobierno: Estratégico" asignada a este documento (§1) y los dos atributos de percepción marcados como pendientes en §4.3 ("Moderna", "Optimista") quedan sujetos a esa misma ratificación futura.
