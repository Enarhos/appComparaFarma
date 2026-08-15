# Current Platform Assessment — ComparaFarma

**Sprint:** PLATFORM-001
**Tipo:** Documento de análisis (radiografía descriptiva del estado actual)
**Fecha de corte:** 2026-08-06
**Alcance:** cómo funciona ComparaFarma HOY — mobile, web, backend, base de datos e integraciones externas, más la comparación estructurada entre mobile y web. No es una propuesta de arquitectura, no es un RFC, no es un ADR, no contiene recomendaciones ni roadmap.
**Método:** lectura directa de código (`mobile/src`, `web/src`, `api/src`, `api/api`, `packages/domain/src`, `docs/database/schema.sql`, `.github/workflows/`). Toda afirmación cita su evidencia (ruta de archivo). No se modificó ningún archivo de código ni de documentación existente durante esta auditoría.

---

## 0. Auditoría previa — por qué se crea este documento

Antes de escribir este documento se revisó el repositorio completo en busca de un documento equivalente. Candidatos evaluados:

| Documento | Veredicto |
|---|---|
| `docs/analysis/PROJECT_INVENTORY.md` (2026-08-04) | El más cercano. Cubre inventario de componentes (mobile/web/api/domain/Supabase) y capacidades por plataforma a nivel de resumen ejecutivo. **No cubre**: flujo de autenticación detallado, diagrama de flujo de datos extremo a extremo, ni una tabla de comparación sistemática mobile-vs-web funcionalidad por funcionalidad. |
| `docs/architecture/DOMAIN_MODEL.md` | Modelo de datos de dominio (`MedicationResult`, `PharmacyPrice`, etc.), no arquitectura de plataforma. No cubre. |
| `docs/architecture/RFC-006_MEDICATION_DETAIL_AND_PRICE_HISTORY.md` | RFC puntual de una feature. No cubre. |
| `docs/release/PRODUCTION_READINESS_V2.md` | Solo `mobile/`, con lente de "¿podemos publicar en Play Store?". Excluye web/backend/BD explícitamente. No cubre. |
| `docs/launch/PRODUCTION_READINESS_REVIEW.md` | Cruza mobile/web/api pero con lente de bloqueadores de lanzamiento, no de descripción de funcionamiento. Cubre parcialmente. |
| `docs/product/PRODUCT_BLUEPRINT.md` | Índice de experiencias de producto (UX), no inventario técnico. No cubre. |
| `docs/program/*` | Backlog/roadmap/gobierno de ejecución, explícitamente no arquitectura. No cubre. |
| RFC-001 a RFC-006, ADR-0001 a ADR-0004 | Decisiones puntuales (paquete de dominio, motor de suscripciones, Stripe→Flow, ficha de medicamento). Ninguno es una radiografía transversal. No cubre. |
| `CLAUDE.md` | Resumen operativo breve, no una radiografía completa. No cubre. |

No existe una carpeta `supabase/` con migraciones en la raíz del repo — la única fuente de esquema es `docs/database/schema.sql`.

**Conclusión de la auditoría:** no existe un documento equivalente. `PROJECT_INVENTORY.md` no se duplica ni se reemplaza — sigue siendo el inventario de alto nivel de componentes y madurez; este documento es un nivel de detalle distinto y complementario (cómo funciona cada pieza exactamente, comparación estructurada, flujos completos).

---

## 1. Mobile (`mobile/`)

### 1.1 Pantallas

Rutas bajo `mobile/src/app/` (Expo Router, un único `Stack` en `mobile/src/app/_layout.tsx`):

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `index.tsx` | Home: `SearchBar` con sugerencias (historial + búsquedas frecuentes), sección horizontal de Favoritos, chips de categorías populares, lista de búsquedas recientes, banner de donación, botón de filtros, botón carrito con badge. Redirige a `/onboarding` si `AsyncStorage["onboarding_v2_done"]` no existe. |
| `/results` | `results.tsx` | Resultados de búsqueda (`q` param). Filtros (bioequivalente, farmacias activas, comuna, solo despacho online), orden (precio/nombre), `SkeletonCard` en carga, `EmptyState`, `RefreshControl`. |
| `/medication` | `medication.tsx` | Ficha de detalle (`matchKey` param). Header con favorito/alerta/carrito/compartir. Cards por farmacia con canales alternativos. `SavingsCard`, `PriceHistoryChart`, `DonationBanner`, `AlertSheet`. Registra snapshot de precio al abrir. |
| `/onboarding` | `onboarding.tsx` | 5 slides. Modo normal (primera vez, marca `onboarding_v2_done`) y modo `?mode=help` (reabre sin marcar). |
| `/cart` | `cart.tsx` | Lista de compras (`cartStore`, máx. 8 ítems). Tabla comparativa de total por farmacia con ganador marcado. Banner de ahorro. |
| `/about` | `about.tsx` | "Acerca de" / feedback: formulario (mensaje + email opcional) → `POST /api/feedback`. Muestra versión de la app. |

No existen más rutas (no hay tabs, no hay drawer, no hay `_sitemap`).

### 1.2 Navegación

Stack lineal de `expo-router`. Navegación vía `useRouter().push({ pathname, params })`: `index → results` (`q`), `index → medication` (`matchKey`), `index → cart`, `index → onboarding` (`mode: help`), `index → about`, `results → medication` (`matchKey`). Deep link scheme `comparafarma` declarado en `app.json`/`AndroidManifest.xml`, pero sin lógica de enrutamiento profundo implementada en código (ningún `Linking.addEventListener`/`useURL`).

