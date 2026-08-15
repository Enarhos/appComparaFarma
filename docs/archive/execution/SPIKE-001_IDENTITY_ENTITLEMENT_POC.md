# SPIKE-001 — Identity & Entitlement Proof of Concept

## Objetivo

Validar, con evidencia real (no con lectura de código ni con supuestos), que Mobile y Web reconocerían exactamente la misma Cuenta ComparaFarma a través del mismo sistema de Identidad, y obtendrían los mismos Entitlements desde los Servicios de Plataforma. Cadena validada:

```
Usuario → Supabase Auth → Cuenta ComparaFarma → Identity (GET /auth/v1/user)
        → Entitlement (GET /api/subscriptions?action=me) → Servicios de Plataforma → Cliente Mobile
```

Este Spike no implementa la Épica 1. No modifica arquitectura. Todo el código usado es descartable y vive fuera del repo versionado.

## Pre-auditoría (documentos revisados)

- `docs/execution/EPIC-01-IDENTITY_FOUNDATION.md`
- `docs/architecture/IDENTITY_INTEGRATION_PLAN.md`
- `docs/domain/USER_DOMAIN_MODEL.md`

Ningún documento fue modificado.

## Restricción real de entorno encontrada

El entorno de ejecución de esta sesión (sandbox de Claude) no tiene salida de red hacia `supabase.co` ni `vercel.app` (solo tiene permitido el registro de npm), y la herramienta de fetch web disponible no soporta cabeceras `Authorization` ni `POST`. Por lo tanto, el PoC no se ejecutó dentro del sandbox: se ejecutó como script Node standalone (`tmp-spike-001/poc.mjs`, sin dependencias, usando `fetch` nativo) directamente en la máquina del usuario, contra los endpoints reales de producción. Esto no es una limitación de la arquitectura de ComparaFarma — es una restricción del entorno de esta sesión de trabajo, y se documenta aquí porque cualquier ejecución futura similar (CI, otro sandbox) debe considerar egress de red hacia Supabase y Vercel.

## Mecanismo de autenticación usado

La única cuenta de prueba identificada, `mario.lillo@gmail.com`, se autentica en producción vía Google OAuth y no tiene password — ese flujo requiere consentimiento interactivo en navegador, que no se puede completar de forma headless y que, por política, no se debía intentar completar en nombre del usuario.

En su lugar, se usó el flujo de "recuperar contraseña" de Supabase Dashboard, que emitió un link de recovery (`type=recovery`, `amr: [{method: "otp"}]`) con `access_token`/`refresh_token` válidos para la misma Cuenta. Esto no es el flujo interactivo de "Iniciar sesión con Google" que Mobile usará en producción, pero permite validar la misma cadena de resolución de identidad (Supabase Auth → `user_id`) sin necesitar ese flujo. Se documenta explícitamente como diferencia frente al mecanismo real de producción — ver Riesgos.

## Evidencia real por paso

### Paso 1+2 — Autenticación y extracción de sesión

`GET https://xzdtpypctyntkgmoceum.supabase.co/auth/v1/user` con headers `apikey` (publishable key) + `Authorization: Bearer <access_token>`.

- HTTP 200
- `user.id`: `277e42b0-6f87-4654-9196-aeb33906199f`
- `user.email`: `mario.lillo@gmail.com`
- `user.app_metadata.provider`: `google`
- `user.is_anonymous`: `false`

Session, Access Token, Refresh Token y User ID quedaron disponibles y verificados.

### Paso 3 — Endpoint real de identidad

El mismo llamado anterior es el mecanismo real que consume `web/` (indirectamente, vía `@supabase/ssr`) para resolver la identidad de una sesión. Resultado: el mismo `user_id` que resolvería Web para esta cuenta. No hubo necesidad de asumir el nombre de un endpoint — es el endpoint real de Supabase Auth.

### Paso 3b + 4 — Endpoint real de entitlement

`GET https://comparafarma-api.vercel.app/api/subscriptions?action=me` con header `Authorization: Bearer <access_token>` (sin cookies, sin ningún otro header).

- HTTP 200
- Body real: `{"active":false,"planId":null,"benefits":[],"expiresAt":null}`

Formato real documentado (no asumido):

