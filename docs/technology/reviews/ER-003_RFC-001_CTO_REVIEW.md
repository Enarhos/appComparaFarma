# ER-003 — Revisión CTO de RFC-001 (Shared Domain Package)

**ID:** ER-003
**Nombre:** RFC-001 CTO Review — ¿el paquete compartido se implementó como se prometió, y se cerró el proceso como decía el propio RFC?
**Fecha:** 2026-07-19
**Responsable:** Claude Code (autor original de RFC-001, revisando en rol distinto)
**Revisor:** Claude Code — `/cto-review` (postura adversarial deliberada)
**Estado:** Draft

---

## 1. Resumen Ejecutivo

### Score General: 7.2 / 10

| Dimensión | Score | Notas breves |
|---|---|---|
| Calidad del diagnóstico | 9/10 | Divergencia de `matchKey` cuantificada con ejemplos concretos y tabla comparativa |
| Solidez de la arquitectura propuesta | 9/10 | `packages/domain` sin ciclos, testeado, correctamente adoptado en ambos consumidores |
| Rigor del plan de migración/rollback | 8/10 | Fases reversibles bien pensadas; única fase irreversible (6) correctamente señalizada |
| Testing exigido vs. entregado | 9/10 | `contract.test.ts` con snapshots existe y se implementó tal cual se pidió |
| **Cierre del loop documental** | **2/10** | **0 de ~25 checkboxes del "Definition of Done" están marcados, pese a que el código ya cumple la gran mayoría** |
| Consistencia con el resto del proyecto | 6/10 | Asume un CHANGELOG que no existe; no conecta con SVC-01 (mismo día, mismo revisor) |

### Hallazgo principal

El propio RFC-001 es un caso adicional — y particularmente irónico — del problema estructural que motivó crear los skills `/docs-steward` y `/cto-review` en primer lugar: **se implementó el trabajo pero nunca se cerró el documento que lo describía.** No es un caso aislado de `CF-108` (ya corregido en este mismo ciclo de trabajo) — es el mismo patrón un nivel más arriba, en el RFC padre.

### Recomendación CTO

> La arquitectura y la ejecución técnica de RFC-001 son sólidas — el paquete `packages/domain` está bien diseñado, testeado, y en producción hace lo que promete. Pero el documento que lo gobierna miente sobre su propio estado: dice "en progreso" (implícito, vía checkboxes sin marcar) cuando en realidad está completo en el código desde hace semanas. Autorizar el cierre formal de RFC-001 ahora mismo, y usar este caso como el ejemplo canónico de por qué `/docs-steward` necesita eventualmente extenderse de `CF-xxx` a RFCs/ADRs también (fuera de alcance de esta revisión, pero visible aquí).

---

## 2. Verificación código-contra-documento (lo que un CTO escéptico no da por sentado)

No se aceptó ninguna afirmación del RFC sin verificarla contra el código real:

| Afirmación del RFC | Verificado como | Evidencia |
|---|---|---|
| `packages/domain/src/{types,matching,normalization,pricing,deduplication,index}.ts` existen | ✅ Cierto | Lectura directa de los 6 archivos |
| `api/src/lib/normalization.ts` y `types.ts` eliminados (Fase 6) | ✅ Cierto | No existen en el filesystem actual |
| `mobile/src/lib/normalization.ts` — Fase 4 pedía dejarlo como re-export temporal | ⚠️ **Superado, no solo cumplido** | El archivo **no existe** — se eliminó directamente, saltándose el estado intermedio de shim que el RFC especificaba para la Fase 4 (la eliminación recién estaba prevista para la Fase 6) |
| `mobile/src/lib/types.ts` como re-export temporal | ✅ Cierto | Contenido real: `export type * from "@comparafarma/domain";` — nada más |
| `mobile/src/lib/cache.ts` usa `CACHE_PREFIX = "search_cache_v10_"` | ✅ Cierto | Línea 4, con comentario explicando el porqué de la v10 |
| `matchKey("Trio-Val 80mg")` → `"trioval|80mg"` | ✅ Cierto | Ejecutado directamente contra `packages/domain/src/matching.ts`: output exacto `"trioval|80mg"` |
| `pnpm typecheck` — 0 errores | ✅ Cierto | Corrido hoy: `packages/domain`, `api`, `mobile` — los 3 pasan |
| `contract.test.ts` con snapshots (sección 10.1) | ✅ Cierto | Existe junto con `__snapshots__/contract.test.ts.snap` |
| `.github/workflows/ci.yml` corre tests del paquete nuevo | ✅ Cierto | Job `domain-tests` presente en `ci.yml` |
| DoD "Proceso": `AUDIT_SEARCH_NORMALIZATION.md` — CF-001 marcado como resuelto | ❌ **Falso** | No hay ninguna anotación de "resuelto" cerca de la sección CF-001 en ese archivo — sigue redactado como hallazgo abierto |
| DoD "Proceso": CHANGELOG actualizado | ❌ **Estructuralmente imposible** | No existe ningún archivo CHANGELOG en el repo — el RFC exigió un artefacto de proceso que el proyecto nunca adoptó |
| DoD completo (sección 12) | ❌ **0/25 casillas marcadas** | Ninguna casilla de "Código", "Tests", "Runtime" ni "Proceso" está en `[x]`, pese a que ~22 de 25 sí se cumplen en la práctica |

