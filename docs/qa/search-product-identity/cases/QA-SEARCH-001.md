# QA-SEARCH-001 — Formas líquidas: dos concentraciones distintas comparadas en la misma tarjeta

| Campo | Valor |
|---|---|
| **Severidad** | **P1** — comparación de medicamento/precio incorrecta |
| **Clasificación** | `CRITICAL_FALSE_MERGE` |
| **Test** | 2 (dosis) |
| **Estado** | Preexistente en `origin/main@acd79bf`. **No lo corrige** el PR bajo prueba |
| **Reproducibilidad** | 5/5 tarjetas en la captura del 2026-08-31T01:2x UTC; determinista dado el nombre |

## Consultas y productos

`ambroxol`, `ibuprofeno`, `betametasona` (Cam), `amoxicilina suspension`.

## Comportamiento observado

Una sola tarjeta agrupa ofertas de **concentraciones distintas y explícitas**, y
presenta la diferencia de precio entre ellas como si fuera un ahorro.

`presentationKey = ambroxol|100ml|bio:unknown|brand:unknown|form:fluid-oral`

| Farmacia | Nombre en la fuente | Concentración | Precio |
|---|---|---|---|
| ecofarmacias | `Jarabe Ambroxol clorhidrato 30mg5ml 100ml (Hospifarma) DESCUENTO` | 30 mg/5 mL | $990 |
| sermecoop | `Ambroxol 30mg/5ml Jarabe 100ml` | 30 mg/5 mL | $2.390 |
| ahumada | `Ambroxol 30mg./5ml. Jarabe Fco. 100ml` | 30 mg/5 mL | $3.374 |
| cruz-verde | `Ambroxol 15 mg/5mL Jarabe 100 mL` | **15 mg/5 mL** | $5.490 |

El "más caro" es la mitad de concentración. Un usuario lee que Cruz Verde vende lo
mismo 5,5 veces más caro.

Los otros 4 casos, misma mecánica:

| `presentationKey` | Concentraciones fusionadas | Rango |
|---|---|---|
| `muxol\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` | 30 mg/5 mL (araucomed) vs **15 mg/5 mL** (sermecoop) | $3.990 – $4.890 |
| `cam\|120ml\|bio:unknown\|brand:unknown\|var:betametasona\|form:fluid-oral` | **0,25 mg** (ecofarmacias) vs **2 mg** (cruz-verde) — factor 8 | $9.980 – $14.790 |
| `ibuprofeno\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` | 200 mg/5 mL (eco, sermecoop, salcobrand) vs **100 mg/5 mL** (cruz-verde) | $1.890 – $4.599 |
| `pyriped\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` | 100 mg/5 mL (sermecoop, cruz-verde) vs **200 mg/5 mL** (ecofarmacias) | $2.990 – $8.040 |

## Comportamiento esperado

Dos ofertas que declaran concentraciones incompatibles no pueden compartir tarjeta,
igual que ya ocurre con los sólidos (`paracetamol|500mg` nunca se fusiona con
`paracetamol|1000mg`).

## Causa raíz probable

`packages/domain/src/matching.ts:107-118` — `matchKey()` elige **una sola** dosis y
prioriza mililitros sobre miligramos:

```ts
if (mlHits.length) {
  dose = `${Math.max(...mlHits.map(...))}ml`;
} else if (mcgHits.length) { ...
} else if (mgHits.length) { ...
```

En un jarabe el nombre trae ambos (`30 mg/5 mL … 100 mL`). Gana el `ml`, y el
resultado es `ambroxol|100ml`: **el volumen del envase se conserva y la
concentración se descarta**. `presentationKey()` hereda esa clave, y ningún eje
posterior (`bio:`, `brand:`, `var:`, `form:`) distingue concentración, así que
`fluid-oral` queda sin ningún eje de dosis.

Es simétrico al defecto que ya se corrigió para combinaciones (S-1, `combo:`) y para
cantidad de sólidos: la concentración de líquidos es el eje que quedó sin cubrir.

## Evidencia

- Datos: `raw/ambroxol.json`, `raw/ibuprofeno.json`, `raw/betametasona.json`,
  `raw/amoxicilina-suspension.json`
- Detector: `analysis/findings.json` → `findings.doseMismatch` (12 grupos, de los
  cuales 5 tienen **dos dosis en mg explícitas y distintas**; los otros 7 son una
  fuente que declara la concentración y otra que no, que no es contradicción)
- Matriz: `analysis/offers.csv`, columnas `strength` / `matchKey` / `presentationKey`
- Código: `packages/domain/src/matching.ts:107-118` (`origin/main@acd79bf`)

## Screenshot

`SCREENSHOT_REQUIRES_MANUAL_CAPTURE` — instrucciones en `../screenshots/README.md`.

## Issue recomendado

`CF-SEARCH-003 — Concentración en formas líquidas` (P1). `matchKey` **no se toca**
(valor persistido en `price_history`, `medication_match_key_aliases`,
`pharmacy_clicks`, `email_alerts`). El eje va donde ya fueron `combo:`, `var:` y
`form:`: en `presentationKey()`, como un segmento `conc:` derivado del patrón
`<n> mg / <m> ml`. Requiere considerar el efecto sobre los slugs de ficha de Web
(nueva generación de hash, igual que Gen 5 y Gen 6-bio).
