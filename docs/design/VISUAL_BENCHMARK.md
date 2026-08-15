# VISUAL_BENCHMARK — Benchmark Visual y Dirección Creativa (VISUAL-001)

**Naturaleza de este documento:** investigación y dirección creativa. No es un documento de gobernanza de marca (no sigue `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md` a propósito, por instrucción explícita del encargo VISUAL-001) y no toma ninguna decisión. No se modificó ningún archivo de `web/`, `mobile/`, `api/` ni de la arquitectura de marca ya vigente (`docs/brand/`). No contiene código, componentes, Figma ni CSS.

**Rol asumido:** Director de Diseño UX/UI e investigador de identidad visual.

**Punto de partida obligatorio:** este benchmark no redefine la marca. Se apoya en lo que `docs/brand/` y `docs/design/` ya tienen resuelto y ratificado como arquitectura (aunque pendiente de ratificación formal del CEO/fundador en varios puntos, como señalan sus propios documentos):

- **Concepto central ya aprobado como ancla de proceso:** *Orientación* (`docs/brand/DESIGN_CONCEPT.md` §4.2; `docs/design/DESIGN_DECISION_LOG.md`, DD-001).
- **Territorio visual:** Decisiones, Orientación, Confianza, Cuidado familiar (`DESIGN_CONCEPT.md` §4.5).
- **Atributos con respaldo directo:** Cercana, Confiable, Científica, Profesional; por extensión — Limpia. *Moderna* y *Optimista* siguen marcados como pendientes de definición — este benchmark los trata como hipótesis a explorar, no como atributos ya decididos (`docs/brand/VISUAL_IDENTITY.md` §4.3).
- **Restricciones ya vigentes** (`DESIGN_CONCEPT.md` §4.7, `VISUAL_IDENTITY.md` §4.7, `DESIGN_BRIEF.md` §4.10): nada que evoque farmacia, laboratorio, clínica, marketplace/e-commerce, aseguradora o entidad gubernamental; sin cruces farmacéuticas, batas blancas, candados/escudos tipo fintech, signos de dinero/ofertas, redes/nodos, urgencia agresiva, puentes ni prismas.

Todo lo que sigue se filtra a través de estas restricciones. Cuando una referencia de benchmark choca con alguna, se señala explícitamente en la columna "Qué NO copiar" — no se descarta la referencia completa, porque casi siempre hay algo rescatable en otro nivel (principio de composición, tipografía, motion) aunque el elemento concreto no sea trasladable.

---

## 1. Benchmark Visual

13 empresas tecnológicas, ninguna farmacéutica. Se agrupan libremente por afinidad con las tres direcciones que se exploran en la sección 3, pero cada referencia aporta algo independientemente de en qué dirección termine usándose.

### Minimal Tech — alta gama, mucho blanco/negro, un solo acento

**Linear** — *Qué transmite:* precisión y foco; una herramienta hecha por gente que piensa en sistemas. *Qué hace bien:* aplica un único color de marca (el "Linear purple") con tanta disciplina y consistencia entre producto, documentación, changelog y redes que el color solo ya funciona como firma, sin necesidad del logo. *Qué NO copiar:* el modo oscuro por defecto en todo momento — ComparaFarma es una app de uso familiar e intergeneracional, no una herramienta de ingeniería; oscuro-por-defecto puede sentirse frío o poco accesible para el público real del producto. *Qué podría inspirar:* la idea de "un acento, aplicado con disciplina en todas las superficies" es directamente aplicable al color de marca que definirá `COLOR_SYSTEM` sin necesidad de copiar el tono morado ni el modo oscuro.

