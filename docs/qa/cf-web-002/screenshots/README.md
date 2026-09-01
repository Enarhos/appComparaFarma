# Screenshots — CF-WEB-002

Capturados con Playwright (Chromium 1.62.1) contra **producción**
(`https://www.preciosfarma.cl`) el 2026-09-01, antes del fix.

| Archivo | Qué muestra |
|---|---|
| `before-ambroxol-30mg-ambiguous.png` | `/medicamento/ambroxol-30mg-5ml-jarabe-100ml-368kw3kmwe8r5` — enlace emitido por la propia página de resultados, respondiendo "Página no encontrada" (CF-WEB-002-002) |
| `before-betametasona-wrong-product.png` | `/medicamento/cam-jarabe-betametasona-0-25-mg-120-ml-lab-chile-3ga6d51u692vz` — la URL de la tarjeta de **0,25 mg** renderizando la ficha completa de **2 mg** (CF-WEB-002-003) |

Comando usado:

```bash
npx playwright screenshot --wait-for-timeout=14000 --viewport-size=1280,760 \
  "<url>" docs/qa/cf-web-002/screenshots/<archivo>.png
```

El `--wait-for-timeout` alto es necesario: la ficha resuelve con una búsqueda en
vivo contra 9 farmacias y sin esperar se captura el esqueleto de carga.

## Estado "después"

`AFTER_SCREENSHOT_REQUIRES_DEPLOY` — no se capturaron capturas del estado
corregido. El fix vive en la branch y **no está desplegado**: cualquier captura
"después" tendría que salir de un `next start` local, que sirve la misma URL
desde `localhost` y no constituye evidencia de producción.

Para capturarlas una vez desplegado a preview o producción:

```bash
npx playwright screenshot --wait-for-timeout=14000 --viewport-size=1280,760 \
  "https://<deploy>/medicamento/ambroxol-30mg-5ml-jarabe-100ml-368kw3kmwe8r5" \
  docs/qa/cf-web-002/screenshots/after-ambroxol-30mg-resolved.png

npx playwright screenshot --wait-for-timeout=14000 --viewport-size=1280,760 \
  "https://<deploy>/medicamento/cam-jarabe-betametasona-0-25-mg-120-ml-lab-chile-3ga6d51u692vz" \
  docs/qa/cf-web-002/screenshots/after-betametasona-404.png
```

Resultado esperado: la primera muestra la ficha de **30 mg/5 mL** (no la de
15 mg/5 mL); la segunda muestra "Página no encontrada" en vez de la ficha de
2 mg — 404 es el resultado correcto cuando la tarjeta de 0,25 mg no está en el
catálogo del momento.
