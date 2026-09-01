# CF-WEB-002 — QA_SUMMARY

**Pregunta central:** ¿por qué un producto que EXISTÍA cuando la página de
resultados generó su enlace deja de ser identificable cuando se resuelve ese
mismo enlace?

**Respuesta corta:** por dos causas independientes y acumulativas. (1) El
resolver volvía a buscar con el **nombre completo** del producto, que para los
9 buscadores de farmacia es una consulta más angosta y distinta de la que
originó el enlace: el producto simplemente no estaba entre los candidatos.
(2) El hash del slug es `shortHash(presentationKey)`, y `presentationKey` **no
identifica un producto**: desde CF-SEARCH-001/003 el dominio separa tarjetas por
cantidad y por concentración sin meter esos ejes en la clave, así que dos
productos distintos comparten hash.

Y un hallazgo que CF-QA-001 no podía ver: la segunda causa no solo rompía
enlaces, **resolvía a la ficha equivocada en silencio** — el enlace de "Cam
Jarabe Betametasona **0,25 mg**" mostraba la ficha de "Cam Betametasona **2 mg**",
ocho veces la concentración, sin 404 ni redirect ni advertencia.

---

## 1. Environment

| | Línea base | Branch |
|---|---|---|
| Rama | `origin/main` | `fix/cf-web-002-detail-resolution` |
| SHA | `5a1e7e3f2e37b4960d01cebd9a3e3eb9cba7e15f` | ver informe de entrega |
| Contiene | CF-SEARCH-001/002/003, BIOEQUIVALENCE-DATA-QUALITY-01, fix de cantidad | lo anterior + CF-WEB-002 |
| Worktree | copia de solo lectura de `web/src/lib` (`--web-src`) | `C:\Belford\wt-cf-web-002` |

- **API:** `https://comparafarma-api.vercel.app/api/search` — `GET` público, sin
  `?debug=1`, sin `x-api-key`.
- **Web (screenshots):** `https://www.preciosfarma.cl`.
- **Captura del corpus:** 2026-08-31T23:57 – 2026-09-01T00:07 UTC.
  **Línea base:** 00:10–00:27 UTC. **Fixed:** 00:35–00:42 UTC.
- **Versiones:** Node v24.14.0 · pnpm 9.0.0 · Next 16.2.10 · vitest 4.1.10 ·
  `packages/domain` 1.0.0.
- **Secretos:** ninguno enviado ni almacenado. Ninguna escritura en base de datos.

## 2. Dataset

**16 consultas · 1.564 tarjetas · 128 enlaces de ficha resueltos en vivo por
corrida · 7 slugs históricos de CF-QA-001.**

Bloque obligatorio del ticket (tapsin, ambroxol, ibuprofeno, betametasona,
diclofenaco, amoxicilina, paracetamol, losartan, omeprazol, metformina,
clorfenamina, cetirizina, naproxeno, loratadina) más las dos consultas que
cubren los casos restantes de CF-QA-001 (clotrimazol, glicerina).

El corpus fuente (`raw/baseline/`) está **congelado**: la corrida "fixed" lo
reutiliza con `--raw-label baseline`, así que los 128 enlaces evaluados son
byte a byte los mismos y la única variable del A/B es el código del resolver
(`comparison.json → sameCorpus: true`, `comparedURLs: 127`).

## 3. Reproducción: los 7 casos de CF-QA-001 siguen vivos

No se dio por válido el diagnóstico previo. Los 7 enlaces muertos de
QA-SEARCH-002 se reintentaron contra el código de `origin/main` de hoy:

**7 de 7 seguían muertos** (`baseline.legacyResolved: 0/7`). Además, 3 de ellos
volvieron a aparecer espontáneamente en el muestreo de enlaces recién emitidos
(`tapsin-x-6-comprimidos-noche-maver-3a14ey6g56zgt`,
`tapsin-x-6-comprimidos-maver-jfz5p0p85x6n`,
`clotrimazol-crema-topica-al-1-x-20-g-surfarma-23poitc26mv6o`): no son enlaces
viejos, la app los sigue emitiendo hoy y siguen sin resolver.

## 4. Las 18 hipótesis, medidas

