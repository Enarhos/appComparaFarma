# BRAND_GUIDELINES — Gobierno de Convivencia de la Identidad de ComparaFarma

Este documento no es un Brand Book. No es un manual gráfico. No contiene mockups, aplicaciones ni ejemplos visuales. Es el documento de **gobierno que integra** los cuatro sistemas de identidad ya construidos — `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` y `COLOR_SYSTEM.md` — y define cómo deben convivir entre sí, sin repetir, reinterpretar ni sustituir ninguno de ellos. Debe seguir siendo válido aunque, en el futuro, cambien por completo la paleta, la tipografía, el isotipo o incluso el producto — porque no gobierna ninguna de esas decisiones: gobierna la manera en que decisiones futuras de esa naturaleza deberán convivir entre sí.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-GUI-001 |
| **Nombre** | BRAND_GUIDELINES.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Brand Architect / Brand Governance Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — sexto grado de derivación: se apoya simultáneamente en `docs/design/brand/LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` y `COLOR_SYSTEM.md` (tercer a quinto grado), todos derivados en cadena de `docs/design/brand/VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` y, en última instancia, de `docs/design/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Gobierno de Marca / Integración de Sistemas |
| **Fuente Oficial** | Este documento es la fuente oficial de las **reglas de convivencia** entre los cuatro sistemas de identidad. No es fuente de identidad, arquitectura de marca, concepto de diseño, ni de ninguno de los cuatro sistemas individuales — cada uno conserva su propia fuente oficial declarada en su propio documento |
| **Documentos de los que depende** | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/design/DESIGN_BRIEF.md`, `docs/design/brand/LOGO_SYSTEM.md`, `docs/design/brand/TYPOGRAPHY_SYSTEM.md`, `docs/design/brand/ICONOGRAPHY_SYSTEM.md`, `docs/design/brand/COLOR_SYSTEM.md`, `docs/design/BRAND_IDENTITY_VALIDATION.md`, `docs/design/decisions/DESIGN_DECISION_LOG.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar la relación de convivencia de cualquier sistema de identidad futuro, y condiciona estructuralmente a un futuro `BRAND_BOOK.md` (que deberá implementarlo, nunca contradecirlo) y a un futuro `DESIGN_SYSTEM` de producto (§4.5) |
| **Pregunta que responde** | ¿Cómo deben convivir e implementarse conjuntamente todos los sistemas oficiales de identidad de ComparaFarma para garantizar una experiencia de marca coherente en cualquier canal presente o futuro? |

---

## 2. Propósito

Cada uno de los cuatro sistemas de identidad ya construidos —`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`— fue diseñado para gobernarse a sí mismo con rigor, y cada uno ya declara, de forma individual, que no reemplaza a los demás. Pero ninguno de ellos —por diseño, no por omisión— responde qué ocurre cuando los cuatro se aplican **al mismo tiempo**, sobre la misma pantalla, en el mismo canal: cómo debe comportarse la jerarquía visual cuando tipografía, color e iconografía compiten por la misma atención; qué sistema cede cuando dos reglas, ambas correctas en su propio documento, podrían tensionarse en la práctica.

Ese es exclusivamente el rol de `BRAND_GUIDELINES.md`: no añade ninguna decisión nueva a la Arquitectura de Marca, no reinterpreta ninguna de las ya tomadas — **integra** las que ya existen, haciendo explícito cómo conviven, para que ninguna implementación futura tenga que inferir esa convivencia por su cuenta.

---

## 3. Alcance

**Este documento define:**

- La arquitectura de dependencia completa de la identidad de ComparaFarma, desde `BRAND_FOUNDATIONS.md` hasta las implementaciones futuras, presentada como una sola estructura (§4.1).
- Principios de convivencia entre los cuatro sistemas, derivados sin excepción de reglas ya declaradas en su documentación de origen (§4.2).
- Reglas generales de implementación aplicables a cualquier canal presente o futuro, sin detalle de implementación (§4.3).
- El mecanismo de gobierno de cambios que protege la coherencia del conjunto (§4.4).
- La frontera entre este documento y un futuro Design System de producto (§4.5).
- La frontera entre este documento y un futuro Brand Book (§4.6).

**Este documento NO define:**

- Ningún Brand Book. No contiene mockups, aplicaciones, plantillas ni ejemplos visuales — eso corresponde a un futuro `BRAND_BOOK.md`, no creado (§4.6).
- Ningún Design System de producto. No define componentes de interfaz, patrones de interacción ni tokens técnicos — eso corresponde a un futuro `DESIGN_SYSTEM`, no creado (§4.5).
- Ninguna decisión ya tomada en `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` o `COLOR_SYSTEM.md`. Este documento no repite sus capas, categorías, principios ni restricciones — se remite a cada uno como fuente exclusiva de su propia materia.
- Ninguna decisión de identidad, arquitectura de marca, concepto de diseño o encargo de diseño ya tomada en `BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` o `DESIGN_BRIEF.md`. Este documento no las reinterpreta.
- Ninguna paleta, tipografía, ícono o forma de isotipo concretos — esas decisiones, cuando existan, seguirán viviendo exclusivamente en sus documentos de origen, nunca en este.

---

## 4. Contenido principal

### 4.1 Arquitectura de la Identidad

La identidad de ComparaFarma no es una lista de nueve documentos independientes: es una arquitectura de dependencia, con una sola dirección de derivación.

```
docs/design/brand/BRAND_FOUNDATIONS.md
   ¿Quién es ComparaFarma?
              ↓
