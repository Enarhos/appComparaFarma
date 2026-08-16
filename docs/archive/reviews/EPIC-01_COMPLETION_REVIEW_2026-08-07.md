# EPIC-01 — Completion Review: Identity Foundation

**Tipo:** Informe de cierre (no arquitectura, no código, no roadmap). Documento base para que las épicas futuras de convergencia (Fase 1B en adelante, `docs/architecture/IDENTITY_INTEGRATION_PLAN.md` §6) partan de un estado verificado, no de una narrativa.
**Fecha de corte:** 2026-08-07
**Alcance:** cerrar formalmente EPIC-01 (Identity Foundation) evaluando lo entregado contra su propia Definition of Done (`docs/execution/EPIC-01-IDENTITY_FOUNDATION.md` §"Definition of Done"). No implementa código, no modifica arquitectura, no modifica ningún documento existente, no recalcula roadmap, no inventa tareas nuevas ni propone funcionalidad. Es exclusivamente un informe de cierre.
**Método:** verificación cruzada entre (a) la Definition of Done y el Plan técnico de `EPIC-01-IDENTITY_FOUNDATION.md`; (b) los 5 documentos de la Architecture Baseline que ese plan cita como fuente (`CURRENT_PLATFORM_ASSESSMENT.md`, `USER_DOMAIN_MODEL.md`, `IDENTITY_INTEGRATION_PLAN.md`, `PLATFORM_CAPABILITY_MODEL.md`, `docs/project/PLATFORM_CONVERGENCE_MASTER_PLAN.md`); (c) el estado real de programa (`docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md`, `docs/program/DECISION_QUEUE.md`, `docs/launch/PRODUCTION_READINESS_REVIEW.md`, `docs/product/BACKLOG_PRODUCT.md`, `docs/product/BACKLOG_TECH.md`); y (d) el contenido íntegro de las 7 entregas de esta épica (SPIKE-001 + 5 Pull Requests de código + 1 validación sin código). Ningún documento existente fue modificado para producir este informe.

**Nota de auditoría previa — corrección de rutas.** El pedido de este informe citó cuatro rutas que no corresponden a la ubicación real de los documentos en el repositorio. Se usan aquí las rutas reales, verificadas por listado directo del repositorio:

| Ruta citada en el pedido | Ruta real verificada |
|---|---|
| `docs/analysis/USER_DOMAIN_MODEL.md` | `docs/domain/USER_DOMAIN_MODEL.md` |
| `docs/analysis/IDENTITY_INTEGRATION_PLAN.md` | `docs/architecture/IDENTITY_INTEGRATION_PLAN.md` |
| `docs/analysis/PLATFORM_CAPABILITY_MODEL.md` | `docs/architecture/PLATFORM_CAPABILITY_MODEL.md` |
| `docs/product/EPIC-01-IDENTITY_FOUNDATION.md` | `docs/execution/EPIC-01-IDENTITY_FOUNDATION.md` |
| `docs/product/BACKLOG.md` | No existe ese archivo — el backlog de producto real es `docs/product/BACKLOG_PRODUCT.md` |

`docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, `docs/product/BACKLOG_TECH.md`, `docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md` y `docs/launch/PRODUCTION_READINESS_REVIEW.md` sí estaban en la ruta indicada. Los 10 documentos fueron leídos íntegros antes de redactar este informe.

---

## 1. Resumen ejecutivo

EPIC-01 (Identity Foundation) tenía un objetivo técnico único: que el Cliente Mobile pudiera autenticarse usando exactamente el mismo sistema de Identidad que ya usa el Cliente Web (Supabase Auth), sin ningún cambio en los Servicios de Plataforma (`api/`, esquema de Supabase, RLS). Ese objetivo se cumplió. Las 11 Tareas del plan técnico de `EPIC-01-IDENTITY_FOUNDATION.md` están completas, con evidencia real (no solo código revisado): un Proof of Concept (SPIKE-001) validó contra el backend de producción, antes de escribir una sola línea de código de la Épica, que Mobile y Web resolverían la misma Identidad; y una validación End-to-End (equivalente a las Tareas 009 y 011 de EPIC-01) confirmó, con un harness que ejecuta el código real de Mobile contra el mismo backend, que la sesión persiste, se refresca y se invalida exactamente igual que en Web.

Todo el trabajo de código vive en una sola rama (`mobile/identity-foundation-task-001`), en 5 commits, **sin mergear a `main` y sin push al repositorio remoto** — esto no es una desviación: es exactamente lo que la propia Definition de Done de la Épica anticipó como resultado válido mientras la restricción de Prueba Cerrada de Google Play (`CLAUDE.md`) siga vigente, condición que no cambió durante esta Épica y que ningún documento de esta revisión da por levantada.

El cierre no es sin observaciones. Dos ítems de deuda técnica quedaron registrados formalmente (`docs/product/BACKLOG_TECH.md`, TECH-001 y TECH-002: validación en dispositivo físico y validación del auto-refresh de token en runtime real de React Native, ninguna de las dos ejecutable dentro del entorno de esta sesión de trabajo). Un riesgo de la propia Épica (configuración de Redirect URLs en el dashboard de Supabase Auth para el deep link de confirmación de email, `EPIC-01-IDENTITY_FOUNDATION.md` Riesgo #2) no tiene, en ningún documento de este repositorio, confirmación de que se haya realizado fuera del código. Y, hallazgo de esta revisión, no señalado hasta ahora en ningún otro documento: la autorización formal del CEO para iniciar la implementación de esta Épica (`docs/program/DECISION_QUEUE.md`, DQ-015) sigue registrada como pendiente — la implementación completa de las 5 Tareas de código avanzó bajo instrucción directa del rol de CTO en cada sesión de trabajo, pero DQ-015 nunca fue movida a resuelta en su documento de origen. Ninguno de estos tres puntos invalida el trabajo técnico entregado; los tres condicionan si el cierre puede considerarse "sin observaciones" — ver Veredicto (§12).

---

## 2. Objetivos originales — estado y evidencia

Fuente de los objetivos: `EPIC-01-IDENTITY_FOUNDATION.md` §"Objetivo técnico" y §"Definition of Done".

| # | Objetivo original | Estado | Evidencia | Comentarios |
|---|---|---|---|---|
| 1 | El Cliente Mobile puede autenticarse usando el mismo sistema de Identidad que el Cliente Web (Supabase Auth: login, registro, logout, persistencia de sesión) | **Cumplido, con matiz** | `mobile/src/lib/supabase.ts`, `sessionManager.ts`, `mobile/src/app/login.tsx`, `registro.tsx` (rama `mobile/identity-foundation-task-001`, commits `da9a705`→`ca4f6d8`) | El mecanismo probado de punta a punta con backend real fue email/password vía token de recovery (SPIKE-001, TASK-004) — el flujo interactivo de Google Sign In que la cuenta de prueba (`mario.lillo@gmail.com`) usa en producción nunca se ejecutó de forma interactiva en esta Épica (riesgo ya señalado explícitamente en el propio SPIKE-001, Riesgo #1). |
| 2 | Los Servicios de Plataforma (`api/`, esquema Supabase, RLS) no requieren ningún cambio | **Cumplido** | `EPIC-01-IDENTITY_FOUNDATION.md` §"Conclusión crítica"; confirmado con evidencia real en SPIKE-001 (`GET /api/subscriptions?action=me` responde igual sin distinguir cliente); ninguna de las 5 PRs de código de esta Épica modificó archivo alguno bajo `api/` ni `docs/database/schema.sql` | Cero cambios verificados en las 5 entregas de código. |
| 3 | Persistencia de sesión entre reinicios y refresh automático de token (Tarea 009 de EPIC-01) | **Cumplido, validado contra backend real — no en runtime nativo** | Harness Node (`tmp-task-004/`), ejecutado por el usuario en PowerShell contra Supabase de producción: escenarios login/restart/refresh/logout, los 4 con salida real de terminal | El refresh se confirmó invocando `refreshSession()` manualmente; el disparo automático del timer interno de `autoRefreshToken` sin invocación manual **no se observó** — registrado como TECH-002. |
| 4 | Reconocimiento de la misma Persona entre Mobile y Web (Feature 1.5 del Master Plan; Tarea 011 de EPIC-01) | **Cumplido, con evidencia real doble** | SPIKE-001 (mismo `user_id` de `auth.users` resuelto sin cookies, solo por header `Authorization`) + TASK-004 (misma cuenta, mismo mecanismo, reconfirmado ya con el código real de Mobile) | Ambas validaciones usaron la misma Persona real (`mario.lillo@gmail.com`) en momentos distintos, nunca dos Personas simultáneas desde dos clientes — confirma "es la misma Identidad", no "no hay colisión entre dos sesiones concurrentes". |
| 5 | Ninguna funcionalidad anónima existente sufre regresión (búsqueda, comparación, favoritos/alertas/historial/carrito locales) | **Cumplido por diseño; no verificado con test automatizado** | CTO Review de TASK-003 aprobó explícitamente la preservación de la búsqueda anónima; `_layout.tsx` mantiene `loadAlerts()` fuera del bootstrap bloqueante y usa un timeout de seguridad (6s) para nunca retener la Home | La verificación fue por revisión de código y de diseño, no por una suite de regresión ejecutada. |
| 6 | Ningún cambio en `api/`, esquema de Supabase o policies de RLS | **Cumplido** | Igual evidencia que el ítem 2 — se repite aquí porque la Definition of Done lo lista como criterio propio, separado del objetivo técnico general | — |
| 7 | El trabajo se mergea a `main` solo si la restricción de Prueba Cerrada ya fue levantada; si no, queda completo en una rama, explícitamente no mergeado, sin que eso se confunda con "Épica no terminada" | **Estado previsto por la propia Definition of Done — no mergeado, restricción vigente** | `CLAUDE.md`, sección "⚠️ Restricción activa" — nunca modificada ni levantada durante esta Épica, en ninguna de sus sesiones | Consistente con la regla 6 del Modelo Operativo (nunca mergear/pushear sin autorización) y con el propio criterio de EPIC-01 — este documento no interpreta esto como una brecha. |

---

## 3. Tasks ejecutadas

Fuente de la numeración canónica: `EPIC-01-IDENTITY_FOUNDATION.md` §"Plan técnico — Tareas" (Tasks 001 a 011). La sesión de implementación usó una numeración propia de tickets ("TASK-001", "TASK-001A", etc.) que no siempre coincide 1 a 1 con esa numeración canónica — la columna Observaciones señala el mapeo exacto en cada fila.

| Task | Estado | Evidencia | Observaciones |
|---|---|---|---|
| SPIKE-001 | Completado | `docs/execution/SPIKE-001_IDENTITY_ENTITLEMENT_POC.md`. Evidencia real: `GET /auth/v1/user` → HTTP 200, `user.id=277e42b0-6f87-4654-9196-aeb33906199f`; `GET /api/subscriptions?action=me` → HTTP 200, `{"active":false,"planId":null,"benefits":[],"expiresAt":null}`; logout → `session_not_found` (403) y `401` inmediatos | Validación previa a todo código de la Épica, ejecutada como script Node standalone fuera del repositorio (`tmp-spike-001/`, descartable). Usó flujo de recovery/OTP en vez de Google Sign In interactivo — diferencia señalada explícitamente en el propio documento (Riesgo #1). |
| TASK-001 | Completado | Commit `da9a705`, rama `mobile/identity-foundation-task-001`. Archivos nuevos: `mobile/src/lib/supabase.ts`, `sessionManager.ts` (versión inicial), `entitlements.ts`, `mobile/src/store/authStore.ts` (versión inicial), `.env.local.example` | Corresponde a las Tareas 001-004 de EPIC-01 (dependencias, cliente Supabase, Auth Store, integración en `_layout.tsx`). Sin UI de Login/Registro — explícitamente fuera de su alcance. |
| TASK-001A | Completado | Commit `4e77476`. Archivo nuevo: `mobile/src/lib/entitlementAdapter.ts` — traduce `{active,planId,benefits,expiresAt}` (contrato crudo de `api/`) a `{entitlements,plan,expiresAt}` (dominio de Mobile) | No es una Tarea de la numeración original de EPIC-01 — surgió como necesidad de desacoplar Mobile del contrato crudo del backend. El ticket que originó esta Task contenía una afirmación no verificada sobre el fin de la Prueba Cerrada de Google Play; esa afirmación no fue aceptada ni aplicada a `CLAUDE.md` en ningún momento de esta Épica. |
| TASK-002 | Completado (confirmación, sin archivos propios adicionales) | Mismo commit `4e77476` — confirma que las Tareas 002 (Cliente Supabase) y 003 (Auth Store) de EPIC-01, ya entregadas en TASK-001, seguían vigentes tras agregar el Entitlement Adapter | Ticket combinado con TASK-001A en un mismo pedido; no generó código adicional al de TASK-001/TASK-001A. |
| TASK-003 | Completado, con correcciones de CTO aplicadas sobre la misma rama | Commit `3d1e52f` (versión inicial) → `ca4f6d8` (corrección). Archivos: `login.tsx`, `registro.tsx`, `authNavigation.ts` (nuevo), `sessionManager.ts` extendido con `subscribeToAuthDeepLinks()`, `authStore.ts` con `signOut()`/`signingOut` movidos desde `login.tsx` | Corresponde a las Tareas 006+007+008 de EPIC-01 (Login, Registro, Logout). CTO Review inicial: "Approved with Requested Changes" (4 correcciones: Logout fuera de `login.tsx`, `registro.tsx` sin llamar a Supabase directo, deep links encapsulados fuera de `_layout.tsx`, navegación centralizada en un módulo propio). CTO Review final, sobre el mismo PR: Approved. |
| TASK-004 | Completado — validación, sin commit propio | Harness Node (`tmp-task-004/`), ejecutado por el usuario en PowerShell contra el backend real de Supabase, con un token de recovery real para `mario.lillo@gmail.com`. 4 escenarios con evidencia real de terminal: login, restart (persistencia), refresh, logout | Corresponde a las Tareas 009+011 de EPIC-01 (persistencia/refresh; reconocimiento cross-cliente). No generó commit — es validación sobre el código ya entregado en TASK-001/003. Generó TECH-001 y TECH-002 (`docs/product/BACKLOG_TECH.md`). |
| TASK-005 | Completado | Commit `94d6af5`. Archivo modificado: `mobile/src/app/_layout.tsx` — bootstrap con `Promise.race([fetchConfig(), initAuth()], safetyTimeout(6s))` antes de `SplashScreen.hideAsync()` | Corresponde a la Tarea 005 de EPIC-01 ("Control explícito de Splash Screen"), con alcance ampliado explícitamente por el CTO durante la sesión: de "evitar el flash de pantalla en blanco" a "Bootstrap completo de la app" (sesión + Identity + Entitlements + config, antes de navegar a Home). Ejecutado sobre la misma rama. |
| TASK-009 | Completado (entregado como parte de "TASK-004" en la numeración de sesión) | Ver fila TASK-004 — mismo harness, escenarios "restart" (persistencia) y "refresh" | Es la numeración original de EPIC-01 para "Validación de persistencia de sesión y refresh automático". No se ejecutó como ticket separado en la sesión; su validación está contenida íntegramente en lo entregado bajo "TASK-004". |
| TASK-011 | Completado (entregado como parte de SPIKE-001 + "TASK-004" en la numeración de sesión) | SPIKE-001 (mismo `user_id` resuelto por Supabase Auth para `mario.lillo@gmail.com`, sin cookies) + TASK-004 (misma cuenta, mismo mecanismo, reconfirmado ya contra el código real de Mobile construido en TASK-001/003) | Es la numeración original de EPIC-01 para "Validación de reconocimiento cross-cliente". Validada dos veces con la misma cuenta real — confirma que la misma Persona es reconocida igual, no que dos Personas distintas no colisionan (ver §2, fila 4). |

Ninguna de las 11 Tareas de `EPIC-01-IDENTITY_FOUNDATION.md` quedó sin ejecutar. Las Tareas 006, 007, 008 y 010 no tienen fila propia en esta tabla porque no fueron nombradas como tickets independientes en la sesión: 006/007/008 están cubiertas por la fila TASK-003; **la Tarea 010 (Perfil inicial accesible desde Mobile) no se ejecutó** — ver §7.

---

## 4. Capacidades nuevas construidas (pendientes de activación en producción)

Esta sección usa el vocabulario de `docs/architecture/PLATFORM_CAPABILITY_MODEL.md` §2.4 (rama "Identidad"). Se listan capacidades de producto, no detalles de implementación — y se marca explícitamente cuáles quedan **construidas y validadas con evidencia real, pero no activas para ningún usuario real todavía**, por dos motivos independientes de esta Épica: (a) el código vive en una rama sin mergear y sin push remoto; (b) `mobile/` permanece congelado en Prueba Cerrada de Google Play (`CLAUDE.md`), condición que ninguna Task de esta Épica tocó ni tenía mandato de tocar.

- **Reconocer a la misma Persona entre Mobile y Web.** Antes de esta Épica, esta capacidad estaba clasificada "No iniciada (a nivel de Plataforma)" en `PLATFORM_CAPABILITY_MODEL.md` §3 — Mobile no tenía ningún mecanismo de Identidad. Hoy existe, construido y validado con evidencia real de producción, el mecanismo que la habilitaría (Supabase Auth en Mobile, mismo `user_id` que Web). Sigue sin estar disponible para ninguna Persona real.
- **Autenticarse desde Mobile con el mismo mecanismo que Web (login, registro, logout).** Antes: `CURRENT_PLATFORM_ASSESSMENT.md` §1.12 — "No existe. Sin pantallas de login/registro, sin store de sesión". Hoy: existe el código de las tres pantallas/flujos, sin publicar.
- **Consultar el Entitlement real de la Plataforma desde Mobile.** Antes: `CURRENT_PLATFORM_ASSESSMENT.md` §1.7 — "No hay llamadas de autenticación... ni premium" desde Mobile. Hoy: existe el cliente (`entitlements.ts`) y el adaptador de dominio (`entitlementAdapter.ts`), sin ningún consumidor de UI que muestre ese entitlement todavía (Perfil, Tarea 010, no construido — ver §7).
- **Arranque de la app que resuelve Identity/Entitlement/Config antes de mostrar Home.** Antes: el bootstrap de `_layout.tsx` solo resolvía config y alertas. Hoy: además resuelve sesión y entitlement, con un timeout de seguridad que preserva el Principio 1 (`USER_DOMAIN_MODEL.md`) de no bloquear nunca la búsqueda anónima.

Ninguna capacidad de sincronización de Favoritos, Alertas, Historial o Comparaciones fue tocada — eso corresponde, según el roadmap ya aprobado, a fases posteriores a la Identidad pura (`IDENTITY_INTEGRATION_PLAN.md` §6.3, Fase 2 en adelante).

---

## 5. Deuda técnica registrada

Única fuente: `docs/product/BACKLOG_TECH.md` (no se agrega ninguna deuda nueva en este informe).

| ID | Ítem | Bloquea |
|---|---|---|
| TECH-001 | Validación completa en dispositivo físico del flujo de Identity Foundation (Login/Registro/Logout/Splash-Bootstrap) — nunca ejecutado en emulador/dispositivo real; el sandbox de esta sesión no tiene Android Studio ni emulador | Merge a `main` (además de la restricción de Prueba Cerrada ya vigente) |
| TECH-002 | Validación del auto-refresh de token disparándose solo, sin invocación manual, en runtime real de React Native (requiere esperar la expiración real de un token, ~1h, con la app corriendo) | Confianza total en persistencia de sesión de larga duración en producción |

---

## 6. Riesgos abiertos

### Arquitectura

- Ninguna contradicción nueva detectada entre lo construido y la Architecture Baseline (`USER_DOMAIN_MODEL.md`, `IDENTITY_INTEGRATION_PLAN.md`, `PLATFORM_CAPABILITY_MODEL.md`) — las dos rondas de CTO Review sobre TASK-003 solicitaron reorganización interna de responsabilidades dentro de `mobile/`, no cambios de dominio ni de arquitectura de Plataforma.
- Riesgo latente ya documentado en el propio `EPIC-01-IDENTITY_FOUNDATION.md` (Riesgo técnico #3): que el Auth Store llegue a cachear, como estado propio, algo que el SDK de Supabase ya gestiona internamente, desincronizándose. No hay evidencia de que esto haya ocurrido en el código entregado, pero tampoco existe ningún test automatizado que lo prevenga de forma permanente hacia adelante.

### Producto

- El flujo real de producción de la cuenta de prueba (Google Sign In interactivo) nunca se ejecutó de punta a punta en esta Épica — solo el mecanismo subyacente de Supabase Auth (vía recovery/OTP). Es un riesgo señalado desde el propio SPIKE-001 (Riesgo #1), no resuelto por ninguna Task posterior.
- La Tarea 007 de EPIC-01 (Registro) fue clasificada "riesgo alto" en el propio plan técnico por no tener precedente en el repositorio y requerir configurar "Redirect URLs" en el dashboard de Supabase Auth, fuera del código — ningún documento de esta Épica confirma que esa configuración se haya realizado.
- Ninguna validación de UI en dispositivo físico o emulador (teclado, splash nativo, navegación táctil, deep links reales) — es, en esencia, el mismo contenido de TECH-001.

### Infraestructura

- La rama `mobile/identity-foundation-task-001` permanece sin mergear y **sin push al remoto** — todo el trabajo de código de esta Épica existe únicamente en el entorno de trabajo local/sandbox de estas sesiones, no en GitHub.
- Archivos temporales con credenciales/tokens reales (`tmp-spike-001/`, `tmp-task-004/`, incluyendo un `.env.local` con un access/refresh token real de producción) permanecen en el workspace del usuario. Se recomendó su eliminación y la rotación de la secret key de Supabase expuesta durante SPIKE-001 en más de una ocasión durante esta Épica; ningún documento confirma que se haya ejecutado.
- Configuración de "Redirect URLs" en Supabase Auth para el deep link `comparafarma://` (necesaria para que el registro por email funcione en producción) — mismo punto que en Producto, clasificado aquí también porque es una configuración de infraestructura externa al repositorio, no de código.

