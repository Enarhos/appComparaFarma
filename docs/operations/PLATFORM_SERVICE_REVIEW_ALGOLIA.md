# Revisión de Servicio — Algolia

**Código:** OPS-REV-004

**Nombre:** PLATFORM_SERVICE_REVIEW_ALGOLIA.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001`, `OPS-REV-002` y `OPS-REV-003`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-003`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #6), `docs/operations/RUNBOOK.md`, código real de `api/src/clients/salcobrand.ts`.

---

## 0. Advertencia de alcance — este servicio no es una cuenta de ComparaFarma

A diferencia de Supabase (OPS-REV-001), Resend (OPS-REV-002) y Expo/EAS (OPS-REV-003), Algolia **no es una cuenta contratada por ComparaFarma**. Es el índice de búsqueda propio de **Salcobrand**, usado por su propio storefront público — ComparaFarma consume las mismas credenciales de solo-búsqueda que cualquier visitante del sitio de Salcobrand puede ver en el tráfico de red de su página. Varias secciones del formato estándar (Plan contratado, Costos, Consumo real por dashboard) **no aplican** porque ComparaFarma no tiene cuenta ni acceso a ningún dashboard de Algolia — se documenta explícitamente dónde no hay evidencia posible, en vez de inventar una cifra.

## 1. Uso actual

`api/src/clients/salcobrand.ts` es el único de los 9 clientes de farmacia que consulta un motor de búsqueda de terceros en vez de una API/scraping directo del sitio de la farmacia. Por cada búsqueda de un usuario en ComparaFarma, `searchSalcobrand(query)` hace **una llamada HTTP POST** a `https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/sb_variant_production/query`, con headers `X-Algolia-Application-Id`/`X-Algolia-API-Key` (credenciales de solo-búsqueda) y `Referer`/`Origin` seteados a `https://salcobrand.cl/` para imitar el storefront real, `hitsPerPage: 24`.

Esta llamada está sujeta al mismo caché de búsqueda de Upstash Redis que las otras 8 farmacias (TTL 5 minutos por defecto) — búsquedas repetidas del mismo término dentro de esa ventana no vuelven a golpear Algolia.

## 2. Inventario

| Dato | Valor | Evidencia |
|---|---|---|
| Application ID | `GM3RP06HJG` (no es secreto, expuesto en `api/.env.example` como comentario) | `api/.env.example` línea 8 |
| Índice consultado | `sb_variant_production` | `api/src/clients/salcobrand.ts` línea 6 |
| Variables de entorno | `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY` | `api/.env.example`; confirmado presentes en producción vía `/api/health` (`dependencies.algolia: "configured"`) |
| Tipo de credencial | Solo-búsqueda (search-only API key), del lado del cliente — patrón estándar de Algolia para storefronts públicos | Comentario en `salcobrand.ts` original, ya señalado en la Auditoría |
| Propietario real de la cuenta | Salcobrand (no ComparaFarma) | Ficha #6 de la Auditoría, sin cambios |

## 3. Plan contratado

**No aplica.** ComparaFarma no tiene una cuenta de Algolia — no hay plan que reportar. El plan lo determina Salcobrand, y no es una decisión ni un gasto de ComparaFarma.

## 4. Límites del plan

**No verificable el plan real de Salcobrand.** Como contexto informativo (no como el límite real aplicable), Algolia publica un tier gratuito ("Build") con métricas de uso mensual limitadas para cuentas nuevas — pero un índice de producción de un retailer real como Salcobrand es mucho más consistente con un plan pagado sin ese límite. No se investigó el pricing público de Algolia en profundidad en esta revisión porque **no determina nada accionable para ComparaFarma** — el límite que importa no es el de Algolia en general, sino el que Salcobrand decida imponer o no a su propia cuenta, información a la que ComparaFarma no tiene acceso.

## 5. Riesgos

Heredado de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #6 (🟡 Medio), sin cambios — reconfirmado en esta revisión:

1. **🟡 Medio — rotación de credenciales fuera del control de ComparaFarma.** `docs/operations/RUNBOOK.md` ya documenta el incidente típico: "Salcobrand desaparece de los resultados — casi siempre `ALGOLIA_APP_ID`/`ALGOLIA_API_KEY` mal configuradas o rotadas sin actualizar Vercel". Si Salcobrand cambia su Application ID o rota la key (por ejemplo, tras un rediseño de su storefront), ComparaFarma se entera solo cuando Salcobrand deja de aparecer en los resultados — no hay alerta proactiva de Algolia hacia ComparaFarma, porque no es su cuenta.
2. **🟢 Bajo — aislamiento de fallo ya garantizado por diseño.** `Promise.allSettled` en `searchService.ts` asegura que si Algolia/Salcobrand falla, las otras 8 farmacias siguen respondiendo con normalidad — no es una dependencia que pueda tumbar la búsqueda completa.
3. **🟢 Bajo — sin riesgo de costo para ComparaFarma.** Como no es una cuenta propia, no hay factura ni límite de gasto que ComparaFarma deba monitorear.

