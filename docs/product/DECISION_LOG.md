# Decision Log

Registro cronológico de decisiones y cierres relevantes. Cada entrada: fecha, qué se decidió/cerró, referencia.

| Fecha | Entrada |
|---|---|
| 2026-07-19 | **CF-108 (Migrar mobile a `@comparafarma/domain`) cerrado retroactivamente.** El código ya estaba implementado y en `main` (paquete `packages/domain` consumido por `mobile/`, `CACHE_PREFIX` en `search_cache_v10_`, `matchKey` migrado), pero el issue seguía marcado `Estado: Pendiente`. Verificado por `/docs-steward` — ver `docs/engineering/issues/CF-108_MIGRATE_MOBILE.md`. |
