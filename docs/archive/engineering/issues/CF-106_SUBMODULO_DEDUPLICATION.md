# CF-106 — Submódulo `deduplication`: crear `mergeDuplicates()` y sus tests

| Campo | Valor |
|---|---|
| **ID** | CF-106 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1.5 horas |
| **Referencia** | RFC-001 §7 Fase 3, §5.2, §6, §10.1 |

---

## Objetivo

Crear `packages/domain/src/deduplication.ts` con la función `mergeDuplicates()`, junto con su suite de tests unitarios. Es el último submódulo funcional de la épica: con él, el paquete `@comparafarma/domain` tiene todo el código de dominio necesario para que `api/` y `mobile/` lo usen, y `api/src/lib/normalization.ts` queda como re-export puro sin implementaciones propias.

---

## Alcance

### Incluye

**Implementación:**
- Crear `packages/domain/src/deduplication.ts` con la función `mergeDuplicates(results: MedicationResult[]): MedicationResult[]`, implementando:
  - Agrupación por `matchKey`
  - Selección de nombre canónico: preferir el que tiene laboratorio; si ambos lo tienen, el nombre más corto
  - Fusión de precios: mantener el mejor `effective` price por farmacia (si la misma farmacia aparece dos veces, conservar el `PharmacyPrice` con menor `effective`)
  - Selección de imagen: primer `imageUrl` no-null del grupo
  - Actualización de `bestPrice` y `bestPharmacy` en el resultado fusionado
- Imports internos con extensión `.js`: `"./types.js"` y `"./pricing.js"`
- Re-exportar `mergeDuplicates` desde `packages/domain/src/index.ts`
- Hacer que `api/src/lib/normalization.ts` re-exporte `mergeDuplicates` desde `@comparafarma/domain`
- En este punto, `api/src/lib/normalization.ts` debe ser íntegramente re-exports — sin implementaciones propias

**Tests:**
- Crear `packages/domain/src/__tests__/deduplication.test.ts` con mínimo 5 casos:
  - Fusión básica: 2 farmacias distintas con el mismo medicamento → 1 `MedicationResult` con ambas en `prices[]`
  - 3 farmacias — `bestPharmacy` apunta a la de menor `effective`
  - Selección de nombre: se prefiere el que tiene laboratorio
  - Selección de imagen: primer `imageUrl` no-null del grupo
  - Misma farmacia dos veces — conserva el `PharmacyPrice` con menor `effective`

### No incluye

- Modificar `searchService.ts` ni ningún consumidor directo
- Modificar ningún archivo en `mobile/`
- Eliminar `api/src/lib/normalization.ts`
- Tests de los demás submódulos

---

## Criterios de aceptación

1. Existe `packages/domain/src/deduplication.ts` con `mergeDuplicates` exportada.
2. Dado el mismo medicamento de 2 farmacias distintas, retorna 1 `MedicationResult` con ambas en `prices[]`.
3. `bestPrice` es el `effective` más bajo del grupo y `bestPharmacy` apunta a esa farmacia.
4. Si un elemento tiene laboratorio y otro no, el nombre canónico proviene del que tiene laboratorio.
5. `packages/domain/src/index.ts` re-exporta `mergeDuplicates`.
6. `api/src/lib/normalization.ts` contiene solo re-exports (0 implementaciones propias).
7. Existe `packages/domain/src/__tests__/deduplication.test.ts` con ≥ 5 casos.
8. `pnpm --filter @comparafarma/domain test` pasa con 0 fallos.
9. `pnpm typecheck` pasa con 0 errores.
10. `pnpm --filter api test` pasa sin cambios.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-102 | Necesita los tipos del paquete |
| Bloqueado por | CF-105 | Importa tipos y helpers de `./pricing.js` |
| Bloquea | CF-107 | Los snapshots de contrato necesitan todos los submódulos listos |
| Bloquea | CF-109 | La limpieza final puede comenzar cuando todos los submódulos existen y sus tests pasan |

---

## Notas técnicas

- `mergeDuplicates` no garantiza el orden del array retornado — el ordenamiento por precio es responsabilidad del llamador (`searchService.ts`). No agregar lógica de sort aquí.
- Verificar que el `matchKey` usado para agrupar proviene del submódulo `matching` del paquete — no de una copia local.
- Los tests deben importar desde `"../deduplication.js"` (extensión `.js` explícita).

---

## Definición de terminado

- [ ] `packages/domain/src/deduplication.ts` existe con `mergeDuplicates()` completa
- [ ] La fusión de 2 farmacias produce 1 `MedicationResult` con ambas en `prices[]`
- [ ] `bestPrice` y `bestPharmacy` reflejan el precio efectivo más bajo del grupo
- [ ] `packages/domain/src/index.ts` re-exporta `mergeDuplicates`
- [ ] `api/src/lib/normalization.ts` contiene solo re-exports (0 implementaciones propias)
- [ ] `packages/domain/src/__tests__/deduplication.test.ts` existe con ≥ 5 casos
- [ ] `pnpm --filter @comparafarma/domain test` — verde
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] PR revisado y mergeado a `main`
