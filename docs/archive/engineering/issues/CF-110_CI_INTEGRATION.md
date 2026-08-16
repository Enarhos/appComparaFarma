# CF-110 — Integración CI/CD del paquete `@comparafarma/domain`

| Campo | Valor |
|---|---|
| **ID** | CF-110 |
| **Épica** | Shared Domain Package |
| **Estado** | Pendiente |
| **Prioridad** | Media |
| **Estimación** | 30 minutos |
| **Referencia** | RFC-001 §7 Fase 6, §10.2 |

---

## Objetivo

Agregar el nuevo paquete `@comparafarma/domain` al pipeline de CI para que sus tests se ejecuten automáticamente en cada push y PR a `main`. Sin este issue, la red de seguridad que protege contra divergencias futuras existe en el paquete pero no se activa en cada cambio.

---

## Alcance

### Incluye

- Agregar un nuevo job `domain-tests` en `.github/workflows/ci.yml`:
  ```yaml
  domain-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @comparafarma/domain test
  ```
- Configurar el nuevo job para ejecutarse **en paralelo** con `api-tests` — no como dependencia de él
- Verificar que el job `deploy-api` no se bloquea esperando `domain-tests` (el deploy puede continuar si los tests del paquete pasan)
- Confirmar que `pnpm typecheck` en CI también cubre el nuevo workspace (si el typecheck existente usa `--filter` por workspace, agregar `@comparafarma/domain`)

### No incluye

- Modificar el pipeline de EAS Build ni el workflow de monitor
- Agregar cobertura de código ni umbrales de coverage
- Cambiar ningún archivo de código fuente

---

## Criterios de aceptación

1. `.github/workflows/ci.yml` contiene el job `domain-tests` que ejecuta `pnpm --filter @comparafarma/domain test`.
2. El job `domain-tests` corre en paralelo con `api-tests` — ambos aparecen en el mismo nivel en el grafo de CI.
3. Un PR que rompa un test en `packages/domain/` hace fallar el CI antes del merge.
4. Un PR que no toque `packages/domain/` completa el job `domain-tests` en verde (no hay falsos negativos).
5. El job `deploy-api` solo requiere que `domain-tests` pase si el deploy depende del paquete; en caso contrario, corren en paralelo.
6. El pipeline completo pasa en verde en la rama `main` tras el merge de este issue.

---

## Dependencias

| Tipo | Referencia | Motivo |
|---|---|---|
| Bloqueado por | CF-107 | Los tests del paquete deben existir para que el job tenga algo que ejecutar |
| Bloqueado por | CF-109 | La estructura final del repositorio debe estar establecida antes de ajustar CI |
| Bloquea | — | Issue final de la épica — no bloquea ningún otro |

---

## Notas técnicas

- La versión de Node.js en el job debe coincidir con la usada en `api-tests` y `deploy-api` para evitar inconsistencias.
- Si el monorepo usa `pnpm install --frozen-lockfile` en CI, verificar que el `pnpm-lock.yaml` fue actualizado en CF-101 (cuando se agregó el nuevo workspace) y está committeado.
- El job debe ser nombrado `domain-tests` (no `normalization-tests`) para reflejar el nombre definitivo del paquete.

---

## Definición de terminado

- [ ] `.github/workflows/ci.yml` contiene el job `domain-tests`
- [ ] El job ejecuta `pnpm --filter @comparafarma/domain test`
- [ ] `domain-tests` corre en paralelo con `api-tests` (mismo nivel en el grafo)
- [ ] Un test roto en `packages/domain/` hace fallar el CI
- [ ] El pipeline completo en `main` está en verde
- [ ] PR revisado y mergeado a `main`
- [ ] **Cierre de épica:** todos los issues CF-101 a CF-110 están en estado `Completado`
