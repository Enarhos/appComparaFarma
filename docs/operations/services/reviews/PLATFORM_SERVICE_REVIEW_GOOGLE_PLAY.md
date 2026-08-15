# Revisión de Servicio — Google Play Console + Google Play Billing (RTDN)

**Código:** OPS-REV-008

**Nombre:** PLATFORM_SERVICE_REVIEW_GOOGLE_PLAY.md

**Dominio:** Operations (`docs/operations/`) — adopción voluntaria de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` (GOV-TPL-001), mismo mecanismo que `OPS-SVC-001`, `OPS-BKL-001`, `OPS-REV-001` a `OPS-REV-007`.

**Estado:** Activo

**Versión:** 1.0

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Clasificación:** Revisión de Servicio Externo (ítem de backlog `OPS-SVC-BKL-011`)

**Documentos de los que depende:** `docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md` (ficha #9), `mobile/app.json`, `mobile/src/components/DonationBanner.tsx`, `mobile/src/constants/donation.ts`, `api/src/lib/adapters/googlePlayAdapter.ts`.

---

## 1. Uso actual

Google Play Console cumple dos funciones separadas para ComparaFarma:

- **Distribución de `mobile/`** (`mla.app.comparafarma`) — la app pasó de Prueba Cerrada a producción el 2026-08-13 (`CLAUDE.md`).
- **Google Play Billing / RTDN (Fase 1 del motor de suscripciones)** — `api/src/lib/adapters/googlePlayAdapter.ts` traduce las notificaciones de Real-Time Developer Notifications de Google a eventos normalizados. Limitación ya documentada en el propio código: RTDN trae el `purchaseToken` pero no el `user_id` de Supabase, y sin que `mobile/` (congelado en ese sentido) envíe ese token al backend en el momento de la compra, no hay forma de asociar una notificación nueva a un usuario — solo se procesan renovaciones/cancelaciones ya asociadas por otro medio.

## 2. Inventario

| Dato | Valor |
|---|---|
| Package name | `mla.app.comparafarma` |
| versionCode actual | 31 (v1.4.0) — aprobado para producción el 2026-08-13 |
| Cuenta | Individual, no organización — `docs/release/SERVICE_ACCOUNT_MIGRATION.md` infiere por el prefijo `mla` del bundle ID que es la cuenta personal de "Mario Lillo Alfaro" |
| RTDN | `GOOGLE_RTDN_SECRET` en `api/.env.example`; endpoint `POST /api/subscriptions?action=google-rtdn` |
| Política de privacidad registrada | `https://enarhos.github.io/appComparaFarma/privacy-policy.html` (GitHub Pages, ver `OPS-REV-006`) |

## 3. Plan contratado

**Cuenta de Google Play Developer estándar — pago único de registro, no un plan recurrente.** Confirmado hoy vía documentación oficial (`support.google.com`): **USD 25, pago único, no reembolsable**, sin cargo recurrente independiente de cuántas apps se publiquen. No es comparable a un "plan" en el sentido de Vercel/Supabase — no hay tier que evaluar ni upgrade que considerar por volumen de uso.

## 4. Límites del plan

No aplica un límite de "plan" tradicional. Lo relevante para ComparaFarma no son cuotas de uso sino **políticas de contenido y de pagos**, investigadas hoy directamente en `support.google.com/googleplay/android-developer`:

- **Política de Pagos (`answer/9858738`, verificada 2026-08-15):** toda app distribuida en Play que requiera o acepte pago por funcionalidad, contenido o servicios dentro de la app debe usar el sistema de facturación de Google Play, **salvo** excepciones específicas (bienes/servicios físicos, remesas de tarjetas/servicios, pagos peer-to-peer, **"tax exempt donations"**, o programas de facturación/enlaces alternativos en países elegibles). Fuera de esas excepciones, el texto es explícito: *"apps may not lead users to a payment method other than Google Play's billing system"* — y lista expresamente como prohibido hacerlo vía *"In-app webviews, buttons, links, messaging, advertisements, or other calls to action"*.

## 5. Riesgos

