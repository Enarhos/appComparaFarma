# GO LIVE Execution Plan — ComparaFarma

**Tipo:** Plan de ejecución (no auditoría, no evaluación de preparación, no arquitectura). Convierte el Plan de cierre de `docs/launch/PRODUCTION_READINESS_REVIEW.md` v2.0 §4.8 en una secuencia ejecutable, acción por acción, hasta alcanzar el estado GO.
**Fecha de corte:** 2026-08-07
**Fuente única:** `docs/launch/PRODUCTION_READINESS_REVIEW.md` v2.0, §4.8 (Plan de cierre). Este documento no repite ninguna auditoría, no recalcula el Readiness Score, no reevalúa Production Blockers y no modifica la Production Readiness Review. Contiene exactamente las **9 acciones** ya listadas en esa tabla — ninguna agregada, ninguna quitada, ninguna redefinida en su alcance.

**Cómo usar este documento:** ejecutar las acciones en el orden indicado (§2). Cada acción tiene un criterio objetivo de finalización y una evidencia esperada — una acción solo pasa a ✅ Resuelta cuando esa evidencia existe, no antes. El estado **GO** (según el Veredicto de la PRR v2.0 §4.9) se alcanza al completar la Acción 8, que es, literalmente, el acto de publicar. La Acción 9 no bloquea ni condiciona el GO — puede resolverse en cualquier momento, antes o después.

---

## 1. Resumen de acciones (estado inicial)

