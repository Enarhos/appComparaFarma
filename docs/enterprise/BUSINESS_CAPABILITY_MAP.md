# Business Capability Map (BCM)

**Código:** ENT-BCM-001

**Versión:** 2.0 (Draft)

**Estado:** En Elaboración

**Clasificación:** Documento de Arquitectura Empresarial

**Propietario:** CEO / CTO

**Última actualización:** 2026-08-03

---

# Propósito

El Business Capability Map define las capacidades empresariales permanentes que ComparaFarma debe desarrollar, mantener y evolucionar para cumplir su propósito como Plataforma de Inteligencia Farmacéutica.

Las Business Capabilities representan aquello que la organización es capaz de hacer.

No representan procesos.

No representan personas.

No representan aplicaciones.

No representan tecnologías.

Representan habilidades permanentes de la organización.

Estas capacidades permanecen estables incluso cuando cambian los productos, la estructura organizacional o la tecnología utilizada.

---

# Relación con la Arquitectura Empresarial

Dentro de la Arquitectura Empresarial, las Business Capabilities ocupan el siguiente nivel:

Carta del Fundador

↓

Visión 2030

↓

Digital Asset Register

↓

Enterprise Data Model

↓

Business Capability Map

↓

Business Services

↓

Product Portfolio

↓

Operating Model

↓

Arquitectura Técnica

Las Business Capabilities transforman el Patrimonio Digital definido por la organización en capacidades permanentes que posteriormente serán implementadas mediante Business Services.

---

# Objetivos

El Business Capability Map tiene como objetivos:

- identificar las capacidades estratégicas de ComparaFarma;
- establecer un lenguaje común para toda la organización;
- orientar la evolución del negocio;
- evitar duplicación de responsabilidades;
- facilitar la priorización de inversiones;
- servir como base para la evolución de productos;
- mantener alineados el negocio y la tecnología.

---

# ¿Qué es una Business Capability?

Una Business Capability representa la capacidad permanente de una organización para cumplir una responsabilidad de negocio.

Una Capability:

- existe independientemente de las personas;
- existe independientemente de las aplicaciones;
- puede ser implementada mediante distintos procesos;
- puede ser soportada por uno o más Business Services;
- opera sobre uno o más dominios del Enterprise Data Model;
- protege o incrementa uno o más Activos Digitales definidos en el Digital Asset Register.

---

# ¿Qué NO es una Business Capability?

No constituyen Business Capabilities:

- procesos;
- procedimientos;
- tareas;
- proyectos;
- productos;
- aplicaciones;
- APIs;
- microservicios;
- tecnologías;
- equipos organizacionales.

Estos elementos implementan o soportan una Capability, pero no la definen.

---

# Principios

## Principio 1 — Orientación al Patrimonio Digital

Toda Business Capability deberá existir para crear, proteger, enriquecer o explotar uno o más Activos Digitales de ComparaFarma.

Si una capacidad no aporta valor al Patrimonio Digital, deberá justificarse explícitamente su existencia.

---

## Principio 2 — Permanencia

Las Business Capabilities representan habilidades permanentes del negocio.

Su definición no deberá cambiar como consecuencia de decisiones tecnológicas o de reorganizaciones internas.

---

## Principio 3 — Independencia tecnológica

Las capacidades empresariales son independientes de:

- lenguajes de programación;
- arquitecturas de software;
- plataformas cloud;
- proveedores tecnológicos;
- productos específicos.

---

## Principio 4 — Implementación mediante Business Services

Las Business Capabilities no implementan comportamiento directamente.

Su implementación se realiza mediante uno o más Business Services.

Toda Capability deberá mantener trazabilidad con los servicios que la implementan.

---

## Principio 5 — Unicidad

Cada Capability deberá tener un propósito claramente diferenciado.

La duplicación de capacidades constituye deuda de arquitectura.

---

## Principio 6 — Reutilización

Toda nueva iniciativa deberá reutilizar capacidades existentes antes de proponer nuevas capacidades empresariales.

---

## Principio 7 — Gobierno

Cada Capability deberá poseer:

- propietario;
- indicadores;
- nivel de madurez;
- hoja de ruta;
- relación con el Patrimonio Digital.

---

# Modelo Conceptual

Patrimonio Digital

