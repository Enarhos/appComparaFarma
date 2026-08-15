# Revisión de Servicio — Khipu

**Código:** OPS-REV-011

**Nombre:** PLATFORM_SERVICE_REVIEW_KHIPU.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-010`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-014`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/release/RELEASE_READINESS_V1.md`, `docs/release/SERVICE_ACCOUNT_MIGRATION.md`, `api/src/clients/khipu.ts`, `api/src/routes/donate.ts`, `mobile/src/constants/donation.ts`, `mobile/src/components/DonationBanner.tsx`, historial de git del repositorio.

---

## 1. Uso actual

Khipu (pasarela de transferencia bancaria chilena) existe hoy en **dos capas de integración completamente independientes**:

1. **Capa dinámica (servidor), aparentemente sin llamador real.** `POST /api/donate` (`api/src/routes/donate.ts`) llama a `createKhipuPayment()` (`api/src/clients/khipu.ts`), que arma una request firmada HMAC-SHA256 contra `https://khipu.com/api/2.0/payments` usando `KHIPU_RECEIVER_ID` y `KHIPU_SECRET` (variables de Vercel). Se hizo grep completo de `mobile/src` y `web/src` buscando "donate"/"Khipu"/"khipu": **cero referencias** a este endpoint en ningún cliente actual. No hay evidencia de ningún llamador real hoy.
2. **Capa estática (cliente), la que realmente está en producción.** `mobile/src/constants/donation.ts` tiene 4 links de pago pre-generados en el dashboard de Khipu (montos $1.000 / $3.000 / $5.000 / "Otro monto"), y `DonationBanner.tsx` los abre directamente con `Linking.openURL()` — sin backend, sin `/api/donate`, sin las variables de entorno.

Es decir: el código que usa credenciales reales de Khipu (`KHIPU_RECEIVER_ID`/`KHIPU_SECRET`) hoy no tiene ningún caller en la app, y lo que sí está en producción no las usa en absoluto.

## 2. Inventario

| Dato | Valor | Evidencia |
|---|---|---|
| Cobrador Khipu | "Mario Lillo Alfaro", ID `520175` | `docs/release/SERVICE_ACCOUNT_MIGRATION.md` línea 461, 468 |
| Flujo dinámico | `createKhipuPayment()` → API v2 (`/api/2.0/payments`), firma HMAC-SHA256, vars `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` en Vercel | `api/src/clients/khipu.ts` (código actual, leído completo) |
| Flujo estático (en producción) | 4 payment links hardcodeados (`khipu.com/payment/process/{5Jxso,rkHAZ,qzd92,dAwLD}`) para $1.000/$3.000/$5.000/monto libre | `mobile/src/constants/donation.ts` |
| Consumidor real en Mobile | `DonationBanner.tsx` → `Linking.openURL(urls[amount])` | `mobile/src/components/DonationBanner.tsx` |
| Consumidores en `web/` | Ninguno — cero referencias a Khipu en `web/src` | grep de esta revisión |

## 3. Plan contratado

**No verificable directamente en el dashboard.** No hay evidencia de un plan con costo fijo — el modelo de Khipu para cobradores es comisión por transacción, sin plan mensual ni costo de puesta en marcha (confirmado en la sección 9).

## 4. Límites del plan

No aplica un límite de "plan" en el sentido de Sentry/PostHog — Khipu no tiene tiers de free/paid con cuotas de uso. El único "límite" relevante es el propio de una cuenta personal de cobrador (no empresarial), que es justamente uno de los hallazgos heredados de la Auditoría original (ver §5).

## 5. Riesgos

