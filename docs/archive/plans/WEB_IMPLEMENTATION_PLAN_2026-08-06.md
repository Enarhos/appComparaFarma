# WEB_IMPLEMENTATION_PLAN — Plataforma Web ComparaFarma

**Programa:** WEB-001 — ComparaFarma Web Platform
**Fase:** Fase 1 (Planificación exclusivamente — sin código)
**Fecha:** 2026-08-06
**Rol:** Lead Software Engineer / Software Factory
**Estado:** Draft — pendiente de aprobación explícita del Product Manager antes de iniciar cualquier implementación

> Este documento no autoriza ni inicia ningún trabajo de implementación. Es un plan. La Fase 2 del programa WEB-001 (implementación) requiere aprobación explícita separada.

---

## 1. Estado actual (Resumen ejecutivo)

`web/` es una aplicación Next.js 16 (App Router) en producción desde 2026-07-20, documentada oficialmente como **Fase 2a del plan de empresa** (`docs/product/COMPANY_STRATEGY.md` §5) y confirmada como "Plataforma Web pública" en `docs/product/PRODUCT_DEFINITION_v1.0.md` §9. Consume el mismo `api/` que `mobile/`, sin backend propio.

`CLAUDE.md` describe `web/` de forma muy incompleta frente al código real: solo documenta Home + `/buscar/[query]` + 2 componentes + 2 archivos de `lib/`. En la práctica, `web/` ya implementa **12 páginas reales**: búsqueda con SEO, ficha de medicamento con histórico de precios y alertas, sistema completo de cuenta de usuario (Supabase Auth), un panel de administración con 4 secciones, un comparador de "mi receta" (localStorage), y el flujo de suscripción premium vía Flow (RFC-005, Implementado).

**El hallazgo más importante de esta auditoría, y el que condiciona todo el plan**: la documentación de `docs/design-system/` (Foundations → Tokens → Componentes → Patrones → Screen Templates) es, en su totalidad, **arquitectura conceptual sin ninguna instanciación concreta**. No existe ningún token con nombre y valor, ningún componente con nombre, ningún patrón con nombre, ni ninguna plantilla de pantalla real — ni para mobile ni para web. `SCREEN_TEMPLATES.md` §4.9 lo declara explícitamente: la instanciación real en pantallas concretas "no corresponde a un nuevo documento de este dominio... corresponde a la documentación de producto (`docs/product/`) y a la implementación real en `mobile/` y `web/`" — y ese trabajo **no se ha hecho todavía en ningún documento**. Esto significa que, hoy, no existe una fuente documental de la que "bajar" un diseño concreto de pantalla, componente o token para `web/`. La documentación de producto (`SEARCH_EXPERIENCE.md`, `RESULTS_EXPERIENCE.md`, `MEDICATION_DETAIL_EXPERIENCE.md`, `PRICE_ALERTS_EXPERIENCE.md`, `USER_JOURNEYS.md`) sí tiene contenido real y aplicable — pero es deliberadamente agnóstica de interfaz, por lo que gobierna *principios* (Neutralidad, Transparencia, Comprensión y Comparabilidad, Confianza, Reducción de Incertidumbre) y no *implementaciones*.

En consecuencia: la web actual **cumple razonablemente bien los principios documentados de producto**, pero **no puede evaluarse contra ningún Design System concreto porque ese Design System concreto no existe todavía**. La clasificación de este plan refleja esa realidad — ninguna pantalla se clasifica como "Reemplazar" (no hay una alternativa documentada mejor a la que migrar), y buena parte del trabajo de "Refactorizar" es deuda técnica genuina (duplicación, inconsistencias de datos), no incumplimiento de un estándar visual que simplemente no está escrito.

---

## 2. Inventario

### 2.1 Páginas / rutas (12)

