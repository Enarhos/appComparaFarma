# Backlog de Producto

Backlog vivo derivado de `PRODUCT_REVIEW_V1.md` (2026-06-30). Estado verificado contra el código real el 2026-07-19 — el review original ya estaba desactualizado (2 ítems se habían resuelto sin quedar registrados). Convención: ✅ Hecho · 🟡 Parcial (falta algo puntual) · ❌ Pendiente.

## v1.5 — Mejoras sin cambios de arquitectura

| # | Ítem | Impacto | Esfuerzo | Estado | Nota |
|---|---|---|---|---|---|
| v15-01 | Eliminar ícono de micrófono falso en SearchBar | Alto | Bajo | ✅ Hecho | Ya no existe en el código (verificado, sin fecha de commit identificada) |
| v15-02 | Tooltip de canales de precio en detalle | Alto | Medio | 🟡 Parcial | `PriceChannelSheet.tsx` existe y funciona, pero se dispara desde `results.tsx`, no desde la tarjeta de farmacia en `medication.tsx` como pedía el review |
| v15-03 | DonationBanner con descarte temporal (7 días), parametrizable en consola | Alto | Bajo | ✅ Hecho (2026-07-19) | Descarte ahora expira (`dismissDays`, default 7); además el banner completo se puede apagar remotamente con `DONATION_BANNER_ENABLED` en Vercel, mismo patrón que `DISABLED_PHARMACIES`. Servido vía `/api/config`. Verificado en emulador |
| v15-04 | Pantalla "Mis alertas" separada | Alto | Medio | ❌ Pendiente | Alertas solo se gestionan una por una desde el detalle de cada medicamento |
| v15-05 | Indicador de filtro activo en Resultados (chip dismissible) | Alto | Bajo | ✅ Hecho (2026-07-19) | Chips individuales por comuna/farmacias ocultas/solo despacho, cada uno con botón de cierre. Verificado en emulador |
| v15-06 | accessibilityLabel en componentes críticos | Alto | Medio | 🟡 Parcial | Solo `DonationBanner` tiene accessibility; faltan `MedicationListItem`, `SkeletonCard`, `SearchBar`, `PriceHistoryChart`, `AlertSheet`, `FilterSheet`, `InAppToast` |
| v15-07 | Mensaje en primer snapshot de historial de precio | Alto | Bajo | ✅ Hecho (2026-07-19) | Además se encontró y arregló una condición de carrera pre-existente en `medication.tsx` (`recordPriceSnapshot` no se esperaba antes de `getPriceHistory`) que impedía que esto funcionara incluso implementado. Verificado en emulador |
| v15-08 | Explicar "bioequivalente" in-context (tooltip) | Medio | Bajo | ❌ Pendiente | Solo badges, sin tooltip explicativo |
| v15-09 | Comunicar límite del carrito (5/8) | Medio | Bajo | ❌ Pendiente | El límite de 8 existe en `cartStore` pero no se comunica en la UI |
| v15-10 | Mostrar qué medicamento falta en cobertura parcial del carrito | Medio | Medio | 🟡 Parcial | Se muestra el conteo ("2 de 3") pero no el nombre del que falta |
| v15-11 | Versión de la app visible en "Acerca de" | Medio | Bajo | ✅ Hecho (2026-07-19) | `about.tsx` ahora muestra "v1.4.0 (31)" leyendo `app.json` directamente, verificado en emulador |
| v15-12 | Reestructurar pantalla "Acerca de" | Medio | Bajo | 🟡 Parcial | Ya tiene separadores visuales, pero sigue siendo una sola pantalla mezclando feedback + info institucional |
| v15-13 | Fix DonationBanner en dark mode | Medio | Bajo | ✅ Hecho | `dark:bg-rose-950` ya aplicado |
| v15-14 | Toast de confirmación de alerta con copy mejorado | Medio | Bajo | ❌ Pendiente | Solo hay feedback háptico, sin toast |
| v15-15 | Confirmación al salir de la app ("Ver en farmacia") | Bajo | Bajo | ❌ Pendiente | `Linking.openURL` directo, sin aviso previo |
| v15-16 | Refetch de `/api/config` al volver a foreground (o polling periódico) | Medio | Bajo | ❌ Pendiente — bloqueado | `_layout.tsx` solo llama `fetchConfig()` una vez al montar la app. Los cambios hechos desde `/admin/config` (ej. apagar el banner de donación) no se reflejan hasta cerrar la app por completo y reabrirla — verificado 2026-07-20. Requiere tocar `mobile/`, congelado por Prueba Cerrada de Google Play (ver restricción en `COMPANY_STRATEGY.md` §5) — retomar cuando se levante |

## v2.0 — Requiere backend/arquitectura nueva

Ver `PRODUCT_REVIEW_V1.md` sección 17 — no re-verificado contra código (son features nuevas, no fixes, así que es poco probable que ya existan). Los dos de mayor impacto: push notifications para alertas (`v20-01`) y tab bar de navegación persistente (`v20-02`).

## Confiabilidad Backend — scoreado CFPS (aditivo sobre `api/`, no toca `mobile/`)

| # | Ítem | CFPS | Clasificación | Nota |
|---|---|---|---|---|
| CF-111 | Investigar timeout persistente de AraucoMed en producción (Vercel) — issue completo en `docs/engineering/issues/CF-111_INVESTIGATE_ARAUCOMED_TIMEOUT.md` | 3.2 | ✅ Cerrado (2026-07-31) — monitoreo pasivo | VU=2 (1 de 9 farmacias, complementaria no top-4), VN=3 (confiabilidad de datos), DF=3, IE=4 (Objetivo 1: "cobertura estable de farmacias"), CT=4 (investigación simple, 1-2h), CM=4, RG=5 (aditivo, no toca otros clientes). Detectado 2026-07-19, sin resolver a 2026-07-28 (9 días). **Cerrado el 2026-07-31**: 5/5 corridas en producción con `araucomed` fulfilled, sin reproducir el timeout — no persistente, no se aplicó mitigación de código. Reabrir si reaparece con frecuencia (ahí sí revisar logs de Vercel, no disponibles en esta sesión). |

---

*Backlog derivado de `docs/product/PRODUCT_REVIEW_V1.md`. Actualizar el estado acá cuando se cierre un ítem — no dejar que este documento se desactualice como pasó con el original.*
