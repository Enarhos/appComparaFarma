# Prompt Claude — Sprint D: Cuenta ligera + perfil de usuario en `web/`

| Campo | Valor |
|---|---|
| **Sprint** | D |
| **CFPS original** | 2.9 (Backlog futuro) — reabierto a pedido explícito del CEO, 2026-08-02 |
| **Fecha** | 2026-08-02 |
| **Autor** | CTO (Claude) |

## Rol

Implementar Sprint D siguiendo la metodología congelada: este documento es el prompt, registrado antes de escribir código (Regla 2).

## Objetivo

Dar a `web/` un sistema de autenticación real para usuarios finales (distinto del panel `/admin`), con un perfil que tenga un campo `plan: 'free' | 'premium'` — infraestructura para que, cuando se defina qué funcionalidad es paga, se pueda activar con un simple `if (plan === 'premium')`. **Sin cobro real todavía**: el plan se activa a mano desde `/admin`.

## Decisiones ya tomadas por el CEO (2026-08-02)

1. Sin flujo de pago en este sprint — solo auth + flag manual.
2. Login con el mismo mecanismo ya usado en `/admin` (Supabase Auth), método email + contraseña (sin Google OAuth para usuarios finales, a diferencia de `/admin`).
3. **No se restringe ninguna función existente** — la receta completa (Sprint E) y las alertas de precio (Sprint C) siguen 100% gratis. Este sprint es solo la infraestructura.

## Por qué es seguro reusar lo que ya existe

Investigación previa (solo lectura) confirmó que `web/` ya usa el patrón correcto para esto — no hace falta agregar ninguna key nueva:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pública, respeta RLS) ya configurada, usada por `lib/supabase/client.ts` y `server.ts` para sesiones de usuario.
- `SUPABASE_SECRET_KEY` (bypassea RLS) ya usada solo server-side en `lib/supabase/admin.ts`, para el panel `/admin`.
- `proxy.ts` (Next.js 16, antes `middleware.ts`) ya protege `/admin/:path*` comparando contra `ADMIN_ALLOWED_EMAILS` — mismo mecanismo, extendido con un matcher nuevo para `/cuenta/:path*` **sin** allowlist (cualquiera puede tener cuenta).
- No existe hoy ninguna tabla `profiles` ni nada que extienda `auth.users` — hay que crearla.

## Restricciones duras

1. No tocar `mobile/`.
2. No tocar `matchKey`/`mergeDuplicates`/`effectivePrice` de `packages/domain`.
3. No romper el flujo de `/admin` existente (Google OAuth + allowlist) — el callback de auth (`auth/callback/route.ts`) hoy redirige siempre a `/admin`; hay que generalizarlo con un parámetro `next` sin cambiar el comportamiento por defecto para admins.
4. Un usuario **nunca** puede auto-asignarse `premium` — solo escribible server-side con la secret key (sin policy de `UPDATE` para el usuario en `profiles`).

## Arquitectura

### Datos (Supabase, tabla nueva `profiles`)

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null default 'free', -- 'free' | 'premium'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_plan_idx on profiles (plan);
alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
-- Sin policy de UPDATE/INSERT para el rol autenticado normal — el usuario
-- puede LEER su propio plan, nunca escribirlo. Solo admin.ts (secret key,
-- bypassea RLS) puede cambiarlo, desde /admin/usuarios.

create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();
```

### `web/` — auth de usuarios finales

- `app/cuenta/registro/page.tsx` — `supabase.auth.signUp({ email, password, options: { emailRedirectTo: ".../auth/callback?next=/cuenta" } })`. Si Supabase devuelve sesión inmediata (confirmación de email desactivada en el proyecto), redirige a `/cuenta`. Si no devuelve sesión (confirmación pendiente), muestra "revisa tu email para confirmar tu cuenta" — ambos casos posibles según la config del proyecto Supabase, no asumir ninguna.
- `app/cuenta/ingresar/page.tsx` — `signInWithPassword`, mismo patrón que `admin/login/page.tsx` pero sin el botón de Google.
- `app/cuenta/page.tsx` — página protegida: email + plan actual, botón de cerrar sesión.
- `proxy.ts` — nuevo matcher `/cuenta/:path*` (excluyendo `/cuenta/ingresar` y `/cuenta/registro`), gate = "hay sesión" (sin allowlist).
- `app/auth/callback/route.ts` — acepta `?next=`, default `/admin` (compatibilidad con el flujo existente).
- `lib/profile.ts` — `getCurrentProfile()`: lee sesión + su fila en `profiles` (vía el cliente con sesión, respeta RLS).

### `web/` — admin

- `lib/profilesAdmin.ts` — `getProfiles()` / `setProfilePlan(id, plan)`, mismo patrón que `lib/feedbackAdmin.ts` (usa `createAdminClient()`).
- `app/admin/(dashboard)/usuarios/page.tsx` — lista de usuarios + botón para alternar `free`/`premium` (server action + `revalidatePath`, mismo patrón que `admin/feedback/page.tsx`).
- `AdminNav.tsx` — agregar link "Usuarios".

## Validación obligatoria

1. `pnpm typecheck` — 0 errores en los 4 workspaces.
2. Tests de `web/` en verde (incluyendo los nuevos de `profilesAdmin.ts`).
3. `git diff --stat -- mobile/ packages/domain/` vacío.

## Deuda conocida (aceptada explícitamente, coherente con el resto del panel `/admin`)

- Sin tests para `proxy.ts` ni para las páginas de login/registro — mismo nivel de cobertura que el resto de `/admin` hoy (`feedbackAdmin.ts`, `adminAllowlist.ts`, `proxy.ts` tampoco tienen tests).
- Sin recuperación de contraseña ("olvidé mi contraseña") en este sprint — se puede agregar después reusando `resetPasswordForEmail` de Supabase.
- No se sabe si "Confirm email" está activado en el proyecto Supabase real — el código maneja ambos casos, pero solo se puede confirmar el comportamiento real end-to-end en producción.

## Entrega final esperada

Resumen de 3-4 líneas, lista de archivos, decisiones no especificadas acá tomadas durante la implementación, resultados reales de los comandos de validación, deuda conocida, y confirmación explícita de que `mobile/` y `packages/domain/` no cambiaron y que ninguna función existente (Sprint C/E) quedó restringida.