| # | Ruta | Finalidad | Estado |
|---|---|---|---|
| 1 | `/` | Home: hero + búsqueda + accesos rápidos + demo estática de comparación | Completa |
| 2 | `/buscar/[query]` | Resultados de búsqueda, SSR, metadata dinámica, JSON-LD | Completa |
| 3 | `/medicamento/[slug]` | Ficha de detalle: comparación por farmacia, histórico, alerta de precio, agregar a receta | Completa |
| 4 | `/cuenta` | Perfil, plan actual, upgrade a Premium (Flow) | Completa |
| 5 | `/cuenta/ingresar` | Login usuario final (Supabase, email/password) | Completa |
| 6 | `/cuenta/registro` | Registro usuario final (Supabase) | Completa |
| 7 | `/admin/login` | Login admin (Supabase + Google OAuth) | Completa |
| 8 | `/admin` | Dashboard de clicks por farmacia | Completa |
| 9 | `/admin/config` | Activar/desactivar farmacias, banner de donación | Completa |
| 10 | `/admin/feedback` | Listado y resolución de feedback de usuarios | Completa |
| 11 | `/admin/usuarios` | Gestión manual de plan free/premium | Completa |
| 12 | `/mi-receta` | Comparador de receta completa (localStorage) | Completa |

No navegables pero relevantes: `/auth/callback` (route handler de OAuth), `robots.ts`, `sitemap.ts`, `layout.tsx`, `error.tsx`/`not-found.tsx`/`loading.tsx` globales, `proxy.ts` (middleware de auth).

### 2.2 Componentes (12)

`SearchBox`, `MedicationCard`, `PharmacyPriceCard`, `RecipeLinkBadge`, `AddToRecipeButton`, `PriceAlertForm`, `PriceHistoryChart`, `RecipeComparisonView`, `admin/AdminNav`, `admin/SignOutButton`, `cuenta/CuentaSignOutButton`, `cuenta/UpgradeButton`.

### 2.3 Dependencias transversales

- `constants/pharmacies.ts` — copia local independiente de `mobile/` (correcto, decisión documentada por la restricción de Prueba Cerrada de Google Play).
- Tailwind v4 vía `@theme inline` en `globals.css` (no hay `tailwind.config.js`).
- Supabase Auth (usuarios finales + admin, con lista blanca `ADMIN_ALLOWED_EMAILS`).
- `api/` como única fuente de datos — sin base de datos propia en `web/`.

---

## 3. Clasificación

**Regla aplicada**: una pantalla se clasifica **Reemplazar** solo si existe una alternativa documentada superior a la que migrar. Como se explica en la sección 1, esa alternativa concreta no existe hoy para ninguna pantalla — por lo tanto, **ninguna pantalla se clasifica como Reemplazar** en este ciclo. Esto se revisará si, en un sprint de documentación futuro, se instancian Screen Templates/Componentes concretos que sí definan una alternativa superior.

### Conservar (6 de 12 — 50%)

| Pantalla | Justificación |
|---|---|
| `/buscar/[query]` | Implementación más alineada con `RESULTS_EXPERIENCE.md` (SSR, metadata dinámica, loading/error boundaries dedicados, JSON-LD). Sin deuda técnica evidente. |
| `/cuenta` | Cumple `RFC-005` (Flow) al pie de la letra, cita la fuente explícitamente en el código. Sin deuda evidente. |
| `/cuenta/registro` | Buena máquina de estados (`idle\|submitting\|check-email\|error`), sin deuda evidente. |
| `/admin` (dashboard) | Funcional y correcta; tiene una limitación de escalabilidad ya reconocida por el propio código (tabla en memoria, límite 5000 filas) — vigilar, no bloquea hoy. |
| `/admin/config` | Reemplaza correctamente variables de entorno por configuración persistida en Supabase; sin deuda evidente. |
| `/mi-receta` | Única pantalla con trazabilidad documental explícita en el propio código (`PROMPT_CLAUDE_SPRINT_E_RECETA_COMPLETA.md`, confirmado existente). Configuración de `robots: {index:false}` correcta para contenido basado en localStorage. |

### Refactorizar (6 de 12 — 50%)

