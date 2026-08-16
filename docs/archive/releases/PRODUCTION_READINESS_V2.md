# Production Readiness V2 — ComparaFarma Mobile (Google Play)

**Rol:** Release Manager / Product Auditor.
**Fecha de corte:** 2026-08-04 (fecha del sistema en el momento de este análisis).
**Alcance:** evaluación objetiva del estado actual de `mobile/` de cara a la publicación en Producción en Google Play. No se desarrolló ninguna funcionalidad nueva. No se modificó ningún archivo de código.
**Método:** lectura directa de código (`mobile/`, y `api/`/`web/` donde es relevante para lo que consume mobile), configuración (`app.json`, `eas.json`, `build.gradle`, `AndroidManifest.xml` fusionado, `package.json`), estado de git, y documentación existente de release (`docs/release/*`, `docs/actas/*`, `CLAUDE.md`). Todo dato marcado como **incierto** representa un límite real de lo verificable desde el repositorio, no una suposición.
**Relación con `docs/release/RELEASE_READINESS_V1.md`:** este documento es una nueva evaluación independiente, no una edición de la V1. Donde ambos coinciden se indica; donde difieren (por avance del código desde el 2026-06-30), se señala explícitamente.

---

## 1. Estado General

| Campo | Valor | Evidencia |
|---|---|---|
| Versión (versionName / `app.json` `version`) | **1.4.0** | `mobile/app.json:6` |
| versionCode (Android) | **31** | `mobile/app.json:34` |
| buildNumber (iOS) | **"30"** | `mobile/app.json:15` — **desalineado con el versionCode de Android (31)**; dato de proceso, no de seguridad |
| Rama actual (checkout local) | `web/stabilization-quality-pass` | `git branch --show-current` |
| Commit HEAD (rama actual) | `fb33cf3f4512029b0dae23d2e4ecf1607e509bd6` — 2026-08-03 22:17:01 -0400 — "docs: corregir estado de RFC-005 a Implementado (post-merge PR #36)" | `git log -1` |
| Commit HEAD (`origin/main`) | `505a0748e5a43e2be5822e3a2d33cf41b4ccf9b9` — 2026-08-03 22:15:39 -0400 — "Merge pull request #36 from Enarhos/web/stabilization-quality-pass" | `git log origin/main -1` |
| Relación entre ambos commits | `fb33cf3` **no es ancestro** de `origin/main` — es un commit solo-documentación (fix de estado de un doc) que quedó en la rama local, no mergeado a `main` todavía | `git merge-base --is-ancestor` |
| `mobile/` entre la rama actual y `main` | **Idéntico** — `git diff main -- mobile/` no produce ninguna salida | `git diff` |
| Estado del working tree | `docs/product/DECISION_LOG.md` modificado (edición de esta misma sesión); `docs/actas/20260803.md`, `docs.zip`, `_CLAUDE_TMP_BORRAR/` sin trackear | `git status --porcelain -b` |
| Expo SDK | `~54.0.34` | `mobile/package.json` |
| React Native | `0.81.5` | `mobile/package.json` |
| Package Android | `mla.app.comparafarma` | `mobile/app.json:36` |
| Bundle ID iOS | `mla.app.comparafarma` | `mobile/app.json:14` |

**Conclusión de esta sección:** el código de `mobile/` que se evaluaría para producción es idéntico entre la rama actual y `main` — no hay trabajo sin mergear que afecte al build. El único desalineamiento verificable es `versionCode` (31) vs. `buildNumber` de iOS (30), que no afecta la publicación en Google Play específicamente.

---

## 2. Funcionalidades

