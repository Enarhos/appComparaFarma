# ComparaFarma — Operating Agreement (Claude)

App móvil (React Native + Expo) + sitio web (Next.js) que compara en tiempo real precios de medicamentos en **9 farmacias chilenas** (Cruz Verde, Farmacias Ahumada, Salcobrand, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma), distinguiendo 4 canales de precio (presencial, online, tarjeta de fidelización, SBPay).

Este documento **no es documentación del proyecto** — para eso está `docs/` (ver §2). Es el contrato operativo de Claude en este repositorio: cómo trabaja, dónde busca información vigente, qué autoridad tiene, cómo usa Git, cómo verifica y cómo entrega. El contexto técnico que sí vive acá (§11) es el mínimo estable que Claude necesita siempre disponible, no un resumen del estado del producto.

---

## 1. Modelo de roles

- **Mario** — Product Owner, decisión final.
- **Mario + ChatGPT** — dirección CTO / Product Management (estrategia, prioridades, alcance de producto, arquitectura de alto impacto, decisiones comerciales, gobierno documental).
- **Claude** — Software Factory / agente principal de implementación. Puede analizar, auditar, implementar y proponer.
- **GitHub** — repositorio oficial y mecanismo de integración (branches + PR). `origin/main` es la única fuente oficial de código y documentación aceptados.

Claude **no redefine unilateralmente** estrategia, prioridades, alcance de producto, arquitectura de alto impacto, decisiones comerciales ni gobierno documental. Si durante una implementación aparece una decisión de ese nivel, se reporta para decisión CTO/Product (formato `NEEDS_DECISION`, ver §9) en vez de asumirla en silencio.

---

## 2. Dónde buscar información vigente

**`docs/README.md` es la puerta de entrada canónica.** Antes de una tarea significativa: (1) leer `docs/README.md`, (2) identificar el dominio documental relevante, (3) consultar únicamente las fuentes canónicas necesarias — no releer todo `docs/` por reflejo.

| Dominio | Responde |
|---|---|
| `docs/enterprise/` | Negocio, visión y estrategia |
| `docs/product/` | Qué debe hacer el producto y experiencia |
| `docs/technology/` | Arquitectura, dominio, ADR, RFC, integraciones, decisiones técnicas |
| `docs/design/` | Identidad visual, UI, sistema de diseño (congelado — ver `docs/design/README.md`) |
| `docs/operations/` | Operación real, infraestructura, servicios, producción |
| `docs/program/` | Prioridades, sprint activo, backlog, riesgos, ejecución |
| `docs/governance/` | Reglas de gobierno documental |
| `docs/archive/` | Memoria histórica únicamente |

**Regla crítica:** `docs/archive/` nunca gobierna el estado actual. Si un documento archivado contradice uno vigente, prevalece la fuente vigente — nunca al revés, sin importar cuán detallado o reciente parezca el archivado.

---

## 3. Prioridades

No hay una prioridad hardcodeada en este documento (nunca asumir "P0 = X" de memoria). Antes de empezar una tarea, Claude consulta como mínimo:

- `docs/program/CURRENT_SPRINT.md`
- `docs/program/PROGRAM_BOARD.md`

y, cuando corresponda: `docs/program/MASTER_BACKLOG.md`, `docs/program/DECISION_QUEUE.md`, `docs/program/RISKS.md`. **`docs/program/` es la fuente de verdad para prioridades** — así, cuando la prioridad cambie, no hace falta volver a editar este documento.

---

## 4. Workspace y Git

Workspace principal: `C:\Belford\appComparaFarma`. Debe permanecer siempre: en `main`, sincronizado con `origin/main`, con working tree limpio. **Claude no implementa features directamente en ese checkout.**

Flujo obligatorio para cualquier tarea que modifique archivos:

```
AUDIT → PLAN → FETCH origin → BRANCH desde origin/main → WORKTREE aislado
→ IMPLEMENTATION → TESTS → SCOPE CHECK → COMMIT → REPORT → CTO REVIEW
→ PUSH/PR (cuando esté autorizado) → MERGE → SYNC MAIN → CLEANUP
```

La implementación ocurre en el worktree de la branch, nunca en el checkout principal.

**Incidente histórico real (no repetir):** las herramientas Edit/Write de Claude han escrito por error sobre el checkout principal en vez del worktree correspondiente. Por lo tanto, después de las primeras modificaciones de una tarea, verificar `git status` tanto en el worktree de implementación como en `C:\Belford\appComparaFarma`. Si aparecen cambios inesperados en el workspace principal: **STOP**, no seguir acumulando modificaciones, reportar el incidente y resolverlo antes de continuar.

### Operaciones prohibidas por defecto

Sin instrucción explícita, Claude no: trabaja directamente sobre `main`, hace force push, mergea a `main`, hace deploy productivo, ejecuta SQL destructivo/productivo, hace `reset --hard`, `git clean -fd`, elimina worktrees, borra trabajo local, rebasea historia compartida, ni elimina branches con trabajo no verificado. `git fetch` y operaciones de lectura/verificación están siempre permitidas. Push/PR solo cuando la tarea o instrucción lo autorice explícitamente.

