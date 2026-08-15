# Identity Integration Plan — ComparaFarma

**Sprint de creación:** PLATFORM-002 (2026-08-06)
**Sprint de revisión:** PLATFORM-002A (2026-08-06) — revisión arquitectónica por observaciones del comité, ver Validación Final
**Tipo:** Plan conceptual y funcional de convergencia (no técnico, no de implementación)
**Alcance:** cómo evoluciona la plataforma desde el estado actual (tres relaciones de identidad no unificadas) hacia el modelo de Usuario ya aprobado en `docs/domain/USER_DOMAIN_MODEL.md`. No define APIs, tablas, endpoints, migraciones ni código. No modifica ningún otro documento existente.
**Fuente de verdad:** `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md` (estado actual, aprobado) y `docs/domain/USER_DOMAIN_MODEL.md` (modelo de Usuario, aprobado). Este documento no repite su contenido ni los contradice — cada decisión de convergencia se justifica citando el principio o la sección de `USER_DOMAIN_MODEL.md` de la que se deriva.

**Nota terminológica (agregada en la revisión PLATFORM-002A):** siguiendo el encuadre ya declarado en PLATFORM-001 y DOMAIN-001 — *"ComparaFarma deja de entenderse como una app y una web, y pasa a entenderse como una única Plataforma de Inteligencia Farmacéutica con múltiples clientes"* — este documento usa, en su propio análisis, **Cliente Web**, **Cliente Mobile** y **Servicios de Plataforma** en lugar de "Web", "Mobile" y "Backend". Esto aplica únicamente a la prosa propia de este plan. Las citas literales a `CURRENT_PLATFORM_ASSESSMENT.md` y `USER_DOMAIN_MODEL.md`, así como rutas de archivo y nombres de tablas/stores reales (`mobile/`, `web/`, `api/`, `cartStore`, `profiles`, `email_alerts`, etc.), se preservan exactamente como están en su fuente — no se traducen, porque hacerlo alteraría contenido ya aprobado que este documento tiene prohibido modificar.

---

## 1. Estado actual — divergencias relevantes

Resumen, sin repetir la auditoría completa de `CURRENT_PLATFORM_ASSESSMENT.md` (§2, §3, §6, §9):

- **El Cliente Mobile es 100% anónimo.** Sin Identidad, sin Perfil, sin Premium. Favoritos, Alertas, Historial y Carrito existen, pero viven enteramente en `AsyncStorage` del dispositivo — no hay ningún concepto de Usuario reconocido entre sesiones más allá de esa Instalación.
- **El Cliente Web tiene Identidad y Perfil, pero solo para sí mismo.** Supabase Auth (email/password + Google OAuth solo en `/admin`) sostiene `profiles`. El motor de Premium (`subscriptionService`) ya es único en los Servicios de Plataforma, pero solo el Cliente Web puede autenticarse hoy para consultarlo.
- **Alertas de precio existen dos veces, con modelos incompatibles.** Cliente Mobile: local, in-app, sin backend. Cliente Web: por email + token, sin cuenta, en la tabla `email_alerts` — completamente independiente de `profiles`.
- **Favoritos y comparaciones (Carrito/"Mi receta") están duplicados, no divergentes.** Cada cliente implementó el mismo concepto de producto sin conocimiento del otro: `cartStore` (Cliente Mobile, AsyncStorage) y `localStorage` del navegador (Cliente Web) no se comunican entre sí ni con ningún servicio compartido.
- **Historial de búsquedas solo existe en el Cliente Mobile**, local, sin ningún equivalente ni discusión de sincronización en el Cliente Web.
- **Resultado:** hoy coexisten tres relaciones de identidad no unificadas entre sí — Instalación anónima (Mobile), email+token (Alertas del Cliente Web), Perfil con Identidad (Cliente Web) — exactamente lo que `USER_DOMAIN_MODEL.md` (Principio 14) nombra como una fragmentación del dominio, no solo una brecha técnica.

---

## 2. Estado objetivo

El estado objetivo no es "todo sincronizado para todos" — es que **cuando una Persona decide identificarse, la plataforma la reconoce igual sin importar el cliente**, y que **quien no decide identificarse sigue teniendo acceso completo al núcleo de comparación de precios**, indefinidamente (Principio 1, `USER_DOMAIN_MODEL.md` §9).

Concretamente:

- **Un único Usuario:** la misma Persona, reconocida de la misma forma, sin importar si accedió desde el Cliente Mobile o el Cliente Web.
- **Una única Identidad:** el mismo mecanismo de reconocimiento (hoy, Supabase Auth) disponible desde cualquier cliente — no exclusivo del Cliente Web como hoy.
- **Un único Perfil:** una sola fuente de verdad sobre quién es la Persona y su plan, consultada por cualquier cliente — nunca duplicada ni reconstruida por separado en cada uno.
- **Una única relación Premium:** el entitlement se resuelve en un solo lugar (el motor ya existe en los Servicios de Plataforma) y se ve idéntico desde cualquier cliente autenticado — no hay "Premium del Cliente Mobile" y "Premium del Cliente Web" como conceptos distintos.
- **Una única fuente de verdad por concepto de dominio:** Favoritos, Alertas y Comparaciones dejan de ser una implementación-por-cliente y pasan a ser, conceptualmente, una sola relación entre el Usuario y los medicamentos que le interesan — con la que cualquier cliente donde la Persona se identifique puede interactuar de forma consistente.