docs/design/brand/BRAND_ARCHITECTURE.md
   ¿Cómo se organiza la marca y el portafolio? (Branded House)
              ↓
docs/design/brand/VISUAL_IDENTITY.md  +  docs/design/brand/DESIGN_CONCEPT.md
   ¿Qué principios y qué concepto debe expresar cualquier pieza visual?
              ↓
docs/design/DESIGN_BRIEF.md
   Encargo operable de diseño: restricciones y criterios de evaluación
              ↓
   ┌───────────────┬────────────────────┬────────────────────┬───────────────┐
   ↓               ↓                    ↓                     ↓
LOGO_SYSTEM   TYPOGRAPHY_SYSTEM   ICONOGRAPHY_SYSTEM     COLOR_SYSTEM
(estructura    (arquitectura de     (categorías              (responsabilidades
del logotipo)  capas tipográficas)  funcionales)             funcionales del color)
   └───────────────┴────────────────────┴────────────────────┴───────────────┘
              ↓
docs/design/brand/BRAND_GUIDELINES.md (este documento)
   ¿Cómo conviven los cuatro sistemas entre sí?
              ↓
   ┌────────────────────────┬─────────────────────────────┐
   ↓                        ↓
Futuro BRAND_BOOK       Futuro DESIGN_SYSTEM
(implementa la          (implementa el producto:
identidad en piezas      componentes de interfaz,
de comunicación)         patrones de interacción)
```

Dos precisiones sobre esta arquitectura, ninguna de las cuales es una decisión nueva de este documento:

1. **Los cuatro sistemas son hermanos, no una secuencia.** Ninguno depende de otro: los cuatro dependen, de forma independiente, de `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` y `DESIGN_BRIEF.md`. Ninguno de los cuatro documentos individuales se atribuye autoridad sobre los otros tres — cada uno lo declara explícitamente en su propia sección de Gobierno. `BRAND_GUIDELINES.md` es el primer documento que los trata como un conjunto coordinado, no como cuatro entregables paralelos sin relación entre sí.
2. **El Brand Book y el Design System son ramas distintas, no continuaciones del mismo camino.** Ambos se derivan de este documento, pero responden preguntas distintas — desarrollado en §4.5 y §4.6.

### 4.2 Principios de Convivencia

Ninguno de los siguientes principios es nuevo: cada uno ya está declarado, de forma explícita, en al menos uno de los documentos de origen. Este documento los reúne porque, dispersos en cuatro documentos distintos, no eran visibles como un conjunto único de reglas de convivencia.

- **Ningún sistema reemplaza a otro.** Cada uno de los cuatro sistemas declara explícitamente, en su propia sección de Gobierno, que no reemplaza a los demás documentos de `docs/brand/` (`LOGO_SYSTEM.md` §7, `TYPOGRAPHY_SYSTEM.md` §7, `ICONOGRAPHY_SYSTEM.md` §7, `COLOR_SYSTEM.md` §7). Este documento no introduce esa regla: la confirma como condición de conjunto.
- **La jerarquía visual no depende únicamente del color.** `TYPOGRAPHY_SYSTEM.md` §4.5 exige que cada nivel de jerarquía sea distinguible "incluso sin color"; `COLOR_SYSTEM.md` §4.3 exige que "el color... nunca sustituya a la tipografía como su mecanismo primario" de jerarquía. Ambas reglas, escritas en documentos distintos, ya son la misma regla vista desde dos lados.
- **El isotipo no sustituye a la iconografía.** `ICONOGRAPHY_SYSTEM.md` §4.8 declara que el isotipo representa la marca y los íconos representan funcionalidades, que "no deben competir entre sí", y prohíbe explícitamente que el isotipo se use como uno más de los íconos funcionales.
- **La tipografía no reemplaza la arquitectura de información.** `docs/design/DESIGN_BRIEF.md` §4.11 ya declara que "la jerarquía visual de la información es, para este producto, tan parte de la identidad como cualquier elemento gráfico" — y `TYPOGRAPHY_SYSTEM.md` §3 declara explícitamente que no define componentes de interfaz ni arquitectura de información de producto. Ninguna decisión tipográfica puede, por tanto, presentarse como sustituto de una decisión de arquitectura de información que todavía no existe.
- **El color no introduce sesgos.** Es el desarrollo íntegro de `COLOR_SYSTEM.md` §4.5 (Neutralidad), a su vez derivado de `BRAND_FOUNDATIONS.md` §12 y §11.2. Ningún otro sistema puede introducir, por una vía distinta al color, el mismo tipo de sesgo que `COLOR_SYSTEM.md` ya prohíbe — por ejemplo, un ícono de "Farmacias" que distinga visualmente a una farmacia como preferida contradiría el mismo principio, aunque no use color (`ICONOGRAPHY_SYSTEM.md` §4.2.7).
- **Ningún ícono puede reutilizar la forma del isotipo, ni el isotipo puede aplicarse como ícono.** Prohibición explícita y recíproca ya declarada en `ICONOGRAPHY_SYSTEM.md` §4.8.
- **Ningún sistema puede depender, para su coherencia interna, de una decisión de implementación que todavía no existe.** Los cuatro sistemas están construidos para funcionar como arquitectura incluso mientras la familia tipográfica, la paleta y la geometría final del isotipo permanecen pendientes (`TYPOGRAPHY_SYSTEM.md` §3, `COLOR_SYSTEM.md` §3, `LOGO_SYSTEM.md` §4.4) — esta es, en sí misma, una condición de convivencia entre los cuatro, no solo una característica de cada uno por separado.

### 4.3 Reglas de Implementación

Principios generales aplicables a cualquier canal, sin definir detalles de implementación — cada canal se apoya en evidencia ya confirmada en la documentación existente, distinguiendo lo documentado de lo incluido por extensión operativa razonable (misma disciplina ya aplicada en `docs/design/DESIGN_BRIEF.md` §4.12):

- **Web:** canal ya confirmado (`VISUAL_IDENTITY.md` §4.5). Cualquier implementación debe sostener la convivencia simultánea de los cuatro sistemas — ninguno puede aplicarse de forma aislada del resto sin verificar coherencia con los demás.
- **Mobile:** canal primario de diseño (`docs/design/DESIGN_BRIEF.md` §4.11: "el producto es de uso móvil intensivo"; `TYPOGRAPHY_SYSTEM.md` §4.6). Toda implementación debe partir de las condiciones más restrictivas de cada sistema (tamaño mínimo del isotipo, legibilidad tipográfica móvil, escalabilidad de iconografía) y adaptarse hacia arriba, no al revés.
- **Marketing:** canal pendiente de un futuro `MARKETING_GUIDELINES` (roadmap ya declarado en `VISUAL_IDENTITY.md` §4.9). Mientras ese documento no exista, cualquier pieza de marketing debe respetar los cuatro sistemas ya vigentes sin anticipar decisiones de tono publicitario, que `BRAND_FOUNDATIONS.md` §17 ya declara pendientes.
- **Presentaciones:** canal ya confirmado (`VISUAL_IDENTITY.md` §4.5); debe funcionar en fondo blanco o impreso, no solo en interfaz digital (`docs/design/DESIGN_BRIEF.md` §4.12).
- **Redes Sociales:** canal incluido por extensión operativa (`VISUAL_IDENTITY.md` §4.5, `DESIGN_BRIEF.md` §4.12); sujeto a las mismas restricciones de área de seguridad del isotipo ya señaladas para máscaras de recorte variable en avatares (`LOGO_SYSTEM.md` §4.7; `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-003).
- **Documentación:** canal ya confirmado (`VISUAL_IDENTITY.md` §4.5) — este mismo repositorio documental es, de hecho, el primer canal donde eventualmente deberán aplicarse los cuatro sistemas, aunque hoy siga en formato de texto sin estilo visual propio.
- **Material impreso:** canal incluido por extensión operativa (`DESIGN_BRIEF.md` §4.12: merchandising, bordado, grabado, ya evaluados para el isotipo en `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-003); exige que los cuatro sistemas toleren reproducción física de baja tolerancia (una tinta, sin gradientes — `LOGO_SYSTEM.md` §4.5, `COLOR_SYSTEM.md` §4.2.1).

**Regla común a todos los canales:** ningún canal puede resolver una necesidad de implementación introduciendo una variación paralela de alguno de los cuatro sistemas. Cada uno ya declara, de forma individual, esta misma regla de evolución (`LOGO_SYSTEM.md` §5, `ICONOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.6); este documento la eleva a regla de implementación transversal a todo canal, presente o futuro.

