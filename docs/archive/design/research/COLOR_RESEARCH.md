# COLOR_RESEARCH — Validación de la Dirección Cromática "Intelligence" (VISUAL-002)

**Naturaleza de este documento:** investigación y validación profesional de una dirección cromática ya aprobada por el comité del proyecto. No es un documento de gobernanza (no sigue `docs/templates/GOVERNED_DOCUMENT_TEMPLATE.md`, por instrucción explícita del encargo) y **no elige ninguna paleta**. No se modificó `COLOR_SYSTEM.md`, ningún archivo de código, CSS, Tailwind ni Design Tokens. No se crearon componentes.

**Rol asumido:** Design Director de ComparaFarma. No Product Manager, no Brand Strategist — este documento valida e implementa evidencia sobre una dirección ya decidida por el comité; no reabre la decisión de posicionamiento ("Plataforma de Inteligencia Farmacéutica") ni la arquitectura de marca ya aprobada.

**Resultado esperado de este sprint:** evidencia suficiente para que el Product Manager apruebe una única dirección cromática. La implementación de `COLOR_SYSTEM` y de los Design Tokens comienza **después** de esa aprobación, no en este documento.

---

## 1. Evaluación crítica de la hipótesis "Intelligence"

Hipótesis recibida: Brand = Indigo, Accent = Emerald, Success = Green, Warning = Amber, Error = Red, Information = Sky, Neutrals = Slate.

### Fortalezas

La hipótesis acierta en la estructura, no solo en el tono. Separar Brand de Accent, y aislar cuatro colores de Feedback (Success/Warning/Error/Information) de un Neutral independiente, es exactamente la arquitectura de siete capas que `docs/brand/COLOR_SYSTEM.md` §4.2 ya exige sin nombrar colores — la hipótesis no contradice esa arquitectura, la instancia razonablemente. La elección de una familia fría (indigo/sky/slate) como base es coherente con el atributo ya validado "Científica" (`VISUAL_IDENTITY.md` §4.3) y con las referencias citadas en el propio encargo (Linear, Stripe, Perplexity, Notion), que además coinciden exactamente con las cuatro empresas ya listadas en `docs/design/VISUAL_DIRECTION.md` §7 como referencias de principio — la hipótesis no introduce ninguna referencia nueva fuera de lo ya aprobado.

### Debilidades

**Es, literalmente, la paleta por defecto de Tailwind CSS.** Indigo, Emerald, Amber, Red, Sky y Slate no son solo nombres de color: son los nombres exactos de seis familias del catálogo de color por defecto de Tailwind. `web/` de ComparaFarma usa Tailwind v4. Adoptar esta hipótesis sin ningún ajuste de tono, saturación o luminosidad produciría una identidad indistinguible, a simple vista, de miles de productos SaaS construidos con el mismo framework sin ninguna decisión de marca detrás. Esto no es un defecto menor: `docs/design/DESIGN_BRIEF.md` §4.13 pondera explícitamente "Diferenciación" (10%) como criterio de evaluación, y "Atemporalidad" (5%) — una paleta que se percibe como "el tema por defecto de un framework" envejece mal en ambos criterios en cuanto ese framework cambie sus valores por defecto (lo que ya ha ocurrido antes en la historia de Tailwind).

**Colisión directa con la restricción de marca más específica que existe sobre color.** `docs/design/DESIGN_BRIEF.md` §4.11 es explícito: el color "debe evitar los códigos cromáticos que el usuario asocia automáticamente con farmacia (cruces verdes/rojas tradicionales)". La hipótesis propone exactamente ese par — Success en verde y Error en rojo — como los dos colores de mayor visibilidad después del Brand. Verde y rojo no son arbitrarios en salud: son, literalmente, los dos colores de la cruz farmacéutica. Esto no significa que deban descartarse — Success=verde y Error=rojo son una convención de accesibilidad y usabilidad tan fuerte en el mercado (evidencia de mercado 2026, ver `docs/design/VISUAL_BENCHMARK.md` §2) que reemplazarla generaría más confusión de la que evita — pero exige un tratamiento deliberado (tono, saturación, y sobre todo nunca depender solo del color) que la hipótesis, tal como llegó, no resuelve. Se desarrolla en la sección 3 de este documento.

