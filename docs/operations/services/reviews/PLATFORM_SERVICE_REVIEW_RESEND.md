# Revisión de Servicio — Resend

**Código:** OPS-REV-002

**Nombre:** PLATFORM_SERVICE_REVIEW_RESEND.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo ya usado por `PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001), `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001) y `PLATFORM_SERVICE_REVIEW_SUPABASE.md` (OPS-REV-001).

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-002`)

**Documentos de los que depende:** `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #7), código real de `api/src/lib/email.ts`, `api/src/routes/alerts.ts`, `api/src/routes/feedback.ts`.

---

## 1. Uso actual

Resend envía dos tipos de email transaccional, por **dos rutas de código independientes y duplicadas** (ambas hacen `fetch` directo a `https://api.resend.com/emails`, sin SDK):

**a) `api/src/lib/email.ts` → `sendEmail()`**, usada por `api/src/routes/alerts.ts` para dos momentos del flujo de alertas de precio: confirmación al crear la alerta (línea 124) y notificación al dispararse la alerta cuando el precio baja (línea 211). El destinatario es el **email que un usuario real escribió** al crear la alerta — dato variable, no controlado.

**b) `api/src/routes/feedback.ts`**, con su propia llamada `fetch` inline (no reutiliza `email.ts`, duplicación ya señalada como Prioridad 3 en `RC-03_PRODUCTION_READINESS_REPORT.md`), que envía el mensaje de feedback de un usuario a `FEEDBACK_EMAIL` (variable de entorno, con default `mario.lillo.alfaro@gmail.com` si no está seteada) — es decir, **siempre al mismo destinatario fijo**, presumiblemente el dueño de la cuenta.

Ambas rutas usan el mismo remitente hardcodeado: `from: "ComparaFarma <onboarding@resend.dev>"` — el **dominio sandbox** de Resend, con un comentario explícito en `email.ts` (línea 6-8): "decisión explícita del CEO (2026-07-31) para no bloquear Sprint C con verificación de dominio propio... Migrar cuando se decida verificar un dominio real en Resend."

**Hallazgo de esta revisión:** ese dominio real ya existe — se verificó `lospanalesdeamelia.cl` en esta misma cuenta de Resend el 2026-08-14, como parte del cierre de `OPS-SVC-BKL-001` (SMTP de Supabase Auth). Pero esa verificación **no modificó ningún código** — `email.ts` y `feedback.ts` siguen apuntando al dominio sandbox, sin relación con la configuración SMTP de Supabase (son dos usos independientes de la misma cuenta de Resend: uno vía SMTP para Supabase Auth, otro vía API REST directa para alertas/feedback).

## 2. Inventario

| Ruta de código | Función | Destinatario | Remitente actual |
|---|---|---|---|
| `api/src/lib/email.ts` → `sendEmail()` | Confirmación y disparo de alertas de precio | Email variable (el que el usuario escribió) | `onboarding@resend.dev` (sandbox) |
| `api/src/routes/feedback.ts` (inline) | Notificación de feedback de usuario | Fijo: `FEEDBACK_EMAIL` (env var, default dueño de cuenta) | `onboarding@resend.dev` (sandbox) |

