# DESIGN_EXPLORATION — Bitácora de Exploración Creativa de ComparaFarma

Este documento es una bitácora permanente, no un registro de decisiones. Ninguna entrada de este documento constituye, por sí sola, una decisión oficial de diseño — eso corresponde exclusivamente a `docs/design/DESIGN_DECISION_LOG.md`. Una exploración puede quedar abierta indefinidamente sin que eso sea un problema: cerrar prematuramente una exploración para llegar a una decisión contradice el criterio de éxito ya declarado en `docs/brand/DESIGN_CONCEPT.md` §7.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DES-EXP-001 |
| **Nombre** | DESIGN_EXPLORATION.md |
| **Dominio** | Proceso de Diseño (`docs/design/`) |
| **Estado** | Activo (bitácora viva; se agregan entradas, no se cierran versiones) |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Documentation Architect / Design Governance Architect |
| **Nivel de Gobierno** | De proceso creativo (bitácora) — nivel introducido en `docs/design/README.md` §1 para documentos que registran, de forma abierta y no jerárquica, un proceso de exploración en curso, sin que cada entrada constituya una decisión (a diferencia de "De decisión operativa", donde cada entrada sí es una resolución) |
| **Clasificación** | Bitácora de Proceso de Diseño |
| **Fuente Oficial** | Este mismo documento, en tanto registro primario de cada sesión de exploración; se apoya en `docs/brand/DESIGN_CONCEPT.md` como fuente conceptual de cada exploración |
| **Documentos de los que depende** | `docs/design/README.md`, `docs/brand/DESIGN_CONCEPT.md`, `docs/brand/VISUAL_IDENTITY.md` |
| **Documentos que gobierna** | Ninguno. Sus hallazgos pueden derivar en entradas de `docs/design/DESIGN_DECISION_LOG.md`, pero esa relación es de insumo, no de gobierno: una exploración no obliga a ninguna decisión |
| **Pregunta que responde** | ¿Qué se ha explorado hasta ahora, con qué objetivo, y qué se encontró? |

---

## 2. Propósito

Este documento preserva el conocimiento generado durante cada sesión de exploración creativa del proceso de diseño de ComparaFarma — qué se intentó, qué se encontró, qué riesgos aparecieron y qué queda pendiente — para que ese conocimiento no se pierda con el tiempo ni deba reconstruirse de memoria en revisiones futuras.

A diferencia de `docs/design/DESIGN_DECISION_LOG.md`, que registra resoluciones, este documento registra **procesos**: una entrada aquí puede terminar sin una dirección seleccionada, y eso es un resultado legítimo, no un fracaso del registro.

---

## 3. Alcance

**Este documento define:**

- Una estructura reutilizable para registrar cualquier exploración creativa futura (§4.1).
- El registro completo de cada exploración realizada, incluyendo la primera (§4.2, EXP-001).

**Este documento NO define:**

- Decisiones oficiales de diseño. Corresponde a `docs/design/DESIGN_DECISION_LOG.md`.
- Reglas de almacenamiento de activos gráficos. Corresponde a `docs/design/assets/README.md`.
- El concepto central de diseño ni sus metáforas candidatas. Ya están definidos en `docs/brand/DESIGN_CONCEPT.md`; este documento los explora, no los redefine.
- Logos, colores ni tipografías concretas. Ninguna exploración registrada aquí constituye una propuesta gráfica oficial, aunque incluya activos visuales.

---

## 4. Contenido principal

### 4.1 Estructura reutilizable de una entrada de exploración

Toda exploración creativa registrada en este documento debe incluir, como mínimo, los siguientes campos:

| Campo | Descripción |
|---|---|
| **ID** | Identificador secuencial de la exploración (`EXP-XXX`). |
| **Fecha** | Fecha en que se realizó la sesión de exploración. |
| **Objetivo** | Qué se buscaba explorar y por qué. |
| **Documento fuente** | Qué documento de `docs/brand/` (o entrada previa de este mismo documento) origina la exploración. |
| **Concepto explorado** | Qué concepto, familia conceptual o metáfora se exploró, con referencia a su origen en `docs/brand/DESIGN_CONCEPT.md`. |
| **Activos generados** | Qué archivos se produjeron, dónde se almacenan (`docs/design/assets/`) y su nombre canónico. |
| **Observaciones** | Notas relevantes sobre el proceso, incluidas advertencias sobre cómo debe (o no debe) interpretarse el activo generado. |
| **Hallazgos** | Qué se aprendió, en términos conceptuales, de la exploración. |
| **Riesgos** | Qué podría malinterpretarse, quedar incompleto, o requerir atención antes de avanzar. |
| **Próximos pasos** | Qué debería hacerse a continuación, sin comprometer todavía una decisión. |
| **Estado** | Abierta / Cerrada sin selección / Derivó en decisión (con referencia al ID correspondiente de `DESIGN_DECISION_LOG.md`). |

