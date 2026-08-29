# PROGRAM_BOARD — ComparaFarma

**Este es el documento con el que debe empezar toda sesión de trabajo.** Vista ejecutiva del estado real del programa.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BRD-001 |
| **Nombre** | PROGRAM_BOARD.md |
| **Estado** | Activo |
| **Versión** | 1.6 |
| **Propietario** | CEO / CTO |
| **Última actualización** | 2026-08-29 |

---

## 2. Estado general

La Fase 1 — Arquitectura y Fundamentos permanece cerrada. La Fase 2 — Ejecución y Lanzamiento continúa activa únicamente para completar el lanzamiento Mobile.

Web/API, Product Identity y AUTH-DELETE-01/02 están cerrados. La incertidumbre sobre el estado de Google Play quedó resuelta mediante verificación directa en Play Console.

**PreciosFarma Mobile 1.4.1 / versionCode 33 fue APROBADA por Google Play y está publicada en el canal de Prueba cerrada — "Test ComparaFarma", disponible para los testers.**

Producción Mobile continúa **Inactiva**. La aprobación cierra el gate de revisión, pero vc33 **NO fue promovida a Producción** — esa es una decisión de negocio separada y explícita, todavía pendiente.

Ya existe un AAB release candidate **PreciosFarma 1.4.2 / versionCode 34** (incorpora `CF-SEARCH-001` y `CF-SEARCH-002`, ya mergeados a `origin/main`), generado y verificado localmente en branch/worktree aislada (`release/mobile-1.4.2-vc34`), con firma del mismo lineage de release que vc33 y tests en verde. **No fue subido a Google Play** — queda pendiente de decisión explícita de Mario para iniciar el envío a Closed Testing.

Estado operativo: **`CLOSED_TESTING_APPROVED_AWAITING_SMOKE_TEST_AND_PRODUCTION_DECISION`** (reemplaza a `WAITING_FOR_GOOGLE_PLAY_REVIEW`, que ya se cumplió).

Durante la espera se diagnosticó y gobernó `BIOEQUIVALENCE-DATA-QUALITY-01`. Sus decisiones de arquitectura quedaron registradas en backlog y actas, pero **no se inició implementación**. El ítem permanece fuera del sprint hasta cerrar el gate Mobile vc33.

---

## 3. Sprint actual

**Production Release 1.0 — cierre operacional.**

Google ya aprobó vc33 (gate cumplido). El siguiente gate no es otro desarrollo ni otra auditoría del AAB. Es:

**Instalación desde Play por tester → smoke test físico → decisión GO/NO-GO a Producción.**

La subida de vc34 (1.4.2) a Closed Testing es un ítem aparte, no forma parte de este gate, y requiere decisión explícita separada de Mario.

---

## 4. Estado por área

| Área | Estado | Resumen |
|---|---|---|
| Web/API | 🟢 Producción | Operativas; no reabrir salvo incidente. |
| Account deletion | 🟢 Cerrado | AUTH-DELETE-01/02 cerrados y validados. |
| Mobile build | 🟢 Listo | 1.4.1/vc33, targetSdk 36, firma release verificada. |
| Google Play Closed Testing | 🟢 Aprobado / publicado | vc33 aprobada por Google Play, disponible en `Test ComparaFarma` para testers. |
| Data Safety | 🟢 Aprobado | Cuestionario actualizado aprobado junto al release. |
| Google Play Producción | ⚪ Inactiva | vc33 no promovida; decisión de negocio separada, pendiente. |
| QA físico Mobile | ⏳ Pendiente | vc33 ya disponible para testers; ejecutar smoke test físico ahora. |
| Mobile release candidate | 🟡 Generado, no subido | 1.4.2/vc34 (CF-SEARCH-001 + CF-SEARCH-002) generado y verificado localmente; pendiente decisión de Mario para subir a Closed Testing. |
| Bioequivalence data quality | 🟡 Documentado / gateado | Gate 1 y Gate 2 cerrados; decisiones V-1/V-2/W-1 registradas; implementación espera cierre vc33. |
| Gobierno documental | 🟢 Reconciliado para el gate actual | Sprint, Board, Backlog y actas alineados al cierre de sesión. |

---

## 5. Evidencia clave

