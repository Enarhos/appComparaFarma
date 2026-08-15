# docs/design/assets/ — Activos Gráficos del Proceso de Diseño

Este documento explica qué tipo de activos gráficos se almacenan en esta carpeta y bajo qué regla de gobierno se convierten, o no, en decisiones oficiales.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DES-AST-001 |
| **Nombre** | README.md (subdominio `docs/design/assets/`) |
| **Dominio** | Proceso de Diseño (`docs/design/assets/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | Chárter de Dominio — mismo nivel introducido en `docs/design/README.md` §1, aplicado aquí al subdominio específico de almacenamiento de activos |
| **Clasificación** | Documento de Gobierno Documental |
| **Fuente Oficial** | Este mismo documento |
| **Documentos de los que depende** | `docs/design/README.md`, `docs/design/DESIGN_DECISION_LOG.md` |
| **Documentos que gobierna** | El uso, nomenclatura y estatus de todo archivo almacenado dentro de `docs/design/assets/` |
| **Pregunta que responde** | ¿Qué tipo de activos gráficos viven aquí, y cuándo deja uno de ser "solo un archivo" para convertirse en una decisión oficial? |

---

## 2. Propósito

Durante el proceso de diseño de ComparaFarma se generarán numerosos archivos gráficos: moodboards, exploraciones, logos en desarrollo, iconografía, ilustraciones, capturas de pantalla, versiones descartadas, renders. Sin una regla clara, esos archivos tienden a acumularse sin contexto, o —peor— a tratarse informalmente como si ya fueran una decisión de marca, simplemente por existir.

Este documento fija esa regla de una vez: **ningún activo almacenado aquí es, por sí solo, una decisión oficial.**

---

## 3. Alcance

**Este documento define:**

- Qué tipos de activos gráficos pertenecen a esta carpeta (§4.1).
- La regla de gobierno que distingue un activo exploratorio de una decisión oficial (§4.2).
- La convención de nomenclatura mínima esperada para los activos (§4.3).

**Este documento NO define:**

- El contenido conceptual de ningún activo específico. Cada activo se documenta en la exploración o decisión que lo originó (`docs/design/DESIGN_EXPLORATION.md` o `docs/design/DESIGN_DECISION_LOG.md`), no en este README.
- Ninguna decisión de diseño. Corresponde exclusivamente a `docs/design/DESIGN_DECISION_LOG.md`.
- Herramientas, formatos de archivo o software de diseño a utilizar.

---

## 4. Contenido principal

### 4.1 Tipos de activos que se almacenan aquí

- **Moodboards** — collages de referencia visual, tono y textura, como el generado en la primera exploración creativa (ver `docs/design/DESIGN_EXPLORATION.md`, EXP-001).
- **Exploraciones** — cualquier material visual producido durante una sesión de exploración conceptual, aunque no haya conducido a ninguna dirección seleccionada.
- **Logos** — propuestas de logotipo en cualquier etapa de desarrollo, aprobadas o no.
- **Iconografía** — exploraciones o desarrollos de sistemas de íconos.
- **Screenshots** — capturas de interfaz usadas como referencia de proceso (no como especificación de UI, que corresponde a un futuro `DESIGN_SYSTEM`).
- **Ilustraciones** — piezas ilustrativas en cualquier etapa.
- **Versiones descartadas** — cualquier activo que fue explorado y luego descartado; se conservan, no se eliminan, para que la razón del descarte quede trazable.
- **Renders** — visualizaciones de piezas gráficas en contextos de aplicación (app, sitio web, Google Play, etc.), en etapa de exploración o desarrollo.

### 4.2 Regla de gobierno: un activo no es una decisión

**Un activo gráfico almacenado en esta carpeta no constituye una decisión oficial de diseño hasta que exista un registro correspondiente en `docs/design/DESIGN_DECISION_LOG.md`.**

Esto significa, en la práctica:

- Un moodboard o board de exploración (como `concept-board-v1.png`, ver §4.4) es material de trabajo, no una propuesta gráfica oficial, aunque contenga referencias visuales elaboradas o incluso paletas de color exploratorias.
- Un logo guardado en esta carpeta, mientras no tenga una fila correspondiente en `docs/design/DESIGN_DECISION_LOG.md` con Estado "Aprobado", debe tratarse como una propuesta en evaluación, no como el logo de ComparaFarma.
- Ningún archivo de esta carpeta debe usarse en producción, comunicación externa o material institucional sin que exista, primero, su decisión correspondiente registrada.

### 4.3 Convención de nomenclatura

Se recomienda, para toda exploración, el patrón `[tipo]-[tema]-v[número].ext` (por ejemplo, `concept-board-v1.png`), incrementando el número de versión en cada iteración relevante, sin sobrescribir versiones anteriores — la trazabilidad de versiones descartadas es tan importante como la del resultado final.

### 4.4 Inventario inicial

| Archivo | Tipo | Origen | Estatus |
|---|---|---|---|
| `concept-board-v1.png` | Moodboard / exploración | `docs/design/DESIGN_EXPLORATION.md`, EXP-001 | Material de exploración. No es una propuesta gráfica oficial ni una decisión de identidad visual (ver §4.2). |

---

## 5. Relaciones

Este documento depende de `docs/design/README.md` (dominio) y de `docs/design/DESIGN_DECISION_LOG.md` (que es la única fuente capaz de convertir un activo de esta carpeta en una decisión oficial). No depende de `docs/design/DESIGN_EXPLORATION.md` de forma estricta, aunque en la práctica la mayoría de los activos aquí almacenados se originan en exploraciones documentadas allí.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Regla "un activo no es una decisión" | `docs/design/README.md` §4.3, principio 2 | ✔ — desarrollada en detalle (§4.2) | Regla central de este documento |
| Inventario de activos existentes | Este documento | ✔ (§4.4) | Un solo activo a la fecha de esta versión |
| `concept-board-v1.png` | `docs/design/DESIGN_EXPLORATION.md`, EXP-001 | ✔ — catalogado, no redecidido | Material exploratorio; no oficial |

---

## 7. Gobierno

`docs/design/assets/README.md` **no reemplaza** `docs/design/DESIGN_DECISION_LOG.md`: ningún activo listado o descrito aquí adquiere estatus de decisión oficial por el solo hecho de estar inventariado en este documento. Este documento es gobernado por `docs/design/README.md` (§4.3, principio 2).

---

## 8. Documentos relacionados

- `docs/design/README.md` — dominio en el que vive este documento.
- `docs/design/DESIGN_EXPLORATION.md` — origen de la mayoría de los activos aquí almacenados.
- `docs/design/DESIGN_DECISION_LOG.md` — único documento capaz de convertir un activo en decisión oficial.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial. Define los tipos de activos que se almacenan en esta carpeta, la regla de gobierno que distingue un activo exploratorio de una decisión oficial, la convención de nomenclatura, y el inventario inicial (`concept-board-v1.png`). | `docs/design/README.md` v1.0; `docs/design/DESIGN_EXPLORATION.md` v1.0; `docs/design/DESIGN_DECISION_LOG.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio documental de proceso de diseño | Enterprise Documentation Architect / Design Governance Architect | `docs/design/README.md` v1.0, `docs/design/DESIGN_EXPLORATION.md` v1.0, `docs/design/DESIGN_DECISION_LOG.md` v1.0, `docs/design/assets/README.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con una aprobación formal registrada del CEO/fundador.
