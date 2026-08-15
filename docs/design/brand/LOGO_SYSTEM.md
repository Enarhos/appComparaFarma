# LOGO_SYSTEM — Especificación Oficial del Sistema de Logotipo de ComparaFarma

Este documento no es un manual gráfico. No es un Brand Book. No es un documento de diseño. No dibuja, no propone tipografías, no define colores y no crea iconografía. Es la **especificación oficial de la estructura del sistema de logotipo**: qué componentes lo integran, cómo se combinan, cuándo corresponde usar cada combinación, y qué reglas gobiernan su uso y su evolución futura. Debe seguir siendo válido aunque, en el futuro, cambien el color, la tipografía o el contenido de un eventual Brand Book — porque no gobierna ninguna de esas tres cosas.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-LGO-001 |
| **Nombre** | LOGO_SYSTEM.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Brand Architect / Identity Systems Director / Enterprise Documentation Architect |
| **Nivel de Gobierno** | Estratégico — tercer grado de derivación: se apoya directamente en `docs/design/brand/DESIGN_CONCEPT.md` (segundo grado) y `docs/design/brand/VISUAL_IDENTITY.md` (primer grado), ambos derivados de `docs/design/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Arquitectura de Marca / Especificación de Sistema |
| **Fuente Oficial** | Este documento es la fuente oficial de la **estructura y reglas de gobierno** del sistema de logotipo. No es fuente de identidad (`BRAND_FOUNDATIONS.md`), de concepto (`DESIGN_CONCEPT.md`), de percepción visual (`VISUAL_IDENTITY.md`), ni de la geometría concreta del isotipo (entregable de construcción del Candidato 09, auditado en `docs/design/BRAND_IDENTITY_VALIDATION.md`) |
| **Documentos de los que depende** | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/design/DESIGN_BRIEF.md`, `docs/design/decisions/DESIGN_DECISION_LOG.md`, `docs/design/BRAND_IDENTITY_VALIDATION.md`, `docs/product/PRODUCT_DEFINITION_v1.0.md`, `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía de forma directa. Debería gobernar toda futura decisión de aplicación del logotipo en `LOGO_APPLICATION` / `BRAND_GUIDELINES` (no existen aún), y condiciona estructuralmente a `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM` e `ICONOGRAPHY` en la medida en que esos documentos deban componer su materia (color, tipografía) sobre los componentes aquí definidos (isotipo, wordmark, logotipo completo) |
| **Pregunta que responde** | ¿Cómo está compuesto el sistema oficial del logotipo de ComparaFarma y cuáles son las reglas que gobiernan su utilización y evolución? |

---

## 2. Propósito

Este documento existe para que ninguna decisión futura sobre el logotipo de ComparaFarma —qué variante usar, cómo debe reducirse, qué transformaciones están prohibidas— dependa de la memoria de quien lo diseñó o de una convención implícita. Es, dentro del gobierno de marca, la autoridad documental sobre la **estructura** del sistema de logotipo: no decide su forma final, su color ni su tipografía (eso corresponde a otros documentos, algunos todavía no creados), pero sí decide de qué piezas se compone ese sistema, cómo se relacionan entre sí, y qué reglas no pueden romperse sin aprobación formal.

Esta distinción entre estructura y estética es deliberada y es el criterio de éxito de este documento: dentro de cinco años, cuando `COLOR_SYSTEM.md` y `TYPOGRAPHY_SYSTEM.md` existan y evolucionen, y cuando eventualmente exista un `BRAND_GUIDELINES.md` con ejemplos gráficos, este documento debería seguir siendo válido sin modificación, porque ninguno de esos cambios afecta la arquitectura que aquí se define.

---

## 3. Alcance

**Este documento define:**

- Los principios del sistema de logotipo, consolidados sin invención desde `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` y `DESIGN_BRIEF.md` (§4.1).
- Los componentes formales del sistema — isotipo, wordmark, logotipo completo, logo responsivo — y el rol de cada uno (§4.2).
- Las variantes oficiales mínimas de arquitectura del logotipo y cuándo corresponde usar cada una (§4.3).
- La relación de este documento con la especificación de construcción geométrica del isotipo, sin duplicarla (§4.4).
- Las versiones de reproducción permitidas (§4.5).
- Las restricciones de uso — qué transformaciones y usos indebidos quedan prohibidos sin aprobación formal (§4.6).
- Las reglas de transición entre variantes según el canal y el espacio disponible (§4.7).
- Principios de movimiento aplicables a cualquier animación futura del logotipo, sin crear ninguna (§4.8).

**Este documento NO define:**

- La forma, geometría, proporciones exactas, radios, compensaciones ópticas, módulos, área de seguridad ni tamaño mínimo en píxeles del isotipo. Eso pertenece exclusivamente al entregable de construcción del Candidato 09, hoy en estado "Aprobar con ajustes" según `docs/design/BRAND_IDENTITY_VALIDATION.md` (§4.4 de este documento).
- Ningún color, código cromático ni paleta. Corresponde a `COLOR_SYSTEM`, todavía no creado.
- Ninguna tipografía, familia tipográfica ni especificación de wordmark tipográfico. Corresponde a `TYPOGRAPHY_SYSTEM`, todavía no creado.
- Ninguna iconografía secundaria (favoritos, historial, alertas, etc.). Corresponde a `ICONOGRAPHY`, todavía no creado; `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-007) ya señaló que el isotipo, por sí solo, no resuelve un sistema de iconografía derivado.
- Ningún manual gráfico con ejemplos visuales, mockups o casos de aplicación ilustrados. Corresponde a un futuro `BRAND_GUIDELINES.md`, todavía no creado.
- Ninguna decisión de identidad, concepto o percepción visual ya tomada en `BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md` o `DESIGN_CONCEPT.md`. Este documento no las reinterpreta ni las repite; las consolida por referencia donde es necesario y remite a la fuente para todo lo demás.