1. **🔴 Alto — credenciales Khipu expuestas en producción, sin evidencia de rotación posterior (hallazgo confirmado con evidencia directa de git, no solo documental).** Se reconstruyó la secuencia exacta del 2026-06-16 en el historial de git:
   - `4199095` y `81ed58e` agregaron logging de debug a `api/src/routes/donate.ts` y `api/src/clients/khipu.ts`, incluyendo `console.log("[khipu] Authorization:", `${receiverId}:${hmac}`)` — es decir, el **`KHIPU_RECEIVER_ID` completo** quedó escrito en los logs de Vercel (el HMAC es un digest derivado, no el secreto en sí, pero el receiver ID sí es una credencial de cuenta).
   - `ab81bd3` agregó un endpoint público **`api/api/diagnose-khipu.ts`** — sin autenticación, con `Access-Control-Allow-Origin: *` — que respondía con `receiver_id_preview` (primeros 3 + últimos 2 caracteres) y `secret_preview` (primeros 4 + últimos 4 caracteres) de `KHIPU_SECRET`. Este archivo vive en `api/api/`, la carpeta de funciones serverless reales de Vercel (no en `src/`) — es decir, **fue un endpoint real y público** mientras existió, no un script local.
   - Ambos commits están confirmados como ancestros de `main` y de `origin/main` (`git merge-base --is-ancestor` → sí en ambos casos) — o sea, **llegaron a desplegarse en producción**, no quedaron en una rama sin mergear.
   - El mismo día, `a40d7e3` (commit "usar links estáticos de Khipu, sin llamada a la API") eliminó `diagnose-khipu.ts` al migrar al flujo estático — la ventana de exposición pública del endpoint fue de horas, no de meses.
   - **Lo que no se pudo verificar:** si `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` fueron efectivamente rotados en el dashboard de Khipu después de este incidente. Los valores de variables de entorno no viven en git — no hay forma de confirmar esto desde el repositorio. `docs/release/RELEASE_READINESS_V1.md` (línea 95, ítem 5.3) y su lista de prioridades (línea 177, acción #6) marcan **"Rotar credenciales Khipu" como 🔴 Pendiente / Alta**, sin ningún commit o documento posterior que registre que se haya ejecutado. Dado que la app ya está en producción (aprobada 2026-08-13) y el flujo dinámico sigue usando las mismas variables de entorno declaradas en Vercel, **se trata como una acción de seguridad todavía abierta, no como resuelta**, salvo que el CTO confirme lo contrario directamente (no verificable por otra vía).
2. **🟡 Medio — inconsistencia de referencia cruzada en la documentación (hallazgo nuevo, de higiene documental).** `SERVICE_ACCOUNT_MIGRATION.md` línea 464 remite a "RELEASE_READINESS_V1.md RC-3" para la nota de rotación de credenciales Khipu. Pero el **RC-3 real** de `RELEASE_READINESS_V1.md` (línea 195) es *"Scrapers HTML sin monitoreo de contenido"* — un tema no relacionado. La referencia correcta sería el ítem §5.3 ("Credenciales Khipu", línea 95) o la acción de prioridad #6 (línea 177). Es un error de cita, no un riesgo de producto, pero puede llevar a alguien a revisar el documento equivocado al buscar el contexto de este pendiente.
3. **🟡 Medio — cuenta de cobrador personal, no empresarial (heredado de la Auditoría original, reconfirmado).** Los pagos de donación llegan a una cuenta Khipu a nombre de una persona natural ("Mario Lillo Alfaro"), no de una entidad LET. Implica mezcla de fondos personales y de producto, y ata la operación de donaciones a una sola persona.
4. **🟢 Bajo — código muerto con superficie de riesgo si se reactiva sin cuidado.** El flujo dinámico (`/api/donate` + `createKhipuPayment()`) no tiene caller real hoy, pero sigue desplegado y funcional si algo lo invoca (ej. una futura integración desde `web/`). No es un riesgo activo mientras nadie lo llame, pero es superficie de ataque/mantenimiento sin uso — no se encontró evidencia de que esté planeado para `web/` ni de que se haya decidido eliminarlo.

## 6. Consumo actual

**No verificable** sin acceso al dashboard de Khipu — no hay forma de saber cuántas donaciones reales se han recibido vía los links estáticos.

## 7. Escalabilidad

No es un servicio con techo de plan que pueda agotarse (a diferencia de Sentry/PostHog/Supabase) — el riesgo de escalar no es de cuota, sino organizacional: una cuenta personal recibiendo donaciones de una base de usuarios creciente es cada vez menos apropiado cuanto más crece el uso, independientemente del volumen técnico.

## 8. Alternativas

- **Confirmar o descartar la rotación de credenciales pendiente** (§5.1) — acción de seguridad, no de producto; requiere acceso directo al dashboard de Khipu, fuera del alcance de esta revisión documental.
- **Decidir el destino del flujo dinámico `/api/donate`**: eliminarlo (si no hay plan de usarlo desde `web/`) o documentarlo explícitamente como reservado para una integración futura — hoy es ambiguo.
- **Corregir la referencia cruzada RC-3 → §5.3** en `SERVICE_ACCOUNT_MIGRATION.md` (cambio de documentación, no de código).
- **Migrar la cuenta receptora de donaciones a una entidad LET** cuando exista esa estructura — ya señalado como pendiente de decisión de negocio en revisiones previas (Vercel/Google Play), no específico de esta.

## 9. Costos

Sin plan ni costo fijo. Comisión por transacción a cargo del cobrador (no del pagador): fuentes de terceros consistentes entre sí (`khipu.zendesk.com`, agregadores de medios de pago 2026) citan **~0,69% + IVA por transferencia, o una tarifa plana de UF 0,0105, con descuentos por volumen** — esta cifra coincide con la que reportaba la Auditoría original. **No se pudo verificar directamente en `khipu.com/page/precios`** (la página no devolvió contenido legible por fetch, probablemente renderizado del lado del cliente) — a diferencia de Sentry/PostHog, esta cifra queda en estado "confirmada por múltiples fuentes de terceros", no "confirmada en la página oficial".

## 10. Recomendación del CTO

🔴 **Cambiar con urgencia** — no por el modelo de costos (que es razonable y sin riesgo), sino por la acción de seguridad pendiente sin confirmación de cierre: la exposición real y confirmada de `KHIPU_RECEIVER_ID` (logs) y una vista parcial de `KHIPU_SECRET` (endpoint público, horas de exposición) el 2026-06-16, sin evidencia en el repositorio de que las credenciales se hayan rotado después. Con la app ya en producción, esto debe cerrarse con una acción concreta y verificable: (A) confirmar en el dashboard de Khipu si las credenciales actuales son las mismas que estaban activas el 2026-06-16 y, si es así, rotarlas; o (B) si ya fueron rotadas en algún momento no documentado, registrar la fecha y cerrar el hallazgo explícitamente. Adicionalmente, de menor urgencia: decidir el destino del flujo dinámico huérfano y corregir la referencia cruzada RC-3.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `RELEASE_READINESS_V1.md` ni `SERVICE_ACCOUNT_MIGRATION.md` (siguen vigentes) — los complementa con evidencia directa de git que ninguno de los tres tenía. Es la undécima revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001).