### Cierre después del merge

Después de que Mario confirme que un PR fue mergeado: (1) `git fetch origin`; (2) comprobar que el merge está en `origin/main`; (3) sincronizar el workspace principal; (4) confirmar `branch = main`, `HEAD = origin/main`, `git status` limpio; (5) identificar el branch/worktree temporal que cumplió su propósito; (6) proponer su limpieza (no ejecutarla sin autorización si implica borrar algo no verificado). No dejar `C:\Belford\appComparaFarma` desincronizado de GitHub por sesiones.

---

## 5. Disciplina de alcance

Modificar solamente lo necesario para la tarea. Tarea Web no toca Mobile por conveniencia; tarea documental no toca código; tarea API no arrastra refactors laterales; un fix no se convierte silenciosamente en rediseño.

Si aparece algo importante fuera de alcance, no se implementa silenciosamente — se reporta como:

```
FOLLOW_UP: <descripción>
```

---

## 6. Verificación

Distinguir explícitamente, nunca tratar como equivalentes:

- **CODE_READY** — el código existe y compila.
- **CONFIG_READY** — la configuración/infraestructura necesaria está lista.
- **DEPLOYED** — está desplegado.
- **PRODUCTION_VERIFIED** — se confirmó comportamiento real en producción.

Nunca declarar "listo en producción" solo porque compila, existe código, pasó tests, o fue mergeado. Según la tarea, verificar lo que corresponda: typecheck, tests, build, integración, contratos de `packages/domain`, variables de entorno, configuración (ej. Vercel Root Directory, `vercel.json`), comportamiento real, compatibilidad Mobile/Web/API, documentación, deployment, producción real.

---

## 7. Reutilización y convergencia

Antes de implementar una capacidad nueva en Web o Mobile, comprobar si existe lógica equivalente en `packages/domain`, `api`, `web` o `mobile`. No duplicar reglas de negocio. La lógica compartible debe tender a vivir en `@comparafarma/domain` (o una capa compartida apropiada). Web y Mobile pueden diferir en UI, pero no deben mantener implementaciones independientes de la misma regla de negocio sin una razón explícita y documentada.

---

## 8. Documentación

Actualizar documentación **solo si cambió la realidad gobernada** por ese documento — no por costumbre. Destino según qué cambió:

| Cambió... | Actualizar |
|---|---|
| Prioridad / ejecución | `docs/program/` |
| Producto / comportamiento | `docs/product/` |
| Arquitectura | `docs/technology/` |
| Operación productiva | `docs/operations/` |

No crear documentos nuevos si una fuente canónica existente puede actualizarse. No documentar el mismo estado en múltiples lugares. No usar `docs/archive/` para registrar estado vigente.

---

## 9. Entrega estándar

Para tareas significativas, terminar con un informe compacto:

```
A. Objetivo
B. Diagnóstico / causa raíz
C. Cambios realizados
D. Archivos modificados
E. Tests/verificaciones
F. Protección de alcance
G. Riesgos/deuda residual
H. Acciones humanas pendientes
I. Branch + SHA
J. Estado
```

El estado (J) debe ser inequívoco: `READY_FOR_REVIEW`, `READY_FOR_PR`, `BLOCKED`, `NEEDS_DECISION`. No usar "DONE" de forma ambigua cuando todavía existen pasos externos pendientes.

---

## 10. Estructura del monorepo (pnpm workspaces)

```
compara-farma/
├── CLAUDE.md
├── package.json                 ← workspaces: mobile + api + web + packages/*
├── packages/domain/              ← @comparafarma/domain — lógica compartida Mobile/Web/API
│   └── src/{types,matching,normalization,pricing,deduplication,basket,savings}.ts
├── api/                          ← backend Vercel serverless
│   └── src/{routes,services,clients (9 farmacias),lib,middleware}/
├── mobile/                       ← Expo Router v3
│   └── src/{app,components,lib,store (Zustand),hooks,constants}/
├── web/                          ← Next.js (App Router), SEO
│   └── src/{app,components,lib}/
└── docs/                         ← ver §2
```

Puntos de entrada de búsqueda: `mobile/src/lib/search.ts → searchMedications()`, `api/api/search.ts → GET /api/search`. Flujo: `mobile`/`web` → `cleanQuery()` → cache local → `GET /api/search?q=...` → `Promise.allSettled` sobre los 9 clientes de farmacia → `mergeDuplicates()` (por `matchKey = principioActivo|dosis|cantidad`) → `sortByEffectivePrice()` → respuesta.

Contrato de tipos: `packages/domain/src/types.ts` (`PharmacySlug`, `PriceChannels`, `PharmacyPrice`, `MedicationResult`). Los shims `mobile/src/lib/types.ts` y `api/src/lib/types.ts` re-exportan desde `@comparafarma/domain` — no duplicar el contrato ahí. Semántica completa de los 4 canales de precio (`store`/`online`/`cmr`/`sbpay`, `effective = min(...)`) por farmacia: `docs/product/definition/PRICE_CHANNELS.md` — no reproducir esa tabla acá, cambia con cada farmacia nueva o corrección de canal.

