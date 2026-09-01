# CF-DATA-001 — QA Summary

**Fecha:** 2026-08-31 · **Base:** `origin/main` = `57cbd5d` ·
**Branch:** `fix/cf-data-001-brand-laboratory-identity`

## Corpus

| | |
|---|---|
| Auditoría de fuentes (Fase 1) | 3.697 ofertas · 29 búsquedas · 9 farmacias |
| A/B (Fase 4) | 1.127 ofertas · 9 búsquedas · 9 farmacias · mismo corpus en ambos lados |
| Consultas A/B | ambroxol, paracetamol, tapsin, ibuprofeno, losartan, omeprazol, amoxicilina, diclofenaco, cetirizina |

8 farmacias se capturaron llamando a su endpoint upstream real (el mismo que usa
cada adaptador). Salcobrand se capturó desde la respuesta pública de
`/api/search` en producción, restringida a tarjetas de UNA sola oferta, donde la
atribución de `laboratory` a Salcobrand es exacta — no hay credenciales Algolia
locales y **no se inventó ninguna**.

## A/B — BASE (57cbd5d) vs PROPUESTA

### Volumen e identidad (sin cambios, es el objetivo)

| Métrica | BASE | PROPUESTA | Δ |
|---|---:|---:|---:|
| `totalOffers` | 1027 | 1027 | **0** |
| `totalCards` | 870 | 870 | **0** |
| `multiPharmacyCards` | 123 | 123 | **0** |
| `presentationKey` distintos | 821 | 821 | **0** |
| `presentationKeyChanges` | — | — | **0** |
| `matchKey` changes | — | — | **0** |
| `falseMerges` introducidos | — | — | **0** |
| `falseSplits` introducidos | — | — | **0** |
| `slugChanges` (Web) | — | — | **0** |

`falseMerges` y `falseSplits` no son una estimación: la **composición completa de
las 870 tarjetas** (qué ofertas viajan juntas) se comparó oferta por oferta entre
BASE y PROPUESTA y resultó idéntica. Con 0 cambios de agrupación no puede haber
ni una fusión ni una separación nueva.

### Calidad del dato de marca (es lo que mejora)

| Métrica | BASE | PROPUESTA |
|---|---:|---:|
| `cardsWithBrand` | 0 (el campo no existía) | **315** |
| `cardsWithManufacturer` | 0 (el campo no existía) | **262** |
| tarjetas identificadas (marca **o** laboratorio) | 398 | **528** |
| `cardsWithUnknownBrand` | 472 (medido como "sin `laboratory`") | 555 |

### Qué cambió para el usuario, tarjeta por tarjeta

| Efecto | Tarjetas |
|---|---:|
| Fabricante que se mostraba como "Marca" → ahora marca real + laboratorio | **57** |
| "Marca no identificada" → marca real recuperada del nombre | **144** |
| Genérico que mostraba su laboratorio como "Marca" → "Marca no identificada" + laboratorio con su etiqueta | **227** |
| Sin marca antes y después | 328 |

Las 227 no son una regresión: el laboratorio se sigue mostrando, con su etiqueta
correcta. Lo que desaparece es la afirmación falsa de que "Ascend" o "Mintlab"
sean la MARCA de un genérico que no tiene marca.

Detalle con nombres reales: `representative-cases.md`.

## Precisión de la derivación desde el nombre

Medido sobre las 3.697 ofertas del corpus completo:

| Variante | Cobertura de marca | Marcas que eran un principio activo |
|---|---:|---:|
| Sin guardias | 40,0 % | **5,7 %** (`diclofenaco`, `paracetamol`, `cetirizina`, `tramadol`, `ibuprofeno`, `levocetirizina`…) |
| **Con las dos guardias (implementada)** | **31,6 %** | **0 observadas** |

Cobertura de `activeIngredient`: 60,6 %.

Se eligió la variante conservadora: la política del proyecto prefiere el falso
negativo (un hueco) al falso positivo (un dato inventado), y llamar "Marca" a un
principio activo es exactamente el defecto que este ticket existe para eliminar.

## Vocabulario de composición — artefacto derivado

34 tokens, **generados algorítmicamente** por `scripts/derive-inn.mjs` sobre las
3.697 ofertas. Evidencia por token, con conteos:
`active-ingredient-vocabulary.csv`.

Regla (4 condiciones automáticas + 1 exclusión documentada):
1. aparece en el segmento descriptivo del nombre (antes de la primera dosis/cantidad);
2. antecede inmediatamente a una magnitud de dosis (una molécula se dosifica; un descriptor de sabor o marketing no);
3. acompaña a ≥2 cabeceras de marca distintas en ≥2 farmacias distintas;
4. no aparece en ningún campo estructurado de fabricante;
5. exclusión manual, 4 tokens de 107 candidatos, cada uno con su motivo en el
   encabezado del script: `ninos`, `retard`, `dermica`, `piel`.

Sin la condición (1) la derivación producía `ascend`, `opko`, `hospifarma`,
`mintlab`, `pasteur`, `curaespring`, `chile`, `cenabast`. Sin la (2) producía
`night`, `senior`, `sabor`, `limon`, `serum`, `facial`, `gummies`, `garnier`.

## Tests

| Paquete | Resultado |
|---|---|
| `@comparafarma/domain` | 379 pasan (16 archivos) — **+29 nuevos** en `brandIdentity.test.ts` |
| `api` | 383 pasan (34 archivos) |
| `web` | 309 pasan (36 archivos) — **+2 nuevos** |
| `mobile` | 51 pasan (8 suites) |
| `pnpm typecheck` | domain + api + web + mobile: Done |

`packages/domain/src/__tests__/__snapshots__/contract.test.ts.snap` queda byte a
byte igual: el contrato de `matchKey` no se tocó.

## Reproducir

```bash
node docs/qa/cf-data-001/scripts/capture-sources.mjs      # upstream de 8 farmacias
node docs/qa/cf-data-001/scripts/capture-production.mjs   # corpus BASE de produccion
node docs/qa/cf-data-001/scripts/derive-inn.mjs           # vocabulario + su CSV de evidencia
node docs/qa/cf-data-001/scripts/ab-test.mjs              # A/B (requiere .ab-base, ver README)
```

Las capturas crudas (~4 MB de JSON) **no se versionan**: se regeneran con los dos
primeros scripts. Lo que sí queda versionado son los CSV derivados y este resumen.
