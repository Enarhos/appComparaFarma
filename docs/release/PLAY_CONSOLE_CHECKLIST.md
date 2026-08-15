# Google Play Producción — Checklist de Publicación
**App:** ComparaFarma  
**Package:** `mla.app.comparafarma`  
**Versión:** 1.4.0 / versionCode 30  
**Fecha de revisión:** 2026-06-30  
**Base:** Revisión de `app.json`, `eas.json`, `AndroidManifest.xml`, `privacy-policy.html`, assets, `RELEASE_READINESS_V1.md`, `PRODUCTION_BLOCKERS_PLAN.md`

> **Convención de estados — dos columnas en el Checklist final**
>
> **Estado repo** — verificable desde el código fuente:
> - ✅ Verificado — confirmado en el repo, sin acción requerida
> - ⚠️ Pendiente — acción requerida en código o configuración del repo
> - — No aplica al repositorio
>
> **Estado Play Console** — verificable manualmente en Play Console:
> - ✅ Verificado — confirmado como completado en Play Console
> - ⚠️ Pendiente — acción requerida en Play Console antes de publicar
> - 🔍 No verificado — requiere revisión manual en Play Console
> - — No aplica a Play Console

---

## Índice

1. [Store Listing](#1-store-listing)
2. [Assets](#2-assets)
3. [App Content](#3-app-content)
4. [Release](#4-release)
5. [Data Safety](#5-data-safety)
6. [Riesgos de rechazo](#6-riesgos-de-rechazo)
7. [Checklist final](#7-checklist-final)
8. [Release Rollback Plan](#8-release-rollback-plan)

---

## 1. Store Listing

### 1.1 Nombre de la app

- **Valor:** `ComparaFarma`
- **Límite Play Store:** 50 caracteres → OK (12 chars)
- **Fuente:** `app.json` → `"name": "ComparaFarma"`
- **Estado:** ✅ Completo

### 1.2 Descripción corta

- **Límite Play Store:** 80 caracteres
- **Sugerencia (80 chars):**
  > Compara precios de medicamentos en Cruz Verde, Salcobrand, Ahumada y más. Gratis.
- **Estado:** ⚠️ Pendiente — confirmar texto en Play Console y actualizar si es necesario

### 1.3 Descripción larga

- **Límite Play Store:** 4.000 caracteres (mínimo recomendado: 250)
- **Sugerencia:**

```
ComparaFarma te ayuda a encontrar el mejor precio de tus medicamentos en las 9 principales farmacias de Chile: Cruz Verde, Salcobrand, Farmacias Ahumada, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop y EasyFarma.

¿Cómo funciona?
Escribe el nombre del medicamento y en segundos comparamos precios en tiempo real. Verás el precio presencial, el precio online, el precio con tarjeta de fidelización (T. Más, CMR, Fonasa, Plus) y el precio SBPay — todo en una sola pantalla.

Funcionalidades principales:
• Comparación en tiempo real en 9 farmacias
• Precios por 4 canales: presencial, online, tarjeta de fidelización, SBPay
• Filtro de bioequivalentes (genéricos aprobados por ISP)
• Historial de precios: sigue la evolución del precio de tus medicamentos
• Alertas de precio: establece un precio objetivo; la app te avisa al buscar si el precio bajó
• Lista de compras: calcula en qué farmacia te sale más barato comprar todo junto
• Favoritos: guarda los medicamentos que compras frecuentemente
• Filtro por farmacia y por comuna
• Modo oscuro automático

Sin publicidad. Sin registro. Sin datos personales.

ComparaFarma es gratuita y de uso libre. Funciona sin necesidad de cuenta ni registro.
```

- **Estado:** ⚠️ Pendiente — confirmar o reemplazar el texto actual en Play Console con descripción que incluya las 9 farmacias y las funcionalidades de v1.4.0

### 1.4 Novedades de la versión (What's new)

- **Límite Play Store:** 500 caracteres
- **Sugerencia para v1.4.0:**
```
v1.4.0
• Historial de precios para tus medicamentos favoritos
• Alertas de precio: establece un precio objetivo y ve si bajó la próxima vez que busques
• Lista de compras: compara el total en todas las farmacias
• 9 farmacias (sumamos AraucoMed, EcoFarmacias, Farmex, Sermecoop y EasyFarma)
• Mejoras de velocidad y estabilidad
```
- **Estado:** ⚠️ Pendiente

### 1.5 Categoría

- **Categoría recomendada:** Salud y bienestar → Salud y fitness → Utilidades médicas
- **Categoría alternativa:** Herramientas
- **Estado:** 🔍 Requiere validación en Play Console

### 1.6 Tags / Palabras clave

> Play Store no acepta tags manuales; las palabras clave se derivan del nombre y descripción.

Incluir en la descripción larga términos relevantes:
`medicamentos`, `farmacia`, `comparar precios`, `bioequivalente`, `Cruz Verde`, `Salcobrand`, `Ahumada`, `Dr. Simi`, `Chile`, `precio`, `medicamento genérico`

- **Estado:** ✅ Completo (si la descripción larga los incluye)

### 1.7 Email de contacto

- **Valor:** `mario.lillo.alfaro@gmail.com`
- **Estado:** 🔍 Requiere validación en Play Console

### 1.8 Sitio web

- **Valor sugerido:** `https://enarhos.github.io/appComparaFarma/privacy-policy.html`
  - *Si el repo se transfiere a otra cuenta, actualizar esta URL al nuevo owner de GitHub Pages.*
- **Estado:** 🔍 Requiere validación en Play Console

### 1.9 Política de privacidad

- **URL actual:** `https://enarhos.github.io/appComparaFarma/privacy-policy.html`
- **Fuente:** `docs/privacy-policy.html` (publicada en GitHub Pages)
- **Verificación de contenido:**
  - ✅ Declara que no recopila datos personales
  - ✅ Menciona Sentry para monitoreo de errores
  - ✅ Menciona que el caché es local y se elimina automáticamente
  - ✅ Contacto: `mario.lillo.alfaro@gmail.com`
  - ⚠️ **Desactualizada:** solo menciona 4 farmacias (Cruz Verde, Salcobrand, Ahumada, Dr. Simi), no las 9 actuales
  - ⚠️ **Desactualizada:** no menciona PostHog (analytics de uso)
  - ⚠️ **Desactualizada:** footer dice "© 2025" (año incorrecto)
  - ⚠️ **Desactualizada:** última actualización declarada: 21 de mayo de 2026

**Acción requerida:** Actualizar `docs/privacy-policy.html` para incluir:
1. Las 9 farmacias en la lista de terceros consultados
2. PostHog como herramienta de analytics anónimos
3. Año 2026 en el footer

- **Estado:** ⚠️ Pendiente (actualizar antes de publicar)

---

## 2. Assets

### 2.1 App Icon

| Asset | Especificación Play Store | Disponible en repo | Estado |
|-------|--------------------------|-------------------|--------|
| Ícono base | 512×512 PNG, sin alfa | `mobile/assets/icon.png` | 🔍 Verificar dimensiones |
| Adaptive icon foreground | PNG con margen de seguridad | `mobile/assets/adaptive-icon.png` | ✅ Configurado en app.json |
| Adaptive icon background | Color sólido | `#16a34a` (app.json) | ✅ Completo |
| `icon_new.png` | — | `mobile/assets/icon_new.png` | ⚠️ Verificar si es el ícono vigente o descartado |

**Nota:** Existe `icon_new.png` en assets junto a `icon.png`. Confirmar cuál es el ícono canónico para producción.

### 2.2 Feature Graphic

| Asset | Especificación Play Store | Disponible en repo | Estado |
|-------|--------------------------|-------------------|--------|
| Feature graphic | 1024×500 JPG/PNG | `mobile/assets/feature-graphic.png` y `docs/screenshots/feature_graphic.png` | ✅ Existe (verificar cuál es la versión vigente) |

**Nota:** El archivo existe en dos rutas distintas. Confirmar que el subido a Play Console es el mismo que `docs/screenshots/feature_graphic.png` (referenciado en RELEASE_READINESS_V1.md como la versión correcta).

### 2.3 Screenshots de teléfono

**Requisitos Play Store:** mínimo 2, máximo 8 capturas. Tamaño mínimo: 320px. Máximo: 3.840px. Ratio entre 1:2 y 2:1.

| # | Archivo en repo | Pantalla | Estado |
|---|-----------------|----------|--------|
| 1 | `docs/screenshots/screenshot_1_home.png` | Home | ✅ Disponible |
| 2 | `docs/screenshots/screenshot_2_results.png` | Resultados | ✅ Disponible |
| 3 | `docs/screenshots/screenshot_3_detail.png` | Detalle | ✅ Disponible |
| 4 | — | Historial de precios / Alerta activa | ⚠️ Pendiente: capturar y agregar |
| 5 | — | Lista de compras | ⚠️ Pendiente: capturar y agregar |
| 6 | — | Modo oscuro | ⚠️ Pendiente (opcional, mejora conversión) |

Play Store acepta hasta 8 screenshots. Con 3 se puede publicar, pero se recomienda 5–6 para mejor conversión. Las capturas adicionales más importantes son las que muestran features diferenciadores (historial de precios, alertas, lista de compras).

### 2.4 Screenshots de tablet

- `app.json` → `"supportsTablet": false`
- Play Store no los exige si la app no declara soporte tablet
- **Estado:** ✅ No aplica

### 2.5 Splash screen

- **Imagen:** `mobile/assets/splash.png`
- **Background:** `#16a34a` (verde)
- **Fuente:** `app.json` → `splash.image` + `backgroundColor`
- **Estado:** ✅ Configurado

---

## 3. App Content

### 3.1 Privacy Policy

- Ver sección 1.9 — URL configurada, contenido desactualizado
- **Estado:** ⚠️ Pendiente (actualizar privacy-policy.html antes de publicar)

### 3.2 Data Safety

- **Estado:** ⚠️ **BLOQUEANTE** — ver sección 5 completa
- Sin este formulario completado, Play Console impide el publish a Producción

### 3.3 Ads (Publicidad)

- La app no contiene publicidad de ningún tipo
- No hay integración con AdMob, Meta Audience Network ni ningún SDK de publicidad
- **Declaración en Play Console:** "No, esta app no tiene anuncios"
- **Estado:** ✅ Completo (declarar en Play Console)

### 3.4 App Access

- La app no requiere login ni credenciales especiales para acceder a su contenido
- Toda la funcionalidad es accesible sin cuenta
- **Declaración en Play Console:** "Toda la funcionalidad está disponible sin acceso especial"
- **Estado:** ✅ Completo (declarar en Play Console)

### 3.5 Content Rating

- **Cuestionario IARC** requerido por Play Console
- ComparaFarma no contiene: violencia, lenguaje adulto, contenido para adultos, juegos de azar, referencias a drogas recreativas
- **Calificación esperada:** `PEGI 3` / `Todo público` / equivalente regional sin restricciones de edad
- La app consulta precios de medicamentos (uso médico), no implica contenido sensible
- **Estado:** 🔍 Requiere completar el cuestionario IARC en Play Console

### 3.6 Target Audience

- **Público objetivo:** Adultos (18+) y adultos mayores en Chile que compran medicamentos
- **Mínimo de edad:** No dirigida a menores de 13 (declarado en `privacy-policy.html`)
- **Declaración en Play Console:**
  - Edad objetivo: 18 y más
  - ¿Dirigida a niños? → No
  - *Si se declara "13+" o "18+", Play Console puede no requerir childDirected flag*
- **Estado:** 🔍 Requiere validación en Play Console

### 3.7 Apps de noticias

- ComparaFarma **no es** una app de noticias ni agrega contenido editorial
- **Estado:** ✅ No aplica

### 3.8 Apps gubernamentales

- ComparaFarma **no es** una app gubernamental ni oficial de MINSAL
- Usa datos de MINSAL (sucursales) como referencia interna, no como fuente pública oficial
- **Estado:** ✅ No aplica

### 3.9 Características financieras

- La app muestra precios de productos (medicamentos), no procesa pagos ni transacciones financieras
- El DonationBanner abre URLs de Khipu en el browser externo — no hay integración de pago in-app
- **Estado:** ✅ No aplica (sin pagos in-app ni transacciones financieras)

### 3.10 Health apps / Medical disclaimer

- ComparaFarma es una app de comparación de precios, **no una app de salud clínica ni diagnóstico médico**
- No da recomendaciones de medicamentos ni diagnósticos
- No gestiona datos de salud del usuario
- **Acción preventiva recomendada:** Agregar en la descripción de Play Store la frase: *"ComparaFarma es una herramienta de comparación de precios. No reemplaza la consulta con un profesional de la salud ni la prescripción médica."*
- **Estado:** ✅ No requiere acción especial de Play Store, pero se recomienda el disclaimer en descripción

### 3.11 Permisos declarados

**Desde `AndroidManifest.xml` (fuente: `mobile/android/app/src/main/AndroidManifest.xml`):**

| Permiso | Justificación | ¿Necesario en producción? |
|---------|--------------|--------------------------|
| `INTERNET` | Consultar APIs de farmacias | ✅ Sí |
| `READ_EXTERNAL_STORAGE` | Agregado por expo-dev-client | ⚠️ Solo en debug — verificar que no aparece en el AAB de release |
| `WRITE_EXTERNAL_STORAGE` | Agregado por expo-dev-client | ⚠️ Solo en debug — verificar que no aparece en el AAB de release |
| `SYSTEM_ALERT_WINDOW` | Agregado por expo-dev-client | ⚠️ Solo en debug — verificar que no aparece en el AAB de release |
| `VIBRATE` | expo-haptics | ✅ Necesario (feedback háptico) |

> **Nota importante:** `app.json` → `"permissions": []` — Expo respeta esta lista para el build de producción y no agrega permisos extra. Los permisos de storage y `SYSTEM_ALERT_WINDOW` deberían estar solo en el perfil de desarrollo (`expo-dev-client`). Verificar en Play Console → "Bundle analysis" → "Permissions" que el AAB de producción solo tiene `INTERNET` y `VIBRATE`.

---

## 4. Release

### 4.1 Package name

- **Valor:** `mla.app.comparafarma`
- **Fuente:** `app.json` → `android.package`
- **Estado:** ✅ Completo

### 4.2 Version name

- **Valor:** `1.4.0`
- **Fuente:** `app.json` → `version`
- **Estado:** ✅ Completo

### 4.3 Version code

- **Valor actual:** `30`
- **Fuente:** `app.json` → `android.versionCode`
- **Próximo disponible:** `31` o mayor (los vc 17 y 20 están reservados y no reusables)
- **Estado:** ✅ Completo

### 4.4 Target SDK

- **Valor:** `targetSdkVersion = 36` (Android 16)
- **Mínimo requerido por Play:** 34 (Android 14, desde agosto 2024)
- **Verificado en:** `mobile/android/app/build/intermediates/merged_manifests/release/.../AndroidManifest.xml`
- **Estado:** ✅ Completo (B-4 cerrado)

### 4.5 Min SDK

- **Valor:** `minSdkVersion = 24` (Android 7.0)
- **Fuente:** `mobile/android/app/build/intermediates/merged_manifests/release/.../AndroidManifest.xml`
- **Estado:** ✅ Completo

### 4.6 AAB firmado

- **Generado con:** `pnpm build:android` (build local, script en `scripts-temp/pack.ps1`)
- **Archivo generado:** `mobile/android/app/build/outputs/bundle/release/app-release.aab`
- **Firmado con:** keystore local
- **Historial en Prueba Interna:** versionCode 30 (v1.4.0) subido y activo
- **Google Play App Signing:** 🔍 Requiere validación — verificar si está habilitado en Play Console → Setup → App integrity
  - Si está habilitado (recomendado): Google re-firma el AAB con la clave definitiva; la keystore local es solo "upload key"
  - Si no está habilitado: la keystore local es la definitiva y **debe estar respaldada de forma segura**
- **Estado:** ⚠️ Verificar en Play Console que la firma es válida y que Play App Signing está habilitado

### 4.7 Keystore / Upload key

- **Ubicación:** No verificable desde el repo (debe estar fuera del control de versiones)
- **Riesgo:** Si se pierde la keystore y Play App Signing no está habilitado, **no es posible publicar actualizaciones**
- **Acción requerida:** Confirmar que existe un backup de la keystore en lugar seguro (fuera del repo), y que Play App Signing está habilitado
- **Estado:** 🔍 Requiere validación

### 4.8 Track actual en Play Console

- **Track actual con vc30:** Prueba Interna
- **Testers activos:** Sí (confirmado en RELEASE_READINESS_V1.md)
- **Estado:** ✅ Completo

### 4.9 Promover a Producción

- **Acción:** Play Console → App → Testing → Internal testing → versionCode 30 → Promote → Production
- **Rollout recomendado:** iniciar con 10–20% para detectar crashes antes de rollout completo
- **Estado:** ⚠️ Pendiente — solo ejecutar después de completar todos los bloqueantes

### 4.10 EAS Submit — configuración de track

- **Alerta:** `eas.json` → `submit.production.android.track: "internal"` — si se usa `eas submit` en el futuro, enviará el AAB al track de Prueba Interna, **no a Producción**
- **Acción:** Para submit a Producción via EAS, cambiar a `"track": "production"` o pasar el flag `--track production` en el comando

```json
// eas.json — para submit a producción:
"submit": {
  "production": {
    "android": {
      "track": "production"
    }
  }
}
```

- **Estado:** ⚠️ Pendiente — corregir antes de usar `eas submit` para producción

---

## 5. Data Safety

Esta sección mapea los datos que ComparaFarma procesa con las categorías del formulario de Data Safety de Play Console. Es **obligatorio** completar este formulario antes de publicar.

### 5.1 Resumen de datos procesados por la app

| Categoría | Dato | ¿Recopila? | ¿Almacenado en servidor? | Fuente técnica |
|-----------|------|-----------|--------------------------|----------------|
| Actividad de la app | Búsquedas realizadas (query, farmacias, precio) | **Sí** | Sí (PostHog, anónimo) | `mobile/src/lib/analytics.ts` → evento `medication_search` |
| Diagnóstico | Datos de fallos (tipo error, versión app, modelo dispositivo) | **Sí** | Sí (Sentry) | `mobile/src/app/_layout.tsx` → `Sentry.wrap()` |
| Historial de búsquedas | Últimas 10 búsquedas | **Sí** | No (solo AsyncStorage local) | `historyStore.ts` → `search-history` |
| Favoritos | Medicamentos guardados | **Sí** | No (solo AsyncStorage local) | `favoritesStore.ts` → `favorites-v1` |
| Alertas de precio | Precio objetivo por medicamento | **Sí** | No (solo AsyncStorage local) | `alertsStore.ts` → `price_alerts_v1` |
| Identificadores de dispositivo | Device ID anónimo de PostHog | **Posiblemente** | Sí (PostHog) | `posthog-react-native` genera un distinct_id por instalación |
| Ubicación precisa | — | **No** | — | No hay GPS ni geolocalización |
| Ubicación aproximada | — | **No** | — | La "comuna" es una selección manual del usuario |
| Información personal | Nombre, email, teléfono, etc. | **No** | — | No hay login ni registro |
| Información financiera | — | **No** | — | No procesa pagos in-app |
| Mensajes | — | **No** | — | El formulario de feedback (about.tsx) envía texto + email opcional, pero el email es voluntario |
| Fotos / Videos | — | **No** | — | Sin permisos de cámara/galería |
| Audio | — | **No** | — | Sin permisos de micrófono |
| Contactos | — | **No** | — | Sin permisos de contactos |
| SMS / Llamadas | — | **No** | — | Sin permisos telefónicos |

### 5.2 Formulario de Data Safety — respuestas exactas

**Sección "Recopilación y seguridad de datos":**

| Pregunta | Respuesta | Justificación |
|----------|-----------|---------------|
| ¿Tu app recopila o comparte tipos de datos de usuario? | **Sí** | PostHog y Sentry procesan datos anónimos |
| ¿Todos los datos de usuario se cifran en tránsito? | **Sí** | Todo el tráfico usa HTTPS |
| ¿Los usuarios pueden solicitar que se eliminen sus datos? | **Sí** | Los datos locales se eliminan al desinstalar la app; para datos de PostHog/Sentry, indicar `mario.lillo.alfaro@gmail.com` |

**Tipos de datos a declarar:**

| Categoría en Play Console | Tipo específico | Recopila | Comparte con terceros | Propósito | Opcional |
|--------------------------|-----------------|----------|-----------------------|-----------|---------|
| Actividad de la app | Interacciones en la app | ✅ Sí | No (solo PostHog, que actúa como procesador) | Analytics / Estadísticas de uso | No |
| Diagnóstico | Datos de fallos de la app | ✅ Sí | No (solo Sentry, que actúa como procesador) | Diagnóstico de errores | No |
| Identificadores de la app | ID de dispositivo o app | ✅ Posiblemente | No (interno de PostHog) | Analytics anónimos | No |

**Tipos que NO se recopilan (no marcar):**
- Información de contacto personal (nombre, email del usuario)
- Información financiera
- Salud y estado físico
- Mensajes
- Fotos y videos
- Archivos y documentos
- Aplicaciones en el dispositivo
- Historial web y de apps
- Ubicación precisa o aproximada (GPS)
- Voz o audio

### 5.3 Notas adicionales sobre Data Safety

1. **PostHog vs datos de usuario:** PostHog registra `medication_search` con los campos `query`, `results_count`, `pharmacies` (slugs), `best_price`, `commune`. Ninguno de estos es dato personal identificable. Son métricas de uso anónimas. PostHog genera un `distinct_id` por instalación pero no lo vincula a una persona real.

2. **Sentry y el query de búsqueda:** `useSearch.ts` llama a `Sentry.captureException()` en caso de error. Si el contexto incluye el query de búsqueda en el momento del error, ese string llegaría a Sentry. Verificar si se está enviando el query como contexto adicional y, si es así, declararlo como "Actividad de la app / Interacciones" en Sentry, no solo como "Diagnóstico".

3. **Email del formulario de feedback:** `about.tsx` permite al usuario ingresar su email de forma **opcional**. Si el usuario lo ingresa, se envía vía Resend a `FEEDBACK_EMAIL`. Esto podría requerir declarar "Información de contacto — Dirección de email" con propósito "Comunicación con el desarrollador". Verificar con Play Console si un campo opcional de email que el usuario ingresa voluntariamente requiere declaración.

4. **Política de privacidad y Data Safety deben ser consistentes:** Play Console verifica que la política de privacidad no contradiga lo declarado en Data Safety. La política actual NO menciona PostHog — esto crea inconsistencia si se declara analytics en Data Safety. **Actualizar la política antes de completar el formulario.**

---

## 6. Riesgos de rechazo

Los siguientes puntos pueden generar rechazo por parte de Google Play o penalización en el ranking.

| # | Riesgo | Probabilidad | Impacto | Acción requerida |
|---|--------|-------------|---------|-----------------|
| R-1 | **Data Safety no completado** | Alta | 🔴 Bloquea publish | Completar el formulario en Play Console antes de publicar |
| R-2 | **Inconsistencia entre Data Safety y Privacy Policy** | Media | 🟡 Alerta de revisión | Actualizar `privacy-policy.html` para mencionar PostHog antes de completar Data Safety |
| R-3 | **Privacy Policy desactualizada** (solo 4 farmacias, sin PostHog, © 2025) | Alta | 🟡 Puede triggear revisión manual | Actualizar el archivo antes de publicar |
| R-4 | **Permisos `READ/WRITE_EXTERNAL_STORAGE` en debug manifest** | Media | 🟡 Genera advertencia en Play Console si aparecen en el AAB de producción | Verificar permisos en el AAB final; Expo debería excluirlos en build de producción |
| R-5 | **`android:allowBackup="true"`** en el AndroidManifest principal | Baja | 🟡 Algunos revisores lo marcan como riesgo de privacidad | Considerar cambiar a `false` si hay datos sensibles en SharedPreferences; AsyncStorage con datos médicos podría ser considerado sensible |
| R-6 | **`eas.json` track "internal"** para submit | Media | 🔴 Envía el AAB al track incorrecto si se usa `eas submit` | Cambiar a `"track": "production"` antes de submit a producción |
| R-7 | **Disclaimer médico ausente** | Baja | 🟡 En categoría Health, Play puede solicitar aclaración | Agregar en descripción: "No reemplaza la consulta médica" |
| R-8 | **Screenshots solo en modo claro** | Muy baja | Sin impacto técnico | Opcional: agregar una screenshot en modo oscuro para mostrar la feature |
| R-9 | **Descripción sin actualizar** (si aún lista solo 4 farmacias) | Media | 🟡 Inconsistencia con la app real | Actualizar la descripción larga para mencionar las 9 farmacias |
| R-10 | **Content Rating sin completar** | Alta | 🔴 Bloquea publish si no está completado | Completar el cuestionario IARC en Play Console |

---

## 7. Checklist final

| # | Ítem | Estado repo | Estado Play Console | Responsable | Acción requerida | Evidencia esperada |
|---|------|-------------|---------------------|-------------|-----------------|-------------------|
| **STORE LISTING** | | | | | | |
| SL-1 | Nombre de la app: "ComparaFarma" | ✅ Verificado | ✅ Verificado | — | — | Play Console → Ficha principal |
| SL-2 | Descripción corta (≤80 chars, menciona las 9 farmacias) | — | ⚠️ Pendiente | Mario | Redactar y subir a Play Console | Captura Play Console → Descripción corta |
| SL-3 | Descripción larga actualizada (v1.4.0, 9 farmacias, features actuales) | — | ⚠️ Pendiente | Mario | Redactar con features de v1.4.0 y subir | Captura Play Console → Descripción larga |
| SL-4 | Novedades de la versión (What's new) para v1.4.0 | — | ⚠️ Pendiente | Mario | Redactar y subir | Captura Play Console → Novedades |
| SL-5 | Categoría seleccionada | — | 🔍 No verificado | Mario | Verificar categoría en Play Console | Captura Play Console → Categoría |
| SL-6 | Email de soporte confirmado | ⚠️ Pendiente | 🔍 No verificado | Mario | Confirmar `mario.lillo.alfaro@gmail.com` en Play Console | Captura Play Console → Contacto |
| SL-7 | Sitio web configurado | — | 🔍 No verificado | Mario | Verificar URL en Play Console | Captura Play Console → Sitio web |
| SL-8 | Privacy Policy URL accesible | ⚠️ Pendiente | 🔍 No verificado | Dev principal | Actualizar contenido + verificar URL | URL abre correctamente, contenido actualizado |
| **ASSETS** | | | | | | |
| AS-1 | App icon 512×512 subido | ✅ Verificado | 🔍 No verificado | Mario | Verificar dimensiones y subida en Play Console | Captura Play Console → Ícono |
| AS-2 | Adaptive icon configurado | ✅ Verificado | — | — | — | `app.json` → `adaptiveIcon` |
| AS-3 | Feature graphic 1024×500 subido | ✅ Verificado | 🔍 No verificado | Mario | Verificar que `docs/screenshots/feature_graphic.png` es el correcto | Captura Play Console → Feature graphic |
| AS-4 | Mínimo 2 screenshots de teléfono subidos | ✅ Verificado | 🔍 No verificado | Mario | Verificar que los 3 están subidos en Play Console | Play Console → Recursos gráficos |
| AS-5 | Screenshots adicionales (historial, lista de compras) | ⚠️ Pendiente | ⚠️ Pendiente | Mario | Capturar en dispositivo y subir | 5–6 screenshots en Play Console |
| **APP CONTENT** | | | | | | |
| AC-1 | Privacy Policy actualizada y accesible | ⚠️ Pendiente | 🔍 No verificado | Dev principal | Actualizar `docs/privacy-policy.html` (9 farmacias, PostHog, año 2026) | Commit en repo + URL accesible |
| AC-2 | **Data Safety completado** ← **BLOQUEANTE** | — | ⚠️ Pendiente | Mario | Completar formulario en Play Console según sección 5 de este documento | Play Console → Seguridad de los datos → ✅ verde |
| AC-3 | Publicidad: declarado "Sin anuncios" | ✅ Verificado | ⚠️ Pendiente | Mario | Marcar "No" en Play Console → Anuncios | Captura Play Console → Anuncios |
| AC-4 | App Access: "Sin acceso especial requerido" | ✅ Verificado | ⚠️ Pendiente | Mario | Declarar en Play Console | Captura Play Console → Acceso a la app |
| AC-5 | Content Rating (cuestionario IARC completado) | — | ⚠️ Pendiente | Mario | Completar el cuestionario en Play Console | Play Console → Clasificación del contenido → ✅ Completado |
| AC-6 | Target Audience: 18+ declarado | — | 🔍 No verificado | Mario | Declarar en Play Console → Público objetivo | Captura Play Console → Público objetivo |
| AC-7 | Disclaimer médico en descripción | — | ⚠️ Pendiente | Mario | Agregar frase "No reemplaza la consulta médica" en descripción larga | Texto visible en descripción de Play Store |
| **RELEASE** | | | | | | |
| RE-1 | Package name: `mla.app.comparafarma` | ✅ Verificado | ✅ Verificado | — | — | `app.json` |
| RE-2 | Version name: 1.4.0 | ✅ Verificado | 🔍 No verificado | — | Verificar que Play Console muestra 1.4.0 | Play Console → Prueba Interna |
| RE-3 | Version code: 30 | ✅ Verificado | 🔍 No verificado | — | Verificar que Play Console muestra vc30 | Play Console → Prueba Interna |
| RE-4 | Target SDK ≥ 34 en AAB | ✅ Verificado (36) | 🔍 No verificado | — | Verificar en Play Console → Bundle analysis | Captura Bundle analysis → Target SDK |
| RE-5 | Permisos de producción correctos (solo INTERNET + VIBRATE) | ✅ Verificado | ⚠️ Pendiente | Dev principal | Verificar en Play Console → Bundle analysis → Permissions | Captura Bundle analysis sin permisos de storage |
| RE-6 | AAB firmado disponible | ✅ Verificado | ✅ Verificado | — | — | `comparafarma-v1.4.0-vc30.aab` + Prueba Interna activa |
| RE-7 | Play App Signing habilitado | — | ✅ Confirmado (2026-08-15, verificado por el CTO en Play Console) | Mario | — | Confirmación directa del CTO en Play Console → Setup → App integrity |
| RE-8 | Keystore respaldada de forma segura | — | 🔍 No verificado — `HUMAN_ACTION_REQUIRED: BACKUP_ANDROID_UPLOAD_KEY` | Dev principal | Confirmar backup externo al repo | Confirmación verbal / evidencia de backup seguro |
| RE-9 | `eas.json` track corregido a "production" | ⚠️ Pendiente | — | Dev principal | Cambiar `"track": "internal"` → `"track": "production"` en `eas.json` | Diff en repo |
| RE-10 | Track de Prueba Interna activo (vc30) | — | ✅ Verificado | — | — | Play Console → Prueba Interna |
| RE-11 | Promover vc30 a Producción | — | ⚠️ Pendiente | Mario | Play Console → Prueba Interna → Promover (después de resolver todos los ítems pendientes) | Play Console → Producción → rollout activo |
| **SEGURIDAD** | | | | | | |
| SE-1 | `API_SECRET_KEY` configurada en Vercel | ✅ Verificado | — | — | — | `curl` sin key devuelve 401 |
| SE-2 | `EXPO_PUBLIC_API_KEY` en EAS Secrets | ⚠️ Pendiente | — | Dev principal | Verificar con `eas secret:list` | `eas secret:list` muestra la key |
| SE-3 | Algolia keys en Vercel env vars | ✅ Verificado | — | — | Resuelto en B-3 (commit `ad76da1`) | `grep` en `salcobrand.ts` sin credenciales hardcodeadas |
| **POST-PUBLICACIÓN** | | | | | | |
| PO-1 | Monitorear Sentry en las primeras 48h | — | ⚠️ Pendiente | Dev principal | Revisar Sentry Dashboard después de publicar | Sin nuevos crash reports críticos |
| PO-2 | Revisar primeras reseñas en Play Store | — | ⚠️ Pendiente | Mario | Monitorear Play Console → Reseñas | — |
| PO-3 | Verificar healthcheck monitor sigue verde | ✅ Verificado | — | Dev principal | Revisar `.github/workflows/monitor-api.yml` post-deploy | GitHub Actions → Monitor API → verde |

---

### Orden de ejecución recomendado

```
1. Actualizar privacy-policy.html (9 farmacias + PostHog + año 2026)
2. Completar cuestionario Content Rating (IARC) en Play Console
3. Completar formulario Data Safety en Play Console  ← BLOQUEANTE
4. Verificar API_SECRET_KEY en Vercel Dashboard
5. Actualizar Store Listing (descripción corta, larga, novedades, disclaimer)
6. Verificar / subir assets (icon 512×512, feature graphic, screenshots adicionales)
7. Verificar permisos en el AAB (Play Console → Bundle analysis)
8. Verificar Play App Signing y backup de keystore
9. Corregir eas.json track → "production"
10. Promover versionCode 30 a Producción (10% rollout inicial)
11. Monitorear Sentry + Play Console las primeras 48h
```

---

## 8. Release Rollback Plan

### 8.1 Cómo detener un rollout en curso

Si se detecta un problema crítico después de promover a Producción:

1. **Play Console** → App → Producción → versión activa → **Más opciones** → **Detener rollout**
2. Esto congela el porcentaje actual — los nuevos usuarios no recibirán la actualización, los que ya la tienen la conservan.
3. El rollout queda suspendido hasta que se promueva manualmente de nuevo o se publique una versión nueva.

> **Tiempo estimado:** inmediato desde Play Console. Los cambios de distribución pueden tardar hasta 1–2 horas en propagarse a todos los dispositivos elegibles.

### 8.2 Cómo revertir a una versión anterior

**Opción A — Rollback via OTA (EAS Update) — solo JS/TS, sin cambios nativos:**

```bash
# Volver al branch de la versión anterior
git checkout tags/v1.3.0   # o el tag de la versión estable

# Publicar update OTA
eas update --branch production --message "rollback: revertir a v1.3.0"
```

- Los usuarios con v1.4.0 instalado recibirán automáticamente el bundle anterior la próxima vez que abran la app.
- Requiere que `runtimeVersion` en `eas.json` sea compatible entre v1.3.0 y v1.4.0 (mismo `appVersion`).
- **No aplica** si el rollback implica cambios en código nativo (actualizaciones de dependencias con módulos nativos, cambios en `app.json` que afecten el build).

**Opción B — Revertir via Play Console (build anterior):**

1. **Play Console** → App → Producción → Crear nueva versión
2. Subir el AAB de la versión estable anterior (versionCode 16, v1.3.0)
   - El AAB debe estar disponible en backup local — Play Console no permite re-descargar builds anteriores
3. Incrementar el versionCode al valor siguiente disponible (mínimo 31) — Play Store rechaza versionCodes menores o iguales al último publicado
4. Publicar con rollout al 100%

> **Tiempo estimado:** 2–4 horas de revisión express de Google (normalmente más rápido para hotfixes), más el tiempo de propagación.

**Opción C — Rollback del backend (Vercel):**

Si el problema es exclusivo del API:

1. **Vercel Dashboard** → Proyecto `comparafarma-api` → Deployments
2. Identificar el deployment estable anterior (el último con estado `Production` antes de la regresión)
3. Click → **Redeploy** → Confirmar

> **Tiempo estimado:** ~2 minutos. No requiere cambios en la app móvil.

### 8.3 Métricas a revisar durante las primeras 24 horas

| Métrica | Herramienta | Dónde verla | Frecuencia recomendada |
|---------|-------------|-------------|----------------------|
| Crash-free users rate | Sentry | Dashboard → Issues → Overview | Cada 2 horas |
| Tasa de ANR (Application Not Responding) | Play Console | Android vitals → ANR rate | Cada 4 horas |
| Tasa de crashes nativos | Play Console | Android vitals → Crash rate | Cada 4 horas |
| Errores en `/api/search` | Vercel | Dashboard → Functions → Logs | Cada 2 horas |
| Estado del healthcheck | GitHub Actions | `.github/workflows/monitor-api.yml` | Automático cada 6h |
| Evento `medication_search` activo | PostHog | Dashboard → Events → medication_search | Cada 4 horas |
| Reseñas nuevas | Play Console | Reseñas → Filtrar por versión 1.4.0 | 1 vez al día |

### 8.4 Criterios para abortar el despliegue

Detener el rollout y evaluar reversión si se cumple **cualquiera** de estas condiciones:

| Criterio | Umbral de alerta | Acción |
|----------|-----------------|--------|
| Crash-free users (Sentry) | < 99% en las primeras 6h | Detener rollout + evaluar OTA rollback |
| ANR rate (Play Console) | > 0.47% (umbral "bad behavior" de Google) | Detener rollout inmediatamente |
| Crash rate nativo (Play Console) | > 1.09% (umbral "bad behavior" de Google) | Detener rollout inmediatamente |
| Errores en `/api/search` (Vercel) | > 10% de requests con error 5xx | Rollback backend vía Vercel |
| Monitor API (GitHub Actions) | 2 ejecuciones consecutivas fallidas | Investigar + rollback backend si corresponde |
| Farmacia completa sin resultados | 0 resultados de una farmacia en >30 min | Publicar OTA fix o rollback |
| Usuarios reportan funcionalidad rota | >3 reseñas con 1★ sobre el mismo problema en 24h | Detener rollout + investigar |

> **Nota sobre el rollout inicial:** Se recomienda comenzar con 10–20% de usuarios para que los criterios anteriores apliquen sobre una muestra acotada antes de comprometer el 100% de la base instalada.

---

*Documento generado el 2026-06-30 por revisión estática del código fuente, `app.json`, `eas.json`, `AndroidManifest.xml`, `privacy-policy.html`, assets disponibles en el repositorio, y los documentos `RELEASE_READINESS_V1.md` y `PRODUCTION_BLOCKERS_PLAN.md`. Los ítems marcados como "Requiere validación en Play Console" no pueden verificarse desde el repositorio y deben ser confirmados manualmente.*