---

## 3. Hallazgos detallados

### H-01 — El RFC nunca se cerró formalmente (Severidad: Alta)

**Descripción:** `docs/technology/decisions/rfc/RFC-001_SHARED_NORMALIZATION_PACKAGE.md:901-934` — la sección 12 "Definition of Done" tiene 25 checkboxes. Ninguno está marcado (`[x]`), incluyendo los de "Código" y "Tests" que esta revisión confirmó como verdaderos en el filesystem hoy.

**Qué pasaría si no se corrige:** cualquier ingeniero o agente nuevo que lea `RFC-001` sin mirar el código asumirá que la migración sigue en curso o bloqueada, cuando en realidad terminó hace semanas. Es exactamente el mismo riesgo que causó que `CF-108` quedara marcado "Pendiente" — la fuente de esta sesión de trabajo.

**Sugerencia:** correr `/docs-steward` (una vez extendido a RFCs, hoy solo cubre `CF-xxx`) o marcar manualmente el DoD ahora que está verificado.

### H-02 — Ítem de DoD sobre `AUDIT_SEARCH_NORMALIZATION.md` incumplido (Severidad: Media)

**Descripción:** `RFC-001:947` exige que `docs/archive/audits/AUDIT_SEARCH_NORMALIZATION.md` marque CF-001 como resuelto. Verificado: no lo hace.

**Qué pasaría si no se corrige:** el documento de auditoría original queda como fuente de verdad contradictoria — sigue listando un problema como abierto que el propio RFC dice haber resuelto.

### H-03 — Requisito de CHANGELOG asumido sin verificar que existe el mecanismo (Severidad: Baja)

**Descripción:** `RFC-001:946` pide una "entrada de breaking change" en un CHANGELOG que no existe en ningún lugar del repositorio (`find . -iname "CHANGELOG*"` sin resultados).

**Qué pasaría si no se corrige:** este ítem de DoD queda permanentemente incumplible tal como está escrito — no es un bug funcional, pero indica que el RFC no verificó las convenciones reales del proyecto antes de fijar criterios de cierre.

### H-04 — Desconexión con SVC-01 de ER-002 (Severidad: Media, informativa)

**Descripción:** `ER-002` (mismo día, mismo revisor) documentó **SVC-01** — 5 de 9 clientes de farmacia "muertos" en `ALL_SOURCES`, ejecutando requests sin retorno. RFC-001 no menciona este hallazgo en absoluto, pese a compartir contexto y fecha. Verificado hoy: los 9 slugs SÍ están activos en `api/src/services/searchService.ts:76-84`, y el healthcheck extendido (este mismo ciclo de trabajo) confirma que 8 de 9 devuelven resultados reales en producción.

**Qué pasaría si no se corrige:** nada roto — SVC-01 de hecho se resolvió. Pero **no hay ningún documento que registre cuándo ni por qué** se reactivaron esos 5 clientes. Es trabajo real, sin trazabilidad — otra instancia del mismo patrón de fondo (código que avanza, documentación que no lo registra).

### H-05 — Ejecución superó la especificación en Fase 4 (Severidad: Positiva, no es un defecto)

**Descripción:** el RFC pedía que `mobile/src/lib/normalization.ts` quedara como re-export temporal durante la Fase 4, y se eliminara recién en la Fase 6. En la práctica, el archivo fue eliminado directamente — más limpio, sin dejar el estado intermedio. No generó problemas (verificado: sin imports rotos).

**Nota:** se documenta aquí no como hallazgo negativo sino porque un CTO adversarial debe registrar también las desviaciones positivas del plan, no solo las negativas — evita que una futura auditoría interprete la ausencia del archivo como un error de ejecución.

---

## 4. Evaluación de las opciones descartadas (sección 4 del RFC)

Las opciones A, C y D están bien argumentadas y la elección de C es correcta y ya validada por 3+ semanas en producción sin regresiones reportadas. La opción B ("script de build que copia") tiene el análisis más débil del documento: se descarta con "Frágil" sin cuantificar el modo de falla ni considerar una variante asimétrica (mobile como fuente canónica en vez de api). No cambia la conclusión — la opción C sigue siendo claramente superior — pero el rigor del descarte es menor que el del resto del documento.

---

## 5. Conclusión

RFC-001 es, en su contenido técnico, uno de los documentos más rigurosos del repositorio: diagnóstico cuantificado, arquitectura sin ciclos, plan de migración en fases reversibles, riesgos con mitigación primaria y de respaldo, y una estrategia de testing que efectivamente se implementó tal cual se especificó. La ejecución en código está, en la práctica, completa y correcta.

Su falla no es técnica — es de cierre. El mismo documento que instruye "agregar tests de contrato para prevenir divergencias silenciosas" es hoy, él mismo, una fuente de divergencia silenciosa entre lo que dice (`Pendiente`, implícito) y lo que es (`Completado`, verificado). Recomendación: cerrar formalmente RFC-001 ahora (marcar el DoD verificado en esta revisión), corregir `AUDIT_SEARCH_NORMALIZATION.md` para reflejar CF-001 resuelto, y registrar en `docs/product/decisions/DECISION_LOG.md` cuándo y por qué se reactivaron los 5 clientes de SVC-01 — ese registro no existe en ningún lado hoy.
