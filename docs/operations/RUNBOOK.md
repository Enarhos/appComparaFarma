# Runbook Operacional — ComparaFarma

**Sprint:** RC-03 — Production Readiness: Observability & Operations
**Fecha:** 2026-08-06
**Objetivo:** permitir que cualquier persona con acceso al repo y a Vercel/Supabase/GitHub pueda operar, mantener y recuperar el sistema sin depender de conocimiento tácito.

> **Trazabilidad (2026-08-13):** para un inventario completo de qué servicios existen, quién es dueño de cada uno y su criticidad, ver `docs/operations/PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001) — este Runbook sigue siendo la única fuente de los procedimientos en sí.

Servicios en producción:
- **Backend** (`api/`): `https://comparafarma-api.vercel.app` — proyecto Vercel `comparafarma-api`.
- **Web** (`web/`): `https://www.preciosfarma.cl` — proyecto Vercel propio (deploy automático de Vercel al detectar push, no pasa por `ci.yml`).
- **Mobile** (`mobile/`): Google Play, package `mla.app.comparafarma`.
- **Base de datos**: Supabase (opcional pero usada en producción para historial de precios, config, feedback, alertas, suscripciones).
- **Caché/rate limit**: Upstash Redis (opcional, fallback a memoria).

---

## 1. Despliegue

### Backend (`api/`)
Automático: push a `main` → `.github/workflows/ci.yml` → jobs `typecheck`, `domain-tests`, `api-tests`, `web-build` → si los 3 primeros pasan, `deploy-api` corre `vercel deploy --prod` **desde la raíz del monorepo** (no desde `api/` — ver advertencia en `CLAUDE.md` sobre `EUNSUPPORTEDPROTOCOL`). Desde RC-03, el job incluye un smoke test post-deploy (`curl` a `/api/health`, 3 reintentos) que falla el job en rojo si el deploy no responde correctamente.

Reglas que no deben romperse (post-mortem `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`):
1. El deploy corre sin `working-directory: api` en `ci.yml`.
2. En el dashboard de Vercel del proyecto `comparafarma-api`, Root Directory = `api`.
3. `api/vercel.json` mantiene el glob explícito `"functions": {"api/*.ts": {...}}`.
4. `packages/domain` se compila a JS real vía `postinstall` — no apuntar `exports` a `src/`.

### Web (`web/`)
Deploy automático de Vercel (proyecto propio, no pasa por GitHub Actions) al detectar push a la rama conectada. Sin pasos manuales adicionales salvo confirmar que las env vars de `web/.env.example` estén configuradas en el proyecto `comparafarma-web` de Vercel.

### Mobile (`mobile/`)
Ver `docs/archive/releases/RELEASE_CHECKLIST.md` — build manual (`pnpm build:android` o EAS), firma con `release.keystore`, subida manual a Play Console.

---

## 2. Rollback

### Backend
Vercel mantiene todos los deploys anteriores. Rollback:
1. Ir a Vercel → proyecto `comparafarma-api` → pestaña **Deployments**.
2. Ubicar el último deploy estable (antes del problemático) — verificar por fecha/commit.
3. Click en **"..."** → **Promote to Production**.
4. Confirmar con `curl https://comparafarma-api.vercel.app/api/health` que el campo `commit` corresponde al SHA esperado.
5. Si el problema fue introducido por un commit ya en `main`, además hacer `git revert <sha>` y pushear, para que el próximo deploy automático no reintroduzca el bug.

### Web
Mismo mecanismo (Vercel → Deployments → Promote to Production) en el proyecto `comparafarma-web`.

### Mobile
No hay rollback de Play Store una vez publicado en producción — usar **staged rollout** (Play Console permite pausar/reducir el porcentaje de usuarios en un rollout activo) o publicar un nuevo `versionCode` con el fix. Para bugs de solo JS/TS (sin cambios nativos), usar `eas update --branch production` en vez de un build nuevo — más rápido, sin pasar por revisión de Play Store.

---

## 3. Recuperación ante fallos

