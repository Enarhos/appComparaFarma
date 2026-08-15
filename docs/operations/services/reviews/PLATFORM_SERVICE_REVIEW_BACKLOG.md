# Backlog de Revisión de Servicios Externos

**Código:** OPS-BKL-001

**Nombre:** PLATFORM_SERVICE_REVIEW_BACKLOG.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo ya usado por `docs/operations/PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001) y reconocido en `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` §3.1.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Backlog Operacional

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`, `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md`

> **Trazabilidad (2026-08-15):** con los 12 ítems Media/Baja cerrados y el sprint de cierre operacional completo, `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` (OPS-STATUS-001) es ahora el resumen ejecutivo consolidado de todo este backlog — punto de entrada recomendado antes de leer las revisiones individuales de abajo.

---

## 1. Propósito

Este documento es el backlog maestro desde el cual se revisará, uno por uno, cada servicio externo utilizado por ComparaFarma. Su única función es registrar qué servicios existen como trabajo pendiente de revisión — no evalúa, no prioriza más allá de una clasificación heredada, no recomienda ni resuelve nada todavía.

## 2. Alcance

**Este documento define:** el inventario de servicios pendientes de revisión individual, cada uno como un ítem de backlog independiente con su estado.

**Este documento NO define:** el análisis de cada servicio (eso ocurre cuando se tome cada ítem, en un documento propio de esa revisión), límites de plan, riesgos, ni recomendaciones — nada de eso se investiga ni se escribe aquí. No reemplaza a `PLATFORM_SERVICE_CATALOG.md` (inventario de qué compone la plataforma) ni a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (evaluación y riesgos ya realizados).

## 3. Verificación previa

Se confirmó, antes de crear este documento, que no existe un backlog equivalente: `docs/program/MASTER_BACKLOG.md` (backlog de programa, por épica/workstream, no por servicio de infraestructura), `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` (backlog funcional de producto) y `docs/product/BACKLOG_TECH.md` (estaba vacío — 0 bytes — y fue eliminado en la limpieza de gobierno documental de 2026-08-15) no cubren la revisión de servicios externos. `PRODUCTION_INFRASTRUCTURE_AUDIT.md` tiene un "Roadmap de Infraestructura" con pendientes ya identificados, pero es una sección de un Documento de Ejecución fechado, no un backlog con ciclo de vida propio — no se duplica aquí, se referencia por servicio en la columna "Documento fuente".

## 4. Backlog de servicios

Criticidad alineada a la clasificación ya validada en `PLATFORM_SERVICE_CATALOG.md` §6 (única fuente de verdad de criticidad) — no se investigó ni se recalculó nada nuevo para este documento.

