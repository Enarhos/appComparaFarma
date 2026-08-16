# Functional Convergence Strategy — ComparaFarma

**Tipo:** Documento de estrategia funcional (no arquitectura nueva, no diseño de pantallas, no backlog de ejecución). Responde una única pregunta: ¿cómo evolucionamos desde dos productos parcialmente independientes (Web y Mobile) hacia una única Plataforma ComparaFarma?
**Fecha de corte:** 2026-08-07
**Contexto:** la etapa de Arquitectura está cerrada; EPIC-01 (Identity Foundation) está oficialmente cerrada y aprobada por el CTO (`docs/archive/reviews/EPIC-01_COMPLETION_REVIEW_2026-08-07.md`, veredicto "cerrada con observaciones"). Este documento abre la etapa de Convergencia Funcional y será la base para planificar las épicas siguientes — no reemplaza, no modifica y no repite `docs/program/PLATFORM_CONVERGENCE_MASTER_PLAN.md` (el backlog ejecutable ya aprobado), sino que se apoya en él para razonar la estrategia a un nivel de producto, no de ejecución.
**Método:** verificación cruzada contra los 9 documentos exigidos en el pedido de este informe, todos leídos íntegros antes de redactar. No se asume ningún dato no verificable en esas fuentes.

---

## Auditoría previa

Documentos revisados íntegramente antes de redactar este documento:

1. `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md`
2. `docs/technology/domain/USER_DOMAIN_MODEL.md`
3. `docs/technology/architecture/IDENTITY_INTEGRATION_PLAN.md` (versión revisada PLATFORM-002A)
4. `docs/technology/architecture/PLATFORM_CAPABILITY_MODEL.md`
5. `docs/archive/reviews/EPIC-01_COMPLETION_REVIEW_2026-08-07.md`
6. `docs/program/PLATFORM_CONVERGENCE_MASTER_PLAN.md`
7. `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`
8. ~~`docs/product/BACKLOG_TECH.md`~~ — estaba vacío (0 bytes) y fue eliminado en la limpieza de gobierno documental de 2026-08-15; no existe definición recuperable de lo que se citaba como TECH-001/TECH-002 (ver nota en § Costos operacionales)
9. `docs/archive/project/PROJECT_STATUS_2026-08-06.md`

Ninguno de estos documentos fue modificado. Ningún dato de este informe proviene de una fuente distinta a estas 9 (más las citas que esos mismos documentos ya hacían a otras fuentes, referenciadas aquí solo cuando ellos mismos las citaban).

---

## 1. Estado actual

**Web.** Tiene Identidad (Supabase Auth, email/password; Google OAuth solo en `/admin`), Perfil (`profiles`), el único motor de entitlement Premium de toda la Plataforma (sin catálogo comercial vendible real — solo un plan placeholder "cortesía"), panel administrativo completo, Alertas de precio por email sin cuenta (`email_alerts`, mecanismo incompatible con el de Mobile), y "Mi receta" (comparación de una lista de medicamentos, guardada en `localStorage` del navegador, sin cuenta). No tiene Favoritos ni Historial de búsquedas (`CURRENT_PLATFORM_ASSESSMENT.md` §2, §6).

**Mobile.** Hasta EPIC-01 funcionaba 100% anónimo, sin ningún mecanismo de Identidad. Tras EPIC-01, existe — construido y validado con evidencia real, pero **en una rama sin mergear y sin publicar** — el mecanismo de Identidad equivalente al de Web (Session Manager, Auth Store, Entitlement Adapter, Bootstrap de arranque; `EPIC-01_COMPLETION_REVIEW.md` §3, §9). Mobile tiene, hoy en producción, Favoritos (local), Carrito (comparación de una lista, local, máx. 8 ítems — el mismo concepto de "Mi receta" de Web pero incompatible con ella), Historial de búsquedas (local), Alertas de precio (local, in-app, mecanismo distinto al de Web), Donación, Feedback y Analytics de producto (PostHog) — ninguna de estas seis capacidades existe en Web (`CURRENT_PLATFORM_ASSESSMENT.md` §1, §6).

