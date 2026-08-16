# Auditoría Documental y Gobierno del Conocimiento — ComparaFarma

**Fecha:** 2026-08-02
**Autor:** CTO (rol asumido también como Arquitecto de Documentación para esta tarea)
**Naturaleza:** Auditoría de solo lectura. Ningún documento existente fue modificado, movido ni eliminado para producir este informe. Este es el único documento nuevo creado, por ser indispensable para entregar la auditoría solicitada.
**Alcance revisado:** `docs/` completo (incluyendo `book/`, `architecture/`, `product/`, `engineering/`, `release/`, `actas/`, `audits/`, `prompt/`, `strategy/`), `README`/`CLAUDE.md` de raíz, `.claude/agents/`, `.claude/skills/`, `.ai/prompts/`, y las carpetas ajenas a `docs/` que resultaron relevantes para el gobierno documental (`audit-package/`, `ml_borrar/`, `_CLAUDE_TMP_BORRAR/`). No se auditaron GitHub Issues/Projects nativos de GitHub: el repo no los usa — el equivalente funcional son los archivos `CF-xxx` en `docs/engineering/issues/`, que sí se auditan aquí.

---

## Resumen ejecutivo

El repo tiene **~150 documentos** repartidos en 9 carpetas de `docs/` más 58 capítulos narrativos del "Libro Fundacional". El patrón de fondo, repetido en casi todos los hallazgos: **el código y las decisiones reales avanzan más rápido que el cierre formal de la documentación que los describe**. Hay dos documentos que funcionan de facto como fuente de verdad viva y confiable (`BACKLOG_PRODUCT.md` y `DECISION_LOG.md`); el resto del árbol documental orbita alrededor de ellos con distintos grados de sincronización, desde perfecta hasta contradicción activa.

Los problemas no son de falta de documentación — sobra, no falta. Son de **gobierno**: no hay una única fuente de verdad declarada por tema, no hay ciclo de vida ni versión formal en la mayoría de los documentos, y una parte no trivial del árbol (los 3 documentos de `docs/strategy/`, 3 de los 4 skills en `.claude/skills/`) ni siquiera está bajo control de versiones.

---

## 1. Inventario documental (por dominio)

### 1.1 Visión y Cultura

| Documento | Propósito | Estado | Responsable | Última actualización real | Dependencias |
|---|---|---|---|---|---|
| `docs/book/` (58 archivos: Carta del Fundador, 00-front-matter, Actos I–IV, appendix) | Texto narrativo fundacional: origen, identidad, forma de trabajar, legado. Constitución de 8 artículos, Manifiesto, Credo, 12 Principios Inmutables | Vigente como narrativa, sin versión formal | No asignado | Sin fecha en ningún archivo | Ninguna referencia explícita a otros docs del repo |
| `docs/product/VISION.md` | Visión/misión corta de producto | Vigente pero redundante | No asignado | Sin fecha | Se solapa con `PRODUCT_CANVAS.md` y el Libro |
| `docs/product/PRODUCT_CANVAS.md` | Canvas de producto (propósito, público, valor, KPIs) | Vigente pero redundante | No asignado | Sin fecha | Duplica `VISION.md`/`ROADMAP.md` (frase textual idéntica) |
| `docs/product/PRODUCT_PRINCIPLES.md` | 10 principios de producto | Vigente, citado en la práctica ("Principio 7" en actas/backlog) | No asignado | Sin fecha | Citado por `BACKLOG_PRODUCT.md`, actas |
| `docs/strategy/VISION_2030.md` (**untracked**) | Visión aspiracional 2030, activos estratégicos, marco de 5 preguntas | Vigente, el más completo de este grupo | No asignado | "Agosto 2026" (con metadata de versión — único doc del repo que la tiene) | Ninguna referencia cruzada por archivo |

### 1.2 Producto

