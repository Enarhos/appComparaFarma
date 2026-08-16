# Platform Capability Model — ComparaFarma

**Sprint:** PLATFORM-003
**Tipo:** Modelo de capacidades (funcional, de negocio — no técnico)
**Fecha de corte:** 2026-08-06
**Alcance:** qué es capaz de hacer la Plataforma ComparaFarma — no dónde, no cómo, no con qué tecnología. Es la última capa de arquitectura funcional antes de volver al desarrollo.
**No es:** una especificación de pantallas, APIs, tablas, tecnologías ni implementación.
**Fuente de verdad:** `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md`, `docs/technology/domain/USER_DOMAIN_MODEL.md` y `docs/technology/architecture/IDENTITY_INTEGRATION_PLAN.md` (los tres, aprobados, no se repiten ni se contradicen). Documentación adicional consultada solo donde fue estrictamente necesaria: `docs/product/ROADMAP.md`, `docs/program/ROADMAP.md`, `docs/product/definition/PERSONAS.md`, `docs/product/PRODUCT_PRINCIPLES.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`. No se volvió a inspeccionar código ni el repositorio. (Nota de gobierno documental, 2026-08-15: este documento citaba también `docs/product/PRODUCT_BLUEPRINT.md` como consultado; se confirmó que ese archivo nunca tuvo commits en este repositorio, por lo que no pudo haber sido consultado — se retira de esta lista en vez de sostener una afirmación no verificable.)

---

## 1. Capability Map

```
Plataforma ComparaFarma
│
├── 1. Descubrir
│   ├── 1.1 Buscar medicamentos por texto libre
│   ├── 1.2 Normalizar y unificar resultados equivalentes
│   ├── 1.3 Filtrar y refinar resultados
│   └── 1.4 Ubicar sucursales por comuna
│
├── 2. Comparar
│   ├── 2.1 Comparar precios entre farmacias (un medicamento)
│   ├── 2.2 Distinguir canales de precio
│   ├── 2.3 Calcular ahorro
│   ├── 2.4 Comparar una lista de medicamentos (canasta / receta completa)
│   ├── 2.5 Ver evolución histórica de precio
│   └── 2.6 Compartir un hallazgo de precio
│
├── 3. Recordar
│   ├── 3.1 Favoritos
│   ├── 3.2 Listas recurrentes de medicamentos
│   ├── 3.3 Historial de búsquedas
│   └── 3.4 Alertas de precio
│       └── 3.4.1 Avisar a la Persona cuando se cumple una alerta
│
├── 4. Identidad
│   ├── 4.1 Reconocer a la misma Persona entre clientes
│   ├── 4.2 Administrar Perfil
│   ├── 4.3 Administrar Preferencias del Usuario
│   └── 4.4 Gestionar consentimiento
│
├── 5. Monetizar
│   ├── 5.1 Donaciones voluntarias
│   ├── 5.2 Suscripción Premium
│   ├── 5.3 Convenios / afiliación con farmacias
│   ├── 5.4 API Comercial (datos agregados B2B)
│   └── 5.5 Publicidad ética
│
├── 6. Inteligencia
│   ├── 6.1 Identificar bioequivalentes
│   ├── 6.2 Sugerir sustitutos
│   ├── 6.3 Disponibilidad avanzada
│   ├── 6.4 Recomendaciones basadas en IA
│   └── 6.5 Seguimiento de tratamientos
│
└── 7. Operar
    ├── 7.1 Integrar y mantener fuentes de farmacias
    ├── 7.2 Administrar configuración global
    ├── 7.3 Publicar y distribuir la Plataforma
    ├── 7.4 Observar salud del servicio
    ├── 7.5 Registrar y diagnosticar errores
    ├── 7.6 Medir uso agregado
    ├── 7.7 Prevenir abuso
    ├── 7.8 Recibir y gestionar feedback de Personas
    └── 7.9 Administrar la operación del negocio (panel interno)
```

No se fuerza una profundidad uniforme: algunas ramas (Alertas) tienen una sub-capacidad de tercer nivel porque el análisis la justifica (§4.4); otras no la necesitan.

---

## 2. Catálogo de Capacidades

### 2.1 Descubrir

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Buscar medicamentos por texto libre | Encontrar qué medicamentos existen para un término dado | La Plataforma es capaz de interpretar un término escrito por una Persona y devolver los medicamentos que corresponden, consultando todas las fuentes de farmacia disponibles | Resuelve la necesidad más básica: "quiero saber qué hay" (Daniela: *"quiero buscar"*, `PERSONAS.md`) | Es la puerta de entrada a todo lo demás — sin esto no existe ningún otro valor posible |
| Normalizar y unificar resultados equivalentes | Evitar que el mismo medicamento aparezca fragmentado o mezclado con otro de distinto formato | La Plataforma es capaz de reconocer que dos resultados de farmacias distintas son "el mismo" medicamento (o distinguir cuando no lo son, por dosis/cantidad distinta) | Evita confusión y comparaciones erróneas entre productos que no son comparables | Es la base de confianza de toda comparación — un error acá invalida el resto del producto |
| Filtrar y refinar resultados | Permitir que la Persona reduzca los resultados a lo que realmente le interesa | La Plataforma es capaz de aplicar criterios (bioequivalente, farmacia, solo con despacho online, comuna) sobre los resultados de una búsqueda | Ahorra tiempo y reduce sobrecarga de información (Daniela: *"si demoro más de un minuto cierro la aplicación"*) | Aumenta la probabilidad de que la Persona encuentre lo que busca sin abandonar |
| Ubicar sucursales por comuna | Ayudar a saber dónde comprar físicamente | La Plataforma es capaz de asociar farmacias con sucursales reales por comuna | Resuelve "no quiero recorrer varias farmacias" (Carmen, `PERSONAS.md`) | Complementa la comparación de precio con la dimensión de conveniencia geográfica |