### 4.4 Gobierno de Cambios

**Ningún cambio aislado puede romper la coherencia del sistema.** Un cambio propuesto sobre uno solo de los cuatro sistemas —por ejemplo, una capa nueva de color, una categoría nueva de iconografía, una variante nueva del logotipo— debe evaluarse contra los otros tres antes de aprobarse, no solo contra su propio documento de origen. Un cambio que cumple perfectamente las reglas de `COLOR_SYSTEM.md` pero contradice un principio de convivencia ya declarado en §4.2 de este documento no puede considerarse aprobado solo porque su propio sistema lo permita.

**Toda modificación relevante debe registrarse mediante el mecanismo oficial de decisiones de diseño** (`docs/design/decisions/DESIGN_DECISION_LOG.md`). Este documento consolida una observación que ya aparece, de forma repetida, en los cuatro sistemas individuales (`LOGO_SYSTEM.md` §5, `ICONOGRAPHY_SYSTEM.md` §4.7, `COLOR_SYSTEM.md` §4.6): `DESIGN_DECISION_LOG.md` registra hoy únicamente la decisión DD-001 (concepto "Orientación"), y ninguno de los cuatro sistemas cuenta todavía con una fila formal que registre su propia adopción. Ninguno de los cuatro sistemas —ni este documento de gobierno que los integra— puede considerarse en pleno cumplimiento de su propio mandato de gobierno mientras ese registro siga incompleto. Esta observación no se resuelve aquí; se consolida como una única acción de gobierno pendiente en lugar de cuatro observaciones repetidas y dispersas.