---

## 4. Contenido principal

### 4.1 Principios del Sistema

Consolidados sin agregar ninguno nuevo, desde las tres fuentes ya aprobadas. Cada principio conserva su cita de origen.

| Principio | Fuente | Aplicación específica al sistema de logotipo |
|---|---|---|
| Claridad | `BRAND_FOUNDATIONS.md` §11.1, Principio IV; `VISUAL_IDENTITY.md` §4.2 | El sistema no debe requerir explicación para distinguir sus componentes ni sus variantes |
| Simplicidad | `BRAND_FOUNDATIONS.md` §11.2; `VISUAL_IDENTITY.md` §4.2 | Cada componente (§4.2) tiene un rol único y no redundante dentro del sistema |
| Confianza | `BRAND_FOUNDATIONS.md` §11.1, Principio II; `VISUAL_IDENTITY.md` §4.2 | La consistencia del sistema entre canales es, en sí misma, una forma de sostener la promesa de marca única |
| Memorabilidad | `DESIGN_BRIEF.md` §4.13 (criterio de evaluación, 10%) | Justifica por qué el sistema necesita una variante "Solo isotipo" que funcione de forma autónoma para reconocimiento repetido (§4.2.1, §4.3) |
| Independencia del color | `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-002 ("el símbolo nunca dependió de color; su condición nativa es de una sola tinta") | El sistema de logotipo debe funcionar íntegramente en ausencia de `COLOR_SYSTEM` (§4.5) |
| Digital first | `DESIGN_BRIEF.md` §4.11 ("debe priorizar legibilidad en pantallas pequeñas — el producto es de uso móvil intensivo"), §4.12 (escenarios multiplataforma) | Fundamenta la exigencia de un Responsive Logo (§4.2.4, §4.7) en lugar de una sola forma fija |
| Escalabilidad | `DESIGN_BRIEF.md` §4.13 (criterio de evaluación, 12%); `BRAND_IDENTITY_VALIDATION.md`, BV-001 y BV-007 | El sistema debe seguir funcionando al incorporar nuevos canales o productos, coherente con el modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1) |
| Atemporalidad | `DESIGN_BRIEF.md` §4.13 (criterio de evaluación, 5%); `BRAND_IDENTITY_VALIDATION.md`, BV-008 (clasificación "Alta") | Fundamenta directamente las restricciones de uso contra efectos y tendencias gráficas pasajeras (§4.6) |

### 4.2 Componentes del Sistema

#### 4.2.1 Isotipo

Símbolo gráfico autónomo de la marca — hoy, el Candidato 09, en estado **"Aprobar con ajustes"** según `docs/design/BRAND_IDENTITY_VALIDATION.md`. Bajo el modelo Branded House ya confirmado (`BRAND_ARCHITECTURE.md` §4.1: un solo nombre cubre empresa, plataforma y todos los canales), el isotipo es **complementario, no obligatorio**: el logotipo del sistema debe poder funcionar de forma autónoma sin él, exigencia ya declarada en `DESIGN_BRIEF.md` §4.11. Su rol es servir de identificador abreviado en contextos de espacio reducido o de reconocimiento repetido, no de sustituto permanente del nombre de marca.

#### 4.2.2 Wordmark

La palabra "ComparaFarma" expresada tipográficamente, sin isotipo. Bajo Branded House, el wordmark es el componente que, por sí solo, debe poder representar completamente la marca en cualquier contexto donde el espacio lo permita — consistente con que "ComparaFarma" es el único nombre que cubre empresa, plataforma y canales (`BRAND_ARCHITECTURE.md` §4.2). Su especificación tipográfica exacta no existe todavía (`TYPOGRAPHY_SYSTEM`, pendiente); este documento declara únicamente su rol estructural dentro del sistema, no su forma.

#### 4.2.3 Logotipo Completo

La combinación de isotipo y wordmark en una relación de composición fija. Es la expresión primaria y preferente del sistema en los canales donde el espacio disponible permite ambos componentes — los mismos ya confirmados en `VISUAL_IDENTITY.md` §4.5 (Google Play, aplicación móvil, sitio web, landing, redes sociales, presentaciones, documentación, material institucional).

#### 4.2.4 Responsive Logo

No es una forma adicional: es el conjunto de reglas (§4.7) que determina cuál de los tres componentes anteriores, o qué combinación de ellos, corresponde usar según el espacio, el tamaño y el canal disponibles. Existe para resolver una exigencia funcional ya declarada en `DESIGN_BRIEF.md` §4.12: si el sistema dependiera solo del logotipo completo con el nombre extendido, no podría cumplir los formatos por debajo de 48px (favicon, ícono de sistema, avatar) sin una solución adicional de símbolo o monograma.

### 4.3 Arquitectura del Logotipo

Variantes oficiales mínimas del sistema. Ninguna se dibuja aquí; se define únicamente su composición y su condición de uso.

| Variante | Composición | Cuándo corresponde usarla |
|---|---|---|
| **Horizontal** | Isotipo + wordmark, dispuestos en línea | Uso preferente en cabeceras, encabezados web, documentos y material institucional: contextos donde el ancho disponible supera al alto |
| **Vertical** | Isotipo sobre wordmark, apilados | Contextos donde el alto disponible supera al ancho: pantallas de carga, presentaciones en formato retrato, empaques verticales de merchandising |
| **Solo isotipo** | Isotipo únicamente | Contextos de espacio extremadamente reducido o de reconocimiento ya establecido: favicon, App Icon, avatar de redes sociales, notificaciones — condicionado a que el isotipo alcance aprobación definitiva (ver §4.4) |
| **Solo wordmark** | Wordmark únicamente | Contextos formales o de primer contacto donde la legibilidad del nombre importa más que la identificación simbólica rápida: encabezados institucionales, documentos legales, o cualquier contexto donde el isotipo aún no genere reconocimiento suficiente |
| **Responsive** | No es una forma fija — es la regla de transición entre las cuatro anteriores | Se aplica siempre que el mismo activo de marca deba adaptarse a más de un tamaño o canal dentro de un mismo recorrido de usuario (ver §4.7) |

### 4.4 Construcción

Este documento **no duplica** el plano de construcción geométrica del isotipo. La geometría, las proporciones, las compensaciones ópticas, los módulos, el área de seguridad y el tamaño mínimo en píxeles pertenecen, en su totalidad, al entregable de construcción del Candidato 09 — no a este documento.

Esa especificación de construcción se encuentra, a la fecha, auditada y en estado **"Aprobar con ajustes"** (`docs/design/BRAND_IDENTITY_VALIDATION.md`, Conclusión), con cuatro ajustes pendientes: validación de renderizado real en tamaños mínimos, elevación del área de seguridad a regla obligatoria para íconos con máscara de recorte variable, testeo de percepción sobre el riesgo de asociación categórica con "marcador de posición/mapas", y definición de reglas de iconografía derivada. Este documento puede fijar la **estructura** del sistema de logotipo (§4.2, §4.3) sin esperar a que esos ajustes se resuelvan, porque ninguno de ellos altera cuántos componentes tiene el sistema ni cómo se combinan — pero ninguna variante que use el isotipo (§4.2.1) puede considerarse de aplicación definitiva hasta que esos ajustes se resuelvan y la construcción del Candidato 09 se apruebe sin condiciones.

### 4.5 Versiones Permitidas

Las únicas versiones oficiales de reproducción del sistema de logotipo, consistentes con `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-002):

