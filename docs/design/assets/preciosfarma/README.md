# Assets Maestros — PreciosFarma (FASE A, candidatos para revisión CTO)

**Estado: candidatos, NO aplicados todavía a `mobile/` ni `web/`.** Generados en el worktree `brand/preciosfarma-rebrand`, pendientes de `READY_FOR_CTO_ASSET_REVIEW`. Ver `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-004 y `docs/design/brand/BRAND_ARCHITECTURE.md` §4.2.1.

## Trazabilidad — de dónde sale cada cosa

- **Geometría del isotipo:** extraída, sin modificar, de `docs/design/assets/candidato_09_plano_construccion.svg` (líneas 7-8 y 11-12). No se reconstruyó a ojo ni se usó IA generativa. Dos variantes, ambas ya documentadas en `docs/design/brand/LOGO_SYSTEM.md` §4.4 y auditadas en `docs/design/BRAND_IDENTITY_VALIDATION.md` (BV-001):
  - **Estándar** (≥64px): `path d="M76.98,40.24 A30,30 0 1,1 55.76,18.98"` stroke-width 12, `circle r="11"`.
  - **Tamaño mínimo** (<64px, vano ampliado a 90°): `path d="M75.72,59.48 A30,30 0 1,1 59.48,20.28"` stroke-width 16, `circle r="13"`.
- **Paleta:** `docs/design/BRAND_EXPERIENCE_V1.md` §1 (congelada por DD-002). Indigo `#3F3FB8` (contraste 8.03:1 vs blanco, recalculado independientemente — ver validación), Brand Ink `#2E2E8C` (11.14:1 vs blanco), Accent Teal `#0D827B` (no usado en estos assets — el logo/isotipo no usa Accent).
- **Tipografía del wordmark:** Inter Bold (700), la única familia documentada en `BRAND_EXPERIENCE_V1.md` §2. El wordmark se generó convirtiendo el texto "PreciosFarma" a **paths vectoriales reales** (outline) usando el binario oficial de Inter (`@fontsource/inter` v5.3.0, licencia SIL Open Font License) vía `fontTools` — no es una fuente de sistema simulada ni un placeholder: es la tipografía real, ya vectorizada para no depender de que Inter esté instalada donde se use el SVG.
- **Iconografía Lucide:** no aplica a este entregable (Fase A es solo logo/app icon/favicon/inventario Play Store, no iconografía de producto).

## Contenido

- `logo/` — isotipo standalone (5 variantes de color × 2 geometrías), wordmark "PreciosFarma" (3 colores, SVG vectorial + PNG), logotipo horizontal (isotipo + wordmark) en versión clara y oscura.
- `app-icon/` — candidato iOS (cuadrado plano 1024×1024, el sistema aplica su propia máscara), Adaptive Icon Android (foreground transparente con zona segura 66% + background sólido Indigo, por separado), variante monocromo para el ícono temático de Android 13+, ícono de respaldo Android aplanado, e ícono de splash (PNG transparente, isotipo blanco centrado — el color de fondo `#3F3FB8` se aplica como `backgroundColor` en `app.json`, no está horneado en el PNG).
- `web/` — favicon en dos tratamientos (Indigo sobre transparente; blanco sobre Indigo sólido) en 16/32/48px, usando la geometría de tamaño mínimo.
- `_review/` — composiciones de previsualización (fondo aplicado, comparativas) para facilitar la revisión visual. **No son assets de producción** — no copiar estos archivos a `mobile/` ni `web/`.
- `PLAY_STORE_ASSET_INVENTORY.md` — qué falta regenerar para Play Store y por qué no se generó en esta Fase A.

## Qué NO se hizo (por diseño, respetando el Gate A)

- No se tocó `mobile/assets/`, `mobile/app.json`, `web/src/app/layout.tsx` ni ningún archivo real de Mobile/Web.
- No se generaron screenshots de Play Store (requieren la app ya rebrandeada corriendo — eso es Fase B).
- No se generó ningún logo, símbolo ni paleta nueva: todo deriva de decisiones ya aprobadas (DD-001/002/003).
