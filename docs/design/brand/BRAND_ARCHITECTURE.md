# BRAND_ARCHITECTURE — ComparaFarma

Este documento no crea productos nuevos, no inventa marcas ni nombres comerciales, no hace marketing y no diseña logotipos. Responde una única pregunta, señalada como vacío explícito por `docs/design/brand/BRAND_AUDIT.md` (§5, "Arquitectura de marca"): *"No existe un documento que defina la relación entre 'ComparaFarma' (nombre de marca) y 'Plataforma de Inteligencia Farmacéutica' (nombre de categoría/posicionamiento) ni cómo se nombrarían eventuales sub-productos... mencionados en `docs/enterprise/strategy/VISION_2030.md`"*. Este documento cierra ese vacío usando exclusivamente evidencia ya existente en el repositorio — no propone una estrategia distinta a la ya documentada.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | BRD-ARC-001 |
| **Nombre** | BRAND_ARCHITECTURE.md |
| **Dominio** | Identidad de Marca (`docs/brand/`) |
| **Estado** | Draft |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Brand Architect / Product Strategist / Portfolio Architect |
| **Nivel de Gobierno** | Estratégico — establece dirección de largo plazo sobre portafolio y naming, apoyándose en un documento Fundacional derivado (`BRAND_FOUNDATIONS.md`) y en documentos de nivel Estratégico/Arquitectura Empresarial (`VISION_2030.md`, `DIGITAL_ASSET_REGISTER.md`, `BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md`, `ENTERPRISE_DATA_MODEL.md`) |
| **Clasificación** | Documento de Arquitectura de Marca / Portafolio |
| **Fuente Oficial** | Este mismo documento, para la pregunta específica de arquitectura de marca y portafolio. No es fuente oficial de identidad (`BRAND_FOUNDATIONS.md`), de percepción visual (`VISUAL_IDENTITY.md`), de concepto de diseño (`DESIGN_CONCEPT.md`), de capacidades/servicios/datos (`docs/enterprise/`), de patrimonio digital (`DIGITAL_ASSET_REGISTER.md`) ni de backlog/roadmap de producto (`docs/product/`) |
| **Documentos de los que depende** | `docs/design/brand/BRAND_AUDIT.md`, `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/brand/VISUAL_IDENTITY.md`, `docs/design/brand/DESIGN_CONCEPT.md`, `docs/enterprise/README.md`, `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `docs/enterprise/BUSINESS_SERVICES.md`, `docs/enterprise/ENTERPRISE_DATA_MODEL.md`, `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`, `docs/enterprise/strategy/VISION_2030.md`, `docs/archive/foundational-book/0. Carta del Fundador.md`, `docs/product/` (Product Documentation), `docs/archive/assessments/PROJECT_INVENTORY.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md` |
| **Documentos que gobierna** | Ninguno todavía. Debería gobernar, cuando se creen, cualquier decisión de naming de producto nuevo y el futuro `docs/enterprise/PRODUCT_PORTFOLIO.md` (pendiente en la cadena de Arquitectura Empresarial — ver §7) |
| **Pregunta que responde** | ¿Cómo se organiza la marca ComparaFarma y cómo se relacionan la empresa, la plataforma, los productos, los servicios y los activos digitales? |

---

## 2. Propósito

Este documento existe porque, según `docs/design/brand/BRAND_AUDIT.md` (§5, Vacíos), la documentación existente nunca definió explícitamente la relación entre el nombre de marca ("ComparaFarma") y el nombre de categoría/posicionamiento ("Plataforma de Inteligencia Farmacéutica"), ni cómo deberían nombrarse los productos previstos en `docs/enterprise/strategy/VISION_2030.md` (sección "Plataforma": Personas / Profesionales / Empresas). `BRAND_FOUNDATIONS.md` consolidó *quién es* ComparaFarma; la Arquitectura Empresarial (`docs/enterprise/`) y el Digital Asset Register consolidaron *qué construye* y *qué patrimonio posee*. Ninguno de los dos respondía *cómo se organiza el nombre* de todo eso hacia afuera. Ese es el propósito exclusivo de este documento.

Este documento debe servir como referencia para toda futura decisión de producto, diseño y expansión que implique nombrar algo nuevo — sin que eso signifique que este documento decide esos nombres. Decide la **arquitectura** (qué modelo de relación de marca aplica), no las **etiquetas** (qué palabra específica se usaría).

---

## 3. Alcance

**Este documento define:**

- Qué modelo de arquitectura de marca (Branded House / House of Brands / Endorsed Brands / Hybrid) describe mejor la evidencia documental existente (§4.1).
- Cuál es la marca principal de ComparaFarma y qué relación tienen entre sí empresa, plataforma y producto (§4.2).
- Un consolidado, a partir de evidencia existente, del portafolio de productos actual, en desarrollo y previsto, y de las capacidades reutilizables que los sustentan (§4.3).
- Cómo se relacionan los Business Services ya catalogados con la expresión pública de la marca (§4.4).
- Cómo deberían convivir empresa, plataforma, aplicación móvil, sitio web, API, alertas y otros activos bajo esta arquitectura (§4.5).
- Si conviene mantener "ComparaFarma" como marca única o evolucionar hacia una arquitectura de nombres derivada (§4.6).
- Reglas para incorporar productos futuros sin romper esta arquitectura (§4.7).
- Riesgos de crecimiento de marca ya visibles en la evidencia disponible (§4.8).
- El orden recomendado de documentación posterior (§4.9).

**Este documento NO define:**

- Identidad de marca (quién es ComparaFarma, misión, visión, promesa, principios, personalidad, voz, tono). Eso es `docs/design/brand/BRAND_FOUNDATIONS.md`, que este documento no modifica.
- Percepción visual ni concepto de diseño. Eso es `docs/design/brand/VISUAL_IDENTITY.md` y `docs/design/brand/DESIGN_CONCEPT.md`.
- Nombres comerciales, marcas nuevas, slogans ni logotipos. Ninguna etiqueta propuesta en este documento debe leerse como un nombre definitivo — donde se necesita un ejemplo, se usa una descripción funcional entre corchetes, nunca una propuesta de naming.
- Capacidades de negocio, servicios empresariales ni modelo de datos en detalle. Eso es `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md` y `ENTERPRISE_DATA_MODEL.md`, que este documento consolida para efectos de portafolio, sin sustituir.
- Patrimonio Digital en detalle. Eso es `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`.
- Backlog, roadmap de producto o KPIs. Eso es exclusivamente `docs/product/`.
- Campañas de marketing o comunicación externa. Eso corresponde a un futuro `MARKETING_GUIDE`, todavía no creado.
- Un Product Portfolio de Arquitectura Empresarial formal. La cadena declarada por los propios documentos de `docs/enterprise/` (*"Business Services → Product Portfolio → Operating Model"*) contempla un documento `docs/enterprise/PRODUCT_PORTFOLIO.md` que **no existe todavía** (confirmado por inspección directa del directorio). Este documento adelanta, desde la óptica de marca y con la evidencia disponible hoy, una reconstrucción de portafolio (§4.3) — pero esa reconstrucción debe ceder el lugar de fuente oficial al futuro `PRODUCT_PORTFOLIO.md` de Enterprise en cuanto este se cree (ver §7, Gobierno).

---

## 4. Contenido principal

### 4.1 Modelo de Arquitectura de Marca

Se evaluaron las cuatro alternativas solicitadas contra la evidencia documental disponible. Ninguna fuente del repositorio usa literalmente los términos "Branded House", "House of Brands", "Endorsed Brands" ni "Hybrid" (confirmado por lectura completa de `BRAND_AUDIT.md`, `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md`, `BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md`, `ENTERPRISE_DATA_MODEL.md` y `DIGITAL_ASSET_REGISTER.md) — la clasificación que sigue es un análisis propio de este documento sobre evidencia existente, no una etiqueta que ya estuviera declarada en algún lado.