### 1.3 Funcionalidades

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Búsqueda | Existe | `src/hooks/useSearch.ts` + `SearchBar.tsx`. Debounce de 500ms soportado pero no activado en el flujo real (`SearchBar` se monta sin `liveSearch` en `index.tsx`) — la búsqueda se dispara al submit/sugerencia. |
| Resultados con filtros | Existe | `results.tsx`. |
| Ficha de medicamento | Existe | `medication.tsx`. |
| Comparación multi-farmacia | Existe | `SavingsCard` (mejor vs peor precio) + tabla comparativa en `cart.tsx`. |
| Favoritos | Existe | Ver 1.14. |
| Carrito | Existe | `cartStore.ts`, máx. 8 ítems, persistido. |
| Historial | Existe | Ver 1.16. |
| Alertas de precio | Existe, 100% local | Ver 1.15. |
| Compartir | Existe | `Share.share()` nativo, solo texto. |
| Onboarding | Existe | Dos modos. |
| Modo oscuro | Existe | `darkMode: "media"` en NativeWind, clases `dark:` en toda la UI. |
| Donación | Existe | `DonationBanner.tsx` + `donationGate.ts`: aparece si ahorro > $1.000 y ≥5 búsquedas exitosas, links Khipu directos, dismissible. |
| Filtro por comuna | Existe | `locationStore.ts`, `branches.ts`, dentro de `FilterSheet.tsx` (el componente `CommuneSelector.tsx` existe en el código pero no está montado en ninguna pantalla). |

### 1.4 Servicios (`src/lib/*.ts`)

| Archivo | Función |
|---|---|
| `search.ts` | `searchMedications()` — fetch a `/api/search`, exige `EXPO_PUBLIC_API_URL` (lanza error si falta), header `x-api-key` opcional. |
| `cache.ts` | Cache de resultados en AsyncStorage, prefijo `search_cache_v10_`, TTL 30 min. |
| `priceHistory.ts` | Snapshots diarios de precio por `matchKey` (máx. 60), prefijo `price_history_v1_`. |
| `donationGate.ts` | Contador de búsquedas + lógica de cuándo mostrar el banner de donación. |
| `formatters.ts` | `formatCLP()`, `scrapedAgo()`. |
| `analytics.ts` | Cliente PostHog + `captureSearch()`. |
| `branches.ts` | Índice de sucursales por comuna desde `/api/branches`, cache 24h. |

### 1.5 Stores (Zustand)

| Store | Persistencia | Contenido |
|---|---|---|
| `searchStore` | No | query, results, status, errorMessage. |
| `historyStore` | AsyncStorage `search-history` | últimos 10 términos buscados. |
| `favoritesStore` | AsyncStorage `favorites-v1` | matchKeys + snapshot completo del medicamento (`cachedResults`). |
| `cartStore` | AsyncStorage `cart-v1` | ítems del carrito (máx. 8). |
| `filterStore` | No | farmacias activas, orden, solo-online. |
| `locationStore` | AsyncStorage `location-v1` | comuna seleccionada. |
| `alertsStore` | AsyncStorage `price_alerts_v1` (persistencia manual, sin middleware `persist`) | alertas de precio locales. |
| `toastStore` | No | cola de toasts in-app. |
| `configStore` | No (se re-obtiene en cada arranque) | config remota: farmacias activas + config del banner de donación, desde `GET /api/config`. |

No existe un store de "preferencias de usuario" locales editables (idioma, tema manual, notificaciones) — el modo oscuro sigue al sistema, sin toggle propio.

### 1.6 AsyncStorage — todas las keys/prefijos

`onboarding_v2_done`, `results_tooltip_v1_seen`, `search_cache_v10_*`, `price_history_v1_*`, `donation_search_count_v1`, `donation_dismissed_at_v1`, `branches_v3`, `search-history`, `favorites-v1`, `cart-v1`, `location-v1`, `price_alerts_v1`. Ninguna key relacionada con sesión, usuario o autenticación.

### 1.7 Llamadas API hacia el backend

| Endpoint | Método | Archivo |
|---|---|---|
| `/api/search?q=...` | GET | `lib/search.ts` |
| `/api/config` | GET | `store/configStore.ts` (timeout 5s) |
| `/api/branches` | GET | `lib/branches.ts` |
| `/api/feedback` | POST | `app/about.tsx` |

No hay llamadas de autenticación, favoritos remotos, alertas remotas ni premium.

### 1.8 Analytics (PostHog)

`mobile/src/lib/analytics.ts`. Instancia con key write-only hardcodeada, host `us.i.posthog.com`. Único evento: `medication_search` (campos: `query`, `raw_query`, `results_count`, `pharmacies_with_results`, `best_price`, `best_pharmacy`, `commune`), disparado desde `useSearch.ts` solo en búsquedas que no vienen de cache.

### 1.9 Sentry

`mobile/src/app/_layout.tsx`: `Sentry.init({ dsn: EXPO_PUBLIC_SENTRY_DSN, enabled: !__DEV__, tracesSampleRate: 0.2 })`, `RootLayout` envuelto en `Sentry.wrap()`. Único `captureException` explícito: `useSearch.ts:80`, con el query de búsqueda como contexto adicional (excluye errores de tipo `AbortError`).

### 1.10 Permisos

`app.json`: `android.permissions: []`. El manifest generado agrega automáticamente `INTERNET` (requerido por cualquier app con red) y `VIBRATE` (de `expo-haptics`). Sin permisos de ubicación, cámara, almacenamiento, notificaciones ni contactos.

### 1.11 Notificaciones push

No existe. Sin `expo-notifications` en dependencias, sin configuración relacionada en `app.json`. El ícono de "campana" en la UI es una metáfora visual para alertas locales, no push real.

### 1.12 Autenticación