**Stripe** — *Qué transmite:* infraestructura seria, de fondo, en la que se puede confiar sin pensarlo dos veces. *Qué hace bien:* contraste alto (negro sobre blanco, sin grises intermedios "sucios"), tipografía de peso intermedio con mucho espacio en blanco alrededor de cada afirmación. *Qué NO copiar:* la estética general "fintech" de Stripe (paneles de transacciones, tarjetas de crédito, flujos de dinero) es exactamente el código visual que `DESIGN_CONCEPT.md` §4.7 pide evitar (candados/escudos de seguridad tipo fintech). *Qué podría inspirar:* la jerarquía tipográfica y el uso de espacio en blanco como herramienta de claridad — trasladable sin tocar nada relacionado con dinero o transacciones.

**Vercel** — *Qué transmite:* velocidad y precisión técnica. *Qué hace bien:* monocromía estricta con altísimo contraste, cero decoración. *Qué NO copiar:* su identidad está pensada para una audiencia 100% desarrolladora; ese registro es demasiado técnico/frío para una audiencia familiar que compara precios de medicamentos. *Qué podría inspirar:* el patrón "producto como héroe" (mostrar la interfaz real, sin fotografía de stock) es un principio de composición aplicable a cualquier landing, no solo a herramientas de desarrollo.

**Raycast** — *Qué transmite:* velocidad sin fricción. *Qué hace bien:* un logomark geométrico simple (un cursor estilizado) que funciona a cualquier tamaño, incluso en el ícono de sistema de 16-24px. *Qué NO copiar:* el rojo intenso sobre negro puro es un registro de "herramienta de poder para expertos", no de "compañía cercana y de cuidado familiar". *Qué podría inspirar:* la exigencia de legibilidad del símbolo a tamaños mínimos es exactamente el mismo requisito funcional que ya declaró `docs/design/DESIGN_BRIEF.md` §4.12 para favicon/ícono de sistema/avatar.

### Data Intelligence — densidad de datos hecha legible

**Mercury** — *Qué transmite:* minimalismo premium dirigido a un público que toma decisiones financieras informadas. *Qué hace bien:* paleta casi monocromática con un solo acento (índigo), tipografía muy cuidada, capacidad de mostrar datos numéricos densos sin que la pantalla se sienta abrumadora. *Qué NO copiar:* es, literalmente, un banco — su registro visual completo (tarjetas de cuenta, flujos de dinero, iconografía de seguridad) cae dentro de la categoría que ComparaFarma debe evitar por definición de marca. *Qué podría inspirar:* únicamente el principio de "cómo hacer que una tabla de números dense se sienta calmada", no ningún elemento visual concreto.

**Ramp** — *Qué transmite:* disciplina visual aplicada a un producto complejo. *Qué hace bien:* formalizó un sistema de "bento grid" (tarjetas redondeadas, gutters uniformes, jerarquía por tamaño) que se repite consistentemente en cada sección. *Qué NO copiar:* de nuevo, es una tarjeta corporativa/fintech — cualquier elemento que sugiera "tarjeta de crédito" o "gasto empresarial" no aplica. *Qué podría inspirar:* el bento grid como patrón de layout para comparar información de varias farmacias en paralelo (ver sección 7, Comparación) — es un patrón de composición, no un código de marca fintech.

**Skyscanner** — *Qué transmite:* neutralidad. Es, de todo este benchmark, la referencia más cercana al modelo de negocio real de ComparaFarma: un comparador que no vende directamente lo que compara. *Qué hace bien:* se percibe como motor de búsqueda neutral enfocado en transparencia de precio, distinto de las plataformas de reserva directa con las que compite. *Qué NO copiar:* su capa de monetización (ofertas destacadas, aerolíneas patrocinadas) es precisamente el tipo de sesgo comercial que `BRAND_FOUNDATIONS.md` §12 excluye explícitamente para ComparaFarma ("no privilegiamos una farmacia por sobre otra por conveniencia comercial"). *Qué podría inspirar:* cómo comunicar visualmente neutralidad —ausencia de "destacados" o "patrocinados"— es un principio directamente aplicable al Color de Marca §4.2 de `COLOR_SYSTEM.md`.