- **Positivo** (trazo oscuro sobre fondo claro).
- **Negativo** (trazo claro sobre fondo oscuro) — con la observación ya registrada en BV-002: requiere un fondo con borde definido para no perder el límite del símbolo.
- **Monocromo** (una sola tonalidad, sin variación de valor).
- **Una tinta** (reproducción física en un solo color de impresión).

Ninguna otra versión —incluida cualquier aplicación de color una vez que exista `COLOR_SYSTEM`, cualquier textura, degradado o tratamiento fotográfico— es oficial por defecto. Toda versión adicional requiere aprobación formal explícita antes de su uso, siguiendo el mismo criterio de gobierno ya aplicado en el resto de `docs/brand/`.

### 4.6 Restricciones de Uso

Se documentan los usos indebidos; no se ilustran. Ningún uso de la siguiente lista está permitido sin aprobación formal explícita:

- Deformación del logotipo completo o de cualquiera de sus componentes (alteración de la proporción horizontal/vertical).
- Rotación del isotipo, el wordmark o el logotipo completo respecto de su orientación oficial.
- Cambio de las proporciones relativas entre isotipo y wordmark en la variante horizontal o vertical.
- Cambio del vano del anillo del isotipo (ángulo, posición o apertura), definido exclusivamente en la especificación de construcción referenciada en §4.4.
- Desplazamiento del punto central del isotipo fuera del eje de simetría definido en esa misma especificación.
- Aplicación de efectos: sombras, degradados, texturas, biselados o brillos.
- Adición de contornos no contemplados en la especificación oficial.
- Reconstrucción manual del isotipo a partir de una aproximación visual, en lugar de los archivos o la especificación oficial de construcción.

