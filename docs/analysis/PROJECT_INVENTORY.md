# Project Inventory — ComparaFarma

**Tipo:** Documento de análisis (inventario objetivo del estado actual)
**Fecha de corte:** 2026-08-04
**Alcance:** snapshot del repositorio a esta fecha — código, configuración y documentación existentes.
**No es:** un modelo de Arquitectura Empresarial, un roadmap, una propuesta de arquitectura ni un backlog. No reemplaza ningún documento existente.
**Método:** lectura directa de código (`mobile/`, `web/`, `api/`, `packages/domain/`), configuración (`package.json`, `.env.example`, `vercel.json`, workflows de GitHub Actions) y documentación (`docs/**`). Toda afirmación cita su evidencia. Donde no hay evidencia suficiente para confirmar un dato, se marca explícitamente como **incierto**.

---

## 1. Resumen Ejecutivo

**Estado general:** el proyecto tiene tres superficies de producto con niveles de madurez distintos. La comparación de precios (el producto original) está operativa y es el componente más maduro: 9 integraciones de farmacia, tests, monitoreo horario. Alrededor de ese núcleo se construyeron, entre julio y agosto de 2026, varias capacidades nuevas (receta completa, alertas por email, cuenta de usuario, motor de suscripciones, backoffice) que están implementadas y en producción, pero sin métricas de uso real todavía. `mobile/` está congelado por estar en Prueba Cerrada de Google Play; todo el desarrollo reciente ocurrió en `web/` y `api/`.

**Componentes principales (evidencia: `package.json` raíz, `pnpm-workspace.yaml`):**
- `mobile/` — app Expo/React Native (Android + iOS).
- `web/` — sitio Next.js 16 (público + panel `/admin`).
- `api/` — backend serverless en Vercel (10 funciones).
- `packages/domain/` (`@comparafarma/domain`) — tipos y lógica de negocio compartida entre los tres anteriores.
- Supabase (Postgres) — persistencia (12 tablas confirmadas en `docs/database/schema.sql`).
- 9 integraciones de farmacia + Flow, Google Play, MINSAL, Khipu, Resend, Upstash Redis, Sentry, PostHog, Algolia.

**Nivel de madurez observado (detalle completo en sección 10):** heterogéneo. Búsqueda/comparación: operativo y maduro. Suscripciones: motor completo pero sin catálogo comercial real ni verificación de compra real en mobile. Receta completa, alertas email, cuenta, backoffice: operativos, recientes, sin datos de uso. Bioequivalentes e IA: investigación/idea, sin código. Publicación Android en producción: bloqueada (última evidencia encontrada, 2026-07-31, señala un bloqueante pendiente).

**Documentación:** volumen alto (más de 100 archivos `.md`), gobierno desigual. Coexisten documentos activamente usados (`docs/product/BACKLOG_PRODUCT.md`, `DECISION_LOG.md`, `docs/engineering/*`) con documentos completamente vacíos, documentos desactualizados respecto al código, y carpetas creadas pero vacías o sin control de versiones. Detalle completo en sección 9.

---

## 2. Productos existentes

### ComparaFarma Mobile
- **Estado:** operativo en Prueba Cerrada de Google Play (no en producción pública). Congelado para cambios de código.
- **Objetivo (por evidencia de código):** comparar precios de medicamentos en 9 farmacias desde una app Android/iOS, con favoritos, historial, carrito, alertas in-app y donaciones.
- **Evidencia:** `mobile/app.json` (`bundleIdentifier`/`package`: `mla.app.comparafarma`, `versionCode: 31`, `version: 1.4.0`); `mobile/src/app/{index,results,medication,cart,onboarding,about}.tsx`; `mobile/src/store/` (8 stores Zustand).
- **Documentación relacionada:** `docs/release/RELEASE_READINESS_V1.md`, `PLAY_CONSOLE_CHECKLIST.md`, `PRODUCTION_BLOCKERS_PLAN.md`, `docs/product/PRODUCT_REVIEW_V1.md`, `docs/funcionalidades.md` (desactualizado, ver sección 9), `CLAUDE.md` (restricción activa de no modificar `mobile/`).