**Oura** — *Qué transmite:* lo que su propio equipo llama "poder silencioso" — tecnología que se siente presente pero nunca invasiva ni alarmista. *Qué hace bien:* evita por completo la estética de "cultura del rendimiento" (sin atletas de élite, sin urgencia, sin alarmas rojas); prioriza contar una historia de datos de forma calmada. *Qué NO copiar:* sigue siendo, en el fondo, un producto de salud/bienestar personal — cualquier ícono de anillo, pulso o biometría corporal cruzaría hacia el territorio clínico que ComparaFarma debe evitar. *Qué podría inspirar:* es la referencia más valiosa de este benchmark para resolver la tensión "Científica/Profesional sin volverse fría" que pide `DESIGN_BRIEF.md` §4.8 — demuestra que se puede comunicar precisión de datos sin ansiedad ni frialdad clínica.

### Human + Technology — calidez sin perder seriedad

**Airbnb** — *Qué transmite:* pertenencia y cercanía humana. *Qué hace bien:* un color de marca cálido (coral "Rausch") que funciona como firma emocional, no solo como decoración; tono de voz personal en vez de corporativo distante. *Qué NO copiar:* el registro "lifestyle"/aspiracional con fotografía de personas en experiencias de viaje no es coherente con el tono institucional y solemne ya consolidado para ComparaFarma en salud (`BRAND_FOUNDATIONS.md` §17). *Qué podría inspirar:* la idea de un color cálido como ancla emocional de marca, sin que eso signifique volverse "publicitario" — es compatible con el atributo ya validado "Cercana".

**Notion** — *Qué transmite:* una herramienta flexible que se adapta a la persona, no al revés. *Qué hace bien:* combina una base minimalista (blanco, tipografía clara, mucho espacio) con ilustración discreta y cálida solo en los momentos que lo necesitan (onboarding, estados vacíos), nunca en la interfaz de trabajo diario. *Qué NO copiar:* nada específico — es de las referencias más directamente trasladables de todo este benchmark. *Qué podría inspirar:* el patrón "base seria y limpia + calidez dosificada solo en momentos puntuales (bienvenida, estado vacío, error)" resuelve exactamente la tensión entre "Profesional/Científica" y "Cercana/Cuidado familiar" que pide el Design Brief.

**Headspace** — *Qué transmite:* que un tema delicado (salud mental) puede tratarse con calidez sin perder seriedad profesional. *Qué hace bien:* ilustración propia, cálida y ligeramente imperfecta a propósito, que traduce conceptos abstractos y sensibles en imágenes accesibles sin banalizarlos. *Qué NO copiar:* su tono es más lúdico y "de bienestar cotidiano" que el registro solemne que `BRAND_FOUNDATIONS.md` §17 ya fijó para ComparaFarma; tampoco es literalmente trasladable el color (naranja/amarillo vivos) sin evaluación de asociación con "oferta/promoción", restringida en `DESIGN_CONCEPT.md` §4.7. *Qué podría inspirar:* es la mejor referencia de este benchmark para pensar cómo debería verse la ilustración de "cuidado familiar" que pide `DESIGN_BRIEF.md` §4.11 (personas y momentos cotidianos, nunca escenarios clínicos) — sin copiar su paleta ni su nivel de playfulness.

**Duolingo** — *Qué transmite:* energía, gamificación, personalidad de marca casi de entretenimiento. *Qué hace bien:* logró relevancia cultural masiva con una mascota y un tono casi irreverente en redes sociales. *Qué NO copiar:* es, dentro de este benchmark, el ejemplo más útil de "qué NO debe ser ComparaFarma" — el arquetipo de marca de Duolingo se acerca al Bufón, explícitamente descartado para ComparaFarma en `DESIGN_CONCEPT.md` §4.6 por contradecir el tono institucional ya consolidado. *Qué podría inspirar:* nada a nivel de tono; sirve como caso de contraste para explicar, en futuras conversaciones de diseño, por qué ComparaFarma no debe ir en esa dirección aunque sea un caso de éxito de producto.

