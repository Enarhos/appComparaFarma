# ComparaFarma — Contexto del Proyecto

App móvil (React Native + Expo) que compara en tiempo real los precios de medicamentos en las cuatro principales cadenas de farmacias de Chile: **Cruz Verde**, **Farmacias Ahumada**, **Salcobrand** y **Dr. Simi**. Distingue claramente cuatro canales de precio: presencial (tienda física), online/web, precio con tarjeta de fidelización (CMR Falabella en Ahumada, Tarjeta Más en Salcobrand) y SBPay (Salcobrand).

## Arquitectura

El repo ahora funciona en un solo modo:

- `mobile` consulta siempre el backend `api/` mediante `EXPO_PUBLIC_API_URL`
- `api/` consulta las farmacias, normaliza, deduplica y responde a la app
- si `EXPO_PUBLIC_API_URL` no está definido, la búsqueda falla explícitamente

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
├── package.json                 ← pnpm workspaces: mobile + api
├── pnpm-workspace.yaml
├── api/                         ← backend mínimo para Vercel
│   ├── api/                     ← entrypoints serverless: search.ts, health.ts
│   └── src/
│       ├── routes/              ← handlers HTTP
│       ├── services/            ← searchService
│       ├── clients/             ← integraciones con farmacias
│       ├── lib/                 ← tipos, normalización, cache, http helpers
│       └── middleware/          ← auth, rate limit, request id
├── docs/
│   ├── pharmacy-apis.md         ← endpoints, auth, response schemas por farmacia
│   ├── price-channels.md        ← semántica de presencial/online/CMR/SBPay
│   ├── normalization.md         ← cleanQuery(), matchKey(), mergeDuplicates()
│   ├── deployment.md            ← Vercel, GitHub Actions, EAS, monitoreo
│   ├── privacy-policy.html      ← política de privacidad (publicada en GitHub Pages)
│   └── screenshots/             ← capturas para Play Store
└── mobile/                      ← Expo app (React Native + Expo Router v3)
    └── src/
        ├── app/                 ← rutas: index.tsx (Home), results.tsx, medication.tsx
        ├── components/          ← SearchBar, MedicationCard, PriceRow, PriceChannel,
        │                           PharmacyBadge, EmptyState, SkeletonCard
        ├── lib/
        │   ├── search.ts        ← client HTTP al backend `/api/search`
        │   ├── normalization.ts ← cleanQuery(), matchKey(), effectivePrice()
        │   ├── cache.ts         ← AsyncStorage LRU, TTL 30 min, prefijo search_cache_v6_
        │   └── formatters.ts    ← formatCLP(), scrapedAgo()
        ├── store/               ← Zustand: searchStore, historyStore, favoritesStore
        ├── hooks/               ← useSearch.ts (useCallback), useDebounce.ts
        └── constants/           ← pharmacies.ts (PHARMACIES config), theme colors
```

## APIs de Farmacias

| Farmacia | Tipo | Endpoint |
|---|---|---|
| Cruz Verde | REST JSON (Demandware) | `https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search` |
| Salcobrand | Algolia Search API | `https://GM3RP06HJG-dsn.algolia.net/1/indexes/sb_variant_production/query` |
| Ahumada | HTML scraping (Demandware storefront) | `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show` |
| Dr. Simi | REST JSON (VTEX Catalog) | `https://www.drsimi.cl/api/catalog_system/pub/products/search/{query}?_from=0&_to=9` |

## Canales de Precio por Farmacia

| Canal | Cruz Verde | Salcobrand | Ahumada | Dr. Simi |
|---|---|---|---|---|
| `store` (presencial) | ✅ | ✅ `normal_price` | ✅ badge HTML | ✅ `ListPrice` |
| `online` (web) | ❌ | ✅ `direct_discount` | ❌ | ✅ `Price` (si < store) |
| `cmr` (tarjeta) | ❌ | ✅ `cmr_price` → "T. Más" | ✅ → "CMR" | ❌ |
| `sbpay` | ❌ | ✅ `direct_discount_sbpay` | ❌ | ❌ |