Esta lista no es una preferencia estética: es consecuencia directa de los principios de Simplicidad y Atemporalidad ya consolidados (§4.1). `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-008) clasificó la longevidad del isotipo como "Alta" precisamente por la ausencia de gradientes, sombras o texturas en su construcción — permitir esos efectos en el uso cotidiano del sistema revertiría esa misma conclusión.

### 4.7 Responsive Logo — Reglas de Transición

Principios de transición entre variantes según el espacio disponible, sin definir umbrales exactos en píxeles (esos umbrales dependen del tamaño mínimo fijado en la especificación de construcción, §4.4):

- **Logo completo → Logo reducido:** cuando el espacio se reduce pero aún permite ambos componentes (isotipo + wordmark), ambos se escalan de forma proporcional conjunta; no se recorta ni se omite ningún componente todavía.
- **Logo reducido → Solo isotipo:** cuando el espacio disponible cae por debajo del umbral de legibilidad del wordmark (definido operativamente por el tamaño mínimo del isotipo en la especificación de construcción), el sistema transiciona a la variante "Solo isotipo" en su versión adaptada para tamaños mínimos — nunca a un logotipo completo reducido más allá de su umbral de legibilidad.
- **Caso inverso — Solo wordmark:** en contextos donde el isotipo no alcanza su tamaño mínimo legible pero sí existe espacio horizontal suficiente para el texto (por ejemplo, un encabezado angosto pero largo), el sistema usa la variante "Solo wordmark" en lugar de forzar un isotipo ilegible.
- **Favicons y App Icons:** usan exclusivamente la variante "Solo isotipo" en su versión de tamaño mínimo ya prevista en la especificación de construcción — nunca el logotipo completo reducido, coherente con la exigencia funcional de `DESIGN_BRIEF.md` §4.12.
- **Avatares de redes sociales:** misma regla que favicons/App Icons, sujeta además al ajuste pendiente de área de seguridad para máscaras de recorte variable (`docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-003) antes de su aplicación definitiva.