### Referencias de metáfora literal (Orientación)

**Google Maps / Citymapper** — *Qué transmite:* orientación espacial real, sin ambigüedad. *Qué hace bien:* interfaces pensadas para decisión rápida bajo carga cognitiva baja (botones grandes, jerarquía clara entre "dónde estoy" y "hacia dónde voy"), exactamente el mismo problema de decisión rápida que enfrenta alguien comparando precios de medicamentos. *Qué NO copiar:* nada de su lenguaje de mapas literal (pines, calles, tráfico) — el `DESIGN_CONCEPT.md` §4.4 ya fue explícito en que el concepto "Orientación" no debe ilustrarse de forma literal (nada de brújulas ni mapas dibujados). *Qué podría inspirar:* el principio de diseño detrás de la orientación —minimizar la carga cognitiva en el momento exacto de decidir— es el principio de UX más directamente heredable de esta categoría completa, sin tomar ningún elemento gráfico.

---

## 2. Tendencias 2026

**Color.** La tendencia dominante en producto digital es la paleta restringida con un único acento aplicado con disciplina (Linear, Mercury, Ramp), combinada con una base neutra amplia. El modo oscuro ya se diseña en paralelo al modo claro desde el inicio del proyecto, no como variante posterior. Hay una corriente de "interfaces basadas en emoción" (uso de color para transmitir un estado, no solo para decorar). Es una tendencia general del mercado — no implica que ComparaFarma deba adoptar modo oscuro por defecto ni un acento único de tono frío; ese acento y su temperatura siguen totalmente abiertos y quedan para `COLOR_SYSTEM`.

**Tipografía.** Las fuentes variables ya se consideran infraestructura básica, no un lujo — permiten un solo archivo que cubre múltiples pesos y mejora rendimiento. Hay una corriente de tipografía cinética (texto que se anima o responde a interacción), recomendada solo para zonas de héroe/landing, nunca para interfaz de trabajo denso en datos. Las familias más licenciadas en el mercado SaaS 2026 son Söhne, Inter, GT America y Bricolage Grotesque como alternativa gratuita; Geist se consolidó como estándar entre herramientas de desarrollo y SaaS moderno. Ninguna se recomienda aquí como decisión — ver sección 5.

**Iconografía.** La conversación de mercado gira en torno a cuatro librerías con adopción real (Lucide, Phosphor, Heroicons, Tabler) y dos alternativas con menor tracción en 2026 (Material Symbols, Remix). El criterio de elección dominante ya no es solo "cuántos íconos tiene" sino "cuántos pesos/variantes ofrece sin salir de la librería" — ver sección 6.

**Motion.** El motion de 2026 es deliberadamente sutil: se usa para confirmar una acción o guiar la atención, no para impresionar. Esto es una buena noticia para ComparaFarma: es coherente con el principio ya vigente de "no manipular, no empujar a decidir" (`BRAND_FOUNDATIONS.md` §15, §18) — el motion contenido, funcional, es la norma del mercado, no la excepción.

**Landing Pages.** El patrón de layout más consolidado es el bento grid (tarjetas moduladas, esquinas redondeadas, microinteracciones dentro de cada tarjeta), popularizado originalmente por Apple. El glassmorphism sobrevivió en una versión más contenida ("Glassmorphism 2.0" o "Aurora UI"): se usa en navbars, modales y tarjetas puntuales, no como tratamiento dominante de una sección hero completa.

**Dashboards.** La dirección de 2026 favorece espacio en blanco generoso y radios de tarjeta más grandes para que la información densa se sienta calmada, en vez de la grilla de tabla plana tradicional. Para productos que comparan datos numéricos (el caso exacto de ComparaFarma), la referencia de mercado más citada es un patrón de tarjetas con jerarquía por tamaño y color de apoyo discreto — coherente con el bento grid de Ramp adaptado sin su registro fintech.