↓

Business Capability

↓

Business Service

↓

Producto

↓

Valor entregado

El Patrimonio Digital representa aquello que la organización posee.

Las Business Capabilities representan aquello que la organización sabe hacer.

Los Business Services representan la forma en que dichas capacidades son ejecutadas.

Los productos representan el mecanismo mediante el cual ese valor llega a los usuarios.

---

# Estructura del Catálogo

Cada Business Capability deberá documentarse utilizando la siguiente estructura.

## Identificación

- Código
- Nombre
- Estado
- Propietario

---

## Propósito

Descripción de la responsabilidad permanente del negocio.

---

## Patrimonio Digital

Activos Digitales relacionados (DAR).

---

## Dominios Empresariales

Dominios del Enterprise Data Model sobre los cuales opera.

---

## Aggregate Root

Entidad principal del modelo conceptual administrada por la Capability.

---

## Business Services

Servicios responsables de implementar la Capability.

---

## Productos

Productos que consumen los Business Services asociados.

---

## Indicadores

Métricas utilizadas para evaluar el desarrollo de la Capability.

---

## Nivel de Madurez

Clasificación propuesta:

- Inicial
- Gestionada
- Definida
- Optimizada
- Estratégica

---

## Riesgos

Principales riesgos para la evolución de la Capability.

---

## Roadmap

Principales líneas de evolución previstas.

---

# Gobierno

Toda Business Capability deberá mantener trazabilidad explícita con:

- Digital Asset Register;
- Enterprise Data Model;
- Business Services;
- Product Portfolio;
- Operating Model.

Las modificaciones significativas deberán reflejarse en todos los documentos relacionados.

---

# Criterios para crear una nueva Capability

Antes de incorporar una nueva Business Capability deberán responderse las siguientes preguntas:

1. ¿Representa una habilidad permanente de la organización?

2. ¿Incrementa o protege el Patrimonio Digital?

3. ¿No puede modelarse mediante una Capability existente?

4. ¿Puede ser implementada mediante uno o más Business Services?

5. ¿Tiene un propósito claramente diferenciado?

Si alguna de estas respuestas es negativa, deberá justificarse formalmente la creación de la nueva Capability.

---

# Clasificación de las Capacidades

Las capacidades de ComparaFarma se agrupan en cuatro grandes categorías.

## Capacidades Estratégicas

Relacionadas directamente con la construcción y evolución del Patrimonio Digital.

---

## Capacidades Comerciales

Relacionadas con la monetización y sostenibilidad de la plataforma.

---

## Capacidades de Experiencia

Relacionadas con la interacción de las personas con la plataforma y la generación de conocimiento agregado.

---

## Capacidades de Gobierno

Relacionadas con la calidad, protección, cumplimiento y evolución del Patrimonio Digital.

Las siguientes secciones desarrollan cada una de estas categorías de forma independiente.


# Capacidades Estratégicas

Las Capacidades Estratégicas constituyen el núcleo del negocio de ComparaFarma.

Su responsabilidad consiste en construir, proteger y evolucionar el Patrimonio Digital definido en el Digital Asset Register.

Estas capacidades representan la principal ventaja competitiva de la organización.

---

# BC-001 — Gestión del Conocimiento Farmacéutico

## Propósito

Construir y administrar el conocimiento farmacéutico canónico de ComparaFarma.

Esta Capability representa la capacidad permanente de la organización para comprender, estructurar y gobernar el conocimiento científico relacionado con medicamentos.

No administra precios.

No administra ofertas.

No administra suscripciones.

Administra conocimiento farmacéutico.

---

## Patrimonio Digital

DAR-100 — Patrimonio de Conocimiento.

---

## Dominio Empresarial

EDM-100 — Conocimiento Farmacéutico.

---

## Aggregate Root

Concepto Farmacéutico.

---

## Business Services

- BS-001 Knowledge Management Service
- BS-002 Canonical Catalog Service
- BS-003 Pharmaceutical Normalization Service
- BS-004 Pharmaceutical Matching Service
- BS-005 Pharmaceutical Knowledge Intelligence Service

---

## Productos

- Mobile
- Web
- API
- IA
- Analytics
- Productos futuros

---

## Indicadores

