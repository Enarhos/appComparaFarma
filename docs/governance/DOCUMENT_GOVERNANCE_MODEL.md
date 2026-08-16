# Modelo de Gobierno Documental

**Código:** GOV-DGM-001

**Nombre:** DOCUMENT_GOVERNANCE_MODEL.md

**Dominio:** Gobierno Documental (`docs/governance/`)

**Estado:** Activo

**Versión:** 1.1

**Propietario:** CEO / CTO

**Nivel de Gobierno:** Fundacional derivado

**Clasificación:** Documento de Gobierno / Meta-modelo Documental

---

## 1. Propósito

Este documento formaliza, con base en la práctica ya existente del repositorio, el sistema de gobierno documental de ComparaFarma: qué tipos de documento existen, cuándo corresponde cada uno, cómo se relacionan las familias documentales entre sí, y cómo nace, evoluciona y se retira un documento.

Es la versión actualizada y consolidada de la propuesta que quedó abierta en `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8-9 (2026-08-02) — anterior a que existieran códigos de documento, Matriz de Trazabilidad, o la mayoría de las familias que hoy componen `docs/`. Este documento no reemplaza esa auditoría (sigue siendo el registro de su propio momento), la actualiza.

Este documento constituye la fuente oficial del modelo de gobierno documental de ComparaFarma. Ante una discrepancia entre este modelo y la práctica observada en el repositorio, prevalece este documento hasta que una nueva versión sea aprobada.

## 2. Alcance

**Este documento define:**

* Los dos tipos de documento que el repositorio ya distingue en la práctica — **Documentos Gobernados** y **Documentos de Ejecución** — y el criterio de cuándo corresponde cada uno.
* Las reglas comunes que ya se repiten en múltiples familias documentales.
* El mapa de relaciones entre las familias documentales (quién alimenta a quién, quién no debe duplicar a quién).
* El ciclo de vida documental ya practicado (nacimiento, evolución, reemplazo, historicidad, pérdida de vigencia).
* El estado de adopción de este modelo por parte del repositorio, a la fecha de esta versión (Anexo A) — como referencia, no como parte de la especificación.

**Este documento NO define:**

* La estructura de 10 secciones de los Documentos Gobernados — eso lo define `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), que este documento no reemplaza.
* Un proceso de aprobación formal de documentos — sigue siendo un vacío heredado de GOV-TPL-001 §Alcance, que este documento no resuelve.
* El contenido conceptual de ningún documento de negocio, producto o arquitectura.
* Reorganización, migración o movimiento de ningún archivo existente — este documento describe el modelo y su estado de adopción, no prescribe un cambio.

## 3. Contenido principal

### 3.0 Mapa del modelo

```
                        Gobierno Documental
                               │
              ┌────────────────┴────────────────┐
              │                                  │
     Documentos Gobernados              Documentos de Ejecución
   (conocimiento estable,                (entregables atados a
    fuente de verdad recurrente)          un sprint o ciclo, con
              │                            fecha de corte)
              │                                  │
        Enterprise                          Release
        Brand                               Operations
        Design System                       Domain
        Product                             Execution
        Strategy                            Analysis
        Architecture                        Project
        Governance
              │
     (Program, Launch, Design:
      adopción voluntaria)
```

### 3.1 Documentos Gobernados y Documentos de Ejecución

**Documentos Gobernados.** Objetivo: sostener documentos que aspiran a ser fuente de verdad estable, consultada de forma recurrente. Tipo de conocimiento: conceptual y estratégico — identidad, capacidades de negocio, arquitectura funcional, estándares de diseño —, no código ni ejecución con fecha de vencimiento. Ciclo de vida: nace con metadata completa (Código, Versión, Estado, Propietario, Nivel de Gobierno) → evoluciona por versión semántica con Control de Cambios (filas nuevas, nunca editadas retroactivamente) → cualquier acción de gobierno externa queda en Historial de Gobierno → se vuelve histórico cuando se declara `Estado: Histórico-inmutable` o un sucesor lo declara superado.