### 4.5 Relación con el Design System

**`BRAND_GUIDELINES.md` gobierna la identidad. El futuro Design System gobernará la implementación del producto.**

La frontera entre ambos ya está parcialmente declarada, de forma independiente, en cada uno de los cuatro sistemas (`LOGO_SYSTEM.md` §3: "no define componentes de interfaz"; `TYPOGRAPHY_SYSTEM.md` §3: "no crea un manual de UI"; `ICONOGRAPHY_SYSTEM.md` §3: "no define componentes de interfaz"; `COLOR_SYSTEM.md` §3: "no define componentes de interfaz ni patrones de UI"). Este documento consolida esa frontera compartida en una sola declaración explícita: **ningún contenido de los cuatro sistemas, ni de este documento, constituye una especificación de componente de interfaz, patrón de interacción o token técnico de implementación** (espaciado, breakpoints, estados de componente).

Un futuro `DESIGN_SYSTEM` de producto —aplicado a `mobile/` y `web/`— deberá derivarse de estos cinco documentos (los cuatro sistemas y este), nunca sustituirlos ni contradecirlos. Donde el Design System necesite una decisión que estos documentos no resuelven (por ejemplo, el tamaño exacto en píxeles de un componente), esa decisión es de implementación técnica y queda, por diseño, fuera del alcance de la Arquitectura de Marca.

### 4.6 Relación con el Brand Book

**`BRAND_GUIDELINES.md` → Brand Book.**

Las Brand Guidelines **gobiernan**: definen los principios, la arquitectura y las reglas de convivencia que cualquier expresión de la marca debe cumplir, sin importar la forma final que tome. El Brand Book **implementa**: cuando se cree (ya anticipado en el roadmap de `docs/design/brand/BRAND_AUDIT.md` §9 y `VISUAL_IDENTITY.md` §4.9), contendrá los ejemplos visuales, mockups, plantillas y aplicaciones reales que este documento explícitamente no contiene.

