# CF-SEARCH-003-04 — Muxol jarabe: 30 mg/5 mL fusionado con 15 mg/5 mL

| Campo | Valor |
|---|---|
| **Consultas** | `ambroxol`, `muxol` (se reproduce en las dos) |
| **`presentationKey`** | `muxol\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` |
| **Estado en base** | Reproducido en `origin/main@2400fca` |
| **Estado en branch** | Corregido |
| **Datos** | `../raw/muxol.json`, `../raw/ambroxol.json` |

## Ofertas de la tarjeta (base), consulta `muxol`

| Farmacia | `rawProductName` | Concentración (branch) | Precio |
|---|---|---|---|
| ecofarmacias | `Muxol jarabe adulto 100ml Saval DESCUENTO` | `null` (no la declara) | $2.990 |
| araucomed | `Muxol Adulto 30mg/5ml jarabe 100ml` | `30mg/5ml` | $3.990 |
| sermecoop | `Muxol (ambroxol) 15mg/5ml Jarabe 100ml` | **`15mg/5ml`** | $4.890 |

En la consulta `ambroxol` la misma tarjeta aparece con 2 de esas 3 ofertas
(araucomed + sermecoop), sin la de EcoFarmacias.

## Por qué este caso importa para el diseño

Es el grupo que combina **las tres situaciones** a la vez: una oferta sin
concentración (comodín), una de 30 mg/5 mL y una de 15 mg/5 mL.

1. **Política de ausencia.** La oferta de EcoFarmacias no declara concentración.
   Bajo la política (B) *ausencia = bloqueo* quedaría en una tarjeta propia —un
   falso split— sin evitar ningún falso merge, porque la contradicción está
   entre las **otras dos**. Bajo la política elegida (A) acompaña a la de
   30 mg/5 mL, que es su producto real (Muxol adulto Saval).

2. **Recorrido de aceptación.** Si esa oferta comodín fuera la canónica de la
   tarjeta, validar cada candidata solo contra ella dejaría entrar a las dos
   contradictorias, porque cada una es compatible con `null` por separado —la
   compatibilidad con la ausencia no es transitiva. Es el motivo por el que
   `canMergeOffers()` se aplica ahora contra **todas** las ofertas ya aceptadas.
   Ver `../QA_SUMMARY.md` §6.

## Equivalencia por razón, no por literal

La misma familia contiene tres escrituras del **mismo** jarabe de adulto:

- `Muxol Adulto 30mg/5ml jarabe 100ml` (AraucoMed) → 6 mg/mL
- `Muxol Jarabe Adulto Ambroxol 600 mg / 100 ml` (Cruz Verde) → 6 mg/mL
- `MUXOL JARABE ADULTO Ambroxol Clorhidrato 600 mg 100 ml` (Ahumada) → masa absoluta

y dos del pediátrico:

- `Muxol (ambroxol) 15mg/5ml Jarabe 100ml` (Sermecoop) → 3 mg/mL
- `Muxol Jarabe Pediátrico Ambroxol 300 mg / 100 ml` (Cruz Verde) → 3 mg/mL

`isCompatibleConcentration` compara **razones**, así que `600 mg/100 ml` y
`30 mg/5 mL` son la misma concentración y `300 mg/100 ml` no lo es. Comparar
literales habría partido tarjetas correctas.

## Resultado en la branch

Dos tarjetas: `Muxol jarabe adulto 100ml Saval` + `Muxol Adulto 30mg/5ml jarabe
100ml` por un lado, `Muxol (ambroxol) 15mg/5ml Jarabe 100ml` por otro.

## Tests de regresión

`liquidConcentration.test.ts` →
`"CASO Muxol — 30mg/5ml vs 15mg/5ml no comparten tarjeta"`,
`"se compara por RAZÓN, no por literal: 600 mg/100 ml ≡ 30 mg/5 mL ≡ 6 mg/ml"`,
`"la tarjeta es internamente consistente aunque la canónica no declare concentración"`.