| Pantalla / componente | Justificación |
|---|---|
| `/` (Home) | Funcionalmente correcta, pero: (a) usa una paleta de colores por farmacia (`--color-cruz-verde`, etc. en `globals.css`) que **diverge** de la paleta usada en el resto del sitio (`constants/pharmacies.ts`, consumida por `MedicationCard`, `PharmacyPriceCard`, `/admin`) — 6 de 9 farmacias tienen colores distintos entre ambas fuentes; (b) el bloque `DEMO_PRICES` es data hardcodeada presentada visualmente igual que datos reales, lo que puede entrar en tensión con el principio de Transparencia de `RESULTS_EXPERIENCE.md` si un usuario no distingue que es ilustrativo. |
| `/medicamento/[slug]` | La pantalla más sofisticada y mejor alineada con `MEDICATION_DETAIL_EXPERIENCE.md`/`PRICE_ALERTS_EXPERIENCE.md`, pero: 296 líneas en un solo archivo, con un bug de manejo de metadata ya reintroducido una vez (documentado en un comentario propio del código) — señal de fragilidad que amerita descomposición en componentes más chicos y testeo adicional antes de seguir agregando funcionalidad. |
| `/cuenta/ingresar` + `/admin/login` | Mismo layout y patrón de formulario de login duplicados entre ambos archivos (incluida una función `errorMessage()` reimplementada dos veces con lógica ligeramente distinta). Candidatas a unificarse en un solo componente de formulario con una prop que controle la variante (mostrar/ocultar Google OAuth). |
| `admin/SignOutButton` ↔ `cuenta/CuentaSignOutButton` | Cuerpo casi idéntico, solo cambia la ruta de redirect. Candidato directo a unificar con una prop `redirectTo`. |
| `/admin/feedback` + `/admin/usuarios` | Mismo patrón estructural (Server Action `toggleXAction` + `revalidatePath`) repetido casi idéntico en ambas páginas — duplicación de patrón, no de código literal. Bajo impacto, pero vale la pena extraerlo si se agrega una tercera sección admin en el futuro. |

### Reemplazar (0 de 12 — 0%)

Ninguna pantalla cumple el criterio (justificación técnica o funcional sólida para reconstruir desde cero). Ver nota al inicio de esta sección.

---

## 4. Trazabilidad (Fase 2)

Para cada pantalla clasificada arriba, se documenta la trazabilidad exigida. **Cuando la trazabilidad no existe, se registra explícitamente como ausencia — no se propone contenido que no esté ya documentado.**

### Hallazgo transversal (aplica a las 12 pantallas por igual)

- **Screen Template asociado**: sin trazabilidad posible hoy. `SCREEN_TEMPLATES.md` define 5 familias puramente conceptuales (Exploración, Comparación, Detalle, Configuración, Seguimiento) sin nombrar ninguna plantilla real ni instanciarla en ninguna pantalla de `mobile/` o `web/` (`SCREEN_TEMPLATES.md` §4.4, §4.9, §7, citas textuales verificadas). Se puede indicar, como referencia informal y no vinculante, con qué familia conceptual se relaciona cada pantalla (ver tabla abajo) — pero esto no constituye una plantilla oficial.
- **Pattern asociado**: mismo caso — `PATTERNS.md` define 6 familias conceptuales (Descubrimiento, Comparación, Decisión, Confirmación, Seguimiento, Configuración) sin patrones nombrados ni instanciados.
- **Componentes reutilizados (Design System)**: sin trazabilidad posible — `COMPONENT_LIBRARY.md` define 8 familias conceptuales (Entrada, Navegación, Información, Comparación, Acción, Feedback, Contenedores, Identidad) pero **ningún componente concreto con nombre**. Los 12 componentes reales de `web/src/components/` no citan ni implementan ningún componente de `COMPONENT_LIBRARY.md` porque no hay ninguno que citar.
- **Foundation Tokens / Semantic Tokens**: sin trazabilidad posible — `DESIGN_TOKENS.md` define 6 familias de Foundation Tokens y 10 de Semantic Tokens, todas sin nombre ni valor concreto (§3 de cada documento del dominio lo declara fuera de alcance explícitamente). Las variables CSS reales de `web/src/app/globals.css` (`--color-paper`, `--color-ink`, `--color-accent`, `--color-save`, etc.) no pueden verificarse contra ningún nombre oficial porque ningún nombre oficial existe todavía.

