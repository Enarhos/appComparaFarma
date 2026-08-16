# CF-101 — Setup del workspace `packages/domain`

| Campo | Valor |
|---|---|
| **ID** | CF-101 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Alta |
| **Estimación** | 1 hora |
| **Referencia** | RFC-001 §7 Fase 1 |

---

## Objetivo

Crear la estructura mínima del workspace `packages/domain` en el monorepo pnpm y registrarlo como paquete interno `@comparafarma/domain`, sin mover ningún código todavía. Este issue es el punto de partida de toda la migración — nada en CF-102 en adelante puede comenzar sin él.

---

## Alcance

### Incluye

- Crear el directorio `packages/domain/src/`
- Crear `packages/domain/package.json` con `name: "@comparafarma/domain"`, `version: "1.0.0"`, `private: true`
- Crear `packages/domain/tsconfig.json` (extiende la base del proyecto o define `module: NodeNext`, `moduleResolution: NodeNext`, `strict: true`)
- Crear `packages/domain/src/index.ts` vacío (sin exports)
- Actualizar `pnpm-workspace.yaml` para agregar `"packages/*"` al listado de workspaces
- Ejecutar `pnpm install` desde la raíz para que pnpm registre el symlink

### No incluye

- Mover ningún archivo de `api/src/lib/` ni `mobile/src/lib/`
- Escribir ninguna función ni tipo
- Modificar `metro.config.js` ni los `package.json` de `api/` o `mobile/`

---

## Criterios de aceptación

1. Existe el archivo `packages/domain/package.json` con `"name": "@comparafarma/domain"` y `"private": true`.
2. Existe `packages/domain/tsconfig.json` con configuración TypeScript válida.
3. Existe `packages/domain/src/index.ts` (puede estar vacío).
4. `pnpm-workspace.yaml` contiene la entrada `"packages/*"`.
5. Tras ejecutar `pnpm install`, el directorio `node_modules/@comparafarma/domain` existe como symlink al workspace.
6. `pnpm typecheck` pasa con 0 errores (el workspace vacío no rompe nada).
7. `pnpm --filter api test` pasa sin cambios.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Prerequisito | Ninguno | Issue inicial de la épica |
| Bloqueado por | — | — |
| Bloquea | CF-102, CF-103, CF-104, CF-105, CF-106 | Todos los issues de contenido necesitan el workspace registrado |

---

## Definición de terminado

- [ ] Directorio `packages/domain/` existe con los tres archivos requeridos
- [ ] `pnpm-workspace.yaml` incluye `"packages/*"`
- [ ] `node_modules/@comparafarma/domain` es un symlink válido tras `pnpm install`
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm --filter api test` — verde (sin regresiones)
- [ ] PR revisado y mergeado a `main`