**Evidencia a favor de Branded House:**

- Un único nombre, "ComparaFarma", se usa de forma idéntica para la empresa, la plataforma y cada canal de acceso, en absolutamente todos los documentos revisados (`docs/book/`, `docs/strategy/`, `docs/product/`, `docs/enterprise/`). No se encontró, en ninguno de los ocho documentos leídos íntegramente para este análisis, un solo nombre de producto que funcione como marca independiente.
- `docs/enterprise/strategy/VISION_2030.md`, sección "Qué sí somos": *"Las aplicaciones son solamente distintas formas de acceder al conocimiento generado por la plataforma... Todos consumirán la misma base de conocimiento."* — declara explícitamente que app, web, API y dashboards no son productos independientes, sino manifestaciones de una sola cosa.
- `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`: *"ComparaFarma no construye únicamente aplicaciones. ComparaFarma construye una Plataforma de Inteligencia Farmacéutica..."* — mismo patrón: un solo sujeto ("ComparaFarma"), múltiples manifestaciones sin nombre propio.
- En `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` y `BUSINESS_SERVICES.md`, los "productos consumidores" de cada capacidad/servicio se listan siempre con etiquetas funcionales genéricas — Mobile, Web, API, Analytics, Dashboard, Backoffice, Observatorio Farmacéutico — nunca con un nombre de marca propio distinto de ComparaFarma.
- `docs/design/brand/BRAND_FOUNDATIONS.md` (§5, citando el Manifiesto): *"Antes de ser una aplicación... Antes de ser una empresa... Antes de ser una marca... ComparaFarma fue una decisión."* — refuerza que existe una sola marca detrás de toda expresión del proyecto, no varias.

**Por qué se descartan las otras tres alternativas:**

- **House of Brands** requeriría evidencia de productos con nombres propios e independientes de "ComparaFarma", compitiendo o coexistiendo sin vínculo visible de marca entre sí. No existe ni un solo caso así en el repositorio.
- **Endorsed Brands** requeriría evidencia de un sub-producto con nombre propio que se presente "avalado por" ComparaFarma (ej. patrón "[Nombre], de ComparaFarma"). No existe ningún caso documentado de esa estructura.
- **Hybrid** sería prematuro de afirmar hoy: implicaría que ya existe al menos un caso real de convivencia entre marca única y sub-marca. La única evidencia que podría, en el futuro, justificar un modelo híbrido es la segmentación de audiencia de `VISION_2030.md` (sección "Plataforma": Personas / Profesionales / Empresas) — pero esa segmentación es de **audiencia**, no de **naming**: ningún documento le asigna un nombre distinto a la oferta para Profesionales o Empresas. Tratar esa segmentación como evidencia de arquitectura híbrida sería una inferencia no respaldada.

**Recomendación: Branded House.**

ComparaFarma opera hoy, y toda la evidencia documental sugiere que debe seguir operando, como una **casa de marca única**: un solo nombre ("ComparaFarma") cubre a la empresa, la plataforma y todos sus canales de acceso (app móvil, sitio web, API, panel administrativo, y los productos previstos en `VISION_2030.md`). No hay evidencia de que ningún producto, actual o previsto, deba o vaya a tener una marca propia independiente.

### 4.2 Identificación de la Marca Principal

La evidencia permite responder con precisión distinguiendo dos preguntas distintas que suelen confundirse: *qué palabra es la marca* y *qué denota principalmente esa palabra*.

