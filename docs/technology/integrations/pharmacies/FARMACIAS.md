# Farmacias — Integración y Atributos

Documento de referencia para todas las farmacias integradas o en evaluación. Incluye método de obtención, campos disponibles y limitaciones conocidas.

---

## Estado de integración

| Farmacia | Estado | Método | Estabilidad |
|---|---|---|---|
| Cruz Verde | ✅ Integrada | REST JSON (Demandware) | ⚠️ Semi-pública |
| Salcobrand | ✅ Integrada | Algolia Search API | ✅ Estable |
| Ahumada | ✅ Integrada | HTML Scraping | 🔴 Frágil |
| Dr. Simi | ✅ Integrada | REST JSON (VTEX) | ✅ Estable |
| AraucoMed | ✅ Integrada | REST JSON (PrestaShop, endpoint ajax) | ✅ Estable |
| EcoFarmacias | 🕐 Backlog | WooCommerce Store API | ✅ Estable |
| Farmex | 🕐 Backlog | Shopify API | ✅ Estable |
| COFAR | 🔍 Investigación | Next.js SPA (interceptar red) | ❓ Desconocida |
| Liga Farmacia | 🔍 Investigación | React SPA (interceptar red) | ❓ Desconocida |

---

## Farmacias Integradas

---

### 1. Cruz Verde

| Atributo | Valor |
|---|---|
| **Sitio** | cruzverde.cl |
| **Método** | REST JSON — Demandware/SFCC OCAPI (semi-público) |
| **Endpoint** | `https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search` |
| **Parámetros** | `q`, `count=24`, `expand=prices,availability,images`, `client_id` |
| **Autenticación** | `client_id` hardcoded del frontend (no oficial) |
| **Archivo** | `api/src/clients/cruzverde.ts` |

**Campos obtenidos:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `hit.product_name` | ✅ |
| Precio presencial | `hit.price` | ✅ |
| Precio online | — | ❌ |
| Precio tarjeta | — | ❌ |
| Stock | `hit.orderable` | ✅ |
| URL producto | Construida con `product_id` + slug | ✅ |
| Imagen | `hit.image.dis_base_link` | ✅ |
| Laboratorio | `hit.brand` | ✅ (agregado en code review) |
| Bioequivalente | `hit.bioequivalent_indicator` | ✅ (agregado en code review) |

**Limitaciones:**
- `client_id` no es oficial — puede cambiar sin aviso
- OCAPI en producción (`/s/Chile/dw/...`) no requiere autenticación adicional pero podría bloquearse
- No expone precio online ni por tarjeta

---

### 2. Salcobrand

| Atributo | Valor |
|---|---|
| **Sitio** | salcobrand.cl |
| **Método** | Algolia Search API (pública) |
| **Endpoint** | `https://GM3RP06HJG-dsn.algolia.net/1/indexes/sb_variant_production/query` |
| **Parámetros** | `{ query, hitsPerPage: 24 }` en body POST |
| **Autenticación** | `X-Algolia-Application-Id` + `X-Algolia-API-Key` hardcoded del frontend |
| **Archivo** | `api/src/clients/salcobrand.ts` |

**Campos obtenidos:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `hit.name` | ✅ |
| Precio presencial | `hit.normal_price` | ✅ |
| Precio online | `hit.direct_discount` (si < presencial) | ✅ |
| Precio T. Más (CMR) | `hit.cmr_price` | ✅ |
| Precio SBPay | `hit.direct_discount_sbpay` | ✅ |
| Stock | `hit.has_stock` | ✅ |
| Despacho online | `hit.package_delivery` | ✅ |
| URL producto | Construida con `hit.slug` + `hit.sku` | ✅ |
| Imagen | `hit.catalog_image_url` | ✅ |
| Laboratorio | `hit.brand` | ✅ |
| Bioequivalente | `hit.bioequivalent_filter.has_bioequivalent` | ✅ |

**Limitaciones:**
- API key pública hardcoded — podría rotarse
- Es la farmacia con más canales de precio disponibles (4 canales)

---

### 3. Farmacias Ahumada

| Atributo | Valor |
|---|---|
| **Sitio** | farmaciasahumada.cl |
| **Método** | HTML Scraping — Demandware storefront |
| **Endpoint** | `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show` |
| **Parámetros** | `q`, `start=0`, `sz=24` |
| **Autenticación** | Ninguna (scraping web público) |
| **Archivo** | `api/src/clients/ahumada.ts` |

**Campos obtenidos:**

| Campo | Fuente | Disponible |
|---|---|---|
| Nombre | Regex `pdp-link` en HTML | ✅ |
| Precio presencial | Regex `content="(\d+)"` en HTML | ✅ |
| Precio CMR | Badge `badge_30x40_cmr_falabella` en HTML | ✅ |
| Precio online | — | ❌ |
| Stock | Hardcoded `true` (no disponible en HTML) | ⚠️ Siempre true |
| URL producto | `href` del link del tile | ✅ |
| Imagen | Regex `tile-image` en HTML | ✅ |
| Laboratorio | — | ❌ |
| Bioequivalente | Clase `bioequivalent-badge` en HTML | ✅ |

