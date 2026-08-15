# Business Services

**Código:** ENT-BS-001

**Versión:** 2.0 (Draft)

**Estado:** En Elaboración

**Clasificación:** Documento de Arquitectura Empresarial

**Propietario:** CEO / CTO

**Última actualización:** 2026-08-03

---

# Propósito

El catálogo de Business Services define los servicios empresariales reutilizables que implementan las capacidades de negocio de ComparaFarma.

Un Business Service encapsula una responsabilidad funcional del negocio y representa la forma mediante la cual la organización transforma su Patrimonio Digital en productos y servicios para las personas, instituciones y futuros consumidores de la plataforma.

Los Business Services no representan aplicaciones, microservicios, APIs ni componentes tecnológicos.

Representan capacidades operativas del negocio que pueden ser consumidas por múltiples productos e implementadas mediante distintas tecnologías.

---

# Relación con la Arquitectura Empresarial

Dentro de la Arquitectura Empresarial, los Business Services ocupan el siguiente nivel:

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

Los Business Services conectan el conocimiento administrado por la organización con los productos que finalmente entregan valor a los usuarios.

---

# Objetivos

El catálogo de Business Services tiene como objetivos:

- implementar las Business Capabilities;
- reutilizar el Patrimonio Digital;
- evitar duplicación de lógica de negocio;
- proporcionar un catálogo estable de servicios empresariales;
- desacoplar el negocio de la tecnología;
- facilitar la evolución de los productos;
- permitir el crecimiento de la plataforma sin aumentar innecesariamente su complejidad.

---

# ¿Qué es un Business Service?

Un Business Service representa una capacidad operacional reutilizable que implementa procesos de negocio sobre el Patrimonio Digital.

Todo Business Service:

- implementa una o más Business Capabilities;
- consume uno o más dominios del Enterprise Data Model;
- incrementa o protege uno o más Activos Digitales definidos en el Digital Asset Register;
- puede ser utilizado por múltiples productos;
- es independiente de cualquier implementación tecnológica.

---

# ¿Qué NO es un Business Service?

No constituyen Business Services:

- APIs;
- microservicios;
- clases de software;
- librerías;
- bases de datos;
- procesos ETL;
- componentes de infraestructura;
- interfaces gráficas.

Estos elementos corresponden a implementaciones técnicas de un Business Service.

---

# Principios

## Principio 1 — El negocio antes que la tecnología

Los Business Services representan responsabilidades del negocio.

Nunca representan decisiones tecnológicas.

---

## Principio 2 — Reutilización

Todo nuevo producto deberá reutilizar Business Services existentes antes de incorporar nuevos.

La duplicación funcional constituye deuda de arquitectura.

---

## Principio 3 — Independencia tecnológica

Un Business Service podrá implementarse mediante distintas tecnologías sin modificar su definición conceptual.

---

## Principio 4 — Un servicio implementa capacidades

Todo Business Service deberá implementar una o más Business Capabilities definidas en el Business Capability Map.

Nunca al revés.

---

## Principio 5 — Los servicios operan sobre el conocimiento

Todo Business Service deberá consumir entidades definidas en el Enterprise Data Model.

Los servicios no redefinen el modelo conceptual.

---

## Principio 6 — Los servicios incrementan patrimonio

Todo Business Service deberá contribuir explícitamente a crear, proteger o enriquecer uno o más Activos Digitales definidos en el Digital Asset Register.

---

## Principio 7 — Privacy by Design

Los Business Services deberán minimizar el tratamiento de datos personales.

Cuando administren información de carácter personal o sensible deberán aplicar los principios de:

- minimización;
- finalidad;
- necesidad;
- proporcionalidad;
- seguridad;
- trazabilidad.

Siempre que sea posible, el conocimiento generado deberá incorporarse al Patrimonio Digital en forma agregada o anonimizada.

---

# Modelo Conceptual

Business Capability

↓

Business Service

↓

Enterprise Data Model

↓

Patrimonio Digital

↓

Productos

↓

Usuarios

Los Business Services representan el puente entre las capacidades empresariales y los productos ofrecidos por ComparaFarma.

---

# Estructura del Catálogo

Todo Business Service deberá documentarse utilizando la siguiente estructura.

## Identificación

- Código
- Nombre
- Estado
- Propietario

---

## Propósito

Descripción de la responsabilidad empresarial del servicio.

---

## Business Capabilities

Capacidades empresariales implementadas.

---

## Aggregate Root

Entidad principal del Enterprise Data Model sobre la cual opera el servicio.

