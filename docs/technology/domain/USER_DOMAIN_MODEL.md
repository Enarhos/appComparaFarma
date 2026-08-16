# Modelo de Dominio del Usuario — ComparaFarma

**Sprint:** DOMAIN-001
**Tipo:** Documento de dominio (contrato conceptual, no técnico)
**Fecha de corte:** 2026-08-06
**Alcance:** qué es un Usuario en el dominio de ComparaFarma, qué le pertenece a él, al dispositivo o a la plataforma, y los principios/invariantes que gobiernan esa relación. Es el contrato conceptual para toda futura integración entre Mobile, Web y Backend.
**No es:** una especificación de pantallas, de APIs, de tablas, de autenticación técnica ni de arquitectura. No propone migraciones ni cambios de código.
**Método:** `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md` (aprobado, PLATFORM-001) como fuente principal de qué existe hoy — no se repite su contenido, solo se cita lo necesario para justificar cada decisión conceptual. Se contrasta contra la documentación de negocio/marca/arquitectura empresarial ya existente, para no contradecirla. Donde el negocio no ha decidido algo, se señala como pregunta abierta en la Validación Final, no se decide aquí.

---

## Vocabulario base

Antes de responder las preguntas del documento, se fijan cinco términos que se usan de forma consistente en todo el texto — su confusión es la causa más común de errores de dominio:

- **Persona.** El ser humano real detrás de cualquier interacción con ComparaFarma. Siempre existe, con o sin identidad reconocida por la plataforma. Es el sujeto moral del dominio — citado en `docs/archive/foundational-book/03-acto-nuestra-forma-de-trabajar/04-Los-Datos-Existen-Para-Servir-No-Para-Vigilar.md`: *"Nunca veremos los datos como simples registros. Detrás de ellos siempre existe una persona."*
- **Instalación.** Un dispositivo o navegador concreto a través del cual una Persona interactúa con ComparaFarma (una copia de la app, una sesión de navegador). Es anónima por definición: la plataforma no sabe qué Persona hay detrás, ni si es siempre la misma.
- **Identidad.** El mecanismo que permite a la plataforma reconocer, entre una interacción y otra, que se trata de la misma Persona. Es un mecanismo operativo, no un activo de negocio — así lo define `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` (BC-005): *"La identidad constituye un mecanismo operativo. No forma parte del Patrimonio Digital."*
- **Perfil.** La experiencia personalizada de una Persona dentro de la plataforma una vez que tiene Identidad — sus datos de contacto, su plan, sus preferencias. `BUSINESS_CAPABILITY_MAP.md` (BC-006) es explícito: *"El Perfil representa la experiencia personalizada del usuario. No representa su identidad civil."*
- **Usuario.** La Persona en el momento en que sostiene, de forma reconocible para la plataforma, una relación que persiste más allá de una única Instalación o una única sesión. Se define en detalle en la sección 1.

Estos cinco términos no son sinónimos y el resto del documento depende de no confundirlos: una Persona puede usar ComparaFarma toda su vida sin ser nunca un Usuario; una Instalación no es una Persona ni un Usuario, es solo un canal; una Identidad no es un Perfil (la Identidad reconoce, el Perfil personaliza); y un Usuario es siempre una Persona, pero no toda Persona es un Usuario.

---

## 1. ¿Qué es un Usuario?

Un **Usuario** es una Persona que ha establecido, voluntariamente, una relación reconocible y continua con ComparaFarma — una relación que la plataforma puede recordar de una visita a otra, y de un cliente (Mobile o Web) a otro, sin que la Persona tenga que volver a explicarse.

Tres elementos son necesarios para esa definición:

1. **Voluntariedad.** Nadie es Usuario por defecto ni por el solo hecho de usar la app o el sitio. Se convierte en Usuario porque decide que quiere que la plataforma lo reconozca — nunca porque la plataforma se lo exige para dejarlo comparar precios (ver sección 8).
2. **Continuidad reconocible.** Lo que distingue a un Usuario de una Instalación anónima no es "haber puesto un email en un formulario" — eso es Identidad, el mecanismo (BC-005). Ser Usuario es el resultado de negocio de ese mecanismo: que la plataforma pueda decir "esta es la misma Persona que ayer" sin depender del dispositivo.
3. **Independencia del dispositivo.** Un Usuario existe conceptualmente por encima de cualquier Instalación concreta — puede tener varias (su teléfono, su computador) y sigue siendo el mismo Usuario en todas.

