# CF-SEARCH-003-03 — Cam jarabe (betametasona): 0,25 mg fusionado con 2 mg (factor 8)

| Campo | Valor |
|---|---|
| **Consulta** | `betametasona` |
| **`presentationKey`** | `cam\|120ml\|bio:unknown\|brand:unknown\|var:betametasona\|form:fluid-oral` |
| **Estado en base** | Reproducido en `origin/main@2400fca` |
| **Estado en branch** | Corregido |
| **Datos** | `../raw/betametasona.json` |

## Ofertas de la tarjeta (base)

| Farmacia | `rawProductName` | Concentración (branch) | Precio |
|---|---|---|---|
| ecofarmacias | `Cam Jarabe Betametasona 0,25 mg 120 Ml (Lab Chile)` | `0.25mg` (masa absoluta) | $9.980 |
| cruz-verde | `Cam Betametasona 2 mg Jarabe 120 mL` | **`2mg`** (masa absoluta) | $14.790 |

`matchKey` común: `cam|120ml` — otra vez el volumen del frasco.
`var:betametasona`, `form:fluid-oral` en las dos.

## Por qué este caso es distinto de los demás

**Ninguna de las dos fuentes escribe la razón mg/mL.** Las dos declaran una masa
absoluta junto al volumen del envase. Un eje que solo reconociera razones
masa/volumen habría dejado este falso merge sin corregir — y es el de mayor
diferencia relativa de los cinco: **factor 8**.

Es la razón de ser del **nivel 2** de `liquidConcentration()`: una masa absoluta
se acepta como concentración *solo cuando el nombre también declara un volumen*,
que es exactamente la condición bajo la cual `matchKey` descartó esa masa. Fuera
de esa condición (un comprimido de 500 mg) el eje no se activa y la dosis sólida
sigue gobernada por `matchKey`, como corresponde.

## Por qué NO se convierte la masa en razón

Sería tentador leer `0,25 mg` + `120 mL` como `0,25 mg/120 mL`. Está
explícitamente prohibido: en `Ambroxol clorhidrato 30 mg 100 ml` (EcoFarmacias)
el producto real es 30 mg/5 mL, y esa inferencia daría una concentración 20
veces menor. Las masas absolutas se comparan **solo contra otras masas
absolutas**; frente a una razón se consideran compatibles (dos niveles de
detalle, no una contradicción).

## Resultado en la branch

Dos tarjetas, una por oferta.

## Test de regresión

`liquidConcentration.test.ts` → `"CASO Cam/Betametasona — 0,25 mg vs 2 mg
(factor 8) no comparten tarjeta"`.
