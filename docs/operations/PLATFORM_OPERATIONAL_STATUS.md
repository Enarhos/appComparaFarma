# Estado Operacional de la Plataforma — ComparaFarma

**Código:** OPS-STATUS-001

**Fecha de cierre:** 2026-08-15

**Propósito:** fuente única y consolidada del estado operacional de todos los servicios externos de ComparaFarma (excepto las 9 integraciones de farmacias, fuera de alcance). Reemplaza la necesidad de leer las 12 revisiones individuales (`PLATFORM_SERVICE_REVIEW_*.md`) para tener una vista de conjunto — esas revisiones siguen vigentes como el detalle de evidencia por servicio, este documento es el resumen ejecutivo y el punto de entrada.

**Propietario:** CTO

**Nivel de Gobierno:** De decisión operativa

**Método:** sprint de cierre operacional — se consolidaron los hallazgos ya documentados en `docs/operations/PLATFORM_SERVICE_REVIEW_*.md` (OPS-REV-001 a OPS-REV-012) y se validó cada uno contra el código/configuración real al 2026-08-15, en vez de re-auditar desde cero. Donde el código ya resolvía un hallazgo, se cierra aquí explícitamente; donde no, se deja como acción o decisión pendiente con pasos concretos.

---

## Tabla consolidada

| Servicio | Plan | Uso | Estado | Riesgo | Acción pendiente | Owner |
|---|---|---|---|---|---|---|
| Supabase | Free | Postgres (11 tablas) + Auth (Web/Mobile/Admin) | `HUMAN_ACTION_REQUIRED` | 🔴 Alto — 2 emails/hora del servicio de email integrado bloquea recuperación de contraseña bajo uso simultáneo | Conectar SMTP propio (Resend, dominio `lospanalesdeamelia.cl`, ya verificado) en el Dashboard de Supabase | CTO |
| Resend | Free (3.000 emails/mes) | Alertas de precio + feedback | `OK` | 🟡 Medio — cupo de dominios verificados agotado (1/1), sin margen para una transición futura de dominio | Ninguna inmediata — reemplazar el dominio interino cuando se defina el definitivo del proyecto | CTO |
| Algolia (cuenta de Salcobrand, no propia) | No aplica | Índice de búsqueda de Salcobrand, consumido por `salcobrand.ts` | `OK` | 🟡 Medio — rotación de credenciales fuera del control de ComparaFarma | Ninguna — aislado por `Promise.allSettled`, sin fallback hardcodeado en código | — |
| Expo / EAS | Free | Build local preferido + EAS Update (OTA) | `MONITOR` | 🟡 Medio — techo de 1.000 MAU para OTA (el más bajo del inventario), hoy 1 MAU real | Monitorear MAU antes de cualquier campaña de adquisición de usuarios | CTO |
| Vercel (`comparafarma-api` + `comparafarma-web`) | Hobby (ambos proyectos) | Hosting serverless (backend) + Next.js (web) | `HUMAN_ACTION_REQUIRED` | 🔴 Alto — uso comercial (donaciones) activo en un plan que lo prohíbe explícitamente; agravado por Premium en desarrollo | Upgrade a Vercel Pro antes de operar Premium comercialmente | CTO |
| GitHub (repo + Actions + Pages) | Free, público | Código fuente, CI/CD, hosting de política de privacidad | `HUMAN_DECISION_REQUIRED` | 🟡 Medio — exposición pública de la lógica de scraping/matching de las 9 farmacias | Decidir si el repositorio permanece público o se privatiza | CTO |
| MINSAL (fuente pública, no es cuenta propia) | No aplica | Farmacias de turno por comuna, consumido en filtro de Mobile | `MONITOR` | 🟠 Medio-alto — bloqueo HTTP 403 activo contra Vercel y GitHub Actions desde 2026-06-03; dato congelado en snapshot del 2026-06-08 | Decidir estrategia de acceso (IP residencial/self-hosted vs. aceptar snapshot manual periódico) | CTO |
| Google Play Console + Billing/RTDN | Cuenta developer (USD 25, pago único) | Distribución de Mobile + RTDN de suscripciones (Fase 1) | `MONITOR` (hallazgo de `DonationBanner` resuelto en Mobile, ver actualización 2026-08-15 abajo) | 🟢 Bajo — donaciones retiradas del flujo visible de Mobile; keystore reclasificado, ya no crítico | Confirmar backup del upload key | CTO |
| Sentry (api + mobile) | Developer/Free | Reporte de excepciones no controladas | `OK` | 🟢 Bajo — sin PII en el contexto enviado (solo `requestId`/`route`), no-op explícito sin DSN | Ninguna | — |
| PostHog | Free | Analítica de búsqueda (evento único `medication_search`) | `OK` | 🟢 Bajo — sin PII directa capturada (no email, no user id); el texto de búsqueda podría ser sensible por naturaleza, no por diseño del evento | Investigar el toast de error de PostHog observado en Mobile en una sesión previa (menor, no bloqueante) | — |
| Khipu | Comisión por transacción (~0,69%+IVA, no confirmado en página oficial) | Donaciones (link estático en Mobile, deshabilitado) + `/api/donate` migrado a Instant Payments API 3.0 (sin uso real hoy, sin CTA Web) | `HUMAN_ACTION_REQUIRED` | 🟡 Medio — código migrado a API 3.0 (`x-api-key`, sin HMAC); credenciales API 2.0 conservadas como `LEGACY_ROLLBACK_ONLY` sin rotar; webhook pendiente por secreto de firma no confirmado | Crear `KHIPU_API_KEY` en el panel de Khipu y configurarla en Vercel (procedimiento y prueba de validación detallados abajo) | CTO |
| Upstash Redis | Free | Caché de búsqueda + rate limiting distribuido | `OK` | 🟢 Bajo — fallback a memoria verificado línea por línea, nunca bloquea funcionalidad | Monitorear consumo de comandos/mes antes de crecer | — |
| Flow | Sandbox/Producción (no activo) | Motor de suscripciones premium recurrentes, código completo, sin credenciales configuradas | `MONITOR` (pausado por decisión de negocio, 2026-08-14) | 🟢 Bajo — degrada explícitamente (503 / `skipped`) sin configurar, sin impacto en producción | Activar solo junto con el lanzamiento comercial de Premium — coordinar con el upgrade de Vercel | CTO |
| Repositorio Git (estado de la copia de trabajo) | No aplica | Control de versiones del monorepo | `BLOCKED` | 🔴 Alto — operacional, no de producto (ver sección dedicada) | Resolver el cherry-pick en curso en `hotfix/mobile-validation`; commitear la documentación de este sprint | CTO |
| Farmacias (9 integraciones: Cruz Verde, Salcobrand, Ahumada, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma) | — | Scraping/APIs de cada farmacia | `OUT_OF_SCOPE` | — | Revisión independiente futura, explícitamente fuera de este sprint | — |