| Documento | Propósito | Estado | Última actualización real | Dependencias |
|---|---|---|---|---|
| `docs/product/README.md` | Índice de la carpeta `product/` | Obsoleto — indexa 9 de ~20 documentos reales | Sin fecha | — |
| `docs/product/ROADMAP.md` | Roadmap v1.0, 5 objetivos, jul-2026/jun-2027 | Desactualizado — no refleja Sprints A–E ni Subscription Platform | "Revisión mensual" declarada, no cumplida | `EPICS.md`, `BACKLOG_PRODUCT.md` |
| `docs/product/COMPANY_STRATEGY.md` | Plan "de app a empresa" (Fases 1–4) | Parcialmente desactualizado — tabla de fases no refleja avance real | 2026-07-19 | Citado por `CLAUDE.md`, `EPICS.md`, `BACKLOG_PRODUCT.md` |
| `docs/product/SUBSCRIPTION_STRATEGY.md` | Estrategia de negocio del Motor de Suscripciones | Vigente, coherente con lo implementado | Sin fecha propia, referenciada y ejecutada 2026-08-02 | `EPICS.md`, `BACKLOG_PRODUCT.md`, RFC-003 |
| `docs/product/PRODUCT_DECISION_FRAMEWORK.md` | Framework CFPS de priorización | Vigente y activamente usado — el mejor mantenido de su tipo | Sin fecha, uso confirmado hasta 2026-08-02 | Citado por casi todo el árbol de decisiones |
| `docs/product/PERSONAS.md` | 4 personas de usuario | Vigente | Sin fecha | Mencionado en actas |
| `docs/product/FEATURE_STATUS.md` | Tabla de estado de features por área | **Obsoleto y activamente engañoso** | 2026-06-29 | Contradicho por `PRODUCT_REVIEW_V1.md` un día después |
| `docs/product/BACKLOG_PRODUCT.md` | Backlog vivo con CFPS, verificado contra código | **Vigente — el documento mejor mantenido del repo** | 2026-08-02 | Hub: referencia casi todo |
| `docs/product/BACKLOG_TECH.md` | Backlog de deuda técnica | **Vacío** | — | — |
| `docs/product/EPICS.md` | Registro de Epics grandes | Vigente | 2026-08-02 | `SUBSCRIPTION_STRATEGY.md`, RFC-003, ADR-0002 |
| `docs/product/DECISION_LOG.md` | Log cronológico de decisiones/cierres | **Vigente, muy completo, el segundo mejor mantenido** | 2026-08-02 | Referencia casi total del árbol |
| `docs/product/RISKS.md` | 3 riesgos conocidos con mitigación | Incompleto | Sin fecha | `PM-001`, `ER-002` |
| `docs/product/KPIS.md` | Indicadores | **Vacío** | — | — |
| `docs/product/IDEAS.md` | Ideas futuras | **Vacío** | — | — |
| `docs/product/RELEASES.md` | Historial de versiones | **Vacío** | — | — |
| `docs/product/QUALITY.md` | Calidad | **Vacío** | — | — |
| `docs/product/DATA_POLICY.md` | Política de datos | **Vacío** | — | — |
| `docs/product/PRODUCT_REVIEW_V1.md` | Auditoría UX v1.4.0, origen del backlog | Vigente como fuente histórica | 2026-06-30 | Fuente explícita de `BACKLOG_PRODUCT.md` |

### 1.3 Estrategia (datos e integraciones, nivel aspiracional)

| Documento | Propósito | Estado | Dependencias |
|---|---|---|---|
| `docs/strategy/MASTER_DATA_STRATEGY.md` (**untracked**) | Estrategia de Catálogo Maestro / gobierno de datos | Borrador explícito, no aterrizado contra RFC-002/CFM-ID real | Aislado — nadie lo referencia |
| `docs/strategy/PHARMACY_NETWORK_STRATEGY.md` (**untracked**) | Estrategia de red de farmacias, niveles A–E | Borrador explícito, no aterrizado contra el estado real (3/9 farmacias son scraping frágil) | Aislado |

### 1.4 Arquitectura e Ingeniería

| Documento | Propósito | Estado | Dependencias |
|---|---|---|---|
| `docs/architecture/DOMAIN_MODEL.md` | Modelo de dominio real + brechas hacia Knowledge Graph | Vigente, autocrítico (señala errores en otros docs) | `normalization.md`, `price-channels.md`, `farmacias.md`, RFC-002 |
| `docs/architecture/RFC-002_MEDICATION_DETAIL_AND_PRICE_HISTORY.md` | RFC de ficha de medicamento + histórico web | **"Propuesto"**, nunca actualizado pese a estar implementado (Sprint Web 1) | Ninguna — **colisiona en numeración con el RFC-002 de `engineering/rfc/`** |
| `docs/engineering/SEARCH_ENGINE.md` | — | **Vacío / archivo fantasma** | — |
| `docs/engineering/adr/ADR-0001_SHARED_DOMAIN_PACKAGE.md` | Decisión: crear `packages/domain` | Aprobado, vigente | RFC-001, ER-002 |
| `docs/engineering/adr/ADR-0002_SUBSCRIPTION_ARCHITECTURE.md` | Decisión: motor de suscripciones desacoplado | Aprobado, vigente | RFC-003 |
| `docs/engineering/rfc/RFC-001_SHARED_NORMALIZATION_PACKAGE.md` | RFC del paquete `packages/domain` | Metadata dice "Aprobado", DoD (25 checkboxes) 0% marcado | ADR-0001, ER-002/003 |
| `docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` | RFC del Registro Canónico CFM-ID | Implementado (Fases 0–5), correctamente cerrado | ADR-0001, `schema.sql` |
| `docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md` | RFC del Motor de Suscripciones | Header dice "Propuesto, pendiente de ratificación" — **desactualizado**: CF-112–116 y `schema.sql` confirman implementación completa desde el mismo día | ADR-0002, `SUBSCRIPTION_STRATEGY.md` |
| `docs/engineering/reviews/ER-002_SEARCH_ENGINE_FULL_REVIEW.md` | Revisión CTO del motor de búsqueda (6.8/10) | Draft, nunca cerrado formalmente | CF-001/AUDIT-001 |
| `docs/engineering/reviews/ER-003_RFC-001_CTO_REVIEW.md` | Revisión adversarial: ¿RFC-001 se cerró como decía? | Draft — confirma que no, pero el hallazgo no se generalizó | RFC-001, ADR-0001 |
| `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md` | Postmortem del incidente de deploy roto | Resuelto, bien documentado | ER-003, `DECISION_LOG.md` |
| `docs/engineering/issues/CF-101` a `CF-107`, `CF-109`, `CF-110` (9 archivos) | Submódulos de `packages/domain`, tests, cleanup, CI | **Dicen "Pendiente" pese a estar implementados y en producción desde hace semanas** | RFC-001 §7 |
| `docs/engineering/issues/CF-108` | Migrar mobile a `@comparafarma/domain` | Completado (cerrado retroactivamente 2026-07-19) | RFC-001 §7 |
| `docs/engineering/issues/CF-111` | Investigar timeout AraucoMed | Cerrado — no reproducible, en monitoreo | `DECISION_LOG.md` |
| `docs/engineering/issues/CF-112` a `CF-116` | Motor de Suscripciones Fase 1 | Implementados y coherentes con el código (CF-114 con una acción manual pendiente de Mario) | RFC-003, ADR-0002 |

