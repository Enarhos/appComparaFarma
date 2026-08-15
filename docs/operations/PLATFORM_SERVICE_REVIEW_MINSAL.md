# Revisión de Servicio — MINSAL

**Código:** OPS-REV-007

**Nombre:** PLATFORM_SERVICE_REVIEW_MINSAL.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-006`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-015`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fichas #13/#16), `api/src/clients/minsal.ts`, `scripts-temp/fetch-branches.js`, `.github/workflows/update-branches.yml`, `api/src/data/branches.json`.

---

## 0. Advertencia de alcance — este servicio no es una cuenta de ComparaFarma

Igual que Algolia (`OPS-REV-004`), MINSAL no es una cuenta contratada por ComparaFarma — es una fuente de datos pública del Estado de Chile (Ministerio de Salud), consultada sin autenticación ni credenciales propias. Varias secciones del formato estándar (Plan contratado, Límites oficiales, Costos) **no aplican** por la misma razón que en Algolia: no hay cuenta, no hay dashboard, no hay documentación oficial de límites porque no es una API pública formalmente publicada por MINSAL, sino el backend interno de su propio sitio de "Farmacias de Turno" reutilizado.

A diferencia de Algolia, esta revisión sí encontró un **hallazgo operacional propio y activo** (§5.1) que no depende de que sea o no cuenta propia — un problema real en el pipeline de actualización de datos.

## 1. Uso actual

`api/src/clients/minsal.ts` + `scripts-temp/fetch-branches.js` consultan el endpoint `https://midas.minsal.cl/farmacia_v2/WS/getLocales.php` (el mismo que usa el sitio público "Farmacias de Turno" de MINSAL) para obtener, día por día, qué farmacias de las cadenas que ComparaFarma reconoce (Cruz Verde, Salcobrand, Ahumada, Dr. Simi, AraucoMed) están de turno en cada comuna de Chile.

Este dato **se usa activamente en producción en Mobile**: `mobile/src/components/CommuneSelector.tsx`, `mobile/src/components/FilterSheet.tsx` y `mobile/src/hooks/useSearch.ts` lo consumen para el filtro de comuna — no es una feature muerta o de prueba.

Por el bloqueo de IPs de Vercel ya documentado ("MINSAL bloquea IPs de Vercel en runtime", comentario en `minsal.ts`), el fetch **nunca ocurre desde `api/` en producción** — corre exclusivamente desde `.github/workflows/update-branches.yml` (cron diario, 9:00 UTC / 6:00 Chile), que **acumula y commitea** el resultado como archivo estático (`api/src/data/branches.json` + `branches-data.ts`) que `api/` sirve luego vía `GET /api/branches` sin volver a consultar a MINSAL.

## 2. Inventario

| Dato | Valor |
|---|---|
| Endpoint | `https://midas.minsal.cl/farmacia_v2/WS/getLocales.php` |
| Autenticación | Ninguna — headers `User-Agent`/`Referer`/`Accept` imitando al navegador, mismo patrón que Salcobrand/Algolia |
| Naturaleza del dato | "Farmacias de turno" — un subconjunto de sucursales que cambia **por día de la semana**, no un directorio estático de todas las sucursales |
| Estrategia de acumulación | `fetch-branches.js` guarda el resultado del día bajo la clave `funcionamiento_dia` (ej. "lunes") y acumula hasta cubrir los 7 días de la semana antes de tener cobertura completa |
| Consumo en el producto | `mobile/src/lib/branches.ts`, `CommuneSelector.tsx`, `FilterSheet.tsx`, `useSearch.ts` — filtro de comuna en Mobile |
| Ruta expuesta | `GET /api/branches` (`api/api/branches.ts` → `handleBranchesRoute`) — sirve `BRANCH_INDEX` estático, sin volver a consultar MINSAL |

## 3. Plan contratado

**No aplica.** Fuente pública gratuita del Estado de Chile, sin cuenta, sin registro, sin suscripción.

## 4. Límites del plan

**No aplica / no publicado.** No existe documentación oficial de límites de tasa o SLA para este endpoint — no es una API pública formalmente documentada por MINSAL, es el backend interno de su propio sitio web reutilizado directamente. El único límite operativo conocido, ya documentado antes de esta revisión, es que **MINSAL bloquea activamente las IPs de los datacenters de Vercel**, razón por la cual el fetch se ejecuta exclusivamente desde GitHub Actions.

## 5. Riesgos