Antes de ese momento, la Persona ya es un participante legítimo y completo del dominio de ComparaFarma — solo que actúa como una Instalación anónima, no como Usuario. Esto no es un estado incompleto o degradado: es, hoy, el estado por defecto y explícitamente documentado del producto (`docs/product/strategy/COMPANY_STRATEGY.md`, 2026-07-19: *"Usuarios: Anónimos, sin cuenta... Sin identidad de usuario"*), y sigue siendo enteramente válido para el núcleo de la propuesta de valor (ver sección 8).

**Lo que un Usuario NO es:** no es una fila en una tabla, no es una sesión de Supabase Auth, no es un email verificado. Esas son formas técnicas concretas de *implementar* la Identidad hoy (ver `CURRENT_PLATFORM_ASSESSMENT.md` §2.3-2.5) — el concepto de Usuario es anterior e independiente de cualquier mecanismo técnico particular.

---

## 2. ¿Qué pertenece al Usuario?

Pertenece al Usuario todo aquello que representa una decisión, un compromiso o una relación de la Persona con ComparaFarma que tiene sentido en función de ella — no del dispositivo que usó para expresarla, ni de un dato que la plataforma simplemente observa y agrega.

- **Perfil** (correo, cómo se le reconoce). Es la definición misma de Usuario aplicada a un dato concreto — no admite otra clasificación.
- **Plan / Premium.** Es una relación comercial con una Persona ("le vendí acceso a esto"), no con un aparato. Si Premium no siguiera al Usuario entre dispositivos, la promesa comercial básica se rompería.
- **Favoritos.** Un favorito representa el interés de una Persona en un medicamento — una decisión suya, con sentido propio independiente de qué teléfono tenía en la mano cuando la tomó.
- **Alertas de precio.** Representan un compromiso de la Persona hacia el futuro ("avísame si baja de precio") — el mismo razonamiento que favoritos, con un componente temporal adicional.
- **Comparaciones recurrentes (carrito / "mi receta").** Representan una necesidad real y recurrente de una Persona (el caso de Claudia en `docs/product/definition/PERSONAS.md`, que compra los mismos medicamentos de forma permanente) — no un estado de una pantalla.
- **Historial de búsquedas.** Pertenece conceptualmente al Usuario en la medida en que documenta su propio recorrido de búsqueda de salud — pero es, de los elementos de esta lista, el que tiene la tensión de privacidad más fuerte (ver sección 7 y Decisiones Pendientes): que algo "pertenezca" al Usuario no implica automáticamente que deba sincronizarse o conservarse indefinidamente.
- **Preferencias declaradas explícitamente por la Persona** (por ejemplo, "mi comuna habitual"), cuando existen como una declaración deliberada y no como un dato de contexto de una búsqueda puntual — ver la distinción con "Dispositivo" en la sección 3, y la pregunta pendiente en la sección 9.

Lo que determina la pertenencia a este grupo no es "dónde vive el dato hoy en el código" sino si el dato deja de tener sentido cuando se separa de la Persona que lo generó. Un favorito sin la persona que lo marcó no significa nada; el caché de una búsqueda sí sigue siendo útil sin saber quién la hizo.

---

## 3. ¿Qué pertenece al Dispositivo?

Pertenece al Dispositivo (a la Instalación) todo lo que existe únicamente para hacer más fluida la experiencia de esa Instalación en particular, y que no pierde ni gana sentido según qué Persona esté detrás.

- **Caché de resultados de búsqueda** (hoy: `search_cache_v10_*`, TTL 30 min). Es una optimización de red y de velocidad — no representa ninguna decisión de la Persona, solo evita repetir una consulta reciente. Justificación: si se pierde al reinstalar la app, no se pierde nada de valor para la Persona, solo un poco de velocidad la próxima vez.
- **Tooltips y onboarding ya vistos** (`results_tooltip_v1_seen`, `onboarding_v2_done`). Son estado de "esta Instalación ya le mostró esto a quien la esté usando" — no tiene sentido preguntarse si le "pertenecen" a la Persona; son un recurso interno de la interfaz.
- **Filtros de sesión no persistidos** (`filterStore`: farmacias activas, orden, solo-online). Se resetean incluso dentro de la misma Instalación entre reinicios — es estado de UI transitorio, no una preferencia declarada.
- **Snapshot local de histórico de precios por medicamento** (`price_history_v1_*` en mobile). Este caso merece justificación explícita porque a primera vista podría parecer del Usuario o de la Plataforma: es una copia local, de solo lectura, de un dato cuyo origen real y autoritativo es la Plataforma (ver sección 4). No es un dato que la Persona "posea" — es una cache de visualización, igual que el caché de búsqueda. Si se pierde, el dato real sigue existiendo en la Plataforma.
- **Estado de UI en general** (qué pantalla está abierta, posición de scroll, etc. — no llegó a materializarse como una entidad nombrada en el código revisado, pero es el ejemplo más puro de esta categoría). Sin persistencia conceptual alguna más allá del momento presente.