La relación es de dependencia en una sola dirección: el futuro Brand Book debe derivarse íntegramente de este documento y de los cuatro sistemas que integra. Ninguna decisión tomada en un futuro Brand Book puede contradecir lo ya gobernado aquí sin que, antes, se registre un cambio formal en el documento de origen correspondiente (§4.4). Un Brand Book que introdujera, por ejemplo, un uso de color no contemplado en `COLOR_SYSTEM.md` no estaría "implementando" la identidad: estaría tomando una decisión de sistema por la puerta equivocada.

---

## 5. Relaciones

`BRAND_GUIDELINES.md` depende, de forma simultánea y no jerárquica, de los cuatro sistemas de identidad ya vigentes (`LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`, `COLOR_SYSTEM.md`), y en cadena, de toda la Arquitectura de Marca que los origina (`BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md`, `DESIGN_BRIEF.md`). Se relaciona también con `docs/design/BRAND_IDENTITY_VALIDATION.md`, cuyo resultado condicionado ("Aprobar con ajustes") es una de las razones por las que este documento gobierna convivencia y arquitectura sin poder declarar el conjunto como plenamente operativo, y con `docs/design/decisions/DESIGN_DECISION_LOG.md`, cuyo registro incompleto es una observación de gobierno consolidada en §4.4.

Su responsabilidad específica dentro de la Arquitectura de Marca es distinta a la de cada uno de los nueve documentos de los que depende: ninguno de ellos responde qué ocurre cuando los cuatro sistemas se aplican de forma simultánea. `BRAND_GUIDELINES.md` es el primer y único documento del repositorio que trata la identidad de ComparaFarma como un sistema integrado, no como cuatro entregables paralelos.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Identidad de marca (quién es ComparaFarma) | `docs/design/brand/BRAND_FOUNDATIONS.md` | Referencia — origen de toda la arquitectura (§4.1) | No se reinterpreta |
| Modelo de marca única (Branded House) | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.1 | Referencia — fundamenta la coherencia entre canales exigida en §4.3 | — |
| Principios y atributos de percepción visual | `docs/design/brand/VISUAL_IDENTITY.md` | Referencia — fuente común de los cuatro sistemas (§4.1) | — |
| Concepto central "Orientación" y metáfora | `docs/design/brand/DESIGN_CONCEPT.md`; `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-001 | Referencia | — |
| Encargo de diseño y restricciones de imagen | `docs/design/DESIGN_BRIEF.md` | Referencia — fuente de varias reglas de implementación (§4.3) | — |
| Estructura del sistema de logotipo | `docs/design/brand/LOGO_SYSTEM.md` | ✔ — integrado en principios de convivencia (§4.2) y arquitectura (§4.1) | No se duplica su contenido |
| Arquitectura del sistema tipográfico | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` | ✔ — integrado en §4.2, §4.5 | No se duplica su contenido |
| Arquitectura del sistema de iconografía | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` | ✔ — integrado en §4.2, §4.5 | No se duplica su contenido |
| Arquitectura del sistema de color | `docs/design/brand/COLOR_SYSTEM.md` | ✔ — integrado en §4.2, §4.5 | No se duplica su contenido |
| Estado de aprobación del isotipo | `docs/design/BRAND_IDENTITY_VALIDATION.md` | Referencia — condiciona la nota de gobierno de §5 | Estado "Aprobar con ajustes" |
| Registro de decisiones de diseño | `docs/design/decisions/DESIGN_DECISION_LOG.md` | ✔ — observación de gobierno consolidada (§4.4) | Registro incompleto: solo DD-001 |
| Frontera con implementación de producto | Declarada de forma independiente en cada uno de los cuatro sistemas (§3 de cada documento) | ✔ — consolidada en una sola declaración (§4.5) | — |
| Brand Book, mockups, aplicaciones visuales | — (no existe todavía) | No consolidado — declarado explícitamente fuera de alcance (§3, §4.6) | Pendiente de un futuro `BRAND_BOOK.md` |
| Design System de producto | — (no existe todavía) | No consolidado — declarado explícitamente fuera de alcance (§3, §4.5) | Pendiente de un futuro `DESIGN_SYSTEM` |

---

## 7. Gobierno

`BRAND_GUIDELINES.md` **no reemplaza**:

- `docs/design/brand/BRAND_FOUNDATIONS.md` — sigue siendo la única fuente de identidad de marca.
- `docs/design/brand/BRAND_ARCHITECTURE.md` — sigue siendo la única fuente del modelo de marca y portafolio.
- `docs/design/brand/VISUAL_IDENTITY.md` — sigue siendo la única fuente de principios y atributos de percepción visual.
- `docs/design/brand/DESIGN_CONCEPT.md` — sigue siendo la única fuente del concepto central de diseño.
- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y sus criterios de evaluación.
- `docs/design/brand/LOGO_SYSTEM.md` — sigue siendo la única fuente de estructura del sistema de logotipo.
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md` — sigue siendo la única fuente de arquitectura del sistema tipográfico.
- `docs/design/brand/ICONOGRAPHY_SYSTEM.md` — sigue siendo la única fuente de arquitectura del sistema de iconografía.
- `docs/design/brand/COLOR_SYSTEM.md` — sigue siendo la única fuente de arquitectura del sistema de color.