Estados usados: `OK` · `MONITOR` · `HUMAN_ACTION_REQUIRED` · `HUMAN_DECISION_REQUIRED` · `POLICY_REVIEW_REQUIRED` · `BLOCKED` · `OUT_OF_SCOPE`.

---

## Bloqueantes de producción

Solo problemas que realmente impiden o hacen insegura la operación hoy:

1. **Ninguno de los hallazgos de servicios externos impide que la búsqueda de medicamentos funcione hoy.** Todos los servicios con degradación posible (Upstash, Sentry, Supabase, Resend, Khipu, Flow) tienen fallback verificado en código — ninguno tumba `api/`/`web`/`mobile`.
2. **El estado del repositorio Git sí es un bloqueante operacional (no de producto).** La copia de trabajo está en medio de un `git cherry-pick` sin resolver en la rama `hotfix/mobile-validation` (no en `main`), con 7 archivos modificados sin commitear y una cola de cherry-pick pendiente (`.git/sequencer/todo`). Mientras esto no se resuelva, cualquier trabajo nuevo en esa misma copia de trabajo (incluida la documentación de este sprint) corre el riesgo de mezclarse con una operación de git a medio terminar. Ver detalle en la sección siguiente — **no se tocó el estado de git durante este sprint**, por disciplina de no ejecutar acciones irreversibles sin autorización.
3. **Vercel Hobby con uso comercial activo (§ tabla) es, en términos de política de plataforma, el bloqueante de mayor severidad real** — no técnico, pero con riesgo de pausa de cuenta sin aviso garantizado que tumbaría `api` y `web` simultáneamente.

---

## Hallazgo crítico: estado de la rama de trabajo Git