Alcance: funcionalidades que forman parte del código de `mobile/` (lo que efectivamente se empaqueta en el AAB/IPA). Las funcionalidades que existen solo en `web/`/`api/` (cuenta de usuario, "mi receta", panel admin) se señalan aparte porque no aplican a este release.

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Búsqueda multi-farmacia (9 farmacias) | **Implementada** | `mobile/src/lib/search.ts`, `mobile/src/hooks/useSearch.ts` |
| Comparación de precios / canales | **Implementada** | `@comparafarma/domain` vía `search.ts` |
| Filtro por farmacia y ordenamiento | **Implementada** | `mobile/src/store/filterStore.ts`, `FilterSheet.tsx` |
| Filtro geográfico por comuna (datos MINSAL) | **Implementada** | `mobile/src/store/locationStore.ts`, `CommuneSelector.tsx`, `mobile/src/lib/branches.ts` |
| Favoritos | **Implementada** | `mobile/src/store/favoritesStore.ts` |
| Historial de búsquedas | **Implementada** | `mobile/src/store/historyStore.ts` |
| Historial de precios (gráfico) | **Implementada**, con una precisión: usa snapshots locales en `AsyncStorage` (`mobile/src/lib/priceHistory.ts`), un mecanismo de datos distinto al histórico servido por `api/`/`web/` (tabla Supabase) | `mobile/src/lib/priceHistory.ts`, `PriceHistoryChart.tsx` |
| Alertas de precio | **Implementada**, in-app únicamente — sin backend ni notificación push; se evalúan solo cuando el usuario vuelve a buscar el mismo medicamento | `mobile/src/store/alertsStore.ts`, chequeo en `useSearch.ts:64-77` |
| Carrito comparativo (máx. 8 medicamentos) | **Implementada** | `mobile/src/store/cartStore.ts`, `mobile/src/app/cart.tsx` |
| Onboarding (modo normal + modo ayuda) | **Implementada** | `mobile/src/app/onboarding.tsx` |
| Modo oscuro | **Implementada** | NativeWind `dark:` variants (confirmado en `CLAUDE.md`, no re-verificado archivo por archivo en esta sesión) |
| Compartir precio | **Implementada** | Botón en detalle de medicamento (confirmado por `CLAUDE.md`; no re-verificado línea por línea en esta sesión) |
| Banner de donación (Khipu) | **Implementada** — abre navegador externo, **no es un pago in-app** | `mobile/src/components/DonationBanner.tsx:50,60` |
| Analytics de producto | **Parcial** — un solo evento instrumentado (`medication_search`), sin `identify()` ni tracking de pantallas (detalle completo en sección 7) | `mobile/src/lib/analytics.ts` |
| Error tracking (Sentry) | **Implementada**, condicional — solo activo si `EXPO_PUBLIC_SENTRY_DSN` está configurada; `enabled: !__DEV__` | `mobile/src/app/_layout.tsx:11-16` |
| Skeleton loading | **Implementada** | `SkeletonCard.tsx` (confirmado por `CLAUDE.md`) |
| Config remota de farmacias / banner (feature flags) | **Parcial** — `api/` expone `/api/config` y mobile lo consume al abrir la app, pero **no lo refetchea en runtime** (limitación ya documentada como `v15-16` en `BACKLOG_PRODUCT.md`) — si se togglea una farmacia desde `/admin/config`, los usuarios con la app ya abierta no lo ven hasta reabrir | `mobile/src/store/configStore.ts` |
| Deep links | **Parcial** — `scheme: "comparafarma"` declarado en `app.json`, pero sin manejo de enlaces entrantes (`Linking.createURL`/`useURL` no se usan) ni Android App Links (`intentFilters`/`autoVerify`) configurados. Solo hay uso **saliente** de `Linking.openURL` (Khipu, sitios de farmacia) | `mobile/app.json`, grep de `Linking`/`intentFilters` en `mobile/` |
| Suscripciones / Premium (mobile) | **No implementada** — cero referencias a "premium", "plan", "subscription" o "entitlement" en `mobile/src`; mobile no llama a `/api/subscriptions` en ningún archivo | ver sección 8 (evidencia completa) |
| Billing / compras in-app | **No implementada** — sin `react-native-iap` ni librería equivalente en `package.json`, sin UI de compra | `mobile/package.json`, grep en `mobile/src` |
| Push notifications | **No implementada** — sin `expo-notifications` ni librería equivalente | grep en `mobile/`, `mobile/package.json` |
| Bioequivalentes con fuente regulatoria confiable | **No implementada** — el campo `isBioequivalent` existe en el modelo de datos pero es heterogéneo entre farmacias (documentado en `docs/architecture/DOMAIN_MODEL.md` §1); spike de datos cerrado sin integración de fuente ISP en el código de producción | `docs/product/BACKLOG_PRODUCT.md` (Sprint B) |
| Escaneo de receta / IA | **No implementada** — sin código | — |

