# CF-DATA-007 — Regresión

## 1. Suites completas

| Suite | Resultado |
|---|---|
| `pnpm --filter @comparafarma/domain test` | **616 passed** (23 archivos) |
| `pnpm --filter api test` | **420 passed** (36 archivos) |
| `pnpm --filter web test` | **312 passed** (36 archivos) |
| `pnpm --filter mobile test` | **51 passed** (8 suites) |
| `pnpm typecheck` | **domain + api + web + mobile: Done** |

Evaluadores de S0/S1 recalculados sobre una copia aislada del harness, **sin
sobrescribir** `docs/qa/cf-search-012/analysis/` — ver `METRICS.md` §4.

## 2. Ningún test de v1 modificado

Los tres únicos archivos tocados son de la capa v2:

| Archivo | Cambio |
|---|---|
| `searchV2.compositionReader.test.ts` | +16 tests; 1 fila de caracterización actualizada |
| `searchV2.conceptCollision.test.ts` | 1 test de límite reapuntado; +1 test nuevo |
| `compositionReader.ts` | 2 entradas de vocabulario v2 + documentación |

No se tocó ningún test de `matching`, `deduplication`, `pricing`,
`productIdentity`, `commercialIdentity`, `brandIdentity`, `relevance`,
`queryIntent`, ni ninguna suite de `api`, `web` o `mobile`.

### Las dos caracterizaciones que cambiaron, y por qué

Ambas **documentaban exactamente la limitación que este ticket fue creado para
corregir**, usando `omeprazol` como ejemplo:

1. `searchV2.compositionReader.test.ts` — la fila
   `["Omeprazol 20 mg x 30 cápsulas", []]` esperaba **cero** moléculas. Ahora
   espera `["omeprazol"]`. La expectativa anterior era el síntoma, no el contrato.

2. `searchV2.conceptCollision.test.ts` — el test *"LÍMITE MEDIDO DE S1 — sin
   molécula demostrable no se acuña identidad"* usaba `omeprazol`. **El límite
   sigue existiendo** (226 de 839 observaciones sin principio activo demostrable),
   así que el test **no se borró**: se reapuntó a `tibolona`, molécula real del
   corpus (`Lirex Tibolona 2,5 mg 30 Comprimidos`, Cruz Verde) que sigue sin
   resolverse por falta de evidencia. La caracterización se conserva intacta; solo
   cambia el ejemplo. Se agregó además un test que verifica que `omeprazol` ahora
   sí acuña y que **no colisiona con `esomeprazol`**.

## 3. Regresiones establecidas que se mantienen

Todas verificadas por test, todas con nombres reales del corpus.

| Caso | Comportamiento esperado | |
|---|---|:--|
| **Adorlan** (diclofenaco + tramadol sin separador) | Lee las 2 moléculas; no colisiona con el monofármaco de diclofenaco | PASS |
| **Tapsin Puro SIN Cafeína** | `ing=paracetamol`, `negatedComponents=[cafeina]`; nunca afirma cafeína presente | PASS |
| **Tapsin Duo** | Lee paracetamol + ibuprofeno; **no** agrega `tapsin`; no cae en ninguno de sus monofármacos | PASS |
| **Zomel HP Triterapia** | Ni `zomel` ni `triterapia` entran como molécula | PASS |
| **Losartán / HCTZ** | Lee las 2; el monofármaco de losartán no comparte concepto con la asociación | PASS |
| **Amoxicilina / Clavulánico** | Lee las 2; `acido` nunca entra como molécula | PASS |
| **Concentraciones de Ambroxol** | `30 mg/5 mL` no es razón de dosis; el nombre truncado `15mg/5...` no inventa asociación | PASS |
| **Dosage form** | Descriptores de forma nunca son principio activo | PASS |
| **Route** | óvulo=vaginal, gotas óticas=otic, supositorio=rectal | PASS |
| **Unit** | Un sobre no es un comprimido | PASS |
| **Combodart** (dutasteride/tamsulosina) | Sigue **sin** moléculas afirmadas — decisión de CF-SEARCH-011 mantenida | PASS |

## 4. Superficie de riesgo explícitamente comprobada

| Riesgo | Medición | Resultado |
|---|---|---|
| **Brand false positives** | Ningún token de marca en APPROVE; test por clase | **0** |
| **Salt false positives** | Ningún ion/sal en APPROVE; sales siguen transparentes | **0** |
| **Descriptor false positives** | Ningún descriptor en APPROVE; `retard` rechazado pese a pasar la regla de frecuencia | **0** |
| **Negation regressions** | Observaciones que afirman una molécula declarada ausente | **0** |
| **Tokens perdidos** | Moléculas que se leían antes y ya no | **0** |
| **Identidades perdidas** | Observaciones que tenían identidad y la perdieron | **0** |
| **omeprazol / esomeprazol** | Conceptos distintos, sin colisión de substring | PASS |

## 5. Lo que NO se tocó

`matchKey`, `presentationKey`, `combinationKey`, `mergeDuplicates` v1, ranking,
slugs, `COMPOSITION_VOCABULARY`, `SALT_QUALIFIER_WORDS`, `mobile/`, historial,
alertas, clicks, `CACHE_PREFIX`, contratos de `MedicationResult` /
`PharmacyPrice`, clientes de farmacia, y la evidencia comiteada de CF-SEARCH-012
(`docs/qa/cf-search-012/analysis/`).