### ComparaFarma Web
- **Estado:** operativo en producción pública (`https://app-compara-farma-web.vercel.app`, según `api/.env.example` / `WEB_APP_URL`).
- **Objetivo (por evidencia de código):** búsqueda pública con SEO, ficha de medicamento con histórico de precios, comparación de "receta completa" (varios medicamentos), cuenta de usuario con plan premium.
- **Evidencia:** `web/src/app/page.tsx`, `buscar/[query]/page.tsx`, `medicamento/[slug]/page.tsx`, `mi-receta/page.tsx`, `cuenta/page.tsx`.
- **Documentación relacionada:** `docs/architecture/RFC-006_MEDICATION_DETAIL_AND_PRICE_HISTORY.md` (renombrado de RFC-002 el 2026-08-06, ver WEB-002), `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_WEB_1.md`, `SPRINT-02-UX-AND-INTELLIGENCE.md`, `PROMPT_CLAUDE_SPRINT_E_RECETA_COMPLETA.md`, `PROMPT_CLAUDE_SPRINT_D_CUENTA_LIGERA.md`, `docs/engineering/rfc/RFC-005_WEB_BILLING_FLOW.md`.

### API (backend)
- **Estado:** operativo en producción (`https://comparafarma-api.vercel.app`), 10 funciones serverless.
- **Objetivo (por evidencia de código):** consultar las 9 farmacias en paralelo, normalizar y deduplicar resultados, exponer `/api/search` y servicios auxiliares.
- **Evidencia:** `api/api/{alerts,branches,config,donate,feedback,go,health,price-history,search,subscriptions}.ts` (10 archivos); `api/src/routes/*`; `api/src/clients/*` (9 farmacias + `minsal.ts` + `khipu.ts`).
- **Documentación relacionada:** `CLAUDE.md`, `docs/pharmacy-apis.md`, `docs/normalization.md`, `docs/price-channels.md`, `docs/deployment.md`.

### Panel `/admin` (Backoffice)
- **Estado:** operativo en producción, dentro del mismo proyecto Next.js de `web/` (no es una aplicación ni deploy separado). No tiene nombre de producto propio en ningún documento de `docs/product/`.
- **Objetivo (por evidencia de código):** dashboard de clicks por farmacia (comentario explícito en código: "base para evaluar el modelo de afiliación"), gestión de configuración/feature-flags de farmacias, bandeja de feedback, gestión manual de usuarios y planes premium.
- **Evidencia:** `web/src/app/admin/(dashboard)/{page.tsx,config/page.tsx,feedback/page.tsx,usuarios/page.tsx}`; `web/src/lib/{clickStats,feedbackAdmin,profilesAdmin,adminAllowlist}.ts`.
- **Documentación relacionada:** mención breve en `docs/funcionalidades.md` y `docs/product/COMPANY_STRATEGY.md` ("Fase 3 — panel admin"). No existe un documento de producto dedicado a este componente.

### Otros componentes (no son "productos" con interfaz propia, pero son parte del inventario de componentes principales)
- **`packages/domain` (`@comparafarma/domain`):** paquete compartido de tipos y lógica de negocio (matching, normalización, pricing, deduplicación) consumido por los tres productos anteriores. Sin interfaz propia. Evidencia: `packages/domain/src/*`.
- **Supabase:** base de datos y autenticación compartida por `api/` y `web/`. Evidencia: `docs/database/schema.sql`.

No se encontró evidencia de una aplicación iOS nativa separada, app de escritorio, ni de un "Backoffice" como despliegue independiente — el panel admin vive dentro de `web/`.

---

## 3. Capacidades identificadas

