# PRODUCTION READINESS REVIEW — ComparaFarma

**Pregunta que responde este documento: ¿puede ComparaFarma publicarse hoy en Producción en Google Play?**

Revisión ejecutada como CTO / Release Manager / QA Director / Product Owner. No es una auditoría documental ni una auditoría de código aislada — es una verificación cruzada entre lo que la documentación afirma y lo que el repositorio (mobile, web, api, infraestructura, configuración, CI/CD) demuestra hoy. Ningún archivo de código fue modificado para producir este informe.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

> **Actualización GO LIVE 1.0 (2026-08-07).** El proyecto entra en modo GO LIVE: el objetivo deja de ser desarrollar funcionalidad nueva y pasa a ser exclusivamente publicar la versión actual de `mobile/` (100% anónima, versionCode 31 / 1.4.0) en Producción de Google Play. Esta actualización reemplaza por completo el contenido de la sección 4 (Contenido principal) de la versión 1.1, recalculando desde cero el Readiness Score, depurando los Production Blockers ya resueltos, y verificando en código el estado real de cada punto abierto (no solo revisando documentación). El veredicto y el score de esta versión **no son comparables numéricamente** con los de la versión 1.0/1.1 — el alcance y la metodología de cálculo cambiaron (ver §4.3). El historial completo de versiones anteriores se conserva en la sección 9 (Control de Cambios), no se elimina.

