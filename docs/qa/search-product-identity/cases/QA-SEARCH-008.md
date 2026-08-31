# QA-SEARCH-008 — `unitCountKey()` del PR deriva cantidades falsas en 3 patrones reales (falso split latente)

| Campo | Valor |
|---|---|
| **Severidad** | **P2** — riesgo introducido por el PR; **hoy no se materializa en ninguna tarjeta** |
| **Clasificación** | `LIKELY_FALSE_SPLIT` (latente) |
| **Test** | 1 (cantidad) |
| **Estado** | **Introducido por** `fix/quantity-mismatch-false-merge@b20402a`. No existe en `origin/main@acd79bf` |
| **Reproducibilidad** | 100 % — es una función pura sobre el nombre |

## Contexto

El PR agrega `unitCountKey(name): number | null` y la regla dura de
`isCompatibleUnitCount()`: **dos cantidades explícitas distintas ⇒ no se fusionan**.
La fuerza de la regla es también su fragilidad: una cantidad mal leída no degrada a
"desconocida", se convierte en una prohibición de fusión.

Sobre las 2.627 ofertas capturadas, `unitCountKey()` produce un valor explícito en
150 ofertas donde `matchKey` no ve ninguna cantidad (111 nombres distintos) — ése es
el aporte real del PR, y en la gran mayoría es correcto. Pero **3 patrones producen un
número que el nombre no dice**.

## Comportamiento observado

### 1. Sustantivo pegado al número que no está en `GLUED_COUNT_TOKEN`

```
"Supositorio Glicerina 3.5g Adulto x 10unidades Valma DESCUENTO"  (ecofarmacias)
  matchKey  -> glicerina|3500mg|10     (cantidad correcta: 10)
  unitCountKey -> 1                     ← INCORRECTO
```

`10unidades` no matchea `COUNT_NUMBER_TOKEN` (`^(?:x|por)?(\d+)$`) ni
`GLUED_COUNT_TOKEN` (que solo cubre `com|comp|comps|cap|caps|cps|tab|tabs`). Al no
encontrar ningún número, la función cae en la regla de `SINGULAR_UNIT_NOUNS`, ve
"Supositorio" en singular y devuelve **1**.

Mismo patrón, otro producto real: `"La Prepie Parche Gel Frio 4Un"` (ahumada) →
`unitCountKey` = **1** (por "Parche"), cantidad real 4. Éste no aparece en el detector
de desacuerdo porque `matchKey` tampoco lo lee.

**Par real, ambos nombres de producción:**

```
A "Supositorio Glicerina 3.5g Adulto x 10unidades Valma DESCUENTO"  (ecofarmacias) -> 1
B "Supositorio Glicerina Adulto 3 g x 10 supositorios"              (farmex)       -> 10
  isCompatibleUnitCount(1, 10) === false   ⇒ el PR PROHIBIRIA fusionarlos
```

Hoy no se fusionan de todos modos (A y B difieren en `matchKey` por 3,5 g vs 3 g y en
`brand:`), así que **el daño es latente, no actual**. Pero si CF-DATA-001 /
CF-DATA-002 mejoran el eje de marca —que es exactamente lo que QA-SEARCH-003 y
QA-SEARCH-005 recomiendan— este par converge al mismo `presentationKey` y el PR lo
partirá.

### 2. Guion intra-palabra entre dígitos

```
"Diclofenaco Sodico/Tramadol Clorhidrato 25-25 Comprimidos"  (cruz-verde)
  matchKey  -> diclofenaco|25
  unitCountKey -> 2525                  ← INCORRECTO
```

`normalizedWords()` colapsa los guiones intra-palabra (`.replace(/(\w)-(\w)/g,"$1$2")`,
`matching.ts:37`), pensado para "Co-Amoxiclav" → "coamoxiclav". Con dígitos, `25-25`
—que es la concentración 25 mg / 25 mg— se vuelve el token `2525`, seguido de
"comprimidos", que **sí** está en `UNIT_COUNT_NOUNS`. Resultado: una caja de 2.525
comprimidos.

### 3. Abreviatura de unidad de medida ausente de `MEASURE_UNITS`

