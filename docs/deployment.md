# Deployment — Guía Actual

Instrucciones para operar el backend `api/` en Vercel, la app móvil en Expo/EAS y la automatización en GitHub Actions.

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
```

Mobile `mobile/`:

```bash
EXPO_PUBLIC_API_URL=https://comparafarma-api.vercel.app
EXPO_PUBLIC_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=...
```

`EXPO_PUBLIC_API_KEY` es opcional y solo se usa si configuras `API_SECRET_KEY` en el backend.

Nota importante:
- la app móvil ya no tiene fallback local de búsqueda
- si `EXPO_PUBLIC_API_URL` falta, `mobile` falla al buscar

---

## Desarrollo Local

Desde la raíz del monorepo:

```bash
pnpm install
pnpm dev
pnpm dev:api
```

Para pruebas en dispositivo, hoy conviene asumir development build y no Expo Go, porque el proyecto usa `expo-dev-client`.

Comandos útiles:

```bash
pnpm android
pnpm ios
pnpm typecheck
pnpm lint
```

---

## Build con EAS

### Primera vez

```bash
cd mobile
eas login
eas build:configure
```

### Profiles disponibles

Los perfiles viven en `mobile/eas.json`. Usar el que corresponda:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Para builds internos o pruebas, revisar `development` y `preview` en `mobile/eas.json`.

### Submit a tiendas

```bash
eas submit --platform android --latest
eas submit --platform ios --latest
```

El primer submit requiere credenciales de cada tienda. EAS las pedirá de forma interactiva.

---

## Deploy del Backend en Vercel

### Estado actual

- proyecto productivo: `comparafarma-api`
- URL de producción: `https://comparafarma-api.vercel.app`
- Root Directory en Vercel: `api/`

### Primera vez o relink local

```bash
cd api
vercel link
vercel deploy
vercel deploy --prod
```

### Deploy automático desde GitHub Actions

El workflow `.github/workflows/ci.yml` ya incluye deploy automático de `api/` en cada push a `main`.

Debes configurar este secret en GitHub:

- `VERCEL_TOKEN`

Ruta:

```txt
GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret
```

El token se obtiene desde Vercel en la cuenta que administra el proyecto.

Además, el workflow ya usa estos IDs del proyecto enlazado:

```txt
VERCEL_ORG_ID=team_QtbvbI6hTSxxSJ9qDFTv9z6S
VERCEL_PROJECT_ID=prj_zvHG2urEOjMM770FPy6B2fdhk915
```

No hace falta configurarlos como secrets mientras no cambien.

El workflow actual hace:
- `typecheck`
- `api-tests`
- `deploy-api`

`deploy-api` instala Vercel CLI y ejecuta deploy productivo de `api/`.

### Endpoints

- `GET /api/health`
- `GET /api/search?q=paracetamol`

### Verificación rápida

```bash
curl "https://comparafarma-api.vercel.app/api/health"
curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol"
curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1"
```

### Verificar que el deploy automático funciona

1. Hacer push a `main`
2. Abrir la pestaña `Actions` del repositorio
3. Verificar que el workflow `CI` ejecute:
   - `typecheck`
   - `api-tests`
   - `deploy-api`
4. Confirmar que `deploy-api` termine en verde
5. Probar:

```bash
curl "https://comparafarma-api.vercel.app/api/health"
```

Si responde `ok: true`, el alias de producción quedó actualizado.

---

## Monitoreo Operativo

Hay un workflow separado `.github/workflows/monitor-api.yml` que ejecuta un healthcheck de producción:

- manualmente con `workflow_dispatch`
- automáticamente cada 6 horas

El check:

- consulta `https://comparafarma-api.vercel.app/api/health`
- consulta `/api/search?debug=1` con queries reales
- valida que cada farmacia responda al menos una vez y que no devuelva `0` resultados en todas las queries monitoreadas

Comando local equivalente:

```bash
pnpm --filter api healthcheck:prod
```

Variables opcionales:

```bash
API_URL=https://comparafarma-api.vercel.app
HEALTHCHECK_QUERIES=paracetamol,ibuprofeno
```

Si el workflow falla, GitHub marcará la corrida en rojo y puede notificar por correo según la configuración de la cuenta.

Además:
- sube el artefacto `api-healthcheck-report`
- crea un issue automático con el JSON del fallo

---

## OTA Updates

Para cambios solo de JavaScript/TypeScript, sin modificaciones nativas:

```bash
eas update --branch production --message "fix: ..."
```

Usar OTA para cambios como:
- ajustes de UI
- fixes en scrapers
- cambios en hooks, stores o normalización

No usar OTA si cambias:
- dependencias nativas
- `mobile/app.json`
- plugins de Expo
- permisos o configuración nativa

En esos casos corresponde un nuevo build completo.

---

## Proceso de Release

1. Actualizar versión en `mobile/app.json` si corresponde.
2. Ejecutar al menos `pnpm typecheck`.
3. Generar build con `eas build`.
4. Probar en TestFlight y/o Play Internal Testing.
5. Publicar con `eas submit`.
6. Para fixes no nativos posteriores, usar `eas update`.

## Checklist para retomar mañana

1. Confirmar `main` en verde en `Actions -> CI`.
2. Confirmar `Monitor API` sin issues nuevos.
3. Verificar `mobile/.env.local` con `EXPO_PUBLIC_API_URL=https://comparafarma-api.vercel.app`.
4. Si se prueba en teléfono, usar development build actualizado.
5. Si Ahumada falla, mirar primero `api/src/clients/ahumada.ts` y luego el reporte del monitor.

---

## Troubleshooting

### Ahumada deja de devolver resultados
1. Verificar el HTML en `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show?q=paracetamol&start=0&sz=10`
2. Si cambió la estructura, actualizar `api/src/clients/ahumada.ts`
3. Publicar el fix con `eas update` si el cambio es solo JS/TS

### Build de EAS falla
- Revisar `mobile/eas.json`
- Revisar logs en Expo dashboard
- Confirmar que no haya cambios nativos sin credenciales o perfiles correctos

### App Store / Play pide aclaraciones
- Categoría sugerida: "Health & Fitness"
- Aclarar que la app compara precios y no entrega diagnóstico ni consejo médico
- Verificar que la política de privacidad publicada siga vigente