La responsabilidad específica de `BRAND_GUIDELINES.md` dentro de la Arquitectura de Marca es **integrar, sin sustituir**: es el único documento que gobierna la convivencia simultánea de los cuatro sistemas, las reglas de implementación transversales a cualquier canal, el mecanismo de gobierno de cambios que protege la coherencia del conjunto, y la frontera compartida con un futuro Design System y un futuro Brand Book. No gobierna, y no debe absorber en ninguna revisión futura, ninguna decisión que ya pertenezca a uno de los nueve documentos de los que depende — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito de este documento: debe seguir siendo válido aunque cambien por completo la paleta, la tipografía, el isotipo o el producto, porque ninguno de esos cambios altera las reglas de convivencia que aquí se gobiernan.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en el resto de `docs/brand/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Este documento hereda, y no resuelve por sí mismo, los pendientes de gobierno ya señalados en sus fuentes: los cuatro ajustes de `docs/design/BRAND_IDENTITY_VALIDATION.md` y el registro incompleto de `docs/design/decisions/DESIGN_DECISION_LOG.md` (§4.4).

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/BRAND_ARCHITECTURE.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/DESIGN_CONCEPT.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/design/brand/LOGO_SYSTEM.md`
- `docs/design/brand/TYPOGRAPHY_SYSTEM.md`
- `docs/design/brand/ICONOGRAPHY_SYSTEM.md`
- `docs/design/brand/COLOR_SYSTEM.md`
- `docs/design/BRAND_IDENTITY_VALIDATION.md`
- `docs/design/decisions/DESIGN_DECISION_LOG.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: un futuro `BRAND_BOOK.md` (§4.6) y un futuro `DESIGN_SYSTEM` de producto (§4.5).

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define el gobierno de convivencia entre `LOGO_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` y `COLOR_SYSTEM.md`: arquitectura completa de la identidad, principios de convivencia derivados sin excepción de reglas ya declaradas, reglas de implementación por canal, mecanismo de gobierno de cambios, frontera con un futuro Design System y con un futuro Brand Book. No crea ningún Brand Book, no diseña componentes ni contiene ejemplos visuales. Consolida en una sola observación el registro incompleto de `DESIGN_DECISION_LOG.md` ya señalado de forma repetida en los cuatro sistemas. | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `DESIGN_CONCEPT.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/design/brand/LOGO_SYSTEM.md` v1.0; `TYPOGRAPHY_SYSTEM.md` v1.0; `ICONOGRAPHY_SYSTEM.md` v1.0; `COLOR_SYSTEM.md` v1.0; `docs/design/BRAND_IDENTITY_VALIDATION.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición de la especificación oficial del sistema de logotipo | Brand Architect / Identity Systems Director / Enterprise Documentation Architect | `docs/design/brand/LOGO_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema tipográfico | Brand Architect / Type Director / Enterprise Documentation Architect | `docs/design/brand/TYPOGRAPHY_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de iconografía | Iconography Director / Design Systems Architect / Enterprise Documentation Architect | `docs/design/brand/ICONOGRAPHY_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de la especificación oficial del sistema de color | Brand Architect / Color Systems Director / Enterprise Documentation Architect | `docs/design/brand/COLOR_SYSTEM.md` v1.0 |
| 2026-08-05 | Integración de los cuatro sistemas de identidad bajo un único gobierno de convivencia | Brand Architect / Brand Governance Director / Enterprise Documentation Architect | `docs/design/brand/BRAND_GUIDELINES.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. La creación de un futuro Brand Book y de un futuro Design System de producto queda, en su totalidad, fuera de esta versión y pendiente de trabajo posterior — ambos deberán derivarse de este documento, no sustituirlo.