| # | Hipótesis | Veredicto |
|---|---|---|
| A | Slug con identidad insuficiente | **CONFIRMADA (parcial)** — el hash no distingue productos con la misma `presentationKey`; la parte legible sí, pero el resolver la ignoraba en la generación vigente |
| B | El slug depende demasiado de `canonicalName` | **DESCARTADA como causa** — 13 de 103 resoluciones correctas resuelven a un nombre distinto y son el mismo producto; el nombre no es el problema |
| C | `canonicalName` cambia según qué farmacia responde | REAL pero no causal acá (ya mitigado por el desempate determinista de CF-SEARCH-001) |
| D | El resolver reconstruye una consulta débil | **CONFIRMADA — causa raíz #1.** Medido: 137 vs 24 tarjetas |
| E | Compara con `matchKey` donde debería usar `presentationKey` | DESCARTADA — ya usa `presentationKey` |
| F | `presentationKey` derivada en momentos distintos | DESCARTADA — se compara la clave que viaja en la respuesta, no una re-derivada |
| G | CF-SEARCH-001/002/003 producen claves distintas | **CONFIRMADA — causa raíz #2**, vía los ejes que quedaron FUERA de la clave |
| H | La búsqueda en vivo devuelve otro conjunto | **CONFIRMADA** — es el mecanismo de D |
| I | El producto queda fuera del límite de resultados | DESCARTADA — `/api/search` no trunca (`results.length === withIds.length`) |
| J | Normalización / acentos / mojibake | DESCARTADA — 0 casos |
| K | Diferencias de laboratorio/marca | DESCARTADA como causa de navegación (es CF-DATA-001, fuera de alcance) |
| L | Diferencias de variante comercial | DESCARTADA — `\|var:` está en la clave, el hash ya las separa |
| M | Diferencias de cantidad | **CONFIRMADA** — `unitCountKey` vive fuera de la clave |
| N | Diferencias de concentración (CF-SEARCH-003) | **CONFIRMADA** — 5 de 5 colisiones estáticas son de concentración líquida |
| O | Dependencia del orden de las farmacias | DESCARTADA — test explícito con 3 órdenes distintos |
| P | Slugs históricos Gen1..GenN y fallbacks | **CONFIRMADA (agravante)** — `Gen 6-bio` aceptaba otro valor de `\|bio:` cuando la tarjeta correcta no había sido recuperada (2 de los 3 wrong-product) |
| Q | URL encoding/decoding | DESCARTADA — 0 casos |
| R | `notFound()`/redirects/cache/status de Next | **CONFIRMADA, aparte** — soft-404, ver CF-WEB-002-004 |

## 5. Causa raíz

**#1 — Recuperación.** `resolveMedicationBySlug` buscaba con la parte legible
completa del slug. `cleanQuery("tapsin x 6 comprimidos noche maver")` →
`"tapsin noche maver"`, que devuelve 24 tarjetas en vez de las 137 de
`"tapsin"`, y la tarjeta buscada no está entre ellas. → CF-WEB-002-001.

**#2 — Identidad.** `shortHash(presentationKey)` no identifica un producto:
`mergeDuplicates` emite a propósito dos tarjetas con la misma `presentationKey`
cuando difieren en cantidad o concentración (ejes que CF-SEARCH-001/003 dejaron
deliberadamente fuera de la clave). 2,2 % de las tarjetas del corpus caen ahí.
→ CF-WEB-002-002 (404) y CF-WEB-002-003 (ficha equivocada).

Las dos causas interactúan: con la consulta angosta, a veces volvía **una sola**
de las dos tarjetas en colisión y el resolver la aceptaba sin poder saber que
era la otra. Ese es el mecanismo exacto del caso de betametasona.

## 6. Diseño

Tres cambios en `web/`, ninguno en `packages/domain` ni en `api`:

1. **Escalera de recuperación** — cabecera de marca (`brandHeadTokens()` del
   dominio) y después el nombre completo. Se corta en la primera consulta que
   produzca candidatos, incluso si el resultado es ambiguo.
2. **Guardia de identidad** — una candidata que contradice la concentración o la
   cantidad declaradas en el slug no es elegible por ninguna generación.
   Reutiliza `isCompatibleConcentration`/`isCompatibleUnitCount` del dominio.
   Los dos lados se leen tras la misma normalización con pérdida del slug.
3. **Desempate por parte legible en la generación vigente** — restricción
   adicional sobre el hash, nunca un reemplazo.

Más `cache()` de React en la ruta para no resolver dos veces por request
(CF-WEB-002-005).

**No se tocó `matchKey`. No se tocó `presentationKey`. No rota ningún slug: 0
URLs cambian, 0 redirects nuevos** (`comparison.json → redirected: 0 → 0`).

### Alternativa evaluada y rechazada: rotar el hash del slug (Gen 7)

Incluir `unitCount` y `concentration` en el hash haría que la colisión no
existiera por construcción. Medido antes de decidir: **1.136 de 1.564 tarjetas
(72,6 %) declaran al menos uno de esos dos ejes**, así que rotarían ~3 de cada 4
URLs de ficha para corregir un 2,2 %, y todas las visitas a enlaces ya emitidos
pasarían por un 301. La guardia obtiene el mismo resultado medido
(`wrongProduct 0`, `ambiguous 0`) con 0 rotación. Queda documentada como opción
si en el futuro la identidad de slug se persiste (CFM-ID / RFC-002).

## 7. Soft-404 — medido, NO corregido