- Cobertura del Catálogo Maestro.
- Calidad del matching.
- Cobertura de principios activos.
- Cobertura de bioequivalencias.
- Cobertura regulatoria.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

Esta Capability deberá evolucionar mediante el enriquecimiento continuo del conocimiento farmacéutico y la incorporación de nuevas fuentes regulatorias y científicas.

---

# BC-002 — Gestión del Mercado Farmacéutico

## Propósito

Construir y mantener una representación confiable del mercado farmacéutico chileno.

Esta Capability permite comprender cómo se comercializan los medicamentos, cómo evolucionan los precios y cuál es la cobertura real del mercado.

---

## Patrimonio Digital

DAR-200 — Patrimonio de Mercado.

---

## Dominio Empresarial

EDM-200 — Mercado Farmacéutico.

---

## Aggregate Root

Oferta.

---

## Business Services

- BS-006 Market Acquisition Service
- BS-007 Market Intelligence Service

---

## Productos

- Mobile
- Web
- API
- Analytics
- Dashboard
- Observatorio Farmacéutico

---

## Indicadores

- Cobertura nacional.
- Cobertura por cadena.
- Cobertura temporal.
- Calidad de captura.
- Actualización del mercado.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

La evolución de esta Capability deberá incrementar permanentemente la cobertura, calidad y profundidad del conocimiento del mercado.

---

# BC-003 — Comparación Inteligente

## Propósito

Comparar Ofertas pertenecientes a un mismo Concepto Farmacéutico para entregar la mejor alternativa disponible a cada usuario.

Esta Capability constituye el principal mecanismo mediante el cual ComparaFarma transforma conocimiento en valor para las personas.

---

## Patrimonio Digital

- DAR-100
- DAR-200

---

## Dominios Empresariales

- EDM-100
- EDM-200

---

## Aggregate Root

Oferta.

---

## Business Services

- BS-008 Comparison Service

---

## Productos

- Mobile
- Web
- API

---

## Indicadores

- Tiempo promedio de respuesta.
- Cobertura de comparación.
- Precisión.
- Ahorro estimado.
- Calidad de resultados.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

Esta Capability deberá incorporar progresivamente nuevos criterios de comparación, nuevas variables comerciales y modelos de recomendación más sofisticados.

---

# BC-004 — Inteligencia Farmacéutica

## Propósito

Transformar el conocimiento farmacéutico y de mercado en inteligencia reutilizable para la generación de nuevos productos y servicios.

Esta Capability constituye el puente entre el conocimiento estructurado y la inteligencia avanzada de la plataforma.

---

## Patrimonio Digital

- DAR-100
- DAR-200

---

## Dominios Empresariales

- EDM-100
- EDM-200

---

## Aggregate Root

Concepto Farmacéutico.

---

## Business Services

- BS-005 Pharmaceutical Knowledge Intelligence Service
- BS-007 Market Intelligence Service

---

## Productos

- IA
- Analytics
- Observatorio Farmacéutico
- Productos futuros

---

## Indicadores

- Modelos analíticos generados.
- Cobertura semántica.
- Calidad de recomendaciones.
- Nuevos activos de conocimiento creados.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

Esta Capability deberá consolidar a ComparaFarma como una Plataforma de Inteligencia Farmacéutica, incorporando modelos predictivos, analítica avanzada e inteligencia artificial aplicada al dominio farmacéutico.

---

# Relaciones entre las Capacidades Estratégicas

Las capacidades estratégicas forman una cadena de creación de valor.

Gestión del Conocimiento Farmacéutico

↓

Gestión del Mercado Farmacéutico

↓

Comparación Inteligente

↓

Inteligencia Farmacéutica

Cada Capability reutiliza el conocimiento generado por la anterior y aumenta el valor del Patrimonio Digital de ComparaFarma.

No existen capacidades aisladas.

Todas contribuyen a la construcción de una única Plataforma de Inteligencia Farmacéutica.

---

# Principios de Evolución

Las Capacidades Estratégicas deberán evolucionar de manera coordinada.

La incorporación de una nueva fuente de información, una nueva regla de negocio o un nuevo producto deberá fortalecer las capacidades existentes antes de justificar la creación de nuevas capacidades.

La estabilidad del mapa de capacidades constituye un principio de la Arquitectura Empresarial de ComparaFarma.


