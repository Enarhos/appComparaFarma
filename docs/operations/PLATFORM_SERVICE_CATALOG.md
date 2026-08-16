# Catálogo de Servicios de la Plataforma

**Código:** OPS-SVC-001

**Nombre:** PLATFORM_SERVICE_CATALOG.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), igual que Launch (`LNC-PRR-001`), Program y Design. Operations no está en la lista de dominios de adopción obligatoria de GOV-TPL-001, pero este documento cumple el criterio que la propia plantilla usa para decidir cuándo adoptarla igual: *"si el documento pretende ser una fuente de verdad estratégica que otras personas del equipo consultarán de forma recurrente, debe seguir esta plantilla"* (GOV-TPL-001, "Aplicación de esta plantilla").

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De referencia técnica

**Clasificación:** Documento Gobernado / Catálogo de Infraestructura

**Documentos de los que depende:** `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`, `docs/operations/environment/ENVIRONMENT.md`, `docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md`, `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`, `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md`

> **Trazabilidad (2026-08-15):** para el estado operacional actual de cada servicio (plan, riesgo vigente, acción pendiente, owner), ver `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` (OPS-STATUS-001) — este catálogo sigue siendo la fuente del inventario/propósito/criticidad de cada servicio, no de su estado más reciente.

---

## 1. Propósito

Este documento es el catálogo permanente de todo servicio de infraestructura externo que usa ComparaFarma en producción: qué existe, para qué, de quién depende, qué tan crítico es y dónde vive el detalle operativo de cada uno. Responde una pregunta estable en el tiempo — *"¿qué infraestructura usa hoy la plataforma, y quién es dueño de qué?"* — no una pregunta de un sprint o una fecha de corte.

**Qué gobierna:** el inventario de servicios (identidad, propósito, propiedad, criticidad, relación de dependencia entre ellos) como conocimiento estable y recurrente.

**Qué NO gobierna:**

* No es una auditoría — no repite hallazgos, riesgos detallados ni metodología de evaluación. Esa es `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, que se referencia, no se copia.
* No es un runbook — no describe procedimientos de deploy, rollback, incidentes, rotación o backup. Esos viven en `RUNBOOK.md`.
* No es una guía de variables de entorno — el detalle de cada variable, su default y su impacto si falta vive en `ENVIRONMENT.md`.
* No es un plan de migración de cuentas — el paso a paso de consolidación de propiedad vive en `SERVICE_ACCOUNT_MIGRATION.md`.
* No documenta código ni arquitectura de software de ComparaFarma (eso es `docs/architecture/`).

**Relación con otros documentos:**

* **RUNBOOK** — el Runbook es la fuente de todo procedimiento operativo (deploy, rollback, incidentes, rotación, backup). Este catálogo solo indica, por servicio, que ese procedimiento existe y dónde está — nunca lo repite.
* **ENVIRONMENT** — fuente única de cada variable de entorno, su default y su impacto si falta. Este catálogo solo indica en qué servicio se agrupan esas variables.
* **RELEASE** (`docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md` y `docs/release/`) — evalúan si la plataforma puede publicarse; este catálogo no emite veredictos de publicación, solo describe la infraestructura subyacente que esos documentos evalúan.
* **PRODUCT** — este catálogo no tiene relación de dependencia con Product; ningún servicio aquí listado es propiedad de decisiones de producto, son decisiones de infraestructura.
* **GOVERNANCE** (`GOV-DGM-001`) — este documento sigue el modelo de Documentos Gobernados que GOV-DGM-001 formaliza; ante una discrepancia de forma (estructura, versionado), prevalece GOV-DGM-001 y GOV-TPL-001.

## 2. Alcance

**Este documento define:** el inventario de servicios externos de infraestructura, su clasificación de criticidad, su matriz de dependencias (servicios y procesos), y dónde vive cada procedimiento operacional asociado.

**Este documento NO define:** procedimientos operativos (RUNBOOK), variables de entorno individuales (ENVIRONMENT), veredictos de publicación (RELEASE), hallazgos de auditoría ni su metodología (PRODUCTION_INFRASTRUCTURE_AUDIT), pasos de migración de cuentas (SERVICE_ACCOUNT_MIGRATION), ni presupuesto/costos reales contratados (ningún documento de este repositorio los define hoy — ver Anexo de Riesgos Conocidos).

## 3. Mapa general de la plataforma

```
                              GitHub (repo, fuente de verdad de código)
                                    │
                          GitHub Actions (CI/CD + crons)
                    ┌───────────────┼────────────────────────────┐
                    │               │                            │
              deploy-api      monitor-api.yml /          update-branches.yml
              (ci.yml)        check-price-alerts.yml      (cron diario)
                    │               │                            │
                    ▼               ▼                            ▼
        ┌──────────────────┐                              MINSAL (datos
        │ Vercel            │                              públicos, sin
        │ comparafarma-api  │◄─────────────────────────────cuenta) → commit
        │ (backend)         │                              a api/src/data/
        └─────────┬─────────┘
                   │
   ┌───────────────┼────────────────────────────────────────────────────┐
   │               │                │              │           │        │
   ▼               ▼                ▼              ▼           ▼        ▼