### Riesgos

1. **Riesgo de posicionamiento:** sin ajuste, la paleta se percibe más cercana a un producto fintech (Mercury, Stripe) que a una plataforma de inteligencia de salud — coherente con el hallazgo ya registrado en `docs/design/VISUAL_BENCHMARK.md` §1 sobre Mercury/Ramp: "es, literalmente, un banco". La dirección "Intelligence" del encargo no es "fintech"; el comité debe validar que las tres opciones de la sección 2 no cruzan esa línea.
2. **Riesgo de escalabilidad:** una paleta de siete familias (Brand, Accent, 4 de Feedback, Neutral) alcanza para los cinco escenarios de esta investigación, pero `docs/design-system/DESIGN_TOKENS.md` §4.4 ya cataloga diez familias de Semantic Tokens, incluida una familia crítica llamada **Comparison** ("presentación de opciones equivalentes entre farmacias... la familia donde más aplicaciones de Neutralidad convergen"). Ninguna de las siete familias de la hipótesis resuelve, por sí sola, cómo se ve "farmacia A" vs. "farmacia B" sin que el color sugiera preferencia — es una familia adicional que faltará declarar cuando se implemente `COLOR_SYSTEM`, no una debilidad de esta hipótesis en particular.
3. **Riesgo de accesibilidad no verificada:** la hipótesis llega sin valores HEX, por lo que ninguno de sus colores puede haberse verificado contra WCAG todavía. Se verifica en la sección 4 de este documento, sobre las tres variantes concretas.

---

## 2. Tres variantes propuestas

Ninguna es definitiva. Las tres respetan la dirección "Intelligence" aprobada por el comité (tecnológica, precisa, clara, neutral, confiable) y evitan las asociaciones restringidas de marca. Los tres mockups de cada opción están en `docs/design/assets/color-exploration/` (`option_A_*`, `option_B_*`, `option_C_*`, en `.svg` y `.png`).

### Option A — Intelligence (Refinada)

Refinamiento directo de la hipótesis: misma estructura fría (indigo/teal/slate), pero con tonos propios (no literales de Tailwind) y Success/Error desplazados fuera del verde/rojo de cruz farmacéutica hacia un verde-bosque y un rojo-ladrillo, ambos desaturados.

| Rol | HEX | RGB | HSL |
|---|---|---|---|
| Brand | `#3F3FB8` | rgb(63, 63, 184) | hsl(240°, 49%, 48%) |
| Accent | `#0E8E86` | rgb(14, 142, 134) | hsl(176°, 82%, 31%) |
| Success | `#2F8F5B` | rgb(47, 143, 91) | hsl(148°, 51%, 37%) |
| Warning | `#B4790E` | rgb(180, 121, 14) | hsl(39°, 86%, 38%) |
| Error | `#B23B33` | rgb(178, 59, 51) | hsl(4°, 55%, 45%) |
| Information | `#1C7DB0` | rgb(28, 125, 176) | hsl(201°, 73%, 40%) |
| Neutral 50 | `#F5F6F7` | rgb(245, 246, 247) | hsl(210°, 11%, 96%) |
| Neutral 100 | `#E7E9EB` | rgb(231, 233, 235) | hsl(210°, 9%, 91%) |
| Neutral 300 | `#C2C7CC` | rgb(194, 199, 204) | hsl(210°, 9%, 78%) |
| Neutral 500 | `#7C848C` | rgb(124, 132, 140) | hsl(210°, 7%, 52%) |
| Neutral 700 | `#454B52` | rgb(69, 75, 82) | hsl(212°, 9%, 30%) |
| Neutral 900 | `#1B1F23` | rgb(27, 31, 35) | hsl(210°, 13%, 12%) |

