# Prompt para Claude Code — Sprint Web 1

Trabaja directamente sobre el repositorio actual de ComparaFarma.

## Rol

Actúa como software factory senior. Debes implementar, probar y documentar el cambio; no rediseñar el proyecto ni realizar refactors fuera del alcance.

## Objetivo

Implementar la primera ficha pública de medicamento con histórico real de precios, reutilizando la tabla `price_history` y el registro existente en `api/src/lib/priceHistoryDb.ts`.

Antes de modificar código, lee obligatoriamente:

- `CLAUDE.md`
- `docs/database/schema.sql`
- `docs/deployment.md`
- `docs/normalization.md`
- `docs/price-channels.md`
- `api/src/lib/priceHistoryDb.ts`
- `api/src/services/searchService.ts`
- `api/src/routes/search.ts`
- `web/src/app/buscar/[query]/page.tsx`
- `web/src/components/MedicationCard.tsx`
- `web/src/lib/search.ts`

Usa también el RFC adjunto o ubicado en:

`docs/architecture/RFC-002_MEDICATION_DETAIL_AND_PRICE_HISTORY.md`

## Restricciones duras

1. NO modificar ningún archivo dentro de `mobile/`.
2. NO cambiar el contrato ni el comportamiento observable de `GET /api/search`.
3. NO crear una nueva tabla para el histórico.
4. NO exponer `SUPABASE_SECRET_KEY` ni consultar Supabase desde componentes cliente.
5. Todos los cambios de API deben ser aditivos.
6. Si Supabase no está configurado o falla, la ficha debe seguir cargando con estado vacío de histórico.
7. No realizar refactors generales, cambios cosméticos masivos ni upgrades de dependencias.
8. No implementar todavía alertas, sitemap de fichas, catálogo persistente ni autenticación de usuarios finales.

## Implementación requerida

### A. API de lectura del histórico

Crear un endpoint:

`GET /api/price-history?matchKey=<encoded>&days=90`

Implementar siguiendo los patrones actuales de rutas serverless, middleware, manejo HTTP, request ID, rate limit, auth y errores.

Crear una capa separada de lectura, por ejemplo:

`api/src/lib/priceHistoryQuery.ts`

No mezclar lectura con `recordPriceHistory`.

La respuesta debe contener:

- `matchKey`
- `canonicalName`
- `from`
- `to`
- `series[]`, agrupada por `pharmacySlug`, con puntos cronológicos
- `summary.latestBestPrice`
- `summary.latestBestPharmacy`
- `summary.lowestRecordedPrice`
- `summary.highestRecordedPrice`
- `summary.change7dPercent`
- `summary.change30dPercent`

Reglas:

- `days`: default 90, min 7, max 365.
- Sin registros: HTTP 200 con series vacías y métricas null.
- Variación: comparar el mejor precio efectivo de la fecha más reciente con el dato disponible más cercano anterior o igual a 7/30 días atrás.
- No interpolar días faltantes.
- Orden ascendente por fecha.
- Consultar solo columnas necesarias.

Agregar el wrapper serverless correspondiente bajo `api/api/` y cualquier ajuste necesario en `api/vercel.json`, respetando el patrón existente.

### B. Cliente web server-side

Crear un cliente tipado para consumir el endpoint de histórico desde el servidor web.

- Reutilizar configuración `API_URL`.
- Reutilizar la forma actual de autenticación server-side hacia la API.
- Definir tipos localmente o en una ubicación apropiada sin alterar contratos móviles.
- Manejar timeout/error devolviendo histórico vacío utilizable por la UI.

### C. Ficha pública

Crear:

`web/src/app/medicamento/[matchKey]/page.tsx`

La URL puede usar el `matchKey` codificado. Aceptar `searchParams.q` para ejecutar la búsqueda actual y localizar el resultado cuyo `matchKey` coincida.

La página debe incluir:

1. breadcrumb;
2. nombre canónico;
3. bloque de mejor precio actual;
4. precios actuales por farmacia, reutilizando la presentación/lógica existente cuando sea razonable;
5. mínimo y máximo histórico;
6. variación 7 y 30 días;
7. gráfico de evolución por farmacia;
8. estado vacío claro;
9. aviso de precios referenciales y fecha de actualización;
10. enlace de retorno a la búsqueda.

No uses componentes cliente salvo que sean estrictamente necesarios. Prioriza Server Components.

### D. Gráfico accesible

Crear un componente dedicado, por ejemplo:

`web/src/components/PriceHistoryChart.tsx`

- SVG responsive, sin dependencia nueva pesada.
- Una línea por farmacia.
- Leyenda.
- Ejes o etiquetas mínimas legibles.
- Formato CLP.
- Incluir alternativa textual accesible con fechas y valores.
- Debe funcionar con una sola serie, múltiples series o pocos puntos.

### E. Enlace desde resultados

Modificar `MedicationCard` y la página de resultados lo mínimo necesario para mostrar:

`Ver detalle e histórico`

El enlace debe incluir:

- `matchKey` codificado;
- query original como `?q=` cuando esté disponible.

Mantener tests existentes y accesibilidad.

### F. SEO

Implementar metadata dinámica de la ficha:

- title;
- description;
- canonical;
- Open Graph básico.

Usar `SITE_URL` mediante utilidades existentes. No agregar fichas al sitemap todavía.

### G. Tests

Agregar tests unitarios y/o de componentes para cubrir como mínimo:

API:

- agrupación y orden;
- resumen min/max;
- variación 7/30 días;
- datos insuficientes;
- parámetros inválidos;
- Supabase ausente/error.

Web:

- enlace de detalle;
- estado con histórico;
- estado sin histórico;
- formato CLP/porcentaje;
- gráfico accesible.

No eliminar ni debilitar tests existentes.

### H. Documentación

Actualizar:

- `docs/deployment.md` con verificación curl del nuevo endpoint;
- documentación API pertinente;
- `docs/database/schema.sql` solo si agregas comentarios o índices estrictamente necesarios; no cambies el modelo funcional sin justificarlo.

Copiar o incorporar el RFC en la ubicación documental coherente del repositorio si aún no existe.

## Validación obligatoria

Ejecuta desde la raíz, usando los comandos reales definidos por el repositorio:

- instalación solo si hace falta;
- typecheck;
- tests de API;
- tests web;
- lint/build web si están disponibles y son razonables.

Antes de terminar, ejecuta:

```bash
git diff -- mobile/
```

El resultado debe estar vacío.

## Entrega final

No hagas commit ni push salvo que el usuario lo pida explícitamente.

Entrega un reporte con:

1. resumen de lo implementado;
2. archivos creados/modificados;
3. decisiones técnicas;
4. comandos ejecutados y resultados;
5. deuda o limitaciones;
6. variables o pasos manuales necesarios;
7. diff resumido;
8. confirmación explícita de que `mobile/` no fue modificado;
9. URLs/comandos exactos para verificar localmente y en producción.

Si descubres que alguna premisa del RFC no coincide con el código real, adapta la implementación conservando el objetivo y explica la diferencia; no detengas el trabajo para pedir confirmación salvo que exista riesgo de pérdida de datos o ruptura de producción.
