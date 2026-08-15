# FEATURE_GRAPHIC_SPEC_V1 — Especificación Oficial del Feature Graphic de Google Play (ComparaFarma v1.0)

Este documento no diseña, no genera imágenes y no crea ningún concepto gráfico nuevo. Es la **especificación de diseño** que describe, componente por componente, cómo debe construirse el Feature Graphic oficial de Google Play para la primera publicación de Producción de ComparaFarma, reutilizando exclusivamente la identidad visual ya aprobada (DD-002, DD-003 en `docs/design/DESIGN_DECISION_LOG.md`). Ningún elemento de este documento requiere una decisión de diseño nueva — donde algo no está ya definido en la identidad aprobada, este documento lo señala como pendiente en lugar de inventarlo.

Sigue, en lo aplicable, la disciplina de trazabilidad ya usada en `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`: cada afirmación cita su fuente.

**Ajuste editorial (2026-08-08, GO LIVE 1.0 — Asset Packaging Sprint):** el CTO aprobó esta especificación como base oficial de Producción, condicionado a un ajuste de copy (§5): eliminar cifras, montos de ahorro y la mención "9 farmacias", aplicando exactamente el mismo criterio editorial ya usado en las Release Notes (Acción 4) — el mensaje debe describir beneficios permanentes, no datos que cambian con el tiempo. Este ajuste **no modifica** el layout, la identidad, la composición ni ningún componente de §3-§4 — solo el texto de §5 y sus referencias cruzadas en §1 y §8.

---

## Contexto y alcance de esta Task

- La fase de Identidad Visual está cerrada (DD-002, 2026-08-06).
- El isotipo Candidato 09 se adopta como base oficial de Producción v1.0 (DD-003, 2026-08-08), con 4 ajustes pendientes que siguen abiertos y no bloquean esta Task.
- Esta Task **no** rediseña la identidad, **no** crea un nuevo concepto gráfico, **no** modifica la dirección visual "Intelligence" ya aprobada, y **no** genera la imagen final — solo su especificación de diseño.

---

## Auditoría previa — documentos y assets revisados

| Documento / asset | Qué aporta a esta especificación |
|---|---|
| `docs/design/BRAND_EXPERIENCE_V1.md` | Fuente de los valores concretos ya aplicados: paleta HEX (§1), escala tipográfica Inter (§2), copy del Hero de Home ya validado (§3.1), y la nota de que el isotipo Candidato 09 está "aplicado sin rediseñar" (encabezado). |
| `docs/brand/LOGO_SYSTEM.md` | Reglas de uso del isotipo (§4.5 versiones permitidas, §4.6 restricciones — nada de sombras, degradados, rotación, deformación) y su estado "Aprobar con ajustes" (§4.4). |
| `docs/brand/COLOR_SYSTEM.md` | Principio de Neutralidad (§4.5): ningún color puede sugerir que ComparaFarma "recomienda" una farmacia o simule un juicio de valor no calculado por el sistema. Aplica directamente a cualquier resalte de precio en el Feature Graphic. |
| `docs/brand/TYPOGRAPHY_SYSTEM.md` | Arquitectura de capas (§4.2: Display, Heading, Body, Caption, Data/Numeric) y filosofía de pesos (§4.4) — usada para mapear qué capa corresponde a cada texto del Feature Graphic. |
| `docs/design/DESIGN_DECISION_LOG.md` | DD-001 (concepto "Orientación"), DD-002 (cierre de fase, congela Brand Experience v1), DD-003 (adopción de Candidato 09 con riesgo aceptado). |
| `docs/release/GRAPHIC_ASSETS_INVENTORY_V1.md` | Confirma que el Feature Graphic es el único activo de la Sección 3 del inventario **sin** pieza base aprobada — de ahí la necesidad de esta especificación antes de producir el gráfico. |
| `docs/design/assets/brand-experience/09_app_icon.png` | Isotipo Candidato 09 aplicado — fuente del isotipo a reutilizar. |
| `docs/design/assets/brand-experience/10_splash.png` | Referencia adicional de aplicación de marca sobre fondo de color sólido. |
| `docs/design/assets/brand-experience/02_home_mobile.png` | Fuente del mockup de teléfono y del copy exacto ya validado ("Ahorra hasta $4.200 en tus medicamentos", "9 farmacias · Sin publicidad · Imparcial", bloque "Ejemplo real"). |
| `docs/design/assets/brand-experience/03_search.png`, `04_results.png`, `05_medication_detail.png` | Referencia de lenguaje visual de tarjetas, badges y jerarquía de precio, por si el mockup de teléfono usado en el Feature Graphic muestra la pantalla de Resultados en lugar de la Home. |

