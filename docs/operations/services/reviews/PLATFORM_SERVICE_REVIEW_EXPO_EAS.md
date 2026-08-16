# Revisión de Servicio — Expo / EAS

**Código:** OPS-REV-003

**Nombre:** PLATFORM_SERVICE_REVIEW_EXPO_EAS.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo ya usado por `PLATFORM_SERVICE_CATALOG.md` (OPS-SVC-001), `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001), `PLATFORM_SERVICE_REVIEW_SUPABASE.md` (OPS-REV-001) y `PLATFORM_SERVICE_REVIEW_RESEND.md` (OPS-REV-002).

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítems de backlog `OPS-SVC-BKL-007` y `OPS-SVC-BKL-008`, tratados juntos — mismo criterio que `PLATFORM_SERVICE_CATALOG.md`, que no los separa)

**Documentos de los que depende:** `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #11), `CLAUDE.md`, `mobile/app.json`, `mobile/eas.json`.

---

## 1. Uso actual

Expo/EAS cumple dos funciones en `mobile/`: **framework de desarrollo** (Expo SDK, `expo-router`) y **servicios cloud (EAS)** — build nativo y canal de actualizaciones OTA (`expo-updates`) que permite enviar parches de JS/TS sin pasar por revisión de Play Store.

`mobile/app.json` confirma el proyecto real: `slug: "compara-farma"`, `owner: "belford"`, `extra.eas.projectId: "4de81d7d-c9ab-470c-be3c-04eb43047e59"`, `updates.url: "https://u.expo.dev/4de81d7d-c9ab-470c-be3c-04eb43047e59"`, `runtimeVersion.policy: "appVersion"`. `mobile/eas.json` define 3 perfiles de build (`development`, `preview`, `production`) y un perfil de `submit` a Google Play (track `internal`).

**Hallazgo ya documentado, confirmado vigente:** `CLAUDE.md` declara explícitamente que el build cloud de EAS (`eas build`) es la alternativa, no el método preferido — el método preferido es `pnpm build:android` (build local con Android Studio, script `scripts-temp/build-android-release.ps1`), "sin cuota EAS". Es decir, el proyecto ya tomó una decisión deliberada de minimizar el consumo de build de EAS, antes de esta revisión.

`eas update --branch production` sigue siendo el mecanismo documentado para "fix urgente sin nuevo build" (solo cambios JS/TS) — este sí depende de EAS Update, no tiene alternativa local.

## 2. Inventario

| Componente | Uso en ComparaFarma | Alternativa local existente |
|---|---|---|
| EAS Build (cloud) | Generar el binario Android/iOS de producción | `pnpm build:android` (Android Studio local) — método preferido según `CLAUDE.md` |
| EAS Update (OTA) | Publicar parches de JS/TS sin nuevo build/revisión de Play Store | Ninguna — es exclusivo de EAS |
| EAS Submit | Subir el build a Google Play (track `internal`) | Manual vía Play Console, si hiciera falta |
| `projectId` (`4de81d7d-...`) | Identificador único del canal OTA — ya señalado como SPOF 🔴 Alto en `SERVICE_ACCOUNT_MIGRATION.md` | No aplica — cambiarlo rompe el canal para todos los usuarios instalados |

## 3. Plan contratado

**Free**, confirmado en `CLAUDE.md` ("Build via EAS cloud (requiere cuota mensual free)"). No se investigó de nuevo en el Dashboard de Expo en esta revisión más allá de la evidencia de consumo (§6, sí verificada en vivo).

## 4. Límites del plan

Investigado en `expo.dev/pricing` (oficial, consultado en esta revisión — reemplaza las cifras de terceros usadas en la Auditoría original):

| Recurso | Free | Starter ($19/mes + uso) | Production ($199/mes + uso) |
|---|---|---|---|
| Builds incluidos | Hasta 15 Android + 15 iOS (30 combinados) | USD 45 de crédito, luego uso | USD 225 de crédito, luego uso |
| Prioridad de cola | Baja | Alta | Alta |
| Timeout de build | 45 minutos | 2 horas | 2 horas |
| Concurrencia | 1 | 1 (+5 extra a USD 50 c/u) | 2 (+5 extra a USD 50 c/u) |
| **MAU para OTA Update** | **1.000** | 3.000, luego uso | 50.000, luego uso |
| Ancho de banda de borde (Update) | 100 GiB | 100 GiB, luego USD 0,10/GiB | 1 TiB, luego USD 0,10/GiB |
| Almacenamiento (Update) | 20 GiB | 20 GiB, luego USD 0,05/GiB | 1 TiB, luego USD 0,05/GiB |
| Proyectos | 25 | 50 | 100 |
| Minutos CI/CD Workflows | 60 | Basado en uso | Basado en uso |

