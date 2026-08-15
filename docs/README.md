# ComparaFarma — Documentación

ComparaFarma es una app móvil (React Native + Expo) y sitio web (Next.js) que compara en tiempo real los precios de medicamentos en 9 farmacias chilenas. Ver `CLAUDE.md` en la raíz del repositorio para el contexto técnico completo (arquitectura, comandos, estado actual).

Este directorio sigue un modelo de **documentación gobernada**: distingue lo vigente de lo histórico, y cada documento tiene un dueño y un ciclo de vida claros. Ver `docs/governance/DOCUMENT_GOVERNANCE_MODEL.md` para el modelo completo.

## Cómo encontrar lo que buscás

| Si buscás... | Andá a |
|---|---|
| Qué es ComparaFarma, visión, estrategia de negocio | `docs/enterprise/` |
| Qué hace el producto, experiencias, definiciones funcionales | `docs/product/` |
| Arquitectura técnica, decisiones (ADR/RFC), modelo de dominio, integraciones | `docs/technology/` |
| Identidad de marca, sistema de diseño, mockups | `docs/design/` |
| Cómo se opera la plataforma: servicios externos, runbooks, incidentes | `docs/operations/` |
| Qué se está trabajando ahora, backlog activo, roadmap del programa | `docs/program/` |
| Reglas de gobierno documental, templates | `docs/governance/` |
| Algo que ya pasó: decisiones cerradas, sprints ejecutados, planes reemplazados | `docs/archive/` |

## Estructura

```
docs/
├── README.md                  ← este archivo
├── funcionalidades.md         ← inventario funcional vigente (mobile + web)
├── privacy-policy.html        ← política de privacidad — NO MOVER (publicada vía GitHub Pages, ver nota abajo)
│
├── enterprise/                ← visión de negocio, estrategia funcional, portafolio
│   └── strategy/
├── product/                   ← definición de producto vigente
│   ├── definition/            ← PRICE_CHANNELS, PERSONAS, principios
│   ├── experiences/           ← experiencias materializadas (Resultados, Ficha, Alertas...)
│   ├── decisions/             ← DECISION_LOG (histórico append-only, vigente)
│   ├── strategy/               ← COMPANY_STRATEGY
│   ├── legal/                  ← (reservado — ver nota privacy-policy.html)
│   └── assets/                ← mockups de experiencias
├── technology/                ← arquitectura técnica vigente
│   ├── architecture/          ← DOMAIN_MODEL, PLATFORM_CAPABILITY_MODEL, IDENTITY_INTEGRATION_PLAN
│   ├── decisions/              ← adr/, rfc/ (Architecture/Request for Comments Decision Records)
│   ├── domain/                 ← USER_DOMAIN_MODEL
│   ├── integrations/           ← documentación de integraciones con farmacias
│   ├── database/               ← schema.sql
│   ├── reviews/                ← Engineering Reviews (ER-XXX) vigentes
│   └── postmortems/            ← Postmortems (PM-XXX) vigentes
├── design/                     ← identidad de marca y sistema de diseño (congelados, ver README propio)
│   ├── brand/
│   ├── system/
│   ├── product/                ← Signature Components
│   ├── decisions/
│   └── assets/
├── operations/                  ← operación de la plataforma
│   ├── services/reviews/        ← revisión por servicio externo (Supabase, Vercel, Khipu...)
│   ├── runbooks/                ← procedimientos operativos (deployment, pharmacy flags)
│   └── environment/
├── program/                    ← gestión de programa (vista consolidada entre workstreams)
│   └── backlog/issues/          ← issues de ingeniería activos (CF-XXX pendientes)
├── governance/                  ← modelo de gobierno documental, templates
│   └── templates/
└── archive/                     ← histórico — nunca fuente de verdad vigente
    ├── product/, project/        ← backlogs/status de producto ya reemplazados
    ├── engineering/issues/       ← issues de ingeniería cerrados (CF-XXX archivados)
    │   └── stripe/               ← issues de la integración Stripe, reemplazada por Flow
    ├── plans/, assessments/, reviews/, meetings/, releases/, design/, execution/, foundational-book/
```

## Reglas de este directorio

- **`docs/archive/` no es basura.** Preserva el historial y las decisiones tal como se tomaron en su momento. Un documento archivado nunca debe tratarse como fuente de verdad vigente — si algo archivado y algo activo se contradicen, gana lo activo.
- **`docs/program/backlog/issues/`** contiene únicamente trabajo genuinamente pendiente. Un issue con checklist "Implementado" y evidencia real en el código va a `docs/archive/engineering/issues/`, no aquí.
- **`docs/design/`** está congelado (identidad visual, Signature Components, Component Library ya decididos) — cualquier cambio requiere un RFC, no un sprint de diseño directo. Ver `docs/design/README.md`.
- **`docs/privacy-policy.html` no se mueve.** Está publicado directamente desde este path vía GitHub Pages (`https://enarhos.github.io/appComparaFarma/privacy-policy.html`, referenciado en Google Play) — moverlo rompería esa URL en producción.

## Ownership

Cada documento gobernado (ver `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`) declara su propio dueño y estado en su tabla de metadatos. Para una vista de qué está activo/congelado/pendiente por dominio, ver el `README.md` de cada carpeta de primer nivel (`docs/enterprise/README.md`, `docs/product/README.md`, `docs/design/README.md`, `docs/program/README.md`).