### 4.2 Exploración 001

| Campo | Contenido |
|---|---|
| **ID** | EXP-001 |
| **Fecha** | 2026-08-05 |
| **Objetivo** | Explorar tres familias conceptuales derivadas de `docs/brand/DESIGN_CONCEPT.md`. |
| **Documento fuente** | `docs/brand/DESIGN_CONCEPT.md` (v1.0), específicamente §4.2 (Concepto Central: Orientación) y §4.4 (Metáforas Visuales) |
| **Concepto explorado** | Tres familias conceptuales, correspondientes a las tres metáforas que `DESIGN_CONCEPT.md` §4.4 recomendó explícitamente para exploración futura: **(1) Orientación / Brújula**, **(2) Ruta / Mapa**, **(3) Constelación / Conexión**. |
| **Activos generados** | `docs/design/assets/concept-board-v1.png` — un board comparativo de las tres familias, con palabras clave, referencias visuales de tono/textura y notas cromáticas exploratorias por familia. **Este activo constituye un material de exploración, no una propuesta gráfica oficial ni una decisión de identidad visual.** El propio archivo incluye un texto de descargo interno consistente con esta misma advertencia. |
| **Observaciones** | (1) El board incluye, para cada familia, un conjunto de muestras de color a modo de exploración de tono/temperatura únicamente — **no deben interpretarse como una decisión de paleta**: `COLOR_SYSTEM` sigue sin existir y ninguna decisión de color ha sido aprobada (ver `docs/brand/VISUAL_IDENTITY.md` y `docs/brand/DESIGN_CONCEPT.md`, ambos explícitamente fuera del alcance de color). (2) El archivo original fue encontrado directamente en `docs/design/` (sin la estructura de gobierno todavía creada) bajo el nombre `Exporacion Conceptual de ComparaFarma.png`; se organizó como `docs/design/assets/concept-board-v1.png` al crear este dominio documental, sin eliminar el archivo original por no contar con permisos de borrado sobre el equipo del usuario en esta sesión — se recomienda a quien administre el repositorio retirar manualmente la copia suelta una vez confirmada la copia canónica en `assets/`. |
| **Hallazgos** | Las tres familias resultan visualmente distintas entre sí, pero comparten el mismo concepto central (Orientación), lo cual es coherente con el criterio de éxito declarado en `docs/brand/DESIGN_CONCEPT.md` §7 (un mismo concepto debe admitir múltiples expresiones gráficas, sin converger prematuramente en una sola). La familia "Constelación / Conexión" añade, además de orientación, una lectura de "patrón que emerge de múltiples puntos", que resuena con el diferenciador de comparación entre múltiples farmacias ya citado en `docs/brand/BRAND_FOUNDATIONS.md` §14 y `docs/brand/VISUAL_IDENTITY.md` §4.2. |
| **Riesgos** | (1) Las muestras de color incluidas en el board podrían malinterpretarse como una paleta ya decidida, pese a que ningún documento de gobierno ha aprobado colores todavía — riesgo de saltarse el roadmap declarado en `docs/brand/DESIGN_CONCEPT.md` §4.10. (2) La metáfora "Faro", que `DESIGN_CONCEPT.md` §4.4 dejó "con reserva" (no descartada, pero pendiente de análisis adicional por su connotación de autoridad/rescate), no fue incluida en este primer board — el universo de metáforas exploradas no debe considerarse cerrado. (3) Ninguna de las tres familias fue evaluada todavía contra la matriz de criterios de `docs/brand/DESIGN_CONCEPT.md` §4.8. |
| **Próximos pasos** | Evaluar cada una de las tres familias contra la matriz de criterios de `docs/brand/DESIGN_CONCEPT.md` §4.8. Considerar una exploración adicional (EXP-002) que incorpore la metáfora "Lente" y/o resuelva la reserva sobre "Faro". No registrar ninguna entrada en `docs/design/DESIGN_DECISION_LOG.md` que seleccione una familia específica hasta completar esa evaluación. |
| **Estado** | **Abierta.** No se selecciona ninguna dirección. Las tres familias permanecen vigentes para exploración futura. |

