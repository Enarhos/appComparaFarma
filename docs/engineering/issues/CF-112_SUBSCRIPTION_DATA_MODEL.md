# CF-112 — Modelo de datos del Motor de Suscripciones

| Campo | Valor |
|---|---|
| **ID** | CF-112 |
| **Épica** | Subscription Platform (Fase 1) |
| **Estado** | Código listo — pendiente de que Mario corra el SQL en Supabase |
| **Prioridad** | Media |
| **Estimación** | 1-1.5 h |
| **Referencia** | RFC-003 §3.1, ADR-0002 |

---

## Objetivo

Crear las 3 tablas nuevas en Supabase que sostienen el motor de suscripciones, sin tocar ninguna tabla existente más allá de la referencia a `profiles(id)`.

## Alcance

### Incluye
- Agregar a `docs/database/schema.sql` (sección nueva, estilo `if not exists` consistente con el resto del archivo):
  - `subscription_plans` (catálogo configurable de planes)
  - `subscriptions` (estado por usuario, con `provider`, `status`, vigencia)
  - `subscription_events` (bitácora inmutable de eventos de proveedor)
- Índices: `subscriptions_user_id_idx`, `subscriptions_active_idx` (parcial, solo `active`/`grace_period`), `subscription_events_subscription_id_idx`.
- RLS habilitada en las 3 tablas, sin policies permisivas para el rol autenticado (mismo patrón que `profiles`/`price_history`) — solo el cliente admin (`SUPABASE_SECRET_KEY`) lee/escribe.

### No incluye
- No modifica `profiles` más allá de lo que ya existe (Sprint D) — `profiles.plan` se mantiene por ahora como cache derivado.
- No incluye datos semilla de planes reales — el catálogo queda vacío o con un plan de prueba hasta que el CEO defina los planes comerciales.

## Criterios de aceptación

1. Las 3 tablas existen en Supabase (corridas a mano por Mario, mismo flujo que Sprint A/C/D).
2. `docs/database/schema.sql` documenta la sección nueva con el mismo estilo que las anteriores.
3. Ningún cambio rompe `pnpm typecheck` ni los tests existentes (esta issue es solo SQL, sin código TypeScript).

## Definición de terminado

- [x] SQL agregado a `schema.sql`
- [ ] SQL corrido en Supabase (a cargo de Mario)
- [ ] Verificado en el Table Editor de Supabase que las 3 tablas y sus índices existen
