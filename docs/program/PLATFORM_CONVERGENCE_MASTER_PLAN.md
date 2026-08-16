# Platform Convergence Master Plan — ComparaFarma

**Sprint:** EXECUTION-001
**Tipo:** Backlog de ejecución (no arquitectura, no diseño, no investigación)
**Fecha de corte:** 2026-08-06
**Alcance:** transformar la arquitectura funcional ya aprobada en un plan completamente ejecutable — Épicas, Features, Historias de Usuario, dependencias, MVP, Releases, riesgos de ejecución, Definition of Done y trazabilidad. No redefine ninguna decisión ya tomada.
**Línea base (no modificada, no repetida):** `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md`, `docs/technology/domain/USER_DOMAIN_MODEL.md`, `docs/technology/architecture/IDENTITY_INTEGRATION_PLAN.md` (versión revisada PLATFORM-002A), `docs/technology/architecture/PLATFORM_CAPABILITY_MODEL.md`.

**Nota de alcance (importante, no es una redefinición):** este plan cubre exclusivamente la convergencia de Identidad ya delimitada por `IDENTITY_INTEGRATION_PLAN.md` (Fases 0 a 5) y las Capacidades que ese plan ya declaró parte de su alcance. Las Capacidades de las ramas Inteligencia y de Monetizar distintas de Premium (Convenios, API Comercial, Publicidad ética) no son parte de la convergencia de Identidad — son construcción de Capacidades nuevas, no unificación de lo que ya existe en dos clientes — y por lo tanto no tienen Épica en este plan, consistente con `IDENTITY_INTEGRATION_PLAN.md` §3, que ya las marcó fuera de esa convergencia. Tampoco se incluyen brechas de paridad de funcionalidad entre clientes que no dependen de Identidad (ej. selector de comuna en el Cliente Web, compartir en el Cliente Web) — son decisiones de producto independientes, no convergencia de Identidad.

---

## 1. Épicas

### EPIC 0 — Resolución de Decisiones de Gobernanza

