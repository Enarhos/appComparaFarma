> [!IMPORTANT]
>
> ## Estado del dominio
>
> **Status:** MANAGED
>
> La gobernanza del dominio Brand se considera finalizada.
>
> No crear nuevos documentos de arquitectura de marca.
>
> Las futuras contribuciones deberán limitarse a:
>
> - Implementación
> - Aplicaciones de marca
> - Assets gráficos
> - Brand Book
>
> Cualquier cambio de arquitectura requiere reabrir oficialmente el dominio.
>
> Ver:
>
> docs/design/brand/DOMAIN_STATUS.md


# docs/brand/ — Arquitectura de Marca de ComparaFarma

Este documento es el punto de entrada al dominio `docs/brand/`. No existía previamente ningún README en esta carpeta — se confirmó por inspección directa del directorio antes de crear este documento. Se crea ahora, en versión 1.0, como parte de la definición del nuevo dominio `docs/design/`, que requiere explicar cómo se relaciona con la Arquitectura de Marca ya existente.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-RDM-001 |
| **Nombre** | README.md (dominio `docs/brand/`) |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | Chárter de Dominio — mismo nivel introducido en `docs/design/README.md` §1 |
| **Clasificación** | Documento de Gobierno Documental |
| **Fuente Oficial** | Este mismo documento |
| **Documentos de los que depende** | `docs/design/brand/BRAND_AUDIT.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/design/README.md` |
| **Documentos que gobierna** | Ninguno directamente; orienta la lectura de todo `docs/brand/` |
| **Pregunta que responde** | ¿Qué contiene `docs/brand/`, en qué orden debe leerse, y cómo se relaciona con `docs/design/`? |

---

## 2. Propósito

Este documento explica qué es la Arquitectura de Marca de ComparaFarma, qué documentos la componen, en qué orden deben leerse, y cómo se relaciona con el dominio de proceso de diseño (`docs/design/`), creado posteriormente para documentar cómo esa arquitectura se materializa en una identidad visual concreta.

---

## 3. Alcance

**Este documento define:**

- Los documentos que componen `docs/brand/` y el orden recomendado de lectura (§4.1).
- La relación de gobierno entre `docs/brand/` y `docs/design/` (§4.2).

**Este documento NO define:**

- Ningún contenido conceptual de identidad, percepción o concepto visual. Eso vive en los documentos que este índice referencia, no en este documento.

---

## 4. Contenido principal

### 4.1 Documentos de `docs/brand/` y orden recomendado de lectura

1. **`BRAND_AUDIT.md`** (v1.0, Draft) — Auditoría de identidad de marca. Diagnóstico de solo lectura: qué identidad ya existe, dónde está documentada, dónde se repite y dónde no existe todavía. Es el punto de partida de todo lo demás.
2. **`BRAND_FOUNDATIONS.md`** (v1.1, Draft) — La única fuente de verdad sobre quién es ComparaFarma: historia, propósito, misión, visión, promesa, principios, personalidad, voz y tono.
3. **`VISUAL_IDENTITY.md`** (v1.0, Draft) — Arquitectura de principios y atributos de percepción visual, sin decisiones gráficas.
4. **`DESIGN_CONCEPT.md`** (v1.0, Draft) — El concepto visual único que debe representar la marca (Orientación), con conceptos secundarios, metáforas analizadas, territorio, arquetipo y criterios de evaluación — sin decidir tampoco ninguna forma gráfica.

Cada documento depende del anterior y no debe leerse de forma aislada: `BRAND_FOUNDATIONS.md` cita a `BRAND_AUDIT.md` como su diagnóstico de origen; `VISUAL_IDENTITY.md` depende de `BRAND_FOUNDATIONS.md`; `DESIGN_CONCEPT.md` depende de `VISUAL_IDENTITY.md`.

### 4.2 Relación con docs/design

`docs/brand/` y `docs/design/` cumplen roles distintos y no intercambiables:

- **Brand define. Design materializa.** `docs/brand/` es la única fuente de verdad sobre quién es ComparaFarma, cómo debe percibirse y qué concepto visual la representa. `docs/design/` no redefine nada de eso: documenta el proceso — exploraciones, decisiones, iteraciones y activos gráficos — mediante el cual esa arquitectura conceptual se convierte en una identidad visual concreta.
- **Brand gobierna. Design implementa.** Toda exploración o decisión registrada en `docs/design/` debe ser coherente con lo ya consolidado en `docs/brand/`. Cuando exista una discrepancia, prevalece `docs/brand/` — mismo principio de gobierno ya declarado en `docs/enterprise/README.md`: *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*

En síntesis: si se necesita saber **quién es** ComparaFarma, **cómo debe percibirse**, o **qué concepto** representa su identidad visual, la respuesta está en `docs/brand/`. Si se necesita saber **qué se ha explorado**, **qué se ha decidido** o **qué activos gráficos existen** en el camino hacia una identidad visual concreta, la respuesta está en `docs/design/` (ver `docs/design/README.md`).

```
docs/brand/                              docs/design/
(BRAND_AUDIT, BRAND_FOUNDATIONS,          (DESIGN_EXPLORATION, DESIGN_DECISION_LOG,
 VISUAL_IDENTITY, DESIGN_CONCEPT)          assets/)
        │                                         │
        │   define / gobierna                     │   materializa / implementa
        └───────────────────►  ────────────────── ┘
                (la dependencia es en una sola dirección: docs/design/
                 depende de docs/brand/; docs/brand/ no depende de docs/design/)
```

---

## 5. Relaciones

Ver §4.2. La relación completa y detallada, incluyendo principios de gobierno del dominio de proceso, vive en `docs/design/README.md` — este documento no la duplica en extenso, solo la resume desde el lado de `docs/brand/`.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Orden de lectura de `docs/brand/` | Los cuatro documentos del dominio, en su propia cadena de dependencias declarada | ✔ (§4.1) | Primera vez que se declara explícitamente en un índice; antes solo existía de forma implícita en las secciones "Relaciones" de cada documento |
| Relación Brand/Design | `docs/design/README.md` | ✔ — resumida (§4.2) | El detalle completo de principios de gobierno vive en `docs/design/README.md` |

---

## 7. Gobierno

`docs/design/brand/README.md` **no reemplaza** ningún documento que referencia: no redefine identidad, percepción ni concepto visual. Es un índice y un mapa de relaciones, no una fuente de contenido de marca.

Este documento no gobierna a `docs/design/`; simplemente documenta, desde el lado de `docs/brand/`, la misma relación de gobierno que `docs/design/README.md` declara en detalle. Si en el futuro cambia el conjunto de documentos de `docs/brand/` (por ejemplo, al crearse un futuro `BRAND_GUIDELINES`), este índice debe actualizarse.

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_AUDIT.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/DESIGN_CONCEPT.md`
- `docs/design/README.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial de este índice (no existía previamente ningún README en `docs/brand/`, confirmado por inspección directa). Documenta el orden de lectura de los cuatro documentos de la Arquitectura de Marca y agrega la sección "Relación con docs/design", requerida al crear ese nuevo dominio documental. | `docs/design/brand/BRAND_AUDIT.md` v1.0; `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design/brand/VISUAL_IDENTITY.md` v1.0; `docs/design/brand/DESIGN_CONCEPT.md` v1.0; `docs/design/README.md` v1.0 |

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
| 2026-08-05 | Creación del dominio documental de proceso de diseño y de este índice de `docs/brand/` | Enterprise Documentation Architect / Design Governance Architect | `docs/design/README.md` v1.0, `docs/archive/design/explorations/DESIGN_EXPLORATION.md` v1.0, `docs/design/decisions/DESIGN_DECISION_LOG.md` v1.0, `docs/design/assets/README.md` v1.0, `docs/design/brand/README.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador.
