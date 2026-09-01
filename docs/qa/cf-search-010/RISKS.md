# CF-SEARCH-010 — Riesgos

Dos listas: los riesgos de construir v2, y los de no construirlo. Ambas son
insumo para la decisión de Mario/ChatGPT, no una decisión.

---

## 1. Riesgos de construir Search Engine v2

| ID | Riesgo | Prob. | Impacto | Mitigación en el diseño |
|---|---|---|---|---|
| **V-01** | **Falso merge introducido por relajar el eje `brand:`.** Al dejar de tratar `brand:unknown` como excluyente, dos productos comerciales distintos podrían caer en la misma tarjeta — el riesgo clínico que CF-SEARCH-001 corrigió | Media | **Crítico** | La identidad pasa a `conceptId + presentationId`, que incorporan concentración y cantidad **como identidad** (hoy están fuera de la clave). `SPLIT_LOST = 0` es condición de bloqueo del shadow. Y la política se conserva: ante contradicción explícita, no se fusiona |
| **V-02** | **Rotación de slugs durante M5.** La sexta migración de URL en dos semanas | Alta | Alto | Es la **última**: después de v2 el ID no se deriva del algoritmo. `identity_legacy_map` resuelve slugs viejos sin red. Las 6 generaciones se conservan |
| **V-03** | **Latencia.** Resolver 4 identidades por oferta contra Supabase, en Vercel Hobby | Media | Alto | Caché en memoria de proceso (patrón ya probado en `medicationRegistry.ts`); una sola consulta por lote; shadow en `waitUntil`; degradación elegante a v1 |
| **V-04** | **Coste de Supabase.** 4 tablas nuevas y escrituras por búsqueda | Media | Medio | Escritura solo ante identidad nueva, no por request. Se mide en S1 antes de S2 |
| **V-05** | **Deriva del registro.** Una heurística mala asigna un `conceptId` incorrecto y queda **persistida para siempre** — peor que un error recalculado | Media | Alto | `status: 'merged'` + `mergedIntoConceptId` (RFC-002 ya lo tiene); `source: 'auto' \| 'curated'`; `confidence`; y curación manual sobre los `ambiguous`. Un ID mal asignado es corregible; lo que no se corrige es borrarlo |
| **V-06** | **Alcance.** El diseño toca `packages/domain`, `api`, `web`, `mobile` y Supabase a la vez | **Alta** | Alto | Los 8 pasos de `MIGRATION_STRATEGY.md` son independientes y reversibles. M1 y M2 no cambian nada visible |
| **V-07** | **Rotura de `mobile/` en producción** | Baja | **Crítico** | Contrato estrictamente aditivo; Mobile va último; los binarios publicados siguen leyendo `matchKey`/`presentationKey`, que nunca desaparecen |
| **V-08** | **PM-001.** Tocar `packages/domain` en el pipeline de deploy | Baja | Crítico | Las 4 reglas se respetan: no se toca `ci.yml` ni `api/vercel.json`; `postinstall` sigue compilando a `dist/` |
| **V-09** | **Se construye v2 y queda a medias.** Un tercer sistema de identidad conviviendo con los dos actuales | **Media** | Alto | Es el riesgo real. Mitigación de gobierno, no técnica: cada fase con criterio de salida explícito y decisión de Mario. Si S0 no pasa, se descarta y se borran las tablas |
| **V-10** | **Sin fuente regulatoria, v2 sigue dependiendo de texto libre** | **Alta** | Medio | Cierto y aceptado. v2 no elimina el parsing: lo convierte en **entrada al registro** en vez de **ser** la identidad. La diferencia es que un error se corrige una vez, en un registro, en vez de repetirse en cada request |

### El riesgo dominante es V-09, y no es técnico

El repositorio ya tiene tres precedentes de trabajo terminado y no mergeado, o
gateado y no ejecutado: `BIOEQUIVALENCE-DATA-QUALITY-01` (pasos 3-8 sin
autorización desde el 2026-08-25), la branch de evidencia de CF-QA-001, y el
`FOLLOW_UP` de claves persistidas de Mobile. **Un v2 a medias sería peor que el
v1 actual.**

---

## 2. Riesgos de NO construir v2 (extender el motor actual)