### 1.5 Datos e Integraciones (farmacias)

| Documento | Propósito | Estado | Dependencias |
|---|---|---|---|
| `docs/normalization.md` | `cleanQuery`/`matchKey`/`mergeDuplicates`/versionado de caché | Vigente, con **un error de hecho confirmado**: describe `mergeDuplicates` como "más reciente por `fetchedAt`"; el código real usa "menor `effective`" | ADR-0001 |
| `docs/pharmacy-apis.md` | Referencia técnica de endpoints por farmacia | Incompleto — solo 5 de 9 farmacias | Duplica `farmacias.md` |
| `docs/farmacias.md` | Ficha de integración por farmacia | Desactualizado — EcoFarmacias/Farmex marcadas "Backlog" estando en producción; Sermecoop/EasyFarma ausentes | Duplica `pharmacy-apis.md`, `funcionalidades.md` |
| `docs/funcionalidades.md` | Catálogo de funcionalidades de toda la app | Desactualizado — historial de versiones se detiene en vc14 (hoy vc31) | Tercera copia de la tabla de farmacias |
| `docs/price-channels.md` | Semántica de los 4 canales de precio | Incompleto — cubre 5 de 9 farmacias | Duplica parcialmente CLAUDE.md |
| `docs/pharmacy-flags.md` | Cómo activar/desactivar farmacias vía `/admin/config` | Vigente, correctamente actualizado a 9 farmacias | `appConfigDb.ts` |
| `CLAUDE.md` (raíz) | Contexto técnico completo, incluida la tabla de 9 farmacias × 4 canales | **Vigente y correcto — la única de las 5 fuentes de esta tabla que está al día** | — |
| `docs/database/schema.sql` | Esquema real de Supabase, por fases fechadas | **Vigente y activo — fuente de verdad de qué tablas existen** | RFC-002, RFC-003 |

### 1.6 Release y Operación

| Documento | Propósito | Estado | Dependencias |
|---|---|---|---|
| `docs/deployment.md` | Guía operativa de deploy (Vercel/EAS/Supabase/CI) | Vigente | `pharmacy-flags.md`, `schema.sql` |
| `docs/release/PLAY_CONSOLE_CHECKLIST.md` | Checklist de publicación en Play Store | Desactualizado — describe vc30/Prueba Interna | `RELEASE_READINESS_V1.md` |
| `docs/release/PRODUCTION_BLOCKERS_PLAN.md` | Plan de los 4 bloqueantes de producción | Desactualizado — mismo snapshot vc30 | `RELEASE_READINESS_V1.md` |
| `docs/release/RELEASE_READINESS_V1.md` | Review de release readiness (score 66%) | Desactualizado — recomienda "NO PUBLICAR AÚN" con vc30, hoy la app está en vc31/Prueba Cerrada | `PRODUCTION_BLOCKERS_PLAN.md` |
| `docs/release/SERVICE_ACCOUNT_MIGRATION.md` | Inventario de cuentas/servicios externos | Vigente, con auto-corrección aplicada 2026-08-02 (destino real: `mario.lillo.alfaro@gmail.com`) | RFC-003, CF-114 |

### 1.7 Gobierno, Actas y Auditorías previas

