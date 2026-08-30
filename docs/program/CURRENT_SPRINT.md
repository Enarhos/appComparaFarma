# CURRENT_SPRINT — ComparaFarma

Contiene únicamente el trabajo activo del programa. No es un historial (→ `DONE.md`) ni un backlog completo (→ `MASTER_BACKLOG.md`).

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-SPR-001 |
| **Nombre** | CURRENT_SPRINT.md |
| **Dominio** | Gestión de Programa (`docs/program/`) |
| **Estado** | Activo |
| **Versión** | 1.8 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / CTO |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Documento de Ejecución de Programa |
| **Fuente Oficial** | Este documento, para el sprint activo actual |
| **Última actualización** | 2026-08-30 |
| **Pregunta que responde** | ¿Qué se está haciendo exactamente ahora mismo? |

---

## 2. Sprint activo

### Production Release 1.0 — cierre operacional

**Estado:** 🟡 Activo — Mobile 1.4.2/vc34 enviado a revisión de Google Play en Closed Testing; Producción continúa inactiva.

Web/API y AUTH-DELETE-01/02 permanecen cerrados. `CF-SEARCH-001` (PR #132) y `CF-SEARCH-002` (PR #133) están mergeados a `origin/main` y desplegados en Web; la validación visual de `ibuprofeno 600 mg` confirmó la priorización correcta por concentración.

El release **PreciosFarma 1.4.1 / versionCode 33** fue aprobado por Google Play y quedó disponible en `Prueba cerrada — Test ComparaFarma`. Se instaló desde Google Play en un dispositivo real y se verificó la versión 1.4.1. Ese cliente, sin embargo, antecede los cambios Mobile de Query Intent/Relevance incorporados en vc34.

El AAB **PreciosFarma 1.4.2 / versionCode 34** fue generado y verificado desde el SHA `f59a4daaa3635da66a8fedc7101540560e86e8c8`, firmado con el mismo lineage de release que vc33 y posteriormente autorizado por Mario exclusivamente para **Closed Testing**. Fue subido a Google Play y enviado a revisión en `Test ComparaFarma`. El Resumen de publicación mostró un único cambio: `Prueba cerrada - Test ComparaFarma → PreciosFarma 1.4.2 → Iniciar lanzamiento completo`. **No se autorizó ni realizó ninguna promoción a Producción.**

Estado operativo: **`VC34_GOOGLE_PLAY_REVIEW_AWAITING_PHYSICAL_CERTIFICATION`**.

Durante la espera, `CF-WEB-001 — Responsive Layout & Text Overflow` fue implementado, validado, mergeado vía PR #136 y desplegado. Su alcance principal queda cerrado. Permanece como follow-up no bloqueante `CF-WEB-001-FU1 — Mobile Price History Chart Readability — P2`.

`ACCOUNT-UX-01` fue auditado e implementado en Mobile. El trabajo confirma que la cuenta es opcional y que hoy no sincroniza favoritos/historial/alertas entre dispositivos; el cambio mejora la señal de sesión, muestra el email real de verificación y expone la recuperación de contraseña ya existente. PR #138 está abierto; este trabajo es posterior a vc34 y **no forma parte del AAB actualmente en revisión**.

`BIOEQUIVALENCE-DATA-QUALITY-01` permanece documentado y gateado; Option D/tri-state y la corrección semántica de datos no están implementadas.

---

## 3. Evidencia Mobile

| Entregable | Estado | Evidencia |
|---|---|---|
| Closed Testing vc33 | ✅ | Aprobado por Google Play; publicado en `Test ComparaFarma`; instalación física confirmada |
| AAB PreciosFarma 1.4.2 vc34 | ✅ Verificado | SHA-256 `a5c3daf50ce3d3e05f55e898ac86e03b6c9faffd1369f742d12083c8248a2461` |
| versionCode / versionName | ✅ | 34 / 1.4.2 |
| targetSdk / minSdk | ✅ | 36 / 24 |
| Firma release | ✅ | `jar verified`; mismo certificado/lineage que vc33 |
| Base de código vc34 | ✅ | `f59a4daaa3635da66a8fedc7101540560e86e8c8` (incluye PR #132 + #133) |
| Upload Google Play vc34 | ✅ | Procesado en Closed Testing |
| Revisión Google Play vc34 | ⏳ | `Cambios en revisión` — `Test ComparaFarma`, PreciosFarma 1.4.2 |
| Producción Mobile | ⚪ | Inactiva; sin autorización de Producción |

---

## 4. Trabajo activo / pendiente

1. Esperar la resolución de Google Play para **PreciosFarma 1.4.2/vc34** en Closed Testing.
2. Una vez aprobada: comprobar que `Test ComparaFarma` muestra 1.4.2/vc34 y actualizar/instalar desde Google Play en un Android físico.
3. Ejecutar certificación física mínima de búsqueda sobre: `omeprazol`, `esomeprazol`, `ibuprofeno`, `ibuprofeno 200 mg`, `ibuprofeno 400 mg`, `ibuprofeno 600 mg`, seguido inmediatamente de `ibuprofeno`, `paracetamol 500 mg x16`, `Tapsin`, `losartan 50 mg`, `losartan + HCTZ`; incluir smoke de navegación/identidad de presentación.
4. Resolver antes de Producción los pendientes de publicación: nombre público Play `ComparaFarma → PreciosFarma` y URL vigente de política de privacidad.
5. Solo después de certificación física sin P0/P1, tomar decisión explícita GO/NO-GO a Producción.
6. Completar review/merge de `ACCOUNT-UX-01` (PR #138) como trabajo posterior a vc34; no reconstruir vc34 por este cambio.
7. Incorporar en una tarea documental separada los follow-ups `CF-WEB-001-FU1` y el comportamiento de Stack/header para `actualizar-clave.tsx`.

---

## 5. Warnings no bloqueantes

- Play Console advierte ausencia de archivo de desofuscación R8/ProGuard.
- Estado de `EXPO_PUBLIC_SENTRY_DSN` debe reevaluarse para un build futuro; no bloquea vc34 mientras no cambie el release gate.
- Tests Jest Mobile no tienen job explícito en CI.
- E2E responsive de Web usan API/scrapers reales y deliberadamente no son gate de CI.
- Checkout principal local atrasado/dirty: no usar para releases/integraciones; continuar con worktrees limpios.
- `BIOEQUIVALENCE-DATA-QUALITY-01` sigue abierto como deuda de calidad semántica.

---

## 6. Criterio de término

`Production Release 1.0` se cierra cuando:

- vc34 haya terminado la revisión de Google Play en Closed Testing;
- vc34 se haya instalado desde Google Play y certificado en dispositivo físico;
- no haya P0/P1 abiertos de búsqueda/identidad del release;
- nombre público y política de privacidad de la ficha Play estén resueltos;
- exista GO explícito del Founder para Producción;
- Mobile haya sido promovido/publicado en Producción;
- estado final quede registrado en acta, `PROGRAM_BOARD.md`, `DONE.md` y `MILESTONES.md`.

---

## 7. Gobierno

- **No tocar Producción en Google Play sin autorización explícita de Mario.**
- vc34 está autorizado únicamente para Closed Testing y se encuentra en revisión.
- `ACCOUNT-UX-01` es posterior a vc34; su merge no invalida el AAB ya generado porque no forma parte de ese artefacto.
- `CF-WEB-001` queda cerrado/mergeado/desplegado; `CF-WEB-001-FU1` es P2 no bloqueante.
- `BIOEQUIVALENCE-DATA-QUALITY-01` permanece documentado y sin implementación de Option D.
- `CF-SEARCH-001` y `CF-SEARCH-002` están **MERGED_TO_MAIN** y no se reabren sin evidencia nueva.

---

## 8. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.6 | 2026-08-29 | Google Play aprobó vc33; publicado en Closed Testing, no promovido a Producción. Se registró vc34 como AAB generado pendiente de autorización. |
| 1.7 | 2026-08-29 | Corrección de estado: CF-SEARCH-001 PR #132 y CF-SEARCH-002 PR #133 ya mergeados; Web validada para `ibuprofeno 600 mg`. |
| 1.8 | 2026-08-30 | Reconciliación operacional: vc34 fue autorizado exclusivamente para Closed Testing, subido y enviado a revisión; Production continúa inactiva. CF-WEB-001 PR #136 queda mergeado/desplegado. ACCOUNT-UX-01 queda en PR #138 abierto y fuera del AAB vc34. Se actualiza el próximo gate a certificación física de vc34 y se registran pendientes pre-Producción de listing/política de privacidad. |