Upstash Redis   Supabase       Resend          Algolia      Khipu     Flow
(caché +        (Postgres +    (email:         (índice      (dona-    (suscrip-
rate limit)     Auth; usada    alertas de      Salcobrand,  ciones)   ciones,
                también por    precio +        credenciales             no
                web/ y         feedback)       de Salco-                activo
                mobile/)                       brand, no                hoy)
                                                propias)

   9 farmacias (Cruz Verde, Ahumada, Dr. Simi, AraucoMed, EcoFarmacias,
   Farmex, Sermecoop, EasyFarma vía scraping/API propia; Salcobrand vía Algolia)
        ▲
        │ Promise.allSettled — consultadas en paralelo por comparafarma-api

        ┌──────────────────┐
        │ Vercel            │──► Supabase (mismo proyecto — Auth para /cuenta, /admin)
        │ comparafarma-web  │
        │ (deploy propio,   │
        │  no pasa por      │
        │  ci.yml)          │
        └───────────────────┘

        Expo / EAS ──► Google Play Console / Billing (RTDN)
        (build + OTA)      │                  │
             │              └─ mla.app.comparafarma (distribución)
             ▼
        Sentry (mobile) + PostHog (mobile) ──► consumen comparafarma-api

        Android Studio + release.keystore (build/firma local, fuera de la nube)
```

Este diagrama resume el flujo real (búsqueda, identidad, alertas, suscripciones, distribución) ya descrito con evidencia de código en `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, sección "Arquitectura Operacional" — no lo reemplaza, es su vista de una sola pantalla.

## 4. Catálogo de servicios

Fuente primaria de cada fila: fichas 1-16 de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (evidencia de código, planes, límites) y `SERVICE_ACCOUNT_MIGRATION.md` (propiedad de cuenta). No se repite aquí la evidencia línea por línea — solo el resumen y la referencia.