**Fuera de alcance de este release (no viven en `mobile/`, no aplican a la publicación en Google Play):** cuenta de usuario (`/cuenta`, solo `web/`), comparación de "receta completa" (`/mi-receta`, solo `web/`), panel `/admin` (solo `web/`), motor de suscripciones (backend en `api/`, sin conexión a mobile).

---

## 3. Riesgos para Producción

| Nivel | Riesgo | Descripción | Impacto | Recomendación |
|---|---|---|---|---|
| **Crítico** | Data Safety en Play Console sin confirmación de cierre | La evidencia más reciente encontrada en el repositorio (`docs/actas/20260731b.md`, 2026-07-31) indica explícitamente que este ítem **"sigue pendiente"**. No existe ningún documento con fecha posterior que confirme su cierre. Es una acción manual en Play Console (no en código), por lo que **no es verificable desde el repositorio** si se completó después del 31-07. | Google Play **no permite publicar en Producción** sin este formulario completo — es un bloqueo binario e impuesto por la plataforma, no una opinión de calidad. | Confirmar directamente en Play Console si el formulario de Data Safety está completo. Si no lo está, es la única acción que impide técnicamente el submit a Producción. |
| **Alto** | Endpoint de diagnóstico (`/api/search?debug=1`) sin autenticación garantizada | `isAuthorized()` (`api/src/middleware/auth.ts`) devuelve `true` para cualquiera si `API_SECRET_KEY` no está configurada en el entorno de Vercel de producción. Si no está configurada, cualquiera puede ver `errorMessage` crudo de los 9 scrapers vía `?debug=1`. | Exposición de detalles internos de implementación (no de datos de usuario) a terceros. | Confirmar si `API_SECRET_KEY` está seteada en el proyecto Vercel de producción de `api/`. No verificable desde el repositorio (es una variable de entorno en Vercel, no un archivo). |
| **Alto** | `eas.json` — `submit.production.android.track: "internal"` | Si se usa `eas submit` para publicar, el AAB se enviaría al track de Prueba Interna, no a Producción. El método de build documentado como preferido (`pnpm build:android`, ver `CLAUDE.md`) genera el AAB localmente para subida manual a Play Console, lo que evita este problema — pero si en algún punto se usa `eas submit` sin corregir este valor, el release no llegaría a producción sin que se note de inmediato. | Confusión operativa / posible retraso de publicación si se usa el flujo equivocado. | Confirmar qué mecanismo de submit se usará realmente para este lanzamiento. |
| **Medio** | PII en logs de infraestructura (Vercel) | `api/src/routes/feedback.ts:106` loguea email + IP + mensaje del usuario si falta `RESEND_API_KEY`. `api/src/routes/subscriptions.ts:194` loguea el `purchaseToken` de Google Play cuando no hay usuario asociado. Ninguno de los dos es una fuga pública, pero ambos quedan en texto plano en los logs de Vercel. | Exposición de datos personales a quien tenga acceso al dashboard de Vercel del proyecto. | — |
| **Medio** | Assets de imagen pesados en el bundle | `mobile/assets/splash.png` (1.6 MB) y `mobile/assets/icon.png` (980 KB) son considerablemente más grandes que lo típico para estos assets (splash/icon se usan una sola vez cada uno, pero contribuyen directamente al peso del AAB). También existen copias duplicadas en `mobile/assets/old/` (`splash.png` 1.6 MB, `icon.png` 230 KB, `feature-graphic.png` 600 KB, `adaptive-icon.png` 16 KB) — no verificado si `old/` se incluye en el bundle final o es solo un respaldo de trabajo. | Peso de descarga innecesario si `old/` se empaqueta; splash/icon pesados afectan tiempo de arranque marginalmente. | — |
| **Medio** | Bajo uso de memoización en componentes de lista | Solo 2 archivos en todo `mobile/src` usan `useMemo`/`useCallback`/`React.memo`. La pantalla de resultados (`results.tsx`) sí usa `FlatList` (virtualizado, correcto), pero varias pantallas con listas de tamaño variable (`MedicationListItem.tsx`, `medication.tsx`) no memoizan cálculos derivados. **No hay datos de profiling en el repositorio** que demuestren un problema de rendimiento real — esto es una observación de patrón de código, no una medición. | No determinable con certeza sin profiling en dispositivo real. | — |
| **Medio** | `<Image>` de React Native sin capa de caché/optimización | `medication.tsx:146` y `MedicationListItem.tsx:51` usan el componente `Image` nativo de React Native, no `expo-image` (no está en `package.json`). El componente nativo no cachea agresivamente ni decodifica en background como `expo-image`. | Posible parpadeo/recarga de imágenes de medicamento al re-renderizar listas; no medido. | — |
| **Bajo** | Suscripciones/Premium sin conexión a mobile | El motor de suscripciones (`api/src/services/subscriptionService.ts`) está completo y en producción, pero mobile no lo consulta ni bloquea nada por plan (confirmado, cero referencias). No es un bloqueador de publicación — la app funciona igual sin esto — pero es relevante si se espera monetizar vía mobile en el corto plazo. | Ninguno para esta publicación; brecha funcional para monetización futura. | — |
| **Bajo** | Deep links entrantes no configurados | Sin Android App Links ni manejo de `scheme://` entrante. No bloquea la publicación. | Limita atribución de marketing / enlaces directos desde fuera de la app. | — |
| **Bajo** | Historial de precios con dos fuentes de datos no unificadas | Mobile usa snapshots locales (`AsyncStorage`), web/api usan la tabla `price_history` de Supabase. No es un bug funcional (cada plataforma funciona), pero los datos mostrados pueden no coincidir entre mobile y web para el mismo medicamento. | Inconsistencia de datos entre plataformas, no visible como error al usuario. | — |
| **Bajo** | Keystores de firma sueltos en el filesystem del proyecto | 3 archivos `.jks` (incluyendo 2 marcados "OLD") + `debug.keystore`/`release.keystore` existen en disco en `mobile/`. Confirmado que **no están trackeados en git** (excluidos por `.gitignore`, cero resultados en `git ls-files`). | Riesgo operativo si la carpeta se comparte o exporta sin cuidado (ver `audit-package/`, mencionado en `.gitignore` como destino de exports para terceros/LLMs). | — |

