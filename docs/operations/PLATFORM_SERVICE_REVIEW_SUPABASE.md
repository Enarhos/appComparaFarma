# Revisión de Servicio — Supabase

**Código:** OPS-REV-001

**Nombre:** PLATFORM_SERVICE_REVIEW_SUPABASE.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo ya usado por `PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001) y `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001), reconocido en `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` §3.1.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-001`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #3, SPOF #2, Matriz de Riesgos #1), `docs/operations/ENVIRONMENT.md`, `docs/database/schema.sql`, código real de `api/src`, `web/src`, `mobile/src`.

---

## 1. Uso actual

Supabase cumple dos funciones independientes en ComparaFarma, ambas sobre un único proyecto (`https://xzdtpypctyntkgmoceum.supabase.co`, confirmado en `web/.env.example`):

**a) Base de datos Postgres.** Persiste historial de precios (`price_history`), clics de farmacia (`pharmacy_clicks`), configuración del panel admin (`app_config`), bandeja de feedback (`feedback`), catálogo canónico de medicamentos (`medications`, `medication_match_key_aliases`), alertas de precio por email (`email_alerts`), perfiles de usuario (`profiles`) y el motor de suscripciones (`subscription_plans`, `subscriptions`, `subscription_events`, `flow_customers`) — 11 tablas en total, evidenciadas en `docs/database/schema.sql` (340 líneas).

**b) Supabase Auth.** Provee login/registro/recuperación de contraseña para `web/` y `mobile/`, y OAuth de Google para el panel `/admin` de `web/` (gateado además por `ADMIN_ALLOWED_EMAILS`, `web/.env.example`).

Patrones de acceso confirmados en código, tres distintos:

- **`api/src/lib/supabaseClient.ts`**: cliente server-side con `SUPABASE_SECRET_KEY` — bypassea RLS por diseño (comentario explícito en el propio archivo).
- **`web/src/lib/supabase/admin.ts`**: mismo patrón que `api/` (secret key, bypassea RLS), usado solo server-side detrás de `middleware.ts`. `web/src/lib/supabase/client.ts` y `server.ts` usan en cambio `@supabase/ssr` (`createBrowserClient`/`createServerClient`) con la anon key — respetan RLS, se usan para saber quién está logueado (`getUser`, `signOut`), no para leer datos del dashboard.
- **`mobile/src/lib/supabase.ts`**: cliente con `EXPO_PUBLIC_SUPABASE_ANON_KEY`, sesión persistida cifrada (AES-256) vía `expo-secure-store`. `mobile/src/lib/sessionManager.ts` implementa `signInWithPassword`, `signUpWithPassword`, `resetPasswordForEmail`, `updateUser` (cambio de clave) y `completeSessionFromUrl` (`setSession`, no es flujo PKCE).

Grep confirma 50 archivos que referencian Supabase en el repo: 23 en `api/src`, 23 en `web/src`, 4 en `mobile/src`. No se encontró uso de Supabase Storage, Realtime ni Edge Functions en ningún workspace (`grep` explícito sin resultados).

`docs/operations/ENVIRONMENT.md` documenta que `mobile/` funciona 100% anónima si Supabase no está configurado (degradación silenciosa a `null`/`[]`, nunca lanza), igual que `price_history`/`app_config`/`feedback`.

## 2. Inventario

| Tabla | Función | RLS habilitado | Policy permisiva |
|---|---|---|---|
| `price_history` | Snapshot diario de precio por medicamento+farmacia | Sí | Ninguna |
| `pharmacy_clicks` | Clic de usuario hacia una farmacia | Sí | Ninguna |
| `app_config` | Config del panel `/admin` (ej. `disabled_pharmacies`) | Sí | Ninguna |
| `feedback` | Mensajes de usuarios | Sí | Ninguna |
| `medications` | Catálogo canónico de medicamentos (CFM-ID) | Sí | Ninguna |
| `medication_match_key_aliases` | Alias de `matchKey` hacia un CFM-ID | Sí | Ninguna |
| `email_alerts` | Alertas de precio por email (sin cuenta, token en URL) | Sí | Ninguna |
| `profiles` | Perfil ligero de usuario (extiende `auth.users`) | Sí | **`profiles_select_own`** (select propio) |
| `subscription_plans` | Catálogo de planes premium | Sí | Ninguna |
| `subscriptions` | Suscripciones activas por usuario | Sí | Ninguna |
| `subscription_events` | Eventos de Flow/Google Play Billing | Sí | Ninguna |
| `flow_customers` | Mapeo usuario↔cliente Flow | Sí | Ninguna |

