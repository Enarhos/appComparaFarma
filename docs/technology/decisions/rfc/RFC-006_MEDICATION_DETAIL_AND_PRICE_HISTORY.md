# RFC-006 — Ficha pública de medicamento e histórico de precios

> **Renumerado de RFC-002 a RFC-006 el 2026-08-06 (WEB-002, Decisión 5 del Product Manager)** — este documento colisionaba en numeración con `docs/technology/decisions/rfc/RFC-002_CANONICAL_MEDICATION_REGISTRY.md` (CFM-ID), que conserva el número RFC-002 por ser el registro oficial de la secuencia (`docs/engineering/rfc/`). Solo cambió el número de identificación y este encabezado — el contenido técnico de este documento no se modificó.

**Estado:** Propuesto para implementación  
**Fecha:** 2026-07-27  
**Ámbito:** `api/`, `web/`, documentación y pruebas  
**Fuera de alcance:** `mobile/` y cambios incompatibles en contratos existentes

## 1. Contexto

ComparaFarma ya registra snapshots diarios de precios en Supabase mediante `api/src/lib/priceHistoryDb.ts`, en la tabla `price_history` definida en `docs/technology/database/schema.sql`.

La API actual guarda, por combinación `match_key + pharmacy_slug + recorded_date`:

- nombre canónico;
- farmacia;
- precio presencial;
- precio efectivo;
- canales adicionales;
- fecha del registro.

El sitio web todavía no expone públicamente esos datos ni dispone de una ficha indexable por medicamento. Por tanto, el siguiente incremento debe reutilizar el histórico existente, no crear una segunda infraestructura de captura.

## 2. Objetivo

Crear una ficha pública de medicamento que permita:

1. consultar el precio actual utilizando el flujo de búsqueda existente;
2. consultar el histórico persistido en Supabase;
3. mostrar evolución por farmacia;
4. mostrar métricas simples de variación;
5. generar una URL pública e indexable;
6. mantener intacta la app móvil en prueba cerrada.

## 3. Restricciones obligatorias

- No modificar ningún archivo dentro de `mobile/`.
- No cambiar la respuesta de `GET /api/search`.
- No cambiar tipos compartidos usados por mobile salvo que el cambio sea estrictamente aditivo y no altere serialización.
- No eliminar ni renombrar variables de entorno existentes.
- No introducir una nueva tabla si `price_history` cubre la necesidad.
- Toda falla de Supabase debe degradar de forma segura: la búsqueda y la ficha actual deben seguir funcionando aunque no haya histórico.
- Mantener RLS y acceso servidor-a-servidor con `SUPABASE_SECRET_KEY`.

## 4. Diseño de API

### 4.1 Nuevo endpoint aditivo

`GET /api/price-history?matchKey=<encoded>&days=90`

Parámetros:

- `matchKey`: obligatorio, entre 2 y 180 caracteres.
- `days`: opcional; default 90; mínimo 7; máximo 365.

Respuesta 200:

```json
{
  "matchKey": "paracetamol|500mg",
  "canonicalName": "Paracetamol 500 mg",
  "from": "2026-04-28",
  "to": "2026-07-27",
  "series": [
    {
      "pharmacySlug": "cruz-verde",
      "points": [
        {
          "date": "2026-07-20",
          "storePrice": 2990,
          "effectivePrice": 2490,
          "channels": []
        }
      ]
    }
  ],
  "summary": {
    "latestBestPrice": 2490,
    "latestBestPharmacy": "cruz-verde",
    "lowestRecordedPrice": 2290,
    "highestRecordedPrice": 3290,
    "change7dPercent": -8.1,
    "change30dPercent": -12.4
  }
}
```

### 4.2 Comportamiento

- Ordenar puntos por fecha ascendente.
- No inventar datos para días sin registros.
- Calcular variaciones usando el precio efectivo mínimo disponible en cada fecha.
- Para 7 y 30 días, usar el registro más cercano anterior o igual al día objetivo; si no existe base suficiente, devolver `null`.
- Si no existen registros, responder 200 con `series: []` y métricas `null`, no 404.
- Aplicar autenticación y rate limit de forma coherente con el resto de la API, sin romper consumo web server-side.

## 5. Acceso a datos

Crear una función dedicada, por ejemplo:

`api/src/lib/priceHistoryQuery.ts`