No existe. Sin pantallas de login/registro, sin store de sesión, sin manejo de tokens de usuario. El único "token" es `EXPO_PUBLIC_API_KEY`, una API key de servicio para autenticar la app contra el backend, no una sesión de usuario.

### 1.13 Premium

No existe. Sin gating de ninguna funcionalidad — favoritos, carrito, alertas, historial y comparación están disponibles sin restricción para cualquier instalación.

### 1.14 Favoritos — detalle

`favoritesStore.ts` (AsyncStorage `favorites-v1`): lista de `matchKey` + diccionario `cachedResults` con el snapshot completo del medicamento al momento de guardarlo. Toggle desde `medication.tsx` (corazón en header). Sección horizontal en `index.tsx` — al abrir un favorito se usa el precio cacheado del momento de guardar, no se vuelve a consultar el backend. 100% local, sin sincronización remota.

### 1.15 Alertas de precio — detalle

100% local, sin backend involucrado. `alertsStore.ts` (AsyncStorage `price_alerts_v1`, persistencia manual). Creación vía `AlertSheet.tsx` (sugiere 10% menos del precio actual). El disparo ocurre dentro de `useSearch.ts` cada vez que el usuario ejecuta una búsqueda exitosa que coincide con una alerta activa — no hay polling en background ni notificación push si la app está cerrada; el usuario debe abrir la app y buscar para que la alerta se evalúe.

### 1.16 Historial — detalle

`historyStore.ts` (AsyncStorage `search-history`, máx. 10 términos, dedupe por término exacto). UI en `index.tsx` (borrar individual/todo). Se alimenta desde `results.tsx` en cada búsqueda ejecutada. Distinto del historial de precios (`priceHistory.ts`), que es por medicamento, no por término buscado.

### 1.17 Configuración

No existe una pantalla de "configuración/preferencias" en el sentido tradicional. El `configStore.ts` que existe consume configuración remota del backend (farmacias activas, banner de donación vía `GET /api/config`), no preferencias locales del usuario. Preferencias reales dispersas: comuna (`locationStore`, persistida) y filtros de búsqueda (`filterStore`, no persistido). Tema sigue el sistema, sin toggle manual.

### Notas adicionales de Mobile

`CommuneSelector.tsx` existe en el código sin ningún import activo (duplicado funcionalmente por `FilterSheet.tsx`, que sí está montado). Versión actual: `app.json` reporta `version: "1.4.0"`, `android.versionCode: 31`, `ios.buildNumber: "30"`.

---

## 2. Web (`web/`)

### 2.1 Páginas

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `app/page.tsx` | Home estática con `SearchBox`, chips de búsquedas frecuentes, tarjeta demo con precios hardcodeados, link a Google Play. |
| `/buscar/[query]` | `app/buscar/[query]/page.tsx` | Resultados de búsqueda server-side, `generateMetadata` dinámico, JSON-LD. |
| `/medicamento/[slug]` | `app/medicamento/[slug]/page.tsx` | Ficha de detalle: comparación por farmacia, histórico de precios, insights, "Agregar a mi receta", formulario de alerta de precio. `robots: noindex` (fichas nuevas todavía no indexadas). |
| `/mi-receta` | `app/mi-receta/page.tsx` | Comparador de una lista de medicamentos guardada en `localStorage` del navegador, sin cuenta. `noindex, nofollow`. |
| `/cuenta` | `app/cuenta/page.tsx` | Cuenta del usuario logueado: email, plan, botones de upgrade, `SignOutButton`. |
| `/cuenta/ingresar` | `app/cuenta/ingresar/page.tsx` | Login de usuario final (email/password, sin Google OAuth). |
| `/cuenta/registro` | `app/cuenta/registro/page.tsx` | Registro (`supabase.auth.signUp`), pantalla "Revisa tu email" si la confirmación está activa. |
| `/auth/callback` | `app/auth/callback/route.ts` | Route handler compartido: intercambia `code` por sesión, usado tanto por OAuth admin como por confirmación de email de registro. |
| `/admin/login` | `app/admin/login/page.tsx` | Login admin (email/password + Google OAuth). |
| `/admin` (dashboard) | `app/admin/(dashboard)/page.tsx` | Dashboard de clicks por farmacia. |
| `/admin/config` | `.../config/page.tsx` | Toggle de farmacias activas + config del banner de donación. |
| `/admin/feedback` | `.../feedback/page.tsx` | Bandeja de sugerencias. |
| `/admin/usuarios` | `.../usuarios/page.tsx` | Lista de usuarios + toggle Free/Premium manual. |

Sin rutas `/favoritos` ni `/historial`. `sitemap.ts`/`robots.ts` (SEO técnico) y `loading.tsx`/`not-found.tsx`/`error.tsx` globales.

### 2.2 Dashboard / Admin

Route group `app/admin/(dashboard)/`, layout propio con header (email + `SignOutButton`) y navegación de 4 tabs (Clicks, Config, Feedback, Usuarios). Protección vía `web/src/proxy.ts`: exige sesión Supabase **y** email en la allowlist `ADMIN_ALLOWED_EMAILS` (`lib/adminAllowlist.ts`, sin fallback abierto). El login admin soporta Google OAuth, pero el OAuth solo autentica — el acceso real lo decide la allowlist.

### 2.3 Autenticación — flujo completo

- Login usuario final: `cuenta/ingresar` → `LoginForm.tsx` (sin OAuth).
- Login admin: `admin/login` → mismo `LoginForm.tsx` con `showGoogleOAuth`.
- Registro: `cuenta/registro/page.tsx` → `supabase.auth.signUp()`.
- Callback: `auth/callback/route.ts` (único handler para ambos flujos).
- Signout: `SignOutButton.tsx` (componente único, parametrizado por `redirectTo`).
- Middleware: `web/src/proxy.ts` — crea cliente Supabase con cookies de la request, llama `supabase.auth.getUser()` (refresca el token si expiró), decide redirect según ruta. Rutas públicas explícitas: `/admin/login`, `/cuenta/ingresar`, `/cuenta/registro`.
- Clientes Supabase: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (Server Components, respeta RLS), `lib/supabase/admin.ts` (bypass RLS, solo para el panel admin).