Este hallazgo no estaba en el alcance original del sprint (no es un "servicio externo"), pero se encontró durante la verificación de código real contra la documentación y es demasiado importante para omitir.

**Qué se encontró:** la copia de trabajo del repositorio (la misma que este sprint usó para leer y editar archivos) tiene la rama `hotfix/mobile-validation` activa, con un `git cherry-pick` sin terminar:

- `CHERRY_PICK_HEAD` apunta a un commit (`33902c2`) que ya existe, con el mismo contenido, en `origin/main` bajo otro hash (`127d66a`).
- La cola de cherry-pick pendiente (`.git/sequencer/todo`) todavía lista 2 commits más por aplicar (`058d226`, `17d6046`) — ambos también ya presentes en `origin/main` con hashes distintos (`543530f`, y el equivalente de recuperación de contraseña).
- 7 archivos tienen cambios sin commitear: `.github/workflows/check-price-alerts.yml`, `.github/workflows/update-branches.yml` (sin diferencia real), `CLAUDE.md`, `api/.gitignore`, `web/.gitignore`, `mobile/src/lib/sessionManager.ts`, `docs/release/SERVICE_ACCOUNT_MIGRATION.md`.

**Verificación de que no hay pérdida de trabajo de producción:** se comparó cada uno de los 7 archivos modificados contra `origin/main` (lo que realmente se despliega):

- `mobile/src/lib/sessionManager.ts`: el diff son únicamente `console.log` de diagnóstico, con un comentario propio que dice explícitamente **"sacar antes de mergear"** — no debe commitearse, es descartable sin pérdida.
- `api/.gitignore` / `web/.gitignore`: agregan `.vercel`/`.env*`, ya cubierto por el `.gitignore` raíz — redundante, de bajo valor.
- `docs/release/SERVICE_ACCOUNT_MIGRATION.md`: una sola línea de trazabilidad hacia `PLATFORM_SERVICE_CATALOG.md` — fácil de rehacer.
- `CLAUDE.md`: contiene documentación redactada en una sesión anterior de este mismo trabajo (advertencia de MINSAL, advertencia de Vercel Hobby, corrección de `versionCode`) que **nunca se commiteó** — el archivo en disco (el que este sprint leyó y usó como fuente de verdad) tiene contenido correcto y más actualizado que `origin/main`.
- **`.github/workflows/check-price-alerts.yml` es el único con contenido de valor real y no replicado en ningún otro lado:** agrega `permissions: { contents: read, issues: write }` y un `id` al step de disparo. Esto es la pieza que falta para que el mecanismo de "crear un issue si falla" (que `RUNBOOK.md` §6 y `CLAUDE.md` ya describen como "ya corregido") funcione de verdad — **confirmado que `origin/main` NO tiene el mecanismo de alerta de este workflow en absoluto** (solo tiene el paso de `curl`, sin `continue-on-error`, sin creación de issue, sin bloque `permissions`). La documentación existente sobreestima el estado real de este workflow específico.

**Por qué no se tocó:** resolver un cherry-pick en curso (continuar o abortar) es una operación de git con potencial de pérdida de trabajo si se hace sin que el dueño del repositorio confirme que entiende el estado — por disciplina de este sprint ("cuando exista una acción irreversible... deténte y márcalo como acción humana"), no se ejecutó ningún `git cherry-pick --continue`/`--abort`/`--skip`, ni `git checkout`, ni commit alguno.

**Acción recomendada (ver detalle en "Acciones humanas" más abajo):** `HUMAN_ACTION_REQUIRED: RESOLVE_GIT_WORKING_TREE`.

---

## Análisis del `DonationBanner` (`POLICY_REVIEW_REQUIRED`)

Análisis solicitado explícitamente antes de considerar cualquier cambio a este componente — **no se modificó ni eliminó código**.

