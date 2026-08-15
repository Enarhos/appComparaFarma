# DESIGN_SYSTEM_DECISION_LOG — Registro Oficial de Decisiones de Arquitectura del Design System de ComparaFarma

Este documento es el registro oficial de decisiones de arquitectura del Design System ya tomadas — no de exploraciones en curso, no de decisiones de identidad de marca (ver `docs/design/decisions/DESIGN_DECISION_LOG.md` para eso) y no de decisiones de producto o backlog (ver `docs/product/decisions/DECISION_LOG.md`). Una decisión solo pertenece a este documento cuando ha sido efectivamente tomada, con justificación documental y fuente citada, y pertenece exclusivamente al dominio `docs/design-system/`.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DSY-DEC-001 |
| **Nombre** | DESIGN_SYSTEM_DECISION_LOG.md |
| **Dominio** | Design System (`docs/design-system/`) |
| **Estado** | Activo (registro vivo; se agregan filas, no se editan las existentes) |
| **Versión** | 1.1 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | De decisión operativa — mismo nivel ya reconocido en `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8 y aplicado, por precedente directo, a `docs/product/decisions/DECISION_LOG.md` y a `docs/design/decisions/DESIGN_DECISION_LOG.md` |
| **Clasificación** | Registro Oficial de Decisiones |
| **Fuente Oficial** | Este mismo documento, en tanto único registro autorizado de decisiones de arquitectura del Design System ya tomadas |
| **Documentos de los que depende** | `docs/design/system/README.md`, `docs/design/system/DESIGN_SYSTEM.md`, `docs/design/system/SPACING_SYSTEM.md`, `docs/design/system/GRID_SYSTEM.md`, `docs/design/system/ELEVATION_SYSTEM.md`, `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `COMPONENT_LIBRARY.md`, `PATTERNS.md`, `SCREEN_TEMPLATES.md` |
| **Documentos que gobierna** | Ninguno directamente, pero toda decisión futura de arquitectura de producto (una Foundation nueva, un Design Token, un Componente, un Patrón, una Plantilla) debe registrarse aquí antes de considerarse oficial, según el mecanismo de evolución ya declarado en cada uno de los documentos de Foundation, de Tokens, de Componentes, de Patrones y de Screen Templates |
| **Pregunta que responde** | ¿Qué se ha decidido oficialmente sobre la arquitectura del Design System de ComparaFarma, cuándo, y con qué justificación? |

---

## 2. Propósito

Este documento evita que una decisión de arquitectura de producto se tome, se comunique verbalmente o quede implícita en un archivo, y luego se pierda o se contradiga sin que nadie recuerde por qué se tomó originalmente — misma función ya cumplida, en su propio dominio, por `docs/design/decisions/DESIGN_DECISION_LOG.md` para decisiones de identidad de marca. Cada fila de este registro es una decisión trazable: qué se decidió, cuándo, con qué estado, por qué, desde qué fuente, y con qué impacto sobre el trabajo posterior.

Este documento no decide nada por sí mismo — solo registra decisiones que ya fueron tomadas por quien tiene la autoridad para tomarlas, con su justificación documental correspondiente.

---

## 3. Alcance

**Este documento define:**

- La tabla oficial de decisiones de arquitectura del Design System, con sus columnas mínimas obligatorias (§4.1), idénticas en estructura a las de `docs/design/decisions/DESIGN_DECISION_LOG.md`.
- El registro inicial del estado del dominio `docs/design-system/` (§4.2, DSG-001), y la consolidación posterior de las decisiones de arquitectura ya adoptadas mediante los documentos oficiales del dominio (§4.2, DSG-002 a DSG-007).

**Este documento NO define:**

