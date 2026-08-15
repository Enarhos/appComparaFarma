# Inventario de Servicios y Plan de Migración de Cuentas
**Versión:** 1.1 · **Fecha:** 2026-06-30 (corregido 2026-08-02)  
**Propósito:** Preparar la consolidación de todos los servicios externos en una única cuenta — `mario.lillo.alfaro@gmail.com` — antes de la publicación en Google Play Producción.

> **Trazabilidad (2026-08-13):** el catálogo permanente de servicios (propósito, criticidad, dependencias) vive en `docs/operations/PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001), que referencia este documento para la propiedad de cuenta. Este documento sigue siendo la única fuente del paso a paso de migración/verificación por servicio — no re-verificado desde 2026-08-02.

> **Corrección (2026-08-02):** el destino real de esta consolidación, confirmado por el CEO, es la cuenta personal `mario.lillo.alfaro@gmail.com` — la misma que ya es dueña de Google Play Console, Khipu, y el destinatario por defecto de Resend. En varios casos el servicio **ya está** en esa cuenta y no requiere ninguna migración — solo verificación.

---

## Tabla de Contenidos

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Vercel (backend API)](#1-vercel-backend-api)
3. [Expo / EAS (mobile)](#2-expo--eas-mobile)
4. [Google Play Console](#3-google-play-console)
5. [GitHub (repo + Pages + Actions)](#4-github-repo--pages--actions)
6. [Sentry (error tracking)](#5-sentry-error-tracking)
7. [PostHog (analytics)](#6-posthog-analytics)
8. [Upstash Redis (cache backend)](#7-upstash-redis-cache-backend)
9. [Khipu (pagos / donaciones)](#8-khipu-pagos--donaciones)
10. [Resend (email feedback)](#9-resend-email-feedback)
11. [Algolia (índice Salcobrand)](#10-algolia-índice-salcobrand)
12. [MINSAL (datos públicos)](#11-minsal-datos-públicos)
13. [Inventario completo de variables de entorno](#inventario-completo-de-variables-de-entorno)
14. [Tabla resumen y orden de migración](#tabla-resumen-y-orden-de-migración)
15. [Gaps detectados en .env.example](#gaps-detectados-en-envexample)

---

## Resumen ejecutivo

ComparaFarma usa **11 servicios externos**. Excepto MINSAL (público) y Algolia (credenciales de Salcobrand, no propias), todos deben quedar consolidados bajo `mario.lillo.alfaro@gmail.com`. Varios (Google Play, Khipu) ya están ahí — para esos, esta sección es solo verificación, no migración.

Los tres servicios de mayor riesgo operativo son:

| Servicio | Riesgo | Motivo |
|----------|--------|--------|
| Expo / EAS | 🔴 Alto (condicional) | Solo si `belford` no es ya `mario.lillo.alfaro@gmail.com` — cambiar el projectId rompe OTA en instalaciones existentes |
| Khipu | 🟢 Probablemente ninguno | El cobrador ya está a nombre de "Mario Lillo Alfaro" — solo falta verificar el email de la cuenta |
| Google Play | 🟢 Ninguno | El bundle ID `mla.app.comparafarma` ya está bajo la cuenta destino (mismas iniciales) |

**Recomendación:** completar la migración de cuentas **antes** de la release de producción. Si la app ya tiene usuarios activos en Prueba Interna, el orden importa (ver [Tabla resumen](#tabla-resumen-y-orden-de-migración)).

---

## 1. Vercel (backend API)

### Servicio
Plataforma serverless que aloja el backend de ComparaFarma. Procesa todas las consultas a farmacias y sirve caché Redis.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `.github/workflows/ci.yml` líneas 75–76 | `VERCEL_ORG_ID: team_QtbvbI6hTSxxSJ9qDFTv9z6S` y `VERCEL_PROJECT_ID: prj_zvHG2urEOjMM770FPy6B2fdhk915` hardcodeados |
| `.github/workflows/ci.yml` línea 95 | Deploy usa `secrets.VERCEL_TOKEN` |
| `api/vercel.json` | Configuración de funciones serverless (timeouts) |
| `mobile/.env.local.example` | `EXPO_PUBLIC_API_URL=https://comparafarma-api.vercel.app` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `VERCEL_TOKEN` | GitHub Secret | Token personal de Vercel para deploy automático |
| `VERCEL_ORG_ID` | ci.yml hardcoded | ID del equipo/org Vercel actual |
| `VERCEL_PROJECT_ID` | ci.yml hardcoded | ID del proyecto Vercel actual |