### 4.8 Motion Principles

No se crea ninguna animación. Se definen únicamente los principios que deberá respetar cualquier animación futura del sistema de logotipo:

- **Continuidad:** toda transición del isotipo debe partir y llegar a estados ya contemplados en la especificación de construcción (§4.4); ninguna animación puede introducir una forma intermedia no definida en esa especificación.
- **Suavidad:** las transiciones deben evitar cambios abruptos de opacidad o escala, coherentes con la emoción objetivo "Tranquilidad" ya declarada en `DESIGN_BRIEF.md` §4.7.
- **Economía de movimiento:** el sistema se anima solo cuando el movimiento comunica algo — coherente con el principio de UX ya consolidado en `VISUAL_IDENTITY.md` §4.6 de no capturar la atención del usuario de forma decorativa o manipuladora.
- **Consistencia:** todo uso animado del isotipo debe emplear el mismo repertorio de movimiento en todos los canales, para no fragmentar la percepción de marca única que exige el modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1).

Estos principios se apoyan en un hallazgo ya registrado en la auditoría de calidad: `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-007) identificó que el vano del isotipo "ofrece un punto natural de animación (cierre del anillo, punto entrando desde el vano) coherente con momentos reales de la app" — este documento reconoce ese potencial sin diseñar la animación misma.

---

## 5. Relaciones

`LOGO_SYSTEM.md` depende, en cadena, de toda la Arquitectura de Marca ya construida: `BRAND_FOUNDATIONS.md` (identidad), `BRAND_ARCHITECTURE.md` (modelo Branded House, que determina por qué el wordmark debe poder funcionar solo y por qué el isotipo es complementario), `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md` (principios y concepto), y `DESIGN_BRIEF.md` (encargo de diseño y criterios de evaluación). Depende también, de forma directa y condicionante, de `docs/design/BRAND_IDENTITY_VALIDATION.md`, cuyo resultado ("Aprobar con ajustes") es la razón por la que este documento puede fijar estructura sin poder declarar el sistema como plenamente operativo (§4.4).

Su responsabilidad específica dentro de la Arquitectura de Marca es distinta a la de cada uno de esos documentos: ninguno de ellos define cuántos componentes tiene el sistema de logotipo, cómo se combinan, ni qué transformaciones están prohibidas. `LOGO_SYSTEM.md` es el primer documento del repositorio que responde esa pregunta específica de estructura, sin resolver todavía color ni tipografía.

**Observación de gobierno:** `docs/design/decisions/DESIGN_DECISION_LOG.md` registra hoy únicamente la decisión DD-001 (concepto central "Orientación"). No existe, a la fecha, una fila DD-002 a DD-005 que registre formalmente la aprobación del proceso de exploración, refinamiento y construcción del Candidato 09 como isotipo oficial — esa cadena de decisiones se documentó como entregables de proceso y, en su etapa final, como la auditoría `BRAND_IDENTITY_VALIDATION.md`, pero no como filas de `DESIGN_DECISION_LOG.md`. Este documento no corrige esa omisión por no estar dentro de su alcance (§3), pero la señala como pendiente de gobierno: `DESIGN_DECISION_LOG.md` exige que "ninguna fila puede aprobarse sin una columna 'Documento fuente' verificable" (§7 de ese documento), y hoy esa fuente existe (`BRAND_IDENTITY_VALIDATION.md`) sin que la fila correspondiente se haya creado todavía.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Principios de marca y percepción visual | `docs/design/brand/BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` | ✔ — aplicados al sistema de logotipo (§4.1) | Ningún principio nuevo agregado |
| Criterios de evaluación (memorabilidad, escalabilidad, atemporalidad) | `docs/design/DESIGN_BRIEF.md` §4.13 | ✔ — usados como principios del sistema (§4.1) | — |
| Modelo de marca única (Branded House) | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.1, §4.2 | ✔ — fundamenta el rol del wordmark y el carácter complementario del isotipo (§4.2) | — |
| Exigencia de Responsive Logo / legibilidad multiplataforma | `docs/design/DESIGN_BRIEF.md` §4.11, §4.12 | ✔ — fundamenta §4.2.4, §4.3, §4.7 | — |
| Geometría, proporciones, área de seguridad, tamaño mínimo del isotipo | Entregable de construcción del Candidato 09 (no archivado como documento independiente) | Referenciado, no duplicado (§4.4) | Pendiente: archivar formalmente la especificación de construcción si el candidato se aprueba sin condiciones |
| Estado de aprobación del isotipo y riesgos identificados | `docs/design/BRAND_IDENTITY_VALIDATION.md` | ✔ — condiciona §4.2.1, §4.3, §4.4, §4.7 | Estado "Aprobar con ajustes"; cuatro ajustes pendientes |
| Versiones de contraste permitidas (positivo/negativo/monocromo/una tinta) | `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-002 | ✔ (§4.5) | — |
| Potencial de motion del isotipo | `docs/design/BRAND_IDENTITY_VALIDATION.md`, BV-007 | ✔ — fundamenta §4.8 sin diseñar la animación | — |
| Decisión formal de adopción del Candidato 09 como isotipo oficial | `docs/design/decisions/DESIGN_DECISION_LOG.md` | No consolidado — fila DD-002/DD-005 no existe todavía | Ver observación de gobierno en §5 |
| Color, tipografía, iconografía | — (documentos no creados todavía) | No consolidado — declarado explícitamente fuera de alcance (§3) | Pendiente de `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY` |