| ID | Riesgo | Prob. | Impacto | Evidencia |
|---|---|---|---|---|
| **N-01** | **La fragmentación no se corrige y empeora.** 89,6 % de tarjetas comparan una sola farmacia, en un comparador de precios | **Alta** | **Crítico** | Medido hoy; medido igual por CF-QA-001 hace 24 h (90,5 %). Tres fixes después, sin cambio |
| **N-02** | **Cada eje nuevo obliga a elegir entre rotar slugs o duplicar claves.** No hay tercera opción con la estructura actual | **Certeza** | Alto | `unitCount` y `concentration` quedaron fuera de la clave por esa razón exacta ⇒ 4 pares de productos comparten URL |
| **N-03** | **La séptima generación de slug.** Ya hay 6; cada mejora futura suma una | Alta | Medio | `resolveMedication.ts:117-140` |
| **N-04** | **Los vocabularios manuales siguen creciendo y siguen incompletos.** El caso `ambroxol` (65 falsos splits) se repetirá con cada molécula no observada | **Certeza** | Medio | 9 vocabularios; `COMPOSITION_TOKENS` no incluye `ambroxol` |
| **N-05** | **`matchKey` seguirá guardando errores en el histórico.** 141 ofertas con el volumen leído como cantidad, imposible de corregir sin invalidar `price_history` | **Certeza** | Alto | Medido; `unitCountKey` lo lee bien y no puede aplicarse |
| **N-06** | **El comportamiento global ya no es razonable.** 8 ejes, 9 vocabularios, 6 generaciones, 2 taxonomías de marca | **Certeza** | Alto | Es el motivo del ticket |
| **N-07** | **Los 379 tests no protegen de esto.** Verifican reglas, no resultados | **Certeza** | Alto | 379 verdes conviven con 185 comparaciones perdidas |
| **N-08** | **Riesgo de producto: el usuario no obtiene la comparación prometida.** En `ambroxol 30mg`, los jarabes correctos de $790 quedan bajo comprimidos de $11.190 | **Alta** | **Crítico** | Traza 1 de `QUERY_TRACES.md`. Choca con `PRODUCT_PRINCIPLES.md` |
| **N-09** | **Deuda de arquitectura empresarial.** El EDM (§Principio 5) declara: *"Toda nueva capacidad deberá reutilizar las entidades existentes. La duplicación conceptual constituye deuda de arquitectura"* | Certeza | Medio | El motor no implementa ninguna de las 4 entidades como identidad |
| **N-10** | **Sin métrica de calidad instrumentada, la degradación es invisible** | Alta | Alto | `CF-SEARCH-004` propuesto por CF-QA-001, no implementado. Hoy solo se detecta con campañas manuales |

---

## 3. Riesgos vigentes del programa que afectan a esta decisión

Contrastado con `docs/program/RISKS.md` y `PROGRAM_BOARD.md`:

| Riesgo | Efecto |
|---|---|
| **R-009** — 3 de 9 scrapers frágiles | **Restricción de diseño.** Shadow mode **no puede** duplicar peticiones. El diseño lo prohíbe explícitamente (regla 5) |
| **R-007** — sin fuente confiable de bioequivalencia | **Agravado con evidencia nueva.** El dataset ISP de `datos.gob.cl` está **vacío por API y congelado en 2016 por CSV**. La premisa de "Sprint B" cambió |
| **Vercel Hobby** | Límite de duración de función ⇒ shadow asíncrono obligatorio |
| **vc34 en revisión de Google Play** | **Ningún cambio de este diseño puede tocar `mobile/` mientras vc34 no cierre.** M7 va último por diseño, así que no hay conflicto |
| **Checkout principal atrasado/dirty** | Respetado: toda la auditoría corrió en worktree aislado |

---

## 4. Riesgo residual del propio documento

1. **Corpus de 16 consultas.** Amplio en ofertas (1.634) pero angosto en
   moléculas. Las cifras de fragmentación podrían variar en otras familias.
2. **La clasificación v2 de las 32 tarjetas es una hipótesis**, verificable solo
   en shadow.
3. **No se midió la latencia de v1**, así que no hay línea base para V-03.
4. **El "concepto aproximado" no es una propuesta de clave**, es un piso de
   cardinalidad calculado con lo que v1 ya sabe leer.
5. **No se probó ninguna navegación real** contra `www.preciosfarma.cl`. Los 4
   pares colisionados son una propiedad aritmética de la clave, verificada; lo
   que ve el usuario ante una colisión lo midió CF-WEB-002, no este documento.
