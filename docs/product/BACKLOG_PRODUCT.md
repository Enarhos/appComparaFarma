# Backlog de Producto

Backlog vivo derivado de `PRODUCT_REVIEW_V1.md` (2026-06-30). Estado verificado contra el código real el 2026-07-19 — el review original ya estaba desactualizado (2 ítems se habían resuelto sin quedar registrados). Convención: ✅ Hecho · 🟡 Parcial (falta algo puntual) · ❌ Pendiente.

## v1.5 — Mejoras sin cambios de arquitectura

| # | Ítem | Impacto | Esfuerzo | Estado | Nota |
|---|---|---|---|---|---|
| v15-01 | Eliminar ícono de micrófono falso en SearchBar | Alto | Bajo | ✅ Hecho | Ya no existe en el código (verificado, sin fecha de commit identificada) |
| v15-02 | Tooltip de canales de precio en detalle | Alto | Medio | 🟡 Parcial | `PriceChannelSheet.tsx` existe y funciona, pero se dispara desde `results.tsx`, no desde la tarjeta de farmacia en `medication.tsx` como pedía el review |
| v15-03 | DonationBanner con descarte temporal (7 días), parametrizable en consola | Alto | Bajo | ✅ Hecho (2026-07-19) | Descarte ahora expira (`dismissDays`, default 7); además el banner completo se puede apagar remotamente con `DONATION_BANNER_ENABLED` en Vercel, mismo patrón que `DISABLED_PHARMACIES`. Servido vía `/api/config`. Verificado en emulador |
| v15-04 | Pantalla "Mis alertas" separada | Alto | Medio | ❌ Pendiente | Alertas solo se gestionan una por una desde el detalle de cada medicamento |
| v15-05 | Indicador de filtro activo en Resultados (chip dismissible) | Alto | Bajo | ✅ Hecho (2026-07-19) | Chips individuales por comuna/farmacias ocultas/solo despacho, cada uno con botón de cierre. Verificado en emulador |
| v15-06 | accessibilityLabel en componentes críticos | Alto | Medio | 🟡 Parcial | Solo `DonationBanner` tiene accessibility; faltan `MedicationListItem`, `SkeletonCard`, `SearchBar`, `PriceHistoryChart`, `AlertSheet`, `FilterSheet`, `InAppToast` |
| v15-07 | Mensaje en primer snapshot de historial de precio | Alto | Bajo | ✅ Hecho (2026-07-19) | Además se encontró y arregló una condición de carrera pre-existente en `medication.tsx` (`recordPriceSnapshot` no se esperaba antes de `getPriceHistory`) que impedía que esto funcionara incluso implementado. Verificado en emulador |
| v15-08 | Explicar "bioequivalente" in-context (tooltip) | Medio | Bajo | ❌ Pendiente | Solo badges, sin tooltip explicativo |
| v15-09 | Comunicar límite del carrito (5/8) | Medio | Bajo | ❌ Pendiente | El límite de 8 existe en `cartStore` pero no se comunica en la UI |
| v15-10 | Mostrar qué medicamento falta en cobertura parcial del carrito | Medio | Medio | 🟡 Parcial | Se muestra el conteo ("2 de 3") pero no el nombre del que falta |
| v15-11 | Versión de la app visible en "Acerca de" | Medio | Bajo | ✅ Hecho (2026-07-19) | `about.tsx` ahora muestra "v1.4.0 (31)" leyendo `app.json` directamente, verificado en emulador |
| v15-12 | Reestructurar pantalla "Acerca de" | Medio | Bajo | 🟡 Parcial | Ya tiene separadores visuales, pero sigue siendo una sola pantalla mezclando feedback + info institucional |
| v15-13 | Fix DonationBanner en dark mode | Medio | Bajo | ✅ Hecho | `dark:bg-rose-950` ya aplicado |
| v15-14 | Toast de confirmación de alerta con copy mejorado | Medio | Bajo | ❌ Pendiente | Solo hay feedback háptico, sin toast |
| v15-15 | Confirmación al salir de la app ("Ver en farmacia") | Bajo | Bajo | ❌ Pendiente | `Linking.openURL` directo, sin aviso previo |
| v15-16 | Refetch de `/api/config` al volver a foreground (o polling periódico) | Medio | Bajo | ❌ Pendiente — bloqueado | `_layout.tsx` solo llama `fetchConfig()` una vez al montar la app. Los cambios hechos desde `/admin/config` (ej. apagar el banner de donación) no se reflejan hasta cerrar la app por completo y reabrirla — verificado 2026-07-20. Requiere tocar `mobile/`, congelado por Prueba Cerrada de Google Play (ver restricción en `COMPANY_STRATEGY.md` §5) — retomar cuando se levante |