### Tabla por pantalla

| Pantalla | Documento fuente (Product Experience) | Sección utilizada | Familia conceptual de Screen Template (informal) | Familia conceptual de Pattern (informal) | Componentes DS / Tokens |
|---|---|---|---|---|---|
| `/` (Home) | Ninguno dedicado — parcialmente `SEARCH_EXPERIENCE.md` (punto de entrada a la búsqueda) | `SEARCH_EXPERIENCE.md` §4 (principios generales de inicio de búsqueda) | Exploración | Descubrimiento | Sin trazabilidad (ver hallazgo transversal) |
| `/buscar/[query]` | `SEARCH_EXPERIENCE.md` + `RESULTS_EXPERIENCE.md` | `RESULTS_EXPERIENCE.md` §4.4 (Comprensión y Comparabilidad), §4.6 (Estados) | Comparación | Descubrimiento + Comparación | Sin trazabilidad |
| `/medicamento/[slug]` | `MEDICATION_DETAIL_EXPERIENCE.md` + `PRICE_ALERTS_EXPERIENCE.md` | `MEDICATION_DETAIL_EXPERIENCE.md` §4.4 (Equivalencia y Comparabilidad), §4.6 (Estados); `PRICE_ALERTS_EXPERIENCE.md` §4.2-4.4 | Detalle | Decisión + Confirmación + Seguimiento | Sin trazabilidad |
| `/cuenta` | **Sin trazabilidad** — ningún documento de PHASE 2 cubre gestión de cuenta/suscripción; `RFC-005` cubre el mecanismo técnico, no la experiencia | — | Sin trazabilidad | Sin trazabilidad | Sin trazabilidad |
| `/cuenta/ingresar`, `/cuenta/registro` | **Sin trazabilidad** — ningún documento de producto cubre autenticación | — | Sin trazabilidad | Sin trazabilidad | Sin trazabilidad |
| `/admin/login`, `/admin`, `/admin/config`, `/admin/feedback`, `/admin/usuarios` | **Sin trazabilidad** — el panel admin no tiene experiencia de producto documentada en `docs/product/`, `docs/brand/` ni `docs/design/`. Solo existe en `docs/product/DECISION_LOG.md` (registro histórico) y `COMPANY_STRATEGY.md` (roadmap) | `COMPANY_STRATEGY.md` §4 (mención de rol, no de experiencia) | Sin trazabilidad | Sin trazabilidad | Sin trazabilidad |
| `/mi-receta` | **Sin trazabilidad formal de PHASE 2** — trazabilidad informal vía `docs/prompt/claude/PROMPT_CLAUDE_SPRINT_E_RECETA_COMPLETA.md` (no es un documento de gobierno oficial) | — | Seguimiento (informal) | Seguimiento (informal) | Sin trazabilidad |

### Reglas de Brand aplicables

- **Confirmadas y concretas**: `LOGO_SYSTEM.md` §4.7 — favicons deben usar exclusivamente la variante "Solo isotipo", nunca el logotipo completo reducido. Aplica a `layout.tsx` (metadata del sitio) — pendiente de verificar cumplimiento real (no se auditó el archivo de favicon en este sprint, ya que es un asset binario, no código).
- **Confirmadas pero no vinculantes ("extensión operativa razonable, sin cita de marca específica")**: legibilidad y rendimiento de carga en web (`TYPOGRAPHY_SYSTEM.md` §4.3) — la tipografía real usada en `web/` (Fraunces/Figtree, `layout.tsx`) no tiene una cita de marca que la exija específicamente; es una decisión de implementación razonable, no una regla documentada.
- **Sin trazabilidad**: ninguna regla de marca cubre específicamente SEO, metadata estructurada (JSON-LD), o el uso de `--color-{pharmacy}` en la interfaz — `COLOR_SYSTEM.md`/`ICONOGRAPHY_SYSTEM.md` no mencionan estos casos.