**Limitaciones:**
- 🔴 **MUY FRÁGIL** — cualquier cambio en el layout rompe el scraper silenciosamente
- OCAPI completamente bloqueado (probado con múltiples client_id y variantes de URL)
- No hay endpoint JSON alternativo sin autenticación
- Stock siempre reportado como `true` (no se puede determinar desde HTML)
- Para mejorar: interceptar app móvil de Ahumada para encontrar API interna

---

### 4. Dr. Simi

| Atributo | Valor |
|---|---|
| **Sitio** | drsimi.cl |
| **Método** | REST JSON — VTEX Catalog API (pública) |
| **Endpoint** | `https://www.drsimi.cl/api/catalog_system/pub/products/search/{query}` |
| **Parámetros** | `_from=0`, `_to=23` |
| **Autenticación** | Ninguna — API pública de VTEX |
| **Archivo** | `api/src/clients/drsimi.ts` |

**Campos obtenidos:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `product.productName` | ✅ |
| Precio presencial | `offer.ListPrice` | ✅ |
| Precio online | `offer.Price` (si < ListPrice) | ✅ |
| Precio tarjeta | — | ❌ |
| Stock | `offer.IsAvailable` + `offer.AvailableQuantity > 0` | ✅ |
| Despacho online | Hardcoded `true` | ⚠️ |
| URL producto | `product.link` | ✅ |
| Imagen | `items[0].images[0].imageUrl` | ✅ |
| Laboratorio | `product.brand` | ✅ |
| Bioequivalente | `product.Bioequivalente[0] === "SI"` | ✅ |

**Limitaciones:**
- `commertialOffer` es un typo heredado de VTEX (así se llama el campo en la API real)
- No expone precio con tarjeta ni descuentos por seguro
- Filtro `isRelevant()` para descartar resultados irrelevantes de la búsqueda VTEX

---

### 5. AraucoMed

| Atributo | Valor |
|---|---|
| **Sitio** | farmacia.araucomed.com |
| **Método** | REST JSON — endpoint ajax de PrestaShop (storefront, no admin API) |
| **Endpoint** | `https://farmacia.araucomed.com/?controller=search&s={query}&ajax=1` |
| **Headers** | `X-Requested-With: XMLHttpRequest`, `Accept: application/json` |
| **Autenticación** | Ninguna (endpoint público) |
| **Archivo** | `api/src/clients/araucomed.ts` |

**Campos obtenidos:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `product.name` | ✅ |
| Precio presencial | `product.price_amount` | ✅ |
| Precio online | — | ❌ |
| Stock | `product.active === 1` | ✅ |
| URL producto | `product.url` | ✅ |
| Imagen | `product.cover.bySize.home_default.url` | ✅ |
| Laboratorio | `product.manufacturer_name` | ✅ |
| Bioequivalente | Regex `/bioequivalen/i` sobre nombre + descripción | ✅ |

**Limitaciones actuales:**
- API REST admin (`/api/`, distinta de este endpoint ajax) existe pero requiere autenticación (401) — no se usa
- Solo 1 sucursal física (Quilicura, Santiago)
- Bioequivalente se infiere por texto, no por un campo estructurado — puede haber falsos negativos si el texto no incluye la palabra

---

## Farmacias en Backlog

---

### 6. EcoFarmacias 🕐

| Atributo | Valor |
|---|---|
| **Sitio** | ecofarmacias.cl |
| **Método** | WooCommerce Store API (pública, sin auth) |
| **Endpoint** | `https://www.ecofarmacias.cl/wp-json/wc/store/products?search={query}&per_page=24` |
| **Autenticación** | Ninguna |
| **Sucursales** | 64 (Valparaíso + Región Metropolitana) |
| **Esfuerzo** | ~2-3 horas |

**Campos disponibles en la API:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `product.name` | ✅ |
| Precio online | `product.prices.price` (string CLP) | ✅ |
| Precio con descuento | `product.prices.sale_price` vs `regular_price` | ✅ |
| Stock | `product.is_in_stock` (boolean) | ✅ |
| URL producto | `product.permalink` | ✅ |
| Imagen | `product.images[0].src` | ✅ |
| SKU / EAN | `product.sku` | ✅ |
| Bioequivalente | `"Bioequivalentes"` en `product.categories[].name` | ✅ |
| Receta requerida | `"Receta Simple"` en `product.categories[].name` | ✅ |
| Cenabast | `"Cenabast"` en `product.categories[].name` | ✅ |
| Laboratorio | — | ❌ |
| Precio presencial | — | ❌ (solo online) |

---

### 7. Farmex 🕐

| Atributo | Valor |
|---|---|
| **Sitio** | farmex.cl |
| **Método** | Shopify API (pública, sin auth) |
| **Endpoint búsqueda** | `https://farmex.cl/search/suggest.json?q={query}&resources[type]=product&resources[limit]=24` |
| **Endpoint producto** | `https://farmex.cl/products/{handle}.json` |
| **Autenticación** | Ninguna |
| **Esfuerzo** | ~2 horas |