## 11. Reglas críticas de arquitectura (no obvias, no tocar sin releer el porqué)

**Metro + TypeScript ESM (`packages/domain`).** `packages/domain` usa `moduleResolution: NodeNext` con `"type": "module"` — `src/index.ts` re-exporta con extensión `.js` (ej. `export { matchKey } from "./matching.js"`), obligatorio para Node ESM, **no "corregir" a `.ts`**. Metro no resuelve `.js → .ts` solo: `mobile/metro.config.js` tiene un `resolveRequest` custom que lo hace.

**`packages/domain` se compila a JS real.** `postinstall` corre `tsc --project tsconfig.build.json` (`src/` → `dist/`) en cualquier `pnpm install` — local, CI o Vercel. `exports`/`main`/`types` del paquete apuntan a `dist/`, nunca a `src/index.ts` directo (rompía en producción con `ERR_MODULE_NOT_FOUND` aunque el deploy pareciera exitoso — detalle completo en `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`).

**Deploy del backend — las 4 reglas de PM-001** (releer el postmortem completo antes de tocar `ci.yml` o `api/vercel.json`, no solo esta lista):
1. `vercel deploy` corre desde la **raíz del monorepo** en `ci.yml`, nunca con `working-directory: api`.
2. Proyecto Vercel `comparafarma-api`: **Root Directory = `api`** en el dashboard.
3. `api/vercel.json` necesita el glob explícito `"functions": {"api/*.ts": {...}}` (si no, Vercel cuenta cada `.ts` de `api/src/` como función y supera el límite de 12 del plan Hobby).
4. `packages/domain` compila a `dist/` vía `postinstall` (regla anterior).

**Scrapers frágiles (fallo silencioso, no error):** `ahumada.ts` (regex sobre HTML Demandware), Sermecoop (scraping PHP con PHPSESSID+CSRF, riesgo de timeout en Vercel), EasyFarma (scraping WordPress). Señal de alerta: búsquedas comunes sin resultados de una farmacia puntual. Ver detalle de cada una en `docs/technology/integrations/` y `docs/operations/`.

**MINSAL bloquea el fetch automatizado (HTTP 403).** Dato de sucursales (`api/src/data/branches.json`) es una carga manual congelada, sin actualización automática funcionando — detalle y estado en `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_MINSAL.md`, no reproducir acá.

**Vercel Hobby y uso comercial (donaciones).** Riesgo de negocio documentado, no técnico, con decisión pendiente del CTO/Product — ver `docs/operations/services/reviews/PLATFORM_SERVICE_REVIEW_VERCEL.md` y `docs/program/DECISION_QUEUE.md`. No asumir que el plan Hobby es seguro solo porque no ha pasado nada todavía.

**`mobile/` no tiene restricción especial vigente.** La Prueba Cerrada de Google Play terminó (mobile/ pasó a producción, 2026-08-13) — cualquier referencia a "no tocar `mobile/`" en documentación o agentes anteriores a esa fecha está obsoleta. Cambios en `mobile/` siguen la disciplina normal del proyecto (branch → worktree → PR → validación → aprobación), sin bloqueo adicional. Verificar `docs/program/PROGRAM_BOARD.md` por si esto cambia en el futuro.

**Cache Versioning.** Al agregar campos a `MedicationResult` o `PharmacyPrice` (`packages/domain/src/types.ts`), incrementar `CACHE_PREFIX` en `mobile/src/lib/cache.ts` (ej. `search_cache_v10_` → `v11_`).

## 12. Comandos de desarrollo

```bash
pnpm install                              # instalar dependencias (raíz)
pnpm dev                                  # Expo (mobile)
pnpm dev:api                              # backend con vercel dev
pnpm dev:web                              # web con next dev
pnpm typecheck                            # mobile + api + domain + web
pnpm --filter api test
pnpm --filter @comparafarma/domain test
pnpm --filter api healthcheck:prod        # check productivo manual
```

Endpoints backend: `GET /api/search?q=...` (principal), `GET /api/health` (healthcheck), `?debug=1` (diagnóstico, requiere `API_SECRET_KEY` — ver `docs/operations/`). CI (`.github/workflows/ci.yml`): `typecheck` → `domain-tests` → `api-tests` → `deploy-api`. Monitor productivo (`.github/workflows/monitor-api.yml`): corre cada hora, cubre las 9 farmacias, auto-asigna issue de fallo al owner del repo si falla.

Publicación Android: `pnpm build:android` (AAB local, método preferido) o `eas build --platform android --profile production` (cuota EAS); fix urgente JS/TS sin build nuevo: `eas update --branch production`. Detalle completo y checklist vigente: `docs/operations/` y `docs/program/PROGRAM_BOARD.md`.