> **Actualización PUBLICACIÓN COMPLETADA 3.0 (2026-08-13).** Confirmado por el CTO: la aplicación (`mla.app.comparafarma`, versionCode 31 / 1.4.0) fue aprobada y publicada en Producción de Google Play. Las condiciones que motivaban el veredicto `GO CON CONDICIONES` de la versión 2.0 (GO LIVE 1.0) quedan resueltas por ese hecho. Esta actualización retira del Plan de cierre (§4.8) todas las tareas cuyo único propósito era completar esa publicación (mecanismo de submit, Release Notes, promoción de track y subida del AAB, descripción de Store Listing, disclaimer médico, screenshots adicionales, ambigüedad de ícono/feature graphic) — ya no son pendientes, son historia. Las dos tareas de §4.8 que no eran sobre el mecanismo de publicación (confirmar `API_SECRET_KEY` en Vercel; corregir el texto de la Política de Privacidad sobre el campo de email de feedback) se conservan, reclasificadas como Operación de Plataforma y Producto respectivamente — no son parte de "publicación en Google Play" y siguen abiertas. El Readiness Score y el detalle histórico de las versiones 1.0-2.0 se conservan sin editar en la sección 9 (Control de Cambios).

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | LNC-PRR-001 |
| **Nombre** | PRODUCTION_READINESS_REVIEW.md |
| **Dominio** | Lanzamiento (`docs/launch/`) |
| **Estado** | Activo |
| **Versión** | 3.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | CTO / Release Manager / QA Director / Product Owner |
| **Nivel de Gobierno** | De decisión operativa — documento de corte que fundamenta una decisión formal de publicación; se reemplaza por una nueva versión cuando cambien las condiciones materiales, nunca se edita retroactivamente una versión ya cerrada |
| **Clasificación** | Production Readiness Review |
| **Fuente Oficial** | Este documento es la fuente oficial y única de la evaluación de preparación para producción — GO LIVE 1.0 unifica en esta versión lo que antes vivía repartido entre `PRODUCTION_READINESS_V2.md`, `RELEASE_READINESS_V1.md` y `PLAY_CONSOLE_CHECKLIST.md` (históricos, superseded, no se editan) |
| **Fecha de corte** | 2026-08-13 |
| **Documentos de los que depende** | `docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md`, `docs/program/DECISION_QUEUE.md`, `docs/program/CURRENT_SPRINT.md`, `docs/release/RELEASE_CHECKLIST.md`, `docs/release/LAUNCH_CHECKLIST.md`, `docs/analysis/EPIC-01_COMPLETION_REVIEW.md`, `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, `docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md`, `docs/product/BACKLOG_PRODUCT.md`, `docs/product/BACKLOG_TECH.md`, más verificación directa de código (`mobile/eas.json`, `mobile/app.json`, `mobile/assets/`, `docs/screenshots/`, `api/src/middleware/auth.ts`, `api/src/routes/health.ts`, `docs/privacy-policy.html`) y de los endpoints reales en producción (`/api/health`, `/api/search?debug=1`, la URL pública de la Política de Privacidad) |
| **Método** | Lectura íntegra de los 9 documentos exigidos para GO LIVE 1.0 + verificación directa en código y en producción de cada afirmación que ese conjunto de documentos dejaba abierta o desactualizada — nunca se asumió un estado sin evidencia nueva. Detalle completo en §4.1-§4.2 |
| **Pregunta que responde** | ¿Puede ComparaFarma publicarse esta semana en Producción en Google Play? |

---

## 2. Propósito

Responder, con evidencia verificable y sin suavizar conclusiones, si ComparaFarma puede publicarse en Producción **esta semana**. Este documento es la base de la decisión formal de lanzamiento. No propone funcionalidad nueva, no diseña nada, no abre deuda técnica que no sea ya un bloqueador real de publicación.

---

## 3. Alcance

**Este documento define:** un veredicto de preparación para producción con su Readiness Score recalculado y justificado; la lista depurada de Production Blockers reales; el estado de Google Play, de la Aplicación y de la Infraestructura; los riesgos abiertos separados por severidad; un Plan de cierre de acciones exclusivamente pendientes; y una recomendación ejecutiva formal (GO / GO CON CONDICIONES / NO GO).

**Este documento NO define:** cambios de código, arquitectura, nuevas Épicas, nuevos documentos, backlog de producto, ni deuda técnica que no bloquee esta publicación específica — eso queda fuera de alcance por instrucción explícita de esta actualización (GO LIVE 1.0).

**Nota de alcance importante (evidencia, no suposición):** el trabajo de Identidad de EPIC-01 (`docs/analysis/EPIC-01_COMPLETION_REVIEW.md`) y la estrategia de convergencia (`docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md`) **no forman parte de esta publicación**. Ambos viven en la rama `mobile/identity-foundation-task-001`, sin mergear a `main` y sin push al repositorio remoto (confirmado hoy vía `git ls-remote --heads origin`, que no lista esa rama). La versión de `mobile/` que se publicaría esta semana es la de `main` — 100% anónima, sin Login/Registro/Logout/sesión de usuario, exactamente como la describe `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md` §1.12. Este documento evalúa esa versión, no la de la rama de Identidad.

---

## 4. Contenido principal

### 4.1 Executive Summary

**Actualización 2026-08-13:** la aplicación ya fue aprobada y publicada en Producción de Google Play — confirmado por el CTO. El contenido original de esta sección (evaluación previa a la publicación) se conserva íntegro debajo como registro histórico del análisis que llevó a esa publicación; las tareas que dependían del acto de publicar quedaron retiradas de §4.8 (ver actualización 3.0 al inicio del documento) y el veredicto de §4.9 se actualizó.

**¿Estamos realmente listos para Producción?** Sí, con condiciones — y son condiciones de ejecución (confirmaciones y decisiones de un día), no de desarrollo.

Los dos únicos bloqueadores que alguna vez fueron clasificados `BLOCKER` binario de plataforma — Data Safety y Content Rating (IARC) — siguen resueltos y verificados por Mario directamente en Play Console desde RELEASE-003 (2026-08-06); no se encontró ninguna regresión ni contradicción nueva. Verificando hoy en código, **no se encontró ningún impedimento técnico adicional que impida completar el flujo de publicación** en Play Console esta semana: la app tiene un ícono válido, un feature graphic válido, 3 screenshots (el mínimo de Play es 2), la Política de Privacidad pública responde `200` y ya describe correctamente Sentry y PostHog, `versionCode`/`versionName` son consistentes, y el `?debug=1` de la API sigue cerrado por diseño sin excepción (`api/src/middleware/auth.ts`, función `isDebugAuthorized`, sin fallback abierto — confirmado en código hoy).

Lo que sí queda abierto, y por lo que este documento no emite un GO sin condiciones, es una lista corta y acotada de confirmaciones/decisiones, ninguna de desarrollo de software (detalle completo en §4.8, Plan de cierre): confirmar el mecanismo real de submit (`mobile/eas.json` sigue apuntando al track `"internal"`, riesgo solo si se usa `eas submit` en vez del método manual ya documentado como preferido en `CLAUDE.md`), resolver cuál de los dos archivos de ícono y cuál de los dos de feature graphic es el vigente (ambos duplicados siguen presentes en el repositorio, confirmado hoy), confirmar `API_SECRET_KEY` en el Vercel de producción de `api/`, y redactar las Release Notes de esta primera publicación (sin evidencia de que existan, confirmado en `docs/release/LAUNCH_CHECKLIST.md`).

**Readiness Score recalculado: 68%** (metodología y justificación completas en §4.3 — no es el mismo cálculo ni el mismo alcance que el 61% de la versión 1.0, no se reutiliza ese número).

**Veredicto: 🟡 GO CON CONDICIONES** (fundamentación completa en §4.9).

### 4.2 Auditoría realizada para esta actualización

Documentos leídos íntegros antes de esta actualización:

- **Gobierno:** `docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md`, `docs/program/DECISION_QUEUE.md`, `docs/program/CURRENT_SPRINT.md`.
- **Release:** `docs/release/RELEASE_CHECKLIST.md`, `docs/release/LAUNCH_CHECKLIST.md`, y esta misma versión 1.1 de `docs/launch/PRODUCTION_READINESS_REVIEW.md` antes de reemplazar su sección 4.
- **Arquitectura:** `docs/analysis/EPIC-01_COMPLETION_REVIEW.md`, `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, `docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md`.
- **Backlog:** `docs/product/BACKLOG_PRODUCT.md`, `docs/product/BACKLOG_TECH.md`.

Código y producción verificados directamente hoy (no asumidos desde documentación anterior):