---

## 7. Gobierno

`LOGO_SYSTEM.md` **no reemplaza**:

- `docs/design/brand/BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md` — siguen siendo la única fuente de identidad, arquitectura de marca, principios de percepción y concepto de diseño.
- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y de los criterios de evaluación de propuestas.
- `docs/design/BRAND_IDENTITY_VALIDATION.md` — sigue siendo la única fuente del resultado de auditoría de calidad del isotipo y de sus ajustes pendientes.
- La especificación de construcción del Candidato 09 — sigue siendo la única fuente de geometría, proporciones, compensaciones ópticas, módulos, área de seguridad y tamaño mínimo (§4.4).

La responsabilidad específica de `LOGO_SYSTEM.md` dentro de la Arquitectura de Marca es gobernar exclusivamente la **estructura** del sistema de logotipo: sus componentes, sus variantes oficiales, sus reglas de transición responsive, sus restricciones de uso y sus principios de movimiento. No gobierna, y no debe absorber en ninguna revisión futura, decisiones de color, tipografía, iconografía o manual gráfico — esa frontera es una restricción deliberada de alcance (§3), consistente con el criterio de éxito declarado en §2: este documento debe seguir siendo válido aunque cambien el color, la tipografía o el contenido de un futuro Brand Book.

Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente en el resto de `docs/brand/`.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.** Adicionalmente, ninguna variante que use el isotipo (§4.2.1, §4.3) debe considerarse de aplicación definitiva hasta que se resuelvan los cuatro ajustes pendientes de `docs/design/BRAND_IDENTITY_VALIDATION.md` y se registre formalmente, en `docs/design/decisions/DESIGN_DECISION_LOG.md`, la decisión de adopción del Candidato 09 (ver observación de gobierno en §5).

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/BRAND_ARCHITECTURE.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/DESIGN_CONCEPT.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/design/decisions/DESIGN_DECISION_LOG.md`
- `docs/archive/design/explorations/DESIGN_EXPLORATION.md`
- `docs/design/BRAND_IDENTITY_VALIDATION.md`
- `docs/product/PRODUCT_DEFINITION_v1.0.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

