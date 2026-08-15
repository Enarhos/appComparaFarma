# Enterprise Data Model (EDM)

**Código:** ENT-EDM-001

**Versión:** 2.0 (Draft)

**Estado:** En Elaboración

**Clasificación:** Documento de Arquitectura Empresarial

**Propietario:** CEO / CTO

**Última actualización:** 2026-08-03

---

# Propósito

El Enterprise Data Model (EDM) define el modelo conceptual del conocimiento administrado por ComparaFarma.

Su propósito es establecer una representación común, estable y consistente de las entidades fundamentales del negocio, independientemente de cualquier implementación tecnológica.

El EDM constituye el lenguaje oficial mediante el cual la organización comprende, organiza y relaciona el conocimiento farmacéutico, el conocimiento del mercado, el conocimiento derivado del uso de la plataforma y el conocimiento comercial.

No representa tablas de bases de datos.

No representa APIs.

No representa clases de programación.

Representa el conocimiento permanente de la organización.

---

# Relación con el Digital Asset Register

El Digital Asset Register identifica el Patrimonio Digital.

El Enterprise Data Model describe cómo se estructura dicho patrimonio.

Cada entidad definida en este documento deberá contribuir directa o indirectamente a uno o más Activos Digitales registrados en el DAR.

En consecuencia:

- el DAR responde **qué patrimonio posee la empresa**;
- el EDM responde **cómo está organizado ese patrimonio**.

Ambos documentos constituyen el núcleo de la Arquitectura Empresarial de ComparaFarma.

---

# Alcance

Este modelo aplica a:

- productos móviles;
- plataforma web;
- APIs;
- motores de integración;
- inteligencia artificial;
- analítica;
- modelos predictivos;
- integraciones institucionales;
- productos futuros.

Toda nueva iniciativa deberá utilizar las entidades definidas por este documento antes de proponer nuevas estructuras conceptuales.

---

# Objetivos

El Enterprise Data Model tiene los siguientes objetivos:

- establecer un lenguaje común para toda la organización;
- evitar modelos de datos inconsistentes;
- proteger el significado del conocimiento farmacéutico;
- facilitar la interoperabilidad entre productos;
- soportar la evolución del Patrimonio Digital;
- permitir la reutilización de conocimiento entre dominios;
- servir como referencia para la evolución tecnológica.

---

# Principios

## Principio 1 — El modelo representa conocimiento

El Enterprise Data Model representa conceptos permanentes del negocio.

Nunca representa decisiones técnicas de implementación.

---

## Principio 2 — El Concepto Farmacéutico es la entidad central

La unidad fundamental del conocimiento administrado por ComparaFarma es el Concepto Farmacéutico.

Los productos comerciales constituyen manifestaciones comerciales de dicho concepto.

Las ofertas representan manifestaciones temporales del mercado.

---

## Principio 3 — Independencia tecnológica

Las entidades descritas por este modelo deberán permanecer estables aunque cambien:

- lenguajes;
- frameworks;
- motores de bases de datos;
- proveedores cloud;
- aplicaciones.

---

## Principio 4 — Fuente única de significado

Cada entidad tendrá una única definición conceptual.

Las distintas aplicaciones podrán representarla de formas diferentes, pero nunca modificar su significado.

---

## Principio 5 — Reutilización

Toda nueva capacidad empresarial deberá reutilizar las entidades existentes antes de crear nuevas.

La duplicación conceptual constituye deuda de arquitectura.

---

## Principio 6 — Separación entre Identidad y Patrimonio

La identidad civil de las personas no forma parte del Patrimonio Digital.

La autenticación constituye un mecanismo operativo.

El conocimiento generado por la plataforma constituye patrimonio.

Ambos conceptos deberán permanecer desacoplados.

---

## Principio 7 — Privacy by Design

El modelo minimizará el tratamiento de datos personales.

Siempre que sea posible, el conocimiento incorporado al Patrimonio Digital deberá provenir de información agregada, anonimizada o seudonimizada.

Las entidades que administren datos personales deberán justificar explícitamente su existencia.

---

## Principio 8 — Modelo semántico

El Enterprise Data Model representa el significado del conocimiento.

Las estructuras físicas de almacenamiento constituyen implementaciones derivadas.

---

# Arquitectura Conceptual

