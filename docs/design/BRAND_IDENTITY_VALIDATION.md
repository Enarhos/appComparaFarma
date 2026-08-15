# BRAND IDENTITY VALIDATION — ComparaFarma

Este documento no diseña, no rediseña y no propone variantes nuevas del isotipo. Es una auditoría independiente de calidad sobre el **candidato oficial de isotipo** (Candidato 09, resultado de `Isotype Exploration` → `Isotype Refinement` → `Candidate Construction`), redactada antes de su aprobación definitiva como identidad corporativa.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | DES-VAL-001 |
| **Nombre** | BRAND_IDENTITY_VALIDATION.md |
| **Dominio** | Arquitectura de Diseño (`docs/design/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Brand Quality Director (criterio Pentagram / Wolff Olins / DesignStudio) |
| **Nivel de Gobierno** | De decisión operativa — registra el resultado concreto de una auditoría de calidad previa a una decisión de aprobación de identidad. No hay un nivel de los siete reconocidos por `GOVERNED_DOCUMENT_TEMPLATE.md` §"Niveles" pensado específicamente para auditorías de diseño; se declara este por analogía directa con "documentos que registran decisiones concretas de producto o ingeniería" |
| **Clasificación** | Informe de Validación / Auditoría de Identidad de Marca |
| **Fuente Oficial** | Este documento es la fuente oficial del **resultado de validación** del Candidato 09. No es fuente de identidad (`BRAND_FOUNDATIONS.md`), de encargo de diseño (`DESIGN_BRIEF.md`) ni de la geometría del símbolo (entregable de construcción del candidato, no archivado como documento de repositorio) |
| **Documentos de los que depende** | `docs/design/DESIGN_BRIEF.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/DESIGN_CONCEPT.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/product/PRODUCT_DEFINITION_v1.0.md`, y la especificación de construcción del Candidato 09 (entregable de la etapa "Candidate Construction", no archivado como documento independiente) |
| **Documentos que gobierna** | Ninguno todavía. Su conclusión debería condicionar la decisión de aprobación formal del isotipo por parte del CEO/fundador, y — de aprobarse con ajustes — el alcance de trabajo previo a `LOGO_SYSTEM.md` e `ICONOGRAPHY.md` |
| **Pregunta que responde** | ¿Puede aprobarse el Candidato 09 como isotipo corporativo definitivo de ComparaFarma, y bajo qué condiciones? |

---

## 2. Propósito

Este documento existe porque el proceso de diseño de ComparaFarma completó las etapas de exploración, refinamiento y construcción geométrica de un isotipo (ver §5), y una decisión de esta magnitud — adoptar un símbolo que representará la marca en todos sus canales durante años — no debe tomarse sin una auditoría independiente que busque activamente riesgos, en lugar de confirmar el trabajo ya hecho. Su misión no es diseñar: es **detectar lo que el proceso de diseño, por estar del lado de la construcción, no está en posición de cuestionarse a sí mismo.**

---

## 3. Alcance

**Este documento define:**

- Una validación integral del Candidato 09 en ocho dimensiones (BV-001 a BV-008): escalabilidad, contraste, aplicaciones, distintividad, memorabilidad, coherencia con la marca, robustez del sistema y longevidad.
- Una recomendación formal única sobre su aprobación.

**Este documento NO define:**

- Ninguna forma, variante o corrección gráfica nueva — si un riesgo requiere una corrección de forma, este documento lo señala como pendiente, no lo resuelve.
- Ninguna reexploración conceptual. No evalúa si "Orientación" (DD-001) fue la metáfora correcta, ni si el Candidato 09 fue la mejor elección posible entre los doce finalistas — eso ya fue decidido en etapas anteriores del proceso (`Isotype Exploration`, `Isotype Refinement`) y está fuera del alcance de una auditoría de calidad.
- Ninguna decisión sobre color, tipografía o logotipo completo — corresponde a `DESIGN_BRIEF.md` §4.14 y a los futuros `LOGO_SYSTEM.md`, `COLOR_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`.

---

## 4. Contenido principal

### Objeto de la validación

**Candidato 09** — "núcleo con anillo incompleto": un anillo circular con un vano angular deliberado de 60° (versión refinada base) y un punto sólido centrado. Construcción base: módulo = 6 unidades, radio de anillo = 30 (5 módulos), grosor de trazo = 12 (2 módulos), radio del punto = 11 (con compensación óptica aplicada respecto al radio nominal de 12, para equilibrar el peso visual de una forma sólida contra un trazo). Incluye una versión adaptada para tamaños mínimos (vano ampliado a 90°, trazo engrosado a 16, punto a radio 13). Concepto: un campo de opciones que no se cierra del todo, resuelto por una decisión sólida en su centro — coherente con la metáfora aprobada "Orientación" y con la idea "la mejor decisión entre múltiples opciones".

---

### BV-001 — Escalabilidad

Evaluado en 1024, 512, 256, 128, 64, 32, 24 y 16 px.

**Fortalezas:** solo dos elementos geométricos (trazo + punto), sin detalle interno que se pierda al reducir; la etapa de construcción ya anticipó el problema clásico de tamaño mínimo con una versión adaptada (vano más ancho, trazo más grueso) en lugar de una reducción lineal ingenua — un nivel de previsión inusual para esta etapa del proceso.

**Riesgos:** la versión adaptada fue definida por criterio de diseño interno, no validada contra renderizado real en dispositivo (antialiasing de sistema, subpíxel en pantallas de alta densidad, compresión de favicon en pestañas de navegador). Un anillo con vano, a 16–24px, es el tipo de forma que con mayor frecuencia se lee como "ícono roto", "cargando" o "batería baja" en vez de como marca intencional — riesgo conocido de la familia "trazo circular incompleto", no exclusivo de este candidato, pero tampoco descartable sin prueba.

**Resultado: Condicional.** Aprobado en el rango 1024–64px. En el rango 32–16px depende enteramente de una versión que no ha sido probada fuera de la especificación de construcción.

---

### BV-002 — Contraste

Evaluado en positivo, negativo, monocromo, una tinta y escala de grises.

**Fortalezas:** el símbolo nunca dependió de color — su condición nativa es de una sola tinta, por lo que monocromo, una tinta y escala de grises no presentan ningún caso de degradación.

**Debilidades:** en negativo (trazo y punto en blanco sobre fondo negro), el punto y el anillo compiten con el mismo peso visual entre sí, mientras que en positivo el blanco circundante sostiene mejor la lectura del vano como "espacio", no como "ruptura". Si el fondo negro no tiene un borde definido (por ejemplo, sobre una máscara de ícono irregular), el límite del símbolo puede volverse ambiguo.

**Resultado: Aprobado, con observación sobre negativo en fondos sin borde definido.**

---

### BV-003 — Aplicaciones

**App Icon Android:** riesgo real — las máscaras adaptativas de Android varían por fabricante y pueden recortar en un punto que coincida visualmente con el vano del anillo si no se respeta el área de seguridad ya definida en la construcción.

**App Icon iOS:** mismo principio, menor riesgo por usar una máscara fija (squircle).

**Google Play (alta resolución):** sin riesgo — la sofisticación de la construcción óptica se aprecia mejor a mayor tamaño.

**Favicon:** mismo riesgo que BV-001 en el rango 16–24px.

**Avatar RRSS:** recorte circular impuesto por la plataforma, no por el diseñador — mismo riesgo de coincidencia entre el vano y el borde de recorte que en Android.

**Cabecera web / PDF / impresión:** sin riesgo — tamaño grande y reproducción vectorial fiel.

**Bordado:** riesgo medio — un vano de 60° es angularmente pequeño; el grosor físico del hilo puede cerrarlo visualmente en piezas pequeñas, y el punto sólido requiere una densidad de puntada mínima que debe especificarse, no asumirse.

**Grabado:** riesgo bajo-medio — el punto sólido genera un área de remoción de material desproporcionadamente densa frente al trazo del anillo, con acabado potencialmente desigual según el material.

**Resultado: Condicional.** El área de seguridad ya definida en la construcción debe convertirse en regla obligatoria — no solo en referencia — antes de aprobar el candidato para íconos con máscara de recorte variable o reproducción física de baja tolerancia.

---

### BV-004 — Distintividad

Evaluado exclusivamente como riesgo de asociación visual (no comparación estética) frente a Google Maps, Waze, Apple Maps, Airbnb, Spotify, Uber, Stripe, Notion, Dropbox y Slack.

Google Maps y Apple Maps no usan un anillo — usan un marcador de gota — pero ambos comparten con el Candidato 09 el patrón compositivo genérico de "un punto de foco contenido dentro de una forma", que es precisamente el vocabulario visual de la categoría "marcador de posición / mapas". Esto es relevante porque el propio `DESIGN_BRIEF.md` (§4.9) reconoce "Mapa/Ruta" como una de las tres familias metafóricas en exploración para "Orientación" — es decir, la adyacencia no es casual, es estructural al territorio conceptual elegido. Waze, Airbnb, Spotify, Uber, Stripe, Notion, Dropbox y Slack no presentan ninguna coincidencia de forma relevante.

**Clasificación: Medio.** No hay riesgo de imitación ni de confusión directa con ninguna marca de referencia, pero sí una adyacencia categórica real y no descartable con la categoría "marcador de posición/mapas", que debe verificarse con testeo de percepción en usuarios reales, no resolverse por argumento interno.

---

### BV-005 — Memorabilidad

Evaluación heurística, 1 a 5:

| Pregunta | Puntaje |
|---|---|
| ¿Puede recordarse tras pocos segundos? | 3/5 |
| ¿Puede dibujarse de memoria? | 2/5 — el ángulo y la orientación exacta del vano no son el tipo de detalle que la memoria retiene con precisión |
| ¿Posee una silueta reconocible? | 3/5 — clara en tamaños grandes, se degrada en tamaños pequeños porque vano y punto compiten por la misma resolución disponible |
| **Promedio** | **2.7/5** |

Memorabilidad media, no sobresaliente. Suficiente para funcionar como isotipo de apoyo; no garantiza reconocimiento espontáneo sin exposición repetida.

---

### BV-006 — Coherencia con la marca

Contra `BRAND_FOUNDATIONS.md`, `DESIGN_BRIEF.md` y `BRAND_ARCHITECTURE.md`:

| Atributo | Puntaje (1–5) | Justificación |
|---|---|---|
| Orientación | 4 | El anillo incompleto resuelto por el punto es coherente con la metáfora aprobada, sin ilustrarla de forma literal |
| Confianza | 3 | Un anillo "roto" puede leerse como imperfección antes de leerse como resolución; el punto ancla la lectura pero no la garantiza sin contexto |
| Claridad | 4 | Dos elementos, sin ornamento |
| Inteligencia | 3 | El concepto es sofisticado en su justificación, pero esa sofisticación no es necesariamente legible de forma espontánea |
| Simplicidad | 5 | Cumple sin reservas "la claridad antes que la complejidad" |
| Diferenciación | 3 | Ver BV-004 — un patrón compositivo simple tiene, por definición, menor exclusividad formal que uno complejo |
| **Promedio** | **3.67/5** | |

---

### BV-007 — Robustez del sistema

| Extensión | Evaluación |
|---|---|
| Logotipo | Viable como símbolo complementario a un lettermark autónomo, coherente con el modelo Branded House (`BRAND_ARCHITECTURE.md` §4.1), que exige que el logotipo funcione sin depender del símbolo |
| Favicon / App Icon | Viable solo con la versión adaptada, sujeto a validación pendiente (BV-001, BV-003) |
| Animación | Alto potencial — el vano ofrece un punto natural de animación (cierre del anillo, punto entrando desde el vano) coherente con momentos reales de la app (buscando → resultado encontrado) |
| Sistema de iconografía | Riesgo — un trazo circular con vano no ofrece, por sí mismo, un lenguaje formal replicable para íconos secundarios (favoritos, historial, alertas) sin definir reglas nuevas no cubiertas por este candidato |
| Brand patterns | Bajo potencial nativo — un solo anillo no genera un patrón repetible sin duplicación redundante del elemento |
| Motion design | Alto potencial, mismo fundamento que animación |

**Resultado:** robustez alta en logotipo/motion, robustez baja en iconografía de sistema y patterns. El candidato no resuelve por sí mismo el "sistema completo de identidad" que exige `DESIGN_BRIEF.md` §4.14 — eso queda como trabajo pendiente, no como defecto del símbolo.

---

### BV-008 — Longevidad

**¿Potencial de vigencia 10–20 años?** La forma es geometría reductiva pura, sin gradientes, sin efectos de profundidad ni ornamento de tendencia — el tipo de vocabulario visual (trazo + punto, proporciones matemáticas simples) que ya lleva más de una década vigente en identidad corporativa internacional y no depende de una moda gráfica específica de 2026.

**Clasificación: Alta.**

---

## Conclusión

**Recomendación formal: APROBAR CON AJUSTES.**

La construcción del Candidato 09 es sólida — geometría deliberada, compensación óptica real, y una versión de tamaño mínimo ya anticipada en lugar de una reducción lineal ingenua. No se identificó ningún riesgo que justifique un rechazo o un retorno a exploración: no hay violación de las restricciones de imagen prohibida del `DESIGN_BRIEF.md` §4.10, no hay colisión de forma directa con ninguna marca de referencia, y la longevidad y coherencia conceptual son altas.

Sin embargo, tres riesgos identificados en esta auditoría son reales y no deben tratarse como resueltos por la calidad de la construcción: la legibilidad en el rango 16–24px depende de una versión adaptada sin validar en renderizado real (BV-001, BV-003); el área de seguridad para íconos con máscara de recorte variable existe en la especificación pero no como regla obligatoria (BV-003); y la adyacencia categórica con el vocabulario visual de "marcador de posición/mapas" es de riesgo Medio, no Bajo, y no se ha verificado con usuarios reales (BV-004). El sistema de iconografía derivada tampoco está resuelto (BV-007) y debe tratarse como trabajo pendiente antes de declarar el sistema visual completo.

**Ajustes requeridos antes de la aprobación definitiva:**

1. Validar la versión de tamaño mínimo en renderizado real de dispositivo y navegador (16, 24, 32px), no solo en especificación vectorial.
2. Elevar el área de seguridad ya definida a regla obligatoria de uso, específicamente para App Icon Android y avatares de redes sociales con recorte de máscara variable.
3. Testear la percepción del símbolo con usuarios reales para confirmar o descartar la asociación con la categoría "marcador de posición/mapas" (BV-004).
4. No declarar el sistema visual como completo hasta definir reglas explícitas de iconografía derivada (BV-007) — el isotipo por sí solo no las resuelve.

---

## 5. Relaciones

Este documento depende de `docs/design/DESIGN_BRIEF.md` como fuente de los criterios de evaluación y restricciones contra los que se audita el candidato, y de `docs/brand/BRAND_FOUNDATIONS.md` y `BRAND_ARCHITECTURE.md` como fuente de la identidad y el modelo de marca contra los que se evalúa la coherencia (BV-006). Se relaciona con las etapas previas del proceso de diseño — `Isotype Exploration`, `Isotype Refinement` y `Candidate Construction` — como el objeto que audita, sin reabrir ninguna de sus decisiones. Ninguna de esas etapas fue archivada como documento de repositorio (fueron entregables de proceso presentados directamente); este documento es, en consecuencia, el primer registro documental formal del Candidato 09 dentro de `docs/design/`.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Criterios de evaluación y restricciones de diseño | `docs/design/DESIGN_BRIEF.md` §4.10, §4.13 | ✔ — usado como base normativa de BV-001 a BV-008 | — |
| Identidad de marca (personalidad, emociones, principios) | `docs/brand/BRAND_FOUNDATIONS.md` | ✔ — usado en BV-006 | — |
| Modelo de arquitectura de marca (Branded House) | `docs/brand/BRAND_ARCHITECTURE.md` §4.1 | ✔ — usado en BV-007 | — |
| Metáfora central "Orientación" | `docs/brand/DESIGN_CONCEPT.md`, `DESIGN_DECISION_LOG.md` (DD-001) | ✔ — usado en BV-004 y BV-006 | — |
| Geometría y construcción del Candidato 09 | Entregable de proceso "Candidate Construction" (no archivado como documento) | ✔ — objeto íntegro de esta auditoría | Pendiente: archivar formalmente la especificación de construcción como documento de repositorio si el candidato se aprueba |
| Contexto funcional del producto | `docs/product/PRODUCT_DEFINITION_v1.0.md` | Referencia | No se usa como criterio de evaluación directo; contexto general únicamente |

---

## 7. Gobierno

`BRAND_IDENTITY_VALIDATION.md` **no reemplaza**:

- `docs/design/DESIGN_BRIEF.md` — sigue siendo la única fuente del encargo de diseño y de los criterios de evaluación.
- `docs/brand/BRAND_FOUNDATIONS.md`, `BRAND_ARCHITECTURE.md`, `DESIGN_CONCEPT.md` y `VISUAL_IDENTITY.md` — siguen siendo la única fuente de identidad, arquitectura de marca y concepto de diseño.
- Las etapas previas del proceso de diseño (`Isotype Exploration`, `Isotype Refinement`, `Candidate Construction`) — este documento no reabre ni modifica ninguna de sus decisiones; solo audita su resultado.

Este documento **no aprueba por sí mismo** la identidad corporativa — emite una recomendación (§4, Conclusión) que queda sujeta a la misma ratificación formal del CEO/fundador que, a la fecha, sigue pendiente sobre el resto de la documentación de `docs/brand/` y `docs/design/`. Si la ratificación se otorga sin resolver los ajustes de la sección 4 (Conclusión), ese hecho debe registrarse explícitamente en el Control de Cambios de este documento, no asumirse como resuelto.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/design/DESIGN_BRIEF.md`, `docs/design/DESIGN_EXPLORATION.md`, `docs/design/DESIGN_DECISION_LOG.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_ARCHITECTURE.md`, `docs/brand/DESIGN_CONCEPT.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/product/PRODUCT_DEFINITION_v1.0.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial. Auditoría integral del Candidato 09 (BV-001 a BV-008) y recomendación formal "Aprobar con ajustes", con cuatro ajustes explícitos pendientes antes de la aprobación definitiva. No modifica la geometría del candidato ni reabre decisiones de exploración o refinamiento previas. | `docs/design/DESIGN_BRIEF.md` v1.0; `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/brand/BRAND_ARCHITECTURE.md` v1.0; entregable de construcción del Candidato 09 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Exploración, refinamiento y construcción geométrica del isotipo | Senior Identity Designer (criterio Pentagram) | Candidato 09 — especificación de construcción (entregable de proceso, no archivado) |
| 2026-08-05 | Auditoría de calidad de identidad de marca | Brand Quality Director (criterio Pentagram / Wolff Olins / DesignStudio) | `docs/design/BRAND_IDENTITY_VALIDATION.md` v1.0 (este documento) — recomendación: Aprobar con ajustes |

**Pendiente de definición:** ninguna acción anterior cuenta todavía con aprobación formal registrada del CEO/fundador. Los cuatro ajustes de la sección 4 (Conclusión) deben resolverse y registrarse en una futura versión de este documento antes de que la aprobación pueda considerarse definitiva.
