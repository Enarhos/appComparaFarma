# CF-107 — Snapshots de contrato para `matchKey`

| Campo | Valor |
|---|---|
| **ID** | CF-107 |
| **Épica** | Shared Domain Package |
| **Estado** | ✅ Implementado (verificado 2026-08-15) |
| **Prioridad** | Alta |
| **Estimación** | 45 minutos |
| **Referencia** | RFC-001 §10.1 (`contract.test.ts`) |

---

## Objetivo

Crear `packages/domain/src/__tests__/contract.test.ts` con snapshot tests que fijan el comportamiento de `matchKey` para nombres de medicamentos reales tomados de los fixtures del backend. Cualquier cambio futuro a `matchKey` — intencional o accidental — rompe el snapshot y exige una actualización explícita. Este archivo es la red de seguridad permanente contra divergencias silenciosas.

Los tests unitarios de cada submódulo (`matching.test.ts`, `normalization.test.ts`, `pricing.test.ts`, `deduplication.test.ts`) se crean junto a su submódulo correspondiente (CF-103, CF-104, CF-105, CF-106).

---

## Alcance

### Incluye

- Crear `packages/domain/src/__tests__/contract.test.ts` con:
  - Mínimo 4 nombres de medicamentos reales, tomados de fixtures existentes en `api/src/__tests__/` (cruzverde, salcobrand, drsimi)
  - Para cada nombre: `expect(matchKey(product.name)).toMatchSnapshot()`
  - Los snapshots generados committeados junto al código

- Generar los snapshots en la primera ejecución:
  ```bash
  pnpm --filter @comparafarma/domain test -- --update-snapshots
  ```
  Verificar que el directorio `__tests__/__snapshots__/contract.test.ts.snap` existe y está committeado.

### No incluye

- Tests unitarios de `matching`, `normalization`, `pricing` o `deduplication` — esos van en CF-103 a CF-106
- Modificar ningún archivo de código fuente
- Crear fixtures nuevos — usar los existentes en `api/src/__tests__/`

---

## Criterios de aceptación

1. Existe `packages/domain/src/__tests__/contract.test.ts`.
2. El archivo contiene ≥ 4 assertions `toMatchSnapshot()` con nombres de medicamentos reales.
3. El archivo de snapshots `__snapshots__/contract.test.ts.snap` existe y está committeado en el repositorio.
4. `pnpm --filter @comparafarma/domain test` pasa con 0 fallos.
5. Si se modifica `matchKey` y se vuelve a ejecutar el test sin `--update-snapshots`, el test falla con un diff visible.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-103 | Necesita `matchKey()` implementada y testeada |
| Bloqueado por | CF-104 | Todos los submódulos deben estar listos antes de los snapshots |
| Bloqueado por | CF-105 | Ídem |
| Bloqueado por | CF-106 | Ídem |
| Bloquea | CF-109 | La limpieza final requiere que los snapshots de contrato existan |

---

## Notas técnicas

- Los snapshots tienen valor solo si están committeados. Un snapshot sin commitear es equivalente a no tener el test.
- Elegir nombres de medicamentos que cubran los casos divergentes conocidos: al menos un nombre con guión (ej: "Trio-Val") y uno con short-word (ej: "Tri Fen").
- Los fixtures de `api/src/__tests__/cruzverde.test.ts`, `salcobrand.test.ts` y `drsimi.test.ts` son la fuente — no hace falta crear datos nuevos.

---

## Definición de terminado

- [x] `packages/domain/src/__tests__/contract.test.ts` existe con ≥ 4 snapshots — verificado 2026-08-15: 8 fixtures reales
- [x] `__snapshots__/contract.test.ts.snap` existe y está committeado — verificado
- [x] Al menos un snapshot cubre un nombre con guión (ej: "Trio-Val") — presente (`"Trio-Val 80mg x 30"`)
- [x] `pnpm --filter @comparafarma/domain test` — verde (incluido en CI, job `domain-tests`)
- [x] PR revisado y mergeado a `main` — el archivo está en `main` (worktree actual parte de `origin/main`)

**Nota de verificación documental (2026-08-15, Documentation Governance Cleanup):** este issue estaba marcado "Pendiente" pero el trabajo descrito ya existe completo en el repositorio, con cobertura mayor a la mínima exigida (8 fixtures vs. 4 mínimos). Corregido a Implementado contra evidencia real; se archiva junto al resto de CF-101–110.