| # Orden | Tarea (idéntica a la PRR §4.8) | Responsable | Esfuerzo | Estado |
|---|---|---|---|---|
| 1 | Confirmar `API_SECRET_KEY` en Vercel de producción | CTO | Bajo | ⬜ Pendiente |
| 2 | Confirmar el mecanismo de submit (`eas.json` a `"production"`, o confirmar por escrito el método manual) | CTO | Bajo | ✅ **Resuelta** (2026-08-07) — Opción B, manual vía Play Console |
| 3 | Resolver cuál ícono y cuál feature graphic son los vigentes | Mario | Bajo | 🔄 **Cambio de estrategia** (2026-08-08) — se abandonó la recuperación de assets históricos/de Play Console; v1.0 usará identidad renovada (DD-003). Ícono y splash con base aprobada; feature graphic con especificación lista (`FEATURE_GRAPHIC_SPEC_V1.md`), falta producir las imágenes finales |
| 4 | Redactar las Release Notes de esta primera publicación | Mario / CTO | Bajo | ✅ **Resuelta** (2026-08-08) — texto final en `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4 |
| 5 | Verificar/corregir la descripción de Store Listing (9 farmacias) | Mario | Bajo | ⬜ Pendiente |
| 6 | Agregar el disclaimer médico estándar a la descripción | Mario | Bajo | ⬜ Pendiente |
| 7 | Agregar 2-3 screenshots adicionales | Mario | Bajo-Medio | ⬜ Pendiente |
| 8 | Promover el track de Prueba Cerrada a Producción y subir el AAB (vc31) | Mario | Bajo | 🟡 **Estado declarado, no verificado contra este plan** — el CTO confirmó en chat (2026-08-08) que "la revisión/promoción ya terminó", lo que levanta la restricción de código sobre `mobile/` (ver `CLAUDE.md`). No se marca Resuelta: esta misma tabla la hace depender de las Acciones 3, 5, 6 y 7, que siguen sin cerrar — no hay, en este repositorio, evidencia de Play Console de que el AAB vc31 esté efectivamente publicado en Producción. Requiere confirmación explícita de Mario en Play Console antes de cerrarse. |
| 9 | Corregir el texto de la Política de Privacidad pública (campo de email del feedback) | CTO | Bajo | ⬜ Pendiente — no bloquea el GO |

---

## 2. Secuencia de ejecución

### Acción 1 — Confirmar `API_SECRET_KEY` en Vercel de producción

- **Responsable:** CTO
- **Dependencias:** Ninguna. Puede ejecutarse primero o en paralelo con las Acciones 2-4.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** la variable `API_SECRET_KEY` está confirmada como configurada (con un valor no vacío) en el proyecto `comparafarma-api` de Vercel, entorno Production — no Preview.
- **Evidencia esperada para marcarla Resuelta:** captura o confirmación textual del dashboard de Vercel (`comparafarma-api` → Settings → Environment Variables → Production) mostrando `API_SECRET_KEY` presente, o confirmación directa de quien tiene acceso.

### Acción 2 — Confirmar el mecanismo de submit — ✅ RESUELTA (2026-08-07)

- **Responsable:** CTO
- **Dependencias:** Ninguna.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** una de las dos siguientes queda resuelta y registrada: (a) `mobile/eas.json` tiene `submit.production.android.track` en `"production"`; o (b) queda una confirmación por escrito de que la publicación se hará por el método manual (`pnpm build:android` + subida manual del AAB a Play Console), sin usar `eas submit`.
- **Evidencia esperada para marcarla Resuelta:** diff del archivo `mobile/eas.json` mostrando el valor corregido, **o** el registro escrito de la decisión de usar el método manual (correo, mensaje o entrada en el propio Plan de cierre de la PRR).

**Resolución (Opción B — manual vía Play Console).**

- **Verificación previa realizada:** `mobile/eas.json` confirmado hoy con `submit.production.android.track: "internal"` (sin cambios respecto a la PRR v2.0). `CLAUDE.md` §"Publicación" revisado línea por línea: documenta un método preferido explícito para el **build** del AAB (`pnpm build:android`, "sin cuota EAS"), pero no contiene ninguna decisión registrada sobre el mecanismo de **submit** (`eas submit` vs. subida manual) — no había evidencia suficiente en el repositorio para resolver esto sin una decisión operativa nueva.
- **Decisión tomada (por el CTO, en esta sesión, 2026-08-07):** la publicación se realizará **manualmente vía Google Play Console** — build local con `pnpm build:android`, subida manual del AAB (vc31) a la consola, sin usar `eas submit`.
- **Justificación:** consistente con el patrón ya documentado del proyecto de evitar dependencia de cuota EAS (mismo criterio ya aplicado al método de build en `CLAUDE.md`); no introduce una dependencia nueva de credenciales EAS↔Play Console; no requiere ningún cambio de configuración.
- **`mobile/eas.json`:** **no se modificó**, por instrucción explícita de la Opción B ("cerrar la Acción 2 sin modificar `eas.json` innecesariamente"). El valor `"internal"` de `submit.production.android.track` queda como está — es irrelevante para la publicación real porque `eas submit` no se usará. Si en el futuro se decidiera adoptar `eas submit`, ese valor deberá corregirse a `"production"` antes de usarlo (queda como nota para quien retome esa vía, no como una tarea de esta Acción).
- **Código modificado:** ninguno. No aplica Pull Request — la Opción B, tal como la define este ticket, no requiere cambios de código, solo el registro documental de la decisión, ya incorporado en esta misma entrada.
- **Estado final:** ✅ **Resuelta.**

### Acción 3 — Resolver cuál ícono y cuál feature graphic son los vigentes — ⚠️ PARCIALMENTE RESUELTA (2026-08-08)

- **Responsable:** Mario
- **Dependencias:** Ninguna.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** queda un único archivo de ícono (`mobile/assets/icon.png` **o** `icon_new.png`, no ambos activos) y un único feature graphic (`mobile/assets/feature-graphic.png` **o** `docs/screenshots/feature_graphic.png`, no ambos activos) — el archivo descartado se archiva o elimina — y queda confirmado cuál de los dos está efectivamente subido en Play Console.
- **Evidencia esperada para marcarla Resuelta:** confirmación de cuál archivo se subió a Play Console (captura de la ficha de la app en Play Console, sección Presencia en Google Play → Elementos gráficos) y, del lado del repositorio, que solo queda un archivo vigente por elemento (el otro archivado/eliminado).

**Resolución (parcial).**

- **Auditoría previa realizada:** `git log --follow` sobre los 4 archivos en disputa, más lectura de `app.json` y de los mensajes de commit reales:
  - **Ícono:** `mobile/assets/icon.png` es el ícono vigente — es el único referenciado en `mobile/app.json` (`"icon": "./assets/icon.png"`) y coincide con el commit `80f8f99` ("chore: bump version to 1.4.0 ... nuevo icono: fondo verde #16a34a, cápsula blanca con divisor, flecha abajo"), que modificó ese mismo archivo. `icon_new.png` (1024×1024, agregado en el mismo commit) nunca quedó referenciado en `app.json` ni en ningún otro archivo de configuración del proyecto — es un archivo huérfano, probablemente un intermedio de diseño no descartado a tiempo.
  - **Feature graphic:** `docs/screenshots/feature_graphic.png` es el vigente — el commit `5b2fcb4` ("fix: seguridad, bugs y dark mode", 2026-06-29) lo actualiza explícitamente con el mensaje "feature_graphic.png: actualizado a 9 farmacias (era 3)", coincidiendo con el estado real de la app (9 farmacias). `mobile/assets/feature-graphic.png` resultó ser un **duplicado byte-idéntico** (mismo MD5) de `mobile/assets/old/feature-graphic.png` — el respaldo de la versión anterior de 3 farmacias, ya obsoleta.
- **Acción tomada en el repositorio (confirmada explícitamente por el CTO antes de tocar archivos dentro de `mobile/`, dado que la app sigue en Prueba Cerrada):**
  - `mobile/assets/icon_new.png` → archivado a `mobile/assets/old/icon_new.png` (`git mv`).
  - `mobile/assets/feature-graphic.png` → eliminado (`git rm`), al ser un duplicado exacto ya respaldado en `mobile/assets/old/feature-graphic.png`.
  - Ningún archivo referenciado por `app.json` fue tocado (`icon.png`, `adaptive-icon.png`, `splash.png` sin cambios) — sin efecto sobre el binario ya en revisión en Play Console: ninguno de los dos archivos descartados se compila en el AAB (el feature graphic nunca se empaqueta en el binario; `icon_new.png` nunca estuvo wireado a ningún build step).
  - Queda un único archivo vigente por elemento en el repositorio: `mobile/assets/icon.png` y `docs/screenshots/feature_graphic.png`.
- **Pendiente (no resuelto por esta sesión):** confirmar cuál de los dos está **efectivamente subido hoy en Play Console** (sección Presencia en Google Play → Elementos gráficos) — esto requiere acceso directo a la consola, que esta sesión no tiene. El Mario confirmará esto directamente y, si el archivo subido no coincide con el vigente del repositorio, deberá volver a subirse antes de la Acción 8.
- **Código modificado:** solo archivos de `mobile/assets/` (ver arriba) — no hay cambios de lógica ni de configuración de build.
- **Estado final (antes de la verificación siguiente):** ⚠️ **Parcialmente resuelta** — repositorio consolidado a un único archivo vigente por elemento (con evidencia); queda pendiente la confirmación de Mario en Play Console para cerrarla del todo.

**Verificación posterior (2026-08-08) — hallazgo que corrige la resolución anterior.**

Mario confirmó vía captura de pantalla el contenido real de "Ficha de Play Store predeterminada → Gráficos" en Play Console. Comparación visual directa:

- **Ícono realmente subido en Play Console:** cuadrado azul con tarjeta de precio + cápsula + casita/cruz de farmacia.
- **Feature graphic realmente subido en Play Console:** fondo azul/turquesa, mockup de teléfono, texto "Compara precios de medicamentos" + "Encuentra el mejor precio cerca de ti" + 3 iconos de pasos.

**Ninguno de los dos coincide con ningún archivo encontrado en el repositorio** — se verificó visualmente contra `mobile/assets/icon.png` (verde, cápsula con flecha), `mobile/assets/icon_new.png` (verde, variante), `docs/design/assets/brand-experience/09_app_icon.png` (isotipo morado/índigo) y `docs/screenshots/feature_graphic.png` (fondo verde, texto plano con las 9 farmacias). Se buscó también por texto característico del feature graphic real ("Busca tu medicamento", "Ahorra dinero") en todo el repositorio — sin resultados.

**Conclusión:** el ícono y el feature graphic vigentes en producción (Play Console) fueron subidos directamente a la consola en algún momento, sin quedar respaldados en el repositorio. La limpieza de duplicados/huérfanos ya realizada (`icon_new.png` archivado, `mobile/assets/feature-graphic.png` eliminado por ser un duplicado exacto del respaldo) **sigue siendo válida** — esos dos archivos eran objetivamente redundantes dentro del repo, independientemente de este hallazgo. Lo que queda invalidado es la afirmación de que `icon.png` y `docs/screenshots/feature_graphic.png` son "los vigentes": son los únicos que sobreviven en el repo, pero no son los que está usando Play Console hoy.

- **Decisión de Mario:** no tiene los archivos originales guardados fuera de Play Console; deberán descargarse directamente desde la consola (Play Console permite descargar los recursos gráficos ya subidos en la sección Gráficos de cada elemento).
- **Pendiente real para cerrar la Acción 3 (según ese hallazgo):** Mario descarga desde Play Console el ícono (512×512 PNG) y el feature graphic (1024×500) actualmente publicados, y los agrega al repositorio para que quede sincronizado con lo que ve el usuario final en Play Store.

**Cambio de estrategia (2026-08-08, misma sesión) — la búsqueda de assets históricos/de Play Console queda cancelada por decisión del CTO.**

En lugar de recuperar los assets ya publicados, la versión de Producción v1.0 usará una **identidad visual renovada**, basada en la Fase de Identidad Visual ya cerrada (`docs/design/DESIGN_DECISION_LOG.md` DD-002, 2026-08-06). Trabajo realizado en esta sesión, en orden:

1. **Inventario de requisitos de Google Play** — `docs/release/GRAPHIC_ASSETS_INVENTORY_V1.md`: qué exige Play Store (ícono 512×512, feature graphic 1024×500, capturas, adaptive icon, splash) vs. qué exige la plataforma Android/Expo para compilar el binario. Ningún asset histórico del repo se reutiliza.
2. **Identificación de qué activos ya aprobados aplican a cada slot** — se verificó con evidencia (no se asumió) que `docs/design/BRAND_IDENTITY_VALIDATION.md` mantiene el isotipo Candidato 09 en estado "Aprobar con ajustes" (4 condiciones sin resolver) y que ningún documento tiene ratificación de CEO/fundador — hallazgo escalado al CTO, quien decidió proceder aceptando el riesgo.
3. **DD-003** (`docs/design/DESIGN_DECISION_LOG.md`) — registra formalmente la adopción del Candidato 09 como base de producción para: ícono (`09_app_icon.png`), splash (`10_splash.png`) y 4 de las 5-6 capturas recomendadas (`02_home_mobile.png`, `03_search.png`, `04_results.png`, `05_medication_detail.png`). Los 4 ajustes pendientes del isotipo quedan abiertos y no bloqueantes.
4. **`GRAPHIC_ASSETS_INVENTORY_V1.md`** actualizado con el mapeo activo↔slot completo. Sin base aprobada: el feature graphic (ninguna pieza equivalente existe) y las capas de Adaptive Icon (fondo/monochrome).
5. **Acción 3B — `docs/design/FEATURE_GRAPHIC_SPEC_V1.md`** (2026-08-08): especificación de diseño completa del feature graphic (componentes, jerarquía, copy reutilizado literalmente del Hero de Home ya validado, restricciones, checklist de validación). No se generó ninguna imagen — es solo la especificación para producirla.

**Pendiente para continuar (sesión siguiente):**
- Producir las imágenes finales: ícono 512×512 y 1024×1024 a partir de `09_app_icon.png`, splash a partir de `10_splash.png`, feature graphic siguiendo `FEATURE_GRAPHIC_SPEC_V1.md`, y 1-2 capturas de pantalla adicionales (historial de precios, alertas o carrito — sin mockup en Brand Experience v1 todavía).
- Recomponer `09_app_icon.png` en formato Adaptive Icon con zona segura, y definir fondo/monochrome (sin base aprobada, ver `GRAPHIC_ASSETS_INVENTORY_V1.md` §3, ítems 7-9).
- Resolver, en paralelo y sin bloquear v1.0, los 4 ajustes pendientes del isotipo (riesgo aceptado en DD-003, no resuelto todavía).
- Una vez producidas las imágenes: subirlas a Play Console (fuera del alcance de esta sesión — no se tocó Play Console) y recién entonces marcar la Acción 3 como ✅ Resuelta.
- **Estado final de esta sesión:** 🔄 **Cambio de estrategia, en progreso** — ya no es "recuperar assets existentes" sino "producir assets nuevos bajo identidad renovada". Especificación y decisiones de gobierno completas; producción de imágenes finales queda para la próxima sesión.

### Acción 4 — Redactar las Release Notes de esta primera publicación — ✅ RESUELTA (2026-08-08)

- **Responsable:** Mario / CTO
- **Dependencias:** Ninguna.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** existe un texto de "novedades de esta versión" listo para cargarse en Play Console al momento de crear la versión de Producción.
- **Evidencia esperada para marcarla Resuelta:** el texto de Release Notes, redactado y disponible (borrador escrito, en cualquier documento o directamente cargado en el campo correspondiente de Play Console).

**Resolución.**

- **Auditoría previa:** se encontró un borrador ya existente y nunca cerrado en `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4 (327/500 caracteres), redactado como changelog de versión ("v1.4.0 ... sumamos X farmacias"). Verificado contra `CLAUDE.md` §"Funcionalidades Implementadas" y contra el código real (`mobile/src/app/cart.tsx`, título de pantalla "Lista de compras") — el contenido factual era correcto, ninguna funcionalidad inventada.
- **Punto escalado al CTO (no asumido):** ese borrador asumía usuarios que ya conocían una versión previa — pero esta es la primera publicación jamás hecha en el track de Producción. Se preguntó explícitamente cómo proceder.
- **Decisión del CTO:** reescribir el texto como presentación de v1 (no como changelog), manteniendo únicamente contenido ya verificado (9 farmacias reales, funcionalidades reales, terminología real de la app).
- **Texto final** (392/500 caracteres) — ver `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4 para el texto completo y su nota de redacción.
- **Documentos actualizados:** `docs/release/PLAY_CONSOLE_CHECKLIST.md` §1.4 (texto final + nota de redacción + estado). Ningún otro documento fue modificado; no se creó documentación paralela.
- **Código modificado:** ninguno. No aplica Pull Request de código — el cambio es exclusivamente de contenido de texto para Play Console, documentado en el repositorio.
- **Riesgos conocidos:** ninguno técnico. Riesgo editorial (tono/estilo del texto) ya resuelto por decisión directa del CTO.
- **Compatibilidad:** sin impacto en código, build ni configuración.
- **Estado final:** ✅ **Resuelta.**

### Acción 5 — Verificar/corregir la descripción de Store Listing

- **Responsable:** Mario
- **Dependencias:** Ninguna.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** la descripción de la ficha de Play Console menciona las 9 farmacias reales (Cruz Verde, Salcobrand, Farmacias Ahumada, Dr. Simi, AraucoMed, EcoFarmacias, Farmex, Sermecoop, EasyFarma), no una cifra o listado desactualizado.
- **Evidencia esperada para marcarla Resuelta:** texto final de la descripción (revisado o corregido) con las 9 farmacias mencionadas, confirmable directamente en Play Console.

### Acción 6 — Agregar el disclaimer médico estándar a la descripción

- **Responsable:** Mario
- **Dependencias:** Ninguna. Puede ejecutarse junto con la Acción 5 (misma sección de Play Console).
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** la descripción de Store Listing incluye una frase de deslinde médico estándar (ej. "No reemplaza la consulta médica").
- **Evidencia esperada para marcarla Resuelta:** texto final de la descripción mostrando la frase incorporada.

### Acción 7 — Agregar 2-3 screenshots adicionales

- **Responsable:** Mario
- **Dependencias:** Ninguna.
- **Esfuerzo:** Bajo-Medio
- **Criterio objetivo de finalización:** la ficha de Play Console tiene entre 5 y 6 screenshots en total (las 3 ya existentes más 2-3 nuevas), cubriendo historial de precios, alertas y carrito.
- **Evidencia esperada para marcarla Resuelta:** las imágenes nuevas presentes en `docs/screenshots/` (o equivalente) y confirmación de que están subidas en la sección de Elementos gráficos de Play Console.

### Acción 8 — Promover el track de Prueba Cerrada a Producción y subir el AAB

- **Responsable:** Mario
- **Dependencias:** Acciones 2, 3, 4, 5, 6 y 7 completas. (No depende de la Acción 1 — la confirmación de `API_SECRET_KEY` es una acción de seguridad de backend, independiente del flujo de publicación en Play Console, según la propia PRR v2.0 §4.6/§4.7.)
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** el AAB con `versionCode 31` queda publicado en el track de Producción de Play Console, usando el mecanismo confirmado en la Acción 2.
- **Evidencia esperada para marcarla Resuelta:** Play Console → Producción → Versiones muestra el `versionCode 31` en estado publicado o en revisión. **Este es el hito que corresponde al estado GO** definido en `docs/launch/PRODUCTION_READINESS_REVIEW.md` v2.0 §4.9.

### Acción 9 — Corregir el texto de la Política de Privacidad pública

- **Responsable:** CTO
- **Dependencias:** Ninguna. No depende de ninguna acción anterior ni es requisito de ninguna posterior — puede resolverse antes, durante o después de la Acción 8, sin afectar el estado GO.
- **Esfuerzo:** Bajo
- **Criterio objetivo de finalización:** el texto publicado en `https://enarhos.github.io/appComparaFarma/privacy-policy.html` refleja con precisión que el formulario de feedback de la app solicita un correo electrónico de forma opcional, en vez de afirmar que la app no solicita ningún dato de contacto.
- **Evidencia esperada para marcarla Resuelta:** la página pública, verificada con una nueva carga (`GET` a la URL), muestra el texto corregido.