# Capacidades de Experiencia

Las Capacidades de Experiencia administran la relación entre las personas y la Plataforma de Inteligencia Farmacéutica.

Su objetivo no es administrar identidades.

Su objetivo es ofrecer una experiencia segura, personalizada y capaz de generar conocimiento agregado respetando los principios de Privacy by Design.

Estas capacidades se relacionan principalmente con:

- DAR-300 — Patrimonio de Uso
- EDM-300 — Dominio de Identidad y Uso

---

# BC-005 — Gestión de Identidad

## Propósito

Administrar la autenticación, autorización y gestión de consentimiento necesarias para acceder a la plataforma.

La identidad constituye un mecanismo operativo.

No forma parte del Patrimonio Digital.

---

## Patrimonio Digital

No incrementa directamente un Activo Digital.

Protege el acceso al Patrimonio Digital.

---

## Dominio Empresarial

EDM-300

---

## Aggregate Root

Identidad.

---

## Business Services

- BS-009 Identity Service

---

## Productos

- Mobile
- Web
- API

---

## Indicadores

- Disponibilidad del servicio.
- Tiempo de autenticación.
- Incidentes de seguridad.
- Gestión de consentimientos.

---

## Nivel de Madurez

Gestionada.

---

## Evolución

La evolución deberá priorizar la seguridad, la interoperabilidad con proveedores de identidad y el cumplimiento normativo.

---

# BC-006 — Gestión del Perfil

## Propósito

Administrar la configuración funcional utilizada por cada persona dentro de la plataforma.

El Perfil representa la experiencia personalizada del usuario.

No representa su identidad civil.

---

## Patrimonio Digital

DAR-300 — Patrimonio de Uso.

---

## Dominio Empresarial

EDM-300

---

## Aggregate Root

Perfil.

---

## Business Services

- BS-010 Profile Service

---

## Productos

- Mobile
- Web

---

## Indicadores

- Uso de favoritos.
- Uso de alertas.
- Gestión de recetas.
- Personalización.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

La evolución deberá enriquecer la experiencia sin incrementar innecesariamente el tratamiento de datos personales.

---

# BC-007 — Inteligencia de Uso

## Propósito

Transformar las interacciones realizadas dentro de la plataforma en conocimiento agregado reutilizable.

Esta Capability constituye el mecanismo mediante el cual la experiencia de uso incrementa el Patrimonio Digital.

Nunca genera conocimiento individualizado.

---

## Patrimonio Digital

DAR-300 — Patrimonio de Uso.

---

## Dominio Empresarial

EDM-300

---

## Aggregate Root

Evento.

---

## Business Services

- BS-011 Usage Intelligence Service

---

## Productos

- Analytics
- IA
- Roadmap de Producto

---

## Indicadores

- Eventos procesados.
- Cobertura analítica.
- Calidad de anonimización.
- Conocimiento generado.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

Toda evolución deberá reforzar la anonimización, la agregación y la reutilización del conocimiento derivado del uso de la plataforma.

---

# Capacidades Comerciales

Las Capacidades Comerciales garantizan la sostenibilidad económica de ComparaFarma.

Estas capacidades permiten monetizar la plataforma sin alterar el modelo conceptual del conocimiento farmacéutico.

Se relacionan principalmente con:

- DAR-400 — Patrimonio Comercial
- EDM-400 — Dominio Comercial

---

# BC-008 — Gestión Comercial

## Propósito

Administrar el catálogo de planes, suscripciones y beneficios ofrecidos por ComparaFarma.

Esta Capability define las reglas del modelo comercial de la organización.

---

## Patrimonio Digital

DAR-400 — Patrimonio Comercial.

---

## Dominio Empresarial

EDM-400

---

## Aggregate Root

Suscripción.

---

## Business Services

- BS-012 Subscription Service
- BS-013 Entitlement Service

---

## Productos

- Mobile
- Web

---

## Indicadores

- Conversión a Premium.
- Renovación.
- Retención.
- Utilización de beneficios.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

El modelo comercial deberá evolucionar mediante nuevos planes, beneficios y servicios, manteniendo una clara separación entre las reglas comerciales y el conocimiento farmacéutico.

---

# BC-009 — Integración Comercial

