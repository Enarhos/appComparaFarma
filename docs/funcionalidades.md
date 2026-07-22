# ComparaFarma — Funcionalidades

Documento de referencia de todas las funcionalidades de la app, tanto implementadas como planificadas. Se actualiza a medida que se agregan o modifican features.

---

## Estado de funcionalidades

| Ícono | Significado |
|---|---|
| ✅ | Implementada y en producción |
| 🔄 | Implementada, mejora planificada |
| 🕐 | Planificada (backlog) |
| 💬 | En discusión / diseño |

---

## Búsqueda de Medicamentos

### ✅ Búsqueda principal
- Búsqueda por nombre de medicamento con debounce de 500ms
- Limpieza automática del query (`cleanQuery`) — elimina dosis, unidades y palabras genéricas
- Búsqueda simultánea en todas las farmacias activas vía backend
- Caché local en AsyncStorage con TTL de 30 minutos (prefijo `search_cache_v10_`)
- Pull-to-refresh para forzar nueva búsqueda

### ✅ Sugerencias de búsqueda
- Dropdown con historial de búsquedas recientes filtrado por lo que escribe el usuario
- Búsquedas frecuentes predefinidas (Paracetamol, Ibuprofeno, Omeprazol, etc.)
- Deduplicación case-insensitive (no repite el mismo término)

### ✅ Deduplicación de resultados
- Agrupación por `matchKey = {principioActivo}|{dosis}|{cantidad}`
- Cuando una farmacia tiene múltiples marcas con el mismo formato, muestra la más barata
- Normalización de acentos y formatos de nombre entre farmacias

### ✅ Búsqueda geográfica por comuna
- `CommuneSelector` en el Home: chip que abre modal con búsqueda de texto libre
- Autocompletado por nombre de comuna y región (ej: "Providencia — Metropolitana")
- Opción "Todas las comunas" para quitar el filtro
- La comuna seleccionada persiste entre sesiones (AsyncStorage `location-v1`)
- Banner informativo en Home y Results cuando hay una comuna activa
- Al buscar con comuna activa, solo se consultan las farmacias con sucursal en esa zona
- El backend acepta `?pharmacies=cruz-verde,dr-simi` para filtrar qué APIs consulta
- Mensaje "Sin farmacias en [comuna]" si la búsqueda no encuentra nada con ese filtro
- Farmacias `onlineOnly` (sin presencia física) se marcan con badge 🌐 cuando hay filtro de comuna

**Fuente de datos — MINSAL `getLocales.php`:**
- Devuelve las farmacias de turno del **día actual** (~2.090 registros/día)
- Para cobertura completa se necesitan los 7 días de la semana acumulados
- GitHub Action `.github/workflows/update-branches.yml` ejecuta el script diariamente a las 06:00 Chile
- Después de 7 ejecuciones se tiene cobertura completa (~280 comunas estimadas)
- Los datos se acumulan en `api/src/data/branches.json` (merge, no reemplaza)
- MINSAL bloquea IPs de Vercel en runtime → datos embebidos como módulo TypeScript en el bundle (`branches-data.ts`)
- Actualización manual: `node scripts-temp/fetch-branches.js && git add api/src/data && git commit -m "data: update branches"`
- Campo real de la API: `local_nombre` (no `cadena_nombre`); región como `fk_region` (ID numérico)

**Archivos clave:**
- `api/src/clients/minsal.ts` — tipos, mapeo local_nombre→PharmacySlug, normalización
- `api/src/data/branches-data.ts` — JSON embebido (auto-generado, no editar manualmente)
- `api/src/routes/branches.ts` — endpoint `GET /api/branches`
- `mobile/src/store/locationStore.ts` — selectedCommune persistido
- `mobile/src/lib/branches.ts` — fetch + caché AsyncStorage 24h
- `mobile/src/components/CommuneSelector.tsx` — UI del selector

---

## Resultados de Búsqueda

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