- Decisiones de identidad de marca (concepto, isotipo, tipografía de marca, color, iconografía como sistemas de identidad). Corresponde exclusivamente a `docs/design/decisions/DESIGN_DECISION_LOG.md`.
- Decisiones de producto, backlog o roadmap. Corresponde exclusivamente a `docs/product/decisions/DECISION_LOG.md`.
- Ninguna decisión de Design Tokens, Componentes o Patrones concreta. **No existe, a la fecha de esta versión, ninguna decisión de ese tipo que registrar** — este documento no inventa un historial de decisiones que nunca ocurrieron; registra únicamente el estado inicial del dominio y deja preparada la estructura para las decisiones que se tomen a partir de ahora.
- El contenido arquitectónico de `DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md` o `ELEVATION_SYSTEM.md`. Esos cuatro documentos fueron redactados directamente como especificaciones de Foundation, sin pasar por este mecanismo de registro (no existía todavía) — este documento no reescribe retroactivamente esa historia como si hubiera ocurrido de otra forma.

---

## 4. Contenido principal

### 4.1 Estructura de la tabla de decisiones

Toda decisión de arquitectura del Design System registrada en este documento debe incluir, como mínimo, las siguientes columnas — misma estructura ya establecida en `docs/design/decisions/DESIGN_DECISION_LOG.md` §4.1:

| Columna | Descripción |
|---|---|
| **ID** | Identificador secuencial de la decisión (`DSG-XXX`). |
| **Fecha** | Fecha en que se tomó la decisión. |
| **Estado** | Aprobado / Rechazado / En revisión / Reemplazado (con referencia al ID que lo reemplaza). |
| **Decisión** | Qué se decidió, de forma breve y verificable. |
| **Justificación** | Por qué se tomó esa decisión, con cita del razonamiento documental que la respalda. |
| **Documento fuente** | Qué documento (y sección, cuando aplique) origina o respalda la decisión. |
| **Impacto** | Qué queda obligado o condicionado por esta decisión para el trabajo de arquitectura posterior. |

### 4.2 Registro de decisiones