Las 11 tablas tienen RLS habilitado (`alter table ... enable row level security`, confirmado línea por línea en `schema.sql`), pero **solo existe una policy permisiva real** (`profiles_select_own`, solo lectura del propio perfil). El comentario del propio archivo (línea 61-64) lo declara explícitamente: "Ninguna de las cuatro tablas [Fase 1/3] tiene policies de RLS permisivas — solo `api/` y `web/` acceden, con `SUPABASE_SECRET_KEY` (bypassea RLS por diseño). RLS queda habilitado como defensa en profundidad, no como mecanismo de acceso real." El mismo patrón se replica en las 7 tablas restantes.

Adicionalmente existe un trigger `security definer` (`handle_new_profile`) sobre `auth.users` que auto-crea la fila de `profiles` al registrarse un usuario nuevo.

`price_history` tiene una restricción `unique(match_key, pharmacy_slug, recorded_date)` — el crecimiento está acotado a **una fila por medicamento único por farmacia por día**, no una fila por búsqueda de usuario. No se encontró en `schema.sql` ni en `api/src/lib/priceHistoryDb.ts` ningún mecanismo de purga o retención (`grep` sin resultados para "delete", "retention", "cleanup", "purge") — las filas se acumulan indefinidamente.

## 3. Plan contratado

**Free**, confirmado en vivo por el CTO en esta sesión (Dashboard → Authentication → Rate Limits, "Rate limit for sending emails: 2 emails/h") y ya registrado como tal en `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #3. No se investigó de nuevo el Dashboard en esta revisión (restricción explícita: revisión cerrable 100% desde el repositorio); este dato se hereda de la evidencia ya confirmada, no se re-verifica.

## 4. Límites del plan

Investigado en `supabase.com/pricing` (oficial, consultado en esta revisión) y `supabase.com/docs/guides/auth/rate-limits` (oficial):

| Recurso | Límite Free | Fuente |
|---|---|---|
| Tamaño de base de datos | 500 MB (Shared CPU, 500 MB RAM) | supabase.com/pricing |
| Usuarios activos mensuales (Auth) | 50.000 MAU | supabase.com/pricing |
| Egress | 5 GB/mes | supabase.com/pricing |
| Egress cacheado | 5 GB/mes | supabase.com/pricing |
| Almacenamiento de archivos (Storage) | 1 GB (no usado por el proyecto — ver §1) | supabase.com/pricing |
| Proyectos activos simultáneos | 2 | supabase.com/pricing |
| Pausa por inactividad | **Confirmado oficialmente**: "Free projects are paused after 1 week of inactivity" | supabase.com/pricing (texto literal de la página) |
| Email de Auth integrado | 2 emails/hora, todo el proyecto | supabase.com/docs/guides/auth/rate-limits |
| Email con SMTP propio configurado | 30 emails/hora (ajustable desde Rate Limits) | supabase.com/docs/guides/auth/rate-limits |
| Edge Functions (no usado) | 500.000 invocaciones/mes | Heredado de Audit ficha #3 |
| Conexiones Realtime (no usado) | 200 concurrentes | Heredado de Audit ficha #3 |

**Corrección respecto a la Auditoría de Infraestructura previa:** `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #3, línea 94) registró la pausa por inactividad como "cifra de terceros, no verificada contra la documentación oficial de Supabase — tratar como orientativa". Esta revisión confirma la cifra **directamente contra `supabase.com/pricing`** (fuente oficial, texto literal citado arriba) — deja de ser orientativa. No se corrige el texto de la Auditoría (fuera del alcance de esta revisión, que solo puede tocar el ítem `OPS-SVC-BKL-001` del backlog); se deja constancia aquí para quien lea ambos documentos.

## 5. Riesgos

Heredados de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #3, Matriz de Riesgos Consolidada ítem Crítico #1, SPOF #2) y confirmados vigentes por esta revisión, sin cambios:

