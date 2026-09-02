# CF-SEARCH-010 — Línea base medida del motor v1

Todas las cifras salen de `analysis/metrics.json` y `analysis/edm-gap.json`,
producidos por `scripts/trace.mjs` y `scripts/gap-metrics.mjs` sobre los 16
sobres de `raw/`. **Ninguna es una estimación.**

Captura: 2026-09-01 · `origin/main@3a7b5a4` en producción.

---

## 1. Corpus

| Métrica | Valor |
|---|---|
| Consultas ejecutadas | 16 |
| Consultas con resultados | 16 |
| **Tarjetas finales** | **1.447** |
| **Ofertas normalizadas** | **1.634** |
| Nombres upstream únicos | 982 |
| Farmacias presentes | 9 de 9 |

> **Nota sobre "total upstream offers".** El endpoint público devuelve el
> resultado ya fusionado, así que el conteo pre-merge no es observable sin
> `?debug=1` (no solicitado). 1.634 es el número de ofertas que **sobreviven**
> al merge — el piso, no el total. La diferencia son ofertas descartadas por la
> regla "una por farmacia, la más barata".

---

## 2. Cardinalidad de identidad

| Nivel | Distintos | Ratio vs tarjetas |
|---|---:|---:|
| Concepto (aproximado, ver nota) | 292 | 0,20 |
| Presentación (aproximada) | 369 | 0,26 |
| `matchKey` | **440** | 0,30 |
| `presentationKey` | **874** | 0,60 |
| Tarjetas emitidas | 1.447 | 1,00 |

> El "concepto" y la "presentación" aproximados se construyen **solo con lo que
> el motor v1 ya sabe leer** (cabecera farmacológica + concentración como razón
> + forma + combinación; más cantidad y volumen para la presentación). No
> incorporan ningún dato que hoy no exista. Son un piso de la cardinalidad real,
> no una propuesta de clave.

**Lectura:** hay ~292 identidades científicas distintas en el corpus y se
publican 1.447 tarjetas. **Cada concepto se presenta al usuario, en promedio, en
5 tarjetas separadas.**

`presentationKey` (874) tiene el doble de cardinalidad que `matchKey` (440): esa
diferencia es exactamente lo que aportan los ejes `bio:`, `brand:`, `combo:`,
`var:` y `form:`, y es la medida de la fragmentación introducida por la política
conservadora.

---

## 3. Cobertura de comparación

| Métrica | Valor | % |
|---|---:|---:|
| Tarjetas con **más de una** farmacia | 150 | **10,4 %** |
| Tarjetas con **una sola** farmacia | 1.297 | **89,6 %** |

Consistente con CF-QA-001 (90,5 % sobre otro corpus, 2026-08-31). **No mejoró
con CF-SEARCH-003, CF-WEB-002 ni CF-DATA-001** — ninguno de los tres atacaba
este eje, y CF-DATA-001 explícitamente congeló la identidad.

### Fragmentación por nivel del EDM

| Métrica | Valor |
|---|---:|
| Presentaciones repartidas en más de una tarjeta | **280** |
| Tarjetas involucradas en esas presentaciones | **1.070** (74 % del total) |
| Grupos de identidad fragmentados (método CF-QA-001) | 242 |
| De esos, **sin solapamiento de farmacias** (comparación realmente perdida) | **185** |

Peores casos medidos:

| Presentación | Tarjetas | `presentationKey` distintas | Farmacias | Precio mín → máx |
|---|---:|---:|---:|---|
| `losartan ~ solid-oral ~ 30 unidades` | 17 | 17 | 7 | $490 → $3.490 |
| `tapsin ~ fluid-oral ~ 1 unidad` | 16 | 16 | 7 | $590 → $5.790 |
| `ibuprofeno ~ solid-oral ~ 20 unidades` | 15 | 15 | 9 | $642 → $2.090 |
| `tapsin ~ solid-oral ~ 12 unidades` | 15 | 15 | 7 | $1.290 → $5.599 |

