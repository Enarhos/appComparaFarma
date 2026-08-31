# QA-SEARCH-009 — Variantes comerciales inconsistentes en la familia Tapsin

| Campo | Valor |
|---|---|
| **Severidad** | **P3** — fragmenta, no confunde |
| **Clasificación** | `LIKELY_FALSE_SPLIT` (menor) |
| **Test** | 4 (variante comercial) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |
| **Reproducibilidad** | Determinista |

## Lo que PASÓ

El test 4 pedía verificar que las variantes de la familia Tapsin no se comparen entre
sí. **Ninguna lo hace.** De 121 tarjetas de Tapsin, 9 son multi-oferta y en las 9 el
`commercialVariantKey` de todas las ofertas coincide:

```
tapsin|12  |bio:unknown|brand:maver  |var:periodo|form:solid-oral  araucomed $1.490 · farmex $1.890
tapsin|20  |bio:unknown|brand:maver  |var:forte  |form:solid-oral  araucomed $1.990 · farmex $1.990
tapsin|12  |bio:unknown|brand:unknown|var:duo    |form:solid-oral  cruz-verde $2.290 · ahumada $3.007
tapsin|10  |bio:unknown|brand:unknown|var:m      |form:solid-oral  ecofarmacias $1.890 · ahumada $2.090
tapsin|30  |bio:unknown|brand:unknown|var:m      |form:solid-oral  ecofarmacias $3.990 · ahumada $5.782
tapsin|15ml|15|bio:unknown|brand:maver|var:infantil|form:fluid-oral araucomed $2.600 · farmex $2.690
...
```

Ningún Rojo con Noche, ningún Día con Migraña, ningún Duo con Forte. **Test 4: PASS.**
CF-SEARCH-001 (eje `|var:`) hace lo que dice hacer, verificado sobre datos reales.

## Lo que sí falla (menor)

El vocabulario de variantes es inconsistente entre farmacias, y eso fragmenta de más.
Variantes detectadas en las 121 tarjetas de Tapsin:

```
null 19 · instaflu 14 · infantil 12 · forte 11 · sc 10 · compuesto 8 · m 8 ·
periodo 7 · plus 7 · limonada 6 · duo 5 · caliente 4 · nocturno 4 · analgesico 3 ·
insta 3 · puro 3 · rojo 1 · dolor 1 · mujer 1 · dianoche 1 · migrana 1 ·
efervecente 1 · limon 1
```

Pares que designan el mismo producto con tokens distintos: `instaflu`/`insta`,
`m`/`migrana`, `limonada`/`limon`, `caliente`/`compuesto`/`nocturno`. Cada par es una
tarjeta de más.

Ejemplo: `Tapsin M Migraña por 10 comprimidos (Maver)` (eco) y
`Tapsin M x 10 Comprimidos Recubiertos` (ahumada) **sí** convergen a `var:m` y se
comparan bien. Pero `Tapsin M Migraña X 30 Comprimidos` vs una hipotética
`Tapsin Migraña x 30` derivarían `m` y `migrana` respectivamente.

## Causa raíz

`commercialVariantKey()` (`packages/domain/src/productIdentity.ts:279`) toma el
calificador tal como aparece después de la cabecera de marca, sin normalización de
sinónimos. Es el diseño declarado: `STOP_WORDS` está congelado porque `matchKey` está
persistido, así que la variante se deriva del texto crudo.

## Evidencia

- `analysis/offers.json` — columna `commercialVariantKey`, filtrar `query == "tapsin"`
- `analysis/findings.json` → `findings.variantMismatch` (**0** — ninguna tarjeta mezcla variantes)

## Issue recomendado

`CF-SEARCH-007 — Sinónimos de variante comercial` (P3). Bajo impacto medido
(fragmentación adicional dentro de una familia de marca). **No priorizar por encima de
QA-SEARCH-001 ni QA-SEARCH-002.** Se registra para que el dato exista, no como
recomendación de roadmap.
