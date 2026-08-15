# Auditoría de Identidad de Marca — ComparaFarma

**Documento:** BRAND_AUDIT.md
**Estado:** Draft
**Versión:** 1.0
**Rol asumido:** Brand Strategist / Corporate Historian / Enterprise Architect
**Naturaleza:** Auditoría de solo lectura. No se modificó, movió ni eliminó ningún documento existente. No se propone marca nueva, ni logo, ni paleta de colores, ni slogan. Este informe identifica qué identidad ya existe, dónde está documentada, dónde se repite y dónde no existe todavía.

---

## Alcance y metodología

Se revisaron íntegramente los siguientes dominios documentales:

- `docs/book/` — 58 archivos: Carta del Fundador, front-matter, Acto I (El Origen, 7 capítulos), Acto II (La Identidad, 10 capítulos incluida la Constitución y el Manifiesto), Acto III (Nuestra Forma de Trabajar, 22 capítulos incluido el Credo), Acto IV (El Legado, 12 capítulos), y 5 apéndices (incluidos Los 12 Principios Inmutables, La Promesa, El Test de la Confianza y Cómo Tomar Decisiones).
- `docs/strategy/` — 4 archivos: VISION_2030.md, MASTER_DATA_STRATEGY.md, PHARMACY_NETWORK_STRATEGY.md, DIGITAL_ASSET_REGISTER.md.
- `docs/product/` — VISION.md, PRODUCT_CANVAS.md, PRODUCT_PRINCIPLES.md, PERSONAS.md, COMPANY_STRATEGY.md, SUBSCRIPTION_STRATEGY.md, PRODUCT_DECISION_FRAMEWORK.md, DECISION_LOG.md, README.md, ROADMAP.md.
- `docs/enterprise/` — README.md, BUSINESS_CAPABILITY_MAP.md, BUSINESS_SERVICES.md, ENTERPRISE_DATA_MODEL.md.
- Adicionalmente: `docs/README.md`, `docs/analysis/PROJECT_INVENTORY.md`, `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` (auditoría documental previa, 2026-08-02) y `CLAUDE.md` (raíz).

No se revisaron en profundidad los dominios puramente técnicos (`docs/engineering/`, `docs/architecture/`, `docs/database/`, `docs/release/`, `docs/actas/`) por no contener, según el muestreo realizado y lo confirmado por `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`, contenido adicional relevante para identidad de marca más allá de lo ya cubierto.

Toda afirmación de este informe está respaldada por una cita textual y una ruta de archivo verificable. Donde un concepto no tiene evidencia documental, se indica explícitamente como vacío, no se completa con criterio propio.

Nota importante: ya existe una auditoría documental previa y reciente (`docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`, 2026-08-02) que cubre gobierno documental de todo el repositorio (no solo marca) y que ya identificó varias de las duplicidades que este informe confirma y profundiza desde la óptica específica de identidad de marca. Este informe no repite esa auditoría; la referencia y la extiende hacia lo que ella no cubrió: personalidad, tono, voz, arquetipo, arquitectura de marca e identidad verbal/visual.

---

## 1. Resumen Ejecutivo

La documentación existente describe una identidad con un núcleo narrativo inusualmente sólido y una capa de marca formal casi inexistente.

El núcleo narrativo vive en `docs/book/` (el "Libro Fundacional") y se repite, con distintas palabras pero el mismo contenido, en `docs/strategy/VISION_2030.md` y en varios documentos de `docs/product/`. Ese núcleo se puede resumir en una sola idea, presente casi textualmente en al menos cinco documentos de tres dominios distintos: **ComparaFarma existe para ayudar a las personas a tomar mejores decisiones sobre sus medicamentos, mediante información clara y confiable, no para vender medicamentos ni competir con farmacias.** Esta idea aparece en la Cláusula Cero del Libro (`docs/book/00-front-matter/00-Clausula-Cero.md`: *"ComparaFarma existe para ayudar a las personas a tomar mejores decisiones relacionadas con sus medicamentos mediante información clara, transparente y útil"*), en `docs/strategy/VISION_2030.md` (*"ComparaFarma existe para ayudar a las personas a tomar mejores decisiones respecto de sus medicamentos mediante información objetiva, confiable y actualizada"*), y en `docs/product/PRODUCT_CANVAS.md` (*"Ayudar a las personas a tomar mejores decisiones relacionadas con la compra de medicamentos mediante información confiable, transparente y actualizada"*). El hecho de que la misma frase se repita casi palabra por palabra en tres documentos de tres carpetas distintas, sin que ninguno cite a los otros, es en sí mismo un hallazgo: la identidad existe y es consistente en su contenido, pero no está consolidada en una fuente única.

Alrededor de ese núcleo hay una segunda capa, igualmente rica, de principios y compromisos: la Constitución de 8 artículos (`docs/book/02-acto-la-identidad/08-La-Constitucion.md`), el Manifiesto, el Credo (`docs/book/03-acto-nuestra-forma-de-trabajar/22-El-Credo-De-ComparaFarma.md`) y Los 12 Principios Inmutables (`docs/book/appendix/Los-12-Principios-Inmutables.md`) repiten, en cuatro formatos distintos, un mismo conjunto de jerarquías de valor ("la confianza antes que el crecimiento", "las personas antes que las métricas", "la verdad antes que la conveniencia"). Es contenido coherente entre sí, pero multiplicado en vez de consolidado.

