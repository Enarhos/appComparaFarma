# ComparaFarma — Contexto del Proyecto

App móvil (React Native + Expo) que compara en tiempo real los precios de medicamentos en **9 farmacias chilenas**: Cruz Verde, Farmacias Ahumada, Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop y EasyFarma. Distingue cuatro canales de precio: presencial (tienda física), online/web, precio con tarjeta de fidelización (CMR/T.Más/Fonasa/Plus) y SBPay (Salcobrand).

## Arquitectura

- `mobile` consulta siempre el backend `api/` mediante `EXPO_PUBLIC_API_URL`
- `api/` consulta las farmacias, normaliza, deduplica y responde a la app
- si `EXPO_PUBLIC_API_URL` no está definido, la búsqueda falla explícitamente
- lógica compartida (tipos, normalización, deduplicación) en `packages/domain` (`@comparafarma/domain`)

```
App móvil (Expo)                     Backend (Vercel)
      ↓                                   ↓
 searchMedications() ─────────────→ GET /api/search?q=...
                                          ↓
                                     Promise.allSettled([
                                       searchCruzVerde(),
                                       searchSalcobrand(),
                                       searchAhumada(),
                                       searchDrSimi(),
                                       searchAraucoMed(),
                                       searchEcoFarmacias(),
                                       searchFarmex(),
                                       searchSermecoop(),
                                       searchEasyFarma(),
                                     ])
                                              ↓
                                  mergeDuplicates() → MedicationResult[]
```

Puntos de entrada:
- `mobile/src/lib/search.ts → searchMedications()`
- `api/api/search.ts → /api/search`

## Estructura del Repositorio (Monorepo pnpm)

```
compara-farma/
├── CLAUDE.md
├── package.json                 ← pnpm workspaces: mobile + api + packages/* + web
├── pnpm-workspace.yaml
├── packages/
│   └── domain/                  ← @comparafarma/domain (tipos + normalización compartidos)
│       └── src/
│           ├── types.ts         ← PharmacySlug, PriceChannels, PharmacyPrice, MedicationResult, etc.
│           ├── matching.ts      ← matchKey()
│           ├── normalization.ts ← cleanQuery()
│           ├── pricing.ts       ← effectivePrice(), toPharmacyPrice(), toMedicationResult()
│           ├── deduplication.ts ← mergeDuplicates()
│           ├── basket.ts        ← computeAllInOneTotals() (Domain Consolidation v2)
│           ├── index.ts         ← barrel (exports con .js para NodeNext ESM)
│           └── __tests__/       ← 52 tests + snapshot de contrato
├── api/                         ← backend mínimo para Vercel
│   ├── api/                     ← entrypoints serverless: search.ts, health.ts
│   └── src/
│       ├── routes/              ← handlers HTTP
│       ├── services/            ← searchService
│       ├── clients/             ← integraciones con 9 farmacias
│       ├── lib/                 ← tipos (shim → @comparafarma/domain), cache, http helpers
│       └── middleware/          ← auth, rate limit, request id
├── docs/
│   ├── pharmacy-apis.md         ← endpoints, auth, response schemas por farmacia
│   ├── price-channels.md        ← semántica de presencial/online/CMR/SBPay
│   ├── normalization.md         ← cleanQuery(), matchKey(), mergeDuplicates()
│   ├── deployment.md            ← Vercel, GitHub Actions, EAS, monitoreo
│   ├── privacy-policy.html      ← política de privacidad (publicada en GitHub Pages)
│   ├── release/                 ← PLAY_CONSOLE_CHECKLIST.md, RELEASE_READINESS, etc.
│   └── screenshots/             ← capturas para Play Store
├── mobile/                      ← Expo app (React Native + Expo Router v3)
│   └── src/
│       ├── app/                 ← index.tsx (Home), results.tsx, medication.tsx,
│       │                           onboarding.tsx, cart.tsx, about.tsx
│       ├── components/          ← SearchBar, MedicationListItem, PriceRow, PriceChannel,
│       │                           PharmacyBadge, PharmacyLogo, EmptyState, SkeletonCard,
│       │                           DonationBanner, AlertSheet, FilterSheet, InAppToast,
│       │                           PriceHistoryChart, PriceChannelSheet
│       ├── lib/
│       │   ├── search.ts        ← client HTTP al backend `/api/search`
│       │   ├── types.ts         ← shim: export type * from "@comparafarma/domain"
│       │   ├── priceHistory.ts  ← recordPriceSnapshot(), getPriceHistory()
│       │   ├── donationGate.ts  ← lógica de cuándo mostrar DonationBanner
│       │   ├── cache.ts         ← AsyncStorage LRU, TTL 30 min, prefijo search_cache_v10_
│       │   └── formatters.ts    ← formatCLP(), scrapedAgo()
│       ├── store/               ← Zustand: search, history, favorites, cart, filter,
│       │                           location, alerts, toast
│       ├── hooks/               ← useSearch.ts, useDebounce.ts
│       └── constants/           ← pharmacies.ts (PHARMACIES config), donation.ts, theme colors
└── web/                         ← Next.js 16 (App Router), SEO — proyecto Vercel propio, deploy automático
    └── src/
        ├── app/                 ← page.tsx (Home), buscar/[query]/page.tsx (resultados, generateMetadata dinámico)
        ├── components/          ← SearchBox, MedicationCard
        ├── constants/           ← pharmacies.ts (copia local, no importa de mobile/ — ver restricción abajo)
        └── lib/                 ← search.ts (fetch server-side a /api/search), format.ts
```