| Documento | Propósito | Estado | Dependencias |
|---|---|---|---|
| `docs/actas/20260725.md` a `20260731b.md` (5 archivos) | Actas de dirección: decisiones estratégicas por sesión | Vigentes como registro histórico | Consistentes entre sí y con `DECISION_LOG.md` |
| `docs/audits/AUDIT_SEARCH_NORMALIZATION.md` | Resultado de auditoría de búsqueda/normalización | Vigente, aunque su propio hallazgo CF-001 nunca se marcó resuelto en el texto | Par de `.ai/prompts/claude/audit/CLAUDE-AUDIT-001...md` (el prompt que lo generó) |
| `.ai/prompts/claude/audit/CLAUDE-AUDIT-001...md`, `CLAUDE-AUDIT-002...md` | Prompts que ordenaron generar auditorías/reviews | Son insumos, no resultados — relación causa→efecto, no duplicado | Generaron `AUDIT_SEARCH_NORMALIZATION.md` y `ER-002` |
| `.ai/prompts/claude/audit/.ai/context/SESSION_END_2026-06-29.md` / `SESSION_START_NEXT.md` | Bitácora de cierre/arranque de sesión | Vigente, pero **contradice el estado real de CF-101–110** (dice "completado") | — |
| `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_*.md` (5 archivos) | Prompts de arranque de cada sprint (C, D, E, Web-1, Sprint 02) | Vigentes como registro histórico de diseño de cada sprint | Cada uno referenciado desde `DECISION_LOG.md` |
| `.claude/agents/comparafarma-{cto,devops,qa,software-factory}.md` | Personas/roles del equipo de agentes | Vigentes, versionados en git, coherentes entre sí | — |
| `.claude/skills/cto-review/SKILL.md`, `docs-steward/SKILL.md`, `scraper-watchdog/SKILL.md` | Revisión adversarial, sincronización doc↔código, diagnóstico de scrapers | Vigentes en contenido, pero **no versionados en git** (excluidos por `.gitignore: .claude/*` sin excepción para `skills/`) | — |
| `.claude/skills/run-android/SKILL.md` | Runbook de entorno Android | Vigente, sí versionado | — |
| `docs/privacy-policy.html` | Política de privacidad pública | Vigente, ya corregido el email de contacto (2026-08-02) | Publicado en GitHub Pages |

### 1.8 Anomalías fuera de `docs/` (relevantes para el gobierno documental)

| Elemento | Qué es | Estado git |
|---|---|---|
| `audit-package/` | Snapshot plano del repo (~30 jun) para revisión externa por un LLM/CTO asesor | En `.gitignore`; **obsoleto**, previo a Sprints C/D/E y Subscription Platform |
| `ml_borrar/` | Misma clase de export, generado más recientemente (2 ago); incluye el prompt `Genera_ZIP_del_Proyecto_Excluye_lo_Innecesario.md` que describe el proceso | En `.gitignore`; activo, coexiste con el skill `cto-review` que en teoría lo reemplaza |
| `_CLAUDE_TMP_BORRAR/` | Residuos de sesiones previas: archivos `.tmpmoved`, locks de git muertos (`index.lock.*`, `HEAD.lock.*`), builds `.next_stale*` abandonados | **No está en `.gitignore`** — aparece como `??` en `git status` |
| `docs/strategy/` | Ver 1.1/1.3 | **Untracked, cero commits** |

---

## 2. Mapa conceptual de relaciones

```
                         ┌───────────────────────────┐
                         │   docs/book/ (Libro)       │  ← narrativa/cultura, sin
                         │   VISION_2030 · VISION.md   │    versión, no citado por nadie
                         │   PRODUCT_CANVAS · PRINCIP. │    más abajo en la cadena
                         └──────────────┬─────────────┘
                                        │ (debería alimentar, hoy no lo hace)
                                        ▼
        ┌───────────────────────────────────────────────────────┐
        │        PRODUCT_DECISION_FRAMEWORK.md (CFPS)             │ ← único marco de
        └──────────────────────────┬──────────────────────────────┘   decisión realmente
                                    │                                   usado en la práctica
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │   BACKLOG_PRODUCT.md  ←→  DECISION_LOG.md                │ ← HUB real del repo
        │   (qué se va a hacer)     (qué se hizo y cuándo)          │
        └───────┬───────────────────────────────┬─────────────────┘
                │                               │
                ▼                               ▼
        EPICS.md (fases grandes)        actas/*.md (narrativa de sesión)
                │
                ▼
        RFC-00N (engineering/rfc/)  ──→  ADR-00N  ──→  CF-1NN (issues)
                │                                          │
                ▼                                          ▼
        schema.sql (fuente de verdad de datos)      código real en api/ · web/

        (rama paralela, sin cruzarse con la de arriba)
        docs/architecture/RFC-002 (ficha+histórico) ── colisión de ID con
                                                          engineering/rfc/RFC-002 (CFM-ID)

        (rama paralela, aislada — nadie la referencia)
        docs/strategy/MASTER_DATA_STRATEGY.md
        docs/strategy/PHARMACY_NETWORK_STRATEGY.md

        (rama paralela — farmacias/canales, 5 copias no sincronizadas)
        CLAUDE.md (correcta) ≠ farmacias.md ≠ funcionalidades.md
                              ≠ price-channels.md ≠ pharmacy-apis.md
```

**Documentos "padre" reales** (de los que cuelgan otros): `PRODUCT_DECISION_FRAMEWORK.md` → `BACKLOG_PRODUCT.md` → `EPICS.md` → RFC → ADR → issues `CF-xxx`. Esta cadena funciona bien y es el único circuito de gobierno que hoy se sostiene solo.