### 2.4 Supabase Auth — detalle

Email/password en ambos logins. Google OAuth solo en `/admin/login`. Al registrarse se crea automáticamente una fila en `profiles` vía trigger `on_auth_user_created` → función `handle_new_profile()` (`security definer`). Cookies gestionadas por `@supabase/ssr` estándar, sin manejo custom.

### 2.5 Perfiles

Tabla `profiles` (`id` FK a `auth.users`, `email`, `plan` 'free'/'premium'). RLS con una sola policy (`profiles_select_own`, solo lectura de la propia fila). Lectura del propio usuario vía `lib/profile.ts` (el campo `plan` ya no se lee de la tabla directamente — se resuelve llamando a `GET /api/subscriptions?action=me`, que consulta el motor de suscripciones; `profiles.plan` queda como cache derivado). Lectura/escritura admin vía `lib/profilesAdmin.ts` (bypass RLS para lectura; la escritura de plan pasa siempre por `api/`, nunca escribe la tabla directo).

### 2.6 Roles

No existe RBAC. "Admin" es una allowlist de emails por variable de entorno, no una columna en base de datos. "Plan" es únicamente `free`/`premium` en `profiles.plan`.

### 2.7 Premium

Motor de entitlement y catálogo de planes (`subscription_plans`, `subscriptions`, `subscription_events`) implementados end-to-end, pero sin ninguna funcionalidad real gateada hoy — el propio esquema lo documenta: "el campo `plan`... todavía no gatea nada existente". El catálogo comercial está vacío salvo una fila placeholder no vendible (`cortesia`) usada solo para otorgamiento manual desde `/admin/usuarios`. `cuenta/page.tsx` es el único lugar que consulta el entitlement para decidir qué botones mostrar.

### 2.8 Flow (pagos)

Flujo completo: `UpgradeButton.tsx` → server action `startFlowSubscription.ts` → `POST /api/subscriptions?action=start-flow-subscription` → crea/reutiliza cliente Flow (`flow_customers`) → registro de tarjeta en Flow → callback `flow-register-return` (valida contra Flow, nunca confía en parámetros del cliente) → crea suscripción y redirige a `/cuenta?upgrade=success|error`. Cobros recurrentes vía webhook `flow-webhook` (token opaco, validado contra Flow, siempre responde 200).

### 2.9 Stripe

No queda código activo. Único hallazgo: un comentario histórico en `startFlowSubscription.ts` referenciando el archivo ya eliminado. La columna `subscription_plans.stripe_price_id` fue agregada y luego eliminada explícitamente en el esquema (Stripe no admite comercios domiciliados en Chile).

### 2.10 Favoritos

No existe en web. Es una funcionalidad exclusiva de mobile.

### 2.11 Alertas

Sí existe, vía email (distinto del sistema local de mobile). `PriceAlertForm.tsx` en `medicamento/[slug]/page.tsx` → server action `createPriceAlert.ts` → `POST /api/alerts` → tabla `email_alerts`, gestión de confirmación/cancelación vía token en URL enviado por email, sin cuenta de usuario requerida.

### 2.12 Historial

No existe historial de búsquedas en web. Lo que sí existe con nombre similar es el histórico de precios de un medicamento (`PriceHistoryChart.tsx`, alimentado por la tabla `price_history`) — es una feature distinta, no debe confundirse.

### 2.13 Analytics

No existe. Sin PostHog, Amplitude, Mixpanel ni Google Analytics en `web/src` ni en `web/package.json`. El único tracking interno es la tabla `pharmacy_clicks` (clics "ir a la farmacia"), propia, no un SDK de terceros.

---

## 3. Backend (`api/`)

### 3.1 Endpoints

10 funciones serverless en `api/api/`, cada una re-exportando un handler de `api/src/routes/`:

| Función | Métodos / acciones | Qué hace | Consumidores |
|---|---|---|---|
| `search.ts` | GET (`?debug=1` modo diagnóstico) | Búsqueda en las 9 farmacias, cache, filtro por farmacia | mobile, web |
| `health.ts` | GET | Healthcheck enriquecido (deps: Redis/Supabase/Algolia) | Monitor GitHub Actions, smoke test de CI |
| `price-history.ts` | GET | Histórico de precios por `matchKey` | web (ficha de medicamento) |
| `alerts.ts` | GET/POST — `create`, `confirm`, `unsubscribe`, `check` | Alertas de precio por email | web (crear), email (confirmar/cancelar), cron (`check`) |
| `subscriptions.ts` | GET/POST — `me`, `plans`, `verify-purchase`, `google-rtdn`, `start-flow-subscription`, `flow-register-return`, `flow-webhook`, `grant-manual`, `revoke-manual` | Motor de suscripciones Premium completo | web, webhook Flow, webhook Google Pub/Sub |
| `branches.ts` | GET | Índice de sucursales MINSAL por comuna | mobile, web |
| `config.ts` | GET | Config runtime (farmacias activas, banner donación) | mobile, web |
| `donate.ts` | POST | Pago Khipu de monto fijo | mobile |
| `feedback.ts` | POST | Sugerencias de usuario (Resend + tabla `feedback`) | mobile, web |
| `go.ts` | GET (redirect 302) | Redirección trackeada a la farmacia real, valida dominio | mobile, web |

