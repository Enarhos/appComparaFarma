# Deployment — Guía Actual

Instrucciones para operar el backend `api/` en Vercel, el sitio `web/` en Vercel (proyecto separado), la app móvil en Expo/EAS, la base de datos en Supabase y la automatización en GitHub Actions.

---

## Requisitos Previos

### Cuentas necesarias
- [Expo](https://expo.dev) para EAS Build y EAS Submit
- [Apple Developer Program](https://developer.apple.com) para App Store
- [Google Play Console](https://play.google.com/console) para Google Play

### Herramientas locales
```bash
npm install -g eas-cli
```

---

## Configuración de la App

### Identificadores actuales
- **iOS bundle identifier**: `mla.app.comparafarma`
- **Android package**: `mla.app.comparafarma`
- **Expo owner**: `belford`
- **Expo projectId**: `4de81d7d-c9ab-470c-be3c-04eb43047e59`

Todos estos valores viven en `mobile/app.json`.

### Variables de entorno

Backend `api/`:

```bash
API_SECRET_KEY=
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
SEARCH_CACHE_TTL_MS=300000
ALLOWED_ORIGINS=               # Opcional, coma-separado. Default: app-compara-farma-web.vercel.app + localhost:3000.
                                # Requests sin header Origin (app móvil, server-to-server, curl) no se restringen.
SUPABASE_URL=                 # base de datos (price_history, pharmacy_clicks, app_config, feedback)
SUPABASE_SECRET_KEY=          # bypassea RLS — nunca exponer al cliente
RESEND_API_KEY=               # envío de emails de feedback (opcional)
FEEDBACK_EMAIL=

# Fallback si Supabase no responde — el mecanismo normal es /admin/config (ver pharmacy-flags.md)
DISABLED_PHARMACIES=          # Opcional: "ahumada,dr-simi" para desactivar farmacias
DONATION_BANNER_ENABLED=      # Opcional: "false" para apagar el banner de donación
DONATION_BANNER_DISMISS_DAYS= # Opcional: días que dura "No mostrar por ahora" (default 7)
```

Web `web/`:

```bash
API_URL=https://comparafarma-api.vercel.app
SITE_URL=https://app-compara-farma-web.vercel.app   # usado en sitemap.xml, robots.txt y metadata OG

# Panel /admin — mismo proyecto Supabase que api/
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # segura de exponer, solo habilita login (no bypassea RLS)
SUPABASE_URL=
SUPABASE_SECRET_KEY=
ADMIN_ALLOWED_EMAILS=            # lista blanca, coma-separada — obligatorio con Google OAuth habilitado
```

Mobile `mobile/`:

```bash
EXPO_PUBLIC_API_URL=https://comparafarma-api.vercel.app
EXPO_PUBLIC_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=...
```

---

## Desarrollo Local

Desde la raíz del monorepo:

```bash
pnpm install
pnpm dev
pnpm dev:api
```

Para pruebas en dispositivo, usar development build (no Expo Go) porque el proyecto usa `expo-dev-client`.

```bash
pnpm android        # emulador Android
pnpm ios            # simulador iOS
pnpm typecheck      # type check completo
pnpm lint
```

---

## Build Android para Google Play

### Opción A — Build local con Gradle (sin cuota EAS)

Este es el método preferido cuando el plan free de EAS está agotado.

```powershell
# Desde la raíz del monorepo:
pnpm build:android
```

El script `scripts-temp/build-android-release.ps1`:
1. Lee `version` y `versionCode` de `mobile/app.json`
2. Parchea `android/app/build.gradle` automáticamente
3. Configura `JAVA_HOME`, `ANDROID_HOME`, `EXPO_NO_METRO_WORKSPACE_ROOT=1`
4. Corre `gradlew bundleRelease`

**Salida**: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

> ⚠️ `EXPO_NO_METRO_WORKSPACE_ROOT=1` es obligatorio para el monorepo pnpm.
> Sin él, Metro intenta resolver el entry file desde el root del monorepo y falla.

**Requisitos del sistema**:
- Android Studio instalado en `C:\Program Files\Android\Android Studio\`
- `ANDROID_HOME` configurado (o SDK en `%LOCALAPPDATA%\Android\Sdk`)

### Opción B — Build remoto con EAS

```bash
cd mobile
eas build --platform android --profile production --non-interactive
```

> El plan free tiene límite mensual de builds Android. Se resetea el 1º de cada mes.
> Ver cuota en: https://expo.dev/accounts/belford/settings/billing

### Subir a Google Play

1. Abrir [Google Play Console](https://play.google.com/console) → ComparaFarma
2. **Producción** → **Crear nueva versión**
3. Subir el `.aab`
4. Completar novedades de versión y publicar

### Versionado

Antes de cada build:
1. Incrementar `versionCode` (entero, siempre mayor al anterior) en `mobile/app.json`
2. Actualizar `version` (semver) si corresponde
3. El script `pnpm build:android` parchea `build.gradle` automáticamente

Historial:

| versionCode | version | Novedades principales |
|-------------|---------|----------------------|
| 8 | 1.0.0 | Lanzamiento inicial Play Store |
| 10 | 1.1.0 | Lista de compras, feature flags farmacias, onboarding v2, matchKey mejorado |

> El plan EAS `autoIncrement: true` puede auto-bumpar el versionCode en `app.json`.
> Después de un build EAS, confirmar qué valor quedó antes del siguiente build local.

---

## OTA Updates (sin nuevo build)

Para cambios solo de JavaScript/TypeScript — sin modificaciones nativas:

```bash
cd mobile
eas update --branch production --message "fix: descripción del cambio"
```

Usar OTA para:
- Fixes en lógica de UI, stores, hooks
- Cambios en normalización (`matchKey`, etc.)
- Fixes en scrapers del backend (el backend se deploya vía Vercel, no OTA)

**No usar OTA** si cambiaste:
- Dependencias nativas o plugins de Expo
- `mobile/app.json` (versión, permisos, etc.)
- Archivos en `mobile/android/` o `mobile/ios/`

---

## Deploy del Backend en Vercel

### Deploy automático
El workflow `.github/workflows/ci.yml` deploya `api/` automáticamente en cada push a `main`.

### Verificación rápida
```bash
curl "https://comparafarma-api.vercel.app/api/health"
curl "https://comparafarma-api.vercel.app/api/config"
curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1"

# Histórico de precios (Sprint Web 1) — usar un matchKey real de una respuesta
# de /api/search (campo "matchKey" de cualquier resultado).
curl "https://comparafarma-api.vercel.app/api/price-history?matchKey=paracetamol%7C500mg&days=90"
```

### Histórico de precios — `GET /api/price-history`

Endpoint aditivo (no reemplaza ni cambia `/api/search`). Lee de `price_history`, la misma tabla que ya llena `recordPriceHistory()` en cada búsqueda — sin tabla nueva.

- **Parámetros**: `matchKey` (obligatorio, 2–180 caracteres) y `days` (opcional, default 90, clamp a [7, 365]).
- **Respuesta 200** siempre, incluso sin historial: `series: []` y `summary` con métricas `null` en vez de un error o 404.
- **Degradación segura**: si Supabase no está configurado o la consulta falla, responde igual con historial vacío — nunca rompe la carga de la ficha (`api/src/lib/priceHistoryQuery.ts`).
- Middleware compartido con el resto de la API: `x-api-key` si `API_SECRET_KEY` está seteada, rate limit por IP, `x-request-id`.
- Consumido server-side desde `web/` en `web/src/lib/priceHistory.ts` (misma variable `API_URL`, sin exponer `SUPABASE_SECRET_KEY` al cliente).

### Feature flags de farmacias
Ver [`docs/operations/runbooks/PHARMACY_FLAGS.md`](PHARMACY_FLAGS.md) para activar/desactivar farmacias sin nuevo build — el camino normal hoy es `/admin/config`, no una env var.

---

## Deploy del Sitio Web (`web/`) en Vercel

`web/` es un **proyecto Vercel separado** del de `api/` (distinto Project ID, sin relación con `.github/workflows/ci.yml`). A diferencia de `api/`, que se deploya vía CI con `vercel deploy` en un job dedicado, `web/` usa la **integración nativa de Vercel con GitHub**: cualquier push a `main` dispara un build y deploy automático directo desde Vercel, sin pasar por GitHub Actions.

- **URL de producción**: `https://app-compara-farma-web.vercel.app` (sin dominio propio todavía)
- **Root Directory** del proyecto en Vercel: `web`
- **Panel admin**: `/admin` (protegido por Supabase Auth — ver `docs/technology/database/schema.sql` y variables de entorno arriba)

### Importante sobre variables de entorno en Vercel
Cualquier variable nueva o cambiada — **incluidas las que no llevan prefijo `NEXT_PUBLIC_`** — requiere un **Redeploy manual** para tomar efecto (Vercel fija las env vars por deployment, no las lee en caliente). Después de agregar o cambiar una: Deployments → deployment más reciente → `...` → Redeploy.

### Verificación rápida
```bash
curl "https://app-compara-farma-web.vercel.app/sitemap.xml"
curl "https://app-compara-farma-web.vercel.app/robots.txt"
```

---

## Base de Datos (Supabase)

Primera y única base de datos persistente del proyecto (antes todo era stateless: caché de 5 min + AsyncStorage local). Esquema versionado en [`docs/technology/database/schema.sql`](../../technology/database/schema.sql) — correrlo en el SQL Editor de Supabase es el único paso manual (no hay migraciones automatizadas ni Supabase CLI configurado).

Tablas: `price_history` (historial de precios), `pharmacy_clicks` (tracking de clicks vía `/api/go`), `app_config` (config genérica clave/valor — farmacias activas, banner de donación), `feedback` (sugerencias de usuarios). Las cuatro tienen RLS habilitado como defensa en profundidad; el acceso real es siempre vía `SUPABASE_SECRET_KEY` desde `api/`/`web/`, que bypassea RLS por diseño.

---

## Monitoreo

Workflow `.github/workflows/monitor-api.yml` — corre cada 6 horas:
- Consulta `/api/health` y `/api/search?debug=1`
- Si falla: crea un issue en GitHub con el reporte

```bash
pnpm --filter api healthcheck:prod   # verificación manual
```

---

## Proceso de Release Completo

```
1. Cerrar PRs pendientes y mergear a main
2. Incrementar versionCode y version en mobile/app.json
3. pnpm typecheck                           (verificar tipos)
4. pnpm build:android                       (genera AAB local)
   — o: eas build --platform android ...   (si hay cuota EAS)
5. Subir AAB a Google Play Console
6. Para fixes JS posteriores: eas update --branch production
```

---

## Troubleshooting

### "El código de versión X ya se ha usado" en Play Console
El `build.gradle` tiene versionCode hardcodeado de un prebuild anterior.
El script `pnpm build:android` lo parchea automáticamente desde `app.json`.
Si se construyó con Gradle directamente: verificar/actualizar `android/app/build.gradle`.

### Gradle: "Unable to resolve module ./../node_modules/expo-router/entry.js"
Falta `EXPO_NO_METRO_WORKSPACE_ROOT=1`. El script lo incluye automáticamente.
Causa: pnpm workspaces pone `node_modules` en la raíz, no en `mobile/`.

### EAS build agota cuota mensual
Usar `pnpm build:android` (build local). La cuota free se resetea el 1º de cada mes.

### Ahumada deja de devolver resultados
El scraper depende del HTML del storefront Demandware — puede romperse si cambian el layout.
1. Revisar HTML en `https://www.farmaciasahumada.cl/...Search-Show?q=paracetamol&start=0&sz=24`
2. Actualizar regex en `api/src/clients/ahumada.ts`
3. Desactivar temporalmente desde `/admin/config` (instantáneo) — o `DISABLED_PHARMACIES=ahumada` en Vercel si Supabase está caído
4. Publicar fix con push a main (Vercel autodeploy)

### Build de EAS falla
- Revisar `mobile/eas.json` y logs en Expo dashboard
- Confirmar cambios nativos correctamente configurados

### App Store / Play pide aclaraciones
- Categoría: "Health & Fitness"
- Aclarar que solo compara precios, no entrega diagnóstico ni consejo médico
- Política de privacidad: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`