| Aspecto | Detalle |
|---|---|
| Texto exacto mostrado | Título: `"¿Te ayudamos a ahorrar {monto}?"`. Cuerpo: `"ComparaFarma es gratuita y sin publicidad. Si te fue útil, apoya el proyecto con un aporte voluntario vía Khipu."` |
| CTA | 4 botones: 3 montos fijos ($1.000 / $3.000 / $5.000) + "Otro monto". Además, "No mostrar por ahora" (descarta el banner por `dismissDays`, sin relación con pagar). |
| URL/destino | 4 links estáticos pre-generados en el dashboard de Khipu (`khipu.com/payment/process/{id}`), hardcodeados en `mobile/src/constants/donation.ts`, abiertos vía `Linking.openURL()` — **sin backend involucrado**, `/api/donate` no participa en este flujo. |
| Flujo Khipu | El usuario sale de la app a una página de Khipu (fuera de control de ComparaFarma) para completar la transferencia. ComparaFarma no recibe ninguna confirmación ni callback de este flujo estático — no hay webhook, no hay registro en Supabase de la donación. |
| Quién recibe el dinero | La cuenta personal de Khipu del cobrador `520175`, "Mario Lillo Alfaro" — no una entidad LET. |
| Qué ocurre después del pago | Nada dentro de la app. El usuario simplemente vuelve (o no) a ComparaFarma; el banner no cambia de estado, no se marca como "ya donaste". |
| ¿Beneficio o funcionalidad digital? | **Ninguno.** No desbloquea funciones, no cambia el plan/entitlement de la cuenta (el sistema de entitlements de Mobile ni siquiera se consulta en este flujo), no elimina publicidad (la app ya no tiene publicidad, con o sin donación), no otorga badges ni reconocimiento visible. |
| ¿Cambia alguna capacidad de la cuenta? | No — el aporte es completamente independiente del sistema de autenticación/entitlements (`entitlements.ts`/`entitlementAdapter.ts`), que solo lee el estado de Premium vía Flow/Google Play Billing, nunca vía Khipu. |

**Conclusión de este análisis:** el aporte es, con la evidencia del código, un aporte voluntario puro sin contraprestación digital de ningún tipo — el patrón que la Política de Pagos de Google Play (`answer/9858738`) señala como posible excepción es "tax exempt donations", pero no hay evidencia en el repositorio de que ComparaFarma (o el cobrador personal que recibe los fondos) tenga un estatus de exención tributaria formal. Por eso este hallazgo se registró originalmente como `POLICY_REVIEW_REQUIRED` y no se resolvió tocando código: faltaba una confirmación legal/tributaria que no puede obtenerse desde el repositorio.

> **Actualización (2026-08-15):** el CTO tomó la decisión de producto de retirar temporalmente las donaciones de Mobile durante la etapa inicial de adquisición de usuarios, en vez de resolver la pregunta de exención tributaria ahora. Implementado en la rama `mobile/disable-donations-temporarily`: se retiró el único punto de render de `DonationBanner` (`mobile/src/app/medication.tsx`), sin eliminar el componente (`mobile/src/components/DonationBanner.tsx`), sus constantes (`mobile/src/constants/donation.ts`) ni su lógica de gating (`mobile/src/lib/donationGate.ts`) — quedan intactos y sin caller, listos para una futura reactivación. **Las donaciones en Mobile están temporalmente deshabilitadas por decisión de producto durante la etapa inicial de adquisición de usuarios. Las donaciones Web permanecen habilitadas mediante Khipu, sin cambios** (`git diff` de esta rama contra `web/`, `api/` y `packages/domain/` está vacío). El hallazgo de Google Play (§ tabla) baja de `POLICY_REVIEW_REQUIRED` a `MONITOR` para Mobile; la pregunta de exención tributaria queda abierta solo para cuando se reevalúe reactivar donaciones en Mobile o si se decide resolverla para Web/Vercel de todos modos.

## Premium y pagos Android (`GOOGLE_PLAY_BILLING_REVIEW_REQUIRED` — preventivo, sin hallazgo activo)

Se revisó específicamente si existe código en Mobile que permita comprar Premium desde Android usando un procesador de pago externo (Flow o Khipu):

- `mobile/src/lib/entitlements.ts` y `entitlementAdapter.ts` son **de solo lectura** — consultan `GET /api/subscriptions?action=me` únicamente para mostrar el plan actual ("Premium"/"Gratis"), con un comentario explícito en el propio código: *"Ningún proveedor (Google Play Billing, Flow) se consulta directo desde Mobile — no aplica aún"*.
- No existe, en todo `mobile/src`, ninguna pantalla de "comprar"/"actualizar a Premium" ni ninguna llamada a Flow o Khipu para procesar un pago de suscripción.
- El único flujo de compra de Premium implementado hoy (`web/src/components/cuenta/UpgradeButton.tsx` + `startFlowSubscription.ts`) vive en **`web/`**, no en Mobile — no está sujeto a la Política de Pagos de Google Play porque no se distribuye a través de Google Play.