Documentos que, una vez creados, dependerán estructuralmente de este documento: `COLOR_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY.md`, `BRAND_GUIDELINES.md`, `GOOGLE_PLAY_ASSETS.md`, `MARKETING_GUIDELINES.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define la especificación oficial de estructura del sistema de logotipo: principios del sistema, componentes (isotipo, wordmark, logotipo completo, responsive logo), variantes oficiales de arquitectura, referencia a la especificación de construcción sin duplicarla, versiones de reproducción permitidas, restricciones de uso, reglas de transición responsive y principios de movimiento. No define color, tipografía, iconografía ni manual gráfico. Señala como pendiente de gobierno la ausencia de una fila formal en `DESIGN_DECISION_LOG.md` que registre la adopción del Candidato 09. | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `BRAND_ARCHITECTURE.md` v1.0; `VISUAL_IDENTITY.md` v1.0; `DESIGN_CONCEPT.md` v1.0; `docs/design/DESIGN_BRIEF.md` v1.0; `docs/design/decisions/DESIGN_DECISION_LOG.md` v1.0; `docs/design/BRAND_IDENTITY_VALIDATION.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/design/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-06 | Redacción del Design Brief oficial de identidad visual | Creative Director / Brand Strategist / Design Director | `docs/design/DESIGN_BRIEF.md` v1.0 |
| 2026-08-05 | Exploración, refinamiento y construcción geométrica del isotipo | Senior Identity Designer (criterio Pentagram) | Candidato 09 — especificación de construcción (entregable de proceso, no archivado) |
| 2026-08-05 | Auditoría de calidad de identidad de marca | Brand Quality Director (criterio Pentagram / Wolff Olins / DesignStudio) | `docs/design/BRAND_IDENTITY_VALIDATION.md` v1.0 — recomendación: Aprobar con ajustes |
| 2026-08-05 | Definición de la especificación oficial del sistema de logotipo | Brand Architect / Identity Systems Director / Enterprise Documentation Architect | `docs/design/brand/LOGO_SYSTEM.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Adicionalmente, quedan pendientes: (1) la resolución de los cuatro ajustes de `docs/design/BRAND_IDENTITY_VALIDATION.md`, y (2) el registro formal en `docs/design/decisions/DESIGN_DECISION_LOG.md` de la decisión de adopción del Candidato 09 como isotipo oficial — ninguna de las dos cosas bloquea la validez estructural de este documento, pero ambas condicionan la aplicación definitiva de cualquier variante que use el isotipo.