| Capacidad | Estado | Evidencia | Componentes |
|---|---|---|---|
| Búsqueda multi-farmacia | Operativa | `api/src/services/searchService.ts` (`Promise.allSettled` sobre 9 clients); `mobile/src/lib/search.ts`; `web/src/lib/search.ts` | api, mobile, web |
| Normalización y deduplicación (`matchKey`) | Operativa | `packages/domain/src/{matching,normalization,deduplication}.ts`; RFC-001, ADR-0001 | domain (compartido) |
| Cálculo de precio efectivo por canal | Operativa | `packages/domain/src/pricing.ts`; tabla de canales en `CLAUDE.md` | domain |
| Ficha pública de medicamento + histórico | Operativa | `web/src/app/medicamento/[slug]/page.tsx`; `api/src/routes/priceHistory.ts`; RFC-006 (`docs/architecture/`, renombrado de RFC-002 el 2026-08-06) | web, api |
| Favoritos | Operativa (solo mobile) | `mobile/src/store/favoritesStore.ts` | mobile |
| Historial de búsquedas | Operativa (solo mobile) | `mobile/src/store/historyStore.ts` | mobile |
| Historial de precios — mecanismo mobile | Operativa | `mobile/src/lib/priceHistory.ts` (snapshots locales en AsyncStorage, últimos 14) | mobile |
| Historial de precios — mecanismo web/api | Operativa | `api/src/lib/priceHistoryDb.ts` + tabla Supabase `price_history` | web, api |
| Alertas de precio — mobile (in-app) | Operativa | `mobile/src/store/alertsStore.ts`, `toastStore.ts` — sin persistencia backend evidenciada | mobile |
| Alertas de precio — web (email) | Operativa | tabla `email_alerts`, `api/src/routes/alerts.ts`, `.github/workflows/check-price-alerts.yml` (cron diario) | web, api |
| Carrito (mobile, máx. 8 items) | Operativa | `mobile/src/store/cartStore.ts`, `mobile/src/app/cart.tsx` | mobile |
| Comparación de "receta completa" (web, máx. 8 items, sin cuenta) | Operativa | `web/src/lib/{recipeComparison,recipeList}.ts`, `mi-receta/page.tsx` | web |
| Filtro por farmacia / ordenamiento (mobile) | Operativa | `mobile/src/store/filterStore.ts`, `FilterSheet.tsx` | mobile |
| Filtro geográfico por comuna | Operativa | `mobile/src/store/locationStore.ts`, `CommuneSelector.tsx`, `api/src/clients/minsal.ts`, `.github/workflows/update-branches.yml` | mobile, api |
| Cuenta de usuario (web) | Operativa | `web/src/app/cuenta/*`; tabla `profiles`; Supabase Auth email+password, sin OAuth para usuario final | web |
| Motor de suscripciones (backend agnóstico de proveedor) | Operativa | `api/src/services/subscriptionService.ts`; ADR-0002; tablas `subscription_plans/subscriptions/subscription_events` | api |
| Adaptador Google Play (suscripciones) | Parcial | `api/src/lib/adapters/googlePlayAdapter.ts` — implementado, sin verificación end-to-end de compra real (mobile congelado) | api |
| Adaptador Flow (suscripciones web) | Parcial | `api/src/lib/adapters/flowAdapter.ts`; RFC-005/ADR-0004 — código completo, credenciales de producción en Vercel pendientes (confirmado como pendiente explícito del CEO) | api, web |
| Otorgamiento manual de premium | Operativa | `web/src/app/admin/(dashboard)/usuarios/page.tsx`; acción `grant-manual`/`revoke-manual` | web, api |
| Registro Canónico de Medicamentos (CFM-ID) | Parcial / **incierto** | `api/src/lib/medicationRegistry.ts`; tablas `medications`/`medication_match_key_aliases` en `docs/database/schema.sql` — el propio script indica que deben correrse a mano en Supabase y que, si no se corrieron, el sistema sigue funcionando con `cfmId: null`; no se encontró evidencia en esta revisión de que esa migración específica ya se haya ejecutado en producción | api |
| Feedback de usuarios | Operativa | `api/src/routes/feedback.ts`; tabla `feedback`; `web/src/app/admin/(dashboard)/feedback/page.tsx` | web, api |
| Tracking de clicks a farmacia | Operativa | `api/api/go.ts`; tabla `pharmacy_clicks`; dashboard admin | web, api |
| Feature flags de farmacias | Operativa | `docs/pharmacy-flags.md`; tabla `app_config`; `api/src/lib/pharmacyFlags.ts`; fallback `DISABLED_PHARMACIES` | api, web |
| Donaciones | Operativa (mobile, vía links fijos) / **incierto** el uso exacto del endpoint dinámico de `api/` | `mobile/src/constants/donation.ts` (URLs Khipu fijas); `api/src/clients/khipu.ts` + `api/src/routes/donate.ts` (genera pago dinámico vía HMAC) — no se pudo determinar desde qué superficie se consume este segundo mecanismo | mobile, api |
| Bioequivalentes | Investigación / Planificada | Campo `isBioequivalent` existe pero es heterogéneo (`docs/architecture/DOMAIN_MODEL.md` §1); spike de datos cerrado 2026-07-31 sin fuente regulatoria confiable integrada | domain, api |
| IA (escaneo de receta, sustitutos terapéuticos) | Idea / Futuro | Solo mencionado en `docs/product/PRODUCT_CANVAS.md` y `FEATURE_STATUS.md` — sin código | — |
| Push notifications | Idea / Futuro | Sin código (`expo-notifications` no está presente en `mobile/`, verificado por búsqueda); mencionado en `docs/product/PRODUCT_REVIEW_V1.md` backlog v2.0 | — |

