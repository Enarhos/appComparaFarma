# Decision Log

Registro cronológico de decisiones y cierres relevantes. Cada entrada: fecha, qué se decidió/cerró, referencia.

| Fecha | Entrada |
|---|---|
| 2026-07-19 | **CF-108 (Migrar mobile a `@comparafarma/domain`) cerrado retroactivamente.** El código ya estaba implementado y en `main` (paquete `packages/domain` consumido por `mobile/`, `CACHE_PREFIX` en `search_cache_v10_`, `matchKey` migrado), pero el issue seguía marcado `Estado: Pendiente`. Verificado por `/docs-steward` — ver `docs/engineering/issues/CF-108_MIGRATE_MOBILE.md`. |
| 2026-07-19 | **Reforzado el monitoreo de producción**: `monitor-api.yml` pasa de cada 6h a cada 1h y cubre las 9 farmacias (antes 4); rate limiting migrado de memoria a Upstash Redis (resuelve RL-01 de `ER-002`); Sentry agregado al backend (`api/src/lib/sentry.ts`, condicional a `SENTRY_DSN`); issues de fallo del monitor se auto-asignan al owner para notificación por email. |
| 2026-07-19 | **PM-001 — pipeline de deploy del backend estuvo roto en producción** (`/api/search` devolvía 500). Causas raíz: la CI subía solo `api/` (sin `packages/domain`) al deployar, y `packages/domain` nunca se compilaba a JS real. Resuelto: deploy desde la raíz del monorepo + Root Directory `api` en Vercel + glob explícito de functions + build real de `packages/domain` vía `postinstall`. Detalle completo en `docs/engineering/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`. |
