# ER-002 — Search Engine Full Review

**ID:** ER-002  
**Nombre:** Search Engine Full Review  
**Fecha:** 2026-06-29  
**Responsable:** Claude Code  
**Revisor:** ChatGPT CTO  
**Estado:** Draft  
**Ubicación:** `docs/engineering/reviews/ER-002_SEARCH_ENGINE_FULL_REVIEW.md`

---

## 1. Resumen Ejecutivo

Evaluación general del Search Engine de ComparaFarma.

Debe incluir:

- score general,
- fortalezas,
- debilidades,
- riesgos críticos,
- deuda técnica,
- recomendación CTO-ready.

---

## 2. Alcance

Auditar el flujo completo de búsqueda:

- mobile search UI,
- hooks,
- Zustand store,
- cache mobile,
- API route,
- search service,
- normalization,
- deduplication,
- ranking,
- pharmacy clients,
- backend cache,
- rate limiting,
- error handling,
- analytics,
- Sentry,
- PostHog,
- tests.

---

## 3. Mapa del Flujo Completo

Documentar paso a paso:

```text
Usuario escribe
↓
Debounce
↓
Store / Hook
↓
Cache mobile
↓
API request
↓
Route backend
↓
Rate limit / auth
↓
Backend cache
↓
SearchService
↓
Pharmacy clients
↓
Normalization
↓
Deduplication
↓
Ranking
↓
Response
↓
Mobile render
↓
Analytics / alerts