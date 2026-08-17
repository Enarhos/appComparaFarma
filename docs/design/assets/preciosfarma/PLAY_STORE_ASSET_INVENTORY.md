# Inventario Play Store — Rebranding PreciosFarma (Fase A)

Qué existe ya como candidato en esta Fase A, y qué queda pendiente para cuando se autorice la Fase B (requiere la app ya rebrandeada corriendo para producir screenshots reales).

| Asset | Especificación | Estado en Fase A | Origen / siguiente paso |
|---|---|---|---|
| Ícono de ficha de Play Store | PNG 32-bit con alfa, 512×512, ≤1024 KB | 🟡 Candidato disponible en 1024×1024 (`app-icon/app_icon_android_flat_1024.png`) — falta reescalar/exportar a 512×512 y validar peso | Derivar del mismo master, sin regenerar diseño |
| Gráfico de funciones (feature graphic) | PNG/JPEG 24-bit sin alfa, 1024×500 | ⬜ No generado — requiere copy y composición (isotipo + wordmark + mensaje), fuera de alcance de Fase A (solo "assets maestros de marca", no piezas de marketing compuestas) | Fase B o encargo de diseño separado, usando `logo/logo_horizontal_light-bg.svg` como base |
| Capturas de pantalla de teléfono (mínimo 2) | PNG/JPEG 24-bit sin alfa, 320–3840px | ⬜ No generado — **instrucción explícita de esta tarea**: "No generar screenshots falsos de UI. Los screenshots finales deben provenir de la aplicación real después de implementar el branding" | Requiere Fase B (Mobile con branding aplicado) |
| Capturas pantallas grandes (tablet) | Opcional | ⬜ No aplica todavía | Decisión de alcance pendiente, no relacionada con el rebranding |
| Video de vista previa | Opcional, URL YouTube | ⬜ No aplica | Sin cambios respecto al estado anterior |

## Nota de reutilización

Ningún asset de este inventario reutiliza los assets antiguos ya descartados (`icon.png`, `icon_new.png`, `feature-graphic.png` de `docs/design/assets/play-store/`, cancelados el 2026-08-08 según `docs/design/assets/GRAPHIC_ASSETS_INVENTORY.md`). Tampoco reutiliza los assets actualmente compilados en `mobile/assets/` (verde, sin relación con el isotipo Candidato 09 — ver auditoría de identidad visual, sesión 2026-08-16). Todo lo generado aquí deriva exclusivamente de `docs/design/assets/candidato_09_plano_construccion.svg` y `docs/design/BRAND_EXPERIENCE_V1.md`.
