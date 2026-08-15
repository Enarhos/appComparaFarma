# CF-116 — Migrar `/admin/usuarios` y `profile.ts` al Motor de Suscripciones

| Campo | Valor |
|---|---|
| **ID** | CF-116 |
| **Épica** | Subscription Platform (Fase 1) |
| **Estado** | ✅ Implementado (2026-08-02) |
| **Prioridad** | Media |
| **Estimación** | 1.5-2 h |
| **Referencia** | RFC-003 §3.5, §4 (compatibilidad), Sprint D (`docs/archive/execution/prompts/claude/PROMPT_CLAUDE_SPRINT_D_CUENTA_LIGERA.md`) |

---

## Objetivo

Dejar de escribir/leer `profiles.plan` directo desde código de cliente — todo pasa por el Subscription Service, sin cambiar el comportamiento visible de Sprint D.

## Alcance

### Incluye
- `web/src/lib/profilesAdmin.ts`: `setProfilePlan(id, plan)` deja de hacer `update profiles set plan = ...` — pasa a llamar `grantManual(id, planId, expiresAt?)` del motor (vía una llamada server-side a `api/`, o directo a `subscriptionsDb` si `web/` y `api/` comparten el mismo proyecto Supabase, a decidir en implementación).
- `web/src/lib/profile.ts`: `getCurrentProfile()` deja de leer `profiles.plan` directo — pasa a consultar `getEntitlement` (vía `api/api/subscriptions.ts?action=me`, o el equivalente que se decida en implementación).
- `profiles.plan` se mantiene en el esquema como cache derivado — actualizado por `subscriptionService`, nunca por un endpoint de cliente directo. Ya no es la fuente de verdad, pero no se elimina (evita romper cualquier lectura existente).

### No incluye
- No cambia la UI de `/admin/usuarios` ni de `/cuenta` — el comportamiento visible para Mario y para los usuarios finales es idéntico al de Sprint D.
- No migra datos históricos — no hay usuarios premium reales todavía (Sprint D recién se lanzó), así que no hay backfill que hacer.

## Criterios de aceptación

1. `/admin/usuarios` sigue permitiendo activar/desactivar premium, con el mismo resultado visible, ahora vía el motor.
2. `/cuenta` sigue mostrando el plan correcto, ahora resuelto vía `getEntitlement`.
3. Ningún test existente de `profilesAdmin.test.ts` ni de las páginas de `/cuenta` se rompe (se actualizan los mocks si el mecanismo interno cambia, pero el comportamiento externo verificado por los tests no cambia).

## Definición de terminado

- [x] `profilesAdmin.ts` actualizado (`setProfilePlan` → `action=grant-manual`/`revoke-manual` vía `api/`)
- [x] `profile.ts` actualizado (`getCurrentProfile` → `action=me` vía `api/`, degrada a `free` si `api/` no responde)
- [x] Tests existentes y nuevos en verde (6 en `profilesAdmin.test.ts`, 7 nuevos en `profile.test.ts`)
- [ ] Verificación manual en producción: togglear premium en `/admin/usuarios` y confirmar que se refleja en `/cuenta` — pendiente de que Mario corra el SQL de CF-112 en Supabase y haga un deploy
