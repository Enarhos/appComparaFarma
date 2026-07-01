# CF-108 — Migrar mobile a `@comparafarma/domain` e invalidar caché

| Campo | Valor |
|---|---|
| **ID** | CF-108 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 2 horas |
| **Referencia** | RFC-001 §7 Fases 4 y 5 |

---

## Objetivo

Conectar el workspace `mobile/` al paquete `@comparafarma/domain`, configurar Metro para resolver el nuevo workspace, y convertir los archivos `normalization.ts` y `types.ts` del mobile en re-exports temporales. Incluye el incremento de `CACHE_PREFIX` para invalidar el caché de AsyncStorage, necesario porque `matchKey` ahora produce resultados distintos para nombres con guiones y short-word pairs.

Este issue es la primera vez que el mobile consume el paquete compartido — es el punto de verificación más crítico de la épica desde el punto de vista del runtime.

---

## Alcance

### Incluye

- Agregar `@comparafarma/domain: "workspace:*"` a `mobile/package.json`
- Ejecutar `pnpm install` para registrar el symlink
- Actualizar `mobile/metro.config.js` para agregar `packages/domain` a `watchFolders` (permite que Metro transforme el código del workspace en lugar de tratarlo como librería de `node_modules`)
- Agregar path alias en `mobile/tsconfig.json` para el TypeScript language server:
  ```json
  "@comparafarma/domain": ["../packages/domain/src/index.ts"]
  ```
- Convertir `mobile/src/lib/normalization.ts` en re-export temporal:
  ```typescript
  export * from "@comparafarma/domain";
  ```
- Convertir `mobile/src/lib/types.ts` en re-export temporal:
  ```typescript
  export type * from "@comparafarma/domain";
  ```
- Incrementar `CACHE_PREFIX` en `mobile/src/lib/cache.ts`:
  - `"search_cache_v9_"` → `"search_cache_v10_"`

### No incluye

- Actualizar imports directos en el código del mobile — los re-exports temporales lo hacen transparente
- Eliminar `mobile/src/lib/normalization.ts` ni `mobile/src/lib/types.ts`
- Modificar stores (`alertsStore`, `favoritesStore`) ni hooks (`useSearch`)

---

## Criterios de aceptación

1. `mobile/package.json` incluye `"@comparafarma/domain": "workspace:*"` en `dependencies`.
2. `mobile/metro.config.js` incluye `packages/domain` en `config.watchFolders`.
3. `mobile/src/lib/normalization.ts` contiene solo re-exports (sin implementaciones propias).
4. `mobile/src/lib/types.ts` contiene solo re-exports (sin implementaciones propias).
5. `mobile/src/lib/cache.ts` usa `CACHE_PREFIX = "search_cache_v10_"`.
6. `pnpm typecheck` pasa con 0 errores en todos los workspaces.
7. La app compila con `expo start` sin errores de Metro relativos al paquete.
8. Una búsqueda de "paracetamol" en el emulador retorna resultados de al menos 2 farmacias.
9. `matchKey("Trio-Val 80mg")` produce `"trioval|80mg"` en el contexto del mobile (verificar via log o `?debug=1`).

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-103 | `matchKey` debe existir en el paquete |
| Bloqueado por | CF-104 | `cleanQuery` debe existir en el paquete |
| Bloqueado por | CF-105 | Las funciones de pricing deben existir en el paquete |
| Bloqueado por | CF-106 | `mergeDuplicates` debe existir en el paquete |
| Bloquea | CF-109 | La limpieza final requiere que el mobile funcione con el paquete |

---

## Notas técnicas

- **Riesgo R-01 (Metro + TypeScript):** si `expo start` lanza `"SyntaxError: Unexpected token"` o `"Cannot use import statement"` al cargar `@comparafarma/domain`, el problema es que Metro no está transformando Babel sobre el paquete. La solución es verificar que `packages/domain` está en `watchFolders` — si persiste, compilar el paquete a `dist/` con `tsc` y apuntar `exports` a `./dist/index.js`.
- **Riesgo R-04 (symlink en Windows):** si Metro no sigue el symlink de pnpm, agregar también `path.resolve(workspaceRoot, "packages/domain")` como entrada explícita en `watchFolders`.
- El incremento de `CACHE_PREFIX` a `v10_` hace que todos los usuarios realicen un fetch fresco en la primera búsqueda post-actualización. Es el comportamiento esperado e intencionado.
- Las alertas y favoritos con `matchKey` antiguo quedarán huérfanos para medicamentos con guiones. Documentar en release notes del deploy — no requiere código adicional.

---

## Definición de terminado

- [ ] `mobile/package.json` tiene `@comparafarma/domain: "workspace:*"`
- [ ] `mobile/metro.config.js` incluye `packages/domain` en `watchFolders`
- [ ] `mobile/src/lib/normalization.ts` es re-export temporal
- [ ] `mobile/src/lib/types.ts` es re-export temporal
- [ ] `mobile/src/lib/cache.ts` usa `CACHE_PREFIX = "search_cache_v10_"`
- [ ] `pnpm typecheck` — 0 errores
- [ ] `expo start` compila sin errores de Metro
- [ ] Búsqueda de "paracetamol" en emulador Android retorna resultados de ≥ 2 farmacias
- [ ] `matchKey("Trio-Val 80mg")` → `"trioval|80mg"` verificado en mobile
- [ ] PR revisado y mergeado a `main`