1. **🔴 Alto — causa raíz confirmada: el fetch automatizado nunca ha funcionado, ni una sola vez, desde que existe el workflow.** Diagnóstico completado hoy (2026-08-14) accediendo directamente a la pestaña Actions del repositorio (`github.com/Enarhos/appComparaFarma/actions/workflows/update-branches.yml`) vía el navegador del CTO:
   - El workflow **sí se dispara todos los días como está programado** — 71 ejecuciones registradas desde su creación (2026-06-03), una por día, sin huecos. La hipótesis inicial de esta revisión (que el cron nunca se disparaba) queda descartada.
   - **Las 71 ejecuciones han fallado**, todas por el mismo motivo. El log de la ejecución más reciente (#71, run `31689979598`) muestra textualmente: `Error: MINSAL HTTP 403` al intentar `https://midas.minsal.cl/farmacia_v2/WS/getLocales.php`. **MINSAL bloquea también las IPs de los runners de GitHub Actions** — no solo las de Vercel, como asumía el comentario original en `minsal.ts` ("MINSAL bloquea IPs de Vercel en runtime"). La estrategia completa de mitigación (mover el fetch de `api/`/Vercel a GitHub Actions) nunca funcionó, desde el primer día.
   - Esto explica por completo el estancamiento: los 4 commits que sí existen en `branches.json` fueron cargas manuales de Mario Belford (2026-06-03 a 2026-06-08), probablemente ejecutando el script desde su máquina/red local (IP residencial, no bloqueada por MINSAL) — no hay, ni ha habido nunca, una actualización automática real.
   - **Hallazgo secundario, mismo patrón ya visto 4 veces antes en esta sesión:** la versión de `.github/workflows/update-branches.yml` que realmente corre en `origin/main` (confirmado comparando `git diff origin/main` contra la copia local) **no tiene** el permiso `issues: write`, ni `continue-on-error`, ni el step "Create issue on update-branches failure", ni "Fail job if fetch-branches failed" — esas mejoras existen únicamente en la copia de trabajo local y **nunca se subieron a `origin/main`**. Esto explica, de forma totalmente independiente del bloqueo de MINSAL, por qué nunca se creó ningún issue de alerta: el mecanismo de alerta simplemente no está desplegado. La versión real en producción falla en seco (`Failure`, sin `continue-on-error`) sin ninguna notificación.
2. **🟡 Medio — API no oficial/no documentada, sujeta a cambios de formato sin aviso** (heredado de Audit fichas #13/#16, sin cambios). Si MINSAL cambia el shape de la respuesta de `getLocales.php`, el parser de `minsal.ts`/`fetch-branches.js` puede fallar silenciosamente o producir datos corruptos.
3. **🟢 Bajo — bloqueo de IPs de Vercel, ya mitigado por diseño.** El fetch corre desde GitHub Actions, no desde `api/` en runtime — el bloqueo activo de MINSAL contra Vercel no afecta el mecanismo actual.
4. **🟢 Bajo — sin riesgo de costo/cuenta.** Fuente pública gratuita, sin cuenta que gestionar.

## 6. Consumo actual

Un fetch diario programado (cron), volumen bajo y predecible. El problema identificado en §5.1 no es de cuota o volumen de consumo — es que la acumulación de datos útiles no está avanzando, independientemente de que el fetch en sí se ejecute o no exitosamente cada día.

## 7. Escalabilidad

El dato es compartido entre todos los usuarios de ComparaFarma (no depende de cuántos usuarios use la app) — no hay un problema de escalabilidad tradicional aquí. Sí hay un problema que empeora con el tiempo: cuantos más meses pasen sin resolver el estancamiento de §5.1, más comunas/farmacias reales quedan mal representadas para los 6 días de la semana que nunca se acumularon.

## 8. Alternativas

- ~~Subir a `origin/main` la versión mejorada de `update-branches.yml`~~ — **hecho y validado en producción el 2026-08-14** (ver §5.1 y Control de Cambios). El fallo diario ahora crea un issue automático en vez de fallar en silencio. Esto no arregla el bloqueo de MINSAL (§5.1) — solo hace visible el fallo hacia adelante.
- **Buscar una forma de acceder a MINSAL que no sea bloqueada.** Opciones no evaluadas en profundidad en esta revisión: correr el fetch desde una IP residencial/no-datacenter (ej. un runner self-hosted en una red doméstica, tal como ya se hace manualmente hoy), usar un proxy/VPN residencial, o contactar a MINSAL para pedir whitelisting de una IP fija — cualquiera de estas es una decisión de ingeniería/costo, no de código simple.
- **Aceptar el estado actual y comunicarlo como limitación conocida:** si no se resuelve el bloqueo de IP, el filtro de comuna en Mobile seguirá mostrando el snapshot manual de junio indefinidamente — vale la pena decidir explícitamente si eso es aceptable o si amerita prioridad de ingeniería.
- **Cambiar la estrategia de acumulación** de "por nombre de día reportado por MINSAL" a "por fecha real del sistema" — irrelevante mientras el fetch siga bloqueado por MINSAL (el bug de diseño en la acumulación por día nunca llegó a manifestarse porque el fetch nunca tuvo éxito ni una vez para probarlo).

## 9. Costos

$0 — fuente pública gratuita, sin cambios.

## 10. Recomendación del CTO

🟠 **Evaluar en el corto plazo — bajó de 🔴 tras la acción del 2026-08-14 (ver Control de Cambios).** El mecanismo de alerta ya está corregido y desplegado: el próximo fallo del fetch creará un issue automático en vez de fallar en silencio. Lo que sigue sin resolverse es la causa de fondo: MINSAL bloquea con HTTP 403 tanto a Vercel como a GitHub Actions, así que el fetch seguirá fallando todos los días hasta que se decida una de las alternativas de §8 (IP residencial/self-hosted, o aceptar el dato congelado). El filtro de comuna en Mobile seguirá mostrando el snapshot de junio hasta que se tome esa decisión — ya no es un riesgo silencioso, pero sigue siendo un dato desactualizado en producción.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de las fichas #13/#16, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la séptima revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001) y la segunda (tras Algolia) que documenta un servicio sin cuenta propia de ComparaFarma, reutilizando el patrón §0 establecido en `OPS-REV-004`.

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Endpoint real y estrategia de acumulación por día | `api/src/clients/minsal.ts`, `scripts-temp/fetch-branches.js` | ✔ (§1, §2) | Inventario propio de esta revisión |
| Estancamiento de datos (1/7, 2+ meses) | `api/src/data/branches.json` (leído directamente, 2026-08-14) | ✔ (§5.1) | Hallazgo nuevo, no estaba en la Auditoría original |
| Uso activo en Mobile (filtro de comuna) | `mobile/src/components/CommuneSelector.tsx`, `FilterSheet.tsx`, `mobile/src/hooks/useSearch.ts` | ✔ (§1, §2) | Confirma que no es código muerto |
| Bloqueo de IPs de Vercel contra MINSAL | Comentario en `minsal.ts`, Audit ficha #16 | Heredado, sin cambios | Ya mitigado por diseño |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la séptima revisión individual de servicio del backlog `OPS-BKL-001` — MINSAL. Hallazgo nuevo: la acumulación de días de `update-branches.yml` está estancada en 1/7 desde hace más de dos meses, afectando una feature real de Mobile. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, código real de `api/src/clients/minsal.ts`, `scripts-temp/fetch-branches.js`, `api/src/data/branches.json` |
| 1.1 | 2026-08-14 | Activo | Pendiente (CTO) | Diagnóstico completado accediendo en vivo a la pestaña Actions de GitHub: causa raíz confirmada (`MINSAL HTTP 403` en 71/71 ejecuciones, bloqueo también contra IPs de GitHub Actions) y hallazgo secundario confirmado (la versión mejorada de `update-branches.yml`, con alerta de fallo, nunca se había subido a `origin/main`). Acción ejecutada y validada: se subió esa versión mejorada del workflow a producción (commit `2d5691f`, verificado contra `origin/main`) — el bloqueo de MINSAL en sí sigue sin resolver, pendiente de decisión del CTO (§8). Severidad bajada de 🔴 a 🟠 tras esta acción. | Logs reales de `github.com/Enarhos/appComparaFarma/actions/workflows/update-branches.yml` (run #71, `31689979598`), `git diff origin/main` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de MINSAL — séptimo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_MINSAL.md` v1.0 (este documento) |
| 2026-08-14 | Diagnóstico en vivo (Actions) + despliegue de la alerta de fallo a `origin/main` | CTO / Claude | Commit `2d5691f` en `origin/main`; documento actualizado a v1.1 |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado. El bloqueo de IP de MINSAL contra GitHub Actions (§5.1, §8) sigue sin resolver — es una decisión pendiente del CTO, no ejecutada desde esta revisión.