| ID | Fecha | Estado | Decisión | Justificación | Documento fuente | Impacto |
|---|---|---|---|---|---|---|
| DSG-001 | 2026-08-05 | Aprobado | **Apertura formal del registro de decisiones de arquitectura del dominio `docs/design-system/`.** | Los cuatro documentos de Foundation ya existentes (`DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`) señalaron, cada uno de forma independiente y repetida, la ausencia de un mecanismo de registro de decisiones para este dominio — una observación heredada de `docs/design/decisions/DESIGN_DECISION_LOG.md` sin poder resolverla por no estar dentro del alcance de ninguno de esos cuatro documentos individuales. El Sprint DG.001 — Design System Governance se abrió específicamente para cerrar esa deuda de gobierno antes de iniciar la capa de implementación (Design Tokens, Componentes, Patrones). | `docs/design/system/DESIGN_SYSTEM.md` §4.8; `SPACING_SYSTEM.md` §4.7; `GRID_SYSTEM.md` §4.9; `ELEVATION_SYSTEM.md` §4.9 | Ningún documento del dominio `docs/design-system/` debe seguir señalando la ausencia de este registro como observación pendiente (ver revisión de referencias cruzadas del Sprint DG.001). Toda decisión de arquitectura de producto posterior —una Foundation nueva, un Design Token, un Componente, un Patrón— debe registrarse en este documento antes de considerarse oficial. |
| DSG-002 | 2026-08-05 | Aprobado | **Adopción oficial de la arquitectura de cuatro capas para Design Tokens: Foundation Tokens → Semantic Tokens → Component Tokens → Pattern Tokens.** | Esta arquitectura fue definida en `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0 (Sprint DS.3 — Design Token Architecture) como el desarrollo del rol arquitectónico de los Design Tokens ya anticipado, sin desarrollarse, en `docs/design/system/DESIGN_SYSTEM.md` §4.4. Ese mismo documento señaló, en su §4.6 y §7, que la adopción de esta arquitectura de capas constituía una decisión de arquitectura del dominio todavía sin fila propia en este registro, y dejó explícitamente pendiente su incorporación posterior. El Sprint DG.002 — Consolidación del Design System Decision Log se abrió específicamente para cerrar esa y las demás deudas de registro señaladas por los documentos del dominio. | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2, §4.6, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente de registro. Todo Foundation, Semantic, Component o Pattern Token concreto que se declare en el futuro debe trazarse a esta arquitectura de cuatro capas ya oficial. |
| DSG-003 | 2026-08-05 | Aprobado | **Aprobación oficial del catálogo de seis familias de Foundation Tokens: Spacing, Grid, Elevation, Typography, Color, Iconography.** | Este catálogo fue definido en `docs/design/system/DESIGN_TOKENS.md` v1.0 (Sprint DS.4 — Design Tokens Specification) §4.3, en correspondencia uno a uno con las seis Foundations ya gobernadas del dominio. Ese mismo documento señaló, en su §4.9 y §7, que la declaración de estas seis familias constituía una decisión de arquitectura pendiente de registro. | `docs/design/system/DESIGN_TOKENS.md` §4.3, §4.9, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente. Toda familia de Foundation Token nueva debe justificarse formalmente frente a este catálogo ya oficial, mismo patrón "trazar o justificar" ya declarado en `DESIGN_TOKENS.md` §4.8. |
| DSG-004 | 2026-08-05 | Aprobado | **Aprobación oficial del catálogo de diez familias de Semantic Tokens (Surface, Content, Border, Feedback, Interactive, Navigation, Data, Comparison, Alert, Status) y de la filosofía oficial de convención de nombres.** | Este catálogo y esta filosofía fueron definidos en `docs/design/system/DESIGN_TOKENS.md` v1.0 §4.4 y §4.7 respectivamente, cada familia fundamentada en documentación ya existente del dominio y de `docs/brand/`. Ese mismo documento señaló, en su §4.9 y §7, que ambas decisiones estaban pendientes de registro. | `docs/design/system/DESIGN_TOKENS.md` §4.4, §4.7, §4.9, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente. Todo Semantic Token individual debe trazarse a una de estas diez familias, y todo nombre de Token debe seguir la filosofía ya oficial de §4.7 de ese documento. |
| DSG-005 | 2026-08-05 | Aprobado | **Adopción oficial de la arquitectura de tres niveles de la Component Library (Primitive → Composite → Domain Components) y de sus ocho familias oficiales de clasificación (Entrada, Navegación, Información, Comparación, Acción, Feedback, Contenedores, Identidad).** | Esta arquitectura y esta clasificación fueron definidas en `docs/design/system/COMPONENT_LIBRARY.md` v1.0 (Sprint DS.5 — Component Library Architecture) §4.2 y §4.4. Ese mismo documento señaló, en su §4.9 y §7, que ambas decisiones estaban pendientes de registro. | `docs/design/system/COMPONENT_LIBRARY.md` §4.2, §4.4, §4.9, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente. Todo componente futuro debe clasificarse en uno de estos tres niveles y en una de estas ocho familias, o justificar formalmente la creación de un nivel o familia nueva. |
| DSG-006 | 2026-08-05 | Aprobado | **Adopción oficial de la arquitectura de tres niveles de la capa de Patrones (Interaction → Domain → Flow Patterns) y de sus seis familias oficiales de clasificación (Descubrimiento, Comparación, Decisión, Confirmación, Seguimiento, Configuración).** | Esta arquitectura y esta clasificación fueron definidas en `docs/design/system/PATTERNS.md` v1.0 (Sprint DS.6 — Pattern Architecture) §4.2 y §4.4. Ese mismo documento señaló, en su §4.9 y §7, que ambas decisiones estaban pendientes de registro. | `docs/design/system/PATTERNS.md` §4.2, §4.4, §4.9, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente. Todo Patrón futuro debe clasificarse en uno de estos tres niveles y en una de estas seis familias, o justificar formalmente la creación de un nivel o familia nueva. |
| DSG-007 | 2026-08-05 | Aprobado | **Adopción oficial de la arquitectura de tres niveles de la capa de Screen Templates (Single Pattern → Multi Pattern → Adaptive Template) y de sus cinco familias oficiales de clasificación (Exploración, Comparación, Detalle, Configuración, Seguimiento).** | Esta arquitectura y esta clasificación fueron definidas en `docs/design/system/SCREEN_TEMPLATES.md` v1.0 (Sprint UX.1 — Screen Templates Architecture) §4.2 y §4.4. Ese mismo documento señaló, en su §4.9 y §7, que ambas decisiones estaban pendientes de registro. | `docs/design/system/SCREEN_TEMPLATES.md` §4.2, §4.4, §4.9, §7 | Ningún documento del dominio debe seguir señalando esta decisión como pendiente. Con este registro, la arquitectura completa de capas reutilizables del Design System de ComparaFarma (Foundations → Tokens → Componentes → Patrones → Screen Templates) queda íntegramente trazada en este registro. |

**Nota de estado:** DSG-001 se registró deliberadamente sin reconstruir, de forma retroactiva, una historia de decisiones para la creación de `DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md` ni `ELEVATION_SYSTEM.md`. Esos cuatro documentos ya existían, con su propia justificación documental íntegra en su propio texto, redactados antes de que este mecanismo de registro existiera; inventar una fila retroactiva para cada uno, con una narrativa de decisión que nunca pasó por este mecanismo en el momento en que ocurrió, habría sido registrar una historia que no es real. Esa distinción sigue vigente sin cambios: este documento no registra, ni en esta versión ni en ninguna futura, una fila retroactiva para esos cuatro documentos.

DSG-002 a DSG-007, incorporados en el Sprint DG.002 — Consolidación del Design System Decision Log, son de una naturaleza distinta a la que motivó esa disciplina original: no son una reconstrucción retroactiva de una decisión silenciosa, sino el cumplimiento de una acción de gobierno que cada documento fuente ya anticipó y declaró explícitamente como pendiente en el momento de su propia creación (`DESIGN_TOKEN_ARCHITECTURE.md` §4.6/§7, `DESIGN_TOKENS.md` §4.9/§7, `COMPONENT_LIBRARY.md` §4.9/§7, `PATTERNS.md` §4.9/§7, `SCREEN_TEMPLATES.md` §4.9/§7). Cada uno de esos cinco documentos declaró, desde su versión 1.0, que su propia arquitectura interna constituía una decisión que "requiere aprobación y registro posterior" — este registro no inventa esa decisión: la formaliza en el momento explícitamente previsto para hacerlo, sin alterar la fecha de creación de ninguno de los documentos fuente ni el contenido arquitectónico que ya describían.

---

## 5. Relaciones

Este documento depende de `docs/design/system/README.md` (dominio) y de los cuatro documentos de Foundation (`DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`), cuya observación repetida sobre la ausencia de este registro es la fuente directa de DSG-001. Depende también de `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md`, cada uno de los cuales ya declaró, en su propia versión 1.0, que una decisión de arquitectura propia requería aprobación y registro posterior — esa declaración explícita es la fuente directa de DSG-002 a DSG-007. Se relaciona, sin sustituirlo ni fusionarse con él, con `docs/design/decisions/DESIGN_DECISION_LOG.md` (mismo mecanismo de registro, aplicado a un dominio distinto: identidad de marca) y con `docs/product/decisions/DECISION_LOG.md` (mismo mecanismo, aplicado a decisiones de producto). Ninguna decisión puede registrarse en más de uno de estos tres registros — cada dominio tiene el suyo.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Ausencia de registro de decisiones de arquitectura de producto | `docs/design/system/DESIGN_SYSTEM.md` §4.8; `SPACING_SYSTEM.md` §4.7; `GRID_SYSTEM.md` §4.9; `ELEVATION_SYSTEM.md` §4.9 | ✔ — DSG-001 cierra este vacío | Observación señalada de forma independiente por los cuatro documentos; consolidada aquí en una sola apertura de registro |
| Estructura de tabla de decisiones | `docs/design/decisions/DESIGN_DECISION_LOG.md` §4.1 | ✔ — misma estructura de columnas, aplicada a un dominio distinto | No se fusiona con el registro de marca; son dos tablas independientes |
| Decisiones de identidad de marca | `docs/design/decisions/DESIGN_DECISION_LOG.md` | No consolidado — dominio distinto | Este documento no registra decisiones de marca |
| Decisiones de producto y backlog | `docs/product/decisions/DECISION_LOG.md` | No consolidado — dominio distinto | Este documento no registra decisiones de producto |
| Arquitectura de cuatro capas de Design Tokens | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` §4.2, §4.6 | ✔ — DSG-002 cierra este vacío | Sprint DG.002 — Consolidación del Design System Decision Log |
| Catálogo de seis familias de Foundation Tokens | `docs/design/system/DESIGN_TOKENS.md` §4.3, §4.9 | ✔ — DSG-003 cierra este vacío | Sprint DG.002 |
| Catálogo de diez familias de Semantic Tokens y filosofía de naming | `docs/design/system/DESIGN_TOKENS.md` §4.4, §4.7, §4.9 | ✔ — DSG-004 cierra este vacío | Sprint DG.002 |
| Arquitectura de tres niveles y ocho familias de la Component Library | `docs/design/system/COMPONENT_LIBRARY.md` §4.2, §4.4, §4.9 | ✔ — DSG-005 cierra este vacío | Sprint DG.002 |
| Arquitectura de tres niveles y seis familias de la capa de Patrones | `docs/design/system/PATTERNS.md` §4.2, §4.4, §4.9 | ✔ — DSG-006 cierra este vacío | Sprint DG.002 |
| Arquitectura de tres niveles y cinco familias de la capa de Screen Templates | `docs/design/system/SCREEN_TEMPLATES.md` §4.2, §4.4, §4.9 | ✔ — DSG-007 cierra este vacío | Sprint DG.002; cierra la trazabilidad completa de la arquitectura de capas reutilizables del dominio |
| Decisiones de Design Tokens, Componentes o Patrones individuales y concretos | — (no existen todavía) | No consolidado — declarado explícitamente (§3) | Distinto de DSG-002 a DSG-007, que registran arquitectura y catálogo, no elementos individuales; pendiente de que se tomen esas decisiones concretas |

