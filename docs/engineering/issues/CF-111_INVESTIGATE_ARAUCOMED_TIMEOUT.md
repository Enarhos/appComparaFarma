# CF-111 — Investigar timeout de AraucoMed en producción (Vercel)

| Campo | Valor |
|---|---|
| **ID** | CF-111 |
| **Épica** | Confiabilidad de scrapers |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1-2 horas (investigación) + tiempo variable según causa raíz |
| **Referencia** | Detectado por `/scraper-watchdog` tras extender `api/scripts/check-production-health.mjs` a las 9 farmacias (antes solo cubría 4) |

---

## Objetivo

`pnpm --filter api healthcheck:prod` corrido el 2026-07-19 contra `https://comparafarma-api.vercel.app` mostró `araucomed` con `status: "rejected"`, `errorMessage: "This operation was aborted"` en **ambas** queries de prueba (`paracetamol`, `ibuprofeno`), con `durationMs` ≈ 8000ms — coincide exactamente con el timeout default de `fetchWithTimeout` (`api/src/lib/timeout.ts:4`, `timeoutMs = 8000`). Las otras 8 farmacias respondieron con éxito en la misma corrida.

Esto era invisible hasta ahora: `check-production-health.mjs` solo agregaba estadísticas de 4 farmacias (`cruz-verde`, `salcobrand`, `ahumada`, `dr-simi`); `araucomed` nunca fue monitoreado hasta este fix.

---

## Diagnóstico ya descartado (verificado, no repetir)

Se verificó manualmente contra el endpoint en vivo (`https://farmacia.araucomed.com/?controller=search&s=paracetamol&ajax=1`, mismos headers que usa `api/src/clients/araucomed.ts:49-55`):

- La request respondió en **0.89s** con `HTTP 200` (no hay lentitud ni caída del sitio en sí).
- El JSON de respuesta **conserva exactamente el contrato esperado** por `AraucoProduct` (`araucomed.ts:6-19`): `price_amount` es number (`450`), `active` es number (`1`), `cover.bySize.home_default.url` existe con la estructura anidada esperada. Los 20/20 productos de la muestra pasan el filtro `p.price_amount > 0 && p.active` (`araucomed.ts:31`).
- **Conclusión: NO es un problema de parsing/regex/contrato JSON roto.** El cliente `araucomed.ts` está correcto tal cual está.

## Hipótesis de causa raíz (a confirmar)

El fallo solo se reprodujo llamando desde la infraestructura de Vercel (serverless), no desde una request directa fuera de esa red. La hipótesis más probable es que **AraucoMed (o su WAF/anti-bot, común en tiendas PrestaShop detrás de Cloudflare) esté bloqueando o limitando el tráfico proveniente de los rangos de IP compartidos de Vercel**, causando que la conexión quede colgada hasta que el `AbortController` la corta a los 8000ms — en vez de devolver un error HTTP rápido.

Hipótesis alternativa (menor probabilidad, descartar primero): fue un evento transitorio (caída puntual, deploy del lado de AraucoMed) coincidente con el momento exacto de la corrida — con solo 2 muestras no se puede distinguir todavía de un bloqueo sistemático.

---

## Alcance

### Incluye
- Correr `pnpm --filter api healthcheck:prod` varias veces más a lo largo de las próximas horas/días para determinar si el fallo es persistente o intermitente.
- Si es persistente: revisar logs de la función serverless en Vercel (dashboard o `vercel logs`) para el endpoint `/api/search` en el momento de un fallo, buscando el código de estado/error real que ve la función (no solo el timeout del lado cliente).
- Evaluar opciones si se confirma bloqueo por IP: aumentar `timeoutMs` específicamente para `araucomed` (paliativo, no soluciona la causa), o investigar si AraucoMed ofrece/permite allowlisting.

### No incluye
- Modificar `parseAraucoMedResponse` ni la lógica de parsing — ya verificado que el contrato JSON es correcto, no se toca.
- Cambiar el timeout global de `fetchWithTimeout` para las demás farmacias.

---

## Criterios de aceptación

1. Se determinó si el timeout de `araucomed` es persistente (≥ 3 de 3 corridas fallan) o intermitente (corridas posteriores exitosas).
2. Si es persistente, se identificó la causa real vía logs de Vercel (bloqueo por IP, rate limit, otro).
3. Se documentó la decisión final (aceptar degradación, subir timeout, u otra mitigación) en `docs/product/DECISION_LOG.md`.

---

## Definición de terminado

- [ ] Corridas repetidas de `healthcheck:prod` documentadas (persistente vs. intermitente)
- [ ] Logs de Vercel revisados si es persistente
- [ ] Causa raíz confirmada o descartada con evidencia
- [ ] Decisión final registrada en `DECISION_LOG.md`