**Qué palabra es la marca:** una sola — "ComparaFarma". No existe en ningún documento un nombre legal, comercial o de producto distinto que conviva con ese nombre. La empresa se llama ComparaFarma (`docs/product/strategy/COMPANY_STRATEGY.md`, "De app a empresa"), la plataforma se llama ComparaFarma (`docs/enterprise/strategy/VISION_2030.md`, `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`), y cada canal (app, web) se presenta bajo el mismo nombre (confirmado en `docs/archive/assessments/PROJECT_INVENTORY.md`, sección 2: "ComparaFarma Mobile", "ComparaFarma Web" — el nombre de producto es el nombre de la marca con un descriptor funcional, no un nombre distinto).

**Qué denota principalmente esa palabra:** la evidencia más consolidada del repositorio apunta a la **plataforma**, no a una aplicación específica ni solo a la entidad legal:

- El término "Plataforma de Inteligencia Farmacéutica" es, según `docs/design/brand/BRAND_AUDIT.md` (§7, Evaluación), *"el elemento mejor consolidado de todo el repositorio"* junto con el mensaje de propósito — aparece de forma prácticamente idéntica en siete documentos de tres dominios distintos (`docs/enterprise/strategy/VISION_2030.md`, `MASTER_DATA_STRATEGY.md`, `DIGITAL_ASSET_REGISTER.md`, `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md`, `ENTERPRISE_DATA_MODEL.md`, `docs/product/ROADMAP.md`).
- `docs/enterprise/strategy/VISION_2030.md`: *"Somos una Plataforma de Inteligencia Farmacéutica."* — declaración de identidad en primera persona, no "somos una app" ni "somos una empresa".
- La empresa (`docs/product/strategy/COMPANY_STRATEGY.md`, "De app a empresa") se documenta explícitamente como el vehículo operativo/legal/comercial que sostiene a la plataforma — no como el concepto que el nombre "ComparaFarma" busca comunicar hacia afuera.
- Las aplicaciones (app móvil, sitio web) se declaran explícitamente subordinadas a la plataforma, no equivalentes a ella (`VISION_2030.md`, citado en §4.1).

**Conclusión: la marca principal es "ComparaFarma" como nombre único, y lo que ese nombre principalmente representa —según la fuente más consolidada del repositorio— es la plataforma, no una aplicación puntual ni solo la razón social.** Empresa, plataforma y producto no son tres marcas distintas; son tres capas de una misma marca, con la plataforma como capa conceptual dominante, la empresa como su vehículo operativo, y los productos (app, web, API) como sus canales de acceso.

### 4.2.1 Actualización 2026-08-16 — Rebranding público a PreciosFarma

**No se reabre el análisis de §4.1/§4.2 anterior — se añade un hecho nuevo posterior a esa evidencia.**

Decisión directa de Mario (CTO/Product Owner) + ChatGPT (CTO/Product), sesión 2026-08-16, registrada formalmente en `docs/design/decisions/DESIGN_DECISION_LOG.md` (DD-004): el nombre público del producto B2C cambia de **ComparaFarma** a **PreciosFarma** (dominio `preciosfarma.cl`, tagline "Compara precios de medicamentos"). Esta actualización usa exactamente el criterio de reapertura ya previsto por `docs/design/brand/DOMAIN_STATUS.md` ("Rebranding oficial"), y se aplica únicamente a la capa de nombre verbal — no a la arquitectura de marca (Branded House, §4.1), ni a la identidad visual (`VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md`, `LOGO_SYSTEM.md`, `COLOR_SYSTEM.md`, `TYPOGRAPHY_SYSTEM.md`, `ICONOGRAPHY_SYSTEM.md`), que permanecen sin cambios.

**Qué cambia:** el nombre con el que el producto se presenta públicamente (app, sitio web, tiendas de aplicaciones, comunicación, legal). **Qué no cambia:** el modelo Branded House recomendado en §4.1 (sigue aplicando, ahora bajo el nombre "PreciosFarma"); la identidad técnica interna — `mla.app.comparafarma`, `@comparafarma/domain`, el repositorio `appComparaFarma`, `comparafarma-api`, los proyectos Vercel/Supabase existentes — que se mantiene por decisión explícita de reducción de riesgo, no por descuido; ni ninguna de las citas textuales de §4.1/§4.2, que siguen siendo evidencia histórica válida de por qué "ComparaFarma" fue la marca única hasta esta decisión.

**Relación histórica:** PreciosFarma es la continuación pública del mismo producto y la misma plataforma descritos en este documento — no un producto nuevo, no una sub-marca, no un cambio de categoría. No se comunica públicamente como "PreciosFarma, anteriormente ComparaFarma"; esa relación queda documentada aquí solo para trazabilidad interna.

Este addendum no modifica ninguna palabra de §4.1 ni de la sección "Qué palabra es la marca" / "Qué denota principalmente esa palabra" de §4.2 — ambas siguen siendo correctas sustituyendo mentalmente "ComparaFarma" por "PreciosFarma" donde el texto se refiere al nombre público de marca, y dejando "ComparaFarma" sin sustituir donde el texto se refiere a identificadores técnicos.

---

### 4.3 Portafolio de Productos

Reconstruido combinando evidencia de implementación real (`docs/archive/assessments/PROJECT_INVENTORY.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`) con evidencia estratégica de lo previsto (`docs/enterprise/strategy/VISION_2030.md`, sección "Plataforma"; `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`; `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` y `BUSINESS_SERVICES.md`, columnas de "productos consumidores"). No se incluye nada que no tenga evidencia documental o de código.

**Productos existentes (implementados y operativos, según `PROJECT_INVENTORY.md` y `PRODUCTION_READINESS_V2.md`):**

- Aplicación móvil (Android/iOS) — en Prueba Cerrada de Google Play, no en producción pública todavía.
- Sitio web — en producción pública.
- API — backend operativo, hoy de uso interno (consumido por app y web), no expuesto como producto comercial.
- Panel administrativo interno (Backoffice) — operativo, sin nombre de producto propio, sin cara pública.

