# QA-SEARCH-003 — 90,5 % de las tarjetas comparan una sola farmacia

| Campo | Valor |
|---|---|
| **Severidad** | **P2** — la comparación no es incorrecta, simplemente no ocurre |
| **Clasificación** | `LIKELY_FALSE_SPLIT` (fragmentación por ejes de identidad comercial) |
| **Test** | 12 (false splits) |
| **Estado** | Preexistente. Consecuencia **documentada y deliberada** de dos políticas vigentes |
| **Reproducibilidad** | Determinista sobre los datos capturados |

## Comportamiento observado

Sobre 2.347 tarjetas de 28 consultas:

| Farmacias por tarjeta | Tarjetas | % |
|---|---|---|
| 1 | 2.125 | **90,5 %** |
| 2 | 178 | 7,6 % |
| 3 | 33 | 1,4 % |
| 4 | 9 | 0,4 % |
| 5 | 1 | 0,04 % |
| 6 | 1 | 0,04 % |
| 7-9 | 0 | 0 % |

Ninguna tarjeta compara más de 6 de las 9 farmacias.

Agrupando por identidad farmacológica completa (`matchKey` + forma + variante +
combinación + cantidad, ignorando solo `bio:` y `brand:`): **346 grupos**
farmacológicamente equivalentes están repartidos en más de una tarjeta, y en
**270 de ellos ninguna farmacia se repite entre las tarjetas** — es decir, son
comparaciones de precio que existían y se perdieron.

Ejemplo — Amoxicilina 500 mg x 21 comprimidos, 7 farmacias, **5 tarjetas**:

```
amoxicilina|500mg|21|bio:unknown|brand:mintlab|form:solid-oral  araucomed            $1.690
amoxicilina|500mg|21|bio:true   |brand:unknown|form:solid-oral  ecofarmacias+sermecoop $1.890 / $2.490
amoxicilina|500mg|21|bio:unknown|brand:opko   |form:solid-oral  farmex               $2.090
amoxicilina|500mg|21|bio:true   |brand:opko   |form:solid-oral  dr-simi              $2.800
amoxicilina|500mg|21|bio:unknown|brand:unknown|form:solid-oral  cruz-verde+salcobrand $4.990 / $5.015
```

El ahorro real ($1.690 vs $5.015, 66 %) nunca se muestra junto.

Tapsin Forte x 20, misma mecánica, 4 farmacias en 2 tarjetas:

```
tapsin|20|bio:unknown|brand:maver  |var:forte|form:solid-oral  araucomed $1.990 · farmex $1.990
tapsin|20|bio:unknown|brand:unknown|var:forte|form:solid-oral  ecofarmacias $2.980 · ahumada $3.314
```

## Comportamiento esperado

No es evidente que deba cambiar. Los dos ejes que fragmentan son políticas explícitas:

- `bio:` — `commercialIdentity.ts` separa `bio:true` / `bio:false` / `bio:unknown`. Tras
  BIOEQUIVALENCE-DATA-QUALITY-01 (PR #141) la mayoría del catálogo pasó a `unknown`,
  así que hoy una farmacia que **sí informa** bioequivalencia queda aislada de las 5
  que no informan nada. Es el efecto directo y previsible de dejar de afirmar sin
  evidencia.
- `brand:` — `deduplication.ts:22-27` documenta que `brand:unknown` **nunca** comparte
  grupo con una identidad comercial conocida, y lo llama "limitación conocida y
  aceptada, no un bug".

Lo que este caso aporta no es un bug nuevo: es la **magnitud medida** de una política
que hasta ahora se había evaluado cualitativamente. La promesa del producto es comparar
9 farmacias; en la práctica, 9 de cada 10 tarjetas comparan una.

## Causa raíz

`packages/domain/src/commercialIdentity.ts` → `presentationKey()`, ejes `bio:` y
`brand:`. Amplificado por QA-SEARCH-004 (5 de 9 farmacias nunca aportan `laboratory`,
así que su `brand:` es casi siempre `unknown`) y por QA-SEARCH-005 (tokens de marca
inválidos).

## Evidencia

- `analysis/offers.json` — cardId, `cardPresentationKey`, `pharmacy` por oferta
- `analysis/findings.json` → `findings.falseSplit` (28 candidatos del detector estricto)
- Conteo de fragmentación: script inline documentado en `QA_SUMMARY.md` §5
- `packages/domain/src/deduplication.ts:22-27` (política `brand:unknown`)

## Issue recomendado

`CF-SEARCH-004 — Cobertura de comparación por tarjeta` (P2). **No** proponer aquí
relajar la política: es una decisión de producto/arquitectura, no de QA. Lo que sí
corresponde pedir es una **métrica de cobertura** (farmacias por tarjeta, grupos
fragmentados) como indicador de salud del buscador, porque hoy el sistema puede
degradarse en esta dimensión sin que nada lo detecte: `monitor-api.yml` verifica que
las 9 farmacias respondan, no que sus ofertas terminen comparándose entre sí.
