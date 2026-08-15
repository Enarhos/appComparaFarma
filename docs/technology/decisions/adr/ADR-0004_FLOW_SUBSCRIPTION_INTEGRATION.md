# ADR-0004 — Flow como proveedor de pago recurrente (reemplaza a Stripe)

**Estado:** Aprobado
**Fecha:** 2026-08-02

---

## Contexto

ADR-0003/RFC-004 (Fase 2 de la Epic "Subscription Platform") eligieron Stripe Checkout hospedado como primer proveedor de pago real. El código se implementó y mergeó a `main`, pero al intentar crear la cuenta real, **Stripe no acepta comercios domiciliados en Chile** (verificado oficialmente en `stripe.com/global`: solo 46 países soportados, ninguno de Sudamérica salvo México y Brasil). Esto no es un problema de configuración — Stripe no es una opción viable para ComparaFarma hoy, sin importar cómo se implemente el adaptador.

Se evaluaron alternativas:

- **Khipu** (cuenta ya existente, usada hoy para donaciones): su API de pagos recurrentes ("Pagos Automáticos") no es self-service — `docs.khipu.com` indica explícitamente que hay que contactar al equipo de ventas de Khipu para habilitarla, y no está disponible para todos los clientes. Descartada para esta fase por no poder integrarse sin una gestión comercial externa previa.
- **Flow**: pasarela de pago chilena con soporte nativo de Chile/Perú/México, cuenta creada por el CEO (self-service, sin gestión comercial previa), y un producto dedicado de "Planes de Suscripción" (`/plans/create`, `/customer/create`, `/customer/register`, `/subscription/create`, `/invoice/get`) documentado públicamente en `developers.flow.cl`.

Todo el contrato de la API de suscripciones de Flow se verificó de punta a punta en el sandbox (`sandbox.flow.cl`) antes de escribir este ADR: plan de prueba creado, cliente creado, tarjeta de prueba enrolada, suscripción creada, primer cobro confirmado como pagado, y el payload real del webhook (`urlCallback`) capturado con `webhook.site`. Ningún nombre de campo de este ADR es una suposición.

## Decisión

Usar **Flow** como proveedor de pago recurrente, reemplazando por completo a Stripe (se elimina el código de Fase 2 relacionado a Stripe — ver RFC-005 §1). Se integra vía la REST API de Flow con `fetch` nativo y firma HMAC-SHA256 manual (mismo criterio que ADR-0003 para Stripe: sin SDK, consistente con el resto de `api/`).

**Patrón de resolución de webhooks (verificado en sandbox, no documentado explícitamente por Flow pero confirmado empíricamente):** Flow nunca manda el resultado de un cobro en el cuerpo del `POST` al `urlCallback` — manda únicamente `token` (`application/x-www-form-urlencoded`, body = `token=<valor>`). El comercio debe resolver ese token con un segundo llamado `GET` firmado:

- Para la confirmación de enrolamiento de tarjeta (`url_return` de `/customer/register`) → `GET /customer/getRegisterStatus?token=...`.
- Para el cobro de un invoice de suscripción (`urlCallback` del plan) → `GET /payment/getStatus?token=...`, que devuelve `status` (2 = pagada) y `commerceOrder` con el formato `"{subscriptionId}_{invoiceId}_{fecha}"` — de ahí se extrae a qué suscripción pertenece el cobro sin ninguna llamada adicional.

**Simplificación frente a Stripe:** Flow permite que el comercio elija el identificador del plan (`planId` en `/plans/create` es un string libre, no un ID generado por Flow) — se reutiliza directamente `subscription_plans.id` como `planId` de Flow, sin necesitar una columna de mapeo nueva (a diferencia de `stripe_price_id`, que sí era necesaria porque Stripe genera sus propios IDs de Price).

## Consecuencias

**Beneficios:**
- Único proveedor de pago recurrente self-service confirmado viable para un comercio chileno hoy.
- Verificado de punta a punta en sandbox antes de escribir una sola línea del adaptador — cero riesgo de "descubrir en producción" un campo mal documentado.
- Sin columna de mapeo de plan nueva (`planId` = `subscription_plans.id` directo).
- Mismo principio de "sin SDK" que el resto del proyecto.

**Impactos aceptados:**
- El flujo de alta es más largo que el de Stripe Checkout: Stripe resolvía todo en una sola redirección (Checkout Session). Flow requiere una secuencia de 3 llamadas server-side antes de poder cobrar (`customer/create` → `customer/register` → esperar confirmación → `subscription/create`), con el usuario redirigido al sitio de Flow durante el paso de enrolamiento de tarjeta (incluye, en algunos medios de pago, un paso extra de simulación/autenticación bancaria).
- El webhook de Flow es deliberadamente opaco (solo `token`) — todo adaptador de Flow necesita el paso extra de resolución vía `GET` firmado. Esto es más llamadas de red por evento que el webhook de Stripe (que ya traía el payload completo, solo requería verificar la firma).
- No hay un endpoint documentado de "obtener suscripción por ID" en la API de Flow (solo devuelve el objeto completo al crearla) — para actualizar `period_end` en una renovación hay que usar `GET /invoice/get` con el `invoiceId` extraído del `commerceOrder`, no un refetch directo de la suscripción.
- Manejo de cobros fallidos/reintentos (`charges_retries_number`) queda fuera de esta fase — igual que R-02/`invoice.payment_failed` en la Fase 2 original de Stripe, se documenta como límite conocido, no como bug (ver RFC-005 §Riesgos).

**Riesgos aceptados:**
- Ninguno nuevo respecto de aceptar pagos recurrentes en general — ese riesgo ya fue aceptado en ADR-0002/RFC-003. Este ADR es sobre *qué proveedor* y *cómo* integrarlo.

## Alternativas consideradas

- **Mantener Stripe para cuando la empresa opere en México/Brasil a futuro:** el código y las decisiones de Fase 2 originales no se pierden como conocimiento — quedan documentadas en RFC-004/ADR-0003 (marcados como Superseded, no eliminados), reutilizables si algún día aplica. El código en sí se elimina de `main` (decisión explícita del CEO) para no mantener una integración muerta en el repo.
- **Khipu:** descartada para esta fase — requiere gestión comercial previa con el equipo de ventas de Khipu antes de poder usar la API de pagos automáticos, lo que la sacaría del ciclo de esta Epic sin una fecha cierta.
- **Instalar un SDK de terceros para Flow (ej. clientes de Node/PHP publicados en GitHub por la comunidad):** descartada por el mismo criterio que Stripe — la firma HMAC-SHA256 es trivial de implementar con `node:crypto`, y no se agrega una dependencia no oficial (ninguno de esos clientes es mantenido por Flow mismo) al bundle de una función serverless.

## Referencias

- [RFC-005_WEB_BILLING_FLOW.md](../rfc/RFC-005_WEB_BILLING_FLOW.md)
- [RFC-004_WEB_BILLING_STRIPE.md](../rfc/RFC-004_WEB_BILLING_STRIPE.md) (Superseded)
- [ADR-0003_STRIPE_CHECKOUT_HOSTED.md](./ADR-0003_STRIPE_CHECKOUT_HOSTED.md) (Superseded)
- [ADR-0002_SUBSCRIPTION_ARCHITECTURE.md](./ADR-0002_SUBSCRIPTION_ARCHITECTURE.md)
- Documentación oficial: `developers.flow.cl/en/docs/category/planes-de-suscripción`, `developers.flow.cl/en/docs/credentials` (tarjetas de prueba)
