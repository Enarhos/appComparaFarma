# CF-120 — UI de upgrade en `web/` (`/cuenta`)

| Campo | Valor |
|---|---|
| **ID** | CF-120 |
| **Épica** | Subscription Platform (Fase 2) |
| **Estado** | ⚠️ Superseded (2026-08-02) por CF-125 (UI adaptada a Flow) — Stripe no admite comercios en Chile. Ver RFC-005/ADR-0004 |
| **Prioridad** | Media |
| **Estimación** | 1.5-2 h |
| **Referencia** | RFC-004 §3.5 |

---

## Objetivo

Que un usuario con plan `free` pueda iniciar un pago real desde `/cuenta`, sin hardcodear ningún plan en el código de `web/`.

## Alcance

### Incluye
- `web/src/lib/plans.ts` (nuevo): `getAvailablePlans()` — llama a `action=plans` (público, sin auth), degrada a `[]` si `api/` falla (mismo patrón que `profile.ts`).
- `web/src/app/cuenta/actions/upgrade.ts` (nuevo, Server Action): `createCheckoutSession(formData)` — resuelve la sesión de Supabase, llama a `action=create-checkout-session` con el token, y hace `redirect(url)` a Stripe (Next.js soporta redirects externos desde Server Actions).
- `web/src/app/cuenta/page.tsx`: si `profile.plan === "free"` y `getAvailablePlans()` devuelve al menos un plan, muestra un botón "Actualizar a Premium — {precio}" por plan disponible. Si el catálogo está vacío (estado real hoy), no muestra nada — no es un bug, es el catálogo sin definir.
- Banner de estado según `?checkout=success|cancelled|error` en la URL de retorno.

### No incluye
- No construye una página de pricing separada — el botón vive directo en `/cuenta`.
- No cambia nada de `/admin/usuarios` ni del flujo de otorgamiento manual (CF-116).

## Criterios de aceptación

1. Con el catálogo vacío (`action=plans` → `[]`), `/cuenta` se ve exactamente igual que antes de esta fase — sin elementos rotos ni mensajes de error.
2. Con al menos un plan disponible, aparece el botón y, al hacer clic, redirige a una URL de Stripe Checkout.
3. Volver de Stripe con `?checkout=success` muestra un mensaje de confirmación (el estado real del plan lo actualiza el webhook, no la URL de retorno — la URL es solo UX, nunca fuente de verdad).

## Definición de terminado

- [x] `plans.ts`, Server Action y cambios en `/cuenta` implementados
- [x] Tests (`plans.test.ts`, cobertura de `/cuenta` con y sin planes disponibles)
- [ ] Verificación manual en producción: pendiente de que exista al menos un plan real con `stripe_price_id` configurado (ver CF-121)