Esto no elimina el uso anónimo: es una capa adicional que solo aplica cuando la Persona decide identificarse. Una Persona que nunca lo hace conserva, sin ningún cambio, todo lo que ya tiene hoy.

---

## 3. Funcionalidades — estado actual vs. estado objetivo

| Funcionalidad | Estado actual | Estado objetivo |
|---|---|---|
| Login / Identidad | Solo en el Cliente Web (Supabase Auth: email/password; Google OAuth solo en `/admin`) | Disponible también en el Cliente Mobile — la misma Identidad, desde cualquier cliente |
| Perfil | Solo en el Cliente Web (`profiles`) | Compartido — una sola fuente, consultada por cualquier cliente autenticado |
| Premium / Suscripción | Solo en el Cliente Web (motor completo, catálogo comercial vacío salvo la fila de cortesía) | Compartido — el mismo entitlement, visible igual desde cualquier cliente autenticado |
| Favoritos | Local en el Cliente Mobile (AsyncStorage); no existe en el Cliente Web | Sincronizado — sigue a la Persona si decide identificarse; sigue siendo local si no |
| Alertas de precio | Dos mecanismos incompatibles: local in-app (Cliente Mobile) vs. email + token sin cuenta (Cliente Web) | Un solo concepto de dominio ("Alerta"), con distintos mecanismos de persistencia según la Persona esté identificada o no (ver §4.4) |
| Historial de búsquedas | Local en el Cliente Mobile; no existe en el Cliente Web | Opt-in — el Usuario decide explícitamente si sincroniza (no se resuelve en este plan, ver §5 y Preguntas Pendientes) |
| Comparaciones (Carrito / "Mi receta") | Duplicadas — dos implementaciones independientes (`cartStore` vs. `localStorage`) de lo que es, en el dominio, una sola entidad (ver §4.3) | Compartidas — un solo concepto de "lista recurrente de medicamentos de interés", accesible desde cualquier cliente |
| Preferencia de comuna | Local en ambos clientes, sin relación entre sí | Sin resolver — depende de si se concibe como hábito del Usuario o contexto de la búsqueda (Decisión Pendiente, ver §5) |
| Configuración remota (farmacias activas, banner donación) | Ya integrada — fuente única (`app_config`), ambos clientes consumen | Sin cambios — ya cumple el objetivo de "una sola fuente de verdad" |
| Panel Admin | Solo en el Cliente Web, dentro del mismo proyecto Next.js | Sin cambios — es una función operativa interna, no una relación con el Usuario final; fuera del alcance de `USER_DOMAIN_MODEL.md` |
| Analytics de producto (PostHog) | Solo en el Cliente Mobile, agregado y anónimo | Sin cambios de fondo — permanece agregado y nunca ligado a una Identidad (Principio 7, `USER_DOMAIN_MODEL.md`) |
| Feedback | Solo en el Cliente Mobile, con email opcional | Sin cambios necesarios para esta convergencia — es un dato operativo de la Plataforma (`USER_DOMAIN_MODEL.md` §4), no una pertenencia del Usuario |
| Donación | Solo en el Cliente Mobile | Sin relación con la convergencia de identidad — es una transacción puntual, no una pertenencia continua |

---

## 4. Modelo de convergencia

Para cada funcionalidad de dominio (se excluyen las que §3 ya marcó como fuera de alcance: Panel Admin, Analytics, Feedback, Donación, Configuración remota — ninguna de ellas es una pertenencia del Usuario según `USER_DOMAIN_MODEL.md`):