---

## 5. Relaciones

Este documento depende de `docs/design/README.md` (que define el dominio en el que vive) y de `docs/brand/DESIGN_CONCEPT.md` (que es la fuente conceptual de toda exploración registrada aquí). No depende de `docs/design/DESIGN_DECISION_LOG.md`, aunque puede alimentarlo: cuando una exploración registrada aquí produce evidencia suficiente para una decisión, esa decisión se registra allá, citando el ID de la exploración correspondiente (ver EXP-001 → pendiente de generar una decisión futura, aún no existente).

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Metáforas visuales candidatas (mapa, brújula, constelación) | `docs/brand/DESIGN_CONCEPT.md` §4.4 | ✔ — exploradas en EXP-001 | Ninguna fue seleccionada; las tres siguen vigentes |
| Metáfora "Faro" (con reserva) | `docs/brand/DESIGN_CONCEPT.md` §4.4 | No explorada todavía | Pendiente para una futura exploración (EXP-002 o posterior) |
| Concepto central (Orientación) | `docs/brand/DESIGN_CONCEPT.md` §4.2 | Verificado como presente en las tres familias exploradas | Consistente con el criterio de éxito de `DESIGN_CONCEPT.md` §7 |
| Restricción de color (sin decisión todavía) | `docs/brand/VISUAL_IDENTITY.md`, `docs/brand/DESIGN_CONCEPT.md` (ambos fuera de alcance de color) | Referenciada como advertencia en Observaciones de EXP-001 | Las muestras cromáticas del board son exploratorias, no decisiones |

---

## 7. Gobierno

`docs/design/DESIGN_EXPLORATION.md` **no reemplaza**:

- `docs/brand/DESIGN_CONCEPT.md` — sigue siendo la única fuente del concepto central y de las metáforas candidatas.
- `docs/design/DESIGN_DECISION_LOG.md` — ninguna entrada de este documento constituye, por sí sola, una decisión oficial.

Este documento es gobernado por `docs/design/README.md` (§4.3, Principios de gobierno del dominio), en particular por el principio de que ninguna exploración necesita concluir en una decisión. Cuando exista una discrepancia entre una exploración registrada aquí y el concepto central o las metáforas ya analizadas en `docs/brand/DESIGN_CONCEPT.md`, prevalece `DESIGN_CONCEPT.md`.

---

## 8. Documentos relacionados

- `docs/design/README.md` — dominio en el que vive este documento.
- `docs/brand/DESIGN_CONCEPT.md` — fuente conceptual de toda exploración.
- `docs/brand/VISUAL_IDENTITY.md` — fuente de principios y atributos de percepción que informan cada exploración.
- `docs/design/DESIGN_DECISION_LOG.md` — destino eventual de las exploraciones que maduran en decisión.
- `docs/design/assets/README.md` — reglas de almacenamiento de los activos generados en cada exploración.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial. Define la estructura reutilizable de una entrada de exploración y registra la Exploración 001 (tres familias conceptuales: Orientación/Brújula, Ruta/Mapa, Constelación/Conexión), con el activo `concept-board-v1.png` catalogado como material exploratorio, sin dirección seleccionada. | `docs/brand/DESIGN_CONCEPT.md` v1.0; `docs/brand/VISUAL_IDENTITY.md` v1.0; `docs/design/README.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-05 | Creación del dominio documental de proceso de diseño y registro de la primera exploración creativa | Enterprise Documentation Architect / Design Governance Architect | `docs/design/DESIGN_EXPLORATION.md` v1.0 (este documento), con EXP-001 |

**Pendiente de definición:** EXP-001 queda registrada como abierta. Ninguna dirección conceptual (brújula, mapa o constelación) ha sido aprobada como decisión oficial — esa aprobación, si ocurre, deberá registrarse en `docs/design/DESIGN_DECISION_LOG.md`, no en este documento.
