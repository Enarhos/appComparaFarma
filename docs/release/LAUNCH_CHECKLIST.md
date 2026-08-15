# Launch Checklist — ComparaFarma a Producción

**Sprint:** RELEASE-004 — Launch Checklist (Auditoría primero)
**Fecha:** 2026-08-06
**Uso:** guía única, ejecutable, para el día en que ComparaFarma pase de Prueba Cerrada a Producción en Google Play. No es una checklist recurrente de cada release (para eso existe `docs/release/RELEASE_CHECKLIST.md`) — es específica de este evento de lanzamiento: verificación final de Play Console, infraestructura, QA, monitoreo con ventanas de tiempo, rollback y métricas de éxito de la primera semana.

**Este documento no repite contenido ya gobernado en otro lugar — lo referencia:**
- Evaluación de preparación (GO/NO-GO, Production Blockers): `docs/launch/PRODUCTION_READINESS_REVIEW.md` (v1.1).
- Checklist técnica recurrente de cada publicación (tests/typecheck/build/smoke tests): `docs/release/RELEASE_CHECKLIST.md`.
- Mecanismo de rollback, incidentes, secretos, backups: `docs/operations/RUNBOOK.md`.
- Diccionario completo de variables de entorno: `docs/operations/ENVIRONMENT.md`.

---

## 0. Estado al momento de crear este documento

Según `docs/launch/PRODUCTION_READINESS_REVIEW.md` v1.1 (RELEASE-003, 2026-08-06): clasificación **`AUTORIZO PUBLICACIÓN CON CONDICIONES`** (GO con acciones manuales). Los dos bloqueadores binarios de plataforma (Data Safety, Content Rating/IARC) están resueltos. Quedan abiertas 3 acciones manuales antes de poder marcar este checklist como completo: PB-3 (`eas.json`), PB-4 (`API_SECRET_KEY` en Vercel), PB-5 (assets de Play Store). Este checklist no vuelve a evaluarlas — las ejecuta.

---

## 1. Google Play Console

| Ítem | Estado conocido hoy | Verificar el día del lanzamiento |
|---|---|---|
| Versión / `versionName` | `1.4.0` (`mobile/app.json`) | ☐ Confirmar que coincide con el AAB subido |
| `versionCode` | `31` (`mobile/app.json`, `build.gradle`) | ☐ Confirmar que coincide con el AAB subido y que es mayor al último publicado |
| Track actual | Prueba Cerrada | ☐ Confirmar en Play Console → Producción → Versiones |
| Track destino | Producción | ☐ Promoción manual del track (no vía `eas submit` — ver PB-3 abajo) |
| `eas.json` (`submit.production.android.track`) | 🟡 Pendiente (PB-3, `PRODUCTION_READINESS_REVIEW.md` §4.4) | ☐ Corregir a `"production"` o confirmar por escrito que el submit será manual (AAB subido a mano) |
| Data Safety | ✅ Resuelto (verificado por Mario, RELEASE-003) | ☐ Confirmar una última vez que sigue reflejando la recolección real de datos (favoritos, historial, alertas con email, PostHog) |
| Content Rating (IARC) | ✅ Resuelto (verificado por Mario, RELEASE-003) | ☐ Confirmar que el cuestionario sigue completo, sin cambios pendientes |
| Privacy Policy (declaración en Play Console) | ✅ Resuelto (verificado por Mario, RELEASE-003) | ☐ Confirmar que la URL declarada (`https://enarhos.github.io/appComparaFarma/privacy-policy.html`) responde 200 |
| Datos de inicio de sesión / acceso a la app | ✅ Resuelto (RELEASE-003) | ☐ Sin acción — ya verificado |
| Anuncios | ✅ Resuelto (RELEASE-003) | ☐ Sin acción — ya verificado |
| Contenido y audiencia objetivo | ✅ Resuelto (RELEASE-003) | ☐ Sin acción — ya verificado |
| App Icon | 🔴 Pendiente (PB-5) — duplicado sin resolver (`mobile/assets/icon.png` vs `icon_new.png`) | ☐ Decidir cuál es el canónico, archivar el otro, confirmar cuál está subido en Play Console |
| Feature Graphic | 🔴 Pendiente (PB-5) — duplicado sin resolver (`mobile/assets/feature-graphic.png` vs `docs/screenshots/feature_graphic.png`) | ☐ Confirmar cuál está subido, archivar el otro |
| Screenshots | 🔴 Pendiente (PB-5) — solo 3 de 5-6 recomendados | ☐ Agregar 2-3 adicionales (historial de precios, alertas, carrito) antes de publicar |
| Release Notes | ⬜ Sin evidencia en el repo | ☐ Redactar y confirmar directamente en Play Console — no hay borrador previo que verificar |
| Descripción de Store Listing | ⬜ Sin confirmación posterior a `PLAY_CONSOLE_CHECKLIST.md` (2026-08-02, riesgo R-9: posible mención de solo 4 farmacias en vez de 9) | ☐ Verificar y corregir si aplica |
| Disclaimer médico en Store Listing | ⬜ Sin evidencia de haberse agregado | ☐ Agregar frase estándar ("No reemplaza la consulta médica") |

