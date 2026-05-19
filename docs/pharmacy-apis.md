# Pharmacy APIs — Referencia Técnica

Documentación de los endpoints usados para scraping de precios. Todos son consumidos desde `api/src/api/clients/` (nunca desde el mobile directamente).

---

## Cruz Verde — Demandware REST API

**Tipo**: REST JSON (Salesforce Commerce Cloud / Demandware)

### Endpoint
```
GET https://beta.cruzverde.cl/s/Chile/dw/shop/v19_1/product_search
```

### Headers requeridos
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
x-dw-client-id: c19ce24d-1677-4754-b9f7-c193997c5a92
Referer: https://www.cruzverde.cl/
```

### Query params
```
q=paracetamol
count=10
expand=prices,availability
client_id=c19ce24d-1677-4754-b9f7-c193997c5a92
```

### Response schema (simplificado)
```json
{
  "hits": [
    {
      "product_id": "7501059258874",
      "product_name": "Paracetamol 500 mg",
      "price": 2990,
      "orderable": true
    }
  ]
}
```

### Mapeo a PriceChannels
| Campo API | Campo modelo |
|---|---|
| `hit.price` | `channels.store` |
| *(no disponible)* | `channels.online = null` |
| *(no disponible)* | `channels.cmr = null` |
| `hit.orderable` | `hasStock` |

### URL de producto
```
https://www.cruzverde.cl/{slug-del-nombre}/{product_id}.html
```
Donde `slug-del-nombre` normaliza el nombre: lowercase, sin tildes, espacios → guiones.

### Quirks conocidos
- El campo `price` puede ser `null` para productos sin precio configurado — filtrar con `if (!price) return []`
- La API devuelve ~10 hits por defecto; con `count=10` es suficiente para búsqueda
- `beta.cruzverde.cl` es el dominio real de producción (no es staging)

---

## Salcobrand — Algolia Search API

**Tipo**: Algolia Search (índice: `sb_variant_production`)

### Endpoint
```
POST https://GM3RP06HJG-dsn.algolia.net/1/indexes/sb_variant_production/query
```

### Headers requeridos
```
X-Algolia-Application-Id: GM3RP06HJG
X-Algolia-API-Key: 0259fe250b3be4b1326eb85e47aa7d81
Referer: https://salcobrand.cl/
Origin: https://salcobrand.cl
Content-Type: application/json
```

### Body
```json
{
  "query": "paracetamol",
  "hitsPerPage": 10
}
```

### Response schema (simplificado)
```json
{
  "hits": [
    {
      "name": "Paracetamol 500 mg Comprimidos",
      "normal_price": 3290,
      "direct_discount": "2490.0",
      "internet_price": null,
      "cmr_price": null,
      "has_stock": true,
      "package_delivery": true,
      "slug": "paracetamol-500mg",
      "sku": "6001234",
      "brand": "Bestpharma",
      "bioequivalent_filter": { "has_bioequivalent": true }
    }
  ]
}
```

### Mapeo a PriceChannels
| Campo API | Campo modelo | Notas |
|---|---|---|
| `hit.normal_price` | `channels.store` | Precio presencial (siempre presente) |
| `hit.direct_discount` | `channels.online` | Solo si `parseFloat(direct_discount) < normal_price` |
| `hit.cmr_price` | `channels.cmr` | Precio Tarjeta Más — presente en algunos productos; null si no aplica |
| `hit.internet_price` | *(ignorar)* | Campo presente pero siempre null en el índice |
| `hit.has_stock` | `hasStock` | |
| `hit.package_delivery` | `hasOnlineDelivery` | |

### URL de producto
```
https://salcobrand.cl/products/{slug}?default_sku={sku}
```
Si solo hay `slug` sin `sku`: `https://salcobrand.cl/products/{slug}`

### Quirks conocidos
- `direct_discount` es un **string** (`"2490.0"`), no number — usar `parseFloat()`
- `cmr_price` corresponde al precio **Tarjeta Más Salcobrand**. Aparece para algunos productos; null cuando no aplica el descuento. El campo `internet_price` siempre es null en el índice.
- La clave `X-Algolia-API-Key` es una search-only key (solo lectura). Aún así no debe ir en el binario de la app.

