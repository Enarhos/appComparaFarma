# CF-109 — Limpieza final: eliminar duplicados y actualizar imports

| Campo | Valor |
|---|---|
| **ID** | CF-109 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1.5 horas |
| **Referencia** | RFC-001 §7 Fase 6 |

---

## Objetivo

Eliminar los cuatro archivos que son re-exports temporales (los archivos `normalization.ts` y `types.ts` en `api/` y `mobile/`) y actualizar todos los imports directos en el codebase para que apunten a `@comparafarma/domain`. Al terminar este issue, no habrá ninguna copia de la lógica de dominio fuera del paquete compartido.

Este es el único issue de la épica que elimina archivos y por tanto el único que **no es trivialmente reversible** tras el merge. Debe ejecutarse solo después de que CF-107 y CF-108 estén mergeados y verificados.

---

## Alcance

### Incluye

**Eliminar los re-exports temporales:**
- `api/src/lib/normalization.ts` — eliminar
- `api/src/lib/types.ts` — eliminar
- `mobile/src/lib/normalization.ts` — eliminar
- `mobile/src/lib/types.ts` — eliminar

**Actualizar imports en `api/`:**
- `api/src/services/searchService.ts`
- `api/src/routes/search.ts`
- `api/src/__tests__/normalization.test.ts`
- `api/src/__tests__/searchService.test.ts`
- `api/src/__tests__/ahumada.test.ts`
- `api/src/__tests__/cruzverde.test.ts`
- `api/src/__tests__/salcobrand.test.ts`
- `api/src/__tests__/drsimi.test.ts`

**Actualizar imports en `mobile/`:**
- `mobile/src/hooks/useSearch.ts`
- `mobile/src/lib/search.ts`
- `mobile/src/lib/cache.ts`
- `mobile/src/lib/priceHistory.ts`
- `mobile/src/store/alertsStore.ts`
- `mobile/src/store/favoritesStore.ts`
- `mobile/src/store/searchStore.ts`
- `mobile/src/store/cartStore.ts`
- Cualquier componente que importe `MedicationResult` directamente

### No incluye

- Modificar la lógica de ninguna función
- Modificar `packages/domain/` — ese paquete no cambia en este issue
- Cambiar el comportamiento de ninguna funcionalidad del producto

---

## Criterios de aceptación

1. Los cuatro archivos eliminados no existen en el repositorio.
2. Ningún archivo en `api/src/` ni `mobile/src/` importa desde `lib/normalization` ni `lib/types`:
   ```bash
   grep -r "from.*lib/normalization" api/src mobile/src  # sin resultados
   grep -r "from.*lib/types" api/src mobile/src          # sin resultados
   ```
3. `pnpm typecheck` pasa con 0 errores.
4. `pnpm --filter api test` pasa sin cambios.
5. `pnpm --filter @comparafarma/domain test` pasa sin cambios.
6. La app mobile compila con `expo start` sin errores.
7. Una búsqueda de "paracetamol" en el emulador retorna resultados correctos.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-107 | Los tests del paquete deben pasar antes de eliminar los originales |
| Bloqueado por | CF-108 | El mobile debe estar funcionando con el paquete antes de eliminar sus copias |
| Bloquea | CF-110 | El CI debe actualizarse después de que la estructura final esté establecida |

---

## Rollback

Si se detecta un problema crítico después del merge:

```bash
git revert <sha-de-este-commit>
```

Esto restaura los cuatro archivos eliminados y revierte los imports a su estado anterior.

Si el problema es puntual (un único import mal migrado), aplicar un hotfix directamente.

---

## Notas técnicas

- Verificar la lista de archivos con `grep -r "from.*lib/normalization\|from.*lib/types" api/src mobile/src` antes de empezar, por si hay archivos no listados en el alcance.
- Los tests de `api/src/__tests__/normalization.test.ts` deben quedar migrando sus imports a `@comparafarma/domain` — el archivo de tests en sí permanece en `api/src/__tests__/` (no se mueve).
- Tras la eliminación, el paquete `@comparafarma/domain` es la única fuente de tipos y funciones de dominio. Esta es la postcondición definitiva de la épica.

---

## Definición de terminado

- [ ] `api/src/lib/normalization.ts` — eliminado
- [ ] `api/src/lib/types.ts` — eliminado
- [ ] `mobile/src/lib/normalization.ts` — eliminado
- [ ] `mobile/src/lib/types.ts` — eliminado
- [ ] `grep -r "from.*lib/normalization" api/src mobile/src` — sin resultados
- [ ] `grep -r "from.*lib/types" api/src mobile/src` — sin resultados
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] `pnpm --filter @comparafarma/domain test` — verde
- [ ] `expo start` compila sin errores
- [ ] Búsqueda en emulador Android — resultados correctos
- [ ] PR revisado y mergeado a `main`
