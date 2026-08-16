# ComparaFarma — Capacidades Funcionales

> **Qué es este documento y qué no es.** Esta es una **vista funcional consolidada** de qué hace ComparaFarma hoy, por plataforma, y con qué limitaciones conocidas. No es un backlog: la planificación y el trabajo pendiente viven en `docs/product/` (definición funcional) y `docs/program/` (backlog activo, `docs/program/backlog/issues/`). Los detalles técnicos de implementación viven en `docs/technology/`. El estado operacional de cada servicio externo (cuotas, incidentes, salud) vive en `docs/operations/services/reviews/`. Cuando este documento y una de esas fuentes discrepan, gana la fuente especializada correspondiente.
>
> Verificado contra el estado real de `main` el 2026-08-15 (limpieza de gobierno documental). Una capacidad solo se marca ✅ si se pudo confirmar objetivamente contra el código; si no se pudo verificar, se marca explícitamente como no confirmada en vez de asumir un estado.

---

## Estado de funcionalidades

| Ícono | Significado |
|---|---|
| ✅ | Implementada y en producción |
| 🔄 | Implementada, mejora planificada (ver `docs/program/backlog/`) |
| 🕐 | Planificada — ver ítem correspondiente en `docs/program/backlog/` |
| 💬 | En discusión / diseño |
| 🔍 | Investigación exploratoria, sin compromiso de desarrollo ni backlog asociado |

---

## Búsqueda de Medicamentos

### ✅ Búsqueda principal (Mobile + Web)
- Búsqueda por nombre de medicamento con debounce de 500ms (Mobile) / sin debounce en SSR (Web)
- Limpieza automática del query (`cleanQuery`, compartido vía `@comparafarma/domain`) — elimina dosis, unidades y palabras genéricas
- Búsqueda simultánea en las 9 farmacias activas vía backend (`api/`)
- Mobile: caché local en AsyncStorage con TTL de 30 minutos (prefijo `search_cache_v10_`); pull-to-refresh
- Web: `Home` + `/buscar/[query]` (SSR, sin caché de cliente) — misma fuente de datos (`api/`), mismo `MedicationResult`, pero sin filtro de comuna, favoritos ni historial (ver limitaciones más abajo)

### ✅ Sugerencias de búsqueda (solo Mobile)
- Dropdown con historial de búsquedas recientes filtrado por lo que escribe el usuario
- Búsquedas frecuentes predefinidas (Paracetamol, Ibuprofeno, Omeprazol, etc.)
- Deduplicación case-insensitive (no repite el mismo término)
- **Limitación**: no existe en Web — `web/src/components/SearchBox.tsx` no tiene historial ni sugerencias

### ✅ Deduplicación de resultados (Mobile + Web, lógica compartida)
- Agrupación por `matchKey = {principioActivo}|{dosis}|{cantidad}` (`@comparafarma/domain`)
- Cuando una farmacia tiene múltiples marcas con el mismo formato, muestra la más barata
- Normalización de acentos y formatos de nombre entre farmacias

### ✅ Búsqueda geográfica por comuna (solo Mobile)
- `CommuneSelector` en el Home: chip que abre modal con búsqueda de texto libre
- Autocompletado por nombre de comuna y región (ej: "Providencia — Metropolitana")
- Opción "Todas las comunas" para quitar el filtro
- La comuna seleccionada persiste entre sesiones (AsyncStorage `location-v1`)
- Al buscar con comuna activa, solo se consultan las farmacias con sucursal en esa zona
- El backend acepta `?pharmacies=cruz-verde,dr-simi` para filtrar qué APIs consulta
- **Limitación**: no existe en Web.
- **Limitación conocida de la fuente de datos (MINSAL)**: `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_MINSAL.md` (OPS-REV-007, 2026-08-14) confirmó con logs reales que **las 71/71 ejecuciones del workflow diario desde el 2026-06-03 fallan con HTTP 403** — MINSAL bloquea tanto IPs de Vercel como de GitHub Actions. El dato que sirve hoy `/api/branches` es una carga manual congelada del 2026-06-08 (no hay actualización automática funcionando); no se está acumulando cobertura semanal como describía una versión anterior de este documento.

**Archivos clave:**
- `api/src/clients/minsal.ts`, `api/src/data/branches-data.ts`, `api/src/routes/branches.ts`
- `mobile/src/store/locationStore.ts`, `mobile/src/lib/branches.ts`, `mobile/src/components/CommuneSelector.tsx`

---

## Resultados de Búsqueda (Mobile)

### ✅ Lista de resultados
- Cada resultado muestra: imagen del medicamento, nombre, laboratorio
- Precio mínimo visible ("desde $X") con nombre de farmacia
- Puntos de color indicando qué farmacias tienen el medicamento
- Badge "Bioequivalente" cuando aplica
- Ordenar por precio ascendente o nombre A-Z