| Servicio | Propósito | Propietario / responsable operacional | Criticidad | Plan | Depende de | Impacto si falla | Backup / alternativa | Credenciales | Doc. propietaria |
|---|---|---|---|---|---|---|---|---|---|
| Vercel — `comparafarma-api` | Hosting serverless del backend, las 9 integraciones de farmacias | Mario Lillo Alfaro | Medio | Hobby | GitHub Actions (deploy) | Búsqueda cae por completo para mobile/web | Rollback a deploy anterior (RUNBOOK §2) | Vercel Dashboard → env vars | Audit ficha #1 |
| Vercel — `comparafarma-web` | Hosting Next.js (SEO, `/cuenta`, `/admin`) | Mario Lillo Alfaro | Medio | No verificable | Supabase | Web cae; mobile no se ve afectado | Rollback a deploy anterior | Vercel Dashboard → env vars | Audit ficha #2 |
| Supabase | Postgres + Auth (historial de precios, config, feedback, suscripciones, login/registro) | Mario Lillo Alfaro | Crítico | Free | — | Identidad y datos persistentes degradan; búsqueda anónima no se ve afectada | Ninguno propio — backups automáticos del proveedor | `SUPABASE_URL`/`SUPABASE_SECRET_KEY` en Vercel | Audit ficha #3 |
| Upstash Redis | Caché de búsqueda + rate limiting distribuido | Mario Lillo Alfaro | Bajo | No verificable (probable Free) | — | Fallback automático a memoria (más lento, no cae) | Fallback a memoria ya integrado en código | `UPSTASH_REDIS_REST_URL`/`TOKEN` en Vercel | Audit ficha #4 |
| Sentry (api + mobile) | Reporte de excepciones no controladas | Mario Lillo Alfaro | Bajo | No verificable (probable Free) | — | Se pierde visibilidad de errores, sin impacto funcional | No-op si no está configurado (ya es su propio fallback) | `SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN` | Audit ficha #5 |
| Algolia (índice Salcobrand) | Motor de búsqueda del catálogo de Salcobrand | No es cuenta propia — credenciales de Salcobrand | Medio | No verificable, no propio | — | Salcobrand desaparece de resultados; las otras 8 farmacias siguen | Ninguno — fuera de control de ComparaFarma | `ALGOLIA_APP_ID`/`API_KEY` en Vercel | Audit ficha #6 |
| Resend | Email transaccional (alertas de precio, feedback) | Mario Lillo Alfaro (cuenta distinta al email de pruebas del proyecto) | Crítico | Free | — | Emails a usuarios reales pueden no entregarse mientras use dominio sandbox | Ninguno — pendiente verificar dominio propio | `RESEND_API_KEY` en Vercel | Audit ficha #7 |
| Flow | Pagos recurrentes (suscripciones premium) | CEO (cuenta Flow) | Medio (no activo hoy) | Sandbox y producción son cuentas separadas | Supabase (`flow_customers`) | Sin impacto — diseñado para degradar (503 / `skipped`) si no está configurado | No aplica — no está activo en producción | `FLOW_API_KEY`/`FLOW_SECRET_KEY` en Vercel (ausentes hoy) | Audit ficha #8 |
| Khipu | Pagos de donaciones (`/api/donate`) | Mario Lillo Alfaro (cobrador `520175`) | Bajo | Comisión por transacción, sin plan de volumen | — | `/api/donate` responde error explícito | Ninguno propio | `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` en Vercel | SERVICE_ACCOUNT_MIGRATION §8 |
| Google Play Console / Billing (RTDN) | Distribución de `mobile/` + notificaciones de suscripción | Mario Lillo Alfaro (`mla.app.comparafarma`) | Medio | Cuenta developer estándar | Google Cloud Pub/Sub (RTDN) | Sin impacto en búsqueda; RTDN de suscripciones no se procesa si falta el secret | Ninguno — publicación ya no tiene rollback (staged rollout) | Play Console; `GOOGLE_RTDN_SECRET` en Vercel (ausente hoy) | Audit ficha #9 |
| GitHub (repo + Actions + Pages) | Fuente de verdad de código, CI/CD, cron de alertas y de datos MINSAL, hosting de política de privacidad | Mario Lillo Alfaro (`Enarhos`) | Medio | No verificable (público/privado) | — | Deploy/monitoreo/cron caen si GitHub tiene una caída global; Pages caído afecta la URL registrada en Play Console | Ninguno adicional — GitHub es la fuente de verdad | GitHub Secrets (`VERCEL_TOKEN`, `API_SECRET_KEY`) | Audit ficha #10 |
| Expo / EAS | Build cloud + canal OTA de `mobile/` | Mario Lillo Alfaro (`belford`, `projectId` único) | Alto | Free | — | Sin builds nuevos vía EAS (existe alternativa local); OTA se corta si se migra de cuenta | `pnpm build:android` (local, sin cuota EAS) | EAS Secrets | Audit ficha #11 |
| PostHog | Analítica de producto (mobile) | Mario Lillo Alfaro | Bajo | No verificable (probable Free) | — | Se pierde analítica, sin impacto funcional | Ninguno necesario | Key hardcodeada en `analytics.ts` (ver Riesgos) | Audit ficha #12 |
| MINSAL | Datos públicos de sucursales por comuna | No aplica — API pública del Estado de Chile | Medio | No aplica | — | Datos de sucursales desactualizados; no afecta precios | Archivo estático ya commiteado (`api/src/data/branches.json`) | No aplica | Audit ficha #13 |
| 9 farmacias (Cruz Verde, Ahumada, Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma) | Fuente de datos de precios — el núcleo del producto | No aplica — sitios/APIs de terceros no controlados | Alto (Ahumada, Sermecoop) / Medio (resto) | No aplica | Salcobrand depende de Algolia | Aislado por diseño (`Promise.allSettled`); caída de una no afecta a las demás | Monitoreo horario ya activo (`monitor-api.yml`) | No aplica | Audit ficha #14 |
| Android Studio + build local | Alternativa a EAS para generar el AAB de producción | Quien tenga la máquina configurada | Medio | No aplica (herramienta local) | — | Sin build local disponible si solo una persona tiene el entorno configurado | `eas update` para fixes JS/TS sin build nativo | No aplica | Audit ficha #15 |
| Keystore de firma Android (`release.keystore`) | Firma criptográfica obligatoria para publicar actualizaciones | Mario Lillo Alfaro | Crítico | No aplica | — | Sin backup, pérdida = imposible publicar cualquier actualización futura | Backup cifrado fuera del repo — pendiente confirmar (ver Riesgos) | Archivo local, fuera de git (`.gitignore`) | Audit ficha #16 |