---

## 4. Calidad

Alcance revisado: `mobile/src/` completo.

- **TODO / FIXME / HACK / XXX:** **cero ocurrencias** en `mobile/src/`.
- **Código comentado (código muerto):** **no se encontraron bloques de código comentado sustanciales.** Todos los comentarios `/* */` y `{/* */}` encontrados son JSDoc o separadores visuales de secciones JSX activas.
- **`console.log`/`console.warn`/`console.error`:** **cero ocurrencias** en `mobile/src/`.
- **Feature flags de producto:** **ninguno encontrado.** Los únicos condicionales de tipo flag son el patrón estándar `__DEV__` de Sentry en `mobile/src/app/_layout.tsx:13,15` (gating de entorno, no de producto).
- **Menciones de "experimental"/"WIP"/"provisional"/"hack temporal":** **ninguna** en `mobile/src/`.
- **`eslint-disable` / `@ts-ignore` / `@ts-expect-error`:** 2 ocurrencias, ambas `eslint-disable`, ninguna `@ts-ignore` ni `@ts-expect-error`:
  - `mobile/src/hooks/useDebounce.ts:10` — suprime `react-hooks/exhaustive-deps` (deps dinámico pasado por el caller).
  - `mobile/src/app/index.tsx:303` — suprime `@typescript-eslint/no-explicit-any` en una navegación (`router.push("/about" as any)`) por limitación de tipado de Expo Router.

