# Revisión de Servicio — Khipu

**Código:** OPS-REV-011

**Nombre:** PLATFORM_SERVICE_REVIEW_KHIPU.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-010`.

**Estado:** Activo

**Versión:** 1.3

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

## 5bis. Re-verificación de código (2026-08-15, sesión de preparación de rotación)

Antes de preparar el procedimiento de rotación, se re-auditó el estado **actual** del código (no solo el historial de git de §5.1), para confirmar que no queda ninguna exposición activa hoy:

- `KHIPU_SECRET_EXPOSURE_CURRENT: NO` — grep de `console.(log|info|warn|error)` combinado con `khipu`/`receiver`/`hmac`/`Authorization` en todo `api/src`: cero resultados. `api/src/clients/khipu.ts` y `api/src/routes/donate.ts` no loguean el secreto, el receiver ID ni la firma HMAC en ningún punto actual.
- `KHIPU_DIAGNOSTIC_ENDPOINT: ABSENT` — `api/api/diagnose-khipu.ts` no existe en el árbol actual (`ls api/api/` no lo lista) ni en `HEAD` (`git cat-file -e HEAD:api/api/diagnose-khipu.ts` falla con "Not a valid object name"). El commit que lo eliminó (`a40d7e3`) sigue siendo ancestro de `main`.
- `KHIPU_SECRET_LOGGING: ABSENT` — mismo resultado que el primer punto; tampoco se encontró en `captureException()` (el contexto enviado a Sentry en `donate.ts` es solo `{ route: "/api/donate" }`, sin datos de Khipu).
- Sin `NEXT_PUBLIC_KHIPU_*` ni `EXPO_PUBLIC_KHIPU_*` en ningún `.env.example` (`api/`, `web/`, `mobile/`) — las credenciales de Khipu nunca se documentaron ni se usaron como variables de cliente. Nota aparte (higiene, no seguridad): `api/.env.example` tampoco documenta hoy `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` pese a que `ENVIRONMENT.md` afirma que se agregaron — no se corrigió en esta sesión por estar fuera del alcance explícito (solo este documento y `PLATFORM_OPERATIONAL_STATUS.md`).
- `KHIPU_SECRET_ROTATION_EVIDENCE: ABSENT` — sigue sin poder verificarse desde el repositorio (los valores de env vars de Vercel no viven en git); no cambia respecto a §5.1.

**Conclusión de esta re-verificación:** la exposición de código (logging + endpoint público) está confirmada como cerrada hoy — no hay ninguna superficie activa que siga filtrando el secreto o el receiver ID. Lo único que sigue abierto es la **rotación de las credenciales mismas en el panel de Khipu**, que es una acción humana, no de código (ver procedimiento y comando de validación exactos en `docs/operations/PLATFORM_OPERATIONAL_STATUS.md`, acción `ROTATE_KHIPU_CREDENTIALS`, actualizada en esta misma fecha). No se modificó código productivo en esta sesión porque no se encontró ningún problema activo que lo justificara.

## 5ter. Migración a Khipu Instant Payments API 3.0 (2026-08-15, Sprint SEC-KHIPU-V3)

`api/src/clients/khipu.ts` y `api/src/routes/donate.ts` migraron de la API 2.0 (firma HMAC + `KHIPU_RECEIVER_ID`/`KHIPU_SECRET`) a la API 3.0 (autenticación por API Key vía header `x-api-key`, sin firma HMAC en la creación del pago), verificada contra la documentación oficial de Khipu (`docs.khipu.com/payment-solutions/instant-payments/*`, no la de Open Finance).

```
KHIPU_API_VERSION: 3.0
KHIPU_PAYMENT_CREATION: IMPLEMENTED
KHIPU_PAYMENT_STATUS_QUERY: IMPLEMENTED
KHIPU_WEBHOOK: PENDING
KHIPU_WEBHOOK_SIGNATURE_SECRET: UNCONFIRMED
KHIPU_API_V2_CREDENTIALS: LEGACY_ROLLBACK_ONLY
```

- **`createKhipuPaymentV3()`** — `POST https://payment-api.khipu.com/v3/payments` con `x-api-key: KHIPU_API_KEY`. `/api/donate` la usa para todos los pagos nuevos; el contrato público (`{amount}` → `{payment_url}`) no cambió.
- **`getKhipuPayment()`** — `GET https://payment-api.khipu.com/v3/payments/{id}`, mismo header. Implementado y testeado, pero **no expuesto como endpoint público** todavía — no hay ningún caller real (ni Web ni Mobile) que lo necesite hoy.
- **Webhook (`notify_url`/`notify_api_version`) queda deliberadamente fuera de esta migración.** No se envía en la creación del pago. La documentación oficial confirma que la notificación viene firmada con un header `x-khipu-signature` (HMAC-SHA256), pero el texto dice solo "el secreto de su comercio" sin aclarar inequívocamente si es un valor nuevo asociado a la API Key o si reutiliza el `KHIPU_SECRET` de la API 2.0 — no se asumió ninguna de las dos opciones. Queda registrado como `KHIPU_WEBHOOK_SIGNATURE_SECRET: UNCONFIRMED` y como deuda pendiente (ver PR de esta migración para el detalle completo).
- **`KHIPU_RECEIVER_ID`/`KHIPU_SECRET` pasan a `LEGACY_ROLLBACK_ONLY`.** El código que los usa (`createKhipuPaymentLegacyV2()`, ex-`createKhipuPayment()`) sigue en el repositorio sin llamador real, únicamente para poder revertir `/api/donate` a la API 2.0 con un solo cambio de import si la migración presentara un problema no anticipado. No se eliminaron de Vercel ni del código — ver acción humana en `PLATFORM_OPERATIONAL_STATUS.md`.
- **`return_url`/`cancel_url`** están soportados por la API 3.0 (confirmado en la documentación oficial) y el helper `createKhipuPaymentV3()` ya acepta ambos parámetros, pero `/api/donate` no los envía todavía porque no existe ninguna página en Web a la que apuntar — se agregarán cuando exista el CTA Web (fuera de alcance de este sprint).

## 5quater. CTA de donación en Web + confirmación en producción (2026-08-15, Sprint FEAT-WEB-DONATIONS)

Se implementó el primer CTA de donación en `web/` (footer global, discreto, sin banners ni popups automáticos) y se confirmó en producción que la migración a API 3.0 funciona: `POST https://comparafarma-api.vercel.app/api/donate` con `{"amount":1000}` respondió `HTTP 200` con un `payment_url` real de Khipu.

```
WEB_DONATION_CTA: IMPLEMENTED
WEB_DONATION_PAYMENT_CREATION: KHIPU_API_3
KHIPU_PAYMENT_CREATION: VERIFIED_IN_PRODUCTION
KHIPU_PAYMENT_CONFIRMATION: NOT_IMPLEMENTED
KHIPU_WEBHOOK: PENDING
KHIPU_WEBHOOK_SIGNATURE_SECRET: UNCONFIRMED
```

- **CTA:** `web/src/components/DonationWidget.tsx`, montado desde un nuevo `Footer.tsx` global (`app/layout.tsx`). Botón discreto "Apoya ComparaFarma" que expande un selector de 3 montos fijos ($1.000/$3.000/$5.000) — mismo patrón "colapsado → expandido" que `PriceAlertForm.tsx`. Deliberadamente no se repite en cada resultado de medicamento.
- **Creación del pago:** `web/src/lib/actions/createDonationPayment.ts` (Server Action) llama a `POST /api/donate` enviando únicamente `{amount}` — nunca ninguna credencial (`API_SECRET_KEY`/`KHIPU_API_KEY`/`KHIPU_SECRET`/`KHIPU_RECEIVER_ID`). Valida que `payment_url` sea HTTPS y pertenezca a `khipu.com`/subdominios antes de dejar que el navegador redirija.
- **`return_url`/`cancel_url` ya se conectan** en `api/src/routes/donate.ts` (no en `khipu.ts`, que no se tocó) apuntando a `/apoyar/retorno` y `/apoyar/cancelado` — dos páginas mínimas y neutras en Web que **nunca afirman que el pago fue exitoso**, solo que el usuario volvió desde Khipu.
- **`KHIPU_PAYMENT_CONFIRMATION: NOT_IMPLEMENTED`** — sigue sin existir ninguna forma de asociar el `payment_id` devuelto por Khipu con una consulta posterior desde Web (`getKhipuPayment()` existe en el backend desde la migración a API 3.0, pero no tiene ningún caller todavía). La página de retorno es honesta sobre esta limitación: no inventa una confirmación que no puede verificar.
- **Webhook sigue fuera de alcance** (`KHIPU_WEBHOOK: PENDING`, `KHIPU_WEBHOOK_SIGNATURE_SECRET: UNCONFIRMED`) — sin cambios respecto a §5ter.
- **Rate limiting agregado a `/api/donate`:** no tenía ninguno antes de este sprint (hallazgo reportado explícitamente); se agregó reutilizando `consumeRateLimit()` (mismo mecanismo de `/api/search`/`/api/price-history`, no es infraestructura nueva).

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
| 1.1 | 2026-08-15 | Activo | Pendiente (CTO) | Re-verificación de código previa a preparar la rotación de credenciales (§5bis): confirma que no hay exposición activa hoy (sin logging, sin endpoint de diagnóstico, sin secretos en variables de cliente). Ningún código modificado — no se encontró ningún problema activo que lo justificara. La rotación en sí sigue pendiente como acción humana, sin cambios respecto a v1.0. | Auditoría de código de esta sesión (`api/src/clients/khipu.ts`, `api/src/routes/donate.ts`, `api/api/`, `.env.example` de los 3 paquetes) |
| 1.2 | 2026-08-15 | Activo | Pendiente (CTO) | Migración de `/api/donate` de Khipu API 2.0 a Instant Payments API 3.0 (§5ter): nueva autenticación por `x-api-key`/`KHIPU_API_KEY`, `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` reclasificados a `LEGACY_ROLLBACK_ONLY` (sin eliminar), webhook explícitamente pendiente por secreto de firma no confirmado. Código modificado: `api/src/clients/khipu.ts`, `api/src/routes/donate.ts`, `api/.env.example`, nuevos tests. | Documentación oficial de Khipu (docs.khipu.com/payment-solutions/instant-payments/*), verificada con fetch directo, no por resumen de búsqueda |
| 1.3 | 2026-08-15 | Activo | Pendiente (CTO) | Primer CTA de donación en Web (§5quater): footer global discreto, Server Action con validación de payment_url (HTTPS + dominio khipu.com), return_url/cancel_url conectados a /apoyar/retorno y /apoyar/cancelado (páginas que nunca afirman pago exitoso), rate limiting agregado a /api/donate (no tenía ninguno). Confirmado en producción que la creación de pago vía API 3.0 funciona (KHIPU_PAYMENT_CREATION: VERIFIED_IN_PRODUCTION). Confirmación de pago (KHIPU_PAYMENT_CONFIRMATION) sigue NOT_IMPLEMENTED. | Prueba real ejecutada por el CTO contra producción (POST /api/donate, HTTP 200 + payment_url) |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de Khipu — undécimo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_KHIPU.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