---

## 2. Infraestructura

Fuente de detalle completo: `docs/operations/ENVIRONMENT.md`. Esta sección solo lista qué verificar el día del lanzamiento, no repite la tabla de variables.

| Ítem | Verificar |
|---|---|
| Vercel — `comparafarma-api` | ☐ Root Directory = `api`; deploy más reciente en estado "Ready"; `vercel.json` con el glob de funciones vigente |
| Vercel — `comparafarma-web` | ☐ Deploy más reciente en estado "Ready" |
| Variables de entorno — Production (no solo Preview) | ☐ Repasar `ENVIRONMENT.md` completo contra el dashboard de Vercel de ambos proyectos |
| `API_SECRET_KEY` | 🟡 Pendiente (PB-4, sin confirmación nueva) — ☐ Confirmar directamente en Vercel → `comparafarma-api` → Settings → Environment Variables. Es la única variable fail-open: sin ella, `/api/search` queda sin autenticación (`ENVIRONMENT.md`, "Variables de mayor riesgo operacional") |
| HTTPS | ☐ Automático (gestionado por Vercel) — sin acción, solo confirmar candado visible en ambos dominios |
| Dominio | ☐ Confirmar que se sigue usando `*.vercel.app` (sin dominio propio configurado hoy) — si se agrega uno antes del lanzamiento, actualizar `SITE_URL`/`API_PUBLIC_URL`/`WEB_APP_URL` |
| Health Check | ☐ `curl https://comparafarma-api.vercel.app/api/health` → `200`, `"ok":true`, `commit` coincide con el SHA del deploy vigente |
| Redis (Upstash) | ☐ `dependencies.redis` en `/api/health` — si `"not_configured"`, el sistema sigue funcionando con rate-limit en memoria (no bloqueante, pero confirmar que es la condición esperada) |
| Supabase | ☐ `dependencies.supabase` en `/api/health` — debe estar `"ok"`, no `"degraded"` ni `"not_configured"`, dado que ya contiene PII real (favoritos, alertas, suscripciones) |
| Algolia | ☐ Confirmar `ALGOLIA_APP_ID`/`ALGOLIA_API_KEY` configuradas — sin ellas, Salcobrand desaparece silenciosamente de los resultados (sin error visible) |

---

## 3. QA Final

Checklist funcional antes de publicar. Los pasos de tests/typecheck/build/CI ya están definidos y no se repiten aquí — ejecutar `docs/release/RELEASE_CHECKLIST.md` secciones 1-4 y 9-10 completas antes de continuar con esta sección.

**Paso funcional manual (dispositivo o emulador, contra la API ya desplegada en Producción):**

