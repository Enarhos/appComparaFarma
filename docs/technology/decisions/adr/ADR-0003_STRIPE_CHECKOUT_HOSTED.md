# ADR-0003 — Stripe Checkout hospedado (no Elements/Payment Intents embebido)

**Estado:** **Superseded (2026-08-02) por [ADR-0004](./ADR-0004_FLOW_SUBSCRIPTION_INTEGRATION.md)** — Stripe no admite comercios domiciliados en Chile. Este ADR sigue siendo válido como registro de *cómo* se habría integrado Stripe (Checkout hospedado, sin SDK) si algún día aplica para otro país, pero el código correspondiente fue eliminado de `main`.
**Fecha:** 2026-08-02

---

## Contexto

Fase 2 de la Epic "Subscription Platform" conecta el primer proveedor de pago real (Stripe) al motor de suscripciones de Fase 1 (RFC-003/ADR-0002). Stripe ofrece básicamente dos formas de cobrar una suscripción desde una web:

1. **Checkout hospedado**: el backend crea una "Checkout Session" y redirige al usuario a una página que Stripe hospeda y controla por completo (formulario de tarjeta, 3D Secure, diseño).
2. **Elements/Payment Intents embebido**: el formulario de pago vive dentro de la propia página de `web/`, usando `Stripe.js` en el cliente y la clave pública (`publishable key`), con más control visual pero más responsabilidad de seguridad/cumplimiento del lado de la aplicación.

Había que decidir cuál usar antes de escribir el endpoint de cobro.

## Decisión

Usar **Stripe Checkout hospedado**. `api/` crea la sesión server-side (REST API de Stripe, sin SDK) y devuelve una URL; `web/` simplemente redirige ahí. Ni la tarjeta ni ningún dato de pago pasan nunca por infraestructura propia.

## Consecuencias

**Beneficios:**
- Alcance de PCI-DSS mínimo — ComparaFarma nunca ve ni procesa un número de tarjeta.
- No requiere `Stripe.js` ni la `publishable key` en `web/` — el flujo entero se resuelve con un `fetch` al backend propio y una redirección, consistente con el resto de `web/` (sin dependencias de cliente nuevas).
- Stripe mantiene el formulario actualizado (nuevos métodos de pago, 3D Secure, cumplimiento regional) sin que ComparaFarma tenga que tocar código.
- Reduce el diff de esta fase — no hay que construir ni mantener un formulario de pago propio.

**Impactos aceptados:**
- Menos control visual: el usuario ve brevemente la marca de Stripe antes de volver a `app-compara-farma-web.vercel.app`. Se acepta como estándar de la industria para un producto en esta etapa.
- El flujo de "actualizar el método de pago" o "cancelar" de autogestión requeriría, a futuro, el Billing Portal hospedado por Stripe (mismo criterio) — no se construye en esta fase (ver RFC-004 §1, "Qué NO resuelve").

**Riesgos aceptados:**
- Ninguno nuevo respecto de usar Stripe en general — este ADR es sobre *cómo* integrarlo, no sobre si integrarlo (esa decisión es de ADR-0002/RFC-003).

## Alternativas consideradas

- **Stripe Elements/Payment Intents embebido:** descartada para Fase 2 — exige `Stripe.js` en el cliente, más superficie de UI propia que mantener, y no aporta valor de negocio adicional en esta etapa (el objetivo es habilitar el primer canal de cobro, no diferenciar la experiencia de pago). Queda como opción futura si algún día se necesita una experiencia de checkout más integrada a la marca.
- **Instalar el SDK oficial `stripe` de Node en vez de `fetch` + verificación manual de firma:** descartada por consistencia con el resto de `api/` (todos los clientes de farmacias son `fetch` puro, sin SDKs) y porque el algoritmo de verificación de firma de webhooks está documentado públicamente y es implementable en pocas líneas con `node:crypto`, sin agregar una dependencia nueva al bundle de una función serverless.

## Referencias

- [RFC-004_WEB_BILLING_STRIPE.md](../rfc/RFC-004_WEB_BILLING_STRIPE.md)
- [ADR-0002_SUBSCRIPTION_ARCHITECTURE.md](./ADR-0002_SUBSCRIPTION_ARCHITECTURE.md)
- [RFC-003_SUBSCRIPTION_ENGINE.md](../rfc/RFC-003_SUBSCRIPTION_ENGINE.md)