**No asumido, señalado como pendiente:** ninguna de las piezas anteriores es, en sí misma, un feature graphic (1024×500). Esta especificación combina elementos ya aprobados de varias piezas — no inventa ninguno nuevo.

---

## 1. Objetivo

El Feature Graphic no vende funcionalidades — comunica la propuesta de valor central de ComparaFarma, ya validada en `BRAND_EXPERIENCE_V1.md` §3.1 (rationale UX-001) y consistente con `docs/brand/BRAND_FOUNDATIONS.md` §14 ("conocer, en pocos segundos, dónde un medicamento tiene el mejor precio").

Debe comunicar, en el orden de prioridad exacto ya validado para la Home (§3.1 de `BRAND_EXPERIENCE_V1.md`, "Respuesta a los cinco criterios de éxito"):

1. Qué hace ComparaFarma — compara precios de medicamentos en un solo lugar.
2. Por qué debería usarla — beneficios permanentes del producto (favoritos, alertas, historial, lista de compras), no una cifra de ahorro puntual que pueda quedar desactualizada.
3. Por qué confiar en ella — neutralidad: gratis, sin registro obligatorio, imparcial.

No debe transmitir urgencia, alarma ni presión de compra — restricción ya vigente en `docs/design/DESIGN_BRIEF.md` §4.10 contra "elementos de urgencia agresiva", aplicable a cualquier pieza de marca, incluida esta.

---

## 2. Especificación técnica

Requisito de Google Play, verificado en `docs/release/GRAPHIC_ASSETS_INVENTORY_V1.md` §1 contra la documentación oficial de Play Console:

| Propiedad | Valor |
|---|---|
| Dimensiones | 1024 × 500 px |
| Formato | PNG |
| Canal alfa | Sin canal alfa (24-bit) |
| Peso máximo | Sin límite específico documentado para este activo más allá del formato — usar el criterio general de optimización web/tienda |

---

## 3. Componentes

Cada componente se define exclusivamente a partir de la identidad ya aprobada. Donde no existe una decisión aprobada específica, se señala como pendiente en lugar de definirse aquí.

