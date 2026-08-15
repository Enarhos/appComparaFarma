# Feature Flags de Farmacias

Permite activar o desactivar farmacias de forma centralizada **sin publicar un nuevo build ni OTA update**.

---

## Cómo apagar una farmacia (camino normal)

Desde el panel admin, cambio instantáneo, sin esperar redeploy:

1. Entrar a **`https://app-compara-farma-web.vercel.app/admin/config`** (requiere login con Google o email/contraseña autorizado — ver `ADMIN_ALLOWED_EMAILS`)
2. Destildar el checkbox de la farmacia
3. Click **Guardar cambios** → confirma con un mensaje "Cambios guardados"

El valor queda en la tabla `app_config` de Supabase (clave `disabled_pharmacies`), leída por el backend con hasta 60s de caché en memoria (ver `api/src/lib/appConfigDb.ts`).

## Fallback: variable de entorno en Vercel

Si Supabase no responde (caído, credenciales rotas, etc.), `api/src/lib/pharmacyFlags.ts` cae automáticamente a la variable de entorno `DISABLED_PHARMACIES` — este es el mecanismo **de respaldo**, no el que se usa día a día:

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
- `araucomed`
- `ecofarmacias`
- `farmex`
- `sermecoop`
- `easyfarma`

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
- Si `app_config` en Supabase no responde → el backend cae a `DISABLED_PHARMACIES` (ver arriba). Nunca se rompe.
- Si hay resultados cacheados (30 min) que incluyen una farmacia desactivada → la app los oculta gracias a `isActive()` del `configStore`.

**Importante — mobile no refetchea en runtime:** `mobile/_layout.tsx` solo llama `configStore.fetch()` una vez al montar la app. Un cambio en `/admin/config` no se ve en un dispositivo que ya tiene la app abierta hasta que la cierra por completo y la vuelve a abrir (bloqueado por el freeze de Prueba Cerrada de Google Play, ver `docs/product/BACKLOG_PRODUCT.md` ítem `v15-16`).

---

## Arquitectura

```
/admin/config (web/, Supabase Auth)          Vercel env var (fallback)
  app_config.disabled_pharmacies = [...]        DISABLED_PHARMACIES=ahumada
        ↓  (instantáneo, caché 60s)                    ↓  (~30s redeploy)
        └───────────────────┬────────────────────────┘
                             ↓
                  api/src/lib/pharmacyFlags.ts
                  getDisabledPharmacies() — intenta Supabase primero

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
| `api/src/lib/pharmacyFlags.ts` | Lee `app_config` (Supabase) con fallback a `DISABLED_PHARMACIES`, exporta `getDisabledPharmacies()` y `getPharmacyConfig()` (ambas async) |
| `api/src/lib/appConfigDb.ts` | Cliente genérico clave/valor contra la tabla `app_config`, con caché en memoria de 60s |
| `api/src/lib/supabaseClient.ts` | Cliente Supabase compartido (secret key, bypassea RLS) |
| `api/src/services/searchService.ts` | Filtra fuentes desactivadas antes del `Promise.all` |
| `api/src/routes/config.ts` | Handler de `GET /api/config` |
| `api/api/config.ts` | Entrypoint serverless Vercel |
| `web/src/app/admin/(dashboard)/config/page.tsx` | UI del panel — checkboxes por farmacia, Server Action que escribe en `app_config` |
| `web/src/lib/appConfig.ts` | Lectura/escritura de `app_config` desde `web/` (cliente Supabase separado del de `api/`) |
| `mobile/src/store/configStore.ts` | Zustand store, fetchea config al arrancar, expone `isActive()` |
| `mobile/src/app/_layout.tsx` | Llama `configStore.fetch()` una vez al montar (ver limitación arriba) |
| `mobile/src/app/results.tsx` | Chips de farmacia filtrados |
| `mobile/src/app/medication.tsx` | Bloques de precio filtrados |
| `mobile/src/components/MedicationListItem.tsx` | Badge "N farmacias" filtrado |

---

## Caso de uso principal: Scraper de Ahumada roto

El scraper de Ahumada es frágil (depende de HTML de Demandware). Si empieza a fallar:

1. Entrar a `/admin/config` → destildar Ahumada → Guardar (cambio instantáneo, sin esperar redeploy)
2. Mientras tanto, arreglar el scraper en `api/src/clients/ahumada.ts`
3. Una vez reparado, volver a tildar Ahumada en `/admin/config` → Guardar