### ✅ Filtros en resultados
- Filtro bioequivalente con contador (🌿 Bio)
- Filtro por farmacia: chips horizontales por cadena, con indicador visual de activo/inactivo
- El filtro de farmacias persiste al entrar al detalle del medicamento

### ✅ Banners contextuales y skeleton loading
- Banner verde si hay bioequivalentes disponibles
- Tooltip la primera vez que hay resultados
- 3 placeholders animados (pulse) mientras carga la búsqueda

**Web equivalente:** `/buscar/[query]` muestra la misma información base (imagen, canales de precio, stock) vía `MedicationCard.tsx`, sin los filtros de bioequivalente/farmacia ni el ordenamiento interactivo de Mobile.

---

## Detalle de Medicamento

### ✅ Precios por farmacia y canal (Mobile + Web)
- Una card por farmacia con precio presencial, online, tarjeta (T. Más/CMR/Fonasa/Plus) y SBPay — ver `docs/product/definition/PRICE_CHANNELS.md` para el detalle exacto por farmacia
- Destacado visual del canal más barato
- Precio por unidad calculado desde la cantidad del `matchKey`
- Badge de stock, timestamp de última consulta

### ✅ Calculadora de ahorro (Mobile + Web)
- Diferencia entre la farmacia más barata y la más cara, porcentaje de ahorro
- Solo aparece si hay 2+ farmacias con precios distintos

### ✅ Banner farmacia única (Mobile)
- Aviso cuando solo una farmacia tiene esa presentación exacta

### ✅ Acciones desde el detalle (Mobile)
- Compartir precio, agregar/quitar de lista de compras, link "Ver en farmacia →" (vía `/api/go`, con tracking de click), guardar/quitar de favoritos

### ✅ Historial de precios (Web y Mobile)
- Gráfico de los últimos snapshots diarios de precio (`price_history` en Supabase)
- Mobile: `PriceHistoryChart` (últimos 14 snapshots) — Web: `web/src/components/PriceHistoryChart.tsx` (implementación propia, mismo origen de datos)

### ✅ Alertas de precio (Mobile y Web, implementaciones independientes)
- Mobile: objetivo guardado en `alertsStore` (AsyncStorage), toast in-app cuando el precio baja
- Web: `PriceAlertForm.tsx` + `createPriceAlert.ts` (Server Action) — alerta por email, gestionada desde el backend (`email_alerts` en Supabase), independiente del mecanismo de Mobile

---

## Farmacias Integradas

Las 9 farmacias están **completamente integradas y activas** en producción — verificado directamente contra `api/src/services/searchService.ts` (las 9 están en el arreglo de dispatch de búsqueda) y `api/src/clients/*.ts` (las 9 tienen cliente implementado). El monitor productivo (`Monitor API`, cada hora) las cubre a las 9.

### ✅ Cruz Verde — REST JSON (Demandware OCAPI) — canal: presencial
### ✅ Salcobrand — Algolia Search API — canales: presencial, online, T. Más (tarjeta), SBPay
### ✅ Farmacias Ahumada — HTML Scraping (Demandware storefront, ver advertencia de fragilidad en `CLAUDE.md`) — canales: presencial, CMR (tarjeta)
### ✅ Dr. Simi — REST JSON (VTEX Catalog API) — canales: presencial, online
### ✅ AraucoMed — REST JSON (endpoint ajax PrestaShop) — canal: presencial
### ✅ EcoFarmacias — WooCommerce Store API pública — canal: presencial (`onlineOnly=true`, sin canal online/CMR/SBPay a nivel de precio)
### ✅ Farmex — Shopify API pública — canales: presencial, Fonasa (mapeado al campo `cmr`, condicionado a que el precio Fonasa sea menor que el presencial)
### ✅ Sermecoop — HTML scraping (backend propio en PHP, Concepción) — canal: presencial. Riesgo operacional conocido: flujo GET→POST con `PHPSESSID`+CSRF, con riesgo de timeout en Vercel (ver `CLAUDE.md`)
### ✅ EasyFarma — HTML scraping (WordPress) — canal: presencial (`onlineOnly=true`). **Discrepancia corregida en esta revisión** (ver nota abajo): no tiene canal CMR/online/SBPay a nivel de precio pese a que la UI de Mobile tiene una etiqueta "Plus" preconfigurada para un futuro canal tarjeta.

