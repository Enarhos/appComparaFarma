# ADR-0001 — Shared Domain Package

**Estado:** Aprobado
**Fecha:** 2026-06-29

---

## Contexto

El monorepo mantiene dos copias independientes de la lógica de dominio: `api/src/lib/normalization.ts` y `mobile/src/lib/normalization.ts`, más sus respectivos `types.ts`. Ambas copias representan el mismo contrato de dominio pero ya divergieron en producción: el backend incorporó normalización de guiones y short-word merging en `matchKey()` que el mobile nunca recibió. Esto hace que las alertas de precio fallen silenciosamente para medicamentos como "Trio-Val" o "Co-Amoxiclav". Sin enforcement estructural, cualquier futura mejora al backend tiene alta probabilidad de no llegar al mobile.

## Decisión

Crear un tercer workspace `packages/domain` en el monorepo pnpm, publicado internamente como `@comparafarma/domain`. Este paquete es la única fuente de verdad para la lógica y los tipos compartidos entre `api/` y `mobile/`.

El código se organiza en cinco submódulos con responsabilidades separadas:

| Submódulo | Responsabilidad |
|---|---|
| `types` | Contrato de dominio: `MedicationResult`, `PharmacyPrice`, `PriceChannels`, etc. |
| `matching` | `matchKey()` — clave canónica de identidad para deduplicación, favoritos y alertas |
| `normalization` | `cleanQuery()` — limpieza de la query antes de enviarla a las APIs de farmacia |
| `pricing` | `effectivePrice()`, `toPharmacyPrice()`, `toMedicationResult()` |
| `deduplication` | `mergeDuplicates()` — fusión de resultados por `matchKey` |

`index.ts` re-exporta todo. Los consumidores importan desde `@comparafarma/domain`.

## Consecuencias

**Beneficios:**
- La divergencia de `matchKey` entre mobile y backend se vuelve estructuralmente imposible.
- Cada submódulo puede testearse de forma aislada con su propio archivo de tests.
- Nuevos integrantes pueden localizar cualquier función de dominio en un lugar predecible.

**Impactos aceptados:**
- `metro.config.js` debe incluir `packages/domain` en `watchFolders` para que Metro transforme el paquete como código del workspace.
- Los imports internos del paquete deben usar extensión `.js` explícita (requisito de `moduleResolution: NodeNext` del backend).
- `CACHE_PREFIX` del mobile debe incrementarse a `v10_` para invalidar el caché con el `matchKey` corregido.
- Alertas y favoritos creados con el `matchKey` antiguo quedarán huérfanos (el bug ya existía — no es una regresión).

**Riesgos aceptados:**
- Riesgo bajo-medio de incompatibilidad de resolución de módulos en Metro; mitigable con `watchFolders` o compilando el paquete a `dist/`.

## Alternativas consideradas

- **Sincronización manual:** ya falló una vez; descartada por depender de disciplina humana sin enforcement.
- **Script de build que copia archivos:** frágil ante las diferencias de resolución de módulos entre entornos; descartada.
- **Endpoint HTTP `/api/normalize`:** introduce dependencia de red para operaciones offline; descartada por sobrediseño.

Ver análisis completo en RFC-001.

## Referencias

- [RFC-001_SHARED_NORMALIZATION_PACKAGE.md](../rfc/RFC-001_SHARED_NORMALIZATION_PACKAGE.md)
- [ER-002_SEARCH_ENGINE_FULL_REVIEW.md](../../reviews/ER-002_SEARCH_ENGINE_FULL_REVIEW.md)
- [AUDIT_SEARCH_NORMALIZATION.md](../../../archive/audits/AUDIT_SEARCH_NORMALIZATION.md)
