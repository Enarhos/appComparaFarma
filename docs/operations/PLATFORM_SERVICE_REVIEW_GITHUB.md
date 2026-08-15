# Revisión de Servicio — GitHub (Repositorio + Actions + Pages)

**Código:** OPS-REV-006

**Nombre:** PLATFORM_SERVICE_REVIEW_GITHUB.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-005`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítems de backlog `OPS-SVC-BKL-005` y `OPS-SVC-BKL-006`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #10), `docs/operations/RUNBOOK.md`, `.github/workflows/*.yml`, `docs/privacy-policy.html`.

---

## 0. Alcance de esta revisión

Igual que se hizo con Expo + EAS (`OPS-REV-003`), esta revisión cubre en un solo documento los dos ítems de backlog que la Auditoría original ya trataba como una sola ficha (#10): `OPS-SVC-BKL-005` (GitHub, repositorio) y `OPS-SVC-BKL-006` (GitHub Actions, CI/CD y crons). Se incluye también GitHub Pages, que el Catálogo no separa como ítem propio de backlog.

## 1. Uso actual

- **Repositorio:** `github.com/Enarhos/appComparaFarma` — única fuente de verdad del código de los 4 workspaces del monorepo (`mobile/`, `api/`, `web/`, `packages/domain`) más toda la documentación (`docs/`).
- **GitHub Actions:** 4 workflows en `.github/workflows/`: `ci.yml` (typecheck/tests/deploy en push y PR a `main`), `monitor-api.yml` (healthcheck de las 9 farmacias cada hora), `check-price-alerts.yml` (cron diario de alertas de precio), `update-branches.yml` (fetch diario de sucursales MINSAL).
- **GitHub Pages:** sirve `docs/privacy-policy.html` en `https://enarhos.github.io/appComparaFarma/privacy-policy.html` — URL registrada como política de privacidad oficial en Google Play Console.

## 2. Inventario

| Dato | Valor | Evidencia |
|---|---|---|
| Repositorio | `Enarhos/appComparaFarma` | Remoto real, `ci.yml` |
| **Visibilidad** | **Público** — confirmado hoy (`meta-octolytics-dimension-repository_public: true` en la respuesta HTTP de GitHub) | Fetch directo a `github.com/Enarhos/appComparaFarma`, 2026-08-14 |
| Owner | Cuenta personal `Enarhos` (no una organización) | Misma fetch; consistente con `SERVICE_ACCOUNT_MIGRATION.md` |
| Actividad | 186 commits en `main`, 23 issues abiertos, 0 stars/forks/watchers | Fetch directo, 2026-08-14 |
| Workflows | `ci.yml`, `monitor-api.yml`, `check-price-alerts.yml`, `update-branches.yml` | `.github/workflows/` |
| GitHub Pages | 1 sitio de proyecto, contenido estático (`docs/privacy-policy.html`) | `CLAUDE.md`, `docs/privacy-policy.html` |

## 3. Plan contratado

**GitHub Free** (cuenta personal) — no verificable directamente en el Dashboard en esta sesión, pero consistente con el resto de la consolidación de cuentas descrita en `SERVICE_ACCOUNT_MIGRATION.md` (una sola persona opera Vercel/GitHub/Expo). Al ser un repositorio público y de un solo colaborador, las limitaciones de seats/colaboradores privados del plan Free no aplican de forma práctica.

## 4. Límites del plan

Investigado hoy directamente en `docs.github.com` (reemplaza la ambigüedad "no verificable" que dejó la Auditoría original sobre este punto):

| Recurso | Límite oficial verificado (2026-08-14) |
|---|---|
| **Minutos de GitHub Actions (GitHub-hosted runners)** | **Gratis e ilimitados en repositorios públicos** — cita textual: *"GitHub Actions usage is free for standard GitHub-hosted runners in public repositories"* (`docs.github.com/en/actions/concepts/billing-and-usage`). Como el repo es público (§2), **no aplica ninguna cuota de minutos** — los 4 workflows corren sin límite de consumo. |
| GitHub Pages — tamaño del sitio publicado | 1 GB máximo |
| GitHub Pages — bandwidth | 100 GB/mes (límite blando) |
| GitHub Pages — builds | 10/hora (límite blando; no aplica si se publica vía Actions personalizado) |
| GitHub Pages — timeout de deployment | 10 minutos |
| GitHub Pages — uso permitido | Explícitamente **no** puede usarse como hosting de "e-commerce site" o "commercial transactions" — no aplica a este caso: la página es contenido estático de política de privacidad, no una transacción comercial |

Esto resuelve a favor de ComparaFarma la pregunta abierta que dejó la Auditoría original ("confirmar si el repo es privado o público" — de eso dependía si había o no cuota de minutos de Actions). Con el repo confirmado público, el riesgo de agotar minutos gratuitos que planteaba la ficha #10 **no existe**.

## 5. Riesgos

1. **🟡 Medio — exposición del código fuente completo por ser repositorio público (hallazgo nuevo, no evaluado en la Auditoría original bajo este ángulo).** Al ser público, cualquier persona (incluyendo las 9 farmacias cuyos sitios se scrapean/consultan) puede leer el código exacto de `api/src/clients/` — los regex de scraping de Ahumada y Sermecoop, la técnica de imitación de storefront usada contra el índice Algolia de Salcobrand, y la lógica completa de deduplicación/normalización que es la propuesta de valor del producto. Esto no es un riesgo de secretos filtrados (la Auditoría original ya confirmó que `.env.example` no tiene valores reales, solo placeholders) sino de **exposición de lógica de negocio y de las técnicas exactas que permiten el scraping**, lo cual facilita que una farmacia que lo note pueda bloquear el patrón específico usado en su contra.
2. **🟢 Bajo — minutos de GitHub Actions.** Resuelto por el hallazgo de §4 — sin cuota, sin riesgo de agotamiento.
3. **🟡 Medio — GitHub Pages como single point of failure de la URL de política de privacidad registrada en Google Play Console** (heredado de la Auditoría original, sin cambios). Si GitHub Pages tuviera una caída o el repo cambiara de nombre/visibilidad, la URL registrada en Play Console dejaría de responder — Google Play no la revalida en tiempo real, pero una revisión futura de la app sí podría fallar.
4. **🟢 Bajo — dependencia de una cuenta personal única** (heredado, transversal, ya cubierto en Audit ficha general — no exclusivo de GitHub).

## 6. Consumo actual

No verificable con precisión sin acceso al Dashboard de GitHub (Insights/Actions usage), pero al ser un repositorio público el consumo de minutos de Actions es irrelevante para efectos de cuota (§4). Los 4 workflows tienen ejecuciones cortas y de baja frecuencia (uno por push/PR, uno cada hora, dos diarios) — consumo bajo en términos absolutos, aunque sin cuota que monitorear.

## 7. Escalabilidad

Ninguno de los recursos de GitHub (repo, Actions, Pages) escala con el número de usuarios finales de ComparaFarma — escalan con la frecuencia de commits/PRs (Actions) y con el tráfico a la página de privacidad (Pages, muy por debajo de cualquier límite). El riesgo de exposición de código (§5.1) tampoco depende del volumen de usuarios — ya existe hoy, a cualquier escala.

## 8. Alternativas

- **Mantener el repositorio público, sin cambios.** Es la opción de menor fricción — no hay ningún límite de Actions ni de Pages en riesgo real, y el hallazgo de exposición de código (§5.1) es un riesgo aceptado implícito desde el inicio del proyecto, no algo introducido hoy.
- **Convertir el repositorio a privado.** Elimina la exposición de la lógica de scraping/negocio (§5.1), pero introduce la cuota de minutos de Actions del plan Free (2.000 minutos/mes en GitHub Free para repos privados) — con 4 workflows corriendo con la frecuencia actual, habría que estimar el consumo real antes de decidir (no evaluado en esta revisión, ya que no es la recomendación). También perdería el acceso público a GitHub Pages en cuentas Free (Pages en repos privados requiere plan Pro o superior — ver §4).
- **Extraer solo los archivos de política de privacidad a un repositorio público separado**, manteniendo el resto del código privado. Resolvería la exposición de código sin perder Pages gratis, pero es un cambio de estructura de repos, no evaluado en profundidad aquí.

## 9. Costos

$0/mes en el escenario actual (GitHub Free, repo público). Convertir a privado no tendría costo mientras el consumo de Actions se mantenga bajo 2.000 minutos/mes (umbral de GitHub Free), pero es una variable no medida en esta revisión.

## 10. Recomendación del CTO

🟡 **Mantener con acción de decisión pendiente (no técnica).** No hay ninguna acción de código ni de configuración urgente — el hallazgo de minutos de Actions que dejó abierta la Auditoría original queda resuelto favorablemente (repo público = sin cuota). El único punto que amerita una decisión del CTO es si la exposición pública del código de scraping/negocio (§5.1) es un riesgo aceptable o si conviene privatizar el repositorio — es una decisión de producto/seguridad, no una urgencia operativa, y no se ejecuta desde esta revisión.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #10, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la sexta revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001) y la segunda (tras Expo/EAS) que consolida dos ítems de backlog en un solo documento por compartir la misma evidencia fuente.

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Minutos de Actions gratis/ilimitados en repos públicos | `docs.github.com/en/actions/concepts/billing-and-usage` (verificado 2026-08-14) | ✔ (§4, §5.2) | Resuelve la pregunta abierta de la Auditoría original |
| Visibilidad pública del repositorio | Fetch directo a `github.com/Enarhos/appComparaFarma`, 2026-08-14 | ✔ (§2) | Confirma el dato que la Auditoría marcó "No verificable" |
| Límites de GitHub Pages | `docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits` (verificado 2026-08-14) | ✔ (§4) | Sin cambios de riesgo — uso muy por debajo de los límites |
| Ausencia de secretos committeados en texto plano | Audit original, sección "Gestión de secretos" | Heredado, sin cambios | No re-auditado en esta sesión |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la sexta revisión individual de servicio del backlog `OPS-BKL-001` — GitHub (repo + Actions + Pages), cubriendo `OPS-SVC-BKL-005` y `OPS-SVC-BKL-006` en un solo documento. Confirmado hoy que el repositorio es público, resolviendo a favor la pregunta abierta de minutos de Actions. Hallazgo nuevo: exposición pública de la lógica de scraping/negocio. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `RUNBOOK.md`, `docs.github.com` (oficial) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de GitHub (repo + Actions + Pages) — sexto ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_GITHUB.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