**Sistemas visuales.** La tendencia de fondo es la consistencia entre todas las superficies (producto, documentación, redes, changelog) por sobre la complejidad de cualquier pieza individual — el caso de Linear es el ejemplo de mercado más citado de esto. Es exactamente el mismo criterio que ya exige el modelo Branded House de ComparaFarma (`BRAND_ARCHITECTURE.md` §4.1): un solo sistema, no uno por canal.

---

## 3. Moodboards — Tres Direcciones

Ninguna de las tres se recomienda por sobre las otras. Se presentan para que el Product Manager decida cuál explorar primero, o si prefiere una combinación.

### Opción A — Minimal Tech

**Personalidad:** silenciosa, precisa, segura de sí misma sin necesitar decoración. Es la dirección que más se apoya en los atributos ya validados "Profesional" y "Limpia".
**Referencias:** Linear (disciplina de un solo acento), Vercel (contraste alto, cero decoración), Raycast (símbolo geométrico simple y legible a tamaño mínimo).
**Fortalezas:** es la dirección más fácil de mantener consistente entre app, web y documentación; envejece bien (coherente con el criterio de Atemporalidad de `DESIGN_BRIEF.md` §4.13); minimiza el riesgo de parecer "publicitaria" u "oferta", restricción explícita de la marca.
**Riesgos:** puede leerse como fría o distante si no se equilibra deliberadamente con el atributo "Cercana" y con la emoción "Cuidado familiar" — el mayor riesgo de esta dirección es resolver "Profesional" y perder "Humanidad" en el camino. Requiere una decisión de tipografía y color muy cuidada para no sentirse genérica (el registro "blanco + un acento" ya es extremadamente común en 2026, con riesgo de baja diferenciación — criterio ponderado en 10% en `DESIGN_BRIEF.md` §4.13).

### Opción B — Data Intelligence

**Personalidad:** analítica, ordenada, capaz de sostener mucha información sin generar ansiedad. Se apoya en el atributo "Científica" y en la categoría de marca "Plataforma de Inteligencia Farmacéutica".
**Referencias:** Ramp (bento grid para organizar información en paralelo), Skyscanner (neutralidad visual de un comparador real), Oura (cómo comunicar precisión de datos sin frialdad clínica).
**Fortalezas:** es la dirección más directamente funcional para el problema real del producto — mostrar 9 farmacias y 4 canales de precio de forma comparable; conecta mejor que ninguna otra con "Inteligencia" y "Evidencia" (`VISUAL_IDENTITY.md` §4.2).
**Riesgos:** es la dirección con mayor cercanía involuntaria al territorio fintech que la marca debe evitar (Mercury, Ramp y buena parte de las referencias de "datos densos" del mercado son productos financieros) — requiere disciplina explícita para no heredar candados, escudos, ni iconografía de seguridad de pago. También es la dirección con más riesgo de sentirse "corporativa" en vez de "cercana", si no se dosifica con calidez puntual (ver principio "base seria + calidez dosificada" de Notion en la sección 1).

### Opción C — Human + Technology

**Personalidad:** cálida, cercana, familiar — tecnología puesta al servicio de una decisión humana, nunca al revés. Es la dirección que más se apoya en los atributos "Cercana" y en el arquetipo Cuidador ya derivado en `DESIGN_CONCEPT.md` §4.6.
**Referencias:** Notion (calidez dosificada solo en momentos puntuales), Airbnb (color cálido como ancla emocional), Headspace (ilustración accesible para temas delicados, sin banalizarlos).
**Fortalezas:** es la dirección con menor riesgo de sentirse fría o corporativa; la más directamente coherente con "Cuidado familiar" y con la cita fundacional "Nosotros no vemos búsquedas. Vemos personas."
**Riesgos:** es la dirección con mayor riesgo de deslizarse hacia un registro de bienestar/salud demasiado lúdico (Duolingo) o demasiado cercano a wellness genérico, lo que podría diluir "Científica/Profesional" y hacer que la plataforma se perciba menos rigurosa de lo que su categoría ("Inteligencia Farmacéutica") exige. Requiere el mismo cuidado que ya señaló `DESIGN_BRIEF.md` §4.11 para ilustración: personas y momentos cotidianos, nunca escenarios clínicos, pero tampoco tan informal que se pierda seriedad institucional.