```
"Salbutamol 100 Mcg/ds X 200 Ds"  (sermecoop)
  unitCountKey -> 200               ← son 200 DOSIS (actuaciones), no 200 envases
```

`MEASURE_UNITS` incluye `dosis`, `puff`, `inhalacion`, `actuacion`… pero no la
abreviatura `ds`. La contraparte de la misma tarjeta,
`"Salbutamol 100 mcg/dosis x 200 dosis -Cenabast"` (ecofarmacias), devuelve
correctamente `null`. Como `null` es comodín, la fusión sobrevive **por la asimetría,
no por la lectura**. Si la otra farmacia escribiera un número de envases distinto, se
compararía una cantidad de envases contra un número de actuaciones.

## Comportamiento esperado

Ante un patrón de cantidad no reconocido, devolver `null` (desconocido) en vez de
derivar un número por otra vía. Concretamente: la regla de `SINGULAR_UNIT_NOUNS` no
debería aplicarse si el nombre contiene un token con forma `<dígitos><letras>` sin
interpretar (caso 1), y `normalizedWords` no debería colapsar guiones **entre
dígitos** para este uso (caso 2).

## Por qué no bloquea el merge del PR

Verificado en el A/B sobre el corpus global (2.281 ofertas únicas, 28 consultas):
`origin/main` y el PR producen **exactamente las mismas 2.022 tarjetas** — 0 tarjetas
solo en base, 0 solo en PR. Ninguno de los 3 patrones cambia una sola tarjeta hoy.
El detalle está en `../QA_SUMMARY.md` §7.

## Evidencia

- `analysis/findings.json` → `findings.unitCountMisread` (2 desacuerdos contra `matchKey`)
- `analysis/offers.csv` — columnas `unitCountKey` y `matchKey`
- `analysis/ab-merge.json` — A/B por consulta
- `packages/domain/src/productIdentity.ts` en `b20402a`: `GLUED_COUNT_TOKEN`,
  `COUNT_NUMBER_TOKEN`, `SINGULAR_UNIT_NOUNS`, `MEASURE_UNITS`
- `packages/domain/src/matching.ts:37` (`normalizedWords`, colapso de guiones)

Comando de reproducción exacto:

```bash
node -e "const {pathToFileURL}=require('node:url');(async()=>{
const PR=await import(pathToFileURL('C:/Belford/wt-quantity-mismatch/packages/domain/dist/index.js').href);
for (const n of ['Supositorio Glicerina 3.5g Adulto x 10unidades Valma DESCUENTO',
                 'Supositorio Glicerina Adulto 3 g x 10 supositorios',
                 'La Prepie Parche Gel Frio 4Un',
                 'Diclofenaco Sodico/Tramadol Clorhidrato 25-25 Comprimidos',
                 'Salbutamol 100 Mcg/ds X 200 Ds'])
  console.log(JSON.stringify(n),'->',PR.unitCountKey(n));})()"
```

Salida verificada (2026-08-31):

```
"Supositorio Glicerina 3.5g Adulto x 10unidades Valma DESCUENTO" -> 1
"Supositorio Glicerina Adulto 3 g x 10 supositorios" -> 10
"La Prepie Parche Gel Frio 4Un" -> 1
"Diclofenaco Sodico/Tramadol Clorhidrato 25-25 Comprimidos" -> 2525
"Salbutamol 100 Mcg/ds X 200 Ds" -> 200
```

## Issue recomendado

`CF-SEARCH-006 — Robustez de unitCountKey` (P2), **como follow-up del PR, no como
condición para mergearlo**. Tres correcciones acotadas y testeables:

1. No aplicar `SINGULAR_UNIT_NOUNS` si quedó un token `^\d+[a-z]+$` sin interpretar.
2. Ampliar `GLUED_COUNT_TOKEN` con `un|und|unidad(es)|sobre(s)|supositorio(s)` o, mejor,
   partir el token `<dígitos><letras>` antes de clasificarlo.
3. Agregar `ds` a `MEASURE_UNITS`, y no leer como cantidad un token que resultó de
   colapsar un guion entre dígitos.

Los 3 casos deberían entrar como test en
`packages/domain/src/__tests__/quantityIdentity.test.ts`, que hoy tiene 28 tests y
ninguno cubre estos patrones.