**Documentos huérfanos/aislados** (nadie los referencia): `docs/strategy/MASTER_DATA_STRATEGY.md`, `docs/strategy/PHARMACY_NETWORK_STRATEGY.md`, `docs/product/KPIS.md`/`IDEAS.md`/`RELEASES.md`/`QUALITY.md`/`DATA_POLICY.md`/`BACKLOG_TECH.md` (vacíos), `docs/engineering/SEARCH_ENGINE.md` (vacío), gran parte de los capítulos sueltos del Libro (Acto III/IV) fuera de sus propios índices internos.

**Documentos que se citan a sí mismos como corrección de otro** (mecanismo sano, poco frecuente): `docs/release/SERVICE_ACCOUNT_MIGRATION.md` (se autocorrige), `docs/architecture/DOMAIN_MODEL.md` (señala errores en `normalization.md`/`farmacias.md`), `BACKLOG_PRODUCT.md` (señala que `PRODUCT_REVIEW_V1.md` estaba desactualizado).

---

## 3. Duplicidades detectadas y fuente única de verdad propuesta

| Clúster duplicado | Documentos involucrados | Fuente única de verdad propuesta |
|---|---|---|
| Visión / propósito / "qué NO somos" | Libro (Cláusula Cero, Constitución) + `VISION.md` + `PRODUCT_CANVAS.md` + `VISION_2030.md` | `VISION_2030.md` (más completo, único con metadata de versión) para visión estratégica; Libro Fundacional para registro narrativo/cultural (registro distinto, no reemplazable); **retirar o fusionar** `VISION.md` y `PRODUCT_CANVAS.md`, que no aportan nada que no esté ya en los otros dos |
| Marco de toma de decisiones | Libro "Cómo Tomar Decisiones" (7 preguntas) + `VISION_2030.md` "Cómo tomaremos decisiones" (5 preguntas) + `PRODUCT_DECISION_FRAMEWORK.md` (CFPS, el único con fórmula y uso real) | `PRODUCT_DECISION_FRAMEWORK.md` como único marco operativo; los otros dos deberían referenciarlo en vez de redefinir criterios propios |
| Principios de producto/cultura | Libro (Constitución, Credo, 12 Principios) + `PRODUCT_PRINCIPLES.md` | `PRODUCT_PRINCIPLES.md` para uso diario en decisiones de producto (ya se cita así en la práctica); Libro como registro de origen — falta una nota cruzada explícita en ambos sentidos |
| Farmacias / canales de precio | `CLAUDE.md` + `farmacias.md` + `pharmacy-apis.md` + `funcionalidades.md` + `price-channels.md` (5 copias) | `CLAUDE.md` es hoy la única correcta y completa (9 farmacias). Consolidar las otras 4 en un solo documento de integraciones, o retirarlas y dejar que todas apunten a `CLAUDE.md` |
| Numeración RFC-002 | `docs/architecture/RFC-002_MEDICATION_DETAIL_AND_PRICE_HISTORY.md` vs `docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` | Unificar en una sola secuencia numerada (`docs/engineering/rfc/`); renumerar el de `architecture/` |
| Estado de release / Play Store | `PLAY_CONSOLE_CHECKLIST.md` + `PRODUCTION_BLOCKERS_PLAN.md` + `RELEASE_READINESS_V1.md` (mismo snapshot vc30, nunca actualizado) | Un solo documento "vivo" de estado de release, actualizado por versión, en vez de 3 fotos fijas que nadie vuelve a tocar |
| Auditoría/prompt de auditoría | `docs/audits/AUDIT_SEARCH_NORMALIZATION.md` ↔ `.ai/prompts/claude/audit/CLAUDE-AUDIT-001...md`; `ER-002` ↔ `CLAUDE-AUDIT-002...md` | No son duplicados (prompt→resultado), pero deben separarse convencionalmente: prompts en un lugar reconocible (junto a `docs/prompt/claude/`), resultados solo en `docs/audits/`/`docs/engineering/reviews/` |
| Exportaciones para revisión externa | `audit-package/` (obsoleto) + `ml_borrar/` (activo) — mismo proceso, mismo prompt de origen | Definir un único proceso vigente (¿sigue haciendo falta si ya existe el skill `cto-review`?) — decisión de producto, no de esta auditoría |

---

## 4. Inconsistencias y contradicciones (no modificadas, solo reportadas)

