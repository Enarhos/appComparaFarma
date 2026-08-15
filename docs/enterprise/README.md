# Enterprise Architecture

**Estado:** Activo

**Versión:** 1.0

---

# Propósito

La carpeta `docs/enterprise` contiene la Arquitectura Empresarial de la Plataforma de Inteligencia Farmacéutica.

Su objetivo es describir **qué es la empresa**, **qué capacidades posee**, **qué activos construye** y **cómo se relacionan todos sus productos**.

Esta documentación no reemplaza la estrategia, la arquitectura técnica ni la documentación de producto.

Las complementa.

---

# Objetivo

La Arquitectura Empresarial responde preguntas como:

* ¿Qué sabe hacer la empresa?
* ¿Qué activos estratégicos construye?
* ¿Qué productos ofrece?
* ¿Qué servicios reutilizan esos productos?
* ¿Qué datos constituyen el núcleo del negocio?
* ¿Cómo evoluciona la empresa en el tiempo?

El foco está en el negocio y en la plataforma, no en una tecnología específica.

---

# Alcance

La Arquitectura Empresarial describe únicamente elementos permanentes de la organización.

No describe:

* tareas de desarrollo;
* backlog;
* tecnologías particulares;
* detalles de implementación;
* decisiones temporales de ingeniería.

Esos aspectos pertenecen a otras áreas de documentación.

---

# Relación con el resto del repositorio

La Arquitectura Empresarial utiliza como base la documentación existente del proyecto.

| Carpeta              | Rol                                             |
| -------------------- | ----------------------------------------------- |
| `docs/book/`         | Historia, propósito y principios fundacionales. |
| `docs/strategy/`     | Estrategias de negocio y visión de largo plazo. |
| `docs/product/`      | Gestión del producto, roadmap y backlog.        |
| `docs/architecture/` | Arquitectura de software y decisiones técnicas. |
| `docs/adr/`          | Architectural Decision Records.                 |
| `docs/rfc/`          | Propuestas técnicas en evaluación.              |
| `docs/enterprise/`   | Modelo empresarial de la plataforma.            |

La información no debe duplicarse entre estas carpetas.

Cada decisión debe mantenerse en una única fuente de verdad.

---

# Principios

La Arquitectura Empresarial se basa en los siguientes principios.

## 1. Pensar en capacidades antes que en aplicaciones.

Las aplicaciones cambian.

Las capacidades del negocio permanecen.

---

## 2. Pensar en activos antes que en funcionalidades.

Las funcionalidades implementan valor.

Los activos acumulan valor.

---

## 3. Separar negocio de tecnología.

Las decisiones del negocio no deben depender de herramientas específicas.

---

## 4. Reutilización.

Los productos deben construirse reutilizando servicios y activos comunes.

---

## 5. Evolución continua.

La Arquitectura Empresarial es un modelo vivo.

Debe evolucionar junto con la plataforma.

---

# Estructura

La Arquitectura Empresarial está organizada mediante modelos relacionados entre sí.

```text
Enterprise Architecture

↓

Enterprise Meta Model

↓

Business Capability Map

↓

Strategic Assets

↓

Business Services

↓

Product Portfolio

↓

Enterprise Data Model

↓

Operating Model

↓

Enterprise Roadmap
```

Cada documento responde una pregunta específica y depende de los anteriores.

---

# Orden recomendado de lectura

Para comprender la empresa se recomienda el siguiente recorrido:

1. Carta del Fundador (`docs/book/`)
2. Visión 2030 (`docs/strategy/`)
3. Enterprise Meta Model
4. Business Capability Map
5. Strategic Assets
6. Business Services
7. Product Portfolio
8. Enterprise Data Model
9. Operating Model
10. Enterprise Roadmap

---

# Fuente de verdad

La Arquitectura Empresarial no reemplaza la documentación existente.

Su función es integrar y relacionar las distintas perspectivas del proyecto bajo un modelo único de empresa.

Cuando exista una discrepancia entre modelos, deberá revisarse la documentación correspondiente para mantener una única fuente de verdad.

---

# Evolución

Toda incorporación de nuevas capacidades, productos o activos estratégicos deberá reflejarse en esta arquitectura antes de propagarse al resto de la documentación especializada.

La Arquitectura Empresarial constituye el nivel más alto de modelado de la Plataforma de Inteligencia Farmacéutica.