---

## Dominios EDM Consumidos

Dominios empresariales utilizados por el servicio.

---

## Activos DAR Relacionados

Activos Digitales que el servicio protege o incrementa.

---

## Productos Consumidores

Productos que utilizan el servicio.

Ejemplos:

- Mobile
- Web
- API
- Analytics
- Dashboard
- Productos futuros

---

## Clasificación Jurídica

Tipo de información administrada por el servicio.

Ejemplos:

- Pública
- Comercial
- Personal
- Sensible
- Agregada

---

## Indicadores

Indicadores utilizados para evaluar el desempeño del servicio.

---

## Criticidad

Clasificación sugerida:

- Crítica
- Alta
- Media
- Baja

---

## Riesgos

Principales riesgos asociados al servicio.

---

## Roadmap

Principales líneas de evolución previstas.

---

# Gobierno

Todo Business Service deberá mantener:

- una única definición oficial;
- un propietario claramente identificado;
- trazabilidad con el Business Capability Map;
- trazabilidad con el Enterprise Data Model;
- trazabilidad con el Digital Asset Register;
- documentación vigente.

---

# Ciclo de Vida

Todo Business Service recorrerá el siguiente ciclo de vida:

Propuesto

↓

En Diseño

↓

En Desarrollo

↓

Operativo

↓

Optimización Continua

↓

Deprecado

La eliminación de un Business Service requerirá garantizar previamente la continuidad de las capacidades empresariales que implementa.

---

# Relación con el Enterprise Data Model

Los Business Services no crean entidades conceptuales.

Únicamente operan sobre las entidades definidas por el Enterprise Data Model.

Toda modificación significativa del modelo conceptual deberá reflejarse en los Business Services afectados.

---

# Relación con el Digital Asset Register

Todo Business Service deberá declarar explícitamente qué Activos Digitales protege, mantiene o incrementa.

La existencia de un Business Service sólo se justifica cuando genera valor sobre el Patrimonio Digital de ComparaFarma.


# Catálogo de Business Services

Los Business Services se organizan según los dominios definidos en el Enterprise Data Model.

Esta organización garantiza una correspondencia directa entre:

- Patrimonio Digital (DAR)
- Enterprise Data Model (EDM)
- Business Capability Map (BCM)
- Business Services (BS)

---

# Servicios del Dominio de Conocimiento Farmacéutico

Los siguientes servicios implementan las capacidades relacionadas con el Patrimonio de Conocimiento (DAR-100).

---

# BS-001 — Knowledge Management Service

## Propósito

Administrar el conocimiento farmacéutico canónico de la plataforma.

Este servicio es responsable de mantener la representación oficial del conocimiento científico administrado por ComparaFarma.

No administra información comercial.

No administra ofertas.

Administra conocimiento.

---

## Business Capabilities

- BC-001 Gestión del Conocimiento Farmacéutico

---

## Aggregate Root

Concepto Farmacéutico

---

## Dominios EDM

- EDM-100

---

## Activos DAR

- DAR-100 Patrimonio de Conocimiento

---

## Productos Consumidores

- Mobile
- Web
- API
- Analytics
- IA
- Productos futuros

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Crítica.

---

## Indicadores

- Cobertura del Catálogo Maestro.
- Calidad del conocimiento.
- Cobertura de principios activos.
- Cobertura regulatoria.

---

## Evolución

Este servicio deberá evolucionar mediante la incorporación de nuevas fuentes de conocimiento y el enriquecimiento continuo del modelo farmacéutico.

---

# BS-002 — Canonical Catalog Service

## Propósito

Administrar el Catálogo Maestro de ComparaFarma.

Su responsabilidad consiste en consolidar la representación canónica de medicamentos, presentaciones y productos comerciales.

---

## Business Capabilities

- BC-001

---

## Aggregate Root

Concepto Farmacéutico

---

## Dominios EDM

- EDM-100

---

## Activos DAR

- DAR-100

---

## Productos Consumidores

Todos.

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Crítica.

---

## Indicadores

- Cobertura del Catálogo Maestro.
- Duplicados detectados.
- Calidad de normalización.

---

# BS-003 — Pharmaceutical Normalization Service

## Propósito

Normalizar información farmacéutica proveniente de distintas fuentes.

Este servicio transforma información heterogénea en conocimiento consistente.

---

## Business Capabilities

- BC-001

---

## Aggregate Root

Concepto Farmacéutico

---

## Dominios EDM

- EDM-100

---