Familias: Enterprise, Brand, Design System (obligatorias por GOV-TPL-001), y por adopción voluntaria — no exigida por la plantilla — Launch (`LNC-PRR-001`), Program (`PRG-RDM-001`), Design (`DES-RDM-001`) y Operations (`OPS-SVC-001`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`). Product y Strategy están en la lista de obligatoriedad de GOV-TPL-001, con adopción parcial (ver Anexo A). Architecture, también obligatoria, tiene la adopción más débil de las siete familias previstas.

**Documentos de Ejecución.** Objetivo: producir un entregable atado a un sprint o evento concreto, con fecha de corte, que no necesita sobrevivir como referencia recurrente más allá de su ciclo. Tipo de conocimiento: decisión operativa de corto plazo, fotografía de un estado, o contrato conceptual acotado a un sprint específico. Ciclo de vida: nace con header `Sprint:`/`Tipo:` + `Fecha de corte:` (o `Fecha:`) + `Alcance` → vive mientras el ciclo está activo → al terminar, queda como registro histórico tal cual (postmortems, actas), o es reemplazado por un sucesor del mismo tipo que lo declara superado en su propio texto.

Familias: Release, Domain, Operations, Execution, Analysis, Project — y, en parte, Architecture (ver Anexo A).

**Criterio de decisión** (el mismo que ya declara GOV-TPL-001 §"Aplicación de esta plantilla"): si el documento pretende ser una fuente de verdad estratégica que otras personas del equipo consultarán de forma recurrente, corresponde Documentos Gobernados. Si el documento responde una pregunta acotada a un momento concreto ("¿puede publicarse esta semana?", "¿qué infraestructura usa hoy producción?") y no una pregunta estable en el tiempo, corresponde Documentos de Ejecución.

### 3.2 Reglas comunes

* **Una única fuente de verdad por concepto** — formulación presente en documentos de al menos 5 familias (Enterprise, Brand, Design, Design System, Strategy): *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*
* **Una responsabilidad por documento**, con Alcance en dos listas ("define" / "no define") — presente en Enterprise, GOV-TPL-001, Design System y Release, con la lista de "no define" apuntando, cuando es posible, a qué otro documento sí lo define.
* **Crecimiento aditivo por referencia hacia adelante** — cada documento nuevo de una familia anticipa, en su propia sección de cierre, el nombre del documento que debería existir después. Se practica en Product (`SEARCH_EXPERIENCE.md` → ... → `USER_JOURNEYS.md`, que cierra el ciclo) y en Design System.
* **Matriz de Trazabilidad** — presente en documentos de al menos 6 familias (Brand, Design, Design System, Launch, Product, Program); ausente en Enterprise y Strategy pese a ser obligatoria para ambas (ver Anexo A).
* **Control de Cambios con versión semántica, sin comparabilidad implícita entre versiones** — el precedente más claro es `docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md`, cuya v2.0 declara que su veredicto no es comparable numéricamente con v1.0/v1.1 porque cambió la metodología.

### 3.3 Relaciones entre familias

* **Domain es la familia más aguas arriba**: `USER_DOMAIN_MODEL.md` es citado por Architecture, Execution, Project, Strategy y Analysis; no hay cita de vuelta hacia Domain.
* **Architecture alimenta a Release/Operations** en una sola dirección (Release/Operations citan Architecture; no a la inversa).
* **Enterprise declara alimentarse de Strategy y Product** en su propia tabla de Alcance, pero ninguno de los dos cita de vuelta a Enterprise, ni se citan entre sí — a diferencia de Brand↔Design y Brand/Product↔Design System, que sí tienen una regla de no-duplicación declarada explícitamente en ambos sentidos ("Brand define. Design materializa."; "Este dominio no tiene autoridad de gobierno de marca ni de producto... prevalecen esos dominios"). No existe un enunciado equivalente entre Enterprise↔Strategy↔Product.

### 3.4 Ciclo de vida documental

1. **Nacimiento** — por referencia hacia adelante (el documento anterior anticipa el nombre del siguiente, como en Product) o por chárter de dominio (un README nuevo gobierna una carpeta ya poblada, como en Brand, Design, Design System y Program).
2. **Evolución** — versión semántica registrada en Control de Cambios; el precedente de GOV-TPL-001 v1.0→v1.1 muestra que un documento subordinado puede motivar la actualización del documento que lo gobierna.
3. **Reemplazo** — con supersesión declarada desde el documento sucesor, no desde el documento superado: `docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md` declara en su propia metadata que unifica y sucede a `PRODUCTION_READINESS_V2.md`, `RELEASE_READINESS_V1.md` y `PLAY_CONSOLE_CHECKLIST.md` — los tres siguen existiendo como archivo.
4. **Historicidad** — nivel ya reconocido por GOV-TPL-001 ("Históricos/inmutables"), aplicado en la práctica a actas y postmortems: se congelan, no se editan retroactivamente.
5. **Pérdida de vigencia** — sin mecanismo único todavía: ningún documento del repositorio usa hoy un campo `Estado: Obsoleto` o `Estado: Deprecado` de forma literal. La supersesión (punto 3) ocurre por prosa libre en el sucesor, no por metadata en el documento superado. Es un vacío real del sistema, registrado aquí como tal.

## 4. Relaciones

Este documento depende de, y no reemplaza:

* `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001) — sigue siendo la única fuente de la estructura de 10 secciones y de los niveles de gobierno reconocidos. Este documento no redefine nada de eso; opera un nivel por encima (cuándo corresponde cada tipo, no cómo se ve por dentro).
* `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8-9 — sigue siendo el registro de la primera vez que se propuso este modelo; no se reescribe, se actualiza en este documento nuevo.

Este documento es consumido por: ninguno todavía — es su primera versión.

## 5. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
| --- | --- | --- | --- |
| Estructura de 10 secciones y niveles de gobierno | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` | — (solo referenciado) | Este documento no la repite en detalle, solo la presupone |
| Propuesta original de estrategia de gobierno documental | `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §8-9 | ✔ (actualizada) | Anterior a los Documentos Gobernados; este documento la moderniza sin editarla |
| Regla de única fuente de verdad | `docs/enterprise/README.md` | ✔ (referenciada) | Citada también en Brand/Design/Design System |
| Documentos Gobernados y Documentos de Ejecución (nomenclatura) | Este documento (primera formalización explícita) | ✔ | No existía como término antes de este documento |
| Nivel "Chárter de Dominio" | Ninguna — practicado en 4 READMEs, no reconocido en GOV-TPL-001 | — | Pendiente de reconocimiento formal, ver Anexo A |

## 6. Gobierno

Este documento no reemplaza a `GOV-TPL-001` ni a `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`: los complementa desde un nivel distinto (cuándo corresponde cada tipo de documento y cómo se relacionan las familias, no cómo se estructura un documento por dentro). Ante una discrepancia entre este documento y GOV-TPL-001 sobre la estructura interna de un documento Gobernado, prevalece GOV-TPL-001. Ante una discrepancia sobre qué tipo corresponde a una familia nueva, prevalece este documento, hasta que se actualice.

Este documento no resuelve las situaciones descritas en el Anexo A — quedan como registro de estado, sujetas a decisión futura del CTO.

## 7. Documentos relacionados

* `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`
* `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`
* `docs/enterprise/README.md`, `docs/program/README.md`, `docs/design/brand/README.md`, `docs/design/README.md`, `docs/design/system/README.md` (ejemplos de Documentos Gobernados, incluidos los de adopción voluntaria)
* `docs/operations/RUNBOOK.md`, `docs/operations/environment/ENVIRONMENT.md`, `docs/archive/releases/RC-03_PRODUCTION_READINESS_REPORT.md`, `docs/technology/domain/USER_DOMAIN_MODEL.md` (ejemplos de Documentos de Ejecución)

## 8. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
| --- | --- | --- | --- | --- | --- |
| 1.0 | 2026-08-13 | Activo | Aprobado (CTO), 2026-08-13 | Creación del documento como primera versión oficial, a partir de auditorías sucesivas realizadas en la misma sesión de trabajo (docs/operations, modelo de gobierno de Operations, meta-gobierno histórico, y esta especificación). Formaliza los dos tipos de documento ("Documentos Gobernados" y "Documentos de Ejecución"), las reglas comunes, el mapa de relaciones entre familias y el ciclo de vida documental, con un diagrama de una pantalla al inicio de la sección 3 y la situación de adopción del repositorio en el Anexo A. La construcción del documento incluyó una revisión editorial previa a su aprobación (nomenclatura, ubicación del anexo, lenguaje de especificación); esa revisión forma parte de esta misma versión 1.0, no de una versión separada. | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`, `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`, y lectura directa de documentos de 8 familias distintas |
| 1.1 | 2026-08-13 | Activo | Pendiente (CTO) | Corrección de consistencia documental (revisión final de `PLATFORM_SERVICE_CATALOG.md`): se agrega Operations (`OPS-SVC-001`) a la lista de familias con adopción voluntaria de `GOV-TPL-001` en §3.1, junto a Launch, Program y Design — reflejando la adopción ya declarada por `docs/operations/PLATFORM_SERVICE_CATALOG.md` desde su creación. No se modifica ninguna otra regla, relación ni nivel de gobierno. | `docs/operations/PLATFORM_SERVICE_CATALOG.md` v1.0 |