- `mobile/eas.json` — `submit.production.android.track` sigue en `"internal"`.
- `mobile/app.json` — `versionCode: 31`, `version: "1.4.0"` (idéntico en `main`, confirmado con `git show main:mobile/app.json`).
- `api/src/middleware/auth.ts` — `isAuthorized()` sigue con fallback abierto si `API_SECRET_KEY` no está configurada; `isDebugAuthorized()` sigue sin fallback abierto (fail-closed) — confirma que el endurecimiento de REL-002 sigue vigente en el código.
- `mobile/assets/` — `icon.png` e `icon_new.png` coexisten; `feature-graphic.png` (en `mobile/assets/`) y `feature_graphic.png` (en `docs/screenshots/`) coexisten.
- `docs/screenshots/` — 3 archivos (`screenshot_1_home.png`, `screenshot_2_results.png`, `screenshot_3_detail.png`).
- `git ls-remote --heads origin` — la rama `mobile/identity-foundation-task-001` no está en el remoto; `git branch --show-current` confirma que sigue siendo trabajo local únicamente.
- `GET https://comparafarma-api.vercel.app/api/health` (producción real) → `200`, `{"ok":true,"service":"comparafarma-api","timestamp":"..."}`. **Hallazgo nuevo:** esta respuesta no incluye los campos `commit`/`dependencies`/`uptimeSeconds` que `docs/release/RELEASE_CHECKLIST.md` y `docs/release/LAUNCH_CHECKLIST.md` asumen disponibles (ambos instruyen "confirmar que `commit` coincide con el SHA desplegado" y revisar `dependencies.supabase`/`dependencies.redis`). Verificado con `git show HEAD:api/src/routes/health.ts`: el código de `health.ts` en el HEAD real de `main` es la versión simple original — el enriquecimiento de RC-03 (que sí existe en el working tree de este sandbox, `git diff --stat HEAD` lo confirma) **nunca se commiteó, nunca se pusheó y nunca se desplegó**. Es un hallazgo de esta auditoría, no un cambio realizado por este informe — ese archivo pertenece al conjunto de cambios sin commitear ya preexistente en este entorno de trabajo (ver `git status`) y no fue tocado.
- `GET https://enarhos.github.io/appComparaFarma/privacy-policy.html` (producción real) → `200`. Contenido vigente (actualizado 30 de junio de 2026) ya menciona explícitamente Sentry y PostHog — **resuelve en sustancia la preocupación de DQ-010** (`docs/program/DECISION_QUEUE.md`: "la política de privacidad actual no menciona PostHog"), aunque `DECISION_QUEUE.md` no fue actualizado para reflejarlo (no se modifica ese documento desde este informe). **Hallazgo nuevo, distinto:** la misma política afirma textualmente "no solicita nombre, correo electrónico... ni ningún otro dato que permita identificar directamente a una persona", pero el formulario de feedback de la app (`mobile/src/app/about.tsx` → `POST /api/feedback`, confirmado en `CURRENT_PLATFORM_ASSESSMENT.md` §1.3) sí incluye un campo de email opcional que se envía al backend. Es una inconsistencia real entre el texto público y el comportamiento real de la app — ver Riesgos (§4.7).
- `docs/product/DECISION_QUEUE.md` — DQ-008 (cierre de Data Safety) sigue registrada como "pendiente" en ese documento pese a que `PRODUCTION_READINESS_REVIEW.md` v1.1 ya la había marcado Resuelta (RELEASE-003) — mismo patrón de Decisión-no-cerrada-en-su-documento-de-origen ya señalado como lección aprendida en `EPIC-01_COMPLETION_REVIEW.md` §11. No se modifica `DECISION_QUEUE.md` desde este informe; se señala como riesgo de gobernanza (§4.7).

Ningún documento fue modificado durante esta auditoría, salvo el propio `PRODUCTION_READINESS_REVIEW.md` que esta actualización reemplaza.

### 4.3 Production Blockers

Se retiran de esta lista los bloqueadores ya resueltos y verificados en versiones anteriores — quedan solo como referencia histórica en el Control de Cambios (§9), no se repiten aquí: **Data Safety** y **Content Rating (IARC)** (ambos `BLOCKER` binarios de plataforma, resueltos y verificados por Mario en RELEASE-003, sin regresión encontrada hoy); y **PB-6 Identidad visual no decidida** (resuelto en sustancia desde `PROJECT-001`, DD-002 — irrelevante para esta publicación de todos modos, ya que no bloquea técnicamente el submit).

Tras la verificación de código de hoy (§4.2), **no se encontró ningún bloqueador nuevo** ni ningún bloqueador que impida técnicamente completar el flujo de publicación en Play Console.

**Actualización 2026-08-13 — resuelto por publicación:** el único ítem con relación condicional de bloqueo (`mobile/eas.json`: `submit.production.android.track` en `"internal"`, riesgo solo si se usaba `eas submit` sin corregir) queda cerrado — la app ya se publicó (confirmado por el CTO), por lo tanto el mecanismo de submit efectivamente usado ya no es un bloqueador abierto. Se retira de la tabla activa; el detalle histórico queda en el Control de Cambios (§9).

