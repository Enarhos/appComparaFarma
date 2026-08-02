# Estrategia del Catálogo Maestro y Gobierno de Datos

**Documento Estratégico**

Versión: 1.0

Estado: Draft

---

# 1. Visión

El principal activo de ComparaFarma no es la aplicación móvil.

No es el sitio web.

No son las integraciones.

El principal activo de la plataforma será su Catálogo Maestro de Información Farmacéutica.

Todas las funcionalidades actuales y futuras deberán construirse sobre este catálogo.

---

# 2. Objetivo

Construir una única fuente de verdad para toda la información farmacéutica utilizada por la plataforma.

El Catálogo Maestro permitirá desacoplar los productos de las fuentes de datos externas.

---

# 3. Principios

## Fuente única de verdad

Toda la información será normalizada antes de ser utilizada.

Los clientes nunca consumirán directamente los datos provenientes de una farmacia.

---

## Independencia

El modelo interno nunca dependerá de cómo una farmacia represente un medicamento.

Cada fuente podrá cambiar su estructura sin afectar al resto del sistema.

---

## Trazabilidad

Todo dato deberá indicar:

* origen
* fecha de captura
* versión
* nivel de confianza
* proceso de normalización aplicado

---

## Versionado

El catálogo deberá mantener historial.

Los cambios importantes no deberán sobrescribirse.

---

# 4. Modelo Conceptual

El catálogo girará alrededor de una única entidad principal.

## Medicamento Maestro

Cada medicamento tendrá un identificador interno permanente.

Ejemplo:

CFM-000012345

Este identificador será utilizado por toda la plataforma.

Nunca cambiará.

---

# 5. Información del Medicamento Maestro

Cada registro podrá contener, entre otros:

* CFM-ID
* Nombre Canónico
* DCI
* Principios activos
* Concentración
* Forma farmacéutica
* Presentación
* Laboratorio
* Registro ISP
* Código ATC
* Bioequivalencias
* Estado
* Fecha de creación
* Fecha de actualización

---

# 6. Fuentes

El catálogo podrá recibir información desde múltiples orígenes.

Ejemplos:

* Farmacias
* Cenabast
* ISP
* APIs oficiales
* Laboratorios
* Distribuidores
* Importadores

Todas las fuentes alimentarán el mismo modelo.

---

# 7. Catálogo Comercial

Cada fuente podrá publicar múltiples productos comerciales.

Ejemplo

Paracetamol 500 mg

↓

Kitadol

↓

Panadol

↓

Paracetamol Chile

↓

Otras marcas

Todos ellos apuntarán al mismo Medicamento Maestro.

---

# 8. Equivalencias

El catálogo deberá soportar distintos tipos de relación.

* mismo principio activo
* bioequivalente
* equivalente farmacéutico
* sustituto terapéutico
* combinación de principios activos

Estas relaciones serán administradas independientemente de las farmacias.

---

# 9. Historial

Toda variación importante podrá conservarse.

Ejemplos

* precio
* presentación
* laboratorio
* disponibilidad
* registro sanitario

---

# 10. Calidad de Datos

Cada registro tendrá indicadores de calidad.

Ejemplos

* completitud
* consistencia
* confianza
* cantidad de fuentes
* validaciones superadas

---

# 11. Resolución de Conflictos

Cuando dos fuentes entreguen información distinta, el sistema deberá aplicar reglas de resolución.

Ejemplos:

* prioridad de fuente
* fecha de actualización
* validación automática
* revisión manual

Nunca deberá sobrescribirse información sin trazabilidad.

---

# 12. Gobierno de Datos

El Catálogo Maestro será administrado mediante reglas de gobierno.

Todo cambio relevante deberá ser:

* auditable
* reproducible
* trazable

---

# 13. Arquitectura

```text
          Fuentes

              │

              ▼

Data Acquisition Layer

              │

Validación

              │

Normalización

              │

Matching

              │

Catálogo Maestro

              │

Servicios

              │

API

              │

Aplicaciones
```

El Catálogo Maestro será el núcleo de toda la plataforma.

---

# 14. Productos que reutilizarán el catálogo

* Aplicación móvil
* Sitio Web
* Motor de Búsqueda
* Históricos
* Alertas
* IA
* API Pública
* Dashboard
* Analytics
* Observatorio Farmacéutico
* Productos futuros

Todos compartirán exactamente el mismo modelo de datos.

---

# 15. Principio Fundamental

ComparaFarma no almacena información para mostrar medicamentos.

ComparaFarma construye una base de conocimiento farmacéutica.

Las aplicaciones son solamente distintas formas de acceder a ese conocimiento.

---

# 16. Visión 2030

En el largo plazo, el Catálogo Maestro deberá convertirse en uno de los activos tecnológicos más valiosos de la Plataforma de Inteligencia Farmacéutica.

El crecimiento de la empresa dependerá de la calidad, trazabilidad y reutilización de este catálogo más que del número de aplicaciones desarrolladas sobre él.