`RESEND_API_KEY` confirmado presente en las variables de entorno reales de producción (`api/.env.vercel.production`, ficha #7 de la Auditoría — nombre de variable, no su valor). Ninguna de las dos rutas usa el SDK oficial de Resend (`resend` npm package) — ambas hacen `fetch` manual a la API REST, sin manejo de reintentos ni backoff.

## 3. Plan contratado

**Free**, confirmado en vivo en esta revisión (Dashboard → Settings → Billing): "Transactional — 3.000 emails — $0/mo", "Marketing — 1.000 contactos — $0/mo", sin método de pago cargado.

## 4. Límites del plan

Investigado en `resend.com/pricing` (oficial, consultado en esta revisión):

| Recurso | Free | Pro ($20/mes) | Scale ($90/mes) |
|---|---|---|---|
| Emails transaccionales/mes | 3.000 | 50.000 (+ USD 0,90 c/1.000 extra) | 100.000 (+ USD 0,90 c/1.000 extra) |
| Límite diario | 100/día | Sin límite diario | Sin límite diario |
| Dominios propios verificables | **1** | 10 | 1.000 |
| Créditos de IA/mes | 5 | 100 | 500 |
| Retención de datos | 30 días | 30 días | 30 días |
| Soporte | Tickets | Tickets | Slack + tickets |
| IPs dedicadas | No disponible | No disponible | Con add-on (USD 30/mes) |

**Hallazgo relevante:** el plan Free permite verificar **un solo dominio propio** — y ese cupo ya está ocupado por `lospanalesdeamelia.cl` (confirmado en vivo, Dashboard → Settings → Usage: "Domains: 1/1"). Esto significa que, sin upgrade de plan, no se puede verificar un segundo dominio en paralelo — cualquier cambio futuro de dominio (ej. al definirse el nombre definitivo del proyecto) requiere primero quitar o reemplazar el dominio actual, no agregar uno nuevo al lado.

## 5. Riesgos

Heredado de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #7 (🔴 Alto), reevaluado con la evidencia de esta revisión:

1. **🔴 Alto, sigue activo — entrega no confiable a usuarios reales en el flujo de alertas de precio.** Mientras `email.ts` siga usando `onboarding@resend.dev`, Resend solo garantiza entrega confiable al email dueño de la cuenta de Resend — no a los emails reales que los usuarios escriben al crear una alerta de precio. Esto es un riesgo de producto silencioso: un usuario puede crear una alerta y nunca recibir la confirmación ni el aviso de bajada de precio, sin que el sistema reporte error (`sendEmail()` solo loguea el status HTTP, no valida entrega real).
2. **🟢 Bajo, probablemente sin impacto real — feedback.ts.** Como el destinatario es fijo (`FEEDBACK_EMAIL`, presumiblemente el dueño de la cuenta), la restricción del dominio sandbox no debería afectar esta ruta — **no verificado directamente** (no se confirmó que `FEEDBACK_EMAIL` sea exactamente el email dueño de la cuenta de Resend), pero es la hipótesis más consistente con la evidencia disponible.
3. **🟡 Medio — límite de 100 emails/día.** Con 7/100 de consumo diario real hoy (ver §6), hay margen amplio, pero es fácilmente alcanzable con cientos de usuarios activos usando alertas de precio simultáneamente (ya señalado en la Auditoría).
4. **🟡 Medio, hallazgo nuevo de esta revisión — cupo de dominios agotado (1/1).** No bloquea nada hoy (un solo dominio interino en uso), pero sí condiciona cualquier futuro cambio de dominio: no se puede tener dos dominios verificados en paralelo durante una transición sin upgrade de plan.
5. **🟢 Bajo — duplicación de código entre `email.ts` y `feedback.ts`.** Ya señalado en RC-03 como Prioridad 3, sin urgencia operacional — pero cualquier fix al remitente sandbox tiene que aplicarse en dos lugares mientras no se consolide.

## 6. Consumo actual

Confirmado en vivo en esta revisión (Dashboard → Settings → Usage, plan Free):

| Métrica | Consumo | Cupo |
|---|---|---|
| Emails transaccionales (mes) | 7 | 3.000 |
| Emails transaccionales (día) | 7 | 100 |
| Dominios verificados | 1 | 1 |
| Contactos de marketing | 0 | 1.000 |
| Créditos de IA (mes) | 0 | 5 |
| Automatizaciones (mes) | 0 | 1.000 |
| Límite de tasa | — | 10 req/s |

Consumo real hoy: **muy por debajo** de los límites de volumen (7 de 3.000/mes) — los 7 envíos registrados corresponden a las pruebas de esta misma sesión (registro, confirmación, recuperación de contraseña). El único recurso al límite es el cupo de dominios (1/1), no el volumen de envío.

## 7. Escalabilidad

Estimado a partir de los límites oficiales (§4), sin datos de producción real más allá de las pruebas de hoy:

- **100 usuarios:** sin riesgo de volumen (100/día, 3.000/mes tienen margen amplio). El riesgo de entrega no confiable (§5, hallazgo #1) ya está activo hoy, independiente del volumen — no es un problema que aparezca con más usuarios, ya existe.
- **500 usuarios:** si una fracción activa usa alertas de precio simultáneamente, podría acercarse al límite de 100/día en momentos puntuales (ej. una caída de precio masiva disparando muchas notificaciones el mismo día).
- **1.000 usuarios:** el límite diario de 100 emails empieza a ser una restricción real y recurrente, no solo puntual, si el uso de alertas de precio crece proporcionalmente.
- **5.000 usuarios:** probable que el volumen mensual (3.000/mes) y diario (100/día) ya no alcancen — candidato claro a upgrade a Pro (50.000/mes, sin límite diario) antes de llegar a este volumen.

## 8. Alternativas

No se evaluó activamente un cambio de proveedor — Resend ya está integrado, tiene cuenta activa, y el hallazgo principal (dominio sandbox) tiene una solución de bajo esfuerzo dentro del mismo proveedor (§10), no amerita evaluar reemplazo.

- **Reutilizar el dominio ya verificado (`lospanalesdeamelia.cl`) para `email.ts`/`feedback.ts`:** cambio de una constante en 2 archivos, sin consumir un cupo de dominio adicional (ya está verificado). Resuelve el hallazgo #1 de §5 sin upgrade de plan.
- **Upgrade a Pro ($20/mes):** resuelve el límite diario y el cupo de dominios (10 en vez de 1), pero no es necesario hoy dado el consumo real (§6).
- **Consolidar `email.ts`/`feedback.ts` en una sola función:** ya señalado en RC-03, reduce el riesgo de que un fix futuro (ej. cambio de dominio) se aplique en un lugar y se olvide en el otro.

## 9. Costos

Oficial, `resend.com/pricing` (consultado en esta revisión):

| Plan | Costo | Incluye |
|---|---|---|
| Free (actual) | $0/mes | Ver límites §4 |
| Pro | $20/mes | 50.000 emails/mes, sin límite diario, 10 dominios, 100 créditos IA/mes, extra USD 0,90/1.000 emails |
| Scale | $90/mes | 100.000 emails/mes, 1.000 dominios, soporte Slack, extra USD 0,90/1.000 emails |
| Enterprise | Personalizado | Todo flexible |

No hay evidencia de un volumen que justifique evaluar Scale o Enterprise — el consumo real (§6) está lejos incluso del límite del plan Free.

## 10. Recomendación del CTO

🟡 **Mantener el proveedor y el plan Free, con una acción de código de bajo esfuerzo ya disponible: apuntar `email.ts` y `feedback.ts` al dominio ya verificado (`lospanalesdeamelia.cl`) en vez del dominio sandbox.**

Justificación: el consumo real (7 de 3.000 emails/mes) está muy lejos de justificar un upgrade de plan — el problema no es de volumen, es de **remitente**. El hallazgo de mayor riesgo (🔴 Alto, entrega no confiable a usuarios reales de alertas de precio) tiene una solución que no requiere upgrade ni un nuevo dominio: el dominio interino verificado hoy para el SMTP de Supabase ya está disponible en la misma cuenta de Resend, y usarlo también como remitente de `email.ts`/`feedback.ts` no consume un cupo adicional (ya está verificado, dentro del límite de 1 dominio del plan Free). Esto es una recomendación de esta revisión — no una acción ejecutada; requiere decisión explícita del CTO antes de tocar código, igual que el hallazgo de Resend en la Auditoría original.

Se deja constancia de la salvedad ya registrada al cerrar `OPS-SVC-BKL-001`: el dominio `lospanalesdeamelia.cl` es interino — si se aplica este fix ahora, habrá que repetirlo cuando se defina el dominio definitivo del proyecto.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #7, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md` (clasificación de criticidad de Resend, sin cambios). Es la segunda revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001), siguiendo el mismo formato que `PLATFORM_SERVICE_REVIEW_SUPABASE.md` (OPS-REV-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Función y evidencia de uso de Resend | Código real (`api/src/lib/email.ts`, `routes/alerts.ts`, `routes/feedback.ts`) | ✔ (§1, §2) | Inventario propio de esta revisión |
| Clasificación de criticidad | `PLATFORM_SERVICE_CATALOG.md` §6 | Heredada, sin recalcular | Esta revisión no reevalúa criticidad |
| Riesgo de dominio sandbox ya evidenciado | `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #7 | Heredado (§5), reevaluado con solución de bajo esfuerzo nueva | El dominio verificado hoy para Supabase cambia la viabilidad de la solución |
| Plan, límites y consumo real | Dashboard de Resend (Billing/Usage, verificado en vivo en esta revisión) + `resend.com/pricing` (oficial) | ✔ (§3, §4, §6, §9) | Primera vez que se confirma consumo real en vivo, no solo límites |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md` ni `PLATFORM_SERVICE_REVIEW_BACKLOG.md`. Ante una discrepancia sobre un dato de Resend entre este documento y la Auditoría, prevalece la Auditoría salvo que este documento cite evidencia más reciente (caso del hallazgo de dominios, explícitamente señalado). Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001` y `OPS-REV-001`.

## Documentos relacionados

`docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_SUPABASE.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la segunda revisión individual de servicio del backlog `OPS-BKL-001` — Resend. 10 secciones requeridas completas, ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, código real de `api/src`, `resend.com/pricing`, Dashboard de Resend (Billing/Usage) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de Resend — segundo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_RESEND.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