### ✅ Banners contextuales
- Banner verde si hay bioequivalentes disponibles — invita a filtrarlos
- Tooltip la primera vez que hay resultados ("Toca un medicamento para ver los precios")

### ✅ Skeleton loading
- 3 placeholders animados (pulse) mientras carga la búsqueda
- Mismo layout que los resultados reales para evitar salto visual

---

## Detalle de Medicamento

### ✅ Precios por farmacia y canal
- Una card por farmacia con precio presencial, online, tarjeta (T. Más/CMR) y SBPay
- Destacado visual del canal más barato (✓ mejor)
- Precio por unidad (c/u o c/ml) calculado desde la cantidad del `matchKey`
- Badge de stock (En stock / Sin stock)
- Timestamp "Hace X min" de cuándo se consultó el precio

### ✅ Calculadora de ahorro
- Muestra diferencia entre la farmacia más barata y la más cara
- Porcentaje de ahorro
- Solo aparece si hay 2+ farmacias con precios distintos

### ✅ Banner farmacia única
- Aviso ámbar cuando solo una farmacia tiene esa presentación exacta
- Explica que otras farmacias pueden tener la misma molécula en distinta cantidad
- Botón para volver a resultados

### ✅ Acciones desde el detalle
- Compartir precio: "Medicamento — desde $X en Farmacia (Canal) | ComparaFarma"
- Agregar / quitar de lista de compras (ícono 🛒)
- Link "Ver en farmacia →" al sitio web de la farmacia
- Guardar / quitar de favoritos (ícono ❤️)

---

## Farmacias Integradas

### ✅ Cruz Verde
- REST JSON (Demandware OCAPI)
- Canales: presencial
- Bioequivalente: sí | Laboratorio: sí

### ✅ Salcobrand
- Algolia Search API
- Canales: presencial, online, T. Más (tarjeta), SBPay
- Bioequivalente: sí | Laboratorio: sí

### ✅ Farmacias Ahumada
- HTML Scraping (Demandware storefront) — frágil
- Canales: presencial, CMR (tarjeta)
- Bioequivalente: sí | Laboratorio: no

### ✅ Dr. Simi
- REST JSON (VTEX Catalog API)
- Canales: presencial, online
- Bioequivalente: sí | Laboratorio: sí

### ✅ AraucoMed
- REST JSON (endpoint ajax de PrestaShop, `?controller=search&s={query}&ajax=1`)
- Canales: presencial
- Bioequivalente: sí (detectado por regex sobre nombre+descripción) | Laboratorio: sí (`manufacturer_name`)

### 🕐 EcoFarmacias
- WooCommerce Store API pública (`/wp-json/wc/store/products`)
- Canales: online
- Bioequivalente: sí (desde categorías) | Receta requerida: sí | SKU/EAN: sí
- 64 sucursales en Valparaíso y Región Metropolitana

### 🕐 Farmex
- Shopify API pública (`/search/suggest.json` + `/products/[handle].json`)
- Canales: online, Fonasa, seguros (Metlife, Yapp)
- Precio por unidad ya calculado (`precio_fraccionado`)
- Indicaciones médicas, contraindicaciones y posología disponibles

### 🔍 COFAR
- Especializada en alto costo: oncológicos, VIH, hormona crecimiento, fertilidad
- Next.js SPA — requiere interceptar tráfico de red para encontrar API
- Sin presencia en tiendas online accesibles actualmente

### 🔍 Liga Farmacia
- Sin fines de lucro, especializada en neurología, epilepsia, salud mental
- React SPA — requiere interceptar tráfico de red
- Cobertura: RM y Concepción

---

## Favoritos

### ✅ Guardar favoritos
- Ícono ❤️ en el detalle del medicamento
- Se guardan en AsyncStorage (`favorites-v1`) con los precios al momento de guardar
- Al quitar un favorito se limpia también su caché de precios (sin memory leak)

### ✅ Sección de favoritos en Home
- Carrusel horizontal con los medicamentos guardados
- Muestra precio y farmacia al momento del guardado
- Toque directo al detalle sin pasar por búsqueda