> **Nota EasyFarma/CMR (2026-08-15):** `CLAUDE.md` describía a EasyFarma con `cmr = Plus`. El código real (`api/src/clients/easyfarma.ts`) hardcodea `cmrPrice: null`, con un comentario explícito en el archivo que aclara que no existe canal CMR/online/SBPay a nivel de producto. La implementación actual es la evidencia autoritativa: **EasyFarma no tiene canal CMR disponible hoy**. `mobile/src/constants/pharmacies.ts` sí trae configurada la etiqueta "Plus" en la UI (`cardLabel: "Plus"`), pero esa configuración no tiene datos reales detrás — es un placeholder visual, no una capacidad activa. `CLAUDE.md` y `docs/product/definition/PRICE_CHANNELS.md` quedan consistentes entre sí tras esta corrección (ambos documentan `cmr = No disponible` para EasyFarma). No se modificó `easyfarma.ts` ni se implementó el canal — esto es una corrección puramente documental.

### 🔍 COFAR y Liga Farmacia
No forman parte de las 9 farmacias integradas de ComparaFarma. Quedan como investigación exploratoria sin backend accesible identificado (ambas son SPA que requieren interceptar tráfico de red) — ver `docs/technology/integrations/pharmacies/FARMACIAS.md` para el detalle técnico. Sin compromiso de desarrollo ni ítem de backlog asociado.

---

## Favoritos, Historial de Búsquedas y Lista de Compras (solo Mobile)

Estas tres capacidades existen únicamente en Mobile — no tienen equivalente en Web hoy.

### ✅ Favoritos
- Guardar/quitar con ❤️ desde el detalle; AsyncStorage (`favorites-v1`) con precios cacheados al momento de guardar
- Carrusel horizontal en Home

### ✅ Historial de búsquedas
- Últimas 10 búsquedas (AsyncStorage `search-history`), eliminar individual o todo

### ✅ Carrito / lista de compras
- Agregar hasta 8 medicamentos, sin persistencia entre sesiones
- Comparativa de total por farmacia, incluye las 9 farmacias activas (antes solo cubría las 5 farmacias originales — corregido en esta revisión tras verificar que `cart.tsx`/`packages/domain` ya no filtran por slug, sino que iteran genéricamente sobre `PHARMACIES`)

---

## Onboarding (solo Mobile)

### ✅ Tutorial inicial
- 5 slides al primer arranque; modo ayuda accesible desde botón `?` en Home en cualquier momento

---

## Capacidades específicas de Web

Estas capacidades existen en `web/` y no tienen equivalente en Mobile hoy.

### ✅ Cuenta de usuario
- `/cuenta`, `/cuenta/ingresar`, `/cuenta/registro`, `/cuenta/recuperar`, `/cuenta/actualizar-clave` — autenticación propia (Supabase Auth), recuperación de contraseña por email
- `/cuenta` muestra el plan actual y, si hay un plan vendible configurado, el botón de upgrade (ver Motor de Suscripciones abajo)

### ✅ Mi Receta (comparación de múltiples medicamentos)
- `/mi-receta`, `RecipeComparisonView.tsx`, `AddToRecipeButton.tsx` — permite armar una lista de varios medicamentos (ej. una receta médica completa) y comparar el total por farmacia, análogo en concepto al carrito de Mobile pero con URL compartible (`RecipeLinkBadge.tsx`)

### ✅ Panel de administración (`/admin`)
- Protegido con Supabase Auth (Google OAuth + email/contraseña + lista blanca `ADMIN_ALLOWED_EMAILS`)
- `/admin` — dashboard de clicks por farmacia (`pharmacy_clicks`)
- `/admin/config` — activar/desactivar farmacias y banner de donación sin redeploy
- `/admin/feedback` — bandeja de sugerencias de usuarios
- `/admin/usuarios` — gestión de perfiles/planes

### ✅ Donaciones (Web) — 🕐 retirado temporalmente de Mobile
- Web: `DonationWidget.tsx`, `/apoyar`, `/apoyar/retorno`, `/apoyar/cancelado`, pagos vía Khipu — activo en producción
- Mobile: el código de `DonationBanner` existe (`mobile/src/components/DonationBanner.tsx`) pero su import está **retirado temporalmente del flujo visible** (ver comentario explícito en `mobile/src/app/medication.tsx`) — no se muestra hoy en la app

---

## Backend e Infraestructura

### ✅ API Backend (Vercel)
- `GET /api/search?q=...` (+ `&debug=1` para diagnóstico por farmacia), `GET /api/config`, `GET /api/health`, `POST /api/feedback`, `GET /api/go?...` (redirect con tracking, valida dominio contra open redirect)
- Rate limiting por IP y caché de búsqueda (5 min) vía **Upstash Redis compartido entre instancias**, con fallback a memoria local si Redis no responde o no está configurado — **implementado y en producción**, no planificado (corregido en esta revisión: una sección anterior de este documento lo listaba como "planificado" contradiciendo la sección de infraestructura, que ya lo describía correctamente como implementado; ver `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_UPSTASH.md`)