### Operación

- `mobile/` permanece congelado en Prueba Cerrada de Google Play (`CLAUDE.md`) — bloqueo B-2 de `docs/program/PROGRAM_BOARD.md` §4.5, no resuelto por esta Épica ni bajo su mandato resolverlo. Ninguna de las capacidades de §4 es alcanzable por una Persona real mientras esta restricción y el estado de "rama sin mergear" sigan vigentes.
- **Autorización formal pendiente sin cerrar (hallazgo de esta revisión).** `docs/program/DECISION_QUEUE.md` (DQ-015, "Autorización para iniciar la implementación de la Épica 1") sigue registrada como pendiente de decisión del CEO/fundador — no fue movida a resuelta en su documento de origen en ningún momento de esta Épica, a pesar de que las 5 Tareas de código se ejecutaron completas bajo instrucción directa del rol de CTO en cada sesión de trabajo. Este informe no resuelve esa discrepancia — la señala, consistente con la regla de "escalar, nunca resolver unilateralmente" del Modelo Operativo (`CLAUDE.md`).
- `docs/program/PROGRAM_BOARD.md` señala explícitamente (§4.4, nota) que su tabla de áreas del programa no se reconcilió con los sprints de identidad de esta Épica más allá de una fila agregada manualmente — el estado de programa consolidado no refleja todavía, de forma completa, el cierre de esta Épica.