### 2.2 Comparar

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Comparar precios entre farmacias (un medicamento) | Saber dónde conviene comprar un medicamento específico | La Plataforma es capaz de ordenar y contrastar el precio de un mismo medicamento entre todas las farmacias que lo tienen | Es la razón de existir declarada por la Persona más citada: *"solo quiero saber dónde comprar más barato"* (Carmen) | Es, junto con Descubrir, el núcleo de la propuesta de valor |
| Distinguir canales de precio | Evitar que la Persona compare precios que no aplican a su forma de comprar | La Plataforma es capaz de separar precio presencial, online, con tarjeta de fidelización y SBPay para cada farmacia | Evita decisiones basadas en un precio que en la práctica no podría obtener | Da precisión y credibilidad — sin esto, la comparación sería engañosa |
| Calcular ahorro | Cuantificar cuánto se gana comparando | La Plataforma es capaz de calcular la diferencia entre la mejor y la peor opción disponible | Convierte una lista de precios en una razón concreta para actuar | Es la métrica que sostiene el valor percibido del producto entero |
| Comparar una lista de medicamentos (canasta / receta completa) | Optimizar el gasto total de varios medicamentos a la vez, no uno por uno | La Plataforma es capaz de recibir un conjunto de medicamentos y determinar dónde conviene comprarlos, individual o conjuntamente | Resuelve la necesidad de Rodrigo: *"no me interesa cuál medicamento es más barato... quiero saber dónde gastar menos por toda la compra"* | Nombrada como capacidad de mayor potencial de diferenciación (★★★★★, `docs/product/ROADMAP.md`) |
| Ver evolución histórica de precio | Entender si un precio de hoy es bueno o malo en el tiempo | La Plataforma es capaz de mostrar cómo varió el precio de un medicamento a lo largo del tiempo | Da contexto y confianza a la decisión de comprar ahora o esperar | Es, según `docs/product/strategy/COMPANY_STRATEGY.md`, el activo que se vuelve difícil de copiar frente a la competencia |
| Compartir un hallazgo de precio | Permitir que la Persona informe a otra sobre un precio conveniente | La Plataforma es capaz de generar un mensaje resumido de un hallazgo de precio para enviarlo fuera de la Plataforma | Ayuda a la Persona a ayudar a alguien más (ej. Claudia comprando para su madre) | Puede actuar como canal orgánico de descubrimiento del producto, aunque no hay evidencia documental de que esté priorizado como tal |

### 2.3 Recordar

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Favoritos | Que la Persona no tenga que volver a buscar lo que ya le importa | La Plataforma es capaz de recordar qué medicamentos le interesan a una Persona | Resuelve directamente la necesidad de Claudia: *"guardar favoritos"* | Sostiene el Objetivo Estratégico 2 del roadmap de producto: usuarios recurrentes |
| Listas recurrentes de medicamentos | Que la Persona mantenga un conjunto de medicamentos que compra de forma habitual | La Plataforma es capaz de guardar un conjunto de medicamentos como una lista que se puede volver a comparar en conjunto | Sirve a la necesidad recurrente de Claudia (*"siempre compro los mismos medicamentos"*) y de Rodrigo (comprar toda la receta) | Es la base sobre la que actúa la capacidad "Comparar una lista" (§2.2) |
| Historial de búsquedas | Que la Persona pueda retomar una búsqueda reciente sin repetirla | La Plataforma es capaz de recordar los términos que una Persona buscó recientemente | Ahorra esfuerzo de repetición | Contribuye a la fricción reducida que sostiene la recurrencia (Objetivo 2) |
| Alertas de precio | Que la Persona no tenga que estar revisando manualmente si un precio bajó | La Plataforma es capaz de recordar un umbral de precio deseado por la Persona para un medicamento | Resuelve la necesidad de Claudia: *"recibir alertas"* | Genera un motivo concreto para que la Persona vuelva a la Plataforma |
| Avisar a la Persona cuando se cumple una alerta | Cerrar el ciclo de la Alerta con una notificación efectiva | La Plataforma es capaz de comunicarle a la Persona, por algún medio, que el precio que le interesaba ya bajó | Sin esto, "recordar un umbral" no tendría ningún efecto práctico | Es lo que convierte la capacidad de Alertas en un valor entregado, no solo un dato guardado |