Matriz de experimentos con `next build` + `next start` + `curl` reales:

| Configuración | Status |
|---|---|
| Producción actual | **200** |
| Sin `medicamento/[slug]/loading.tsx` | **200** |
| `notFound()` desde `generateMetadata` | **200** (también como Googlebot) |
| Sin ningún `loading.tsx` | **404** |

El responsable es el `loading.tsx` del **segmento raíz**, que envuelve a todo el
sitio. Corregirlo obliga a dejar sin esqueleto de carga a una ficha que tarda
segundos en resolver: decisión de producto, no consecuencia técnica de este
ticket. Se reporta para decisión CTO/Product. Detalle en CF-WEB-002-004.

## 8. QA A/B — mismo corpus, 128 enlaces

| Métrica | Línea base | CF-WEB-002 | Δ |
|---|---|---|---|
| Tarjetas del corpus | 1.564 | 1.564 | = |
| Enlaces de ficha generados | 128 | 128 | = |
| `RESOLVED_EXACT` | 103 | **127** | +24 |
| `REDIRECTED` | 0 | 0 | = |
| `RESOLVED_WRONG_PRODUCT` | **3** | **0** | **−3** |
| `AMBIGUOUS` | 6 | **0** | −6 |
| `NOT_FOUND` | 16 | 1 | −15 |
| `ERROR` | 0 | 0 | = |
| **resolutionRate** | 80,5 % | **99,2 %** | **+18,7** |
| **wrongProductRate** | 2,3 % | **0 %** | −2,3 |
| **notFoundRate** | 17,2 % | 0,8 % | −16,4 |
| Slugs de CF-QA-001 que resuelven | **0/7** | **7/7** | +7 |

**Enlaces que cambiaron de clasificación: 24 arreglados, 0 regresiones, 1
lateral.** El lateral es el de betametasona: pasa de
`RESOLVED_WRONG_PRODUCT` a `NOT_FOUND`. Es el resultado correcto — la tarjeta de
0,25 mg no estaba en el catálogo del momento, y un 404 es preferible a la ficha
de 2 mg.

El único `NOT_FOUND` restante es ese mismo caso.

## 9. Criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Causa raíz demostrada | ✅ dos causas, con medición directa |
| 2 | Casos originales reproducibles | ✅ 7/7 reproducidos vivos y después corregidos |
| 3 | Enlaces actuales resuelven la misma presentación | ✅ 127/128 |
| 4 | `RESOLVED_WRONG_PRODUCT = 0` | ✅ |
| 5 | URLs nuevas sin "no encontrado" | ⚠️ 1 de 128 (0,8 %), justificado |
| 6 | Concentraciones no se cruzan | ✅ 6/6 casos + tests |
| 7 | Cantidades no se cruzan | ✅ guardia + test |
| 8 | Variantes no se cruzan | ✅ ya cubierto por `\|var:` + test |
| 9 | Sin dependencia del orden de farmacias | ✅ test con 3 órdenes |
| 10 | `matchKey` sin modificar | ✅ 0 cambios en `packages/domain` |
| 11 | Impacto en `presentationKey` medido | ✅ 0 cambios; alternativa que sí lo tocaba medida (72,6 %) y rechazada |
| 12 | Sin redirect loops | ✅ 0 redirects nuevos + test de ida y vuelta |
| 13 | canonical/sitemap coherentes | ✅ sitemap no contiene fichas; canonical ahora sale de la misma resolución que la página |
| 14 | Producto inexistente con semántica HTTP correcta | ❌ **NO** — soft-404, requiere decisión de producto (§7) |
| 15 | Tests completos verdes | ✅ ver informe |
| 16 | QA A/B reproducible | ✅ `README.md` |

**14 de 16 cumplidos, 1 parcial, 1 abierto por decisión de producto.**

## 10. FOLLOW_UP

- **`FOLLOW_UP`: soft-404** — decisión sobre el `loading.tsx` del segmento raíz
  (CF-WEB-002-004). Bloquea el criterio 14.
- **`FOLLOW_UP`: `Gen 6-bio` es permisiva por diseño** — acepta otro valor de
  `|bio:`, y con eso puede redirigir a una tarjeta con distinta clasificación de
  bioequivalencia. Hoy queda tapada por la corrección de recuperación (0 casos
  después del fix), pero el riesgo sigue latente para enlaces cuya tarjeta
  original desapareció. Restringirla exige medir cuántos de los enlaces ya
  emitidos dependen de ella.
- **`FOLLOW_UP`: la resolución sigue sin persistencia.** Toda esta cadena de
  generaciones y compatibilidades existe porque no hay un registro de identidad
  de ficha. `MedicationResult.cfmId` ya viaja en la respuesta (RFC-002) y no lo
  usa nadie en Web. Es la solución de fondo, y es una decisión de arquitectura.
