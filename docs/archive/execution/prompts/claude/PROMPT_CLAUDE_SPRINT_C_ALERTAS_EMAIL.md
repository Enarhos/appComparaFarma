# Prompt Claude — Sprint C: Alertas de precio por email en `web/`

| Campo | Valor |
|---|---|
| **Sprint** | C |
| **CFPS** | 3.65 (Media) — `docs/product/BACKLOG_PRODUCT.md` |
| **Fecha** | 2026-07-31 |
| **Autor** | CTO (Claude) |

## Rol

Implementar Sprint C siguiendo la metodología congelada (Acta 2026-07-27): este documento es el "prompt" — el paso previo a la implementación, registrado en el repo antes de escribir código (Regla 2, `PRODUCT_DECISION_FRAMEWORK.md`).

## Objetivo

Dar a los usuarios de `web/` una alerta por email cuando el precio de un medicamento baja de un umbral que ellos definen — sin necesitar cuenta (Sprint D, cuenta ligera, sigue en backlog futuro sin implementar).

## Por qué no existe ya

A diferencia de Sprint A (RFC-002 completo y listo) y Sprint E (patrón ya probado en `mobile/cartStore`), Sprint C no tiene precedente de diseño en el repo. Investigación previa (solo lectura) encontró:
- Las alertas de `mobile/` (`alertsStore.ts`) son 100% locales (AsyncStorage) y se evalúan solo cuando el usuario busca ese medicamento ese día — no hay evaluación pasiva ni servidor involucrado. Ese patrón **no es reusable para email** (no hay nada que dispare un check si el usuario no abre la app).
- `/api/price-history` es de solo lectura y depende de que alguien busque el medicamento ese día para tener una fila fresca — no sirve como fuente de verdad para "¿bajó el precio hoy?" de forma confiable.
- Resend ya se usa en `api/src/routes/feedback.ts` (fetch directo a la API REST, sin SDK, dominio sandbox `onboarding@resend.dev`).
- Ya hay dos cron jobs de GitHub Actions en el repo (`monitor-api.yml` cada hora, `update-branches.yml` diario) — mismo mecanismo se reusa aquí, sin introducir Vercel Cron (sin precedente en el proyecto).

## Restricciones duras

1. **No tocar `mobile/`** (Prueba Cerrada de Google Play activa).
2. **No tocar `matchKey`, `mergeDuplicates`, `effectivePrice`** de `packages/domain`.
3. **Sin cuenta de usuario** — el email se captura al crear la alerta, sin login. Gestión de la alerta (cancelar) vía un token en la URL, no vía sesión.
4. **Límite de funciones serverless de Vercel (plan Hobby, 12 máx.)** — hoy hay 8 (`search`, `health`, `branches`, `config`, `donate`, `feedback`, `go`, `price-history`). Este sprint agrega **solo 1** función nueva (`api/api/alerts.ts`, consolidada — ver §Arquitectura), dejando 3 de margen para sprints futuros.
5. **Decisión ya tomada por el CEO**: usar el dominio sandbox de Resend (`onboarding@resend.dev`) por ahora, igual que `feedback.ts` — no se bloquea este sprint por verificación de dominio propio. Documentar como deuda conocida.
6. **No sobre-diseñar**: una alerta se dispara **una sola vez** (estado terminal `triggered`) — no hay re-armado automático ni cooldown configurable. Si el usuario quiere otra alerta, crea una nueva. Confirmación/cancelación son respuestas HTML mínimas devueltas directamente por la API — no se crean páginas nuevas en `web/` para esto en este sprint.

## Arquitectura

### Datos (Supabase, tabla nueva `email_alerts`)

