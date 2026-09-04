# CF-DATA-007 — Censo del residual de Gate A

Clasificación de **cada** observación sin identidad canónica asignada en una de
10 categorías de causa raíz, al 100 %, sin doble conteo.

Script: `scripts/census.mjs` (censo) + `scripts/classify.mjs` (categorías).
Artefactos: `residual-census.csv`, `analysis/residual-classified.json`.

## 1. Universo medido

| | |
|---|---:|
| Corpus | `docs/qa/cf-search-012/raw/` (el mismo congelado de S1) |
| Consultas | 16 |
| Filas upstream | 1.364 |
| **Observaciones únicas** | **839** |
| Farmacias con respuesta | 8 de 9 (falta AraucoMed) |

Clave de observación: `pharmacy|url ?? rawName` — idéntica a la de `s1-eval.mjs`,
para que la unidad de medida sea la misma que la del gate.

## 2. Las 10 categorías

| | Código | Significado | Qué haría falta para resolverla |
|---|---|---|---|
| A | `MISSING_ACTIVE_INGREDIENT_VOCABULARY` | El nombre escribe un token con forma de molécula que ningún vocabulario contiene | Vocabulario, **si hay evidencia** |
| B | `ACTIVE_INGREDIENT_PRESENT_BUT_PARSER_MISSED` | La molécula está en el vocabulario y el lector no la leyó | Arreglo de **parser** |
| C | `BRAND_ONLY_NAME_NO_MOLECULE_IN_TEXT` | El nombre solo trae la cabecera comercial; ninguna molécula escrita | **Dato externo**: tabla marca→molécula |
| D | `CONCENTRATION_ABSENT` | El nombre no declara concentración | Otra fuente de datos |
| E | `CONCENTRATION_MASS_ONLY_ON_NON_DISCRETE_FORM` | Masa absoluta en jarabe/crema/gel: lectura parcial | Lector de concentración (defecto conocido de S1) |
| F | `DOSAGE_FORM_UNREADABLE` | No se pudo leer forma farmacéutica canónica | Lector de forma |
| G | `AMBIGUOUS_AGAINST_REGISTRY` | Más de un concepto candidato, sin desempate | Más ejes declarados |
| H | `TRUNCATED_SOURCE_NAME` | La fuente entregó el nombre cortado | Arreglo de **captura** (scraper) |
| I | `NON_HUMAN_OR_NON_MEDICATION` | Fuera del universo (uso veterinario) | Nada: correctamente excluida |
| J | `ASSOCIATION_DECLARED_BUT_INCOMPLETE` | Declara N componentes y solo se nombran M<N | Vocabulario o dato externo |

### Precedencia

Una observación puede estar bloqueada por varios ejes a la vez. Para que las
categorías sumen 100 % sin doble conteo, cada una cae en la **primera** categoría
que le aplica, en el orden `I → H → G → B → A → C → J → F → E → D`: de la causa
más externa (el dato nunca llegó bien) a la más interna (el motor no supo leer un
eje). La precedencia **no oculta** los co-bloqueos — están publicados en §5.

## 3. Residual ANTES (vocabulario original)

**411 observaciones sin identidad. 411/411 = 100,00 % clasificado.**

| Cat | n | % del residual | % del corpus |
|---|---:|---:|---:|
| A | 87 | 21,17 % | 10,37 % |
| B | **0** | 0,00 % | 0,00 % |
| C | **150** | **36,50 %** | 17,88 % |
| D | 15 | 3,65 % | 1,79 % |
| E | 49 | 11,92 % | 5,84 % |
| F | 5 | 1,22 % | 0,60 % |
| G | 58 | 14,11 % | 6,91 % |
| H | 46 | 11,19 % | 5,48 % |
| I | 1 | 0,24 % | 0,12 % |
| J | 0 | 0,00 % | 0,00 % |
| **Total** | **411** | **100,00 %** | 48,99 % |

## 4. Residual DESPUÉS