## Activos DAR

- DAR-100

---

## Productos Consumidores

- API
- ETL
- Integraciones

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Alta.

---

## Indicadores

- Precisión de normalización.
- Errores detectados.
- Cobertura.

---

# BS-004 — Pharmaceutical Matching Service

## Propósito

Determinar cuándo distintas representaciones corresponden al mismo Concepto Farmacéutico.

Implementa las reglas de matching administradas por ComparaFarma.

---

## Business Capabilities

- BC-001

---

## Aggregate Root

Concepto Farmacéutico

---

## Dominios EDM

- EDM-100

---

## Activos DAR

- DAR-100

---

## Productos Consumidores

- API
- Mobile
- Web

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Crítica.

---

## Indicadores

- Precisión del matching.
- Falsos positivos.
- Falsos negativos.
- Cobertura.

---

# BS-005 — Pharmaceutical Knowledge Intelligence Service

## Propósito

Transformar el conocimiento farmacéutico en inteligencia reutilizable.

Permite construir:

- relaciones terapéuticas;
- recomendaciones;
- bioequivalencias;
- conocimiento derivado.

---

## Business Capabilities

- BC-005 Inteligencia Farmacéutica

---

## Aggregate Root

Concepto Farmacéutico

---

## Dominios EDM

- EDM-100

---

## Activos DAR

- DAR-100

---

## Productos Consumidores

- IA
- Analytics
- Productos futuros

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Alta.

---

## Indicadores

- Cobertura semántica.
- Relaciones generadas.
- Calidad del conocimiento derivado.

---

# Relaciones del Dominio

Todos los servicios anteriores operan sobre el mismo Aggregate Root:

Concepto Farmacéutico

↓

Presentación

↓

Producto Medicinal Comercial

Estos servicios nunca interactúan directamente con precios u ofertas.

Su responsabilidad finaliza cuando el conocimiento farmacológico ha sido representado correctamente.

La comercialización de dicho conocimiento corresponde al Dominio de Mercado Farmacéutico.


# Servicios del Dominio de Mercado Farmacéutico

Los siguientes servicios implementan las capacidades relacionadas con el Patrimonio de Mercado (DAR-200).

---

# BS-006 — Market Acquisition Service

## Propósito

Incorporar información proveniente de farmacias, instituciones y otras fuentes autorizadas.

Este servicio administra el proceso de adquisición de información de mercado.

No normaliza.

No compara.

No genera inteligencia.

Su responsabilidad finaliza cuando la información ha sido capturada correctamente.

---

## Business Capabilities

- BC-002 Integración de Fuentes

---

## Aggregate Root

Oferta

---

## Dominios EDM

- EDM-200

---

## Activos DAR

- DAR-200 Patrimonio de Mercado

---

## Productos Consumidores

- API
- ETL
- Integraciones

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Alta.

---

## Indicadores

- Cobertura.
- Frecuencia de captura.
- Calidad de captura.
- Disponibilidad de fuentes.

---

# BS-007 — Market Intelligence Service

## Propósito

Transformar la información capturada en inteligencia de mercado.

Este servicio administra:

- históricos;
- tendencias;
- indicadores;
- cobertura;
- comportamiento del mercado.

---

## Business Capabilities

- BC-003 Inteligencia de Mercado

---

## Aggregate Root

Oferta

---

## Dominios EDM

- EDM-200

---

## Activos DAR

- DAR-200

---

## Productos Consumidores

- Analytics
- IA
- Dashboard
- Observatorio Farmacéutico

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Alta.

---

## Indicadores

- Cobertura histórica.
- Tendencias generadas.
- Calidad analítica.

---

# BS-008 — Comparison Service

## Propósito

Comparar Ofertas pertenecientes a un mismo Concepto Farmacéutico.

Este servicio constituye el principal generador de valor para los usuarios de ComparaFarma.

La comparación considera:

- Precio Efectivo.
- Disponibilidad.
- Beneficios.
- Canal.
- Cobertura.

No administra conocimiento farmacológico.

Consume dicho conocimiento.

---

## Business Capabilities

- BC-004 Comparación Inteligente

---

## Aggregate Root

Oferta

---

## Dominios EDM

- EDM-100
- EDM-200

---

## Activos DAR

- DAR-100
- DAR-200

---

## Productos Consumidores

- Mobile
- Web
- API

---

## Clasificación Jurídica

Información Pública.

---

## Criticidad

Crítica.

---

## Indicadores

- Tiempo de respuesta.
- Precisión.
- Cobertura.
- Calidad de resultados.