### Option B — Intelligence Cálida

Misma estructura y misma seriedad técnica, pero con temperatura de color desplazada hacia lo cálido — neutrales con base beige en vez de azulada, Accent en bronce/ámbar en vez de teal, Success más oliva que "verde césped". Responde a la tensión, ya señalada en `docs/design/DESIGN_BRIEF.md` §4.7 y §4.8, entre "Científica/Profesional" y "Cercana" — sin volverse fría.

| Rol | HEX | RGB | HSL |
|---|---|---|---|
| Brand | `#4A4A9E` | rgb(74, 74, 158) | hsl(240°, 36%, 45%) |
| Accent | `#B8763A` | rgb(184, 118, 58) | hsl(29°, 52%, 47%) |
| Success | `#5C8F4E` | rgb(92, 143, 78) | hsl(107°, 29%, 43%) |
| Warning | `#C08A2E` | rgb(192, 138, 46) | hsl(38°, 61%, 47%) |
| Error | `#B5533F` | rgb(181, 83, 63) | hsl(10°, 48%, 48%) |
| Information | `#3E80A3` | rgb(62, 128, 163) | hsl(201°, 45%, 44%) |
| Neutral 50 | `#F7F5F2` | rgb(247, 245, 242) | hsl(36°, 24%, 96%) |
| Neutral 100 | `#EDE8E1` | rgb(237, 232, 225) | hsl(35°, 25%, 91%) |
| Neutral 300 | `#CFC6BA` | rgb(207, 198, 186) | hsl(34°, 18%, 77%) |
| Neutral 500 | `#948A7C` | rgb(148, 138, 124) | hsl(35°, 10%, 53%) |
| Neutral 700 | `#585045` | rgb(88, 80, 69) | hsl(35°, 12%, 31%) |
| Neutral 900 | `#231F1A` | rgb(35, 31, 26) | hsl(33°, 15%, 12%) |

**Advertencia deliberada:** el Accent bronce/ámbar de esta opción está a una distancia de tono corta del amber ya usado como color de "ahorro" (`--save: #b45309`) en el `web/globals.css` actualmente en producción (ver sección 6) — no es un error, pero el comité debe decidir con conocimiento de causa si quiere que Accent y "ahorro" compartan familia de color o se distingan.

### Option C — Intelligence Premium

Misma estructura, pero más oscura, más desaturada y con mayor contraste — un registro más cercano a Linear/Mercury en su versión más restringida: casi monocromática, con los colores de Feedback usados con más disciplina (más oscuros, menos protagonismo) y un Neutral casi negro en el extremo superior.

| Rol | HEX | RGB | HSL |
|---|---|---|---|
| Brand | `#232854` | rgb(35, 40, 84) | hsl(234°, 41%, 23%) |
| Accent | `#1E6E63` | rgb(30, 110, 99) | hsl(172°, 57%, 27%) |
| Success | `#2E6E4C` | rgb(46, 110, 76) | hsl(148°, 41%, 31%) |
| Warning | `#8A6A2E` | rgb(138, 106, 46) | hsl(39°, 50%, 36%) |
| Error | `#8A3A34` | rgb(138, 58, 52) | hsl(4°, 45%, 37%) |
| Information | `#2C5F78` | rgb(44, 95, 120) | hsl(200°, 46%, 32%) |
| Neutral 50 | `#F4F4F5` | rgb(244, 244, 245) | hsl(240°, 5%, 96%) |
| Neutral 100 | `#E4E4E7` | rgb(228, 228, 231) | hsl(240°, 6%, 90%) |
| Neutral 300 | `#A8A9B3` | rgb(168, 169, 179) | hsl(235°, 7%, 68%) |
| Neutral 500 | `#6C6D78` | rgb(108, 109, 120) | hsl(235°, 5%, 45%) |
| Neutral 700 | `#33343D` | rgb(51, 52, 61) | hsl(234°, 9%, 22%) |
| Neutral 900 | `#121218` | rgb(18, 18, 24) | hsl(240°, 14%, 8%) |