---

## 4. Color Research (sin definir paleta)

Este apartado investiga, no decide — coherente con `docs/brand/COLOR_SYSTEM.md`, que ya define siete responsabilidades funcionales del color sin fijar ningún valor cromático.

**Tendencias de mercado 2026:** paletas restringidas con un acento único aplicado con disciplina; modo oscuro diseñado en paralelo al claro desde el inicio; corrientes de "color emocional" (el color como señal de estado, no solo decoración); micro-acentos tipo "neón contenido" para estados de foco o notificación sobre fondos oscuros.

**Accesibilidad y contraste:** el estándar vigente sigue siendo WCAG 2.1/2.2 (mínimo 4.5:1 texto normal, 3:1 texto grande y componentes gráficos), pero la práctica de mercado en 2026 ya apunta por encima del mínimo — hay evidencia de que ratios más altos (7:1) mejoran legibilidad y conversión de forma medible. El fallo de contraste sigue siendo, según auditorías de mercado, el criterio de accesibilidad que más comúnmente incumplen los sitios web. Vale la pena que la futura selección de paleta en `COLOR_SYSTEM` se planifique ya pensando en APCA (el sucesor de WCAG 2.x actualmente en borrador para WCAG 3.0), no solo en el mínimo legal actual.

**Percepción psicológica:** la literatura de mercado es consistente en que la psicología del color varía por región y demografía, por lo que cualquier decisión final debería validarse con el público real de ComparaFarma (familias, uso intergeneracional) antes de cerrarse — no asumirse por convención de industria.

**Combinación de neutros:** la tendencia dominante en productos "serios" (Stripe, Linear, Mercury) es una base de neutros amplia (varios grises, no solo blanco/negro) sobre la que se aplica un único acento — esto es coherente con el principio de Neutralidad ya declarado como el más determinante de `COLOR_SYSTEM.md` §4.1: cualquier paleta futura debería evitar que el "color de apoyo" (por ejemplo, para indicar la farmacia más económica) se perciba como un sesgo hacia una farmacia específica.

**Colores de apoyo — asociaciones a evitar (ya restringidas por marca, no por esta investigación):** verdes y rojos de cruz farmacéutica tradicional; azul "seguro" de banca/fintech combinado con íconos de candado; naranjas/amarillos muy saturados asociados a oferta o descuento. Ninguna de estas asociaciones se resuelve aquí — quedan documentadas para que `COLOR_SYSTEM` las tenga presentes al evaluar candidatos futuros.

---

## 5. Typography Research (sin decidir tipografía)

Coherente con `docs/brand/TYPOGRAPHY_SYSTEM.md`, que ya define cinco capas funcionales (Display, Heading, Body, Caption, Data/Numeric) sin nombrar ninguna familia. Lo que sigue es un mapa de candidatas de mercado observadas en la investigación, no una selección.