**Plataforma (`api/` + Supabase).** Es agnóstica de cliente por diseño: la verificación de sesión funciona por header `Authorization: Bearer <jwt>`, nunca por cookies, y el motor de entitlement (`subscriptionService`) ya es único y no distingue quién lo consulta (`CURRENT_PLATFORM_ASSESSMENT.md` §3.5; confirmado con evidencia real en SPIKE-001 y reconfirmado en EPIC-01). Las 9 integraciones de farmacia, la configuración remota (`app_config`) y el registro canónico de medicamentos (CFM-ID) ya son compartidos por ambos clientes sin ninguna brecha (`PLATFORM_CAPABILITY_MODEL.md` §3). EPIC-01 confirmó, con evidencia de sus 5 entregas de código, que ningún cambio fue ni es necesario en esta capa para converger Identidad (`EPIC-01_COMPLETION_REVIEW.md` §8).

**Resumen de la brecha:** hoy coexisten tres relaciones de Identidad no unificadas (Instalación anónima en Mobile, email+token de Alertas en Web, Perfil con Identidad en Web — `IDENTITY_INTEGRATION_PLAN.md` §1), y dos pares de funcionalidades duplicadas con modelos de datos incompatibles entre sí (Favoritos/Alertas — Mobile vs. Web; Carrito/"Mi receta" — el mismo concepto de producto implementado dos veces sin conocimiento mutuo).

---

## 2. Objetivo final

Cuando la convergencia esté completa, ComparaFarma deja de ser "una app y un sitio" y se comporta como una única Plataforma con múltiples Clientes (terminología ya adoptada en `IDENTITY_INTEGRATION_PLAN.md`, nota terminológica del encabezado):