El criterio de exclusión es el inverso al de la sección 2: si el dato sigue teniendo el mismo valor para cualquier Persona que use esa Instalación, y no representa una decisión o compromiso de alguien en particular, es del Dispositivo.

---

## 4. ¿Qué pertenece a la Plataforma?

Pertenece a la Plataforma todo lo que constituye conocimiento o infraestructura compartida — útil para cualquier Persona que use ComparaFarma, y que no es propiedad ni responsabilidad de ninguna Persona en particular.

- **Medicamentos** (registro canónico, CFM-ID). Es conocimiento de dominio compartido — un medicamento existe independientemente de que alguien lo haya buscado.
- **Farmacias** (catálogo, integraciones, disponibilidad). Igual razonamiento: es infraestructura de negocio, no un dato de ninguna Persona.
- **Histórico de precios de un medicamento** (la serie de datos en sí, no el interés de alguien por vigilarla). Es un activo que la Plataforma construye observando el mercado — no pertenece a quien hizo la búsqueda que generó ese registro, igual que un diario de precios de un supermercado no le pertenece al primer cliente que compró ese día.
- **Configuración global** (farmacias activas/inactivas, parámetros del banner de donación). Es la misma para todas las Personas al mismo tiempo — administrada centralmente, no personalizable individualmente hoy.
- **Analytics agregados y estadísticas.** Una vez agregados (cuántas búsquedas, qué tan seguido se encuentra tal farmacia más barata), dejan de poder atribuirse a una Persona específica — son conocimiento sobre el comportamiento colectivo, no sobre alguien en particular. Esto es una distinción deliberada, no accidental: `docs/book/.../04-...md` es explícito en que *"jamás confundiremos medición con vigilancia"* — la agregación es, precisamente, el mecanismo que hace posible medir sin vigilar.
- **El contenido operativo del feedback** (una vez enviado, el mensaje se vuelve un insumo para mejorar el producto — no es algo que la Persona pueda "recuperar" como si fuera suyo, aunque el dato de contacto que haya incluido sí sigue sujeto a las reglas de privacidad de la sección 9, sin que eso lo convierta en una "pertenencia" en el sentido de favoritos o alertas).

---

## 5. Clasificación del dominio

| Entidad | Usuario | Dispositivo | Plataforma | Justificación breve |
|---|:-:|:-:|:-:|---|
| Perfil (contacto, cómo se reconoce a la Persona) | ✅ | | | Es la definición de Usuario aplicada a un dato. |
| Plan / Premium | ✅ | | | Relación comercial con una Persona, no con un aparato. |
| Favoritos | ✅ | | | Decisión de la Persona sobre medicamentos relevantes para ella. |
| Alertas de precio | ✅ | | | Compromiso de la Persona hacia el futuro. |
| Comparaciones recurrentes (carrito / mi receta) | ✅ | | | Necesidad real y recurrente de una Persona. |
| Historial de búsquedas | ✅ | | | Documenta el recorrido de la Persona — con tensión de privacidad a resolver (§9). |
| Preferencias declaradas (ej. comuna habitual) | ✅* | | | Pertenece al Usuario si se concibe como un hábito de la Persona, no como contexto puntual — marcado como pregunta abierta (§9). |
| Caché de resultados de búsqueda | | ✅ | | Optimización de red, sin significado propio. |
| Tooltips / onboarding vistos | | ✅ | | Estado interno de la interfaz de esa Instalación. |
| Filtros de sesión no persistidos | | ✅ | | Se resetea incluso dentro de la misma Instalación. |
| Snapshot local de histórico de precios (mobile) | | ✅ | | Copia de solo lectura de un dato cuyo origen real es la Plataforma. |
| Estado de UI transitorio | | ✅ | | Sin persistencia conceptual más allá del momento presente. |
| Medicamentos (registro canónico) | | | ✅ | Conocimiento de dominio compartido. |
| Farmacias | | | ✅ | Infraestructura de negocio compartida. |
| Histórico de precios (la serie de datos) | | | ✅ | Activo construido por la Plataforma observando el mercado. |
| Configuración global | | | ✅ | Igual para todas las Personas a la vez. |
| Analytics agregados / estadísticas | | | ✅ | Una vez agregados, no se atribuyen a una Persona específica. |
| Contenido del feedback (una vez enviado) | | | ✅ | Se vuelve insumo operativo de mejora del producto. |