## 5. Matriz de dependencias

**Servicios → de qué dependen:**

| Servicio / proceso | Depende de |
|---|---|
| `comparafarma-api` (búsqueda) | Vercel, Upstash Redis (opcional), Supabase (opcional), Resend (alertas), Algolia (Salcobrand), 9 farmacias |
| `comparafarma-web` | Vercel, Supabase (Auth de `/cuenta` y `/admin`) |
| `mobile/` (build) | Expo/EAS, Android Studio (build local), keystore de firma |
| `mobile/` (runtime) | `comparafarma-api`, Supabase Auth, Sentry, PostHog |
| Identidad (login/registro/recuperación) | Supabase Auth (servicio de email integrado, 2 emails/hora) |
| Alertas de precio por email | Supabase (`email_alerts`), Resend, GitHub Actions (`check-price-alerts.yml`) |
| Suscripciones premium (Flow) | Supabase (`flow_customers`, `subscriptions`), Flow (no activo hoy) |
| Suscripciones premium (Google Play) | Google Cloud Pub/Sub (RTDN), Supabase (no activo hoy) |
| Datos de sucursales (MINSAL) | GitHub Actions (`update-branches.yml`) — no `comparafarma-api` directamente, MINSAL bloquea IPs de Vercel |
| Deploy de `api/` | GitHub → GitHub Actions (`ci.yml`) → Vercel (`comparafarma-api`) |
| Deploy de `web/` | GitHub → Vercel (`comparafarma-web`), deploy automático fuera de `ci.yml` |
| Monitoreo | GitHub Actions (`monitor-api.yml`) → `comparafarma-api` → GitHub Issues |

**Procesos que dependen de más de un servicio a la vez** (no solo servicios individuales): el proceso de publicación de `mobile/` depende simultáneamente de Expo/EAS (build), Android Studio o EAS cloud (compilación), el keystore (firma) y Google Play Console (distribución) — la ausencia de cualquiera de los cuatro detiene la publicación completa, no solo una parte.

## 6. Clasificación operacional

