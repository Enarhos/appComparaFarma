# PM-001 — Pipeline de deploy del backend roto en producción

| Campo | Valor |
|---|---|
| **ID** | PM-001 |
| **Fecha** | 2026-07-19 |
| **Severidad** | Alta — `/api/search` (endpoint principal de la app) devolvía 500 en producción |
| **Detectado por** | Verificación manual al configurar Sentry, no por el monitor automático |
| **Responsable** | Claude Code |
| **Estado** | Resuelto |

---

## Resumen

Al reforzar el monitoreo del proyecto (ver `docs/engineering/reviews/ER-003_RFC-001_CTO_REVIEW.md` y el trabajo de la misma sesión), se intentó re-desplegar el backend para activar una variable de entorno nueva (`SENTRY_DSN`). Ese intento de deploy expuso una cadena de **cuatro problemas independientes**, cada uno enmascarando al siguiente, que terminaron en que `/api/search` — el endpoint principal de la app — devolviera `500 FUNCTION_INVOCATION_FAILED` en producción.

No hay evidencia de que un usuario haya reportado esto — se descubrió por casualidad, en medio de una tarea de configuración no relacionada.

---

## Línea de tiempo (mismo día, en orden)

1. **Se pushean cambios de monitoreo** (rate limit con Redis, Sentry backend, cron del monitor a 1h). El `deploy-api` de la CI falla: `npm error Unsupported URL Type "workspace:": workspace:*`.
2. **Hipótesis 1 (parcialmente incorrecta):** se asume que el botón "Redeploy" del dashboard de Vercel usa un mecanismo de build distinto al de la CI. Se prueba fijar `installCommand` en `vercel.json` — el deploy manual "funciona" pero **sirve los archivos `.ts` crudos como estáticos** (tamaños de ~170 bytes, 404 en todas las rutas).
3. Se quita el `installCommand`, se detecta que **Root Directory estaba vacío** en el dashboard de Vercel — se configura como `api`. El siguiente deploy (vía CI) reproduce el mismo problema de "archivos estáticos".
4. Se revierte Root Directory a vacío — vuelve el error original de `workspace:*`.
5. **Causa raíz real, capa 1:** la CI corre `vercel deploy` con `working-directory: api`, subiendo solo esa carpeta (~53 archivos) — `packages/domain` nunca viaja con el deploy, así que Vercel jamás puede resolver `"@comparafarma/domain": "workspace:*"`, sin importar la configuración del dashboard. Se cambia la CI para deployar desde la raíz del monorepo (195 archivos subidos) + Root Directory `api` en el dashboard.
6. Con el monorepo completo subiéndose, `pnpm install` remoto **sí resuelve** `@comparafarma/domain` — pero el build falla con: *"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan"*. Vercel estaba tratando cada `.ts` de `api/src/` (clientes, rutas, tests, scripts) como una función independiente.
7. Se agrega un glob explícito `"functions": {"api/*.ts": {...}}` en `vercel.json`, restringiendo la detección a los 6 entrypoints reales. El deploy pasa completo.
8. **Causa raíz real, capa 2 (la que importaba):** con el deploy ya técnicamente exitoso, `/api/health` responde 200 pero `/api/search` crashea: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/node_modules/@comparafarma/domain/src/index.ts'`. `packages/domain` nunca se compilaba a JavaScript — su `package.json` apuntaba `"exports"` directo a `src/index.ts` (TypeScript crudo). Esto funcionaba en `mobile` únicamente porque Metro tiene un resolver personalizado que mapea `.js` → `.ts` (ver `CLAUDE.md`); Node.js/Vercel no tiene ese mecanismo y no puede ejecutar `.ts` sin transformar.
9. **Fix definitivo:** se agrega `tsconfig.build.json` + script `postinstall` a `packages/domain` que compila `src/` a `dist/` en cada `pnpm install`, y se actualiza `"exports"/"main"/"types"` para apuntar ahí. Verificado localmente simulando la resolución exacta de producción (`node --input-type=module` importando `@comparafarma/domain` vía `node_modules`, no por ruta relativa) antes de pushear. Deploy siguiente: `/api/health` y `/api/search` responden correctamente.

---

## Causas raíz (las que realmente importan, capas 5 y 8)

1. **La CI nunca subía el monorepo completo.** `working-directory: api` en el step de deploy limitaba la subida a esa carpeta sola. Cualquier dependencia `workspace:*` estaba condenada a fallar en un build remoto limpio.
2. **`packages/domain` nunca tuvo una compilación real a JS.** Se creó (RFC-001, CF-101–107) asumiendo que Metro (mobile) y Node/tsx (tests, dev local) alcanzaban para consumirlo — nadie verificó explícitamente que **Vercel en producción** pudiera ejecutar TypeScript crudo importado desde `node_modules`. No puede.

## Por qué no se detectó antes

No hay certeza de cuánto tiempo estuvo así — es posible que el mecanismo de deploy anterior (CLI invocado desde `api/`, con un `node_modules` ya resuelto localmente por la CI antes de invocar `vercel deploy`) haya logrado bundlear el TypeScript crudo de otra forma en algún momento, y que esto se rompiera recién al cambiar la forma de invocar el deploy. No se investigó a fondo cuánto tiempo llevaba roto porque el foco fue restaurar el servicio, no arqueología de logs históricos. Lo que sí es seguro: **el monitor automático (`monitor-api.yml`, cada 6h en ese momento) no lo detectó**, porque nunca se disparó un deploy nuevo durante ese período — el sistema de monitoreo vigila la API en producción, no valida que un nuevo deploy vaya a funcionar antes de reemplazar el anterior.

## Impacto

- `/api/search` — el flujo principal de la app — no funcionó durante el tiempo que duró la incidencia (acotado a esta sesión de trabajo, horas, no se estableció si venía de antes).
- `/api/health`, `/api/config` y otros endpoints sin dependencia de `@comparafarma/domain` siguieron funcionando, lo que hubiera hecho pasar un healthcheck superficial que solo chequeara `/api/health`.

## Seguimiento

- [ ] Considerar un smoke test post-deploy en la propia CI (`deploy-api`) que golpee `/api/search?q=paracetamol` antes de dar el job por exitoso, para que un deploy roto nunca quede como "verde" en GitHub Actions. No implementado en esta sesión — evaluar como próximo paso.
- [x] `CLAUDE.md` actualizado con las 4 reglas de este incidente (sección "Deploy del backend").
- [x] `docs/product/DECISION_LOG.md` con la entrada correspondiente.
