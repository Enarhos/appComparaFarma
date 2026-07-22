# Canales de Precio — Contexto Chileno

Explica la semántica de los cuatro canales de precio que maneja la app y su disponibilidad por farmacia.

---

## Los Cuatro Canales

### 1. Presencial (`store`)

**Qué es**: El precio que pagas al ir físicamente a la farmacia y comprar en caja. También llamado "precio de vitrina" o "precio normal".

**Disponibilidad**: Presente en las 5 farmacias que cubre este documento (Cruz Verde, Salcobrand, Ahumada, Dr. Simi, AraucoMed) — de las 9 integradas en total, las otras 4 (EcoFarmacias, Farmex, Sermecoop, EasyFarma) no están documentadas todavía en este archivo.

**En el modelo**: Campo `channels.store: number` — siempre presente, nunca null.

---

### 2. Online / Internet (`online`)

**Qué es**: El precio exclusivo para compras realizadas a través del sitio web o app de la farmacia, que incluye delivery a domicilio o retiro en tienda (click & collect). Generalmente más bajo que el precio presencial porque elimina costos de atención.

**Disponibilidad**:
- **Cruz Verde**: ❌ No disponible. La API de Demandware expone un solo precio unificado.
- **Salcobrand**: ✅ Campo `direct_discount` en Algolia cuando es menor que `normal_price`.
- **Ahumada**: ❌ No disponible en el scraper actual.
- **Dr. Simi**: ✅ Se usa `Price` cuando es menor que `ListPrice`.
- **AraucoMed**: ❌ No aplica — un solo precio expuesto por el endpoint.

**En el modelo**: Campo `channels.online: number | null`.

---

### 3. CMR / Tarjeta Falabella (`cmr`)

**Qué es**: Precio exclusivo para clientes que pagan con **Tarjeta CMR Falabella** (tarjeta de crédito de tiendas Falabella). Es el precio más bajo disponible cuando existe, pero requiere tener y usar la tarjeta al momento de pago.

**Contexto chileno**: Farmacias Ahumada puede mostrar precio CMR en su storefront. En la implementación actual, Salcobrand usa `cmr_price` como precio de Tarjeta Más cuando viene informado, aunque el naming del campo conserve esa etiqueta.

**Disponibilidad**:
- **Cruz Verde**: ❌ No aplica.
- **Salcobrand**: ✅ Se toma desde `cmr_price` cuando existe.
- **Ahumada**: ✅ Detectado mediante la presencia de la imagen `badge_30x40_cmr_falabella` en el tile y el atributo `content=` de esa imagen.
- **Dr. Simi**: ❌ No aplica.
- **AraucoMed**: ❌ No aplica.

**En el modelo**: Campo `channels.cmr: number | null`.

---

### 4. SBPay (`sbpay`)

**Qué es**: Precio asociado al medio de pago SBPay o beneficio equivalente expuesto por Salcobrand.

**Disponibilidad**:
- **Cruz Verde**: ❌ No aplica.
- **Salcobrand**: ✅ Se toma desde `direct_discount_sbpay` cuando mejora el precio presencial.
- **Ahumada**: ❌ No aplica.
- **Dr. Simi**: ❌ No aplica.
- **AraucoMed**: ❌ No aplica.

**En el modelo**: Campo `channels.sbpay: number | null`.

---

## Precio Efectivo (`effective`)

El campo `channels.effective` representa **el mejor precio real disponible** para ese medicamento en esa farmacia, sin considerar restricciones (el usuario puede no tener tarjeta CMR, puede no querer comprar online, etc.).

```typescript
effective = Math.min(
  channels.store,
  channels.online ?? channels.store,
  channels.cmr ?? channels.store,
  channels.sbpay ?? channels.store
)
```

Se usa para:
- Ordenar farmacias dentro de una tarjeta de medicamento (de menor a mayor)
- Mostrar el badge "Mejor precio" en la farmacia con el `effective` más bajo
- Ordenar la lista de resultados de búsqueda

**Nota de UX**: La app siempre muestra los 3 canales cuando están disponibles (no oculta el precio presencial si hay un online más bajo). El usuario decide cuál le conviene según sus circunstancias.

---

## Matriz de Disponibilidad por Farmacia

| Farmacia | `store` | `online` | `cmr` | `sbpay` | `effective` |
|---|---|---|---|---|---|
| Cruz Verde | ✅ | ❌ null | ❌ null | ❌ null | = store |
| Salcobrand | ✅ | ✅ si < store | ✅ si viene `cmr_price` | ✅ si mejora `direct_discount_sbpay` | min(store, online, cmr, sbpay) |
| Ahumada | ✅ | ❌ null | ✅ si hay badge | ❌ null | min(store, cmr) |
| Dr. Simi | ✅ | ✅ si `Price < ListPrice` | ❌ null | ❌ null | min(store, online) |
| AraucoMed | ✅ | ❌ null | ❌ null | ❌ null | = store |

---

## Representación en la UI

Cada fila de farmacia en `PriceRow` muestra hasta 4 columnas de precio:

```
┌─────────────────────────────────────────┐
│ 🟢 SALCOBRAND                           │
│                                         │
│  Presencial    Online      CMR      SBPay│
│   $3.290       $2.490      —        $2.290✓│
│                          (mejor precio)   │
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
Si un client falla (timeout, cambio de API, etc.), la farmacia simplemente no aparece en los resultados de ese medicamento. `Promise.allSettled()` en `mobile/src/lib/search.ts` garantiza que la falla de una no cancele las otras.