---

## 4. Activos estratégicos identificados

| Activo | Estado | Fuente de verdad | Consumidores | Evidencia |
|---|---|---|---|---|
| Catálogo Maestro de Información Farmacéutica | Planificado (Draft estratégico, sin tabla operativa equivalente) | `docs/strategy/MASTER_DATA_STRATEGY.md` (Draft, sin control de versiones confirmado) | Ninguno en código real todavía | `MASTER_DATA_STRATEGY.md` |
| CFM-ID (Registro Canónico) | Parcial / incierto (ver capacidad en sección 3) | `docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` + `schema.sql` | `searchService.ts` (`attachCanonicalIds`), `price_history.cfm_id`, `pharmacy_clicks.cfm_id` | `medicationRegistry.ts` |
| Histórico de precios | Operativo | Tabla `price_history` (Supabase), poblada desde 2026-07-20 | Ficha de medicamento (web), gráfico (mobile y web), `/api/price-history` | `priceHistoryDb.ts`, `priceHistoryQuery.ts` |
| Motor de Comparación (`matchKey`/`mergeDuplicates`/`effectivePrice`) | Operativo | `packages/domain/src/{matching,deduplication,pricing}.ts` — única fuente desde RFC-001/ADR-0001 | api, mobile, web (todos vía `@comparafarma/domain`) | `CLAUDE.md`, ADR-0001 |
| Red de Fuentes (integraciones de farmacia) | Operativo, 9 farmacias activas | `api/src/clients/*.ts` | `searchService.ts` | 9 archivos de cliente |
| Motor de Suscripciones | Parcial | `api/src/services/subscriptionService.ts` + tablas `subscription_*` | `web/cuenta`, `web/admin/usuarios`; mobile solo como consumidor potencial de entitlement (no se encontró UI de compra en el código de `mobile/src/app/*` revisado — **incierto** si existe) | ADR-0002 |
| Plataforma Analítica | Planificado / aspiracional | Mencionado como activo en `docs/strategy/VISION_2030.md`, sin código dedicado equivalente | — | `VISION_2030.md` |
| Datos de sucursales por comuna (MINSAL) | Operativo | `api/src/data/branches-data.ts`/`branches.json`, regenerado diariamente | `mobile` (`CommuneSelector`), `api/api/branches.ts` | `.github/workflows/update-branches.yml` |

Nota de duplicación (solo constancia, sin propuesta de solución): `docs/strategy/VISION_2030.md` ya enumera 7 "activos estratégicos" con nombres que se superponen con esta lista (Catálogo Maestro, Historial de precios, Registro Canónico CFM-ID, Motor de Comparación, Red de Fuentes, Motor de Suscripciones, Plataforma Analítica) — la lista de esta sección 4 fue construida de forma independiente a partir de evidencia de código, y coincide en gran medida con esa enumeración previa.

---

## 5. Servicios de negocio existentes

