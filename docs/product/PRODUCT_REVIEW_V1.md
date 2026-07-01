# Product Review — ComparaFarma v1.4.0
**Fecha:** 2026-06-30  
**Tipo:** Revisión de producto desde la perspectiva del usuario final  
**Alcance:** Pantallas, navegación, textos, UX, accesibilidad y experiencia general

> Esta revisión analiza **lo que el usuario ve y vive**, no la arquitectura interna ni el código. Cada observación parte de leer el contenido de las pantallas y componentes tal como los experimenta una persona usando la app.

---

## Índice

1. [Impresión general](#1-impresión-general)
2. [Flujo de onboarding](#2-flujo-de-onboarding)
3. [Pantalla Home](#3-pantalla-home)
4. [Barra de búsqueda](#4-barra-de-búsqueda)
5. [Pantalla de Resultados](#5-pantalla-de-resultados)
6. [Pantalla de Detalle de Medicamento](#6-pantalla-de-detalle-de-medicamento)
7. [Pantalla de Lista de Compras (Carrito)](#7-pantalla-de-lista-de-compras-carrito)
8. [Hoja de Filtros](#8-hoja-de-filtros)
9. [Alertas de Precio](#9-alertas-de-precio)
10. [Pantalla Acerca de / Feedback](#10-pantalla-acerca-de--feedback)
11. [Navegación global](#11-navegación-global)
12. [Textos y copy](#12-textos-y-copy)
13. [Accesibilidad](#13-accesibilidad)
14. [Modo oscuro](#14-modo-oscuro)
15. [Microcopy y estados vacíos](#15-microcopy-y-estados-vacíos)
16. [Mejoras v1.5 — Lista priorizada](#16-mejoras-v15--lista-priorizada)
17. [Mejoras v2.0 — Lista priorizada](#17-mejoras-v20--lista-priorizada)

---

## 1. Impresión general

ComparaFarma resuelve un problema real y concreto para el usuario chileno: saber dónde comprar un medicamento más barato. La propuesta de valor es clara desde la primera pantalla y el flujo principal —buscar → ver resultados → ver detalle— funciona bien.

La app tiene un nivel de polish superior al promedio de apps de utilidad: animaciones fluidas, skeleton loading, dark mode, toasts in-app, historial persistente. El usuario siente que la app fue construida con cuidado.

Los puntos de fricción más importantes son:

1. **Descubribilidad de funcionalidades avanzadas** — el carrito, las alertas de precio y el filtro por comuna son features poderosas que el usuario no encuentra fácilmente.
2. **Educación sobre canales de precio** — la mayoría de los usuarios no sabe qué es "T. Más", "SBPay" o "CMR" sin que la app lo explique en contexto.
3. **Alertas solo in-app** — el usuario espera recibir una notificación push, no descubrir que el precio bajó la próxima vez que abra la app.
4. **Accesibilidad inconsistente** — excelente en Home, inexistente en componentes clave como tarjetas de farmacia, carrito y formulario de feedback.

**Score general de experiencia de usuario: 7.5 / 10**

| Dimensión | Score | Nota |
|-----------|-------|------|
| Propuesta de valor | 9/10 | Clara, relevante, diferenciadora |
| Flujo principal | 8/10 | Fluido, con pequeñas fricciones en resultados |
| Funcionalidades avanzadas | 7/10 | Poderosas pero poco descubribles |
| Textos y copy | 8/10 | En su mayoría claros y en buen castellano |
| Accesibilidad | 5/10 | Inconsistente: excelente en Home, ausente en componentes |
| Estética y polish | 9/10 | Animaciones, colores, dark mode, skeleton loading |
| Información al usuario | 7/10 | Canales de precio requieren más educación contextual |

---

## 2. Flujo de onboarding

### Lo que funciona

- **5 slides bien estructurados** que cubren el valor de la app de mayor a menor urgencia: búsqueda → comparación → canales de precio → favoritos → carrito.
- El botón **"Saltar"** es visible y accesible — el usuario nunca se siente atrapado.
- El slide 3 ("Hay 4 formas de ahorrar") es el más valioso de toda la app: explica el concepto de canales de precio que muchos usuarios no conocen.
- La distinción entre modo primera vez ("¡Comenzar!") y modo ayuda ("Entendido") demuestra atención al detalle.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| O-1 | El slide 1 nombra solo algunas farmacias. La app tiene 9. El usuario descubre las restantes por sorpresa. | Media |
| O-2 | 5 slides es demasiado. La investigación UX indica que los usuarios leen el primer slide y hacen "skip" en los restantes. El slide 3 (canales de precio), el más importante, se pierde frecuentemente. | Media |
| O-3 | No hay ninguna imagen o ilustración — solo emojis. Los slides son solo texto. En un tema visual (comparar precios) las capturas de pantalla o ilustraciones tendrían más impacto. | Baja |
| O-4 | Los puntos de paginación son muy pequeños y no tienen accessibilityLabel ni hint de navegación para lectores de pantalla. | Baja |
| O-5 | El slide 5 describe el carrito sin dar contexto de cómo llegar a ese resultado. Genera expectativa sin instrucción. | Baja |

### Recomendaciones

- Reducir a 3 slides: (1) qué hace la app, (2) cómo buscar y comparar, (3) canales de precio con mini-ilustración.
- Agregar un "Tip contextual" la primera vez que el usuario llega al detalle del medicamento, explicando los canales in-context.

---

## 3. Pantalla Home

### Lo que funciona

- El hero con el SearchBar inmediatamente visible es correcto — la app no esconde su función principal.
- "9 farmacias en Chile" como subtítulo es un diferenciador claro.
- El botón de filtro contextual que muestra "📍 Santiago" cuando hay una comuna seleccionada es excelente UX.
- Las **Búsquedas frecuentes** (Paracetamol, Ibuprofeno, Metformina...) son atajos útiles.
- La sección de **Categorías populares** con icono + nombre es visualmente limpia.
- **Favoritos** en scroll horizontal es un acceso rápido genuinamente útil.
- "Hecho con ❤️ para los chilenos 🇨🇱" en el footer es cálido y apropiado.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| H-1 | El ícono del carrito en el header es la única entrada a la lista de compras. Un usuario que no entiende que el carrito permite comparar totales nunca usa esa funcionalidad. No hay ningún texto descriptivo ni señal de que ese ícono es para "comparar compra completa". | Alta |
| H-2 | "Acerca de" y el formulario de feedback solo son accesibles tocando el banner "Ayúdanos a mejorar". No hay menú de configuración ni ajustes. El usuario que busca "ajustes", "versión" o "ayuda" no los encuentra. | Alta |
| H-3 | El botón de filtros no tiene un nombre claro. Dice "Sin filtros activos" o la comuna seleccionada, pero no describe qué tipo de filtros aplica (farmacias, ubicación, modo de compra). | Media |
| H-4 | Los favoritos muestran precios "al momento de guardar". Los precios cacheados podrían tener días o semanas de antigüedad. La distinción temporal es demasiado pequeña para que el usuario la note. | Media |
| H-5 | Las Búsquedas frecuentes no tienen descripción de qué tipo de medicamento son. Un usuario que no conoce "Losartán" no sabe que es para hipertensión. | Baja |
| H-6 | El banner "Ayúdanos a mejorar" aparece siempre, incluso para usuarios frecuentes. No tiene condición de cierre ni frecuencia limitada. | Baja |

---

## 4. Barra de búsqueda

### Lo que funciona

- El placeholder "Buscar medicamento..." es preciso.
- El mínimo de 3 caracteres evita búsquedas accidentales.
- El botón de limpiar (×) aparece solo cuando hay texto.
- Las sugerencias desplegables para términos frecuentes ayudan al usuario que no recuerda el nombre genérico.
- El debounce de 500ms con liveSearch es transparente.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| SB-1 | **El ícono del micrófono es engañoso.** Al tocarlo muestra el tip "Toca el micrófono 🎤 en tu teclado para buscar por voz". No es una función de la app — es una instrucción para el teclado del sistema. Un usuario que no tiene el micrófono en su teclado se frustrará. El ícono genera expectativa de una feature que no existe. | Alta |
| SB-2 | El botón de submit se deshabilita con < 3 caracteres sin ningún mensaje que explique por qué. El usuario ve un botón inactivo sin entender la causa. | Baja |
| SB-3 | Las sugerencias del dropdown son búsquedas frecuentes globales, no el historial personal del usuario. Si el usuario busca "Omeprazol" habitualmente, no lo verá sugerido a menos que esté en la lista hardcodeada. | Baja |

---

## 5. Pantalla de Resultados

### Lo que funciona

- El contador "{n} medicamentos encontrados" da seguridad sobre el alcance de la búsqueda.
- El banner de bioequivalentes es educación pasiva excelente — el usuario aprende que existe la opción.
- El tooltip de primera visita ("Toca un medicamento para ver los precios") es sutil y aparece solo una vez.
- Pull-to-refresh funciona bien.
- El texto de loading "Consultando Cruz Verde, Salcobrand..." da transparencia.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| R-1 | **El toggle de bioequivalentes** ("🌿 Bio (3)") no se ve como un toggle. Parece un badge o contador. El estado activo vs inactivo necesita más contraste visual (fondo diferenciado, borde, indicador de "filtro activo"). | Alta |
| R-2 | **Sin indicador del tiempo de espera.** La búsqueda puede tardar hasta 30 segundos. El texto "Consultando..." no tiene barra de progreso ni estimación. En conexiones lentas el usuario puede pensar que la app se colgó. | Alta |
| R-3 | Cuando hay un filtro de ubicación activo, no hay indicador en la pantalla de Resultados. El chip de comuna solo está en Home. El usuario no sabe que sus resultados están siendo filtrados por geografía. | Media |
| R-4 | El estado vacío genérico ("Sin resultados para...") no menciona si un filtro activo puede ser la causa. Si el usuario activó "Solo con despacho a domicilio" y no hay resultados, no se lo dicen. | Media |
| R-5 | Las tarjetas no siempre muestran laboratorio. El usuario no puede distinguir entre un genérico y una marca por la tarjeta de resultados. | Baja |
| R-6 | Los puntos de color de farmacia en cada card no tienen leyenda. Un usuario nuevo no sabe que representan farmacias. | Baja |

---

## 6. Pantalla de Detalle de Medicamento

Esta es la pantalla más rica y compleja. Concentra el valor diferencial: todos los canales de precio por farmacia, el ahorro, el historial y la alerta.

### Lo que funciona

- El **header flotante custom** con los 4 botones de acción (favorito, alerta, carrito, compartir) es limpio.
- La **tarjeta de ahorro** ("¡Excelente elección! Elige Salcobrand y ahorra $3.200") transforma datos en recomendación accionable.
- El **badge porcentual de ahorro** (ej: "18% menos") hace el ahorro tangible.
- Los **tabs de ordenamiento** (Precio más bajo / más alto) son un detalle útil.
- El **badge "MEJOR PRECIO"** en la primera tarjeta ordenada es claro.
- El **historial de precios** (gráfico de barras) aporta contexto cuando hay datos.
- La **alerta de precio** con ajuste ±500 y porcentaje de descuento en tiempo real es muy bien ejecutada.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| D-1 | **Los canales de precio no están explicados.** El usuario ve chips como "T. Más", "SBPay", "CMR", "Fonasa", "Plus". Ninguno de estos nombres es autoevidente. Una persona que nunca ha tenido tarjeta de fidelización en farmacia no sabe qué debe tener para acceder a ese precio. No hay tooltip ni explicación en contexto. | Alta |
| D-2 | La tarjeta de farmacia muestra el **nombre de producto de la farmacia** (ej: "PARACETAMOL CINFA 500MG X16 COMP") junto al nombre canónico. En algunos casos estos nombres son muy diferentes y el usuario puede dudar si es el mismo medicamento que buscó. | Alta |
| D-3 | El **banner de donación** aparece cuando el ahorro supera $1.000. En medicamentos comunes (paracetamol, ibuprofeno), casi siempre hay una diferencia de más de $1.000. El banner aparece con demasiada frecuencia y puede percibirse como invasivo. No tiene opción de descarte temporal. | Alta |
| D-4 | La **alerta de precio** solo dispara un toast in-app la próxima vez que el usuario **busca ese medicamento** activamente. No hay push notification. El usuario que crea una alerta espera ser avisado sin tener que recordar buscar. | Alta |
| D-5 | El header tiene **5 elementos interactivos** (atrás, favorito, alerta, carrito, compartir). En pantallas pequeñas o nombres de medicamento largos, el header puede verse apretado. | Media |
| D-6 | El **historial de precios** no se muestra si hay < 2 snapshots. En la primera visita no aparece la sección ni hay ningún texto que diga "Empezaremos a rastrear el precio". El usuario no sabe que la feature existe hasta la segunda visita casual. | Media |
| D-7 | El mensaje de advertencia cuando hay solo 1 farmacia usa "molécula" y "presentación" — términos farmacéuticos técnicos que el usuario promedio no usa. | Media |
| D-8 | El timestamp "Hace 3 min" por farmacia está al final de cada tarjeta en texto pequeño. Muchos usuarios no lo notan. No hay indicador global de frescura de datos. | Baja |
| D-9 | El botón "Ver en farmacia →" abre un browser externo sin confirmación ni indicación de que el usuario está saliendo de la app. | Baja |
| D-10 | La tarjeta de ahorro muestra el monto pero no explicita "vs. qué farmacia" es el ahorro. El usuario sabe cuánto ahorra pero no el punto de comparación sin releer las tarjetas. | Baja |

---

## 7. Pantalla de Lista de Compras (Carrito)

### Lo que funciona

- La idea central —"¿Dónde sale más barato el total?"— es el feature más diferenciador de la app.
- El ranking de farmacias por total con 🥇 para la ganadora es visualmente claro.
- El aviso de disponibilidad parcial ("precio parcial — no incluye todos los medicamentos") es honesto.
- El banner de ahorro total es poderoso.
- El estado vacío con instrucción de cómo usar el carrito está bien escrito.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| C-1 | El **límite de 8 medicamentos** no está comunicado en ningún lugar previo. El usuario lo descubriría al intentar agregar el noveno ítem. | Alta |
| C-2 | El carrito **no es accesible desde la pantalla de Resultados**. Para agregar al carrito, el usuario debe entrar al detalle de cada medicamento. No hay acceso directo desde la lista. | Media |
| C-3 | El flujo para usar el carrito tiene 5+ pasos para agregar solo 2 ítems (buscar A → detalle A → agregar → volver → buscar B → ...). No hay shortcut. | Media |
| C-4 | El carrito muestra "Solo tiene 2 de 3 medicamentos" para farmacias con stock parcial, pero no dice **qué medicamento falta**. El usuario no puede tomar una decisión informada sin saberlo. | Media |
| C-5 | No hay forma de ver el detalle de precio de un ítem del carrito sin salir, buscar y volver. | Baja |
| C-6 | El encabezado alterna entre "Lista de compras" y "Lista (3)". La inconsistencia de nombre puede confundir. | Baja |

---

## 8. Hoja de Filtros

### Lo que funciona

- La integración de 3 dimensiones de filtro en una sola hoja (ubicación, farmacia, modo de compra + ordenamiento) es compacta.
- El selector de comuna con búsqueda en tiempo real es excelente.
- La separación entre farmacias disponibles y no disponibles en la comuna es una solución elegante.
- "Todas / Desmarcar todas" como toggle masivo ahorra tiempo.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| F-1 | Al seleccionar una **comuna**, el filtro muestra cuáles farmacias están "disponibles", pero el usuario puede confundir "disponible en la comuna" (sucursal registrada) con "tiene stock del medicamento buscado". El término es ambiguo. | Alta |
| F-2 | El toggle **"Solo con despacho a domicilio"** no actualiza visualmente el listado de farmacias debajo de él. El usuario no puede ver inmediatamente cuáles quedan activas. | Media |
| F-3 | El filtro **no se resetea entre búsquedas**. Si el usuario filtra por Providencia y luego busca otro medicamento, el filtro sigue activo. No hay indicador persistente en Resultados de que hay un filtro activo. | Media |
| F-4 | La sección de farmacias sin sucursal en la comuna está colapsada por default. Es la información más útil para explicar por qué ciertas farmacias no aparecen, pero está oculta. | Baja |

---

## 9. Alertas de Precio

### Lo que funciona

- El flujo de creación es claro: precio objetivo con cálculo de porcentaje en tiempo real.
- Los botones ±500 para ajuste rápido son convenientes.
- El mensaje de error en contexto cuando el precio objetivo supera el precio actual.
- El copy "Te avisaremos en la app cuando busques este medicamento" es honesto.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| A-1 | **"Te avisaremos en la app cuando busques este medicamento"** revela la limitación principal: la alerta solo dispara si el usuario recuerda buscar. Si olvida el medicamento, la alerta nunca se activa. La feature solo funciona para usuarios que ya tienen el hábito de buscar frecuentemente. | Alta |
| A-2 | No hay ninguna pantalla donde el usuario pueda ver **todas sus alertas activas**. Las alertas se gestionan solo desde el detalle de cada medicamento. Si el usuario tiene 5 alertas y quiere revisarlas, no hay forma directa. | Alta |
| A-3 | El ícono de campana 🔔 es el símbolo estándar de "notificaciones push" en iOS y Android. Usarlo para una feature que no envía push genera una expectativa que la app no cumple. | Media |
| A-4 | Los incrementos ±500 pueden ser poco granulares para medicamentos baratos (< $2.000). | Baja |

---

## 10. Pantalla Acerca de / Feedback

### Lo que funciona

- El formulario es simple: mensaje + email opcional.
- El estado de éxito con checkmark da cierre al usuario.
- El placeholder es preciso.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| Ab-1 | La pantalla mezcla dos propósitos distintos: formulario de feedback Y información institucional, pero el header dice "Acerca de" mientras el contenido es mayormente un formulario. El usuario que busca información de la app (versión, quién la hace, contacto legal) no la encuentra. | Media |
| Ab-2 | **No hay versión de la app** visible en ningún lugar. Un usuario que reporta un bug no puede indicar qué versión tiene. | Media |
| Ab-3 | No hay información de contacto, redes sociales ni enlace a la política de privacidad en toda la app. | Baja |
| Ab-4 | La única forma de llegar a esta pantalla es tocando el banner "Ayúdanos a mejorar" en Home. Para un usuario que quiere dar feedback pero no vio el banner, es inaccesible. | Media |

---

## 11. Navegación global

### Estructura actual

```
Home
├── Resultados (stack) → Detalle (stack)
│   ├── AlertSheet (modal bottom)
│   └── FilterSheet (modal bottom)
├── Carrito (desde header Home)
├── Onboarding (condicional al primer uso)
└── Acerca de (desde banner en Home)
```

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| N-1 | **Sin tab bar ni menú persistente.** Toda la navegación es contextual. Carrito, alertas y ajustes son inaccesibles salvo que el usuario ya sepa que existen. El flujo principal de búsqueda funciona bien, pero el descubrimiento de features avanzadas es muy bajo. | Alta |
| N-2 | Desde **Resultados**, no hay acceso al carrito. El usuario debe volver a Home para verlo. | Media |
| N-3 | El botón de **ayuda (?)** en Home lleva al onboarding en modo "help". El usuario que busca FAQ, tutorial detallado o información de la app verá los mismos 5 slides del onboarding inicial. | Baja |
| N-4 | Al llegar al detalle desde **favoritos** en Home y volver, no hay pantalla de resultados intermedia — vuelve directo a Home. Puede ser desorientador. | Baja |

---

## 12. Textos y copy

### Fortalezas generales

- El castellano es correcto y fluido. Sin anglicismos innecesarios.
- El tono es cálido y directo.
- La pluralización está bien implementada.
- El footer "Hecho con ❤️ para los chilenos 🇨🇱" genera identificación.
- "Precios verificados hoy · Actualizados en tiempo real" genera confianza.
- Los tips del estado vacío son concretos y útiles.

### Problemas de copy

| # | Problema | Severidad |
|---|----------|-----------|
| T-1 | **"T. Más", "SBPay", "CMR", "Fonasa", "Plus"** — labels usados en tarjetas de precio sin explicación. Un usuario que no es cliente de esas farmacias no sabe qué son. | Alta |
| T-2 | **"Molécula" y "presentación"** en el mensaje de advertencia del detalle son términos farmacéuticos. Reemplazar por "principio activo" o "este medicamento en otra dosis o formato". | Media |
| T-3 | **"Bioequivalente"** se usa extensamente en Results y Detalle sin que ninguno de esos lugares lo explique. Solo el onboarding lo menciona (slide 2), que muchos usuarios omiten. | Media |
| T-4 | **"Búsquedas frecuentes"** describe términos populares globales, no el historial del usuario. "Medicamentos populares" o "Búsquedas comunes" sería más preciso. | Baja |
| T-5 | La pantalla de Lista de compras alterna entre "Lista de compras" (header de pantalla) y "Lista (N)" (header dinámico). El nombre debería ser consistente. | Baja |

---

## 13. Accesibilidad

### Situación actual

La accesibilidad es **muy inconsistente** entre pantallas y componentes. Home tiene cobertura excelente; componentes reutilizables críticos como tarjetas de resultados, gráficos y toasts no tienen ninguna.

**Componentes con buena cobertura:**
- Botones del header Home (Ayuda, Carrito, Filtros)
- Búsquedas recientes (Buscar {term}, Eliminar {term})
- Favoritos (Favorito: {name})
- Botones de acción en Detalle (Volver, Favorito, Alerta, Carrito, Compartir)
- "Ver en farmacia" (role: link)

**Componentes sin accesibilidad:**
- `MedicationListItem` — la tarjeta más importante de la app
- `PharmacyLogo` — colores de farmacia sin texto alternativo
- `EmptyState` — no hay anuncio a lectores de pantalla
- `SkeletonCard` — debería anunciarse como "Cargando medicamentos"
- `PriceHistoryChart` — gráfico completamente inaccesible
- `DonationBanner` — botones de donación sin labels
- `AlertSheet` — campos de input sin labels
- `FilterSheet` — toggles de farmacias sin labels
- `InAppToast` — no tiene `accessibilityLiveRegion`
- `SearchBar` — campo de texto sin accessibilityLabel
- `cart.tsx` — pantalla completa sin accesibilidad
- `about.tsx` — formulario completo sin accesibilidad

**No hay uso de `accessibilityHint` en toda la app.** Los hints son necesarios para explicar el resultado de una acción cuando el label solo no es suficiente.

**TalkBack / VoiceOver:** un usuario con discapacidad visual puede navegar el header y los botones del detalle, pero la pantalla de resultados (las tarjetas) y el carrito son inaccesibles.

---

## 14. Modo oscuro

### Lo que funciona

- Dark mode automático vía media query funciona en todas las pantallas principales.
- Los colores de farmacia se han adaptado apropiadamente.
- El header oscuro es correcto y no es negro puro.

### Problemas

| # | Problema | Severidad |
|---|----------|-----------|
| DM-1 | El **DonationBanner** tiene fondo fijo `rose-50` — blanco-rosado extremadamente brillante sobre fondo oscuro. No tiene variante dark. | Media |
| DM-2 | El **SkeletonCard** usa grises claros fijos (#e5e7eb, #d1d5db). En modo oscuro generan un contraste muy alto. | Baja |
| DM-3 | El **PriceHistoryChart** usa colores fijos para las barras. La barra "inactiva" (#e5e7eb) puede ser demasiado brillante en dark mode. | Baja |

---

## 15. Microcopy y estados vacíos

### Fortalezas

- Los tips del EmptyState son concretos: usar principio activo, omitir dosis, revisar ortografía.
- El estado vacío del carrito incluye una instrucción de cómo usarlo.
- Los mensajes de error son diferenciados (red vs. error genérico).

### Oportunidades

| # | Oportunidad | Valor |
|---|-------------|-------|
| MC-1 | **Primer snapshot de precio:** cuando hay solo 1 snapshot, mostrar "Empezaremos a registrar el historial de precios. Vuelve para ver si bajó." | Alto |
| MC-2 | **Resultados filtrados sin match:** si los filtros dejan 0 resultados, mostrar "Ninguna farmacia activa tiene este medicamento. Intenta desactivar los filtros." con botón de acción. | Alto |
| MC-3 | **Alerta creada:** el toast de confirmación debería decir "Te avisaremos la próxima vez que busques {name} y el precio baje de {targetPrice}." para gestionar la expectativa sobre notificaciones. | Alto |
| MC-4 | **Cart lleno:** mostrar "Lista (8/8)" antes de que el usuario intente agregar el noveno ítem. | Medio |
| MC-5 | **Donación:** agregar "No, gracias" como botón explícito de descarte temporal (7 días) en el DonationBanner. | Medio |

---

## 16. Mejoras v1.5 — Lista priorizada

Mejoras implementables sin cambios de arquitectura ni nuevas integraciones de backend. Alto impacto, baja complejidad relativa.

| Prioridad | ID | Mejora | Impacto | Esfuerzo |
|-----------|----|--------|---------|----------|
| 1 | v15-01 | **Eliminar o reemplazar el ícono de micrófono en SearchBar.** Si no se implementa voz real (`expo-speech`), remover el ícono. Genera expectativa falsa de una feature inexistente. | Alto | Bajo |
| 2 | v15-02 | **Tooltip contextual para canales de precio** en la tarjeta de farmacia del detalle. Un ícono ℹ️ junto a "T. Más" que muestre: "Tarjeta Más de Salcobrand — disponible en sucursales y online." | Alto | Medio |
| 3 | v15-03 | **DonationBanner con opción de descarte temporal.** Agregar "No, gracias" que oculta el banner por 7 días (AsyncStorage). El banner actual aparece en prácticamente todos los medicamentos comunes. | Alto | Bajo |
| 4 | v15-04 | **Pantalla "Mis alertas"** accesible desde Home o desde un tab bar. El usuario necesita ver, editar y eliminar sus alertas sin recordar y buscar cada medicamento individualmente. | Alto | Medio |
| 5 | v15-05 | **Indicador de filtros activos en pantalla Results.** Cuando hay filtro de comuna o farmacia, mostrar un chip dismissible "📍 Providencia ×" sobre la lista para que el usuario siempre sepa qué restringe sus resultados. | Alto | Bajo |
| 6 | v15-06 | **accessibilityLabel en componentes críticos:** MedicationListItem, SkeletonCard (role=status, "Cargando medicamentos"), SearchBar ("Campo de búsqueda"), PriceHistoryChart (descripción textual de rango), DonationBanner, AlertSheet, FilterSheet toggles, InAppToast (accessibilityLiveRegion). | Alto | Medio |
| 7 | v15-07 | **Mensaje en primer snapshot de precio:** "Historial de precio disponible en tu próxima visita" para que el usuario descubra la feature y no la ignore. | Alto | Bajo |
| 8 | v15-08 | **Explicar "bioequivalente" in-context.** En la primera vez que el usuario ve el badge o el toggle, mostrar un tooltip: "Medicamento genérico con el mismo principio activo, aprobado por ISP. Generalmente más económico." | Medio | Bajo |
| 9 | v15-09 | **Comunicar el límite del carrito** de forma proactiva. Mostrar "Lista (5/8)" en el header del carrito y un toast explicativo si intenta superar el límite. | Medio | Bajo |
| 10 | v15-10 | **Mostrar qué medicamento falta** en la comparativa del carrito cuando una farmacia tiene cobertura parcial. | Medio | Medio |
| 11 | v15-11 | **Versión de la app** visible en la pantalla Acerca de. Fundamental para soporte técnico y reportes de bugs. | Medio | Bajo |
| 12 | v15-12 | **Renombrar o reestructurar la pantalla "Acerca de"**: separar la sección institucional real (versión, desarrollador, política de privacidad) del formulario de feedback, o al menos agregar esa información. | Medio | Bajo |
| 13 | v15-13 | **Fix DonationBanner dark mode:** adaptar fondo `rose-50` a `dark:bg-rose-900` para no ser agresivamente brillante en modo oscuro. | Medio | Bajo |
| 14 | v15-14 | **Toast de confirmación de alerta** con copy mejorado que gestione la expectativa de notificación. | Medio | Bajo |
| 15 | v15-15 | **"Ver en farmacia →" con confirmación** o mensaje "Abrirás el sitio de la farmacia en tu navegador." para que el usuario sepa que sale de la app. | Bajo | Bajo |

---

## 17. Mejoras v2.0 — Lista priorizada

Mejoras que requieren nuevas funcionalidades de backend, integraciones externas o cambios significativos de diseño o arquitectura.

| Prioridad | ID | Mejora | Impacto | Esfuerzo |
|-----------|----|--------|---------|----------|
| 1 | v20-01 | **Push notifications para alertas de precio.** La brecha más grande entre expectativa y realidad de la app. Implementar con `expo-notifications` y un job diario en el backend que busque medicamentos en alerta y envíe push si el precio bajó. Sin esto, la feature de alertas tiene valor muy limitado. | Muy alto | Alto |
| 2 | v20-02 | **Tab bar de navegación persistente.** Bottom tabs: 🔍 Buscar · ❤️ Favoritos · 🛒 Lista · 🔔 Alertas · ⚙️ Ajustes. Resuelve el problema de descubribilidad de todas las funcionalidades avanzadas a la vez. | Muy alto | Medio |
| 3 | v20-03 | **Filtro por stock.** Mostrar solo medicamentos con stock confirmado. El campo `hasStock` ya existe en el tipo; falta exponerlo como filtro en la UI. | Alto | Bajo |
| 4 | v20-04 | **Precio por unidad / precio por mg.** Mostrar el precio por comprimido o por mg para facilitar la comparación entre presentaciones (caja de 16 vs caja de 30). Requiere parsing adicional de la presentación. | Alto | Medio |
| 5 | v20-05 | **Mapa de sucursales de la farmacia más barata.** Después de encontrar el mejor precio, mostrar un mapa con las sucursales más cercanas al usuario. Requiere geolocalización (`expo-location`) e integración Maps. | Alto | Alto |
| 6 | v20-06 | **Búsqueda por principio activo con alternativas.** Si el usuario busca "Tafirol", mostrar también todos los medicamentos equivalentes con el mismo principio activo (paracetamol), ordenados por precio, con badge bioequivalente. | Alto | Medio |
| 7 | v20-07 | **Notificación de precio mínimo histórico.** Cuando el precio de un medicamento baja a su mínimo registrado, notificar proactivamente incluso sin alerta activa. | Alto | Alto |
| 8 | v20-08 | **Cuenta de usuario con sincronización en la nube.** Favoritos, alertas e historial son actualmente solo locales. Si el usuario cambia de teléfono, los pierde. Cuenta simple con magic link + sync en Supabase o Firebase. | Alto | Muy alto |
| 9 | v20-09 | **Compartir lista de compras.** Exportar el carrito como imagen o texto para compartir con un familiar: "Lista de Pedro: Paracetamol en Cruz Verde $3.490, Losartán en Salcobrand $8.200." | Medio | Bajo |
| 10 | v20-10 | **Widget de pantalla de inicio (Android/iOS).** Widget que muestre el precio actual de un medicamento favorito para personas que toman medicamentos crónicos. Requiere módulo nativo. | Medio | Muy alto |
| 11 | v20-11 | **Soporte iOS.** La app está solo en Google Play. Publicar en App Store ampliaría significativamente el alcance. Requiere Apple Developer ($99/año) + macOS + build iOS. | Muy alto | Alto |
| 12 | v20-12 | **Gamificación: resumen de ahorro acumulado.** Pantalla que muestre el ahorro total del usuario basado en su historial. Refuerza el valor percibido y el hábito de uso. | Medio | Medio |
| 13 | v20-13 | **Comparador directo entre 2 medicamentos.** Seleccionar dos presentaciones y ver precios lado a lado para decidir cuál conviene por dosis (ej: caja de 16 vs caja de 30 de paracetamol). | Medio | Alto |
| 14 | v20-14 | **Integración con recetas médicas (OCR).** El usuario fotografía su receta → la app extrae el nombre del medicamento y lanza la búsqueda. Requiere Google Vision o AWS Textract. | Medio | Muy alto |
| 15 | v20-15 | **Comunidad / reseñas de farmacias.** Usuarios pueden dejar una nota sobre la experiencia de compra en una sucursal específica (stock real, atención, filas). Agrega capa social que los competidores no tienen. | Medio | Muy alto |

---

*Revisión realizada el 2026-06-30. Basada en lectura completa de pantallas, componentes, stores y constantes de ComparaFarma v1.4.0. No se modificó código.*