## Matriz de Trazabilidad

| Concepto | Fuente Oficial / Evidencia | Consolidado aquí | Observaciones |
|---|---|---|---|
| Exposición de credenciales en logs y endpoint público | Historial de git: commits `4199095`, `81ed58e`, `ab81bd3`, `a40d7e3` (2026-06-16), confirmados como ancestros de `main`/`origin/main` | ✔ (§5.1) | Hallazgo nuevo con evidencia directa — antes solo documentado como texto en `SERVICE_ACCOUNT_MIGRATION.md` sin detalle del incidente |
| Estado de rotación de credenciales | No verificable desde el repositorio (valores de env vars no están en git) | ✔ (§5.1, marcado explícitamente "no verificable") | Tratado como pendiente por ausencia de evidencia de cierre, no por evidencia de que siga sin rotar |
| Referencia cruzada RC-3 incorrecta | `RELEASE_READINESS_V1.md` línea 195 vs. `SERVICE_ACCOUNT_MIGRATION.md` línea 464 | ✔ (§5.2) | Hallazgo nuevo, de higiene documental |
| Comisión por transacción | `khipu.zendesk.com`, agregadores de terceros 2026 | ✔ (§9) | No se pudo confirmar en la página oficial de precios (contenido no accesible por fetch) |
| Flujo dinámico sin caller real | Grep de `mobile/src` y `web/src` (esta revisión) | ✔ (§1, §5.4) | Hallazgo nuevo, arquitectónico |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `RELEASE_READINESS_V1.md` ni `SERVICE_ACCOUNT_MIGRATION.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/release/RELEASE_READINESS_V1.md`, `docs/release/SERVICE_ACCOUNT_MIGRATION.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación de la undécima revisión individual de servicio del backlog `OPS-BKL-001` — Khipu. Hallazgo crítico nuevo con evidencia directa de git: exposición confirmada de credenciales el 2026-06-16 sin evidencia de rotación posterior. Ningún código modificado. | `RELEASE_READINESS_V1.md`, `SERVICE_ACCOUNT_MIGRATION.md`, historial de git del repositorio, `khipu.zendesk.com` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de Khipu — undécimo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_KHIPU.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