| Campo | Tipo observado | Valor observado | Lectura |
|---|---|---|---|
| `active` | boolean | `false` | si la Cuenta tiene un entitlement vigente |
| `planId` | string \| null | `null` | identificador del plan activo |
| `benefits` | array | `[]` | lista de beneficios/capacidades otorgadas |
| `expiresAt` | string \| null | `null` | fecha de expiración del entitlement (ISO), si aplica |

Confirmado: es exactamente el mismo mecanismo (`Authorization: Bearer`, sin cookies) que ya usa `web/src/lib/profile.ts`. `resolveUser()` en `api/src/routes/subscriptions.ts` no distingue entre un llamador Web o Mobile — solo verifica el header.

### Paso 5 — ¿Puede Mobile decidir su comportamiento solo con esta respuesta?

Sí, el contrato (`active` / `planId` / `benefits` / `expiresAt`) es suficiente para que un cliente condicione toda su UI (mostrar u ocultar funciones premium, aplicar límites, mostrar fecha de vencimiento) sin inspeccionar directamente el estado de Google Play Billing ni de Flow.

Matiz real encontrado (no especulativo, ya señalado en `EPIC-01-IDENTITY_FOUNDATION.md`): hoy no existe código en `mobile/` que llame a este endpoint, y `action=verify-purchase` — el que traduce una compra real de Billing/Flow hacia este entitlement — no tiene ningún consumidor real todavía. Este Paso 5 valida que el contrato de lectura ya es apto para decidir capacidades; no valida que el circuito de escritura (compra → entitlement) esté probado de punta a punta.

### Paso 6 — Logout

| Sub-paso | Acción | Resultado real |
|---|---|---|
| 6a | `POST /auth/v1/logout?scope=global` | HTTP 204 — sesión revocada |
| 6b | `POST /auth/v1/token?grant_type=refresh_token` con el mismo `refresh_token`, tras 6a | HTTP 400 `refresh_token_not_found` |
| 6c | `GET /auth/v1/user` con el MISMO `access_token` ya usado, tras 6a | HTTP 403 `session_not_found`: *"Session from session_id claim in JWT does not exist"* |
| 6d | `GET /api/subscriptions?action=me` con el MISMO `access_token`, tras 6a | HTTP 401 `"No autorizado."` |

Hallazgo relevante: Supabase Auth no se comporta como un JWT puramente stateless (válido hasta su expiración natural sin importar logout) — invalida la sesión de inmediato verificando el `session_id` contra su propio store, no solo la firma/expiración del token. Esto se propaga en cascada a Servicios de Plataforma, porque `resolveUser()` depende de `supabase.auth.getUser(token)`: el logout es efectivo de inmediato tanto para Identity como para Entitlement, sin necesidad de lógica adicional en `api/`.

## Análisis

1. **¿Se pudo autenticar la Cuenta ComparaFarma con un mecanismo real (no simulado)?** Sí — vía recovery link real de Supabase, para la cuenta real `mario.lillo@gmail.com`.
2. **¿Se obtuvieron Session, Access Token, Refresh Token y User ID?** Sí, los cuatro.
3. **¿El endpoint de identidad resuelve al mismo Usuario que resolvería Web?** Sí — mismo `user_id`, mismo email, mismo `provider`. No se asumió el nombre del endpoint; es el real de Supabase Auth.
4. **¿El endpoint de identidad depende de cookies?** No — solo del header `Authorization`. Confirmado en la llamada real, consistente con el hallazgo de `EPIC-01`.
5. **¿El endpoint de entitlement devuelve el mismo formato sin distinguir Mobile de Web?** Sí — `resolveUser()` solo lee el header; no hay lógica distinta por cliente.
6. **¿Ese formato basta para que Mobile decida comportamiento sin lógica adicional?** Sí, con el matiz del Paso 5 (el circuito de escritura vía Billing/Flow aún no tiene consumidor real).
7. **¿Google Play Billing determina directamente las capacidades disponibles en esta cadena?** No. Google solo participa como proveedor de autenticación (`app_metadata.provider: "google"`); la respuesta de entitlement (`active`, `planId`, `benefits`, `expiresAt`) no proviene de Billing en este PoC ni depende de él para ser consultada.
8. **¿Flow determina directamente las capacidades?** No. Flow no participó en ningún llamado de este PoC; el estado observado (`active: false`) es el estado real de la Cuenta en la base de datos de Plataforma, no una consulta en vivo a Flow.
9. **¿Los Servicios de Plataforma siguen siendo la única fuente de verdad, incluso tras logout?** Sí — evidenciado en el Paso 6d: el mismo token que antes del logout devolvía `200` con el entitlement, después del logout devuelve `401` de inmediato, sin que `api/` necesite ninguna lógica propia de invalidación (hereda la invalidación de Supabase Auth).

