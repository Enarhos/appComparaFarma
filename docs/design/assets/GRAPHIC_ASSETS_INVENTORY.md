# Inventario de Activos Gráficos Oficiales — Producción v1.0

**Fecha:** 2026-08-08
**Tipo:** Inventario de requisitos (no auditoría de código, no decisión de diseño, no publicación).
**Contexto:** la versión de Producción de ComparaFarma utilizará una identidad visual renovada. Este documento reemplaza la búsqueda de activos gráficos históricos (icon.png, icon_new.png, feature-graphic.png, docs/design/assets/play-store/feature_graphic.png) — esa búsqueda queda cancelada por decisión explícita del CTO (2026-08-08). Ningún activo existente en el repositorio se reutiliza para v1.0.

**Alcance de esta Task:**
- ✅ Revisar qué recursos gráficos exige Google Play para publicar la ficha de la tienda.
- ✅ Revisar qué recursos gráficos exige la plataforma (Android/Expo) para compilar el binario.
- ✅ Generar el inventario definitivo de activos a diseñar para v1.0.
- ❌ No se modificó código.
- ❌ No se recuperaron ni reutilizaron imágenes antiguas del repositorio.
- ❌ No se actualizó Play Console.

**Fuentes consultadas (oficiales, verificadas hoy):**
- Google Play Console — Ayuda: [Agrega recursos de vista previa para promocionar tu app](https://support.google.com/googleplay/android-developer/answer/9866151?hl=es-419)
- Expo Docs: [Splash screen and app icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/) (última actualización oficial: 26 de junio de 2026)

---

## 1. Sección A — Recursos exigidos por Google Play (ficha de la tienda)

Estos son los activos que Play Console exige (u ofrece) en **Aumenta la cantidad de usuarios → Presencia en Play Store → Fichas → [ficha predeterminada]**, sección "Gráficos". Ninguno de estos se compila dentro del AAB — se suben directamente a la consola.

| Asset | Obligatorio para publicar | Especificación técnica | Uso en Google Play |
|---|---|---|---|
| Ícono de la app (ficha de tienda) | **Sí** | PNG de 32 bits **con alfa**, 512×512 px, máx. 1024 KB. Debe cumplir las [especificaciones de diseño de íconos de Google Play](https://developer.android.com/google-play/resources/icon-design-specifications). Sin insignias, textos de clasificación/precio ni elementos engañosos. | Ficha de Play Store, resultados de búsqueda, colecciones destacadas. |
| Gráfico de funciones (feature graphic) | **Sí** | JPEG o PNG de 24 bits (**sin alfa**), 1024×500 px. | Portada del video de vista previa (si existe), colecciones de apps destacadas, anuncios. |
| Capturas de pantalla de teléfono | **Sí** (mínimo 2) | JPEG o PNG de 24 bits (sin alfa). Mínimo 2, máximo 8. Tamaño entre 320 px y 3840 px; el lado mayor no puede superar 2× el lado menor. | Ficha de Play Store, búsqueda, página principal. |
| Capturas de pantalla — pantallas grandes (tablet/Chromebook) | Opcional (recomendado si se distribuye en esos formularios) | Si se proveen, mínimo 4. Resolución 1080–7680 px. Relación 16:9 (horizontal) o 9:16 (vertical). | Elegibilidad para recomendaciones en formato grande. |
| Video de vista previa | Opcional | No es un archivo subido — se ingresa una URL pública o no listada de YouTube, sin monetización activa. | Se reproduce antes de las capturas en la ficha; puede autoreproducirse silenciado hasta 30s. |
| Banner de Android TV | No aplica | — | ComparaFarma no distribuye para Android TV. |
| Recursos de Wear OS / caras de reloj / Android Automotive / Android XR | No aplica | — | ComparaFarma no distribuye para esas plataformas. |

**Nota:** la descripción breve (80 caracteres) y la descripción completa son texto, no activos gráficos — quedan fuera de este inventario por instrucción explícita del alcance ("activos gráficos").

---

## 2. Sección B — Recursos exigidos por la plataforma (Android/Expo) para compilar el binario

Estos activos **sí** se empaquetan dentro del AAB — viven en `mobile/assets/` y se referencian desde `mobile/app.json`. Cualquier cambio aquí requiere una nueva compilación (nuevo build, potencialmente nuevo `versionCode`) y toca archivos dentro de `mobile/` — ver riesgo en la sección 4.

| Asset | Propiedad en `app.json` | Especificación técnica (Expo, oficial) | Obligatorio |
|---|---|---|---|
| Ícono de la app (binario) | `icon` | PNG, 1024×1024 px recomendado. | Sí |
| Adaptive Icon — capa foreground (Android) | `android.adaptiveIcon.foregroundImage` | PNG, 1024×1024 px, respetando la zona segura de las [Android Adaptive Icon Guidelines](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive). | Sí (Android) |
| Adaptive Icon — fondo | `android.adaptiveIcon.backgroundColor` **o** `backgroundImage` | Color sólido, o imagen con las mismas dimensiones que el foreground. | Sí (uno de los dos) |
| Adaptive Icon — capa monochrome (ícono temático Android 13+) | `android.adaptiveIcon.monochromeImage` | PNG, mismo lineamiento que el foreground. | Opcional, recomendado |
| Ícono de respaldo Android (dispositivos sin Adaptive Icon) | `android.icon` | PNG — combinación ya aplanada de foreground + fondo. | Opcional |
| Ícono de splash screen | Propiedad `image` del plugin `expo-splash-screen` | PNG, 1024×1024 px, **fondo transparente**. | Sí |
| Color de fondo del splash | Propiedad `backgroundColor` del plugin `expo-splash-screen` | Color sólido a definir junto con la nueva identidad. | Sí |

---

## 3. Inventario consolidado — Activos a diseñar para v1.0

**Actualización 2026-08-08:** la búsqueda de activos históricos había sido cancelada (ver encabezado). Desde entonces se identificó que la Fase de Identidad Visual (Brand Experience v1) sí tiene un cierre formal de comité — `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-002 (2026-08-06) — que congela 13 piezas en `docs/design/assets/brand-experience/`. El CTO decidió (DD-003, 2026-08-08) usar 6 de esas piezas como base de producción para varios de los ítems de este inventario, **aceptando como riesgo no bloqueante** que el isotipo aplicado (Candidato 09) mantiene una recomendación de "Aprobar con ajustes" sin resolver en `docs/design/BRAND_IDENTITY_VALIDATION.md`. Ningún archivo del repositorio histórico anterior (`icon.png`, `icon_new.png`, `feature-graphic.png`, `docs/design/assets/play-store/feature_graphic.png`, `docs/screenshots/screenshot_*.png`) se reutiliza — la base ahora es exclusivamente Brand Experience v1.

| # | Activo | Categoría | Especificación | Obligatorio | Base aprobada (DD-003) | Ruta destino sugerida |
|---|---|---|---|---|---|---|
| 1 | Ícono de ficha de Play Store | Store | PNG 32-bit con alfa, 512×512, ≤1024 KB | Sí | `docs/design/assets/brand-experience/09_app_icon.png` (riesgo aceptado — ver DD-003) | Subida directa a Play Console (no vive en el repo) |
| 2 | Gráfico de funciones (feature graphic) | Store | PNG/JPEG 24-bit sin alfa, 1024×500 | Sí | `docs/design/FEATURE_GRAPHIC_SPEC_V1.md` — especificación aprobada como base oficial de Producción (ver §3.1 más abajo) | `docs/design/assets/play-store/feature_graphic.png` |
| 3 | Capturas de pantalla de teléfono (mínimo 2, recomendado 5-6) | Store | PNG/JPEG 24-bit sin alfa, 320–3840 px, ratio máx. 2:1 | Sí | `02_home_mobile.png`, `03_search.png`, `04_results.png`, `05_medication_detail.png` (4 de las 5-6 recomendadas; faltan 1-2 más — historial de precios/alertas/carrito no tienen mockup en Brand Experience v1) | `docs/screenshots/screenshot_N_*.png` |
| 4 | Capturas de pantalla pantallas grandes | Store | 1080–7680 px, 16:9/9:16, mínimo 4 si se incluyen | Opcional | Ninguna — sin mockups de tablet/Chromebook en Brand Experience v1 | `docs/screenshots/tablet_*.png` |
| 5 | Video de vista previa | Store | URL de YouTube, no listado o público | Opcional | N/A (no es archivo) | N/A (no es archivo) |
| 6 | Ícono de la app (binario) | Binario/Android | PNG, 1024×1024 | Sí | `09_app_icon.png` (riesgo aceptado — ver DD-003) | `mobile/assets/icon.png` |
| 7 | Adaptive Icon — foreground | Binario/Android | PNG, 1024×1024, con zona segura | Sí | `09_app_icon.png` como fuente del isotipo; requiere recomposición con zona segura de Adaptive Icon (no viene lista en el mockup) | `mobile/assets/adaptive-icon.png` |
| 8 | Adaptive Icon — fondo (color o imagen) | Binario/Android | Color sólido o PNG mismas dimensiones que #7 | Sí | Ninguna pieza dedicada — derivable de `docs/design/brand/COLOR_SYSTEM.md`/`docs/archive/design/research/COLOR_RESEARCH.md`, requiere definición nueva | Color en `app.json` o `mobile/assets/adaptive-icon-bg.png` |
| 9 | Adaptive Icon — monochrome (temático Android 13+) | Binario/Android | PNG, mismo lineamiento que #7 | Opcional (recomendado) | Ninguna — requiere composición nueva | `mobile/assets/adaptive-icon-mono.png` |
| 10 | Ícono de splash screen | Binario/Android+iOS | PNG, 1024×1024, fondo transparente | Sí | `10_splash.png` (riesgo aceptado — ver DD-003) | `mobile/assets/splash.png` |
| 11 | Color de fondo del splash | Binario/Android+iOS | Color sólido a definir | Sí | Derivable de `10_splash.png`/paleta aprobada, requiere confirmación puntual | Valor en `app.json` |

### 3.1 Feature Graphic — actualización de estado (2026-08-08, GO LIVE 1.0 — Acción 3, fase final)

El CTO revisó `docs/design/FEATURE_GRAPHIC_SPEC_V1.md` y la aprobó como **base oficial de Producción**. Ya no está "pendiente de diseño" — la dirección, composición, jerarquía y componentes quedaron fijados en esa especificación, derivados íntegramente de Brand Experience v1 (isotipo Candidato 09, paleta, tipografía Inter, mockup de Home). Lo único pendiente son ajustes menores de copy, concretamente:

- El copy de la especificación (§5 de `FEATURE_GRAPHIC_SPEC_V1.md`) reutiliza cifras del mockup de Home ("$4.200" de ahorro, ejemplo "$1.990 / $2.490 / $500") y la mención "9 farmacias" en el subtítulo — el mismo tipo de contenido temporal que la Acción 4 (Release Notes) acaba de decidir evitar por no ser atemporal. **No se resuelve aquí** — es exactamente el tipo de ajuste menor de copy señalado arriba, y queda pendiente de una revisión editorial puntual antes de producir la imagen final, sin que eso implique reabrir la especificación de diseño ni la identidad.
- Ningún componente, color, isotipo ni jerarquía visual de la especificación se modifica por esta observación.

## 4. Dependencias y riesgos — no resueltos por esta Task (requieren decisión del CTO)

- **Los ítems 6 a 11 viven dentro de `mobile/`.** Cambiarlos implica modificar `mobile/assets/` y `mobile/app.json`, y generar un nuevo build — lo cual choca con la restricción activa en `CLAUDE.md` ("no modificar código de `mobile/` mientras la app esté en Prueba Cerrada"). La Acción 8 de `docs/archive/releases/GO_LIVE_EXECUTION_PLAN.md` ya contempla subir un nuevo AAB a Producción, así que este sería el momento natural para incorporar la identidad renovada — pero decidir si se hace en este mismo ciclo de publicación, o después, es una decisión de alcance/timing que corresponde al CTO. No se asume aquí.
- **Si la identidad renovada también cambia el diseño interno de las pantallas** (no solo ícono/feature graphic/tienda), las capturas de pantalla actuales quedarían obsoletas por partida doble (diseño viejo + identidad vieja) y su recaptura debería esperar a que ese rediseño esté implementado. Este documento no asume ese alcance — queda como pregunta abierta para quien defina la nueva identidad visual.
- **El `versionCode` 31 ya está fijado** como el que se publica según el plan vigente. Si el ícono del binario (ítems 6-10) cambia antes de la Acción 8, probablemente se necesite un `versionCode` nuevo — coordinar con esa Acción, no se modifica `GO_LIVE_EXECUTION_PLAN.md` en esta Task porque no es su alcance.

---

## 5. Estado real de cada activo (2026-08-08 — GO LIVE 1.0, Acción 3, fase final)

Clasificación exclusiva de esta actualización — no reabre DD-002 ni DD-003, no genera imágenes, no modifica Play Console.

| Activo | Documento fuente | Activo origen | Estado | Responsable | Dependencia |
|---|---|---|---|---|---|
| Ícono (ficha Play Store + binario) | `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-003 | `docs/design/assets/brand-experience/09_app_icon.png` | 🟡 Pendiente — base oficial aprobada y vigente; falta exportar el PNG 512×512 (ficha) y 1024×1024 (binario) | Mario (producción de imagen) | Ninguna — puede producirse ya |
| Feature Graphic | `docs/design/FEATURE_GRAPHIC_SPEC_V1.md` | Especificación derivada de `09_app_icon.png` + `02_home_mobile.png` + paleta/tipografía Brand Experience v1 | 🟡 Pendiente — **aprobado como base oficial de Producción; pendientes únicamente ajustes menores de copy** (ver §3.1). No es un diseño pendiente de definir. | Mario/CTO (ajuste de copy) → Mario (producción de imagen) | Ajuste de copy antes de producir la imagen final |
| Splash | `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-003 | `docs/design/assets/brand-experience/10_splash.png` | 🟡 Pendiente — reutiliza el activo aprobado sin cambios; falta exportar el PNG 1024×1024 con fondo transparente | Mario (producción de imagen) | Ninguna — puede producirse ya |
| Screenshots — existentes | Brand Experience v1 (DD-002) | `02_home_mobile.png`, `03_search.png`, `04_results.png`, `05_medication_detail.png` | ✅ Completado — 4 capturas ya existen y están aprobadas, listas para exportar/recortar al formato de Play Store | Mario (exportación) | Ninguna |
| Screenshots — faltantes | — (sin mockup en Brand Experience v1) | Ninguno | 🟡 Pendiente — faltan 1-2 capturas (historial de precios, alertas o carrito); no tienen mockup aprobado todavía | Equipo de diseño | Requiere mockup nuevo antes de poder producirse (no es solo exportación) |
| Adaptive Icon — foreground | `docs/design/decisions/DESIGN_DECISION_LOG.md` DD-003 (isotipo) | `09_app_icon.png` | 🟡 Pendiente — isotipo de base ya aprobado; falta únicamente la derivación técnica (recomposición con zona segura de Adaptive Icon). No se abre una decisión de diseño nueva. | Mario (derivación técnica) | Ninguna — es trabajo de producción, no de diseño |
| Adaptive Icon — fondo/monochrome | — (sin decisión registrada) | Ninguno | 🟡 Pendiente — sin base ni decisión; requiere definir color de fondo (derivable de la paleta ya aprobada) y, opcionalmente, capa monochrome | Mario/CTO (decisión puntual de color) | Ninguna, pero es la única pieza de este inventario sin base ya aprobada |
| Capturas pantallas grandes / Video de vista previa | — | — | 🟡 Pendiente (opcional) — sin decisión de si se produce para v1.0; no se asume una respuesta | CTO (decisión de alcance) | Ninguna |

**Nota de clasificación:** ningún activo de esta tabla es ❌ No aplica — los 11 ítems del inventario original siguen aplicando a v1.0; ninguno fue descartado. Ninguno es ✅ Completado en el sentido de "archivo final entregado", salvo las 4 screenshots ya existentes (que están aprobadas y solo requieren exportación, no producción de contenido nuevo).

---

## 6. Asset Production Plan (2026-08-08 — GO LIVE 1.0, Asset Packaging Sprint)

No se generan imágenes en esta sección — es la planificación exacta de qué se debe exportar, desde qué archivo, en qué formato, y en qué orden. Cuatro etapas: **Diseño** (existe una base/decisión aprobada) → **Packaging** (composición/derivación técnica sobre esa base) → **Exportación** (archivo final en el formato exacto exigido) → **Publicación** (subido a Play Console o empaquetado en el binario).

| Activo | Documento fuente | Archivo origen | Formato requerido | Resolución | Etapa actual | Responsable | Dependencia |
|---|---|---|---|---|---|---|---|
| Ícono — ficha Play Store | DD-003 | `09_app_icon.png` (variante "iOS"/"Android", fondo sólido ya compuesto) | PNG 32-bit con alfa | 512×512 | Packaging → Exportación | Mario | Ninguna |
| Ícono — binario de la app | DD-003 | `09_app_icon.png` | PNG | 1024×1024 | Packaging → Exportación | Mario | Ninguna |
| Feature Graphic | `docs/design/FEATURE_GRAPHIC_SPEC_V1.md` (v2, copy ajustado) | `09_app_icon.png` + `02_home_mobile.png` + paleta Brand Experience v1 | PNG 24-bit sin alfa | 1024×500 | Diseño completo → Packaging | Mario | Ninguna — spec y copy ya cerrados |
| Screenshots oficiales (4) | Brand Experience v1 (DD-002) | `02_home_mobile.png`, `03_search.png`, `04_results.png`, `05_medication_detail.png` | PNG/JPEG 24-bit sin alfa | Recorte a 320–3840 px, ratio ≤2:1 | Diseño completo → Exportación | Mario | Ninguna |
| Screenshots adicionales (1-2) | — (sin mockup) | Ninguno | PNG/JPEG 24-bit sin alfa | Igual que los oficiales | Diseño (sin definir) | Equipo de diseño | Requiere mockup nuevo antes de Packaging |
| Adaptive Icon — foreground | DD-003 + §7 (Propuesta) | `09_app_icon.png` (isotipo blanco, variante "Android") | PNG con alfa | 1024×1024, zona segura ~66% | Packaging | Mario | Ninguna, ver §7 |
| Adaptive Icon — fondo | §7 (Propuesta) | Color sólido derivado de `10_splash.png` / paleta Brand Experience v1 §1 | Valor de color (`app.json`) | N/A (color) | Diseño (propuesto en §7, sujeto a confirmación) | CTO (confirmar) → Mario (aplicar) | Confirmación del CTO sobre la propuesta de §7 |
| Adaptive Icon — monochrome | §7 (Propuesta) | Misma silueta que el foreground | PNG con alfa (silueta de un solo tono) | 1024×1024 | Diseño (propuesto en §7, sujeto a confirmación) | CTO (confirmar) → Mario (aplicar) | Misma que fondo |
| Splash — ícono | DD-003 | `10_splash.png` (isotipo blanco centrado) | PNG, fondo transparente | 1024×1024 | Packaging → Exportación | Mario | Ninguna |
| Splash — color de fondo | DD-003 / Brand Experience v1 §1 | `10_splash.png` (Brand Indigo `#3F3FB8`) | Valor de color (`app.json`) | N/A (color) | Diseño completo | Mario | Ninguna |
| Screenshots pantallas grandes / Video de vista previa | — | — | — | — | Diseño (decisión de alcance no tomada) | CTO | Decisión de si se incluyen en v1.0 |

---

## 7. Propuesta de Adaptive Icon — única decisión de diseño pendiente

**No es una decisión nueva — es una lectura directa de un activo ya aprobado.** `docs/design/assets/brand-experience/09_app_icon.png` (congelado por DD-002, base oficial por DD-003) ya muestra la variante **"Android"** del ícono: un círculo de color sólido con el isotipo Candidato 09 en blanco al centro. Esto es, literalmente, la estructura de un Adaptive Icon (capa de fondo + capa de símbolo), ya resuelta visualmente en el mockup aprobado — no una decisión estética nueva.

**Propuesta única:**

| Capa | Solución propuesta | Evidencia |
|---|---|---|
| **Foreground** | Isotipo Candidato 09 en blanco, sobre fondo transparente, ubicado dentro de la zona segura (~66% del canvas) que exige Android para Adaptive Icons | Es la misma silueta blanca ya usada en la variante "Android" de `09_app_icon.png` — ninguna forma nueva |
| **Background** | Color sólido, Brand Indigo `#3F3FB8` | Es el mismo color de fondo ya usado en la variante "Android" de `09_app_icon.png`, y coincide exactamente con el fondo de `10_splash.png` (también DD-003) y con el rol "Brand (primary)" de `BRAND_EXPERIENCE_V1.md` §1 |
| **Monochrome** (ícono temático Android 13+) | Misma silueta blanca del foreground, sin capa de color propia — Android aplica su propio tinte del sistema | Es la misma geometría en las 4 variantes de `09_app_icon.png` ("iOS", "Android", "Modo oscuro", "Monocromo claro") — la forma del isotipo nunca cambia, solo el contexto de color |

**Por qué no debería requerir una nueva aprobación de diseño:** ninguna de las tres capas introduce una forma, un color o una composición que no esté ya visible en `09_app_icon.png` o `10_splash.png`, ambos congelados por DD-002 y confirmados como base oficial por DD-003. Es packaging técnico (separar capas ya combinadas), no una decisión de identidad nueva.

**Igual, queda sujeta a confirmación explícita del CTO antes de aplicarse** — por instrucción directa de esta Task ("Si requiere aprobación del CTO, detenerse"). No se generó ningún archivo; esta es solo la propuesta.

---

## 8. Packaging Checklist — Asset Pack Oficial v1.0

| Asset | Diseño | Packaging | Exportado | Publicado |
|---|---|---|---|---|
| Ícono — ficha Play Store (512×512) | ✅ | ⬜ | ⬜ | ⬜ |
| Ícono — binario (1024×1024) | ✅ | ⬜ | ⬜ | ⬜ |
| Feature Graphic (1024×500) | ✅ | ⬜ | ⬜ | ⬜ |
| Screenshots oficiales (4) | ✅ | ✅ | ⬜ | ⬜ |
| Screenshots adicionales (1-2) | ⬜ | ⬜ | ⬜ | ⬜ |
| Adaptive Icon — foreground | 🟡 (propuesta §7, falta confirmar) | ⬜ | ⬜ | ⬜ |
| Adaptive Icon — background | 🟡 (propuesta §7, falta confirmar) | ⬜ | ⬜ | ⬜ |
| Adaptive Icon — monochrome | 🟡 (propuesta §7, falta confirmar) | ⬜ | ⬜ | ⬜ |
| Splash — ícono (1024×1024) | ✅ | ⬜ | ⬜ | ⬜ |
| Splash — color de fondo | ✅ | ⬜ | ⬜ | ⬜ |
| Screenshots pantallas grandes | ⬜ (sin decisión de alcance) | ⬜ | ⬜ | ⬜ |
| Video de vista previa | ⬜ (sin decisión de alcance) | ⬜ | ⬜ | ⬜ |

✅ = completo · 🟡 = propuesto, pendiente de confirmación · ⬜ = pendiente

---

## 9. Estado

**Inventario actualizado, sin generar imágenes ni tocar Play Console.** DD-002 y DD-003 confirmados vigentes. El Candidato 09 confirmado como base oficial del ícono, splash y foreground de Adaptive Icon. El Feature Graphic confirmado como aprobado (especificación v2, copy ya ajustado) para Producción — sin ajustes de copy pendientes.

**Lista exacta de lo que sigue pendiente para cerrar la Acción 3 por completo:**
1. Confirmación del CTO sobre la propuesta de Adaptive Icon (§7) — única decisión de diseño abierta.
2. Producción real de los 8 activos con etapa "Diseño completo" (ver §6/§8): exportar los PNG finales en los formatos y resoluciones ya especificados.
3. Packaging técnico del Adaptive Icon (separar capas) una vez confirmada la propuesta de §7.
4. Decidir si se producen 1-2 screenshots adicionales (requiere mockup nuevo) y si se incluyen capturas de pantallas grandes / video de vista previa — decisión de alcance no tomada.
5. Subir todos los activos exportados a Play Console y empaquetarlos en `mobile/assets/` (fuera del alcance de esta Task — no se modifica código ni Play Console aquí).
6. Resolver, en paralelo y sin bloquear v1.0, los 4 ajustes pendientes del isotipo (riesgo ya aceptado en DD-003, no bloqueante).

Ninguno de estos 6 puntos reabre DD-002, DD-003, ni la identidad visual.