`effective = min(store, online ?? store, cmr ?? store, sbpay ?? store)`

## Contrato de Tipos

```typescript
type PharmacySlug = "cruz-verde" | "salcobrand" | "ahumada" | "dr-simi";

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
- **Filtro bioequivalente**: toggle en pantalla de resultados con contador
- **Compartir precio**: botón en detalle con formato "Medicamento — desde $X en Farmacia (Canal)"
- **Modo oscuro**: `darkMode: "media"` en NativeWind, dark: variants en todas las pantallas y componentes clave
- **Skeleton loading**: 3 placeholders animados con Reanimated durante la búsqueda
- **Historial**: últimas 10 búsquedas, eliminar individual o todo, con hápticos

## Estado Actual

- Producción backend: `https://comparafarma-api.vercel.app`
- Endpoint principal app: `GET /api/search?q=...`
- Healthcheck: `GET /api/health`
- Diagnóstico: `GET /api/search?q=paracetamol&debug=1`
- CI GitHub: `.github/workflows/ci.yml`
- Monitor productivo: `.github/workflows/monitor-api.yml`
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

## Flujo de una Búsqueda

```
Usuario escribe "paracetamol 500"
  → cleanQuery() → "paracetamol"
  → check AsyncStorage cache (TTL 30 min, prefijo search_cache_v6_)
      [HIT]  → mostrar resultados cacheados
      [MISS] → searchMedications("paracetamol")
               → fetch /api/search?q=paracetamol
               → backend consulta farmacias
               → backend normaliza, deduplica y ordena
             → guardar en AsyncStorage
             → mostrar en pantalla Results
```

## Comandos de Desarrollo

```bash
pnpm install           # instalar todas las dependencias (raíz)
pnpm dev               # iniciar Expo (equivale a expo start)
pnpm dev:api           # iniciar backend con vercel dev
pnpm android           # iniciar en Android
pnpm ios               # iniciar en iOS
pnpm typecheck         # type check completo
pnpm --filter api test # tests backend
pnpm --filter api healthcheck:prod # check productivo manual
```

## Publicación

```bash
# Build de producción (Android AAB)
eas build --platform android --profile production --non-interactive

# Fix urgente sin nuevo build (solo cambios JS)
eas update --branch production --message "fix: ..."
```

- **Package Android**: `mla.app.comparafarma`
- **Bundle ID iOS**: `mla.app.comparafarma`
- **Categoría**: Health & Fitness
- **Política de privacidad**: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`
- **versionCode actual**: 10

## Advertencia: Fragilidad del Scraper de Ahumada

`api/src/clients/ahumada.ts` extrae precios con regex sobre HTML del storefront de Demandware. Si Ahumada actualiza su layout, el scraper puede fallar silenciosamente (devuelve array vacío).

Señal de alerta: búsquedas de medicamentos comunes no retornan resultados de Ahumada.

Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`, `linkM`, `badgeM` y publicar OTA update (`eas update`).

## Operación GitHub/Vercel

- `CI` corre en push y PR a `main`
- jobs actuales: `typecheck`, `api-tests`, `deploy-api`
- `deploy-api` usa `VERCEL_TOKEN` y despliega `api/` a producción
- `Monitor API` corre cada 6 horas y también manualmente
- si el monitor falla:
  - sube artefacto `api-healthcheck-report`
  - crea un issue con etiqueta `monitoring`
  - deja la corrida en rojo

## Cache Versioning

Al agregar campos a `MedicationResult` o `PharmacyPrice`, incrementar el prefijo en `mobile/src/lib/cache.ts`:
```typescript
const CACHE_PREFIX = "search_cache_v6_"; // incrementar al cambiar la estructura
```