## Riesgos (reales, encontrados en esta ejecución)

1. El mecanismo de autenticación usado en este PoC (recovery/OTP) no es el flujo de producción de Mobile (Google Sign In interactivo). La convergencia de identidad se validó a nivel de "mismo `user_id` resuelto por Supabase Auth para la misma Cuenta", pero el flujo interactivo real de Google OAuth en un cliente Mobile no se ejecutó en este Spike.
2. `action=verify-purchase` (el puente entre una compra real de Google Play Billing/Flow y el entitlement) no tiene hoy ningún consumidor Mobile, según ya estaba registrado en `EPIC-01-IDENTITY_FOUNDATION.md`. Este Spike confirma que el lado de lectura (`action=me`) funciona igual para cualquier cliente, pero no ejercita el lado de escritura.
3. El link de recovery de Supabase redirige a la URL raíz de `web/` con los tokens en el fragmento de la URL (`#access_token=...`) sin que exista una página que lo intercepte. No es un riesgo de la arquitectura de Identity/Entitlement en sí, pero es un gap real de UX/seguridad en el flujo de "olvidé mi contraseña" de `web/` — los tokens quedan visibles en la barra de direcciones y en el historial del navegador.
4. Las credenciales usadas en este PoC (access/refresh token del recovery, publishable key, y una secret key compartida antes en el chat) quedaron expuestas en el transcript de esta conversación. La sesión ya fue revocada en el Paso 6a, pero se recomienda rotar la secret key de Supabase por buena práctica, dado que fue expuesta.

## Recomendación

☑ **Continuar inmediatamente con Identity Foundation**
☐ Detener hasta resolver riesgos

**Justificación:** la evidencia real confirma, sin ambigüedad, las tres afirmaciones centrales de la arquitectura aprobada: (a) la Cuenta ComparaFarma es resuelta de forma idéntica por Supabase Auth sin importar el mecanismo de entrada; (b) los Servicios de Plataforma autorizan exclusivamente por header `Authorization`, sin diferenciar Mobile de Web y sin depender de cookies; (c) el logout se propaga de inmediato desde Identity hacia Entitlement sin lógica adicional en `api/`. Los riesgos encontrados (1 y 2) ya están dentro del alcance conocido y acotado de las Tareas de `EPIC-01` (en particular la Tarea de registro/login con Google y la integración real con Billing/Flow) — no son hallazgos nuevos que obliguen a rediseñar la arquitectura, son trabajo de implementación ya identificado. Los riesgos 3 y 4 son operacionales/de higiene, no arquitectónicos.

## Validación Final

- **Documentos utilizados (pre-auditoría):** `EPIC-01-IDENTITY_FOUNDATION.md`, `IDENTITY_INTEGRATION_PLAN.md`, `USER_DOMAIN_MODEL.md`. Ninguno fue modificado.
- **Código revisado:** ninguno nuevo — se reutilizó el inventario ya hecho en `EPIC-01-IDENTITY_FOUNDATION.md` (`web/src/lib/profile.ts`, `api/src/routes/subscriptions.ts`, `api/src/lib/http.ts`).
- **Código/infraestructura tocada:** ninguna. Todo el código de este Spike (`tmp-spike-001/poc.mjs`, `.env.local`) es descartable, vive fuera del control de versiones y debe eliminarse tras esta revisión.
- **Documento creado:** `docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md` (este documento).
- **Arquitectura:** no se modificó `USER_DOMAIN_MODEL.md`, `IDENTITY_INTEGRATION_PLAN.md` ni `PLATFORM_CAPABILITY_MODEL.md`.

---

Detenerse al finalizar. Esperar aprobación explícita antes de comenzar la implementación de la Épica 1.