---

## Historial de Búsquedas

### ✅ Historial
- Últimas 10 búsquedas guardadas en AsyncStorage (`search-history`)
- Eliminar búsqueda individual o limpiar todo (con feedback háptico)
- Las búsquedas del historial aparecen como sugerencias en el SearchBar

---

## Lista de Compras

### ✅ Carrito de medicamentos
- Agregar con ícono 🛒 desde el detalle
- Máximo 8 medicamentos simultáneos
- No persiste entre sesiones (solo en memoria)

### ✅ Comparativa de farmacias en el carrito
- Tabla con total por farmacia para el conjunto de medicamentos
- Ordena: farmacias con todos los ítems primero, luego por total ascendente
- 🥇 en la más barata
- Badge "Solo tiene N de M" si la farmacia no tiene todos los medicamentos
- Banner de ahorro: "Ahorras $X comprando todo en Farmacia"
- Incluye todas las farmacias activas (Cruz Verde, Salcobrand, Ahumada, Dr. Simi, AraucoMed)

---

## Onboarding

### ✅ Tutorial inicial
- 5 slides explicativos al primer arranque
- Modo ayuda: accesible desde botón `?` en Home en cualquier momento
- En modo ayuda no marca el onboarding como completado (vuelve con "atrás")

---

## Experiencia General

### ✅ Modo oscuro
- Soporte completo en todas las pantallas y componentes
- Detectado automáticamente desde el sistema operativo (`darkMode: "media"`)

### ✅ Feedback de errores
- Banner rojo con mensaje descriptivo cuando la búsqueda falla
- Botón "Reintentar" visible
- Mensaje diferenciado para errores de red vs errores del servidor

### ✅ Formulario de feedback
- Pantalla "Ayúdanos a mejorar" accesible desde el Home
- Envío por email via Resend API si está configurada (validación de largo mínimo y máximo, sanitización)
- Se guarda también en la tabla `feedback` de Supabase, visible y gestionable (marcar resuelto/reabrir) desde el panel `/admin/feedback`

---

## Backend y Infraestructura

### ✅ API Backend (Vercel)
- `GET /api/search?q=...` — búsqueda en todas las farmacias
- `GET /api/config` — configuración de farmacias activas y banner de donación
- `GET /api/health` — healthcheck
- `POST /api/feedback` — envío de sugerencias (email + Supabase)
- `GET /api/go?slug=...&matchKey=...&url=...` — redirect a la farmacia con tracking de click, valida dominio de destino contra open redirect
- `GET /api/search?q=...&debug=1` — diagnóstico por farmacia (resultCount, errores)
- Rate limiting por IP (60 req/min por defecto, configurable por env var) vía Upstash Redis compartido entre instancias (fallback en memoria solo en desarrollo local)
- Caché de búsqueda (5 min) también vía Upstash Redis compartido

### ✅ Sitio web público (`web/`, Next.js) y SEO
- Home + `/buscar/[query]` — misma información que la app (imagen, canales de precio, stock), consumiendo el mismo `api/`
- `sitemap.xml` (Home + búsquedas frecuentes curadas) y `robots.txt`
- JSON-LD `Product`/`AggregateOffer` en `/buscar/[query]` para rich results de precio en buscadores
- Deployado en `https://app-compara-farma-web.vercel.app` (dominio propio pendiente)

### ✅ Tracking de clicks a farmacia
- Cada link "Ver en farmacia" se reescribe para pasar por `/api/go` antes de llegar al sitio real
- Se registra en la tabla `pharmacy_clicks` de Supabase — base para negociar afiliación con las farmacias
- Visible en el panel `/admin` (total y últimos 7 días por farmacia)

