# Feature Flags de Farmacias

Permite activar o desactivar farmacias de forma centralizada **sin publicar un nuevo build ni OTA update**. El cambio tarda ~30 segundos en propagarse.

---

## Cómo apagar una farmacia

1. Ir a **Vercel Dashboard → proyecto `comparafarma-api` → Settings → Environment Variables**
2. Editar (o crear) la variable `DISABLED_PHARMACIES`
3. Guardar → Vercel redespliega automáticamente (~30s)

### Valores de ejemplo

| Valor | Efecto |
|-------|--------|
| *(vacío o no existe)* | Todas las farmacias activas |
| `ahumada` | Solo Ahumada desactivada |
| `ahumada,dr-simi` | Ahumada y Dr. Simi desactivadas |
| `cruz-verde,salcobrand,ahumada,dr-simi` | Todas desactivadas |

### Slugs válidos
- `cruz-verde`
- `salcobrand`
- `ahumada`
- `dr-simi`

---

## Qué pasa cuando una farmacia está desactivada

### En el backend (`api/`)
- `searchService.ts` **no llama** a esa farmacia → respuesta más rápida
- Sus resultados no aparecen en `/api/search`
- `GET /api/config` devuelve `active: false` para ese slug

### En la app (`mobile/`)
- Al arrancar, `_layout.tsx` llama a `/api/config` y guarda el estado en `configStore`
- **Pantalla de resultados**: el chip de filtro de esa farmacia no aparece
- **Detalle del medicamento**: no se muestra el bloque de precios de esa farmacia
- **Lista de compras**: no cuenta esa farmacia en la tabla comparativa
- **Badge "N farmacias"** en la lista de resultados: no cuenta la farmacia desactivada

### Degradación elegante
- Si `/api/config` falla (sin red, backend caído) → la app asume **todas activas**. Nunca se rompe.
- Si hay resultados cacheados (30 min) que incluyen una farmacia desactivada → la app los oculta gracias a `isActive()` del `configStore`.

---

## Arquitectura

```
Vercel Dashboard
  DISABLED_PHARMACIES=ahumada
        ↓  (~30s redeploy)

GET /api/config
  → { pharmacies: [
      { slug: "cruz-verde", active: true },
      { slug: "salcobrand", active: true },
      { slug: "ahumada",    active: false },  ← desactivada
      { slug: "dr-simi",   active: true  },
    ]}

App arranca → configStore.fetch()
  → isActive("ahumada") = false
  → results.tsx: chip Ahumada oculto
  → medication.tsx: bloque Ahumada oculto
  → MedicationListItem: badge no cuenta Ahumada
```

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `api/src/lib/pharmacyFlags.ts` | Lee `DISABLED_PHARMACIES`, exporta `getDisabledPharmacies()` y `getPharmacyConfig()` |
| `api/src/services/searchService.ts` | Filtra fuentes desactivadas antes del `Promise.all` |
| `api/src/routes/config.ts` | Handler de `GET /api/config` |
| `api/api/config.ts` | Entrypoint serverless Vercel |
| `mobile/src/store/configStore.ts` | Zustand store, fetchea config al arrancar, expone `isActive()` |
| `mobile/src/app/_layout.tsx` | Llama `configStore.fetch()` una vez al montar |
| `mobile/src/app/results.tsx` | Chips de farmacia filtrados |
| `mobile/src/app/medication.tsx` | Bloques de precio filtrados |
| `mobile/src/components/MedicationListItem.tsx` | Badge "N farmacias" filtrado |

---

## Caso de uso principal: Scraper de Ahumada roto

El scraper de Ahumada es frágil (depende de HTML de Demandware). Si empieza a fallar:

1. Ir a Vercel → `DISABLED_PHARMACIES=ahumada` → guardar
2. En ~30s los usuarios dejan de ver Ahumada
3. Mientras tanto, arreglar el scraper en `api/src/clients/ahumada.ts`
4. Una vez reparado, volver `DISABLED_PHARMACIES=` (vacío) → guardar
