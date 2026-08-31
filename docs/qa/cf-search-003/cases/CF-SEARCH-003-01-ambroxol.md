# CF-SEARCH-003-01 — Ambroxol jarabe: 30 mg/5 mL fusionado con 15 mg/5 mL

| Campo | Valor |
|---|---|
| **Consulta** | `ambroxol` |
| **`presentationKey`** | `ambroxol\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` |
| **Estado en base** | Reproducido en `origin/main@2400fca` (captura 2026-08-31) |
| **Estado en branch** | Corregido |
| **Datos** | `../raw/ambroxol.json` |

## Ofertas de la tarjeta (base)

| Farmacia | `rawProductName` | Concentración detectada (branch) | Precio |
|---|---|---|---|
| ecofarmacias | `Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO` | `30mg` (masa absoluta — sin barra) | $990 |
| sermecoop | `Ambroxol 30mg/5ml Jarabe 100ml` | `30mg/5ml` | $2.390 |
| ahumada | `Ambroxol 30mg./5ml. Jarabe Fco. 100ml` | `30mg/5ml` | $3.374 |
| cruz-verde | `Ambroxol 15 mg/5mL Jarabe 100 mL` | **`15mg/5ml`** | $5.490 |

Ejes de identidad, idénticos en las 4 ofertas (por eso comparten tarjeta):

| Eje | Valor |
|---|---|
| `matchKey` | `ambroxol\|100ml` ← **el volumen del envase, no la concentración** |
| `dosageFormClass` | `fluid-oral` |
| `unitCountKey` | `null` |
| `commercialVariantKey` | `null` |
| `combinationKey` | `null` |
| `bio` / `brand` | `unknown` / `unknown` |

## Por qué es un defecto

La oferta "más cara" tiene **la mitad de concentración**. La tarjeta muestra
$990 vs $5.490 como si fueran el mismo producto: un usuario lee que Cruz Verde
vende lo mismo 5,5 veces más caro, cuando en realidad son dos medicamentos de
potencia distinta.

## Causa

`matching.ts:108-117` — `matchKey()` prioriza `ml` sobre `mg` y usa `Math.max`
sobre los mililitros, así que de `"30 mg/5 mL … 100 mL"` se queda con `100ml`
(el frasco) y descarta `30 mg/5 mL` (la concentración). Ningún eje posterior de
`presentationKey` ni de `canMergeOffers()` miraba la concentración.

## Detalle relevante — la abreviatura con punto

`Ambroxol 30mg./5ml.` (Ahumada) es la única grafía del catálogo (1 de 2.255
nombres únicos) con punto entre la unidad y la barra. Sin tolerarla, esa oferta
se leía como masa absoluta `30 mg` y actuaba como comodín. `MEASUREMENT_RE`
(`concentration.ts`) acepta ahora un `.` opcional tras la unidad del numerador.

## Resultado en la branch

Dos tarjetas:

- `Jarabe Ambroxol clorhidrato 30mg5ml 100ml` + `Ambroxol 30mg/5ml Jarabe 100ml`
  + `Ambroxol 30mg./5ml. Jarabe Fco. 100ml` — las tres de 30 mg/5 mL
- `Ambroxol 15 mg/5mL Jarabe 100 mL` — sola

## Test de regresión

`packages/domain/src/__tests__/liquidConcentration.test.ts` →
`"CASO 1 — Ambroxol 30mg/5ml vs 15mg/5ml no comparten tarjeta"`.