Diseño explícito: `alerts.ts` y `subscriptions.ts` consolidan varias acciones por función para no superar el límite de 12 funciones del plan Hobby de Vercel.

### 3.2 Servicios

- `searchService.ts`: orquesta las 9 consultas a farmacias en paralelo, filtra farmacias deshabilitadas, deduplica, adjunta CFM-ID, registra histórico de precios (best-effort), ordena por mejor precio. Expone también `searchMedicationsDetailed()` para el modo debug.
- `subscriptionService.ts`: única puerta de entrada para lógica de negocio de Premium (`getEntitlement`, `recordProviderEvent`, `grantManual`/`revokeManual`) — ningún adaptador de proveedor de pago accede directo a las tablas.

### 3.3 Clientes de farmacia

9 clientes en `api/src/clients/`: Cruz Verde (REST JSON Demandware), Salcobrand (Algolia), Ahumada (scraping HTML Demandware, frágil), Dr. Simi (REST JSON VTEX), AraucoMed (REST JSON PrestaShop), EcoFarmacias (WooCommerce Store API), Farmex (Shopify Predictive Search), Sermecoop (scraping HTML custom con sesión/CSRF), EasyFarma (scraping HTML WordPress). Más `khipu.ts` (pagos de donación) y `minsal.ts` (tipos de sucursales, usado solo por un script offline, no en runtime).

### 3.4 Middleware

- `auth.ts`: `isAuthorized()` valida `x-api-key` contra `API_SECRET_KEY` — **fallback abierto** si la variable no está configurada. `isDebugAuthorized()` es la variante estricta para `?debug=1`, sin fallback abierto.
- `rateLimit.ts`: `consumeRateLimit()` vía Upstash Redis con fallback a memoria de proceso.
- `requestId.ts`: correlación de logs por request.

### 3.5 Autenticación del backend

No hay JWT propio de `api/`. El mecanismo de servicio-a-cliente es `x-api-key`/`API_SECRET_KEY`. Aparte, `subscriptions.ts` sí verifica JWT de Supabase Auth (`Authorization: Bearer`) pasándolo a `supabase.auth.getUser(token)` — ese JWT lo emite y firma Supabase, no `api/`; es el mismo JWT que produce el login de `web/`. `CRON_SECRET` y `GOOGLE_RTDN_SECRET` son secretos separados, sin fallback abierto, para las rutas de cron y webhook de Google respectivamente.

### 3.6 RLS

Todas las tablas del esquema tienen `enable row level security`. Solo existe una policy en todo el esquema: `profiles_select_own` (lectura de la propia fila). Ninguna otra tabla tiene policies permisivas — el acceso real de `api/` y del panel admin de `web/` es siempre vía `SUPABASE_SECRET_KEY` (bypass RLS por diseño), documentado explícitamente en el propio `schema.sql`.

### 3.7 Cron

| Workflow | Frecuencia | Llama a |
|---|---|---|
| `monitor-api.yml` | cada hora | `/api/health` + cobertura de las 9 farmacias |
| `check-price-alerts.yml` | diario | `/api/alerts?action=check` (protegido por `CRON_SECRET`) |
| `update-branches.yml` | diario | No llama a `api/` — corre un script local y commitea el resultado (MINSAL bloquea IPs de Vercel) |

### 3.8 Webhooks

Todos en `subscriptions.ts`: `flow-webhook` (cobros recurrentes, valida token contra Flow), `flow-register-return` (retorno del navegador tras enrolar tarjeta, valida contra Flow), `google-rtdn` (notificaciones de Google Play vía Pub/Sub, valida `GOOGLE_RTDN_SECRET` sin fallback abierto). No existe webhook de Stripe.

### 3.9 Storage

No se usa Supabase Storage. Las imágenes de producto se sirven directo desde la URL de cada farmacia.

---

## 4. Base de Datos (Supabase / Postgres)

Fuente única: `docs/database/schema.sql` (sin carpeta de migraciones separada).

| Tabla | Propósito | Sprint | Consumidor principal |
|---|---|---|---|
| `price_history` | Snapshot diario de precio por farmacia/medicamento | Fase 1 | `api/src/lib/priceHistoryDb.ts`/`priceHistoryQuery.ts` |
| `pharmacy_clicks` | Tracking de clics "ir a comprar" | Fase 1 | `api/src/lib/clickTracking.ts`, `web/src/lib/clickStats.ts` |
| `app_config` | Config runtime editable sin redeploy | Fase 3 | `api/src/lib/appConfigDb.ts` |
| `feedback` | Bandeja de sugerencias de usuarios | Fase 3 | `api/src/lib/feedbackDb.ts`, `web/src/lib/feedbackAdmin.ts` |
| `medications` | Registro canónico de medicamentos (CFM-ID) | Sprint A / RFC-002 | `api/src/lib/medicationRegistry.ts` |
| `medication_match_key_aliases` | Traduce `match_key` → `cfm_id` | Sprint A | `api/src/lib/medicationRegistry.ts` |
| `email_alerts` | Alertas de precio por email sin cuenta | Sprint C | `api/src/lib/emailAlertsDb.ts` |
| `profiles` | Perfil ligero de usuario, `plan` como cache derivado | Sprint D | `api/src/lib/subscriptionsDb.ts`, `web/src/lib/profile*.ts` |
| `subscription_plans` | Catálogo comercial de planes | Subscription Platform F1 | `api/src/lib/subscriptionsDb.ts` |
| `subscriptions` | Estado de suscripción por usuario | Subscription Platform F1 | `api/src/lib/subscriptionsDb.ts` |
| `subscription_events` | Bitácora inmutable de eventos de proveedores de pago | Subscription Platform F1 | `api/src/lib/subscriptionsDb.ts` |
| `flow_customers` | Identidad de cliente Flow por usuario | Subscription Platform F2 / RFC-005 | `api/src/lib/subscriptionsDb.ts` |