- `origin/main` del build final: `f0e807e0a5b1e68782a881c95a89364753626741`.
- PR #113 / `bd85446`: fix de ubicación de test Expo Router incluido.
- Mobile tests: 16/16 PASS.
- AAB: PreciosFarma 1.4.1 / vc33.
- SHA-256: `ea972f90938539df2b81f2dcd59dcf2a11ca728b11755d7cc42bcf03ae3df3fe`.
- Firma: `jar verified`; certificado coincide con referencia.
- Google Play: AAB procesado sin errores; release aprobado y publicado en Closed Testing `Test ComparaFarma` (confirmado por Mario vía verificación directa en Play Console).
- Acta Mobile: `docs/archive/meetings/20260823_mobile_release.md`.
- AAB release candidate 1.4.2/vc34: generado localmente en `release/mobile-1.4.2-vc34`, incorpora CF-SEARCH-001 (PR #132) y CF-SEARCH-002 (PR #133), sin subir a Google Play.
- `BIOEQUIVALENCE-DATA-QUALITY-01`: Gate 1 `docs/archive/meetings/20260825.md`; Gate 2 `docs/archive/meetings/20260825 - 1013PM.md`.
- PR #125 mergeado a `main`: backlog + acta Gate 2 formalizados.

---

## 6. Cambios enviados a Google Play

El envío, ya **aprobado por Google Play**, contenía:

1. Producción → Países/Territorios → añadir Chile.
2. Prueba cerrada `Test ComparaFarma` → PreciosFarma 1.4.1 → iniciar lanzamiento completo.
3. Data Safety → cuestionario actualizado.

La aprobación no activó Producción por sí sola. vc33 queda disponible para los testers en el canal `Test ComparaFarma`; Producción permanece inactiva hasta una decisión GO/NO-GO explícita.

---

## 7. Riesgos / warnings

| Tema | Severidad | Tratamiento |
|---|---|---|
| Publicación gestionada desactivada | Media operativa | Google ya aprobó vc33; revisar el efecto real de esta configuración sobre la disponibilidad en `Test ComparaFarma` (ya verificado por Mario) y sobre una futura promoción a Producción. |
| Sentry DSN ausente en build vc33 | Baja/Media observabilidad | Evaluar antes del siguiente build; no bloqueó vc33. |
| Metaspace Gradle | Baja/Media build | Formalizar configuración si vuelve a ocurrir. |
| Mobile Jest fuera de CI | Media ingeniería | Backlog técnico; no bloquea revisión actual. |
| Falta mapping R8/ProGuard | Baja | Warning Play no bloqueante; evaluar observabilidad de crashes. |
| Checkout principal atrasado/dirty | Media operativa | No usar para integración/release; worktrees limpios. |
| Calidad semántica de bioequivalencia | Media producto/datos | Diseño cerrado; implementación gateada para evitar mezclar cambios con release vc33. |

---

## 8. Prioridad única inmediata

**Google ya aprobó vc33 — ese gate quedó cumplido.** La prioridad inmediata pasa a ser: instalar vc33 desde Google Play en un teléfono real y ejecutar el smoke test físico, para habilitar la decisión GO/NO-GO a Producción.

Restricciones que se mantienen, por motivos independientes al gate de revisión ya cumplido:

- **No promover vc33 (ni ninguna versión) a Producción** sin decisión GO/NO-GO explícita separada, respaldada por el smoke test físico.
- **No subir el AAB 1.4.2/vc34** a Closed Testing sin autorización explícita de Mario — el release candidate ya existe generado localmente, pero esta reconciliación no constituye esa autorización.
- No iniciar la implementación de `BIOEQUIVALENCE-DATA-QUALITY-01` hasta el cierre formal de `Production Release 1.0`.

---

## 9. Próximo hito

**PHYSICAL SMOKE TEST (vc33 ya aprobado en Closed Testing) → PRODUCTION GO/NO-GO.**

En paralelo, decisión pendiente de Mario sobre subir el release candidate 1.4.2/vc34 a Closed Testing (no bloquea ni depende del GO/NO-GO de vc33 a Producción).

Después del cierre formal del release vc33 en Producción (o de la decisión de no promoverlo), `BIOEQUIVALENCE-DATA-QUALITY-01` vuelve a quedar disponible para decisión de entrada a sprint, comenzando por la secuencia aprobada en Gate 2.

---

## 10. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.3 | 2026-08-23 | Reconciliación post Product Identity + Account Deletion; Google Play aún por verificar. |
| 1.4 | 2026-08-23 | Google Play verificado: vc33 construido, firmado, aceptado y enviado a Closed Testing; Data Safety en revisión; Producción permanece inactiva. |
| 1.5 | 2026-08-25 | Cierre de sesión: BIOEQUIVALENCE-DATA-QUALITY-01 documentado y mergeado en backlog, sin implementación; se mantiene Google Play vc33 como única prioridad operativa inmediata. |
| 1.6 | 2026-08-29 | Google Play aprobó vc33: publicada en Closed Testing `Test ComparaFarma`, disponible para testers, NO promovida a Producción (confirmado por Mario vía Play Console). Se retira el estado `WAITING_FOR_GOOGLE_PLAY_REVIEW` (gate cumplido); nueva prioridad es smoke test físico + decisión GO/NO-GO. Se registra la existencia del AAB release candidate 1.4.2/versionCode 34 (CF-SEARCH-001 + CF-SEARCH-002), generado y verificado localmente, pendiente de decisión explícita de Mario para subir a Closed Testing — sin autorizarlo en esta reconciliación. |