---

## 3. Ejemplos visuales

Se generaron mockups estáticos (SVG + PNG, sin código de producto, sin Figma) para las cinco pantallas solicitadas, en las tres opciones — 15 mockups de pantalla + 3 hojas de paleta, en `docs/design/assets/color-exploration/`:

- `option_[A|B|C]_home.svg/png`
- `option_[A|B|C]_search_results.svg/png`
- `option_[A|B|C]_medication_detail.svg/png`
- `option_[A|B|C]_dashboard.svg/png`
- `option_[A|B|C]_mobile_home.svg/png`
- `option_[A|B|C]_palette_sheet.svg/png` — hoja de referencia con los doce swatches y su HEX, para comparar las tres opciones lado a lado sin necesidad de abrir cada pantalla.

Son mockups esquemáticos (cajas, tipografía y color reales; sin contenido de producción, sin datos reales de farmacias) — suficientes para comparar temperatura, contraste y sensación entre las tres opciones, no para evaluar layout final. Observación transversal a las tres opciones, visible en los mockups de Home y Detalle: el par Success (verde) / Error (rojo) nunca debería aparecer sin un ícono o una palabra que lo acompañe ("Mejor precio", "Sin stock") — los mockups ya se construyeron siguiendo esa regla, no solo con color.

---

## 4. Análisis de accesibilidad

### Contraste (WCAG 2.1)

Calculado con la fórmula estándar de luminancia relativa, contra blanco `#FFFFFF` y contra un negro de interfaz `#0B0F0E` (no negro puro, consistente con la práctica de mercado 2026 de evitar negro absoluto en superficies de texto — ver `docs/design/VISUAL_BENCHMARK.md` §2). El mínimo AA es 4.5:1 para texto normal y 3:1 para texto grande/componentes gráficos.

| Color | Opción A | Opción B | Opción C |
|---|---|---|---|
| Brand vs. blanco | 8.03:1 ✅ | 7.60:1 ✅ | 13.97:1 ✅ |
| Accent vs. blanco | 4.01:1 ⚠️ (falla texto normal, pasa componentes/texto grande) | 3.69:1 ⚠️ | 6.06:1 ✅ |
| Success vs. blanco | 4.04:1 ⚠️ | 3.82:1 ⚠️ | 6.09:1 ✅ |
| Warning vs. blanco | 3.70:1 ⚠️ | 3.04:1 ⚠️ | 5.02:1 ✅ |
| Error vs. blanco | 5.89:1 ✅ | 4.91:1 ✅ | 7.68:1 ✅ |
| Information vs. blanco | 4.56:1 ✅ (límite) | 4.36:1 ⚠️ | 6.96:1 ✅ |

**Lectura de esta tabla:** ninguna de las tres opciones falla por un margen grave, pero A y especialmente B tienen entre tres y cuatro colores de Feedback que **no alcanzan 4.5:1 sobre blanco** — es decir, no deberían usarse como texto pequeño sobre fondo blanco (sí como ícono, borde, badge con relleno claro + texto oscuro, o componente gráfico ≥3:1). La Opción C es la única de las tres donde los seis colores superan holgadamente 4.5:1 sobre blanco — consecuencia directa de ser la variante más oscura/premium. Esto es evidencia objetiva, no una preferencia estética: si el comité prioriza accesibilidad por sobre calidez o fidelidad a la hipótesis original, la Opción C parte con ventaja medible.

### Color Blind Safe

