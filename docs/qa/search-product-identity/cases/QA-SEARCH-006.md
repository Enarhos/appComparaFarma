# QA-SEARCH-006 — El "mejor precio" sale de una oferta sin stock en el 16 % de las tarjetas, y el stock no es comparable entre farmacias

| Campo | Valor |
|---|---|
| **Severidad** | **P2** — la comparación es usable, pero el titular es engañoso |
| **Clasificación** | `DATA_QUALITY` / `MISLEADING_HEADLINE` |
| **Test** | 10 (precio sospechoso) y 11 (stock) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |
| **Reproducibilidad** | Determinista sobre los datos capturados |

## Parte A — `bestPrice` desde una oferta sin stock

De 2.347 tarjetas, **375 (16,0 %)** tienen su `bestPrice` en una oferta con
`hasStock: false`. De esas, **63 son tarjetas multi-farmacia**, es decir donde el
precio más bajo mostrado como resultado de la comparación no se puede comprar.

```
aspirina|500mg|20|bio:unknown|brand:unknown|form:solid-oral   ratio 3,77
  ecofarmacias  $900   stock=false   "Aspirina Adulto 500mg X 20 comprimidos (Bayer) DESCUENTO"
  araucomed     $1.500 stock=true    "Aspirina 500 mg x 20 comprimidos."
  sermecoop     $2.190 stock=true
  ahumada       $2.669 stock=true (CMR)
  cruz-verde    $3.390 stock=true
```

El titular de esa tarjeta es $900, un producto agotado; el mínimo real comprable es
$1.500 (67 % más).

Verificado también que el estado de stock **sí queda asociado a su propia oferta**
(test 11): 0 anomalías de tipo, ningún `hasStock` cruzado entre ofertas, ninguna
oferta sin `onlineUrl` (0/2.627). El problema no es la asociación: es que
`bestPrice`/`bestPharmacy` se calculan ignorando el stock
(`packages/domain/src/deduplication.ts` → `buildResult()`, `prices[0]` tras ordenar
solo por `channels.effective`).

**No se recomienda eliminar precios sin stock** (contradiría la instrucción explícita
del ticket y perdería señal de precio histórico). Lo que corresponde es que el titular
distinga disponible de no disponible.

## Parte B — el dato de stock no es comparable entre las 9 farmacias

| Farmacia | Ofertas | Sin stock | % | Cómo se deriva |
|---|---|---|---|---|
| ecofarmacias | 298 | 183 | 61,4 % | `p.is_in_stock ?? false` (`ecofarmacias.ts:58`) |
| sermecoop | 91 | 58 | 63,7 % | ausencia de "Agotado"/"No Disponible" en el HTML (`sermecoop.ts:49`) |
| araucomed | 424 | 130 | 30,7 % | `stockMap` + `p.active === 1` (`araucomed.ts:71`) |
| farmex | 155 | 10 | 6,5 % | `primary.available` (`farmex.ts:73`) |
| cruz-verde | 398 | 22 | 5,5 % | `hit.orderable ?? true` (`cruzverde.ts:62`) |
| dr-simi | 194 | 10 | 5,2 % | `IsAvailable && AvailableQuantity > 0` (`drsimi.ts:70`) |
| salcobrand | 418 | **0** | 0 % | `hit.has_stock ?? true` (`salcobrand.ts:42`) — el `?? true` sugiere que el campo no viene |
| **ahumada** | 404 | **0** | 0 % | **`hasStock: true` hardcodeado** (`ahumada.ts:106`) |
| **easyfarma** | 245 | **0** | 0 % | **`hasStock: true` hardcodeado** (`easyfarma.ts:113`) |

Dos de los nueve adaptadores **afirman disponibilidad sin ningún dato de origen**. Es
exactamente el patrón que PR #141 corrigió para bioequivalencia (dejar de afirmar
`false` donde la fuente no informa), aplicado al campo de stock y todavía sin corregir.
En EasyFarma el propio comentario del código lo reconoce: *"No hay canal online/CMR/SBPay
distinto ni indicador de stock a nivel de listado"* — y aun así publica `true`.

Consecuencia combinada con la parte A: las farmacias que **sí** informan stock honesto
(EcoFarmacias 61 %, Sermecoop 64 % agotado) son las que quedan como "mejor precio"
falso, mientras las que afirman `true` sin dato nunca aparecen como no disponibles.

## Parte C — outliers de precio investigados

16 tarjetas con `max/min ≥ 3`. Clasificación tras revisión manual una por una
(`analysis/findings.json` → `findings.priceOutlier`):

| Causa | Tarjetas | Ejemplo |
|---|---|---|
| Legítimo — el mínimo es una oferta **sin stock** (liquidación / Cenabast agotado) | 8 | `losartan\|50mg\|30\|bio:true` $490 agotado vs $1.528 disponible |
| Legítimo — dispersión real entre canal público/Cenabast y retail, todo con stock | 5 | `SAE x 6 supositorios`: eco (Cenabast) $3.950 vs ahumada $14.677 |
| **Producto distinto** — concentración (QA-SEARCH-001) | 1 | `ambroxol\|100ml` 15 vs 30 mg/5 mL |
| **Producto distinto** — liberación prolongada vs convencional | 2 | `diclofenaco\|100mg\|8`: "8 Comprimidos" vs "8 Cápsulas de Liberación Prolongada"; `ketoprofeno\|200mg\|10` idem |
| Unidad vs caja | 0 | — (ver QA-SEARCH-008: no se encontró ninguno) |
| Precio de otro producto (integridad) | 0 | — (test 5: 0 anomalías) |

Los 2 casos de liberación prolongada son un hallazgo menor propio: `dosageFormClass`
clasifica "comprimido" y "cápsula de liberación prolongada" como el mismo
`solid-oral`, así que el eje `form:` no los distingue. Se registra como observación,
no como issue independiente: el impacto medido es 2 tarjetas.

## Evidencia

- `analysis/findings.json` → `priceOutlier` (16), `stockAnomaly` (0)
- `analysis/offers.csv` — columnas `stock`, `price`, `channel`
- Adaptadores citados con archivo:línea

## Issues recomendados

- `CF-DATA-003 — Stock afirmado sin evidencia` (P2). Mismo criterio que PR #141:
  Ahumada y EasyFarma no deben publicar `hasStock: true` si su fuente no lo informa.
  Requiere que el contrato admita "desconocido" — hoy `hasStock` es `boolean`, no
  `boolean | null`. **Cambio de contrato en `packages/domain/src/types.ts`** ⇒ si se
  implementa, hay que incrementar `CACHE_PREFIX` en `mobile/src/lib/cache.ts`
  (`CLAUDE.md` §11).
- `CF-WEB-003 — Titular de mejor precio y disponibilidad` (P2/P3): distinguir en la
  tarjeta el precio más bajo del precio más bajo **comprable**.
