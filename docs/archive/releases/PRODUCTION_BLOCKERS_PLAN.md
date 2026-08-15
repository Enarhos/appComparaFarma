# Plan Operativo — Bloqueantes de Producción
**Revisión:** 2026-06-30  
**Base:** [RELEASE_READINESS_V1.md](RELEASE_READINESS_V1.md)  
**Objetivo:** Cerrar los 4 bloqueantes que impiden publicar ComparaFarma en Google Play Producción.

---

## Estado de bloqueantes

| # | Bloqueante | Estado | Esfuerzo | Responsable |
|---|-----------|--------|----------|-------------|
| B-1 | Data Safety en Play Console | 🔴 Pendiente | ~1h | Product / CEO |
| B-2 | `API_SECRET_KEY` en Vercel | 🟡 Verificar | ~15 min | Dev principal |
| B-3 | Algolia key hardcodeada → mover a env vars | 🔴 Pendiente | ~45 min | Dev principal |
| B-4 | Target SDK ≥ 34 en el AAB | ✅ Resuelto | — | — |

> **B-4 ya está resuelto.** El AAB local del build actual contiene `targetSdkVersion="36"` (Android 16), verificado en `mobile/android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml`. Se documenta el cierre formal en la sección correspondiente.

**Estimación total para desbloquear producción: ~2 horas** (B-1 + B-2 + B-3).

---

## B-1 — Data Safety en Play Console

### Descripción

Google Play exige que cada app declare en la sección "Data Safety" qué datos recopila, con qué propósito y si los comparte con terceros. Esta declaración es **obligatoria** para publicar en Producción: Play Console bloquea el publish si está incompleta o vacía.

ComparaFarma no recopila datos personales de usuarios, pero usa dos servicios que sí procesan eventos:
- **Sentry** — captura stack traces de crashes (puede incluir query de búsqueda como contexto extra)
- **PostHog** — registra el evento `medication_search` con query, resultados, farmacia y comuna

### Riesgo

🔴 **Bloqueante absoluto.** Sin este formulario completo, el botón "Publicar" en Play Console queda deshabilitado. No hay workaround.

### Pasos exactos para resolver