Producción: `https://app-compara-farma-web.vercel.app` (Fase 2a del plan de empresa, ver `docs/product/COMPANY_STRATEGY.md`).

## APIs de Farmacias

| Farmacia | Tipo | Notas |
|---|---|---|
| Cruz Verde | REST JSON (Demandware) | — |
| Salcobrand | Algolia Search API | — |
| Ahumada | HTML scraping Demandware | Frágil — ver sección "Advertencia" |
| Dr. Simi | REST JSON (VTEX) | — |
| AraucoMed | PrestaShop JSON | — |
| EcoFarmacias | WooCommerce `/wp-json/wc/store/v1/products` | onlineOnly=true |
| Farmex | Shopify Predictive Search | cmr = Fonasa |
| Sermecoop | HTML scraping PHP custom (Concepción) | GET→POST con PHPSESSID + CSRF; riesgo timeout Vercel |
| EasyFarma | HTML scraping WordPress | onlineOnly=true; cmr = Plus; data-src para imágenes |

## Canales de Precio por Farmacia

| Canal | Cruz Verde | Salcobrand | Ahumada | Dr. Simi | AraucoMed | EcoFarmacias | Farmex | Sermecoop | EasyFarma |
|---|---|---|---|---|---|---|---|---|---|
| `store` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `online` | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `cmr` | ❌ | ✅ T. Más | ✅ CMR | ❌ | ❌ | ❌ | ✅ Fonasa | ❌ | ✅ Plus |
| `sbpay` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

`effective = min(store, online ?? store, cmr ?? store, sbpay ?? store)`

## Contrato de Tipos

Definido en `packages/domain/src/types.ts`. Los shims `mobile/src/lib/types.ts` y `api/src/lib/types.ts` re-exportan desde `@comparafarma/domain`.

```typescript
type PharmacySlug = "cruz-verde" | "salcobrand" | "ahumada" | "dr-simi"
                  | "araucoMed" | "ecofarmacias" | "farmex" | "sermecoop" | "easyfarma";

interface PriceChannels {
  store: number;
  online: number | null;
  cmr: number | null;
  sbpay: number | null;
  effective: number;
}

interface PharmacyPrice {
  pharmacySlug: PharmacySlug;
  pharmacyName: string;
  productName: string;
  channels: PriceChannels;
  hasStock: boolean;
  hasOnlineDelivery: boolean;
  onlineUrl: string | null;
  imageUrl: string | null;
  fetchedAt: string;
}

interface MedicationResult {
  matchKey: string;           // ej: "paracetamol|500mg|20" (active|dose|qty)
  canonicalName: string;
  laboratory: string | null;
  isBioequivalent: boolean;
  prices: PharmacyPrice[];    // sorted by channels.effective ASC
  bestPrice: number;
  bestPharmacy: string;
  imageUrl: string | null;
}
```

## Funcionalidades Implementadas

