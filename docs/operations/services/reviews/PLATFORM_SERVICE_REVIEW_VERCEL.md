# Revisión de Servicio — Vercel

**Código:** OPS-REV-005

**Nombre:** PLATFORM_SERVICE_REVIEW_VERCEL.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001`, `OPS-REV-002`, `OPS-REV-003` y `OPS-REV-004`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-004`)

**Documentos de los que depende:** `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fichas #1 y #2), `docs/operations/RUNBOOK.md`, `.github/workflows/ci.yml`, `api/vercel.json`, `mobile/src/constants/donation.ts`.

---

## 1. Uso actual

Vercel aloja los dos proyectos con salida a producción del monorepo:

- **`comparafarma-api`**: backend serverless (`api/`). Se despliega vía `.github/workflows/ci.yml`, job `deploy-api`, con `vercel deploy --prod` corriendo desde la raíz del monorepo (requisito documentado en `CLAUDE.md`/`RUNBOOK.md` tras el incidente PM-001). Hoy tiene **10 entrypoints reales** en `api/api/`: `alerts.ts`, `branches.ts`, `config.ts`, `donate.ts`, `feedback.ts`, `go.ts`, `health.ts`, `price-history.ts`, `search.ts`, `subscriptions.ts` — confirmado listando el directorio en esta revisión.
- **`comparafarma-web`**: frontend Next.js 16 App Router (`web/`). Se despliega automáticamente por la integración Git nativa de Vercel al detectar push a la rama conectada — **no pasa por `ci.yml`** (el job `web-build` solo corre `typecheck` + `build` en paralelo, es informativo, no bloquea el deploy real).

Ambos comparten el mismo mecanismo de hosting/CDN/DNS de Vercel, pero son proyectos separados con variables de entorno independientes (`RUNBOOK.md` §7: "por proyecto: `comparafarma-api` y `comparafarma-web`, por separado").

## 2. Inventario

| Dato | `comparafarma-api` | `comparafarma-web` |
|---|---|---|
| URL producción | `https://comparafarma-api.vercel.app` | `https://app-compara-farma-web.vercel.app` |
| Project ID | `prj_zvHG2urEOjMM770FPy6B2fdhk915` (confirmado, `ci.yml`) | No verificable en el repo (no hay `vercel.json` en `web/`, el deploy no pasa por `ci.yml`) |
| Team/Org ID | `team_QtbvbI6hTSxxSJ9qDFTv9z6S` (confirmado, `ci.yml`) | No verificable directamente — se asume el mismo team por ser una operación de una sola persona (Audit ficha #10), sin evidencia de un segundo team en el repo |
| Región de ejecución | `iad1` (default, sin config explícita de multi-región) | `iad1` (default) |
| Config explícita | `api/vercel.json`: `"functions": {"api/*.ts": {"maxDuration": 30}}` — glob obligatorio desde PM-001 para evitar que Vercel trate cada `.ts` de `api/src/` como función propia | Ninguna — no existe `web/vercel.json`, Next.js se autoconfigura |

## 3. Plan contratado

- **`comparafarma-api`: Hobby, confirmado.** La evidencia no es una consulta al dashboard sino un error real de producción documentado en `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md` y en el Audit original — el mensaje de error de Vercel al superar el límite de funciones por deployment identifica explícitamente el plan Hobby.
- **`comparafarma-web`: no verificable directamente en esta sesión** (sin acceso al Dashboard de Vercel). No hay evidencia en el repo de que se haya contratado un plan Pro para este proyecto — se asume Hobby por defecto hasta confirmación directa en el Dashboard, dado que toda la infraestructura del proyecto es operada por una sola persona sin indicios de gasto adicional documentado en `docs/operations/environment/ENVIRONMENT.md` ni en ningún otro archivo revisado.

## 4. Límites del plan

Investigado hoy directamente en `vercel.com/docs/plans/hobby`, `vercel.com/docs/limits`, `vercel.com/docs/limits/fair-use-guidelines` y `vercel.com/docs/functions/runtimes` (fuente oficial, reemplaza las cifras de terceros citadas en la Auditoría original):

| Recurso | Límite Hobby (oficial, verificado 2026-08-14) |
|---|---|
| Function Invocations | 1.000.000 / mes |
| Active CPU | 4 CPU-horas / mes |
| Provisioned Memory | 360 GB-horas / mes |
| Fast Data Transfer (bandwidth) | 100 GB / mes |
| Edge Requests | 1.000.000 / mes |
| **Funciones creadas por deployment (sin framework, caso de `api/`)** | **12** — confirmado textualmente: *"For Hobby, this approach is limited to 12 Vercel Functions per deployment"* (`vercel.com/docs/functions/runtimes`) |
| Duración máxima de función | 300s (5 min) — `api/vercel.json` usa 30s |
| Proyectos | 200 |
| Deployments por día | 100 |
| Build máximo | 45 min |
| Dominios por proyecto | 50 |
| Retención de Runtime Logs | 1 hora |
| Concurrent Deployments (builds) | 1 |

Con 10 de 10 entrypoints reales listados hoy en `api/api/`, `comparafarma-api` está en **10/12** — igual al hallazgo original de la Auditoría, sin cambios.

### Hallazgo nuevo — restricción de uso comercial (no identificado en la Auditoría original)

`vercel.com/docs/limits/fair-use-guidelines`, sección "Commercial usage" (actualizada 2026-07-29), establece textualmente:

> "**Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan.**"

Y define explícitamente qué cuenta como uso comercial, incluyendo un ejemplo textual que aplica de forma directa a ComparaFarma:

> "Examples of this include, but are not limited to, the following: [...] Any method of requesting or processing payment from visitors of the site [...] **Asking for Donations fall under commercial usage.**"

`mobile/src/constants/donation.ts` confirma que ComparaFarma tiene un `DonationBanner` en producción con botones de monto fijo ($1.000/$3.000/$5.000/Otro) que abren directamente links de pago de Khipu (`khipu.com/payment/process/...`). Esto no es un caso límite de interpretación — es exactamente el ejemplo que Vercel usa para definir "uso comercial" en su propia documentación. La app además está publicada en Google Play en producción bajo categoría Health & Fitness, no es un proyecto personal.

Esta sección de límites/fair-use-guidelines no formaba parte de la investigación de la Auditoría original (que se centró en el límite técnico de 12 funciones); es un hallazgo nuevo de esta revisión.

## 5. Riesgos

1. **🔴 Crítico — uso comercial activo en un plan que lo prohíbe explícitamente (hallazgo nuevo de esta revisión).** Ambos proyectos (`comparafarma-api` y `comparafarma-web`, si comparten team, lo cual es lo más probable) estarían operando en violación directa y verificable de los términos de uso de Vercel para el plan Hobby, hoy, en producción — no es un límite de recursos que se acerca gradualmente, es una condición contractual ya incumplida. El texto de Vercel no deja ambigüedad de interpretación (cita textual arriba). El riesgo real no es técnico sino de **pausa o suspensión de cuenta sin garantía de aviso previo** — y como ambos proyectos viven bajo la misma cuenta/team, una acción de Vercel afectaría potencialmente **api y web al mismo tiempo**, es decir, el 100% de la búsqueda de medicamentos de ComparaFarma quedaría inoperativa sin que exista ningún fix de código posible — solo una migración de plan (pagada) o de proveedor.
2. **🟡 Medio — límite de 12 funciones serverless en `comparafarma-api` (heredado de la Auditoría, reconfirmado hoy sin cambios).** 10/12 entrypoints reales. Cualquier archivo nuevo en `api/api/` sin consolidar dentro del patrón `action=` ya usado en `alerts.ts`/`subscriptions.ts` deja solo 2 espacios antes de romper el deploy completo (no un fallo parcial — el deployment entero falla).
3. **🟡 Medio — deploy de `web/` sin gate bloqueante real (heredado, reconfirmado hoy sin cambios).** El job `web-build` de `ci.yml` corre `typecheck` + `build` de `web/` en paralelo a `deploy-api`, pero no bloquea ni se relaciona con el deploy real de `web/` (que Vercel dispara automáticamente por su integración Git nativa). Un `typecheck` roto en `web/` no impide que Vercel publique igual.
4. **🟢 Bajo — concentración en cuenta/persona única.** Ya cubierto de forma transversal en la Auditoría general (ficha #10, no exclusivo de Vercel) — sin evidencia de un segundo administrador con acceso operativo.

## 6. Consumo actual

**No verificable directamente en esta sesión** — no hay acceso al Dashboard de Vercel de ninguno de los dos proyectos. Los únicos datos medibles desde el repo son estáticos: 10/12 entrypoints en `api/api/`, `maxDuration: 30` configurado, sin evidencia de multi-región ni de un volumen de tráfico real. Recomendado como acción de seguimiento (fuera de esta revisión): revisar directamente en el Dashboard de Vercel las métricas de Active CPU, Function Invocations y Fast Data Transfer del mes en curso para ambos proyectos, para dimensionar qué tan cerca están los límites de recursos del Hobby (distinto del hallazgo de uso comercial, que no depende del volumen).

## 7. Escalabilidad

El hallazgo de uso comercial (§5.1) es independiente del volumen de usuarios — ya aplica hoy, a cualquier escala. Los límites de recursos sí escalan con el crecimiento:

- **100–1.000 usuarios:** volumen de búsquedas bajo; poco probable que se acerque a 1M invocaciones/mes o 100GB de bandwidth. El límite de 12 funciones (10/12 hoy) es el más cercano a romperse, pero por cambios de código, no por tráfico.
- **5.000+ usuarios:** con múltiples búsquedas por usuario y notificaciones de precio corriendo por cron (`check-price-alerts.yml` invocando `/api/alerts`), Fast Data Transfer y Function Invocations podrían acercarse a los topes de Hobby (100GB / 1M respectivamente) antes de llegar a ese volumen, dependiendo del tamaño de respuesta por búsqueda — no hay datos reales de consumo actual para proyectar con precisión (ver §6).

En cualquier escenario de crecimiento real, el hallazgo de uso comercial (§5.1) se vuelve más visible y más urgente de resolver antes de cualquier campaña de adquisición de usuarios — más tráfico hacia una app que solicita donaciones aumenta la probabilidad de que Vercel lo detecte.

## 8. Alternativas

Existen dos caminos mutuamente excluyentes para resolver el hallazgo de uso comercial (§5.1) — es una decisión de producto/negocio, no técnica, y sigue **pendiente de decisión del CTO** a la fecha de este documento:

- **Opción A — Actualizar el team a Pro ($20/mes por developer seat, un solo operador hoy).** Resuelve simultáneamente el hallazgo crítico de uso comercial (§5.1) y el límite de 12 funciones (§5.2, Pro no tiene ese límite) en un solo cambio. Cubre ambos proyectos si comparten team, sin necesidad de contratar dos planes separados. Mantiene el `DonationBanner` y cualquier funcionalidad de pago futura sin restricciones.
- **Opción B — Dar de baja las funcionalidades de pago/donación (`DonationBanner`, links Khipu en `mobile/src/constants/donation.ts`) y permanecer en Hobby.** Elimina la causal de uso comercial más directa y verificable (la cita textual de Vercel usa "Asking for Donations" como ejemplo explícito) sin costo adicional. **Ojo:** esto resuelve el hallazgo de donaciones, pero no resuelve por sí solo el uso comercial en un sentido más amplio si en el futuro se activa Flow (`OPS-SVC-BKL-010`, pagos recurrentes/suscripciones premium, hoy no operativo en producción) — activar Flow mientras se está en Hobby reabriría el mismo incumplimiento por otra vía ("Any method of requesting or processing payment from visitors of the site"). Requiere además remover el componente de la UI de `mobile/` (no solo dejar de promocionarlo) y coordinar con el flujo de asignación de issue del owner si ya se documentó en otro lado como funcionalidad activa.
- **Contactar soporte de Vercel para consultar una excepción.** No se considera una alternativa real — el texto oficial lista "Asking for Donations" como ejemplo explícito de uso comercial, sin espacio para interpretación; consultarlo no cambiaría el resultado, solo tomaría tiempo.
- **Migrar a otro proveedor de hosting serverless (Netlify, Railway, Render, Cloudflare).** No evaluado en profundidad en esta revisión — sería un cambio de infraestructura mayor, sin urgencia distinta a la de resolver el incumplimiento de términos de uso actual, que se resuelve más rápido y a menor riesgo con cualquiera de las dos opciones anteriores.

## 9. Costos

- **Hoy:** $0/mes (Hobby, ambos proyectos).
- **Opción A (upgrade a Pro):** $20/mes por developer seat (1 seat cubre la operación actual) + $20 de crédito de uso incluido/mes, aplicable a ambos proyectos bajo el mismo team. Dado el volumen actual (bajo, sin datos que sugieran consumo cercano a los topes de Hobby), el gasto adicional real sobre el crédito incluido sería mínimo — el costo dominante sería el seat fee de $20/mes.
- **Opción B (dar de baja donaciones, permanecer en Hobby):** $0/mes — sin costo de infraestructura, pero implica renunciar al ingreso por donaciones que hoy recibe ComparaFarma vía Khipu (monto no cuantificado en esta revisión, no hay datos de cuánto se ha recaudado).

## 10. Recomendación del CTO

🔴 **Cambiar con urgencia.** A diferencia de los hallazgos anteriores de este backlog (límites técnicos que se acercan gradualmente), este es un incumplimiento activo y ya vigente de los términos de uso de Vercel — la app solicita donaciones (evidencia directa en `mobile/src/constants/donation.ts` y ya validada en producción en esta misma sesión, ticket de Resend/alertas) mientras corre en un plan que Vercel define, con ese ejemplo textual exacto, como no permitido. El riesgo no es una degradación progresiva sino la posibilidad de una pausa de cuenta sin aviso garantizado, que tumbaría `comparafarma-api` y `comparafarma-web` al mismo tiempo — sin ningún fix de código disponible.

**Actualización (2026-08-15, sprint de cierre operacional):** el CTO definió la dirección de producto — ComparaFarma tiene intención comercial y Premium está en desarrollo (motor de suscripciones ya implementado en código, `flowAdapter.ts`/`subscriptionService.ts`, pausado a la espera de esta decisión de plataforma). Con eso, **Hobby pasa a documentarse como una situación transitoria**, no como una alternativa permanente al `DonationBanner`: la Opción B (dar de baja donaciones para permanecer en Hobby) ya no es la dirección elegida, porque no resolvería el mismo incumplimiento en el momento en que Premium se active (activar cobros de cualquier tipo en Hobby reabre la misma cláusula de "uso comercial", con o sin `DonationBanner`). La dirección fijada es:

- **Antes de operar Premium comercialmente, migrar `comparafarma-api`/`comparafarma-web` a Vercel Pro.** Esto no se ejecuta desde esta revisión — es un cambio de plan pagado en el Dashboard de Vercel, y por disciplina de esta revisión ningún cambio de plan se ejecuta sin acción directa del CTO.
- El `DonationBanner` **no se elimina** como parte de esta decisión — ver `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` (`POLICY_REVIEW_REQUIRED`) para el análisis de si el aporte voluntario actual, sin ninguna contraprestación digital, calza en alguna excepción de uso no-comercial o si de todos modos requiere Pro por el patrón textual de "Asking for Donations" de Vercel — en cualquier caso, la migración a Pro resuelve ambos ángulos a la vez.

Registrado formalmente: `HUMAN_ACTION_REQUIRED: UPGRADE_VERCEL_PRO` — ver procedimiento en `docs/operations/PLATFORM_OPERATIONAL_STATUS.md`, sección "Acciones humanas".

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de las fichas #1-#2, sigue vigente para el resto de su contenido) ni a `PLATFORM_SERVICE_CATALOG.md` (clasificación Media de Vercel, sin cambios — aunque el hallazgo de esta revisión sugiere que esa clasificación de criticidad debería reevaluarse en una sesión de gobierno separada, no aquí). Es la quinta revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Límites Hobby (invocations, bandwidth, funciones/deployment) | `vercel.com/docs/plans/hobby`, `vercel.com/docs/limits`, `vercel.com/docs/functions/runtimes` (verificado 2026-08-14) | ✔ (§4) | Reemplaza cifras de terceros de la Auditoría original |
| Restricción de uso comercial y ejemplo de donaciones | `vercel.com/docs/limits/fair-use-guidelines` (verificado 2026-08-14) | ✔ (§4, §5.1) | Hallazgo nuevo, no estaba en la Auditoría ni en el Catálogo |
| Evidencia de solicitud de donaciones en producción | `mobile/src/constants/donation.ts` | ✔ (§5.1) | Confirmado hoy, links Khipu activos |
| Conteo de entrypoints reales (`api/api/`) | Listado directo del directorio, 2026-08-14 | ✔ (§1, §4) | 10/12, igual al hallazgo original de la Auditoría |
| Plan Hobby confirmado en `comparafarma-api` | `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md` | Heredado, sin cambios | Evidencia de error real de producción, no de dashboard |
| Gate de CI vs deploy de `web/` | `.github/workflows/ci.yml` (job `web-build`) | Heredado, reconfirmado (§5.3) | Sin cambios desde la Auditoría |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`, `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la quinta revisión individual de servicio del backlog `OPS-BKL-001` — Vercel (`comparafarma-api` + `comparafarma-web`). Hallazgo nuevo: uso comercial (donaciones) activo en un plan Hobby que lo prohíbe explícitamente, no identificado en la Auditoría original. Ningún código modificado; ningún plan cambiado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `RUNBOOK.md`, `vercel.com/docs` (oficial), `mobile/src/constants/donation.ts` |
| 1.1 | 2026-08-15 | Activo | Pendiente (CTO) | Sprint de cierre operacional: el CTO fijó dirección de producto (intención comercial confirmada, Premium en desarrollo) — Hobby se documenta como transitorio, se recomienda formalmente `HUMAN_ACTION_REQUIRED: UPGRADE_VERCEL_PRO` antes de operar Premium, y se retira la Opción B (dar de baja donaciones para permanecer en Hobby) como alternativa vigente. `DonationBanner` no se modifica desde esta revisión. Ningún código ni plan cambiado. | `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de Vercel — quinto ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_VERCEL.md` v1.0 (este documento) |
| 2026-08-15 | Sprint de cierre operacional — CTO fija dirección de producto (Pro antes de Premium) | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_VERCEL.md` v1.1 |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado. La acción recomendada (upgrade a Pro) requiere una decisión de pago del CTO, fuera del alcance de ejecución de esta revisión.