**Productos/capacidades en desarrollo (parcialmente implementados, con evidencia de código y de decisión de negocio, pero incompletos):**

- Motor de Suscripciones / Premium — motor backend completo (`docs/engineering/adr/ADR-0002`), sin conexión con la aplicación móvil y sin catálogo comercial real todavía (confirmado en `PRODUCTION_READINESS_V2.md`, secciones 2 y 8).
- Alertas de precio — implementadas de forma distinta y no unificada entre canales (in-app en mobile, por email en web — confirmado en `PROJECT_INVENTORY.md` §3 y §9).
- Registro Canónico de Medicamentos (CFM-ID / Catálogo Maestro) — modelo de datos y código existen; ejecución de la migración en producción no confirmada (`PROJECT_INVENTORY.md` §3, marcado incierto).

**Productos previstos (declarados en documentación estratégica/empresarial, sin evidencia de implementación):**

De `docs/enterprise/strategy/VISION_2030.md`, sección "Plataforma" ("En 2030 ComparaFarma estará compuesta por múltiples productos"):
- Para **Personas**: seguimiento de tratamientos (sin evidencia de código; existe la entidad "Tratamiento" en `docs/enterprise/ENTERPRISE_DATA_MODEL.md`, dominio EDM-300, sin implementación).
- Para **Profesionales**: herramientas para médicos, herramientas para farmacéuticos, herramientas para investigadores (sin evidencia de código en ningún workspace del repositorio).
- Para **Empresas**: API (como producto comercial, distinto de la API interna ya operativa), dashboards (como producto comercial, distinto del panel administrativo interno), analítica, inteligencia de mercado.

De `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` (categoría DAR-400, Patrimonio Comercial):
- API Comercial.
- Observatorio Farmacéutico (mencionado también como consumidor en `BUSINESS_CAPABILITY_MAP.md` y `BUSINESS_SERVICES.md`, sin evidencia de implementación).
- Marketplace futuro (nombrado explícitamente como "futuro" en el propio DAR).

**Capacidades reutilizables** (de `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`, las que sostienen o podrían sostener el portafolio anterior): Gestión del Conocimiento Farmacéutico, Gestión del Mercado Farmacéutico, Comparación Inteligente, Inteligencia Farmacéutica, Gestión de Identidad, Gestión del Perfil, Inteligencia de Uso, Gestión Comercial, Integración Comercial, Gobierno del Patrimonio Digital.

**Nota de gobierno:** esta reconstrucción de portafolio no reemplaza al futuro `docs/enterprise/PRODUCT_PORTFOLIO.md` (todavía no creado — ver §3). Es una lectura de portafolio hecha desde la óptica de marca, con la evidencia disponible hoy; cuando ese documento de Enterprise se cree, esta sección debe actualizarse para referenciarlo en vez de mantener una enumeración paralela — mismo principio de "una sola fuente de verdad" ya aplicado en todo el repositorio (`docs/enterprise/README.md`).

### 4.4 Servicios y su Expresión Pública de Marca

`docs/enterprise/BUSINESS_SERVICES.md` cataloga 16 Business Services. No todos tienen expresión visible hacia el usuario final bajo el nombre ComparaFarma — varios son infraestructura interna sin cara pública. Se distinguen a continuación, sin modificar el catálogo original:

**Con expresión pública directa (el usuario los experimenta como parte de la marca ComparaFarma):**

| Business Service | Expresión pública observable |
|---|---|
| Comparison Service (BS-008) | Resultado de comparación de precios mostrado en app/web — el núcleo de la propuesta de valor pública |
| Knowledge Management Service / Canonical Catalog Service (BS-001/BS-002) | Resultados de búsqueda e información de medicamento mostrada al usuario |
| Market Acquisition / Market Intelligence Service (BS-006/BS-007) | Precios y disponibilidad por farmacia, visibles en cada resultado |
| Profile Service (BS-010) | Sección "Mi cuenta" en el sitio web |
| Subscription Service / Entitlement Service (BS-012/BS-013) | Flujo de "Actualizar a Premium" en `/cuenta` |
| Payment Integration Service (BS-014) | Flujo de pago — con una salvedad: durante el checkout aparece brevemente la marca del proveedor de pago (Flow), un touchpoint de marca externa dentro del recorrido de ComparaFarma (ver riesgo relacionado en §4.8) |

**Sin expresión pública (infraestructura interna, invisible para el usuario final):**

Identity Service (BS-009, mecanismo de autenticación), Usage Intelligence Service (BS-011, analítica interna), Data Governance Service (BS-015), Observability Service (BS-016), Pharmaceutical Normalization/Matching Service (BS-003/BS-004, mecanismo interno cuyo resultado sí es visible pero cuyo funcionamiento no lo es).

**Observación de gobierno (constatación, no propuesta de solución):** `BUSINESS_SERVICES.md` cita los nombres de algunas Business Capabilities (BC-002, BC-003, BC-005/BC-004, BC-010) de forma distinta a como aparecen en `BUSINESS_CAPABILITY_MAP.md` (reportado en detalle en la lectura de ambos documentos para este informe). Esta inconsistencia interna de nomenclatura, si se traslada alguna vez a naming de cara al público, sería contraria a los atributos de percepción "Confianza" y "Evidencia" ya declarados en `docs/design/brand/VISUAL_IDENTITY.md` — se señala como antecedente relevante para el riesgo de §4.8, sin proponer aquí su corrección (no es competencia de este documento).

### 4.5 Relación Marca–Producto

Bajo el modelo Branded House recomendado en §4.1, la relación entre los elementos consultados debe leerse así, con evidencia de respaldo para cada uno:

- **Empresa:** vehículo legal/operativo/comercial (`docs/product/strategy/COMPANY_STRATEGY.md`). No se expresa como marca distinta; opera bajo el mismo nombre "ComparaFarma" sin sufijo legal visible al usuario (no hay evidencia de que se use, de cara al público, una razón social distinta del nombre de marca).
- **Plataforma:** la capa que el nombre "ComparaFarma" principalmente denota (§4.2). Es el "qué es" fundamental, no un canal más.
- **Aplicación móvil / Sitio Web / API:** canales de acceso a la misma plataforma, expresamente declarados como *"distintas formas de acceder al conocimiento generado por la plataforma"* (`VISION_2030.md`). No deben percibirse ni comunicarse como productos con identidad de marca separada de ComparaFarma — no hay evidencia de que ninguno la tenga hoy, y el modelo recomendado (§4.1) implica que no deberían adquirirla.
- **Alertas:** hoy es una funcionalidad dentro de los canales existentes (app, web), no un activo con nombre propio — coherente con Branded House; no amerita, con la evidencia actual, tratamiento de sub-marca.
- **Panel administrativo (Backoffice):** herramienta interna sin cara pública; no forma parte de la expresión de marca hacia el usuario final.
- **Productos previstos para Profesionales y Empresas (§4.3):** cuando se construyan, deberían, bajo Branded House, expresarse como extensiones descriptivas de la marca única ComparaFarma (por ejemplo, un descriptor funcional que indique la audiencia o el canal, no un nombre nuevo) — este documento no decide cuál sería ese descriptor; solo establece que la arquitectura recomendada no admite un nombre independiente sin relación visible con ComparaFarma.
- **Proveedores externos visibles en el recorrido (ej. Flow durante el pago):** no son parte de la arquitectura de marca de ComparaFarma; son touchpoints de terceros dentro del recorrido, y deben tratarse como tales, no como sub-marcas ni como socios de marca (ver riesgo en §4.8).

### 4.6 Arquitectura de Nombres

**Pregunta:** ¿conviene mantener "ComparaFarma" como marca única, o migrar hacia una arquitectura de nombres derivada?

**Evidencia a favor de mantener el nombre único:**

- Los cuatro dominios documentales revisados (`docs/book/`, `docs/strategy/`, `docs/product/`, `docs/enterprise/`) usan "ComparaFarma" como único nombre, sin una sola excepción encontrada, para empresa, plataforma y producto.
- `docs/design/brand/BRAND_FOUNDATIONS.md` (§11.1, Principio VII de los 12 Principios Inmutables): *"La independencia antes que la rentabilidad"* — y (Constitución, Art. IV): la organización no debe fragmentar su identidad por conveniencia comercial. Una arquitectura de nombres derivada, sin evidencia que la respalde, sería una fragmentación no justificada por ningún documento.
- No existe, en ninguna de las fuentes obligatorias revisadas, un solo caso de nombre derivado ya en uso (ni siquiera de forma informal o interna).

**Único elemento documental que podría, en el futuro, justificar evaluar una arquitectura derivada:** la segmentación de audiencia de tres niveles en `docs/enterprise/strategy/VISION_2030.md` (Personas / Profesionales / Empresas). Es evidencia de que la plataforma prevé servir audiencias muy distintas entre sí (personas naturales vs. profesionales de salud vs. clientes B2B), lo cual **en otras organizaciones** suele ser el disparador para evaluar sub-marcas o líneas nombradas. Sin embargo, ningún documento de ComparaFarma traduce esa segmentación en una decisión de naming — es, hoy, exclusivamente una segmentación de audiencia, no de marca.

**Recomendación:** mantener "ComparaFarma" como marca única (consistente con Branded House, §4.1), sin arquitectura derivada por ahora. Se recomienda revisar esta decisión únicamente cuando alguno de los productos previstos para Profesionales o Empresas (§4.3) pase de previsto a en desarrollo — momento en el que correspondería evaluar, con evidencia real de ese producto, si necesita un descriptor propio (nunca una marca nueva, bajo el modelo recomendado). Este documento no anticipa esa decisión ni propone ningún nombre.

### 4.7 Principios de Evolución

Reglas para incorporar productos futuros sin romper esta arquitectura, derivadas de evidencia ya existente en el repositorio (no creadas desde cero):

1. **Todo producto nuevo se lanza bajo el nombre único "ComparaFarma"**, nunca como marca independiente — consecuencia directa de la recomendación de Branded House (§4.1) y de la ausencia total de sub-marcas en el corpus documental.
2. **Todo producto nuevo debe trazarse a una Business Capability ya existente en `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`**, o justificar formalmente la creación de una nueva antes de nombrarse — consistente con el propio cierre de ese documento: *"Mientras los productos, las tecnologías y la estructura organizacional evolucionan, las capacidades empresariales permanecen estables."*
3. **Todo activo digital nuevo debe pasar primero por los criterios ya declarados en `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`** ("Criterios para crear un nuevo Activo Digital") antes de considerarse parte del portafolio.
4. **Ningún producto nuevo puede contradecir "Lo que nunca seremos"** (`docs/design/brand/BRAND_FOUNDATIONS.md` §12) ni el posicionamiento declarado de "Plataforma de Inteligencia Farmacéutica para personas" — en particular, no debe percibirse como farmacia, marketplace transaccional o medio publicitario, salvo que exista una decisión explícita del CEO/fundador que reconsidere esa posición (ver riesgo del "Marketplace futuro" en §4.8).
5. **Toda decisión de nombrar un producto nuevo requiere aprobación explícita del CEO/fundador** — mismo criterio de aprobación pendiente que ya se aplica, sin excepción, a todos los documentos de `docs/brand/` y `docs/enterprise/` revisados para este informe.
6. **La segmentación de audiencias ya declarada (Personas / Profesionales / Empresas, `VISION_2030.md`) puede usarse para clasificar productos nuevos**, sin que esa clasificación implique automáticamente una sub-marca — es un criterio de audiencia, no de naming (ver §4.6).
7. **Ningún nombre de producto nuevo debe colisionar con vocabulario ya fijado en la Arquitectura Empresarial** — por ejemplo, evitar que un futuro nombre de producto público coincida textualmente con un Aggregate Root o un Business Service ya catalogado (ver antecedente de colisión semántica ya detectado con la palabra "Identidad" en `BRAND_AUDIT.md`, hallazgo M2).