| Funcionalidad | Movimiento | Justificación (con base en `USER_DOMAIN_MODEL.md`) |
|---|---|---|
| Identidad | **Se unifica** | Pasa de existir solo en el Cliente Web a ser un único mecanismo disponible en cualquier cliente — sigue siendo, conceptualmente, el mismo mecanismo de reconocimiento (§Vocabulario, BC-005), no uno nuevo por cliente. |
| Perfil | **Se unifica** | Una Persona no puede tener dos Perfiles distintos según el cliente que use — el Perfil "representa la experiencia personalizada del usuario" (§Vocabulario, BC-006), no la experiencia personalizada *en un cliente específico*. |
| Premium | **Se unifica** | El motor de entitlement ya es único; lo que converge es que cualquier cliente autenticado lo consulte igual — es la relación de mayor claridad conceptual: Premium es "una relación comercial con una Persona, no con un aparato" (§2). |
| Favoritos | **Pasa a sincronizarse** (para quien se identifica); **permanece local** (para quien no) | Un favorito "representa el interés de una Persona en un medicamento... independiente de qué teléfono tenía en la mano" (§2, Principio 8) — pero la Persona que nunca decide identificarse sigue teniendo esta función completa, de forma local (Principio 1). |
| Comparaciones (Carrito / "Mi receta") | **Se unifica** (y, al hacerlo, **pasa a sincronizarse** para quien se identifica) | Ver §4.3 — ambos representan, en el dominio, la misma entidad. |
| Alertas de precio | **Se unifica** como concepto único ("Alerta"); el mecanismo de `email_alerts` en su forma actual **se reemplaza** — sujeto a la Decisión Pendiente #4 | Ver §4.4. |
| Historial de búsquedas | **Pasa a sincronizarse solo por Opt-In explícito**; en su ausencia, **permanece local** | §7 de `USER_DOMAIN_MODEL.md`: "pertenece conceptualmente al Usuario" pero es "el que tiene la tensión de privacidad más fuerte" — que algo pertenezca al Usuario no implica que deba sincronizarse por defecto. |
| Preferencia de comuna | **Sin decisión — no se clasifica** | `USER_DOMAIN_MODEL.md` deja esto como pregunta abierta (Decisión Pendiente #2); forzar una categoría aquí contradiría esa decisión ya tomada de no asumir. |

Ninguna funcionalidad de esta lista **desaparece** — no se encontró ninguna donde la convergencia implique eliminar una capacidad que la Persona ya tiene hoy, consistente con el Principio de Reversibilidad (§9, Principio 11 de `USER_DOMAIN_MODEL.md`).

### 4.3 Carrito y "Mi receta": ¿son la misma entidad de dominio? (revisión PLATFORM-002A)

El comité pidió evaluar si el Carrito (Cliente Mobile) y "Mi receta" (Cliente Web) deben dejar de existir como dos conceptos y tratarse como uno solo — sin elegir un nombre para ese concepto único, lo cual queda explícitamente fuera de esta revisión.

Analizado contra `USER_DOMAIN_MODEL.md` §2: ambos representan "una necesidad real y recurrente de una Persona" — el mismo ejemplo que ya usa ese documento (Claudia, que compra los mismos medicamentos de forma permanente, `docs/product/PERSONAS.md`) es servido por igual por el Carrito (que además compara el total por farmacia) y por "Mi receta" (que compara cada ítem individualmente). La diferencia entre ambos no está en qué necesidad de la Persona resuelven — es la misma — sino en qué vista o cálculo ofrece cada cliente sobre esa misma lista (comparación de canasta total vs. seguimiento por ítem). Eso es una decisión de presentación, no una decisión de dominio.

**Conclusión: sí corresponde tratarlos como una sola entidad de dominio** — "una lista recurrente de medicamentos de interés para una Persona" — de la que el Carrito y "Mi receta" son, hoy, dos proyecciones de cliente distintas sobre el mismo concepto, no dos conceptos. Este documento no propone un nombre para esa entidad unificada — es una decisión de producto/nomenclatura fuera de este plan — y ya se refleja en la tabla de §3/§4 tratando "Comparaciones (Carrito / 'Mi receta')" como una sola fila con un solo movimiento de convergencia ("se unifica"), en lugar de dos filas separadas.

### 4.4 Alertas: ¿debe el dominio conocer "Alerta anónima" y "Alerta autenticada", o solo "Alerta"? (revisión PLATFORM-002A)

El comité pidió evaluar si el dominio debe modelar dos tipos de Alerta o un solo concepto con distintos mecanismos de persistencia.

El mismo patrón ya resuelto para Favoritos en `USER_DOMAIN_MODEL.md` aplica aquí sin necesidad de una regla nueva: un favorito es un solo concepto ("el interés de una Persona en un medicamento") independientemente de si hoy se guarda localmente (Instalación anónima) o si en el futuro se sincroniza (Usuario identificado) — la Identidad es, por definición en el Vocabulario base de `USER_DOMAIN_MODEL.md`, "el mecanismo que permite a la plataforma reconocer... la misma Persona", no una propiedad del dato en sí.

Aplicado a Alertas: **el dominio debería conocer un solo concepto, "Alerta"** — "el compromiso de una Persona de que se le avise si el precio de un medicamento baja de un umbral" — con dos mecanismos de creación/persistencia posibles (anónimo, hoy vía email+token; identificado, vía Perfil), no dos tipos de Alerta. Modelar "Alerta anónima" y "Alerta autenticada" como conceptos separados duplicaría en el dominio una distinción que ya pertenece, correctamente, a la capa de Identidad — y es exactamente el tipo de duplicación conceptual que `USER_DOMAIN_MODEL.md` (Principio 13) advierte evitar al separar Instalación/Usuario de la relación que cada uno sostiene con la plataforma.

Esta aclaración no cambia el movimiento de convergencia ya definido para Alertas en §4 ("se unifica") — lo hace más preciso: lo que se unifica es el concepto de dominio "Alerta"; el mecanismo anónimo no es un tipo distinto que sobreviva en paralelo, es una de las dos formas de sostener la misma relación, y su continuidad después de la unificación queda, como ya estaba, sujeta a la Decisión Pendiente #4 y a la pregunta pendiente de este plan sobre si el mecanismo anónimo se preserva (ver Preguntas Pendientes).

---

## 5. Dependencias

| Funcionalidad | Depende de | Puede paralelizarse con |
|---|---|---|
| Identidad en el Cliente Mobile (1A) | Nada técnico adicional — es el punto de partida | — (es el único prerequisito estructural de todo lo demás) |
| Perfil + Preferencias en el Cliente Mobile (1B) | Identidad en el Cliente Mobile (1A) — ver §6.1 | — (es la base conceptual de Favoritos/Comparaciones/Premium, aunque estas no dependan de *contenido* del Perfil, sí de que la Identidad ya esté estable) |
| Favoritos sincronizados | Identidad en el Cliente Mobile | Comparaciones, Premium |
| Comparaciones compartidas | Identidad en el Cliente Mobile | Favoritos, Premium |
| Premium compartido | Identidad en el Cliente Mobile | Favoritos, Comparaciones (comparten el mismo prerequisito, no dependen entre sí) |
| Alertas unificadas | Identidad en el Cliente Mobile **+ resolver Decisión Pendiente #4** (¿se reconcilia `email_alerts` con Perfil?) | Puede diseñarse en paralelo con Favoritos/Comparaciones/Premium, pero no implementarse hasta resolver la decisión |
| Historial opt-in | Identidad en el Cliente Mobile **+ resolver Decisión Pendiente #1** (tensión de privacidad) | No depende de Favoritos/Alertas/Comparaciones/Premium, pero no puede secuenciarse en una fase concreta hasta que el comité decida |
| Preferencia de comuna | Resolver Decisión Pendiente #2 (¿es del Usuario o del contexto?) | No aplica hasta que exista esa decisión |

**Bloqueo estructural único:** Identidad en el Cliente Mobile es el prerequisito de todo lo demás en esta tabla. No hay ninguna funcionalidad de convergencia que pueda completarse sin ella.

**Bloqueos de decisión de negocio (no técnicos):** Alertas unificadas e Historial opt-in no dependen solo de trabajo técnico — dependen de que el comité resuelva primero las Decisiones Pendientes de las que `USER_DOMAIN_MODEL.md` ya advirtió.

**Nota (revisión PLATFORM-002A):** esta tabla confirma que, por dependencia técnica pura, Favoritos, Comparaciones y Premium son mutuamente paralelizables — ninguno depende de otro. El orden entre ellos en el roadmap (§6) es, por lo tanto, una decisión de secuenciación por valor y riesgo, no una consecuencia obligada del grafo de dependencias. Esto es precisamente lo que permite reordenarlos sin invalidar esta tabla — ver §6.2.

---

## 6. Roadmap de convergencia

### 6.1 Fase 1 — Identidad y Perfil, dividida en dos etapas (revisión PLATFORM-002A)

El comité observó que la Fase 1 original agrupaba Identidad y Perfil en un solo bloque, y propuso dividirla:

- **Fase 1A — Identidad pura:** login, registro, logout, persistencia de sesión. Nada de Favoritos, Alertas, Comparaciones, Preferencias o Premium se toca todavía. Objetivo único: validar que el Cliente Mobile y el Cliente Web reconocen a la misma Persona.
- **Fase 1B — Perfil, Preferencias y Configuración del Usuario:** una vez que la Fase 1A esté estable, se construye sobre ella lo que el Perfil representa (contacto, plan) y las preferencias declaradas por el Usuario (ver §5 de `USER_DOMAIN_MODEL.md` y la Decisión Pendiente #2 sobre la comuna, si el comité la clasifica como del Usuario).

*Aclaración necesaria para no confundir con otra entidad ya clasificada:* la "Configuración del Usuario" de la Fase 1B es distinta de la "Configuración remota" de §3 (farmacias activas, banner de donación) — esa última ya es, y sigue siendo, un dato de la Plataforma, igual para todas las Personas, sin relación con esta fase.

**Evaluación de si la división reduce riesgo — se adopta, con justificación propia:** `USER_DOMAIN_MODEL.md` ya trata Identidad (BC-005) y Perfil (BC-006) como dos conceptos distintos en su propio Vocabulario base — el plan original los fusionó en una sola fase sin aprovechar esa distinción ya existente. Separarlos reduce riesgo por una razón concreta y no solo formal: la pieza de mayor incertidumbre técnica es que el Cliente Mobile, que hoy no tiene ninguna infraestructura de sesión, reconozca correctamente a la misma Persona que el Cliente Web (persistencia de sesión entre reinicios de la app, expiración/renovación de tokens, etc.) — validar *solo eso* primero, sin construir todavía Perfil ni Preferencias encima, evita invertir trabajo de UI/dominio sobre un mecanismo de reconocimiento que todavía no se demostró estable. Esta división no cambia el modelo de dominio ni agrega dependencias nuevas: Fase 1B sigue dependiendo únicamente de Fase 1A, tal como ya lo hacía "Perfil" de "Identidad" en la versión anterior de este plan.

### 6.2 Orden del roadmap: comparación de dos alternativas (revisión PLATFORM-002A)

El comité propuso evaluar si el roadmap debe priorizar valor para la Persona antes que infraestructura de negocio, comparando:

- **Alternativa A (versión original de este plan):** Identidad → Premium → Favoritos → Comparaciones → Alertas → Historial.
- **Alternativa B (propuesta por el comité):** Identidad → Favoritos → Comparaciones → Alertas → Premium → Historial.

| Criterio | Alternativa A (Premium antes) | Alternativa B (Premium después) |
|---|---|---|
| Valor para la Persona | Premium no ofrece ningún valor perceptible hoy: el catálogo comercial está vacío salvo la fila de cortesía (`CURRENT_PLATFORM_ASSESSMENT.md` §2.7) — converger algo que nadie puede comprar todavía no cambia la experiencia de ninguna Persona. | Favoritos/Comparaciones/Alertas sincronizados son mejoras tangibles y sentidas de inmediato por cualquier Persona que ya usa esas funciones hoy, en cualquiera de los dos clientes. |
| Dependencia técnica | Ninguna — Premium, Favoritos, Comparaciones y Alertas dependen únicamente de Identidad (§5), no entre sí. | Idéntico — el mismo grafo de dependencias permite este orden sin violar ninguna precedencia técnica. |
| Riesgo | Construir la convergencia de Premium antes de que exista un catálogo comercial real es, según el propio §7 de este plan, un riesgo ya señalado: invertir esfuerzo en una capacidad sin producto que la justifique. | El riesgo equivalente (Alertas antes de resolver la Decisión Pendiente #4) ya existía en ambas alternativas y no cambia con el orden — se mitiga igual en cualquiera de las dos, exigiendo resolver esa decisión antes de esa fase específica. |
| Retorno | Retorno diferido: la inversión en convergencia de Premium solo se traduce en valor una vez que el negocio defina un catálogo — algo fuera del control de este plan y sin fecha. | Retorno inmediato y demostrable en cada fase, sin depender de una decisión de negocio externa (catálogo comercial) para que el trabajo ya entregado tenga sentido. |

**Conclusión: se adopta la Alternativa B.** No hay ninguna razón de dependencia técnica que exija Premium antes que Favoritos/Comparaciones/Alertas — la Alternativa A lo ubicaba ahí únicamente por "priorización de valor de negocio", una justificación que la propia revisión de §7 (riesgo de negocio en Premium) ya debilitaba. Reordenar según valor entregado a la Persona, manteniendo intactas las condiciones de negocio ya identificadas para Alertas e Historial, es una mejora real del plan, no solo una preferencia estética.

### 6.3 Roadmap (versión revisada)

**Fase 0 — Resolver las Decisiones Pendientes que bloquean fases posteriores.**
No es una fase de producto, es una condición de entrada. La Decisión Pendiente #4 de `USER_DOMAIN_MODEL.md` (reconciliación de `email_alerts` con el concepto único de Alerta, ver §4.4) debe resolverse antes de diseñar la fase de Alertas; la Decisión Pendiente #1 (privacidad del historial) debe resolverse antes de incluir Historial en cualquier fase concreta.

**Fase 1 — Identidad y Perfil en el Cliente Mobile** (dividida en 1A y 1B, ver §6.1).
*Por qué primero:* es el único prerequisito estructural de absolutamente todo lo demás (§5).
*Restricción que debe respetarse:* esta fase requiere modificar código de `mobile/`, y `mobile/` está hoy en Prueba Cerrada de Google Play, con una restricción activa documentada en `CLAUDE.md`. Esto no es un hallazgo nuevo — es exactamente el trabajo que `docs/product/COMPANY_STRATEGY.md` (§5) ya nombró explícitamente como **"Fase 2b (pausada)": "Cuentas de usuario con sincronización de favoritos/alertas en la app... pausada hasta que se resuelva la restricción"**. Este plan no reabre esa pausa ni decide cuándo levantarla. Mientras la restricción esté activa, esta fase puede avanzar en diseño, nunca en código — y dentro del diseño, la Fase 1A (Identidad pura) puede detallarse y validarse conceptualmente antes que la Fase 1B, según lo ya justificado en §6.1.

**Fase 2 — Favoritos y Comparaciones (Carrito / "Mi receta") sincronizados.**
*Por qué inmediatamente después de Identidad (revisado en PLATFORM-002A):* ambas comparten el mismo razonamiento de dominio (§4, §4.3) y son las de mayor valor inmediato y perceptible para la Persona, sin depender de ninguna Decisión Pendiente del comité (§6.2).

**Fase 3 — Alertas unificadas.**
*Por qué después de Favoritos/Comparaciones:* a diferencia de esas dos, Alertas requiere primero la resolución de la Fase 0 (Decisión Pendiente #4) — sin ella, cualquier trabajo de unificación arriesga construirse sobre un supuesto no confirmado por el comité. El orden relativo a Favoritos/Comparaciones no responde a una dependencia técnica (§5) sino a que estas últimas no tienen ninguna condición de negocio pendiente y Alertas sí.

**Fase 4 — Premium compartido** (revisado en PLATFORM-002A: antes era Fase 2).
*Por qué se mueve después de Favoritos/Comparaciones/Alertas:* el motor de entitlement ya existe y ya es único en los Servicios de Plataforma — lo único que falta es que el Cliente Mobile pueda autenticarse para consultarlo, y esa capacidad no depende de en qué momento del roadmap se construya. Postergarla no retrasa ningún valor real hoy disponible para la Persona, porque el catálogo comercial todavía no existe (§6.2, §7).

**Fase 5 — Historial de búsquedas (únicamente si el comité aprueba una sincronización opt-in).**
*Por qué al final y de forma condicional:* es la única funcionalidad donde "pertenece al Usuario" no implica automáticamente "debe sincronizarse" (§4). Depende enteramente de que el comité resuelva la Decisión Pendiente #1 en la Fase 0. Si el comité decide que el historial nunca debe sincronizarse, esta fase se retira del roadmap sin afectar ninguna de las anteriores.

**Preferencia de comuna:** no se asigna a ninguna fase — no puede secuenciarse hasta que exista una resolución de la Decisión Pendiente #2.

---

## 7. Riesgos

- **Pérdida de datos.** Al converger Favoritos/Alertas/Comparaciones hoy locales en el Cliente Mobile hacia un modelo sincronizado, existe el riesgo de que lo ya guardado en `AsyncStorage` no se traslade correctamente si el trabajo técnico futuro no contempla explícitamente esa continuidad.
- **Duplicación.** Si Alertas se unifica sin resolver primero la reconciliación con `email_alerts` (Decisión Pendiente #4), una misma Persona podría terminar con alertas duplicadas bajo dos identidades distintas — su email suelto por un lado, su Perfil por otro.
- **Privacidad.** Sincronizar Historial sin resolver antes la Decisión Pendiente #1 arriesga centralizar datos sensibles de búsquedas de salud sin que la Persona lo haya decidido explícitamente.
- **Sincronización.** Si una misma Persona usa el Cliente Mobile y el Cliente Web casi simultáneamente y modifica Favoritos o Comparaciones desde ambos, puede haber conflictos de estado — este plan no diseña cómo resolverlos, solo advierte que la fase correspondiente deberá contemplarlo.
- **Experiencia de usuario.** Cualquier fase que introduzca fricción de identificación para funciones que hoy funcionan sin login (Favoritos, Alertas, Comparaciones anónimas) rompería el Principio 1 de `USER_DOMAIN_MODEL.md` si no preserva explícitamente la alternativa anónima en cada entrega.
- **Compatibilidad / restricción operativa.** Toda fase que toque `mobile/` (empezando por la Fase 1) choca con la restricción activa de Prueba Cerrada.
- **Riesgo de negocio en Premium (ya mitigado por el reordenamiento, ver §6.2).** Ejecutar la convergencia de Premium (ahora Fase 4) antes de que exista un catálogo comercial real (`subscription_plans` vacío salvo la fila de cortesía) seguiría sin generar valor comercial inmediato — el reordenamiento reduce el riesgo de invertir esfuerzo temprano en esto, pero no lo elimina: si se llega a la Fase 4 y el catálogo sigue vacío, el riesgo original se mantiene igual de vigente.

---

## 8. Principios de implementación

1. **Ninguna fase puede exigir Identidad para comparar precios.** El uso anónimo permanece completo e indefinido (Principio 1, `USER_DOMAIN_MODEL.md`).
2. **Toda sincronización debe respetar la clasificación de `USER_DOMAIN_MODEL.md`.** Solo converge lo que el modelo ya clasificó como del Usuario; lo que es del Dispositivo o de la Plataforma no se sincroniza nunca, por definición.
3. **Ninguna funcionalidad Premium altera la neutralidad del comparador.** El precio y el orden de farmacias nunca dependen de si la Persona es Usuario Premium (Principio 10, `USER_DOMAIN_MODEL.md`).
4. **Ninguna fase se ejecuta en código sobre `mobile/` mientras la restricción de Prueba Cerrada esté activa.** El diseño puede avanzar; la implementación no, hasta que se levante.
5. **Ninguna fase de sincronización se implementa antes de resolver la Decisión Pendiente de negocio de la que depende** (§5) — evita construir sobre un supuesto que el comité todavía no confirmó.
6. **Identificarse sigue siendo, en cada fase, una decisión voluntaria de la Persona.** Ninguna fase puede convertir la identificación en un requisito impuesto por la plataforma (Principio 2, `USER_DOMAIN_MODEL.md`).
7. **Toda funcionalidad anónima debe seguir siendo anónima después de cada fase.** Converger no significa reemplazar la opción anónima — significa agregar la opción de que, además, siga a la Persona si ella lo decide.
8. **La distinción anónimo/identificado es un mecanismo de Identidad, no un tipo de dato de dominio** (revisión PLATFORM-002A, §4.4). Ninguna implementación futura debe modelar "versión anónima" y "versión identificada" de Favoritos, Alertas o Comparaciones como conceptos separados — son, cada una, un solo concepto con más de un mecanismo de persistencia posible.
9. **Ninguna fase reconcilia automáticamente dos señales de una misma Persona sin una acción explícita de ella** (Principio 14, `USER_DOMAIN_MODEL.md`) — un email suelto de `email_alerts` nunca se fusiona con un Perfil que use el mismo correo sin que la Persona lo confirme.
10. **Cada fase debe poder revertirse o pausarse sin dejar a ninguna Persona sin acceso a lo que ya tenía** (Principio 11, Reversibilidad, `USER_DOMAIN_MODEL.md`).
11. **La convergencia no crea una fuente de verdad paralela.** Cuando algo se unifica, la implementación previa se retira — nunca coexisten indefinidamente dos versiones del mismo concepto de dominio.
12. **El orden de las fases prioriza valor demostrable para la Persona sobre infraestructura sin uso inmediato** (revisión PLATFORM-002A, §6.2), salvo cuando una condición de negocio o una Decisión Pendiente del comité obligue a posponer una fase específica.

---

## 9. Criterios de éxito

La convergencia puede considerarse terminada cuando:

1. Una Persona puede autenticarse (o no) desde el Cliente Mobile o el Cliente Web indistintamente, con la misma Identidad y el mismo Perfil en ambos.
2. El estado de Premium de una Persona es idéntico y consistente sin importar desde qué cliente se consulte, en todo momento.
3. Favoritos y Comparaciones creados desde un cliente son visibles desde el otro, para una Persona identificada, sin ninguna acción manual de exportar/importar.
4. Existe un solo concepto de dominio para Alertas de precio (no dos tipos, ni dos mecanismos tratados como si fueran conceptos distintos, ver §4.4), y la relación con el mecanismo anterior de `email_alerts` quedó explícitamente resuelta.
5. Toda funcionalidad que era anónima antes de la convergencia sigue siendo utilizable de forma 100% anónima después.
6. El historial de búsquedas, si llega a sincronizarse, solo lo hace para Personas que lo activaron explícitamente (Opt-In verificable), nunca por defecto.
7. Ninguna de las Decisiones Pendientes listadas en `USER_DOMAIN_MODEL.md` ni en este documento quedó sin resolver antes de que la fase que dependía de ella se declarara completa.
8. No queda ninguna implementación duplicada de un concepto de dominio ya unificado (por ejemplo: ya no existen dos lugares distintos donde "favoritos", "alertas" o "lista de medicamentos" signifiquen cosas distintas entre sí).

---

## Validación final — revisión PLATFORM-002A

### Cambios realizados

1. **Fase 1 dividida en 1A (Identidad pura) y 1B (Perfil, Preferencias, Configuración del Usuario).** Nueva sección §6.1.
2. **Roadmap reordenado:** Identidad → Favoritos/Comparaciones → Alertas → Premium → Historial (antes: Identidad → Premium → Favoritos → Comparaciones → Alertas → Historial). Nueva sección §6.2 con la comparación explícita de ambas alternativas; §6.3 reescrita con la numeración de fases actualizada.
3. **Carrito y "Mi receta" tratados explícitamente como una sola entidad de dominio**, sin proponer nombre. Nueva sección §4.3.
4. **Alertas modelada explícitamente como un solo concepto de dominio** ("Alerta") con dos mecanismos de persistencia (anónimo/identificado), no como dos tipos separados. Nueva sección §4.4. Se agregó el Principio de implementación #8 para que esta distinción se respete en cualquier trabajo futuro.
5. **Terminología "Cliente Web" / "Cliente Mobile" / "Servicios de Plataforma"** adoptada en la prosa propia de este documento (nota terminológica agregada en el encabezado; aplicada en §1–§9), preservando sin cambios toda cita literal a `CURRENT_PLATFORM_ASSESSMENT.md`, `USER_DOMAIN_MODEL.md`, rutas de archivo y nombres de tablas/stores reales.
6. Referencias cruzadas a la numeración de fases actualizadas en §7 (riesgo de Premium) y en las Preguntas Pendientes.

### Cambios descartados (o no adoptados en su totalidad)

- **Elegir un nombre para el concepto unificado de Comparaciones** (ej. "Mis Medicamentos", "Mis Listas") — explícitamente fuera de alcance de esta revisión, según la instrucción del propio comité ("no elegir un nombre"). Se registra la unificación conceptual, no la nomenclatura.
- **Reemplazo retroactivo de "mobile/"/"web/"/"api/" en citas literales** a `CURRENT_PLATFORM_ASSESSMENT.md` y `USER_DOMAIN_MODEL.md`, o en nombres de archivo/tabla/store reales — se descarta porque alteraría, aunque sea tipográficamente, contenido ya aprobado que este documento tiene prohibido modificar, y porque nombres de código (`mobile/`, `cartStore`, etc.) son identificadores factuales, no lenguaje arquitectónico conceptual.
- **Fusionar la Fase 1B con la Fase 2 (Favoritos/Comparaciones)** aunque la tabla de dependencias (§5) muestre que ninguna depende de contenido específico del Perfil — se descarta porque Perfil (BC-006) presupone conceptualmente que la Identidad (BC-005) ya esté reconocida y estable, mientras que Favoritos/Comparaciones son pertenencias del Usuario que dependen de la Identidad, no del Perfil en sí; fusionarlas perdería esa distinción ya establecida en `USER_DOMAIN_MODEL.md`.

### Justificación (resumen por observación)

| # | Observación del comité | Decisión | Justificación breve |
|---|---|---|---|
| 1 | Dividir Fase 1 en 1A/1B | Adoptada | Aprovecha la distinción Identidad/Perfil (BC-005/BC-006) ya existente en `USER_DOMAIN_MODEL.md`; aísla la mayor incertidumbre técnica (reconocimiento de sesión entre clientes) antes de construir sobre ella. |
| 2 | Reordenar el roadmap por valor de usuario | Adoptada (Alternativa B) | Mismo grafo de dependencias (§5); Premium no genera valor real hoy por falta de catálogo comercial (riesgo ya señalado en §7 desde la versión original); Favoritos/Comparaciones/Alertas sí generan valor inmediato. |
| 3 | Unificar Carrito y "Mi receta" | Adoptada (sin nombrar) | Ambos resuelven la misma necesidad recurrente de una Persona (§2 `USER_DOMAIN_MODEL.md`); la diferencia es de presentación (canasta vs. ítem), no de dominio. |
| 4 | Modelo de Alertas único vs. dos tipos | Adoptada (un solo concepto) | Mismo patrón ya usado para Favoritos: anónimo/identificado es una distinción de Identidad (mecanismo), no del dato de dominio. |
| 5 | Lenguaje "Cliente Web/Mobile/Servicios de Plataforma" | Adoptada parcialmente (en la prosa propia, no en citas literales) | Consistente con el encuadre "una única Plataforma con múltiples clientes" ya declarado explícitamente en PLATFORM-001/DOMAIN-001/PLATFORM-002; no se aplica a citas o identificadores de código porque eso alteraría contenido ya aprobado o hechos factuales. |

### Impacto

| # | Observación | Impacto |
|---|---|---|
| 1 | División Fase 1A/1B | **Medio** — reestructura la Fase 1 y su justificación; no cambia dependencias generales ni el resto del roadmap. |
| 2 | Reordenamiento del roadmap | **Alto** — cambia el orden completo de las Fases 2 a 5 y todas las referencias cruzadas a esos números en §7 y Preguntas Pendientes. |
| 3 | Unificación de Comparaciones | **Bajo** — clarifica y explicita una interpretación que ya estaba implícita en §3/§4 de la versión anterior; no cambia estructura ni roadmap. |
| 4 | Modelo único de Alertas | **Bajo-Medio** — clarifica el lenguaje de dominio en §4 y agrega un principio de implementación nuevo (#8); no cambia el roadmap ni las dependencias. |
| 5 | Terminología de clientes | **Bajo** — cambio terminológico en la prosa propia del documento; no altera ninguna decisión, dependencia, riesgo ni criterio de éxito. |

No se modificó `docs/domain/USER_DOMAIN_MODEL.md`, `docs/analysis/CURRENT_PLATFORM_ASSESSMENT.md`, código, base de datos ni APIs — consistente con las restricciones de este sprint.

### Preguntas pendientes (sin cambios de fondo respecto a la versión anterior, salvo alineación de lenguaje)

1. Las siete Decisiones Pendientes ya listadas en `docs/domain/USER_DOMAIN_MODEL.md` siguen sin resolver y bloquean, específicamente, las Fases 3 y 5 de este roadmap (Alertas e Historial) y la clasificación de la Preferencia de comuna.
2. ¿Cuándo se considera que `mobile/` "salió" de Prueba Cerrada de Google Play, y quién toma esa decisión? Es el único bloqueo que impide iniciar la Fase 1 en código.
3. ¿El mecanismo anónimo de creación de una Alerta (hoy vía email+token) debe seguir ofreciéndose una vez unificado el concepto de dominio "Alerta" (§4.4), o se retira en favor de exigir Identidad para esa función específica?
4. ¿La Fase 4 (Premium compartido, antes Fase 2) debe esperar a que exista un catálogo comercial real, o se considera valioso construir la capacidad de convergencia antes de que exista qué vender en el Cliente Mobile?

Este documento queda a la espera de aprobación explícita antes de continuar con cualquier trabajo posterior.