| Familia | Por qué aparece en el mercado 2026 | Consideración para ComparaFarma |
|---|---|---|
| **Inter** | Fuente UI dominante del mercado, optimizada para interfaces densas en información | Punto de partida seguro para Body/Data — muy probada en legibilidad de pantalla pequeña, requisito ya fijado en `DESIGN_BRIEF.md` §4.11 |
| **Geist** | Estándar emergente entre herramientas de desarrollo y SaaS moderno (ecosistema Vercel, expandido) | Registro muy "developer tool" — evaluar si encaja con "Cercana", no solo con "Profesional" |
| **Söhne** | Reemplazó a Gotham/Proxima Nova como opción premium más licenciada | Fuerte para Display/Heading si se busca seriedad editorial sin volverse fría |
| **GT America** | Versátil, con más personalidad que Inter | Candidata para Display si "Moderna" termina ratificándose como atributo |
| **Bricolage Grotesque** | Alternativa gratuita con carácter "perfectamente imperfecto" | Interesante para explorar el atributo "Cercana" sin sacrificar seriedad — requiere prueba de legibilidad en tamaños de Data/Numeric |
| **Aeonik** | Geométrica premium, presencia frecuente en identidades tech 2026 | Candidata de Display si se prioriza un registro más geométrico/científico |

**Tendencia de infraestructura:** las fuentes variables (un solo archivo, múltiples pesos/anchos) ya se consideran requisito técnico, no diferenciador estético — cualquier familia que se evalúe formalmente debería tener una versión variable disponible, por rendimiento en `mobile/` y `web/`.

**Advertencia de uso, no de selección:** ninguna de estas familias se ha evaluado todavía contra el criterio explícito de `DESIGN_BRIEF.md` §4.11 ("Clara y Científica/Profesional sin volverse fría") ni contra soporte de tildes y ñ en español chileno — ambas verificaciones son trabajo del futuro proceso de selección tipográfica, no de este benchmark.

---

## 6. Iconography Research

Comparación de mercado entre las seis librerías solicitadas. Coherente con `docs/brand/ICONOGRAPHY_SYSTEM.md`, que ya define nueve categorías funcionales de iconografía sin seleccionar ninguna librería.

| Librería | Volumen | Pesos/variantes | Licencia | Fortaleza | Riesgo para ComparaFarma |
|---|---|---|---|---|---|
| **Lucide** | ~1.500 íconos | 1 (consistente, grilla estricta de 24px) | ISC | Default de facto del ecosistema shadcn/ui; máxima consistencia visual y tree-shaking (peso mínimo en `mobile/`/`web/`) | Un solo peso puede limitar jerarquía visual entre íconos "activos" y "de apoyo" |
| **Heroicons** | 292 íconos | 2 (outline, solid) | MIT | Curado, muy pulido, bundle pequeño | Catálogo reducido — puede faltar cobertura para categorías específicas de farmacia/canal de precio, obligando a mezclar librerías |
| **Phosphor** | ~7.700 íconos | 6 (thin, light, regular, bold, fill, duotone) | MIT | La mayor variedad de peso de todo el mercado — permite jerarquía visual sin cambiar de librería | Superficie tan grande que exige una política de curación estricta para no perder consistencia (mismo riesgo que ya señala `ICONOGRAPHY_SYSTEM.md` §4.1, principio de Consistencia) |
| **Material Symbols** | ~3.000 íconos | Fuente variable (fill/weight/grade/optical size en un solo archivo) | Apache 2.0 | Técnicamente el más flexible (una sola fuente cubre todo el rango) | Fuertemente asociado a Android/Google — riesgo de que la interfaz "se sienta Android" en vez de sentirse ComparaFarma, mismo argumento de Consistencia de marca |
| **Tabler** | ~5.000 íconos | 1 (grilla 24×24, trazo 2px) | MIT | Buen volumen, buen fallback cuando falta un ícono en librerías más chicas | Menor adopción de mercado que Lucide/Phosphor en 2026 — menos "probado en batalla" |
| **Remix Icon** | Volumen medio | 2 (line, fill) | Apache 2.0 | Gratuito para uso comercial | Requiere documentar cualquier modificación por licencia — friction operativa menor pero real |

