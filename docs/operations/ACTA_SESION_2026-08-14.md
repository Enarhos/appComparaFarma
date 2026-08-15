# Acta de Sesión — 2026-08-14

**Tipo:** Registro de trabajo (no es un documento gobernado bajo `GOV-TPL-001` — es una bitácora de sesión, de referencia puntual, no una fuente de verdad recurrente).

**Participantes:** Mario Belford (CTO), Claude.

**Duración:** Sesión completa del 2026-08-14 (con continuación al 2026-08-15 para cierre de acta).

**Objetivo de la sesión:** cerrar el bug de recuperación de contraseña en Supabase Auth, y avanzar sistemáticamente el backlog de revisión de servicios externos (`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, OPS-BKL-001) uno por uno, en orden de criticidad.

---

## 1. Resumen ejecutivo

Se cerraron **7 revisiones de servicio** del backlog (de 16 totales), se pausó 1 a pedido explícito del CTO, y se ejecutaron y validaron en producción **4 correcciones reales de código/configuración** — no solo documentación. Se encontraron dos hallazgos de severidad alta que no estaban en la Auditoría original (`PRODUCTION_INFRASTRUCTURE_AUDIT.md`) y que quedan como decisiones pendientes del CTO, no técnicas: el uso del plan Hobby de Vercel mientras ComparaFarma solicita donaciones activamente, y el bloqueo total (HTTP 403) del fetch automatizado de datos de MINSAL desde el día en que se creó ese mecanismo.

## 2. Ítems de backlog revisados y cerrados

| ID | Servicio | Resultado | Documento |
|---|---|---|---|
| OPS-SVC-BKL-001 | Supabase | 🟢 Mantener Free. SMTP propio configurado (dominio interino `lospanalesdeamelia.cl`), límite de envío subido de 2 a 30 emails/hora. | `PLATFORM_SERVICE_REVIEW_SUPABASE.md` (OPS-REV-001) |
| OPS-SVC-BKL-002 | Resend | 🟢 Mantener Free. Dominio de envío corregido (sandbox → dominio verificado) y API key inválida reemplazada. | `PLATFORM_SERVICE_REVIEW_RESEND.md` (OPS-REV-002) |
| OPS-SVC-BKL-007/008 | Expo / EAS | 🟡 Mantener Free con vigilancia de MAU de OTA (1/1.000 hoy, el techo más bajo del inventario). | `PLATFORM_SERVICE_REVIEW_EXPO_EAS.md` (OPS-REV-003) |
| OPS-SVC-BKL-003 | Algolia | 🟢 Sin acción — credenciales de Salcobrand, no cuenta propia. | `PLATFORM_SERVICE_REVIEW_ALGOLIA.md` (OPS-REV-004) |
| OPS-SVC-BKL-004 | Vercel | 🔴 Hallazgo crítico nuevo — ver §3. | `PLATFORM_SERVICE_REVIEW_VERCEL.md` (OPS-REV-005) |
| OPS-SVC-BKL-005/006 | GitHub + Actions | 🟡 Repo público confirmado (resuelve a favor la duda de minutos de Actions); hallazgo nuevo de exposición de código de scraping. | `PLATFORM_SERVICE_REVIEW_GITHUB.md` (OPS-REV-006) |
| OPS-SVC-BKL-015 | MINSAL | 🟠 Hallazgo crítico nuevo, corregido parcialmente — ver §3. | `PLATFORM_SERVICE_REVIEW_MINSAL.md` (OPS-REV-007) |

**Pausado a pedido explícito del CTO:** OPS-SVC-BKL-010 (Flow) — el pago de suscripción aún no se activa; no se revisa hasta que se decida activarlo.

**Sin tocar en esta sesión:** OPS-SVC-BKL-016 (las 9 farmacias) — puesto en pausa deliberadamente por el CTO al inicio de esta ronda, para revisar después. OPS-SVC-BKL-009 (Redis), 011 (Google Play Console), 012 (Sentry), 013 (PostHog), 014 (Khipu) — quedan pendientes para la próxima sesión.

## 3. Hallazgos relevantes de esta sesión

### 3.1 Bug de recuperación de contraseña (Supabase Auth) — resuelto

Diagnóstico inicial: se sospechaba pérdida del fragmento de URL en Android/Gmail. Evidencia real (recolectada vía una sesión de Claude Code corriendo en el entorno de Mobile del CTO) descartó esa hipótesis: el link llegaba intacto pero con `otp_expired`. Causa real identificada: el enlace de recuperación de Supabase es de un solo uso y los escáneres automáticos de seguridad de email (Gmail, Microsoft Safe Links, etc.) lo consumen antes de que el usuario haga clic — un problema documentado oficialmente por Supabase. Fix implementado: página `web/src/app/auth/confirmar/page.tsx`, inerte al prefetch, con confirmación manual antes de llamar a `verifyOtp`. Reutiliza el manejo de deep link ya existente en Mobile sin tocar código de `mobile/`. Validado de punta a punta en Web y Mobile.

### 3.2 Vercel Hobby + uso comercial (donaciones) — 🔴 decisión pendiente del CTO

`vercel.com/docs/limits/fair-use-guidelines` prohíbe explícitamente uso comercial en el plan Hobby y lista **"Asking for Donations"** como ejemplo textual. `mobile/src/constants/donation.ts` confirma que ComparaFarma solicita donaciones activas vía Khipu en producción. Es un incumplimiento de términos vigente hoy, con riesgo de pausa de cuenta sin aviso garantizado que afectaría `comparafarma-api` y `comparafarma-web` a la vez (mismo team). Dos caminos documentados en `PLATFORM_SERVICE_REVIEW_VERCEL.md` §8-10: (A) pagar el upgrade a Pro ($20/mes), o (B) dar de baja el `DonationBanner`/toda funcionalidad de pago (incluyendo no activar Flow mientras se esté en Hobby). Ninguna acción ejecutada — es una decisión de negocio, no técnica.

### 3.3 MINSAL — fetch automatizado roto desde su creación — 🟠 corregido parcialmente

`api/src/data/branches.json` mostraba `"coverage": "1/7 días acumulados"` congelado desde 2026-06-09. Diagnóstico en vivo (acceso directo a la pestaña Actions vía navegador conectado del CTO) confirmó la causa raíz: **las 71/71 ejecuciones de `update-branches.yml` desde su creación fallan con `MINSAL HTTP 403`** — MINSAL bloquea también las IPs de GitHub Actions, no solo las de Vercel. El dato que sirve `/api/branches` hoy es una carga manual congelada de junio. Hallazgo secundario: la versión mejorada del workflow (con alerta de fallo por issue) existía solo localmente, nunca se había subido a `origin/main` — mismo patrón de "commit local no fusionado" ya visto 4 veces antes en esta sesión. **Acción ejecutada y validada:** se subió esa versión mejorada a producción (commit `2d5691f`). El bloqueo de IP de MINSAL en sí sigue sin resolver — requiere decisión del CTO (IP residencial/self-hosted runner, o aceptar el dato desactualizado).

### 3.4 Patrón recurrente: commits locales nunca fusionados a `origin/main`

Detectado y corregido **5 veces** en esta sesión: el link "¿Olvidaste tu contraseña?" en Web, el enriquecimiento de `/api/health`, el link "Mi cuenta" en Web Home, el dominio de envío de Resend, y la alerta de fallo de `update-branches.yml`. En cada caso, el fix ya existía como commit local pero nunca había llegado a producción. Mecanismo usado para desplegar sin credenciales de push directas: worktree aislado desde `origin/main` → cherry-pick del cambio exacto → verificación de diff → comandos entregados al CTO para ejecutar desde su máquina → verificación posterior contra `origin/main`.

### 3.5 API key de Resend inválida — hallazgo no anticipado, corregido

Durante la validación del fix de dominio de Resend, las alertas de precio seguían sin llegar. Diagnóstico (Resend Logs → Vercel Function Logs) reveló `403 Forbidden`: la `RESEND_API_KEY` configurada en Vercel desde mayo correspondía a una key que ya no existía en la cuenta de Resend. Se creó una key nueva dedicada (`api-alerts-feedback`) y se actualizó en Vercel. Validado con una alerta de precio real, confirmada y entregada por email.

## 4. Acciones ejecutadas y desplegadas en producción hoy

1. SMTP propio configurado en Supabase Auth (dominio interino `lospanalesdeamelia.cl`).
2. Página `web/src/app/auth/confirmar/page.tsx` — fix del bug de recuperación de contraseña.
3. `api/src/lib/email.ts` + `api/src/routes/feedback.ts` — dominio de envío de Resend corregido.
4. Nueva API key de Resend creada y actualizada en Vercel (`api-alerts-feedback`).
5. Link "¿Olvidaste tu contraseña?" (Web), enriquecimiento de `/api/health`, y link "Mi cuenta" (Web Home) — recuperados de commits locales nunca fusionados y desplegados.
6. `.github/workflows/update-branches.yml` — alerta de fallo por issue desplegada (commit `2d5691f`).

## 5. Decisiones pendientes del CTO (no ejecutables desde código)

- **Vercel:** ¿pagar Pro ($20/mes) o dar de baja el `DonationBanner`/pagos mientras se esté en Hobby? (§3.2)
- **MINSAL:** ¿cómo evitar el bloqueo de IP (residencial/self-hosted) o aceptar el dato de sucursales desactualizado indefinidamente? (§3.3)
- **GitHub:** ¿mantener el repositorio público (código de scraping expuesto) o privatizarlo (pierde minutos gratis de Actions, requiere Pro para Pages)?
- **Dominio interino de Resend/Supabase:** `lospanalesdeamelia.cl` sigue en uso hasta que se decida el dominio definitivo del proyecto (pendiente por el cambio de nombre de "comparafarma").
- **Flow:** pausado — retomar solo cuando se decida activar el cobro de suscripciones.

## 6. Próximos pasos (sesión siguiente)

Continuar el backlog en el orden ya establecido: **Google Play Console** (Media, siguiente), luego **Sentry, PostHog, Khipu** (Baja). Las **9 farmacias** (Alta criticidad) siguen en pausa deliberada — no retomar sin pedido explícito del CTO.

---

**Nota:** esta acta no reemplaza los documentos de revisión individuales (`PLATFORM_SERVICE_REVIEW_*.md`) ni el backlog (`PLATFORM_SERVICE_REVIEW_BACKLOG.md`) — es un resumen narrativo de la sesión para continuidad entre días de trabajo.