El conocimiento administrado por ComparaFarma se organiza mediante la siguiente estructura.

                    Patrimonio Digital
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
 Conocimiento        Mercado            Uso Agregado
 Farmacéutico      Farmacéutico        de la Plataforma
        │                  │                  │
        └──────────────┬───┴──────────────────┘
                       │
                       ▼
             Modelo Conceptual Empresarial
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
 Conceptos       Relaciones      Identidades
 Empresariales   Empresariales   Canónicas
                       │
                       ▼
             Business Services
                       │
                       ▼
                  Productos

---

# Dominios Empresariales

El Enterprise Data Model se organiza en cinco dominios de conocimiento.

Cada dominio representa una perspectiva permanente del Patrimonio Digital.

## EDM-100

Conocimiento Farmacéutico

Representa el conocimiento científico administrado por la plataforma.

Se relaciona principalmente con:

DAR-100 — Patrimonio de Conocimiento.

---

## EDM-200

Mercado Farmacéutico

Representa el conocimiento sobre la comercialización de medicamentos.

Se relaciona principalmente con:

DAR-200 — Patrimonio de Mercado.

---

## EDM-300

Identidad y Uso

Representa la interacción funcional con la plataforma.

Se relaciona principalmente con:

DAR-300 — Patrimonio de Uso.

La identidad civil no constituye patrimonio.

---

## EDM-400

Dominio Comercial

Representa las entidades necesarias para administrar la sostenibilidad económica de la plataforma.

Se relaciona con:

DAR-400 — Patrimonio Comercial.

---

## EDM-500

Gobierno del Conocimiento

Representa las entidades responsables de preservar la calidad, trazabilidad y gobierno del Patrimonio Digital.

Este dominio soporta transversalmente a todos los demás.

---

# Relación entre Dominios

Los dominios empresariales no funcionan de manera aislada.

Cada uno contribuye al crecimiento del Patrimonio Digital.

Conocimiento Farmacéutico

↓

Mercado Farmacéutico

↓

Uso Agregado

↓

Inteligencia

↓

Productos

↓

Nuevo Conocimiento

Este ciclo constituye el mecanismo mediante el cual ComparaFarma incrementa continuamente el valor de su Patrimonio Digital.

---

# Clasificación de las Entidades

Toda entidad definida por este modelo deberá indicar explícitamente:

- nombre conceptual;
- propósito;
- dominio empresarial;
- propietario;
- fuente única de verdad;
- identificador canónico;
- clasificación jurídica;
- relación con el DAR;
- Business Capability asociada;
- Business Service consumidor.

Esta información constituye el contrato semántico de la entidad y deberá mantenerse consistente en todos los productos de la plataforma.

# EDM-100 — Dominio de Conocimiento Farmacéutico

## Propósito

El Dominio de Conocimiento Farmacéutico representa el núcleo semántico de la Plataforma de Inteligencia Farmacéutica.

Su propósito es modelar el conocimiento farmacológico de manera independiente de laboratorios, marcas comerciales, farmacias, tecnologías o aplicaciones.

Este dominio constituye la representación oficial del conocimiento científico administrado por ComparaFarma.

Se encuentra directamente relacionado con:

DAR-100 — Patrimonio de Conocimiento.

---

# Principios del Dominio

## El conocimiento antecede al mercado.

Los medicamentos comerciales representan manifestaciones del conocimiento farmacológico.

Nunca lo definen.

---

## La identidad farmacológica es única.

Un mismo concepto farmacológico puede tener múltiples presentaciones comerciales.

Todas ellas representan una única identidad científica.

---

## El conocimiento es permanente.

Las marcas cambian.

Los laboratorios cambian.

Los precios cambian.

El Concepto Farmacéutico permanece.

---

# Aggregate Root

## Concepto Farmacéutico

El Concepto Farmacéutico constituye la entidad central del Enterprise Data Model.

Representa una identidad farmacológica única administrada por ComparaFarma.

Todo el conocimiento del dominio se organiza alrededor de esta entidad.

---

## Definición

Un Concepto Farmacéutico corresponde a una combinación única de:

- Principio Activo
- Concentración
- Forma Farmacéutica
- Vía de Administración
- Unidad Farmacéutica

Ejemplo:

Paracetamol

+

500 mg

+

Comprimido

+

Vía Oral

↓

Concepto Farmacéutico

---

# Identificador Canónico

Cada Concepto Farmacéutico deberá poseer un identificador permanente.

Propuesta:

CFM-CONCEPT-ID

Este identificador será independiente de:

- laboratorios;
- farmacias;
- marcas comerciales;
- tecnologías.