### ✅ Configuración de farmacias y banner de donación
- Panel `/admin/config` (Next.js, protegido con Supabase Auth) — checkboxes por farmacia y toggle/días del banner de donación, cambio instantáneo sin redeploy
- Guardado en tabla `app_config` de Supabase (clave/valor genérico); fallback automático a las env vars `DISABLED_PHARMACIES`/`DONATION_BANNER_*` si Supabase no responde
- La app recibe la config desde `/api/config` al arrancar y la aplica en tiempo real (ver limitación: no refetchea si la app ya está abierta — `docs/product/BACKLOG_PRODUCT.md` v15-16)

### ✅ Monitoreo
- CI/CD con GitHub Actions en cada push a `main`
- Monitor automático cada 6 horas (`monitor-api.yml`)
- Sentry para error tracking en producción (JS-only)

---

## Funcionalidades de Negocio Planificadas

### 🕐 Redis compartido (Upstash)
- Caché compartido entre instancias Vercel (actualmente cada instancia tiene su propio Map)
- Rate limiting global (actualmente por instancia)
- Caché de datos MINSAL para búsqueda geográfica (TTL 24h)
- Costo estimado: $0-10 USD/mes

### 🕐 Analytics (PostHog)
- Identificador anónimo por dispositivo (`clientId` UUID en AsyncStorage)
- Eventos: `search`, `view_medication`, `share_price`
- Dashboard: medicamentos más buscados, usuarios únicos, retención
- Detalle por clientId: historial de búsquedas de un dispositivo
- Free tier: 1M eventos/mes

### 🕐 White-labeling por empresa (B2B)
- Activación por código QR o deep link (`comparafarma://empresa/:token`)
- La app adapta logo, color primario y texto de bienvenida según la empresa
- `empresaStore` persiste en AsyncStorage
- El filtro de farmacias puede configurarse por empresa
- Estadísticas de uso por empresa en PostHog

### 🕐 Suscripciones B2B
- Cobro externo vía Stripe (sin comisión de Google Play)
- Tokens con fecha de expiración generados por el backend
- La app valida vigencia del token cada 24h
- Distribución vía Play Store Closed Testing (hasta 2.000 empleados por empresa, gratuito)

### ✅ Panel `/admin` (para el dueño de la app) — primera versión en producción
Construido dentro de `web/` (Next.js), protegido con Supabase Auth (Google OAuth + email/contraseña + lista blanca `ADMIN_ALLOWED_EMAILS`):
- `/admin` — dashboard de clicks por farmacia (datos de `pharmacy_clicks`, base para negociar afiliación)
- `/admin/config` — activar/desactivar farmacias y banner de donación sin redeploy
- `/admin/feedback` — bandeja de sugerencias de usuarios con estado abierto/resuelto

### 🕐 Backoffice de empresas clientes (B2B) — no iniciado
Distinto del panel `/admin` de arriba — esto es para gestionar cuentas de empresas que contraten la versión white-label, no para operar la app pública:
- Gestión de empresas clientes: nombre, logo, color, plan, estado, fechas, token, contacto
- Depende de que exista la funcionalidad de white-labeling (ver más abajo) y de volumen de negocio B2B real

### 🕐 Panel para empresas cliente
- Acceso para el administrador de cada empresa (RR.HH.)
- Ve: empleados activos, búsquedas del mes, medicamentos más buscados
- Descarga QR/token para distribuir a nuevos empleados
- Construido con Appsmith o Next.js conectado a Supabase + PostHog

---

## Historial de versiones

| Versión | versionCode | Cambios principales |
|---|---|---|
| 1.0.0 | 1-9 | Versiones iniciales |
| 1.1.0 | 10 | [versión anterior] |
| 1.2.0 | 11 | AraucoMed (5ta farmacia), guards slugs desconocidos |
| 1.2.1 | 12 | Fix matchKey qty regex (x30comp, esoflux), rename param key→matchKey |
| 1.2.2 | 13 | Code review completo (22 fixes), UX improvements, permisos Android, iOS config |
| 1.2.3 | 14 | Búsqueda geográfica por comuna (MINSAL), FilterSheet con Switches, filterStore, regiones corregidas |