1. `FEATURE_STATUS.md` (2026-06-29) marca Favoritos/Alertas/Cuenta como inexistentes y solo 4/9 farmacias — contradicho un día después por `PRODUCT_REVIEW_V1.md` y hoy por el código real.
2. `docs/normalization.md` describe `mergeDuplicates` como "más reciente por `fetchedAt`"; el código real compara `channels.effective` y se queda con el menor. Error de hecho confirmado por `docs/architecture/DOMAIN_MODEL.md`.
3. Nueve issues (`CF-101` a `CF-107`, `CF-109`, `CF-110`) dicen `Estado: Pendiente` pese a que el código correspondiente está implementado y en producción desde hace semanas (confirmado por `ADR-0001`, `ER-003`, `PM-001`). Solo `CF-108` fue cerrado correctamente.
4. `RFC-001` declara "Aprobado" en su metadata pero su propia Definición de Terminado (25 checkboxes) sigue 0% marcada — `ER-003` ya documentó esto explícitamente sin que se corrigiera.
5. `RFC-003` mantiene en su encabezado "Propuesto — pendiente de ratificación CFPS", pese a que `CF-112` a `CF-116` y `docs/database/schema.sql` confirman implementación completa desde el mismo día (2026-08-02). Nota: este informe no corrige ese encabezado por estar fuera del alcance de solo-lectura de esta auditoría.
6. Los 4 documentos de `docs/release/` describen la app en versionCode 30 / "Prueba Interna" / "NO PUBLICAR AÚN"; `CLAUDE.md` confirma que hoy está en versionCode 31 / "Prueba Cerrada". Ningún documento de esa carpeta registró la transición.
7. `docs/product/ROADMAP.md` y la tabla de fases de `docs/product/COMPANY_STRATEGY.md` no reflejan ninguno de los Sprints A–E ni la Epic Subscription Platform, todos ya mergeados a `main` según `DECISION_LOG.md`.
8. `.ai/prompts/claude/audit/.ai/context/SESSION_END_2026-06-29.md` afirma que CF-101–110 están "completado" — contradice el estado real (`Pendiente`) de 9 de esos mismos issues.
9. El skill `docs-steward` (diseñado exactamente para detectar y corregir el patrón de los puntos 3–5) no está versionado en git — es invisible para cualquiera que clone el repo desde cero, incluido el propio proceso de CI.

---

## 5. Vacíos documentales reales

Evaluados con criterio conservador — se indica solo lo que parece realmente necesario, no todo lo imaginable:

- **KPIs**: `KPIS.md` está vacío pese a que `ROADMAP.md` y `PRODUCT_CANVAS.md` mencionan "indicadores" como parte central de cada objetivo. Esto sí parece un vacío real: sin métricas definidas, es imposible verificar si el roadmap está funcionando.
- **Política de datos**: `DATA_POLICY.md` está vacío pese a que el proyecto maneja datos de salud y ya existe una política de privacidad pública (`privacy-policy.html`) sin ningún documento interno que la respalde (retención, uso de datos de búsqueda, base legal). Vacío real y de cierto riesgo dado el rubro.
- **Deuda técnica centralizada**: `BACKLOG_TECH.md` vacío; la deuda técnica real existe pero está dispersa (migración de `CACHE_PREFIX` mencionada en `comparafarma-software-factory.md`, fragilidad del scraper de Ahumada en `CLAUDE.md`, riesgo de timeout de Sermecoop). Vacío real — no hay un solo lugar que las liste todas.
- **Historial de versiones consolidado**: `RELEASES.md` vacío; la información vive fragmentada entre `CLAUDE.md` (versionCode actual) y `docs/release/*` (snapshots puntuales, desactualizados). Vacío real pero de prioridad baja.
- **Gobierno de Datos formal**: `docs/strategy/MASTER_DATA_STRATEGY.md` existe como borrador ambicioso pero no está ratificado, no está versionado, y no aterriza contra lo ya implementado (RFC-002/CFM-ID). No hace falta un documento nuevo — hace falta **cerrar el ciclo del que ya existe**.
- **Estrategia de IA**: no existe ningún documento que defina cómo se usa la IA en este proyecto más allá de la mención narrativa del Libro ("la IA amplifica, no reemplaza") y las personas de agente en `.claude/agents/`. Dado que el proyecto entero se construye mediante agentes de IA con roles definidos, esto podría considerarse un vacío real — pero se deja como pregunta abierta para el CEO, no como recomendación de crear un documento nuevo todavía.
- **`QUALITY.md` e `IDEAS.md` vacíos**: de menor entidad — `QUALITY.md` no tiene contraparte clara en otro documento (posible vacío real si se quiere un lugar formal para estándares de calidad de código/datos, algo hoy disperso entre `CLAUDE.md` y los skills); `IDEAS.md` ya tiene un sustituto funcional de facto en `BACKLOG_PRODUCT.md` (sección Sprint F) y `PRODUCT_CANVAS.md`, por lo que probablemente no haga falta poblarlo por separado.

No se identifican vacíos en: arquitectura de adquisición de datos (cubierta por `docs/pharmacy-apis.md` + `CLAUDE.md`, aunque desactualizada, no ausente), estrategia de integración de farmacias (existe como borrador en `PHARMACY_NETWORK_STRATEGY.md`, falta ratificarla, no crearla de cero), modelo comercial (cubierto por `SUBSCRIPTION_STRATEGY.md` + `COMPANY_STRATEGY.md`).

---

## 6. Evaluación de calidad