Nunca deberá cambiar.

---

# Propiedades Conceptuales

Todo Concepto Farmacéutico deberá mantener como mínimo:

- CFM-CONCEPT-ID
- Nombre Canónico
- Principio(s) Activo(s)
- Concentración
- Forma Farmacéutica
- Vía de Administración
- Unidad Farmacéutica
- Estado
- Fuente de Verdad
- Fecha de Creación
- Fecha de Actualización

---

# Relaciones

Un Concepto Farmacéutico podrá relacionarse con:

- múltiples Presentaciones Farmacéuticas;
- múltiples Productos Medicinales Comerciales;
- múltiples Bioequivalencias;
- múltiples Ofertas;
- múltiples Históricos.

---

# Principio Activo

Representa la sustancia responsable del efecto terapéutico.

Todo Principio Activo deberá poseer una identidad única.

Propiedades mínimas:

- Identificador
- Nombre
- Sinónimos
- Clasificación terapéutica
- Estado

---

# Asociación de Principios Activos

Representa una combinación estable de principios activos.

Ejemplo:

Amoxicilina + Ácido Clavulánico.

La asociación constituye una entidad propia.

No una concatenación de nombres.

---

# Concentración

Representa la cantidad de principio activo presente.

Ejemplos:

- 500 mg
- 1 g
- 250 mg/5 mL

La concentración deberá administrarse de manera estructurada.

Nunca únicamente como texto.

---

# Forma Farmacéutica

Representa la forma física mediante la cual se administra un medicamento.

Ejemplos:

- Comprimido
- Cápsula
- Jarabe
- Suspensión
- Crema
- Solución
- Ampolla

---

# Vía de Administración

Describe la vía mediante la cual se administra un medicamento.

Ejemplos:

- Oral
- Intravenosa
- Intramuscular
- Tópica
- Oftálmica
- Nasal

---

# Unidad Farmacéutica

Representa la unidad utilizada para expresar la presentación farmacológica.

Ejemplos:

- comprimido
- cápsula
- ampolla
- frasco
- sobre

---

# Presentación Farmacéutica

Representa la forma física mediante la cual un Concepto Farmacéutico se comercializa.

No corresponde a una marca.

No corresponde a un laboratorio.

Ejemplos:

Caja con 16 comprimidos.

Caja con 30 comprimidos.

Frasco de 120 mL.

---

## Identificador

CFM-PRESENTATION-ID

---

## Propiedades

- Concepto Farmacéutico
- Cantidad
- Unidad
- Contenido Total
- Tipo de Envase

---

# Producto Medicinal Comercial

Representa un medicamento comercializado por un laboratorio específico.

Un Producto Medicinal Comercial constituye una manifestación comercial de un Concepto Farmacéutico.

---

## Identificador

CFM-PRODUCT-ID

---

## Propiedades

- Marca Comercial
- Laboratorio
- Registro ISP
- Estado
- Condición de Bioequivalencia

---

# Laboratorio

Representa una organización responsable de fabricar o comercializar un Producto Medicinal Comercial.

Propiedades:

- Identificador
- Nombre
- País
- Estado

---

# Registro Sanitario

Representa el registro regulatorio asociado a un Producto Medicinal Comercial.

Ejemplos:

Registro ISP.

Fecha de autorización.

Estado.

---

# Bioequivalencia

Representa la relación regulatoria entre un Producto Medicinal Comercial y un Concepto Farmacéutico.

No todos los productos poseen condición de bioequivalencia.

Cuando exista, deberá almacenarse como una entidad explícita del modelo.

---

# Ontología Farmacéutica

La Ontología Farmacéutica representa el conjunto de relaciones semánticas administradas por ComparaFarma.

Ejemplos:

- pertenece a una familia terapéutica;
- contiene un principio activo;
- posee bioequivalentes;
- corresponde a una combinación farmacológica;
- requiere receta;
- pertenece a una categoría.

La Ontología constituye uno de los principales Activos Digitales del Patrimonio de Conocimiento.

---

# Modelo Conceptual del Dominio

Concepto Farmacéutico

↓

Presentación Farmacéutica

↓

Producto Medicinal Comercial

↓

Registro Sanitario

↓

Bioequivalencia

↓

Mercado Farmacéutico

Esta secuencia representa la evolución natural del conocimiento desde la ciencia farmacológica hasta su manifestación comercial.

El mercado nunca redefine el conocimiento.