---

## 5. Orden de implementación (para la Fase 2, una vez aprobada)

Este orden es una propuesta a validar por el Product Manager — no autoriza el inicio de ningún trabajo.

**Fase A — Higiene técnica de bajo riesgo (sin depender de ninguna decisión de producto pendiente)**
1. Unificar `admin/SignOutButton` + `cuenta/CuentaSignOutButton` en un solo componente.
2. Unificar el formulario de login de `/cuenta/ingresar` + `/admin/login`.
3. Extraer el patrón `API_URL` duplicado (7 ocurrencias literales) a un solo `lib/apiUrl.ts`.
4. Resolver la divergencia de colores por farmacia entre `globals.css` y `constants/pharmacies.ts` — **requiere decisión del PM sobre cuál paleta es la correcta** (ver Decisiones Pendientes).

**Fase B — Descomposición de `/medicamento/[slug]`**
5. Dividir la página en componentes más pequeños, con foco en aislar la lógica que ya causó el bug reincidente de metadata.
6. Agregar cobertura de tests equivalente a la que ya existe parcialmente (`page.test.tsx`) para los sub-componentes extraídos.

**Fase C — Decisión sobre `DEMO_PRICES` en Home**
7. Decidir con el PM si el bloque de demo debe marcarse visualmente como ilustrativo, reemplazarse por datos reales cacheados, o eliminarse — no se toca hasta esa decisión.

**Bloqueado hasta un sprint de documentación dedicado (fuera del alcance de WEB-001 Fase 2)**
- Cualquier trabajo que pretenda "implementar un Screen Template/Componente/Token oficial para web" queda bloqueado hasta que exista esa instanciación concreta en `docs/product/` o `docs/design-system/` — hoy no existe (ver sección 1 y 4).

---

## 6. Riesgos

**Técnicos**
- Duplicación de código (login, sign-out, patrón de Server Actions en admin) — bajo riesgo individual, pero cada duplicado adicional aumenta el costo de mantenimiento.
- `/medicamento/[slug]` ya tuvo un bug reincidente — señal de que su tamaño actual dificulta razonar sobre cambios futuros sin reintroducir errores.
- Tabla de clicks de `/admin` en memoria con límite de 5000 filas — no es un riesgo hoy, pero el propio código ya advierte que necesitará una vista agregada en Postgres si el volumen crece.
- Sin tests para la mayoría de páginas (11 de 12) ni para middleware de auth (`proxy.ts`) ni para `auth/callback/route.ts` — cualquier refactor de Fase A/B tiene riesgo de regresión sin red de seguridad automatizada.

**Funcionales**
- Divergencia de colores por farmacia entre Home y el resto del sitio — riesgo de inconsistencia de marca visible para el usuario (una farmacia se ve con un color en Home y con otro en resultados/detalle).
- `DEMO_PRICES` hardcodeado en Home podría confundirse con datos reales — riesgo de percepción de falta de transparencia, aunque no hay evidencia de que esto haya generado quejas reales.
- RFC-002 existe con el mismo número en dos ubicaciones distintas del repo (`docs/architecture/` y `docs/engineering/rfc/`) — riesgo de citar la referencia incorrecta al planificar trabajo futuro sobre "RFC-002".

**Arquitectónicos**
- La documentación de Design System no tiene ninguna instanciación concreta para ninguna plataforma — cualquier plan de "alinear web con el Design System" es, estrictamente, prematuro hasta que ese trabajo de instanciación se haga (en `docs/product/` o `docs/design-system/`, no en este programa).
- Asimetría de manejo de error entre `mobile/` (falla explícita si falta `EXPO_PUBLIC_API_URL`) y `web/` (cae silenciosamente a una URL de producción hardcodeada si falta `API_URL`) — no es un bug, pero es una decisión de diseño no explícitamente tomada de forma consciente y documentada para `web/`.

