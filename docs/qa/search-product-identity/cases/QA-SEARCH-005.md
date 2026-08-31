# QA-SEARCH-005 — Tokens inválidos en el segmento `brand:` de `presentationKey`

| Campo | Valor |
|---|---|
| **Severidad** | **P2** — separa ofertas del mismo producto |
| **Clasificación** | `LIKELY_FALSE_SPLIT` / `DATA_QUALITY` |
| **Test** | 12 (false splits) y 7 (marca) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |
| **Reproducibilidad** | Determinista dado el nombre |

## Comportamiento observado

Sobre 2.627 ofertas se observaron **311 tokens distintos** en el segmento `brand:` de
`presentationKey` (1.503 ofertas, 57 %, con `brand:unknown`). Entre los 311 hay
tokens que no son marcas:

**Medidas leídas como marca** — 7 ofertas:

| Token | Ofertas | Nombre de origen |
|---|---|---|
| `brand:15gr` | 5 | `Clotrimazol / Betametasona ...` (EasyFarma, nombre truncado) |
| `brand:20gr` | 1 | `Canesten Crema Tópica 1% x...` (EasyFarma, truncado) |
| `brand:90gr` | 1 | — |

**Principios activos leídos como marca** — 21 ofertas:
`brand:diclofenaco` (9), `brand:clotrimazol` (6), `brand:glicerina` (6). También
`brand:metronidazol` sobre `Nistatina 100.000 U.I. 12...`.

Efecto directo, dos ofertas de la **misma farmacia**, **mismo precio**, partidas:

```
clotrimazol|bio:unknown|brand:curaespring|combo:betametasona  easyfarma  $1.490
clotrimazol|bio:unknown|brand:15gr       |combo:betametasona  easyfarma  $1.490
```

Y un caso de combinación con el eje `combo:` invertido según el orden de escritura:

```
hyzaar|30|bio:unknown|brand:hyzaar|combo:hidroclorotiazida|...  salcobrand  $29.567
   "Hyzaar Losartán Potásico / Hidroclorotiazida 30 Comprimidos Recubiertos"
hyzaar|30|bio:unknown|brand:hyzaar|combo:losartan          |...  salcobrand  $30.359
   "Hyzaar Forte Hidroclorotiazida / Losartán 30 Comprimidos Recubiertos"
```

(El segundo es "Forte", así que probablemente **sí** son productos distintos — pero el
eje que los separa es el orden de los principios activos en el texto, no la
concentración. La separación es correcta por accidente.)

## Comportamiento esperado

`isPlausibleCommercialIdentity()` (`packages/domain/src/commercialIdentity.ts:348`) ya
existe precisamente para filtrar candidatos no-marca, y `KNOWN_ACTIVE_INGREDIENTS`
(línea 289) ya excluye principios activos conocidos. Un token que es una medida
(`15gr`, `20gr`, `90gr`) debería quedar fuera por la misma razón.

## Causa raíz probable

Interacción de dos cosas, ambas verificables:

1. **Nombres truncados de EasyFarma** (QA-SEARCH-007): el nombre llega cortado, así
   que el extractor de marca cae sobre el último token disponible, que puede ser una
   medida.
2. `isPlausibleCommercialIdentity()` no rechaza tokens con forma
   `<número><unidad de medida>`. `KNOWN_ACTIVE_INGREDIENTS` es, por diseño, "una
   categoría acotada y explícita, no un intento de enumerar toda la química
   farmacéutica" (comentario del propio módulo), lo que explica `diclofenaco`,
   `clotrimazol` y `glicerina` colándose como marca.

## Evidencia

- `analysis/offers.json` — columna `cardPresentationKey`
- `analysis/findings.json` → `findings.falseSplit`
- `packages/domain/src/commercialIdentity.ts:289,348`

## Issue recomendado

`CF-DATA-002 — Tokens no-marca en identidad comercial` (P2/P3). **Quick win** acotado:
rechazar en `isPlausibleCommercialIdentity()` los tokens con forma
`^\d+(gr?|mg|ml|mcg|ui|cc)$`. Es un patrón cerrado, medible (7 ofertas hoy) y no toca
`matchKey`. El sub-problema de los principios activos como marca es más grande y
depende de CF-DATA-001.