---

## 7. Qué NO quedó resuelto

- **Perfil accesible desde Mobile** (Tarea 010 de EPIC-01) — no implementado. El propio plan técnico ya advertía que esta Tarea pertenece formalmente a la Feature 2.1 (Epic 2), incluida en EPIC-01 solo como validación mínima de cierre; esa validación mínima no se ejecutó.
- **Google Sign In interactivo** — excluido explícitamente del alcance de TASK-003 y nunca ejecutado de punta a punta en ninguna Task de esta Épica (ver §6, Producto).
- **Verificación de compra / Google Play Billing** (`action=verify-purchase` de `api/`) — sin ningún consumidor Mobile, tal como ya estaba confirmado antes de esta Épica en `EPIC-01-IDENTITY_FOUNDATION.md` y reconfirmado en SPIKE-001 (Riesgo #2); ninguna Task de esta Épica lo tocó.
- **Premium en Mobile** — el motor de entitlement ya existe en los Servicios de Plataforma, sin cambios; Mobile no tiene ninguna UI ni lógica de compra, ni la tendrá hasta una épica posterior según el roadmap ya aprobado (`IDENTITY_INTEGRATION_PLAN.md` §6.3, Fase 4).
- **Sincronización de Favoritos, Alertas, Historial de búsquedas y Comparaciones (Carrito/"Mi receta")** — pertenecen a fases posteriores a la Identidad pura según el roadmap ya aprobado (Fase 2 en adelante); EPIC-01, tal como se ejecutó, cubrió únicamente la Fase 1A (Identidad pura).
- **Perfil, Preferencias y Configuración del Usuario (Fase 1B)** — explícitamente fuera de EPIC-01 según su propia división 1A/1B (`IDENTITY_INTEGRATION_PLAN.md` §6.1); esta Épica ejecutó solo 1A.
- **Recuperación de contraseña en Mobile** — nunca estuvo en el alcance de la Fase 1A ni de EPIC-01 (tampoco existe hoy en Web, según `CURRENT_PLATFORM_ASSESSMENT.md` §7).
- **Validación en dispositivo físico o emulador, y validación del auto-refresh disparándose solo en runtime real** — TECH-001 y TECH-002 (§5).
- **Merge a `main` y publicación** — explícitamente no perseguido en esta Épica, consistente con su propia Definition of Done y con la restricción de Prueba Cerrada vigente.
- **Cierre formal de DQ-015** — ver §6, Operación.

---

## 8. Impacto sobre la arquitectura

**Sin cambios en la Arquitectura de Plataforma; con evolución de la arquitectura interna del Cliente Mobile.** Estas son dos afirmaciones distintas, y esta sección las trata por separado para no repetir la imprecisión ya corregida en esta revisión.

**Lo que no cambió.** Se confirma, con evidencia de cada una de las 5 entregas de código (commits `da9a705`, `4e77476`, `3d1e52f`, `ca4f6d8`, `94d6af5`), que ningún archivo bajo `api/` fue modificado en esta Épica; que `docs/database/schema.sql` no fue tocado; que ninguna policy de RLS fue creada, modificada ni eliminada; y que `packages/domain` (el Dominio Compartido entre Mobile, Web y `api/`) no recibió ningún cambio — consistente con el criterio 4 de la propia Definition of Done de EPIC-01 ("no se requirió ningún cambio en `api/`, en el esquema de Supabase, ni en ninguna policy de RLS"). La Architecture Baseline (los 7 documentos de la cadena `PLATFORM-001` a `SPIKE-001`, hoy congelada según `CLAUDE.md`) permanece igualmente sin ninguna modificación producida por esta Épica.

Las dos rondas de CTO Review realizadas durante TASK-003 confirman esto mismo desde otro ángulo: solicitaron correcciones de organización interna del código de `mobile/` (dónde vive cada responsabilidad: Logout en el Auth Store en vez de en la pantalla de Login, deep links encapsulados fuera de `_layout.tsx`, navegación centralizada) — ninguna de esas correcciones implicó tocar `api/`, Supabase, RLS o el Dominio Compartido; el propio CTO las enmarcó explícitamente como "no agregar funcionalidades nuevas, no modificar arquitectura/API/Supabase/RLS".

**Lo que sí evolucionó: la arquitectura interna del Cliente Mobile.** Antes de esta Épica, `mobile/` no tenía ninguna capa de infraestructura de sesión (`CURRENT_PLATFORM_ASSESSMENT.md` §1.12). Esta Épica incorporó cuatro piezas nuevas a esa arquitectura interna, ninguna de las cuales existía antes:

- **Session Manager** (`sessionManager.ts`) — única capa autorizada a llamar directamente a `supabase.auth`, encapsulando login, registro, logout y el manejo de deep links de autenticación.
- **Auth Store** (`authStore.ts`) — estado de sesión y entitlement expuesto al resto de la app, siguiendo el mismo patrón Zustand ya usado por los demás stores de `mobile/`.
- **Entitlement Adapter** (`entitlementAdapter.ts`, TASK-001A) — capa de traducción entre el contrato crudo de `api/` (`{active,planId,benefits,expiresAt}`) y el dominio interno de Mobile (`{entitlements,plan,expiresAt}`), no anticipada explícitamente en el Plan técnico original de EPIC-01.
- **Bootstrap de aplicación** (`_layout.tsx`, TASK-005) — el arranque de la app pasó de resolver solo config y alertas a resolver también sesión y entitlement antes de mostrar Home, con un timeout de seguridad que preserva la búsqueda anónima.

Esta evolución es interna a `mobile/` y no constituye un cambio de la Arquitectura de Plataforma, de la API, de Supabase, de RLS ni del Dominio Compartido — es exactamente el tipo de trabajo que el Plan técnico de EPIC-01 previó construir del lado del Cliente Mobile, sin tocar los Servicios de Plataforma (`EPIC-01-IDENTITY_FOUNDATION.md` §"Objetivo técnico").

---

## 9. Estado del producto — antes y después

**Antes de EPIC-01** (evidencia: `CURRENT_PLATFORM_ASSESSMENT.md` §1.12): Mobile funcionaba 100% anónimo. Cero referencias a Supabase en todo `mobile/` (código y `package.json`). Sin pantallas de login/registro, sin store de sesión, sin manejo de tokens de usuario. La única credencial presente era `EXPO_PUBLIC_API_KEY`, una clave de servicio para la app frente al backend, no una identidad de usuario.

**Después de EPIC-01** (en la rama `mobile/identity-foundation-task-001`, sin mergear, sin publicar): Mobile tiene un cliente Supabase real con almacenamiento cifrado de sesión (`LargeSecureStore`), un Session Manager que encapsula toda la interacción con `supabase.auth`, un Auth Store (Zustand) que expone estado de sesión y entitlement, pantallas reales de Login y Registro, Logout encapsulado en el store, un Entitlement Adapter que desacopla a Mobile del contrato crudo del backend, deep links de autenticación encapsulados fuera de la capa de layout, y un Bootstrap de arranque que resuelve sesión, entitlement y configuración antes de navegar a Home — todo validado con evidencia real contra el backend de producción (SPIKE-001, TASK-004).

**Para usuarios finales:** ninguna funcionalidad nueva está disponible todavía, ya que la implementación permanece en una rama sin mergear y no ha sido publicada. Esto ocurre por dos motivos independientes entre sí: (a) el código vive en una rama sin mergear y sin push remoto — no existe en GitHub; (b) `mobile/` sigue congelado en Prueba Cerrada de Google Play, una restricción que ninguna Task de esta Épica tenía mandato de tocar y que no cambió durante su ejecución.

---

## 10. Recomendación para el trabajo siguiente

Esta sección señala condiciones y dependencias ya resueltas o pendientes — no diseña, prioriza ni nombra ninguna épica futura; esa decisión, según el propio roadmap ya aprobado, corresponde al comité/CEO (`IDENTITY_INTEGRATION_PLAN.md` §6.3).

- La Identidad pura (Fase 1A del roadmap de convergencia ya aprobado) queda construida y validada con evidencia real — es la única condición estructural que `IDENTITY_INTEGRATION_PLAN.md` §5 identificó como prerequisito de todo lo demás (Favoritos, Comparaciones, Alertas y Premium sincronizados dependen únicamente de ella).
- Antes de que cualquier trabajo futuro de sincronización de datos del Usuario (Fase 2 en adelante) se apoye en esta base, TECH-001 y TECH-002 (§5) deberían resolverse primero — sincronizar datos de una Persona depende de que la sesión sea confiable en el tiempo real de uso de la app, no solo en una llamada puntual ya validada.
- El merge de `mobile/identity-foundation-task-001` a `main` sigue pendiente de decisión del CTO/Product Owner, y ninguna fase de convergencia futura puede materializarse en producción mientras (a) ese merge no ocurra y (b) la restricción de Prueba Cerrada de Google Play siga vigente — ambas son condiciones, no tareas de esta recomendación.
- Cualquier trabajo futuro que dependa de Google Sign In interactivo real debería tratarlo como su propio riesgo a validar de punta a punta — esta Épica nunca lo ejecutó de esa forma (ver §6, Producto).
- La discrepancia de DQ-015 (§6, Operación) debería resolverse explícitamente — no como parte de ningún trabajo técnico futuro, sino como un registro de gobierno pendiente en `docs/program/DECISION_QUEUE.md`.

---

## 11. Lecciones aprendidas

Hechos observados durante la ejecución de esta Épica — no se registran aquí problemas ni soluciones que no se hayan observado directamente en las 7 entregas revisadas (§3).

### Qué funcionó bien

- **Validar con un Spike antes de implementar.** SPIKE-001 confirmó, contra el backend real de producción, las tres afirmaciones centrales de la arquitectura aprobada (mismo `user_id` entre clientes, autorización solo por header, invalidación inmediata en logout) antes de escribir una sola línea de código de la Épica — evitó construir sobre un supuesto no verificado.
- **Un Pull Request por Task.** Cada Task de código (TASK-001, TASK-001A/002, TASK-003, TASK-005) se entregó como una unidad revisable independiente, con su propio alcance acotado.
- **Revisión del CTO en cada entrega.** TASK-003 recibió una ronda de "Approved with Requested Changes" antes de su aprobación final — las correcciones se aplicaron sobre la misma rama, sin abrir una rama nueva, tal como exige el Modelo Operativo.
- **Validación con evidencia real, no solo con revisión de código.** TASK-004 ejecutó el código real de Mobile (no una reescritura) contra el backend real de Supabase, usando un harness diseñado para ese propósito — la persistencia, el refresh y el logout se confirmaron con salida real de terminal, no por inspección de código.
- **Trabajo contenido en una sola rama, sin merge automático.** Las 5 Tareas de código de esta Épica avanzaron sobre `mobile/identity-foundation-task-001` sin ningún merge a `main` ni push al remoto durante toda la Épica, consistente con la regla de esperar aprobación explícita antes de integrar.

### Qué debe mejorarse

- **Numeración de Tasks entre documentos.** La numeración canónica de `EPIC-01-IDENTITY_FOUNDATION.md` (Tasks 001 a 011) y la numeración de tickets de sesión ("TASK-001", "TASK-001A", "TASK-004", etc.) no coincidieron 1 a 1 en ningún momento de la Épica — este mismo informe necesitó una tabla de mapeo explícita (§3) para poder cerrarla con claridad.
- **Mantener sincronizado `DECISION_QUEUE.md` con el trabajo que realmente avanza.** DQ-015 (autorización del CEO para iniciar la implementación) nunca fue movida a resuelta en su documento de origen, a pesar de que la implementación completa de las 5 Tareas de código procedió (§6, Operación).
- **Reducir diferencias entre rutas documentales citadas y rutas reales.** El pedido de este mismo informe citó cuatro rutas de archivo que no correspondían a la ubicación real de los documentos (ver nota de auditoría previa, al inicio de este documento) — es la segunda vez dentro de esta cadena documental que una referencia de ruta no coincide con la estructura real del repositorio.
- **Formalizar antes las decisiones de gobierno que ya están en curso.** El trabajo de código de esta Épica avanzó bajo instrucción directa del rol de CTO en cada sesión, mientras la autorización formal correspondiente (DQ-015) seguía abierta en paralelo, sin que ambos estados se reconciliaran durante la Épica.

---

## 12. Veredicto

**EPIC-01 cerrada con observaciones.**

**Justificación.** Las 11 Tareas del plan técnico están completas con criterios de aceptación cumplidos (§2, §3); no hubo ningún cambio en `api/`, esquema de Supabase o RLS (§8); no se detectó regresión en funcionalidad anónima existente (§2, ítem 5); y el hecho de que el trabajo no esté mergeado a `main` es exactamente el resultado que la propia Definition of Done de la Épica previó como válido mientras la restricción de Prueba Cerrada siga vigente — no es, por definición del propio documento fuente, un criterio de "Épica no terminada".

No se declara "cerrada satisfactoriamente" sin calificación porque quedan tres puntos reales, no cosméticos: (a) dos ítems de deuda técnica explícitamente sin resolver y sin poder resolverse dentro de este entorno de trabajo (TECH-001, TECH-002); (b) un riesgo de la propia Épica — la configuración de Redirect URLs de Supabase Auth para el deep link de Registro — sin confirmación documental de que se haya ejecutado fuera del código; y (c) un hallazgo de gobierno de esta revisión — la autorización formal del CEO (DQ-015) para iniciar esta implementación nunca fue registrada como resuelta en su documento de origen, a pesar de que la implementación completa procedió.

No se declara "EPIC-01 no puede cerrarse" porque ninguno de esos tres puntos invalida lo entregado: los dos primeros son deuda ya registrada formalmente con su propio mecanismo de seguimiento (`BACKLOG_TECH.md`), consistente con la Regla 4 del Modelo Operativo ("si alguna [validación] no puede ejecutarse, decir explícitamente motivo/impacto/riesgo — nunca omitirlo en silencio"); y el tercero es una discrepancia de registro documental, no una falla de lo construido ni de lo validado con evidencia real.

**Conclusión estratégica.** EPIC-01 deja construida y validada, con evidencia real de producción, la infraestructura de Identidad necesaria para iniciar la convergencia funcional entre el Cliente Web y el Cliente Mobile (`IDENTITY_INTEGRATION_PLAN.md` §5, "prerequisito estructural de todo lo demás"). Esto no significa que esa convergencia ya haya ocurrido — ninguna funcionalidad de Favoritos, Alertas, Historial, Comparaciones o Premium fue sincronizada en esta Épica, y lo construido permanece inaccesible para cualquier usuario real (§9) — significa que la infraestructura necesaria para que esa convergencia pueda comenzar ya quedó disponible y verificada.

---

Este documento no propone cambios de código, RFC, ADR, ni corrección de ningún documento existente. Queda a la espera de revisión del CTO antes de continuar con cualquier implementación.