Responsabilidades:

- validar rango de fechas;
- consultar solo las columnas necesarias;
- mapear filas de Supabase a tipos de respuesta;
- agrupar por farmacia;
- calcular resumen;
- encapsular errores y retornar un resultado vacío seguro cuando Supabase no esté configurado.

No mezclar esta consulta con `recordPriceHistory` para mantener separadas escritura y lectura.

## 6. Diseño web

### 6.1 Nueva ruta

`/medicamento/[matchKey]`

El segmento debe viajar con `encodeURIComponent`/`decodeURIComponent` o una estrategia equivalente segura. No crear todavía un sistema complejo de slugs SEO que requiera una tabla de resolución adicional.

La página debe recibir opcionalmente `?q=<consulta-original>` para recuperar precios actuales mediante el cliente de búsqueda existente.

### 6.2 Navegación

En `MedicationCard`, agregar un enlace visible y accesible:

**“Ver detalle e histórico”**

El enlace debe llevar el `matchKey` y, cuando sea posible, la consulta original utilizada en `/buscar/[query]`.

### 6.3 Contenido mínimo de la ficha

- Breadcrumb: Inicio → Resultados → Medicamento.
- Nombre canónico.
- Mejor precio actual y farmacia, cuando la búsqueda actual esté disponible.
- Tabla/listado de precios actuales por farmacia reutilizando componentes o lógica existente.
- Resumen histórico:
  - mínimo registrado;
  - máximo registrado;
  - variación 7 días;
  - variación 30 días.
- Gráfico de evolución de precio efectivo por farmacia.
- Estado vacío cuando aún no exista suficiente histórico.
- Aviso de fecha/hora de actualización y carácter referencial de los precios.
- Enlace para volver a resultados.

### 6.4 Gráfico

Para este sprint, evitar una dependencia pesada. Implementar un componente SVG accesible y responsive o reutilizar una dependencia ya instalada si existe.

Requisitos:

- una serie por farmacia;
- leyenda textual;
- fechas legibles;
- valores en pesos chilenos;
- tabla o lista textual alternativa para accesibilidad;
- no depender del navegador para obtener secretos de Supabase.

## 7. SEO

Agregar metadata dinámica:

- title: `Precio de {canonicalName} en farmacias | ComparaFarma`;
- description con comparación e histórico;
- canonical URL usando `SITE_URL`;
- Open Graph básico.

Agregar JSON-LD solo con tipos y propiedades válidas. No marcar disponibilidad ni precio como definitivos si no se dispone de datos actuales confiables.

No agregar todavía todas las fichas al sitemap, porque no existe un catálogo persistente completo. Este tema queda para un sprint posterior.

## 8. Pruebas obligatorias

### API

- agrupación por farmacia;
- orden cronológico;
- cálculo de mínimo/máximo;
- cálculo de variación 7 y 30 días;
- falta de datos base;
- Supabase no configurado;
- validación de parámetros;
- método no permitido;
- error de consulta degradado de forma segura.

### Web

- generación correcta del enlace desde `MedicationCard`;
- render de mejor precio actual;
- render de histórico;
- estado vacío;
- formato CLP y porcentajes;
- metadata básica;
- gráfico con alternativa accesible.

## 9. Criterios de aceptación

- `pnpm typecheck` pasa.
- Tests existentes y nuevos pasan.
- `GET /api/search` conserva exactamente su contrato.
- Ningún archivo dentro de `mobile/` cambia.
- La ficha se puede abrir desde un resultado de búsqueda.
- Con Supabase disponible, muestra histórico real.
- Sin Supabase o sin registros, muestra un estado vacío y no falla.
- No se exponen claves secretas al cliente.
- Documentación de endpoint y deployment actualizada.

## 10. Despliegue

1. Desplegar API automáticamente vía CI.
2. Verificar el endpoint con un `matchKey` real existente.
3. Desplegar web mediante integración nativa de Vercel.
4. Validar navegación desde una búsqueda productiva.
5. Confirmar que la app móvil sigue buscando normalmente.

## 11. Trabajo posterior

- URLs SEO con slug legible y resolución persistente.
- catálogo de medicamentos indexables.
- sitemap dinámico de fichas.
- alertas de precio.
- selección de canal preferido por usuario.
- gráficos agregados y tendencias nacionales.
