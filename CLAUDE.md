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
├── package.json                 ← pnpm workspaces: mobile + api + packages/*
├── pnpm-workspace.yaml
├── packages/
│   └── domain/                  ← @comparafarma/domain (tipos + normalización compartidos)
│       └── src/
│           ├── types.ts         ← PharmacySlug, PriceChannels, PharmacyPrice, MedicationResult, etc.
│           ├── matching.ts      ← matchKey()
│           ├── normalization.ts ← cleanQuery()
│           ├── pricing.ts       ← effectivePrice(), toPharmacyPrice(), toMedicationResult()
│           ├── deduplication.ts ← mergeDuplicates()
│           ├── index.ts         ← barrel (exports con .js para NodeNext ESM)
│           └── __tests__/       ← 38 tests + snapshot de contrato
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
└── mobile/                      ← Expo app (React Native + Expo Router v3)
    └── src/
        ├── app/                 ← index.tsx (Home), results.tsx, medication.tsx,
        │                           onboarding.tsx, cart.tsx, about.tsx
        ├── components/          ← SearchBar, MedicationListItem, PriceRow, PriceChannel,
        │                           PharmacyBadge, PharmacyLogo, EmptyState, SkeletonCard,
        │                           DonationBanner, AlertSheet, FilterSheet, InAppToast,
        │                           PriceHistoryChart, PriceChannelSheet
        ├── lib/
        │   ├── search.ts        ← client HTTP al backend `/api/search`
        │   ├── types.ts         ← shim: export type * from "@comparafarma/domain"
        │   ├── priceHistory.ts  ← recordPriceSnapshot(), getPriceHistory()
        │   ├── donationGate.ts  ← lógica de cuándo mostrar DonationBanner
        │   ├── cache.ts         ← AsyncStorage LRU, TTL 30 min, prefijo search_cache_v10_
        │   └── formatters.ts    ← formatCLP(), scrapedAgo()
        ├── store/               ← Zustand: search, history, favorites, cart, filter,
        │                           location, alerts, toast
        ├── hooks/               ← useSearch.ts, useDebounce.ts
        └── constants/           ← pharmacies.ts (PHARMACIES config), donation.ts, theme colors
```

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
- Monitor productivo: `.github/workflows/monitor-api.yml` (soporta `API_SECRET_KEY`)
- Deploy automático del backend: push a `main`
- Runtime móvil recomendado: development build, porque el proyecto usa `expo-dev-client`
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
- **versionCode actual**: 31 (v1.4.0) — subido a Prueba Cerrada en Play Console

## Advertencia: Fragilidad del Scraper de Ahumada

`api/src/clients/ahumada.ts` extrae precios con regex sobre HTML del storefront de Demandware. Si Ahumada actualiza su layout, el scraper puede fallar silenciosamente (devuelve array vacío).

Señal de alerta: búsquedas de medicamentos comunes no retornan resultados de Ahumada.

Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`, `linkM`, `badgeM` y publicar OTA update (`eas update`).

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

## Operación GitHub/Vercel

- `CI` corre en push y PR a `main`
- jobs actuales: `typecheck`, `domain-tests`, `api-tests`, `deploy-api`
- `deploy-api` usa `VERCEL_TOKEN` y despliega `api/` a producción (requiere los 3 jobs anteriores)
- `Monitor API` corre cada 6 horas y también manualmente; pasa `API_SECRET_KEY` desde secrets
- si el monitor falla:
  - sube artefacto `api-healthcheck-report`
  - crea un issue con etiqueta `monitoring`
  - deja la corrida en rojo

## Cache Versioning

Al agregar campos a `MedicationResult` o `PharmacyPrice`, incrementar el prefijo en `mobile/src/lib/cache.ts`:
```typescript
const CACHE_PREFIX = "search_cache_v10_"; // incrementar al cambiar la estructura
```