| Síntoma | Causa probable | Acción |
|---|---|---|
| `/api/health` no responde (timeout/5xx) | Deploy roto o función crasheando en runtime | Revisar logs en Vercel → proyecto → Deployments → último deploy → Function Logs. Si es reciente, rollback (sección 2). |
| `/api/search` devuelve resultados de menos de 9 farmacias de forma persistente | Scraper de una farmacia roto (ver sección "Incidentes frecuentes") | Revisar `?debug=1` con `x-api-key` válida para ver el `errorMessage` específico de la farmacia afectada. |
| Emails de feedback/alertas no llegan | `RESEND_API_KEY` no configurada, o Resend caído | Revisar logs `[feedback] resend status` / `[email] resend status` en Vercel. Si `RESEND_API_KEY` está bien configurada y Resend responde con error, revisar el dashboard de Resend directamente. |
| Historial de precios no se está grabando | Supabase no configurado o caído | `/api/health` → campo `dependencies.supabase`. Si es `"degraded"`, revisar el dashboard de Supabase (Project → Database → estado). Si es `"not_configured"`, faltan `SUPABASE_URL`/`SUPABASE_SECRET_KEY` en Vercel. |
| Rate limiting no funciona entre invocaciones | Redis no configurado o caído | `/api/health` → campo `dependencies.redis`. El sistema sigue funcionando con rate-limit en memoria (por instancia serverless, menos preciso) — no es una caída total. |
| Alertas de precio no se disparan | `CRON_SECRET` mal configurado, o el workflow `check-price-alerts.yml` falló | Revisar la pestaña Actions → `check-price-alerts.yml`. Ejecutar manualmente `curl -X POST "https://comparafarma-api.vercel.app/api/alerts?action=check&secret=$CRON_SECRET"` para reproducir. |
| Deploy de `api/` "exitoso" en Vercel pero la API no responde | Ver postmortem PM-001 — típicamente un problema de resolución de `@comparafarma/domain` | Revisar Function Logs en Vercel buscando `ERR_MODULE_NOT_FOUND`. Confirmar que `packages/domain/dist/` se compiló en el build (revisar el build log del deploy). |

---

## 4. Rotación de secretos

Todas las variables se configuran en Vercel → proyecto → Settings → Environment Variables (por proyecto: `comparafarma-api` y `comparafarma-web`, por separado).

1. **`API_SECRET_KEY`**: generar un valor aleatorio largo (`openssl rand -hex 32`), actualizarlo en Vercel (ambos proyectos si `web/` también lo usa para el header admin), y en el secret `API_SECRET_KEY` de GitHub Actions (usado por `monitor-api.yml`). Un cambio de esta key invalida inmediatamente cualquier cliente que la tenga hardcodeada — coordinar con `mobile/` si en el futuro empieza a usarla.
2. **`CRON_SECRET`** / **`GOOGLE_RTDN_SECRET`**: regenerar y actualizar en Vercel. `GOOGLE_RTDN_SECRET` también debe actualizarse en la configuración del tópico de Pub/Sub en Play Console (ver CF-114).
3. **`RESEND_API_KEY`**, **`ALGOLIA_API_KEY`**, **`SUPABASE_SECRET_KEY`**, **`FLOW_SECRET_KEY`**, **`KHIPU_SECRET`**: regenerar en el dashboard del proveedor correspondiente, luego actualizar en Vercel. Ninguna de estas keys se usa fuera de `api/` (nunca se envían al cliente), así que la rotación no requiere coordinar con `mobile/`/`web/`.
4. Después de rotar cualquier secreto: forzar un redeploy (Vercel no relee env vars de deploys ya construidos) y verificar `/api/health` + un smoke test manual del flujo afectado.

## 5. Renovación de certificados

- **TLS**: gestionado automáticamente por Vercel para todos los dominios (`*.vercel.app` y dominios propios conectados) — no requiere acción manual.
- **Firma de Android (`release.keystore`)**: no expira en la práctica (validez hasta 2053, ver auditoría RC-02). **Actualización 2026-08-15:** Google Play App Signing está confirmado habilitado para `mla.app.comparafarma` (verificado por el CTO en Play Console → Setup → App integrity) — el `release.keystore` local es la *upload key*, no la clave definitiva de firma. Si se pierde, **sí hay recuperación**: Google Play permite un reset de upload key (ver `docs/archive/releases/PLAY_CONSOLE_CHECKLIST.md` para el procedimiento de comparación de huellas SHA-1/SHA-256). Sigue siendo recomendable mantener un backup fuera del repo para evitar la fricción de ese proceso, pero ya no es una condición de "sin recuperación posible" — ver `docs/operations/PLATFORM_OPERATIONAL_STATUS.md`.

---

## 6. Monitoreo

- **`monitor-api.yml`**: corre cada hora, valida `/api/health` y la cobertura de las 9 farmacias vía `api/scripts/check-production-health.mjs`. Desde RC-03, distingue severidad: 1-2 farmacias aisladas caídas = `warning` (se registra en el artefacto, no crea issue); 3+ farmacias o `/api/health` caído = `critical` (crea/comenta un issue con label `monitoring`, asignado al owner). El reporte completo queda como artefacto descargable en cada corrida (Actions → run → Artifacts → `api-healthcheck-report`).
- **`check-price-alerts.yml`**: corre diario, dispara la revisión de alertas de precio. Desde 2026-08-13, replica el mismo patrón de `monitor-api.yml`: si la revisión falla, crea un issue con label `monitoring` asignado al owner (antes solo dejaba el workflow en rojo, sin alerta visible fuera de la pestaña Actions). Acción: se agregó `id`+`continue-on-error` al step de disparo, un step de creación de issue condicionado a su fallo, y un step final que preserva el job en rojo. Evidencia: `.github/workflows/check-price-alerts.yml`; validado con `yaml.safe_load` (sintaxis correcta) y revisión manual contra el patrón ya en producción de `monitor-api.yml`.
- **Sentry** (`comparafarma-api`, región US): captura excepciones no controladas de `api/`. Revisar el dashboard de Sentry para stack traces completos — nunca se exponen al cliente (ver `RELEASE_CHECKLIST.md`/hallazgos de error handling).
- **`/api/health`**: enriquecido en RC-03 con `environment`, `commit`, `uptimeSeconds`, `memoryMb`, y `dependencies.{redis,supabase,algolia}`. Usar para diagnóstico rápido sin necesidad de revisar logs.

