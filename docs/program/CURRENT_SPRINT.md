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
| **Versión** | 1.4 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / CTO |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Documento de Ejecución de Programa |
| **Fuente Oficial** | Este documento, para el sprint activo actual |
| **Última actualización** | 2026-08-25 |
| **Pregunta que responde** | ¿Qué se está haciendo exactamente ahora mismo? |

---

## 2. Sprint activo

### Production Release 1.0 — cierre operacional

**Estado:** 🟡 Activo — esperando revisión de Google Play.

Web/API y los frentes AUTH-DELETE-01/02 permanecen cerrados. El release Mobile **PreciosFarma 1.4.1 / versionCode 33** fue construido desde `origin/main` con el fix del PR #113, firmado con la key de release correcta, aceptado por Google Play y enviado a revisión en **Prueba cerrada — Test ComparaFarma**.

Estado operativo: **`WAITING_FOR_GOOGLE_PLAY_REVIEW`**.

Durante la espera se cerró únicamente trabajo de diagnóstico/gobernanza sobre `BIOEQUIVALENCE-DATA-QUALITY-01`. La iniciativa quedó documentada en `MASTER_BACKLOG.md` y su Gate 2 quedó formalizado, pero **la implementación continúa explícitamente gateada por vc33 y no forma parte del sprint activo**.

---

## 3. Evidencia Mobile

| Entregable | Estado | Evidencia |
|---|---|---|
| Fix test dentro de Expo Router | ✅ Mergeado | PR #113; commit `bd85446`; incluido en `origin/main` `f0e807e` |
| Mobile tests | ✅ | 16/16 PASS |
| Mobile typecheck | ✅ | Limpio |
| AAB PreciosFarma 1.4.1 vc33 | ✅ | SHA-256 `ea972f90938539df2b81f2dcd59dcf2a11ca728b11755d7cc42bcf03ae3df3fe` |
| Firma release | ✅ | `jarsigner`: jar verified; certificado coincide con referencia |
| targetSdk | ✅ | 36 |
| Upload Google Play | ✅ | Procesado sin errores |
| Closed Testing vc33 | ⏳ | En revisión |
| Data Safety | ⏳ | En revisión |
| Producción Mobile | ⚪ | Inactiva; no publicada en esta sesión |

Acta detallada del release: `docs/archive/meetings/20260823_mobile_release.md`.

---

## 4. Trabajo activo / pendiente

1. **Esperar revisión Google Play.** No modificar el release mientras vc33 esté en revisión.
2. Cuando sea aprobado, confirmar que **1.4.1/vc33** está disponible para testers e instalar/actualizar desde Google Play en un teléfono real.
3. Ejecutar smoke test físico: apertura, búsqueda, comparación de precios, login/logout y eliminación de cuenta.
4. Si no existen defectos P0/P1, tomar decisión GO/NO-GO y avanzar a Producción.
5. Registrar el resultado y cerrar formalmente `Production Release 1.0` cuando Mobile esté efectivamente publicado y validado.

`BIOEQUIVALENCE-DATA-QUALITY-01` no entra en ejecución hasta que este gate de vc33 quede cerrado. Su próximo paso, cuando sea habilitado, será la implementación controlada de la corrección semántica y la arquitectura de agrupación ya documentadas.

---

## 5. Warnings no bloqueantes

- `EXPO_PUBLIC_SENTRY_DSN` ausente en el entorno usado para el build vc33.
- Build local requirió ampliar temporalmente Metaspace de Gradle.
- Tests Jest Mobile no tienen job explícito en CI.
- Play Console advierte ausencia de archivo de desofuscación R8/ProGuard.
- Publicación gestionada está desactivada; observar el efecto de la aprobación de Google sobre los cambios enviados.
- Checkout principal local atrasado/dirty: no usar para releases/integraciones; continuar con worktrees limpios.

---

## 6. Criterio de término

`Production Release 1.0` se cierra cuando:

- vc33 haya terminado la revisión de Google Play;
- el build aprobado se haya probado desde Google Play en dispositivo físico;
- no haya P0/P1 abiertos;
- Mobile haya sido promovido/publicado en Producción;
- estado final quede registrado en acta, `PROGRAM_BOARD.md`, `DONE.md` y `MILESTONES.md`.

---

## 7. Gobierno

No iniciar automáticamente nuevas épicas durante la espera de revisión. AUTH-DELETE-01/02, Product Identity y el build vc33 no se reabren salvo incidente real.

`BIOEQUIVALENCE-DATA-QUALITY-01` está **DOCUMENTED_AND_BACKLOGGED / IMPLEMENTATION_GATED_BY_MOBILE_VC33**. Sus decisiones de Gate 2 no se reabren sin evidencia nueva y ningún paso de implementación a partir del adapter fix está autorizado mientras vc33 siga en revisión.

---

## 8. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.2 | 2026-08-23 | Reconciliación post Product Identity + Account Deletion; sprint mantenido en cierre operacional. |
| 1.3 | 2026-08-23 | Estado Mobile reconciliado con evidencia directa: AAB vc33 construido/firmado, PR #113 incluido, upload aceptado y release/Data Safety enviados a revisión en Google Play Closed Testing. |
| 1.4 | 2026-08-25 | Cierre de sesión: `BIOEQUIVALENCE-DATA-QUALITY-01` documentado y mergeado en backlog, sin entrar al sprint; se reafirma `WAITING_FOR_GOOGLE_PLAY_REVIEW` como único gate operativo activo. |