Se simularon las tres deficiencias más comunes (protanopia, deuteranopia, tritanopia) sobre los cuatro colores de Feedback de cada opción, y se midió la distancia perceptual entre cada par.

**Hallazgo principal, consistente en las tres opciones:** el par **Success–Error** es, en las tres, el par con menor distancia bajo **deuteranopia** (la deficiencia más común) — 49.4 en A, 23.3 en B, 28.7 en C, en una escala donde valores por debajo de ~40 son un riesgo real de confusión. La Opción B es la más riesgosa de las tres en este criterio específico: su calidez (verde oliva + rojo terracota) los acerca más entre sí bajo deuteranopia que el verde-bosque/rojo-ladrillo de A o el verde-teal/rojo oscuro de C.

**Consecuencia obligatoria para cualquier opción que se apruebe:** ninguna de las tres puede depender del color solo para distinguir Success de Error — deben acompañarse siempre de ícono y/o texto (ya aplicado en los mockups de la sección 3). Esto no es una debilidad de una opción sobre otra: es un requisito de accesibilidad universal (WCAG 2.1, criterio 1.4.1, "el color no debe ser el único medio visual para transmitir información") que ya corresponde declararse en `COLOR_SYSTEM` cuando se implemente, independientemente de qué opción se apruebe.

### Uso en Dark Mode / Light Mode

Las tres opciones se diseñaron con una escala de Neutral de seis pasos (50 a 900) que funciona como base tanto para modo claro (superficies en Neutral 50/100, texto en Neutral 900) como para modo oscuro (superficies en Neutral 900/700, texto en Neutral 50/100) — verificado: el contraste de Neutral 900 contra blanco (16.6–18.7:1 según la opción) y de Neutral 50 contra el negro de interfaz (17.5–17.8:1) son ambos excelentes, lo que confirma que la escala de neutros es utilizable en ambos modos sin ajuste.

**Lo que NO está resuelto por esta investigación, y que sí necesitará resolver `COLOR_SYSTEM`:** los seis colores de Brand/Accent/Feedback de las tres opciones se calcularon para funcionar sobre fondo claro. Su contraste contra el negro de interfaz (`#0B0F0E`) es notablemente más bajo (entre 2.2:1 y 5.2:1 según el color y la opción) — insuficiente para texto en modo oscuro en varios casos. Esto es esperable: ningún sistema de color de mercado usa el mismo valor exacto de un color en modo claro y en modo oscuro (Linear, Notion y Stripe generan una variante más clara/desaturada del mismo hue para su modo oscuro). Ninguna de las tres opciones de este documento define todavía esa variante — se señala aquí como trabajo pendiente de `COLOR_SYSTEM`/Design Tokens, no como una debilidad de una opción sobre otra, porque ninguna de las tres la resuelve.

---

## 5. Consistencia con la arquitectura ya aprobada

