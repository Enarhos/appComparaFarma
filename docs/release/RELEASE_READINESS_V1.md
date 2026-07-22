# Release Readiness Review — ComparaFarma v1.4.0
**Revisión:** 2026-06-30  
**Rol:** Staff Engineer + Release Manager  
**Versión evaluada:** 1.4.0 / versionCode 30  
**Target:** Google Play Producción  
**Estado previo:** Prueba Interna activa (vc30 subido)

---

## Índice

1. [Google Play](#1-google-play)
2. [Calidad](#2-calidad)
3. [Observabilidad](#3-observabilidad)
4. [Backend](#4-backend)
5. [Seguridad](#5-seguridad)
6. [Datos](#6-datos)
7. [UX](#7-ux)
8. [Operación](#8-operación)
9. [Score General](#score-general)
10. [Top 10 Tareas antes de Producción](#top-10-tareas-antes-de-producción)
11. [Riesgos Críticos](#riesgos-críticos)
12. [Recomendación Final](#recomendación-final)

---

## 1. Google Play

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 1.1 | Store Listing | 🟡 Parcial | Alta | Nombre, versión e ícono OK. No se verificó que la descripción larga (≥80 palabras), descripción corta y novedades de la versión estén actualizadas en Play Console. | Revisar y actualizar ficha en Play Console con descripción de funcionalidades v1.4.0 (historial precios, alertas, 9 farmacias). |
| 1.2 | Feature Graphic | 🟢 Completo | — | `docs/screenshots/feature_graphic.png` (1024×500) existe, lista las 9 farmacias y muestra propuesta de valor. | — |
| 1.3 | Screenshots | 🟡 Parcial | Alta | 3 capturas de teléfono (Home, Resultados, Detalle). Play Store acepta hasta 8. No hay screenshots de 7" tablet ni de flows clave (alertas, historial). | Agregar 2–3 capturas adicionales: alerta de precio, filtro por farmacia, modo oscuro. |
| 1.4 | Adaptive Icon | 🟢 Completo | — | `adaptive-icon.png` con `backgroundColor: #16a34a` configurado en `app.json`. | — |
| 1.5 | Privacy Policy | 🟢 Completo | Alta | URL publicada en GitHub Pages: `enarhos.github.io/appComparaFarma/privacy-policy.html`. Enlazada en Play Console. | Verificar que la URL sea accesible y refleje las 9 farmacias y el uso de PostHog/Sentry. |
| 1.6 | Data Safety | 🔴 Pendiente | **Bloqueante** | El formulario de Data Safety en Play Console no está documentado como completado. Google lo exige para publicar en Producción. La app usa AsyncStorage (local), PostHog (analytics), Sentry (crashes) y no recopila datos personales explícitamente. | Completar el formulario en Play Console: declarar crash reporting (Sentry), analytics de uso (PostHog), sin recolección de datos personales. Sin esto el app **no puede publicarse**. |
| 1.7 | Target SDK | 🟡 Parcial | Alta | Expo SDK 54 genera `targetSdkVersion` automáticamente, pero no está explícito en `app.json`. Google exige targetSdkVersion ≥ 34 (Android 14) desde agosto 2024. | Verificar en el AAB generado que `targetSdkVersion=34` o superior. Revisar en Play Console la sección "Bundle analysis" o ejecutar `aapt2 dump badging app-release.aab`. |
| 1.8 | Versionado | 🟢 Completo | — | `version: 1.4.0`, `versionCode: 30`. Historial limpio en Prueba Interna. Próximo código libre: 31+. | — |
| 1.9 | Firma | 🟡 Parcial | Alta | Build local via `pnpm build:android` genera AAB firmado localmente. No se confirmó si la keystore está respaldada de forma segura ni si Google Play App Signing está habilitado. | Habilitar Google Play App Signing (delega la firma final a Google). Guardar la keystore de subida fuera del repo, en lugar seguro. |
| 1.10 | Permisos | 🟢 Completo | — | `"permissions": []` en `app.json`. Expo agrega `INTERNET` automáticamente (necesario). Sin permisos sensibles (cámara, ubicación, contactos). | — |
| 1.11 | Deep Links | 🟡 Parcial | Baja | `scheme: comparafarma` configurado en `app.json`. Android App Links (HTTPS verified links) no configurados. | No bloqueante para v1. Considerar para v2 si se implementan links directos a detalle de medicamento. |

---

## 2. Calidad

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 2.1 | Tests — dominio | 🟢 Completo | — | `@comparafarma/domain`: 38 tests en 5 suites (matching, normalization, pricing, deduplication, contract snapshots). Cobertura de casos de regresión críticos (Trio-Val, Co-Amoxiclav, Tri Fen). | — |
| 2.2 | Tests — API | 🟢 Completo | — | `api/src/__tests__/`: tests de normalización y `searchService`. Vitest integrado en CI. | Agregar tests para los middlewares (auth, rateLimit) y casos de error HTTP de los clientes de farmacia. |
| 2.3 | Tests — mobile (unitarios) | 🔴 Pendiente | Media | No existen tests unitarios para componentes React Native, hooks o stores Zustand. | No bloqueante para v1. Priorizar `useSearch.ts` y `favoritesStore` en backlog técnico. |
| 2.4 | Tests E2E | 🔴 Pendiente | Media | Sin tests automatizados de flujo completo (búsqueda → resultados → detalle → alerta). | No bloqueante para v1. Evaluar Maestro o Detox post-lanzamiento. |
| 2.5 | Crash handling | 🟢 Completo | — | `Sentry.wrap(RootLayout)` en `_layout.tsx` captura crashes no manejados. `Sentry.captureException()` en `useSearch.ts` para errores de búsqueda. Sentry deshabilitado en `__DEV__`. | Verificar que `EXPO_PUBLIC_SENTRY_DSN` esté configurado en el perfil EAS de producción. |
| 2.6 | Manejo de errores | 🟢 Completo | — | Tres capas: error de red (mensaje específico + botón reintentar), error genérico, AbortError (silencioso). | — |
| 2.7 | Estados vacíos | 🟢 Completo | — | `EmptyState` con 3 tips en results.tsx. Medicamento no encontrado en medication.tsx. Sin favoritos/historial en index.tsx. Sin farmacias para la comuna. Sin bioequivalentes. | — |
| 2.8 | Loading / Skeleton | 🟢 Completo | — | `SkeletonCard` (animación Reanimated 800ms pulse, 3 placeholders), `ActivityIndicator`. | — |
| 2.9 | Performance | 🟢 Completo | — | Debounce 500ms. AbortController por consulta (cancela anterior). Cache LRU 30 min client + 5 min server. Farmacias en paralelo (`Promise.allSettled`). FlatList para listas largas. | Medir tiempo real en dispositivo físico para `Paracetamol` (query de mayor volumen esperado). |

---

## 3. Observabilidad

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 3.1 | Sentry — client | 🟢 Completo | — | Init en `_layout.tsx` con DSN desde env, 20% trace sampling, env tag (production/development). | Configurar alertas en Sentry para crash rate > 1% o nuevas issues críticas. |
| 3.2 | PostHog — eventos | 🟡 Parcial | Media | Evento `medication_search` con query, results_count, pharmacies, best_price, commune. Cubre el evento principal. Faltan: `medication_detail_viewed`, `price_alert_created`, `share_price`, `donation_clicked`. | Agregar al menos `medication_detail_viewed` y `price_alert_created` para entender el funnel de engagement. |
| 3.3 | PostHog — configuración | 🟡 Parcial | Media | La API key de PostHog está hardcodeada en `mobile/src/lib/analytics.ts`. Es pública por diseño (client-side), pero es mala práctica de configuración. | Mover a `EXPO_PUBLIC_POSTHOG_KEY` en `.env`. No bloqueante, mejora higiene de secretos. |
| 3.4 | Logs API | 🟢 Completo | — | Logs JSON estructurados con `requestId`, `route`, `query`, `cache`, `results` en cada request. `console.warn` en rate limit, `console.error` en errores 500. | — |
| 3.5 | Health Monitor | 🟢 Completo | — | `monitor-api.yml` corre cada 6 horas + manual. Crea GitHub Issue con label `monitoring` al fallar. Genera artefacto con reporte. | El healthcheck actual solo verifica que `/api/health` responde 200, no valida que las farmacias respondan. Considerar pasar `?debug=1` en el check canario. |
| 3.6 | Alertas operacionales | 🟡 Parcial | Media | Solo GitHub Issues. Sin notificación push al equipo ni integración Slack/email. | Para v1 es aceptable. Agregar notificación por email cuando el monitor falle, para no depender de revisar GitHub manualmente. |
| 3.7 | Métricas de negocio | 🔴 Pendiente | Baja | No existen dashboards de: búsquedas por medicamento, conversión a detalle, farmacias con más errores, cache hit rate del backend. | Post-lanzamiento: crear dashboard en PostHog con top queries, farmacias activas, cache hit rate. |

---

## 4. Backend

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 4.1 | Cache estratificado | 🟢 Completo | — | Cache cliente (AsyncStorage, 30 min, `search_cache_v10_*`) + cache servidor (Upstash Redis, 5 min). Fallback in-memory si Redis falla. | — |
| 4.2 | Timeouts | 🟢 Completo | — | `fetchWithTimeout` 8s por cliente de farmacia. Vercel function: 30s para `/api/search`, 10s para `/api/health`. Suficiente para los 9 scrapers en paralelo. | Monitorear Sermecoop: hace 2 requests secuenciales (GET→POST) y puede acercarse al límite. |
| 4.3 | Retries | 🔴 Pendiente | Media | No hay retries en ningún cliente de farmacia. Un fallo transitorio pierde el resultado de esa farmacia para esa búsqueda. `Promise.allSettled` evita bloqueos pero no reintenta. | Agregar retry simple (1 reintento, backoff 500ms) en los clientes más críticos (Cruz Verde, Salcobrand). No bloqueante para v1. |
| 4.4 | Rate Limiting | 🟡 Parcial | Alta | 60 req/min por IP en `rateLimit.ts`. Implementado con Map en memoria. En Vercel serverless con múltiples instancias activas, cada instancia tiene su propio Map: un usuario puede superar el límite si cae en distintas instancias. | Para v1 es aceptable (tráfico inicial bajo). A escala, mover el rate limit a Redis (`INCR` + `EXPIRE`). |
| 4.5 | Escalabilidad | 🟡 Parcial | Baja | Vercel serverless auto-escala. Redis compartido entre instancias para cache. Rate limit no distribuido (ver 4.4). Sin warm-up. | Aceptable para v1. El mayor riesgo es un query viral que sature las APIs de las farmacias. |
| 4.6 | Health checks | 🟡 Parcial | Media | `/api/health` retorna `{ ok: true, timestamp }`. No verifica Redis ni hace test query a farmacias. El monitor de 6h podría reportar "healthy" aunque Redis esté caído. | Agregar check de Redis: `redis.ping()` con catch. Opcional: flag `?deep=1` para health check completo. |
| 4.7 | MINSAL branches | 🟢 Completo | — | GitHub Action `update-branches.yml` actualiza daily (06:00 Chile). 222 comunas indexadas. Commit automático si hay cambios. | — |

---

## 5. Seguridad

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 5.1 | API Key auth | 🟡 Parcial | **Alta** | `auth.ts` retorna `true` si `API_SECRET_KEY` no está configurada: sin esa variable en Vercel, la API es pública sin restricciones. `EXPO_PUBLIC_API_KEY` está en el bundle (inherente en apps móviles). | **Verificar en Vercel Dashboard** que `API_SECRET_KEY` está configurada en el proyecto de producción. |
| 5.2 | Algolia API key | 🔴 Pendiente | **Alta** | Hay un fallback de Algolia App ID y API key hardcodeados en `api/src/clients/salcobrand.ts`. Aunque sea una key de solo-lectura, exponerla en el repo es un riesgo si se eleva el nivel de permisos por error. | Mover `ALGOLIA_APP_ID` y `ALGOLIA_API_KEY` a variables de entorno de Vercel. Eliminar el fallback del código. |
| 5.3 | Credenciales Khipu | 🔴 Pendiente | **Alta** | Las credenciales Khipu estuvieron expuestas en debug logs (documentado como pendiente). Aunque la implementación usa `Linking.openURL()` sin backend, las URLs contienen el ID de cobrador. | Rotar los payment links Khipu si corresponde. Auditar logs de Vercel en busca de tokens expuestos en sesiones recientes. |
| 5.4 | Validación de input | 🟢 Completo | — | `cleanQuery()` filtra términos de prescripción. Longitud validada (2-120 chars). Método HTTP validado. `requestId` con regex. | — |
| 5.5 | Headers de seguridad | 🟡 Parcial | Media | `x-request-id` y `x-search-cache` en respuestas. Sin headers de seguridad HTTP explícitos (X-Content-Type-Options, X-Frame-Options). Vercel los maneja parcialmente por defecto. | Agregar en `vercel.json` bajo `headers`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`. |
| 5.6 | CORS | 🔴 Pendiente | Media | El dashboard web condicional que planteaba esta fila **ya existe** (`web/`, incluyendo el panel `/admin`) y el CORS del backend sigue completamente abierto (`Access-Control-Allow-Origin: *` en `api/src/lib/http.ts` y las rutas de `donate`/`feedback`) — la condición que disparaba la acción recomendada ya se cumplió, pero la mitigación no se aplicó. | Restringir CORS a los orígenes propios (`app-compara-farma-web.vercel.app`, dominio futuro, app móvil vía API key) en vez de `*`. |
| 5.7 | Variables de entorno | 🟡 Parcial | Alta | Server-side (`API_SECRET_KEY`, `UPSTASH_*`) correctamente separadas. Client-side (`EXPO_PUBLIC_*`) visibles en el bundle por diseño de Expo. | Auditar Vercel Dashboard y confirmar que todas las vars de producción estén configuradas. Si `EXPO_PUBLIC_API_URL` no está seteado, la app falla silenciosamente. |

---

## 6. Datos

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 6.1 | Normalización | 🟢 Completo | — | `matchKey()` unificado en `@comparafarma/domain`. Normalización de acentos, guiones (Trio-Val→trioval), short-word merging (Tri Fen→trifen), conversión g→mg. Snapshot de contrato commiteado. | — |
| 6.2 | Deduplicación | 🟢 Completo | — | `mergeDuplicates()` unificado en `@comparafarma/domain`. Agrupa por `matchKey`, elige precio mínimo por farmacia, ordena por precio efectivo ascendente. | — |
| 6.3 | Cobertura farmacias | 🟢 Completo | — | 9 farmacias activas. 4 cadenas grandes (Cruz Verde, Salcobrand, Ahumada, Dr. Simi) + 5 complementarias (AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma). Canales correctamente mapeados. | — |
| 6.4 | Scrapers frágiles | 🟡 Parcial | Alta | Ahumada y Sermecoop usan HTML scraping con regex. Si actualizan su layout, fallan silenciosamente (devuelven array vacío). El healthcheck básico no detecta ausencia de resultados por farmacia. | Agregar test canario en el health monitor: verificar que `Paracetamol` retorna resultados de Ahumada. El proceso de actualización ya está documentado en CLAUDE.md. |
| 6.5 | Validación de rango de precios | 🔴 Pendiente | Media | No hay validación de que un precio sea razonable (> $0). Un scraper roto podría devolver precios de $0 que se mostrarían al usuario como "mejor precio". | Agregar en `toPharmacyPrice()` o en los clientes: filtrar productos con `store <= 0`. |
| 6.6 | Integridad matchKey | 🟢 Completo | — | Bug histórico de divergencia corregido en CF-108. Alertas de precio y favoritos ahora usan la misma clave que el backend. Cache invalidada con prefijo `search_cache_v10_`. | — |
| 6.7 | Datos MINSAL | 🟢 Completo | — | Índice de sucursales actualizado daily. 222 comunas. Las 4 farmacias online-only (EcoFarmacias, EasyFarma, etc.) no necesitan estar en el índice MINSAL. | — |

---

## 7. UX

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 7.1 | Dark mode | 🟢 Completo | — | NativeWind `darkMode: "media"` en toda la app. Verificado en emulador. | Verificar en dispositivo físico con modo oscuro permanente habilitado. |
| 7.2 | Accesibilidad (a11y) | 🔴 Pendiente | Alta | No se detectaron `accessibilityLabel`, `accessibilityHint` ni `accessibilityRole` en los componentes principales (MedicationListItem, SearchBar, PriceRow, botones de favorito/alerta). TalkBack funcionará de forma degradada. | Agregar `accessibilityLabel` a los elementos interactivos críticos. Google Play puede penalizar apps con accesibilidad insuficiente en rankings. No es rechazo automático pero sí riesgo de visibilidad. |
| 7.3 | Navegación | 🟢 Completo | — | Expo Router v3, Stack navigation, header custom con back/fav/cart/share. Historial de navegación correcto. | — |
| 7.4 | Modo offline | 🟡 Parcial | Media | Cache de 30 min permite ver resultados previos offline. Sin cache activo → error de red con mensaje diferenciado y botón Reintentar. Sin detección proactiva de conectividad. | Agregar `expo-network` o `@react-native-community/netinfo` para mostrar banner "Sin conexión" proactivo. No bloqueante para v1. |
| 7.5 | Estados de error | 🟢 Completo | — | Error de red: mensaje específico. Error genérico: mensaje genérico. Ambos con botón Reintentar. Medicamento no encontrado: pantalla dedicada. | — |
| 7.6 | Feedback al usuario | 🟢 Completo | — | InAppToast (Reanimated, auto-dismiss 5s) para alertas de precio. Haptic feedback en interacciones. Formulario de feedback en about.tsx. | — |
| 7.7 | Font scaling | 🟡 Parcial | Baja | NativeWind usa unidades fijas. Con fuente del sistema muy grande, los precios pueden cortarse en MedicationListItem. | Verificar con `Font Size: Largest` en Accesibilidad de Android. No bloqueante para v1. |
| 7.8 | Onboarding | 🟢 Completo | — | 5 slides, se muestra solo en primera vez (`onboarding_v2_done`). Modo help accesible desde el header. | — |

---

## 8. Operación

| # | Ítem | Estado | Prioridad | Descripción | Acción recomendada |
|---|------|--------|-----------|-------------|-------------------|
| 8.1 | CI/CD | 🟢 Completo | — | GitHub Actions: typecheck + domain-tests + api-tests → deploy-api. Deploy automático a Vercel en push a main. Los 3 jobs son prerequisitos del deploy. | — |
| 8.2 | OTA Updates | 🟢 Completo | — | EAS Update configurado (`runtimeVersion: appVersion`). Permite hotfixes JS sin nuevo build. | Documentar qué cambios requieren nuevo AAB vs OTA. Regla general: cambios en código nativo = nuevo AAB; cambios JS/TS = OTA válido. |
| 8.3 | Rollback API | 🟡 Parcial | Alta | Vercel mantiene historial de deployments y permite rollback manual desde el dashboard en ~2 minutos. No hay proceso documentado. | Documentar en `docs/ops/runbook.md`: (1) rollback en Vercel Dashboard, (2) flush de Redis vía Upstash Console si el cache está corrompido. |
| 8.4 | Rollback mobile | 🟡 Parcial | Alta | Play Console permite revertir a versión anterior. OTA puede publicar un update que revierta a una versión anterior del bundle JS. No hay proceso documentado. | Documentar: cuándo usar OTA rollback vs Play Console rollback; cómo identificar el update ID correcto en EAS Dashboard. |
| 8.5 | Monitoreo post-lanzamiento | 🟡 Parcial | Media | Healthcheck cada 6h (GitHub Actions). Sentry para crashes. Logs en Vercel. Sin dashboard centralizado ni SLA. | Configurar alerta en Sentry para crash rate > umbral (sugerido: > 0.5% de sesiones). Revisar logs de Vercel durante las primeras 48h de producción. |
| 8.6 | Backups | 🟢 Completo | — | No hay estado crítico en servidor (Redis es cache efímero con TTL). AsyncStorage es per-device. Sin datos personales en backend. | — |
| 8.7 | Runbooks | 🔴 Pendiente | Media | No existen runbooks para: scraper roto, API caída, cache inválida, rollback, bump de versión. | Crear `docs/ops/runbook.md` con procedimientos básicos. No bloqueante para v1 pero esencial antes de escalar el equipo. |

---

## Score General

### Tabla de puntaje por área

| Área | 🟢 | 🟡 | 🔴 | Puntaje | Máx | % |
|------|----|----|-----|---------|-----|---|
| 1. Google Play | 5 | 4 | 2 | 7.0 | 11 | 64% |
| 2. Calidad | 6 | 0 | 3 | 6.0 | 9 | 67% |
| 3. Observabilidad | 3 | 3 | 1 | 4.5 | 7 | 64% |
| 4. Backend | 3 | 3 | 1 | 4.5 | 7 | 64% |
| 5. Seguridad | 2 | 3 | 2 | 3.5 | 7 | 50% |
| 6. Datos | 5 | 1 | 1 | 5.5 | 7 | 79% |
| 7. UX | 5 | 2 | 1 | 6.0 | 8 | 75% |
| 8. Operación | 3 | 3 | 1 | 4.5 | 7 | 64% |
| **Total** | **32** | **19** | **12** | **41.5** | **63** | **66%** |

> **Metodología:** 🟢 = 1.0 pt · 🟡 = 0.5 pt · 🔴 = 0 pt

### Score General de Release Readiness: **66%**

---

## Top 10 Tareas antes de Producción

| # | Tarea | Área | Prioridad | Esfuerzo est. |
|---|-------|------|-----------|---------------|
| **1** | **Completar formulario Data Safety en Play Console** — declarar Sentry (crash reporting), PostHog (analytics anónimo), sin datos personales almacenados. Sin esto Google bloquea el publish. | Google Play | 🔴 Bloqueante | 1h |
| **2** | **Verificar `API_SECRET_KEY` configurada en Vercel Dashboard** — si no existe, `auth.ts` retorna `true` y la API es pública sin autenticación. | Seguridad | 🔴 Bloqueante | 30 min |
| **3** | **Mover Algolia keys a Vercel env vars** — eliminar fallback hardcodeado en `api/src/clients/salcobrand.ts`. | Seguridad | 🔴 Alta | 2h |
| **4** | **Verificar Target SDK ≥ 34 en el AAB** — requerido por Google Play desde agosto 2024. Validar con `aapt2 dump badging` o en la sección "Bundle analysis" de Play Console. | Google Play | 🔴 Alta | 1h |
| **5** | **Accesibilidad básica** — agregar `accessibilityLabel` a elementos interactivos críticos: botones de precio, favorito, alerta, compartir, filtros. TalkBack debe ser navegable en el flujo principal. | UX | Alta | 3h |
| **6** | **Rotar credenciales Khipu** si corresponde, y auditar logs de Vercel en busca de tokens expuestos en sesiones recientes. | Seguridad | Alta | 1h |
| **7** | **Validar precio > 0 en `toPharmacyPrice()`** — filtrar productos con `store <= 0` antes de incluirlos en resultados. Previene que un scraper roto muestre "$0" como mejor precio. | Datos | Media | 1h |
| **8** | **Agregar test canario en healthcheck** — verificar que `Paracetamol` retorna resultados de Ahumada y Salcobrand en el monitor de 6 horas. | Observabilidad | Media | 2h |
| **9** | **Documentar procedimientos de rollback** — `docs/ops/runbook.md` con: rollback API en Vercel, flush Redis en Upstash, rollback OTA, rollback Play Console. | Operación | Media | 2h |
| **10** | **Enriquecer screenshots en Play Console** — agregar captura de alerta de precio activa y pantalla de filtros. Mejora la conversión en la ficha de la app. | Google Play | Baja | 30 min |

---

## Riesgos Críticos

### 🔴 RC-1 — Data Safety sin declarar
**Probabilidad:** Alta · **Impacto:** Bloqueante  
Google Play rechaza el publish si Data Safety no está completo. No es una observación: es un requisito técnico de la plataforma. La app usa PostHog y Sentry, lo que requiere declaración explícita aunque los datos sean anónimos.

### 🔴 RC-2 — `API_SECRET_KEY` posiblemente no configurada
**Probabilidad:** Media · **Impacto:** Alto  
`api/src/middleware/auth.ts` retorna `true` si la variable no existe en el entorno. Si Vercel no tiene la var configurada, cualquier cliente puede consumir la API sin restricciones, exponiendo los scrapers a abuso y generando costos en Upstash y en las APIs de las farmacias.

### 🟡 RC-3 — Scrapers HTML sin monitoreo de contenido
**Probabilidad:** Media · **Impacto:** Alto  
Ahumada y Sermecoop pueden cambiar su HTML en cualquier momento. El healthcheck actual no detecta ausencia de resultados de una farmacia específica. El usuario podría ver resultados incompletos (sin Ahumada) durante horas sin que el equipo lo note.

### 🟡 RC-4 — Algolia key hardcodeada en repositorio
**Probabilidad:** Alta (es visible hoy) · **Impacto:** Medio  
Aunque las Algolia search-only keys tienen permisos limitados, exponer credenciales en el repo es un riesgo. Si en el futuro se eleva el nivel de permisos por error de configuración en Algolia, el riesgo escala. El patrón además contradice la higiene de secretos del resto del proyecto.

### 🟡 RC-5 — Rate limiting no distribuido en Vercel
**Probabilidad:** Baja · **Impacto:** Medio  
En Vercel con múltiples instancias activas (posible bajo carga), el rate limit en memoria es por instancia. Un bot o usuario con muchas peticiones puede superar el límite real si las requests se distribuyen entre instancias. No es relevante para tráfico inicial, pero puede ser explotado si la app crece rápido.

### 🟡 RC-6 — Sin smoke test post-deploy
**Probabilidad:** Media · **Impacto:** Medio  
No existe un test automatizado que verifique el flujo completo después de cada deploy: búsqueda → resultados → detalle → alerta. Un bug de regresión introducido por un cambio en la API de una farmacia o un deploy incorrecto puede pasar desapercibido hasta que lo reporte un usuario.

---

## Recomendación Final

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ✖  NO PUBLICAR AÚN EN GOOGLE PLAY PRODUCCIÓN                      ║
║                                                                      ║
║   4 bloqueantes confirmados:                                         ║
║   1. Data Safety sin completar (Google lo exige, no hay workaround)  ║
║   2. API_SECRET_KEY: verificar configuración en Vercel               ║
║   3. Algolia key hardcodeada en repositorio                          ║
║   4. Target SDK: verificar ≥ 34 en el AAB generado                  ║
║                                                                      ║
║   Estimación para desbloquear: 1 día de trabajo                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Contexto

La app está en un estado funcional y técnico **sólido** para Prueba Interna/Cerrada. La arquitectura es correcta, los flujos críticos tienen manejo de errores robusto, CI/CD funciona, el monitoreo está activo, y el paquete `@comparafarma/domain` acaba de unificar la lógica de negocio (RFC-001). El score de 66% refleja principalmente pasos operacionales no completados, no deuda técnica grave.

Los 4 bloqueantes son en su mayoría **acciones manuales** en Play Console y Vercel, no cambios de código. Una vez resueltos, la app puede publicarse en Producción sin objeciones técnicas mayores.

### Camino recomendado

| Fase | Acciones | Estimado |
|------|----------|----------|
| **Desbloquear** | Tareas 1–4 del Top 10 (Data Safety, API key, Algolia env, Target SDK) | 1 día |
| **Publicar v1.4.0** | Promover build actual a Producción en Play Console | 30 min |
| **Post-lanzamiento sprint 1** | Accesibilidad básica (labels) + validación precio ≥ 0 + healthcheck canario + runbook | 1 sprint |
| **Post-lanzamiento sprint 2+** | Tests E2E, rate limiting distribuido, eventos PostHog completos, push notifications para alertas | 2–3 sprints |

---

*Documento generado por revisión estática del código fuente (2026-06-30). No reemplaza pruebas en dispositivo físico ni validación manual de la ficha en Play Console.*
