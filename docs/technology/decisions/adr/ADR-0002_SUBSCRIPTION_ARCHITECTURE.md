# ADR-0002 — Subscription Architecture

**Estado:** Aprobado
**Fecha:** 2026-08-02

---

## Contexto

Sprint D introdujo `profiles.plan: 'free' | 'premium'` como mecanismo mínimo para gatear funcionalidades sin flujo de pago. El CEO pidió avanzar hacia un sistema de suscripciones real, con un requisito no negociable explícito: **el backend debe ser la única fuente de verdad sobre el estado Premium — nunca un proveedor de pago (Google Play, Apple, Stripe, Flow, Mercado Pago)**. Los proveedores deben poder cambiarse o sumarse sin rediseñar el sistema, y los planes comerciales (mensual, anual, familiar, empresa, cortesía, etc.) deben ser configurables, no hardcodeados.

## Decisión

Construir un **Subscription Service** dentro de `api/` (`api/src/services/subscriptionService.ts`), con tres piezas separadas:

1. **Catálogo configurable** (`subscription_plans`) — nombre, tipo de producto, período de facturación, precio referencial, beneficios, disponibilidad y estado viven en la base de datos, nunca en código.
2. **Motor de estado** (`subscriptions` + `subscription_events`) — una tabla de estado actual por usuario y una bitácora inmutable de cada evento notificado por un proveedor. La única función expuesta a clientes es `getEntitlement(userId)`, que decide si alguien tiene acceso Premium y con qué beneficios.
3. **Adaptadores por proveedor** (`PaymentProviderAdapter`) — cada proveedor de pago se integra normalizando su formato propio de notificación a un evento común (`NormalizedSubscriptionEvent`). Ningún proveedor escribe directamente en `subscriptions`; todos pasan por `recordProviderEvent()`.

Fase 1 (este ADR) implementa únicamente el adaptador de Google Play, del lado servidor. `profiles.plan` (Sprint D) pasa de fuente de verdad a campo derivado, actualizado solo por el motor — nunca escrito directo por un endpoint de cliente.

Detalle técnico completo (esquema SQL, contratos de función, API) en RFC-003.

## Consecuencias

**Beneficios:**
- Ningún proveedor de pago puede convertirse en un punto único de fallo o de control sobre el acceso Premium — si Google Play tiene un incidente, el estado ya persistido en `subscriptions` sigue siendo válido.
- Agregar un proveedor nuevo (Stripe, Flow) es escribir un adaptador nuevo, no rediseñar el modelo de datos.
- Agregar un plan comercial nuevo es una fila en `subscription_plans`, no un deploy de código.
- `subscription_events` da trazabilidad completa (auditoría) de cualquier disputa o bug de facturación.

**Impactos aceptados:**
- Tres tablas nuevas en Supabase en vez de extender `profiles` — más piezas que mantener, a cambio de no repetir el error de Sprint D (un campo demasiado simple para lo que viene).
- `web/src/lib/profilesAdmin.ts` y `web/src/lib/profile.ts` requieren un cambio de implementación (ver CF-116) — sin cambio de comportamiento visible para el usuario.
- Requiere una Service Account de Google Cloud nueva (acceso a la Play Developer API) — no existe hoy, se crea bajo `mario.lillo.alfaro@gmail.com` (misma cuenta que ya es dueña de Google Play Console, decisión explícita del CEO, ver `docs/release/SERVICE_ACCOUNT_MIGRATION.md`).

**Riesgos aceptados:**
- `mobile/` está en Prueba Cerrada de Google Play y no puede tocarse — el flujo de compra real iniciado desde la app queda fuera de alcance de Fase 1. El motor se puede construir y probar (sandbox, notificaciones RTDN de prueba, otorgamiento manual) sin ese flujo, pero no hay verificación end-to-end con una compra real hasta que `mobile/` se libere. Detalle en RFC-003 §5 (R-01, R-02).

## Alternativas consideradas

- **Seguir extendiendo `profiles.plan` con más columnas (fecha de vencimiento, proveedor, etc.):** descartada — mezclar identidad de usuario con estado de facturación en la misma tabla dificulta la auditoría y no separa catálogo de estado; no soporta múltiples suscripciones históricas por usuario.
- **Consultar a Google Play en vivo cada vez que se necesite saber si alguien es Premium:** descartada explícitamente por el CEO — viola el principio de que el backend es la única fuente de verdad, y ata la disponibilidad de la app a la disponibilidad de un proveedor externo.
- **Un adaptador único "genérico" para todos los proveedores:** descartada — Google Play, Apple y Stripe tienen formatos de notificación, modelos de reintentos y semánticas de reembolso lo bastante distintos como para que una abstracción única termine llena de `if (provider === ...)`; un adaptador por proveedor mantiene esa complejidad contenida y aislada.

## Referencias

- [RFC-003_SUBSCRIPTION_ENGINE.md](../rfc/RFC-003_SUBSCRIPTION_ENGINE.md)
- [docs/product/SUBSCRIPTION_STRATEGY.md](../../product/SUBSCRIPTION_STRATEGY.md)
- [docs/product/EPICS.md](../../product/EPICS.md) — Epic "Subscription Platform"
- [docs/release/SERVICE_ACCOUNT_MIGRATION.md](../../release/SERVICE_ACCOUNT_MIGRATION.md)