Además, Vercel Dashboard aloja estas variables del backend:
`API_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `FEEDBACK_EMAIL`, `RESEND_API_KEY`, `KHIPU_RECEIVER_ID`, `KHIPU_SECRET`

### Cuenta actual

Org ID `team_QtbvbI6hTSxxSJ9qDFTv9z6S` — equipo Vercel personal del desarrollador.  
Dominio generado: `comparafarma-api.vercel.app`.

### Riesgo de migración

🟡 **Medio** — Si el dominio cambia, hay que actualizar `EXPO_PUBLIC_API_URL` en todos los builds de producción de la app. Los usuarios con la app instalada seguirán usando el dominio anterior hasta actualizar.

### Pasos para migrarlo

1. Verificar si el equipo Vercel actual (`team_QtbvbI6hTSxxSJ9qDFTv9z6S`) ya está asociado al login `mario.lillo.alfaro@gmail.com`. Si es así, no hay nada que migrar en este servicio.
2. Si el equipo está bajo otro email personal: en Vercel Dashboard → proyecto → Settings → Transfer, transferir `comparafarma-api` a un equipo/cuenta bajo `mario.lillo.alfaro@gmail.com` (las secretas se eliminan al transferir; respaldarlas antes).
3. Si hubo transferencia, obtener nuevo `VERCEL_TOKEN` desde esa cuenta (Account Settings → Tokens) y los nuevos `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`.
4. Actualizar en GitHub Secrets: `VERCEL_TOKEN`.
5. Actualizar en `.github/workflows/ci.yml` las líneas 75–76: `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
6. Si el dominio cambia (dejar de usar `.vercel.app`): configurar dominio custom → actualizar `EXPO_PUBLIC_API_URL` → nuevo build Android.

### Cómo validar

```bash
# Tras el deploy en nueva cuenta:
curl https://comparafarma-api.vercel.app/api/health
# Esperado: {"ok":true,"timestamp":"..."}

curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1" \
  -H "x-api-key: $API_SECRET_KEY"
# Esperado: JSON con farmacias activas
```

### Responsable sugerido

Desarrollador principal (dueño de `mario.lillo.alfaro@gmail.com`).

---

## 2. Expo / EAS (mobile)

### Servicio
EAS (Expo Application Services) gestiona los builds cloud y los OTA updates de la app móvil. El `projectId` y `owner` en `app.json` son la identidad del proyecto en Expo.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `mobile/app.json` línea 51 | `"projectId": "4de81d7d-c9ab-470c-be3c-04eb43047e59"` |
| `mobile/app.json` línea 54 | `"owner": "belford"` |
| `mobile/app.json` líneas 58–60 | `"updates": { "url": "https://u.expo.dev/4de81d7d-c9ab-470c-be3c-04eb43047e59" }` |
| `mobile/eas.json` | Perfiles de build (development, preview, production) |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `EXPO_PUBLIC_API_URL` | `mobile/.env.local` / EAS Secrets | URL del backend |
| `EXPO_PUBLIC_API_KEY` | `mobile/.env.local` / EAS Secrets | API key (opcional) |
| `EXPO_PUBLIC_SENTRY_DSN` | `mobile/.env.local` / EAS Secrets | Sentry DSN (producción) |

### Cuenta actual

Owner: `belford` (cuenta personal de Expo del desarrollador).  
Project ID: `4de81d7d-c9ab-470c-be3c-04eb43047e59`.

### Riesgo de migración

🔴 **Alto** — Cambiar el `projectId` rompe el canal de OTA updates. Todos los usuarios con la app instalada dejarán de recibir OTA updates hasta que instalen una versión nueva con el nuevo `projectId`. Dado que aún estamos en Prueba Interna (pocos usuarios), el impacto es bajo ahora pero será crítico post-lanzamiento.

### Pasos para migrarlo

1. Verificar si la cuenta Expo `belford` ya usa `mario.lillo.alfaro@gmail.com` como email. Si es así, no hay nada que migrar.
2. Si está bajo otro email: crear o reclamar una cuenta Expo con `mario.lillo.alfaro@gmail.com` y ejecutar desde `mobile/`:
   ```bash
   eas init --id <nuevo-project-id>
   # O si se crea el proyecto desde la web:
   # actualizar manualmente mobile/app.json → extra.eas.projectId y updates.url
   ```
3. Cambiar `"owner": "belford"` → `"owner": "<nuevo-usuario-expo>"` en `mobile/app.json`.
4. Actualizar EAS Secrets en el nuevo proyecto: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`.
5. Generar nuevo build de producción (`pnpm build:android`) con los nuevos valores.
6. Publicar nuevo build en Play Console (requiere subir el AAB generado).

> **Nota sobre OTA:** Si se migra antes del lanzamiento público, basta con subir un nuevo build. Si ya hay usuarios activos, publicar un OTA update es imposible después de cambiar el `projectId` — se requiere un nuevo build obligatorio en Play Store.

### Cómo validar

```bash
# En la app instalada, navegar a Ajustes del dispositivo → Apps → ComparaFarma
# Verificar que la versión muestra 1.x.x y que las búsquedas funcionan