## 9. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
| --- | --- | --- | --- |
| 2026-08-02 | Auditoría de Gobierno Documental general | Enterprise Documentation Architect | `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Elevación a estándar documental de repositorio | Enterprise Documentation Architect | `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0/v1.1 |
| 2026-08-13 | Revisión de gobierno operacional (docs/operations) | CTO / Claude | Informe entregado en sesión de trabajo, sin documento nuevo |
| 2026-08-13 | Revisión del modelo de gobierno de Operations frente a las demás familias | CTO / Claude | Informe entregado en sesión de trabajo, sin documento nuevo |
| 2026-08-13 | Revisión histórica del origen de los dos tipos de documento | CTO / Claude | Informe entregado en sesión de trabajo, sin documento nuevo |
| 2026-08-13 | Formalización del modelo de gobierno documental | CTO / Claude | `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` v1.0 (borrador) |
| 2026-08-13 | Revisión editorial previa a aprobación (nomenclatura permanente, reubicación del estado de adopción a Anexo A, diagrama del modelo, lenguaje de especificación) | CTO / Claude | `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` v1.0 (mismo borrador, revisado) |
| 2026-08-13 | Aprobación formal | CTO | `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` v1.0 aprobado como fuente oficial del modelo de gobierno documental de ComparaFarma |
| 2026-08-13 | Revisión final de consistencia documental de `PLATFORM_SERVICE_CATALOG.md` — corrección de referencia | CTO / Claude | `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` v1.1 (este documento): Operations agregado a §3.1 como familia de adopción voluntaria |