Únicamente lo utiliza.


# EDM-200 — Dominio de Mercado Farmacéutico

## Propósito

El Dominio de Mercado Farmacéutico representa la manifestación comercial del conocimiento farmacéutico.

Mientras el Dominio de Conocimiento describe qué es un medicamento desde una perspectiva científica, este dominio describe cómo dicho conocimiento se materializa en el mercado.

Este dominio administra la relación entre productos comerciales, farmacias, precios, disponibilidad y condiciones de venta.

Se encuentra directamente relacionado con:

DAR-200 — Patrimonio de Mercado.

---

# Principios del Dominio

## El mercado utiliza el conocimiento.

Nunca lo redefine.

Toda Oferta deberá referenciar un Producto Medicinal Comercial previamente definido en el Dominio de Conocimiento Farmacéutico.

---

## La Oferta es temporal.

Los precios cambian.

El stock cambia.

Las promociones cambian.

La Oferta representa el estado del mercado en un instante determinado.

---

## El histórico constituye conocimiento.

Una Oferta desaparece.

Su evolución histórica permanece como Patrimonio Digital.

---

# Aggregate Root

## Oferta

La Oferta constituye la entidad central del Dominio de Mercado.

Representa la disponibilidad comercial de un Producto Medicinal Comercial en un canal de venta específico.

---

# Identificador

Cada Oferta deberá poseer un identificador único.

Propuesta:

CFM-OFFER-ID

---

# Propiedades

Toda Oferta deberá contener, como mínimo:

- CFM-OFFER-ID
- Producto Medicinal Comercial
- Farmacia
- Sucursal
- Canal
- Precio Lista
- Precio Efectivo
- Beneficios Aplicables
- Disponibilidad
- Fecha de Captura
- Estado

---

# Precio

El Precio representa el valor monetario de una Oferta en un momento determinado.

No constituye una entidad permanente.

Su valor debe interpretarse siempre dentro del contexto de una Oferta.

---

# Precio Lista

Representa el precio publicado originalmente por la farmacia.

---

# Precio Efectivo

Representa el precio real que un usuario puede obtener considerando:

- descuentos;
- convenios;
- beneficios;
- programas de fidelización;
- promociones;
- medios de pago.

El Precio Efectivo constituye el valor principal utilizado por los motores de comparación de ComparaFarma.

---

# Beneficio Comercial

Representa cualquier mecanismo que modifique el Precio Efectivo.

Ejemplos:

- convenios;
- programas de fidelización;
- descuentos institucionales;
- campañas comerciales;
- promociones temporales;
- descuentos por medio de pago.

Los beneficios constituyen entidades independientes.

Nunca deberán almacenarse únicamente como texto.

---

# Promoción

Representa una condición comercial temporal.

Ejemplos:

- 2x1
- descuento porcentual
- descuento fijo
- promoción por cantidad
- promoción por vigencia

---

# Disponibilidad

Representa la capacidad de adquirir una Oferta.

Ejemplos:

- Disponible
- Sin Stock
- Stock Limitado
- Sólo Online
- Sólo Presencial

---

# Canal

Representa el mecanismo mediante el cual una Oferta puede adquirirse.

Ejemplos:

- Presencial
- Online
- Marketplace
- Convenio
- Programa Especial

---

# Farmacia

Representa una organización que comercializa Productos Medicinales Comerciales.

Una Farmacia podrá administrar múltiples sucursales.

---

# Propiedades

- CFM-PHARMACY-ID
- Nombre
- Tipo
- Estado
- Cobertura

---

# Sucursal

Representa un establecimiento físico perteneciente a una Farmacia.

Una Oferta podrá encontrarse disponible en una o más sucursales.

---

# Propiedades

- Identificador
- Farmacia
- Dirección
- Región
- Comuna
- Coordenadas
- Estado

---

# Histórico de Precios

Representa la evolución temporal de una Oferta.

No constituye una copia del precio.

Constituye un Activo Digital del Patrimonio de Mercado.

---

# Propiedades

- Oferta
- Fecha
- Precio Lista
- Precio Efectivo
- Beneficios
- Disponibilidad

---

# Cobertura

Representa el nivel de observación del mercado logrado por ComparaFarma.

Puede analizarse desde distintas dimensiones:

- cobertura nacional;
- cobertura regional;
- cobertura comunal;
- cobertura por cadena;
- cobertura por principio activo;
- cobertura temporal.