**Conclusión:** no hay ninguna violación activa hoy — no hay código que remover ni marcar. Se registra `GOOGLE_PLAY_BILLING_REVIEW_REQUIRED` como una guía preventiva para cuando se implemente la compra de Premium *dentro* de Mobile: esa implementación deberá usar Google Play Billing, nunca Flow/Khipu directamente desde la app Android — esta es la definición comercial pendiente mencionada en la sección de Decisiones futuras.

---

## Acciones humanas

### 1. `HUMAN_ACTION_REQUIRED: RESOLVE_GIT_WORKING_TREE`

1. **Servicio:** Repositorio Git (no es un servicio externo, es el propio control de versiones)
2. **Consola:** Terminal local, en la copia de trabajo del repositorio
3. **Ruta:** rama `hotfix/mobile-validation`, `git status` mostrará "Cherry-pick currently in progress"
4. **Cambio requerido:** decidir `git cherry-pick --abort` (recomendado, dado que se verificó que los commits de valor de esta rama ya están replicados en `origin/main` con otros hashes) o completar el cherry-pick si se prefiere conservar el historial de esta rama en particular. Después, aplicar limpiamente sobre `main` el único cambio con valor real no replicado: el bloque `permissions` + `id` de `.github/workflows/check-price-alerts.yml` (detalle en la sección anterior). Además, commitear la documentación de este sprint (`docs/operations/*.md`, `CLAUDE.md`) sobre `main` (o la rama de trabajo que corresponda).
5. **Variables afectadas:** ninguna
6. **Cómo validar:** `git status` limpio (sin cherry-pick en curso); `git diff origin/main -- .github/workflows/check-price-alerts.yml` sin diferencias tras aplicar el fix; confirmar que la próxima ejecución fallida de `check-price-alerts.yml` efectivamente crea un issue (se puede simular apuntando `CRON_SECRET` a un valor incorrecto una vez, con cuidado de no dejarlo así).
7. **Riesgo de hacerlo:** bajo, ya verificado — ningún archivo modificado sin commitear contiene trabajo único no explicado (ver detalle arriba).
8. **Rollback:** no aplica — un `cherry-pick --abort` es en sí mismo reversible en el sentido de que no borra ningún commit ya existente en el repositorio, solo descarta cambios no commiteados de esa operación puntual.

### 2. `HUMAN_ACTION_REQUIRED: UPGRADE_VERCEL_PRO`

1. **Servicio:** Vercel (`comparafarma-api` y `comparafarma-web`)
2. **Consola:** vercel.com → Dashboard
3. **Ruta:** Team Settings → Billing → Plan
4. **Cambio requerido:** upgrade de Hobby a Pro (USD 20/mes por seat, 1 seat cubre la operación actual)
5. **Variables afectadas:** ninguna
6. **Cómo validar:** Settings → Billing muestra plan "Pro"; opcionalmente, confirmar que el límite de 12 funciones por deployment ya no aplica
7. **Riesgo de hacerlo:** cargo recurrente de USD 20/mes
8. **Rollback:** downgrade a Hobby disponible en cualquier momento desde el mismo panel — de hacerlo, habría que volver a resolver el hallazgo de uso comercial (DonationBanner/Premium) de otra forma

### 3. `HUMAN_ACTION_REQUIRED: ROTATE_KHIPU_CREDENTIALS` (actualizado 2026-08-15 — migración a API 3.0 en curso)

**Cambio de contexto:** `api/src/clients/khipu.ts`/`api/src/routes/donate.ts` migraron de Khipu API 2.0 a Instant Payments API 3.0 (ver `PLATFORM_SERVICE_REVIEW_KHIPU.md` §5ter). El código nuevo usa `KHIPU_API_KEY` (autenticación por header `x-api-key`) y ya **no** usa `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` ni la firma HMAC — esas quedan como `LEGACY_ROLLBACK_ONLY`. Esto significa que la acción humana pendiente cambió de forma: ya no es "rotar la clave vieja" sino **"crear la clave nueva y configurarla"**; la clave vieja se conserva sin rotar, solo por si hace falta revertir.

