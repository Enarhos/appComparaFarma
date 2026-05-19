# ComparaFarma — Contexto del Proyecto

App móvil (React Native + Expo) que compara en tiempo real los precios de medicamentos en las tres principales cadenas de farmacias de Chile: **Cruz Verde**, **Farmacias Ahumada** y **Salcobrand**. Distingue claramente tres canales de precio: presencial (tienda física), online/web, y precio con tarjeta de fidelización (CMR Falabella en Ahumada, Tarjeta Más en Salcobrand).

## Arquitectura

La app llama **directamente** a las APIs de cada farmacia desde el dispositivo móvil — sin backend ni servidor intermedio. React Native no tiene restricciones CORS (no es un browser), por lo que el HTML scraping de Ahumada y las llamadas REST a Cruz Verde y Salcobrand funcionan directamente en el cliente.

```
App móvil (Expo)
      ↓
 Promise.allSettled([
   searchCruzVerde(),    ← REST JSON (Demandware)
   searchSalcobrand(),   ← Algolia Search API
   searchAhumada()       ← HTML scraping (fetch + regex)
 ])
      ↓
 mergeDuplicates() → MedicationResult[]
```

El punto de entrada es `mobile/src/lib/search.ts → searchMedications()`.

## Estructura del Repositorio (Monorepo pnpm)

```
compara-farma/
├── CLAUDE.md
├── package.json                 ← pnpm workspaces: packages/*, mobile
├── pnpm-workspace.yaml
├── docs/
│   ├── pharmacy-apis.md         ← endpoints, auth, response schemas por farmacia
│   ├── price-channels.md        ← semántica de presencial/online/CMR
│   ├── normalization.md         ← cleanQuery(), matchKey(), mergeDuplicates()
│   └── deployment.md            ← EAS Build, EAS Submit
├── packages/
│   └── shared/                  ← tipos TypeScript y lógica de normalización
│       └── src/
│           ├── types.ts         ← MedicationResult, PharmacyPrice, PriceChannels
│           ├── normalization.ts ← cleanQuery(), matchKey(), mergeDuplicates(), toMedicationResult()
│           └── index.ts
└── mobile/                      ← Expo app (React Native + Expo Router v3)
    └── src/
        ├── app/                 ← rutas: index.tsx (Home), results.tsx
        ├── components/          ← SearchBar, MedicationCard, PriceRow, PriceChannel,
        │                           PharmacyBadge, EmptyState
        ├── lib/
        │   ├── search.ts        ← orquestador principal: llama a los 3 clients
        │   ├── clients/
        │   │   ├── cruzverde.ts ← Cruz Verde DW API
        │   │   ├── salcobrand.ts← Salcobrand Algolia
        │   │   └── ahumada.ts  ← Ahumada HTML scraping
        │   ├── cache.ts         ← AsyncStorage LRU, TTL 30 min
        │   └── formatters.ts    ← formatCLP(), scrapedAgo()
        ├── store/               ← Zustand: searchStore, historyStore
        ├── hooks/               ← useSearch.ts
        └── constants/           ← pharmacies.ts, theme colors
```

## APIs de Farmacias

| Farmacia | Tipo | Endpoint |
|---|---|---|
| Cruz Verde | REST JSON (Demandware) | `https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search` |
| Salcobrand | Algolia Search API | `https://GM3RP06HJG-dsn.algolia.net/1/indexes/sb_variant_production/query` |
| Ahumada | HTML scraping (Demandware storefront) | `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show` |

Ver `docs/pharmacy-apis.md` para response schemas y quirks completos.

## Canales de Precio por Farmacia

| Canal | Cruz Verde | Salcobrand | Ahumada |
|---|---|---|---|
| `store` (presencial) | ✅ | ✅ `normal_price` | ✅ badge HTML |
| `online` (web) | ❌ | ✅ `direct_discount` | ❌ |
| `cmr` (tarjeta fidelización) | ❌ | ✅ `cmr_price` → "T. Más" | ✅ `content=` → "CMR" |

`effective = min(store, online ?? store, cmr ?? store)`

## Contrato de Tipos (packages/shared)

```typescript
interface PriceChannels {
  store: number;
  online: number | null;
  cmr: number | null;
  effective: number;
}

interface PharmacyPrice {
  pharmacySlug: "cruz-verde" | "salcobrand" | "ahumada";
  pharmacyName: string;
  channels: PriceChannels;
  hasStock: boolean;
  onlineUrl: string | null;
  fetchedAt: string;
}

interface MedicationResult {
  matchKey: string;           // ej: "paracetamol|500mg"
  canonicalName: string;
  laboratory: string | null;
  isBioequivalent: boolean;
  prices: PharmacyPrice[];    // sorted by channels.effective ASC
  bestPrice: number;
  bestPharmacy: string;
}
```

## Flujo de una Búsqueda

```
Usuario escribe "paracetamol 500"
  → cleanQuery() → "paracetamol"
  → check AsyncStorage cache (TTL 30 min)
      [HIT]  → mostrar resultados cacheados
      [MISS] → searchMedications("paracetamol")
               → Promise.allSettled([cruzverde, salcobrand, ahumada])
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
pnpm typecheck         # type check completo (shared + mobile)
```

## Publicación

```bash
# Build para testing
eas build --platform all --profile preview

# Build de producción
eas build --platform all --profile production

# Submit a tiendas
eas submit --platform all --latest

# Fix urgente sin nuevo build (cambios JS únicamente)
eas update --branch production --message "fix: ..."
```

Ver `docs/deployment.md` para instrucciones completas.

## Advertencia: Fragilidad del Scraper de Ahumada

`mobile/src/lib/clients/ahumada.ts` extrae precios con regex sobre HTML del storefront de Demandware. Si Ahumada actualiza su layout, el scraper puede fallar silenciosamente (devuelve array vacío).

Señal de alerta: búsquedas de medicamentos comunes no retornan resultados de Ahumada.

Acción: revisar el HTML actual del sitio, actualizar los regex `tileRe`, `linkM`, `badgeM` y publicar OTA update (`eas update`).

## Publicación en Tiendas

- **Bundle ID**: `cl.comparafarma.app`
- **Scheme**: `comparafarma`
- **Categoría**: Health & Fitness (no Medical)
- **Política de privacidad**: requerida — crear página estática antes del submit
