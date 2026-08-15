# EPIC-01 — Identity Foundation: Plan Técnico de Implementación

**Sprint:** SPRINT-001
**Tipo:** Plan técnico de implementación (no arquitectura, no código, no diseño de dominio)
**Fecha de corte:** 2026-08-06
**Alcance:** responder exactamente qué debe construirse para que el Cliente Mobile pueda autenticarse usando el mismo sistema de Identidad que ya usa el Cliente Web (Feature 1.1 a 1.5 de la Épica 1, `docs/project/PLATFORM_CONVERGENCE_MASTER_PLAN.md`). No se escribió ni modificó código, no se crearon migraciones, no se tocó Supabase.
**Línea base (no redefinida):** `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, `docs/domain/USER_DOMAIN_MODEL.md`, `docs/architecture/IDENTITY_INTEGRATION_PLAN.md`, `docs/architecture/PLATFORM_CAPABILITY_MODEL.md`, `docs/project/PLATFORM_CONVERGENCE_MASTER_PLAN.md`.
**Método:** lectura directa del código real de `web/` (autenticación), `mobile/` (estructura), y `api/`/Supabase (Servicios de Plataforma) — únicamente en lo relacionado con Identidad. No se volvió a inspeccionar el resto del repositorio.

---

## Objetivo técnico

**¿Qué debemos construir para que el Cliente Mobile pueda autenticarse utilizando exactamente el mismo sistema de Identidad que ya utiliza el Cliente Web?**

Respuesta corta, desarrollada en el resto del documento: los Servicios de Plataforma (`api/` + Supabase) **no requieren ningún cambio** — la verificación de sesión ya es agnóstica de cliente (funciona por header `Authorization: Bearer <jwt>`, no por cookies). Todo el trabajo de esta Épica es construir, del lado del Cliente Mobile, el equivalente funcional de lo que el Cliente Web ya tiene, adaptado a las herramientas nativas de Expo/React Native en lugar de las de Next.js.

---

## Inventario — Cliente Web

| Elemento | Archivo | Detalle relevante |
|---|---|---|
| Login (UI + lógica) | `web/src/components/LoginForm.tsx` | `supabase.auth.signInWithPassword({ email, password })`; también soporta `signInWithOAuth({ provider: "google" })` solo para `/admin`. Props genéricas (`title`, `successRedirect`, `errorMessages`, `showGoogleOAuth`, `footer`) pero acoplado a `next/navigation` (`useRouter`, `useSearchParams`) y a `Suspense` de React por ese motivo. |
| Registro | `web/src/app/cuenta/registro/page.tsx` | `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`. Maneja dos casos: sesión inmediata (confirmación de email desactivada) o pantalla "revisa tu email". `emailRedirectTo` apunta a una URL http de la propia web. |
| Recuperación de contraseña | — | **No existe.** Confirmado por búsqueda exhaustiva (`resetPasswordForEmail`, `updateUser`, "olvid", "forgot") — cero resultados en `web/src`. No es parte del alcance de esta Épica (Fase 1A de `IDENTITY_INTEGRATION_PLAN.md` solo definió login/registro/logout/sesión). |
| Persistencia de sesión / refresh | `web/src/lib/supabase/client.ts`, `server.ts`, `web/src/proxy.ts` | Paquete `@supabase/ssr` (`^0.12.3`). El refresco ocurre implícitamente dentro de `supabase.auth.getUser()` llamado en `proxy.ts` (middleware), que reescribe las cookies de sesión en cada request. No hay `refreshSession()` explícito. |
| Logout | `web/src/components/SignOutButton.tsx` | `supabase.auth.signOut()` + `router.push(redirectTo)` + `router.refresh()`. Prop único `redirectTo`. Acoplado a `next/navigation`. |
| Middleware / rutas protegidas | `web/src/proxy.ts` | `config.matcher: ["/admin/:path*", "/cuenta/:path*"]`. Exige sesión para `/cuenta/*`; exige sesión + allowlist de email para `/admin/*`. |
| Providers / contexto | — | **No existe.** Cero `React.createContext`/`Provider` de auth en todo `web/src`. Cada componente llama a Supabase directo. |
| Hooks | — | **No existe** ningún hook custom de auth (`useUser`, `useAuth`, etc.). |
| Stores | — | **No existe** ningún store de sesión (no hay Zustand en `web/`). |
| Perfil | `web/src/lib/profile.ts` | `getCurrentProfile()` lee `profiles.email` (respetando RLS) y resuelve `plan` llamando a `GET {API_URL}/api/subscriptions?action=me` con el `access_token` de `supabase.auth.getSession()` en el header `Authorization`. |
| Dependencias | `web/package.json` | `@supabase/ssr@^0.12.3`, `@supabase/supabase-js@^2.110.7`. |

**Conclusión:** ningún componente de Web es reutilizable tal cual en Mobile — todos están acoplados a Next.js (`next/navigation`, `next/headers`, cookies vía `@supabase/ssr`). Lo reutilizable es exclusivamente la **lógica de negocio** (qué método del SDK llamar, qué hacer con el resultado), no el código en sí.

---

## Inventario — Cliente Mobile

| Elemento | Estado hoy | Detalle relevante |
|---|---|---|
| Infraestructura de auth | **No existe** | Cero referencias a "supabase" en todo `mobile/` (código y `package.json`). |
| Layout raíz / inicialización | `mobile/src/app/_layout.tsx` | Único `useEffect` que hoy dispara `fetchConfig()` (configStore) y `loadAlerts()` (alertsStore) en paralelo, sin bloquear el render. `Sentry.init()` a nivel de módulo. Sin `SafeAreaProvider` ni ningún otro Provider custom. |
| Navegación | `Stack` de `expo-router` en `_layout.tsx` | 6 pantallas (`index`, `results`, `medication`, `cart`, `about`, `onboarding`), sin grupos ni rutas anidadas. |
| Patrón de gate condicional (precedente directo) | `mobile/src/app/index.tsx` + `onboarding.tsx` | `AsyncStorage.getItem(ONBOARDING_KEY)` → si falta, `router.replace("/onboarding")`; si existe, `setReady(true)`; `if (!ready) return null` mientras se resuelve. Es la plantilla exacta a extender para el chequeo de sesión. |
| Providers / contexto | — | **No existe** ningún `React.createContext` custom. Sería el primero de la app. |
| Stores (Zustand) | `mobile/src/store/*.ts` (9 stores) | Dos patrones ya en uso: (a) `persist` + `createJSONStorage(AsyncStorage)` automático (`cartStore.ts`, `favoritesStore.ts`, `historyStore.ts`, `locationStore.ts`); (b) carga/guardado manual con `AsyncStorage.getItem/setItem` propio, expuesto como `load()` invocado explícitamente desde `_layout.tsx` (`alertsStore.ts`). El patrón (b) es el más apto para sesión, por requerir lógica de red/refresh, no solo serialización. |
| AsyncStorage | `mobile/package.json` | `@react-native-async-storage/async-storage@2.2.0`. Sin wrapper genérico, pero `mobile/src/lib/cache.ts` es precedente de "capa de utilidad sobre AsyncStorage". |
| Splash screen | `mobile/app.json` + `mobile/src` | Configuración declarativa legacy en `app.json` (`splash.image`); `expo-splash-screen` está **instalado pero sin ningún uso en código** — cero llamadas a `preventAutoHideAsync()`/`hideAsync()`. Gap real: hoy no hay ningún control explícito del splash. |
| Onboarding | `mobile/src/app/onboarding.tsx` | Ver "patrón de gate condicional" arriba — corre una sola vez en la vida de la instalación, a diferencia de sesión, que debe resolverse en **cada** arranque. |
| Dependencias relevantes | `mobile/package.json` | `expo@~54.0.34`, `expo-router@~6.0.23`, `zustand@^5.0.0`, `@sentry/react-native@~7.2.0`, `posthog-react-native@^4.47.0`. **No** existe `@supabase/supabase-js` ni `expo-secure-store`. |
| Inicialización de SDKs de terceros (precedente) | `mobile/src/lib/analytics.ts` (PostHog), `_layout.tsx` (Sentry) | Ambos se inicializan a nivel de módulo, exportando una instancia singleton. `analytics.ts` es el patrón más apto para el cliente Supabase (importable desde múltiples stores/pantallas). |
| Variables de entorno | `mobile/.env.local.example` | Solo 3 variables: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`. Ninguna de Supabase. |

**Conclusión:** Mobile no tiene absolutamente ninguna infraestructura de auth, pero sí tiene dos patrones reutilizables por analogía: el gate de navegación condicional (onboarding) y el store con carga manual (`alertsStore`).

---

## Inventario — Servicios de Plataforma

| Elemento | Archivo | Detalle relevante |
|---|---|---|
| Verificación de JWT | `api/src/routes/subscriptions.ts`, función `resolveUser()` | Lee `Authorization: Bearer <jwt>` del header (vía `getHeader()` de `api/src/lib/http.ts`) y llama `supabase.auth.getUser(token)`. **No depende de cookies en absoluto.** |
| Cliente Supabase en `api/` | `api/src/lib/supabaseClient.ts` | `createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)` — cliente único, secret key, sin manejo de sesión de usuario (solo para operaciones server-to-server). Usado también para verificar JWTs de usuarios (`getUser(token)` funciona igual con cualquier cliente del proyecto). |
| Endpoints que exigen JWT de usuario | `api/api/subscriptions.ts` → `action=me`, `action=verify-purchase`, `action=start-flow-subscription` | Los tres devuelven 401 si `resolveUser()`/`resolveUserId()` no resuelve un usuario. `action=verify-purchase` tiene un comentario explícito: "reservado para cuando `mobile/` ... pueda enviar el purchaseToken — hoy no hay ningún cliente que la llame". |
| Tabla `profiles` | `docs/database/schema.sql` | `id uuid` (FK `auth.users`), `email`, `plan`. RLS habilitado; única policy real de todo el esquema: `profiles_select_own`. Trigger `handle_new_profile` crea la fila automáticamente al registrarse. |
| RLS en el resto del esquema | `docs/database/schema.sql` | Confirmado: `profiles_select_own` sigue siendo la única policy de todas las tablas — el resto se protege exclusivamente porque `api/` y el admin de `web/` usan la secret key (bypass RLS). |
| Dependencia de cookies | — | **Confirmado que no existe ninguna.** `api/` es un conjunto de funciones serverless puras (sin `@supabase/ssr`, sin `next/headers`). El propio `web/` ya llama a `api/` mandando el JWT por header, no por cookies (`web/src/lib/profile.ts`, `startFlowSubscription.ts`). |
| Paquete Supabase en `api/` | `api/package.json` | Solo `@supabase/supabase-js@^2.110.7` — nada Next-específico. |
| Variables de entorno | `docs/operations/ENVIRONMENT.md` | `web/` usa `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas, obligatorias). `mobile/` hoy no tiene ninguna variable de Supabase — documentado explícitamente que su alcance de variables se limita a `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_API_KEY`. |
| Helper reutilizable no-Next | `api/src/lib/supabaseClient.ts`, `web/src/lib/supabase/admin.ts` | Ambos usan `createClient()` puro de `@supabase/supabase-js`, sin cookies ni SSR — es el patrón más cercano a lo que Mobile necesita (aunque ninguno usa la *anon key* con sesión persistida en cliente, que es lo que Mobile sí necesita). |

**Conclusión crítica:** los Servicios de Plataforma **no requieren ningún cambio**. El mecanismo de verificación (`Authorization: Bearer <jwt>` + `supabase.auth.getUser(token)`) ya es agnóstico de cliente. Mobile puede llamar a `action=me`, `action=verify-purchase` y `action=start-flow-subscription` sin modificar una sola línea de `api/`, simplemente autenticándose contra el mismo proyecto Supabase y enviando su propio `access_token`.

---

## GAP Analysis

| Componente | Existe | Reutilizable | Debe modificarse | Debe crearse |
|---|---|---|---|---|
| Cliente Supabase con sesión persistida (Mobile) | No | — | — | Sí — `@supabase/supabase-js` puro + storage adapter para RN (no `@supabase/ssr`, que es Next-específico) |
| Lógica de login (`signInWithPassword`) | Sí (Web) | Sí, como patrón/llamada al SDK | — | Sí — nueva pantalla/lógica en Mobile, sin poder reutilizar el componente `LoginForm.tsx` (acoplado a `next/navigation`) |
| Lógica de registro (`signUp`) | Sí (Web) | Parcial — la llamada sí; el manejo del `emailRedirectTo` no (Web usa una URL http, Mobile necesita un deep link) | — | Sí — nueva pantalla/lógica en Mobile + configuración de deep link |
| Recuperación de contraseña | No (tampoco en Web) | — | — | No — fuera de alcance de esta Épica (no estaba en Fase 1A) |
| Logout (`signOut`) | Sí (Web) | Sí, como patrón/llamada al SDK | — | Sí — nueva acción en Mobile, sin poder reutilizar `SignOutButton.tsx` |
| Persistencia de sesión / refresh | Sí (Web, vía cookies + `@supabase/ssr`) | No — el mecanismo de cookies no aplica a Mobile | — | Sí — mecanismo nativo del SDK (`autoRefreshToken`, `persistSession`, storage adapter) |
| Middleware / guards de rutas protegidas | Sí (Web, `proxy.ts`) | No — Next-específico, y además no aplica al mismo rol en Mobile (ver nota abajo) | — | No — ver "Nota sobre Route Guards" |
| Providers / contexto de auth | No (ni en Web ni en Mobile) | — | — | Sí, pero como **store de Zustand**, no como Context — para mantener consistencia con el resto de Mobile (ver Task 003) |
| Hooks de auth | No | — | — | Sí — selectores sobre el nuevo store, mismo patrón que los stores existentes |
| Endpoints de `api/` (`action=me`, etc.) | Sí | Sí, 100%, sin cambios | No | No |
| Tabla `profiles` + RLS + trigger | Sí | Sí, sin cambios | No | No |
| Variables de entorno de Supabase en Mobile | No | — | — | Sí — `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mismos valores del proyecto Supabase que ya usa Web) |
| `@supabase/supabase-js` en `mobile/package.json` | No | — | — | Sí (nueva dependencia) |
| Storage adapter seguro para tokens (`expo-secure-store` o equivalente) | No | — | — | Sí (nueva dependencia) |
| Control explícito de Splash Screen | No (instalado, sin uso) | — | — | Sí — necesario porque, a diferencia de onboarding, la resolución de sesión ocurre en cada arranque, no solo el primero |
| Perfil (lectura) en Mobile | No | Parcial — la lógica de `getCurrentProfile()` es reutilizable como patrón, el código no | — | Sí — versión mínima, formalmente parte de la Feature 2.1 (Epic 2), incluida aquí solo como validación de cierre |

**Nota sobre Route Guards:** en Web, `proxy.ts` protege `/cuenta/*` y `/admin/*` porque esas rutas no deben ser accesibles sin sesión. En Mobile, ninguna pantalla debe quedar bloqueada por falta de sesión — el Principio 1 de `USER_DOMAIN_MODEL.md` ("la búsqueda y comparación de precios deben funcionar sin identidad, siempre") y el criterio de éxito de esta Épica (reconocer, no exigir) significan que Mobile no necesita ningún guard que bloquee navegación. Lo único que Mobile necesita es reflejar el estado de sesión en la UI (mostrar u ocultar la opción de "iniciar sesión" vs. "mi cuenta"), no proteger rutas. Por eso esta fila del GAP no genera una Task de construcción — es una decisión de diseño ya resuelta por la arquitectura aprobada, no un pendiente.

---

## Plan técnico — Tareas

**Task 001 — Dependencias y configuración base**
- *Objetivo:* agregar las dependencias y variables de entorno necesarias para que Mobile pueda hablar con Supabase Auth.
- *Archivos:* `mobile/package.json`, `mobile/.env.local.example`, `mobile/.env.local` (no versionado).
- *Dependencias:* ninguna.
- *Criterios de aceptación:* `@supabase/supabase-js` y un storage adapter seguro para React Native están declarados; `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` documentadas en `.env.local.example`, con los mismos valores de proyecto que ya usa Web (mismo proyecto Supabase, nunca uno nuevo).
- *Riesgo:* bajo — el único riesgo real es apuntar por error a un proyecto Supabase distinto al de Web, lo que invalidaría el objetivo central de la Épica.

**Task 002 — Cliente Supabase de Mobile**
- *Objetivo:* instanciar un cliente Supabase en Mobile equivalente en propósito al de Web, con almacenamiento de sesión apto para React Native.
- *Archivos:* nuevo `mobile/src/lib/supabase.ts` (patrón de inicialización de `mobile/src/lib/analytics.ts`).
- *Dependencias:* Task 001.
- *Criterios de aceptación:* usa `@supabase/supabase-js` puro (no `@supabase/ssr`); `auth.storage` apunta al adapter elegido; `autoRefreshToken`/`persistSession` activos; `detectSessionInUrl` desactivado (no aplica a RN).
- *Riesgo:* medio — la elección del storage adapter (AsyncStorage plano vs. almacenamiento cifrado) tiene una implicancia de seguridad real sobre cómo quedan guardados los tokens de sesión.

**Task 003 — Auth Store**
- *Objetivo:* exponer el estado de sesión y las acciones de login/registro/logout, siguiendo el patrón de carga manual ya usado en `alertsStore.ts` (no el de `persist` automático).
- *Archivos:* nuevo `mobile/src/store/authStore.ts`.
- *Dependencias:* Task 002.
- *Criterios de aceptación:* expone `load()`/`init()` para resolver la sesión existente al arrancar; expone `signIn()`, `signUp()`, `signOut()`; se suscribe a `supabase.auth.onAuthStateChange` para mantenerse sincronizado; no duplica como estado propio lo que el SDK ya persiste internamente.
- *Riesgo:* medio — el riesgo de crear una segunda fuente de verdad de sesión (el store cacheando algo que el SDK ya gestiona) que se desincronice con el estado real.

**Task 004 — Integración de la inicialización en el arranque**
- *Objetivo:* resolver el estado de sesión al arrancar la app, en el mismo lugar donde ya se resuelven config y alertas.
- *Archivos:* `mobile/src/app/_layout.tsx`.
- *Dependencias:* Task 003.
- *Criterios de aceptación:* la inicialización se dispara en el mismo `useEffect` ya existente; no bloquea el montaje del `Stack` (mismo comportamiento no bloqueante de `fetchConfig`/`loadAlerts`).
- *Riesgo:* bajo.

**Task 005 — Control explícito de Splash Screen**
- *Objetivo:* evitar el flash de pantalla en blanco mientras se resuelve la sesión, en cada arranque de la app (no solo el primero, como onboarding).
- *Archivos:* `mobile/src/app/_layout.tsx` o `mobile/src/app/index.tsx`, usando `expo-splash-screen` (ya instalado, sin uso).
- *Dependencias:* Task 004.
- *Criterios de aceptación:* `preventAutoHideAsync()` se llama antes de resolver la sesión; `hideAsync()` se llama al terminar; sin retraso perceptible para quien no tiene sesión (el caso más común).
- *Riesgo:* bajo, pero es la única Task sin ningún precedente en el código actual — requiere probarse en dispositivo real.

**Task 006 — Pantalla y flujo de Login**
- *Objetivo:* que una Persona con cuenta pueda iniciar sesión desde el Cliente Mobile.
- *Archivos:* nuevo `mobile/src/app/login.tsx`; modificación de `_layout.tsx` para registrar la ruta.
- *Dependencias:* Task 003.
- *Criterios de aceptación:* llama a `supabase.auth.signInWithPassword()`; en error, mensaje genérico (mismo criterio que Web, nunca expone el mensaje real de Supabase); tras éxito, vuelve a la pantalla de origen; accesible sin bloquear ningún flujo de comparación de precios (Principio 1).
- *Riesgo:* medio — se construye desde cero porque `LoginForm.tsx` no es reutilizable, solo su lógica.

**Task 007 — Pantalla y flujo de Registro**
- *Objetivo:* que una Persona nueva pueda crear una cuenta desde el Cliente Mobile.
- *Archivos:* nuevo `mobile/src/app/registro.tsx`; modificación de `_layout.tsx`.
- *Dependencias:* Task 003.
- *Criterios de aceptación:* llama a `supabase.auth.signUp()` con el mismo manejo de doble caso que Web; si requiere confirmación por email, el enlace debe abrir la app vía el esquema de deep link ya declarado (`comparafarma://`), no una URL http.
- *Riesgo:* alto — es el único punto de toda la Épica sin precedente exacto en el repo; requiere además configurar "Redirect URLs" permitidas en el dashboard de Supabase Auth, fuera de este repositorio.

**Task 008 — Logout**
- *Objetivo:* que una Persona identificada pueda cerrar sesión desde el Cliente Mobile.
- *Archivos:* acción ya cubierta en el Auth Store (Task 003) + punto de UI desde donde invocarla (a definir junto con Task 010, dado que hoy no existe ninguna pantalla de "cuenta" en Mobile).
- *Dependencias:* Task 003.
- *Criterios de aceptación:* llama a `supabase.auth.signOut()`; tras cerrar sesión, Mobile vuelve a su comportamiento 100% anónimo sin ningún cambio respecto a hoy.
- *Riesgo:* bajo.

**Task 009 — Validación de persistencia de sesión y refresh automático**
- *Objetivo:* confirmar que una sesión sobrevive a cerrar y reabrir la app, y que el token se refresca automáticamente, igual que en Web.
- *Archivos:* ninguno nuevo — validación sobre Tasks 002-004.
- *Dependencias:* Task 004.
- *Criterios de aceptación:* cerrar y reabrir la app mantiene la sesión; un token que expira se renueva sin que la Persona lo note.
- *Riesgo:* medio — es la validación del supuesto más importante de toda la Épica, y el más fácil de asumir sin probar explícitamente en dispositivo real.

**Task 010 — Perfil inicial accesible desde Mobile**
- *Objetivo:* exponer, de forma mínima, que una Persona identificada puede ver su Perfil desde Mobile — primer punto de valor visible de la Épica, y validación de cierre.
- *Archivos:* nuevo `mobile/src/lib/profile.ts` (equivalente adaptado de `web/src/lib/profile.ts`); punto de UI mínimo.
- *Dependencias:* Task 003, Task 006.
- *Criterios de aceptación:* lee `profiles.email` y resuelve `plan` exactamente igual que Web (`GET /api/subscriptions?action=me`, sin cambios en `api/`, ya confirmado que no los requiere).
- *Riesgo:* bajo. *Nota:* esta Task pertenece formalmente a la Feature 2.1 (Epic 2 del Master Plan); se incluye aquí solo como validación mínima de cierre de Epic 1, no reemplaza el trabajo completo de Epic 2.

**Task 011 — Validación de reconocimiento cross-cliente**
- *Objetivo:* confirmar formalmente que una misma Persona, autenticada con la misma cuenta desde Mobile y desde Web, es reconocida como la misma Identidad en ambos — el criterio de éxito explícito de esta Épica (Feature 1.5 del Master Plan).
- *Archivos:* ninguno — es una validación, no una construcción.
- *Dependencias:* Tasks 001-009 completas.
- *Criterios de aceptación:* iniciar sesión con la misma cuenta en Mobile y Web, en cualquier orden, y confirmar que corresponde al mismo `id` de `auth.users`/`profiles` en ambos.
- *Riesgo:* bajo — el riesgo real ya está cubierto por las Tasks anteriores; esta solo lo confirma.

---

## Riesgos técnicos (de ejecución, no repetidos de otros documentos)

1. **Elección del storage adapter de tokens.** AsyncStorage plano vs. `expo-secure-store` (o equivalente) tiene una implicancia de seguridad real, no solo de conveniencia — decidirlo mal expone los tokens de sesión sin cifrar en el dispositivo.
2. **Configuración de Redirect URLs en el dashboard de Supabase Auth.** El deep link de confirmación de email (Task 007) requiere una configuración fuera de este repositorio; si no se actualiza, el flujo de confirmación falla silenciosamente en producción.
3. **Doble fuente de verdad de sesión.** Si el Auth Store cachea manualmente algo que el SDK de Supabase ya gestiona internamente (Task 003), ambos pueden desincronizarse.
4. **Regresión visual por el nuevo control de Splash Screen.** Es la primera vez que el código controla explícitamente el splash (Task 005) — introducirlo mal puede generar un flash o demora perceptible en cada arranque, no solo en el flujo nuevo.
5. **Expo Go vs. Development Build.** Algunos storage adapters nativos no funcionan en Expo Go — debe confirmarse que el equipo usa development build (ya es la recomendación vigente del proyecto) antes de iniciar Task 001.
6. **Desalineación de versión de `@supabase/supabase-js` entre workspaces del monorepo.** `api/` y `web/` ya usan `^2.110.7` — instalar una versión distinta en `mobile/` podría producir comportamientos sutilmente distintos entre clientes frente al mismo backend Supabase.
7. **Código listo pero no ejecutable en producción por la restricción de Prueba Cerrada.** Todas estas Tasks pueden completarse en una rama, pero no pueden mergearse/publicarse hasta que se resuelva la Pregunta Pendiente ya nombrada como Epic 0.6 en el Master Plan — con el riesgo adicional de que el trabajo quede desactualizado (versiones de Expo SDK, del SDK de Supabase) durante la espera.

---

## Definition of Done — Identity Foundation

La Épica 1 (Identity Foundation) se considera completamente implementada cuando:

- Las Tasks 001 a 011 están completas, cada una con sus criterios de aceptación cumplidos.
- La Feature 1.5 del Master Plan (validación de reconocimiento cross-cliente) tiene evidencia verificable, no solo declarada.
- Ninguna funcionalidad anónima existente en Mobile hoy (búsqueda, comparación, favoritos/alertas/historial/carrito locales) sufrió ninguna regresión.
- No se requirió ningún cambio en `api/`, en el esquema de Supabase, ni en ninguna policy de RLS — toda la Épica se construyó exclusivamente sobre lo que los Servicios de Plataforma ya exponían.
- El trabajo está mergeado a `main` únicamente si la restricción de Prueba Cerrada ya fue levantada (Epic 0.6 del Master Plan); si no, el trabajo queda completo y documentado como tal en una rama, explícitamente no mergeado, sin que eso se confunda con "Épica no terminada" a nivel de diseño/código.

---

## Validación final

### Documentos utilizados
- `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`
- `docs/domain/USER_DOMAIN_MODEL.md`
- `docs/architecture/IDENTITY_INTEGRATION_PLAN.md`
- `docs/architecture/PLATFORM_CAPABILITY_MODEL.md`
- `docs/project/PLATFORM_CONVERGENCE_MASTER_PLAN.md`

### Código revisado
- **Cliente Web:** `web/src/components/LoginForm.tsx`, `web/src/app/cuenta/registro/page.tsx`, `web/src/app/cuenta/ingresar/page.tsx`, `web/src/app/admin/login/page.tsx`, `web/src/components/SignOutButton.tsx`, `web/src/proxy.ts`, `web/src/app/auth/callback/route.ts`, `web/src/lib/supabase/client.ts`, `web/src/lib/supabase/server.ts`, `web/src/lib/supabase/admin.ts`, `web/src/lib/profile.ts`, `web/package.json`.
- **Cliente Mobile:** `mobile/src/app/_layout.tsx`, `mobile/src/app/index.tsx`, `mobile/src/app/onboarding.tsx`, `mobile/src/store/*.ts` (9 stores), `mobile/src/lib/cache.ts`, `mobile/src/lib/analytics.ts`, `mobile/app.json`, `mobile/package.json`, `mobile/.env.local.example`.
- **Servicios de Plataforma:** `api/src/routes/subscriptions.ts`, `api/src/lib/supabaseClient.ts`, `api/src/lib/subscriptionsDb.ts`, `api/package.json`, `docs/database/schema.sql`, `docs/operations/ENVIRONMENT.md`.

### Documento creado
`docs/execution/EPIC-01-IDENTITY_FOUNDATION.md` (este documento).

### Próximo paso

Una vez aprobado este documento, el siguiente sprint comenzará directamente con la implementación del código de la **Task 001**. No se tomó ninguna decisión de arquitectura ni de dominio en este documento — todo se derivó de lo ya aprobado y de la lectura directa del código real relacionado con Identidad.

Este documento queda a la espera de aprobación explícita antes de escribir una sola línea de código.