- **Búsqueda** con debounce (500ms), limpieza de query (`cleanQuery`), caché 30 min
- **Deduplicación** por `matchKey = {principioActivo}|{dosis}|{cantidad}` — evita mezclar pack sizes distintos
- **Favoritos**: guardar/quitar con corazón en tarjeta; sección horizontal en Home; precios cacheados en Zustand+AsyncStorage
- **Filtro por farmacia y ordenamiento**: FilterSheet con toggle por farmacia, sort (precio/nombre), solo con delivery online
- **Filtro bioequivalente**: toggle en pantalla de resultados con contador
- **Compartir precio**: botón en detalle con formato "Medicamento — desde $X en Farmacia (Canal)"
- **Modo oscuro**: `darkMode: "media"` en NativeWind, dark: variants en todas las pantallas y componentes clave
- **Skeleton loading**: 3 placeholders animados con Reanimated durante la búsqueda
- **Historial**: últimas 10 búsquedas, eliminar individual o todo, con hápticos
- **Historial de precios**: gráfico de barras con últimos 14 snapshots (`price_history_v1_*`)
- **Alertas de precio**: objetivo guardado en `alertsStore`, toast in-app cuando el precio baja
- **Banner de donación**: aparece en detalle cuando ahorro > $1.000. Fondo rose, corazón rojo. Botones $1k/$3k/$5k/Otro abre links Khipu directamente vía `Linking.openURL()`. Config en `mobile/src/constants/donation.ts`.
- **Carrito**: tabla comparativa por farmacia, max 8 items, `cartStore` persistido
- **Onboarding**: 5 slides; modo normal (1ª vez) y modo help (botón ?)
- **Monitor API con autenticación**: health check soporta `API_SECRET_KEY` en header `x-api-key`

## Estado Actual

- Producción backend: `https://comparafarma-api.vercel.app`
- Endpoint principal app: `GET /api/search?q=...`
- Healthcheck: `GET /api/health`
- Diagnóstico: `GET /api/search?q=paracetamol&debug=1`
- CI GitHub: `.github/workflows/ci.yml`
- Monitor productivo: `.github/workflows/monitor-api.yml` — corre **cada hora** (antes cada 6h), cubre las **9 farmacias** (antes solo 4), y auto-asigna el issue de fallo al owner del repo para notificación por email
- Deploy automático del backend: push a `main` (ver sección "Operación GitHub/Vercel" — el mecanismo de deploy cambió el 2026-07-19, leer antes de tocar `ci.yml`/`vercel.json`)
- Runtime móvil recomendado: development build, porque el proyecto usa `expo-dev-client`
- Rate limiting: Upstash Redis (mismo store que el caché) con fallback a memoria — `api/src/middleware/rateLimit.ts`
- Error tracking backend: Sentry (`api/src/lib/sentry.ts`), condicional a `SENTRY_DSN` en Vercel (proyecto `comparafarma-api` en sentry.io, región US) — sin esa var, no hace nada
- Expo/React Native actuales en `mobile/package.json`:
  - `expo ~54.0.34`
  - `react-native 0.81.5`
  - `react 19.1.0`

## Stores Zustand

| Store | Persistencia | Propósito |
|---|---|---|
| `searchStore` | No | Estado de búsqueda en curso (loading/results/error) |
| `historyStore` | AsyncStorage `search-history` | Últimas 10 búsquedas |
| `favoritesStore` | AsyncStorage `favorites-v1` | matchKeys favoritos + MedicationResult cacheado |
| `cartStore` | AsyncStorage `cart-v1` | Lista de compras (max 8 items) |
| `filterStore` | No | activePharmacies, sortBy, onlineSalesOnly |
| `locationStore` | No | selectedCommune |
| `alertsStore` | AsyncStorage `price_alerts_v1` | Alertas de precio activas |
| `toastStore` | No | Cola de toasts in-app, auto-dismiss 5s |

## Flujo de una Búsqueda

```
Usuario escribe "paracetamol 500"
  → cleanQuery() → "paracetamol"
  → check AsyncStorage cache (TTL 30 min, prefijo search_cache_v10_)
      [HIT]  → mostrar resultados cacheados
      [MISS] → searchMedications("paracetamol")
               → fetch /api/search?q=paracetamol
               → backend consulta 9 farmacias
               → backend normaliza, deduplica y ordena
             → guardar en AsyncStorage
             → mostrar en pantalla Results
```

## Comandos de Desarrollo

```bash
pnpm install                     # instalar todas las dependencias (raíz)
pnpm dev                         # iniciar Expo (equivale a expo start)
pnpm dev:api                     # iniciar backend con vercel dev
pnpm android                     # iniciar en Android
pnpm ios                         # iniciar en iOS
pnpm typecheck                   # type check completo (mobile + api + domain)
pnpm --filter api test           # tests backend
pnpm --filter @comparafarma/domain test  # tests domain package
pnpm --filter api healthcheck:prod       # check productivo manual
```

## Publicación

