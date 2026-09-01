# CF-SEARCH-010 — Estrategia de migración y compatibilidad

Propuesta de diseño. **No implementada.**

**Restricción central:** no hay big bang. Nada de lo que ya existe puede dejar
de funcionar en ningún momento de la transición.

---

## 1. Inventario de contratos que NO se pueden romper

Verificado leyendo el código y `docs/technology/database/schema.sql`.

### 1.1 `matchKey` — persistido en cuatro lugares

| Tabla / superficie | Uso | Archivo |
|---|---|---|
| `price_history.match_key` | `not null`; parte del índice único `(match_key, pharmacy_slug, recorded_date)` y del índice `(match_key, recorded_date)` | `api/src/lib/priceHistoryDb.ts:34,51` |
| `pharmacy_clicks.match_key` | `not null`; se escribe en cada click de `/api/go` | `api/src/lib/clickTracking.ts:30` |
| `email_alerts.match_key` | `not null`; el cron de alertas busca por él | `api/src/routes/alerts.ts:133,213` |
| `medication_match_key_aliases.match_key` | **primary key**; traduce a `cfm_id` | `api/src/lib/medicationRegistry.ts:31` |
| `medications.match_key_current` | `not null` | `schema.sql:105` |
| Mobile: favoritos | `favoritesStore.keys[]` — AsyncStorage en dispositivos reales | `mobile/src/store/favoritesStore.ts:20` |
| Mobile: carrito | `cartStore.items[].matchKey` | `mobile/src/store/cartStore.ts:22` |
| Mobile: alertas | `alertsStore.alerts[].matchKey` | `mobile/src/store/alertsStore.ts:46` |
| Web: histórico de precios | `GET /api/price-history?matchKey=…` | `api/src/lib/priceHistoryQuery.ts` |