### 2.4 Identidad

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Reconocer a la misma Persona entre clientes | Que una Persona no tenga que "empezar de nuevo" según el cliente que use | La Plataforma es capaz de reconocer que una interacción en un cliente y otra en un cliente distinto corresponden a la misma Persona | Habilita que todo lo demás (Favoritos, Alertas, Premium) la siga, si ella lo decide | Es el prerequisito estructural de toda la convergencia (`IDENTITY_INTEGRATION_PLAN.md` §5) |
| Administrar Perfil | Personalizar la experiencia de una Persona ya reconocida | La Plataforma es capaz de asociar datos de contacto y plan a una Persona reconocida | Le da continuidad a su relación con la Plataforma | Es la base de cualquier relación comercial futura (Premium) |
| Administrar Preferencias del Usuario | Recordar hábitos declarados por la Persona, más allá de un dispositivo | La Plataforma es capaz de guardar decisiones explícitas de la Persona sobre cómo prefiere usarla | Reduce fricción repetida entre sesiones | Sujeto a una Decisión Pendiente de negocio (¿es del Usuario o del contexto? — `USER_DOMAIN_MODEL.md` Decisión #2) |
| Gestionar consentimiento | Que la Persona controle qué se le pide y para qué | La Plataforma es capaz de registrar y respetar lo que una Persona autorizó explícitamente | Da control real sobre su relación con la Plataforma | Nombrada como indicador propio en la arquitectura empresarial (BC-005, "Gestión de consentimientos") |

### 2.5 Monetizar

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Donaciones voluntarias | Ofrecer una forma simbólica de retribución | La Plataforma es capaz de recibir un pago voluntario de una Persona que percibió un ahorro | Le permite expresar gratitud sin obligación | Ingreso hoy simbólico, no un modelo de negocio (`docs/product/strategy/COMPANY_STRATEGY.md`) |
| Suscripción Premium | Ofrecer beneficios adicionales a cambio de pago recurrente | La Plataforma es capaz de reconocer que una Persona pagó por acceso a funciones adicionales | Potencial, no realizado — no hay catálogo comercial que comprar hoy | Fuente de ingresos declarada como Objetivo Estratégico 5 |
| Convenios / afiliación con farmacias | Generar ingreso sin alterar la neutralidad del comparador | La Plataforma es capaz de registrar cuando una Persona fue derivada a una farmacia y, potencialmente, cobrar una comisión por ello | Ninguno directo — es invisible para la Persona si se ejecuta correctamente | Recomendado como el modelo de negocio de entrada más simple (`docs/product/strategy/COMPANY_STRATEGY.md`) |
| API Comercial (datos agregados B2B) | Vender acceso a inteligencia de precios agregada, no a datos de ninguna Persona | La Plataforma es capaz de exponer tendencias y series históricas agregadas a terceros (aseguradoras, laboratorios) | Ninguno directo | Descrito como el ingreso de mayor valor a largo plazo, condicionado a acumular suficiente histórico |
| Publicidad ética | Generar ingreso por visibilidad sin alterar el orden por precio real | La Plataforma sería capaz de mostrar contenido patrocinado etiquetado explícitamente, sin tocar el ranking de precios | Riesgo si no se ejecuta con cuidado — puede percibirse como pérdida de neutralidad | Marcada como la opción de mayor riesgo a la neutralidad de marca (`docs/product/strategy/COMPANY_STRATEGY.md`) |

### 2.6 Inteligencia

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Identificar bioequivalentes | Ayudar a encontrar una alternativa igualmente efectiva y más barata | La Plataforma sería capaz de señalar cuándo un medicamento tiene un equivalente bioequivalente | Ahorro adicional real, más allá de comparar el mismo producto | Nombrada ★★★★★ en `docs/product/ROADMAP.md`, aunque bloqueada según `docs/program/ROADMAP.md` |
| Sugerir sustitutos | Ampliar las opciones de compra más allá del producto buscado | La Plataforma sería capaz de proponer alternativas razonables a lo buscado | Más opciones para decidir | Diferenciador mencionado en el Objetivo Estratégico 4 del roadmap de producto |
| Disponibilidad avanzada | Reducir la frustración de encontrar un precio pero no poder comprarlo | La Plataforma sería capaz de anticipar quiebres de stock, no solo reportar el estado actual | Evita viajes o pedidos en vano | Mencionada como capacidad del Objetivo 4, sin desarrollo evidenciado más allá del dato básico de stock actual |
| Recomendaciones basadas en IA | Ayudar a decidir, no solo a comparar | La Plataforma sería capaz de generar sugerencias personalizadas sobre decisiones de compra de medicamentos | Potencial alto, sin ninguna evidencia de desarrollo | Nombrada ★★★★★, confirmada como "sin código todavía" (`docs/program/ROADMAP.md`) |
| Seguimiento de tratamientos | Acompañar a una Persona que compra el mismo tratamiento de forma continua | La Plataforma sería capaz de reconocer un tratamiento recurrente y acompañarlo en el tiempo | Mencionado como necesidad futura de Claudia (`PERSONAS.md`) | Sin ninguna priorización evidenciada en la documentación revisada |

### 2.7 Operar

| Nombre | Objetivo | Descripción | Valor para el Usuario | Valor para la Plataforma |
|---|---|---|---|---|
| Integrar y mantener fuentes de farmacias | Que los precios mostrados sean reales | La Plataforma es capaz de consultar y mantener actualizada la conexión con cada farmacia | Invisible, pero sin esto no hay ningún dato que comparar | Es la infraestructura mínima de la que depende Descubrir/Comparar |
| Administrar configuración global | Poder ajustar el comportamiento de la Plataforma sin depender de una nueva versión de cada cliente | La Plataforma es capaz de aplicar cambios de configuración (farmacias activas, parámetros) de forma centralizada | Indirecto — mejora la estabilidad y velocidad de corrección de problemas | Reduce el costo operativo de mantener el servicio |
| Publicar y distribuir la Plataforma | Que la Persona pueda acceder a la Plataforma en primer lugar | La Plataforma es capaz de estar disponible públicamente en los canales correspondientes | Sin esto, no hay acceso posible | Objetivo Estratégico 1 del roadmap de producto: "lanzar un producto confiable" |
| Observar salud del servicio | Detectar problemas antes de que afecten a muchas Personas | La Plataforma es capaz de monitorear su propio funcionamiento | Indirecto — menos interrupciones percibidas | Nombrada explícitamente como "fundamental para garantizar la estabilidad" (`docs/product/ROADMAP.md`) |
| Registrar y diagnosticar errores | Poder corregir fallas con evidencia, no a ciegas | La Plataforma es capaz de capturar información técnica cuando algo falla | Indirecto — resolución más rápida de problemas | Reduce el tiempo de resolución de incidentes |
| Medir uso agregado | Entender cómo se usa la Plataforma sin vigilar a nadie | La Plataforma es capaz de generar métricas agregadas y anónimas de uso | Ninguno directo — y por diseño, ningún costo de privacidad (Principio 7, `USER_DOMAIN_MODEL.md`) | Permite decisiones de producto basadas en evidencia, no en intuición |
| Prevenir abuso | Que el servicio siga disponible para todos | La Plataforma es capaz de limitar el uso excesivo o malicioso de sus propios recursos | Indirecto — disponibilidad sostenida | Protege la continuidad operativa y el costo del servicio |
| Recibir y gestionar feedback de Personas | Aprender directamente de quienes usan la Plataforma | La Plataforma es capaz de recibir sugerencias y gestionarlas | Sensación de ser escuchado | Fuente directa de mejora del producto |
| Administrar la operación del negocio (panel interno) | Operar el negocio sin depender de cambios de código para tareas rutinarias | La Plataforma es capaz de ofrecer herramientas internas de gestión (usuarios, planes, clics, configuración) | Ninguno directo | Reduce el costo operativo y el riesgo de cada ajuste rutinario |

---

## 3. Estado

| Capacidad | Estado | Justificación (fuente) |
|---|---|---|
| Buscar medicamentos por texto libre | **Implementada** | `CURRENT_PLATFORM_ASSESSMENT.md` §1.3, §2.1, §3.1 — existe en ambos clientes contra el mismo servicio |
| Normalizar y unificar resultados equivalentes | **Implementada** | `CURRENT_PLATFORM_ASSESSMENT.md` §3.2 (`searchService`, deduplicación, CFM-ID) |
| Filtrar y refinar resultados | **Parcial** | Rica en el Cliente Mobile (bioequivalente, farmacia, comuna, online); más simple en el Cliente Web (`CURRENT_PLATFORM_ASSESSMENT.md` §1.3, §2.1) |
| Ubicar sucursales por comuna | **Parcial** | Solo Mobile (`CURRENT_PLATFORM_ASSESSMENT.md` §6, "Solo Mobile") |
| Comparar precios entre farmacias (un medicamento) | **Implementada** | Núcleo de `searchService` y de la ficha de medicamento en ambos clientes |
| Distinguir canales de precio | **Implementada** | `PriceChannels` en el contrato de dominio, usado en ambos clientes |
| Calcular ahorro | **Implementada** | `SavingsCard`/`hero_block` (Mobile), insights (Web) |
| Comparar una lista de medicamentos (canasta / receta completa) | **Parcial** | Existe en ambos clientes, duplicada e incompatible entre sí (`IDENTITY_INTEGRATION_PLAN.md` §4.3) — no converge como una sola capacidad de Plataforma |
| Ver evolución histórica de precio | **Implementada** (con matiz) | Fuente autoritativa (`price_history`) existe en la Plataforma y se consulta desde el Cliente Web; el Cliente Mobile además mantiene un snapshot local propio, no autoritativo (`CURRENT_PLATFORM_ASSESSMENT.md` §1.4, §4) |
| Compartir un hallazgo de precio | **Parcial** | Solo Mobile (`CURRENT_PLATFORM_ASSESSMENT.md` §6, "Solo Mobile") |
| Favoritos | **Parcial** | Solo Mobile, local, sin sincronizar (`CURRENT_PLATFORM_ASSESSMENT.md` §6; `IDENTITY_INTEGRATION_PLAN.md` §1) |
| Listas recurrentes de medicamentos | **Parcial** | Duplicada, no unificada (ver Comparar canasta, mismo caso) |
| Historial de búsquedas | **Parcial** | Solo Mobile, local (`CURRENT_PLATFORM_ASSESSMENT.md` §6) |
| Alertas de precio | **Parcial** | Dos mecanismos incompatibles, ninguno converge (`IDENTITY_INTEGRATION_PLAN.md` §1, §4.4) |
| Avisar a la Persona cuando se cumple una alerta | **Parcial** | Mecanismo existe en ambos clientes (toast in-app / email) pero atado cada uno a su propio modelo de Alerta, no unificado |
| Reconocer a la misma Persona entre clientes | **No iniciada** (a nivel de Plataforma) | Existe solo dentro del Cliente Web; no existe ningún mecanismo cross-cliente (`IDENTITY_INTEGRATION_PLAN.md` Fase 1, todavía en diseño) |
| Administrar Perfil | **Parcial** | Existe, pero solo accesible desde el Cliente Web (`CURRENT_PLATFORM_ASSESSMENT.md` §2.5) |
| Administrar Preferencias del Usuario | **Parcial** | Existen preferencias locales (comuna) en ambos clientes sin relación entre sí; su clasificación de dominio sigue pendiente (`USER_DOMAIN_MODEL.md` Decisión #2) |
| Gestionar consentimiento | **No iniciada** | No se encontró evidencia de un mecanismo diferenciado de gestión de consentimientos en ninguno de los tres documentos fuente, más allá de lo que Supabase Auth implica por defecto |
| Donaciones voluntarias | **Implementada** | Solo Mobile, vía Khipu (`CURRENT_PLATFORM_ASSESSMENT.md` §1.3) |
| Suscripción Premium | **Parcial** | Motor completo en los Servicios de Plataforma; sin catálogo comercial real; solo accesible desde el Cliente Web (`CURRENT_PLATFORM_ASSESSMENT.md` §2.7) |
| Convenios / afiliación con farmacias | **Planificada** | Recomendada explícitamente como próximo paso de monetización; la base de tracking (clics) ya existe, el acuerdo comercial en sí no (`docs/product/strategy/COMPANY_STRATEGY.md` §3, §6) |
| API Comercial (datos agregados B2B) | **No iniciada** | Nombrada en `docs/product/ROADMAP.md` Objetivo 5; sin evidencia de diseño ni código |
| Publicidad ética | **No iniciada** | Solo nombrada como ítem de lista, sin desarrollo (`docs/product/ROADMAP.md`) |
| Identificar bioequivalentes | **Parcial** | El dato (`isBioequivalent`) y el filtro existen; la capacidad de "identificación inteligente" está bloqueada (`docs/program/ROADMAP.md`: "bioequivalentes bloqueado") |
| Sugerir sustitutos | **No iniciada** | Nombrada en `docs/product/ROADMAP.md` Objetivo 4, sin evidencia de desarrollo |
| Disponibilidad avanzada | **Parcial** | Existe el dato básico de disponibilidad (`hasStock`); nada "avanzado" o predictivo evidenciado |
| Recomendaciones basadas en IA | **No iniciada** | Confirmado explícitamente "sin código todavía" (`docs/program/ROADMAP.md`) |
| Seguimiento de tratamientos | **No iniciada** | Mencionada solo como necesidad futura de una persona (`PERSONAS.md`), sin desarrollo |
| Integrar y mantener fuentes de farmacias | **Implementada** | 9 integraciones activas (`CURRENT_PLATFORM_ASSESSMENT.md` §3.3) |
| Administrar configuración global | **Implementada** | `app_config`, panel `/admin/config` (`CURRENT_PLATFORM_ASSESSMENT.md` §2.2, §4) |
| Publicar y distribuir la Plataforma | **Parcial** | Web en producción; Mobile en Prueba Cerrada, no en producción pública todavía |
| Observar salud del servicio | **Implementada** | Monitoreo horario, healthcheck enriquecido (`CURRENT_PLATFORM_ASSESSMENT.md` §3.7) |
| Registrar y diagnosticar errores | **Implementada** | Logging saneado, Sentry condicional en Mobile y en Servicios de Plataforma |
| Medir uso agregado | **Parcial** | Solo Mobile (PostHog); no existe en el Cliente Web (`CURRENT_PLATFORM_ASSESSMENT.md` §6) |
| Prevenir abuso | **Implementada** | Rate limiting y autenticación de servicio (`CURRENT_PLATFORM_ASSESSMENT.md` §3.4, §3.5) |
| Recibir y gestionar feedback de Personas | **Parcial** | Se origina solo desde Mobile; se gestiona centralizado en el panel del Cliente Web |
| Administrar la operación del negocio (panel interno) | **Implementada** | Panel `/admin` con 4 funciones operativas (`CURRENT_PLATFORM_ASSESSMENT.md` §2.2) |

---

## 4. Dependencias

- **Comparar depende de Descubrir.** No se puede comparar lo que no se encontró primero.
- **Recordar depende de que Descubrir/Comparar ya entreguen algo que valga la pena recordar** — pero no depende de Identidad para existir en su forma básica: ya madura hoy de forma completamente anónima (evidencia: existe en `mobile/` sin ningún mecanismo de Identidad).
- **Identidad no depende de ninguna otra Capacidad para existir**, pero su valor real depende de que exista algo que convenga sincronizar (Recordar, Monetizar) — es un habilitador, no un consumidor de las demás.
- **Monetizar (Suscripción Premium) depende de Identidad** — es una relación comercial con una Persona reconocida (`IDENTITY_INTEGRATION_PLAN.md` §2). **Donaciones** no depende de Identidad — es una transacción puntual. **Convenios/afiliación** depende de Descubrir/Comparar (el mecanismo de derivación ya existe) pero su condición real es una negociación de negocio, no una dependencia de Capacidad. **API Comercial** depende de que Ver evolución histórica de precio (Comparar) acumule suficiente información — es, de todas, la más tardía en poder maduraren términos de datos disponibles.
- **Inteligencia depende de Descubrir y Comparar como fuente de datos.** Ninguna de sus sub-capacidades (Bioequivalentes, Sustitutos, IA) puede existir sin el catálogo de medicamentos y el histórico de precios que esas dos ramas ya producen.
- **Operar no depende de ninguna otra Capacidad — es al revés: todas las demás dependen de Operar** para sostenerse (sin integrar farmacias no hay Descubrir; sin observar salud del servicio, cualquier falla en las demás pasa desapercibida).

**Pueden evolucionar de forma independiente entre sí** (no dependen unas de otras, aunque compartan un mismo prerequisito):
- Favoritos, Listas recurrentes, Historial y Alertas — dependen todas de Descubrir/Comparar, pero no entre sí.
- Administrar Perfil y Administrar Preferencias del Usuario — ambas dependen de Reconocer Identidad, no entre sí.
- Bioequivalentes, Sustitutos, Disponibilidad avanzada, IA y Seguimiento de tratamientos — comparten el mismo prerequisito de datos, pero ninguna depende de que otra exista primero.
- Donaciones y Convenios/afiliación — ninguna depende de la otra ni de Identidad.

---

## 5. Relación con `USER_DOMAIN_MODEL.md`

| Capacidad | Entidades de dominio que utiliza |
|---|---|
| Buscar / Filtrar / Ubicar sucursales | Medicamentos (Plataforma) → Farmacias (Plataforma) — ninguna entidad del Usuario |
| Comparar precio / canales / ahorro / histórico | Medicamentos (Plataforma) → Histórico de precios (Plataforma) — ninguna entidad del Usuario |
| Comparar una lista / Listas recurrentes | Usuario (si se identifica) o Instalación (si no) → Medicamentos (Plataforma) |
| Compartir un hallazgo | Instalación (acción puntual, no genera una pertenencia) → Medicamentos (Plataforma) |
| Favoritos | Usuario (si se identifica) o Instalación (si no) → Medicamentos (Plataforma) |
| Historial de búsquedas | Usuario (conceptualmente, `USER_DOMAIN_MODEL.md` §2) o Instalación (hoy, en la práctica) |
| Alertas de precio / Avisar | Usuario o Instalación → Medicamentos (Plataforma) → Histórico de precios (Plataforma, para evaluar el umbral) |
| Reconocer Identidad | Identidad (mecanismo, no un dato en sí — `USER_DOMAIN_MODEL.md` Vocabulario) |
| Administrar Perfil | Usuario → Perfil |
| Administrar Preferencias del Usuario | Usuario → Preferencias declaradas (pendiente de clasificación definitiva, `USER_DOMAIN_MODEL.md` Decisión #2) |
| Gestionar consentimiento | Usuario → Identidad (mecanismo de consentimiento, BC-005) |
| Suscripción Premium | Usuario → Perfil → Plan |
| Donaciones | Instalación (acción puntual, sin relación continua) |
| Convenios/afiliación, API Comercial, Publicidad ética | Farmacias/Medicamentos (Plataforma) — relación de negocio con terceros, no con una Persona-Usuario |
| Bioequivalentes / Sustitutos / Disponibilidad avanzada / IA | Medicamentos (Plataforma) → Histórico de precios (Plataforma) — ninguna entidad del Usuario en su forma actual/prevista |
| Seguimiento de tratamientos | No evaluable todavía — sin implementación ni diseño que permita determinar si usaría entidades del Usuario o de la Plataforma |
| Todas las Capacidades de Operar | Configuración global (Plataforma), Analytics agregados (Plataforma) — ninguna entidad del Usuario |

---

## 6. Relación con `IDENTITY_INTEGRATION_PLAN.md`

| Capacidad | ¿Requiere Identidad? | ¿Funciona anónimamente? | ¿Es híbrida? |
|---|---|---|---|
| Descubrir (todas sus sub-capacidades) | No | Sí, siempre | No |
| Comparar (todas sus sub-capacidades) | No | Sí, siempre | No |
| Favoritos | No | Sí, hoy | Sí — puede sincronizar si la Persona se identifica |
| Listas recurrentes de medicamentos | No | Sí, hoy | Sí — misma lógica que Favoritos |
| Historial de búsquedas | No | Sí, hoy | Sí, condicional a Opt-In (Decisión Pendiente #1) |
| Alertas de precio | No | Sí, hoy (mecanismo anónimo) | Sí — un solo concepto, con mecanismo anónimo o identificado (`IDENTITY_INTEGRATION_PLAN.md` §4.4) |
| Reconocer Identidad / Administrar Perfil / Preferencias / Consentimiento | Sí, por definición | No aplica — son la Capacidad de Identidad misma | No |
| Suscripción Premium | Sí, siempre | No | No |
| Donaciones | No | Sí, siempre | No |
| Convenios/afiliación, API Comercial, Publicidad ética | No aplica esta clasificación | No aplica | No aplica — son relaciones de negocio con terceros, no con la Persona usuaria final |
| Bioequivalentes / Sustitutos / Disponibilidad avanzada / IA | No, en su forma prevista | Sí | No, salvo que una decisión futura las combine con datos del Usuario para personalizar (no evidenciado) |
| Seguimiento de tratamientos | No evaluable todavía | No evaluable todavía | No evaluable todavía |
| Operar (todas sus sub-capacidades) | No aplica | No aplica | No aplica — no involucran el reconocimiento de una Persona-Usuario final |

---

## 7. Clasificación estratégica

- **Core:** Buscar medicamentos, Normalizar resultados, Comparar precios (un medicamento y canasta), Distinguir canales, Calcular ahorro. *Motivo:* son la propuesta de valor sin la cual no existe producto — consistente con el Principio 1 de `USER_DOMAIN_MODEL.md` ("la búsqueda y comparación... deben funcionar sin identidad, siempre").
- **Supporting:** Filtrar resultados, Ubicar sucursales, Ver histórico de precio, Compartir, Favoritos, Listas recurrentes, Historial, Alertas y su aviso, Identidad/Perfil/Preferencias/Consentimiento. *Motivo:* mejoran la retención y la experiencia (Objetivo Estratégico 2 del roadmap de producto: "usuarios recurrentes"), pero el producto ya entrega su valor central sin ellas.
- **Operational:** Integrar fuentes de farmacias, Observar salud del servicio, Registrar/diagnosticar errores, Medir uso agregado, Prevenir abuso. *Motivo:* invisibles para la Persona pero indispensables para que Core funcione — coincide textualmente con `docs/product/ROADMAP.md`: "no son visibles para el usuario, pero son fundamentales para garantizar la estabilidad del producto".
- **Administrative:** Administrar configuración global, Publicar y distribuir la Plataforma, Recibir y gestionar feedback, Administrar la operación del negocio. *Motivo:* son de gestión del negocio y de la operación interna, no de la estabilidad técnica ni del uso directo del producto.
- **Monetizar, en conjunto, se clasifica como Supporting del negocio, no del producto** — ninguna de sus sub-capacidades (Donaciones, Premium, Convenios, API Comercial, Publicidad) es indispensable para que Descubrir/Comparar funcionen; sostienen la sostenibilidad de la empresa, no la experiencia central.
- **Inteligencia, en conjunto, se clasifica como Supporting hoy, no Core** — aunque `docs/product/ROADMAP.md` la califica con ★★★★★ como "capacidad estratégica" de mayor potencial de diferenciación, esa es una calificación de *potencial futuro*, no de *indispensabilidad presente*: el producto funciona completo sin Bioequivalentes/Sustitutos/IA hoy. No debe confundirse "diferenciador estratégico" con "Core" (ver Principio 6, §9).

---

## 8. Mapa de valor

| Capability | Valor Usuario | Valor Plataforma | Prioridad | Justificación |
|---|---|---|---|---|
| Buscar medicamentos | Muy Alto | Muy Alto | Muy Alto | Sin esto no hay producto |
| Comparar precios (un medicamento, canales, ahorro) | Muy Alto | Muy Alto | Muy Alto | Es la razón de existir declarada por la Persona |
| Comparar una lista / Listas recurrentes | Alto | Alto | Alto | Diferenciador ★★★★★ ya nombrado en el roadmap de producto |
| Ver histórico de precio | Alto | Alto | Alto | Confianza para la Persona; moat de datos para la Plataforma |
| Favoritos | Alto | Medio | Alto | Necesidad explícita de Claudia; retención para la Plataforma |
| Alertas de precio | Alto | Medio | Alto | Necesidad explícita de Claudia; motivo de retorno a la Plataforma |
| Filtrar resultados | Medio | Medio | Medio | Reduce fricción, sin ser indispensable |
| Ubicar sucursales | Medio | Bajo | Medio | Relevante para personas como Carmen, sin evidencia de ser un diferenciador priorizado |
| Historial de búsquedas | Medio | Bajo | Medio | Conveniencia, sin evidencia de ser un diferenciador |
| Compartir un hallazgo | Bajo | Bajo | Bajo | Sin evidencia de estar priorizado como palanca de crecimiento |
| Reconocer Identidad entre clientes | Medio | Alto | Alto | Nadie lo pide explícitamente hoy, pero es prerequisito de toda la convergencia futura |
| Administrar Perfil / Preferencias | Medio | Medio | Medio | Habilitador, no un fin en sí mismo |
| Gestionar consentimiento | Bajo | Medio | Medio | Relevante para cumplimiento, poco perceptible para la Persona |
| Suscripción Premium | Bajo (hoy) | Alto (potencial) | Medio | Sin catálogo comercial, el valor para la Persona es hoy nulo en la práctica |
| Donaciones | Bajo | Bajo | Bajo | Ingreso simbólico, no un modelo de negocio |
| Convenios / afiliación | Bajo | Alto | Alto | Recomendado explícitamente como el primer modelo de negocio a instrumentar |
| API Comercial B2B | Bajo | Alto (largo plazo) | Medio | Alto potencial, pero depende de acumular más histórico todavía |
| Publicidad ética | Bajo | Bajo-Medio | Bajo | Riesgo explícito a la neutralidad si se ejecuta mal |
| Bioequivalentes | Alto | Alto | Alto | ★★★★★ en el roadmap de producto, con ahorro real adicional |
| Sustitutos | Medio | Medio | Medio | Mencionado, con menos desarrollo documental que Bioequivalentes |
| IA aplicada a medicamentos | Alto (potencial) | Alto (potencial) | Alto | ★★★★★ en el roadmap, aunque sin ningún desarrollo evidenciado todavía |
| Disponibilidad avanzada | Medio | Medio | Medio | Mejora incremental sobre un dato ya existente |
| Seguimiento de tratamientos | Medio | Bajo | Bajo | Mencionado por una sola persona en la documentación, sin priorización evidenciada |
| Operar (todas las sub-capacidades) | Bajo directo / Muy Alto indirecto | Muy Alto | Muy Alto | Invisible para la Persona, pero sin esto nada de lo anterior se sostiene |
| Administrar la operación del negocio | Bajo directo | Alto | Medio | Gestión interna necesaria, sin percepción directa de la Persona |

---

## 9. Principios

1. **Una Capacidad se define por lo que la Plataforma puede hacer, no por dónde se ejecuta.** El dominio reconoce "Comparar una lista" como una sola Capacidad aunque hoy tenga dos implementaciones de cliente distintas e incompatibles (`IDENTITY_INTEGRATION_PLAN.md` §4.3).
2. **Una Capacidad puede estar disponible en un cliente y no en otro sin dejar de ser una sola Capacidad de la Plataforma.** La brecha es de cobertura, no de identidad conceptual — Favoritos es una Capacidad, no dos, aunque hoy solo exista en un cliente.
3. **Ninguna Capacidad Core puede requerir Identidad.** Se desprende directamente de `USER_DOMAIN_MODEL.md`/`IDENTITY_INTEGRATION_PLAN.md`, y hoy, de hecho, ninguna Capacidad Core la requiere.
4. **El valor para el Usuario y el valor para la Plataforma se evalúan por separado, y pueden diferir mucho entre sí.** Evita que una Capacidad de bajo valor inmediato para la Persona (Premium sin catálogo) se sobreestime solo por su valor de negocio, o viceversa.
5. **Una Capacidad Operativa o Administrativa no necesita ser visible para la Persona para ser indispensable.** Cita directa de `docs/product/ROADMAP.md`: "no son visibles para el usuario, pero son fundamentales para garantizar la estabilidad del producto".
6. **"Diferenciador estratégico futuro" no equivale a "Core" presente.** Una Capacidad puede tener el mayor potencial de diferenciación (Bioequivalentes, IA, ★★★★★ en el roadmap de producto) y no ser, hoy, indispensable para que el producto funcione.
7. **Ninguna Capacidad de Monetización puede alterar el resultado de una Capacidad de Comparar.** Es la traducción, a nivel de Capacidad, del Principio de Neutralidad ya vigente (`docs/product/PRODUCT_PRINCIPLES.md` #3; Principio 10, `USER_DOMAIN_MODEL.md`).
8. **Una Capacidad puede madurar de anónima a híbrida sin dejar de servir a quien nunca se identifica.** Ninguna Capacidad hoy anónima debe volverse exclusiva de Usuarios identificados al converger (`IDENTITY_INTEGRATION_PLAN.md` §8).
9. **Una Capacidad de Inteligencia depende de los datos que producen Descubrir y Comparar — no puede diseñarse en el vacío.** El histórico de precios y el catálogo de medicamentos son su materia prima.
10. **El estado de una Capacidad se determina por evidencia documental, nunca por intención declarada.** Una Capacidad mencionada en un roadmap sin código ni diseño evidenciado se clasifica como "No iniciada", no como "Planificada", salvo que exista una decisión o documento que la programe explícitamente.

---

## 10. Capability Roadmap (orden de madurez lógica, sin fechas ni sprints)

```
Descubrir
   ↓
Comparar
   ↓            (Operar madura en paralelo, de forma continua, desde el principio —
   │             no es un escalón secuencial, ver nota abajo)
Recordar
   ↓
Identidad
   ↓
Monetizar
   ↓
Inteligencia
```

- **Descubrir primero:** es lógicamente la primera Capacidad posible — sin poder encontrar un medicamento, ninguna otra Capacidad tiene sentido.
- **Comparar depende de Descubrir:** no se puede comparar lo que no se encontró primero. Ambas ya constituyen, juntas, el núcleo Core del producto.
- **Operar no es un escalón secuencial — es una condición paralela y continua**, no un paso "después" de Descubrir/Comparar: sin integrar farmacias ni observar la salud del servicio desde el principio, ninguna de las dos anteriores podría haber llegado a madurar. Se representa aparte para no forzarla en una cadena que no le corresponde.
- **Recordar antes que Identidad, no después:** Favoritos/Alertas/Historial/Listas ya maduraron de forma completamente anónima — la evidencia lo confirma (existen hoy en Mobile sin ningún mecanismo de Identidad). Depende de que Descubrir/Comparar ya entreguen algo que valga la pena recordar, no de Identidad.
- **Identidad se vuelve relevante recién cuando ya existe algo de valor que convenga que siga a la Persona entre clientes.** Converger una Identidad sin nada todavía que sincronizar no aporta nada por sí sola — el mismo razonamiento que ya usó `IDENTITY_INTEGRATION_PLAN.md` §6.2 para posponer Premium frente a Favoritos/Comparaciones.
- **Monetizar depende de Identidad** (para Premium) **y de que Comparar/Recordar ya demuestren suficiente valor retenido** como para justificar cobrar por algo o negociar convenios con farmacias.
- **Inteligencia al final:** depende de que exista suficiente histórico acumulado (Comparar) y suficiente base de medicamentos/farmacias (Descubrir); es, además, la rama con menor evidencia de desarrollo actual de las seis.

**Nota importante:** este orden de madurez lógica describe cómo las Capacidades maduraron y deberían seguir madurando *en general* — no es el mismo orden que el roadmap de convergencia de `IDENTITY_INTEGRATION_PLAN.md` (que ordena trabajo futuro específico de sincronización entre clientes, una vez que Identidad ya es la fase activa). No se contradicen: uno describe la maduración de las Capacidades como tales; el otro, la secuencia de trabajo de convergencia dentro de una de ellas (Identidad) una vez llegado ese punto.

---

## Validación final

### Documentos utilizados
- `docs/archive/assessments/CURRENT_PLATFORM_ASSESSMENT_2026-08-06.md` (fuente principal)
- `docs/technology/domain/USER_DOMAIN_MODEL.md` (fuente principal)
- `docs/technology/architecture/IDENTITY_INTEGRATION_PLAN.md` (fuente principal, versión revisada PLATFORM-002A)
- `docs/product/ROADMAP.md` (Objetivos Estratégicos, Capacidades por objetivo, Capacidades Estratégicas y Operacionales — citado extensamente en §2, §3, §7, §8)
- `docs/program/ROADMAP.md` (estado por workstream — Growth/Commercial, citado en §3)
- `docs/product/definition/PERSONAS.md` (citado en §2, §8)
- `docs/product/PRODUCT_PRINCIPLES.md` (citado en §7)
- `docs/design/brand/BRAND_FOUNDATIONS.md` (grounding de principios ya usado en `USER_DOMAIN_MODEL.md`, no releído en extenso en este sprint)

### Código revisado
Ninguno.

### Documento creado
`docs/technology/architecture/PLATFORM_CAPABILITY_MODEL.md` (este documento).

### Relación con otros documentos

```
CURRENT_PLATFORM_ASSESSMENT.md      — cómo funciona ComparaFarma HOY (hechos, sin propuesta)
        ↓
USER_DOMAIN_MODEL.md                — qué es un Usuario y qué le pertenece (concepto, sin implementación)
        ↓
IDENTITY_INTEGRATION_PLAN.md        — cómo convergen Mobile y Web hacia ese modelo de Usuario (plan, sin código)
        ↓
PLATFORM_CAPABILITY_MODEL.md        — qué es capaz de hacer la Plataforma en conjunto (capacidades, sin pantallas/APIs)
```

Cada documento responde una pregunta que el anterior no respondía, y ninguno repite al anterior: el primero describe hechos; el segundo define conceptos de negocio sobre esos hechos; el tercero traza cómo evolucionar la implementación hacia esos conceptos; este último completa la arquitectura funcional dando la vista de conjunto — qué puede hacer la Plataforma, con qué estado, con qué relación al Usuario y a la Identidad, y en qué orden lógico deberían madurar sus partes. Con este documento, la arquitectura funcional queda completa: cualquier trabajo posterior (RFC, ADR, diseño técnico) tiene una Capacidad de la Plataforma a la que remitirse, un concepto de Usuario que respetar, un plan de convergencia que seguir y una fotografía real de dónde se está parado hoy.

Este documento queda a la espera de aprobación explícita antes de continuar con cualquier trabajo posterior.