1. **Servicio:** Khipu
2. **Consola:** khipu.com → sesión del cobrador `520175` ("Mario Lillo Alfaro") → "Opciones de la cuenta de cobro"
3. **Ruta:** "Para integrar Khipu a tu sitio web" → sección "API Keys" → botón "Nueva API Key"
4. **Cambio requerido:**
   1. Presionar "Nueva API Key". Opcionalmente, ingresar el alias **"ComparaFarma Production"** para identificarla.
   2. Copiar el valor mostrado de inmediato — Khipu solo lo muestra completo una vez, en el momento de creación.
   3. Guardar ese valor en Vercel → proyecto `comparafarma-api` → Settings → Environment Variables → `KHIPU_API_KEY` (Production **y** Preview).
   4. Forzar un redeploy de `comparafarma-api` desde el dashboard de Vercel.
   5. Ejecutar la prueba de validación de abajo — objetivo: confirmar `payment_url`, **sin completar un pago real**.
   6. **No expirar todavía** las credenciales `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` de API 2.0 — quedan como `LEGACY_ROLLBACK_ONLY`, se conservan mientras no se confirme que la API 3.0 es estable en producción (acción separada y posterior, no parte de este cierre).
5. **Servicios que requieren la credencial nueva (`KHIPU_API_KEY`):**

   | Servicio | ¿Necesita `KHIPU_API_KEY`? | `NEEDS_UPDATE` |
   |---|---|---|
   | Vercel `comparafarma-api` (Production + Preview) | Sí — única variable de entorno que usa el flujo nuevo (`api/src/clients/khipu.ts`) | **YES** |
   | GitHub Actions | No — ningún workflow referencia `KHIPU_*` | NO |
   | Web | No — cero referencias a Khipu en `web/src` todavía (sin CTA propio) | NO |
   | Mobile | No — el `DonationBanner` (deshabilitado hoy) usa links estáticos, no `/api/donate` ni ninguna credencial de Khipu | NO |
   | Supabase | No — sin referencias a Khipu en el schema ni en código de datos | NO |

6. **Cómo validar (sin completar un pago real):**

   ```bash
   curl -s -o /tmp/donate_test.json -w 'HTTP %{http_code}\n' \
     -X POST https://comparafarma-api.vercel.app/api/donate \
     -H "Content-Type: application/json" \
     -d '{"amount":1000}'
   cat /tmp/donate_test.json
   ```

   Éxito: `HTTP 200` y `{"payment_url":"https://khipu.com/payment/..."}`. **No abrir esa URL ni completar el pago.** Si `KHIPU_API_KEY` falta o es inválida, la respuesta es `500 {"error":"No se pudo crear el pago."}` sin detalle adicional — por diseño, para no filtrar nada de la clave ni de la respuesta de Khipu.

7. **Riesgo de hacerlo:** bajo — `/api/donate` sigue sin ningún llamador real en producción (Mobile deshabilitado, Web sin CTA), así que un error de configuración no afecta a ningún usuario real.
8. **Rollback:** revertir el import en `api/src/routes/donate.ts` de `createKhipuPaymentV3` a `createKhipuPaymentLegacyV2` (ver `PLATFORM_SERVICE_REVIEW_KHIPU.md` §5ter) — posible porque `KHIPU_RECEIVER_ID`/`KHIPU_SECRET` se conservaron sin expirar.

### 4. `HUMAN_ACTION_REQUIRED: CONFIGURE_SUPABASE_SMTP`

1. **Servicio:** Supabase Auth
2. **Consola:** supabase.com → Dashboard del proyecto (`xzdtpypctyntkgmoceum`)
3. **Ruta:** Project Settings → Authentication → SMTP Settings
4. **Cambio requerido:** conectar SMTP propio usando Resend como proveedor, con el dominio ya verificado `lospanalesdeamelia.cl` (mismo dominio ya usado como remitente en `email.ts`/`feedback.ts`) — sube el límite de 2 a 30 emails/hora
5. **Variables afectadas:** ninguna en Vercel — la configuración vive enteramente en el Dashboard de Supabase (host SMTP de Resend, puerto, usuario, la API Key de Resend como contraseña SMTP)
6. **Cómo validar:** disparar 3+ recuperaciones de contraseña seguidas desde Web/Mobile y confirmar que todas llegan (hoy, pasado el límite de 2/hora, fallarían silenciosamente)
7. **Riesgo de hacerlo:** bajo — es agregar un proveedor de envío sobre el existente, Supabase valida la configuración SMTP antes de aplicarla
8. **Rollback:** desactivar el SMTP custom en el Dashboard — vuelve al servicio de email integrado (límite 2/hora)