**Campos disponibles en la API:**

| Campo | Fuente API | Disponible |
|---|---|---|
| Nombre | `product.title` | ✅ |
| Precio actual | `product.precio_actual` (integer CLP) | ✅ |
| Precio original | `product.precio_comparacion` (integer CLP) | ✅ |
| **Precio por unidad** | `product.precio_fraccionado` (integer CLP) | ✅ **Único** |
| Stock | `variants[0].available` (boolean) | ✅ |
| SKU / EAN | `variants[0].sku` (EAN-13) | ✅ |
| URL producto | Construida con `handle` | ✅ |
| Imagen | `product.imagenes[0].url` (CDN Shopify) | ✅ |
| Laboratorio | `product.laboratorio` / `vendor` | ✅ |
| **Indicaciones médicas** | `product.indicaciones` | ✅ **Único** |
| **Contraindicaciones** | `product.contraindicaciones` | ✅ **Único** |
| **Posología** | `product.posologia` | ✅ **Único** |
| Precio Fonasa | Vendor `"Farmex-Fonasa-Persistente"` | ✅ **Único** |
| Precio seguro (Metlife/Yapp) | Vendor tags | ✅ |
| Bioequivalente | — | ❌ |

**Nota:** Farmex tiene múltiples variantes del mismo medicamento con distintos precios según el seguro del paciente (Fonasa, Metlife, Yapp). Habrá que definir qué precio mostrar (el mínimo disponible).

---

### 8. COFAR 🔍

| Atributo | Valor |
|---|---|
| **Sitio** | cofar.cl |
| **Método** | Next.js SPA — requiere interceptar tráfico de red |
| **API** | Desconocida (backend propio, imágenes en S3 AWS) |
| **Autenticación** | Desconocida |
| **Especialidad** | Alto costo: oncológicos, VIH, hormona crecimiento, fertilidad, salud mental |
| **Esfuerzo** | ~4 horas (análisis de tráfico + implementación) |

**Campos estimados (pendiente verificar):**
- Precio, stock, imagen, nombre — standard
- Probablemente: laboratorio, principio activo, requiere receta

**Limitaciones:**
- Sitio completamente client-side rendered — WebFetch solo retorna HTML vacío
- Requiere Charles Proxy o mitmproxy en browser/app para capturar endpoints
- Especialidad muy acotada — no es farmacia de uso general

---

### 9. Liga Farmacia 🔍

| Atributo | Valor |
|---|---|
| **Sitio** | ligafarmacia.cl |
| **Método** | React SPA — requiere interceptar tráfico de red |
| **API** | Desconocida |
| **Autenticación** | Desconocida |
| **Especialidad** | Neurología, epilepsia, salud mental |
| **Operador** | Liga Chilena Contra la Epilepsia (sin fines de lucro) |
| **Cobertura** | RM y Concepción |
| **Esfuerzo** | ~4 horas (análisis de tráfico + implementación) |

**URL de producto observada:** `/product/007990030-samexid-30-mg`
- El código `007990030` es un código ISP (Instituto de Salud Pública), no un EAN
- Podrían cruzarse precios usando el código ISP como identificador común

**Limitaciones:**
- Catálogo acotado a medicamentos neurológicos/epilepsia
- Cobertura geográfica limitada (no nacional)
- Sin fines de lucro — precios pueden ser menores al mercado

---

## Comparativa de atributos por farmacia

| Atributo | Cruz Verde | Salcobrand | Ahumada | Dr. Simi | AraucoMed | EcoFarmacias | Farmex |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Precio presencial | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Precio online | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Precio tarjeta/CMR | ❌ | ✅ T.Más | ✅ CMR | ❌ | ❌ | ❌ | ❌ |
| Precio SBPay | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Precio Fonasa | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Precio por unidad | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Stock | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Imagen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| URL producto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Laboratorio | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Bioequivalente | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Receta requerida | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| SKU / EAN | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Indicaciones médicas | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Contraindicaciones | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Posología | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Método de obtención por farmacia

| Farmacia | Método | Riesgo de corte |
|---|---|---|
| Salcobrand | Algolia API pública | Bajo — API key puede rotar |
| Dr. Simi | VTEX Catalog API pública | Bajo — API oficial de la plataforma |
| EcoFarmacias | WooCommerce Store API pública | Bajo — endpoint estándar WooCommerce |
| Farmex | Shopify Search + Products API | Bajo — endpoint estándar Shopify |
| Cruz Verde | Demandware OCAPI (no oficial) | Medio — client_id no autorizado |
| AraucoMed | Endpoint ajax PrestaShop (no oficial pero JSON, sin regex) | Bajo-Medio |
| Ahumada | HTML Scraping Demandware | Alto — regex frágil, OCAPI bloqueado |
| COFAR | Desconocido (SPA) | — |
| Liga Farmacia | Desconocido (SPA) | — |
