# QA-SEARCH-002 — 14,6 % de las fichas enlazadas desde la propia página de resultados no resuelven

| Campo | Valor |
|---|---|
| **Severidad** | **P1** — navegación a producto equivocado / inexistente |
| **Clasificación** | `NAVIGATION_BROKEN` + `SOFT_404` |
| **Test** | 6 (navegación) |
| **Estado** | Preexistente en producción. Indiferente al PR bajo prueba |
| **Reproducibilidad** | 7/48 enlaces, medido 2026-08-31T01:4x UTC. Estable por consulta |

## Comportamiento observado

Los enlaces `/medicamento/<slug>` que **la propia página de resultados de producción
acaba de emitir** llevan, en 7 de 48 casos, a una ficha que responde
`<title>Medicamento no encontrado | PreciosFarma</title>`.

```
$ node docs/qa/search-product-identity/analysis/nav-resolve-rate.mjs
...
DEAD 200 /medicamento/diclofenaco-retard-100-mg-x-8-capsulas-opko-1l4aourepmu3b
DEAD 200 /medicamento/tapsin-x-6-comprimidos-noche-maver-3a14ey6g56zgt
DEAD 200 /medicamento/tapsin-x-6-comprimidos-maver-jfz5p0p85x6n
DEAD 200 /medicamento/tapsin-forte-x-6-comprimidos-recubiertos-2tz36rk5hze2s
DEAD 200 /medicamento/clotrimazol-crema-topica-al-1-x-20-g-surfarma-23poitc26mv6o
DEAD 200 /medicamento/clotrimazol-crema-topica-1-20g-ethon-cenabast-11k1hgfzyyees
DEAD 200 /medicamento/ballerina-jabon-de-glicerina-750-ml-1gno4wnnjz0xe
{ "total": 48, "resolved": 41, "dead": 7, "deadPct": 14.6,
  "deadByQuery": { "diclofenaco": 1, "tapsin": 3, "clotrimazol": 2, "glicerina": 1 },
  "allHttp200": true }
```

`tapsin`: **3 de 6** enlaces muestreados (50 %).

Cuerpo servido (verificado con `curl`):

```
HTTP 200
title:   Medicamento no encontrado | PreciosFarma
noindex: true
texto:   Cargando ficha del medicamento… PreciosFarma Compara precios de
         medicamentos en Chile. Medicamento no encontrado | PreciosFarma
```

No es un link viejo ni indexado: es el link que la app emitió en esa misma sesión,
segundos antes.

## Comportamiento esperado

Todo enlace emitido por la página de resultados vigente resuelve a la ficha del
producto de esa tarjeta. Un slug irresoluble debe además responder **HTTP 404**, no
200.

## Causa raíz probable

Dos capas superpuestas.

1. **Resolución sin persistencia.** `web/src/lib/resolveMedication.ts` reconstruye la
   ficha ejecutando *otra búsqueda en vivo* con el texto legible del slug y matcheando
   por hash de `presentationKey`. El propio archivo documenta el límite (líneas 32-40).
   Para "Tapsin x 6 comprimidos Noche (Maver)", la consulta derivada del slug no
   devuelve hoy ninguna tarjeta cuyo `presentationKey` hashee a `3a14ey6g56zgt`, y la
   ficha muere. La tasa de 14,6 % es la medición de ese límite en producción real;
   no estaba cuantificada.
2. **Soft-404.** `web/src/app/medicamento/[slug]/page.tsx:84-95` llama `notFound()`,
   pero para entonces Next ya hizo flush del shell y de `loading.tsx`
   ("Cargando ficha del medicamento…"), así que el status queda en 200 y el 404 se
   pinta después. El `noindex` de `generateMetadata()` contiene el daño SEO, pero para
   un crawler y para cualquier monitor de disponibilidad la URL responde OK.

## Evidencia

- `analysis/nav-resolve-rate.json` — 48 enlaces, `httpStatus`, `title`, `resolved`
- `analysis/nav-check.json` — 16 fichas con su JSON-LD, ofertas y `matchKey`
- `web/src/lib/resolveMedication.ts:22-46` (límite documentado por el propio código)
- `web/src/app/medicamento/[slug]/page.tsx:84-95` (`notFound()` tras el flush)

## Screenshot

`SCREENSHOT_REQUIRES_MANUAL_CAPTURE` — instrucciones en `../screenshots/README.md`.
Falta confirmar visualmente si el usuario ve la pantalla de 404 o queda con el
fallback "Cargando ficha…". La evidencia HTTP no lo determina.

## Issue recomendado

`CF-WEB-002 — Ficha irresoluble desde resultados vigentes` (P1), en dos partes
separables:

- **(a) Status correcto** — quick win: hacer que la resolución ocurra antes del flush
  (o `export const dynamic`/no-stream en esa ruta) para que un slug irresoluble
  responda 404 de verdad. No arregla la navegación, pero deja de mentir.
- **(b) Resolución estable** — es exactamente el rol del registro persistido
  CFM-ID / RFC-002 que el propio `resolveMedication.ts` cita como solución futura.
  `MedicationResult.cfmId` ya viaja en la respuesta del API (verificado:
  `CFM-000847` en `raw/tapsin.json`). **Decisión de arquitectura, no de QA** —
  se reporta, no se propone diseño.
