# PROGRAM_BOARD — ComparaFarma

**Este es el documento con el que debe empezar toda sesión de trabajo.** Vista ejecutiva del estado real del programa.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BRD-001 |
| **Nombre** | PROGRAM_BOARD.md |
| **Estado** | Activo |
| **Versión** | 1.7 |
| **Propietario** | CEO / CTO |
| **Última actualización** | 2026-08-30 |

---

## 2. Estado general

La Fase 1 — Arquitectura y Fundamentos permanece cerrada. La Fase 2 — Ejecución y Lanzamiento continúa activa para completar el lanzamiento Mobile.

Web/API y AUTH-DELETE-01/02 están operativos/cerrados. `CF-SEARCH-001` y `CF-SEARCH-002` están mergeados y desplegados; Web fue validada visualmente para consultas con concentración.

**PreciosFarma Mobile 1.4.2 / versionCode 34 está actualmente en revisión de Google Play dentro de Closed Testing `Test ComparaFarma`.** El AAB fue verificado y autorizado explícitamente para ese canal. El Resumen de publicación mostró un único cambio correspondiente al lanzamiento completo de PreciosFarma 1.4.2 en la prueba cerrada.

Google Play Producción continúa **Inactiva**. La autorización de vc34 fue exclusivamente para Closed Testing y no constituye autorización de Producción.

`CF-WEB-001 — Responsive Layout & Text Overflow` fue mergeado vía PR #136 y desplegado; el alcance principal está cerrado. Queda `CF-WEB-001-FU1 — Mobile Price History Chart Readability — P2` como follow-up no bloqueante.

`ACCOUNT-UX-01` está implementado y validado en branch propia, con PR #138 abierto. Es trabajo posterior al AAB vc34 y no debe considerarse incorporado al build actualmente en revisión.

Estado operativo: **`VC34_GOOGLE_PLAY_REVIEW_AWAITING_PHYSICAL_CERTIFICATION`**.

---

## 3. Sprint actual

**Production Release 1.0 — cierre operacional.**

El próximo gate del release es:

**Aprobación vc34 en Closed Testing → instalación desde Google Play → certificación física de búsquedas/identidad → resolución de listing/política de privacidad → decisión explícita GO/NO-GO a Producción.**

No se promueve ninguna versión a Producción por la sola aprobación de Google Play.

---

## 4. Estado por área

| Área | Estado | Resumen |
|---|---|---|
| Web/API | 🟢 Producción | Operativas; CF-SEARCH-001/002 desplegados. |
| Responsive Web | 🟢 Cerrado | CF-WEB-001 mergeado PR #136 y desplegado. FU1 gráfico histórico móvil queda P2. |
| Account deletion | 🟢 Cerrado | AUTH-DELETE-01/02 cerrados y validados. |
| Mobile vc33 | 🟢 Closed Testing | 1.4.1/vc33 aprobado, disponible e instalado desde Google Play. |
| Mobile vc34 | ⏳ En revisión | 1.4.2/vc34 subido a `Test ComparaFarma`; Google Play revisando. |
| QA físico vc34 | ⏳ Pendiente | Comienza después de aprobación/disponibilidad de vc34 en Play. |
| Google Play Producción | ⚪ Inactiva | Sin GO de Producción. |
| Account UX | 🟡 PR abierto | ACCOUNT-UX-01 PR #138; posterior a vc34 y fuera del AAB actual. |
| Bioequivalence data quality | 🟡 Documentado / gateado | Option D/tri-state no implementado. |
| Gobierno documental | 🟢 Reconciliado | Board/Sprint y actas actualizados al 2026-08-30. |

---

## 5. Evidencia clave

