# PROGRAM_BOARD — ComparaFarma

**Este es el documento con el que debe empezar toda sesión de trabajo.** Vista ejecutiva del estado real del programa.

---

## 1. Metadata

| Campo | Valor |
|---|---|
| **Código** | PRG-BRD-001 |
| **Nombre** | PROGRAM_BOARD.md |
| **Estado** | Activo |
| **Versión** | 1.5 |
| **Propietario** | CEO / CTO |
| **Última actualización** | 2026-08-25 |

---

## 2. Estado general

La Fase 1 — Arquitectura y Fundamentos permanece cerrada. La Fase 2 — Ejecución y Lanzamiento continúa activa únicamente para completar el lanzamiento Mobile.

Web/API, Product Identity y AUTH-DELETE-01/02 están cerrados. La incertidumbre sobre el estado de Google Play quedó resuelta mediante verificación directa en Play Console.

**PreciosFarma Mobile 1.4.1 / versionCode 33 está actualmente EN REVISIÓN en Prueba cerrada — Test ComparaFarma.**

Producción Mobile continúa **Inactiva**. No se ha publicado vc33 en Producción.

Estado operativo: **`WAITING_FOR_GOOGLE_PLAY_REVIEW`**.

Durante la espera se diagnosticó y gobernó `BIOEQUIVALENCE-DATA-QUALITY-01`. Sus decisiones de arquitectura quedaron registradas en backlog y actas, pero **no se inició implementación**. El ítem permanece fuera del sprint hasta cerrar el gate Mobile vc33.

---

## 3. Sprint actual

**Production Release 1.0 — cierre operacional.**

El siguiente gate no es otro desarrollo ni otra auditoría del AAB. Es:

**Google aprueba vc33 → instalación desde Play por tester → smoke test físico → decisión GO/NO-GO a Producción.**

---

## 4. Estado por área

| Área | Estado | Resumen |
|---|---|---|
| Web/API | 🟢 Producción | Operativas; no reabrir salvo incidente. |
| Account deletion | 🟢 Cerrado | AUTH-DELETE-01/02 cerrados y validados. |
| Mobile build | 🟢 Listo | 1.4.1/vc33, targetSdk 36, firma release verificada. |
| Google Play Closed Testing | 🟡 En revisión | vc33 enviado a `Test ComparaFarma`. |
| Data Safety | 🟡 En revisión | Cuestionario actualizado enviado junto al release. |
| Google Play Producción | ⚪ Inactiva | No se publicó release nuevo. |
| QA físico Mobile | ⏳ Pendiente | Ejecutar tras disponibilidad de vc33 para testers. |
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
- Google Play: AAB procesado sin errores, release enviado a revisión.
- Acta Mobile: `docs/archive/meetings/20260823_mobile_release.md`.
- `BIOEQUIVALENCE-DATA-QUALITY-01`: Gate 1 `docs/archive/meetings/20260825.md`; Gate 2 `docs/archive/meetings/20260825 - 1013PM.md`.
- PR #125 mergeado a `main`: backlog + acta Gate 2 formalizados.

---

## 6. Cambios enviados a Google Play

El envío actualmente en revisión contiene:

1. Producción → Países/Territorios → añadir Chile.
2. Prueba cerrada `Test ComparaFarma` → PreciosFarma 1.4.1 → iniciar lanzamiento completo.
3. Data Safety → cuestionario actualizado.

El envío no activó Producción. La versión anterior vc31 continúa disponible a testers mientras vc33 está en revisión.

---

## 7. Riesgos / warnings

| Tema | Severidad | Tratamiento |
|---|---|---|
| Publicación gestionada desactivada | Media operativa | Revisar estado inmediatamente después de aprobación de Google. |
| Sentry DSN ausente en build vc33 | Baja/Media observabilidad | Evaluar antes del siguiente build; no bloqueó vc33. |
| Metaspace Gradle | Baja/Media build | Formalizar configuración si vuelve a ocurrir. |
| Mobile Jest fuera de CI | Media ingeniería | Backlog técnico; no bloquea revisión actual. |
| Falta mapping R8/ProGuard | Baja | Warning Play no bloqueante; evaluar observabilidad de crashes. |
| Checkout principal atrasado/dirty | Media operativa | No usar para integración/release; worktrees limpios. |
| Calidad semántica de bioequivalencia | Media producto/datos | Diseño cerrado; implementación gateada para evitar mezclar cambios con release vc33. |

---

## 8. Prioridad única inmediata

**Esperar la revisión de Google Play.**

No subir otro AAB, no cambiar versionCode, no tocar Producción y no iniciar la implementación de `BIOEQUIVALENCE-DATA-QUALITY-01` durante este gate.

Al cambiar el estado de Play Console, verificar vc33 en Closed Testing y realizar smoke test en teléfono real.

---

## 9. Próximo hito

**MOBILE VC33 CLOSED TESTING APPROVED + PHYSICAL SMOKE TEST → PRODUCTION GO/NO-GO.**

Después del cierre formal del release vc33, `BIOEQUIVALENCE-DATA-QUALITY-01` vuelve a quedar disponible para decisión de entrada a sprint, comenzando por la secuencia aprobada en Gate 2.

---

## 10. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.3 | 2026-08-23 | Reconciliación post Product Identity + Account Deletion; Google Play aún por verificar. |
| 1.4 | 2026-08-23 | Google Play verificado: vc33 construido, firmado, aceptado y enviado a Closed Testing; Data Safety en revisión; Producción permanece inactiva. |
| 1.5 | 2026-08-25 | Cierre de sesión: BIOEQUIVALENCE-DATA-QUALITY-01 documentado y mergeado en backlog, sin implementación; se mantiene Google Play vc33 como única prioridad operativa inmediata. |