Todos los demás ítems que en versiones anteriores figuraban como `HIGH` (confirmación de `API_SECRET_KEY`, ambigüedad de assets, screenshots insuficientes, Release Notes) se evaluaron hoy contra el criterio estricto de esta actualización ("¿impide completar el submit en Play Console?") y **ninguno lo hace de forma dura** — Play Console permite completar el flujo con los archivos actuales (existe un ícono válido, un feature graphic válido, y 3 screenshots superan el mínimo de 2 exigido por la plataforma). Se mueven a Riesgos (§4.7) y al Plan de cierre (§4.8), no permanecen como "Blocker", consistente con la instrucción de esta actualización de no listar como bloqueador algo que no bloquea realmente.

### 4.4 Readiness Score

**68%.** Recalculado desde cero, con una metodología y un alcance distintos a la versión 1.0/1.1 — no es el mismo número ni es comparable directamente.

**Metodología:** se evaluaron únicamente los tres bloques de este documento con relevancia directa para publicar esta semana (Google Play, Aplicación, Infraestructura — §4.5-4.7 de la versión anterior de este documento, ahora §4.5-4.6 de esta versión), cada ítem puntuado Resuelto = 1, Parcial = 0.5, Pendiente = 0, excluyendo explícitamente los ítems marcados "No aplica a esta versión" (Login/Registro/Logout/Persistencia de sesión — pertenecen a la rama de Identidad, no a esta publicación, ver §3). Se promedia por categoría y luego se pondera: Google Play 50% (es literalmente lo que falta para publicar), Infraestructura 30% (afecta la estabilidad y observabilidad post-lanzamiento), Aplicación 20% (ya funciona completa, pesa menos porque no es donde está el trabajo pendiente).

| Categoría | Ítems evaluados | Puntaje | Peso | Contribución |
|---|---|---|---|---|
| Google Play (§4.5) | 14 ítems (8 Resueltos, 1 Parcial, 5 Pendientes) | 8.5/14 = 60.7% | 50% | 30.4 |
| Infraestructura (§4.6) | 5 ítems aplicables (2 Resueltos, 2 Parciales, 1 Pendiente) | 3/5 = 60% | 30% | 18.0 |
| Aplicación (§4.6, primera tabla) | 6 ítems aplicables, todos Resueltos | 6/6 = 100% | 20% | 20.0 |
| **Total** | | | | **68.35% ≈ 68%** |

No se recalcula ni se compara contra el 61% de la versión 1.0 — ese número se calculó sobre un checklist distinto (incluía Brand/Design/Legal/CI-CD con otro peso relativo) que esta actualización, por instrucción explícita de GO LIVE 1.0, no reproduce.

### 4.5 Google Play

| Ítem | Estado | Evidencia |
|---|---|---|
| Data Safety | ✅ Resuelto | Verificado por Mario en Play Console (RELEASE-003); sin regresión encontrada hoy |
| Content Rating (IARC) | ✅ Resuelto | Ídem |
| Privacy Policy — declaración en Play Console | ✅ Resuelto | Verificado por Mario (RELEASE-003) |
| Privacy Policy — documento público | ✅ Resuelto | `https://enarhos.github.io/appComparaFarma/privacy-policy.html` responde `200` hoy; contenido ya menciona Sentry y PostHog explícitamente (verificado hoy). Nota aparte, no bloqueante: inconsistencia real con el campo de email del formulario de feedback — ver Riesgos §4.7 |
| Datos de inicio de sesión / acceso a la app | ✅ Resuelto | Verificado por Mario (RELEASE-003) |
| Anuncios | ✅ Resuelto | Verificado por Mario (RELEASE-003) |
| Contenido y audiencia objetivo | ✅ Resuelto | Verificado por Mario (RELEASE-003) |
| Versionado (`versionCode`/`versionName`) | ✅ Resuelto | `31`/`1.4.0`, confirmado hoy en `mobile/app.json` de `main`, consistente |
| Deep Links | No aplica | Esquema `comparafarma://` declarado en `app.json`/`AndroidManifest.xml`, sin lógica de enrutamiento en código y sin uso real en esta versión (`CURRENT_PLATFORM_ASSESSMENT.md` §1.2) — no se usa ni se necesita para esta publicación |
| Store Listing — descripción | 🟡 Parcial | Riesgo heredado sin confirmación posterior: posible mención de solo 4 farmacias en vez de 9 (`PLAY_CONSOLE_CHECKLIST.md` R-9, sin evidencia de corrección) |
| App Icon | 🔴 Pendiente | `mobile/assets/icon.png` e `icon_new.png` coexisten hoy — confirmado en código; existe un archivo válido, pero no está confirmado cuál es el vigente en Play Console |
| Feature Graphic | 🔴 Pendiente | `mobile/assets/feature-graphic.png` vs. `docs/screenshots/feature_graphic.png` coexisten hoy — mismo caso |
| Screenshots | 🔴 Pendiente | 3 de 5-6 recomendados (mínimo de Play, 2, ya está cubierto) |
| Release Notes | 🔴 Pendiente | Sin evidencia de que existan (`LAUNCH_CHECKLIST.md` §1: "sin borrador previo que verificar") |
| Track de submit (`eas.json`) | 🔴 Pendiente | Ver §4.3 |