| Servicio | Backend | API | Web | Mobile | Estado |
|---|---|---|---|---|---|
| Búsqueda | ✅ `searchService.ts` | ✅ `/api/search` | ✅ (SSR) | ✅ | Operativo |
| Comparación (dedupe + effectivePrice) | ✅ `domain` | ✅ (vía search) | ✅ | ✅ | Operativo |
| Historial de precios | ✅ `priceHistoryDb.ts` (Supabase) | ✅ `/api/price-history` | ✅ (ficha medicamento) | ✅, pero con mecanismo **distinto** (snapshots locales, no la misma fuente de datos) | Operativo, fragmentado entre plataformas |
| Autenticación | Supabase Auth directo (sin servicio propio) | N/A (no hay endpoint de login propio) | ✅ `/cuenta/*`, `/admin/login` (2 audiencias distintas) | ❌ sin autenticación de usuario final | Parcial, solo en web |
| Suscripciones | ✅ `subscriptionService.ts` | ✅ `/api/subscriptions` | ✅ `/cuenta`, `/admin/usuarios` | Incierto — sin UI de compra encontrada en el código revisado | Parcial |
| Alertas | Dos mecanismos no unificados (mobile local vs. web+email) | ✅ `/api/alerts` (solo canal web) | ✅ | ✅ (mecanismo propio, sin backend) | Parcial / fragmentado |

---

## 6. Aplicaciones

- **ComparaFarma Mobile** — Android e iOS, un solo código base Expo/React Native. Evidencia: `mobile/`.
- **ComparaFarma Web** — Next.js, sitio público. Evidencia: `web/src/app/` (fuera de `admin/`).
- **Panel `/admin`** — sub-ruta protegida dentro de la misma app Next.js de `web/`, no es un despliegue independiente. Evidencia: `web/src/app/admin/`.
- **API** — backend sin interfaz de usuario propia. Evidencia: `api/`.

No se encontró evidencia de aplicaciones adicionales (app de escritorio, extensión, app B2B separada) en el código actual.

---

## 7. Integraciones

| Integración | Finalidad | Estado | Evidencia |
|---|---|---|---|
| Cruz Verde | Precios (Demandware REST) | Operativa | `api/src/clients/cruzverde.ts` |
| Salcobrand | Precios (Algolia Search API) | Operativa | `api/src/clients/salcobrand.ts` |
| Farmacias Ahumada | Precios (HTML scraping Demandware) | Operativa, con riesgo de fragilidad documentado | `api/src/clients/ahumada.ts`, advertencia en `CLAUDE.md` |
| Dr. Simi | Precios (VTEX REST) | Operativa | `api/src/clients/drsimi.ts` |
| AraucoMed | Precios (PrestaShop JSON) | Operativa | `api/src/clients/araucomed.ts` |
| EcoFarmacias | Precios (WooCommerce Store API) | Operativa | `api/src/clients/ecofarmacias.ts` |
| Farmex | Precios (Shopify Predictive Search) | Operativa | `api/src/clients/farmex.ts` |
| Sermecoop | Precios (HTML scraping PHP custom) | Operativa, con riesgo de timeout documentado | `api/src/clients/sermecoop.ts` |
| EasyFarma | Precios (HTML scraping WordPress) | Operativa | `api/src/clients/easyfarma.ts` |
| Supabase | Persistencia (12 tablas) + Auth | Operativa | `docs/database/schema.sql`, `api/src/lib/supabaseClient.ts` |
| Upstash Redis | Rate limiting distribuido + caché | Operativa | `api/src/middleware/rateLimit.ts` |
| Algolia | Motor de búsqueda de Salcobrand (dependencia de terceros, no propia) | Operativa | `api/.env.example` (`ALGOLIA_APP_ID`/`ALGOLIA_API_KEY`) |
| Sentry | Error tracking | Operativa condicional en `api/` (solo si `SENTRY_DSN` está seteado); presente como dependencia en `mobile/` (`@sentry/react-native`), DSN de mobile no verificado en esta revisión | `api/src/lib/sentry.ts`, `mobile/package.json` |
| PostHog | Analítica de producto (mobile) | Operativa | `mobile/package.json` (`posthog-react-native`), `mobile/src/lib/analytics.ts` |
| Resend | Envío de emails (feedback, alertas) | Operativa, con deuda conocida (dominio sandbox `onboarding@resend.dev`, sin dominio propio verificado) | `api/.env.example`, `PROMPT_CLAUDE_SPRINT_C_ALERTAS_EMAIL.md` |
| Flow | Pagos/suscripciones web (checkout hospedado + webhook) | Operativa en código; credenciales de producción en Vercel pendientes de configurar (explícitamente diferido por el CEO) | ADR-0004, RFC-005, `api/src/lib/adapters/flowAdapter.ts` |
| Google Play Billing / RTDN | Pagos/suscripciones mobile (server-to-server) | Parcial — implementado, sin verificación end-to-end con compra real | ADR-0002, `api/src/lib/adapters/googlePlayAdapter.ts` |
| Khipu | Donaciones | Operativa en mobile (links fijos); cliente genérico adicional en `api/` cuyo consumidor exacto es **incierto** | `mobile/src/constants/donation.ts`, `api/src/clients/khipu.ts`, `api/src/routes/donate.ts` |
| MINSAL | Datos de sucursales de farmacia por comuna | Operativa, con restricción operativa (el fetch corre localmente porque MINSAL bloquea IPs de Vercel) | `api/src/clients/minsal.ts`, `.github/workflows/update-branches.yml` |
| Google Play Console | Publicación de la app Android | Parcial — en Prueba Cerrada, no en producción | `docs/release/*` |
| GitHub Actions | CI/CD, monitoreo, cron | Operativa — 4 workflows: `ci.yml`, `monitor-api.yml` (cada hora), `check-price-alerts.yml` (diario), `update-branches.yml` (diario, 06:00 Chile) | `.github/workflows/*` |
| Vercel | Hosting de `api/` y `web/` (2 proyectos separados) | Operativa | `docs/deployment.md`, `api/vercel.json` |

