# Estrategia de la Red de Farmacias y Fuentes de Datos

**Versión:** 1.0

**Estado:** Draft Estratégico

**Responsable:** Product Strategy

---

# 1. Propósito

El objetivo de ComparaFarma no es integrar la mayor cantidad posible de farmacias.

El objetivo es construir la red de información farmacéutica más confiable, completa y escalable de Chile.

Las farmacias son una de las principales fuentes de datos de la plataforma, pero no la única.

La estrategia de crecimiento se basará en la calidad y cobertura de los datos, antes que en la cantidad de integraciones.

---

# 2. Principios

## Calidad antes que cantidad

Una farmacia solo será integrada cuando aporte valor real a la plataforma.

Agregar una nueva integración implica costos de desarrollo, monitoreo y mantenimiento.

Cada nueva fuente deberá justificar dicho costo mediante un beneficio medible.

---

## Neutralidad

ComparaFarma mantendrá independencia editorial y técnica.

La incorporación de una farmacia nunca dependerá de acuerdos comerciales.

Las comparaciones deberán representar objetivamente la información disponible.

---

## Escalabilidad

Toda nueva integración deberá reutilizar la misma arquitectura.

Nunca deberán desarrollarse soluciones específicas difíciles de mantener.

---

# 3. Objetivo de Cobertura

La plataforma buscará maximizar la cobertura efectiva del mercado farmacéutico.

La métrica principal no será:

Número de farmacias integradas.

La métrica principal será:

Porcentaje del mercado cubierto.

---

# 4. Criterios de incorporación

Cada farmacia será evaluada mediante una matriz de priorización.

| Criterio                 | Peso |
| ------------------------ | ---: |
| Cobertura geográfica     |  20% |
| Participación de mercado |  20% |
| Calidad de los datos     |  20% |
| Estabilidad técnica      |  15% |
| Actualización de precios |  10% |
| Disponibilidad online    |  10% |
| Esfuerzo de integración  |   5% |

La incorporación será priorizada según el puntaje obtenido.

---

# 5. Clasificación de fuentes

## Nivel A

Grandes cadenas nacionales.

Objetivo:

Maximizar cobertura.

Características:

* alta disponibilidad
* alto volumen
* gran cantidad de productos

---

## Nivel B

Farmacias regionales.

Objetivo:

Mejorar cobertura territorial.

---

## Nivel C

Farmacias comunales.

Objetivo:

Aumentar valor social.

---

## Nivel D

Farmacias independientes.

Objetivo:

Incrementar diversidad del mercado.

---

## Nivel E

Fuentes institucionales.

Ejemplos:

* Cenabast
* organismos públicos
* programas especiales

---

# 6. Niveles de integración

No todas las fuentes requieren el mismo nivel de integración.

## Nivel 1

Integración completa

Incluye:

* catálogo
* precios
* stock
* promociones
* despacho
* beneficios

---

## Nivel 2

Integración comercial

Incluye:

* catálogo
* precios

---

## Nivel 3

Integración básica

Incluye:

* catálogo

---

## Nivel 4

Integración referencial

Información limitada utilizada para enriquecer el catálogo.

---

# 7. Mecanismos de adquisición

La plataforma deberá soportar múltiples mecanismos.

En orden de preferencia:

1. API oficial.
2. Feed estructurado (JSON, XML, CSV).
3. Integración acordada con la farmacia.
4. Captura automatizada.
5. Carga manual.

Todos los mecanismos deberán alimentar el mismo modelo interno.

---

# 8. Modelo de datos

Toda fuente deberá transformarse al modelo canónico de ComparaFarma.

Nunca se expondrán directamente los datos originales.

La plataforma será responsable de:

* normalización;
* validación;
* deduplicación;
* enriquecimiento;
* auditoría.

---

# 9. Indicadores de calidad

Cada integración tendrá indicadores propios.

Ejemplos:

* disponibilidad
* tiempo de respuesta
* porcentaje de coincidencias
* errores de catálogo
* errores de precio
* frecuencia de actualización

Estos indicadores serán monitoreados permanentemente.

---

# 10. Incorporación de nuevas fuentes

Toda nueva integración seguirá el siguiente proceso:

1. Evaluación comercial.
2. Evaluación técnica.
3. Prueba piloto.
4. Medición de calidad.
5. Aprobación.
6. Paso a producción.

---

# 11. Criterios de desincorporación

Una fuente podrá ser suspendida cuando:

* presente errores persistentes;
* entregue información inconsistente;
* reduzca significativamente su cobertura;
* incumpla condiciones técnicas.

La calidad de la información tendrá prioridad sobre la cantidad de fuentes disponibles.

---

# 12. Objetivo de largo plazo

Evolucionar desde una plataforma que compara precios entre farmacias hacia una infraestructura nacional de inteligencia farmacéutica, donde las farmacias sean una de múltiples fuentes de información integradas bajo un modelo de datos unificado.