### 4.8 Riesgos

Riesgos de crecimiento de marca identificables con la evidencia actual — no se proponen soluciones, solo se documentan:

- **Riesgo de fragmentación no gobernada.** `docs/design/brand/BRAND_AUDIT.md` ya documentó una proliferación de formulaciones no reconciliadas de misión, visión, principios y marcos de decisión (hallazgos C1, C2, C3, A1–A3) por falta de gobierno documental activo. El mismo patrón podría repetirse en naming de producto si los productos previstos (§4.3) se lanzan sin aplicar los Principios de Evolución de §4.7.
- **Riesgo de colisión semántica ya detectado.** La palabra "Identidad" ya tiene dos significados no reconciliados en el repositorio (marca vs. autenticación de usuario — `BRAND_AUDIT.md`, hallazgo M2). Es evidencia directa de que el riesgo de colisión terminológica entre la capa de marca y la capa técnica/Enterprise ya se materializó una vez.
- **Riesgo de contradicción de posicionamiento con el "Marketplace futuro".** `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` (categoría DAR-400) nombra explícitamente un "Marketplace futuro" como activo previsto, mientras que `docs/enterprise/strategy/VISION_2030.md` y `docs/design/brand/BRAND_FOUNDATIONS.md` (§12, "Lo que nunca seremos") declaran, ambos, que ComparaFarma *"no pretende convertirse en... un marketplace"*. Esta tensión ya existe dentro de la propia documentación estratégica y no está resuelta por ningún documento leído para este informe.
- **Riesgo de inconsistencia terminológica interna.** Los nombres de al menos cuatro Business Capabilities se citan de forma distinta entre `BUSINESS_CAPABILITY_MAP.md` y `BUSINESS_SERVICES.md` (ver §4.4). Si esa falta de rigor terminológico se trasladara a comunicación de cara al público, erosionaría los atributos de percepción "Confianza" y "Evidencia" que `docs/design/brand/VISUAL_IDENTITY.md` ya declara como principios de percepción visual obligatorios.
- **Riesgo de fragmentación de experiencia entre canales.** El motor de Suscripciones/Premium no está conectado a la aplicación móvil (confirmado en `docs/archive/releases/PRODUCTION_READINESS_V2.md`, secciones 2 y 8) y las alertas de precio funcionan con mecanismos distintos y no unificados entre mobile y web (`docs/archive/assessments/PROJECT_INVENTORY.md`, sección 9). Bajo un modelo Branded House, la coherencia de experiencia entre canales es parte de lo que sostiene la promesa de marca única; estas discrepancias funcionales son, en ese sentido, también un riesgo de marca, no solo un riesgo de producto.
- **Riesgo de touchpoint de marca externa no gestionado.** Durante el flujo de pago de suscripción, la marca del proveedor de pago (Flow) aparece dentro del recorrido del usuario (`docs/technology/decisions/rfc/RFC-005_WEB_BILLING_FLOW.md`, citado en `PROJECT_INVENTORY.md`). No hay evidencia de que exista un criterio documentado sobre cómo debe convivir esa marca externa con la experiencia ComparaFarma en ese punto del recorrido.
- **Riesgo de expresión inconsistente por ausencia de guías ratificadas.** `docs/design/brand/BRAND_AUDIT.md` (§5, §7) confirma que personalidad, tono y voz existen solo como lectura inicial no ratificada, y que ningún documento de identidad de marca tiene aprobación formal del CEO/fundador todavía (`BRAND_FOUNDATIONS.md` §22-23, `VISUAL_IDENTITY.md`, `DESIGN_CONCEPT.md`). Cuantos más productos y canales se sumen antes de esa ratificación, mayor la superficie de expresión de marca sin una guía formalmente aprobada detrás.

### 4.9 Roadmap Documental Posterior

Se propone únicamente el orden de incorporación documental, sobre la base de lo ya declarado como pendiente en `docs/design/brand/BRAND_AUDIT.md` (§9), `docs/design/brand/BRAND_FOUNDATIONS.md` (§1, "Documentos que gobierna"), `docs/design/brand/VISUAL_IDENTITY.md` y `docs/design/brand/DESIGN_CONCEPT.md` (ambos con su propio roadmap declarado), y la cadena de Arquitectura Empresarial ya definida (*"Business Services → Product Portfolio → Operating Model → Enterprise Roadmap"*):