**Confirmación importante:** el límite de **1.000 MAU para actualizaciones OTA** en el plan Free, ya señalado en la Auditoría original como "cifra de terceros, pero es el límite más bajo del inventario", queda **confirmado oficialmente** contra `expo.dev/pricing` en esta revisión — deja de ser una cifra orientativa.

## 5. Riesgos

Heredado de `PRODUCTION_INFRASTRUCTURE_AUDIT.md` ficha #11 y SPOF #4, reevaluado con la evidencia de consumo real de esta revisión:

1. **🟡 Medio, sin cambio de severidad — límite de 1.000 MAU para OTA.** Sigue siendo, con la evidencia disponible, el umbral más bajo de todo el inventario de servicios frente al crecimiento esperado de usuarios — por debajo de los límites de Vercel/Supabase/Upstash al mismo volumen. No es un riesgo activo hoy (§6), pero será el primer límite de infraestructura en cruzarse si la app tiene adopción real.
2. **🔴 Alto, sin cambio — `projectId` único como SPOF.** Ya reconocido en `SERVICE_ACCOUNT_MIGRATION.md`: cambiar de cuenta/proyecto de Expo rompe el canal OTA para todos los usuarios con la app ya instalada, sin posibilidad de recuperación vía OTA (requeriría nuevo build obligatorio en Play Store).
3. **🟢 Bajo — cuota de builds.** Mitigado por diseño: el proyecto ya prefiere el build local (`pnpm build:android`) precisamente para no consumir esta cuota — decisión documentada, no un hallazgo nuevo.

No se identificaron riesgos nuevos en esta revisión — los dos hallazgos centrales de la Auditoría (límite de MAU, SPOF de `projectId`) siguen vigentes sin cambios.

## 6. Consumo actual

Confirmado en vivo en esta revisión (Dashboard de Expo → Usage, periodo de facturación actual 31-jul al 31-ago 2026):

| Métrica (EAS Update) | Consumo | Cupo (Free) |
|---|---|---|
| Usuarios activos mensuales (MAU) | 1 | 1.000 |
| Ancho de banda de borde | 0 GiB | 100 GiB |

El gráfico de usuarios diarios muestra un único pico (1 usuario) el 11 de agosto, coincidente con pruebas internas de esta misma semana — consistente con una app sin usuarios reales todavía. No se verificó el consumo de builds en esta revisión (no se solicitó esa captura); dado que el método preferido documentado es el build local, es razonable asumir consumo bajo, pero **no verificado directamente**.

## 7. Escalabilidad

Estimado a partir de los límites oficiales (§4) y el consumo real (§6):

- **100 usuarios:** muy por debajo del límite de 1.000 MAU — sin riesgo.
- **500 usuarios:** todavía dentro del límite de 1.000 MAU si no todos actualizan en el mismo mes, pero empieza a acercarse.
- **1.000 usuarios:** este es, según la evidencia oficial (§4), el punto exacto donde el límite del plan Free para OTA se alcanza — **antes** que cualquier otro límite de infraestructura del inventario (Vercel, Supabase, Upstash tienen umbrales más altos a este mismo volumen).
- **5.000 usuarios:** muy por encima del límite Free — upgrade a Starter (3.000 MAU) o Production (50.000 MAU) ya sería obligatorio antes de este punto.

**Conclusión de escalabilidad:** confirma la conclusión ya alcanzada en la Auditoría original — Expo/EAS es, con la evidencia oficial ahora confirmada, el primer servicio de todo el inventario que exigirá un upgrade de plan si la app tiene éxito de adopción.

## 8. Alternativas

No se evaluó un cambio de proveedor — EAS Update es una capacidad específica de Expo sin equivalente directo fuera del ecosistema (alternativas como CodePush de Microsoft existen pero implicarían una migración de SDK no trivial, fuera del alcance de esta revisión y no motivada por ningún hallazgo nuevo).