**Resuelto/Parcial/Pendiente:** 8 Resueltos, 1 Parcial, 5 Pendientes (14 ítems aplicables, excluye Deep Links) — **estado al 2026-08-07**, conservado como registro histórico de la evaluación previa a publicar.

**Actualización 2026-08-13 — publicación completada:** confirmado por el CTO que la app fue aprobada y publicada en Producción. Todos los ítems de esta tabla que eran tareas de publicación (App Icon, Feature Graphic, Screenshots, Release Notes, Track de submit, Store Listing) se retiran del Plan de cierre (§4.8) — no se re-audita cuál ícono/feature graphic/copy específico quedó cargado en Play Console, por estar fuera del alcance de esta actualización (solo confirma que la publicación ocurrió). Si en el futuro se decide mejorar el contenido del Store Listing (mención de las 9 farmacias, disclaimer médico, screenshots adicionales), es trabajo de Producto sobre una app ya publicada, no un pendiente de publicación — se registraría como un ítem nuevo si el CTO/Producto lo decide, no se conserva aquí.

### 4.6 Aplicación e Infraestructura

**Aplicación** (clasificado: Producción lista / Parcial / Pendiente / No aplica a esta versión):

| Capacidad | Clasificación | Evidencia |
|---|---|---|
| Bootstrap (arranque de la app) | ✅ Producción lista | `_layout.tsx` en `main` resuelve config y alertas al arrancar, sin bloquear el render — es el bootstrap real de la versión que se publica, distinto del Bootstrap de Identity/Entitlement construido en EPIC-01 (que vive solo en la rama sin mergear) |
| Login | **No aplica a esta versión** | No existe en `main` — es una capacidad de la rama `mobile/identity-foundation-task-001`, sin mergear (`CURRENT_PLATFORM_ASSESSMENT.md` §1.12; `EPIC-01_COMPLETION_REVIEW.md` §9) |
| Registro | **No aplica a esta versión** | Idéntica razón |
| Logout | **No aplica a esta versión** | Idéntica razón |
| Persistencia (de sesión de usuario) | **No aplica a esta versión** | Idéntica razón — distinta de la persistencia local de datos (favoritos/historial/carrito/alertas), que sí es parte de esta versión y se evalúa en sus propias filas |
| Modo anónimo | ✅ Producción lista | Es el comportamiento íntegro de la app que se publica — 100% funcional sin identidad, confirmado en `CURRENT_PLATFORM_ASSESSMENT.md` §1 |
| Comparación (búsqueda/resultados/ficha/carrito) | ✅ Producción lista | Núcleo de producto, sin cambios desde la v1.1; `api/api/search` responde `200` con resultados reales hoy (verificado) |
| Historial (de búsquedas) | ✅ Producción lista | Local, `historyStore.ts`, sin cambios |
| Favoritos | ✅ Producción lista | Local, `favoritesStore.ts`, sin cambios |
| Alertas | ✅ Producción lista | Local, in-app, `alertsStore.ts`, sin cambios — distinta del mecanismo de Alertas por email de `web/`, que no aplica a esta publicación de `mobile/` |

Ítems aplicables a esta publicación (excluyendo los 4 "No aplica"): 6/6 clasificados Producción lista.

**Infraestructura** (solo lo que afecta esta publicación):

| Ítem | Estado | Evidencia |
|---|---|---|
| Vercel (`comparafarma-api`, `comparafarma-web`) | ✅ Resuelto | `GET /api/health` y `GET /api/search?q=paracetamol` responden `200` en producción real hoy |
| API (búsqueda, 9 farmacias) | ✅ Resuelto | Monitoreado cada hora (`monitor-api.yml`), sin incidentes reportados en la documentación auditada |
| Supabase (disponibilidad) | 🟡 Parcial | La app funciona (búsqueda no depende de Supabase para su función core), pero no se puede confirmar el estado de la dependencia en vivo — ver hallazgo del healthcheck no enriquecido en producción (§4.2) |
| Secrets (`CRON_SECRET`, `GOOGLE_RTDN_SECRET`, `FLOW_*`, `SENTRY_DSN`) | 🟡 Parcial | No verificables individualmente desde el repositorio; los que son fail-closed por diseño (`CRON_SECRET`, `GOOGLE_RTDN_SECRET`) no representan riesgo si faltan (solo dejan de funcionar esas rutas, no exponen nada) |
| `API_SECRET_KEY` (variable crítica) | 🔴 Pendiente | Sin confirmación directa en el dashboard de Vercel de producción; `isAuthorized()` en `api/src/middleware/auth.ts` sigue con fallback abierto si falta (confirmado en código hoy) — la superficie de mayor riesgo (`?debug=1`) ya está cerrada sin excepción por `isDebugAuthorized()` (fail-closed, confirmado hoy) |
| Redirect URLs de Supabase Auth | No aplica | Solo relevante para el flujo de Registro de la rama de Identidad, que no forma parte de esta publicación (ver §3) |

Ítems aplicables (excluyendo Redirect URLs): 5. Resuelto = 1 (Vercel) + 1 (API) = 2; Parcial = 2 (Supabase, Secrets) = 1; Pendiente = 1 (`API_SECRET_KEY`) = 0. Puntaje: 3/5 = 60%.

