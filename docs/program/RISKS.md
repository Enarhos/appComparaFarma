# RISKS — ComparaFarma (Registro de Programa)

Registro oficial de riesgos consolidado a nivel de programa. Todos los riesgos aquí ya estaban documentados en algún dominio de origen — este documento no introduce riesgos nuevos sin evidencia, solo los reúne en un único lugar con formato consistente.

**Probabilidad:** estimación cualitativa (Alta/Media/Baja), no una medición estadística — no existe en el repositorio ningún modelo formal de probabilidad de riesgo.

Sigue obligatoriamente la estructura de `docs/governance/templates/GOVERNED_DOCUMENT_TEMPLATE.md`.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-RSK-001 |
| **Nombre** | RISKS.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.0 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / PMO Director |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Registro de Riesgos de Programa |
| **Fuente Oficial** | Este documento es la fuente oficial del registro *consolidado*; cada riesgo individual conserva su fuente de origen citada |
| **Documentos de los que depende** | `docs/product/RISKS.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/design/brand/BRAND_ARCHITECTURE.md` §4.8, `docs/archive/assessments/PROJECT_INVENTORY.md` |
| **Pregunta que responde** | ¿Qué riesgos existen hoy en el programa? |

---

## 2. Propósito

Reunir en un solo registro todos los riesgos ya identificados en los distintos dominios (Product, Release, Brand, Analysis), para que ninguno quede visible solo dentro de su documento de origen.

---

## 3. Alcance

**Este documento define:** un registro único de riesgos de programa, con ID, descripción, impacto, probabilidad, mitigación y estado.

**Este documento NO define:** nuevos riesgos sin evidencia previa, ni decide acciones de mitigación más allá de las ya documentadas en la fuente de cada riesgo.

---

## 4. Contenido principal

| ID | Descripción | Impacto | Probabilidad | Mitigación | Estado | Fuente |
|---|---|---|---|---|---|---|
| R-001 | Data Safety en Play Console — bloqueaba el paso de Prueba Cerrada a Producción | Crítico (histórico) | — | Superado: el CTO confirmó en chat (2026-08-08) que la Prueba Cerrada finalizó (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio) | 🟢 Cerrado (2026-08-08) | `CLAUDE.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/archive/meetings/20260731b.md` |
| R-002 | `eas.json` (`submit.production.android.track: "internal"`) podría enviar un futuro `eas submit` al track equivocado | Alto — retraso de publicación si se usa ese flujo sin corregirlo | Media (mitigado en la práctica porque el método de build preferido es manual, no `eas submit`) | Confirmar mecanismo de submit antes de usarlo | 🟡 Abierto, mitigado parcialmente | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3 |
| R-003 | Endpoint de diagnóstico `/api/search?debug=1` sin autenticación garantizada si `API_SECRET_KEY` no está seteada en Vercel de producción | Alto — expone mensajes de error internos de los 9 scrapers a terceros | No determinable (depende de configuración de Vercel no verificable desde el repositorio) | Confirmar `API_SECRET_KEY` en Vercel de producción | 🟡 Abierto, no verificable | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3, §5 |
| R-004 | PII en logs de Vercel (email+IP+mensaje en `feedback.ts`; `purchaseToken` en `subscriptions.ts`) | Medio — exposición de datos personales a quien tenga acceso al dashboard de Vercel | Media | Ninguna implementada todavía | 🟡 Abierto | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §3 |
| R-005 | `mobile/` congelado (Prueba Cerrada) — bloqueaba verificación end-to-end de Suscripciones y cualquier evolución de producto móvil | Alto (histórico) | — | Resuelto junto con R-001 (2026-08-08) (confirmación del CTO en sesión de chat, 2026-08-08 — ver `CLAUDE.md`, sección "Actualización de estado (2026-08-08)"; sin artefacto de Play Console verificado de forma independiente en este repositorio) | 🟢 Cerrado (2026-08-08) | `CLAUDE.md`, `docs/archive/product/EPICS_2026-08-15.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md` §8 |
| R-006 | Catálogo comercial de planes vacío — sin precio ni plan vendible definido | Alto — bloquea monetización real vía Suscripciones | Alta | Definición de precios por el CEO (decisión pendiente, no técnica) | 🔴 Abierto | `docs/archive/assessments/PROJECT_INVENTORY.md` §3, §10 |
| R-007 | Sin fuente de datos de bioequivalencia confiable e integrada (más allá de Dr. Simi/Farmex) | Medio — bloquea Sprint B (CFPS 4.15, alto puntaje) | Alta | Spike ya cerrado; "Sprint B-lite" acotado a fuentes confiables propuesto pero no ratificado | 🟡 Abierto | `docs/archive/product/BACKLOG_PRODUCT_2026-08-15.md` |
| R-008 | Deploy roto del backend puede quedar "verde" en CI y servir 500 sin alerta inmediata | Alto | Baja (ya ocurrió una vez — PM-001 — y se corrigió) | `monitor-api.yml` cada hora sobre 9 farmacias; falta smoke test post-deploy en CI | 🟡 Mitigado, no cerrado | `docs/product/RISKS.md`, `docs/engineering/postmortems/PM-001` |
| R-009 | 3 de 9 scrapers (Ahumada, Sermecoop, EasyFarma) dependen de HTML frágil sin tests exhaustivos | Medio — pueden romperse en silencio si la farmacia cambia su sitio | Media | Monitor cubre las 9 farmacias cada hora | 🟡 Mitigado, no cerrado | `docs/product/RISKS.md` |
| R-010 | Rate limiting/auth dependen de env vars que, si faltan, dejan el sistema abierto en vez de fallar cerrado | Medio | Baja | Rate limit migrado a Upstash Redis (distribuido); `API_SECRET_KEY` verificada como configurada en al menos un entorno | 🟡 Mitigado, no cerrado | `docs/product/RISKS.md` |
| R-011 | Ejecución de la migración SQL del Registro Canónico (CFM-ID) en producción no confirmada en la evidencia revisada | Medio — si no corrió, el sistema funciona igual pero sin continuidad de identidad de medicamento | No determinable | Confirmar directamente en Supabase | 🟡 Abierto, no verificable | `docs/archive/assessments/PROJECT_INVENTORY.md` §3 |
| R-012 | "Marketplace futuro" (Digital Asset Register, DAR-400) contradice el posicionamiento declarado "no somos un marketplace" (Vision 2030, Brand Foundations) | Medio — riesgo de incoherencia de marca si se construye sin resolver la tensión | Baja (todavía no se ha empezado a construir) | Ninguna — tensión detectada, no resuelta | 🟡 Abierto | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.8 |
| R-013 | Inconsistencia terminológica entre `BUSINESS_CAPABILITY_MAP.md` y `BUSINESS_SERVICES.md` (nombres de al menos 4 capacidades citados de forma distinta) | Medio — si se traslada a naming público, erosiona los atributos de percepción "Confianza"/"Evidencia" | Baja (interna, no pública todavía) | Ninguna — reportado, no corregido | 🟡 Abierto | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.4 |
| R-014 | Ninguna decisión de marca o diseño (identidad, logo, color) tiene ratificación formal del CEO | Medio — cualquier trabajo posterior de diseño se apoya en una base no ratificada | Alta (es el estado actual, no una posibilidad futura) | Ninguna — pendiente de agenda del CEO | 🔴 Abierto | `docs/design/brand/BRAND_FOUNDATIONS.md`, `docs/design/*` |
| R-015 | Touchpoint de marca externa (Flow) visible durante el checkout de suscripción, sin criterio documentado de convivencia con la marca ComparaFarma | Bajo | Media | Ninguna documentada | 🟡 Abierto | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.8 |
| R-016 | Historial de precios con dos mecanismos de datos no unificados entre mobile (local) y web/api (Supabase) | Bajo — inconsistencia de datos entre plataformas, no visible como error | Media | Ninguna | 🟡 Abierto | `docs/archive/assessments/PROJECT_INVENTORY.md` §9 |
| R-017 | Keystores de firma Android (3 `.jks`) sueltos en el filesystem del proyecto, no trackeados en git | Bajo | Baja | `.gitignore` ya excluye estos archivos del control de versiones | 🟢 Mitigado | `docs/archive/releases/PRODUCTION_READINESS_V2.md` §5 |

