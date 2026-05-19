# Deployment — Guía Completa

Instrucciones para desplegar la API en Vercel y la app móvil en App Store y Google Play.

---

## Requisitos Previos

### Cuentas necesarias
- [Vercel](https://vercel.com) — free tier (para la API serverless)
- [Expo](https://expo.dev) — cuenta gratuita (para EAS Build y EAS Submit)
- [Apple Developer Program](https://developer.apple.com) — $99 USD/año (para App Store)
- [Google Play Console](https://play.google.com/console) — $25 USD pago único (para Google Play)

### Herramientas locales
```bash
npm install -g vercel eas-cli
```

---

## API Serverless (Vercel)

### Primera vez

```bash
cd api/
vercel login
vercel link          # seleccionar o crear proyecto "compara-farma-api"
```

### Configurar variables de entorno

En el dashboard de Vercel → Project → Settings → Environment Variables:

```
CRUZVERDE_CLIENT_ID   = c19ce24d-1677-4754-b9f7-c193997c5a92
ALGOLIA_APP_ID        = GM3RP06HJG
ALGOLIA_API_KEY       = 0259fe250b3be4b1326eb85e47aa7d81
API_SECRET_KEY        = <resultado de: openssl rand -hex 32>
```

Configurar para los entornos: Production, Preview y Development.

### Deploy manual

```bash
# Preview (no afecta producción)
vercel

# Producción
vercel --prod
```

### Deploy automático (GitHub Actions)

El workflow `.github/workflows/deploy-api.yml` despliega automáticamente a producción en cada push a `main`. Requiere el secret `VERCEL_TOKEN` configurado en GitHub → Repository Settings → Secrets.

### Verificar deploy

```bash
curl "https://api.comparafarma.cl/api/search?q=paracetamol" | jq '.[0]'
```

Debe retornar un `MedicationResult` con precios de al menos 2 farmacias.

### Dominio personalizado

En Vercel → Project → Settings → Domains: agregar `api.comparafarma.cl` y configurar el DNS CNAME apuntando a `cname.vercel-dns.com`.

---

## App Móvil (EAS Build + EAS Submit)

### Primera vez

```bash
cd mobile/
eas login
eas build:configure    # genera eas.json si no existe
```

Registrar la app:
- **iOS**: crear App ID en App Store Connect con bundle ID `cl.comparafarma.app`
- **Android**: crear app en Google Play Console con package `cl.comparafarma.app`

### Configurar secrets de EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.comparafarma.cl"
eas secret:create --scope project --name EXPO_PUBLIC_API_KEY --value "<mismo valor que API_SECRET_KEY>"
```

### Builds

```bash
# Development build (para testing en dispositivo con Expo Dev Client)
eas build --platform all --profile development

# Preview build (para TestFlight / Play Internal Testing)
eas build --platform all --profile preview

# Production build (para App Store / Google Play)
eas build --platform all --profile production
```

### Submit a tiendas

```bash
# App Store (iOS)
eas submit --platform ios --latest

# Google Play (Android)
eas submit --platform android --latest
```

El primer submit requiere credenciales de cada tienda. EAS las solicita interactivamente y las guarda encriptadas.

### OTA Updates (JavaScript-only)

Para fixes urgentes (por ejemplo: el scraper de Ahumada falla porque cambió el HTML) que NO requieren cambios en código nativo:

```bash
eas update --branch production --message "fix: actualizar regex Ahumada"
```

Los usuarios ven el fix en su próxima apertura de la app (o en background). No requiere revisión de App Store.

**Importante**: OTA updates solo funcionan para cambios en JavaScript/TypeScript del bundle. Cualquier cambio en dependencias nativas (nuevo módulo nativo, cambio de `app.json`, etc.) requiere un nuevo build completo.

---

## Proceso de Release Completo

1. **Merge a `main`** → GitHub Action despliega la API automáticamente
2. **Bump de versión** en `mobile/app.json` (`version` y `buildNumber`/`versionCode`)
3. **Build de producción**: `eas build --platform all --profile production`
4. **Testing en TestFlight** (iOS) y **Play Internal Testing** (Android) — al menos 24h
5. **Submit**: `eas submit --platform all --latest`
6. **Revisión de App Store** (~24-48h) y **Google Play** (~2-3 días para el primero, luego horas)
7. **Release** en el dashboard de cada tienda

---

## Rotar API Keys

Si las keys de Algolia o Cruz Verde se comprometen:

1. **Regenerar la key** en el dashboard correspondiente (Algolia Console / Cruz Verde admin)
2. **Actualizar en Vercel**: dashboard → Settings → Environment Variables → editar la variable
3. **Redeploy**: `vercel --prod` o hacer trigger manual en GitHub Actions
4. El mobile NO necesita update — las keys solo están en Vercel

---

## Troubleshooting

### La API devuelve 0 resultados para Ahumada
1. Verificar en browser: `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show?q=paracetamol&start=0&sz=10`
2. Si el sitio responde con HTML diferente, el scraper necesita actualización
3. Ver `docs/pharmacy-apis.md#mantenimiento-del-scraper` para el proceso de actualización

### Build de EAS falla
- Verificar que `eas.json` tiene configurados correctamente los `env` para cada profile
- Revisar los logs en `https://expo.dev` → proyecto → Builds

### App Store rechaza la app
- Categoría: usar "Health & Fitness", NO "Medical"
- Política de privacidad: debe estar accesible en `https://comparafarma.cl/privacy`
- Si piden revisión de función de salud: la app solo muestra precios, no da diagnósticos ni reemplaza consejo médico — incluir este disclaimer en la descripción
