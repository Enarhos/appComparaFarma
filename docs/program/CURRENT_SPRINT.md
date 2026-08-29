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
| **Versión** | 1.7 |
| **Propietario** | CEO / CTO |
| **Rol asumido en su redacción** | Enterprise Program Manager / CTO |
| **Nivel de Gobierno** | De decisión operativa |
| **Clasificación** | Documento de Ejecución de Programa |
| **Fuente Oficial** | Este documento, para el sprint activo actual |
| **Última actualización** | 2026-08-29 |
| **Pregunta que responde** | ¿Qué se está haciendo exactamente ahora mismo? |

---

## 2. Sprint activo

### Production Release 1.0 — cierre operacional

**Estado:** 🟡 Activo — vc33 aprobada por Google Play; pendiente smoke test físico y decisión GO/NO-GO a Producción.

Web/API y los frentes AUTH-DELETE-01/02 permanecen cerrados. El release Mobile **PreciosFarma 1.4.1 / versionCode 33** fue construido desde `origin/main` con el fix del PR #113, firmado con la key de release correcta, aceptado por Google Play, enviado a revisión en **Prueba cerrada — Test ComparaFarma** y **ya APROBADO por Google Play** (confirmado por Mario vía verificación directa en Play Console): publicado en ese canal, disponible para los testers, **no promovido a Producción**.

Estado operativo: **`CLOSED_TESTING_APPROVED_AWAITING_SMOKE_TEST_AND_PRODUCTION_DECISION`** (reemplaza a `WAITING_FOR_GOOGLE_PLAY_REVIEW`, gate cumplido).