---

## 8. Modelo de datos (dominios principales, no tablas completas)

1. **Resultados de búsqueda** (transitorios, no persistidos): `MedicationResult`/`PharmacyPrice`, definidos en `packages/domain/src/types.ts`, viven en memoria de request o en `AsyncStorage`/caché de cliente.
2. **Histórico de precios:** tabla `price_history` (con `cfm_id` opcional).
3. **Identidad canónica de medicamento:** tablas `medications`, `medication_match_key_aliases` (CFM-ID).
4. **Operación/interacción:** tablas `pharmacy_clicks`, `feedback`, `app_config`.
5. **Alertas de precio (web):** tabla `email_alerts`.
6. **Identidad y perfil de usuario:** tabla `profiles` (extiende `auth.users` de Supabase Auth).
7. **Suscripciones y facturación:** tablas `subscription_plans`, `subscriptions`, `subscription_events`, `flow_customers`.
8. **Datos geográficos/sucursales:** archivo estático `branches.json`/`branches-data.ts`, generado localmente — no es una tabla de Supabase.

No existe todavía un dominio de datos clínicos/regulatorios estructurado (bioequivalencia, código ATC, registro ISP) más allá del campo booleano `isBioequivalent`, que el propio `docs/architecture/DOMAIN_MODEL.md` (§1) describe como heterogéneo en calidad y sin trazabilidad.

---

## 9. Documentación — fuentes de verdad y duplicidades detectadas

(Solo constancia de lo observado — no se proponen soluciones.)

