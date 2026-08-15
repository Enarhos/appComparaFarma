# PROJECT_STATUS — Documento Ejecutivo

**Última actualización:** 2026-08-06 (sprint `PROJECT-001`, cierre de Fase 1 / apertura de Fase 2 de identidad y experiencia; con una actualización adicional del mismo día, sprint `RELEASE-003`, sobre el estado de publicación en Google Play — ver la sección "En desarrollo").

Este documento responde, en una sola lectura: qué está terminado, qué está congelado, qué está en desarrollo y qué viene después — específicamente para el arco de Identidad Visual → Experiencia de Producto. Para el estado del programa completo (incluyendo Suscripciones, publicación en Google Play, Arquitectura Empresarial), la fuente sigue siendo `docs/program/PROGRAM_BOARD.md`.

---

## Terminado

- **Identidad de marca completa**: Brand Foundations, Brand DNA (Arquitectura + Identidad Visual), Brand Kit (Guidelines, Logo, Color, Tipografía, Iconografía), Creative Direction (Design Concept).
- **Dirección visual decidida y validada**: Visual Benchmark, Visual Direction, Color Research (con análisis de accesibilidad WCAG y daltonismo), Visual Exploration (3 propuestas comparadas, una seleccionada — Precision).
- **Identidad materializada visualmente**: Brand Experience v1 — 13 piezas (Home, Búsqueda, Resultados, Ficha, Dashboard, Header, Footer, App Icon, Splash, Componentes, Tipografía, Color) sobre la dirección Precision, con paleta refinada para accesibilidad.
- **Sistema de componentes propio**: Distinctive Product Identity (diagnóstico de genericidad + 6 propuestas de firma visual) y Signature Components v1 (7 componentes completamente especificados y materializados: Savings Arc, Channel Bar, Price Block, Price Break Marker, Sparkline, Comparison Card, Empty State).
- **Home evolucionada por conversión**: hero con promesa concreta, buscador protagonista, prueba de valor real, microcopy de confianza (`UX-001`).
- **Primera experiencia de Fase 2 materializada**: Resultados — comportamiento documentado (`RESULTS.md`) y mockups Desktop/Tablet/Mobile + estados especiales (`PRODUCT-002`).

## Congelado

**La identidad visual completa de ComparaFarma queda congelada** a partir de este cierre: color, tipografía, iconografía, logo/isotipo, Signature Components y Component Library. Ningún sprint futuro puede modificar estas decisiones sin un RFC específico aprobado por el comité. Ver la sección "Frozen" en `docs/design/README.md` y `docs/design-system/README.md` — `docs/brand/README.md` y `docs/brand/DOMAIN_STATUS.md` ya declaraban este mismo congelamiento para el dominio Brand desde antes de este sprint; este cierre lo extiende formalmente a `docs/design/` y `docs/design-system/`, que hasta ahora permanecían con estado "Activo" pese a contener decisiones ya cerradas (Signature Components, Component Library).

## En desarrollo

- **Fase 2 — Product Experience**: la experiencia de Resultados ya está materializada; Búsqueda, Ficha de medicamento, Alertas de precio y Journeys ya tienen sus principios de comportamiento documentados (Sprints UX.2–UX.5) pero todavía no su materialización visual — queda a decisión del comité cuál se aborda a continuación.
- **Fuera del arco de identidad/experiencia** (workstreams independientes, en curso según `docs/program/PROGRAM_BOARD.md`): publicación de `mobile/` en Google Play — **actualizado 2026-08-06 (`RELEASE-003`)**: los dos bloqueadores binarios de plataforma (Data Safety, Content Rating/IARC) quedan **Resueltos** tras verificación directa de Mario en Google Play Console; clasificación pasa de `NOT READY` a `AUTORIZO PUBLICACIÓN CON CONDICIONES` (GO con acciones manuales) en `docs/launch/PRODUCTION_READINESS_REVIEW.md` v1.1. Quedan pendientes 3 acciones manuales antes del submit: corregir/confirmar `eas.json` (track de envío), confirmar `API_SECRET_KEY` en Vercel de producción, y resolver la ambigüedad de assets de Play Store (ícono/feature graphic duplicados, screenshots insuficientes) — ver detalle en `PRODUCTION_READINESS_REVIEW.md` §4.4 y §4.9. Suscripciones vía Flow (código completo, credenciales de producción pendientes de Mario), Registro Canónico de Medicamentos (parcial).

## Qué viene después

1. El comité decide cuál experiencia de producto se materializa a continuación (Búsqueda, Ficha de medicamento o Alertas de precio son las candidatas con principios ya cerrados).
2. Cualquier necesidad real de tocar color, tipografía, iconografía o Signature Components debe pasar primero por un RFC — no por un sprint de diseño directo.
3. La restricción de `mobile/` en Prueba Cerrada de Google Play se levantó el 2026-08-08 (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio). `mobile/` puede evolucionar normalmente, igual que `api/` y `web/`.

---

**Para cualquier persona nueva en el proyecto:** con `PROJECT_PHASES.md` y este documento debería bastar para entender, en menos de cinco minutos, qué ya no se discute (identidad visual) y qué se está construyendo ahora (experiencia de producto, empezando por Resultados).