`*` Marcado como pendiente de confirmación por el negocio — ver Decisiones Pendientes.

---

## 6. Persistencia conceptual

| Entidad | Persistencia conceptual objetivo | Nota |
|---|---|---|
| Perfil | Permanente, Sincronizable | Mientras la relación de Usuario exista. |
| Plan / Premium | Permanente mientras esté activo, Sincronizable | Debe verse igual desde cualquier cliente. |
| Favoritos | Permanente, Sincronizable (objetivo) | Hoy: Local únicamente en mobile; no existe en web (`CURRENT_PLATFORM_ASSESSMENT.md` §6). |
| Alertas de precio | Permanente hasta que se cumpla o se cancele, Sincronizable (objetivo) | Hoy: Local únicamente en mobile; en web existe pero ligada a email+token, no a Perfil — dos modelos no compatibles entre sí. |
| Comparaciones recurrentes | Permanente mientras la Persona la mantenga, Sincronizable (objetivo) | Hoy: Local únicamente en ambos clientes, con implementaciones independientes (`cartStore` vs. `localStorage` de "mi receta"). |
| Historial de búsquedas | Temporal (ventana acotada) — ¿Sincronizable? Pendiente | Ver Decisiones Pendientes; la naturaleza sensible del dato pesa contra sincronizar por defecto. |
| Preferencias declaradas | Permanente, ¿Sincronizable? Pendiente | Ver Decisiones Pendientes. |
| Caché de búsqueda | Temporal, Local únicamente | Vida útil de minutos, sin valor pasado ese punto. |
| Tooltips / onboarding vistos | Permanente-de-la-Instalación, Local únicamente | Se pierde al reinstalar, sin consecuencia. |
| Filtros de sesión | Temporal, Local únicamente | No sobrevive ni al reinicio de la app. |
| Snapshot local de histórico de precios | Temporal (acotado a 60 registros), Local únicamente | Copia de un dato cuyo original persiste en la Plataforma. |
| Medicamentos / Farmacias | Permanente, Compartida | Conocimiento de dominio. |
| Histórico de precios (Plataforma) | Permanente, Compartida | Serie de datos que crece indefinidamente. |
| Configuración global | Permanente hasta que se edite, Compartida | Administrada centralmente. |
| Analytics agregados | Permanente, Compartida, siempre anónima | Nunca debe poder desagregarse hasta identificar a una Persona. |

---

## 7. Sincronización conceptual