| Calificación | Documentos |
|---|---|
| **Excelente** | `BACKLOG_PRODUCT.md`, `DECISION_LOG.md`, `CLAUDE.md`, `docs/database/schema.sql`, `PM-001` (postmortem), `ADR-0001`, `ADR-0002`, RFC-002 (CFM-ID, `engineering/rfc/`), `.claude/agents/*.md` |
| **Buena** | `PRODUCT_DECISION_FRAMEWORK.md`, `SUBSCRIPTION_STRATEGY.md`, `EPICS.md`, `docs/actas/*`, `SERVICE_ACCOUNT_MIGRATION.md` (post-corrección), `pharmacy-flags.md`, `deployment.md`, RFC-003, CF-112 a CF-116, `docs-steward`/`cto-review`/`scraper-watchdog` (contenido bueno, penalizados solo por no estar versionados) |
| **Aceptable** | `VISION_2030.md`, `MASTER_DATA_STRATEGY.md`, `PHARMACY_NETWORK_STRATEGY.md` (buenas ideas, sin ratificar/versionar), `DOMAIN_MODEL.md`, Libro Fundacional (buena narrativa, sin gobierno formal), `PRODUCT_PRINCIPLES.md`, `RISKS.md`, `AUDIT_SEARCH_NORMALIZATION.md`, `ER-002`/`ER-003` |
| **Debe revisarse** | `VISION.md`, `PRODUCT_CANVAS.md` (redundantes), `ROADMAP.md`, `COMPANY_STRATEGY.md` (desactualizados), los 3 docs de `docs/release/` congelados en vc30, `farmacias.md`, `funcionalidades.md`, `price-channels.md`, `pharmacy-apis.md` (duplicados/incompletos), `normalization.md` (error de hecho), `docs/README.md`, `docs/product/README.md` (índices desactualizados), CF-101–107/109/110, RFC-001 (DoD sin cerrar), RFC-002 de `architecture/` (colisión + nunca actualizado) |
| **Obsoleta** | `FEATURE_STATUS.md`, `docs/engineering/SEARCH_ENGINE.md` (vacío/fantasma) |
| **Vacía / nunca poblada** | `KPIS.md`, `IDEAS.md`, `RELEASES.md`, `QUALITY.md`, `DATA_POLICY.md`, `BACKLOG_TECH.md` |

---

## 7. Estructura definitiva propuesta (no ejecutar todavía)

```
docs/
├── vision/                 ← Libro Fundacional (tal cual) + VISION_2030.md ratificado
│                              (única carpeta de "identidad", VISION.md y PRODUCT_CANVAS.md
│                               se retiran/fusionan acá)
├── product/                ← se mantiene, pero se puebla o se retira cada doc vacío
│                              explícitamente (ver Roadmap §9)
├── strategy/                ← se mantiene, pero se trackea en git y se ratifica cada doc
│                              antes de citarse como fuente en otro lado
├── architecture/             ← solo documentos "vivos" de referencia (DOMAIN_MODEL.md);
│                              ningún RFC nuevo se numera acá
├── engineering/
│   ├── adr/
│   ├── rfc/                  ← única secuencia numerada de RFCs de todo el repo
│   ├── issues/
│   ├── reviews/
│   └── postmortems/
├── integrations/ (NUEVA)     ← consolida farmacias.md + pharmacy-apis.md + price-channels.md
│                              + sección de farmacias de funcionalidades.md en un solo doc
│                              por farmacia, con CLAUDE.md como resumen ejecutivo que enlaza acá
├── release/                   ← se mantiene, pero como documento vivo por versión, no snapshots
├── operations/ (renombre)     ← deployment.md, monitoreo
├── actas/                     ← se mantiene tal cual
├── prompt/                    ← se mantiene; se suman acá los prompts de .ai/prompts/claude/audit/
│                              para que todos los "insumos" vivan en un solo lugar reconocible
├── audits/                    ← solo resultados, nunca prompts
├── governance/ (NUEVA)        ← este informe + la política de gobierno documental (§8) +
│                              futuros reportes de /docs-steward
└── privacy-policy.html        ← se mantiene en la raíz de docs/ (es el único doc legal público)
```

No se propone tocar `.claude/agents/` ni `.claude/skills/` de ubicación — solo corregir su versionado (ver §9).

---

## 8. Estrategia de Gobierno Documental (propuesta)

**Tipos de documento** (cada uno con ciclo de vida distinto):

1. **Fundacionales** (Libro, `VISION_2030.md`): rara vez cambian; requieren aprobación explícita del CEO para modificarse, con nota de versión obligatoria.
2. **Estratégicos** (`COMPANY_STRATEGY.md`, `SUBSCRIPTION_STRATEGY.md`, `docs/strategy/*`): revisión periódica (sugerido: cada epic cerrada), dueño = CEO.
3. **De decisión operativa** (`BACKLOG_PRODUCT.md`, `EPICS.md`, `DECISION_LOG.md`, RFCs, ADRs): se actualizan en cada sprint/merge; dueño = CTO (agente `comparafarma-cto`), enforcement = skill `docs-steward`.
4. **De referencia técnica** (`CLAUDE.md`, `docs/architecture/`, `docs/integrations/` propuesto, `schema.sql`): se actualizan junto con el código que describen, en el mismo PR cuando sea posible.
5. **Históricos/inmutables** (actas, postmortems, resultados de auditoría, prompts de sprint): nunca se editan después de cerrados — solo se referencian.
6. **Placeholders**: ningún documento vacío debería quedar así de forma silenciosa. Regla propuesta: un doc vacío debe decir explícitamente `Estado: No iniciado — ver <razón>`, no quedar en blanco sin explicación.