```bash
# Build de producción Android AAB — método preferido (sin cuota EAS)
pnpm build:android
# → genera mobile/android/app/build/outputs/bundle/release/app-release.aab
# El script parchea versionCode/versionName en build.gradle automáticamente desde app.json
# Requiere: Android Studio instalado; EXPO_NO_METRO_WORKSPACE_ROOT=1 (lo setea el script)

# Build via EAS cloud (requiere cuota mensual free)
eas build --platform android --profile production --non-interactive

# Fix urgente sin nuevo build (solo cambios JS/TS)
eas update --branch production --message "fix: ..."
```

- **Package Android**: `mla.app.comparafarma`
- **Bundle ID iOS**: `mla.app.comparafarma`
- **Categoría**: Health & Fitness
- **Política de privacidad**: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`
- **versionCode actual**: 31 (v1.4.0) — aprobado por Google Play para producción el 2026-08-13 (pendiente de publicación/propagación completa en el listado público)

## Advertencia: Fragilidad del Scraper de Ahumada

`api/src/clients/ahumada.ts` extrae precios con regex sobre HTML del storefront de Demandware. Si Ahumada actualiza su layout, el scraper puede fallar silenciosamente (devuelve array vacío).

Señal de alerta: búsquedas de medicamentos comunes no retornan resultados de Ahumada.

Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`, `linkM`, `badgeM` y publicar OTA update (`eas update`).

## Advertencia: MINSAL bloquea el fetch automatizado (HTTP 403) — dato de sucursales congelado desde junio

`scripts-temp/fetch-branches.js` (corrido por `.github/workflows/update-branches.yml`, cron diario) intenta descargar `https://midas.minsal.cl/farmacia_v2/WS/getLocales.php` para poblar `api/src/data/branches.json`/`branches-data.ts` (consumido por el filtro de comuna en Mobile: `CommuneSelector`, `FilterSheet`, `useSearch`). Diagnóstico del 2026-08-14 (revisión `docs/operations/PLATFORM_SERVICE_REVIEW_MINSAL.md`, OPS-REV-007) confirmó, con logs reales de Actions, que **las 71/71 ejecuciones desde que existe el workflow (2026-06-03) fallan con `MINSAL HTTP 403`** — MINSAL bloquea también las IPs de GitHub Actions, no solo las de Vercel (el comentario original en `api/src/clients/minsal.ts` solo mencionaba Vercel). El dato que sirve hoy `/api/branches` es una carga manual congelada del 2026-06-08, hecha por el CTO desde su red local — no hay actualización automática funcionando.

**Ya corregido (2026-08-14):** el workflow ahora tiene `continue-on-error` y crea un issue automático (`labels: monitoring, bug`) cuando el fetch falla, en vez de fallar en seco y en silencio (commit `2d5691f`). **Sin resolver todavía:** el bloqueo de IP en sí — requiere decidir una alternativa (IP residencial/self-hosted runner, u otra vía) o aceptar que este dato quedará desactualizado. No asumir que "correr el workflow de nuevo" lo va a arreglar sin cambiar la IP de origen del fetch.

## Advertencia: Metro + TypeScript ESM (packages/domain)

`packages/domain` usa `moduleResolution: NodeNext` con `"type": "module"`, por lo que `src/index.ts` usa extensiones `.js` en sus re-exports (ej. `export { matchKey } from "./matching.js"`). Metro no resuelve `.js` → `.ts` automáticamente.

**Fix aplicado en `mobile/metro.config.js`**: el `resolveRequest` personalizado intenta `.ts` cuando Metro no puede encontrar un import `.js`:
```js
if (moduleName.endsWith(".js")) {
  try { return context.resolveRequest(context, moduleName.slice(0, -3) + ".ts", platform); }
  catch { /* genuine .js file */ }
}
```
No cambiar las extensiones en `packages/domain/src/index.ts` — son obligatorias para Node.js ESM.

## Historial: restricción de `mobile/` durante Prueba Cerrada (levantada 2026-08-13)

Google Play aprobó el pase de `mobile/` de Prueba Cerrada a producción el 2026-08-13 (publicación/propagación del listado público aún en curso). La restricción que existía mientras la revisión estaba en curso ("no modificar código de `mobile/`") queda levantada — ya no aplica ningún bloqueo especial sobre cambios en la app móvil más allá de la disciplina normal del proyecto (branch → PR → validación → aprobación).

Pendiente para una sesión de producto/estrategia (no asumir por defecto): revisar si esto reactiva la Fase 2b ("sincronización de cuentas en la app") descrita en `docs/product/COMPANY_STRATEGY.md` sección 5, que estaba pausada específicamente por esta restricción.

## Advertencia: `packages/domain` necesita compilarse a JS real

