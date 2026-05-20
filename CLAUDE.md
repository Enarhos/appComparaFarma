# ComparaFarma — Contexto del Proyecto

App móvil (React Native + Expo) que compara en tiempo real los precios de medicamentos en las cuatro principales cadenas de farmacias de Chile: **Cruz Verde**, **Farmacias Ahumada**, **Salcobrand** y **Dr. Simi**. Distingue claramente cuatro canales de precio: presencial (tienda física), online/web, precio con tarjeta de fidelización (CMR Falabella en Ahumada, Tarjeta Más en Salcobrand) y SBPay (Salcobrand).

## Arquitectura

La app llama **directamente** a las APIs de cada farmacia desde el dispositivo móvil — sin backend ni servidor intermedio. React Native no tiene restricciones CORS (no es un browser).

```
App móvil (Expo)
      ↓
 Promise.allSettled([
   searchCruzVerde(),    ← REST JSON (Demandware)
   searchSalcobrand(),   ← Algolia Search API
   searchAhumada(),      ← HTML scraping (fetch + regex)
   searchDrSimi(),       ← REST JSON (VTEX Catalog API)
 ])
      ↓
 mergeDuplicates() → MedicationResult[]
```

El punto de entrada es `mobile/src/lib/search.ts → searchMedications()`.

## Estructura del Repositorio (Monorepo pnpm)

```
compara-farma/
├── CLAUDE.md
├── package.json                 ← pnpm workspaces: mobile
├── pnpm-workspace.yaml
├── docs/
│   ├── pharmacy-apis.md         ← endpoints, auth, response schemas por farmacia
│   ├── price-channels.md        ← semántica de presencial/online/CMR/SBPay
│   ├── normalization.md         ← cleanQuery(), matchKey(), mergeDuplicates()
│   ├── deployment.md            ← EAS Build, EAS Submit
│   ├── privacy-policy.html      ← política de privacidad (publicada en GitHub Pages)
│   └── screenshots/             ← capturas para Play Store
└── mobile/                      ← Expo app (React Native + Expo Router v3)
    └── src/
        ├── app/                 ← rutas: index.tsx (Home), results.tsx, medication.tsx
        ├── components/          ← SearchBar, MedicationCard, PriceRow, PriceChannel,
        │                           PharmacyBadge, EmptyState, SkeletonCard
        ├── lib/
        │   ├── search.ts        ← orquestador principal: llama a los 4 clients
        │   ├── clients/
        │   │   ├── cruzverde.ts ← Cruz Verde Demandware API
        │   │   ├── salcobrand.ts← Salcobrand Algolia
        │   │   ├── ahumada.ts   ← Ahumada HTML scraping
        │   │   └── drsimi.ts    ← Dr. Simi VTEX Catalog API
        │   ├── normalization.ts ← cleanQuery(), matchKey(), mergeDuplicates(), effectivePrice()
        │   ├── cache.ts         ← AsyncStorage LRU, TTL 30 min, prefijo search_cache_v4_
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
  → check AsyncStorage cache (TTL 30 min, prefijo search_cache_v4_)
      [HIT]  → mostrar resultados cacheados
      [MISS] → searchMedications("paracetamol")
               → Promise.allSettled([cruzverde, salcobrand, ahumada, drsimi])
               → toMedicationResult() por cada resultado
               → mergeDuplicates() por matchKey
               → sort por bestPrice ASC
             → guardar en AsyncStorage
             → mostrar en pantalla Results
```

## Comandos de Desarrollo

```bash
pnpm install           # instalar todas las dependencias (raíz)
pnpm dev               # iniciar Expo (equivale a expo start)
pnpm android           # iniciar en Android
pnpm ios               # iniciar en iOS
pnpm typecheck         # type check completo
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
- **versionCode actual**: 5 (auto-increment en producción)

## Advertencia: Fragilidad del Scraper de Ahumada

`mobile/src/lib/clients/ahumada.ts` extrae precios con regex sobre HTML del storefront de Demandware. Si Ahumada actualiza su layout, el scraper puede fallar silenciosamente (devuelve array vacío).

Señal de alerta: búsquedas de medicamentos comunes no retornan resultados de Ahumada.

Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`, `linkM`, `badgeM` y publicar OTA update (`eas update`).

## Cache Versioning

Al agregar campos a `MedicationResult` o `PharmacyPrice`, incrementar el prefijo en `mobile/src/lib/cache.ts`:
```typescript
const CACHE_PREFIX = "search_cache_v4_"; // incrementar al cambiar la estructura
```
