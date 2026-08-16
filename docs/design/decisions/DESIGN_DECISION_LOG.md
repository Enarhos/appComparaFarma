# DESIGN_DECISION_LOG — Registro Oficial de Decisiones de Diseño de ComparaFarma

Este documento es el registro oficial de decisiones de diseño ya tomadas — no de exploraciones en curso (ver `docs/archive/design/explorations/DESIGN_EXPLORATION.md` para eso) ni de activos gráficos sin resolución (ver `docs/design/assets/README.md`). Una decisión solo pertenece a este documento cuando ha sido efectivamente aprobada, con justificación documental y fuente citada.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DES-DEC-001 |
| **Nombre** | DESIGN_DECISION_LOG.md |
| **Dominio** | Proceso de Diseño (`docs/design/`) |
| **Estado** | Activo (registro vivo; se agregan filas, no se editan las existentes) |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | De decisión operativa — mismo nivel ya reconocido en `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8 y aplicado, por precedente directo, a `docs/product/decisions/DECISION_LOG.md` |
| **Clasificación** | Registro Oficial de Decisiones |
| **Fuente Oficial** | Este mismo documento, en tanto único registro autorizado de decisiones de diseño ya tomadas |
| **Documentos de los que depende** | `docs/design/README.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/archive/design/explorations/DESIGN_EXPLORATION.md` |
| **Documentos que gobierna** | Ninguno directamente, pero toda decisión aprobada aquí se convierte en referencia obligatoria para los futuros `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY` y `DESIGN_SYSTEM` |
| **Pregunta que responde** | ¿Qué se ha decidido oficialmente sobre el diseño de ComparaFarma, cuándo, y con qué justificación? |

---

## 2. Propósito

Este documento evita que una decisión de diseño se tome, se comunique verbalmente o quede implícita en un archivo, y luego se pierda o se contradiga sin que nadie recuerde por qué se tomó originalmente. Cada fila de este registro es una decisión trazable: qué se decidió, cuándo, con qué estado, por qué, desde qué fuente, y con qué impacto sobre el trabajo posterior.

Este documento no decide nada por sí mismo — solo registra decisiones que ya fueron tomadas por quien tiene la autoridad para tomarlas, con su justificación documental correspondiente.

---

## 3. Alcance

**Este documento define:**

- La tabla oficial de decisiones de diseño, con sus columnas mínimas obligatorias (§4.1).
- El registro inicial de la primera decisión (§4.2, DD-001).

**Este documento NO define:**

- Exploraciones abiertas o en curso. Corresponde a `docs/archive/design/explorations/DESIGN_EXPLORATION.md`.
- Reglas de almacenamiento de activos gráficos. Corresponde a `docs/design/assets/README.md`.
- El concepto central de diseño en sí mismo (solo registra la decisión de adoptarlo). La justificación completa del concepto vive en `docs/design/brand/DESIGN_CONCEPT.md`.
- Ninguna decisión sobre logo, color o tipografía todavía: no existe, a la fecha de esta versión, ninguna decisión de ese tipo que registrar.

---

## 4. Contenido principal

### 4.1 Estructura de la tabla de decisiones

Toda decisión de diseño registrada en este documento debe incluir, como mínimo, las siguientes columnas:

| Columna | Descripción |
|---|---|
| **ID** | Identificador secuencial de la decisión (`DD-XXX`). |
| **Fecha** | Fecha en que se aprobó la decisión. |
| **Estado** | Aprobado / Rechazado / En revisión / Reemplazado (con referencia al ID que lo reemplaza). |
| **Decisión** | Qué se decidió, de forma breve y verificable. |
| **Justificación** | Por qué se tomó esa decisión, con cita del razonamiento documental que la respalda. |
| **Documento fuente** | Qué documento (y sección, cuando aplique) origina o respalda la decisión. |
| **Impacto** | Qué queda obligado o condicionado por esta decisión para el trabajo de diseño posterior. |

### 4.2 Registro de decisiones

| ID | Fecha | Estado | Decisión | Justificación | Documento fuente | Impacto |
|---|---|---|---|---|---|---|
| DD-001 | 2026-08-05 | Aprobado | **Concepto central de diseño: Orientación.** | Es la única idea respaldada por metáforas de navegación ya presentes de forma literal en los documentos fundacionales del propio proyecto ("nuestro norte", "habremos perdido el rumbo" en la Carta del Fundador; "consultan un mapa antes de viajar" en Visión 2030), y sintetiza en una sola idea espacial el mecanismo central del relato fundacional (incertidumbre → orientación → decisión), sin resolver todavía ninguna forma gráfica concreta. Ver el razonamiento completo, incluida la comparación explícita con "Confianza" como alternativa descartada, en `docs/design/brand/DESIGN_CONCEPT.md` §4.2. | `docs/design/brand/DESIGN_CONCEPT.md` §4.2 | Todo desarrollo posterior del sistema visual (`LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY`, `DESIGN_SYSTEM`) debe poder representar este concepto. Esta decisión aprueba el concepto de diseño, no una dirección visual específica: ninguna de las tres familias exploradas en `docs/archive/design/explorations/DESIGN_EXPLORATION.md` (EXP-001) queda aprobada por esta entrada. |
| DD-002 | 2026-08-06 | Aprobado | **Cierre formal de la Fase de Identidad Visual (Brand Identity).** El comité de ComparaFarma declara aprobados y congelados los entregables construidos entre `VISUAL-001` y `BRAND-003`: `VISUAL_BENCHMARK.md`, `VISUAL_DIRECTION.md`, `COLOR_RESEARCH.md`, `VISUAL_EXPLORATION.md`, `BRAND_EXPERIENCE_V1.md`, `DISTINCTIVE_PRODUCT_IDENTITY.md` y `SIGNATURE_COMPONENTS.md` (más el Brand Kit ya gobernado en `docs/brand/`). A partir de esta decisión, ninguna modificación a color, tipografía, iconografía, logo/isotipo o componentes puede aprobarse sin un RFC específico dirigido al comité — esta decisión no reabre ni reinterpreta ninguna de las decisiones de diseño ya tomadas, solo cierra formalmente el proceso que las produjo. | Sprint `PROJECT-001` (declaración directa del comité) | Todo desarrollo futuro de Fase 2 (Product Experience, `docs/product/experiences/`) debe construirse sobre esta identidad sin volver a decidirla. Actualiza el estado de `docs/design/README.md` y `docs/design/system/README.md` a "Frozen" para las decisiones ya cerradas. |
| DD-003 | 2026-08-08 | Aprobado (con riesgo aceptado) | **Adopción del Candidato 09 como base de producción para los activos gráficos oficiales de Google Play v1.0** (ícono de app/Play Store, ícono de splash, y las 4 capturas de pantalla de Home/Búsqueda/Resultados/Ficha), a partir de `docs/design/assets/brand-experience/09_app_icon.png`, `10_splash.png`, `02_home_mobile.png`, `03_search.png`, `04_results.png` y `05_medication_detail.png`. Esta decisión registra explícitamente que `docs/design/BRAND_IDENTITY_VALIDATION.md` mantiene su recomendación "Aprobar con ajustes" sobre el isotipo (4 condiciones: legibilidad 16-24px, área de seguridad, testeo de percepción "marcador de mapa", reglas de iconografía derivada) — **ninguna de las 4 queda resuelta por esta entrada**. El CTO decide proceder de todas formas, tratando esas condiciones como trabajo en paralelo, no bloqueante para la publicación de v1.0. | Decisión directa del CTO (sesión 2026-08-08, en respuesta a la pregunta explícita sobre qué hacer con los 4 ajustes pendientes de `BRAND_IDENTITY_VALIDATION.md`); ver `docs/design/assets/GRAPHIC_ASSETS_INVENTORY.md` para el mapeo completo activo↔slot de Google Play | Satisface la condición de `docs/design/brand/LOGO_SYSTEM.md` §7 de registrar formalmente la decisión de adopción del Candidato 09 antes de tratar cualquier variante como de aplicación definitiva — pero **no** resuelve los 4 ajustes pendientes, que siguen abiertos y deben resolverse en paralelo. No cubre el gráfico de funciones (feature graphic, 1024×500) ni las capas de adaptive icon (monochrome/background), que no tienen pieza aprobada equivalente y requieren composición nueva. |

**Nota de consistencia:** `docs/design/brand/DESIGN_CONCEPT.md` (§10, Control de Cambios, y §4.2) registra la elección de "Orientación" como una decisión editorial "pendiente de ratificación formal por el CEO/fundador", con la misma reserva ya aplicada a otras decisiones editoriales de `docs/design/brand/BRAND_FOUNDATIONS.md` (por ejemplo, la Misión). El estado "Aprobado" de DD-001 debe entenderse como la aprobación necesaria para **proceder con el proceso de exploración y decisión de diseño** bajo este concepto — no como la ratificación final de identidad de marca por parte del CEO/fundador, que sigue pendiente en su documento de origen. Si esa ratificación ocurriera en el futuro con un resultado distinto, esta fila debería actualizarse a "Reemplazado", nunca editarse retroactivamente.

---

## 5. Relaciones

Este documento depende de `docs/design/README.md` (dominio), de `docs/design/brand/DESIGN_CONCEPT.md` (fuente conceptual de DD-001) y de `docs/archive/design/explorations/DESIGN_EXPLORATION.md` (fuente de evidencia exploratoria para futuras decisiones). Ninguna decisión aquí puede registrarse sin una fuente documental citable.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Concepto central de diseño (Orientación) | `docs/design/brand/DESIGN_CONCEPT.md` §4.2 | ✔ — DD-001 | Aprobado para efectos de proceso de diseño; pendiente de ratificación final por CEO/fundador en su documento de origen |
| Familias exploradas en EXP-001 (Brújula, Mapa, Constelación) | `docs/archive/design/explorations/DESIGN_EXPLORATION.md` | No consolidado — ninguna decisión tomada todavía | Explícitamente fuera de esta versión; EXP-001 permanece abierta |
| Logo, color, tipografía | — (no existen documentos de sistema visual todavía) | No consolidado | Pendiente de `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM` |

---

## 7. Gobierno

`docs/design/decisions/DESIGN_DECISION_LOG.md` **no reemplaza** `docs/design/brand/DESIGN_CONCEPT.md` ni ningún otro documento de `docs/brand/`: solo registra que una decisión de proceso fue tomada con base en ellos. Toda fila de este registro que entre en conflicto con una futura revisión de `docs/brand/` debe marcarse como "Reemplazado", nunca editarse ni eliminarse — el historial de decisiones debe permanecer íntegro.

Este documento es gobernado por `docs/design/README.md` (§4.3, principio 4: *"Toda decisión debe ser trazable a su fuente conceptual"*). Ninguna fila puede aprobarse sin una columna "Documento fuente" verificable.

---

## 8. Documentos relacionados

- `docs/design/README.md` — dominio en el que vive este documento.
- `docs/design/brand/DESIGN_CONCEPT.md` — fuente de la decisión DD-001.
- `docs/archive/design/explorations/DESIGN_EXPLORATION.md` — fuente de evidencia exploratoria para futuras decisiones.
- `docs/design/assets/README.md` — regla de que ningún activo es oficial sin una fila correspondiente en este documento.
- `docs/product/decisions/DECISION_LOG.md` — precedente de formato de registro de decisiones en otro dominio del repositorio.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial. Define la estructura de la tabla de decisiones y registra DD-001 (concepto central de diseño: Orientación), con nota de consistencia respecto al estado de ratificación pendiente en `DESIGN_CONCEPT.md`. | `docs/design/brand/DESIGN_CONCEPT.md` v1.0; `docs/design/README.md` v1.0; `docs/archive/design/explorations/DESIGN_EXPLORATION.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/design/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-05 | Creación del dominio documental de proceso de diseño y registro de la primera decisión oficial de diseño | Enterprise Documentation Architect / Design Governance Architect | `docs/design/decisions/DESIGN_DECISION_LOG.md` v1.0 (este documento), con DD-001 |

**Pendiente de definición:** ninguna decisión de este registro cuenta todavía con una aprobación formal registrada del CEO/fundador más allá de la aprobación de proceso aquí documentada. DD-001 queda sujeta a la ratificación final que `docs/design/brand/DESIGN_CONCEPT.md` ya declara pendiente.