## Propósito

Integrar ComparaFarma con plataformas externas necesarias para ejecutar el modelo comercial.

Esta Capability desacopla la lógica de negocio de los proveedores de pago y de otros servicios externos.

---

## Patrimonio Digital

DAR-400

---

## Dominio Empresarial

EDM-400

---

## Aggregate Root

Transacción.

---

## Business Services

- BS-014 Payment Integration Service

---

## Productos

- Mobile
- API

---

## Indicadores

- Disponibilidad.
- Pagos exitosos.
- Conciliación.
- Tiempo de procesamiento.

---

## Nivel de Madurez

Gestionada.

---

## Evolución

La incorporación de nuevos proveedores no deberá modificar las reglas comerciales de ComparaFarma.

---

# Relaciones entre Capacidades

Las Capacidades de Experiencia y Comerciales complementan las Capacidades Estratégicas.

Conocimiento Farmacéutico

↓

Mercado Farmacéutico

↓

Comparación Inteligente

↓

Experiencia Personalizada

↓

Modelo Comercial

↓

Sostenibilidad

↓

Mayor generación de Patrimonio Digital

La sostenibilidad económica de ComparaFarma depende de la capacidad de transformar conocimiento en valor para las personas sin comprometer los principios de privacidad, independencia tecnológica y gobierno del Patrimonio Digital.

---

# Principios de Evolución

Las Capacidades de Experiencia deberán evolucionar priorizando:

- simplicidad para el usuario;
- minimización de datos personales;
- personalización responsable;
- generación de conocimiento agregado.

Las Capacidades Comerciales deberán evolucionar priorizando:

- sostenibilidad;
- transparencia;
- reutilización de capacidades existentes;
- independencia respecto de proveedores externos.


# Capacidades de Gobierno

Las Capacidades de Gobierno aseguran la calidad, integridad, trazabilidad y evolución del Patrimonio Digital de ComparaFarma.

Estas capacidades son transversales a toda la organización y permiten preservar el valor del conocimiento administrado por la plataforma.

Se relacionan con todos los Activos Digitales definidos en el Digital Asset Register.

---

# BC-010 — Gobierno del Patrimonio Digital

## Propósito

Gobernar el Patrimonio Digital de ComparaFarma durante todo su ciclo de vida.

Esta Capability garantiza que el conocimiento administrado por la organización permanezca:

- consistente;
- trazable;
- reutilizable;
- protegido;
- alineado con la estrategia empresarial.

---

## Patrimonio Digital

- DAR-100
- DAR-200
- DAR-300
- DAR-400

---

## Dominios Empresariales

Todos los dominios del Enterprise Data Model.

---

## Aggregate Root

Activo Digital.

---

## Business Services

- BS-015 Data Governance Service

---

## Productos

Todos.

---

## Indicadores

- Calidad del Patrimonio.
- Cobertura documental.
- Consistencia del modelo.
- Activos gobernados.
- Auditorías realizadas.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

La evolución de esta Capability deberá fortalecer continuamente la calidad y gobernanza del Patrimonio Digital.

---

# BC-011 — Arquitectura Empresarial

## Propósito

Mantener la coherencia entre la estrategia, el Patrimonio Digital, el Enterprise Data Model, las Business Capabilities, los Business Services y los productos de ComparaFarma.

Esta Capability preserva la estabilidad de la arquitectura empresarial a largo plazo.

---

## Patrimonio Digital

Todos.

---

## Dominios Empresariales

Todos.

---

## Aggregate Root

Arquitectura Empresarial.

---

## Business Services

No aplica directamente.

La Arquitectura Empresarial gobierna la evolución de los Business Services, pero no constituye un servicio operativo.

---

## Productos

Toda la plataforma.

---

## Indicadores

- Consistencia arquitectónica.
- Documentación vigente.
- Cobertura de trazabilidad.
- Cumplimiento de estándares.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

Toda modificación relevante deberá mantener alineados:

- DAR;
- EDM;
- BCM;
- Business Services;
- Product Portfolio;
- Operating Model.

---

# BC-012 — Cumplimiento y Privacidad

## Propósito

Garantizar que la evolución de la Plataforma de Inteligencia Farmacéutica respete el marco regulatorio aplicable y los principios internos de privacidad.