| Componente | Especificación | Fuente |
|---|---|---|
| **Isotipo** | Candidato 09, sin modificar — mismo trazo, mismo punto central, ninguna de las transformaciones prohibidas en `LOGO_SYSTEM.md` §4.6 (sin sombras, degradados, rotación, deformación, efectos). Se usa en su versión "Solo isotipo" o "Horizontal" (isotipo + wordmark), según el espacio disponible junto al resto de los componentes — ver §4.3 de `LOGO_SYSTEM.md`. | `docs/design/assets/brand-experience/09_app_icon.png`; `docs/brand/LOGO_SYSTEM.md` §4.3, §4.6 |
| **Logotipo** | Wordmark "ComparaFarma" en Inter, mismo tratamiento tipográfico ya usado en el header de los mockups de Home/Búsqueda/Resultados (peso Bold/SemiBold sobre fondo claro en esos mockups; sobre el fondo de color de este Feature Graphic, ver Color de fondo más abajo). | `docs/design/assets/brand-experience/02_home_mobile.png`, `04_results.png` (header); `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.2.1 (capa Display/Heading) |
| **Color de fondo** | Debe partir de la paleta ya aprobada en `BRAND_EXPERIENCE_V1.md` §1 (Brand Indigo `#3F3FB8`, o su derivado Indigo oscuro `#2E2E8C`). **Pendiente de decisión puntual:** cuál de los dos (o un degradado entre ambos, si se considera consistente con las restricciones de `LOGO_SYSTEM.md` §4.6 sobre el isotipo — el degradado estaría prohibido *sobre el isotipo*, no necesariamente sobre el fondo general de la pieza) — esta decisión puntual de composición queda para quien produzca el gráfico, dentro de los dos valores ya aprobados, sin introducir un tercer color. | `docs/design/BRAND_EXPERIENCE_V1.md` §1 |
| **Tipografía** | Inter, única familia ya aprobada (`BRAND_EXPERIENCE_V1.md` §2). Título en capa Display (700), subtítulo/mensajes secundarios en capa Body o Caption (400) según jerarquía — ver §4 de este documento. | `docs/brand/TYPOGRAPHY_SYSTEM.md` §4.2; `BRAND_EXPERIENCE_V1.md` §2 |
| **Mockup del teléfono** | Recorte de uno de los mockups ya aprobados y congelados en Brand Experience v1: `02_home_mobile.png` (Home, con el bloque "Ejemplo real" ya visible) o `04_results.png` (Resultados). No se genera una pantalla nueva — se reutiliza el encuadre ya existente, recortado al área relevante para que sea legible en 500px de alto. | `docs/design/assets/brand-experience/02_home_mobile.png`, `04_results.png` |
| **Imágenes de pantalla** | Las mismas que ya aparecen dentro del mockup elegido — el bloque "Ejemplo real" (Paracetamol 500mg x20, Cruz Verde $1.990 "Mejor precio" vs. EasyFarma $2.490, "Ahorras $500") si se usa Home, o las primeras 2-3 tarjetas de resultado si se usa Resultados. No se inventa un caso nuevo — se reutiliza exactamente el ejemplo ya validado en `BRAND_EXPERIENCE_V1.md` §3.1. | `docs/design/assets/brand-experience/02_home_mobile.png` |
| **Iconografía secundaria** | Ninguna adicional a la ya visible dentro del mockup recortado (lupa de búsqueda, check de confianza, badge "Mejor precio"). No se agrega iconografía nueva — `docs/brand/ICONOGRAPHY_SYSTEM.md` no fue revisado como parte de esta Task porque el alcance no lo requiere: ningún ícono nuevo se introduce. | `docs/design/assets/brand-experience/02_home_mobile.png` |
| **Llamadas de valor (texto)** | Ver §5 — Copy actualizado (2026-08-08) para eliminar cifras, montos de ahorro y la mención "9 farmacias", aplicando el mismo criterio editorial ya usado en las Release Notes. Ya no es el copy literal del Hero de Home — es una adaptación bajo ese mismo criterio de beneficios permanentes; el Hero de Home en la app (`BRAND_EXPERIENCE_V1.md` §3.1) no se modifica, este ajuste es exclusivo de la ficha de Play Store. | `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4 (mismo criterio editorial) |

---

## 4. Jerarquía visual

Orden de lectura esperado, de arriba/izquierda hacia abajo/derecha (lectura occidental estándar, sin una regla de marca específica sobre dirección de lectura — extensión operativa razonable):

```
Isotipo + Logotipo (marca)
        ↓
Título — beneficio principal ("Compara precios de medicamentos en un solo lugar")
        ↓
Subtítulo — confianza/contexto ("Gratis · Sin registro obligatorio · 100% imparcial")
        ↓
Mockup del teléfono (con el bloque de comparación ya visible dentro de la pantalla, sin cambios)
        ↓
Mensajes secundarios (si el espacio horizontal restante lo permite, junto o debajo del mockup)
```

Esto replica exactamente la secuencia ya validada para la Home en `BRAND_EXPERIENCE_V1.md` §3.1 ("promesa → buscador → confianza → prueba"), adaptada al formato apaisado 1024×500 (marca → beneficio → mockup como prueba, en lugar de vertical). No se propone una jerarquía nueva — se traspone la ya aprobada a un formato distinto.

No se especifican coordenadas ni proporciones exactas — es una decisión de composición dentro del formato, no una decisión de identidad, y queda para quien produzca el gráfico.

---

## 5. Copy

**Versión 2 (2026-08-08) — ajuste editorial por instrucción directa del CTO.** La versión 1 de este copy reutilizaba literalmente el Hero de Home (`BRAND_EXPERIENCE_V1.md` §3.1), que incluye una cifra de ahorro ("$4.200") y la cantidad de farmacias ("9 farmacias"). El CTO instruyó eliminar ambos tipos de contenido, aplicando exactamente el mismo criterio editorial ya aprobado para las Release Notes (Acción 4, `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4): el mensaje debe describir beneficios permanentes del producto, no datos que cambian con el tiempo (cantidad de farmacias en el catálogo, cifras de ahorro puntuales). Esto no reabre `BRAND_EXPERIENCE_V1.md` ni el Hero de Home real de la app — es un ajuste exclusivo de esta pieza de Play Store.