1. `BRAND_AUDIT.md` — hecho.
2. `BRAND_FOUNDATIONS.md` — hecho.
3. `VISUAL_IDENTITY.md` — hecho.
4. `DESIGN_CONCEPT.md` — hecho.
5. **`BRAND_ARCHITECTURE.md` — este documento.** Cierra el vacío de "Arquitectura de marca" señalado en `BRAND_AUDIT.md` §5.
6. **Ratificación formal por el CEO/fundador** de este documento y de `BRAND_FOUNDATIONS.md` — pendiente transversal ya señalado por todos los documentos de `docs/brand/` revisados; sin esta ratificación, ninguna decisión de naming derivada de este documento debería considerarse definitiva.
7. `docs/enterprise/PRODUCT_PORTFOLIO.md` — pendiente en la cadena de Arquitectura Empresarial (no existe todavía); cuando se cree, debe convertirse en la fuente oficial de portafolio, y §4.3 de este documento debe actualizarse para referenciarlo en vez de mantener una reconstrucción propia.
8. `LOGO_SYSTEM`, `COLOR_SYSTEM`, `TYPOGRAPHY_SYSTEM`, `ICONOGRAPHY` — ya declarados como roadmap propio de `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md`; deberían incorporar, cuando se redacten, el modelo Branded House recomendado en §4.1 de este documento.
9. `BRAND_GUIDELINES` — ya declarado en `BRAND_FOUNDATIONS.md` §1 como documento que gobernará.
10. `GOOGLE_PLAY_BRAND` / `GOOGLE_PLAY_ASSETS` — ya declarado en `BRAND_FOUNDATIONS.md` y `VISUAL_IDENTITY.md`.
11. `MARKETING_GUIDE` / `MARKETING_GUIDELINES` — ya declarado en `BRAND_FOUNDATIONS.md` y `DESIGN_CONCEPT.md`.
12. `docs/enterprise/OPERATING_MODEL.md` y `ENTERPRISE_ROADMAP.md` — siguientes eslabones pendientes de la cadena de Arquitectura Empresarial, fuera del dominio de marca pero relevantes para cuándo se materializan los productos previstos en §4.3.

---

## 5. Relaciones

Este documento depende de `docs/design/brand/BRAND_AUDIT.md` (diagnóstico de origen y vacío que este documento resuelve) y de `docs/design/brand/BRAND_FOUNDATIONS.md` (fuente de identidad que este documento no redefine). Depende también, en pie de igualdad, de la Arquitectura Empresarial completa (`docs/enterprise/README.md`, `BUSINESS_CAPABILITY_MAP.md`, `BUSINESS_SERVICES.md`, `ENTERPRISE_DATA_MODEL.md`) y de `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` y `VISION_2030.md`, de los que consolida evidencia para responder preguntas de portafolio y naming sin sustituirlos.

Es, en la cadena ya declarada por los propios documentos de `docs/enterprise/` (*"Carta del Fundador → Visión 2030 → Digital Asset Register → Enterprise Data Model → Business Capability Map → Business Services → Product Portfolio → Operating Model → Arquitectura Técnica"*), un documento que se inserta transversalmente: no ocupa un eslabón propio de esa cadena, sino que la lee completa, junto con `docs/design/brand/BRAND_FOUNDATIONS.md`, para responder la pregunta de marca/portafolio que ninguno de esos eslabones responde individualmente.

No tiene relación directa con `docs/product/` en términos de gobierno (no gobierna backlog ni roadmap de producto), pero sí usa `docs/archive/assessments/PROJECT_INVENTORY.md` y `docs/archive/releases/PRODUCTION_READINESS_V2.md` como evidencia de qué existe realmente en código, para distinguir "producto existente" de "producto previsto" en §4.3.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Modelo de arquitectura de marca (Branded House / House of Brands / Endorsed / Hybrid) | Ninguna — vacío señalado en `BRAND_AUDIT.md` §5 | ✔ (§4.1) — primera vez que se responde en el repositorio | Análisis propio de este documento; ningún documento fuente usaba estos términos |
| Identidad de marca (quién es ComparaFarma) | `docs/design/brand/BRAND_FOUNDATIONS.md` | Referencia (§4.2, no duplica) | — |
| Percepción visual / atributos | `docs/design/brand/VISUAL_IDENTITY.md` | Referencia | Sin relación directa citada por ese documento con esta pregunta de portafolio |
| Concepto de diseño | `docs/design/brand/DESIGN_CONCEPT.md` | Referencia | — |
| Propósito, visión, misión, activos estratégicos | `docs/enterprise/strategy/VISION_2030.md` | ✔ — usado como evidencia central de §4.1, §4.2, §4.3 | Consistente con `BRAND_FOUNDATIONS.md`, que ya adoptó este documento como fuente oficial de esos conceptos |
| Historia, promesa, principios, "lo que nunca seremos" | `docs/book/` (vía `docs/design/brand/BRAND_FOUNDATIONS.md`) | Referencia (§4.5, §4.7, §4.8) | No se releyó `docs/book/` directamente; se usó la consolidación ya hecha por `BRAND_FOUNDATIONS.md` con sus citas verificadas |
| Capacidades de negocio | `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` | ✔ — consolidado para portafolio (§4.3) y principios de evolución (§4.7) | Nombres exactos citados; inconsistencias con `BUSINESS_SERVICES.md` reportadas, no corregidas |
| Servicios de negocio | `docs/enterprise/BUSINESS_SERVICES.md` | ✔ — consolidado y clasificado por expresión pública (§4.4) | — |
| Modelo de datos empresarial | `docs/enterprise/ENTERPRISE_DATA_MODEL.md` | Referencia (§4.3, entidad "Tratamiento") | — |
| Patrimonio Digital / activos previstos | `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` | ✔ — consolidado para portafolio previsto (§4.3) y riesgo de Marketplace (§4.8) | — |
| Estado real de implementación (qué existe en código) | `docs/archive/assessments/PROJECT_INVENTORY.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md` | ✔ — usado para distinguir "existente" de "previsto" en §4.3 y riesgos de §4.8 | — |
| Product Portfolio de Arquitectura Empresarial | `docs/enterprise/PRODUCT_PORTFOLIO.md` (no existe todavía) | No aplica — pendiente | Ver §3 y §4.9; esta sección de portafolio (§4.3) es una lectura provisional desde marca, no la fuente oficial futura |
| Backlog / roadmap de producto | `docs/product/` (EPICS, BACKLOG_PRODUCT, ROADMAP, DECISION_LOG) | Referencia (§4.3) | No se gobierna ni se duplica su contenido operativo |