- **Una Persona que decide identificarse es reconocida igual sin importar el Cliente** que use en ese momento o en el futuro (`IDENTITY_INTEGRATION_PLAN.md` §2).
- **Su Perfil, su estado de Premium, sus Favoritos y sus listas recurrentes de medicamentos son los mismos** desde cualquier Cliente donde se identifique — no una copia reconstruida por cliente, sino la misma relación consultada desde distintos lugares (`IDENTITY_INTEGRATION_PLAN.md` §2, §9).
- **Las Alertas de precio dejan de ser dos mecanismos distintos y pasan a ser un solo concepto de dominio**, con dos formas posibles de sostenerlo (anónimo o identificado), nunca dos tipos de dato separados (`IDENTITY_INTEGRATION_PLAN.md` §4.4).
- **Una Persona que nunca decide identificarse conserva, sin ningún cambio ni pérdida, todo lo que ya tiene hoy** — la búsqueda, la comparación y el uso local de Favoritos/Alertas/Historial/Carrito siguen funcionando exactamente igual, indefinidamente (Principio 1, `USER_DOMAIN_MODEL.md` §9; `IDENTITY_INTEGRATION_PLAN.md` Principio de implementación #7).
- **Ninguna funcionalidad Premium altera lo que ya es neutral hoy** — el precio mostrado y el orden de farmacias nunca dependen de si la Persona está identificada o paga (Principio 10, `USER_DOMAIN_MODEL.md`).

Este objetivo se describe en términos de capacidades y relaciones, no de pantallas: no se define aquí cómo se ve el Perfil, cómo se accede a Favoritos sincronizados, ni ningún flujo de UI — eso corresponde a trabajo de producto posterior, fuera del alcance de este documento.

---

## 3. Principios de convergencia

Cada principio se ancla explícitamente en la Architecture Baseline ya aprobada — ninguno es una decisión nueva de este documento.

- **Una Persona.** El sujeto real detrás de cualquier interacción, con o sin Identidad reconocida — existe siempre, independientemente de la Plataforma (Vocabulario base, `USER_DOMAIN_MODEL.md`).
- **Una Identidad.** El mecanismo — no un activo — que permite reconocer que dos interacciones distintas corresponden a la misma Persona, disponible desde cualquier Cliente, no exclusivo de uno (BC-005, citado en `USER_DOMAIN_MODEL.md`; "Una única Identidad", `IDENTITY_INTEGRATION_PLAN.md` §2).
- **Un Perfil.** Una sola fuente de verdad sobre quién es la Persona y su plan, consultada por cualquier Cliente, nunca duplicada ni reconstruida por separado (BC-006; `IDENTITY_INTEGRATION_PLAN.md` §2).
- **Un Plan.** El entitlement de Premium se resuelve en un solo lugar y se ve idéntico desde cualquier Cliente autenticado — no existe "Premium de Mobile" y "Premium de Web" como conceptos distintos (`IDENTITY_INTEGRATION_PLAN.md` §2).
- **Múltiples Clientes.** ComparaFarma es una única Plataforma con más de un Cliente (Web, Mobile) — terminología ya adoptada explícitamente en la revisión PLATFORM-002A de `IDENTITY_INTEGRATION_PLAN.md`.
- **Una única fuente de verdad.** La convergencia nunca crea una fuente de verdad paralela; cuando algo se unifica, la implementación previa se retira, nunca coexisten indefinidamente dos versiones del mismo concepto de dominio (Principio de implementación #11, `IDENTITY_INTEGRATION_PLAN.md` §8).
- **Neutralidad entre plataformas.** Ningún Cliente debe ofrecer una relación de mayor o menor calidad con la Plataforma solo por ser el que la Persona usó — el mismo Perfil, el mismo estado de Premium y el mismo reconocimiento de Identidad deben verse idénticos sin importar el Cliente (`IDENTITY_INTEGRATION_PLAN.md` §2, criterios de éxito §9.1-9.2). Distinto pero relacionado con el Principio de Neutralidad ya existente sobre precios de farmacias (Principio 10, `USER_DOMAIN_MODEL.md`), que este documento no redefine.
- **Progressive Enhancement.** Nombre descriptivo, no un concepto nuevo, para un principio ya vigente: identificarse añade capacidad (sincronización) sobre una base que ya funciona completa sin ella — nunca al revés (Principio de implementación #7, `IDENTITY_INTEGRATION_PLAN.md` §8: "toda funcionalidad anónima debe seguir siendo anónima después de cada fase").
- **Graceful Degradation.** Mismo caso: quien no se identifica no pierde nada, simplemente no obtiene la capa adicional de sincronización — el comportamiento local de hoy (Favoritos, Alertas, Historial, Carrito) sigue siendo una experiencia completa por sí misma, no una versión disminuida a propósito (Principio 1, `USER_DOMAIN_MODEL.md` §9; Principio de implementación #8, `IDENTITY_INTEGRATION_PLAN.md` §8: "la distinción anónimo/identificado es un mecanismo de Identidad, no un tipo de dato de dominio").

---

## 4. Clasificación de funcionalidades

| Funcionalidad | Clasificación | Evidencia / nota |
|---|---|---|
| Favoritos | Solo Mobile → **Pendiente de convergencia** | Local, AsyncStorage; no existe en Web (`CURRENT_PLATFORM_ASSESSMENT.md` §6). Convergencia ya prevista como Epic 3 de `PLATFORM_CONVERGENCE_MASTER_PLAN.md`. |
| Historial (de búsquedas) | Solo Mobile → **Pendiente de convergencia (condicional)** | Local; no existe en Web. Su sincronización depende de que el comité resuelva primero la Decisión Pendiente #1 de `USER_DOMAIN_MODEL.md` (tensión de privacidad) — si se resuelve "nunca sincronizar", queda permanentemente Solo Mobile. |
| Alertas | Existe en ambos, pero **incompatible entre sí** → **Pendiente de convergencia** | Mobile: local, in-app. Web: email+token sin cuenta (`email_alerts`). No es "Compartida" — son dos mecanismos que hoy significan cosas distintas para el mismo concepto de dominio (`IDENTITY_INTEGRATION_PLAN.md` §1, §4.4). |
| Comparaciones (concepto unificado de Carrito/"Mi receta") | Duplicada, no compartida → **Pendiente de convergencia** | Ver filas "Carrito" y "Mi receta" — es el mismo concepto de producto con dos implementaciones de datos independientes (`IDENTITY_INTEGRATION_PLAN.md` §4.3). |
| Premium | Solo Web → **Pendiente de convergencia** | El motor de entitlement es único en la Plataforma, pero solo Web puede autenticarse hoy para consultarlo (`CURRENT_PLATFORM_ASSESSMENT.md` §2.7). Sin catálogo comercial vendible real (`docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, Subscription Platform). |
| Perfil | Solo Web → **Pendiente de convergencia** | `profiles`, accesible solo desde Web (`CURRENT_PLATFORM_ASSESSMENT.md` §2.5). Es la Feature de mayor precedencia en el roadmap ya aprobado (Epic 2.1, MVP de `PLATFORM_CONVERGENCE_MASTER_PLAN.md` §5). |
| Configuración (remota: farmacias activas, banner de donación) | **Compartida** — ya converge | Fuente única (`app_config`), ambos Clientes consumen, Web administra (`CURRENT_PLATFORM_ASSESSMENT.md` §6, "Integrada"; `PLATFORM_CAPABILITY_MODEL.md` §3, "Implementada"). No requiere ningún trabajo de convergencia adicional — nunca fue un dato por-Cliente. |
| Configuración (del Usuario / Preferencias, ej. comuna habitual) | No existe en ninguno como concepto del Usuario; hoy es local en ambos sin relación entre sí → **Pendiente de decisión, no de construcción** | Distinta de la fila anterior. Su clasificación de dominio (¿es del Usuario o del contexto de cada búsqueda?) sigue sin resolver — Decisión Pendiente #2 de `USER_DOMAIN_MODEL.md`. No puede clasificarse como "pendiente de convergencia" técnica hasta que exista esa decisión de negocio. |
| Convenios / afiliación con farmacias | **Compartida** (la infraestructura de tracking), sin convergencia de Identidad pendiente | El mecanismo de derivación (`/api/go`) ya es compartido por ambos Clientes (`CURRENT_PLATFORM_ASSESSMENT.md` §3.1). El acuerdo comercial en sí no es una relación con una Persona-Usuario, sino con terceros (farmacias) — explícitamente fuera del alcance de la convergencia de Identidad (`PLATFORM_CONVERGENCE_MASTER_PLAN.md`, Nota de alcance). |
| Mi receta | Solo Web → **Pendiente de convergencia** (junto con Carrito, ver fila "Comparaciones") | `localStorage` del navegador, sin cuenta (`CURRENT_PLATFORM_ASSESSMENT.md` §2.1). |
| Carrito | Solo Mobile → **Pendiente de convergencia** (junto con Mi receta, ver fila "Comparaciones") | `cartStore`, AsyncStorage, máx. 8 ítems (`CURRENT_PLATFORM_ASSESSMENT.md` §1.5). |
| IA (recomendaciones basadas en IA) | No existe en ninguno → **No aplica a esta clasificación** | Confirmado "sin código todavía" (`PLATFORM_CAPABILITY_MODEL.md` §3, citando `docs/program/ROADMAP.md`). No hay nada que converger porque no existe en ningún Cliente. |
| Bioequivalentes | Dato parcial y compartido (`isBioequivalent` en el dominio, ambos Clientes muestran el badge), pero **con un problema de calidad de dato, no de convergencia de Identidad** | La brecha real no es que Mobile y Web difieran entre sí — es que la fuente del dato es poco confiable (heurísticas frágiles, `false` fijo en 2 de 9 farmacias; `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md`, "Nota crítica sobre B"). Bloqueada por un spike de datos (ISP/`datos.gob.cl`), no por ninguna Decisión de Identidad. |

---

## 5. Estrategia de convergencia

Se desarrolla únicamente para las funcionalidades clasificadas "Pendiente de convergencia" en §4 — las demás no requieren esta estrategia por definición (ya son compartidas, no existen en ningún Cliente, o su brecha no es de Identidad).

| Funcionalidad | Estado actual | Estado objetivo | Dependencias | Riesgos | Complejidad | Valor para el Usuario |
|---|---|---|---|---|---|---|
| **Perfil** | Solo Web (`profiles`) | Un mismo Perfil, consultado por cualquier Cliente identificado, sin duplicación (`IDENTITY_INTEGRATION_PLAN.md` §2, §4) | Epic 1 (Identity Foundation) completa — ya construida y validada en EPIC-01, pendiente de merge (`EPIC-01_COMPLETION_REVIEW.md` §10) | Ninguno nuevo de dominio; riesgo de ejecución señalado en `PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7: que el primer release se perciba "sin nada que mostrar" y genere presión para saltarse la validación de la base | Media (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítem 7) | Alto |
| **Favoritos** | Solo Mobile, local | Sincronizado para Personas identificadas; local para quien no se identifica (Principio 8, `USER_DOMAIN_MODEL.md`) | Epic 1 completa. No depende de Perfil (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §4) | Pérdida de continuidad si la migración desde AsyncStorage no contempla lo ya guardado; conflictos si la Persona edita casi-simultáneamente desde ambos Clientes (`IDENTITY_INTEGRATION_PLAN.md` §7) | Media (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítem 14) | Alto (`PLATFORM_CAPABILITY_MODEL.md` §8) |
| **Comparaciones (Carrito + "Mi receta" unificados)** | Duplicada — dos implementaciones incompatibles, sin tabla compartida | Un solo concepto de dominio ("lista recurrente de medicamentos de interés"), sincronizado para identificados (`IDENTITY_INTEGRATION_PLAN.md` §4.3) | Epic 1 completa; la sincronización depende de unificar primero el concepto (no se puede sincronizar lo que todavía es dos cosas distintas) | Subestimar el esfuerzo por parecer "solo sincronizar dos listas" cuando el trabajo real empieza por unificar dos conceptos de dominio distintos (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7, riesgo explícito) | Alta (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítem 13: "es más que sincronizar") | Alto — diferenciador ★★★★★ del roadmap de producto (`PLATFORM_CAPABILITY_MODEL.md` §8) |
| **Alertas** | Dos mecanismos incompatibles (Mobile local; Web email+token) | Un solo concepto de dominio "Alerta", con dos mecanismos de persistencia posibles, no dos tipos de dato (`IDENTITY_INTEGRATION_PLAN.md` §4.4) | Epic 1 completa + resolución de las Decisiones Pendientes de negocio de Epic 0 (`PLATFORM_CONVERGENCE_MASTER_PLAN.md`, Features 0.1 y 0.4): reconciliación de `email_alerts` con el Perfil (Decisión Pendiente #4, `USER_DOMAIN_MODEL.md`) y preservación o retiro del mecanismo anónimo de creación (Pregunta Pendiente #3, `IDENTITY_INTEGRATION_PLAN.md`) — ninguna resuelta a la fecha de este documento | Declarar la unificación "completada" sin ejecutar realmente la reconciliación/migración de las alertas ya creadas, dejando a Personas reales sin aviso (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7, riesgo explícito) | Media (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítems 17-20) | Alto (`PLATFORM_CAPABILITY_MODEL.md` §8) |
| **Premium** | Motor único en la Plataforma; solo Web puede autenticarse para consultarlo; sin catálogo comercial vendible real | Mismo estado de Premium visible desde cualquier Cliente identificado (`IDENTITY_INTEGRATION_PLAN.md` §2, §9) | Epic 1 completa; no bloqueado técnicamente por el catálogo, pero su valor real depende de que exista uno (Decisión Pendiente de negocio #5 de Epic 0, `PLATFORM_CONVERGENCE_MASTER_PLAN.md`) | Invertir esfuerzo de convergencia en una capacidad sin catálogo que la justifique (`IDENTITY_INTEGRATION_PLAN.md` §7; `PLATFORM_CAPABILITY_MODEL.md` §7) | Media (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítems 21-22) | Bajo hoy / Alto potencial (`PLATFORM_CAPABILITY_MODEL.md` §8) |
| **Historial de búsquedas** | Solo Mobile, local | Sincronización únicamente si la Persona activa un Opt-In explícito; nunca por defecto (`USER_DOMAIN_MODEL.md` §7) | Epic 1 completa + Decisión Pendiente de negocio #1 resuelta a favor; si el comité decide "nunca", esta convergencia se retira sin afectar las demás | Privacidad — el historial de búsquedas de medicamentos puede revelar condiciones de salud; riesgo de construirlo sin aprobación explícita del comité "por inercia" (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7) | Baja-Media (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítems 23-24) | Medio (`PLATFORM_CAPABILITY_MODEL.md` §8) |
| **Preferencias del Usuario (ej. comuna)** | Local en ambos Clientes, sin relación entre sí | Sin definir — depende de si se clasifica como preferencia del Usuario o contexto de cada búsqueda | Decisión Pendiente de negocio #2 de `USER_DOMAIN_MODEL.md`, sin resolver — no puede avanzar ni en diseño hasta que exista esa clasificación | Forzar una clasificación sin esa decisión contradiría una decisión ya tomada de no asumir (`IDENTITY_INTEGRATION_PLAN.md` §4) | Baja (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §10, ítem 16) | Medio (`PLATFORM_CAPABILITY_MODEL.md` §8) |

Ninguna fila de esta tabla propone cómo implementar la convergencia — el "Estado objetivo" describe la capacidad resultante, no una solución técnica.

---

## 6. Priorización

Ordenada únicamente por valor para el usuario, dependencias técnicas y reutilización de la infraestructura ya construida en EPIC-01 — nunca por facilidad de implementación (algunas de las funciones de mayor prioridad son, de hecho, las de mayor complejidad relativa, ver §5).

1. **Perfil.** Máxima prioridad porque reutiliza directamente la infraestructura ya construida y validada en EPIC-01 (Auth Store, Entitlement Adapter) sin ninguna dependencia de negocio pendiente, y es la única forma de que la Identidad recién construida tenga una manifestación visible real para la Persona — sin esto, Identidad por sí sola no se percibe como valor entregado (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §5, MVP).
2. **Favoritos + Comparaciones unificadas (Carrito/"Mi receta").** Segunda prioridad: valor alto e inmediato para una Persona que ya usa estas dos capacidades hoy (en Mobile), única dependencia técnica es Epic 1 (ya resuelta), y ninguna Decisión Pendiente de negocio las bloquea — es el conjunto de mayor valor entregable sin esperar ninguna resolución del comité (`IDENTITY_INTEGRATION_PLAN.md` §6.2, Alternativa B ya adoptada).
3. **Alertas.** Tercera prioridad: valor igualmente alto, pero a diferencia de Favoritos/Comparaciones, depende de que el comité resuelva primero las dos Decisiones de negocio de Epic 0 que la bloquean específicamente (Features 0.1 y 0.4, `PLATFORM_CONVERGENCE_MASTER_PLAN.md`) — la postergación no es por dificultad técnica ni por menor valor, es porque construir sobre una decisión no tomada arriesga rehacer trabajo (`PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7).
4. **Premium.** Cuarta prioridad, pese a que su infraestructura (el motor de entitlement) ya existe y es reutilizable de inmediato: se posterga porque su valor real para el Usuario es hoy bajo (sin catálogo comercial vendible, converger la capacidad no le da a nadie algo nuevo que comprar) — el mismo razonamiento que ya adoptó el comité en `IDENTITY_INTEGRATION_PLAN.md` §6.2 al mover Premium de la Fase 2 original a una fase posterior.
5. **Historial de búsquedas (Opt-In).** Quinta prioridad: valor medio, y condicionado por completo a una decisión de negocio (Decisión Pendiente #1) que podría eliminar esta convergencia del todo — no puede priorizarse por encima de capacidades cuyo valor y viabilidad ya están confirmados.
6. **Preferencias del Usuario (comuna).** Sin prioridad asignable todavía: no es que tenga bajo valor, es que no puede planificarse mientras la Decisión Pendiente #2 (¿es del Usuario o del contexto?) siga sin resolver — priorizarla hoy sería asumir una clasificación que el propio dominio marcó como pendiente.

Este orden reproduce, sin modificarlo, el ya adoptado en `IDENTITY_INTEGRATION_PLAN.md` §6.2/§6.3 y en los Releases de `PLATFORM_CONVERGENCE_MASTER_PLAN.md` §6 — este documento no recalcula ni reordena ese roadmap; lo confirma razonando desde los tres criterios pedidos.

---

## 7. Qué nunca debe converger

- **Panel administrativo (`/admin`).** Es una función operativa interna del negocio, no una relación con el Usuario final — queda fuera del alcance de cualquier convergencia orientada a la Persona (`IDENTITY_INTEGRATION_PLAN.md` §3).
- **Analytics de producto (PostHog).** Debe permanecer agregado y siempre anónimo, nunca ligado a una Identidad — no es una regresión de alcance, es un principio explícito: "medir el comportamiento agregado para mejorar el producto no es lo mismo que vigilar a una Persona" (Principio 7, `USER_DOMAIN_MODEL.md`; confirmado "sin cambios de fondo" en `IDENTITY_INTEGRATION_PLAN.md` §3).
- **Feedback (sugerencias de usuario).** Una vez enviado, se vuelve un insumo operativo de mejora del producto — no es algo que la Persona pueda "recuperar" como si fuera suyo, a diferencia de un Favorito o una Alerta (`USER_DOMAIN_MODEL.md` §4).
- **Donaciones.** Son transacciones puntuales sin relación continua con la Persona — no hay nada que sincronizar porque no constituyen una pertenencia (`USER_DOMAIN_MODEL.md` §4; `IDENTITY_INTEGRATION_PLAN.md` §3).
- **Caché local de búsqueda y snapshot local de histórico de precios (mobile).** Son, por definición del dominio, del Dispositivo — optimizaciones de lectura sin significado propio, cuyo original autoritativo ya vive en la Plataforma. Sincronizarlas no tiene sentido conceptual: perderlas no le quita nada real a la Persona (`USER_DOMAIN_MODEL.md` §3, invariantes 5 y 7).
- **Configuración remota (farmacias activas, banner de donación).** Ya es un dato de la Plataforma, igual para todas las Personas a la vez, administrado centralmente — nunca fue ni debe ser un dato por-Cliente o por-Persona (`USER_DOMAIN_MODEL.md` §4; ya "Integrada" según `PLATFORM_CAPABILITY_MODEL.md` §3).

---

## 8. Riesgos estratégicos

No técnicos — riesgos de producto, negocio y operación de la convergencia en su conjunto.

- **Complejidad del producto.** Mantener dos Clientes con paridad parcial, más un nuevo eje (identificado / no identificado) en cada uno de ellos, multiplica el número de combinaciones de experiencia que hay que diseñar, comunicar y sostener — una fragmentación adicional a la ya señalada en `IDENTITY_INTEGRATION_PLAN.md` §1, no menor por ser conocida de antemano.
- **Experiencia del usuario.** Riesgo de que identificarse empiece a sentirse, en la práctica, como un paso casi obligatorio si la comunicación de producto no refuerza constantemente que sigue siendo 100% opcional (Principios 1 y 2, `USER_DOMAIN_MODEL.md`); riesgo adicional, ya señalado en `PLATFORM_CONVERGENCE_MASTER_PLAN.md` §7, de que el primer release perciba "sin nada que mostrar" y genere presión para adelantar funcionalidades de mayor valor visible antes de validar la base.
- **Sincronización de datos.** Conflictos reales cuando la misma Persona usa y modifica Favoritos, Comparaciones o Alertas desde ambos Clientes casi simultáneamente — riesgo ya identificado sin solución diseñada todavía en `IDENTITY_INTEGRATION_PLAN.md` §7; y riesgo de pérdida de continuidad si la migración de lo que hoy vive solo en `AsyncStorage` no contempla explícitamente preservarlo.
- **Costos operacionales.** Extender la infraestructura de sesión, refresh y entitlement a un tercer Cliente (Mobile) añade superficie operativa nueva — logs, monitoreo, incidentes — que hoy solo existe para Web/`api/`. Este riesgo se citaba antes como "TECH-001/TECH-002", pero esos identificadores nunca tuvieron una definición formal por escrito en ningún archivo del repositorio (`BACKLOG_TECH.md`, su fuente prevista, estaba vacío y fue retirado en la limpieza de gobierno documental de 2026-08-15); el riesgo en sí sigue siendo válido y se describe aquí directamente, sin los identificadores.
- **Riesgo de gobernanza.** Varias Decisiones Pendientes de negocio (comuna, historial, alertas anónimas, catálogo comercial de Premium) siguen abiertas — si la convergencia avanza en código antes de que el comité las resuelva formalmente, el riesgo es repetir el mismo patrón ya observado y señalado como lección aprendida al cierre de EPIC-01: implementación avanzando mientras una autorización o decisión formal correspondiente queda sin cerrar en su documento de origen (`EPIC-01_COMPLETION_REVIEW.md` §6, §11).
- **Riesgo de negocio en Premium.** Converger la capacidad de Premium antes de que exista un catálogo comercial real vendible no genera ingreso real ni valor perceptible para nadie — riesgo ya señalado dos veces en la Architecture Baseline (`IDENTITY_INTEGRATION_PLAN.md` §7; `PLATFORM_CAPABILITY_MODEL.md` §7) y que este documento no resuelve, solo hereda.

---

## 9. Recomendación al comité

No se define ni se diseña aquí ninguna épica nueva. La recomendación, a nivel de objetivo estratégico de producto, es:

**El siguiente gran objetivo estratégico debería ser completar y llevar a producción real el Fundamento de Identidad ya construido, haciendo visible su primer valor tangible para la Persona (un Perfil reconocible desde cualquier Cliente) — antes de iniciar cualquier sincronización de pertenencias (Favoritos, Comparaciones, Alertas o Premium).**

Esto no es una propuesta nueva: es, exactamente, el Release 1 / MVP ya definido y aprobado en `PLATFORM_CONVERGENCE_MASTER_PLAN.md` §5-§6 (Epic 0.6 + Epic 1 completa + Feature 2.1). Lo que este documento agrega, a nivel estratégico y no de ejecución, es la razón por la que ese objetivo debe preceder a cualquier otro: sin él, la Plataforma tiene la infraestructura de Identidad construida (EPIC-01) pero ningún Usuario real puede experimentar todavía que "la Plataforma lo reconoce" — y converger cualquier pertenencia (Favoritos, Alertas, Premium) sobre una Identidad que todavía no está en producción repetiría, a otra escala, el mismo riesgo ya señalado en §8 (invertir esfuerzo de convergencia sobre una base no validada en el mundo real).

En paralelo — no como parte de este objetivo, sino como una condición administrativa que no debería seguir demorándose — se recomienda que el comité resuelva las Decisiones Pendientes de negocio que hoy bloquean específicamente a Alertas, Historial y Preferencias (Decisiones Pendientes #1, #2 y #4 de `USER_DOMAIN_MODEL.md`), de forma que, una vez completado el objetivo de Identidad en producción, la siguiente prioridad (Favoritos + Comparaciones, según §6) pueda avanzar sin ninguna espera adicional.

---

## Validación final

### Documentos utilizados
Los 9 listados en "Auditoría previa". Ninguno fue modificado.

### Documento creado
`docs/enterprise/strategy/FUNCTIONAL_CONVERGENCE_STRATEGY.md` (este documento).

### Restricciones respetadas
No se escribió ni modificó código. No se creó backlog nuevo, ni Tasks, ni Épicas. No se modificó el roadmap ya aprobado (`PLATFORM_CONVERGENCE_MASTER_PLAN.md`) — este documento lo confirma y lo razona desde una capa de estrategia, sin recalcularlo. No se modificó la Architecture Baseline ni ningún otro documento existente. No se tocó ningún archivo del repositorio fuera de este documento nuevo.

Este documento queda a la espera de revisión del CTO antes de cualquier nueva implementación.
