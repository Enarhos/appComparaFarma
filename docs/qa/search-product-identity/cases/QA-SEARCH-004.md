# QA-SEARCH-004 — `laboratory` significa cosas distintas en cada farmacia (y en una de ellas no significa laboratorio)

| Campo | Valor |
|---|---|
| **Severidad** | **P2** — el dato alimenta `presentationKey`, así que afecta identidad, no solo display |
| **Clasificación** | `DATA_QUALITY` / `SEMANTIC_MISMATCH` |
| **Test** | 7 (laboratorio/marca) y 8 (marca no identificada) |
| **Estado** | Preexistente. Indiferente al PR bajo prueba |
| **Reproducibilidad** | Determinista: es el mapeo del adaptador, no un dato variable |

## Matriz por adaptador

Campo fuente leído del código (`origin/main@acd79bf`); valor normalizado y semántica
medidos sobre 2.078 tarjetas de **una sola oferta** — solo ahí el `laboratory` de la
tarjeta pertenece inequívocamente a esa farmacia (en una tarjeta fusionada el
laboratorio es el de la oferta canónica y no puede atribuirse al resto).

| Farmacia | Campo fuente | Archivo:línea | Ejemplo de valor observado | Semántica aparente | Confiabilidad |
|---|---|---|---|---|---|
| **salcobrand** | `hit.brand` (Algolia) | `api/src/clients/salcobrand.ts:46` | `Ambroxol` · `Muxol Pediatrico` · `Broncot` | **`PRODUCT_NAME` / `BRAND`** | **No confiable como laboratorio** |
| **dr-simi** | `product.brand` (VTEX) | `api/src/clients/drsimi.ts:74` | `PRATER` · `HOSPIFARMA` · `OPKO` · `SEVEN PHARMA` | `LABORATORY` | Confiable |
| **farmex** | `vendor` (Shopify) | `api/src/clients/farmex.ts:66,77` | `ANDROMACO` · `EUROLAB` · `OPKO` | `MANUFACTURER` | Confiable |
| **araucomed** | `p.manufacturer_name` (PrestaShop) | `api/src/clients/araucomed.ts:75` | `Ascend` · `Andrómaco` · `Eurofarma` · `Seven Pharma` | `MANUFACTURER` | Confiable |
| **cruz-verde** | `hit.brand` (Demandware) | `api/src/clients/cruzverde.ts:66` | **siempre `null`** | `UNKNOWN` — **mapeo muerto** | Nula |
| **ahumada** | — (`null` literal) | `api/src/clients/ahumada.ts:110` | `null` | `UNKNOWN` | Nula |
| **easyfarma** | — (`null` literal) | `api/src/clients/easyfarma.ts:117` | `null` | `UNKNOWN` | Nula |
| **ecofarmacias** | — (`null` literal) | `api/src/clients/ecofarmacias.ts:62` | `null` | `UNKNOWN` | Nula |
| **sermecoop** | — (`null` literal) | `api/src/clients/sermecoop.ts:73` | `null` | `UNKNOWN` | Nula |

## Test 8 — ranking de "marca no identificada"

| Farmacia | Ofertas analizadas | `laboratory` null | % |
|---|---|---|---|
| cruz-verde | 308 | 308 | **100 %** |
| ahumada | 307 | 307 | **100 %** |
| easyfarma | 208 | 208 | **100 %** |
| ecofarmacias | 200 | 200 | **100 %** |
| sermecoop | 47 | 47 | **100 %** |
| araucomed | 355 | 58 | 16,3 % |
| farmex | 107 | 6 | 5,6 % |
| dr-simi | 194 | 0 | 0 % |
| salcobrand | 399 | 0 | 0 % *(pero ver abajo)* |

**Salcobrand tiene 0 % de nulos y es el peor dato de los nueve.** De sus 399 ofertas:

- **279 (69,9 %)** tienen `laboratory` idéntico al principio activo derivado del nombre.
- **333 (83,5 %)** tienen `laboratory` que es literalmente el **prefijo del nombre del
  producto**.

```
laboratory="Ambroxol"                          <- "Ambroxol 30mg/5ml Jarabe 100ml"
laboratory="Muxol Pediatrico"                  <- "Muxol Pediátrico Ambroxol Jarabe 100ml"
laboratory="Broncot"                           <- "Broncot Ambroxol 30mg/5ml 120ml"
laboratory="Amoxicilina / Ácido Clavulánico"   <- "Amoxicilina / Ácido Clavulánico (B) 875/125 14 Comprimidos Recubiertos"
```

El contraste con los adaptadores confiables es el discriminante decisivo — mismo test,
mismo corpus:

| Farmacia | `laboratory` es prefijo del nombre del producto |
|---|---|
| salcobrand | **333 / 399 (83,5 %)** |
| dr-simi | 0 / 194 |
| farmex | 0 / 107 |

Un laboratorio real (`PRATER`, `ANDROMACO`) nunca es el comienzo del nombre comercial.
Es el campo `brand` de Algolia, que en el índice de Salcobrand es la marca comercial
del producto, no el laboratorio fabricante. Una interfaz que muestre "Laboratorio:
Ambroxol" está afirmando algo falso con la apariencia de un dato verificado — peor que
un `null` honesto.

**Cruz Verde lee un campo que no existe.** `cruzverde.ts:66` hace
`(hit.brand as string) ?? null`, pero el comentario inmediatamente debajo
(añadido en PR #141) enumera las claves reales del `hit` de Demandware:
`_type, currency, hit_type, image, link, orderable, price, prices, product_id,
product_name, product_type, represented_product`. No hay `brand`. El mapeo es código
muerto que nunca produjo un valor: 308/308 nulos lo confirman en producción.

## Por qué es P2 y no P3

`laboratory` no es solo display. `packages/domain/src/pricing.ts:87,111` lo pasa como
`structuredBrand` a `resolveCommercialIdentity()`, que produce el segmento `brand:` de
`presentationKey` — la clave con la que `mergeDuplicates` decide qué es el mismo
producto. Un `laboratory` con semántica equivocada no equivoca una etiqueta: cambia el
agrupamiento (ver QA-SEARCH-003 y QA-SEARCH-005).

## Evidencia

- `analysis/laboratory-matrix.json` — matriz completa con muestras por farmacia
- `analysis/offers.csv` — columna `laboratory`
- `analysis/findings.json` → `findings.labEqualsIngredient` (325 ofertas)
- Adaptadores citados arriba con archivo:línea

## Issue recomendado

**`CF-DATA-001 — Laboratory / Brand Identity Quality`** (P2). Tres sub-problemas
distintos, no uno:

1. **Semántica no declarada.** El contrato (`ScrapedProduct.laboratory`,
   `packages/domain/src/types.ts`) tiene un solo campo para lo que las fuentes llaman
   `brand`, `vendor` y `manufacturer_name`. Salcobrand demuestra que no son lo mismo.
2. **Salcobrand publica marca comercial como laboratorio** (276/399). Decidir: o se
   deja de mapear (`null` honesto, coherente con lo que hizo PR #141 con
   bioequivalencia), o se distingue `brand` de `laboratory` en el contrato.
3. **Cruz Verde: mapeo muerto** (`cruzverde.ts:66`). Quick win: o se elimina, o se
   busca el atributo real en la respuesta de Demandware.

Depende de: nada. Bloquea: cualquier mejora de `brand:` en `presentationKey`
(QA-SEARCH-003, QA-SEARCH-005).
