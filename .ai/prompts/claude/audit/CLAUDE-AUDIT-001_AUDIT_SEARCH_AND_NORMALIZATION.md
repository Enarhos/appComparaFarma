Actúa como Senior Software Engineer del proyecto ComparaFarma.

Objetivo:
Realizar una auditoría exhaustiva del módulo de normalización y del flujo completo de búsqueda, SIN modificar código.

Archivos principales a revisar:
- normalization.ts
- searchService.ts

También revisa cualquier archivo relacionado con:
- clientes de farmacias
- cache
- deduplicación
- ranking
- stores
- hooks
- pantallas de búsqueda
- tests asociados

Alcance de la auditoría:

1. Documentar el flujo completo de datos:
   - desde que el usuario escribe una búsqueda
   - hasta que se muestran los resultados
   - incluyendo API, cache, normalización, ranking, deduplicación y errores.

2. Identificar riesgos:
   - datos mal normalizados
   - duplicados
   - errores por farmacias caídas
   - inconsistencias entre farmacias
   - problemas de performance
   - problemas de escalabilidad
   - deuda técnica
   - errores silenciosos
   - casos borde.

3. Revisar calidad del código:
   - separación de responsabilidades
   - legibilidad
   - complejidad
   - acoplamiento
   - manejo de errores
   - cobertura de tests.

4. Proponer mejoras:
   - quick wins
   - refactors
   - nuevos tests
   - mejoras de arquitectura
   - mejoras de datos.

5. Generar Issues concretos:
   Para cada hallazgo importante, crea una propuesta de Issue con este formato:

   CF-XXX - Título

   Epic:
   Problema:
   Impacto:
   Solución propuesta:
   Archivos afectados:
   Criterios de aceptación:
   Riesgos:
   Prioridad:
   Esfuerzo estimado:

Entrega esperada:
Crear un archivo nuevo en:

docs/archive/audits/AUDIT_SEARCH_NORMALIZATION.md

El documento debe incluir:

- resumen ejecutivo
- mapa del flujo de búsqueda
- análisis de normalization.ts
- análisis de searchService.ts
- riesgos detectados
- quick wins
- refactors recomendados
- tests recomendados
- issues propuestos
- recomendación final

Restricciones:
- No modificar código fuente.
- No cambiar comportamiento.
- No instalar dependencias.
- No borrar archivos.
- Solo crear el documento de auditoría.