- **Título principal:** "Compara precios de medicamentos en un solo lugar."
- **Subtítulo:** "Gratis. Sin registro obligatorio. 100% imparcial."
- **Mensajes secundarios (máximo tres, beneficios permanentes del producto, sin cifras ni cantidades):**
  1. "Guarda tus medicamentos favoritos"
  2. "Activa alertas de precio"
  3. "Consulta el historial de precios"

Consistencia con misión/visión ya aprobadas: el mensaje de neutralidad ("100% imparcial", "Sin registro obligatorio") corresponde directamente al Principio de producto "Neutralidad" de `docs/brand/BRAND_FOUNDATIONS.md` §11.2 y a la declaración de que ComparaFarma "no privilegia una farmacia por sobre otra por conveniencia comercial" (§12, citado también en `COLOR_SYSTEM.md` §2). Los tres mensajes secundarios corresponden a funcionalidades reales y permanentes del producto (favoritos, alertas de precio, historial de precios), verificadas en `CLAUDE.md` §"Funcionalidades Implementadas" — ninguna es una funcionalidad nueva ni inventada para esta pieza.

**No propuesto:** ninguna cifra, monto de ahorro, cantidad de farmacias, ni ningún elemento que pueda cambiar en versiones futuras — instrucción explícita del CTO para esta versión del copy. **Sin cambios respecto a la versión 1:** el layout, la composición, los componentes visuales (§3-§4) y el isotipo — este ajuste es exclusivamente de texto.

---

## 6. Restricciones

No debe aparecer, bajo ninguna circunstancia:

- **Descuentos falsos o inexistentes** — inconsistente con el Principio de producto "Neutralidad" (`BRAND_FOUNDATIONS.md` §11.2) y con la prohibición general de Google Play de metadatos engañosos.
- **Medicamentos específicos como protagonistas de marketing** — el "Paracetamol 500mg x20" del mockup se muestra como *ejemplo ilustrativo de cómo funciona la comparación*, no como una recomendación o promoción de ese medicamento en particular. No debe agregarse ningún medicamento adicional como si fuera una recomendación de uso.
- **Precios inventados** — los únicos precios permitidos son los ya validados en `BRAND_EXPERIENCE_V1.md` §3.1 ($1.990 / $2.490 / $500 de ahorro / $4.200 de ahorro máximo). Ningún precio nuevo se inventa para esta pieza.
- **Claims médicos** — ComparaFarma "no emite recomendaciones médicas ni diagnósticos" (`BRAND_FOUNDATIONS.md` §12). Ningún texto puede sugerir que un medicamento es recomendable, seguro, o preferible desde un punto de vista de salud.
- **Elementos de urgencia agresiva** — contadores, alarmas, "oferta por tiempo limitado", signos de exclamación excesivos — prohibido explícitamente por `docs/design/DESIGN_BRIEF.md` §4.10 y ya aplicado como restricción de pesos tipográficos en `TYPOGRAPHY_SYSTEM.md` §4.4.
- **Elementos fuera del sistema visual** — cualquier color no listado en `BRAND_EXPERIENCE_V1.md` §1, cualquier tipografía distinta a Inter, cualquier ícono ajeno al lenguaje Lucide ya aprobado, cualquier logotipo o isotipo de terceros (farmacias) mostrado con igual o mayor peso visual que la marca ComparaFarma — inconsistente con la Neutralidad hacia farmacias específicas (`COLOR_SYSTEM.md` §4.5).
- **Transformaciones prohibidas del isotipo** — cualquiera de las listadas en `LOGO_SYSTEM.md` §4.6: deformación, rotación, cambio de proporciones, efectos (sombras, degradados, texturas, biselados, brillos), contornos no oficiales, o reconstrucción manual del isotipo.

---

## 7. Relación con la marca

El Feature Graphic no introduce ningún elemento nuevo — reutiliza íntegramente:

- **Colores:** exclusivamente los ya definidos en `BRAND_EXPERIENCE_V1.md` §1 (Brand Indigo, Feedback/Success para el badge "Mejor precio", Neutrales para fondo de tarjeta) — ninguno nuevo, ninguno ajustado.
- **Isotipo:** el Candidato 09 sin modificar, en las versiones ya permitidas por `LOGO_SYSTEM.md` §4.5 (Positivo, si el fondo es claro; o consideración de Negativo si el fondo es el Brand Indigo oscuro — sujeto a la observación de BV-002 sobre necesidad de un borde definido en negativo).
- **Componentes:** el badge "Mejor precio" y el bloque de comparación de precios, ya definidos en `docs/design/SIGNATURE_COMPONENTS.md` y ya aplicados en `BRAND_EXPERIENCE_V1.md` §3.1 y §6 (Savings Arc) — no se crea ningún componente nuevo, se reutiliza el mockup existente que ya los contiene.
- **Lenguaje visual:** la misma disciplina de iconografía Lucide, la misma tipografía Inter en las mismas capas ya definidas, y la misma jerarquía visual (marca → beneficio → prueba) ya validada para Home.

No se introduce ningún elemento — color, forma, tipografía, ícono o composición — que no exista ya en al menos una de las piezas de Brand Experience v1 congeladas por DD-002.

---

## 8. Checklist de validación

Antes de producir el gráfico definitivo a partir de esta especificación, debe poder responderse afirmativamente a las cuatro preguntas:

| Pregunta | Respuesta esperada | Cómo se verifica |
|---|---|---|
| ¿Respeta DD-003? | Sí | Usa el isotipo Candidato 09 sin modificar, reconociendo explícitamente (no ocultando) que los 4 ajustes de `BRAND_IDENTITY_VALIDATION.md` siguen abiertos — el riesgo ya fue aceptado en DD-003, no se reintroduce como duda nueva aquí. |
| ¿Respeta Brand Experience v1? | Sí | Todo componente visual (§3) y toda jerarquía (§4) provienen directamente de `BRAND_EXPERIENCE_V1.md`, sin color, ícono ni composición nuevos. El copy (§5, v2) es una adaptación editorial —no el texto literal del Hero de Home— por instrucción explícita del CTO, con el mismo criterio ya aplicado en las Release Notes; no introduce ninguna funcionalidad, cifra ni afirmación no verificada. |
| ¿Respeta Color System? | Sí | El único uso de color con significado (badge "Mejor precio" en Feedback/Success) refleja un hecho ya calculado por el sistema (precio efectivo mínimo), nunca un juicio de valor nuevo — consistente con `COLOR_SYSTEM.md` §4.5. Ningún color se usa para sugerir que una farmacia es preferida fuera de ese cálculo. |
| ¿Cumple Google Play? | Sí | 1024×500 px, PNG, sin canal alfa (§2) — especificación técnica verificada contra la documentación oficial ya citada en `docs/release/GRAPHIC_ASSETS_INVENTORY_V1.md`. |

---

## Confirmación explícita de reutilización

Esta especificación reutiliza únicamente:

- Activos ya aprobados y congelados por DD-002: `09_app_icon.png`, `02_home_mobile.png` (o `04_results.png` como alternativa), y los valores de color/tipografía de `BRAND_EXPERIENCE_V1.md` §1-§2.
- La decisión DD-003 de adopción del Candidato 09, incluyendo su riesgo aceptado, sin reabrirla ni reinterpretarla.
- Reglas de gobierno ya vigentes de `LOGO_SYSTEM.md`, `COLOR_SYSTEM.md` y `TYPOGRAPHY_SYSTEM.md`, sin modificarlas.
- El criterio editorial de beneficios permanentes ya aprobado por el CTO para las Release Notes (Acción 4), aplicado ahora al copy de esta pieza (§5, v2) por instrucción directa del CTO.

**No se abrió ninguna decisión de diseño nueva.** Ningún documento de `docs/brand/` fue modificado. No se generó ninguna imagen, PNG ni variante. El único cambio de esta actualización es de texto (§5) y sus referencias cruzadas (§1, §4, §8).

---

## Estado

**Especificación aprobada por el CTO como base oficial de Producción (2026-08-08), con el copy ya ajustado a v2.** No quedan ajustes de copy pendientes. Pendiente únicamente la producción del gráfico definitivo (fuera del alcance de este documento — ver `docs/release/GRAPHIC_ASSETS_INVENTORY_V1.md`, sección Asset Production Plan).
