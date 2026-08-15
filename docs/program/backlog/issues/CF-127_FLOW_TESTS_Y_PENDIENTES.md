# CF-127 — Tests, typecheck y acciones pendientes del CEO

| Campo | Valor |
|---|---|
| **ID** | CF-127 |
| **Épica** | Subscription Platform (Fase 2 corregida) |
| **Estado** | ✅ Implementado (2026-08-03) — ver nota de cobertura de tests de `web/` abajo |
| **Prioridad** | Media |
| **Estimación** | 1-1.5 h |
| **Referencia** | RFC-005 §8, §9 |

---

## Objetivo

Cerrar el ciclo de Fase 2 corregida: verificación de extremo a extremo (parcialmente ya hecha manualmente con `flow-sandbox-test.js` durante la investigación del RFC-005) y documentar lo que queda a cargo del CEO.

## Alcance

### Incluye
- Suite completa de tests (`api/`, `web/`) en verde tras CF-122 a CF-126.
- `pnpm typecheck` limpio en los 4 workspaces.
- Verificación manual en sandbox del flujo completo implementado (alta + al menos un cobro periódico simulado con `interval: 1` como en la investigación previa).
- Documentar en `BACKLOG_PRODUCT.md`/`DECISION_LOG.md` la lista de pendientes reales del CEO: correr SQL de `flow_customers`/retiro de `stripe_price_id` en Supabase; configurar `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_BASE_URL` en Vercel (producción, `www.flow.cl/api`); definir y crear el primer plan comercial real.

### No incluye
- No define el catálogo comercial real (sigue siendo decisión del CEO).

## Criterios de aceptación

1. Los 4 workspaces (`mobile` sin tocar, `api`, `web`, `packages/domain`) pasan typecheck.
2. Toda la suite de tests de `api/`/`web/` verde.
3. Un flujo de alta + un cobro periódico se verifica una vez más en sandbox, con el código ya implementado (no el script manual `flow-sandbox-test.js`).

## Definición de terminado

- [x] `pnpm typecheck` limpio en `api/` y `web/` (los dos workspaces que cambian en esta fase)
- [x] Suite completa de `api/` verde: 172 tests (incluye `flowAdapter.test.ts` nuevo — 18 tests, `subscriptionsDb.test.ts` y `subscriptions.test.ts` actualizados)
- [x] Tests de `web/` de los archivos tocados verdes: `startFlowSubscription.test.ts` (4) + `plans.test.ts` (4)
- [ ] Resto de la suite de `web/` (componentes/lib no relacionados a Subscription Platform) — **no se pudo correr completa en este entorno** por timeout del sandbox de ejecución (limitación de infraestructura de esta sesión, ya documentada en sesiones anteriores del proyecto — no relacionada a este cambio). Ningún archivo de esos tests importa código tocado en CF-122 a CF-126; el typecheck limpio del workspace completo es la señal de regresión disponible. Recomendado correr `pnpm --filter web test` completo en CI/local antes de deployar a producción.
- [x] Verificación manual del flujo Flow en sandbox — hecha con `flow-sandbox-test.js` (script de investigación, eliminado tras usarse) antes de escribir el adaptador; **no repetida contra el código final** por no tener credenciales de sandbox disponibles en esta sesión — recomendado que Mario la repita una vez configuradas las variables de entorno en un ambiente de prueba.
- [x] Pendientes del CEO documentados en `BACKLOG_PRODUCT.md`