**Nota:** este documento cuenta con aprobación formal del CTO, registrada en el Control de Cambios. Es, a partir de esta versión, la fuente oficial del modelo de gobierno documental de ComparaFarma.

---

## Anexo A — Estado de Adopción (2026-08-13)

Situación del repositorio frente al modelo descrito arriba, a la fecha indicada. No forma parte de la especificación del modelo — es una referencia sobre su adopción real, que puede cambiar sin que el modelo cambie.

1. Architecture, familia obligatoria de Documentos Gobernados, tiene 2 de 5 documentos (`PLATFORM_CAPABILITY_MODEL.md`, `IDENTITY_INTEGRATION_PLAN.md`) con formato de Documentos de Ejecución.
2. `docs/product/README.md` (el índice del propio dominio Product) no tiene metadata, código ni versión, mientras 5 documentos "hijos" del mismo dominio sí siguen el estándar completo.
3. Enterprise y Strategy, familias obligatorias, no usan Matriz de Trazabilidad pese a ser sección obligatoria de GOV-TPL-001 §6.
4. `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` se describe a sí mismo como "documento permanente de gobierno operacional" en su primera línea, con formato de Documentos de Ejecución (sin Código, sin Versión, sin campo Estado).
5. El nivel "Chárter de Dominio", en uso real y consistente en 4 documentos (`docs/design/brand/README.md`, `docs/design/README.md`, `docs/design/system/README.md`, `docs/program/README.md`), no está en la lista de niveles reconocidos por GOV-TPL-001 — a diferencia de "Fundacional derivado", que sí fue incorporado formalmente cuando se practicó por primera vez. Este documento no edita GOV-TPL-001 para agregarlo; queda registrado como pendiente.
6. La decisión D-003 del acta `docs/archive/meetings/20260725.md` ("el repositorio es la única fuente oficial") difiere del estado real de `git status`: a la fecha de esta versión, la mayoría de los documentos de ambos tipos —creados después de esa acta— siguen sin comitear (`??` untracked).
7. La asimetría de citas Enterprise↔Strategy↔Product (§3.3) no tiene todavía una regla de no-duplicación declarada, pese al riesgo teórico de solapamiento entre las tres.
8. `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §9 condicionó la creación de un documento de gobierno como este a completar antes cuatro pasos previos (versionar `docs/strategy/*`, fusionar duplicados de farmacias, cerrar CF-101-110, actualizar `docs/release/*`). No hay registro, a la fecha de esta versión, de que esos cuatro pasos estén completos.