La palabra que casi nunca aparece en todo este corpus es, precisamente, "marca". La única mención explícita de ComparaFarma como marca está en el cierre del Manifiesto (`docs/book/02-acto-la-identidad/09-Manifiesto.md`): *"Porque antes de ser una aplicación... Antes de ser una empresa... Antes de ser una marca... ComparaFarma fue una decisión"* — y en esa misma frase, "marca" aparece como la última y más subordinada de las tres categorías, después de "aplicación" y "empresa". No existe en todo el repositorio ningún documento que defina personalidad, tono, voz, arquetipo o arquitectura de marca. Tampoco existe una sola mención a identidad visual (logo, color, tipografía). El término "identidad", cuando aparece en `docs/enterprise/`, se refiere exclusivamente a autenticación de usuarios (`docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, BC-005: *"La identidad constituye un mecanismo operativo. No forma parte del Patrimonio Digital"*), un significado completamente distinto al de identidad de marca.

Sobre el plano estratégico y empresarial, el término más consistente y mejor consolidado de todo el repositorio es **"Plataforma de Inteligencia Farmacéutica"**, que aparece de forma prácticamente idéntica en `docs/strategy/VISION_2030.md`, `docs/strategy/MASTER_DATA_STRATEGY.md`, `docs/strategy/DIGITAL_ASSET_REGISTER.md`, `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `docs/enterprise/BUSINESS_SERVICES.md`, `docs/enterprise/ENTERPRISE_DATA_MODEL.md` y `docs/product/ROADMAP.md`. Es, junto con el propósito citado arriba, el elemento de identidad mejor consolidado de todo el proyecto.

Por el contrario, existen al menos seis marcos distintos de toma de decisiones (dos en el Libro, uno en VISION_2030, uno en PRODUCT_DECISION_FRAMEWORK/CFPS, uno en PHARMACY_NETWORK_STRATEGY, uno en DIGITAL_ASSET_REGISTER) y al menos tres esquemas de segmentación de audiencia no reconciliados entre sí (PERSONAS.md, PRODUCT_CANVAS.md, SUBSCRIPTION_STRATEGY.md), y al menos dos definiciones incompatibles del término "patrimonio" (la confianza como patrimonio emocional en el Libro, frente al "Patrimonio Digital" como activo de conocimiento estructurado en DIGITAL_ASSET_REGISTER.md y en `docs/enterprise/`).

En síntesis: **la identidad de ComparaFarma ya existe y es, en su contenido de fondo, notablemente consistente** — pocas empresas tienen un relato de origen, un propósito y una promesa tan claramente articulados. Lo que no existe es **una consolidación formal de esa identidad**: no hay una única fuente de verdad declarada para misión, visión, valores o principios; no hay vocabulario de marca (personalidad, tono, voz); y el gobierno documental de esta capa es, según la propia auditoría interna del repositorio, más débil que el del resto del proyecto (`docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`: *"docs/book/ (Libro)... narrativa/cultura, sin versión, no citado por nadie más abajo en la cadena"*).

---

## 2. Inventario de Identidad

Para cada concepto solicitado se indica el/los documento(s) donde aparece, la ubicación exacta (sección/encabezado) y su estado. Estado se clasifica como: **Consolidado** (una fuente clara, sin duplicación relevante), **Definido — múltiple sin consolidar** (existe evidencia clara, pero repartida en más de una fuente sin jerarquía declarada), **Parcial / implícito** (existe evidencia indirecta, no una definición formal), o **Ausente** (no se encontró evidencia textual).

### Historia

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/0. Carta del Fundador.md` | Texto completo | Consolidado (fuente narrativa primaria) |
| `docs/book/01-acto-el-origen/02-Como-Comenzo-Todo.md` | "Un invierno como tantos otros", "Una duda que cambió todo" | Consolidado — desarrolla la misma historia con más detalle |
| `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` | Tabla 1.1 | Confirma que el Libro es "vigente como narrativa, sin versión formal" y "sin fecha en ningún archivo" |

**Estado consolidado:** Definido y consistente, pero sin fecha ni versión en ninguno de sus archivos.

### Origen

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/01-acto-el-origen/01-Introduccion.md` | Epígrafe e introducción del Acto | Consolidado |
| `docs/book/01-acto-el-origen/05-La-Decision.md` | "El verdadero comienzo" | Consolidado |

**Estado consolidado:** Definido, una sola fuente coherente (el Acto I completo).

### Propósito

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/00-front-matter/00-Clausula-Cero.md` | Texto completo | — |
| `docs/strategy/VISION_2030.md` | Sección "Propósito" | — |
| `docs/product/PRODUCT_CANVAS.md` | Sección "Propósito" | — |
| `docs/product/VISION.md` | "Nuestra razón de existir" | — |
| `docs/book/01-acto-el-origen/04-El-Descubrimiento.md` | "Mucho más que tecnología" | — |

**Estado consolidado: Definido — múltiple sin consolidar.** El contenido es consistente entre las cinco fuentes (converge en la misma idea), pero está repetido casi textualmente sin que ninguna se declare fuente única.

### Misión

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/01-acto-el-origen/06-Nuestra-Promesa.md` | "La promesa que guía cada decisión" | Formulación emocional: *"Ayudar a que las personas enfrenten uno de los momentos más delicados de sus vidas con una preocupación menos"* |
| `docs/strategy/VISION_2030.md` | "Nuestra Misión" | Formulación de infraestructura: *"Construir la mejor infraestructura tecnológica para democratizar el acceso a información farmacéutica de calidad"* |
| `docs/product/VISION.md` | "Misión" | Formulación económica: *"Ayudar a millones de personas a reducir el costo de sus tratamientos mediante información simple, objetiva y accesible"* |

**Estado consolidado: Definido — múltiple sin consolidar (ver Consistencia §3, hallazgo Crítico #1).** Tres formulaciones distintas en énfasis (emocional, tecnológico, económico) coexisten sin jerarquía declarada.

### Visión

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/strategy/VISION_2030.md` | "Nuestra Visión" | Fuente más completa, única con metadata de versión |
| `docs/product/VISION.md` | "Visión" | Formulación distinta, más corta |
| `docs/product/PRODUCT_CANVAS.md` | "Visión de largo plazo" | Casi idéntica a la de ROADMAP.md |
| `docs/product/ROADMAP.md` | "Visión" | Casi idéntica a la de PRODUCT_CANVAS.md (difiere en una palabra) |

**Estado consolidado: Definido — múltiple sin consolidar (ver Duplicación §4, hallazgo #2).**

### Visión 2030

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/strategy/VISION_2030.md` | Documento completo | Consolidado — único documento del repositorio con metadata formal de versión ("Versión 1.0", "Estado: Vivo", "Última actualización: Agosto 2026") |

**Estado consolidado:** Consolidado en un único documento, pero ese documento está **untracked en git** según `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` (tabla 1.1: *"(untracked)"*), lo que es una fragilidad de gobierno, no de contenido.

### Valores

| Documento | Ubicación | Estado |
|---|---|---|
| — | La palabra "valores" como categoría formal **no aparece** en `docs/book/` (confirmado por lectura completa de Actos I, II y IV: se usa sistemáticamente "principios", no "valores") | Ausente como etiqueta |
| `docs/product/COMPANY_STRATEGY.md` | Sección 3 (modelos de negocio) | Única mención explícita de "valor de marca": *"choca directo con PRODUCT_PRINCIPLES.md (neutralidad es un valor de marca explícito)"* |
| `docs/product/PRODUCT_PRINCIPLES.md` | 10 principios numerados | Funciona como lista de valores de producto, sin llamarse así |

**Estado consolidado: Ausente como concepto etiquetado.** Lo que existen son "principios" (ver siguiente) que cumplen la función de valores sin usar ese nombre.

### Principios

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/02-acto-la-identidad/08-La-Constitucion.md` | 8 artículos | Fundacional / cultural |
| `docs/book/03-acto-nuestra-forma-de-trabajar/22-El-Credo-De-ComparaFarma.md` | "Creemos que..." (11 líneas) | Síntesis del Libro |
| `docs/book/appendix/Los-12-Principios-Inmutables.md` | 12 principios numerados (I–XII) | Fundacional / cultural, distinto de la Constitución |
| `docs/product/PRODUCT_PRINCIPLES.md` | 10 principios numerados | Operativo de producto |
| `docs/strategy/VISION_2030.md` | "Principios Estratégicos" (5) | Operativo de arquitectura/datos |
| `docs/strategy/MASTER_DATA_STRATEGY.md` | "3. Principios" (4) | Operativo de gobierno de datos |
| `docs/strategy/PHARMACY_NETWORK_STRATEGY.md` | "2. Principios" (3) | Operativo de red de farmacias |
| `docs/strategy/DIGITAL_ASSET_REGISTER.md` | "Principios Fundacionales" (9) | Operativo de patrimonio digital |

**Estado consolidado: Definido — múltiple sin consolidar (ver Duplicación §4, hallazgos #4 y #5).** Al menos ocho listas de principios distintas, con solapamiento textual parcial ("la confianza antes que el crecimiento" se repite casi idéntica en tres de ellas).

### Promesa

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/0. Carta del Fundador.md` | Epígrafe y cierre: *"No podemos quitarte esa preocupación. Pero sí podemos quitarte otra"* | — |
| `docs/book/01-acto-el-origen/06-Nuestra-Promesa.md` | Capítulo completo | — |
| `docs/book/appendix/La-Promesa.md` | Documento completo (5 pares "No prometemos X / Prometemos Y") | — |

**Estado consolidado: Definido — múltiple sin consolidar (ver Duplicación §4, hallazgo #6).** Tres formulaciones no contradictorias pero no cruzadas entre sí.

### Propuesta de Valor

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/product/VISION.md` | "Nuestra propuesta de valor" | *"Permitir que cualquier persona encuentre rápidamente la mejor alternativa disponible para un medicamento"* |
| `docs/product/PRODUCT_CANVAS.md` | "Propuesta de Valor" | *"Permitir que cualquier persona encuentre el medicamento que necesita al mejor precio disponible en pocos segundos"* |
| `docs/product/SUBSCRIPTION_STRATEGY.md` | "Principios" | La comparación gratuita es *"la principal propuesta de valor"* |

**Estado consolidado: Definido — múltiple sin consolidar.** Formulaciones parecidas pero no idénticas, sin fuente declarada como oficial.

### Posicionamiento

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/strategy/VISION_2030.md` | "Qué NO somos" / "Qué sí somos" | *"ComparaFarma NO pretende convertirse en: una farmacia; un marketplace; un sistema de recetas médicas; una plataforma de publicidad farmacéutica"* |
| `docs/product/VISION.md` | "Qué NO somos" | Formulación equivalente, algo más corta |
| `docs/product/PRODUCT_CANVAS.md` | "Qué NO hacemos" | Formulación equivalente |

**Estado consolidado: Parcial — consistente pero solo formulado por la negativa ("qué no somos"), nunca como una declaración de posicionamiento positiva y única (ej. frente a qué categoría se posiciona, con qué frase). No existe la palabra "posicionamiento" en ningún documento revisado.**

### Personalidad

| Documento | Ubicación | Estado |
|---|---|---|
| — | La palabra "personalidad" **no aparece en ningún documento revisado** | Ausente |
| `docs/book/` (varios capítulos) | Rasgos inferibles del texto (humildad, prudencia, cercanía, honestidad) sin ser nombrados como "personalidad" | Parcial / implícito |

**Estado consolidado: Ausente como concepto formal.** Ver Vacíos §5.

### Tono

| Documento | Ubicación | Estado |
|---|---|---|
| — | La palabra "tono" **no aparece en ningún documento revisado** | Ausente |

**Estado consolidado: Ausente.** Existe un tono narrativo observable (solemne, de frases cortas, con contrastes "No... Sino...") pero no está codificado como guía.

### Voz

| Documento | Ubicación | Estado |
|---|---|---|
| — | La palabra "voz" en sentido de brand voice **no aparece en ningún documento revisado** | Ausente |
| `docs/book/03-acto-nuestra-forma-de-trabajar/01-Introduccion.md` | *"Nosotros no escribimos este libro para inspirar. Lo escribimos para orientar decisiones"* | Aclara la función del texto, no define "voz" como concepto de marca |

**Estado consolidado: Ausente como concepto formal.** Observable: primera persona plural predominante, con una excepción a segunda persona singular en el cierre de la Carta del Fundador.

### Audiencias

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/product/PERSONAS.md` | 4 personas con nombre (Carmen, Rodrigo, Daniela, Claudia) | — |
| `docs/product/PRODUCT_CANVAS.md` | "Público objetivo" (primario/secundario, incluye B2B) | — |
| `docs/product/SUBSCRIPTION_STRATEGY.md` | "Segmentación esperada" (5 segmentos) | — |
| `docs/book/02-acto-la-identidad/04-Las-Personas-Antes-Que-Las-Metricas.md` | Descripciones narrativas de audiencia sin segmentación formal | — |

**Estado consolidado: Definido — múltiple sin consolidar (ver Duplicación §4, hallazgo #7).** Tres esquemas de granularidad distinta que no se mapean 1:1.

### Segmentos

Ver "Audiencias" arriba — mismo conjunto de evidencia; el repositorio no distingue "audiencias" de "segmentos" como conceptos separados.

### Diferenciadores

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/product/PRODUCT_CANVAS.md` | "Diferenciadores" | Lista explícita: comparación multi-farmacia, información objetiva, plataforma neutral, actualización frecuente, experiencia simple |
| `docs/book/02-acto-la-identidad/05-La-Independencia-Antes-Que-La-Rentabilidad.md` | — | *"Nunca venderemos una posición privilegiada en nuestros resultados"* |
| `docs/book/03-acto-nuestra-forma-de-trabajar/15-...md` y `16-...md` | — | Rechazo explícito de patrones oscuros de diseño, compromiso de accesibilidad |

**Estado consolidado:** Definido y consistente entre Libro y Producto, aunque solo un documento (PRODUCT_CANVAS.md) lo declara como sección propia.

### Competencia

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/03-acto-nuestra-forma-de-trabajar/17-Nuestro-Verdadero-Competidor-Es-La-Desinformacion.md` | Capítulo completo | Única definición explícita: *"Nuestro verdadero competidor es la desinformación"* |
| `docs/book/01-acto-el-origen/03-El-Problema.md` | — | *"En ComparaFarma nunca nos propusimos ganar una competencia entre farmacias"* |

**Estado consolidado: Parcial.** Existe una definición filosófica de "competencia" (la desinformación, no una empresa), pero **no existe en ningún documento revisado un mapeo de competidores reales** (otras apps, agregadores, farmacias con comparadores propios). Ver Vacíos §5.

### Mensaje

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/00-front-matter/00-Clausula-Cero.md`, `docs/strategy/VISION_2030.md`, `docs/product/PRODUCT_CANVAS.md`, `docs/product/ROADMAP.md`, `docs/book/02-acto-la-identidad/09-Manifiesto.md` | Múltiples secciones | *"Ayudar a las personas a tomar mejores decisiones"* — la frase mejor consolidada de todo el corpus |

**Estado consolidado:** El elemento **más consolidado** de toda la auditoría — presente casi textual en 5+ documentos de 3 dominios distintos.

### Marca

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/02-acto-la-identidad/09-Manifiesto.md` | Cierre | Única mención de ComparaFarma como marca, y aparece subordinada: *"Antes de ser una aplicación... Antes de ser una empresa... Antes de ser una marca..."* |
| `docs/product/COMPANY_STRATEGY.md` | Sección 3 | Mención indirecta de "valor de marca" (ver Valores) |
| `docs/enterprise/ENTERPRISE_DATA_MODEL.md` | Dominio EDM-100 | "Marca" usada en sentido de marca comercial de medicamento, no de ComparaFarma |

**Estado consolidado: Prácticamente ausente.** Es el hallazgo más importante de esta auditoría: la palabra "marca" existe pero nunca se usa para definir qué es ComparaFarma como marca.

### Producto

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/product/PRODUCT_CANVAS.md`, `docs/product/VISION.md`, `docs/product/ROADMAP.md` | Completos | Consolidado — evolución "comparador → plataforma de inteligencia farmacéutica" consistente |

### Empresa

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/product/COMPANY_STRATEGY.md` | "De app a empresa" | Define la evolución operativa/legal/comercial |
| `docs/book/04-acto-el-legado/02-La-Empresa-Que-Queremos-Dejar.md` | — | Define "empresa" en sentido de legado, no operativo |
| `docs/enterprise/README.md` | "Propósito" | Trata "la empresa" como sujeto implícito de sus capacidades, sin definirla narrativamente |

**Estado consolidado: Definido — múltiple sin consolidar.** Tres nociones de "empresa" (legal/operativa, legado/cultural, arquitectura empresarial) coexisten sin puente explícito entre ellas.

### Plataforma

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/strategy/VISION_2030.md`, `docs/strategy/MASTER_DATA_STRATEGY.md`, `docs/strategy/DIGITAL_ASSET_REGISTER.md`, `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `docs/enterprise/BUSINESS_SERVICES.md`, `docs/enterprise/ENTERPRISE_DATA_MODEL.md`, `docs/product/ROADMAP.md` | Múltiples secciones | "Plataforma de Inteligencia Farmacéutica" — término idéntico repetido en 7 documentos de 3 dominios |

**Estado consolidado: El más consolidado del repositorio junto con "Mensaje".**

### Patrimonio

| Documento | Ubicación | Estado |
|---|---|---|
| `docs/book/02-acto-la-identidad/08-La-Constitucion.md`, Art. I | — | *"La confianza será siempre el patrimonio más importante de ComparaFarma"* (patrimonio = confianza, activo emocional) |
| `docs/strategy/DIGITAL_ASSET_REGISTER.md` | Documento completo | "Patrimonio Digital" — 5 categorías estructuradas de activos de conocimiento (DAR-100 a DAR-500) |
| `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `docs/enterprise/ENTERPRISE_DATA_MODEL.md` | Múltiples secciones | Reutilizan "Patrimonio Digital" en el mismo sentido que el DAR |

**Estado consolidado: Definido — múltiple sin consolidar, con tensión de fondo (ver Consistencia §3, hallazgo Crítico #3).** La misma palabra ("patrimonio") tiene dos significados no reconciliados: valor emocional intangible (el Libro) vs. activo de conocimiento estructurado (Estrategia/Enterprise).

---

## 3. Consistencia

### Crítico

**C1. Tres formulaciones no reconciliadas de "Misión".**
- `docs/book/01-acto-el-origen/06-Nuestra-Promesa.md`: *"Nuestra misión... Ayudar a que las personas enfrenten uno de los momentos más delicados de sus vidas con una preocupación menos"* (énfasis emocional).
- `docs/strategy/VISION_2030.md`, "Nuestra Misión": *"Construir la mejor infraestructura tecnológica para democratizar el acceso a información farmacéutica de calidad"* (énfasis en infraestructura tecnológica).
- `docs/product/VISION.md`, "Misión": *"Ayudar a millones de personas a reducir el costo de sus tratamientos mediante información simple, objetiva y accesible"* (énfasis económico).
Ninguno de los tres documentos referencia a los otros dos ni declara cuál prevalece. No son contradictorios entre sí, pero enfatizan objetivos distintos (humano, tecnológico, económico) que podrían llevar a decisiones de producto distintas según cuál se use como criterio.

**C2. Al menos seis marcos de toma de decisiones distintos, sin jerarquía declarada.**
1. `docs/book/appendix/Como-Tomar-Decisiones.md` — 7 preguntas, para "decisiones importantes" en general.
2. `docs/book/appendix/El-Test-De-La-Confianza.md` — 7 preguntas distintas, para "toda nueva funcionalidad, alianza, campaña, decisión estratégica, innovación".
3. `docs/strategy/VISION_2030.md`, "Cómo tomaremos decisiones" — 5 preguntas, para desarrollo de funcionalidades.
4. `docs/product/PRODUCT_DECISION_FRAMEWORK.md` (CFPS) — fórmula ponderada de 7 criterios (1–5), para priorización de producto.
5. `docs/strategy/PHARMACY_NETWORK_STRATEGY.md`, "Criterios de incorporación" — matriz ponderada de 7 criterios, para incorporar farmacias.
6. `docs/strategy/DIGITAL_ASSET_REGISTER.md`, "Criterios para crear un nuevo Activo Digital" — checklist de 6 preguntas booleanas, para creación de activos digitales.
Los marcos 1 y 2 tienen preguntas temáticamente casi idénticas ("¿La explicaríamos con tranquilidad a nuestra propia familia?" vs. "¿Nos sentiríamos cómodos si esta decisión afectara a nuestra propia familia?") sin que ninguno aclare si son el mismo marco en dos redacciones o dos marcos distintos que deban aplicarse ambos. Ninguno de los seis se cita a sí mismo en relación con los demás, salvo el criterio "Impacto Estratégico" del CFPS, que menciona genéricamente "la visión de ComparaFarma".

**C3. "Patrimonio" tiene dos definiciones incompatibles bajo la misma palabra.**
- En el Libro (`docs/book/02-acto-la-identidad/08-La-Constitucion.md`, Art. I, y `docs/book/02-acto-la-identidad/02-La-Confianza-Antes-Que-El-Crecimiento.md`): patrimonio = la confianza, un activo intangible/emocional. *"La confianza será siempre el patrimonio más importante de ComparaFarma."*
- En `docs/strategy/DIGITAL_ASSET_REGISTER.md` y en `docs/enterprise/`: "Patrimonio Digital" = conocimiento estructurado y reutilizable (catálogo maestro, historial de precios, conocimiento de mercado, conocimiento de uso, conocimiento comercial), explícitamente definido por exclusión de lo emocional: *"La identidad civil de una persona no constituye un Activo Digital"* (no se menciona la confianza como categoría de Patrimonio Digital en el DAR).
Ningún documento reconcilia ambos usos ni aclara si la "confianza" (patrimonio del Libro) es o no parte del "Patrimonio Digital" (patrimonio de la Estrategia/Enterprise). Son, en la práctica, dos taxonomías paralelas que comparten nombre.

### Alto

**A1. La "Visión" se repite casi textual en cuatro documentos.**
`docs/strategy/VISION_2030.md`, `docs/product/VISION.md`, `docs/product/PRODUCT_CANVAS.md` ("Visión de largo plazo": *"Convertir a ComparaFarma en la plataforma líder de inteligencia farmacéutica para personas en Chile"*) y `docs/product/ROADMAP.md` ("Visión": *"Convertir ComparaFarma en la plataforma líder de inteligencia farmacéutica para personas en Chile"* — difiere de la anterior en una sola palabra, "a"). Ninguno declara ser la fuente y los otros la copia.

**A2. Segmentación de audiencia en tres esquemas no reconciliados.**
`docs/product/PERSONAS.md` (4 personas con nombre: Carmen, Rodrigo, Daniela, Claudia) no se mapea 1:1 con `docs/product/SUBSCRIPTION_STRATEGY.md` ("Usuario ocasional", "Familia", "Paciente crónico", "Adulto mayor", "Cuidador") ni con `docs/product/PRODUCT_CANVAS.md` ("Público objetivo": categorías genéricas más un público secundario B2B — médicos, químicos farmacéuticos, aseguradoras — ausente en los otros dos documentos). Por ejemplo, Daniela ("profesional con poco tiempo", `PERSONAS.md`) no corresponde a ningún segmento nombrado en `SUBSCRIPTION_STRATEGY.md`, y "Usuario ocasional" (`SUBSCRIPTION_STRATEGY.md`) no tiene persona equivalente en `PERSONAS.md`.

**A3. Al menos ocho listas de principios/valores con solapamiento textual parcial.**
La Constitución (8 artículos), el Credo (11 líneas "Creemos que..."), Los 12 Principios Inmutables, y PRODUCT_PRINCIPLES.md (10 principios) repiten variantes de la misma idea ("la confianza antes que el crecimiento" / "las personas antes que las métricas" / "la verdad antes que la conveniencia") con redacciones muy similares pero no idénticas, sin ninguna nota cruzada que aclare que son la misma jerarquía de valores expresada en cuatro formatos. A esto se suman tres listas adicionales de "principios" puramente técnicos/operativos (VISION_2030 — 5 principios estratégicos; MASTER_DATA_STRATEGY — 4 principios; PHARMACY_NETWORK_STRATEGY — 3 principios; DIGITAL_ASSET_REGISTER — 9 principios fundacionales), que sí tienen alcance claramente distinto (arquitectura de datos, no cultura), por lo que no se consideran duplicadas entre sí, pero sí se suman al volumen total de "principios" sin un índice que los organice.

### Medio

**M1. Propuesta de Valor formulada de forma distinta en dos documentos de producto.**
`docs/product/VISION.md` (*"encuentre rápidamente la mejor alternativa disponible"*) vs. `docs/product/PRODUCT_CANVAS.md` (*"encuentre el medicamento que necesita al mejor precio disponible en pocos segundos"*). Mismo espíritu, distinta redacción, sin fuente declarada.

**M2. La palabra "identidad" tiene dos campos semánticos no relacionados y sin desambiguación cruzada.**
En `docs/book/`, "identidad" se refiere al carácter/identidad de la organización (título del Acto II: "La Identidad"). En `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` (BC-005), `docs/enterprise/BUSINESS_SERVICES.md` (BS-009) y `docs/enterprise/ENTERPRISE_DATA_MODEL.md` (EDM-300), "identidad" se refiere exclusivamente a autenticación/autorización de usuarios, con la frase reiterada *"la identidad no forma parte del Patrimonio Digital"*. Riesgo: un futuro Brand Book que use la palabra "Identidad" en su título podría colisionar semánticamente con el vocabulario ya establecido en la capa enterprise.

**M3. "Promesa" formulada en tres formatos distintos y no cruzados.**
El cierre de la Carta del Fundador (*"No podemos quitarte esa preocupación. Pero sí podemos quitarte otra"*), el capítulo extenso "Nuestra Promesa" (`docs/book/01-acto-el-origen/06-Nuestra-Promesa.md`), y la síntesis formal de 5 pares en `docs/book/appendix/La-Promesa.md` no se citan entre sí, aunque son consistentes en contenido.

### Bajo

**B1. Referencia retirada al nombre "LET".**
Según `docs/product/DECISION_LOG.md` (entrada 2026-08-02), se corrigió una premisa incorrecta sobre una supuesta cuenta de infraestructura "LET"/"letchile", y se eliminaron esas referencias de la documentación operativa. No es una inconsistencia de identidad de marca en sí, pero es relevante tenerlo presente al consolidar nombres oficiales para evitar reintroducir una referencia ya retirada.

**B2. Índices de documentación desactualizados respecto a la estructura real.**
`docs/README.md` no menciona las carpetas `book/`, `strategy/` ni `enterprise/`, mientras que `docs/enterprise/README.md` sí las trata como núcleo de su modelo (*"1. Carta del Fundador (docs/book/) 2. Visión 2030 (docs/strategy/)"* como orden de lectura recomendado). Afecta el descubrimiento de la identidad, no su contenido.

---

## 4. Duplicación

| # | Documento A | Documento B (y otros) | Concepto duplicado | Recomendación |
|---|---|---|---|---|
| 1 | `docs/product/VISION.md` | `docs/strategy/VISION_2030.md`, `docs/book/00-front-matter/00-Clausula-Cero.md` | Propósito / Misión / Visión | `VISION_2030.md` como fuente operativa única (más completa, versionada); Cláusula Cero se mantiene como registro narrativo/fundacional (no reemplazable); **VISION.md → eliminar o convertir en referencia**. (Recomendación ya emitida por `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §3; este audit la confirma con evidencia adicional específica de marca) |
| 2 | `docs/product/PRODUCT_CANVAS.md` ("Visión de largo plazo") | `docs/product/ROADMAP.md` ("Visión") | Enunciado de visión casi idéntico (difieren en una palabra) | **Convertir ambas en referencia** a `VISION_2030.md`; eliminar la reformulación local |
| 3 | `docs/book/appendix/Como-Tomar-Decisiones.md` | `docs/book/appendix/El-Test-De-La-Confianza.md`, `docs/strategy/VISION_2030.md`, `docs/product/PRODUCT_DECISION_FRAMEWORK.md`, `docs/strategy/PHARMACY_NETWORK_STRATEGY.md`, `docs/strategy/DIGITAL_ASSET_REGISTER.md` | Marco de toma de decisiones (6 marcos) | **No fusionar** (ámbitos distintos: decisión personal/ética, funcionalidad de producto, incorporación de farmacias, activos digitales) — **sí declarar jerarquía y ámbito de cada uno**, con referencia cruzada explícita |
| 4 | `docs/book/02-acto-la-identidad/08-La-Constitucion.md` | `docs/book/03-acto-nuestra-forma-de-trabajar/22-El-Credo-De-ComparaFarma.md`, `docs/book/appendix/Los-12-Principios-Inmutables.md` | Principios/valores fundacionales (solapamiento textual) | **Mantener las tres** (cumplen función retórica distinta: ley fundamental / síntesis diaria / lista atemporal) — **agregar nota cruzada explícita** que declare que son variaciones de un mismo conjunto |
| 5 | `docs/book/appendix/Los-12-Principios-Inmutables.md` | `docs/product/PRODUCT_PRINCIPLES.md` | Principios (fundacional vs. operativo de producto) | **Mantener ambos** (ya se usan en la práctica, según `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`: *"Principio 7"* citado en actas/backlog) — **agregar referencia cruzada en ambos sentidos** (recomendación ya emitida por la auditoría documental previa) |
| 6 | `docs/book/01-acto-el-origen/06-Nuestra-Promesa.md` | `docs/book/appendix/La-Promesa.md` | La promesa de ComparaFarma (narrativa extensa vs. síntesis de 5 pares) | **Mantener ambas** — declarar cuál es la versión "citable"/oficial corta si se necesita una sola frase para uso externo |
| 7 | `docs/product/PERSONAS.md` | `docs/product/PRODUCT_CANVAS.md` ("Público objetivo"), `docs/product/SUBSCRIPTION_STRATEGY.md` ("Segmentación esperada") | Audiencias / segmentos (3 esquemas no reconciliados) | **Fusionar en un único mapa** de audiencias que relacione personas nombradas ↔ segmentos de negocio ↔ público objetivo general, señalando una única fuente |
| 8 | `docs/strategy/VISION_2030.md` ("Nuestros activos estratégicos", 7 activos) | `docs/strategy/DIGITAL_ASSET_REGISTER.md` (Patrimonio Digital, 5 categorías), `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` / `ENTERPRISE_DATA_MODEL.md` (Activos Digitales) | Patrimonio / activos estratégicos | Ya señalado internamente por el propio repositorio (`docs/product/DECISION_LOG.md`, entrada 2026-08-04, y `docs/analysis/PROJECT_INVENTORY.md` §9, ambos citados como evidencia primaria). **Fusionar/reconciliar**: el DAR es el más reciente y formal (cadena "Visión 2030 ↓ Digital Asset Register" declarada en los propios documentos enterprise) — VISION_2030 debería referenciar al DAR en lugar de mantener su propia enumeración de 7 activos |
| 9 | `docs/README.md` | `docs/enterprise/README.md` | Índice general de la documentación | **Actualizar** `docs/README.md` para incluir `book/`, `strategy/` y `enterprise/`, o **convertirlo en referencia** al mapa de `docs/enterprise/README.md` |

---

## 5. Vacíos

Se indica únicamente la ausencia; no se desarrolla ningún contenido nuevo.

- **Personalidad de marca.** No existe ningún documento ni sección que defina rasgos de carácter de ComparaFarma como marca. Lo que existe son rasgos inferibles del tono narrativo del Libro (humildad, prudencia, cercanía), nunca nombrados ni codificados como "personalidad".
- **Tono de voz.** La palabra "tono" no aparece en ningún documento revisado como concepto de marca.
- **Voz.** No existe una definición formal de quién habla, en qué persona gramatical, ni en qué circunstancias cambia el registro (el Libro usa mayoritariamente "nosotros", con una excepción a segunda persona singular no explicada).
- **Arquetipo de marca.** No existe ninguna mención a arquetipos (el cuidador, el sabio, el explorador, etc.) en ningún documento.
- **Arquitectura de marca.** No existe un documento que defina la relación entre "ComparaFarma" (nombre de marca) y "Plataforma de Inteligencia Farmacéutica" (nombre de categoría/posicionamiento) ni cómo se nombrarían eventuales sub-productos (herramientas para profesionales, API, dashboards) mencionados en `docs/strategy/VISION_2030.md` (sección "Plataforma": Personas / Profesionales / Empresas).
- **Identidad verbal.** No existe un glosario de terminología oficial, convenciones de naming, ni reglas de redacción de marca (más allá del estilo narrativo observable del Libro, que no está codificado como guía).
- **Identidad visual.** No se encontró ninguna mención a logo, paleta de color, tipografía ni sistema visual en ningún documento de los dominios revisados.
- **Análisis de competencia real.** Existe una definición filosófica de "competencia" (`docs/book/03-acto-nuestra-forma-de-trabajar/17-Nuestro-Verdadero-Competidor-Es-La-Desinformacion.md`: la desinformación, no una empresa), pero ningún documento nombra o analiza competidores reales (otras apps comparadoras, agregadores, iniciativas de farmacias).
- **Fuente única declarada para conceptos de marca.** A diferencia del resto del repositorio, que ya cuenta con una auditoría de gobierno documental general (`docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`), no existe (hasta este documento) un mapa equivalente específico para qué documento es la fuente oficial de cada concepto de identidad de marca.
- **Definición explícita de "marca" como categoría propia.** La palabra "marca" aparece pero nunca se define qué significa "la marca ComparaFarma" en sí misma, más allá de mencionarla como la última de tres categorías subordinadas en el Manifiesto.

---

## 6. Línea Narrativa

Reconstrucción basada en fechas explícitas encontradas en los documentos (cuando existen) y en la jerarquía documental que los propios documentos de `docs/enterprise/` declaran (*"Carta del Fundador ↓ Visión 2030 ↓ Digital Asset Register ↓ Business Capability Map ↓ Business Services ↓ Enterprise Data Model..."*, citada de forma idéntica en `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md` y `ENTERPRISE_DATA_MODEL.md`). Donde no hay fecha explícita, se indica así en vez de asumir una.

```
Idea inicial (un padre observa el gasto de invierno en medicamentos, sin fecha documentada)
        ↓
Carta del Fundador (docs/book/0. Carta del Fundador.md — sin fecha en el archivo)
        ↓
Libro Fundacional completo (docs/book/ — 58 capítulos: Origen, Identidad/Constitución/Manifiesto,
        Forma de Trabajar/Credo, Legado/12 Principios Inmutables — sin fecha en ningún archivo,
        confirmado por AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md §1.1)
        ↓
Producto (docs/product/VISION.md, PRODUCT_CANVAS.md, PRODUCT_PRINCIPLES.md, PERSONAS.md
        — sin fecha propia; PRODUCT_REVIEW_V1.md sí fechado 2026-06-30)
        ↓
Empresa (docs/product/COMPANY_STRATEGY.md, "De app a empresa", fechado 2026-07-19;
        SUBSCRIPTION_STRATEGY.md, ejecutado 2026-08-02 según DECISION_LOG)
        ↓
Estrategia / Visión 2030 (docs/strategy/VISION_2030.md, "Última actualización: Agosto 2026" —
        el único documento del repositorio con metadata formal de versión)
        ↓
Patrimonio Digital (docs/strategy/DIGITAL_ASSET_REGISTER.md, "Última actualización: 2026-08-03")
        ↓
Arquitectura Empresarial (docs/enterprise/BUSINESS_CAPABILITY_MAP.md, BUSINESS_SERVICES.md,
        ENTERPRISE_DATA_MODEL.md — sin fecha propia declarada, referenciados en DECISION_LOG
        el 2026-08-04)
        ↓
Auditoría Documental de Gobierno del Conocimiento (docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_
        CONOCIMIENTO_2026-08.md, 2026-08-02 — primera auditoría formal; detecta ya varias de
        las duplicidades de propósito/visión/misión/marcos de decisión confirmadas en este informe)
        ↓
Este documento: BRAND_AUDIT.md (2026-08-05)
```

Nota: la Auditoría Documental de Gobierno (2026-08-02) es cronológicamente anterior al Digital Asset Register (2026-08-03) y a la Arquitectura Empresarial (~2026-08-03/04), por lo que esa auditoría no pudo evaluar todavía esa capa más reciente — es coherente que este informe encuentre duplicidades adicionales (p. ej. la de "activos estratégicos" §4, hallazgo 8) que la auditoría de gobierno de 2026-08-02 no pudo detectar por ser posteriores en el tiempo.

---

## 7. Evaluación

**Nivel 2 — Definida**, con una lectura matizada: el núcleo de propósito/narrativa está en el límite de **Nivel 3 — Consistente**, mientras que la capa formal de marca (personalidad, tono, voz, identidad verbal/visual) está en **Nivel 1 — Incipiente**.

Evidencia a favor de una identidad ya "Definida" y parcialmente "Consistente":
- El propósito central ("ayudar a las personas a tomar mejores decisiones") se repite casi textual en al menos cinco documentos de tres dominios distintos (book, strategy, product), sin contradicciones de fondo — ver Resumen Ejecutivo §1 y Mensaje en §2.
- El término estratégico "Plataforma de Inteligencia Farmacéutica" es idéntico en siete documentos de tres dominios (strategy, product, enterprise) — es el elemento mejor consolidado de todo el repositorio.
- Existe un cuerpo narrativo fundacional extenso, coherente en tono y en argumento (58 capítulos), con una Constitución, un Manifiesto y un Credo que —aunque redundantes entre sí— nunca se contradicen de fondo.
- Existe un posicionamiento negativo consistente ("qué NO somos") repetido de forma equivalente en tres documentos.

Evidencia que impide clasificar más arriba de Nivel 2/3:
- No existe una única fuente de verdad declarada para misión, visión, principios o marcos de decisión — el propio repositorio (`docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`) ya diagnosticó la ausencia de "una única fuente de verdad declarada por tema" y la falta de "ciclo de vida ni versión formal en la mayoría de los documentos".
- Las categorías propias de una identidad de marca formal (personalidad, tono, voz, arquetipo, arquitectura de marca, identidad verbal, identidad visual) están completamente ausentes — no en desarrollo, sino inexistentes como concepto (§5).
- La palabra "marca" se usa una sola vez para referirse a ComparaFarma, y en esa única aparición queda subordinada a "aplicación" y "empresa" (`docs/book/02-acto-la-identidad/09-Manifiesto.md`).
- Documentos estratégicos clave (`docs/strategy/*`) no están bajo control de versiones, según `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` (*"untracked, cero commits"*), lo que impide considerar la capa de identidad como gobernada de forma consolidada (requisito de Nivel 4 — Consolidada).

No se cumplen los criterios de Nivel 4 (Consolidada: fuente única por tema, versionado formal, sin duplicación activa) ni de Nivel 5 (Estratégica: identidad integrada de forma medible en decisiones de negocio con gobierno activo) — aunque el marco CFPS y las "5 preguntas" de VISION_2030 apuntan en esa dirección para decisiones de producto, no existe el equivalente para decisiones de marca.

---

## 8. Recomendaciones

No se propone crear el Brand Book todavía. Se indica, con base exclusiva en la evidencia de este informe (y en línea con lo ya recomendado por `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` §3 y §8), qué documento debería ser la fuente oficial de cada tema:

| Tema | Fuente oficial recomendada | Nota |
|---|---|---|
| Propósito | `docs/strategy/VISION_2030.md` (operativo) + `docs/book/00-front-matter/00-Clausula-Cero.md` (narrativo/fundacional) | Ambos se mantienen — cumplen roles distintos (estratégico vs. cultural), no son duplicados a eliminar |
| Misión | `docs/strategy/VISION_2030.md` (operativo) | Requiere decisión explícita del CEO: reconciliar con la formulación emocional del Libro y la económica de `product/VISION.md` (Hallazgo C1) |
| Visión | `docs/strategy/VISION_2030.md` | Es ya el más completo y el único versionado formalmente |
| Valores / Principios | `docs/book/appendix/Los-12-Principios-Inmutables.md` (fundacional) + `docs/product/PRODUCT_PRINCIPLES.md` (operativo de producto) | Mantener ambos con referencia cruzada explícita; la Constitución y el Credo quedan como registro ritual/narrativo, no como fuente operativa adicional |
| Identidad (de marca) | **Ninguno todavía** | Este es el vacío central de la auditoría (§5); cualquier documento futuro de identidad de marca deberá evitar la palabra "Identidad" a secas por su colisión ya existente con `docs/enterprise/` (uso de "identidad" = autenticación de usuario) |
| Estrategia | Cadena ya declarada por los propios documentos enterprise: `docs/book/0. Carta del Fundador.md` → `docs/strategy/VISION_2030.md` → `docs/strategy/DIGITAL_ASSET_REGISTER.md` → `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` → `docs/enterprise/BUSINESS_SERVICES.md` → `docs/enterprise/ENTERPRISE_DATA_MODEL.md` | Tratar esta cadena como jerarquía vigente hasta que se decida lo contrario |
| Narrativa | `docs/book/` completo | Fuente única y no reemplazable de historia, origen y legado |

**Documentos que deberían dejar de ser fuente de verdad independiente** (confirmando y ampliando lo ya señalado por `AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md`):
- `docs/product/VISION.md` — redundante con `VISION_2030.md` y la Cláusula Cero; se recomienda retirarlo o convertirlo en referencia.
- La sección "Visión de largo plazo" de `docs/product/PRODUCT_CANVAS.md` y la sección "Visión" de `docs/product/ROADMAP.md` — deberían referenciar `VISION_2030.md` en vez de restablecer el enunciado.
- La lista de "7 activos estratégicos" de `docs/strategy/VISION_2030.md` — debería referenciar `docs/strategy/DIGITAL_ASSET_REGISTER.md` en lugar de mantener su propia enumeración paralela.

**Antes de definir cualquier marco de decisión propio de marca** (por ejemplo, un futuro "test de coherencia de marca"), se recomienda resolver primero la proliferación ya detectada de seis marcos de decisión (Hallazgo C2) — de lo contrario, un séptimo marco solo profundizaría el problema que esta auditoría documenta.

---

## 9. Roadmap

Únicamente el orden documental. No se desarrolla ningún documento de esta lista.

1. **BRAND_AUDIT** (este documento)
2. **Consolidación documental previa** — ejecutar las decisiones pendientes ya señaladas por `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` y por la sección 8 de este informe (fuente única por tema, versionado de `docs/strategy/*`, jerarquía explícita entre los seis marcos de decisión)
3. **BRAND_BOOK**
4. **VISUAL_IDENTITY**
5. **BRAND_GUIDELINES**
6. **GOOGLE_PLAY_BRAND**
7. **MARKETING_GUIDE**