La Cobertura constituye uno de los principales indicadores del Patrimonio de Mercado.

---

# Captura

Representa un proceso mediante el cual ComparaFarma obtiene información desde una fuente.

La Captura no corresponde al dato.

Corresponde al evento que incorpora nuevo conocimiento al Patrimonio Digital.

---

# Fuente

Representa el origen de una Captura.

Ejemplos:

- API
- Sitio Web
- Integración institucional
- Archivo
- Convenio

Las fuentes podrán evolucionar sin modificar el modelo conceptual.

---

# Modelo Conceptual

Concepto Farmacéutico

↓

Presentación Farmacéutica

↓

Producto Medicinal Comercial

↓

Oferta

↓

Precio

↓

Beneficio

↓

Disponibilidad

↓

Histórico

↓

Inteligencia de Mercado

---

# Relación con DAR

Este dominio materializa principalmente:

DAR-200

Patrimonio de Mercado.

El conocimiento generado por este dominio permitirá construir:

- tendencias;
- comportamiento histórico;
- análisis de cobertura;
- indicadores de disponibilidad;
- modelos predictivos;
- inteligencia comercial.

---

# Principios de Calidad

Toda información incorporada al Dominio de Mercado deberá cumplir, como mínimo, los siguientes criterios:

- trazabilidad;
- actualidad;
- consistencia;
- verificabilidad;
- completitud;
- temporalidad.

La calidad del Patrimonio de Mercado dependerá directamente del cumplimiento de estos principios.

---

# Evolución

El Dominio de Mercado deberá evolucionar mediante:

- incorporación de nuevas farmacias;
- nuevos canales;
- nuevas fuentes;
- enriquecimiento de ofertas;
- nuevos beneficios;
- nuevos indicadores;
- mejoras de cobertura.

La evolución de este dominio deberá incrementar el valor del Patrimonio de Mercado sin alterar el modelo conceptual del conocimiento farmacéutico.


# EDM-300 — Dominio de Identidad y Uso

## Propósito

El Dominio de Identidad y Uso representa los mecanismos mediante los cuales una persona interactúa con la Plataforma de Inteligencia Farmacéutica.

Este dominio no forma parte del Patrimonio de Conocimiento.

Su objetivo es permitir la autenticación, la personalización de la experiencia y la generación de conocimiento agregado respetando los principios de Privacy by Design.

Se encuentra relacionado principalmente con:

DAR-300 — Patrimonio de Uso.

---

# Principios del Dominio

## La identidad no constituye patrimonio.

ComparaFarma no acumula conocimiento sobre personas.

La identidad existe únicamente para permitir:

- autenticación;
- autorización;
- continuidad del servicio;
- ejercicio de derechos.

---

## El perfil pertenece al usuario.

No a ComparaFarma.

La plataforma administra un Perfil funcional.

No una representación de la identidad civil.

---

## El conocimiento pertenece al Patrimonio Digital.

Las interacciones podrán transformarse en conocimiento agregado.

Nunca en conocimiento individualizado.

---

# Aggregate Root

## Perfil

El Perfil constituye la entidad principal del dominio.

Representa la configuración funcional utilizada por la plataforma.

No representa la identidad de una persona.

---

# Identidad

La Identidad representa el mecanismo mediante el cual un usuario accede a la plataforma.

Podrá implementarse mediante:

- Google
- Apple
- correo electrónico
- proveedores futuros

La implementación tecnológica es independiente del modelo conceptual.

---

## Propiedades

- Identity ID
- Proveedor
- Estado
- Fecha de creación
- Consentimientos vigentes

La identidad no almacenará información innecesaria para la operación de la plataforma.

---

# Perfil

Representa la configuración funcional del usuario.

Podrá contener:

- favoritos;
- alertas;
- recetas;
- preferencias;
- configuraciones;
- historial funcional.

El Perfil nunca deberá depender de la identidad civil.

---

# Receta

Representa una prescripción administrada por el usuario.

Las recetas constituyen información de carácter sensible.

Su tratamiento deberá cumplir los principios de:

- minimización;
- finalidad;
- seguridad;
- confidencialidad;
- consentimiento.

---

# Tratamiento

Representa un conjunto de medicamentos asociados a una condición clínica determinada.

Los tratamientos pertenecen al Perfil del usuario.

No forman parte del Patrimonio Digital.

---

# Evento

Representa una interacción realizada dentro de la plataforma.

Ejemplos:

- búsqueda;
- comparación;
- apertura de ficha;
- creación de alerta;
- consulta de receta.

Los eventos constituyen la materia prima para generar conocimiento agregado.

---

# Conocimiento Agregado

Representa información anonimizada derivada de múltiples eventos.

Ejemplos:

- medicamentos más consultados;
- ahorro promedio;
- tendencias estacionales;
- utilización de funcionalidades.

Una vez anonimizado, este conocimiento pasa a formar parte del Patrimonio Digital.

---

# EDM-400 — Dominio Comercial

## Propósito

Representa las entidades necesarias para administrar la sostenibilidad económica de ComparaFarma.

Este dominio soporta la monetización de la plataforma sin modificar el modelo farmacéutico.

---

# Aggregate Root

## Suscripción

Representa la relación comercial existente entre un usuario y la plataforma.

---

# Entidades principales

- Plan
- Suscripción
- Entitlement
- Beneficio
- Pago
- Renovación
- Facturación

---

# Principios

Las reglas comerciales deberán permanecer desacopladas del conocimiento farmacéutico.

La evolución del modelo de negocio nunca deberá modificar el significado de las entidades científicas.

---

# EDM-500 — Gobierno del Conocimiento

## Propósito

Representa las entidades necesarias para gobernar el Patrimonio Digital.

Este dominio asegura:

- calidad;
- trazabilidad;
- auditoría;
- linaje;
- cumplimiento normativo.

---

# Entidades

## Fuente

Representa el origen del conocimiento.

---

## Captura

Representa el evento mediante el cual ComparaFarma incorpora nueva información.

---

## Validación

Representa los procesos que determinan la calidad del conocimiento.

---

## Linaje

Permite conocer el origen y la evolución de cada dato.

---

## Calidad

Representa indicadores asociados al Patrimonio Digital.

Ejemplos:

- completitud;
- consistencia;
- actualidad;
- exactitud.

---

## Auditoría

Registra las modificaciones relevantes realizadas sobre el Patrimonio Digital.

---

# Clasificación Jurídica

Toda entidad del Enterprise Data Model deberá clasificarse jurídicamente.

## Información Pública

Ejemplos:

- Conceptos Farmacéuticos;
- Principios Activos;
- Laboratorios;
- Farmacias.

---

## Información Comercial

Ejemplos:

- ofertas;
- promociones;
- beneficios;
- históricos.

---

## Información Personal

Ejemplos:

- perfil;
- preferencias;
- favoritos.

---

## Información Sensible

Ejemplos:

- recetas;
- tratamientos.

---

## Información Agregada

Ejemplos:

- tendencias;
- indicadores;
- estadísticas.

La información agregada constituye Patrimonio Digital.

---

# Relaciones con la Arquitectura Empresarial

El Enterprise Data Model constituye el modelo semántico del Patrimonio Digital.

Su relación con el resto de la arquitectura es la siguiente:

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

Toda modificación al modelo conceptual deberá reflejarse en el Business Capability Map, en los Business Services y en el Digital Asset Register cuando corresponda.

---

# Evolución del Modelo

El Enterprise Data Model deberá evolucionar únicamente cuando cambie el conocimiento administrado por ComparaFarma.

La incorporación de nuevas tecnologías, aplicaciones o bases de datos no constituye una razón suficiente para modificar este documento.

El modelo conceptual deberá permanecer estable y representar la visión de largo plazo de la Plataforma de Inteligencia Farmacéutica.

---

# Declaración Final

ComparaFarma reconoce que su principal activo estratégico es el conocimiento.

El Enterprise Data Model constituye la representación oficial de dicho conocimiento y establece el lenguaje común utilizado por toda la organización.

Toda aplicación, servicio, integración o tecnología deberá implementar este modelo, pero nunca redefinirlo.

El conocimiento permanecerá.

Las implementaciones evolucionarán.

Esta distinción constituye uno de los principios fundamentales de la Arquitectura Empresarial de ComparaFarma.

---

# Control de Cambios

| Versión | Fecha | Autor | Descripción |
|---------|-------|--------|-------------|
| 2.0 (Draft) | 2026-08-03 | CEO / CTO | Reescritura completa alineada con el Digital Asset Register, Business Capability Map y Business Services. |

---

# Documentos Relacionados

- Digital Asset Register
- Business Capability Map
- Business Services
- Product Portfolio
- Operating Model
- Enterprise Roadmap
- Privacy by Design