Única función/trigger SQL: `handle_new_profile()` (`security definer`) disparada por `on_auth_user_created` sobre `auth.users`, crea la fila de `profiles` al registrarse.

Relaciones principales: `subscriptions.user_id → profiles.id → auth.users.id`; `flow_customers.user_id → profiles.id`; `subscription_events.subscription_id → subscriptions.id`; `medication_match_key_aliases.cfm_id → medications.cfm_id`; `price_history`/`pharmacy_clicks` tienen columna `cfm_id` opcional referenciando `medications`.

---

## 5. Integraciones externas

| Integración | Usada por | Para qué |
|---|---|---|
| Algolia | Backend (`clients/salcobrand.ts`) | Motor de búsqueda de Salcobrand |
| Supabase | Backend (BD completa) + Web (Auth + BD) | Persistencia Postgres y autenticación de `web/` |
| PostHog | Mobile únicamente | Analítica de producto (evento `medication_search`), no usado en `web/` ni `api/` |
| Sentry | Backend (`api/src/lib/sentry.ts`) y Mobile (`_layout.tsx`) — configuraciones independientes, no comparten proyecto | Error tracking |
| Resend | Backend | Envío de emails (feedback, alertas de precio) |
| Flow | Backend + Web | Pasarela de pago chilena para Premium |
| Google (RTDN/Pub/Sub) | Backend | Notificaciones de suscripciones de Google Play |
| Google OAuth | Web (solo `/admin/login`, vía Supabase Auth) | Login del panel admin |
| Khipu | Backend | Pagos únicos de donación |
| Expo (EAS/updates) | Mobile | Build cloud y OTA updates |
| Upstash Redis | Backend | Cache de búsquedas y rate limiting |
| Firebase | — | No existe en el repo |
| Stripe | — | Eliminado (ver 2.9) |

---

## 6. Comparación Web vs Mobile

| Funcionalidad | Mobile | Web | Backend | Estado |
|---|---|---|---|---|
| Buscar medicamentos | ✅ | ✅ | ✅ `/api/search` | Compartida |
| Resultados con filtros | ✅ | ✅ (más simple, SSR) | ✅ | Compartida |
| Ficha de medicamento | ✅ | ✅ | ✅ | Compartida (implementaciones de UI independientes) |
| Histórico de precios | ✅ (local, `priceHistory.ts`) | ✅ (servidor, `price_history`) | ✅ `/api/price-history` (solo web) | Divergente — mobile guarda snapshots en el dispositivo; web consulta el histórico centralizado en Supabase |
| Comparación multi-farmacia (carrito/receta) | ✅ Carrito (local, máx. 8) | ✅ "Mi receta" (localStorage del navegador) | ❌ (sin persistencia servidor) | Duplicada — mismo concepto, dos implementaciones independientes, sin backend compartido |
| Favoritos | ✅ Local (AsyncStorage) | ❌ | ❌ | Solo Mobile |
| Alertas de precio | ✅ Local (in-app, requiere abrir la app) | ✅ Por email (`email_alerts`, sin cuenta) | ✅ `/api/alerts` (solo web) | Divergente — mecanismos y almacenamiento completamente distintos |
| Historial de búsquedas | ✅ Local (últimos 10 términos) | ❌ | ❌ | Solo Mobile |
| Login / cuenta de usuario | ❌ | ✅ Supabase Auth (email/password) | ✅ (`profiles`, JWT verificado vía Supabase) | Solo Web |
| Perfil de usuario | ❌ | ✅ | ✅ `profiles` | Solo Web |
| Premium / suscripciones | ❌ | ✅ (motor completo, sin catálogo comercial activo) | ✅ `subscriptionService` | Solo Web (motor implementado, sin feature real gateada) |
| Pagos (Flow) | ❌ | ✅ | ✅ | Solo Web |
| Panel admin / backoffice | ❌ | ✅ (`/admin`) | ✅ (algunas acciones vía `api/`) | Solo Web |
| Compartir resultado | ✅ (`Share.share` nativo) | ❌ (no se encontró funcionalidad equivalente) | — | Solo Mobile |
| Donación | ✅ (banner + Khipu) | ❌ | ✅ `/api/donate` (solo mobile lo consume) | Solo Mobile |
| Feedback / sugerencias | ✅ (`about.tsx`) | ❌ (no se encontró formulario de feedback en `web/`) | ✅ `/api/feedback` (usado solo por mobile) | Solo Mobile |
| Analytics de producto | ✅ PostHog | ❌ | — | Solo Mobile |
| Error tracking | ✅ Sentry (proyecto mobile) | ❌ (no confirmado en este análisis para `web/`) | ✅ Sentry (proyecto backend, independiente del de mobile) | Divergente — mobile y backend usan Sentry con configuraciones independientes; web no tiene instrumentación confirmada |
| Configuración remota (farmacias activas, banner donación) | ✅ Consume `/api/config` | ✅ Consume/gestiona vía `/admin/config` | ✅ `app_config` | Integrada — web es quien administra, mobile y web son consumidores |
| Selección de comuna | ✅ (`FilterSheet`, manual) | ❌ (no se encontró selector de comuna equivalente en `web/`) | ✅ `/api/branches` (consumido por mobile) | Solo Mobile |

---

## 7. Flujo de autenticación

**Mobile: no existe ningún flujo de autenticación de usuario.** La app no tiene login, registro, ni sesión — funciona completamente anónima. La única credencial presente es `EXPO_PUBLIC_API_KEY` (opcional), una clave de servicio enviada como header `x-api-key` para autenticar la app frente al backend, no una identidad de usuario.

