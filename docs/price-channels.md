# Canales de Precio — Contexto Chileno

Explica la semántica de los tres canales de precio que maneja la app y su disponibilidad por farmacia.

---

## Los Tres Canales

### 1. Presencial (`store`)

**Qué es**: El precio que pagas al ir físicamente a la farmacia y comprar en caja. También llamado "precio de vitrina" o "precio normal".

**Disponibilidad**: Presente en las **3 farmacias**.

**En el modelo**: Campo `channels.store: number` — siempre presente, nunca null.

---

### 2. Online / Internet (`online`)

**Qué es**: El precio exclusivo para compras realizadas a través del sitio web o app de la farmacia, que incluye delivery a domicilio o retiro en tienda (click & collect). Generalmente más bajo que el precio presencial porque elimina costos de atención.

**Disponibilidad**:
- **Cruz Verde**: ❌ No disponible. La API de Demandware expone un solo precio unificado.
- **Salcobrand**: ✅ Campo `direct_discount` en Algolia cuando es menor que `normal_price`.
- **Ahumada**: ✅ Se detecta mediante badges alternativos en el HTML del storefront.

**En el modelo**: Campo `channels.online: number | null`.

---

### 3. CMR / Tarjeta Falabella (`cmr`)

**Qué es**: Precio exclusivo para clientes que pagan con **Tarjeta CMR Falabella** (tarjeta de crédito de tiendas Falabella). Es el precio más bajo disponible cuando existe, pero requiere tener y usar la tarjeta al momento de pago.

**Contexto chileno**: El Grupo Falabella es dueño tanto de Farmacias Ahumada como de CMR (tarjeta de crédito). Esta integración explica por qué Ahumada es la única que tiene este canal. Salcobrand también pertenece a un grupo que tiene tarjeta propia, pero los datos de CMR no están expuestos en su índice de Algolia.

**Disponibilidad**:
- **Cruz Verde**: ❌ No aplica.
- **Salcobrand**: ❌ El campo `cmr_price` existe en el objeto del producto pero **no está disponible en el índice de búsqueda de Algolia** (siempre null). Solo se obtiene en la página de producto con sesión activa (fuera del alcance del MVP).
- **Ahumada**: ✅ Detectado mediante la presencia de la imagen `badge_30x40_cmr_falabella` en el tile y el atributo `content=` de esa imagen.

**En el modelo**: Campo `channels.cmr: number | null`.

---

## Precio Efectivo (`effective`)

El campo `channels.effective` representa **el mejor precio real disponible** para ese medicamento en esa farmacia, sin considerar restricciones (el usuario puede no tener tarjeta CMR, puede no querer comprar online, etc.).

```typescript
effective = Math.min(
  channels.store,
  channels.online ?? channels.store,
  channels.cmr ?? channels.store
)
```

Se usa para:
- Ordenar farmacias dentro de una tarjeta de medicamento (de menor a mayor)
- Mostrar el badge "Mejor precio" en la farmacia con el `effective` más bajo
- Ordenar la lista de resultados de búsqueda

**Nota de UX**: La app siempre muestra los 3 canales cuando están disponibles (no oculta el precio presencial si hay un online más bajo). El usuario decide cuál le conviene según sus circunstancias.

---

## Matriz de Disponibilidad por Farmacia

| Farmacia | `store` | `online` | `cmr` | `effective` |
|---|---|---|---|---|
| Cruz Verde | ✅ | ❌ null | ❌ null | = store |
| Salcobrand | ✅ | ✅ si < store | ❌ null (MVP) | min(store, online) |
| Ahumada | ✅ | ❌ null (MVP) | ✅ si hay badge | min(store, cmr) |

---

## Representación en la UI

Cada fila de farmacia en `PriceRow` muestra hasta 3 columnas de precio:

```
┌─────────────────────────────────────────┐
│ 🟢 SALCOBRAND                           │
│                                         │
│  Presencial    Online      CMR          │
│   $3.290       $2.490 ✓    —            │
│              (mejor precio)             │
└─────────────────────────────────────────┘
```

- La columna con el precio `effective` se marca en verde (highlight)
- Canales no disponibles muestran "—" (no se ocultan, para que el usuario entienda que NO existe ese canal)
- El badge "Mejor precio" aparece solo en la farmacia con el `effective` más bajo entre todas

---

## Casos Especiales

### Sin stock (`hasStock: false`)
El producto se muestra con los precios en gris y una etiqueta "Sin stock". Se incluye en la comparación para que el usuario sepa el precio de referencia aunque no esté disponible hoy.

### Farmacia sin resultados (error de scraping)
Si un scraper falla (timeout, cambio de API, etc.), la farmacia simplemente no aparece en los resultados de ese medicamento. `Promise.allSettled()` en el API garantiza que la falla de una no cancele las otras dos.