## 7. Incidentes frecuentes

- **Ahumada devuelve 0 resultados**: scraper basado en regex sobre HTML de Demandware — frágil por diseño (documentado en `CLAUDE.md`). Señal: búsquedas comunes sin resultados de Ahumada en `?debug=1`. Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`/`linkM`/`badgeM` en `api/src/clients/ahumada.ts`, publicar vía deploy normal (no requiere build de mobile).
- **Sermecoop timeout**: scraper HTML con flujo GET→POST + PHPSESSID + CSRF, propenso a exceder el timeout de 30s de las funciones de Vercel (`api/vercel.json` → `maxDuration: 30`). Señal: `errorMessage` con "timeout" en `?debug=1` para `sermecoop`. No hay fix estructural disponible hoy — es un riesgo aceptado del proveedor.
- **Salcobrand desaparece de los resultados**: casi siempre `ALGOLIA_APP_ID`/`ALGOLIA_API_KEY` mal configuradas o rotadas sin actualizar Vercel — no genera error visible, solo 0 resultados de esa farmacia.
- **Un usuario reporta que una alerta de precio nunca llegó**: revisar en Supabase la tabla `email_alerts` por el email/token del usuario (no loguear el email en texto libre al investigar — usar la consulta SQL directa en el dashboard de Supabase). Confirmar `status` de la alerta y `RESEND_API_KEY` configurada en el momento del disparo esperado.

## 8. Backup

- **Supabase**: backups automáticos diarios gestionados por Supabase (plan del proyecto) — verificar en Supabase Dashboard → Database → Backups qué plan de retención aplica. No hay backup adicional gestionado por este repo.
- **Código**: GitHub es la fuente de verdad; no se requiere backup adicional.
- **Secrets/credenciales**: las credenciales de Vercel/Supabase/Resend/Algolia/Flow/Khipu no tienen backup fuera de los dashboards de cada proveedor — si se pierde acceso a un proveedor, el procedimiento es regenerar credenciales nuevas (rotación, sección 4), no "restaurar" las anteriores.
- **Keystore de firma Android**: existen copias de `release.keystore` en `mobile/` (ver auditoría RC-02) — **estas copias deben respaldarse fuera del repo** (el archivo está en `.gitignore`, no se sube a GitHub). Guardar una copia cifrada en un gestor de contraseñas o vault separado; sin él, no se puede publicar ninguna actualización futura de la app.

## 9. Restauración

- **Base de datos**: restaurar desde el backup de Supabase (Dashboard → Database → Backups → Restore) — afecta a todo el proyecto, no hay restauración parcial por tabla desde la UI estándar.
- **Backend/Web**: no requieren "restauración" en el sentido de datos — un rollback de deploy (sección 2) es equivalente a restaurar el código a un estado anterior conocido.
- **Configuración (env vars)**: no hay backup automático de las env vars de Vercel. Mantener `docs/operations/environment/ENVIRONMENT.md` actualizado como referencia de qué variables deben existir es la mitigación — considerar exportar manualmente los valores no secretos a un lugar seguro tras cada cambio de configuración.

## 10. Mantenimiento

- Revisar mensualmente `docs/product/decisions/DECISION_LOG.md` y los postmortems de `docs/engineering/postmortems/` para detectar patrones recurrentes.
- Revisar trimestralmente las dependencias de `api/package.json`, `web/package.json`, `mobile/package.json` por vulnerabilidades conocidas (`pnpm audit`).
- Revisar antes de cada release el checklist de `docs/archive/releases/RELEASE_CHECKLIST.md`.
- **Resuelto (2026-08-15, limpieza de gobierno documental):** los documentos que estaban vacíos en `docs/product/` (`BACKLOG_TECH.md`, `KPIS.md`, `RELEASES.md`, `IDEAS.md`, `QUALITY.md`, `DATA_POLICY.md`) se confirmaron con 0 bytes y sin contenido recuperable, y se eliminaron — la decisión pendiente que señalaba este punto ya se tomó (descartados, no poblados).