---

# Servicios del Dominio de Identidad y Uso

Estos servicios administran la interacción funcional con la plataforma.

La identidad no constituye Patrimonio Digital.

---

# BS-009 — Identity Service

## Propósito

Administrar la autenticación y autorización de usuarios.

Este servicio existe exclusivamente para permitir el acceso seguro a la plataforma.

No administra conocimiento.

---

## Business Capabilities

- BC-005 Gestión de Identidad

---

## Aggregate Root

Identidad

---

## Dominios EDM

- EDM-300

---

## Activos DAR

No aplica directamente.

---

## Productos Consumidores

Todos.

---

## Clasificación Jurídica

Información Personal.

---

## Criticidad

Crítica.

---

## Indicadores

- Disponibilidad.
- Seguridad.
- Tiempo de autenticación.

---

# BS-010 — Profile Service

## Propósito

Administrar el Perfil funcional utilizado por la plataforma.

Gestiona:

- favoritos;
- alertas;
- recetas;
- preferencias;
- configuración.

No administra la identidad civil.

---

## Business Capabilities

- BC-006 Gestión del Perfil

---

## Aggregate Root

Perfil

---

## Dominios EDM

- EDM-300

---

## Activos DAR

DAR-300 Patrimonio de Uso.

---

## Clasificación Jurídica

Información Personal y Sensible.

---

## Criticidad

Alta.

---

## Indicadores

- Calidad del perfil.
- Utilización.
- Personalización.

---

# BS-011 — Usage Intelligence Service

## Propósito

Transformar los eventos generados por la plataforma en conocimiento agregado.

Este servicio constituye el principal mecanismo de crecimiento del Patrimonio de Uso.

Nunca genera conocimiento individualizado.

Toda información deberá anonimizarse o agregarse antes de incorporarse al Patrimonio Digital.

---

## Business Capabilities

- BC-007 Inteligencia de Uso

---

## Aggregate Root

Evento

---

## Dominios EDM

- EDM-300

---

## Activos DAR

- DAR-300 Patrimonio de Uso

---

## Productos Consumidores

- Analytics
- IA
- Roadmap de Producto

---

## Clasificación Jurídica

Información Agregada.

---

## Criticidad

Alta.

---

## Indicadores

- Calidad de anonimización.
- Eventos procesados.
- Conocimiento generado.
- Cobertura analítica.

---

# Relaciones del Dominio

Conocimiento Farmacéutico

↓

Mercado

↓

Comparación

↓

Perfil

↓

Eventos

↓

Conocimiento Agregado

↓

Patrimonio Digital

Los servicios definidos en esta sección representan el mecanismo mediante el cual ComparaFarma transforma la interacción cotidiana de la plataforma en inteligencia reutilizable, respetando los principios de Privacy by Design y la separación entre identidad y patrimonio.


# Servicios del Dominio Comercial

Los siguientes servicios implementan las capacidades relacionadas con la sostenibilidad económica de la Plataforma de Inteligencia Farmacéutica.

Estos servicios administran el modelo comercial.

Nunca modifican el conocimiento farmacéutico.

---

# BS-012 — Subscription Service

## Propósito

Administrar el ciclo de vida completo de las suscripciones Premium de ComparaFarma.

Este servicio determina los derechos (entitlements) disponibles para cada usuario según el plan contratado.

No procesa pagos directamente.

Administra las reglas comerciales derivadas de una suscripción válida.

---

## Business Capabilities

- BC-008 Gestión Comercial

---

## Aggregate Root

Suscripción

---

## Dominios EDM

- EDM-400

---

## Activos DAR

- DAR-400 Patrimonio Comercial

---

## Productos Consumidores

- Mobile
- Web
- API

---

## Clasificación Jurídica

Información Comercial.

---

## Criticidad

Crítica.

---

## Indicadores

- Suscripciones activas.
- Conversión a Premium.
- Renovaciones.
- Cancelaciones.
- Retención.

---

# BS-013 — Entitlement Service

## Propósito

Determinar qué funcionalidades puede utilizar un usuario según:

- plan contratado;
- beneficios vigentes;
- reglas comerciales.

Este servicio desacopla completamente las aplicaciones del modelo comercial.

Las aplicaciones nunca deberán decidir qué funcionalidades habilitar.

---

## Business Capabilities

- BC-008 Gestión Comercial

---

## Aggregate Root

Entitlement

---

## Dominios EDM

- EDM-400

---

## Activos DAR