| Documento | Consistencia encontrada |
|---|---|
| `docs/brand/BRAND_FOUNDATIONS.md` | Sin contradicción. Ninguna opción introduce un código de color asociado a las categorías excluidas en §12 (farmacia, marketplace, aseguradora, gobierno). |
| `docs/brand/VISUAL_IDENTITY.md` §4.3 | Sin contradicción directa, pero con un matiz: los atributos con respaldo documental directo son Cercana, Confiable, Científica, Profesional (+ Limpia por extensión). Las tres opciones cumplen "Científica/Profesional" con holgura; "Cercana" es el atributo que más varía entre opciones — A y C priorizan precisión sobre cercanía; B es la única que intenta resolver ambas a la vez. Ninguna opción decide, por sí sola, si "Cercana" queda suficientemente servida — es una pregunta para el comité, no algo que el color por sí solo resuelva. |
| `docs/brand/DESIGN_CONCEPT.md` §4.7 | Sin contradicción, con la salvedad ya desarrollada en la sección 1: Success=verde / Error=rojo se acerca a la restricción de "cruces verdes/rojas tradicionales" si se usan sin matiz. Las tres opciones ya desplazan esos tonos fuera del verde/rojo literal de cruz farmacéutica; aun así, el comité debe confirmar que el desplazamiento es suficiente — es una decisión de sensibilidad de marca, no solo de matemática de color. |
| **`docs/design/VISUAL_DIRECTION.md` §5, §9** | **Contradicción real encontrada, no generada por este documento.** §5 de `VISUAL_DIRECTION.md` incluye "**Moderna**" como parte de la personalidad visual ya declarada ("La identidad de ComparaFarma deberá percibirse como: Inteligente, Transparente, Moderna, Cercana, Serena"), sin matiz ni reserva. Sin embargo, `docs/brand/VISUAL_IDENTITY.md` §4.3 clasifica explícitamente "Moderna" como **"marcada como pendiente — sin evidencia documental que la respalde"**, y aclara que no debe asumirse como atributo oficial hasta ratificación del CEO/fundador. Es decir: dos documentos de la misma arquitectura de marca no coinciden sobre si "Moderna" ya es un atributo decidido o todavía una hipótesis. Este documento no resuelve esa contradicción — no le corresponde a un Design Director resolver una discrepancia entre documentos de gobernanza de marca — pero la señala explícitamente, como exige el objetivo 6 del encargo, para que el Product Manager la registre y decida cuál de los dos documentos prevalece antes de que `COLOR_SYSTEM` dé por sentado que "Moderna" ya es un atributo ratificado. Adicionalmente, §9 de `VISUAL_DIRECTION.md` declara explícitamente que Color System "no forma parte de este documento" — consistente con que este documento tampoco lo define. |
| `docs/design-system/DESIGN_TOKENS.md` §4.4 | Consistencia estructural fuerte: las familias de Feedback de la hipótesis (Success/Warning/Error/Information) se trazan directamente a la familia semántica ya catalogada **"Feedback"** ("respuesta visual a una acción o a un cambio de estado del sistema"). Ninguna opción de este documento resuelve, sin embargo, la familia **"Comparison"** (ya catalogada, "la familia donde más aplicaciones de Neutralidad convergen") — ninguna de las tres opciones define todavía cómo se distingue visualmente una farmacia de otra sin sugerir preferencia; queda fuera del alcance de este sprint (paleta de marca, no paleta por farmacia — esa ya existe, de forma independiente, en `web/src/constants/pharmacies.ts`, producto del sprint WEB-002, sin relación de gobernanza con este documento). |

---

## 6. Nota de implementación real (no gobierna nada, solo informa)

`web/src/app/globals.css`, en producción hoy, ya define `--accent: #0f7a3d` (verde, hue≈146°) y `--save: #b45309` (ámbar/marrón, hue≈26°) — colores shippeados sin pasar nunca por una decisión formal de `COLOR_SYSTEM` (que, como declara su propio documento, todavía no define ningún valor concreto). Ninguna de las tres opciones de este documento reutiliza esos valores exactos ni se le pidió hacerlo — se señala únicamente para que el Product Manager sepa que, cualquiera sea la dirección aprobada, `COLOR_SYSTEM` y los Design Tokens que sigan a este sprint también deberán decidir si esos dos valores de `web/` se migran, se conservan o se reconcilian con la paleta oficial nueva.

---

## Cierre

Este documento no elige ninguna opción. Presenta evidencia —estructural, de accesibilidad y de consistencia documental— sobre tres variantes de la dirección "Intelligence" ya aprobada por el comité, para que el Product Manager apruebe una única dirección cromática antes de iniciar `COLOR_SYSTEM` y los Design Tokens.

**No se modificó ningún documento, ningún archivo de código, CSS, Tailwind ni componente. No se implementó ningún Design Token. No se actualizó `COLOR_SYSTEM.md`.**

**Deteniéndose aquí. Esperando aprobación explícita antes de continuar.**