**381 observaciones sin identidad. 381/381 = 100,00 % clasificado.**

| Cat | n | % del residual | Δ vs antes |
|---|---:|---:|---:|
| A | 75 | 19,69 % | −12 |
| B | 0 | 0,00 % | 0 |
| C | 139 | 36,48 % | −11 |
| D | 15 | 3,94 % | 0 |
| E | 49 | 12,86 % | 0 |
| F | 5 | 1,31 % | 0 |
| G | 58 | 15,22 % | 0 |
| H | 39 | 10,24 % | −7 |
| I | 1 | 0,26 % | 0 |
| J | 0 | 0,00 % | 0 |
| **Total** | **381** | **100,00 %** | **−30** |

## 5. Matriz de co-bloqueos (después)

Cuántas observaciones de cada categoría tienen además *otro* eje sin declarar. Es
lo que impide leer la tabla anterior como "arreglando A y C se llega al 99,5 %".

| Cat | n | `ing` | `unit` | `form` | `route` | conc ausente | conc masa-sola | **acuñaría solo con `ing`** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A | 75 | 75 | 22 | 2 | 1 | 38 | 27 | **20** |
| C | 139 | 139 | 52 | 9 | 9 | 29 | 74 | **93** |
| D | 15 | 0 | 8 | 0 | 0 | 15 | 0 | 0 |
| E | 49 | 0 | 33 | 0 | 0 | 0 | 49 | 0 |
| F | 5 | 0 | 5 | 5 | 5 | 0 | 4 | 0 |
| G | 58 | 0 | 31 | 8 | 8 | 56 | 2 | 0 |
| H | 39 | 13 | 37 | 27 | 27 | 20 | 18 | 3 |
| I | 1 | 0 | 1 | 1 | 1 | 0 | 1 | 0 |

## 6. El techo de un arreglo de ingrediente

Sobre el censo **anterior**, contando cuántas observaciones acuñarían si el eje
`ing` pasara a conocido y **nada más** cambiara (misma regla que
`isMintableConceptSignature`):

```
142 de 411 observaciones del residual
→ Gate A máximo alcanzable = (428 + 142) / 839 = 67,94 %
```

**269 observaciones del residual no dependen del vocabulario en absoluto.** Están
bloqueadas por concentración o forma (los conteos se solapan porque una
observación puede tener varios ejes sin declarar): 158 sin concentración legible,
76 con masa absoluta en una forma donde eso es lectura parcial, 56 sin forma
farmacéutica legible. Eso es lo que hace que
`MORE_DATA_REQUIRED` sea el resultado correcto y no una rendición: el eje que
este ticket podía mover no alcanza el umbral ni en el mejor caso posible.

Y dentro de esas 142, **104 son de categoría C** — nombres que no escriben
ninguna molécula. No hay vocabulario que las resuelva: hace falta una tabla
marca→molécula.

## 7. Las 20 cabeceras comerciales más frecuentes del residual sin molécula

De `analysis/head-tokens.json`. Son la evidencia de qué dato externo haría falta.

| Discriminante | Obs. | Farmacias | Molécula real (no declarada en el nombre) |
|---|---:|---:|---|
| `tapsin` | 62 | 7 | paracetamol y asociaciones |
| `actron` | 8 | 2 | ibuprofeno |
| `broncot` | 6 | 3 | ambroxol |
| `amoval` | 6 | 2 | amoxicilina |
| `rigotax` | 6 | 2 | cetirizina |
| `kitadol` | 6 | 2 | paracetamol |
| `remitex` | 5 | 2 | cetirizina |
| `panadol` | 5 | 1 | paracetamol |
| `ambilan` | 4 | 1 | amoxicilina + clavulánico |
| `ibupirac` | 4 | 1 | ibuprofeno |

Nótese que la molécula de la columna derecha **no está escrita en el nombre**:
afirmarla sería exactamente lo que la regla de honestidad prohíbe. Por eso estas
observaciones quedan `unresolved` y no se "arreglan" con vocabulario.