- [ ] Búsqueda: escribir "paracetamol" → resultados de al menos 5 de las 9 farmacias en menos de 3 segundos.
- [ ] Resultados: el precio más bajo aparece primero; tocar una fila abre la Ficha del medicamento.
- [ ] Ficha del medicamento: cada farmacia muestra su precio efectivo y canal; el badge "Mejor precio" aparece en la farmacia correcta.
- [ ] Favoritos: agregar y quitar un medicamento desde la Ficha; confirmar que aparece en la sección de favoritos de Home.
- [ ] Alertas: crear una alerta de precio desde la Ficha; confirmar que el ícono de campana cambia de estado; editarla y eliminarla.
- [ ] Historial de precios: confirmar que el gráfico se muestra (o el estado "empezamos a registrar" si es la primera vez) sin errores.
- [ ] Carrito: agregar 2+ medicamentos y confirmar la comparación por farmacia.
- [ ] Compartir: confirmar que el share nativo produce el texto "Medicamento — desde $X en Farmacia".
- [ ] Modo oscuro: alternar el tema del sistema y confirmar que ninguna pantalla queda illegible.
- [ ] Endpoint de debug: `curl ".../api/search?q=paracetamol&debug=1"` sin `x-api-key` → `401`/`403`, nunca `200` (repetido aquí por ser el smoke test de mayor riesgo de seguridad, ver PB-4).

---

## 4. Monitoreo

Herramientas ya existentes (detalle completo en `docs/operations/RUNBOOK.md` §6) — esta sección define **cuándo** revisar cada una, específicamente para el lanzamiento, no qué son.

### Primera hora
- [ ] Revisar `/api/health` manualmente cada 10-15 minutos (antes de que corra la primera ejecución automática de `monitor-api.yml`).
- [ ] Revisar Play Console → Producción → Estadísticas de versión: confirmar que la publicación se está distribuyendo sin errores de instalación reportados.
- [ ] Revisar Sentry (`comparafarma-api`) por cualquier excepción nueva no vista antes del lanzamiento.

### Primeras 24 horas
- [ ] Confirmar al menos 2 corridas verdes de `monitor-api.yml` (corre cada hora) sin issues nuevos con label `monitoring`.
- [ ] Revisar Play Console → Calidad → Android Vitals: tasa de crashes/ANR de la nueva versión vs. la anterior.
- [ ] Revisar en Supabase que `price_history`, `email_alerts` y `subscriptions` están recibiendo escrituras nuevas (sin errores de conexión).
- [ ] Revisar el dashboard de PostHog (evento `medication_search`, único evento instrumentado en mobile) para confirmar que sigue llegando tráfico — no hay evento de instalación ni de apertura de app, solo de búsqueda.

### Primeras 72 horas
- [ ] Revisar tendencia de Android Vitals (no solo el snapshot de las 24h) — un crash raro que solo aparece con volumen puede no verse en el primer día.
- [ ] Revisar calificación y primeras reseñas en Play Console → Calificaciones y opiniones.
- [ ] Confirmar que ninguna de las 9 farmacias quedó con 0 resultados de forma sostenida (`?debug=1` con `x-api-key`).

### Primera semana
- [ ] Consolidar las métricas de la sección 6 con los datos reales disponibles a esa fecha.
- [ ] Decidir si el staged rollout (si se usó, ver sección 5) avanza al 100% o se pausa.
- [ ] Revisar `docs/product/DECISION_LOG.md` — registrar cualquier incidente o corrección ocurrida durante la semana de lanzamiento.

---

## 5. Rollback

El mecanismo completo (backend, web, mobile) ya está definido en `docs/operations/RUNBOOK.md` §2 — esta sección no lo repite, solo fija el criterio de decisión específico del día del lanzamiento.