En el peor caso, **9 farmacias** tienen el mismo ibuprofeno y el usuario ve 15
tarjetas de una farmacia cada una, con un rango de precio de 3,3×.

---

## 4. Relevancia consulta→resultado

| `lexicalMatch` | Tarjetas | % |
|---|---:|---:|
| `exact` | 1.020 | 70,5 % |
| `compatible` | 381 | 26,3 % |
| `mismatch` | 46 | 3,2 % |

| `concentrationMatch` | Tarjetas | % |
|---|---:|---:|
| `exact` | 218 | 15,1 % |
| `unknown` (**unknown strength**) | 95 | 6,6 % |
| `other` | 578 | 39,9 % |
| ausente (consulta sin concentración) | 556 | 38,4 % |

| Métrica | Valor |
|---|---:|
| **Exact query matches** | 218 tarjetas en cohorte `exact` |
| **Compatible matches** | 381 (`lexicalMatch`) |
| **Incompatibles mostrados en la mitad superior del listado** | **149** |
| **Unknown strength results** | 95 |
| Tarjetas con la concentración pedida **degradadas a `other`** por el modelo masa-absoluta vs razón | **32** |

**Lectura crítica:** de las 891 tarjetas devueltas a consultas *con*
concentración, **578 (65 %) caen en la cohorte `other`** y quedan por debajo de
todo lo demás. En `ambroxol 30mg`, esa cohorte contiene **el producto correcto**.

---

## 5. Falsos merges, falsos splits y ruteo

| Métrica | Valor |
|---|---:|
| **False merges** (contradicción entre dos ofertas de la misma tarjeta) | **0** sobre 229 pares |
| · por `matchKey` | 0 |
| · por combinación | 0 |
| · por variante | 0 |
| · por forma | 0 |
| · por cantidad | 0 |
| · por concentración | 0 |
| **False splits** (presentaciones repartidas) | **280** |
| **Comparaciones perdidas** (grupos sin solapamiento de farmacias) | **185** |
| **`presentationKey` que producen más de una tarjeta** | **4 distintas** (12 ocurrencias consulta×clave) |
| **Colisiones de hash de slug** | **4 pares de productos** (12 ocurrencias consulta×hash) |
| **Wrong-product detail resolution** | 0 medido por CF-WEB-002 tras su fix; el mecanismo que lo causaba **sigue presente** |
| **Unresolved detail links** | 1 de 128 (0,8 %) medido por CF-WEB-002 |

Los 4 pares colisionados son todos de la misma clase — dos potencias del mismo
jarabe compartiendo una URL:

```
368kw3kmwe8r5  Ambroxol 30mg/5ml Jarabe 100ml      || Ambroxol 15 mg/5mL Jarabe 100 mL
ouqw7x1crum0   Muxol Adulto 30mg/5ml jarabe 100ml  || Muxol (ambroxol) 15mg/5ml Jarabe 100ml
m4nvlyflclg    Ibuprofeno 200mg/5ml Jarabe 100ml   || Ibuprofeno 100 mg/5mL Suspensión 100 mL
3c0qa7pxe6dpm  Pyriped Ibuprofeno … 200mg/5ml 100ml || Pyriped (ibuprofeno) 100mg/5ml Jarabe 100ml
```

Hoy no producen ficha equivocada porque
`isConsistentWithSlug` (Web) los desempata leyendo la concentración del texto
del slug — una regla de identidad ejecutándose en la capa de ruteo.

---

## 6. Complejidad del pipeline por oferta

| Métrica | Valor |
|---|---:|
| Funciones de identidad ejecutadas por oferta en ingesta | **10** |
| Comparaciones de compatibilidad por par de ofertas del grupo | **6 ejes** |
| Pares evaluados en `canMergeOffers` sobre el corpus | 229 |
| Ejes de identidad derivados **solo** de texto libre | **8** |
| Vocabularios manuales que gobiernan esos ejes | **9** |
| Generaciones de slug en `resolveMedication.ts` | **6** |