---

## 5. Relaciones

Este registro consolida `docs/product/RISKS.md`, la sección 3 de `docs/archive/releases/PRODUCTION_READINESS_V2.md`, la sección 4.8 de `docs/design/brand/BRAND_ARCHITECTURE.md`, y los puntos marcados "incierto" en `docs/archive/assessments/PROJECT_INVENTORY.md`. No reemplaza a ninguno como fuente de detalle.

---

## 6. Matriz de Trazabilidad

| Concepto | Fuente Oficial | Consolidado aquí | Observaciones |
|---|---|---|---|
| Riesgos técnicos de producto (deploy, scrapers, rate limiting) | `docs/product/RISKS.md` | ✔ (R-008 a R-010) | — |
| Riesgos de release/Google Play | `docs/archive/releases/PRODUCTION_READINESS_V2.md` | ✔ (R-001 a R-004) | — |
| Riesgos de marca/arquitectura | `docs/design/brand/BRAND_ARCHITECTURE.md` §4.8 | ✔ (R-012 a R-015) | — |
| Incertidumbres de estado real | `docs/archive/assessments/PROJECT_INVENTORY.md` | ✔ (R-011, R-016) | — |

---

## 7. Gobierno

No reemplaza `docs/product/RISKS.md` como fuente de riesgos de producto. Cuando un riesgo se cierre en su documento de origen, este registro debe actualizarse para reflejarlo.

**Ninguna versión de este documento tiene, a la fecha, aprobación formal del CEO/fundador.**

---

## 8. Documentos relacionados

`docs/product/RISKS.md`, `docs/archive/releases/PRODUCTION_READINESS_V2.md`, `docs/design/brand/BRAND_ARCHITECTURE.md`, `docs/program/PROGRAM_BOARD.md`, `DECISION_QUEUE.md`.

---

## 9. Control de Cambios

| Versión | Fecha | Estado | Aprobación | Cambios | Base documental |
|---|---|---|---|---|---|
| 1.0 | 2026-08-05 | Activo | Pendiente (CEO/fundador) | Creación inicial, consolidando 17 riesgos ya identificados en 4 documentos de origen distintos. | Ver Matriz de Trazabilidad (§6) |

---

## 10. Historial de Gobierno

| Fecha | Acción | Responsable (rol asumido) | Resultado |
|---|---|---|---|
| 2026-08-05 | Consolidación del registro de riesgos de programa | Enterprise Program Manager / PMO Director | `docs/program/RISKS.md` v1.0 (este documento) |

**Pendiente de definición:** ninguna aprobación formal del CEO/fundador registrada todavía.