---

## 7. Gobierno

`BRAND_ARCHITECTURE.md` **no reemplaza**:

- `docs/design/brand/BRAND_FOUNDATIONS.md` — sigue siendo la única fuente de identidad de marca (quién es ComparaFarma).
- `docs/design/brand/VISUAL_IDENTITY.md` ni `docs/design/brand/DESIGN_CONCEPT.md` — siguen siendo la única fuente de percepción visual y concepto de diseño.
- La Arquitectura Empresarial (`docs/enterprise/`) — sigue siendo la única fuente de capacidades, servicios y modelo de datos.
- `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` — sigue siendo la única fuente de Patrimonio Digital.
- `docs/product/` — sigue siendo la única fuente de backlog, roadmap y KPIs de producto.

Lo que hace este documento es **responder, con la evidencia de todos los anteriores, una pregunta que ninguno de ellos respondía por sí solo**: cómo se organiza la marca y el portafolio. Cuando exista una discrepancia entre este documento y cualquiera de sus fuentes, prevalece la fuente original y este documento debe corregirse — mismo principio de gobierno ya declarado en `docs/enterprise/README.md` y aplicado de forma consistente por `BRAND_FOUNDATIONS.md`, `VISUAL_IDENTITY.md` y `DESIGN_CONCEPT.md`.

Este documento **debería gobernar** (una vez ratificado): toda decisión futura de naming de producto nuevo (vía los Principios de Evolución, §4.7), y el futuro `docs/enterprise/PRODUCT_PORTFOLIO.md`, en el sentido de que ese documento, cuando se cree, debería declarar coherencia con el modelo Branded House aquí recomendado o, si lo aparta, hacerlo de forma explícita y justificada.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador** — mismo estado que el resto de los documentos de `docs/brand/` y `docs/enterprise/` revisados para este informe.

---

## 8. Documentos relacionados

- `docs/design/brand/BRAND_AUDIT.md`
- `docs/design/brand/BRAND_FOUNDATIONS.md`
- `docs/design/brand/VISUAL_IDENTITY.md`
- `docs/design/brand/DESIGN_CONCEPT.md`
- `docs/design/brand/README.md`
- `docs/enterprise/README.md`
- `docs/enterprise/BUSINESS_CAPABILITY_MAP.md`
- `docs/enterprise/BUSINESS_SERVICES.md`
- `docs/enterprise/ENTERPRISE_DATA_MODEL.md`
- `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md`
- `docs/enterprise/strategy/VISION_2030.md`
- `docs/archive/foundational-book/0. Carta del Fundador.md`
- `docs/archive/assessments/PROJECT_INVENTORY.md`
- `docs/archive/releases/PRODUCTION_READINESS_V2.md`
- `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Draft | Pendiente (CEO/fundador) | Creación inicial. Responde el vacío de "Arquitectura de marca" señalado en `docs/design/brand/BRAND_AUDIT.md` §5: modelo de arquitectura de marca (Branded House recomendado), identificación de marca principal, portafolio de productos (existentes/en desarrollo/previstos/capacidades reutilizables), relación entre Business Services y expresión pública de marca, relación marca-producto, arquitectura de nombres, principios de evolución, riesgos y roadmap documental posterior. No crea nombres comerciales, marcas, slogans ni logotipos; no modifica `BRAND_FOUNDATIONS.md` ni ningún documento de `docs/enterprise/`. | `docs/design/brand/BRAND_AUDIT.md` v1.0; `docs/design/brand/BRAND_FOUNDATIONS.md` v1.1; `docs/design/brand/VISUAL_IDENTITY.md` v1.0; `docs/design/brand/DESIGN_CONCEPT.md` v1.0; `docs/enterprise/BUSINESS_CAPABILITY_MAP.md` v2.0; `docs/enterprise/BUSINESS_SERVICES.md` v2.0; `docs/enterprise/ENTERPRISE_DATA_MODEL.md` v2.0; `docs/enterprise/strategy/DIGITAL_ASSET_REGISTER.md` v1.0; `docs/enterprise/strategy/VISION_2030.md`; `docs/archive/assessments/PROJECT_INVENTORY.md`; `docs/archive/releases/PRODUCTION_READINESS_V2.md` |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-02 | Auditoría de Gobierno Documental general del repositorio | CTO (rol de Arquitecto de Documentación) | `docs/archive/audits/AUDIT_DOCUMENTAL_GOBIERNO_CONOCIMIENTO_2026-08.md` |
| 2026-08-05 | Auditoría de identidad de marca | Brand Strategist / Corporate Historian / Enterprise Architect | `docs/design/brand/BRAND_AUDIT.md` v1.0 — identifica el vacío de "Arquitectura de marca" que este documento resuelve |
| 2026-08-05 | Consolidación de identidad de marca | Chief Brand Officer / Corporate Historian / Document Architect | `docs/design/brand/BRAND_FOUNDATIONS.md` v1.0/v1.1 |
| 2026-08-05 | Definición de identidad visual y concepto de diseño | Brand Architect / UX Strategist / Design System Architect; Director Creativo / Brand Strategist / Semiotic Designer | `docs/design/brand/VISUAL_IDENTITY.md` v1.0, `docs/design/brand/DESIGN_CONCEPT.md` v1.0 |
| 2026-08-05 | Definición de la Arquitectura de Marca y Portafolio | Enterprise Brand Architect / Product Strategist / Portfolio Architect | `docs/design/brand/BRAND_ARCHITECTURE.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna de las acciones anteriores cuenta todavía con una aprobación formal registrada del CEO/fundador.