---

## 7. Dependencia de texto libre

**Qué fracción de las decisiones de identidad se toma sin ningún dato
estructurado de la farmacia:**

| Atributo | Ofertas que lo traen | % |
|---|---:|---:|
| `manufacturer` estructurado | 449 | 27,5 % |
| `brand` estructurado (`brandSource="structured"`) | 200 | 12,2 % |
| **Sin fabricante estructurado** | **1.185** | **72,5 %** |

**Legibilidad de los ejes del EDM desde el nombre libre** (por oferta):

| Eje | Legible | % |
|---|---:|---:|
| Cabecera farmacológica | 1.634 | 100,0 % |
| Forma farmacéutica | 1.483 | 90,8 % |
| Cantidad por envase | 993 | 60,8 % |
| Volumen de envase | 489 | 29,9 % |
| **Concentración** | **434** | **26,6 %** |

**Cobertura de atributos por tarjeta** (post CF-DATA-001):

| Atributo | Tarjetas | % |
|---|---:|---:|
| `brand` | 529 | 36,6 % |
| `manufacturer` | 422 | 29,2 % |
| `activeIngredient` | 823 | 56,9 % |
| `isBioequivalent = true` | 187 | 12,9 % |
| `isBioequivalent = false` | 67 | 4,6 % |
| `isBioequivalent = null` | **1.193** | **82,4 %** |
| Registro ISP | **0** | **0 %** — ningún adaptador lo captura |
| Código ATC | 0 | 0 % |
| Vía de administración | 0 | 0 % |

**El 100 % de las decisiones de identidad de producto se toma sobre texto libre
o sobre campos estructurados de calidad medida como baja.** El único dato con
100 % de cobertura es la cabecera farmacológica — que es el primer token
alfabético del nombre.

---

## 8. Defectos estructurales cuantificados

| Defecto | Ofertas | Nombres distintos |
|---|---:|---:|
| Volumen de envase leído como cantidad por `matchKey` (`x 100 ml` → 100 unidades) | **141** | 78 |
| Principio activo leído como variante comercial (`var:ambroxol`) | **65** | 23 |
| Tarjetas con la concentración pedida degradadas a `other` | **32** | — |
| Pares de tarjetas con hash de slug compartido | **12** | — |

---

## 9. Verificaciones ejecutadas (no reportadas de memoria)

```
$ pnpm --filter @comparafarma/domain test
  Test Files  16 passed (16)
  Tests      379 passed (379)
```

**379 tests verdes conviven con las 185 comparaciones perdidas, las 141 lecturas
erróneas de cantidad, las 65 variantes falsas y los 4 pares de slug
colisionados.** La
suite verifica que cada regla hace lo que dice; no puede verificar que el
conjunto de reglas produzca un resultado razonable, porque no existe ninguna
métrica de calidad agregada instrumentada en el producto (es lo que CF-QA-001
propuso como `CF-SEARCH-004`, no implementado).

---

## 10. Tabla resumen — línea base V1 para comparar contra V2

| Métrica | V1 (2026-09-01) |
|---|---:|
| Tarjetas por concepto | **4,96** |
| Tasa de tarjetas de una sola farmacia | **89,6 %** |
| False merge rate (contradicción intra-tarjeta) | **0,0 %** |
| False split rate (presentaciones fragmentadas) | **280 / 369 = 75,9 %** |
| Comparaciones perdidas | **185** |
| Precisión de presentación exacta (cohorte `exact` sobre consultas con dosis) | **24,5 %** (218/891) |
| Incompatibles en la mitad superior | **149** |
| No-result rate | 0 % (16/16 consultas con resultados) |
| Offer coverage | 9/9 farmacias |
| Colisiones de identidad de ficha | **4 pares** |
| Cobertura de identificador regulatorio | **0 %** |