- **Favoritos: sí debería sincronizarse.** El interés de una Persona en un medicamento no depende de qué dispositivo tenía consigo cuando lo marcó. No sincronizarlo hoy es una limitación técnica actual (mobile es 100% local, web no lo tiene), no una decisión de diseño del dominio.
- **Alertas: sí debería sincronizarse — y además debería ser un solo concepto, no dos.** El compromiso de "avisarme si baja de precio" es de la Persona. Hoy mobile y web ni siquiera comparten modelo (in-app local vs. email+token sin cuenta) — eso no es solo una brecha de sincronización, es una fragmentación del dominio mismo: son, conceptualmente, la misma relación (Persona-medicamento-precio objetivo) implementada dos veces de formas incompatibles.
- **Comparaciones recurrentes (carrito / mi receta): sí debería sincronizarse**, por el mismo razonamiento que favoritos — es una necesidad recurrente de una Persona (ver Claudia en `PERSONAS.md`), no un estado de una pantalla de un dispositivo.
- **Historial de búsquedas: depende — requiere decisión de negocio, no es autoevidente.** Sincronizar el historial entre dispositivos aumenta la continuidad de valor para la Persona (retomar donde quedó), pero también centraliza un tipo de dato particularmente sensible: búsquedas de medicamentos pueden revelar condiciones de salud. El Principio Inmutable IX (*"la privacidad antes que la explotación de los datos"*) y "pediremos solamente lo necesario" (`El Libro`, cap. 04) pesan en contra de sincronizar por defecto sin que la Persona lo decida explícitamente. No se resuelve en este documento — ver Decisiones Pendientes.
- **Configuración / preferencias (ej. comuna habitual): depende de qué represente conceptualmente.** Si es "dónde vive o compra habitualmente esta Persona", debería sincronizar como cualquier preferencia del Usuario. Si es "desde dónde está buscando ahora", es contextual y no debería seguir a la Persona a otro dispositivo. El dominio, tal como existe hoy, no distingue entre ambos casos — ver Decisiones Pendientes.
- **Premium: sí, sin excepción y sin ambigüedad.** Es la única entidad de esta lista donde "no sincronizar" no es una opción de diseño válida — si una Persona paga y el acceso no la sigue a todos sus clientes, la relación comercial básica de Premium queda incumplida. Esto ya está resuelto conceptualmente hoy: el motor de entitlement (`getEntitlement`, `CURRENT_PLATFORM_ASSESSMENT.md` §2.7) está diseñado para ser consultado por cualquier cliente autenticado — lo que falta no es diseño de dominio, es que mobile no tiene Identidad todavía (ver sección 8).

---

## 8. Modelo de identidad

**¿Cuándo una persona deja de ser una instalación y pasa a ser un Usuario?**

En el momento en que decide, ella misma, que quiere que ComparaFarma la reconozca más allá de una Instalación — no en el momento en que la plataforma se lo exige. Hoy esa decisión se materializa técnicamente al crear una cuenta con email y contraseña en `web/` (`CURRENT_PLATFORM_ASSESSMENT.md` §2.3), pero el concepto de "convertirse en Usuario" es anterior a esa implementación particular: es un acto de la Persona, no un requisito de la plataforma. Nada en el dominio exige que ese mecanismo sea siempre el mismo en el futuro.

**¿Qué funcionalidades deben existir antes del login?**

Todo lo que constituye la propuesta de valor central de ComparaFarma: buscar, comparar y ver el detalle de precios de un medicamento en las farmacias. Esto no es una concesión temporal — es una consecuencia directa de principios ya declarados y vigentes:

- Principio Inmutable I: *"las personas antes que las métricas"* — nadie debería tener que identificarse para resolver la necesidad básica de saber cuánto cuesta un medicamento.
- Principio Inmutable IX: *"la privacidad antes que la explotación de los datos"* — exigir identidad para la función central sería pedir más de lo necesario.
- El propio estado histórico del producto, documentado sin ambigüedad en `docs/product/strategy/COMPANY_STRATEGY.md`: *"Usuarios: Anónimos, sin cuenta"* — no como un defecto a corregir, sino como el punto de partida legítimo del dominio.

Esto también incluye, coherentemente, todo lo que hoy ya funciona sin identidad y que la sección 2 reconoce como perteneciente al Usuario en el plano conceptual (favoritos, alertas, comparaciones) — el hecho de que hoy se puedan usar sin login (de forma local, por Instalación) es compatible con este principio; lo que está pendiente de decidir es si, además, deberían sincronizar cuando la Persona sí decide identificarse (sección 7 y Decisiones Pendientes).

**¿Cuáles deben requerir identidad?**

Únicamente aquello que, por su propia naturaleza, no puede existir sin una continuidad reconocible:

- **Premium / pago.** Es intrínsecamente una relación comercial con una Persona — no puede existir de forma anónima por definición.
- **Cualquier funcionalidad que la Persona decida que debe seguirla entre dispositivos.** Favoritos, alertas y comparaciones sincronizadas requieren identidad no porque el concepto en sí lo exija (pueden y hoy funcionan sin ella, de forma local), sino porque *sincronizar* necesariamente implica que la plataforma reconozca que es la misma Persona en ambos lugares.
- **El panel administrativo y cualquier función de gestión del negocio** (fuera del alcance de este documento, que trata sobre la Persona-Usuario, no sobre roles operativos internos).

Nada del núcleo de comparación de precios debe requerir identidad, hoy ni en el futuro, salvo que el negocio decida explícitamente lo contrario — y de ser así, contradiría principios ya vigentes, por lo que tal decisión debería tratarse como una revisión de esos principios, no como una decisión de producto ordinaria.

