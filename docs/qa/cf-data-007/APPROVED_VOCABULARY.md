# CF-DATA-007 — Vocabulario aprobado

**Dos tokens nuevos**, los dos en la capa v2 (`V2_MOLECULE_VOCABULARY`,
`packages/domain/src/searchV2/compositionReader.ts`).

## 1. Los tokens

| Token | Evidencia | Corpus | Efecto medido |
|---|---|---|---|
| `omeprazol` | Fuente (3): `KNOWN_ACTIVE_INGREDIENTS` + `COMPOSITION_TOKENS` | 24 observaciones, **7 de 9 farmacias** (ahumada, cruz-verde, dr-simi, easyfarma, ecofarmacias, farmex, salcobrand) | 24 observaciones ganan principio activo |
| `esomeprazol` | Fuente (3): `KNOWN_ACTIVE_INGREDIENTS` + `COMPOSITION_TOKENS` | 11 observaciones, 4 farmacias (dr-simi, easyfarma, ecofarmacias, farmex) | 10 observaciones ganan principio activo (1 ya lo tenía por separador) |

El detalle de por qué la regla de frecuencia de CF-DATA-001 no puede descubrirlos
está en `CANDIDATES.md` §2.

## 2. Efecto medido sobre el corpus

```
Observaciones cuyo conjunto de principios activos cambió ... 34
  tokens ganados ....... omeprazol (24), esomeprazol (10)
  tokens perdidos ...... ninguno

Observaciones que pasaron a tener identidad canónica ........ 30
  fixedByVocabulary .................. 30
  fixedByParser ......................  0
  fixedByRegistryResolution ..........  0
Observaciones que PERDIERON identidad ........................ 0
```

Las 4 observaciones que ganaron principio activo pero **no** alcanzaron identidad
siguen bloqueadas por otro eje (concentración o forma). Se contabilizan en el
residual, no se disimulan.

## 3. Por qué van en v2 y NO en `COMPOSITION_VOCABULARY`

El ticket pide medir los consumidores de v1 **antes** de decidir. Se midió.

### Consumidores de `COMPOSITION_VOCABULARY` en v1

| Ubicación | Qué hace |
|---|---|
| `brandIdentity.ts:298` (G1) | Si la **cabecera** del nombre está en el vocabulario → `{brand: null, activeIngredient: <token>}` |
| `brandIdentity.ts:319` (G2) | Si un token del segmento descriptivo está en el vocabulario → lo publica como `activeIngredient` y toma la cabecera como marca |
| `brandIdentity.ts:389` | Descarta un `structuredBrand` cuyo token normalizado sea un principio activo conocido |

### Impacto medido de agregarlos a v1

```
Ofertas donde la molécula ES la cabecera (dispararía G1) ......... 32
Ofertas donde aparece más adelante en el nombre (dispararía G2) ...  3
Ofertas cuyo structuredBrand upstream ES la molécula (l. 389) .....  0
                                                          TOTAL ... 35
```

**35 ofertas cambiarían el campo publicado `activeIngredient`** (hoy `null`,
pasaría a `"omeprazol"`/`"esomeprazol"`). Ese campo lo consumen `web` y `mobile`
para mostrar, y moverlo exigiría además subir `CACHE_PREFIX` en
`mobile/src/lib/cache.ts`.

### Lo que NO se movería

`presentationKey` **no** depende de `resolveBrandIdentity`. CF-DATA-001 lo congeló
a propósito: `legacyLaboratoryValue()` (`pricing.ts:115`) lee los campos **crudos**
(`product.manufacturer ?? product.brand`), no la marca saneada. Así que ni
`presentationKey`, ni la deduplicación, ni los slugs de Web se moverían.

### Decisión

Aun siendo un cambio probablemente **correcto** (publicar `activeIngredient` en un
genérico de omeprazol es mejor que publicar `null`), es un cambio de la capa de
**presentación de v1**, fuera del alcance de un ticket cuyo objetivo es el Gate A
de **v2**. Se deja como `FOLLOW_UP` para decisión de CTO/Product.

En la capa v2 el impacto medido sobre v1 es **0**: `V2_MOLECULE_VOCABULARY` solo
lo lee `compositionReader.ts`, que solo alimenta el motor v2.

## 4. Lo que se documentó en el código

El comentario de `V2_MOLECULE_VOCABULARY` pasó de declarar **un** criterio
reproducible a declarar **dos**, con la etiqueta de cuál sostiene cada entrada:

- **(E1)** separador explícito en el corpus vía `combinationKey()` — sostiene
  `tramadol` y `cafeina`, sin cambios;
- **(E2)** vocabulario farmacológico ya validado en el proyecto — sostiene
  `omeprazol` y `esomeprazol`.

(E2) **no baja el umbral de (E1)**: aporta una evidencia distinta e independiente
para la clase de producto —el genérico nombrado por su molécula— que (E1) no
puede ver. Las exclusiones históricas (`acido`, `miel`, `triterapia`,
`dutasteride`, `tamsulosina`) se conservan y se ampliaron con las nuevas
(`flurbiprofeno`, `tibolona`, `pamabrom`, `fosfomicina`, `colecalciferol`).