- CF-SEARCH-001: PR #132, mergeado a `origin/main`.
- CF-SEARCH-002: PR #133, mergeado a `origin/main`; base vc34 `f59a4daaa3635da66a8fedc7101540560e86e8c8`.
- Web smoke: `ibuprofeno 600 mg` prioriza 600 mg por sobre 400/200 mg.
- vc34: PreciosFarma 1.4.2 / versionCode 34; targetSdk 36; minSdk 24.
- SHA-256 vc34: `a5c3daf50ce3d3e05f55e898ac86e03b6c9faffd1369f742d12083c8248a2461`.
- Firma vc34: `jar verified`, mismo lineage/certificado que vc33.
- Google Play: vc34 enviado a revisión exclusivamente en `Prueba cerrada - Test ComparaFarma`; Producción no incluida.
- CF-WEB-001: PR #136 mergeado; merge SHA `ce442ec4d31eb119ef0f7102936fde30fe3a465c`; deploy confirmado.
- ACCOUNT-UX-01: PR #138 abierto; head `2edc750c55c3918c7ce400cf65638a3166a9e7bd`; 48/48 tests Mobile reportados, typecheck limpio.

---

## 6. Cambios en Google Play

### Estado actual vc34

El envío actualmente en revisión contiene **solo Closed Testing**:

1. `Prueba cerrada - Test ComparaFarma`.
2. Release `PreciosFarma 1.4.2` / versionCode 34.
3. `Iniciar lanzamiento completo` dentro de ese track.

No hay autorización de Producción asociada a ese envío.

### Pendientes pre-Producción

Antes de cualquier GO a Producción deben resolverse explícitamente:

- nombre público de la ficha Play: confirmar/cambiar `ComparaFarma → PreciosFarma`;
- URL de política de privacidad: confirmar que apunta al dominio vigente de PreciosFarma;
- certificación física de vc34 sin defectos P0/P1;
- autorización explícita del Founder.

---

## 7. Riesgos / warnings

| Tema | Severidad | Tratamiento |
|---|---|---|
| Nombre público Play aún no confirmado como PreciosFarma | Alta pre-release | Resolver antes de Producción. |
| URL de política de privacidad Play pendiente de confirmación | Alta pre-release | Verificar/corregir antes de Producción. |
| vc34 aún en revisión | Gate operativo | Esperar aprobación; no sustituir con vc33 para certificar CF-SEARCH-002 Mobile. |
| R8/ProGuard mapping ausente | Baja | Warning Play no bloqueante. |
| Sentry DSN | Baja/Media observabilidad | Revalidar para builds futuros. |
| Mobile Jest fuera de CI | Media ingeniería | Backlog técnico. |
| E2E responsive dependen de API/scrapers reales | Media ingeniería | Mantener fuera de CI bloqueante por ahora. |
| Checkout principal atrasado/dirty | Media operativa | No usar para integración/release; usar worktrees. |
| Bioequivalence semántica | Media producto/datos | Option D sigue pendiente; no afirmar cierre. |

---

## 8. Prioridad única inmediata

**Esperar la resolución de Google Play para vc34.** Cuando quede aprobada/disponible, instalar desde Play y ejecutar la matriz física de certificación de Search/Product Identity.

En paralelo puede cerrarse trabajo no incluido en el artefacto vc34, como ACCOUNT-UX-01, siempre que no implique reconstruir ni alterar el release actualmente en revisión.

---

## 9. Próximo hito

**VC34 CLOSED TESTING APPROVED → PHYSICAL CERTIFICATION → PRODUCTION READINESS CHECK → GO/NO-GO.**

Matriz mínima de certificación Mobile:

- `omeprazol`
- `esomeprazol`
- `ibuprofeno`
- `ibuprofeno 200 mg`
- `ibuprofeno 400 mg`
- `ibuprofeno 600 mg`
- inmediatamente después: `ibuprofeno` sin concentración
- `paracetamol 500 mg x16`
- `Tapsin`
- `losartan 50 mg`
- `losartan + HCTZ`
- smoke de navegación/identidad de presentación

---

## 10. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.5 | 2026-08-25 | BIOEQUIVALENCE-DATA-QUALITY-01 documentado y gateado; Google Play vc33 mantenido como prioridad. |
| 1.6 | 2026-08-29 | vc33 aprobado en Closed Testing; vc34 registrado como generado y aún pendiente de autorización. |
| 1.7 | 2026-08-30 | Estado reconciliado: vc34 autorizado exclusivamente para Closed Testing, subido y en revisión; Producción inactiva. CF-WEB-001 PR #136 mergeado/desplegado. ACCOUNT-UX-01 PR #138 abierto y fuera de vc34. Próximo gate: aprobación vc34 + certificación física + resolución de listing/política de privacidad + GO explícito. |
