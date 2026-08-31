# CF-QA-001 — QA_SUMMARY

**Pregunta central:** ¿ComparaFarma compara precios solo entre productos/presentaciones
que razonablemente corresponden al mismo producto?

**Respuesta corta:** en su mayoría sí, y por razones verificables — pero falla en un
eje concreto (concentración de formas líquidas) y **falla más por defecto que por
exceso**: 9 de cada 10 tarjetas comparan una sola farmacia. El error dominante hoy no
es fusionar lo que no corresponde, es no fusionar lo que sí.

---

## 1. Environment

| | Entorno 1 — Producción actual | Entorno 2 — PR bajo prueba |
|---|---|---|
| Branch | `origin/main` | `fix/quantity-mismatch-false-merge` |
| SHA | `acd79bf6f22b79b5fb96d49f0df0a90244743f57` | `b20402a77d71894e7f920d06a91ffa4a0f2910ad` |
| Base del PR | — | `acd79bf` (verificado con `git merge-base`) |
| Worktree | `C:\Belford\wt-qa-search-identity` (creado para esta campaña) | `C:\Belford\wt-quantity-mismatch` (preexistente, **solo lectura**) |
| Contiene | CF-SEARCH-001 (#132), CF-SEARCH-002 (#133), BIOEQUIVALENCE-DATA-QUALITY-01 (#141) | lo anterior + fix de cantidad |

- **API:** `https://comparafarma-api.vercel.app/api/search` — `GET` público, sin auth,
  sin `?debug=1`.
- **Web:** `https://www.preciosfarma.cl` — `GET` público.
- **Captura RAW:** 2026-08-31T01:20–01:27 UTC. **Navegación:** 2026-08-31T01:40–01:50 UTC.
- **Versiones:** `packages/domain` 1.0.0 · `web` 0.1.0 · `mobile` 1.0.0 · `api` (sin
  `version`) · Node v24.14.0.
- **Feature flags:** ninguno aplicable. El único modificador de comportamiento del
  endpoint es `?debug=1`, no usado (requiere `API_SECRET_KEY`; ver §9, limitaciones).
- **Secretos:** ninguno enviado, ninguno guardado. Los sobres de `raw/` contienen URL,
  método, timestamps, status y cuerpo — sin headers.

---

## 2. Dataset y cobertura

**29 consultas ejecutadas, 28 con resultados.** Bloque A = mínimo obligatorio del
ticket; bloque B = estrés de formas farmacéuticas contra el catálogo real.

- **A (13):** tapsin, diclofenaco, amoxicilina, paracetamol, ibuprofeno, losartan,
  omeprazol, aspirina, metformina, clorfenamina, cetirizina, naproxeno, loratadina.
- **B (16):** tapsin sobre, kitadol, supositorios, glicerina, clotrimazol, salbutamol,
  ambroxol, hidrocortisona, betametasona, dipirona, ketoprofeno, vitamina d gotas,
  amoxicilina suspension, nistatina, next, ~~aerosol~~.

`aerosol` devolvió **HTTP 400** `"No se pudo interpretar la busqueda."`: `cleanQuery()`
consume la palabra entera como ruido de presentación (`STOP_WORDS`) y no queda consulta.
No es un fallo de identidad de producto — se registra como observación de UX.

| Métrica | Valor |
|---|---|
| Consultas con resultados | **28** |
| Tarjetas analizadas | **2.347** |
| Ofertas analizadas | **2.627** (2.281 únicas en el corpus global deduplicado) |
| Farmacias cubiertas | **9 de 9** |
| Formas farmacéuticas cubiertas | solid-oral 1.197 · fluid-oral 541 · topical 247 · suppository 179 · inhaled 62 · injectable 53 · ophthalmic 28 · patch 2 · sin clasificar 318 |
| Canales de precio observados | store 2.040 · online 324 · cmr 222 · sbpay 41 |

Ofertas por farmacia: araucomed 424 · salcobrand 418 · ahumada 404 · cruz-verde 398 ·
ecofarmacias 298 · easyfarma 245 · dr-simi 194 · farmex 155 · sermecoop 91.

---

## 3. Resultado de los 12 tests

| # | Test | Resultado | Medición |
|---|---|---|---|
| 1 | **Cantidad** | **PASS** | 0 tarjetas con dos cantidades explícitas distintas, sobre 2.627 ofertas y también sobre el corpus global agrupado por `presentationKey`. 2 casos explícita-vs-`null`, ambos el mismo producto (no error). Ver §7. |
| 2 | **Dosis** | **FAIL** | **5 tarjetas** con dos concentraciones en mg explícitas y distintas, todas `fluid-oral`. → **QA-SEARCH-001 (P1)** |
| 3 | **Forma farmacéutica** | **PASS** | 0 tarjetas mezclan dos `dosageFormClass` conocidas y distintas. Observación menor: comprimido y cápsula de liberación prolongada comparten `solid-oral` (2 tarjetas). |
| 4 | **Variante comercial** | **PASS** | 0 tarjetas con variantes distintas. Familia Tapsin completa verificada (121 tarjetas, 9 multi-oferta, 23 variantes). Fragmentación por sinónimos → **QA-SEARCH-009 (P3)** |
| 5 | **Integridad de oferta** | **PASS** | 0 anomalías reales. Detalle en §4. |
| 6 | **Navegación** | **FAIL** | **7 de 48** enlaces de ficha emitidos por la propia página de resultados no resuelven (14,6 %); todos responden HTTP 200. → **QA-SEARCH-002 (P1)** |
| 7 | **Laboratorio/marca** | **FAIL** | 5 de 9 farmacias nunca aportan `laboratory`; 1 (Salcobrand) aporta el nombre del producto; 1 (Cruz Verde) lee un campo inexistente. → **QA-SEARCH-004 (P2)**, **CF-DATA-001** |
| 8 | **"Marca no identificada"** | **WARNING** | Ranking completo en §4. 1.503 de 2.627 ofertas (57 %) con `brand:unknown` en `presentationKey`. |
| 9 | **Nombres truncados** | **FAIL** | 167 de 245 ofertas de EasyFarma (68,2 %), `SOURCE_TRUNCATION` confirmado en el adaptador. 0 en las otras 8. → **QA-SEARCH-007 (P3)** |
| 10 | **Precio sospechoso** | **WARNING** | 16 outliers (`max/min ≥ 3`) investigados uno por uno: 13 legítimos, 3 producto distinto. Ninguno por precio de otro producto. → detalle en **QA-SEARCH-006** |
| 11 | **Stock** | **WARNING** | Asociación oferta↔stock correcta (0 anomalías). Pero el `bestPrice` sale de una oferta agotada en 375 tarjetas (16 %), y 2 de 9 adaptadores hardcodean `hasStock: true`. → **QA-SEARCH-006 (P2)** |
| 12 | **False splits** | **FAIL** | 90,5 % de las tarjetas comparan una sola farmacia; 270 grupos equivalentes repartidos sin solapamiento de farmacias. → **QA-SEARCH-003 (P2)**, **QA-SEARCH-005 (P2)** |

**Resumen: 4 PASS · 5 FAIL · 3 WARNING.**

---

## 4. Contadores pedidos

| Métrica | Valor |
|---|---|
| **False merges encontrados** | **5** (todos por concentración en formas líquidas — QA-SEARCH-001). **0** por cantidad, **0** por forma, **0** por variante. |
| **False splits encontrados** | **270** grupos farmacológicamente equivalentes repartidos en tarjetas distintas sin solapamiento de farmacias (346 grupos fragmentados en total, 923 tarjetas involucradas) |
| **Cantidades incompatibles** | **0** fusionadas. 2 casos explícita-vs-ausente (ambos el mismo producto, correctamente fusionados) |
| **Dosis incompatibles** | **5** fusionadas |
| **Formas incompatibles** | **0** fusionadas |
| **Variantes incompatibles** | **0** fusionadas |
| **Problemas de laboratorio/marca** | 5 farmacias con 100 % `null`; 1 con semántica equivocada en 333/399 (83,5 %); 1 mapeo muerto; 28 tokens `brand:` inválidos |
| **Problemas de navegación** | 7/48 fichas irresolubles (14,6 %); tapsin 3/6 (50 %); las 48 responden HTTP 200 aun cuando el servidor decidió 404 |
| **Problemas de integridad de oferta** | **0** |
| **Problemas de URL** | **0** |
| **Problemas de truncamiento** | 167 (100 % EasyFarma) |
| **Outliers de precio investigados** | 16 de 16 |

### Test 5 en detalle — por qué "0 anomalías" y no "no lo miré"

Cuatro comprobaciones automáticas sobre las 2.627 ofertas:

| Comprobación | Resultado |
|---|---|
| El `canonicalName` de la tarjeta es el `productName` de una oferta **presente** en esa tarjeta | **0 fallos / 2.347 tarjetas** — confirma en producción el fix de CF-SEARCH-001 |
| El `slug` del tracker `/api/go` coincide con el `pharmacySlug` de la oferta | **0 fallos / 2.627** |
| El `matchKey` del tracker coincide con el `matchKey` de la tarjeta | **0 fallos / 2.627** |
| El host de la URL de destino pertenece a la farmacia | **0 fallos / 2.627** |

Los 155 hallazgos de `IMAGE_HOST_FOREIGN` que reporta `findings.json` son **falsos
positivos del detector, revisados uno a uno**: los 155 son Farmex sirviendo imágenes
desde `cdn.shopify.com`, y Farmex efectivamente corre sobre Shopify (el adaptador lee
el campo `vendor` de Shopify, `api/src/clients/farmex.ts:66`). Se dejan en la salida
cruda a propósito, con esta nota, en vez de silenciarlos en el detector.

También verificado: 0 ofertas sin `onlineUrl` (2.627/2.627); 249 sin imagen (9,5 %).

### Test 8 — ranking de "marca no identificada"

| Farmacia | Ofertas | `laboratory` null | % |
|---|---|---|---|
| cruz-verde | 308 | 308 | **100 %** |
| ahumada | 307 | 307 | **100 %** |
| easyfarma | 208 | 208 | **100 %** |
| ecofarmacias | 200 | 200 | **100 %** |
| sermecoop | 47 | 47 | **100 %** |
| araucomed | 355 | 58 | 16,3 % |
| farmex | 107 | 6 | 5,6 % |
| dr-simi | 194 | 0 | 0 % |
| salcobrand | 399 | 0 | 0 % — **pero 83,5 % del valor es el nombre del producto, no un laboratorio** |

Medido sobre tarjetas de una sola oferta: solo ahí el `laboratory` es atribuible sin
ambigüedad a esa farmacia. Detalle y matriz de campo fuente en **QA-SEARCH-004**.

---

## 5. Cómo se calculó la fragmentación (test 12)

Reproducible sobre `analysis/offers.json`:

```js
// agrupa por identidad farmacologica COMPLETA, ignorando solo bio: y brand:
const sig = [query, matchKey, dosageFormClass, commercialVariantKey,
             combinationKey, unitCountKey].join("~");
// grupos con >1 presentationKey  -> 346  (923 tarjetas)
// de esos, sin farmacia repetida -> 270  (comparacion realmente perdida)
```

Distribución de farmacias por tarjeta: 1 → 2.125 · 2 → 178 · 3 → 33 · 4 → 9 · 5 → 1 ·
6 → 1 · 7-9 → 0.

---

## 6. Verificaciones de build y test (ejecutadas, no asumidas)

Sobre el worktree del PR (`C:\Belford\wt-quantity-mismatch`, `b20402a`):

```
$ pnpm typecheck
  packages/domain typecheck: Done   api typecheck: Done
  web typecheck: Done               mobile typecheck: Done

$ pnpm --filter @comparafarma/domain test
  Test Files  14 passed (14)   Tests  311 passed (311)

$ pnpm --filter api test
  Test Files  34 passed (34)   Tests  383 passed (383)

$ pnpm --filter web test
  Test Files  35 passed (35)   Tests  281 passed (281)
```

975 tests verdes. **Verde en Vitest no es un caso aprobado**: los 5 false merges de
QA-SEARCH-001 y los 7 enlaces rotos de QA-SEARCH-002 conviven con esos 975 tests.

### Alcance del diff del PR

```
$ git diff --stat acd79bf..b20402a
 packages/domain/src/__tests__/quantityIdentity.test.ts | 330 +++
 packages/domain/src/deduplication.ts                   |  26 +-
 packages/domain/src/index.ts                           |   2 +
 packages/domain/src/pricing.ts                         |   3 +-
 packages/domain/src/productIdentity.ts                 | 212 ++-
 5 files changed, 566 insertions(+), 7 deletions(-)
```

Todo dentro de `packages/domain`. No toca `api/`, `web/`, `mobile/`, `ci.yml` ni
`api/vercel.json`. Disciplina de alcance (`CLAUDE.md` §5): **respetada**.

### Reglas críticas de `CLAUDE.md` §11

- **PM-001 (4 reglas de deploy):** el PR **no toca** `ci.yml` ni `api/vercel.json`, así
  que ninguna se altera. Sí toca `packages/domain`, que es la regla 4: verificado que
  el paquete sigue compilando con `tsc --project tsconfig.build.json` y que
  `exports`/`main`/`types` siguen apuntando a `dist/`. `src/index.ts` mantiene las
  re-exportaciones con extensión `.js` (`export { unitCountKey } from "./productIdentity.js"`).
  **Pendiente de confirmación manual, no verificable desde el repositorio:**
  Root Directory = `api` en el dashboard de Vercel del proyecto `comparafarma-api`.
- **Cache versioning:** el PR **no agrega ni modifica campos** de `MedicationResult` ni
  de `PharmacyPrice` (`packages/domain/src/types.ts` no está en el diff). `ProductIdentity`
  —tipo interno de la capa de identidad, no parte de la respuesta del API— sí gana el
  campo `unitCount`. **No corresponde incrementar `CACHE_PREFIX`** en
  `mobile/src/lib/cache.ts`. (Sí correspondería si se implementa CF-DATA-003, que
  cambiaría `hasStock` a `boolean | null` — ver QA-SEARCH-006.)
- **Scrapers frágiles:** el PR no toca `api/src/clients/`. Igualmente se verificó que
  los 9 adaptadores traen resultados en producción hoy — 9/9 farmacias presentes en el
  corpus, incluidos los tres frágiles (ahumada 404 ofertas, sermecoop 91, easyfarma 245).

---

## 7. A/B de los dos entornos — efecto real del PR

Técnica: se toman las respuestas RAW de producción (entorno 1), se explota cada tarjeta
en un `MedicationResult` por oferta, y se pasa el **mismo** input por
`mergeDuplicates()` de los **dos** builds de `@comparafarma/domain`.

### Por consulta (`analysis/ab-merge.json`)

```
baseCards: 2347   prCards: 2347   queriesWithDelta: 0
```

### Corpus global (todas las consultas juntas, deduplicado)

```
ofertas unicas en corpus global: 2281
tarjetas BASE: 2022 | tarjetas PR: 2022 | delta: 0
solo en BASE: 0 | solo en PR: 0
```

**El PR no cambia ni una sola tarjeta sobre los datos de producción de hoy.**

### Y sin embargo, el eje que agrega sí es real

`unitCountKey()` produce una cantidad explícita en **150 ofertas** (111 nombres
distintos) donde el segmento de cantidad de `matchKey` no ve nada. Verificado sobre
nombres reales:

```
"Diclofenaco 50 mg 5 supositorios"        matchKey: diclofenaco|50mg   unitCountKey: 5
"Next Fwd 24 Tabs /50"                    matchKey: nextfwd            unitCountKey: 24
"Clotrimazol 100 mg 6 óvulos"             matchKey: clotrimazol|100mg  unitCountKey: 6
"Tapsin Sobre Noche (Maver)"              matchKey: tapsin|n           unitCountKey: 1
"Amoxicilina 250mg/5ml x 60 ml"           (volumen, correctamente)     unitCountKey: null
```

Es decir: la red de seguridad que el PR agrega **existe y funciona**, simplemente hoy
no hay ninguna colisión que atrapar. El caso reportado originalmente —"1 sobre
comparado contra una caja de 6"— **no es reproducible en producción hoy**: los sobres
sueltos (`tapsin|n`, `tapsin|5000mg|n`) y las cajas (`tapsin|n|6`) tienen `matchKey`
distinto porque `sobres` **sí** está en `QUANTITY_PATTERN`, y por lo tanto nunca
comparten `presentationKey`.

### Riesgo introducido

3 patrones reales de nombre donde `unitCountKey()` deriva una cantidad **falsa**
(`10unidades`→1, `4Un`→1, `25-25`→2525, `200 Ds`→200). Bajo la regla dura del PR, una
cantidad falsa es una **prohibición de fusión**. Hoy ninguno colisiona con una
contraparte, así que el delta es 0 — pero el riesgo queda latente y crece justamente si
se mejora el eje `brand:` (QA-SEARCH-003/005). Detalle: **QA-SEARCH-008 (P2)**.

---

## 8. Matriz de hallazgos

| ID | Título | Severidad | Capa | Introducido por el PR | Quick win |
|---|---|---|---|---|---|
| QA-SEARCH-001 | Dos concentraciones en la misma tarjeta (formas líquidas) | **P1** | `packages/domain` (`matching.ts`) | No — preexistente | No |
| QA-SEARCH-002 | 14,6 % de fichas enlazadas no resuelven; soft-404 con HTTP 200 | **P1** | `web` | No — preexistente | Parcial (status 404) |
| QA-SEARCH-003 | 90,5 % de tarjetas comparan una sola farmacia | P2 | `packages/domain` (`commercialIdentity.ts`) | No — preexistente | No |
| QA-SEARCH-004 | `laboratory` con semántica inconsistente / mapeo muerto | P2 | `api/src/clients` | No — preexistente | Sí (Cruz Verde) |
| QA-SEARCH-005 | Tokens no-marca en `brand:` (`15gr`, `diclofenaco`) | P2 | `packages/domain` (`commercialIdentity.ts`) | No — preexistente | Sí |
| QA-SEARCH-006 | "Mejor precio" agotado (16 %) + stock afirmado sin dato | P2 | `packages/domain` + `api/src/clients` | No — preexistente | No |
| QA-SEARCH-007 | EasyFarma: 68 % de nombres truncados en origen | P3→P2 | `api/src/clients/easyfarma.ts` | No — preexistente | No |
| QA-SEARCH-008 | `unitCountKey()` deriva cantidades falsas (falso split latente) | P2 | `packages/domain` (`productIdentity.ts`) | **Sí** | Sí |
| QA-SEARCH-009 | Sinónimos de variante comercial (Tapsin) | P3 | `packages/domain` | No — preexistente | No |
| QA-SEARCH-010 | Cosmética por encima del medicamento en consultas ambiguas | P3 | `packages/domain` (`relevance.ts`) | No — preexistente | No |

---

## 9. Limitaciones honestas de esta campaña

1. **Datos post-merge.** Se usó el endpoint público, que devuelve el resultado ya
   fusionado. Si dos presentaciones distintas de la **misma farmacia** compartieran
   `presentationKey`, `mergeDuplicates` ya habría descartado la más cara antes de que
   yo la viera. Mitigación aplicada: se agruparon las ofertas de las 28 consultas por
   `presentationKey` a través de todo el corpus, buscando la misma farmacia aportando
   nombres distintos con cantidades explícitas distintas → **0 casos**. El único modo
   de cerrar el punto por completo es `?debug=1` (pre-merge), que requiere
   `API_SECRET_KEY` — **no se pidió ni se usó**.
2. **Screenshots ausentes.** `@playwright/test` está declarado en `web/package.json`
   pero no instalado en ningún worktree. No se fabricó ninguna captura. La navegación se
   verificó con HTTP real, no simulado. Ver `screenshots/README.md`.
3. **Confirmación visual pendiente.** La evidencia HTTP prueba que el servidor decide
   "no encontrado"; falta confirmar en un navegador qué ve el usuario (pantalla de 404
   o fallback "Cargando ficha…").
4. **Snapshot único.** Todas las mediciones son de una ventana de ~30 minutos del
   2026-08-31. Los precios y el stock cambian; la identidad (claves, agrupamiento) es
   determinista dado el nombre y no depende del momento.
5. **Vercel Root Directory** del proyecto `comparafarma-api` no es verificable desde el
   repositorio (`CLAUDE.md` §11, regla 2 de PM-001). Queda como confirmación manual.

---

## 10. Relación con riesgos y bloqueos vigentes

Contrastado con `docs/program/RISKS.md` y `docs/program/PROGRAM_BOARD.md`
(`origin/main@acd79bf`):

| Riesgo | Efecto de esta campaña |
|---|---|
| **R-009** — 3 de 9 scrapers frágiles (Ahumada, Sermecoop, EasyFarma) | **Agravado en evidencia, no en probabilidad.** Los 3 responden hoy (404/91/245 ofertas), pero QA-SEARCH-007 documenta que EasyFarma ya entrega dato degradado *sin estar caído*: el monitor horario lo daría por sano. El monitor verifica disponibilidad, no calidad. |
| **R-007** — sin fuente confiable de bioequivalencia | **Efecto lateral cuantificado.** Tras PR #141 el eje `bio:` fragmenta el catálogo (QA-SEARCH-003): las farmacias que informan bioequivalencia quedan aisladas de las 5 que no informan nada. Corregir R-007 reduciría directamente esa fragmentación. |
| **R-008** — deploy roto puede quedar verde | **Indiferente.** El PR no toca el pipeline. |
| **R-003** — `?debug=1` sin auth garantizada | **Indiferente, y respetado:** no se usó ni se intentó. |
| `CF-WEB-001-FU1` (follow-up abierto en el board) | **Indiferente.** Es legibilidad del gráfico de histórico en móvil; nada de lo hallado acá lo toca. |

**Ningún bloqueo vigente del board impide mergear el PR bajo prueba, y el PR no agrava
ninguno de los riesgos registrados.**

---

## 11. Decisión sobre `fix/quantity-mismatch-false-merge`

# SAFE_TO_MERGE

Con dos condiciones de honestidad en el registro, no de bloqueo.

**Por qué es seguro:**

- **No introduce ninguna regresión observable.** A/B sobre 2.281 ofertas únicas de las
  9 farmacias: 2.022 tarjetas idénticas en ambos entornos, 0 diferencias en ambos
  sentidos.
- **No produce ningún falso "no merge"** sobre datos reales de hoy: 0 casos donde el
  PR separe algo que `origin/main` fusionaba.
- **La asimetría `null` = comodín está bien elegida.** Los 2 únicos casos
  explícita-vs-ausente del corpus (`Ketoprofeno …x5amp.` vs `…x 5 ampollas`;
  `Salbutamol …x 200 dosis` vs `…X 200 Ds`) son el mismo producto: tratarlos como
  incompatibles habría partido 2 tarjetas correctas sin evitar ningún falso merge.
- **Alcance limpio:** 5 archivos, todos en `packages/domain`. No toca el pipeline de
  deploy, no cambia el contrato público, no requiere bump de `CACHE_PREFIX`.
- **975 tests verdes y typecheck limpio**, ejecutados por QA, no reportados.

**Lo que el reporte del PR afirma y la evidencia NO respalda** (deuda documental, no
bug): el problema que el PR dice resolver —"1 sobre comparado contra una caja de 6"—
**no es reproducible en producción hoy**. `sobres` está en `QUANTITY_PATTERN`, así que
el sobre suelto y la caja de 6 nunca comparten `matchKey`, y por lo tanto nunca
comparten `presentationKey`. El PR es una **red de seguridad correcta para un fallo que
hoy no ocurre**, no la corrección de un defecto activo. Los comentarios del código
("es el defecto que produjo el reporte de QA") deberían decir eso.

**Lo que sí introduce:** 3 patrones de nombre real donde `unitCountKey()` deriva una
cantidad falsa (QA-SEARCH-008, P2). No causa daño hoy porque ninguno colisiona con una
contraparte — pero es una regla **dura** alimentada por un lector **frágil**, y el
riesgo crece exactamente cuando se mejore el eje `brand:`. Debe entrar como follow-up
`CF-SEARCH-006` **antes** de cualquier trabajo sobre QA-SEARCH-003/005, no después.

**Clasificación pedida:**

| Categoría | Hallazgos |
|---|---|
| **Introducidos por el PR** | QA-SEARCH-008 (P2) — latente, 0 impacto medido |
| **Preexistentes** | QA-SEARCH-001, 002, 003, 004, 005, 006, 007, 009, 010 |
| **Deuda técnica no bloqueante** | Comentarios del PR que afirman un defecto no reproducible; ausencia de tests para los 3 patrones frágiles |

Ninguno de los preexistentes es causado ni agravado por el PR. Bloquearlo por ellos
sería castigar un cambio correcto por problemas que ya estaban.

**No mergeo ni deployo** — eso es de Mario. Esta es la recomendación de QA.

---

## 12. Backlog propuesto (proponer, no implementar)

| ID propuesto | Título | Sev. | Evidencia | Depende de | Recomendación |
|---|---|---|---|---|---|
| `CF-SEARCH-003` | Concentración en formas líquidas | **P1** | QA-SEARCH-001 | — | Segmento `conc:` en `presentationKey`. **No tocar `matchKey`** (persistido). Considerar nueva generación de hash de slug en Web. |
| `CF-WEB-002` | Ficha irresoluble desde resultados vigentes | **P1** | QA-SEARCH-002 | (b) depende de RFC-002 / CFM-ID | (a) responder 404 real — quick win; (b) resolución persistida — decisión de arquitectura |
| `CF-DATA-001` | **Laboratory / Brand Identity Quality** | P2 | QA-SEARCH-004 | — | 3 partes: semántica del contrato; Salcobrand publica marca como laboratorio (333/399); Cruz Verde `cruzverde.ts:66` es mapeo muerto |
| `CF-DATA-002` | Tokens no-marca en identidad comercial | P2 | QA-SEARCH-005 | CF-DATA-001 (parcial) | Quick win: rechazar `^\d+(gr?\|mg\|ml\|mcg\|ui\|cc)$` en `isPlausibleCommercialIdentity()` |
| `CF-DATA-003` | Stock afirmado sin evidencia (Ahumada, EasyFarma) | P2 | QA-SEARCH-006 §B | cambio de contrato `hasStock` | Mismo criterio que PR #141. Si cambia el tipo ⇒ **incrementar `CACHE_PREFIX`** (`CLAUDE.md` §11) |
| `CF-SEARCH-004` | Métrica de cobertura de comparación | P2 | QA-SEARCH-003 | — | Instrumentar farmacias-por-tarjeta y grupos fragmentados. Hoy el sistema puede degradarse sin que nada lo detecte |
| `CF-SEARCH-006` | Robustez de `unitCountKey` | P2 | QA-SEARCH-008 | **el PR bajo prueba** | Follow-up inmediato. 3 correcciones acotadas + tests en `quantityIdentity.test.ts` |
| `CF-WEB-003` | Titular de mejor precio vs disponibilidad | P2/P3 | QA-SEARCH-006 §A | CF-DATA-003 | Distinguir precio más bajo de precio más bajo comprable |
| `CF-SEARCH-005` | EasyFarma: nombre truncado en origen | P3→P2 | QA-SEARCH-007 | R-009 | Riesgo: multiplicar peticiones a un scraper frágil. Decisión de arquitectura |
| `CF-SEARCH-007` | Sinónimos de variante comercial | P3 | QA-SEARCH-009 | — | Bajo impacto medido |

La priorización relativa entre estos ítems **no es una recomendación de QA**: es
materia de `docs/program/`. Lo que sí afirma QA es la severidad de cada hallazgo y su
evidencia.