### 4.7 Riesgos

**Bloqueantes.** Ver §4.3 — el único ítem con relación de bloqueo (condicional) ya está listado ahí; no se duplica aquí.

**Riesgos altos:**

- **`API_SECRET_KEY` sin confirmación en Vercel de producción.** Si no está configurada, `isAuthorized()` deja `/api/search` y el resto de endpoints generales sin protección de clave de servicio (aunque el endpoint de diagnóstico más sensible, `?debug=1`, ya está cerrado sin excepción). Riesgo operacional/de costo (exposición a scraping/abuso), no de publicación.
- **Ambigüedad de archivos canónicos de Google Play (ícono, feature graphic).** Ambos duplicados siguen presentes en el repositorio (confirmado hoy). No impide el submit, pero sí el riesgo real de publicar la versión visual equivocada.
- **Inconsistencia entre la Política de Privacidad pública y el comportamiento real de la app.** El texto vigente afirma que la app no solicita correo electrónico, pero el formulario de feedback (`about.tsx` → `/api/feedback`) tiene un campo de email opcional que se envía al backend (hallazgo nuevo de esta auditoría, §4.2). Riesgo legal/de precisión, no de submission técnico.
- **Healthcheck enriquecido de RC-03 nunca desplegado a producción.** El código que reportaría el estado de Supabase/Redis/Algolia (`api/src/routes/health.ts`) existe solo sin commitear en este entorno de trabajo — la producción real responde con el formato simple original (hallazgo nuevo, §4.2). Reduce la visibilidad operativa post-lanzamiento; no bloquea el submit.
- **Store Listing — descripción sin confirmación de que mencione las 9 farmacias.** Riesgo heredado, sin verificación posterior a `PLAY_CONSOLE_CHECKLIST.md` (2026-08-02).
- **Riesgo de gobernanza recurrente.** DQ-008 (`DECISION_QUEUE.md`) sigue registrada como pendiente pese a que Data Safety ya está resuelto y verificado — mismo patrón de decisiones no cerradas en su documento de origen ya señalado en `EPIC-01_COMPLETION_REVIEW.md` §11. No se corrige aquí (no se modifica `DECISION_QUEUE.md` desde este informe).

**Riesgos menores:**

- Screenshots (3 de 5-6 recomendados) — no bloqueante, afecta conversión en la ficha de la tienda.
- Sin video promocional — no exigido por Play, mejora opcional sin antecedente de estar en desarrollo (`DECISION_QUEUE.md` DQ-006).
- `buildNumber` de iOS (30) desalineado con `versionCode` de Android (31) — cosmético, sin builds de iOS en curso conocidos.
- `docs/release/RELEASE_CHECKLIST.md` y `docs/release/LAUNCH_CHECKLIST.md` tienen su "Registro de uso" vacío — nunca se ha ejecutado un release real siguiendo el proceso formal ya documentado; riesgo de proceso, no de producto.
- Sin Términos de Servicio publicados (heredado, sin cambios) — riesgo legal de fondo, no bloqueante de esta publicación específica en Play Console.

### 4.8 Plan de cierre

Exclusivamente acciones pendientes — ninguna ya resuelta, ninguna mejora futura, ninguna deuda técnica post-producción (esas viven en `docs/product/BACKLOG_TECH.md` y no se repiten aquí).

**Actualización 2026-08-13:** confirmado por el CTO que la app ya fue aprobada y publicada en Producción de Google Play. Se retiran de esta tabla, por completo, las tareas cuyo único propósito era completar esa publicación (mecanismo de submit, ambigüedad de ícono/feature graphic, Release Notes, promoción de track y subida del AAB, descripción de Store Listing, disclaimer médico, screenshots adicionales) — dejaron de ser pendientes. Quedan únicamente las dos tareas que no eran sobre el mecanismo de publicación en sí:

| Prioridad | Tarea | Responsable | Esfuerzo | Categoría |
|---|---|---|---|---|
| Alta | Confirmar `API_SECRET_KEY` en Vercel de producción (`comparafarma-api` → Settings → Environment Variables) | CTO | Bajo | Operación de Plataforma |
| Baja | Corregir el texto de la Política de Privacidad pública para reflejar con precisión el campo de email opcional del formulario de feedback | CTO | Bajo | Producto |

### 4.9 Veredicto

**🟢 GO — PUBLICADO**

**Actualización 2026-08-13:** confirmado por el CTO que la aplicación fue aprobada y publicada en Producción de Google Play. El veredicto `GO CON CONDICIONES` de la versión 2.0 (fundamentación original conservada debajo como registro histórico) queda superado por ese hecho — las condiciones que lo motivaban eran, precisamente, completar el flujo de publicación. Quedan dos pendientes sin relación con la publicación en sí (§4.8: `API_SECRET_KEY`, texto de Política de Privacidad), que no cambian este veredicto.

**Fundamentación original (versión 2.0, 2026-08-07 — histórica, no editada):**