---

## Farmacias Ahumada — HTML Scraping (Demandware Storefront)

**Tipo**: HTML scraping con regex (el endpoint es un storefront Demandware, no una API pública)

> **ADVERTENCIA**: Este scraper es el más frágil. Si Ahumada actualiza su layout, puede fallar silenciosamente. Ver sección de mantenimiento más abajo.

### Endpoint
```
GET https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show?q=paracetamol&start=0&sz=10
```

### Headers requeridos
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Referer: https://www.farmaciasahumada.cl/
Accept: text/html
```

### Estructura HTML relevante

El HTML devuelve una lista de "product tiles". Cada tile tiene la forma:
```html
<div class="product product-tile-wrapper" data-pid="7501059258874">
  <!-- Nombre y URL del producto -->
  <div class="pdp-link">
    <a href="/paracetamol-500mg/p/7501059258874.html">Paracetamol 500 mg</a>
  </div>

  <!-- Precio badge (puede contener precio normal O precio CMR) -->
  <div class="promotion-badge-container ...">
    $2.990
  </div>

  <!-- Badge CMR Falabella (presente solo cuando hay precio CMR) -->
  <img src="...badge_30x40_cmr_falabella..." content="2490" />
</div>
```

### Lógica de extracción de precios (CRÍTICA)

La lógica más compleja del proyecto. Ver `api/src/api/clients/ahumada.ts` para el código exacto.

**Caso 1: Tile sin badge CMR**
- `promotion-badge-container` contiene directamente el precio presencial
- `channels.store = badgePrice`
- `channels.cmr = null`

**Caso 2: Tile con badge CMR** (`block.includes("badge_30x40_cmr_falabella")`)
- El `promotion-badge-container` contiene el **precio CMR** (más bajo)
- Los atributos `content="XXXX"` en el tile contienen valores numéricos — el **precio presencial** es el menor `content=` que supere al precio CMR
- `channels.store = min(content values > cmrPrice)`
- `channels.cmr = badgePrice`

**Parser de precios CLP** (`clp()` function):
```typescript
function clp(str: string): number | null {
  const m = str.replace(/\./g, "").replace(",", ".").match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n > 100 ? n : null;  // filtro de ruido
}
```

**Decodificación HTML** (`decodeHtml()` function):
- Convierte entidades HTML: `&aacute;` → `á`, `&ntilde;` → `ñ`, etc.
- Importante para mostrar nombres correctamente en español

### Mapeo a PriceChannels
| Fuente HTML | Campo modelo |
|---|---|
| `promotion-badge-container` precio (sin CMR) | `channels.store` |
| `promotion-badge-container` precio (con CMR) | `channels.cmr` |
| `content=` menor que supera CMR price | `channels.store` |
| *(no disponible directamente)* | `channels.online = null` |

### URL de producto
```
https://www.farmaciasahumada.cl{href-del-pdp-link}
```
Si el `href` ya empieza con `http`, usarlo tal cual.

### Mantenimiento del scraper

Cuando el scraper devuelve 0 resultados para Ahumada (y debería devolver algo):

1. Abrir `https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/es_CL/Search-Show?q=paracetamol&start=0&sz=10` en browser → Guardar HTML
2. Buscar en el HTML los containers de precio actuales
3. Actualizar los regex en `api/src/api/clients/ahumada.ts`:
   - `tileRe` — regex del div wrapper de cada producto
   - `linkM` — regex para extraer nombre y URL
   - `badgeM` — regex del container de precio
4. Actualizar el fixture de test en `api/src/api/clients/__tests__/ahumada.test.ts`

---

## Variables de Entorno (Vercel)

```
CRUZVERDE_CLIENT_ID=c19ce24d-1677-4754-b9f7-c193997c5a92
ALGOLIA_APP_ID=GM3RP06HJG
ALGOLIA_API_KEY=0259fe250b3be4b1326eb85e47aa7d81
```

Todas se configuran en el dashboard de Vercel, nunca en archivos commiteados.