## v2.0 — Requiere backend/arquitectura nueva

Ver `PRODUCT_REVIEW_V1.md` sección 17 — no re-verificado contra código (son features nuevas, no fixes, así que es poco probable que ya existan). Los dos de mayor impacto: push notifications para alertas (`v20-01`) y tab bar de navegación persistente (`v20-02`).

## Confiabilidad Backend — scoreado CFPS (aditivo sobre `api/`, no toca `mobile/`)

| # | Ítem | CFPS | Clasificación | Nota |
|---|---|---|---|---|
| CF-111 | Investigar timeout persistente de AraucoMed en producción (Vercel) — issue completo en `docs/engineering/issues/CF-111_INVESTIGATE_ARAUCOMED_TIMEOUT.md` | 3.2 | ✅ Cerrado (2026-07-31) — monitoreo pasivo | VU=2 (1 de 9 farmacias, complementaria no top-4), VN=3 (confiabilidad de datos), DF=3, IE=4 (Objetivo 1: "cobertura estable de farmacias"), CT=4 (investigación simple, 1-2h), CM=4, RG=5 (aditivo, no toca otros clientes). Detectado 2026-07-19, sin resolver a 2026-07-28 (9 días). **Cerrado el 2026-07-31**: 5/5 corridas en producción con `araucomed` fulfilled, sin reproducir el timeout — no persistente, no se aplicó mitigación de código. Reabrir si reaparece con frecuencia (ahí sí revisar logs de Vercel, no disponibles en esta sesión). |

---

## Propuesta de negocio con propósito — Sprints 0–F (ratificado 2026-07-31)

Origen: Acta 2026-07-28 (sección 2), que dejó la secuencia **sin ratificar** a la espera de que el CTO la scoreara con CFPS antes de generar cualquier prompt de sprint (Regla 2 del `PRODUCT_DECISION_FRAMEWORK.md`). Esta sección cumple ese paso — el "Sprint 0" original.

### Scoring CFPS

| Sprint | Ítem | VU | VN | DF | IE | CT | CM | RG | **CFPS** | Clasificación |
|---|---|---|---|---|---|---|---|---|---|---|
| A | Identidad permanente de medicamento (CFM-ID) — `docs/engineering/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` | 2 | 3 | 2 | 5 | 4 | 4 | 5 | **3.2** | Media |
| B | Alternativas bioequivalentes más baratas en la ficha | 5 | 4 | 5 | 5 | 1 | 2 | 2 | **4.15** | Alta — **bloqueada, ver nota** |
| C | Alertas de precio por email en `web/` (sin tocar `mobile/`) | 4 | 4 | 3 | 4 | 3 | 3 | 4 | **3.65** | Media |
| D | Cuenta ligera en `web/` (extiende Supabase Auth de `/admin`) | 3 | 3 | 2 | 3 | 4 | 3 | 3 | **2.9** | Backlog futuro |
| E | Comparación de receta completa (multi-búsqueda + carrito server-side en `web/`) | 5 | 4 | 5 | 5 | 2 | 2 | 3 | **4.3** | Alta |
| F | Primer tier de Servicios Premium + primer dato para API Comercial | 2 | 5 | 3 | 3 | 2 | 2 | 2 | **2.85** | Backlog futuro |

### Estado de implementación

