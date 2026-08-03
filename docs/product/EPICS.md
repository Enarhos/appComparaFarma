# Epics

Iniciativas grandes que agrupan varios sprints/RFCs. Convención: una Epic queda "Activa" cuando al menos una fase tiene código en `main`; las fases futuras quedan en Backlog hasta ser puntuadas con CFPS (Regla 2 del `PRODUCT_DECISION_FRAMEWORK.md`).

---

## Subscription Platform

**Estado:** ✅ Activa — Fases 1 y 2 implementadas y mergeadas a `main` (2026-08-02)
**Origen:** `docs/product/SUBSCRIPTION_STRATEGY.md` (estrategia ya aprobada) + pedido explícito del CEO de construir el motor técnico independiente de proveedor de pago.
**Documentos relacionados:** `docs/product/SUBSCRIPTION_STRATEGY.md`, `docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md`, `docs/engineering/adr/ADR-0002_SUBSCRIPTION_ARCHITECTURE.md`

### Objetivo

Construir un Motor de Suscripciones donde el backend es la única fuente de verdad sobre el estado Premium de un usuario. Los proveedores de pago (Google Play, Apple, Stripe, Flow, Mercado Pago, etc.) solo notifican transacciones — nunca determinan acceso directamente. El motor debe soportar múltiples proveedores y múltiples tipos de plan (mensual, trimestral, anual, promocional, familiar, empresa, API, cortesía) sin que ninguno quede codificado en TypeScript.

Esta Epic reemplaza el mecanismo simple `profiles.plan` de Sprint D (ver `docs/database/schema.sql`, sección Sprint D) por un modelo real de suscripciones con vigencia, proveedor y bitácora de eventos — `profiles.plan` pasa a ser un campo derivado, no la fuente de verdad.

### Fases

| Fase | Alcance | Estado |
|---|---|---|
| **Fase 1** | Motor de suscripciones, modelo de datos, API (`api/`), adaptador Google Play (solo lado backend) | ✅ Implementado y mergeado a `main` (CF-112 a CF-116, ver `BACKLOG_PRODUCT.md`) |
| **Fase 2** | Web Billing, integración Stripe, diseño para Flow/Mercado Pago | ✅ Implementado y mergeado a `main` (CFPS 3.2, ver `BACKLOG_PRODUCT.md` — RFC-004, ADR-0003, CF-117 a CF-121). Diseño para Flow/Mercado Pago queda para una fase futura, no cubierto todavía. |
| **Fase 3** | Apple Billing | ⬜ Backlog futuro |
| **Fase 4** | Plataforma Comercial: planes configurables desde `/admin`, promociones, cupones, empresas, API Premium, licencias | ⬜ Backlog futuro |

### Bloqueador conocido de Fase 1

`mobile/` está en Prueba Cerrada de Google Play — no se puede tocar (ver restricción activa en `CLAUDE.md`). El flujo de compra real (llamar a Play Billing Library desde la app, enviar el purchase token al backend) requiere cambios en `mobile/` y por lo tanto **no puede completarse de punta a punta hasta que `mobile/` salga de Prueba Cerrada**. Fase 1 entrega el motor completo del lado `api/` (modelo de datos, servicio, adaptador de Google Play, endpoint) pero queda sin verificación end-to-end con una compra real hasta ese momento.

### Solo Fase 1 tiene prompt de implementación

Por Regla 2 del `PRODUCT_DECISION_FRAMEWORK.md`, ninguna fase se implementa sin backlog + CFPS previos. Fases 2–4 quedan documentadas acá como plan, no como compromiso de sprint.