1. **🔴 Alto — hallazgo nuevo de esta revisión, mismo patrón que el hallazgo de Vercel (`OPS-REV-005`): el `DonationBanner` de Mobile podría violar la Política de Pagos de Google Play.** `mobile/src/components/DonationBanner.tsx` abre, con un botón dentro de la app, un link externo de pago de Khipu (`Linking.openURL(urls[amount])`) — exactamente el patrón que la política prohíbe explícitamente en su punto 4 ("buttons, links... that lead users from an app to a payment method other than Google Play's billing system"). La única excepción que podría aplicar es la de "tax exempt donations" (punto 3.2) — pero no hay evidencia en el repo de que ComparaFarma esté constituida como una entidad con estatus de exención tributaria formal; el texto del banner ("apoya el proyecto con un aporte voluntario vía Khipu") describe un aporte voluntario a un proyecto, no una donación a una entidad con calificación tributaria de beneficencia. Si Google Play no considera esto una "tax exempt donation" calificada, la app entera podría quedar expuesta a remoción o suspensión de la cuenta de desarrollador — una cuenta recién aprobada para producción el 2026-08-13, que además es personal y no organizacional (SPOF ya documentado en la Auditoría original).
2. **🟡 Medio — heredado de la Auditoría original, reconfirmado, sin cambios.** El mismo patrón que Flow (`OPS-SVC-BKL-010`, pausado): la infraestructura de RTDN existe en código (`googlePlayAdapter.ts`) pero no hay evidencia de que `GOOGLE_RTDN_SECRET` esté configurado en Vercel — no verificable si está activo en producción hoy.
3. **🟡 Medio — cuenta personal, no organizacional (SPOF ya documentado transversalmente).** Sin cambios respecto a la Auditoría original.

## 6. Consumo actual

No aplica un "consumo" medible en el sentido de las revisiones anteriores (no hay cuota de uso) — lo relevante es el estado de cumplimiento de políticas (§5), no verificable con certeza desde el repo sin una revisión directa del Dashboard de Play Console (Policy status, App content).

## 7. Escalabilidad

No aplica un límite técnico que escale con usuarios. El riesgo real (§5.1) tampoco depende del volumen — una sola detección de Google sobre el patrón del `DonationBanner`, con cualquier volumen de usuarios, puede derivar en remoción de la app o suspensión de la cuenta.

## 8. Alternativas

- **Consultar si el aporte voluntario califica como "tax exempt donation" bajo la definición de Google.** Requeriría que ComparaFarma (o quien reciba los fondos) tenga un estatus de exención tributaria reconocido — no evaluado en esta revisión si esa condición se cumple hoy.
- **Migrar el cobro de donaciones a Google Play Billing** (in-app purchase de un "producto" de donación) — cumple la política sin ambigüedad, pero Google se queda con una comisión (históricamente 15-30% según volumen) sobre cada aporte, y requiere trabajo de implementación (Billing Library en Mobile).
- **Sacar el `DonationBanner` de la app Android** (dejar el mecanismo de donación solo en Web, donde no aplica la Política de Pagos de Google Play) y mantener la app 100% gratuita sin ningún llamado a pago dentro de Mobile — la opción de menor riesgo de cumplimiento, mismo tipo de decisión que la Opción B ya planteada para Vercel (`OPS-REV-005`).
- **No hacer nada y aceptar el riesgo** — dado que la app fue aprobada para producción apenas el 2026-08-13, es la opción de mayor exposición: cualquier revisión futura de Google Play (rutinaria o por reporte) podría detectar el patrón.

## 9. Costos

$25 USD, pago único ya realizado (registro de la cuenta de desarrollador) — sin costo recurrente de plan. El costo real en juego aquí no es de infraestructura sino el riesgo de remoción/suspensión de la única vía de distribución de Mobile si no se resuelve el hallazgo de §5.1.

## 10. Recomendación del CTO

🔴 **Cambiar con urgencia — no es un cambio de plan (no aplica, es pago único ya hecho), es una decisión de cumplimiento de políticas, urgente por el mismo motivo que Vercel: la app ya está en producción con este patrón activo.** El hallazgo es análogo en forma al de Vercel (`OPS-REV-005`): una funcionalidad de donaciones ya desplegada podría estar en conflicto con las políticas de la plataforma de distribución. Se recomienda decidir entre: (A) confirmar/establecer un estatus de "tax exempt donation" válido, (B) migrar el cobro a Google Play Billing, o (C) quitar el `DonationBanner` de Mobile y dejar el mecanismo de donación únicamente en Web. Ninguna acción se ejecutó desde esta revisión — es una decisión de producto/legal, no de código, y conviene resolverla junto con la decisión pendiente de Vercel (§3.2 de `OPS-REV-005`), ya que ambas involucran la misma funcionalidad de donaciones.

**Actualización (2026-08-15, sprint de cierre operacional):** análisis detallado del `DonationBanner` (texto, CTA, flujo Khipu, destinatario, contraprestación) completado en `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` — confirma que el aporte es voluntario y **sin ninguna contraprestación digital** (no desbloquea función, no cambia entitlement, no otorga badge). Por instrucción explícita del CTO, en ese momento la Opción C no se ejecutó automáticamente solo por este hallazgo.