```sql
create table if not exists email_alerts (
  id bigint generated always as identity primary key,
  email text not null,
  match_key text not null,
  canonical_name text not null,
  target_price integer not null,
  status text not null default 'pending', -- 'pending' | 'active' | 'triggered' | 'unsubscribed'
  token text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_checked_at timestamptz,
  triggered_at timestamptz,
  triggered_price integer
);
create unique index if not exists email_alerts_token_idx on email_alerts (token);
create index if not exists email_alerts_active_idx on email_alerts (status) where status = 'active';
alter table email_alerts enable row level security;
```

`token` generado en código (`crypto.randomUUID()`, nativo de Node ≥14.17) al crear la fila — evita depender de una extensión de Postgres. El mismo token sirve para confirmar y para cancelar (es "la capacidad de gestionar esta alerta", no dos secretos distintos).

### Flujo de estados

`pending` (creada, email de confirmación enviado) → `active` (confirmada, clic en el link) → `triggered` (precio bajó del objetivo, email enviado, estado terminal) | `unsubscribed` (usuario canceló, estado terminal en cualquier momento desde `pending` o `active`).

### Endpoint consolidado — `api/api/alerts.ts` (1 sola función nueva)

Delegando a `api/src/routes/alerts.ts` (mismo patrón que el resto de `api/api/*.ts`), que despacha por método + query param `action`:

| Método | Query | Qué hace |
|---|---|---|
| `POST` | (sin `action`) | Crea alerta: valida email/matchKey/canonicalName/targetPrice, rate limit por IP, inserta `status:'pending'`, envía email de confirmación. |
| `GET` | `?action=confirm&token=...` | `pending → active`. Responde HTML mínimo ("Alerta confirmada"). |
| `GET` | `?action=unsubscribe&token=...` | `* → unsubscribed`. Responde HTML mínimo ("Alerta cancelada"). |
| `GET` | `?action=check&secret=...` | Cron only — protegido por `CRON_SECRET` (env var dedicada, **sin fallback abierto** a diferencia de `API_SECRET_KEY`/`isAuthorized`, porque esta ruta puede disparar envío masivo de emails). Recorre alertas `active`, agrupa por `canonicalName` para no re-buscar el mismo medicamento dos veces, llama `searchMedications()` (mismo `searchService` que usa `/api/search`) y compara `bestPrice` del resultado cuyo `matchKey` coincide contra `target_price`. Si bajó: envía email, marca `triggered`. Si no: actualiza `last_checked_at`. |

### Cron — `.github/workflows/check-price-alerts.yml`

Diario (ej. `0 12 * * *`, mismo estilo que `update-branches.yml`), `workflow_dispatch` también disponible. `curl` a `GET /api/alerts?action=check&secret=${{ secrets.CRON_SECRET }}`.

### `web/` — creación de alerta

Nuevo componente `PriceAlertForm` en `/medicamento/[slug]` (junto al precio actual): email + precio objetivo (prefilled a 90% del `bestPrice` actual, mismo default que `AlertSheet.tsx` de `mobile/`), botón "Avisarme". Server Action `web/src/lib/actions/createPriceAlert.ts` hace `POST` a `${API_URL}/api/alerts` (mismo patrón que `web/src/lib/search.ts`). Mensaje inline de éxito/error, sin navegación.

## Validación obligatoria

1. `pnpm typecheck` — 0 errores en los 4 workspaces.
2. `pnpm --filter api test` y tests de `web/` — verdes.
3. Confirmar `git diff --stat -- mobile/ packages/domain/` vacío (packages/domain no debería necesitar cambios en este sprint — todo el estado nuevo vive en Supabase + `api/`).
4. Confirmar que el conteo de funciones serverless de `api/api/*.ts` queda en 9 (no en el límite de 12).

## Entrega final esperada

Resumen de 3-4 líneas, lista de archivos, decisiones no especificadas aquí que se tomen durante la implementación, resultados reales de los comandos de validación, deuda conocida (dominio sandbox de Resend, sin página de confirmación bonita en `web/`, sin dedupe de alertas duplicadas para el mismo email+matchKey), y confirmación explícita de que `mobile/` y el contrato de `/api/search` no cambiaron.