1. Los dos bloqueadores binarios de plataforma (Data Safety, Content Rating/IARC) están resueltos y verificados directamente por Mario en Play Console — confirmado sin regresión en esta auditoría.
2. Verificando código real hoy, no se encontró ningún impedimento técnico que impida completar el flujo de publicación en Play Console: existe un ícono válido, un feature graphic válido, 3 screenshots (superan el mínimo de 2 de la plataforma), la Política de Privacidad pública responde `200` y describe correctamente Sentry/PostHog, y la superficie de mayor riesgo de la API (`?debug=1`) permanece cerrada sin excepción por diseño.
3. No se emite un GO sin condiciones porque quedan 4 acciones de prioridad Alta genuinamente sin cerrar (§4.8) — confirmar el mecanismo de submit, resolver la ambigüedad de assets, confirmar `API_SECRET_KEY`, y redactar las Release Notes — ninguna de desarrollo de software, todas ejecutables el mismo día.
4. No se emite un NO GO porque ninguna de esas 4 acciones representa, con la evidencia disponible hoy, un bloqueo real del flujo técnico de publicación — son confirmaciones y decisiones, no trabajo de ingeniería pendiente.

---

## 5. Relaciones

Este documento reemplaza, como fuente única de la evaluación GO/NO-GO, el contenido disperso que antes vivía en `docs/release/PRODUCTION_READINESS_V2.md`, `RELEASE_READINESS_V1.md` y `PLAY_CONSOLE_CHECKLIST.md` (históricos, no editados, no eliminados). Se apoya en `docs/release/RELEASE_CHECKLIST.md` (checklist técnica recurrente) y `docs/release/LAUNCH_CHECKLIST.md` (guía específica del evento de lanzamiento) sin repetir su contenido operativo. Es insumo directo de `docs/program/PROGRAM_BOARD.md`/`CURRENT_SPRINT.md` (Workstream B, Google Play) y de `docs/product/DECISION_QUEUE.md` (DQ-008, DQ-009, DQ-012), aunque esta actualización no modifica ninguno de esos documentos.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Estado de Gobierno del programa | `docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md`, `DECISION_QUEUE.md`, `CURRENT_SPRINT.md` | ✔ auditado íntegro (§4.2) | Confirma que "Production Release 1.0" sigue siendo el sprint activo, Workstream B (Google Play) es el relevante para este documento |
| Checklists de release/lanzamiento | `docs/release/RELEASE_CHECKLIST.md`, `LAUNCH_CHECKLIST.md` | ✔ auditado íntegro (§4.2) | Ambos con "Registro de uso" vacío — nunca ejecutados en un release real (riesgo menor, §4.7) |
| Estado de EPIC-01 (Identidad) | `docs/analysis/EPIC-01_COMPLETION_REVIEW.md` | ✔ auditado, confirmado fuera de alcance de esta publicación (§3) | Rama sin mergear, sin push — verificado hoy con `git ls-remote` |
| Estado de la plataforma actual | `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md` | ✔ auditado, usado para clasificar Aplicación (§4.6) | — |
| Estrategia de convergencia | `docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md` | ✔ auditado, confirmado fuera de alcance (§3) | No aplica a esta publicación — es trabajo posterior |
| Backlog de producto y deuda técnica | `docs/product/BACKLOG_PRODUCT.md`, `BACKLOG_TECH.md` | ✔ auditado íntegro (§4.2) | TECH-001/TECH-002 no se repiten aquí — son deuda de la rama de Identidad, no de esta publicación |
| Verificación directa de código/producción | `mobile/eas.json`, `mobile/app.json`, `mobile/assets/`, `api/src/middleware/auth.ts`, `api/src/routes/health.ts`, endpoints reales | ✔ (§4.2-4.7) | Fuente primaria de todos los hallazgos nuevos de esta actualización |

---

## 7. Gobierno

Este documento es la fuente oficial de la evaluación de preparación para producción a su fecha de corte. Esta actualización (GO LIVE 1.0) reemplaza la sección 4 de la versión 1.1 en su totalidad, sin editar retroactivamente las conclusiones ya cerradas de versiones anteriores — esas quedan documentadas en el Control de Cambios (§9). Cuando cambien las condiciones materiales descritas aquí (por ejemplo, se resuelva alguna de las 4 tareas de prioridad Alta del Plan de cierre), corresponde emitir una nueva versión, no editar esta.

