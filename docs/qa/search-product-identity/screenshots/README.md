# SCREENSHOT_REQUIRES_MANUAL_CAPTURE

No hay screenshots en esta campaña, y no se fabricó ninguno.

## Por qué

`web/package.json` declara `@playwright/test ^1.62.1` y un script `test:e2e`, pero el
paquete **no está instalado** en ningún worktree disponible:

```
$ ls C:/Belford/wt-quantity-mismatch/node_modules/.pnpm | grep -i playwright
(vacío)
$ ls C:/Belford/wt-quantity-mismatch/web/node_modules/@playwright
(no existe)
```

Sí están los binarios de navegador cacheados de una instalación anterior
(`C:/Users/Belford/AppData/Local/ms-playwright/chromium-1234`), pero sin el paquete
`playwright` no hay forma de conducirlos. Instalarlo requeriría un `pnpm install` en
un worktree, que está fuera del alcance de una campaña de QA read-only.

En su lugar, la evidencia de navegación de esta campaña es **HTTP real contra
producción**, no simulada: `analysis/nav-check.mjs` y `analysis/nav-resolve-rate.mjs`
leen la página de resultados de `https://www.preciosfarma.cl`, extraen los enlaces de
ficha que la propia página emite, los siguen, y comparan el JSON-LD de la ficha contra
`/api/search`. Los resultados están en `analysis/nav-check.json` y
`analysis/nav-resolve-rate.json`.

## Captura manual pendiente

### QA-SEARCH-002 — ficha que no resuelve

1. Abrir `https://www.preciosfarma.cl/buscar/tapsin`.
2. Buscar la tarjeta **"Tapsin x 6 comprimidos Noche (Maver)"** y hacer clic.
   (URL directa equivalente:
   `https://www.preciosfarma.cl/medicamento/tapsin-x-6-comprimidos-noche-maver-3a14ey6g56zgt`)
3. Capturar la pantalla resultante. Esperado según la evidencia HTTP: la página
   responde **HTTP 200** con `<title>Medicamento no encontrado | PreciosFarma</title>`
   y `robots: noindex`.
4. Confirmar visualmente **qué ve el usuario**: si queda el fallback
   "Cargando ficha del medicamento…" o si se pinta la pantalla de 404. Esto es lo
   único que la evidencia HTTP no determina, porque `notFound()` se emite después de
   que Next ya hizo flush del shell (por eso el 200).
5. Repetir con los otros 6 slugs marcados `resolved: false` en
   `analysis/nav-resolve-rate.json`.

### QA-SEARCH-001 — dosis distintas en una misma tarjeta

1. Abrir `https://www.preciosfarma.cl/buscar/ambroxol`.
2. Localizar la tarjeta cuyo `presentationKey` es
   `ambroxol|100ml|bio:unknown|brand:unknown|form:fluid-oral` (título variable; a las
   01:2x UTC del 2026-08-31 era el jarabe de 100 mL).
3. Capturar la tarjeta expandida mostrando, en la misma comparación,
   `Ambroxol 15 mg/5mL` (Cruz Verde, $5.490) junto a `Ambroxol 30mg/5ml`
   (Sermecoop $2.390 / Ahumada $3.374).

Los precios cambian; lo que debe capturarse es la **coexistencia de dos
concentraciones en una misma tarjeta**, no el monto exacto.