**No hay migraciones automatizadas** (`schema.sql:3`: *"las tablas se crean a
mano en el SQL Editor de Supabase"*). Cualquier cambio de esquema es una acción
humana.

### 1.2 `presentationKey` — no persistido, pero gobierna el ruteo

| Uso | Archivo |
|---|---|
| Clave de agrupación de `mergeDuplicates` | `deduplication.ts:193` |
| **Input de `shortHash()` ⇒ sufijo del slug de ficha** | `web/src/lib/medicationSlug.ts:164` |
| 6 generaciones de fallback en el resolver | `web/src/lib/resolveMedication.ts:285-362` |
| Resolución de ficha en Mobile | `mobile/src/lib/resolveMedicationCard.ts:35` |
| `CACHE_PREFIX` de AsyncStorage (v12) | `mobile/src/lib/cache.ts` |

### 1.3 Contrato público

`GET /api/search` devuelve un **`MedicationResult[]` desnudo**. Los binarios de
Mobile ya publicados lo leen así (`types.ts:97`: *"envolverlo los rompería"*).

---

## 2. Principio de migración: **aditivo, nunca sustitutivo**

`matchKey` y `presentationKey` **se siguen calculando exactamente igual y siguen
viajando en la respuesta, indefinidamente.** No se renombran, no se recalculan,
no se "mejoran". Pasan de ser *la identidad* a ser *identificadores legacy de
compatibilidad*.

```ts
interface MedicationResult {
  // --- LEGACY, congelados, siempre presentes ---
  matchKey: string;              // sin cambios de cálculo
  presentationKey: string;       // sin cambios de cálculo
  cfmId?: string | null;         // RFC-002, sin cambios

  // --- NUEVOS, aditivos y opcionales ---
  conceptId?: string | null;
  presentationId?: string | null;
  productId?: string | null;
}
```

Un cliente que ignore los tres campos nuevos **se comporta exactamente igual que
hoy**. Es el mismo patrón aditivo que ya usaron `presentationKey` (FASE 1),
`cfmId` (RFC-002), `lexicalMatch`/`concentrationMatch` (CF-SEARCH-002) y
`brand`/`manufacturer`/`activeIngredient` (CF-DATA-001) — cuatro precedentes
exitosos en este mismo repositorio.

---

## 3. Mapping legacy → canónico

Tabla puente, poblada por observación, nunca por adivinanza:

```sql
create table if not exists identity_legacy_map (
  legacy_kind        text not null,        -- 'match_key' | 'presentation_key'
  legacy_value       text not null,
  concept_id         text,
  presentation_id    text,
  product_id         text,
  confidence         text not null,        -- 'exact' | 'inferred' | 'ambiguous'
  first_seen_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  primary key (legacy_kind, legacy_value)
);
alter table identity_legacy_map enable row level security;
```

Se puebla **durante el shadow mode**, sin coste adicional: cada corrida ya
calcula ambas identidades sobre la misma oferta.

**Relaciones esperadas, medidas hoy:**

| Relación | Cardinalidad medida |
|---|---|
| `matchKey` → `conceptId` | 440 → ~292. **N:1 mayoritario, con excepciones** |
| `presentationKey` → `productId` | 874 → ? **1:N en 4 claves conocidas** (cada una produce 2 tarjetas) |

`matchKey` **no** es N:1 limpio: `ambroxol|100ml` agrupa 15 mg/5 mL **y**
30 mg/5 mL, es decir dos conceptos distintos. Esos casos se marcan
`confidence: 'ambiguous'` y **no se migran automáticamente** — el histórico
sigue leyéndose por `match_key`, que es donde está el dato.

---

## 4. Secuencia (8 pasos, cada uno reversible)

| Paso | Qué | Riesgo | Reversión |
|---|---|---|---|
| **M0** | Crear las tablas nuevas en Supabase (SQL manual). Nada las lee | Nulo | `drop table` |
| **M1** | Capturar `sourceProductId` e `ispRegistration` en los adaptadores que ya los exponen. Campos aditivos de `ScrapedProduct`. **No alimentan ninguna clave** | Bajo — toca 2 de 9 adaptadores | Revertir el PR |
| **M2** | Motor v2 en shadow (fases S0-S2 de `SHADOW_MODE_DESIGN.md`). Puebla `identity_legacy_map` | Bajo (regla 2 del shadow: no escribe en tablas productivas) | Apagar el flag |
| **M3** | **Dual write**: `price_history` y `pharmacy_clicks` ganan `concept_id`/`product_id` **nullable**, además de `match_key`, que sigue `not null` | Bajo — columnas aditivas, mismo patrón que `cfm_id` en RFC-002 | Ignorar las columnas |
| **M4** | **Dual read** en `/api/price-history`: unir series por `match_key` **o** por `concept_id`. **Acá se recupera histórico que hoy está partido** (los 78 nombres del defecto `x 100 ml`) | Medio — cambia lo que ve el gráfico | Volver a leer solo `match_key` |
| **M5** | Web sirve v2 detrás de flag. Slugs nuevos usan `productId`; los viejos siguen resolviendo por las 6 generaciones + `identity_legacy_map` | Medio — SEO | Apagar el flag |
| **M6** | Alertas y favoritos migran a `productId`, **conservando `matchKey`** como campo de compatibilidad | Medio | Los dos campos coexisten |
| **M7** | Mobile consume `productId` en una versión nueva. Las versiones viejas siguen usando `presentationKey`/`matchKey`, que nunca desaparecieron | Bajo | Ninguna acción: las viejas ya funcionan |

**Ningún paso borra nada. Ningún paso hace `not null` una columna nueva.**

---

## 5. URLs, redirects y SEO

| Situación | Comportamiento |
|---|---|
| Slug viejo (Gen 1-6) | Resuelve por la cadena existente → `301` al slug canónico nuevo. **La cadena de generaciones no se toca ni se amplía** |
| Slug viejo cuya identidad ya no existe | Hoy: 404 tras golpear a las 9 farmacias. Con `identity_legacy_map`: resuelve por tabla sin red |
| Slug nuevo | `productId` directo, sin red |
| Colisión de hash (4 pares medidos) | **Desaparece**: `productId` es único por construcción |

**El punto que cambia todo el balance de riesgo/beneficio del SEO:** hoy, cada
mejora de identidad rota los slugs. CF-SEARCH-003 midió que meter la
concentración en la clave rotaría el 23,4 % de las URLs; CF-WEB-002 midió que
meter cantidad + concentración rotaría el 72,6 %; BIOEQ-01 rotó el 81,7 % y
necesitó Gen 6-bio.

Con `productId` persistido, **es la última rotación**. Después de v2, mejorar la
identidad ya no rota ninguna URL, porque el ID no se deriva del algoritmo.

---

## 6. Históricos de precio

**No se migran datos.** `price_history` conserva `match_key` como está.

- **Antes de M4:** el gráfico consulta por `match_key` — comportamiento actual,
  bit a bit.
- **Después de M4:** consulta por `match_key` **o** por `concept_id` cuando
  `identity_legacy_map` lo resuelve con `confidence: 'exact'`.

Efecto positivo medible: los **78 nombres distintos** cuyo `matchKey` incluye un
volumen leído como cantidad (`ambroxol|100ml|100` vs `ambroxol|100ml`) tienen
hoy su histórico partido en dos series. M4 las reúne **sin reescribir una sola
fila**.

Los `matchKey` marcados `ambiguous` (los que agrupan dos conceptos, como
`ambroxol|100ml`) **no se unifican**: se sigue leyendo por `match_key`. Preferir
un histórico incompleto antes que uno contaminado es la misma política
conservadora de siempre.

---

## 7. Alertas de email

`email_alerts.match_key` gobierna el cron. Riesgo específico ya documentado
(`alerts.ts:190`): desde que `matchKey` dejó de ser único por tarjeta, la alerta
resuelve con `cheapestByMatchKey()` — **la más barata** entre las que comparten
`matchKey`, que puede ser otro producto.

Migración: `email_alerts` gana `product_id` **nullable**. Alertas nuevas lo
llenan; las existentes siguen por `match_key`. El cron prefiere `product_id`
cuando está.

**Ninguna alerta activa se invalida, se reescribe ni se cancela.** Son
direcciones de correo de usuarios reales que pidieron ser notificados: romper
una alerta es romper una promesa explícita.

---

## 8. Mobile — favoritos, carrito, historial

El caso más delicado: **son datos en dispositivos de usuarios reales, fuera de
nuestro control.**

`CF-SEARCH-001` ya dejó esto como `FOLLOW_UP` explícito, pendiente de decisión
de producto: marcar un Tapsin como favorito puede restaurar otro, porque
`matchKey` dejó de ser único por tarjeta.

Estrategia propuesta:

1. `matchKey` **se sigue guardando**. Nunca se borra un favorito existente.
2. Las entradas nuevas guardan `matchKey` **y** `productId`.
3. Al restaurar: `productId` si está; si no, `matchKey` (comportamiento actual).
4. **No hay migración retroactiva de datos locales.** Las entradas viejas siguen
   resolviendo como hoy, con la imprecisión que ya tienen.
5. `CACHE_PREFIX` se incrementa a `v13` **solo** cuando `MedicationResult` gane
   los campos nuevos (`CLAUDE.md` §11).

> `NEEDS_DECISION`: si además se quiere **corregir** los favoritos ya guardados
> (no solo dejar de degradarlos), hace falta una decisión de producto sobre si
> vale la pena para el volumen real de colisiones. Es el mismo `FOLLOW_UP` que
> CF-SEARCH-001 dejó abierto y que sigue sin resolverse.

---

## 9. Qué NO se hace nunca

| Prohibido | Por qué |
|---|---|
| Cambiar el cálculo de `matchKey` | Invalida 4 tablas y los datos locales de Mobile |
| Cambiar el cálculo de `presentationKey` | Rota slugs indexados y la ficha de Mobile |
| Borrar filas de `price_history` | Es Patrimonio Digital (DAR-200, EDM-200: *"su evolución histórica permanece"*) |
| Hacer `not null` una columna nueva | Rompe escrituras en vuelo |
| Reescribir `email_alerts` | Compromiso con usuarios reales |
| Migrar Mobile antes que Web | Los binarios publicados no se revierten con un flag |
| Un big bang | Explícitamente prohibido por el ticket |