1. **🔴 Alto — límite de 2 emails/hora del servicio de email integrado de Auth**, para todo el proyecto (no por usuario). Bloquea recuperación de contraseña y confirmación de registro a partir de un uso simultáneo mínimo. Confirmado en vivo por el CTO; ahora también confirmado contra la documentación oficial (§4). Sin SMTP propio configurado hoy — Resend existe en el proyecto pero para otro propósito (alertas/feedback vía `api.resend.com` directo, no conectado como proveedor SMTP de Supabase Auth).
2. **🔴 Alto — proyecto único compartido por `api/`, `web/` y `mobile/`** (SPOF #2 de la Auditoría). Una pausa por inactividad (ahora confirmada oficialmente, §4) o una caída afecta a los tres frontends simultáneamente. `docs/architecture/IDENTITY_INTEGRATION_PLAN.md` prohíbe explícitamente crear un segundo proyecto.
3. **🟡 Medio — crecimiento no acotado de `price_history`** sin mecanismo de purga/retención (hallazgo nuevo de esta revisión, §2). Acotado por diseño a una fila por medicamento/farmacia/día, pero sin límite temporal — en varios años de operación podría acercarse al límite de 500 MB de DB, aunque no hay evidencia de que esto sea inminente (ver §7).
4. **🟢 Bajo — RLS habilitado sin policies permisivas reales** (salvo `profiles_select_own`). Esto es una decisión de diseño ya documentada explícitamente en el propio `schema.sql` (defensa en profundidad, acceso real vía `SUPABASE_SECRET_KEY` en backend), no un hallazgo de seguridad nuevo — se registra aquí solo para que esta revisión sea autocontenida, no para reabrir el tema.

No se identificaron riesgos nuevos de plan/límites más allá de los ya conocidos por la Auditoría — el límite de email (Crítico) y la pausa por inactividad (ahora confirmada) siguen siendo los dos hallazgos centrales.

## 6. Consumo actual

**No verificable desde el repositorio.** El consumo real de MAU, tamaño de base de datos en MB, número de filas por tabla, y volumen de emails enviados requieren el Dashboard de Supabase (Database → Usage / Reports), que esta revisión tiene explícitamente prohibido consultar (restricción del CTO: revisión cerrable 100% desde el repositorio, sin acceso a dashboards externos). No se estima ninguna cifra para no inventar datos.

Lo único verificable indirectamente desde el código: `price_history` crece como máximo `(número de medicamentos únicos vistos) × 9 farmacias × (días transcurridos desde 2026-07-20, fecha de Fase 1)` — un techo teórico, no una medición real de filas.

## 7. Escalabilidad

Estimado a partir de los límites oficiales (§4) y el patrón de acceso del código (§1-2), sin datos reales de consumo (§6):

- **100 usuarios:** el límite de 2 emails/hora de Auth ya es insuficiente en momentos de uso simultáneo (ej. varias recuperaciones de clave a la misma hora) — no depende del número de usuarios, es un límite fijo por proyecto. El resto de los límites (500 MB DB, 50.000 MAU, 5 GB egress) no representan riesgo a este volumen.
- **500 usuarios:** mismo hallazgo de email — es un bloqueo funcional, no un problema que aparezca gradualmente con más usuarios. `price_history` sigue lejos de 500 MB (crecimiento lineal con medicamentos únicos × días, no con usuarios).
- **1.000 usuarios:** igual que arriba — el cuello de botella de email de Auth ya está activo mucho antes de este volumen, no aparece recién acá. MAU (50.000) y egress (5 GB) siguen con margen amplio.
- **5.000 usuarios:** el límite de email de Auth sigue siendo el primer y único límite de Supabase relevante en este rango — a este volumen sería razonable esperar acercarse a los 5 GB de egress si el patrón de acceso a la API crece proporcionalmente, pero no hay datos reales (§6) para confirmar esa proyección con certeza.

**Conclusión de escalabilidad:** a diferencia de otros servicios del inventario (ej. Expo/EAS con su límite de 1.000 MAU para OTA, ya señalado como el más bajo del ecosistema en la Auditoría), el límite de Supabase que importa no es de volumen de usuarios — es un límite fijo de **2 emails/hora por proyecto**, activo hoy independientemente de si hay 10 o 5.000 usuarios. Es, en ese sentido, más urgente que progresivo.

## 8. Alternativas

No se investigó activamente un cambio de proveedor (fuera del alcance de esta revisión: el objetivo es determinar si el **plan actual** es suficiente, no evaluar reemplazar Supabase). Se registra solo lo ya evidente por diseño del propio código:

- **Upgrade a plan Pro de Supabase** (mismo proveedor): resuelve simultáneamente el límite de MAU/DB/egress y — según documentación oficial de rate limits — permite subir el límite de email configurando SMTP propio con más margen. Es la alternativa de menor esfuerzo de migración (cero cambio de código, solo configuración + costo).
- **SMTP propio sobre el plan Free actual**: no requiere upgrade de plan — sube el límite de 2 a 30 emails/hora (§4) sin cambiar de proveedor de base de datos. Es la opción que la Auditoría ya recomienda como Prioridad 1, independiente de si se hace upgrade de plan o no.
- **Migrar de proveedor de base de datos/Auth** (ej. otro Postgres gestionado + otro proveedor de Auth): no evaluado — implicaría reescribir `api/src/lib/supabaseClient.ts`, `web/src/lib/supabase/*`, `mobile/src/lib/supabase.ts` y `sessionManager.ts`, y `docs/architecture/IDENTITY_INTEGRATION_PLAN.md` ya fija a Supabase como la decisión de arquitectura vigente — fuera del alcance de esta revisión y no fundamentado por ningún hallazgo de esta revisión (el problema es el límite de email de una función específica, no el proveedor completo).

## 9. Costos

Información oficial de `supabase.com/pricing` (consultada en esta revisión):

| Plan | Costo | Incluye |
|---|---|---|
| Free (actual) | $0/mes | Ver límites §4 |
| Pro | Desde $25/mes (primer proyecto incluido) | 100.000 MAU (luego USD 0,00325/MAU adicional), 8 GB de disco por proyecto (luego USD 0,125/GB), 250 GB egress (luego USD 0,09/GB), 250 GB egress cacheado (luego USD 0,03/GB), 100 GB de almacenamiento de archivos (luego USD 0,0213/GB), soporte por email, backups diarios retenidos 7 días, retención de logs 7 días |

No se investigaron los planes Team/Enterprise — el salto de Free a Pro ya cubre, según los límites oficiales, todos los riesgos identificados en §5 (email, MAU, DB, pausa por inactividad) muy por encima de cualquier proyección razonable de §7. No hay evidencia en el repo de un volumen que justifique evaluar Team/Enterprise.

## 10. Recomendación del CTO

🟡 **Mantener el proveedor y el plan Free hoy, con una acción de configuración obligatoria antes de escalar usuarios reales.**

Justificación: ningún hallazgo de esta revisión indica que Supabase como proveedor sea insuficiente para la arquitectura actual — el modelo de datos (11 tablas, RLS como defensa en profundidad, acceso server-side vía secret key) está bien diseñado para el patrón de uso real, y los límites de recursos del plan Free (500 MB DB, 50.000 MAU, 5 GB egress) tienen margen amplio frente al volumen actual y proyectado a 5.000 usuarios (§7). El único riesgo real y ya activo en producción es el límite fijo de 2 emails/hora del servicio de email integrado de Auth (§5, §7), que bloquea recuperación de contraseña y confirmación de registro independientemente del plan — esto ya estaba identificado como Prioridad 1 en `PRODUCTION_INFRASTRUCTURE_AUDIT.md` y esta revisión no encuentra motivo para cambiar esa prioridad ni para escalar la recomendación a upgrade de plan: **conectar un SMTP propio resuelve el hallazgo sin necesitar Pro**. Se recomienda reevaluar el plan (subir a Pro) solo si se confirma consumo real cercano a los límites de §4 — dato hoy no verificable desde el repositorio (§6) — o si el crecimiento de `price_history` sin retención (§2, §5) se vuelve una preocupación medible, ninguna de las dos cosas evidenciada hoy.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #3 de Supabase, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md` (inventario y clasificación de criticidad de Supabase, sin cambios). Es el primer documento de revisión individual generado a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001) — establece el formato que seguirán las próximas 15 revisiones de ese backlog.

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Función y evidencia de uso de Supabase | `docs/database/schema.sql`, código real (`api/src`, `web/src`, `mobile/src`) | ✔ (§1, §2) | Inventario propio de esta revisión, no duplicado de otro documento |
| Clasificación de criticidad | `PLATFORM_SERVICE_CATALOG.md` §6 | Heredada, sin recalcular | Esta revisión no reevalúa criticidad |
| Riesgos y plan ya evidenciados | `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #3 | Heredado (§3, §5), con una corrección puntual (§4) | La pausa por inactividad pasa de "orientativa" a confirmada oficialmente |
| Límites y costos oficiales del plan | `supabase.com/pricing`, `supabase.com/docs/guides/auth/rate-limits` | ✔ (§4, §9) — investigado en esta revisión | Primera vez que se cita la fuente oficial directa, no de terceros |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md` ni `PLATFORM_SERVICE_REVIEW_BACKLOG.md`. Ante una discrepancia sobre un dato de Supabase entre este documento y la Auditoría, prevalece la Auditoría salvo que este documento cite evidencia oficial más reciente (caso de §4, explícitamente señalado). Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que `OPS-SVC-001` y `OPS-BKL-001`.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/ENVIRONMENT.md`, `docs/database/schema.sql`, `docs/architecture/IDENTITY_INTEGRATION_PLAN.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-13 | Activo | Pendiente (CTO) | Creación de la primera revisión individual de servicio del backlog `OPS-BKL-001` — Supabase. 10 secciones requeridas completas, ningún código/infraestructura modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `docs/database/schema.sql`, `supabase.com/pricing`, `supabase.com/docs/guides/auth/rate-limits` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-13 | Revisión completa de Supabase — primer ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_SUPABASE.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