| ID | Servicio | Función en ComparaFarma | Criticidad | Estado | Documento fuente | Observaciones |
|---|---|---|---|---|---|---|
| OPS-SVC-BKL-001 | Supabase | Postgres + Auth (historial de precios, config, feedback, suscripciones, login/registro) | Crítica | Cerrado (2026-08-13) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #3; `PLATFORM_SERVICE_REVIEW_SUPABASE.md` (OPS-REV-001) | Resultado: 🟢 Mantener proveedor/plan Free. La acción de configuración (SMTP propio para Auth vía Resend, dominio `lospanalesdeamelia.cl` verificado — interino, pendiente de reemplazo por el dominio definitivo del proyecto) ya fue ejecutada y validada en producción el 2026-08-14: registro, confirmación y recuperación de contraseña probados de punta a punta en Web, límite de envío subido de 2 a 30 emails/hora, riesgo crítico original ya no está activo. Hallazgo aparte (no bloqueante para este cierre): Mobile tiene un bug ya trackeado de manejo de deep link que impide completar la recuperación de contraseña ahí — no es un problema de SMTP/Supabase, sigue abierto en las tareas de validación del proyecto. |
| OPS-SVC-BKL-002 | Resend | Email transaccional (alertas de precio, feedback) | Crítica | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #7; `PLATFORM_SERVICE_REVIEW_RESEND.md` (OPS-REV-002) | Resultado: 🟢 Mantener proveedor/plan Free. La acción recomendada (apuntar `email.ts`/`feedback.ts` al dominio verificado `lospanalesdeamelia.cl` en vez del sandbox) ya fue ejecutada y validada en producción el 2026-08-14 — alerta de precio real creada, confirmada y con email entregado de punta a punta. En el camino se encontró y corrigió un segundo hallazgo no anticipado: la `RESEND_API_KEY` configurada en Vercel desde mayo correspondía a una key ya inexistente en la cuenta de Resend (0 keys antiguas, solo la creada hoy) — Resend rechazaba todo envío con 403 Forbidden, entrega rota independientemente del dominio usado. Se creó una key nueva dedicada (`api-alerts-feedback`, permiso Sending access, todos los dominios) y se actualizó en Vercel. También se detectó y corrigió, de forma incidental, que el commit `feat(web): punto de entrada visible a Cuenta desde Home` nunca se había fusionado a `main` (mismo patrón que el bug de recuperación de Mobile) — ya desplegado. |
| OPS-SVC-BKL-003 | Algolia | Motor de búsqueda del catálogo de Salcobrand (credenciales no propias) | Media | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #6; `PLATFORM_SERVICE_REVIEW_ALGOLIA.md` (OPS-REV-004) | Resultado: 🟢 Mantener sin cambios. No es cuenta propia de ComparaFarma (credenciales de storefront de Salcobrand) — sin plan, costo ni dashboard propios que revisar. Único riesgo real (rotación de credenciales sin aviso) ya mitigado por aislamiento de fallo + monitoreo horario existentes. Sin acción ejecutable nueva. |
| OPS-SVC-BKL-004 | Vercel | Hosting serverless de `comparafarma-api` y `comparafarma-web` | Media | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit fichas #1-#2; `PLATFORM_SERVICE_REVIEW_VERCEL.md` (OPS-REV-005) | Resultado: 🔴 Cambiar con urgencia — hallazgo nuevo no visto en la Auditoría original: el plan Hobby prohíbe explícitamente uso comercial y lista "Asking for Donations" como ejemplo textual (`vercel.com/docs/limits/fair-use-guidelines`), y ComparaFarma ya solicita donaciones activas vía Khipu en producción (`mobile/src/constants/donation.ts`) — incumplimiento de términos vigente hoy, con riesgo de pausa de cuenta sin aviso que afectaría `api` y `web` a la vez. Acción recomendada (upgrade del team a Pro, $20/mes) requiere decisión de pago del CTO, no ejecutable desde esta revisión. Límite de 12 funciones serverless en `comparafarma-api` reconfirmado (10/12 hoy), sin cambios; gate de CI faltante para el deploy de `web/` también reconfirmado, sin cambios.
| OPS-SVC-BKL-005 | GitHub | Repositorio, fuente de verdad de código, GitHub Pages | Media | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #10; `PLATFORM_SERVICE_REVIEW_GITHUB.md` (OPS-REV-006) | Revisado junto a GitHub Actions (fila siguiente), mismo documento. Resultado: 🟡 Mantener, sin acción técnica urgente. Confirmado hoy que el repo es público (resuelve a favor la duda de minutos de Actions de la Auditoría original). Hallazgo nuevo: al ser público, el código de scraping/negocio (9 farmacias) queda expuesto — decisión de producto/seguridad pendiente del CTO (mantener público vs. privatizar), no ejecutada. |
| OPS-SVC-BKL-006 | GitHub Actions | CI/CD, monitoreo, crons (deploy, `monitor-api.yml`, `check-price-alerts.yml`, `update-branches.yml`) | Media | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #10; `PLATFORM_SERVICE_REVIEW_GITHUB.md` (OPS-REV-006) | Mismo documento que GitHub (fila anterior). Confirmado oficialmente que Actions es gratis e ilimitado en repos públicos (`docs.github.com`) — sin riesgo de cuota, a diferencia de lo que dejaba abierto la Auditoría original. |
| OPS-SVC-BKL-007 | Expo | Framework/build de `mobile/` | Alta | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #11; `PLATFORM_SERVICE_REVIEW_EXPO_EAS.md` (OPS-REV-003) | Revisado junto a EAS (fila siguiente), mismo documento. Resultado: 🟡 Mantener plan Free con vigilancia del MAU de OTA (1/1.000 real hoy). |
| OPS-SVC-BKL-008 | EAS | Build cloud + canal OTA de `mobile/` | Alta | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #11; `PLATFORM_SERVICE_REVIEW_EXPO_EAS.md` (OPS-REV-003) | Límite de 1.000 MAU para OTA confirmado oficialmente (`expo.dev/pricing`) — sigue siendo el umbral más bajo del inventario. Sin acción inmediata; recomendación es presupuestar upgrade (Starter/Production) antes de escalar usuarios, no reactivamente. Sin cambios de código. |
| OPS-SVC-BKL-009 | Redis (Upstash) | Caché de búsqueda + rate limiting distribuido | Baja | Cerrado (2026-08-15) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #4 | 🟢 `PLATFORM_SERVICE_REVIEW_UPSTASH.md` (OPS-REV-012) |
| OPS-SVC-BKL-010 | Flow | Pagos recurrentes (suscripciones premium, no activo hoy) | Media | Pausado (2026-08-14, decisión CTO) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #8 | Confirmado con el CTO: el pago de suscripción aún no se activa — coincide con la evidencia de la Auditoría (sin credenciales en Vercel). No se revisa hasta que se decida activarlo; no confundir con "Cerrado" (no hubo revisión ni recomendación, solo se pausó a pedido explícito). |
| OPS-SVC-BKL-011 | Google Play Console | Distribución de `mobile/` + Billing (RTDN) | Media | Cerrado (2026-08-15) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #9; `PLATFORM_SERVICE_REVIEW_GOOGLE_PLAY.md` (OPS-REV-008) | Resultado: 🔴 Cambiar con urgencia — hallazgo nuevo, mismo patrón que el de Vercel (`OPS-REV-005`): la Política de Pagos de Google Play (`support.google.com/googleplay/android-developer/answer/9858738`) prohíbe llevar usuarios a un método de pago externo vía botones/links dentro de la app, con excepción solo de "tax exempt donations" — el `DonationBanner` de Mobile abre un link externo de Khipu con un botón, y no hay evidencia de que ComparaFarma tenga estatus de exención tributaria. Riesgo de remoción/suspensión de la cuenta de desarrollador (personal, recién aprobada para producción el 2026-08-13). Decisión pendiente del CTO (a resolver junto con la de Vercel): confirmar estatus de exención, migrar a Google Play Billing, o quitar el banner de Mobile. No ejecutado en esta revisión. |
| OPS-SVC-BKL-012 | Sentry | Reporte de excepciones (api + mobile) | Baja | Cerrado (2026-08-15) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #5; `PLATFORM_SERVICE_REVIEW_SENTRY.md` (OPS-REV-009) | Resultado: 🟢 Mantener sin cambios. Confirmado oficialmente el límite de 5.000 errores/mes del plan Developer/Free (coincide exacto con la cifra de terceros de la Auditoría original) y que ese plan permite solo 1 usuario (hallazgo menor, sin impacto hoy). No-op explícito si falta el DSN — nunca bloquea funcionalidad. Sin acción ejecutable. |
| OPS-SVC-BKL-013 | PostHog | Analítica de producto (mobile) | Baja | Cerrado (2026-08-15) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #12; `PLATFORM_SERVICE_REVIEW_POSTHOG.md` (OPS-REV-010) | Resultado: 🟢 Mantener sin cambios. Confirmado oficialmente el límite de 1.000.000 eventos/mes del plan Free (coincide exacto con la cifra de terceros de la Auditoría original), sin límite de usuarios del equipo (a diferencia de Sentry). Margen amplio para el volumen actual. Cabo suelto menor, no investigado: un error de PostHog visto en Mobile durante otra validación de esta sesión. Sin acción ejecutable urgente. |
| OPS-SVC-BKL-014 | Khipu | Pagos de donaciones (`/api/donate`) | Baja | Cerrado (2026-08-15) | `PLATFORM_SERVICE_CATALOG.md` §4; SERVICE_ACCOUNT_MIGRATION §8 | 🔴 `PLATFORM_SERVICE_REVIEW_KHIPU.md` (OPS-REV-011) |
| OPS-SVC-BKL-015 | MINSAL | Datos públicos de sucursales por comuna | Media | Cerrado (2026-08-14) | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #13; `PLATFORM_SERVICE_REVIEW_MINSAL.md` (OPS-REV-007) | Resultado: 🟠 Evaluar en el corto plazo (bajó de 🔴). Causa raíz confirmada en vivo en la pestaña Actions: las 71/71 ejecuciones de `update-branches.yml` desde su creación (2026-06-03) fallan con `MINSAL HTTP 403` — bloquea también IPs de GitHub Actions, no solo Vercel. El filtro de comuna en Mobile sirve, desde el día uno, solo una carga manual congelada de junio. Ejecutado y validado en producción: se subió la versión mejorada del workflow (alerta de fallo por issue, antes solo existía local, sin fusionar — mismo patrón corregido 5 veces ya en esta sesión), commit `2d5691f` verificado contra `origin/main`. Pendiente de decisión del CTO: cómo evitar el bloqueo de IP de MINSAL (IP residencial/self-hosted) o aceptar el dato desactualizado — el fetch en sí seguirá fallando hasta que se resuelva eso. |
| OPS-SVC-BKL-016 | 9 farmacias (Cruz Verde, Ahumada, Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma) | Fuente de datos de precios — núcleo del producto | Alta | Pendiente | `PLATFORM_SERVICE_CATALOG.md` §4; Audit ficha #14 | Criticidad Alta por Ahumada/Sermecoop (scraping frágil); Media para el resto — ver Catálogo |