Además, ya existe generado y verificado localmente el AAB release candidate **PreciosFarma 1.4.2 / versionCode 34** (incorpora `CF-SEARCH-001` y `CF-SEARCH-002`, ya mergeados a `origin/main` vía PR #132 y #133), en branch/worktree aislada `release/mobile-1.4.2-vc34`, con firma del mismo lineage de release que vc33 y tests en verde. **No fue subido a Google Play**; queda pendiente de decisión explícita de Mario para iniciar el envío a Closed Testing.

Durante la espera se cerró únicamente trabajo de diagnóstico/gobernanza sobre `BIOEQUIVALENCE-DATA-QUALITY-01`. La iniciativa quedó documentada en `MASTER_BACKLOG.md` y su Gate 2 quedó formalizado, pero **la implementación continúa explícitamente gateada por vc33 y no forma parte del sprint activo**.

`CF-SEARCH-001` (identidad de producto: falso merge de variantes comerciales, navegación por clave no única en Mobile e integridad de oferta en `mergeDuplicates`) — implementado y testeado en `fix/cf-search-001-product-identity` — quedó **mergeado a `origin/main` vía PR #132**. `CF-SEARCH-002` (intención de consulta y relevancia) quedó **mergeado a `origin/main` vía PR #133**. El SHA `f59a4da`, usado como base del AAB release candidate 1.4.2/vc34, es ancestro confirmado de ambos merges. La Web ya desplegada en producción fue validada visualmente para la consulta "ibuprofeno 600 mg": los resultados de 600 mg aparecen priorizados antes que los de 400/200 mg. Ninguno de los dos ítems es parte del release Mobile vc33 (ya aprobado por Google Play) ni lo bloquea.

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
| Closed Testing vc33 | ✅ | Aprobado por Google Play; publicado en `Test ComparaFarma`, disponible para testers |
| Data Safety | ✅ | Aprobado junto al release |
| Producción Mobile | ⚪ | Inactiva; vc33 no promovida — decisión GO/NO-GO pendiente |

Acta detallada del release: `docs/archive/meetings/20260823_mobile_release.md`.

---

## 4. Trabajo activo / pendiente

1. ~~Esperar revisión Google Play.~~ **Cumplido:** Google Play aprobó vc33.
2. Confirmar que **1.4.1/vc33** está disponible para testers e instalar/actualizar desde Google Play en un teléfono real.
3. Ejecutar smoke test físico: apertura, búsqueda, comparación de precios, login/logout y eliminación de cuenta.
4. Si no existen defectos P0/P1, tomar decisión GO/NO-GO y avanzar a Producción.
5. Registrar el resultado y cerrar formalmente `Production Release 1.0` cuando Mobile esté efectivamente publicado y validado.
6. Decisión separada y explícita de Mario: si/cuándo subir el AAB release candidate 1.4.2/vc34 (ya generado y verificado localmente) a Closed Testing. No se sube sin esa autorización.

`BIOEQUIVALENCE-DATA-QUALITY-01` no entra en ejecución hasta que este gate de vc33 quede cerrado. Su próximo paso, cuando sea habilitado, será la implementación controlada de la corrección semántica y la arquitectura de agrupación ya documentadas.

`CF-SEARCH-001` y `CF-SEARCH-002` ya están mergeados a `origin/main` (PR #132 y #133 respectivamente); su FOLLOW_UP (migración de `matchKey` no único en favoritos/carrito/alertas/historial de Mobile) queda registrado en `MASTER_BACKLOG.md` sin implementar, a la espera de decisión de producto.

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

- vc33 haya terminado la revisión de Google Play (✅ cumplido: aprobado);
- el build aprobado se haya probado desde Google Play en dispositivo físico;
- no haya P0/P1 abiertos;
- Mobile haya sido promovido/publicado en Producción;
- estado final quede registrado en acta, `PROGRAM_BOARD.md`, `DONE.md` y `MILESTONES.md`.

---

## 7. Gobierno

El gate de espera de revisión de Google Play quedó cumplido (vc33 aprobado). No iniciar automáticamente nuevas épicas hasta el cierre formal de `Production Release 1.0`. AUTH-DELETE-01/02, Product Identity y el build vc33 no se reabren salvo incidente real.

La promoción de vc33 a Producción requiere decisión GO/NO-GO explícita, respaldada por el smoke test físico — no se asume por la sola aprobación de Google Play. La subida del release candidate 1.4.2/vc34 a Closed Testing requiere decisión explícita separada de Mario; no está autorizada por esta reconciliación.

`BIOEQUIVALENCE-DATA-QUALITY-01` está **DOCUMENTED_AND_BACKLOGGED / IMPLEMENTATION_GATED_BY_MOBILE_VC33**. Sus decisiones de Gate 2 no se reabren sin evidencia nueva y ningún paso de implementación a partir del adapter fix está autorizado mientras el gate vc33 (smoke test físico + decisión GO/NO-GO a Producción) siga abierto.

`CF-SEARCH-001` y `CF-SEARCH-002` están **MERGED_TO_MAIN** (PR #132 y #133 respectivamente, confirmados en `origin/main`). No se reabre el diseño; el FOLLOW_UP de claves persistidas en Mobile no se implementa sin decisión explícita de Mario/ChatGPT.

---

## 8. Control de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 1.2 | 2026-08-23 | Reconciliación post Product Identity + Account Deletion; sprint mantenido en cierre operacional. |
| 1.3 | 2026-08-23 | Estado Mobile reconciliado con evidencia directa: AAB vc33 construido/firmado, PR #113 incluido, upload aceptado y release/Data Safety enviados a revisión en Google Play Closed Testing. |
| 1.4 | 2026-08-25 | Cierre de sesión: `BIOEQUIVALENCE-DATA-QUALITY-01` documentado y mergeado en backlog, sin entrar al sprint; se reafirma `WAITING_FOR_GOOGLE_PLAY_REVIEW` como único gate operativo activo. |
| 1.5 | 2026-08-27 | Referencia de `CF-SEARCH-001` (identidad de producto y deduplicación segura): implementado y testeado en branch propia, pendiente de PR/review, no mergeado a `origin/main`; no bloquea ni forma parte del release Mobile vc33. FOLLOW_UP de claves persistidas en Mobile referenciado, pendiente de decisión de producto. |
| 1.6 | 2026-08-29 | Google Play aprobó vc33: publicado en Closed Testing `Test ComparaFarma`, disponible para testers, NO promovido a Producción (confirmado por Mario vía Play Console). Se retira `WAITING_FOR_GOOGLE_PLAY_REVIEW` (gate cumplido); pendiente ahora smoke test físico + decisión GO/NO-GO. Se registra la existencia del AAB release candidate 1.4.2/versionCode 34 (CF-SEARCH-001 + CF-SEARCH-002), generado y verificado localmente, pendiente de decisión explícita de Mario para subir a Closed Testing — sin autorizarlo en esta reconciliación. |
| 1.7 | 2026-08-29 | Corrección: `CF-SEARCH-001` (PR #132) y `CF-SEARCH-002` (PR #133) ya están **mergeados a `origin/main`** — quedan referencias residuales de "pendiente de PR/review" corregidas en §2, §4 y §7. Se registra que el SHA `f59a4da` (base del AAB vc34) es ancestro confirmado de ambos merges, y que la Web ya desplegada fue validada visualmente para "ibuprofeno 600 mg" (prioriza correctamente 600mg sobre 400/200mg). No cambia el estado de Producción Mobile ni la decisión pendiente de subir vc34 a Closed Testing, que siguen abiertos. |
