# CF-SEARCH-003-05 — Casos que NO deben cambiar (control de falsos splits)

Contracara de los cuatro casos de corrección: grupos reales que **siguen
fusionados** en la branch. Si alguno se partiera, el fix habría introducido un
falso split.

Medición global: **0 separaciones no intencionales** sobre 274 pares de ofertas
que compartían tarjeta en `origin/main@2400fca`
(`../analysis/pair-split.json`).

## 1. Una fuente declara la concentración y la otra no

Los 12 grupos mixtos de la muestra. Todos siguen en una sola tarjeta.

| `presentationKey` | Ofertas |
|---|---|
| `alledryl\|60ml\|…` | `Alledryl (loratadina) Jarabe 60ml` (sermecoop, sin conc.) · `Alledryl 5 mg/5 ml Jarabe 60 mL (Prater)` (eco) · `Alledryl Loratadina 5 mg / 5 mL Jarabe 60 mL` (cruz-verde) |
| `alledryld\|120ml\|…` | `Alledryl-D jarabe 120 mL` (easyfarma, sin conc.) · `Alledryl-D Loratadina 15 mg/5ml Jarabe 120 mL` (cruz-verde) |
| `neo\|60ml\|…\|var:alledryl` | `Neo Alledryl Jarabe 60 mL` (easyfarma, sin conc.) · `Neo Alledryl 2,5 mg/5ml Jarabe 60ml (Prater)` (eco) |
| `cidoten\|30ml\|30\|…` | `Cidoten Gotas x 30 ml` (easyfarma, sin conc.) · `Cidoten 0,5 Mg/ml Gotas X 30 Ml` (sermecoop) · `Cidoten 0,5 mg/mL x 30 mL Solución Oral Para Gotas` (ahumada) · `Cidoten gotas 0,5 mg / ml x 30 ml` (eco) |
| `tocalm\|100ml\|…\|var:ambroxol` | `Tocalm Ambroxol Jarabe Adulto 100 mL (Prater)` (eco, sin conc.) · `Tocalm Adulto Ambroxol 30 mg/5mL Jarabe 100 mL` (cruz-verde) |
| `paracetamol\|15ml\|…` | `Paracetamol Gotas 15ml` (salcobrand, sin conc.) · `Paracetamol 100 mg Gotas 15 mL` (cruz-verde) |
| `muxol\|100ml\|…\|var:infantil` | `Muxol jarabe infantil 100ml Saval` (eco, sin conc.) · `Muxol Jarabe Pediátrico Ambroxol 300 mg / 100 ml` (cruz-verde) |

En los 12, la fuente que calla es la que trunca o abrevia el nombre — no una
presentación distinta. Es la evidencia que sostiene la política *ausencia =
comodín* (`../QA_SUMMARY.md` §3).

## 2. Misma concentración escrita de forma distinta

`Cidoten 0,5 Mg/ml` (Sermecoop), `Cidoten 0,5 mg/mL` (Ahumada) y `Cidoten gotas
0,5 mg / ml` (EcoFarmacias) derivan las tres `0.5mg/1ml`: espacios, mayúsculas y
denominador implícito no las separan.

`Muxol Jarabe Adulto Ambroxol 600 mg / 100 ml` y `Muxol Adulto 30mg/5ml jarabe
100ml` derivan razones distintas en literal pero **iguales en valor**
(6 mg/mL) — siguen siendo compatibles.

## 3. Sólidos, cremas y supositorios: el eje no se activa

Sobre las 1.806 ofertas de la muestra, **0** de 814 `solid-oral`, **0** de 118
`topical` y **0** de 44 `suppository` derivan concentración
(`../analysis/policy-evidence.json` → `coverageByDosageForm`).

Verificado además caso a caso en
`packages/domain/src/__tests__/liquidConcentration.test.ts` §7:

- `Paracetamol 500 mg x 20 comprimidos` → `null`
- `Paracetamol 500 mg x 10 cápsulas` → `null`
- `Diclofenaco 50 mg 5 supositorios` → `null`
- `Aspirina Forte 650mg x80com.` → `null`
- `Salbutamol 100mcg Inhalador` → `null`
- `Tapsin SC Paracetamol 1 gr x 20 Comprimidos` → `null`

y la fusión de `Aspirina 500 mg x 40 comprimidos` (Farmex) con `Aspirina 500 mg
Adulto x 40 Comprimidos` (EcoFarmacias) sigue produciendo **una** tarjeta.

## 4. Combinaciones y razones que no son concentración

- `Losartán Potásico + Hidroclorotiazida 50 mg / 12.5 mg x 30` → `null`
  (razón masa/masa = combinación, ya cubierta por `combo:`; el denominador debe
  ser de volumen para que sea concentración).
- `Salbutamol 100 mcg/Dosis x 200 Dosis Aerosol…` → `null` (`dosis` no es
  unidad de volumen).

## 5. Ejes de identidad preexistentes intactos

`../analysis/matchkey-contract.json`, sobre 1.555 nombres únicos reales:

| Eje | Diferencias base vs branch |
|---|---|
| `matchKey` | **0** |
| `combinationKey` | **0** |
| `commercialVariantKey` | **0** |
| `dosageFormClass` | **0** |
| `unitCountKey` | **0** |
| `presentationKey` (1.806 ofertas) | **0** |