**Dirección recomendada para explorar primero (no es una decisión final — corresponde a un futuro documento de selección, igual que la tipografía):** **Lucide** como base, por su consistencia de grilla y su alineación directa con los principios de Claridad y Simplicidad ya vigentes en `ICONOGRAPHY_SYSTEM.md` §4.1, con **Phosphor** como opción de respaldo específicamente si, al construir las nueve categorías funcionales de `ICONOGRAPHY_SYSTEM.md` §4.2, se detecta que un solo peso no alcanza para distinguir jerarquía entre íconos de navegación y de estado. Se descarta explorar Material Symbols como primera opción por su asociación visual fuerte con el sistema operativo Android, que compite con la consistencia de marca única que exige el modelo Branded House.

---

## 7. UI References

**Home.** Bento grid con jerarquía por tamaño (patrón Ramp/Apple) para organizar, sin abrumar, los distintos puntos de entrada (buscar, favoritos, alertas de precio). Evitar hero con fotografía de estilo de vida (registro Airbnb) — no coherente con el tono institucional; preferir el patrón "producto como héroe" (mostrar la comparación real) que ya usan Linear/Vercel.

**Búsqueda.** Los patrones de mercado 2026 more citados son barra de búsqueda con interpretación de intención (no solo coincidencia de texto) y filtros que pueden vivir en sidebar (desktop) o en barra horizontal compacta (mobile) — coherente con que ComparaFarma es, según `CLAUDE.md`, un producto de "uso móvil intensivo".

**Resultados.** Tarjetas con jerarquía visual clara entre precio, farmacia y canal — el mismo problema que resuelven las páginas de resultados de búsqueda de mercado (whitespace generoso, tipografía consistente, palabras clave destacadas), pero sin ranking pagado ni "destacados" — restricción propia de ComparaFarma, no del patrón de mercado.

**Comparación.** El patrón de mercado más directamente trasladable es la tabla de comparación de columnas por producto/fila por atributo (usada para comparar especificaciones de dispositivos) adaptada al bento grid de Ramp — columnas por farmacia, filas por canal de precio, con radios de tarjeta generosos para que la densidad de números se sienta calmada, siguiendo la misma dirección que ya marca la tendencia de dashboards de la sección 2.

**Dashboards** (relevante para futuras vistas de historial de precios o alertas). Espacio en blanco generoso, radios de tarjeta grandes, tipografía de datos consistente — evitando el registro "panel de banco" de Mercury/Ramp; más cercano al patrón "Oura" de contar una historia de datos de forma calmada que al patrón "terminal financiero".

---

## Nota sobre imágenes de referencia

No se creó `docs/design/assets/benchmark/` con capturas de pantalla. Las referencias de este documento son observaciones de mercado obtenidas por investigación web (ver enlaces citados durante la sesión de investigación), no capturas propias verificadas pixel a pixel — documentarlas con imágenes reales requeriría descargar material de terceros cuya licencia de uso no se verificó, lo que este sprint no está autorizado a hacer. Si el Product Manager aprueba avanzar con alguna dirección, se recomienda que el diseñador o estudio contratado recopile sus propias referencias visuales verificadas en la herramienta de su elección (Figma, Milanote, etc.), fuera de este repositorio de documentación.

---

## Cierre

Este documento no selecciona ninguna dirección, ningún color, ninguna tipografía ni ninguna librería de íconos. Es investigación y dirección creativa para que el Product Manager decida cómo continuar. Ningún archivo de `web/`, `mobile/`, `api/` ni de `docs/brand/` se modificó para producir este benchmark.

**Pendiente de definición explícita, para que el proceso de diseño no la asuma:** elección entre las tres direcciones de la sección 3 (o una combinación), validación de los atributos "Moderna"/"Optimista" con evidencia real de usuario, y la ratificación general de identidad de marca que ya está pendiente en `docs/brand/BRAND_FOUNDATIONS.md` y `BRAND_ARCHITECTURE.md`.

**Esperando aprobación del Product Manager antes de iniciar cualquier diseño.**