`packages/domain/package.json` tiene un script `"postinstall": "tsc --project tsconfig.build.json"` que compila `src/` a `dist/` (JS + `.d.ts`) en **cualquier** `pnpm install` — local, CI, o el remoto de Vercel. El `"exports"`/`"main"`/`"types"` del paquete apuntan a `dist/`, no a `src/`.

**No volver a apuntar `"exports"` directo a `src/index.ts`.** Antes del 2026-07-19 así estaba, y funcionaba en `mobile` solo porque Metro tiene un resolver custom que mapea `.js` → `.ts` (ver advertencia anterior) — pero Node.js/Vercel en producción no tiene ese truco, y `/api/search` crasheaba en runtime con `ERR_MODULE_NOT_FOUND` al importar `@comparafarma/domain` (no es un error de build, el deploy podía terminar "exitoso" igual). Detalle completo en `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`.

Si se agrega un submódulo nuevo a `packages/domain/src/`, no hace falta tocar nada más — `tsconfig.build.json` compila todo `src/**/*.ts` (excepto `__tests__/`) automáticamente.

## Operación GitHub/Vercel

- `CI` corre en push y PR a `main`
- jobs actuales: `typecheck`, `domain-tests`, `api-tests`, `deploy-api`
- `deploy-api` usa `VERCEL_TOKEN` y despliega a producción (requiere los 3 jobs anteriores)
- `Monitor API` corre cada hora y también manualmente; pasa `API_SECRET_KEY` desde secrets
- si el monitor falla:
  - sube artefacto `api-healthcheck-report`
  - crea un issue con etiqueta `monitoring`, **auto-asignado al owner del repo** (dispara email)
  - deja la corrida en rojo

### ⚠️ Deploy del backend — leer antes de tocar `ci.yml` o `vercel.json` de `api/`

El 2026-07-19 el deploy estuvo roto (probablemente desde la migración a `@comparafarma/domain`) sin que nadie lo notara — el detalle completo está en `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`. Reglas que salieron de ese incidente, **no revertir sin entender por qué**:

1. El step "Deploy API to Vercel" en `ci.yml` corre `vercel deploy` **desde la raíz del monorepo**, sin `working-directory: api`. Si se corre desde adentro de `api/`, Vercel solo sube esa carpeta y nunca puede resolver `"@comparafarma/domain": "workspace:*"` (falla con `EUNSUPPORTEDPROTOCOL`).
2. En el dashboard de Vercel del proyecto `comparafarma-api`, **Root Directory debe ser `api`** (no vacío). Sin esto, Vercel no encuentra `api/vercel.json` ni resuelve las funciones en la ruta correcta.
3. `api/vercel.json` define `"functions": {"api/*.ts": {...}}` con un **glob explícito**. Sin esto, al subir el monorepo completo Vercel detecta cada `.ts` de `api/src/` (clientes, rutas, tests) como función independiente y supera el límite de 12 funciones del plan Hobby.
4. `packages/domain` se compila a JS real vía `postinstall` (`tsc` → `dist/`) — ver advertencia dedicada más abajo.

### ⚠️ Vercel Hobby y uso comercial (donaciones) — decisión pendiente del CTO, no técnica

Revisión del 2026-08-14 (`docs/operations/PLATFORM_SERVICE_REVIEW_VERCEL.md`, OPS-REV-005) encontró que el plan Hobby de Vercel prohíbe explícitamente uso comercial, y su propia documentación oficial (`vercel.com/docs/limits/fair-use-guidelines`) lista **"Asking for Donations"** como ejemplo textual de eso. `mobile/src/constants/donation.ts` confirma que ComparaFarma ya solicita donaciones activas vía Khipu en producción (`DonationBanner`) — es decir, `comparafarma-api` y `comparafarma-web` corren hoy en un plan que Vercel define como no permitido para este uso, con riesgo real (no solo teórico) de pausa de cuenta sin aviso previo garantizado, que afectaría ambos proyectos a la vez.

No hay ningún fix de código para esto — es una decisión de negocio entre dos caminos, documentada como pendiente en la revisión: (A) pagar el upgrade a Vercel Pro ($20/mes), o (B) dar de baja el `DonationBanner`/cualquier funcionalidad de pago (incluyendo no activar Flow, hoy pausado, mientras se esté en Hobby) y permanecer gratis. No asumir que el plan Hobby es "seguro" solo porque no ha pasado nada todavía.

## Cache Versioning

Al agregar campos a `MedicationResult` o `PharmacyPrice`, incrementar el prefijo en `mobile/src/lib/cache.ts`:
```typescript
const CACHE_PREFIX = "search_cache_v10_"; // incrementar al cambiar la estructura
```