| Criticidad | Servicios | Justificación (resumen — detalle en Audit) |
|---|---|---|
| **Crítico** | Supabase, Resend, Keystore Android | Afectan hoy, en producción, una función real de usuario de forma silenciosa (Supabase: recuperación de clave; Resend: entrega de alertas) o representan una pérdida irreversible de capacidad de publicar (Keystore) — ver Matriz de Riesgos Consolidada de `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, sección "Críticos". |
| **Alto** | Expo/EAS, 9 farmacias (Ahumada/Sermecoop) | Límite de MAU de OTA es el más bajo de todo el inventario y `projectId` único sin alternativa (Matriz de Riesgos, Altos #6/#7); 2 de 9 integraciones ya documentadas como frágiles (Matriz, Alto #8). |
| **Medio** | Vercel `comparafarma-api`, Vercel `comparafarma-web`, Google Play Console/Billing, Algolia, Flow, GitHub, MINSAL, 9 farmacias (resto), Android Studio/build local | Impacto parcial o acotado a una función no-core, o dependencia fuera del control directo de ComparaFarma sin alternativa mejor disponible hoy — incluye Vercel `comparafarma-api` (ficha #1: Medio) y Google Play Console/Billing (ficha #9: Medio; el Alto #9 de la Matriz describe el estado de negocio combinado de Flow+RTDN, no una reevaluación de este servicio en sí — ver nota metodológica debajo). |
| **Bajo** | Upstash Redis, Sentry, Khipu, PostHog | Tienen degradación ya diseñada en código (fallback a memoria, no-op) o impacto acotado a observabilidad/analítica, sin afectar función core. |

**Nota metodológica:** cuando la ficha por servicio y la Matriz de Riesgos Consolidada de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` difieren en la severidad de un mismo servicio, este catálogo usa por defecto la clasificación de la ficha por servicio (evaluación directa de ese servicio), y solo adopta la severidad de la Matriz cuando el ítem de la Matriz describe explícitamente un riesgo sobre ese servicio en particular — no una combinación con otro. Aplicación: Expo/EAS se mantiene en Alto porque la Matriz (Altos #6/#7) evalúa directamente el límite de MAU y el `projectId` único de ese mismo servicio; Google Play Console/Billing se mantiene en Medio (ficha #9) porque el Alto #9 de la Matriz describe el estado de negocio combinado de Flow+RTDN, no una reevaluación del servicio Google Play Console en sí.

## 7. Riesgos conocidos

Este documento no repite la auditoría — solo resume y referencia. Detalle completo, con evidencia, en `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, sección "Matriz de Riesgos Consolidada":

* **Críticos (4):** límite de email de Supabase Auth; entrega no confiable de Resend (dominio sandbox); keystore sin backup confirmado; concentración de infraestructura crítica en una sola cuenta personal.
* **Altos (5):** discrepancia entre `/api/health` y lo documentado en RUNBOOK — **cerrada 2026-08-13**, ver Control de Cambios de este documento; límite de MAU de Expo/EAS; `projectId` único de Expo/EAS; fragilidad de scraping en Ahumada/Sermecoop; estado no verificado de Flow y Google Play RTDN en producción.
* **Medios y Bajos:** ver detalle completo en la fuente — no se listan aquí para no duplicar.

Este catálogo no resuelve ni prioriza estos riesgos — esa función es de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (Roadmap) y de la ejecución de pendientes ya en curso (Sprint "Operational Hardening 1.0").

## 8. Operación

Este catálogo no describe procedimientos — indica únicamente dónde vive cada uno:

| Necesidad operacional | Dónde vive |
|---|---|
| Deploy (`api/`, `web/`, `mobile/`) | `RUNBOOK.md` §1 |
| Rollback | `RUNBOOK.md` §2 |
| Recuperación ante fallos / incidentes frecuentes | `RUNBOOK.md` §3, §7 |
| Rotación de secretos | `RUNBOOK.md` §4 |
| Renovación de certificados / firma Android | `RUNBOOK.md` §5 |
| Monitoreo | `RUNBOOK.md` §6 |
| Backup | `RUNBOOK.md` §8 |
| Restauración | `RUNBOOK.md` §9 |
| Mantenimiento periódico | `RUNBOOK.md` §10 |
| Variables de entorno (cada una, su default, su impacto si falta) | `ENVIRONMENT.md` |
| Migración/consolidación de propiedad de cuentas | `SERVICE_ACCOUNT_MIGRATION.md` |
| Veredicto de preparación para publicar | `PRODUCTION_READINESS_REVIEW.md` |

## 9. Evolución

Se registran únicamente los servicios ya previstos oficialmente en el código o en documentos aprobados — no se propone ningún servicio nuevo desde este documento:

* **Flow** (pagos recurrentes) y **Google Play Billing/RTDN** — ya integrados en código (`flowAdapter.ts`, `googlePlayAdapter.ts`), pendientes de confirmación de estado esperado en producción por el CTO (ver Riesgos Altos #9 de la Audit). No son servicios nuevos, son activación pendiente de servicios existentes.
* No hay, a la fecha de esta versión, ningún servicio de infraestructura adicional previsto oficialmente más allá de los ya catalogados en la sección 4.

## 10. Relaciones

Este documento consolida, sin reemplazar: `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente de la evidencia, riesgos y metodología de cada servicio), `RUNBOOK.md` (fuente de todo procedimiento), `ENVIRONMENT.md` (fuente de cada variable), `SERVICE_ACCOUNT_MIGRATION.md` (fuente de la propiedad de cuenta y su plan de consolidación), y `PRODUCTION_READINESS_REVIEW.md` (veredicto de publicación). Es consumido por: ninguno todavía — es su primera versión.