## 6. Consumo actual

**No verificable el consumo real en Algolia** (no hay dashboard propio). Lo único medible desde el lado de ComparaFarma es el volumen de búsquedas que la propia app genera hacia Salcobrand — que, según el patrón de caché ya documentado (TTL 5 min, compartido con las 8 farmacias restantes), es proporcional al tráfico real de búsquedas de ComparaFarma, no un número aislado. No se solicitó ni existe una fuente para estimarlo con precisión en esta revisión.

## 7. Escalabilidad

El crecimiento de ComparaFarma no está limitado por Algolia en sí — está limitado por si Salcobrand nota (o le molesta) el volumen de tráfico de búsquedas que un tercero (ComparaFarma) genera contra su índice usando credenciales de storefront. Esto es un riesgo de relación/tolerancia, no un límite técnico cuantificable:

- **100–1.000 usuarios:** volumen de búsquedas bajo, indistinguible del tráfico normal del storefront de Salcobrand.
- **5.000+ usuarios:** con suficiente adopción, el volumen de consultas a `sb_variant_production` originado por ComparaFarma podría volverse una fracción notoria del tráfico total del índice — sin forma de saberlo desde este lado, y sin control sobre si Salcobrand decide actuar al respecto (rotar credenciales, bloquear por `Referer`, etc.).

## 8. Alternativas

- **Ninguna acción posible directamente sobre Algolia** — no es una cuenta de ComparaFarma, no hay nada que optimizar ni upgradear desde este lado.
- **Formalizar un acuerdo de datos con Salcobrand:** ya sugerido en la Auditoría original como acción de mediano plazo si el tráfico crece — reduciría el riesgo de bloqueo/rotación sorpresiva, pero es una decisión de producto/legal, no técnica, fuera del alcance de esta revisión.
- **Scraping directo del storefront de Salcobrand** (como se hace con Ahumada/Sermecoop) en vez de depender de su índice de Algolia: técnicamente posible, pero cambiaría el perfil de riesgo de "credenciales de terceros rotadas sin aviso" a "HTML frágil que puede romperse con cualquier rediseño" — el mismo tipo de fragilidad ya documentada como Alta para Ahumada/Sermecoop. No hay evidencia de que sea una mejora neta.

## 9. Costos

**No aplica.** Sin cuenta propia, no hay costo de ComparaFarma que reportar.

## 10. Recomendación del CTO

🟢 **Mantener sin cambios.** No hay ninguna acción disponible que ComparaFarma pueda tomar directamente sobre la cuenta de Algolia de Salcobrand — el único control real ya está implementado: el aislamiento de fallo (`Promise.allSettled`) y el monitoreo horario por farmacia (`monitor-api.yml`), que ya cubre Salcobrand como una de las 9. La recomendación de la Auditoría original (evaluar un acuerdo de datos formal con Salcobrand a medida que el tráfico crezca) sigue siendo válida pero es una decisión de producto/negocio, no una acción de infraestructura — no se convierte en una acción ejecutable desde esta revisión.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #6, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md` (clasificación Media de Algolia, sin cambios). Es la cuarta revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001) — la primera que documenta explícitamente un servicio sin cuenta propia de ComparaFarma, estableciendo el precedente de cómo tratar ese caso (§0) para las revisiones futuras de MINSAL (`OPS-SVC-BKL-015`, mismo patrón).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Función y evidencia de uso | Código real (`api/src/clients/salcobrand.ts`) | ✔ (§1, §2) | Inventario propio de esta revisión |
| Clasificación de criticidad | `PLATFORM_SERVICE_CATALOG.md` §6 | Heredada, sin recalcular | Esta revisión no reevalúa criticidad |
| Riesgo de rotación de credenciales | `docs/operations/RUNBOOK.md`, Audit ficha #6 | Heredado (§5), sin cambios | Sin evidencia nueva que lo modifique |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/RUNBOOK.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la cuarta revisión individual de servicio del backlog `OPS-BKL-001` — Algolia. Primera revisión que documenta un servicio sin cuenta propia de ComparaFarma. Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `RUNBOOK.md`, código real de `api/src/clients/salcobrand.ts` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de Algolia — cuarto ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_ALGOLIA.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