**Web: sí existe, vía Supabase Auth, con dos superficies independientes (usuario final y admin) que comparten el mismo mecanismo subyacente:**

- **Login (usuario final):** `web/src/app/cuenta/ingresar/page.tsx` → `LoginForm.tsx` → `supabase.auth.signInWithPassword({ email, password })` (cliente browser, `lib/supabase/client.ts`).
- **Login (admin):** `web/src/app/admin/login/page.tsx` → mismo `LoginForm.tsx`, con la opción adicional `signInWithOAuth({ provider: "google", options: { redirectTo: ".../auth/callback?next=/admin" } })`.
- **Registro:** `web/src/app/cuenta/registro/page.tsx` → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: ".../auth/callback?next=/cuenta" } })`. Si Supabase devuelve sesión inmediata (confirmación de email desactivada), redirige directo a `/cuenta`; si no, muestra pantalla "Revisa tu email".
- **Callback (OAuth + confirmación de email):** `web/src/app/auth/callback/route.ts` — un único route handler: intercambia el `code` recibido por una sesión (`exchangeCodeForSession`) y redirige a `next` (por defecto `/admin`), o al login correspondiente con `?error=auth` si falla.
- **Logout:** `web/src/components/SignOutButton.tsx` — `supabase.auth.signOut()` + `router.push(redirectTo)` + `router.refresh()`. Componente único, usado tanto en `/cuenta` como en `/admin`.
- **Refresh de sesión / persistencia:** `web/src/proxy.ts` (middleware de Next.js) intercepta cada request a `/admin/:path*` y `/cuenta/:path*`. Crea un cliente Supabase con las cookies de la request (`createServerClient` de `@supabase/ssr`), llama `supabase.auth.getUser()` (este llamado es el que refresca el access token si expiró, reescribiendo las cookies) y decide: si la ruta es pública (`/admin/login`, `/cuenta/ingresar`, `/cuenta/registro`) deja pasar; si requiere sesión y no la hay, redirige al login correspondiente; si es `/admin/*` y hay sesión pero el email no está en `ADMIN_ALLOWED_EMAILS`, redirige a `/admin/login?error=unauthorized`.
- **Recuperación de contraseña:** no se encontró ningún flujo de "olvidé mi contraseña" implementado en el código revisado (`LoginForm.tsx`, `cuenta/registro/page.tsx`) — no hay link ni handler para `resetPasswordForEmail` en `web/src`.
- **Sesiones:** gestionadas enteramente por cookies de Supabase (`@supabase/ssr`), sin manejo de cookies o tokens custom por parte del código de ComparaFarma.
- **Verificación del JWT en `api/`:** cuando `web/` llama a `api/` para operaciones de suscripción (`/api/subscriptions?action=me`, etc.), envía el `access_token` de la sesión Supabase en `Authorization: Bearer`. `api/src/routes/subscriptions.ts` (`resolveUser()`) lo verifica llamando `supabase.auth.getUser(token)` — `api/` no emite ni firma tokens propios, solo valida el que ya emitió Supabase.

**Backend (`api/`) en sí mismo no tiene una identidad de "usuario logueado" propia** — su único control de acceso de servicio-a-cliente es `x-api-key`/`API_SECRET_KEY` (ver 3.5), independiente y no relacionado con el JWT de Supabase que sí verifica puntualmente en las rutas de suscripciones.

---

## 8. Flujo de datos

**Dato que nunca sale del dispositivo (mobile):**
- Historial de búsquedas (`search-history`), favoritos con su snapshot de precios (`favorites-v1`), carrito (`cart-v1`), comuna seleccionada (`location-v1`), alertas de precio locales (`price_alerts_v1`), cache de búsqueda (`search_cache_v10_*`), histórico de precio local por medicamento (`price_history_v1_*`), contador/dismiss de donación, flag de onboarding visto, flag de tooltip visto. Todo vive únicamente en `AsyncStorage` del dispositivo — ningún endpoint de `api/` los lee ni los recibe.

**Dato que el dispositivo envía al backend pero el backend no persiste más allá de logs operativos (con IP usada solo como clave de rate limit, nunca registrada):**
- El término de búsqueda (`q` en `/api/search`) — se usa para consultar las farmacias y se registra en logs estructurados (`console.info`) junto al `requestId`, pero no en una tabla asociada a un usuario.
- Los parámetros de `/api/branches`, `/api/config` — solo lectura, sin body de usuario.

**Dato que el dispositivo envía y el backend sí persiste en Supabase (mobile):**
- Feedback (`about.tsx` → `/api/feedback`): mensaje + email opcional → tabla `feedback`, además reenviado por email vía Resend al desarrollador.
- Snapshot de precio de cada búsqueda exitosa (`searchService.ts`, transparente para el usuario, sin dato personal): tabla `price_history`.
- Clic en "ir a la farmacia" (`/api/go`): tabla `pharmacy_clicks`, sin dato personal (solo `match_key`/`pharmacy_slug`/timestamp).
- Solicitud de donación (`/api/donate`): monto + creación de pago Khipu (no se encontró que se persista en Supabase; el pago lo gestiona Khipu).

**Dato que el navegador envía y el backend persiste en Supabase (web):**
- Registro/login: credenciales gestionadas íntegramente por Supabase Auth (`auth.users`), fuera de las tablas propias de ComparaFarma. Al registrarse se crea automáticamente `profiles` (email, plan).
- Alertas de precio por email (`/api/alerts`): email + `matchKey` + precio objetivo → tabla `email_alerts`.
- Suscripción/pago (Flow): datos de tarjeta (`card_brand`, `card_last4`, nunca el número completo) + identidad de cliente Flow → tabla `flow_customers`; estado de suscripción → `subscriptions`; eventos crudos del proveedor → `subscription_events` (`raw_payload` jsonb).
- "Mi receta": la lista de medicamentos vive en `localStorage` del navegador, nunca se envía al backend como lista — solo se consultan precios individuales vía `getRecipePrices` (server action que internamente llama a `searchMedications`, sin guardar la lista en Supabase).

**Dato que un sistema externo envía al backend (webhooks):**
- Flow: notificación de pago (token opaco) → backend resuelve contra la API de Flow → actualiza `subscriptions`/`subscription_events`.
- Google Play (RTDN/Pub/Sub): notificación de suscripción → backend actualiza `subscriptions`/`subscription_events`.

**Analítica anónima que sale del dispositivo hacia un tercero (no hacia el backend propio):**
- Mobile → PostHog: evento `medication_search` (query, resultados, farmacias, mejor precio, comuna), con `distinct_id` anónimo por instalación.
- Mobile → Sentry / Backend → Sentry: datos técnicos de error; en mobile, el query de búsqueda puede quedar incluido como contexto adicional en caso de excepción.

**Resumen de dirección:** mobile es predominantemente local-first (favoritos/historial/alertas/carrito nunca salen del dispositivo salvo para consultar el backend de búsqueda); web es predominantemente servidor-first (cuenta, alertas, suscripciones y "mi receta" — salvo la lista misma de "mi receta", que es local al navegador). El backend (`api/`) es el único punto de contacto con las farmacias externas para ambas plataformas — ni mobile ni web consultan directamente los sitios de las farmacias.

---

## 9. Estado de convergencia por funcionalidad

| Funcionalidad | Convergencia |
|---|---|
| Buscar medicamentos | Compartida — mismo backend, misma lógica de dominio (`@comparafarma/domain`), UI independiente por plataforma. |
| Ficha de medicamento | Compartida — mismo backend y datos, UI independiente. |
| Histórico de precios | Divergente — mobile usa un histórico local por dispositivo; web usa el histórico centralizado en Supabase; son fuentes de datos distintas que no se reconcilian entre sí. |
| Comparación de varios medicamentos (carrito / mi receta) | Duplicada — mismo concepto de producto, dos implementaciones de datos y UI completamente independientes, sin tabla compartida. |
| Favoritos | Solo Mobile. |
| Historial de búsquedas | Solo Mobile. |
| Compartir | Solo Mobile. |
| Donación | Solo Mobile (aunque el endpoint `/api/donate` es del backend compartido, hoy solo lo consume mobile). |
| Feedback | Solo Mobile (aunque el endpoint `/api/feedback` es del backend compartido, no se encontró un formulario equivalente en web). |
| Alertas de precio | Divergente — mobile: local/in-app, requiere abrir la app; web: por email, sin cuenta, con backend y tabla propia. Ningún mecanismo de alerta es compartido entre plataformas ni un usuario puede ver en una plataforma las alertas creadas en la otra. |
| Login / cuenta / perfil | Solo Web. |
| Premium / suscripciones / pagos | Solo Web — el motor de entitlement (`subscriptionService`) está preparado para ser consultado por cualquier cliente autenticado, pero mobile no tiene autenticación de usuario, por lo que no puede consultarlo hoy. |
| Panel admin | Solo Web (dentro del mismo proyecto Next.js, sin deploy propio). |
| Analytics de producto | Solo Mobile (PostHog). |
| Error tracking | Integrada por separado — existe en mobile y en backend, pero son dos proyectos/configuraciones de Sentry independientes, no una vista unificada. |
| Configuración remota (farmacias activas, banner donación) | Integrada — `api/` es la fuente única, web administra desde `/admin/config`, mobile y web consumen. |
| Selección de comuna / sucursales | Solo Mobile del lado de UI de selección, aunque el dato (`/api/branches`) es del backend compartido. |

---

## Validación final

### Documentos revisados
- `docs/analysis/PROJECT_INVENTORY.md`
- `docs/architecture/DOMAIN_MODEL.md`
- `docs/architecture/RFC-006_MEDICATION_DETAIL_AND_PRICE_HISTORY.md`
- `docs/release/PRODUCTION_READINESS_V2.md`
- `docs/launch/PRODUCTION_READINESS_REVIEW.md`
- `docs/product/PRODUCT_BLUEPRINT.md`
- `docs/program/README.md`, `PROGRAM_BOARD.md`, `MASTER_BACKLOG.md`
- RFC-001 a RFC-006, ADR-0001 a ADR-0004 (`docs/engineering/rfc/`, `docs/engineering/adr/`)
- `docs/database/schema.sql`
- `CLAUDE.md`

### Código inspeccionado
- `mobile/src/app/**`, `mobile/src/lib/**`, `mobile/src/store/**`, `mobile/src/hooks/**`, `mobile/src/components/**` (uso puntual), `mobile/app.json`, `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/package.json`.
- `web/src/app/**`, `web/src/lib/**`, `web/src/components/**` (uso puntual), `web/src/proxy.ts`, `web/package.json`.
- `api/api/**`, `api/src/routes/**`, `api/src/services/**`, `api/src/clients/**`, `api/src/middleware/**`, `api/src/lib/**`, `api/.env.example`.
- `.github/workflows/ci.yml`, `monitor-api.yml`, `check-price-alerts.yml`, `update-branches.yml`.
- `docs/database/schema.sql` (esquema completo).

### Documentos modificados
Ninguno.

### Documento creado
`docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md` (este documento).

---

Este documento describe el estado actual verificado contra código a la fecha de corte. No contiene propuestas, RFC, ADR, priorización, estimación de esfuerzo ni roadmap. Detenido a la espera de aprobación explícita antes de continuar con cualquier trabajo de integración Web-Mobile.