- **Visión/misión del producto:** existen tres documentos con contenido parcialmente superpuesto — `docs/product/VISION.md`, `docs/strategy/VISION_2030.md`, y menciones narrativas en `docs/book/`. Ninguno declara explícitamente ser la fuente única sobre los otros dos.
- **Activos estratégicos:** enumerados en `docs/strategy/VISION_2030.md` ("Nuestros activos estratégicos") y conceptualmente superpuestos con `docs/strategy/MASTER_DATA_STRATEGY.md` (Catálogo Maestro) y con la estructura que propone `docs/enterprise/README.md` (un documento "Strategic Assets" separado, todavía no escrito). Ninguno de los tres se cita como fuente de los otros.
- **Conteo de farmacias integradas:** `CLAUDE.md` documenta 9 (consistente con el código: 9 archivos en `api/src/clients/`). `docs/farmacias.md`, `docs/price-channels.md`, `docs/pharmacy-apis.md` y `docs/product/FEATURE_STATUS.md` documentan solo 4-5 — desactualizados respecto al código real.
- **Numeración de RFC duplicada:** existían dos documentos distintos llamados "RFC-002" — `docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` y `docs/architecture/RFC-002_MEDICATION_DETAIL_AND_PRICE_HISTORY.md` — confirmado por lectura directa de ambos. **Resuelto el 2026-08-06 (WEB-002, Decisión 5):** el segundo se renombró a `RFC-006_MEDICATION_DETAIL_AND_PRICE_HISTORY.md`, sin cambios en su contenido técnico.
- **Historial de precios (nombre de capacidad duplicado, datos no unificados):** el mecanismo de mobile (`mobile/src/lib/priceHistory.ts`, snapshots locales en `AsyncStorage`) y el de web/api (tabla Supabase `price_history`, `priceHistoryDb.ts`) comparten nombre pero no comparten fuente de datos.
- **Documentos de producto vacíos** (confirmado por lectura directa, sin contenido): `docs/product/BACKLOG_TECH.md`, `KPIS.md`, `RELEASES.md`, `IDEAS.md`, `QUALITY.md`, `DATA_POLICY.md`.
- **Estado de publicación en Google Play:** `docs/release/RELEASE_READINESS_V1.md` (revisión 2026-06-30) recomienda explícitamente "NO PUBLICAR"; `docs/release/PRODUCTION_BLOCKERS_PLAN.md` y `PLAY_CONSOLE_CHECKLIST.md` (mismo corte de fecha, contenido parcialmente actualizado después) marcan 3 de 4 bloqueantes como resueltos; `docs/actas/20260731b.md` confirma que a esa fecha solo quedaba pendiente el bloqueante de Data Safety. No se encontró ningún documento posterior que confirme el cierre de ese punto — el estado final de publicación queda **incierto** desde la documentación disponible.
- **Frecuencia del monitor de API:** `docs/deployment.md` indica "cada 6 horas"; `CLAUDE.md` y el cron real en `.github/workflows/monitor-api.yml` (`0 * * * *`) confirman que corre cada hora — `deployment.md` está desactualizado en este punto.
- **Carpetas de gobernanza documental vacías o no versionadas:** `docs/adr/`, `docs/rfc/` y `docs/operations/` existen en el árbol de trabajo pero están vacías y no están trackeadas en git; `docs/enterprise/README.md` existe pero tampoco está trackeado en git, y su tabla de referencias cita `docs/adr/`/`docs/rfc/` (vacías) como si fueran las fuentes reales de ADR/RFC — los documentos reales de ese tipo están en `docs/engineering/adr/` y `docs/engineering/rfc/`.
- **`docs/strategy/*.md` (3 archivos):** declaran "Versión 1.0"/"Draft" pero no tienen historial de commits en git — sin trazabilidad de versionado real a pesar del encabezado.
- **Anomalías de nivel raíz sin resolución documentada:** `_CLAUDE_TMP_BORRAR/` (contiene archivos `.tmpmoved` y locks de git antiguos), `audit-package/`, `ml_borrar/`, `scripts-temp/` — carpetas con nombre indicativo de ser temporales, presentes en el árbol de trabajo, sin ninguna decisión documentada de conservarlas o eliminarlas.

### 9.1 Estado de aprobación — Documentación de Identidad Visual (Fase 1, cerrada 2026-08-06)

Actualización posterior a la fecha de construcción original de este inventario (2026-08-04). El comité de ComparaFarma declaró formalmente cerrada la Fase 1 (Brand Identity) en el sprint `PROJECT-001` — ver `docs/project/PROJECT_PHASES.md`. Todos los documentos siguientes quedan marcados:

**STATUS = APPROVED**

| Documento | Ruta |
|---|---|
| Brand Foundations | `docs/brand/BRAND_FOUNDATIONS.md` |
| Brand Architecture / Visual Identity (Brand DNA) | `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/VISUAL_IDENTITY.md` |
| Brand Kit (Guidelines, Logo, Color, Tipografía, Iconografía) | `docs/brand/BRAND_GUIDELINES.md`, `LOGO_SYSTEM.md`, `COLOR_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md` |
| Creative Direction (Design Concept) | `docs/brand/DESIGN_CONCEPT.md` |
| Visual Benchmark | `docs/design/VISUAL_BENCHMARK.md` |
| Visual Direction | `docs/design/VISUAL_DIRECTION.md` |
| Color Research | `docs/design/COLOR_RESEARCH.md` |
| Visual Exploration | `docs/design/VISUAL_EXPLORATION.md` |
| Brand Experience v1 | `docs/design/BRAND_EXPERIENCE_V1.md` |
| Distinctive Product Identity (BRAND-002) | `docs/design/DISTINCTIVE_PRODUCT_IDENTITY.md` |
| Signature Components (BRAND-003) | `docs/design/SIGNATURE_COMPONENTS.md` |