---

## 7. Deuda técnica detectada

1. Paleta de colores por farmacia duplicada y divergente (`globals.css` vs `constants/pharmacies.ts`), 6 de 9 farmacias con valores distintos.
2. Patrón `API_URL` con fallback hardcodeado duplicado literalmente en 7 archivos de `lib/`.
3. Componentes de sign-out duplicados (`admin/SignOutButton`, `cuenta/CuentaSignOutButton`).
4. Formularios de login duplicados (`/cuenta/ingresar`, `/admin/login`).
5. Patrón de Server Action `toggleXAction` + `revalidatePath` repetido en `/admin/feedback` y `/admin/usuarios`.
6. `/medicamento/[slug]` concentra 296 líneas y múltiples responsabilidades en un solo archivo.
7. Ausencia de tests para 11 de 12 páginas, `proxy.ts`, `auth/callback/route.ts`, y varios módulos de `lib/` (`appConfig.ts`, `adminAllowlist.ts`, `clickStats.ts`, `feedbackAdmin.ts`, `site.ts`).
8. `CLAUDE.md` está desactualizado respecto al estado real de `web/` — documenta solo 2 páginas y 2 componentes de las 12 páginas y 12 componentes reales.

---

## 8. Decisiones pendientes (requieren validación del Product Manager)

1. **¿Cuál paleta de colores por farmacia es la oficial?** — la de `globals.css` (usada en Home) o la de `constants/pharmacies.ts` (usada en el resto del sitio). Ninguna está documentada como "la correcta" en `docs/brand/COLOR_SYSTEM.md` (que no define valores concretos). Sin esta decisión, la Fase A del orden de implementación (sección 5) no puede completarse.
2. **¿Qué hacer con `DEMO_PRICES` en Home?** — marcar como ilustrativo, alimentar con datos reales, o eliminar.
3. **¿Se abre un sprint de documentación dedicado para instanciar Screen Templates/Componentes/Tokens concretos** (posiblemente uno para mobile y web en conjunto, dado que ambos están en la misma situación), antes de que WEB-001 Fase 2 pueda decir honestamente que "implementa el Design System"? Sin esta decisión, cualquier trabajo de Fase 2 que toque visual/estructura de pantalla se apoyará únicamente en los principios de `docs/product/` (que sí son aplicables), no en un Design System instanciado.
4. **¿Se documenta formalmente la experiencia de `/cuenta`, del panel `/admin`, y de `/mi-receta`** en `docs/product/` (como PHASE 3 de Product Experience, análoga a la ya cerrada PHASE 2), o se acepta que estas superficies seguirán gobernadas solo por RFCs técnicos y el `DECISION_LOG.md`?
5. **¿Se resuelve la colisión de numeración `RFC-002`** (dos documentos distintos con el mismo número) antes de que este plan cite RFCs en comunicaciones externas al equipo?
6. **¿Se acepta la asimetría de manejo de error de `API_URL` entre mobile y web**, o se decide que web también debe fallar explícitamente si la variable no está configurada?

---

## Criterios de aceptación para comenzar la implementación (Fase 2 de WEB-001)

La implementación **no debe comenzar** hasta que:
- [ ] El Product Manager apruebe explícitamente este documento.
- [ ] Se resuelvan las Decisiones Pendientes 1 y 2 (bloquean directamente el trabajo de Fase A/C del orden de implementación).
- [ ] Se tome una posición explícita sobre la Decisión Pendiente 3 — aunque la respuesta sea "proceder solo con los principios de `docs/product/`, sin esperar un Design System instanciado", debe quedar dicho por el PM, no asumido por el equipo de ingeniería.
- [ ] Se confirme el alcance real de la Fase 2 del programa (¿incluye las Fases A, B y C de la sección 5 completas, o un subconjunto?).

