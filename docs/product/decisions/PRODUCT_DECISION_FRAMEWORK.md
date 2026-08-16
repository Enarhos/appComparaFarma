# Product Decision Framework (PDF)

Versión: 1.0

Responsable: CTO

Estado: Activo

---

# Objetivo

Definir un modelo único para evaluar cualquier iniciativa relacionada con ComparaFarma.

Este documento busca eliminar decisiones basadas únicamente en intuición y asegurar que toda nueva funcionalidad contribuya al crecimiento del producto.

---

# Principio

No desarrollamos funcionalidades.

Invertimos tiempo de desarrollo.

Cada hora invertida debe generar el mayor valor posible.

---

# Criterios de Evaluación

## 1. Valor para el Usuario (VU)

¿Cuánto mejora la vida del usuario?

| Puntaje | Descripción |
|----------|-------------|
| 1 | Casi ningún beneficio |
| 2 | Beneficio menor |
| 3 | Útil |
| 4 | Muy útil |
| 5 | Esencial |

Peso: 25%

---

## 2. Valor para el Negocio (VN)

¿Contribuye al crecimiento del producto?

Considerar:

- adquisición
- retención
- confianza
- monetización

| Puntaje | Descripción |
|----------|-------------|
|1|Muy bajo|
|5|Muy alto|

Peso: 15%

---

## 3. Diferenciación (DF)

¿Nos hace diferentes de otras aplicaciones?

Peso: 20%

---

## 4. Impacto Estratégico (IE)

¿Nos acerca a la visión de ComparaFarma?

Peso: 20%

---

## 5. Complejidad Técnica (CT)

Mientras más simple sea desarrollar, mayor puntaje.

Peso: 10%

---

## 6. Costo de Mantención (CM)

Mientras menor esfuerzo de mantenimiento requiera, mayor puntaje.

Peso: 5%

---

## 7. Riesgo (RG)

Mientras menor riesgo tenga, mayor puntaje.

Peso: 5%

---

# Fórmula

CFPS =
(VU×0.25) +
(VN×0.15) +
(DF×0.20) +
(IE×0.20) +
(CT×0.10) +
(CM×0.05) +
(RG×0.05)

Resultado entre 1 y 5.

---

# Clasificación

4.5 - 5.0

Crítica

Debe entrar al próximo Sprint.

---

4.0 - 4.49

Alta

Planificar pronto.

---

3.0 - 3.99

Media

Evaluar.

---

Menor a 3

Backlog futuro.

---

# Reglas

## Regla 1

Toda nueva funcionalidad debe tener un puntaje CFPS.

---

## Regla 2

No se desarrolla ninguna funcionalidad que no exista previamente en BACKLOG_PRODUCT.md.

---

## Regla 3

Las funcionalidades críticas deben tener métricas definidas antes del desarrollo.

---

## Regla 4

Toda funcionalidad debe indicar claramente:

- Problema
- Usuario
- Beneficio
- Métrica de éxito
- Riesgos

---

## Regla 5

La opinión nunca reemplaza los datos.

Cuando existan métricas reales, prevalecerán sobre las opiniones.
