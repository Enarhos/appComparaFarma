# DESIGN_CONCEPT — Concepto de Diseño de ComparaFarma

Este documento no propone logos, no describe logos, no habla de colores, no habla de tipografías, no habla de UI ni de componentes gráficos, y no habla de marketing. Es un documento de **Arquitectura de Diseño**, no de Diseño. Responde una sola pregunta: **¿qué concepto visual representa mejor a ComparaFarma?** No responde cómo debe verse, dibujarse ni colorearse esa idea.

Todo su contenido se deriva exclusivamente de `docs/brand/BRAND_AUDIT.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/VISUAL_IDENTITY.md`, `docs/book/` (Carta del Fundador y Libro Fundacional) y `docs/strategy/VISION_2030.md`. No se inventa personalidad nueva ni se modifica la identidad ya consolidada.

Sigue obligatoriamente la estructura de `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-DES-001 |
| **Nombre** | DESIGN_CONCEPT.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO — mismo criterio ya usado en `docs/brand/VISUAL_IDENTITY.md`, `docs/brand/BRAND_FOUNDATIONS.md` y `docs/enterprise/BUSINESS_SERVICES.md` |
| **Rol asumido en su redacción** | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect |
| **Nivel de Gobierno** | Estratégico — segundo grado de derivación: se apoya directamente en `docs/brand/VISUAL_IDENTITY.md` (Estratégico), que a su vez se apoya en `docs/brand/BRAND_FOUNDATIONS.md` (Fundacional derivado) |
| **Clasificación** | Documento de Arquitectura de Diseño (semiótica de marca) |
| **Fuente Oficial** | `docs/brand/VISUAL_IDENTITY.md` (v1.0), con apoyo directo en `docs/brand/BRAND_FOUNDATIONS.md` (v1.1), `docs/brand/BRAND_AUDIT.md` (v1.0), `docs/book/` (Carta del Fundador, Manifiesto, Acto I) y `docs/strategy/VISION_2030.md` |
| **Documentos de los que depende** | `docs/brand/VISUAL_IDENTITY.md`, `docs/brand/BRAND_FOUNDATIONS.md`, `docs/brand/BRAND_AUDIT.md`, `docs/book/0. Carta del Fundador.md`, `docs/book/01-acto-el-origen/`, `docs/book/02-acto-la-identidad/09-Manifiesto.md`, `docs/strategy/VISION_2030.md`, `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` |
| **Documentos que gobierna** | Ninguno todavía. Gobernará los futuros `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY`, `DESIGN_SYSTEM`, `GOOGLE_PLAY_ASSETS` y `MARKETING_GUIDELINES`, en el orden declarado en el Roadmap de este documento (§4.10) |
| **Pregunta que responde** | ¿Qué concepto visual representa mejor a ComparaFarma? |

---

## 2. Propósito

El Concepto de Diseño es el puente entre la Arquitectura Visual (`docs/brand/VISUAL_IDENTITY.md`, que define principios y atributos de percepción) y el futuro Sistema Visual (logo, color, tipografía, iconografía). Su función no es estética: es semiótica. Mientras `VISUAL_IDENTITY.md` responde *qué principios* debe cumplir toda pieza gráfica, este documento responde *qué idea única* debe representar esa pieza — sin decidir todavía cómo se vería.

`docs/brand/BRAND_AUDIT.md` (§5, Vacíos) confirmó que no existe en el repositorio ningún concepto visual, símbolo ni metáfora de marca declarados, y su Roadmap (§9) posiciona el desarrollo de identidad visual inmediatamente antes de cualquier decisión gráfica concreta. `docs/brand/VISUAL_IDENTITY.md` (§4.9, Roadmap) ya anticipa que, entre la arquitectura de principios y el desarrollo del `LOGO_SYSTEM`, debe existir un paso intermedio de traducción conceptual — ese paso es este documento.

Este documento no resuelve el vacío de identidad visual: lo acota. Un diseñador que reciba este documento no encontrará una imagen que replicar, sino una idea que interpretar de múltiples formas legítimas.

---

## 3. Alcance

**Este documento define:**

- La relación entre este documento y `VISUAL_IDENTITY.md` (§4.1).
- El concepto visual dominante de la marca, justificado documentalmente (§4.2).
- Entre tres y cinco conceptos secundarios complementarios (§4.3).
- Un análisis de metáforas visuales coherentes con el concepto central, sin decidir ninguna (§4.4).
- El territorio conceptual — no estético — donde debe percibirse la marca (§4.5).
- El arquetipo visual implícito, derivado de `BRAND_FOUNDATIONS.md` (§4.6).
- Elementos, símbolos y recursos visuales que no deben aparecer, justificados documentalmente (§4.7).
- Una matriz reutilizable de criterios para evaluar futuras propuestas gráficas de logotipo (§4.8).
- El orden documental de los desarrollos gráficos posteriores (§4.10, Roadmap).

**Este documento NO define:**

- Logotipos, isotipos ni imagotipos concretos. Corresponde a `LOGO_SYSTEM`, pendiente.
- Colores, paletas ni códigos cromáticos. Corresponde a `COLOR_SYSTEM`, pendiente.
- Tipografías. Corresponde a `TYPOGRAPHY_SYSTEM`, pendiente.
- Interfaz de usuario, componentes de producto ni patrones de UI. Corresponde a `DESIGN_SYSTEM`, pendiente.
- Iconografía, ilustración, fotografía o motion concretos. Corresponden a documentos posteriores aún no creados.
- Comunicación externa, campañas o tono publicitario. Corresponde a `MARKETING_GUIDELINES`, pendiente.
- Personalidad, voz, tono, misión, visión, propósito o principios de identidad. Ya están consolidados en `docs/brand/BRAND_FOUNDATIONS.md`; este documento no los reinterpreta, solo los traduce a un concepto único de diseño.
- Principios de percepción visual (claridad, confianza, simplicidad, etc.) ni atributos de percepción. Ya están definidos en `docs/brand/VISUAL_IDENTITY.md` (§4.2 y §4.3); este documento los sintetiza en una idea, no los redefine.

---

## 4. Contenido principal

### 4.1 Relación con VISUAL_IDENTITY

`VISUAL_IDENTITY.md` transformó la identidad consolidada en `BRAND_FOUNDATIONS.md` en principios de percepción (claridad, confianza, transparencia, accesibilidad, humanidad, inteligencia, evidencia, neutralidad, simplicidad) y en atributos de sensación (cercana, confiable, científica, profesional, y otros marcados como pendientes por falta de evidencia). Ese documento es plural por diseño: son nueve principios y varios atributos, ninguno jerarquizado sobre los demás como "la idea" de la marca.

Este documento hace algo distinto: **sintetiza esos principios en un único concepto de diseño** — una sola idea capaz de organizar, y no solo enumerar, todo lo anterior. No convierte los principios en piezas gráficas (eso corresponde a `LOGO_SYSTEM` y a los documentos de sistema visual posteriores); los convierte en un concepto semiótico que cualquier pieza gráfica futura debería poder representar, en cualquiera de sus formas posibles.

La relación es de dependencia en una sola dirección, igual que la de `VISUAL_IDENTITY.md` respecto de `BRAND_FOUNDATIONS.md`: este documento depende de `VISUAL_IDENTITY.md`; `VISUAL_IDENTITY.md` no depende de este documento.

### 4.2 Concepto Central

**Concepto central propuesto: Orientación.**

Se descarta elegir automáticamente cualquiera de los conceptos de ejemplo sin justificación. De los candidatos evaluados, "Orientación" es el único que aparece respaldado por metáforas de navegación ya presentes, de forma literal, en los documentos fundacionales del propio proyecto — no se trata de una palabra elegida por asociación libre, sino de un concepto que la organización ya usa para describir su propio propósito:

> "Y mientras esta empresa exista, seguirá siendo **nuestro norte**." (`docs/book/0. Carta del Fundador.md`, cierre)

> "Si alguna vez una oportunidad de negocio nos obliga a olvidar a las familias para las cuales construimos ComparaFarma... **Habremos perdido el rumbo**." (`docs/book/0. Carta del Fundador.md`)

> "El descubrimiento **que nos guía** hasta hoy [...] Ese fue el verdadero descubrimiento de ComparaFarma." (`docs/book/01-acto-el-origen/04-El-Descubrimiento.md`)

> "Si en diez años las personas consultan ComparaFarma antes de comprar un medicamento del mismo modo en que hoy consultan **un mapa antes de viajar** o un comparador antes de comprar un pasaje, habremos cumplido nuestra misión." (`docs/strategy/VISION_2030.md`)

**Por qué se propone esta y no otra:**

1. Es la única idea que aparece como metáfora explícita y reiterada (norte, rumbo, guía, mapa) en al menos dos fuentes distintas — la Carta del Fundador y Visión 2030 — sin haber sido buscada intencionalmente como metáfora de diseño: la organización ya piensa en sí misma en estos términos.
2. Sintetiza, en una sola idea espacial, el mecanismo central del relato fundacional: una persona entra en un estado de incertidumbre (`docs/book/01-acto-el-origen/04-El-Descubrimiento.md`: *"El problema era la incertidumbre"*) y ComparaFarma existe para ayudarla a encontrar su camino hacia una decisión (`docs/book/00-front-matter/00-Clausula-Cero.md`: *"ayudar a las personas a tomar mejores decisiones"*). Orientación no es una palabra elegida por su atractivo estético: describe literalmente ese mecanismo.
3. Es un concepto inherentemente visual (dirección, posición, camino) sin ser todavía una forma. Esto es relevante para el criterio de éxito de este documento: un concepto que ya sugiriera una única forma (por ejemplo, "el escudo de ComparaFarma") estaría resolviendo el diseño prematuramente. "Orientación" admite múltiples expresiones visuales legítimas y no contradictorias entre sí (ver §4.4).

**Por qué no se elige "Confianza" como concepto central**, a pesar de ser, según `BRAND_AUDIT.md` (§1, Resumen Ejecutivo, y §2, "Mensaje"), el término más repetido de todo el corpus documental (`docs/book/01-acto-el-origen/04-El-Descubrimiento.md`: *"No entregar respuestas. Sino entregar confianza"*; `docs/book/02-acto-la-identidad/08-La-Constitucion.md`, Art. I: *"La confianza será siempre el patrimonio más importante de ComparaFarma"*): la confianza se describe, en la propia documentación, como el **resultado** de una experiencia bien orientada — *"El éxito comienza cuando alguien vuelve a confiar"* (`docs/book/03-acto-nuestra-forma-de-trabajar/21-Como-Medimos-El-Exito.md`) — no como el mecanismo mismo. Un concepto de diseño centrado en "confianza" tiende, además, a convertirse rápidamente en símbolos genéricos ya asociados a otras categorías (candados, escudos, sellos de garantía — ver §4.7), que son precisamente el tipo de resolución prematura que este documento debe evitar. "Confianza" se conserva como el concepto secundario más importante (§4.3), por ser el resultado que la orientación produce.

### 4.3 Conceptos Secundarios

Se identifican cinco conceptos complementarios, cada uno con respaldo documental directo. Ninguno reemplaza al concepto central; cada uno lo enriquece desde un ángulo distinto.

1. **Confianza** — el resultado que produce la orientación lograda. `docs/book/02-acto-la-identidad/08-La-Constitucion.md`, Art. I: *"La confianza será siempre el patrimonio más importante de ComparaFarma"*; `BRAND_FOUNDATIONS.md` §9 (Visión): *"reconocida por la confianza de su información antes que por la cantidad de funcionalidades"*.
2. **Decisión** — el objeto al que sirve la orientación. Es, según `BRAND_AUDIT.md` (§2, "Mensaje"), la frase más consolidada de todo el repositorio: *"ayudar a las personas a tomar mejores decisiones"*, presente casi textual en al menos cinco documentos de tres dominios distintos.
3. **Claridad** — el medio por el cual se logra la orientación. `BRAND_FOUNDATIONS.md` §11.1, Principio IV: *"La claridad antes que la complejidad."*
4. **Evidencia** — el fundamento epistémico de una orientación confiable, no arbitraria. `BRAND_FOUNDATIONS.md` §11.1, Principio VI: *"La evidencia antes que el ego"*; `docs/product/PRODUCT_PRINCIPLES.md`, Principio 8: *"Datos antes que opiniones"* (citado en `BRAND_FOUNDATIONS.md` §11.2).
5. **Cuidado / Humanidad** — la razón emocional detrás de la orientación; evita que el concepto central se perciba como frío o puramente funcional. `docs/book/0. Carta del Fundador.md`: *"Nosotros no vemos búsquedas. Vemos personas."*; `BRAND_FOUNDATIONS.md` §15: *"Protectora / cercana a la familia."*

### 4.4 Metáforas Visuales

Se analizan ocho metáforas candidatas frente al concepto central ("Orientación") y frente a la identidad ya consolidada. **Ninguna se decide ni se recomienda como definitiva** — esa decisión corresponde a `LOGO_SYSTEM`. Se indica únicamente cuáles son coherentes para su exploración futura y cuáles deben descartarse, con justificación.

**Coherentes con la identidad — recomendadas para exploración futura en `LOGO_SYSTEM`:**

- **Mapa.** Máxima coherencia: es la única metáfora que aparece de forma literal y explícita como comparación directa con ComparaFarma en una fuente oficial (`docs/strategy/VISION_2030.md`: *"consultan un mapa antes de viajar"*). Un mapa informa y orienta sin decidir por quien lo consulta — coherente con `BRAND_FOUNDATIONS.md` §15: *"Una buena experiencia ayuda a decidir. Nunca empuja a decidir."*
- **Brújula.** Coherente por derivación directa de "nuestro norte" y "rumbo" (`docs/book/0. Carta del Fundador.md`, ver §4.2). Una brújula no impone un destino: ayuda a mantener una dirección elegida por quien la usa, lo cual es coherente con el mismo principio de no manipulación citado arriba.
- **Constelación.** Coherente por asociación funcional: las constelaciones han cumplido históricamente una función de orientación (navegación) equivalente a la de la brújula y el mapa, y además sugieren múltiples puntos dispersos (análogos a múltiples farmacias y precios) que, vistos en conjunto, forman un patrón legible — coherente con `docs/product/PRODUCT_CANVAS.md` (diferenciadores: comparación entre múltiples farmacias, citado en `BRAND_FOUNDATIONS.md` §14).

**Coherentes con matices — requieren análisis adicional antes de avanzar:**

- **Lente.** Coherente con los conceptos secundarios de Claridad y Evidencia (una lente enfoca y clarifica), pero no tiene respaldo textual directo en ninguna fuente revisada. Se marca como explorable, no como recomendada con la misma fuerza que mapa/brújula/constelación.
- **Faro.** Comparte el campo semántico de "guía" (`docs/book/01-acto-el-origen/04-El-Descubrimiento.md`: *"el descubrimiento que nos guía"*), pero un faro connota además autoridad de rescate y advertencia de peligro ("sigue mi luz o naufragas"), un rol más directivo que el de ComparaFarma. Antes de avanzar con esta metáfora debe verificarse que su expresión visual no contradiga `BRAND_FOUNDATIONS.md` §15 (*"respetuosa de la autonomía de quien decide, no manipuladora"*).

**Descartadas explícitamente — contradicen la identidad consolidada:**

- **Red.** Se descarta porque la palabra "red" ya tiene, en el repositorio, un significado operativo distinto y ya consolidado: la red de farmacias asociadas (`docs/strategy/PHARMACY_NETWORK_STRATEGY.md`). Usarla también como metáfora de marca reproduciría el mismo tipo de colisión semántica que `BRAND_AUDIT.md` ya identificó para "patrimonio" (hallazgo Crítico C3) y para "identidad" (hallazgo Medio M2): una palabra, dos significados no relacionados.
- **Puente.** Se descarta porque un puente sugiere visualmente una conexión entre dos partes de una transacción (por ejemplo, entre la persona y la farmacia), lo que reforzaría una lectura de intermediario comercial — exactamente lo que `BRAND_FOUNDATIONS.md` §12 excluye de forma explícita: *"No somos un marketplace"*, *"No privilegiamos una farmacia por sobre otra por conveniencia comercial"*.
- **Prisma.** Se descarta porque un prisma dispersa una entrada única en múltiples salidas (la luz blanca se separa en colores), un movimiento conceptualmente inverso al que describe la documentación: ComparaFarma toma múltiples entradas dispersas (precios de distintas farmacias) y las resuelve en una única salida clara (`docs/product/PRODUCT_CANVAS.md`: *"encuentre el medicamento que necesita al mejor precio disponible en pocos segundos"*, citado en `BRAND_FOUNDATIONS.md` §14). Un prisma representaría lo contrario de la propuesta de valor.

### 4.5 Territorio Visual

Se describe percepción, no diseño.

**No pertenece al territorio de:**

- **Descuentos y promociones** — `BRAND_FOUNDATIONS.md` §10 (La Promesa): *"No prometemos tener siempre el precio más bajo. Prometemos mostrar la información de la forma más clara y útil posible"*. Un territorio de ofertas centraría la percepción en el precio, subordinando la claridad y la orientación que son el concepto central.
- **Farmacia / clínica** — `BRAND_FOUNDATIONS.md` §12: *"No somos una farmacia"*; *"No emitimos recomendaciones médicas ni diagnósticos"*.
- **Comercio electrónico transaccional** — `BRAND_FOUNDATIONS.md` §12: *"No somos un marketplace"*, *"No vendemos medicamentos"*.
- **Entidad financiera o aseguradora** — por extensión de categoría ya señalada en `docs/brand/VISUAL_IDENTITY.md` (§4.7): la categoría declarada excluye a ComparaFarma de actuar como intermediario de riesgo o de seguros.
- **Portal gubernamental o regulatorio** — `BRAND_FOUNDATIONS.md` §11.1, Principio VII: *"La independencia antes que la rentabilidad"*; ComparaFarma se describe como una plataforma privada e independiente, no como una autoridad estatal.

**Pertenece al territorio de:**

- **Decisiones** — concepto secundario directamente citado (§4.3.2); es, según `BRAND_AUDIT.md`, la idea mejor consolidada de todo el repositorio.
- **Orientación / conocimiento aplicado** — concepto central de este documento (§4.2); coherente con la categoría "Plataforma de Inteligencia Farmacéutica" (`BRAND_FOUNDATIONS.md` §5, §13).
- **Confianza** — concepto secundario más citado del corpus (§4.3.1).
- **Cuidado familiar** — `docs/book/0. Carta del Fundador.md`: *"Un padre buscando un antibiótico para su hija [...] Nosotros no vemos búsquedas. Vemos personas"*.
- **Tranquilidad** — `docs/book/01-acto-el-origen/04-El-Descubrimiento.md`: *"Queremos que cada persona termine una búsqueda sintiendo [...] tranquilidad"*.

### 4.6 Arquetipo Visual

`BRAND_AUDIT.md` (§5, Vacíos) confirmó que la palabra "arquetipo" no aparece en ningún documento del repositorio. Lo que sigue no es, por tanto, una cita literal, sino una derivación analítica a partir de los rasgos de personalidad ya consolidados en `docs/brand/BRAND_FOUNDATIONS.md` §15 y de los patrones narrativos de la Carta del Fundador — se presenta con la misma reserva que ya aplica a la Personalidad en su documento de origen (lectura inicial, no ratificada formalmente).

Los rasgos consolidados en `BRAND_FOUNDATIONS.md` §15 (humilde, protectora/cercana a la familia, honesta/franca, prudente, racional/poco jerárquica, respetuosa de la autonomía) combinados con el patrón de "guía" ya identificado en §4.2 (*"el descubrimiento que nos guía"*) corresponden, dentro del marco analítico de arquetipos de marca de uso común en diseño (citado aquí únicamente como herramienta de análisis, no como fuente del proyecto), a una combinación de dos arquetipos: **el Sabio** (motivado por la búsqueda de la verdad y el uso de evidencia para ayudar a comprender — coherente con §11.1 Principio VI, "la evidencia antes que el ego") y **el Cuidador** (motivado por la compasión y el deseo de proteger — coherente con §15, "protectora/cercana a la familia", y con la Carta del Fundador: "Nosotros no vemos búsquedas. Vemos personas").

**Arquetipos explícitamente excluidos, por contradecir evidencia directa:**

- **El Gobernante** — sugeriría autoridad sobre la decisión del usuario, contrario a §15: *"Nunca empuja a decidir."*
- **El Mago** — sugeriría transformación o promesa hiperbólica, contrario a §10 (La Promesa): *"No prometemos tener siempre la respuesta."*
- **El Héroe** — centraría a ComparaFarma como protagonista, contrario a la Carta del Fundador: *"Nosotros no vemos búsquedas. Vemos personas"* (la persona, no la marca, es el protagonista).
- **El Bufón** — contradice el tono institucional y solemne ya consolidado en `BRAND_FOUNDATIONS.md` §17 (*"Lo escribimos para orientar decisiones"*, no para entretener).

### 4.7 Elementos que NO deben aparecer

| Elemento a evitar | Justificación documental |
|---|---|
| Cruces farmacéuticas, serpiente y vara, símbolos clínicos | Riesgo de parecer una farmacia o un laboratorio — `BRAND_FOUNDATIONS.md` §12: *"No somos una farmacia"*; `docs/brand/VISUAL_IDENTITY.md` §4.7 |
| Batas blancas, estetoscopios, íconos de autoridad médica | `BRAND_FOUNDATIONS.md` §12: *"No emitimos recomendaciones médicas ni diagnósticos"*, *"No reemplazamos la atención de profesionales de la salud"* |
| Signos de dinero, monedas, etiquetas de oferta/descuento | `BRAND_FOUNDATIONS.md` §10: *"No prometemos tener siempre el precio más bajo"* — centraría la percepción en precio, no en orientación/claridad |
| Candados, escudos de "seguridad" tipo fintech | Riesgo de parecer una aseguradora o entidad financiera — ver descarte de "aseguradora" en `docs/brand/VISUAL_IDENTITY.md` §4.7 |
| Redes o nodos que sugieran una red comercial de farmacias | Colisión semántica con "red de farmacias" (`docs/strategy/PHARMACY_NETWORK_STRATEGY.md`), mismo argumento que el descarte de la metáfora "Red" en §4.4 de este documento |
| Elementos de urgencia agresiva (cuentas regresivas, "compra ahora", badges de urgencia) | `BRAND_FOUNDATIONS.md` §18: *"No usaremos patrones de diseño que dificulten decidir con libertad"*; §15: *"Nunca empuja a decidir"* |
| Puentes o conectores entre dos partes de una transacción | Sugeriría intermediación comercial — `BRAND_FOUNDATIONS.md` §12: *"No somos un marketplace"* (ver descarte de la metáfora "Puente" en §4.4) |
| Prismas o dispersión de un elemento único en múltiples salidas | Representaría el proceso inverso a la propuesta de valor (consolidar múltiples fuentes en una respuesta clara) — ver §4.4 |
| Sellos o insignias de autoridad regulatoria/gubernamental | `BRAND_FOUNDATIONS.md` §11.1, Principio VII: *"La independencia antes que la rentabilidad"* — ComparaFarma no es una entidad estatal |

### 4.8 Criterios para evaluar propuestas gráficas

Matriz reutilizable. Cada futura propuesta de logotipo (u otra pieza central del sistema visual) deberá evaluarse contra estos criterios antes de avanzar. La columna "Evaluación" se deja vacía en este documento: debe completarse en el momento de evaluar una propuesta concreta, en `LOGO_SYSTEM` o donde corresponda.

| # | Criterio | Justificación documental | Evaluación |
|---|---|---|---|
| 1 | ¿Representa el concepto central (Orientación)? | §4.2 de este documento | — |
| 2 | ¿Refuerza el concepto de Confianza? | §4.3.1; `BRAND_FOUNDATIONS.md` §9, §11.1 | — |
| 3 | ¿Es coherente con la categoría "Plataforma de Inteligencia Farmacéutica"? | `BRAND_FOUNDATIONS.md` §5, §13 | — |
| 4 | ¿Evita parecer una farmacia, un laboratorio, una aseguradora, un marketplace o un portal gubernamental? | `BRAND_FOUNDATIONS.md` §12; `docs/brand/VISUAL_IDENTITY.md` §4.7; §4.5 de este documento | — |
| 5 | ¿Evita los elementos y símbolos descartados en §4.7 de este documento? | §4.7 de este documento | — |
| 6 | ¿Es coherente con el tono institucional, no publicitario, ya consolidado? | `BRAND_FOUNDATIONS.md` §17 | — |
| 7 | ¿Respeta la autonomía de quien decide, sin sugerir manipulación ni urgencia artificial? | `BRAND_FOUNDATIONS.md` §15, §18 | — |
| 8 | ¿Puede perdurar diez años sin quedar asociado a una moda gráfica pasajera? | Coherente con la naturaleza de documento fundacional del proyecto y con `BRAND_FOUNDATIONS.md` §11.1, Principio X ("la mejora continua antes que la complacencia", que exige perdurabilidad de fondo, no reinvención cosmética constante) | — |
| 9 | ¿La propuesta admite, en principio, más de una expresión gráfica distinta bajo el mismo concepto, o conduce inevitablemente a una única solución? | Criterio de éxito de este documento (ver Objetivo del encargo bajo el cual fue creado): si un concepto conduce naturalmente a una única solución gráfica, está resolviendo el diseño demasiado pronto | — |

### 4.9 Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Concepto Central — Orientación | `docs/book/0. Carta del Fundador.md` ("nuestro norte", "rumbo"); `docs/book/01-acto-el-origen/04-El-Descubrimiento.md` ("nos guía"); `docs/strategy/VISION_2030.md` ("mapa antes de viajar") | ✔ — decisión editorial justificada (§4.2) | Pendiente de ratificación formal por el CEO/fundador, igual que otras decisiones editoriales de `BRAND_FOUNDATIONS.md` |
| Confianza (secundario) | `BRAND_FOUNDATIONS.md` §9, §11.1, §18; Constitución Art. I | ✔ (§4.3.1) | Concepto más citado de todo el corpus, según `BRAND_AUDIT.md` §1 |
| Decisión (secundario) | `BRAND_AUDIT.md` §2 ("Mensaje") | ✔ (§4.3.2) | Frase más consolidada del repositorio |
| Claridad (secundario) | `BRAND_FOUNDATIONS.md` §11.1, Principio IV | ✔ (§4.3.3) | — |
| Evidencia (secundario) | `BRAND_FOUNDATIONS.md` §11.1, Principio VI; `docs/product/PRODUCT_PRINCIPLES.md` | ✔ (§4.3.4) | — |
| Cuidado/Humanidad (secundario) | `docs/book/0. Carta del Fundador.md`; `BRAND_FOUNDATIONS.md` §15 | ✔ (§4.3.5) | — |
| Metáforas visuales (mapa, brújula, constelación, lente, faro, red, puente, prisma) | `docs/strategy/VISION_2030.md`; `docs/book/0. Carta del Fundador.md` | Analizadas, ninguna decidida (§4.4) | Tres recomendadas, dos con reserva, tres descartadas explícitamente; decisión final pendiente de `LOGO_SYSTEM` |
| Territorio Visual | `BRAND_FOUNDATIONS.md` §10, §11.1, §12; `docs/brand/VISUAL_IDENTITY.md` §4.7 | ✔ (§4.5) | Consistente con las restricciones ya definidas en `VISUAL_IDENTITY.md` |
| Arquetipo Visual (Sabio + Cuidador) | `BRAND_FOUNDATIONS.md` §15; `docs/book/0. Carta del Fundador.md` | Derivación analítica, no cita literal (§4.6) | La palabra "arquetipo" está confirmada como vacío en `BRAND_AUDIT.md` §5; pendiente de ratificación |
| Elementos que no deben aparecer | `BRAND_FOUNDATIONS.md` §12, §18; `docs/brand/VISUAL_IDENTITY.md` §4.7 | ✔ (§4.7) | — |

---

## 5. Relaciones

`DESIGN_CONCEPT.md` depende, en cadena, de tres documentos que no reemplaza:

- **`docs/brand/VISUAL_IDENTITY.md`** — fuente inmediata: define los principios y atributos de percepción que este documento sintetiza en un concepto único. La relación es de dependencia estricta y en una sola dirección (ver §4.1).
- **`docs/brand/BRAND_FOUNDATIONS.md`** — fuente de segundo grado: consolida quién es ComparaFarma; este documento no vuelve a consolidarla, solo la traduce a un concepto semiótico.
- **`docs/brand/BRAND_AUDIT.md`** — fuente del diagnóstico original: confirmó el vacío de concepto visual y ubicó este documento en el roadmap de marca.

Adicionalmente, este documento cita directamente **`docs/book/`** (Carta del Fundador, Acto I, Manifiesto) y **`docs/strategy/VISION_2030.md`**, por instrucción expresa del encargo bajo el cual fue creado, para verificar que el concepto central y las metáforas propuestas tengan respaldo en la fuente primaria, no solo en su resumen dentro de `BRAND_FOUNDATIONS.md`.

**Observación de gobierno documental:** `docs/brand/VISUAL_IDENTITY.md` (§1, "Documentos que gobierna") no incluye actualmente a `DESIGN_CONCEPT.md` en su lista de documentos gobernados, a pesar de que el Roadmap de este mismo documento (§4.10) lo posiciona inmediatamente después de `VISUAL_IDENTITY.md`. Se deja esta observación registrada para que una futura revisión de gobierno de `docs/brand/VISUAL_IDENTITY.md` la incorpore; este documento no modifica `VISUAL_IDENTITY.md` por no estar dentro de su alcance.

Este documento no tiene relación directa con la Arquitectura Empresarial (`docs/enterprise/`) ni con el Patrimonio Digital (`docs/strategy/DIGITAL_ASSET_REGISTER.md`), por el mismo motivo ya declarado en `docs/brand/BRAND_FOUNDATIONS.md` §20 y en `docs/brand/VISUAL_IDENTITY.md` §5: esos dominios modelan capacidades, datos y servicios, no concepto ni expresión de marca.

---

## 6. Matriz de Trazabilidad

Ver §4.9, dentro de "Contenido principal". Se ubica allí, y no como sección aislada, por la misma razón ya declarada en `docs/brand/VISUAL_IDENTITY.md` §6: cada fila corresponde directamente a una subsección de contenido de este documento.

---

## 7. Gobierno

`DESIGN_CONCEPT.md` **no reemplaza**:

- `docs/brand/VISUAL_IDENTITY.md` — sigue siendo la única fuente de principios y atributos de percepción visual.
- `docs/brand/BRAND_FOUNDATIONS.md` — sigue siendo la única fuente de verdad sobre quién es ComparaFarma.
- `docs/brand/BRAND_AUDIT.md`, `docs/book/` y `docs/strategy/VISION_2030.md` — siguen siendo las fuentes documentales primarias.

Toda futura revisión de los principios o atributos en `VISUAL_IDENTITY.md`, o de la identidad en `BRAND_FOUNDATIONS.md`, debe propagarse a este documento; este documento no debe modificarse de forma independiente de sus fuentes. Cuando exista una discrepancia, prevalece la fuente original — mismo principio de gobierno ya declarado en `docs/enterprise/README.md`: *"Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad."*

Este documento se mantiene, por mandato explícito de su propio encargo, dentro del dominio de Arquitectura de Diseño: no decide logotipos, colores, tipografías, UI ni componentes gráficos concretos. Ninguna decisión de ese tipo corresponde a este documento, sin importar cuán específico parezca el análisis de metáforas o territorio — esa frontera es una restricción deliberada de alcance (§3), no una omisión editorial.

**Criterio de éxito declarado para este documento:** un diseñador profesional debería poder crear diez propuestas de logotipo completamente distintas entre sí, y las diez deberían ser coherentes con ComparaFarma, porque todas compartirían el mismo Concepto de Diseño (Orientación) y evitarían los mismos elementos descartados (§4.7). Si, en cambio, este documento condujera naturalmente a una única solución gráfica, debería considerarse que resolvió el diseño demasiado pronto y requeriría revisión.

---

## 8. Documentos relacionados

- `docs/brand/VISUAL_IDENTITY.md` — fuente directa de principios y atributos que este documento sintetiza.
- `docs/brand/BRAND_FOUNDATIONS.md` — fuente de identidad consolidada de la que se deriva todo el análisis.
- `docs/brand/BRAND_AUDIT.md` — diagnóstico de origen; confirma los vacíos de concepto visual y arquetipo, y define el lugar de este documento en el roadmap.
- `docs/book/0. Carta del Fundador.md` — fuente primaria de las metáforas de orientación ("norte", "rumbo") que fundamentan el concepto central.
- `docs/book/01-acto-el-origen/04-El-Descubrimiento.md` — fuente primaria de la metáfora de "guía" y del mecanismo incertidumbre→orientación→decisión.
- `docs/book/02-acto-la-identidad/09-Manifiesto.md` — fuente primaria de contraste conceptual usada para verificar coherencia.
- `docs/strategy/VISION_2030.md` — fuente primaria de la metáfora del mapa y de la categoría "Plataforma de Inteligencia Farmacéutica".
- `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` — estándar documental aplicado en la estructura de este documento.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Define el concepto de diseño de ComparaFarma: concepto central (Orientación, con justificación documental), cinco conceptos secundarios, análisis de ocho metáforas visuales candidatas (tres recomendadas, dos con reserva, tres descartadas explícitamente), territorio visual, arquetipo visual derivado (Sabio + Cuidador), elementos que no deben aparecer, matriz reutilizable de criterios de evaluación de propuestas gráficas, y roadmap documental posterior. No incluye ninguna propuesta de logo, color, tipografía ni pieza gráfica. | `docs/brand/VISUAL_IDENTITY.md` v1.0; `docs/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/brand/BRAND_AUDIT.md` v1.0; `docs/book/0. Carta del Fundador.md`; `docs/strategy/VISION_2030.md`; `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-02 | Auditoría de Gobierno Documental general del repositorio | CTO (rol de Arquitecto de Documentación) | `docs/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Auditoría de identidad de marca | Brand Strategist / Corporate Historian / Enterprise Architect | `docs/brand/BRAND_AUDIT.md` v1.0 |
| 2026-08-05 | Consolidación de identidad de marca | Chief Brand Officer / Corporate Historian / Document Architect | `docs/brand/BRAND_FOUNDATIONS.md` v1.0 |
| 2026-08-05 | Revisión de gobierno documental y elevación al estándar de la Arquitectura Empresarial | Enterprise Documentation Architect | `docs/brand/BRAND_FOUNDATIONS.md` v1.1 y `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` v1.0 |
| 2026-08-05 | Definición de la arquitectura de identidad visual | Brand Architect / UX Strategist / Design System Architect | `docs/brand/VISUAL_IDENTITY.md` v1.0 |
| 2026-08-05 | Definición del concepto de diseño | Director Creativo / Brand Strategist / Semiotic Designer / Enterprise Architect | `docs/brand/DESIGN_CONCEPT.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador. En particular, la elección de "Orientación" como concepto central (§4.2) y la derivación del arquetipo visual (§4.6) quedan sujetas a esa misma ratificación futura, con la misma reserva ya aplicada a la Personalidad en `BRAND_FOUNDATIONS.md` §15.