**Cuándo activar rollback:**
- [ ] `/api/health` cae o responde con errores sostenidos por más de 5 minutos → rollback de `api/` (Vercel → Deployments → Promote to Production del deploy anterior, `RUNBOOK.md` §2).
- [ ] Tasa de crashes de la nueva versión en Android Vitals supera de forma clara a la versión anterior en las primeras 24-72h → **no existe rollback de Play Store una vez publicado** (`RUNBOOK.md` §2) — las dos opciones reales son: (a) pausar/reducir el staged rollout si se usó uno, o (b) publicar un `versionCode` nuevo con el fix, o `eas update` si el bug es solo JS/TS sin cambios nativos.
- [ ] Un smoke test de `docs/release/RELEASE_CHECKLIST.md` §10 falla después de publicar → seguir ese mismo procedimiento de rollback antes de continuar con cualquier otro paso (ya definido en `RELEASE_CHECKLIST.md` §11).

**Recomendación específica de este lanzamiento (primera publicación real a Producción, viniendo de Prueba Cerrada):** usar un **staged rollout** en Play Console (por ejemplo, 20% → 50% → 100%, con al menos 24h entre cada incremento) en vez de publicar al 100% de inmediato — esto es una funcionalidad ya disponible en Play Console, no un desarrollo nuevo, y es la única forma real de "reducir" una publicación de Play Store una vez que salió (`RUNBOOK.md` §2, "Mobile").

**Quién decide:** el rollback de `api/`/`web/` puede ejecutarlo directamente quien tenga acceso a Vercel (sin aprobación adicional, es reversible). Pausar o detener el staged rollout de `mobile/` en Play Console requiere confirmación de Mario (dueño de la cuenta de Play Console).

---

## 6. Métricas de éxito — primera semana

Fuente de cada métrica indicada explícitamente. Donde no existe instrumentación real hoy, se señala — este documento no inventa un origen de datos que no existe.

| Métrica | Fuente real hoy | Observación |
|---|---|---|
| Instalaciones | Play Console → Estadísticas → Instalaciones | Disponible sin acción adicional |
| Usuarios activos (DAU/WAU) | ⬜ **Sin fuente instrumentada.** No hay analítica de sesión/apertura de app en `mobile/` ni `web/` (`PRODUCTION_READINESS_REVIEW.md` §4.2, "Analytics: un solo evento en mobile, cero en web") | No reportar un número — señalar explícitamente que no se puede medir hoy |
| Búsquedas | PostHog, evento `medication_search` (`mobile/src/lib/analytics.ts`) — **solo mobile, cero en `web/`** | Cuenta búsquedas, no usuarios ni sesiones |
| Favoritos | ⬜ **Sin fuente instrumentada.** `favoritesStore.ts` persiste solo en `AsyncStorage` local — ningún evento se envía a analítica | No reportar un número |
| Alertas creadas | ⬜ **Sin fuente instrumentada.** `alertsStore.ts` persiste solo en `AsyncStorage` local — ningún evento se envía a analítica | No reportar un número |
| Crashes | Play Console → Calidad → Android Vitals; Sentry (`comparafarma-api`) para errores de backend — Sentry en `mobile/` es condicional a `EXPO_PUBLIC_SENTRY_DSN`, no verificable desde el repo si está seteada en el build de producción | Confirmar antes del lanzamiento si Sentry mobile está activo, o depender solo de Android Vitals |
| Errores de backend | Sentry (`comparafarma-api`) + campo `dependencies` de `/api/health` | Disponible sin acción adicional |
| Rating | Play Console → Calificaciones y opiniones | Disponible sin acción adicional |
| Reseñas | Play Console → Calificaciones y opiniones | Disponible sin acción adicional; considerar revisión manual diaria la primera semana |

---

## Registro de uso

Cada vez que se ejecute esta checklist para el lanzamiento real o una promoción de track relevante, agregar una fila.

| Fecha | Evento | Resultado |
|---|---|---|
| — | — | (sin registros todavía — este documento se creó en RELEASE-004, 2026-08-06) |
