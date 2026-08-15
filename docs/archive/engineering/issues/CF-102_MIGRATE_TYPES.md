# CF-102 — Migrar tipos de dominio a `@comparafarma/domain`

| Campo | Valor |
|---|---|
| **ID** | CF-102 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1 hora |
| **Referencia** | RFC-001 §7 Fase 2 |

---

## Objetivo

Crear `packages/domain/src/types.ts` como la única fuente de verdad para el contrato de dominio compartido (`MedicationResult`, `PharmacyPrice`, `PriceChannels`, `ScrapedProduct`, etc.), y convertir los archivos `types.ts` existentes en re-exports temporales que apunten al paquete. Este issue elimina la duplicación de tipos sin tocar nada de la lógica todavía.

---

## Alcance

### Incluye

- Crear `packages/domain/src/types.ts` con el contenido consolidado de `api/src/lib/types.ts` (fuente canónica)
- Reconciliar cualquier diferencia menor que exista entre `api/src/lib/types.ts` y `mobile/src/lib/types.ts` — la versión del paquete debe ser la unión completa
- Agregar re-exports de tipos a `packages/domain/src/index.ts`
- Convertir `api/src/lib/types.ts` en re-export temporal:
  ```typescript
  export type * from "@comparafarma/domain";
  ```
- Convertir `mobile/src/lib/types.ts` en re-export temporal con la misma forma
- Agregar `@comparafarma/domain: "workspace:*"` a `api/package.json`

### No incluye

- Modificar `mobile/package.json` ni `metro.config.js` (eso es CF-108)
- Mover ninguna función — solo tipos
- Eliminar los archivos `types.ts` originales — siguen existiendo como re-exports

---

## Criterios de aceptación

1. Existe `packages/domain/src/types.ts` con todos los tipos del contrato de dominio: `PharmacySlug`, `PriceChannels`, `PharmacyPrice`, `ScrapedProduct`, `MedicationResult`, `PharmacySearchDiagnostic`, `SearchExecution`.
2. `api/src/lib/types.ts` contiene únicamente el re-export temporal y ninguna definición propia.
3. `mobile/src/lib/types.ts` contiene únicamente el re-export temporal.
4. `packages/domain/src/index.ts` re-exporta todo de `./types.js`.
5. `pnpm typecheck` pasa con 0 errores en todos los workspaces.
6. `pnpm --filter api test` pasa sin cambios.
7. No se modifica ningún import en los consumidores (`searchService.ts`, `useSearch.ts`, etc.) — los re-exports los mantienen transparentes.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-101 | El workspace debe existir antes de poder importar desde él |
| Bloquea | CF-103, CF-105 | `matching.ts` y `pricing.ts` importan desde `./types.js` |

---

## Notas técnicas

- Los imports internos del paquete deben usar extensión `.js` explícita (`"./types.js"`) por el requisito de `moduleResolution: NodeNext` de `api/`. Verificar en `pnpm typecheck`.
- Si `mobile/src/lib/types.ts` tiene algún tipo adicional que no existe en la versión del backend, debe incorporarse al paquete compartido en este issue — no dejarlo fuera.

---

## Definición de terminado

- [ ] `packages/domain/src/types.ts` existe con todos los tipos de dominio
- [ ] `api/src/lib/types.ts` es re-export temporal (sin definiciones propias)
- [ ] `mobile/src/lib/types.ts` es re-export temporal (sin definiciones propias)
- [ ] `packages/domain/src/index.ts` re-exporta types
- [ ] `api/package.json` incluye `@comparafarma/domain: "workspace:*"`
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde
- [ ] PR revisado y mergeado a `main`
