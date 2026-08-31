# CF-SEARCH-003-02 — Ibuprofeno suspensión: 200 mg/5 mL fusionado con 100 mg/5 mL

| Campo | Valor |
|---|---|
| **Consulta** | `ibuprofeno` |
| **`presentationKey`** | `ibuprofeno\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` |
| **Estado en base** | Reproducido en `origin/main@2400fca` |
| **Estado en branch** | Corregido |
| **Datos** | `../raw/ibuprofeno.json` |

## Ofertas de la tarjeta (base)

| Farmacia | `rawProductName` | Concentración (branch) | Precio |
|---|---|---|---|
| ecofarmacias | `Ibuprofeno Suspensión Oral 200mg/5ml 100ml Ascend` | `200mg/5ml` | $1.890 |
| sermecoop | `Ibuprofeno 200mg/5ml Jarabe 100ml` | `200mg/5ml` | $2.790 |
| cruz-verde | `Ibuprofeno 100 mg/5mL Suspensión 100 mL` | **`100mg/5ml`** | $3.140 |
| salcobrand | `Ibuprofeno 200mg/5ml Jarabe 100ml` | `200mg/5ml` | $4.599 |

`matchKey` común: `ibuprofeno|100ml`. `unitCountKey`, `commercialVariantKey`,
`combinationKey` = `null`; `dosageFormClass` = `fluid-oral` en las cuatro.

## Por qué es un defecto

La suspensión pediátrica de 100 mg/5 mL y la de 200 mg/5 mL son presentaciones
distintas —el doble de principio activo por dosis— comparadas como si fueran
intercambiables.

Es el caso que el ticket cita textualmente: *"Ibuprofeno 100mg/5ml vs
200mg/5ml"*.

## Resultado en la branch

Dos tarjetas: las tres ofertas de 200 mg/5 mL juntas, y `Ibuprofeno 100 mg/5mL
Suspensión 100 mL` sola.

## Test de regresión

`liquidConcentration.test.ts` → `"CASO 2 — Ibuprofeno 200mg/5ml vs 100mg/5ml no
comparten tarjeta"`.

---

# CF-SEARCH-003-02b — Pyriped (misma mecánica, marca comercial)

| Campo | Valor |
|---|---|
| **Consultas** | `ibuprofeno`, `pyriped` (se reproduce en las dos) |
| **`presentationKey`** | `pyriped\|100ml\|bio:unknown\|brand:unknown\|form:fluid-oral` |
| **Datos** | `../raw/pyriped.json`, `../raw/ibuprofeno.json` |

| Farmacia | `rawProductName` | Concentración | Precio |
|---|---|---|---|
| sermecoop | `Pyriped (ibuprofeno) 100mg/5ml Jarabe 100ml` | `100mg/5ml` | $2.990 |
| ecofarmacias | `Pyriped Ibuprofeno Suspension Oral 200mg/5ml 100ml` | **`200mg/5ml`** | $3.990 |
| cruz-verde | `Pyriped Ibuprofeno 100 mg/5mL Suspensión 100 mL` | `100mg/5ml` | $8.040 |

Resultado en la branch: las dos ofertas de 100 mg/5 mL juntas, la de 200 mg/5 mL
aparte.

Test: `liquidConcentration.test.ts` → `"CASO Pyriped — 200mg/5ml vs 100mg/5ml no
comparten tarjeta"`.
