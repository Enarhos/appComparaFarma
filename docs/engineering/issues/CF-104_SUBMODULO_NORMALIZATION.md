# CF-104 — Submódulo `normalization`: crear `cleanQuery()` y sus tests

| Campo | Valor |
|---|---|
| **ID** | CF-104 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1.5 horas |
| **Referencia** | RFC-001 §7 Fase 3, §5.2, §6, §10.1 |

---

## Objetivo

Crear `packages/domain/src/normalization.ts` con la función `cleanQuery()` extraída de la versión canónica del backend, junto con su suite de tests unitarios. `cleanQuery` limpia la query del usuario antes de enviarla a las APIs de farmacia: corta posología, elimina stop words y deduplica términos.

---

## Alcance

### Incluye

**Implementación:**
- Crear `packages/domain/src/normalization.ts` con la función `cleanQuery(raw: string): string` completa, incluyendo:
  - Corte en la primera palabra de posología (`dosis`, `cada`, `vía`, `tomar`, etc.)
  - Eliminación de contenido entre `[]` y `()`
  - Filtrado de stop words farmacéuticas (formas farmacéuticas, unidades de medida)
  - Deduplicación de palabras con `Set`
- Sin imports internos (la función opera solo sobre strings)
- Re-exportar `cleanQuery` desde `packages/domain/src/index.ts`
- Hacer que `api/src/lib/normalization.ts` re-exporte `cleanQuery` desde `@comparafarma/domain` (manteniendo el resto del archivo intacto)

**Tests:**
- Crear `packages/domain/src/__tests__/normalization.test.ts` con mínimo 8 casos:
  - Query con posología: `"Paracetamol 500mg tomar cada 8 horas"` → `"Paracetamol"`
  - Solo stop words: `"comprimidos mg"` → `""`
  - Con paréntesis y corchetes: contenido eliminado correctamente
  - Con palabras duplicadas: deduplicado
  - Input vacío: retorna `""`
  - Input solo numérico: `"500 mg"` → `""`
  - Query de prospecto con múltiples oraciones: cortado en primera palabra de posología
  - Query con caracteres especiales: limpiado

### No incluye

- Modificar `matchKey`, `effectivePrice` u otras funciones
- Modificar ningún archivo en `mobile/`
- Eliminar `api/src/lib/normalization.ts`
- Tests de los demás submódulos

---

## Criterios de aceptación

1. Existe `packages/domain/src/normalization.ts` con la función `cleanQuery(raw: string): string`.
2. La función se comporta correctamente en los casos base:
   - `cleanQuery("Paracetamol 500mg tomar cada 8 horas")` → `"Paracetamol"`
   - `cleanQuery("Ibuprofeno 400 mg comprimidos")` → `"Ibuprofeno"`
   - `cleanQuery("500 mg comprimidos")` → `""` (vacío — sin nombre significativo)
3. `packages/domain/src/index.ts` re-exporta `cleanQuery`.
4. Existe `packages/domain/src/__tests__/normalization.test.ts` con ≥ 8 casos.
5. `pnpm --filter @comparafarma/domain test` pasa con 0 fallos.
6. `pnpm typecheck` pasa con 0 errores.
7. `pnpm --filter api test` pasa sin cambios.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-101 | El workspace debe existir |
| Paralelo con | CF-103 | No hay dependencia entre `matching` y `normalization` — pueden hacerse en paralelo |
| Bloquea | CF-107 | Los snapshots de contrato necesitan todos los submódulos listos |

---

## Notas técnicas

- `cleanQuery` no importa desde `./types.js` — opera solo sobre strings, sin interacción con otros submódulos.
- La lista de stop words farmacéuticas y palabras de posología debe copiarse íntegra desde `api/src/lib/normalization.ts`. No simplificar ni resumir.
- La función puede retornar `""`. Los tests deben cubrir explícitamente este caso.
- Los tests deben importar desde `"../normalization.js"` (extensión `.js` explícita).

---

## Definición de terminado

- [ ] `packages/domain/src/normalization.ts` existe con `cleanQuery()` completa
- [ ] Los casos base producen el resultado correcto (incluyendo retorno vacío)
- [ ] `packages/domain/src/index.ts` re-exporta `cleanQuery`
- [ ] `api/src/lib/normalization.ts` re-exporta `cleanQuery` desde el paquete
- [ ] `packages/domain/src/__tests__/normalization.test.ts` existe con ≥ 8 casos
- [ ] `pnpm --filter @comparafarma/domain test` — verde
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] PR revisado y mergeado a `main`