---

## 9. Principios del dominio

1. **La búsqueda y comparación de precios deben funcionar sin identidad, siempre.** — Principio Inmutable I y IX; es el punto de partida documentado del producto (`COMPANY_STRATEGY.md`), no una carencia.
2. **Convertirse en Usuario es una decisión de la Persona, nunca una condición impuesta por la plataforma.** — Consistente con *"una buena experiencia ayuda a decidir, nunca empuja a decidir"* (`BRAND_FOUNDATIONS.md` §15) y con el Principio Inmutable I.
3. **La Identidad es un mecanismo de acceso, no un activo de la plataforma.** — Cita directa de BC-005: *"la identidad constituye un mecanismo operativo. No forma parte del Patrimonio Digital."*
4. **El Perfil no es la Persona civil; es su experiencia dentro de la plataforma.** — Cita directa de BC-006.
5. **Los datos que produce una Persona le pertenecen a ella; la plataforma es custodia, no propietaria.** — Cita textual de `El Libro`, cap. 04: *"Somos custodios. No propietarios."*
6. **Se pide solo lo necesario para prestar el servicio, nunca porque la tecnología lo permite.** — Cita textual de la misma fuente: *"Pediremos solamente lo necesario... si la respuesta es no, no deberíamos pedirla."*
7. **Medir el comportamiento agregado para mejorar el producto no es lo mismo que vigilar a una Persona.** — Cita textual de la misma fuente.
8. **Un favorito, una alerta o una comparación pertenecen a la Persona, no al dispositivo que los registró.** — Son decisiones y compromisos con sentido en función de la Persona y su necesidad recurrente (`PERSONAS.md`), no del hardware usado — aunque hoy la implementación no siempre lo refleje (`CURRENT_PLATFORM_ASSESSMENT.md` §6, §9).
9. **El histórico de precios de un medicamento es un activo de la plataforma; el interés de una Persona en vigilar ese precio es un activo de ella.** — Distingue la serie de datos compartida (útil para cualquiera) de la relación personal de "avísame" (útil solo para quien la creó); evita confundir ambos conceptos, hoy nombrados de forma similar en el código.
10. **Ninguna funcionalidad Premium puede alterar los precios mostrados ni el orden de las farmacias.** — Principio de Neutralidad (`PRODUCT_PRINCIPLES.md` #3): Premium es una relación comercial con la Persona, nunca con las farmacias listadas.
11. **La relación de Usuario debe poder terminar sin penalización ni fricción.** — Principio de Reversibilidad (`USER_JOURNEYS.md` §4.2), aplicado al dominio de identidad: la Persona puede dejar de ser Usuario en cualquier momento.
12. **La confianza de la Persona vale más que cualquier dato que entregue.** — Cita de cierre de `El Libro`, cap. 04: *"los datos tienen valor. Pero la confianza siempre tendrá más."*
13. **Una Instalación y un Usuario nunca son lo mismo.** — Una Persona puede tener varias Instalaciones (varios dispositivos) y seguir siendo un solo Usuario; una misma Instalación puede, sin que la plataforma lo sepa, ser usada por Personas distintas en momentos distintos. Confundir ambos conceptos es la causa raíz de que hoy "si un usuario cambia de celular, pierde todo" (`COMPANY_STRATEGY.md` §1).
14. **La plataforma no unifica automáticamente distintas señales de una misma Persona sin su consentimiento explícito.** — Hoy coexisten tres relaciones no unificadas entre sí (Instalación anónima, email+token de alertas, cuenta ligera con Perfil); el dominio no debe asumir que son la misma Persona sin una acción explícita de ella — coherente con "gestión de consentimiento" ya nombrada como parte de BC-005.

---

## 10. Invariantes

1. Una Identidad sin Perfil no es un Usuario completo; un Perfil siempre presupone una Identidad que lo sostenga.
2. Una Persona puede existir en el dominio de ComparaFarma sin ser nunca un Usuario — el uso 100% anónimo e indefinido es un estado válido, no transitorio ni degradado.
3. El Perfil nunca equivale a la identidad civil de la Persona.
4. Ninguna funcionalidad de Premium altera el precio mostrado de un medicamento ni el orden por precio real entre farmacias.
5. Un favorito representa el interés de una Persona en un medicamento, no un precio congelado en el tiempo — el precio mostrado se actualiza; lo que persiste es el interés, no la cifra. (Nota: esto difiere de la implementación actual de mobile, que sí cachea el precio del momento de guardar — se señala como una divergencia a resolver por producto, no como una descripción de cómo funciona hoy.)
6. Una alerta de precio siempre pertenece a alguien identificable de alguna forma — hoy, a una Instalación o a un email — nunca a un dispositivo sin ningún vínculo a quien la creó.
7. El histórico de precios de un medicamento es siempre un dato de la Plataforma, nunca un dato privado de una Persona.
8. La plataforma nunca solicita más datos personales de los estrictamente necesarios para el servicio que la Persona está usando en ese momento.
9. Ninguna Persona pierde acceso a la comparación de precios por no tener, o no querer tener, una Identidad.
10. Un mismo Usuario puede tener múltiples Instalaciones reconocidas; una misma Instalación nunca pertenece, de forma reconocida por la plataforma, a más de un Usuario a la vez.

---

## Validación final

### Documentos utilizados
- `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md` (fuente principal)
- `docs/design/brand/BRAND_FOUNDATIONS.md` (§11.1 Principios Inmutables, §15)
- `docs/design/brand/BRAND_AUDIT.md`
- `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` (BC-005, BC-006)
- `docs/archive/foundational-book/03-acto-nuestra-forma-de-trabajar/04-Los-Datos-Existen-Para-Servir-No-Para-Vigilar.md`
- `docs/product/strategy/COMPANY_STRATEGY.md`
- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/definition/PERSONAS.md`
- `docs/product/USER_JOURNEYS.md`
- `docs/technology/architecture/DOMAIN_MODEL.md` (confirmado: modelo de datos de medicamentos, sin entidad Usuario — no se superpone con este documento)
- `docs/technology/database/schema.sql` (solo para confirmar qué relaciones con "usuario" existen hoy — `profiles`, `subscriptions`, `flow_customers`, `email_alerts` — sin diseñar sobre ellas)
- RFC-003 (Subscription Engine), ADR-0002, ADR-0004 (confirmado: asumen `profiles` sin redefinir qué es un usuario)

### Código revisado
Ninguno directamente — este documento se apoya en las citas de código ya verificadas y referenciadas en `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md`, evitando repetir la auditoría de código ya realizada en ese sprint.

### Documento creado
`docs/technology/domain/USER_DOMAIN_MODEL.md` (este documento).

### Decisiones pendientes (para el comité — no resueltas en este documento)

1. **Historial de búsquedas:** ¿debe sincronizarse entre Instalaciones de un mismo Usuario, considerando que puede revelar condiciones de salud? ¿O debe permanecer deliberadamente local por privacidad, incluso para una Persona identificada?
2. **Preferencia de comuna:** ¿es un atributo del Usuario ("dónde vive o compra habitualmente esta Persona") o del contexto de cada búsqueda ("desde dónde está buscando ahora")? La respuesta determina si debe sincronizarse o no.
3. **Unificación de favoritos, alertas y comparaciones:** ¿deben convertirse en un solo concepto de dominio compartido entre Mobile y Web, o la empresa acepta mantener implementaciones paralelas por plataforma de forma indefinida?
4. **Alertas de email (`email_alerts`) vs. Perfil:** si una Persona crea una alerta por email sin cuenta y luego se registra con ese mismo correo, ¿deben reconciliarse como la misma Persona, o son relaciones deliberadamente independientes?
5. **Retención tras dejar de ser Usuario:** si una Persona cierra su cuenta, ¿sus favoritos/alertas/historial (donde existan sincronizados) se eliminan, se anonimizan o se conservan agregados como parte de los activos de la Plataforma?
6. **Mobile y la Identidad:** ¿mobile eventualmente ofrecerá login (convirtiendo Instalaciones en Usuarios reconocibles también ahí), o es una decisión de producto deliberada mantenerlo 100% anónimo de forma indefinida?
7. **Ventana de retención del historial de búsquedas:** si en algún momento se decide sincronizar, ¿durante cuánto tiempo debe conservarse antes de expirar?

Este documento queda a la espera de aprobación explícita antes de continuar con cualquier trabajo posterior (incluyendo, entre otros, decisiones técnicas de sincronización, diseño de API o modelo de datos).