**Conclusión:** `mobile/src/` está objetivamente limpio en los criterios de calidad auditados — no hay marcadores de trabajo pendiente, código muerto ni logs de depuración olvidados.

---

## 5. Seguridad

- **Secrets/API keys hardcodeadas:** no se encontraron secretos reales (API keys privadas, tokens Bearer, claves AWS/GCP, PEM) hardcodeados en `mobile/src`, `api/src`, `web/src`, `app.json` ni `eas.json`.
  - Única clave real presente en código: PostHog (`mobile/src/lib/analytics.ts:5`, `phc_CGQaYJtbFpR3VJ6BSYrjrDpT5emqZG4WFCeaE2FEcT3g`). El propio código la documenta como "write-only client key — safe to commit", que es el patrón oficial de PostHog para claves de cliente. No es un secreto de riesgo por diseño, pero se deja constancia por ser una credencial real embebida.
  - Algolia (Salcobrand): ya no está hardcodeada — se lee de `ALGOLIA_APP_ID`/`ALGOLIA_API_KEY` (env vars).
- **Variables de entorno en mobile:** solo 3 (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_SENTRY_DSN`), todas vía `process.env.EXPO_PUBLIC_*`. Ninguna tiene un valor por defecto peligroso — si `EXPO_PUBLIC_API_URL` falta, la búsqueda lanza una excepción explícita en vez de apuntar a un endpoint por defecto.
- **Logs sensibles:** cero en `mobile/src` (no hay ningún `console.*`). En `api/src` sí existen dos casos con PII en logs (ver sección 3, riesgo Medio).
- **Debug/flags:** `__DEV__` se usa correctamente y de forma estándar en RN/Expo (se resuelve en build time, sin riesgo de quedar activo en producción). El modo debug real de riesgo está en `api/` (`?debug=1`, ver sección 3, riesgo Alto), no en mobile.
- **Certificados/firma:** 3 `.jks` + 2 `.keystore` presentes en disco, confirmado que ninguno está trackeado en git. `eas.json` no contiene credenciales inline.
- **Archivos `.env` reales:** ninguno trackeado en git — solo los tres `.env.example` (`api/`, `mobile/.env.local.example`, `web/`) están en el historial.
- **`mobile/app.json` completo:** revisado íntegro, no contiene ningún secreto.

**Conclusión:** no se encontraron vulnerabilidades de seguridad de severidad crítica en el código de `mobile/`. Los hallazgos relevantes (endpoint de debug sin auth garantizada, PII en logs) están en `api/`, no en el cliente móvil, y dependen de configuración de Vercel no verificable desde el repositorio.

---

## 6. Google Play

| Punto | Estado | Evidencia |
|---|---|---|
| Billing/Suscripciones | **No implementado en mobile.** Sin librería IAP, sin UI de compra. El único flujo de "pago" es el banner de donación, que abre Khipu en el navegador externo (no es un pago in-app de Google Play). | grep de `react-native-iap`/`InAppPurchase` en `mobile/`: 0 resultados |
| Deep Links | `scheme: "comparafarma"` declarado. **Sin Android App Links** (`intentFilters`/`autoVerify` no configurados) y sin manejo de enlaces entrantes en código. | `mobile/app.json`, coincide con `RELEASE_READINESS_V1.md` §1.11 |
| Data Safety | **Pendiente según la última evidencia disponible (2026-07-31).** Sin documento posterior que confirme el cierre. No verificable desde el repositorio si se completó después de esa fecha (es una acción en la consola de Play, no en código). | `docs/actas/20260731b.md`, `docs/release/RELEASE_READINESS_V1.md`, `PRODUCTION_BLOCKERS_PLAN.md`, `PLAY_CONSOLE_CHECKLIST.md` (los tres últimos fechados 2026-06-30) |
| Permisos | `android.permissions: []` (confirmado literal). `ios.privacyManifests` declara solo `NSPrivacyAccessedAPICategoryUserDefaults`. Sin uso de `expo-location`/`expo-camera`/`expo-notifications`/`expo-contacts` en el código — coherente, sin discrepancia entre permisos declarados y funcionalidad real. | `mobile/app.json` |
| Target SDK | `targetSdkVersion="36"`, `minSdkVersion="24"` (confirmado en el `AndroidManifest.xml` fusionado del build de release ya generado). `compileSdkVersion` no determinable directamente desde el repo (resuelto por el plugin de Expo, no está hardcodeado). | `mobile/android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml` |
| Versiones | versionCode 31 / versionName 1.4.0 (Android); buildNumber "30" (iOS) — desalineado, ver sección 1. | `mobile/app.json` |
| Firma | `eas.json`: perfil `production` sin `credentials` inline (no expone nada). **`submit.production.android.track: "internal"`** — si se usa `eas submit`, iría al track de Prueba Interna, no a Producción (ver riesgo en sección 3). | `mobile/eas.json` |

---

## 7. Analytics

Único mecanismo de analítica encontrado: PostHog, inicializado en `mobile/src/lib/analytics.ts`.

**Evento instrumentado (el único que existe en todo el código):**

| Evento | Disparado desde | Propiedades enviadas |
|---|---|---|
| `medication_search` | `mobile/src/hooks/useSearch.ts:62` — solo cuando la búsqueda **no** viene de caché (cache-miss real contra el backend) | `query`, `raw_query`, `results_count`, `pharmacies_with_results`, `best_price`, `best_pharmacy`, `commune` |

No existe `posthog.identify()` ni `posthog.screen()` en ningún archivo de `mobile/src`. No hay ningún otro evento (no hay tracking de favoritos, alertas, carrito, compartir, apertura de farmacia, donación, ni ningún otro punto de interacción del usuario).

---

## 8. Premium

**Estado actual: el motor de suscripciones no tiene ninguna conexión con `mobile/`.**

Evidencia (todo grep sobre `mobile/src`, cero coincidencias en cada caso):
- Cero referencias a "premium", "plan", "subscription" o "entitlement".
- Cero llamadas a `/api/subscriptions` desde ningún archivo de `mobile/src/lib/`.
- `mobile/src/store/configStore.ts` no tiene ningún campo de plan/premium/tier.
- Ninguno de los 8 stores de Zustand documentados en `CLAUDE.md` contiene lógica de suscripción.

**Qué existe (fuera de mobile):** el motor completo (`api/src/services/subscriptionService.ts`, adaptadores Google Play y Flow, tablas `subscription_plans`/`subscriptions`/`subscription_events`) vive en `api/`, con superficie de uso solo en `web/` (`/cuenta`, `/admin/usuarios`).

**Qué falta para que mobile tenga algo que proteger:** ninguna funcionalidad de mobile está diseñada hoy para requerir un plan — no hay ninguna pantalla, botón o flujo en `mobile/src` que dependa de `plan === "premium"`. No hay "falta conectar X pantalla" que reportar porque no existe ninguna pantalla con esa dependencia en el código actual.

---

## 9. Performance

No existen datos de profiling en el repositorio (no hay reportes de performance, flame graphs, ni métricas de tiempo de render capturadas). Lo siguiente son observaciones de patrón de código, no mediciones:

- **Pantallas lentas:** no determinable con certeza sin instrumentación/profiling en dispositivo real. No se encontró ningún reporte de performance en `docs/`.
- **Listas:** la pantalla de resultados de búsqueda (`mobile/src/app/results.tsx`) y el selector de comunas (`CommuneSelector.tsx`) usan `FlatList` (virtualizado, patrón correcto para listas potencialmente largas). El resto de los `.map()` encontrados en `mobile/src/` operan sobre colecciones acotadas por diseño (carrito ≤ 8, favoritos, slides de onboarding, opciones de filtro) — no representan el mismo riesgo que una lista larga sin virtualizar.
- **Consultas repetidas:** `useSearch.ts` usa `AbortController` para cancelar la búsqueda anterior si el usuario dispara una nueva antes de que termine, y consulta primero la caché local (`AsyncStorage`, TTL 30 min, `mobile/src/lib/cache.ts`) antes de golpear el backend — mitiga duplicación de requests idénticos dentro de la ventana de caché.
- **Imágenes pesadas:** `mobile/assets/splash.png` (1.6 MB) y `mobile/assets/icon.png` (980 KB) son considerablemente más grandes de lo típico para estos assets. Existen copias duplicadas en `mobile/assets/old/` cuyo estado de inclusión en el bundle final **no se pudo determinar** desde el repositorio (depende de si algo las referencia; no se encontró ninguna referencia activa a `assets/old/` en `mobile/src`, lo que sugiere que no se empaquetan, pero no es 100% verificable sin inspeccionar el bundle generado).
- **Renderizados innecesarios:** solo 2 archivos en todo `mobile/src` usan `useMemo`/`useCallback`/`React.memo`. Esto es un indicador de bajo uso de memoización, no una medición de re-renders reales — no se puede concluir con certeza que exista un problema de performance sin profiling.
- **Componente de imagen:** `medication.tsx` y `MedicationListItem.tsx` usan `Image` nativo de React Native (no `expo-image`, que no está entre las dependencias) — sin la capa de caché/decodificación en background que ofrece `expo-image`.

---

## 10. Recomendación Final

### Clasificación: **C) No recomendable publicar todavía**

**Esta clasificación está condicionada casi exclusivamente a un solo punto — no es un juicio general sobre la calidad del producto.**

**Justificación basada en evidencia:**

1. **Bloqueador explícito y no confirmado como cerrado:** el formulario de Data Safety en Play Console es la última pieza pendiente registrada en el repositorio (`docs/actas/20260731b.md`, 2026-07-31: "sigue pendiente"). Google Play no permite el paso de Prueba Cerrada a Producción sin este formulario completo — es un requisito binario de la plataforma, no una recomendación de calidad. No existe en el repositorio ningún documento con fecha posterior que confirme su cierre, por lo que, desde la evidencia disponible, **el estado de este bloqueador a la fecha de este informe es incierto, y la última señal conocida es "pendiente".**

2. **El resto de los bloqueantes históricos (B-2, B-3, B-4) están resueltos según la evidencia revisada:** `API_SECRET_KEY` fue verificada como resuelta por el CTO en `docs/actas/20260728.md`; la API key de Algolia ya no está hardcodeada (confirmado en el código actual, movida a env var); `targetSdkVersion` está en 36 (confirmado en el manifest fusionado del build de release). Esto significa que, técnicamente, el producto está cerca de cumplir los requisitos — el bloqueo no es por deuda técnica generalizada, sino por un único ítem procedimental sin confirmación de cierre.

3. **Riesgos adicionales que no bloquean la publicación pero deben confirmarse antes o inmediatamente después:** la configuración `eas.json` (`submit.production.android.track: "internal"`) podría causar que un `eas submit` sin corregir no llegue a Producción; y no es verificable desde el repositorio si `API_SECRET_KEY` está configurada en el Vercel de producción de `api/` (afecta exposición de un endpoint de diagnóstico, no la publicación en sí).

4. **El código de `mobile/` en sí está limpio:** cero TODO/FIXME, cero código comentado muerto, cero logs de depuración, sin secretos hardcodeados de riesgo real, permisos coherentes con el uso real de APIs, SDK target correcto. Ninguno de estos puntos es un obstáculo para publicar.

**Qué movería la clasificación a B (Producción con observaciones menores) o A (Listo para Producción):** una confirmación directa en Play Console de que el formulario de Data Safety está completo. Ese dato específico no es verificable desde este repositorio — solo desde la consola de Google Play — y es la única pieza de información que falta para cerrar este informe con una clasificación distinta.

---

## Notas de método

- Este informe no propone cambios ni mejoras — es una fotografía del estado actual, conforme a lo solicitado.
- Puntos marcados explícitamente como **incierto** o **no determinable** representan límites reales de lo verificable desde el código/configuración del repositorio (típicamente, configuración que vive en Vercel o en la consola de Google Play, no en archivos).
- No se ejecutó ningún build, test de performance en dispositivo real, ni se accedió a ningún panel externo (Play Console, Vercel, Supabase, PostHog) — toda la evidencia proviene del repositorio tal como está en disco.