# En EAS Dashboard del nuevo proyecto:
eas update:list --branch production
# Debe mostrar el último update publicado
```

### Responsable sugerido

Desarrollador principal (quien tiene acceso al certificado de firma del AAB).

---

## 3. Google Play Console

### Servicio
Consola de distribución de Android. La app está actualmente en Prueba Interna con versionCode 30 (v1.4.0) bajo el bundle ID `mla.app.comparafarma`.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `mobile/app.json` línea 33 | `"package": "mla.app.comparafarma"` |
| `mobile/app.json` línea 34 | `"versionCode": 30` |
| `mobile/app.json` línea 17 | `"bundleIdentifier": "mla.app.comparafarma"` (iOS) |
| `docs/release/RELEASE_READINESS_V1.md` | Políticas de privacidad URL registrada en Play Console |

### Variables de entorno asociadas

No hay variables de entorno directas. La firma del AAB usa una keystore local (no en el repo).

### Cuenta actual

La cuenta de Google Play Developer que publicó el bundle ID `mla.app.comparafarma`. El prefijo `mla` sugiere que está asociada a una cuenta personal (initiales: Mario Lillo Alfaro).

### Riesgo de migración

🔴 **Alto** — El bundle ID `mla.app.comparafarma` es **permanente e inmutable** una vez publicado. No puede cambiarse sin crear una app nueva (perdiendo reseñas, ratings, e historial de descargas).

**No requiere migración.** La cuenta de Google Play Developer que publicó `mla.app.comparafarma` es (según el prefijo "mla" = Mario Lillo Alfaro) la misma cuenta `mario.lillo.alfaro@gmail.com` que es el destino de consolidación de todo lo demás. Este servicio ya está donde debe estar.

### Pasos

1. Confirmar en Play Console → Configuración de la cuenta que el email de contacto/facturación es `mario.lillo.alfaro@gmail.com`.
2. Si la empresa necesita facturar o administrar formalmente la app (por ejemplo para temas tributarios), se puede agregar como organización de facturación **sin transferir la propiedad de la cuenta** — la cuenta sigue siendo `mario.lillo.alfaro@gmail.com`.
3. No hay ningún escenario en el que se necesite un bundle ID nuevo por este motivo.

### Cómo validar

1. Iniciar sesión en [play.google.com/console](https://play.google.com/console) con `mario.lillo.alfaro@gmail.com`.
2. Verificar acceso a la app `mla.app.comparafarma` como Administrador.
3. Verificar que la cuenta de facturación está actualizada.

### Responsable sugerido

Mario Lillo (dueño de la cuenta).

---

## 4. GitHub (repo + Pages + Actions)

### Servicio
- **Repositorio:** código fuente y CI/CD
- **GitHub Pages:** aloja la política de privacidad
- **GitHub Actions:** CI, deploy, monitor y actualización de datos MINSAL

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `.github/workflows/ci.yml` | `VERCEL_TOKEN` via GitHub Secret |
| `.github/workflows/monitor-api.yml` | Crea issues en el repo, usa `GITHUB_TOKEN` automático |
| `.github/workflows/update-branches.yml` | Commits automáticos con `github-actions[bot]` |
| `docs/privacy-policy.html` | Publicada en `https://enarhos.github.io/appComparaFarma/privacy-policy.html` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `VERCEL_TOKEN` | GitHub Secrets | Token de deploy a Vercel |
| `GITHUB_TOKEN` | Auto (Actions) | Permisos de escritura para issues y commits |

### Cuenta actual

Repo owner: `enarhos` (cuenta personal del desarrollador en GitHub).  
GitHub Pages URL: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`  
Esta URL está registrada en Google Play Console como política de privacidad.

### Riesgo de migración

🟡 **Medio** — Si `enarhos` no es una cuenta GitHub ligada a `mario.lillo.alfaro@gmail.com`, hay que transferir el repo, y la URL de GitHub Pages cambia. Esa URL está registrada en Play Console y en `docs/privacy-policy.html` (referencia a sí misma). Play Console no bloquea si la URL anterior sigue redirigiendo, pero puede causar confusión.

### Pasos para migrarlo

1. Verificar si la cuenta GitHub `enarhos` ya tiene `mario.lillo.alfaro@gmail.com` como email asociado. Si es así, no hay nada que transferir.
2. Si no: crear o identificar una cuenta GitHub propia de `mario.lillo.alfaro@gmail.com` y transferir el repo ahí (GitHub → Settings → Transfer Ownership).
   - La URL antigua `enarhos/appComparaFarma` redirige automáticamente durante un período.
3. Habilitar GitHub Pages en el repo destino: Settings → Pages → branch `main`, carpeta `/docs`.
4. Actualizar en Play Console la URL de privacidad si el owner del repo cambió.
5. Actualizar cualquier referencia a `enarhos.github.io` en `docs/privacy-policy.html` si aplica.
6. Re-crear el GitHub Secret `VERCEL_TOKEN` en el repo destino si hubo transferencia (los secrets no se transfieren).

### Cómo validar

```bash
# Verificar el email asociado a la cuenta enarhos (requiere estar logueado como enarhos):
gh api user --jq '.email'