**Consola:** [play.google.com/console](https://play.google.com/console) → App `ComparaFarma` → Contenido de la aplicación → Seguridad de los datos

#### Paso 1 — Sección "Recopilación y seguridad de datos"

| Pregunta | Respuesta | Justificación |
|----------|-----------|---------------|
| ¿Tu app recopila o comparte alguno de los tipos de datos de usuario requeridos? | **No** | No hay login, no se almacenan datos de usuario en el servidor |
| ¿Todos los datos de usuario recopilados están cifrados en tránsito? | **Sí** | Todo el tráfico es HTTPS |
| ¿Los usuarios pueden solicitar que se eliminen sus datos? | **Sí** | Los datos locales (AsyncStorage) los elimina el usuario desinstalando la app |

#### Paso 2 — Sección "Tipos de datos"

Seleccionar los tipos de datos que se recopilan:

| Categoría | Tipo | ¿Se recopila? | Propósito | ¿Se comparte? | Obligatorio |
|-----------|------|--------------|-----------|--------------|-------------|
| Actividad de la app | Interacciones en la app | **Sí** | Analytics (PostHog: `medication_search`) | No | No |
| Diagnóstico | Datos de fallos | **Sí** | Detección de errores (Sentry crashes) | No (solo Sentry, que no revende) | No |

> **No seleccionar** ningún dato de la categoría Información personal, Información financiera, Mensajes, Fotos/videos, Audio, Archivos, Contactos, Ubicación, Salud, ni Identificadores. ComparaFarma no accede a ninguno de estos.

#### Paso 3 — Detalles por tipo de dato (si Play Console los pide)

**Interacciones en la app (PostHog):**
- Propósito: Estadísticas (analytics anónimas de uso)
- ¿Es efímero (no almacenado)?: No
- ¿Es requerido o puede desactivarse?: Requerido para el funcionamiento
- ¿Tratado de acuerdo a la política de eliminación?: Sí

**Datos de fallos (Sentry):**
- Propósito: Prevención del fraude, seguridad y cumplimiento normativo → **Análisis** (diagnóstico)
- ¿Es efímero?: No
- ¿Es requerido?: Sí (no hay opción de desactivarlo en la app)

#### Paso 4 — Enlace a la política de privacidad

Verificar que la URL de privacidad registrada en Play Console sea accesible y esté actualizada:
```
https://enarhos.github.io/appComparaFarma/privacy-policy.html
```

Si el repo ya fue transferido a otra cuenta GitHub, actualizar la URL de arriba al nuevo owner de GitHub Pages.

#### Paso 5 — Guardar y enviar

Hacer clic en "Guardar" → esperar validación → el estado debe cambiar de ⚠️ a ✅ en el dashboard de Play Console.

### Archivos afectados

No hay cambios de código. Solo configuración en Play Console (web).

### Cómo validar

1. Play Console → Contenido de la aplicación → Seguridad de los datos → estado: ✅ "Completado"
2. Play Console → Panel principal → no debe aparecer el aviso de Data Safety incompleto
3. Play Console → Producción → botón "Publicar" disponible (no griseado por este motivo)

### Responsable

**Mario** — requiere acceso de Administrador a la cuenta de Google Play Console donde está registrada la app `mla.app.comparafarma`.

### Evidencia esperada

Captura de pantalla de Play Console → Contenido de la aplicación → Seguridad de los datos con estado verde ✅ y todos los campos completados.

---

## B-2 — API_SECRET_KEY en Vercel

### Descripción

El middleware de autenticación del backend (`api/src/middleware/auth.ts:5`) tiene el siguiente comportamiento:

```typescript
export function isAuthorized(req: RequestLike): boolean {
  const expected = process.env.API_SECRET_KEY?.trim();
  if (!expected) return true;   // ← permite TODOS los requests si la var no existe
  // ...
}
```

Si `API_SECRET_KEY` no está configurada en el entorno de Vercel, la API es **pública sin autenticación**: cualquier cliente puede hacer búsquedas sin restricción, exponiendo los scrapers a abuso y generando costos en Upstash Redis.

### Riesgo

🔴 **Seguridad crítica.** Si la variable no está configurada en producción, la API no tiene protección.  
El riesgo no es que alguien pueda ver precios (eso es público), sino que pueden saturar el backend con miles de requests, agotando la cuota de Upstash (400K commands/día en free tier) y causando denegación de servicio para usuarios reales.

### Pasos exactos para resolver

**Consola:** [vercel.com/dashboard](https://vercel.com/dashboard) → proyecto `comparafarma-api` → Settings → Environment Variables

#### Paso 1 — Verificar si ya existe la variable

Navegar a: Settings → Environment Variables → buscar `API_SECRET_KEY`

- **Si ya existe** con un valor no vacío: bloqueante resuelto. Documentar como cerrado.
- **Si no existe o está vacía:** continuar con el paso 2.

#### Paso 2 — Crear la variable (si no existe)

1. Hacer clic en "Add New" (o "Add Variable").
2. Configurar:
   - **Name:** `API_SECRET_KEY`
   - **Value:** generar una cadena aleatoria de 32+ caracteres. Ejemplo de generación:
     ```bash
     # En cualquier terminal:
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - **Environments:** marcar **Production** y **Preview** (no Development, para que el dev local funcione sin key).
3. Guardar.

#### Paso 3 — Actualizar la variable en la app móvil

La app móvil envía la API key en el header `x-api-key` si `EXPO_PUBLIC_API_KEY` está configurada. Actualizar en EAS Secrets:

```bash
# Desde mobile/ o la raíz del repo:
eas secret:create --scope project --name EXPO_PUBLIC_API_KEY --value "<misma-key-que-Vercel>"
# Si ya existe:
eas secret:set EXPO_PUBLIC_API_KEY "<misma-key-que-Vercel>"
```

Y actualizar `mobile/.env.local` para desarrollo local:
```
EXPO_PUBLIC_API_KEY=<misma-key-que-Vercel>
```

> **Nota:** `EXPO_PUBLIC_API_KEY` es visible en el bundle de la app (es una variable pública de Expo), lo cual es inherente en apps móviles. La protección real es que la clave sea difícil de adivinar, no que esté oculta.

#### Paso 4 — Forzar redeploy

Vercel no hace redeploy automático al agregar variables. Opciones:
- **A (sin código nuevo):** Vercel Dashboard → Deployments → último deployment → "Redeploy" (botón ⋯)
- **B (recomendado):** hacer un push vacío o un commit trivial a `main` para triggear el CI/CD normal.

### Archivos afectados

No hay cambios de código. Solo configuración en Vercel Dashboard y EAS Secrets.

### Cómo validar

```bash
# 1. Verificar que sin key devuelve 401:
curl -s "https://comparafarma-api.vercel.app/api/search?q=paracetamol" | jq '.error'
# Esperado: "No autorizado."

# 2. Verificar que con key funciona:
curl -s "https://comparafarma-api.vercel.app/api/search?q=paracetamol" \
  -H "x-api-key: <API_SECRET_KEY>" | jq 'length'
# Esperado: número > 0 (resultados de medicamentos)

# 3. Verificar desde la app (en desarrollo):
# Hacer una búsqueda → debe devolver resultados normalmente
```

### Responsable

**Desarrollador principal** — requiere acceso al proyecto Vercel y a EAS CLI autenticado.

### Evidencia esperada

- Captura de pantalla de Vercel Dashboard → Settings → Environment Variables mostrando `API_SECRET_KEY` con valor configurado (Vercel muestra el valor redactado como `•••••••`).
- Output del `curl` sin key mostrando `{"error":"No autorizado."}`.
- Output del `curl` con key devolviendo resultados de medicamentos.

---

## B-3 — Algolia key hardcodeada → mover a Vercel env vars

### Descripción

El cliente de Salcobrand (`api/src/clients/salcobrand.ts` líneas 4–5) tiene las credenciales de Algolia hardcodeadas como fallback:

```typescript
const APP_ID = process.env.ALGOLIA_APP_ID ?? "GM3RP06HJG";
const API_KEY = process.env.ALGOLIA_API_KEY ?? "0259fe250b3be4b1326eb85e47aa7d81";
```

Aunque son claves de solo lectura de Salcobrand (no propias), tenerlas en el repositorio público viola el principio de no exponer credenciales en el código. Si Salcobrand rota sus claves, el proyecto deja de funcionar y el valor incorrecto queda fosilizado en el historial de git.

### Riesgo

🔴 **Seguridad + mantenimiento.** La key `0259fe250b3be4b1326eb85e47aa7d81` ya está en el historial de git público (si el repo es público) o visible para cualquier colaborador. Salcobrand podría bloquear IPs o keys si detecta abuso.

### Pasos exactos para resolver

#### Paso 1 — Configurar las variables en Vercel

**Consola:** Vercel Dashboard → proyecto `comparafarma-api` → Settings → Environment Variables

Agregar:

| Name | Value | Environments |
|------|-------|-------------|
| `ALGOLIA_APP_ID` | `GM3RP06HJG` | Production, Preview |
| `ALGOLIA_API_KEY` | `0259fe250b3be4b1326eb85e47aa7d81` | Production, Preview |

> Los valores actuales son los mismos que están hardcodeados — esto no cambia el comportamiento en producción, solo mueve las credenciales fuera del código.

#### Paso 2 — Modificar el código para eliminar los fallbacks

**Archivo:** `api/src/clients/salcobrand.ts` — cambio mínimo en líneas 4–5.

Código actual:
```typescript
const APP_ID = process.env.ALGOLIA_APP_ID ?? "GM3RP06HJG";
const API_KEY = process.env.ALGOLIA_API_KEY ?? "0259fe250b3be4b1326eb85e47aa7d81";
```

Código propuesto:
```typescript
const APP_ID = process.env.ALGOLIA_APP_ID ?? "";
const API_KEY = process.env.ALGOLIA_API_KEY ?? "";
```

> **Alternativa más robusta** (falla rápido si la variable no está):
> ```typescript
> const APP_ID = process.env.ALGOLIA_APP_ID;
> const API_KEY = process.env.ALGOLIA_API_KEY;
> if (!APP_ID || !API_KEY) throw new Error("Algolia env vars not configured");
> ```
> Esta variante es preferible porque hace explícito el problema de configuración en lugar de fallar silenciosamente con strings vacías.

#### Paso 3 — Actualizar api/.env.example

`api/.env.example` ya tiene los placeholders comentados (líneas 8–10), solo hay que confirmar que están sin valores:

```
# Algolia — Salcobrand search index (GM3RP06HJG / sb_variant_production)
ALGOLIA_APP_ID=
ALGOLIA_API_KEY=
```

Los valores reales deben estar solo en Vercel Dashboard y en `.env.local` del desarrollador (no commiteados).

#### Paso 4 — Actualizar .env.local de desarrollo

Para que el backend local siga funcionando, actualizar `api/.env` (o `api/.env.local`) con los valores reales:
```
ALGOLIA_APP_ID=GM3RP06HJG
ALGOLIA_API_KEY=0259fe250b3be4b1326eb85e47aa7d81
```

#### Paso 5 — Commit y deploy

```bash
# Hacer el cambio en salcobrand.ts (líneas 4-5)
# Commitear:
git add api/src/clients/salcobrand.ts
git commit -m "fix: mover credenciales Algolia a env vars, eliminar fallback hardcodeado"
# El push a main triggerá CI → deploy automático a Vercel
git push origin main
```

#### Paso 6 — Verificar en producción

Una vez deployado, verificar que Salcobrand sigue funcionando con las variables de entorno.

### Archivos afectados

| Archivo | Tipo de cambio | Líneas |
|---------|---------------|--------|
| `api/src/clients/salcobrand.ts` | Modificar: eliminar fallback hardcodeado | 4–5 |
| `api/.env.example` | Verificar: confirmar placeholders sin valores | 8–10 |
| Vercel Dashboard | Configurar: agregar 2 env vars | — |

### Cómo validar

```bash
# 1. Verificar que el deploy incluyó el cambio:
gh run list --workflow=ci.yml --branch=main --limit=1
# Esperar status: completed (success)

# 2. Verificar que Salcobrand sigue devolviendo resultados:
curl -s "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1" \
  -H "x-api-key: <API_SECRET_KEY>" \
  | jq '.diagnostics[] | select(.pharmacySlug=="salcobrand") | {status, resultsCount}'
# Esperado: {"status": "ok", "resultsCount": <número > 0>}

# 3. Verificar que el código fuente ya no contiene el fallback:
grep -n "GM3RP06HJG\|0259fe250b3be4b1326eb85e47aa7d81" api/src/clients/salcobrand.ts
# Esperado: sin output (vacío)
```

### Responsable

**Desarrollador principal** — requiere acceso al código y al Vercel Dashboard.

### Evidencia esperada

- Captura de Vercel → Environment Variables con `ALGOLIA_APP_ID` y `ALGOLIA_API_KEY` configuradas.
- Output del `grep` anterior devolviendo vacío (credenciales eliminadas del código).
- Output del `curl` mostrando resultados de Salcobrand con `status: "ok"`.
- CI GitHub Actions en verde (typecheck + api-tests + deploy).

---

## B-4 — Target SDK ≥ 34 en el AAB ✅ Resuelto

### Descripción

El bloqueante requería verificar que el AAB generado tuviera `targetSdkVersion ≥ 34` (Android 14), requisito de Google Play desde agosto 2024.

### Hallazgo

**Verificado el 2026-06-30** en el manifiesto del build de release existente:

```
Archivo: mobile/android/app/build/intermediates/merged_manifests/release/
         processReleaseManifest/AndroidManifest.xml

Contenido relevante:
  <uses-sdk
      android:minSdkVersion="24"
      android:targetSdkVersion="36" />
```

`targetSdkVersion = 36` (Android 16) — supera el mínimo requerido de 34 con holgura.

El valor es configurado automáticamente por el plugin `expo-root-project` de Expo SDK 54 en combinación con React Native 0.81.5. No requiere ningún cambio manual.

### Acción requerida

**Ninguna.** Este bloqueante está cerrado.

### Cómo validar (para el próximo build)

Si se genera un nuevo AAB en el futuro, confirmar con:

```bash
# Opción A — Desde el manifiesto del build local (más rápido):
grep -A3 "uses-sdk" \
  mobile/android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml
# Esperado: android:targetSdkVersion="34" o superior

# Opción B — Desde el AAB generado (requiere build-tools de Android Studio):
# aapt2 no acepta AAB directamente; usar bundletool o Play Console
# En Play Console → Android App Bundles → seleccionar bundle → "Bundle explorer"
# → la sección "Manifest" muestra el targetSdkVersion
```

### Responsable

No aplica — cerrado.

### Evidencia esperada

El manifiesto del build de release ya verifica `targetSdkVersion="36"`. Adicionalmente, Play Console → bundle analysis muestra el mismo valor cuando se sube el AAB.

---

## Resumen de cierre

Una vez completados B-1, B-2 y B-3, ejecutar la siguiente checklist antes de promover a Producción:

```
□ B-1: Play Console → Contenido de la app → Seguridad de los datos → ✅ Completado
□ B-2: Vercel → API_SECRET_KEY configurada + curl sin key devuelve 401
□ B-2: App móvil → EXPO_PUBLIC_API_KEY en EAS Secrets + búsquedas funcionan
□ B-3: Vercel → ALGOLIA_APP_ID y ALGOLIA_API_KEY configuradas
□ B-3: grep en salcobrand.ts no devuelve credenciales hardcodeadas
□ B-3: CI verde (domain-tests + api-tests + deploy)
□ B-3: curl /api/search con debug=1 → Salcobrand status "ok"
□ B-4: ✅ Ya verificado (targetSdkVersion=36)
```

**Después de cerrar estos 4 ítems:** promover el versionCode 30 (v1.4.0) a Producción en Play Console.

---

*Documento generado el 2026-06-30 por revisión estática del código fuente y configuración del proyecto.*