**Reglas para crear un documento nuevo:**
- Buscar primero si el tema ya tiene una fuente de verdad declarada (tabla de §3 de este informe como punto de partida).
- Todo documento nuevo debe llevar cabecera con `Versión`, `Estado`, `Última actualización` (siguiendo el único ejemplo bueno que ya existe: `VISION_2030.md`).
- Todo RFC nuevo se numera en `docs/engineering/rfc/` exclusivamente — ningún otro directorio emite RFCs.
- Todo documento que reemplace o reduzca el alcance de otro debe decirlo explícitamente en ambos (nota de "reemplaza a"/"reemplazado por").

**Reglas para deprecar:**
- Nunca se borra un documento con valor histórico (actas, postmortems, RFCs cerrados). Se marca `Estado: Obsoleto — reemplazado por X` y se deja en su lugar.
- Un documento vacío que se decide no completar se marca explícitamente `Estado: Descartado` en vez de quedar en blanco.

**Reglas de versionado:**
- Fecha de última actualización real (no solo la de creación) en todo documento estratégico/de decisión.
- Todo lo que hoy vive fuera de git (`docs/strategy/*`, 3 de 4 `.claude/skills/*`) debe entrar a control de versiones si se lo va a seguir citando como fuente — de lo contrario no es "documentación del repo", es una nota suelta.

**Mantenimiento de la fuente única de verdad:**
- Se adopta la tabla de §3 de este informe como el mapa vigente de "para el tema X, el documento canónico es Y" hasta que se decida lo contrario.
- El skill `docs-steward` (una vez versionado) es el mecanismo de enforcement: debe correrse en modo batch sobre issues, no solo caso por caso, para evitar que se repita el patrón CF-101–110.

---

## 9. Roadmap documental (priorizado)

**1. Consolidar (control de versiones y visibilidad — antes que nada más):**
- Trackear en git `docs/strategy/*` (3 archivos) y `.claude/skills/cto-review/`, `.claude/skills/docs-steward/`, `.claude/skills/scraper-watchdog/` (hoy excluidos por `.gitignore`).
- Decidir el destino de `_CLAUDE_TMP_BORRAR/` (visible en `git status`, no ignorado) — es cruft de sesiones previas, no documentación.

**2. Fusionar (eliminar duplicidad, sin perder contenido):**
- `VISION.md` + `PRODUCT_CANVAS.md` → retirar o fusionar contra `VISION_2030.md`.
- `farmacias.md` + `pharmacy-apis.md` + `funcionalidades.md` (sección farmacias) + `price-channels.md` → un solo documento de integraciones, con `CLAUDE.md` como resumen que enlaza ahí.
- Resolver la colisión de numeración `RFC-002` (renumerar el de `architecture/`).
- `PLAY_CONSOLE_CHECKLIST.md` + `PRODUCTION_BLOCKERS_PLAN.md` + `RELEASE_READINESS_V1.md` → un solo documento vivo de estado de release.

**3. Actualizar (corregir lo que ya existe, sin fusionar):**
- Cerrar formalmente los 9 issues `CF-101`–`110` que ya están implementados (correr `docs-steward` en modo batch).
- Actualizar `ROADMAP.md` y la tabla de fases de `COMPANY_STRATEGY.md` contra `BACKLOG_PRODUCT.md`/`DECISION_LOG.md`.
- Corregir el error de hecho en `normalization.md` (`mergeDuplicates`).
- Actualizar el encabezado de estado de `RFC-003` (implementado, no "propuesto").
- Actualizar `docs/release/*` a vc31/Prueba Cerrada.
- Actualizar `docs/README.md` y `docs/product/README.md` para que indexen todo lo que realmente existe.

**4. Eliminar/marcar explícitamente (nunca borrar sin decisión explícita del CEO):**
- `FEATURE_STATUS.md` → fusionar en `BACKLOG_PRODUCT.md` o marcar `Obsoleto — reemplazado por BACKLOG_PRODUCT.md`.
- `docs/engineering/SEARCH_ENGINE.md` (vacío) → poblar o marcar `Descartado`.
- `KPIS.md`, `IDEAS.md`, `RELEASES.md`, `QUALITY.md`, `DATA_POLICY.md`, `BACKLOG_TECH.md` → decidir uno por uno: ¿se puebla ahora o se marca explícitamente "no iniciado"?

**5. Recién entonces, crear documentación nueva** — y solo si, tras los 4 pasos anteriores, sigue pareciendo necesaria: la política de gobierno documental de este informe (§8) formalizada como documento propio en `docs/governance/`, y una eventual definición de gobierno de IA (hoy solo narrativa).

---

## Nota de alcance

Esta auditoría no tocó GitHub Issues/Projects nativos porque el repo no los usa — su función la cumplen los archivos `CF-xxx`. Tampoco se modificó, movió ni eliminó ningún documento existente: los pasos 2–5 del roadmap quedan pendientes de que el CEO decida cuáles ejecutar y en qué orden.