# Si hubo transferencia, verificar GitHub Pages en el nuevo owner:
curl -I https://<nuevo-owner>.github.io/appComparaFarma/privacy-policy.html
# Esperado: HTTP 200
```

### Responsable sugerido

Mario Lillo (dueño de `mario.lillo.alfaro@gmail.com`).

---

## 5. Sentry (error tracking)

### Servicio
Captura crashes y errores de la app móvil en tiempo real. Configurado con 20% de trace sampling.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `mobile/src/app/_layout.tsx` línea 12 | `dsn: process.env.EXPO_PUBLIC_SENTRY_DSN` |
| `mobile/src/hooks/useSearch.ts` línea 80 | `Sentry.captureException(err, { extra: { query } })` |
| `mobile/.env.local.example` línea 10 | Placeholder: `https://xxxxx@oxxxx.ingest.sentry.io/xxxxx` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `EXPO_PUBLIC_SENTRY_DSN` | `mobile/.env.local` / EAS Secrets | DSN del proyecto Sentry (solo prod) |

### Cuenta actual

Desconocida (DSN solo en variables de entorno, no en el código). Inferida: cuenta personal del desarrollador en [sentry.io](https://sentry.io).

### Riesgo de migración

🟢 **Bajo** — Solo requiere actualizar una variable de entorno. No hay código hardcodeado. Los errores históricos del proyecto anterior se pierden (Sentry no migra eventos entre orgs).

### Pasos para migrarlo

1. Verificar si la cuenta Sentry actual ya usa `mario.lillo.alfaro@gmail.com`. Si es así, no hay nada que migrar.
2. Si no: crear cuenta/organización en Sentry con `mario.lillo.alfaro@gmail.com`, crear proyecto React Native `comparafarma`.
3. Copiar el nuevo DSN: Settings → Projects → comparafarma → Client Keys.
4. Actualizar `EXPO_PUBLIC_SENTRY_DSN` en:
   - EAS Secrets del proyecto (nuevo): `eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value <nuevo-dsn>`
   - `.env.local` local de desarrollo (si aplica)
5. Generar nuevo build de producción para que tome el nuevo DSN.

### Cómo validar

```bash
# Generar error de prueba desde la app (en modo prod)
# O via Sentry SDK:
Sentry.captureMessage("test-migración-2026")

# En Sentry Dashboard de mario.lillo.alfaro@gmail.com:
# Issues → verificar que el evento aparece en el proyecto correcto
```

### Responsable sugerido

Desarrollador principal.

---

## 6. PostHog (analytics)

### Servicio
Tracking de eventos de usuario. Actualmente solo el evento `medication_search` está instrumentado.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `mobile/src/lib/analytics.ts` línea 5 | API key hardcodeada: `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g` |
| `mobile/src/lib/analytics.ts` línea 6 | Host: `https://us.i.posthog.com` |

### Variables de entorno asociadas

Ninguna actualmente — la key está hardcodeada. El comentario en el archivo dice "phc_ keys are write-only client keys — safe to commit" pero esto mezcla la seguridad técnica con la pertenencia de la cuenta.

### Cuenta actual

Cuenta PostHog asociada a quien creó el proyecto con la key `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g`. Región: US (`us.i.posthog.com`).

### Riesgo de migración

🟡 **Medio** — La key está hardcodeada en el código. Migrar requiere: (1) crear nuevo proyecto PostHog, (2) cambiar la key en `analytics.ts`, (3) nuevo build. Los datos históricos no se migran automáticamente (PostHog ofrece export CSV, no migración de org a org).

### Pasos para migrarlo

1. Verificar si la cuenta PostHog dueña de la key actual ya usa `mario.lillo.alfaro@gmail.com`. Si es así, no hay nada que migrar.
2. Si no: crear organización en [app.posthog.com](https://app.posthog.com) con `mario.lillo.alfaro@gmail.com` y proyecto `ComparaFarma`.
3. Obtener nueva project API key desde Settings → Project → API Key.
4. Actualizar `mobile/src/lib/analytics.ts` línea 5: reemplazar `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g` con la nueva key.
5. **Recomendado:** mover la key a variable de entorno para evitar este problema en el futuro:
   ```typescript
   // mobile/src/lib/analytics.ts
   export const posthog = new PostHog(
     process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "",
     { host: "https://us.i.posthog.com" }
   );
   ```
6. Agregar `EXPO_PUBLIC_POSTHOG_KEY` a EAS Secrets y a `mobile/.env.local.example`.
7. Generar nuevo build de producción.

### Cómo validar

```bash
# Lanzar la app nueva → hacer una búsqueda → esperar ~30s
# En PostHog Dashboard → Events: verificar evento medication_search
# Verificar que el proyecto destino está bajo mario.lillo.alfaro@gmail.com
```

### Responsable sugerido

Mario Lillo (dueño de `mario.lillo.alfaro@gmail.com`).

---

## 7. Upstash Redis (cache backend)

### Servicio
Base de datos Redis serverless usada como caché del backend API. TTL de 5 minutos por búsqueda. Fallback automático a caché en memoria si no está configurado.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `api/src/lib/cache.ts` líneas 16–21 | Init condicional con `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| `api/.env.example` líneas 6–7 | Placeholders comentados |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Vercel Dashboard | URL REST del database Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel Dashboard | Token de autenticación |

### Cuenta actual

Cuenta Upstash personal del desarrollador. Database actual: desconocida (credenciales en Vercel, no en el código).

### Riesgo de migración

🟢 **Bajo** — Si hace falta migrar, solo requiere crear un nuevo database y actualizar dos variables en Vercel Dashboard. El caché es efímero (TTL 5 min), no hay datos críticos que migrar.

### Pasos para migrarlo

1. Verificar si la cuenta Upstash actual ya usa `mario.lillo.alfaro@gmail.com`. Si es así, no hay nada que migrar.
2. Si no: crear cuenta en [upstash.com](https://upstash.com) con `mario.lillo.alfaro@gmail.com`.
2. Crear database: type `Redis`, region `us-east-1` (o la más cercana al despliegue Vercel), plan free.
3. Copiar las credenciales REST: Settings → REST API → `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
4. Actualizar en Vercel Dashboard → proyecto → Settings → Environment Variables:
   - `UPSTASH_REDIS_REST_URL` → nueva URL
   - `UPSTASH_REDIS_REST_TOKEN` → nuevo token
5. Hacer un redeploy del API (o esperar el próximo CI/CD push).

### Cómo validar

```bash
curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol" \
  -H "x-api-key: $API_SECRET_KEY" -I
# Segunda llamada debe retornar: x-search-cache: hit

# En Upstash Console → Data Browser:
# Verificar que aparecen keys con prefijo cfsearch:
```

### Responsable sugerido

Mario Lillo (dueño de `mario.lillo.alfaro@gmail.com`).

---

## 8. Khipu (pagos / donaciones)

### Servicio
Pasarela de pagos chilena usada para donaciones a ComparaFarma. Hay dos capas de integración:
- **Servidor (dinámica):** `POST /api/donate` genera un link de pago vía API Khipu (HMAC-SHA256).
- **Cliente (estática):** URLs hardcodeadas en `donation.ts` para los montos fijos.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `api/src/clients/khipu.ts` líneas 6–7 | `KHIPU_RECEIVER_ID` y `KHIPU_SECRET` desde env vars |
| `mobile/src/constants/donation.ts` líneas 5–9 | URLs hardcodeadas: `khipu.com/payment/process/5Jxso`, `rkHAZ`, `qzd92`, `dAwLD` |
| `api/src/routes/donate.ts` | Ruta POST `/api/donate` — llama a `createKhipuPayment()` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `KHIPU_RECEIVER_ID` | Vercel Dashboard | ID del cobrador en Khipu (actualmente: 520175, Mario Lillo Alfaro) |
| `KHIPU_SECRET` | Vercel Dashboard | Secret para firmar pagos (HMAC-SHA256) |

> **Nota de seguridad:** las credenciales Khipu estuvieron expuestas en debug logs en versiones anteriores. Deben rotarse antes de producción (ver RELEASE_READINESS_V1.md RC-3).

### Cuenta actual

Cobrador `Mario Lillo Alfaro`, ID `520175` en Khipu. Las URLs hardcodeadas en `donation.ts` son payment links de esa cuenta personal.

### Riesgo de migración

**Probablemente no requiere migración.** El cobrador ya está registrado como "Mario Lillo Alfaro" (ID 520175) — si el email de esa cuenta Khipu ya es `mario.lillo.alfaro@gmail.com`, este servicio ya está en el destino correcto y no hace falta tocar nada.

### Pasos

1. Verificar en Khipu → Mi cuenta → Datos de la cuenta que el email registrado sea `mario.lillo.alfaro@gmail.com`.
2. Si el email es distinto, actualizarlo directamente desde la configuración de la cuenta (no requiere crear un cobrador nuevo ni cambiar las URLs de `donation.ts`, porque el `RECEIVER_ID` no cambia).
3. Solo si en el futuro se necesitara un cobrador completamente nuevo (otro `RECEIVER_ID`): ahí sí habría que regenerar las URLs de `donation.ts` y republicar la app — pero no es el caso de esta consolidación.

> El nombre del cobro ("Apoyo a ComparaFarma") está hardcodeado en `api/src/clients/khipu.ts` línea 17 — no necesita cambiar, pero verificar que sea correcto para el nuevo cobrador.

### Cómo validar

```bash
# Flujo dinámico (ruta /api/donate):
curl -X POST https://comparafarma-api.vercel.app/api/donate \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_SECRET_KEY" \
  -d '{"amount": 1000}'
# Esperado: {"payment_url":"https://khipu.com/payment/..."}

# Flujo estático (app):
# Abrir la app → buscar medicamento con gran diferencia de precio
# → verificar que aparece el banner de donación → tocar "$1.000"
# → verificar que el link sigue funcionando en el browser
```

### Responsable sugerido

Mario Lillo (dueño de la cuenta Khipu).

---

## 9. Resend (email feedback)

### Servicio
Servicio de email transaccional usado para recibir el feedback del formulario en la pantalla "Acerca de". Si `RESEND_API_KEY` no está configurado, el mensaje se descarta silenciosamente (solo log en consola).

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `api/src/routes/feedback.ts` línea 5 | Email destino: `mario.lillo.alfaro@gmail.com` (hardcodeado, sobreescribible con `FEEDBACK_EMAIL`) |
| `api/src/routes/feedback.ts` línea 93 | `from: "ComparaFarma <onboarding@resend.dev>"` (dominio de prueba Resend) |
| `api/src/routes/feedback.ts` línea 86 | `https://api.resend.com/emails` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `RESEND_API_KEY` | Vercel Dashboard | API key de Resend para enviar emails |
| `FEEDBACK_EMAIL` | Vercel Dashboard | Email destinatario (default: `mario.lillo.alfaro@gmail.com`) |

> **Nota:** Estas dos variables no están en `api/.env.example` — gap de documentación (ver [Gaps detectados](#gaps-detectados-en-envexample)).

### Cuenta actual

Cuenta Resend personal del desarrollador. El `from` usa `onboarding@resend.dev` — dominio de prueba de Resend. En producción, Google puede marcar emails de `@resend.dev` como spam.

### Riesgo de migración

🟡 **Medio** — Requiere cambio de código para actualizar el `from` a un dominio propio verificado (pendiente de definir cuál), lo que implica nuevo build del backend (deploy a Vercel). El email destinatario se puede cambiar solo con env var.

### Pasos para migrarlo

1. Verificar si la cuenta Resend actual ya usa `mario.lillo.alfaro@gmail.com`. Si es así, el login no requiere cambios.
2. Definir y verificar un dominio propio en Resend (DNS TXT/MX records en el proveedor de dominio) — esto es independiente de a quién pertenece la cuenta, es solo para que el `from` deje de usar el dominio de prueba `@resend.dev`.
3. Obtener nueva API key: Resend → API Keys → Create.
4. Actualizar `api/src/routes/feedback.ts` línea 93 con el dominio verificado:
   ```typescript
   from: "ComparaFarma <noreply@dominio-verificado>",
   ```
5. Actualizar Vercel Dashboard:
   - `RESEND_API_KEY` → nueva key
   - `FEEDBACK_EMAIL` → `mario.lillo.alfaro@gmail.com`

6. Hacer push a `main` para triggear el deploy automático del API.

> **Nota:** `FEEDBACK_EMAIL` (destinatario) ya está resuelto — es `mario.lillo.alfaro@gmail.com`. El dominio del `from` (paso 2, remitente) es un tema técnico aparte: Resend exige verificar por DNS un dominio que uno controle, y `gmail.com` no es ese tipo de dominio — sigue pendiente definir cuál usar (o mantener `@resend.dev` por ahora).

### Cómo validar

```bash
# Desde la app: Acerca de → formulario de feedback → enviar mensaje
# Verificar que llega el email con el remitente del dominio verificado (no @resend.dev)

# O via curl:
curl -X POST https://comparafarma-api.vercel.app/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"message": "test migración", "email": "test@example.com"}'
# Esperado: {"ok":true}
# Verificar email recibido
```

### Responsable sugerido

Mario Lillo (dueño de la cuenta) + quien administre el dominio elegido.

---

## 10. Algolia (índice Salcobrand)

### Servicio
Algolia es usado **solo** para consultar el índice de búsqueda de Salcobrand. Las credenciales **no son propias** — son claves públicas de solo lectura de Salcobrand.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `api/src/clients/salcobrand.ts` línea 4 | `APP_ID = process.env.ALGOLIA_APP_ID ?? "GM3RP06HJG"` |
| `api/src/clients/salcobrand.ts` línea 5 | `API_KEY = process.env.ALGOLIA_API_KEY ?? "0259fe250b3be4b1326eb85e47aa7d81"` |
| `api/.env.example` líneas 8–10 | Comentario: `Salcobrand search index (GM3RP06HJG / sb_variant_production)` |

### Variables de entorno asociadas

| Variable | Dónde vive | Descripción |
|----------|-----------|-------------|
| `ALGOLIA_APP_ID` | Vercel Dashboard (opcional) | Sobreescribe el fallback `GM3RP06HJG` |
| `ALGOLIA_API_KEY` | Vercel Dashboard (opcional) | Sobreescribe el fallback hardcodeado |

### Cuenta actual

**No aplica** — son credenciales de Salcobrand. No existe una cuenta Algolia de ComparaFarma.

### Riesgo de migración

🟢 **Bajo / No aplica** — No hay cuenta que migrar. El único riesgo es que Salcobrand rote sus propias keys (histórico de estabilidad: no lo han hecho).

La única acción requerida es eliminar el fallback hardcodeado del código y moverlo a variables de entorno:

```bash
# En Vercel Dashboard agregar:
ALGOLIA_APP_ID=GM3RP06HJG
ALGOLIA_API_KEY=<valor_actual>
```

Y editar `api/src/clients/salcobrand.ts` líneas 4–5:
```typescript
const APP_ID = process.env.ALGOLIA_APP_ID;
const API_KEY = process.env.ALGOLIA_API_KEY;
if (!APP_ID || !API_KEY) throw new Error("Algolia env vars not set");
```

### Cómo validar

```bash
curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1" \
  -H "x-api-key: $API_SECRET_KEY" | jq '.diagnostics[] | select(.pharmacySlug=="salcobrand")'
# Esperado: status "ok", resultsCount > 0
```

### Responsable sugerido

Desarrollador principal.

---

## 11. MINSAL (datos públicos)

### Servicio
API del Ministerio de Salud chileno para el índice de sucursales de farmacias por comuna. MINSAL bloquea Vercel IPs, por lo que los datos se pre-descargan y se commitean al repo.

### Dónde aparece en el código

| Archivo | Referencia |
|---------|-----------|
| `.github/workflows/update-branches.yml` | Cron diario 09:00 UTC, commit automático |
| `scripts-temp/fetch-branches.js` | Script de descarga |
| `api/src/data/branches.json` | Datos commiteados (222 comunas) |

### Variables de entorno asociadas

Ninguna. Usa `GITHUB_TOKEN` automático de Actions para el commit.

### Cuenta actual

API pública de MINSAL — no requiere autenticación ni cuenta.

### Riesgo de migración

🟢 **Sin riesgo** — No hay cuenta que migrar. Solo requiere que el nuevo repo tenga habilitado el workflow `update-branches.yml` con permisos de escritura (`contents: write`).

### Pasos para migrarlo

1. Si el repo GitHub se transfiere (ver sección 4), verificar que los GitHub Actions quedan habilitados en el repo destino.
2. Verificar que el workflow `update-branches.yml` tiene `permissions: contents: write`.
3. Hacer una ejecución manual post-transferencia para confirmar que el commit automático funciona.

### Cómo validar

```bash
# En GitHub Actions del repo (mismo owner o el destino de la transferencia):
gh workflow run update-branches.yml --repo <owner>/appComparaFarma
gh run list --repo <owner>/appComparaFarma --workflow=update-branches.yml
# Verificar status: success
```

### Responsable sugerido

Desarrollador principal.

---

## Inventario completo de variables de entorno

### Backend (`api/.env.example` + vars adicionales)

| Variable | Ejemplo / Default | Obligatoria | Dónde configurar | Servicio |
|----------|------------------|-------------|-----------------|---------|
| `API_SECRET_KEY` | `s3cr3t_k3y` | No (⚠️ recomendada) | Vercel Dashboard | Auth custom |
| `RATE_LIMIT_MAX` | `60` | No | Vercel Dashboard | Rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `60000` | No | Vercel Dashboard | Rate limiting |
| `SEARCH_CACHE_TTL_MS` | `300000` | No | Vercel Dashboard | Cache TTL |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Sí (prod) | Vercel Dashboard | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | `AX...` | Sí (prod) | Vercel Dashboard | Upstash Redis |
| `ALGOLIA_APP_ID` | `GM3RP06HJG` | No (⚠️ recomendado) | Vercel Dashboard | Algolia/Salcobrand |
| `ALGOLIA_API_KEY` | `0259...` | No (⚠️ recomendado) | Vercel Dashboard | Algolia/Salcobrand |
| `FEEDBACK_EMAIL` | `mario.lillo.alfaro@gmail.com` | No | Vercel Dashboard | Resend |
| `RESEND_API_KEY` | `re_...` | No (⚠️ recomendado) | Vercel Dashboard | Resend |
| `KHIPU_RECEIVER_ID` | `520175` | Sí (ruta /donate) | Vercel Dashboard | Khipu |
| `KHIPU_SECRET` | `[REDACTED]` | Sí (ruta /donate) | Vercel Dashboard | Khipu |

### Mobile (`mobile/.env.local.example` + EAS Secrets)

| Variable | Ejemplo | Obligatoria | Dónde configurar | Servicio |
|----------|---------|-------------|-----------------|---------|
| `EXPO_PUBLIC_API_URL` | `https://comparafarma-api.vercel.app` | Sí | `.env.local` + EAS Secrets | Vercel API |
| `EXPO_PUBLIC_API_KEY` | `` (vacía) | No | `.env.local` + EAS Secrets | Auth custom |
| `EXPO_PUBLIC_SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` | Sí (prod) | `.env.local` + EAS Secrets | Sentry |

### GitHub Secrets

| Secret | Descripción | Servicio |
|--------|-------------|---------|
| `VERCEL_TOKEN` | Token de deploy | Vercel |

### Hardcodeados en código (requieren cambio de código para migrar)

| Valor | Archivo | Línea | Descripción | Estado |
|-------|---------|-------|-------------|--------|
| `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g` | `analytics.ts` | 5 | PostHog project key | ⚠️ Mover a env var |
| `https://u.expo.dev/4de81d7d-...` | `app.json` | 59 | Expo updates URL | 🔴 Cambia al migrar EAS |
| `"owner": "belford"` | `app.json` | 54 | Expo owner | 🔴 Cambia al migrar EAS |
| `https://khipu.com/payment/process/5Jxso` | `donation.ts` | 5 | Khipu link $1.000 | 🔴 Cambia al migrar Khipu |
| `https://khipu.com/payment/process/rkHAZ` | `donation.ts` | 6 | Khipu link $3.000 | 🔴 Cambia al migrar Khipu |
| `https://khipu.com/payment/process/qzd92` | `donation.ts` | 7 | Khipu link $5.000 | 🔴 Cambia al migrar Khipu |
| `https://khipu.com/payment/process/dAwLD` | `donation.ts` | 9 | Khipu link libre | 🔴 Cambia al migrar Khipu |
| `mario.lillo.alfaro@gmail.com` | `feedback.ts` | 5 | Email feedback (default) | ⚠️ Mover a FEEDBACK_EMAIL |
| `onboarding@resend.dev` | `feedback.ts` | 93 | Email from (dominio test) | ⚠️ Cambiar a un dominio propio verificado (pendiente de definir) |
| `GM3RP06HJG` | `salcobrand.ts` | 4 | Algolia App ID (fallback) | ⚠️ Mover a env var |
| `0259fe250b3be4b1326eb85e47aa7d81` | `salcobrand.ts` | 5 | Algolia API Key (fallback) | ⚠️ Mover a env var |
| `team_QtbvbI6hTSxxSJ9qDFTv9z6S` | `ci.yml` | 75 | Vercel Org ID | 🔴 Cambia al migrar Vercel |
| `prj_zvHG2urEOjMM770FPy6B2fdhk915` | `ci.yml` | 76 | Vercel Project ID | 🔴 Cambia al migrar Vercel |

---

## Tabla resumen y orden de migración

| # | Servicio | Tipo | ¿Ya está en `mario.lillo.alfaro@gmail.com`? | ¿Requiere nuevo build? | ¿Requiere cambio de código? | Orden sugerido |
|---|----------|------|----------------------------------------------|----------------------------|-----------------------------|---------------|
| 1 | Google Play | Distribución | 🟢 Probablemente sí (mismas iniciales "mla") | No | No | Solo verificar |
| 2 | Khipu | Pagos | 🟢 Probablemente sí (cobrador "Mario Lillo Alfaro") | No | No | Solo verificar |
| 3 | GitHub | Repo/CI | ❓ Verificar email de `enarhos` | No | Sí, si no coincide (privacy policy URL) | Primero (si aplica) |
| 4 | Vercel | Backend | ❓ Verificar email del equipo actual | No (redeploy) | Sí, si no coincide (ci.yml Org/Project ID) | Segundo (si aplica) |
| 5 | Upstash Redis | Cache | ❓ Verificar | No | No | Tercero (si aplica) |
| 6 | Sentry | Monitoring | ❓ Verificar | Sí | No (solo env var) | Cuarto (si aplica) |
| 7 | PostHog | Analytics | ❓ Verificar | Sí | Sí (key hardcodeada) | Quinto (si aplica) |
| 8 | Resend | Email | ❓ Verificar (login) — el dominio propio para el `from` es un tema aparte, no de cuenta | No (redeploy API) | Sí (from: hardcodeado) | Sexto (si aplica) |
| 9 | Expo / EAS | Mobile | ❓ Verificar email de `belford` | Sí, si no coincide | Sí, si no coincide (app.json) | Último (solo si no coincide — rompe OTA) |
| 10 | Algolia | Índice 3rd party | No aplica (credenciales de Salcobrand) | No | Sí (remover fallback) | Backlog |
| 11 | MINSAL | Datos públicos | No aplica (API pública) | No | No | — |

> **Nota:** para la mayoría de estos servicios no sabemos con certeza si el login ya es `mario.lillo.alfaro@gmail.com` — antes de ejecutar cualquier paso de "migración", el primer paso real es simplemente entrar a cada servicio y verificarlo. Varios probablemente no requieren ninguna acción.

---

## Gaps detectados en .env.example

Se detectaron variables requeridas en producción que **no están documentadas** en `api/.env.example`:

| Variable faltante | Usado en | Impacto si falta |
|------------------|----------|-----------------|
| `RESEND_API_KEY` | `api/src/routes/feedback.ts` | El feedback no se envía por email (silencioso) |
| `FEEDBACK_EMAIL` | `api/src/routes/feedback.ts` | Usa `mario.lillo.alfaro@gmail.com` por defecto |
| `KHIPU_RECEIVER_ID` | `api/src/clients/khipu.ts` | La ruta `/api/donate` lanza error 500 |
| `KHIPU_SECRET` | `api/src/clients/khipu.ts` | La ruta `/api/donate` lanza error 500 |

**Acción recomendada:** actualizar `api/.env.example` con estas cuatro variables antes de onboarding de nuevos desarrolladores.

---

*Documento generado por revisión estática del código fuente (2026-06-30). No contiene secretos reales.*