- DAR-400

---

## Productos Consumidores

Todos.

---

## Clasificación Jurídica

Información Comercial.

---

## Criticidad

Alta.

---

## Indicadores

- Evaluaciones.
- Tiempo de respuesta.
- Consistencia de permisos.

---

# BS-014 — Payment Integration Service

## Propósito

Integrar ComparaFarma con proveedores externos de pago.

Este servicio encapsula las diferencias entre plataformas como:

- Google Play Billing;
- Apple App Store;
- futuros proveedores.

Las reglas comerciales permanecen dentro de ComparaFarma.

Los proveedores únicamente procesan la transacción.

---

## Business Capabilities

- BC-009 Integración Comercial

---

## Aggregate Root

Transacción

---

## Dominios EDM

- EDM-400

---

## Activos DAR

- DAR-400

---

## Productos Consumidores

- Mobile
- API

---

## Clasificación Jurídica

Información Comercial.

---

## Criticidad

Alta.

---

## Indicadores

- Pagos exitosos.
- Errores.
- Conciliación.
- Disponibilidad.

---

# Servicios Transversales

Los siguientes servicios soportan toda la Plataforma de Inteligencia Farmacéutica.

No pertenecen a un dominio específico.

Su responsabilidad consiste en proteger y gobernar el Patrimonio Digital.

---

# BS-015 — Data Governance Service

## Propósito

Administrar el gobierno del Patrimonio Digital.

Garantiza:

- calidad;
- trazabilidad;
- linaje;
- clasificación jurídica;
- cumplimiento normativo.

---

## Business Capabilities

- BC-010 Gobierno de Datos

---

## Aggregate Root

Activo Digital

---

## Dominios EDM

- Todos

---

## Activos DAR

- DAR-100
- DAR-200
- DAR-300
- DAR-400

---

## Clasificación Jurídica

Transversal.

---

## Criticidad

Crítica.

---

## Indicadores

- Calidad del Patrimonio.
- Cumplimiento.
- Cobertura.
- Auditorías.

---

# BS-016 — Observability Service

## Propósito

Monitorear el funcionamiento de los Business Services.

Su objetivo es garantizar:

- disponibilidad;
- trazabilidad;
- desempeño;
- continuidad operacional.

Este servicio administra la observabilidad de la plataforma, no la lógica de negocio.

---

## Business Capabilities

Capacidad transversal.

---

## Aggregate Root

No aplica.

---

## Dominios EDM

Todos.

---

## Criticidad

Alta.

---

## Indicadores

- SLA.
- Disponibilidad.
- Errores.
- Latencia.

---

# Mapa de Relaciones

Cada Business Service deberá mantener trazabilidad con el resto de la Arquitectura Empresarial.

Como mínimo deberá declarar:

- Business Capability implementada.
- Aggregate Root administrado.
- Dominio EDM consumido.
- Activos DAR relacionados.
- Productos consumidores.
- Clasificación jurídica.
- Propietario.
- Estado.
- Criticidad.

Esta información constituye el contrato arquitectónico del servicio.

---

# Evolución

Los Business Services deberán evolucionar únicamente cuando cambie una responsabilidad del negocio.

Los cambios tecnológicos, de infraestructura o de implementación no modifican la definición conceptual de un Business Service.

Toda nueva funcionalidad deberá analizar primero si puede implementarse reutilizando un servicio existente.

La creación de un nuevo Business Service deberá justificarse cuando represente una nueva responsabilidad empresarial y no una simple decisión de implementación.

---

# Declaración Final

Los Business Services representan la forma en que ComparaFarma transforma su Patrimonio Digital en valor para las personas, las instituciones y el sistema de salud.

Constituyen el vínculo entre las capacidades de negocio, el conocimiento administrado por la organización y los productos que materializan dicha propuesta de valor.

Los servicios permanecerán estables en el tiempo.

Las aplicaciones, tecnologías e implementaciones podrán evolucionar libremente siempre que respeten los contratos definidos por este documento.

---

# Control de Cambios

| Versión | Fecha | Autor | Descripción |
|---------|-------|--------|-------------|
| 2.0 (Draft) | 2026-08-03 | CEO / CTO | Reescritura completa alineada con el Digital Asset Register y el Enterprise Data Model. |

---

# Documentos Relacionados

- Carta del Fundador
- Visión 2030
- Digital Asset Register
- Enterprise Data Model
- Business Capability Map
- Product Portfolio
- Operating Model
- Enterprise Roadmap
- Privacy by Design