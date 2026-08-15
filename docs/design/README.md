> [!IMPORTANT]
>
> ## Frozen
>
> La identidad visual queda congelada.
>
> Cualquier modificación futura deberá realizarse mediante RFC aprobado por el comité.
>
> Cierre declarado el 2026-08-06 (sprint `PROJECT-001`) — ver `docs/archive/project/PROJECT_PHASES_2026-08-06.md`. Incluye, sin limitarse a: `VISUAL_BENCHMARK.md`, `VISUAL_DIRECTION.md`, `COLOR_RESEARCH.md`, `VISUAL_EXPLORATION.md`, `BRAND_EXPERIENCE_V1.md`, `DISTINCTIVE_PRODUCT_IDENTITY.md`, `SIGNATURE_COMPONENTS.md`.
>
> No crear nuevas propuestas de dirección visual, paleta, tipografía o componentes en este dominio. Trabajo permitido: implementación, aplicaciones de marca y materialización de nuevas experiencias de producto sobre esta identidad ya cerrada (`docs/product/experiences/`).

# docs/design/ — Dominio de Proceso de Diseño de ComparaFarma

Este documento es el punto de entrada al dominio `docs/design/`. No redefine la marca. No propone logos, colores, tipografías ni piezas gráficas. Su función es explicar qué vive en este dominio, por qué existe y cómo se relaciona con `docs/brand/`.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DES-RDM-001 |
| **Nombre** | README.md (dominio `docs/design/`) |
| **Dominio** | Proceso de Diseño (`docs/design/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO — mismo criterio ya usado en el resto de la Arquitectura de Marca |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | Chárter de Dominio — nivel introducido en este documento porque ninguno de los 6 niveles originales de `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8, ni el nivel "Fundacional derivado" añadido por `docs/design/brand/BRAND_FOUNDATIONS.md`, describe un documento cuya función es declarar el alcance y las reglas de gobierno de una carpeta completa, sin ser en sí mismo contenido de negocio (ver §7, Gobierno, para el detalle) |
| **Clasificación** | Documento de Gobierno Documental |
| **Fuente Oficial** | Este mismo documento (es la fuente de su propio dominio); se apoya en `docs/design/brand/DESIGN_CONCEPT.md` (v1.0) para justificar la necesidad del dominio |
| **Documentos de los que depende** | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | `docs/archive/design/explorations/DESIGN_EXPLORATION.md`, `docs/design/decisions/DESIGN_DECISION_LOG.md`, `docs/design/assets/README.md`, y todo documento futuro que se cree dentro de `docs/design/` |
| **Pregunta que responde** | ¿Qué documenta `docs/design/`, y qué no le corresponde documentar? |

---

## 2. Propósito

`docs/design/brand/BRAND_AUDIT.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/VISUAL_IDENTITY.md` y `docs/design/brand/DESIGN_CONCEPT.md` (la Arquitectura de Marca) definen, en conjunto, **quién es** ComparaFarma, **cómo debe percibirse** y **qué concepto visual la representa**. Ninguno de esos cuatro documentos registra, sin embargo, **el proceso** mediante el cual esa arquitectura conceptual se convierte en una identidad visual concreta: qué se exploró, qué se descartó, qué se decidió y por qué, y qué activos gráficos existen en cada momento de ese proceso.

`docs/design/` existe para llenar exactamente ese vacío. Su propósito no es redefinir la marca — eso ya está resuelto y consolidado en `docs/brand/` — sino **materializarla de forma trazable**: preservar el conocimiento generado durante la exploración creativa, para que ninguna decisión de diseño relevante se pierda con el tiempo, se repita innecesariamente, o se tome sin dejar rastro de su justificación.

---

## 3. Alcance

**Este documento define:**

- El propósito del dominio `docs/design/` (§2).
- Qué tipo de documentos pertenecen a este dominio y cuáles no (§4).
- La relación de gobierno entre `docs/brand/` y `docs/design/` (§5).
- Los principios de gobierno que rigen el proceso de diseño documentado aquí (§7).

**Este documento NO define:**

- Quién es ComparaFarma, su personalidad, voz o tono. Corresponde a `docs/design/brand/BRAND_FOUNDATIONS.md`.
- Principios ni atributos de percepción visual. Corresponde a `docs/design/brand/VISUAL_IDENTITY.md`.
- El concepto visual central de la marca. Corresponde a `docs/design/brand/DESIGN_CONCEPT.md`.
- Ninguna decisión de diseño concreta (logo, color, tipografía). Esas decisiones, una vez tomadas, se registran en `docs/design/decisions/DESIGN_DECISION_LOG.md`, pero este documento no las contiene.
- El detalle de cada exploración creativa individual. Corresponde a `docs/archive/design/explorations/DESIGN_EXPLORATION.md`.
- Las reglas específicas de almacenamiento de activos gráficos. Corresponde a `docs/design/assets/README.md`.

---

## 4. Contenido principal

### 4.1 Qué tipo de documentos pertenecen a `docs/design/`

- **Bitácoras de exploración creativa** — registros abiertos, no necesariamente resueltos, de sesiones de exploración conceptual o visual (`docs/archive/design/explorations/DESIGN_EXPLORATION.md`).
- **Registros de decisiones de diseño** — el histórico oficial de qué se decidió, cuándo, por qué y con qué impacto (`docs/design/decisions/DESIGN_DECISION_LOG.md`).
- **Activos gráficos generados durante el proceso** — moodboards, exploraciones visuales, logos en desarrollo, iconografía, ilustraciones, fotografía de referencia, versiones descartadas, renders (`docs/design/assets/`, ver reglas en su propio README).
- **Futuros documentos de sistema visual**, una vez que existan (`LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY`, `DESIGN_SYSTEM`), en la medida en que documenten decisiones ya tomadas y no solo el concepto (que sigue siendo responsabilidad de `docs/brand/`).

### 4.2 Qué tipo de documentos NO pertenecen a `docs/design/`

- Cualquier documento que redefina quién es ComparaFarma, su misión, visión, principios, personalidad, voz o tono. Eso pertenece exclusivamente a `docs/design/brand/BRAND_FOUNDATIONS.md`, y `docs/design/` no tiene autoridad para modificarlo.
- Cualquier documento que declare principios de percepción visual o el concepto central de diseño como si fueran nuevos. Esos ya existen en `docs/design/brand/VISUAL_IDENTITY.md` y `docs/design/brand/DESIGN_CONCEPT.md`; `docs/design/` los usa, no los reescribe.
- Documentación de producto, backlog o roadmap funcional. Corresponde a `docs/product/`.
- Documentación de arquitectura técnica de software. Corresponde a `docs/architecture/` y `docs/adr/`.
- Documentación de marketing o comunicación externa. Corresponde a los futuros `MARKETING_GUIDELINES` / `GOOGLE_PLAY_ASSETS`, y solo cuando existan, no a este dominio de proceso.

### 4.3 Principios de gobierno del dominio

1. **Brand define. Design materializa.** `docs/brand/` es la única fuente de verdad sobre identidad, percepción y concepto. `docs/design/` no reinterpreta esas fuentes: las traduce, en un proceso trazable, a resultados gráficos concretos.
2. **Ningún activo gráfico es, por sí solo, una decisión oficial.** Una exploración, un moodboard o un logo en desarrollo solo se convierte en decisión de la organización cuando existe una entrada correspondiente en `docs/design/decisions/DESIGN_DECISION_LOG.md` (ver ese documento, y `docs/design/assets/README.md`).
3. **Ninguna exploración necesita concluir en una decisión.** Una entrada de `docs/archive/design/explorations/DESIGN_EXPLORATION.md` puede quedar abierta indefinidamente. Cerrar prematuramente una exploración para llegar a una decisión contradice el criterio de éxito ya declarado en `docs/design/brand/DESIGN_CONCEPT.md` §7 (evitar resolver el diseño demasiado pronto).
4. **Toda decisión debe ser trazable a su fuente conceptual.** Ninguna entrada de `docs/design/decisions/DESIGN_DECISION_LOG.md` puede aprobarse sin citar el documento de `docs/brand/` (o la exploración de `docs/archive/design/explorations/DESIGN_EXPLORATION.md`) que la justifica.
5. **Este dominio no tiene autoridad de gobierno de marca.** Cuando exista una discrepancia entre lo que se explora o decide aquí y lo que ya está consolidado en `docs/brand/`, prevalece `docs/brand/` — mismo principio de gobierno ya declarado en `docs/enterprise/README.md`: *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*

---

## 5. Relaciones

`docs/design/` depende, en cadena, de toda la Arquitectura de Marca:

```
docs/design/brand/BRAND_AUDIT.md
        ↓
docs/design/brand/BRAND_FOUNDATIONS.md
        ↓
docs/design/brand/VISUAL_IDENTITY.md
        ↓
docs/design/brand/DESIGN_CONCEPT.md
        ↓
docs/design/          ← este dominio (proceso, exploración, decisiones, activos)
        ↓
futuros LOGO_SYSTEM, COLOR_SYSTEM, TYPOGRAPHY_SYSTEM,
ICONOGRAPHY, DESIGN_SYSTEM, GOOGLE_PLAY_ASSETS, MARKETING_GUIDELINES
```

La relación de fondo, en una frase: **`docs/brand/` define. `docs/design/` materializa. `docs/brand/` gobierna. `docs/design/` implementa.** Ninguno de los documentos de `docs/design/` tiene autoridad para modificar `docs/brand/`; la dirección de dependencia es estrictamente de `docs/design/` hacia `docs/brand/`, nunca al revés.

No existe relación directa entre `docs/design/` y la Arquitectura Empresarial (`docs/enterprise/`) ni con el Patrimonio Digital (`docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`), por el mismo motivo ya declarado en `docs/design/brand/BRAND_FOUNDATIONS.md` §20: esos dominios modelan capacidades, datos y servicios, no proceso creativo de marca.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Concepto de diseño a materializar (Orientación) | `docs/design/brand/DESIGN_CONCEPT.md` §4.2 | Referencia — no se redefine | El dominio `docs/design/` lo usa como insumo de todo proceso de exploración |
| Principios y atributos de percepción visual | `docs/design/brand/VISUAL_IDENTITY.md` §4.2, §4.3 | Referencia — no se redefine | Idem |
| Identidad de marca (historia, misión, visión, principios, personalidad, voz, tono) | `docs/design/brand/BRAND_FOUNDATIONS.md` | Referencia — no se redefine | `docs/design/` no tiene autoridad para modificar estos conceptos |
| Estructura del dominio de proceso de diseño | Este documento | ✔ | Primera versión; no existía previamente ningún documento equivalente |
| Existencia y ubicación del dominio `docs/design/` | — (vacío antes de este documento) | ✔ | Confirmado por inspección directa: la carpeta `docs/design/` no contenía, antes de este encargo, ningún documento de gobierno — solo un activo gráfico suelto (ver `docs/archive/design/explorations/DESIGN_EXPLORATION.md`, EXP-001) |

---

## 7. Gobierno

`docs/design/` **no reemplaza** ni tiene autoridad para modificar:

- `docs/design/brand/BRAND_FOUNDATIONS.md` — identidad de marca.
- `docs/design/brand/VISUAL_IDENTITY.md` — principios y atributos de percepción visual.
- `docs/design/brand/DESIGN_CONCEPT.md` — concepto visual central y metáforas analizadas.

Este dominio es, en cambio, gobernado por los tres documentos anteriores: toda exploración, decisión o activo que se documente en `docs/design/` debe ser coherente con ellos, y debe corregirse si en algún momento deja de serlo.

**Sobre el nuevo nivel de gobierno introducido ("Chárter de Dominio"):** `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (§"Niveles de Gobierno Documental reconocidos") define 7 niveles, ninguno de los cuales describe con precisión a un documento README cuya función es declarar el alcance de una carpeta completa sin ser, en sí mismo, contenido de negocio. Este documento introduce el nivel **"Chárter de Dominio"** para cubrir ese caso, siguiendo el mismo procedimiento que la propia plantilla anticipa (*"Si un documento no encaja claramente en ninguno, corresponde revisar si se trata de un nuevo nivel aún no reconocido, y de ser así, agregarlo"*). Esta plantilla no fue modificada como parte de este encargo, por estar fuera de su alcance (ver Restricciones del encargo bajo el cual se creó este documento); se deja esta observación registrada para que una futura revisión de `GOVERNED_DOCUMENT_TEMPLATE.md` incorpore formalmente este nivel, dado que también aplicaría, en retrospectiva, a `docs/enterprise/README.md` y al nuevo `docs/design/brand/README.md`.

Cuando exista una discrepancia entre cualquier documento de `docs/design/` y su fuente en `docs/brand/`, prevalece `docs/brand/` — mismo principio ya declarado en `docs/enterprise/README.md`.

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_AUDIT.md` — diagnóstico de origen de toda la Arquitectura de Marca.
- `docs/design/brand/BRAND_FOUNDATIONS.md` — identidad consolidada de ComparaFarma.
- `docs/design/brand/VISUAL_IDENTITY.md` — principios y atributos de percepción visual.
- `docs/design/brand/DESIGN_CONCEPT.md` — concepto visual central y metáforas analizadas.
- `docs/archive/design/explorations/DESIGN_EXPLORATION.md` — bitácora de exploración creativa.
- `docs/design/decisions/DESIGN_DECISION_LOG.md` — registro oficial de decisiones de diseño.
- `docs/design/assets/README.md` — reglas de almacenamiento de activos gráficos.
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` — estándar documental aplicado en la estructura de este documento.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial. Establece el dominio `docs/design/` como responsable de documentar el proceso completo de diseño de la marca (exploraciones, decisiones, activos), sin redefinir la identidad ya consolidada en `docs/brand/`. Introduce el nivel de gobierno "Chárter de Dominio". | `docs/design/brand/DESIGN_CONCEPT.md` v1.0; `docs/design/brand/VISUAL_IDENTITY.md` v1.0; `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-02 | Auditoría de Gobierno Documental general del repositorio | CTO (rol de Arquitecto de Documentación) | `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Auditoría de identidad de marca | Brand Strategist / Corporate Historian / Enterprise Architect | `docs/design/brand/BRAND_AUDIT.md` v1.0 |
| 2026-08-05 | Consolidación de identidad de marca | Chief Brand Officer / Corporate Historian / Document Architect | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.0 |
| 2026-08-05 | Revisión de gobierno documental y elevación al estándar de la Arquitectura Empresarial | Enterprise Documentation Architect | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1 y `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |
| 2026-08-05 | Definición de la arquitectura de identidad visual | Brand Architect / UX Strategist / Design System Architect | `docs/design/brand/VISUAL_IDENTITY.md` v1.0 |
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/design/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-05 | Creación del dominio documental de proceso de diseño | Enterprise Documentation Architect / Design Governance Architect | `docs/design/README.md` v1.0 (este documento), `docs/archive/design/explorations/DESIGN_EXPLORATION.md` v1.0, `docs/design/decisions/DESIGN_DECISION_LOG.md` v1.0, `docs/design/assets/README.md` v1.0 |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador. El nuevo nivel de gobierno "Chárter de Dominio" queda sujeto a esa misma ratificación futura, al igual que su eventual incorporación formal a `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.