### ✅ Sitio web público (`web/`, Next.js) y SEO
- Home + `/buscar/[query]` con la misma fuente de datos que Mobile (`api/`), `sitemap.xml`, `robots.txt`, JSON-LD `Product`/`AggregateOffer`
- Deployado en `https://app-compara-farma-web.vercel.app` (dominio propio pendiente)

### ✅ Tracking de clicks a farmacia
- Cada link "Ver en farmacia" pasa por `/api/go`, se registra en `pharmacy_clicks`, visible en `/admin`

### ✅ Configuración de farmacias y banner de donación
- `/admin/config` (Next.js) — checkboxes por farmacia y toggle/días del banner, guardado en `app_config` (Supabase) con fallback a env vars

### ✅ Analítica de producto (PostHog)
- SDK `posthog-react-native` integrado en Mobile (`mobile/src/lib/analytics.ts`) — **implementado**, no planificado (corregido en esta revisión: una sección anterior lo listaba como "planificado" pese a existir en el código; ver `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_POSTHOG.md`). No se verificó en esta revisión el detalle exacto de qué eventos se envían — para eso, ver el código de `analytics.ts` directamente.

### ✅ Monitoreo
- CI/CD con GitHub Actions en cada push a `main`; monitor productivo cada hora (`monitor-api.yml`, cubre las 9 farmacias); Sentry para error tracking en producción (backend)

---

## Motor de Suscripciones (Web)

### ✅ Motor implementado (Google Play + Flow), sin catálogo comercial real todavía
- Modelo de datos y motor genérico (`api/src/services/subscriptionService.ts`) que soporta múltiples proveedores (`google_play`, `flow`, `manual`, entre otros)
- **Flow** es el proveedor de pago recurrente implementado y funcional para suscripciones Web individuales (RFC-005, `api/src/lib/adapters/flowAdapter.ts`) — alta multi-paso (cliente → tarjeta → confirmación → suscripción), webhook de cobro periódico
- El botón "Actualizar a Premium" en `/cuenta` solo aparece si existe al menos un plan vendible configurado en `subscription_plans` — **hoy no hay ningún plan comercial real creado**, así que el botón no es visible en producción todavía (esto es una decisión de negocio pendiente, no una limitación técnica)
- **Stripe fue reemplazado por Flow y su código fue retirado por completo de `main`** — Stripe no soporta comercios en Chile (confirmado oficialmente por el CEO al intentar crear la cuenta real). Toda la documentación de Stripe (RFC-004, ADR-0003, issues CF-117 a CF-121) queda archivada como Superseded en `docs/archive/engineering/issues/stripe/` — Stripe **no es una solución futura vigente** para este proyecto.
- Google Play Billing tiene el adaptador de notificaciones (RTDN) implementado (`googlePlayAdapter.ts`) pero sin activar en Mobile todavía — depende de que `mobile/` pueda enviar el purchase token al backend al momento de la compra (riesgo R-02, documentado en RFC-003)
- Pendientes reales para activar esto en producción (no son limitaciones de código, son acciones de negocio/configuración): correr el SQL pendiente en Supabase, configurar credenciales productivas de Flow en Vercel, y definir/crear el primer plan comercial real — ver `docs/program/backlog/issues/CF-127_FLOW_TESTS_Y_PENDIENTES.md`

---

## Ideas exploratorias sin gobierno activo (no son backlog)

Las siguientes ideas **no tienen código, no tienen RFC ni ítem en `docs/program/backlog/`** — no están "planificadas" en el sentido de un compromiso de trabajo, son notas de producto sin dueño ni fecha. Se listan aquí solo para no perder la idea, no como estado funcional real ni como promesa de roadmap.

- **White-labeling por empresa (B2B)**: activación por QR/deep link, adaptar logo/color/texto por empresa cliente. Sin código (`empresaStore` y mecanismo de white-label no existen en el repositorio).
- **Backoffice de empresas clientes (B2B)**: gestión de cuentas de empresas que contraten una versión white-label — distinto del panel `/admin` ya implementado (ese es para operar la app pública, no para gestionar clientes B2B). Depende de que exista white-labeling.
- **Panel para empresas cliente**: acceso para RR.HH. de una empresa cliente, ver empleados/búsquedas, distribuir QR/token. Depende de las dos ideas anteriores.

Si alguna de estas ideas se decide impulsar, su lugar es un RFC/issue nuevo en `docs/program/backlog/`, no este documento.

---

## Experiencia General (Mobile)

### ✅ Modo oscuro
- Soporte completo, detectado automáticamente desde el sistema operativo

### ✅ Feedback de errores
- Banner rojo con mensaje descriptivo, botón "Reintentar", mensaje diferenciado red vs servidor

### ✅ Formulario de feedback
- "Ayúdanos a mejorar" — email vía Resend si está configurada, y tabla `feedback` en Supabase, gestionable desde `/admin/feedback`