## 11. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Evidencia de código, planes contratados y riesgos por servicio | `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` | ✔ (resumido, referenciado) | No se repite evidencia línea por línea |
| Procedimientos operativos (deploy, rollback, incidentes, rotación, backup) | `docs/operations/RUNBOOK.md` | — (solo referenciado) | Este catálogo nunca describe un procedimiento |
| Variables de entorno individuales | `docs/operations/environment/ENVIRONMENT.md` | — (solo referenciado) | Este catálogo agrupa por servicio, no por variable |
| Propiedad de cuenta y plan de consolidación | `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md` | ✔ (resumido en columna "Propietario") | Documento de Ejecución (2026-06-30/2026-08-02) — no actualizado desde entonces; ver Riesgo en Anexo A de GOV-DGM-001 sobre documentos sin re-verificar |
| Veredicto de preparación para publicar | `docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md` | — (solo referenciado) | Este catálogo no emite veredictos de publicación |
| Modelo de gobierno documental aplicado a este documento | `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` | ✔ (aplicado) | Adopción voluntaria de GOV-TPL-001 para la familia Operations, mismo mecanismo que Launch/Program/Design |

## 12. Gobierno

Este documento no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `RUNBOOK.md`, `ENVIRONMENT.md` ni `SERVICE_ACCOUNT_MIGRATION.md` — los consolida en un solo punto de entrada, sin duplicar su contenido. Ante una discrepancia entre este catálogo y cualquiera de esas fuentes sobre un dato específico de un servicio, prevalece la fuente (columna "Doc. propietaria" de la sección 4), no este catálogo — este documento debe corregirse para reflejarla, no al revés.

Este documento adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, siguiendo el mismo mecanismo ya usado por Launch, Program y Design (`GOV-DGM-001` §3.1). No convierte a toda la familia Operations en Documentos Gobernados — `RUNBOOK.md` y `ENVIRONMENT.md` siguen siendo Documentos de Ejecución, correctamente, porque no aspiran a ser fuente de verdad estable por sí mismos sino procedimiento operativo vigente. Este documento es, dentro de Operations, el único que declara este nivel — ver Anexo A de `GOV-DGM-001`, ítem 4, sobre la tensión ya señalada con `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (que se autodeclara "permanente" sin esta estructura): este catálogo no resuelve esa tensión retroactivamente sobre ese otro documento, solo evita reproducirla en el suyo propio.

## 13. Documentos relacionados

`docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`, `docs/operations/environment/ENVIRONMENT.md`, `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`, `docs/archive/reviews/PRODUCTION_READINESS_REVIEW_2026-08-13.md`, `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

## 14. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-13 | Activo | Pendiente (CTO) | Creación del catálogo maestro de infraestructura — Sprint "PLATFORM HARDENING". Consolida en un único punto de entrada los 17 servicios/dependencias ya inventariados en `PRODUCTION_INFRASTRUCTURE_AUDIT.md` y `SERVICE_ACCOUNT_MIGRATION.md`, con mapa ASCII, matriz de dependencias (servicios y procesos), clasificación operacional y referencias a procedimiento — sin duplicar ninguna tabla existente. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `RUNBOOK.md`, `ENVIRONMENT.md`, `PRODUCTION_READINESS_REVIEW.md`, `SERVICE_ACCOUNT_MIGRATION.md`, `DOCUMENT_GOVERNANCE_MODEL.md` |

## 15. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-13 | Creación del catálogo maestro de infraestructura (Sprint "PLATFORM HARDENING") | CTO / Claude | `docs/operations/PLATFORM_SERVICE_CATALOG.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue construido a su pedido explícito, pero la aprobación es un paso posterior y separado, igual que el resto de los documentos de este repositorio.
