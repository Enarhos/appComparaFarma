# CF-105 — Submódulo `pricing`: crear funciones de precios y sus tests

| Campo | Valor |
|---|---|
| **ID** | CF-105 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 2 horas |
| **Referencia** | RFC-001 §7 Fase 3, §5.2, §6, §10.1 |

---

## Objetivo

Crear `packages/domain/src/pricing.ts` con las funciones que transforman datos crudos de scrapers en el modelo de dominio tipado (`effectivePrice`, `toPharmacyPrice`, `toMedicationResult`), junto con su suite de tests unitarios. Este submódulo depende de `types` y de `matching` porque `toMedicationResult` calcula el `matchKey` del producto.

---

## Alcance

### Incluye

**Implementación:**
- Crear `packages/domain/src/pricing.ts` con las tres funciones:
  - `effectivePrice(channels): number` — retorna `min(store, online ?? store, cmr ?? store, sbpay ?? store)`
  - `toPharmacyPrice(product, pharmacySlug, pharmacyName): PharmacyPrice` — convierte `ScrapedProduct` en `PharmacyPrice` con `effective` calculado
  - `toMedicationResult(product, pharmacySlug, pharmacyName): MedicationResult` — convierte `ScrapedProduct` en `MedicationResult` completo, calculando `matchKey(product.name)`
- Imports internos con extensión `.js`: `"./types.js"` y `"./matching.js"`
- Re-exportar las tres funciones desde `packages/domain/src/index.ts`
- Hacer que `api/src/lib/normalization.ts` re-exporte `effectivePrice`, `toPharmacyPrice` y `toMedicationResult` desde `@comparafarma/domain`

**Tests:**
- Crear `packages/domain/src/__tests__/pricing.test.ts` con mínimo 8 casos:
  - `effectivePrice` — solo store: retorna el store
  - `effectivePrice` — online más barato: `{store:3290, online:2490, cmr:null, sbpay:null}` → `2490`
  - `effectivePrice` — CMR más barato: `{store:1000, online:null, cmr:750, sbpay:null}` → `750`
  - `effectivePrice` — SBPay más barato: `{store:3290, online:2490, cmr:null, sbpay:2290}` → `2290`
  - `effectivePrice` — canal `null` no introduce precio 0: `{store:1500, online:null, cmr:null, sbpay:null}` → `1500`
  - `effectivePrice` — precio 0 en store: retorna 0
  - `toPharmacyPrice` — `ScrapedProduct` completo → `PharmacyPrice` con `channels.effective` calculado
  - `toMedicationResult` — `ScrapedProduct` → `MedicationResult` con `matchKey` correcto y `prices[]` con un único elemento

### No incluye

- Modificar `mergeDuplicates` (eso es CF-106)
- Modificar ningún archivo en `mobile/`
- Eliminar `api/src/lib/normalization.ts`
- Tests de los demás submódulos

---

## Criterios de aceptación

1. Existe `packages/domain/src/pricing.ts` con las tres funciones exportadas.
2. `effectivePrice` se comporta correctamente:
   - `{store:3290, online:2490, cmr:null, sbpay:2290}` → `2290`
   - `{store:1500, online:null, cmr:null, sbpay:null}` → `1500`
   - `{store:1000, online:null, cmr:750, sbpay:null}` → `750`
3. `toPharmacyPrice` retorna un `PharmacyPrice` completo con `channels.effective` calculado correctamente.
4. `toMedicationResult` retorna un `MedicationResult` cuyo `matchKey` es el producido por la versión canónica de `matchKey()` del paquete.
5. `packages/domain/src/index.ts` re-exporta las tres funciones.
6. Existe `packages/domain/src/__tests__/pricing.test.ts` con ≥ 8 casos.
7. `pnpm --filter @comparafarma/domain test` pasa con 0 fallos.
8. `pnpm typecheck` pasa con 0 errores.
9. `pnpm --filter api test` pasa sin cambios.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-102 | Necesita los tipos del paquete |
| Bloqueado por | CF-103 | `toMedicationResult` llama a `matchKey()` desde `./matching.js` |
| Bloquea | CF-106 | `deduplication.ts` usa `toMedicationResult` y los tipos de pricing |
| Bloquea | CF-107 | Los snapshots de contrato necesitan todos los submódulos listos |

---

## Notas técnicas

- El import de `matchKey` dentro de `pricing.ts` debe ser `import { matchKey } from "./matching.js"` (extensión `.js` obligatoria para NodeNext).
- `toMedicationResult` construye `prices[]` con un único `PharmacyPrice` — es `mergeDuplicates` quien fusiona cuando hay múltiples farmacias.
- El campo `fetchedAt` de `PharmacyPrice` es un ISO timestamp; usar `new Date().toISOString()` en la implementación.
- Los tests deben importar desde `"../pricing.js"` (extensión `.js` explícita).

---

## Definición de terminado

- [ ] `packages/domain/src/pricing.ts` existe con `effectivePrice`, `toPharmacyPrice`, `toMedicationResult`
- [ ] Los tres casos de `effectivePrice` producen el resultado correcto
- [ ] `toMedicationResult` produce un `matchKey` consistente con el submódulo `matching`
- [ ] `packages/domain/src/index.ts` re-exporta las tres funciones
- [ ] `api/src/lib/normalization.ts` re-exporta las funciones desde el paquete
- [ ] `packages/domain/src/__tests__/pricing.test.ts` existe con ≥ 8 casos
- [ ] `pnpm --filter @comparafarma/domain test` — verde
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] PR revisado y mergeado a `main`