Esta Capability es responsable de verificar el cumplimiento de la normativa sobre protección de datos personales, así como de los principios de Privacy by Design definidos por ComparaFarma.

---

## Patrimonio Digital

Todos.

---

## Dominios Empresariales

Todos.

---

## Aggregate Root

Política de Gobierno.

---

## Business Services

Implementado transversalmente por los servicios que administran información personal o sensible.

No constituye un Business Service independiente.

---

## Productos

Todos.

---

## Indicadores

- Incidentes de privacidad.
- Cumplimiento normativo.
- Evaluaciones de impacto.
- Consentimientos gestionados.

---

## Nivel de Madurez

Estratégica.

---

## Evolución

La evolución de esta Capability deberá acompañar los cambios regulatorios y reforzar continuamente la protección de los datos personales.

---

# Relaciones entre las Capacidades

El conjunto de capacidades de ComparaFarma forma una única cadena de creación de valor.

Patrimonio Digital

↓

BC-001 Gestión del Conocimiento Farmacéutico

↓

BC-002 Gestión del Mercado Farmacéutico

↓

BC-003 Comparación Inteligente

↓

BC-004 Inteligencia Farmacéutica

↓

BC-005 Gestión de Identidad

↓

BC-006 Gestión del Perfil

↓

BC-007 Inteligencia de Uso

↓

BC-008 Gestión Comercial

↓

BC-009 Integración Comercial

↓

BC-010 Gobierno del Patrimonio Digital

↓

BC-011 Arquitectura Empresarial

↓

BC-012 Cumplimiento y Privacidad

Cada Capability incrementa, protege o explota el Patrimonio Digital desde una perspectiva distinta.

Ninguna Capability existe de manera aislada.

---

# Modelo de Madurez

Cada Business Capability deberá evaluarse periódicamente utilizando una escala homogénea.

## Nivel 1 — Inicial

La capacidad existe de manera informal y depende principalmente de personas o esfuerzos individuales.

---

## Nivel 2 — Gestionada

La capacidad está documentada, cuenta con responsables identificados y comienza a medirse.

---

## Nivel 3 — Definida

La capacidad posee procesos estandarizados, Business Services identificados y trazabilidad con el Patrimonio Digital.

---

## Nivel 4 — Optimizada

La capacidad utiliza indicadores para mejorar continuamente y reutiliza de forma consistente el conocimiento de la organización.

---

## Nivel 5 — Estratégica

La capacidad constituye una ventaja competitiva sostenible y orienta la evolución de la Plataforma de Inteligencia Farmacéutica.

---

# Gobierno del Mapa de Capacidades

Toda modificación al Business Capability Map deberá responder, como mínimo, las siguientes preguntas:

- ¿Qué Activo Digital protege o incrementa esta Capability?
- ¿Qué dominio del Enterprise Data Model consume?
- ¿Qué Business Services la implementan?
- ¿Qué productos dependen de ella?
- ¿Qué impacto tiene sobre la estrategia de ComparaFarma?

Las respuestas deberán mantenerse consistentes con el Digital Asset Register, el Enterprise Data Model y el catálogo de Business Services.

---

# Declaración Final

Las Business Capabilities representan las habilidades permanentes que distinguen a ComparaFarma como Plataforma de Inteligencia Farmacéutica.

Mientras los productos, las tecnologías y la estructura organizacional evolucionan, las capacidades empresariales permanecen estables y constituyen el mecanismo mediante el cual la organización crea, protege y explota su Patrimonio Digital.

Este documento establece el mapa oficial de dichas capacidades y constituye la referencia para orientar la evolución del negocio, la priorización de inversiones y el diseño de nuevos productos y servicios.

---

# Control de Cambios

| Versión | Fecha | Autor | Descripción |
|----------|-------|--------|-------------|
| 2.0 (Draft) | 2026-08-03 | CEO / CTO | Reescritura completa alineada con el Digital Asset Register, el Enterprise Data Model y el catálogo de Business Services. |

---

# Documentos Relacionados

- Carta del Fundador
- Visión 2030
- Digital Asset Register
- Enterprise Data Model
- Business Services
- Product Portfolio
- Operating Model
- Enterprise Roadmap
- Privacy by Design