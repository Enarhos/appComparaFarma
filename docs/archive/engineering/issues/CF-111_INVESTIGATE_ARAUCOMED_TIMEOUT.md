# CF-111 — Investigar timeout de AraucoMed en producción (Vercel)

| Campo | Valor |
|---|---|
| **ID** | CF-111 |
| **Épica** | Confiabilidad de scrapers |
| **Estado** | Cerrado — no reproducible el 2026-07-31, queda en monitoreo pasivo |
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

- [x] Corridas repetidas de `healthcheck:prod` documentadas (persistente vs. intermitente)
- [ ] Logs de Vercel revisados si es persistente — **no aplica, ver hallazgo abajo**
- [x] Causa raíz confirmada o descartada con evidencia
- [x] Decisión final registrada en `DECISION_LOG.md`

---

## Hallazgo (2026-07-31)

5 corridas contra `https://comparafarma-api.vercel.app/api/search?debug=1` (4 con query sin coincidencias para minimizar payload + 1 con `q=paracetamol` con resultados reales) — **las 5 tuvieron `araucomed` en `status: "fulfilled"`**, con `durationMs` entre 300 y 1897ms, muy por debajo del timeout de 8000ms. Cero repeticiones del fallo original.

No se pudo ejecutar `pnpm --filter api healthcheck:prod` tal cual (el sandbox de esta sesión no tiene salida de red hacia `comparafarma-api.vercel.app` vía `curl`/Node directo; las corridas se hicieron con el fetcher de la sesión, no con el script). Tampoco se revisaron logs de Vercel — requiere acceso al dashboard, no disponible en esta sesión.

**Conclusión:** el fallo no es persistente. Con la evidencia disponible se descarta la hipótesis de bloqueo sistemático por IP de Vercel (si lo fuera, debería fallar de forma consistente, no 0/5). Queda más apoyada la hipótesis alternativa: evento transitorio del lado de AraucoMed coincidente con la corrida del 2026-07-19.

**Decisión:** cerrar la investigación activa. No se sube el timeout ni se cambia código (no hay causa raíz que mitigar). AraucoMed queda bajo el mismo `Monitor API` horario que ya cubre las 9 farmacias — si el fallo reaparece con frecuencia, reabrir este issue con los nuevos datos (ahí sí tendría sentido revisar logs de Vercel).

**Limitación reconocida:** las 5 corridas se hicieron en una sola sesión (minutos, no horas/días como sugería el alcance original). Es evidencia de "no reproducible ahora", no una garantía de que no vuelva a ocurrir de forma intermitente.