Este documento no propone cambios de código, RFCs, ADRs, nuevas Épicas, nuevos documentos ni deuda técnica que no sea ya un bloqueador real de esta publicación — por instrucción explícita de GO LIVE 1.0.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/release/PRODUCTION_READINESS_V2.md`, `RELEASE_READINESS_V1.md`, `PLAY_CONSOLE_CHECKLIST.md` (históricos), `docs/release/RELEASE_CHECKLIST.md`, `LAUNCH_CHECKLIST.md`, `docs/program/PROGRAM_BOARD.md`, `CURRENT_SPRINT.md`, `DECISION_QUEUE.md`, `docs/project/PROJECT_STATUS.md`, `docs/analysis/EPIC-01_COMPLETION_REVIEW.md`, `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, `docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md`, `docs/product/BACKLOG_PRODUCT.md`, `BACKLOG_TECH.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-06 | Activo | Pendiente (CEO/fundador) | Creación inicial — Production Readiness Review completa: mobile, web, api, infraestructura, CI/CD, seguridad, privacidad, legal, brand, design, Google Play y programa, con verificación cruzada documentación-vs-implementación. Clasificación: NOT READY (61%). | Ver Matriz de Trazabilidad histórica |
| 1.1 | 2026-08-06 | Activo | Pendiente (CEO/fundador) | Sprint `RELEASE-003` — reconciliación aditiva (no re-auditoría). PB-1 (Data Safety) y PB-2 (Content Rating/IARC) marcados **Resueltos** por verificación directa de Mario en Google Play Console; PB-6 (identidad visual) marcado **Resuelto en sustancia**. PB-3, PB-4, PB-5 sin cambios. Clasificación actualizada a `AUTORIZO PUBLICACIÓN CON CONDICIONES`. | Verificación directa del propietario en Play Console |
| 2.0 | 2026-08-07 | Activo | Pendiente (CEO/fundador) | **GO LIVE 1.0.** Reescritura completa de la sección 4: Readiness Score recalculado desde cero con nueva metodología explícita (68%, no comparable al 61% anterior); Production Blockers depurados (retirados los ya resueltos, ningún bloqueador nuevo encontrado, solo un ítem condicional); nueva verificación directa de código y de producción (confirmó `eas.json` sin corregir, duplicación de assets sin resolver, `auth.ts` sin cambios, healthcheck enriquecido de RC-03 nunca desplegado — hallazgo nuevo, y una inconsistencia nueva entre la Política de Privacidad pública y el campo de email del formulario de feedback); explicitó que EPIC-01 (Identidad) y la Estrategia de Convergencia no forman parte de esta publicación (rama sin mergear, sin push, confirmado con `git ls-remote`); Plan de cierre reconstruido como tabla única de acciones exclusivamente pendientes; Veredicto actualizado a `GO CON CONDICIONES`, fundamentado íntegramente con evidencia de esta auditoría. | `docs/project/PROJECT_STATUS.md`, `docs/program/PROGRAM_BOARD.md`, `DECISION_QUEUE.md`, `CURRENT_SPRINT.md`, `docs/release/RELEASE_CHECKLIST.md`, `LAUNCH_CHECKLIST.md`, `docs/analysis/EPIC-01_COMPLETION_REVIEW.md`, `CURRENT_PLATFORM_ASSESSMENT.md`, `docs/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md`, `docs/product/BACKLOG_PRODUCT.md`, `BACKLOG_TECH.md`, verificación directa de código y de producción |
| **3.0** | **2026-08-13** | **Activo** | **Pendiente (CEO/fundador)** | **PUBLICACIÓN COMPLETADA.** Confirmado por el CTO (Sprint "Operational Hardening 1.0") que la app fue aprobada y publicada en Producción de Google Play. Se retiran del Plan de cierre (§4.8) todas las tareas cuyo único propósito era completar esa publicación (mecanismo de submit, ambigüedad de ícono/feature graphic, Release Notes, promoción de track y subida del AAB, descripción de Store Listing, disclaimer médico, screenshots adicionales) — pasan a ser historia, no pendientes. Se conservan únicamente las dos tareas de §4.8 sin relación con el mecanismo de publicación (`API_SECRET_KEY`, texto de Política de Privacidad), reclasificadas como Operación de Plataforma y Producto respectivamente. Veredicto actualizado de `GO CON CONDICIONES` a `GO — PUBLICADO` (§4.9). Ningún contenido de las versiones 1.0/1.1/2.0 se edita retroactivamente — se agregan notas de actualización fechadas junto al contenido histórico. | Confirmación directa del CTO (2026-08-13); Sprint "Operational Hardening 1.0" |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-06 | Ejecución de la Production Readiness Review más completa del programa a la fecha | CTO / Release Manager / QA Director / Product Owner | `docs/launch/PRODUCTION_READINESS_REVIEW.md` v1.0 (este documento) |
| 2026-08-06 | Sprint `RELEASE-003` — reconciliación de Production Blockers contra verificación directa en Google Play Console | Release Manager | `docs/launch/PRODUCTION_READINESS_REVIEW.md` v1.1 |
| 2026-08-07 | GO LIVE 1.0 — recálculo completo del Readiness Score, depuración de Production Blockers, verificación directa de código y de producción, Plan de cierre reconstruido, nuevo veredicto GO CON CONDICIONES | CTO / Release Manager / QA Director / Product Owner | `docs/launch/PRODUCTION_READINESS_REVIEW.md` v2.0 |
| 2026-08-13 | PUBLICACIÓN COMPLETADA — confirmación del CTO de que la app fue aprobada y publicada en Producción; retiro de las tareas de publicación ya cumplidas del Plan de cierre; veredicto actualizado a GO — PUBLICADO | CTO | `docs/launch/PRODUCTION_READINESS_REVIEW.md` v3.0 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía sobre este documento como tal (la publicación en sí ya ocurrió y fue confirmada por el CTO). Quedan dos pendientes sin relación con el mecanismo de publicación (§4.8): confirmar `API_SECRET_KEY` en Vercel (Operación de Plataforma) y corregir el texto de la Política de Privacidad (Producto).
