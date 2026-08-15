# Risks

Riesgos conocidos del proyecto. Cada entrada: riesgo, impacto, mitigación actual.

| Riesgo | Impacto | Mitigación actual |
|---|---|---|
| Un deploy roto del backend puede quedar "verde" en CI y servir 500 en producción sin que nadie se entere de inmediato (ver `docs/technology/postmortems/PM-001_DEPLOY_PIPELINE_BROKEN.md`) | Alto — `/api/search` es el flujo principal de la app | `monitor-api.yml` corre cada hora contra las 9 farmacias y alerta por email. Pendiente (no implementado): un smoke test post-deploy dentro de la propia CI antes de dar `deploy-api` por exitoso. |
| 3 de 9 scrapers son HTML frágil sin tests (Ahumada, Sermecoop, EasyFarma) — rompen en silencio ante cambios de markup del sitio | Medio — degradación parcial de cobertura, no caída total | `monitor-api.yml` ahora cubre las 9 farmacias (antes 4); skill `/scraper-watchdog` para diagnóstico a demanda |
| Rate limiting y auth de la API dependen de variables de entorno que, si faltan, dejan el sistema en modo "abierto" en vez de fallar cerrado | Medio | Documentado en `ER-002`; rate limit ahora usa Redis distribuido (antes en memoria, inefectivo en Vercel serverless) |