- **Objetivo:** resolver, antes de diseñar o construir nada, las Decisiones Pendientes de negocio que `USER_DOMAIN_MODEL.md` e `IDENTITY_INTEGRATION_PLAN.md` dejaron explícitamente abiertas.
- **Descripción:** no es una Épica de construcción — es un gate de decisiones que deben quedar resueltas y registradas antes de que ciertas Épicas posteriores puedan avanzar más allá del diseño.
- **Criterio de éxito:** cada Decisión Pendiente relevante para la convergencia tiene una resolución explícita, tomada por el comité, y registrada en algún documento de gobierno (fuera del alcance de este plan decidir cuál).
- **Capacidades involucradas:** Alertas de precio, Historial de búsquedas, Administrar Preferencias del Usuario, Reconocer Identidad, Suscripción Premium (indirectamente, por la Pregunta Pendiente #4).
- **Dependencias:** ninguna — es, junto con Epic 1, el punto de partida.

### EPIC 1 — Identity Foundation

- **Objetivo:** que el Cliente Mobile y el Cliente Web reconozcan a la misma Persona (Fase 1A de `IDENTITY_INTEGRATION_PLAN.md`).
- **Descripción:** construir en el Cliente Mobile el mecanismo de Identidad que hoy solo existe en el Cliente Web, validando que ambos reconocen la misma cuenta — sin sincronizar todavía ninguna pertenencia (Favoritos, Alertas, etc.).
- **Criterio de éxito:** una Persona puede iniciar sesión con la misma cuenta desde cualquiera de los dos clientes y la Plataforma la reconoce como la misma Persona en ambos.
- **Capacidades involucradas:** Reconocer a la misma Persona entre clientes.
- **Dependencias:** Epic 0 (específicamente, la resolución de cuándo se levanta la restricción de Prueba Cerrada) para poder ejecutarse en código — el diseño puede avanzar antes.

### EPIC 2 — Perfil y Preferencias

- **Objetivo:** que el Perfil de una Persona ya identificada sea accesible y consistente desde cualquier cliente (Fase 1B de `IDENTITY_INTEGRATION_PLAN.md`).
- **Descripción:** construir sobre la Identidad ya estable de Epic 1 lo que el Perfil representa (contacto, plan) y, si el comité lo aprueba, las preferencias declaradas por el Usuario.
- **Criterio de éxito:** una Persona identificada ve el mismo Perfil sin importar el cliente desde el que acceda.
- **Capacidades involucradas:** Administrar Perfil, Administrar Preferencias del Usuario.
- **Dependencias:** Epic 1 completa. La parte de Preferencias depende, además, de que Epic 0 resuelva la Decisión Pendiente #2.

### EPIC 3 — Convergencia de Favoritos y Listas Recurrentes

- **Objetivo:** que Favoritos y las listas recurrentes de medicamentos (hoy "Carrito" en un cliente y "Mi receta" en el otro) sigan a la Persona, no al dispositivo.
- **Descripción:** unificar el concepto de dominio de "lista recurrente de medicamentos" (hoy duplicado e incompatible entre clientes, `IDENTITY_INTEGRATION_PLAN.md` §4.3) y sincronizar tanto esa lista unificada como los Favoritos para cualquier Persona identificada, preservando el funcionamiento local para quien no se identifica.
- **Criterio de éxito:** Favoritos y listas creados desde un cliente son visibles desde el otro para una Persona identificada, sin ninguna acción manual; quien no se identifica conserva el comportamiento local de hoy sin ningún cambio.
- **Capacidades involucradas:** Favoritos, Listas recurrentes de medicamentos, Comparar una lista de medicamentos.
- **Dependencias:** Epic 1 completa. No depende de Epic 2.

### EPIC 4 — Unificación de Alertas

- **Objetivo:** que exista un solo concepto de dominio "Alerta" (no dos mecanismos tratados como conceptos distintos, `IDENTITY_INTEGRATION_PLAN.md` §4.4), con la relación con el mecanismo anterior (`email_alerts`) resuelta explícitamente.
- **Descripción:** construir el modelo único de Alerta con dos mecanismos de persistencia posibles (anónimo e identificado), y resolver qué pasa con las alertas ya creadas bajo el mecanismo anterior.
- **Criterio de éxito:** no queda ningún lugar donde "Alerta" signifique dos cosas distintas; toda alerta previa quedó fusionada, migrada o formalmente descontinuada, según lo decidido en Epic 0.
- **Capacidades involucradas:** Alertas de precio, Avisar a la Persona cuando se cumple una alerta.
- **Dependencias:** Epic 1 completa + Epic 0 (Decisión Pendiente #4 y Pregunta Pendiente #3 resueltas). No depende de Epic 2 ni Epic 3.

### EPIC 5 — Convergencia de Premium

- **Objetivo:** que el estado de Premium de una Persona sea idéntico y consistente sin importar desde qué cliente se consulte.
- **Descripción:** extender al Cliente Mobile la capacidad de consultar el motor de entitlement que ya existe y ya es único en los Servicios de Plataforma.
- **Criterio de éxito:** una Persona identificada ve el mismo estado de Premium (activo/inactivo/plan) desde cualquier cliente, en todo momento.
- **Capacidades involucradas:** Suscripción Premium.
- **Dependencias:** Epic 1 completa. No depende de Epic 2, 3 ni 4. La existencia de un catálogo comercial real vendible depende de la Pregunta Pendiente #4 de Epic 0, pero no bloquea la construcción de la capacidad de convergencia en sí (ver Riesgo en §7).

### EPIC 6 — Historial de Búsquedas Opt-In (condicional)

- **Objetivo:** permitir que una Persona identificada decida explícitamente sincronizar su historial de búsquedas entre clientes.
- **Descripción:** existe únicamente si el comité, en Epic 0, resuelve la Decisión Pendiente #1 a favor de permitir la sincronización. Si el comité decide que el historial nunca debe sincronizarse, esta Épica se retira completa del backlog sin afectar ninguna de las anteriores.
- **Criterio de éxito:** el historial de búsquedas solo se sincroniza para Personas que activaron explícitamente el Opt-In; nunca por defecto.
- **Capacidades involucradas:** Historial de búsquedas.
- **Dependencias:** Epic 1 completa + Epic 0 (Decisión Pendiente #1 resuelta a favor). No depende de Epic 2, 3, 4 ni 5.

**Fuera de alcance de este plan, sin Épica asignada (ver Nota de alcance):** Administrar Preferencias del Usuario más allá de lo que Epic 2 ya cubre condicionalmente; Gestionar consentimiento (capacidad "No iniciada" en `PLATFORM_CAPABILITY_MODEL.md`, sin fase asignada por `IDENTITY_INTEGRATION_PLAN.md`); todas las Capacidades de Monetizar distintas de Premium; todas las Capacidades de Inteligencia; todas las brechas de paridad entre clientes no relacionadas con Identidad.

---

## 2. Features por Épica

**EPIC 0**
- 0.1 Resolver la reconciliación de Alertas anónimas (`email_alerts`) con el Perfil
- 0.2 Resolver la política de sincronización del Historial de búsquedas
- 0.3 Resolver la clasificación de la Preferencia de comuna (Usuario vs. contexto)
- 0.4 Resolver si el mecanismo anónimo de Alertas debe preservarse tras la unificación
- 0.5 Resolver si la convergencia de Premium debe esperar a un catálogo comercial real
- 0.6 Resolver cuándo se considera levantada la restricción de Prueba Cerrada sobre `mobile/`

**EPIC 1**
- 1.1 Login desde el Cliente Mobile
- 1.2 Registro desde el Cliente Mobile
- 1.3 Logout desde el Cliente Mobile
- 1.4 Persistencia de sesión en el Cliente Mobile
- 1.5 Validación de reconocimiento cross-cliente (la misma Persona en Mobile y Web)

**EPIC 2**
- 2.1 Perfil accesible desde el Cliente Mobile
- 2.2 Preferencias del Usuario en el Cliente Mobile (condicional a Epic 0.3)

**EPIC 3**
- 3.1 Unificación conceptual de "lista recurrente de medicamentos" (Carrito + "Mi receta")
- 3.2 Favoritos sincronizados para Personas identificadas
- 3.3 Lista recurrente unificada, sincronizada para Personas identificadas

**EPIC 4**
- 4.1 Modelo único de dominio "Alerta"
- 4.2 Mecanismo de persistencia identificado (ligado a Perfil)
- 4.3 Mecanismo de persistencia anónimo (preservado o retirado según Epic 0.4)
- 4.4 Reconciliación o migración de las alertas ya existentes bajo `email_alerts`

**EPIC 5**
- 5.1 Entitlement de Premium consultable desde el Cliente Mobile
- 5.2 Experiencia de suscripción/estado Premium en el Cliente Mobile

**EPIC 6**
- 6.1 Mecanismo de activación explícita (Opt-In) del historial sincronizado
- 6.2 Sincronización del historial de búsquedas para quien activó el Opt-In

---

## 3. Historias de Usuario

### EPIC 0

**0.1 — Reconciliación de Alertas anónimas con el Perfil**
Como Comité de producto, quiero decidir si una alerta creada por email sin cuenta debe reconciliarse con el Perfil cuando esa misma Persona se registra con el mismo correo, para que Epic 4 no se construya sobre un supuesto no confirmado.
*Criterios de aceptación:* la decisión queda registrada explícitamente (sí se reconcilia / no se reconcilia / se reconcilia solo con confirmación de la Persona); Epic 4 no puede iniciar diseño detallado de 4.4 sin esta resolución.

**0.2 — Política de sincronización del Historial**
Como Comité de producto, quiero decidir si el historial de búsquedas puede sincronizarse entre clientes y bajo qué condición de privacidad, para resolver la tensión ya señalada en `USER_DOMAIN_MODEL.md` antes de construir Epic 6.
*Criterios de aceptación:* la decisión queda registrada (nunca sincroniza / sincroniza solo con Opt-In explícito / otra condición); si la decisión es "nunca", Epic 6 se retira del backlog.

**0.3 — Clasificación de la Preferencia de comuna**
Como Comité de producto, quiero decidir si la comuna habitual de una Persona es una preferencia que debe seguirla (Usuario) o un dato de contexto de cada búsqueda (Dispositivo/sesión), para poder incluir o excluir 2.2 del alcance de Epic 2.
*Criterios de aceptación:* la decisión queda registrada; si se clasifica como contexto, la Feature 2.2 se retira de Epic 2 sin afectar el resto de la Épica.

**0.4 — Preservación del mecanismo anónimo de Alertas**
Como Comité de producto, quiero decidir si una Persona podrá seguir creando una alerta sin identificarse después de que Alertas se unifique como concepto de dominio, para no romper el Principio de funcionamiento anónimo si la respuesta es afirmativa, o para retirar deliberadamente esa opción si la respuesta es negativa.
*Criterios de aceptación:* la decisión queda registrada; Epic 4 no puede completar la Feature 4.3 sin esta resolución.

**0.5 — Condición de catálogo comercial para Premium**
Como Comité de producto, quiero decidir si Epic 5 debe esperar a que exista un catálogo comercial real vendible, para no invertir esfuerzo de convergencia sobre una capacidad sin producto que ofrecer.
*Criterios de aceptación:* la decisión queda registrada (esperar catálogo / construir en paralelo); si la decisión es "esperar", Epic 5 se marca bloqueada hasta que el catálogo exista.

**0.6 — Fin de la restricción de Prueba Cerrada**
Como Comité de producto, quiero definir el criterio y el responsable de decidir cuándo `mobile/` sale de Prueba Cerrada de Google Play, para poder iniciar Epic 1 en código.
*Criterios de aceptación:* queda definido quién decide y con qué evidencia; hasta que esa condición se cumpla, Epic 1 permanece en diseño, nunca en código (Principio de implementación #4, `IDENTITY_INTEGRATION_PLAN.md`).

### EPIC 1

**1.1 — Login desde el Cliente Mobile**
Como Persona que ya tiene una cuenta creada desde el Cliente Web, quiero iniciar sesión también desde el Cliente Mobile, para que la Plataforma me reconozca sin importar qué cliente uso.
*Criterios de aceptación:* una Persona con cuenta puede autenticarse desde el Cliente Mobile con las mismas credenciales que usa en el Cliente Web; una Persona sin cuenta puede seguir usando el Cliente Mobile sin iniciar sesión, sin ninguna pérdida de funcionalidad (Principio 1, `USER_DOMAIN_MODEL.md`).

**1.2 — Registro desde el Cliente Mobile**
Como Persona nueva que usa el Cliente Mobile, quiero poder crear una cuenta directamente ahí, para no depender de abrir el Cliente Web para identificarme.
*Criterios de aceptación:* el registro desde el Cliente Mobile produce la misma Identidad reconocible que produce hoy el registro desde el Cliente Web; identificarse sigue siendo una decisión voluntaria, nunca requerida para comparar precios (Principio 2, `USER_DOMAIN_MODEL.md`).

**1.3 — Logout desde el Cliente Mobile**
Como Persona identificada en el Cliente Mobile, quiero poder cerrar sesión, para dejar de estar reconocida en ese dispositivo cuando yo lo decida.
*Criterios de aceptación:* cerrar sesión no elimina ninguna pertenencia ya sincronizada de la Persona (Principio 9/Reversibilidad, `USER_DOMAIN_MODEL.md`); el Cliente Mobile vuelve a su comportamiento anónimo completo tras el logout.

**1.4 — Persistencia de sesión en el Cliente Mobile**
Como Persona identificada en el Cliente Mobile, quiero que la sesión se mantenga entre usos de la app sin tener que volver a autenticarme cada vez, para que la experiencia sea consistente con lo que ya ocurre en el Cliente Web.
*Criterios de aceptación:* la sesión persiste entre reinicios de la app; la sesión se comporta de forma equivalente (no necesariamente idéntica técnicamente) a la persistencia ya existente en el Cliente Web.

**1.5 — Validación de reconocimiento cross-cliente**
Como Comité de producto, quiero validar que una misma Persona, autenticada en el Cliente Mobile y en el Cliente Web, es reconocida como la misma Identidad en ambos, para declarar cumplido el objetivo único de la Fase 1A antes de avanzar a cualquier Feature de sincronización de pertenencias.
*Criterios de aceptación:* existe evidencia verificable de que ambos clientes, con la misma cuenta, reconocen la misma Identidad; esta Feature es la condición de cierre de Epic 1 — ninguna Feature de Epic 2 a 6 puede declararse iniciada antes de que 1.5 esté satisfecha.

### EPIC 2

**2.1 — Perfil accesible desde el Cliente Mobile**
Como Persona identificada, quiero ver mi Perfil (contacto, plan) desde el Cliente Mobile igual que lo veo en el Cliente Web, para tener una sola relación con la Plataforma, no una por cliente.
*Criterios de aceptación:* el Perfil mostrado en el Cliente Mobile es exactamente el mismo dato que el Perfil del Cliente Web, sin duplicación ni reconstrucción independiente (Principio de convergencia de Perfil, `IDENTITY_INTEGRATION_PLAN.md` §4).

**2.2 — Preferencias del Usuario en el Cliente Mobile**
Como Persona identificada, quiero que mis preferencias declaradas (si el Comité las clasifica como del Usuario en Epic 0.3) me sigan entre clientes, para no repetir la misma configuración en cada uno.
*Criterios de aceptación:* condicional — solo aplica si Epic 0.3 resuelve que la preferencia en cuestión pertenece al Usuario; si resuelve lo contrario, esta Feature se retira sin afectar 2.1.

### EPIC 3

**3.1 — Unificación conceptual de la lista recurrente de medicamentos**
Como Persona que usa cualquiera de los dos clientes, quiero que "mi lista de medicamentos habituales" sea un solo concepto, no dos comportamientos distintos según el cliente, para que mi lista tenga sentido sin importar dónde la vea.
*Criterios de aceptación:* deja de existir una distinción de dominio entre "Carrito" y "Mi receta" — ambos pasan a ser una vista sobre el mismo concepto unificado (`IDENTITY_INTEGRATION_PLAN.md` §4.3); esta Feature no requiere que el comité elija un nombre nuevo para el concepto, eso queda fuera de este plan.

**3.2 — Favoritos sincronizados**
Como Persona identificada, quiero que los medicamentos que marco como favoritos en un cliente aparezcan también en el otro, para no tener que volver a marcarlos.
*Criterios de aceptación:* un favorito creado en un cliente es visible en el otro sin ninguna acción manual, solo para Personas identificadas; una Persona no identificada conserva Favoritos locales exactamente como hoy.

**3.3 — Lista recurrente unificada y sincronizada**
Como Persona identificada, quiero que mi lista recurrente de medicamentos (una vez unificado el concepto en 3.1) me siga entre clientes, para poder revisarla o compararla sin importar desde dónde acceda.
*Criterios de aceptación:* depende de 3.1 completada; un ítem agregado a la lista desde un cliente aparece en el otro para una Persona identificada; una Persona no identificada conserva el comportamiento local de hoy en cada cliente por separado.

### EPIC 4

**4.1 — Modelo único de dominio "Alerta"**
Como Comité de producto y equipo de desarrollo, queremos que exista un solo concepto de "Alerta" en el dominio, para no repetir en el futuro la fragmentación que hoy existe entre el mecanismo del Cliente Mobile y el del Cliente Web.
*Criterios de aceptación:* toda referencia futura a "Alerta" corresponde a un único concepto ("el compromiso de que se avise a una Persona si el precio de un medicamento baja de un umbral"), independientemente del mecanismo de persistencia (`IDENTITY_INTEGRATION_PLAN.md` §4.4).

**4.2 — Mecanismo de persistencia identificado**
Como Persona identificada, quiero poder crear una alerta que quede ligada a mi Perfil, para que me siga entre clientes igual que Favoritos.
*Criterios de aceptación:* una alerta creada por una Persona identificada es visible y gestionable desde cualquier cliente donde esa Persona se identifique.

**4.3 — Mecanismo de persistencia anónimo**
Como Persona que no quiere identificarse, quiero poder seguir creando una alerta de la forma en que ya existe hoy (si Epic 0.4 lo confirma), para no perder una función que ya tengo.
*Criterios de aceptación:* condicional a Epic 0.4; si se preserva, el mecanismo anónimo sigue disponible sin exigir Identidad; si se retira, la Feature documenta explícitamente qué reemplaza a esa vía para quien no quiere identificarse (aunque sea "ninguna", si esa fue la decisión del comité).

**4.4 — Reconciliación o migración de alertas existentes**
Como equipo de desarrollo, quiero saber qué pasa con las alertas ya creadas bajo el mecanismo anterior (`email_alerts`) al completar la unificación, para no perder compromisos ya asumidos con Personas reales.
*Criterios de aceptación:* depende de la resolución de Epic 0.1; ninguna alerta activa hoy queda huérfana o silenciosamente descontinuada sin que la Persona que la creó sea informada, consistente con el Principio de Reversibilidad.

### EPIC 5

**5.1 — Entitlement de Premium consultable desde el Cliente Mobile**
Como Persona identificada y con Premium activo, quiero que el Cliente Mobile sepa que tengo Premium, para no depender de estar en el Cliente Web para que se me reconozca como tal.
*Criterios de aceptación:* el estado de Premium consultado desde el Cliente Mobile coincide siempre con el consultado desde el Cliente Web, para la misma Persona, en el mismo momento.

**5.2 — Experiencia de suscripción/estado Premium en el Cliente Mobile**
Como Persona identificada, quiero poder ver mi estado de Premium desde el Cliente Mobile, para tener la misma relación con la Plataforma sin importar el cliente.
*Criterios de aceptación:* ninguna funcionalidad Premium altera el precio mostrado ni el orden de farmacias (Principio 3, `IDENTITY_INTEGRATION_PLAN.md` §8); esta Feature no incluye diseño de interfaz — solo la necesidad funcional de que el estado sea visible.

### EPIC 6 (condicional)

**6.1 — Mecanismo de activación explícita (Opt-In)**
Como Persona identificada, quiero decidir explícitamente si quiero que mi historial de búsquedas se sincronice entre clientes, para mantener control sobre un dato que puede ser sensible.
*Criterios de aceptación:* el historial nunca se sincroniza sin una acción explícita y afirmativa de la Persona; la ausencia de acción se interpreta siempre como "no sincronizar".

**6.2 — Sincronización del historial para quien activó el Opt-In**
Como Persona que activó el Opt-In, quiero que mi historial de búsquedas aparezca igual en cualquier cliente, para retomar donde quedé sin importar el dispositivo.
*Criterios de aceptación:* solo aplica a Personas con Opt-In activo; una Persona sin Opt-In conserva el historial local de hoy, sin ningún cambio.

---

## 4. Dependencias

**Mapa de dependencias (Épicas):**

```
Epic 0 (decisiones) ──┬──► Epic 1 (Identity Foundation) — bloqueado en código por 0.6, no en diseño
                       │         │
                       │         ├──► Epic 2 (Perfil y Preferencias) — 2.2 depende además de 0.3
                       │         ├──► Epic 3 (Favoritos y Listas)
                       │         ├──► Epic 4 (Alertas) — depende además de 0.1 y 0.4
                       │         └──► Epic 5 (Premium) — condicionada en valor real por 0.5
                       │
                       └──► Epic 6 (Historial Opt-In) — existe solo si 0.2 se resuelve a favor;
                                                          depende también de Epic 1
```

**Qué debe hacerse primero:** Epic 0 y Epic 1 son las únicas dos Épicas sin ninguna dependencia previa — pueden iniciarse de inmediato (Epic 0 en paralelo total; Epic 1 en diseño de inmediato, en código solo tras 0.6).

**Qué puede desarrollarse en paralelo:** Epic 2, Epic 3, Epic 4 y Epic 5 no dependen entre sí — todas dependen únicamente de que Epic 1 esté completa (más sus condiciones específicas de Epic 0). Un equipo podría trabajar Epic 3 mientras otro trabaja Epic 5, sin bloquearse mutuamente.

**Qué bloquea a qué:**
- Epic 1 bloquea a Epic 2, 3, 4, 5 y 6 en su totalidad — ninguna puede completarse (ni, salvo diseño, iniciarse en código) sin ella.
- Epic 0.6 bloquea a Epic 1 en código (no en diseño).
- Epic 0.1 y 0.4 bloquean específicamente a la Feature 4.4 y 4.3 de Epic 4 — el resto de Epic 4 (4.1, 4.2) puede diseñarse sin esperar esas decisiones, pero no completarse.
- Epic 0.3 bloquea específicamente a la Feature 2.2 de Epic 2 — no bloquea 2.1.
- Epic 0.2 determina si Epic 6 existe o no — si no se resuelve a favor, Epic 6 completa queda retirada.
- Epic 0.5 no bloquea técnicamente a Epic 5, pero condiciona si construirla genera valor real inmediato (ver Riesgo, §7).

**Dependencias a nivel de Feature dentro de Epic 3:** 3.3 depende de 3.1 (no se puede sincronizar una lista unificada antes de que el concepto esté unificado). 3.2 no depende de 3.1 — puede completarse de forma independiente.

**Dependencias a nivel de Feature dentro de Epic 1:** 1.5 depende de que 1.1, 1.2, 1.3 y 1.4 estén completas — es la validación final de la Épica, no puede ejecutarse antes.

---

## 5. MVP

**El mínimo conjunto de Features que permite lanzar la convergencia es: Epic 0 (solo 0.6, el resto puede continuar resolviéndose en paralelo sin bloquear el MVP) + Epic 1 completa (1.1 a 1.5) + Feature 2.1 de Epic 2.**

Justificación: el objetivo mínimo demostrable de "la Plataforma converge" es que una Persona pueda identificarse desde cualquier cliente y ver, como mínimo, que existe algo reconocible al hacerlo (su Perfil) — sin eso, Identidad por sí sola no tiene ninguna manifestación visible para la Persona, aunque sea una condición técnica necesaria. No se incluye ninguna otra Feature de Epic 2 en adelante en el MVP porque:
- 2.2 depende de una decisión de negocio todavía no tomada (Epic 0.3).
- Epic 3, 4, 5 y 6 aportan valor adicional real, pero cada una es, por sí sola, una unidad de valor completa que no necesita estar en el primer release para que el primer release tenga sentido — exactamente lo que el objetivo de esta sección pide no hacer ("no pensar en el producto completo").

**Explícitamente fuera del MVP:** Favoritos/Listas sincronizadas, Alertas unificadas, Premium compartido, Historial opt-in — cada una es un release posterior, no una condición para que el primero sea funcional.

---

## 6. Releases

**Release 1 — Fundamento de Identidad**
Epic 0 (0.6 como mínimo, idealmente también 0.1/0.3/0.4 resueltas en paralelo para no frenar el Release 2) + Epic 1 completa + Feature 2.1.
*Corresponde al MVP (§5).*

**Release 2 — Pertenencias sincronizadas**
Feature 2.2 (si Epic 0.3 ya se resolvió) + Epic 3 completa (Favoritos y Listas recurrentes unificadas y sincronizadas).
*Justificación de agrupación:* ambas dependen únicamente de Epic 1 y no tienen ninguna condición de negocio pendiente distinta entre sí — es el grupo de mayor valor inmediato disponible apenas termina el Release 1 (`IDENTITY_INTEGRATION_PLAN.md` §6.2).

**Release 3 — Alertas unificadas**
Epic 4 completa.
*Justificación de agrupación:* a diferencia del Release 2, depende de que Epic 0 resuelva primero 0.1 y 0.4 — se agrupa por separado para no bloquear el Release 2 con una condición de negocio que no le pertenece.

**Release 4 — Premium compartido**
Epic 5 completa.
*Justificación de agrupación:* no depende técnicamente de los Releases 2 o 3 — podría intercambiar de orden con cualquiera de ellos sin romper nada; se ubica aquí siguiendo el orden ya establecido en `IDENTITY_INTEGRATION_PLAN.md` §6.2 (valor inmediato para la Persona antes que infraestructura de negocio sin catálogo todavía).

**Release 5 — Historial de búsquedas Opt-In (condicional)**
Epic 6 completa, únicamente si Epic 0.2 se resolvió a favor de permitir la sincronización.
*Justificación de agrupación:* es el único Release que puede no llegar a existir — su inclusión en el plan depende enteramente de una decisión de negocio que este documento no toma.

---

## 7. Riesgos de ejecución

(No se repiten los riesgos técnicos/de dominio ya identificados en `IDENTITY_INTEGRATION_PLAN.md` §7 — estos son específicamente riesgos de cómo se ejecuta el trabajo.)

- **Avanzar en código antes de que Epic 0 resuelva la decisión correspondiente.** Bajo presión de tiempo, un equipo podría empezar a construir Epic 4 o Epic 6 asumiendo una respuesta a una Decisión Pendiente que todavía no fue tomada formalmente, obligando a rehacer trabajo si el comité decide algo distinto.
- **Diseño de Epic 1 desactualizado por una espera prolongada de Epic 0.6.** Si la restricción de Prueba Cerrada se mantiene mucho tiempo, el diseño detallado hecho hoy podría no reflejar cambios de contexto (nuevas versiones de dependencias, cambios en Supabase Auth, etc.) para cuando finalmente se pueda ejecutar en código.
- **Falta de coordinación entre Épicas paralelas que comparten a Epic 1 como base.** Si Epic 3 y Epic 5 se ejecutan en paralelo por equipos distintos, ambos dependen del mismo mecanismo de Identidad — un cambio no comunicado en cómo se consulta la Identidad desde uno de los dos podría generar inconsistencias al integrar.
- **Unificación parcial de Alertas.** Riesgo de que Epic 4 se declare "completada" habiendo construido el modelo único (4.1) sin haber ejecutado realmente la reconciliación o migración (4.4) — dejando, en la práctica, la misma fragmentación de hoy aunque el backlog diga lo contrario.
- **Ejecutar Epic 6 sin aprobación explícita del comité.** Riesgo de que, por inercia ("ya que se está trabajando en sincronización"), se construya historial sincronizado sin que Epic 0.2 haya sido resuelto a favor, violando directamente el criterio de éxito de esa Épica.
- **Percepción de bajo valor del Release 1.** Al no incluir todavía ninguna pertenencia sincronizada (solo Identidad y Perfil), el primer release podría percibirse como "sin nada que mostrar", generando presión para reordenar el backlog y adelantar Features de valor más visible antes de que la base (Epic 1) esté validada.
- **Subestimar el esfuerzo de Epic 3 por parecer solo "sincronizar dos listas ya existentes".** El trabajo real empieza por unificar dos conceptos de dominio distintos (3.1) antes de poder sincronizar nada (3.3) — tratarlo como una sola tarea simple puede llevar a subestimar el alcance real.
- **Tratar el MVP como el producto final de la convergencia.** Riesgo de que, una vez lanzado el Release 1, se considere "terminada" la convergencia sin haber completado ninguna de las Épicas que realmente entregan valor sincronizado a la Persona.

---

## 8. Definition of Done

**Una Historia de Usuario (Story) está terminada cuando:**
- Todos sus criterios de aceptación se cumplen.
- No rompe ninguna funcionalidad anónima que ya existía antes de la Story (Principio 1, `USER_DOMAIN_MODEL.md`).
- Corresponde exactamente a la Capacidad y a la entidad de dominio que declara servir (verificable contra la Matriz de Trazabilidad, §9).
- No contradice ningún principio de `USER_DOMAIN_MODEL.md` ni de `IDENTITY_INTEGRATION_PLAN.md`.

**Una Feature está terminada cuando:**
- Todas sus Stories están terminadas.
- No queda ninguna implementación duplicada corriendo en paralelo con lo que la Feature reemplaza o unifica (Principio 11, `IDENTITY_INTEGRATION_PLAN.md`).
- Es demostrable de punta a punta desde los clientes que corresponda (Mobile, Web, o ambos, según la Feature).

**Una Épica está terminada cuando:**
- Todas sus Features están terminadas.
- Su Criterio de Éxito, tal como se definió en §1, se cumple explícitamente y de forma verificable — no por declaración.
- Ninguna Decisión Pendiente de la que dependía (Epic 0) quedó sin resolver.
- No generó ninguna fuente de verdad paralela a la que ya existía o a la que la Épica se propuso crear.

---

## 9. Matriz de trazabilidad

| Feature | Capability (`PLATFORM_CAPABILITY_MODEL.md`) | User Domain (`USER_DOMAIN_MODEL.md`) | Identity Plan (`IDENTITY_INTEGRATION_PLAN.md`) | Assessment (`CURRENT_PLATFORM_ASSESSMENT.md`) |
|---|---|---|---|---|
| 0.1–0.6 | (transversal — condición de las Capacidades de Alertas, Historial, Preferencias, Identidad, Premium) | Decisiones Pendientes #1, #2, #4 | Preguntas Pendientes #2, #3, #4; Fase 0 | (sin evidencia de código — son decisiones, no implementación) |
| 1.1–1.4 | Reconocer a la misma Persona entre clientes | Vocabulario base — Identidad (BC-005) | Fase 1A | §2.3 (Identidad hoy solo en Web) |
| 1.5 | Reconocer a la misma Persona entre clientes | Principio 13 (Instalación ≠ Usuario) | Fase 1A, objetivo único | §2.3, §6 (fragmentación de Identidad hoy) |
| 2.1 | Administrar Perfil | Vocabulario base — Perfil (BC-006) | Fase 1B | §2.5 (Perfil hoy solo en Web) |
| 2.2 | Administrar Preferencias del Usuario | Decisión Pendiente #2 | Fase 1B | §6 (preferencia de comuna, local en ambos, sin relación) |
| 3.1 | Comparar una lista de medicamentos / Listas recurrentes | Principio 8 (pertenencias siguen a la Persona) | §4.3 (unificación Carrito/"Mi receta") | §6, §9 (Carrito vs. "Mi receta", duplicados) |
| 3.2 | Favoritos | Principio 8; clasificación §2 (Favoritos = Usuario) | Fase 2 | §6 (Favoritos solo Mobile, local) |
| 3.3 | Comparar una lista de medicamentos / Listas recurrentes | Principio 8 | Fase 2 | §6, §9 |
| 4.1 | Alertas de precio | §4.4 (Alerta = un solo concepto) | §4.4 | §1, §4.4 (dos mecanismos incompatibles) |
| 4.2 | Alertas de precio | Clasificación §2 (Alerta = Usuario) | Fase 3 | §6 |
| 4.3 | Alertas de precio | Principio 1 (anónimo siempre disponible) | §4.4; Pregunta Pendiente #3 | §6 |
| 4.4 | Alertas de precio | Decisión Pendiente #4 | §4.4; Pregunta Pendiente #3 | §4 (`email_alerts`) |
| 5.1 | Suscripción Premium | Clasificación §2 (Premium = Usuario); Principio 10 (Neutralidad) | Fase 4 | §2.7 (motor único, solo Web accede) |
| 5.2 | Suscripción Premium | Principio 10 | Fase 4 | §2.7, §2.8 |
| 6.1 | Historial de búsquedas | Decisión Pendiente #1 | §4, Fase 5 | §6 (Historial solo Mobile, local) |
| 6.2 | Historial de búsquedas | Decisión Pendiente #1; clasificación §2 (Historial = Usuario, con tensión de privacidad) | Fase 5 | §6 |

---

## 10. Backlog priorizado

| # | Feature | Épica | Prioridad | Dependencias | Impacto | Esfuerzo relativo |
|---|---|---|---|---|---|---|
| 1 | 0.6 Fin de la restricción de Prueba Cerrada | Epic 0 | Muy Alta | Ninguna | Muy Alto (desbloquea todo lo demás) | Bajo (es una decisión, no construcción) |
| 2 | 1.1 Login desde el Cliente Mobile | Epic 1 | Muy Alta | 0.6 (en código) | Muy Alto | Alto |
| 3 | 1.2 Registro desde el Cliente Mobile | Epic 1 | Muy Alta | 0.6 (en código) | Muy Alto | Medio |
| 4 | 1.3 Logout desde el Cliente Mobile | Epic 1 | Alta | 1.1 | Alto | Bajo |
| 5 | 1.4 Persistencia de sesión en el Cliente Mobile | Epic 1 | Muy Alta | 1.1 | Muy Alto | Alto |
| 6 | 1.5 Validación de reconocimiento cross-cliente | Epic 1 | Muy Alta | 1.1–1.4 | Muy Alto (cierra la condición de todo lo demás) | Medio |
| 7 | 2.1 Perfil accesible desde el Cliente Mobile | Epic 2 | Alta | Epic 1 | Alto | Medio |
| 8 | 0.1 Reconciliación de Alertas anónimas | Epic 0 | Alta | Ninguna | Alto (desbloquea Epic 4) | Bajo |
| 9 | 0.4 Preservación del mecanismo anónimo de Alertas | Epic 0 | Alta | Ninguna | Alto (desbloquea Epic 4) | Bajo |
| 10 | 0.3 Clasificación de la Preferencia de comuna | Epic 0 | Media | Ninguna | Medio (solo desbloquea 2.2) | Bajo |
| 11 | 0.2 Política de sincronización del Historial | Epic 0 | Media | Ninguna | Medio (decide si Epic 6 existe) | Bajo |
| 12 | 0.5 Condición de catálogo comercial para Premium | Epic 0 | Media | Ninguna | Medio (condiciona el valor real de Epic 5) | Bajo |
| 13 | 3.1 Unificación conceptual de la lista recurrente | Epic 3 | Alta | Epic 1 | Alto | Alto (es más que "sincronizar", ver Riesgo §7) |
| 14 | 3.2 Favoritos sincronizados | Epic 3 | Alta | Epic 1 | Alto | Medio |
| 15 | 3.3 Lista recurrente unificada y sincronizada | Epic 3 | Alta | 3.1 | Alto | Medio |
| 16 | 2.2 Preferencias del Usuario en el Cliente Mobile | Epic 2 | Media | Epic 1, 0.3 | Medio | Bajo |
| 17 | 4.1 Modelo único de dominio "Alerta" | Epic 4 | Media | Epic 1 | Alto | Medio |
| 18 | 4.2 Mecanismo de persistencia identificado | Epic 4 | Media | 4.1 | Alto | Medio |
| 19 | 4.3 Mecanismo de persistencia anónimo | Epic 4 | Media | 4.1, 0.4 | Medio | Bajo |
| 20 | 4.4 Reconciliación o migración de alertas existentes | Epic 4 | Media | 4.1, 0.1 | Alto (evita dejar Personas reales sin aviso) | Medio |
| 21 | 5.1 Entitlement de Premium consultable desde Mobile | Epic 5 | Media | Epic 1 | Alto (potencial) | Medio |
| 22 | 5.2 Experiencia de estado Premium en el Cliente Mobile | Epic 5 | Media | 5.1 | Medio (bajo hoy por falta de catálogo, ver 0.5) | Bajo |
| 23 | 6.1 Mecanismo de Opt-In del historial | Epic 6 | Baja | Epic 1, 0.2 (a favor) | Medio | Bajo |
| 24 | 6.2 Sincronización del historial para quien activó Opt-In | Epic 6 | Baja | 6.1 | Medio | Medio |

---

## Validación final

### Documentos utilizados
- `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md`
- `docs/technology/domain/USER_DOMAIN_MODEL.md`
- `docs/technology/architecture/IDENTITY_INTEGRATION_PLAN.md` (versión revisada, PLATFORM-002A)
- `docs/technology/architecture/PLATFORM_CAPABILITY_MODEL.md`

### Código revisado
Ninguno.

### Documento creado
`docs/program/PLATFORM_CONVERGENCE_MASTER_PLAN.md` (este documento).

### Estado del proyecto

Con este documento finaliza oficialmente la etapa de Arquitectura y comienza la etapa de Implementación. La arquitectura funcional completa de ComparaFarma — qué existe hoy (`CURRENT_PLATFORM_ASSESSMENT.md`), qué es un Usuario (`USER_DOMAIN_MODEL.md`), cómo converge la Identidad (`IDENTITY_INTEGRATION_PLAN.md`), qué es capaz de hacer la Plataforma (`PLATFORM_CAPABILITY_MODEL.md`) — queda traducida en este documento a un backlog ordenado, con Épicas, Features, Historias de Usuario, dependencias, un MVP definido, Releases agrupados lógicamente, riesgos de ejecución propios (distintos de los riesgos de dominio ya identificados), Definition of Done en tres niveles, y una matriz de trazabilidad que conecta cada Feature con su origen exacto en los cuatro documentos de arquitectura. No se tomó ninguna decisión de diseño nueva, no se modificó ningún documento existente y no se volvió a inspeccionar el código o el repositorio — todo el contenido de este plan se deriva exclusivamente de lo ya aprobado.

Este documento queda a la espera de aprobación explícita antes de que el equipo de desarrollo comience a ejecutar cualquier ítem del backlog.