- **Sprint E** — ✅ Implementado y mergeado a `main` (2026-07-31, PR #29). "Mi receta" en `web/`: comparación de costo total entre comprar todo en una farmacia vs. repartir la compra, sin cuenta ni link para compartir (localStorage). Ver `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_E_RECETA_COMPLETA.md`.
- **Sprint A** — ✅ Implementado y mergeado a `main` (2026-07-31). RFC-002 (Fases 0–5) ejecutado: `cfmId` aditivo en `packages/domain`, `api/src/lib/medicationRegistry.ts` nuevo, wiring en `searchService.ts`, backfill en `priceHistoryDb.ts`/`clickTracking.ts`. Cero cambios en `mobile/`, cero cambios en `matchKey`/`mergeDuplicates`. SQL corrido por Mario en Supabase (2026-07-31) — el registro ya está activo en producción.
- **Sprint C** — ✅ Implementado (2026-07-31). Sin RFC previo (a diferencia de A y E) — diseño técnico completo en `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_C_ALERTAS_EMAIL.md`: tabla nueva `email_alerts` en Supabase, endpoint consolidado `api/api/alerts.ts` (create/confirm/unsubscribe/check vía query param `action`, deja el conteo de funciones serverless en 9/12 del plan Hobby), cron diario en GitHub Actions reusando el patrón ya probado de `update-branches.yml`. Sin cuenta de usuario — gestión de la alerta vía token en la URL. Decisión del CEO: usar el dominio sandbox de Resend por ahora (no bloquear el sprint por verificación de dominio propio). **Pendiente de Mario**: correr el SQL de `email_alerts` en Supabase (igual que Sprint A) y configurar los secrets `RESEND_API_KEY` y `CRON_SECRET` en Vercel + GitHub Actions antes de que las alertas funcionen de punta a punta en producción.

- **Sprint D** — ✅ Implementado (2026-08-02). Originalmente "Backlog futuro" (CFPS 2.9) por fragmentar la experiencia (cuenta solo en `web/`, sin sincronizar con `mobile/` mientras dure la Prueba Cerrada) — **reabierto a pedido explícito del CEO**, con alcance acotado: solo autenticación (email/contraseña, reusando Supabase Auth ya usado en `/admin`) + tabla `profiles` con campo `plan: 'free' | 'premium'` activable a mano desde `/admin/usuarios`. Sin flujo de pago todavía. **No se restringe ninguna función existente** (Sprint C/E siguen 100% gratis) — es solo la infraestructura para gatear funciones futuras. Entregado: tabla `profiles` + trigger `on_auth_user_created` + RLS (solo lectura propia) en `docs/database/schema.sql`; páginas `/cuenta/registro`, `/cuenta/ingresar`, `/cuenta` en `web/`; `auth/callback/route.ts` generalizado con `?next=` (100% compatible con el login de `/admin`); vista `/admin/usuarios` con toggle de plan (`profilesAdmin.ts`, con tests). **Pendiente de Mario**: correr la sección "Sprint D" de `docs/database/schema.sql` en el SQL Editor de Supabase antes de que el registro/login en `/cuenta` funcione en producción. Diseño en `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_D_CUENTA_LIGERA.md`.

## Subscription Platform — Fase 1: Motor de Suscripciones (registrado 2026-08-02)

Ver Epic completa en `docs/product/EPICS.md`. Origen: `docs/product/SUBSCRIPTION_STRATEGY.md` (estrategia ya aprobada) + pedido explícito del CEO de construir ya el motor técnico, independiente de proveedor de pago, reemplazando el `profiles.plan` simple de Sprint D.

### Scoring CFPS — Fase 1 solamente

| Ítem | VU | VN | DF | IE | CT | CM | RG | **CFPS** | Clasificación |
|---|---|---|---|---|---|---|---|---|---|
| Motor de Suscripciones (modelo de datos + servicio + adaptador Google Play + API, sin UI de compra) | 2 | 4 | 2 | 5 | 2 | 3 | 3 | **3.0** | Media |

**Razonamiento (Regla 4 del framework — problema, usuario, beneficio, métrica, riesgos):**

- **Problema:** hoy no existe ninguna fuente de verdad server-side sobre el estado Premium — `profiles.plan` (Sprint D) es un campo plano sin vigencia, sin proveedor, sin bitácora, activable solo a mano. No hay forma de soportar una compra real de ningún proveedor sin antes tener este modelo.
- **Usuario:** ninguno directo todavía — es infraestructura invisible, igual que Sprint A (CFM-ID). El usuario final la experimenta indirectamente el día que se activa un plan de pago real (Fase 2+).
- **Beneficio:** habilita todo el roadmap de monetización (Objetivo 5 de `ROADMAP.md`) sin atarse a Google Play como fuente de verdad — condición explícita del CEO y de `SUBSCRIPTION_STRATEGY.md`.
- **VU=2** (bajo — invisible, sin UI de compra en esta fase), **VN=4** (alto — es la base de toda monetización futura), **DF=2** (no diferencia frente a otras apps, es plomería), **IE=5** (muy alto — condición explícita del CEO y del roadmap), **CT=2** (no es simple: modelo de datos nuevo + servicio + adaptador + API), **CM=3** (mantención continua moderada — nuevas tablas, un adaptador de proveedor), **RG=3** (riesgo medio: `mobile/` congelado impide verificación end-to-end con una compra real; manejo de datos de pago exige cuidado extra, pero el diseño aditivo y sin tocar `mobile/` lo acota).
- **Métrica de éxito de esta fase:** `getEntitlement(userId)` responde correctamente para al menos un usuario con plan manual/cortesía y para el flujo de notificación de Google Play en un entorno de prueba (sandbox/test track), sin haber tocado `mobile/`.
- **Riesgos:** ver Epic en `EPICS.md` y detalle completo en RFC-003.

**Clasificación 3.0 (Media)** — mismo rango que Sprint A (CFM-ID, 3.2): infraestructura habilitante de bajo valor de usuario directo pero alto impacto estratégico. Ratificado por el CEO sin ajustes (2026-08-02).

### Estado de implementación

- **Subscription Platform — Fase 1** — ✅ Implementado y mergeado a `main` (2026-08-02). CF-112 a CF-116 cerrados: modelo de datos (`subscription_plans`/`subscriptions`/`subscription_events`), `subscriptionService.ts` (`getEntitlement`/`recordProviderEvent`/`grantManual`/`revokeManual`), adaptador de Google Play (solo parsing de RTDN, sin tocar `mobile/`), API consolidada `api/api/subscriptions.ts` (10/12 funciones Vercel), y `web/src/lib/profilesAdmin.ts`/`profile.ts` migrados del write/read directo de `profiles.plan` al motor. 131 tests en `api/` + suite de `web/` verde; typecheck limpio. **Pendiente de Mario**: correr el SQL nuevo de `docs/database/schema.sql` en Supabase; crear la Service Account de Google Cloud (CF-114) y configurar `GOOGLE_RTDN_SECRET` cuando se quiera probar el flujo real de Google Play. Detalle en `docs/engineering/rfc/RFC-003_SUBSCRIPTION_ENGINE.md`.

### Nota crítica sobre B (Bioequivalentes) — por qué el score no manda a producción directo

Investigación de código (2026-07-31) antes de puntuar CT/RG, siguiendo la Regla 5 ("la opinión nunca reemplaza los datos"): `isBioequivalent` (`packages/domain/src/types.ts`) **no tiene una fuente de verdad regulatoria** — hoy es un booleano que cada scraper llena como puede: dato estructurado real en Salcobrand/Dr. Simi/Cruz Verde, heurística frágil por regex/CSS en Ahumada/Sermecoop/AraucoMed (falsos negativos conocidos), y **siempre `false`** en Farmex y EasyFarma. No existe ningún catálogo de principio activo ni relación producto↔equivalente (`docs/database/schema.sql` no lo modela). `docs/architecture/DOMAIN_MODEL.md` §6 ya documentó esto como pregunta abierta, sin plan de migración.

Construir la feature con estos datos violaría el Principio 7 (`PRODUCT_PRINCIPLES.md`: "Preferimos retrasar una publicación antes que entregar información incorrecta") — decirle a alguien que dos medicamentos son intercambiables, con una fuente que da falsos negativos y falsos positivos por diseño, es el tipo de error que el Libro Fundacional trata como línea roja (Acto III, "La Salud No Admite Atajos").

**No se propone todavía un sprint de implementación para B** — antes hace falta un spike de investigación (fuente de datos: registro ISP público, Vademécum, o equivalente) que no existe hoy ni está scopeado. Se registra el CFPS para no perder la evaluación de valor, pero queda **bloqueada** hasta resolver la fuente de datos.

### Spike de datos de bioequivalencia — ✅ cerrado (2026-07-31), desbloquea B parcialmente

**Fuente encontrada**: `datos.gob.cl` (dataset 1303, "Listado de productos equivalentes terapéuticos" del ISP) — API real vía CKAN DataStore (`https://datos.gob.cl/api/3/action/datastore_search?resource_id=93df17ca-b694-4697-96b2-3dae87d9761d`), con columnas oficiales confirmadas: `Principio Activo`, `Producto`, `Registro` (N° ISP, formato `F-#####/N`), `Titular`, `Estado`, `Vigencia`. Confirmado con datos reales (no es un dataset vacío ni de juguete). Segunda fuente evaluada, `registrosanitario.ispch.gob.cl` (buscador ISP por registro individual): scrapeable en principio (existe un scraper de terceros ya funcionando, [hopazo/scrapers-salud](https://github.com/hopazo/scrapers-salud)), pero es HTML de ASP.NET sin API — mismo nivel de fragilidad que Ahumada/Sermecoop, se descarta como pieza central y queda como plan B.

**El obstáculo real no es "no hay dato" sino el cruce (matching) contra nuestro catálogo** — el ISP identifica productos por nombre de marca + N° de Registro; nuestras 9 farmacias no siempre exponen ese número. Investigación exhaustiva (solo lectura, sin tocar código) de las 9:

| Farmacia | Registro ISP disponible | Dónde |
|---|---|---|
| Dr. Simi | ✅ Sí — ya en el JSON que consumimos hoy | Campo `"Registro Sanitario"` en la respuesta de búsqueda VTEX (se descarta al mapear) |
| Farmex | ✅ Sí — ya en el JSON que consumimos hoy | Link `RegistroISP=F-####/##` embebido en el HTML de `body` (descripción) de la respuesta Shopify |
| AraucoMed | ✅ Sí, pero requiere scrape adicional | Solo en la página de detalle del producto (no en el JSON de búsqueda) — costo extra de latencia/fragilidad por producto |
| Sermecoop | ✅ Sí, pero requiere scrape adicional | Solo en la página de detalle (modal "Información del producto") |
| EasyFarma | ✅ Sí, pero requiere scrape adicional | Campo "Código ISP" solo en la página de detalle |
| Cruz Verde | ❌ No disponible | Verificado en listado y endpoint de detalle real (Demandware) — no existe el dato |
| EcoFarmacias | ❌ No disponible | Verificado en la respuesta completa de la API WooCommerce |
| Salcobrand | ❌ No disponible por producto | Solo aparece una resolución de autorización ISP a nivel de sitio completo, no un registro sanitario por medicamento |
| Ahumada | ⚠️ Inconcluso | Demandware hidrata la ficha vía JS del lado del cliente — el fetch sin navegador no vio el cuerpo de la página; requiere verificación con Chrome real |

**Conclusión**: match exacto (sin fuzzy matching, cero riesgo de falso positivo) es viable de inmediato para 2/9 farmacias (Dr. Simi, Farmex) y viable con esfuerzo adicional (scrape de ficha de detalle) para 3/9 más (AraucoMed, Sermecoop, EasyFarma) — hasta 5/9 potencial. 3/9 (Cruz Verde, EcoFarmacias, Salcobrand) no tienen el dato y necesitarían fuzzy matching (mismo riesgo que motivó el bloqueo original) o simplemente no mostrar el badge para esas farmacias. Ahumada queda pendiente de verificación con navegador.

**Recomendación**: un "Sprint B-lite" acotado a Dr. Simi + Farmex (capturar `registroISP` como campo aditivo, cruzar contra el dataset del ISP, mostrar el badge de bioequivalencia certificada **solo** donde hay match exacto por número de registro — nunca por nombre) es de bajo riesgo y ya viable hoy. Extender a AraucoMed/Sermecoop/EasyFarma es una fase posterior (cuesta una llamada de red extra por producto). Cruz Verde/EcoFarmacias/Salcobrand quedan fuera de este enfoque hasta que se decida si vale la pena el fuzzy matching con curación manual (ver estrategia anti-falsos-positivos discutida con el CEO: match exacto > multi-señal + curación humana > nunca fuzzy directo a producción).

### Orden recomendado (dato > score bruto)

1. **Sprint E** — Comparación de receta completa. Score más alto (4.3) y sin bloqueos técnicos: reutiliza `/api/search` tal cual, el patrón de carrito ya existe en `mobile/` (`cartStore`, max 8 items) como referencia de UX.
2. **Sprint A** — CFM-ID. Score medio (3.2) pero es el habilitante silencioso de C (alertas más robustas ante cambios de `matchKey`) y de un eventual spike de bioequivalencia (necesita una entidad estable donde colgar el dato ISP el día que exista). RFC ya diseñado, 100% aditivo, riesgo más bajo de toda la lista (RG=5).
3. **Sprint C** — Alertas de precio por email. Score 3.65, infraestructura de email ya existe (Resend, usado en feedback).
4. **Spike de datos (nuevo, sin nombre de sprint todavía)** — evaluar fuentes de bioequivalencia (ISP/Vademécum) antes de poder retomar B con calidad.
5. **Sprint B** — Bioequivalentes, una vez resuelto el spike anterior.
6. **D y F quedan en Backlog futuro** (CFPS < 3) — no se descartan, pero no hay caso de negocio suficiente hoy: D fragmenta la experiencia (cuenta solo en `web/`, sin sincronizar con `mobile/` mientras dure la Prueba Cerrada) y F es prematuro sin base de usuarios en Producción todavía.

### Detalle de Sprint F — propuesta de categorización gratis/pago (registrado 2026-07-31, no puntuado todavía)

Discusión con el CEO sobre qué podría ser de pago sin comprometer la misión. Regla dura, no negociable: **pagar nunca cambia qué farmacia aparece más barata ni el orden de los resultados** — eso es "comparar precios" y se mantiene igual para todos siempre (Artículo IV de la Constitución, independencia editorial). Lo que se puede diferenciar es todo lo que rodea a esa comparación: comodidad, automatización, alcance.

**Siempre gratis (núcleo):** buscar cualquier medicamento y ver su precio en las 9 farmacias con los 4 canales; ver la farmacia más barata y el ahorro; filtros básicos, historial reciente, favoritos; que exista una alternativa bioequivalente y su precio (ocultar esto violaría la razón de ser del proyecto); compartir un resultado; una alerta de precio activa.

**Candidatas a plan de pago (convenience, no acceso a información básica):**

| Funcionalidad | Por qué puede ser de pago | Sprint relacionado |
|---|---|---|
| Comparación de receta completa (varios medicamentos a la vez, optimizando dónde comprar cada uno) | Cada medicamento individual sigue siendo gratis si se busca uno por uno — lo de pago es el ahorro de tiempo | Sprint E (la versión gratis/base podría lanzarse primero, y el tier de pago vendría después como extensión) |
| Alertas de precio ilimitadas + por email/push (vs. 1 gratis) | Costo de infraestructura real y continuo (envío de correos, monitoreo) | Sprint C |
| Historial de precios extendido (más allá de los últimos 14 registros) o exportable | El dato ya se guarda; lo de pago sería el rango largo y la exportación | — |
| "Mi canasta mensual" para tratamiento crónico (recordatorios, gasto proyectado, multi-perfil familiar) | Es una capa de gestión encima de la comparación, no la comparación misma | Dirección 2 de la Acta 2026-07-28 |
| Ficha enriquecida de bioequivalente (laboratorio, registro ISP, comparación técnica) | El precio y que "existe una alternativa" quedan gratis; el detalle clínico profundo puede ser premium | Sprint B, una vez resuelto el spike de datos |

**Fuera de este esquema (no es un plan de usuario):** vender datos agregados/anónimos o acceso a API a farmacias/aseguradoras/investigadores ("API Comercial" del roadmap) — no compite con lo anterior, es otra fuente de ingreso que no le cobra nada al usuario final.

**Limitación práctica:** nada de esto se puede lanzar hoy en `mobile/` (congelado). Lo primero viable es un plan de pago dentro de `web/`, apoyado en el login que ya existe para `/admin` (mismo enabler que Sprint D).

*Pendiente: puntuar con CFPS cuando se decida avanzar — por ahora es una propuesta de categorización, no un compromiso de sprint.*

*Backlog derivado de `docs/product/PRODUCT_REVIEW_V1.md`. Actualizar el estado acá cuando se cierre un ítem — no dejar que este documento se desactualice como pasó con el original.*

## Auditoría Documental y Gobierno del Conocimiento (registrado 2026-08-02, congelado)

Auditoría completa de solo lectura del árbol documental del repo, entregada en `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`. Cubre inventario, clasificación por dominio, mapa de relaciones, duplicidades (visión/principios definidos hasta 4 veces sin cruzarse, 5 copias de la tabla de farmacias/canales, colisión de numeración RFC-002), inconsistencias (9 issues `CF-101`–`110` marcados "Pendiente" pese a estar implementados, `FEATURE_STATUS.md` obsoleto, `docs/release/*` congelado en versionCode 30), vacíos reales (`KPIS.md`/`DATA_POLICY.md`/`BACKLOG_TECH.md` sin poblar), evaluación de calidad, estructura de carpetas propuesta, política de gobierno documental y roadmap priorizado (consolidar → fusionar → actualizar → marcar/eliminar → crear).

**Estado: congelado a pedido del CEO.** No se ejecuta ninguna acción del roadmap todavía — queda en backlog para retomar cuando se decida priorizar. Sin CFPS asignado (no es una funcionalidad de producto, es deuda de gobierno documental; se puntuará si en algún momento compite por el mismo ciclo de sprints que otras iniciativas).
