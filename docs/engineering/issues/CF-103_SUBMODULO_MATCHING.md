# CF-103 — Submódulo `matching`: crear `matchKey()` y sus tests

| Campo | Valor |
|---|---|
| **ID** | CF-103 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Crítica |
| **Estimación** | 2 horas |
| **Referencia** | RFC-001 §7 Fase 3, §5.2, §6, §10.1 |

---

## Objetivo

Crear `packages/domain/src/matching.ts` con la función `matchKey()` extraída de la versión canónica del backend, junto con su suite de tests unitarios. Este es el submódulo más crítico de la épica: contiene la corrección de la divergencia que está produciendo alertas de precio silenciosamente rotas en producción.

---

## Alcance

### Incluye

**Implementación:**
- Crear `packages/domain/src/matching.ts` con la función `matchKey()` completa, incluyendo:
  - Normalización de acentos (NFD)
  - Conversión a minúsculas
  - **Normalización de guiones:** `(\w)-(\w)` → `$1$2` (ej: `"Trio-Val"` → `"trioval"`)
  - **Short-word merging:** si la primera palabra de marca tiene ≤4 letras y la siguiente también ≤4, se unen (ej: `"Tri Fen"` → `"trifen"`)
  - Extracción de dosis (mg, ml, mcg, g → mg)
  - Extracción de cantidad (qty=1 normalizado a vacío)
  - Detección día/noche para antigripales
- Imports internos con extensión `.js` (`"./types.js"`)
- Re-exportar `matchKey` desde `packages/domain/src/index.ts`
- Convertir la función `matchKey` en `api/src/lib/normalization.ts` en re-export desde `@comparafarma/domain` (manteniendo el resto del archivo intacto por ahora)

**Tests:**
- Agregar `vitest` como `devDependency` en `packages/domain/package.json` y configurar el script `"test": "vitest run"`
- Crear `packages/domain/src/__tests__/matching.test.ts` con mínimo 15 casos:
  - Caso básico: `"Paracetamol 500 mg x 16 Comprimidos"` → `"paracetamol|500mg|16"`
  - 🔴 Regresión guión: `"Trio-Val 80mg x 30"` → `"trioval|80mg|30"`
  - 🔴 Regresión guión: `"Co-Amoxiclav 500mg 21 Cápsulas"` → `"coamoxiclav|500mg|21"`
  - 🔴 Regresión short-word: `"Tri Fen 10mg"` → `"trifen|10mg"`
  - Día/noche distintos: `"Tapsin Plus Día 16"` ≠ `"Tapsin Plus Noche 16"`
  - Conversión gramos: `"Amoxicilina 0.5g"` → `"amoxicilina|500mg"`
  - Qty 1 a vacío: `"Tapsin 1 Sobre"` → `"tapsin"` (sin `|1`)
  - Sin dosis ni qty: `"Paracetamol"` → `"paracetamol"`
  - Acentos: `"Ibuprofeno Día"` → `"ibuprofeno|d"`
  - Nombre con mcg: `"Salbutamol 100mcg/dosis Inhalador"` → manejo correcto
  - Input empieza con número: no lanza excepción
  - Input de una letra: no lanza excepción
  - Input vacío: retorna string no vacío (comportamiento defensivo)
  - Múltiples unidades en el nombre: extrae la correcta
  - Nombre complejo con laboratorio y forma farmacéutica: extrae solo la marca

### No incluye

- Modificar `cleanQuery`, `effectivePrice`, `mergeDuplicates` u otras funciones
- Modificar ningún archivo en `mobile/`
- Eliminar `api/src/lib/normalization.ts`
- Tests de los demás submódulos (cada uno los incluye en su propio issue)

---

## Criterios de aceptación

1. Existe `packages/domain/src/matching.ts` con la función `matchKey(name: string): string`.
2. Los 3 casos de regresión obligatorios pasan:
   - `matchKey("Trio-Val 80mg x 30")` → `"trioval|80mg|30"`
   - `matchKey("Co-Amoxiclav 500mg 21 Cápsulas")` → `"coamoxiclav|500mg|21"`
   - `matchKey("Tri Fen 10mg")` → `"trifen|10mg"`
3. La función mantiene compatibilidad con medicamentos comunes:
   - `matchKey("Paracetamol 500 mg x 16 Comprimidos")` → `"paracetamol|500mg|16"`
4. `packages/domain/src/index.ts` re-exporta `matchKey`.
5. Existe `packages/domain/src/__tests__/matching.test.ts` con ≥ 15 casos.
6. `pnpm --filter @comparafarma/domain test` pasa con 0 fallos.
7. `pnpm typecheck` pasa con 0 errores.
8. `pnpm --filter api test` pasa sin cambios.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-102 | Necesita `types.ts` del paquete para importar `PharmacySlug` y afines |
| Bloquea | CF-105 | `pricing.ts` importa `matchKey` desde `./matching.js` |
| Bloquea | CF-107 | Los snapshots de contrato usan `matchKey` — el módulo debe existir |

---

## Notas técnicas

- La fuente canónica es `api/src/lib/normalization.ts`, **no** `mobile/src/lib/normalization.ts`. El mobile tiene la versión desactualizada.
- El regex de guiones es `(/(\w)-(\w)/g, "$1$2")` — asegurarse de que no se pierde en el copy/paste.
- Los tests deben importar desde `"../matching.js"` (extensión `.js` explícita, requerida por NodeNext).

---

## Definición de terminado

- [ ] `packages/domain/src/matching.ts` existe con `matchKey()` completa
- [ ] Los 3 casos de regresión producen el resultado correcto
- [ ] `packages/domain/src/index.ts` re-exporta `matchKey`
- [ ] `api/src/lib/normalization.ts` re-exporta `matchKey` desde el paquete (sin duplicar la implementación)
- [ ] `packages/domain/src/__tests__/matching.test.ts` existe con ≥ 15 casos
- [ ] `pnpm --filter @comparafarma/domain test` — verde
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] PR revisado y mergeado a `main`