---

## 3. Camino crítico al estado GO

```
Acción 2 ──┐
Acción 3 ──┤
Acción 4 ──┼──► Acción 8 (publicar) ──► ESTADO GO
Acción 5 ──┤
Acción 6 ──┤
Acción 7 ──┘

Acción 1 — independiente, sin efecto sobre el camino crítico
Acción 9 — independiente, sin efecto sobre el camino crítico
```

Las Acciones 2 a 7 no tienen dependencias entre sí — pueden ejecutarse en cualquier orden interno o en paralelo entre distintos responsables (CTO vs. Mario); el orden de §1-§2 es una secuencia recomendada para ir cerrándolas una por una, no una cadena técnica obligatoria salvo por su convergencia común en la Acción 8. Las Acciones 1 y 9 pueden resolverse en cualquier momento, sin afectar cuándo se alcanza el GO.

---

## 4. Validación final

- **Documento fuente:** `docs/launch/PRODUCTION_READINESS_REVIEW.md` v2.0, §4.8 (Plan de cierre) — no modificado.
- **Auditoría nueva realizada:** ninguna. No se revisó código, no se recalculó el Readiness Score, no se reevaluaron los Production Blockers.
- **Acciones:** exactamente 9, idénticas en contenido a la fuente — ninguna agregada, ninguna quitada.
- **Documento creado:** `docs/release/GO_LIVE_EXECUTION_PLAN.md` (este documento).

Este documento queda a la espera de que el CTO ejecute y vaya marcando cada acción, en el orden indicado, hasta alcanzar el estado GO en la Acción 8.