Esta marca de estado no reemplaza la advertencia ya vigente en cada uno de estos documentos, gobernados por `docs/brand/README.md`/`DOMAIN_STATUS.md` (dominio Brand, "Managed" desde antes de este sprint) y ahora también por `docs/design/README.md` y `docs/design-system/README.md` (sección "Frozen" agregada en este mismo sprint): cualquier modificación futura requiere RFC aprobado por el comité.

---

## 10. Estado de madurez

| Componente / Capacidad | Madurez | Evidencia que respalda la evaluación |
|---|---|---|
| Búsqueda y comparación de precios (9 farmacias) | **Operativo** | 9 clientes con tests, CI, monitor cada hora |
| Normalización/deduplicación (`packages/domain`) | **Operativo** | RFC-001/ADR-0001 implementado, suite de tests dedicada |
| Web pública (SEO, ficha de medicamento, histórico) | **Operativo** | en producción; RFC-002 implementado; tests por componente |
| Backoffice `/admin` | **Operativo** | en producción; 4 sub-secciones funcionales |
| Alertas de precio (web, email) | **Operativo** | tabla + cron + endpoint funcionando; sin métricas de uso real encontradas en el repo |
| Cuenta de usuario + planes (web) | **Operativo** | Supabase Auth funcionando; activación de plan sin flujo de pago obligatorio |
| Motor de Suscripciones (backend) | **Operativo** | ADR-0002 implementado; 172 tests reportados en CF-127 |
| Suscripciones vía Google Play (mobile) | **Parcial** | adaptador implementado; sin verificación end-to-end con compra real (mobile congelado) |
| Suscripciones vía Flow (web) | **Parcial** | código completo y mergeado a `main`; credenciales de producción en Vercel pendientes de configurar |
| Catálogo comercial de planes | **Planificado** | solo existe el plan placeholder "cortesía" (`is_available=false`); sin precios reales definidos |
| Registro Canónico de Medicamentos (CFM-ID) | **Parcial / incierto** | código y modelo de datos existen; ejecución de la migración SQL en producción no confirmada en la evidencia revisada |
| Catálogo Maestro (activo estratégico) | **Planificado** | solo estrategia en estado Draft; sin tabla operativa equivalente |
| Bioequivalentes | **Investigación / Planificado** | spike de datos cerrado, sin fuente regulatoria confiable integrada, sin código de UI |
| IA (escaneo de receta, sustitutos terapéuticos) | **Futuro / Idea** | solo mencionado en documentos de producto; sin código |
| Push notifications | **Futuro / Idea** | sin código; mencionado solo en backlog v2.0 |
| Publicación Android en Google Play (producción) | **Parcial / Bloqueado** | en Prueba Cerrada; último estado documentado (2026-07-31) señala un bloqueante pendiente |
| App iOS | **Futuro** | mencionado como fase futura en `docs/product/COMPANY_STRATEGY.md`; sin evidencia de código o build |
| Identidad Visual / Brand Kit (Fase 1) | **Aprobado / Congelado** | 11 entregables cerrados por el comité el 2026-08-06 (`PROJECT-001`); ver §9.1. Cualquier cambio futuro requiere RFC |
| Experiencia de Resultados (Fase 2) | **Materializado** | `docs/product/experiences/RESULTS.md` + mockups Desktop/Tablet/Mobile/Estados (`PRODUCT-002`, 2026-08-06) |

---

## Notas de método

- Este documento fue construido leyendo directamente el código y la configuración de `mobile/`, `web/`, `api/`, `packages/domain/`, y una parte sustancial de `docs/**` (incluyendo `docs/product/`, `docs/strategy/`, `docs/architecture/`, `docs/engineering/`, `docs/database/`, `docs/release/`, `docs/actas/`, `docs/prompt/`, `docs/audits/`, y los archivos de configuración raíz).
- No se leyeron con el mismo nivel de detalle: el contenido completo de cada uno de los 27 issues (`docs/engineering/issues/CF-101` a `CF-127`, solo se indexaron), ni el contenido línea por línea de cada test o cliente de farmacia (se verificó su existencia y propósito declarado, no su implementación completa).
- Todo punto marcado como **incierto** representa un límite real de la evidencia disponible en esta revisión, no una suposición.
