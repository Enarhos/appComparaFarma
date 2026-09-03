# CF-SEARCH-011 — Corpus congelado

**Captura:** 2026-09-02T00:55Z–00:56Z (UTC), `GET https://comparafarma-api.vercel.app/api/search?q=…`
público, sin `?debug=1`, sin credenciales, sin escribir en ninguna base de datos.
**Script:** `scripts/fetch-raw.mjs` · **Definición:** `scripts/queries.json`.

---

## 1. Las 16 consultas

Es el **mismo corpus congelado de CF-SEARCH-010**, sin quitar ni una consulta.
Las 11 primeras son el alcance mínimo obligatorio del ticket (§13); las 5
restantes son las consultas de control sin concentración que ya formaban parte
del corpus de la auditoría anterior y que se conservan para que la línea base sea
comparable cifra por cifra.

| # | Consulta | Tarjetas v1 | Ofertas |
|---|---|---:|---:|
| 1 | `ambroxol` | 57 | 61 |
| 2 | `ambroxol 30mg` | 57 | 61 |
| 3 | `ambroxol 30mg/5ml` | 57 | 61 |
| 4 | `tapsin` | 135 | 146 |
| 5 | `paracetamol 500mg` | 138 | 147 |
| 6 | `ibuprofeno 400mg` | 114 | 137 |
| 7 | `losartan 50mg` | 72 | 88 |
| 8 | `omeprazol 20mg` | 38 | 49 |
| 9 | `amoxicilina 500mg` | 124 | 144 |
| 10 | `diclofenaco 50mg` | 132 | 142 |
| 11 | `cetirizina 10mg` | 104 | 115 |
| 12 | `ambroxol 30mg/5ml jarabe 100ml` | 57 | 61 |
| 13 | `paracetamol` | 138 | 147 |
| 14 | `ibuprofeno` | 114 | 137 |
| 15 | `omeprazol` | 38 | 49 |
| 16 | `losartan` | 72 | 88 |
| | **Total** | **1.447** | **1.633** |

**No se eliminó ninguna consulta difícil para mejorar métricas** (§13 del
ticket). Las cuatro consultas de ambroxol —incluida la que el ticket señala como
el caso duro— están las cuatro, y las de tapsin, losartán, ibuprofeno y
amoxicilina traen las combinaciones y las variantes comerciales que más cuesta
resolver.

---

## 2. Consultas que devuelven el mismo conjunto

Las cuatro consultas de ambroxol devuelven **el mismo conjunto de ofertas** (57
tarjetas / 61 ofertas cada una), y lo mismo pasa con
`paracetamol` / `paracetamol 500mg`, `ibuprofeno` / `ibuprofeno 400mg`,
`omeprazol` / `omeprazol 20mg` y `losartan` / `losartan 50mg`.

No es un defecto de la captura: `cleanQuery()` descarta la concentración antes
del retrieval, así que las cuatro consultas llegan a las 9 farmacias con la misma
`retrievalQuery`. Lo que cambia entre ellas es la **relevancia y el orden**, no
el conjunto recuperado — que es precisamente el eje que `QUERY_INTENT_V2.md`
propone corregir y que S0 **no** toca.

Consecuencia para las mediciones: las **1.633 filas upstream** corresponden a
**987 observaciones únicas** (farmacia + nombre + URL). Las métricas de
cardinalidad y de falso merge se cuentan sobre observaciones únicas; las
métricas de agrupamiento por consulta (que reflejan lo que un usuario ve en un
listado) se cuentan sobre las 1.633 filas. Cada tabla dice cuál usa.

---

## 3. Qué es una "oferta" acá

El endpoint público devuelve el resultado **ya fusionado por v1**
(`MedicationResult[]`), así que el conteo previo al merge no es observable sin
`?debug=1` (que requiere `API_SECRET_KEY`, no solicitada).

Una **oferta** es un elemento de `card.prices[]`: exactamente la unidad que usó
CF-SEARCH-010, lo que hace las dos líneas base comparables. Es el **piso** del
total upstream, no el total: la diferencia son las ofertas que v1 descartó por su
regla "una por farmacia, la más barata".

**Un solo retrieval alimenta a los dos motores.** v2 procesa exactamente las
mismas ofertas que v1 normalizó, leídas del mismo sobre. No se duplicó ni una
petición a las farmacias (R-009: 3 de los 9 scrapers son frágiles).

---

## 4. Deriva respecto de la captura de CF-SEARCH-010 (2026-09-01)

| Métrica | CF-SEARCH-010 | CF-SEARCH-011 | Δ |
|---|---:|---:|---:|
| Consultas | 16 | 16 | 0 |
| Tarjetas | 1.447 | 1.447 | 0 |
| Ofertas | 1.634 | 1.633 | **−1** |
| Nombres upstream únicos | 982 | 975 | −7 |
| Farmacias presentes | 9 | 9 | 0 |
| `matchKey` distintos | 440 | 442 | +2 |
| `presentationKey` distintos | 874 | 867 | −7 |

La deriva es de un día de catálogo y no requiere ninguna corrección: el corpus
nuevo queda congelado en `analysis/` y todas las comparaciones de este paquete se
hacen **contra él**, no contra las cifras publicadas. Las cifras de
CF-SEARCH-010 se usan solo para verificar que la reproducción de la línea base
es fiel (ver `S0_BASELINE.md`).

**No se forzó ninguna coincidencia artificial.**