16 servicios registrados.

## 5. Relaciones

Este backlog no reemplaza a `PLATFORM_SERVICE_CATALOG.md` (qué compone la plataforma) ni a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (riesgos y evaluación ya realizados) — se apoya en ambos como fuente de cada campo registrado. Es consumido por: ninguno todavía — es su primera versión; cuando se revise el primer ítem, ese análisis vivirá en un documento propio (no en este backlog), que este documento deberá referenciar al actualizar el `Estado` de ese ítem.

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Inventario de servicios y su función | `docs/operations/PLATFORM_SERVICE_CATALOG.md` | ✔ (registrado como ítem de backlog) | No se repite evidencia de código |
| Clasificación de criticidad | `docs/operations/PLATFORM_SERVICE_CATALOG.md` §6 | ✔ (heredada sin recalcular) | Única fuente de verdad de criticidad |
| Evidencia y riesgos por servicio | `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` | — (solo referenciado) | Este backlog no repite hallazgos |
| Propiedad de cuenta | `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md` | — (solo referenciado para Khipu) | No se repite el paso a paso de migración |

## 7. Gobierno

Este documento no reemplaza a `PLATFORM_SERVICE_CATALOG.md`, `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ni `RUNBOOK.md`. Ante una discrepancia entre este backlog y cualquiera de esas fuentes sobre un dato de un servicio (función, criticidad), prevalece la fuente — este backlog debe corregirse para reflejarla. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que `PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001).

Cada ítem de este backlog cambia de `Estado` (Pendiente → En revisión → Resuelto/Cerrado) cuando se ejecute su análisis correspondiente, en un documento o sprint propio de esa revisión — este backlog no absorbe ese contenido, solo referencia dónde vive una vez que exista.

## 8. Documentos relacionados

`docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`, `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`, `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md`.

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-13 | Activo | Pendiente (CTO) | Creación del backlog — 16 servicios externos registrados como ítems independientes, todos en Estado Pendiente. Ningún servicio analizado todavía. | `PLATFORM_SERVICE_CATALOG.md`, `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `RUNBOOK.md`, `SERVICE_ACCOUNT_MIGRATION.md` |

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-13 | Creación del backlog de revisión de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