**Actualización (2026-08-15, decisión de producto posterior):** el CTO decidió la Opción C para Mobile específicamente — **retirar temporalmente las donaciones de Mobile** durante la etapa inicial de adquisición de usuarios, implementado en la rama `mobile/disable-donations-temporarily` (retiro del render de `DonationBanner` en `mobile/src/app/medication.tsx`, sin eliminar el componente). Con esto, el riesgo de Política de Pagos de Google Play para Mobile queda resuelto en la práctica — no hay ninguna experiencia de donación visible en la app distribuida por Play. La pregunta de exención tributaria (Opción A) queda abierta solo para cuando se reevalúe reactivar donaciones en Mobile; Web no se ve afectado por este cambio y sigue recibiendo donaciones vía Khipu.

Escala de decisión usada: 🟢 Mantener sin cambios · 🟡 Mantener con acción de configuración/código pendiente · 🟠 Evaluar upgrade/migración en el corto plazo · 🔴 Cambiar con urgencia.

---

## Relaciones

Esta revisión no reemplaza a `PRODUCTION_INFRASTRUCTURE_AUDIT.md` (fuente original de la ficha #9, sigue vigente) ni a `PLATFORM_SERVICE_CATALOG.md`. Es la octava revisión individual generada a partir de `PLATFORM_SERVICE_REVIEW_BACKLOG.md` (OPS-BKL-001), y la segunda (tras Vercel, `OPS-REV-005`) que encuentra un conflicto entre la funcionalidad de donaciones de ComparaFarma y las políticas de una plataforma de distribución/hosting — ambos hallazgos deberían resolverse como una sola decisión de producto, no dos independientes.

## Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Tarifa de registro de Google Play Developer | Documentación pública de Google (`support.google.com`), verificado 2026-08-15 | ✔ (§3, §9) | $25 USD, pago único |
| Política de Pagos y excepción de donaciones exentas de impuestos | `support.google.com/googleplay/android-developer/answer/9858738`, verificado 2026-08-15 | ✔ (§4, §5.1) | Hallazgo nuevo, no estaba en la Auditoría original |
| Implementación real del `DonationBanner` (link externo vía botón) | `mobile/src/components/DonationBanner.tsx`, `mobile/src/constants/donation.ts` | ✔ (§5.1) | Confirma el patrón exacto que la política prohíbe |
| Estado de RTDN en producción | `api/.env.example`, Audit ficha #9 | Heredado, sin cambios | No verificable sin acceso a Vercel |

## Gobierno

Este documento no reemplaza `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `PLATFORM_SERVICE_REVIEW_BACKLOG.md` ni `RUNBOOK.md`. Adopta voluntariamente la estructura de `GOV-TPL-001` para la familia Operations, mismo mecanismo que las revisiones anteriores.

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `docs/operations/PLATFORM_SERVICE_REVIEW_VERCEL.md` (hallazgo relacionado sobre la misma funcionalidad de donaciones).

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación de la octava revisión individual de servicio del backlog `OPS-BKL-001` — Google Play Console + Billing/RTDN. Hallazgo nuevo: el `DonationBanner` de Mobile podría violar la Política de Pagos de Google Play (mismo patrón que el hallazgo de Vercel, `OPS-REV-005`). Ningún código modificado. | `PRODUCTION_INFRASTRUCTURE_AUDIT.md`, `PLATFORM_SERVICE_CATALOG.md`, `support.google.com` (oficial), código real de `mobile/src/components/DonationBanner.tsx` |
| 1.1 | 2026-08-15 | Activo | Pendiente (CTO) | Decisión de producto ejecutada: donaciones retiradas temporalmente de Mobile (rama `mobile/disable-donations-temporarily`). Hallazgo de Política de Pagos resuelto en la práctica para Mobile; Web sin cambios. | `docs/operations/PLATFORM_OPERATIONAL_STATUS.md` |

## Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-15 | Revisión completa de Google Play Console — octavo ítem ejecutado del backlog de servicios externos | CTO / Claude | `docs/operations/PLATFORM_SERVICE_REVIEW_GOOGLE_PLAY.md` v1.0 (este documento) |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado. La decisión sobre el `DonationBanner` (§8, §10) queda pendiente, y conviene tratarla junto con la decisión equivalente pendiente de `OPS-REV-005` (Vercel), ya que ambas comparten la misma causa.