---

## 7. Gobierno

`docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` **no reemplaza**:

- `docs/design/decisions/DESIGN_DECISION_LOG.md` — sigue siendo el único registro de decisiones de identidad de marca.
- `docs/product/decisions/DECISION_LOG.md` — sigue siendo el único registro de decisiones de producto.
- El contenido de `DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md`, `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md` — este registro no reinterpreta ni reescribe la arquitectura de ninguno de ellos; solo registra las decisiones ya tomadas y documentadas en su propio texto.

Toda fila de este registro que entre en conflicto con una futura revisión de un documento de Foundation debe marcarse como "Reemplazado", nunca editarse ni eliminarse — el historial de decisiones debe permanecer íntegro, mismo principio ya aplicado en `docs/design/decisions/DESIGN_DECISION_LOG.md` §7. Ninguna fila puede aprobarse sin una columna "Documento fuente" verificable — mismo estándar ya exigido en ese documento.

Este documento es gobernado por `docs/design/system/README.md` (§4.5, principio de gobierno del dominio: "ninguna decisión de arquitectura de producto es oficial sin registrarse aquí").

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

- `docs/design/system/README.md`
- `docs/design/system/DESIGN_SYSTEM.md`
- `docs/design/system/SPACING_SYSTEM.md`
- `docs/design/system/GRID_SYSTEM.md`
- `docs/design/system/ELEVATION_SYSTEM.md`
- `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md`
- `docs/design/system/DESIGN_TOKENS.md`
- `docs/design/system/COMPONENT_LIBRARY.md`
- `docs/design/system/PATTERNS.md`
- `docs/design/system/SCREEN_TEMPLATES.md`
- `docs/design/decisions/DESIGN_DECISION_LOG.md`
- `docs/product/decisions/DECISION_LOG.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial, como parte del Sprint DG.001 — Design System Governance. Define la estructura de la tabla de decisiones y registra DSG-001 (apertura formal del registro), cerrando la observación repetida en los cuatro documentos de Foundation sobre la ausencia de este mecanismo. No reconstruye retroactivamente decisiones históricas para `DESIGN_SYSTEM.md`, `SPACING_SYSTEM.md`, `GRID_SYSTEM.md` ni `ELEVATION_SYSTEM.md`. | `docs/design/system/DESIGN_SYSTEM.md` v1.0; `SPACING_SYSTEM.md` v1.0; `GRID_SYSTEM.md` v1.0; `ELEVATION_SYSTEM.md` v1.0; `docs/design/decisions/DESIGN_DECISION_LOG.md` v1.0 |
| 1.1 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Sprint DG.002 — Consolidación del Design System Decision Log. Registra DSG-002 a DSG-007: seis decisiones de arquitectura ya adoptadas y documentadas en `DESIGN_TOKEN_ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `COMPONENT_LIBRARY.md`, `PATTERNS.md` y `SCREEN_TEMPLATES.md` v1.0, cada una de las cuales ya había señalado explícitamente que requería aprobación y registro posterior en este documento. No crea arquitectura nueva, no reinterpreta ningún documento fuente, no modifica ninguna decisión ya registrada y no reconstruye retroactivamente ninguna historia distinta a la ya declarada por esos cinco documentos. Actualiza también la Nota de estado (§4.2), la Matriz de Trazabilidad (§6) y la lista de Documentos relacionados (§8) para reflejar las nuevas dependencias. | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_TOKENS.md` v1.0; `COMPONENT_LIBRARY.md` v1.0; `PATTERNS.md` v1.0; `SCREEN_TEMPLATES.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Creación del dominio `docs/design-system/` y definición de la arquitectura oficial del Design System | Design Systems Architect / Product Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_SYSTEM.md` v1.0 |
| 2026-08-05 | Definición de las especificaciones de espaciado, grid y elevación | Design Systems Architect / Spatial Systems Director, Information Architecture Director e Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/SPACING_SYSTEM.md`, `GRID_SYSTEM.md`, `ELEVATION_SYSTEM.md` v1.0 |
| 2026-08-05 | Apertura del Sprint DG.001 — Design System Governance, para cerrar las deudas de gobierno del dominio antes de la capa de implementación | Enterprise Documentation Architect / Design Governance Architect | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.0 |
| 2026-08-05 | Sprint DS.3 a UX.1 — definición sucesiva de la arquitectura de Design Tokens, su catálogo de familias, la Component Library, la capa de Patrones y la capa de Screen Templates, cada una señalando su propia decisión de arquitectura como pendiente de registro posterior | Design Systems Architect / Design Token Specialist / UX Architect / Product Design Director / Interaction Design Director / Enterprise Documentation Architect | `docs/design/system/DESIGN_TOKEN_ARCHITECTURE.md` v1.0; `DESIGN_TOKENS.md` v1.0; `COMPONENT_LIBRARY.md` v1.0; `PATTERNS.md` v1.0; `SCREEN_TEMPLATES.md` v1.0 |
| 2026-08-05 | Sprint DG.002 — Consolidación del Design System Decision Log: registro formal de DSG-002 a DSG-007, cerrando todas las referencias pendientes de registro señaladas por los cinco documentos anteriores | Enterprise Documentation Architect / Design Governance Architect / ADR Specialist | `docs/design/system/DESIGN_SYSTEM_DECISION_LOG.md` v1.1 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. El registro de DSG-002 a DSG-007 no está, por sí mismo, pendiente — es la acción que resuelve esa pendiente en los cinco documentos fuente (ver Sprint DG.002, referencias cruzadas).