### 5. `HUMAN_ACTION_REQUIRED: BACKUP_ANDROID_UPLOAD_KEY`

1. **Servicio:** Firma de Android (`release.keystore` / upload key)
2. **Consola:** no aplica — acción local + gestor de contraseñas/vault
3. **Ruta:** copiar el archivo `release.keystore` (ubicación actual no verificable desde el repo, está en `.gitignore` por diseño) a un vault cifrado (1Password, Bitwarden, o equivalente)
4. **Cambio requerido:** ninguno de código — solo respaldo
5. **Variables afectadas:** ninguna
6. **Cómo validar:** confirmar que existe al menos una copia fuera del repositorio y que es recuperable (probar el descifrado del vault)
7. **Riesgo de hacerlo:** ninguno — es puramente aditivo
8. **Rollback:** no aplica

### 6. `HUMAN_DECISION_REQUIRED: GITHUB_REPOSITORY_VISIBILITY`

Decisión de producto/seguridad, no una acción técnica: mantener el repositorio público (sin cuota de Actions, pero con exposición de la lógica de scraping de las 9 farmacias) o privatizarlo (introduce cuota de 2.000 minutos/mes de Actions en plan Free, y Pages requeriría plan Pro). Ver `docs/operations/PLATFORM_SERVICE_REVIEW_GITHUB.md` para el detalle completo.

### 7. `HUMAN_DECISION_REQUIRED: MINSAL_IP_BLOCK_STRATEGY`

Decisión de ingeniería/costo: aceptar el snapshot manual congelado (ver sección de Monitoreo) como estrategia permanente, o invertir en una vía de acceso no bloqueada por MINSAL (IP residencial/self-hosted runner). Ver `docs/operations/PLATFORM_SERVICE_REVIEW_MINSAL.md`.

### 8. `POLICY_REVIEW_REQUIRED: DONATION_BANNER_TAX_STATUS`

Confirmar si el aporte voluntario del `DonationBanner` califica como "tax exempt donation" bajo la política de Google Play, o si de todas formas conviene resolverlo migrando a Vercel Pro (que cubre el ángulo de Vercel independientemente del resultado de este análisis). Ver sección dedicada arriba y `docs/operations/PLATFORM_SERVICE_REVIEW_GOOGLE_PLAY.md`.

---

## Riesgos aceptados

Problemas conocidos que deliberadamente no se resuelven en este sprint:

1. **Dato de sucursales MINSAL congelado desde 2026-06-08** en Mobile (filtro de comuna) — aceptado hasta que se tome la decisión de `MINSAL_IP_BLOCK_STRATEGY`. Impacto: comunas/farmacias de turno reales pueden no coincidir con lo mostrado.
2. **Algolia/Salcobrand fuera de control de ComparaFarma** — riesgo de rotación de credenciales sin aviso, aceptado porque no hay ninguna acción disponible del lado de ComparaFarma más allá del aislamiento de fallo ya implementado.
3. **Flow pausado sin fecha de reactivación** — aceptado como decisión de negocio explícita del 2026-08-14, coordinado con la decisión de Premium/Vercel Pro.
4. **Cuenta personal única detrás de Vercel/GitHub/Expo/Supabase/Sentry/PostHog/Khipu** — riesgo sistémico transversal, ya documentado en la Auditoría original, no resuelto en ningún sprint hasta la fecha (requiere decisión de estructura societaria, fuera de alcance operacional).
5. **Repositorio público** — aceptado como el estado actual mientras `GITHUB_REPOSITORY_VISIBILITY` no se decida.

---

## Monitoreo

Servicios en plan gratuito y el umbral que amerita revisar un upgrade:

| Servicio | Umbral de alerta | Consumo actual conocido |
|---|---|---|
| Expo/EAS (OTA) | Acercarse a 1.000 MAU | 1 MAU (2026-08) |
| Vercel Hobby | 12 funciones serverless por deployment (`comparafarma-api`) | 10/12 |
| Supabase | Acercarse a 500 MB de DB o 50.000 MAU | No verificable sin Dashboard |
| Resend | Acercarse a 100 emails/día o 3.000/mes | 7/mes (pruebas) |
| Upstash Redis | Acercarse a 500.000 comandos/mes | No verificable sin Dashboard |
| Sentry | Spike Protection activado (señal de que se está perdiendo señal de errores) | No verificado si alguna vez se activó |
| GitHub Actions | Solo relevante si se privatiza el repo (2.000 min/mes Free) | No aplica mientras sea público |

**Snapshot MINSAL:** fecha del snapshot actual = 2026-06-08. Proceso de actualización: manual, ejecutando `scripts-temp/fetch-branches.js` desde una red residencial (no bloqueada por MINSAL) y commiteando el resultado en `api/src/data/branches.json`/`branches-data.ts`. Frecuencia recomendada mientras no se resuelva `MINSAL_IP_BLOCK_STRATEGY`: mensual o cuando se note un desfase notorio reportado por usuarios. Impacto de datos desactualizados: el filtro de comuna en Mobile puede mostrar farmacias de turno que ya no correspondan al día real.

---

## Decisiones futuras

Temas que no corresponden a este sprint de cierre operacional:

- Definición comercial completa de Free/Premium (qué se incluye en cada plan) — de la que depende cuándo y cómo se activa Flow y cómo se implementa la compra de Premium en Android (Google Play Billing, ver sección dedicada arriba).
- Estructura societaria (LET como entidad) que permita separar las cuentas de servicios de la persona natural que las opera hoy — relevante para Khipu, Vercel, GitHub, Google Play, y para la exención tributaria que resolvería `DONATION_BANNER_TAX_STATUS`.
- Reactivación de Fase 2b ("sincronización de cuentas en Mobile") de `docs/product/COMPANY_STRATEGY.md`, pausada mientras Mobile estaba en Prueba Cerrada — la restricción ya se levantó (2026-08-13), pendiente de una sesión de producto/estrategia dedicada.

---

## Farmacias

> Las integraciones de farmacias están fuera del alcance de este cierre operacional y serán auditadas en un sprint independiente.

---

## Documentos relacionados

`docs/operations/PLATFORM_SERVICE_REVIEW_BACKLOG.md`, `docs/operations/PLATFORM_SERVICE_CATALOG.md`, `docs/operations/PRODUCTION_INFRASTRUCTURE_AUDIT.md`, y las 12 revisiones individuales `docs/operations/PLATFORM_SERVICE_REVIEW_{SUPABASE,RESEND,EXPO_EAS,ALGOLIA,VERCEL,GITHUB,MINSAL,GOOGLE_PLAY,SENTRY,POSTHOG,KHIPU,UPSTASH}.md`.

## Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios |
|---|---|---|---|---|
| 1.0 | 2026-08-15 | Activo | Pendiente (CTO) | Creación — consolida las 12 revisiones de servicio del backlog `OPS-BKL-001` en un único estado operacional, con verificación de código real, hallazgo nuevo de estado de git sin commitear, análisis de `DonationBanner` sin eliminarlo, y reclasificación del riesgo de `release.keystore`. |
| 1.1 | 2026-08-15 | Activo | Pendiente (CTO) | Preparación de la rotación segura de credenciales Khipu: re-verificación de código (sin exposición activa hoy), tabla de servicios que sí/no necesitan actualizar la credencial, y comando de validación exacto (curl/PowerShell) para ejecutar después del redeploy. Reclasificación del riesgo de Khipu de 🔴 Alto a 🟡 Medio en la tabla consolidada, ya que la exposición de código quedó cerrada — la rotación en el panel de Khipu sigue como acción humana pendiente. Ningún código modificado. |
| 1.2 | 2026-08-15 | Activo | Pendiente (CTO) | Migración de `/api/donate` a Khipu Instant Payments API 3.0: la acción humana pendiente cambia de "rotar la clave API 2.0" a "crear KHIPU_API_KEY nueva y configurarla en Vercel"; se actualiza el procedimiento, la tabla de servicios afectados y el comando de validación. Credenciales API 2.0 se conservan sin expirar como LEGACY_ROLLBACK_ONLY. |

**Nota:** este documento no tiene, a la fecha, aprobación formal del CTO — fue creado a su pedido explícito; la aprobación es un paso posterior y separado.