- **Upgrade a Starter ($19/mes + uso):** eleva el límite de MAU de 1.000 a 3.000 — opción de menor costo si se necesita más margen antes de llegar a un volumen que justifique Production.
- **Mantener el build local como método preferido:** ya es la decisión vigente, reduce el consumo de la cuota de builds sin costo adicional.

## 9. Costos

Oficial, `expo.dev/pricing` (consultado en esta revisión):

| Plan | Costo | MAU para OTA | Notas |
|---|---|---|---|
| Free (actual) | $0/mes | 1.000 | Cola de build de baja prioridad, timeout 45 min |
| Starter | $19/mes + uso | 3.000, luego uso | USD 45 de crédito de build incluido |
| Production | $199/mes + uso | 50.000, luego uso | USD 225 de crédito de build incluido, 2 concurrencias |
| Enterprise | Personalizado | 1.000.000+ | USD 1.000 de crédito de build incluido |

Con 1 MAU real de consumo (§6), no hay justificación de costo para upgrade hoy — la recomendación es de monitoreo, no de acción inmediata.

## 10. Recomendación del CTO

🟡 **Mantener el plan Free hoy, con monitoreo activo del MAU de actualizaciones como condición explícita antes de cualquier campaña de adquisición de usuarios.**

Justificación: el consumo real (1 de 1.000 MAU) está lejos del límite, y no hay evidencia de que deba cambiarse nada hoy. Pero a diferencia de otros servicios de este inventario, este es el único donde el techo del plan Free (1.000 MAU) es más bajo que el crecimiento de usuarios esperado en el mediano plazo, según la propia proyección ya documentada en la Auditoría — por eso la recomendación no es "sin cambios" sino "mantener con vigilancia": presupuestar el upgrade a Starter o Production como parte de cualquier plan de crecimiento de usuarios, decidido *antes* de que las actualizaciones OTA dejen de llegar, no como reacción a una falla ya visible para usuarios reales. El SPOF del `projectId` (§5) sigue siendo un riesgo aparte, ya gestionado por la disciplina de no rotar cuentas, sin acción nueva necesaria en esta revisión.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con vigilancia/acción de monitoreo pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #11, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md` (clasificación de criticidad Alta de Expo/EAS, sin cambios) ni a `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md` (SPOF del `projectId`, sin cambios). Es la tercera revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001), cubriendo dos ítems de backlog (`OPS-SVC-BKL-007`, `OPS-SVC-BKL-008`) en un solo documento, igual que el Catálogo los trata combinados.

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Función y configuración de Expo/EAS | `mobile/app.json`, `mobile/eas.json`, `CLAUDE.md` | ✔ (§1, §2) | Inventario propio de esta revisión |
| Clasificación de criticidad | `PLATFORM_SERVICE_CATALOG.md` §6 | Heredada, sin recalcular | Esta revisión no reevalúa criticidad |
| SPOF de `projectId` | `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md` | Heredado (§5), sin cambios | No se repite el detalle de mitigación |
| Límites oficiales y consumo real | `expo.dev/pricing` (oficial) + Dashboard de Expo (verificado en vivo) | ✔ (§4, §6, §9) | Primera vez que se confirma el límite de 1.000 MAU contra fuente oficial directa, no de terceros |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`. Ante una discrepancia sobre un dato de Expo/EAS entre este documento y la Auditoría, prevalece la Auditoría salvo que este documento cite evidencia más reciente (caso del límite de MAU, ahora confirmado oficialmente). Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` y `OPS-REV-002`.

## Documentos relacionados

`docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/archive/releases/SERVICE_ACCOUNT_MIGRATION.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-14 | Activo | Pendiente (CTO) | Creación de la tercera revisión individual de servicio del backlog `OPS-BKL-001` — Expo/EAS (cubre `OPS-SVC-BKL-007` y `OPS-SVC-BKL-008`). 10 secciones requeridas completas, ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `mobile/app.json`, `mobile/eas.json`, `CLAUDE.md`, `expo.dev/pricing`, Dashboard de Expo (Usage) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-14 | Revisión completa de Expo/EAS — tercer ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_EXPO_EAS.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
